(() => {
  'use strict';
  const header = document.querySelector('.site-header');
  const bar = document.querySelector('#scroll-nav');
  const toggle = document.querySelector('#nav-toggle');
  const links = document.querySelector('#scroll-nav-links');
  const mobile = matchMedia('(max-width: 900px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  function setOpen(open, returnFocus = false) {
    bar.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    // Le menu replié ne doit pas rester accessible au clavier sur mobile.
    links.inert = mobile.matches && !open;
    if (returnFocus) toggle.focus({ preventScroll: true });
  }
  function updateVisibility() {
    // Mesures sans transformation pour eviter une boucle de calcul au scroll.
    const scrolled = Math.max(0, window.scrollY - header.offsetTop);
    const extraOffset = reducedMotion.matches || header.matches(':focus-within')
      ? 0
      : -Math.min(scrolled * 0.45, header.offsetHeight);
    header.style.setProperty('--header-offset', `${extraOffset.toFixed(2)}px`);
    // Le header remonte 1,45 fois plus vite que le contenu ; la nav reste fixe.
    const next = header.offsetTop + header.offsetHeight - window.scrollY + extraOffset <= 0;
    if (next === visible) return;
    visible = next;
    if (!visible) {
      if (bar.contains(document.activeElement)) header.querySelector('a').focus({ preventScroll: true });
      setOpen(false);
    }
    bar.inert = !visible;
    bar.setAttribute('aria-hidden', String(!visible));
    // La barre reste fixe : seul le header qui défile au-dessus la découvre.
    // Les contrôles sont désactivés tant que le header les recouvre.
  }
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  bar.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setOpen(false, true);
  });
  bar.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    const target = document.querySelector(link.getAttribute('href'));
    const wasOpen = toggle.getAttribute('aria-expanded') === 'true';
    setOpen(false);
    if (wasOpen && target) {
      // Transfère le focus vers la section plutôt que de le laisser dans le menu masqué.
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
      target.focus({ preventScroll: true });
    }
  }));
  document.addEventListener('click', event => {
    if (!bar.contains(event.target)) setOpen(false);
  });
  mobile.addEventListener('change', () => {
    const focusInside = links.contains(document.activeElement);
    setOpen(false, mobile.matches && focusInside && visible);
  });
  let scheduled = false;
  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; updateVisibility(); });
  }
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  header.addEventListener('focusin', scheduleUpdate);
  header.addEventListener('focusout', scheduleUpdate);
  reducedMotion.addEventListener('change', scheduleUpdate);
  window.addEventListener('pageshow', updateVisibility);
  setOpen(false);
  updateVisibility();
})();
