import { reportAnchor } from '../../shared/history';
import type { BuyingReport } from '../../shared/report';
import { FinanceRecordDetails } from './FinanceRecordDetails';
import { ReportChapter } from './ReportChapter';

export function BeforeYouBuyChapter({ report }: { report: BuyingReport }) {
  return (
    <ReportChapter
      number="04"
      title="Before you buy"
      intro="The checks and questions that remain between this report and a purchase decision."
    >
      <div className="before-buy-grid">
        <section className="data-card checks-card">
          <p className="eyebrow">History checks</p>
          <h3>What was returned</h3>
          {report.checks.map((c) => (
            <div
              className={`check-result ${c.status}`}
              id={`history-check-${reportAnchor(c.name)}`}
              key={c.name}
            >
              <div className="check-row">
                <span>{c.name}</span>
                <span className={`check-status ${c.status}`}>
                  {c.status === 'record-returned'
                    ? 'Record returned'
                    : c.status === 'none-returned'
                      ? 'None returned'
                      : 'Not checked'}
                </span>
              </div>
              {c.status === 'record-returned' && (
                <>
                  <p>
                    {c.name === 'Finance'
                      ? 'Confirm its current status and obtain evidence of settlement before purchase.'
                      : 'Review the returned record and verify its current status before purchase.'}
                  </p>
                  {c.name === 'Finance' && report.financeRecords?.length ? (
                    <FinanceRecordDetails records={report.financeRecords} />
                  ) : null}
                </>
              )}
            </div>
          ))}
          <p className="action-note">
            <strong>Why this matters</strong> “None returned” only describes this supplied response.
            It is not a current all-clear.
          </p>
        </section>
        <section className="data-card questions">
          <p className="eyebrow">Questions for the seller</p>
          <h3>Take these with you</h3>
          <ol>
            {report.sellerQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
          <p className="action-note">
            <strong>What to do next</strong> Keep the answers and ask for documents that support
            them.
          </p>
        </section>
      </div>
    </ReportChapter>
  );
}
