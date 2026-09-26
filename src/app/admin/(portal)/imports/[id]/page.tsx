import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, Field, Submit } from "@/components/admin/action-form";
import { AdminHeader, StatusPill } from "@/components/admin/bits";
import { ExtractionSetupNotice } from "@/components/admin/extraction-setup";
import { ImportTarget } from "@/components/admin/import-target";
import { NeedsReview, PastTripFields } from "@/components/admin/past-trip-fields";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IMPORT_FIELDS, draftFromExtraction, isExtractionConfigured, type Extraction, type ImportDraft } from "@/lib/extraction";
import { formatDateTime } from "@/lib/format";
import { adminImportUrl, findLikelyDuplicates, findSameImageImports, pastTripDateLabel } from "@/lib/past-trips";
import { discardImport, extractImportForm, restoreImport, saveImport } from "../../../past-trip-actions";

export const metadata = { title: "Review import" };

const kindLabels: Record<Extraction["imageKind"], string> = {
  trip_photo: "Trip photo",
  poster_or_advert: "Poster or advert",
  screenshot: "Screenshot",
  document: "Document",
  other: "Other image",
};

const emptyDraft = (): ImportDraft => ({
  ...(Object.fromEntries(IMPORT_FIELDS.map((f) => [f, ""])) as Record<(typeof IMPORT_FIELDS)[number], string>),
  needsReview: [...IMPORT_FIELDS],
});

const toDate = (v: string) => (v ? new Date(`${v}T00:00:00.000Z`) : null);

