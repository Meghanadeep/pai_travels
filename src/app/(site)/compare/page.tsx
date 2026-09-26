import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EmptyState, SampleBadge } from "@/components/ui";
import { formatDate, formatPrice, groupSizeLabel, tripTypeLabels } from "@/lib/format";
import { getTripCardsBySlugs, type TripCardData } from "@/lib/trips";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compare journeys",
  description: "Compare up to three journeys side by side — duration, group size, price, dates and inclusions.",
  robots: { index: false, follow: true },
};

type Row = { label: string; render: (t: TripCardData) => React.ReactNode };

const rows: Row[] = [
  { label: "Destination", render: (t) => `${t.destination}, ${t.country}` },
  { label: "Style", render: (t) => tripTypeLabels[t.tripType] },
  { label: "Duration", render: (t) => `${t.durationDays} days` },
  { label: "Group size", render: (t) => groupSizeLabel(t.groupSizeMin, t.groupSizeMax) },
  {
    label: "From, per person",
    render: (t) => <span className="font-serif text-2xl">{t.fromPrice != null ? formatPrice(t.fromPrice) : "On request"}</span>,
  },
  { label: "Next departure", render: (t) => (t.nextDeparture ? formatDate(t.nextDeparture) : "No open dates") },
  { label: "Upcoming dates", render: (t) => t.departureCount },
  {
    label: "Highlights",
    render: (t) => (
      <ul className="space-y-1">
        {t.highlights.slice(0, 4).map((h) => (
          <li key={h}>— {h}</li>
        ))}
      </ul>
    ),
  },
  {
    label: "Included",
    render: (t) => (
      <ul className="space-y-1">
        {t.inclusions.map((h) => (
          <li key={h}>✓ {h}</li>
        ))}
      </ul>
    ),
  },
];

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const { trips } = await searchParams;
  const slugs = (typeof trips === "string" ? trips : "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]{1,80}$/.test(s))
    .slice(0, 3);
  const cards = slugs.length ? await getTripCardsBySlugs([...new Set(slugs)]) : [];

  return (
    <div className="container-x py-12 sm:py-16">
      <header className="border-b border-ink pb-8">
        <p className="eyebrow text-brass-deep">Side by side</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">Compare journeys</h1>
        <p className="mt-4 max-w-2xl text-muted">Tick “Compare” on up to three journeys, then open this page from the bar at the bottom of the screen.</p>
      </header>

      {cards.length < 2 ? (
        <div className="mt-10">
          <EmptyState title="Choose at least two journeys" action={<Link href="/trips" className="btn btn-primary">Browse journeys</Link>}>
            Select “Compare” on the journeys you&apos;re considering and they&apos;ll appear here side by side.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[44rem] table-fixed text-left text-sm">
            <caption className="sr-only">Comparison of selected journeys</caption>
            <thead>
              <tr>
                <td className="w-40" />
                {cards.map((t) => (
                  <th key={t.id} scope="col" className="px-4 pb-6 align-top font-normal">
                    <div className="relative aspect-[4/3] overflow-hidden bg-linen">
                      <Image src={t.coverImageUrl} alt={t.coverImageAlt} fill sizes="30vw" className="object-cover" />
                      {t.isSample && <SampleBadge className="absolute left-2 top-2" />}
                    </div>
                    <Link href={`/trips/${t.slug}`} className="mt-4 block font-serif text-2xl leading-tight hover:text-oxblood">
                      {t.title}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-line">
                  <th scope="row" className="eyebrow py-4 pr-4 align-top text-muted">{row.label}</th>
                  {cards.map((t) => (
                    <td key={t.id} className="px-4 py-4 align-top text-ink-soft">{row.render(t)}</td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-ink">
                <td />
                {cards.map((t) => (
                  <td key={t.id} className="px-4 py-6">
                    <Link href={`/trips/${t.slug}`} className="btn btn-primary btn-sm w-full">View journey</Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
