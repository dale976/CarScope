import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export const repositoryRoot = process.env.CARSCOPE_ROOT ?? (process.env.NODE_ENV==='production' ? undefined : fileURLToPath(new URL('../../../../',import.meta.url)));
export function rootPath(path:string) {
 if(!repositoryRoot)throw new Error('Start production using the repository launcher.');
 return resolve(repositoryRoot,path);
}
