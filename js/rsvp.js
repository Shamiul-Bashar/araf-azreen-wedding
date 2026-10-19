(() => {
  'use strict';
  // The RSVP section has been retired. Wedding Wishes remains fully functional.
  const { $ } = window.Wedding;
  function status(id, message, state = 'success') {
    const node = $(id);
    node.textContent = message;
    node.setAttribute('data-state', state);
    node.classList.remove('is-saved');
    void node.offsetWidth;
    node.classList.add('is-saved');
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


  document.querySelectorAll('#wish-form input,#wish-form textarea').forEach(input => {
    input.addEventListener('input', () => input.setCustomValidity(''));
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
