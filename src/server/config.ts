import { resolve } from 'node:path';
import { type DvlaConfig, readDvlaConfig } from './dvla/client';
import { type DvsaConfig, readDvsaConfig } from './dvsa/client';

export type ClientRuntimeConfig = { sandboxControls: boolean; officialPreview?: boolean };

export type ServerConfig = {
  environment: 'development' | 'test' | 'production';
  host: string;
  port: number;
  publicOrigin?: string;
  sandbox: { enabled: boolean; apiKey?: string };
  official: { enabled: boolean; dvla?: DvlaConfig; dvsa?: DvsaConfig };
  root: string;
  client: ClientRuntimeConfig;
};

const loopbackHosts = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

function environment(value: string | undefined): ServerConfig['environment'] {
  if (value === undefined || value === '') return 'development';
  if (value === 'production' || value === 'test') return value;
  if (value === 'development') return value;
  throw new Error('NODE_ENV must be development, test or production.');
}

function port(value: string | undefined) {
  const parsed = Number(value ?? 9000);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535)
    throw new Error('PORT must be an integer from 1 to 65535.');
  return parsed;
}

function publicOrigin(value: string | undefined) {
  if (!value) return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('PUBLIC_ORIGIN must be a valid HTTP or HTTPS origin.');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.origin !== value
  )
    throw new Error('PUBLIC_ORIGIN must contain only a valid HTTP or HTTPS origin.');
  return url.origin;
}

export function readConfig(env: Record<string, string | undefined> = process.env): ServerConfig {
  const runtime = environment(env.NODE_ENV);
  const host = env.HOST ?? '127.0.0.1';
  const origin = publicOrigin(env.PUBLIC_ORIGIN);
  const sandboxEnabled = env.VDG_SANDBOX_ENABLED === 'true';
  if (runtime === 'production' && !loopbackHosts.has(host) && !origin)
    throw new Error('PUBLIC_ORIGIN is required for a non-loopback production host.');
  const officialEnabled = env.OFFICIAL_PREVIEW_ENABLED === 'true' && runtime !== 'production';
  const dvlaKey =
    env.DVLA_ENVIRONMENT === 'production' ? env.DVLA_PROD_API_KEY : env.DVLA_TEST_API_KEY;
  const dvla =
    officialEnabled && (dvlaKey?.trim() || env.DVLA_API_KEY?.trim())
      ? readDvlaConfig(env)
      : undefined;
  const dvsaNames = [
    'DVSA_CLIENT_ID',
    'DVSA_CLIENT_SECRET',
    'DVSA_API_KEY',
    'DVSA_SCOPE',
    'DVSA_TOKEN_URL',
  ];
  const dvsa =
    officialEnabled && dvsaNames.every((name) => env[name]?.trim())
      ? readDvsaConfig(env)
      : undefined;
  return {
    environment: runtime,
    host,
    port: port(env.PORT ?? env.REPORT_PORT),
    publicOrigin: origin,
    sandbox: { enabled: sandboxEnabled, apiKey: env.VDG_API_KEY },
    official: { enabled: officialEnabled, dvla, dvsa },
    root: resolve(env.CARSCOPE_ROOT ?? process.cwd()),
    client: { sandboxControls: runtime !== 'production', officialPreview: officialEnabled },
  };
}

export function isAllowedOrigin(request: Request, config: ServerConfig): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  if (config.publicOrigin) return origin === config.publicOrigin;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
