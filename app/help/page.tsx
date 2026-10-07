import Link from "next/link";
import { ArrowLeft, CircleHelp, Mail } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Baguio Buddy Help & Itinerary Planner FAQs",
  description: "Answers about the Baguio itinerary generator, commute estimates, nearby suggestions, anonymous chat, and the Baguio Wall.",
  path: "/help",
  keywords: ["Baguio itinerary planner help", "Baguio Buddy FAQ", "Baguio route planner questions"],
});

const faqs = [
  ["How does the itinerary generator work?", "Choose your starting point, dates, destinations, travel style, and transport options. Baguio Buddy groups nearby stops and builds a route with estimated travel time, fares, directions, meal breaks, hotel timing, and pacing safeguards."],
  ["Can I add a suggested place from the itinerary preview?", "Yes. When a day has safe extra time, Before we lock it in shows nearby places that fit that day. Select Add and the route, timing, distance, and fare are recalculated without returning to Edit choices."],
  ["Are fares and travel times guaranteed?", "No. They are planning estimates. Traffic, weather, queues, terrain, transport availability, and operator pricing can change. Confirm important details locally before leaving."],
  ["Why was a selected place left outside a day?", "Tap that place under Your remaining selected places to see the day-by-day reason. Common reasons include distance, opening hours, checkout timing, fixed hotel stops, or insufficient safe travel time."],
  ["Does Nearby reveal my exact location?", "No exact coordinate is shown to another traveler. Nearby uses your location to verify that you are around Baguio and returns only a rounded map area and distance band."],
  ["How do anonymous chats work?", "Baguio Buddy creates a random travel name instead of a public profile. Either traveler can report, block, or end a conversation, and chats are automatically removed after 30 minutes of inactivity."],
  ["What can I share on the Baguio Wall?", "Share a Baguio experience as text, a photo, or both. Avoid faces, contact details, live locations, and anything that could identify another person."],
  ["How do I change my selected destinations?", "Open Plan to manage all choices. In the preview, you can move a place to another compatible day, temporarily remove it from a day, delete it, or accept a safe nearby suggestion."],
] as const;

export default function HelpPage() {
  return (
    <main id="main-content" className="information-page">
      <div className="shell information-shell">
        <Link className="information-back" href="/"><ArrowLeft /> Back to Home</Link>
        <header className="information-hero">
          <span><CircleHelp /></span>
          <div><small>TRAVELER SUPPORT</small><h1>Help & FAQs</h1><p>Quick answers so you can return to planning your Baguio trip.</p></div>
        </header>
        <section className="information-card information-faqs" aria-label="Frequently asked questions">
          {faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}
        </section>
        <aside className="information-contact"><Mail /><div><strong>Still need help?</strong><p>Email <a href="mailto:lukemarkleona9@gmail.com">lukemarkleona9@gmail.com</a>.</p></div></aside>
      </div>
    </main>
  );
}
