# Buying Report Maintainability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the CarScope buying-report application into readable, typed, focused modules without changing its UI, report meaning, API contract or supplier-call cost.

**Architecture:** Pure domain builders will turn `BuyingReport` into presentation-ready overview and briefing models; focused React components will only render those models. The Vehicle Data Global adapter will be split into HTTP, extraction, package-normalisation and report-construction modules, with `unknown` narrowed at the boundary. Biome will enforce readable source formatting and linting across the buying-report scope.

**Tech Stack:** Bun 1.4, React 19, TypeScript 5.9, Bun test, Biome

**Spec:** `docs/superpowers/specs/2026-09-25-buying-report-maintainability-design.md`

## Global Constraints

- Preserve the current mock and live customer journeys and visible report wording.
- Preserve one `CarScopeFree` preview call and three concurrent completion calls: `VDICheck`, `ValuationDetails`, and `TyreDetails`.
- Do not add payment, email, persistence, PDF or AI services.
- Keep `BuyingReport` JSON-compatible throughout the migration.
- Keep API keys server-only and do not retain raw provider responses.
- Missing data must remain unavailable or not checked; never convert it to zero or a clear result.
- New provider modules must contain no `any`.
- Format only buying-report code, tests and directly touched workspace configuration.
- Keep existing CSS class names while components move.
- Use test-first red-green-refactor for every behavioural extraction.
- Leave the unrelated root `package-lock.json` untracked.

## Review Focus

- A supplier package returns HTTP 200 with a malformed or unsuccessful envelope: treat it as unavailable, never as a successful empty check; covered in Task 7.
- An older vehicle has MOT records but only some carry mileage: the briefing must describe incomplete mileage evidence without claiming a clear history; covered in Task 3.
- Finance is returned and a supplier-generated seller question also mentions finance: show one concise finance action, not duplicates; covered in Task 3.
- A live completion has one optional package failure: generate the report from successful packages and expose the failed package as a gap without retrying; covered in Task 9.
- A registration or supplier string contains unexpected casing or missing nested fields: normalise known values and reject only when vehicle identity cannot be established; covered in Tasks 7 and 8.

---

## File map

### Workspace configuration

- Create `biome.json`: formatting and lint configuration with generated/local paths excluded.
- Modify `package.json`: add Biome, formatting and lint scripts; extend `check`.
- Modify `bun.lock`: record the Biome development dependency.

### Domain

- Create `apps/buying-report/src/domain/formatters.ts`: money, duration, date and registration formatting.
- Create `apps/buying-report/src/domain/vehicle-status.ts`: MOT/tax display labels and freshness view models.
- Create `apps/buying-report/src/domain/buyer-briefing.ts`: pure briefing rules and output types.
- Create `apps/buying-report/src/domain/record-overview.ts`: pure counts, attention records and guidance.

### Report UI

- Create `apps/buying-report/src/client/report/ReportChapter.tsx`: common chapter heading shell.
- Create `apps/buying-report/src/client/report/BuyerBriefing.tsx`: briefing renderer.
- Create `apps/buying-report/src/client/report/RecordOverview.tsx`: overview renderer.
- Create `apps/buying-report/src/client/report/FinanceRecordDetails.tsx`: finance record renderer.
- Create `apps/buying-report/src/client/report/EvSection.tsx`: EV metrics and charging renderer.
- Create `apps/buying-report/src/client/report/VehicleDetailsChapter.tsx`: vehicle, EV and tyre chapter.
- Create `apps/buying-report/src/client/report/HistoryChapter.tsx`: history and mileage chapter.
- Create `apps/buying-report/src/client/report/OwnershipChapter.tsx`: valuation, running-cost and tax chapter.
- Create `apps/buying-report/src/client/report/BeforeYouBuyChapter.tsx`: checks and questions chapter.
- Move `apps/buying-report/src/client/ReportView.tsx` to `apps/buying-report/src/client/report/ReportView.tsx`: composition root.
- Update imports that consume `ReportView`.

### Journey UI

- Create `apps/buying-report/src/client/journey/RegistrationStep.tsx`: registration form and examples.
- Create `apps/buying-report/src/client/journey/PreviewStep.tsx`: preview state and error shell.
- Create `apps/buying-report/src/client/journey/ReportStep.tsx`: report actions and report rendering.
- Modify `apps/buying-report/src/client/App.tsx`: retain state, effects and API orchestration; delegate markup.

