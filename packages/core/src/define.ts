import { FeatureDef, PlanDef } from "@/types";

export function defineFeature<T extends FeatureDef>(config: T): T {
  return config;
}

export function definePlan<T extends PlanDef>(config: T): T {
  return config;
}
