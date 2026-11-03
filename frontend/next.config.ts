import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Reduces function size and fixes Vercel zip limits
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {},
};

export default nextConfig;

