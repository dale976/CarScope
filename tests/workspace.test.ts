import {expect,test} from 'bun:test';
import {workspacePaths} from '../scripts/workspace';
test('persistent files resolve against root',()=>{
 const p=workspacePaths('/tmp/carscope',{});
 expect(p.budgetPath).toBe('/tmp/carscope/.budget/marketcheck.sqlite');
 expect(p.cachePath).toBe('/tmp/carscope/.cache/cars.json');
 expect(workspacePaths('/tmp/carscope',{CAR_CACHE_PATH:'custom/cars.json'}).cachePath).toBe('/tmp/carscope/custom/cars.json');
});
import {launchEnvironment} from '../scripts/workspace';
test('launcher lets the child load cache settings from root dotenv',()=>{
 const env=launchEnvironment('/tmp/carscope',{},true);
 expect(env.CAR_CACHE_PATH).toBeUndefined();
 expect(env.CARSCOPE_ROOT).toBe('/tmp/carscope');
 expect(env.CARSCOPE_BUDGET_PATH).toBe('/tmp/carscope/.budget/marketcheck.sqlite');
 expect(launchEnvironment('/tmp/carscope',{CAR_CACHE_PATH:'custom/cars.json'},false).CAR_CACHE_PATH).toBe('custom/cars.json');
});
