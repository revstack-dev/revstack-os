import { starter } from "./starter";
import { b2bSaas } from "./b2b-saas";
import { usageBased } from "./usage-based";
import type { TemplateConfig } from "./starter";

export const TEMPLATES: Record<string, TemplateConfig> = {
  starter: starter,
  "b2b-saas": b2bSaas,
  "usage-based": usageBased,
};

export type { TemplateConfig };
