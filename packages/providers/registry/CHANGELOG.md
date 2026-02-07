# @revstackhq/providers-registry

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
