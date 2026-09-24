import type {BuyingReport,MotRecord} from '../shared/report';
import {projectReportPreview,type VehiclePreview} from '../shared/preview';

const ENDPOINT='https://uk.api.vehicledataglobal.com/r2/lookup';
const PACKAGES=['VehicleDetailsWithImage','VDICheck','ValuationDetails','TyreDetails'] as const;
const COMPLETION_PACKAGES=['VDICheck','ValuationDetails','TyreDetails'] as const;
type PackageName=typeof PACKAGES[number];
type Json=Record<string,any>;
export type ProviderVehicleDetails=Json;
export type Fetcher=(input:RequestInfo|URL,init?:RequestInit)=>Promise<Response>;

export function validateSandboxRegistration(value:string){
 const registration=value.toUpperCase().replace(/\s/g,'');
 if(!/^[A-Z0-9]{2,8}$/.test(registration))throw new Error('Enter a valid UK registration.');
 if(!registration.includes('A'))throw new Error('The development service can only search registrations containing the letter A.');
 return registration;
}

function responseSucceeded(value:Json){
 const info=value.ResponseInformation;
 return (!info||info.IsSuccessStatusCode!==false)&&value.Results;
}

async function requestPackage(packageName:PackageName,registration:string,apiKey:string,fetcher:Fetcher){
 const url=new URL(ENDPOINT);
 url.searchParams.set('packagename',packageName);url.searchParams.set('apikey',apiKey);url.searchParams.set('vrm',registration);
 const response=await fetcher(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(20_000)});
 if(!response.ok)throw new Error(`${packageName} returned HTTP ${response.status}`);
 const body=await response.json() as Json;
 if(!responseSucceeded(body))throw new Error(`${packageName} returned no usable results`);
 return body.Results as Json;
}

const day=(value:unknown)=>typeof value==='string'&&value.length>=10?value.slice(0,10):undefined;
const number=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?value:undefined;
const list=(value:unknown):Json[]=>Array.isArray(value)?value:[];
const title=(value:unknown)=>typeof value==='string'?value.toLowerCase().replace(/(^|\s)\S/g,c=>c.toUpperCase()):undefined;
const vehicleTitle=(value:unknown)=>{
 const formatted=title(value);if(!formatted)return undefined;
 return formatted.replace(/\b(amg|gts?|gt3|gt4|rs|srt|nsx|rx-7|lfa|rc-f|m40i|[0-9]+d)\b/gi,token=>token.toUpperCase());
};

function normaliseTaxStatus(value:unknown):NonNullable<BuyingReport['tax']>['status']{
 if(typeof value!=='string')return undefined;
 const status=value.trim().toLowerCase();
 if(status==='sorn')return 'sorn';
 if(status.includes('not taxed')||status==='untaxed')return 'untaxed';
 if(status.includes('exempt'))return 'exempt';
 if(status.includes('taxed'))return 'taxed';
 return 'unavailable';
}

function normaliseMotStatus(value:unknown,mot:MotRecord[],asOf:string|undefined):BuyingReport['motStatus']{
 const latest=[...mot].sort((a,b)=>b.date.localeCompare(a.date))[0];
 const raw=typeof value==='string'?value.trim().toLowerCase():'';
 const expiry=latest?.expiry??undefined;
 if(raw.includes('exempt'))return {status:'exempt',source:'supplier'};
 if(raw==='valid'||raw.includes('mot valid'))return {status:'valid',expiry,source:'supplier'};
 if(raw&&raw!=='no details held by dvla'&&raw!=='no results returned')return {status:latest?.result==='fail'?'failed':'expired',expiry,source:'supplier'};
 if(!latest)return {status:'unavailable',source:'derived'};
 if(latest.result==='fail')return {status:'failed',source:'derived'};
 if(latest.result==='pass'&&expiry){
  const reference=asOf&&Number.isFinite(Date.parse(asOf))?Date.parse(asOf):Date.now();
  return {status:Date.parse(expiry+'T23:59:59Z')>=reference?'valid':'expired',expiry,source:'derived'};
 }
 return {status:'unavailable',source:'derived'};
}

