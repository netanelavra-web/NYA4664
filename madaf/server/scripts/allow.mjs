// Manage the allowlist without redeploying.
//   npm run allow -- PROJECT_ID list
//   npm run allow -- PROJECT_ID add EMAIL [customer|admin]
//   npm run allow -- PROJECT_ID remove EMAIL
// Remove also deactivates the user's profile (Rules deny reads at once) and revokes refresh tokens.
import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getFirestore,FieldValue,FieldPath} from 'firebase-admin/firestore';
import {getAuth} from 'firebase-admin/auth';
import {ALLOWLIST_PATH,ROLES,normalizeEmail} from '../allowlist.mjs';
const [projectId,action,rawEmail,role='customer']=process.argv.slice(2);const email=normalizeEmail(rawEmail);
const usage='Usage: npm run allow -- PROJECT_ID list | add EMAIL [customer|admin] | remove EMAIL';
if(!projectId||!['list','add','remove'].includes(action))throw Error(usage);
if(action!=='list'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw Error('Invalid email. '+usage);
if(action==='add'&&!ROLES.includes(role))throw Error('Role must be customer or admin');
initializeApp({credential:applicationDefault(),projectId});const db=getFirestore(),ref=db.doc(ALLOWLIST_PATH);
const authUser=email?await getAuth().getUserByEmail(email).catch(()=>null):null;
if(action==='list'){console.table(Object.entries((await ref.get()).data()?.emails||{}).map(([e,r])=>({email:e,role:r})));process.exit(0);}
if(action==='add'){
 await ref.set({emails:{[email]:role}},{merge:true});
 // Re-adding a previously removed account reactivates its existing profile.
 if(authUser){const p=db.doc('users/'+authUser.uid),s=await p.get();if(s.exists){if(s.data().role!==role)throw Error('Profile exists with role '+s.data().role+'; refusing to change role here.');await p.update({active:true});}}
 console.log('Allowed',email,'as',role);
}
if(action==='remove'){
 await ref.update(new FieldPath('emails',email),FieldValue.delete());
 if(authUser){const p=db.doc('users/'+authUser.uid);if((await p.get()).exists)await p.update({active:false});await getAuth().revokeRefreshTokens(authUser.uid);}
 console.log('Removed',email,authUser?'(profile deactivated, sessions revoked)':'(no Auth user yet)');
}
