import {
  createContext,
  useContext,
} from "react";

import type { PremiumContextValue } from "./types";

const PremiumContext =
  createContext<PremiumContextValue | null>(null);

export function usePremium() {
  const context = useContext(PremiumContext);

  if (!context) {
    throw new Error(
      "PremiumProvider missing."
    );
  }

  return context;
}

export default PremiumContext;