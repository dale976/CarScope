import type { BuyingReport } from '../shared/report';
import { ReportView } from './ReportView';
export type ReportState =
  | { status: 'idle' | 'loading' | 'error' }
  | { status: 'ready'; report: BuyingReport };
export function ReportContent({
  state,
  onLoad,
  example = 'lotus',
}: {
  state: ReportState;
  onLoad: () => void;
  example?: 'lotus' | 'porsche';
}) {
  if (state.status === 'ready') return <ReportView report={state.report} />;
  if (state.status === 'loading')
    return (
      <section className="message-panel" role="status">
        <p className="eyebrow">One moment</p>
        <h1>Preparing your sample report…</h1>
      </section>
    );
  if (state.status === 'error')
    return (
      <section className="message-panel" role="alert">
        <h1>We couldn’t load the sample report.</h1>
        <p>Please try again.</p>
        <button type="button" className="primary" onClick={onLoad}>
          Try again <span aria-hidden="true">↗</span>
        </button>
      </section>
    );
  return (
    <section className="welcome">
      <div className="welcome-copy">
        <p className="eyebrow">
          <span className="status-dot" /> A little clarity before a big decision
        </p>
        <h1>
          Like the car.
          <br />
          <em>Know the questions.</em>
        </h1>
        <p className="lead">
          A plain-English buying brief. Understand the findings, plan for running costs and know
          what to ask before you buy.
        </p>
        <button type="button" className="primary" onClick={onLoad}>
          View {example === 'porsche' ? 'Porsche' : 'Lotus'} report{' '}
          <span aria-hidden="true">↗</span>
        </button>
        <p className="small-note">
          {example === 'porsche'
            ? 'Porsche · API sandbox records only'
            : 'Your Lotus · supplied sandbox data'}{' '}
          · no new API calls.
        </p>
        <div className="welcome-steps">
          <span>
            <b>01</b> Understand the findings
          </span>
          <span>
            <b>02</b> See the unknowns
          </span>
          <span>
            <b>03</b> Ask better questions
          </span>
        </div>
      </div>
      <div className="preview-sheet">
        <div className="sheet-top">
          <span>CARSCOPE / BUYING BRIEF</span>
          <span>001</span>
        </div>
        <p className="eyebrow">An example, explained</p>
        <h2>
          {example === 'porsche' ? (
            <>
              Porsche 718
              <br />
              Boxster GTS 4.0
            </>
          ) : (
            <>
              Lotus Exige
              <br />
              Sport 410
            </>
          )}
        </h2>
        <p className="preview-spec">
          {example === 'porsche'
            ? '2024 · 4.0-litre flat-six · PDK'
            : '2022 · approximately 12,100 miles'}
        </p>
        <div className="preview-line">
          <span className="circle-number">1</span>
          <div>
            <strong>Look a little closer</strong>
            <p>MOT history and records to follow up.</p>
          </div>
        </div>
        <div className="preview-line">
          <span className="circle-number">2</span>
          <div>
            <strong>Budget beyond the price</strong>
            <p>Running costs, with assumptions shown.</p>
          </div>
        </div>
        <div className="preview-line">
          <span className="circle-number">3</span>
          <div>
            <strong>Know what’s still unknown</strong>
            <p>Unchecked history stays unchecked.</p>
          </div>
        </div>
        <div className="sheet-bottom">
          SANDBOX EXAMPLE <span>NOT A LIVE CHECK</span>
        </div>
      </div>
    </section>
  );
}
