# @revstackhq/providers-registry

## 0.0.0-dev-20260210021739

### Patch Changes

- Updated dependencies
  - @revstackhq/providers-core@0.0.0-dev-20260210021739

## 0.0.0-dev-20260210020419

### Patch Changes

- Updated dependencies
  - @revstackhq/providers-core@0.0.0-dev-20260210020419

## 0.0.0-dev-20260209034148

### Patch Changes

- Updated dependencies
  - @revstackhq/providers-core@0.0.0-dev-20260209034148

## 0.0.0-fix-registry-20260207024553

### Patch Changes

- Refactor 'loadManifest' to use a generic scanner that iterates over all exported members, enabling dynamic detection of provider classes and manifests regardless of their export names.

## 0.0.0-final-static-fix-20260207022938

### Patch Changes

- Implement fallback scanner in registry to detect 'static manifest' properties on exported classes and update provider to expose it, resolving tree-shaking issues where named exports were removed in production builds.
- Updated dependencies
  - @revstackhq/provider-stripe@0.0.0-final-static-fix-20260207022938

## 0.0.0-simple-export-20260207021649

### Patch Changes

- Refactor provider structure to export 'manifest' as a standalone constant and simplify registry lookup logic, ensuring reliable access to provider metadata without class initialization issues.
- Updated dependencies
  - @revstackhq/provider-stripe@0.0.0-simple-export-20260207021649

## 0.0.0-hardcoded-getter-20260207020732

### Patch Changes

- Update provider loading logic to dynamically scan exported classes for 'static manifest' properties, supporting getter-based manifests to resolve initialization timing issues.
- Updated dependencies
  - @revstackhq/provider-stripe@0.0.0-hardcoded-getter-20260207020732

## 0.0.0-log-raw-20260207020205

### Patch Changes

- Log raw in getProviderManifest

## 0.0.0-default-export-fix-20260207015928

### Patch Changes

- Refactor entry point to use a default export object containing both the manifest and the provider class, preventing hoisting issues where static properties were lost during module initialization.
- Updated dependencies
  - @revstackhq/provider-stripe@0.0.0-default-export-fix-20260207015928

## 0.0.0-inline-explicit-20260207015256

### Patch Changes

- Inline manifest definition and explicitly attach it to the Provider class prototype to guarantee availability during runtime scanning.
- Updated dependencies
  - @revstackhq/provider-stripe@0.0.0-inline-explicit-20260207015256

## 0.0.0-lazy-manifest-20260207014615

### Patch Changes

- Convert 'static manifest' property to a getter to resolve module initialization timing issues where the manifest object could be undefined during export.
- Updated dependencies
  - @revstackhq/provider-stripe@0.0.0-lazy-manifest-20260207014615

## 0.0.0-generic-scanner-20260207014006

### Patch Changes

- Refactor provider loading logic to use a generic scanner for static manifests, fixing tree-shaking issues in production builds.
- Updated dependencies
  - @revstackhq/provider-stripe@0.0.0-generic-scanner-20260207014006

## 0.0.0-unified-fix-20260207013327

### Patch Changes

- Unify package exports into a single default object (ProviderModule) and disable code splitting to ensure manifest availability in Next.js runtime.
- Updated dependencies
  - @revstackhq/provider-stripe@0.0.0-unified-fix-20260207013327

## 0.0.0-inline-fix-20260207012539

### Patch Changes

- Inline manifest and provider class into a single entry file (index.ts) to resolve persistent tree-shaking and module resolution issues.
- Updated dependencies
  - @revstackhq/provider-stripe@0.0.0-inline-fix-20260207012539

## 0.0.0-unified-export-20260207011934

### Patch Changes

- Disable code splitting in tsup build and unify exports into a default object to prevent tree-shaking from removing the 'manifest' in Next.js.
- Updated dependencies
  - @revstackhq/provider-stripe@0.0.0-unified-export-20260207011934

## 0.0.0-revert-to-index-20260207011336

### Patch Changes

- Enable 'sideEffects: true' in package.json to prevent Webpack tree-shaking from removing the 'manifest' export during dynamic imports.
- Updated dependencies
  - @revstackhq/provider-stripe@0.0.0-revert-to-index-20260207011336

## 0.0.0-fix-exports-20260207010326

### Patch Changes

- Updated dependencies
  - @revstackhq/provider-stripe@0.0.0-fix-exports-20260207010326

## 0.0.0-20260207005540

### Patch Changes

- Add static 'manifest' property to Provider class to prevent tree-shaking issues in dynamic imports.
- Updated dependencies
  - @revstackhq/provider-stripe@0.0.0-20260207005540

## 0.0.0-fix-root-imports-20260207004846

### Patch Changes

- Updated dependencies
  - @revstackhq/provider-stripe@0.0.0-fix-root-imports-20260207004846

## 0.0.0-fix-cache-20260207003251

### Patch Changes

- Updated dependencies
  - @revstackhq/provider-stripe@0.0.0-fix-cache-20260207003251

## 0.0.0-dev-20260207002607

### Patch Changes

- Updated dependencies
  - @revstackhq/provider-stripe@0.0.0-dev-20260207002607

## 0.0.0-dev-20260206235227

### Patch Changes

- Fix catalog filtering logic to properly exclude undefined manifests and prevent runtime errors during provider loading.

## 0.0.0-dev-20260206234750

### Patch Changes

- Updated dependencies
  - @revstackhq/provider-stripe@0.0.0-dev-20260206234750

## 0.0.0-dev-20260206233446

### Patch Changes

- Refactor built-in provider registration to use explicit dynamic imports, resolving bundler analysis issues in Next.js/Webpack.

## 0.2.2

### Patch Changes

- Export registry utility functions and catalog retrieval methods to public API.

## 0.2.1

### Patch Changes

- Implement ProviderFactory and Registry logic to support dynamic provider instantiation and validation.

## 0.2.0

### Minor Changes

- Initial project structure. Added core type definitions, manifest schemas, and initial scaffolding for the Stripe provider.

### Patch Changes

- Updated dependencies
  - @revstackhq/providers-core@0.2.0
