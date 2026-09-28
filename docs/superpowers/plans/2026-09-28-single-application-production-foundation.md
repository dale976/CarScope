# CarScope Single-Application Production Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the obsolete enthusiast-search product and convert CarScope into one conventional, production-founded Bun/React buying-report application without changing the report experience or consuming supplier calls.

**Architecture:** Move the buying-report application from its workspace into root `src`, `tests`, `fixtures` and `scripts` directories, then simplify the runtime around one server entry. Strengthen the existing client/domain/server/provider boundaries with validated configuration, typed application errors, guarded supplier normalization, a replaceable session store, common HTTP protections and offline CI.

**Tech Stack:** Bun 1.4.2, React 19, TypeScript 5.9 strict mode, Biome 2.5, Bun test and Bun fullstack HTML bundling.

**Spec:** `docs/superpowers/specs/2026-09-28-single-application-production-foundation-design.md`

## Global Constraints

- Preserve current buying-report UI, copy, normalized report contract, mock reports and Vehicle Data Global sandbox behavior.
- Verification must use mock data and make no Vehicle Data Global or MarketCheck calls.
- `PORT` is canonical with default `9000`; `REPORT_PORT` is a backwards-compatible fallback.
- `.env`, `.local`, `.tools` and `.worktrees` remain ignored and server-side.
- `bun.lock` is the only dependency lockfile; remove the untracked `package-lock.json`.
- Do not add payment, email, PDF, customer accounts, durable purchased reports or commercial supplier integration.
- Do not log API keys, raw supplier payloads, finance details or complete registrations.
- Keep historical specifications and plans; mark the multi-module architecture as superseded rather than deleting history.
- Use Git-aware moves where practical so history remains traceable.

## Review Focus

- A malformed nested supplier array item must be ignored or reported unavailable without crashing report generation; Task 4 adds the regression tests.
- A production server on a non-loopback host without `PUBLIC_ORIGIN` must fail before listening; Task 2 tests configuration and origin policy.
- An unexpected server exception must return a generic safe error and structured code without leaking its internal message; Task 3 tests the mapping.
- An expired preview and a failed completion retry must preserve the current session semantics; Task 5 tests the store contract.
- The flattened production build must serve its HTML/assets and complete the staged mock journey without provider calls; Task 8 runs the smoke test.

---

### Task 1: Flatten the application and simplify root commands

**Files:**
- Move: `apps/buying-report/src/` → `src/`
- Move: `apps/buying-report/tests/` → `tests/`
- Move: `apps/buying-report/fixtures/` → `fixtures/`
- Move: `apps/buying-report/scripts/smoke.ts` → `scripts/smoke.ts`
- Delete: `apps/search/`
- Delete: `apps/buying-report/package.json`
- Delete: `apps/buying-report/tsconfig.json`
- Delete: `packages/`
- Delete: `tests/workspace.test.ts` before moving report tests into `tests/`
- Delete: `scripts/workspace.ts`
- Delete: `scripts/start.ts`
- Delete: `package-lock.json`
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `biome.json`
- Modify: `scripts/smoke.ts`
- Modify: `src/server/mock-reports.ts`
- Create: `scripts/build.ts`
- Create: `scripts/start-production.ts`

**Interfaces:**
- Consumes: current buying-report source, tests and `scripts/bun.sh` local-runtime fallback.
- Produces: root commands `dev`, `build`, `start`, `test`, `typecheck`, `format`, `format:check`, `lint`, `check`, `smoke`; source entry `src/server/index.ts`; production output `dist/index.js`.

- [ ] **Step 1: Record the baseline**

Run: `sh scripts/bun.sh run check && sh scripts/bun.sh run smoke:report`  
Expected: 148 tests pass, both old workspace builds pass, and the report smoke test completes without external calls.

- [ ] **Step 2: Move the buying-report application to root paths**

Use `git mv` for tracked source, test, fixture and smoke files. Resolve imports so root paths are `src`, `tests`, `fixtures` and `scripts` and private mock reports resolve from repository root without the workspace launcher.

- [ ] **Step 3: Replace workspace scripts with single-app scripts**

Create:

```ts
// scripts/build.ts
export async function buildApplication(root?: string): Promise<void>;

// scripts/start-production.ts
export function productionEnvironment(env: Record<string, string | undefined>): Record<string, string | undefined>;
```

