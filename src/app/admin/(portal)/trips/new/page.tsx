import { ActionForm, Submit } from "@/components/admin/action-form";
import { AdminHeader } from "@/components/admin/bits";
import { TripFields } from "@/components/admin/trip-fields";
import { requireAdmin } from "@/lib/auth";
import { createTrip } from "../../../actions";

export const metadata = { title: "New trip" };

export default async function NewTripPage() {
  await requireAdmin();
  return (
    <>
      <AdminHeader back={{ href: "/admin/trips", label: "Trips" }} title="New trip" />
      <p className="mb-6 text-sm text-muted">
        New trips start as drafts. After saving you can add images, the day-by-day itinerary, FAQs and departure dates, then publish.
      </p>
      <ActionForm action={createTrip} className="space-y-8">
        <TripFields />
        <div className="sticky bottom-0 -mx-4 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur">
          <Submit>Create draft</Submit>
        </div>
      </ActionForm>
    </>
  );
}
