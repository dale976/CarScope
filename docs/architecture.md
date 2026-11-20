# CarScope architecture

CarScope is one Bun application with a React browser client and a same-origin HTTP API. The repository is organized by responsibility so supplier formats, report interpretation and presentation remain independent.

## Runtime

`src/server/index.ts` reads validated configuration, creates the logger and in-memory preview-session store, and starts `Bun.serve`. React is served at `/` and `/report`; application endpoints live under `/api/*`.

```text
React client ── same-origin JSON ──> Bun API ──> mock report files
                                      └───────> DVLA + DVSA after explicit free-preview submission
```

`PORT` is canonical and defaults to 9000. `REPORT_PORT` remains a temporary compatibility fallback. A production server bound beyond loopback requires an exact `PUBLIC_ORIGIN`, which is also used for mutation-origin checks. The browser receives only a small runtime configuration object and never receives credentials.

## Layers

- `src/client` owns the registration journey, free preview, complete report chapters and visual presentation. Styles are split into base, layout, journey, report and history responsibilities with a fixed cascade order.
- `src/domain` converts normalized facts into status wording, record summaries, formatting and deterministic buyer briefing content. These functions do not know supplier response shapes.
- `src/server` owns configuration, HTTP policy, preview sessions, mock loading and provider integration.
- `src/server/provider` validates unknown supplier data and composes normalized report contracts. Malformed optional sections degrade to explicit gaps; required identity failure remains a typed supplier error.
- `src/shared` defines the preview, report, history and journey contracts shared across the server and client.

## Request flow

`POST /api/report-preview` accepts `mock` or `official`, never VDG `live` mode.
Mock projects an allowlisted local report and creates an opaque 30-minute demo session.
Official mode is explicitly enabled in development/test and denied server-side in
production. It requests configured DVLA/DVSA sources concurrently, validates identity,
and returns normalized facts, MOT history, source states and UAT notices. Partial
success exposes gaps; identity conflicts stop merging. No paid fallback or retries.
The per-instance DVLA client rejects requests less than 500ms apart without queuing.

`POST /api/report-generate` completes mock sessions only. Official mode returns
`PAID_REPORT_UNAVAILABLE` before session or supplier work. The browser disables its
full-report action until paid fulfilment exists. No VDG import is reachable from
this API. Isolated legacy VDG helpers remain for future paid-report work and tests.

Mock completion sessions expire after 30 minutes, coalesce concurrent completions
and are removed after success. Durable payment/report storage is future work.

## HTTP and operational policy

- API responses receive content-security, content-type, referrer, permissions and no-store protections.
- Client errors use stable public codes; unexpected failures return a generic response.
- Production logs are structured and accept only allowlisted operational fields.
- Health checks are local and never invoke a provider.
- Mock tests, builds, CI and smoke checks make no supplier requests.
- Raw provider payloads, credentials and billing fields are not returned to the browser or persisted.

## Configuration policy

Configuration is parsed once by `src/server/config.ts`. Official mode uses server-only DVLA/DVSA credentials. Missing sources remain unconfigured and do not prevent offline startup. Production hides the development data-source selector and rejects official lookups. Non-loopback production startup fails closed without a valid public origin.

The application remains usable without an `.env` file. `.env` and private `.local/` examples are ignored; `.env.example` contains names and safe defaults only.

## Deferred production systems

The current foundation does not yet provide payment, email, durable report access, PDF delivery, distributed sessions, rate limiting, bot controls, customer support tooling or supplier-cost monitoring. These should be introduced only after supplier display and retention rights, critical-source failure policy and unit economics are agreed.

Historical design records in `docs/superpowers/` describe earlier repository states. They are retained as decision history and do not define the active architecture.
