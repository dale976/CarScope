# Fictional UI development snapshot

All vehicle values, IDs, prices, dates, dealer names and descriptions are invented. This is **not a saved or anonymised MarketCheck response**. Field names follow the API; missing-field scenarios reflect the aggregate coverage review. No live requests are needed to use these files.

- `search.json`: provider-shaped search envelope with 20 fictional Porsche listings. Price is present on 19, heading on 16, reference price on 14 and price-change percentage on 13. Includes manual/automatic cars, recent/older adverts, price increases and decreases. Search records intentionally omit detailed equipment.
- `details.json`: fixture-only wrapper containing five individual detail-shaped records. Includes advertised equipment, unknown equipment, explicit absence, conflicting specification claims and feature synonyms. These are hypothetical detail scenarios, not observations from a live detail request. An option entry is not proof of fitment.

Use these as inputs when building the live-data adapter and loading/empty/detail UI states. Import JSON directly in local development or tests; use an empty `listings` array for the empty state. No real photo URLs or registrations are supplied: use existing local car illustrations. All advert/dealer URLs use the reserved `.example` domain and must not be treated as real links.

The existing running demo remains on its original fixture. These API-shaped fixtures are not accepted by the normalized cache importer: the current Car type requires a price, features and nonempty history, so it must be extended to represent unknown values before these scenarios can be wired into the UI. Do not fill missing prices with zero or manufacture history. A reference-price point is not a complete history series.

For feature UX, distinguish advertised present, explicitly absent, unknown and conflicting evidence. Show the source field and ask the seller to confirm conflicting claims. No real API payload is retained in this directory.
