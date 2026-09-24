import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function workspacePaths(root:string, env:Record<string,string|undefined>) {
 return {root:resolve(root),cachePath:resolve(root,env.CAR_CACHE_PATH??'.cache/cars.json'),budgetPath:resolve(root,'.budget/marketcheck.sqlite')};
}
export function launchEnvironment(root:string,env:Record<string,string|undefined>,production:boolean):Record<string,string|undefined> {
 const paths=workspacePaths(root,env);
 // Cache is resolved by the server AFTER Bun loads root .env. Do not inject a default here.
 return {...env,CARSCOPE_ROOT:paths.root,CARSCOPE_BUDGET_PATH:paths.budgetPath,...(production?{NODE_ENV:'production'}:{})};
}
type App = 'search'|'buying-report';
function appName(value:string):App {if(value!=='search'&&value!=='buying-report')throw new Error('Unknown app');return value;}
async function child(args:string[],cwd=ROOT,env:Record<string,string|undefined>=process.env) {
 const proc=Bun.spawn([process.execPath,...args],{cwd,env,stdin:'inherit',stdout:'inherit',stderr:'inherit'});
 const stop=()=>proc.kill();process.on('SIGINT',stop);process.on('SIGTERM',stop);
 try {const code=await proc.exited;if(code!==0)throw new Error(`Command exited with status ${code}`);}
 finally {process.off('SIGINT',stop);process.off('SIGTERM',stop);}
}
export async function runApp(app:App,production:boolean) {
 const folder=resolve(ROOT,'apps',app);
 await child([`--env-file=${resolve(ROOT,'.env')}`,...(production?[]:['--hot']),production?resolve(folder,'dist/index.js'):resolve(folder,'src/server/index.ts')],production?resolve(folder,'dist'):ROOT,
 launchEnvironment(ROOT,process.env,production));
}
if(import.meta.main) {
 const [command,name]=process.argv.slice(2);
 try {
  if(command==='dev'||command==='start')await runApp(appName(name??'search'),command==='start');
  else if(command==='build')for(const app of name?[appName(name)]:['search','buying-report']) await child(['build',`apps/${app}/src/server/index.ts`,'--target=bun',`--outdir=apps/${app}/dist`,'--production','--minify']);
  else throw new Error('Expected dev, start or build');
 }catch(error){console.error(error instanceof Error?error.message:'Launch failed');process.exitCode=1;}
}
