import type { Departure } from "@/generated/prisma/client";
import { todayUtc } from "./format";

export type DepartureLike = Pick<
  Departure,
  "startDate" | "status" | "capacity" | "seatsReserved" | "price" | "earlyBirdPrice" | "earlyBirdEndsAt"
>;

export function seatsAvailable(d: Pick<Departure, "capacity" | "seatsReserved">) {
  return Math.max(d.capacity - d.seatsReserved, 0);
}

export function isEarlyBirdActive(d: Pick<Departure, "earlyBirdPrice" | "earlyBirdEndsAt">, today = todayUtc()) {
  return d.earlyBirdPrice != null && d.earlyBirdEndsAt != null && d.earlyBirdEndsAt >= today;
}

/** The per-person price a customer would be quoted today. */
export function effectivePrice(d: DepartureLike, today = todayUtc()) {
  return isEarlyBirdActive(d, today) ? d.earlyBirdPrice! : d.price;
}

export type Availability = "available" | "limited" | "sold-out" | "closed" | "cancelled" | "past";

export function availability(d: DepartureLike, today = todayUtc()): Availability {
  if (d.startDate <= today) return "past";
  if (d.status === "CANCELLED") return "cancelled";
  if (d.status === "CLOSED") return "closed";
  const left = seatsAvailable(d);
  if (left === 0) return "sold-out";
  if (left <= 4) return "limited";
  return "available";
}

export function isBookable(d: DepartureLike, today = todayUtc()) {
  const a = availability(d, today);
  return a === "available" || a === "limited";
}

export const availabilityLabels: Record<Availability, string> = {
  available: "Available",
  limited: "Few seats left",
  "sold-out": "Sold out",
  closed: "Closed",
  cancelled: "Cancelled",
  past: "Departed",
};

/** Prisma filter for departures a customer may book. */
export function bookableDepartureWhere(today = todayUtc()) {
  return { status: "OPEN" as const, startDate: { gt: today } };
}
