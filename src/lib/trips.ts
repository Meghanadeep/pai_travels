import "server-only";
import { prisma } from "./db";
import { todayUtc } from "./format";
import { bookableDepartureWhere, effectivePrice, seatsAvailable } from "./departures";
import type { Prisma } from "@/generated/prisma/client";
import type { TripType } from "@/generated/prisma/enums";

export const TRIP_TYPES: TripType[] = ["HERITAGE", "NATURE", "ADVENTURE", "WELLNESS", "COASTAL", "CULINARY"];

export const DURATION_BUCKETS = {
  short: { label: "Up to 5 days", min: 1, max: 5 },
  week: { label: "6 – 9 days", min: 6, max: 9 },
  long: { label: "10 – 14 days", min: 10, max: 14 },
  extended: { label: "15+ days", min: 15, max: 999 },
} as const;
export type DurationBucket = keyof typeof DURATION_BUCKETS;

export const SORTS = {
  recommended: "Recommended",
  "departure-asc": "Soonest departure",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "duration-asc": "Duration: shortest",
  "duration-desc": "Duration: longest",
} as const;
export type SortKey = keyof typeof SORTS;

export type TripFilters = {
  q?: string;
  destination?: string;
  from?: Date;
  to?: Date;
  minPrice?: number;
  maxPrice?: number;
  duration?: DurationBucket;
  type?: TripType;
  sort?: SortKey;
};

/** Published trips whose package offer (if any) hasn't ended. */
export function publicTripWhere(today = todayUtc()): Prisma.TripWhereInput {
  return { status: "PUBLISHED", OR: [{ validUntil: null }, { validUntil: { gte: today } }] };
}

const cardInclude = (today: Date) =>
  ({
    departures: {
      where: bookableDepartureWhere(today),
      orderBy: { startDate: "asc" },
    },
  }) satisfies Prisma.TripInclude;

type TripWithDepartures = Prisma.TripGetPayload<{ include: ReturnType<typeof cardInclude> }>;

function toCard(trip: TripWithDepartures, today: Date, departures = trip.departures) {
  const withSeats = departures.filter((d) => seatsAvailable(d) > 0);
  const priced = (withSeats.length ? withSeats : departures).map((d) => effectivePrice(d, today));
  return {
    id: trip.id,
    slug: trip.slug,
    title: trip.title,
    destination: trip.destination,
    country: trip.country,
    tripType: trip.tripType,
    summary: trip.summary,
    durationDays: trip.durationDays,
    groupSizeMin: trip.groupSizeMin,
    groupSizeMax: trip.groupSizeMax,
    coverImageUrl: trip.coverImageUrl,
    coverImageAlt: trip.coverImageAlt,
    inclusions: trip.inclusions,
    highlights: trip.highlights,
    isSample: trip.isSample,
    featured: trip.featured,
    // Fixed departures set the price; package trips without open dates fall back to their listed price.
    fromPrice: priced.length ? Math.min(...priced) : trip.priceFrom,
    validUntil: trip.validUntil,
    hasEarlyBird: departures.some((d) => effectivePrice(d, today) < d.price),
    upcoming: departures.slice(0, 3).map((d) => ({
      id: d.id,
      startDate: d.startDate,
      endDate: d.endDate,
      seatsLeft: seatsAvailable(d),
    })),
    departureCount: departures.length,
    nextDeparture: withSeats[0]?.startDate ?? null,
  };
}
export type TripCardData = ReturnType<typeof toCard>;

