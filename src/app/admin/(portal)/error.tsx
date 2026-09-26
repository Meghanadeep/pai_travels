"use client";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="border border-danger/40 bg-danger/5 p-6">
      <h1 className="text-3xl">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">{error.digest ? `Reference: ${error.digest}` : "Please try again."}</p>
      <button type="button" onClick={reset} className="btn btn-primary btn-sm mt-4">Try again</button>
    </div>
  );
}
