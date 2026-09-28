import type { BuyingReport } from '../../../shared/report';
import type { SupplierRecord } from '../types';
import { boolean, child, number, records, text } from './common';

type Tyres = NonNullable<BuyingReport['evidence']>['tyres'];

export function normaliseTyres(result: SupplierRecord | undefined): Tyres {
  const tyreDetails = child(result, 'TyreDetails');
  const fitments = records(tyreDetails?.TyreDetailsList);
  const standard = fitments.filter((item) => boolean(item, 'IsStandardFitmentForVehicle') === true);
  const selected = standard.length ? standard : fitments.slice(0, 1);
  return selected.flatMap((fitment, index) =>
    ['Front', 'Rear'].flatMap((axle) => {
      const tyre = child(child(fitment, axle), 'Tyre');
      const size = text(tyre, 'SizeDescription');
      if (!size) return [];
      const pressure = child(child(tyre, 'Pressure'), 'TyrePressure');
      const psi = number(pressure, 'Psi');
      const bar = number(pressure, 'Bar');
      const pressureText = [
        psi !== undefined ? `${psi} psi` : undefined,
        bar !== undefined ? `${bar} bar` : undefined,
      ]
        .filter(Boolean)
        .join(' / ');
      return [
        {
          axle: selected.length > 1 ? `${axle} · fitment ${index + 1}` : axle,
          size,
          rating:
            [text(tyre, 'LoadIndex'), text(tyre, 'SpeedIndex')].filter(Boolean).join('') ||
            'Rating unavailable',
          runFlat: boolean(tyre, 'IsRunFlat'),
          pressure: pressureText || undefined,
        },
      ];
    }),
  );
}
