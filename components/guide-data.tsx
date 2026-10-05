import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, ExternalLink, Info, List, ReceiptText, ShieldCheck } from "lucide-react";
import type { DailyPlan, GuideSource, SampleCost } from "@/lib/travel-guide-data";
import { formatPeso } from "@/lib/travel-guide-data";

export function GuideFactGrid({
  facts,
}: {
  facts: readonly { label: string; value: string; detail?: string; icon?: ReactNode }[];
}) {
  return (
    <div className="guide-fact-grid">
      {facts.map((fact) => (
        <article key={fact.label}>
          {fact.icon ? <span className="guide-fact-icon">{fact.icon}</span> : null}
          <small>{fact.label}</small>
          <strong>{fact.value}</strong>
          {fact.detail ? <p>{fact.detail}</p> : null}
        </article>
      ))}
    </div>
  );
}

export function GuideDisclosure({ children }: { children: ReactNode }) {
  return (
    <aside className="guide-disclosure">
      <Info size={20} aria-hidden="true" />
      <div><strong>Read this before using the numbers</strong><p>{children}</p></div>
    </aside>
  );
}

export type GuideTocItem = {
  href: `#${string}`;
  label: string;
  description?: string;
};

export function GuideTableOfContents({ items }: { items: readonly GuideTocItem[] }) {
  return (
    <nav className="guide-toc" aria-labelledby="guide-toc-title">
      <div className="guide-toc-heading">
        <List size={20} aria-hidden="true" />
        <div><small>Jump to an answer</small><h2 id="guide-toc-title">Inside this Baguio guide</h2></div>
      </div>
      <ol>
        {items.map((item, index) => (
          <li key={item.href}>
            <a href={item.href}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span><strong>{item.label}</strong>{item.description ? <small>{item.description}</small> : null}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function GuideByline({
  reviewed,
  scope,
}: {
  reviewed: string;
  scope: string;
}) {
  return (
    <aside className="guide-byline" aria-label="Guide authorship and review information">
      <Image src="/assets/img/kabsat-avatar.svg" alt="Kabsat, Baguio Buddy guide" width={50} height={50} />
      <div>
        <small>Prepared by Baguio Buddy</small>
        <strong>Reviewed for commuter-first trip planning</strong>
        <p>{scope}</p>
      </div>
      <span><ShieldCheck size={17} aria-hidden="true" /> Checked {reviewed}</span>
    </aside>
  );
}

export function GuideVerificationStandard() {
  return (
    <aside className="guide-verification" aria-labelledby="guide-verification-title">
      <div>
        <span><CheckCircle2 size={20} aria-hidden="true" /></span>
        <div><small>How this guide is maintained</small><h2 id="guide-verification-title">Useful planning data, with changing details clearly labeled</h2></div>
      </div>
      <ul>
        <li><strong>Coordinates and clusters</strong><span>Match the same destination records used by the itinerary generator.</span></li>
        <li><strong>Changing details</strong><span>Hours, fees, access, transport, and weather must be reconfirmed close to the trip.</span></li>
        <li><strong>Original utility</strong><span>Advice is organized around realistic routes, luggage, meals, rest, terrain, and commuter transfers.</span></li>
      </ul>
      <p>Found something that changed? <Link href="/suggestions">Send a correction to Kabsat</Link>.</p>
    </aside>
  );
}

export function GuideCostTable({
  costs,
  caption,
  showOptional = true,
}: {
  costs: readonly SampleCost[];
  caption: string;
  showOptional?: boolean;
}) {
  const visibleCosts = showOptional ? costs : costs.filter((cost) => !cost.optional);

  return (
    <div className="guide-table-wrap">
      <table className="guide-data-table">
        <caption>{caption}</caption>
        <thead>
          <tr><th scope="col">Expense</th><th scope="col">For 2</th><th scope="col">Per person</th><th scope="col">How it was estimated</th></tr>
        </thead>
        <tbody>
          {visibleCosts.map((cost) => (
            <tr key={cost.category}>
              <th scope="row" data-label="Expense">{cost.category}{cost.optional ? <small>Optional</small> : null}</th>
              <td data-label="For 2">{formatPeso(cost.totalForTwo)}</td>
              <td data-label="Per person">{formatPeso(cost.perPerson)}</td>
              <td data-label="Basis">{cost.basis}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GuideTimeline({ days }: { days: readonly DailyPlan[] }) {
  return (
    <div className="guide-timeline-list">
      {days.map((day, dayIndex) => (
        <article className="guide-timeline-day" key={day.day}>
          <header>
            <span>0{dayIndex + 1}</span>
            <div><small>{day.day}</small><h3>{day.theme}</h3><p>{day.route}</p></div>
            <strong>{formatPeso(day.localTotalForTwo)}<small>for 2, this day</small></strong>
          </header>
          <div className="guide-timeline-stops">
            {day.stops.map((stop) => (
              <div className="guide-timeline-stop" key={`${day.day}-${stop.time}-${stop.title}`}>
                <time>{stop.time}</time>
                <span aria-hidden="true" />
                <div><h4>{stop.title}</h4><p>{stop.detail}</p></div>
                <small>{stop.costLabel}</small>
              </div>
            ))}
          </div>
          <footer><CalendarCheck size={17} aria-hidden="true" /><p>{day.note}</p></footer>
        </article>
      ))}
    </div>
  );
}

export function GuideSourceList({
  sources,
  reviewed,
}: {
  sources: readonly GuideSource[];
  reviewed: string;
}) {
  return (
    <aside className="guide-source-panel" aria-labelledby="guide-sources-title">
      <div className="guide-source-heading">
        <ReceiptText size={21} aria-hidden="true" />
        <div><h2 id="guide-sources-title">Sources and price-check notes</h2><p>Links checked {reviewed}. Open the original source before paying or traveling.</p></div>
      </div>
      <div className="guide-source-list">
        {sources.map((source) => (
          <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
            <span><strong>{source.label}</strong><small>{source.publisher}</small><p>{source.supports}</p></span>
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        ))}
      </div>
    </aside>
  );
}
