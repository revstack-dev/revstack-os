/**
 * @file cli.ts
 * @description Entry point for the Revstack CLI.
 * Registers all commands and parses process.argv.
 */

import { Command } from "commander";
import { createRequire } from "node:module";

import { loginCommand } from "@/commands/login.js";
import { logoutCommand } from "@/commands/logout.js";
import { initCommand } from "@/commands/init.js";
import { pushCommand } from "@/commands/push.js";
import { pullCommand } from "@/commands/pull.js";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json") as { version: string };

const program = new Command();

program
  .name("revstack")
  .description("The official CLI for Revstack — Billing as Code")
  .version(packageJson.version);

program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(initCommand);
program.addCommand(pushCommand);
program.addCommand(pullCommand);

program.parse(process.argv);
