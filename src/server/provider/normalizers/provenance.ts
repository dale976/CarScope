import type { BuyingReport, HistoryEvent } from '../../../shared/report';
import type { SupplierRecord } from '../types';
import { boolean, child, day, number, records, text, title } from './common';

type FinanceRecords = NonNullable<BuyingReport['financeRecords']>;

export type NormalisedProvenance = {
  financeRecords: FinanceRecords;
  writeOffEvents: HistoryEvent[];
  stolen: boolean;
};

export function normaliseProvenance(vdi: SupplierRecord | undefined): NormalisedProvenance {
  const finance = records(child(vdi, 'FinanceDetails')?.FinanceRecordList);
  const writeOffs = records(child(vdi, 'MiaftrDetails')?.WriteOffRecordList);
  return {
    financeRecords: finance.flatMap((item) => {
      const normalised = {
        agreementDate: day(item.AgreementDate),
        agreementType: title(item.AgreementType),
        termMonths: number(item, 'AgreementTerm'),
        company: title(item.FinanceCompany),
        contactNumber: text(item, 'ContactNumber'),
        vehicleDescription: title(item.VehicleDescription),
      };
      return Object.values(normalised).some((value) => value !== undefined) ? [normalised] : [];
    }),
    writeOffEvents: writeOffs.flatMap((item) => {
      const date = day(item.LossDate);
      if (!date) return [];
      const category = text(item, 'Category');
      const status = text(item, 'Status');
      return [
        {
          date,
          title: `${category ? `Cat ${category} ` : ''}write-off recorded`,
          text: `${status ?? 'Insurance loss record returned'}. Repair evidence and current condition are not established by this record.`,
          significant: true,
        },
      ];
    }),
    stolen: boolean(child(vdi, 'PncDetails'), 'IsStolen') === true,
  };
}
