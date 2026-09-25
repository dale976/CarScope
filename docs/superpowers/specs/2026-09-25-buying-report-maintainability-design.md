# Buying report maintainability refactor

Date: 25 September 2026
Status: Proposed for implementation

## Purpose

Refactor the CarScope buying-report application so a human developer can understand, modify and review it without tracing dense JSX, mixed business rules or untyped supplier payloads. The refactor must preserve the current UI, report wording, supplier-call behaviour and customer journey.

This work addresses maintainability before payment, persistence, email or AI integration add more responsibilities to the application.

## Current problems

### Dense presentation files

`ReportView.tsx` contains formatting helpers, status mappings, report interpretation, buyer-briefing rules and most of the report markup. `App.tsx` contains the complete registration, preview and report journey in one component. Large JSX expressions are compressed onto single physical lines, which hides their complexity.

### Mixed domain and presentation logic

The buyer briefing and record overview derive meaning from report data inside React components. Those rules cannot be understood or tested without also understanding their markup.

### Large supplier adapter

`provider.ts` performs HTTP requests, interprets untyped supplier payloads, normalises multiple packages and constructs the final report. It relies heavily on `Record<string, any>`, so changes in supplier fields can pass through the TypeScript compiler unnoticed.

### Unenforced source formatting

The repository has no formatter or linter. Consistent source layout currently depends on individual editing behaviour.

### CSS organisation

Buying-report styles have accumulated in long blocks with repeated media queries and rules from earlier iterations. The cascade works, but ownership and responsive behaviour are difficult to trace.

## Goals

- Make each component and module responsible for one clear concern.
- Move report interpretation into pure domain functions.
- Give supplier package boundaries explicit TypeScript types and runtime guards for required fields.
- Keep supplier-specific names out of React components.
- Apply consistent formatting and lint rules automatically.
- Preserve current rendered behaviour and API contracts.
- Keep tests focused on observable behaviour while adding direct domain tests.
- Make future payment and AI work attach to explicit interfaces rather than UI components.

## Non-goals

- Redesigning the report or customer journey.
- Changing report wording except where necessary to remove accidental duplication.
- Adding payments, email, persistence, PDF export or AI calls.
- Changing which Vehicle Data Global packages are requested.
- Introducing a state-management framework, component library or schema library solely for this refactor.
- Refactoring the separate enthusiast search application.

## Target structure

```text
apps/buying-report/src/
├── client/
│   ├── journey/
│   │   ├── RegistrationStep.tsx
│   │   ├── PreviewStep.tsx
│   │   └── ReportStep.tsx
│   ├── report/
│   │   ├── ReportView.tsx
│   │   ├── ReportChapter.tsx
│   │   ├── RecordOverview.tsx
│   │   ├── BuyerBriefing.tsx
│   │   ├── VehicleDetailsChapter.tsx
│   │   ├── HistoryChapter.tsx
│   │   ├── OwnershipChapter.tsx
│   │   ├── BeforeYouBuyChapter.tsx
│   │   ├── FinanceRecordDetails.tsx
│   │   └── formatters.ts
│   └── App.tsx
├── domain/
│   ├── buyer-briefing.ts
│   ├── record-overview.ts
│   └── vehicle-status.ts
├── server/
│   └── provider/
│       ├── client.ts
│       ├── types.ts
│       ├── guards.ts
│       ├── normalise-vehicle.ts
│       ├── normalise-history.ts
│       ├── normalise-valuation.ts
│       └── build-report.ts
└── shared/
    └── report.ts
```

The exact number of files may change during implementation when two very small modules are clearer together. The boundaries below are required even if filenames differ.

## Domain boundaries

### Buyer briefing

Create a pure function:

```ts
buildBuyerBriefing(report: BuyingReport): BuyerBriefing
```

`BuyerBriefing` contains already-resolved presentation data:

- summary heading and text;
- optional priority item with evidence anchor;
- up to four viewing questions;
- limitations text;
- fixed disclosure text.

The React component receives `BuyerBriefing` and performs no report interpretation. Rules such as finance priority, sparse historic evidence, EV battery-health limitations and duplicate-question removal are tested directly.

Named constants or descriptive predicates replace unexplained literals. If the current pre-2000 rule remains, it must be named and documented as a presentation heuristic rather than an authoritative coverage boundary.

### Record overview

Create a pure function:

```ts
buildRecordOverview(report: BuyingReport): RecordOverview
```

It calculates status labels, freshness copy, counts, attention links and guidance. `RecordOverview.tsx` renders the returned structure. Existing links to detailed history evidence remain unchanged.

### Vehicle status

Consolidate MOT and tax status labels and display-state mapping in a shared domain module. Status derivation that belongs to supplier normalisation remains on the server; display wording belongs in the domain/presentation boundary.

### Formatting

Currency, duration, registration and date formatting move into named helpers. Helpers must define behaviour for invalid or unavailable values rather than relying on incidental JavaScript formatting.

## React component design

`ReportView` becomes composition only. It receives a `BuyingReport`, derives the domain view models once and passes them to focused components.

Each report chapter becomes a component with a typed, narrow interface. Components may receive the full report only when most report fields are genuinely required; otherwise they receive explicit subsets.

`App` retains journey state and network orchestration. Registration, preview and report-stage markup move into focused step components. No new global state or context is introduced.

Components remain accessible:

- existing heading hierarchy is preserved;
- evidence anchors and scroll targets remain stable;
- form labels and live status messages remain associated;
- focus management between journey steps remains in `App`;
- responsive behaviour remains equivalent.

## Provider design

### HTTP client

