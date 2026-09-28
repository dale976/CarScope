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
| `bun run start` | Build and start the production server |
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

## Optional supplier sandbox

Set the following only when deliberately testing the Vehicle Data Global sandbox:

```dotenv
VDG_SANDBOX_ENABLED=true
VDG_API_KEY=your_server_side_key
```

The development UI then offers an explicit data-source selector. Selecting the supplier mode does not itself make a request. The current integration uses `CarScopeFree` for the preview, followed by `VDICheck`, `ValuationDetails` and `TyreDetails` for report completion. Completion calls run concurrently without automatic retries, raw responses are not archived, and credentials never enter browser responses.

Supplier sandbox restrictions apply: registrations must contain the letter `A`, data may be up to 12 months old, and results cannot be used in production or for profit.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Server bind address |
| `PORT` | `9000` | Canonical HTTP port |
| `REPORT_PORT` | unset | Backwards-compatible port fallback |
| `PUBLIC_ORIGIN` | unset | Exact public origin required for a non-loopback production host |
| `VDG_SANDBOX_ENABLED` | `false` | Enables the explicit development supplier path |
| `VDG_API_KEY` | unset | Server-only supplier sandbox key |

Production hides development data-source controls. Keep `.env`, `.local/`, provider responses and credentials out of Git.

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

The browser communicates only with same-origin `/api/*` routes. Supplier envelopes are validated and normalized at the server boundary before domain or UI code sees them. Optional package failures produce explicit gaps instead of fabricated defaults.

See [docs/architecture.md](docs/architecture.md) for the runtime boundaries and [docs/launch-readiness-plan.md](docs/launch-readiness-plan.md) for the commercial and operational work required before launch.

## Licence

CarScope is licensed under the [MIT Licence](LICENSE).
