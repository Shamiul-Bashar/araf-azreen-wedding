(() => {
  'use strict';
  const intro = window.WeddingIntro;
  if (!intro?.active) return;
  const overlay = document.getElementById('wedding-intro');
  const main = document.getElementById('top');
  const typed = document.getElementById('intro-typed');
  let timer;
  let exitTimer;
  try {
    main.inert = true;
    const name = window.weddingConfig?.couple.displayName || 'ARAF & AZREEN';
    overlay.querySelector('.intro-names').setAttribute('aria-label', name);
    overlay.querySelector('.intro-measure').textContent = name;
    const particles = overlay.querySelector('.intro-particles');
    for (let i = 0; i < 16; i++) {
      const dot = document.createElement('i');
      dot.style.setProperty('--x', `${(i * 37 + 7) % 100}%`);
      dot.style.setProperty('--y', `${(i * 23 + 11) % 100}%`);
      dot.style.setProperty('--delay', `${-(i % 5)}s`);
      particles.append(dot);
    }
    const letters = Array.from(name);
    const started = performance.now();
    function tick() {
      if (!intro.active) return;
      const elapsed = performance.now() - started;
      const count = Math.min(letters.length, Math.max(0, Math.floor((elapsed - 350) / 95)));
      typed.textContent = letters.slice(0, count).join('');
      if (count === letters.length) overlay.classList.add('intro-complete');
      if (elapsed >= 2900) {
        document.documentElement.classList.add('intro-leaving');
        exitTimer = setTimeout(() => intro.finish(), 550);
      } else timer = setTimeout(tick, 35);
    }
    document.getElementById('intro-skip').addEventListener('click', () => intro.finish());
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    preference.addEventListener('change', event => { if (event.matches) intro.finish(); });
    document.addEventListener('wedding:intro-complete', () => {
      clearTimeout(timer); clearTimeout(exitTimer);
      particles.replaceChildren();
    }, {once:true});
    tick();
  } catch { intro.finish(); }
})();
