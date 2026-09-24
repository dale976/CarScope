# CarScope Multi-module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement inline if the user selects native execution, or superpowers:subagent-driven-development if the user selects delegated execution. Steps use checkbox syntax for tracking.

**Goal:** Separate the existing search app and a new offline buying-report prototype in one Bun workspace without losing existing work or spending protections.

**Architecture:** Two independent React/Bun apps own their APIs, fixtures and tests. A small UI package shares the existing brand mark. Root launchers resolve persistent files and preserve IDE commands.

**Tech Stack:** Bun 1.4.2 local runtime, React 19, TypeScript 5.9, Bun test and Bun fullstack build; no new framework or task runner.

**Spec:** `docs/superpowers/specs/2026-09-21-multi-module-design.md`

## Global Constraints

- Both products use React, TypeScript and Bun in one repository.
- Report code cannot import search code. Shared UI cannot import either app.
- Root `npm run dev` and `npm run start` continue to launch search through the existing local-Bun fallback.
- Keep `.env`, `.tools`, `.cache` and `.budget` at the repository root.
- Never copy, reset, print or commit credentials or budget contents.
- Preserve the existing cumulative MarketCheck allowance and disabled-by-default live behaviour.
- The first slice contains no live supplier integrations, paid requests, AI requests, arbitrary advert fetching, payment flow, customer accounts or report storage.
- Do not discard existing changes, overwrite the untracked npm lockfile, introduce a Git remote, push code, or migrate secrets into app folders.

## Review Focus

1. Starting from app directories or production output must use the same root budget and cache paths: Task 1 path and production smoke checks.
2. Existing dirty and untracked files must survive relocation: Task 1 content manifest comparison, excluding deliberate edits.
3. Report startup must not interpret search environment settings or require provider credentials: Task 2 config tests and smoke check.
4. Loading errors must not become a successful report or fake clear history checks: Task 2 response-state tests.
5. Real-looking input must not imply a real lookup or valuation: Task 2 rendering assertions and Task 3 browser checks.

## File map and commands

Move root `src`, `tests`, `fixtures` into `apps/search/`. Move `scripts/import-cache.ts`, `scripts/marketcheck-count.ts`, and `scripts/smoke.ts` into `apps/search/scripts/`; retain the wrapper and production launcher at root. The existing `dev` item must be inspected before changes and preserved unless it is demonstrably generated output.

Create root `scripts/workspace.ts` for canonical paths and launch/build dispatch. Update `scripts/start.ts` to delegate production launch. Keep `scripts/bun.sh` and its repository-root working directory behaviour. Create `tests/workspace.test.ts` for path invariants. Create app manifests and tsconfigs extending root compiler defaults. Root `tsconfig.json` covers apps, packages, scripts and root tests.

Create `packages/ui/package.json` and `packages/ui/src/BrandMark.tsx`; preserve the existing SVG exactly and keep a search re-export at `apps/search/src/client/BrandMark.tsx` to avoid changing all consumers.

Create report files: `src/shared/report.ts`, `src/server/config.ts`, `src/server/api.ts`, `src/server/index.ts`, `src/client/index.html`, `src/client/main.tsx`, `src/client/App.tsx`, `src/client/ReportView.tsx`, `src/client/styles.css`, `fixtures/sample-report.ts`, `tests/report.test.tsx` and `tests/api.test.ts` under `apps/buying-report/`.

Root command mapping (all through `sh scripts/bun.sh`):

```text
dev              scripts/workspace.ts dev search
dev:report       scripts/workspace.ts dev buying-report
start            scripts/start.ts search
start:report     scripts/start.ts buying-report
build            scripts/workspace.ts build
typecheck        --bun tsc --noEmit
test             test tests apps/search/tests apps/buying-report/tests
check            run typecheck && run test && run build
smoke            apps/search/scripts/smoke.ts
smoke:report     apps/buying-report/scripts/smoke.ts
cache:import     apps/search/scripts/import-cache.ts
marketcheck:count apps/search/scripts/marketcheck-count.ts
```

Each app manifest exposes `dev`, `start`, `build`, `typecheck`, `test` via the root wrapper; no reliance on globally installed Bun. Use workspaces `apps/*` and `packages/*`, package names `@carscope/search`, `@carscope/buying-report`, `@carscope/ui`; UI exports its TSX entry and declares React as a peer. App dependencies include React, React DOM and `@carscope/ui: workspace:*`. Resolve workspace links using the local Bun installation and existing lock/cache; do not run npm install or overwrite package-lock.json.

## Task 1: Move search and prove compatibility

**Files:** file moves above; root/app manifests, lockfile, tsconfigs, root launchers, search `src/server/config.ts`, `src/server/budget.ts`, search scripts, workspace tests.

**Interfaces:** `workspacePaths(root: string, env: Record<string,string|undefined>)` returns `{root, cachePath, budgetPath}`; `runApp(app: 'search'|'buying-report', production: boolean)` launches the selected app with canonical server environment. Search retains all existing API contracts.

