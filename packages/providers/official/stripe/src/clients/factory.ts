import { ProviderClient } from "@/clients/interface";
import { StripeClientV1 } from "@/clients/v1";

export function getClient(_config: Record<string, unknown>): ProviderClient {
  return new StripeClientV1();
}
