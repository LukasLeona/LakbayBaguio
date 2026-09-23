import { NextResponse } from "next/server";

/**
 * Retained as a compatibility response for older cached planner clients.
 * Geoapify autocomplete now includes the coordinates needed by the planner,
 * so current clients never call a separate details endpoint.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Select the accommodation again to refresh its map pin." },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
