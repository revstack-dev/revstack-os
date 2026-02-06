import { IProvider } from "@revstackhq/providers-core";

/**
 * Defines the shape of the module exported by a Provider Package.
 * Example: import * as stripeModule from '@revstack/provider-stripe';
 */
export interface ProviderModule {
  /**
   * The main class exported by the provider.
   * Must implement the IProvider interface and have a constructor.
   */
  DefaultProvider: new () => IProvider;
}

/**
 * A function that loads a provider module dynamically.
 * Used for lazy loading via import().
 */
export type ProviderLoader = () => Promise<ProviderModule>;
