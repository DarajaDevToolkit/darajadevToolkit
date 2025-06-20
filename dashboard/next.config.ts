import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@daraja-toolkit/shared"],
  experimental: {
    // Enable if you want to use the new compiler
    // turbo: {
    //   rules: {
    //     "*.svg": {
    //       loaders: ["@svgr/webpack"],
    //       as: "*.js",
    //     },
    //   },
    // },
  },
};

export default nextConfig;
