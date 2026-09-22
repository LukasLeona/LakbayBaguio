import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/api-rate-limit";
import {
  fetchStaySuggestions,
  normalizeStayQuery,
  searchCuratedStays,
  validSessionToken,
} from "@/lib/google-places";

export async function GET(request: Request) {
  const limit = consumeRateLimit(request, "places-autocomplete", 45, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many accommodation searches. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const url = new URL(request.url);
  const input = normalizeStayQuery(url.searchParams.get("input") || "");
  const sessionToken = url.searchParams.get("sessionToken") || "";
  if (input.length < 2) return NextResponse.json({ suggestions: [], poweredByGoogle: false });
  if (!validSessionToken(sessionToken)) {
    return NextResponse.json({ error: "Invalid accommodation search session." }, { status: 422 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ suggestions: searchCuratedStays(input), poweredByGoogle: false, configured: false });
  }

  try {
    const suggestions = await fetchStaySuggestions(input, sessionToken, apiKey);
    return NextResponse.json(
      { suggestions, poweredByGoogle: suggestions.some((item) => item.source === "google"), configured: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ suggestions: searchCuratedStays(input), poweredByGoogle: false, configured: true });
  }
}
