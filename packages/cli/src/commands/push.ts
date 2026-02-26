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

function printDiff(diff: DiffEntry[]): void {
  if (diff.length === 0) {
    console.log(
      chalk.dim("\n  No changes detected. Your config is up to date.\n"),
    );
    return;
  }

  console.log(chalk.bold("\n  Changes:\n"));

  for (const entry of diff) {
    const icon = DIFF_ICONS[entry.action];
    const color = DIFF_COLORS[entry.action];
    const label = chalk.dim(`[${entry.entity}]`);
    console.log(
      `${icon}${color(entry.id)} ${label} ${chalk.white(entry.message)}`,
    );
  }

  console.log();
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

    // ── Step 1: Compute diff ──────────────────────────────────

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

    printDiff(diffResponse.diff);

    if (diffResponse.diff.length === 0) {
      return;
    }

    // ── Step 3: Check if push is allowed ──────────────────────

    if (!diffResponse.canPush) {
      console.log(
        chalk.red("  ✖ Push is blocked.\n") +
          chalk.dim(
            `    ${diffResponse.blockedReason ?? "The server rejected this configuration."}\n`,
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
