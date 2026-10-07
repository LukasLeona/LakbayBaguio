import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How Baguio Buddy handles itinerary, location, community, shared-trip, and inquiry information.",
  path: "/privacy",
  keywords: ["Baguio Buddy privacy", "Baguio itinerary planner privacy"],
});

export default function PrivacyPage() {
  return (
    <main id="main-content" className="information-page">
      <div className="shell information-shell">
        <Link className="information-back" href="/"><ArrowLeft /> Back to Home</Link>
        <header className="information-hero">
          <span><ShieldCheck /></span>
          <div><small>TRAVELER INFORMATION</small><h1>Privacy policy</h1><p>Clear, practical information about what Baguio Buddy processes and the choices available to you.</p></div>
        </header>

        <article className="information-card policy-document">
          <p className="policy-date">Effective September 18, 2026</p>
          <p>Baguio Buddy is an independent travel-planning application operated by Luke Mark Leona. This notice explains what information the app processes, why it is needed, and the choices available to you.</p>

          <h2>1. Information we process</h2>
          <p><strong>Trip information.</strong> Destinations, dates, starting point, pace, transport preferences, and saved itinerary details you choose to provide. If you create a share link, a read-only copy of that itinerary is stored so people with the private link can open it.</p>
          <p><strong>Nearby and anonymous chat.</strong> A random anonymous identifier and alias, approximate device location while radar is active, conversations, messages, blocks, and safety reports. Your precise coordinate is held in a protected presence record; another traveler receives only a coarse map area and distance band.</p>
          <p><strong>Baguio Wall.</strong> Post text, optional photos, reactions, and private safety reports. Posts and photos are public, but your anonymous account identifier is not displayed. Photos are resized and re-encoded in your browser to remove embedded metadata such as GPS details before upload.</p>
          <p><strong>Contact, business inquiries, and suggestions.</strong> Details you voluntarily submit, plus a private anonymous identifier used to prevent duplicate suggestion votes. The identifier is never displayed publicly.</p>
          <p><strong>Technical information.</strong> Hosting and security providers may process routine request information such as IP address, device or browser details, timestamps, and error logs.</p>

          <h2>2. Why we use it</h2>
          <p>We process information to generate itineraries, provide temporary nearby discovery and chat, answer questions, review local-business submissions, keep the service secure, investigate abuse, and improve reliability.</p>

          <h2>3. Location and Nearby</h2>
          <p>Location access begins only after you activate the radar. It confirms that Nearby is being used around Baguio and finds travelers within the chosen area. You can turn the radar off at any time. Baguio Buddy is not an emergency or tracking service.</p>

          <h2>4. Retention</h2>
          <p>Nearby presence expires shortly after your last active heartbeat or when you go offline. Conversations are removed after 30 minutes of inactivity. Wall posts remain until you delete them or they are hidden during moderation. Shared itinerary links expire after 90 days.</p>

          <h2>5. Services that help run Baguio Buddy</h2>
          <p>Information may be processed by Supabase for application data and anonymous authentication, Vercel for hosting, and EmailJS for inquiry delivery. Map tiles or links may involve MapLibre, OpenStreetMap, Geoapify, or Google Maps. These providers operate under their own terms and privacy notices. Baguio Buddy does not sell personal information.</p>

          <h2>6. Safety, choices, and your rights</h2>
          <p>You can deny location access, go offline, end chats, delete your Wall posts, privately report unsafe content, or avoid submitting optional details. Subject to applicable law, you may ask to access, correct, object to, erase, or obtain a copy of your personal information.</p>

          <h2>7. Children</h2>
          <p>Nearby, anonymous chat, and the public Wall are not intended for children under 18. Contact us if you believe a child submitted personal information.</p>

          <h2>8. Updates and contact</h2>
          <p>Material updates will be reflected by a new effective date. Privacy requests may be sent to <a href="mailto:lukemarkleona9@gmail.com">lukemarkleona9@gmail.com</a>.</p>
          <p className="policy-note">This notice is intended to be clear and practical and is not a substitute for independent legal advice.</p>
        </article>

        <aside className="information-contact"><Mail /><div><strong>Have a privacy question?</strong><p>Email <a href="mailto:lukemarkleona9@gmail.com">lukemarkleona9@gmail.com</a>.</p></div></aside>
      </div>
    </main>
  );
}
