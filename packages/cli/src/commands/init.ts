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

const STARTER_CONFIG = `import { defineConfig, definePlan, defineFeature } from "@revstackhq/core";

// ─── Features ────────────────────────────────────────────────

const features = {
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

// ─── Plans ───────────────────────────────────────────────────

export default defineConfig({
  features,
  plans: {
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
  },
});
`;

export const initCommand = new Command("init")
  .description("Scaffold a new revstack.config.ts in the current directory")
  .action(async () => {
    const configPath = path.resolve(process.cwd(), "revstack.config.ts");

    if (fs.existsSync(configPath)) {
      console.log(
        "\n" +
          chalk.yellow("  ⚠ revstack.config.ts already exists.\n") +
          chalk.dim("    Delete it first if you want to start fresh.\n")
      );
      process.exit(1);
    }

    fs.writeFileSync(configPath, STARTER_CONFIG, "utf-8");

    console.log(
      "\n" +
        chalk.green("  ✔ Created revstack.config.ts\n") +
        "\n" +
        chalk.dim("    Includes the ") +
        chalk.white("Default Guest Plan") +
        chalk.dim(" (required by Revstack).\n") +
        "\n" +
        chalk.dim("    Next steps:\n") +
        chalk.dim("    1. ") +
        chalk.white("Edit the config to match your billing model\n") +
        chalk.dim("    2. ") +
        chalk.white("Run ") +
        chalk.bold("revstack login") +
        chalk.white(" to authenticate\n") +
        chalk.dim("    3. ") +
        chalk.white("Run ") +
        chalk.bold("revstack push") +
        chalk.white(" to deploy\n")
    );
  });
