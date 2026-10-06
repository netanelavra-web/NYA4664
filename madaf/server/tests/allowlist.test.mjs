import test from 'node:test';
import assert from 'node:assert/strict';
import {allowedRole,normalizeEmail} from '../allowlist.mjs';
const list={emails:{'netanelavra@gmail.com':'admin','david.om.cohen@gmail.com':'customer','bad@x.com':'superuser'}};
test('listed verified emails get their role, case-insensitive',()=>{assert.equal(allowedRole(list,'NetanelAvra@gmail.com',true),'admin');assert.equal(allowedRole(list,' david.om.cohen@gmail.com ',true),'customer');});
test('unlisted, unverified, missing or unknown-role entries are denied',()=>{assert.equal(allowedRole(list,'stranger@gmail.com',true),null);assert.equal(allowedRole(list,'david.om.cohen@gmail.com',false),null);assert.equal(allowedRole(list,'david.om.cohen@gmail.com',undefined),null);assert.equal(allowedRole(list,undefined,true),null);assert.equal(allowedRole(null,'netanelavra@gmail.com',true),null);assert.equal(allowedRole(list,'bad@x.com',true),null);});
test('normalizeEmail',()=>{assert.equal(normalizeEmail(' A@B.C '),'a@b.c');assert.equal(normalizeEmail(5),'');});
