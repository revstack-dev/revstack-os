const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const [provider, method = "list"] = process.argv.slice(2);

if (!provider) {
  console.error("❌ Usage: pnpm smoke <provider> [method]");
  console.error("   Example: pnpm smoke stripe createPayment");
  process.exit(1);
}

const root = path.resolve(__dirname, "..");
const candidates = [
  path.join(root, "packages", "providers", "official", provider),
  path.join(root, "packages", "providers", "community", provider),
];

const pkgDir = candidates.find((p) =>
  fs.existsSync(path.join(p, "package.json")),
);

if (!pkgDir) {
  console.error(`❌ Unknown provider '${provider}'. Checked in:`);
  candidates.forEach((c) => console.error(`   - ${c}`));
  process.exit(1);
}

console.log(`🚀 Target: ${pkgDir}`);

try {
  execSync(`pnpm -C "${pkgDir}" run dev:smoke ${method}`, {
    stdio: "inherit",
    env: process.env,
  });
} catch (e) {
  process.exit(1);
}
