import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateRange, formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Request received",
  robots: { index: false, follow: false },
};

export default async function ThankYouPage({ searchParams }: PageProps<"/inquiry/thank-you">) {
  const { ref } = await searchParams;
  const reference = typeof ref === "string" && /^PT-[A-Z0-9]{5,12}$/.test(ref) ? ref : null;
  // Only non-sensitive fields are shown, and only for 24 hours after submission.
  const since = new Date(new Date().getTime() - 1000 * 60 * 60 * 24);
  const inquiry = reference
    ? await prisma.inquiry.findFirst({
        where: { reference, createdAt: { gte: since } },
        select: {
          reference: true,
          travellers: true,
          pricePerPerson: true,
          trip: { select: { title: true, slug: true } },
          departure: { select: { startDate: true, endDate: true } },
        },
      })
    : null;

  return (
    <div className="container-x py-20 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow text-brass-deep">Request received</p>
        <h1 className="mt-4 text-5xl sm:text-6xl">Thank you — we&apos;ll be in touch.</h1>
        <p className="mt-5 text-lg text-muted">
          Your seats are held while we review your request. A member of our team will contact you, usually within one
          working day. No payment has been taken.
        </p>

        {inquiry ? (
          <dl className="mx-auto mt-10 max-w-md divide-y divide-line border-y border-ink text-left">
            <div className="flex justify-between gap-4 py-3">
              <dt className="eyebrow text-muted">Reference</dt>
              <dd className="font-mono text-sm">{inquiry.reference}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="eyebrow text-muted">Journey</dt>
              <dd className="text-right">{inquiry.trip.title}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="eyebrow text-muted">Dates</dt>
              <dd className="text-right">{formatDateRange(inquiry.departure.startDate, inquiry.departure.endDate)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="eyebrow text-muted">Travellers</dt>
              <dd>{inquiry.travellers}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="eyebrow text-muted">Estimated total</dt>
              <dd className="font-serif text-xl">{formatPrice(inquiry.pricePerPerson * inquiry.travellers)}</dd>
            </div>
          </dl>
        ) : (
          reference && <p className="mt-8 text-sm text-muted">Your reference: <span className="font-mono">{reference}</span></p>
        )}

        <p className="mt-10 text-sm text-muted">
          Questions in the meantime? Write to <a href={`mailto:${site.email}`} className="link-underline text-ink">{site.email}</a>
          {reference ? " quoting your reference." : "."}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/trips" className="btn btn-outline">Keep browsing</Link>
          <Link href="/" className="btn btn-primary">Home</Link>
        </div>
      </div>
    </div>
  );
}
