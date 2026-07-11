#!/usr/bin/env node
'use strict';
const fs=require('fs'), path=require('path');
const BASE_URL=(process.env.MANUS_BASE_URL||'').replace(/\/+$/,'');
const TIMEOUT_MS=Number(process.env.MANUS_TIMEOUT_MS||10000);
if(!BASE_URL){console.error('Missing MANUS_BASE_URL');process.exit(1)}
const paths=['/api/health','/health','/api/status','/api/companies','/api/contacts','/api/tasks','/api/alerts','/api/messages','/api/documents','/api/calls','/api/invoices','/api/quotes','/api/trpc','/trpc','/graphql','/api/graphql','/api/rpc','/rpc'];
function headers(){const h={accept:'application/json, text/plain, */*','user-agent':'UltraCore-Manus-Migration/1.0'};if(process.env.MANUS_COOKIE)h.cookie=process.env.MANUS_COOKIE;if(process.env.MANUS_AUTH_HEADER)h.authorization=process.env.MANUS_AUTH_HEADER;if(process.env.MANUS_HEADERS_FILE){Object.assign(h,JSON.parse(fs.readFileSync(path.resolve(process.env.MANUS_HEADERS_FILE),'utf8')))}return h}
async function probe(endpoint){const c=new AbortController();const t=setTimeout(()=>c.abort(),TIMEOUT_MS);try{const r=await fetch(BASE_URL+endpoint,{headers:headers(),redirect:'manual',signal:c.signal});const txt=(await r.text()).slice(0,500);return{endpoint,status:r.status,ok:r.ok,contentType:r.headers.get('content-type')||'',location:r.headers.get('location'),preview:txt}}catch(e){return{endpoint,status:null,ok:false,error:e.name==='AbortError'?'timeout':String(e.message||e)}}finally{clearTimeout(t)}}
(async()=>{const results=[];for(const p of paths){const r=await probe(p);results.push(r);console.log(`${r.status===null?'ERR':r.status}\t${p}`)}const out={baseUrl:BASE_URL,checkedAt:new Date().toISOString(),authenticated:Boolean(process.env.MANUS_COOKIE||process.env.MANUS_AUTH_HEADER||process.env.MANUS_HEADERS_FILE),results};fs.writeFileSync(path.join(__dirname,'discovered-endpoints.json'),JSON.stringify(out,null,2));console.log('Wrote discovered-endpoints.json')})().catch(e=>{console.error(e.stack||e);process.exit(1)});
