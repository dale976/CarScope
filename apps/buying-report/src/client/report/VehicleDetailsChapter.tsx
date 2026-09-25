import { VehicleFacts } from '../VehicleStory';
import type { BuyingReport } from '../../shared/report';
import { EvSection } from './EvSection';
import { ReportChapter } from './ReportChapter';

export function VehicleDetailsChapter({ report }: { report: BuyingReport }) {
  return (
    <ReportChapter
      number="01"
      title="Vehicle details"
      intro="The model specifications and practical facts returned for this vehicle."
    >
      {report.detail && <VehicleFacts detail={report.detail} />}
      {report.ev && <EvSection ev={report.ev} />}
      {report.evidence &&
        (report.evidence.tyres.length > 0 ? (
          <section className="data-card">
            <div className="data-card-heading">
              <div>
                <p className="eyebrow">Tyre fitment</p>
                <h3>Tyre sizes for this model</h3>
              </div>
              <p>
                <strong>Why this matters</strong> Correct size, rating and pressure affect
                replacement cost, safety and availability.
              </p>
            </div>
            {report.evidence.tyres.map((t) => (
              <div className="tyre-row" key={`${t.axle}-${t.size}`}>
                <div>
                  <span>{t.axle}</span>
                  <strong>
                    {t.size} · {t.rating}
                  </strong>
                </div>
                <small>
                  {t.runFlat === true
                    ? 'Run-flat'
                    : t.runFlat === false
                      ? 'Not run-flat'
                      : 'Run-flat status unavailable'}
                  {t.pressure ? ` · ${t.pressure}` : ''}
                </small>
              </div>
            ))}
            <p className="action-note">
              <strong>What to do next</strong> Confirm these model fitments against the tyres
              actually fitted and inspect their condition.
            </p>
          </section>
        ) : (
          <section className="data-card">
            <h3>Tyre fitment</h3>
            <p className="empty-data">Tyre fitment unavailable in the supplied data.</p>
          </section>
        ))}
    </ReportChapter>
  );
}
