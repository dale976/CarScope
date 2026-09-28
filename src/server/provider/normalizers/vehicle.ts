import type { BuyingReport, MotRecord } from '../../../shared/report';
import type { SupplierRecord } from '../types';
import { child, day, number, records, text, title, vehicleTitle } from './common';
import { normaliseMotStatus } from './history';

type Vehicle = BuyingReport['vehicle'];
type Detail = NonNullable<BuyingReport['detail']>;

function taxStatus(value: unknown): NonNullable<BuyingReport['tax']>['status'] {
  if (typeof value !== 'string') return undefined;
  const status = value.trim().toLowerCase();
  if (status === 'sorn') return 'sorn';
  if (status.includes('not taxed') || status === 'untaxed') return 'untaxed';
  if (status.includes('exempt')) return 'exempt';
  if (status.includes('taxed')) return 'taxed';
  return 'unavailable';
}

export type NormalisedVehicle = {
  vehicle: Vehicle;
  detail: Detail;
  tax: BuyingReport['tax'];
  motStatus: BuyingReport['motStatus'];
  powertrain: SupplierRecord;
};

export function normaliseVehicle(
  details: SupplierRecord,
  vdi: SupplierRecord | undefined,
  mot: MotRecord[],
): NormalisedVehicle {
  const vehicleData = child(details, 'VehicleDetails');
  const identification = child(vehicleData, 'VehicleIdentification');
  const model = child(details, 'ModelDetails');
  const modelId = child(model, 'ModelIdentification');
  const history = child(vehicleData, 'VehicleHistory');
  const performance = child(model, 'Performance');
  const powertrain = child(model, 'Powertrain') ?? {};
  const technical = child(vehicleData, 'DvlaTechnicalDetails');
  const make = vehicleTitle(modelId?.Make ?? identification?.DvlaMake);
  const modelName = vehicleTitle(modelId?.Model ?? identification?.DvlaModel);
  if (!make || !modelName) throw new Error('Vehicle details did not identify the vehicle.');
  const registered =
    day(identification?.DateFirstRegistered) ?? day(identification?.DateFirstRegisteredInUk) ?? '';
  const year = number(identification, 'YearOfManufacture') ?? (Number(registered.slice(0, 4)) || 0);
  const colours = child(history, 'ColourDetails');
  const transmission = child(powertrain, 'Transmission');
  const ice = child(powertrain, 'IceDetails');
  const statistics = child(performance, 'Statistics');
  const dimensions = child(model, 'Dimensions');
  const weights = child(model, 'Weights');
  const body = child(model, 'BodyDetails');
  const economy = child(performance, 'FuelEconomy');
  const image = records(child(details, 'VehicleImageDetails')?.VehicleImageList).find((item) =>
    text(item, 'ImageUrl'),
  );
  const length = number(dimensions, 'LengthMm');
  const width = number(dimensions, 'WidthMm');
  const height = number(dimensions, 'HeightMm');
  const kerb = number(weights, 'KerbWeightKg');
  const massInService = number(technical, 'MassInServiceKg');
  const latestMileage =
    [...mot].sort((a, b) => b.date.localeCompare(a.date)).find((item) => item.mileage !== null)
      ?.mileage ?? null;

  const statusSource =
    child(vdi, 'VehicleTaxDetails') ??
    child(vehicleData, 'VehicleTaxDetails') ??
    child(vehicleData, 'VehicleStatus') ??
    {};
  const tax =
    child(statusSource, 'VehicleExciseDutyDetails') ??
    child(child(vehicleData, 'VehicleStatus'), 'VehicleExciseDutyDetails');
  const standard = number(child(child(tax, 'VedRate'), 'Standard'), 'TwelveMonths');
  const generated = day(statusSource.GeneratedAt ?? vehicleData?.GeneratedAt);
  const status = taxStatus(statusSource.TaxStatus);

  return {
    vehicle: { name: `${make} ${modelName}`, year, mileage: latestMileage, askingPrice: null },
    detail: {
      registered,
      keepers: records(history?.KeeperChangeList).flatMap((keeper) => {
        const date = day(keeper.KeeperStartDate);
        const previous = number(keeper, 'NumberOfPreviousKeepers');
        return date && previous !== undefined ? [{ date, previous }] : [];
      }),
      colour: title(colours?.CurrentColour),
      originalColour: title(colours?.OriginalColour),
      colourChanges: number(colours, 'NumberOfColourChanges'),
      image: image
        ? {
            url: text(image, 'ImageUrl')!,
            expires: text(image, 'ExpiryDate'),
            source: 'supplier',
          }
        : undefined,
      engine:
        [
          number(ice, 'EngineCapacityLitres') !== undefined
            ? `${number(ice, 'EngineCapacityLitres')}-litre`
            : undefined,
          text(powertrain, 'FuelType') ?? text(identification, 'DvlaFuelType'),
          number(ice, 'NumberOfCylinders') !== undefined
            ? `${number(ice, 'NumberOfCylinders')} cylinders`
            : undefined,
        ]
          .filter(Boolean)
          .join(' · ') || undefined,
      transmission:
        [
          number(transmission, 'NumberOfGears') !== undefined
            ? `${number(transmission, 'NumberOfGears')}-speed`
            : undefined,
          text(transmission, 'TransmissionType'),
        ]
          .filter(Boolean)
          .join(' ') || undefined,
      powerBhp: number(child(performance, 'Power'), 'Bhp'),
      torqueNm: number(child(performance, 'Torque'), 'Nm'),
      zeroToSixty: number(statistics, 'ZeroToSixtyMph'),
      zeroToHundred: number(statistics, 'ZeroToOneHundredKph'),
      topSpeedMph: number(statistics, 'MaxSpeedMph'),
      dimensions:
        length !== undefined && width !== undefined && height !== undefined
          ? { length, width, height }
          : undefined,
      seats: number(technical, 'NumberOfSeats') ?? number(body, 'NumberOfSeats'),
      weight:
        kerb !== undefined && massInService !== undefined ? { kerb, massInService } : undefined,
      economyMpg: number(economy, 'CombinedMpg'),
    },
    motStatus: normaliseMotStatus(statusSource.MotStatus, mot, generated),
    tax:
      standard !== undefined || status !== undefined
        ? {
            status,
            dueDate: day(statusSource.TaxDueDate),
            date: generated,
            co2: number(tax, 'DvlaCo2') ?? number(statusSource, 'DvlaCo2'),
            band:
              text(tax, 'DvlaBand') ?? text(tax, 'DvlaCo2Band') ?? text(statusSource, 'DvlaBand'),
            rates:
              standard !== undefined ? [{ label: 'Standard annual rate', amount: standard }] : [],
          }
        : undefined,
    powertrain,
  };
}