### Provider

- Create `apps/buying-report/src/server/provider/types.ts`: narrow supplier input types and normalised package types.
- Create `apps/buying-report/src/server/provider/guards.ts`: safe record/list/string/number/date extractors.
- Create `apps/buying-report/src/server/provider/client.ts`: package request and envelope handling.
- Create `apps/buying-report/src/server/provider/normalise-vehicle.ts`: identity, specification, tax, image and EV mapping.
- Create `apps/buying-report/src/server/provider/normalise-history.ts`: MOT, keeper, finance, theft and write-off mapping.
- Create `apps/buying-report/src/server/provider/normalise-valuation.ts`: valuation mapping.
- Create `apps/buying-report/src/server/provider/normalise-tyres.ts`: tyre mapping.
- Create `apps/buying-report/src/server/provider/build-report.ts`: assemble `BuyingReport` and customer-facing deterministic findings.
- Reduce `apps/buying-report/src/server/provider.ts` to preview/completion orchestration and stable exports.

### Tests

- Create `apps/buying-report/tests/formatters.test.ts`.
- Create `apps/buying-report/tests/buyer-briefing.test.ts`.
- Create `apps/buying-report/tests/record-overview.test.ts`.
- Create `apps/buying-report/tests/provider-guards.test.ts`.
- Create `apps/buying-report/tests/provider-normalisers.test.ts`.
- Modify existing report, provider, journey and style tests to import new modules while retaining behavioural coverage.

---

### Task 1: Enforce readable formatting and linting

**Files:**
- Create: `biome.json`
- Modify: `package.json`
- Modify: `bun.lock`
- Format: `apps/buying-report/src/**/*.{ts,tsx}`
- Format: `apps/buying-report/tests/**/*.{ts,tsx}`

**Interfaces:**
- Consumes: existing root `check` script and Bun workspace.
- Produces: `format`, `format:check`, and `lint` scripts; readable buying-report source for later tasks.

- [ ] **Step 1: Add the formatter dependency and scripts**

Run:

```bash
./scripts/bun.sh add --dev --exact @biomejs/biome
```

Add these scripts to the root `package.json`:

```json
{
  "format": "sh scripts/bun.sh x biome format --write apps/buying-report",
  "format:check": "sh scripts/bun.sh x biome format apps/buying-report",
  "lint": "sh scripts/bun.sh x biome lint apps/buying-report",
  "check": "sh scripts/bun.sh run format:check && sh scripts/bun.sh run lint && sh scripts/bun.sh run typecheck && sh scripts/bun.sh run test && sh scripts/bun.sh run build"
}
```

- [ ] **Step 2: Add scoped Biome configuration**

Create `biome.json` with two-space indentation, 100-character lines, single quotes in JavaScript, double quotes in JSX, organised imports, and exclusions for `dist`, `node_modules`, `.cache`, `.local`, `.budget`, and generated output. Enable recommended lint rules but disable only rules proven incompatible with the current React 19 patterns.

- [ ] **Step 3: Verify format check fails on the existing dense source**

Run:

```bash
./scripts/bun.sh run format:check
```

Expected: non-zero exit naming buying-report files that require formatting.

- [ ] **Step 4: Format the buying-report scope**

Run:

```bash
./scripts/bun.sh run format
```

Inspect the diff and confirm it contains no search-application source.

- [ ] **Step 5: Fix lint findings without changing behaviour**

Run:

```bash
./scripts/bun.sh run lint
```

Fix each finding in the buying-report scope. Do not suppress a rule globally unless the rule conflicts with an intentional project-wide pattern documented in `biome.json`.

- [ ] **Step 6: Verify the complete workspace**

Run:

```bash
./scripts/bun.sh run check
```

Expected: format, lint, typecheck, all tests and both production builds pass.

- [ ] **Step 7: Commit**

```bash
git add biome.json package.json bun.lock apps/buying-report/src apps/buying-report/tests
git commit -m "chore: enforce buying report code quality"
```

### Task 2: Extract shared formatters and status presentation

