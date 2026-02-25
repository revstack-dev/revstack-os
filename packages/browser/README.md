<div align="center">
  <h1>@revstackhq/browser</h1>
  <p>The core, framework-agnostic vanilla TypeScript client for Revstack.</p>
</div>

This package provides the foundational browser client for resolving identity, checking entitlements, and launching checkout flows—all in under 3KB (minified + gzipped).

## Key Features

- **Zero Dependencies:** Pure Vanilla TypeScript.
- **Event-Based Architecture:** Built-in Pub/Sub for reactive updates.
- **Identity Handling:** Automatic Guest fingerprinting and native Auth JWT resolution.
- **Tiny footprint:** Available as an ESM/CJS module or a `<script>` tag CDN build.

## Installation

```bash
npm install @revstackhq/browser
```

Or via CDN:

```html
<script src="https://unpkg.com/@revstackhq/browser/dist/index.global.js"></script>
```

## Quick Start

Instantiate the `RevstackClient` once during application startup.

```typescript
import { RevstackClient } from "@revstackhq/browser";

const client = new RevstackClient({
  publicKey: "rs_pub_12345",
  async getToken() {
    return localStorage.getItem("auth_token");
  },
});

// 1. Initialize to fetch the user's current entitlements
await client.init();

// 2. Check access synchronously from the local cache
if (client.hasAccess("pro_features")) {
  console.log("Welcome to Pro!");
}

// 3. React to changes (e.g., after an upgrade)
const unsubscribe = client.subscribe(() => {
  console.log("Entitlements updated:", client.getEntitlement("pro_features"));
});
```

## API Reference

### Launching Checkout

Trigger a Stripe Checkout session securely without backend redirect boilerplate:

```typescript
await client.startCheckout({
  planId: "price_abc123",
  successUrl: "https://yourapp.com/success",
  cancelUrl: "https://yourapp.com/pricing",
});
```

### Customer Billing Portal

Allow users to manage subscriptions, update cards, or view invoices:

```typescript
await client.openBillingPortal({
  returnUrl: "https://yourapp.com/settings",
});
```
