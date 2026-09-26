import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CompareToggle } from "@/components/compare";
import { SampleBadge, Stars } from "@/components/ui";
import {
  availability,
  availabilityLabels,
  effectivePrice,
  isBookable,
  isEarlyBirdActive,
  seatsAvailable,
} from "@/lib/departures";
import { getAdmin } from "@/lib/auth";
import { durationLabel, formatDate, formatDateRange, formatPrice, groupSizeLabel, tripTypeLabels } from "@/lib/format";
import { site } from "@/lib/site";
import { getPublishedTrip } from "@/lib/trips";

export const dynamic = "force-dynamic";

// Signed-in admins can preview drafts (and ended offers) at the same URL.
const getTrip = cache(async (slug: string) => {
  const published = await getPublishedTrip(slug);
  if (published) return { trip: published, preview: false };
  if (!(await getAdmin())) return { trip: null, preview: false };
  return { trip: await getPublishedTrip(slug, { includeDrafts: true }), preview: true };
});

export async function generateMetadata({ params }: PageProps<"/trips/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { trip, preview } = await getTrip(slug);
  if (!trip) return { title: "Journey not found" };
  if (preview) return { title: `Preview: ${trip.title}`, robots: { index: false, follow: false } };
  const title = trip.seoTitle || `${trip.title} — ${trip.destination}, ${trip.country}`;
  const description = trip.seoDescription || trip.summary;
  return {
    title,
    description,
    alternates: { canonical: `/trips/${trip.slug}` },
    openGraph: { title, description, images: [{ url: trip.coverImageUrl, alt: trip.coverImageAlt }] },
    robots: trip.isSample ? { index: false, follow: true } : undefined,
  };
}

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="prose-journal text-[1.02rem] leading-relaxed text-ink-soft">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

