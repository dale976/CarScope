import { AppError } from '../errors';
import { normalizeDvlaVehicle } from './normalize';

export type DvlaConfig = { apiKey: string; environment: 'development' | 'production' };
type Fetcher = (url: string | URL, init?: RequestInit) => Promise<Response>;
export function readDvlaConfig(env: Record<string, string | undefined> = process.env): DvlaConfig {
  const environment = env.DVLA_ENVIRONMENT ?? 'development';
  if (environment !== 'development' && environment !== 'production')
    throw new Error('DVLA_ENVIRONMENT must be development or production.');
  const apiKey =
    (environment === 'production' ? env.DVLA_PROD_API_KEY : env.DVLA_TEST_API_KEY)?.trim() ||
    env.DVLA_API_KEY?.trim();
  if (!apiKey) throw new Error('DVLA_API_KEY is required.');
  return { apiKey, environment };
}
export function createDvlaClient(
  config: DvlaConfig,
  options: { fetcher?: Fetcher; now?: () => number } = {},
) {
  if (!config.apiKey.trim() || !['development', 'production'].includes(config.environment))
    throw new Error('Invalid DVLA configuration.');
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? Date.now;
  let nextRequest = -Infinity;
  const host =
    config.environment === 'production'
      ? 'driver-vehicle-licensing.api.gov.uk'
      : 'uat.driver-vehicle-licensing.api.gov.uk';
  return {
    async lookup(input: string) {
      const registration = input.toUpperCase().replace(/\s/g, '');
      if (!/^[A-Z0-9]{2,8}$/.test(registration))
        throw new AppError('INVALID_REGISTRATION', 422, 'Enter a valid UK registration.');
      const time = now();
      if (time < nextRequest)
        throw new AppError('DVLA_BUSY', 429, 'DVLA is busy. Please try again shortly.');
      nextRequest = time + 500;
      let response: Response;
      try {
        response = await fetcher(`https://${host}/vehicle-enquiry/v1/vehicles`, {
          method: 'POST',
          headers: {
            'x-api-key': config.apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ registrationNumber: registration }),
          redirect: 'error',
          signal: AbortSignal.timeout(15_000),
        });
      } catch {
        throw new AppError('DVLA_UNAVAILABLE', 502, 'DVLA is unavailable. Please try again later.');
      }
      if (response.status === 404)
        throw new AppError('DVLA_NOT_FOUND', 404, 'Vehicle not found in DVLA records.');
      if (response.status === 429)
        throw new AppError('DVLA_BUSY', 429, 'DVLA is busy. Please try again later.');
      if (!response.ok)
        throw new AppError('DVLA_UNAVAILABLE', 502, 'DVLA is unavailable. Please try again later.');
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw new AppError('DVLA_INVALID', 502, 'DVLA returned invalid vehicle data.');
      }
      return normalizeDvlaVehicle(body, registration);
    },
  };
}
