import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: ReactNode }) {
  return (
    <header className="border-b border-ink pb-8">
      <p className="eyebrow text-brass-deep">{eyebrow}</p>
      <h1 className="mt-3 text-5xl sm:text-6xl">{title}</h1>
      {intro && <div className="mt-4 max-w-2xl text-lg text-muted">{intro}</div>}
    </header>
  );
}

export function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: { heading: string; body: ReactNode }[];
}) {
  return (
    <div className="container-x py-12 sm:py-16">
      <PageHeader eyebrow="Policies" title={title} intro={<p className="text-sm">Last updated {updated}</p>} />
      <p className="mt-8 max-w-3xl border-l-2 border-oxblood bg-oxblood/5 px-4 py-3 text-sm text-oxblood">
        Template text — this page is a starting point, not legal advice. Have it reviewed by a qualified professional and
        adapted to your business and jurisdiction before going live.
      </p>
      <div className="mt-10 grid gap-10 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Sections" className="hidden lg:block">
          <ol className="sticky top-24 space-y-2 text-sm">
            {sections.map((s, i) => (
              <li key={s.heading}>
                <a href={`#s${i + 1}`} className="text-ink-soft hover:text-oxblood">
                  {i + 1}. {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="max-w-3xl space-y-10">
          {sections.map((s, i) => (
            <section key={s.heading} id={`s${i + 1}`} className="scroll-mt-24">
              <h2 className="text-3xl">
                <span className="mr-3 font-serif italic text-brass-deep">{i + 1}.</span>
                {s.heading}
              </h2>
              <div className="prose-journal mt-4 leading-relaxed text-ink-soft [&_li]:ml-5 [&_li]:list-disc [&_ul]:mt-3 [&_ul]:space-y-1">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
