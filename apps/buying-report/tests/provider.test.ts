import {expect,test} from 'bun:test';
import {completeSandboxReport,lookupSandboxPreview,lookupSandboxReport,validateSandboxRegistration,type Fetcher} from '../src/server/provider';

const details={Results:{VehicleDetails:{GeneratedAt:'2026-09-20T01:00:00Z',VehicleIdentification:{DvlaMake:'FIAT',DvlaModel:'500 POP',YearOfManufacture:2010,DateFirstRegistered:'2010-09-10T00:00:00Z'},VehicleStatus:{VehicleExciseDutyDetails:{DvlaCo2:113,DvlaBand:'C',VedRate:{Standard:{TwelveMonths:35}}}},VehicleHistory:{ColourDetails:{CurrentColour:'WHITE',OriginalColour:'WHITE',NumberOfColourChanges:0},KeeperChangeList:[]},DvlaTechnicalDetails:{NumberOfSeats:4,MassInServiceKg:968}},ModelDetails:{ModelIdentification:{Make:'Fiat',Model:'500 Pop'},Dimensions:{LengthMm:3546,WidthMm:1627,HeightMm:1488},Weights:{KerbWeightKg:865},Powertrain:{FuelType:'Petrol',IceDetails:{EngineCapacityLitres:1.2,NumberOfCylinders:4,Aspiration:'Naturally Aspirated'},Transmission:{TransmissionType:'Manual',NumberOfGears:5}},Performance:{Power:{Bhp:69},Torque:{Nm:102},Statistics:{ZeroToOneHundredKph:12.9,MaxSpeedMph:99},FuelEconomy:{CombinedMpg:58.9}}},VehicleImageDetails:{VehicleImageList:[]}}};
const vdi={Results:{MotHistoryDetails:{MotTestDetailsList:[{TestDate:'2025-08-30T11:16:25Z',TestPassed:false,ExpiryDate:null,OdometerReading:'93574',OdometerUnit:'mi',AnnotationList:[{Type:'MAJOR',Text:'Suspension mounting corroded'}]}]},VehicleTaxDetails:{TaxStatus:'SORN',TaxIsCurrentlyValid:false,TaxDueDate:null,MotStatus:'Not valid'},PncDetails:{IsStolen:false,StatusCode:0},MiaftrDetails:{WriteOffRecordList:[]},FinanceDetails:{FinanceRecordList:[]}}};
const valuation={Results:{ValuationDetails:{ValuationMileage:105553,GeneratedAt:'2026-09-20T01:14:33Z',ValuationFigures:{DealerForecourt:2241,PrivateClean:1692,PrivateAverage:1573,PartExchange:1613,Auction:1237}}}};
const tyres={Results:{TyreDetails:{TyreDetailsList:[{IsStandardFitmentForVehicle:true,Front:{Tyre:{SizeDescription:'235/45R18',LoadIndex:'98',SpeedIndex:'Y',IsRunFlat:false,Pressure:{TyrePressure:{Bar:2.9,Psi:42}}}},Rear:{Tyre:{SizeDescription:'255/40R18',LoadIndex:'99',SpeedIndex:'Y',IsRunFlat:false,Pressure:{TyrePressure:{Bar:null,Psi:null}}}}},{IsStandardFitmentForVehicle:false,Front:{Tyre:{SizeDescription:'245/35R20',LoadIndex:'95',SpeedIndex:'Y',IsRunFlat:false}}}]}}};
const evDetails={Results:{...details.Results,ModelDetails:{...details.Results.ModelDetails,ModelIdentification:{Make:'Tesla',Model:'Model X 75D'},Powertrain:{PowertrainType:'BEV',FuelType:'Electric',IceDetails:null,Transmission:{TransmissionType:'Automatic',NumberOfGears:1},EvDetails:{TechnicalDetails:{IsTeslaSuperchargerCompatible:true,ChargePortDetailsList:[{PortType:'Type 2',LocationOnVehicle:'Left/Rear',MaxChargePowerKw:16.6,IsStandardChargePort:true,ChargeTimes:{AverageChargeTimes10To80Percent:[{ChargePortKw:2.3,TimeInMinutes:1957},{ChargePortKw:7.5,TimeInMinutes:600},{ChargePortKw:11,TimeInMinutes:409}]}},{PortType:'CCS',LocationOnVehicle:'Left/Rear',MaxChargePowerKw:142,IsStandardChargePort:true,ChargeTimes:{AverageChargeTimes10To80Percent:[{ChargePortKw:50,TimeInMinutes:140},{ChargePortKw:142,TimeInMinutes:49}]} }],BatteryDetailsList:[{TotalCapacityKwh:75,UsableCapacityKwh:72.5,Chemistry:'Lithium-Ion',ManufacturerWarrantyMonths:96,ManufacturerWarrantyMiles:150000}]},Performance:{MaxChargeInputPowerKw:142,WhMile:316,RangeFigures:{ZeroEmissionMiles:237}},GeneratedAt:'2025-04-16T10:45:36Z'}}}}};

