import type { NextConfig } from "next";

// Keep in sync with src/lib/images.ts
const imageHosts = [
  "images.unsplash.com",
  ...(process.env.IMAGE_REMOTE_HOSTS || "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: imageHosts.map((hostname) => ({ protocol: "https" as const, hostname })),
    localPatterns: [{ pathname: "/media/**" }, { pathname: "/**", search: "" }],
  },
  experimental: {
    serverActions: { bodySizeLimit: "11mb" }, // admin image uploads (past-trip imports allow up to 10 MB)
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
