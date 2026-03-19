export interface RealieProperty {
  parcelId?: string;
  address?: string;
  addressFull?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  // Owner
  ownerName?: string;
  ownerAddressLine1?: string;
  ownerCity?: string;
  ownerState?: string;
  ownerZipCode?: string;
  ownerResCount?: number;
  ownerParcelCount?: number;
  // Physical
  buildingArea?: number;
  totalBedrooms?: number;
  totalBathrooms?: number;
  yearBuilt?: number;
  stories?: number;
  pool?: boolean;
  garage?: boolean;
  garageCount?: number;
  fireplaceCount?: number;
  roofType?: string;
  constructionType?: string;
  // Land
  acres?: number;
  lotNum?: string;
  subdivision?: string;
  zoningCode?: string;
  legalDesc?: string;
  // Valuation & Tax
  totalAssessedValue?: number;
  totalMarketValue?: number;
  totalBuildingValue?: number;
  totalLandValue?: number;
  assessedYear?: number;
  taxValue?: number;
  taxYear?: number;
  modelValue?: number;
  modelValueMin?: number;
  modelValueMax?: number;
  assessments?: Array<{
    assessedYear: number;
    totalAssessedValue: number;
    totalMarketValue: number;
    taxValue: number;
    taxYear: number;
  }>;
  // Transfers
  transferDate?: string;
  transferPrice?: number;
  transfers?: Array<{
    transferDate: string;
    transferPrice: number;
    grantee?: string;
    grantor?: string;
    recordingDate?: string;
  }>;
  // Liens
  totalLienCount?: number;
  totalLienBalance?: number;
  totalFinancingHistCount?: number;
  lenderName?: string;
  LTVCurrentEstCombined?: number;
  equityCurrentEstBal?: number;
  // Location
  latitude?: number;
  longitude?: number;
  neighborhood?: string;
  // All other fields
  [key: string]: unknown;
}

export function parseAddress(fullAddress: string): { street: string; city: string; state: string; county: string } {
  // Parse "927 Catherine Street, Key West, Florida 33040"
  const parts = fullAddress.split(",").map((s) => s.trim());
  const street = parts[0] || "";
  const city = parts[1] || "";
  
  // State might be "Florida 33040" or "FL 33040"
  const stateZip = parts[2] || parts[parts.length - 1] || "";
  const stateMatch = stateZip.match(/([A-Za-z]+)\s*\d*/);
  let state = stateMatch ? stateMatch[1] : "";
  
  // Convert full state name to abbreviation
  const stateMap: Record<string, string> = {
    alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
    colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
    hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
    kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
    massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
    missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
    "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
    "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
    oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
    virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
  };
  
  if (state.length > 2) {
    state = stateMap[state.toLowerCase()] || state.slice(0, 2).toUpperCase();
  }

  return { street, city, state: state.toUpperCase(), county: "" };
}

export async function lookupProperty(fullAddress: string): Promise<RealieProperty | null> {
  const { street, state, city } = parseAddress(fullAddress);
  
  const params = new URLSearchParams({ address: street, state });
  if (city) params.set("city", city);
  
  const res = await fetch(`/api/property?${params.toString()}`);
  if (!res.ok) return null;
  
  const data = await res.json();
  return data.property || null;
}