/**
 * @file handles the local publication of Revstack packages using yalc.
 * This replaces NPM snapshots for a faster local-only workflow.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const PACKAGES_DIR = "packages";

function runLocalPush() {
  console.log("Starting Revstack local push (yalc)...");

  try {
    // 1. Build everything first
    console.log("Compiling monorepo with Turbo...");
    execSync("pnpm turbo build", { stdio: "inherit" });

    // 2. Publish each package to the local yalc store
    const packageDirs = fs
      .readdirSync(PACKAGES_DIR)
      .filter((f) => fs.statSync(path.join(PACKAGES_DIR, f)).isDirectory());

    packageDirs.forEach((dir) => {
      const pkgPath = path.join(PACKAGES_DIR, dir);
      if (fs.existsSync(path.join(pkgPath, "package.json"))) {
        console.log(`Pushing ${dir} to yalc...`);
        // --push tells yalc to automatically update any project that uses this package
        execSync("yalc publish --push --sig", {
          cwd: pkgPath,
          stdio: "inherit",
        });
      }
    });

    console.log("Success! All packages are now available locally via yalc.");
  } catch (error) {
    console.error("Local push failed:", error.message);
  }
}

runLocalPush();
