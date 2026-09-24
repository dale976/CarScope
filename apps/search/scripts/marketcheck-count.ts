import { readBudget, reserveSearchCall } from '../src/server/budget';

// Explicit manual probe only; UI, development server and tests cannot invoke it.
try {
  if (Bun.env.MARKETCHECK_LIVE_ENABLED !== 'true') throw new Error('Live access disabled. Set MARKETCHECK_LIVE_ENABLED=true explicitly for this command.');
  const key = Bun.env.MARKETCHECK_API_KEY;
  if (!key) throw new Error('Set MARKETCHECK_API_KEY in your ignored .env first.');
  const make = process.argv[2];
  if (!make || !['Lotus', 'Porsche', 'Ferrari', 'Aston Martin', 'Bentley', 'McLaren', 'Maserati', 'Lamborghini'].includes(make)) throw new Error('Supply one supported prestige make, e.g. Porsche.');
  const url = new URL('https://api.marketcheck.com/v2/search/car/uk/active');
  url.searchParams.set('api_key', key);
  url.searchParams.set('make', make);
  url.searchParams.set('rows', '0');
  reserveSearchCall();
  // No retry, redirect, response cache, or raw error logging (URLs contain the key).
  let response: Response;
  try { response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000) }); }
  catch { throw new Error('Request failed; the 2p reservation is retained.'); }
  if (!response.ok) throw new Error(`MarketCheck returned HTTP ${response.status}; the 2p reservation is retained.`);
  const result = await response.json() as { num_found?: unknown };
  if (!Number.isSafeInteger(result.num_found) || Number(result.num_found) < 0) throw new Error('Unexpected count response.');
  console.log(`${make}: ${result.num_found} active listings. No response saved.`);
  console.log(`Remaining local allowance: £${(readBudget().remainingPence / 100).toFixed(2)}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Request blocked.');
  process.exitCode = 1;
}
