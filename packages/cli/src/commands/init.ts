import { Command } from "commander";
import chalk from "chalk";
import prompts from "prompts";

export const initCommand = new Command("init")
  .description("Initialize a new Revstack project")
  .argument("[project-directory]", "Directory to deploy the project into")
  .option("-t, --template <name>", "Template to use", "default")
  .action(async (projectDirectory, options) => {
    console.log(chalk.bold.blue("🚀 Welcome to Revstack CLI\n"));

    let targetDir = projectDirectory;

    if (!targetDir) {
      const response = await prompts({
        type: "text",
        name: "dir",
        message: "Where would you like to initialize the project?",
        initial: "my-revstack-app",
      });
      targetDir = response.dir;
    }

    if (!targetDir) {
      console.log(chalk.red("❌ Initialization cancelled."));
      process.exit(1);
    }

    console.log(`\nInitializing project in ${chalk.bold.green(targetDir)}`);
    console.log(`Using template: ${chalk.green(options.template)}`);

    console.log(chalk.green("\n✅ Project initialized successfully!"));
    console.log(
      `\nTo get started:\n  cd ${targetDir}\n  pnpm install\n  pnpm dev\n`
    );
  });
