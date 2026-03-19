"use client";

import { useState } from "react";
import { Lock, Share2, Smartphone, CreditCard, X, Eye, Loader2, User, Home, DollarSign, FileText, Landmark, MapPin, Building2 } from "lucide-react";
import { lookupProperty, RealieProperty } from "@/lib/realie";

interface Props {
  address: string;
}

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

function DataRow({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-lens-border/50 last:border-0">
      <span className="text-[12px] text-lens-secondary">{label}</span>
      <span className="text-[13px] font-medium text-lens-text text-right ml-4 max-w-[60%]">{display}</span>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-md bg-lens-accent/10 flex items-center justify-center">{icon}</div>
        <h4 className="text-[13px] font-bold text-lens-text uppercase tracking-wider">{title}</h4>
      </div>
      <div className="bg-lens-bg/60 rounded-xl px-4 py-2">{children}</div>
    </div>
  );
}

export default function OwnerCard({ address }: Props) {
  const [showPaywall, setShowPaywall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [property, setProperty] = useState<RealieProperty | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  const handleTap = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    if (unlocked && property) return; // Already showing data
    setShowPaywall(true);
  };

  const handleUnlock = async () => {
    setShowPaywall(false);
    setLoading(true);
    setError(null);
    try {
      const result = await lookupProperty(address);
      if (result) {
        setProperty(result);
        setUnlocked(true);
      } else {
        setError("Property not found. Try editing the address.");
      }
    } catch {
      setError("Lookup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // UNLOCKED VIEW — show all property data
  if (unlocked && property) {
    return (
      <div className="bg-lens-card rounded-2xl shadow-card overflow-hidden">
        {/* Owner header */}
        <div className="px-5 py-4 bg-gradient-to-r from-lens-accent to-blue-600">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70 mb-1">Owner Information</p>
          <p className="text-[17px] font-bold text-white">{property.ownerName || "Unknown Owner"}</p>
          {property.ownerAddressLine1 && (
            <p className="text-[13px] text-white/80 mt-0.5">
              {property.ownerAddressLine1}, {property.ownerCity} {property.ownerState} {property.ownerZipCode}
            </p>
          )}
        </div>

        <div className="px-5 py-4">
          {/* Property Details */}
          <Section title="Property" icon={<Home className="w-3.5 h-3.5 text-lens-accent" />}>
            <DataRow label="Address" value={property.addressFull} />
            <DataRow label="Parcel ID" value={property.parcelId} />
            <DataRow label="Year Built" value={property.yearBuilt} />
            <DataRow label="Bedrooms" value={property.totalBedrooms} />
            <DataRow label="Bathrooms" value={property.totalBathrooms} />
            <DataRow label="Sq Ft" value={property.buildingArea?.toLocaleString()} />
            <DataRow label="Stories" value={property.stories} />
            <DataRow label="Pool" value={property.pool} />
            <DataRow label="Garage" value={property.garage} />
            <DataRow label="Garage Spaces" value={property.garageCount} />
            <DataRow label="Fireplaces" value={property.fireplaceCount} />
            <DataRow label="Acres" value={property.acres?.toFixed(2)} />
            <DataRow label="Subdivision" value={property.subdivision} />
            <DataRow label="Zoning" value={property.zoningCode} />
            <DataRow label="Neighborhood" value={property.neighborhood} />
          </Section>

          {/* Valuation */}
          <Section title="Valuation" icon={<DollarSign className="w-3.5 h-3.5 text-lens-accent" />}>
            <DataRow label="Estimated Value" value={formatMoney(property.modelValue)} />
            <DataRow label="Value Range" value={property.modelValueMin && property.modelValueMax ? `${formatMoney(property.modelValueMin)} – ${formatMoney(property.modelValueMax)}` : undefined} />
            <DataRow label="Market Value" value={formatMoney(property.totalMarketValue)} />
            <DataRow label="Assessed Value" value={formatMoney(property.totalAssessedValue)} />
            <DataRow label="Building Value" value={formatMoney(property.totalBuildingValue)} />
            <DataRow label="Land Value" value={formatMoney(property.totalLandValue)} />
            <DataRow label="Assessed Year" value={property.assessedYear} />
          </Section>

          {/* Taxes */}
          <Section title="Taxes" icon={<FileText className="w-3.5 h-3.5 text-lens-accent" />}>
            <DataRow label="Annual Tax" value={formatMoney(property.taxValue)} />
            <DataRow label="Tax Year" value={property.taxYear} />
            {property.assessments && property.assessments.length > 0 && (
              <div className="mt-2">
                <p className="text-[11px] font-semibold text-lens-secondary mb-1">History</p>
                {property.assessments.slice(0, 5).map((a, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-lens-border/30 last:border-0">
                    <span className="text-[11px] text-lens-secondary">{a.assessedYear || a.taxYear}</span>
                    <span className="text-[12px] font-medium text-lens-text">{formatMoney(a.taxValue)} tax · {formatMoney(a.totalAssessedValue)} assessed</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Sales History */}
          {property.transfers && property.transfers.length > 0 && (
            <Section title="Sales History" icon={<Building2 className="w-3.5 h-3.5 text-lens-accent" />}>
              {property.transfers.map((t, i) => (
                <div key={i} className="py-2 border-b border-lens-border/30 last:border-0">
                  <div className="flex justify-between">
                    <span className="text-[12px] text-lens-secondary">{formatDate(t.transferDate)}</span>
                    <span className="text-[13px] font-semibold text-lens-text">{formatMoney(t.transferPrice)}</span>
                  </div>
                  {t.grantee && <p className="text-[11px] text-lens-secondary mt-0.5">To: {t.grantee}</p>}
                  {t.grantor && <p className="text-[11px] text-lens-secondary">From: {t.grantor}</p>}
                </div>
              ))}
            </Section>
          )}

          {/* Liens & Mortgages */}
          <Section title="Liens & Mortgages" icon={<Landmark className="w-3.5 h-3.5 text-lens-accent" />}>
            <DataRow label="Total Liens" value={property.totalLienCount} />
            <DataRow label="Lien Balance" value={formatMoney(property.totalLienBalance)} />
            <DataRow label="Lender" value={property.lenderName} />
            <DataRow label="Estimated Equity" value={formatMoney(property.equityCurrentEstBal)} />
            <DataRow label="LTV Ratio" value={property.LTVCurrentEstCombined ? `${property.LTVCurrentEstCombined.toFixed(1)}%` : undefined} />
          </Section>

          {/* Owner Details */}
          <Section title="Owner Details" icon={<User className="w-3.5 h-3.5 text-lens-accent" />}>
            <DataRow label="Owner Name" value={property.ownerName} />
            <DataRow label="Mailing Address" value={property.ownerAddressLine1} />
            <DataRow label="City" value={property.ownerCity} />
            <DataRow label="State" value={property.ownerState} />
            <DataRow label="Zip" value={property.ownerZipCode} />
            <DataRow label="Properties Owned" value={property.ownerParcelCount} />
          </Section>

          {/* Legal */}
          {property.legalDesc && (
            <Section title="Legal" icon={<MapPin className="w-3.5 h-3.5 text-lens-accent" />}>
              <p className="text-[11px] text-lens-secondary leading-relaxed">{property.legalDesc}</p>
            </Section>
          )}
        </div>
      </div>
    );
  }

  // LOCKED VIEW
  return (
    <>
      <div onClick={handleTap} className="bg-lens-card rounded-2xl shadow-card px-5 py-4 cursor-pointer active:scale-[0.98] active:shadow-sm hover:shadow-elevated transition-all duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-lens-secondary mb-1.5">Owner</p>
            {loading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-lens-accent" />
                <span className="text-[13px] text-lens-accent font-medium">Looking up property data…</span>
              </div>
            ) : error ? (
              <p className="text-[13px] text-red-500 font-medium">{error}</p>
            ) : (
              <div className="relative">
                <div className="blur-[6px] select-none pointer-events-none">
                  <p className="text-[15px] leading-snug text-lens-text font-medium">Joseph Smith · Jane Doe</p>
                  <p className="text-[13px] text-lens-secondary mt-0.5">(305) 555-0147</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                    <Eye className="w-3.5 h-3.5 text-lens-accent" />
                    <span className="text-[12px] font-semibold text-lens-accent">Tap for owner info</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="w-9 h-9 rounded-xl bg-lens-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Lock className="w-4 h-4 text-lens-accent" />
          </div>
        </div>
      </div>

      {/* Paywall */}
      {showPaywall && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPaywall(false)}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: "env(safe-area-inset-bottom, 24px)" }}>
            <div className="relative px-6 pt-5 pb-4">
              <button onClick={() => setShowPaywall(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-lens-bg flex items-center justify-center" type="button">
                <X className="w-4 h-4 text-lens-secondary" />
              </button>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lens-accent to-blue-600 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-lens-text">Unlock Owner Info</h3>
                  <p className="text-[12px] text-lens-secondary">Name, address, taxes, liens &amp; more</p>
                </div>
              </div>
            </div>

            <div className="px-6 space-y-3 pb-6">
              <button onClick={() => { if (navigator.share) { navigator.share({ title: "HouseLens", text: "Check out HouseLens — instant property intelligence from your phone!", url: window.location.href }).catch(() => {}); } handleUnlock(); }} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-lens-accent/20 bg-lens-accent/[0.03] active:scale-[0.98] transition-all" type="button">
                <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0"><Share2 className="w-5 h-5 text-green-600" /></div>
                <div className="flex-1 text-left">
                  <p className="text-[14px] font-semibold text-lens-text">Share with a friend</p>
                  <p className="text-[12px] text-lens-secondary mt-0.5">Get <span className="font-bold text-green-600">1 free lookup</span></p>
                </div>
                <span className="text-[12px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">FREE</span>
              </button>

              <button onClick={handleUnlock} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-lens-border bg-white active:scale-[0.98] transition-all" type="button">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0"><Smartphone className="w-5 h-5 text-blue-600" /></div>
                <div className="flex-1 text-left">
                  <p className="text-[14px] font-semibold text-lens-text">Download the app</p>
                  <p className="text-[12px] text-lens-secondary mt-0.5">Get <span className="font-bold text-blue-600">3 free lookups</span></p>
                </div>
                <span className="text-[12px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">FREE</span>
              </button>

              <button onClick={handleUnlock} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-amber-300/50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 active:scale-[0.98] transition-all" type="button">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0"><CreditCard className="w-5 h-5 text-amber-600" /></div>
                <div className="flex-1 text-left">
                  <p className="text-[14px] font-semibold text-lens-text">Pro Monthly</p>
                  <p className="text-[12px] text-lens-secondary mt-0.5"><span className="font-bold text-amber-600">50 lookups</span> per month</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[16px] font-bold text-lens-text">$9.95</span>
                  <p className="text-[10px] text-lens-secondary">/month</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}