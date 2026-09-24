import {expect,test} from 'bun:test';
import {coverageForReport,projectReportPreview,statusCopy} from '../src/shared/preview';
import type {BuyingReport} from '../src/shared/report';
import {loadMockReport} from '../src/server/mock-reports';
import {mkdtempSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

const report={kind:'sandbox-example',registration:'SL60AUC',vehicle:{name:'Fiat 500',year:2010,mileage:90000,askingPrice:null},detail:{registered:'2010-09-10',keepers:[],colour:'Red',engine:'1.2-litre · Petrol',transmission:'5-speed Manual'},motStatus:{status:'valid',expiry:'2027-01-01',source:'supplier'},findings:[],checks:[],costs:[],sellerQuestions:[],evidence:{mot:[{date:'2026-01-01',mileage:90000,expiry:'2027-01-01',result:'pass'}],tyres:[],notes:[]}} satisfies BuyingReport;

test('preview projection exposes identity and coverage but no paid findings',()=>{
 const preview=projectReportPreview(report,'preview-1','mock');
 expect(preview).toMatchObject({previewId:'preview-1',registration:'SL60AUC',source:'mock',vehicle:{name:'Fiat 500',year:2010,fuelType:'Petrol'},coverage:{motRecordCount:1}});
 expect(JSON.stringify(preview)).not.toContain('findings');
 expect(JSON.stringify(preview)).not.toContain('checks');
 expect(JSON.stringify(preview)).not.toContain('valuation');
});

test('coverage describes returned evidence without claiming completeness',()=>{
 expect(coverageForReport({...report,evidence:{mot:[],tyres:[],notes:[]}}).message).toBe('No MOT tests returned');
});

test('coverage identifies a later UK record for an older vehicle',()=>{
 const imported={...report,vehicle:{...report.vehicle,year:1982},detail:{...report.detail!,registered:'2022-08-01'},evidence:{...report.evidence!,mot:[...report.evidence!.mot,...report.evidence!.mot]}};
 expect(coverageForReport(imported)).toEqual({motRecordCount:2,ukRecordStart:'2022-08-01',message:'2 MOT tests returned since UK registration in 2022'});
});

test('mock reports resolve exact known registrations and reject path-like input',()=>{
 const root=mkdtempSync(join(tmpdir(),'carscope-mock-'));mkdirSync(join(root,'.local'));
 const fixture=(name:string,registration?:string)=>({kind:'sandbox-example',...(registration?{registration}:{}),vehicle:{name,year:2020,mileage:null,askingPrice:null},findings:[],checks:[],costs:[],sellerQuestions:[]});
 try{
  writeFileSync(join(root,'.local/tesla-report.json'),JSON.stringify(fixture('Tesla Model X 75D','LD17VAE')));
  writeFileSync(join(root,'.local/porsche-report.json'),JSON.stringify(fixture('Porsche 718 Boxster')));
  writeFileSync(join(root,'.local/fiat-report.json'),JSON.stringify(fixture('Fiat 500 Pop')));
  expect(loadMockReport('LD17 VAE',root).vehicle.name).toBe('Tesla Model X 75D');
  expect(loadMockReport('DF74 FPA',root).registration).toBe('DF74FPA');
  expect(loadMockReport('SL60 AUC',root).registration).toBe('SL60AUC');
  expect(()=>loadMockReport('../../tesla',root)).toThrow('Mock vehicle unavailable');
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('an old supplier tax observation is dated rather than called current',()=>{
 const preview=projectReportPreview({...report,tax:{status:'untaxed',date:'2024-05-12',dueDate:'2026-09-18',rates:[]}},'id','mock',{asOf:'2026-09-24'});
 expect(preview.tax).toMatchObject({status:'untaxed',sourceDate:'2024-05-12'});
 expect(statusCopy(preview.tax!,{asOf:'2026-09-24'})).toContain('Supplier record dated 12 May 2024');
 expect(statusCopy(preview.tax!,{asOf:'2026-09-24'})).not.toContain('Current tax status');
});

test('status wording reflects dates and missing evidence without inventing freshness',()=>{
 expect(statusCopy({status:'valid',expiry:'2027-01-01'},{asOf:'2026-09-24'})).toContain('Current through 1 Jan 2027');
 expect(statusCopy({status:'expired',expiry:'2025-01-10'},{asOf:'2026-09-24'})).toBe('Recorded expiry 10 Jan 2025');
 expect(statusCopy({status:'sorn',sourceDate:'2026-09-20'},{asOf:'2026-09-24'})).toBe('Supplier record dated 20 Sep 2026');
 expect(statusCopy({status:'exempt'},{asOf:'2026-09-24'})).toBe('Status returned without a current date');
 expect(statusCopy({status:'unavailable'},{asOf:'2026-09-24'})).toBe('Status not established');
});
