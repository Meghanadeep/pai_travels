import type { Metadata } from "next";
import { Wordmark } from "@/components/site-header";
import { ActionForm, Field, Submit } from "@/components/admin/action-form";
import { login } from "../actions";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <main className="grain grid min-h-dvh place-items-center bg-moss-deep px-4">
      <div className="relative z-10 w-full max-w-sm bg-paper p-8 shadow-2xl">
        <Wordmark />
        <h1 className="mt-6 text-3xl">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted">Restricted area — staff only.</p>
        <ActionForm action={login} className="mt-6 space-y-5">
          <Field name="email" label="Email" type="email" required />
          <Field name="password" label="Password" type="password" required />
          <Submit className="w-full !min-h-11">Sign in</Submit>
        </ActionForm>
      </div>
    </main>
  );
}
