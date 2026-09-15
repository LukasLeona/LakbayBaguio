"use client";

import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  LoaderCircle,
  Mail,
  Menu,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type UtilityView = "menu" | "privacy" | "help" | "contact";
type ContactState = "idle" | "sending" | "success" | "error";

const faqs = [
  {
    question: "How does the itinerary generator work?",
    answer: "Choose your starting point, dates, pace, destinations, and transport preferences. Baguio Buddy arranges them into a practical route with estimated travel time, fares, directions, and suggested activities.",
  },
  {
    question: "Are fares and travel times guaranteed?",
    answer: "No. They are planning estimates. Traffic, weather, queues, transport availability, and operator pricing can change, so confirm important details before travelling.",
  },
  {
    question: "Does Nearby reveal my exact location?",
    answer: "No exact coordinate is shown to another traveler. Nearby uses your location to find people within the selected radius and returns only a rounded map area and distance band. You can go offline at any time.",
  },
  {
    question: "Can I test Nearby outside Baguio?",
    answer: "Yes. The Baguio-only location restriction is temporarily disabled while radar and chat are being tested. It can be restored before public launch.",
  },
  {
    question: "How do anonymous chats work?",
    answer: "Baguio Buddy creates a random travel name instead of asking for a public profile. Either traveler can report, block, or end a conversation. Chats are automatically removed after 30 minutes of inactivity.",
  },
  {
    question: "How do I add or remove a destination?",
    answer: "Use Add to itinerary on a place card, or open Plan to manage all selected stops. You can remove any selected destination before generating the route.",
  },
  {
    question: "Can my local business be featured?",
    answer: "Yes. Use the business inquiry on Home and send accurate information about your place. Every submission is reviewed; submitting does not guarantee a listing or paid placement.",
  },
];

