const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Node {
  constructor(tag='div'){this.tagName=tag;this.children=[];this.listeners={};this.style={};this.hidden=false;this.value='';this.disabled=false;this.classList={add(){},remove(){}};}
  append(...nodes){this.children.push(...nodes);} prepend(node){this.children.unshift(node);} replaceChildren(...nodes){this.children=nodes;}
  addEventListener(type,fn){this.listeners[type]=fn;} querySelector(){return new Node('span');} reportValidity(){} checkValidity(){return true;} reset(){this.resetDone=true;} setAttribute(key,value){this[key]=value;} querySelectorAll(){return [];} focus(){} remove(){} click(){this.listeners.click?.({});}
  showModal(){this.open=true;} close(){this.open=false;this.listeners.close?.();}
}
const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);};
const values=new Map();let lastRequest=null;const document={getElementById:get,createElement:tag=>new Node(tag),querySelectorAll:()=>[],dispatchEvent(){},addEventListener(){},body:new Node(),activeElement:new Node()};
const context={window:{},document,Intl,Date,URL,URLSearchParams,AbortController,Blob,console,CustomEvent:class{},setInterval(){},setTimeout(){},clearTimeout(){},fetch:(url,opts)=>{lastRequest={url,...opts};return Promise.resolve(String(url).includes('formspree.io')?{ok:true,status:200}:{type:'opaque'});},matchMedia:()=>({matches:true}),localStorage:{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)},FormData:class{constructor(form){this.data={...form.data};}get(key){return this.data[key];}set(key,value){this.data[key]=value;}}};
context.window=context;context.scrollTo=()=>{};context.scrollY=0;vm.createContext(context);
get('wish-form').action='https://formspree.io/f/mgaoqqbp';
for(const file of ['wedding-config','main','gallery','rsvp','music']) vm.runInContext(fs.readFileSync(`js/${file}.js`,'utf8'),context,{filename:file});
const w=context.Wedding,c=context.weddingConfig;
assert.equal(w.zonedDate('2026-12-16').toISOString(),'2026-12-15T18:00:00.000Z');
assert.equal(w.zonedDate('2026-12-16','18:30').toISOString(),'2026-12-16T12:30:00.000Z');
assert(w.dateState(new Date('2026-10-18T00:00:00Z')).remaining>0);
assert.equal(w.dateState(new Date('2026-12-17T18:00:00Z')).today,true);
assert.equal(w.dateState(new Date('2026-12-18T17:59:59Z')).past,false);
assert.equal(w.dateState(new Date('2026-12-18T18:00:00Z')).past,true);
assert.equal(w.dateState(new Date('2026-12-20T00:00:00Z')).remaining,0);
assert.equal(w.safeUrl('javascript:alert(1)'),null);assert.equal(w.safeUrl('https://maps.google.com/'),'https://maps.google.com/');
assert.equal(w.available('assets/music.mp3'),false);assert.equal(get('event-list').children.length,3);assert.equal(get('gallery-grid').children.length,2);assert.equal(get('wedding-calendar').children.length,0);
get('wish-form').data={name:'  QA Guest  ',message:'  A test wish  '};
get('wish-form').listeners.submit({preventDefault(){}});
assert.equal(lastRequest.url,'https://formspree.io/f/mgaoqqbp');
assert.equal(lastRequest.method,'POST');
assert.equal(lastRequest.headers.Accept,'application/json');
assert.equal(lastRequest.body.get('name'),'QA Guest');
assert.equal(lastRequest.body.get('message'),'A test wish');
assert.equal(values.has('aa-wedding:wishes'),false);
assert.equal(c.wedding.date,'2026-12-16');
assert.equal(c.events.find(e=>e.id==='reception').date,'2026-12-18');
assert.equal(c.events.find(e=>e.id==='holud').displayTime,'Evening');
assert.equal(c.events.find(e=>e.id==='holud').time,null);
console.log('PASS: Reception countdown, preserved wedding date, Holud Evening, Formspree payload, safe links and missing assets.');
// Exercise gallery controls with supplied-image fixtures in memory only.
get('gallery-grid').replaceChildren();
c.photos.gallery=[{src:'assets/bride.jpeg',alt:'Test image one'},{src:'assets/bride.jpeg',alt:'Test image two'}];
vm.runInContext(fs.readFileSync('js/gallery.js','utf8'),context);
const tiles=get('gallery-grid').children;tiles.forEach(tile=>tile.children[0].listeners.load());tiles[0].click();assert.equal(get('gallery-dialog').open,true);assert.equal(get('gallery-full').alt,'Test image one');get('gallery-next').click();assert.equal(get('gallery-full').alt,'Test image two');get('gallery-dialog').listeners.keydown({key:'ArrowLeft',preventDefault(){}});assert.equal(get('gallery-full').alt,'Test image one');get('gallery-close').click();assert.equal(get('gallery-dialog').open,false);
// Calendar is offered only when a valid start and end time are provided.
c.events[2].time='18:00';c.events[2].endTime='21:00';vm.runInContext(fs.readFileSync('js/main.js','utf8'),context);assert.equal(get('wedding-calendar').children.length,1);get('wedding-calendar').children[0].click();
console.log('PASS: gallery next/previous, keyboard navigation, dialog close, and complete-time calendar generation (DOM simulation).');
