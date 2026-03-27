import { Capacitor } from "@capacitor/core";

function getBaseUrl(): string {
  if (typeof window === "undefined") return "";

  // Native Capacitor app — point to deployed Vercel backend
  if (Capacitor.isNativePlatform()) {
    return "https://snapowner.com";
  }

  // Web: use relative URLs (same domain)
  return "";
}

export const BASE_URL = getBaseUrl();
