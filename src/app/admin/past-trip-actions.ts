"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EXTRACTION_MODEL, ExtractionError, extractTripDetails, type Extraction } from "@/lib/extraction";
import { slugify } from "@/lib/format";
import { findLikelyDuplicates, findSameImageImports, hasFutureDates } from "@/lib/past-trips";
import { MAX_IMPORT_BYTES, copyPrivateImage, deletePrivateImage, readPrivateImage, savePrivateImage } from "@/lib/private-files";
import {
  fieldErrors,
  formValues,
  importTargetSchema,
  pastTripSchema,
  photoApprovalSchema,
  photoSchema,
  type FormState,
  type PastTripInput,
} from "@/lib/validation";
import type { ImportStatus } from "@/generated/prisma/enums";

function refresh(pastTripId?: string | null) {
  revalidatePath("/", "layout");
  if (pastTripId) revalidatePath(`/admin/past-trips/${pastTripId}`);
}

const invalid = (error: import("zod").ZodError, formData: FormData): FormState => ({
  ok: false,
  message: "Please correct the highlighted fields.",
  fieldErrors: fieldErrors(error),
  values: formValues(formData),
});

async function uniquePastTripSlug(base: string) {
  const root = slugify(base) || "past-trip";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    if (!(await prisma.pastTrip.findUnique({ where: { slug: candidate }, select: { id: true } }))) return candidate;
  }
  return `${root}-${randomBytes(3).toString("hex")}`;
}

// ─── Upload & extraction ───────────────────────────────────────────────────────

export type UploadResult = { ok: true; id: string; sameImageAs: number } | { ok: false; message: string };

/** Stores one uploaded image as a new import. Called once per file by the upload widget. */
export async function uploadImport(formData: FormData): Promise<UploadResult> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose an image to upload." };
  let stored;
  try {
    stored = await savePrivateImage("imports", Buffer.from(await file.arrayBuffer()), MAX_IMPORT_BYTES);
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  const imp = await prisma.tripImport.create({
    data: { ...stored, originalName: file.name.slice(0, 200) || "upload" },
  });
  const same = await findSameImageImports(stored.sha256, imp.id);
  revalidatePath("/admin/imports");
  return { ok: true, id: imp.id, sameImageAs: same.length };
}

export type ExtractResult = { ok: boolean; status: ImportStatus; message?: string };

const STALE_MS = 10 * 60 * 1000;

/** Reads the image with the vision model. Safe to call twice: only one run claims the import. */
export async function extractImport(importId: string): Promise<ExtractResult> {
  await requireAdmin();
  const claimed = await prisma.tripImport.updateMany({
    where: {
      id: importId,
      OR: [
        { status: { in: ["PENDING", "FAILED", "READY"] } },
        { status: "PROCESSING", updatedAt: { lt: new Date(Date.now() - STALE_MS) } },
      ],
    },
    data: { status: "PROCESSING", error: null },
  });
  if (claimed.count !== 1) {
    const current = await prisma.tripImport.findUnique({ where: { id: importId }, select: { status: true } });
    if (!current) return { ok: false, status: "FAILED", message: "Import not found." };
    return { ok: current.status !== "FAILED", status: current.status, message: current.status === "PROCESSING" ? "Already being read." : undefined };
  }

  const imp = await prisma.tripImport.findUniqueOrThrow({ where: { id: importId } });
  try {
    const extraction = await extractTripDetails(await readPrivateImage("imports", imp.fileName));
    await prisma.tripImport.update({
      where: { id: importId },
      data: { status: "READY", extraction, model: EXTRACTION_MODEL, extractedAt: new Date(), error: null },
    });
    revalidatePath("/admin/imports");
    return { ok: true, status: "READY" };
  } catch (e) {
    const message = e instanceof ExtractionError ? e.message : "Something went wrong while reading the image. Try again.";
    if (!(e instanceof ExtractionError)) console.error("extractImport failed", e);
    await prisma.tripImport.update({ where: { id: importId }, data: { status: "FAILED", error: message } });
    revalidatePath("/admin/imports");
    return { ok: false, status: "FAILED", message };
  }
}

export async function extractImportForm(importId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  const res = await extractImport(importId);
  revalidatePath(`/admin/imports/${importId}`);
  return { ok: res.ok, message: res.ok ? "Details read from the image." : res.message };
}

// ─── Review & save ─────────────────────────────────────────────────────────────