export async function searchTrips(filters: TripFilters) {
  const today = todayUtc();
  const where: Prisma.TripWhereInput = { AND: [publicTripWhere(today)] };
  if (filters.type) where.tripType = filters.type;
  if (filters.destination) where.destination = { equals: filters.destination, mode: "insensitive" };
  if (filters.duration) {
    const b = DURATION_BUCKETS[filters.duration];
    where.durationDays = { gte: b.min, lte: b.max };
  }
  if (filters.q) {
    const q = filters.q;
    (where.AND as Prisma.TripWhereInput[]).push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { destination: { contains: q, mode: "insensitive" } },
        { country: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const trips = await prisma.trip.findMany({ where, include: cardInclude(today) });
  const dateOrPriceFilter =
    filters.from != null || filters.to != null || filters.minPrice != null || filters.maxPrice != null;

  const cards = trips.flatMap((trip) => {
    const matching = trip.departures.filter((d) => {
      const price = effectivePrice(d, today);
      if (filters.from && d.startDate < filters.from) return false;
      if (filters.to && d.startDate > filters.to) return false;
      if (filters.minPrice != null && price < filters.minPrice) return false;
      if (filters.maxPrice != null && price > filters.maxPrice) return false;
      return true;
    });
    if (dateOrPriceFilter && matching.length === 0) {
      // A package without fixed departures can be taken any day until its offer ends.
      if (trip.departures.length || trip.priceFrom == null) return [];
      const p = trip.priceFrom;
      if (filters.to && filters.to < today) return [];
      if (filters.from && trip.validUntil && filters.from > trip.validUntil) return [];
      if ((filters.minPrice != null && p < filters.minPrice) || (filters.maxPrice != null && p > filters.maxPrice)) return [];
    }
    return [toCard(trip, today, dateOrPriceFilter && matching.length ? matching : trip.departures)];
  });

  const far = Number.MAX_SAFE_INTEGER;
  const sorters: Record<SortKey, (a: TripCardData, b: TripCardData) => number> = {
    recommended: (a, b) =>
      Number(b.featured) - Number(a.featured) ||
      (a.nextDeparture?.getTime() ?? far) - (b.nextDeparture?.getTime() ?? far),
    "departure-asc": (a, b) => (a.nextDeparture?.getTime() ?? far) - (b.nextDeparture?.getTime() ?? far),
    "price-asc": (a, b) => (a.fromPrice ?? far) - (b.fromPrice ?? far),
    "price-desc": (a, b) => (b.fromPrice ?? -1) - (a.fromPrice ?? -1),
    "duration-asc": (a, b) => a.durationDays - b.durationDays,
    "duration-desc": (a, b) => b.durationDays - a.durationDays,
  };
  cards.sort(sorters[filters.sort ?? "recommended"]);
  return cards;
}

export async function getTripCardsBySlugs(slugs: string[]) {
  const today = todayUtc();
  const trips = await prisma.trip.findMany({
    where: { ...publicTripWhere(today), slug: { in: slugs } },
    include: cardInclude(today),
  });
  return slugs.flatMap((s) => {
    const t = trips.find((t) => t.slug === s);
    return t ? [toCard(t, today)] : [];
  });
}

export async function getFeaturedTrips(limit = 3) {
  const today = todayUtc();
  const trips = await prisma.trip.findMany({
    where: publicTripWhere(today),
    include: cardInclude(today),
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });
  return trips.map((t) => toCard(t, today));
}

export async function getDestinations() {
  const rows = await prisma.trip.groupBy({
    by: ["destination", "country"],
    where: publicTripWhere(),
    orderBy: { destination: "asc" },
  });
  return rows.map((r) => ({ destination: r.destination, country: r.country }));
}

export async function getTripTypeCounts() {
  const rows = await prisma.trip.groupBy({
    by: ["tripType"],
    where: publicTripWhere(),
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((r) => [r.tripType, r._count._all])) as Partial<Record<TripType, number>>;
}

export async function getUpcomingDepartures(limit = 6) {
  const today = todayUtc();
  const departures = await prisma.departure.findMany({
    where: { ...bookableDepartureWhere(today), trip: publicTripWhere(today) },
    include: { trip: { select: { slug: true, title: true, destination: true, country: true, durationDays: true, isSample: true } } },
    orderBy: { startDate: "asc" },
    take: limit * 3,
  });
  return departures.filter((d) => seatsAvailable(d) > 0).slice(0, limit);
}

export async function getPublishedTrip(slug: string, opts: { includeDrafts?: boolean } = {}) {
  const today = todayUtc();
  return prisma.trip.findFirst({
    where: opts.includeDrafts ? { slug } : { ...publicTripWhere(today), slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      itinerary: { orderBy: { dayNumber: "asc" } },
      faqs: { orderBy: { sortOrder: "asc" } },
      departures: { where: { startDate: { gt: today }, status: { not: "CANCELLED" } }, orderBy: { startDate: "asc" } },
      reviews: { where: { published: true }, orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
}

export async function getPublishedReviews(limit = 3) {
  return prisma.review.findMany({
    where: { published: true },
    include: { trip: { select: { title: true, slug: true, status: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getPriceBounds() {
  const today = todayUtc();
  const agg = await prisma.departure.aggregate({
    where: { ...bookableDepartureWhere(today), trip: publicTripWhere(today) },
    _min: { price: true, earlyBirdPrice: true },
    _max: { price: true },
  });
  return { min: Math.min(agg._min.price ?? 0, agg._min.earlyBirdPrice ?? Infinity), max: agg._max.price ?? 0 };
}
