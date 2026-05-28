import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@milky/db", "@milky/config"],
};

export default nextConfig;
