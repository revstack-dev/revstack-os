import { ProviderLoader } from "@/types/loader";
import { ProviderManifest } from "@revstackhq/providers-core";

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

export async function getProviderManifest(
  slug: string,
): Promise<ProviderManifest | null> {
  const loader = getProviderLoader(slug);
  if (!loader) return null;

  try {
    const module = await loader();
    return module.manifest;
  } catch (e) {
    console.error(`Error loading manifest for ${slug}`, e);
    return null;
  }
}

export async function getCatalog(): Promise<ProviderManifest[]> {
  const slugs = listRegisteredProviders();
  const manifests = await Promise.all(
    slugs.map((slug) => getProviderManifest(slug)),
  );

  // Filtramos los nulls por si alguno falló
  return manifests.filter((m): m is ProviderManifest => m !== null);
}
