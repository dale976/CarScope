import type { BuyingReport } from '../../../shared/report';
import type { SupplierRecord } from '../types';
import { child, day, number } from './common';

type Valuation = NonNullable<NonNullable<BuyingReport['evidence']>['valuation']>;

const labels = [
  ['Dealer forecourt', 'DealerForecourt'],
  ['Private sale — clean', 'PrivateClean'],
  ['Private sale — average', 'PrivateAverage'],
  ['Part exchange', 'PartExchange'],
  ['Auction', 'Auction'],
] as const;

export function normaliseValuation(result: SupplierRecord | undefined): Valuation | undefined {
  const valuation = child(result, 'ValuationDetails');
  const figures = child(valuation, 'ValuationFigures');
  const mileage = number(valuation, 'ValuationMileage');
  const date = day(valuation?.GeneratedAt ?? valuation?.ValuationTime);
  if (!valuation || !figures || mileage === undefined || !date) return undefined;
  const values = labels.flatMap(([label, key]) => {
    const value = number(figures, key);
    return value === undefined ? [] : [{ label, value }];
  });
  return values.length ? { mileage, date, figures: values } : undefined;
}
