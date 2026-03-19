export interface SavedProperty {
    id: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    photoUrl: string | null;
    thumbnailUrl: string | null;
    savedAt: string;
  }
  
  const STORAGE_KEY = "houselens_properties";
  
  export function getSavedProperties(): SavedProperty[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
  
  export function saveProperty(property: Omit<SavedProperty, "id" | "savedAt">): SavedProperty {
    const saved: SavedProperty = {
      ...property,
      id: `prop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      savedAt: new Date().toISOString(),
    };
    const all = getSavedProperties();
    all.unshift(saved);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      // If storage is full, try without the full photo (keep thumbnail)
      console.warn("Storage full, saving without full photo:", e);
      saved.photoUrl = null;
      const retry = [saved, ...all.slice(1)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(retry));
    }
    return saved;
  }
  
  export function deleteProperty(id: string) {
    const all = getSavedProperties().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
  
  export function getPropertyCount(): number {
    return getSavedProperties().length;
  }