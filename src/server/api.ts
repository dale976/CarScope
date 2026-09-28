import { randomUUID } from 'node:crypto';
import { sampleReport } from '../../fixtures/sample-report';
import { projectReportPreview, type VehiclePreview } from '../shared/preview';
import type { BuyingReport } from '../shared/report';
import { isAllowedOrigin, readConfig, type ServerConfig } from './config';
import { AppError, toPublicError } from './errors';
import { withResponseHeaders } from './http';
import type { Logger } from './logger';
import { loadMockReport } from './mock-reports';
import {
  completeSandboxReport,
  lookupSandboxPreview,
  type ProviderVehicleDetails,
} from './provider';
import { createMemoryPreviewSessionStore, type PreviewSessionStore } from './preview-sessions';

type IdentifiedLive = {
  preview: Omit<VehiclePreview, 'previewId'>;
  details: ProviderVehicleDetails;
  previewData: ProviderVehicleDetails;
};
type Options = {
  config?: ServerConfig;
  logger?: Logger;
  sessions?: PreviewSessionStore;
  loadMock?: (registration: string) => BuyingReport;
  completeMock?: (report: BuyingReport) => Promise<BuyingReport>;
  identifyLive?: (registration: string, options: { apiKey: string }) => Promise<IdentifiedLive>;
  completeLive?: (
    registration: string,
    details: ProviderVehicleDetails,
    options: { apiKey: string },
    previewData: ProviderVehicleDetails,
  ) => Promise<BuyingReport>;
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
  const identifyLive = options.identifyLive ?? lookupSandboxPreview;
  const completeLive = options.completeLive ?? completeSandboxReport;

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
      const mode = input.mode;
      if (mode !== 'mock' && mode !== 'live')
        throw new AppError('INVALID_MODE', 422, 'Choose mock or live data mode.');
      const reg = registration(input.registration);
      if (path === '/api/report-preview') {
        if (mode === 'mock') {
          const report = loadMock(reg);
          const previewId = await sessions.create({ mode, registration: reg, report });
          return json(projectReportPreview(report, previewId, mode));
        }
        if (!config.sandbox.enabled || !config.sandbox.apiKey)
          throw new AppError('LIVE_UNAVAILABLE', 503, 'Live sandbox lookup is not configured.');
        const identified = await identifyLive(reg, { apiKey: config.sandbox.apiKey });
        const previewId = await sessions.create({
          mode,
          registration: reg,
          details: identified.details,
          previewData: identified.previewData,
        });
        return json({ ...identified.preview, previewId });
      }
      const previewId = typeof input.previewId === 'string' ? input.previewId : '';
      if (!previewId)
        throw new AppError(
          'PREVIEW_EXPIRED',
          410,
          'Preview expired or unavailable. Identify the vehicle again.',
        );
      const report = await sessions.complete(previewId, mode, reg, async (session) => {
        if (session.mode === 'mock') return completeMock(session.report);
        if (!config.sandbox.apiKey)
          throw new AppError('LIVE_UNAVAILABLE', 503, 'Live sandbox lookup is not configured.');
        return completeLive(
          reg,
          session.details,
          { apiKey: config.sandbox.apiKey },
          session.previewData,
        );
      });
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
