const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Let Metro find packages in the monorepo root (e.g. @milky/db, @milky/config)
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// @clerk/react imports react-dom but only uses it in web code paths.
// React Native doesn't have react-dom — return an empty module so the
// import resolves without crashing.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-dom" || moduleName.startsWith("react-dom/")) {
    return { type: "empty" };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
