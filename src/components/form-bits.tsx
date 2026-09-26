"use client";

import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/validation";

export function SubmitButton({
  children,
  pendingText = "Sending…",
  className = "btn btn-primary",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={className}>
      {pending && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="2.5" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      )}
      {pending ? pendingText : children}
    </button>
  );
}

export function FieldError({ state, name }: { state: FormState; name: string }) {
  const errs = state?.fieldErrors?.[name];
  if (!errs?.length) return null;
  return (
    <p id={`${name}-error`} className="field-error">
      {errs[0]}
    </p>
  );
}

/** aria props for an input given the current form state. */
export function fieldAria(state: FormState, name: string) {
  const invalid = Boolean(state?.fieldErrors?.[name]?.length);
  return { "aria-invalid": invalid || undefined, "aria-describedby": invalid ? `${name}-error` : undefined };
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state?.message) return null;
  return (
    <div
      role={state.ok ? "status" : "alert"}
      className={`border-l-2 px-4 py-3 text-sm ${state.ok ? "border-success bg-success/5 text-success" : "border-danger bg-danger/5 text-danger"}`}
    >
      {state.message}
    </div>
  );
}

/** Visually hidden spam trap. */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Leave this field empty
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
