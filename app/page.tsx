"use client";

import { useState, useCallback, useEffect } from "react";
import { Pencil, TrendingUp, Receipt, Landmark, HardHat, Loader2, CheckCircle2, Download, ExternalLink } from "lucide-react";
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
import { RealieProperty } from "@/lib/realie";
import { MOCK_SALES_HISTORY, MOCK_TAX_HISTORY, MOCK_LIENS, MOCK_PERMITS } from "@/lib/mock-data";

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
  useEffect(() => { if (camera.photoUrl) showToast("Photo captured!"); }, [camera.photoUrl]);

  const handleAddressSave = (newAddress: string) => {
    setManualAddress(newAddress);
    setRealieData(null);
    if (navigator.vibrate) navigator.vibrate(10);
    showToast("Address updated!");
  };

  const handleSelectProperty = (prop: SavedProperty) => {
    setManualAddress(prop.address);
    if (prop.photoUrl) camera.setPhotoUrl(prop.photoUrl);
    if (prop.thumbnailUrl) camera.setThumbnailUrl(prop.thumbnailUrl);
    setRealieData(prop.realieData || null);
    setActiveTab("home");
    showToast("Property loaded!");
  };

  const handleNewSearch = () => {
    setManualAddress(null);
    camera.setPhotoUrl(null);
    camera.setThumbnailUrl(null);
    setRealieData(null);
    geo.requestLocation();
    showToast("Ready for new property!");
  };

  const saveToDevice = useCallback(async () => {
    if (navigator.vibrate) navigator.vibrate(10);
    if (navigator.share) {
      try {
        const text = `HouseLens Property\n\n📍 ${displayAddress}\n📐 ${geo.latitude?.toFixed(4)}° N, ${Math.abs(geo.longitude || 0).toFixed(4)}° W${realieData ? `\n\n👤 Owner: ${realieData.ownerName || "Unknown"}\n💰 Estimated Value: ${formatMoney(realieData.modelValue)}\n🏠 ${realieData.totalBedrooms || "?"}bd / ${realieData.totalBathrooms || "?"}ba · ${realieData.buildingArea?.toLocaleString() || "?"} sqft\n📅 Year Built: ${realieData.yearBuilt || "?"}\n💵 Last Sale: ${formatMoney(realieData.transferPrice)} (${formatDate(realieData.transferDate)})\n🏛 Annual Tax: ${formatMoney(realieData.taxValue)}` : ""}`;
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
    const text = `HouseLens Property Report\n\nAddress: ${displayAddress}\nSaved: ${new Date().toLocaleString()}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `property-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Report downloaded!");
  }, [displayAddress, geo.latitude, geo.longitude, camera.photoUrl, realieData]);

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
      });
      const count = await getPropertyCount();
      setPropertyCount(count);

      if (isSupabaseConfigured) {
        const { data: authData } = await supabase.auth.getSession();
        if (!authData.session) { await supabase.auth.signInAnonymously(); }
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
    } finally { setSaving(false); }
  }, [displayAddress, geo.latitude, geo.longitude, camera.photoUrl, camera.thumbnailUrl, realieData]);

  const handleTabChange = (tab: string) => {
    if (tab === "share") { saveToDevice(); return; }
    if (tab === "properties") { getPropertyCount().then(setPropertyCount); }
    setActiveTab(tab);
  };

  // Build external links
  const encodedAddress = encodeURIComponent(displayAddress);
  const zillowUrl = `https://www.zillow.com/homes/${encodedAddress}_rb/`;
  const redfinUrl = `https://www.redfin.com/search#query=${encodedAddress}`;
  const googleMapsUrl = geo.latitude
    ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${geo.latitude},${geo.longitude}`
    : `https://www.google.com/maps/search/${encodedAddress}`;

  // Use real data from Realie when available, fall back to mock
  const salesData = realieData?.transfers && realieData.transfers.length > 0
    ? realieData.transfers
    : null;
  const hasRealSales = !!salesData;

  const taxData = realieData?.assessments && realieData.assessments.length > 0
    ? realieData.assessments
    : null;
  const hasRealTax = !!taxData;

  const hasRealLiens = realieData && (realieData.totalLienCount !== undefined && realieData.totalLienCount !== null);

  // Most recent sale from Realie (top-level transfer fields)
  const lastSale = realieData?.transferPrice
    ? { date: realieData.transferDate, price: realieData.transferPrice }
    : null;

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
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} onNewSearch={handleNewSearch} />

      <div className={`fixed top-12 inset-x-0 z-[100] flex justify-center transition-all duration-500 pointer-events-none ${toast ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="bg-lens-text/90 backdrop-blur-lg text-white text-[13px] font-semibold px-5 py-2.5 rounded-full shadow-elevated flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-lens-green" />{toast}
        </div>
      </div>

      <input ref={camera.inputRef} type="file" accept="image/*" capture="environment" onChange={camera.handleFileChange} className="hidden" />

      <PropertyHero photoUrl={camera.photoUrl} onOpenCamera={camera.openCamera} onMenuToggle={() => setMenuOpen(true)} />
      <LensLogo onTap={camera.openCamera} />

      <div className="px-4 mt-4 space-y-3 max-w-lg mx-auto">
        {/* Address */}
        <div className="animate-slide-up delay-1">
          <InfoCard label="Address" icon={<Pencil className="w-4 h-4 text-lens-secondary" />} onIconClick={() => setEditingAddress(true)} tappable>
            <p>{geo.loading && !manualAddress ? (<span className="flex items-center gap-2 text-lens-secondary"><Loader2 className="w-4 h-4 animate-spin" />Detecting location…</span>) : displayAddress}</p>
            {geo.latitude && (
              <p className="text-[11px] text-lens-secondary mt-1">
                {geo.latitude.toFixed(6)}° N, {Math.abs(geo.longitude!).toFixed(6)}° W
                {geo.accuracy && <span className="ml-1.5 text-lens-accent/60">±{Math.round(geo.accuracy)}m</span>}
              </p>
            )}
          </InfoCard>
        </div>

        {/* Owner */}
        <div className="animate-slide-up delay-2">
          <OwnerCard address={displayAddress} cachedData={realieData} onDataLoaded={(data) => setRealieData(data)} />
        </div>

        {/* Action Buttons */}
        <div className="animate-slide-up delay-3 flex gap-3">
          <button onClick={savePropertyAction} disabled={saving}
            className={`flex-1 py-3.5 rounded-2xl text-[15px] font-semibold transition-all duration-300 active:scale-[0.97] disabled:opacity-70 ${saved ? "bg-lens-green text-white shadow-[0_0_20px_rgba(52,199,89,0.3)]" : "bg-lens-accent text-white shadow-card"}`}>
            {saving ? (<span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Saving…</span>)
              : saved ? (<span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" />Saved</span>)
              : "Save Property"}
          </button>
          <button onClick={saveToDevice} className="w-14 h-[52px] rounded-2xl bg-lens-card shadow-card border border-lens-border flex items-center justify-center active:scale-95 transition-transform" type="button">
            <Download className="w-5 h-5 text-lens-accent" />
          </button>
        </div>

        {/* External Links */}
        <div className="animate-slide-up delay-3">
          <div className="flex gap-2">
            <a href={zillowUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-lens-card shadow-card border border-lens-border active:scale-[0.97] transition-transform">
              <span className="text-[13px] font-semibold text-blue-600">Zillow</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            </a>
            <a href={redfinUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-lens-card shadow-card border border-lens-border active:scale-[0.97] transition-transform">
              <span className="text-[13px] font-semibold text-red-600">Redfin</span>
              <ExternalLink className="w-3.5 h-3.5 text-red-400" />
            </a>
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-lens-card shadow-card border border-lens-border active:scale-[0.97] transition-transform">
              <span className="text-[13px] font-semibold text-green-600">Street View</span>
              <ExternalLink className="w-3.5 h-3.5 text-green-400" />
            </a>
          </div>
        </div>

        {/* Sales History — real data or mock */}
        <div className="animate-slide-up delay-4">
          <AccordionSection title="Sales History" icon={<TrendingUp className="w-4 h-4" />}
            badge={`${hasRealSales ? (salesData!.length + (lastSale ? 1 : 0)) : MOCK_SALES_HISTORY.length}`}>
            <div className="space-y-3">
              {lastSale && (
                <div className="flex items-center justify-between py-2 border-b border-lens-border">
                  <div>
                    <p className="text-[13px] font-medium text-lens-text">Most Recent Sale</p>
                    <p className="text-[11px] text-lens-secondary">{formatDate(lastSale.date)}</p>
                  </div>
                  <p className="text-[14px] font-semibold text-lens-text">{formatMoney(lastSale.price)}</p>
                </div>
              )}
              {hasRealSales ? (
                salesData!.map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-lens-border last:border-0">
                    <div>
                      <p className="text-[13px] font-medium text-lens-text">{t.grantee || "—"}</p>
                      <p className="text-[11px] text-lens-secondary">{formatDate(t.transferDate)}{t.grantor ? ` · from ${t.grantor}` : ""}</p>
                    </div>
                    <p className="text-[14px] font-semibold text-lens-text">{formatMoney(t.transferPrice)}</p>
                  </div>
                ))
              ) : !lastSale ? (
                MOCK_SALES_HISTORY.map((sale, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-lens-border last:border-0">
                    <div>
                      <p className="text-[13px] font-medium text-lens-text">{sale.buyer}</p>
                      <p className="text-[11px] text-lens-secondary">{sale.date}</p>
                    </div>
                    <p className="text-[14px] font-semibold text-lens-text">{sale.price}</p>
                  </div>
                ))
              ) : null}
            </div>
          </AccordionSection>
        </div>

        {/* Tax History — real data or mock */}
        <div className="animate-slide-up delay-5">
          <AccordionSection title="Tax History" icon={<Receipt className="w-4 h-4" />}
            badge={hasRealTax ? `${taxData!.length + 1}` : undefined}>
            <div className="space-y-3">
              {realieData?.taxValue ? (
                <>
                  <div className="flex items-center justify-between py-2 border-b border-lens-border">
                    <div>
                      <p className="text-[13px] font-medium text-lens-text">{realieData.taxYear || "Current"}</p>
                      <p className="text-[11px] text-lens-secondary">Assessed: {formatMoney(realieData.totalAssessedValue)}</p>
                    </div>
                    <p className="text-[14px] font-semibold text-lens-text">{formatMoney(realieData.taxValue)}</p>
                  </div>
                  {taxData?.map((a, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-lens-border last:border-0">
                      <div>
                        <p className="text-[13px] font-medium text-lens-text">{a.assessedYear || a.taxYear}</p>
                        <p className="text-[11px] text-lens-secondary">Assessed: {formatMoney(a.totalAssessedValue)}</p>
                      </div>
                      <p className="text-[14px] font-semibold text-lens-text">{formatMoney(a.taxValue)}</p>
                    </div>
                  ))}
                </>
              ) : (
                MOCK_TAX_HISTORY.map((tax, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-lens-border last:border-0">
                    <div>
                      <p className="text-[13px] font-medium text-lens-text">{tax.year}</p>
                      <p className="text-[11px] text-lens-secondary">Assessed: {tax.assessed}</p>
                    </div>
                    <p className="text-[14px] font-semibold text-lens-text">{tax.tax}</p>
                  </div>
                ))
              )}
            </div>
          </AccordionSection>
        </div>

        {/* Liens & Mortgages — real data or mock */}
        <div className="animate-slide-up delay-5">
          <AccordionSection title="Liens & Mortgages" icon={<Landmark className="w-4 h-4" />}
            badge={hasRealLiens ? `${realieData!.totalLienCount}` : `${MOCK_LIENS.length}`}>
            <div className="space-y-3">
              {hasRealLiens ? (
                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-lens-border/50">
                    <span className="text-[12px] text-lens-secondary">Total Liens</span>
                    <span className="text-[13px] font-medium text-lens-text">{realieData!.totalLienCount}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-lens-border/50">
                    <span className="text-[12px] text-lens-secondary">Lien Balance</span>
                    <span className="text-[13px] font-medium text-lens-text">{formatMoney(realieData!.totalLienBalance)}</span>
                  </div>
                  {realieData!.lenderName && (
                    <div className="flex justify-between py-1.5 border-b border-lens-border/50">
                      <span className="text-[12px] text-lens-secondary">Lender</span>
                      <span className="text-[13px] font-medium text-lens-text">{realieData!.lenderName}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 border-b border-lens-border/50">
                    <span className="text-[12px] text-lens-secondary">Estimated Equity</span>
                    <span className="text-[13px] font-medium text-lens-text">{formatMoney(realieData!.equityCurrentEstBal)}</span>
                  </div>
                  {realieData!.LTVCurrentEstCombined && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-[12px] text-lens-secondary">LTV Ratio</span>
                      <span className="text-[13px] font-medium text-lens-text">{realieData!.LTVCurrentEstCombined.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              ) : (
                MOCK_LIENS.map((lien, i) => (
                  <div key={i} className="py-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-medium text-lens-text">{lien.type}</p>
                      <p className="text-[14px] font-semibold text-lens-text">{lien.amount}</p>
                    </div>
                    <p className="text-[11px] text-lens-secondary mt-0.5">{lien.lender} · {lien.date}</p>
                  </div>
                ))
              )}
            </div>
          </AccordionSection>
        </div>

        {/* Building Permits — mock only (no API source yet) */}
        <div className="animate-slide-up delay-6">
          <AccordionSection title="Building Permits" icon={<HardHat className="w-4 h-4" />} badge={`${MOCK_PERMITS.length}`}>
            <div className="space-y-3">
              {MOCK_PERMITS.map((permit, i) => (
                <div key={i} className="py-2 border-b border-lens-border last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-lens-text">{permit.type}</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${permit.status === "Completed" ? "bg-lens-green/10 text-lens-green" : "bg-yellow-100 text-yellow-700"}`}>{permit.status}</span>
                  </div>
                  <p className="text-[11px] text-lens-secondary mt-0.5">{permit.number} · {permit.date}</p>
                </div>
              ))}
            </div>
          </AccordionSection>
        </div>
      </div>

      <AddressEditor address={displayAddress} open={editingAddress} onClose={() => setEditingAddress(false)} onSave={handleAddressSave} />
      <BottomNav active="home" onTabChange={handleTabChange} propertyCount={propertyCount} />
    </div>
  );
}