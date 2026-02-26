/**
 * @file commands/pull.ts
 * @description Fetches the current billing configuration from Revstack Cloud
 * and writes it back to the local `revstack.config.ts` file, overwriting
 * the existing config after user confirmation.
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import fs from "node:fs";
import path from "node:path";
import { getApiKey } from "@/utils/auth";

// ─── Types ───────────────────────────────────────────────────

interface RemoteFeature {
  name: string;
  type: string;
  unit_type: string;
  description?: string;
}

interface RemotePrice {
  amount: number;
  currency: string;
  billing_interval: string;
  trial_period_days?: number;
}

interface RemotePlanFeature {
  value_limit?: number;
  value_bool?: boolean;
  value_text?: string;
  is_hard_limit?: boolean;
  reset_period?: string;
}

interface RemotePlan {
  name: string;
  description?: string;
  is_default: boolean;
  is_public: boolean;
  type: string;
  prices?: RemotePrice[];
  features: Record<string, RemotePlanFeature>;
}

interface RemoteConfig {
  features: Record<string, RemoteFeature>;
  plans: Record<string, RemotePlan>;
}

function serializeObject(
  obj: Record<string, unknown>,
  depth: number = 0,
): string {
  const entries = Object.entries(obj);
  if (entries.length === 0) return "{}";

  const pad = "  ".repeat(depth + 1);
  const closePad = "  ".repeat(depth);

  const lines = entries
    .map(([key, value]) => {
      if (value === undefined) return null;

      const formattedValue =
        typeof value === "string"
          ? `"${value}"`
          : typeof value === "number" || typeof value === "boolean"
            ? String(value)
            : Array.isArray(value)
              ? serializeArray(value, depth + 1)
              : typeof value === "object" && value !== null
                ? serializeObject(value as Record<string, unknown>, depth + 1)
                : String(value);

      return `${pad}${key}: ${formattedValue},`;
    })
    .filter(Boolean);

  return `{\n${lines.join("\n")}\n${closePad}}`;
}

function serializeArray(arr: unknown[], depth: number): string {
  if (arr.length === 0) return "[]";

  const pad = "  ".repeat(depth + 1);
  const closePad = "  ".repeat(depth);

  const items = arr.map((item) => {
    if (typeof item === "object" && item !== null) {
      return `${pad}${serializeObject(item as Record<string, unknown>, depth + 1)},`;
    }
    return `${pad}${JSON.stringify(item)},`;
  });

  return `[\n${items.join("\n")}\n${closePad}]`;
}

function generateFeaturesSource(config: RemoteConfig): string {
  const featureEntries = Object.entries(config.features).map(([slug, f]) => {
    const props: Record<string, unknown> = {
      name: f.name,
      type: f.type,
      unit_type: f.unit_type,
    };
    if (f.description) props.description = f.description;

    return `  ${slug}: defineFeature(${serializeObject(props, 2)}),`;
  });

  return `import { defineFeature } from "@revstackhq/core";

export const features = {
${featureEntries.join("\n")}
};
`;
}

function generatePlansSource(config: RemoteConfig): string {
  const planEntries = Object.entries(config.plans).map(([slug, plan]) => {
    const props: Record<string, unknown> = {
      name: plan.name,
    };
    if (plan.description) props.description = plan.description;
    props.is_default = plan.is_default;
    props.is_public = plan.is_public;
    props.type = plan.type;

    if (plan.prices && plan.prices.length > 0) {
      props.prices = plan.prices;
    }

    props.features = plan.features;

    const comment = plan.is_default
      ? `    // DO NOT DELETE: Automatically created default plan for guests.\n`
      : "";

    return `${comment}    ${slug}: definePlan<typeof features>(${serializeObject(props, 3)}),`;
  });

  return `import { definePlan } from "@revstackhq/core";
import { features } from "./features";

export const plans = {
${planEntries.join("\n")}
};
`;
}

function generateRootConfigSource(): string {
  return `import { defineConfig } from "@revstackhq/core";
import { features } from "./revstack/features";
import { plans } from "./revstack/plans";

export default defineConfig({
  features,
  plans,
});
`;
}

// ─── Helpers ─────────────────────────────────────────────────

const API_BASE = "https://app.revstack.dev";

// ─── Command ─────────────────────────────────────────────────

export const pullCommand = new Command("pull")
  .description(
    "Pull the remote billing config and overwrite local revstack.config.ts and revstack/ files",
  )
  .option("-e, --env <environment>", "Target environment", "test")
  .action(async (options: { env: string }) => {
    const apiKey = getApiKey();

    if (!apiKey) {
      console.error(
        "\n" +
          chalk.red("  ✖ Not authenticated.\n") +
          chalk.dim("    Run ") +
          chalk.bold("revstack login") +
          chalk.dim(" first.\n"),
      );
      process.exit(1);
    }

    // ── 1. Fetch remote config ─────────────────────────────
    const spinner = ora({
      text: "Fetching remote configuration...",
      prefixText: " ",
    }).start();

    let remoteConfig: RemoteConfig;

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/cli/pull?env=${encodeURIComponent(options.env)}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      );

      if (!res.ok) {
        spinner.fail("Failed to fetch remote config");
        console.error(
          chalk.red(`\n  API returned ${res.status}: ${res.statusText}\n`),
        );
        process.exit(1);
      }

      remoteConfig = (await res.json()) as RemoteConfig;
      spinner.succeed("Remote config fetched");
    } catch (error: unknown) {
      spinner.fail("Failed to reach Revstack Cloud");
      console.error(chalk.red(`\n  ${(error as Error).message}\n`));
      process.exit(1);
    }

    // ── 2. Show summary ────────────────────────────────────
    const featureCount = Object.keys(remoteConfig.features).length;
    const planCount = Object.keys(remoteConfig.plans).length;

    console.log(
      "\n" +
        chalk.dim("  Remote state: ") +
        chalk.white(`${featureCount} features, ${planCount} plans`) +
        chalk.dim(` (${options.env})\n`),
    );

    // ── 3. Confirm overwrite ───────────────────────────────
    const cwd = process.cwd();
    const configPath = path.resolve(cwd, "revstack.config.ts");
    const revstackDir = path.resolve(cwd, "revstack");
    const featuresPath = path.resolve(revstackDir, "features.ts");
    const plansPath = path.resolve(revstackDir, "plans.ts");

    const rootExists = fs.existsSync(configPath);
    const dirExists = fs.existsSync(revstackDir);

    if (rootExists || dirExists) {
      const { confirm } = await prompts({
        type: "confirm",
        name: "confirm",
        message:
          "This will overwrite your local configuration files (revstack.config.ts and revstack/ data). Are you sure?",
        initial: false,
      });

      if (!confirm) {
        console.log(chalk.dim("\n  Pull cancelled.\n"));
        return;
      }
    }

    // ── 4. Generate and write ──────────────────────────────
    if (!fs.existsSync(revstackDir)) {
      fs.mkdirSync(revstackDir, { recursive: true });
    }

    const featuresSource = generateFeaturesSource(remoteConfig);
    const plansSource = generatePlansSource(remoteConfig);
    const rootSource = generateRootConfigSource();

    fs.writeFileSync(featuresPath, featuresSource, "utf-8");
    fs.writeFileSync(plansPath, plansSource, "utf-8");
    fs.writeFileSync(configPath, rootSource, "utf-8");

    console.log(
      "\n" +
        chalk.green("  ✔ Local files updated from remote.\n") +
        chalk.dim("    Review the files and run ") +
        chalk.bold("revstack push") +
        chalk.dim(" to re-deploy.\n"),
    );
  });
