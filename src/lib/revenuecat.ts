import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();

if (isNative) {
  throw new Error(
    "This file will be completed in the next step. Don't use it yet."
  );
}

export * from "./revenuecat-web";