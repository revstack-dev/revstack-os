# Contributing to Revstack

Thanks for your interest in contributing to Revstack! We keep things pretty straightforward around here — this guide covers everything you need to get going.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Writing Code](#writing-code)
- [Testing](#testing)
- [Changesets](#changesets)
- [Pull Requests](#pull-requests)
- [Writing a Provider](#writing-a-provider)
- [Code Style](#code-style)
- [Reporting Bugs](#reporting-bugs)
- [License](#license)

## Getting Started

### Prerequisites

| Tool    | Version |
| ------- | ------- |
| Node.js | >= 18   |
| pnpm    | 9.x     |

If you don't have pnpm installed:

```sh
corepack enable
corepack prepare pnpm@9.0.0 --activate
```

### Setup

1. Fork the repo and clone your fork.
2. Install dependencies from the root:

```sh
pnpm install
```

3. Build everything once so cross-package references resolve:

```sh
pnpm build
```

That's it. The monorepo handles the rest through Turborepo and pnpm workspaces.

## Project Structure

```
revstack-os/
├── packages/
│   ├── core/               # Entitlements, usage tracking, shared logic
│   ├── auth/               # JWT verification, auth contracts (RS256/HS256)
│   ├── node/               # Node.js SDK (HTTP client, webhooks)
│   ├── next/               # Next.js integration
│   ├── react/              # React hooks and components
│   ├── browser/            # Browser-side SDK
│   ├── ai/                 # AI-related utilities
│   ├── providers/
│   │   ├── core/           # Base classes and interfaces for providers
│   │   ├── registry/       # Provider discovery and registration
│   │   ├── official/       # First-party providers (e.g. Stripe)
│   │   └── community/      # Community-contributed providers
│   ├── eslint-config/      # Shared ESLint config
│   └── typescript-config/  # Shared tsconfig presets
├── turbo.json              # Turborepo pipeline config
├── pnpm-workspace.yaml     # Workspace definitions
└── .changeset/             # Changeset configuration
```

Each package is published under `@revstackhq/*` and is written entirely in TypeScript.

## Development Workflow

### Common commands

All commands run from the repo root:

```sh
# Build all packages (respects dependency order)
pnpm build

# Type-check without emitting
pnpm check-types

# Lint
pnpm lint

# Format with Prettier
pnpm format

# Run tests (from within a specific package)
cd packages/auth && pnpm test
```

### Working on a single package

You don't need to rebuild the entire monorepo every time. Turbo's `--filter` flag is your friend:

```sh
# Build only @revstackhq/auth and its dependencies
pnpm build --filter=@revstackhq/auth...

# Type-check just the core package
pnpm check-types --filter=@revstackhq/core
```

The `...` suffix tells Turbo to include upstream dependencies in the build graph.

## Writing Code

### TypeScript

- Strict mode is on. Don't use `any` unless you genuinely have no other option, and if you do, leave a comment explaining why.
- Prefer discriminated unions over type assertions. If you have a union type, narrow it with a runtime check before accessing variant-specific properties.
- Use relative imports in test files (e.g. `../../src/module`).

### Exports

Each package exposes a single public entry point through its `main` and `types` fields in `package.json`. If you're adding new public API surface, make sure it's re-exported from the package's `src/index.ts`.

Internal helpers that shouldn't be consumed externally should stay in their own files and not be exported from the barrel.

### Error Handling

Provider implementations should return `AsyncActionResult<T>` objects with proper error codes from `RevstackErrorCode` rather than throwing exceptions. The SDK layers translate these into typed errors (`RevstackAPIError`, `RateLimitError`, etc.) at the boundary.

## Testing

We use [Vitest](https://vitest.dev/) across the repo.

```sh
# Run tests in a specific package
cd packages/core
pnpm test

# Run in watch mode during development
pnpm vitest
```

### Guidelines

- Put unit tests under `tests/unit/` within each package.
- Use relative imports to reference source files (e.g. `../../src/module`).
- Each test file gets its own `tsconfig.test.json` and `vitest.config.ts` already configured — just follow the existing pattern.
- Don't mock things you don't own unless it's unavoidable (network calls, timers, etc.). For HTTP testing, we use [MSW](https://mswjs.io/) where possible.
- Discriminated union types need runtime narrowing in tests too — TypeScript won't let you assert `contract.jwksUri` without first checking `contract.strategy === "RS256"`.

### Running the full suite

There's no root-level `test` script yet. Run tests per-package for now.

## Changesets

We use [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs. If your PR changes anything that affects published packages, you need to include a changeset.

```sh
pnpm changeset
```

This will walk you through selecting which packages changed and whether it's a patch, minor, or major bump. The generated markdown file goes into `.changeset/` and gets committed with your PR.

**When to add a changeset:**

- Bug fixes, new features, or breaking changes to any `@revstackhq/*` package → yes.
- Changes to tests, docs, CI config, or internal tooling only → no.

**Versioning rules:**

- Breaking changes to public API → `major`
- New features, new exports → `minor`
- Bug fixes, internal refactors → `patch`

Don't overthink it. If you're unsure, go with `patch` and we'll adjust during review.

## Pull Requests

### Before you submit

1. Make sure `pnpm build` passes from the root. Turbo will catch cross-package breakage.
2. Run `pnpm check-types` to verify there are no type errors.
3. Run `pnpm lint` and `pnpm format` to avoid noisy diffs.
4. Run the tests for any packages you touched.
5. Add a changeset if applicable.

### PR guidelines

- Keep PRs focused. One concern per PR makes review faster for everyone.
- Write a clear description of _what_ changed and _why_. We can read the diff to see _how_.
- If your change is visual or alters SDK behavior, include code snippets or examples showing the before/after.
- Link any relevant issues.

### Review process

A maintainer will review your PR. We might ask for changes — don't take it personally, we're just trying to keep things solid. Once approved, a maintainer will merge and handle the release.

## Writing a Provider

Providers live under `packages/providers/`. Official (first-party) providers go in `official/`, community contributions go in `community/`.

A provider package needs to:

1. **Extend `BaseProvider`** from `@revstackhq/providers-core`.
2. **Implement the required lifecycle hooks** — at minimum `onInstall`, `onUninstall`, `verifyWebhookSignature`, `parseWebhookEvent`, and `getWebhookResponse`.
3. **Optionally implement feature interfaces** for payments, subscriptions, customers, etc.
4. **Include a manifest** with metadata (slug, name, logo, version, supported features).
5. **Return `AsyncActionResult<T>`** from every method — never throw from provider code.

Look at `packages/providers/official/stripe` as a reference implementation. It covers the full surface area including webhook setup/teardown and customer management.

### Provider checklist

- [ ] Package has its own `package.json` with `@revstackhq/providers-core` as a dependency.
- [ ] Manifest includes slug, name, logo URL, and version.
- [ ] All methods return `AsyncActionResult` with proper `RevstackErrorCode` on failure.
- [ ] Unsupported features return `RevstackErrorCode.NotImplemented` — don't just omit them silently.
- [ ] Webhook signature verification works correctly.
- [ ] Provider builds cleanly with `pnpm build`.

## Code Style

We don't have a long list of style rules. Prettier and ESLint handle most of it:

- **Prettier** handles formatting. Don't fight it, just run `pnpm format`.
- **ESLint** catches common issues. The shared config lives in `packages/eslint-config`.
- **Semicolons** — yes, always.
- **Quotes** — double quotes for strings (Prettier default).
- **Naming** — `camelCase` for variables and functions, `PascalCase` for types/classes/interfaces, `UPPER_SNAKE_CASE` for constants.

If Prettier and ESLint don't complain, you're fine.

## Reporting Bugs

Open an issue with:

1. What you expected to happen.
2. What actually happened.
3. Steps to reproduce (the simpler the better).
4. The package and version affected.
5. Your Node.js version and OS.

A failing test case is worth a thousand words — if you can write one, include it.

## License

This monorepo uses a split licensing model:

- **Client SDKs and ecosystem packages** (Node, React, Next, Auth, AI, Browser) are licensed under the **MIT License**. Use them anywhere, in any project.
- **Core infrastructure packages** (Core, Providers) are licensed under the **[Functional Source License (FSL-1.1-MIT)](https://fsl.software/)**. They are free to use internally and for non-commercial purposes, but you may not use them to offer a competing hosted service. After two years, each release automatically converts to MIT.

By contributing to this repository, you agree that your contributions will be licensed under the license that applies to the package you are contributing to. See [LICENSE.md](LICENSE.md) at the root of the repo for the full breakdown.
