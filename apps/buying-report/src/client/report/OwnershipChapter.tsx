import { formatMoney } from '../../domain/formatters';
import { buildTaxDisplay } from '../../domain/vehicle-status';
import type { BuyingReport } from '../../shared/report';
import { ReportChapter } from './ReportChapter';

export function OwnershipChapter({ report }: { report: BuyingReport }) {
  const total = report.costs.reduce((sum, cost) => sum + cost.annualPounds, 0);
  return (
    <ReportChapter
      number="03"
      title="Value and ownership"
      intro="Supplier valuation benchmarks and identifiable running costs, with estimates clearly identified."
    >
      {report.costs.length > 0 && (
        <p className="chapter-note">
          Illustrative estimate · assumptions are shown alongside each running cost.
        </p>
      )}
      {report.evidence?.valuation && (
        <p className="chapter-note">
          The supplier does not confirm whether recorded damage history is reflected in these
          figures.
        </p>
      )}
      <div className="ownership-grid">
        <section className="data-card valuation-card">
          <p className="eyebrow">Supplier valuation</p>
          <h3>Market benchmarks</h3>
          {report.evidence?.valuation ? (
            <>
              <p className="data-context">
                Based on {report.evidence.valuation.mileage.toLocaleString('en-GB')} miles ·
                generated {report.evidence.valuation.date}
              </p>
              {report.evidence.valuation.figures.map((v) => (
                <div className="check-row" key={v.label}>
                  <span>{v.label}</span>
                  <strong>{formatMoney(v.value)}</strong>
                </div>
              ))}
              <p className="action-note">
                <strong>Why this matters</strong> These figures give context for the asking price,
                but do not account for today’s exact condition, mileage or history.
              </p>
            </>
          ) : (
            <p className="empty-data">Valuation unavailable in the supplied data.</p>
          )}
        </section>
        {report.costs.length > 0 ? (
          <section className="data-card cost-card">
            <p className="eyebrow">Running costs</p>
            <h3>Known cost assumptions</h3>
            <div className="cost-total">
              <strong>{formatMoney(total)}</strong>
              <span>/ year</span>
            </div>
            <p className="cost-subtotal">
              Partial budget · about {formatMoney(total / 12)} a month
            </p>
            <div className="cost-items">
              {report.costs.map((c) => (
                <details key={c.label}>
                  <summary>
                    <span>{c.label}</span>
                    <b>{formatMoney(c.annualPounds)}</b>
                  </summary>
                  <p>{c.assumption}</p>
                </details>
              ))}
            </div>
            <div className="unpriced">
              <div>
                <span>Insurance</span>
                <b>Personal quote needed</b>
              </div>
            </div>
            <p className="action-note">
              <strong>Why this matters</strong> This is a partial ownership budget, not a total cost
              forecast.
            </p>
          </section>
        ) : (
          <section className="data-card">
            <p className="eyebrow">Consumption</p>
            <h3>Ownership information</h3>
            {report.detail?.economyMpg != null && (
              <div className="cost-total">
                <strong>{report.detail.economyMpg}</strong>
                <span>mpg</span>
              </div>
            )}
            <p className="empty-data">
              Annual running costs are unavailable. Insurance, servicing and repairs require
              separate quotes.
            </p>
          </section>
        )}
        <section className="data-card tax-card">
          <p className="eyebrow">Road tax / VED</p>
          <h3>Tax information</h3>
          {report.tax ? (
            <>
              <div className={`status-banner ${report.tax.status ?? 'unavailable'}`}>
                <span>Tax status</span>
                <strong>{buildTaxDisplay(report.tax).label}</strong>
                <small>{buildTaxDisplay(report.tax).detail}</small>
              </div>
              <p className="data-context">
                Supplier information ·{' '}
                {report.tax.date ? `generated ${report.tax.date}` : 'source date unavailable'}
              </p>
              {report.tax.band && (
                <p>
                  Band {report.tax.band}
                  {report.tax.co2 != null ? ` · ${report.tax.co2} g/km CO₂` : ''}
                </p>
              )}
              {report.tax.rates.map((r) => (
                <div className="check-row" key={r.label}>
                  <span>{r.label}</span>
                  <strong>{formatMoney(r.amount)}</strong>
                </div>
              ))}
              <p className="action-note">
                <strong>What to do next</strong> Confirm the live tax status and applicable current
                rate before purchase.
              </p>
            </>
          ) : (
            <p className="empty-data">Tax status and rate unavailable in the supplied data.</p>
          )}
        </section>
      </div>
    </ReportChapter>
  );
}
