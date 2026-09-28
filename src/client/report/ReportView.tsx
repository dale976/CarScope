import type { BuyingReport } from '../../shared/report';
import { formatRegistration } from '../../domain/formatters';
import { VehiclePortrait } from '../VehicleStory';
import { buildBuyerBriefing } from '../../domain/buyer-briefing';
import { buildRecordOverview } from '../../domain/record-overview';
import { BuyerBriefingView } from './BuyerBriefing';
import { RecordOverview } from './RecordOverview';
import { VehicleDetailsChapter } from './VehicleDetailsChapter';
import { HistoryChapter } from './HistoryChapter';
import { OwnershipChapter } from './OwnershipChapter';
import { BeforeYouBuyChapter } from './BeforeYouBuyChapter';
export function ReportView({ report }: { report: BuyingReport }) {
  const latestMotMileage = [...(report.evidence?.mot ?? [])]
    .sort((a, b) => b.date.localeCompare(a.date))
    .find((item) => item.mileage !== null)?.mileage;
  const mileageSource =
    latestMotMileage === report.vehicle.mileage
      ? 'Latest supplied MOT reading'
      : 'Supplied report mileage';
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
      <VehicleDetailsChapter report={report} />
      <HistoryChapter report={report} />
      <OwnershipChapter report={report} />
      <BeforeYouBuyChapter report={report} />
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
