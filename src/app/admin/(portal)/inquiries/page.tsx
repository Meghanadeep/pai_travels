import Link from "next/link";
import { AdminHeader, StatusPill } from "@/components/admin/bits";
import { EmptyState } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateRange, formatDateTime, formatPrice, inquiryStatusLabels } from "@/lib/format";
import type { InquiryStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Inquiries" };

const statuses = Object.keys(inquiryStatusLabels) as InquiryStatus[];

export default async function InquiriesPage({ searchParams }: PageProps<"/admin/inquiries">) {
  await requireAdmin();
  const { status } = await searchParams;
  const current = statuses.includes(status as InquiryStatus) ? (status as InquiryStatus) : undefined;
  const inquiries = await prisma.inquiry.findMany({
    where: current ? { status: current } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { trip: { select: { title: true } }, departure: { select: { startDate: true, endDate: true } } },
  });

  return (
    <>
      <AdminHeader
        title="Booking inquiries"
        action={<a href={`/api/admin/inquiries/export${current ? `?status=${current}` : ""}`} className="btn btn-outline btn-sm">Export CSV</a>}
      />
      <nav aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/inquiries" aria-current={!current ? "page" : undefined} className={`px-3 py-1.5 text-sm ${!current ? "bg-ink text-paper" : "border border-line"}`}>All</Link>
        {statuses.map((s) => (
          <Link key={s} href={`/admin/inquiries?status=${s}`} aria-current={current === s ? "page" : undefined} className={`px-3 py-1.5 text-sm ${current === s ? "bg-ink text-paper" : "border border-line hover:border-ink"}`}>
            {inquiryStatusLabels[s]}
          </Link>
        ))}
      </nav>
      {inquiries.length ? (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="bg-paper-deep">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Guest</th>
                <th scope="col" className="px-4 py-3 font-semibold">Trip & departure</th>
                <th scope="col" className="px-4 py-3 font-semibold">Pax</th>
                <th scope="col" className="px-4 py-3 font-semibold">Estimate</th>
                <th scope="col" className="px-4 py-3 font-semibold">Received</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {inquiries.map((i) => (
                <tr key={i.id} className="hover:bg-paper-deep">
                  <td className="px-4 py-3">
                    <Link href={`/admin/inquiries/${i.id}`} className="font-medium hover:text-oxblood">{i.fullName}</Link>
                    <span className="block font-mono text-xs text-muted">{i.reference}</span>
                  </td>
                  <td className="px-4 py-3">
                    {i.trip.title}
                    <span className="block text-xs text-muted">{formatDateRange(i.departure.startDate, i.departure.endDate)}</span>
                  </td>
                  <td className="px-4 py-3">{i.travellers}</td>
                  <td className="px-4 py-3">{formatPrice(i.pricePerPerson * i.travellers)}</td>
                  <td className="px-4 py-3 text-xs">{formatDateTime(i.createdAt)}</td>
                  <td className="px-4 py-3"><StatusPill status={i.status} label={inquiryStatusLabels[i.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No inquiries">Inquiries submitted on the website will appear here.</EmptyState>
      )}
    </>
  );
}