`buildApplication` bundles `src/server/index.ts` into root `dist`. The production launcher runs `dist/index.js` with `cwd` set to `dist` so Bun can resolve the asset manifest, while preserving `CARSCOPE_ROOT` for private mock paths.

- [ ] **Step 4: Simplify the root package and tooling scopes**

Remove `workspaces`, `@carscope/*` links and all search-specific commands. Point TypeScript and Biome at active root source, fixtures, tests and scripts. Keep React and existing development dependencies at root.

- [ ] **Step 5: Remove obsolete products and generated lockfile**

Delete `apps/search`, remaining `apps`/`packages` manifests, workspace tests, multi-app launchers and the untracked npm lockfile. Do not delete ignored `.local` reports.

- [ ] **Step 6: Run the moved test suite**

Run: `sh scripts/bun.sh run typecheck && sh scripts/bun.sh run test && sh scripts/bun.sh run build`  
Expected: all moved buying-report tests pass and one root application builds.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: flatten CarScope into a single application"
```

### Task 2: Centralize and validate runtime configuration

**Files:**
- Modify: `src/server/config.ts`
- Modify: `src/server/index.ts`
- Modify: `src/server/api.ts`
- Modify: `src/server/mock-reports.ts`
- Modify: `src/client/App.tsx`
- Modify: `src/shared/preview.ts`
- Modify: `scripts/smoke.ts`
- Test: `tests/config.test.ts`
- Modify: `tests/api.test.ts`
- Modify: `tests/entry-page.test.tsx`

**Interfaces:**
- Consumes: `process.env` once in the server entry.
- Produces: `readConfig(env: Record<string, string | undefined>): ServerConfig`, `ServerConfig`, `isAllowedOrigin(request: Request, config: ServerConfig): boolean`, and safe `GET /api/runtime-config` output.

- [ ] **Step 1: Write failing configuration tests**

Add tests asserting:

- `PORT` overrides `REPORT_PORT`;
- default port is `9000`;
- invalid ports fail;
- enabling sandbox without `VDG_API_KEY` fails;
- production non-loopback `HOST` without `PUBLIC_ORIGIN` fails;
- invalid or credential-bearing `PUBLIC_ORIGIN` fails;
- exact production origins pass while lookalike origins fail;
- mock root is resolved from `CARSCOPE_ROOT` without direct environment reads elsewhere;
- production runtime config hides sandbox controls and exposes no credential;
- development runtime config enables the existing Mock/Live sandbox selector.

- [ ] **Step 2: Run tests to verify failure**

Run: `sh scripts/bun.sh test tests/config.test.ts`  
Expected: FAIL because `ServerConfig` and production validation do not exist.

- [ ] **Step 3: Implement the configuration contract**

```ts
export type ServerConfig = {
  environment: 'development' | 'test' | 'production';
  host: string;
  port: number;
  publicOrigin?: string;
  sandbox: { enabled: boolean; apiKey?: string };
  root: string;
};
export function readConfig(env?: Record<string, string | undefined>): ServerConfig;
export function isAllowedOrigin(request: Request, config: ServerConfig): boolean;
```

Pass config into server/API/mock construction. Outside `src/server/index.ts`, production code must not read `process.env` directly.

- [ ] **Step 4: Add the safe client runtime configuration**

```ts
export type ClientRuntimeConfig = { sandboxControls: boolean };
```

Serve it from `GET /api/runtime-config`. Load it before rendering the journey; production renders Mock-only controls for this prototype, while development retains the existing Mock/Live toggle. The response must not contain host paths, environment names, keys or arbitrary environment properties.

- [ ] **Step 5: Run configuration, API and entry-page tests**

Run: `sh scripts/bun.sh test tests/config.test.ts tests/api.test.ts tests/entry-page.test.tsx`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src tests/config.test.ts tests/api.test.ts tests/entry-page.test.tsx scripts/smoke.ts
git commit -m "refactor: centralize server configuration"
```

### Task 3: Add typed errors, HTTP protections, health and safe logging

**Files:**
- Create: `src/server/errors.ts`
- Create: `src/server/http.ts`
- Create: `src/server/logger.ts`
- Modify: `src/server/api.ts`
- Modify: `src/server/index.ts`
- Test: `tests/errors.test.ts`
- Test: `tests/http.test.ts`
- Modify: `tests/api.test.ts`

