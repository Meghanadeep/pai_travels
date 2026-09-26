import type { ImportField } from "@/lib/extraction";
import { Field } from "./action-form";

export type PastTripValues = Partial<Record<ImportField, string>>;

export function NeedsReview() {
  return (
    <span className="ml-2 inline-block border border-brass/60 bg-brass/15 px-1.5 py-px align-middle text-[0.6rem] font-semibold normal-case tracking-normal text-brass-deep">
      Needs review
    </span>
  );
}

/** Editable past-trip fields. Fields listed in `needsReview` get a visible flag. */
export function PastTripFields({ values, needsReview = [] }: { values: PastTripValues; needsReview?: ImportField[] }) {
  const flag = (f: ImportField) => (needsReview.includes(f) ? <NeedsReview /> : undefined);
  const common = (f: ImportField) => ({ name: f, defaultValue: values[f] ?? "", badge: flag(f) });
  return (
    <div className="space-y-8">
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="eyebrow mb-4 text-brass-deep">Trip</legend>
        <Field {...common("title")} label="Title" required className="sm:col-span-2" />
        <Field {...common("destination")} label="Destination" required />
        <Field {...common("country")} label="Country" />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="eyebrow mb-4 text-brass-deep">When</legend>
        <Field {...common("startDate")} label="Start date" type="date" />
        <Field {...common("endDate")} label="End date" type="date" />
        <Field {...common("dateText")} label="Dates as shown" hint="Used when exact dates aren't known, e.g. “September 2026”." />
        <Field {...common("durationText")} label="Duration" placeholder="e.g. 4 nights / 5 days" />
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="eyebrow mb-4 text-brass-deep">Story</legend>
        <Field {...common("summary")} label="Summary" type="textarea" rows={2} hint="One or two sentences for the Past Trips page. Required to publish." />
        <Field {...common("description")} label="Description" type="textarea" rows={6} hint="Separate paragraphs with a blank line. Required to publish." />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="eyebrow mb-4 text-brass-deep">Details</legend>
        <Field {...common("places")} label="Places visited" type="textarea" rows={5} hint="One per line." />
        <Field {...common("activities")} label="Activities & inclusions" type="textarea" rows={5} hint="One per line." />
        <Field {...common("itinerary")} label="Itinerary" type="textarea" rows={5} hint="One day or stop per line." className="sm:col-span-2" />
        <Field {...common("accommodation")} label="Accommodation" type="textarea" rows={2} />
        <Field {...common("priceNote")} label="Price at the time" type="textarea" rows={2} hint="Shown as a historical price, never as an offer." />
      </fieldset>
    </div>
  );
}
