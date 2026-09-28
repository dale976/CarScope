import page from '../client/index.html';
import { createReportApi } from './api';
import { readConfig } from './config';
const config = readConfig();
const server = Bun.serve({
  hostname: config.host,
  port: config.port,
  development: process.env.NODE_ENV !== 'production' ? { hmr: true, console: true } : false,
  routes: { '/': page, '/report': page, '/api/*': createReportApi({ config }) },
  fetch() {
    return new Response('Not found', { status: 404 });
  },
});
console.log(
  `CarScope buying report: ${server.url} | sandbox ${config.sandbox.enabled ? 'enabled' : 'disabled'}`,
);
