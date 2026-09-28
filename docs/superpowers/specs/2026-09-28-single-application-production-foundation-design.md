# CarScope single-application and production-foundation design

**Date:** 28 September 2026  
**Status:** Proposed  
**Supersedes:** The repository structure in `2026-09-21-multi-module-design.md`

## Purpose

CarScope is now a vehicle buying-report product. The earlier enthusiast-search product is no longer part of the intended business, so its application, MarketCheck integration and workspace infrastructure create cost without serving the product.

This change will convert the repository into one conventional Bun, React and TypeScript application and address the code-quality issues that materially affect a production foundation. It will preserve the current report experience, Vehicle Data Global sandbox integration, private mock reports and test coverage.

This work prepares the codebase for later production systems. It does not add payment, email, customer accounts, persistent purchased reports or a live commercial supplier agreement.

## Current architecture assessment

### What is already strong

- The frontend, domain logic, shared contracts and server code are separated.
- Supplier HTTP transport is isolated from report construction.
- The UI consumes a normalized `BuyingReport` rather than raw supplier payloads.
- Buyer-facing summaries and status wording are deterministic and independently tested.
- The preview response deliberately excludes paid-report findings.
- Live supplier calls are explicit, server-side and protected from automatic retries.
- Concurrent completion of one preview shares the same in-flight operation.
- Missing optional supplier packages produce visible gaps rather than invented facts.
- TypeScript strict mode, Biome, 148 tests, production builds and smoke tests already provide a useful verification baseline.

### Issues to correct in this migration

1. **Obsolete repository structure.** Two app workspaces, a shared UI package and a dispatching launcher remain even though only one product is required.
2. **Untyped provider normalization.** `provider/build-report.ts` traverses supplier data through `Record<string, any>`, weakening the boundary that most needs runtime validation.
3. **Oversized presentation stylesheet.** One 2,669-line stylesheet makes ownership and safe visual changes unnecessarily difficult.
4. **String-based HTTP error classification.** API status codes are inferred from error-message text, which is fragile and couples user wording to transport behavior.
5. **Prototype-only request restrictions.** The API accepts only loopback hosts. That is suitable for the sandbox but cannot represent a configured deployment origin.
6. **Missing standard HTTP protections.** Responses do not consistently include content-security, framing, MIME-sniffing and referrer headers.
7. **No explicit health endpoint or structured operational event.** A deployment cannot distinguish process health from report-generation success.
8. **In-memory preview sessions.** This works for a single process, but sessions disappear on restart and cannot span multiple instances.
9. **Development-specific configuration.** `REPORT_PORT` and workspace root injection reflect the old multi-app setup. Common deployment platforms expect `PORT`.
10. **Lint exceptions hide architecture debt.** Explicit `any` and some accessibility checks are disabled globally for the report code.
11. **No repository CI.** The local `check` command is strong, but GitHub does not currently enforce it.

### Production readiness conclusion

The report application is a well-tested prototype with sensible internal boundaries. It is not yet a production service. The single-app migration can produce a production-quality code foundation, but public launch still depends on licensed live data, persistent/idempotent report fulfilment, payment, email delivery, rate limiting, monitoring, privacy controls and an agreed failure/refund policy.

## Target repository structure

```text
src/
  client/
    journey/
    report/
    styles/
  domain/
  server/
    provider/
  shared/
fixtures/
scripts/
tests/
docs/
.github/workflows/
```

The contents of `apps/buying-report` move to these root directories. `apps/search`, `apps`, `packages` and root workspace tests are removed. The unused SVG brand component is removed because the current product uses its text wordmark directly.

Historical specifications and plans remain under `docs/superpowers`. They record why the earlier structure existed. This design explicitly supersedes their workspace guidance.

Ignored private directories remain at the repository root:

- `.local` for licensed normalized development examples;
- `.tools` for an optional local Bun binary;
- `.worktrees` for isolated development;
- `.env` for credentials.

Search-only `.cache` and `.budget` conventions are removed from application configuration and documentation. Existing ignored local directories may be deleted manually after the migration because they are not application state.

