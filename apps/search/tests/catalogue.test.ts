import {test,expect} from 'bun:test';
import {eligible,canonicalMake} from '../src/shared/catalogue';
const car=(make:string,model:string,trim='Base')=>({make,model,trim});
test('all-model marques and explicit models',()=>{expect(eligible(car('Porsche','Macan'))).toBe(true);expect(eligible(car('Toyota','Supra'))).toBe(true);expect(eligible(car('Toyota','Corolla','Supra inspired'))).toBe(false);expect(canonicalMake('Alpha Romeo')).toBe('Alfa Romeo');});
test('performance derivatives do not admit cosmetic trims',()=>{expect(eligible(car('Audi','RS6'))).toBe(true);expect(eligible(car('Audi','A6','S line'))).toBe(false);expect(eligible(car('BMW','320i','M Sport'))).toBe(false);expect(eligible(car('BMW','X3','M40i'))).toBe(true);expect(eligible(car('Alfa Romeo','Giulia','Quadrifoglio'))).toBe(true);expect(eligible(car('Alfa Romeo','Giulia','Veloce'))).toBe(false);});
test('Mustang requires V8 evidence and aliases normalize',()=>{expect(eligible(car('Ford','Mustang','EcoBoost'))).toBe(false);expect(eligible(car('Ford','Mustang','GT'))).toBe(true);expect(eligible(car('Lexus','LF-A'))).toBe(true);expect(eligible(car('Maserati','Gran Turismo'))).toBe(true);});
