# CarScope

A local Bun workspace containing two React + TypeScript products: enthusiast search and a consumer buying-report prototype. Demo search and the report work offline; the existing live search preview requires explicit paid-request actions.


## Two apps, one repository

```text
apps/search/          Existing enthusiast search: UI, API, fixtures, tests
apps/buying-report/   Offline consumer buying brief: UI, API, fictional sample, tests
packages/ui/          Shared CarScope brand mark
scripts/              Root launchers and local Bun fallback
```

Run these from the repository root; npm launches Bun rather than replacing it:

| Command | Result |
| --- | --- |
| `npm run dev` | Search, default http://127.0.0.1:3000 |
| `npm run dev:report` | Buying report, default http://127.0.0.1:3001 |
| `npm run build` | Production builds for both apps |
| `npm run start` | Built search app |
| `npm run start:report` | Built buying-report app |
| `npm run check` | Typecheck, all tests, both builds |
| `npm run smoke` / `npm run smoke:report` | Local-only production checks |

The equivalent `bun run …` commands work too. App folders also expose dev/start/build/test/typecheck scripts. The root `.env`, `.tools`, `.cache` and `.budget` stay in place; root launchers supply absolute cache and ledger locations even when launched from an app folder. Never reset the budget by moving or copying it. Production servers must be started through the launchers, not by manually executing a bundled file.

### Buying-report prototype

Run `npm run dev:report` and open http://127.0.0.1:3001. The journey starts in **Mock** on every reload: enter a registration, review the free vehicle preview, then open the complete report. Four private local examples are available: Porsche `DF74 FPA`, Lotus `YJ22 ACU`, Fiat `SL60 AUC` and Tesla `LD17 VAE`.

Mock reads normalized reports from the ignored `.local/` directory and has no supplier-network branch. Keep these files private: they can contain licensed or personal vehicle observations and must never be committed. A missing example fails clearly rather than calling a provider.

**Live** is an explicit development option. Merely selecting it makes no request. “Identify vehicle” makes one `VehicleDetailsWithImage` call; “View complete report” makes three calls for VDI, valuation and tyres, with no retries. Raw provider responses, credentials and billing data stay server-side. The server holds the vehicle-details response for up to 30 minutes behind a random preview ID, then discards it after successful generation or expiry. Completed reports are not persisted.

Great Britain digital MOT history generally begins in 2005. Older, imported and exempt vehicles may return partial or no MOT evidence. Missing evidence is shown as not returned and never treated as a clear history. Status wording uses supplied dates and does not describe an old observation as current.

Payment, email delivery, PDF export, customer accounts and completed-report persistence are deliberately deferred. The £9.99 action currently opens the development report directly and does not claim a payment occurred.

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

Dependency installation uses the public package registry and downloads free packages. Once dependencies are installed, development and tests work offline. The offline demos require no remote fonts, analytics, AI calls or car-data requests. Explicit live search actions use MarketCheck and may display dealer-hosted images.

