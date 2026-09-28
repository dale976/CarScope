import { useEffect, useRef, useState, type FormEvent } from 'react';
import { RegistrationStep } from './journey/RegistrationStep';
import { PreviewStep } from './journey/PreviewStep';
import { ReportStep } from './journey/ReportStep';
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
            <RegistrationStep
              registration={registration}
              mode={mode}
              busy={busy}
              error={error}
              examples={examples}
              onRegistrationChange={changeRegistration}
              onSubmit={identify}
            />
          )}
          {(stage === 'preview' || stage === 'generating') && preview && (
            <PreviewStep
              preview={preview}
              mode={mode}
              busy={busy}
              error={error}
              onBack={clearResults}
              onGenerate={generate}
            />
          )}
          {stage === 'report' && report && (
            <ReportStep
              report={report}
              onBack={() => setStage('preview')}
              onRestart={clearResults}
            />
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
