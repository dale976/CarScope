# CarScope

CarScope is a UK vehicle buying-report application built with Bun, React and TypeScript. A customer enters a registration, reviews a limited vehicle preview, and opens a structured report covering provenance, MOT history, valuation, tax, tyres, specifications and ownership context where the supplier returns evidence.

The application is evidence-led. Missing data remains unavailable, an empty response is not described as a clear history, and the report does not inspect a vehicle or tell a customer whether to buy it.

## Run locally

Install [Bun 1.4.2](https://bun.sh/docs/installation), then:

```sh
git clone https://github.com/dale976/CarScope.git
cd CarScope
bun install --frozen-lockfile
cp .env.example .env
bun run dev
```

Open [http://127.0.0.1:9000](http://127.0.0.1:9000). The app starts in mock mode and does not need credentials or make supplier requests.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the development server with hot reload |
| `bun run build` | Create the production bundle in `dist/` |
| `bun run start` | Start an existing production bundle; run build first |
| `bun run test` | Run the offline Bun test suite |
| `bun run check` | Run formatting, lint, types, tests and the production build |
| `bun run smoke` | Exercise the built app and local API without provider calls |

The scripts use `scripts/bun.sh`, which can find the project toolchain used by this repository. `npm run dev` also works when Bun is available.

## Report journey

1. Enter a registration.
2. Review the free identity, MOT and tax preview when those records are returned.
3. Open the complete report.
4. Review the buyer briefing, records requiring attention, history, valuation, ownership context and vehicle details.

Development examples are normalized JSON files under the ignored `.local/` directory. An unknown mock registration fails locally and never falls through to a supplier request. Great Britain digital MOT history generally begins in 2005, so older, imported and exempt vehicles may have incomplete evidence.

Payment, email delivery, accounts, PDF export and permanent report storage are deliberately deferred. The current purchase action opens the development report and does not claim a payment occurred.

## DVSA MOT History lookup

The server-side DVSA diagnostic client can inspect vehicle identity and MOT evidence independently of
the customer journey. Add `DVSA_CLIENT_ID`, `DVSA_CLIENT_SECRET`, `DVSA_API_KEY`, `DVSA_SCOPE` and
`DVSA_TOKEN_URL` to the ignored `.env` file, using the values supplied by DVSA. See `.env.example`
for the non-secret format. Then run:

```sh
bun run dvsa:lookup -- YJ22ACU
```

The command prints normalized vehicle/MOT JSON and exits nonzero on configuration, authentication,
lookup or validation failure. It omits VIN and test identifiers, does not archive raw responses and
makes no VDG requests. Access tokens remain in memory and are reused within the client instance;
each separate command process authenticates again. Tests and the normal application startup do not
make DVSA requests. The optional combined preview below reuses this client; DVLA supplies tax, while provenance remains outside the free preview.

See [the DVSA data review](docs/dvsa-data-review.md) for observed coverage and limitations.

## Launch settings and full-journey testing

Data sources are selected **on the server at launch**, never through a browser toggle.
Keep these settings in your ignored `.env` file and restart the server after changes.

```dotenv
NODE_ENV=development
CARSCOPE_DATA_MODE=connected
DVLA_ENVIRONMENT=production
VDG_SANDBOX_ENABLED=true
```

- `CARSCOPE_DATA_MODE=mock`: offline preview and report examples; no supplier requests.
- `CARSCOPE_DATA_MODE=connected`: DVLA/DVSA free preview, with explicit sandbox report
  generation when enabled. No VDG call is made during the preview.
- `NODE_ENV=development`: hot reload and optional sandbox report testing.
- `NODE_ENV=production`: production runtime; connected preview works, but sandbox
  generation is blocked because verified payment/production fulfilment is not built.
- `DVLA_ENVIRONMENT=production`: real VES using `DVLA_PROD_API_KEY`.
  `development` selects UAT predefined responses using `DVLA_TEST_API_KEY`.
  `DVLA_API_KEY` remains a single-key compatibility fallback.

Configure your existing five DVSA settings and `VDG_API_KEY` securely in `.env`.
Keys are server-only; `.env.example` contains only blank placeholders.
The older `OFFICIAL_PREVIEW_ENABLED=true` still selects connected mode only if
`CARSCOPE_DATA_MODE` is absent. New setups should use `CARSCOPE_DATA_MODE` explicitly.

Run `bun install --frozen-lockfile`, then `bun run dev` (or `npm run dev` when Bun
is available). Enter a registration. The preview contains official identity/tax
facts, dated mileage and full returned MOT history, with gaps and UAT data labelled.
Click **Generate test report** to request VDG sandbox data. No payment is taken.
Sandbox registrations must contain **A**; data can be up to 12 months old and must
not be used for purchasing decisions or commercially.

The completion path requests `VDICheck` first, then `ValuationDetails` and
`TyreDetails` concurrently. It **does not call `CarScopeFree`**. Official identity,
MOT history and tax evidence are reused where available, and the original preview
remains accessible in the report. Missing provenance is not described as clear.
Optional failures remain explicit gaps; required failure stops completion.

A 30-minute opaque preview session binds completion to the registration. Concurrent
and repeated successful generation requests reuse the result without new supplier
calls. A failed sandbox attempt also stays failed for that session to avoid repeating
partial supplier spend. Start a fresh preview only when deliberately trying again.
Sessions are in memory, expire, and are lost on restart; production payment and
fulfilment require durable shared idempotency and secure report storage.

The browser cannot change launch mode. Missing runtime configuration prevents a
lookup rather than silently switching data sources. Tests, builds, health checks
and smoke checks make no supplier requests; smoke explicitly forces mock mode.
No automatic retries or paid fallback exist.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Server bind address |
| `PORT` | `9000` | Canonical HTTP port |
| `REPORT_PORT` | unset | Backwards-compatible port fallback |
| `PUBLIC_ORIGIN` | unset | Exact public origin required for a non-loopback production host |
| `NODE_ENV` | `development` | Development runtime or production build/server |
| `CARSCOPE_DATA_MODE` | `mock` | Server-selected `mock` or `connected` journey |
| `DVLA_ENVIRONMENT` | `development` | DVLA UAT (`development`) or real VES (`production`) |
| `DVLA_TEST_API_KEY`, `DVLA_PROD_API_KEY` | unset | Server-only keys selected by DVLA environment |
| `DVLA_API_KEY` | unset | Single-key compatibility fallback |
| `VDG_SANDBOX_ENABLED` | `false` | Explicit development/test full-report sandbox opt-in |
| `VDG_API_KEY` | unset | Server-only supplier sandbox key |

There are no data-source controls in the UI. Production can serve connected previews but denies sandbox report generation. Keep `.env`, `.local/`, provider responses and credentials out of Git.

## Structure

```text
src/client/       React journey, report chapters and responsibility-based styles
src/domain/       Tested interpretation and buyer-facing wording
src/server/       Configuration, HTTP API, sessions, logging and supplier boundary
src/shared/       Public report, preview and history contracts
fixtures/         Fictional test data
tests/            Offline behavior and repository-boundary tests
scripts/          Build, production start and smoke tooling
docs/             Architecture and launch-readiness notes
```

The browser communicates only with same-origin `/api/*` routes. Free preview requests use only DVLA/DVSA or local mock data. Supplier envelopes are validated and normalized at the server boundary before domain or UI code sees them. Optional package failures produce explicit gaps instead of fabricated defaults.

See [docs/architecture.md](docs/architecture.md) for the runtime boundaries and [docs/launch-readiness-plan.md](docs/launch-readiness-plan.md) for the commercial and operational work required before launch.

## Licence

CarScope is licensed under the [MIT Licence](LICENSE).

### Required network destinations

Connected mode requires `uat.driver-vehicle-licensing.api.gov.uk` (UAT) or
`driver-vehicle-licensing.api.gov.uk` (production VES), plus
`login.microsoftonline.com` and `history.mot.api.gov.uk` for DVSA. Explicit sandbox
report generation additionally requires `uk.api.vehicledataglobal.com`.
Tests and smoke never require these services or make live requests.
