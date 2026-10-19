/* Requires playwright-core installed in the temporary QA directory, not in this project. */
const {chromium}=require(require('node:path').join(require('node:os').tmpdir(),'araf-azreen-browser-qa/node_modules/playwright-core'));
const assert=require('node:assert/strict');
const fs=require('node:fs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9223');
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage();
 const errors=[];const failures=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)failures.push(`${r.status()} ${r.url()}`)});
 await page.goto('http://127.0.0.1:5500',{waitUntil:'domcontentloaded'});await page.evaluate(()=>window.WeddingIntro?.finish());
 await page.evaluate(()=>document.fonts.ready);
 await page.locator('#replayButton').click();await wait(950);
 const partial=await page.locator('#typewriter').textContent();
 assert(partial.length>0 && partial.length<'Wedding Invitation'.length,`hero partial: ${partial}`);
 await page.screenshot({path:'qa/hero-replay-partial.png'});await wait(3000);
 assert.equal(await page.locator('#typewriter').textContent(),'Wedding Invitation');
 console.log('PASS: real character-by-character hero replay:',JSON.stringify(partial));
 const motionSamples=[];
 for(const id of ['story','date','events','memories','venue','rsvp','wishes','closing']){
   await page.evaluate(id=>document.getElementById(id).scrollIntoView({behavior:'instant'}),id);
   await wait(200);
   motionSamples.push({id,...await page.locator('#'+id).evaluate(n=>({active:n.getAnimations({subtree:true}).length,typing:!!n.querySelector('.type-copy')}))});
   await wait(1900);
   // Scroll down and back to cover content below the initial fold in tall chapters.
   const box=await page.locator('#'+id).boundingBox();
   if(box.height>700){await page.evaluate(id=>{const n=document.getElementById(id);scrollTo({top:n.offsetTop+n.offsetHeight-innerHeight+30,behavior:'instant'});},id);await wait(1300);await page.evaluate(id=>document.getElementById(id).scrollIntoView({behavior:'instant'}),id);}
   await page.screenshot({path:`qa/mobile-${id}.png`});
 }
 assert(motionSamples.every(s=>s.id==='venue'||s.active>0||s.typing),JSON.stringify(motionSamples));
 console.log('PASS: real animation activity on section entry:',JSON.stringify(motionSamples));
 // Stub only the Google Forms endpoint; never send QA responses to the real wedding form.
 await page.evaluate(() => {
   window.__rsvpPosts = [];
   const originalFetch = window.fetch.bind(window);
   window.fetch = (url, options) => {
     if (String(url).includes('/formResponse')) {
       window.__rsvpPosts.push({url:String(url), body:options.body, mode:options.mode});
       return Promise.resolve({type:'opaque'});
     }
     return originalFetch(url, options);
   };
 });
 await page.locator('#guest-name').fill('QA Guest');
 await page.locator('#attendance').selectOption('yes');
 assert.equal(await page.locator('#guest-count-field').count(),0);
 await page.locator('#rsvp-form button').click();
 await page.waitForFunction(() => document.querySelector('#rsvp-status').textContent.includes('cannot verify delivery'));
 const yes = await page.evaluate(() => window.__rsvpPosts[0]);
 assert.equal(yes.mode,'no-cors');
 assert.equal(new URLSearchParams(yes.body).get('entry.1556371433'),'QA Guest');
 assert.equal(new URLSearchParams(yes.body).get('entry.1872556883'),'Yes,I"l be there');
 assert.equal(await page.evaluate(() => localStorage.getItem('aa-wedding:rsvps')),null);
 await page.locator('#guest-name').fill('QA Declined');
 await page.locator('#attendance').selectOption('no');
 await page.locator('#rsvp-form button').click();
 await page.waitForFunction(() => window.__rsvpPosts.length===2);
 const no = await page.evaluate(() => window.__rsvpPosts[1]);
 assert.equal(new URLSearchParams(no.body).get('entry.1872556883'),"Sorry,I won't be able to attend");
 await page.locator('#wish-name').fill('QA Guest');await page.locator('#wish-message').fill('Test-only wedding wish.');await page.locator('#wish-form button').click();
 assert.equal(await page.locator('.wish-entry blockquote').textContent(),'Test-only wedding wish.');
 await page.reload({waitUntil:'domcontentloaded'});await page.evaluate(()=>window.WeddingIntro?.finish());assert.equal(await page.locator('.wish-entry blockquote').textContent(),'Test-only wedding wish.');
 assert.equal(await page.locator('#music-toggle').count(),0);
 console.log('PASS: mocked Google Forms RSVP posts, separate local Wishes persistence, removed music footer.');
 const sizes=[];
 for(const width of [320,360,390,430,768,1366]){
   await page.setViewportSize({width,height:900});
   for(const id of ['story','date','events','memories','venue','rsvp','wishes','closing']){
    await page.evaluate(id=>document.getElementById(id).scrollIntoView({behavior:'instant'}),id);await wait(60);
   }
   const dimensions=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,hero:document.getElementById('scene').getBoundingClientRect().width}));
   assert(dimensions.scroll<=dimensions.client+1,`${width}px overflow ${JSON.stringify(dimensions)}`);
   assert(Math.abs(dimensions.hero-dimensions.client)<=1);sizes.push({width,...dimensions});
   if(width===320 || width===1366){
    for(const id of ['events','memories','venue','rsvp','closing']){await page.evaluate(id=>document.getElementById(id).scrollIntoView({behavior:'instant'}),id);await wait(1400);await page.screenshot({path:`qa/${width}-${id}.png`});}
   }
 }
 assert.equal(await page.locator('#venue .motion-pending').count(),0);
 console.log('PASS: viewport widths:',JSON.stringify(sizes));
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload({waitUntil:'domcontentloaded'});
 await wait(300);assert.equal(await page.locator('#typewriter').textContent(),'Wedding Invitation');
 assert.equal(await page.locator('.motion-pending').count(),0);
 assert.equal(await page.locator('.type-copy').count(),0);
 console.log('PASS: reduced motion leaves all content visible and skips typing.');
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
 console.log('PASS: no browser runtime errors or failed HTTP responses.');
 // Test optional gallery and music using in-memory fixtures; no production assets are changed.
 const fixture=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const fp=await fixture.newPage();
 await fp.route('**/js/wedding-config.js',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync('js/wedding-config.js','utf8')+`\nwindow.weddingConfig.photos.gallery=[{src:'assets/bride.jpeg',alt:'QA one'},{src:'assets/bride.jpeg',alt:'QA two'}];window.weddingConfig.availableAssets.push('assets/music.mp3');`}));
 await fp.goto('http://127.0.0.1:5500',{waitUntil:'domcontentloaded'});
 await fp.locator('.gallery-tile').first().scrollIntoViewIfNeeded();await wait(300);await fp.locator('.gallery-tile').first().click();
 assert(await fp.locator('#gallery-dialog').isVisible());await fp.keyboard.press('ArrowRight');assert.equal(await fp.locator('#gallery-full').getAttribute('alt'),'QA two');await fp.keyboard.press('ArrowLeft');assert.equal(await fp.locator('#gallery-full').getAttribute('alt'),'QA one');await fp.screenshot({path:'qa/gallery-fixture.png'});await fp.keyboard.press('Escape');assert(!(await fp.locator('#gallery-dialog').isVisible()));assert.equal(await fp.evaluate(()=>document.activeElement.getAttribute('aria-label')),'View QA one');
 assert.equal(await fp.locator('#music-toggle').count(),0);
 console.log('PASS: gallery navigation, Escape, restored focus; music remains absent even with an audio asset.');
 await fixture.close();await context.close();await browser.close();
 fs.writeFileSync('qa/browser-results.json',JSON.stringify({motionSamples,sizes,errors,failures,passed:true},null,2));
})().catch(error=>{console.error(error);process.exit(1)});
