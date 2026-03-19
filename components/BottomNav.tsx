"use client";

import { Home, Share2, Building2, Settings } from "lucide-react";

interface Props {
  active?: string;
  onTabChange?: (tab: string) => void;
  propertyCount?: number;
}

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "share", label: "Share", icon: Share2 },
  { id: "properties", label: "Properties", icon: Building2 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function BottomNav({ active = "home", onTabChange, propertyCount = 0 }: Props) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-t border-lens-border/50" style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              onClick={() => { if (navigator.vibrate) navigator.vibrate(8); onTabChange?.(id); }}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 active:scale-90 transition-transform duration-150 relative"
              type="button"
            >
              <div className="relative">
                {isActive && <div className="absolute -inset-1.5 bg-lens-accent/10 rounded-full" />}
                <Icon className={`relative w-[22px] h-[22px] transition-colors ${isActive ? "text-lens-accent" : "text-lens-secondary"}`} strokeWidth={isActive ? 2.2 : 1.8} />
                {id === "properties" && propertyCount > 0 && (
                  <div className="absolute -top-1.5 -right-2.5 w-[18px] h-[18px] rounded-full bg-lens-accent flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">{propertyCount > 99 ? "99+" : propertyCount}</span>
                  </div>
                )}
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-lens-accent" : "text-lens-secondary"}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}