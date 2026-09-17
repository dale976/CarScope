import {createLiveApi} from './live';
import page from '../client/index.html';
import { readConfig } from './config';
import { createApi } from './api';
const config = readConfig();
const api = createApi(config);
const liveApi=createLiveApi();
const server = Bun.serve({
  hostname: config.host, port: config.port,
  development: process.env.NODE_ENV !== 'production' ? { hmr: true, console: true } : false,
  routes: { '/': page, '/cars/:id': page, '/live':page, '/api/live/*':liveApi, '/api/*': api },
  fetch() { return new Response('Not found', {status:404}); }
});
console.log(`CarScope: ${server.url} | ${config.mode} mode | mock browsing; live preview requires explicit actions at /live`);
