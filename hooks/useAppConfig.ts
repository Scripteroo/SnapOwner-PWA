"use client";

import { useState, useEffect } from "react";
import type { AppConfig } from "@/app/api/config/route";

const CACHE_KEY = "hl_app_config";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const DEFAULT_CONFIG: AppConfig = {
  mode: "free",
  freeLookupLimit: 999999,
  freeSkipTraceCredits: 999999,
  nagAfterLookups: 999999,
  forceShareAfterDismissals: 999999,
  skipCreditGates: true,
  skipLookupGates: true,
  showNagScreens: false,
  showShareGates: false,
};

interface CachedConfig {
  config: AppConfig;
  ts: number;
}

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check cache first
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached: CachedConfig = JSON.parse(raw);
        if (Date.now() - cached.ts < CACHE_TTL) {
          setConfig(cached.config);
          setLoading(false);
          return;
        }
      }
    } catch {}

    // Fetch fresh config
    fetch("/api/config")
      .then((r) => r.json())
      .then((data: AppConfig) => {
        setConfig(data);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ config: data, ts: Date.now() })
        );
      })
      .catch(() => {
        // Keep default on failure
      })
      .finally(() => setLoading(false));
  }, []);

  return { config, loading, isFree: config.mode === "free" };
}
