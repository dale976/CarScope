# Buying Report Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-presented registration → free preview → complete report journey with offline mock data and an explicit staged live-sandbox path.

**Architecture:** Split the current four-call lookup into a one-package preview and a three-package completion. The server holds raw preview data for 30 minutes behind a random opaque ID; the browser receives normalized preview fields only. Mock mode reads normalized local reports and has no provider network branch.

**Tech Stack:** Bun 1.4, React 19, TypeScript 5.9, Bun HTTP server and test runner, existing Vehicle Data Global adapter

**Spec:** `docs/superpowers/specs/2026-09-24-buying-report-journey-design.md`

## Global Constraints

- Fresh page loads select Mock; selecting Live alone makes no request.
- Mock mode must have no provider-network branch.
- Live preview makes one `VehicleDetailsWithImage` call; live completion makes three calls with no retry.
- No payment, email, account, PDF, advertising or completed-report persistence code.
- No AI-generated report text.
- Public responses contain normalized allowlisted fields only, never raw provider payloads, keys, billing data or agreement numbers.
- Missing evidence is “not returned” or “not established”; zero records never means a clean history.
- The compact Mock / Live toggle is the only prominent development control.
- Formal wordmarks render **CAR** in a stronger weight and **SCOPE** lighter.
- Automated tests must not make external requests.

## Review Focus

- A preview ID used with a different registration or mode must fail before any supplier call.
- Two rapid full-report submissions for the same preview must coalesce rather than spend twice.
- A 30-minute-expired preview must fail cleanly and leave the user able to identify the vehicle again.
- Missing MOT/tax dates must remove “current” wording rather than fabricate freshness.
- Switching Mock / Live after a result must clear every field and report from the previous source.

---

### Task 1: Preview contract, evidence wording and local examples

**Files:**
- Create: `apps/buying-report/src/shared/preview.ts`
- Modify: `apps/buying-report/src/shared/journey.ts`
- Create: `apps/buying-report/src/server/mock-reports.ts`
- Create: `apps/buying-report/tests/preview.test.ts`
- Modify: `apps/buying-report/tests/journey.test.ts`
- Local-only create: `.local/tesla-report.json`

**Interfaces:**
- Produces: `DataMode`, `VehiclePreview`, `projectReportPreview(report, previewId, source, options?)`, `coverageForReport(report)`, `exampleForRegistration(value)` including Tesla, and `loadMockReport(registration)`.
- Consumes: existing `BuyingReport` and private normalized `.local/*-report.json` files.

- [ ] **Step 1: Write failing preview projection tests**

```ts
import {expect,test} from 'bun:test';
import {coverageForReport,projectReportPreview} from '../src/shared/preview';
import type {BuyingReport} from '../src/shared/report';

const report={kind:'sandbox-example',registration:'SL60AUC',vehicle:{name:'Fiat 500',year:2010,mileage:90000,askingPrice:null},detail:{registered:'2010-09-10',keepers:[],colour:'Red',engine:'1.2-litre · Petrol',transmission:'5-speed Manual'},motStatus:{status:'valid',expiry:'2027-01-01',source:'supplier'},findings:[],checks:[],costs:[],sellerQuestions:[],evidence:{mot:[{date:'2026-01-01',mileage:90000,expiry:'2027-01-01',result:'pass'}],tyres:[],notes:[]}} satisfies BuyingReport;

test('preview projection exposes identity and coverage but no paid findings',()=>{
 const preview=projectReportPreview(report,'preview-1','mock');
 expect(preview).toMatchObject({previewId:'preview-1',registration:'SL60AUC',source:'mock',vehicle:{name:'Fiat 500',year:2010},coverage:{motRecordCount:1}});
 expect(JSON.stringify(preview)).not.toContain('findings');
 expect(JSON.stringify(preview)).not.toContain('checks');
});

test('coverage describes returned evidence without claiming completeness',()=>{
 expect(coverageForReport({...report,evidence:{mot:[],tyres:[],notes:[]}}).message).toBe('No MOT tests returned');
});
```

- [ ] **Step 2: Run the focused tests and verify missing-module failures**

Run: `sh scripts/bun.sh test apps/buying-report/tests/preview.test.ts apps/buying-report/tests/journey.test.ts`

Expected: FAIL because `shared/preview.ts` and the Tesla mapping do not exist.

- [ ] **Step 3: Add the preview contract and evidence projection**

