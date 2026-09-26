import { readFile } from "node:fs/promises";
import path from "node:path";
import { IMAGE_TYPES, uploadDir } from "@/lib/uploads";

const EXT_TO_TYPE = Object.fromEntries(Object.entries(IMAGE_TYPES).map(([type, ext]) => [ext, type]));

export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path: parts } = await ctx.params;
  const name = parts.join("/");
  // Only flat, generated file names are served.
  if (!/^[a-z0-9-]+\.(jpg|png|webp|avif)$/.test(name)) return new Response("Not found", { status: 404 });

  const file = path.join(uploadDir(), name);
  try {
    const data = await readFile(file);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": EXT_TO_TYPE[name.split(".").pop()!],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
