import { site } from "./site";
import type { TripType, InquiryStatus, DepartureStatus, TripStatus } from "@/generated/prisma/enums";

const money = new Intl.NumberFormat(site.locale, {
  style: "currency",
  currency: site.currency,
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number) {
  return money.format(amount);
}

// Departure dates are stored as calendar dates (UTC midnight); always format in UTC.
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const shortFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export const formatDate = (d: Date) => dateFmt.format(d);
export const formatShortDate = (d: Date) => shortFmt.format(d);
export const formatMonth = (d: Date) => monthFmt.format(d).toUpperCase();
export const formatDateTime = (d: Date) => dateTimeFmt.format(d);

export function formatDateRange(start: Date, end: Date) {
  if (start.getUTCFullYear() === end.getUTCFullYear()) return `${formatShortDate(start)} – ${formatDate(end)}`;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

/** YYYY-MM-DD for <input type="date"> */
export function toDateInput(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "";
}

/** Today's date at UTC midnight. Departures must start after this to be bookable. */
export function todayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export const tripTypeLabels: Record<TripType, string> = {
  HERITAGE: "Heritage & Culture",
  NATURE: "Nature & Slow Travel",
  ADVENTURE: "Mountains & Adventure",
  WELLNESS: "Wellness & Retreats",
  COASTAL: "Coast & Islands",
  CULINARY: "Food & Craft",
};

export const tripTypeBlurbs: Record<TripType, string> = {
  HERITAGE: "Palaces, old cities and living traditions.",
  NATURE: "Backwaters, forests and unhurried days.",
  ADVENTURE: "High passes, trails and big horizons.",
  WELLNESS: "Retreats built around rest and ritual.",
  COASTAL: "Quiet shores, bays and island hopping.",
  CULINARY: "Markets, kitchens and makers.",
};

export const inquiryStatusLabels: Record<InquiryStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
};

export const departureStatusLabels: Record<DepartureStatus, string> = {
  OPEN: "Open",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

export const tripStatusLabels: Record<TripStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function durationLabel(days: number) {
  return `${days} day${days === 1 ? "" : "s"} · ${Math.max(days - 1, 0)} night${days - 1 === 1 ? "" : "s"}`;
}

export function groupSizeLabel(min: number, max: number | null) {
  if (max == null) return min > 1 ? `${min}+ travellers` : "On request";
  return min === max ? `${min} travellers` : `${min}–${max} travellers`;
}
