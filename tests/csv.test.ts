import {test,expect} from 'bun:test';
import {parseCsv,importPrestigeCsv} from '../src/server/csv';
const header='id,make,model,variant,year,price,miles,dom_active,status_date,transmission,fuel_type,exterior_color,seller_name,city,features,options';
const row='demo,Porsche,911,Carrera,2020,70000,22000,12,2026-03-19T10:00:00Z,Manual,Petrol,Silver,Demo dealer,London,Air Conditioning|Heated Seats,';
test('CSV preserves quoted commas, escaped quotes and multiline cells',()=>{
 expect(parseCsv('\ufeffa,b\r\n"one,two","a""b\nnext"\r\n')).toEqual([{a:'one,two',b:'a"b\nnext'}]);
});
test('rejects unclosed quotes and unequal column counts',()=>{
 expect(()=>parseCsv('a,b\n"bad')).toThrow();expect(()=>parseCsv('a,b\nx')).toThrow();
});
test('imports prestige only without inventing price history',()=>{
 const data=importPrestigeCsv(header+'\n'+row+'\n'+row.replace('demo,Porsche','other,Ford'));
 expect(data.source).toBe('imported');expect(data.cars).toHaveLength(1);
 expect(data.cars[0]!.history).toEqual([{date:'2026-03-19',price:70000}]);
 expect(data.cars[0]!.features).toContain('Air conditioning');
});
test('does not coerce missing required numbers to zero',()=>{
 expect(()=>importPrestigeCsv(header+'\n'+row.replace(',70000,',',,'))).toThrow();
});
