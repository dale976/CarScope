import { randomUUID } from 'node:crypto';
import { sampleReport } from '../../fixtures/sample-report';
import { projectReportPreview, type VehiclePreview } from '../shared/preview';
import type { BuyingReport } from '../shared/report';
import { isAllowedOrigin, readConfig, type ServerConfig } from './config';
import { createDvlaClient } from './dvla/client';
import { createDvsaClient } from './dvsa/client';
import { AppError, toPublicError } from './errors';
import { withResponseHeaders } from './http';
import type { Logger } from './logger';
import { loadMockReport } from './mock-reports';
import { createOfficialPreview } from './official-preview';
import { createMemoryPreviewSessionStore, type PreviewSessionStore } from './preview-sessions';
import { generateSandboxReport } from './sandbox-report';

type Options = {
  config?: ServerConfig;
  logger?: Logger;
  sessions?: PreviewSessionStore;
  loadMock?: (registration: string) => BuyingReport;
  completeMock?: (report: BuyingReport) => Promise<BuyingReport>;
  identifyOfficial?: (registration: string) => Promise<VehiclePreview>;
  completeOfficial?: (registration: string, preview: VehiclePreview) => Promise<BuyingReport>;
};

const quietLogger: Logger = { info() {}, error() {} };
const json = (value: unknown, init: ResponseInit = {}) => Response.json(value, init);

function registration(value: unknown) {
  const normalized = typeof value === 'string' ? value.toUpperCase().replace(/\s/g, '') : '';
  if (!/^[A-Z0-9]{2,8}$/.test(normalized))
    throw new AppError('INVALID_REGISTRATION', 422, 'Enter a valid UK registration.');
  return normalized;
}

async function body(request: Request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    throw new AppError('UNSUPPORTED_MEDIA_TYPE', 415, 'Use application/json.');
  const text = await request.text();
  if (text.length > 4096)
    throw new AppError('PAYLOAD_TOO_LARGE', 413, 'Request body is too large.');
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new AppError('INVALID_JSON', 400, 'Invalid JSON body.');
  }
}

export function createReportApi(options: Options = {}) {
  const config = options.config ?? readConfig();
  const logger = options.logger ?? quietLogger;
  const sessions = options.sessions ?? createMemoryPreviewSessionStore();
  const loadMock = options.loadMock ?? ((value: string) => loadMockReport(value, config.root));
  const completeMock = options.completeMock ?? (async (report) => report);
  const completeOfficial =
    options.completeOfficial ??
    ((registration: string, preview: VehiclePreview) =>
      generateSandboxReport(registration, preview, { apiKey: config.sandbox.apiKey! }));
  const identifyOfficial =
    options.identifyOfficial ??
    createOfficialPreview({
      dvla: config.official.dvla ? createDvlaClient(config.official.dvla).lookup : undefined,
      dvsa: config.official.dvsa ? createDvsaClient(config.official.dvsa).lookup : undefined,
      testData: config.official.dvla?.environment === 'development',
    });

  async function handle(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === '/api/health') {
      if (request.method !== 'GET')
        return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } });
      return json({ status: 'ok', persistence: 'memory' });
    }
    if (path === '/api/runtime-config') {
      if (request.method !== 'GET')
        return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } });
      return json(config.client);
    }
    if (path === '/api/sample-report') {
      if (request.method !== 'GET')
        return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } });
      return json(sampleReport);
    }
    if (!['/api/report-preview', '/api/report-generate'].includes(path))
      return new Response('Not found', { status: 404 });
    if (request.method !== 'POST')
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
    try {
      if (!isAllowedOrigin(request, config))
        throw new AppError('ORIGIN_FORBIDDEN', 403, 'Request origin is not allowed.');
      const input = await body(request);
      const mode = config.dataMode === 'mock' ? 'mock' : 'official';
      if (input.mode !== undefined && input.mode !== 'mock' && input.mode !== 'official')
        throw new AppError('INVALID_MODE', 422, 'Choose mock or official data mode.');
      if (input.mode !== undefined && input.mode !== mode)
        throw new AppError(
          'DATA_MODE_MISMATCH',
          422,
          'Data source is selected by the server launch configuration. Refresh the page.',
        );
      const reg = registration(input.registration);
      if (path === '/api/report-preview') {
        if (mode === 'mock') {
          const report = loadMock(reg);
          const previewId = await sessions.create({ mode, registration: reg, report });
          return json(projectReportPreview(report, previewId, mode));
        }
        if (!config.official.enabled)
          throw new AppError('OFFICIAL_UNAVAILABLE', 503, 'Official preview is not enabled.');
        const identified = await identifyOfficial(reg);
        if (identified.registration !== reg || identified.source !== 'official')
          throw new AppError(
            'IDENTITY_MISMATCH',
            502,
            'Official preview identity does not match the request.',
          );
        const previewId = await sessions.create({
          mode: 'official',
          registration: reg,
          preview: identified,
        });
        return json({ ...identified, previewId });
      }
      if (
        mode === 'official' &&
        (config.environment === 'production' || !config.sandbox.enabled || !config.sandbox.apiKey)
      )
        throw new AppError(
          'PAID_REPORT_UNAVAILABLE',
          409,
          'Paid full reports are not connected yet. No payment or paid lookup has occurred.',
        );
      const previewId = typeof input.previewId === 'string' ? input.previewId : '';
      if (!previewId)
        throw new AppError(
          'PREVIEW_EXPIRED',
          410,
          'Preview expired or unavailable. Identify the vehicle again.',
        );
      const report = await sessions.complete(previewId, mode, reg, async (session) =>
        session.mode === 'mock'
          ? completeMock(session.report)
          : completeOfficial(reg, session.preview),
      );
      return json(report);
    } catch (error) {
      const result = toPublicError(error);
      return json(result.body, { status: result.status });
    }
  }

  return async (request: Request): Promise<Response> => {
    const started = performance.now();
    const requestId = randomUUID();
    const route = new URL(request.url).pathname;
    const response = withResponseHeaders(await handle(request), config, true);
    const event = {
      event: 'request.complete',
      requestId,
      route,
      status: response.status,
      durationMs: Math.round(performance.now() - started),
    };
    if (response.status >= 500) logger.error(event);
    else logger.info(event);
    return response;
  };
}
