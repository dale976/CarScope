# Environment-selected preview and sandbox report journey

The user requests removing the mock/live UI selector and testing registration →
official free preview → VDG full report. They confirmed VDG remains sandbox-only.

## Decisions

- Use `CARSCOPE_DATA_MODE=mock|connected`, default mock. NODE_ENV retains its standard
  runtime/build meaning. DVLA_ENVIRONMENT independently selects UAT or real VES.
  Honor the existing OFFICIAL_PREVIEW_ENABLED flag only as a deprecated fallback
  when the new setting is absent, to preserve current local setup.
- The server chooses sources; no browser input can override its launch setting.
  Reject a supplied mismatching legacy mode without any provider calls.
- Remove the selector in all environments. Expose only safe launch/action metadata
  to the browser. Stop the journey if runtime configuration cannot be loaded.
- Connected previews continue to use DVLA/DVSA only, now including production
  application builds. Create an opaque 30-minute session bound to registration
  and source, retaining normalized official evidence rather than provider payloads.
- `VDG_SANDBOX_ENABLED=true` plus VDG_API_KEY allows explicit test report generation
  in development/test only. Real production builds never bypass payment: no
  sandbox generation there. No payment or Stripe integration in this increment.
- The report action says Generate test report and explains that no payment occurs,
  data is sandbox data, and registrations must contain A. No calls on page load,
  source/config fetch, preview lookup, or page navigation.
- Report generation validates the session first. Request VDICheck as the required
  package, then ValuationDetails and TyreDetails concurrently. No CarScopeFree,
  retries or fallback. Validate returned identity where supplied before enrichment.
- Reuse official identity when VDG omits it, official MOT history and tax when
  available, retain original preview evidence with dates/units in the report, and
  identify the report as a sandbox test. Unknown/missing provenance fields remain
  not checked, not none returned. Optional failures produce visible gaps.
- Coalesce concurrent requests and cache a completed sandbox report until session
  expiry so repeated clicks or a lost HTTP response never repeat supplier calls.
  A failed sandbox generation stays failed for that session, preventing partial
  billable requests from being repeated. Mock failures may be retried as before.
- Preserve prototype constraints: in-memory sessions are single-instance and reset
  at restart. Public commerce needs payment verification and durable idempotency.

## Approach and alternatives

Selected: a server-configured sandbox test journey now, followed by payment work
after the commercial meeting. Alternatives: Stripe test checkout first (delays
data/report evaluation), or directly enabling production report purchasing (not
supported by the current payments/storage implementation). Never reattach VDG to
the free preview to reuse its former session format.

## Verification

Offline tests cover launch authority, no selectors, production sandbox denial,
session mismatches/expiry/concurrency/replay, no paid requests before completion,
three-package completion with no CarScopeFree, required/optional failures,
identity mismatches, missing provenance, official evidence reuse and sandbox UI.
Run full check/build/smoke and independent review; no live API calls or deployment.
