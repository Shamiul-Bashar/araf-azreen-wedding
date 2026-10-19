(() => {
  'use strict';
  const { config, $, element, rsvpOpen } = window.Wedding;
  // Wedding Wishes are still a browser-local preview. RSVP uses Google Forms below.
  const store = {
    read(key) {
      const value = JSON.parse(localStorage.getItem('aa-wedding:' + key) || '[]');
      if (!Array.isArray(value)) throw new Error('Invalid saved data');
      return value;
    },
    append(key, value) {
      const rows = this.read(key);
      rows.push({ ...value, createdAt: new Date().toISOString() });
      localStorage.setItem('aa-wedding:' + key, JSON.stringify(rows));
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

  const form = $('rsvp-form');
  const submitLabel = form.querySelector('button[type="submit"] span');
  const googleForms = config.rsvp.googleForms;
  const configured = Boolean(
    googleForms?.formResponseUrl &&
    googleForms?.fields?.name &&
    googleForms?.fields?.attendance &&
    googleForms?.fields?.message &&
    googleForms?.answers?.yes &&
    googleForms?.answers?.no
  );
  let submitting = false;

  function updateRSVP() {
    const available = configured && rsvpOpen();
    $('rsvp-fields').disabled = !available || submitting;
    $('rsvp-closed').hidden = available;
    if (!configured) {
      $('rsvp-closed').textContent = 'RSVP will be available when our response service is connected.';
    }
    submitLabel.textContent = submitting ? 'Sending RSVP...' : 'Submit RSVP';
  }

  function nonblank(formElement) {
    let valid = true;
    formElement.querySelectorAll('input[required],textarea[required]').forEach(input => {
      input.setCustomValidity(input.value.trim() ? '' : 'Please enter more than spaces.');
      if (!input.checkValidity()) valid = false;
    });
    formElement.reportValidity();
    return valid && formElement.checkValidity();
  }

  updateRSVP();
  document.addEventListener('wedding:clock', updateRSVP);
  document.querySelectorAll('.invitation-form input,.invitation-form textarea').forEach(input => {
    input.addEventListener('input', () => input.setCustomValidity(''));
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!configured || !rsvpOpen() || submitting || !nonblank(form)) return;

    const fields = new FormData(form);
    const attendance = googleForms.answers[fields.get('attendance')];
    if (!attendance) {
      status('rsvp-status', 'Please select whether you will be joining us.', 'error');
      return;
    }

    const payload = new URLSearchParams();
    payload.set(googleForms.fields.name, String(fields.get('name')).trim());
    payload.set(googleForms.fields.attendance, attendance);
    payload.set(googleForms.fields.message, String(fields.get('message') || '').trim());

    submitting = true;
    updateRSVP();
    status('rsvp-status', 'Sending your RSVP to Google Forms...', 'info');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      // Google Forms does not provide CORS-readable submission receipts.
      // An opaque response means the browser sent the request, NOT that the form accepted it.
      await fetch(googleForms.formResponseUrl, {
        method: 'POST',
        mode: 'no-cors',
        credentials: 'omit',
        redirect: 'follow',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: payload.toString(),
        signal: controller.signal
      });
      status('rsvp-status',
        'Your RSVP was sent to Google Forms, but this page cannot verify delivery. If you need confirmation, please contact the couple.',
        'info');
      form.reset();
    } catch {
      status('rsvp-status',
        'We could not confirm sending your RSVP. Your answers have been kept. Please try again or use the Google Form link below.',
        'error');
    } finally {
      clearTimeout(timeout);
      submitting = false;
      updateRSVP();
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
