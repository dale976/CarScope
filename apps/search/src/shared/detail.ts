import {preferenceGroups} from './preferences';
import {extractSpecEvidence,assessEvidence} from './specification';
import type {Listing} from './listing';
import type {DetailResult} from './types';
export interface PriceObservation {date:string;price:number;label:string}
export interface DetailVehicle {
 id:string;make:string;model:string;trim:string;year:number|null;price:number|null;mileage:number|null;daysOnMarket:number|null;
 transmission:string;location:string;seller:string;description:string;features:string[];options:string[];history:PriceObservation[];
 url?:string|null;referencePrice?:number|null;referenceDate?:string|null;
}
export interface DetailData {car:DetailVehicle;comparables:DetailVehicle[];source:'live'|'fictional'|'imported';asOf:string|null;limitedHistory:boolean;comparisonScope:string}
export function liveDetailData(car:Listing,results:Listing[],source:'live'|'fictional'='live'):DetailData{
 const history:PriceObservation[]=[];
 if(car.referencePrice!==null&&car.referenceDate&&(!car.observedDate||car.referenceDate<=car.observedDate))history.push({date:car.referenceDate,price:car.referencePrice,label:'Previous reference price'});
 if(car.price!==null&&car.observedDate)history.push({date:car.observedDate,price:car.price,label:'Latest observed asking price'});
 const seen=new Set([car.id]);
 const comparables=results.filter(c=>{if(seen.has(c.id)||c.make.toLowerCase()!==car.make.toLowerCase()||c.model.toLowerCase()!==car.model.toLowerCase())return false;seen.add(c.id);return true;})
 .sort((a,b)=>(a.mileage===null||car.mileage===null?Infinity:Math.abs(a.mileage-car.mileage))-(b.mileage===null||car.mileage===null?Infinity:Math.abs(b.mileage-car.mileage)))
 .slice(0,4).map(c=>({...c,history:[]}));
 return {car:{...car,history},comparables,source,asOf:car.observedDate,limitedHistory:true,comparisonScope:source==='fictional'?'Fictional search batch':'Current search batch'};
}
export function demoDetailData(data:DetailResult):DetailData{
 const adapt=(c:DetailResult['car']):DetailVehicle=>({...c,options:[],history:c.history.map((h,i)=>({...h,label:i===0?'First recorded asking price':'Recorded asking price'}))});
 return {car:adapt(data.car),comparables:data.comparables.map(adapt),source:data.source,asOf:data.asOf,limitedHistory:false,comparisonScope:'Local dataset'};
}
export function equipmentSections(features:string[],options:string[]){
 const unique=(items:string[])=>{const seen=new Set<string>();return items.map(s=>s.trim()).filter(s=>{const key=s.toLowerCase();if(!s||seen.has(key))return false;seen.add(key);return true;});};
 const listed=unique(options),keys=new Set(listed.map(s=>s.toLowerCase()));
 return {options:listed,other:unique(features).filter(s=>!keys.has(s.toLowerCase()))};
}

/** Presentation highlights only: never a claim that equipment is optional or rare. */
export function equipmentHighlights(features:string[],options:string[]){
 const sections=equipmentSections(features,options);
 const labels=[...preferenceGroups.Seats,...preferenceGroups.Driving,...preferenceGroups.Technology,...preferenceGroups.Appearance,'Sport Chrono'];
 const highlights=sections.options.slice(0,4).map(text=>({text,option:true}));
 const notable=sections.other.filter(text=>labels.some(label=>assessEvidence(extractSpecEvidence({features:[text],options:[],description:''},label))==='Advertised'));
 return [...highlights,...notable.slice(0,6-highlights.length).map(text=>({text,option:false}))];
}
