import { projectReportPreview, type VehiclePreview } from '../shared/preview';
import { requestPackage } from './provider/client';
import { buildReport } from './provider/build-report';
import {
  COMPLETION_PACKAGE_NAMES,
  type Fetcher,
  type PackageName,
  type ProviderVehicleDetails,
} from './provider/types';

export type { Fetcher, ProviderVehicleDetails } from './provider/types';

export function validateSandboxRegistration(value: string) {
  const registration = value.toUpperCase().replace(/\s/g, '');
  if (!/^[A-Z0-9]{2,8}$/.test(registration)) throw new Error('Enter a valid UK registration.');
  if (!registration.includes('A'))
    throw new Error(
      'The development service can only search registrations containing the letter A.',
    );
  return registration;
}

export async function lookupSandboxReport(
  registrationInput: string,
  options: { apiKey: string; fetcher?: Fetcher },
) {
  const identified = await lookupSandboxPreview(registrationInput, options);
  return completeSandboxReport(
    identified.preview.registration,
    identified.details,
    options,
    identified.previewData,
  );
}

export async function lookupSandboxPreview(
  registrationInput: string,
  options: { apiKey: string; fetcher?: Fetcher },
): Promise<{
  preview: Omit<VehiclePreview, 'previewId'>;
  details: ProviderVehicleDetails;
  previewData: ProviderVehicleDetails;
}> {
  const registration = validateSandboxRegistration(registrationInput);
  const fetcher = options.fetcher ?? fetch;
  let previewData: ProviderVehicleDetails;
  try {
    previewData = await requestPackage('CarScopeFree', registration, options.apiKey, fetcher);
  } catch {
    throw new Error(
      'The development service could not identify the vehicle because vehicle details were unavailable.',
    );
  }
  const report = buildReport(
    registration,
    previewData,
    previewData,
    undefined,
    undefined,
    [],
    false,
  );
  const { previewId: _, ...preview } = projectReportPreview(report, 'server-only', 'live');
  return { preview, details: previewData, previewData };
}

export async function completeSandboxReport(
  registrationInput: string,
  details: ProviderVehicleDetails,
  options: { apiKey: string; fetcher?: Fetcher },
  previewData: ProviderVehicleDetails = {},
) {
  const registration = validateSandboxRegistration(registrationInput);
  const fetcher = options.fetcher ?? fetch;
  const settled = await Promise.allSettled(
    COMPLETION_PACKAGE_NAMES.map((name) =>
      requestPackage(name, registration, options.apiKey, fetcher),
    ),
  );
  const results = new Map<PackageName, ProviderVehicleDetails>();
  const missing: string[] = [];
  settled.forEach((result, index) => {
    const packageName = COMPLETION_PACKAGE_NAMES[index];
    if (!packageName) return;
    if (result.status === 'fulfilled') results.set(packageName, result.value);
    else missing.push(`${packageName} unavailable for this report.`);
  });
  const vdi = { ...previewData, ...(results.get('VDICheck') ?? {}) };
  return buildReport(
    registration,
    details,
    vdi,
    results.get('ValuationDetails'),
    results.get('TyreDetails'),
    missing,
    results.has('VDICheck'),
  );
}