## Runtime and commands

The root package becomes the application package. It will no longer declare Bun workspaces.

| Command | Behavior |
| --- | --- |
| `bun run dev` | Run the report application with hot reload |
| `bun run build` | Build `src/server/index.ts` to `dist` |
| `bun run start` | Run the production build from `dist` |
| `bun run test` | Run root `tests` |
| `bun run typecheck` | Run strict TypeScript checking |
| `bun run lint` | Run Biome linting |
| `bun run format` | Format source, tests, fixtures and scripts |
| `bun run check` | Format check, lint, typecheck, tests and build |
| `bun run smoke` | Exercise the production build using mock data |

`scripts/bun.sh` remains so IDE and npm commands can find the ignored local Bun binary without requiring a global installation. The multi-app `workspace.ts` and `start.ts` dispatchers are replaced with small single-app launch/build scripts only where Bun needs a production working-directory adjustment.

`PORT` becomes the canonical port with a default of `9000`. `REPORT_PORT` remains as a temporary backwards-compatible fallback. `HOST` remains explicit and defaults to loopback.

The accidental untracked `package-lock.json` is removed. `bun.lock` is the only dependency lockfile.

## Application boundaries

### Client

The client owns the registration, preview and report journey. API access remains behind one typed client function. Journey state stays in the top-level application until payment and durable routing require a state machine or router.

Report chapters remain independent components. Large components will only be split where they currently mix distinct presentation responsibilities; this migration will not redesign the report.

The stylesheet will be divided by responsibility:

- `base.css` for tokens, reset and typography;
- `layout.css` for shell, header, footer and responsive structure;
- `journey.css` for registration and preview screens;
- `report.css` for shared report surfaces and chapters;
- `history.css` for charts and timelines.

The main client entry imports these files in a stable cascade order. Existing visual behavior is preserved and the style regression tests are updated to inspect the appropriate file.

### Domain and shared contracts

`domain` contains pure interpretation and presentation-oriented builders. `shared` contains serialized client/server contracts and history transformations. Neither layer may import server transport or React.

The existing `BuyingReport` remains the normalized boundary. This migration will not add supplier-only fields to it without a report use case.

### Server API

The API retains two staged operations:

- `POST /api/report-preview`
- `POST /api/report-generate`

It adds `GET /api/health`, returning only service status and version information. It never checks a paid supplier source.

Typed application errors replace message inspection. Each error carries a stable code, HTTP status and safe public message. Unexpected errors return a generic response and are logged without credentials or raw supplier payloads.

All app responses receive a common set of headers:

