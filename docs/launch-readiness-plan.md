# CarScope launch-readiness plan

Updated: 25 September 2026

## Where the product stands

CarScope is a polished working prototype with a strong report experience, a free vehicle preview, mock and live supplier modes, and a deterministic buyer briefing. It is not ready to accept public payments until the live data licence, final package cost, consumer terms, report retention rules and failure handling have been agreed.

The shortest responsible route is a small private beta, followed by an introductory £6.99 public launch. The long-term price should remain £9.99 unless the final data package makes that uneconomic.

## The immediate sequence

### 1. Book the Vehicle Data Global meeting

This is the main external dependency. Book the meeting with Tony Percival using the link supplied by Vehicle Data Global.

Take the following description into the meeting:

> CarScope is a UK consumer vehicle-information report purchased for a single registration. A free preview identifies the vehicle and displays limited MOT and tax information. The paid report combines provenance checks, MOT and mileage evidence, valuation, specification, tyres, tax and practical ownership context. It explains returned evidence without rating the vehicle or recommending whether to buy it.

The required launch package is likely to contain:

- VehicleDetails, including ModelDetails and applicable EV details
- VehicleImageDetails
- MOTHistoryDetails
- MileageCheckDetails
- FinanceDetails
- MIAFTREnhanced
- PNCDetails
- ValuationDetails
- SpecAndOptionsDetails
- TyreDetails
- VehicleTaxDetails
- RecallDetails, subject to price and coverage

Do not add BatteryDetails unless Vehicle Data Global can identify useful vehicle-specific battery-health information that is not already supplied through ModelDetails. Static battery specifications alone are already available through the existing vehicle response.

### Questions that require written answers

#### Commercial package

1. What is the exact PAYGO and subscription cost of this package at each volume tier?
2. Is CarScope charged for every selected source, only sources that return successfully, or also sources that return no records?
3. What happens commercially when a source times out, fails or returns an incomplete response?
4. Can the free preview remain a separate low-cost package containing only VehicleDetails, MOT status/history and VehicleTaxDetails?
5. Can completion of a purchased report request only the sources not already returned by the preview?
6. Can duplicate requests for the same registration within a short period reuse a result, and under what retention rules?
7. Are there account minimums, setup fees, support fees or contract terms beyond the published per-source prices?

#### Consumer and provenance terms

8. Please provide the Consumer Terms and Provenance Reseller Terms before development proceeds to payment.
9. Which returned fields may be shown to a consumer? Confirm the position for finance company, agreement type, agreement date, term and lender contact details.
10. Are there mandatory notices, source labels, logos or wording that must appear in the report?
11. How long may CarScope retain the normalised report and the raw supplier response?
12. May a customer retain an online report indefinitely? If not, what access period is permitted?
13. May CarScope generate and email a PDF containing the permitted report fields?
14. What deletion, correction and dispute process must CarScope provide?
15. Which data can be displayed in the free preview before payment?

#### Liability and guarantee

16. Does Vehicle Data Global provide any warranty, indemnity or data guarantee to resellers?
17. Can CarScope offer a consumer data guarantee backed by the supplier, and what conditions and wording would apply?
18. Who handles a claim that finance, stolen or write-off information was incorrect or incomplete?
19. Is professional indemnity, cyber insurance or another minimum level of cover contractually required?

#### Data quality and operation

20. What are the typical coverage and freshness of Finance, MIAFTR Enhanced, PNC, Mileage and Recall data?
21. What differences should be expected between sandbox and live responses?
22. Are imported, historic, Northern Irish, cherished-plate and recently registered vehicles handled differently?
23. Is there an uptime commitment, status page or service-level agreement?
24. How are corrections propagated after a finance agreement is settled or a source record changes?
25. Can CarScope distinguish “no record returned”, “source unavailable” and “source not checked” reliably in every package response?

#### AI-assisted explanation