```ts
import type {BuyingReport} from './report';

export type DataMode='mock'|'live';
export type VehiclePreview={
 previewId:string;registration:string;source:DataMode;
 vehicle:{name:string;year:number|null;fuelType?:string;transmission?:string;colour?:string;image?:{url:string;expires?:string}};
 mot?:{status:'valid'|'expired'|'failed'|'exempt'|'unavailable';expiry?:string;sourceDate?:string};
 tax?:{status:'taxed'|'untaxed'|'sorn'|'exempt'|'unavailable';dueDate?:string;sourceDate?:string};
 coverage:{motRecordCount?:number;ukRecordStart?:string;message:string};
};

export function coverageForReport(report:BuyingReport):VehiclePreview['coverage'] {
 const count=report.evidence?.mot.length;
 const registered=report.detail?.registered;
 const imported=registered&&report.vehicle.year&&Number(registered.slice(0,4))-report.vehicle.year>1;
 if(count===undefined)return {message:'Detailed history is checked in the complete report'};
 if(count===0)return {motRecordCount:0,message:'No MOT tests returned'};
 if(imported)return {motRecordCount:count,ukRecordStart:registered,message:`${count} MOT ${count===1?'test':'tests'} returned since UK registration in ${registered.slice(0,4)}`};
 return {motRecordCount:count,message:`${count} MOT ${count===1?'test':'tests'} returned`};
}
```

`projectReportPreview` must copy only the declared preview fields, derive fuel type from the normalized engine string when present, and copy status dates without the report findings/checks/valuation/MOT annotations. Its optional fourth argument is `{asOf?: string}` so freshness tests use a fixed date rather than the wall clock.

- [ ] **Step 4: Add Tesla to the local example mapping and a strict mock loader**

Update `exampleForRegistration` so `LD17VAE` maps to `tesla`. Implement `loadMockReport` with an exact registration-to-filename map, the existing `CARSCOPE_ROOT` resolution, JSON parsing and minimal `BuyingReport` validation. Unsupported registrations throw `Mock vehicle unavailable`; arbitrary path fragments never become filenames.

Save the already captured normalized Tesla result as `.local/tesla-report.json`. Do not store the raw four provider responses, API key or billing envelope.

- [ ] **Step 5: Run focused tests**

