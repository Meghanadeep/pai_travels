import sharp from "sharp";
import { prisma } from "@/lib/db";
import { readPrivateImage } from "@/lib/private-files";

// Public past-trip photos. Served only while the photo is approved (rights
// confirmed) and its trip is published; otherwise it doesn't exist publicly.
// Pages render these unoptimized so next/image's cache can't outlive a withdrawn approval.
export async function GET(req: Request, ctx: RouteContext<"/photos/[id]">) {
  const { id } = await ctx.params;
  const photo = await prisma.pastTripPhoto.findFirst({
    where: { id, approvedAt: { not: null }, pastTrip: { status: "PUBLISHED" } },
    select: { fileName: true },
  });
  if (!photo) return new Response("Not found", { status: 404 });

  const width = new URL(req.url).searchParams.get("w") === "800" ? 800 : 1800;
  try {
    const data = await sharp(await readPrivateImage("photos", photo.fileName))
      .rotate()
      .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
