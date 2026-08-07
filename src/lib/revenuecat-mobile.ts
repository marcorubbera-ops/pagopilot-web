/**
 * RevenueCat native (Capacitor / Play Billing & App Store) integration.
 *
 * Mirrors the function surface of revenuecat-web.ts so revenuecat.ts can
 * dispatch to either transparently.
 */
import { Capacitor } from "@capacitor/core";
import {
  LOG_LEVEL,
  Purchases,
  type CustomerInfo,
  type PurchasesPackage,
} from "@revenuecat/purchases-capacitor";
import {
  PREMIUM_ENTITLEMENT,
  type PlanId,
  type PurchaseOutcome,
  type RemotePlan,
} from "@/lib/revenuecat-types";

const API_KEYS = {
  android: import.meta.env.VITE_RC_ANDROID_API_KEY as string | undefined,
  ios: import.meta.env.VITE_RC_IOS_API_KEY as string | undefined,
};

/** True when this platform has a RevenueCat API key configured. */
export function revenueCatConfigured(): boolean {
  const platform = Capacitor.getPlatform();
  if (platform === "android") return !!API_KEYS.android;
  if (platform === "ios") return !!API_KEYS.ios;
  return false;
}

let configuredUserId: string | null = null;
/** Packages from the last fetchPlans() call, keyed by plan id, so purchasePlan() can look them up by id alone. */
let packageCache = new Map<PlanId, PurchasesPackage>();

/** Configures the SDK (once) and makes sure it's identified as appUserId. */
async function ensureReady(appUserId: string): Promise<void> {
  if (!revenueCatConfigured()) throw new Error("RevenueCat is not configured for this platform.");

  if (configuredUserId === null) {
    const apiKey = Capacitor.getPlatform() === "android" ? API_KEYS.android! : API_KEYS.ios!;
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    await Purchases.configure({ apiKey, appUserID: appUserId });
    configuredUserId = appUserId;
    return;
  }

  if (configuredUserId !== appUserId) {
    await Purchases.logIn({ appUserID: appUserId });
    configuredUserId = appUserId;
  }
}

function packagesFromOffering(
  offering: {
    monthly: PurchasesPackage | null;
    annual: PurchasesPackage | null;
    lifetime: PurchasesPackage | null;
  } | null,
): Map<PlanId, PurchasesPackage> {
  const map = new Map<PlanId, PurchasesPackage>();
  const pairs: [PlanId, PurchasesPackage | null][] = [
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
  await ensureReady(appUserId);
  const { current } = await Purchases.getOfferings();
  packageCache = packagesFromOffering(current);
  return [...packageCache.entries()].map(([id, pkg]) => ({
    id,
    price: pkg.product.priceString,
  }));
}

/** Purchases the given plan and reports whether Premium is now active. */
export async function purchasePlan(
  appUserId: string,
  planId: PlanId,
  // Native billing has no equivalent slot for this — accepted only so the
  // signature matches revenuecat-web.ts, which revenuecat.ts dispatches to.
  _customerEmail?: string,
): Promise<PurchaseOutcome> {
  await ensureReady(appUserId);
  let pkg = packageCache.get(planId);
  if (!pkg) {
    const { current } = await Purchases.getOfferings();
    packageCache = packagesFromOffering(current);
    pkg = packageCache.get(planId);
  }
  if (!pkg) throw new Error(`Plan not available: ${planId}`);
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
  return { premium: hasPremium(customerInfo) };
}

/** Refreshes entitlements from RevenueCat (used by "restore purchases"). */
export async function fetchCustomerInfo(appUserId: string): Promise<PurchaseOutcome> {
  await ensureReady(appUserId);
  const { customerInfo } = await Purchases.getCustomerInfo();
  return { premium: hasPremium(customerInfo) };
}
