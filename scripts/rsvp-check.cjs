/* Run with a local server on port 5500. Network calls to Google Forms are mocked. */
const {chromium} = require(require('node:path').join(require('node:os').tmpdir(),'araf-azreen-browser-qa/node_modules/playwright-core'));
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const context = await browser.newContext({reducedMotion:'reduce'});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5500');
  await page.evaluate(()=>window.WeddingIntro?.finish());
  await page.evaluate(()=>document.fonts.ready);
  const form=page.locator('#rsvp-form'), submit=form.locator('button[type=submit]');
  assert.equal((await page.request.get('http://127.0.0.1:5500/assets/rsvp-bg.png')).status(),200);

  // Do not submit QA/test data to the actual wedding Google Form.
  await page.evaluate(() => {
    window.__rsvpPosts = [];
    window.__failRsvp = false;
    const original = window.fetch.bind(window);
    window.fetch = (url, options) => {
      if (!String(url).includes('/formResponse')) return original(url, options);
      if (window.__failRsvp) return Promise.reject(new Error('Synthetic network failure'));
      window.__rsvpPosts.push({url: String(url), body: options.body, mode: options.mode, method: options.method});
      return Promise.resolve({type:'opaque'});
    };
  });

  for (const width of [320,390,768,1366]) {
    await page.setViewportSize({width,height:1000});
    await page.locator('#rsvp').scrollIntoViewIfNeeded();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
    assert(await page.locator('#rsvp').evaluate(n=>[...n.querySelectorAll('input,select,textarea,button,h2')].every(x=>x.scrollWidth<=x.clientWidth+2)));
    assert(await page.locator('#rsvp input').evaluateAll(ns=>ns.every(n=>parseFloat(getComputedStyle(n).fontSize)>=16)));
  }
  assert.equal(await page.locator('#guest-count-field').count(),0);
  assert.equal(await page.locator('#rsvp-preview a').getAttribute('href'),
    'https://docs.google.com/forms/d/e/1FAIpQLSc2NxqLjU2q5PdWcEnQEPRKK4ksb37qMWgUmvFLp01ZJHlbdQ/viewform');

  await submit.click();
  assert.equal(await page.evaluate(()=>window.__rsvpPosts.length),0);
  await page.locator('#guest-name').fill('   ');
  await page.locator('#attendance').selectOption('yes');
  await submit.click();
  assert.equal(await page.evaluate(()=>window.__rsvpPosts.length),0);

  await page.locator('#guest-name').fill('QA Guest');
  await page.locator('#rsvp-message').fill('Wedding wishes');
  await page.locator('#guest-name').focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'attendance');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'rsvp-message');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.type),'submit');
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>window.__rsvpPosts.length===1);
  await page.waitForFunction(()=>document.querySelector('#rsvp-status').textContent.includes('cannot verify delivery'));
  const yes=await page.evaluate(()=>window.__rsvpPosts[0]);
  assert.equal(yes.mode,'no-cors');assert.equal(yes.method,'POST');
  const yesData=new URLSearchParams(yes.body);
  assert.equal(yesData.get('entry.1556371433'),'QA Guest');
  assert.equal(yesData.get('entry.1872556883'),'Yes,I"l be there');
  assert.equal(yesData.get('entry.219074917'),'Wedding wishes');
  assert.equal(await page.evaluate(()=>localStorage.getItem('aa-wedding:rsvps')),null);

  await page.locator('#guest-name').fill('QA Declined');
  await page.locator('#attendance').selectOption('no');
  await submit.click();
  await page.waitForFunction(()=>window.__rsvpPosts.length===2);
  const no=await page.evaluate(()=>window.__rsvpPosts[1]);
  assert.equal(new URLSearchParams(no.body).get('entry.1872556883'),"Sorry,I won't be able to attend");

  await page.evaluate(()=>{window.__failRsvp=true;});
  await page.locator('#guest-name').fill('QA Retry');
  await page.locator('#attendance').selectOption('yes');
  await submit.click();
  await page.waitForFunction(()=>document.querySelector('#rsvp-status').textContent.includes('could not confirm sending'));
  assert.equal(await page.locator('#guest-name').inputValue(),'QA Retry');
  assert.equal(await page.evaluate(()=>window.__rsvpPosts.length),2);

  await page.evaluate(()=>{weddingConfig.rsvp.isOpen=false;document.dispatchEvent(new CustomEvent('wedding:clock'));});
  assert(await submit.isDisabled());
  await page.evaluate(()=>{weddingConfig.rsvp.isOpen=true;document.dispatchEvent(new CustomEvent('wedding:clock'));});
  assert(!(await submit.isDisabled()));

  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.reload();
  await page.evaluate(()=>window.WeddingIntro?.finish());
  await page.locator('#rsvp').scrollIntoViewIfNeeded();
  const timings=await page.locator('#rsvp').evaluate(n=>n.getAnimations({subtree:true}).map(a=>{const t=a.effect.getTiming();return t.delay+t.duration}));
  assert(timings.length && Math.max(...timings)<=1000);
  await page.waitForTimeout(1000);
  assert.equal(await page.locator('#rsvp .motion-pending').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: 4 widths, three RSVP fields, Google Forms payload mapping (mocked), yes/no, blank-name validation, keyboard order, safe error recovery, RSVP closing and motion.');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
