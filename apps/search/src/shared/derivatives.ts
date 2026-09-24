export interface DerivativeChoice {value:string;count:number}
export function derivativeFamily(make:string,model:string,value:string){
 const cleaned=value.replace(/\b(semi[- ]?auto(?:matic)?|automatic|manual|auto)\b/gi,'').replace(/\s+/g,' ').trim();
 if(make.toLowerCase()==='porsche'&&model==='911'){
  if(/\bgt3\s*rs\b/i.test(cleaned))return 'GT3 RS';
  if(/\bgt3\b/i.test(cleaned))return 'GT3';
  if(/\bgt2\s*rs\b/i.test(cleaned))return 'GT2 RS';
  if(/\bgt2\b/i.test(cleaned))return 'GT2';
  if(/\bgts\b/i.test(cleaned))return 'GTS';
  if(/\bturbo\s+s\b/i.test(cleaned))return 'Turbo S';
  if(/\bturbo\b/i.test(cleaned))return 'Turbo';
  if(/\bcarrera\s+(?:4\s*)?s\b/i.test(cleaned))return 'Carrera S';
  if(/\bcarrera\s+t\b/i.test(cleaned))return 'Carrera T';
  if(/^carrera(?:\s+4)?$/i.test(cleaned))return 'Carrera';
 }
 // Unrecognized designations remain separate; don't guess abbreviations or remove drivetrain/body style.
 return cleaned||value;
}
export function groupDerivatives(make:string,model:string,choices:DerivativeChoice[]){
 const groups=new Map<string,DerivativeChoice[]>();
 for(const choice of choices){const label=derivativeFamily(make,model,choice.value);const group=groups.get(label)??[];if(!group.some(c=>c.value===choice.value))group.push(choice);groups.set(label,group);}
 return [...groups].map(([label,variants])=>({label,variants})).sort((a,b)=>a.label.localeCompare(b.label));
}
