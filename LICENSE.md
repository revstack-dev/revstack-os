# Licensing

Revstack uses a split licensing model. Different packages in this monorepo are released under different licenses depending on what they do.

## Client SDKs & Ecosystem Packages — MIT

Everything you need to integrate Revstack into your application is MIT-licensed. Use it however you want, in any project, commercial or otherwise, no strings attached.

| Package                         | License |
| ------------------------------- | ------- |
| `@revstackhq/node`              | MIT     |
| `@revstackhq/next`              | MIT     |
| `@revstackhq/react`             | MIT     |
| `@revstackhq/browser`           | MIT     |
| `@revstackhq/auth`              | MIT     |
| `@revstackhq/checkout`          | MIT     |
| `@revstackhq/ai`                | MIT     |
| `@revstackhq/eslint-config`     | MIT     |
| `@revstackhq/typescript-config` | MIT     |

These are the packages you install to build with Revstack. They will always be MIT.

## Core Infrastructure — FSL-1.1-MIT

The packages that power the Revstack platform itself — the entitlement engine, provider gateway, and provider implementations — are licensed under the [Functional Source License (FSL-1.1-MIT)](https://fsl.software/).

| Package                          | License     |
| -------------------------------- | ----------- |
| `@revstackhq/core`               | FSL-1.1-MIT |
| `@revstackhq/providers-core`     | FSL-1.1-MIT |
| `@revstackhq/providers-registry` | FSL-1.1-MIT |
| `@revstackhq/provider-stripe`    | FSL-1.1-MIT |

### What does FSL mean in practice?

**You can:**

- Read the source code
- Fork it and modify it
- Use it internally within your own organization
- Use it for non-commercial education and research
- Build and sell professional services around it (consulting, integration work, etc.)

**You cannot:**

- Offer it as a hosted or managed service that competes with Revstack

**After two years**, each release automatically converts to MIT — at that point, all restrictions are removed and you can do anything you want with it.

### Why FSL?

We want to build in the open. We want contributors to see exactly how things work and to be able to shape the direction of the project. But we also need to sustain a business that funds this development. FSL lets us do both.

This is the same approach used by [Sentry](https://blog.sentry.io/introducing-the-functional-source-license-freedom-without-free-riding/), [GitButler](https://blog.gitbutler.com/why-were-changing-to-the-fsl/), and other open-source-first companies that chose transparency over closed-source proprietary licensing.

## How to tell which license applies

Every package in this monorepo has its own `LICENSE` file. The `license` field in each `package.json` reflects the applicable license. When in doubt, check the package directory.

## Questions?

If you have questions about licensing, commercial use, or redistribution, [open an issue](https://github.com/revstackhq/revstack-os/issues) or reach out to us directly.
