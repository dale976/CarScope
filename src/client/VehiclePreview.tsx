import { formatDate, formatRegistration } from '../domain/formatters';
import { buildMotDisplay, buildTaxDisplay } from '../domain/vehicle-status';
import type { DataMode, ReportAction, VehiclePreview } from '../shared/preview';
import { evidenceDate, OfficialEvidence } from './preview/OfficialEvidence';

export function VehiclePreviewCard({
  preview,
  onBack,
  onGenerate,
  busy,
  mode,
  reportAction = mode === 'mock' ? 'mock' : 'unavailable',
}: {
  preview: VehiclePreview;
  onBack: () => void;
  onGenerate: () => void;
  busy: boolean;
  mode: DataMode;
  reportAction?: ReportAction;
}) {
  const mot = preview.mot;
  const tax = preview.tax;
  const motDisplay = buildMotDisplay(mot);
  const taxDisplay = buildTaxDisplay(tax);
  const official = preview.source === 'official';
  const sandbox = official && mode === 'official' && reportAction === 'sandbox';
  const allowed =
    (sandbox && preview.registration.includes('A')) ||
    (preview.source === 'mock' && mode === 'mock' && reportAction === 'mock');
  return (
    <section className="focused-preview" aria-labelledby="preview-title">
      {preview.official?.testData && (
        <div className="preview-test-notice" role="note">
          <strong>Test data · development preview</strong>
          <p>
            DVLA is using its UAT service with predefined responses. These details must not be
            relied on as current vehicle facts.
          </p>
        </div>
      )}
      <div className="preview-identity">
        <div>
          <p className="eyebrow">Vehicle identified</p>
          <h1 id="preview-title">{preview.vehicle.name}</h1>
          <p className="preview-spec-line">
            {[
              preview.vehicle.year,
              preview.vehicle.fuelType,
              preview.vehicle.transmission,
              preview.vehicle.colour,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {preview.vehicle.registered && (
            <p className="preview-registered">
              First registered {formatDate(preview.vehicle.registered)}
            </p>
          )}
          {official && preview.vehicle.firstRegistered && (
            <p className="preview-registered">
              First registered {evidenceDate(preview.vehicle.firstRegistered)}
            </p>
          )}
        </div>
        <strong className="preview-plate">{formatRegistration(preview.registration)}</strong>
      </div>
      <div className="preview-evidence">
        <div className="preview-status" data-state={mot?.status ?? 'unavailable'}>
          <span>MOT status</span>
          <strong>
            {!mot || mot.status === 'unavailable' ? 'MOT status not established' : motDisplay.label}
          </strong>
          <small>
            {official
              ? mot?.expiry
                ? `Recorded MOT expiry ${evidenceDate(mot.expiry)}`
                : mot?.sourceDate
                  ? `Test recorded ${evidenceDate(mot.sourceDate)}`
                  : 'No expiry date established'
              : motDisplay.detail}
          </small>
          {official && <small>Source: {preview.official?.motSource ?? 'Not established'}</small>}
        </div>
        <div className="preview-status" data-state={tax?.status ?? 'unavailable'}>
          <span>Tax status</span>
          <strong>{tax ? taxDisplay.label : 'Tax status not established'}</strong>
          <small>
            {official
              ? tax?.dueDate
                ? `Tax due ${evidenceDate(tax.dueDate)}`
                : 'No tax due date returned'
              : taxDisplay.detail}
          </small>
          {official && <small>Source: DVLA</small>}
        </div>
        <div className="preview-coverage">
          <span>{official ? 'Latest recorded odometer · DVSA' : 'History coverage'}</span>
          <strong>
            {official
              ? preview.recordedMileage
                ? `${preview.recordedMileage.value.toLocaleString('en-GB')} ${preview.recordedMileage.unit}`
                : 'Reading unavailable'
              : preview.coverage.message}
          </strong>
          <small>
            {official
              ? preview.recordedMileage
                ? `Recorded ${evidenceDate(preview.recordedMileage.date)} · not current mileage`
                : 'A missing reading does not establish the vehicle’s mileage.'
              : 'Returned records can contain gaps, particularly for older, imported or exempt vehicles.'}
          </small>
        </div>
      </div>
      {official && <OfficialEvidence preview={preview} />}
      <div className="complete-report-offer">
        <div>
          <p className="eyebrow">Complete buying report</p>
          <h2>{official ? 'Go beyond MOT and tax.' : 'See the recorded history in context.'}</h2>
          <p>
            {official
              ? 'The planned paid report adds finance, theft and insurance write-off checks, valuation and richer vehicle details where available. None of these checks has been made in this free preview.'
              : 'Review returned finance and insurance records, MOT evidence, valuation, specifications, tyres and practical questions for the seller.'}
          </p>
        </div>
        <div className="offer-action">
          <strong>
            {sandbox
              ? 'No payment · sandbox test'
              : official
                ? 'Planned price · £9.99'
                : 'Example report · no payment'}
          </strong>
          <button
            className="primary"
            type="button"
            disabled={busy || !allowed}
            onClick={onGenerate}
          >
            {busy
              ? 'Preparing report…'
              : sandbox
                ? 'Generate test report'
                : official
                  ? 'Full report · coming soon'
                  : 'View example report'}{' '}
            <span aria-hidden="true">↗</span>
          </button>
          {sandbox && (
            <small>
              Explicitly requests a VDG sandbox report. No payment is taken. The sandbox supports
              registrations containing A; its data is not for purchasing decisions.
            </small>
          )}
          {official && !sandbox && (
            <small>
              Paid reports are not connected yet. No payment or paid data lookup has occurred.
            </small>
          )}
        </div>
      </div>
      <button type="button" className="text-button preview-back" onClick={onBack}>
        ← Check another registration
      </button>
    </section>
  );
}
