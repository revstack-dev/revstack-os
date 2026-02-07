# @revstackhq/providers-registry

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
