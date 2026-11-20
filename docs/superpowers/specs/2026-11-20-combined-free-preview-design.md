# Combined DVLA/DVSA free preview

## Intent

Give buyers a useful registration preview using official DVLA tax/basic vehicle
details and DVSA MOT history and recorded mileage, without paid VDG requests.
The user selected a combined preview rather than another diagnostic CLI.

## Approach

Selected: add an explicitly enabled development-only official-data mode beside
existing mock mode, using the existing form and preview card.
This permits evaluation without replacing the default journey.
Alternatives considered: a DVLA diagnostic CLI first (user declined), or replacing
the default preview immediately (premature before combined-data evaluation).

## Configuration and requests

- Add `OFFICIAL_PREVIEW_ENABLED=false`; deny official mode server-side in production.
- Retain `DVLA_API_KEY` and `DVLA_ENVIRONMENT=development` placeholders already added.
  Development selects UAT; production selects the production DVLA endpoint, but
  neither changes the application's development-only gate. Label UAT results as
  test data, not current vehicle facts. Reject unknown environment values.
- Pin HTTPS hosts to `uat.driver-vehicle-licensing.api.gov.uk` and
  `driver-vehicle-licensing.api.gov.uk`, path `/vehicle-enquiry/v1/vehicles`.
  POST JSON `{registrationNumber}` with `x-api-key`. No arbitrary endpoint setting.
- Normalize registration before requests; reject non-alphanumeric inputs after
  removing spaces. Use bounded timeouts, reject redirects, and never retry or
  fall back to VDG. Credentials, registrations and upstream payloads stay out of logs.
- Reuse the DVSA client and its in-memory token cache, initialized once per API
  instance. Missing configuration for one source must not stop mock startup.
- Enforce a conservative per-process DVLA request spacing of at least 500ms with
  no unbounded queue. Return a safe busy response on excess demand. Surface 429
  safely; do not retry. Distributed quotas remain outside this development scope.

## Composition and evidence

- Query configured sources concurrently on deliberate form submission only.
  Represent each source as available, unavailable, not found, invalid or unconfigured;
  distinguish an omitted DVSA history from a returned empty list.
- Verify every successful response identifies the requested registration before
  combining it. Registration mismatch fails the lookup; conflicting makes also
  fail rather than combining evidence from potentially different vehicles.
- Prefer DVLA for make, colour, fuel, manufacture year, tax/SORN and current MOT
  status/recorded expiry. Use DVSA for model, dated MOT tests and recorded mileage;
  fill missing identity fields only from successfully validated source evidence.
- If DVLA MOT status is unavailable, derive dated MOT evidence from DVSA where
  supported; do not infer exemption or first-test due dates from missing history.
  Preserve disagreements as a visible note rather than silently reconciling them.
- Handle documented `motExpiry` and observed `motExpiryDate` aliases, rejecting
  conflicting values. Support month-level first-registration data and documented
  numeric month/year fields without inventing a registration day. Validate actual
  calendar dates. Unknown statuses map to unavailable, never a clear result.
- Show make/model where returned, manufacture year, fuel, colour, engine capacity,
  CO2 when returned, registration month/date with original precision, tax and MOT
  evidence, MOT test count, and latest usable recorded odometer with original unit
  and test date. Zero is a valid recorded reading. Do not label it current mileage.
- Label DVLA and DVSA provenance, retrieval time, partial failures and UAT data.
  No finance, theft, write-off, valuation or condition claims from these sources.
  Do not infer ownership changes from V5C date. No image or fabricated trim/specs.
- A valid identity from one source permits a partial preview with explicit gaps.
  Both sources failing must return an error rather than an empty identified vehicle.

## Journey and report boundary

- Add a distinct official mode to shared contracts and the development source picker.
  Mock remains the default. Remove the VDG preview option and reject legacy live requests in both public endpoints; retain VDG helpers only for future paid fulfilment.
- Official previews are preview-only for this increment: no paid completion session,
  no active £9.99 report action, and a clear message that full-report generation is
  not connected for this data source. Reject official report-generation requests
  on the server before any supplier or completion operation.
- Extend the existing card using its current styling. Keep the registration/back
  journey and accessibility. Display source and test-data notices beside evidence.

## Validation and limits

Offline tests cover request/auth routing, invalid registration, timeouts, redirects,
HTTP errors including 404/429, schema aliases and conflicts, missing and empty
history, partial failures, mismatched identity, mileage units, UAT labels, production
gating, and the prohibition on paid fallback/completion. Add component coverage for
the combined card. Run frozen install, full check/build and existing production
smoke plus an injected-provider combined API journey. No real supplier calls,
deployment, credential edits or environment publication as part of implementation.

Builder decides module/file boundaries, field names and presentation details within
these constraints. Public rollout, payment integration, durable storage, broad
data-coverage evaluation and live API checks are subsequent work.

## Approved scope clarification

The user confirmed that the entire preview must be detached from VDG paid calls.
VDG is reserved for customers who deliberately purchase a full report, after payment
fulfilment is implemented. A detailed free preview includes the full returned dated
MOT timeline and advisories/defects, not just the test count.