Run: `sh scripts/bun.sh test apps/buying-report/tests/preview.test.ts apps/buying-report/tests/journey.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the contract and loader**

```bash
git add apps/buying-report/src/shared/preview.ts apps/buying-report/src/shared/journey.ts apps/buying-report/src/server/mock-reports.ts apps/buying-report/tests/preview.test.ts apps/buying-report/tests/journey.test.ts
git commit -m "feat: add buying report preview contract"
```

---

### Task 2: Split supplier preview and completion calls

**Files:**
- Modify: `apps/buying-report/src/server/provider.ts`
- Modify: `apps/buying-report/tests/provider.test.ts`

**Interfaces:**
- Produces: `lookupSandboxPreview(registration, options): Promise<{preview: Omit<VehiclePreview,'previewId'>; details: ProviderVehicleDetails}>` and `completeSandboxReport(registration, details, options): Promise<BuyingReport>`.
- Preserves: `lookupSandboxReport` as a four-call convenience wrapper for existing manual use until callers migrate.
- Consumes: `VehiclePreview`, the existing normalization code and injected `Fetcher`.

- [ ] **Step 1: Replace the four-call expectation with staged-call tests**

```ts
test('preview requests vehicle details once and completion requests only three remaining packages',async()=>{
 const calls:string[]=[];
 const fetcher:Fetcher=async input=>{
  const packageName=new URL(String(input)).searchParams.get('packagename')!;
  calls.push(packageName);
  return Response.json(packageName==='VehicleDetailsWithImage'?details:packageName==='VDICheck'?vdi:packageName==='ValuationDetails'?valuation:tyres);
 };
 const identified=await lookupSandboxPreview('SL60AUC',{apiKey:'secret',fetcher});
 expect(calls).toEqual(['VehicleDetailsWithImage']);
 const report=await completeSandboxReport('SL60AUC',identified.details,{apiKey:'secret',fetcher});
 expect(calls.slice(1).sort()).toEqual(['TyreDetails','VDICheck','ValuationDetails'].sort());
 expect(report.vehicle.name).toBe('Fiat 500 Pop');
});
```

Add tests proving completion retries zero times on a 503, partial valuation/tyre failure leaves a usable report, preview output lacks paid evidence, and `Model X` capitalization is preserved.

- [ ] **Step 2: Run provider tests and verify failures**

Run: `sh scripts/bun.sh test apps/buying-report/tests/provider.test.ts`

Expected: FAIL because staged provider functions are absent.

- [ ] **Step 3: Extract the single-package preview operation**

Make `requestPackage` reusable inside the module. `lookupSandboxPreview` validates the sandbox registration, requests only `VehicleDetailsWithImage`, creates a preview-safe projection from its identity/status fields and returns the raw `details` only to the server caller.

Replace the generic lower/title transformation for model identity with a conservative formatter that preserves already mixed-case supplier values and known tokens such as `Model X`, `GT`, `GTS`, `AMG` and `RS`.

- [ ] **Step 4: Extract the three-package completion operation**

```ts
const COMPLETION_PACKAGES=['VDICheck','ValuationDetails','TyreDetails'] as const;
const settled=await Promise.allSettled(COMPLETION_PACKAGES.map(name=>requestPackage(name,registration,apiKey,fetcher)));
```

Pass the stored `details` into the existing normalizer. Keep vehicle details mandatory; preserve explicit missing-package notes for independently failed completion packages. Implement `lookupSandboxReport` by calling preview then completion so existing development callers retain exactly four calls.

- [ ] **Step 5: Run provider tests**

Run: `sh scripts/bun.sh test apps/buying-report/tests/provider.test.ts`

Expected: PASS with one preview call, three completion calls and no fifth battery call.

- [ ] **Step 6: Commit the provider split**

```bash
git add apps/buying-report/src/server/provider.ts apps/buying-report/tests/provider.test.ts
git commit -m "feat: stage vehicle preview and report data calls"
```

---

### Task 3: Opaque preview sessions and staged API

**Files:**
- Create: `apps/buying-report/src/server/preview-sessions.ts`
- Modify: `apps/buying-report/src/server/api.ts`
- Modify: `apps/buying-report/tests/api.test.ts`
- Create: `apps/buying-report/tests/preview-sessions.test.ts`

**Interfaces:**
- Produces: `createPreviewSessions({now?,ttlMs?})` with `create`, `read` and `complete` methods.
- Produces API operations: `POST /api/report-preview` and `POST /api/report-generate`.
- Consumes: mock report loader, staged provider functions and `VehiclePreview`.

- [ ] **Step 1: Write failing session lifecycle tests**

```ts
test('preview sessions expire and reject mismatched registration or mode',()=>{
 let now=1_000;
 const sessions=createPreviewSessions({now:()=>now,ttlMs:30*60_000});
 const id=sessions.create({mode:'mock',registration:'LD17VAE',report:sampleReport});
 expect(sessions.read(id,'mock','LD17VAE')).toBeDefined();
 expect(()=>sessions.read(id,'live','LD17VAE')).toThrow('does not match');
 expect(()=>sessions.read(id,'mock','SL60AUC')).toThrow('does not match');
 now+=30*60_000+1;
 expect(()=>sessions.read(id,'mock','LD17VAE')).toThrow('expired');
});
```

The session object must be a private discriminated union: mock sessions retain a normalized report; live sessions retain `ProviderVehicleDetails`. IDs come from `crypto.randomUUID()` and keys/API credentials are never stored.

- [ ] **Step 2: Write failing API tests for call safety and public projection**

Test all of these in `api.test.ts` with injected preview/completion functions:

- GET on either spending endpoint returns `405`.
- Cross-origin requests return `403`.
- Mock preview never invokes live provider functions.
- Selecting live in the browser is irrelevant to the API; only POST preview invokes one injected preview call.
- Generation with an invalid/expired/mismatched ID invokes no completion call.
- Two concurrent generation requests for one ID share one completion promise.
- Public preview JSON omits raw `Results`, finance data, API key and full MOT evidence.

- [ ] **Step 3: Run session and API tests to verify failures**

Run: `sh scripts/bun.sh test apps/buying-report/tests/preview-sessions.test.ts apps/buying-report/tests/api.test.ts`

Expected: FAIL because the session store and endpoints do not exist.

- [ ] **Step 4: Implement the transient session store**

Use a `Map<string, PreviewSession>` with a default `ttlMs` of `1_800_000`. `read` first deletes expired entries, then validates the exact normalized mode and registration. `complete` stores one in-flight completion promise per ID and returns it to concurrent callers. On rejection, clear only the in-flight promise so the user may deliberately retry; the server itself performs no retry.

- [ ] **Step 5: Replace `/api/lookup` in the primary journey with POST operations**

Parse JSON with a small body limit, require `Content-Type: application/json`, validate `mode`, normalize registration, and require loopback host plus same-origin `Origin` when present. Route mock and live modes through separate explicit branches. Return `Cache-Control: no-store` for every journey response.

Keep existing sample/report fixture GET routes temporarily for regression tests and direct local examples; remove the old live `/api/lookup` spending branch.

- [ ] **Step 6: Run API tests**

Run: `sh scripts/bun.sh test apps/buying-report/tests/preview-sessions.test.ts apps/buying-report/tests/api.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the staged API**

