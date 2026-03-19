"use client";

import { useState, useEffect } from "react";
import { getSavedProperties, deleteProperty, SavedProperty } from "@/lib/storage";
import { MapPin, Trash2, ChevronLeft, Camera, X } from "lucide-react";

interface Props {
  onBack: () => void;
  onSelectProperty: (property: SavedProperty) => void;
}

export default function PropertiesList({ onBack, onSelectProperty }: Props) {
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [viewing, setViewing] = useState<SavedProperty | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSavedProperties().then((p) => { setProperties(p); setLoading(false); });
  }, []);

  const handleDelete = async (id: string) => {
    if (navigator.vibrate) navigator.vibrate(10);
    await deleteProperty(id);
    const updated = await getSavedProperties();
    setProperties(updated);
  };

  return (
    <div className="min-h-screen bg-lens-bg pb-20">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-lens-border/50" style={{ paddingTop: "env(safe-area-inset-top, 12px)" }}>
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <button onClick={onBack} className="flex items-center gap-1 text-lens-accent" type="button">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[15px] font-medium">Home</span>
          </button>
          <h1 className="text-[17px] font-bold text-lens-text">My Properties</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        {loading ? (
          <div className="text-center py-16">
            <p className="text-lens-secondary text-sm">Loading…</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-lens-accent/10 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-7 h-7 text-lens-accent/50" />
            </div>
            <p className="text-[17px] font-semibold text-lens-text mb-1">No properties saved</p>
            <p className="text-[13px] text-lens-secondary">Capture a property and tap Save to add it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[12px] font-semibold text-lens-secondary uppercase tracking-wider px-1">
              {properties.length} saved {properties.length === 1 ? "property" : "properties"}
            </p>
            {properties.map((prop) => (
              <div key={prop.id} className="bg-lens-card rounded-2xl shadow-card overflow-hidden active:scale-[0.98] transition-transform">
                <div className="flex">
                  <div onClick={() => setViewing(prop)} className="w-24 h-24 flex-shrink-0 bg-slate-200 cursor-pointer">
                    {(prop.thumbnailUrl || prop.photoUrl) ? (
                      <img src={prop.thumbnailUrl || prop.photoUrl!} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white/60" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-between min-w-0 cursor-pointer" onClick={() => setViewing(prop)}>
                    <div>
                      <p className="text-[14px] font-semibold text-lens-text leading-tight line-clamp-2">{prop.address}</p>
                      {prop.latitude && (
                        <p className="text-[11px] text-lens-secondary mt-1">{prop.latitude.toFixed(4)}° N, {Math.abs(prop.longitude || 0).toFixed(4)}° W</p>
                      )}
                    </div>
                    <p className="text-[10px] text-lens-secondary">
                      {new Date(prop.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center pr-3">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(prop.id); }} className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center active:scale-90 transition-transform" type="button">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewing && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col" onClick={() => setViewing(null)}>
          <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,12px)] pb-2">
            <button onClick={() => setViewing(null)} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center" type="button">
              <X className="w-5 h-5 text-white" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onSelectProperty(viewing); }} className="px-4 py-2 rounded-full bg-lens-accent text-white text-[13px] font-semibold" type="button">
              Load Property
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {viewing.photoUrl ? (
              <img src={viewing.photoUrl} alt="" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center">
                <Camera className="w-16 h-16 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No photo captured</p>
              </div>
            )}
          </div>
          <div className="bg-black/80 backdrop-blur-xl px-5 py-4" style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
            <p className="text-white font-semibold text-[15px]">{viewing.address}</p>
            <p className="text-white/50 text-[12px] mt-1">
              {new Date(viewing.savedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}