import { formatDate, formatRegistration } from '../domain/formatters';
import { buildMotDisplay, buildTaxDisplay } from '../domain/vehicle-status';
import type { DataMode, VehiclePreview } from '../shared/preview';

export function VehiclePreviewCard({
  preview,
  onBack,
  onGenerate,
  busy,
  mode,
}: {
  preview: VehiclePreview;
  onBack: () => void;
  onGenerate: () => void;
  busy: boolean;
  mode: DataMode;
}) {
  const mot = preview.mot;
  const tax = preview.tax;
  const motDisplay = buildMotDisplay(mot);
  const taxDisplay = buildTaxDisplay(tax);
  return (
    <section className="focused-preview" aria-labelledby="preview-title">
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
        </div>
        <strong className="preview-plate">{formatRegistration(preview.registration)}</strong>
      </div>
      <div className="preview-evidence">
        <div className="preview-status" data-state={mot?.status ?? 'unavailable'}>
          <span>MOT status</span>
          <strong>
            {!mot || mot.status === 'unavailable' ? 'MOT status not established' : motDisplay.label}
          </strong>
          <small>{motDisplay.detail}</small>
        </div>
        <div className="preview-status" data-state={tax?.status ?? 'unavailable'}>
          <span>Tax status</span>
          <strong>{tax ? taxDisplay.label : 'Tax status not established'}</strong>
          <small>{taxDisplay.detail}</small>
        </div>
        <div className="preview-coverage">
          <span>History coverage</span>
          <strong>{preview.coverage.message}</strong>
          <small>
            Returned records can contain gaps, particularly for older, imported or exempt vehicles.
          </small>
        </div>
      </div>
      <div className="complete-report-offer">
        <div>
          <p className="eyebrow">Complete buying report</p>
          <h2>See the recorded history in context.</h2>
          <p>
            Review returned finance and insurance records, MOT evidence, valuation, specifications,
            tyres and practical questions for the seller.
          </p>
        </div>
        <div className="offer-action">
          <strong>£9.99</strong>
          <button className="primary" type="button" disabled={busy} onClick={onGenerate}>
            {busy ? 'Preparing report…' : 'View complete report · £9.99'}{' '}
            <span aria-hidden="true">↗</span>
          </button>
          {mode === 'live' && <small>Uses 3 supplier calls</small>}
        </div>
      </div>
      <button type="button" className="text-button preview-back" onClick={onBack}>
        ← Check another registration
      </button>
    </section>
  );
}
