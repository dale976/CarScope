# CarScope workspace architecture

Two independent React/TypeScript applications use Bun’s HTML bundler and HTTP server. Root commands retain the existing search workflow and add a buying-report workflow.

## Boundaries

- `apps/search` owns enthusiast listings, MarketCheck live preview, filtering, detail views, watch stubs, fixture adapters and search tests.
- `apps/buying-report` owns the consumer report model, fixed fictional example, frontend, same-origin sample endpoint and report tests. It does not import search logic or provider clients.
- `packages/ui` exports the existing BrandMark. It has no app dependency. Extract further shared controls only when both products use them.
- `scripts/workspace.ts` selects the app, resolves repository paths and starts/builds child Bun processes. `scripts/bun.sh` locates the project-local Bun binary for IDE/npm commands.

## Runtime and state

Each app builds to its own `dist` and serves frontend/API on one origin. Defaults are search port 3000 and report port 3001. Root `.env` is server-only and loaded explicitly by launchers. Root `.cache` and `.budget` remain private and are not migrated into workspaces. Search receives canonical absolute cache/budget paths before server import; production startup without the root launcher fails closed. The existing £10 ledger is never initialized or reset by startup.

## Data flow

Search demo reads fictional fixtures or an explicitly selected permitted local cache. Its separate `/live` API reserves an allowance before each user-requested provider call; no startup, polling, retry or automatic cache-miss calls are introduced.

Buying report: registration → same-origin JSON `POST /api/report-preview` → normalized allowlisted preview → `POST /api/report-generate` → complete normalized report. Mock reads only a known registration from ignored `.local/` files. Live preview makes one vehicle-details call and live generation makes three remaining package calls, without retries. A random preview ID refers to a server-only 30-minute in-memory session; it is bound to the exact mode and registration, coalesces concurrent generation, and is removed after success or expiry. Raw payloads, keys and billing fields never enter public responses. Completed reports are not persisted.

## Verification

Root `check` covers TypeScript, both test suites and both production builds. Separate smoke commands validate built HTML/assets, deep links and APIs on loopback. Report tests cover evidence labels, unperformed checks, cost assumptions, loading/error states and independent configuration. Workspace tests protect persistent paths. No verification command makes provider requests.

See the multi-module spec and implementation plan under `docs/superpowers/` for scope and acceptance criteria.
## Buying-report supplier path

The buying-report browser calls only CarScope's staged same-origin routes. The Bun
server validates the sandbox registration rule and normalises Vehicle Data Global
packages into the shared preview and `BuyingReport` shapes. Provider credentials
stay in the server environment. Selecting Live alone never spends a call.

Vehicle details is the one-call identity anchor and must succeed. The later VDI,
valuation and tyre calls run concurrently and may fail independently; the report
shows remaining evidence and records the missing package under sources and gaps.
There is no completed-response cache, database or raw-payload storage. `.local/`
contains private normalized development examples only and remains Git-ignored.

Great Britain digital MOT records generally start in 2005. Older, imported and
exempt vehicles may have incomplete coverage. Missing records do not establish a
clear history, and tax/MOT wording is dated from the supplied evidence. Payment,
email, PDF delivery and report persistence remain outside the current runtime.

For EVs, traction-battery and charging specifications are normalised from
`VehicleDetailsWithImage.ModelDetails.Powertrain.EvDetails`; no additional provider
call is needed. The separate `BatteryDetails` package concerns starter batteries.
The report must never infer present battery health from model capacity, range,
warranty or charging specifications.
