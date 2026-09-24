# CarScope Buying Report Journey Design

## Purpose

CarScope will let a UK used-car buyer identify a vehicle by registration, inspect a useful free preview, and continue into the existing detailed buying report. This phase proves the complete product journey and staged supplier usage without adding payments, customer accounts, email, PDF export or persistent report storage.

The experience should look and feel ready for customers. Development controls remain available through one compact **Mock / Live** toggle; sandbox explanations and test controls do not dominate the customer interface.

## Success criteria

- A visitor can identify a supported vehicle from its registration.
- The free preview is useful without exposing paid provenance findings.
- Preview language reflects the evidence actually returned and never promises a complete history.
- Mock mode exercises the entire journey without external requests.
- Live mode makes one deliberate supplier call for the preview and three deliberate calls for the full report.
- Revisiting an already generated report in the same browser session makes no additional calls.
- The complete report continues to handle rich, partial and older-vehicle data honestly.
- The interface uses production CarScope branding and removes most sandbox-specific presentation.

## Scope

### Included

- Registration entry
- Compact Mock / Live development toggle
- Free vehicle preview
- A planned £9.99 complete-report action
- Direct prototype unlock of the complete report
- Staged Vehicle Data Global sandbox requests
- Saved normalized mock reports for Fiat, Lotus, Porsche and Tesla
- Honest historical-coverage guidance
- Partial-package failure handling
- Existing complete report UI

### Excluded

- Stripe or any other payment processing
- Customer accounts or authentication
- Email delivery
- Downloadable PDF reports
- Database or object-storage persistence
- Production hosting and deployment
- Advertising
- AI-generated report copy

The £9.99 action opens the report directly in this local development phase. No code should pretend that a payment has occurred.

## Brand and presentation

The wordmark uses **CAR** in a stronger weight and **SCOPE** in a lighter weight. Formal report surfaces use uppercase `CARSCOPE`; small contexts may preserve the same weight relationship without adding a separate marque logo.

The report journey uses the existing premium editorial palette and typography. Customer-facing copy avoids the terms sandbox, fixture and API. The header contains a compact **Mock / Live** control as the sole prominent development affordance. Mock is selected on every fresh page load.

The chosen free-preview direction is the focused preview:

1. A dark vehicle-identification panel contains the vehicle name, key identity facts and registration plate.
2. A short fact row shows only values that were returned, such as current MOT status, fuel type and supplied record coverage.
3. A single complete-report panel explains the additional categories and presents the planned £9.99 action.

The preview must not use blurred report content, artificial warning counts or invented completeness indicators.

## Historical-coverage language

The home page explains the limits before a visitor starts:

> Digital records have limits. For cars, vans and motorcycles, online MOT results generally begin in 2005. Older vehicles may have earlier history held only in paper records, may have been imported, or may qualify for MOT exemption. Missing data does not confirm that an event did not occur.

Preview language is derived from returned evidence:

- Strong evidence: `8 MOT tests returned`
- Later UK record: `3 tests returned since UK registration in 2022`
- No evidence: `No MOT tests returned`
- Unknown legal status: `MOT status not established`
- Dated status: show the supplied date or expiry alongside the value

“Complete history”, “clear history” and equivalent claims are prohibited. A zero count means zero records were returned, not that no events occurred.

For cars, motorcycles and vans, the 2005 digital-history boundary applies to Great Britain. Northern Ireland and other vehicle classes have different coverage periods; the home copy remains concise while report notes describe applicable gaps when known.

## Journey states

The client uses these states:

1. **Registration** — enter a registration and choose Mock or Live.
2. **Identifying** — wait for the preview response.
3. **Preview** — confirm the identified vehicle and review free facts.
4. **Generating** — deliberately request the complete report.
5. **Report** — display the existing complete report.
6. **Error** — show a recoverable message appropriate to the failed stage.

Changing the registration clears the preview and full report. Changing Mock / Live also clears both, preventing evidence from one source being presented under the other.

Returning from Report to Preview preserves the complete report in React memory. Opening it again during that browser session does not call the server.

## Mock data

Mock mode has no outbound-network branch. It accepts the registrations associated with four normalized saved reports:

- Fiat 500: older vehicle with a long MOT record
- Lotus Exige: specialist vehicle with a returned finance record
- Porsche Boxster: modern performance vehicle with rich specifications
- Tesla Model X: EV specifications, charging data and recurring tyre/brake advisories

The mock preview is projected from the same normalized report used by the full view. It exposes only preview-safe fields. Mock responses are deterministic and suitable for all automated tests.

An unsupported mock registration returns a clear local message and suggests the available examples. It never falls through to the live provider.

## Live data flow

### Preview

The visitor explicitly submits a registration while Live is selected. The server:

1. Normalizes and validates the registration.
2. Enforces the supplier sandbox registration restriction during local development.
3. Makes exactly one `VehicleDetailsWithImage` request with no retry.
4. Projects a `VehiclePreview` response containing only identification and preview-safe fields.
5. Returns no raw supplier payload and no provider credential.

The server retains the raw vehicle-details result in a short-lived in-memory preview session under a cryptographically random `previewId`. The session expires after 30 minutes and disappears on server restart. The browser receives the ID and normalized preview only. This is transient request coordination, not completed-report persistence or a supplier-data archive.

