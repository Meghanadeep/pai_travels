"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { BookingError, createInquiry } from "@/lib/bookings";
import { adminNotifyAddress, sendMail } from "@/lib/email";
import { formatDateRange, formatPrice } from "@/lib/format";
import { rateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site";
import { contactSchema, fieldErrors, formValues, inquirySchema, type FormState } from "@/lib/validation";

const SPAM_OK: FormState = { ok: true, message: "Thank you — your message has been received." };

export async function submitInquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("website")) return SPAM_OK;
  if (!(await rateLimit("inquiry", 6, 10 * 60 * 1000))) {
    return { ok: false, message: "Too many requests from your connection. Please wait a few minutes and try again." };
  }

  const parsed = inquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values: formValues(formData) };
  }

  let reference: string;
  try {
    const { inquiry, departure, trip } = await createInquiry(parsed.data);
    reference = inquiry.reference;
    const dates = formatDateRange(departure.startDate, departure.endDate);

    const notify = adminNotifyAddress();
    await Promise.all([
      notify &&
        sendMail({
          to: notify,
          replyTo: inquiry.email,
          subject: `New booking inquiry ${inquiry.reference} — ${trip.title}`,
          text: [
            `Reference: ${inquiry.reference}`,
            `Trip: ${trip.title}`,
            `Departure: ${dates}`,
            `Travellers: ${inquiry.travellers}`,
            `Quoted price: ${formatPrice(inquiry.pricePerPerson)} per person`,
            `Name: ${inquiry.fullName}`,
            `Email: ${inquiry.email}`,
            `Phone: ${inquiry.phone}`,
            inquiry.country ? `Country: ${inquiry.country}` : "",
            inquiry.message ? `\nMessage:\n${inquiry.message}` : "",
            `\nReview in the admin portal: ${site.url}/admin/inquiries/${inquiry.id}`,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      sendMail({
        to: inquiry.email,
        subject: `We've received your inquiry (${inquiry.reference})`,
        text: `Hello ${inquiry.fullName},\n\nThank you for your interest in "${trip.title}" (${dates}) for ${inquiry.travellers} traveller(s). Your reference is ${inquiry.reference}.\n\nWe've held these seats while we review your request and will be in touch shortly. No payment has been taken.\n\n${site.name}\n${site.email} · ${site.phone}`,
      }),
    ]);
    revalidatePath(`/trips/${trip.slug}`);
  } catch (err) {
    if (err instanceof BookingError) return { ok: false, message: err.message, values: formValues(formData) };
    console.error("[inquiry] failed", err);
    return { ok: false, message: "Something went wrong on our side. Please try again, or contact us directly.", values: formValues(formData) };
  }

  redirect(`/inquiry/thank-you?ref=${encodeURIComponent(reference)}`);
}

export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("website")) return SPAM_OK;
  if (!(await rateLimit("contact", 5, 10 * 60 * 1000))) {
    return { ok: false, message: "Too many messages from your connection. Please wait a few minutes and try again." };
  }
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values: formValues(formData) };
  }
  try {
    const msg = await prisma.contactMessage.create({ data: parsed.data });
    const notify = adminNotifyAddress();
    if (notify) {
      await sendMail({
        to: notify,
        replyTo: msg.email,
        subject: `Website message: ${msg.subject}`,
        text: `From: ${msg.name} <${msg.email}>${msg.phone ? `\nPhone: ${msg.phone}` : ""}\n\n${msg.message}\n\nView: ${site.url}/admin/messages`,
      });
    }
  } catch (err) {
    console.error("[contact] failed", err);
    return { ok: false, message: "We couldn't send your message just now. Please try again or email us directly.", values: formValues(formData) };
  }
  return { ok: true, message: "Thank you — your message has been received. We usually reply within one working day." };
}
