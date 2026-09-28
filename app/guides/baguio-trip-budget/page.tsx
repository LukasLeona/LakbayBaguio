import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  BusFront,
  Calculator,
  CheckCircle2,
  Clock3,
  Coffee,
  Info,
  MapPin,
  PiggyBank,
  Route,
  ShoppingBag,
  Ticket,
  Utensils,
  WalletCards,
} from "lucide-react";

const canonicalUrl = "https://baguiobuddy.com/guides/baguio-trip-budget";
const updatedDate = "2026-09-29";

export const metadata: Metadata = {
  title: "Baguio Trip Budget: 3D2N Cost Guide and Sample Breakdown",
  description:
    "Estimate a Baguio trip budget for 3 days and 2 nights. Compare backpacker and comfortable ranges for accommodation, food, local transport, attractions, and pasalubong.",
  alternates: { canonical: canonicalUrl },
  authors: [{ name: "Baguio Buddy", url: "https://baguiobuddy.com" }],
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title: "Baguio Trip Budget: A Practical 3D2N Cost Guide",
    description:
      "Build a realistic Baguio budget for accommodation, meals, local transport, entrance fees, pasalubong, and an emergency buffer.",
    siteName: "Baguio Buddy",
    publishedTime: updatedDate,
    modifiedTime: updatedDate,
    images: [
      {
        url: "https://baguiobuddy.com/assets/img/destinations/baguio-city-market.jpg",
        alt: "Baguio City Market, a popular pasalubong stop",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Baguio 3D2N Budget and Sample Expenses",
    description: "Estimate lodging, food, commute, entrance fees, pasalubong, and a contingency fund.",
    images: ["https://baguiobuddy.com/assets/img/destinations/baguio-city-market.jpg"],
  },
};

const budgetCategories = [
  {
    category: "Accommodation for 2 nights",
    icon: BedDouble,
    saver: "₱1,800–₱3,600",
    comfortable: "₱4,000–₱7,000",
    note: "Per room. Weekends, holidays, location, occupancy, and property type can move this much higher.",
  },
  {
    category: "Food for 3 days",
    icon: Utensils,
    saver: "₱1,500–₱2,400",
    comfortable: "₱2,700–₱4,500",
    note: "Per person. Includes regular meals and a few drinks or snacks, but not fine dining or nightlife.",
  },
  {
    category: "Local transport",
    icon: BusFront,
    saver: "₱400–₱800",
    comfortable: "₱900–₱1,800",
    note: "Per person. The lower range assumes more walking and jeepneys; the upper range allows several shared taxi legs.",
  },
  {
    category: "Attractions and activities",
    icon: Ticket,
    saver: "₱300–₱700",
    comfortable: "₱800–₱1,800",
    note: "Per person. Actual cost depends entirely on chosen attractions and optional activities.",
  },
  {
    category: "Pasalubong and shopping",
    icon: ShoppingBag,
    saver: "₱500–₱1,000",
    comfortable: "₱1,500–₱3,000",
    note: "Per person. Set a cap before visiting City Market or Good Shepherd to avoid accidental overspending.",
  },
  {
    category: "Contingency buffer",
    icon: PiggyBank,
    saver: "₱500–₱1,000",
    comfortable: "₱1,000–₱2,000",
    note: "For rain-related taxis, price changes, medicine, schedule changes, or an unplanned meal.",
  },
] as const;

const faqs = [
  {
    question: "How much money should I bring to Baguio for 3 days and 2 nights?",
    answer: "For one traveler paying the full room cost, the sample categories on this page total roughly ₱5,000–₱9,500 for a saver plan or ₱10,900–₱20,100+ for a more comfortable plan, before the round-trip bus fare from your origin. Sharing a room can lower your personal total.",
  },
  {
    question: "Is ₱5,000 enough for a Baguio trip?",
    answer: "It can be possible for a careful traveler when accommodation is inexpensive or shared, most trips use walking or jeepneys, and shopping is limited. Keep the intercity bus fare and an emergency reserve separate.",
  },
  {
    question: "What is usually the biggest Baguio expense?",
    answer: "Accommodation is often the largest fixed cost, especially on weekends and holidays. Food, taxis, and pasalubong can overtake it when spending is not capped.",
  },
  {
    question: "Should I use cash or digital payments in Baguio?",
    answer: "Bring both. Cards and e-wallets may work at many establishments, but small vendors, jeepneys, markets, and temporary network issues can still require cash and small bills.",
  },
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "Baguio Trip Budget: 3D2N Cost Guide and Sample Breakdown",
      description: "A sample Baguio budget covering accommodation, food, local transport, attractions, shopping, and contingency money.",
      datePublished: updatedDate,
      dateModified: updatedDate,
      author: { "@type": "Organization", name: "Baguio Buddy", url: "https://baguiobuddy.com" },
      publisher: { "@type": "Organization", name: "Baguio Buddy", url: "https://baguiobuddy.com" },
      mainEntityOfPage: canonicalUrl,
      image: "https://baguiobuddy.com/assets/img/destinations/baguio-city-market.jpg",
    },
    {
      "@type": "ItemList",
      name: "Baguio trip budget categories",
      numberOfItems: budgetCategories.length,
      itemListElement: budgetCategories.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.category,
        description: `${item.saver} saver range; ${item.comfortable} comfortable range. ${item.note}`,
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://baguiobuddy.com" },
        { "@type": "ListItem", position: 2, name: "Baguio Trip Budget", item: canonicalUrl },
      ],
    },
  ],
};

