import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import PremiumContext from "./PremiumContext";
import type {
  PremiumContextValue,
  PremiumPackage,
  PremiumPlan,
} from "./types";

import { RevenueCatService } from "@/core/services/RevenueCatService";

export function PremiumProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const [isPremium, setIsPremium] = useState(false);

  const [packages, setPackages] =
    useState<PremiumPackage[]>([]);

  const initialize = useCallback(async () => {
    if (initialized) return;

    await RevenueCatService.initialize();

    setInitialized(true);
    setLoading(false);
  }, [initialized]);

  const purchase = useCallback(
    async (plan: PremiumPlan) => {
      console.log("Purchase requested:", plan);

      return false;
    },
    [],
  );

  const restore = useCallback(async () => {
    console.log("Restore requested");

    return false;
  }, []);

  const refresh = useCallback(async () => {
    console.log("Refresh requested");
  }, []);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const value: PremiumContextValue = {
    loading,
    initialized,

    isPremium,
    packages,

    initialize,
    purchase,
    restore,
    refresh,
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
}