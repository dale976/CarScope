import {readBudget,reserveSearchCall} from './budget';
import {catalogueMakes,eligible} from '../shared/catalogue';
const text=(v:unknown)=>typeof v==='string'?v:'';
const number=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
function safeLink(value:unknown){try{const u=new URL(text(value));return u.protocol==='https:'&&!u.username&&!u.password&&!u.searchParams.has('api_key')&&!/marketcheck/i.test(u.hostname)?u.href:null;}catch{return null;}}
export function projectListing(v:any){
 if(!v||typeof v.id!=='string'||!v.build)throw Error('Invalid listing');
 return {id:v.id,make:text(v.build.make),model:text(v.build.model),trim:text(v.build.variant)||text(v.build.trim),year:number(v.build.year),price:number(v.price),mileage:number(v.miles),daysOnMarket:number(v.dom_active),transmission:text(v.build.transmission),seller:text(v.dealer?.name),location:text(v.car_location?.city)||text(v.dealer?.city),url:safeLink(v.vdp_url),photo:(Array.isArray(v.media?.photo_links)?v.media.photo_links:[]).map(safeLink).find(Boolean)??null,features:(Array.isArray(v.extra?.features)?v.extra.features:[]).filter((f:unknown)=>typeof f==='string').slice(0,150),options:(Array.isArray(v.extra?.options)?v.extra.options:[]).filter((f:unknown)=>typeof f==='string').slice(0,150),description:text(v.extra?.seller_comments).slice(0,20000)};
}
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
  upstream.searchParams.set('make',body.make);upstream.searchParams.set('model',body.model.trim());upstream.searchParams.set('rows','10');upstream.searchParams.set('start',String((body.page??0)*10));if(body.transmission)upstream.searchParams.set('transmission',body.transmission);
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
