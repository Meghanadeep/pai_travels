// Business details shown across the site. Override via environment variables.
// Defaults are obvious placeholders so they are never mistaken for real details.
export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Pai Travels",
  tagline: "Small-group journeys, thoughtfully paced.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@example.com",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+91 00000 00000",
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || "Office address to be added",
  hours: process.env.NEXT_PUBLIC_CONTACT_HOURS || "Mon–Sat, 10:00–18:00 IST",
  currency: process.env.NEXT_PUBLIC_CURRENCY || "INR",
  locale: process.env.NEXT_PUBLIC_LOCALE || "en-IN",
};
