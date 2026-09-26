import { DURATION_BUCKETS, SORTS, TRIP_TYPES, type DurationBucket, type SortKey, type TripFilters } from "./trips";
import type { TripType } from "@/generated/prisma/enums";

type Raw = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

function parseDate(v?: string) {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const d = new Date(`${v}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function parseAmount(v?: string) {
  if (!v) return undefined;
  const n = Number(v.replace(/[^\d]/g, ""));
  return Number.isFinite(n) && v.replace(/[^\d]/g, "") !== "" ? n : undefined;
}

/** Parses listing query parameters, ignoring anything malformed. */
export function parseTripFilters(raw: Raw) {
  const filters: TripFilters = {};
  const q = one(raw.q);
  if (q) filters.q = q.slice(0, 80);
  const destination = one(raw.destination);
  if (destination) filters.destination = destination.slice(0, 80);

  // "month" (YYYY-MM) from the home page search expands to a date range.
  const month = one(raw.month);
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    filters.from = new Date(Date.UTC(y, m - 1, 1));
    filters.to = new Date(Date.UTC(y, m, 0));
  }
  filters.from = parseDate(one(raw.from)) ?? filters.from;
  filters.to = parseDate(one(raw.to)) ?? filters.to;

  filters.minPrice = parseAmount(one(raw.minPrice));
  filters.maxPrice = parseAmount(one(raw.maxPrice));

  const duration = one(raw.duration);
  if (duration && duration in DURATION_BUCKETS) filters.duration = duration as DurationBucket;
  const type = one(raw.type);
  if (type && (TRIP_TYPES as string[]).includes(type)) filters.type = type as TripType;
  const sort = one(raw.sort);
  if (sort && sort in SORTS) filters.sort = sort as SortKey;

  const page = Math.max(1, Math.min(100, Number(one(raw.page)) || 1));
  return { filters, page };
}

export function toQueryString(params: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : "";
}
