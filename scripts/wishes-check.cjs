/* Launch the local site at 127.0.0.1:5500 and Chrome remote debugging at 9223.
   All outbound Formspree requests are mocked; this test sends ZERO real emails. */
const {chromium}=require(require('node:path').join(require('node:os').tmpdir(),'araf-azreen-browser-qa/node_modules/playwright-core'));
const assert=require('node:assert/strict');

(async()=>{
  const browser=await chromium.connectOverCDP('http://127.0.0.1:9223');
  const context=await browser.newContext({viewport:{width:1366,height:1000}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5500',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>window.WeddingIntro?.finish());
  await page.evaluate(()=>document.fonts.ready);

  await page.locator('#wishes').scrollIntoViewIfNeeded();
  await page.waitForTimeout(220);
  assert(await page.locator('#wishes').evaluate(n=>n.getAnimations({subtree:true}).length>0));
  await page.waitForTimeout(1800);
  await page.locator('#wishes').screenshot({path:'qa/wishes-final-desktop.png'});
  assert.equal(await page.locator('.wishes-verse blockquote').textContent(),'“And We created you in pairs.”');
  assert.equal(await page.locator('.wishes-verse cite').textContent(),'— Surah An-Naba (78:8)');
  assert.equal(await page.locator('#wish-list').count(),0);
  assert.equal(await page.locator('.wishes-disclosure').count(),0);
  assert.equal(await page.locator('#wish-status').textContent(),'');
  assert.equal(await page.locator('#wish-form').getAttribute('method'),'POST');
  assert.equal(await page.locator('#wish-form').getAttribute('action'),'https://formspree.io/f/mgaoqqbp');

  // Intercept fetch at the page boundary, preserving other website requests.
  await page.evaluate(()=>{
    window.__wishesPosts=[];
    window.__wishesResponse='success';
    const originalFetch=window.fetch.bind(window);
    window.fetch=(url,options)=>{
      if(String(url)!=='https://formspree.io/f/mgaoqqbp') return originalFetch(url,options);
      window.__wishesPosts.push({
        url:String(url),name:options.body.get('name'),
        message:options.body.get('message'),method:options.method,
        accept:options.headers.Accept
      });
      if(window.__wishesResponse==='reject') return Promise.reject(new Error('Mock network failure'));
      if(window.__wishesResponse==='server') return Promise.resolve({ok:false,status:429});
      return Promise.resolve({ok:true,status:200});
    };
  });

  await page.locator('#wish-name').fill('   ');
  await page.locator('#wish-message').fill('Test message');
  await page.locator('#wish-form button').click();
  assert.equal(await page.evaluate(()=>window.__wishesPosts.length),0);
  await page.locator('#wish-name').fill('QA Guest');
  await page.locator('#wish-message').fill('  A heartfelt test wish.  ');
  await page.locator('#wish-form button').click();
  await page.waitForFunction(()=>document.querySelector('#wish-status').textContent.includes('submitted'));
  assert.equal(await page.evaluate(()=>window.__wishesPosts.length),1);
  const sent=await page.evaluate(()=>window.__wishesPosts[0]);
  assert.equal(sent.name,'QA Guest');assert.equal(sent.message,'A heartfelt test wish.');
  assert.equal(sent.method,'POST');assert.equal(sent.accept,'application/json');
  assert.equal(await page.locator('#wish-name').inputValue(),'');
  assert.equal(await page.evaluate(()=>localStorage.getItem('aa-wedding:wishes')),null);

  await page.evaluate(()=>window.__wishesResponse='server');
  await page.locator('#wish-name').fill('QA Unsaved');
  await page.locator('#wish-message').fill('Keep my message on error.');
  await page.locator('#wish-form button').click();
  await page.waitForFunction(()=>document.querySelector('#wish-status').textContent.includes('could not be sent'));
  assert.equal(await page.locator('#wish-name').inputValue(),'QA Unsaved');
  assert.equal(await page.locator('#wish-message').inputValue(),'Keep my message on error.');
  assert.equal(await page.locator('#wish-form button').isDisabled(),false);

  await page.evaluate(()=>window.__wishesResponse='reject');
  await page.locator('#wish-form button').click();
  await page.waitForFunction(()=>window.__wishesPosts.length===3);
  assert.equal(await page.locator('#wish-name').inputValue(),'QA Unsaved');

  await page.emulateMedia({reducedMotion:'reduce'});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.evaluate(()=>window.WeddingIntro?.finish());
  for(const width of [320,390,768,1366]){
    await page.setViewportSize({width,height:900});
    await page.locator('#wishes').scrollIntoViewIfNeeded();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
    assert(await page.locator('#wishes-heading').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
    if(width===390)await page.locator('#wishes').screenshot({path:'qa/wishes-final-mobile.png'});
  }
  assert.equal(await page.locator('#wishes .motion-pending').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: Wishes via mocked Formspree POST, accurate server status, retention on errors, no local-only notices, 4 widths, motion and verse.');
  await context.close();await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});