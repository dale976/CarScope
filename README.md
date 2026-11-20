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

## Combined official free preview

The free preview uses DVLA Vehicle Enquiry Service and DVSA MOT History, **never VDG**.
Mock mode remains the offline default. To enable the development source selector:

```dotenv
OFFICIAL_PREVIEW_ENABLED=true
DVLA_ENVIRONMENT=development
DVLA_TEST_API_KEY=your_test_key
DVLA_PROD_API_KEY=your_production_key
```

Enter keys only in the ignored `.env` file or secure runtime settings. `DVLA_API_KEY`
is supported as a single-key fallback. `development` selects the DVLA UAT endpoint
with predefined responses; select `production` to use real VES data with its matching
key. This does not change `NODE_ENV`: official preview mode is currently denied
server-side in production application environments.

DVSA requires `DVSA_CLIENT_ID`, `DVSA_CLIENT_SECRET`, `DVSA_API_KEY`, `DVSA_SCOPE`
and `DVSA_TOKEN_URL` as described above. The official preview can show a partial
result when only one source returns validated identity, with gaps labelled explicitly.
When using DVLA UAT, the page prominently warns that the combined preview contains
test data. Selecting a data source makes no request; submitting the registration does.

The preview includes returned identity and tax details, MOT status, dated recorded
mileage, full returned MOT history and defects, and additional DVLA facts where
available. It preserves date precision and odometer units. Missing history is not
an empty history, and neither proves a vehicle's condition. DVLA requests are spaced
at least 500ms apart per application instance, without a request queue or retries.

### Paid-report boundary

VDG is reserved for a future paid full-report fulfilment flow. Neither free-preview
mode can call it, and old `live` API mode requests are rejected. The official
preview's full-report action is disabled: no payment or paid lookup occurs.
Mock mode still supports the offline full-report demonstration.

Existing VDG sandbox provider helpers and their offline tests remain isolated in
`src/server/provider/`; they are not wired to the public preview/generation API.
Payment verification, supplier permissions and paid fulfilment must be implemented
before enabling customer report purchases. No automatic paid fallback exists.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Server bind address |
| `PORT` | `9000` | Canonical HTTP port |
| `REPORT_PORT` | unset | Backwards-compatible port fallback |
| `PUBLIC_ORIGIN` | unset | Exact public origin required for a non-loopback production host |
| `OFFICIAL_PREVIEW_ENABLED` | `false` | Enables the combined free preview in development/test only |
| `DVLA_ENVIRONMENT` | `development` | DVLA UAT (`development`) or real VES (`production`) |
| `DVLA_TEST_API_KEY`, `DVLA_PROD_API_KEY` | unset | Server-only keys selected by DVLA environment |
| `DVLA_API_KEY` | unset | Single-key compatibility fallback |
| `VDG_SANDBOX_ENABLED` | `false` | Reserved legacy sandbox configuration; no preview path |
| `VDG_API_KEY` | unset | Server-only supplier sandbox key |

Production hides development data-source controls and denies official preview requests. Keep `.env`, `.local/`, provider responses and credentials out of Git.

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

### Local preview test

Run `bun install --frozen-lockfile`, then `bun run dev`. Select **DVLA + DVSA**
in the development source selector and submit a registration. For a real vehicle,
set `DVLA_ENVIRONMENT=production` and use `DVLA_PROD_API_KEY`; `development`
uses DVLA's predefined UAT test registrations. This setting is separate from
`NODE_ENV`, which must remain `development` for the official preview.

Network access must permit `uat.driver-vehicle-licensing.api.gov.uk` (UAT) or
`driver-vehicle-licensing.api.gov.uk` (production VES), plus
`login.microsoftonline.com` and `history.mot.api.gov.uk` for DVSA. Tests, build
and smoke never require these services or make live requests.
