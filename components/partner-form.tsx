"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, MailCheck, Send, X } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BusinessInquiryEmail, sendBusinessInquiryEmail } from "@/lib/emailjs-browser";
import { TurnstileWidget, turnstileEnabled } from "./turnstile-widget";

type FormState = "idle" | "submitting" | "success" | "error";

export function PartnerForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1);
  const [turnstileToken, setTurnstileToken] = useState("");

  function continueToPlace() {
    const form = formRef.current;
    if (!form) return;
    const fields = Array.from(form.querySelectorAll<HTMLElement>("[data-form-step='1'] input, [data-form-step='1'] select"));
    const invalidField = fields.find((field) => "checkValidity" in field && !(field as HTMLInputElement).checkValidity());
    if (invalidField) {
      (invalidField as HTMLInputElement).reportValidity();
      return;
    }
    setMessage("");
    setState("idle");
    setStep(2);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (turnstileEnabled && !turnstileToken) {
      setState("error");
      setMessage("Please complete the security check before sending.");
      return;
    }
    setState("submitting");
    setMessage("");
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form).entries());
    const body = { ...fields, turnstileToken };
    try {
      const response = await fetch("/api/restaurant-inquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We could not submit your inquiry.");
      if (result.saved !== true) throw new Error("Your inquiry was not saved. Please clear any browser autofill and try again.");

      const inquiry: BusinessInquiryEmail = {
        businessType: String(fields.businessType || "Restaurant / café"),
        restaurantName: String(fields.restaurantName || ""),
        contactName: String(fields.contactName || ""),
        email: String(fields.email || ""),
        phone: String(fields.phone || ""),
        address: String(fields.address || ""),
        socialUrl: String(fields.socialUrl || ""),
        message: String(fields.message || ""),
      };

      try {
        await sendBusinessInquiryEmail(inquiry);
        setMessage("Your inquiry is in Luke’s inbox and saved for review. We’ll contact you using the details provided.");
      } catch (notificationError) {
        console.error("Business inquiry email notification failed", notificationError);
        setMessage("Your inquiry was saved for review, but the email alert could not be sent. You don’t need to submit it again.");
      }
      setState("success");
      form.reset();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "We could not submit your inquiry.");
    }
  }

  if (state === "success") {
    return (
      <div className="form-success" role="status">
        <button className="form-success-close" type="button" onClick={() => router.push("/")} aria-label="Close inquiry"><X /></button>
        <div className="success-mark"><CheckCircle2 size={31} /></div>
        <span>Inquiry received</span>
        <h2>Salamat, we got it.</h2>
        <p>{message}</p>
        <div className="form-success-note">
          <MailCheck />
          <div><strong>What happens next</strong><span>We’ll review your details first, then follow up using the contact information you shared.</span></div>
        </div>
        <div className="form-success-actions">
          <button className="button secondary" type="button" onClick={() => { setState("idle"); setStep(1); setTurnstileToken(""); }}>Send another</button>
          <button className="button primary" type="button" onClick={() => router.push("/")}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} className="partner-form" onSubmit={submit}>
      <div className="partner-form-progress" aria-label={`Step ${step} of 2`}><span className={step >= 1 ? "active" : ""}>1</span><i className={step === 2 ? "active" : ""} /><span className={step === 2 ? "active" : ""}>2</span><strong>{step === 1 ? "Business & contact" : "Place details"}</strong></div>

      <div className={`partner-form-step ${step === 1 ? "active" : ""}`} data-form-step="1" aria-hidden={step !== 1}>
        <label><span>Business type *</span><select name="businessType" required defaultValue="Restaurant / café"><option>Restaurant / café</option><option>Hotel / stay</option><option>Tour / activity</option><option>Local shop</option><option>Other local business</option></select></label>
        <label><span>Business name *</span><input name="restaurantName" required minLength={2} maxLength={100} autoComplete="organization" placeholder="Your place in Baguio" /></label>
        <div className="form-row">
          <label><span>Contact person *</span><input name="contactName" required minLength={2} maxLength={80} autoComplete="name" placeholder="Full name" /></label>
          <label><span>Phone number</span><input name="phone" type="tel" maxLength={30} autoComplete="tel" placeholder="09xx xxx xxxx" /></label>
        </div>
        <label><span>Email address *</span><input name="email" type="email" required maxLength={160} autoComplete="email" placeholder="you@business.com" /></label>
        <button className="button primary full partner-next" type="button" onClick={continueToPlace}>Continue <ArrowRight /></button>
      </div>

      <div className={`partner-form-step ${step === 2 ? "active" : ""}`} data-form-step="2" aria-hidden={step !== 2}>
        <label><span>Business address *</span><input name="address" required minLength={5} maxLength={240} autoComplete="street-address" placeholder="Street, barangay, Baguio City" /></label>
        <label><span>Website or social page</span><input name="socialUrl" type="url" maxLength={300} placeholder="https://" /></label>
        <label className="honeypot" aria-hidden="true"><span>Leave this blank</span><input name="websiteUrl" tabIndex={-1} autoComplete="off" /></label>
        <label><span>Why should travelers discover you? *</span><textarea name="message" required minLength={20} maxLength={1100} rows={4} placeholder="Share your story, services, price range, opening days, and what makes the experience special." /></label>
        <label className="check-field"><input name="consent" type="checkbox" value="yes" required /><span>I confirm these details are accurate and agree to be contacted about this inquiry.</span></label>
        <TurnstileWidget action="business_inquiry" onToken={setTurnstileToken} />
        {message && <p className={`form-message ${state}`} role="alert">{message}</p>}
        <div className="partner-form-actions"><button className="button secondary" type="button" onClick={() => setStep(1)}><ArrowLeft /> Back</button><button className="button primary submit-button" type="submit" disabled={state === "submitting"}>{state === "submitting" ? <LoaderCircle className="spin" /> : <Send />}{state === "submitting" ? "Sending…" : "Send inquiry"}</button></div>
      </div>
      <p className="form-disclaimer">Private review only. Submission does not guarantee a listing or paid placement.</p>
    </form>
  );
}
