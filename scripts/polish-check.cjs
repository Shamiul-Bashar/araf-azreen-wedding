'use strict';
// Offline safety checks: no browser, network or visitor submissions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'..');
const read = relative => fs.readFileSync(path.join(root,relative),'utf8');
const html=read('index.html');
const css=read('css/styles.css');
const introCss=read('css/intro.css');
const config=read('js/wedding-config.js');
const rsvp=read('js/rsvp.js');
const checks=[
 ['Hero starts without a premature playing class', /id="scene"\s+class="invitation"/.test(html)],
 ['Intro hides hero before handoff', introCss.includes('html.intro-active #scene .content')],
 ['Exactly one semantic page heading', (html.match(/<h1\b/g)||[]).length===1],
 ['Wedding invitation stays first heading', /<h1\s+id="typewriter"[\s\S]*?Wedding Invitation/.test(html)],
 ['Skip link is keyboard accessible', html.includes('class="skip-invitation" href="#story"') && css.includes('.skip-invitation:focus-visible')],
 ['Social sharing title/description/image', /property="og:title"/.test(html)&&/property="og:description"/.test(html)&&/property="og:image"/.test(html)],
 ['Canonical production address', html.includes('rel="canonical" href="https://araf-azreen-wedding.vercel.app/"')],
 ['Prioritized hero image', html.includes('rel="preload" as="image"')&&html.includes('fetchpriority="high"')],
 ['Reception/date information preserved', html.includes('id="events"')&&config.includes("date: '2026-12-18'")],
 ['RSVP section and navigation retired', !html.includes('id="rsvp"')&&!html.includes('id="rsvp-form"')&&!html.includes('href="#rsvp"')&&!html.includes('Be Our<br><em>Guest')],
 ['RSVP provider config and client logic removed', !config.includes('googleForms:')&&!rsvp.includes('googleForms')],
 ['Save the Date follows reception without changing wedding date', config.includes("wedding: { date: '2026-12-16'")&&config.includes("id: 'reception', name: 'Reception', date: '2026-12-18'")&&read('js/main.js').includes("config.events.find(event => event.id === 'reception')")],
 ['Holud time reads Evening without fabricated clock time', config.includes("id: 'holud', name: 'Holud', date: '2026-12-16', time: null, displayTime: 'Evening'")],
 ['Formspree endpoint preserved', html.includes('action="https://formspree.io/f/mgaoqqbp"')&&rsvp.includes('response.ok')],
 ['No local-only wedding wishes', !html.includes('saved on this device only')&&!rsvp.includes('localStorage')],
 ['Wishes live-status announcement retained', /id="wish-status"[^>]*aria-live="polite"/.test(html)],
 ['Reduced motion supported', /prefers-reduced-motion:reduce/.test(css)],
 ['Responsive layouts preserved', /@media\(max-width:767px\)/.test(css)],
 ['Hero, background, and gallery assets exist', ['assets/bride.jpeg','assets/wishes-bg.jpeg','assets/gallery-1.jpeg','assets/gallery-2.jpeg'].every(p=>fs.existsSync(path.join(root,p)))],
 ['Social preview image exists', fs.existsSync(path.join(root,'assets/bride.jpeg'))],
 ['No duplicate HTML IDs', (()=>{const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);return ids.length===new Set(ids).size})()]
];
for(const [label,ok] of checks){assert.ok(ok,label);console.log('PASS',label)}
console.log('All',checks.length,'offline premium polish checks passed.');
