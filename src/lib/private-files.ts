import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { copyFile, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { IMAGE_TYPES, assertUploadsSupported, sniffImageType, uploadDir } from "./uploads";

// Imported originals and past-trip photos live under UPLOAD_DIR/private/. The
// public /media route only serves flat file names in UPLOAD_DIR, so nothing here
// is reachable without going through an access-checked route.
export type PrivateKind = "imports" | "photos";

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

const EXT_TO_TYPE = Object.fromEntries(Object.entries(IMAGE_TYPES).map(([type, ext]) => [ext, type]));
const NAME_RE = /^[a-z0-9-]+\.(jpg|png|webp|avif)$/;

function privatePath(kind: PrivateKind, fileName: string) {
  if (!NAME_RE.test(fileName)) throw new Error("Invalid file name");
  return path.join(uploadDir(), "private", kind, fileName);
}

function newName(ext: string) {
  return `${Date.now().toString(36)}-${randomBytes(8).toString("hex")}.${ext}`;
}

/** Validates the bytes and stores them. Returns the stored name and metadata. */
export async function savePrivateImage(kind: PrivateKind, buf: Buffer, maxBytes: number) {
  assertUploadsSupported();
  if (buf.length > maxBytes) throw new Error(`Images must be ${Math.round(maxBytes / 1024 / 1024)} MB or smaller.`);
  const mimeType = sniffImageType(buf);
  if (!mimeType) throw new Error("Upload a JPEG, PNG, WebP or AVIF image.");
  const fileName = newName(IMAGE_TYPES[mimeType]);
  await mkdir(path.dirname(privatePath(kind, fileName)), { recursive: true });
  await writeFile(privatePath(kind, fileName), buf, { flag: "wx" });
  return { fileName, mimeType, sizeBytes: buf.length, sha256: createHash("sha256").update(buf).digest("hex") };
}

/** Copies a stored file to another private area under a new name (the source is left untouched). */
export async function copyPrivateImage(from: PrivateKind, fileName: string, to: PrivateKind) {
  const target = newName(fileName.split(".").pop()!);
  await mkdir(path.dirname(privatePath(to, target)), { recursive: true });
  await copyFile(privatePath(from, fileName), privatePath(to, target));
  return target;
}

export function readPrivateImage(kind: PrivateKind, fileName: string) {
  return readFile(privatePath(kind, fileName));
}

export async function deletePrivateImage(kind: PrivateKind, fileName: string) {
  await unlink(privatePath(kind, fileName)).catch(() => {});
}

export function imageTypeOf(fileName: string) {
  return EXT_TO_TYPE[fileName.split(".").pop()!] ?? "application/octet-stream";
}

/** Builds an image response for a private file, or a 404. */
export async function privateImageResponse(kind: PrivateKind, fileName: string, cacheControl: string) {
  try {
    const data = await readPrivateImage(kind, fileName);
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": imageTypeOf(fileName), "Cache-Control": cacheControl, "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
