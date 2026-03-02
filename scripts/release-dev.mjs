/**
 * @file handles the automated generation, build, and publication
 * of development snapshots for the Revstack monorepo.
 * Forces all packages to be published by generating a unique changeset per run.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/** @type {string} Directory where monorepo packages are located */
const PACKAGES_DIR = "packages";

/** @type {string} Changesets configuration directory */
const CHANGESET_DIR = ".changeset";

/** @type {string} Temporary filename for the forced changeset */
const SNAPSHOT_FILENAME = "force-snapshot.md";

/**
 * Orchestrates the snapshot release process.
 */
function runRelease() {
  console.log("Starting Revstack snapshot engine...");

  try {
    // 1. Retrieve all valid packages by reading their package.json
    const packageDirs = fs
      .readdirSync(PACKAGES_DIR)
      .filter((f) => fs.statSync(path.join(PACKAGES_DIR, f)).isDirectory());

    /** @type {string[]} List of actual package names from package.json files */
    const actualPackageNames = packageDirs
      .map((dir) => {
        const pkgJsonPath = path.join(PACKAGES_DIR, dir, "package.json");
        if (fs.existsSync(pkgJsonPath)) {
          const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
          return pkgJson.name;
        }
        return null;
      })
      .filter(Boolean);

    // 2. Create a unique "ghost" changeset to force all packages to update
    // Adding a timestamp inside the file ensures Changesets treats it as a new change
    const pkgList = actualPackageNames
      .map((name) => `'${name}': patch`)
      .join("\n");

    const timestamp = new Date().toISOString();
    const changesetContent = `---\n${pkgList}\n---\n\nforce dev snapshot at ${timestamp}\n`;

    if (!fs.existsSync(CHANGESET_DIR)) {
      fs.mkdirSync(CHANGESET_DIR);
    }

    fs.writeFileSync(
      path.join(CHANGESET_DIR, SNAPSHOT_FILENAME),
      changesetContent,
    );
    console.log("Unique temporary changeset created for all packages.");

    // 3. Execute snapshot versioning
    console.log("Generating timestamped versions...");
    execSync("pnpm changeset version --snapshot dev", { stdio: "inherit" });

    // 4. Build with Turbo
    console.log("Compiling monorepo...");
    execSync("pnpm turbo build", { stdio: "inherit" });

    // 5. Publish to NPM under the @dev tag
    // We use --no-git-tag to avoid polluting the git history
    console.log("Uploading to NPM...");
    execSync("pnpm changeset publish --no-git-tag --tag dev", {
      stdio: "inherit",
    });
  } catch (error) {
    console.error("Release process failed:", error.message);
  } finally {
    // 6. FULL CLEANUP: Revert package.json changes and delete temporary changeset
    console.log("Cleaning up temporary version traces...");
    try {
      execSync('git restore "**/package.json" "package.json"', {
        stdio: "inherit",
      });

      const tempFile = path.join(CHANGESET_DIR, SNAPSHOT_FILENAME);
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch (e) {
      console.warn(
        "Git cleanup failed. Please check your working tree manually.",
      );
    }
    console.log("Process completed.");
  }
}

runRelease();
