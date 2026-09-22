import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/api-rate-limit";
import { fetchStayDetails, validPlaceId, validSessionToken } from "@/lib/google-places";

export async function GET(request: Request) {
  const limit = consumeRateLimit(request, "places-details", 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many accommodation selections. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const url = new URL(request.url);
  const placeId = url.searchParams.get("placeId") || "";
  const sessionToken = url.searchParams.get("sessionToken") || "";
  if (!validPlaceId(placeId) || !validSessionToken(sessionToken)) {
    return NextResponse.json({ error: "Invalid accommodation selection." }, { status: 422 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "Accommodation search has not been configured yet." }, { status: 503 });
  }

  try {
    const place = await fetchStayDetails(placeId, sessionToken, apiKey);
    return NextResponse.json({ place }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "We could not open that accommodation." },
      { status: 502 },
    );
  }
}
