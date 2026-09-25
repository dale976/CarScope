import { HistoryView } from './HistoryView';
import { VehicleFacts, VehiclePortrait } from './VehicleStory';
import type { BuyingReport } from '../shared/report';
import type { ReactNode } from 'react';
import { dateLabel, reportAnchor } from '../shared/history';
import { formatDuration, formatMoney, formatRegistration } from '../domain/formatters';
import { buildTaxDisplay } from '../domain/vehicle-status';
import { buildBuyerBriefing } from '../domain/buyer-briefing';
import { buildRecordOverview } from '../domain/record-overview';
import { BuyerBriefingView } from './report/BuyerBriefing';
import { RecordOverview } from './report/RecordOverview';
function EvSection({ ev }: { ev: NonNullable<BuyingReport['ev']> }) {
  const milesPerKwh = ev.consumptionWhMile ? 1000 / ev.consumptionWhMile : undefined;
  const warranty =
    ev.batteryWarrantyMonths || ev.batteryWarrantyMiles
      ? [
          ev.batteryWarrantyMonths ? `${ev.batteryWarrantyMonths / 12} years` : null,
          ev.batteryWarrantyMiles
            ? `${ev.batteryWarrantyMiles.toLocaleString('en-GB')} miles`
            : null,
        ]
          .filter(Boolean)
          .join(' / ')
      : null;
  return (
    <section className="report-section ev-section">
      <p className="eyebrow">Electric vehicle</p>
      <h2>Battery, range and charging</h2>
      <div className="ev-metrics">
        {ev.usableCapacityKwh != null && (
          <div>
            <strong>{ev.usableCapacityKwh} kWh usable</strong>
            <span>
              {ev.totalCapacityKwh != null
                ? `${ev.totalCapacityKwh} kWh total capacity`
                : 'Total capacity unavailable'}
            </span>
          </div>
        )}
        {ev.consumptionWhMile != null && (
          <div>
            <strong>{ev.consumptionWhMile} Wh/mile</strong>
            <span>{milesPerKwh?.toFixed(2)} miles/kWh · derived from the supplier figure</span>
          </div>
        )}
        {ev.rangeMiles != null && (
          <div>
            <strong>{ev.rangeMiles} miles</strong>
            <span>Supplier zero-emission range figure</span>
          </div>
        )}
        {ev.maxChargeKw != null && (
          <div>
            <strong>{ev.maxChargeKw} kW</strong>
            <span>Maximum charge input</span>
          </div>
        )}
      </div>
      {ev.ports.length > 0 && (
        <div className="charge-ports">
          {ev.ports.map((port) => (
            <div className="charge-port" key={port.type}>
              <div>
                <h3>{port.type}</h3>
                <p>
                  {port.maxKw != null ? `Up to ${port.maxKw} kW` : ''}
                  {port.location ? ` · ${port.location}` : ''}
                </p>
              </div>
              {port.times.length > 0 && (
                <dl>
                  {port.times.map((time) => (
                    <div key={time.powerKw}>
                      <dt>{time.powerKw} kW</dt>
                      <dd>{formatDuration(time.minutes)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="small-note">Supplier average 10–80% charging times.</p>
            </div>
          ))}
        </div>
      )}
      <div className="battery-caution">
        <strong>Battery health not tested</strong>
        <p>
          Capacity, range and charging specifications do not measure this vehicle’s present battery
          degradation or condition.
        </p>
        {warranty && (
          <p>
            Original model battery warranty: {warranty}. This does not confirm remaining cover;
            verify the start date, terms and transferability.
          </p>
        )}
        {ev.superchargerCompatible && (
          <p>
            Tesla Supercharger compatibility is listed by the supplier. Confirm connector support
            and any adaptor requirements for this vehicle.
          </p>
        )}
      </div>
      <p className="small-note">
        Supplier EV specifications{ev.generatedAt ? ` generated ${ev.generatedAt}` : ''}. Charging
        times vary with temperature, battery state, charger output and charge curve.
      </p>
    </section>
  );
}
function Chapter({
  number,
  title,
  intro,
  children,
}: {
  number: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section className="report-chapter" aria-labelledby={`chapter-${number}`}>
      <header className="chapter-heading">
        <span>{number}</span>
        <div>
          <h2 id={`chapter-${number}`}>{title}</h2>
          <p>{intro}</p>
        </div>
      </header>
      {children}
    </section>
  );
}
function FinanceRecordDetails({
  records,
}: {
  records: NonNullable<BuyingReport['financeRecords']>;
}) {
  return (
    <div className="finance-records">
      {records.map((record, index) => (
        <dl key={`${record.company ?? 'finance'}-${record.agreementDate ?? index}`}>
          <div>
            <dt>Agreement type</dt>
            <dd>{record.agreementType ?? 'Not supplied'}</dd>
          </div>
          <div>
            <dt>Finance company</dt>
            <dd>{record.company ?? 'Not supplied'}</dd>
          </div>
          <div>
            <dt>Agreement date</dt>
            <dd>{record.agreementDate ? dateLabel(record.agreementDate) : 'Not supplied'}</dd>
          </div>
          <div>
            <dt>Term</dt>
            <dd>{record.termMonths != null ? `${record.termMonths} months` : 'Not supplied'}</dd>
          </div>
          {record.contactNumber && (
            <div>
              <dt>Lender contact</dt>
              <dd>{record.contactNumber}</dd>
            </div>
          )}
        </dl>
      ))}
    </div>
  );
}
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
      <Chapter
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
      </Chapter>
      <Chapter
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
      </Chapter>
      <Chapter
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
      </Chapter>
      <Chapter
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
      </Chapter>
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
