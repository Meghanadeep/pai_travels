import Link from "next/link";
import { AdminHeader, StatusPill } from "@/components/admin/bits";
import { EmptyState } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { tripStatusLabels } from "@/lib/format";
import { adminPhotoUrl, pastTripDateLabel } from "@/lib/past-trips";

export const metadata = { title: "Past trips" };

export default async function AdminPastTrips() {
  await requireAdmin();
  const trips = await prisma.pastTrip.findMany({
    orderBy: [{ status: "asc" }, { startDate: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
    include: {
      photos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 1, select: { id: true } },
      _count: { select: { photos: true, imports: true } },
    },
  });
  const approved = await prisma.pastTripPhoto.groupBy({ by: ["pastTripId"], where: { approvedAt: { not: null } }, _count: { _all: true } });
  const approvedFor = (id: string) => approved.find((a) => a.pastTripId === id)?._count._all ?? 0;

  return (
    <>
      <AdminHeader
        title="Past trips"
        action={<Link href="/admin/imports" className="btn btn-primary btn-sm">Import from images</Link>}
      />
      <p className="mb-6 max-w-3xl text-sm text-muted">
        Your travel history, shown on the website&apos;s Past Trips page once published. These are kept separate from bookable Trips and are never offered for booking.
      </p>
      {trips.length ? (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-paper-deep">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Trip</th>
                <th scope="col" className="px-4 py-3 font-semibold">Dates</th>
                <th scope="col" className="px-4 py-3 font-semibold">Photos approved</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {trips.map((t) => (
                <tr key={t.id} className="hover:bg-paper-deep">
                  <td className="px-4 py-3">
                    <Link href={`/admin/past-trips/${t.id}`} className="flex items-center gap-3">
                      <span className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden bg-linen text-[0.6rem] text-muted">
                        {t.photos[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element -- private, admin-only file
                          <img src={adminPhotoUrl(t.photos[0].id)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          "No photo"
                        )}
                      </span>
                      <span>
                        <span className="block font-medium hover:text-oxblood">{t.title}</span>
                        <span className="text-xs text-muted">{t.destination} · from {t._count.imports} import{t._count.imports === 1 ? "" : "s"}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">{pastTripDateLabel(t) ?? <span className="text-oxblood">Missing</span>}</td>
                  <td className="px-4 py-3">{approvedFor(t.id)} of {t._count.photos}</td>
                  <td className="px-4 py-3"><StatusPill status={t.status} label={tripStatusLabels[t.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No past trips yet" action={<Link href="/admin/imports" className="btn btn-primary">Import from images</Link>}>
          Upload photos or screenshots of trips you&apos;ve run, review what was read, and save them here.
        </EmptyState>
      )}
    </>
  );
}
