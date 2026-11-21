# Connected report journey implementation plan

> **For agentic workers:** Use superpowers:executing-plans for inline implementation.

**Goal:** An environment-selected journey from free official preview to VDG sandbox report.
**Architecture:** Server-owned source selection, opaque preview sessions, isolated three-package sandbox completion and source-aware report assembly.
**Tech Stack:** Existing Bun 1.4.2, TypeScript, React, Biome; no new dependencies.
**Spec:** docs/superpowers/specs/2026-11-21-connected-report-journey-design.md

## Global constraints

- No VDG calls from preview. No CarScopeFree in the connected journey.
- No real payments, production sandbox bypass, live test calls or credential changes.
- Keep environment/runtime and provider environment selection independent.
- Retain dates, units, unknown/empty/failure distinctions and source notes.

## Review focus

- Browser mode spoofing must not select paid sources.
- Lost HTTP responses and repeated clicks must not cause supplier respend.
- Missing VDG identity/provenance must not erase official facts or imply clear checks.
- Production connected preview must work but cannot generate unpaid sandbox reports.
- Missing runtime configuration must leave no active lookup form.

### Task 1: Three-package report generation

Files: new src/server/sandbox-report.ts and tests/sandbox-report.test.ts; extend provider/build-report.ts, provider/normalizers/vehicle.ts and shared/report.ts.
Interface: generateSandboxReport(registration, preview, {apiKey,fetcher?}): Promise<BuyingReport>.
- [x] Write failing tests for three-package completion, official evidence reuse, VDI failure stopping enrichment, identity mismatch, optional gaps and missing provenance.
- [x] Run focused tests (expect failure), implement assembly without fabricated supplier fields, rerun (expect pass).

### Task 2: Environment authority and sessions

Files: config.ts, api.ts, preview-sessions.ts, shared/preview.ts; config/API/session tests.
Interfaces: client config {dataMode: mock|connected, reportAction: mock|sandbox|unavailable}; official session stores VehiclePreview; completion caches official result or failure until expiry.
- [x] Write failing launch selection, production gate, spoofed mode, missing session, session binding and single-spend tests.
- [x] Implement source selection and sandbox completion, run tests (expect pass).

### Task 3: UI, documentation and verification

Files: App.tsx, main.tsx, journey/PreviewStep.tsx, VehiclePreview.tsx, report/ReportView.tsx, .env.example, README, architecture and launch plan; UI tests and smoke script.
- [x] Write failing tests for no toggle, configured journey, test-report action/banner and safe runtime failure.
- [x] Remove source picker, send registration/session only, add explicit sandbox action and retained-source report display, update safe defaults/docs.
- [x] Run frozen install, full check/build/smoke, independent review and regression fixes.
- [ ] Commit and push the tested feature branch for the user's established local-testing workflow.

## Execution record

Approved intent: user requested the connected full journey and confirmed VDG sandbox.
Execute in the existing isolated checkout, not a new worktree. Track results in ignored
.tools/connected-journey-progress.md; Cloud skill helper scripts are not local executables.
