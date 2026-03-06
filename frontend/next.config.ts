import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reduces function size and fixes Vercel zip limits
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  experimental: {},
};

export default nextConfig;

