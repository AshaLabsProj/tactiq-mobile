/**
 * Subscription-domain types deliberately kept independent from RevenueCat.
 * Screens use this contract rather than importing a purchases SDK directly.
 */
export type PlanId = "free" | "pro";
export type EntitlementSource = "mock" | "revenuecat" | "unavailable";
export type BillingState = "active" | "trial" | "grace" | "billing-retry" | "expired" | "free";
export type SubscriptionProduct = "monthly" | "annual";

export interface SubscriptionOffer {
  product: SubscriptionProduct;
  identifier: string;
  priceString: string;
  periodLabel: string;
  introductoryPriceString?: string;
}

export interface EntitlementSnapshot {
  plan: PlanId;
  billingState: BillingState;
  source: EntitlementSource;
  product?: SubscriptionProduct;
  productIdentifier?: string;
  expirationDate?: string;
  willRenew?: boolean;
  lastUpdatedAt?: string;
  error?: string;
}

export interface PurchaseResult {
  snapshot: EntitlementSnapshot;
  cancelled?: boolean;
}

export interface EntitlementClient {
  readonly source: EntitlementSource;
  initialize: (appUserId?: string) => Promise<void>;
  getSnapshot: () => Promise<EntitlementSnapshot>;
  getOffers: () => Promise<SubscriptionOffer[]>;
  purchase: (product: SubscriptionProduct) => Promise<PurchaseResult>;
  restore: () => Promise<EntitlementSnapshot>;
  openCustomerCenter: () => Promise<boolean>;
  logOut?: () => Promise<void>;
}

export const FREE_ENTITLEMENT: EntitlementSnapshot = {
  plan: "free",
  billingState: "free",
  source: "mock",
  lastUpdatedAt: new Date(0).toISOString(),
};

/**
 * Used by tests, Expo Go and simulators before the native RevenueCat client is
 * installed. It never claims payment has occurred and never calls the network.
 */
export class MockEntitlementClient implements EntitlementClient {
  readonly source: EntitlementSource = "mock";
  private snapshot: EntitlementSnapshot;

  constructor(seed: Partial<EntitlementSnapshot> = {}) {
    this.snapshot = { ...FREE_ENTITLEMENT, ...seed, source: "mock" };
  }

  async initialize(): Promise<void> {
    return undefined;
  }

  async getSnapshot(): Promise<EntitlementSnapshot> {
    return this.snapshot;
  }

  async getOffers(): Promise<SubscriptionOffer[]> {
    return [];
  }

  async purchase(product: SubscriptionProduct): Promise<PurchaseResult> {
    this.snapshot = {
      plan: "pro",
      billingState: "trial",
      source: "mock",
      product,
      productIdentifier: product === "annual" ? "skilltracker_pro_annual" : "skilltracker_pro_monthly",
      willRenew: true,
      lastUpdatedAt: new Date().toISOString(),
    };
    return { snapshot: this.snapshot };
  }

  async restore(): Promise<EntitlementSnapshot> {
    return this.snapshot;
  }

  async openCustomerCenter(): Promise<boolean> {
    return false;
  }

  setSnapshot(next: EntitlementSnapshot): void {
    this.snapshot = { ...next, source: "mock" };
  }
}

export function hasProAccess(snapshot: EntitlementSnapshot): boolean {
  return snapshot.plan === "pro" && ["active", "trial", "grace", "billing-retry"].includes(snapshot.billingState);
}
