import Link from "next/link";
import { site } from "@/lib/site";
import { Wordmark } from "./site-header";

const columns = [
  {
    title: "Travel",
    links: [
      { href: "/trips", label: "All journeys" },
      { href: "/trips?sort=departure-asc", label: "Upcoming departures" },
      { href: "/compare", label: "Compare trips" },
      { href: "/past-trips", label: "Past trips" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/contact", label: "Contact" },
      { href: "/faqs", label: "FAQs" },
    ],
  },
  {
    title: "Policies",
    links: [
      { href: "/terms", label: "Terms & conditions" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/cancellation-policy", label: "Cancellation policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="grain bg-moss-deep text-paper/85">
      <div className="container-x relative z-10 grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <Wordmark light />
          <p className="mt-5 font-serif text-xl italic leading-snug text-paper/80">{site.tagline}</p>
          <address className="mt-6 space-y-1 text-sm not-italic text-paper/70">
            <p>
              <a className="link-underline" href={`mailto:${site.email}`}>{site.email}</a>
            </p>
            <p>
              <a className="link-underline" href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a>
            </p>
            <p>{site.address}</p>
          </address>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="eyebrow text-brass">{col.title}</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-brass">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="relative z-10 border-t border-paper/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-paper/55 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>Booking requests are inquiries only — no payment is taken online.</p>
        </div>
      </div>
    </footer>
  );
}
