import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/prose-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About us",
  description: `How ${site.name} plans small-group journeys: considered pacing, clear pricing and people you can talk to.`,
  alternates: { canonical: "/about" },
};

const values = [
  ["Pace over checklists", "We plan fewer stops and longer stays, so there is time to notice where you are."],
  ["Plain information", "Every departure shows its dates, price and seats. Inclusions and exclusions are listed in full."],
  ["People, not a checkout", "Requests come to a real person who will talk the trip through with you before anything is confirmed."],
  ["Small groups", "Departures are capped so the experience stays personal and our footprint stays light."],
];

export default function AboutPage() {
  return (
    <div className="container-x py-12 sm:py-16">
      <PageHeader
        eyebrow="About"
        title="A small studio for unhurried travel"
        intro={<p>Replace this introduction with your story — who you are, where you started, and why you plan trips the way you do.</p>}
      />

      <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="relative aspect-[4/3] overflow-hidden bg-linen">
          <Image
            src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80"
            alt="Morning mist over green hills and a winding road"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="prose-journal text-lg leading-relaxed text-ink-soft">
          <p className="font-serif text-3xl leading-snug text-ink">
            “We believe a journey should feel like a well-told story — with a beginning, a middle, and time to take it in.”
          </p>
          <p>
            <em>Placeholder copy.</em> Use this space to describe your company honestly: your experience, the regions you know
            best, how you choose partners on the ground, and what travellers can expect from you before, during and after a trip.
          </p>
          <p>Avoid claims you can&apos;t back up — specific credentials, awards and figures should be accurate and current.</p>
        </div>
      </div>

      <section className="mt-20 border-t border-ink pt-12" aria-labelledby="values-h">
        <h2 id="values-h" className="text-4xl">How we work</h2>
        <ul className="mt-8 grid gap-8 sm:grid-cols-2">
          {values.map(([title, body], i) => (
            <li key={title} className="flex gap-5 border-t border-line pt-5">
              <span className="font-serif text-3xl italic text-brass-deep">{["I", "II", "III", "IV"][i]}</span>
              <div>
                <h3 className="text-2xl">{title}</h3>
                <p className="mt-2 text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-16 flex flex-wrap gap-3">
        <Link href="/trips" className="btn btn-primary">See our journeys</Link>
        <Link href="/contact" className="btn btn-outline">Get in touch</Link>
      </div>
    </div>
  );
}
