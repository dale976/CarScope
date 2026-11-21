import type { VehiclePreview } from '../shared/preview';
import { AppError } from './errors';
import { type Fetcher, validateSandboxRegistration } from './provider';
import { buildReport } from './provider/build-report';
import { requestPackage } from './provider/client';
import { asRecord } from './provider/guards';

export async function generateSandboxReport(
  input: string,
  preview: VehiclePreview,
  options: { apiKey: string; fetcher?: Fetcher },
) {
  const registration = validateSandboxRegistration(input);
  if (preview.registration !== registration || preview.source !== 'official')
    throw new AppError('PREVIEW_MISMATCH', 409, 'Preview does not match the requested report.');
  const fetcher = options.fetcher ?? fetch;
  const vdi = await requestPackage('VDICheck', registration, options.apiKey, fetcher);
  const identification = asRecord(asRecord(vdi.VehicleDetails)?.VehicleIdentification);
  const model = asRecord(asRecord(vdi.ModelDetails)?.ModelIdentification);
  const returnedRegistration = identification?.Vrm ?? identification?.RegistrationNumber;
  const normalize = (value: string) =>
    value
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, ' ')
      .trim();
  const compatible = (a: string, b: string) =>
    a === b || a.startsWith(`${b} `) || b.startsWith(`${a} `);
  const modelMismatch = [
    { make: model?.Make ?? identification?.DvlaMake ?? preview.vehicle.make, model: model?.Model },
    {
      make: identification?.DvlaMake ?? model?.Make ?? preview.vehicle.make,
      model: identification?.DvlaModel,
    },
  ].some((identity) => {
    if (typeof identity.model !== 'string' || !identity.model.trim()) return false;
    if (typeof identity.make === 'string' && identity.make.trim()) {
      const make = normalize(identity.make);
      const candidate = normalize(identity.model);
      return !compatible(
        candidate.startsWith(`${make} `) ? candidate : `${make} ${candidate}`,
        normalize(preview.vehicle.name),
      );
    }
    return preview.vehicle.model
      ? !compatible(normalize(identity.model), normalize(preview.vehicle.model))
      : false;
  });
  if (
    modelMismatch ||
    (returnedRegistration !== undefined &&
      (typeof returnedRegistration !== 'string' ||
        returnedRegistration.toUpperCase().replace(/\s/g, '') !== registration)) ||
    [identification?.DvlaMake, model?.Make].some(
      (make) =>
        typeof make === 'string' &&
        make.trim() &&
        preview.vehicle.name.toUpperCase() !== make.trim().toUpperCase() &&
        !preview.vehicle.name.toUpperCase().startsWith(`${make.trim().toUpperCase()} `),
    )
  )
    throw new AppError(
      'IDENTITY_MISMATCH',
      502,
      'VDG vehicle identity does not match the official preview.',
    );

  const names = ['ValuationDetails', 'TyreDetails'] as const;
  const results = await Promise.allSettled(
    names.map((name) => requestPackage(name, registration, options.apiKey, fetcher)),
  );
  const missing = results.flatMap((result, i) =>
    result.status === 'rejected' ? [`${names[i]} unavailable for this report.`] : [],
  );
  missing.push(
    'Official DVLA/DVSA evidence is retained from the preview. VDG enrichment is sandbox data, may be up to 12 months old, and is not for purchasing decisions. No payment has occurred.',
  );
  if (preview.official?.testData)
    missing.push(
      'The original preview includes DVLA UAT test data; it is not current vehicle evidence.',
    );
  if (preview.motHistory?.some((test) => test.odometer.unit?.toLowerCase() !== 'mi'))
    missing.push(
      'Original odometer readings and units are retained in official preview evidence. Report mileage charts use miles only.',
    );
  const report = buildReport(
    registration,
    vdi,
    vdi,
    results[0]?.status === 'fulfilled' ? results[0].value : undefined,
    results[1]?.status === 'fulfilled' ? results[1].value : undefined,
    missing,
    true,
    preview,
  );
  const finance = asRecord(vdi.FinanceDetails)?.FinanceRecordList;
  const writeOffs = asRecord(vdi.MiaftrDetails)?.WriteOffRecordList;
  const validList = (value: unknown) =>
    Array.isArray(value) && value.every((item) => asRecord(item) !== undefined);
  const available = {
    Finance:
      validList(finance) &&
      Array.isArray(finance) &&
      (finance.length === 0 || (report.financeRecords?.length ?? 0) > 0),
    'Stolen status': typeof asRecord(vdi.PncDetails)?.IsStolen === 'boolean',
    'Insurance write-off': validList(writeOffs),
  };
  report.checks = report.checks.map((check) =>
    available[check.name] ? check : { ...check, status: 'not-checked' },
  );
  const unchecked = report.checks.filter((check) => check.status === 'not-checked');
  if (unchecked.length) {
    report.findings = report.findings.filter(
      (finding) => finding.label !== 'No headline issue was identified in the supplied records',
    );
    report.findings.push({
      label: 'Some provenance checks are unavailable',
      text: `${unchecked.map((check) => check.name).join(', ')} could not be established from the sandbox response. Missing data is not a clear result.`,
      source: 'not-checked',
    });
    report.evidence?.notes.push(
      ...unchecked.map(
        (check) => `${check.name} source was missing or malformed; it was not checked.`,
      ),
    );
  }
  return report;
}
