import { Capacitor } from "@capacitor/core";
import {
  Purchases,
  LOG_LEVEL,
  CustomerInfo,
} from "@revenuecat/purchases-capacitor";

export const PREMIUM_ENTITLEMENT = "premium";

const API_KEYS = {
  android: import.meta.env.VITE_RC_ANDROID_API_KEY,
  ios: import.meta.env.VITE_RC_IOS_API_KEY,
};

let initialized = false;

export async function initRevenueCat() {
  if (initialized) return;

  if (!Capacitor.isNativePlatform()) return;

  await Purchases.setLogLevel({
    level: LOG_LEVEL.DEBUG,
  });

  const apiKey =
    Capacitor.getPlatform() === "android"
      ? API_KEYS.android
      : API_KEYS.ios;

  if (!apiKey) {
    console.warn("RevenueCat API key missing.");
    return;
  }

  await Purchases.configure({
    apiKey,
  });

  initialized = true;

  console.log("RevenueCat initialized");
}

export function revenueCatConfigured() {
  return (
    !!API_KEYS.android ||
    !!API_KEYS.ios
  );
}

export async function fetchCustomerInfo(): Promise<CustomerInfo> {
  await initRevenueCat();

  const { customerInfo } =
    await Purchases.getCustomerInfo();

  return customerInfo;
}

export function hasPremium(
  customerInfo: CustomerInfo,
): boolean {
  return Boolean(
    customerInfo.entitlements.active[
      PREMIUM_ENTITLEMENT
    ],
  );
}