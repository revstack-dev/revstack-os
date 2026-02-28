import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import fs from "node:fs";
import path from "node:path";
import { execa } from "execa";
import { getApiKey } from "@/utils/auth";
import { type RevstackConfig, RevstackConfigSchema } from "@revstackhq/core";

function serializeObject(
  obj: Record<string, unknown>,
  depth: number = 0,
): string {
  const entries = Object.entries(obj);
  if (entries.length === 0) return "{}";

  const pad = "  ".repeat(depth + 1);
  const closePad = "  ".repeat(depth);

  const lines = entries
    .map(([key, value]) => {
      if (value === undefined) return null;

      const formattedValue =
        typeof value === "string"
          ? `"${value}"`
          : typeof value === "number" || typeof value === "boolean"
            ? String(value)
            : Array.isArray(value)
              ? serializeArray(value, depth + 1)
              : typeof value === "object" && value !== null
                ? serializeObject(value as Record<string, unknown>, depth + 1)
                : String(value);

      return `${pad}${key}: ${formattedValue},`;
    })
    .filter(Boolean);

  return `{\n${lines.join("\n")}\n${closePad}}`;
}

function serializeArray(arr: unknown[], depth: number): string {
  if (arr.length === 0) return "[]";

  const pad = "  ".repeat(depth + 1);
  const closePad = "  ".repeat(depth);

  const items = arr.map((item) => {
    if (typeof item === "object" && item !== null) {
      return `${pad}${serializeObject(item as Record<string, unknown>, depth + 1)},`;
    }
    return `${pad}${JSON.stringify(item)},`;
  });

  return `[\n${items.join("\n")}\n${closePad}]`;
}

function generateFeaturesSource(config: RevstackConfig): string {
  const featureEntries = Object.entries(config.features).map(([slug, f]) => {
    const props: Record<string, unknown> = {
      name: f.name,
      type: f.type,
      unit_type: f.unit_type,
    };
    if (f.description) props.description = f.description;

    return `  ${slug}: defineFeature(${serializeObject(props, 2)}),`;
  });

  return `import { defineFeature } from "@revstackhq/core";

export const features = {
${featureEntries.join("\n")}
};
`;
}

function generatePlansSource(config: RevstackConfig): string {
  const planEntries = Object.entries(config.plans).map(([slug, plan]) => {
    const props: Record<string, unknown> = {
      name: plan.name,
    };
    if (plan.description) props.description = plan.description;
    props.is_default = plan.is_default;
    props.is_public = plan.is_public;
    props.type = plan.type;

    if (plan.prices && plan.prices.length > 0) {
      props.prices = plan.prices;
    }

    props.features = plan.features;

    const comment = plan.is_default
      ? `    // DO NOT DELETE: Automatically created default plan for guests.\n`
      : "";

    return `${comment}    ${slug}: definePlan<typeof features>(${serializeObject(props, 3)}),`;
  });

  return `import { definePlan } from "@revstackhq/core";
import { features } from "./features";

export const plans = {
${planEntries.join("\n")}
};
`;
}

function generateAddonsSource(config: RevstackConfig): string {
  if (!config.addons) return "";

  const addonEntries = Object.entries(config.addons).map(([slug, addon]) => {
    const props: Record<string, unknown> = {
      name: addon.name,
      type: addon.type,
      amount: addon.amount,
      currency: addon.currency,
    };
    if (addon.description) props.description = addon.description;
    if (addon.billing_interval) props.billing_interval = addon.billing_interval;
    props.features = addon.features;

    return `  ${slug}: defineAddon<typeof features>(${serializeObject(props, 2)}),`;
  });

  return `import { defineAddon } from "@revstackhq/core";
import { features } from "./features";

export const addons = {
${addonEntries.join("\n")}
};
`;
}

function generateCouponsSource(config: RevstackConfig): string {
  if (!config.coupons || config.coupons.length === 0) return "";

  // Make sure we format date strings and numbers properly but let serializeArray sort deep nesting
  const couponsArray = config.coupons.map((coupon) => {
    const props: Record<string, unknown> = {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      duration: coupon.duration,
    };
    if (coupon.name) props.name = coupon.name;
    if (coupon.duration_in_months)
      props.duration_in_months = coupon.duration_in_months;
    if (coupon.applies_to_plans)
      props.applies_to_plans = coupon.applies_to_plans;
    if (coupon.max_redemptions) props.max_redemptions = coupon.max_redemptions;
    if (coupon.expires_at) props.expires_at = coupon.expires_at;

    return props;
  }) as unknown as import("@revstackhq/core").DiscountDef[];

  return `import type { DiscountDef } from "@revstackhq/core";

export const coupons: DiscountDef[] = ${serializeArray(couponsArray, 0)};
`;
}

function generateRootConfigSource(config: RevstackConfig): string {
  const hasAddons = !!config.addons && Object.keys(config.addons).length > 0;
  const hasCoupons = !!config.coupons && config.coupons.length > 0;

  const imports = [
    `import { defineConfig } from "@revstackhq/core";`,
    `import { features } from "./revstack/features";`,
    `import { plans } from "./revstack/plans";`,
  ];
  if (hasAddons) {
    imports.push(`import { addons } from "./revstack/addons";`);
  }
  if (hasCoupons) {
    imports.push(`import { coupons } from "./revstack/coupons";`);
  }

  const configProps: Record<string, unknown> = {
    features: "__RAW_features",
    plans: "__RAW_plans",
  };

  if (hasAddons) {
    configProps.addons = "__RAW_addons";
  }

  if (hasCoupons) {
    configProps.coupons = "__RAW_coupons";
  }

  // Serialize the config object, but then remove the quotes around our RAW variables
  let configStr = serializeObject(configProps, 0);
  configStr = configStr.replace(/"__RAW_features"/g, "features");
  configStr = configStr.replace(/"__RAW_plans"/g, "plans");
  configStr = configStr.replace(/"__RAW_addons"/g, "addons");
  configStr = configStr.replace(/"__RAW_coupons"/g, "coupons");

  return `${imports.join("\n")}

export default defineConfig(${configStr});
`;
}

