import page from '../client/index.html';
import { resolve } from 'node:path';
import { createReportApi } from './api';
import { readConfig } from './config';
import { withResponseHeaders } from './http';
import { createLogger } from './logger';
import { createMemoryPreviewSessionStore } from './preview-sessions';
const config = readConfig();
const logger = createLogger(config);
const sessions = createMemoryPreviewSessionStore();
const api = createReportApi({ config, logger, sessions });
const baseOptions = {
  hostname: config.host,
  port: config.port,
  development: process.env.NODE_ENV !== 'production' ? { hmr: true, console: true } : false,
} as const;

function productionHandler() {
  const files = new Map((page.files ?? []).map((file) => [file.path, file]));
  return async (request: Request) => {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/')) return api(request);
    const bundlePath = path === '/' || path === '/report' ? page.index : `.${path}`;
    const bundled = files.get(bundlePath);
    if (!bundled) return withResponseHeaders(new Response('Not found', { status: 404 }), config);
    return withResponseHeaders(
      new Response(Bun.file(resolve(import.meta.dir, bundled.path)), { headers: bundled.headers }),
      config,
      bundled.loader === 'html',
    );
  };
}

const server =
  config.environment === 'production' && page.files
    ? Bun.serve({ ...baseOptions, fetch: productionHandler() })
    : Bun.serve({
        ...baseOptions,
        routes: { '/': page, '/report': page, '/api/*': api },
        fetch() {
          return withResponseHeaders(new Response('Not found', { status: 404 }), config);
        },
      });
console.log(
  `CarScope buying report: ${server.url} | sandbox ${config.sandbox.enabled ? 'enabled' : 'disabled'}`,
);
