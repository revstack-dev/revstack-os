# @revstackhq/cli

## 0.0.0-dev-20260228063247

### Patch Changes

- Refactored `DiscountDefSchema` to use `superRefine`, restoring native TypeScript IntelliSense for coupon limits (like percent <= 100), and patched the CLI `push` command to correctly surface nested Zod validation traces.
- Updated dependencies
  - @revstackhq/core@0.0.0-dev-20260228063247

## 0.0.0-dev-20260228062053

### Patch Changes

- Updated dependencies
  - @revstackhq/core@0.0.0-dev-20260228062053

## 0.0.0-dev-20260228060138

### Minor Changes

- Refactored core data models with robust Zod validation, introduced two-tier CLI pushing, and added 3 new advanced CLI starting templates.

### Patch Changes

- Updated dependencies
  - @revstackhq/core@0.0.0-dev-20260228060138

## 0.0.0-dev-20260227103607

### Minor Changes

- feat(cli, core): implement overage pricing configuration in PriceDef and business templates

### Patch Changes

- Updated dependencies
  - @revstackhq/core@0.0.0-dev-20260227103607

## 0.0.0-dev-20260227093823

### Patch Changes

- Updated dependencies
  - @revstackhq/core@0.0.0-dev-20260227093823

## 0.0.0-dev-20260227092523

### Minor Changes

- implement modular enterprise configuration structure and interactive addons in init command

## 0.0.0-dev-20260226064743

### Patch Changes

- fix: respect snapshot releases during core package scaffold

## 0.0.0-dev-20260226064458

### Patch Changes

- fix: format console output line breaks correctly in init command

## 0.0.0-dev-20260226063200

### Patch Changes

- fix: respect snapshot releases during core package scaffold

## 0.0.0-dev-20260226061807

### Minor Changes

- feat: refactor scaffold strategy to generate a `revstack/` directory containing `features.ts` and `plans.ts` instead of a monolithic config file

## 0.0.0-dev-20260226055348

### Patch Changes

- fix: move `ora` and `execa` to dependencies to prevent "module not found" errors when running the CLI via npx

## 0.0.0-dev-20260226054346

### Patch Changes

- add publish config access public

## 0.0.0-dev-20260226054033

### Minor Changes

- Initial release of the Revstack CLI.
