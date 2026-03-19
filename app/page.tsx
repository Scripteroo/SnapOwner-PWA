"use client";

import { useState, useCallback, useEffect } from "react";
import { Pencil, TrendingUp, Receipt, Landmark, HardHat, Loader2, CheckCircle2, Download } from "lucide-react";
import PropertyHero from "@/components/PropertyHero";
import LensLogo from "@/components/LensLogo";
import InfoCard from "@/components/InfoCard";
import OwnerCard from "@/components/OwnerCard";
import AccordionSection from "@/components/AccordionSection";
import BottomNav from "@/components/BottomNav";
import AddressEditor from "@/components/AddressEditor";
import SideMenu from "@/components/SideMenu";
import PropertiesList from "@/components/PropertiesList";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useCamera } from "@/hooks/useCamera";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { saveProperty as saveToLocal, getPropertyCount, SavedProperty } from "@/lib/storage";
import { MOCK_SALES_HISTORY, MOCK_TAX_HISTORY, MOCK_LIENS, MOCK_PERMITS } from "@/lib/mock-data";

export default function HomePage() {
  const geo = useGeolocation();
  const camera = useCamera();

  const [manualAddress, setManualAddress] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [propertyCount, setPropertyCount] = useState(0);

  const displayAddress = manualAddress
    ? manualAddress
    : geo.address && !geo.loading
    ? geo.address
    : "Detecting address…";

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    setPropertyCount(getPropertyCount());
  }, []);

  useEffect(() => {
    if (camera.photoUrl) showToast("Photo captured!");
  }, [camera.photoUrl]);

  const handleAddressSave = (newAddress: string) => {
    setManualAddress(newAddress);
    if (navigator.vibrate) navigator.vibrate(10);
    showToast("Address updated!");
  };

  const handleSelectProperty = (prop: SavedProperty) => {
    setManualAddress(prop.address);
    if (prop.photoUrl) camera.setPhotoUrl(prop.photoUrl);
    setActiveTab("home");
    showToast("Property loaded!");
  };

  const handleNewSearch = () => {
    setManualAddress(null);
    camera.setPhotoUrl(null);
    geo.requestLocation();
    showToast("Ready for new property!");
  };

  const saveToDevice = useCallback(async () => {
    if (navigator.vibrate) navigator.vibrate(10);

    if (navigator.share) {
      try {
        const text = `HouseLens Property\n\n📍 ${displayAddress}\n📐 ${geo.latitude?.toFixed(4)}° N, ${Math.abs(geo.longitude || 0).toFixed(4)}° W\n\n💰 Sales History:\n${MOCK_SALES_HISTORY.map(s => `  ${s.date} — ${s.price} (${s.buyer})`).join("\n")}\n\n🏛 Tax History:\n${MOCK_TAX_HISTORY.map(t => `  ${t.year} — Assessed: ${t.assessed}, Tax: ${t.tax}`).join("\n")}`;

        const shareData: ShareData = { title: `Property: ${displayAddress}`, text };

        if (camera.photoUrl) {
          try {
            const res = await fetch(camera.photoUrl);
            const blob = await res.blob();
            const file = new File([blob], "property.jpg", { type: "image/jpeg" });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          } catch {}
        }

        await navigator.share(shareData);
        showToast("Shared!");
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }

    const text = `HouseLens Property Report\n\nAddress: ${displayAddress}\nCoordinates: ${geo.latitude?.toFixed(4)}° N, ${Math.abs(geo.longitude || 0).toFixed(4)}° W\nSaved: ${new Date().toLocaleString()}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `property-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Report downloaded!");
  }, [displayAddress, geo.latitude, geo.longitude, camera.photoUrl]);

  const savePropertyAction = useCallback(async () => {
    if (navigator.vibrate) navigator.vibrate(15);
    setSaving(true);
    try {
      // Save to localStorage (always works)
      saveToLocal({
        address: displayAddress,
        latitude: geo.latitude,
        longitude: geo.longitude,
        photoUrl: camera.photoUrl,
      });
      setPropertyCount(getPropertyCount());

      // Also save to Supabase if configured
      if (isSupabaseConfigured) {
        const { data: authData } = await supabase.auth.getSession();
        if (!authData.session) {
          await supabase.auth.signInAnonymously();
        }
        await supabase.from("properties").insert({
          address: displayAddress,
          latitude: geo.latitude || 24.5551,
          longitude: geo.longitude || -81.7800,
          photo_url: camera.photoUrl || null,
        });
      }

      setSaved(true);
      if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
      showToast("Property saved!");
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Save failed:", err);
      setSaved(true);
      showToast("Property saved!");
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }, [displayAddress, geo.latitude, geo.longitude, camera.photoUrl]);

  const handleTabChange = (tab: string) => {
    if (tab === "share") {
      saveToDevice();
      return;
    }
    setActiveTab(tab);
  };

  // Properties view
  if (activeTab === "properties") {
    return (
      <>
        <PropertiesList onBack={() => setActiveTab("home")} onSelectProperty={handleSelectProperty} />
        <BottomNav active="properties" onTabChange={handleTabChange} propertyCount={propertyCount} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-lens-bg pb-24">
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Toast */}
      <div className={`fixed top-12 inset-x-0 z-[100] flex justify-center transition-all duration-500 pointer-events-none ${toast ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="bg-lens-text/90 backdrop-blur-lg text-white text-[13px] font-semibold px-5 py-2.5 rounded-full shadow-elevated flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-lens-green" />
          {toast}
        </div>
      </div>

      {/* Hidden native camera input */}
      <input
        ref={camera.inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={camera.handleFileChange}
        className="hidden"
      />

      <PropertyHero
        photoUrl={camera.photoUrl}
        onOpenCamera={camera.openCamera}
        onMenuToggle={() => setMenuOpen(true)}
      />

      <LensLogo onTap={camera.openCamera} />

      <div className="px-4 mt-4 space-y-3 max-w-lg mx-auto">
        {/* Address Card */}
        <div className="animate-slide-up delay-1">
          <InfoCard
            label="Address"
            icon={<Pencil className="w-4 h-4 text-lens-secondary" />}
            onIconClick={() => setEditingAddress(true)}
            tappable
          >
            <p>
              {geo.loading && !manualAddress ? (
                <span className="flex items-center gap-2 text-lens-secondary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Detecting location…
                </span>
              ) : (
                displayAddress
              )}
            </p>
            {geo.latitude && (
  <p className="text-[11px] text-lens-secondary mt-1">
    {geo.latitude.toFixed(6)}° N, {Math.abs(geo.longitude!).toFixed(6)}° W
    {geo.accuracy && <span className="ml-1.5 text-lens-accent/60">±{Math.round(geo.accuracy)}m</span>}
  </p>
)}
          </InfoCard>
        </div>

        {/* Owner Card with Paywall */}
        <div className="animate-slide-up delay-2">
          <OwnerCard />
        </div>

        {/* Action Buttons */}
        <div className="animate-slide-up delay-3 flex gap-3">
          <button
            onClick={savePropertyAction}
            disabled={saving}
            className={`flex-1 py-3.5 rounded-2xl text-[15px] font-semibold transition-all duration-300 active:scale-[0.97] disabled:opacity-70 ${
              saved
                ? "bg-lens-green text-white shadow-[0_0_20px_rgba(52,199,89,0.3)]"
                : "bg-lens-accent text-white shadow-card"
            }`}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />Saving…
              </span>
            ) : saved ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />Saved
              </span>
            ) : (
              "Save Property"
            )}
          </button>
          <button
            onClick={saveToDevice}
            className="w-14 h-[52px] rounded-2xl bg-lens-card shadow-card border border-lens-border flex items-center justify-center active:scale-95 transition-transform"
            type="button"
          >
            <Download className="w-5 h-5 text-lens-accent" />
          </button>
        </div>

        {/* Sales History */}
        <div className="animate-slide-up delay-4">
          <AccordionSection title="Sales History" icon={<TrendingUp className="w-4 h-4" />} badge={`${MOCK_SALES_HISTORY.length}`}>
            <div className="space-y-3">
              {MOCK_SALES_HISTORY.map((sale, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-lens-border last:border-0">
                  <div>
                    <p className="text-[13px] font-medium text-lens-text">{sale.buyer}</p>
                    <p className="text-[11px] text-lens-secondary">{sale.date}</p>
                  </div>
                  <p className="text-[14px] font-semibold text-lens-text">{sale.price}</p>
                </div>
              ))}
            </div>
          </AccordionSection>
        </div>

        {/* Tax History */}
        <div className="animate-slide-up delay-5">
          <AccordionSection title="Tax History" icon={<Receipt className="w-4 h-4" />}>
            <div className="space-y-3">
              {MOCK_TAX_HISTORY.map((tax, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-lens-border last:border-0">
                  <div>
                    <p className="text-[13px] font-medium text-lens-text">{tax.year}</p>
                    <p className="text-[11px] text-lens-secondary">Assessed: {tax.assessed}</p>
                  </div>
                  <p className="text-[14px] font-semibold text-lens-text">{tax.tax}</p>
                </div>
              ))}
            </div>
          </AccordionSection>
        </div>

        {/* Liens & Mortgages */}
        <div className="animate-slide-up delay-5">
          <AccordionSection title="Liens & Mortgages" icon={<Landmark className="w-4 h-4" />} badge={`${MOCK_LIENS.length}`}>
            <div className="space-y-3">
              {MOCK_LIENS.map((lien, i) => (
                <div key={i} className="py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-lens-text">{lien.type}</p>
                    <p className="text-[14px] font-semibold text-lens-text">{lien.amount}</p>
                  </div>
                  <p className="text-[11px] text-lens-secondary mt-0.5">{lien.lender} · {lien.date}</p>
                </div>
              ))}
            </div>
          </AccordionSection>
        </div>

        {/* Building Permits */}
        <div className="animate-slide-up delay-6">
          <AccordionSection title="Building Permits" icon={<HardHat className="w-4 h-4" />} badge={`${MOCK_PERMITS.length}`}>
            <div className="space-y-3">
              {MOCK_PERMITS.map((permit, i) => (
                <div key={i} className="py-2 border-b border-lens-border last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-lens-text">{permit.type}</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      permit.status === "Completed" ? "bg-lens-green/10 text-lens-green" : "bg-yellow-100 text-yellow-700"
                    }`}>{permit.status}</span>
                  </div>
                  <p className="text-[11px] text-lens-secondary mt-0.5">{permit.number} · {permit.date}</p>
                </div>
              ))}
            </div>
          </AccordionSection>
        </div>
      </div>

      <AddressEditor
        address={displayAddress}
        open={editingAddress}
        onClose={() => setEditingAddress(false)}
        onSave={handleAddressSave}
      />

      <BottomNav active="home" onTabChange={handleTabChange} propertyCount={propertyCount} />
    </div>
  );
}