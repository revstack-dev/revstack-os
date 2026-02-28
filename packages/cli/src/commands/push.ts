/**
 * @file commands/push.ts
 * @description The core deployment command. Loads the local config, sends it
 * to Revstack Cloud for diffing, presents the changes, and (upon confirmation)
 * pushes the config to production.
 */

import { Command } from "commander";
import chalk from "chalk";
import prompts from "prompts";
import ora from "ora";
import { getApiKey } from "@/utils/auth";
import { loadLocalConfig } from "@/utils/config-loader";
import {
  validateConfig,
  RevstackValidationError,
  RevstackConfigSchema,
} from "@revstackhq/core";

// ─── Types ───────────────────────────────────────────────────

interface DiffEntry {
  action: "added" | "removed" | "updated";
  entity: string;
  id: string;
  message: string;
}

interface DiffResponse {
  diff: DiffEntry[];
  canPush: boolean;
  blockedReason?: string;
}

// ─── Helpers ─────────────────────────────────────────────────

const API_BASE = "https://app.revstack.dev";

const DIFF_ICONS: Record<DiffEntry["action"], string> = {
  added: chalk.green("  + "),
  removed: chalk.red("  − "),
  updated: chalk.yellow("  ~ "),
};

const DIFF_COLORS: Record<DiffEntry["action"], (text: string) => string> = {
  added: chalk.green,
  removed: chalk.red,
  updated: chalk.yellow,
};

function printDiff(diff: DiffEntry[], env: string): void {
  if (diff.length === 0) {
    console.log(
      chalk.dim("\n  No changes detected. Your config is up to date.\n"),
    );
    return;
  }

  if (env === "production") {
    console.log(
      chalk.bgRed.white.bold("\n  ⚠️  YOU ARE PUSHING TO PRODUCTION ⚠️  \n"),
    );
  } else {
    console.log(chalk.bold("\n  Changes:\n"));
  }

  const groups: Record<string, DiffEntry[]> = {};
  for (const entry of diff) {
    if (!groups[entry.entity]) groups[entry.entity] = [];
    groups[entry.entity].push(entry);
  }

  let added = 0;
  let updated = 0;
  let removed = 0;

  for (const [entityName, entries] of Object.entries(groups)) {
    console.log(chalk.dim(`  ${entityName}s`));
    for (const entry of entries) {
      if (entry.action === "added") added++;
      if (entry.action === "updated") updated++;
      if (entry.action === "removed") removed++;

      const icon = DIFF_ICONS[entry.action];
      const color = DIFF_COLORS[entry.action];
      console.log(`${icon}${color(entry.id)} ${chalk.white(entry.message)}`);
    }
    console.log();
  }

  console.log(
    chalk.bold(
      `  Summary: ${added} added, ${updated} updated, ${removed} removed\n`,
    ),
  );
}

function requireAuth(): string {
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

  return apiKey;
}

// ─── Command ─────────────────────────────────────────────────

export const pushCommand = new Command("push")
  .description("Push your local billing config to Revstack Cloud")
  .option("-e, --env <environment>", "Target environment", "test")
  .action(async (options: { env: string }) => {
    const apiKey = requireAuth();
    const config = await loadLocalConfig(process.cwd());

    // ── Step 1: Validate config ────────────────────────────────

    const validationSpinner = ora({
      text: "Validating billing configuration...",
      prefixText: " ",
    }).start();

    try {
      // Tier 1: Structural Validation
      const parsedConfig = RevstackConfigSchema.parse(config);

      // Tier 2: Business Logic Validation
      validateConfig(parsedConfig as any);

      validationSpinner.succeed("Configuration validated");
    } catch (error: any) {
      validationSpinner.fail("Configuration invalid");

      if (error?.name === "ZodError" || error?.issues) {
        console.error(
          chalk.red(
            "\n  ✖ The billing configuration contains schema/formatting errors:\n",
          ),
        );
        const issues = error.issues || error.errors || [];
        for (const err of issues) {
          const path = err.path ? err.path.join(".") : "Root";
          console.error(chalk.red(`    • [${path}] ${err.message}`));
        }
        console.log();
        process.exit(1);
      }

      if (
        error instanceof RevstackValidationError ||
        error?.name === "RevstackValidationError"
      ) {
        console.error(
          chalk.red(
            "\n  ✖ The billing configuration contains business logic errors:\n",
          ),
        );
        for (const err of error.errors || []) {
          console.error(chalk.red(`    • ${err}`));
        }
        console.log();
        process.exit(1);
      }

      validationSpinner.fail("Validation failed");
      console.error(
        chalk.red(
          `\n  An unexpected error occurred during validation: ${error?.message || String(error)}\n`,
        ),
      );
      process.exit(1);
    }

    // ── Step 2: Compute diff ──────────────────────────────────

    const spinner = ora({
      text: "Calculating diff...",
      prefixText: " ",
    }).start();

    let diffResponse: DiffResponse;

    try {
      const res = await fetch(`${API_BASE}/api/v1/cli/diff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ env: options.env, config }),
      });

      if (!res.ok) {
        spinner.fail("Failed to calculate diff");
        console.error(
          chalk.red(`\n  API returned ${res.status}: ${res.statusText}\n`),
        );
        process.exit(1);
      }

      diffResponse = (await res.json()) as DiffResponse;
      spinner.succeed("Diff calculated");
    } catch (error: unknown) {
      spinner.fail("Failed to reach Revstack Cloud");
      console.error(chalk.red(`\n  ${(error as Error).message}\n`));
      process.exit(1);
    }

    // ── Step 2: Present diff ──────────────────────────────────

    printDiff(diffResponse.diff, options.env);

    if (diffResponse.diff.length === 0) {
      return;
    }

    // ── Step 3: Check if push is allowed ──────────────────────

    if (!diffResponse.canPush) {
      console.log(
        "\n" +
          chalk.bgRed.white.bold("  BLOCKED: PUSH IMPOSSIBLE  ") +
          "\n\n" +
          chalk.red(
            `  ✖ ${diffResponse.blockedReason ?? "The server rejected this configuration due to destructive changes."}\n`,
          ),
      );
      process.exit(1);
    }

    // ── Step 4: Confirm ───────────────────────────────────────

    const envLabel =
      options.env === "production"
        ? chalk.red.bold(options.env)
        : chalk.cyan.bold(options.env);

    const { confirm } = await prompts({
      type: "confirm",
      name: "confirm",
      message: `Apply these changes to ${envLabel}?`,
      initial: false,
    });

    if (!confirm) {
      console.log(chalk.dim("\n  Push cancelled.\n"));
      return;
    }

    // ── Step 5: Push ──────────────────────────────────────────

    const pushSpinner = ora({
      text: `Pushing to ${options.env}...`,
      prefixText: " ",
    }).start();

    try {
      const res = await fetch(`${API_BASE}/api/v1/cli/push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ env: options.env, config }),
      });

      if (!res.ok) {
        pushSpinner.fail("Push failed");
        console.error(
          chalk.red(`\n  API returned ${res.status}: ${res.statusText}\n`),
        );
        process.exit(1);
      }

      pushSpinner.succeed("Pushed successfully");
      console.log(
        "\n" +
          chalk.green("  ✔ Config deployed to ") +
          envLabel +
          "\n" +
          chalk.dim("    Changes are now live.\n"),
      );
    } catch (error: unknown) {
      pushSpinner.fail("Push failed");
      console.error(chalk.red(`\n  ${(error as Error).message}\n`));
      process.exit(1);
    }
  });