`VehiclePreview` contains:

```ts
type VehiclePreview = {
  previewId: string;
  registration: string;
  vehicle: {
    name: string;
    year: number | null;
    fuelType?: string;
    transmission?: string;
    colour?: string;
    image?: {url: string; expires?: string};
  };
  mot?: {
    status: 'valid' | 'expired' | 'failed' | 'exempt' | 'unavailable';
    expiry?: string;
    sourceDate?: string;
  };
  tax?: {
    status: 'taxed' | 'untaxed' | 'sorn' | 'exempt' | 'unavailable';
    dueDate?: string;
    sourceDate?: string;
  };
  coverage: {
    motRecordCount?: number;
    ukRecordStart?: string;
    message: string;
  };
  source: 'mock' | 'live';
};
```

If `VehicleDetailsWithImage` does not return MOT record counts, the preview omits the count rather than making the VDI request early. The UI can still identify the vehicle and state that detailed history is checked in the complete report.

### Complete report

The visitor deliberately activates the complete-report action using the `previewId`. The server rejects missing, expired, registration-mismatched or mode-mismatched preview sessions before any supplier request. In Live mode it then makes exactly three concurrent requests, without retries:

- `VDICheck`
- `ValuationDetails`
- `TyreDetails`

The result is merged with the previously obtained vehicle-details payload and normalized into the existing `BuyingReport` model. Vehicle details are the required identity anchor. Each of the other three packages may fail independently; the report still opens using successful sections and records the missing package under sources and gaps.

The server coalesces concurrent identical requests. Completed live responses are not persisted in this phase. The client retains the resulting report only for the current page session. Preview sessions expire after 30 minutes, are held in process memory only and never contain API keys.

## API shape

The journey uses separate operations rather than the current all-in-one lookup:

- `POST /api/report-preview`
- `POST /api/report-generate`

The preview request body contains a normalized-mode choice and registration:

```json
{"registration":"LD17VAE","mode":"mock"}
```

The generation request also carries the opaque preview ID returned by the first operation:

```json
{"registration":"LD17VAE","mode":"mock","previewId":"a-random-server-issued-value"}
```

Supplier calls require POST, a loopback host and same-origin request metadata in this development phase. GET requests never initiate supplier spending. Unsupported methods return `405`; invalid registrations return `400`; unsupported mock registrations return `404`; unavailable provider configuration returns `503`; a supplier identity failure returns `422` with a safe message.

The full-generation response remains a normalized `BuyingReport`. The preview endpoint never returns finance, stolen, write-off, valuation, detailed MOT findings or seller questions.

## Call safety

- Mock mode cannot invoke `fetch` against Vehicle Data Global.
- Fresh loads always start in Mock.
- Selecting Live does not make a request.
- Typing and changing fields does not make a request.
- Submitting the preview makes at most one supplier request.
- Generating the complete report makes at most three supplier requests.
- There is no polling, automatic refresh, redirect retry or background lookup.
- The UI states the next action's call count in Live mode without adding large sandbox panels.
- Server keys remain in environment variables and are never serialized.

## Status freshness

MOT and tax values must be accompanied by their relevant expiry, due date or supplier source date when one is available. A source date that is too old to support “current” wording is presented as a dated supplier record.

The report must distinguish:

- current status supported by a future expiry or due date;
- an expired or failed status;
- an old supplier observation;
- an unavailable status;
- a legal exemption where explicitly returned.

The application does not infer a live legal status from an old observation. In sandbox mode, the general supplier staleness caveat remains available in the data notes, while the main customer interface uses dates rather than repeated sandbox warnings.

## Error handling

- Invalid input remains editable and receives a concise inline message.
- A failed identity lookup returns to Registration without showing stale vehicle data.
- A failed full-report package does not erase the preview.
- Partial full reports identify the unavailable package and never replace it with a successful check.
- Image expiry or load failure uses the existing branded vehicle placeholder.
- A mode change clears data from the previous mode.
- Raw provider error bodies, account balances, transaction information and API keys never reach the browser.

## Testing

Automated tests never make supplier calls.

Required coverage:

- Mock preview projection exposes only allowed fields.
- Mock mode has no outbound-network path.
- Fresh UI defaults to Mock.
- Selecting Live alone makes no request.
- Live preview makes one request for `VehicleDetailsWithImage`.
- Live generation makes three concurrent requests and no retry.
- A second report opening in the same client session makes no new request.
- Changing registration or mode clears prior evidence.
- Older/imported/no-history fixtures use evidence-led coverage language.
- MOT and tax values display dates and do not overstate stale observations.
- Partial package failure produces a usable report and explicit gap note.
- Keys and raw payload fields are absent from every public response.
- Fiat, Lotus, Porsche and Tesla complete reports render successfully.

A separate manual smoke action may exercise Live mode. It must print the planned and completed call count and must not retry failures.

## Deferred production work

The staged API is designed to support a later commercial phase:

1. Replace direct prototype unlock with Stripe Checkout.
2. Accept full generation only after a verified payment webhook.
3. Store a normalized immutable report under a random, unguessable identifier.
4. Display it immediately after payment.
5. Email a secure return link and receipt.
6. Generate a downloadable PDF.

Those capabilities require a separate design and implementation plan. This phase must not add provisional payment, email or persistence code.
