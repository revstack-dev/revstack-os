import { ProviderLoader } from "@/types/loader";

const loaders: Record<string, ProviderLoader> = {};

const builtInProviders: Record<string, string> = {
  stripe: "@revstackhq/provider-stripe",
};

export function registerProvider(slug: string, loader: ProviderLoader) {
  loaders[slug] = loader;
}

export function getProviderLoader(slug: string): ProviderLoader | undefined {
  return loaders[slug];
}

export function listRegisteredProviders(): string[] {
  return Object.keys(loaders).sort();
}

export function listAvailableProviders(): string[] {
  return Object.keys(builtInProviders).sort();
}

export function registerBuiltInProviders() {
  for (const [slug, pkg] of Object.entries(builtInProviders)) {
    registerProvider(
      slug,
      () => import(pkg) as unknown as ReturnType<ProviderLoader>,
    );
  }
}
