(() => {
  'use strict';
  const { config, $, element, rsvpOpen } = window.Wedding;
  // Replace this adapter with a real validated service + moderation before launch.
  const store = {
    read(key) {
      const value = JSON.parse(localStorage.getItem(`aa-wedding:${key}`) || '[]');
      if (!Array.isArray(value)) throw new Error('Invalid saved data');
      return value;
    },
    append(key, value) {
      const rows = this.read(key);
      rows.push({ ...value, createdAt: new Date().toISOString() });
      localStorage.setItem(`aa-wedding:${key}`, JSON.stringify(rows));
      return rows;
    }
  };

  function status(id, message, state = 'success') {
    const node = $(id);
    node.textContent = message;
    node.setAttribute('data-state', state);
    node.classList.remove('is-saved');
    void node.offsetWidth;
    node.classList.add('is-saved');
  }

  function updateRSVP() {
    const open = rsvpOpen() && config.rsvp.demoMode;
    $('rsvp-fields').disabled = !open;
    $('rsvp-closed').hidden = open;
    if (!config.rsvp.demoMode) $('rsvp-closed').textContent = 'RSVP will be available when our response service is connected.';
  }

  function attendanceChanged() {
    const attending = $('attendance').value === 'yes';
    const field = $('guest-count-field');
    field.hidden = !attending;
    $('guest-count').disabled = !attending;
    $('guest-count').required = attending;
    $('attendance').setAttribute('aria-expanded', String(attending));
    if (attending) window.WeddingMotion?.animate(field, [
      { opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 450 });
  }

  function nonblank(form) {
    let valid = true;
    form.querySelectorAll('input[required]:not([type=number]),textarea[required]').forEach(input => {
      input.setCustomValidity(input.value.trim() ? '' : 'Please enter more than spaces.');
      if (!input.checkValidity()) valid = false;
    });
    form.reportValidity();
    return valid && form.checkValidity();
  }

  updateRSVP();
  attendanceChanged();
  document.addEventListener('wedding:clock', updateRSVP);
  $('attendance').addEventListener('change', attendanceChanged);
  document.querySelectorAll('.invitation-form input,.invitation-form textarea').forEach(input => {
    input.addEventListener('input', () => input.setCustomValidity(''));
  });

  $('rsvp-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!rsvpOpen() || !config.rsvp.demoMode || !nonblank(event.target)) return;
    const data = new FormData(event.target);
    try {
      store.append('rsvps', {
        name: data.get('name').trim(), attendance: data.get('attendance'),
        guests: data.get('attendance') === 'no' ? 0 : Number(data.get('guests')),
        message: data.get('message').trim()
      });
      status('rsvp-status', 'Your demo response is saved in this browser only. It has not been sent to the couple.');
      event.target.reset();
      attendanceChanged();
    } catch {
      status('rsvp-status', 'Unable to save in this browser. Your response was not saved. Please check browser storage settings.', 'error');
    }
  });

  function renderWishes(rows, animateNew = false) {
    $('wish-list').replaceChildren();
    const safe = rows.filter(row => row && typeof row.name === 'string' && typeof row.message === 'string');
    if (!safe.length) return;
    safe.slice().reverse().forEach((wish, index) => {
      const entry = element('article', undefined, 'wish-entry');
      entry.append(element('blockquote', wish.message), element('p', `— ${wish.name}`));
      $('wish-list').append(entry);
      if (animateNew && index === 0) window.WeddingMotion?.animate(entry, [
        { opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 850 });
    });
  }

  try { renderWishes(store.read('wishes')); }
  catch { status('wish-status', 'Saved wishes could not be read. Browser storage may be unavailable.', 'error'); }
  if (!config.guestbook.demoMode) {
    $('wish-form').hidden = true;
    status('wish-status', 'Guestbook service is not connected.', 'error');
  }
  $('wish-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!config.guestbook.demoMode || !nonblank(event.target)) return;
    const data = new FormData(event.target);
    try {
      const rows = store.append('wishes', { name: data.get('name').trim(), message: data.get('message').trim() });
      renderWishes(rows, true);
      status('wish-status', 'Your wish is saved in this browser only. Thank you for your kind words.');
      event.target.reset();
    } catch {
      status('wish-status', 'Your wish could not be saved. Please check browser storage settings.', 'error');
    }
  });
})();
