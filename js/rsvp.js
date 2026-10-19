(() => {
  'use strict';
  const { config, $, rsvpOpen } = window.Wedding;
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
    status('rsvp-status', 'Sending your RSVP...', 'sending');

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
      // Sending this request does not confirm that Google Forms recorded it.
      status('rsvp-status', 'Thank you — your RSVP has been sent.', 'sent');
      form.reset();
    } catch {
      status('rsvp-status', 'Could not send your RSVP. Please try again.', 'error');
      // Show the external form link only when it is useful: a failed send.
      if (googleForms.viewFormUrl) {
        const fallback = document.createElement('a');
        fallback.href = googleForms.viewFormUrl;
        fallback.target = '_blank';
        fallback.rel = 'noopener noreferrer';
        fallback.textContent = 'Open the RSVP form ↗';
        $('rsvp-status').append(' ', fallback);
      }
    } finally {
      clearTimeout(timeout);
      submitting = false;
      updateRSVP();
    }
  });

  // Real Wishes delivery via Formspree. Keep HTML action/method as a no-JS fallback.
  const wishForm = $('wish-form');
  const wishButton = wishForm.querySelector('button[type="submit"]');
  const wishButtonLabel = wishButton.querySelector('span');
  let wishSending = false;

  wishForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (wishSending || !nonblank(wishForm)) return;

    const data = new FormData(wishForm);
    data.set('name', String(data.get('name') || '').trim());
    data.set('message', String(data.get('message') || '').trim());

    // Require actual meaningful content, not only whitespace.
    if (!data.get('name') || !data.get('message')) {
      status('wish-status', 'Please enter your name and a message.', 'error');
      return;
    }

    wishSending = true;
    wishButton.disabled = true;
    wishButtonLabel.textContent = 'Sending Your Wish...';
    status('wish-status', 'Sending your wishes...', 'sending');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(wishForm.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });

      // Unlike Google Forms, Formspree returns a readable success/error status.
      // Successful acceptance does not guarantee the notification is already in Gmail.
      if (!response.ok) throw new Error('Formspree did not accept the submission');

      status('wish-status', 'Thank you — your heartfelt wishes have been submitted.', 'sent');
      wishForm.reset();
    } catch {
      // Never clear the form on a failed request; the guest may safely retry.
      status('wish-status', 'Your wish could not be sent. Please try again in a moment.', 'error');
    } finally {
      clearTimeout(timeout);
      wishSending = false;
      wishButton.disabled = false;
      wishButtonLabel.textContent = 'Send Your Wishes';
    }
  });
})();
