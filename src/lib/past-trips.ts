import "server-only";
import { prisma } from "./db";
import { formatDate, formatDateRange, todayUtc } from "./format";

// ─── Duplicate detection ───────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "a", "and", "the", "of", "to", "in", "tour", "tours", "trip", "trips", "package", "packages", "holiday", "special",
  "days", "day", "nights", "night", "group", "star", "holy", "with", "ex",
]);

/** Lowercase word set without filler words or duration codes like "4n5d". */
export function nameTokens(...parts: (string | null | undefined)[]) {
  return new Set(
    parts
      .join(" ")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOPWORDS.has(w) && !/^\d+n\d+d$|^\d+$/.test(w)),
  );
}

function overlap(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / Math.min(a.size, b.size);
}

const DAY = 86_400_000;

function datesClose(aStart: Date, aEnd: Date | null, bStart: Date, bEnd: Date | null) {
  const aE = (aEnd ?? aStart).getTime() + 3 * DAY;
  const bE = (bEnd ?? bStart).getTime() + 3 * DAY;
  return aStart.getTime() - 3 * DAY <= bE && bStart.getTime() - 3 * DAY <= aE;
}

export type DuplicateCandidate = {
  id: string;
  title: string;
  destination: string;
  dateLabel: string | null;
  status: string;
  reasons: string[];
};

/**
 * Past trips that are probably the same trip: a similar destination/name with
 * matching or unknown dates, or the same dates with any destination overlap.
 */
export async function findLikelyDuplicates(
  input: { title: string; destination: string; startDate: Date | null; endDate: Date | null },
  excludeId?: string,
): Promise<DuplicateCandidate[]> {
  const trips = await prisma.pastTrip.findMany({
    where: excludeId ? { id: { not: excludeId } } : undefined,
    select: { id: true, title: true, destination: true, startDate: true, endDate: true, dateText: true, status: true },
  });
  const dest = nameTokens(input.destination);
  const name = nameTokens(input.title, input.destination);

  return trips.flatMap((t) => {
    const destScore = overlap(dest, nameTokens(t.destination));
    const nameScore = overlap(name, nameTokens(t.title, t.destination));
    const bothDated = input.startDate != null && t.startDate != null;
    const sameDates = bothDated && datesClose(input.startDate!, input.endDate, t.startDate!, t.endDate);

    const reasons: string[] = [];
    if (destScore >= 0.5) reasons.push("Same or similar destination");
    else if (nameScore >= 0.6) reasons.push("Similar trip name");
    if (sameDates) reasons.push("Overlapping dates");
    else if (!bothDated && reasons.length) reasons.push("Dates can't be compared (one or both are missing)");

    const likely = (reasons.length > 0 && (destScore >= 0.5 || nameScore >= 0.6) && (sameDates || !bothDated)) || (sameDates && destScore > 0);
    return likely ? [{ id: t.id, title: t.title, destination: t.destination, dateLabel: pastTripDateLabel(t), status: t.status, reasons }] : [];
  });
}

/** Earlier uploads of the exact same file. */
export function findSameImageImports(sha256: string, excludeId: string) {
  return prisma.tripImport.findMany({
    where: { sha256, id: { not: excludeId }, status: { not: "DISCARDED" } },
    select: { id: true, originalName: true, createdAt: true, status: true, pastTrip: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Display ───────────────────────────────────────────────────────────────────

export function pastTripDateLabel(t: { startDate: Date | null; endDate: Date | null; dateText: string | null }) {
  if (t.startDate && t.endDate && t.endDate > t.startDate) return formatDateRange(t.startDate, t.endDate);
  if (t.startDate) return formatDate(t.startDate);
  return t.dateText || null;
}

/** True when the trip's known dates are today or later, so it isn't a past trip yet. */
export function hasFutureDates(t: { startDate: Date | null; endDate: Date | null }, today = todayUtc()) {
  const last = t.endDate ?? t.startDate;
  return last != null && last >= today;
}

export const photoUrl = (id: string) => `/photos/${id}`;
export const adminPhotoUrl = (id: string) => `/api/admin/files/photos/${id}`;
export const adminImportUrl = (id: string) => `/api/admin/files/imports/${id}`;

// ─── Public queries ────────────────────────────────────────────────────────────

const publicPhotos = { where: { approvedAt: { not: null } }, orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }] };

export function getPublishedPastTrips() {
  return prisma.pastTrip.findMany({
    where: { status: "PUBLISHED" },
    include: { photos: { ...publicPhotos, take: 1 } },
    orderBy: [{ startDate: { sort: "desc", nulls: "last" } }, { publishedAt: "desc" }],
  });
}

export function getPublishedPastTrip(slug: string) {
  return prisma.pastTrip.findFirst({ where: { slug, status: "PUBLISHED" }, include: { photos: publicPhotos } });
}
