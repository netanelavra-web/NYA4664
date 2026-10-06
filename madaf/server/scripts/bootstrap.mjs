// One-time initialization of an empty Madaf system: private/meta, config/public, the admin user and its allowlist entry.
// No demo catalog: categories and products start empty. Refuses to run twice.
import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {getAuth} from 'firebase-admin/auth';
import {seed} from '../domain/core.mjs';
import {ALLOWLIST_PATH,normalizeEmail} from '../allowlist.mjs';
const [projectId,rawEmail]=process.argv.slice(2);const adminEmail=normalizeEmail(rawEmail);
if(!projectId||!adminEmail.includes('@'))throw Error('Usage: npm run bootstrap -- PROJECT_ID ADMIN_EMAIL');
initializeApp({credential:applicationDefault(),projectId});const db=getFirestore();
// The admin must have signed in once (allowlisted via `npm run allow -- add`), so the Auth UID exists.
const adminUser=await getAuth().getUserByEmail(adminEmail).catch(()=>{throw Error('No Auth user for '+adminEmail+'. Sign in once at /app/ first.');});
const state=seed();
Object.assign(state,{businesses:[],categories:[],products:[],orders:[],inventoryEvents:[],notifications:[],auditEvents:[],receipts:{},revision:0,users:[{id:adminUser.uid,role:'admin',name:adminUser.displayName||'מנהל מדף',active:true}]});
const keys=['businesses','users','categories','products','orders','inventoryEvents','notifications','auditEvents'];
await db.runTransaction(async tx=>{
 const meta=db.doc('private/meta');if((await tx.get(meta)).exists)throw Error('Already initialized; refusing to overwrite');
 const metadata={};for(const[k,v]of Object.entries(state))if(!keys.includes(k)&&k!=='receipts')metadata[k]=v;
 tx.create(meta,metadata);
 tx.set(db.doc('config/public'),{schemaVersion:2,revision:0,settings:state.settings});
 tx.set(db.doc(ALLOWLIST_PATH),{emails:{[adminEmail]:'admin'}},{merge:true});
 for(const k of keys)for(const row of state[k])tx.set(db.doc(k+'/'+row.id),JSON.parse(JSON.stringify(row)));
});
console.log('Initialized empty system. Admin:',adminEmail,adminUser.uid);
