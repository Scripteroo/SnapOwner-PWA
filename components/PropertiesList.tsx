"use client";

import { useState, useEffect } from "react";
import { getSavedProperties, deleteProperty, SavedProperty } from "@/lib/storage";
import { MapPin, Trash2, ChevronLeft, Camera } from "lucide-react";

interface Props {
  onBack: () => void;
  onSelectProperty: (property: SavedProperty) => void;
}

export default function PropertiesList({ onBack, onSelectProperty }: Props) {
  const [properties, setProperties] = useState<SavedProperty[]>([]);
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
            <div className="w-20 h-20 rounded-full bg-lens-accent/10 flex items-center justify-center mx-auto mb-5">
              <Camera className="w-9 h-9 text-lens-accent/50" />
            </div>
            <p className="text-[19px] font-bold text-lens-text mb-2">No Properties Yet</p>
            <p className="text-[14px] text-lens-secondary leading-relaxed max-w-[280px] mx-auto mb-6">
              Walk up to any house, snap a photo, and start building your property collection.
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-2xl bg-lens-accent text-white text-[15px] font-semibold active:scale-[0.97] transition-all shadow-lg"
              type="button"
            >
              Scan Your First Property
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[12px] font-semibold text-lens-secondary uppercase tracking-wider px-1">
              {properties.length} saved {properties.length === 1 ? "property" : "properties"}
            </p>
            {properties.map((prop) => (
              <div key={prop.id} className="bg-lens-card rounded-2xl shadow-card overflow-hidden active:scale-[0.98] transition-transform">
                <div className="flex" onClick={() => onSelectProperty(prop)}>
                  <div className="w-24 h-24 flex-shrink-0 bg-slate-200 cursor-pointer">
                    {(prop.thumbnailUrl || prop.photoUrl) ? (
                      <img src={prop.thumbnailUrl || prop.photoUrl!} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white/60" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-between min-w-0 cursor-pointer">
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

    </div>
  );
}