import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { privateImageResponse } from "@/lib/private-files";

// Admin-only access to imported originals and unapproved past-trip photos.
export async function GET(_req: Request, ctx: RouteContext<"/api/admin/files/[kind]/[id]">) {
  if (!(await getAdmin())) return new Response("Unauthorized", { status: 401 });
  const { kind, id } = await ctx.params;
  const row =
    kind === "imports"
      ? await prisma.tripImport.findUnique({ where: { id }, select: { fileName: true } })
      : kind === "photos"
        ? await prisma.pastTripPhoto.findUnique({ where: { id }, select: { fileName: true } })
        : null;
  if (!row) return new Response("Not found", { status: 404 });
  return privateImageResponse(kind as "imports" | "photos", row.fileName, "private, no-store");
}
