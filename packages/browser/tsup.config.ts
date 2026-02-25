import { defineConfig } from "tsup";

export default defineConfig([
  // ── ESM + CJS (for modern bundlers & Node.js) ──────────────────────
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
  },
  // ── IIFE (for CDNs — unpkg / jsdelivr / <script> tags) ────────────
  {
    entry: ["src/index.ts"],
    format: ["iife"],
    globalName: "Revstack",
    minify: true,
    sourcemap: true,
    outExtension: () => ({ js: ".global.js" }),
  },
]);
