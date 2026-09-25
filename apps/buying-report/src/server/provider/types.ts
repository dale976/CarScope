export type SupplierRecord = Record<string, unknown>;
export const PACKAGE_NAMES = [
  'CarScopeFree',
  'VDICheck',
  'ValuationDetails',
  'TyreDetails',
] as const;
export const COMPLETION_PACKAGE_NAMES = ['VDICheck', 'ValuationDetails', 'TyreDetails'] as const;
export type PackageName = (typeof PACKAGE_NAMES)[number];
export type ProviderVehicleDetails = SupplierRecord;
export type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
