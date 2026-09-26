// Hosts next/image may optimise. Keep in sync with next.config.ts (both read IMAGE_REMOTE_HOSTS).
export const DEFAULT_IMAGE_HOSTS = ["images.unsplash.com"];

export function allowedImageHosts() {
  const extra = (process.env.IMAGE_REMOTE_HOSTS || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...DEFAULT_IMAGE_HOSTS, ...extra])];
}

/** Accepts uploaded files (/media/…), images bundled in public/images/…, or https URLs on an allowed host. */
export function isAllowedImageUrl(value: string) {
  if (/^\/(media|images)\/[\w\-./]+$/.test(value) && !value.includes("..")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedImageHosts().includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}