```bash
git add apps/buying-report/src/server/preview-sessions.ts apps/buying-report/src/server/api.ts apps/buying-report/tests/preview-sessions.test.ts apps/buying-report/tests/api.test.ts
git commit -m "feat: add transient report preview sessions"
```

---

### Task 4: Focused production-ready preview journey

**Files:**
- Create: `apps/buying-report/src/client/VehiclePreview.tsx`
- Modify: `apps/buying-report/src/client/App.tsx`
- Modify: `apps/buying-report/src/client/styles.css`
- Modify: `apps/buying-report/tests/entry-page.test.tsx`
- Modify: `apps/buying-report/tests/confirmation.test.tsx`
- Create: `apps/buying-report/tests/preview-ui.test.tsx`

**Interfaces:**
- Produces: `VehiclePreviewCard({preview,onBack,onGenerate,busy,mode})`.
- Consumes: `VehiclePreview`, `DataMode`, POST preview/generate endpoints and existing `ReportView`.

- [ ] **Step 1: Write failing static UI tests**

```tsx
test('focused preview shows returned evidence and the planned price without paid findings',()=>{
 const html=renderToStaticMarkup(<VehiclePreviewCard preview={preview} mode="mock" busy={false} onBack={()=>{}} onGenerate={()=>{}}/>);
 for(const text of ['Vehicle identified','LD17 VAE','MOT valid','8 MOT tests returned','Complete buying report','£9.99'])expect(html).toContain(text);
 expect(html).not.toContain('Finance record');
 expect(html).not.toContain('Complete history');
});
```

Add an older/imported preview test for `3 MOT tests returned since UK registration in 2022`, and a no-history test for `No MOT tests returned` plus `MOT status not established`.

- [ ] **Step 2: Update entry-page tests before implementation**

Replace sandbox-budget assertions with:

- the page contains the concise 2005 digital-history explanation;
- formal branding contains separately styled `CAR` and `SCOPE` spans;
- the source control has Mock selected and does not auto-submit;
- the 30-registration sandbox picker and daily-call panel are absent;
- mode labels are `Mock` and `Live` only.

- [ ] **Step 3: Run UI tests and verify failures**

Run: `sh scripts/bun.sh test apps/buying-report/tests/entry-page.test.tsx apps/buying-report/tests/preview-ui.test.tsx apps/buying-report/tests/confirmation.test.tsx`

Expected: FAIL against the current registration/confirmation journey.

- [ ] **Step 4: Implement the focused preview component**

Render the dark identity panel, registration pill, only returned status facts, evidence-led coverage message and one complete-report panel. In Live mode, label the actions unobtrusively with `1 supplier call` for identification and `3 supplier calls` for full generation. In Mock mode, omit call-count language.

The full action reads `View complete report · £9.99`. It directly calls the development generation endpoint; do not add payment-success language.

- [ ] **Step 5: Refactor App into the approved journey states**

```ts
type Stage='registration'|'identifying'|'preview'|'generating'|'report';
```

Use separate `preview`, `report`, `mode`, `busy` and stage-specific error state. Default `mode` to `'mock'` without localStorage. Changing mode or registration clears preview/report. Returning Report → Preview reuses state. A second open uses the retained report rather than fetching.

Remove the current 30-vehicle picker, daily sandbox-call panel and `Confirmation` component from the primary flow. Keep a compact four-example chooser in Mock mode only, labelled as example vehicles rather than sandbox data.

- [ ] **Step 6: Apply production branding and responsive styling**

