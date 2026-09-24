import {test,expect} from 'bun:test';
import {exampleForRegistration,parseBuyerInputs} from '../src/shared/journey';
test('registration is normalized and only local examples resolve',()=>{
 expect(exampleForRegistration(' df74 fpa ')).toBe('porsche');
 expect(exampleForRegistration('YJ22 ACU')).toBe('lotus');
 expect(exampleForRegistration('LD17 VAE')).toBe('tesla');
 expect(exampleForRegistration('AB12ABC')).toBeNull();
 expect(exampleForRegistration('../../porsche')).toBeNull();
});
test('optional inputs preserve unknowns and reject invalid amounts',()=>{
 expect(parseBuyerInputs('','')).toEqual({mileage:null,askingPrice:null});
 expect(parseBuyerInputs('12100','75000')).toEqual({mileage:12100,askingPrice:75000});
 for(const bad of ['-1','1.5','NaN','1e9'])expect(()=>parseBuyerInputs(bad,'')).toThrow();
 expect(()=>parseBuyerInputs('','0')).toThrow();
});

test('Fiat sandbox registration is supported without allowing arbitrary provider lookups',()=>{
 expect(exampleForRegistration('sl60 auc')).toBe('fiat');
 expect(exampleForRegistration('SL60AUB')).toBeNull();
});
