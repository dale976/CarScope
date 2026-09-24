import {selectedModels} from './catalogue';
/** Independently authored suggestions, never stored provider responses.
 * Exact aliases are a starting vocabulary, not a claim of exhaustive coverage. */
const models:Record<string,string[]>={
 Porsche:['911','718','Cayman','Boxster','Panamera','Macan','Cayenne','Taycan','Carrera GT','918'],
 Lotus:['Elise','Exige','Evora','Emira','Eletre','Emeya'],
 'Aston Martin':['Vantage','DB9','DB11','DB12','DBS','DBX','Vanquish','Rapide'],
 Ferrari:['360','430','458','488','F8','296','812','Roma','California','Portofino','SF90','Purosangue'],
 McLaren:['570S','600LT','650S','675LT','720S','750S','765LT','Artura','GT','GTS'],
 Lamborghini:['Gallardo','Huracan','Aventador','Revuelto','Urus'],
 Bentley:['Continental','Flying Spur','Bentayga','Mulsanne'],
 'Rolls-Royce':['Ghost','Wraith','Dawn','Phantom','Cullinan','Spectre'],
 Audi:['R8','RS3','RS4','RS5','RS6','RS7','RS Q3','RS Q8','RS e-tron GT'],
 Ford:['Mustang','GT','RS200'],
};
const families:Record<string,Record<string,string[]>>={
 'Porsche/911':{
  Carrera:['Carrera','Carrera 4'], 'Carrera S':['Carrera S','Carrera 4S','Carrera 4 S'],
  'Carrera T':['Carrera T'], GTS:['GTS','Carrera GTS','Carrera 4 GTS','Targa 4 GTS'],
  Turbo:['Turbo'], 'Turbo S':['Turbo S'], GT3:['GT3','GT3 Touring'],
  'GT3 RS':['GT3 RS'], GT2:['GT2'], 'GT2 RS':['GT2 RS'],
 },
 'Porsche/Cayman':{S:['S'],GTS:['GTS','GTS 4.0'],GT4:['GT4'],'GT4 RS':['GT4 RS']},
 'Porsche/Boxster':{S:['S'],GTS:['GTS','GTS 4.0'],Spyder:['Spyder'],'Spyder RS':['Spyder RS']},
 'Porsche/718':{Cayman:['Cayman'],'Cayman S':['Cayman S'],GTS:['Cayman GTS','Boxster GTS','Cayman GTS 4.0','Boxster GTS 4.0'],GT4:['Cayman GT4','GT4'],'GT4 RS':['Cayman GT4 RS','GT4 RS'],Spyder:['Spyder','Boxster Spyder']},
 'Lotus/Exige':{'Sport 350':['Sport 350'],'Sport 380':['Sport 380'],'Sport 410':['Sport 410'],'Cup 430':['Cup 430']},
 'Lotus/Evora':{S:['S'],'400':['400'],'Sport 410':['Sport 410'],'GT410 Sport':['GT410 Sport'],'GT430':['GT430']},
 'Lotus/Emira':{'V6':['V6','V6 First Edition'],'Turbo':['Turbo','I4','I4 First Edition']},
 'BMW/M2':{Competition:['Competition'],CS:['CS']},
 'BMW/M3':{Competition:['Competition','Competition M xDrive'],CS:['CS'],Touring:['Competition M xDrive Touring']},
 'BMW/M4':{Competition:['Competition','Competition M xDrive'],CS:['CS'],CSL:['CSL'],GTS:['GTS']},
 'Audi/R8':{'V8':['V8'],'V10':['V10','V10 Plus','V10 Performance','V10 Performance Quattro']},
 'Alpine/A110':{S:['S'],GT:['GT'],R:['R','R Turini']},
 'Toyota/Supra':{'GR':['GR','GR Pro'],'RZ':['RZ']},
};
export function searchModels(make:string){return models[make]??(selectedModels[make]??[]).filter(m=>!m.endsWith(' models'));}
export function searchDerivatives(make:string,model:string){
 const key=Object.keys(families).find(k=>k.toLowerCase()===`${make.trim()}/${model.trim()}`.toLowerCase());
 return Object.entries(key?families[key]!:{}).map(([label,bases])=>({label,variants:[...new Set(bases.flatMap(v=>[v,`${v} Manual`,`${v} Auto`,`${v} Automatic`,`${v} Semi-auto`,`${v} PDK`]))]}));
}
export const LIVE_PAGE_SIZE=50;
export const specChoices=(make:string)=>['Air conditioning','Carbon seats','Full service history',...(make==='Porsche'?['Sport Chrono','Ceramic brakes']:[])];