export function UtilityMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<UtilityView>("menu");
  const [contactState, setContactState] = useState<ContactState>("idle");
  const [contactMessage, setContactMessage] = useState("");

  useEffect(() => {
    setOpen(false);
    setView("menu");
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
    window.setTimeout(() => {
      setView("menu");
      setContactState("idle");
      setContactMessage("");
    }, 180);
  }

  function showView(nextView: UtilityView) {
    setView(nextView);
    setContactState("idle");
    setContactMessage("");
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setContactState("sending");
    setContactMessage("");

    try {
      const body = Object.fromEntries(new FormData(form).entries());
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We could not send your message.");
      form.reset();
      setContactState("success");
    } catch (error) {
      setContactState("error");
      setContactMessage(error instanceof Error ? error.message : "We could not send your message.");
    }
  }

  return (
    <div className="mobile-utility">
      <div className="utility-topline">
        <Link href="/" className="utility-brand" aria-label="Baguio Buddy home">
          <img src="/assets/img/favicon.svg" alt="" width="34" height="34" />
          <span><small>Your</small><strong>Baguio Buddy</strong></span>
        </Link>
      </div>
      <button
        className={`utility-trigger ${open ? "open" : ""}`}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="baguio-buddy-utility-sheet"
        onClick={() => open ? closeMenu() : setOpen(true)}
      >
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>

      {open ? (
        <div className="utility-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeMenu();
        }}>
          <section id="baguio-buddy-utility-sheet" className={`utility-sheet view-${view}`} role="dialog" aria-modal="true" aria-label="Baguio Buddy information menu">
            <header className="utility-sheet-header">
              {view !== "menu" ? (
                <button type="button" onClick={() => showView("menu")} aria-label="Back to menu"><ArrowLeft /></button>
              ) : <span className="utility-mark">BB</span>}
              <div>
                <small>{view === "menu" ? "Baguio Buddy" : "Traveler information"}</small>
                <strong>{view === "menu" ? "More for your trip" : view === "privacy" ? "Privacy policy" : view === "help" ? "Help & FAQs" : "Contact us"}</strong>
              </div>
            </header>

            {view === "menu" ? (
              <div className="utility-menu-home">
                <div className="utility-welcome">
                  <span>Good to know</span>
                  <h2>Travel with the details in your pocket.</h2>
                  <p>Privacy, practical answers, and a direct line to the person building Baguio Buddy.</p>
                </div>
                <nav aria-label="Information links">
                  <button type="button" onClick={() => showView("privacy")}><span><ShieldCheck /><i><strong>Privacy policy</strong><small>How location, chats, and inquiries are handled</small></i></span><ChevronRight /></button>
                  <button type="button" onClick={() => showView("help")}><span><CircleHelp /><i><strong>Help & FAQs</strong><small>Quick answers for planning and Nearby</small></i></span><ChevronRight /></button>
                </nav>
                <footer>
                  <p>Still need a hand?</p>
                  <button type="button" onClick={() => showView("contact")}><Mail /> Contact Us</button>
                  <small>Built with care in the Philippines.</small>
                </footer>
              </div>
            ) : null}

            {view === "privacy" ? (
              <article className="utility-scroll privacy-copy">
                <p className="policy-date">Effective September 15, 2026</p>
                <p>Baguio Buddy is an independent travel-planning application operated by Luke Mark Leona. This notice explains what information the app processes, why it is needed, and the choices available to you.</p>

                <h2>1. Information we process</h2>
                <p><strong>Trip information.</strong> Destinations, dates, starting point, pace, transport preferences, and saved itinerary details you choose to provide.</p>
                <p><strong>Nearby and anonymous chat.</strong> A random anonymous identifier and alias, approximate device location while radar is active, chat requests, messages, blocks, and safety reports. Your precise coordinate is held in a protected presence record; another traveler receives only a coarse map area and distance band.</p>
                <p><strong>Contact and business inquiries.</strong> Your name, email address, business details, contact number if supplied, and message.</p>
                <p><strong>Technical information.</strong> Hosting and security providers may process routine request information such as IP address, device/browser details, timestamps, and error logs.</p>

                <h2>2. Why we use it</h2>
                <p>We process information to generate itineraries, provide temporary nearby discovery and chat, answer questions, review local-business submissions, keep the service secure, investigate abuse, and improve reliability. Depending on the activity, the basis is your consent, providing the service you requested, legal obligations, or Baguio Buddy’s legitimate interest in operating a safe service.</p>

                <h2>3. Location and Nearby</h2>
                <p>Location access begins only after you choose to activate radar. It is used to find travelers within the chosen area. When the Baguio-only restriction is enabled, it also confirms that Nearby is being used around Baguio. You can turn radar off at any time. The app is not an emergency or tracking service; never rely on it for personal safety.</p>

                <h2>4. Retention</h2>
                <p>Nearby presence expires shortly after the last active heartbeat or when you go offline. Pending chat requests expire after 24 hours. Conversations are removed after 30 minutes of inactivity, and ending a chat deletes it for both travelers. Business and contact inquiries are kept only as long as reasonably needed for review, response, records, security, or legal requirements.</p>

                <h2>5. Services that help run Baguio Buddy</h2>
                <p>Information may be processed by Supabase for application data and anonymous authentication, Vercel for hosting, and EmailJS for delivering inquiry messages. Map tiles or links may involve MapLibre, OpenStreetMap, or Google Maps. These providers process information under their own terms and privacy notices. Baguio Buddy does not sell personal information.</p>

                <h2>6. Safety, choices, and your rights</h2>
                <p>Reasonable technical and organizational safeguards are used, but no internet service can promise absolute security. You can deny location permission, go offline, end chats, or avoid submitting optional details. Subject to applicable law, you may ask to access, correct, object to, erase, or obtain a copy of your personal information, and you may lodge a complaint with the Philippine National Privacy Commission.</p>

                <h2>7. Children</h2>
                <p>Nearby and anonymous chat are not intended for children under 18. If you believe a child submitted personal information, contact us so it can be reviewed and removed.</p>

                <h2>8. Updates and contact</h2>
                <p>This notice may change as Baguio Buddy’s features or legal obligations change. Material updates will be reflected by a new effective date. Privacy requests may be sent to <a href="mailto:lukemarkleona9@gmail.com">lukemarkleona9@gmail.com</a>.</p>
                <p className="policy-note">This notice is intended to be clear and practical and is not a substitute for independent legal advice.</p>
              </article>
            ) : null}

            {view === "help" ? (
              <div className="utility-scroll faq-list">
                <p className="faq-intro">The quick answers first—so you can get back to Baguio.</p>
                {faqs.map((faq, index) => (
                  <details key={faq.question} open={index === 0}>
                    <summary>{faq.question}<span>+</span></summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
                <div className="faq-contact-card"><Mail /><div><strong>Couldn’t find the answer?</strong><p>Send a message and we’ll point you in the right direction.</p></div><button type="button" onClick={() => showView("contact")}>Contact Us</button></div>
              </div>
            ) : null}

            {view === "contact" ? (
              <div className="utility-contact">
                {contactState === "success" ? (
                  <div className="utility-contact-success" role="status">
                    <CheckCircle2 />
                    <span>Message sent</span>
                    <h2>Salamat!</h2>
                    <p>Your message is headed straight to Luke’s inbox. He’ll reply to the email address you provided.</p>
                    <button className="button primary full" type="button" onClick={closeMenu}>Done</button>
                  </div>
                ) : (
                  <form onSubmit={submitContact}>
                    <div className="contact-form-intro"><span>Direct from the app</span><h2>How can we help?</h2><p>Questions, corrections, privacy requests, or a little travel confusion—send it here.</p></div>
                    <label><span>Your name</span><input name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="Complete name" /></label>
                    <label><span>Email address</span><input name="email" type="email" required maxLength={160} autoComplete="email" placeholder="you@example.com" /></label>
                    <label><span>What is this about?</span><select name="topic" required defaultValue=""><option value="" disabled>Choose a topic</option><option>Trip planning help</option><option>Nearby or chat safety</option><option>Correct a place listing</option><option>Privacy request</option><option>Something else</option></select></label>
                    <label><span>Your message</span><textarea name="message" required minLength={10} maxLength={1200} rows={4} placeholder="Tell us what happened or what you need…" /></label>
                    <label className="honeypot" aria-hidden="true"><span>Leave this blank</span><input name="websiteUrl" tabIndex={-1} autoComplete="off" /></label>
                    {contactMessage ? <p className="form-message error" role="alert">{contactMessage}</p> : null}
                    <button className="button primary full" type="submit" disabled={contactState === "sending"}>{contactState === "sending" ? <LoaderCircle className="spin" /> : <Send />}{contactState === "sending" ? "Sending…" : "Send message"}</button>
                    <small>Sent securely through the same contact channel used on lukasleona.com.</small>
                  </form>
                )}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
