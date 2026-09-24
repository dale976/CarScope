import {test,expect} from 'bun:test';
import {preferenceSuggestions,addPreference} from '../src/shared/preferences';
import {extractSpecEvidence,assessEvidence} from '../src/shared/specification';
test('suggestions respond to marque and model without changing generic choices',()=>{
 expect(preferenceSuggestions('Porsche','911')).toContain('Sport Chrono');
 expect(preferenceSuggestions('BMW','M3')).toContain('M Carbon bucket seats');
 expect(preferenceSuggestions('BMW','Z1')).not.toContain('M Carbon bucket seats');
 expect(preferenceSuggestions('Audi','R8')).toContain('Bang & Olufsen');
 expect(preferenceSuggestions('Mercedes-Benz','AMG GT')).toContain('Burmester');
});
test('custom preferences trim, deduplicate and preserve priority',()=>{
 const first=addPreference([],'  Front axle lift  ','must');
 expect(first).toEqual([{label:'Front axle lift',priority:'must'}]);
 expect(addPreference(first,'front AXLE lift','nice')).toEqual(first);
 expect(addPreference(first,'  ','nice')).toEqual(first);
});
test('fictional cross-marque evidence and custom terms stay conservative',()=>{
 for(const [label,phrase] of [['Sport Chrono','Sport Chrono package'],['Carbon seats','M Carbon bucket seats'],['Upgraded audio','Bang & Olufsen sound system'],['Upgraded audio','Burmester surround sound system']]){
  expect(assessEvidence(extractSpecEvidence({features:[phrase!],options:[],description:''},label!))).toBe('Advertised');
 }
 expect(assessEvidence(extractSpecEvidence({features:[],options:['Burmester'],description:''},'Burmester'))).toBe('Needs confirmation');
 expect(assessEvidence(extractSpecEvidence({features:[],options:[],description:'Front axle lift is not fitted.'},'Front axle lift'))).toBe('Advertised absent');
 expect(extractSpecEvidence({features:['anything'],options:[],description:''},'.*')).toEqual([]);
 expect(extractSpecEvidence({features:['manual gearbox'],options:[],description:''},'')).toEqual([]);
});
