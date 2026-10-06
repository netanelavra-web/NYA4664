import test from 'node:test';
import assert from 'node:assert/strict';
import {grantedRole,isListedAdmin,normalizeEmail} from '../allowlist.mjs';
const list={emails:{'netanelavra@gmail.com':'admin','david.om.cohen@gmail.com':'admin','old@x.com':'customer'}};
test('listed verified emails are admins, case-insensitive',()=>{assert.equal(grantedRole(list,'NetanelAvra@gmail.com',true),'admin');assert.equal(grantedRole(list,' david.om.cohen@gmail.com ',true),'admin');});
test('unlisted, unverified, non-admin entries or missing list are customers',()=>{for(const [e,v,l] of [['stranger@gmail.com',true,list],['david.om.cohen@gmail.com',false,list],['david.om.cohen@gmail.com',undefined,list],[undefined,true,list],['netanelavra@gmail.com',true,null],['old@x.com',true,list]]){assert.equal(isListedAdmin(l,e,v),false);assert.equal(grantedRole(l,e,v),'customer');}});
test('normalizeEmail',()=>{assert.equal(normalizeEmail(' A@B.C '),'a@b.c');assert.equal(normalizeEmail(5),'');});
