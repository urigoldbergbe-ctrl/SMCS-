import { NextResponse } from "next/server";
import { z } from "zod";

const routeRequestSchema = z.object({
  originAddress: z.string().min(5),
  destinationAddress: z.string().min(5)
});

interface GeocodeResult {
  status: string;
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
}

interface DistanceMatrixResult {
  status: string;
  rows: Array<{
    elements: Array<{
      status: string;
      distance?: { text: string; value: number };
      duration?: { text: string; value: number };
    }>;
  }>;
}

async function geocodeAddress(address: string, apiKey: string): Promise<GeocodeResult> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (!response.ok) throw new Error(`Geocoding failed with status ${response.status}`);
  return (await response.json()) as GeocodeResult;
}

async function estimateDistanceDuration(
  origin: string,
  destination: string,
  apiKey: string
): Promise<DistanceMatrixResult> {
  const url =
    `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}` +
    `&destinations=${encodeURIComponent(destination)}&mode=driving&key=${apiKey}`;
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (!response.ok) throw new Error(`Distance matrix failed with status ${response.status}`);
  return (await response.json()) as DistanceMatrixResult;
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const parsed = routeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid route estimate payload" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Google Maps API key missing",
        warning: "Set GOOGLE_MAPS_API_KEY to enable address validation and ETA estimation."
      },
      { status: 503 }
    );
  }

  try {
    const originGeocode = await geocodeAddress(parsed.data.originAddress, apiKey);
    const destinationGeocode = await geocodeAddress(parsed.data.destinationAddress, apiKey);

    const warnings: string[] = [];
    if (originGeocode.status !== "OK" || originGeocode.results.length === 0) {
      warnings.push("Restaurant address could not be validated.");
    }
    if (destinationGeocode.status !== "OK" || destinationGeocode.results.length === 0) {
      warnings.push("Customer address could not be validated.");
    }

    if (warnings.length > 0) {
      return NextResponse.json(
        {
          validated: false,
          warnings,
          routeEstimate: null
        },
        { status: 200 }
      );
    }

    const originResolved = originGeocode.results[0];
    const destinationResolved = destinationGeocode.results[0];
    if (!originResolved || !destinationResolved) {
      return NextResponse.json(
        {
          validated: false,
          warnings: ["Unable to resolve one or more addresses."],
          routeEstimate: null
        },
        { status: 200 }
      );
    }

    const matrix = await estimateDistanceDuration(
      originResolved.formatted_address,
      destinationResolved.formatted_address,
      apiKey
    );

    const element = matrix.rows[0]?.elements[0];
    if (!element || element.status !== "OK" || !element.distance || !element.duration) {
      return NextResponse.json(
        {
          validated: true,
          warnings: ["Unable to compute route estimate for the given addresses."],
          routeEstimate: null,
          normalizedAddresses: {
            origin: originResolved.formatted_address,
            destination: destinationResolved.formatted_address
          }
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        validated: true,
        warnings: [],
        normalizedAddresses: {
          origin: originResolved.formatted_address,
          destination: destinationResolved.formatted_address
        },
        routeEstimate: {
          distanceText: element.distance.text,
          distanceMeters: element.distance.value,
          durationText: element.duration.text,
          durationSeconds: element.duration.value
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to validate route",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
