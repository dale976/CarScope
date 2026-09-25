import type { BuyerBriefing } from '../../domain/buyer-briefing';

export function BuyerBriefingView({ briefing }: { briefing: BuyerBriefing }) {
  return (
    <section className="buyer-briefing" aria-labelledby="buyer-briefing-title">
      <header className="briefing-heading">
        <div>
          <p className="eyebrow">Plain-English evidence summary</p>
          <h2 id="buyer-briefing-title">Your buyer briefing</h2>
        </div>
        <span>Generated from this report’s returned records</span>
      </header>
      <div className="briefing-summary">
        <h3>What the records indicate</h3>
        <p>{briefing.summary}</p>
      </div>
      {briefing.priority && (
        <a className="briefing-attention" href={briefing.priority.href}>
          <span>
            <small>{briefing.priority.eyebrow}</small>
            <strong>{briefing.priority.title}</strong>
            <p>{briefing.priority.text}</p>
          </span>
          <b>View evidence ↓</b>
        </a>
      )}
      <div className="briefing-grid">
        <div>
          <h3>Before you view the car</h3>
          <ul>
            {briefing.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
        <div className="briefing-limit">
          <h3>What the records cannot confirm</h3>
          <p>{briefing.limitation}</p>
        </div>
      </div>
      <p className="briefing-note">{briefing.disclosure}</p>
    </section>
  );
}
