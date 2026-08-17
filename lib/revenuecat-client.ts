import { Platform } from "react-native";
import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesPackage } from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";

import * as Auth from "@/lib/_core/auth";
import {
  FREE_ENTITLEMENT,
  type EntitlementClient,
  type EntitlementSnapshot,
  type PurchaseResult,
  type SubscriptionOffer,
  type SubscriptionProduct,
} from "@/lib/entitlements";

export const PRO_ENTITLEMENT_ID = "pro";
export const MONTHLY_PRODUCT_ID = "skilltracker_pro_monthly";
export const ANNUAL_PRODUCT_ID = "skilltracker_pro_annual";

// RevenueCat public SDK keys are intentionally client-side. They only identify
// the app/project; private API and webhook keys remain server-side.
const IOS_PUBLIC_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY ?? "appl_UtrcmquEdSKQsHiLjwPjbusAORM";
const ANDROID_PUBLIC_KEY = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY ?? "";

function productForIdentifier(identifier?: string): SubscriptionProduct | undefined {
  if (!identifier) return undefined;
  return identifier.includes("annual") || identifier.includes("yearly") ? "annual" : identifier.includes("monthly") ? "monthly" : undefined;
}

function customerSnapshot(info: CustomerInfo): EntitlementSnapshot {
  const entitlement = info.entitlements.active[PRO_ENTITLEMENT_ID];
  if (!entitlement) {
    return {
      ...FREE_ENTITLEMENT,
      source: "revenuecat",
      billingState: Object.keys(info.allExpirationDates).length ? "expired" : "free",
      lastUpdatedAt: new Date().toISOString(),
    };
  }
  const periodType = String(entitlement.periodType ?? "").toLowerCase();
  const billingIssueDetectedAt = (entitlement as { billingIssueDetectedAt?: string | null }).billingIssueDetectedAt;
  const billingState: EntitlementSnapshot["billingState"] = Boolean(billingIssueDetectedAt)
    ? "billing-retry"
    : periodType.includes("trial")
      ? "trial"
      : "active";
  return {
    plan: "pro",
    billingState,
    source: "revenuecat",
    product: productForIdentifier(entitlement.productIdentifier),
    productIdentifier: entitlement.productIdentifier,
    expirationDate: entitlement.expirationDate ?? undefined,
    willRenew: entitlement.willRenew,
    lastUpdatedAt: new Date().toISOString(),
  };
}

function toOffer(product: SubscriptionProduct, aPackage: PurchasesPackage): SubscriptionOffer {
  const productInfo = aPackage.product;
  return {
    product,
    identifier: productInfo.identifier,
    priceString: productInfo.priceString,
    periodLabel: product === "annual" ? "per year" : "per month",
    introductoryPriceString: productInfo.introPrice?.priceString ?? undefined,
  };
}

export class RevenueCatEntitlementClient implements EntitlementClient {
  readonly source = "revenuecat" as const;
  private initialized = false;

  async initialize(): Promise<void> {
    const apiKey = Platform.OS === "ios" ? IOS_PUBLIC_KEY : ANDROID_PUBLIC_KEY;
    if (!apiKey) throw new Error("Purchases are not configured for this platform yet.");
    if (!this.initialized) {
      if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      const user = await Auth.getUserInfo();
      Purchases.configure({ apiKey, appUserID: user ? `skilltracker-${user.id}` : undefined });
      this.initialized = true;
      return;
    }
    const user = await Auth.getUserInfo();
    if (user) await Purchases.logIn(`skilltracker-${user.id}`);
  }

  async getSnapshot(): Promise<EntitlementSnapshot> {
    await this.initialize();
    return customerSnapshot(await Purchases.getCustomerInfo());
  }

  async getOffers(): Promise<SubscriptionOffer[]> {
    await this.initialize();
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return [];
    const offers: SubscriptionOffer[] = [];
    if (current.annual) offers.push(toOffer("annual", current.annual));
    if (current.monthly) offers.push(toOffer("monthly", current.monthly));
    return offers;
  }

  async purchase(product: SubscriptionProduct): Promise<PurchaseResult> {
    await this.initialize();
    const offerings = await Purchases.getOfferings();
    const selected = product === "annual" ? offerings.current?.annual : offerings.current?.monthly;
    if (!selected) throw new Error("That plan is not available yet. Please try again shortly.");
    try {
      const result = await Purchases.purchasePackage(selected);
      return { snapshot: customerSnapshot(result.customerInfo) };
    } catch (error) {
      if ((error as { userCancelled?: boolean }).userCancelled) {
        return { snapshot: await this.getSnapshot(), cancelled: true };
      }
      throw error;
    }
  }

  async restore(): Promise<EntitlementSnapshot> {
    await this.initialize();
    return customerSnapshot(await Purchases.restorePurchases());
  }

  async openCustomerCenter(): Promise<boolean> {
    await this.initialize();
    await RevenueCatUI.presentCustomerCenter();
    return true;
  }

  async logOut(): Promise<void> {
    if (this.initialized) await Purchases.logOut();
  }
}
