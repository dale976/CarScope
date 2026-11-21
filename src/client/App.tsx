import { type FormEvent, useEffect, useRef, useState } from 'react';
import type { ClientRuntimeConfig, DataMode, VehiclePreview } from '../shared/preview';
import type { BuyingReport } from '../shared/report';
import { PreviewStep } from './journey/PreviewStep';
import { RegistrationStep } from './journey/RegistrationStep';
import { ReportStep } from './journey/ReportStep';
import { createRequestGate } from './journey/request-gate';

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

export function App({
  runtimeConfig = { dataMode: 'mock', reportAction: 'mock' },
}: {
  runtimeConfig?: ClientRuntimeConfig;
}) {
  const [stage, setStage] = useState<Stage>('registration');
  const mode: DataMode = runtimeConfig.dataMode === 'connected' ? 'official' : 'mock';
  const [registration, setRegistration] = useState('');
  const [preview, setPreview] = useState<VehiclePreview | null>(null);
  const [report, setReport] = useState<BuyingReport | null>(null);
  const [error, setError] = useState('');
  const heading = useRef<HTMLDivElement>(null);
  const requests = useRef(createRequestGate());
  const busy = stage === 'identifying' || stage === 'generating';
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  function clearResults() {
    requests.current.invalidate();
    setPreview(null);
    setReport(null);
    setError('');
    setStage('registration');
  }
  function changeRegistration(value: string) {
    requests.current.invalidate();
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
    await requests.current.run(
      () => post<VehiclePreview>('/api/report-preview', { registration }),
      (value) => {
        setPreview(value);
        setRegistration(value.registration);
        setStage('preview');
      },
      (e) => {
        setError(e instanceof Error ? e.message : 'Unable to identify the vehicle.');
        setStage('registration');
      },
    );
  }
  async function generate() {
    if (report) {
      setStage('report');
      return;
    }
    if (!preview || runtimeConfig.reportAction === 'unavailable' || preview.source !== mode) return;
    setError('');
    setStage('generating');
    await requests.current.run(
      () =>
        post<BuyingReport>('/api/report-generate', {
          registration: preview.registration,
          previewId: preview.previewId,
        }),
      (value) => {
        setReport(value);
        setStage('report');
      },
      (e) => {
        setError(e instanceof Error ? e.message : 'Unable to prepare the report.');
        setStage('preview');
      },
    );
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
      </header>
      <main id="main">
        {runtimeConfig.reportAction === 'sandbox' && (
          <p className="preview-test-notice" role="note">
            Sandbox report testing · no payment is taken. VDG test data may be up to 12 months old
            and is not for purchasing decisions.
          </p>
        )}
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
              reportAction={runtimeConfig.reportAction}
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
