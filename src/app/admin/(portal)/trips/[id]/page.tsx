import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, Field, Submit } from "@/components/admin/action-form";
import { AdminHeader, Panel, StatusPill } from "@/components/admin/bits";
import { TripFields } from "@/components/admin/trip-fields";
import { Notice } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { availability, availabilityLabels, seatsAvailable } from "@/lib/departures";
import { departureStatusLabels, formatDateRange, formatPrice, toDateInput, tripStatusLabels } from "@/lib/format";
import { allowedImageHosts } from "@/lib/images";
import {
  addImage,
  deleteDeparture,
  deleteFaq,
  deleteImage,
  deleteItineraryDay,
  saveDeparture,
  saveFaq,
  saveItineraryDay,
  setCoverImage,
  setTripStatus,
  updateImage,
  updateTrip,
} from "../../../actions";
import type { Departure } from "@/generated/prisma/client";

export const metadata = { title: "Edit trip" };

const departureStatusOptions = (["OPEN", "CLOSED", "CANCELLED"] as const).map((s) => ({ value: s, label: departureStatusLabels[s] }));

function DepartureFields({ d, durationDays }: { d?: Departure; durationDays: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <Field name="startDate" label="Start date" type="date" required defaultValue={toDateInput(d?.startDate)} />
      <Field name="endDate" label="End date" type="date" required defaultValue={toDateInput(d?.endDate)} hint={d ? undefined : `Trip is ${durationDays} days`} />
      <Field name="price" label="Price per person" type="number" min={0} required defaultValue={d?.price} />
      <Field name="capacity" label="Total seats" type="number" min={0} required defaultValue={d?.capacity} hint={d ? `${d.seatsReserved} currently held` : undefined} />
      <Field name="status" label="Booking status" type="select" defaultValue={d?.status ?? "OPEN"} options={departureStatusOptions} />
      <Field name="earlyBirdPrice" label="Early bird price" type="number" min={0} defaultValue={d?.earlyBirdPrice} hint="Optional" />
      <Field name="earlyBirdEndsAt" label="Early bird ends" type="date" defaultValue={toDateInput(d?.earlyBirdEndsAt)} hint="Optional" />
      <Field name="note" label="Note" defaultValue={d?.note} hint="Shown to customers, e.g. “Festival dates”" />
    </div>
  );
}

