/* Run with a local server on port 5500. Uses isolated browser storage. */
const {chromium}=require(require('node:path').join(require('node:os').tmpdir(),'araf-azreen-browser-qa/node_modules/playwright-core'));
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const c=await b.newContext({reducedMotion:'reduce'});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:5500');await p.evaluate(()=>document.fonts.ready);
 const form=p.locator('#rsvp-form'),submit=form.locator('button');
 assert.equal((await p.request.get('http://127.0.0.1:5500/assets/rsvp-bg.png')).status(),200);
 for(const width of [320,390,768,1366]){
  await p.setViewportSize({width,height:1000});await p.locator('#rsvp').scrollIntoViewIfNeeded();
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
  assert(await p.locator('#rsvp').evaluate(n=>[...n.querySelectorAll('input,select,textarea,button,h2')].every(x=>x.scrollWidth<=x.clientWidth+2)));
  assert(await p.locator('#rsvp input').evaluateAll(ns=>ns.every(n=>parseFloat(getComputedStyle(n).fontSize)>=16)));
  await p.locator('#rsvp').screenshot({path:`qa/rsvp-resumed-${width}.png`,style:'.reading-progress{visibility:hidden}'});
 }
 await submit.click();assert.equal(await p.evaluate(()=>localStorage.getItem('aa-wedding:rsvps')),null);
 await p.locator('#guest-name').fill('   ');await p.locator('#attendance').selectOption('yes');await submit.click();assert(!(await p.locator('#guest-name').evaluate(n=>n.checkValidity())));
 await p.locator('#guest-name').fill('QA Guest');await p.locator('#guest-count').fill('0');assert(!(await form.evaluate(f=>f.checkValidity())));
 await p.locator('#guest-count').fill('2');await p.locator('#rsvp-message').fill('A test note');
 await p.locator('#guest-name').focus();await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'attendance');
 await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'guest-count');
 await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'rsvp-message');
 assert(await p.locator('#rsvp-message').evaluate(n=>parseFloat(getComputedStyle(n).outlineWidth)>=2));
 await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.type),'submit');await p.keyboard.press('Enter');
 let rows=await p.evaluate(()=>JSON.parse(localStorage.getItem('aa-wedding:rsvps')));assert.equal(rows[0].guests,2);assert.equal(rows[0].message,'A test note');
 assert((await p.locator('#rsvp-status').textContent()).includes('not been sent'));
 assert.equal(await p.locator('#rsvp-status').evaluate(n=>n.getAnimations().length),0);
 await p.locator('#guest-name').fill('QA Declined');await p.locator('#attendance').selectOption('no');assert(!(await p.locator('#guest-count-field').isVisible()));assert(await p.locator('#guest-count').isDisabled());
 await p.locator('#attendance').focus();await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'rsvp-message');await submit.click();
 rows=await p.evaluate(()=>JSON.parse(localStorage.getItem('aa-wedding:rsvps')));assert.equal(rows[1].guests,0);assert.equal(rows[1].message,'');
 await p.reload();assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('aa-wedding:rsvps')).length),2);
 await p.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Test quota','QuotaExceededError')}});
 await p.locator('#guest-name').fill('QA Unsaved');await p.locator('#attendance').selectOption('no');await submit.click();assert((await p.locator('#rsvp-status').textContent()).includes('was not saved'));assert.equal(await p.locator('#guest-name').inputValue(),'QA Unsaved');
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('aa-wedding:rsvps')).length),2);
 await p.evaluate(()=>{weddingConfig.rsvp.isOpen=false;document.dispatchEvent(new CustomEvent('wedding:clock'))});assert(await submit.isDisabled());
 await p.evaluate(()=>{weddingConfig.rsvp.isOpen=true;document.dispatchEvent(new CustomEvent('wedding:clock'))});assert(!(await submit.isDisabled()));
 await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.emulateMedia({reducedMotion:'no-preference'});await p.reload();await p.evaluate(()=>window.WeddingIntro?.finish());await p.evaluate(()=>document.getElementById('rsvp').scrollIntoView({behavior:'instant'}));await p.waitForTimeout(50);
 const timings=await p.locator('#rsvp').evaluate(n=>n.getAnimations({subtree:true}).map(a=>{const t=a.effect.getTiming();return t.delay+t.duration}));assert(timings.length);assert(Math.max(...timings)<=1000);
 await p.waitForTimeout(1000);assert.equal(await p.locator('#rsvp .motion-pending').count(),0);assert.deepEqual(errors,[]);
 console.log('PASS: four responsive widths, image load, empty/whitespace/count validation, yes/no storage, optional note, reload persistence, storage-error recovery, keyboard order/focus, closed/reopened state, reduced-motion confirmation, reveal timing, no runtime errors.');
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
