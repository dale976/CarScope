# CarScope

CarScope is a UK vehicle research prototype built with Bun, React and TypeScript. It currently contains two related products:

- **Buying Report** — identify a vehicle by registration, show a useful free preview, then generate a structured buyer's report covering provenance, MOT history, valuation, tax, tyres, specifications and ownership costs where data is available.
- **Enthusiast Search** — explore prestige and enthusiast cars with detailed filters, saved-search and watchlist prototypes, comparisons and specification evidence.

The project defaults to local mock data. Development and automated tests do not require supplier calls, credentials or paid services.

## Quick start

Install [Bun](https://bun.sh/docs/installation) 1.2.17 or newer, then run:

```sh
git clone https://github.com/dale976/CarScope.git
cd CarScope
bun install --frozen-lockfile
bun run dev:report
```

Open [http://127.0.0.1:9000](http://127.0.0.1:9000) for the buying-report journey.

To run the enthusiast-search app instead:

```sh
bun run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

The `npm run ...` equivalents also work when Bun is installed because the package scripts invoke Bun internally.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run dev:report` | Run the buying-report app on port 9000 |
| `bun run dev` | Run the enthusiast-search app on port 3000 |
| `bun run check` | Run formatting, linting, type checks, tests and production builds |
| `bun run test` | Run all Bun tests |
| `bun run build` | Build both apps |
| `bun run start:report` | Serve the built buying-report app |
| `bun run start` | Serve the built search app |
| `bun run smoke:report` | Smoke-test the built buying-report app locally |
| `bun run smoke` | Smoke-test the built search app locally |

Use `REPORT_PORT` or `PORT` to choose different local ports.

## Buying-report flow

The report app starts in **Mock** mode on every reload:

1. Enter a registration.
2. Review the free vehicle preview, including identity, MOT and tax status when returned.
3. Open the complete report.
4. Review the buyer briefing, records needing attention, history, valuation, running-cost context and detailed vehicle data.

Mock reports are read from ignored `.local/*-report.json` files. They are deliberately kept out of Git because supplier-derived examples may contain licensed or vehicle-specific data. If a mock registration is unavailable, the app returns a clear error and never falls back to a live supplier call.

The report is factual and evidence-led. Missing records remain visibly unavailable; absence of returned data is not presented as a clear history. Great Britain digital MOT history generally begins in 2005, so older, imported and exempt vehicles may have incomplete records.

Payment, email delivery, PDF export, accounts and permanent report storage are not implemented yet. The current purchase action opens the development report and does not claim that payment has occurred.

## Optional Vehicle Data Global sandbox

Copy the example environment file and add your own sandbox key:

```sh
cp .env.example .env
```

```dotenv
VDG_SANDBOX_ENABLED=true
VDG_API_KEY=your_server_side_key
```

Live report generation is an explicit development option in the UI. The current integration uses:

- `CarScopeFree` for vehicle identity, image, MOT and tax preview data
- `VDICheck` for provenance and history evidence
- `ValuationDetails` for valuation figures
- `TyreDetails` for vehicle-specific fitments

The free preview makes one supplier request. Opening the full report makes the three full-report requests concurrently, without retries. Completed reports and raw provider responses are not archived.

Sandbox restrictions apply: registrations must contain the letter **A**, data may be up to 12 months old, and results must not be used in production or for profit. Keep API keys in `.env`; they are read only by the Bun server and are never exposed to React.

## Environment variables

The repository works without an `.env` file.

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Local bind address |
| `PORT` | `3000` | Search app port |
| `REPORT_PORT` | `9000` | Buying-report app port |
| `DATA_MODE` | `mock` | Search data source: `mock` or local `cache` |
| `CAR_CACHE_PATH` | `.cache/cars.json` | Private normalized search snapshot |
| `VDG_SANDBOX_ENABLED` | `false` | Enables the report app's explicit live sandbox path |
| `VDG_API_KEY` | empty | Server-only Vehicle Data Global sandbox key |
| `MARKETCHECK_LIVE_ENABLED` | `false` | Enables deliberately triggered MarketCheck development requests |
| `MARKETCHECK_API_KEY` | empty | Server-only MarketCheck key |

Additional DVLA and DVSA variables in `.env.example` are reserved placeholders and are not wired into the current product.

Never commit `.env`, `.local`, `.cache`, `.budget`, provider responses or API keys.

## Repository structure

```text
apps/
  buying-report/   Registration journey, report UI, provider integration and tests
  search/          Enthusiast search, fixtures, live development preview and tests
packages/
  ui/              Shared CarScope branding
scripts/           Workspace, runtime and production launchers
docs/              Architecture and product notes
```

Both applications use a same-origin React client and Bun API:

```text
React UI  ── /api/* ──>  Bun server  ──>  mock/local data
                                  └──>  supplier API only after an explicit live action
```

The buying-report code separates provider transport, normalization, domain interpretation and presentation. Report chapters are independent React components, while status wording and buyer-facing summaries come from tested domain builders. This keeps supplier response shapes out of the UI and makes partial data predictable.

## Development safeguards

- Mock mode is the default and has no outbound provider branch.
- Live actions are explicit; selecting Live alone does not make a request.
- Provider keys and raw billing fields remain server-side.
- Missing optional packages produce a partial report with a visible data note.
- Concurrent requests for the same report share one in-flight operation.
- MarketCheck development requests use a local cumulative £10 reservation ledger; this is an engineering guard, not an account billing cap.
- The test suite uses fixtures and does not consume supplier allowance.

Before any public launch, agree the final package, consumer-facing rights, provenance wording, retention rules and commercial pricing with the data supplier. Production also needs payment, report delivery, privacy and support flows.

## Search prototype

The search app supports text and structured filtering across make, model, derivative, year, transmission, price, mileage and equipment preferences. It includes responsive result cards, shared detail views, asking-price history, current-batch comparables, and browser-local watch/search prototypes.

Its default inventory is fictional and offline. A separately controlled `/live` route can query MarketCheck during deliberate local testing. It does not poll, retry or persist responses. Search pagination and opening a live detail each count as another request.

## Licence

CarScope is licensed under the [MIT Licence](LICENSE).