- [x] Record Git status and a content hash manifest for tracked/untracked source, tests, fixtures and scripts. Exclude secrets, local data, node_modules and build output. Run `sh scripts/bun.sh run check` before moving files; record pre-existing failures instead of attributing them to migration.
- [x] Add a meaningful path regression test before implementing path resolution:

```ts
import {expect, test} from 'bun:test';
import {workspacePaths} from '../scripts/workspace';
test('persistent files stay in root regardless of server location', () => {
  const paths = workspacePaths('/tmp/carscope', {});
  expect(paths.budgetPath).toBe('/tmp/carscope/.budget/marketcheck.sqlite');
  expect(paths.cachePath).toBe('/tmp/carscope/.cache/cars.json');
  expect(workspacePaths('/tmp/carscope', {CAR_CACHE_PATH:'custom/cars.json'}).cachePath)
    .toBe('/tmp/carscope/custom/cars.json');
});
```

- [x] Run `sh scripts/bun.sh test tests/workspace.test.ts`; expect failure for the absent module. Implement a pure helper and guard launcher execution with `import.meta.main`:

```ts
import {resolve} from 'node:path';
export function workspacePaths(root: string, env: Record<string,string|undefined>) {
  return {root: resolve(root),
    cachePath: resolve(root, env.CAR_CACHE_PATH ?? '.cache/cars.json'),
    budgetPath: resolve(root, '.budget/marketcheck.sqlite')};
}
```

