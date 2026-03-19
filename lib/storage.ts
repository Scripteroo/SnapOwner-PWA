export interface SavedProperty {
    id: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    photoUrl: string | null;
    thumbnailUrl: string | null;
    savedAt: string;
  }
  
  const DB_NAME = "houselens_db";
  const STORE_NAME = "properties";
  const DB_VERSION = 1;
  
  function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  export async function getSavedProperties(): Promise<SavedProperty[]> {
    if (typeof window === "undefined") return [];
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
          const results = request.result as SavedProperty[];
          results.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
          resolve(results);
        };
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }
  
  export async function saveProperty(property: Omit<SavedProperty, "id" | "savedAt">): Promise<SavedProperty> {
    const saved: SavedProperty = {
      ...property,
      id: `prop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      savedAt: new Date().toISOString(),
    };
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(saved);
      request.onsuccess = () => resolve(saved);
      request.onerror = () => reject(request.error);
    });
  }
  
  export async function deleteProperty(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
    });
  }
  
  export async function getPropertyCount(): Promise<number> {
    const props = await getSavedProperties();
    return props.length;
  }