**Interfaces:**
- Consumes: `ServerConfig` and existing route handlers.
- Produces: `AppError`, `toPublicError(error: unknown)`, `securityHeaders(config)`, `withResponseHeaders(response, config)`, `createLogger(config, sink?)`, and `GET /api/health`.

- [ ] **Step 1: Write failing typed-error tests**

Test stable mappings for invalid input, unsupported media type, oversized body, expired preview, session mismatch, supplier unavailable and unexpected exceptions. Assert unexpected messages are absent from the response body.

- [ ] **Step 2: Write failing HTTP and logging tests**

Assert API responses include `nosniff`, no-referrer, permissions policy, CSP frame protection and `no-store`; health returns `{status: 'ok', persistence: 'memory'}` without invoking a provider; production logs contain request ID, route, status and duration but not a full registration or supplied secret.

- [ ] **Step 3: Run tests to verify failure**

Run: `sh scripts/bun.sh test tests/errors.test.ts tests/http.test.ts tests/api.test.ts`  
Expected: FAIL because the HTTP foundation does not exist.

- [ ] **Step 4: Implement typed application errors**

```ts
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly publicMessage: string,
    options?: ErrorOptions,
  );
}
export function toPublicError(error: unknown): {status: number; body: {error: string; code: string}};
```

Replace message substring inspection and status properties with explicit error construction at the source.

- [ ] **Step 5: Implement shared HTTP headers and health**

Allow only same-origin bundled scripts/styles, data images if required by existing assets, and the exact supplier image origin already used by reports. Apply headers to API, page and fallback responses without changing Bun's asset handling.

- [ ] **Step 6: Implement redacted operational logging**

```ts
export type LogEvent = {
  event: string;
  requestId?: string;
  route?: string;
  status?: number;
  durationMs?: number;
  errorCode?: string;
};
export function createLogger(config: ServerConfig, sink?: (line: string) => void): {
  info(event: LogEvent): void;
  error(event: LogEvent): void;
};
```

Use readable development output and JSON production output. Never accept arbitrary payloads as log fields.

- [ ] **Step 7: Run focused tests**

