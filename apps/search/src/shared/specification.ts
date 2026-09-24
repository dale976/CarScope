export interface SpecEvidence {
  source: 'Features list' | 'Seller description' | 'Options list';
  claim: 'present' | 'absent' | 'unconfirmed';
  text: string;
}
export function assessEvidence(evidence: SpecEvidence[]) {
  if (!evidence.length) return 'Unknown';
  const claims = new Set(evidence.map(e => e.claim));
  if (claims.has('unconfirmed') || (claims.has('present') && claims.has('absent'))) return 'Needs confirmation';
  return claims.has('present') ? 'Advertised' : 'Advertised absent';
}

export interface ListingSpecSource {features:string[];options:string[];description:string}
const aliases:Record<string,string>={
 'Bucket seats':'bucket seats?',
 'Heated seats':'heated (?:front |rear |front and rear )?seats?',
 'Ventilated seats':'(?:ventilated|cooled) (?:front )?seats?',
 'Manual gearbox':'manual (?:gearbox|transmission)',
 'Limited-slip differential':'limited[- ]slip differential|lsd',
 'Sports suspension':'sports? suspension',
 'Front axle lift':'front[- ]axle lift|front[- ]end lift|nose lift',
 'Cruise control':'(?:adaptive )?cruise control',
 'Heated steering wheel':'heated steering wheel',
 'Reversing camera':'reversing camera|rear[- ]view camera|rear camera',
 'Parking sensors':'parking sensors?',
 'Upgraded audio':'premium (?:audio|sound)|bose|burmester|harman kardon|bang (?:&|and) olufsen',
 'Head-up display':'head[- ]up display|heads[- ]up display',
 'Special paint':'paint to sample|(?:bmw individual|audi exclusive|designo) paint|special (?:order )?paint',
 'Carbon exterior trim':'carbon(?:[- ]fibre|[- ]fiber)? (?:exterior (?:trim|pack(?:age)?)|mirror caps|rear spoiler|front splitter)',

 'Air conditioning':'air[- ]conditioning|air[- ]con|climate control',
 'Carbon seats':'carbon(?:[- ]fibre|[- ]fiber)?(?:[- ]backed)?(?: bucket)? seats?',
 'Full service history':'full (?:dealer |main dealer |porsche )?service history|\\bfsh\\b',
 'Sport Chrono':'sport[- ]chrono(?: package)?',
 'Ceramic brakes':'pccb|(?:porsche )?ceramic(?: composite)? brakes?|carbon[- ]ceramic brakes?',
};
const normalizeWording=(text:string)=>text.normalize('NFKC').replace(/[\u2010-\u2015\u2212]/g,'-').replace(/\s+/g,' ').trim();
const aliasKey=(text:string)=>normalizeWording(text).toLowerCase();
const normalizedAliases=Object.fromEntries(Object.entries(aliases).map(([key,value])=>[aliasKey(key),value]));
/** Conservative rule-based advert evidence, not factory verification or a general language parser. */
export function extractSpecEvidence(input:ListingSpecSource,label:string):SpecEvidence[]{
 const normalized=normalizeWording(label);if(!normalized||normalized.length>80)return [];
 const pattern=normalizedAliases[aliasKey(normalized)]??normalized.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const mention=new RegExp(`\\b(?:${pattern})\\b`,'i');
 const absent=new RegExp(`(?:\\bwithout\\s+(?:the\\s+)?(?:${pattern})\\b|\\b(?:${pattern})\\s+(?:(?:is|are)\\s+)?(?:not fitted|not included|absent)\\b)`,'i');
 const uncertain=/\b(optional|available|extra cost|retrofit|removed|previously|formerly|may|might|could|perhaps|confirm|not|no|without|excluding|delete|deleted|lack|lacks|missing|never)\b|\?/i;
 const positive=/\b(equipped with|fitted with|features|includes|has|comes with)\b|\bfitted\b/i;
 const result:SpecEvidence[]=[];
 function inspect(text:string,source:SpecEvidence['source']){
  const wording=normalizeWording(text);
  if(!mention.test(wording))return;
  const claim:SpecEvidence['claim']=source==='Options list'?'unconfirmed':absent.test(wording)?'absent':uncertain.test(wording)?'unconfirmed':source==='Features list'||positive.test(wording)?'present':'unconfirmed';
  if(!result.some(e=>e.source===source&&e.text===text))result.push({source,claim,text});
 }
 input.features.forEach(v=>inspect(v,'Features list'));
 input.options.forEach(v=>inspect(v,'Options list'));
 // Keep sentence punctuation and exact words so the user can judge the evidence.
 const sentences=input.description.match(/[^.!?\n]+[.!?]?/g)??[];
 sentences.forEach(v=>inspect(v.trim(),'Seller description'));
 return result;
}