`provider/client.ts` owns endpoint construction, authentication, timeout behaviour, HTTP error handling and supplier success-envelope validation. API keys remain server-only.

### Supplier types and guards

Define narrow interfaces for fields CarScope actually consumes. Do not attempt to reproduce the complete supplier schema. Unknown fields are allowed at the envelope boundary, while accessed nested structures are checked through small guards and extraction helpers.

Required data for vehicle identification must fail explicitly. Optional package data must produce a recorded gap rather than a fabricated default.

### Package normalisers

Normalisers convert supplier-specific structures into CarScope domain values:

- vehicle identity, specifications, image, tax and EV data;
- MOT, mileage, keeper and significant history;
- finance, theft and write-off checks;
- valuation;
- tyres.

They must not generate customer-facing prose beyond stable data-gap labels. Report findings, seller questions and history notes are constructed in `build-report.ts` from normalised data.

### Orchestration

Preview continues to make one `CarScopeFree` request. Completion continues to request only `VDICheck`, `ValuationDetails` and `TyreDetails`, concurrently and without automatic retries. A failed optional package remains visible as a gap. This call behaviour is contractually and financially important and must have regression tests.

## Report types

Retain `BuyingReport` as the stable client/server contract during this refactor. Tighten types incrementally without changing its JSON shape.

Use discriminated unions where they remove invalid combinations, particularly for check results and availability states. Avoid replacing all optional fields in one large migration; change them only alongside the module that owns their interpretation.

No `any` may remain in the new provider modules. Truly unknown supplier input begins as `unknown` and is narrowed before use.

## Formatting and linting

Add Biome at the workspace root for TypeScript, TSX, JSON and supported CSS formatting/linting. Configuration should prioritise readability over maximum line compression.

Add scripts:

```text
format
format:check
lint
```

Include formatting and linting in the existing `check` command. Generated `dist`, caches, local reports and environment files are excluded.

The initial formatting pass is limited to buying-report source, tests and directly touched workspace configuration. It must not create an unrelated repository-wide diff across the search application.

## CSS treatment

Keep the current visual output. Reformat the buying-report CSS and group rules by feature in this order:

1. shared report shell;
2. journey and preview;
3. record overview and buyer briefing;
4. report chapters;
5. vehicle and history components;
6. responsive overrides.

Remove only selectors proven unused in the buying-report application. Do not redesign tokens or rename all classes during the component refactor.

If splitting the stylesheet would complicate the current Bun HTML/CSS bundling, retain one formatted stylesheet with clear section comments. Readability matters more than introducing CSS modules.

## Testing strategy

The existing suite remains the behavioural safety net. Implementation follows small red-green-refactor steps.

Add focused tests for:

- buyer-briefing priority and wording decisions;
- old/sparse-history handling;
- EV limitations and questions;
- duplicate seller-question removal;
- record counts and attention links;
- provider guards for missing and malformed required fields;
- package normalisers using the existing supplier-shaped fixtures;
- unchanged preview/completion package call counts;
- report composition and evidence anchors.

Rendered-markup tests should verify key user-visible contracts. Domain-rule tests should assert returned view models directly instead of searching large HTML strings.

Each extraction step must leave the full suite, typecheck and production build passing. Snapshot tests are not introduced as a substitute for explicit behavioural assertions.

## Migration sequence

1. Add formatting/linting configuration and format only the buying-report scope.
2. Extract shared formatters and vehicle status display rules.
3. Extract and test buyer-briefing domain logic and view.
4. Extract and test record-overview domain logic and view.
5. Split the remaining report chapters and reduce `ReportView` to composition.
6. Split journey stage components while retaining state and effects in `App`.
7. Split the provider HTTP client and package normalisers, replacing `any` with narrowed supplier input.
8. Reorganise and document CSS without visual changes.
9. Run the complete workspace verification and manually inspect all four mock examples at desktop and mobile widths.

Small commits should follow these boundaries so a regression can be located or reverted without discarding the entire refactor.

## Acceptance criteria

- Current mock and live journeys behave identically from a user’s perspective.
- The rendered report retains its current sections, wording, evidence links and responsive layout.
- `ReportView` composes focused components and contains no buyer-briefing or overview business rules.
- `App` contains journey state/orchestration but not the full markup for every step.
- Buyer briefing and record overview are produced by pure, directly tested functions.
- Supplier HTTP access, narrowing, package normalisation and report construction are separate concerns.
- New provider code contains no `any`.
- Formatting and linting are automated and included in `check`.
- Preview still uses one supplier call and completion still uses three calls without hidden retries.
- Missing supplier data remains explicit and never becomes a clear result or a zero value.
- Full tests, typecheck, lint, format check and production build pass.
- A developer unfamiliar with the project can locate report rules, supplier mappings and UI components from the directory structure without reading the entire application.

## Risks and controls

### Behavioural drift

Moving code can accidentally change wording, source precedence or evidence links. Existing rendered-output tests remain in place until equivalent focused tests cover the extracted behaviour.

### Over-fragmentation

Too many one-function files can make navigation worse. Modules should represent stable responsibilities, not arbitrary line-count targets.

### Supplier schema assumptions

Replacing `any` may reveal inconsistent sandbox payloads. Guards must preserve optional-data behaviour and fail only when required identification fields are unusable.

### Large formatting diff

Formatting is deliberately restricted to the buying-report scope. Functional extraction and wholesale CSS renaming must not happen in the same step.

### Visual regression

Class names remain stable during component extraction. Desktop and mobile browser checks cover Porsche, Lotus, Fiat and Tesla examples before completion.
