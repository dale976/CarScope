import {test,expect} from 'bun:test';
import {assessEvidence} from '../src/shared/specification';
test('missing evidence is unknown, not absent',()=>expect(assessEvidence([])).toBe('Unknown'));
test('options alone do not establish fitment',()=>expect(assessEvidence([{source:'Options list',claim:'unconfirmed',text:'Carbon seats'}])).toBe('Needs confirmation'));
test('contradictory claims require confirmation',()=>expect(assessEvidence([{source:'Features list',claim:'present',text:'Carbon seats'},{source:'Seller description',claim:'absent',text:'Standard seats; carbon seats not fitted.'}])).toBe('Needs confirmation'));
test('explicit absence is preserved',()=>expect(assessEvidence([{source:'Seller description',claim:'absent',text:'Not fitted.'}])).toBe('Advertised absent'));
test('positive advertised evidence is not labelled verified',()=>expect(assessEvidence([{source:'Features list',claim:'present',text:'Air conditioning'}])).toBe('Advertised'));

import {extractSpecEvidence} from '../src/shared/specification';
const evidence=(description:string,label='Carbon seats')=>extractSpecEvidence({features:[],options:[],description},label);
test('recognizes equipment aliases without confusing ceramic coating or carbon trim',()=>{
 expect(assessEvidence(extractSpecEvidence({features:['PCCB','Dual-zone climate control'],options:[],description:''},'Ceramic brakes'))).toBe('Advertised');
 expect(assessEvidence(extractSpecEvidence({features:['Dual-zone climate control'],options:[],description:''},'Air conditioning'))).toBe('Advertised');
 expect(evidence('Carbon dashboard and ceramic paint coating.','Ceramic brakes')).toEqual([]);
 expect(evidence('Carbon dashboard and sports seats.')).toEqual([]);
});
test('seller claims need positive wording; options and speculative mentions stay uncertain',()=>{
 expect(assessEvidence(evidence('Equipped with carbon bucket seats.'))).toBe('Advertised');
 expect(assessEvidence(evidence('Carbon bucket seats available at extra cost.'))).toBe('Needs confirmation');
 expect(assessEvidence(evidence('Carbon seats? Please confirm.'))).toBe('Needs confirmation');
 expect(assessEvidence(extractSpecEvidence({features:[],options:['Carbon seats'],description:''},'Carbon seats'))).toBe('Needs confirmation');
});
test('handles negation, removal and contradicting sources',()=>{
 expect(assessEvidence(evidence('Carbon seats are not fitted.'))).toBe('Advertised absent');
 expect(assessEvidence(evidence('Without carbon bucket seats.'))).toBe('Advertised absent');
 expect(assessEvidence(evidence('Carbon seats have been removed.'))).toBe('Needs confirmation');
 expect(assessEvidence(extractSpecEvidence({features:['Carbon seats'],options:[],description:'Carbon seats are not fitted.'},'Carbon seats'))).toBe('Needs confirmation');
});
test('keeps exact source evidence and treats ambiguous negation conservatively',()=>{
 const text='Equipped with Sport Chrono package.';
 expect(evidence(text,'Sport Chrono')[0]).toEqual({source:'Seller description',claim:'present',text});
 expect(assessEvidence(evidence('Not only carbon seats but also sports exhaust.'))).not.toBe('Advertised absent');
 expect(assessEvidence(evidence('No accidents, equipped with carbon seats.'))).toBe('Needs confirmation');
});

test('custom preference capitalization and typography do not disable known aliases',()=>{
 const text='Equipped with dual–zone climate control.';
 const result=extractSpecEvidence({features:[],options:[],description:text},'air conditioning');
 expect(assessEvidence(result)).toBe('Advertised');expect(result[0]?.text).toBe(text);
 expect(assessEvidence(extractSpecEvidence({features:['Sport‑Chrono package'],options:[],description:''},'SPORT CHRONO'))).toBe('Advertised');
 expect(assessEvidence(extractSpecEvidence({features:['Head–up display'],options:[],description:''},'Head-up display'))).toBe('Advertised');
 expect(assessEvidence(extractSpecEvidence({features:['Front   axle lift'],options:[],description:''},'Front axle lift'))).toBe('Advertised');
});
test('normalization does not erase negation or turn options into fitted equipment',()=>{
 expect(assessEvidence(evidence('Sport‑Chrono is not fitted.','sport chrono'))).toBe('Advertised absent');
 expect(assessEvidence(extractSpecEvidence({features:[],options:['Sport‑Chrono'],description:''},'sport chrono'))).toBe('Needs confirmation');
 expect(evidence('Carbon fibre dashboard, standard sports seats.','carbon seats')).toEqual([]);
});