test('sandbox registration validation normalises valid VRMs and enforces the provider restriction',()=>{
 expect(validateSandboxRegistration(' sl60 auc ')).toBe('SL60AUC');
 expect(()=>validateSandboxRegistration('DF74FPX')).toThrow('letter A');
 expect(()=>validateSandboxRegistration('../A')).toThrow('valid UK registration');
});

test('lookup requests four packages and normalises standard tyre fitment into one report',async()=>{
 const calls:string[]=[];
 const fetcher:Fetcher=async input=>{
  const url=new URL(String(input));const packageName=url.searchParams.get('packagename')!;calls.push(packageName);
  const body=packageName==='VehicleDetailsWithImage'?details:packageName==='VDICheck'?vdi:packageName==='ValuationDetails'?valuation:tyres;
  return Response.json(body);
 };
 const report=await lookupSandboxReport('SL60 AUC',{apiKey:'secret',fetcher});
 expect(report.registration).toBe('SL60AUC');
 expect(calls.sort()).toEqual(['TyreDetails','VDICheck','ValuationDetails','VehicleDetailsWithImage'].sort());
 expect(report.vehicle).toEqual({name:'Fiat 500 Pop',year:2010,mileage:93574,askingPrice:null});
 expect(report.evidence?.mot[0]).toMatchObject({result:'fail',mileage:93574});
 expect(report.evidence?.valuation?.mileage).toBe(105553);
 expect(report.motStatus).toEqual({status:'failed',source:'supplier'});
 expect(report.tax).toMatchObject({status:'sorn',rates:[{label:'Standard annual rate',amount:35}]});
 expect(report.evidence?.tyres).toEqual([
  {axle:'Front',size:'235/45R18',rating:'98Y',runFlat:false,pressure:'42 psi / 2.9 bar'},
  {axle:'Rear',size:'255/40R18',rating:'99Y',runFlat:false}
 ]);
});

test('preview requests vehicle details once and completion requests only three remaining packages',async()=>{
 const calls:string[]=[];
 const fetcher:Fetcher=async input=>{
  const url=new URL(String(input));const packageName=url.searchParams.get('packagename')!;calls.push(packageName);
  return Response.json(packageName==='VehicleDetailsWithImage'?details:packageName==='VDICheck'?vdi:packageName==='ValuationDetails'?valuation:tyres);
 };
 const identified=await lookupSandboxPreview('SL60AUC',{apiKey:'secret',fetcher});
 expect(calls).toEqual(['VehicleDetailsWithImage']);
 expect(JSON.stringify(identified.preview)).not.toContain('Finance');
 expect(JSON.stringify(identified.preview)).not.toContain('valuation');
 const report=await completeSandboxReport('SL60AUC',identified.details,{apiKey:'secret',fetcher});
 expect(calls.slice(1).sort()).toEqual(['TyreDetails','VDICheck','ValuationDetails'].sort());
 expect(report.vehicle.name).toBe('Fiat 500 Pop');
});

test('completion does not retry a failed optional package',async()=>{
 const calls:string[]=[];
 const fetcher:Fetcher=async input=>{
  const packageName=new URL(String(input)).searchParams.get('packagename')!;calls.push(packageName);
  if(packageName==='ValuationDetails')return new Response('Unavailable',{status:503});
  return Response.json(packageName==='VDICheck'?vdi:tyres);
 };
 const report=await completeSandboxReport('SL60AUC',details.Results,{apiKey:'secret',fetcher});
 expect(calls.filter(value=>value==='ValuationDetails')).toHaveLength(1);
 expect(report.evidence?.valuation).toBeUndefined();
 expect(report.evidence?.notes.join(' ')).toContain('ValuationDetails unavailable');
});

