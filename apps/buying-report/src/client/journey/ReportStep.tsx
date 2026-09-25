import type { BuyingReport } from '../../shared/report';
import { ReportView } from '../ReportView';

export function ReportStep({
  report,
  onBack,
  onRestart,
}: {
  report: BuyingReport;
  onBack: () => void;
  onRestart: () => void;
}) {
  return (
    <>
      <div className="report-actions">
        <button type="button" className="text-button" onClick={onBack}>
          ← Vehicle preview
        </button>
        <button type="button" className="text-button" onClick={onRestart}>
          Check another car
        </button>
      </div>
      <ReportView report={report} />
    </>
  );
}
