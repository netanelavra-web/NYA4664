// Manage admins and blocked accounts without redeploying.
//   npm run allow -- PROJECT_ID list
//   npm run allow -- PROJECT_ID add EMAIL        # full access: admin + own customer side
//   npm run allow -- PROJECT_ID remove EMAIL     # back to customer-only
//   npm run allow -- PROJECT_ID disable EMAIL    # block the account entirely (any role)
//   npm run allow -- PROJECT_ID enable EMAIL
// Changes are written to the profile too, so Rules apply them immediately; sessions are revoked on remove/disable.
import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getFirestore,FieldValue,FieldPath} from 'firebase-admin/firestore';
import {getAuth} from 'firebase-admin/auth';
import {ALLOWLIST_PATH,normalizeEmail} from '../allowlist.mjs';
const [projectId,action,rawEmail]=process.argv.slice(2);const email=normalizeEmail(rawEmail);
const usage='Usage: npm run allow -- PROJECT_ID list | add EMAIL | remove EMAIL | disable EMAIL | enable EMAIL';
if(!projectId||!['list','add','remove','disable','enable'].includes(action))throw Error(usage);
if(action!=='list'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw Error('Invalid email. '+usage);
initializeApp({credential:applicationDefault(),projectId});const db=getFirestore(),ref=db.doc(ALLOWLIST_PATH);
if(action==='list'){
 const admins=Object.entries((await ref.get()).data()?.emails||{}).filter(([,r])=>r==='admin').map(([e])=>({email:e,access:'admin + customer'}));
 const off=(await db.collection('users').where('active','==',false).get()).docs;
 const blocked=await Promise.all(off.map(async d=>({email:(await getAuth().getUser(d.id).catch(()=>null))?.email||d.id,access:'disabled'})));
 console.table([...admins,...blocked]);console.log('Everyone else who signs in with Google: customer only.');process.exit(0);
}
const authUser=await getAuth().getUserByEmail(email).catch(()=>null);
const profile=authUser?db.doc('users/'+authUser.uid):null;const exists=profile?(await profile.get()).exists:false;
if(action==='add'){await ref.set({emails:{[email]:'admin'}},{merge:true});if(exists)await profile.update({role:'admin'});console.log('Admin:',email);}
if(action==='remove'){await ref.update(new FieldPath('emails',email),FieldValue.delete());if(exists)await profile.update({role:'customer'});if(authUser)await getAuth().revokeRefreshTokens(authUser.uid);console.log('Customer only:',email);}
if(action==='disable'){if(!exists)throw Error('No profile for '+email+' yet (never used Madaf).');await profile.update({active:false});await getAuth().revokeRefreshTokens(authUser.uid);console.log('Disabled:',email);}
if(action==='enable'){if(!exists)throw Error('No profile for '+email);await profile.update({active:true});console.log('Enabled:',email);}
