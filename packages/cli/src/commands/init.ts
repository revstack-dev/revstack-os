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
import { fileURLToPath } from "node:url";
import ora from "ora";

import { TEMPLATES } from "./templates/index";

export const initCommand = new Command("init")
  .description("Scaffold a new revstack.config.ts in the current directory")
  .option(
    "-t, --template <name>",
    "Choose a starting template (starter, b2b-saas, usage-based)",
    "starter",
  )
  .action(async (options) => {
    const templateName = options.template || "starter";
    const template = TEMPLATES[templateName];

    if (!template) {
      console.log(
        chalk.red(
          `\n  ✖ Unknown template "${templateName}". Available templates: ${Object.keys(TEMPLATES).join(", ")}\n`,
        ),
      );
      process.exit(1);
    }
    const cwd = process.cwd();
    const configPath = path.resolve(cwd, "revstack.config.ts");

    if (fs.existsSync(configPath)) {
      console.log(
        "\n" +
          chalk.yellow("  ⚠ revstack.config.ts already exists.\n") +
          chalk.dim("    Delete it first if you want to start fresh.\n"),
      );
      process.exit(1);
    }

    // Step 1: Create revstack directory and config files
    const revstackDir = path.resolve(cwd, "revstack");
    if (!fs.existsSync(revstackDir)) {
      fs.mkdirSync(revstackDir, { recursive: true });
    }

    fs.writeFileSync(
      path.resolve(revstackDir, "features.ts"),
      template.features,
      "utf-8",
    );
    fs.writeFileSync(
      path.resolve(revstackDir, "addons.ts"),
      template.addons,
      "utf-8",
    );
    fs.writeFileSync(
      path.resolve(revstackDir, "plans.ts"),
      template.plans,
      "utf-8",
    );
    fs.writeFileSync(
      path.resolve(revstackDir, "index.ts"),
      template.index,
      "utf-8",
    );
    fs.writeFileSync(configPath, template.root, "utf-8");

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
      const cliDir = path.dirname(fileURLToPath(import.meta.url));
      const pkgJsonPath = path.resolve(cliDir, "../../package.json");
      let cliVersion = "dev";
      try {
        const pkgData = fs.readFileSync(pkgJsonPath, "utf-8");
        cliVersion = JSON.parse(pkgData).version;
      } catch (e) {
        // Fallback
      }

      const tag = cliVersion.includes("dev") ? `@${cliVersion}` : "@latest";
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
        "\n" +
        chalk.dim("    Next steps:\n") +
        (installFailed
          ? chalk.dim("    0. ") +
            chalk.white(
              "Run " +
                chalk.bold(packageManager + " install @revstackhq/core") +
                " manually\n",
            )
          : "") +
        chalk.dim("    1. ") +
        chalk.white("Edit the config to match your billing model\n") +
        chalk.dim("    2. ") +
        chalk.white("Run ") +
        chalk.bold("revstack login") +
        chalk.white(" to authenticate\n") +
        chalk.dim("    3. ") +
        chalk.white("Run ") +
        chalk.bold("revstack push") +
        chalk.white(" to deploy\n"),
    );
  });
