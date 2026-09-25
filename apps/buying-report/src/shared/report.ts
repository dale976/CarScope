export interface VehicleDetail {
  registered: string;
  keepers: { date: string; previous: number }[];
  colour?: string;
  originalColour?: string;
  colourChanges?: number;
  image?: { url: string; expires?: string; source?: 'dealer' | 'supplier' };
  engine?: string;
  transmission?: string;
  powerBhp?: number;
  torqueNm?: number;
  zeroToSixty?: number;
  zeroToHundred?: number;
  topSpeedMph?: number;
  dimensions?: { length: number; width: number; height: number };
  seats?: number;
  weight?: { kerb: number; massInService: number };
  economyMpg?: number;
}
export type Finding = {
  label: string;
  text: string;
  source: 'fictional-mot' | 'seller-claim' | 'estimate' | 'not-checked';
};
export interface MotRecord {
  date: string;
  mileage: number | null;
  expiry: string | null;
  result?: 'pass' | 'fail';
  annotations?: { type: string; text: string }[];
}
export interface HistoryEvent {
  date: string;
  title: string;
  text: string;
  significant?: boolean;
  mot?: MotRecord;
  result?: 'pass' | 'fail';
  annotationCount?: number;
}
export interface BuyingReport {
  registration?: string;
  financeRecords?: {
    agreementDate?: string;
    agreementType?: string;
    termMonths?: number;
    company?: string;
    contactNumber?: string;
    vehicleDescription?: string;
  }[];
  ev?: {
    generatedAt?: string;
    totalCapacityKwh?: number;
    usableCapacityKwh?: number;
    consumptionWhMile?: number;
    rangeMiles?: number;
    maxChargeKw?: number;
    batteryWarrantyMonths?: number;
    batteryWarrantyMiles?: number;
    healthStatus: 'not-tested';
    superchargerCompatible?: boolean;
    ports: {
      type: string;
      location?: string;
      maxKw?: number;
      times: { powerKw: number; minutes: number }[];
    }[];
  };
  historyEvents?: HistoryEvent[];
  motStatus?: {
    status: 'valid' | 'expired' | 'failed' | 'exempt' | 'unavailable';
    expiry?: string;
    source: 'supplier' | 'derived';
  };
  tax?: {
    status?: 'taxed' | 'untaxed' | 'sorn' | 'exempt' | 'unavailable';
    dueDate?: string;
    date?: string;
    co2?: number;
    band?: string;
    rates: { label: string; amount: number }[];
  };
  buyerInputs?: { mileage: number | null; askingPrice: number | null };
  detail?: VehicleDetail;
  historyNote?: string;
  missingData?: string;

  kind: 'fictional-sample' | 'sandbox-example';
  evidence?: {
    mot: MotRecord[];
    valuation?: { mileage: number; date: string; figures: { label: string; value: number }[] };
    tyres: { axle: string; size: string; rating: string; runFlat?: boolean; pressure?: string }[];
    notes: string[];
  };
  vehicle: { name: string; year: number; mileage: number | null; askingPrice: number | null };
  findings: Finding[];
  checks: {
    name: 'Finance' | 'Stolen status' | 'Insurance write-off';
    status: 'not-checked' | 'record-returned' | 'none-returned';
  }[];
  costs: { label: string; annualPounds: number; assumption: string }[];
  sellerQuestions: string[];
}
