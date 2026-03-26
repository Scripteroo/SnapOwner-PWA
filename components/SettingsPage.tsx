"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Download, Trash2, FileText, Shield, Star, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getCreditState } from "@/lib/credits";
import { getSavedProperties, SavedProperty } from "@/lib/storage";
import { useAppConfig } from "@/hooks/useAppConfig";

interface Props {
  onBack: () => void;
}

function formatMoney(val?: number | null) {
  if (!val) return "";
  return "$" + val.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function SettingsPage({ onBack }: Props) {
  const { config } = useAppConfig();
  const [credits, setCredits] = useState({ skipTrace: 0, lookupsUsed: 0, lookupsLimit: 0, unlimited: false });
  const [propertyCount, setPropertyCount] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getCreditState().then((s) => {
      setCredits({
        skipTrace: s.skipTraceCredits,
        lookupsUsed: s.freeLookupsUsed,
        lookupsLimit: s.freeLookupsLimit,
        unlimited: s.hasUnlimitedLookups,
      });
    });
    getSavedProperties().then((p) => setPropertyCount(p.length));
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const properties = await getSavedProperties();
      const headers = ["Address", "Owner", "Estimated Value", "Year Built", "Beds", "Baths", "Sq Ft", "Phone Numbers", "Emails", "Saved At"];
      const rows = properties.map((p) => {
        const phones = p.skipTraceData?.phones?.map((ph) => ph.number).join("; ") || "";
        const emails = p.skipTraceData?.emails?.map((e) => e.email).join("; ") || "";
        return [
          p.address,
          p.realieData?.ownerName || "",
          p.realieData?.modelValue ? String(p.realieData.modelValue) : "",
          p.realieData?.yearBuilt ? String(p.realieData.yearBuilt) : "",
          p.realieData?.totalBedrooms ? String(p.realieData.totalBedrooms) : "",
          p.realieData?.totalBathrooms ? String(p.realieData.totalBathrooms) : "",
          p.realieData?.buildingArea ? String(p.realieData.buildingArea) : "",
          phones,
          emails,
          p.savedAt,
        ].map((v) => `"${v.replace(/"/g, '""')}"`).join(",");
      });

      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `houselens-properties-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleClearAll = async () => {
    const req = indexedDB.deleteDatabase("houselens_db");
    req.onsuccess = () => {
      setPropertyCount(0);
      setCredits({ skipTrace: 0, lookupsUsed: 0, lookupsLimit: 10, unlimited: false });
      setShowClearConfirm(false);
    };
  };

  const modeLabel = config.mode === "free" ? "Free (Unlimited)" : config.mode === "paid" ? "Paid" : "Limited";

  return (
    <div className="min-h-screen bg-lens-bg pb-20">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-lens-border/50" style={{ paddingTop: "env(safe-area-inset-top, 12px)" }}>
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <button onClick={onBack} className="flex items-center gap-1 text-lens-accent" type="button">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[15px] font-medium">Home</span>
          </button>
          <h1 className="text-[17px] font-bold text-lens-text">Settings</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Account Section */}
        <div>
          <p className="text-[12px] font-semibold text-lens-secondary uppercase tracking-wider px-1 mb-2">Account</p>
          <div className="bg-lens-card rounded-2xl shadow-card overflow-hidden">
            <div className="px-4 py-3 flex justify-between items-center border-b border-lens-border/50">
              <span className="text-[14px] text-lens-text">App Mode</span>
              <span className="text-[13px] font-semibold text-lens-accent">{modeLabel}</span>
            </div>
            <div className="px-4 py-3 flex justify-between items-center border-b border-lens-border/50">
              <span className="text-[14px] text-lens-text">Property Lookups</span>
              <span className="text-[13px] font-medium text-lens-text">
                {credits.unlimited ? "Unlimited" : `${credits.lookupsUsed} / ${credits.lookupsLimit}`}
              </span>
            </div>
            <div className="px-4 py-3 flex justify-between items-center border-b border-lens-border/50">
              <span className="text-[14px] text-lens-text">Skip Trace Credits</span>
              <span className="text-[13px] font-medium text-lens-text">
                {config.mode === "free" ? "Unlimited" : credits.skipTrace}
              </span>
            </div>
            <div className="px-4 py-3 flex justify-between items-center">
              <span className="text-[14px] text-lens-text">Properties Saved</span>
              <span className="text-[13px] font-medium text-lens-text">{propertyCount}</span>
            </div>
          </div>
        </div>

        {/* Data Section */}
        <div>
          <p className="text-[12px] font-semibold text-lens-secondary uppercase tracking-wider px-1 mb-2">Data</p>
          <div className="bg-lens-card rounded-2xl shadow-card overflow-hidden">
            <button
              onClick={handleExportCSV}
              disabled={exporting || propertyCount === 0}
              className="w-full px-4 py-3.5 flex items-center justify-between border-b border-lens-border/50 active:bg-lens-bg transition-colors disabled:opacity-40"
              type="button"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-lens-accent" />
                <span className="text-[14px] font-medium text-lens-text">
                  {exporting ? "Exporting..." : "Export Properties as CSV"}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-lens-secondary" />
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={propertyCount === 0}
              className="w-full px-4 py-3.5 flex items-center justify-between active:bg-lens-bg transition-colors disabled:opacity-40"
              type="button"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-500" />
                <span className="text-[14px] font-medium text-red-600">Clear All Properties</span>
              </div>
              <ChevronRight className="w-4 h-4 text-lens-secondary" />
            </button>
          </div>
        </div>

        {/* About Section */}
        <div>
          <p className="text-[12px] font-semibold text-lens-secondary uppercase tracking-wider px-1 mb-2">About</p>
          <div className="bg-lens-card rounded-2xl shadow-card overflow-hidden">
            <div className="px-4 py-3 flex justify-between items-center border-b border-lens-border/50">
              <span className="text-[14px] text-lens-text">Version</span>
              <span className="text-[13px] font-medium text-lens-secondary">v1.0</span>
            </div>
            <Link href="/terms" className="w-full px-4 py-3.5 flex items-center justify-between border-b border-lens-border/50 active:bg-lens-bg transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-lens-secondary" />
                <span className="text-[14px] font-medium text-lens-text">Terms of Service</span>
              </div>
              <ChevronRight className="w-4 h-4 text-lens-secondary" />
            </Link>
            <Link href="/privacy" className="w-full px-4 py-3.5 flex items-center justify-between border-b border-lens-border/50 active:bg-lens-bg transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-lens-secondary" />
                <span className="text-[14px] font-medium text-lens-text">Privacy Policy</span>
              </div>
              <ChevronRight className="w-4 h-4 text-lens-secondary" />
            </Link>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: "Rate HouseLens", url: "https://houselens.io" }).catch(() => {});
                }
              }}
              className="w-full px-4 py-3.5 flex items-center justify-between active:bg-lens-bg transition-colors"
              type="button"
            >
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-amber-400" />
                <span className="text-[14px] font-medium text-lens-text">Rate HouseLens</span>
              </div>
              <ChevronRight className="w-4 h-4 text-lens-secondary" />
            </button>
          </div>
        </div>
      </div>

      {/* Clear confirmation dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6" onClick={() => setShowClearConfirm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[17px] font-bold text-lens-text mb-2">Clear All Data?</h3>
            <p className="text-[13px] text-lens-secondary mb-5">
              This will permanently delete all {propertyCount} saved {propertyCount === 1 ? "property" : "properties"} and reset your credits. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-lens-bg text-[14px] font-semibold text-lens-text active:scale-[0.97] transition-all"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-3 rounded-xl bg-red-500 text-[14px] font-semibold text-white active:scale-[0.97] transition-all"
                type="button"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