function mergeInto(existing: PastTripInput, incoming: PastTripInput): PastTripInput {
  // Empty incoming fields keep the existing value; lists are combined.
  const pick = <K extends keyof PastTripInput>(k: K) => {
    const v = incoming[k];
    return (v === null || v === "" ? existing[k] : v) as PastTripInput[K];
  };
  const union = (a: string[], b: string[]) => [...new Map([...a, ...b].map((s) => [s.toLowerCase(), s])).values()];
  return {
    title: pick("title"),
    destination: pick("destination"),
    country: pick("country"),
    startDate: pick("startDate"),
    endDate: pick("endDate"),
    dateText: pick("dateText"),
    durationText: pick("durationText"),
    summary: pick("summary"),
    description: pick("description"),
    places: union(existing.places, incoming.places),
    itinerary: pick("itinerary"),
    accommodation: pick("accommodation"),
    activities: union(existing.activities, incoming.activities),
    priceNote: pick("priceNote"),
  };
}

export async function saveImport(importId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const imp = await prisma.tripImport.findUnique({ where: { id: importId } });
  if (!imp) return { ok: false, message: "Import not found." };
  if (imp.status !== "READY" && imp.status !== "FAILED") {
    return { ok: false, message: imp.status === "SAVED" ? "This import has already been saved." : "This import can't be saved in its current state." };
  }

  const values = Object.fromEntries(formData);
  const parsed = pastTripSchema.safeParse(values);
  const target = importTargetSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, formData);
  if (!target.success) return invalid(target.error, formData);
  const data = parsed.data;

  let pastTripId: string;
  if (target.data.target === "new") {
    const [dupes, sameImage] = await Promise.all([findLikelyDuplicates(data), findSameImageImports(imp.sha256, imp.id)]);
    const savedSame = sameImage.filter((s) => s.pastTrip);
    if ((dupes.length || savedSame.length) && !target.data.confirmNotDuplicate) {
      const names = [...dupes.map((d) => d.title), ...savedSame.map((s) => s.pastTrip!.title)];
      return {
        ok: false,
        message: `This looks like a trip you already have: ${[...new Set(names)].join(", ")}. Choose “Update an existing past trip”, or tick the box to confirm it's a different trip.`,
        fieldErrors: { confirmNotDuplicate: ["Confirm this is a different trip, or update the existing one"] },
        values: formValues(formData),
      };
    }
    const created = await prisma.pastTrip.create({ data: { ...data, slug: await uniquePastTripSlug(data.title), status: "DRAFT" } });
    pastTripId = created.id;
  } else {
    const existing = await prisma.pastTrip.findUnique({ where: { id: target.data.existingId } });
    if (!existing) return { ok: false, message: "That past trip no longer exists.", values: formValues(formData) };
    const merged = mergeInto(existing, data);
    if (existing.status === "PUBLISHED" && hasFutureDates(merged)) {
      return { ok: false, message: "A published past trip must have ended before today.", fieldErrors: { endDate: ["Must be before today"] }, values: formValues(formData) };
    }
    await prisma.pastTrip.update({ where: { id: existing.id }, data: merged });
    pastTripId = existing.id;
  }

  if (formData.get("attachImage") === "on") {
    const fileName = await copyPrivateImage("imports", imp.fileName, "photos");
    const alt = (imp.extraction as Extraction | null)?.imageDescription?.slice(0, 200) ?? "";
    await prisma.pastTripPhoto.create({ data: { pastTripId, fileName, alt, sourceImportId: imp.id, sortOrder: 100 } });
  }
  await prisma.tripImport.update({ where: { id: imp.id }, data: { status: "SAVED", pastTripId, savedAt: new Date() } });
  refresh(pastTripId);
  redirect(`/admin/past-trips/${pastTripId}?from=import`);
}

export async function discardImport(importId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  await requireAdmin();
  // The original file is kept; the import is only hidden from the review queue.
  await prisma.tripImport.updateMany({ where: { id: importId, status: { not: "SAVED" } }, data: { status: "DISCARDED" } });
  revalidatePath("/admin/imports");
  redirect("/admin/imports");
}

export async function restoreImport(importId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  await requireAdmin();
  const imp = await prisma.tripImport.findUnique({ where: { id: importId }, select: { status: true, extraction: true } });
  if (imp?.status !== "DISCARDED") return { ok: false, message: "Only discarded imports can be restored." };
  await prisma.tripImport.update({ where: { id: importId }, data: { status: imp.extraction ? "READY" : "PENDING" } });
  revalidatePath("/admin/imports");
  return { ok: true, message: "Import restored to the review queue." };
}

// ─── Past trips ────────────────────────────────────────────────────────────────

export async function updatePastTrip(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const trip = await prisma.pastTrip.findUnique({ where: { id }, select: { status: true } });
  if (!trip) return { ok: false, message: "Past trip not found." };
  const parsed = pastTripSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  if (trip.status === "PUBLISHED") {
    const problem = publishProblem(parsed.data, true);
    if (problem) return { ok: false, message: `This trip is published, so: ${problem}`, values: formValues(formData) };
  }
  await prisma.pastTrip.update({ where: { id }, data: parsed.data });
  refresh(id);
  return { ok: true, message: "Past trip saved." };
}

