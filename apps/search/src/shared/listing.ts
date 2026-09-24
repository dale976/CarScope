const text=(v:unknown)=>typeof v==='string'?v:'';
const number=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
function safeLink(value:unknown){try{const u=new URL(text(value));return u.protocol==='https:'&&!u.username&&!u.password&&!u.searchParams.has('api_key')&&!/marketcheck/i.test(u.hostname)?u.href:null;}catch{return null;}}
function date(value:unknown){if(typeof value!=='number'||!Number.isFinite(value)||value<=0)return null;const d=new Date(value*1000);return Number.isFinite(d.getTime())&&d.getUTCFullYear()>=1900&&d.getUTCFullYear()<=2100?d.toISOString().slice(0,10):null;}
export function projectListing(v:any){
 if(!v||typeof v.id!=='string'||!v.build)throw Error('Invalid listing');
 return {id:v.id,make:text(v.build.make),model:text(v.build.model),trim:text(v.build.variant)||text(v.build.trim),year:number(v.build.year),price:number(v.price),referencePrice:number(v.ref_price),referenceDate:date(v.ref_price_dt),observedDate:date(v.last_seen_at),mileage:number(v.miles),daysOnMarket:number(v.dom_active),transmission:text(v.build.transmission),seller:text(v.dealer?.name),location:text(v.car_location?.city)||text(v.dealer?.city),url:safeLink(v.vdp_url),photo:(Array.isArray(v.media?.photo_links)?v.media.photo_links:[]).map(safeLink).find(Boolean)??null,features:(Array.isArray(v.extra?.features)?v.extra.features:[]).filter((f:unknown)=>typeof f==='string').slice(0,150),options:(Array.isArray(v.extra?.options)?v.extra.options:[]).filter((f:unknown)=>typeof f==='string').slice(0,150),description:text(v.extra?.seller_comments).slice(0,20000)};
}

export type Listing=ReturnType<typeof projectListing>;
