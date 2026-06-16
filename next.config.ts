import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained .next/standalone server for minimal Docker images.
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
