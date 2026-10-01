import Link from "next/link";
import { ArrowLeft, BadgeCheck, BookOpenCheck, Mail, Route, ShieldCheck } from "lucide-react";
import { pageMetadata, serializeJsonLd, SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About Baguio Buddy & Our Travel-Guide Standards",
  description: "Learn who operates Baguio Buddy, how its Baguio travel information is reviewed, and how to report a correction.",
  path: "/about",
  keywords: ["about Baguio Buddy", "Baguio Buddy travel planner"],
});

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: `About ${SITE_NAME}`,
  url: `${SITE_URL}/about`,
  mainEntity: { "@id": `${SITE_URL}/#organization` },
  description: "How Baguio Buddy creates and reviews practical, commute-aware travel-planning information for Baguio visitors.",
};

export default function AboutPage() {
  return (
    <main id="main-content" className="information-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(aboutJsonLd) }} />
      <div className="shell information-shell">
        <Link className="information-back" href="/"><ArrowLeft /> Back to Home</Link>
        <header className="information-hero">
          <span><BadgeCheck /></span>
          <div><small>ABOUT THE PROJECT</small><h1>Built to make Baguio trips easier</h1><p>Practical planning guidance for travelers who want to explore thoughtfully, especially without a private car.</p></div>
        </header>

        <article className="information-card policy-document">
          <p className="policy-date">Reviewed October 1, 2026</p>
          <p><strong>Baguio Buddy</strong> is an independent travel-planning project operated by Luke Mark Leona. It helps visitors group nearby attractions, plan around hotel times and luggage, and understand the practical steps between stops.</p>

          <h2><Route size={19} /> What we are trying to solve</h2>
          <p>A list of famous tourist spots is not yet an itinerary. Baguio&apos;s hills, traffic, opening hours, queues, luggage, meals, and exact entrances all affect whether a route feels enjoyable. The planner brings those details together while keeping the final choices with the traveler.</p>

          <h2><BookOpenCheck size={19} /> How travel information is reviewed</h2>
          <p>Important operational details are checked against official or first-party sources when they are available. Route and fare estimates are clearly labeled as planning estimates, and the site tells travelers when a loading point, entrance, operating hour, fare, or policy should be confirmed locally.</p>
          <p>Guide pages include their review date. Material changes are updated when they are verified; a date is not changed merely to make older information appear new.</p>

          <h2><ShieldCheck size={19} /> Independence and limitations</h2>
          <p>Baguio Buddy is not the City Government of Baguio, a transport operator, Google Maps, or an official tourism authority. Places and businesses are not automatically ranked because they pay. Weather, traffic, fares, opening hours, and local rules can change after publication.</p>

          <h2>Corrections are welcome</h2>
          <p>If you find an outdated fare, incorrect location, changed operating rule, or unclear route instruction, please send the page URL and the corrected information. Source links or photos of official notices are especially helpful.</p>
          <p className="policy-note">The goal is simple: help a first-time Baguio visitor make a plan they can understand, adjust, and enjoy—not promise that every travel day will go exactly as scheduled.</p>
        </article>

        <aside className="information-contact"><Mail /><div><strong>Report a correction</strong><p>Email <a href="mailto:lukemarkleona9@gmail.com">lukemarkleona9@gmail.com</a>.</p></div></aside>
      </div>
    </main>
  );
}
