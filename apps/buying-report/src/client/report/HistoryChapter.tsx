import { HistoryView } from '../HistoryView';
import type { BuyingReport } from '../../shared/report';
import { ReportChapter } from './ReportChapter';

export function HistoryChapter({ report }: { report: BuyingReport }) {
  return (
    <ReportChapter
      number="02"
      title="History and mileage"
      intro="Recorded events and mileage evidence, shown in date order without filling gaps in the record."
    >
      {report.evidence ? (
        <HistoryView
          detail={report.detail}
          vehicleYear={report.vehicle.year}
          mot={report.evidence.mot}
          events={report.historyEvents}
        />
      ) : (
        <p className="empty-data">No history evidence was supplied.</p>
      )}
      {report.historyNote && (
        <aside className="context-note">
          <strong>What this history cannot confirm</strong>
          <p>{report.historyNote}</p>
        </aside>
      )}
    </ReportChapter>
  );
}
