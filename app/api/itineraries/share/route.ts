import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { isPlannedItinerary } from "@/lib/shared-itinerary";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requestIpAddress } from "@/lib/turnstile";

export const runtime = "nodejs";

const SHARE_BUCKET = "shared-itineraries";
const MAX_PAYLOAD_BYTES = 262_144;
const MAX_SHARES_PER_HOUR = 5;

function isAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    return hostname === "baguiobuddy.com"
      || hostname === "www.baguiobuddy.com"
      || hostname === "localhost"
      || hostname === "127.0.0.1"
      || hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

async function ensureShareBucket(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  const { data } = await supabase.storage.getBucket(SHARE_BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(SHARE_BUCKET, {
    public: false,
    fileSizeLimit: MAX_PAYLOAD_BYTES,
    allowedMimeTypes: ["application/json", "text/plain"],
  });
  if (error && !error.message.toLowerCase().includes("already exists")) throw error;
}

function rateLimitPath(request: Request) {
  const hour = new Date().toISOString().slice(0, 13).replace(/[-T:]/g, "");
  const address = requestIpAddress(request) || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_URL || "baguio-buddy";
  const fingerprint = createHash("sha256").update(`${salt}:${address}:${userAgent}`).digest("hex").slice(0, 32);
  return `rate/${hour}/${fingerprint}`;
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: "This share request is not allowed." }, { status: 403 });
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "A JSON itinerary is required." }, { status: 415 });
  }

  const text = await request.text();
  if (!text || Buffer.byteLength(text, "utf8") > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "This itinerary is too large to share." }, { status: 413 });
  }

  let itinerary: unknown;
  try {
    itinerary = (JSON.parse(text) as { itinerary?: unknown }).itinerary;
  } catch {
    return NextResponse.json({ error: "The itinerary could not be read." }, { status: 400 });
  }
  if (!isPlannedItinerary(itinerary) || itinerary.days.length > 5 || itinerary.title.length > 120 || itinerary.id.length > 100) {
    return NextResponse.json({ error: "The itinerary is incomplete or invalid." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Sharing is not configured yet." }, { status: 503 });

  try {
    await ensureShareBucket(supabase);
    const ratePath = rateLimitPath(request);
    const { data: recentShares, error: rateError } = await supabase.storage.from(SHARE_BUCKET).list(ratePath, { limit: MAX_SHARES_PER_HOUR });
    if (rateError) throw rateError;
    if ((recentShares?.length || 0) >= MAX_SHARES_PER_HOUR) {
      return NextResponse.json({ error: "You’ve created several links this hour. Please try again a little later." }, { status: 429 });
    }

    const token = randomBytes(16).toString("hex");
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 90 * 24 * 60 * 60 * 1000);
    const payload = JSON.stringify({ itinerary, created_at: createdAt.toISOString(), expires_at: expiresAt.toISOString() });
    const { error: uploadError } = await supabase.storage.from(SHARE_BUCKET).upload(`itineraries/${token}.json`, payload, {
      contentType: "application/json",
      cacheControl: "0",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const marker = `${ratePath}/${token}.txt`;
    const { error: markerError } = await supabase.storage.from(SHARE_BUCKET).upload(marker, createdAt.toISOString(), {
      contentType: "text/plain",
      cacheControl: "0",
      upsert: false,
    });
    if (markerError) console.error("Could not record shared-itinerary rate marker", markerError);

    return NextResponse.json({ token }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Shared itinerary creation failed", error);
    return NextResponse.json({ error: "The private link could not be created. Please try again." }, { status: 500 });
  }
}
