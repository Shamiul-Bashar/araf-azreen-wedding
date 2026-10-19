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
 ['Google RSVP endpoint preserved', config.includes('1FAIpQLSc2NxqLjU2q5PdWcEnQEPRKK4ksb37qMWgUmvFLp01ZJHlbdQ')&&rsvp.includes('googleForms.formResponseUrl')],
 ['Formspree endpoint preserved', html.includes('action="https://formspree.io/f/mgaoqqbp"')&&rsvp.includes('response.ok')],
 ['No local-only wedding wishes', !html.includes('saved on this device only')&&!rsvp.includes('localStorage')],
 ['Live-status announcements', /id="wish-status"[^>]*aria-live="polite"/.test(html)&&/id="rsvp-status"[^>]*aria-live="polite"/.test(html)],
 ['Reduced motion supported', /prefers-reduced-motion:reduce/.test(css)],
 ['Responsive layouts preserved', /@media\(max-width:767px\)/.test(css)],
 ['Hero, background, and gallery assets exist', ['assets/bride.jpeg','assets/wishes-bg.jpeg','assets/rsvp-bg.png','assets/gallery-1.jpeg','assets/gallery-2.jpeg'].every(p=>fs.existsSync(path.join(root,p)))],
 ['Social preview image exists', fs.existsSync(path.join(root,'assets/bride.jpeg'))],
 ['No duplicate HTML IDs', (()=>{const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);return ids.length===new Set(ids).size})()]
];
for(const [label,ok] of checks){assert.ok(ok,label);console.log('PASS',label)}
console.log('All',checks.length,'offline premium polish checks passed.');
