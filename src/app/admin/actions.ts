"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, requireAdmin } from "@/lib/auth";
import { BookingError, updateInquiryStatus } from "@/lib/bookings";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/format";
import { rateLimit } from "@/lib/rate-limit";
import { IMAGE_TYPES, MAX_UPLOAD_BYTES, sniffImageType, uploadDir } from "@/lib/uploads";
import {
  departureSchema,
  faqSchema,
  fieldErrors,
  formValues,
  imageSchema,
  inquiryUpdateSchema,
  itineraryDaySchema,
  loginSchema,
  reviewSchema,
  tripSchema,
  type FormState,
} from "@/lib/validation";
import type { MessageStatus, TripStatus } from "@/generated/prisma/enums";

const invalid = (error: import("zod").ZodError, formData: FormData): FormState => ({
  ok: false,
  message: "Please correct the highlighted fields.",
  fieldErrors: fieldErrors(error),
  values: formValues(formData),
});

function refresh(tripId?: string) {
  // Public pages render per request; this clears client router caches for admin and site.
  revalidatePath("/", "layout");
  if (tripId) revalidatePath(`/admin/trips/${tripId}`);
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

// Constant hash used to keep timing similar when the email is unknown.
const DUMMY_HASH = "$2b$12$dDnFK/Wy63hH3CaJyjSJm.eQ3ceXhAeweWxTw7bHGGVzKUwuYXxyC";

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await rateLimit("login", 8, 15 * 60 * 1000))) {
    return { ok: false, message: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values: { email: String(formData.get("email") ?? "") } };
  }

  const user = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return { ok: false, message: "Incorrect email or password.", values: { email: parsed.data.email } };

  await createSession(user);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

// ─── Trips ─────────────────────────────────────────────────────────────────────

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "trip";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const clash = await prisma.trip.findFirst({ where: { slug: candidate, NOT: excludeId ? { id: excludeId } : undefined }, select: { id: true } });
    if (!clash) return candidate;
  }
  return `${root}-${randomBytes(3).toString("hex")}`;
}

export async function createTrip(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = tripSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { slug, ...data } = parsed.data;
  const trip = await prisma.trip.create({ data: { ...data, slug: await uniqueSlug(slug || data.title), status: "DRAFT" } });
  refresh();
  redirect(`/admin/trips/${trip.id}?created=1`);
}

export async function updateTrip(tripId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = tripSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { slug, ...data } = parsed.data;
  const nextSlug = slug || slugify(data.title);
  const clash = await prisma.trip.findFirst({ where: { slug: nextSlug, NOT: { id: tripId } }, select: { id: true } });
  if (clash) {
    return { ok: false, message: "That URL slug is already used by another trip.", fieldErrors: { slug: ["Choose a different slug"] }, values: formValues(formData) };
  }
  await prisma.trip.update({ where: { id: tripId }, data: { ...data, slug: nextSlug } });
  refresh(tripId);
  return { ok: true, message: "Trip details saved." };
}

export async function setTripStatus(tripId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const status = formData.get("status") as TripStatus;
  if (!["PUBLISHED", "DRAFT", "ARCHIVED"].includes(status)) return { ok: false, message: "Unknown status." };
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { _count: { select: { itinerary: true } } } });
  if (!trip) return { ok: false, message: "Trip not found." };
  if (status === "PUBLISHED" && trip._count.itinerary === 0) {
    return { ok: false, message: "Add at least one itinerary day before publishing." };
  }
  await prisma.trip.update({
    where: { id: tripId },
    data: { status, publishedAt: status === "PUBLISHED" ? (trip.publishedAt ?? new Date()) : trip.publishedAt },
  });
  refresh(tripId);
  const label = { PUBLISHED: "published — it is now visible on the site", DRAFT: "moved back to draft", ARCHIVED: "archived — it is hidden from the site" }[status];
  return { ok: true, message: `Trip ${label}.` };
}