Run: `sh scripts/bun.sh test tests/errors.test.ts tests/http.test.ts tests/api.test.ts`  
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/server tests/errors.test.ts tests/http.test.ts tests/api.test.ts
git commit -m "feat: harden report HTTP boundary"
```

### Task 4: Replace untyped supplier traversal with focused normalizers

**Files:**
- Modify: `src/server/provider/build-report.ts`
- Create: `src/server/provider/normalizers/common.ts`
- Create: `src/server/provider/normalizers/vehicle.ts`
- Create: `src/server/provider/normalizers/history.ts`
- Create: `src/server/provider/normalizers/provenance.ts`
- Create: `src/server/provider/normalizers/valuation.ts`
- Create: `src/server/provider/normalizers/tyres.ts`
- Create: `src/server/provider/normalizers/ev.ts`
- Modify: `src/server/provider/guards.ts`
- Modify: `biome.json`
- Modify: `tests/provider.test.ts`
- Modify: `tests/provider-guards.test.ts`

**Interfaces:**
- Consumes: `SupplierRecord = Record<string, unknown>` and current `BuyingReport`.
- Produces: typed `normaliseVehicle`, `normaliseMot`, `normaliseProvenance`, `normaliseValuation`, `normaliseTyres`, `normaliseEv` results consumed by `buildReport`; no explicit `any` in active code.

- [ ] **Step 1: Add failing malformed-payload tests**

Cover null/primitive nested records, mixed arrays, invalid numeric/date fields, malformed finance records, missing model identity, invalid valuation figures and malformed tyre/EV lists. Assert optional sections become unavailable, while missing make/model still rejects identification.

- [ ] **Step 2: Run provider tests to verify the new assertions fail**

Run: `sh scripts/bun.sh test tests/provider.test.ts tests/provider-guards.test.ts`  
Expected: at least the nested malformed cases fail or expose unsafe traversal.

- [ ] **Step 3: Extend guard primitives**

Add key-safe helpers for record lists, strings, finite numbers, booleans and dates. Each helper accepts `unknown` or `SupplierRecord | undefined`; none casts to `any`.

- [ ] **Step 4: Extract typed normalizers by supplier concern**

Each normalizer reads only guarded fields and returns a named intermediate type. Keep `buildReport` responsible for composing the final report and buyer-facing findings, not traversing raw JSON.

- [ ] **Step 5: Enable the explicit-any lint rule**

Remove `noExplicitAny: off`. Narrow accessibility exemptions only where existing markup has a documented reason.

- [ ] **Step 6: Run provider, lint and type checks**

Run: `sh scripts/bun.sh test tests/provider.test.ts tests/provider-guards.test.ts && sh scripts/bun.sh run lint && sh scripts/bun.sh run typecheck`  
Expected: PASS with no explicit `any` in active source or tests.

- [ ] **Step 7: Commit**

```bash
git add src/server/provider tests/provider.test.ts tests/provider-guards.test.ts biome.json
git commit -m "refactor: type supplier report normalization"
```

### Task 5: Introduce a replaceable preview-session store

**Files:**
- Modify: `src/server/preview-sessions.ts`
- Modify: `src/server/api.ts`
- Modify: `src/server/index.ts`
- Modify: `tests/preview-sessions.test.ts`
- Modify: `tests/api.test.ts`

**Interfaces:**
- Consumes: current mock/live session variants and `BuyingReport` completion callback.
- Produces: `PreviewSessionStore` and `createMemoryPreviewSessionStore(options)`.

- [ ] **Step 1: Rewrite tests against the store contract**

```ts
export interface PreviewSessionStore {
  create(session: NewPreviewSession): Promise<string>;
  complete(
    id: string,
    mode: DataMode,
    registration: string,
    work: (session: PreviewSession) => Promise<BuyingReport>,
  ): Promise<BuyingReport>;
}
```

Tests retain expiry, mode/registration mismatch, in-flight coalescing, successful deletion and retry after rejected completion.

- [ ] **Step 2: Run session tests to verify interface mismatch**

Run: `sh scripts/bun.sh test tests/preview-sessions.test.ts tests/api.test.ts`  
Expected: FAIL until the async store interface is implemented.

- [ ] **Step 3: Implement the memory store**

Rename the factory to `createMemoryPreviewSessionStore`, keep the 30-minute default TTL, and make the API depend only on `PreviewSessionStore`. Construct the memory implementation in the server composition root.

- [ ] **Step 4: Run session and API tests**

Run: `sh scripts/bun.sh test tests/preview-sessions.test.ts tests/api.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/preview-sessions.ts src/server/api.ts src/server/index.ts tests
git commit -m "refactor: isolate preview session storage"
```

### Task 6: Split the report stylesheet without changing the design

**Files:**
- Delete: `src/client/styles.css`
- Create: `src/client/styles/base.css`
- Create: `src/client/styles/layout.css`
- Create: `src/client/styles/journey.css`
- Create: `src/client/styles/report.css`
- Create: `src/client/styles/history.css`
- Modify: `src/client/main.tsx`
- Modify: `tests/styles.test.ts`

**Interfaces:**
- Consumes: current CSS selectors and markup unchanged.
- Produces: five ordered stylesheet imports with the same computed presentation and responsive rules.

- [ ] **Step 1: Update style ownership tests**

Point timeline-marker assertions to `history.css`, report-card rhythm assertions to `report.css`, and add a test that `main.tsx` imports all five files in the documented cascade order.

- [ ] **Step 2: Run style tests to verify failure**

Run: `sh scripts/bun.sh test tests/styles.test.ts`  
Expected: FAIL because split files do not exist.

- [ ] **Step 3: Move CSS sections by responsibility**

Preserve declarations and selector order within each responsibility. Move media queries with the selectors they modify. Do not rename classes or make visual changes.

- [ ] **Step 4: Run style, component and build checks**

Run: `sh scripts/bun.sh test tests/styles.test.ts tests/entry-page.test.tsx tests/report.test.tsx && sh scripts/bun.sh run build`  
Expected: PASS.

- [ ] **Step 5: Manually compare mock pages**

Run `sh scripts/bun.sh run dev`, inspect registration, preview and full Porsche report at desktop and narrow mobile width, and confirm layout matches the pre-migration behavior.

- [ ] **Step 6: Commit**

```bash
git add src/client tests/styles.test.ts
git commit -m "refactor: split report styles by responsibility"
```

### Task 7: Rewrite active documentation and add offline CI

**Files:**
- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify: `docs/launch-readiness-plan.md`
- Modify: `.env.example`
- Modify: `.gitignore`
- Create: `.github/workflows/ci.yml`
- Test: `tests/repository.test.ts`

**Interfaces:**
- Consumes: final root commands, config variables and file layout from Tasks 1–6.
- Produces: accurate single-product documentation and a GitHub Actions check with no secrets.

- [ ] **Step 1: Write a failing repository-boundary test**

Assert active source, root manifest, `.env.example`, README and architecture docs contain no `apps/search`, `MarketCheck`, `MARKETCHECK_`, `CAR_CACHE`, `.budget`, workspace command or enthusiast-search product references. Exclude historical `docs/superpowers` records from this assertion.

- [ ] **Step 2: Run the repository test to verify failure**

Run: `sh scripts/bun.sh test tests/repository.test.ts`  
Expected: FAIL until active documentation and environment files are rewritten.

- [ ] **Step 3: Rewrite the README and architecture document**

Document the buying-report product, root commands, mock/sandbox modes, layers, security/config foundation and explicit deferred launch systems. Mark historical multi-module material as superseded.

- [ ] **Step 4: Clean environment and ignore rules**

Keep `HOST`, `PORT`, backwards-compatible `REPORT_PORT`, `PUBLIC_ORIGIN`, `VDG_SANDBOX_ENABLED` and `VDG_API_KEY`. Remove search, MarketCheck, DVLA/DVSA placeholder and budget/cache settings. Keep private report examples and credentials ignored.

- [ ] **Step 5: Add GitHub Actions**

Configure checkout, the pinned Bun 1.4.2 runtime, `bun install --frozen-lockfile` and `bun run check` for pushes and pull requests. Do not define provider secrets or run live smoke mode.

- [ ] **Step 6: Run documentation boundary and full checks**

Run: `sh scripts/bun.sh test tests/repository.test.ts && sh scripts/bun.sh run check`  
Expected: PASS and no provider calls.

- [ ] **Step 7: Commit**

```bash
git add README.md docs .env.example .gitignore .github tests/repository.test.ts
git commit -m "docs: define the single CarScope application"
```

### Task 8: Final production-build verification and repository audit

**Files:**
- Modify only if verification exposes a defect in files owned by Tasks 1–7.

**Interfaces:**
- Consumes: the complete flattened application.
- Produces: verified branch with no obsolete active code or documentation.

- [ ] **Step 1: Run the complete quality gate**

Run: `sh scripts/bun.sh run check`  
Expected: format, lint, strict typecheck, all tests and root production build pass.

- [ ] **Step 2: Run the production smoke test**

Run: `sh scripts/bun.sh run smoke`  
Expected: built HTML/assets, health endpoint, preview and complete mock report pass with no outbound supplier request.

- [ ] **Step 3: Audit removed architecture**

Run searches for `apps/search`, `@carscope/`, `MarketCheck`, `MARKETCHECK_`, `CAR_CACHE`, `CARSCOPE_BUDGET`, `workspace.ts`, `dev:report`, `start:report` and `smoke:report`, excluding `.git`, `node_modules`, ignored private data and historical `docs/superpowers`.  
Expected: no active matches.

- [ ] **Step 4: Audit secrets and repository state**

Confirm no API-key value, raw provider response, `.env`, `.local` report, npm lockfile or generated `dist` file is tracked. Confirm `git status --short` contains only intended changes.

- [ ] **Step 5: Manually verify the complete mock journey**

Run `sh scripts/bun.sh run dev`; verify registration, preview, complete report, back/restart flow, status colors, history expansion and responsive layout using existing mock registrations.  
Expected: no behavioral or visual regression.

- [ ] **Step 6: Commit verification fixes, if any**

```bash
git add <only-files-changed-by-verification>
git commit -m "fix: complete single-application verification"
```

- [ ] **Step 7: Request final code review**

Review the entire branch against the design, with particular attention to provider typing, public error leakage, configuration failure modes, session semantics and removal completeness. Address findings, rerun Steps 1–5, then use the branch-finishing workflow to merge and push.
