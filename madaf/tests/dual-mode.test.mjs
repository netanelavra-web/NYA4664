import test from 'node:test';import assert from 'node:assert/strict';import {seed,execute,DomainError} from '../src/core.mjs';
// An admin may also act as a customer of its own business (mode switch); customer commands depend on owning a business.
let key=0;const run=(s,type,payload,actor)=>execute(s,{type,key:`d${++key}`,...payload},actor);
const rejection=(fn,code)=>assert.throws(fn,e=>e instanceof DomainError&&e.code===code);
const biz={name:'עסק המנהל',contactName:'מנהל',phone:'0501234567',address:'רחוב הבדיקה 1, תל אביב',taxId:'514000001'};
const fixture=()=>{const s=seed();s.orders=[];s.receipts={};s.settings.minimumOrder=10000;s.users.push({id:'boss',role:'admin',businessId:null});return s;};
test('admin without a business cannot order, can onboard, then orders and approves it',()=>{let s=fixture();const boss={id:'boss',role:'admin'};
 const order={items:[{productId:'p1',quantity:2}],expectedPrices:Object.fromEntries(s.products.map(p=>[p.id,p.price]))};
 rejection(()=>run(s,'submitOrder',order,boss),'BUSINESS_REQUIRED');
 s=run(s,'onboard',{business:biz},boss);const businessId=s.users.find(u=>u.id==='boss').businessId;assert.ok(businessId);
 rejection(()=>run(s,'onboard',{business:biz},{...boss,businessId}),'ALREADY_ONBOARDED');
 s=run(s,'submitOrder',order,{...boss,businessId});const o=s.orders.at(-1);assert.equal(o.businessId,businessId);
 s=run(s,'approveOrder',{orderId:o.id,version:o.version},{...boss,businessId});assert.notEqual(s.orders.at(-1).status,'pending_approval');});
test('admin in customer mode cannot file a request on another business order',()=>{let s=fixture();const cust={id:'customer_demo',role:'customer',businessId:'biz_demo'};
 s=run(s,'submitOrder',{items:[{productId:'p1',quantity:2}],expectedPrices:Object.fromEntries(s.products.map(p=>[p.id,p.price]))},cust);
 const o=s.orders.at(-1);assert.equal(o.status,'received');const v=o.version;
 s=run(s,'onboard',{business:biz},{id:'boss',role:'admin'});const businessId=s.users.find(u=>u.id==='boss').businessId;
 rejection(()=>run(s,'requestCancel',{orderId:o.id,version:v},{id:'boss',role:'admin',businessId}),'FORBIDDEN');});