```sh
bun test                  # API, filtering, cache validation and cost-guard tests
bun run typecheck         # TypeScript, executed using Bun
bun run build             # Bundle React/CSS and the Bun backend into each app’s dist/
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
| `PORT` | `3000` | Search port, valid integer 1–65535. |
| `REPORT_PORT` | `3001` | Independent buying-report port, valid integer 1–65535. |
| `CAR_CACHE_PATH` | `.cache/cars.json` | Local normalized snapshot path, relative to project root unless absolute. |
| `MARKETCHECK_API_KEY` | empty | Server-only key for explicit live search/detail requests and the manual count command. |
| `DVLA_API_KEY` | empty | Reserved server-only placeholder. |
| `DVSA_CLIENT_ID`, `DVSA_CLIENT_SECRET`, `DVSA_API_KEY`, `DVSA_TOKEN_URL`, `DVSA_SCOPE` | empty | Reserved server-only OAuth/API configuration placeholders. |

**Demo browsing and buying reports make no provider calls.** Search also retains its separately controlled `/live` preview, described below. Adding a key or opening the preview does not submit a paid request. Cache misses never fall back to a provider. The local spending guard estimates usage; it cannot establish the account’s remaining free quota.

Keys belong only in an ignored server `.env`; never add `PUBLIC_`/`VITE_` key variables or embed them in fixtures. `.env*`, caches, dependencies and build output are ignored by Git. The API emits only explicitly allowed data fields, never environment settings or arbitrary imported properties.

## Local cache workflow

This V1 imports **existing normalized JSON snapshots**, not raw MarketCheck/DVLA/DVSA payloads. There is no endpoint that downloads data. Most work should continue using fixtures.

Try the complete offline flow:

```sh
bun run cache:import apps/search/fixtures/cars.json
DATA_MODE=cache bun run dev
```

The importer validates before writing, drops unknown properties, writes a private temporary file, then atomically replaces the cache. It preserves the source label: importing fictional fixtures still displays “fictional demo data”. Missing/invalid cache returns HTTP 503 with a visible UI error; it does not call an API or quietly substitute fixtures. Cache values remain frozen at their stated `asOf` date, including days-on-market.

To use a response you already possess from a **verified free** source, normalize it to the schema in `apps/search/src/shared/types.ts` (the complete example is `apps/search/fixtures/cars.json`) and run:

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

- `apps/search/src/client/`: React interface, original SVG art, styles and browser storage.
- `apps/search/src/server/config.ts`: validated local settings and live-mode guard.
- `apps/search/src/server/data.ts`: fixture/cache loading, schema validation and public field projection.
- `apps/search/src/server/search.ts`: filtering, sorting and comparable selection.
- `apps/search/src/server/api.ts`: JSON responses and error statuses.
- `apps/search/src/server/index.ts`: Bun server with HTML imports, frontend bundling and API routing.
- `apps/search/scripts/import-cache.ts`: offline snapshot import.
- `apps/search/tests/`: Bun-native tests. `docs/architecture.md`: V1 design and implementation sequence.

Bun's [fullstack HTML support](https://bun.sh/docs/bundler/fullstack) serves the frontend and API from one origin, with hot reload in development. There is no Vite/Node server or CORS setup. Search uses SQLite only for its local spending ledger. Production build assets are served by Bun. Run commands from the project root. The start launcher preserves root environment/cache settings and changes into the selected app’s `dist/` before loading the built server, because Bun resolves its fullstack asset manifest against the working directory.

| Endpoint | Result |
| --- | --- |
| `GET /api/status` | mode, source, snapshot date, `liveRequestsEnabled: false` |
| `GET /api/cars` | listings, count and available make/feature options |
| `GET /api/cars/:id` | car plus up to four same-make/model comparables, excluding itself |

Query fields: `q`, `make`, `maxPrice`, `maxMileage`, comma-separated `features`, and `sort` (`recent`, `price-asc`, `price-desc`, `mileage`, `days`). Invalid numbers/sort return 400; missing car 404; local data failure 503; non-GET requests 405.

Comparables are ordered by mileage proximity; differing trims, years and condition are not adjusted. The average is an unweighted **asking-price** average, not a valuation. History shows asking-price observations, never inferred transaction prices.

## Prestige-only synthetic dataset

The mock inventory now covers Lotus, Porsche, Ferrari, Aston Martin, Bentley, McLaren, Maserati and Lamborghini. `apps/search/fixtures/marketcheck/uk-active.json` uses the documented UK response structure; a mock-only adapter maps its fields to the existing UI. All values are fictional. See `apps/search/fixtures/marketcheck/README.md` for mapping scope and limitations.

The cache importer is a generic local fixture utility, not permission to store MarketCheck responses. Do not import real provider responses without appropriate retention rights. Demo browsing remains offline.

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

`apps/search/src/server/budget.ts` fixes a cumulative £10 allowance, reserving **2p before each attempt**, including failures and calls covered by free quota. This is conservative against the published Starter standard-search rate of £0.012/call (check pricing before use). At most 500 attempts are allowed. SQLite accounting in ignored `.budget/marketcheck.sqlite` survives restarts and uses atomic updates across processes. Missing/corrupt accounting blocks requests. Never delete/reset this ledger to recover allowance; reconcile it with the supplier dashboard first. A fresh checkout requires deliberate ledger provisioning, not automatic initialization on first request.

This is a local estimated-spend guard, **not a MarketCheck account billing cap**. It cannot cover portal/MCP/connector requests, another checkout, changed tariffs or other account fees. No automatic monthly reset. Keep supplier usage alerts enabled. The default UI and tests still make no provider calls.

## Offline sample photos

Lotus, Porsche, Ferrari and Bentley cards/details use local Creative Commons sample photographs, with creator/license credits. Other marques and failed image loads retain the SVG fallback. Photos are illustrative and may differ in year, paint or specification. See `apps/search/src/client/assets/cars/credits.json` for source and licensing; no MarketCheck images or image API calls are used.

## Expanded enthusiast catalogue and precise search

The user-supplied tour list now defines eligibility in `apps/search/src/shared/catalogue.ts`. All-model marques and model/derivative-specific rules are separate; this is not an official endorsement. Names are normalized for eligibility; ambiguous performance badges fail closed. Supplier naming variants may need explicit additions as live coverage is audited. The CSV importer uses the same rules; existing imported snapshots are not rewritten.

Search combines text with make, model, generation, derivative, inclusive year bounds and transmission. Dependent options reflect the local eligible inventory; catalogue marques without fixtures currently return no results. Generation is optional and never inferred from year; select Unknown for missing metadata. Changing a parent filter clears its children. URL links, browser navigation and saved searches preserve criteria.

Fourteen additional fictional examples bring the default demo to 26 cars, including Porsche 911 generations, Supra, RX-7, NSX, Audi RS6, BMW M3 and Mustang GT. Original Cayman fixtures explicitly declare 981 / GT4. API query fields added: `model`, `generation`, `derivative`, `minYear`, `maxYear`, `transmission`. No provider requests are made.

## Controlled live browser preview

Open `/live` on the local server. The default demo remains offline. Opening the preview reads only local key availability and spend accounting; changing fields makes no calls. Pressing Search requests up to 50 provider listings (make/model, derivative, transmission and numeric limits); opening details requests one listing. Pagination and reopening details incur another reservation. No polling, retries, live response persistence or browser storage. Responses stay in component memory for the displayed search and disappear on reload. The UI uses dealer image URLs, never MarketCheck cached-image URLs.

Each inventory/detail attempt reserves 2p against the same cumulative £10 ledger. Loopback host and same-origin JSON POST checks guard paid operations. This is a single-user local development preview, not an authenticated production service. Do not expose it publicly. Budget status is local estimated accounting, not actual supplier billing. Start with one Porsche / 911 search and one detail: 4p reserved. No generation inference is performed. Equipment wording is checked locally when details are opened.

## Integrated live discovery

Live cars now shares the main app navigation, hero, sidebar and result styling at `/live`. Demo cars, demo watchlists and demo alerts remain explicitly labelled. Opening/switching modes does not submit provider requests. Leaving live mode discards transient results; returning requires an explicit new search. Browser Back switches modes without a paid call. Live equipment evidence matching is available on details. Generation filters, watches and alerts are not implemented yet.

## IDE run buttons / npm commands

The package scripts use `scripts/bun.sh` to locate `.tools/bun` first, then a Bun installation on PATH. A global Bun installation is not required on this Mac. Set the IDE working directory to the CarScope project root. `npm run dev` starts development; `npm run build` then `npm run start` runs the production build. npm only launches the scripts; Bun still runs the application. The local binary is ignored by Git, so a fresh checkout needs Bun installed or supplied locally.

## Live specification evidence

The detail view now applies local, rule-based matching to the already-fetched features, options and seller description. Supported preferences: air conditioning (including climate control), carbon seats, full service history, and Porsche Sport Chrono / ceramic brakes. Every match includes its source and excerpt. Options-only mentions and ambiguous wording require confirmation; explicit absence and contradictory claims remain visible. No additional provider or AI calls, embeddings or stored extracted records are used. This is conservative phrase recognition, not factory verification or complete natural-language understanding. Unknown means no recognised evidence, not proven absence.

## Search before the first request

`apps/search/src/shared/search-catalogue.ts` contains independently authored model suggestions and derivative families; it does not store MarketCheck responses. Porsche 911 families and selected other models are available immediately. Models remain editable and an exact-variant field supports designations outside the catalogue. Families expand to comma-separated exact names in the same inventory call. This vocabulary is provisional and not exhaustive: provider spellings may differ, so no result does not prove market absence. Validate and refine the mapping during deliberately budgeted live testing. Generation remains out of the live form.

The shared page size is 50 (`rows=50`, `start=page*50`). The grid shows the entire eligible batch; next/previous batch buttons explicitly state another request and a 2p reservation. Moving between batches replaces the current batch rather than archiving earlier responses. Provider totals are before eligibility checks, and provider plan limits may restrict pagination depth.

Equipment preferences start empty in the live sidebar and carry into detail views, where they can also be changed. They are a wish list, not confirmed equipment or exclusion filters. Cards say “Specification not checked”; opening details checks the evidence already returned by that detail request. Preference changes never trigger a request. Nothing is persisted across reloads.

## Equipment wish lists across marques

The shared `PreferenceEditor` groups choices into seats, driving, comfort, technology and appearance. Local make/model suggestions supplement these choices; they are names to investigate, not fitment or availability claims. Each selected option has a Must-have or Nice-to-have priority. Preferences survive make/model changes within the live view and remain individually removable, so a custom wish list is not silently discarded. Reset clears the list.

Custom entries are limited to 80 characters and 20 preferences, deduplicated case-insensitively, and matched as escaped literal phrases. Curated generic equipment aliases cover common wording (including several audio brands). There is no semantic AI inference or rarity score. Detail evidence highlights unsupported must-haves, but neither priority excludes results. All matching runs on already-loaded details without extra requests, persistence or billing. Synthetic tests cover Porsche, BMW, Audi and Mercedes wording and preserve uncertainty for options-only mentions.

## Shared detail page and offline response examples

Demo and live detail views now render `CarDetailPage`, using adapters in `apps/search/src/shared/detail.ts`. Live detail hides the search form; “Your requirements” is a read-only summary, with an edit action returning to the search preferences. Long equipment lists and the seller description are collapsed. Highlight selection is for presentation only, not a claim of rarity, standard equipment, or factory-fitted options. Options and other features are labelled as advertised because the supplier schema does not reliably separate standard from fitted optional equipment.

Live projection retains `ref_price`, `ref_price_dt`, and `last_seen_at`. Only valid supplied dates/prices become chart observations. Reference and current observations are not presented as a complete history, and no intermediate changes or sale prices are invented. Comparisons use up to four other same-make/model listings from the current search batch, sorted by mileage proximity when known. Missing prices are excluded from averages. Rendering comparisons makes no extra provider call; opening a live comparison explicitly reserves 2p for its detail request.

Open `/detail-demo` for a free offline preview: rich specification, missing information, and conflicting equipment. These are invented response-shaped fixtures in `apps/search/src/shared/detail-example.ts`, passed through the same listing projection and detail adapter as live responses. The preview performs no API requests and stores no supplier snapshot. Use its scenario selector and edit-preferences action to test the shared UI. Normal demo listings also use the shared page with their existing fictional price histories.

### Private normalized report examples

The four Mock vehicles share the same preview and report journey. Their normalized
reports live only in ignored `.local/*-report.json` files and opening them makes no
supplier request. Reports can include supplier model imagery, specifications,
mileage charts, expandable yearly history, valuation assumptions, tax observations,
tyre fitments and EV charging details when returned. Missing fields remain visible
as gaps. There is no advert parsing or dealer-supplied information.

### Vehicle Data Global sandbox lookup

The buying-report service can generate a report for any registration accepted by
the Vehicle Data Global sandbox. Set `VDG_SANDBOX_ENABLED=true` and put the sandbox
key in `VDG_API_KEY` in the ignored `.env` file, then run `npm run dev:report`.

Identification requests `VehicleDetailsWithImage` once. Full report generation then
requests `VDICheck`, `ValuationDetails`, and `TyreDetails` concurrently. Concurrent
generation for the same preview shares one in-flight operation; completed responses
are not cached or archived. Missing history, valuation or tyre packages produce a
partial report with a visible data note. The sandbox only accepts registrations
containing the letter A and its results may be up to 12 months out of date. The API
key is used only by the Bun server and is never sent to the browser.

EV battery, range, consumption and 10–80% charging information is read from the
`Powertrain.EvDetails` section already returned by `VehicleDetailsWithImage`.
`BatteryDetails` is not requested: that package describes the starter battery and
returned no traction-battery result for the tested Tesla. EV specifications are
clearly separated from present battery health, which this integration does not test.
