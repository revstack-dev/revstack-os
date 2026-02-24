#!/usr/bin/env node

import { Command } from "commander";
import * as packageJson from "../package.json";
import { initCommand } from "./commands/init";

const program = new Command();

program
  .name("revstack")
  .description("The official CLI for Revstack")
  .version(packageJson.version);

program.addCommand(initCommand);

program.parse(process.argv);
