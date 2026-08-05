/**
 * RevenueCat Web Billing integration.
 *
 * The Web Billing public key (`rcb_...`) is a publishable key, so it lives in
 * the codebase. Set it below once the Web Billing app is configured in
 * RevenueCat (Project Settings → Apps → Web Billing).
 *
 * Entitlement + offering identifiers must match the RevenueCat dashboard.
 */
import type { CustomerInfo, Offering, Package, Purchases } from "@revenuecat/purchases-js";

/** Web Billing public API key. Publishable — safe in client code. */
export const REVENUECAT_WEB_API_KEY = "";

/** Entitlement that unlocks PagoPilot Premium. */
export const PREMIUM_ENTITLEMENT = "premium";

/** True when a Web Billing key has been configured. */
export function revenueCatConfigured(): boolean {
  return REVENUECAT_WEB_API_KEY.startsWith("rcb_");
}

let instance: Purchases | null = null;

/** Configures (once) the SDK for the given user id and returns the instance. */
export async function getPurchases(appUserId: string): Promise<Purchases> {
  const { Purchases: SDK } = await import("@revenuecat/purchases-js");
  if (!instance) {
    instance = SDK.configure({ apiKey: REVENUECAT_WEB_API_KEY, appUserId });
    return instance;
  }
  if (instance.getAppUserId() !== appUserId) {
    await instance.changeUser(appUserId);
  }
  return instance;
}

export type PlanId = "monthly" | "yearly" | "lifetime";

export type RemotePlan = {
  id: PlanId;
  price: string;
  pkg: Package;
};

/** Maps the current offering's packages onto PagoPilot's three plans. */
export function plansFromOffering(offering: Offering | null): RemotePlan[] {
  if (!offering) return [];
  const pairs: [PlanId, Package | null][] = [
    ["monthly", offering.monthly ?? null],
    ["yearly", offering.annual ?? null],
    ["lifetime", offering.lifetime ?? null],
  ];
  return pairs.flatMap(([id, pkg]) =>
    pkg ? [{ id, price: pkg.webBillingProduct.currentPrice.formattedPrice, pkg }] : [],
  );
}

/** Fetches the current offering's plans for a user. */
export async function fetchPlans(appUserId: string): Promise<RemotePlan[]> {
  const purchases = await getPurchases(appUserId);
  const offerings = await purchases.getOfferings();
  return plansFromOffering(offerings.current);
}

/** Opens the RevenueCat billing view and resolves once the purchase completes. */
export async function purchasePlan(
  appUserId: string,
  pkg: Package,
  customerEmail?: string,
): Promise<CustomerInfo> {
  const purchases = await getPurchases(appUserId);
  const result = await purchases.purchase({ rcPackage: pkg, customerEmail });
  return result.customerInfo;
}

/** Refreshes entitlements from RevenueCat (used by "restore purchases"). */
export async function fetchCustomerInfo(appUserId: string): Promise<CustomerInfo> {
  const purchases = await getPurchases(appUserId);
  return purchases.getCustomerInfo();
}

/** True when the premium entitlement is active. */
export function hasPremium(info: CustomerInfo): boolean {
  return Boolean(info.entitlements.active[PREMIUM_ENTITLEMENT]);
}
