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
 await page.goto('http://127.0.0.1:5500',{waitUntil:'domcontentloaded'});
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
 await page.locator('#guest-name').fill('QA Guest');await page.locator('#attendance').selectOption('yes');
 assert(await page.locator('#guest-count-field').isVisible());await page.locator('#guest-count').fill('3');
 await page.locator('#rsvp-form button').click();assert((await page.locator('#rsvp-status').textContent()).includes('not been sent'));
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('aa-wedding:rsvps'))[0].guests),3);
 await page.locator('#attendance').selectOption('no');assert(!(await page.locator('#guest-count-field').isVisible()));
 await page.locator('#wish-name').fill('QA Guest');await page.locator('#wish-message').fill('Test-only wedding wish.');await page.locator('#wish-form button').click();
 assert.equal(await page.locator('.wish-entry blockquote').textContent(),'Test-only wedding wish.');
 await page.reload({waitUntil:'domcontentloaded'});assert.equal(await page.locator('.wish-entry blockquote').textContent(),'Test-only wedding wish.');
 assert(await page.locator('#music-toggle').isDisabled());
 console.log('PASS: RSVP attendance reveal, storage, guestbook reload persistence, missing music state.');
 const sizes=[];
 for(const width of [320,360,390,430,768,1366]){
   await page.setViewportSize({width,height:900});
   for(const id of ['story','date','events','memories','venue','rsvp','wishes','closing']){
    await page.evaluate(id=>document.getElementById(id).scrollIntoView({behavior:'instant'}),id);await wait(60);
   }
   const dimensions=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,hero:document.getElementById('scene').getBoundingClientRect().width}));
   assert(dimensions.scroll<=dimensions.client+1,`${width}px overflow ${JSON.stringify(dimensions)}`);
   assert(dimensions.hero<=450);sizes.push({width,...dimensions});
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
 // Valid, silent WAV solely for testing the audio lifecycle.
 const samples=44100;const wav=Buffer.alloc(44+samples*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(44100,24);wav.writeUInt32LE(88200,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples*2,40);
 await fp.route('**/assets/music.mp3',route=>route.fulfill({contentType:'audio/wav',body:wav}));
 await fp.goto('http://127.0.0.1:5500',{waitUntil:'domcontentloaded'});
 await fp.locator('.gallery-tile').first().scrollIntoViewIfNeeded();await wait(300);await fp.locator('.gallery-tile').first().click();
 assert(await fp.locator('#gallery-dialog').isVisible());await fp.keyboard.press('ArrowRight');assert.equal(await fp.locator('#gallery-full').getAttribute('alt'),'QA two');await fp.keyboard.press('ArrowLeft');assert.equal(await fp.locator('#gallery-full').getAttribute('alt'),'QA one');await fp.screenshot({path:'qa/gallery-fixture.png'});await fp.keyboard.press('Escape');assert(!(await fp.locator('#gallery-dialog').isVisible()));assert.equal(await fp.evaluate(()=>document.activeElement.getAttribute('aria-label')),'View QA one');
 assert.equal(await fp.locator('#music-toggle').getAttribute('aria-pressed'),'false');await fp.locator('#music-toggle').click();await wait(300);assert.equal(await fp.locator('#music-toggle').getAttribute('aria-pressed'),'true');await fp.locator('#music-toggle').click();await fp.waitForFunction(()=>document.getElementById('music-toggle').getAttribute('aria-pressed')==='false');assert.equal(await fp.locator('#music-toggle').getAttribute('aria-pressed'),'false');
 console.log('PASS: gallery fixture navigation, Escape, restored focus; user-started audio play/pause fixture.');
 await fixture.close();await context.close();await browser.close();
 fs.writeFileSync('qa/browser-results.json',JSON.stringify({motionSamples,sizes,errors,failures,passed:true},null,2));
})().catch(error=>{console.error(error);process.exit(1)});
