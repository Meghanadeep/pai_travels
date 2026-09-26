"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FieldError, FormMessage, Honeypot, SubmitButton, fieldAria } from "@/components/form-bits";
import { submitInquiry } from "../../../actions";

export type DepartureOption = {
  id: string;
  label: string;
  price: number;
  priceLabel: string;
  standardPriceLabel: string | null;
  seatsLeft: number;
};

export function InquiryForm({
  departures,
  initialDepartureId,
  groupSizeMax,
  currency,
  locale,
}: {
  departures: DepartureOption[];
  initialDepartureId?: string;
  groupSizeMax: number;
  currency: string;
  locale: string;
}) {
  const [state, action] = useActionState(submitInquiry, null);
  const [departureId, setDepartureId] = useState(
    departures.some((d) => d.id === initialDepartureId) ? initialDepartureId! : departures[0]?.id ?? "",
  );
  const [travellers, setTravellers] = useState(2);
  const selected = departures.find((d) => d.id === departureId);
  const maxTravellers = Math.max(1, Math.min(selected?.seatsLeft ?? 1, groupSizeMax, 20));
  const tooMany = travellers > maxTravellers;
  const total = selected ? selected.price * travellers : 0;
  const money = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 });

  return (
    <form action={action} className="relative grid gap-10 lg:grid-cols-[1fr_20rem]" noValidate>
      <Honeypot />
      <div className="space-y-10">
        <FormMessage state={state} />

        <fieldset>
          <legend className="font-serif text-3xl">1. Choose your departure</legend>
          <div role="radiogroup" aria-describedby="departureId-error" className="mt-5 grid gap-3">
            {departures.map((d) => (
              <label
                key={d.id}
                className={`flex cursor-pointer flex-wrap items-center justify-between gap-3 border p-4 transition-colors ${
                  departureId === d.id ? "border-ink bg-paper-deep" : "border-line hover:border-muted"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="departureId"
                    value={d.id}
                    checked={departureId === d.id}
                    onChange={() => setDepartureId(d.id)}
                    className="h-4 w-4 accent-[#6e2a24]"
                  />
                  <span>
                    <span className="block font-serif text-xl">{d.label}</span>
                    <span className={`text-xs ${d.seatsLeft <= 4 ? "text-oxblood" : "text-muted"}`}>
                      {d.seatsLeft} seat{d.seatsLeft === 1 ? "" : "s"} left
                    </span>
                  </span>
                </span>
                <span className="text-right">
                  <span className="font-serif text-xl">{d.priceLabel}</span>
                  {d.standardPriceLabel && (
                    <span className="block text-xs text-brass-deep">
                      Early bird · <s>{d.standardPriceLabel}</s>
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
          <FieldError state={state} name="departureId" />
        </fieldset>

        <fieldset>
          <legend className="font-serif text-3xl">2. Travellers</legend>
          <div className="mt-5 max-w-xs">
            <label htmlFor="travellers" className="field-label">Number of travellers</label>
            <input
              id="travellers"
              name="travellers"
              type="number"
              min={1}
              max={maxTravellers}
              value={travellers}
              onChange={(e) => setTravellers(Math.max(1, Number(e.target.value) || 1))}
              required
              className="field"
              {...fieldAria(state, "travellers")}
              aria-invalid={tooMany || state?.fieldErrors?.travellers ? true : undefined}
            />
            {tooMany ? (
              <p className="field-error" role="alert">
                Only {maxTravellers} seat{maxTravellers === 1 ? " is" : "s are"} available on this departure.
              </p>
            ) : (
              <FieldError state={state} name="travellers" />
            )}
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-serif text-3xl">3. Your details</legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className="field-label">Full name</label>
              <input id="fullName" name="fullName" defaultValue={state?.values?.fullName} autoComplete="name" required className="field" {...fieldAria(state, "fullName")} />
              <FieldError state={state} name="fullName" />
            </div>
            <div>
              <label htmlFor="email" className="field-label">Email</label>
              <input id="email" name="email" defaultValue={state?.values?.email} type="email" autoComplete="email" required className="field" {...fieldAria(state, "email")} />
              <FieldError state={state} name="email" />
            </div>
            <div>
              <label htmlFor="phone" className="field-label">Phone</label>
              <input id="phone" name="phone" defaultValue={state?.values?.phone} type="tel" autoComplete="tel" required className="field" {...fieldAria(state, "phone")} />
              <FieldError state={state} name="phone" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="country" className="field-label">Country of residence <span className="normal-case tracking-normal text-muted">(optional)</span></label>
              <input id="country" name="country" defaultValue={state?.values?.country} autoComplete="country-name" className="field" {...fieldAria(state, "country")} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="message" className="field-label">Anything we should know? <span className="normal-case tracking-normal text-muted">(optional)</span></label>
              <textarea id="message" name="message" defaultValue={state?.values?.message} rows={4} placeholder="Room preferences, dietary needs, questions…" className="field" {...fieldAria(state, "message")} />
              <FieldError state={state} name="message" />
            </div>
          </div>
          <label className="mt-6 flex items-start gap-3 text-sm">
            <input type="checkbox" name="consent" required defaultChecked={state?.values?.consent === "on"} className="mt-1 h-4 w-4 accent-[#6e2a24]" {...fieldAria(state, "consent")} />
            <span>
              I agree that {"we"} may contact me about this inquiry, and I have read the{" "}
              <Link href="/privacy" className="link-underline" target="_blank">privacy policy</Link> and{" "}
              <Link href="/terms" className="link-underline" target="_blank">terms</Link>.
            </span>
          </label>
          <FieldError state={state} name="consent" />
        </fieldset>
      </div>

      <aside>
        <div className="sticky top-24 border border-ink p-6">
          <h2 className="eyebrow">Your request</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Departure</dt>
              <dd className="text-right">{selected?.label ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Price per person</dt>
              <dd>{selected?.priceLabel ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Travellers</dt>
              <dd>{travellers}</dd>
            </div>
          </dl>
          <div className="rule my-4" />
          <p className="eyebrow text-muted">Estimated total</p>
          <p className="font-serif text-4xl" aria-live="polite">{selected ? money.format(total) : "—"}</p>
          <SubmitButton className="btn btn-accent mt-6 w-full" pendingText="Sending request…">
            Send booking request
          </SubmitButton>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            This is a request, not a payment. We hold your seats while we review it and will contact you to confirm.
          </p>
        </div>
      </aside>
    </form>
  );
}
