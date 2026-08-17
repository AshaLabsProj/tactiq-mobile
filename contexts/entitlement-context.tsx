import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  FREE_ENTITLEMENT,
  MockEntitlementClient,
  type EntitlementClient,
  type EntitlementSnapshot,
  type PurchaseResult,
  type SubscriptionProduct,
  type SubscriptionOffer,
  hasProAccess,
} from "@/lib/entitlements";
import { RevenueCatEntitlementClient } from "@/lib/revenuecat-client";
import { type GateResult, type ProFeature, gateForFeature } from "@/lib/feature-gates";
import { logSubscriptionEvent } from "@/lib/subscription-events";

interface EntitlementContextValue {
  entitlement: EntitlementSnapshot;
  isLoading: boolean;
  isPro: boolean;
  isStoreReady: boolean;
  offers: SubscriptionOffer[];
  refreshEntitlement: () => Promise<EntitlementSnapshot>;
  refreshOffers: () => Promise<SubscriptionOffer[]>;
  purchase: (product: SubscriptionProduct, origin?: string) => Promise<PurchaseResult>;
  restorePurchases: (origin?: string) => Promise<EntitlementSnapshot>;
  openCustomerCenter: () => Promise<boolean>;
  gate: (feature: ProFeature, origin?: string) => GateResult;
}

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

export function EntitlementProvider({ children, client }: { children: ReactNode; client?: EntitlementClient }) {
  const [activeClient] = useState<EntitlementClient>(() => client ?? new RevenueCatEntitlementClient());
  const [entitlement, setEntitlement] = useState<EntitlementSnapshot>(FREE_ENTITLEMENT);
  const [offers, setOffers] = useState<SubscriptionOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshEntitlement = useCallback(async () => {
    try {
      const next = await activeClient.getSnapshot();
      setEntitlement(next);
      return next;
    } catch (error) {
      const fallback: EntitlementSnapshot = {
        ...FREE_ENTITLEMENT,
        source: activeClient.source,
        error: error instanceof Error ? error.message : "Could not refresh subscription status.",
        lastUpdatedAt: new Date().toISOString(),
      };
      setEntitlement(fallback);
      return fallback;
    }
  }, [activeClient]);

  const refreshOffers = useCallback(async () => {
    try {
      const next = await activeClient.getOffers();
      setOffers(next);
      return next;
    } catch {
      setOffers([]);
      return [];
    }
  }, [activeClient]);

  useEffect(() => {
    let mounted = true;
    void activeClient
      .initialize()
      .then(async () => {
        await Promise.all([refreshEntitlement(), refreshOffers()]);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [activeClient, refreshEntitlement, refreshOffers]);

  const purchase = useCallback(
    async (product: SubscriptionProduct, origin?: string) => {
      await logSubscriptionEvent("purchase_started", origin, { product });
      try {
        const result = await activeClient.purchase(product);
        setEntitlement(result.snapshot);
        await logSubscriptionEvent(result.cancelled ? "purchase_cancelled" : "purchase_completed", origin, { product });
        return result;
      } catch (error) {
        await logSubscriptionEvent("purchase_cancelled", origin, { product, error: true });
        throw error;
      }
    },
    [activeClient],
  );

  const restorePurchases = useCallback(
    async (origin?: string) => {
      await logSubscriptionEvent("restore_started", origin);
      const next = await activeClient.restore();
      setEntitlement(next);
      await logSubscriptionEvent("restore_completed", origin, { plan: next.plan });
      return next;
    },
    [activeClient],
  );

  const gate = useCallback(
    (feature: ProFeature, origin?: string) => {
      const result = gateForFeature(feature, entitlement);
      if (!result.allowed) void logSubscriptionEvent("gate_encountered", origin, { feature });
      return result;
    },
    [entitlement],
  );

  const value = useMemo<EntitlementContextValue>(
    () => ({
      entitlement,
      isLoading,
      isPro: hasProAccess(entitlement),
      isStoreReady: activeClient.source === "revenuecat",
      offers,
      refreshEntitlement,
      refreshOffers,
      purchase,
      restorePurchases,
      openCustomerCenter: activeClient.openCustomerCenter,
      gate,
    }),
    [activeClient.openCustomerCenter, entitlement, gate, isLoading, offers, purchase, refreshEntitlement, refreshOffers, restorePurchases],
  );

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlement(): EntitlementContextValue {
  const context = useContext(EntitlementContext);
  if (!context) throw new Error("useEntitlement must be used inside EntitlementProvider");
  return context;
}
