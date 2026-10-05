import type { NextConfig } from "next";

// Legacy image hosts: every stored image URL (news, galleries, propozice) points
// at one of these, so they must stay allow-listed for next/image.
const S3_HOST = "sayfyho-memorial.s3.eu-central-1.amazonaws.com";
const CLOUDFRONT_HOST = "d3o6i10cj9gxf0.cloudfront.net";

// Host NEW uploads are served from (built by the storage adapter from
// S3_PUBLIC_HOST). Often one of the above; in dev it may be a test bucket.
const uploadHost = process.env.S3_PUBLIC_HOST?.trim();

// The browser PUTs uploads straight to the bucket's own endpoint via a presigned
// URL — not necessarily the public/CDN host — so connect-src needs it separately.
const region = process.env.AWS_REGION?.trim();
const bucket = process.env.AWS_BUCKET_NAME?.trim();
const s3UploadOrigin =
  region && bucket ? `https://${bucket}.s3.${region}.amazonaws.com` : "";

const imageHosts = [
  ...new Set([S3_HOST, CLOUDFRONT_HOST, ...(uploadHost ? [uploadHost] : [])]),
];
const imageOrigins = imageHosts.map((host) => `https://${host}`).join(" ");

// Next and next-themes inject inline <script>/<style>, so 'unsafe-inline' is
// required until a nonce approach is adopted (which would force dynamic
// rendering). Enforced in production; Report-Only in dev because Turbopack HMR
// relies on eval.
const isProduction = process.env.NODE_ENV === "production";
const cspHeader = isProduction
  ? "Content-Security-Policy"
  : "Content-Security-Policy-Report-Only";
const csp = [
  "default-src 'self'",
  `img-src 'self' data: blob: ${imageOrigins}`,
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `media-src 'self' ${imageOrigins}`,
  `connect-src 'self' blob: ${s3UploadOrigin}`.trim(),
  // Results are embedded from sportt.cz; editor videos only via youtube-nocookie.
  "frame-src https://sportt.cz https://www.sportt.cz https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Mongoose (Phase 1) is a server-only Node package; keep it out of the bundler.
  serverExternalPackages: ["mongoose"],
  images: {
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: cspHeader, value: csp },
        ],
      },
    ];
  },
  // Legacy admin/login paths (docs/04 route map). Public URLs are unchanged.
  async redirects() {
    return [
      { source: "/login", destination: "/prihlaseni", permanent: true },
      {
        source: "/aktuality/new",
        destination: "/admin/aktuality/nova",
        permanent: true,
      },
      {
        source: "/aktuality/edit/:id",
        destination: "/admin/aktuality/:id",
        permanent: true,
      },
      {
        source: "/fotogalerie/new",
        destination: "/admin/fotogalerie/nova",
        permanent: true,
      },
      {
        source: "/propozice/edit",
        destination: "/admin/propozice",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
