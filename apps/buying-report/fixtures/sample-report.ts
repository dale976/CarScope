import type { BuyingReport } from '../src/shared/report';
export const sampleReport: BuyingReport = {
  kind: 'fictional-sample',
  vehicle: { name: 'Volkswagen Golf', year: 2018, mileage: 62000, askingPrice: 12500 },
  findings: [
    {
      label: 'Give the tyres a closer look',
      text: 'This fictional MOT example includes a tyre-wear advisory. Ask whether the tyres were replaced, then check their current condition before buying.',
      source: 'fictional-mot',
    },
    {
      label: 'Ask to see the service invoices',
      text: 'The example seller claims a full service history. No records have been supplied, so the claim remains unverified.',
      source: 'seller-claim',
    },
    {
      label: 'The asking price needs a comparison',
      text: '£12,500 is the fictional asking price, not a valuation. Compare equivalent cars and their condition before deciding whether it is fair.',
      source: 'not-checked',
    },
  ],
  checks: [
    { name: 'Finance', status: 'not-checked' },
    { name: 'Stolen status', status: 'not-checked' },
    { name: 'Insurance write-off', status: 'not-checked' },
  ],
  costs: [
    {
      label: 'Fuel',
      annualPounds: 1260,
      assumption:
        '8,000 miles a year · 45 imperial mpg · £1.56/litre. Assumed consumption and fuel price, not measured or live data.',
    },
    {
      label: 'Servicing allowance',
      annualPounds: 300,
      assumption:
        'Illustrative yearly allowance only. Actual servicing depends on the engine, schedule and garage quote.',
    },
    {
      label: 'Tyre allowance',
      annualPounds: 150,
      assumption:
        'Illustrative yearly provision, not the price of a set. Confirm tyre size and condition for a replacement quote.',
    },
  ],
  sellerQuestions: [
    'Were the tyres mentioned in the MOT advisory replaced? Can I see the receipt?',
    'Can you show me the service record and invoices, including the most recent service?',
    'Are any repairs or scheduled maintenance due soon?',
    'Can I arrange an independent inspection and a test drive before committing?',
  ],
};
