"use client";

import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { FormEvent, useState } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

export function PartnerForm() {
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/restaurant-inquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We could not submit your inquiry.");
      setState("success");
      setMessage("Your inquiry is in. We’ll review it and contact you using the details provided.");
      form.reset();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "We could not submit your inquiry.");
    }
  }

  if (state === "success") {
    return <div className="form-success"><CheckCircle2 size={48} /><h2>Salamat!</h2><p>{message}</p><button className="button secondary" type="button" onClick={() => setState("idle")}>Send another inquiry</button></div>;
  }

  return (
    <form className="partner-form" onSubmit={submit}>
      <div className="form-row">
        <label><span>Restaurant name *</span><input name="restaurantName" required minLength={2} maxLength={100} autoComplete="organization" placeholder="Your restaurant" /></label>
        <label><span>Contact person *</span><input name="contactName" required minLength={2} maxLength={80} autoComplete="name" placeholder="Full name" /></label>
      </div>
      <div className="form-row">
        <label><span>Email address *</span><input name="email" type="email" required maxLength={160} autoComplete="email" placeholder="you@restaurant.com" /></label>
        <label><span>Phone number</span><input name="phone" type="tel" maxLength={30} autoComplete="tel" placeholder="09xx xxx xxxx" /></label>
      </div>
      <label><span>Restaurant address *</span><input name="address" required minLength={5} maxLength={240} autoComplete="street-address" placeholder="Street, barangay, Baguio City" /></label>
      <label><span>Website or social page</span><input name="socialUrl" type="url" maxLength={300} placeholder="https://" /></label>
      <label className="honeypot" aria-hidden="true"><span>Leave this blank</span><input name="websiteUrl" tabIndex={-1} autoComplete="off" /></label>
      <label><span>What should travelers know? *</span><textarea name="message" required minLength={20} maxLength={1200} rows={5} placeholder="Tell us about your food, story, price range, opening days, and what makes the experience special." /></label>
      <label className="check-field"><input name="consent" type="checkbox" value="yes" required /><span>I confirm these business details are accurate and agree to be contacted about this inquiry.</span></label>
      {message && <p className={`form-message ${state}`} role="alert">{message}</p>}
      <button className="button primary submit-button" type="submit" disabled={state === "submitting"}>{state === "submitting" ? <LoaderCircle className="spin" /> : <Send size={18} />}{state === "submitting" ? "Sending…" : "Send inquiry"}</button>
      <p className="form-disclaimer">Submission does not guarantee a listing. Features are reviewed for relevance, accuracy, and traveler value.</p>
    </form>
  );
}
