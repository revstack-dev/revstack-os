import { defineConfig } from "tsup";
import { execa } from "execa";

export default defineConfig({
  entry: ["src/**/*.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  target: "node18",
  outDir: "dist",
  skipNodeModulesBundle: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  async onSuccess() {
    await execa("tsc-alias", ["-p", "tsconfig.json"], {
      stdio: "inherit",
    });
  },
});
