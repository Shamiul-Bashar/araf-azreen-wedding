(() => {
  'use strict';
  const { config, $, element, available } = window.Wedding;
  const photos = config.photos.gallery.map((photo, i) => typeof photo === 'string'
    ? { src: photo, alt: `Wedding memory ${i + 1}` } : photo).filter(photo => available(photo.src));
  const loaded = [];
  if (!photos.length) $('gallery-empty').hidden = false;
  const dialog = $('gallery-dialog');
  let current = 0;
  let previousFocus;
  let scrollPosition = 0;
  let closing = false;
  let transition = null;
  let touchX = null;

  function show(index) {
    if (!loaded.length) return;
    transition?.cancel();
    current = (index + loaded.length) % loaded.length;
    const photo = loaded[current];
    $('gallery-full').src = photo.src;
    $('gallery-full').alt = photo.alt;
    $('gallery-caption').textContent = `${current + 1} / ${loaded.length} · ${photo.alt}`;
    transition = window.WeddingMotion?.animate($('gallery-full'), [
      { opacity: 0, transform: 'scale(.985)' }, { opacity: 1, transform: 'scale(1)' }
    ], { duration: 500 });
  }

  function open(photo) {
    previousFocus = document.activeElement;
    scrollPosition = window.scrollY;
    closing = false;
    show(loaded.indexOf(photo));
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    $('gallery-close').focus();
    window.WeddingMotion?.animate(dialog, [{ opacity: 0 }, { opacity: 1 }], { duration: 350 });
  }

  async function close() {
    if (closing) return;
    closing = true;
    const fade = window.WeddingMotion?.animate(dialog, [{ opacity: 1 }, { opacity: 0 }], { duration: 220 });
    if (fade) await fade.finished.catch(() => {});
    dialog.close();
    closing = false;
  }

  photos.forEach((photo, index) => {
    const button = element('button', undefined, 'gallery-tile');
    button.type = 'button';
    button.setAttribute('aria-label', `View ${photo.alt}`);
    button.setAttribute('data-reveal', 'rise');
    button.setAttribute('data-delay', String(100 + Math.min(index * 140, 280)));
    const img = element('img');
    img.alt = photo.alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 900;
    img.height = 600;
    img.addEventListener('load', () => {
      if (!loaded.includes(photo)) loaded.push(photo);
      loaded.sort((a, b) => photos.indexOf(a) - photos.indexOf(b));
      $('gallery-empty').hidden = true;
    });
    img.addEventListener('error', () => {
      const index = loaded.indexOf(photo);
      if (index >= 0) loaded.splice(index, 1);
      button.remove();
      $('gallery-empty').hidden = loaded.length > 0;
    });
    img.src = photo.src;
    button.append(img);
    button.addEventListener('click', () => { if (loaded.includes(photo)) open(photo); });
    $('gallery-grid').append(button);
  });
  $('gallery-close').addEventListener('click', close);
  $('gallery-prev').addEventListener('click', () => show(current - 1));
  $('gallery-next').addEventListener('click', () => show(current + 1));
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      show(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    window.scrollTo({ top: scrollPosition, behavior: 'instant' });
    previousFocus?.focus({ preventScroll: true });
  });
  $('gallery-full').addEventListener('error', () => {
    $('gallery-caption').textContent = 'This photograph is unavailable. Please try another.';
  });
  dialog.addEventListener('touchstart', event => { touchX = event.changedTouches[0].clientX; }, { passive: true });
  dialog.addEventListener('touchend', event => {
    if (touchX === null) return;
    const distance = event.changedTouches[0].clientX - touchX;
    if (Math.abs(distance) > 50) show(current + (distance < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });
})();
