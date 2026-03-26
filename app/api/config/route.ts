import { NextResponse } from "next/server";

export type AppMode = "free" | "limited" | "paid";

export interface AppConfig {
  mode: AppMode;
  freeLookupLimit: number;
  freeSkipTraceCredits: number;
  nagAfterLookups: number;
  forceShareAfterDismissals: number;
  skipCreditGates: boolean;
  skipLookupGates: boolean;
  showNagScreens: boolean;
  showShareGates: boolean;
}

const CONFIGS: Record<AppMode, AppConfig> = {
  free: {
    mode: "free",
    freeLookupLimit: 999999,
    freeSkipTraceCredits: 999999,
    nagAfterLookups: 999999,
    forceShareAfterDismissals: 999999,
    skipCreditGates: true,
    skipLookupGates: true,
    showNagScreens: false,
    showShareGates: false,
  },
  limited: {
    mode: "limited",
    freeLookupLimit: 10,
    freeSkipTraceCredits: 1,
    nagAfterLookups: 10,
    forceShareAfterDismissals: 2,
    skipCreditGates: false,
    skipLookupGates: false,
    showNagScreens: true,
    showShareGates: true,
  },
  paid: {
    mode: "paid",
    freeLookupLimit: 999999,
    freeSkipTraceCredits: 999999,
    nagAfterLookups: 999999,
    forceShareAfterDismissals: 999999,
    skipCreditGates: true,
    skipLookupGates: true,
    showNagScreens: false,
    showShareGates: false,
  },
};

export async function GET() {
  const mode = (process.env.HL_MODE || "free") as AppMode;
  const config = CONFIGS[mode] || CONFIGS.free;
  return NextResponse.json(config, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
