import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getPublishedPastTrip, pastTripDateLabel, photoUrl } from "@/lib/past-trips";

export const dynamic = "force-dynamic";

const getTrip = cache(getPublishedPastTrip);

export async function generateMetadata({ params }: PageProps<"/past-trips/[slug]">): Promise<Metadata> {
  const trip = await getTrip((await params).slug);
  if (!trip) return { title: "Trip not found" };
  return {
    title: `${trip.title} — past trip`,
    description: trip.summary,
    alternates: { canonical: `/past-trips/${trip.slug}` },
  };
}

export default async function PastTripPage({ params }: PageProps<"/past-trips/[slug]">) {
  const trip = await getTrip((await params).slug);
  if (!trip) notFound();
  const [cover, ...rest] = trip.photos;
  const date = pastTripDateLabel(trip);
  const itinerary = trip.itinerary?.split("\n").map((l) => l.trim()).filter(Boolean) ?? [];

  const facts = [
    ["When", date],
    ["Duration", trip.durationText],
    ["Stayed", trip.accommodation],
    ["Price at the time", trip.priceNote],
  ].filter((f): f is [string, string] => Boolean(f[1]));

  return (
    <article>
      <header className={`grain relative isolate overflow-hidden text-paper ${cover ? "bg-ink" : "bg-moss"}`}>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element -- served unoptimized so withdrawn approvals take effect immediately
          <img src={photoUrl(cover.id)} alt={cover.alt} className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70" />
        )}
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/30 to-ink/20" />
        <div className={`container-x relative z-10 flex flex-col justify-end pb-12 pt-28 ${cover ? "min-h-[62svh]" : "min-h-[40svh]"}`}>
          <nav aria-label="Breadcrumb" className="eyebrow mb-6 text-paper/70">
            <Link href="/past-trips" className="hover:text-paper">Past trips</Link>
            <span aria-hidden className="mx-2">/</span>
            <span aria-current="page">{trip.destination}</span>
          </nav>
          <p className="eyebrow text-brass">Completed trip{date ? ` · ${date}` : ""}</p>
          <h1 className="mt-3 max-w-4xl text-5xl sm:text-7xl">{trip.title}</h1>
          <p className="mt-4 text-lg text-paper/80">{[trip.destination, trip.country].filter(Boolean).join(", ")}</p>
        </div>
      </header>

      <div className="container-x grid gap-12 py-14 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-12">
          <section>
            <p className="font-serif text-2xl leading-snug">{trip.summary}</p>
            <div className="prose-journal mt-6 text-[1.02rem] leading-relaxed text-ink-soft">
              {trip.description.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>

          {trip.places.length > 0 && (
            <section aria-labelledby="places-h" className="border-t border-line pt-10">
              <h2 id="places-h" className="text-3xl">Where we went</h2>
              <ul className="mt-5 flex flex-wrap gap-2">
                {trip.places.map((p) => (
                  <li key={p} className="border border-ink/20 px-3 py-1.5 text-sm">{p}</li>
                ))}
              </ul>
            </section>
          )}

          {itinerary.length > 0 && (
            <section aria-labelledby="itin-h" className="border-t border-line pt-10">
              <h2 id="itin-h" className="text-3xl">The route</h2>
              <ol className="mt-6 space-y-4 border-l border-line pl-6">
                {itinerary.map((line, i) => (
                  <li key={i} className="relative">
                    <span aria-hidden className="absolute -left-[1.85rem] top-2 h-2.5 w-2.5 rounded-full border border-ink bg-paper" />
                    {line}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {trip.activities.length > 0 && (
            <section aria-labelledby="act-h" className="border-t border-line pt-10">
              <h2 id="act-h" className="text-3xl">What we did</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {trip.activities.map((a) => (
                  <li key={a} className="flex gap-3 border-t border-line pt-3">
                    <span aria-hidden className="font-serif text-brass-deep">✦</span>
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {rest.length > 0 && (
            <section aria-labelledby="photos-h" className="border-t border-line pt-10">
              <h2 id="photos-h" className="text-3xl">Photos</h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {rest.map((p) => (
                  <li key={p.id} className="overflow-hidden bg-linen">
                    {/* eslint-disable-next-line @next/next/no-img-element -- served unoptimized so withdrawn approvals take effect immediately */}
                    <img src={`${photoUrl(p.id)}?w=800`} alt={p.alt} loading="lazy" className="h-full w-full object-cover" />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:pt-2">
          {facts.length > 0 && (
            <dl className="divide-y divide-line border-y border-ink">
              {facts.map(([k, v]) => (
                <div key={k} className="py-4">
                  <dt className="eyebrow text-[0.6rem] text-muted">{k}</dt>
                  <dd className="mt-1 whitespace-pre-line">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="border border-line bg-paper-deep p-6 text-sm">
            <p className="font-serif text-2xl">This trip has already taken place</p>
            <p className="mt-2 text-muted">It can&apos;t be booked. Take a look at what&apos;s coming up, or ask us about running it again.</p>
            <Link href="/trips" className="btn btn-primary mt-5 w-full">Upcoming journeys</Link>
            <Link href="/contact" className="btn btn-outline mt-3 w-full">Ask us</Link>
          </div>
        </aside>
      </div>
    </article>
  );
}
