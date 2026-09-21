import { NextResponse } from "next/server";
import {
  isSupportedGoogleMapsUrl,
  parseGoogleMapsPlaceUrl,
} from "@/lib/google-maps-place";

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 5;
const MAX_URL_LENGTH = 2048;

function inputValue(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, MAX_URL_LENGTH) : "";
}

function safeMapsUrl(value: string, base?: URL) {
  try {
    const url = base ? new URL(value, base) : new URL(value);
    return isSupportedGoogleMapsUrl(url.toString()) ? url : null;
  } catch {
    return null;
  }
}

async function expandGoogleMapsUrl(value: string) {
  const initial = safeMapsUrl(value);
  if (!initial) throw new Error("Paste a valid Google Maps place or share link.");
  let current: URL = initial;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const parsed = parseGoogleMapsPlaceUrl(current.toString());
    if (parsed?.name && parsed.locationPrecision === "pin") return parsed;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7_000);
    let response: Response;
    try {
      response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "BaguioBuddyMapsResolver/1.0",
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!REDIRECT_STATUSES.has(response.status)) {
      const finalParsed = parseGoogleMapsPlaceUrl(current.toString());
      if (finalParsed?.name && finalParsed.locationPrecision === "pin") return finalParsed;
      throw new Error("Open the exact place in Google Maps, tap Share, and paste that link.");
    }

    const location = response.headers.get("location");
    const nextUrl: URL | null = location ? safeMapsUrl(location, current) : null;
    if (!nextUrl) throw new Error("Google Maps returned an unsupported destination.");
    current = nextUrl;
  }

  throw new Error("That Google Maps link redirected too many times.");
}

export async function POST(request: Request) {
  let body: { url?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const url = inputValue(body.url);
  if (!url || !safeMapsUrl(url)) {
    return NextResponse.json(
      { error: "Paste a valid Google Maps place or share link." },
      { status: 422 },
    );
  }

  try {
    const place = await expandGoogleMapsUrl(url);
    return NextResponse.json(
      { place },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch (error) {
    const message = error instanceof Error && error.name !== "AbortError"
      ? error.message
      : "Google Maps took too long to respond. Try again.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
