import { formatDuration } from '../../domain/formatters';
import type { BuyingReport } from '../../shared/report';

export function EvSection({ ev }: { ev: NonNullable<BuyingReport['ev']> }) {
  const milesPerKwh = ev.consumptionWhMile ? 1000 / ev.consumptionWhMile : undefined;
  const warranty =
    ev.batteryWarrantyMonths || ev.batteryWarrantyMiles
      ? [
          ev.batteryWarrantyMonths ? `${ev.batteryWarrantyMonths / 12} years` : null,
          ev.batteryWarrantyMiles
            ? `${ev.batteryWarrantyMiles.toLocaleString('en-GB')} miles`
            : null,
        ]
          .filter(Boolean)
          .join(' / ')
      : null;
  return (
    <section className="report-section ev-section">
      <p className="eyebrow">Electric vehicle</p>
      <h2>Battery, range and charging</h2>
      <div className="ev-metrics">
        {ev.usableCapacityKwh != null && (
          <div>
            <strong>{ev.usableCapacityKwh} kWh usable</strong>
            <span>
              {ev.totalCapacityKwh != null
                ? `${ev.totalCapacityKwh} kWh total capacity`
                : 'Total capacity unavailable'}
            </span>
          </div>
        )}
        {ev.consumptionWhMile != null && (
          <div>
            <strong>{ev.consumptionWhMile} Wh/mile</strong>
            <span>{milesPerKwh?.toFixed(2)} miles/kWh · derived from the supplier figure</span>
          </div>
        )}
        {ev.rangeMiles != null && (
          <div>
            <strong>{ev.rangeMiles} miles</strong>
            <span>Supplier zero-emission range figure</span>
          </div>
        )}
        {ev.maxChargeKw != null && (
          <div>
            <strong>{ev.maxChargeKw} kW</strong>
            <span>Maximum charge input</span>
          </div>
        )}
      </div>
      {ev.ports.length > 0 && (
        <div className="charge-ports">
          {ev.ports.map((port) => (
            <div className="charge-port" key={port.type}>
              <div>
                <h3>{port.type}</h3>
                <p>
                  {port.maxKw != null ? `Up to ${port.maxKw} kW` : ''}
                  {port.location ? ` · ${port.location}` : ''}
                </p>
              </div>
              {port.times.length > 0 && (
                <dl>
                  {port.times.map((time) => (
                    <div key={time.powerKw}>
                      <dt>{time.powerKw} kW</dt>
                      <dd>{formatDuration(time.minutes)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="small-note">Supplier average 10–80% charging times.</p>
            </div>
          ))}
        </div>
      )}
      <div className="battery-caution">
        <strong>Battery health not tested</strong>
        <p>
          Capacity, range and charging specifications do not measure this vehicle’s present battery
          degradation or condition.
        </p>
        {warranty && (
          <p>
            Original model battery warranty: {warranty}. This does not confirm remaining cover;
            verify the start date, terms and transferability.
          </p>
        )}
        {ev.superchargerCompatible && (
          <p>
            Tesla Supercharger compatibility is listed by the supplier. Confirm connector support
            and any adaptor requirements for this vehicle.
          </p>
        )}
      </div>
      <p className="small-note">
        Supplier EV specifications{ev.generatedAt ? ` generated ${ev.generatedAt}` : ''}. Charging
        times vary with temperature, battery state, charger output and charge curve.
      </p>
    </section>
  );
}
