import Image from "next/image";
import Link from "next/link";
import { TripCard } from "@/components/trip-card";
import { SampleBadge, SectionHeading, Stars } from "@/components/ui";
import { effectivePrice, seatsAvailable } from "@/lib/departures";
import { formatMonth, formatPrice, tripTypeBlurbs, tripTypeLabels } from "@/lib/format";
import {
  TRIP_TYPES,
  getDestinations,
  getFeaturedTrips,
  getPublishedReviews,
  getTripTypeCounts,
  getUpcomingDepartures,
} from "@/lib/trips";

export const dynamic = "force-dynamic";

const HERO = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80";

const principles = [
  { n: "I", title: "Small by design", body: "Groups are capped per departure, so every trip keeps its pace and its welcome." },
  { n: "II", title: "Dated & priced plainly", body: "Every departure lists its dates, price and seats remaining — no guesswork." },
  { n: "III", title: "Inquire first, pay later", body: "Send a request, talk it through with us, and confirm only when it feels right." },
];

export default async function HomePage() {
  const [destinations, featured, departures, typeCounts, reviews] = await Promise.all([
    getDestinations(),
    getFeaturedTrips(3),
    getUpcomingDepartures(6),
    getTripTypeCounts(),
    getPublishedReviews(3),
  ]);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="grain relative isolate overflow-hidden bg-ink text-paper">
        <Image src={HERO} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-70" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/60 via-ink/30 to-ink/85" />
        <div className="container-x relative z-10 flex min-h-[88svh] flex-col justify-end pb-12 pt-32 sm:pb-16">
          <p className="eyebrow text-brass">Small-group journeys · Fixed departures</p>
          <h1 className="mt-5 max-w-4xl text-5xl leading-[0.95] sm:text-7xl lg:text-8xl">
            Travel that leaves <em className="font-serif italic text-brass">room</em> for the place.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-paper/80 sm:text-lg">
            Considered itineraries, honest dates and a few fellow travellers. Find a journey, compare it with others, and
            ask us anything before you commit.
          </p>

          <form action="/trips" method="get" role="search" aria-label="Find a journey" className="mt-10 grid gap-px overflow-hidden border border-paper/25 bg-paper/25 sm:grid-cols-[1.3fr_1fr_1fr_auto]">
            <label className="flex flex-col gap-1 bg-ink/70 px-5 py-3 backdrop-blur">
              <span className="eyebrow text-[0.6rem] text-brass">Destination</span>
              <select name="destination" defaultValue="" className="bg-transparent py-1 text-paper outline-none [&>option]:text-ink">
                <option value="">Anywhere</option>
                {destinations.map((d) => (
                  <option key={d.destination} value={d.destination}>
                    {d.destination}, {d.country}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 bg-ink/70 px-5 py-3 backdrop-blur">
              <span className="eyebrow text-[0.6rem] text-brass">Month</span>
              <input type="month" name="month" className="bg-transparent py-1 text-paper outline-none [color-scheme:dark]" />
            </label>
            <label className="flex flex-col gap-1 bg-ink/70 px-5 py-3 backdrop-blur">
              <span className="eyebrow text-[0.6rem] text-brass">Style</span>
              <select name="type" defaultValue="" className="bg-transparent py-1 text-paper outline-none [&>option]:text-ink">
                <option value="">Any style</option>
                {TRIP_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {tripTypeLabels[t]}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn rounded-none bg-paper px-8 text-ink hover:bg-brass">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ── Principles ───────────────────────────────────────────────────── */}
      <section aria-label="How we travel" className="border-b border-line">
        <div className="container-x grid gap-10 py-14 md:grid-cols-3">
          {principles.map((p) => (
            <div key={p.n} className="flex gap-5">
              <span className="font-serif text-3xl italic text-brass-deep">{p.n}</span>
              <div>
                <h2 className="text-2xl">{p.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured ─────────────────────────────────────────────────────── */}
      <section className="container-x py-20 sm:py-28">
        <SectionHeading
          numeral="i."
          eyebrow="Featured journeys"
          title="Chosen for the season"
          intro="A few departures we are especially looking forward to."
          action={
            <Link href="/trips" className="btn btn-outline">
              View all journeys
            </Link>
          }
        />
        {featured.length ? (
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((t, i) => (
              <TripCard key={t.id} trip={t} priority={i === 0} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-muted">Journeys are being prepared — please check back soon.</p>
        )}
      </section>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      <section className="grain bg-moss text-paper">
        <div className="container-x relative z-10 py-20 sm:py-28">
          <p className="eyebrow flex items-center gap-3 text-brass">
            <span className="font-serif text-base normal-case italic tracking-normal">ii.</span>Ways to travel
          </p>
          <h2 className="mt-3 max-w-2xl text-4xl sm:text-5xl">Find the journey that suits your pace</h2>
          <ul className="mt-12 grid border-t border-paper/15 sm:grid-cols-2 lg:grid-cols-3">
            {TRIP_TYPES.map((t) => (
              <li key={t} className="border-b border-paper/15 sm:odd:border-r lg:border-r lg:[&:nth-child(3n)]:border-r-0">
                <Link href={`/trips?type=${t}`} className="group flex h-full items-start justify-between gap-6 p-6 transition-colors hover:bg-moss-deep sm:p-8">
                  <div>
                    <h3 className="text-3xl">{tripTypeLabels[t]}</h3>
                    <p className="mt-2 text-sm text-paper/65">{tripTypeBlurbs[t]}</p>
                  </div>
                  <span className="eyebrow shrink-0 text-brass">
                    {typeCounts[t] ?? 0} {typeCounts[t] === 1 ? "trip" : "trips"}
                    <span aria-hidden className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Upcoming departures ──────────────────────────────────────────── */}
      <section id="departures" className="container-x py-20 sm:py-28">
        <SectionHeading
          numeral="iii."
          eyebrow="Upcoming departures"
          title="Leaving soon"
          intro="Dates with seats still available. Prices are per person."
          action={
            <Link href="/trips?sort=departure-asc" className="btn btn-outline">
              All dates
            </Link>
          }
        />
        {departures.length ? (
          <ul className="mt-12 border-t border-ink">
            {departures.map((d) => {
              const left = seatsAvailable(d);
              const price = effectivePrice(d);
              return (
                <li key={d.id} className="border-b border-line">
                  <Link
                    href={`/trips/${d.trip.slug}#dates`}
                    className="group grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 py-5 transition-colors hover:bg-paper-deep sm:grid-cols-[6rem_1fr_10rem_10rem_auto] sm:px-3"
                  >
                    <span className="text-center leading-none">
                      <span className="block font-serif text-4xl">{d.startDate.getUTCDate()}</span>
                      <span className="eyebrow text-[0.6rem] text-brass-deep">{formatMonth(d.startDate)} {d.startDate.getUTCFullYear()}</span>
                    </span>
                    <span>
                      <span className="block font-serif text-2xl leading-tight group-hover:text-oxblood">{d.trip.title}</span>
                      <span className="text-sm text-muted">
                        {d.trip.destination}, {d.trip.country} · {d.trip.durationDays} days
                        {d.trip.isSample && <span className="ml-2 text-oxblood">(sample)</span>}
                      </span>
                    </span>
                    <span className={`hidden text-sm sm:block ${left <= 4 ? "text-oxblood" : "text-muted"}`}>
                      {left} seat{left === 1 ? "" : "s"} left
                    </span>
                    <span className="hidden font-serif text-2xl sm:block">
                      {formatPrice(price)}
                      {price < d.price && <span className="block font-sans text-xs text-brass-deep">Early bird</span>}
                    </span>
                    <span aria-hidden className="text-xl transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-10 text-muted">No departures are open right now. New dates are added regularly.</p>
        )}
      </section>

      {/* ── Reviews ──────────────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="border-y border-line bg-paper-deep">
          <div className="container-x py-20 sm:py-28">
            <SectionHeading numeral="iv." eyebrow="From our travellers" title="In their words" align="center" />
            <ul className="mt-14 grid gap-10 md:grid-cols-3">
              {reviews.map((r) => (
                <li key={r.id}>
                  <figure className="flex h-full flex-col border-t border-ink pt-6">
                    <div className="flex items-center justify-between gap-3">
                      <Stars rating={r.rating} />
                      {r.isSample && <SampleBadge label="Sample review" className="!text-[0.55rem]" />}
                    </div>
                    <blockquote className="mt-5 flex-1 font-serif text-2xl leading-snug italic">“{r.body}”</blockquote>
                    <figcaption className="mt-6 text-sm">
                      <span className="font-semibold">{r.name}</span>
                      {r.location && <span className="text-muted"> · {r.location}</span>}
                      {r.trip && r.trip.status === "PUBLISHED" && (
                        <Link href={`/trips/${r.trip.slug}`} className="mt-1 block text-brass-deep link-underline w-fit">
                          {r.trip.title}
                        </Link>
                      )}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="container-x py-20 sm:py-28">
        <div className="grid items-center gap-10 border border-ink p-8 sm:p-14 md:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="eyebrow text-brass-deep">Something particular in mind?</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">Tell us how you like to travel.</h2>
            <p className="mt-4 max-w-lg text-muted">
              Private departures, special occasions, or a question about a trip — write to us and a person will reply.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <Link href="/contact" className="btn btn-primary">
              Write to us
            </Link>
            <Link href="/trips" className="btn btn-outline">
              Browse journeys
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
