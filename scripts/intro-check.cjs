/* Local Chrome integration test; see README for temporary Playwright setup. */
const {chromium}=require(require('node:path').join(require('node:os').tmpdir(),'araf-azreen-browser-qa/node_modules/playwright-core'));
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const errors=[];
 for(const width of [320,390,768,1366]){
  const c=await b.newContext({viewport:{width,height:900}}),p=await c.newPage();
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:5500',{waitUntil:'domcontentloaded'});
  assert(await p.locator('#wedding-intro').isVisible());
  // Hero MUST be dormant until intro finishes, including during the fade-out.
  assert.equal(await p.locator('#scene').evaluate(n=>n.classList.contains('playing')),false);
  assert.equal(await p.locator('#scene .content').evaluate(n=>getComputedStyle(n).visibility),'hidden');
  assert(await p.locator('#top').evaluate(n=>n.inert));
  assert.equal(await p.evaluate(()=>getComputedStyle(document.documentElement).overflow),'hidden');
  await p.waitForFunction(()=>document.getElementById('intro-typed').textContent==='ARAF & AZREEN');
  assert.equal(await p.locator('.intro-particles i').count(),16);
  await p.waitForFunction(()=>parseFloat(getComputedStyle(document.querySelector('.intro-subtitle')).opacity)>.99);
  await p.screenshot({path:`qa/intro-${width}.png`});
  await p.waitForFunction(()=>document.documentElement.classList.contains('intro-leaving'));
  assert.equal(await p.locator('#scene').evaluate(n=>n.classList.contains('playing')),false);
  assert.equal(await p.locator('#scene .content').evaluate(n=>getComputedStyle(n).visibility),'hidden');
  await p.waitForFunction(()=>!window.WeddingIntro.active);
  assert.equal(await p.locator('#scene').evaluate(n=>n.classList.contains('playing')),true);
  assert.equal(await p.locator('#scene .content').evaluate(n=>getComputedStyle(n).visibility),'visible');
  assert(!(await p.locator('#wedding-intro').isVisible()));
  assert(!(await p.locator('#top').evaluate(n=>n.inert)));
  assert.notEqual(await p.evaluate(()=>getComputedStyle(document.documentElement).overflow),'hidden');
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.waitForFunction(()=>document.getElementById('typewriter').textContent==='Wedding Invitation');
  await p.locator('.developer-footer').scrollIntoViewIfNeeded();
  await p.waitForTimeout(1200);
  assert(await p.locator('.developer-footer p').isVisible());
  assert(await p.locator('#portfolio-link').isVisible());
  assert.equal(await p.locator('#portfolio-link').getAttribute('href'),'https://shamiul-dev.vercel.app/');
  await p.screenshot({path:`qa/footer-visible-${width}.png`});
  if(width===1366){
   const [popup]=await Promise.all([p.waitForEvent('popup'),p.locator('#portfolio-link').click()]);
   await popup.waitForLoadState();assert.equal(popup.url(),'https://shamiul-dev.vercel.app/');
   assert((await popup.title()).length>0);await popup.close();
  }
  await c.close();
 }
 for(const mode of ['skip','reduced','blocked','no-js']){
  const c=await b.newContext({reducedMotion:mode==='reduced'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-js'}),p=await c.newPage();
  if(mode==='blocked')await p.route('**/js/intro.js',r=>r.abort());
  await p.goto('http://127.0.0.1:5500',{waitUntil:'domcontentloaded'});
  if(mode==='skip')await p.locator('#intro-skip').click();
  if(mode==='blocked')await p.waitForFunction(()=>!window.WeddingIntro.active,{},{timeout:5500});
  assert(!(await p.locator('#wedding-intro').isVisible()));
  assert(!(await p.locator('#top').evaluate(n=>n.inert)));
  assert(await p.locator('#replayButton').isVisible());
  assert.equal(await p.locator('#scene').evaluate(n=>n.classList.contains('playing')),mode!=='reduced'&&mode!=='no-js');
  await c.close();
 }
 assert.deepEqual(errors,[]);await b.close();
 console.log('PASS: intro typing, particles, handoff, scroll restoration, four widths, footer visibility and real portfolio popup, skip, reduced motion, blocked-module watchdog and no-JS fallback.');
})().catch(e=>{console.error(e);process.exit(1)});
