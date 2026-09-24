import {useState} from 'react';
import {projectListing} from '../shared/listing';
import {liveDetailData} from '../shared/detail';
import {detailExamples,exampleComparisons} from '../shared/detail-example';
import type {EquipmentPreference} from '../shared/preferences';
import {CarDetailPage} from './CarDetailPage';
import {CarArt} from './CarArt';
import {PreferenceEditor} from './PreferenceEditor';
const listings=[...detailExamples.map(e=>projectListing(e.response)),...exampleComparisons.map(projectListing)];
export function DetailExample(){
 const [id,setId]=useState(listings[0]!.id);const [editing,setEditing]=useState(false);
 const [preferences,setPreferences]=useState<EquipmentPreference[]>([{label:'Carbon seats',priority:'must'},{label:'Front axle lift',priority:'must'},{label:'Sport Chrono',priority:'nice'}]);
 const car=listings.find(c=>c.id===id)!;
 if(editing)return <main id="main" className="detail-page example-preferences"><button className="text-button back" onClick={()=>setEditing(false)}>← Back to example car</button><p className="eyebrow">FICTIONAL DETAIL PREVIEW · NO API CALLS</p><PreferenceEditor make={car.make} model={car.model} value={preferences} onChange={setPreferences}/><button className="button dark" onClick={()=>setEditing(false)}>View requirement summary</button></main>;
 return <><div className="detail-example-banner"><strong>Fictional detail preview · No API calls</strong><label>Example scenario <select value={id} onChange={e=>setId(e.target.value)}>{detailExamples.map(e=><option key={e.response.id} value={e.response.id}>{e.label}</option>)}{exampleComparisons.map((e,i)=><option key={e.id} value={e.id}>Comparison {i+1}</option>)}</select></label></div><CarDetailPage data={liveDetailData(car,listings.filter(c=>!detailExamples.some(e=>e.response.id===c.id)),'fictional')} photo={<CarArt car={{make:car.make,color:'#495c68',paint:'Fictional finish'}} large/>} preferences={preferences} onEdit={()=>setEditing(true)} back={()=>{location.href='/';}} open={setId}/></>;
}
