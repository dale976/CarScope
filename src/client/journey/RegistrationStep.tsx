import type { FormEvent } from 'react';
import type { DataMode } from '../../shared/preview';

export type RegistrationExample = { registration: string; name: string };

export function RegistrationStep({
  registration,
  mode,
  busy,
  error,
  examples,
  onRegistrationChange,
  onSubmit,
}: {
  registration: string;
  mode: DataMode;
  busy: boolean;
  error: string;
  examples: RegistrationExample[];
  onRegistrationChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <section className="lookup-layout">
      <div>
        <p className="eyebrow">Clarity starts with a number plate</p>
        <h1>
          Know more.
          <br />
          <em>Before the keys.</em>
        </h1>
        <p className="lead">
          Identify the vehicle for free, then choose whether to open its complete buying report.
        </p>
        <div className="lookup-benefits">
          <p>
            <b>Recorded history</b>
            <span>Returned MOT, finance and insurance records brought together.</span>
          </p>
          <p>
            <b>Useful context</b>
            <span>Valuation, specification, tyre and ownership details where supplied.</span>
          </p>
          <p>
            <b>Honest gaps</b>
            <span>Missing evidence stays clearly marked as not returned.</span>
          </p>
        </div>
      </div>
      <form className="lookup-card" onSubmit={onSubmit}>
        <p className="eyebrow">Free vehicle preview</p>
        <h2>Which car are you considering?</h2>
        <label htmlFor="registration">Vehicle registration</label>
        <input
          id="registration"
          className="registration-input"
          value={registration}
          onChange={(event) => onRegistrationChange(event.target.value)}
          placeholder="AB12 CDE"
          maxLength={12}
          autoCapitalize="characters"
          autoComplete="off"
          required
          disabled={busy}
        />
        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'Identifying vehicle…' : 'Identify vehicle'} <span aria-hidden="true">↗</span>
        </button>
        {mode === 'live' && <p className="call-note">Uses 1 supplier call</p>}
        <div className="coverage-note">
          <strong>About historical coverage</strong>
          <p>
            GB digital MOT records generally begin in 2005. Older, imported and exempt vehicles may
            have gaps, and a missing record does not prove that an event did not happen.
          </p>
        </div>
        {mode === 'mock' && (
          <div className="example-vehicles">
            <span>Try an example vehicle</span>
            {examples.map((example) => (
              <button
                type="button"
                className="example-vehicle"
                key={example.registration}
                onClick={() => onRegistrationChange(example.registration)}
              >
                <strong>{example.name}</strong>
                <small>{example.registration}</small>
              </button>
            ))}
          </div>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
