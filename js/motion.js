/* A single lifecycle owns all new-section motion. The hero owns its original sequence. */
(() => {
  'use strict';
  if (window.WeddingMotion) return;
  const root = document.querySelector('.chapters');
  if (!root) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const activeAnimations = new Set();
  const typingJobs = new Map();
  const prepared = new WeakSet();
  const scenes = new Set();
  const ease = 'cubic-bezier(.22, 1, .36, 1)';
  let observer;
  let sceneObserver;
  let frame = 0;

  function animate(node, keyframes, options = {}) {
    if (preference.matches || typeof node.animate !== 'function') return null;
    const animation = node.animate(keyframes, { duration: 900, easing: ease, fill: 'both', ...options });
    activeAnimations.add(animation);
    const cleanup = () => { activeAnimations.delete(animation); animation.cancel(); };
    animation.finished.then(cleanup, () => activeAnimations.delete(animation));
    return animation;
  }

  // The invisible full text reserves exactly the final wrapping and line height.
  // The visible layer receives characters, not a width/clip based imitation.
  function type(node) {
    const text = node.textContent.trim();
    if (!text || preference.matches) return;
    const measure = document.createElement('span');
    const copy = document.createElement('span');
    measure.className = 'type-measure';
    copy.className = 'type-copy';
    measure.textContent = text;
    measure.setAttribute('aria-hidden', 'true');
    copy.setAttribute('aria-hidden', 'true');
    node.setAttribute('aria-label', text);
    node.classList.add('type-layout');
    node.replaceChildren(measure, copy);
    const letters = Array.from(text);
    let index = 0;
    const step = () => {
      copy.textContent = letters.slice(0, ++index).join('');
      if (index < letters.length && !preference.matches) {
        typingJobs.set(node, { timer: setTimeout(step, 78), text });
      } else {
        node.textContent = text;
        node.classList.remove('type-layout');
        typingJobs.delete(node);
      }
    };
    typingJobs.set(node, { timer: setTimeout(step, 120), text });
  }

  function reveal(node) {
    node.classList.remove('motion-pending');
    if (preference.matches) return;
    if (node.hasAttribute('data-type')) { type(node); return; }
    const kind = node.dataset.reveal || 'rise';
    const delay = Math.min(Number(node.dataset.delay) || 0, node.closest('#venue') ? 280 : 600);
    const distance = node.closest('#venue, #memories') ? 16 : innerWidth < 768 ? 26 : 42;
    let from = { opacity: 0, transform: `translateY(${distance}px)` };
    let to = { opacity: 1, transform: 'translateY(0)' };
    if (kind === 'mask') {
      from = { opacity: 0, transform: 'translateY(28px)', clipPath: 'inset(0 0 100% 0)' };
      to = { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0 0 -12% 0)' };
    } else if (kind === 'line') {
      from = { opacity: 0, transform: 'scaleX(0)' };
      to = { opacity: 1, transform: 'scaleX(1)' };
    } else if (kind === 'image') {
      from = { opacity: 0, clipPath: 'inset(10% 0 0 0)', transform: 'translateY(24px)' };
      to = { opacity: 1, clipPath: 'inset(0 0 0 0)', transform: 'translateY(0)' };
    } else if (kind === 'left' || kind === 'right') {
      from = { opacity: 0, transform: `translateX(${kind === 'left' ? -22 : 22}px)` };
      to = { opacity: 1, transform: 'translateX(0)' };
    } else if (kind === 'arch') {
      node.classList.add('is-drawn');
    }
    animate(node, [from, to], { delay, duration: node.closest('#memories') ? (node.matches('h2') ? 450 : node.matches('.gallery-caption') ? 350 : 500) : node.closest('#venue') ? (kind === 'arch' ? 500 : 350) : kind === 'image' ? 1200 : 1000 });
  }

  function register(scope = root) {
    if (!observer || preference.matches) return;
    scope.querySelectorAll('[data-reveal], [data-type]').forEach(node => {
      if (prepared.has(node)) return;
      prepared.add(node);
      // Hidden optional UI must never become an invisible focus target.
      if (node.hidden) return;
      observer.observe(node);
      node.classList.add('motion-pending');
      node.addEventListener('focusin', () => {
        node.classList.remove('motion-pending');
        observer.unobserve(node);
      }, { once: true });
    });
  }

  function release() {
    observer?.disconnect();
    root.querySelectorAll('.motion-pending').forEach(node => node.classList.remove('motion-pending'));
    activeAnimations.forEach(animation => animation.cancel());
    activeAnimations.clear();
    typingJobs.forEach(({ timer, text }, node) => {
      clearTimeout(timer);
      node.textContent = text;
      node.classList.remove('type-layout');
    });
    typingJobs.clear();
    root.querySelectorAll('.scene-media').forEach(node => node.style.removeProperty('--scene-y'));
  }

  function updateScroll() {
    frame = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    const progress = document.getElementById('reading-progress');
    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0})`;
    if (preference.matches) return;
    scenes.forEach(scene => {
      const media = scene.querySelector('.scene-media');
      if (!media) return;
      const box = scene.getBoundingClientRect();
      const travel = (innerHeight / 2 - box.top - box.height / 2) / (innerHeight + box.height);
      media.style.setProperty('--scene-y', `${Math.max(-18, Math.min(18, travel * 42)).toFixed(1)}px`);
    });
  }
  const scheduleScroll = () => { if (!frame) frame = requestAnimationFrame(updateScroll); };
  window.WeddingMotion = { animate, register, release };

  try {
    const arch = root.querySelector('.venue-art');
    if (arch) arch.dataset.reveal = 'arch';
    if ('IntersectionObserver' in window && !preference.matches) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          try { reveal(entry.target); } catch { entry.target.classList.remove('motion-pending'); }
        });
      }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });
      register();
    }
    if ('IntersectionObserver' in window) {
      sceneObserver = new IntersectionObserver(entries => {
        entries.forEach(({ target, isIntersecting }) => {
          target.classList.toggle('is-in-view', isIntersecting);
          if (isIntersecting) {
            scenes.add(target);
            if (target.id === 'venue' && !target.dataset.venueRevealed) {
              target.dataset.venueRevealed = 'true';
              target.querySelectorAll('.motion-pending').forEach(node => {
                observer?.unobserve(node);
                reveal(node);
              });
            }
            const media = target.querySelector('.scene-media');
            if (media && !media.dataset.revealed) {
              media.dataset.revealed = 'true';
              animate(media, [{ opacity: 0 }, { opacity: 1 }], { duration: target.id === 'venue' ? 500 : 1600 });
            }
          } else scenes.delete(target);
        });
        scheduleScroll();
      }, { threshold: 0 });
      root.querySelectorAll('.photo-scene').forEach(scene => sceneObserver.observe(scene));
    }
    window.addEventListener('scroll', scheduleScroll, { passive: true });
    window.addEventListener('resize', scheduleScroll, { passive: true });
    preference.addEventListener('change', () => {
      // Stop immediately when requested; don't replay previously read text on toggling back.
      if (preference.matches) release();
      else { observer?.disconnect(); observer = null; }
      scheduleScroll();
    });
    scheduleScroll();
  } catch (error) {
    release();
    console.warn('Motion enhancement unavailable; content remains readable.', error);
  }
})();
