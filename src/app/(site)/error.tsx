"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-x flex flex-col items-center py-28 text-center" role="alert">
      <p className="eyebrow text-oxblood">Something went wrong</p>
      <h1 className="mt-4 text-5xl">We hit a snag loading this page.</h1>
      <p className="mt-4 max-w-md text-muted">Please try again. If it keeps happening, contact us and we&apos;ll help directly.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted">Ref: {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">Try again</button>
        <Link href="/" className="btn btn-outline">Home</Link>
      </div>
    </div>
  );
}
