# Combined free preview implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** A detailed DVLA/DVSA free preview which never calls VDG.
**Architecture:** A DVLA boundary validates responses; an official-preview service composes it with the existing DVSA client. The API and browser use mock or official mode only; VDG helpers remain isolated for later paid-report integration.
**Tech Stack:** Bun 1.4.2, TypeScript, React, Biome; no new dependencies.
**Spec:** docs/superpowers/specs/2026-11-20-combined-free-preview-design.md, amended by the user's explicit separation of all previews from VDG and request for detail.

## Global constraints

- No live supplier calls, deployment or credential edits during implementation.
- Official mode is explicitly enabled and server-gated outside production.
- Mock remains the offline default; no VDG call is reachable from either preview mode.
- Official full-report generation is unavailable until paid fulfilment exists.
- Dates and odometer units retain precision. Missing, empty and failed evidence differ.

## Review focus

- Partial/malformed responses must not imply a clean MOT or tax result.
- UAT/live mixed evidence must be labelled prominently and conflicts must stop merging.
- Repeated requests must respect the per-process DVLA 2 RPS budget without a queue.
- Old live-mode requests must not reach VDG via either preview or generation.
- MOT history/defects and source dates must reach the UI, without implying repair status.

### Task 1: DVLA request and normalization boundary

Files: create src/server/dvla/client.ts, src/server/dvla/normalize.ts, tests/dvla.test.ts.
Interface: readDvlaConfig(env) -> DvlaConfig; createDvlaClient(config, {fetcher?,now?}).lookup(registration) -> Promise<DvlaVehicle>.
- [ ] Write tests for fixed endpoint/header/body, UAT routing, normalization aliases, precise dates, conflicts, malformed fields, 404/429, safe errors, redirects, invalid registrations and spacing.
- [ ] Run `sh scripts/bun.sh test tests/dvla.test.ts`; expect missing implementation failure.
- [ ] Implement strict allowlisted projection and bounded requests without retry.
- [ ] Run the task tests; expect all pass.

### Task 2: Compose official evidence

Files: create src/server/official-preview.ts, tests/official-preview.test.ts; extend src/shared/preview.ts.
Interface: createOfficialPreview({dvla?,dvsa?,testData,now?}) -> (registration) -> Promise<VehiclePreview> (previewId empty; no completion session).
- [ ] Write and run failing tests for combined identity/tax/MOT, complete dated MOT history, mileage/units, partial and empty responses, disagreements and identity mismatch.
- [ ] Implement safe concurrent source settlement, per-source status/provenance and detailed public facts. Add DVLA metadata and MOT timeline to the public contract.
- [ ] Run the task tests; expect all pass.

### Task 3: Remove VDG from API preview/completion paths

Files: src/server/config.ts, api.ts, preview-sessions.ts; tests/api.test.ts, config.test.ts, preview-sessions.test.ts; .env.example.
Interface: DataMode = mock | official; config.client exposes development controls and official availability only; createReportApi accepts identifyOfficial injection.
- [ ] Replace VDG-preview tests with failing official-mode and legacy-mode denial tests, verifying no paid path and production denial.
- [ ] Instantiate configured official clients once per API. Remove provider imports and VDG session data from API/session code. Keep mock generation; reject official generation explicitly.
- [ ] Add safe config and documentation defaults, preserving private .env.
- [ ] Run API/config/session tests; expect all pass.

### Task 4: Detailed preview UI and readiness

Files: src/client/App.tsx, VehiclePreview.tsx, journey/RegistrationStep.tsx, styles/journey.css; create src/client/preview/OfficialEvidence.tsx; tests/preview-ui.test.tsx, entry-page.test.tsx; scripts/smoke.ts, README.md, docs/architecture.md.
- [ ] Write and run failing UI tests for official mode, full MOT timeline/defects, dated mileage, precise first-registration month, UAT/partial-data notices and unavailable paid-report action.
- [ ] Implement official picker, detail sections and timeline within existing styling; keep mock report demo. Remove obsolete VDG smoke option and set the smoke child PORT explicitly.
- [ ] Update active docs with free/paid separation, config and limitations.
- [ ] Run frozen install, `sh scripts/bun.sh run check`, `sh scripts/bun.sh run smoke`; expect all checks pass and smoke makes zero supplier calls.
- [ ] Request an independent whole-change review; address material findings with regression tests. Leave changes reviewable without pushing or deploying.

## Execution record

Native execution in the existing isolated Cloud checkout, on codex/dvsa-free-preview.
The user's approval authorizes implementation; no further implementation permission is needed.
No automatic commits: retain the working diff for review. Skill helper bookkeeping is stored under ignored .tools/combined-preview-progress.md because cloud skill scripts are not local executables.
