import { ProviderLoader } from "@/types/loader";
import { ProviderManifest } from "@revstackhq/providers-core";

const loaders: Record<string, ProviderLoader> = {};

export function registerProvider(slug: string, loader: ProviderLoader) {
  loaders[slug] = loader;
}

export function getProviderLoader(slug: string): ProviderLoader | undefined {
  return loaders[slug];
}

export function listRegisteredProviders(): string[] {
  return Object.keys(loaders).sort();
}

export async function loadManifest(
  slug: string,
  loader: ProviderLoader,
): Promise<ProviderManifest | null> {
  try {
    const module = await loader();
    const raw = module as any;

    if (raw.manifest) {
      return raw.manifest;
    }

    console.error(
      `❌ Provider ${slug} violates the SDK standard: missing 'export const manifest'`,
    );
    return null;
  } catch (error) {
    console.error(`❌ Failed to load provider ${slug}:`, error);
    return null;
  }
}

export async function buildCatalog(config: Record<string, ProviderLoader>) {
  const results = await Promise.all(
    Object.entries(config).map(async ([slug, loader]) => {
      registerProvider(slug, loader);
      return await loadManifest(slug, loader);
    }),
  );
  return results.filter((m): m is ProviderManifest => m !== null);
}
