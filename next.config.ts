import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  serverExternalPackages: ["exceljs", "@prisma/client", "prisma"],
  // Vercel demo 배포용: 빌드 시 생성된 SQLite 파일과 Prisma 쿼리 엔진 바이너리를
  // 서버리스 번들에 포함시킨다. pnpm은 엔진을 .pnpm 중첩 경로에 두는데
  // Next.js 트레이싱이 이를 누락해 런타임에 "Query engine could not be found" 예외가 나므로 명시적으로 포함한다.
  outputFileTracingIncludes: {
    "/**": [
      "./data/**/*",
      "./node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*",
      "./node_modules/.prisma/client/**/*",
    ],
  },
};

export default nextConfig;
