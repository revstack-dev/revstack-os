# @revstackhq/node

The official Node.js / TypeScript server SDK for [Revstack](https://revstack.dev) — billing infrastructure for SaaS.

Provides a single `Revstack` client with two namespaces:

- **Data Plane** (`revstack.*`) — Daily backend operations: entitlement checks, usage reporting, subscriptions, customers, wallets, plans, invoices, and webhook verification.
- **Control Plane** (`revstack.admin.*`) — Infrastructure management: plan CRUD, entitlement CRUD, integrations, environments, and Billing as Code sync.

## Installation

```bash
npm install @revstackhq/node
```

## Quick Start

```typescript
import { Revstack } from "@revstackhq/node";

const revstack = new Revstack({
  secretKey: process.env.REVSTACK_SECRET_KEY!,
});
```

### Check Feature Access

```typescript
const { allowed, limit, usage } = await revstack.entitlements.check(
  "cus_abc123",
  "api-calls"
);

if (!allowed) {
  return res.status(403).json({ error: "Upgrade required" });
}
```

### Report Usage

```typescript
await revstack.usage.report({
  customer_id: "cus_abc123",
  feature_id: "api-calls",
  delta: 1,
});
```

### Manage Subscriptions

```typescript
// Create a subscription
const sub = await revstack.subscriptions.create({
  customer_id: "cus_abc123",
  plan_id: "plan_pro",
});

// Change plan
await revstack.subscriptions.changePlan(sub.id, {
  plan_id: "plan_enterprise",
});
```

### Verify Webhooks

```typescript
const event = revstack.webhooks.constructEvent(
  requestBody,
  signatureHeader,
  webhookSecret
);
```

## API Reference

### Data Plane Modules

| Module          | Description                                 |
| --------------- | ------------------------------------------- |
| `customers`     | Create, update, and query customer records  |
| `subscriptions` | Create, cancel, and manage subscriptions    |
| `entitlements`  | Check feature access and query entitlements |
| `usage`         | Report and query metered feature usage      |
| `wallets`       | Manage customer wallet balances             |
| `webhooks`      | Verify inbound webhook signatures           |
| `plans`         | Query billing plans (read-only)             |
| `invoices`      | Query billing invoices (read-only)          |

### Control Plane (`admin`)

| Module               | Description                            |
| -------------------- | -------------------------------------- |
| `admin.plans`        | CRUD operations for billing plans      |
| `admin.entitlements` | CRUD operations for entitlements       |
| `admin.integrations` | Manage payment provider integrations   |
| `admin.environments` | Manage deployment environments         |
| `admin.system`       | Billing as Code sync (preview + apply) |

### Error Hierarchy

The SDK provides a structured error hierarchy for precise error handling:

```typescript
import { Revstack, RateLimitError, RevstackAPIError } from "@revstackhq/node";

try {
  await revstack.entitlements.check("cus_abc", "api-calls");
} catch (error) {
  if (error instanceof RateLimitError) {
    // Retry after error.retryAfter seconds
  } else if (error instanceof RevstackAPIError) {
    // API returned a non-2xx status
    console.error(error.status, error.message);
  }
}
```

| Error                        | Description                                 |
| ---------------------------- | ------------------------------------------- |
| `RevstackError`              | Base error class for all SDK errors         |
| `RevstackAPIError`           | API returned a non-2xx response             |
| `RateLimitError`             | Rate limit exceeded (includes `retryAfter`) |
| `SignatureVerificationError` | Webhook signature verification failed       |
| `SyncConflictError`          | Billing as Code sync conflict detected      |

### Constructor Options

```typescript
new Revstack({
  secretKey: "sk_live_...", // Required — your Revstack Secret Key
  baseUrl: "https://...", // Optional — API base URL (default: https://app.revstack.dev/api/v1)
  timeout: 10000, // Optional — request timeout in ms (default: 10000)
});
```

## License

MIT
