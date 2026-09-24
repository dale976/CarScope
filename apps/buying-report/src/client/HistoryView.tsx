import {useState,useId} from 'react';
import type {VehicleDetail,MotRecord,HistoryEvent} from '../shared/report';
import {buildTimeline,dateLabel,mileageReadings,motTitle,motText,reportAnchor} from '../shared/history';
function MotEvidence({test}:{test:MotRecord}){
 const annotations=test.annotations;
 return <><p>{test.mileage==null?'Mileage unavailable':test.mileage.toLocaleString('en-GB')+' miles'}{test.expiry?` · Expiry in this record: ${dateLabel(test.expiry)}`:''}.</p>{annotations===undefined?<p>Test findings unavailable.</p>:annotations.length?<details className="test-findings"><summary>{annotations.length} recorded {annotations.length===1?'finding':'findings'}{annotations.some(a=>a.type==='DANGEROUS')?' · Includes dangerous defects at this test':''}</summary><ul>{annotations.map((a,i)=><li key={i}><strong>{a.type}</strong> {a.text}</li>)}</ul></details>:<p>No advisories or defects recorded in this supplied test.</p>}</>;
}
export function HistoryView({detail,vehicleYear,mot,events=[]}:{detail?:VehicleDetail;vehicleYear?:number;mot:MotRecord[];events?:HistoryEvent[]}){
 const [recent,setRecent]=useState(false);const [selected,setSelected]=useState<string|null>(null);const prefix=useId();
 const readings=mileageReadings(mot,recent);
 const timeline:HistoryEvent[]=detail?buildTimeline(detail,mot,events):mot.map(m=>({date:m.date,title:motTitle(m),text:motText(m),result:m.result,annotationCount:m.annotations?.length??0,mot:m}));
 const years=[...new Set(timeline.map(e=>e.date.slice(0,4)))].sort().reverse();
 const selectedTest=readings.find(m=>m.date===selected)??readings[readings.length-1];
 const first=readings[0],last=readings[readings.length-1];
 const min=first?Date.parse(first.date):0,max=last?Date.parse(last.date):1;
 const top=Math.max(10000,...readings.map(m=>m.mileage!));
 const x=(m:MotRecord)=>max===min?340:65+(Date.parse(m.date)-min)/(max-min)*570;
 const y=(m:MotRecord)=>210-m.mileage!/top*170;
 const latestKeeper=detail?[...detail.keepers].sort((a,b)=>b.date.localeCompare(a.date))[0]:undefined;
 const keeperCount=detail?.keepers.length??0;
 const registeredYear=detail?.registered?Number(detail.registered.slice(0,4)):undefined;
 const likelyImported=vehicleYear!==undefined&&registeredYear!==undefined&&registeredYear-vehicleYear>1;
 return <section className="history-section"><p className="eyebrow">The recorded story</p><h2>A history worth understanding</h2><p className="section-intro">{latestKeeper?`${latestKeeper.previous} previous registered keepers in the latest supplied record. `:''}Keepers are not necessarily legal owners. This covers the records returned, not every event in the car’s life.</p>
 <div className="history-coverage"><div aria-label={`${mot.length} ${mot.length===1?'MOT test':'MOT tests'}`}><strong>{mot.length}</strong><span>{mot.length===1?'MOT test':'MOT tests'}</span></div><div aria-label={`${keeperCount} ${keeperCount===1?'keeper change':'keeper changes'}`}><strong>{keeperCount}</strong><span>{keeperCount===1?'keeper change':'keeper changes'}</span></div><p><strong>{likelyImported?'UK history since registration':'Digital record coverage'}</strong>{likelyImported?` This ${vehicleYear} vehicle was registered in the UK record in ${registeredYear}; earlier overseas history is not included.`:mot.length?' MOT evidence is available below, including failures and recorded mileage where supplied.':' No MOT records were returned; this does not establish a clear history.'}</p></div>
 {events.filter(e=>e.significant).map((e,i)=><div className="history-alert" id={`history-event-${reportAnchor(e.title)}`} key={i}><span className="source-label">Significant recorded event · {dateLabel(e.date)}</span><h3>{e.title}</h3><p>{e.text}</p></div>)}
 <div className="mileage-panel"><div className="chart-heading"><h3>Recorded mileage</h3><div className="chart-range" aria-label="Mileage chart period"><button type="button" aria-pressed={!recent} onClick={()=>{setRecent(false);setSelected(null);}}>Full history</button><button type="button" aria-pressed={recent} onClick={()=>{setRecent(true);setSelected(null);}}>Last 5 years</button></div></div>
 {readings.length?<><svg className="mileage-chart" viewBox="0 0 680 250" role="img" aria-label={`Recorded MOT mileage from ${dateLabel(first!.date)} to ${dateLabel(last!.date)}. Details available in the test selector below.`}>
 {[0,.5,1].map(n=><g key={n}><line x1="65" x2="635" y1={210-n*170} y2={210-n*170} stroke="currentColor" opacity=".15"/><text x="55" y={214-n*170} textAnchor="end">{Math.round(top*n).toLocaleString('en-GB')}</text></g>)}
 {readings.slice(1).map((m,i)=><line key={m.date+i} x1={x(readings[i]!)} y1={y(readings[i]!)} x2={x(m)} y2={y(m)} stroke="currentColor" strokeWidth="2" strokeDasharray={Date.parse(m.date)-Date.parse(readings[i]!.date)>550*86400000?'5 6':undefined}/>)}
 {readings.map((m,i)=><circle key={m.date+i} cx={x(m)} cy={y(m)} r={selectedTest===m?6:4} className={m.result==='fail'?'failed-point':'passed-point'} onClick={()=>setSelected(m.date)}><title>{`${dateLabel(m.date)} · ${m.mileage!.toLocaleString('en-GB')} miles · ${motTitle(m)}`}</title></circle>)}
 <text x="65" y="240">{dateLabel(first!.date)}</text>{max!==min&&<text x="635" y="240" textAnchor="end">{dateLabel(last!.date)}</text>}</svg>
 <label htmlFor={prefix+'test'}>Inspect a recorded test</label><select id={prefix+'test'} value={selectedTest?.date} onChange={e=>setSelected(e.target.value)}>{[...readings].reverse().map((m,i)=><option key={m.date+i} value={m.date}>{dateLabel(m.date)} · {m.result??'Unknown result'} · {m.mileage!.toLocaleString('en-GB')} miles</option>)}</select>
 {selectedTest&&<div className="selected-test" aria-live="polite"><strong>{motTitle(selectedTest)} · {dateLabel(selectedTest.date)}</strong><MotEvidence test={selectedTest}/></div>}
 <p className="small-note">Miles recorded at MOT tests, not current mileage. Dashed links mark more than 18 months between supplied readings; no intermediate mileage is known. Red points indicate failed tests. The five-year view ends at the latest recorded reading.</p></>:<p className="empty-data">No usable MOT mileage readings were supplied.</p>}
 </div>
 <div className="history-years"><h3>Explore the records</h3>{years.map((year,index)=>{
 const items=timeline.filter(e=>e.date.startsWith(year)).sort((a,b)=>b.date.localeCompare(a.date));
 const passes=items.filter(e=>e.result==='pass').length,fails=items.filter(e=>e.result==='fail').length,findings=items.reduce((n,e)=>n+(e.annotationCount??0),0);
 return <details className="history-year" key={year} open={index===0}><summary><strong>{year}</strong><span>{passes?`${passes} pass${passes===1?'':'es'} · `:''}{fails?`${fails} fail${fails===1?'':'ures'} · `:''}{findings?`${findings} test findings · `:''}{items.length} {items.length===1?'record':'records'}{items.some(e=>e.significant)?' · Significant event':''}</span></summary><ol className="history-timeline">{items.map((e,i)=><li key={e.date+i} className={e.result==='fail'?'history-failure':undefined}><time dateTime={e.date}>{dateLabel(e.date)}</time><h3>{e.title}</h3>{e.mot?<MotEvidence test={e.mot}/>:<p>{e.text}</p>}</li>)}</ol></details>;
 })}{years.length===0&&<p className="empty-data">No history records were supplied.</p>}</div>
 <p className="small-note">Missing periods mean no records were returned for that period. They do not establish whether the vehicle was used or tested. A later pass does not remove earlier findings or verify the car’s condition today.</p>
 </section>;
}
