import { asRecord, readBoolean, readRecord } from './guards';
import type { Fetcher, PackageName, SupplierRecord } from './types';
import { AppError } from '../errors';

const ENDPOINT = 'https://uk.api.vehicledataglobal.com/r2/lookup';

export async function requestPackage(
  packageName: PackageName,
  registration: string,
  apiKey: string,
  fetcher: Fetcher,
): Promise<SupplierRecord> {
  const url = new URL(ENDPOINT);
  url.searchParams.set('packagename', packageName);
  url.searchParams.set('apikey', apiKey);
  url.searchParams.set('vrm', registration);
  try {
    const response = await fetcher(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok)
      throw new AppError('SUPPLIER_UNAVAILABLE', 502, `${packageName} is temporarily unavailable.`);
    const body = asRecord(await response.json());
    const responseInformation = readRecord(body, 'ResponseInformation');
    const results = readRecord(body, 'Results');
    if (!body || readBoolean(responseInformation, 'IsSuccessStatusCode') === false || !results)
      throw new AppError('SUPPLIER_UNAVAILABLE', 502, `${packageName} returned no usable results`);
    return results;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('SUPPLIER_UNAVAILABLE', 502, `${packageName} is temporarily unavailable.`, {
      cause: error,
    });
  }
}
