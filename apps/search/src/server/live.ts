import {LIVE_PAGE_SIZE} from '../shared/search-catalogue';
import {readBudget,reserveSearchCall} from './budget';
import {catalogueMakes,eligible} from '../shared/catalogue';
import {projectListing} from '../shared/listing';
export {projectListing} from '../shared/listing';
const number=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
export function createLiveApi(deps={key:()=>Bun.env.MARKETCHECK_API_KEY,fetch:globalThis.fetch,reserve:reserveSearchCall,budget:readBudget}){
 return async(req:Request)=>{
 const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 const url=new URL(req.url);
 if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))return json({error:'Live preview is local-only.'},403);
 if(req.method==='GET'&&url.pathname==='/api/live/status'){
  try{return json({ready:!!deps.key(),budget:deps.budget()});}catch{return json({error:'Budget accounting unavailable; requests blocked.'},503);}
 }
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 if(req.headers.get('origin')!==url.origin||!req.headers.get('content-type')?.startsWith('application/json'))return json({error:'Same-origin JSON requests required.'},403);
 if(!['/api/live/search','/api/live/detail'].includes(url.pathname))return json({error:'Unknown endpoint'},404);
 const key=deps.key();if(!key)return json({error:'API key not configured.'},503);
 let body:any;try{body=await req.json();}catch{return json({error:'Invalid request'},400);}
 if(!body||typeof body!=='object')return json({error:'Invalid request'},400);
 const upstream=new URL('https://api.marketcheck.com/v2/search/car/uk/active');
 if(url.pathname.endsWith('/detail')){
  if(typeof body.id!=='string'||!/^[a-zA-Z0-9_-]{1,160}$/.test(body.id))return json({error:'Invalid listing ID'},400);
  upstream.pathname='/v2/listing/car/uk/'+encodeURIComponent(body.id);
 }else{
  if(!catalogueMakes.includes(body.make)||typeof body.model!=='string'||!body.model.trim()||body.model.length>80||!['','Manual','Automatic'].includes(body.transmission??'')||!Number.isSafeInteger(body.page??0)||(body.page??0)<0||(body.page??0)>10)return json({error:'Choose a make and model; page must be 0–10.'},400);
  const ranges: Record<string,number|undefined>={};
  for(const field of ['minYear','maxYear','maxPrice','maxMileage']){
   const raw=body[field];if(raw===undefined||raw==='')continue;
   if(typeof raw!=='string'||!/^\d+$/.test(raw)||!Number.isSafeInteger(Number(raw)))return json({error:'Limits must be whole numbers.'},400);
   const n=Number(raw);if((field.endsWith('Year')&&(n<1900||n>2100))||n<0)return json({error:'Invalid search limit.'},400);ranges[field]=n;
  }
  if((ranges.minYear??1900)>(ranges.maxYear??2100))return json({error:'Year from must not exceed year to.'},400);
  if(body.derivative!==undefined&&(typeof body.derivative!=='string'||body.derivative.length>16000||(body.derivative!==''&&body.derivative.split(',').some((v:string)=>!v.trim()||v.length>160))))return json({error:'Invalid derivative selection.'},400);
  if(body.derivative)upstream.searchParams.set('variant',body.derivative);
  if(ranges.minYear!==undefined||ranges.maxYear!==undefined)upstream.searchParams.set('year_range',`${ranges.minYear??1900}-${ranges.maxYear??2100}`);
  if(ranges.maxPrice!==undefined)upstream.searchParams.set('price_range',`0-${ranges.maxPrice}`);
  if(ranges.maxMileage!==undefined)upstream.searchParams.set('miles_range',`0-${ranges.maxMileage}`);
  upstream.searchParams.set('facets','variant|0|1000');
  upstream.searchParams.set('make',body.make);upstream.searchParams.set('model',body.model.trim());upstream.searchParams.set('rows',String(LIVE_PAGE_SIZE));upstream.searchParams.set('start',String((body.page??0)*LIVE_PAGE_SIZE));if(body.transmission)upstream.searchParams.set('transmission',body.transmission);
 }
 upstream.searchParams.set('api_key',key);
 try{deps.reserve();}catch{return json({error:'Budget exhausted or accounting unavailable; request blocked.'},503);}
 try{
  const r=await deps.fetch(upstream,{redirect:'error',signal:AbortSignal.timeout(15000),cache:'no-store'});
  if(!r.ok)return json({error:`Provider returned HTTP ${r.status}. No automatic retry; 2p reserved.`,budget:deps.budget()},502);
  const data=await r.json();
  if(url.pathname.endsWith('/detail'))return json({car:projectListing(data),budget:deps.budget()});
  if(!Array.isArray(data.listings))throw Error('Invalid response');
  const cars=data.listings.map(projectListing).filter((c:any)=>eligible(c));
  const derivatives=(Array.isArray(data.facets?.variant)?data.facets.variant:[]).filter((f:any)=>typeof f.item==='string'&&f.item.length<=160&&!f.item.includes(',')&&Number.isSafeInteger(f.count)&&f.count>=0).map((f:any)=>({value:f.item,count:f.count}));
  return json({cars,derivatives,total:number(data.num_found),budget:deps.budget(),page:body.page??0});
 }catch{return json({error:'Request failed or response was invalid. No automatic retry; 2p reserved.'},502);}
 };
}
