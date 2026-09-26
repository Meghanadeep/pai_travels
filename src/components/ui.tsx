import type { ReactNode } from "react";

export function SampleBadge({ className = "", label = "Sample trip" }: { className?: string; label?: string }) {
  return (
    <span
      className={`eyebrow inline-flex items-center gap-1.5 border border-oxblood/70 bg-paper/95 px-2 py-1 text-[0.6rem] text-oxblood ${className}`}
      title="Placeholder content — replace from the admin portal"
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-oxblood" />
      {label}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  action,
  numeral,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
  numeral?: string;
}) {
  return (
    <div className={`flex flex-col gap-6 md:flex-row md:items-end md:justify-between ${align === "center" ? "items-center text-center md:flex-col md:items-center" : ""}`}>
      <div className={align === "center" ? "max-w-2xl" : "max-w-2xl"}>
        {eyebrow && (
          <p className="eyebrow flex items-center gap-3 text-brass-deep">
            {numeral && <span className="font-serif text-base normal-case tracking-normal italic">{numeral}</span>}
            {eyebrow}
          </p>
        )}
        <h2 className="mt-3 text-4xl sm:text-5xl">{title}</h2>
        {intro && <p className="mt-4 text-base leading-relaxed text-muted">{intro}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 text-brass-deep" role="img" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2" aria-hidden>
          <path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.8l6.1-.7z" />
        </svg>
      ))}
    </span>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-line px-6 py-16 text-center">
      <p className="font-serif text-3xl">{title}</p>
      {children && <div className="mx-auto mt-3 max-w-md text-muted">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  const styles = {
    info: "border-line bg-paper-deep text-ink-soft",
    error: "border-danger/40 bg-danger/5 text-danger",
    success: "border-success/40 bg-success/5 text-success",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`border-l-2 px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse bg-linen/70 ${className}`} />;
}
