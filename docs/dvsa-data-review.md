# DVSA data review

Verified 23 October 2026 with one authenticated lookup for `YJ22ACU` using the new local command.
No credentials or raw supplier response were saved in this document. These observations describe
one vehicle, not guaranteed coverage across the fleet.

## Live evidence returned

| Field | Observed value |
| --- | --- |
| Make / model | LOTUS EXIGE |
| First used / registration / manufacture dates | 11 May 2022 in all three returned fields |
| Colour | Blue |
| Fuel | Petrol |
| Engine capacity | 3,456 cc |
| MOT records | Two passes |
| Latest MOT | 24 April 2026, expiry 10 May 2027 |
| Latest odometer | 8,541 miles |
| Earlier MOT | 11 April 2025, recorded 3,454 miles |
| Defects in these tests | Empty lists returned |

The identity and latest MOT/mileage evidence match the corresponding fields of the competitor
preview supplied in this chat. The absence of defects in two test records does not establish the
vehicle's current condition. Preserve mileage units: this live response used `MI`, and other
responses can contain kilometre readings or unread values.

## What this can power

- Vehicle identity, colour, fuel, engine capacity and dates when available.
- MOT record counts, pass/fail summaries, dated advisories and failure reasons.
- Latest recorded odometer and a timeline of readings, with units and test dates.
- Derived mileage observations explicitly limited to MOT evidence.
- A derived expiry-based MOT summary, if carefully labelled and interpreted; the local client
  currently returns evidence rather than claiming an official current roadworthiness status.

Missing history is represented by an omitted `motTests` field; a returned empty list remains an
empty list. Malformed history is rejected rather than silently presented as a successful empty
search. Optional vehicle fields remain omitted when absent. Normalized output omits VIN, MOT test
identifiers and all other unrecognized supplier fields.

## What remains unestablished

This result does not establish tax/SORN status, exact trim or factory options, performance,
valuation, independent mileage-source checks, finance, theft, insurance write-offs, salvage,
keeper/plate changes, recalls or service history. Do not substitute MOT evidence for these checks.
Registration/manufacture fields must be used as named; do not infer import history from one result.

As of 20 November 2026, the development preview can combine DVSA evidence with DVLA vehicle/tax data, while mock remains the default. VDG is excluded from the free-preview API. Before public rollout, evaluate
additional examples: an EV, a car not yet due its first MOT, a failed-MOT vehicle, older/imported
vehicles, and absent/partial records. Confirm current commercial reuse, attribution and access
conditions directly with DVSA. This technical lookup is not a licence review.

## Use and verification

Run `bun run dvsa:lookup -- YJ22ACU` after populating all five `DVSA_*` environment settings.
This command loads `.env`, prints normalized JSON, never calls VDG, and never writes raw payloads
or credentials. Token acquisition is cached/coalesced inside a client instance; separate command
processes start fresh. Failures do not automatically retry or use a paid supplier fallback.

Official documentation:
[authentication](https://documentation.history.mot.api.gov.uk/mot-history-api/authentication/),
[API specification](https://documentation.history.mot.api.gov.uk/mot-history-api/api-specification/).

Offline checks cover credential validation, approved destinations, request authentication,
registration validation, token concurrency/refresh/recovery, safe errors, identity mismatches,
malformed data, missing versus empty history, unit preservation and unread odometers. At the original diagnostic stage, the baseline
suite had 106 passing tests and the first DVSA change added 12 tests (118 total). The combined-preview change adds further regression coverage; consult the current test run for totals.