- [x] Move whole directories with filesystem moves, including untracked files; preserve relative internal imports. Keep root secrets/runtime/state untouched. Copy root compiler settings into a common config or retain them as the root base; app tsconfigs extend it with local includes.
- [x] Implement launch dispatch using a repository root derived from the root launcher's `import.meta.url`, never caller cwd. Inject absolute `CAR_CACHE_PATH` and `CARSCOPE_BUDGET_PATH` before starting the search child. Load root `.env` explicitly with Bun's env-file argument for launches from any directory. For dev use the app source entry, for production use app `dist/index.js` with cwd at that dist directory (required for Bun's asset manifest). Propagate signals and child exit codes.
- [x] Search budget fallback must no longer point to a newly nested `.budget`. Resolve root via an explicitly provided root location or refuse live access when canonical accounting is unavailable; do not auto-initialize. Adapt standalone marketcheck-count to receive the same canonical environment. Update cache importer default destination to the root cache while preserving explicit input path handling. Do not execute the paid count script during verification.
- [x] Build each app with Bun's existing flags `--target=bun --production --minify` into its own `dist`. The root dispatcher supports building a named app and, once Task 2 exists, both. Root test/build commands are complete only after Task 2.
- [x] Move BrandMark unchanged to the UI package; search shim is `export {BrandMark} from '@carscope/ui';`. Link workspaces using Bun. Do not extract general-purpose controls until both apps actually need them.
- [x] Update search smoke launcher path to root `scripts/start.ts`, with absolute root path/cwd derived from the script location. Keep existing HTML, asset, detail and deep-link assertions. Add `/live` and `/detail-demo` HTML checks only, never live API POSTs.
- [x] Run path test, search tests, typecheck and search build. Run search production smoke. Compare the content manifest to verify moved fixtures/assets/tests are retained; review all intentional path/code differences. Verify no nested `.budget` or `.cache` was created, without printing ledger contents.
- [x] Update architecture and README migration notes in the same deliverable. Review the diff; create a narrowly staged local migration commit only if committing implementation has been authorised, otherwise leave it reviewable in the working tree. Do not stage unrelated pre-existing files blindly.

## Task 2: Offline buying-report app

**Files:** report files in the map, report manifest/tsconfig, `apps/buying-report/scripts/smoke.ts`, root command additions.

**Interfaces:** `BuyingReport` below, `sampleReport: BuyingReport`, `createReportApi(): (request: Request) => Response`, `ReportView({report}: {report: BuyingReport})`, `readReportConfig(env)` returning loopback host/validated port. No search imports.

- [x] Define the source/status contract and add failing rendering tests before writing ReportView:

```ts
export type Finding = {label: string; text: string;
  source: 'fictional-mot'|'seller-claim'|'estimate'|'not-checked'};
export interface BuyingReport {
  kind: 'fictional-sample';
  vehicle: {name: string; year: number; mileage: number; askingPrice: number};
  findings: Finding[];
  checks: {name: 'Finance'|'Stolen status'|'Insurance write-off'; status: 'not-checked'}[];
  costs: {label: string; annualPounds: number; assumption: string}[];
  sellerQuestions: string[];
}
```

```tsx
import {expect, test} from 'bun:test';
import {renderToStaticMarkup} from 'react-dom/server';
import {ReportView} from '../src/client/ReportView';
import {sampleReport} from '../fixtures/sample-report';
test('sample cannot present unperformed checks as clear', () => {
  const html = renderToStaticMarkup(<ReportView report={sampleReport}/>);
  expect(html).toContain('Fictional sample');
  expect(html).toContain('Not checked');
  expect(html).toContain('Personal quote needed');
  expect(html).not.toContain('History clear');
  expect(html).not.toContain('Verified valuation');
});
```

- [x] Run `sh scripts/bun.sh test apps/buying-report/tests`; expect missing-module failure. Create the model and fictional sample: a 2018 VW Golf, 62,000 miles, £12,500 asking price, fictional tyre advisory, seller-claimed service history without records, and questions requesting tyre condition and service invoices. Set all three commercial checks to not-checked. Use fuel £1,260/year from 8,000 miles, 45 imperial mpg and £1.56/litre (rounded); servicing £300 and tyre allowance £150 are explicitly illustrative placeholders, not sourced vehicle quotes. Do not invent a tax amount or valuation; show these as unavailable in this sample.
- [x] Implement `createReportApi` with GET `/api/sample-report` returning the fixed fixture and `Cache-Control: no-store`; unsupported methods return 405 and unknown API paths return 404. No provider clients, keys or arbitrary URL inputs exist in this module.
- [x] Add API tests asserting 200 plus `kind === 'fictional-sample'`, POST is 405 and unknown API route is 404. Add config tests asserting default port 3001, `REPORT_PORT=4322` works, `PORT=4321` is ignored, invalid `REPORT_PORT=abc` throws and missing supplier keys do not matter. Implement config with `HOST ?? '127.0.0.1'` and integer port validation 1–65535.
- [x] Implement Bun server with HTML routes `/` and `/report`, app-owned API route and 404 fallback. Connect `main.tsx` through HTML using the same React/Bun entry pattern as search. Import only BrandMark from UI. Keep report CSS independent.
- [x] Build a responsive welcome page with explicit “View sample report” action and a short fictional vehicle summary. Omit real registration inputs in this first slice to avoid implying live lookup. App state is `idle | loading | ready | error`; fetch only the same-origin sample endpoint after the action. On failure show “We couldn’t load the sample report” and a retry button. Render no successful report while loading or after failure. Validate `kind` before setting ready.
- [x] Render report in plain-English sections: vehicle and asking price; things to investigate; fictional MOT findings; ownership budget with visible assumptions; seller questions; outstanding checks. Show “Fictional sample — no vehicle checks have been performed” above the report. Do not derive a buy/don't-buy verdict. Use semantic headings, visible focus, high contrast, keyboard-operable controls and mobile layouts. Apply frontend-design skill during implementation, preserving established brand character.
- [x] Add a pure state-view helper or component test for loading/error/ready so failures cannot render ReportView. Assert seller claims and estimates retain their labels. Confirm the chosen numbers and cost assumptions agree, with a rounding tolerance for fuel.
- [x] Run report tests and typecheck. Add a local production smoke script following search's child lifecycle: loopback random port, `REPORT_PORT`, fetch HTML and same-origin built JS/CSS, fetch sample JSON and assert kind/check statuses, kill child in finally. Exercise `/report` deep link and a missing route. Run report build and smoke without external requests.
- [x] Review the report diff and retain as a separate reviewable deliverable; only commit if implementation commits have been authorised.

## Task 3: Integrated verification and documentation

**Files:** root `README.md`, `docs/architecture.md`, `.env.example`, launch/config fixes only when verification exposes a defect.

**Interfaces:** root commands described above are the user-facing interface; no new application interfaces.

- [x] Document root commands for npm and Bun, the local `.tools/bun` fallback, search default port 3000 and report default port 3001, separate app folders, root-owned secrets/state, report mock-only scope and sample provenance. Keep existing key documentation; add `REPORT_PORT=3001` as an optional setting without actual secrets.
- [x] Run `npm run check`, `npm run smoke` and `npm run smoke:report`. Expected: typecheck, existing and new tests, both builds and both production smoke checks pass. If network restrictions prevent local socket tests, request the narrow permission rather than skipping verification.
- [x] Start both dev apps simultaneously via root commands. Inspect search demo and live initial UI without submitting paid actions. Inspect report start, sample report, retry state if practical, keyboard focus, and desktop/mobile widths in the browser. Confirm no report text implies a real registration lookup, exact insurance quote, verified valuation or cleared commercial history.
- [x] Verify root start commands from the IDE-compatible path and app manifest dev/start commands from app directories. Check graceful shutdown; avoid leaving duplicate servers. Preserve an existing user server unless a restart is needed and explain the change.
- [x] Inspect final diff and Git status, confirm only intended moves/edits, no secrets, no ledger changes and no provider snapshots. Run a static import scan to ensure report has no search imports and UI has neither app as a dependency. Run a fresh review using the execution method selected by the user.
- [x] Report both local URLs, commands, verification results and remaining demo limitations. Do not claim supplier integration or live reporting is complete.

## Self-review

Spec coverage: structure and compatibility are Task 1; report scope/data flow/errors are Task 2; acceptance, browser checks and documentation are Task 3. All five review risks have corresponding checks. Model and component names are consistent. Root persistent files remain outside moved directories, and no task requires a paid provider call. The two product changes remain separately reviewable; no new data procurement is required.
