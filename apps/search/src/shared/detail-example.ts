/** Entirely invented responses shaped like the public schema. No captured supplier data. */
const base={build:{make:'Porsche',model:'911',variant:'Carrera GTS',year:2021,transmission:'Automatic'},price:84950,miles:18400,dom_active:48,ref_price:87950,ref_price_dt:Date.UTC(2026,7,1)/1000,last_seen_at:Date.UTC(2026,8,18)/1000,dealer:{name:'Fictional Motor House',city:'Example town'},media:{photo_links:[]},extra:{
 features:['ABS','Airbags','Electric windows','Remote locking','Heated mirrors','Trip computer','LED headlights','Tyre pressure monitor','Rain sensor','Start-stop system','12V socket','Cup holders','Floor mats','ISOFIX','Alarm','Immobiliser','Power steering','Carbon bucket seats','Sport Chrono package','Reversing camera','BOSE surround sound','Front axle lift'],
 options:['Carbon bucket seats','Sport Chrono package','Paint to sample'],
 seller_comments:'Fictional advert for interface testing. Fitted with carbon bucket seats, Sport Chrono and a reversing camera. Front axle lift is fitted. Paint to sample is listed as an option; confirm its specification with the seller.'}};
export const detailExamples=[
 {label:'Rich specification',response:{...base,id:'fictional-rich'}},
 {label:'Missing information',response:{id:'fictional-missing',build:{make:'Porsche',model:'911'},price:79950}},
 {label:'Conflicting equipment',response:{...base,id:'fictional-conflict',extra:{...base.extra,seller_comments:'Fictional advert: carbon seats are not fitted. Sport Chrono may be available. Front axle lift is not fitted.'}}},
];
export const exampleComparisons=[{...base,id:'fictional-comparison-1',price:82950,miles:26000},{...base,id:'fictional-comparison-2',price:89950,miles:12500}];
