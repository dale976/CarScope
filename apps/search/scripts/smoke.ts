import {ROOT} from '../../../scripts/workspace';
export {};
// Local-only production smoke check. Run after building; no car-data providers.
const port = 39000 + Math.floor(Math.random()*10000);
const base = new URL(`http://127.0.0.1:${port}`);
const child = Bun.spawn([process.execPath, 'scripts/start.ts'], {
  cwd: ROOT,
  env: {...process.env, HOST:'127.0.0.1',PORT:String(port),DATA_MODE:'mock'},
  stdout:'ignore',stderr:'pipe',
});
async function check(path:string) {
  const response=await fetch(new URL(path,base));
  if(!response.ok)throw new Error(`${path}: HTTP ${response.status}`);
  return response;
}
try {
  let ready=false;
  for(let i=0;i<80;i++) {
    try {await check('/api/status');ready=true;break;} catch {await Bun.sleep(50);}
  }
  if(!ready)throw new Error('Production server did not start.');
  const html=await (await check('/')).text();
  const assets=[...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(m=>m[1]!);
  if(assets.length<2)throw new Error('Bundled JavaScript/CSS links missing.');
  for(const asset of assets){if(new URL(asset,base).origin!==base.origin)throw new Error('Unexpected external asset');await check(asset);}
  await check('/live');
  await check('/detail-demo');
  await check('/cars/lotus-410-01');
  const detail=await (await check('/api/cars/lotus-410-01')).json();
  if(detail.car.price!==64950||detail.comparables.length!==3)throw new Error('Unexpected detail response.');
  console.log(`Production smoke passed: HTML, ${assets.length} bundled assets, deep link and detail API.`);
} finally {child.kill();await child.exited;}
