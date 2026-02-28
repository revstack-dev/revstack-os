# @revstackhq/core

## 0.0.0-dev-20260228063247

### Patch Changes

- Refactored `DiscountDefSchema` to use `superRefine`, restoring native TypeScript IntelliSense for coupon limits (like percent <= 100), and patched the CLI `push` command to correctly surface nested Zod validation traces.

## 0.0.0-dev-20260228062053

### Patch Changes

- Refined Discount schema to strictly require `duration_in_months` for repeating coupons and prohibit it for once/forever durations natively.

## 0.0.0-dev-20260228060138

### Minor Changes

- Refactored core data models with robust Zod validation, introduced two-tier CLI pushing, and added 3 new advanced CLI starting templates.

## 0.0.0-dev-20260227103607

### Minor Changes

- feat(cli, core): implement overage pricing configuration in PriceDef and business templates

## 0.0.0-dev-20260227093823

### Patch Changes

- fix(core): resolve ESM module resolution errors by moving to bundler strategy and unifying dist output

## 0.0.0-dev-20260226062415

### Patch Changes

- fix: resolve path aliases in build output with tsc-alias
