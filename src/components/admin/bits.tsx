import Link from "next/link";
import type { ReactNode } from "react";

export function AdminHeader({ title, eyebrow, action, back }: { title: ReactNode; eyebrow?: string; action?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-5">
      <div>
        {back && (
          <Link href={back.href} className="eyebrow text-muted hover:text-oxblood">
            ← {back.label}
          </Link>
        )}
        {eyebrow && <p className="eyebrow mt-2 text-brass-deep">{eyebrow}</p>}
        <h1 className="mt-1 text-4xl">{title}</h1>
      </div>
      {action}
    </header>
  );
}

const tones: Record<string, string> = {
  PUBLISHED: "bg-success/10 text-success border-success/30",
  OPEN: "bg-success/10 text-success border-success/30",
  CONFIRMED: "bg-success/10 text-success border-success/30",
  DRAFT: "bg-linen text-ink-soft border-line",
  NEW: "bg-oxblood/10 text-oxblood border-oxblood/30",
  CONTACTED: "bg-brass/15 text-brass-deep border-brass/40",
  READ: "bg-linen text-ink-soft border-line",
  CLOSED: "bg-linen text-ink-soft border-line",
  ARCHIVED: "bg-ink/5 text-muted border-line",
  CANCELLED: "bg-ink/5 text-muted border-line",
  DECLINED: "bg-ink/5 text-muted border-line",
  PENDING: "bg-linen text-ink-soft border-line",
  PROCESSING: "bg-brass/15 text-brass-deep border-brass/40",
  READY: "bg-oxblood/10 text-oxblood border-oxblood/30",
  FAILED: "bg-danger/10 text-danger border-danger/30",
  SAVED: "bg-success/10 text-success border-success/30",
  DISCARDED: "bg-ink/5 text-muted border-line",
};

export function StatusPill({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`inline-block border px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider ${tones[status] ?? "border-line"}`}>
      {label ?? status.toLowerCase()}
    </span>
  );
}

export function Panel({ title, description, children, id }: { title: string; description?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-6 border border-line bg-[#fbf9f4]">
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-serif text-2xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
