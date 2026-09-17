import {useState} from 'react';
import type {Car} from '../shared/types';
import {assessEvidence, type SpecEvidence} from '../shared/specification';

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
export function SpecificationMatch({car,fictional}:{car:Car;fictional:boolean}) {
  const choices = ['Air conditioning','Carbon seats','Full service history',...(car.make==='Porsche'?['Sport Chrono','Ceramic brakes']:[])];
  const [selected,setSelected] = useState<string[]>(['Air conditioning','Carbon seats']);
  const rows = choices.filter(label=>selected.includes(label)).map(label=>{
    const evidence: SpecEvidence[] = fictional ? demo[car.id]?.[label] ?? (car.features.some(f=>f.toLowerCase()===label.toLowerCase()) ? [{source:'Features list',claim:'present',text:`Fictional equipment list: ${label}.`}] : []) : [];
    return {label,evidence,status:assessEvidence(evidence)};
  });
  const matched=rows.filter(r=>r.status==='Advertised').length;
  return <section className="spec-match" aria-labelledby="spec-match-title">
    <div className="section-heading"><div><p className="eyebrow">THE DETAILS THAT MATTER</p><h2 id="spec-match-title">Does it match your wish list?</h2></div><span>{fictional?'Fictional evidence':'Evidence unavailable'}</span></div>
    <p className="muted">Choose what matters to you. Advertised equipment still needs checking with the seller.</p>
    <fieldset className="spec-preferences"><legend>Your preferences for this car</legend>{choices.map(label=><label key={label}><input type="checkbox" checked={selected.includes(label)} onChange={e=>setSelected(prev=>e.target.checked?[...prev,label]:prev.filter(v=>v!==label))}/>{label}</label>)}</fieldset>
    <p className="spec-summary" role="status">{rows.length?`${matched} of ${rows.length} preferences advertised${fictional?' in this fictional example':''}.`:'Select a preference to see its evidence.'}</p>
    <div className="spec-evidence-list">{rows.map(row=><article key={row.label} className="spec-evidence"><div className="spec-evidence-heading"><h3>{row.label}</h3><span className={`spec-status ${row.status==='Advertised'?'positive':row.status==='Unknown'?'unknown':'review'}`}>{row.status}</span></div>{row.evidence.length?<details><summary>View evidence · {row.evidence.length} source {row.evidence.length===1?'entry':'entries'}</summary>{row.evidence.map((e,i)=><div className="spec-source" key={i}><span>{e.source}</span><blockquote>{e.text}</blockquote></div>)}</details>:<p className="muted small">{fictional?'Not mentioned in the available evidence. This does not mean it is absent.':'Source evidence has not been loaded for this imported record.'}</p>}{row.status==='Needs confirmation'&&<p className="spec-caution">The equipment is unconfirmed or the sources disagree. Ask the seller before relying on it.</p>}</article>)}</div>
    <p className="muted small">These selections apply to this detail view. They do not filter results or create alerts. {fictional?'Evidence examples are invented for UI testing.':''}</p>
  </section>;
}
