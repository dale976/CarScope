import type {BuyingReport} from './report';

export type DataMode='mock'|'live';
export type VehiclePreview={
 previewId:string;registration:string;source:DataMode;
 vehicle:{name:string;year:number|null;fuelType?:string;transmission?:string;colour?:string;image?:{url:string;expires?:string}};
 mot?:{status:'valid'|'expired'|'failed'|'exempt'|'unavailable';expiry?:string;sourceDate?:string};
 tax?:{status:'taxed'|'untaxed'|'sorn'|'exempt'|'unavailable';dueDate?:string;sourceDate?:string};
 coverage:{motRecordCount?:number;ukRecordStart?:string;message:string};
};

export function coverageForReport(report:BuyingReport):VehiclePreview['coverage'] {
 const count=report.evidence?.mot.length;
 const registered=report.detail?.registered;
 const registrationYear=registered?Number(registered.slice(0,4)):undefined;
 const imported=registrationYear!==undefined&&Number.isFinite(registrationYear)&&report.vehicle.year>0&&registrationYear-report.vehicle.year>1;
 if(count===undefined)return {message:'Detailed history is checked in the complete report'};
 if(count===0)return {motRecordCount:0,message:'No MOT tests returned'};
 if(imported)return {motRecordCount:count,ukRecordStart:registered,message:`${count} MOT ${count===1?'test':'tests'} returned since UK registration in ${registrationYear}`};
 return {motRecordCount:count,message:`${count} MOT ${count===1?'test':'tests'} returned`};
}

function fuelType(report:BuyingReport){
 const engine=report.detail?.engine;if(!engine)return undefined;
 for(const value of ['Electric','Petrol','Diesel','Hybrid','Hydrogen'])if(new RegExp(`\\b${value}\\b`,'i').test(engine))return value;
 return undefined;
}

export function projectReportPreview(report:BuyingReport,previewId:string,source:DataMode,_options:{asOf?:string}={}):VehiclePreview {
 if(!report.registration)throw new Error('The report does not identify a registration.');
 const taxStatus=report.tax?.status??'unavailable';
 return {
  previewId,registration:report.registration,source,
  vehicle:{name:report.vehicle.name,year:report.vehicle.year||null,fuelType:fuelType(report),transmission:report.detail?.transmission,colour:report.detail?.colour,image:report.detail?.image?{url:report.detail.image.url,expires:report.detail.image.expires}:undefined},
  mot:report.motStatus?{status:report.motStatus.status,expiry:report.motStatus.expiry}:undefined,
  tax:report.tax?{status:taxStatus,dueDate:report.tax.dueDate,sourceDate:report.tax.date}:undefined,
  coverage:coverageForReport(report)
 };
}
