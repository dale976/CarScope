import type { DetailResult, Car } from '../shared/types';
import { CarArt } from './CarArt';
import { SpecificationMatch } from './SpecificationMatch';
export const money = (n: number) => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n);
export const number = (n: number) => n.toLocaleString('en-GB');
export const shortDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
export function Detail({data,watched,toggle,open,back}: {data:DetailResult;watched:boolean;toggle:()=>void;open:(id:string)=>void;back:()=>void}) {
  const {car,comparables}=data;
  const first=car.history[0]!.price;
  const average = comparables.length ? Math.round(comparables.reduce((sum,c)=>sum+c.price,0)/comparables.length) : null;
  const min = Math.min(...car.history.map(h=>h.price)) - 500;
  const max = Math.max(...car.history.map(h=>h.price)) + 500;
  const start = new Date(car.history[0]!.date).getTime();
  const end = new Date(data.asOf).getTime();
  const points = car.history.map(h=>`${24+(new Date(h.date).getTime()-start)/Math.max(end-start,1)*552},${125-(h.price-min)/(max-min)*95}`);
  points.push(`576,${125-(car.price-min)/(max-min)*95}`);
  return <main id="main" className="detail-page">
    <button className="text-button back" onClick={back}>← Back to results</button>
    <div className="detail-heading"><div><p className="eyebrow">{car.year} / {car.transmission} / {car.location}</p><h1>{car.make} {car.model}<span>{car.trim}</span></h1></div><button className={watched?'button dark':'button'} onClick={toggle}>{watched?'✓ Watching':'＋ Watch this car'}</button></div>
    <div className="detail-grid"><section><CarArt car={car} large/><div className="section-heading"><h2>The specification</h2><span>{car.paint}</span></div><div className="feature-tags">{car.features.map(f=><span key={f}>{f}</span>)}</div><p className="description">{car.description}</p><p className="muted">Seller: {car.seller}</p></section>
    <aside className="price-panel"><p className="eyebrow">ASKING PRICE</p><p className="big-price">{money(car.price)}</p><p className="change">{first>car.price?`↓ ${money(first-car.price)} since first seen`:'No price reduction shown in this sample'}</p><dl><div><dt>Mileage</dt><dd>{number(car.mileage)} miles</dd></div><div><dt>Days on market</dt><dd>{car.daysOnMarket} days</dd></div><div><dt>Transmission</dt><dd>{car.transmission}</dd></div><div><dt>Snapshot date</dt><dd>{shortDate(data.asOf)}</dd></div></dl><div className="insight"><span className="eyebrow">COMPARABLE ASKING PRICES</span><p>{average?`${money(average)} average across ${comparables.length} similar ${car.model} listing${comparables.length===1?'':'s'}.`:'No same-model comparables in this snapshot.'}</p><small>Same make and model, nearest mileage. Trim, age and condition may differ. This is not a valuation.</small></div></aside></div>
    <SpecificationMatch key={car.id} car={car} fictional={data.source==='fictional'}/><div className="detail-lower"><section className="history"><div className="section-heading"><h2>Price history</h2><span>Asking prices · GBP</span></div><svg viewBox="0 0 600 155" role="img" aria-label="Asking price history; exact dates and prices listed below"><path d="M24 40H576 M24 85H576 M24 130H576" stroke="#d6d8cd" fill="none"/><polyline points={points.join(' ')} fill="none" stroke="#b4432d" strokeWidth="3"/>{car.history.map((h,i)=>{const [cx,cy]=points[i]!.split(',');return <circle key={h.date} cx={cx} cy={cy} r="5" fill="#b4432d"/>;})}</svg><ol className="history-list">{car.history.map((h,i)=><li key={h.date}><span>{shortDate(h.date)}<small>{i===0?'First recorded price':'Price changed'}</small></span><strong>{money(h.price)}</strong></li>)}</ol><p className="muted small">Time axis uses recorded dates. The final line carries the latest asking price to the snapshot date. No sale prices are inferred.</p></section>
    <section><div className="section-heading"><h2>Compare the market</h2><span>{comparables.length} comparables</span></div>{comparables.length?comparables.map(c=><button className="comparable" key={c.id} onClick={()=>open(c.id)}><span><strong>{c.make} {c.model} {c.trim}</strong><small>{c.year} · {number(c.mileage)} miles · {c.daysOnMarket} days listed</small></span><b>{money(c.price)} ↗</b></button>):<p className="empty-inline">No comparable listings in this snapshot.</p>}<p className="muted small">{data.source==='fictional'?'All values are fictional examples.':'Imported snapshot; availability is not checked live.'}</p></section></div>
  </main>;
}
