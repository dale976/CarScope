import type {EquipmentPreference} from '../shared/preferences';
import type {Car} from '../shared/types';
import {assessEvidence, extractSpecEvidence, type ListingSpecSource, type SpecEvidence} from '../shared/specification';

// Curated fictional evidence, not an automated extraction or provider response.
const demo: Record<string, Record<string, SpecEvidence[]>> = {
  'porsche-gt4-01': {
    'Sport Chrono': [{source:'Seller description',claim:'present',text:'Fictional advert: Sport Chrono package fitted.'}],
    'Ceramic brakes': [{source:'Options list',claim:'unconfirmed',text:'Fictional options entry: Porsche Ceramic Composite Brake (PCCB).'}],
    'Carbon seats': [{source:'Features list',claim:'present',text:'Fictional equipment list: carbon bucket seats.'},{source:'Seller description',claim:'absent',text:'Fictional advert: standard sports seats; carbon bucket seats are not fitted.'}],
  },
  'porsche-gt4-02': {
    'Sport Chrono': [{source:'Seller description',claim:'absent',text:'Fictional advert: Sport Chrono is not fitted.'}],
  },
  'lotus-410-01': {
    'Carbon seats': [{source:'Options list',claim:'unconfirmed',text:'Fictional options entry: carbon fibre seats. Fitment not confirmed.'}],
  },
};
export function SpecificationMatch({car,fictional,liveEvidence,preferences=[],onEdit}:{car:Pick<Car,'id'|'make'|'features'> & {model?:string};fictional:boolean;liveEvidence?:ListingSpecSource;preferences?:EquipmentPreference[];onEdit?:()=>void}) {
  const rows = preferences.map(({label,priority})=>{
    const evidence: SpecEvidence[] = liveEvidence ? extractSpecEvidence(liveEvidence,label) : fictional ? demo[car.id]?.[label] ?? extractSpecEvidence({features:car.features,options:[],description:''},label) : [];
    return {label,priority,evidence,status:assessEvidence(evidence)};
  });
  if(!rows.length)return <section className="requirements-summary"><div className="section-heading"><h2>Your requirements</h2>{onEdit&&<button className="text-button" onClick={onEdit}>Edit search preferences</button>}</div><p className="muted small">No equipment preferences selected.</p></section>;
  return <section className="requirements-summary" aria-label="Your requirements">
    <div className="section-heading"><h2>Your requirements</h2>{onEdit&&<button className="text-button" onClick={onEdit}>Edit search preferences</button>}</div>
    <ul className="requirement-rows">{rows.map(row=><li key={row.label}><div><strong>{row.label}</strong><small>{row.priority==='must'?'Must-have':'Nice-to-have'}</small></div><span className={`spec-status ${row.status==='Advertised'?'positive':row.status==='Unknown'?'unknown':'review'}`}>{{Advertised:'Advertised as fitted','Advertised absent':'Advertised as not fitted',Unknown:'Not confirmed','Needs confirmation':'Needs checking'}[row.status]}</span>{row.evidence.length>0&&<details><summary>Evidence</summary>{row.evidence.map((e,i)=><p key={i}><small>{e.source}</small>{e.text}</p>)}</details>}</li>)}</ul>
    <p className="muted small">Based on advert wording. Confirm important equipment with the seller.</p>
  </section>;
}
