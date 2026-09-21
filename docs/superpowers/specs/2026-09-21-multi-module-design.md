# CarScope: search and buying-report modules

## Purpose and agreed direction

Keep the existing enthusiast search product usable while developing a separate, plain-English buying report for consumers. Both products use React, TypeScript and Bun in one repository. The user approved the two-app structure on 21 September 2026. This document specifies the first migration and offline report prototype, not a production reporting service.

## Structure

- `apps/search/`: existing client, server, shared search logic, fixtures, app-specific scripts and tests.
- `apps/buying-report/`: independent React entry point, Bun server, report model, fictional fixtures and tests.
- `packages/ui/`: only genuinely shared branding and small reusable controls. Avoid extracting the entire search stylesheet or making the report depend on search internals.
- Root: private Bun workspace manifest, one Bun lockfile, shared TypeScript defaults, developer launchers, documentation and local runtime.

Each app has its own package manifest and build output. Report code cannot import search code. Shared UI cannot import either app. No new framework or task runner is needed.

## Existing search compatibility

Move the current working files, including uncommitted changes, rather than recreating them from Git HEAD. Preserve existing search routes, API contracts, demo data and explicit live-request behaviour. Update fixture, asset and script paths as necessary.

Root `npm run dev` and `npm run start` continue to launch search through the existing local-Bun fallback. Equivalent Bun commands remain supported. Add `dev:report` and `start:report`; root build, typecheck and test commands cover both apps. Search retains its current default port; report defaults to port 3001 and supports an explicit report-specific port override. Both bind to loopback by default.

Keep `.env`, `.tools`, `.cache` and `.budget` at the repository root. Resolve their locations explicitly so launching from a workspace or built output cannot create another budget ledger or change which cache is read. Never copy, reset, print or commit credentials or budget contents. Preserve the existing cumulative MarketCheck allowance and disabled-by-default live behaviour. Existing provider fixture retention rules remain unchanged.

## First report experience

Deliver an offline example, prominently labelled fictional sample data. A simple introduction leads to one complete example report with vehicle summary, asking price, MOT observations, ownership-cost assumptions, questions for the seller and outstanding checks. Input fields may demonstrate the proposed journey, but must not imply that entering a real registration retrieves real records. Use an explicit sample-report action and identify the sample vehicle throughout.

Separate source observations, seller claims, estimates and unknowns in the report model and presentation. Sample finance, theft and write-off sections say “Not checked”; no invented clear checks. Sample MOT observations are labelled fictional. Ownership costs display their assumptions; insurance requires a personal quote. Do not provide a definitive valuation without supporting comparable or valuation data.

The first slice contains no live supplier integrations, paid requests, AI requests, arbitrary advert fetching, payment flow, customer accounts or report storage. Later supplier adapters can populate the report model without depending on MarketCheck search internals.

## Data flow and failures

Search retains its existing API and validation pipeline. The report server serves its own frontend and a fixed fictional report through an app-owned sample endpoint. It needs no supplier keys. Loading failures display a retry message rather than silently substituting a successful check. Invalid port configuration fails clearly on startup. Server environment variables are never included in browser bundles.

## Verification and acceptance

1. Existing search tests, typecheck and production build pass after relocation; investigate baseline failures separately from migration failures.
2. Both apps build and run independently through root commands, including production launchers and local Bun fallback.
3. Browser checks cover search demo, live search initial screen without submitting requests, and the report sample on separate ports.
4. Focused tests verify report provenance/status rendering and that unperformed checks cannot appear clear.
5. Verify canonical budget/cache paths without making provider requests or altering the allowance.
6. README documents layout, commands, environment ownership, offline behaviour and limits of the example report.

## Delivery boundaries

Do not discard existing changes, overwrite the untracked npm lockfile, introduce a Git remote, push code, or migrate secrets into app folders. Perform the relocation and report prototype as separately reviewable changes. The implementation plan must enumerate path-dependent scripts and fixtures before moving them. No product code is changed during this specification stage.
