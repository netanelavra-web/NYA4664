export async function createFirebaseRepository(config){
 const base='https://www.gstatic.com/firebasejs/11.10.0/';
 const [appSDK,authSDK,fs,fn,storage]=await Promise.all(['app','auth','firestore','functions','storage'].map(n=>import(base+'firebase-'+n+'.js')));
 const app=appSDK.initializeApp(config),auth=authSDK.getAuth(app),db=fs.getFirestore(app),functions=fn.getFunctions(app,'europe-west1'),bucket=storage.getStorage(app);
 if(config.emulators){authSDK.connectAuthEmulator(auth,'http://127.0.0.1:9099');fs.connectFirestoreEmulator(db,'127.0.0.1',8080);fn.connectFunctionsEmulator(functions,'127.0.0.1',5001);storage.connectStorageEmulator(bucket,'127.0.0.1',9199);}
 const blank=()=>({schemaVersion:2,revision:0,settings:{minimumOrder:150000,vatRate:.18},businesses:[],users:[],categories:[],products:[],orders:[],inventoryEvents:[],auditEvents:[],notifications:[],receipts:{}});
 let actor=null,state=blank(),unsubs=[],listeners=new Set(),generation=0;
 const emit=()=>listeners.forEach(f=>f(structuredClone(state)));
 const fail=e=>{repo.error=e.message;emit();};
 async function load(user){const token=++generation;unsubs.forEach(f=>f());unsubs=[];state=blank();actor=null;emit();if(!user)return;
 // session lets the server provision/sync the profile from the admin allowlist before we read it.
 try{await fn.httpsCallable(functions,'madafCommand')({type:'session',key:'session-'+crypto.randomUUID()});}catch(e){console.warn('session sync failed',e);}
 if(token!==generation)return;
 const profile=await fs.getDoc(fs.doc(db,'users',user.uid));if(token!==generation)return;actor=profile.exists()?profile.data():{id:user.uid,role:'customer',businessId:null,name:user.displayName||''};state.users=[actor];
 // No server-created profile yet: only onboarding is possible. Rules deny catalog reads until madafCommand creates it.
 if(!profile.exists()){emit();return;}
 const watch=(name,q)=>unsubs.push(fs.onSnapshot(q,s=>{if(token!==generation)return;state[name]=s.docs.map(d=>d.data());emit();},fail));
 unsubs.push(fs.onSnapshot(fs.doc(db,'config/public'),s=>{if(token===generation&&s.exists()){Object.assign(state,s.data());emit();}},fail));
 const admin=actor.role==='admin';
 for(const name of ['products','categories'])watch(name,admin?fs.collection(db,name):fs.query(fs.collection(db,name),fs.where('active','==',true)));
 if(admin){for(const name of ['users','businesses','orders','inventoryEvents','auditEvents','notifications'])watch(name,fs.collection(db,name));}
 else if(actor.businessId){watch('businesses',fs.query(fs.collection(db,'businesses'),fs.where(fs.documentId(),'==',actor.businessId)));watch('orders',fs.query(fs.collection(db,'orders'),fs.where('businessId','==',actor.businessId)));}emit();
 }
 let loading=null,loadingUid=undefined;
 const queueLoad=user=>{const uid=user?.uid||null;if(loading&&loadingUid===uid)return loading;loadingUid=uid;loading=load(user);return loading;};
 const repo={mode:'firebase',error:null,get actor(){return actor;},snapshot:()=>structuredClone(state),subscribe(f){listeners.add(f);return()=>listeners.delete(f);},async signIn(){let result;try{result=await authSDK.signInWithPopup(auth,new authSDK.GoogleAuthProvider());}catch(e){if(/BLOCKING_FUNCTION|blocking-function|permission-denied|אינו מורשה/i.test(String(e.message)+String(e.code)))throw Error('החשבון הזה אינו מורשה לגשת למדף. לבקשת גישה פנו למנהל המערכת.');throw e;}await queueLoad(result.user);return actor;},async signOut(){await authSDK.signOut(auth);await queueLoad(null);},async command(cmd){repo.error=null;try{const result=await fn.httpsCallable(functions,'madafCommand')(cmd);state=result.data.state;actor=result.data.actor;emit();if(cmd.type==='onboard'){loading=null;await queueLoad(auth.currentUser);};return structuredClone(state);}catch(e){const err=new Error(e.message||'הפעולה נכשלה');err.code=e.details?.code||e.code;err.details=e.details;throw err;}},async uploadImage(file,onProgress=()=>{}){if(actor?.role!=='admin')throw Error('אין הרשאה');if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>1048576)throw Error('בחרו תמונת PNG, JPEG או WebP עד 1MB');const target=storage.ref(bucket,'products/'+crypto.randomUUID());const task=storage.uploadBytesResumable(target,file,{contentType:file.type});task.on('state_changed',snapshot=>onProgress(Math.round(snapshot.bytesTransferred/snapshot.totalBytes*100)));await task;return storage.getDownloadURL(target);}};
 await new Promise(resolve=>{let first=true;authSDK.onAuthStateChanged(auth,user=>{queueLoad(user).then(()=>{if(first){first=false;resolve();}}).catch(e=>{fail(e);if(first){first=false;resolve();}});});});return repo;
}
