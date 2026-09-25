import { HistoryView } from '../HistoryView';
import { VehicleFacts, VehiclePortrait } from '../VehicleStory';
import type { BuyingReport } from '../../shared/report';
import { reportAnchor } from '../../shared/history';
import { formatMoney, formatRegistration } from '../../domain/formatters';
import { buildTaxDisplay } from '../../domain/vehicle-status';
import { buildBuyerBriefing } from '../../domain/buyer-briefing';
import { buildRecordOverview } from '../../domain/record-overview';
import { BuyerBriefingView } from './BuyerBriefing';
import { RecordOverview } from './RecordOverview';
import { ReportChapter } from './ReportChapter';
import { EvSection } from './EvSection';
import { FinanceRecordDetails } from './FinanceRecordDetails';
export function ReportView({ report }: { report: BuyingReport }) {
  const latestMotMileage = [...(report.evidence?.mot ?? [])]
    .sort((a, b) => b.date.localeCompare(a.date))
    .find((item) => item.mileage !== null)?.mileage;
  const mileageSource =
    latestMotMileage === report.vehicle.mileage
      ? 'Latest supplied MOT reading'
      : 'Supplied report mileage';
  const total = report.costs.reduce((sum, c) => sum + c.annualPounds, 0);
  return (
    <article className="report" aria-labelledby="report-title">
      {report.kind === 'fictional-sample' && (
        <div className="sample-note">
          <span className="status-dot" /> Fictional sample — no vehicle checks have been performed.
        </div>
      )}
      <header className="report-heading">
        <div>
          <p className="eyebrow">Your buying brief</p>
          <h1 id="report-title">
            The facts behind
            <br />
            <em>the car.</em>
          </h1>
          <p className="report-purpose">
            A structured view of the vehicle, its recorded history and the costs you can establish
            before viewing it.
          </p>
        </div>
        <span className="report-stamp">
          CARSCOPE
          <br />
          BUYING REPORT
          <br />
          <b>EXAMPLE / 001</b>
        </span>
      </header>
      {report.detail?.image && (
        <VehiclePortrait detail={report.detail} name={report.vehicle.name} />
      )}
      <section className="vehicle-bar" aria-label="Vehicle identified">
        <div>
          <p className="eyebrow">Vehicle identified</p>
          <div className="vehicle-bar-title">
            <h2>{report.vehicle.name}</h2>
          </div>
          <p>
            {report.vehicle.year} <span aria-hidden="true">/</span>{' '}
            {report.vehicle.mileage === null ? (
              'Mileage unavailable'
            ) : (
              <>
                {report.vehicle.mileage.toLocaleString('en-GB')} miles{' '}
                <span aria-hidden="true">/</span> {mileageSource}
              </>
            )}
          </p>
        </div>
        {report.registration && (
          <div className="vehicle-registration">
            <span>Registration</span>
            <strong>{formatRegistration(report.registration)}</strong>
          </div>
        )}
      </section>
      <RecordOverview model={buildRecordOverview(report)} />
      <BuyerBriefingView briefing={buildBuyerBriefing(report)} />
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
      <ReportChapter
        number="02"
        title="History and mileage"
        intro="Recorded events and mileage evidence, shown in date order without filling gaps in the record."
      >
        {report.evidence ? (
          <HistoryView
            detail={report.detail}
            vehicleYear={report.vehicle.year}
            mot={report.evidence.mot}
            events={report.historyEvents}
          />
        ) : (
          <p className="empty-data">No history evidence was supplied.</p>
        )}
        {report.historyNote && (
          <aside className="context-note">
            <strong>What this history cannot confirm</strong>
            <p>{report.historyNote}</p>
          </aside>
        )}
      </ReportChapter>
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
                <strong>Why this matters</strong> This is a partial ownership budget, not a total
                cost forecast.
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
                  <strong>What to do next</strong> Confirm the live tax status and applicable
                  current rate before purchase.
                </p>
              </>
            ) : (
              <p className="empty-data">Tax status and rate unavailable in the supplied data.</p>
            )}
          </section>
        </div>
      </ReportChapter>
      <ReportChapter
        number="04"
        title="Before you buy"
        intro="The checks and questions that remain between this report and a purchase decision."
      >
        <div className="before-buy-grid">
          <section className="data-card checks-card">
            <p className="eyebrow">History checks</p>
            <h3>What was returned</h3>
            {report.checks.map((c) => (
              <div
                className={`check-result ${c.status}`}
                id={`history-check-${reportAnchor(c.name)}`}
                key={c.name}
              >
                <div className="check-row">
                  <span>{c.name}</span>
                  <span className={`check-status ${c.status}`}>
                    {c.status === 'record-returned'
                      ? 'Record returned'
                      : c.status === 'none-returned'
                        ? 'None returned'
                        : 'Not checked'}
                  </span>
                </div>
                {c.status === 'record-returned' && (
                  <>
                    <p>
                      {c.name === 'Finance'
                        ? 'Confirm its current status and obtain evidence of settlement before purchase.'
                        : 'Review the returned record and verify its current status before purchase.'}
                    </p>
                    {c.name === 'Finance' && report.financeRecords?.length ? (
                      <FinanceRecordDetails records={report.financeRecords} />
                    ) : null}
                  </>
                )}
              </div>
            ))}
            <p className="action-note">
              <strong>Why this matters</strong> “None returned” only describes this supplied
              response. It is not a current all-clear.
            </p>
          </section>
          <section className="data-card questions">
            <p className="eyebrow">Questions for the seller</p>
            <h3>Take these with you</h3>
            <ol>
              {report.sellerQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
            <p className="action-note">
              <strong>What to do next</strong> Keep the answers and ask for documents that support
              them.
            </p>
          </section>
        </div>
      </ReportChapter>
      {report.evidence && (
        <section className="report-section">
          <h2>Sources, gaps and assumptions</h2>
          <details>
            <summary>View data notes and inconsistencies</summary>
            <ul>
              {report.evidence.notes.map((n) => (
                <li className="small-note" key={n}>
                  {n}
                </li>
              ))}
            </ul>
          </details>
          <p className="small-note">
            {report.missingData ??
              'Road tax: unavailable. Equipment: unavailable. Servicing and tyre replacement costs: not quoted.'}
          </p>
        </section>
      )}
      <footer className="report-footer">
        <strong>Good questions are a good start.</strong>
        <p>
          A report supports your decision. It does not replace inspecting the car, checking its
          documents or getting independent advice about its condition.
        </p>
        <span>VEHICLE INFORMATION REPORT</span>
      </footer>
    </article>
  );
}
