# CarScope architecture

CarScope is one Bun application with a React browser client and a same-origin HTTP API. The repository is organized by responsibility so supplier formats, report interpretation and presentation remain independent.

## Runtime

`src/server/index.ts` reads validated configuration, creates the logger and in-memory preview-session store, and starts `Bun.serve`. React is served at `/` and `/report`; application endpoints live under `/api/*`.

```text
React client ── same-origin JSON ──> Bun API ──> mock report files
                                      └───────> supplier sandbox after an explicit action
```

`PORT` is canonical and defaults to 9000. `REPORT_PORT` remains a temporary compatibility fallback. A production server bound beyond loopback requires an exact `PUBLIC_ORIGIN`, which is also used for mutation-origin checks. The browser receives only a small runtime configuration object and never receives credentials.

## Layers

- `src/client` owns the registration journey, free preview, complete report chapters and visual presentation. Styles are split into base, layout, journey, report and history responsibilities with a fixed cascade order.
- `src/domain` converts normalized facts into status wording, record summaries, formatting and deterministic buyer briefing content. These functions do not know supplier response shapes.
- `src/server` owns configuration, HTTP policy, preview sessions, mock loading and provider integration.
- `src/server/provider` validates unknown supplier data and composes normalized report contracts. Malformed optional sections degrade to explicit gaps; required identity failure remains a typed supplier error.
- `src/shared` defines the preview, report, history and journey contracts shared across the server and client.

## Request flow

`POST /api/report-preview` validates the registration and mode. Mock mode resolves an allowlisted local example. Supplier mode performs the one preview-package request only after the user submits. The response contains a normalized public preview and an opaque preview ID.

`POST /api/report-generate` requires the matching preview ID, registration and mode. The server-bound session expires after 30 minutes, coalesces concurrent completion attempts and is removed after successful generation. Completion requests optional provenance, valuation and tyre data concurrently. Failed optional sources are reported as missing evidence and are never translated into a clear check.

The current session store is intentionally in memory. A durable, shared implementation must replace it before running multiple server instances or accepting payments.

## HTTP and operational policy

- API responses receive content-security, content-type, referrer, permissions and no-store protections.
- Client errors use stable public codes; unexpected failures return a generic response.
- Production logs are structured and accept only allowlisted operational fields.
- Health checks are local and never invoke a provider.
- Mock tests, builds, CI and smoke checks make no supplier requests.
- Raw provider payloads, credentials and billing fields are not returned to the browser or persisted.

## Configuration policy

Configuration is parsed once by `src/server/config.ts`. Sandbox mode requires a server-side key. Production hides the development data-source selector. Non-loopback production startup fails closed without a valid public origin.

The application remains usable without an `.env` file. `.env` and private `.local/` examples are ignored; `.env.example` contains names and safe defaults only.

## Deferred production systems

The current foundation does not yet provide payment, email, durable report access, PDF delivery, distributed sessions, rate limiting, bot controls, customer support tooling or supplier-cost monitoring. These should be introduced only after supplier display and retention rights, critical-source failure policy and unit economics are agreed.

Historical design records in `docs/superpowers/` describe earlier repository states. They are retained as decision history and do not define the active architecture.
