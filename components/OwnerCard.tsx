"use client";

import { useState, useEffect } from "react";
import { Loader2, User, Home, DollarSign, FileText, Landmark, MapPin, Building2, Phone, Mail, ChevronDown, ChevronUp, Download, Shield } from "lucide-react";
import { lookupProperty, RealieProperty } from "@/lib/realie";
import { skipTrace, SkipTraceResult } from "@/lib/skiptrace";
import { useSkipTraceCredit, getCreditState, grantSkipTraceCredits } from "@/lib/credits";
import { useAppConfig } from "@/hooks/useAppConfig";

interface Props {
  address: string;
  cachedData?: RealieProperty | null;
  cachedSkipTrace?: SkipTraceResult | null;
  onDataLoaded?: (data: RealieProperty) => void;
  onSkipTraceLoaded?: (data: SkipTraceResult) => void;
  onLookupStarted?: () => void;
  triggerLookup?: boolean;
  isPWA?: boolean;
  onRequestInstall?: () => void;
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

function formatPhone(num: string) {
  const digits = num.replace(/\D/g, "");
  if (digits.length === 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === "1") return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
  return num;
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

function Section({ title, icon, children, defaultOpen = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-3">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-lens-accent/10 flex items-center justify-center">{icon}</div>
          <h4 className="text-[13px] font-bold text-lens-text uppercase tracking-wider">{title}</h4>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-lens-secondary" /> : <ChevronDown className="w-4 h-4 text-lens-secondary" />}
      </button>
      {open && <div className="bg-lens-bg/60 rounded-xl px-4 py-2 mt-1">{children}</div>}
    </div>
  );
}

function parseAddressParts(fullAddress: string) {
  const parts = fullAddress.split(",").map(s => s.trim());
  const street = parts[0] || "";
  const city = parts[1] || "";
  const stateZip = parts[2] || "";
  const stateMatch = stateZip.match(/([A-Z]{2})/);
  const state = stateMatch ? stateMatch[1] : "";
  const zipMatch = stateZip.match(/(\d{5})/);
  const zip = zipMatch ? zipMatch[1] : "";
  return { street, city, state, zip };
}

export default function OwnerCard({ address, cachedData, cachedSkipTrace, onDataLoaded, onSkipTraceLoaded, onLookupStarted, triggerLookup, isPWA, onRequestInstall }: Props) {
  const { config, isFree } = useAppConfig();
  const [loading, setLoading] = useState(false);
  const [property, setProperty] = useState<RealieProperty | null>(cachedData || null);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(!!cachedData);
  const [hasTriggered, setHasTriggered] = useState(false);

  // Skip trace state
  const [skipTraceData, setSkipTraceData] = useState<SkipTraceResult | null>(cachedSkipTrace || null);
  const [skipTraceLoading, setSkipTraceLoading] = useState(false);
  const [contactOpen, setContactOpen] = useState(!!cachedSkipTrace);
  const [skipCredits, setSkipCredits] = useState(0);
  const [showShareGate, setShowShareGate] = useState(false);

  useEffect(() => {
    getCreditState().then(s => setSkipCredits(s.skipTraceCredits));
  }, []);

  useEffect(() => {
    if (cachedData) {
      setProperty(cachedData);
      setUnlocked(true);
      setError(null);
    } else {
      setProperty(null);
      setUnlocked(false);
      setHasTriggered(false);
      setSkipTraceData(null);
      setContactOpen(false);
    }
  }, [cachedData]);

  // Load cached skip trace when prop changes
  useEffect(() => {
    if (cachedSkipTrace) {
      setSkipTraceData(cachedSkipTrace);
      setContactOpen(true);
    }
  }, [cachedSkipTrace]);

  // Realie lookup (property data only, no skip trace)
  useEffect(() => {
    if (triggerLookup && !hasTriggered && !unlocked && address && !address.includes("Detecting")) {
      setHasTriggered(true);
      const doLookup = async () => {
        setLoading(true);
        setError(null);
        onLookupStarted?.();
        try {
          const result = await lookupProperty(address);
          if (result) {
            setProperty(result);
            setUnlocked(true);
            onDataLoaded?.(result);
          } else {
            setError("Property not found. Try editing the address.");
          }
        } catch {
          setError("Lookup failed. Please try again.");
        } finally {
          setLoading(false);
        }
      };
      doLookup();
    }
  }, [triggerLookup, address, hasTriggered, unlocked]);

  // Handle skip trace button
  const handleSkipTrace = async () => {
    if (!property) return;

    // In free mode, skip all credit gates
    if (!isFree) {
      // Check if PWA is installed
      if (!isPWA) {
        onRequestInstall?.();
        return;
      }

      // Check credits
      const hasCredit = await useSkipTraceCredit();
      if (!hasCredit) {
        setShowShareGate(true);
        return;
      }
    }

    setSkipTraceLoading(true);
    setContactOpen(true);
    const parsed = parseAddressParts(address);
    const st = await skipTrace(
      property.ownerName || "",
      property.address || parsed.street,
      property.city || parsed.city,
      property.state || parsed.state,
      String(property.zip || "") || parsed.zip
    );
    setSkipTraceData(st);
    setSkipTraceLoading(false);
    if (st) onSkipTraceLoaded?.(st);
    const credits = await getCreditState();
    setSkipCredits(credits.skipTraceCredits);
  };

  const handleShareForCredits = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "HouseLens — Instant Property Intelligence",
          text: `I just looked up a property on HouseLens and found the owner's phone number instantly! Try it free.`,
          url: "https://houselens.io",
        });
        await grantSkipTraceCredits(3);
        setShowShareGate(false);
        setSkipCredits((await getCreditState()).skipTraceCredits);
        // Auto-trigger after sharing
        handleSkipTrace();
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          // Share failed
        }
      }
    }
  };

  // UNLOCKED VIEW (property data loaded)
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
          {/* Skip Trace Button or Results */}
          {!skipTraceData && !skipTraceLoading && !contactOpen && (
            <>
              {showShareGate ? (
                <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
                  <p className="text-[14px] font-bold text-gray-800 mb-1">Want more owner lookups?</p>
                  <p className="text-[12px] text-gray-600 mb-3">Share HouseLens with friends to unlock 3 more contact lookups.</p>
                  <button
                    onClick={handleShareForCredits}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[14px] font-bold shadow-lg active:scale-[0.97] transition-all"
                  >
                    Share & Unlock 3 Lookups
                  </button>
                  <p className="text-[11px] text-gray-400 text-center mt-2">or Go Pro for unlimited — coming soon</p>
                </div>
              ) : (
                <button
                  onClick={handleSkipTrace}
                  className="w-full mb-5 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[15px] font-bold shadow-[0_4px_15px_rgba(249,115,22,0.4)] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  {!isPWA ? "Install App to Unlock Owner Contact" : "Find Owner Phone & Email"}
                </button>
              )}
            </>
          )}

          {/* Skip trace loading */}
          {skipTraceLoading && (
            <div className="mb-5 p-4 rounded-xl bg-orange-50 border border-orange-200">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                <p className="text-[13px] text-orange-600 font-medium">Finding owner contact information…</p>
              </div>
            </div>
          )}

          {/* Skip trace results — accordion */}
          {skipTraceData && (skipTraceData.phones.length > 0 || skipTraceData.emails.length > 0) && (
            <div className="mb-5 rounded-2xl border-2 border-orange-200 overflow-hidden">
              <button
                onClick={() => setContactOpen(!contactOpen)}
                className="w-full px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-orange-500" />
                  <span className="text-[14px] font-bold text-gray-800">
                    Owner Contact Info
                  </span>
                  <span className="text-[11px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-semibold">
                    {skipTraceData.phones.length + skipTraceData.emails.length}
                  </span>
                </div>
                {contactOpen ? <ChevronUp className="w-4 h-4 text-orange-400" /> : <ChevronDown className="w-4 h-4 text-orange-400" />}
              </button>

              {contactOpen && (
                <div className="px-4 py-3 bg-white">
                  {skipTraceData.phones.map((p, i) => (
                    <div key={i} className="flex justify-between items-center py-2.5 border-b border-lens-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <Phone className={`w-3.5 h-3.5 ${p.dnc ? "text-red-400" : "text-green-500"}`} />
                        <div>
                          <a href={`tel:${p.number}`} className="text-[15px] font-bold text-lens-accent">
                            {formatPhone(p.number)}
                          </a>
                          {p.carrier && <p className="text-[10px] text-lens-secondary">{p.carrier}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {p.dnc && <span className="text-[9px] uppercase font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">DNC</span>}
                        {p.type && <span className="text-[10px] uppercase font-semibold text-lens-secondary bg-lens-bg px-2 py-0.5 rounded-full">{p.type}</span>}
                      </div>
                    </div>
                  ))}
                  {skipTraceData.emails.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 py-2.5 border-b border-lens-border/50 last:border-0">
                      <Mail className="w-3.5 h-3.5 text-lens-secondary" />
                      <a href={`mailto:${e.email}`} className="text-[14px] font-medium text-lens-accent">{e.email}</a>
                    </div>
                  ))}

                  {/* Criminal Background Check upsell */}
                  <div className="mt-3 pt-3 border-t border-lens-border">
                    <button className="w-full py-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-900 text-white text-[13px] font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition-all opacity-90">
                      <Shield className="w-4 h-4" />
                      Run Background Check — 2 credits
                    </button>
                    <p className="text-[10px] text-lens-secondary text-center mt-1">Criminal records, warrants, liens & more</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Skip trace miss */}
          {skipTraceData && skipTraceData.phones.length === 0 && skipTraceData.emails.length === 0 && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-[12px] text-amber-700 font-medium">No contact info found for this owner.</p>
            </div>
          )}

          {/* Property data sections — all accordion */}
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

          <Section title="Valuation" icon={<DollarSign className="w-3.5 h-3.5 text-lens-accent" />}>
            <DataRow label="Estimated Value" value={formatMoney(property.modelValue)} />
            <DataRow label="Value Range" value={property.modelValueMin && property.modelValueMax ? `${formatMoney(property.modelValueMin)} – ${formatMoney(property.modelValueMax)}` : undefined} />
            <DataRow label="Market Value" value={formatMoney(property.totalMarketValue)} />
            <DataRow label="Assessed Value" value={formatMoney(property.totalAssessedValue)} />
            <DataRow label="Building Value" value={formatMoney(property.totalBuildingValue)} />
            <DataRow label="Land Value" value={formatMoney(property.totalLandValue)} />
            <DataRow label="Assessed Year" value={property.assessedYear} />
          </Section>

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

          <Section title="Liens & Mortgages" icon={<Landmark className="w-3.5 h-3.5 text-lens-accent" />}>
            <DataRow label="Total Liens" value={property.totalLienCount} />
            <DataRow label="Lien Balance" value={formatMoney(property.totalLienBalance)} />
            <DataRow label="Lender" value={property.lenderName} />
            <DataRow label="Estimated Equity" value={formatMoney(property.equityCurrentEstBal)} />
            <DataRow label="LTV Ratio" value={property.LTVCurrentEstCombined ? `${property.LTVCurrentEstCombined.toFixed(1)}%` : undefined} />
          </Section>

          <Section title="Owner Details" icon={<User className="w-3.5 h-3.5 text-lens-accent" />}>
            <DataRow label="Owner Name" value={property.ownerName} />
            <DataRow label="Mailing Address" value={property.ownerAddressLine1} />
            <DataRow label="City" value={property.ownerCity} />
            <DataRow label="State" value={property.ownerState} />
            <DataRow label="Zip" value={property.ownerZipCode} />
            <DataRow label="Properties Owned" value={property.ownerParcelCount} />
          </Section>

          {property.legalDesc && (
            <Section title="Legal" icon={<MapPin className="w-3.5 h-3.5 text-lens-accent" />}>
              <p className="text-[11px] text-lens-secondary leading-relaxed">{property.legalDesc}</p>
            </Section>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-lens-card rounded-2xl shadow-card px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-lens-secondary mb-1.5">Owner</p>
        <div className="flex items-center gap-2 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-lens-accent" />
          <span className="text-[13px] text-lens-accent font-medium">Looking up property data…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-lens-card rounded-2xl shadow-card px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-lens-secondary mb-1.5">Owner</p>
        <p className="text-[13px] text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-lens-card rounded-2xl shadow-card px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-lens-secondary mb-1.5">Owner</p>
      <p className="text-[13px] text-lens-secondary">Take a photo to look up property information.</p>
    </div>
  );
}