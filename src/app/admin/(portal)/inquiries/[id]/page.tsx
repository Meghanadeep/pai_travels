import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, Field, Submit } from "@/components/admin/action-form";
import { AdminHeader, Panel, StatusPill } from "@/components/admin/bits";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { seatsAvailable } from "@/lib/departures";
import { formatDateRange, formatDateTime, formatPrice, inquiryStatusLabels } from "@/lib/format";
import { updateInquiry } from "../../../actions";
import type { InquiryStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Inquiry" };

export default async function InquiryPage({ params }: PageProps<"/admin/inquiries/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: { trip: { select: { id: true, title: true, slug: true } }, departure: true },
  });
  if (!inquiry) notFound();
  const d = inquiry.departure;

  const rows: [string, React.ReactNode][] = [
    ["Reference", <span key="r" className="font-mono">{inquiry.reference}</span>],
    ["Name", inquiry.fullName],
    ["Email", <a key="e" className="link-underline" href={`mailto:${inquiry.email}?subject=${encodeURIComponent(`Your inquiry ${inquiry.reference}`)}`}>{inquiry.email}</a>],
    ["Phone", <a key="p" className="link-underline" href={`tel:${inquiry.phone.replace(/\s/g, "")}`}>{inquiry.phone}</a>],
    ["Country", inquiry.country || "—"],
    ["Trip", <Link key="t" className="link-underline" href={`/admin/trips/${inquiry.trip.id}#departures`}>{inquiry.trip.title}</Link>],
    ["Departure", formatDateRange(d.startDate, d.endDate)],
    ["Travellers", inquiry.travellers],
    ["Quoted price", `${formatPrice(inquiry.pricePerPerson)} per person · ${formatPrice(inquiry.pricePerPerson * inquiry.travellers)} total`],
    ["Received", formatDateTime(inquiry.createdAt)],
    ["Seats", inquiry.holdsSeats ? `Holding ${inquiry.travellers} seat(s)` : "Not holding seats"],
  ];

  return (
    <>
      <AdminHeader
        back={{ href: "/admin/inquiries", label: "Inquiries" }}
        title={<span className="flex flex-wrap items-center gap-3">{inquiry.fullName}<StatusPill status={inquiry.status} label={inquiryStatusLabels[inquiry.status]} /></span>}
      />
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Request">
          <dl className="divide-y divide-line text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[9rem_1fr] gap-3 py-2.5">
                <dt className="text-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {inquiry.message && (
            <div className="mt-5 border-t border-line pt-4">
              <h3 className="eyebrow text-muted">Message</h3>
              <p className="mt-2 whitespace-pre-line">{inquiry.message}</p>
            </div>
          )}
        </Panel>
        <div className="space-y-8">
          <Panel
            title="Update"
            description="Declined or Cancelled releases this inquiry's seats. Moving back to an active status re-claims them if available."
          >
            <ActionForm action={updateInquiry.bind(null, inquiry.id)}>
              <Field
                name="status"
                label="Status"
                type="select"
                defaultValue={inquiry.status}
                options={(Object.keys(inquiryStatusLabels) as InquiryStatus[]).map((s) => ({ value: s, label: inquiryStatusLabels[s] }))}
              />
              <Field name="adminNotes" label="Internal notes" type="textarea" rows={5} defaultValue={inquiry.adminNotes} hint="Never shown to the customer." />
              <Submit>Save</Submit>
            </ActionForm>
          </Panel>
          <Panel title="Departure capacity">
            <p className="text-sm">
              {d.seatsReserved} of {d.capacity} seats held · <strong>{seatsAvailable(d)} available</strong>
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
