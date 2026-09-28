import type { BuyingReport } from '../../../shared/report';
import type { SupplierRecord } from '../types';
import { boolean, child, day, number, records, text } from './common';

export function normaliseEv(powertrain: SupplierRecord): BuyingReport['ev'] {
  const source = child(powertrain, 'EvDetails');
  if (!source) return undefined;
  const technical = child(source, 'TechnicalDetails');
  const performance = child(source, 'Performance');
  const battery = records(technical?.BatteryDetailsList)[0];
  const range = child(performance, 'RangeFigures');
  const ports = records(technical?.ChargePortDetailsList)
    .filter((port) => boolean(port, 'IsStandardChargePort') !== false)
    .flatMap((port) => {
      const type = text(port, 'PortType');
      if (!type) return [];
      const chargeTimes = child(port, 'ChargeTimes');
      const times = records(chargeTimes?.AverageChargeTimes10To80Percent).flatMap((item) => {
        const powerKw = number(item, 'ChargePortKw');
        const minutes = number(item, 'TimeInMinutes');
        return powerKw !== undefined && minutes !== undefined ? [{ powerKw, minutes }] : [];
      });
      return [
        {
          type,
          location: text(port, 'LocationOnVehicle'),
          maxKw: number(port, 'MaxChargePowerKw'),
          times,
        },
      ];
    });
  return {
    generatedAt: day(source.GeneratedAt),
    totalCapacityKwh: number(battery, 'TotalCapacityKwh'),
    usableCapacityKwh: number(battery, 'UsableCapacityKwh'),
    consumptionWhMile: number(performance, 'WhMile'),
    rangeMiles: number(range, 'ZeroEmissionMiles'),
    maxChargeKw: number(performance, 'MaxChargeInputPowerKw'),
    batteryWarrantyMonths: number(battery, 'ManufacturerWarrantyMonths'),
    batteryWarrantyMiles: number(battery, 'ManufacturerWarrantyMiles'),
    healthStatus: 'not-tested',
    superchargerCompatible: boolean(technical, 'IsTeslaSuperchargerCompatible'),
    ports,
  };
}
