'use strict';
// Legacy test filename kept for compatibility. RSVP is intentionally retired.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync('index.html','utf8');
const forms = fs.readFileSync('js/rsvp.js','utf8');
const config = fs.readFileSync('js/wedding-config.js','utf8');
assert(!html.includes('id="rsvp"') && !html.includes('id="rsvp-form"'));
assert(!html.includes('href="#rsvp"') && !html.includes('Be Our<br><em>Guest'));
assert(!forms.includes('googleForms') && !config.includes('googleForms:'));
assert(html.includes('id="wish-form"') && html.includes('https://formspree.io/f/mgaoqqbp'));
assert(forms.includes('response.ok'));
console.log('PASS: Be Our Guest / RSVP removed; Wedding Wishes integration preserved.');
