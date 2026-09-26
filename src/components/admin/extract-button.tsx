"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { extractImport } from "@/app/admin/past-trip-actions";

/** Runs extraction for one import from a list row, then refreshes the page. */
export function ExtractButton({ importId, label = "Read details" }: { importId: string; label?: string }) {
  const router = useRouter();
  const [state, setState] = useState<{ busy: boolean; error?: string }>({ busy: false });
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={state.busy}
        onClick={async () => {
          setState({ busy: true });
          const res = await extractImport(importId).catch(() => ({ ok: false, message: "Reading failed. Try again." }));
          setState({ busy: false, error: res.ok ? undefined : res.message });
          router.refresh();
        }}
      >
        {state.busy ? "Reading…" : label}
      </button>
      {state.error && <span className="max-w-60 text-right text-xs text-danger">{state.error}</span>}
    </span>
  );
}
