import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/api-rate-limit";
import {
  fetchGeoapifyStaySuggestions,
  normalizeStayQuery,
  searchCuratedStays,
} from "@/lib/stay-places";

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
  if (input.length < 2) return NextResponse.json({ suggestions: [], poweredByGeoapify: false });

  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ suggestions: searchCuratedStays(input), poweredByGeoapify: false, configured: false });
  }

  try {
    const suggestions = await fetchGeoapifyStaySuggestions(input, apiKey);
    return NextResponse.json(
      { suggestions, poweredByGeoapify: suggestions.some((item) => item.source === "geoapify"), configured: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ suggestions: searchCuratedStays(input), poweredByGeoapify: false, configured: true });
  }
}
