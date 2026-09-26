import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { getPublishedPastTrips, pastTripDateLabel, photoUrl } from "@/lib/past-trips";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Past trips",
  description: "A record of journeys we've already taken with our travellers — where we went, when, and what we did.",
  alternates: { canonical: "/past-trips" },
};

export default async function PastTripsPage() {
  const trips = await getPublishedPastTrips();

  return (
    <div className="container-x py-12 sm:py-16">
      <header className="border-b border-ink pb-8">
        <p className="eyebrow text-brass-deep">Our travel diary</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">Past trips</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Journeys we&apos;ve already taken with our travellers. These dates have passed and can&apos;t be booked. For trips you can join, see{" "}
          <Link href="/trips" className="link-underline text-ink">upcoming journeys</Link>.
        </p>
      </header>

      {trips.length ? (
        <ul className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((t) => {
            const photo = t.photos[0];
            const date = pastTripDateLabel(t);
            return (
              <li key={t.id}>
                <article className="group relative flex h-full flex-col">
                  <div className="relative aspect-[4/3] overflow-hidden bg-moss">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- served unoptimized so withdrawn approvals take effect immediately
                      <img
                        src={`${photoUrl(photo.id)}?w=800`}
                        alt={photo.alt}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="grain flex h-full flex-col justify-end p-6 text-paper">
                        <span aria-hidden className="font-serif text-6xl leading-none text-brass/80">✦</span>
                        <span className="relative z-10 mt-4 font-serif text-3xl leading-tight">{t.destination}</span>
                      </div>
                    )}
                    <span className="eyebrow absolute left-4 top-4 bg-paper/95 px-2 py-1 text-[0.6rem] text-ink">Completed</span>
                  </div>
                  <div className="flex flex-1 flex-col border-x border-b border-line p-5">
                    <p className="eyebrow text-[0.62rem] text-brass-deep">
                      {[date, t.durationText].filter(Boolean).join(" · ")}
                    </p>
                    <h2 className="mt-2 text-3xl leading-tight">
                      <Link href={`/past-trips/${t.slug}`} className="after:absolute after:inset-0 group-hover:text-oxblood">{t.title}</Link>
                    </h2>
                    <p className="mt-1 text-sm text-muted">{[t.destination, t.country].filter(Boolean).join(", ")}</p>
                    <p className="mt-4 text-sm leading-relaxed text-ink-soft">{t.summary}</p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-12">
          <EmptyState title="Our travel diary is being written" action={<Link href="/trips" className="btn btn-primary">See upcoming journeys</Link>}>
            Stories from our past trips will appear here soon.
          </EmptyState>
        </div>
      )}
    </div>
  );
}
