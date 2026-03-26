"use client";

import { useState, useCallback, useEffect } from "react";
import { Pencil, TrendingUp, Receipt, Landmark, HardHat, Loader2, CheckCircle2, Download, ExternalLink, AlertTriangle } from "lucide-react";
import { SkipTraceResult } from "@/lib/skiptrace";
import PropertyHero from "@/components/PropertyHero";
import LensLogo from "@/components/LensLogo";
import InfoCard from "@/components/InfoCard";
import OwnerCard from "@/components/OwnerCard";
import AccordionSection from "@/components/AccordionSection";
import BottomNav from "@/components/BottomNav";
import AddressEditor from "@/components/AddressEditor";
import SideMenu from "@/components/SideMenu";
import PropertiesList from "@/components/PropertiesList";
import SettingsPage from "@/components/SettingsPage";
import NagScreen from "@/components/NagScreen";
import OnboardingScreen from "@/components/OnboardingScreen";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useCamera } from "@/hooks/useCamera";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { saveProperty as saveToLocal, getPropertyCount, SavedProperty } from "@/lib/storage";
import { RealieProperty } from "@/lib/realie";
import { incrementLookup, dismissNag, grantLookupsForShare, getCreditState, updateCreditState } from "@/lib/credits";
import { MOCK_PERMITS } from "@/lib/mock-data";
import PropertyEnrichment from "@/components/PropertyEnrichment";

function formatMoney(val?: number | null) {
  if (!val) return "—";
  return "$" + val.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatDate(val?: string | null) {
  if (!val) return "—";
  const d = val.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return val; }
}

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
  const [realieData, setRealieData] = useState<RealieProperty | null>(null);
  const [showNag, setShowNag] = useState(false);
  const [nagCanDismiss, setNagCanDismiss] = useState(true);
  const [lookupCount, setLookupCount] = useState(0);
  const [lookupBlocked, setLookupBlocked] = useState(false);
  const [shouldLookup, setShouldLookup] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [skipTraceData, setSkipTraceData] = useState<SkipTraceResult | null>(null);
  const [propertyComplete, setPropertyComplete] = useState(false);
  const [loadedFromLibrary, setLoadedFromLibrary] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Detect if running as installed PWA + onboarding check
  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    setIsPWA(isStandalone);
    if (localStorage.getItem("hl_onboarded") !== "1") {
      setShowOnboarding(true);
    }
  }, []);

  const handleRequestInstall = useCallback(() => {
    setShowInstallPrompt(true);
    if (navigator.vibrate) navigator.vibrate(10);
  }, []);

  const displayAddress = manualAddress
    ? manualAddress
    : geo.address && !geo.loading
    ? geo.address
    : "Detecting address…";

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => { getPropertyCount().then(setPropertyCount); }, []);
  useEffect(() => { getCreditState().then((s) => setLookupCount(s.freeLookupsUsed)); }, []);

 // Trigger lookup when photo is captured (US only)
 useEffect(() => {
  if (camera.photoUrl && !realieData && !lookupBlocked) {
    if (geo.isUSA) {
      setShouldLookup(true);
      showToast("Photo captured! Looking up property…");
    } else {
      showToast("Photo captured!");
    }
  }
}, [camera.photoUrl]);