**Files:**
- Create: `apps/buying-report/src/domain/formatters.ts`
- Create: `apps/buying-report/src/domain/vehicle-status.ts`
- Create: `apps/buying-report/tests/formatters.test.ts`
- Modify: `apps/buying-report/src/client/ReportView.tsx`
- Modify: `apps/buying-report/src/client/VehiclePreview.tsx`
- Modify: `apps/buying-report/src/shared/preview.ts`

**Interfaces:**
- Consumes: `BuyingReport`, `VehiclePreview`, `statusCopy`, and current formatting output.
- Produces: `formatMoney`, `formatDuration`, `formatDate`, `formatRegistration`, `buildMotDisplay`, and `buildTaxDisplay`.

- [ ] **Step 1: Write failing formatter tests**

Create tests asserting:

```ts
expect(formatMoney(76344)).toBe('£76,344');
expect(formatDuration(1957)).toBe('32 hr 37 min');
expect(formatRegistration('sl60auc')).toBe('SL60 AUC');
expect(formatRegistration('A1')).toBe('A1');
expect(formatDate('2026-09-20')).toBe('20 Sep 2026');
```

Add status tests asserting a valid MOT produces `MOT valid`, an absent tax object produces `Tax status unavailable`, and a dated stale status retains the existing freshness wording.

- [ ] **Step 2: Run the focused tests and verify missing-module failure**

Run:

```bash
./scripts/bun.sh test apps/buying-report/tests/formatters.test.ts
```

Expected: fail because the domain modules do not exist.

- [ ] **Step 3: Implement pure formatters and display builders**

Use explicit exported types:

```ts
export interface StatusDisplay {
  label: string;
  freshness: string;
  state: string;
}

export function buildMotDisplay(report: BuyingReport): StatusDisplay;
export function buildTaxDisplay(report: BuyingReport): StatusDisplay;
```

Preserve the exact current strings and UTC date behaviour.

- [ ] **Step 4: Replace local formatter and status functions**