function normaliseTyres(result:Json|undefined){
 const fitments=list(result?.TyreDetails?.TyreDetailsList);
 const standard=fitments.filter(item=>item.IsStandardFitmentForVehicle===true);
 const selected=standard.length?standard:fitments.slice(0,1);
 return selected.flatMap((fitment,index)=>['Front','Rear'].flatMap(axle=>{
  const tyre=fitment[axle]?.Tyre;if(!tyre?.SizeDescription)return [];
  const pressure=tyre.Pressure?.TyrePressure??{};
  const pressureText=[number(pressure.Psi)!==undefined?`${pressure.Psi} psi`:undefined,number(pressure.Bar)!==undefined?`${pressure.Bar} bar`:undefined].filter(Boolean).join(' / ')||undefined;
  return [{axle:selected.length>1?`${axle} · fitment ${index+1}`:axle,size:String(tyre.SizeDescription),rating:[tyre.LoadIndex,tyre.SpeedIndex].filter(Boolean).join('')||'Rating unavailable',runFlat:typeof tyre.IsRunFlat==='boolean'?tyre.IsRunFlat:undefined,pressure:pressureText}];
 }));
}

function normaliseEv(powertrain:Json){
 const source=powertrain.EvDetails;if(!source)return undefined;
 const technical=source.TechnicalDetails??{};const performance=source.Performance??{};
 const battery=list(technical.BatteryDetailsList)[0]??{};
 const ports=list(technical.ChargePortDetailsList).filter(port=>port.IsStandardChargePort!==false).flatMap(port=>{
  if(!port.PortType)return [];
  const times=list(port.ChargeTimes?.AverageChargeTimes10To80Percent).flatMap(item=>number(item.ChargePortKw)!==undefined&&number(item.TimeInMinutes)!==undefined?[{powerKw:item.ChargePortKw,minutes:item.TimeInMinutes}]:[]);
  return [{type:String(port.PortType),location:port.LocationOnVehicle?String(port.LocationOnVehicle):undefined,maxKw:number(port.MaxChargePowerKw),times}];
 });
 return {generatedAt:day(source.GeneratedAt),totalCapacityKwh:number(battery.TotalCapacityKwh),usableCapacityKwh:number(battery.UsableCapacityKwh),consumptionWhMile:number(performance.WhMile),rangeMiles:number(performance.RangeFigures?.ZeroEmissionMiles),maxChargeKw:number(performance.MaxChargeInputPowerKw),batteryWarrantyMonths:number(battery.ManufacturerWarrantyMonths),batteryWarrantyMiles:number(battery.ManufacturerWarrantyMiles),healthStatus:'not-tested' as const,superchargerCompatible:typeof technical.IsTeslaSuperchargerCompatible==='boolean'?technical.IsTeslaSuperchargerCompatible:undefined,ports};
}

