import {
  fetchEntitlements,
  createCheckoutSession,
  createBillingPortalSession,
} from "@/api/client";
import { resolveGuestId } from "@/identity/guest";
import type {
  RevstackConfig,
  Entitlement,
  CheckoutParams,
  BillingPortalParams,
} from "@/types";

const CHECKOUT_BASE = "https://checkout.revstack.dev";

type Listener = () => void;

export class RevstackClient {
  private config: RevstackConfig;
  private guestId: string | null = null;
  private entitlements: Map<string, Entitlement> = new Map();
  private _isInitialized = false;
  private _isReady = false;
  private _version = 0;
  private listeners: Set<Listener> = new Set();

  constructor(config: RevstackConfig) {
    this.config = config;
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * true once init() has settled (success or failure)
   * use this to show loading spinners in the UI
   */
  get isReady(): boolean {
    return this._isReady;
  }

  /**
   * resolves identity, fetches entitlements, and caches them locally
   * call this once on app startup
   */
  async init(): Promise<void> {
    try {
      this.guestId = await resolveGuestId(this.config);

      const response = await fetchEntitlements(this.config, this.guestId);

      this.entitlements.clear();
      for (const ent of response.entitlements) {
        this.entitlements.set(ent.key, ent);
      }

      this._isInitialized = true;
    } finally {
      this._isReady = true;
      this.emit();
    }
  }

  /**
   * synchronous entitlement check from local cache
   * returns a denied entitlement if the key is not found
   */
  getEntitlement(key: string): Entitlement {
    return this.entitlements.get(key) ?? { key, hasAccess: false };
  }

  /**
   * checks if the user has access to a feature
   */
  hasAccess(key: string): boolean {
    return this.getEntitlement(key).hasAccess;
  }

  /**
   * creates a checkout session and redirects the browser
   */
  async startCheckout(params: CheckoutParams): Promise<void> {
    const response = await createCheckoutSession(
      this.config,
      this.guestId,
      params
    );
    window.location.href = `${CHECKOUT_BASE}?sess=${response.sessionToken}`;
  }

  /**
   * opens the billing portal for the current user
   * redirects the browser to the portal url
   */
  async openBillingPortal(params: BillingPortalParams): Promise<void> {
    const response = await createBillingPortalSession(
      this.config,
      this.guestId,
      params
    );
    window.location.href = response.url;
  }

  // --- external store protocol for useSyncExternalStore ---

  /**
   * subscribe to entitlement changes
   * returns an unsubscribe function
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * snapshot version — changes whenever entitlements are updated
   * useSyncExternalStore uses this to detect when to re-render
   */
  getSnapshot(): number {
    return this._version;
  }

  private emit(): void {
    this._version++;
    for (const listener of this.listeners) {
      listener();
    }
  }
}
