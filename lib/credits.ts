const DB_NAME = "houselens_db";
const CREDITS_STORE = "credits";
const DB_VERSION = 3;

function isDevMode(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem("hl_dev") === "1"; } catch { return false; }
}

let _remoteConfigCache: { skipCreditGates: boolean; skipLookupGates: boolean; ts: number } | null = null;

async function getRemoteFlags(): Promise<{ skipCreditGates: boolean; skipLookupGates: boolean }> {
  if (_remoteConfigCache && Date.now() - _remoteConfigCache.ts < 5 * 60 * 1000) {
    return _remoteConfigCache;
  }
  try {
    const res = await fetch("/api/config");
    const data = await res.json();
    _remoteConfigCache = { skipCreditGates: data.skipCreditGates, skipLookupGates: data.skipLookupGates, ts: Date.now() };
    return _remoteConfigCache;
  } catch {
    return { skipCreditGates: false, skipLookupGates: false };
  }
}

interface CreditState {
  id: string;
  freeLookupsUsed: number;
  freeLookupsLimit: number;
  skipTraceCredits: number;
  nagDismissals: number;
  hasSharedContacts: boolean;
  hasUnlimitedLookups: boolean;
  shareHistory: string[];
}

const DEFAULT_STATE: CreditState = {
  id: "user_credits",
  freeLookupsUsed: 0,
  freeLookupsLimit: 10,
  skipTraceCredits: 1, // 1 free skip trace to start
  nagDismissals: 0,
  hasSharedContacts: false,
  hasUnlimitedLookups: false,
  shareHistory: [],
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("properties")) {
        db.createObjectStore("properties", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(CREDITS_STORE)) {
        db.createObjectStore(CREDITS_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCreditState(): Promise<CreditState> {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(CREDITS_STORE, "readonly");
      const store = tx.objectStore(CREDITS_STORE);
      const request = store.get("user_credits");
      request.onsuccess = () => resolve(request.result || DEFAULT_STATE);
      request.onerror = () => resolve(DEFAULT_STATE);
    });
  } catch {
    return DEFAULT_STATE;
  }
}

export async function updateCreditState(updates: Partial<CreditState>): Promise<CreditState> {
  const current = await getCreditState();
  const updated = { ...current, ...updates, id: "user_credits" };
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(CREDITS_STORE, "readwrite");
    const store = tx.objectStore(CREDITS_STORE);
    store.put(updated);
    tx.oncomplete = () => resolve(updated);
  });
}

export async function incrementLookup(): Promise<{ allowed: boolean; count: number; needsNag: boolean; forceNag: boolean }> {
  if (isDevMode()) {
    return { allowed: true, count: 0, needsNag: false, forceNag: false };
  }
  const flags = await getRemoteFlags();
  if (flags.skipLookupGates) {
    return { allowed: true, count: 0, needsNag: false, forceNag: false };
  }

  const state = await getCreditState();

  if (state.hasUnlimitedLookups) {
    const updated = await updateCreditState({ freeLookupsUsed: state.freeLookupsUsed + 1 });
    return { allowed: true, count: updated.freeLookupsUsed, needsNag: false, forceNag: false };
  }

  const newCount = state.freeLookupsUsed + 1;

  if (newCount <= state.freeLookupsLimit) {
    await updateCreditState({ freeLookupsUsed: newCount });
    return { allowed: true, count: newCount, needsNag: false, forceNag: false };
  }

  // Over limit — check nag dismissals
  const dismissals = state.nagDismissals;
  if (dismissals < 2) {
    // Show dismissible nag
    return { allowed: false, count: newCount, needsNag: true, forceNag: false };
  }

  // 3rd+ time — force share
  return { allowed: false, count: newCount, needsNag: true, forceNag: true };
}

export async function dismissNag(): Promise<void> {
  const state = await getCreditState();
  await updateCreditState({ nagDismissals: state.nagDismissals + 1 });
}

export async function grantLookupsForShare(contactCount: number): Promise<number> {
  const state = await getCreditState();

  if (contactCount >= 10) {
    // Shared with contacts list — unlimited lookups
    await updateCreditState({
      hasUnlimitedLookups: true,
      hasSharedContacts: true,
      nagDismissals: 0,
    });
    return -1; // unlimited
  }

  if (contactCount >= 5) {
    // Shared with 5 friends — 10 more lookups
    const newLimit = state.freeLookupsLimit + 10;
    await updateCreditState({
      freeLookupsLimit: newLimit,
      nagDismissals: 0,
    });
    return 10;
  }

  return 0;
}

export async function useSkipTraceCredit(): Promise<boolean> {
  if (isDevMode()) return true;
  const flags = await getRemoteFlags();
  if (flags.skipCreditGates) return true;

  const state = await getCreditState();
  if (state.skipTraceCredits <= 0) return false;
  await updateCreditState({ skipTraceCredits: state.skipTraceCredits - 1 });
  return true;
}

export async function grantSkipTraceCredits(count: number): Promise<void> {
  const state = await getCreditState();
  await updateCreditState({ skipTraceCredits: state.skipTraceCredits + count });
}