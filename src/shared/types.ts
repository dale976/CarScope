export interface Car {
  id: string; make: string; model: string; trim: string; year: number;
  price: number; mileage: number; daysOnMarket: number; color: string; paint: string;
  transmission: string; location: string; fuel: string; seller: string; description: string;
  features: string[]; history: { date: string; price: number }[];
}
export interface Dataset { asOf: string; source: 'fictional' | 'imported'; cars: Car[] }
export interface Status { mode: 'mock' | 'cache'; asOf: string; source: Dataset['source']; liveRequestsEnabled: false }
export interface SearchResult { cars: Car[]; total: number; makes: string[]; features: string[]; asOf: string; source: Dataset['source'] }
export interface DetailResult { car: Car; comparables: Car[]; asOf: string; source: Dataset['source'] }
