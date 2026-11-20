import { formatUkDate } from '../../shared/date';
import type { VehiclePreview } from '../../shared/preview';

export function evidenceDate(value: string): string {
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    return new Intl.DateTimeFormat('en-GB', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${value}-01T00:00:00Z`));
  }
  return formatUkDate(value.replace(' ', 'T')) ?? 'Date unavailable';
}
const sourceLabels = {
  available: 'Records returned',
  unavailable: 'Unavailable',
  'not-found': 'Vehicle not found',
  invalid: 'Response could not be validated',
  unconfigured: 'Not configured',
  busy: 'Temporarily busy',
};

export function OfficialEvidence({ preview }: { preview: VehiclePreview }) {
  const vehicle = preview.vehicle;
  const history = preview.motHistory;
  const facts: [string, string | number | undefined][] = [
    ['Make / model', vehicle.name],
    ['Year of manufacture', vehicle.year ?? undefined],
    [
      'First registration',
      vehicle.firstRegistered ? evidenceDate(vehicle.firstRegistered) : undefined,
    ],
    ['Fuel type', vehicle.fuelType],
    ['Colour', vehicle.colour],
    [
      'Engine capacity',
      vehicle.engineCapacity === undefined
        ? undefined
        : `${vehicle.engineCapacity.toLocaleString('en-GB')} cc`,
    ],
    [
      'CO₂ emissions',
      vehicle.co2Emissions === undefined ? undefined : `${vehicle.co2Emissions} g/km`,
    ],
    ['Euro standard', vehicle.euroStatus],
    ['Type approval', vehicle.typeApproval],
    ['Wheel plan', vehicle.wheelplan],
    [
      'Revenue weight',
      vehicle.revenueWeight === undefined
        ? undefined
        : `${vehicle.revenueWeight.toLocaleString('en-GB')} kg`,
    ],
    [
      'Marked for export',
      vehicle.markedForExport === undefined ? undefined : vehicle.markedForExport ? 'Yes' : 'No',
    ],
    [
      'Marked as scrapped',
      vehicle.markedAsScrapped === undefined ? undefined : vehicle.markedAsScrapped ? 'Yes' : 'No',
    ],
    [
      'Last V5C issued',
      vehicle.dateOfLastV5CIssued ? evidenceDate(vehicle.dateOfLastV5CIssued) : undefined,
    ],
  ];
  return (
    <>
      <section className="preview-detail-section" aria-labelledby="vehicle-facts-title">
        <div className="preview-section-heading">
          <div>
            <p className="eyebrow">The vehicle at a glance</p>
            <h2 id="vehicle-facts-title">Recorded vehicle details</h2>
          </div>
          <span className="preview-source-label">DVLA + DVSA</span>
        </div>
        <dl className="preview-facts-grid">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value ?? <span className="preview-not-returned">Not returned</span>}</dd>
            </div>
          ))}
        </dl>
        <p className="preview-evidence-note">
          Registration dates retain the precision supplied. A V5C issue date does not establish an
          ownership change. Export and scrapped markers are separate from finance, theft and
          insurance write-off checks.
        </p>
      </section>
      <section className="preview-detail-section" aria-labelledby="mot-history-title">
        <div className="preview-section-heading">
          <div>
            <p className="eyebrow">The record over time · DVSA</p>
            <h2 id="mot-history-title">MOT history</h2>
          </div>
          <span className="preview-source-label">{preview.coverage.message}</span>
        </div>
        <p className="preview-evidence-note">
          Test results describe the vehicle on the test date. Advisories may since have been
          repaired; ask for receipts and check its current condition. An MOT pass is not a guarantee
          of roadworthiness.
        </p>
        {history === undefined ? (
          <p className="preview-empty">
            MOT history unavailable. This does not establish whether tests or defects exist.
          </p>
        ) : history.length === 0 ? (
          <p className="preview-empty">
            No MOT tests returned. This does not establish exemption, condition or whether a first
            test is due.
          </p>
        ) : (
          <div className="preview-mot-list">
            {history.map((test, index) => (
              <details
                className="preview-mot-test"
                key={`${test.completedDate}-${index}`}
                open={index === 0}
              >
                <summary>
                  <span className="preview-test-result" data-result={test.result}>
                    {test.result === 'pass'
                      ? 'Pass'
                      : test.result === 'fail'
                        ? 'Fail'
                        : 'Result unknown'}
                  </span>
                  <span className="preview-test-date">
                    {evidenceDate(test.completedDate)}
                    {index === 0 && <small>Latest returned test</small>}
                  </span>
                  <span className="preview-test-mileage">
                    {test.odometer.value !== null && test.odometer.resultType === 'READ'
                      ? `${test.odometer.value.toLocaleString('en-GB')} ${test.odometer.unit ?? '(unit not returned)'}`
                      : 'Odometer reading unavailable'}
                  </span>
                </summary>
                <div className="preview-test-body">
                  {test.expiryDate && (
                    <p>
                      Recorded expiry: <strong>{evidenceDate(test.expiryDate)}</strong>
                    </p>
                  )}
                  {test.defects === undefined ? (
                    <p>Advisory and defect details were not supplied for this test.</p>
                  ) : test.defects.length === 0 ? (
                    <p>
                      No advisories or defects returned for this test. This is a historical record,
                      not a current condition assessment.
                    </p>
                  ) : (
                    <ul className="preview-defect-list">
                      {test.defects.map((defect, i) => (
                        <li
                          key={`${defect.text}-${i}`}
                          data-dangerous={defect.dangerous || undefined}
                        >
                          <span>
                            {defect.dangerous
                              ? 'Dangerous defect'
                              : (defect.type ?? 'Recorded observation')}
                          </span>
                          <p>{defect.text}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
      {preview.official && (
        <section className="preview-provenance" aria-labelledby="source-title">
          <h2 id="source-title">Sources &amp; coverage</h2>
          <dl>
            <div>
              <dt>DVLA · vehicle and tax records</dt>
              <dd>{sourceLabels[preview.official.sources.dvla]}</dd>
            </div>
            <div>
              <dt>DVSA · MOT history and odometer readings</dt>
              <dd>{sourceLabels[preview.official.sources.dvsa]}</dd>
            </div>
            <div>
              <dt>Retrieved</dt>
              <dd>
                {evidenceDate(preview.official.retrievedAt)} at{' '}
                {preview.official.retrievedAt.slice(11, 16)} UTC
              </dd>
            </div>
          </dl>
          {preview.official.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </section>
      )}
    </>
  );
}
