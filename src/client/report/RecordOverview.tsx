import type { RecordOverviewModel } from '../../domain/record-overview';

export function RecordOverview({ model }: { model: RecordOverviewModel }) {
  const statuses = [
    ['MOT status', model.mot],
    ['Tax status', model.tax],
  ] as const;
  return (
    <section className="record-overview" aria-labelledby="record-overview-title">
      <div className="overview-heading">
        <div>
          <p className="eyebrow">At a glance</p>
          <h2 id="record-overview-title">Record overview</h2>
        </div>
        <p>
          This is not a vehicle rating or buying recommendation. It summarises the records returned
          and the checks still outstanding.
        </p>
      </div>
      <div className="current-status-grid">
        {statuses.map(([title, status]) => (
          <div data-state={status.tone} key={title}>
            <span>{title}</span>
            <strong>{status.label}</strong>
            <small>{status.detail}</small>
          </div>
        ))}
      </div>
      <div className="overview-stats">
        {model.stats.map((stat) => (
          <div
            role="group"
            data-tone={stat.tone}
            aria-label={`${stat.value} ${stat.label}`}
            key={stat.label}
          >
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
      {model.attention.length > 0 && (
        <div className="overview-records">
          <h3>Records requiring attention</h3>
          <ul>
            {model.attention.map((item) => (
              <li key={item.href}>
                <a href={item.href}>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                  <small>View record ↓</small>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="overview-guidance">
        <div>
          <h3>Why this matters</h3>
          <p>{model.whyItMatters}</p>
        </div>
        <div>
          <h3>What to do next</h3>
          <p>{model.nextStep}</p>
        </div>
      </div>
      {model.findings.length > 0 && (
        <div className="overview-findings">
          <h3>Points to examine</h3>
          {model.findings.map((finding) => (
            <article key={finding.label}>
              <span className="source-label">{finding.sourceLabel}</span>
              <h4>{finding.label}</h4>
              <p>{finding.text}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
