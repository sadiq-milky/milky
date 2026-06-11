import path from "path";
import { createRequire } from "module";

// createRequire lets us use require.resolve in an ESM file.
// Paths are resolved relative to this config file (apps/web/), so:
//   react      → apps/web/node_modules/react        (18.3.1)
//   react-dom  → root/node_modules/react-dom        (18.3.1, hoisted by npm)
// Webpack redirects every require('react') — including react-dom's internals —
// to the same physical copy, giving both a single shared singleton.
const _require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@milky/db", "@milky/config"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.dirname(_require.resolve("react/package.json")),
      "react-dom": path.dirname(_require.resolve("react-dom/package.json")),
    };
    return config;
  },
};

export default nextConfig;
