import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  publicDir: "assets",
  splitting: false,
  tsconfig: "tsconfig.build.json",
});
