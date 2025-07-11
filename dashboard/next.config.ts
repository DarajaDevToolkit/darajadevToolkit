import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // 👈 Required for distroless Docker images
};

export default nextConfig;
