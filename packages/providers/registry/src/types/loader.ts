import { IProvider, ProviderManifest } from "@revstackhq/providers-core";

/**
 * provider package module shape
 */
export interface ProviderModule {
  /**
   * main provider class
   */
  DefaultProvider: new () => IProvider;
  manifest: ProviderManifest;
}

/**
 * lazy loader for provider module
 */
export type ProviderLoader = () => Promise<ProviderModule>;
