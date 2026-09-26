import Image from "next/image";
import Link from "next/link";
import lake from "../../public/images/promos/gurudongmar-lake.jpg";

const regions = ["Sikkim & North Sikkim", "Darjeeling", "Assam", "Meghalaya", "Arunachal"];

const phones = [
  { label: "91130 53827", tel: "+919113053827" },
  { label: "94484 38177", tel: "+919448438177" },
  { label: "+91 8182 225157", tel: "+918182225157" },
];

// Seasonal announcement for Sikkim & the North East, shown above the journeys list.
export function NorthSikkimPromo() {
  return (
    <section aria-labelledby="north-sikkim-heading" className="grid overflow-hidden border border-ink bg-moss-deep text-paper lg:grid-cols-[1.15fr_1fr]">
      <div className="relative min-h-64 sm:min-h-80">
        <Image
          src={lake}
          alt="Snow peaks reflected in Gurudongmar Lake, North Sikkim, with prayer flags on the shore"
          fill
          placeholder="blur"
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-moss-deep/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-moss-deep/70" />
        <p className="eyebrow absolute left-5 top-5 bg-ink/70 px-3 py-1.5 text-[0.62rem] text-brass backdrop-blur">
          Season open · Oct – Dec
        </p>
      </div>

      <div className="flex flex-col justify-center gap-6 p-7 sm:p-10">
        <div>
          <p className="eyebrow text-brass">North Sikkim · 17,800 ft</p>
          <h2 id="north-sikkim-heading" className="mt-3 text-4xl leading-tight sm:text-5xl">
            Gurudongmar is <em className="font-serif italic text-brass">open again</em>
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-paper/80">
            Plan your North Sikkim trip for October–December. Permits are handled by our Gangtok team, and we tailor
            packages for any dates in the season at our best rates.
          </p>
        </div>

        <ul className="flex flex-wrap gap-2" aria-label="Regions we cover">
          {regions.map((r) => (
            <li key={r} className="border border-paper/25 px-3 py-1 text-xs tracking-wide text-paper/85">{r}</li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3">
          <Link href="/plan-journey" prefetch={false} className="btn btn-accent">Plan this journey</Link>
          <a href={`tel:${phones[0].tel}`} className="btn btn-ghost-light">Call {phones[0].label}</a>
        </div>

        <div className="border-t border-paper/15 pt-5">
          <p className="eyebrow text-[0.6rem] text-paper/60">Pai Travel Services · Where service outsmarts price</p>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {phones.map((p) => (
              <li key={p.tel}>
                <a href={`tel:${p.tel}`} className="text-paper/85 hover:text-brass">{p.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
