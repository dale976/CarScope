import type {Dataset} from '../shared/types';
/** Documented subset used by the mock bridge; optional provider fields stay optional. */
export interface UKInventoryResponse {
 num_found:number;
 listings:Array<{
  id:string; price?:number; miles?:number; dom_active:number; exterior_color?:string;
  dealer?:{name:string;city?:string};
  build?:{year:number;make:string;model?:string;variant?:string;trim?:string;transmission?:string;fuel_type?:string};
 }>;
}
/** Synthetic fixtures only. This is not a live provider adapter. */
export function normalizeMockInventory(response:UKInventoryResponse, supplement: {asOf:string;source:string;cars:Dataset['cars']}):Dataset {
 if(supplement.source!=='fictional')throw new Error('Mock supplement must be fictional.');
 return {asOf:supplement.asOf,source:'fictional',cars:response.listings.map(listing=>{
  const extra=supplement.cars.find(c=>c.id===listing.id);
  const b=listing.build;
  if(!extra||listing.price==null||listing.miles==null||!b?.model||!b.transmission||!b.fuel_type)
   throw new Error(`Synthetic listing ${listing.id} lacks fields required by the current UI.`);
  return {...extra,id:listing.id,make:b.make,model:b.model,trim:b.variant??b.trim??'Unspecified',year:b.year,
   price:listing.price,mileage:listing.miles,daysOnMarket:listing.dom_active,
   paint:listing.exterior_color??'Unspecified',transmission:b.transmission,fuel:b.fuel_type,
   seller:listing.dealer?.name??'Unspecified',location:listing.dealer?.city??'Unspecified'};
 })};
}