26. May CarScope send a minimised, normalised subset of permitted report facts to an external AI processor solely to produce a real-time explanation for that customer?
27. Would this require a separate licence, written approval or data-processing schedule?
28. Are any provenance sources prohibited from being processed in this way?
29. Would approval change if lender contact details, agreement identifiers and raw supplier responses were excluded?
30. May the generated explanation be retained alongside the purchased report for the same permitted period?

## Email to Vehicle Data Global

**Subject: CarScope consumer report — package, reseller terms and next-step questions**

Hi Tracy,

Thank you for the detailed response. I would like to arrange the discussion with Tony and have now refined the proposed CarScope service.

CarScope will provide a one-off UK consumer vehicle-information report from a registration number. A limited free preview will identify the vehicle and show basic MOT and tax status. The paid report will present the returned provenance checks, MOT and mileage evidence, valuation, specification, tyre, tax and ownership information in a clear buyer-focused format. It will explain the records and highlight gaps, but it will not rate the vehicle, assess its physical condition or recommend whether the customer should buy it.

The sources I currently expect the complete package to require are VehicleDetails with ModelDetails and applicable EV details, VehicleImageDetails, MOTHistoryDetails, MileageCheckDetails, FinanceDetails, MIAFTR Enhanced, PNCDetails, ValuationDetails, SpecAndOptionsDetails, TyreDetails and VehicleTaxDetails. I would also like to understand the price and coverage of RecallDetails. I do not currently expect to need BatteryDetails unless it contains vehicle-specific battery-health information beyond the model specifications already returned.

Before the meeting, could you please send me the Consumer Terms and Provenance Reseller Terms you mentioned? I would also appreciate written clarification on the following points:

- PAYGO and subscription pricing for the proposed package, including how successful, empty and failed source responses are charged;
- the permitted retention period for raw responses and normalised reports;
- whether reports may be stored online and supplied to customers as PDFs;
- which finance and provenance fields may be displayed to consumers;
- any mandatory wording, branding, correction or dispute process;
- whether a supplier-backed consumer data guarantee is available;
- whether a separate low-cost preview package can be used before purchase;
- whether a minimised subset of permitted report facts may be sent to an external AI processor for a real-time plain-English explanation, without training, embeddings or secondary use.

I will bring the proposed report flow and sample screens to the meeting so we can review the intended display and identify any necessary changes.

Best wishes,

Alan

## 2. Decide the business and tax setup

Speak to an accountant before taking payments. The decision is whether to operate initially as a sole trader or form a limited company. Ask the accountant to cover:

- the appropriate structure for a consumer data-reporting business;
- allowable treatment of data, software, advertising and professional fees;
- whether voluntary VAT registration would help or harm the launch economics;
- how to monitor the rolling VAT threshold;
- bookkeeping and evidence needed for digital sales, refunds and supplier credits;
- whether selling reports outside the UK creates additional VAT obligations.

The current compulsory UK VAT registration threshold is £90,000 of taxable turnover over a rolling 12-month period, although voluntary registration is possible below that level. Do not assume that the introductory price automatically includes VAT until the chosen structure and registration position are confirmed.

### Email to an accountant

**Subject: Advice on launching a UK consumer digital-report service**

Hi,

I am preparing to launch CarScope, an online service selling one-off vehicle-information reports to UK consumers. A customer enters a registration, views a free vehicle preview and can purchase an automatically generated digital report. The intended introductory price is £6.99, rising to £9.99. Each sale incurs third-party vehicle-data and payment-processing costs.

Could you advise on the most suitable initial structure, whether voluntary VAT registration would be sensible, how the £90,000 rolling threshold should be monitored, and the treatment of supplier data charges, payment fees, refunds and advertising costs? I would also like to understand what changes if reports are sold to customers outside the UK.

I can provide expected volumes and the supplier cost model once the commercial data package has been quoted.

Best wishes,

Alan

## 3. Obtain a focused consumer-law review

Use a UK solicitor familiar with e-commerce, consumer digital content and data licensing. This does not need to become a large legal project; ask for a fixed-price review of:

