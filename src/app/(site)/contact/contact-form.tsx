"use client";

import { useActionState } from "react";
import { FieldError, FormMessage, Honeypot, SubmitButton, fieldAria } from "@/components/form-bits";
import { submitContact } from "../actions";

export function ContactForm() {
  const [state, action] = useActionState(submitContact, null);
  const v = state?.ok ? undefined : state?.values;

  return (
    <form action={action} className="relative space-y-6" noValidate>
      <Honeypot />
      <FormMessage state={state} />
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="field-label">Name</label>
          <input id="name" name="name" autoComplete="name" required defaultValue={v?.name} className="field" {...fieldAria(state, "name")} />
          <FieldError state={state} name="name" />
        </div>
        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required defaultValue={v?.email} className="field" {...fieldAria(state, "email")} />
          <FieldError state={state} name="email" />
        </div>
        <div>
          <label htmlFor="phone" className="field-label">Phone <span className="normal-case tracking-normal text-muted">(optional)</span></label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={v?.phone} className="field" {...fieldAria(state, "phone")} />
          <FieldError state={state} name="phone" />
        </div>
        <div>
          <label htmlFor="subject" className="field-label">Subject</label>
          <input id="subject" name="subject" required defaultValue={v?.subject} className="field" {...fieldAria(state, "subject")} />
          <FieldError state={state} name="subject" />
        </div>
      </div>
      <div>
        <label htmlFor="message" className="field-label">Message</label>
        <textarea id="message" name="message" rows={7} required defaultValue={v?.message} className="field" {...fieldAria(state, "message")} />
        <FieldError state={state} name="message" />
      </div>
      <p className="text-xs text-muted">We use your details only to reply to this message. See our privacy policy.</p>
      <SubmitButton pendingText="Sending…">Send message</SubmitButton>
    </form>
  );
}
