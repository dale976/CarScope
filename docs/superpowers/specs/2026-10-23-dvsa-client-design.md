# DVSA client and local lookup

## Approved scope

The user selected “Client and lookup command first” on 23 October 2026. Add a server-only DVSA MOT History client and a Bun local diagnostic command to discover usable data. Keep the current customer preview, API routes and VDG calls unchanged.

## Approaches

Selected: a standalone server client and local lookup command, allowing evidence inspection before modifying the journey. Alternative: immediately replace the preview; deferred because DVSA coverage and live response behaviour have not been established.

## Design

- Read the five `DVSA_*` settings from server environment only; report missing setting names without values. No new package dependencies.
- Use the supplied Microsoft HTTPS token endpoint with OAuth client credentials and the DVSA HTTPS vehicle-registration endpoint. Validate token host/path so configured credentials cannot be sent to an arbitrary endpoint.
- Cache the access token in the client instance using the returned lifetime with a safety margin; coalesce concurrent token acquisition. Discard failed acquisition promises so later attempts can recover.
- Normalize registration and validate its format before any request. All requests have bounded timeouts and disable redirects. No automatic retries or hidden supplier fallback.
- Validate unknown responses at the boundary. Return a dedicated normalized DVSA result containing available identity fields and MOT tests, preserving odometer units and timestamps. Omit VIN, test identifiers and unrecognized fields. Missing tests must remain distinguishable from a returned empty list. Do not claim tax, finance, stolen or write-off coverage.
- Add `bun run dvsa:lookup -- YJ22ACU`, loading `.env`, printing a normalized JSON result or a generic error. Do not save raw supplier results, tokens or secrets.
- Document environment settings, source limitations and command usage. Current `.env` has blank DVSA values, so live verification requires local user input.

## Verification

Offline tests cover credentials, request routing/authentication, token expiry/concurrency/recovery, invalid registration, malformed responses, upstream failures, missing versus empty history, kilometre readings and omission of private fields. Run repository checks and a missing-credentials CLI check. Perform one explicit live lookup when credentials are configured; do not represent mocked tests as live coverage.
