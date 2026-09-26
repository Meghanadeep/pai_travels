import Image from "next/image";
import Link from "next/link";
import type { TripCardData } from "@/lib/trips";
import { formatDate, formatPrice, formatShortDate, tripTypeLabels } from "@/lib/format";
import { CompareToggle } from "./compare";
import { SampleBadge } from "./ui";

export function TripCard({ trip, priority = false }: { trip: TripCardData; priority?: boolean }) {
  return (
    <article className="group relative flex flex-col bg-paper">
      <div className="relative aspect-[4/5] overflow-hidden bg-linen">
        <Image
          src={trip.coverImageUrl}
          alt={trip.coverImageAlt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/5 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {trip.isSample && <SampleBadge />}
          {trip.hasEarlyBird && (
            <span className="eyebrow bg-brass px-2 py-1 text-[0.6rem] text-ink">Early bird</span>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 text-paper">
          <p className="eyebrow text-brass">
            {trip.destination} · {trip.country}
          </p>
          <h3 className="mt-2 text-3xl leading-tight">
            <Link href={`/trips/${trip.slug}`} className="after:absolute after:inset-0">
              {trip.title}
            </Link>
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col border-x border-b border-line p-5">
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="eyebrow text-[0.6rem] text-muted">Duration</dt>
            <dd className="mt-1">{trip.durationDays} days</dd>
          </div>
          <div>
            <dt className="eyebrow text-[0.6rem] text-muted">Group</dt>
            <dd className="mt-1">
              {trip.groupSizeMax != null ? `${trip.groupSizeMin}–${trip.groupSizeMax}` : trip.groupSizeMin > 1 ? `${trip.groupSizeMin}+` : "Ask"}
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-[0.6rem] text-muted">Style</dt>
            <dd className="mt-1 truncate" title={tripTypeLabels[trip.tripType]}>
              {tripTypeLabels[trip.tripType].split(" ")[0]}
            </dd>
          </div>
        </dl>

        <div className="rule my-4" />

        <p className="eyebrow text-[0.6rem] text-muted">Includes</p>
        <ul className="mt-2 space-y-1 text-sm text-ink-soft">
          {trip.inclusions.slice(0, 3).map((inc) => (
            <li key={inc} className="flex gap-2">
              <span aria-hidden className="text-brass-deep">—</span>
              <span>{inc}</span>
            </li>
          ))}
        </ul>

        <p className="eyebrow mt-4 text-[0.6rem] text-muted">{trip.upcoming.length || trip.fromPrice == null ? "Next dates" : "Travel dates"}</p>
        {trip.upcoming.length ? (
          <ul className="mt-2 flex flex-wrap gap-2 text-xs">
            {trip.upcoming.map((d) => (
              <li
                key={d.id}
                className={`border px-2 py-1 ${d.seatsLeft === 0 ? "border-line text-muted line-through" : "border-ink/20"}`}
              >
                {formatShortDate(d.startDate)}
                {d.seatsLeft === 0 && <span className="sr-only"> (sold out)</span>}
              </li>
            ))}
          </ul>
        ) : trip.fromPrice != null ? (
          <p className="mt-2 text-sm text-ink-soft">
            {trip.validUntil ? `Any date until ${formatDate(trip.validUntil)}` : "Dates on request"}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">New dates coming soon</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <div>
            <p className="eyebrow text-[0.6rem] text-muted">From, per person</p>
            <p className="font-serif text-3xl">{trip.fromPrice != null ? formatPrice(trip.fromPrice) : "On request"}</p>
          </div>
          <div className="relative z-10">
            <CompareToggle slug={trip.slug} title={trip.title} />
          </div>
        </div>
      </div>
    </article>
  );
}