test('finance records retain useful lender details but discard the agreement number',async()=>{
 const financeVdi={Results:{...vdi.Results,FinanceDetails:{FinanceRecordList:[{AgreementDate:'2026-06-01T00:00:00',AgreementType:'HIRE PURCHASE',AgreementTerm:60,AgreementNumber:'PRIVATE-REFERENCE',FinanceCompany:'JBR CAPITAL',ContactNumber:'01234 567890',VehicleDescription:'LOTUS EXIGE SPORT 410'}]}}};
 const fetcher:Fetcher=async input=>{
  const packageName=new URL(String(input)).searchParams.get('packagename');
  return Response.json(packageName==='VehicleDetailsWithImage'?details:packageName==='VDICheck'?financeVdi:packageName==='ValuationDetails'?valuation:tyres);
 };
 const report=await lookupSandboxReport('SL60AUC',{apiKey:'secret',fetcher});
 expect(report.financeRecords).toEqual([{agreementDate:'2026-06-01',agreementType:'Hire Purchase',termMonths:60,company:'Jbr Capital',contactNumber:'01234 567890',vehicleDescription:'Lotus Exige Sport 410'}]);
 expect(JSON.stringify(report)).not.toContain('PRIVATE-REFERENCE');
});

test('missing tyre package does not block the report and is recorded as a gap',async()=>{
 const fetcher:Fetcher=async input=>{
  const packageName=new URL(String(input)).searchParams.get('packagename');
  if(packageName==='TyreDetails')return new Response('Unavailable',{status:503});
  return Response.json(packageName==='VehicleDetailsWithImage'?details:packageName==='VDICheck'?vdi:valuation);
 };
 const report=await lookupSandboxReport('SL60AUC',{apiKey:'secret',fetcher});
 expect(report.evidence?.tyres).toEqual([]);
 expect(report.evidence?.notes.join(' ')).toContain('TyreDetails unavailable');
});

test('EV details already present in vehicle data are normalised without a fifth package call',async()=>{
 const calls:string[]=[];
 const fetcher:Fetcher=async input=>{
  const packageName=new URL(String(input)).searchParams.get('packagename')!;calls.push(packageName);
  return Response.json(packageName==='VehicleDetailsWithImage'?evDetails:packageName==='VDICheck'?vdi:packageName==='ValuationDetails'?valuation:tyres);
 };
 const report=await lookupSandboxReport('LD17VAE',{apiKey:'secret',fetcher});
 expect(report.vehicle.name).toBe('Tesla Model X 75D');
 expect(calls).not.toContain('BatteryDetails');expect(calls).toHaveLength(4);
 expect(report.ev).toMatchObject({totalCapacityKwh:75,usableCapacityKwh:72.5,consumptionWhMile:316,rangeMiles:237,maxChargeKw:142,batteryWarrantyMonths:96,batteryWarrantyMiles:150000,healthStatus:'not-tested'});
 expect(report.ev?.ports[0]).toEqual({type:'Type 2',location:'Left/Rear',maxKw:16.6,times:[{powerKw:2.3,minutes:1957},{powerKw:7.5,minutes:600},{powerKw:11,minutes:409}]});
});

test('a missing optional valuation produces a usable report with a clear data note',async()=>{
 const fetcher:Fetcher=async input=>{
  const packageName=new URL(String(input)).searchParams.get('packagename');
  if(packageName==='ValuationDetails')return new Response('Unavailable',{status:503});
  return Response.json(packageName==='VDICheck'?vdi:details);
 };
 const report=await lookupSandboxReport('SL60AUC',{apiKey:'secret',fetcher});
 expect(report.vehicle.name).toBe('Fiat 500 Pop');
 expect(report.evidence?.valuation).toBeUndefined();
 expect(report.evidence?.notes.join(' ')).toContain('ValuationDetails unavailable');
});

test('vehicle details are required to identify the car',async()=>{
 const fetcher:Fetcher=async input=>{
  const packageName=new URL(String(input)).searchParams.get('packagename');
  return packageName==='VehicleDetailsWithImage'?new Response('Unavailable',{status:503}):Response.json(packageName==='VDICheck'?vdi:valuation);
 };
 await expect(lookupSandboxReport('SL60AUC',{apiKey:'secret',fetcher})).rejects.toThrow('identify the vehicle');
});
