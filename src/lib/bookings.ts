import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "./db";
import { todayUtc } from "./format";
import { effectivePrice, seatsAvailable } from "./departures";
import type { InquiryStatus } from "@/generated/prisma/enums";

/** Statuses whose travellers count against a departure's seats. */
export const SEAT_HOLDING_STATUSES: InquiryStatus[] = ["NEW", "CONTACTED", "CONFIRMED"];

export class BookingError extends Error {}

function newReference() {
  // Unambiguous characters only (no 0/O, 1/I).
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let out = "PT-";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

type NewInquiry = {
  departureId: string;
  travellers: number;
  fullName: string;
  email: string;
  phone: string;
  country: string | null;
  message: string | null;
};

/**
 * Creates an inquiry and holds its seats in a single transaction.
 * The seat increment is a conditional UPDATE, so concurrent requests can never
 * push seatsReserved beyond capacity.
 */
export async function createInquiry(input: NewInquiry) {
  const today = todayUtc();

  return prisma.$transaction(async (tx) => {
    const departure = await tx.departure.findUnique({
      where: { id: input.departureId },
      include: { trip: { select: { id: true, status: true, title: true, slug: true, validUntil: true } } },
    });
    if (!departure || departure.trip.status !== "PUBLISHED" || (departure.trip.validUntil && departure.trip.validUntil < today)) {
      throw new BookingError("This departure is no longer available.");
    }
    if (departure.startDate <= today) throw new BookingError("This departure has already left and can’t be booked.");
    if (departure.status !== "OPEN") throw new BookingError("This departure is not accepting inquiries.");

    const updated = await tx.$executeRaw`
      UPDATE "Departure"
      SET "seatsReserved" = "seatsReserved" + ${input.travellers}, "updatedAt" = NOW()
      WHERE "id" = ${departure.id}
        AND "status" = 'OPEN'
        AND "startDate" > ${today}
        AND "seatsReserved" + ${input.travellers} <= "capacity"`;

    if (updated !== 1) {
      const fresh = await tx.departure.findUnique({ where: { id: departure.id } });
      const left = fresh ? seatsAvailable(fresh) : 0;
      throw new BookingError(
        left === 0
          ? "Sorry — this departure has just sold out. Please choose another date."
          : `Only ${left} seat${left === 1 ? "" : "s"} left on this departure. Please reduce the number of travellers.`,
      );
    }

    // Retry on the (very unlikely) reference collision.
    for (let attempt = 0; attempt < 3; attempt++) {
      const reference = newReference();
      const exists = await tx.inquiry.findUnique({ where: { reference }, select: { id: true } });
      if (exists) continue;
      const inquiry = await tx.inquiry.create({
        data: {
          reference,
          tripId: departure.trip.id,
          departureId: departure.id,
          travellers: input.travellers,
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          country: input.country,
          message: input.message,
          pricePerPerson: effectivePrice(departure, today),
          status: "NEW",
          holdsSeats: true,
        },
      });
      return { inquiry, departure, trip: departure.trip };
    }
    throw new BookingError("Please try again.");
  });
}

/**
 * Updates an inquiry's status, releasing or re-claiming its seats as needed.
 */
export async function updateInquiryStatus(id: string, status: InquiryStatus, adminNotes: string | null) {
  return prisma.$transaction(async (tx) => {
    // Lock the row so two admins can't double-release seats.
    const rows = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Inquiry" WHERE "id" = ${id} FOR UPDATE`;
    if (rows.length === 0) throw new BookingError("Inquiry not found.");
    const inquiry = await tx.inquiry.findUniqueOrThrow({ where: { id } });

    const shouldHold = SEAT_HOLDING_STATUSES.includes(status);
    let holdsSeats = inquiry.holdsSeats;

    if (inquiry.holdsSeats && !shouldHold) {
      await tx.$executeRaw`
        UPDATE "Departure" SET "seatsReserved" = GREATEST("seatsReserved" - ${inquiry.travellers}, 0), "updatedAt" = NOW()
        WHERE "id" = ${inquiry.departureId}`;
      holdsSeats = false;
    } else if (!inquiry.holdsSeats && shouldHold) {
      const updated = await tx.$executeRaw`
        UPDATE "Departure" SET "seatsReserved" = "seatsReserved" + ${inquiry.travellers}, "updatedAt" = NOW()
        WHERE "id" = ${inquiry.departureId} AND "seatsReserved" + ${inquiry.travellers} <= "capacity"`;
      if (updated !== 1) {
        throw new BookingError("Not enough seats left on this departure to reactivate this inquiry. Increase capacity first.");
      }
      holdsSeats = true;
    }

    return tx.inquiry.update({ where: { id }, data: { status, adminNotes, holdsSeats } });
  });
}
