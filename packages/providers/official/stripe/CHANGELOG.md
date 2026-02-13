# @revstackhq/provider-stripe

## 0.0.0-dev-20260213012447

### Patch Changes

- log: add error logs to install, uninstall methods

## 0.0.0-dev-20260213010809

### Patch Changes

- Updated dependencies
  - @revstackhq/providers-core@0.0.0-dev-20260213010809

## 0.0.0-dev-20260213005143

### Patch Changes

- Updated dependencies
  - @revstackhq/providers-core@0.0.0-dev-20260213005143

## 0.0.0-dev-20260213004903

### Patch Changes

- Updated dependencies
  - @revstackhq/providers-core@0.0.0-dev-20260213004903

## 0.0.0-dev-20260210021739

### Minor Changes

- feat: implement robust provider manifest schema with engine requirements and input validation

### Patch Changes

- Updated dependencies
  - @revstackhq/providers-core@0.0.0-dev-20260210021739

## 0.0.0-dev-20260210020419

### Minor Changes

- enhance ProviderManifest with engine compatibility, pricing metadata, and validation schema.

### Patch Changes

- Updated dependencies
  - @revstackhq/providers-core@0.0.0-dev-20260210020419

## 0.0.0-dev-20260209035324

### Patch Changes

- fix: rebuild package to include missing distribution files from previous release

## 0.0.0-dev-20260209034954

### Patch Changes

- fix: exclude smoke test files from production build artifacts to prevent runtime errors

## 0.0.0-dev-20260209034148

### Minor Changes

- feat: implement provider uninstall cleanup, shared testing tools, and robust Stripe webhook handling.

### Patch Changes

- Updated dependencies
  - @revstackhq/providers-core@0.0.0-dev-20260209034148

## 0.0.0-split-stripe-provider-files-20260207030110

### Patch Changes

- Refactor internal file structure to separate manifest definition from provider logic using barrel exports, improving code maintainability.

## 0.0.0-fix-registry-20260207024553

### Patch Changes

- Refactor 'loadManifest' to use a generic scanner that iterates over all exported members, enabling dynamic detection of provider classes and manifests regardless of their export names.

## 0.0.0-final-static-fix-20260207022938

### Patch Changes

- Implement fallback scanner in registry to detect 'static manifest' properties on exported classes and update provider to expose it, resolving tree-shaking issues where named exports were removed in production builds.

## 0.0.0-simple-export-20260207021649

### Patch Changes

- Refactor provider structure to export 'manifest' as a standalone constant and simplify registry lookup logic, ensuring reliable access to provider metadata without class initialization issues.

## 0.0.0-hardcoded-getter-20260207020732

### Patch Changes

- Update provider loading logic to dynamically scan exported classes for 'static manifest' properties, supporting getter-based manifests to resolve initialization timing issues.

## 0.0.0-default-export-fix-20260207015928

### Patch Changes

- Refactor entry point to use a default export object containing both the manifest and the provider class, preventing hoisting issues where static properties were lost during module initialization.

## 0.0.0-inline-explicit-20260207015256

### Patch Changes

- Inline manifest definition and explicitly attach it to the Provider class prototype to guarantee availability during runtime scanning.

## 0.0.0-lazy-manifest-20260207014615

### Patch Changes

- Convert 'static manifest' property to a getter to resolve module initialization timing issues where the manifest object could be undefined during export.

## 0.0.0-generic-scanner-20260207014006

### Patch Changes

- Refactor provider loading logic to use a generic scanner for static manifests, fixing tree-shaking issues in production builds.

## 0.0.0-unified-fix-20260207013327

### Patch Changes

- Unify package exports into a single default object (ProviderModule) and disable code splitting to ensure manifest availability in Next.js runtime.

## 0.0.0-inline-fix-20260207012539

### Patch Changes

- Inline manifest and provider class into a single entry file (index.ts) to resolve persistent tree-shaking and module resolution issues.

## 0.0.0-unified-export-20260207011934

### Patch Changes

- Disable code splitting in tsup build and unify exports into a default object to prevent tree-shaking from removing the 'manifest' in Next.js.

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
