const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Node {
  constructor(tag='div'){this.tagName=tag;this.children=[];this.listeners={};this.style={};this.hidden=false;this.value='';this.disabled=false;this.classList={add(){},remove(){}};}
  append(...nodes){this.children.push(...nodes);} prepend(node){this.children.unshift(node);} replaceChildren(...nodes){this.children=nodes;}
  addEventListener(type,fn){this.listeners[type]=fn;} setAttribute(key,value){this[key]=value;} querySelectorAll(){return [];} focus(){} remove(){} click(){this.listeners.click?.({});}
  showModal(){this.open=true;} close(){this.open=false;this.listeners.close?.();}
}
const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);};
const values=new Map();const document={getElementById:get,createElement:tag=>new Node(tag),querySelectorAll:()=>[],dispatchEvent(){},addEventListener(){},body:new Node(),activeElement:new Node()};
const context={window:{},document,Intl,Date,URL,Blob,console,CustomEvent:class{},setInterval(){},setTimeout(){},matchMedia:()=>({matches:true}),localStorage:{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)},FormData:class{constructor(form){this.data=form.data;}get(key){return this.data[key];}}};
context.window=context;context.scrollTo=()=>{};context.scrollY=0;vm.createContext(context);
for(const file of ['wedding-config','main','gallery','rsvp','music']) vm.runInContext(fs.readFileSync(`js/${file}.js`,'utf8'),context,{filename:file});
const w=context.Wedding,c=context.weddingConfig;
assert.equal(w.zonedDate('2026-12-16').toISOString(),'2026-12-15T18:00:00.000Z');
assert.equal(w.zonedDate('2026-12-16','18:30').toISOString(),'2026-12-16T12:30:00.000Z');
assert(w.dateState(new Date('2026-10-18T00:00:00Z')).remaining>0);
assert.equal(w.dateState(new Date('2026-12-15T18:00:00Z')).today,true);
assert.equal(w.dateState(new Date('2026-12-16T17:59:59Z')).past,false);
assert.equal(w.dateState(new Date('2026-12-16T18:00:00Z')).past,true);
assert.equal(w.dateState(new Date('2026-12-18T00:00:00Z')).remaining,0);
assert.equal(w.rsvpOpen(new Date('2026-12-18T00:00:00Z')),false);
c.rsvp.isOpen=true;assert.equal(w.rsvpOpen(new Date('2026-12-18T00:00:00Z')),true);c.rsvp.isOpen=null;
assert.equal(w.safeUrl('javascript:alert(1)'),null);assert.equal(w.safeUrl('https://maps.google.com/'),'https://maps.google.com/');
assert.equal(w.available('assets/music.mp3'),false);assert.equal(get('event-list').children.length,3);assert.equal(get('gallery-grid').children.length,2);assert.equal(get('wedding-calendar').children.length,0);
const form={data:{name:'  Test guest  ',attendance:'no',guests:'2',message:'  A test wish  '},querySelectorAll:()=>[],reportValidity(){},checkValidity:()=>true,reset(){this.resetDone=true;}};
c.rsvp.isOpen=true;get('rsvp-form').listeners.submit({preventDefault(){},target:form});
let saved=JSON.parse(values.get('aa-wedding:rsvps'));assert.equal(saved[0].guests,0);assert.equal(saved[0].name,'Test guest');assert(get('rsvp-status').textContent.includes('not been sent'));
get('wish-form').listeners.submit({preventDefault(){},target:form});assert.equal(JSON.parse(values.get('aa-wedding:wishes'))[0].message,'A test wish');assert.equal(get('wish-list').children.length,1);
context.localStorage.setItem=()=>{throw Error('blocked');};get('wish-form').listeners.submit({preventDefault(){},target:form});assert(get('wish-status').textContent.includes('could not be saved'));
console.log('PASS: Dhaka date boundaries, countdown, RSVP overrides, local storage, declined guest count, guestbook, storage failures, safe links and missing assets.');
// Exercise gallery controls with supplied-image fixtures in memory only.
get('gallery-grid').replaceChildren();
c.photos.gallery=[{src:'assets/bride.jpeg',alt:'Test image one'},{src:'assets/bride.jpeg',alt:'Test image two'}];
vm.runInContext(fs.readFileSync('js/gallery.js','utf8'),context);
const tiles=get('gallery-grid').children;tiles.forEach(tile=>tile.children[0].listeners.load());tiles[0].click();assert.equal(get('gallery-dialog').open,true);assert.equal(get('gallery-full').alt,'Test image one');get('gallery-next').click();assert.equal(get('gallery-full').alt,'Test image two');get('gallery-dialog').listeners.keydown({key:'ArrowLeft',preventDefault(){}});assert.equal(get('gallery-full').alt,'Test image one');get('gallery-close').click();assert.equal(get('gallery-dialog').open,false);
// Calendar is offered only when a valid start and end time are provided.
c.wedding.time='18:00';c.wedding.endTime='21:00';vm.runInContext(fs.readFileSync('js/main.js','utf8'),context);assert.equal(get('wedding-calendar').children.length,1);get('wedding-calendar').children[0].click();
console.log('PASS: gallery next/previous, keyboard navigation, dialog close, and complete-time calendar generation (DOM simulation).');