Import the domain helpers into report and preview UI. Remove only helpers whose callers have migrated.

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
./scripts/bun.sh test apps/buying-report/tests/formatters.test.ts apps/buying-report/tests/report.test.tsx apps/buying-report/tests/preview-ui.test.tsx
./scripts/bun.sh run check
```

Expected: all pass with unchanged rendered wording.

- [ ] **Step 6: Commit**

```bash
git add apps/buying-report/src/domain apps/buying-report/src/client apps/buying-report/src/shared apps/buying-report/tests
git commit -m "refactor: centralize report formatting and status display"
```

### Task 3: Extract the buyer briefing domain model and view

**Files:**
- Create: `apps/buying-report/src/domain/buyer-briefing.ts`
- Create: `apps/buying-report/src/client/report/BuyerBriefing.tsx`
- Create: `apps/buying-report/tests/buyer-briefing.test.ts`
- Modify: `apps/buying-report/src/client/ReportView.tsx`
- Modify: `apps/buying-report/tests/report.test.tsx`

**Interfaces:**
- Consumes: `BuyingReport` and `reportAnchor`.
- Produces: `buildBuyerBriefing(report: BuyingReport): BuyerBriefing` and `BuyerBriefingView({ briefing }: { briefing: BuyerBriefing })`.

- [ ] **Step 1: Define the desired domain contract in failing tests**

Use this interface in test expectations:

```ts
export interface BuyerBriefing {
  summary: string;
  priority?: { eyebrow: string; title: string; text: string; href: string };
  questions: string[];
  limitation: string;
  disclosure: string;
}
```

Test finance priority, sparse older MOT mileage, EV battery limitation, no duplicated finance question, a maximum of four questions, significant-event fallback, and a generic limited-history summary.

- [ ] **Step 2: Run tests and verify missing builder failure**

Run:

```bash
./scripts/bun.sh test apps/buying-report/tests/buyer-briefing.test.ts
```

Expected: fail because `buildBuyerBriefing` does not exist.

- [ ] **Step 3: Implement the pure builder**

Move all selection and wording rules from React into `buyer-briefing.ts`. Replace `vehicle.year < 2000` with:

```ts
const PRE_DIGITAL_HISTORY_HEURISTIC_YEAR = 2000;
```

Document that this is conservative presentation wording, not a statutory MOT-data boundary.

- [ ] **Step 4: Implement the renderer**

Move existing markup and class names into `BuyerBriefing.tsx`. The component must contain no checks against `BuyingReport` fields.

- [ ] **Step 5: Integrate and remove the old inline implementation**

In `ReportView`, call the builder once and render:

```tsx
<BuyerBriefingView briefing={buildBuyerBriefing(report)} />
```

Keep the existing rendered-report assertions temporarily and add direct domain assertions.

- [ ] **Step 6: Verify focused and full behaviour**

Run:

```bash
./scripts/bun.sh test apps/buying-report/tests/buyer-briefing.test.ts apps/buying-report/tests/report.test.tsx
./scripts/bun.sh run check
```

- [ ] **Step 7: Commit**

```bash
git add apps/buying-report/src/domain/buyer-briefing.ts apps/buying-report/src/client/report/BuyerBriefing.tsx apps/buying-report/src/client/ReportView.tsx apps/buying-report/tests
git commit -m "refactor: isolate buyer briefing rules"
```

### Task 4: Extract the record overview domain model and view

**Files:**
- Create: `apps/buying-report/src/domain/record-overview.ts`
- Create: `apps/buying-report/src/client/report/RecordOverview.tsx`
- Create: `apps/buying-report/tests/record-overview.test.ts`
- Modify: `apps/buying-report/src/client/ReportView.tsx`
- Modify: `apps/buying-report/tests/report.test.tsx`

**Interfaces:**
- Consumes: `BuyingReport`, status-display builders, and `reportAnchor`.
- Produces: `buildRecordOverview(report: BuyingReport): RecordOverviewModel` and `RecordOverview({ model }: { model: RecordOverviewModel })`.

- [ ] **Step 1: Write failing domain tests**

Define and assert this shape:

```ts
export interface RecordOverviewModel {
  mot: StatusDisplay;
  tax: StatusDisplay;
  stats: Array<{ value: number; label: string; tone: 'neutral' | 'attention' | 'pending' }>;
  attention: Array<{ label: string; detail: string; href: string }>;
  whyItMatters: string;
  nextStep: string;
  findings: Array<{ sourceLabel: string; label: string; text: string }>;
}
```

Test counts for MOT, keeper, significant history and finance records; finance evidence links; significant-event anchors; unchecked status; and zero-record wording.

- [ ] **Step 2: Verify the tests fail because the builder is missing**

Run:

```bash
./scripts/bun.sh test apps/buying-report/tests/record-overview.test.ts
```

- [ ] **Step 3: Implement the pure builder and renderer**

Move calculations into the domain module and preserve existing strings. Move markup and class names into the focused component.

- [ ] **Step 4: Integrate and delete inline overview code**

`ReportView` derives the model once and passes it to `RecordOverview`.

- [ ] **Step 5: Verify**

Run:

```bash
./scripts/bun.sh test apps/buying-report/tests/record-overview.test.ts apps/buying-report/tests/report.test.tsx
./scripts/bun.sh run check
```

- [ ] **Step 6: Commit**

```bash
git add apps/buying-report/src/domain/record-overview.ts apps/buying-report/src/client/report/RecordOverview.tsx apps/buying-report/src/client/ReportView.tsx apps/buying-report/tests
git commit -m "refactor: isolate report overview rules"
```

### Task 5: Split report chapters and reduce ReportView to composition

**Files:**
- Create: `apps/buying-report/src/client/report/ReportChapter.tsx`
- Create: `apps/buying-report/src/client/report/FinanceRecordDetails.tsx`
- Create: `apps/buying-report/src/client/report/EvSection.tsx`
- Create: `apps/buying-report/src/client/report/VehicleDetailsChapter.tsx`
- Create: `apps/buying-report/src/client/report/HistoryChapter.tsx`
- Create: `apps/buying-report/src/client/report/OwnershipChapter.tsx`
- Create: `apps/buying-report/src/client/report/BeforeYouBuyChapter.tsx`
- Move: `apps/buying-report/src/client/ReportView.tsx` to `apps/buying-report/src/client/report/ReportView.tsx`
- Modify: `apps/buying-report/src/client/ReportContent.tsx`
- Modify: buying-report tests importing `ReportView`

**Interfaces:**
- Consumes: `BuyingReport`, domain formatters, `HistoryView`, `VehicleFacts`, and `VehiclePortrait`.
- Produces: focused chapter components and a composition-only `ReportView`.

- [ ] **Step 1: Strengthen composition-contract tests before moving code**

Add assertions to the existing rendered report test that the section order remains:

```text
Vehicle identified
Record overview
Your buyer briefing
Vehicle details
History and mileage
Value and ownership
Before you buy
Sources, gaps and assumptions
```

Assert finance and history anchors remain identical.

- [ ] **Step 2: Run the report tests and confirm they pass before extraction**

Run:

```bash
./scripts/bun.sh test apps/buying-report/tests/report.test.tsx apps/buying-report/tests/history.test.tsx apps/buying-report/tests/vehicle-story.test.tsx
```

Expected: pass, establishing the baseline contract.

- [ ] **Step 3: Extract common and leaf components one at a time**

Extract `ReportChapter`, `FinanceRecordDetails`, and `EvSection` first. After each extraction, run `report.test.tsx` and commit only after the entire task is green.

- [ ] **Step 4: Extract each chapter with narrow props**

Use these component contracts:

```ts
VehicleDetailsChapter({ report }: { report: BuyingReport })
HistoryChapter({ report }: { report: BuyingReport })
OwnershipChapter({ report }: { report: BuyingReport })
BeforeYouBuyChapter({ report }: { report: BuyingReport })
```

Keep these whole-report props initially because each chapter consumes several related fields. Do not introduce a second view-model layer solely to reduce prop width.

- [ ] **Step 5: Move ReportView and update imports**

The final `ReportView` should contain vehicle-header composition, model derivation and child component ordering, with no chapter-specific calculations.

- [ ] **Step 6: Verify**

Run:

```bash
./scripts/bun.sh test apps/buying-report/tests/report.test.tsx apps/buying-report/tests/history.test.tsx apps/buying-report/tests/vehicle-story.test.tsx
./scripts/bun.sh run check
```

- [ ] **Step 7: Commit**

```bash
git add apps/buying-report/src/client apps/buying-report/tests
git commit -m "refactor: split buying report into focused chapters"
```

### Task 6: Split journey presentation from application orchestration

**Files:**
- Create: `apps/buying-report/src/client/journey/RegistrationStep.tsx`
- Create: `apps/buying-report/src/client/journey/PreviewStep.tsx`
- Create: `apps/buying-report/src/client/journey/ReportStep.tsx`
- Modify: `apps/buying-report/src/client/App.tsx`
- Modify: `apps/buying-report/tests/entry-page.test.tsx`
- Modify: `apps/buying-report/tests/confirmation.test.tsx`

**Interfaces:**
- Consumes: current journey state, callbacks, `VehiclePreviewCard`, and `ReportView`.
- Produces: presentational step components; `App` remains the sole owner of asynchronous state transitions.

- [ ] **Step 1: Add journey contract assertions**

Test registration input, mode-specific example vehicles, preview generation action, back navigation and complete-report actions using rendered markup and callback spies only where user interaction requires them.

- [ ] **Step 2: Run journey tests and confirm the baseline passes**

Run:

```bash
./scripts/bun.sh test apps/buying-report/tests/entry-page.test.tsx apps/buying-report/tests/confirmation.test.tsx apps/buying-report/tests/preview-ui.test.tsx
```

- [ ] **Step 3: Extract typed step components**

`RegistrationStep` receives registration value, mode, busy state, error, examples and callbacks. `PreviewStep` receives the preview, mode, busy state, error and callbacks. `ReportStep` receives the report and navigation callbacks.

- [ ] **Step 4: Reduce App to orchestration**

Keep `useState`, `useEffect`, focus management, fetch calls and stage transitions in `App`. Render one step component per state; do not introduce context or a reducer unless the existing discriminated stage state cannot remain valid.

- [ ] **Step 5: Verify**

Run:

```bash
./scripts/bun.sh test apps/buying-report/tests/entry-page.test.tsx apps/buying-report/tests/confirmation.test.tsx apps/buying-report/tests/preview-ui.test.tsx apps/buying-report/tests/api.test.ts
./scripts/bun.sh run check
```

- [ ] **Step 6: Commit**

```bash
git add apps/buying-report/src/client/App.tsx apps/buying-report/src/client/journey apps/buying-report/tests
git commit -m "refactor: separate report journey presentation"
```

### Task 7: Create a typed provider HTTP boundary

**Files:**
- Create: `apps/buying-report/src/server/provider/types.ts`
- Create: `apps/buying-report/src/server/provider/guards.ts`
- Create: `apps/buying-report/src/server/provider/client.ts`
- Create: `apps/buying-report/tests/provider-guards.test.ts`
- Modify: `apps/buying-report/tests/provider.test.ts`
- Modify: `apps/buying-report/src/server/provider.ts`

**Interfaces:**
- Consumes: `Fetcher`, package names, API key, registration and Vehicle Data Global JSON.
- Produces: `requestPackage(name, registration, apiKey, fetcher): Promise<SupplierRecord>` and safe extraction helpers operating on `unknown`.

- [ ] **Step 1: Write failing guard tests**

Test:

```ts
expect(asRecord(null)).toBeUndefined();
expect(asRecord([])).toBeUndefined();
expect(asRecord({ value: 1 })).toEqual({ value: 1 });
expect(asFiniteNumber(0)).toBe(0);
expect(asFiniteNumber('0')).toBeUndefined();
expect(asDay('2026-09-20T10:30:00Z')).toBe('2026-09-20');
expect(asList({})).toEqual([]);
```

Add client tests for non-2xx response, `IsSuccessStatusCode: false`, missing `Results`, timeout propagation and a valid envelope.

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```bash
./scripts/bun.sh test apps/buying-report/tests/provider-guards.test.ts
```

- [ ] **Step 3: Implement narrow types and guards**

Use:

```ts
export type SupplierRecord = Record<string, unknown>;
export type PackageName = 'CarScopeFree' | 'VDICheck' | 'ValuationDetails' | 'TyreDetails';
export type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
```

Every nested access must pass through a guard or typed normaliser. Do not cast the entire response to a trusted schema.

- [ ] **Step 4: Move request construction and envelope validation**

Build the URL with `URLSearchParams`, retain the 20-second timeout, and preserve existing error messages unless a test establishes a clearer safe message.

- [ ] **Step 5: Integrate the client without changing orchestration**

`provider.ts` imports `requestPackage`, package constants and types. Existing preview/completion tests must observe identical request counts and query parameters.

- [ ] **Step 6: Verify**

Run:

```bash
./scripts/bun.sh test apps/buying-report/tests/provider-guards.test.ts apps/buying-report/tests/provider.test.ts
./scripts/bun.sh run check
```

- [ ] **Step 7: Commit**

```bash
git add apps/buying-report/src/server/provider apps/buying-report/src/server/provider.ts apps/buying-report/tests
git commit -m "refactor: add typed vehicle data provider boundary"
```

### Task 8: Split and test supplier package normalisers

**Files:**
- Create: `apps/buying-report/src/server/provider/normalise-vehicle.ts`
- Create: `apps/buying-report/src/server/provider/normalise-history.ts`
- Create: `apps/buying-report/src/server/provider/normalise-valuation.ts`
- Create: `apps/buying-report/src/server/provider/normalise-tyres.ts`
- Create: `apps/buying-report/tests/provider-normalisers.test.ts`
- Modify: `apps/buying-report/src/server/provider.ts`
- Modify: `apps/buying-report/tests/provider.test.ts`

**Interfaces:**
- Consumes: guarded `SupplierRecord` package results.
- Produces: normalised vehicle, history, valuation and tyre structures with no customer-facing conclusions.

- [ ] **Step 1: Write failing normaliser tests from existing fixtures**

Cover:

- valid Porsche/EV specifications and charge ports;
- missing vehicle make/model rejects identification;
- unexpected lowercase/capitalisation normalises known performance designations;
- MOT readings accept numeric mile strings and reject kilometres or invalid values;
- missing annotations remain absent rather than empty invented findings;
- finance retains permitted descriptive fields but discards agreement number;
- standard tyre fitment is preferred and missing pressure remains unavailable;
- valuation includes only finite returned figures.

- [ ] **Step 2: Run tests and verify missing exports fail**

Run:

```bash
./scripts/bun.sh test apps/buying-report/tests/provider-normalisers.test.ts
```

- [ ] **Step 3: Extract vehicle and EV normalisation**

Return an explicit normalised object containing vehicle identity, detail, optional EV data, tax input and image. Keep title formatting in this server adapter because it repairs supplier presentation, but move display-only labels to the domain layer.

- [ ] **Step 4: Extract history/check normalisation**

Return MOT records, keeper changes, finance records, write-offs and check statuses as facts. Do not create report findings in the normaliser.

- [ ] **Step 5: Extract valuation and tyre normalisation**

Preserve current source labels, standard-fitment preference and unavailable behaviour.

- [ ] **Step 6: Remove the old helper implementations and all provider `any`**

Run:

```bash
rg -n "\bany\b" apps/buying-report/src/server/provider.ts apps/buying-report/src/server/provider
```

Expected: no matches except explanatory comments, which should also be avoided.

- [ ] **Step 7: Verify**

Run:

```bash
./scripts/bun.sh test apps/buying-report/tests/provider-normalisers.test.ts apps/buying-report/tests/provider.test.ts
./scripts/bun.sh run check
```

- [ ] **Step 8: Commit**

```bash
git add apps/buying-report/src/server/provider apps/buying-report/src/server/provider.ts apps/buying-report/tests
git commit -m "refactor: split vehicle data normalisers"
```

### Task 9: Isolate report construction and provider orchestration

**Files:**
- Create: `apps/buying-report/src/server/provider/build-report.ts`
- Modify: `apps/buying-report/src/server/provider.ts`
- Modify: `apps/buying-report/tests/provider.test.ts`
- Modify: `apps/buying-report/tests/report.test.tsx`

**Interfaces:**
- Consumes: normalised vehicle/history/valuation/tyre facts plus missing-package labels.
- Produces: `buildBuyingReport(input: NormalisedReportInput): BuyingReport`; stable `lookupSandboxPreview`, `completeSandboxReport`, and `lookupSandboxReport` exports.

- [ ] **Step 1: Add failing report-construction tests**

Directly test that normalised finance, write-off, MOT failure and dangerous annotations produce the current findings and seller questions. Test that no headline record produces cautious wording, and missing optional packages become evidence notes rather than false values.

- [ ] **Step 2: Add orchestration failure tests**

Assert one failed completion package:

- is called exactly once;
- does not reject the complete report;
- adds `<Package> unavailable for this report.`;
- does not create a clear result from the failed source.

- [ ] **Step 3: Verify the new direct tests fail**

Run:

```bash
./scripts/bun.sh test apps/buying-report/tests/provider.test.ts
```

- [ ] **Step 4: Move deterministic report construction**

`build-report.ts` owns findings, seller questions, history notes, missing-data prose and final `BuyingReport` assembly. It does not fetch or inspect HTTP envelopes.

- [ ] **Step 5: Reduce provider.ts to orchestration**

Keep sandbox registration validation and public exports stable. Preview requests `CarScopeFree`; completion requests the three remaining packages with `Promise.allSettled`, passes successful normalised facts and named gaps into the builder, and never retries.

- [ ] **Step 6: Verify all provider and report contracts**

Run:

```bash
./scripts/bun.sh test apps/buying-report/tests/provider.test.ts apps/buying-report/tests/api.test.ts apps/buying-report/tests/report.test.tsx
./scripts/bun.sh run check
```

- [ ] **Step 7: Commit**

```bash
git add apps/buying-report/src/server apps/buying-report/tests
git commit -m "refactor: separate provider orchestration from report construction"
```

### Task 10: Reorganise CSS without changing the design

**Files:**
- Modify: `apps/buying-report/src/client/styles.css`
- Modify: `apps/buying-report/tests/styles.test.ts`

**Interfaces:**
- Consumes: unchanged component class names.
- Produces: one formatted, sectioned stylesheet with consolidated responsive blocks.

- [ ] **Step 1: Add stylesheet contract tests**

Retain existing marker and card-spacing assertions. Add checks for buyer-briefing desktop/mobile layout, record-overview responsive collapse, and one authoritative rule for each duplicated selector being consolidated.

- [ ] **Step 2: Run style tests and establish their baseline**

Run:

```bash
./scripts/bun.sh test apps/buying-report/tests/styles.test.ts
```

- [ ] **Step 3: Reorder and comment the stylesheet**

Use section comments for shell, journey, preview, overview/briefing, chapters, history/vehicle and responsive overrides. Consolidate compatible `@media` blocks while preserving selector specificity and source order where it affects the cascade.

- [ ] **Step 4: Check for unused classes before removal**

For every candidate selector, search source and tests with `rg`. Remove only selectors with no buying-report usage and no dynamically constructed class-name path.

- [ ] **Step 5: Verify style, report and full checks**

Run:

```bash
./scripts/bun.sh test apps/buying-report/tests/styles.test.ts apps/buying-report/tests/report.test.tsx
./scripts/bun.sh run check
```

- [ ] **Step 6: Commit**

```bash
git add apps/buying-report/src/client/styles.css apps/buying-report/tests/styles.test.ts
git commit -m "style: organise buying report stylesheet"
```

### Task 11: Manual visual regression and final verification

**Files:**
- Modify only if a verified regression is found: files owned by Tasks 2–10.

**Interfaces:**
- Consumes: complete refactored buying-report application.
- Produces: verified desktop/mobile mock flows for Porsche, Lotus, Fiat and Tesla.

- [ ] **Step 1: Start the report application on the configured port**

Run:

```bash
./scripts/bun.sh run dev:report
```

If port 9000 is already served by the current project, use that process and refresh after the build.

- [ ] **Step 2: Inspect all mock vehicles at desktop width**

For Porsche, Lotus, Fiat and Tesla, verify registration, preview, complete report, status colours, overview, buyer briefing, evidence links, chapter order, history expansion, tyre spacing and EV charging layout.

- [ ] **Step 3: Inspect representative mobile widths**

At approximately 390px width, inspect Porsche and Tesla. Verify no horizontal overflow, legible registration/status elements, stacked briefing sections, report chapter spacing and accessible controls.

- [ ] **Step 4: Run final automated verification**

Run:

```bash
./scripts/bun.sh run check
git diff --check
git status --short
```

Expected: all checks pass; only the deliberately untracked `package-lock.json` remains outside commits.

- [ ] **Step 5: Commit verified corrections, if any**

```bash
git add apps/buying-report
git commit -m "fix: resolve buying report refactor regressions"
```

Skip this commit when visual verification requires no correction.

### Task 12: Connect and publish the repository safely

**Files:**
- Modify: local Git configuration only.

**Interfaces:**
- Consumes: `https://github.com/dale976/CarScope.git` and the verified local `main` branch.
- Produces: configured `origin` and a normal fast-forward push when remote history is compatible.

