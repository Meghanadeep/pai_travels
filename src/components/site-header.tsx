"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { site } from "@/lib/site";

const nav = [
  { href: "/trips", label: "Journeys" },
  { href: "/past-trips", label: "Past trips" },
  { href: "/compare", label: "Compare" },
  { href: "/about", label: "About" },
  { href: "/faqs", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className={`flex items-baseline gap-2 ${light ? "text-paper" : "text-ink"}`}>
      <span className="font-serif text-[1.65rem] leading-none tracking-tight">{site.name.split(" ")[0]}</span>
      <span className={`eyebrow text-[0.6rem] ${light ? "text-brass" : "text-brass-deep"}`}>
        {site.name.split(" ").slice(1).join(" ") || "Travels"}
      </span>
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/92 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        Skip to content
      </a>
      <div className="container-x flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label={`${site.name} home`}>
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`eyebrow transition-colors hover:text-oxblood ${active ? "text-oxblood" : "text-ink-soft"}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/trips" className="btn btn-primary btn-sm hidden sm:inline-flex">
            Plan a journey
          </Link>
          <button
            type="button"
            className="md:hidden -mr-2 p-2"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 7h18M3 12h18M3 17h18" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="md:hidden border-t border-line bg-paper">
          <ul className="container-x py-4">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setOpen(false)} className="block py-3 font-serif text-2xl">
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-3">
              <Link href="/trips" onClick={() => setOpen(false)} className="btn btn-primary w-full">
                Plan a journey
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
