export function project(state, actor){
 if(actor.role==='admin')return {...state,receipts:{}};
 const business=state.businesses.find(b=>b.id===actor.businessId);
 const visible=business?.active!==false;
 return {...state,businesses:business?[business]:[],users:state.users.filter(u=>u.id===actor.id),categories:visible?state.categories.filter(c=>c.active):[],products:visible?state.products.filter(p=>p.active):[],orders:state.orders.filter(o=>o.businessId===actor.businessId),inventoryEvents:[],auditEvents:[],notifications:[],receipts:{}};
}
