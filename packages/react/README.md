<div align="center">
  <h1>@revstackhq/react</h1>
  <p>The official React wrapper for Revstack.</p>
</div>

This package provides React Context and Hooks on top of `@revstackhq/browser`, delivering an effortless, flicker-free developer experience.

## Key Features

- **Zero-Flicker UI:** Synchronous cache reads prevent layout shifts.
- **SSR Safe:** Protects against hydration mismatches in Next.js and Remix.
- **Backward Compatible:** Supports React 16.8+ via `use-sync-external-store/shim`.
- **Reactive:** Components automatically re-render when entitlements change (e.g. after a checkout completes).

## Installation

```bash
npm install @revstackhq/react @revstackhq/browser
```

## Quick Start

### 1. Provide the Client

Wrap your application tree in `<RevstackProvider>`.

```tsx
import { RevstackProvider } from "@revstackhq/react";

export function App({ children }) {
  return (
    <RevstackProvider
      config={{
        publicKey: process.env.NEXT_PUBLIC_REVSTACK_KEY,
        getToken: async () => localStorage.getItem("token"),
      }}
    >
      {children}
    </RevstackProvider>
  );
}
```

### 2. Use Hooks

Read entitlements reactively anywhere in your app using `useEntitlement()`.

```tsx
import { useEntitlement, useRevstack } from "@revstackhq/react";

export function PremiumFeature() {
  const { hasAccess } = useEntitlement("pro_tier");
  const client = useRevstack();

  if (!client.isReady) {
    return <Spinner />;
  }

  if (!hasAccess) {
    return (
      <button
        onClick={() => client.startCheckout({ planId: "price_123" /* ... */ })}
      >
        Upgrade to Pro
      </button>
    );
  }

  return <div>Welcome to the Premium Feature!</div>;
}
```

## API Reference

- `RevstackProvider`: Context provider to supply the client configuration.
- `useEntitlement(key: string)`: Returns `{ key, hasAccess, value? }` and triggers re-renders on cache updates.
- `useRevstack()`: Returns the underlying `RevstackClient` instance to handle checkout, portals, or raw API calls.
