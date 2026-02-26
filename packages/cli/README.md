# @revstackhq/cli

The official command-line interface for Revstack. Manages your billing configuration as code — define plans, features, and entitlements in `revstack.config.ts`, then push them to Revstack Cloud with a single command.

## Features

- **Billing as Code:** Define your entire billing model in a type-safe TypeScript config file.
- **Zero-Build Config Loading:** Evaluates `revstack.config.ts` on the fly using `jiti` — no separate compilation step needed.
- **Diff Before Deploy:** Every `push` shows a detailed diff of what will change before anything goes live.
- **Environment Targeting:** Push and pull configs to/from different environments (`test`, `production`, etc.).
- **Interactive Authentication:** Securely store your API key locally at `~/.revstack/credentials.json`.

## Installation

```bash
npm install -g @revstackhq/cli
```

Or use it directly with `npx`:

```bash
npx @revstackhq/cli init
```

## Quick Start

### 1. Initialize a Config

Scaffold a new `revstack.config.ts` in your project root:

```bash
revstack init
```

This creates a `revstack/` directory and a `revstack.config.ts` file in your project root, scaffolding a starter config with example plans and features using type-safe helpers from `@revstackhq/core`:

**`revstack/features.ts`**

```typescript
import { defineFeature } from "@revstackhq/core";

export const features = {
  seats: defineFeature({
    name: "Seats",
    type: "static",
    unit_type: "count",
  }),
  ai_tokens: defineFeature({
    name: "AI Tokens",
    type: "metered",
    unit_type: "count",
  }),
};
```

**`revstack/plans.ts`**

```typescript
import { definePlan } from "@revstackhq/core";
import { features } from "./features";

export const plans = {
  // DO NOT DELETE: Automatically created default plan for guests.
  default: definePlan<typeof features>({
    name: "Default",
    description: "Automatically created default plan for guests.",
    is_default: true,
    is_public: false,
    type: "free",
    features: {},
  }),
  pro: definePlan<typeof features>({
    name: "Pro",
    description: "For professional teams.",
    is_default: false,
    is_public: true,
    type: "paid",
    prices: [
      {
        amount: 2900,
        currency: "USD",
        billing_interval: "monthly",
        trial_period_days: 14,
      },
      {
        amount: 29000,
        currency: "USD",
        billing_interval: "yearly",
        trial_period_days: 14,
      },
    ],
    features: {
      seats: { value_limit: 5, is_hard_limit: true },
      ai_tokens: { value_limit: 1000, reset_period: "monthly" },
    },
  }),
};
```

**`revstack.config.ts`**

```typescript
import { defineConfig } from "@revstackhq/core";
import { features } from "./revstack/features";
import { plans } from "./revstack/plans";

export default defineConfig({
  features,
  plans,
});
```

### 2. Authenticate

Log in with your Revstack Secret Key (found in the [Revstack Dashboard](https://app.revstack.dev)):

```bash
revstack login
```

Your credentials are stored locally at `~/.revstack/credentials.json` and never leave your machine.

### 3. Deploy

Push your config to Revstack Cloud:

```bash
revstack push
```

The CLI will:

1. Parse your `revstack.config.ts`.
2. Send it to the Revstack API to compute a diff against the current remote state.
3. Display a color-coded summary of changes (additions, removals, updates).
4. Ask for confirmation before applying.

### 4. Pull Remote State

Fetch the current billing configuration from Revstack Cloud and overwrite your local `revstack.config.ts`:

```bash
revstack pull
```

### 5. Log Out

Clear stored credentials:

```bash
revstack logout
```

## Commands

| Command           | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| `revstack init`   | Scaffold a new `revstack.config.ts`                         |
| `revstack login`  | Authenticate with your Revstack Secret Key                  |
| `revstack logout` | Clear stored credentials                                    |
| `revstack push`   | Diff and deploy your local config to Revstack Cloud         |
| `revstack pull`   | Pull remote config and overwrite local `revstack.config.ts` |

### Global Options

| Option      | Description           |
| ----------- | --------------------- |
| `--version` | Print the CLI version |
| `--help`    | Display help          |

### Environment Targeting

Both `push` and `pull` support the `-e, --env` flag to target a specific environment:

```bash
# Push to production
revstack push --env production

# Pull from test (default)
revstack pull --env test
```

## Architecture

The CLI is intentionally a **"dumb client"**. All complex diffing, validation, and migration logic lives on the Revstack Cloud backend. The CLI's responsibilities are limited to:

1. **Config Loading** — Evaluate `revstack.config.ts` at runtime using `jiti` and sanitize the output to plain JSON.
2. **Authentication** — Store and retrieve the API key from `~/.revstack/credentials.json`.
3. **Network Communication** — Send the parsed config to the Revstack API and display the results.

This keeps the CLI lightweight, fast to install, and ensures the source of truth for billing logic always lives server-side.

## License

MIT
