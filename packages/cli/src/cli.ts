#!/usr/bin/env node

import { Command } from "commander";
import { logger } from "@/utils/logger";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json");

const program = new Command();

program
  .name("revstack")
  .description("The official CLI for Revstack")
  .version(packageJson.version);

program
  .command("hello")
  .description("Say hello using the utility logger")
  .action(() => {
    logger("Hello from the Revstack CLI!");
  });

program.parse(process.argv);
