"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const KEY = "pai-compare";
export const MAX_COMPARE = 3;

type Ctx = { slugs: string[]; toggle: (slug: string) => void; clear: () => void };
const CompareContext = createContext<Ctx | null>(null);

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((s) => typeof s === "string").slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
}

function write(slugs: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(slugs));
  } catch {
    // Storage may be unavailable (private mode); comparison still works for this page view.
  }
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    // Hydrate from storage after mount to keep server and client markup identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlugs(read());
  }, []);

  const toggle = useCallback((slug: string) => {
    setSlugs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length >= MAX_COMPARE ? prev : [...prev, slug];
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    write([]);
    setSlugs([]);
  }, []);

  const value = useMemo(() => ({ slugs, toggle, clear }), [slugs, toggle, clear]);
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside CompareProvider");
  return ctx;
}

export function CompareToggle({ slug, title }: { slug: string; title: string }) {
  const { slugs, toggle } = useCompare();
  const selected = slugs.includes(slug);
  const full = !selected && slugs.length >= MAX_COMPARE;
  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      disabled={full}
      aria-pressed={selected}
      title={full ? `You can compare up to ${MAX_COMPARE} trips` : undefined}
      className="eyebrow inline-flex items-center gap-2 text-ink-soft transition-colors hover:text-oxblood disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        aria-hidden
        className={`grid h-4 w-4 place-items-center border ${selected ? "border-oxblood bg-oxblood text-paper" : "border-ink-soft"}`}
      >
        {selected && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M1.5 5.2l2.2 2.2L8.5 2.6" />
          </svg>
        )}
      </span>
      <span>
        Compare<span className="sr-only"> {title}</span>
      </span>
    </button>
  );
}

export function CompareTray() {
  const { slugs, clear } = useCompare();
  if (slugs.length === 0) return null;
  return (
    <div role="region" aria-label="Trip comparison" className="fixed inset-x-0 bottom-0 z-40 border-t border-ink bg-ink text-paper">
      <div className="container-x flex flex-wrap items-center justify-between gap-3 py-3">
        <p className="text-sm">
          <span className="font-serif text-xl">{slugs.length}</span> of {MAX_COMPARE} journeys selected
          {slugs.length < 2 && <span className="text-paper/60"> — choose at least two to compare</span>}
        </p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={clear} className="eyebrow text-paper/70 hover:text-paper">
            Clear
          </button>
          <Link
            href={`/compare?trips=${slugs.join(",")}`}
            aria-disabled={slugs.length < 2}
            className={`btn btn-sm ${slugs.length < 2 ? "pointer-events-none bg-paper/20 text-paper/50" : "bg-paper text-ink hover:bg-brass"}`}
          >
            Compare now
          </Link>
        </div>
      </div>
    </div>
  );
}
