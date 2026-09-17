/** User-supplied tour eligibility, not an assertion of official endorsement. */
export const allModelMakes = ['Porsche','McLaren','Rolls-Royce','AC','Shelby','De Tomaso','TVR','Morgan','Aston Martin','Lamborghini','Ferrari','Koenigsegg','Noble','Bentley','Lotus','Gordon Murray Automotive','Pagani','Alpina'];
export const selectedModels: Record<string,string[]> = {
 'Alfa Romeo':['8C','SZ','RZ','4C','Giulia'], Cadillac:['V models'], Honda:['NSX'], Mazda:['RX-7'], Chevrolet:['Corvette','Camaro'], Jaguar:['E-Type','XJ220','F-Type','XE Project 8'], 'Mercedes-Benz':['CLK GTR','SLR','SLS','AMG GT','AMG One','C63','G-Class'], Toyota:['2000GT','Supra'], Alpine:['A110'], Dodge:['Viper','SRT models'], Nissan:['GT-R'], Audi:['R8','RS models'], Lexus:['LFA','RC F'], Ford:['Mustang V8','GT','RS200'], BMW:['M1','M2','M3','M4','M5','M6','M8','Z1','Z8','M40i models','Alpina models'], Maserati:['GranTurismo','MC12','MC20'],
};
export const catalogueMakes=[...allModelMakes,...Object.keys(selectedModels)].sort();
export const normalizeName=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
export function canonicalMake(make:string){
 const aliases:Record<string,string>={alpharomeo:'Alfa Romeo',alfaromeo:'Alfa Romeo',mercedes:'Mercedes-Benz',mercedesbenz:'Mercedes-Benz',mercedesamg:'Mercedes-Benz',gma:'Gordon Murray Automotive',acshelby:'AC'};
 return aliases[normalizeName(make)] ?? catalogueMakes.find(m=>normalizeName(m)===normalizeName(make)) ?? make;
}
export function eligible(car:{make:string;model:string;trim:string;engineCylinders?:number}):boolean {
 const make=canonicalMake(car.make), model=normalizeName(car.model), trim=normalizeName(car.trim);
 if(allModelMakes.includes(make))return true;
 const exact=(...names:string[])=>names.some(n=>normalizeName(n)===model);
 switch(make){
 case 'Alfa Romeo':return exact('8C','8C Competizione','8C Spider','SZ','RZ','4C','4C Spider') || (exact('Giulia')&&/^(qv|quadrifoglio)(verde)?$/.test(trim));
 case 'Cadillac':return /^(ct4|ct5|ct6|cts|ats|xts|sts|xlr|escalade)v(blackwing)?$/.test(model) || /^(v|vseries|vblackwing)$/.test(trim);
 case 'Dodge':return exact('Viper') || trim==='srt' || /^srt\d/.test(trim) || /^srt\d/.test(model) || /^srt(hellcat|demon)/.test(trim);
 case 'Audi':return exact('R8') || /^rs([234567]|q[38])(avant|sportback|performance|gt)?$/.test(model) || /^rsetrongt$/.test(model);
 case 'BMW':return exact('M1','M2','M3','M4','M5','M6','M8','Z1','Z8') || /^(x[1-7]|z4)?m40i$/.test(model) || trim==='m40i' || /^alpina/.test(model) || /^alpina/.test(trim);
 case 'Ford':return exact('GT','RS200') || (exact('Mustang')&&(car.engineCylinders===8 || /^(gt|gtpremium|bullitt|mach1|darkhorse|shelbygt350|shelbygt500|v8)$/.test(trim)));
 case 'Jaguar':return exact('E-Type','XJ220','F-Type','Project 8','XE Project 8') || (exact('XE')&&trim==='project8');
 case 'Mercedes-Benz':return exact('CLK GTR','SLR','SLR McLaren','SLS','SLS AMG','AMG GT','AMG One','C63','AMG C63','C63 AMG','G-Class') || (exact('C-Class')&&/^c63(s|seperformance)?$/.test(trim));
 default:return (selectedModels[make]??[]).some(m=>normalizeName(m)===model);
 }
}