- [ ] **Step 1: Inspect the remote before changing local configuration**

Run:

```bash
git ls-remote --symref https://github.com/dale976/CarScope.git HEAD
```

If no refs are returned, treat the remote as empty. If refs exist, fetch them and compare histories before attempting a push.

- [ ] **Step 2: Add origin only when absent**

Run:

```bash
git remote add origin https://github.com/dale976/CarScope.git
git remote -v
```

If `origin` already exists, verify its URL instead of replacing it.

- [ ] **Step 3: Reconcile non-empty remote history safely**

If the remote contains commits, run:

```bash
git fetch origin
git log --oneline --decorate --graph --all -20
```

Stop for user input if histories are unrelated or merging would alter existing remote files. Do not force-push.

- [ ] **Step 4: Push the verified branch**

For an empty or compatible remote:

```bash
git push -u origin main
```

- [ ] **Step 5: Confirm the published state**

Run:

```bash
git status --short --branch
git remote -v
```

Expected: `main` tracks `origin/main`; only the intentionally untracked root `package-lock.json` remains local.

---

## Completion evidence

The refactor is complete only when:

- `./scripts/bun.sh run check` exits successfully;
- all existing and new tests pass;
- `rg -n "\bany\b" apps/buying-report/src/server/provider.ts apps/buying-report/src/server/provider` finds no provider `any`;
- `ReportView` contains composition rather than report-rule implementations;
- `App` contains orchestration rather than all journey markup;
- browser inspection passes for the four mock reports and mobile layouts;
- supplier request-count tests still prove one preview call and three completion calls without retries;
- no generated files, secrets, `.env`, local reports or `package-lock.json` are included in the commits;
- the remote is only pushed through a normal non-force update after its history is inspected.
