/**
 * @file commands/init.ts
 * @description Scaffolds a new `revstack.config.ts` in the current directory.
 * Generates a starter config with the immutable Default Guest Plan and
 * a sample Pro plan using type-safe helpers from @revstackhq/core.
 */

import { Command } from "commander";
import chalk from "chalk";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import ora from "ora";

const STARTER_FEATURES = `import { defineFeature } from "@revstackhq/core";

export const features = {
  seats: defineFeature({
    name: "Seats",
    type: "static",
    unit_type: "count",
  }),
  ai_tokens: defineFeature({
    name: "AI Tokens",
    type: "metered",
    unit_type: "count",
  }),
};
`;

const STARTER_PLANS = `import { definePlan } from "@revstackhq/core";
import { features } from "./features";

export const plans = {
  // DO NOT DELETE: Automatically created default plan for guests.
  default: definePlan<typeof features>({
    name: "Default",
    description: "Automatically created default plan for guests.",
    is_default: true,
    is_public: false,
    type: "free",
    features: {},
  }),
  pro: definePlan<typeof features>({
    name: "Pro",
    description: "For professional teams.",
    is_default: false,
    is_public: true,
    type: "paid",
    prices: [
      {
        amount: 2900,
        currency: "USD",
        billing_interval: "monthly",
        trial_period_days: 14,
      },
      {
        amount: 29000,
        currency: "USD",
        billing_interval: "yearly",
        trial_period_days: 14,
      }
    ],
    features: {
      seats: { value_limit: 5, is_hard_limit: true },
      ai_tokens: { value_limit: 1000, reset_period: "monthly" },
    },
  }),
};
`;

const STARTER_CONFIG = `import { defineConfig } from "@revstackhq/core";
import { features } from "./revstack/features";
import { plans } from "./revstack/plans";

export default defineConfig({
  features,
  plans,
});
`;

export const initCommand = new Command("init")
  .description("Scaffold a new revstack.config.ts in the current directory")
  .action(async () => {
    const cwd = process.cwd();
    const configPath = path.resolve(cwd, "revstack.config.ts");
    const revstackDir = path.resolve(cwd, "revstack");
    const featuresPath = path.resolve(revstackDir, "features.ts");
    const plansPath = path.resolve(revstackDir, "plans.ts");

    if (fs.existsSync(configPath)) {
      console.log(
        "\n" +
          chalk.yellow("  ⚠ revstack.config.ts already exists.\n") +
          chalk.dim("    Delete it first if you want to start fresh.\n"),
      );
      process.exit(1);
    }

    // Step 1: Create revstack directory and files
    if (!fs.existsSync(revstackDir)) {
      fs.mkdirSync(revstackDir, { recursive: true });
    }
    fs.writeFileSync(featuresPath, STARTER_FEATURES, "utf-8");
    fs.writeFileSync(plansPath, STARTER_PLANS, "utf-8");
    fs.writeFileSync(configPath, STARTER_CONFIG, "utf-8");

    // Step 2: Detect package manager & verify package.json
    let packageManager = "npm";
    if (fs.existsSync(path.resolve(cwd, "pnpm-lock.yaml"))) {
      packageManager = "pnpm";
    } else if (fs.existsSync(path.resolve(cwd, "yarn.lock"))) {
      packageManager = "yarn";
    } else if (fs.existsSync(path.resolve(cwd, "package-lock.json"))) {
      packageManager = "npm";
    }

    const packageJsonPath = path.resolve(cwd, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      // Create a default package.json if it doesn't exist
      try {
        spawnSync("npm", ["init", "-y"], { cwd, stdio: "ignore", shell: true });
      } catch (err) {
        // Ignore initialization errors; the install command may still work or provide a better error.
      }
    }

    // Step 3: Install @revstackhq/core
    const spinner = ora("Installing @revstackhq/core...").start();
    let installFailed = false;

    try {
      // Use @dev tag if the CLI itself is a dev snapshot
      const pkgVersion = process.env.npm_package_version || "dev";
      const tag = pkgVersion.includes("dev") ? "@dev" : "@latest";
      const pkgName = `@revstackhq/core${tag}`;

      const installArgs =
        packageManager === "yarn"
          ? ["add", pkgName]
          : packageManager === "pnpm"
            ? ["add", pkgName]
            : ["install", pkgName];

      let result = spawnSync(packageManager, installArgs, { cwd, shell: true });
      if (result.error || result.status !== 0) {
        if (packageManager === "pnpm") {
          result = spawnSync("pnpm", ["add", "-w", pkgName], {
            cwd,
            shell: true,
          });
        } else if (packageManager === "yarn") {
          result = spawnSync("yarn", ["add", "-W", pkgName], {
            cwd,
            shell: true,
          });
        }
      }

      if (result.error || result.status !== 0) {
        throw new Error(
          "Install failed: " +
            (result.stderr
              ? result.stderr.toString()
              : result.stdout
                ? result.stdout.toString()
                : "Unknown error"),
        );
      }
      spinner.succeed("Dependencies installed");
    } catch (err: any) {
      installFailed = true;
      spinner.fail(
        "Failed to install @revstackhq/core automatically (" +
          packageManager +
          "). Reason: " +
          err.message,
      );
    }

    // Step 4: Final Success Message
    console.log(
      "\n" +
        chalk.green("  ✔ Created revstack config structure\n") +
        "\n" +
        chalk.dim("    Includes the ") +
        chalk.white("Default Guest Plan") +
        chalk.dim(" (required by Revstack).\n") +
        "\\n" +
        chalk.dim("    Next steps:\\n") +
        (installFailed
          ? chalk.dim("    0. ") +
            chalk.white(
              "Run " +
                chalk.bold(packageManager + " install @revstackhq/core") +
                " manually\\n",
            )
          : "") +
        chalk.dim("    1. ") +
        chalk.white("Edit the config to match your billing model\\n") +
        chalk.dim("    2. ") +
        chalk.white("Run ") +
        chalk.bold("revstack login") +
        chalk.white(" to authenticate\\n") +
        chalk.dim("    3. ") +
        chalk.white("Run ") +
        chalk.bold("revstack push") +
        chalk.white(" to deploy\\n"),
    );
  });
