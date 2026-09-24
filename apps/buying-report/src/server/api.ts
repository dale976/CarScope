import {sampleReport} from '../../fixtures/sample-report';
import {projectReportPreview,type DataMode,type VehiclePreview} from '../shared/preview';
import type {BuyingReport} from '../shared/report';
import {loadMockReport} from './mock-reports';
import {completeSandboxReport,lookupSandboxPreview,type ProviderVehicleDetails} from './provider';
import {createPreviewSessions,type PreviewSessions} from './preview-sessions';

type IdentifiedLive={preview:Omit<VehiclePreview,'previewId'>;details:ProviderVehicleDetails};
type Options={env?:Record<string,string|undefined>;sessions?:PreviewSessions;loadMock?:(registration:string)=>BuyingReport;completeMock?:(report:BuyingReport)=>Promise<BuyingReport>;identifyLive?:(registration:string,options:{apiKey:string})=>Promise<IdentifiedLive>;completeLive?:(registration:string,details:ProviderVehicleDetails,options:{apiKey:string})=>Promise<BuyingReport>};
const noStore={'Cache-Control':'no-store'};
const json=(value:unknown,init:ResponseInit={})=>Response.json(value,{...init,headers:{...noStore,...init.headers}});
const registration=(value:unknown)=>{const normalized=typeof value==='string'?value.toUpperCase().replace(/\s/g,''):'';if(!/^[A-Z0-9]{2,8}$/.test(normalized))throw new Error('Enter a valid UK registration.');return normalized;};
const errorStatus=(error:unknown)=>error instanceof Error&&error.message.includes('does not match')?409:error instanceof Error&&error.message.toLowerCase().includes('expired')?410:422;

async function body(request:Request){
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw Object.assign(new Error('Use application/json.'),{status:415});
 const text=await request.text();if(text.length>4096)throw Object.assign(new Error('Request body is too large.'),{status:413});
 try{return JSON.parse(text) as Record<string,unknown>;}catch{throw Object.assign(new Error('Invalid JSON body.'),{status:400});}
}
function allowedRequest(request:Request){
 const url=new URL(request.url);if(!['127.0.0.1','localhost','::1','[::1]'].includes(url.hostname))return false;
 const origin=request.headers.get('origin');if(!origin)return true;
 try{return new URL(origin).origin===url.origin;}catch{return false;}
}

export function createReportApi(options:Options={}){
 const env=options.env??process.env;const sessions=options.sessions??createPreviewSessions();const loadMock=options.loadMock??loadMockReport;const completeMock=options.completeMock??(async report=>report);const identifyLive=options.identifyLive??lookupSandboxPreview;const completeLive=options.completeLive??completeSandboxReport;
 return async(request:Request):Promise<Response>=>{
  const path=new URL(request.url).pathname;
  if(path==='/api/sample-report'){
   if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:{Allow:'GET',...noStore}});
   return json(sampleReport);
  }
  if(!['/api/report-preview','/api/report-generate'].includes(path))return new Response('Not found',{status:404});
  if(request.method!=='POST')return new Response('Method not allowed',{status:405,headers:{Allow:'POST',...noStore}});
  if(!allowedRequest(request))return json({error:'Request origin is not allowed.'},{status:403});
  try{
   const input=await body(request);const mode=input.mode;
   if(mode!=='mock'&&mode!=='live')throw new Error('Choose mock or live data mode.');
   const reg=registration(input.registration);
   if(path==='/api/report-preview'){
    if(mode==='mock'){
     const report=loadMock(reg);const previewId=sessions.create({mode,registration:reg,report});
     return json(projectReportPreview(report,previewId,mode));
    }
    if(env.VDG_SANDBOX_ENABLED!=='true'||!env.VDG_API_KEY)throw new Error('Live sandbox lookup is not configured.');
    const identified=await identifyLive(reg,{apiKey:env.VDG_API_KEY});const previewId=sessions.create({mode,registration:reg,details:identified.details});
    return json({...identified.preview,previewId});
   }
   const previewId=typeof input.previewId==='string'?input.previewId:'';if(!previewId)throw new Error('Preview expired or unavailable. Identify the vehicle again.');
   const report=await sessions.complete(previewId,mode,reg,async session=>{
    if(session.mode==='mock')return completeMock(session.report);
    if(!env.VDG_API_KEY)throw new Error('Live sandbox lookup is not configured.');
    return completeLive(reg,session.details,{apiKey:env.VDG_API_KEY});
   });
   return json(report);
  }catch(error){
   const status=typeof (error as {status?:unknown})?.status==='number'?(error as {status:number}).status:errorStatus(error);
   return json({error:error instanceof Error?error.message:'The request failed.'},{status});
  }
 };
}
