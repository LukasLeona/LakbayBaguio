import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.baguiobuddy.com" }],
        destination: "https://baguiobuddy.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "lakbay-baguio.vercel.app" }],
        destination: "https://baguiobuddy.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
