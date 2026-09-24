import type {DataMode,VehiclePreview} from '../shared/preview';

const plate=(value:string)=>value.length>3?`${value.slice(0,-3)} ${value.slice(-3)}`:value;
const date=(value?:string)=>value?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`)):undefined;
const label=(value:string)=>value.charAt(0).toUpperCase()+value.slice(1);

export function VehiclePreviewCard({preview,onBack,onGenerate,busy,mode}:{preview:VehiclePreview;onBack:()=>void;onGenerate:()=>void;busy:boolean;mode:DataMode}){
 const mot=preview.mot;const tax=preview.tax;
 return <section className="focused-preview" aria-labelledby="preview-title">
  <div className="preview-identity">
   <div><p className="eyebrow">Vehicle identified</p><h1 id="preview-title">{preview.vehicle.name}</h1><p>{[preview.vehicle.year,preview.vehicle.fuelType,preview.vehicle.transmission,preview.vehicle.colour].filter(Boolean).join(' · ')}</p></div>
   <strong className="preview-plate">{plate(preview.registration)}</strong>
  </div>
  <div className="preview-evidence">
   <div><span>MOT status</span><strong>{mot?`MOT ${mot.status}`:'MOT status not established'}</strong>{mot?.expiry&&<small>Recorded expiry {date(mot.expiry)}</small>}</div>
   <div><span>Tax status</span><strong>{tax?label(tax.status):'Tax status not established'}</strong>{tax?.dueDate&&<small>Recorded due date {date(tax.dueDate)}</small>}</div>
   <div className="preview-coverage"><span>History coverage</span><strong>{preview.coverage.message}</strong><small>Returned records can contain gaps, particularly for older, imported or exempt vehicles.</small></div>
  </div>
  <div className="complete-report-offer"><div><p className="eyebrow">Complete buying report</p><h2>See the recorded history in context.</h2><p>Review returned finance and insurance records, MOT evidence, valuation, specifications, tyres and practical questions for the seller.</p></div><div className="offer-action"><strong>£9.99</strong><button className="primary" type="button" disabled={busy} onClick={onGenerate}>{busy?'Preparing report…':'View complete report · £9.99'} <span aria-hidden="true">↗</span></button>{mode==='live'&&<small>Uses 3 supplier calls</small>}</div></div>
  <button type="button" className="text-button preview-back" onClick={onBack}>← Check another registration</button>
 </section>;
}
