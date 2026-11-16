# DVSA Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Inspect normalized DVSA vehicle and MOT evidence through a local Bun command.

**Architecture:** A server-only client owns configuration, token caching and authenticated requests. A separate normalizer validates the supplier boundary. The command prints safe normalized output without touching the customer journey.

**Tech Stack:** Bun 1.4.2, TypeScript, native fetch, Bun tests; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-23-dvsa-client-design.md`

## Global Constraints

- Keep credentials and raw supplier payloads server-side.
- Keep the current customer preview, API routes and VDG calls unchanged.
- No automatic retries or hidden supplier fallback.
- Do not save raw supplier results, tokens or secrets.

## Review Focus

- Simultaneous lookups must share token acquisition.
- Failed authentication must not poison future attempts or disclose secret values.
- Missing history must not become an empty successful search.
- Non-mile odometers must keep their units rather than become miles.
- Misconfigured token URLs and redirect responses must not forward credentials elsewhere.

### Task 1: Server client and normalizer

**Files:** create `src/server/dvsa/client.ts`, `src/server/dvsa/normalize.ts`, `tests/dvsa.test.ts`.

**Interfaces:** `readDvsaConfig(env): DvsaConfig`; `createDvsaClient(config, { fetcher?, now? }): { lookup(registration): Promise<DvsaVehicle> }`; `normalizeDvsaVehicle(value, expectedRegistration): DvsaVehicle`. Define the dedicated result and configuration types in these modules; never add supplier shapes to domain code.

- [x] Write offline tests asserting validation before networking, OAuth form/header correctness, token reuse/expiry/coalescing/recovery and safe upstream errors.
- [x] Add normalization tests asserting identity mapping, missing versus empty tests, preserved kilometre units/timestamps, rejected identity mismatch and omission of VIN/private fields.
- [x] Run `.tools/bun test tests/dvsa.test.ts` and verify the tests fail before implementation.
- [x] Implement the specified client and boundary normalizer; use fixed DVSA endpoint, HTTPS Microsoft tenant token URL validation, 20-second timeouts and redirect rejection.
- [x] Run `.tools/bun test tests/dvsa.test.ts` and verify all assertions pass.

### Task 2: Local command, docs and verification

**Files:** create `scripts/dvsa-lookup.ts`; update `package.json`, `.env.example`, `README.md`.

**Interfaces:** command accepts one registration argument, calls Task 1's client and prints normalized JSON. Invalid input/configuration exits nonzero with a safe error. Only this explicit command performs a DVSA lookup.

- [x] Add `dvsa:lookup` using the existing Bun wrapper and `.env` loading; do not print configuration or raw error objects.
- [x] Document the five environment names, local command and data limitations. Never populate example secrets.
- [x] Verify missing-credentials and invalid-registration errors locally; run `.tools/bun run check` and resolve failures attributable to this change.
- [x] Once local credentials are populated, run one lookup for `YJ22ACU` and record only the usable field coverage in documentation, without raw supplier payloads.
- [x] Review the final diff for credential leakage, unrelated changes and unintended browser imports. Do not commit user files or push without instruction.

## Completion evidence

Implemented 23 October 2026. All 118 tests passed and `bun run check` passed formatting, lint, typechecking, tests and build. Missing-credentials and invalid-registration command runs exited nonzero with safe messages. One live lookup for YJ22ACU succeeded; normalized field coverage is documented in `docs/dvsa-data-review.md`. Independent review found no actionable correctness/security issues. No customer journey changes, commits or pushes were made.
