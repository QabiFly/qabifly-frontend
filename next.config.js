/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "qabifly.vps.qalbconverfy.in" },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options",  value: "nosniff"          },
        { key: "X-Frame-Options",          value: "DENY"             },
        { key: "Referrer-Policy",          value: "strict-origin"    },
      ],
    },
    {
      source: "/sw.js",
      headers: [
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate"  },
      ],
    },
  ],
};

module.exports = nextConfig;
