import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import {
  RevstackClient,
  type RevstackConfig,
  type Entitlement,
} from "@revstackhq/browser";

// --- Context ---

const RevstackContext = createContext<RevstackClient | null>(null);

// --- Provider ---

interface RevstackProviderProps {
  config: RevstackConfig;
  children: ReactNode;
}

export function RevstackProvider({ config, children }: RevstackProviderProps) {
  // instantiate exactly once — stable across re-renders
  const [client] = useState(() => new RevstackClient(config));

  useEffect(() => {
    client.init().catch((err: unknown) => {
      console.error("[@revstackhq/react] Failed to initialize:", err);
    });
  }, [client]);

  return (
    <RevstackContext.Provider value={client}>
      {children}
    </RevstackContext.Provider>
  );
}

// --- Hooks ---

/**
 * returns the raw RevstackClient instance
 * throws if used outside of <RevstackProvider>
 */
export function useRevstack(): RevstackClient {
  const client = useContext(RevstackContext);
  if (!client) {
    throw new Error(
      "useRevstack must be used within a <RevstackProvider>. " +
        "Wrap your app with <RevstackProvider config={...}>."
    );
  }
  return client;
}

/**
 * subscribes to entitlement changes via useSyncExternalStore
 * safe for SSR — returns { key, hasAccess: false } on the server
 */
export function useEntitlement(key: string): Entitlement {
  const client = useRevstack();

  const subscribe = useCallback(
    (onStoreChange: () => void) => client.subscribe(onStoreChange),
    [client]
  );

  const getSnapshot = useCallback(
    () => client.getEntitlement(key),
    [client, key]
  );

  // safe SSR fallback — prevents hydration mismatches in Next.js/Remix
  const getServerSnapshot = useCallback(
    (): Entitlement => ({ key, hasAccess: false }),
    [key]
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// --- Re-exports ---

export { RevstackClient } from "@revstackhq/browser";
export type {
  RevstackConfig,
  Entitlement,
  CheckoutParams,
} from "@revstackhq/browser";