// ─── Images ────────────────────────────────────────────────────────────────────

async function saveUpload(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Images must be 5 MB or smaller.");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniffImageType(buf);
  if (!type) throw new Error("Upload a JPEG, PNG, WebP or AVIF image.");
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${IMAGE_TYPES[type]}`;
  await mkdir(uploadDir(), { recursive: true });
  await writeFile(path.join(uploadDir(), name), buf);
  return `/media/${name}`;
}

export async function addImage(tripId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const file = formData.get("file");
  let url = String(formData.get("url") ?? "").trim();
  if (file instanceof File && file.size > 0) {
    try {
      url = await saveUpload(file);
    } catch (e) {
      return { ok: false, message: (e as Error).message, fieldErrors: { file: [(e as Error).message] }, values: formValues(formData) };
    }
  }
  if (!url) return { ok: false, message: "Upload a file or paste an image URL.", fieldErrors: { url: ["Required if no file is uploaded"] }, values: formValues(formData) };

  const parsed = imageSchema.safeParse({ ...Object.fromEntries(formData), url });
  if (!parsed.success) return invalid(parsed.error, formData);
  await prisma.tripImage.create({ data: { ...parsed.data, tripId } });
  if (formData.get("makeCover") === "on") {
    await prisma.trip.update({ where: { id: tripId }, data: { coverImageUrl: parsed.data.url, coverImageAlt: parsed.data.alt } });
  }
  refresh(tripId);
  return { ok: true, message: "Image added." };
}

export async function updateImage(imageId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const image = await prisma.tripImage.findUnique({ where: { id: imageId } });
  if (!image) return { ok: false, message: "Image not found." };
  const parsed = imageSchema.safeParse({ ...Object.fromEntries(formData), url: image.url });
  if (!parsed.success) return invalid(parsed.error, formData);
  await prisma.tripImage.update({ where: { id: imageId }, data: { alt: parsed.data.alt, sortOrder: parsed.data.sortOrder } });
  refresh(image.tripId);
  return { ok: true, message: "Saved." };
}

export async function setCoverImage(imageId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  await requireAdmin();
  const image = await prisma.tripImage.findUnique({ where: { id: imageId } });
  if (!image) return { ok: false, message: "Image not found." };
  await prisma.trip.update({ where: { id: image.tripId }, data: { coverImageUrl: image.url, coverImageAlt: image.alt } });
  refresh(image.tripId);
  return { ok: true, message: "Cover image updated." };
}

export async function deleteImage(imageId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  await requireAdmin();
  const image = await prisma.tripImage.findUnique({ where: { id: imageId }, include: { trip: { select: { coverImageUrl: true } } } });
  if (!image) return { ok: false, message: "Image not found." };
  if (image.trip.coverImageUrl === image.url) return { ok: false, message: "This is the cover image. Choose a different cover first." };
  await prisma.tripImage.delete({ where: { id: imageId } });
  if (image.url.startsWith("/media/")) {
    const stillUsed = await prisma.tripImage.count({ where: { url: image.url } });
    if (!stillUsed) await unlink(path.join(uploadDir(), path.basename(image.url))).catch(() => {});
  }
  refresh(image.tripId);
  return { ok: true, message: "Image removed." };
}

// ─── Itinerary & FAQs ──────────────────────────────────────────────────────────

export async function saveItineraryDay(tripId: string, dayId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = itineraryDaySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const clash = await prisma.itineraryDay.findFirst({
    where: { tripId, dayNumber: parsed.data.dayNumber, NOT: dayId ? { id: dayId } : undefined },
    select: { id: true },
  });
  if (clash) return { ok: false, message: `Day ${parsed.data.dayNumber} already exists.`, fieldErrors: { dayNumber: ["Already used"] }, values: formValues(formData) };
  if (dayId) await prisma.itineraryDay.update({ where: { id: dayId, tripId }, data: parsed.data });
  else await prisma.itineraryDay.create({ data: { ...parsed.data, tripId } });
  refresh(tripId);
  return { ok: true, message: dayId ? "Day saved." : "Day added." };
}

export async function deleteItineraryDay(dayId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  await requireAdmin();
  const day = await prisma.itineraryDay.delete({ where: { id: dayId } }).catch(() => null);
  refresh(day?.tripId);
  return { ok: true, message: "Day removed." };
}

export async function saveFaq(tripId: string, faqId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = faqSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  if (faqId) await prisma.tripFaq.update({ where: { id: faqId, tripId }, data: parsed.data });
  else await prisma.tripFaq.create({ data: { ...parsed.data, tripId } });
  refresh(tripId);
  return { ok: true, message: faqId ? "FAQ saved." : "FAQ added." };
}

export async function deleteFaq(faqId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  await requireAdmin();
  const faq = await prisma.tripFaq.delete({ where: { id: faqId } }).catch(() => null);
  refresh(faq?.tripId);
  return { ok: true, message: "FAQ removed." };
}

// ─── Departures ────────────────────────────────────────────────────────────────

export async function saveDeparture(tripId: string, departureId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = departureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);

  if (departureId) {
    // Conditional update so capacity can never drop below seats already held, even under concurrency.
    const updated = await prisma.departure.updateMany({
      where: { id: departureId, tripId, seatsReserved: { lte: parsed.data.capacity } },
      data: parsed.data,
    });
    if (updated.count !== 1) {
      const d = await prisma.departure.findUnique({ where: { id: departureId } });
      return {
        ok: false,
        message: d ? `Capacity can't be lower than the ${d.seatsReserved} seats held by active inquiries.` : "Departure not found.",
        fieldErrors: d ? { capacity: [`At least ${d.seatsReserved}`] } : undefined,
        values: formValues(formData),
      };
    }
  } else {
    await prisma.departure.create({ data: { ...parsed.data, tripId } });
  }
  refresh(tripId);
  return { ok: true, message: departureId ? "Departure saved." : "Departure added." };
}

