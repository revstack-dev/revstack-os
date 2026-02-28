import { Command } from "commander";
import chalk from "chalk";
import prompts from "prompts";
import { setApiKey } from "@/utils/auth.js";

export const loginCommand = new Command("login")
  .description("Authenticate with your Revstack Secret Key")
  .action(async () => {
    console.log(
      "\n" + chalk.bold("  Revstack ") + chalk.dim("— Authentication\n"),
    );

    const response = await prompts({
      type: "password",
      name: "secretKey",
      message: "Enter your Revstack Secret Key",
      validate: (value: string) =>
        value.startsWith("sk_") ? true : "Secret key must start with sk_",
    });

    if (!response.secretKey) {
      console.log(chalk.dim("\n  Login cancelled.\n"));
      process.exit(0);
    }

    setApiKey(response.secretKey);

    console.log(
      "\n" +
        chalk.green("  ✔ Authenticated successfully!\n") +
        chalk.dim("    Credentials saved to ~/.revstack/credentials.json\n"),
    );
  });
