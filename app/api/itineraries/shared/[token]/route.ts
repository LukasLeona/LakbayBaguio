import { NextResponse } from "next/server";
import { isPlannedItinerary, isShareToken } from "@/lib/shared-itinerary";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const SHARE_BUCKET = "shared-itineraries";

type SharedPayload = { itinerary: unknown; created_at: string; expires_at: string };

function validPayload(value: unknown): value is SharedPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SharedPayload>;
  return isPlannedItinerary(candidate.itinerary)
    && typeof candidate.created_at === "string"
    && typeof candidate.expires_at === "string"
    && Number.isFinite(Date.parse(candidate.created_at))
    && Number.isFinite(Date.parse(candidate.expires_at));
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isShareToken(token)) return NextResponse.json({ error: "Shared itinerary not found." }, { status: 404 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Sharing is not configured yet." }, { status: 503 });

  const { data: databaseRows, error: databaseError } = await supabase.rpc("get_shared_itinerary", { p_share_token: token });
  const databaseRecord = Array.isArray(databaseRows) ? databaseRows[0] as unknown : undefined;
  if (!databaseError && validPayload(databaseRecord)) {
    return NextResponse.json(databaseRecord, { headers: { "Cache-Control": "private, no-store" } });
  }

  const { data: storedFile, error: storageError } = await supabase.storage.from(SHARE_BUCKET).download(`itineraries/${token}.json`);
  if (storageError || !storedFile) return NextResponse.json({ error: "Shared itinerary not found." }, { status: 404 });

  try {
    const payload = JSON.parse(await storedFile.text()) as unknown;
    if (!validPayload(payload) || Date.parse(payload.expires_at) <= Date.now()) {
      return NextResponse.json({ error: "Shared itinerary not found." }, { status: 404 });
    }
    return NextResponse.json(payload, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Shared itinerary not found." }, { status: 404 });
  }
}
