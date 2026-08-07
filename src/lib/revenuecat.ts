/**
 * Dispatches to the native (Capacitor) or web RevenueCat implementation
 * depending on platform. Both modules implement the same function surface.
 */
import { Capacitor } from "@capacitor/core";
import * as Mobile from "@/lib/revenuecat-mobile";
import * as Web from "@/lib/revenuecat-web";

export type { PlanId, RemotePlan, PurchaseOutcome } from "@/lib/revenuecat-types";

const impl = Capacitor.isNativePlatform() ? Mobile : Web;

export const revenueCatConfigured = impl.revenueCatConfigured;
export const fetchPlans = impl.fetchPlans;
export const purchasePlan = impl.purchasePlan;
export const fetchCustomerInfo = impl.fetchCustomerInfo;
