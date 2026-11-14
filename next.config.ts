import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  serverExternalPackages: ["exceljs", "@prisma/client", "prisma"],
  // pnpm nests the Prisma engine under .pnpm, so include it explicitly in Vercel bundles.
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*",
      "./node_modules/.prisma/client/**/*",
    ],
  },
};

export default nextConfig;
