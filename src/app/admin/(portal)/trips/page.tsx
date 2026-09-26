import Image from "next/image";
import Link from "next/link";
import { AdminHeader, StatusPill } from "@/components/admin/bits";
import { EmptyState } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { todayUtc, tripStatusLabels, tripTypeLabels } from "@/lib/format";
import type { TripStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Trips" };

const tabs: (TripStatus | "ALL")[] = ["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"];

export default async function AdminTrips({ searchParams }: PageProps<"/admin/trips">) {
  await requireAdmin();
  const { status } = await searchParams;
  const current = tabs.includes(status as TripStatus) ? (status as TripStatus | "ALL") : "ALL";
  const today = todayUtc();
  const trips = await prisma.trip.findMany({
    where: current === "ALL" ? undefined : { status: current },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      _count: { select: { inquiries: { where: { status: "NEW" } } } },
      departures: { where: { startDate: { gt: today } }, select: { id: true } },
    },
  });

  return (
    <>
      <AdminHeader title="Trips" action={<Link href="/admin/trips/new" className="btn btn-primary btn-sm">New trip</Link>} />
      <nav aria-label="Filter by status" className="mb-6 flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t}
            href={t === "ALL" ? "/admin/trips" : `/admin/trips?status=${t}`}
            aria-current={current === t ? "page" : undefined}
            className={`px-3 py-1.5 text-sm ${current === t ? "bg-ink text-paper" : "border border-line hover:border-ink"}`}
          >
            {t === "ALL" ? "All" : tripStatusLabels[t]}
          </Link>
        ))}
      </nav>

      {trips.length ? (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-paper-deep">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Trip</th>
                <th scope="col" className="px-4 py-3 font-semibold">Type</th>
                <th scope="col" className="px-4 py-3 font-semibold">Upcoming dates</th>
                <th scope="col" className="px-4 py-3 font-semibold">New inquiries</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {trips.map((t) => (
                <tr key={t.id} className="hover:bg-paper-deep">
                  <td className="px-4 py-3">
                    <Link href={`/admin/trips/${t.id}`} className="flex items-center gap-3">
                      <span className="relative h-12 w-16 shrink-0 overflow-hidden bg-linen">
                        <Image src={t.coverImageUrl} alt="" fill sizes="64px" className="object-cover" />
                      </span>
                      <span>
                        <span className="block font-medium hover:text-oxblood">{t.title}</span>
                        <span className="text-xs text-muted">
                          {t.destination}, {t.country} · /{t.slug}
                          {t.isSample && <span className="ml-2 text-oxblood">sample</span>}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">{tripTypeLabels[t.tripType]}</td>
                  <td className="px-4 py-3">{t.departures.length}</td>
                  <td className="px-4 py-3">{t._count.inquiries || "—"}</td>
                  <td className="px-4 py-3"><StatusPill status={t.status} label={tripStatusLabels[t.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No trips here yet" action={<Link href="/admin/trips/new" className="btn btn-primary">Create a trip</Link>} />
      )}
    </>
  );
}
