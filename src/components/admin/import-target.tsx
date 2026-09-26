"use client";

import { useEffect, useRef, useState } from "react";
import { useActionFormState } from "./action-form";

/** Choose whether an import creates a new past trip or updates an existing one. */
export function ImportTarget({
  trips,
  defaultTarget,
  defaultExistingId,
  duplicateCount,
}: {
  trips: { id: string; label: string }[];
  defaultTarget: "new" | "existing";
  defaultExistingId?: string;
  duplicateCount: number;
}) {
  const state = useActionFormState();
  const echoed = state && !state.ok ? state.values : undefined;
  const initial = (echoed?.target as "new" | "existing" | undefined) ?? defaultTarget;
  const [target, setTarget] = useState(initial);
  const errors = state?.fieldErrors;
  const ref = useRef<HTMLFieldSetElement>(null);

  // The radios are uncontrolled so React's post-submit form reset restores the
  // submitted choice; follow whatever the DOM shows after a reset.
  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const onReset = () =>
      setTimeout(() => setTarget((form.elements.namedItem("target") as RadioNodeList).value === "existing" ? "existing" : "new"));
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  return (
    <fieldset ref={ref} className="space-y-4 border border-ink/15 bg-paper p-4">
      <legend className="eyebrow px-1 text-brass-deep">Save as</legend>
      <label className="flex items-start gap-3 text-sm">
        <input type="radio" name="target" value="new" defaultChecked={initial === "new"} onChange={() => setTarget("new")} className="mt-0.5 accent-[#6e2a24]" />
        <span>
          <span className="font-medium">A new past trip</span>
          <span className="block text-xs text-muted">Created as a draft. You publish it when it&apos;s ready.</span>
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="radio"
          name="target"
          value="existing"
          defaultChecked={initial === "existing"}
          onChange={() => setTarget("existing")}
          disabled={!trips.length}
          className="mt-0.5 accent-[#6e2a24]"
        />
        <span>
          <span className="font-medium">Update an existing past trip</span>
          <span className="block text-xs text-muted">
            {trips.length ? "Filled-in fields replace the trip's values; empty fields keep them. Places and activities are combined." : "You don't have any past trips yet."}
          </span>
        </span>
      </label>

      {target === "existing" && (
        <div>
          <label htmlFor="f-existingId" className="field-label">Past trip to update</label>
          <select id="f-existingId" name="existingId" defaultValue={echoed?.existingId ?? defaultExistingId ?? ""} className="field" aria-invalid={errors?.existingId ? true : undefined}>
            <option value="">— Choose —</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          {errors?.existingId && <p className="field-error">{errors.existingId[0]}</p>}
        </div>
      )}

      {target === "new" && (duplicateCount > 0 || errors?.confirmNotDuplicate) && (
        <div>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="confirmNotDuplicate" defaultChecked={echoed?.confirmNotDuplicate === "on"} className="mt-0.5 h-4 w-4 accent-[#6e2a24]" />
            <span>I&apos;ve checked the possible duplicates above — this is a different trip.</span>
          </label>
          {errors?.confirmNotDuplicate && <p className="field-error">{errors.confirmNotDuplicate[0]}</p>}
        </div>
      )}
    </fieldset>
  );
}
