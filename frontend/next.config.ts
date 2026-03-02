import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No rewrites needed natively for /api since pages/api/[[...slug]].ts handles Express
};

export default nextConfig;

