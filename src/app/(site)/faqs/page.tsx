import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/prose-page";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "How booking requests, seat holds, departures, payments and cancellations work.",
  alternates: { canonical: "/faqs" },
};

const groups: { title: string; items: [string, string][] }[] = [
  {
    title: "Booking",
    items: [
      ["How do I book a journey?", "Choose a journey and a departure date, then send a booking request with the number of travellers and your contact details. We'll contact you to confirm availability and next steps."],
      ["Do I pay online?", "No. Sending a request never charges you. Payment arrangements are made directly with our team once your place is confirmed."],
      ["Are my seats held after I send a request?", "Yes. The seats you request are held while we review your inquiry. If the request is declined or cancelled, those seats are released for other travellers."],
      ["Why can't I request more seats?", "Each departure has a fixed number of seats. The form won't let you request more than are currently available — contact us if you need more."],
    ],
  },
  {
    title: "Departures & prices",
    items: [
      ["What does the price include?", "Each journey lists its inclusions and exclusions in full on its page. Prices are per person, based on twin share, unless stated otherwise."],
      ["What is an early bird price?", "Some departures offer a lower price for requests made before a set date. The early bird price and its end date are shown against the departure."],
      ["Can I join a departure that has already left?", "No — past departures are not shown and can't be requested."],
    ],
  },
  {
    title: "Changes & cancellations",
    items: [
      ["What if I need to cancel?", "See the cancellation policy on the journey page and our general cancellation policy. Terms depend on how close to departure you cancel."],
      ["What if a departure doesn't run?", "If we cancel a departure we'll contact you directly to offer alternative dates or a refund of any amount paid, as set out in our terms."],
    ],
  },
];

export default function FaqsPage() {
  const all = groups.flatMap((g) => g.items);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: all.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return (
    <div className="container-x py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHeader eyebrow="Help" title="Frequently asked questions" intro={<p>Can&apos;t find your answer? <Link href="/contact" className="link-underline text-ink">Write to us</Link>.</p>} />
      <div className="mt-12 grid gap-14">
        {groups.map((g) => (
          <section key={g.title} aria-labelledby={`faq-${g.title}`} className="grid gap-6 lg:grid-cols-[16rem_1fr]">
            <h2 id={`faq-${g.title}`} className="text-3xl">{g.title}</h2>
            <div className="divide-y divide-line border-y border-line">
              {g.items.map(([q, a]) => (
                <details key={q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-xl">
                    {q}
                    <span aria-hidden className="text-2xl transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">{a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
