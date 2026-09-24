import type { DetailResult, Car } from '../shared/types';
import { CarArt } from './CarArt';
import {CarDetailPage} from './CarDetailPage';
import {demoDetailData} from '../shared/detail';
import type {EquipmentPreference} from '../shared/preferences';
export const money = (n: number) => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n);
export const number = (n: number) => n.toLocaleString('en-GB');
export const shortDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
export function Detail({data,watched,toggle,open,back,preferences=[]}: {data:DetailResult;watched:boolean;toggle:()=>void;open:(id:string)=>void;back:()=>void;preferences?:EquipmentPreference[]}) {
 return <CarDetailPage data={demoDetailData(data)} photo={<CarArt car={data.car} large/>} action={<button className={watched?'button dark':'button'} onClick={toggle}>{watched?'✓ Watching':'＋ Watch this car'}</button>} preferences={preferences} onEdit={back} open={open} back={back}/>;
}
