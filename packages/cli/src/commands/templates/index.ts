import { starter } from "./starter";
import { b2bSaas } from "./b2b-saas";
import { usageBased } from "./usage-based";
import { ecommercePlatform } from "./ecommerce-platform";
import { developerTools } from "./developer-tools";
import { aiAgentPlatform } from "./ai-agent-platform";
import type { TemplateConfig } from "./starter";

export const TEMPLATES: Record<string, TemplateConfig> = {
  starter: starter,
  "b2b-saas": b2bSaas,
  "usage-based": usageBased,
  "ecommerce-platform": ecommercePlatform,
  "developer-tools": developerTools,
  "ai-agent-platform": aiAgentPlatform,
};

export type { TemplateConfig };
