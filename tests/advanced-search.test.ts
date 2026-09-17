import {test,expect} from 'bun:test';
import {search} from '../src/server/search';
import {loadData} from '../src/server/data';
import {readConfig} from '../src/server/config';
const data=await loadData(readConfig({}));
test('precise filters combine with text and year range',()=>{const r=search(data,new URLSearchParams('make=Porsche&model=911&generation=992.1&derivative=GTS&minYear=2020&maxYear=2023&q=automatic'));expect(r.total).toBe(1);expect(r.cars[0]!.trim).toBe('GTS');expect(r.derivatives).not.toContain('GT4');});
test('generation is never inferred from year',()=>{const r=search(data,new URLSearchParams('make=Alpine&model=A110&generation=Unknown'));expect(r.total).toBe(1);expect(r.cars[0]!.generation).toBeUndefined();});
test('invalid ranges are rejected and empty results preserve model options',()=>{expect(()=>search(data,new URLSearchParams('minYear=2023&maxYear=2000'))).toThrow();expect(()=>search(data,new URLSearchParams('minYear=abc'))).toThrow();const r=search(data,new URLSearchParams('make=Porsche&maxPrice=1'));expect(r.total).toBe(0);expect(r.models).toContain('911');});
