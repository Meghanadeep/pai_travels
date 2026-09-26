"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { extractImport, uploadImport } from "@/app/admin/past-trip-actions";

type Row = { name: string; state: "waiting" | "uploading" | "reading" | "ready" | "uploaded" | "failed"; id?: string; message?: string };

const labels: Record<Row["state"], string> = {
  waiting: "Waiting",
  uploading: "Uploading…",
  reading: "Reading details…",
  ready: "Ready to review",
  uploaded: "Uploaded",
  failed: "Failed",
};

/** Uploads images one at a time, then has each one read by the vision model. */
export function ImportUploader({ canExtract }: { canExtract: boolean }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const update = (i: number, patch: Partial<Row>) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  async function run(files: File[]) {
    setBusy(true);
    setRows(files.map((f) => ({ name: f.name, state: "waiting" })));
    for (const [i, file] of files.entries()) {
      update(i, { state: "uploading" });
      const fd = new FormData();
      fd.append("file", file);
      const up = await uploadImport(fd).catch(() => ({ ok: false as const, message: "Upload failed. Check the file and try again." }));
      if (!up.ok) {
        update(i, { state: "failed", message: up.message });
        continue;
      }
      const dupNote = up.sameImageAs ? "This exact image was uploaded before — check for duplicates when reviewing." : undefined;
      if (!canExtract) {
        update(i, { state: "uploaded", id: up.id, message: dupNote });
        continue;
      }
      update(i, { state: "reading", id: up.id, message: dupNote });
      const res = await extractImport(up.id).catch(() => ({ ok: false, message: "Reading failed. Open the import to retry." }));
      update(i, res.ok ? { state: "ready", message: dupNote } : { state: "failed", message: res.message });
    }
    setBusy(false);
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem("files") as HTMLInputElement;
          const files = Array.from(input.files ?? []);
          if (files.length) run(files).finally(() => (input.value = ""));
        }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="import-files" className="field-label">Photos or screenshots</label>
          <input
            id="import-files"
            name="files"
            type="file"
            multiple
            required
            disabled={busy}
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="field py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted">JPEG, PNG, WebP or AVIF, up to 10 MB each. Originals are kept privately for your reference.</p>
        </div>
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? "Working…" : canExtract ? "Upload & read" : "Upload"}
        </button>
      </form>

      {rows.length > 0 && (
        <ul className="mt-5 divide-y divide-line border border-line bg-paper" aria-live="polite">
          {rows.map((r, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="min-w-0 truncate font-medium">{r.name}</span>
              <span className="flex items-center gap-3">
                <span className={r.state === "failed" ? "text-danger" : r.state === "ready" ? "text-success" : "text-muted"}>
                  {labels[r.state]}
                </span>
                {r.id && (r.state === "ready" || r.state === "failed" || r.state === "uploaded") && (
                  <Link href={`/admin/imports/${r.id}`} className="btn btn-outline btn-sm">Review</Link>
                )}
              </span>
              {r.message && <p className={`w-full text-xs ${r.state === "failed" ? "text-danger" : "text-brass-deep"}`}>{r.message}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
