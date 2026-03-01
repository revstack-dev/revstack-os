import { ProviderClient } from "@/clients/interface";
import { PolarClientV1 } from "@/clients/v1";

export function getClient(_config: Record<string, unknown>): ProviderClient {
  return new PolarClientV1();
}
