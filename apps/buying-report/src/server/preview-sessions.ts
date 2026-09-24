import {randomUUID} from 'node:crypto';
import type {BuyingReport} from '../shared/report';
import type {DataMode} from '../shared/preview';
import type {ProviderVehicleDetails} from './provider';

type MockSession={mode:'mock';registration:string;report:BuyingReport};
type LiveSession={mode:'live';registration:string;details:ProviderVehicleDetails};
type PreviewSession=(MockSession|LiveSession)&{createdAt:number;inflight?:Promise<BuyingReport>};
type NewSession=MockSession|LiveSession;

export function createPreviewSessions(options:{now?:()=>number;ttlMs?:number}={}){
 const now=options.now??Date.now;const ttlMs=options.ttlMs??1_800_000;
 const sessions=new Map<string,PreviewSession>();
 const read=(id:string,mode:DataMode,registration:string)=>{
  const session=sessions.get(id);
  if(!session)throw new Error('Preview expired or unavailable. Identify the vehicle again.');
  if(now()-session.createdAt>ttlMs){sessions.delete(id);throw new Error('Preview expired. Identify the vehicle again.');}
  if(session.mode!==mode||session.registration!==registration)throw new Error('Preview does not match this registration or data mode.');
  return session;
 };
 return {
  create(session:NewSession){const id=randomUUID();sessions.set(id,{...session,createdAt:now()});return id;},
  read,
  complete(id:string,mode:DataMode,registration:string,work:(session:PreviewSession)=>Promise<BuyingReport>){
   const session=read(id,mode,registration);if(session.inflight)return session.inflight;
   const pending=work(session).then(report=>{sessions.delete(id);return report;},error=>{session.inflight=undefined;throw error;});
   session.inflight=pending;return pending;
  }
 };
}

export type PreviewSessions=ReturnType<typeof createPreviewSessions>;