- website terms of sale;
- privacy and cookie notices;
- the checkout wording and the point at which the contract is formed;
- consent to immediate supply of digital content and the effect on cancellation rights;
- the refund policy when a report is empty, delayed, incomplete or factually disputed;
- disclaimers distinguishing a data report from a mechanical inspection or buying recommendation;
- wording around “no record returned”, current status and data freshness;
- liability caps and the relationship with any supplier-backed guarantee;
- AI disclosure and automated explanation, if enabled;
- the Vehicle Data Global reseller agreement before it is signed.

UK distance-selling rules require key business, price, delivery and cancellation information before purchase and a durable copy of the contract after purchase. Government guidance says cancellation rights for digital content can be affected once supply begins only where the customer has been told and has explicitly acknowledged this. This should be reviewed for CarScope’s exact checkout rather than copied from a generic template.

### Email to a solicitor

**Subject: Fixed-price review for a UK consumer vehicle-report website**

Hi,

I am preparing a UK consumer website called CarScope. Customers enter a vehicle registration, receive a limited free preview and can purchase an immediately generated digital vehicle-information report. The report combines licensed third-party vehicle data and a plain-English explanation. It does not inspect the vehicle or recommend whether it should be purchased.

I am looking for a fixed-price review covering website terms of sale, privacy wording, digital-content cancellation consent, refunds, disclaimers, liability and the proposed supplier reseller agreement. I would also like the review to cover how an automatically generated explanation should be described to consumers.

Could you confirm whether this is within your area, what documents and product screens you would need, your likely fee, and the expected turnaround?

Best wishes,

Alan

## 4. Complete the privacy and security groundwork

Before beta:

- Rotate the Vehicle Data Global API key that has been pasted into development conversations and URLs. Treat it as exposed.
- Keep all live supplier and payment keys on the server and outside Git.
- Decide precisely what CarScope retains: customer email, registration, payment reference, normalised report, raw response and generated PDF.
- Define a retention period for every category, constrained by supplier terms.
- Complete the ICO fee self-assessment. Controllers generally pay a data-protection fee unless an exemption applies.
- Create a privacy notice identifying purposes, lawful bases, recipients, international transfers, retention periods and customer rights.
- Record the processors used for hosting, payments, email, analytics and any AI service.
- Avoid sending finance agreement identifiers, lender contact details or raw supplier payloads to an AI service.

If the OpenAI API is later used, API data is not used for model training by default unless the customer opts in, but standard abuse-monitoring logs may retain content for up to 30 days. This still requires supplier permission and an appropriate privacy disclosure; “not used for training” does not mean “never retained”.

## 5. Fix the commercial definition of a report

The product cannot be priced confidently until “complete report” has a fixed source list and failure policy.

Create a final cost sheet with these columns:

| Item | Cost on success | Cost on empty response | Critical? | Displayed in preview? | Displayed in paid report? |
|---|---:|---:|---|---|---|
| Vehicle identity/model |  |  | Yes | Yes | Yes |
| MOT history |  |  | Yes | Limited | Yes |
| Tax |  |  | Yes | Status | Yes |
| Finance |  |  | Yes | No | Yes |
| MIAFTR Enhanced |  |  | Yes | No | Yes |
| PNC |  |  | Yes | No | Yes |
| Mileage check |  |  | Yes | No | Yes |
| Valuation |  |  | Optional | No | Yes |
| Specification/options |  |  | Optional | No | Yes |
| Tyres |  |  | Optional | No | Yes |
| Image |  |  | Optional | Yes | Yes |
| Recalls |  |  | To decide | No | To decide |

Set a launch rule: if a critical source cannot be checked, either do not charge, delay completion, or make the failure unmissable and provide an appropriate remedy. Do not let a provider timeout render as “none returned”.

## 6. Run a structured live-data evaluation

Test 50–100 live vehicles before public launch. Use vehicles across:

- under three years old;
- ordinary 3–10-year-old cars;
- 10–20-year-old cars;
- pre-2005 vehicles;
- imports and cherished plates;
- petrol, diesel, hybrid and EV;
- known finance, write-off or salvage examples where lawfully available;
- high-value performance cars and ordinary family cars.

