import { useId, useState } from 'react';
import lotus from './assets/cars/lotus.jpg';
import porsche from './assets/cars/porsche.jpg';
import ferrari from './assets/cars/ferrari.jpg';
import bentley from './assets/cars/bentley.jpg';
import credits from './assets/cars/credits.json';
const photos: Record<string, {src: string; file: string}> = {Lotus:{src:lotus,file:'lotus.jpg'}, Porsche:{src:porsche,file:'porsche.jpg'}, Ferrari:{src:ferrari,file:'ferrari.jpg'}, Bentley:{src:bentley,file:'bentley.jpg'}};
import type { Car } from '../shared/types';
// Original local vector illustration, not a photograph of the advertised vehicle.
export function CarArt({car, large = false}: {car: Car; large?: boolean}) {
  const [failed, setFailed] = useState<string | null>(null);
  const photo = photos[car.make];
  const credit = credits.find(c => c.file === photo?.file);
  if (photo && credit && failed !== photo.src) return <figure className={`car-photo ${large ? 'large' : ''}`}>
    <div className="car-photo-frame"><img src={photo.src} alt={`${car.make} sample photograph; not the advertised vehicle or exact specification`} loading={large ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(photo.src)}/><span className="photo-label">SAMPLE PHOTOGRAPH</span></div>
    <figcaption>{large ? <><a href={credit.source} target="_blank" rel="noreferrer">Photo: {credit.photographer}</a> · <a href={credit.licenseUrl} target="_blank" rel="noreferrer">{credit.license}</a> · Cropped for display</> : <>Photo: {credit.photographer} · {credit.license}</>}</figcaption>
  </figure>;
  return <Illustration car={car} large={large}/>;
}
function Illustration({car, large = false}: {car: Car; large?: boolean}) {
  const finish = useId().replace(/:/g,'');
  const coupe = ['BMW','Toyota'].includes(car.make);
  return <div className={`car-art ${large ? 'large' : ''}`} style={{'--car-color':car.color} as React.CSSProperties}>
    <span className="art-make">{car.make}</span>
    <svg viewBox="0 0 640 280" role="img" aria-label={`${car.paint} sports car illustration; not a vehicle photograph`}>
      <defs><linearGradient id={finish} x1="0" y1="0" x2="0.2" y2="1"><stop offset="0" stopColor="#f0f2ec"/><stop offset=".3" stopColor="var(--car-color)"/><stop offset=".65" stopColor="var(--car-color)"/><stop offset="1" stopColor="#30383d"/></linearGradient></defs>
      <ellipse cx="327" cy="222" rx="255" ry="15" fill="#000" opacity=".5"/>
      <path d={coupe ? 'M62 188 L76 160 150 146 213 86 383 82 453 130 551 147 581 179 575 204 66 206Z' : 'M62 192 L87 165 199 143 272 101 360 104 423 148 535 159 578 188 568 209 67 210Z'} fill={`url(#${finish})`} stroke="#7e898e" strokeWidth="1.3"/>
      <path d={coupe ? 'M172 143 L223 97 296 95 296 143Z M308 95 L377 94 429 140 308 142Z' : 'M222 143 L279 112 311 114 310 147Z M320 114 L354 115 400 148 320 148Z'} fill="#111c24"/>
      <path d="M94 171 Q230 157 425 162 L541 176" fill="none" stroke="#fff" opacity=".5" strokeWidth="3"/>
      <path d="M285 158 L282 203 M408 159 L415 204" fill="none" stroke="#28332e" opacity=".45" strokeWidth="2"/>
      <path d="M294 163 L310 163" stroke="#293832" strokeWidth="4" strokeLinecap="round"/>
      <path d="M65 188 L105 183 100 196 67 198Z" fill="#f6f3d9"/>
      <path d="M545 171 L565 180 563 185 543 181Z" fill="#ad392b"/>
      <path d="M69 209 L564 211" stroke="#25322c" strokeWidth="6"/>
      {[164,473].map(x=><g key={x}><circle cx={x} cy="204" r="38" fill="#232a27"/><circle cx={x} cy="204" r="26" fill="#89928c"/><circle cx={x} cy="204" r="20" fill="#35433c"/>{[0,60,120].map(r=><path key={r} d={`M${x} 181 L${x} 227`} stroke="#bac0b8" strokeWidth="4" transform={`rotate(${r} ${x} 204)`}/>) }<circle cx={x} cy="204" r="6" fill="#d4d9cd"/></g>)}
    </svg><span className="art-caption">ILLUSTRATION / SAMPLE SPEC</span>
  </div>;
}
