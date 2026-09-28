import page from '../client/index.html';
import { createReportApi } from './api';
import { readReportConfig } from './config';
const config = readReportConfig();
const server = Bun.serve({
  hostname: config.host,
  port: config.port,
  development: process.env.NODE_ENV !== 'production' ? { hmr: true, console: true } : false,
  routes: { '/': page, '/report': page, '/api/*': createReportApi() },
  fetch() {
    return new Response('Not found', { status: 404 });
  },
});
console.log(
  `CarScope buying report: ${server.url} | sandbox ${process.env.VDG_SANDBOX_ENABLED === 'true' ? 'enabled' : 'disabled'}`,
);
