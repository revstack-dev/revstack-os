# @revstackhq/provider-stripe

## 0.0.0-revert-to-index-20260207011336

### Patch Changes

- Enable 'sideEffects: true' in package.json to prevent Webpack tree-shaking from removing the 'manifest' export during dynamic imports.

## 0.0.0-fix-exports-20260207010326

### Patch Changes

- Explicitly assign static manifest to Provider class in entry point and consolidate package.json exports to ensure availability in Next.js runtime.

## 0.0.0-20260207005540

### Patch Changes

- Add static 'manifest' property to Provider class to prevent tree-shaking issues in dynamic imports.

## 0.0.0-fix-root-imports-20260207004846

### Patch Changes

- Refactor package entry point to replace path aliases with relative imports and use explicit exports, fixing module resolution issues in Next.js.

## 0.0.0-fix-cache-20260207003251

### Patch Changes

- Migrate build script to tsup.config.ts and rename output artifact to 'provider.js' to resolve caching collisions in Next.js.

## 0.0.0-dev-20260207002607

### Patch Changes

- Add 'exports' field to package.json to correctly expose ESM entry points and types for Next.js 13+ App Router compatibility.

## 0.0.0-dev-20260206234750

### Patch Changes

- Export 'manifest' from package entry point to ensure metadata is accessible by the Registry loader.

## 0.2.1

### Patch Changes

- Fix build configuration to include static assets (publicDir) and update manifest with the official logo URL.

## 0.2.0

### Minor Changes

- Initial project structure. Added core type definitions, manifest schemas, and initial scaffolding for the Stripe provider.

### Patch Changes

- Updated dependencies
  - @revstackhq/providers-core@0.2.0