export default function BaguioTripBudgetPage() {
  return (
    <main id="main-content" className="seo-guide seo-guide-budget">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <section className="section seo-guide-hero">
        <div className="shell seo-guide-hero-inner">
          <nav className="seo-guide-breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Trip budget</span></nav>
          <span className="eyebrow"><WalletCards size={15} /> Cost planning</span>
          <h1>Baguio trip budget: a realistic 3 days and 2 nights cost guide</h1>
          <p className="seo-guide-lead">
            A useful Baguio budget separates the fixed costs from the choices you can control. Start with your room and intercity fare,
            then plan food, local transport, attraction fees, pasalubong, and a buffer for rain or schedule changes.
          </p>
          <div className="seo-guide-meta"><span><Clock3 size={16} /> Updated September 29, 2026</span><span><Calculator size={16} /> Planning ranges in Philippine pesos</span></div>
          <div className="seo-guide-actions">
            <Link href="/plan" className="button lime">Create a trip and estimate fares <ArrowRight size={18} /></Link>
            <Link href="/resources#fares" className="button dark">Review fare references</Link>
          </div>
        </div>
      </section>

      <section className="section seo-guide-budget-answer" aria-labelledby="budget-answer-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow">Quick estimate</span><h2 id="budget-answer-title">How much should one person budget for Baguio?</h2></div>
          <div className="seo-guide-budget-tiers">
            <article>
              <small>Careful saver</small><strong>₱5,000–₱9,500</strong><span>for 3D2N, before the round-trip bus fare from your origin</span>
              <p>Assumes one traveler pays the full budget-room range, uses more walking and jeepneys, eats regular meals, selects paid attractions carefully, and limits shopping.</p>
            </article>
            <article>
              <small>Comfortable traveler</small><strong>₱10,900–₱20,100+</strong><span>for 3D2N, before the round-trip bus fare from your origin</span>
              <p>Allows a better-located room, more taxis, cafés or restaurant meals, additional activities, and a larger shopping allowance.</p>
            </article>
          </div>
          <aside className="seo-guide-callout">
            <Info size={20} />
            <p><strong>These totals are the sum of the six sample categories below, not quoted prices.</strong> They assume one traveler pays the full room amount. If you share, replace that amount with your own room share. Holiday demand, live rates, and personal choices can change the result substantially.</p>
          </aside>
        </div>
      </section>

      <section className="section seo-guide-budget-breakdown" aria-labelledby="breakdown-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow"><Calculator size={15} /> Sample breakdown</span><h2 id="breakdown-title">Baguio 3D2N budget by expense</h2><p>The headline totals above assume one traveler pays the full accommodation range. Accommodation is listed per room; every other category is per person. These are planning allowances reviewed on September 29, 2026—not a live price survey—so replace each amount with a current quote when booking.</p></div>
          <div className="seo-guide-budget-table" role="table" aria-label="Sample Baguio trip budget">
            <div className="seo-guide-budget-row seo-guide-budget-header" role="row">
              <span role="columnheader">Expense</span><span role="columnheader">Saver</span><span role="columnheader">Comfortable</span><span role="columnheader">Planning note</span>
            </div>
            {budgetCategories.map(({ category, icon: Icon, saver, comfortable, note }) => (
              <div className="seo-guide-budget-row" role="row" key={category}>
                <span role="cell"><Icon size={18} /><strong>{category}</strong></span>
                <span role="cell">{saver}</span>
                <span role="cell">{comfortable}</span>
                <span role="cell">{note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section seo-guide-budget-days" aria-labelledby="daily-budget-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow"><Coffee size={15} /> Day-by-day spending</span><h2 id="daily-budget-title">A simple way to divide your cash</h2></div>
          <div className="seo-guide-day-list">
            <article className="seo-guide-day-card">
              <header><span>01</span><div><small>Arrival day</small><h3>Transport, luggage, and the first full route</h3></div></header>
              <p>Set aside local fares, luggage fees if any, lunch, dinner, snacks, and small attraction charges. Keep hotel payment separate so it cannot be spent accidentally.</p>
            </article>
            <article className="seo-guide-day-card">
              <header><span>02</span><div><small>Full sightseeing day</small><h3>Your largest activity and food allowance</h3></div></header>
              <p>Budget for the longest commutes, one or two paid destinations, three meals, drinks, and a taxi fallback if weather changes.</p>
            </article>
            <article className="seo-guide-day-card">
              <header><span>03</span><div><small>Checkout day</small><h3>Market shopping and protected departure money</h3></div></header>
              <p>Use a fixed pasalubong cap. Keep the trip to your exact departure terminal—and your intercity fare if unpaid—untouched until you are on the way home.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section seo-guide-saving-tips" aria-labelledby="saving-title">
        <div className="shell seo-guide-two-column">
          <div>
            <span className="eyebrow"><PiggyBank size={15} /> Spend intentionally</span>
            <h2 id="saving-title">How to lower your Baguio trip cost without making it stressful</h2>
            <ul className="seo-guide-checklist">
              <li><CheckCircle2 size={17} /><span>Group tourist spots by area so you do not pay to cross the city repeatedly.</span></li>
              <li><CheckCircle2 size={17} /><span>Book a practical location, not only the cheapest room far from your route.</span></li>
              <li><CheckCircle2 size={17} /><span>Use jeepneys for verified simple legs and share taxis when transfers become inefficient.</span></li>
              <li><CheckCircle2 size={17} /><span>Carry water and plan meal breaks before hunger turns into convenience spending.</span></li>
              <li><CheckCircle2 size={17} /><span>Set separate digital or envelope limits for food, transport, and pasalubong.</span></li>
              <li><CheckCircle2 size={17} /><span>Keep the contingency fund genuinely untouched unless plans change.</span></li>
            </ul>
          </div>
          <aside className="seo-guide-warning">
            <h3>Do not save by removing every buffer</h3>
            <p>A route that depends on perfect traffic and zero waiting often costs more after a missed reservation, rushed taxi, or rebooked bus. Time is part of the budget.</p>
            <Link href="/guides/baguio-commute-guide">Plan realistic commute legs <ArrowRight size={16} /></Link>
          </aside>
        </div>
      </section>

      <section className="section seo-guide-budget-formula" aria-labelledby="formula-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow"><WalletCards size={15} /> Your total</span><h2 id="formula-title">Use this Baguio budget formula</h2></div>
          <div className="seo-guide-formula">
            <span>Room share</span><b>+</b><span>round-trip bus</span><b>+</b><span>food</span><b>+</b><span>local transport</span><b>+</b><span>activities</span><b>+</b><span>shopping</span><b>+</b><span>10–15% buffer</span>
          </div>
          <p className="seo-guide-formula-note">For two or more people, divide only the expenses actually shared. Do not divide individual fares, meals, tickets, or personal shopping.</p>
        </div>
      </section>

      <section className="section seo-guide-faq" aria-labelledby="faq-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow">Money questions</span><h2 id="faq-title">Baguio trip-budget FAQ</h2></div>
          <div className="seo-guide-faq-list">
            {faqs.map((faq) => <article key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section seo-guide-related" aria-labelledby="related-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow">Build the route</span><h2 id="related-title">Plan what your budget needs to cover</h2></div>
          <div className="seo-guide-related-grid">
            <Link href="/guides/baguio-itinerary-3-days-2-nights"><Route /><span><strong>Baguio 3D2N itinerary</strong><small>See a practical day-by-day route.</small></span><ArrowRight /></Link>
            <Link href="/tourist-spots"><MapPin /><span><strong>Tourist spots in Baguio</strong><small>Choose the places worth budgeting for.</small></span><ArrowRight /></Link>
            <Link href="/resources"><BusFront /><span><strong>Fare and travel resources</strong><small>Review rate sources and commuter notes.</small></span><ArrowRight /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
