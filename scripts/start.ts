import {runApp} from './workspace';
const app=process.argv[2]??'search';
if(app!=='search'&&app!=='buying-report')throw new Error('Unknown app');
await runApp(app,true);
