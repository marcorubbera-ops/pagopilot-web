/** Shared, platform-agnostic RevenueCat surface used by both the web and native implementations. */

export type PlanId = "monthly" | "yearly" | "lifetime";

export interface RemotePlan {
  id: PlanId;
  price: string;
}

/** Result of a purchase or a customer-info refresh: whether Premium is active now. */
export interface PurchaseOutcome {
  premium: boolean;
}

/** Entitlement identifier configured in the RevenueCat dashboard. */
export const PREMIUM_ENTITLEMENT = "premium";
