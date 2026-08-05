import { Capacitor } from "@capacitor/core";

import * as Web from "@/lib/revenuecat-web";
import * as Mobile from "@/lib/revenuecat-mobile";

import type {
  CustomerInfo,
  Package,
} from "@revenuecat/purchases-js";

export class RevenueCatService {
  static isNative() {
    return Capacitor.isNativePlatform();
  }

  static async initialize() {
    if (!this.isNative()) {
      return;
    }

    await Mobile.initRevenueCat();
  }

  static configured() {
    if (this.isNative()) {
      return true;
    }

    return Web.revenueCatConfigured();
  }

  static async getPlans(userId: string) {
    if (this.isNative()) {
      // We'll implement native offerings next.
      return [];
    }

    return Web.fetchPlans(userId);
  }

  static async purchase(
    userId: string,
    pkg: Package,
    email?: string,
  ): Promise<CustomerInfo> {
    if (this.isNative()) {
      throw new Error(
        "Native purchases not implemented yet.",
      );
    }

    return Web.purchasePlan(
      userId,
      pkg,
      email,
    );
  }

  static async restore(userId: string) {
    if (this.isNative()) {
      throw new Error(
        "Native restore not implemented yet.",
      );
    }

    return Web.fetchCustomerInfo(userId);
  }

  static hasPremium(info: CustomerInfo) {
    return Web.hasPremium(info);
  }
}