// Auto-save when Realie data loads after a photo capture
useEffect(() => {
  if (realieData && camera.photoUrl && !saved && !loadedFromLibrary) {
    savePropertyAction();
  }
}, [realieData]);

  const handleLookupStarted = useCallback(async () => {
    const result = await incrementLookup();
    setLookupCount(result.count);
    if (!result.allowed) {
      setShowNag(true);
      setNagCanDismiss(!result.forceNag);
      setLookupBlocked(true);
      setShouldLookup(false);
    }
  }, []);

  const handleNagDismiss = useCallback(async () => {
    await dismissNag();
    setShowNag(false);
    setLookupBlocked(false);
    const state = await getCreditState();
    await updateCreditState({ freeLookupsUsed: state.freeLookupsUsed + 1, freeLookupsLimit: state.freeLookupsLimit + 1 });
    setShouldLookup(true);
  }, []);

  const handleShare5 = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "HouseLens — Free Property Intelligence",
          text: `I just looked up a property on HouseLens and found out it's worth ${realieData?.modelValue ? formatMoney(realieData.modelValue) : "thousands"}! Try it free.`,
          url: "https://houselens.io",
        });
        await grantLookupsForShare(5);
        setShowNag(false);
        setLookupBlocked(false);
        setShouldLookup(true);
        showToast("+10 free lookups!");
      } catch (e) { if ((e as Error).name !== "AbortError") showToast("Share to unlock"); }
    }
  }, [realieData]);

  const handleShareContacts = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "HouseLens — Free Property Intelligence",
          text: "Look up any property and instantly see owner info, tax records, valuations, and more. Try HouseLens free!",
          url: "https://houselens.io",
        });
        await grantLookupsForShare(10);
        setShowNag(false);
        setLookupBlocked(false);
        setShouldLookup(true);
        showToast("Unlimited lookups unlocked!");
      } catch (e) { if ((e as Error).name !== "AbortError") showToast("Share to unlock"); }
    }
  }, []);

  const handleGoPro = useCallback(() => {
    showToast("Pro subscriptions coming soon!");
    setShowNag(false);
  }, []);

  const handleAddressSave = (newAddress: string) => {
    setManualAddress(newAddress);
    setRealieData(null);
    setShouldLookup(false);
    if (navigator.vibrate) navigator.vibrate(10);
    showToast("Address updated!");
  };

  const handleSelectProperty = (prop: SavedProperty) => {
    setManualAddress(prop.address);
    if (prop.photoUrl) camera.setPhotoUrl(prop.photoUrl);
    if (prop.thumbnailUrl) camera.setThumbnailUrl(prop.thumbnailUrl);
    setRealieData(prop.realieData || null);
    setSkipTraceData(prop.skipTraceData || null);
    setShouldLookup(false);
    setLoadedFromLibrary(true);
    setPropertyComplete(false);
    setActiveTab("home");
    showToast("Property loaded!");
  };

  const handleNewSearch = () => {
    setManualAddress(null);
    camera.setPhotoUrl(null);
    camera.setThumbnailUrl(null);
    setRealieData(null);
    setSkipTraceData(null);
    setShouldLookup(false);
    setLookupBlocked(false);
    setSaved(false);
    setPropertyComplete(false);
    setLoadedFromLibrary(false);
    geo.requestLocation();
    showToast("Ready for new property!");
  };

  const saveToDevice = useCallback(async () => {
    if (navigator.vibrate) navigator.vibrate(10);
    if (navigator.share) {
      try {
        const text = `HouseLens Property\n\n📍 ${displayAddress}${realieData ? `\n\n👤 Owner: ${realieData.ownerName || "Unknown"}\n💰 Estimated Value: ${formatMoney(realieData.modelValue)}\n🏠 ${realieData.totalBedrooms || "?"}bd / ${realieData.totalBathrooms || "?"}ba · ${realieData.buildingArea?.toLocaleString() || "?"} sqft\n📅 Year Built: ${realieData.yearBuilt || "?"}\n💵 Last Sale: ${formatMoney(realieData.transferPrice)} (${formatDate(realieData.transferDate)})\n🏛 Annual Tax: ${formatMoney(realieData.taxValue)}` : ""}`;
        const shareData: ShareData = { title: `Property: ${displayAddress}`, text };
        if (camera.photoUrl) {
          try {
            const res = await fetch(camera.photoUrl);
            const blob = await res.blob();
            const file = new File([blob], "property.jpg", { type: "image/jpeg" });
            if (navigator.canShare && navigator.canShare({ files: [file] })) { shareData.files = [file]; }
          } catch {}
        }
        await navigator.share(shareData);
        showToast("Shared!");
        return;
      } catch (e) { if ((e as Error).name === "AbortError") return; }
    }
    showToast("Share not supported on this device");
  }, [displayAddress, camera.photoUrl, realieData]);

  const savePropertyAction = useCallback(async () => {
    if (navigator.vibrate) navigator.vibrate(15);
    setSaving(true);
    try {
      await saveToLocal({
        address: displayAddress,
        latitude: geo.latitude,
        longitude: geo.longitude,
        photoUrl: camera.photoUrl,
        thumbnailUrl: camera.thumbnailUrl,
        realieData: realieData,
        skipTraceData: skipTraceData,
      });
      const count = await getPropertyCount();
      setPropertyCount(count);

      if (isSupabaseConfigured) {
        const { data: authData } = await supabase.auth.getSession();
        if (!authData.session) { await supabase.auth.signInAnonymously(); }
        await supabase.from("properties").insert({ address: displayAddress, latitude: geo.latitude || 24.5551, longitude: geo.longitude || -81.7800, photo_url: camera.photoUrl || null });
      }

      setSaved(true);
      setPropertyComplete(true);
      if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
      showToast("Property saved!");
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Save failed:", err);
      setSaved(true);
      setPropertyComplete(true);
      showToast("Property saved!");
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  }, [displayAddress, geo.latitude, geo.longitude, camera.photoUrl, camera.thumbnailUrl, realieData, skipTraceData]);

  const handleTabChange = (tab: string) => {
    if (tab === "share") { saveToDevice(); return; }
    if (tab === "properties") { getPropertyCount().then(setPropertyCount); }
    if (tab === "home" && activeTab === "home") {
      setManualAddress(null);
      setRealieData(null);
      setSkipTraceData(null);
      camera.setPhotoUrl(null);
      camera.setThumbnailUrl(null);
      setShouldLookup(false);
      setLookupBlocked(false);
      setSaved(false);
      setPropertyComplete(false);
      setLoadedFromLibrary(false);
      geo.requestLocation();
      showToast("Refreshing location...");
      return;
    }
    setActiveTab(tab);
  };

  const encodedAddress = encodeURIComponent(displayAddress);
  const zillowUrl = `https://www.zillow.com/homes/${encodedAddress}_rb/`;
  const redfinUrl = `https://www.redfin.com/search#query=${encodedAddress}`;
  const googleMapsUrl = geo.latitude
    ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${geo.latitude},${geo.longitude}`
    : `https://www.google.com/maps/search/${encodedAddress}`;

  const salesData = realieData?.transfers && realieData.transfers.length > 0 ? realieData.transfers : null;
  const hasRealSales = !!salesData;
  const taxData = realieData?.assessments && realieData.assessments.length > 0 ? realieData.assessments : null;
  const hasRealTax = !!taxData;
  const hasRealLiens = realieData && realieData.totalLienCount !== undefined && realieData.totalLienCount !== null;
  const lastSale = realieData?.transferPrice ? { date: realieData.transferDate, price: realieData.transferPrice } : null;

  if (activeTab === "settings") {
    return (
      <>
        <SettingsPage onBack={() => setActiveTab("home")} />
        <BottomNav active="settings" onTabChange={handleTabChange} propertyCount={propertyCount} />
      </>
    );
  }

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
      {showOnboarding && <OnboardingScreen onComplete={() => setShowOnboarding(false)} />}
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} onNewSearch={handleNewSearch} />

      {showNag && (
        <NagScreen lookupCount={lookupCount} canDismiss={nagCanDismiss} onDismiss={handleNagDismiss} onShare5={handleShare5} onShareContacts={handleShareContacts} onGoPro={handleGoPro} />
      )}

      <div className={`fixed top-12 inset-x-0 z-[100] flex justify-center transition-all duration-500 pointer-events-none ${toast ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="bg-lens-text/90 backdrop-blur-lg text-white text-[13px] font-semibold px-5 py-2.5 rounded-full shadow-elevated flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-lens-green" />{toast}
        </div>
      </div>

      <input ref={camera.inputRef} type="file" accept="image/*" capture="environment" onChange={camera.handleFileChange} className="hidden" />

      <PropertyHero photoUrl={camera.photoUrl} onOpenCamera={camera.openCamera} onMenuToggle={() => setMenuOpen(true)} />

      {propertyComplete ? (
        <div className="flex justify-center -mt-14 relative z-20">
          <div className="relative w-[120px] h-[120px]">
            <div
              className="absolute rounded-full bg-green-400/20 animate-ping"
              style={{ animationDuration: "3s", top: -4, left: -4, width: 108, height: 108 }}
            />
            <button
              onClick={() => {
                setPropertyComplete(false);
                setManualAddress(null);
                camera.setPhotoUrl(null);
                camera.setThumbnailUrl(null);
                setRealieData(null);
                setSkipTraceData(null);
                setShouldLookup(false);
                setLookupBlocked(false);
                setSaved(false);
                setLoadedFromLibrary(false);
                geo.requestLocation();
              }}
              type="button"
              className="relative w-[120px] h-[120px] flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: "transparent" }}
            >
              <img src="/geo-icon.png" alt="Next Property" className="w-[120px] h-[120px] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]" draggable={false} />
            </button>
          </div>
        </div>
      ) : (
        <LensLogo onTap={camera.openCamera} />
      )}

      <div className="px-4 mt-4 space-y-3 max-w-lg mx-auto">
        {lookupCount > 0 && lookupCount <= 10 && (
          <div className="text-center">
            <span className="text-[11px] text-lens-secondary">{Math.max(0, 10 - lookupCount)} free lookups remaining</span>
          </div>
        )}

        <div className="animate-slide-up delay-1">
          {geo.error && !manualAddress ? (
            <div className="bg-lens-card rounded-2xl shadow-card px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-bold text-lens-text mb-1">Location Access Required</p>
                  <p className="text-[12px] text-lens-secondary leading-relaxed mb-2">
                    HouseLens needs your location to identify nearby properties. Please enable Location Services in your device settings.
                  </p>
                  <p className="text-[11px] text-lens-secondary/70 mb-3">
                    iOS: Settings → Privacy → Location Services → Safari → While Using
                  </p>
                  <button
                    onClick={() => geo.requestLocation()}
                    className="px-4 py-2 rounded-xl bg-lens-accent text-white text-[13px] font-semibold active:scale-[0.97] transition-all"
                    type="button"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <InfoCard label="Address" icon={<Pencil className="w-4 h-4 text-lens-secondary" />} onIconClick={() => setEditingAddress(true)} tappable>
              <p>{geo.loading && !manualAddress ? (<span className="flex items-center gap-2 text-lens-secondary"><Loader2 className="w-4 h-4 animate-spin" />Detecting location…</span>) : displayAddress}</p>
              {geo.latitude && (
                <p className="text-[11px] text-lens-secondary mt-1">
                  {geo.latitude.toFixed(6)}° N, {Math.abs(geo.longitude!).toFixed(6)}° W
                  {geo.accuracy && <span className="ml-1.5 text-lens-accent/60">±{Math.round(geo.accuracy)}m</span>}
                </p>
              )}
            </InfoCard>
          )}
        </div>

        {!lookupBlocked && (
          <div className="animate-slide-up delay-2">
            <OwnerCard
              address={displayAddress}
              cachedData={realieData}
              cachedSkipTrace={skipTraceData}
              onDataLoaded={(data) => setRealieData(data)}
              onSkipTraceLoaded={(data) => setSkipTraceData(data)}
              onLookupStarted={handleLookupStarted}
              triggerLookup={shouldLookup}
              isPWA={isPWA}
              isUSA={geo.isUSA}
              onRequestInstall={handleRequestInstall}
            />
          </div>
        )}

<div className="animate-slide-up delay-3 flex gap-3">
          <button onClick={saveToDevice} className="flex-1 py-3.5 rounded-2xl text-[15px] font-semibold bg-lens-card shadow-card border border-lens-border text-lens-text active:scale-[0.97] transition-all flex items-center justify-center gap-2">
            <Download className="w-4 h-4 text-lens-accent" />
            Share Property
          </button>
        </div>

        <div className="animate-slide-up delay-3">
          <div className="flex gap-2">
            <a href={zillowUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-lens-card shadow-card border border-lens-border active:scale-[0.97] transition-transform">
              <span className="text-[13px] font-semibold text-blue-600">Zillow</span><ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            </a>
            <a href={redfinUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-lens-card shadow-card border border-lens-border active:scale-[0.97] transition-transform">
              <span className="text-[13px] font-semibold text-red-600">Redfin</span><ExternalLink className="w-3.5 h-3.5 text-red-400" />
            </a>
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-lens-card shadow-card border border-lens-border active:scale-[0.97] transition-transform">
              <span className="text-[13px] font-semibold text-green-600">Street View</span><ExternalLink className="w-3.5 h-3.5 text-green-400" />
            </a>
          </div>
        </div>

        {/* Only show data sections after lookup */}
        {realieData && (
          <>
            <div className="animate-slide-up delay-4">
              <AccordionSection title="Sales History" icon={<TrendingUp className="w-4 h-4" />} badge={`${hasRealSales ? (salesData!.length + (lastSale ? 1 : 0)) : (lastSale ? 1 : 0)}`}>
                <div className="space-y-3">
                  {lastSale && (
                    <div className="flex items-center justify-between py-2 border-b border-lens-border last:border-0">
                      <div><p className="text-[13px] font-medium text-lens-text">Most Recent Sale</p><p className="text-[11px] text-lens-secondary">{formatDate(lastSale.date)}</p></div>
                      <p className="text-[14px] font-semibold text-lens-text">{formatMoney(lastSale.price)}</p>
                    </div>
                  )}
                  {hasRealSales && salesData!.map((t, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-lens-border last:border-0">
                      <div><p className="text-[13px] font-medium text-lens-text">{t.grantee || "—"}</p><p className="text-[11px] text-lens-secondary">{formatDate(t.transferDate)}{t.grantor ? ` · from ${t.grantor}` : ""}</p></div>
                      <p className="text-[14px] font-semibold text-lens-text">{formatMoney(t.transferPrice)}</p>
                    </div>
                  ))}
                </div>
              </AccordionSection>
            </div>

            <div className="animate-slide-up delay-5">
              <AccordionSection title="Tax History" icon={<Receipt className="w-4 h-4" />} badge={hasRealTax ? `${taxData!.length + 1}` : "1"}>
                <div className="space-y-3">
                  {realieData.taxValue && (
                    <div className="flex items-center justify-between py-2 border-b border-lens-border">
                      <div><p className="text-[13px] font-medium text-lens-text">{realieData.taxYear || "Current"}</p><p className="text-[11px] text-lens-secondary">Assessed: {formatMoney(realieData.totalAssessedValue)}</p></div>
                      <p className="text-[14px] font-semibold text-lens-text">{formatMoney(realieData.taxValue)}</p>
                    </div>
                  )}
                  {taxData?.map((a, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-lens-border last:border-0">
                      <div><p className="text-[13px] font-medium text-lens-text">{a.assessedYear || a.taxYear}</p><p className="text-[11px] text-lens-secondary">Assessed: {formatMoney(a.totalAssessedValue)}</p></div>
                      <p className="text-[14px] font-semibold text-lens-text">{formatMoney(a.taxValue)}</p>
                    </div>
                  ))}
                </div>
              </AccordionSection>
            </div>

            {hasRealLiens && (
              <div className="animate-slide-up delay-5">
                <AccordionSection title="Liens & Mortgages" icon={<Landmark className="w-4 h-4" />} badge={`${realieData.totalLienCount}`}>
                  <div className="space-y-2">
                    <div className="flex justify-between py-1.5 border-b border-lens-border/50"><span className="text-[12px] text-lens-secondary">Total Liens</span><span className="text-[13px] font-medium text-lens-text">{realieData.totalLienCount}</span></div>
                    <div className="flex justify-between py-1.5 border-b border-lens-border/50"><span className="text-[12px] text-lens-secondary">Lien Balance</span><span className="text-[13px] font-medium text-lens-text">{formatMoney(realieData.totalLienBalance)}</span></div>
                    {realieData.lenderName && <div className="flex justify-between py-1.5 border-b border-lens-border/50"><span className="text-[12px] text-lens-secondary">Lender</span><span className="text-[13px] font-medium text-lens-text">{realieData.lenderName}</span></div>}
                    <div className="flex justify-between py-1.5 border-b border-lens-border/50"><span className="text-[12px] text-lens-secondary">Estimated Equity</span><span className="text-[13px] font-medium text-lens-text">{formatMoney(realieData.equityCurrentEstBal)}</span></div>
                    {realieData.LTVCurrentEstCombined && <div className="flex justify-between py-1.5"><span className="text-[12px] text-lens-secondary">LTV Ratio</span><span className="text-[13px] font-medium text-lens-text">{realieData.LTVCurrentEstCombined.toFixed(1)}%</span></div>}
                  </div>
                </AccordionSection>
              </div>
            )}

            {geo.latitude && geo.longitude && (
              <div className="animate-slide-up delay-5">
                <PropertyEnrichment
                  lat={geo.latitude}
                  lng={geo.longitude}
                  zip={(() => { const m = displayAddress.match(/(\d{5})/); return m ? m[1] : ""; })()}
                  stateAbbrev={(() => { const m = displayAddress.match(/\b([A-Z]{2})\b/); return m ? m[1] : ""; })()}
                />
              </div>
            )}
          </>
        )}
      </div>
{/* PWA Install Prompt */}
{showInstallPrompt && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowInstallPrompt(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-lens-accent to-blue-600 flex items-center justify-center shadow-lg">
                <img src="/logo.png" alt="HouseLens" className="w-10 h-10 rounded-lg" />
              </div>
              <h3 className="text-[18px] font-bold text-gray-900">Install HouseLens</h3>
              <p className="text-[13px] text-gray-500 mt-1">Add to your home screen for the full experience + 1 free owner contact lookup!</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <p className="text-[13px] font-semibold text-gray-700 mb-2">On iPhone:</p>
              <div className="flex items-start gap-2 mb-1.5">
                <span className="text-[12px] text-gray-500">1.</span>
                <p className="text-[12px] text-gray-600">Tap the <span className="font-semibold">Share</span> button <span className="inline-block w-4 h-4 align-middle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-lens-accent inline"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></span> at the bottom</p>
              </div>
              <div className="flex items-start gap-2 mb-1.5">
                <span className="text-[12px] text-gray-500">2.</span>
                <p className="text-[12px] text-gray-600">Scroll down, tap <span className="font-semibold">"Add to Home Screen"</span></p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[12px] text-gray-500">3.</span>
                <p className="text-[12px] text-gray-600">Tap <span className="font-semibold">"Add"</span> — then reopen HouseLens from your home screen</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <p className="text-[13px] font-semibold text-gray-700 mb-2">On Android:</p>
              <div className="flex items-start gap-2">
                <span className="text-[12px] text-gray-500">1.</span>
                <p className="text-[12px] text-gray-600">Tap <span className="font-semibold">⋮ menu → "Install app"</span> or <span className="font-semibold">"Add to Home Screen"</span></p>
              </div>
            </div>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="w-full py-3.5 rounded-2xl bg-lens-accent text-white text-[15px] font-semibold active:scale-[0.97] transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
      <AddressEditor address={displayAddress} open={editingAddress} onClose={() => setEditingAddress(false)} onSave={handleAddressSave} />
      <BottomNav active="home" onTabChange={handleTabChange} propertyCount={propertyCount} />
    </div>
  );
}