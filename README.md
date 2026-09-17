# CarScope

A zero-cost, local prototype for UK enthusiast-car search and research. React + TypeScript on a simple Bun server. Twelve **fictional** cars, local illustrations and no external API calls.

## Start on this Mac

The delivered Desktop folder includes dependencies and a local Bun binary in `.tools/` (Mac Apple Silicon), so no global install is needed:

```sh
cd ~/Desktop/CarScope
./dev
```

Open http://127.0.0.1:3000. Stop with Ctrl+C. To use a different port: `PORT=4317 ./dev`.

For all other commands, make the included Bun available to the current terminal session:

```sh
export PATH="$PWD/.tools:$PATH"
bun run check
```

`.tools/` and `node_modules/` are ignored by Git. The local runtime is just a convenience for this Mac; it is not part of the portable source.

## Fresh checkout / another machine

Install [Bun](https://bun.com/docs/installation), version 1.2.17 or newer (tested with 1.4.2). Node.js is not required to run, bundle, type-check or test CarScope.

```sh
bun install --frozen-lockfile
bun run dev
```

Dependency installation uses the public package registry and downloads free packages. Once dependencies are installed, development and tests work offline. There are no remote fonts, images, analytics, AI calls or car-data requests.

```sh
bun test                  # API, filtering, cache validation and cost-guard tests
bun run typecheck         # TypeScript, executed using Bun
bun run build             # Bundle React/CSS and the Bun backend into dist/
bun run start             # Run the built app locally
bun run check             # Typecheck, tests, production build
bun run smoke             # Local HTTP smoke check of built app
```

## What works

- Search make/model/trim/features; combine make, price, mileage and must-have filters.
- Sort by price, mileage, newest listing or longest listed.
- Detail URLs that survive reloads, with asking price, mileage, days on market, specification, dated price history and same-model comparables.
- Watch/unwatch cars and save/open/delete searches in browser localStorage.
- Responsive layout, keyboard-accessible controls, loading, empty and error states.

Start with `Lotus Exige 410`, a £70,000 maximum, 30,000 miles and air conditioning. Two sample listings match.

Watchlists and searches are specific to the browser and origin (including port). Alert delivery is an explicitly labelled **UI stub**: no scheduler, polling, email or notifications. There are no accounts or real vehicle offers. Images are original generic car illustrations, not actual listing photos.

## Zero-cost policy and environment

No `.env` file or keys are needed. To customize local settings, copy `.env.example` to `.env`. Bun loads it automatically from the project root.

| Variable | Default | Behavior |
| --- | --- | --- |
| `DATA_MODE` | `mock` | `mock` reads committed fixtures; `cache` reads only a local snapshot. Every other value, including `live`, stops startup. |
| `HOST` | `127.0.0.1` | Local-only by default. |
| `PORT` | `3000` | Valid integer 1–65535. |
| `CAR_CACHE_PATH` | `.cache/cars.json` | Local normalized snapshot path, relative to project root unless absolute. |
| `MARKETCHECK_API_KEY` | empty | Server-only key for the explicitly enabled manual count command. |
| `DVLA_API_KEY` | empty | Reserved server-only placeholder. |
| `DVSA_CLIENT_ID`, `DVSA_CLIENT_SECRET`, `DVSA_API_KEY`, `DVSA_TOKEN_URL`, `DVSA_SCOPE` | empty | Reserved server-only OAuth/API configuration placeholders. |

**The web app has no live provider adapter.** Adding a key cannot trigger a request. The backend has no outbound fetch and never falls back to a provider on a cache miss. This is stronger than a guessed request budget: a local counter cannot establish how much free quota is left in an account. No provider accounts were created and no free or paid car-data calls were made during development.

Keys belong only in an ignored server `.env`; never add `PUBLIC_`/`VITE_` key variables or embed them in fixtures. `.env*`, caches, dependencies and build output are ignored by Git. The API emits only explicitly allowed data fields, never environment settings or arbitrary imported properties.

## Local cache workflow

This V1 imports **existing normalized JSON snapshots**, not raw MarketCheck/DVLA/DVSA payloads. There is no endpoint that downloads data. Most work should continue using fixtures.

Try the complete offline flow:

```sh
bun run cache:import fixtures/cars.json
DATA_MODE=cache bun run dev
```

The importer validates before writing, drops unknown properties, writes a private temporary file, then atomically replaces the cache. It preserves the source label: importing fictional fixtures still displays “fictional demo data”. Missing/invalid cache returns HTTP 503 with a visible UI error; it does not call an API or quietly substitute fixtures. Cache values remain frozen at their stated `asOf` date, including days-on-market.

To use a response you already possess from a **verified free** source, normalize it to the schema in `src/shared/types.ts` (the complete example is `fixtures/cars.json`) and run:

```sh
bun run cache:import /absolute/path/to/normalized-snapshot.json
DATA_MODE=cache bun run dev
```

The top level is `{ "asOf": "YYYY-MM-DD", "source": "imported", "cars": [...] }`. Dates must be real ISO dates; IDs unique; prices positive integer GBP; mileage and days non-negative integers; history ascending, not later than `asOf`, with the final asking price matching the current price. Use `#RRGGBB` colors for local illustrations. The importer accepts at most 20 MB / 10,000 listings. Do not include personal seller information or secrets.

Before extending live access, verify current API contracts, data-display/cache rights and account billing settings. Free-tier marketing or a request counter alone is insufficient. DVLA/DVSA are not wired into this search prototype.

## Architecture

```text
React UI ── same-origin GET /api/* ── Bun API
   │                                   │
localStorage                    mock fixtures OR local cache
(watches/search stubs)            no outbound network branch
```

- `src/client/`: React interface, original SVG art, styles and browser storage.
- `src/server/config.ts`: validated local settings and live-mode guard.
- `src/server/data.ts`: fixture/cache loading, schema validation and public field projection.
- `src/server/search.ts`: filtering, sorting and comparable selection.
- `src/server/api.ts`: JSON responses and error statuses.
- `src/server/index.ts`: Bun server with HTML imports, frontend bundling and API routing.
- `scripts/import-cache.ts`: offline snapshot import.
- `tests/`: Bun-native tests. `docs/architecture.md`: V1 design and implementation sequence.

Bun's [fullstack HTML support](https://bun.sh/docs/bundler/fullstack) serves the frontend and API from one origin, with hot reload in development. There is no Vite/Node server, CORS setup or database. Production build assets are served by Bun. Run commands from the project root. The start launcher preserves root environment/cache settings and changes into `dist/` before loading the built server, because Bun resolves its fullstack asset manifest against the working directory.

| Endpoint | Result |
| --- | --- |
| `GET /api/status` | mode, source, snapshot date, `liveRequestsEnabled: false` |
| `GET /api/cars` | listings, count and available make/feature options |
| `GET /api/cars/:id` | car plus up to four same-make/model comparables, excluding itself |

Query fields: `q`, `make`, `maxPrice`, `maxMileage`, comma-separated `features`, and `sort` (`recent`, `price-asc`, `price-desc`, `mileage`, `days`). Invalid numbers/sort return 400; missing car 404; local data failure 503; non-GET requests 405.

Comparables are ordered by mileage proximity; differing trims, years and condition are not adjusted. The average is an unweighted **asking-price** average, not a valuation. History shows asking-price observations, never inferred transaction prices.

## Prestige-only synthetic dataset

The mock inventory now covers Lotus, Porsche, Ferrari, Aston Martin, Bentley, McLaren, Maserati and Lamborghini. `fixtures/marketcheck/uk-active.json` uses the documented UK response structure; a mock-only adapter maps its fields to the existing UI. All values are fictional. See `fixtures/marketcheck/README.md` for mapping scope and limitations.

The cache importer is a generic local fixture utility, not permission to store MarketCheck responses. Do not import real provider responses without appropriate retention rights. Live access remains disabled.

## Private supplier CSV sample

The local importer also accepts the supplied UK inventory CSV. It selects Lotus, Porsche, Ferrari, Aston Martin, Bentley, McLaren, Maserati and Lamborghini; maps pipe-separated features; and validates the resulting dataset. It does not import contact details, registrations, remote photos, or dealer-directory records. `options` is not assumed to mean verified factory-fitted options.

```sh
CAR_CACHE_PATH=.cache/supplier-sample.json bun run cache:import /absolute/path/to/sample.csv
DATA_MODE=cache CAR_CACHE_PATH=.cache/supplier-sample.json PORT=4317 ./dev
```

This sample is for private local evaluation at the user's direction; no public-display or redistribution rights are asserted. Imported data stays in ignored `.cache/`. The snapshot date comes from `status_date`. Only a single price observation is recorded: the CSV contains no historical price series. Generic illustrations are not listing photographs or verified paint representations. Missing required fields fail import rather than becoming zero values. Mock mode remains the default; no provider calls occur.

## £10 development allowance

The web app remains offline by default. A separate manual count probe is available:

```sh
MARKETCHECK_LIVE_ENABLED=true bun run marketcheck:count Porsche
```

Set `MARKETCHECK_API_KEY` in ignored `.env` first. The command makes exactly one UK active-inventory request with `rows=0`; no retries, redirects or stored responses. It prints only the count. Do not route expensive valuation endpoints through this guard.

`src/server/budget.ts` fixes a cumulative £10 allowance, reserving **2p before each attempt**, including failures and calls covered by free quota. This is conservative against the published Starter standard-search rate of £0.012/call (check pricing before use). At most 500 attempts are allowed. SQLite accounting in ignored `.budget/marketcheck.sqlite` survives restarts and uses atomic updates across processes. Missing/corrupt accounting blocks requests. Never delete/reset this ledger to recover allowance; reconcile it with the supplier dashboard first. A fresh checkout requires deliberate ledger provisioning, not automatic initialization on first request.

This is a local estimated-spend guard, **not a MarketCheck account billing cap**. It cannot cover portal/MCP/connector requests, another checkout, changed tariffs or other account fees. No automatic monthly reset. Keep supplier usage alerts enabled. The default UI and tests still make no provider calls.

## Offline sample photos

Lotus, Porsche, Ferrari and Bentley cards/details use local Creative Commons sample photographs, with creator/license credits. Other marques and failed image loads retain the SVG fallback. Photos are illustrative and may differ in year, paint or specification. See `src/client/assets/cars/credits.json` for source and licensing; no MarketCheck images or image API calls are used.

## Expanded enthusiast catalogue and precise search

The user-supplied tour list now defines eligibility in `src/shared/catalogue.ts`. All-model marques and model/derivative-specific rules are separate; this is not an official endorsement. Names are normalized for eligibility; ambiguous performance badges fail closed. Supplier naming variants may need explicit additions as live coverage is audited. The CSV importer uses the same rules; existing imported snapshots are not rewritten.

Search combines text with make, model, generation, derivative, inclusive year bounds and transmission. Dependent options reflect the local eligible inventory; catalogue marques without fixtures currently return no results. Generation is optional and never inferred from year; select Unknown for missing metadata. Changing a parent filter clears its children. URL links, browser navigation and saved searches preserve criteria.

Fourteen additional fictional examples bring the default demo to 26 cars, including Porsche 911 generations, Supra, RX-7, NSX, Audi RS6, BMW M3 and Mustang GT. Original Cayman fixtures explicitly declare 981 / GT4. API query fields added: `model`, `generation`, `derivative`, `minYear`, `maxYear`, `transmission`. No provider requests are made.

## Controlled live browser preview

Open `/live` on the local server. The default demo remains offline. Opening the preview reads only local key availability and spend accounting; changing fields makes no calls. Pressing Search requests ten provider listings (make/model/transmission); opening details requests one listing. Pagination and reopening details incur another reservation. No polling, retries, live response persistence or browser storage. Responses stay in component memory for the displayed search and disappear on reload. The UI uses dealer image URLs, never MarketCheck cached-image URLs.

Each inventory/detail attempt reserves 2p against the same cumulative £10 ledger. Loopback host and same-origin JSON POST checks guard paid operations. This is a single-user local development preview, not an authenticated production service. Do not expose it publicly. Budget status is local estimated accounting, not actual supplier billing. Start with one Porsche / 911 search and one detail: 4p reserved. No generation inference or automatic equipment extraction is performed.

## Integrated live discovery

Live cars now shares the main app navigation, hero, sidebar and result styling at `/live`. Demo cars, demo watchlists and demo alerts remain explicitly labelled. Opening/switching modes does not submit provider requests. Leaving live mode discards transient results; returning requires an explicit new search. Browser Back switches modes without a paid call. Live equipment matching, generation filters, watches and alerts are not implemented yet.
