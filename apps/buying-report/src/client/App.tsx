import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ReportView } from './ReportView';
import { VehiclePreviewCard } from './VehiclePreview';
import type { BuyingReport } from '../shared/report';
import type { DataMode, VehiclePreview } from '../shared/preview';

type Stage = 'registration' | 'identifying' | 'preview' | 'generating' | 'report';
const examples = [
  { registration: 'DF74FPA', name: 'Porsche 718 Boxster' },
  { registration: 'YJ22ACU', name: 'Lotus Exige' },
  { registration: 'SL60AUC', name: 'Fiat 500' },
  { registration: 'LD17VAE', name: 'Tesla Model X' },
];

async function post<T>(path: string, value: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
    cache: 'no-store',
  });
  const result = (await response.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!response.ok)
    throw new Error(result?.error ?? 'The request could not be completed. Please try again.');
  return result as T;
}

export function App() {
  const [stage, setStage] = useState<Stage>('registration');
  const [mode, setMode] = useState<DataMode>('mock');
  const [registration, setRegistration] = useState('');
  const [preview, setPreview] = useState<VehiclePreview | null>(null);
  const [report, setReport] = useState<BuyingReport | null>(null);
  const [error, setError] = useState('');
  const heading = useRef<HTMLDivElement>(null);
  const busy = stage === 'identifying' || stage === 'generating';
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  function clearResults() {
    setPreview(null);
    setReport(null);
    setError('');
    setStage('registration');
  }
  function chooseMode(value: DataMode) {
    if (value === mode) return;
    setMode(value);
    setRegistration('');
    clearResults();
  }
  function changeRegistration(value: string) {
    setRegistration(value.toUpperCase());
    if (preview || report) {
      setPreview(null);
      setReport(null);
      setStage('registration');
    }
    setError('');
  }
  async function identify(event: FormEvent) {
    event.preventDefault();
    setError('');
    setReport(null);
    setStage('identifying');
    try {
      const value = await post<VehiclePreview>('/api/report-preview', { mode, registration });
      setPreview(value);
      setRegistration(value.registration);
      setStage('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to identify the vehicle.');
      setStage('registration');
    }
  }
  async function generate() {
    if (report) {
      setStage('report');
      return;
    }
    if (!preview) return;
    setError('');
    setStage('generating');
    try {
      setReport(
        await post<BuyingReport>('/api/report-generate', {
          mode,
          registration: preview.registration,
          previewId: preview.previewId,
        }),
      );
      setStage('report');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to prepare the report.');
      setStage('preview');
    }
  }
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="/" aria-label="CarScope buying report home">
          <span>
            <span className="brand-car">CAR</span>
            <span className="brand-scope">SCOPE</span>
          </span>
        </a>
        <span className="product-name">Vehicle buying reports</span>
        <div className="mode-toggle" role="group" aria-label="Data source">
          <button type="button" aria-pressed={mode === 'mock'} onClick={() => chooseMode('mock')}>
            Mock
          </button>
          <button type="button" aria-pressed={mode === 'live'} onClick={() => chooseMode('live')}>
            Live
          </button>
        </div>
      </header>
      <main id="main">
        <nav aria-label="Report progress" className="journey-progress">
          <span
            aria-current={stage === 'registration' || stage === 'identifying' ? 'step' : undefined}
          >
            01 Registration
          </span>
          <span aria-current={stage === 'preview' || stage === 'generating' ? 'step' : undefined}>
            02 Vehicle preview
          </span>
          <span aria-current={stage === 'report' ? 'step' : undefined}>03 Complete report</span>
        </nav>
        <div ref={heading} tabIndex={-1} className="journey-content">
          {(stage === 'registration' || stage === 'identifying') && (
            <section className="lookup-layout">
              <div>
                <p className="eyebrow">Clarity starts with a number plate</p>
                <h1>
                  Know more.
                  <br />
                  <em>Before the keys.</em>
                </h1>
                <p className="lead">
                  Identify the vehicle for free, then choose whether to open its complete buying
                  report.
                </p>
                <div className="lookup-benefits">
                  <p>
                    <b>Recorded history</b>
                    <span>Returned MOT, finance and insurance records brought together.</span>
                  </p>
                  <p>
                    <b>Useful context</b>
                    <span>
                      Valuation, specification, tyre and ownership details where supplied.
                    </span>
                  </p>
                  <p>
                    <b>Honest gaps</b>
                    <span>Missing evidence stays clearly marked as not returned.</span>
                  </p>
                </div>
              </div>
              <form className="lookup-card" onSubmit={identify}>
                <p className="eyebrow">Free vehicle preview</p>
                <h2>Which car are you considering?</h2>
                <label htmlFor="registration">Vehicle registration</label>
                <input
                  id="registration"
                  className="registration-input"
                  value={registration}
                  onChange={(e) => changeRegistration(e.target.value)}
                  placeholder="AB12 CDE"
                  maxLength={12}
                  autoCapitalize="characters"
                  autoComplete="off"
                  required
                  disabled={busy}
                />
                <button type="submit" className="primary" disabled={busy}>
                  {busy ? 'Identifying vehicle…' : 'Identify vehicle'}{' '}
                  <span aria-hidden="true">↗</span>
                </button>
                {mode === 'live' && <p className="call-note">Uses 1 supplier call</p>}
                <div className="coverage-note">
                  <strong>About historical coverage</strong>
                  <p>
                    GB digital MOT records generally begin in 2005. Older, imported and exempt
                    vehicles may have gaps, and a missing record does not prove that an event did
                    not happen.
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
                        onClick={() => changeRegistration(example.registration)}
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
          )}
          {(stage === 'preview' || stage === 'generating') && preview && (
            <>
              <VehiclePreviewCard
                preview={preview}
                mode={mode}
                busy={busy}
                onBack={clearResults}
                onGenerate={generate}
              />
              {error && (
                <p className="form-error preview-error" role="alert">
                  {error}
                </p>
              )}
            </>
          )}
          {stage === 'report' && report && (
            <>
              <div className="report-actions">
                <button type="button" className="text-button" onClick={() => setStage('preview')}>
                  ← Vehicle preview
                </button>
                <button type="button" className="text-button" onClick={clearResults}>
                  Check another car
                </button>
              </div>
              <ReportView report={report} />
            </>
          )}
        </div>
      </main>
      <footer className="site-footer">
        <span>
          <b>CAR</b>SCOPE / Clarity before the keys.
        </span>
        <span>Vehicle information report</span>
      </footer>
    </>
  );
}
