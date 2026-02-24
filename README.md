<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://revstack.dev/logo-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://revstack.dev/logo-dark.svg">
    <img alt="Revstack" src="https://revstack.dev/logo-dark.svg" width="200">
  </picture>
</p>

<h3 align="center">Billing infrastructure for SaaS.</h3>

<p align="center">
  Entitlements, subscriptions, usage metering, and payment provider abstraction —<br/>
  so you can ship features instead of billing plumbing.
</p>

<p align="center">
  <a href="https://docs.revstack.dev"><strong>Docs</strong></a> ·
  <a href="https://app.revstack.dev"><strong>Dashboard</strong></a> ·
  <a href="https://github.com/revstackhq/revstack-os/issues"><strong>Issues</strong></a> ·
  <a href="CONTRIBUTING.md"><strong>Contributing</strong></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@revstackhq/node"><img alt="npm" src="https://img.shields.io/npm/v/@revstackhq/node?style=flat-square&color=0a0a0a&labelColor=0a0a0a"></a>
  <a href="LICENSE.md"><img alt="License" src="https://img.shields.io/badge/license-MIT%20%2F%20FSL-0a0a0a?style=flat-square&labelColor=0a0a0a"></a>
  <a href="https://github.com/revstackhq/revstack-os"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-0a0a0a?style=flat-square&labelColor=0a0a0a"></a>
</p>

---

## What is Revstack?

Revstack handles the billing layer of your SaaS so you don't have to build it from scratch. Define your plans and entitlements in code, connect a payment provider like Stripe, and let the platform handle the rest — entitlement checks, usage tracking, subscription lifecycle, and webhook orchestration.

