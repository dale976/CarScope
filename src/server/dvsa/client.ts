import { asRecord, readFiniteNumber, readString } from '../provider/guards';
import { normalizeDvsaVehicle, type DvsaVehicle } from './normalize';

export type DvsaConfig = {
  clientId: string;
  clientSecret: string;
  apiKey: string;
  scope: string;
  tokenUrl: string;
};
type Fetcher = (input: string | URL, init?: RequestInit) => Promise<Response>;
const SCOPE = 'https://tapi.dvsa.gov.uk/.default';
const ENDPOINT = 'https://history.mot.api.gov.uk/v1/trade/vehicles/registration/';

function validateConfig(config: DvsaConfig) {
  let url: URL;
  try {
    url = new URL(config.tokenUrl);
  } catch {
    throw new Error('DVSA_TOKEN_URL must be the Microsoft tenant token endpoint.');
  }
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'login.microsoftonline.com' ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^\/[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\/oauth2\/v2\.0\/token$/i.test(url.pathname)
  )
    throw new Error('DVSA_TOKEN_URL must be the Microsoft tenant token endpoint.');
  if (config.scope !== SCOPE) throw new Error('DVSA_SCOPE must be the DVSA API scope.');
  if (![config.clientId, config.clientSecret, config.apiKey].every((value) => value.trim()))
    throw new Error('DVSA credentials must not be blank.');
}

export function readDvsaConfig(env: Record<string, string | undefined> = process.env): DvsaConfig {
  const names = [
    'DVSA_CLIENT_ID',
    'DVSA_CLIENT_SECRET',
    'DVSA_API_KEY',
    'DVSA_SCOPE',
    'DVSA_TOKEN_URL',
  ] as const;
  const missing = names.filter((name) => !env[name]?.trim());
  if (missing.length) throw new Error(`Missing DVSA settings: ${missing.join(', ')}.`);
  const config = {
    clientId: env.DVSA_CLIENT_ID!.trim(),
    clientSecret: env.DVSA_CLIENT_SECRET!.trim(),
    apiKey: env.DVSA_API_KEY!.trim(),
    scope: env.DVSA_SCOPE!.trim(),
    tokenUrl: env.DVSA_TOKEN_URL!.trim(),
  };
  validateConfig(config);
  return config;
}

export function createDvsaClient(
  config: DvsaConfig,
  options: { fetcher?: Fetcher; now?: () => number } = {},
): { lookup: (registration: string) => Promise<DvsaVehicle> } {
  validateConfig(config);
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? Date.now;
  let cached: { value: string; expires: number } | undefined;
  let pending: Promise<string> | undefined;

  async function authenticate(): Promise<string> {
    if (cached && now() < cached.expires) return cached.value;
    if (pending) return pending;
    pending = (async () => {
      try {
        const response = await fetcher(config.tokenUrl, {
          method: 'POST',
          redirect: 'error',
          signal: AbortSignal.timeout(20_000),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: config.clientId,
            client_secret: config.clientSecret,
            scope: config.scope,
          }),
        });
        if (!response.ok) throw new Error();
        const body = asRecord(await response.json());
        const value = readString(body, 'access_token');
        const lifetime = readFiniteNumber(body, 'expires_in');
        if (!value || lifetime === undefined || lifetime <= 0) throw new Error();
        const duration = lifetime * 1000;
        if (!Number.isFinite(duration)) throw new Error();
        cached = { value, expires: now() + duration - Math.min(60_000, duration / 10) };
        return value;
      } catch {
        throw new Error('DVSA authentication failed. Check credentials and service availability.');
      }
    })();
    try {
      return await pending;
    } finally {
      pending = undefined;
    }
  }

  return {
    async lookup(input) {
      const registration = input.toUpperCase().replace(/\s/g, '');
      if (!/^[A-Z0-9]{2,8}$/.test(registration)) throw new Error('Enter a valid UK registration.');
      const token = await authenticate();
      let response: Response;
      try {
        response = await fetcher(`${ENDPOINT}${registration}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-API-Key': config.apiKey,
            Accept: 'application/json',
          },
          redirect: 'error',
          signal: AbortSignal.timeout(20_000),
        });
      } catch {
        throw new Error('DVSA lookup failed. Check network and service availability.');
      }
      if (response.status === 401) cached = undefined;
      if (response.status === 404) throw new Error('Vehicle not found in DVSA records.');
      if (!response.ok) throw new Error(`DVSA lookup failed (HTTP ${response.status}).`);
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw new Error('DVSA returned an invalid vehicle response.');
      }
      return normalizeDvsaVehicle(body, registration);
    },
  };
}
