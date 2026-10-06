import {mkdir,copyFile} from 'node:fs/promises';
await mkdir(new URL('../domain/',import.meta.url),{recursive:true});
await copyFile(new URL('../../src/core.mjs',import.meta.url),new URL('../domain/core.mjs',import.meta.url));
try{await copyFile(new URL('../../src/seed.mjs',import.meta.url),new URL('../domain/seed.mjs',import.meta.url));}catch(e){if(e.code!=='ENOENT')throw e;}
