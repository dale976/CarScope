import {test,expect} from 'bun:test';
import {searchModels,searchDerivatives} from '../src/shared/search-catalogue';
test('derivatives are available before any inventory request',()=>{
 expect(searchModels('Porsche')).toContain('911');
 const groups=searchDerivatives('Porsche',' 911 ');
 expect(groups.map(g=>g.label)).toContain('GT3 RS');
 expect(groups.find(g=>g.label==='GTS')?.variants).toContain('Carrera GTS Semi-auto');
 expect(groups.find(g=>g.label==='GT3')?.variants.some(v=>v.includes('RS'))).toBe(false);
 expect(searchDerivatives('Lotus','Exige').map(g=>g.label)).toContain('Sport 410');
 expect(searchDerivatives('Porsche','Unknown')).toEqual([]);
});
