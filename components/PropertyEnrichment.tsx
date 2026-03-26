"use client";

import { useState, useEffect } from "react";
import { Waves, Leaf, Mountain, Sun, Users, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";
import { enrichProperty, EnrichmentData } from "@/lib/enrichment";

interface Props {
  lat: number;
  lng: number;
  zip: string;
  stateAbbrev?: string;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
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

function DataRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-lens-border/50 last:border-0">
      <span className="text-[12px] text-lens-secondary">{label}</span>
      <span className="text-[13px] font-medium text-lens-text text-right ml-4 max-w-[60%]">{value}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2 py-2">
          <div className="w-6 h-6 rounded-md bg-lens-border/30" />
          <div className="h-3 w-28 rounded bg-lens-border/30" />
        </div>
      ))}
    </div>
  );
}

export default function PropertyEnrichment({ lat, lng, zip, stateAbbrev }: Props) {
  const [data, setData] = useState<EnrichmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    enrichProperty(lat, lng, zip, stateAbbrev).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [lat, lng, zip, stateAbbrev]);

  if (loading) {
    return (
      <div className="bg-lens-card rounded-2xl shadow-card px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-lens-secondary mb-3">Property Insights</p>
        <LoadingSkeleton />
      </div>
    );
  }

  if (!data) return null;

  const hasAny = data.flood || data.growingZone || data.elevation || data.sun || data.census || data.crime;
  if (!hasAny) return null;

  return (
    <div className="bg-lens-card rounded-2xl shadow-card overflow-hidden">
      <div className="px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-lens-secondary mb-3">Property Insights</p>

        {data.flood && (
          <Section title="Flood Risk" icon={<Waves className="w-3.5 h-3.5 text-lens-accent" />}>
            <DataRow label="Flood Zone" value={data.flood.zone} />
            <DataRow label="Risk Level" value={data.flood.zoneDescription} />
            <DataRow label="Special Flood Hazard Area" value={data.flood.sfha ? "Yes" : "No"} />
          </Section>
        )}

        {data.growingZone && (
          <Section title="Growing Zone" icon={<Leaf className="w-3.5 h-3.5 text-lens-accent" />}>
            <DataRow label="USDA Zone" value={data.growingZone.zone} />
            <DataRow label="Temperature Range" value={data.growingZone.trange} />
          </Section>
        )}

        {data.elevation && (
          <Section title="Elevation" icon={<Mountain className="w-3.5 h-3.5 text-lens-accent" />}>
            <DataRow label="Elevation" value={`${data.elevation.feet.toLocaleString()} ft (${data.elevation.meters.toLocaleString()} m)`} />
          </Section>
        )}

        {data.sun && (
          <Section title="Sun Data" icon={<Sun className="w-3.5 h-3.5 text-lens-accent" />}>
            <DataRow label="Sunrise" value={data.sun.sunrise} />
            <DataRow label="Sunset" value={data.sun.sunset} />
            <DataRow label="Day Length" value={data.sun.dayLength} />
            <DataRow label="Solar Noon" value={data.sun.solarNoon} />
          </Section>
        )}

        {data.census && (
          <Section title="Neighborhood Demographics" icon={<Users className="w-3.5 h-3.5 text-lens-accent" />}>
            <DataRow label="Population" value={data.census.population != null ? data.census.population.toLocaleString() : null} />
            <DataRow label="Median Household Income" value={data.census.medianIncome != null ? `$${data.census.medianIncome.toLocaleString()}` : null} />
            <DataRow label="Median Home Value" value={data.census.medianHomeValue != null ? `$${data.census.medianHomeValue.toLocaleString()}` : null} />
            <DataRow label="Median Age" value={data.census.medianAge != null ? String(data.census.medianAge) : null} />
            <DataRow label="Median Rent" value={data.census.medianRent != null ? `$${data.census.medianRent.toLocaleString()}/mo` : null} />
            <DataRow label="Unemployment Rate" value={data.census.unemploymentRate != null ? `${data.census.unemploymentRate}%` : null} />
            <DataRow label="College Education" value={data.census.collegeRate != null ? `${data.census.collegeRate}%` : null} />
            <DataRow label="Owner-Occupied" value={data.census.ownerOccupiedRate != null ? `${data.census.ownerOccupiedRate}%` : null} />
            <p className="text-[10px] text-lens-secondary/60 mt-2 pt-1 border-t border-lens-border/30">Source: US Census Bureau ACS 2022</p>
          </Section>
        )}

        {data.crime && (
          <Section title="Area Crime Statistics" icon={<ShieldAlert className="w-3.5 h-3.5 text-lens-accent" />}>
            <div className="flex justify-between items-baseline py-1.5 border-b border-lens-border/50">
              <span className="text-[12px] text-lens-secondary">Violent Crime Rate</span>
              <span className={`text-[13px] font-medium text-right ml-4 ${
                data.crime.violentCrimeRate < 400 ? "text-green-600" : data.crime.violentCrimeRate <= 600 ? "text-orange-500" : "text-red-500"
              }`}>
                {data.crime.violentCrimeRate.toLocaleString()} per 100K
              </span>
            </div>
            <DataRow label="Property Crime Rate" value={`${data.crime.propertyCrimeRate.toLocaleString()} per 100K`} />
            <DataRow label="Burglary Rate" value={`${data.crime.burglaryRate.toLocaleString()} per 100K`} />
            <DataRow label="Motor Vehicle Theft" value={`${data.crime.motorVehicleTheftRate.toLocaleString()} per 100K`} />
            <p className="text-[10px] text-lens-secondary/60 mt-2 pt-1 border-t border-lens-border/30">
              State-level data for {data.crime.stateName}. Source: FBI UCR 2022
            </p>
          </Section>
        )}
      </div>
    </div>
  );
}