function Block({ id, label, title, children }: { id: string; label: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 border-t border-line py-12">
      <p className="eyebrow text-brass-deep">{label}</p>
      <h2 id={`${id}-h`} className="mt-2 text-4xl">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default async function TripPage({ params }: PageProps<"/trips/[slug]">) {
  const { slug } = await params;
  const { trip, preview } = await getTrip(slug);
  if (!trip) notFound();

  const bookable = trip.departures.filter((d) => isBookable(d));
  const prices = bookable.map((d) => effectivePrice(d));
  const isPackage = !trip.departures.length && trip.priceFrom != null;
  const fromPrice = prices.length ? Math.min(...prices) : trip.priceFrom;
  const gallery = trip.images.length ? trip.images : [{ id: "cover", url: trip.coverImageUrl, alt: trip.coverImageAlt }];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: trip.title,
    description: trip.summary,
    image: trip.coverImageUrl,
    url: `${site.url}/trips/${trip.slug}`,
    touristType: tripTypeLabels[trip.tripType],
    itinerary: {
      "@type": "ItemList",
      itemListElement: trip.itinerary.map((d) => ({ "@type": "ListItem", position: d.dayNumber, name: d.title })),
    },
    offers: bookable.map((d) => ({
      "@type": "Offer",
      price: effectivePrice(d),
      priceCurrency: site.currency,
      availability: seatsAvailable(d) > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      validFrom: new Date().toISOString().slice(0, 10),
      availabilityStarts: d.startDate.toISOString().slice(0, 10),
      availabilityEnds: d.endDate.toISOString().slice(0, 10),
    })),
    provider: { "@type": "TravelAgency", name: site.name, url: site.url },
  };

  const contactEmail = trip.contactEmail || site.email;
  const contactPhone = trip.contactPhone || site.phone;
  const toc = [
    ["overview", "Overview"],
    ["itinerary", "Itinerary"],
    ["dates", "Dates & prices"],
    ["details", "Stay, travel & meals"],
    ["inclusions", "What’s included"],
    ["practical", "Before you go"],
    ["gallery", "Gallery"],
    ["faqs", "FAQs"],
  ];

  return (
    <>
      {preview && (
        <div role="status" className="sticky top-16 z-30 border-b border-brass bg-brass px-4 py-2 text-center text-sm text-ink">
          <strong>Preview</strong> — only you can see this. This trip is {trip.status === "PUBLISHED" ? "published but its offer has ended" : trip.status.toLowerCase()}, so it isn&apos;t on the public site.
        </div>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-ink text-paper">
        <Image src={trip.coverImageUrl} alt={trip.coverImageAlt} fill priority sizes="100vw" className="-z-10 object-cover opacity-75" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/35 to-ink/20" />
        <div className="container-x flex min-h-[70svh] flex-col justify-end pb-12 pt-28">
          <nav aria-label="Breadcrumb" className="eyebrow mb-6 text-paper/70">
            <Link href="/trips" className="hover:text-paper">Journeys</Link>
            <span aria-hidden className="mx-2">/</span>
            <span aria-current="page">{trip.destination}</span>
          </nav>
          {trip.isSample && <SampleBadge className="mb-4 w-fit" />}
          <p className="eyebrow text-brass">
            {trip.destination} · {trip.country} · {tripTypeLabels[trip.tripType]}
          </p>
          <h1 className="mt-3 max-w-4xl text-5xl sm:text-7xl">{trip.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-paper/80">{trip.summary}</p>
        </div>
      </section>

      {/* ── Key facts ──────────────────────────────────────────────────── */}
      <div className="border-b border-line bg-paper-deep">
        <dl className="container-x grid grid-cols-2 gap-y-5 py-6 text-sm sm:grid-cols-4">
          <div>
            <dt className="eyebrow text-[0.6rem] text-muted">Duration</dt>
            <dd className="mt-1 font-serif text-xl">{durationLabel(trip.durationDays)}</dd>
          </div>
          <div>
            <dt className="eyebrow text-[0.6rem] text-muted">Group size</dt>
            <dd className="mt-1 font-serif text-xl">{groupSizeLabel(trip.groupSizeMin, trip.groupSizeMax)}</dd>
          </div>
          <div>
            <dt className="eyebrow text-[0.6rem] text-muted">{isPackage ? "Travel dates" : "Upcoming dates"}</dt>
            <dd className="mt-1 font-serif text-xl">
              {isPackage ? (trip.validUntil ? `Until ${formatDate(trip.validUntil)}` : "On request") : bookable.length || "None open"}
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-[0.6rem] text-muted">From, per person</dt>
            <dd className="mt-1 font-serif text-xl">{fromPrice != null ? formatPrice(fromPrice) : "On request"}</dd>
          </div>
        </dl>
      </div>

      {trip.isSample && (
        <div className="container-x mt-8">
          <p className="border-l-2 border-oxblood bg-oxblood/5 px-4 py-3 text-sm text-oxblood">
            This is a <strong>sample trip</strong> created to demonstrate the website. Its itinerary, prices and dates are
            placeholders and do not describe a real departure.
          </p>
        </div>
      )}

      <div className="container-x grid gap-12 pb-20 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          <nav aria-label="On this page" className="sticky top-16 z-20 -mx-4 overflow-x-auto border-b border-line bg-paper/95 px-4 backdrop-blur sm:mx-0 sm:px-0">
            <ul className="flex gap-6 whitespace-nowrap py-4">
              {toc.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="eyebrow text-ink-soft hover:text-oxblood">{label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <Block id="overview" label="The journey" title="Overview">
            <Paragraphs text={trip.overview} />
            {trip.highlights.length > 0 && (
              <>
                <h3 className="mt-10 text-2xl">Highlights</h3>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {trip.highlights.map((h) => (
                    <li key={h} className="flex gap-3 border-t border-line pt-3">
                      <span aria-hidden className="font-serif text-brass-deep">✦</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Block>

          <Block id="itinerary" label="Day by day" title="Itinerary">
            {trip.itinerary.length ? (
              <ol className="relative border-l border-line pl-8">
                {trip.itinerary.map((day) => (
                  <li key={day.id} className="relative pb-8 last:pb-0">
                    <span aria-hidden className="absolute -left-[2.55rem] top-0 grid h-5 w-5 place-items-center rounded-full border border-ink bg-paper text-[0.6rem] font-semibold">
                      {day.dayNumber}
                    </span>
                    <p className="eyebrow text-brass-deep">Day {day.dayNumber}</p>
                    <h3 className="mt-1 text-2xl">{day.title}</h3>
                    <p className="mt-2 leading-relaxed text-ink-soft">{day.description}</p>
                    {(day.meals || day.overnight) && (
                      <p className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
                        {day.meals && <span><span className="font-semibold text-ink-soft">Meals:</span> {day.meals}</span>}
                        {day.overnight && <span><span className="font-semibold text-ink-soft">Overnight:</span> {day.overnight}</span>}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted">The detailed itinerary is being finalised. Ask us for the latest version.</p>
            )}
          </Block>

          <Block id="dates" label="Availability" title="Dates & prices">
            {trip.departures.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <caption className="sr-only">Upcoming departures with prices per person and seats available</caption>
                  <thead>
                    <tr className="border-b border-ink">
                      <th scope="col" className="eyebrow py-3 pr-4 font-semibold">Dates</th>
                      <th scope="col" className="eyebrow py-3 pr-4 font-semibold">Price per person</th>
                      <th scope="col" className="eyebrow py-3 pr-4 font-semibold">Seats</th>
                      <th scope="col" className="eyebrow py-3 pr-4 font-semibold">Status</th>
                      <th scope="col" className="py-3"><span className="sr-only">Action</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {trip.departures.map((d) => {
                      const state = availability(d);
                      const ok = isBookable(d);
                      const early = isEarlyBirdActive(d);
                      const left = seatsAvailable(d);
                      return (
                        <tr key={d.id} className={`border-b border-line align-top ${ok ? "" : "text-muted"}`}>
                          <td className="py-4 pr-4">
                            <span className="font-serif text-xl text-ink">{formatDateRange(d.startDate, d.endDate)}</span>
                            {d.note && <span className="block text-xs text-muted">{d.note}</span>}
                          </td>
                          <td className="py-4 pr-4">
                            {early ? (
                              <>
                                <span className="font-serif text-xl text-ink">{formatPrice(effectivePrice(d))}</span>{" "}
                                <s className="text-muted" aria-label={`was ${formatPrice(d.price)}`}>{formatPrice(d.price)}</s>
                                <span className="block text-xs text-brass-deep">Early bird until {formatDate(d.earlyBirdEndsAt!)}</span>
                              </>
                            ) : (
                              <span className="font-serif text-xl text-ink">{formatPrice(d.price)}</span>
                            )}
                          </td>
                          <td className="py-4 pr-4">{state === "closed" ? "—" : `${left} of ${d.capacity} left`}</td>
                          <td className="py-4 pr-4">
                            <span className={`eyebrow text-[0.62rem] ${state === "limited" ? "text-oxblood" : state === "available" ? "text-success" : "text-muted"}`}>
                              {availabilityLabels[state]}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {ok ? (
                              <Link href={`/trips/${trip.slug}/book?departure=${d.id}`} className="btn btn-primary btn-sm">
                                Request<span className="sr-only"> {formatDateRange(d.startDate, d.endDate)}</span>
                              </Link>
                            ) : (
                              <span className="text-xs">Unavailable</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : isPackage || trip.priceNote ? (
              <div className="border border-ink/20 bg-paper-deep p-6">
                <p className="eyebrow text-[0.6rem] text-muted">Package price, per person</p>
                <p className="mt-1 font-serif text-4xl">{trip.priceFrom != null ? `From ${formatPrice(trip.priceFrom)}` : "On request"}</p>
                {trip.priceNote && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{trip.priceNote}</p>}
                <p className="mt-3 text-sm text-ink-soft">
                  {trip.validUntil ? `Travel on dates that suit you, until ${formatDate(trip.validUntil)}.` : "Travel on dates that suit you."} Rates and
                  availability change, so we&apos;ll confirm yours when you get in touch.
                </p>
              </div>
            ) : (
              <p className="text-muted">
                No upcoming departures are scheduled. <Link href="/contact" className="link-underline text-ink">Contact us</Link> to hear when new dates open.
              </p>
            )}
            <p className="mt-4 text-xs text-muted">
              Past departures are not shown. Prices are per person, twin share. Sending a request does not charge you anything.
            </p>
          </Block>

          <Block id="details" label="On the road" title="Stay, travel & meals">
            <div className="grid gap-8 md:grid-cols-3">
              {[
                ["Accommodation", trip.accommodation],
                ["Transport", trip.transport],
                ["Meals", trip.meals],
              ].map(([label, text]) => (
                <div key={label} className="border-t border-ink pt-4">
                  <h3 className="text-2xl">{label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft whitespace-pre-line">{text}</p>
                </div>
              ))}
            </div>
          </Block>

          <Block id="inclusions" label="The fine print" title="What’s included">
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <h3 className="eyebrow text-success">Included</h3>
                <ul className="mt-4 space-y-2">
                  {trip.inclusions.map((x) => (
                    <li key={x} className="flex gap-3"><span aria-hidden className="text-success">✓</span>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="eyebrow text-oxblood">Not included</h3>
                <ul className="mt-4 space-y-2">
                  {trip.exclusions.map((x) => (
                    <li key={x} className="flex gap-3"><span aria-hidden className="text-oxblood">×</span>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Block>

          <Block id="practical" label="Practicalities" title="Before you go">
            <dl className="divide-y divide-line border-y border-line">
              {[
                ["Meeting point", trip.meetingPoint],
                ["Travel requirements", trip.requirements],
                ["Cancellation policy", trip.cancellationPolicy],
              ].map(([label, text]) => (
                <div key={label} className="grid gap-2 py-5 md:grid-cols-[12rem_1fr]">
                  <dt className="eyebrow pt-1 text-ink">{label}</dt>
                  <dd className="whitespace-pre-line leading-relaxed text-ink-soft">{text}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-muted">
              See also our general <Link href="/cancellation-policy" className="link-underline text-ink">cancellation policy</Link> and{" "}
              <Link href="/terms" className="link-underline text-ink">terms</Link>.
            </p>
          </Block>

          <Block id="gallery" label="Pictures" title="Gallery">
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {gallery.map((img, i) => (
                <li key={img.id} className={`relative overflow-hidden bg-linen ${i === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-auto" : "aspect-square"}`}>
                  <Image src={img.url} alt={img.alt} fill sizes={i === 0 ? "(min-width: 768px) 45vw, 100vw" : "(min-width: 768px) 22vw, 50vw"} className="object-cover" />
                </li>
              ))}
            </ul>
          </Block>

          <Block id="faqs" label="Questions" title="FAQs">
            {trip.faqs.length ? (
              <div className="divide-y divide-line border-y border-line">
                {trip.faqs.map((f) => (
                  <details key={f.id} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-xl">
                      {f.question}
                      <span aria-hidden className="text-2xl transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 leading-relaxed text-ink-soft">{f.answer}</p>
                  </details>
                ))}
              </div>
            ) : (
              <p className="text-muted">Have a question? We&apos;re happy to help — see contact details alongside.</p>
            )}
          </Block>

          {trip.reviews.length > 0 && (
            <section className="border-t border-line py-12">
              <h2 className="text-3xl">Traveller notes</h2>
              <ul className="mt-6 grid gap-6 md:grid-cols-2">
                {trip.reviews.map((r) => (
                  <li key={r.id} className="border border-line p-5">
                    <div className="flex items-center justify-between">
                      <Stars rating={r.rating} />
                      {r.isSample && <span className="eyebrow text-[0.55rem] text-oxblood">Sample review</span>}
                    </div>
                    <p className="mt-3 font-serif text-lg italic">“{r.body}”</p>
                    <p className="mt-3 text-sm text-muted">— {r.name}{r.location ? `, ${r.location}` : ""}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ── Booking panel ────────────────────────────────────────────── */}
        <aside className="lg:pt-8">
          <div className="sticky top-24 space-y-6">
            <div className="border border-ink bg-paper p-6">
              <p className="eyebrow text-muted">From, per person</p>
              <p className="mt-1 font-serif text-4xl">{fromPrice != null ? formatPrice(fromPrice) : "On request"}</p>
              <p className="mt-2 text-sm text-muted">
                {bookable.length
                  ? `${bookable.length} upcoming departure${bookable.length === 1 ? "" : "s"}`
                  : isPackage
                    ? trip.validUntil ? `Any date until ${formatDate(trip.validUntil)}` : "Dates on request"
                    : "No dates open right now"}
              </p>
              {bookable.length > 0 ? (
                <Link href={`/trips/${trip.slug}/book`} className="btn btn-accent mt-6 w-full">Request to book</Link>
              ) : isPackage ? (
                <a href={`tel:${(trip.contactPhone || site.phone).replace(/\s/g, "")}`} className="btn btn-accent mt-6 w-full">Call to book</a>
              ) : (
                <Link href="/contact" className="btn btn-primary mt-6 w-full">Register interest</Link>
              )}
              {isPackage ? (
                <Link href="/contact" className="btn btn-outline mt-3 w-full">Send an enquiry</Link>
              ) : (
                <a href="#dates" className="btn btn-outline mt-3 w-full">See all dates</a>
              )}
              <div className="mt-5 flex justify-center">
                <CompareToggle slug={trip.slug} title={trip.title} />
              </div>
              <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
                No payment is taken online. We&apos;ll confirm availability and next steps personally.
              </p>
            </div>
            <div className="border border-line p-6 text-sm">
              <h2 className="eyebrow">Questions about this trip?</h2>
              <ul className="mt-4 space-y-2">
                <li><a className="link-underline" href={`mailto:${contactEmail}?subject=${encodeURIComponent(trip.title)}`}>{contactEmail}</a></li>
                <li><a className="link-underline" href={`tel:${contactPhone.replace(/\s/g, "")}`}>{contactPhone}</a></li>
                <li className="text-muted">{site.hours}</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
