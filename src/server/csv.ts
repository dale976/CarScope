import {eligible} from '../shared/catalogue';
import {validateDataset} from './data';
import type {Dataset} from '../shared/types';
/** RFC-style quoted fields, including embedded newlines and escaped quotes. */
export function parseCsv(text:string):Record<string,string>[] {
 const rows:string[][]=[];let row:string[]=[];let field='';let quoted=false;let closed=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){
  const c=text[i]!;
  if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
  if(c==='"'){if(field||closed)throw new Error('Unexpected CSV quote');quoted=true;continue;}
  if(c===','||c==='\n'||c==='\r'){
   row.push(field);field='';closed=false;
   if(c!==','){if(c==='\r'&&text[i+1]==='\n')i++;if(row.some(v=>v!==''))rows.push(row);row=[];}continue;
  }
  if(closed)throw new Error('Unexpected characters after CSV quote');field+=c;
 }
 if(quoted)throw new Error('Unclosed CSV quote');
 if(field||row.length||closed){row.push(field);rows.push(row);}
 const headers=rows.shift();if(!headers?.length||new Set(headers).size!==headers.length)throw new Error('Missing or duplicate CSV headers');
 return rows.map((r,i)=>{if(r.length!==headers.length)throw new Error(`CSV row ${i+2} has the wrong column count`);return Object.fromEntries(headers.map((h,j)=>[h,r[j]!]));});
}

export function importPrestigeCsv(text:string):Dataset {
 const rows=parseCsv(text).filter(r=>eligible({make:r.make??'',model:r.model??'',trim:r.variant??''}));
 if(!rows.length)throw new Error('No eligible enthusiast cars found');
 const required=(r:Record<string,string>,k:string)=>{const value=r[k]?.trim();if(!value)throw new Error(`Missing ${k} for ${r.id??'listing'}`);return value;};
 const numeric=(r:Record<string,string>,k:string)=>{const value=required(r,k);if(!/^\d+$/.test(value))throw new Error(`Invalid ${k} for ${r.id}`);return Number(value);};
 const dates=rows.map(r=>required(r,'status_date').slice(0,10));
 // This fixture represents one snapshot. Do not merge days from different snapshots.
 if(new Set(dates).size!==1)throw new Error('Selected rows must share one snapshot date');
 const asOf=dates[0]!;
 return validateDataset({asOf,source:'imported',cars:rows.map(r=>{
  const price=numeric(r,'price');
  const features=(r.features??'').split('|').map(f=>f.trim()).filter(Boolean);
  if(features.some(f=>/\bair[- ]conditioning\b/i.test(f)))features.push('Air conditioning');
  return {id:required(r,'id'),make:required(r,'make'),model:required(r,'model'),trim:r.variant?.trim()||'Unspecified',
   year:numeric(r,'year'),price,mileage:numeric(r,'miles'),daysOnMarket:numeric(r,'dom_active'),
   color:'#9ba8a0',paint:r.exterior_color?.trim()||'Unspecified',transmission:r.transmission?.trim()||'Unspecified',
   fuel:r.fuel_type?.trim()||'Unspecified',location:r.city?.trim()||'Unspecified',seller:r.seller_name?.trim()||'Unspecified',
   description:`Historical supplier sample dated ${asOf}. Availability has not been checked. Illustration colour is generic. Equipment is listing text, not independently verified factory specification.`,
   features:[...new Set(features)],history:[{date:asOf,price}]};
 })});
}
