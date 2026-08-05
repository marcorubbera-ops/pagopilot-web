/**
 * Premium subscription plans supported by PagoPilot.
 */
export type PremiumPlan =
  | "monthly"
  | "yearly"
  | "lifetime";

/**
 * A purchasable plan.
 */
export interface PremiumPackage {
  id: PremiumPlan;

  title: string;

  price: string;

  description?: string;
}

/**
 * Premium status of the current user.
 */
export interface PremiumState {
  loading: boolean;

  initialized: boolean;

  isPremium: boolean;

  packages: PremiumPackage[];
}

/**
 * Operations exposed by the Premium module.
 */
export interface PremiumContextValue extends PremiumState {
  initialize(): Promise<void>;

  purchase(plan: PremiumPlan): Promise<boolean>;

  restore(): Promise<boolean>;

  refresh(): Promise<void>;
}