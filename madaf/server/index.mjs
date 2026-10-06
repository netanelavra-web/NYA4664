import {initializeApp,getApps} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {onCall,HttpsError} from 'firebase-functions/v2/https';
import {beforeUserCreated,beforeUserSignedIn,HttpsError as IdentityError} from 'firebase-functions/v2/identity';
import {ALLOWLIST_PATH,allowedRole} from './allowlist.mjs';
import {createHash} from 'node:crypto';
import {execute} from './domain/core.mjs';
import {project} from './projection.mjs';
if(!getApps().length)initializeApp();const db=getFirestore();const opts={region:'europe-west1',maxInstances:10};
const collections=['businesses','users','categories','products','orders','inventoryEvents','notifications','auditEvents'];
export const madafCommand=onCall(opts,async req=>{
 if(!req.auth)throw new HttpsError('unauthenticated','יש להתחבר');
 const cmd=req.data;if(!cmd||typeof cmd.key!=='string'||cmd.key.length>100||!cmd.key||typeof cmd.type!=='string')throw new HttpsError('invalid-argument','פקודה לא תקינה');
 if(JSON.stringify(cmd).length>100000)throw new HttpsError('invalid-argument','הבקשה גדולה מדי');
 const uid=req.auth.uid, receiptId=createHash('sha256').update(uid+':'+cmd.key).digest('hex');
 const canonical=v=>v&&typeof v==='object'?Array.isArray(v)?v.map(canonical):Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
 const fingerprint=createHash('sha256').update(JSON.stringify(canonical(cmd))).digest('hex');
 try{return await db.runTransaction(async tx=>{
 const metaRef=db.doc('private/meta'),receiptRef=db.doc('commandReceipts/'+receiptId);
 const [meta,receipt,allowlist,...snapshots]=await Promise.all([tx.get(metaRef),tx.get(receiptRef),tx.get(db.doc(ALLOWLIST_PATH)),...collections.map(c=>tx.get(db.collection(c)))]);
 if(!meta.exists)throw new HttpsError('failed-precondition','יש לאתחל את המערכת');
 const state={...meta.data(),receipts:{}};collections.forEach((c,i)=>state[c]=snapshots[i].docs.map(d=>d.data()));
 const user=state.users.find(u=>u.id===uid);const actor=user?{...user,id:uid}:{id:uid,role:'customer',name:req.auth.token.name||''};
 if(user?.active===false)throw new HttpsError('permission-denied','החשבון מושבת');
 // Allowlist is enforced on every call, not only at sign-in: removal takes effect even for still-valid ID tokens.
 const listedRole=allowedRole(allowlist.data(),req.auth.token.email,req.auth.token.email_verified);
 if(!listedRole)throw new HttpsError('permission-denied','החשבון אינו מורשה לגשת למדף');
 if(user&&user.role!==listedRole)throw new HttpsError('permission-denied','התפקיד ברשימת המורשים אינו תואם לחשבון');
 if(!user&&listedRole!=='customer')throw new HttpsError('failed-precondition','חשבון המנהל טרם אותחל (bootstrap)');
 if(receipt.exists){if(receipt.data().fingerprint!==fingerprint)throw new HttpsError('already-exists','מפתח פעולה כבר שימש לבקשה אחרת');return {actor,state:project(state,actor),duplicate:true};}
 if(!user&&cmd.type!=='onboard')throw new HttpsError('failed-precondition','יש להשלים פרטי עסק');
 const executionState=structuredClone(state);if(!user)executionState.users.push({...actor,businessId:null});
 const next=execute(executionState,cmd,actor);next.receipts={};
 const domainUser=next.users.find(u=>u.id===uid);const updatedActor=cmd.type==='onboard'?{...actor,businessId:domainUser?.businessId}:actor;
 if(cmd.type==='onboard'&&!updatedActor.businessId)throw new HttpsError('internal','שיוך העסק נכשל');
 // All reads precede writes. Metadata serializes conflicting commands; persistent receipt makes retries safe.
 const metadata={};for(const [k,v]of Object.entries(next))if(!collections.includes(k)&&k!=='receipts')metadata[k]=v;
 tx.set(metaRef,metadata);tx.set(db.doc('config/public'),{schemaVersion:next.schemaVersion,revision:next.revision,settings:next.settings});
 tx.set(receiptRef,{uid,key:cmd.key,fingerprint,revision:next.revision,createdAt:new Date().toISOString()});
 for(const c of collections){const before=new Map(state[c].map(d=>[d.id,d]));for(const item of next[c]){if(JSON.stringify(before.get(item.id))!==JSON.stringify(item))tx.set(db.doc(c+'/'+item.id),JSON.parse(JSON.stringify(item)));before.delete(item.id);}for(const id of before.keys())tx.delete(db.doc(c+'/'+id));}
 return {actor:updatedActor,state:project(next,updatedActor)};
 });}catch(e){if(e instanceof HttpsError)throw e;throw new HttpsError('failed-precondition',e.message,{code:e.code||'COMMAND_FAILED'});}
});

// Auth blocking functions (require Firebase Authentication with Identity Platform).
// An unlisted Google account never receives an ID token and no Auth user record is created for it.
const identityOpts={region:'europe-west1'};
async function assertListed(event){
 const snap=await db.doc(ALLOWLIST_PATH).get();
 if(!allowedRole(snap.data(),event.data?.email,event.data?.emailVerified))throw new IdentityError('permission-denied','החשבון אינו מורשה לגשת למדף');
}
export const madafBeforeCreate=beforeUserCreated(identityOpts,assertListed);
export const madafBeforeSignIn=beforeUserSignedIn(identityOpts,assertListed);
