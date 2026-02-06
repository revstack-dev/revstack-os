import { IProvider } from "@revstackhq/providers-core";
import { ProviderLoader, ProviderModule } from "@/types/loader";
import { getProviderLoader, listRegisteredProviders } from "@/registry";

/**
 * Factory class responsible for instantiating Provider SDKs.
 * It acts as the bridge between the Registry (loading mechanism) and the Core (execution).
 */
export class ProviderFactory {
  /**
   * Instantiates a Provider SDK by its slug.
   * * @param slug - The unique identifier of the provider (e.g., "stripe", "polar").
   * @returns An instance of the provider class implementing the IProvider contract.
   * @throws Error if the provider is not registered or fails to load.
   */
  static async create(slug: string): Promise<IProvider> {
    // 1. Retrieve the loader function from the registry
    const loader: ProviderLoader | undefined = getProviderLoader(slug);

    if (!loader) {
      const knownProviders = listRegisteredProviders();
      throw new Error(
        `Provider '${slug}' is not registered in Revstack. Available providers: [${knownProviders.join(", ")}]`,
      );
    }

    try {
      // 2. Execute the dynamic import
      const module: ProviderModule = await loader();

      // 3. Validation: Ensure the module exports the expected class
      if (!module.DefaultProvider) {
        throw new Error(
          `The package for '${slug}' does not export a 'DefaultProvider' class.`,
        );
      }

      return new module.DefaultProvider();
    } catch (error: any) {
      // Improve error message context
      throw new Error(
        `Failed to initialize provider '${slug}'. Details: ${error.message || error}`,
      );
    }
  }
}
