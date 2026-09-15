import { NextResponse } from "next/server";
import { sendEmailNotification } from "@/lib/email-notifications";

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

  const name = value(body.name, 80);
  const email = value(body.email, 160).toLowerCase();
  const topic = value(body.topic, 80);
  const message = value(body.message, 1200);

  if (name.length < 2 || !emailPattern.test(email) || topic.length < 2 || message.length < 10) {
    return NextResponse.json({ error: "Please complete all fields with valid information." }, { status: 422 });
  }

  try {
    await sendEmailNotification({
      name,
      email,
      subject: `Lakbay Baguio — ${topic}`,
      comments: [`New Lakbay Baguio contact message`, `Topic: ${topic}`, `From: ${name} <${email}>`, "", message].join("\n"),
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Lakbay contact notification error", error);
    return NextResponse.json({ error: "We could not send your message right now. Please try again shortly." }, { status: 502 });
  }
}
