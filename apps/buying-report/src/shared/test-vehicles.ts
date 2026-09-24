export type TestVehicle={
 registration:string;
 name:string;
 year?:number;
 era:'current'|'modern'|'classic';
 type:'sports'|'ev'|'city'|'saloon'|'grand-tourer'|'4x4'|'classic'|'supercar'|'utility'|'unknown';
 sourceLabel:string;
 sourceUrl:string;
};

const supplier='https://vehicledataglobal.com/';

export const testVehicles:TestVehicle[]=[
 {registration:'DF74 FPA',name:'Porsche 718 Boxster GTS 4.0',year:2024,era:'current',type:'sports',sourceLabel:'Porsche Finder',sourceUrl:'https://finder.porsche.com/gb/en-GB/details/porsche-718-boxster-gts-40-preowned-24ZNG5'},
 {registration:'YJ22 ACU',name:'Lotus Exige Sport 410',year:2022,era:'current',type:'sports',sourceLabel:'Existing sandbox example',sourceUrl:supplier},
 {registration:'SL60 AUC',name:'Fiat 500 Pop',year:2010,era:'modern',type:'city',sourceLabel:'Existing sandbox example',sourceUrl:supplier},
 {registration:'LD17 VAE',name:'Tesla Model X',year:2017,era:'modern',type:'ev',sourceLabel:'Existing sandbox example',sourceUrl:supplier},
 {registration:'SA22 NMJ',name:'Supplier vehicle sample',year:2022,era:'current',type:'unknown',sourceLabel:'Existing sandbox example',sourceUrl:supplier},
 {registration:'RO21 PAD',name:'Supplier history sample',year:2021,era:'current',type:'unknown',sourceLabel:'Existing sandbox example',sourceUrl:supplier},
 {registration:'RO22 APU',name:'Supplier specification sample',year:2022,era:'current',type:'unknown',sourceLabel:'Existing sandbox example',sourceUrl:supplier},
 {registration:'SA22 LGU',name:'Supplier tyre sample',year:2022,era:'current',type:'unknown',sourceLabel:'Existing sandbox example',sourceUrl:supplier},

 {registration:'PO66 MKA',name:'Audi RS7',year:2016,era:'modern',type:'sports',sourceLabel:'Collecting Cars',sourceUrl:'https://collectingcars.com/for-sale/2016-audi-rs7'},
 {registration:'R8 AWU',name:'Audi R8 V8 Manual',year:2008,era:'modern',type:'supercar',sourceLabel:'Collecting Cars',sourceUrl:'https://collectingcars.com/for-sale/2008-audi-r8-v8'},
 {registration:'A25 BRH',name:'Aston Martin Rapide',year:2010,era:'modern',type:'grand-tourer',sourceLabel:'Collecting Cars',sourceUrl:'https://collectingcars.com/for-sale/2010-aston-martin-rapide'},
 {registration:'AGZ 9457',name:'Mercedes-Benz V250 Sport',year:2016,era:'modern',type:'utility',sourceLabel:'Current sandbox identity',sourceUrl:supplier},
 {registration:'J900 AML',name:'Aston Martin Virage Volante',year:1994,era:'modern',type:'grand-tourer',sourceLabel:'Collecting Cars',sourceUrl:'https://collectingcars.com/for-sale/1994-aston-martin-virage-volante'},
 {registration:'E12 SCA',name:'Ferrari 612 Scaglietti',year:2005,era:'modern',type:'grand-tourer',sourceLabel:'Collecting Cars',sourceUrl:'https://collectingcars.com/for-sale/2005-ferrari-612-scaglietti-31'},
 {registration:'SF55 SCA',name:'Ferrari 612 Scaglietti',year:2005,era:'modern',type:'grand-tourer',sourceLabel:'Collecting Cars',sourceUrl:'https://collectingcars.com/for-sale/2005-ferrari-612-scaglietti'},
 {registration:'G850 YAE',name:'Ferrari 208 GTS Turbo',year:1989,era:'classic',type:'supercar',sourceLabel:'Collecting Cars',sourceUrl:'https://collectingcars.com/for-sale/1989-ferrari-208-gts-turbo'},
 {registration:'V6 YAB',name:'Morgan Roadster',year:2012,era:'modern',type:'sports',sourceLabel:'Collecting Cars',sourceUrl:'https://collectingcars.com/for-sale/2012-morgan-roadster'},
 {registration:'FM56 XAN',name:'Subaru Impreza WRX STI RA-R',year:2006,era:'modern',type:'sports',sourceLabel:'Collecting Cars',sourceUrl:'https://collectingcars.com/for-sale/2006-subaru-impreza-wrx-sti-spec-c-type-ra-r'},
 {registration:'E824 MAS',name:'Toyota FJ40 Land Cruiser',year:1982,era:'classic',type:'4x4',sourceLabel:'Collecting Cars',sourceUrl:'https://collectingcars.com/for-sale/1982-toyota-fj40-land-cruiser'},
 {registration:'R716 JUA',name:'Land Rover Defender 90 300 Tdi',year:1997,era:'modern',type:'4x4',sourceLabel:'Collecting Cars',sourceUrl:'https://collectingcars.com/for-sale/1997-land-rover-defender-90-300-tdi-1'},
 {registration:'A18 XXJ',name:'Jaguar XJ-S 4.0 Coupé',year:1991,era:'classic',type:'grand-tourer',sourceLabel:'Collecting Cars',sourceUrl:'https://collectingcars.com/for-sale/1991-jaguar-xj-s-4-0-coupe'},
 {registration:'JGA 421',name:'Jaguar XK120 Roadster',year:1951,era:'classic',type:'classic',sourceLabel:'Collecting Cars',sourceUrl:'https://collectingcars.com/for-sale/1951-jaguar-xk120-roadster'},
 {registration:'APU 568A',name:'Aston Martin DB4 Series 5 Vantage',year:1963,era:'classic',type:'classic',sourceLabel:'Collecting Cars',sourceUrl:'https://collectingcars.com/for-sale/1963-aston-martin-db4-series-5-vantage'},

 {registration:'WXA 855',name:'MGA Twin Cam',year:1959,era:'classic',type:'classic',sourceLabel:'Mathewsons',sourceUrl:'https://www.mathewsons.co.uk/auction/lot/98-1959-mg-a-twin-cam/?lot=59090'},
 {registration:'ADB 361',name:'Austin 12/4 New Ascot',year:1938,era:'classic',type:'classic',sourceLabel:'Mathewsons',sourceUrl:'https://www.mathewsons.co.uk/auction/lot/34-1938-austin-124-new-ascot/?lot=35835'},
 {registration:'KAS 602',name:'Austin Mini Seven',year:1962,era:'classic',type:'city',sourceLabel:'Mathewsons',sourceUrl:'https://www.mathewsons.co.uk/auction/lot/408-1962-austin-mini-seven/?lot=57339'},
 {registration:'A21 ELU',name:'Ariel Atom 3',year:2010,era:'modern',type:'sports',sourceLabel:'Mathewsons',sourceUrl:'https://www.mathewsons.co.uk/auction/lot/lot-450---2010-ariel/?lot=46356'},
 {registration:'M900 AML',name:'Aston Martin DB9',year:2005,era:'modern',type:'grand-tourer',sourceLabel:'Mathewsons',sourceUrl:'https://www.mathewsons.co.uk/auction/lot/lot-266---2005-aston-martin-db9-auto/?lot=47931'},
 {registration:'H664 AKN',name:'Volkswagen Golf 4+E',year:1990,era:'classic',type:'city',sourceLabel:'Mathewsons',sourceUrl:'https://www.mathewsons.co.uk/auction/lot/442-1990-volkswagen-golf-4e/?lot=11710'},
 {registration:'AUB 153E',name:'Porsche 911 SWB',year:1966,era:'classic',type:'classic',sourceLabel:'H&H Classics',sourceUrl:'https://www.handh.co.uk/auction/lot/lot-141---1966-porsche-911/?lot=58892'}
];
