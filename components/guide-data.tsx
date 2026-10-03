import type { ReactNode } from "react";
import { CalendarCheck, ExternalLink, Info, ReceiptText } from "lucide-react";
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