export default async function EditTripPage({ params, searchParams }: PageProps<"/admin/trips/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      itinerary: { orderBy: { dayNumber: "asc" } },
      faqs: { orderBy: { sortOrder: "asc" } },
      departures: { orderBy: { startDate: "asc" }, include: { _count: { select: { inquiries: true } } } },
    },
  });
  if (!trip) notFound();

  const nextDay = (trip.itinerary.at(-1)?.dayNumber ?? 0) + 1;
  const sections = [
    ["status", "Status"],
    ["details", "Details"],
    ["images", `Images (${trip.images.length})`],
    ["itinerary", `Itinerary (${trip.itinerary.length})`],
    ["faqs", `FAQs (${trip.faqs.length})`],
    ["departures", `Departures (${trip.departures.length})`],
  ];

  return (
    <>
      <AdminHeader
        back={{ href: "/admin/trips", label: "Trips" }}
        eyebrow={`${trip.destination}, ${trip.country}`}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {trip.title} <StatusPill status={trip.status} label={tripStatusLabels[trip.status]} />
          </span>
        }
        action={
          <Link href={`/trips/${trip.slug}`} target="_blank" className="btn btn-outline btn-sm">
            {trip.status === "PUBLISHED" ? "View live ↗" : "Preview ↗"}
          </Link>
        }
      />

      {created && <div className="mb-6"><Notice tone="success">Draft created. Add images, itinerary days and departures, then publish when ready.</Notice></div>}

      <nav aria-label="Sections" className="mb-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {sections.map(([anchor, label]) => (
          <a key={anchor} href={`#${anchor}`} className="link-underline">{label}</a>
        ))}
      </nav>

      <div className="space-y-8">
        <Panel id="status" title="Visibility" description="Only published trips appear on the website. Archived trips are hidden but keep their inquiries.">
          <ActionForm action={setTripStatus.bind(null, trip.id)} className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {trip.status !== "PUBLISHED" && <Submit variant="accent" name="status" value="PUBLISHED">Publish</Submit>}
              {trip.status === "PUBLISHED" && <Submit variant="outline" name="status" value="DRAFT">Unpublish (to draft)</Submit>}
              {trip.status !== "ARCHIVED" && (
                <Submit variant="danger" name="status" value="ARCHIVED" confirm="Archive this trip? It will be hidden from the website.">Archive</Submit>
              )}
            </div>
          </ActionForm>
        </Panel>

        <Panel id="details" title="Trip details">
          <ActionForm action={updateTrip.bind(null, trip.id)} className="space-y-8">
            <TripFields trip={trip} />
            <div className="sticky bottom-0 -mx-5 border-t border-line bg-[#fbf9f4]/95 px-5 py-3 backdrop-blur">
              <Submit>Save details</Submit>
            </div>
          </ActionForm>
        </Panel>

        <Panel id="images" title="Images" description="The gallery on the trip page. Lower sort numbers appear first.">
          {trip.images.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trip.images.map((img) => {
                const isCover = img.url === trip.coverImageUrl;
                return (
                  <li key={img.id} className="border border-line bg-paper p-3">
                    <div className="relative aspect-[4/3] overflow-hidden bg-linen">
                      <Image src={img.url} alt={img.alt} fill sizes="300px" className="object-cover" />
                      {isCover && <span className="eyebrow absolute left-2 top-2 bg-ink px-2 py-1 text-[0.6rem] text-paper">Cover</span>}
                    </div>
                    <ActionForm action={updateImage.bind(null, img.id)} className="mt-3 space-y-3">
                      <Field name="alt" label="Description" defaultValue={img.alt} />
                      <div className="flex items-end gap-2">
                        <Field name="sortOrder" label="Order" type="number" min={0} defaultValue={img.sortOrder} className="w-20" />
                        <Submit variant="outline">Save</Submit>
                      </div>
                    </ActionForm>
                    <div className="mt-3 flex gap-2 border-t border-line pt-3">
                      {!isCover && (
                        <ActionForm action={setCoverImage.bind(null, img.id)} className="contents">
                          <Submit variant="outline">Make cover</Submit>
                        </ActionForm>
                      )}
                      <ActionForm action={deleteImage.bind(null, img.id)} className="contents">
                        <Submit variant="danger" confirm="Remove this image?">Remove</Submit>
                      </ActionForm>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-6 border-t border-line pt-5">
            <h3 className="eyebrow">Add an image</h3>
            <ActionForm action={addImage.bind(null, trip.id)} className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field name="file" label="Upload" type="file" hint="JPEG, PNG, WebP or AVIF, up to 5 MB." />
              <Field name="url" label="…or image URL" placeholder="https://images.unsplash.com/…" hint={`Allowed hosts: ${allowedImageHosts().join(", ")}`} />
              <Field name="alt" label="Description (alt text)" required />
              <Field name="sortOrder" label="Order" type="number" min={0} defaultValue={trip.images.length} />
              <Field name="makeCover" label="Also use as the cover image" type="checkbox" />
              <div className="sm:col-span-2"><Submit>Add image</Submit></div>
            </ActionForm>
          </div>
        </Panel>

        <Panel id="itinerary" title="Itinerary" description="Day-by-day plan shown on the trip page.">
          <div className="space-y-2">
            {trip.itinerary.map((day) => (
              <details key={day.id} className="border border-line bg-paper">
                <summary className="flex cursor-pointer items-center gap-3 px-4 py-3">
                  <span className="eyebrow text-brass-deep">Day {day.dayNumber}</span>
                  <span className="font-medium">{day.title}</span>
                </summary>
                <div className="border-t border-line p-4">
                  <ActionForm action={saveItineraryDay.bind(null, trip.id, day.id)} className="grid gap-4 sm:grid-cols-4">
                    <Field name="dayNumber" label="Day" type="number" min={1} defaultValue={day.dayNumber} />
                    <Field name="title" label="Title" defaultValue={day.title} className="sm:col-span-3" />
                    <Field name="description" label="Description" type="textarea" defaultValue={day.description} className="sm:col-span-4" />
                    <Field name="meals" label="Meals" defaultValue={day.meals} className="sm:col-span-2" />
                    <Field name="overnight" label="Overnight" defaultValue={day.overnight} className="sm:col-span-2" />
                    <div className="sm:col-span-4"><Submit variant="outline">Save day</Submit></div>
                  </ActionForm>
                  <ActionForm action={deleteItineraryDay.bind(null, day.id)} className="mt-3">
                    <Submit variant="danger" confirm={`Delete day ${day.dayNumber}?`}>Delete day</Submit>
                  </ActionForm>
                </div>
              </details>
            ))}
          </div>
          <div className="mt-6 border-t border-line pt-5">
            <h3 className="eyebrow">Add a day</h3>
            <ActionForm action={saveItineraryDay.bind(null, trip.id, null)} className="mt-4 grid gap-4 sm:grid-cols-4">
              <Field name="dayNumber" label="Day" type="number" min={1} defaultValue={nextDay} />
              <Field name="title" label="Title" required className="sm:col-span-3" />
              <Field name="description" label="Description" type="textarea" required className="sm:col-span-4" />
              <Field name="meals" label="Meals" placeholder="Breakfast, Dinner" className="sm:col-span-2" />
              <Field name="overnight" label="Overnight" className="sm:col-span-2" />
              <div className="sm:col-span-4"><Submit>Add day</Submit></div>
            </ActionForm>
          </div>
        </Panel>

        <Panel id="faqs" title="FAQs">
          <div className="space-y-2">
            {trip.faqs.map((f) => (
              <details key={f.id} className="border border-line bg-paper">
                <summary className="cursor-pointer px-4 py-3 font-medium">{f.question}</summary>
                <div className="border-t border-line p-4">
                  <ActionForm action={saveFaq.bind(null, trip.id, f.id)} className="grid gap-4">
                    <Field name="question" label="Question" defaultValue={f.question} />
                    <Field name="answer" label="Answer" type="textarea" defaultValue={f.answer} />
                    <div className="flex items-end gap-3">
                      <Field name="sortOrder" label="Order" type="number" min={0} defaultValue={f.sortOrder} className="w-24" />
                      <Submit variant="outline">Save FAQ</Submit>
                    </div>
                  </ActionForm>
                  <ActionForm action={deleteFaq.bind(null, f.id)} className="mt-3">
                    <Submit variant="danger" confirm="Delete this FAQ?">Delete</Submit>
                  </ActionForm>
                </div>
              </details>
            ))}
          </div>
          <div className="mt-6 border-t border-line pt-5">
            <h3 className="eyebrow">Add a question</h3>
            <ActionForm action={saveFaq.bind(null, trip.id, null)} className="mt-4 grid gap-4">
              <Field name="question" label="Question" required />
              <Field name="answer" label="Answer" type="textarea" required />
              <input type="hidden" name="sortOrder" value={trip.faqs.length} />
              <div><Submit>Add FAQ</Submit></div>
            </ActionForm>
          </div>
        </Panel>

        <Panel
          id="departures"
          title="Departures"
          description="Each date has its own price, capacity and status. Seats held = travellers on inquiries that are New, Contacted or Confirmed. Past departures are never bookable."
        >
          {trip.departures.length > 0 && (
            <div className="space-y-2">
              {trip.departures.map((d) => {
                const state = availability(d);
                return (
                  <details key={d.id} className={`border border-line bg-paper ${state === "past" ? "opacity-60" : ""}`}>
                    <summary className="grid cursor-pointer grid-cols-2 items-center gap-2 px-4 py-3 text-sm sm:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
                      <span className="font-medium">{formatDateRange(d.startDate, d.endDate)}</span>
                      <span>
                        {formatPrice(d.price)}
                        {d.earlyBirdPrice != null && <span className="ml-1 text-xs text-brass-deep">EB {formatPrice(d.earlyBirdPrice)}</span>}
                      </span>
                      <span>{d.seatsReserved}/{d.capacity} held · {seatsAvailable(d)} left</span>
                      <span className="text-xs text-muted">{d._count.inquiries} inquiries</span>
                      <span className="flex gap-2">
                        <StatusPill status={d.status} label={departureStatusLabels[d.status]} />
                        {state !== "available" && state !== "closed" && state !== "cancelled" && (
                          <StatusPill status="DRAFT" label={availabilityLabels[state]} />
                        )}
                      </span>
                    </summary>
                    <div className="border-t border-line p-4">
                      <ActionForm action={saveDeparture.bind(null, trip.id, d.id)} className="space-y-4">
                        <DepartureFields d={d} durationDays={trip.durationDays} />
                        <Submit variant="outline">Save departure</Submit>
                      </ActionForm>
                      <ActionForm action={deleteDeparture.bind(null, d.id)} className="mt-3">
                        <Submit variant="danger" confirm="Delete this departure?">Delete departure</Submit>
                      </ActionForm>
                    </div>
                  </details>
                );
              })}
            </div>
          )}
          <div className="mt-6 border-t border-line pt-5">
            <h3 className="eyebrow">Add a departure</h3>
            <ActionForm action={saveDeparture.bind(null, trip.id, null)} className="mt-4 space-y-4">
              <DepartureFields durationDays={trip.durationDays} />
              <Submit>Add departure</Submit>
            </ActionForm>
          </div>
        </Panel>
      </div>
    </>
  );
}
