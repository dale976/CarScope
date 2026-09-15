import type { Config } from './config';
import { loadData } from './data';
import { search, comparableCars, QueryError } from './search';
export function createApi(config: Config) {
  return async (request: Request): Promise<Response> => {
    const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options':'nosniff' } });
    if (request.method !== 'GET') return json({ error: 'Method not allowed' },405);
    try {
      const url = new URL(request.url);
      const data = await loadData(config);
      if (url.pathname === '/api/status') return json({mode:config.mode, asOf:data.asOf, source:data.source, liveRequestsEnabled:false});
      if (url.pathname === '/api/cars') return json(search(data,url.searchParams));
      if (url.pathname.startsWith('/api/cars/')) {
        const id = url.pathname.slice('/api/cars/'.length);
        const car = data.cars.find(c => c.id === id);
        return car ? json({car,comparables:comparableCars(data,car),asOf:data.asOf,source:data.source}) : json({error:'Car not found'},404);
      }
      return json({error:'Endpoint not found'},404);
    } catch (error) {
      if (error instanceof QueryError) return json({error:error.message},400);
      return json({error:'Local data is unavailable. Check the snapshot or restart in mock mode. No live requests were made.'},503);
    }
  };
}
