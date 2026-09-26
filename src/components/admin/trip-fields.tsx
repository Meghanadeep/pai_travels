import type { Trip } from "@/generated/prisma/client";
import { toDateInput, tripTypeLabels } from "@/lib/format";
import { allowedImageHosts } from "@/lib/images";
import { TRIP_TYPES } from "@/lib/trips";
import { Field } from "./action-form";

/** All editable trip fields, shared by the create and edit forms. */
export function TripFields({ trip }: { trip?: Trip }) {
  const lines = (v?: string[]) => (v ? v.join("\n") : undefined);
  return (
    <div className="space-y-8">
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="eyebrow mb-4 text-brass-deep">Basics</legend>
        <Field name="title" label="Trip name" required defaultValue={trip?.title} className="sm:col-span-2" />
        <Field name="slug" label="URL slug" defaultValue={trip?.slug} hint="Leave blank to generate from the name. Changing it breaks old links." />
        <Field name="tripType" label="Trip type" type="select" required defaultValue={trip?.tripType} options={TRIP_TYPES.map((t) => ({ value: t, label: tripTypeLabels[t] }))} />
        <Field name="destination" label="Destination" required defaultValue={trip?.destination} hint="Used for the destination filter, e.g. “Kerala”." />
        <Field name="country" label="Country" required defaultValue={trip?.country} />
        <Field name="durationDays" label="Duration (days)" type="number" min={1} required defaultValue={trip?.durationDays} />
        <div className="grid grid-cols-2 gap-3">
          <Field name="groupSizeMin" label="Min group" type="number" min={1} required defaultValue={trip?.groupSizeMin ?? 1} />
          <Field name="groupSizeMax" label="Max group" type="number" min={1} defaultValue={trip?.groupSizeMax} hint="Blank = no maximum" />
        </div>
        <Field name="featured" label="Feature on the home page" type="checkbox" defaultValue={trip?.featured} />
        <Field name="isSample" label="Mark as sample (shows a “Sample trip” label and hides from search engines)" type="checkbox" defaultValue={trip?.isSample} />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-3">
        <legend className="eyebrow mb-4 text-brass-deep">Package pricing (optional)</legend>
        <p className="-mt-2 text-xs text-muted sm:col-span-3">
          For packages sold on any date rather than fixed departures. Shown only while the trip has no open departures. After the offer end date the trip is hidden from the site.
        </p>
        <Field name="priceFrom" label="Price from, per person" type="number" min={0} defaultValue={trip?.priceFrom} />
        <Field name="validUntil" label="Offer ends" type="date" defaultValue={toDateInput(trip?.validUntil)} />
        <Field name="priceNote" label="Price details" type="textarea" rows={2} defaultValue={trip?.priceNote} hint="e.g. hotel options, sharing basis, GST." className="sm:col-span-3" />
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="eyebrow mb-4 text-brass-deep">Story</legend>
        <Field name="summary" label="Summary" type="textarea" rows={2} required defaultValue={trip?.summary} hint="One or two sentences for cards and search results (max 300 characters)." />
        <Field name="overview" label="Overview" type="textarea" rows={7} required defaultValue={trip?.overview} hint="Separate paragraphs with a blank line." />
        <Field name="highlights" label="Highlights" type="textarea" rows={4} defaultValue={lines(trip?.highlights)} hint="One per line." />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-3">
        <legend className="eyebrow mb-4 text-brass-deep">Logistics</legend>
        <Field name="accommodation" label="Accommodation" type="textarea" rows={5} required defaultValue={trip?.accommodation} />
        <Field name="transport" label="Transport" type="textarea" rows={5} required defaultValue={trip?.transport} />
        <Field name="meals" label="Meals" type="textarea" rows={5} required defaultValue={trip?.meals} />
        <Field name="inclusions" label="Inclusions" type="textarea" rows={6} defaultValue={lines(trip?.inclusions)} hint="One per line." className="sm:col-span-3 lg:col-span-1" />
        <Field name="exclusions" label="Exclusions" type="textarea" rows={6} defaultValue={lines(trip?.exclusions)} hint="One per line." className="sm:col-span-3 lg:col-span-1" />
        <Field name="meetingPoint" label="Meeting point" type="textarea" rows={6} required defaultValue={trip?.meetingPoint} className="sm:col-span-3 lg:col-span-1" />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="eyebrow mb-4 text-brass-deep">Policies & requirements</legend>
        <Field name="cancellationPolicy" label="Cancellation policy" type="textarea" rows={5} required defaultValue={trip?.cancellationPolicy} />
        <Field name="requirements" label="Travel requirements" type="textarea" rows={5} required defaultValue={trip?.requirements} hint="Passports, visas, vaccinations, fitness, insurance." />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="eyebrow mb-4 text-brass-deep">Cover image</legend>
        <Field
          name="coverImageUrl"
          label="Cover image URL"
          required
          defaultValue={trip?.coverImageUrl}
          hint={`Upload in the Images section below and choose “Make cover”, or paste an https URL from ${allowedImageHosts().join(", ")}.`}
        />
        <Field name="coverImageAlt" label="Cover image description (alt text)" required defaultValue={trip?.coverImageAlt} />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="eyebrow mb-4 text-brass-deep">Contact & SEO (optional)</legend>
        <Field name="contactEmail" label="Trip contact email" type="email" defaultValue={trip?.contactEmail} hint="Defaults to the site email." />
        <Field name="contactPhone" label="Trip contact phone" defaultValue={trip?.contactPhone} />
        <Field name="seoTitle" label="SEO title" defaultValue={trip?.seoTitle} hint="Max 70 characters." />
        <Field name="seoDescription" label="SEO description" defaultValue={trip?.seoDescription} hint="Max 170 characters." />
      </fieldset>
    </div>
  );
}
