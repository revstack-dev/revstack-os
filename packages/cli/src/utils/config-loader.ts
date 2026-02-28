import { createJiti } from "jiti";
import path from "node:path";
import chalk from "chalk";

/**
 * Load the `revstack.config.ts` from the given directory.
 *
 * @param cwd - The directory to search for `revstack.config.ts`.
 * @returns The parsed and sanitized configuration object.
 */
export async function loadLocalConfig(
  cwd: string,
): Promise<Record<string, unknown>> {
  const configPath = path.resolve(cwd, "revstack.config.ts");

  try {
    const jiti = createJiti(cwd);
    const module = (await jiti.import(configPath)) as Record<string, unknown>;
    const config = (module.default ?? module) as Record<string, unknown>;

    // Sanitize: strip functions, class instances, and non-serializable data.
    // This ensures we only send plain JSON to the Revstack Cloud API.
    return JSON.parse(JSON.stringify(config));
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;

    if (
      err.code === "ERR_MODULE_NOT_FOUND" ||
      err.code === "ENOENT" ||
      err.code === "MODULE_NOT_FOUND"
    ) {
      console.error(
        chalk.red(
          "\n  ✖ Could not find revstack.config.ts in the current directory.\n",
        ) +
          chalk.dim("    Run ") +
          chalk.bold("revstack init") +
          chalk.dim(" to create one.\n"),
      );
    } else if (err.name === "SyntaxError" || error instanceof SyntaxError) {
      console.error(
        chalk.red("\n  ✖ Syntax Error in revstack.config.ts\n") +
          chalk.dim("    " + (err.message ?? String(error))) +
          "\n",
      );
    } else {
      console.error(
        chalk.red("\n  ✖ Failed to parse revstack.config.ts\n") +
          chalk.dim("    " + (err.message ?? String(error))) +
          "\n",
      );
    }

    process.exit(1);
  }
}
