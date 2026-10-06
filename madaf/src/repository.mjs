import { seed, execute } from './core.mjs';
const KEY='madaf-v2-state', SESSION='madaf-v2-session';
const copy=x=>structuredClone(x);
export async function createDemoRepository(){
 const isolated=!globalThis.navigator?.locks;
 let memory=seed(), listeners=new Set(), actor=null, sessionEpoch=0;
 const read=()=>{if(isolated)return copy(memory);try{const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw):copy(memory);}catch{throw new Error('נתוני הדמו במכשיר אינם קריאים. לא בוצע איפוס אוטומטי');}};
 if(!isolated)await navigator.locks.request('madaf-v2-commands',()=>{if(!localStorage.getItem(KEY))localStorage.setItem(KEY,JSON.stringify(memory));});
 let state=read();
 try{if(!isolated)actor=JSON.parse(sessionStorage.getItem(SESSION)||'null');}catch{}
 const emit=()=>listeners.forEach(f=>f(copy(state)));
 const session=()=>{if(isolated)return;try{sessionStorage.setItem(SESSION,JSON.stringify(actor));}catch{}};
 const repo={mode:'demo',persistence:isolated?'session':'local',notice:isolated?'דמו זמני בלשונית זו — הנתונים אינם נשמרים לאחר סגירה':null,get actor(){return actor;},snapshot:()=>copy(state),subscribe(f){listeners.add(f);return()=>listeners.delete(f);},async signIn(persona,businessId){sessionEpoch++;state=read();const member=state.users.find(u=>u.role==='customer'&&u.businessId===(businessId||'biz_demo'));actor=persona==='admin'?{id:'admin',role:'admin',name:'מנהל מדף'}:persona==='new'?{id:'new_'+crypto.randomUUID(),role:'customer',name:'לקוח חדש'}:{id:member?.id||'customer_demo',role:'customer',businessId:businessId||'biz_demo',name:'לקוח'};session();state=read();emit();return actor;},async signOut(){sessionEpoch++;actor=null;session();emit();},async command(cmd){if(!actor)throw new Error('יש להתחבר תחילה');const commandActor=copy(actor), epoch=sessionEpoch;
 const commit=async()=>{if(epoch!==sessionEpoch)throw new Error('החשבון השתנה; הפעולה בוטלה');const base=read();const input=copy(base);if(cmd.type==='onboard'&&!input.users.some(u=>u.id===commandActor.id))input.users.push({...commandActor,businessId:null});const next=execute(input,cmd,commandActor); if(!navigator.locks && read().revision!==base.revision)throw new Error('הנתונים השתנו בלשונית אחרת. יש לנסות שוב');
 try{if(!isolated)localStorage.setItem(KEY,JSON.stringify(next));}catch{throw new Error('לא ניתן לשמור במכשיר. פנו מקום ונסו שוב; הפעולה לא נשמרה');}memory=copy(next);state=next;
 if(cmd.type==='onboard'){const user=next.users.find(u=>u.id===actor.id);if(user)actor={...actor,businessId:user.businessId};session();}emit();return copy(state);};
 // Without Web Locks use isolated in-memory state: no unsafe cross-tab writes.
 if(isolated)return commit();
 return navigator.locks.request('madaf-v2-commands',commit);
 },async uploadImage(file,onProgress=()=>{}){if(actor?.role!=='admin')throw new Error('אין הרשאה');if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>1024*1024)throw new Error('בחרו תמונת PNG, JPEG או WebP עד 1MB');return new Promise((resolve,reject)=>{const r=new FileReader();r.onprogress=e=>{if(e.lengthComputable)onProgress(Math.round(e.loaded/e.total*100))};r.onload=()=>{onProgress(100);resolve(r.result)};r.onerror=()=>reject(new Error('קריאת התמונה נכשלה'));r.readAsDataURL(file);});}};
 addEventListener('storage',e=>{if(!isolated&&e.key===KEY){state=read();emit();}});return repo;
}