Use uppercase `CAR` and `SCOPE` spans, bold/light weights, the existing symbol and editorial colors. Keep the source toggle visually subordinate in the header. On small screens, stack the registration plate beneath the identity and make the full-report action full width.

- [ ] **Step 7: Run UI and report regression tests**

Run: `sh scripts/bun.sh test apps/buying-report/tests/entry-page.test.tsx apps/buying-report/tests/preview-ui.test.tsx apps/buying-report/tests/report.test.tsx apps/buying-report/tests/history.test.tsx`

Expected: PASS.

- [ ] **Step 8: Commit the production journey UI**

```bash
git add apps/buying-report/src/client/VehiclePreview.tsx apps/buying-report/src/client/App.tsx apps/buying-report/src/client/styles.css apps/buying-report/tests/entry-page.test.tsx apps/buying-report/tests/confirmation.test.tsx apps/buying-report/tests/preview-ui.test.tsx
git commit -m "feat: add focused vehicle preview journey"
```

---

### Task 5: Freshness safeguards, documentation and complete verification

**Files:**
- Modify: `apps/buying-report/src/shared/preview.ts`
- Modify: `apps/buying-report/src/client/ReportView.tsx`
- Modify: `apps/buying-report/tests/preview.test.ts`
- Modify: `apps/buying-report/tests/report.test.tsx`
- Modify: `apps/buying-report/scripts/smoke.ts`
- Modify: `README.md`
- Modify: `docs/architecture.md`

**Interfaces:**
- Produces: final freshness wording rules and local manual smoke coverage.
- Consumes: staged endpoints and existing report status components.

- [ ] **Step 1: Write failing freshness tests**

Pin these outcomes:

```ts
test('an old supplier tax observation is dated rather than called current',()=>{
 const preview=projectReportPreview({...report,tax:{status:'untaxed',date:'2024-05-12',dueDate:'2026-09-18',rates:[]}},'id','mock',{asOf:'2026-09-24'});
 expect(preview.tax).toMatchObject({status:'untaxed',sourceDate:'2024-05-12'});
 expect(statusCopy(preview.tax!)).toContain('Supplier record dated 12 May 2024');
 expect(statusCopy(preview.tax!)).not.toContain('Current tax status');
});
```

Also test unavailable dates, future MOT expiry, expired MOT, SORN and exempt statuses.

- [ ] **Step 2: Implement one shared freshness rule**

Create a pure status-copy helper in `shared/preview.ts`. A future explicit expiry/due date may use current wording. A status with only a source date older than 31 days must use `Supplier record dated …`. Missing dates use `Status returned without a current date` or `Status not established` as appropriate. Use the same helper in preview and full report so they cannot disagree.

- [ ] **Step 3: Update the manual smoke script**

The smoke script must exercise Mock preview and generation using one fixture, assert that the preview omits paid fields, then load the built report route. Add an explicitly manual Live branch controlled by `VDG_SMOKE_LIVE=true`; before running it, print `This action makes 4 supplier calls: 1 preview + 3 report` and require the registration argument. It performs no retry.

- [ ] **Step 4: Update documentation**

Document:

- `npm run dev:report` and the default Mock mode;
- the four local examples;
- how to opt into Live and the exact 1 + 3 call behavior;
- transient 30-minute preview sessions;
- the 2005 Great Britain MOT-history boundary and older/imported/exempt caveats;
- deferred payment, email, PDF and persistence;
- the requirement that `.local` normalized reports remain private and ignored.

- [ ] **Step 5: Run all verification**

Run: `sh scripts/bun.sh run check`

Expected: TypeScript passes, every test passes and both apps build.

Run: `sh scripts/bun.sh run smoke:report`

Expected: local built HTML, Mock preview, Mock generation and report assets all return successfully with zero external calls.

- [ ] **Step 6: Inspect the finished journey in the browser**

Verify desktop and narrow layouts for Fiat, Lotus, Porsche and Tesla. Confirm Mock is selected after reload, changing source clears the vehicle, older-vehicle copy is legible, status dates are visible, report Back uses memory and no sandbox panels remain.

- [ ] **Step 7: Commit documentation and final safeguards**

```bash
git add apps/buying-report/src/shared/preview.ts apps/buying-report/src/client/ReportView.tsx apps/buying-report/tests/preview.test.ts apps/buying-report/tests/report.test.tsx apps/buying-report/scripts/smoke.ts README.md docs/architecture.md
git commit -m "docs: document staged buying report journey"
```
