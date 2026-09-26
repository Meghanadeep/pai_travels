import { ActionForm, Field, Submit } from "@/components/admin/action-form";
import { AdminHeader, Panel } from "@/components/admin/bits";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteReview, saveReview } from "../../actions";
import type { Review } from "@/generated/prisma/client";

export const metadata = { title: "Reviews" };

type TripOption = { value: string; label: string };

function ReviewFields({ r, trips }: { r?: Review; trips: TripOption[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field name="name" label="Traveller name" required defaultValue={r?.name} />
      <Field name="location" label="Location" defaultValue={r?.location} />
      <Field
        name="rating"
        label="Rating"
        type="select"
        defaultValue={r?.rating ?? 5}
        options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} / 5` }))}
      />
      <Field name="body" label="Review" type="textarea" required defaultValue={r?.body} className="sm:col-span-3" />
      <Field name="tripId" label="Trip (optional)" type="select" defaultValue={r?.tripId ?? ""} options={[{ value: "", label: "— None —" }, ...trips]} className="sm:col-span-2" />
      <Field name="published" label="Show on website" type="checkbox" defaultValue={r ? r.published : true} className="self-end" />
    </div>
  );
}

export default async function ReviewsPage() {
  await requireAdmin();
  const [reviews, trips] = await Promise.all([
    prisma.review.findMany({ orderBy: { createdAt: "desc" }, include: { trip: { select: { title: true } } } }),
    prisma.trip.findMany({ where: { status: { not: "ARCHIVED" } }, select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);
  const tripOptions = trips.map((t) => ({ value: t.id, label: t.title }));

  return (
    <>
      <AdminHeader title="Reviews" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Only publish genuine reviews, with the traveller&apos;s permission. Sample reviews created by the seed script are labelled on the site —
        edit or delete them before launch.
      </p>
      <div className="space-y-2">
        {reviews.map((r) => (
          <details key={r.id} className="border border-line bg-[#fbf9f4]">
            <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <span className="font-medium">{r.name}</span>
              <span className="text-muted">{r.rating}/5 · {r.trip?.title ?? "General"}</span>
              {r.isSample && <span className="eyebrow text-[0.6rem] text-oxblood">Sample</span>}
              {!r.published && <span className="eyebrow text-[0.6rem] text-muted">Hidden</span>}
            </summary>
            <div className="border-t border-line p-4">
              <ActionForm action={saveReview.bind(null, r.id)} className="space-y-4">
                <ReviewFields r={r} trips={tripOptions} />
                <Submit variant="outline">Save review</Submit>
              </ActionForm>
              <ActionForm action={deleteReview.bind(null, r.id)} className="mt-3">
                <Submit variant="danger" confirm="Delete this review?">Delete</Submit>
              </ActionForm>
            </div>
          </details>
        ))}
      </div>
      <div className="mt-8">
        <Panel title="Add a review">
          <ActionForm action={saveReview.bind(null, null)} className="space-y-4">
            <ReviewFields trips={tripOptions} />
            <Submit>Add review</Submit>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
