import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

interface LatLng {
  lat: number;
  lng: number;
}

const geocodeCache = new Map<string, LatLng | null>();

async function geocode(address: string, key: string): Promise<LatLng | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;
  if (geocodeCache.has(trimmed)) return geocodeCache.get(trimmed) ?? null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}&key=${key}`;
    const response = await fetch(url);
    const body = (await response.json()) as { results?: Array<{ geometry?: { location?: LatLng } }> };
    const location = body.results?.[0]?.geometry?.location ?? null;
    geocodeCache.set(trimmed, location);
    return location;
  } catch {
    geocodeCache.set(trimmed, null);
    return null;
  }
}

async function geocodeMany(addresses: string[], key: string, limit: number): Promise<LatLng[]> {
  const points: LatLng[] = [];
  for (const address of addresses.slice(0, limit)) {
    const point = await geocode(address, key);
    if (point) points.push(point);
  }
  return points;
}

export async function GET(): Promise<NextResponse> {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    return NextResponse.json({ error: "Maps key not configured" }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const [locationsRes, restaurantsRes, vipRes] = await Promise.all([
      supabase.from("courier_locations").select("courier_id, lat, lng, recorded_at").order("recorded_at", { ascending: false }).limit(300),
      supabase.from("restaurants").select("*").eq("is_active", true).limit(25),
      supabase.from("vip_customers").select("*").eq("is_active", true).limit(25)
    ]);

    const courierPoints: LatLng[] = [];
    const seenCourier = new Set<string>();
    for (const row of locationsRes.data ?? []) {
      if (seenCourier.has(row.courier_id)) continue;
      seenCourier.add(row.courier_id);
      if (typeof row.lat === "number" && typeof row.lng === "number") {
        courierPoints.push({ lat: row.lat, lng: row.lng });
      }
    }

    const restaurantAddresses = (restaurantsRes.data ?? []).map((row) => {
      const r = row as { address?: string; street?: string; street_number?: string; city?: string };
      return r.address ?? `${r.street ?? ""} ${r.street_number ?? ""}, ${r.city ?? ""}`;
    });
    const vipAddresses = (vipRes.data ?? []).map((row) => {
      const v = row as { street?: string; street_number?: string; city?: string };
      return `${v.street ?? ""} ${v.street_number ?? ""}, ${v.city ?? ""}`;
    });

    const [restaurantPoints, vipPoints] = await Promise.all([
      geocodeMany(restaurantAddresses, key, 15),
      geocodeMany(vipAddresses, key, 15)
    ]);

    const markerGroups: string[] = [];
    if (courierPoints.length) {
      markerGroups.push(`markers=color:blue|label:C|${courierPoints.map((p) => `${p.lat},${p.lng}`).join("|")}`);
    }
    if (restaurantPoints.length) {
      markerGroups.push(`markers=color:orange|label:R|${restaurantPoints.map((p) => `${p.lat},${p.lng}`).join("|")}`);
    }
    if (vipPoints.length) {
      markerGroups.push(`markers=color:purple|label:V|${vipPoints.map((p) => `${p.lat},${p.lng}`).join("|")}`);
    }

    const base = "https://maps.googleapis.com/maps/api/staticmap?size=640x360&scale=2";
    const hasMarkers = markerGroups.length > 0;
    const center = hasMarkers ? "" : "&center=Israel&zoom=8";
    const staticUrl = `${base}${center}&${markerGroups.join("&")}&key=${key}`;

    const imageResponse = await fetch(staticUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Static map request failed" }, { status: 502 });
    }
    const buffer = await imageResponse.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": imageResponse.headers.get("Content-Type") ?? "image/png",
        "Cache-Control": "public, max-age=60"
      }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