// ─── Helpers ─────────────────────────────────────────────────

const API_BASE = "https://app.revstack.dev";

// ─── Command ─────────────────────────────────────────────────

export const pullCommand = new Command("pull")
  .description(
    "Pull the remote billing config and overwrite local revstack.config.ts and revstack/ files",
  )
  .option("-e, --env <environment>", "Target environment", "test")
  .action(async (options: { env: string }) => {
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

    // ── 1. Fetch remote config ─────────────────────────────
    const spinner = ora({
      text: "Fetching remote configuration...",
      prefixText: " ",
    }).start();

    let remoteConfig: RevstackConfig;

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/cli/pull?env=${encodeURIComponent(options.env)}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      );

      if (!res.ok) {
        spinner.fail("Failed to fetch remote config");
        console.error(
          chalk.red(`\n  API returned ${res.status}: ${res.statusText}\n`),
        );
        process.exit(1);
      }

      const rawData = await res.json();

      try {
        remoteConfig = RevstackConfigSchema.parse(
          rawData,
        ) as unknown as RevstackConfig;
      } catch (validationError: any) {
        spinner.fail("Remote config failed schema validation");
        console.error(chalk.red(`\n  ${validationError.message}\n`));
        process.exit(1);
      }

      spinner.succeed("Remote config fetched");
    } catch (error: unknown) {
      spinner.fail("Failed to reach Revstack Cloud");
      console.error(chalk.red(`\n  ${(error as Error).message}\n`));
      process.exit(1);
    }

    // ── 2. Show summary ────────────────────────────────────
    const featureCount = Object.keys(remoteConfig.features).length;
    const planCount = Object.keys(remoteConfig.plans).length;
    const addonCount = remoteConfig.addons
      ? Object.keys(remoteConfig.addons).length
      : 0;
    const couponCount = remoteConfig.coupons ? remoteConfig.coupons.length : 0;

    console.log(
      "\n" +
        chalk.dim("  Remote state: ") +
        chalk.white(
          `${featureCount} features, ${planCount} plans, ${addonCount} addons, ${couponCount} coupons`,
        ) +
        chalk.dim(` (${options.env})\n`),
    );

    // ── 3. Confirm overwrite ───────────────────────────────
    const cwd = process.cwd();
    const configPath = path.resolve(cwd, "revstack.config.ts");
    const revstackDir = path.resolve(cwd, "revstack");
    const featuresPath = path.resolve(revstackDir, "features.ts");
    const plansPath = path.resolve(revstackDir, "plans.ts");

    const rootExists = fs.existsSync(configPath);
    const dirExists = fs.existsSync(revstackDir);

    if (rootExists || dirExists) {
      const { confirm } = await prompts({
        type: "confirm",
        name: "confirm",
        message:
          "This will overwrite your local configuration files (revstack.config.ts and revstack/ data). Are you sure?",
        initial: false,
      });

      if (!confirm) {
        console.log(chalk.dim("\n  Pull cancelled.\n"));
        return;
      }
    }

    // ── 4. Generate and write ──────────────────────────────
    if (!fs.existsSync(revstackDir)) {
      fs.mkdirSync(revstackDir, { recursive: true });
    }

    const featuresSource = generateFeaturesSource(remoteConfig);
    const plansSource = generatePlansSource(remoteConfig);
    const rootSource = generateRootConfigSource(remoteConfig);

    fs.writeFileSync(featuresPath, featuresSource, "utf-8");
    fs.writeFileSync(plansPath, plansSource, "utf-8");
    fs.writeFileSync(configPath, rootSource, "utf-8");

    if (remoteConfig.addons && Object.keys(remoteConfig.addons).length > 0) {
      const addonsSource = generateAddonsSource(remoteConfig);
      const addonsPath = path.resolve(revstackDir, "addons.ts");
      fs.writeFileSync(addonsPath, addonsSource, "utf-8");
    }

    if (remoteConfig.coupons && remoteConfig.coupons.length > 0) {
      const couponsSource = generateCouponsSource(remoteConfig);
      const couponsPath = path.resolve(revstackDir, "coupons.ts");
      fs.writeFileSync(couponsPath, couponsSource, "utf-8");
    }

    // ── 5. Format Files ────────────────────────────────────
    const formatSpinner = ora("Formatting generated files...").start();
    try {
      // Run prettier on the generated files. We use npx to ensure it runs
      // using the locally hoisted version of prettier.
      await execa(
        "npx",
        ["prettier", "--write", "revstack.config.ts", "revstack/**/*.ts"],
        {
          cwd,
          stdio: "ignore",
        },
      );
      formatSpinner.succeed("Files formatted successfully");
    } catch (err) {
      // It's not the end of the world if prettier fails, just notify
      formatSpinner.info(
        "Files written properly, but automatic formatting (prettier) skipped or failed.",
      );
    }

    console.log(
      "\n" +
        chalk.green("  ✔ Local files updated from remote.\n") +
        chalk.dim("    Review the files and run ") +
        chalk.bold("revstack push") +
        chalk.dim(" to re-deploy.\n"),
    );
  });
