import {expect,test} from 'bun:test';
import {createPreviewSessions} from '../src/server/preview-sessions';
import type {BuyingReport} from '../src/shared/report';

const sampleReport={kind:'sandbox-example',registration:'LD17VAE',vehicle:{name:'Tesla Model X 75D',year:2017,mileage:null,askingPrice:null},findings:[],checks:[],costs:[],sellerQuestions:[]} as BuyingReport;

test('preview sessions expire and reject mismatched registration or mode',()=>{
 let now=1_000;
 const sessions=createPreviewSessions({now:()=>now,ttlMs:30*60_000});
 const id=sessions.create({mode:'mock',registration:'LD17VAE',report:sampleReport});
 expect(sessions.read(id,'mock','LD17VAE')).toBeDefined();
 expect(()=>sessions.read(id,'live','LD17VAE')).toThrow('does not match');
 expect(()=>sessions.read(id,'mock','SL60AUC')).toThrow('does not match');
 now+=30*60_000+1;
 expect(()=>sessions.read(id,'mock','LD17VAE')).toThrow('expired');
});

test('completion coalesces concurrent work and clears a rejected attempt',async()=>{
 const sessions=createPreviewSessions();
 const id=sessions.create({mode:'mock',registration:'LD17VAE',report:sampleReport});
 let calls=0;
 const complete=()=>{calls++;return Promise.resolve(sampleReport)};
 const [first,second]=await Promise.all([
  sessions.complete(id,'mock','LD17VAE',complete),
  sessions.complete(id,'mock','LD17VAE',complete)
 ]);
 expect(first).toBe(second);expect(calls).toBe(1);

 const retryId=sessions.create({mode:'mock',registration:'LD17VAE',report:sampleReport});
 await expect(sessions.complete(retryId,'mock','LD17VAE',async()=>{throw new Error('temporary')})).rejects.toThrow('temporary');
 await sessions.complete(retryId,'mock','LD17VAE',complete);
 expect(calls).toBe(2);
});
