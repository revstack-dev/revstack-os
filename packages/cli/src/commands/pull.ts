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

// ─── Code Generator ──────────────────────────────────────────

function indent(text: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line.trim() ? pad + line : line))
    .join("\n");
}

function serializeObject(
  obj: Record<string, unknown>,
  depth: number = 0
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

function generateConfigSource(config: RemoteConfig): string {
  // ── Features ─────────────────────────────────────────────
  const featureEntries = Object.entries(config.features).map(([slug, f]) => {
    const props: Record<string, unknown> = {
      name: f.name,
      type: f.type,
      unit_type: f.unit_type,
    };
    if (f.description) props.description = f.description;

    return `  ${slug}: defineFeature(${serializeObject(props, 2)}),`;
  });

  // ── Plans ────────────────────────────────────────────────
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

  return `import { defineConfig, definePlan, defineFeature } from "@revstackhq/core";

// ─── Features ────────────────────────────────────────────────

const features = {
${featureEntries.join("\n")}
};

// ─── Plans ───────────────────────────────────────────────────

export default defineConfig({
  features,
  plans: {
${planEntries.join("\n")}
  },
});
`;
}

// ─── Helpers ─────────────────────────────────────────────────

const API_BASE = "https://app.revstack.dev";

// ─── Command ─────────────────────────────────────────────────

export const pullCommand = new Command("pull")
  .description(
    "Pull the remote billing config and overwrite revstack.config.ts"
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
          chalk.dim(" first.\n")
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
        }
      );

      if (!res.ok) {
        spinner.fail("Failed to fetch remote config");
        console.error(
          chalk.red(`\n  API returned ${res.status}: ${res.statusText}\n`)
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
        chalk.dim(` (${options.env})\n`)
    );

    // ── 3. Confirm overwrite ───────────────────────────────
    const configPath = path.resolve(process.cwd(), "revstack.config.ts");
    const exists = fs.existsSync(configPath);

    if (exists) {
      const { confirm } = await prompts({
        type: "confirm",
        name: "confirm",
        message:
          "This will overwrite your local revstack.config.ts. Are you sure?",
        initial: false,
      });

      if (!confirm) {
        console.log(chalk.dim("\n  Pull cancelled.\n"));
        return;
      }
    }

    // ── 4. Generate and write ──────────────────────────────
    const source = generateConfigSource(remoteConfig);
    fs.writeFileSync(configPath, source, "utf-8");

    console.log(
      "\n" +
        chalk.green("  ✔ revstack.config.ts updated from remote.\n") +
        chalk.dim("    Review the file and run ") +
        chalk.bold("revstack push") +
        chalk.dim(" to re-deploy.\n")
    );
  });
