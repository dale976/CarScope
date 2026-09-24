import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {exampleForRegistration} from '../shared/journey';
import type {BuyingReport} from '../shared/report';

function isBuyingReport(value:unknown):value is BuyingReport {
 if(!value||typeof value!=='object')return false;
 const report=value as Partial<BuyingReport>;
 return report.kind==='sandbox-example'&&!!report.registration&&!!report.vehicle&&typeof report.vehicle.name==='string'&&Array.isArray(report.findings)&&Array.isArray(report.checks)&&Array.isArray(report.costs)&&Array.isArray(report.sellerQuestions);
}

export function loadMockReport(registration:string,root=process.env.CARSCOPE_ROOT??fileURLToPath(new URL('../../../../',import.meta.url))):BuyingReport {
 const example=exampleForRegistration(registration);
 if(!example)throw new Error('Mock vehicle unavailable. Choose one of the example vehicles.');
 try {
  const parsed:unknown=JSON.parse(readFileSync(resolve(root,`.local/${example}-report.json`),'utf8'));
  const value:unknown=parsed&&typeof parsed==='object'&&!('registration' in parsed)?{...parsed,registration:registration.toUpperCase().replace(/\s/g,'')}:parsed;
  if(!isBuyingReport(value))throw new Error('Invalid normalized report');
  return value;
 } catch(error) {
  if(error instanceof Error&&error.message==='Invalid normalized report')throw new Error('Mock vehicle data is incomplete.');
  throw new Error('Mock vehicle unavailable. Choose one of the example vehicles.');
 }
}
