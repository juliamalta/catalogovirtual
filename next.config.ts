import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // Lint is run explicitly by `npm run lint` with the configured ESLint CLI.
  eslint: { ignoreDuringBuilds: true }
};
export default nextConfig;
