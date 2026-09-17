import {test,expect} from 'bun:test';
import {groupDerivatives,derivativeFamily} from '../src/shared/derivatives';
test('GTS groups preserve exact drivetrain and body variants',()=>{const values=['Carrera Gts Semi-auto','Carrera 4 Gts Auto','Targa 4 Gts Manual'];const groups=groupDerivatives('Porsche','911',values.map(value=>({value,count:1})));expect(groups).toHaveLength(1);expect(groups[0]!.label).toBe('GTS');expect(groups[0]!.variants.map(v=>v.value)).toEqual(values);});
test('GT3 RS stays distinct while Touring is selectable within GT3',()=>{expect(derivativeFamily('Porsche','911','Gt3 Rs Semi-auto')).toBe('GT3 RS');expect(derivativeFamily('Porsche','911','Gt3 Touring Semi-auto')).toBe('GT3');});
test('other marques only merge transmission suffixes; ambiguous codes stay distinct',()=>{expect(derivativeFamily('BMW','M3','Competition M Xdrive Auto')).toBe('Competition M Xdrive');expect(derivativeFamily('Porsche','911','T S Semi-auto')).toBe('T S');});
