"use client";

import { createContext, useActionState, useContext } from "react";
import { useFormStatus } from "react-dom";
import { FormMessage } from "@/components/form-bits";
import type { FormState } from "@/lib/validation";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

const StateContext = createContext<FormState>(null);

/** The enclosing ActionForm's latest result, for custom inputs. */
export function useActionFormState() {
  return useContext(StateContext);
}

/** Wraps a server action with useActionState and shares its state with <Field>s inside. */
export function ActionForm({
  action,
  children,
  className = "space-y-5",
  encType,
  showMessage = true,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  encType?: "multipart/form-data";
  showMessage?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <StateContext.Provider value={state}>
      <form action={formAction} className={className} encType={encType} noValidate>
        {showMessage && <FormMessage state={state} />}
        {children}
      </form>
    </StateContext.Provider>
  );
}

type Option = { value: string; label: string };

export function Field({
  name,
  label,
  type = "text",
  defaultValue,
  options,
  hint,
  required,
  rows,
  placeholder,
  className = "",
  min,
  step,
  badge,
}: {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "select" | "checkbox" | "email" | "url" | "file" | "password";
  defaultValue?: string | number | boolean | null;
  options?: Option[];
  hint?: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
  min?: number;
  step?: number;
  badge?: React.ReactNode;
}) {
  const state = useContext(StateContext);
  const error = state?.fieldErrors?.[name]?.[0];
  // After a failed submit React resets the form, so fall back to the submitted value.
  const echoed = state && !state.ok ? state.values?.[name] : undefined;
  const id = `f-${name}`;
  const aria = { "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${id}-err` : hint ? `${id}-hint` : undefined };

  if (type === "checkbox") {
    const checked = state && !state.ok ? echoed === "on" : Boolean(defaultValue);
    return (
      <div className={className}>
        <label className="flex items-center gap-3 text-sm">
          <input id={id} type="checkbox" name={name} defaultChecked={checked} className="h-4 w-4 accent-[#6e2a24]" {...aria} />
          {label}
        </label>
        {hint && !error && <p id={`${id}-hint`} className="mt-1 text-xs text-muted">{hint}</p>}
        {error && <p id={`${id}-err`} className="field-error">{error}</p>}
      </div>
    );
  }

  const value = echoed ?? (defaultValue == null ? undefined : String(defaultValue));
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="text-oxblood"> *</span>}
        {badge}
      </label>
      {type === "textarea" ? (
        <textarea id={id} name={name} rows={rows ?? 4} defaultValue={value} placeholder={placeholder} className="field" {...aria} />
      ) : type === "select" ? (
        <select id={id} name={name} defaultValue={value} className="field" {...aria}>
          {options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : type === "file" ? (
        <input id={id} name={name} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="field py-2 text-sm" {...aria} />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          defaultValue={type === "password" ? undefined : value}
          placeholder={placeholder}
          min={min}
          step={step}
          className="field"
          {...aria}
        />
      )}
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-err`} className="field-error">{error}</p>}
    </div>
  );
}

export function Submit({
  children,
  variant = "primary",
  confirm,
  className = "",
  name,
  value,
}: {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "danger" | "accent";
  confirm?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  const styles = {
    primary: "btn-primary",
    outline: "btn-outline",
    accent: "btn-accent",
    danger: "border-danger text-danger hover:bg-danger hover:text-paper",
  }[variant];
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={`btn btn-sm ${styles} ${className}`}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