export async function deleteDeparture(departureId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  await requireAdmin();
  const d = await prisma.departure.findUnique({ where: { id: departureId }, include: { _count: { select: { inquiries: true } } } });
  if (!d) return { ok: false, message: "Departure not found." };
  if (d._count.inquiries > 0) {
    return { ok: false, message: "This departure has inquiries, so it can't be deleted. Set its status to Cancelled or Closed instead." };
  }
  await prisma.departure.delete({ where: { id: departureId } });
  refresh(d.tripId);
  return { ok: true, message: "Departure deleted." };
}

// ─── Inquiries & messages ──────────────────────────────────────────────────────

export async function updateInquiry(inquiryId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = inquiryUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  try {
    await updateInquiryStatus(inquiryId, parsed.data.status, parsed.data.adminNotes);
  } catch (e) {
    if (e instanceof BookingError) return { ok: false, message: e.message, values: formValues(formData) };
    throw e;
  }
  refresh();
  return { ok: true, message: "Inquiry updated." };
}

export async function setMessageStatus(messageId: string, status: MessageStatus, _prev: FormState, _formData: FormData): Promise<FormState> {
  await requireAdmin();
  await prisma.contactMessage.update({ where: { id: messageId }, data: { status } });
  revalidatePath("/admin/messages");
  return { ok: true };
}

// ─── Reviews ───────────────────────────────────────────────────────────────────

export async function saveReview(reviewId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  // Editing a review means it is no longer the seeded placeholder.
  if (reviewId) await prisma.review.update({ where: { id: reviewId }, data: { ...parsed.data, isSample: false } });
  else await prisma.review.create({ data: parsed.data });
  refresh();
  return { ok: true, message: reviewId ? "Review saved." : "Review added." };
}

export async function deleteReview(reviewId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  await requireAdmin();
  await prisma.review.delete({ where: { id: reviewId } }).catch(() => null);
  refresh();
  return { ok: true, message: "Review deleted." };
}
