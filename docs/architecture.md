# CarScope V1 design and implementation plan

A local UK enthusiast-car research prototype: React + TypeScript, served by Bun's HTML bundler and a Bun HTTP API. No Node runtime, framework server, database, hosted services or external image/font requests.

## Scope and decisions
Search by text, make, maximum price, maximum mileage and required features; sort results. Car detail includes asking price, mileage, advertised days, dated asking-price history and same-model comparables. Watchlists and saved-search alert stubs persist in browser localStorage; no scheduled checks or notifications occur.

Mock mode is default. Fixtures are explicitly fictional and dated, never advertised as live stock. Cache mode reads a validated local snapshot; missing/invalid cache fails visibly without falling back to a network call. Live mode is deliberately unsupported because a local request limit cannot prove a provider account has free quota left. Environment keys are server-only placeholders for a future reviewed integration. No outbound fetch exists in the backend.

## Structure and implementation sequence
1. `src/shared/types.ts`, `fixtures/cars.json`: normalized listings and fixed reference date.
2. `src/server/config.ts`, `data.ts`, `search.ts`, `api.ts`: reject live mode, validate and read datasets, search/filter and compare, JSON error handling. Tests in `tests/api.test.ts` cover cost guard, searches, invalid input, details, isolation from external fetch and cache failures.
3. `src/client/`: responsive cream/ink/vermillion editorial UI; illustrated cars are local SVG, clearly marked as illustrations. URL-backed search and detail links. Loading, empty and error states; keyboard-accessible controls.
4. `scripts/import-cache.ts`: explicitly import and validate an existing normalized JSON response snapshot without requests; atomic local cache write.
5. README, environment example, Bun scripts and lockfile; run unit tests, TypeScript, production build and browser smoke checks before delivery.

## API
GET /api/status: mode, snapshot date and disabled live access.
GET /api/cars?q=&make=&maxPrice=&maxMileage=&features=&sort=: filtered normalized listings.
GET /api/cars/:id: listing plus same-make/model comparables (up to four), excluding itself and sorted by mileage proximity. Prices are asking prices, not valuations or transaction data.

## Future work
Verify provider licenses, UK payloads and quota/billing hard stops before adding live adapters. Add account-backed watches and scheduled notifications only as a separate change. Never infer sale prices from removed listings.
