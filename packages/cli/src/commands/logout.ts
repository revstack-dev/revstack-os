/**
 * @file commands/logout.ts
 * @description Clears stored Revstack credentials.
 */

import { Command } from "commander";
import chalk from "chalk";
import { clearApiKey, getApiKey } from "@/utils/auth.js";

export const logoutCommand = new Command("logout")
  .description("Clear stored Revstack credentials")
  .action(() => {
    if (!getApiKey()) {
      console.log(chalk.dim("\n  Not currently logged in.\n"));
      return;
    }

    clearApiKey();

    console.log(
      "\n" +
        chalk.green("  ✔ Successfully logged out.\n") +
        chalk.dim("    Credentials removed from ~/.revstack/credentials.json\n")
    );
  });
