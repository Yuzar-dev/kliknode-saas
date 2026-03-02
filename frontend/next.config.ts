import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reduces function size and fixes Vercel zip limits
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
};

export default nextConfig;