- `Cache-Control: no-store` for report API responses;
- `Content-Security-Policy` appropriate to the bundled same-origin app and explicitly allowed supplier image host;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: no-referrer`;
- `Permissions-Policy` disabling unused browser capabilities;
- frame protection through CSP `frame-ancestors`.

The allowed browser origin is derived from the request only in local development. A non-loopback production bind requires `PUBLIC_ORIGIN` and exact origin matching. Proxy headers are not trusted implicitly.

### Provider boundary

The provider client continues to own URL construction, timeout and response-envelope validation. The API key remains server-only. Errors distinguish transport failure, supplier rejection and unusable data without placing secrets or raw payloads in messages.

The report builder will stop using `Record<string, any>`. Supplier payloads remain `unknown` at entry and are traversed with the existing record, list, string, boolean, number and date guards. Small extraction functions will normalize vehicle identity, MOT, finance, provenance, valuation, tax, tyres and EV data. These functions return typed intermediate values used by the final report composer.

This is runtime validation at the fields CarScope consumes, not an attempt to maintain a complete copy of the supplier schema. Unknown supplier fields remain ignored.

### Preview sessions

The current in-memory behavior remains for local development, but the API depends on a `PreviewSessionStore` interface rather than constructing a `Map` directly. The in-memory implementation retains its 30-minute TTL and in-flight request coalescing.

The production launch phase must supply a persistent implementation before multiple instances or paid fulfilment are enabled. The interface will allow that replacement without rewriting API routing. The health endpoint will not claim durable fulfilment while the in-memory store is active.

## Configuration

One configuration reader validates:

- `NODE_ENV`;
- `HOST`;
- `PORT`, with `REPORT_PORT` fallback;
- `PUBLIC_ORIGIN` when required;
- `VDG_SANDBOX_ENABLED`;
- `VDG_API_KEY` when the sandbox is enabled;
- the private mock-report root used by tests and local development.

Configuration is read once at startup and passed into server construction. Other modules do not read `process.env` directly. Startup fails with a clear configuration error before opening a listening socket.

The mock/live selector remains visible only in non-production builds. Production configuration will not expose sandbox mode accidentally. This migration does not enable a commercial supplier key.

## Logging and observability foundation

Startup and request-completion events use structured JSON in production and readable text locally. Logged fields are limited to event name, request ID, route, status, duration and safe error code. API keys, raw supplier responses, finance details and complete registration numbers are never logged.

This is a logging boundary, not a monitoring product. External error tracking, metrics, alerting and per-report cost monitoring remain launch-phase work.

## Quality controls

Biome will cover all active TypeScript, TSX, JSON and CSS. The explicit-`any` exception is removed after provider normalization is corrected. Accessibility exceptions will be narrowed to demonstrated cases rather than disabled globally.

Existing tests move without losing coverage. New tests will cover:

- root commands and configuration precedence;
- production origin validation;
- typed error-to-response mapping;
- security headers and health response;
- malformed nested supplier records without `any`;
- session-store contract behavior;
- absence of search/MarketCheck code and environment variables;
- production smoke behavior from the flattened build.

GitHub Actions will install the pinned Bun version with the frozen lockfile and run `bun run check` on pushes and pull requests. CI will use mock fixtures only and will not receive supplier secrets.

## Documentation

The README will describe only the buying-report product, its mock and sandbox modes, single-app commands, architecture and current launch limitations. `docs/architecture.md` will document the actual flattened layers and the boundaries between prototype infrastructure and future production services.

The launch-readiness plan remains because its commercial, legal and operational tasks are still applicable. Search and MarketCheck instructions are removed from active documentation.

## Migration safety

The migration is primarily a Git-aware move so file history remains traceable. Work will occur in an isolated worktree.

Verification will run in this order:

1. focused tests for configuration, API, provider guards and sessions;
2. all tests;
3. strict typecheck;
4. Biome format and lint checks;
5. production build;
6. production smoke test;
7. manual mock journey at desktop and mobile widths;
8. repository search confirming no active Search, MarketCheck or workspace references remain.

No supplier request is required for verification.

## Explicitly deferred production systems

The repository will be structurally ready to receive these systems, but this migration does not implement them:

- Stripe Checkout and webhook verification;
- idempotent paid fulfilment;
- durable report and preview storage;
- transactional email and permitted PDF delivery;
- public rate limiting, bot protection and spend enforcement;
- customer authentication or support administration;
- production Vehicle Data Global package configuration;
- external monitoring and alerting;
- privacy deletion/correction workflows;
- supplier-approved AI processing.

These are required before public launch. Their absence must remain visible in the README and architecture documentation.

## Acceptance criteria

- The search application, MarketCheck code, fixtures, images, tests and commands are absent.
- `apps`, `packages` and Bun workspace configuration are absent.
- The report application runs from root with `bun run dev` and builds with `bun run build`.
- Existing mock and sandbox report behavior is preserved.
- Provider normalization contains no explicit `any`.
- HTTP errors use stable typed codes rather than message matching.
- Common API security headers and a no-cost health endpoint are tested.
- Styles are split into responsibility-based files without a visual redesign.
- Configuration is validated once and supports conventional `PORT` deployment.
- CI runs the complete offline verification with no secrets.
- The full test, build and smoke suite passes without supplier calls.
- Active documentation describes the single report application accurately.
- Historical multi-module documents are retained and clearly superseded.