function publishProblem(t: PastTripInput, confirmedPast: boolean) {
  if (!t.summary) return "add a short summary.";
  if (!t.description) return "add a description.";
  if (!t.startDate && !t.dateText) return "add the travel dates (exact dates, or a month/year in “Dates as shown”).";
  if (hasFutureDates(t)) return "the trip hasn't finished yet (it ends today or later). Past trips must have already happened — add upcoming trips under Trips instead.";
  if (!t.startDate && !confirmedPast) return "confirm the trip has already taken place.";
  return null;
}

export async function setPastTripStatus(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const trip = await prisma.pastTrip.findUnique({ where: { id } });
  if (!trip) return { ok: false, message: "Past trip not found." };
  const status = formData.get("status");
  if (status === "PUBLISHED") {
    const problem = publishProblem(trip, formData.get("confirmPast") === "on");
    if (problem) return { ok: false, message: `Can't publish yet — ${problem}` };
    await prisma.pastTrip.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: trip.publishedAt ?? new Date() } });
    refresh(id);
    return { ok: true, message: "Published. It now appears in Past Trips, with only the photos you've approved." };
  }
  if (status === "DRAFT") {
    await prisma.pastTrip.update({ where: { id }, data: { status: "DRAFT" } });
    refresh(id);
    return { ok: true, message: "Unpublished — it's hidden from the website." };
  }
  return { ok: false, message: "Unknown status." };
}

export async function deletePastTrip(id: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  await requireAdmin();
  const trip = await prisma.pastTrip.findUnique({ where: { id }, include: { photos: true } });
  if (!trip) return { ok: false, message: "Past trip not found." };
  if (trip.status === "PUBLISHED") return { ok: false, message: "Unpublish this trip before deleting it." };
  // Imports that fed this trip go back to the review queue; their original images are untouched.
  await prisma.$transaction([
    prisma.tripImport.updateMany({ where: { pastTripId: id }, data: { status: "READY", pastTripId: null, savedAt: null } }),
    prisma.pastTrip.delete({ where: { id } }),
  ]);
  await Promise.all(trip.photos.map((p) => deletePrivateImage("photos", p.fileName)));
  refresh();
  redirect("/admin/past-trips");
}

// ─── Photos ────────────────────────────────────────────────────────────────────

export async function addPastTripPhoto(pastTripId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose an image.", fieldErrors: { file: ["Choose an image"] } };
  const parsed = photoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  let stored;
  try {
    stored = await savePrivateImage("photos", Buffer.from(await file.arrayBuffer()), MAX_IMPORT_BYTES);
  } catch (e) {
    return { ok: false, message: (e as Error).message, fieldErrors: { file: [(e as Error).message] } };
  }
  await prisma.pastTripPhoto.create({ data: { pastTripId, fileName: stored.fileName, ...parsed.data } });
  refresh(pastTripId);
  return { ok: true, message: "Photo added. It stays private until you approve it." };
}

export async function updatePhoto(photoId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = photoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const photo = await prisma.pastTripPhoto.findUnique({ where: { id: photoId } });
  if (!photo) return { ok: false, message: "Photo not found." };
  if (photo.approvedAt && !parsed.data.alt) return { ok: false, message: "Approved photos need a description.", fieldErrors: { alt: ["Required"] } };
  await prisma.pastTripPhoto.update({ where: { id: photoId }, data: parsed.data });
  refresh(photo.pastTripId);
  return { ok: true, message: "Saved." };
}

export async function approvePhoto(photoId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = photoApprovalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const photo = await prisma.pastTripPhoto.findUnique({ where: { id: photoId } });
  if (!photo) return { ok: false, message: "Photo not found." };
  await prisma.pastTripPhoto.update({
    where: { id: photoId },
    data: { alt: parsed.data.alt, rightsNote: parsed.data.rightsNote, approvedAt: new Date() },
  });
  refresh(photo.pastTripId);
  return { ok: true, message: "Approved for the website." };
}

export async function revokePhoto(photoId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  await requireAdmin();
  const photo = await prisma.pastTripPhoto.update({ where: { id: photoId }, data: { approvedAt: null } }).catch(() => null);
  refresh(photo?.pastTripId);
  return { ok: true, message: "Approval withdrawn — the photo is private again." };
}

export async function deletePhoto(photoId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  await requireAdmin();
  const photo = await prisma.pastTripPhoto.delete({ where: { id: photoId } }).catch(() => null);
  if (photo) await deletePrivateImage("photos", photo.fileName);
  refresh(photo?.pastTripId);
  return { ok: true, message: "Photo removed. (Any original import it came from is kept.)" };
}
