import { ProviderClient } from "@/clients/interface";
import { StripeClientV1 } from "@/clients/v1";

export function getClient(config: Record<string, any>): ProviderClient {
  return new StripeClientV1();
}
