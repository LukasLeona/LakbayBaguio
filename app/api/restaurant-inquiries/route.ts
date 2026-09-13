import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function value(input: unknown, max: number) {
  return typeof input === "string" ? input.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (value(body.websiteUrl, 200)) return NextResponse.json({ ok: true });

  const restaurantName = value(body.restaurantName, 100);
  const contactName = value(body.contactName, 80);
  const email = value(body.email, 160).toLowerCase();
  const phone = value(body.phone, 30);
  const address = value(body.address, 240);
  const socialUrl = value(body.socialUrl, 300);
  const message = value(body.message, 1200);
  const consent = body.consent === "yes";

  let socialUrlIsValid = true;
  if (socialUrl) {
    try {
      socialUrlIsValid = ["http:", "https:"].includes(new URL(socialUrl).protocol);
    } catch {
      socialUrlIsValid = false;
    }
  }

  if (restaurantName.length < 2 || contactName.length < 2 || address.length < 5 || message.length < 20 || !emailPattern.test(email) || !socialUrlIsValid || !consent) {
    return NextResponse.json({ error: "Please complete all required fields with valid information." }, { status: 422 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Inquiries are not connected yet. Add the Supabase server settings and try again." }, { status: 503 });
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("restaurant_inquiries")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", oneHourAgo);
  if (countError) return NextResponse.json({ error: "We could not validate your inquiry. Please try again later." }, { status: 500 });
  if ((count || 0) >= 3) return NextResponse.json({ error: "Too many recent inquiries. Please wait before trying again." }, { status: 429 });

  const { error } = await supabase.from("restaurant_inquiries").insert({ restaurant_name: restaurantName, contact_name: contactName, email, phone: phone || null, address, social_url: socialUrl || null, message, consented_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: "We could not save your inquiry. Please try again later." }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
