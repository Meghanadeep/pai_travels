import type { Metadata } from "next";
import { PageHeader } from "@/components/prose-page";
import { site } from "@/lib/site";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${site.name} about a journey, a private departure or an existing booking request.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="container-x py-12 sm:py-16">
      <PageHeader eyebrow="Contact" title="Write to us" intro={<p>Questions about a trip, a private departure, or a request you&apos;ve already sent — we read every message.</p>} />
      <div className="mt-12 grid gap-14 lg:grid-cols-[1fr_22rem]">
        <ContactForm />
        <aside className="space-y-8 text-sm">
          <div className="border-t border-ink pt-5">
            <h2 className="eyebrow">Email</h2>
            <a href={`mailto:${site.email}`} className="mt-2 inline-block font-serif text-2xl link-underline">{site.email}</a>
          </div>
          <div className="border-t border-ink pt-5">
            <h2 className="eyebrow">Telephone</h2>
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="mt-2 inline-block font-serif text-2xl link-underline">{site.phone}</a>
            <p className="mt-1 text-muted">{site.hours}</p>
          </div>
          <div className="border-t border-ink pt-5">
            <h2 className="eyebrow">Office</h2>
            <address className="mt-2 not-italic text-ink-soft">{site.address}</address>
          </div>
        </aside>
      </div>
    </div>
  );
}
