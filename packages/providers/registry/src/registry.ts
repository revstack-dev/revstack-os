import { ProviderLoader } from "@/types/loader";
import { ProviderManifest } from "@revstackhq/providers-core";

const loaders: Record<string, ProviderLoader> = {};

const builtInProviders: Record<string, ProviderLoader> = {
  stripe: () =>
    import("@revstackhq/provider-stripe") as unknown as ReturnType<ProviderLoader>,
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
  for (const [slug, loader] of Object.entries(builtInProviders)) {
    registerProvider(slug, loader);
  }
}

export async function getProviderManifest(
  slug: string,
): Promise<ProviderManifest | null> {
  const loader = getProviderLoader(slug);
  if (!loader) return null;

  try {
    const module = await loader();

    if (module.manifest) {
      return module.manifest;
    }

    const rawModule = module as any;

    if (rawModule.default && rawModule.default.manifest) {
      return rawModule.default.manifest;
    }

    console.warn(`⚠️ Manifest not found for ${slug}`);
    return null;
  } catch (e) {
    console.error(`❌ Error loading manifest for ${slug}:`, e);
    return null;
  }
}

export async function getCatalog(): Promise<ProviderManifest[]> {
  const slugs = listRegisteredProviders();
  const manifests = await Promise.all(
    slugs.map((slug) => getProviderManifest(slug)),
  );

  return manifests.filter((m): m is ProviderManifest => !!m);
}
