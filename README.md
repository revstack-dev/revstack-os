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
  <a href="LICENSE.md"><img alt="License" src="https://img.shields.io/badge/license-MIT%20%2F%20FSL-0a0a0a?style=flat-square&labelColor=0a0a0a"></a>
  <a href="https://github.com/revstackhq/revstack-os"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-0a0a0a?style=flat-square&labelColor=0a0a0a"></a>
</p>

---

## What is Revstack?

Revstack is a billing infrastructure platform for SaaS companies. Define your plans and entitlements in code, connect a payment provider, and let the platform handle entitlement checks, usage tracking, subscription lifecycle, and webhook orchestration.

This monorepo contains the open-source client SDKs, the entitlement engine, and the provider gateway that power [Revstack Cloud](https://app.revstack.dev).

## Packages

### Client SDKs & Ecosystem `MIT`

| Package                                                       | Description                                                    |
| ------------------------------------------------------------- | -------------------------------------------------------------- |
| [`@revstackhq/node`](packages/node)                           | Server-side SDK for Node.js                                    |
| [`@revstackhq/next`](packages/next)                           | Next.js integration                                            |
| [`@revstackhq/react`](packages/react)                         | React hooks and components                                     |
| [`@revstackhq/browser`](packages/browser)                     | Browser-side SDK                                               |
| [`@revstackhq/auth`](packages/auth)                           | JWT verification for Auth0, Clerk, Supabase, Cognito, Firebase |
| [`@revstackhq/ai`](packages/ai)                               | AI utilities                                                   |
| [`@revstackhq/cli`](packages/cli)                             | Command-line interface                                         |
| [`@revstackhq/eslint-config`](packages/eslint-config)         | Shared ESLint rules                                            |
| [`@revstackhq/typescript-config`](packages/typescript-config) | Shared TypeScript configurations                               |

### Core Infrastructure `FSL-1.1-MIT`

| Package                                                             | Description                 |
| ------------------------------------------------------------------- | --------------------------- |
| [`@revstackhq/core`](packages/core)                                 | Entitlement engine          |
| [`@revstackhq/providers-core`](packages/providers/core)             | Provider gateway interfaces |
| [`@revstackhq/providers-registry`](packages/providers/registry)     | Provider discovery          |
| [`@revstackhq/provider-stripe`](packages/providers/official/stripe) | Stripe provider             |

> Client SDKs & Ecosystem packages are MIT — use them anywhere. Core infrastructure uses the [Functional Source License](https://fsl.software/) and converts to MIT after two years. See [LICENSE.md](LICENSE.md).

## Development

```bash
git clone https://github.com/revstackhq/revstack-os.git
cd revstack-os
pnpm install
pnpm build
```

| Command                                   | Description                                 |
| ----------------------------------------- | ------------------------------------------- |
| `pnpm build`                              | Build all packages                          |
| `pnpm check-types`                        | Type-check everything                       |
| `pnpm lint`                               | Lint all packages                           |
| `pnpm format`                             | Format with Prettier                        |
| `pnpm build --filter=@revstackhq/auth...` | Build a single package and its dependencies |

Requires **Node.js >= 18** and **pnpm 9**.

## Contributing

Bug fixes, new features, documentation, and new payment providers are all welcome. See the [Contributing Guide](CONTRIBUTING.md).

## License

Client SDKs are [MIT](https://opensource.org/licenses/MIT). Core infrastructure is [FSL-1.1-MIT](https://fsl.software/) — free to use, converts to MIT after two years. See [LICENSE.md](LICENSE.md) for the full breakdown.
