import { IProvider } from "@revstackhq/providers-core";
import { ProviderLoader, ProviderModule } from "@/types/loader";
import { getProviderLoader, listRegisteredProviders } from "@/registry";

/**
 * instantiates provider sdks
 */
export class ProviderFactory {
  /**
   * create an sdk instance by slug
   */
  static async create(slug: string): Promise<IProvider> {
    // get loader
    const loader: ProviderLoader | undefined = getProviderLoader(slug);

    if (!loader) {
      const knownProviders = listRegisteredProviders();
      throw new Error(
        `Provider '${slug}' is not registered in Revstack. Available providers: [${knownProviders.join(", ")}]`
      );
    }

    try {
      // load module
      const module: ProviderModule = await loader();

      // validate default export
      if (!module.DefaultProvider) {
        throw new Error(
          `The package for '${slug}' does not export a 'DefaultProvider' class.`
        );
      }

      return new module.DefaultProvider();
    } catch (error: any) {
      // throw with context
      throw new Error(
        `Failed to initialize provider '${slug}'. Details: ${error.message || error}`
      );
    }
  }
}
