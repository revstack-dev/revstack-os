import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

let exitCode = 0;
try {
  console.log("Running workspace tests with coverage...");
  execSync(
    "pnpm exec turbo run test -- --coverage.enabled --coverage.reporter=json-summary --coverage.reporter=text --coverage.provider=v8",
    { stdio: "inherit" },
  );
} catch (err) {
  exitCode = err.status || 1;
}

const summaries = [];
function findSummaries(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist"].includes(entry.name)) continue;
      if (entry.name === "coverage") {
        const summaryPath = path.join(dir, entry.name, "coverage-summary.json");
        if (fs.existsSync(summaryPath)) summaries.push(summaryPath);
      } else {
        findSummaries(path.join(dir, entry.name));
      }
    }
  }
}

findSummaries(path.join(process.cwd(), "packages"));
findSummaries(path.join(process.cwd(), "apps"));

const total = {
  lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
  statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
  functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
  branches: { total: 0, covered: 0, skipped: 0, pct: 0 },
};

for (const file of summaries) {
  try {
    const content = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!content.total) continue;

    for (const key of Object.keys(total)) {
      if (content.total[key]) {
        total[key].total += content.total[key].total;
        total[key].covered += content.total[key].covered;
        total[key].skipped += content.total[key].skipped;
      }
    }
  } catch (e) {
    console.error(`Failed to parse ${file}: ${e.message}`);
  }
}

for (const key of Object.keys(total)) {
  total[key].pct =
    total[key].total === 0
      ? 100
      : Number(((total[key].covered / total[key].total) * 100).toFixed(2));
}

fs.mkdirSync("coverage", { recursive: true });
fs.writeFileSync(
  "coverage/coverage-summary.json",
  JSON.stringify({ total }, null, 2),
);

console.log(`\nCoverage merged from ${summaries.length} packages.`);

try {
  execSync("pnpm exec make-coverage-badge", { stdio: "inherit" });
  console.log("Coverage badge updated at ./coverage/badge.svg");
} catch (e) {
  console.error("Failed to make coverage badge");
}

process.exit(exitCode);
