import {test,expect} from 'bun:test';
import {projectListing} from '../src/server/live';
import {liveDetailData,equipmentSections,equipmentHighlights} from '../src/shared/detail';
const raw=(id:string,extra={})=>({id,build:{make:'Porsche',model:'911',variant:'GTS',year:2020},price:80000,miles:20000,...extra});
test('reference prices preserve actual dates and reject invalid timestamps',()=>{
 const car=projectListing(raw('a',{ref_price:84000,ref_price_dt:1704067200,last_seen_at:1706745600}));
 expect(car.referencePrice).toBe(84000);expect(car.referenceDate).toBe('2024-01-01');
 const result=liveDetailData(car,[]);
 expect(result.car.history.map(p=>p.price)).toEqual([84000,80000]);
 expect(result.car.history[0]?.label).toBe('Previous reference price');
 expect(projectListing(raw('b',{ref_price_dt:1e30})).referenceDate).toBeNull();
 expect(liveDetailData(projectListing(raw('c')),[]).car.history).toEqual([]);
});
test('comparisons only use same-model current results, exclude self and retain missing prices',()=>{
 const car=projectListing(raw('a'));
 const other=projectListing(raw('b',{price:null}));
 const wrong=projectListing({...raw('c'),build:{make:'Porsche',model:'Cayman'}});
 expect(liveDetailData(car,[car,other,wrong,other]).comparables.map(c=>c.id)).toEqual(['b']);
});
test('equipment is deduplicated without declaring it standard or fitted',()=>{
 const sections=equipmentSections(['ABS','ABS','Carbon seats',' abs '],['Carbon seats','Carbon seats']);
 expect(sections.options).toEqual(['Carbon seats']);expect(sections.other).toEqual(['ABS']);
});

test('highlights favour recognised equipment over routine advert boilerplate',()=>{
 const highlights=equipmentHighlights(['ABS','Electric windows','Front axle lift','Reversing camera'],['Paint to sample']);
 expect(highlights.map(h=>h.text)).toEqual(['Paint to sample','Front axle lift','Reversing camera']);
 expect(highlights[0]?.option).toBe(true);
});
