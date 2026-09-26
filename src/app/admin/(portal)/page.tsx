import Link from "next/link";
import { AdminHeader, StatusPill } from "@/components/admin/bits";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { seatsAvailable } from "@/lib/departures";
import { formatDateRange, formatDateTime, inquiryStatusLabels, todayUtc } from "@/lib/format";

export const metadata = { title: "Overview" };

export default async function AdminHome() {
  const admin = await requireAdmin();
  const today = todayUtc();
  const [published, drafts, newInquiries, newMessages, recent, upcoming] = await Promise.all([
    prisma.trip.count({ where: { status: "PUBLISHED" } }),
    prisma.trip.count({ where: { status: "DRAFT" } }),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.contactMessage.count({ where: { status: "NEW" } }),
    prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { trip: { select: { title: true } } } }),
    prisma.departure.findMany({
      where: { startDate: { gt: today }, status: "OPEN", trip: { status: "PUBLISHED" } },
      orderBy: { startDate: "asc" },
      take: 6,
      include: { trip: { select: { title: true, id: true } } },
    }),
  ]);

  const stats = [
    { label: "Published trips", value: published, href: "/admin/trips?status=PUBLISHED" },
    { label: "Drafts", value: drafts, href: "/admin/trips?status=DRAFT" },
    { label: "New inquiries", value: newInquiries, href: "/admin/inquiries?status=NEW" },
    { label: "New messages", value: newMessages, href: "/admin/messages" },
  ];

  return (
    <>
      <AdminHeader eyebrow={`Signed in as ${admin.name}`} title="Overview" action={<Link href="/admin/trips/new" className="btn btn-primary btn-sm">New trip</Link>} />
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="block border border-line bg-[#fbf9f4] p-5 hover:border-ink">
              <p className="eyebrow text-muted">{s.label}</p>
              <p className="mt-2 font-serif text-5xl">{s.value}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl">Recent inquiries</h2>
            <Link href="/admin/inquiries" className="text-sm link-underline">All</Link>
          </div>
          {recent.length ? (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {recent.map((i) => (
                <li key={i.id}>
                  <Link href={`/admin/inquiries/${i.id}`} className="flex items-center justify-between gap-4 py-3 hover:bg-paper-deep">
                    <span>
                      <span className="block font-medium">{i.fullName} · {i.travellers} pax</span>
                      <span className="text-xs text-muted">{i.trip.title} · {formatDateTime(i.createdAt)}</span>
                    </span>
                    <StatusPill status={i.status} label={inquiryStatusLabels[i.status]} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">No inquiries yet.</p>
          )}
        </section>

        <section>
          <h2 className="text-2xl">Next departures</h2>
          {upcoming.length ? (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {upcoming.map((d) => (
                <li key={d.id}>
                  <Link href={`/admin/trips/${d.trip.id}#departures`} className="flex items-center justify-between gap-4 py-3 hover:bg-paper-deep">
                    <span>
                      <span className="block font-medium">{d.trip.title}</span>
                      <span className="text-xs text-muted">{formatDateRange(d.startDate, d.endDate)}</span>
                    </span>
                    <span className="text-sm">{d.seatsReserved}/{d.capacity} held · {seatsAvailable(d)} left</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">No open departures.</p>
          )}
        </section>
      </div>
    </>
  );
}
