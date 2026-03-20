import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  const apiKey = process.env.GOOGLE_GEOCODING_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Google Geocoding key not configured" }, { status: 500 });
  }

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`,
      { cache: "no-store" }
    );

    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) {
      return NextResponse.json({ error: "No address found", status: data.status }, { status: 404 });
    }

    const result = data.results[0];
    const components = result.address_components || [];

    const get = (type: string) =>
      components.find((c: any) => c.types.includes(type))?.long_name || "";
    const getShort = (type: string) =>
      components.find((c: any) => c.types.includes(type))?.short_name || "";

    const streetNumber = get("street_number");
    const route = get("route");
    const city = get("locality") || get("sublocality_level_1") || get("administrative_area_level_2");
    const state = getShort("administrative_area_level_1");
    const zip = get("postal_code");
    const county = get("administrative_area_level_2");

    const street = streetNumber ? `${streetNumber} ${route}` : route;
    const formatted = [street, city, `${state} ${zip}`].filter(Boolean).join(", ");

    return NextResponse.json({
      formatted,
      street,
      city,
      state,
      zip,
      county,
      placeId: result.place_id,
      locationType: result.geometry?.location_type,
      fullResult: result.formatted_address,
    });
  } catch (err) {
    console.error("Google Geocoding error:", err);
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}