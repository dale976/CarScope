import {expect,test} from 'bun:test';
import {renderToStaticMarkup} from 'react-dom/server';
import {VehiclePreviewCard} from '../src/client/VehiclePreview';
import type {VehiclePreview} from '../src/shared/preview';

const preview:VehiclePreview={previewId:'one',registration:'LD17VAE',source:'mock',vehicle:{name:'Tesla Model X 75D',year:2017,fuelType:'Electric',colour:'Black'},mot:{status:'valid',expiry:'2027-01-01'},tax:{status:'taxed',dueDate:'2027-02-01'},coverage:{motRecordCount:8,message:'8 MOT tests returned'}};
test('focused preview shows returned evidence and the planned price without paid findings',()=>{
 const html=renderToStaticMarkup(<VehiclePreviewCard preview={preview} mode="mock" busy={false} onBack={()=>{}} onGenerate={()=>{}}/>);
 for(const text of ['Vehicle identified','LD17 VAE','MOT valid','8 MOT tests returned','Complete buying report','£9.99'])expect(html).toContain(text);
 expect(html).not.toContain('Finance record');expect(html).not.toContain('Complete history');expect(html).not.toContain('supplier call');
});
test('preview explains later UK records and live call use',()=>{
 const imported={...preview,registration:'E824MAS',coverage:{motRecordCount:3,ukRecordStart:'2022-08-01',message:'3 MOT tests returned since UK registration in 2022'}};
 const html=renderToStaticMarkup(<VehiclePreviewCard preview={imported} mode="live" busy={false} onBack={()=>{}} onGenerate={()=>{}}/>);
 expect(html).toContain('3 MOT tests returned since UK registration in 2022');expect(html).toContain('3 supplier calls');
});
test('preview does not turn absent MOT evidence into reassurance',()=>{
 const empty={...preview,mot:undefined,coverage:{motRecordCount:0,message:'No MOT tests returned'}};
 const html=renderToStaticMarkup(<VehiclePreviewCard preview={empty} mode="mock" busy={false} onBack={()=>{}} onGenerate={()=>{}}/>);
 expect(html).toContain('No MOT tests returned');expect(html).toContain('MOT status not established');
});
