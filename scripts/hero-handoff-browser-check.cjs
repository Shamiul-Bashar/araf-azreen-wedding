// Real Chromium check of the cinematic intro -> hero handoff.
// External resources are blocked; no forms are submitted and no email is sent.
'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const { chromium }=require('playwright-core');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.jpeg':'image/jpeg','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
let browser;
const server=http.createServer((req,res)=>{
  try{
    const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(root,'.'+(relative==='/'?'/index.html':relative));
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    fs.readFile(file,(err,bytes)=>{
      if(err){res.writeHead(404).end();return;}
      res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});
      res.end(bytes);
    });
  }catch{res.writeHead(400).end();}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const chrome=process.env.CHROME_PATH||'/usr/bin/google-chrome';
  browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox']});
  const errors=[];
  const open=async(options={})=>{
    const ctx=await browser.newContext({viewport:{width:390,height:844},...options});
    const page=await ctx.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('https://**/*',route=>route.abort());
    await page.goto(base,{waitUntil:'domcontentloaded'});
    return {ctx,page};
  };
  for(const width of [390,1366]){
    const {ctx,page}=await open({viewport:{width,height:900}});
    assert.equal(await page.evaluate(()=>window.WeddingIntro.active),true);
    assert.equal(await page.locator('#scene').evaluate(n=>n.classList.contains('playing')),false);
    assert.equal(await page.locator('#scene .content').evaluate(n=>getComputedStyle(n).visibility),'hidden');
    await page.waitForFunction(()=>document.documentElement.classList.contains('intro-leaving'),{},{timeout:6000});
    assert.equal(await page.locator('#scene').evaluate(n=>n.classList.contains('playing')),false);
    assert.equal(await page.locator('#scene .content').evaluate(n=>getComputedStyle(n).visibility),'hidden');
    await page.waitForFunction(()=>!window.WeddingIntro.active,{},{timeout:6000});
    assert.equal(await page.locator('#scene').evaluate(n=>n.classList.contains('playing')),true);
    assert.equal(await page.locator('#scene .content').evaluate(n=>getComputedStyle(n).visibility),'visible');
    assert.notEqual(await page.locator('#typewriter').textContent(),'Wedding Invitation');
    await page.waitForFunction(()=>document.querySelector('#typewriter').textContent==='Wedding Invitation',{},{timeout:6500});
    await ctx.close();
  }
  const skipped=await open();
  await skipped.page.locator('#intro-skip').click();
  assert.equal(await skipped.page.locator('#scene').evaluate(n=>n.classList.contains('playing')),true);
  await skipped.ctx.close();
  const reduced=await open({reducedMotion:'reduce'});
  assert.equal(await reduced.page.locator('#scene').evaluate(n=>n.classList.contains('playing')),false);
  assert.equal(await reduced.page.locator('#typewriter').textContent(),'Wedding Invitation');
  assert.equal(await reduced.page.locator('#scene .content').evaluate(n=>getComputedStyle(n).visibility),'visible');
  await reduced.ctx.close();
  const disabled=await open({javaScriptEnabled:false});
  assert.equal((await disabled.page.locator('#typewriter').textContent()).trim(),'Wedding Invitation');
  assert.equal(await disabled.page.locator('#scene .content').evaluate(n=>getComputedStyle(n).visibility),'visible');
  await disabled.ctx.close();
  assert.deepEqual(errors,[]);
  console.log('PASS: no pre-intro title flash, intro fade remains hidden, one hero reveal, skip, reduced motion and no-JS fallback');
})().catch(err=>{console.error(err);process.exitCode=1}).finally(async()=>{try{await browser?.close()}finally{server.close()}});
