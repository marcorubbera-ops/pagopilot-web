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
import {
  PREMIUM_ENTITLEMENT,
  type PlanId,
  type PurchaseOutcome,
  type RemotePlan,
} from "@/lib/revenuecat-types";

/** Web Billing public API key. Publishable — safe in client code. */
export const REVENUECAT_WEB_API_KEY = "rcb_sb_ZjpcLZXKdHLrEFTNZCtTgMZyq";

/** True when a Web Billing key has been configured. */
export function revenueCatConfigured(): boolean {
  return REVENUECAT_WEB_API_KEY.startsWith("rcb_");
}

let instance: Purchases | null = null;
/** Packages from the last fetchPlans() call, keyed by plan id, so purchasePlan() can look them up by id alone. */
let packageCache = new Map<PlanId, Package>();

/** Configures (once) the SDK for the given user id and returns the instance. */
async function getPurchases(appUserId: string): Promise<Purchases> {
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

function packagesFromOffering(offering: Offering | null): Map<PlanId, Package> {
  const map = new Map<PlanId, Package>();
  const pairs: [PlanId, Package | null][] = [
    ["monthly", offering?.monthly ?? null],
    ["yearly", offering?.annual ?? null],
    ["lifetime", offering?.lifetime ?? null],
  ];
  for (const [id, pkg] of pairs) if (pkg) map.set(id, pkg);
  return map;
}

function hasPremium(info: CustomerInfo): boolean {
  return Boolean(info.entitlements.active[PREMIUM_ENTITLEMENT]);
}

/** Fetches the current offering's plans for a user. */
export async function fetchPlans(appUserId: string): Promise<RemotePlan[]> {
  const purchases = await getPurchases(appUserId);
  const offerings = await purchases.getOfferings();
  packageCache = packagesFromOffering(offerings.current);
  return [...packageCache.entries()].map(([id, pkg]) => ({
    id,
    price: pkg.webBillingProduct.currentPrice.formattedPrice,
  }));
}

/** Purchases the given plan and reports whether Premium is now active. */
export async function purchasePlan(
  appUserId: string,
  planId: PlanId,
  customerEmail?: string,
): Promise<PurchaseOutcome> {
  const purchases = await getPurchases(appUserId);
  let pkg = packageCache.get(planId);
  if (!pkg) {
    const offerings = await purchases.getOfferings();
    packageCache = packagesFromOffering(offerings.current);
    pkg = packageCache.get(planId);
  }
  if (!pkg) throw new Error(`Plan not available: ${planId}`);
  const result = await purchases.purchase({ rcPackage: pkg, customerEmail });
  return { premium: hasPremium(result.customerInfo) };
}

/** Refreshes entitlements from RevenueCat (used by "restore purchases"). */
export async function fetchCustomerInfo(appUserId: string): Promise<PurchaseOutcome> {
  const purchases = await getPurchases(appUserId);
  const info = await purchases.getCustomerInfo();
  return { premium: hasPremium(info) };
}
