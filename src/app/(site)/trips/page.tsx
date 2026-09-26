import type { Metadata } from "next";
import Link from "next/link";
import { TripCard } from "@/components/trip-card";
import { EmptyState } from "@/components/ui";
import { toDateInput, tripTypeLabels, formatPrice } from "@/lib/format";
import { parseTripFilters, toQueryString } from "@/lib/search-params";
import { DURATION_BUCKETS, SORTS, TRIP_TYPES, getDestinations, getPriceBounds, searchTrips } from "@/lib/trips";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journeys & departures",
  description: "Browse small-group journeys by destination, dates, budget, duration and travel style. Compare trips and check seats for each departure.",
  alternates: { canonical: "/trips" },
};

const PAGE_SIZE = 9;

export default async function TripsPage({ searchParams }: PageProps<"/trips">) {
  const raw = await searchParams;
  const { filters, page } = parseTripFilters(raw);
  const [results, destinations, bounds] = await Promise.all([searchTrips(filters), getDestinations(), getPriceBounds()]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const active = {
    q: filters.q,
    destination: filters.destination,
    from: filters.from ? toDateInput(filters.from) : undefined,
    to: filters.to ? toDateInput(filters.to) : undefined,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    duration: filters.duration,
    type: filters.type,
    sort: filters.sort,
  };
  const activeCount = Object.entries(active).filter(([k, v]) => k !== "sort" && v !== undefined).length;

  const filterForm = (
    <form action="/trips" method="get" className="space-y-6" aria-label="Filter journeys">
      <div>
        <label htmlFor="q" className="field-label">Search</label>
        <input id="q" name="q" type="search" defaultValue={filters.q} placeholder="Place or trip name" className="field" />
      </div>
      <div>
        <label htmlFor="destination" className="field-label">Destination</label>
        <select id="destination" name="destination" defaultValue={filters.destination ?? ""} className="field">
          <option value="">All destinations</option>
          {destinations.map((d) => (
            <option key={d.destination} value={d.destination}>{d.destination}, {d.country}</option>
          ))}
        </select>
      </div>
      <fieldset>
        <legend className="field-label">Departing between</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor="from">From date</label>
          <input id="from" name="from" type="date" defaultValue={active.from} className="field text-sm" />
          <label className="sr-only" htmlFor="to">To date</label>
          <input id="to" name="to" type="date" defaultValue={active.to} className="field text-sm" />
        </div>
      </fieldset>
      <fieldset>
        <legend className="field-label">Budget per person</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor="minPrice">Minimum price</label>
          <input id="minPrice" name="minPrice" inputMode="numeric" placeholder={`Min ${bounds.min ? formatPrice(bounds.min) : ""}`} defaultValue={filters.minPrice} className="field text-sm" />
          <label className="sr-only" htmlFor="maxPrice">Maximum price</label>
          <input id="maxPrice" name="maxPrice" inputMode="numeric" placeholder={`Max ${bounds.max ? formatPrice(bounds.max) : ""}`} defaultValue={filters.maxPrice} className="field text-sm" />
        </div>
      </fieldset>
      <div>
        <label htmlFor="duration" className="field-label">Duration</label>
        <select id="duration" name="duration" defaultValue={filters.duration ?? ""} className="field">
          <option value="">Any length</option>
          {Object.entries(DURATION_BUCKETS).map(([k, b]) => (
            <option key={k} value={k}>{b.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="type" className="field-label">Trip type</label>
        <select id="type" name="type" defaultValue={filters.type ?? ""} className="field">
          <option value="">All styles</option>
          {TRIP_TYPES.map((t) => (
            <option key={t} value={t}>{tripTypeLabels[t]}</option>
          ))}
        </select>
      </div>
      {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary flex-1">Apply</button>
        <Link href="/trips" className="btn btn-outline">Reset</Link>
      </div>
    </form>
  );

  return (
    <div className="container-x py-12 sm:py-16">
      <header className="border-b border-ink pb-8">
        <p className="eyebrow text-brass-deep">The collection</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">Journeys & departures</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Each journey runs on fixed dates with its own price and seat count. Filter by what matters to you, and tick
          “Compare” on up to three trips to see them side by side.
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[17rem_1fr]">
        <aside>
          <details className="group border border-line p-5 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between">
              <span className="eyebrow">Filters{activeCount ? ` (${activeCount})` : ""}</span>
              <span aria-hidden className="transition-transform group-open:rotate-45 text-xl">+</span>
            </summary>
            <div className="mt-5">{filterForm}</div>
          </details>
          <div className="sticky top-24 hidden lg:block">{filterForm}</div>
        </aside>

        <section aria-labelledby="results-heading">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
            <h2 id="results-heading" className="text-sm text-muted" aria-live="polite">
              {results.length} {results.length === 1 ? "journey" : "journeys"}
              {activeCount > 0 && " match your filters"}
            </h2>
            <nav aria-label="Sort" className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="eyebrow text-muted">Sort</span>
              {Object.entries(SORTS).map(([k, label]) => {
                const selected = (filters.sort ?? "recommended") === k;
                return (
                  <Link
                    key={k}
                    href={`/trips${toQueryString({ ...active, sort: k === "recommended" ? undefined : k })}`}
                    aria-current={selected ? "true" : undefined}
                    className={`text-sm ${selected ? "text-oxblood underline underline-offset-4" : "text-ink-soft hover:text-oxblood"}`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {pageItems.length ? (
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {pageItems.map((t, i) => (
                <TripCard key={t.id} trip={t} priority={i < 2} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No journeys match those filters"
              action={<Link href="/trips" className="btn btn-outline">Clear all filters</Link>}
            >
              Try widening the dates or budget, or choose a different destination. You can also{" "}
              <Link href="/contact" className="link-underline text-ink">ask us</Link> about private departures.
            </EmptyState>
          )}

          {totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/trips${toQueryString({ ...active, page: p === 1 ? undefined : p })}`}
                  aria-current={p === current ? "page" : undefined}
                  className={`grid h-10 w-10 place-items-center border text-sm ${p === current ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}
                >
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