The repository contains all of the open-source SDKs, the entitlement engine, and the provider gateway that powers the [Revstack Cloud](https://app.revstack.dev) platform.

## Quickstart

### 1. Install

```bash
npm install @revstackhq/node
```

### 2. Initialize

```typescript
import { Revstack } from "@revstackhq/node";

const revstack = new Revstack({
  secretKey: process.env.REVSTACK_SECRET_KEY!,
});
```

### 3. Check entitlements

```typescript
const { allowed, remaining } = await revstack.entitlements.check(
  "cus_abc123",
  "seats"
);

if (!allowed) {
  return res.status(403).json({ error: "Upgrade to add more seats." });
}
```

### 4. Report usage

```typescript
await revstack.usage.report({
  customerId: "cus_abc123",
  featureId: "api-calls",
  delta: 1,
});
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Your App                           │
│                                                         │
│   @revstackhq/next    @revstackhq/react                 │
│   @revstackhq/node    @revstackhq/auth                  │
├─────────────────────────────────────────────────────────┤
│                    Revstack Cloud                        │
│                                                         │
│   ┌───────────────┐  ┌──────────────┐  ┌─────────────┐ │
│   │  Entitlement  │  │   Billing    │  │   Webhook   │ │
│   │    Engine     │  │  as Code     │  │   Router    │ │
│   │  @revstackhq/ │  │              │  │             │ │
│   │    core       │  │              │  │             │ │
│   └───────────────┘  └──────────────┘  └─────────────┘ │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │           Provider Gateway                      │   │
│   │   @revstackhq/providers-core                    │   │
│   │   @revstackhq/provider-stripe                   │   │
│   └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│    Stripe    ·    Paddle    ·    Lemon Squeezy    · ... │
└─────────────────────────────────────────────────────────┘
```

## Packages

This is a monorepo. Each package serves a distinct role in the stack.

### Client SDKs

| Package                                     | Description                                                           | License |
| ------------------------------------------- | --------------------------------------------------------------------- | ------- |
| [`@revstackhq/node`](packages/node)         | Server-side SDK — entitlements, subscriptions, usage, webhooks, admin | MIT     |
| [`@revstackhq/next`](packages/next)         | Next.js route handlers and middleware                                 | MIT     |
| [`@revstackhq/react`](packages/react)       | React hooks and components                                            | MIT     |
| [`@revstackhq/browser`](packages/browser)   | Browser-side SDK for client applications                              | MIT     |
| [`@revstackhq/auth`](packages/auth)         | JWT verification bridge — Auth0, Clerk, Supabase, Cognito, Firebase   | MIT     |
| [`@revstackhq/checkout`](packages/checkout) | Checkout session helpers                                              | MIT     |
| [`@revstackhq/ai`](packages/ai)             | AI-related utilities                                                  | MIT     |

### Core Infrastructure

| Package                                                             | Description                                                             | License     |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------- |
| [`@revstackhq/core`](packages/core)                                 | Entitlement engine — plan definitions, feature gating, usage evaluation | FSL-1.1-MIT |
| [`@revstackhq/providers-core`](packages/providers/core)             | Provider gateway base classes and interfaces                            | FSL-1.1-MIT |
| [`@revstackhq/providers-registry`](packages/providers/registry)     | Provider discovery and registration                                     | FSL-1.1-MIT |
| [`@revstackhq/provider-stripe`](packages/providers/official/stripe) | Stripe provider — payments, subscriptions, checkout, webhooks           | FSL-1.1-MIT |

> **Why the split?** Client SDKs are MIT so you can use them anywhere without restrictions. Core infrastructure uses the [Functional Source License](https://fsl.software/) to prevent competing hosted services — it automatically converts to MIT after two years. See [LICENSE.md](LICENSE.md) for details.

## Node.js SDK

The SDK organizes operations into two planes:

### Data Plane

Day-to-day operations your backend makes on behalf of users.

```typescript
// Entitlements — can this user do this thing?
const check = await revstack.entitlements.check("cus_abc", "api-calls");

// Usage — metered billing
await revstack.usage.report({
  customerId: "cus_abc",
  featureId: "api-calls",
  delta: 1,
});

// Subscriptions
const sub = await revstack.subscriptions.create({
  customerId: "cus_abc",
  planId: "pro",
});

// Customers
const customer = await revstack.customers.identify({
  externalId: "usr_123",
  name: "Acme",
});

// Webhooks — verify inbound events
const isValid = revstack.webhooks.verify(payload, signature, secret);
```

### Control Plane

Infrastructure management — plan CRUD, entitlement definitions, Billing as Code sync.

```typescript
// Sync your billing configuration from code
await revstack.admin.system.sync({
  plans: [
    {
      slug: "pro",
      name: "Pro Plan",
      features: {
        seats: { limit: 10, isHardLimit: true },
        "api-calls": { limit: 50000, isHardLimit: false, unitPrice: 0.001 },
        sso: true,
      },
    },
  ],
});

// Manage integrations
const integrations = await revstack.admin.integrations.list();
```

## Auth Bridge

`@revstackhq/auth` supports 6 identity providers out of the box. Configure once, verify tokens everywhere.

```typescript
import { buildAuthContract, RevstackAuth } from "@revstackhq/auth";

// Build a contract for your provider
const contract = buildAuthContract("auth0", {
  domain: "my-tenant.us.auth0.com",
  audience: "https://api.example.com",
});

// Verify tokens
const auth = new RevstackAuth(contract);
const session = await auth.validate(req.headers.authorization);
```

**Supported providers:** Auth0 · Clerk · Supabase · Amazon Cognito · Firebase · Custom JWT (HS256)

## Entitlement Engine

The engine at the heart of Revstack. Pure, stateless feature gating — no side effects, no network calls.

```typescript
import { EntitlementEngine } from "@revstackhq/core";

const engine = new EntitlementEngine(plan, addons, "active");

// Single check
const result = engine.check("seats", currentSeatCount);
// → { allowed: true, remaining: 6, grantedBy: "plan_pro" }

// Batch check
const results = engine.checkBatch({
  seats: 4,
  ai_tokens: 12000,
  sso: 0,
});
```

| Feature               | How it works                                          |
| --------------------- | ----------------------------------------------------- |
| Plan + Addon stacking | Limits from addons are summed on top of the base plan |
| Hard & soft limits    | Soft limits allow overage with cost estimation        |
| Subscription gating   | `past_due` and `canceled` statuses block all access   |
| Boolean features      | `true` = unlimited access, no limit tracking needed   |

## Provider Gateway

Payment providers are pluggable. Each provider implements a standard interface — the gateway translates between your code and the provider's API.

```typescript
// providers/official/stripe
export class StripeProvider extends BaseProvider {
  async onInstall(ctx, input) {
    /* ... */
  }
  async onUninstall(ctx, input) {
    /* ... */
  }
  async createPayment(ctx, input) {
    /* ... */
  }
  async createCheckoutSession(ctx, input) {
    /* ... */
  }
  async verifyWebhookSignature(ctx, payload, headers, secret) {
    /* ... */
  }
  // ... subscriptions, customers, refunds, payment methods
}
```

Want to add a payment provider? See the [Contributing Guide](CONTRIBUTING.md#writing-a-provider).

## Development

### Prerequisites

- Node.js >= 18
- pnpm 9

### Setup

```bash
git clone https://github.com/revstackhq/revstack-os.git
cd revstack-os
pnpm install
pnpm build
```

### Commands

```bash
pnpm build              # Build all packages
pnpm check-types        # Type-check everything
pnpm lint               # Lint all packages
pnpm format             # Format with Prettier
```

### Working on a single package

```bash
pnpm build --filter=@revstackhq/auth...    # Build auth + its dependencies
cd packages/auth && pnpm test               # Run auth tests
```

## Error Handling

The SDKs have a typed error hierarchy so you can handle failures precisely:

```typescript
import { Revstack, RateLimitError, RevstackAPIError } from "@revstackhq/node";

try {
  await revstack.entitlements.check("cus_abc", "seats");
} catch (err) {
  if (err instanceof RateLimitError) {
    // Back off and retry after err.retryAfter seconds
  } else if (err instanceof RevstackAPIError) {
    // API returned an error — check err.status and err.code
  }
}
```

## Contributing

We welcome contributions — bug fixes, new features, documentation, and especially new payment providers.

See the [Contributing Guide](CONTRIBUTING.md) for setup instructions, coding conventions, and how to write a provider.

## License

This repository uses a split licensing model:

- **Client SDKs** — [MIT License](https://opensource.org/licenses/MIT). Use them anywhere.
- **Core Infrastructure** — [Functional Source License (FSL-1.1-MIT)](https://fsl.software/). Free to use internally, converts to MIT after two years.

See [LICENSE.md](LICENSE.md) for the full breakdown.
