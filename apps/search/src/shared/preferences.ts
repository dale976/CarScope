export type PreferencePriority='must'|'nice';
export interface EquipmentPreference {label:string;priority:PreferencePriority}
export const preferenceGroups={
 Seats:['Bucket seats','Carbon seats','Heated seats','Ventilated seats'],
 Driving:['Manual gearbox','Limited-slip differential','Sports suspension','Ceramic brakes','Front axle lift'],
 Comfort:['Air conditioning','Cruise control','Heated steering wheel'],
 Technology:['Reversing camera','Parking sensors','Upgraded audio','Head-up display'],
 Appearance:['Special paint','Carbon exterior trim'],
};
/** Suggestions to investigate, not claims of availability or fitment on every model/year. */
export function preferenceSuggestions(make:string,model=''):string[]{
 const m=model.trim().toLowerCase();
 if(make==='Porsche')return [...(/^(911|718|cayman|boxster)$/.test(m)?['Sport Chrono']:[]),'BOSE','Burmester'];
 if(make==='BMW')return [...(/^m[23458]$/.test(m)?['M Carbon bucket seats']:[]),'Harman Kardon','BMW Individual'];
 if(make==='Audi')return ['Bang & Olufsen','Audi exclusive'];
 if(make==='Mercedes-Benz')return ['Burmester','designo'];
 return [];
}
export function addPreference(current:EquipmentPreference[],value:string,priority:PreferencePriority='nice'){
 const label=value.trim().replace(/\s+/g,' ');
 if(!label||label.length>80||current.length>=20||current.some(p=>p.label.toLowerCase()===label.toLowerCase()))return current;
 return [...current,{label,priority}];
}