function normalise(registration:string,details:Json,vdi:Json|undefined,valuation:Json|undefined,tyreDetails:Json|undefined,missing:string[]):BuyingReport{
 const vehicle=details.VehicleDetails??{};const identification=vehicle.VehicleIdentification??{};
 const model=details.ModelDetails??{};const modelId=model.ModelIdentification??{};const history=vehicle.VehicleHistory??{};
 const performance=model.Performance??{};const powertrain=model.Powertrain??{};const technical=vehicle.DvlaTechnicalDetails??{};
 const motSource=vdi?.MotHistoryDetails??{};
 const mot:MotRecord[]=list(motSource.MotTestDetailsList).map(test=>({
  date:test.TestDate,mileage:test.OdometerUnit==='mi'&&/^\d+$/.test(String(test.OdometerReading))?Number(test.OdometerReading):null,
  expiry:day(test.ExpiryDate)??null,result:typeof test.TestPassed==='boolean'?(test.TestPassed?'pass' as const:'fail' as const):undefined,
  annotations:Array.isArray(test.AnnotationList)?test.AnnotationList.map((item:Json)=>({type:item.Type??'NOTE',text:item.Text??'Details unavailable'})):undefined
 })).filter(test=>typeof test.date==='string');
 const writeOffs=list(vdi?.MiaftrDetails?.WriteOffRecordList);
 const finance=list(vdi?.FinanceDetails?.FinanceRecordList);
 const images=list(details.VehicleImageDetails?.VehicleImageList);
 const latestMileage=[...mot].sort((a,b)=>b.date.localeCompare(a.date)).find(item=>item.mileage!==null)?.mileage??null;
 const vehicleName=[vehicleTitle(modelId.Make??identification.DvlaMake),vehicleTitle(modelId.Model??identification.DvlaModel)].filter(Boolean).join(' ');
 if(!vehicleName)throw new Error('Vehicle details did not identify the vehicle.');
 const colours=history.ColourDetails??{};const transmission=powertrain.Transmission??{};const ice=powertrain.IceDetails??{};
 const valuationData=valuation?.ValuationDetails;const figures=valuationData?.ValuationFigures;
 const valuationLabels:[string,string][]=[['Dealer forecourt','DealerForecourt'],['Private sale — clean','PrivateClean'],['Private sale — average','PrivateAverage'],['Part exchange','PartExchange'],['Auction','Auction']];
 const failed=mot.filter(item=>item.result==='fail');
 const dangerous=mot.flatMap(item=>(item.annotations??[]).filter(a=>a.type==='DANGEROUS').map(a=>({...a,date:item.date})));
 const statusSource=vdi?.VehicleTaxDetails??vehicle.VehicleTaxDetails??vehicle.VehicleStatus??{};
 const tax=statusSource.VehicleExciseDutyDetails??vehicle.VehicleStatus?.VehicleExciseDutyDetails;const standard=number(tax?.VedRate?.Standard?.TwelveMonths);
 const generated=day(statusSource.GeneratedAt??vehicle.GeneratedAt);
 const taxStatus=normaliseTaxStatus(statusSource.TaxStatus);
 const taxDueDate=day(statusSource.TaxDueDate);
 const motStatus=normaliseMotStatus(statusSource.MotStatus,mot,generated);
 const tyres=normaliseTyres(tyreDetails);
 const ev=normaliseEv(powertrain);
 const evidenceNotes=[...missing];
 if(tyreDetails&&tyres.length===0)evidenceNotes.push('TyreDetails returned no usable fitment for this report.');
 return {
  registration,
  financeRecords:finance.map(record=>({agreementDate:day(record.AgreementDate),agreementType:title(record.AgreementType),termMonths:number(record.AgreementTerm),company:title(record.FinanceCompany),contactNumber:record.ContactNumber,vehicleDescription:title(record.VehicleDescription)})),
  ev,
  kind:'sandbox-example',vehicle:{name:vehicleName,year:number(identification.YearOfManufacture)??(Number(day(identification.DateFirstRegistered)?.slice(0,4))||0),mileage:latestMileage,askingPrice:null},
  detail:{registered:day(identification.DateFirstRegistered)??day(identification.DateFirstRegisteredInUk)??'',keepers:list(history.KeeperChangeList).flatMap(k=>day(k.KeeperStartDate)?[{date:day(k.KeeperStartDate)!,previous:Number(k.NumberOfPreviousKeepers)}]:[]),colour:title(colours.CurrentColour),originalColour:title(colours.OriginalColour),colourChanges:number(colours.NumberOfColourChanges),image:images[0]?.ImageUrl?{url:images[0].ImageUrl,expires:images[0].ExpiryDate,source:'supplier'}:undefined,engine:[number(ice.EngineCapacityLitres)?`${ice.EngineCapacityLitres}-litre`:undefined,powertrain.FuelType??identification.DvlaFuelType,ice.NumberOfCylinders?`${ice.NumberOfCylinders} cylinders`:undefined].filter(Boolean).join(' · ')||undefined,transmission:[transmission.NumberOfGears?`${transmission.NumberOfGears}-speed`:undefined,transmission.TransmissionType].filter(Boolean).join(' ')||undefined,powerBhp:number(performance.Power?.Bhp),torqueNm:number(performance.Torque?.Nm),zeroToSixty:number(performance.Statistics?.ZeroToSixtyMph),zeroToHundred:number(performance.Statistics?.ZeroToOneHundredKph),topSpeedMph:number(performance.Statistics?.MaxSpeedMph),dimensions:model.Dimensions?.LengthMm&&model.Dimensions?.WidthMm&&model.Dimensions?.HeightMm?{length:model.Dimensions.LengthMm,width:model.Dimensions.WidthMm,height:model.Dimensions.HeightMm}:undefined,seats:number(technical.NumberOfSeats)??number(model.BodyDetails?.NumberOfSeats),weight:model.Weights?.KerbWeightKg&&technical.MassInServiceKg?{kerb:model.Weights.KerbWeightKg,massInService:technical.MassInServiceKg}:undefined,economyMpg:number(performance.FuelEconomy?.CombinedMpg)},
  historyEvents:writeOffs.flatMap(record=>day(record.LossDate)?[{date:day(record.LossDate)!,title:`${record.Category?`Cat ${record.Category} `:''}write-off recorded`,text:`${record.Status??'Insurance loss record returned'}. Repair evidence and current condition are not established by this record.`,significant:true}]:[]),
  motStatus,
  tax:standard!==undefined||taxStatus!==undefined?{status:taxStatus,dueDate:taxDueDate,date:generated,co2:number(tax?.DvlaCo2??statusSource.DvlaCo2),band:tax?.DvlaBand??tax?.DvlaCo2Band??statusSource.DvlaBand,rates:standard!==undefined?[{label:'Standard annual rate',amount:standard}]:[]}:undefined,
  findings:[...(finance.length?[{label:'A finance record needs follow-up',text:'One or more finance records were returned. Confirm the current position and obtain evidence of settlement before purchase.',source:'not-checked' as const}]:[]),...(writeOffs.length?[{label:'An insurance write-off record was returned',text:'Review the category, repair evidence and present condition with an independent inspector.',source:'not-checked' as const}]:[]),...(failed.length?[{label:`${failed.length} failed MOT ${failed.length===1?'test was':'tests were'} returned`,text:'Review each failure with its later retest or repair evidence. A later pass does not erase the earlier finding.',source:'not-checked' as const}]:[]),...(dangerous.length?[{label:'Dangerous MOT defects appear in the history',text:'These findings are historical. Confirm the repairs and inspect the vehicle’s current condition.',source:'not-checked' as const}]:[]),...(!finance.length&&!writeOffs.length&&!failed.length?[{label:'No headline issue was identified in the supplied records',text:'Review the complete report and obtain current checks before relying on this result.',source:'not-checked' as const}]:[])].slice(0,3),
  checks:[{name:'Finance',status:vdi?(finance.length?'record-returned':'none-returned'):'not-checked'},{name:'Stolen status',status:vdi?(vdi.PncDetails?.IsStolen?'record-returned':'none-returned'):'not-checked'},{name:'Insurance write-off',status:vdi?(writeOffs.length?'record-returned':'none-returned'):'not-checked'}],
  costs:[],sellerQuestions:['Can I see the complete service history and supporting invoices?','Can I arrange an independent inspection before paying a deposit?',...(finance.length?['Can you provide the current finance status and evidence of settlement?']:[]),...(writeOffs.length?['Can I see the write-off repair photographs, invoices and inspection report?']:[]),...(failed.length?['What repairs followed the recorded MOT failures?']:[])],
  historyNote:'This report reflects the records returned by the supplier. It is not a current vehicle clearance and gaps do not establish that no events occurred.',
  missingData:'Equipment, insurance, servicing and replacement costs are not included unless explicitly shown.',
  evidence:{mot,valuation:valuationData&&figures?{mileage:Number(valuationData.ValuationMileage),date:day(valuationData.GeneratedAt??valuationData.ValuationTime)??'Date unavailable',figures:valuationLabels.flatMap(([label,key])=>number(figures[key])!==undefined?[{label,value:figures[key]}]:[])}:undefined,tyres,notes:['Supplier data may be up to 12 months out of date.','No raw provider response was retained.',...evidenceNotes]}
 };
}

