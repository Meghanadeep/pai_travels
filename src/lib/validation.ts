import { z } from "zod";
import { isAllowedImageUrl, allowedImageHosts } from "./images";

export type FormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Submitted values, echoed back so fields keep their content after React resets the form. */
  values?: Record<string, string>;
} | null;

export function formValues(formData: FormData) {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string" && k !== "website" && !k.startsWith("$")) out[k] = v;
  return out;
}

export function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
}

// Browsers submit textarea line breaks as CRLF; store plain \n so paragraph splitting works.
const trimmed = (max: number) =>
  z
    .string()
    .overwrite((v) => v.replace(/\r\n?/g, "\n"))
    .trim()
    .max(max, `Must be ${max} characters or fewer`);
const required = (label: string, max: number) => trimmed(max).min(1, `${label} is required`);
const optionalText = (max: number) =>
  trimmed(max)
    .optional()
    .transform((v) => (v ? v : null));

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")).pipe(z.string().max(160));
const phone = z
  .string()
  .trim()
  .min(6, "Enter a phone number we can reach you on")
  .max(30)
  .regex(/^[+\d][\d\s().-]*$/, "Use digits, spaces and an optional leading +");

const dateString = (label: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a valid date`)
    .transform((v) => new Date(`${v}T00:00:00.000Z`));

const lines = (label: string, maxItems = 30) =>
  z
    .string()
    .transform((v) =>
      v
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().max(300)).max(maxItems, `${label}: at most ${maxItems} lines`));

const imageUrl = z
  .string()
  .trim()
  .refine(isAllowedImageUrl, {
    message: `Use an uploaded image (/media/…) or an https URL from: ${allowedImageHosts().join(", ")}`,
  });

// ─── Public forms ──────────────────────────────────────────────────────────────

export const inquirySchema = z.object({
  departureId: z.string().min(1, "Choose a departure date"),
  travellers: z.coerce.number().int("Whole numbers only").min(1, "At least 1 traveller").max(20, "For groups larger than 20, please contact us"),
  fullName: required("Full name", 120),
  email,
  phone,
  country: optionalText(80),
  message: optionalText(2000),
  consent: z.literal("on", { error: "Please agree so we can contact you about this inquiry" }),
});

export const contactSchema = z.object({
  name: required("Name", 120),
  email,
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => v || null),
  subject: required("Subject", 160),
  message: required("Message", 4000).min(10, "Please write at least a few words"),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(200),
});

// ─── Admin forms ───────────────────────────────────────────────────────────────

export const tripSchema = z
  .object({
    title: required("Title", 140),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$|^$/, "Lowercase letters, numbers and single hyphens only")
      .optional(),
    destination: required("Destination", 80),
    country: required("Country", 80),
    tripType: z.enum(["HERITAGE", "NATURE", "ADVENTURE", "WELLNESS", "COASTAL", "CULINARY"], { error: "Choose a trip type" }),
    featured: z
      .string()
      .optional()
      .transform((v) => v === "on"),
    isSample: z
      .string()
      .optional()
      .transform((v) => v === "on"),
    summary: required("Summary", 300),
    overview: required("Overview", 6000),
    highlights: lines("Highlights"),
    accommodation: required("Accommodation", 3000),
    transport: required("Transport", 3000),
    meals: required("Meals", 2000),
    inclusions: lines("Inclusions", 40),
    exclusions: lines("Exclusions", 40),
    meetingPoint: required("Meeting point", 1000),
    cancellationPolicy: required("Cancellation policy", 4000),
    requirements: required("Travel requirements", 4000),
    durationDays: z.coerce.number().int().min(1, "At least 1 day").max(60),
    groupSizeMin: z.coerce.number().int().min(1).max(100),
    groupSizeMax: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : null))
      .pipe(z.number().int("Whole numbers only").min(1).max(200).nullable()),
    priceFrom: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : null))
      .pipe(z.number().int("Whole amounts only").min(0).max(100_000_000).nullable()),
    priceNote: optionalText(300),
    validUntil: z
      .string()
      .optional()
      .transform((v) => v || null)
      .pipe(dateString("Offer end date").nullable()),
    coverImageUrl: imageUrl,
    coverImageAlt: required("Cover image description", 200),
    contactEmail: z
      .string()
      .trim()
      .optional()
      .transform((v) => v || null)
      .pipe(z.email("Enter a valid email").nullable()),
    contactPhone: optionalText(30),
    seoTitle: optionalText(70),
    seoDescription: optionalText(170),
  })
  .refine((t) => t.groupSizeMax == null || t.groupSizeMax >= t.groupSizeMin, {
    path: ["groupSizeMax"],
    message: "Maximum group size must be at least the minimum",
  });

export const departureSchema = z
  .object({
    startDate: dateString("Start date"),
    endDate: dateString("End date"),
    price: z.coerce.number().int("Whole amounts only").min(0).max(100_000_000),
    capacity: z.coerce.number().int().min(0, "Capacity cannot be negative").max(500),
    status: z.enum(["OPEN", "CLOSED", "CANCELLED"]),
    earlyBirdPrice: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : null))
      .pipe(z.number().int().min(0).nullable()),
    earlyBirdEndsAt: z
      .string()
      .optional()
      .transform((v) => v || null)
      .pipe(dateString("Early bird end date").nullable()),
    note: optionalText(200),
  })
  .refine((d) => d.endDate >= d.startDate, { path: ["endDate"], message: "End date must be on or after the start date" })
  .refine((d) => (d.earlyBirdPrice == null) === (d.earlyBirdEndsAt == null), {
    path: ["earlyBirdPrice"],
    message: "Set both an early bird price and its end date, or neither",
  })
  .refine((d) => d.earlyBirdPrice == null || d.earlyBirdPrice < d.price, {
    path: ["earlyBirdPrice"],
    message: "Early bird price must be lower than the standard price",
  })
  .refine((d) => d.earlyBirdEndsAt == null || d.earlyBirdEndsAt < d.startDate, {
    path: ["earlyBirdEndsAt"],
    message: "Early bird offer must end before the departure starts",
  });

export const itineraryDaySchema = z.object({
  dayNumber: z.coerce.number().int().min(1).max(60),
  title: required("Title", 140),
  description: required("Description", 4000),
  meals: optionalText(120),
  overnight: optionalText(160),
});

export const faqSchema = z.object({
  question: required("Question", 300),
  answer: required("Answer", 3000),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const imageSchema = z.object({
  url: imageUrl,
  alt: required("Image description", 200),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const reviewSchema = z.object({
  name: required("Name", 80),
  location: optionalText(80),
  rating: z.coerce.number().int().min(1).max(5),
  body: required("Review", 1500),
  tripId: z
    .string()
    .optional()
    .transform((v) => v || null),
  published: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

export const inquiryUpdateSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CONFIRMED", "DECLINED", "CANCELLED"]),
  adminNotes: optionalText(4000),
});

// ─── Past trips & imports ──────────────────────────────────────────────────────

const optionalDate = (label: string) =>
  z
    .string()
    .optional()
    .transform((v) => v || null)
    .pipe(dateString(label).nullable());

export const pastTripSchema = z
  .object({
    title: required("Title", 140),
    destination: required("Destination", 120),
    country: optionalText(80),
    startDate: optionalDate("Start date"),
    endDate: optionalDate("End date"),
    dateText: optionalText(80),
    durationText: optionalText(60),
    summary: trimmed(300),
    description: trimmed(6000),
    places: lines("Places", 40),
    itinerary: optionalText(6000),
    accommodation: optionalText(1000),
    activities: lines("Activities", 40),
    priceNote: optionalText(300),
  })
  .refine((t) => !t.endDate || !t.startDate || t.endDate >= t.startDate, {
    path: ["endDate"],
    message: "End date must be on or after the start date",
  })
  .refine((t) => !t.endDate || t.startDate, { path: ["startDate"], message: "Add a start date, or clear the end date" });
export type PastTripInput = z.infer<typeof pastTripSchema>;

export const importTargetSchema = z.discriminatedUnion("target", [
  z.object({ target: z.literal("new"), confirmNotDuplicate: z.literal("on").optional() }),
  z.object({ target: z.literal("existing"), existingId: z.string().min(1, "Choose the past trip to update") }),
]);

export const photoSchema = z.object({
  alt: trimmed(200),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const photoApprovalSchema = z.object({
  alt: required("Image description", 200),
  rightsConfirmed: z.literal("on", { error: "Confirm you have the right to publish this image" }),
  rightsNote: required("Who holds the rights", 200),
});
