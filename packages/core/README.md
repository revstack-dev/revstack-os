# @revstackhq/core

The shared type system and config authoring toolkit for [Revstack](https://revstack.dev) — Billing as Code for SaaS.

This package provides the type-safe helper functions (`defineConfig`, `defineFeature`, `definePlan`, etc.) used to write `revstack.config.ts`, plus the runtime validation engine that powers the CLI and server-side config processing.

## Installation

```bash
npm install @revstackhq/core
```

## Usage

### Writing a Billing Config

Use the identity helpers to get full autocompletion and compile-time validation in your `revstack.config.ts`:

```typescript
import { defineConfig, defineFeature, definePlan } from "@revstackhq/core";

const features = {
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

export default defineConfig({
  features,
  plans: {
    default: definePlan<typeof features>({
      name: "Default",
      is_default: true,
      is_public: false,
      type: "free",
      features: {},
    }),
    pro: definePlan<typeof features>({
      name: "Pro",
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
      ],
      features: {
        seats: { value_limit: 5, is_hard_limit: true },
        ai_tokens: { value_limit: 1000, reset_period: "monthly" },
      },
    }),
  },
});
```

### Type-Safe Feature Keys

When you pass `typeof features` as a generic to `definePlan<typeof features>(...)`, the `features` object is restricted to only the keys defined in your feature dictionary. Typos become compile-time errors:

```typescript
// ✅ Compiles — "seats" exists in features
definePlan<typeof features>({ ..., features: { seats: { value_limit: 5 } } });

// ❌ Compile error — "seets" is not a valid key
definePlan<typeof features>({ ..., features: { seets: { value_limit: 5 } } });
```

## API Reference

### Config Helpers

| Function           | Description                                                   |
| ------------------ | ------------------------------------------------------------- |
| `defineConfig()`   | Wraps the root `revstack.config.ts` export for type inference |
| `defineFeature()`  | Define a feature (static, metered, or boolean)                |
| `definePlan()`     | Define a plan with optional compile-time feature key checks   |
| `defineAddon()`    | Define an add-on (same generic pattern as `definePlan`)       |
| `defineDiscount()` | Define a discount/coupon                                      |

### Validation Engine

The `validator` module provides runtime validation for billing configs, ensuring structural correctness before they're pushed to Revstack Cloud.

### Types

All shared TypeScript types are exported from the package root — `FeatureDefInput`, `PlanDefInput`, `PlanFeatureValue`, `RevstackConfig`, and more.

## Architecture

`@revstackhq/core` is a **zero-dependency** package designed to be shared across:

- **`@revstackhq/cli`** — Uses the define helpers and validator at config-loading time.
- **`@revstackhq/node`** — Depends on the shared type system for API contracts.
- **User projects** — Imported directly in `revstack.config.ts` for type-safe authoring.

## License

FSL-1.1-MIT
