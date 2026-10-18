import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useState, useEffect } from "react";

export interface PricingConfig {
  currency: string;
  driver: {
    mensuel: number;
  };
  seller: {
    mensuel: number;
    trimestriel: number;
    annuel: number;
  };
  workspace: {
    personnel: number;
    enterprise: number;
  };
  updatedAt?: unknown;
}

export const DEFAULT_PRICING: PricingConfig = {
  currency: "XOF",
  driver: {
    mensuel: 2500,
  },
  seller: {
    mensuel: 0,
    trimestriel: 13500,
    annuel: 50000,
  },
  workspace: {
    personnel: 5000,
    enterprise: 15000,
  },
};

/**
 * Fetches the official pricing configuration from Firestore path: config/pricing
 */
export async function fetchPricingConfig(): Promise<PricingConfig> {
  try {
    const snap = await getDoc(doc(db, "config", "pricing"));
    if (snap.exists()) {
      const data = snap.data();
      return {
        currency: (typeof data.currency === "string" && data.currency) || "XOF",
        driver: {
          mensuel: Number(data.driver?.mensuel ?? DEFAULT_PRICING.driver.mensuel),
        },
        seller: {
          mensuel: Number(data.seller?.mensuel ?? DEFAULT_PRICING.seller.mensuel),
          trimestriel: Number(data.seller?.trimestriel ?? DEFAULT_PRICING.seller.trimestriel),
          annuel: Number(data.seller?.annuel ?? DEFAULT_PRICING.seller.annuel),
        },
        workspace: {
          personnel: Number(data.workspace?.personnel ?? DEFAULT_PRICING.workspace.personnel),
          enterprise: Number(data.workspace?.enterprise ?? DEFAULT_PRICING.workspace.enterprise),
        },
        updatedAt: data.updatedAt,
      };
    }
  } catch (err) {
    console.warn("Could not read Firestore config/pricing document, falling back to defaults:", err);
  }
  return DEFAULT_PRICING;
}

/**
 * React hook to access live pricing from Firestore
 */
export function usePricing() {
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchPricingConfig().then((config) => {
      if (active) {
        setPricing(config);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { pricing, loading };
}
