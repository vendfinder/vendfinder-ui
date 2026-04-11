import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Service build directories
    ".chat-service-build/**",
    "api-gateway-build/**",
    "chat-service/**",
    "order-service/**",
    "product-service/**",
    "user-service-oauth/**",
    "websocket-service/**",
    "support-bot/**",
    // Other build/generated directories
    "dist/**",
    "node_modules/**",
    "*.tsbuildinfo",
    // Monitoring
    "monitoring/**",
    // Mobile
    "mobile/**",
    // Environment configuration files (our new files)
    "environments/**",
    // Root level script files
    "*.js",
    "!eslint.config.mjs",
    "!next.config.js",
    "!next.config.ts",
  ]),
]);

export default eslintConfig;
