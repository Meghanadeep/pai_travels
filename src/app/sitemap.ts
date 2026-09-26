import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const trips = await prisma.trip.findMany({
    where: { status: "PUBLISHED", isSample: false },
    select: { slug: true, updatedAt: true },
  });
  const pastTrips = await prisma.pastTrip.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } });
  const staticPaths = ["", "/trips", "/past-trips", "/about", "/contact", "/faqs", "/privacy", "/terms", "/cancellation-policy"];
  return [
    ...staticPaths.map((p) => ({ url: `${site.url}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6 })),
    ...trips.map((t) => ({ url: `${site.url}/trips/${t.slug}`, lastModified: t.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...pastTrips.map((t) => ({ url: `${site.url}/past-trips/${t.slug}`, lastModified: t.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
