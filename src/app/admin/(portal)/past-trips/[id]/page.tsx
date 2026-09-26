import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, Field, Submit } from "@/components/admin/action-form";
import { AdminHeader, Panel, StatusPill } from "@/components/admin/bits";
import { PastTripFields } from "@/components/admin/past-trip-fields";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime, toDateInput, tripStatusLabels } from "@/lib/format";
import { adminImportUrl, adminPhotoUrl, pastTripDateLabel } from "@/lib/past-trips";
import {
  addPastTripPhoto,
  approvePhoto,
  deletePastTrip,
  deletePhoto,
  revokePhoto,
  setPastTripStatus,
  updatePastTrip,
  updatePhoto,
} from "../../../past-trip-actions";

export const metadata = { title: "Edit past trip" };

export default async function EditPastTrip({ params, searchParams }: PageProps<"/admin/past-trips/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { from } = await searchParams;
  const trip = await prisma.pastTrip.findUnique({
    where: { id },
    include: {
      photos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      imports: { orderBy: { createdAt: "asc" }, select: { id: true, originalName: true, createdAt: true } },
    },
  });
  if (!trip) notFound();
  const published = trip.status === "PUBLISHED";
  const approvedCount = trip.photos.filter((p) => p.approvedAt).length;

  return (
    <>
      <AdminHeader
        back={{ href: "/admin/past-trips", label: "Past trips" }}
        eyebrow={pastTripDateLabel(trip) ?? "Dates missing"}
        title={trip.title}
        action={
          <div className="flex items-center gap-3">
            <StatusPill status={trip.status} label={tripStatusLabels[trip.status]} />
            {published && <Link href={`/past-trips/${trip.slug}`} target="_blank" className="btn btn-outline btn-sm">View on site ↗</Link>}
          </div>
        }
      />

      {from === "import" && (
        <p role="status" className="mb-6 border-l-2 border-success bg-success/5 px-4 py-3 text-sm text-success">
          Import saved{published ? "." : " as a draft. Check the details and photos below, then publish when it's ready."}
        </p>
      )}

      <div className="space-y-8">
        <Panel
          title="Publishing"
          description={
            published
              ? "Visible on the Past Trips page. Only approved photos are shown."
              : "Hidden from the website. Publishing needs a summary, description and past dates."
          }
        >
          <ActionForm action={setPastTripStatus.bind(null, trip.id)} className="space-y-4">
            {published ? (
              <Submit variant="outline" name="status" value="DRAFT">Unpublish</Submit>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                {!trip.startDate && <Field name="confirmPast" type="checkbox" label="This trip has already taken place" />}
                <Submit variant="accent" name="status" value="PUBLISHED">Publish to website</Submit>
                <span className="text-xs text-muted">
                  {approvedCount ? `${approvedCount} approved photo${approvedCount === 1 ? "" : "s"} will be shown.` : "No photos are approved, so it will show without photos."}
                </span>
              </div>
            )}
          </ActionForm>
        </Panel>

        <Panel title="Details">
          <ActionForm action={updatePastTrip.bind(null, trip.id)} className="space-y-6">
            <PastTripFields
              values={{
                ...trip,
                country: trip.country ?? "",
                startDate: toDateInput(trip.startDate),
                endDate: toDateInput(trip.endDate),
                dateText: trip.dateText ?? "",
                durationText: trip.durationText ?? "",
                places: trip.places.join("\n"),
                itinerary: trip.itinerary ?? "",
                accommodation: trip.accommodation ?? "",
                activities: trip.activities.join("\n"),
                priceNote: trip.priceNote ?? "",
              }}
            />
            <Submit>Save details</Submit>
          </ActionForm>
        </Panel>

        <Panel
          id="photos"
          title="Photos"
          description="Photos are private until you approve each one. Approving asks you to confirm you have the right to publish it — only use your own photos or ones you have permission for."
        >
          {trip.photos.length ? (
            <ul className="grid gap-5 md:grid-cols-2">
              {trip.photos.map((p) => (
                <li key={p.id} className="border border-line bg-paper">
                  <a href={adminPhotoUrl(p.id)} target="_blank" rel="noopener" className="block bg-linen">
                    {/* eslint-disable-next-line @next/next/no-img-element -- private, admin-only file */}
                    <img src={adminPhotoUrl(p.id)} alt={p.alt} className="mx-auto h-56 w-full object-contain" loading="lazy" />
                  </a>
                  <div className="space-y-3 p-4">
                    {p.approvedAt ? (
                      <p className="text-xs text-success">
                        ✓ Approved {formatDateTime(p.approvedAt)} · Rights: {p.rightsNote}
                      </p>
                    ) : (
                      <p className="text-xs text-oxblood">Private — not approved for the website</p>
                    )}
                    {p.sourceImportId && <p className="text-xs text-muted">From an imported image</p>}

                    {p.approvedAt ? (
                      <>
                        <ActionForm action={updatePhoto.bind(null, p.id)} className="grid grid-cols-[1fr_5rem] gap-3">
                          <Field name="alt" label="Description" defaultValue={p.alt} />
                          <Field name="sortOrder" label="Order" type="number" min={0} defaultValue={p.sortOrder} />
                          <Submit variant="outline" className="col-span-2 w-fit">Save</Submit>
                        </ActionForm>
                        <ActionForm action={revokePhoto.bind(null, p.id)} showMessage={false}>
                          <Submit variant="outline">Withdraw approval</Submit>
                        </ActionForm>
                      </>
                    ) : (
                      <ActionForm action={approvePhoto.bind(null, p.id)} className="space-y-3">
                        <Field name="alt" label="Description (alt text)" required defaultValue={p.alt} />
                        <Field name="rightsNote" label="Who holds the rights?" required placeholder="e.g. Our own photo from the trip" defaultValue={p.rightsNote} />
                        <Field name="rightsConfirmed" type="checkbox" label="I confirm we own this image or have permission to publish it" />
                        <Submit variant="accent">Approve for website</Submit>
                      </ActionForm>
                    )}
                    <ActionForm action={deletePhoto.bind(null, p.id)} showMessage={false}>
                      <Submit variant="danger" confirm="Remove this photo from the trip? Any original import is kept.">Remove</Submit>
                    </ActionForm>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No photos yet.</p>
          )}
          <div className="mt-6 border-t border-line pt-5">
            <ActionForm action={addPastTripPhoto.bind(null, trip.id)} encType="multipart/form-data" className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <Field name="file" label="Add a photo" type="file" />
              <Field name="alt" label="Description" />
              <Submit variant="outline">Upload</Submit>
            </ActionForm>
          </div>
        </Panel>

        {trip.imports.length > 0 && (
          <Panel title="Source images" description="The original uploads this trip was built from, kept for your reference. Never shown publicly.">
            <ul className="flex flex-wrap gap-4">
              {trip.imports.map((imp) => (
                <li key={imp.id} className="w-40 text-xs">
                  <Link href={`/admin/imports/${imp.id}`} className="block border border-line bg-linen">
                    {/* eslint-disable-next-line @next/next/no-img-element -- private, admin-only file */}
                    <img src={adminImportUrl(imp.id)} alt="" className="h-40 w-full object-cover" loading="lazy" />
                  </Link>
                  <p className="mt-1 truncate" title={imp.originalName}>{imp.originalName}</p>
                  <p className="text-muted">{formatDateTime(imp.createdAt)}</p>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {!published && (
          <ActionForm action={deletePastTrip.bind(null, trip.id)}>
            <Submit variant="danger" confirm="Delete this past trip and its photos? Source imports go back to the review queue.">Delete past trip</Submit>
          </ActionForm>
        )}
      </div>
    </>
  );
}
