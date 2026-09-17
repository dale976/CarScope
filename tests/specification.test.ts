import {test,expect} from 'bun:test';
import {assessEvidence} from '../src/shared/specification';
test('missing evidence is unknown, not absent',()=>expect(assessEvidence([])).toBe('Unknown'));
test('options alone do not establish fitment',()=>expect(assessEvidence([{source:'Options list',claim:'unconfirmed',text:'Carbon seats'}])).toBe('Needs confirmation'));
test('contradictory claims require confirmation',()=>expect(assessEvidence([{source:'Features list',claim:'present',text:'Carbon seats'},{source:'Seller description',claim:'absent',text:'Standard seats; carbon seats not fitted.'}])).toBe('Needs confirmation'));
test('explicit absence is preserved',()=>expect(assessEvidence([{source:'Seller description',claim:'absent',text:'Not fitted.'}])).toBe('Advertised absent'));
test('positive advertised evidence is not labelled verified',()=>expect(assessEvidence([{source:'Features list',claim:'present',text:'Air conditioning'}])).toBe('Advertised'));
