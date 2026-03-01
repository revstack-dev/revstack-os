import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.POLAR_MODE as "sandbox" | "production" | undefined,
});

let polarClient: Polar | null = null;

export const getOrCreatePolar = (accessToken: string): Polar => {
  if (!polarClient) {
    polarClient = new Polar({
      accessToken,
    });
  }
  return polarClient;
};

/**
 * helper to build a query separator for URLs
 */
export function appendQueryParam(url: string, param: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return url + sep + param;
}