export default async function ReviewImportPage({ params }: PageProps<"/admin/imports/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const imp = await prisma.tripImport.findUnique({ where: { id }, include: { pastTrip: { select: { id: true, title: true } } } });
  if (!imp) notFound();

  const extraction = imp.extraction as Extraction | null;
  const draft = extraction ? draftFromExtraction(extraction) : emptyDraft();
  const canExtract = isExtractionConfigured();
  const editable = imp.status === "READY" || imp.status === "FAILED";

  const [dupes, sameImage, trips] = await Promise.all([
    draft.destination || draft.title
      ? findLikelyDuplicates({ title: draft.title, destination: draft.destination, startDate: toDate(draft.startDate), endDate: toDate(draft.endDate) })
      : Promise.resolve([]),
    findSameImageImports(imp.sha256, imp.id),
    prisma.pastTrip.findMany({ select: { id: true, title: true, startDate: true, endDate: true, dateText: true }, orderBy: { updatedAt: "desc" } }),
  ]);
  const tripOptions = trips.map((t) => ({ id: t.id, label: [t.title, pastTripDateLabel(t)].filter(Boolean).join(" · ") }));
  const sameImageTrip = sameImage.find((s) => s.pastTrip)?.pastTrip;
  const suggestedExisting = dupes[0]?.id ?? sameImageTrip?.id;
  const duplicateCount = dupes.length + sameImage.length;

  return (
    <>
      <AdminHeader
        back={{ href: "/admin/imports", label: "Imports" }}
        title={extraction?.title.value || imp.originalName}
        action={<StatusPill status={imp.status} label={imp.status === "READY" ? "Needs review" : imp.status.toLowerCase()} />}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ── Source image ─────────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <p className="eyebrow mb-2 text-muted">Source image</p>
          <a href={adminImportUrl(imp.id)} target="_blank" rel="noopener" className="block border border-line bg-linen" title="Open full size">
            {/* eslint-disable-next-line @next/next/no-img-element -- private, admin-only file */}
            <img src={adminImportUrl(imp.id)} alt={extraction?.imageDescription ?? "Uploaded image"} className="mx-auto max-h-[80vh] w-auto" />
          </a>
          <p className="mt-2 text-xs text-muted">
            {imp.originalName} · {(imp.sizeBytes / 1024 / 1024).toFixed(1)} MB · uploaded {formatDateTime(imp.createdAt)}
            {extraction && ` · ${kindLabels[extraction.imageKind]}`}
            <br />
            The original is kept privately. <a href={adminImportUrl(imp.id)} target="_blank" rel="noopener" className="link-underline">Open full size ↗</a>
          </p>
        </aside>

        {/* ── Details ──────────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-6">
          {imp.status === "SAVED" && imp.pastTrip && (
            <p className="border-l-2 border-success bg-success/5 px-4 py-3 text-sm text-success">
              Saved to <Link href={`/admin/past-trips/${imp.pastTrip.id}`} className="font-semibold underline">{imp.pastTrip.title}</Link>
              {imp.savedAt && ` on ${formatDateTime(imp.savedAt)}`}.
            </p>
          )}
          {imp.status === "DISCARDED" && (
            <ActionForm action={restoreImport.bind(null, imp.id)} className="flex flex-wrap items-center gap-4 border-l-2 border-line bg-paper-deep px-4 py-3 text-sm">
              <span>This import was discarded. The original image is still stored.</span>
              <Submit variant="outline">Restore</Submit>
            </ActionForm>
          )}
          {imp.status === "PROCESSING" && <p className="border-l-2 border-brass bg-brass/10 px-4 py-3 text-sm">Reading details… refresh in a moment.</p>}
          {imp.status === "FAILED" && imp.error && (
            <p role="alert" className="border-l-2 border-danger bg-danger/5 px-4 py-3 text-sm text-danger">{imp.error}</p>
          )}
          {!canExtract && !extraction && <ExtractionSetupNotice />}
          {canExtract && (imp.status === "PENDING" || imp.status === "FAILED" || imp.status === "READY") && (
            <ActionForm action={extractImportForm.bind(null, imp.id)} className="flex flex-wrap items-center gap-3">
              <Submit variant={extraction ? "outline" : "primary"} confirm={extraction ? "Read the image again? Unsaved edits below will be lost." : undefined}>
                {extraction ? "Read again" : "Read details from image"}
              </Submit>
              {imp.extractedAt && <span className="text-xs text-muted">Last read {formatDateTime(imp.extractedAt)} by {imp.model}</span>}
            </ActionForm>
          )}

          {extraction && (
            <section className="border border-line bg-[#fbf9f4] p-4 text-sm">
              <h2 className="eyebrow text-brass-deep">What was read</h2>
              <p className="mt-2 text-ink-soft">
                {IMPORT_FIELDS.length - draft.needsReview.length} of {IMPORT_FIELDS.length} fields were clearly visible.{" "}
                {draft.needsReview.length > 0 && (
                  <>
                    {draft.needsReview.length} are marked <NeedsReview /> because they were unclear or not shown — they&apos;ve been left for you rather than guessed.
                  </>
                )}
              </p>
              {extraction.reviewerNotes && <p className="mt-2 text-ink-soft"><span className="font-semibold">Reader&apos;s notes:</span> {extraction.reviewerNotes}</p>}
              {extraction.otherDetails.items.length > 0 && (
                <>
                  <p className="mt-3 font-semibold">Other text in the image (not saved unless you add it):</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink-soft">
                    {extraction.otherDetails.items.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </>
              )}
            </section>
          )}

          {editable && (duplicateCount > 0) && (
            <section className="border border-oxblood/40 bg-oxblood/5 p-4 text-sm" aria-labelledby="dupes-h">
              <h2 id="dupes-h" className="eyebrow text-oxblood">Possible duplicates</h2>
              <ul className="mt-3 space-y-3">
                {sameImage.map((s) => (
                  <li key={s.id}>
                    <span className="font-semibold">The same image</span> was uploaded on {formatDateTime(s.createdAt)} ({s.originalName})
                    {s.pastTrip ? (
                      <> and saved to <Link href={`/admin/past-trips/${s.pastTrip.id}`} className="underline">{s.pastTrip.title}</Link>.</>
                    ) : (
                      <> — <Link href={`/admin/imports/${s.id}`} className="underline">see that import</Link>.</>
                    )}
                  </li>
                ))}
                {dupes.map((d) => (
                  <li key={d.id}>
                    <Link href={`/admin/past-trips/${d.id}`} className="font-semibold underline">{d.title}</Link>
                    <span className="text-muted"> · {d.destination}{d.dateLabel ? ` · ${d.dateLabel}` : ""} · {d.status.toLowerCase()}</span>
                    <span className="block text-xs text-oxblood">{d.reasons.join(" · ")}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {editable && (
            // Keyed so a fresh read replaces the (uncontrolled) field values.
            <ActionForm key={imp.extractedAt?.toISOString() ?? "manual"} action={saveImport.bind(null, imp.id)} className="space-y-6">
              <ImportTarget
                trips={tripOptions}
                defaultTarget={suggestedExisting ? "existing" : "new"}
                defaultExistingId={suggestedExisting}
                duplicateCount={duplicateCount}
              />
              <PastTripFields values={draft} needsReview={draft.needsReview} />
              <Field
                name="attachImage"
                type="checkbox"
                defaultValue
                label="Add this image to the trip's photos (private until you approve it and confirm you have the rights)"
              />
              <div className="flex flex-wrap gap-3 border-t border-line pt-5">
                <Submit>Save as draft</Submit>
              </div>
            </ActionForm>
          )}

          {imp.status !== "SAVED" && imp.status !== "DISCARDED" && (
            <ActionForm action={discardImport.bind(null, imp.id)} showMessage={false}>
              <Submit variant="danger" confirm="Discard this import? The original image is kept, and you can restore it later.">Discard import</Submit>
            </ActionForm>
          )}
        </div>
      </div>
    </>
  );
}
