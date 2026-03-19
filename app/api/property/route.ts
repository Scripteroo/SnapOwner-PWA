import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address") || "";
  const state = searchParams.get("state") || "";
  const city = searchParams.get("city") || "";
  const county = searchParams.get("county") || "";

  const apiKey = process.env.REALIE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const params = new URLSearchParams({ address, state });
    if (city) params.set("city", city);
    if (county) params.set("county", county);

    const res = await fetch(
      `https://app.realie.ai/api/public/property/address/?${params.toString()}`,
      { headers: { Authorization: apiKey } }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Realie API error:", res.status, errText);
      return NextResponse.json({ error: "Property not found" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Realie fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch property data" }, { status: 500 });
  }
}