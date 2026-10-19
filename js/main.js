(() => {
  'use strict';
  const config = window.weddingConfig;
  const $ = id => document.getElementById(id);
  const element = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if(className) node.className = className; return node; };
  const available = path => !!path && config.availableAssets.includes(path);
  function zonedDate(date, time = '00:00', zone = config.wedding.timezone) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^\d{2}:\d{2}$/.test(time || '')) return null;
    const target = Date.parse(`${date}T${time}:00Z`);
    if (!Number.isFinite(target)) return null;
    let guess = target;
    for (let i = 0; i < 3; i++) {
      const parts = new Intl.DateTimeFormat('en-GB', { timeZone: zone, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23' }).formatToParts(new Date(guess));
      const p = Object.fromEntries(parts.map(part => [part.type, part.value]));
      const represented = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
      guess += target - represented;
    }
    return new Date(guess);
  }
  const formattedDate = date => new Intl.DateTimeFormat('en-GB', { day:'numeric',month:'long',year:'numeric',timeZone:'UTC' }).format(new Date(`${date}T12:00:00Z`));
  // Save the Date celebrates the reception; the wedding ceremony remains 16 December.
  const saveTheDate = config.events.find(event => event.id === 'reception') || config.wedding;
  function dateState(now = new Date()) {
    const start = zonedDate(saveTheDate.date, saveTheDate.time || '00:00');
    if (!start) return { past:false, today:false, remaining:0, valid:false };
    const local = new Intl.DateTimeFormat('en-CA',{timeZone:config.wedding.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
    const p = Object.fromEntries(local.map(v => [v.type,v.value]));
    const day = `${p.year}-${p.month}-${p.day}`;
    return { valid:true, past:day > saveTheDate.date, today:day === saveTheDate.date, remaining:Math.max(0,start-now) };
  }
  function safeUrl(raw) { try { const url=new URL(raw); return ['https:','http:'].includes(url.protocol) ? url.href : null; } catch { return null; } }
  function directions(parent, raw) { const url=safeUrl(raw); if(!url) return; const a=element('a','Get directions ↗','text-link'); a.href=url;a.target='_blank';a.rel='noopener noreferrer';parent.append(a); }
  function calendar(parent, event, name) {
    if(!event.date || !event.time || !event.endTime) return;
    const start=zonedDate(event.date,event.time),end=zonedDate(event.date,event.endTime);
    if(!start || !end || end <= start) return;
    const escape = value => String(value || '').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
    const stamp=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const button=element('button','Add to calendar ↓','text-link'); button.type='button'; button.style.background='none';button.style.borderTop='0';button.style.borderLeft='0';button.style.borderRight='0';button.style.cursor='pointer';
    button.addEventListener('click',()=>{
      const data=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Araf Azreen//Wedding//EN','BEGIN:VEVENT',`UID:${escape(event.id || 'wedding')}-${event.date}@araf-azreen.local`,`DTSTAMP:${stamp(new Date())}`,`DTSTART:${stamp(start)}`,`DTEND:${stamp(end)}`,`SUMMARY:${escape(name)}`,`LOCATION:${escape([event.venue,event.address].filter(Boolean).join(', '))}`,'END:VEVENT','END:VCALENDAR',''].join('\r\n');
      const url=URL.createObjectURL(new Blob([data],{type:'text/calendar;charset=utf-8'}));const a=element('a');a.href=url;a.download=`${event.id || 'wedding'}.ics`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });parent.append(button);
  }
  window.Wedding = {config,$,element,available,zonedDate,dateState,safeUrl};
  const portfolio = $('portfolio-link');
  const portfolioUrl = safeUrl(config.developer?.portfolioUrl);
  if (portfolio && portfolioUrl) { portfolio.href = portfolioUrl; portfolio.hidden = false; }
  $('story-copy').textContent=config.story;
  document.querySelectorAll('[data-couple]').forEach(node => {
    node.setAttribute('aria-label', config.couple.displayName);
    [config.couple.groom, '&', config.couple.bride].forEach((name, index) => {
      const part = element('span', name, index === 1 ? 'name-amp' : 'name-part');
      part.setAttribute('aria-hidden', 'true');
      part.setAttribute('data-reveal', ['left', 'rise', 'right'][index]);
      part.setAttribute('data-delay', String(index * 180));
      node.append(part);
    });
  });
  document.querySelectorAll('[data-photo]').forEach(scene => {
    const path = config.photos[scene.dataset.photo];
    if (!available(path)) return;
    const media = element('div', undefined, 'scene-media');
    const img = element('img', undefined, 'scene-image');
    img.alt = '';
    if (scene.id === 'story') img.setAttribute('data-reveal', 'rise');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => { media.remove(); scene.classList.remove('has-photo'); }, { once: true });
    img.addEventListener('load', () => scene.classList.add('has-photo'), { once: true });
    img.src = path;
    media.append(img);
    scene.prepend(media);
  });
  const date=new Date(`${saveTheDate.date}T12:00:00Z`);
  if(!Number.isNaN(date.getTime())){ $('date-day').textContent=date.getUTCDate();$('date-month').textContent=date.toLocaleDateString('en-GB',{month:'long',timeZone:'UTC'});$('date-year').textContent=date.getUTCFullYear(); }
  const counters=['Days','Hours','Minutes','Seconds'].map(label=>{const wrap=element('div');wrap.setAttribute('data-reveal','rise');wrap.setAttribute('data-delay',String(120+['Days','Hours','Minutes','Seconds'].indexOf(label)*150));const value=element('strong','00');wrap.append(value,element('span',label));$('countdown').append(wrap);return value;});
  function updateDate() {
    const state = dateState();
    const arrived = state.today && state.remaining === 0;
    $('countdown').hidden = !state.valid || state.past || arrived;
    $('date-heading').textContent = state.past ? 'A Day to Remember' : 'Save the Date';
    const message = !state.valid ? 'Date to be announced' : state.past
      ? `Celebrated on ${formattedDate(saveTheDate.date)}` : arrived
      ? 'Today, we celebrate together.' : 'Counting down to our special day';
    if ($('date-state').textContent !== message) $('date-state').textContent = message;
    const timezoneLabel = config.wedding.timezone === 'Asia/Dhaka' ? 'Bangladesh Time' : config.wedding.timezone;
    $('date-note').textContent = state.valid ? `${formattedDate(saveTheDate.date)} \u00b7 ${timezoneLabel}` : '';
    $('date-target').hidden = !state.valid || state.past || arrived;
    $('date-target').textContent = saveTheDate.time
      ? `Counting to the configured reception time: ${saveTheDate.time}.`
      : 'Counting to the start of the reception date.';
    let seconds = Math.floor(state.remaining / 1000);
    [86400, 3600, 60, 1].forEach((unit, index) => {
      counters[index].textContent = String(Math.floor(seconds / unit)).padStart(2, '0');
      seconds %= unit;
    });
  }
  updateDate();setInterval(updateDate,1000);calendar($('wedding-calendar'),saveTheDate,`${config.couple.displayName} · Reception`);
  config.events.forEach((event, index) => {
    const article = element('article', undefined, 'event-entry');
    const stagger = Math.min(index * 120, 240);
    const reveal = (node, kind, delay) => {
      node.setAttribute('data-reveal', kind);
      node.setAttribute('data-delay', String(Math.min(delay, 600)));
      return node;
    };
    const line = reveal(element('span', undefined, 'event-line'), 'line', stagger + 350);
    line.setAttribute('aria-hidden', 'true');
    const title = reveal(element('h3', event.name), 'mask', stagger);
    const date = reveal(element('time', undefined, 'event-date'), 'rise', stagger + 120);
    if (event.date) {
      date.setAttribute('datetime', event.date);
      date.append(element('span', formattedDate(event.date), 'event-date-label'));
      const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' })
        .format(new Date(`${event.date}T12:00:00Z`));
      date.append(element('span', weekday, 'event-weekday'));
    } else date.textContent = 'Date to be announced';
    article.append(line, title, date);
    const details = element('div', undefined, 'event-details');
    const clockTime = event.time ? new Intl.DateTimeFormat('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: config.wedding.timezone
    }).format(zonedDate(event.date, event.time)) : event.displayTime;
    if (clockTime) details.append(reveal(element('p', clockTime, 'event-time'), 'rise', stagger + 180));
    const place = element('div', undefined, 'event-place');
    if (event.venue) place.append(element('p', event.venue, 'event-venue'));
    if (event.location) place.append(element('p', event.location, 'event-location'));
    details.append(reveal(place, 'rise', stagger + 260));
    if (event.description) details.append(reveal(element('p', event.description, 'event-description'), 'rise', stagger + 340));
    const actions = element('div', undefined, 'event-actions');
    directions(actions, event.mapsUrl);
    calendar(actions, event, `${config.couple.displayName} \u00b7 ${event.name}`);
    if (event.mapsUrl || (event.time && event.endTime)) details.append(reveal(actions, 'rise', stagger + 360));
    article.append(details);
    $('event-list').append(article);
  });
  // Reception venue only; ceremony details remain independently configured.
  $('venue-name').textContent = config.venue.name || 'Venue Details Coming Soon';
  $('venue-location').textContent = config.venue.city || '';
  $('venue-address').textContent = config.venue.address || '';
  $('venue-address').hidden = !config.venue.address;
  const reception = config.events.find(event => event.id === 'reception');
  $('venue-reception').hidden = !reception?.date;
  $('venue-time').hidden = !reception?.displayTime && !reception?.time;
  if (reception?.date) {
    const receptionDate = new Intl.DateTimeFormat('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric', timeZone:'UTC' }).format(new Date(`${reception.date}T12:00:00Z`));
    $('venue-reception').textContent = `Reception \u00b7 ${receptionDate}`;
    $('venue-time').textContent = reception.displayTime || (reception.time ? new Intl.DateTimeFormat('en-US', {hour:'numeric',minute:'2-digit',hour12:true,timeZone:config.wedding.timezone}).format(zonedDate(reception.date,reception.time)) : '');
    $('venue-time').hidden = !$('venue-time').textContent;
  }
  const map = safeUrl(config.venue.mapsUrl);
  if (map) {
    $('venue-directions').href = map;
    $('venue-directions').hidden = false;
    $('venue-directions').setAttribute('aria-label', `Get directions to ${config.venue.name} (opens in a new tab)`);
  } else {
    $('venue-directions').hidden = true;
    $('venue-directions').href = '';
  }
})();
