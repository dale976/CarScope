import { dateLabel } from '../../shared/history';
import type { BuyingReport } from '../../shared/report';

export function FinanceRecordDetails({
  records,
}: {
  records: NonNullable<BuyingReport['financeRecords']>;
}) {
  return (
    <div className="finance-records">
      {records.map((record, index) => (
        <dl key={`${record.company ?? 'finance'}-${record.agreementDate ?? index}`}>
          <div>
            <dt>Agreement type</dt>
            <dd>{record.agreementType ?? 'Not supplied'}</dd>
          </div>
          <div>
            <dt>Finance company</dt>
            <dd>{record.company ?? 'Not supplied'}</dd>
          </div>
          <div>
            <dt>Agreement date</dt>
            <dd>{record.agreementDate ? dateLabel(record.agreementDate) : 'Not supplied'}</dd>
          </div>
          <div>
            <dt>Term</dt>
            <dd>{record.termMonths != null ? `${record.termMonths} months` : 'Not supplied'}</dd>
          </div>
          {record.contactNumber && (
            <div>
              <dt>Lender contact</dt>
              <dd>{record.contactNumber}</dd>
            </div>
          )}
        </dl>
      ))}
    </div>
  );
}
