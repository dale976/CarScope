# Synthetic UK inventory response

`uk-active.json` follows the documented UK active-search envelope and selected listing fields. All values are invented from our own demo data. It contains no captured provider responses, real registrations, keys or remote images.

Reference: https://docs.marketcheck.com/uk/docs/api/cars/inventory/inventory-search

`cars.json` remains CarScope’s synthetic detail supplement (illustration colour, features and history). These fields are deliberately not invented as fields in the provider search schema. Mock loading maps the provider-shaped basic fields, combines them with this separate demo detail and runs existing validation.

The adapter is intentionally mock-only and covers the fields the current UI requires, not the entire MarketCheck contract. Listings missing price, mileage or essential specifications fail explicitly; supporting unknown values in live UI remains future work. No live adapter, requests or persistent provider storage is introduced.

## Richer UI scenarios

See [ui-development/README.md](ui-development/README.md) for a separate fictional 20-listing snapshot with missing fields and five equipment-evidence detail scenarios.
