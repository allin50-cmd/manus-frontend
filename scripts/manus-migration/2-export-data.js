#!/usr/bin/env node
'use strict';
const fs=require('fs'), path=require('path');
const BASE_URL=(process.env.MANUS_BASE_URL||'').replace(/\/+$/,'');
const FILE=process.env.MANUS_ENDPOINTS_FILE||path.join(__dirname,'endpoints.json');
const OUT=path.join(__dirname,'export');
if(!BASE_URL){console.error('Missing MANUS_BASE_URL');process.exit(1)}
if(!fs.existsSync(FILE)){console.error(`Missing endpoints file: ${FILE}`);process.exit(1)}
function headers(){const h={accept:'application/json','user-agent':'UltraCore-Manus-Migration/1.0'};if(process.env.MANUS_COOKIE)h.cookie=process.env.MANUS_COOKIE;if(process.env.MANUS_AUTH_HEADER)h.authorization=process.env.MANUS_AUTH_HEADER;if(process.env.MANUS_HEADERS_FILE)Object.assign(h,JSON.parse(fs.readFileSync(path.resolve(process.env.MANUS_HEADERS_FILE),'utf8')));return h}
async function get(url){const r=await fetch(url,{headers:headers()});const txt=await r.text();if(!r.ok)throw new Error(`${r.status} ${txt.slice(0,300)}`);try{return JSON.parse(txt)}catch{throw new Error(`Expected JSON from ${url}`)}}
function pick(obj,p){return p?p.split('.').reduce((v,k)=>v?.[k],obj):(Array.isArray(obj)?obj:(obj.data||obj.items||obj.results||obj.records))}
(async()=>{fs.mkdirSync(OUT,{recursive:true});const raw=JSON.parse(fs.readFileSync(FILE,'utf8'));const resources=Array.isArray(raw)?raw:raw.resources;const report=[];for(const r of resources){const url=new URL(r.endpoint,BASE_URL+'/');const payload=await get(url);const items=pick(payload,r.itemPath);if(!Array.isArray(items))throw new Error(`No array found for ${r.name}`);const out=path.join(OUT,`${r.name}.json`);fs.writeFileSync(out,JSON.stringify(items,null,2));report.push({name:r.name,count:items.length,file:out});console.log(`${r.name}: ${items.length}`)}fs.writeFileSync(path.join(OUT,'_manifest.json'),JSON.stringify({exportedAt:new Date().toISOString(),resources:report},null,2))})().catch(e=>{console.error(e.stack||e);process.exit(1)});
