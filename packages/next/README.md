<div align="center">
  <h1>@revstackhq/next</h1>
  <p>The Next.js 15 App Router SDK for Revstack.</p>
</div>

This package enforces strict Server/Client boundaries for Next.js 15 App Router applications, allowing you to gate access securely on the server and re-export safe hooks for your client components.

## Key Features

- **Strict Boundaries:** Subpath exports (`/server` and `/client`) prevent "useState cannot be used in a Server Component" errors.
- **Auto-Identity Resolution:** Reads async `headers()` to extract guest fingerprints and Auth JWTs automatically.
- **Server-Side Gating:** Securely verify entitlements before rendering structural UI.
- **Zero Webhooks:** Because Revstack Cloud acts as the source of truth, you just read entitlements.

## Installation

```bash
npm install @revstackhq/next @revstackhq/react @revstackhq/browser
```

## Overview

### Client Components

We re-export the React hooks securely from the `/client` subpath. Add `"use client"` and use them directly:

```tsx
// app/components/ClientPaywall.tsx
"use client";

import { useEntitlement } from "@revstackhq/next/client";

export function ClientPaywall() {
  const { hasAccess } = useEntitlement("generative_ai");
  if (!hasAccess) return <UpgradePrompt />;
  return <AI Workspace />;
}
```

### React Server Components (RSC)

Gate pages, layouts, or Server Actions using the `/server` utilities. Identity is extracted automatically from incoming request headers.

```tsx
// app/dashboard/page.tsx
import { requireEntitlement } from "@revstackhq/next/server";

export default async function DashboardPage() {
  // 1. Automatically throws or redirects if the user lacks access
  const entitlement = await requireEntitlement("pro_dashboard", {
    secretKey: process.env.REVSTACK_SECRET_KEY!,
    redirectTo: "/pricing", // Auto-redirect via Next.js navigation
  });

  // 2. Safely render the protected route
  return (
    <main>
      <h1>Pro Dashboard</h1>
      <p>Data limit: {entitlement.value}</p>
    </main>
  );
}
```

## API Reference (`@revstackhq/next/server`)

### `getEntitlement(key, config)`

Asynchronously resolves a single entitlement for the current user (identified via headers). Does not throw on denial.

### `requireEntitlement(key, config)`

Verifies access. If denied, it calls `redirect(config.redirectTo)` (if provided) or throws a generic Error.

### `withMetering(key, amount, config, handler)`

A Higher-Order Function to wrap Next.js App Router API Routes (`route.ts`). Intercepts requests to deduct metered limits before executing the developer's route handler. Returns a `402 Payment Required` response if credits are fully consumed.