export async function lookupSandboxReport(registrationInput:string,options:{apiKey:string;fetcher?:Fetcher}){
 const identified=await lookupSandboxPreview(registrationInput,options);
 return completeSandboxReport(identified.preview.registration,identified.details,options);
}

export async function lookupSandboxPreview(registrationInput:string,options:{apiKey:string;fetcher?:Fetcher}):Promise<{preview:Omit<VehiclePreview,'previewId'>;details:ProviderVehicleDetails}>{
 const registration=validateSandboxRegistration(registrationInput);const fetcher=options.fetcher??fetch;
 let details:Json;
 try {details=await requestPackage('VehicleDetailsWithImage',registration,options.apiKey,fetcher);}
 catch {throw new Error('The development service could not identify the vehicle because vehicle details were unavailable.');}
 const report=normalise(registration,details,undefined,undefined,undefined,[]);
 const {previewId:_,...preview}=projectReportPreview(report,'server-only','live');
 preview.coverage={message:'Detailed history is checked in the complete report'};
 return {preview,details};
}

export async function completeSandboxReport(registrationInput:string,details:ProviderVehicleDetails,options:{apiKey:string;fetcher?:Fetcher}){
 const registration=validateSandboxRegistration(registrationInput);const fetcher=options.fetcher??fetch;
 const settled=await Promise.allSettled(COMPLETION_PACKAGES.map(name=>requestPackage(name,registration,options.apiKey,fetcher)));
 const results=new Map<PackageName,Json>();const missing:string[]=[];
 settled.forEach((result,index)=>result.status==='fulfilled'?results.set(COMPLETION_PACKAGES[index]!,result.value):missing.push(`${COMPLETION_PACKAGES[index]} unavailable for this report.`));
 return normalise(registration,details,results.get('VDICheck'),results.get('ValuationDetails'),results.get('TyreDetails'),missing);
}
