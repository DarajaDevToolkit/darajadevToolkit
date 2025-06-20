/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@daraja-toolkit/shared"],
  experimental: {
    // Configuration for turbopack if needed
  },
};

module.exports = nextConfig;