For each report, record:

- which sources returned;
- whether status wording was correct;
- whether mileage and dates agreed with available official evidence;
- whether the buyer briefing stayed grounded;
- whether the report contained enough value to justify £6.99 and £9.99;
- any misleading empty state;
- total supplier cost and generation time.

Do not optimise for the best examples. The launch decision should be based on the median report and the weakest acceptable paid report.

## 7. Prepare the private beta

Recruit 10–20 people who are genuinely considering a used car. Give them a free report in exchange for a short interview or questionnaire.

Ask:

1. What did you understand after reading the report that you did not know before?
2. Which section changed what you would ask or inspect?
3. Was anything presented as more certain than the evidence justified?
4. Which part felt repetitive or unnecessary?
5. Would you have paid £6.99? Would you have paid £9.99?
6. Did the free preview give enough confidence to continue?
7. What did you expect that the report did not provide?

Success criteria for moving to a public launch:

- at least 70% say the report changed or improved their viewing questions;
- at least 50% say they would pay £6.99;
- no repeated misunderstanding of “none returned” as a guaranteed all-clear;
- no critical supplier failure silently shown as a completed check;
- median complete-report generation cost leaves at least £2 contribution at £6.99 under the intended tax treatment.

## 8. Development remaining after the commercial answers

The next engineering phase should contain:

1. Stripe Checkout in test mode, followed by live mode only after terms are approved.
2. Idempotent payment and report generation so a customer is never charged twice.
3. A durable report record and secure, unguessable access link.
4. Transactional email containing the receipt and report link.
5. PDF generation if supplier terms permit it.
6. Clear handling for critical-source failure, partial report, retry and refund.
7. Rate limiting, bot protection and spend limits on preview and report endpoints.
8. Monitoring for supplier latency, errors, per-report cost and conversion.
9. Customer-support and correction workflow.
10. A small admin view for payments, reports, supplier responses and refunds.

The AI-generated version of the buyer briefing should follow the deterministic launch, not block it. First establish that customers value the briefing. Then add AI behind the same structured interface, with supplier approval, evidence references, schema validation and deterministic fallback.

## 9. Proposed launch pricing

- Private beta: free or £2.99, explicitly in exchange for feedback.
- Introductory public price: £6.99 for the first 500 reports or first three months.
- Standard price: £9.99 once quality and conversion are established.
- Do not launch at £4.99 unless the final fully loaded data cost falls materially below the current estimate.

The go/no-go calculation should include VAT where applicable, payment fees, successful and failed data calls, AI, email, hosting, refunds, support and expected acquisition cost. The target is at least £2 contribution per introductory report and at least £4 at the standard price before advertising.

## What to do this week

- [ ] Book the Vehicle Data Global meeting.
- [ ] Send the supplier email and request both reseller terms in advance.
- [ ] Build the blank source-cost table from the supplier’s response.
- [ ] Rotate the exposed sandbox API key.
- [ ] Decide whether CarScope will begin as a sole trader or limited company with an accountant.
- [ ] Request a fixed-price consumer-law review.
- [ ] Complete the ICO fee self-assessment.
- [ ] Identify the first 10 private-beta buyers.
- [ ] Keep payment and AI integration paused until data permissions and unit costs are confirmed.

## Reference links

- Vehicle Data Global meeting: <http://www.vehicledataglobal.com/meet-with-us>
- Vehicle Data Global terms: <https://vehicledataglobal.com/Terms>
- UK online and distance-selling requirements: <https://www.gov.uk/online-and-distance-selling-for-businesses>
- UK consumer-law guidance: <https://www.gov.uk/guidance/selling-products-and-services-complying-with-consumer-protection-law>
- VAT registration threshold: <https://www.gov.uk/register-for-vat>
- ICO privacy-information checklist: <https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/checklists/>
- ICO data-protection fee: <https://ico.org.uk/for-organisations/data-protection-fee/>
- OpenAI API data controls: <https://platform.openai.com/docs/models/default-usage-policies-by-endpoint>
