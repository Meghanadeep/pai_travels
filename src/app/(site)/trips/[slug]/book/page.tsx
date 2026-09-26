import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SampleBadge } from "@/components/ui";
import { effectivePrice, isBookable, isEarlyBirdActive, seatsAvailable } from "@/lib/departures";
import { formatDateRange, formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import { getPublishedTrip } from "@/lib/trips";
import { InquiryForm, type DepartureOption } from "./inquiry-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Request to book",
  robots: { index: false, follow: false },
};

export default async function BookPage({ params, searchParams }: PageProps<"/trips/[slug]/book">) {
  const { slug } = await params;
  const { departure } = await searchParams;
  const trip = await getPublishedTrip(slug);
  if (!trip) notFound();

  const options: DepartureOption[] = trip.departures.filter((d) => isBookable(d)).map((d) => ({
    id: d.id,
    label: formatDateRange(d.startDate, d.endDate),
    price: effectivePrice(d),
    priceLabel: formatPrice(effectivePrice(d)),
    standardPriceLabel: isEarlyBirdActive(d) ? formatPrice(d.price) : null,
    seatsLeft: seatsAvailable(d),
  }));

  return (
    <div className="container-x py-12 sm:py-16">
      <nav aria-label="Breadcrumb" className="eyebrow text-muted">
        <Link href="/trips" className="hover:text-oxblood">Journeys</Link>
        <span aria-hidden className="mx-2">/</span>
        <Link href={`/trips/${trip.slug}`} className="hover:text-oxblood">{trip.title}</Link>
        <span aria-hidden className="mx-2">/</span>
        <span aria-current="page">Request</span>
      </nav>
      <header className="mt-6 border-b border-ink pb-8">
        {trip.isSample && <SampleBadge className="mb-3" />}
        <p className="eyebrow text-brass-deep">Booking request</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">{trip.title}</h1>
        <p className="mt-3 text-muted">
          {trip.destination}, {trip.country} · {trip.durationDays} days{trip.groupSizeMax ? ` · up to ${trip.groupSizeMax} travellers` : ""}
        </p>
      </header>

      <div className="mt-10">
        {options.length ? (
          <InquiryForm
            departures={options}
            initialDepartureId={typeof departure === "string" ? departure : undefined}
            groupSizeMax={trip.groupSizeMax ?? 20}
            currency={site.currency}
            locale={site.locale}
          />
        ) : (
          <div className="max-w-xl">
            <p className="font-serif text-3xl">No departures are open for requests right now.</p>
            <p className="mt-3 text-muted">All current dates are full, closed or have already left. We can let you know when new dates are added.</p>
            <div className="mt-6 flex gap-3">
              <Link href="/contact" className="btn btn-primary">Register interest</Link>
              <Link href="/trips" className="btn btn-outline">Other journeys</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
