// Valeurs proposees pour le prototype, a ajuster avec la plateforme de marque.
(() => {
  'use strict';

  const messages = {
    'fr-FR': {
      words: ['Innovation', 'Précision', 'Connexion', 'Accompagnement'],
      pause: 'Mettre en pause', resume: 'Reprendre', reduced: 'Animation désactivée'
    },
    'en-US': {
      words: ['Innovation', 'Precision', 'Connection', 'Support'],
      pause: 'Pause', resume: 'Resume', reduced: 'Animation disabled'
    },
    'es-ES': {
      words: ['Innovación', 'Precisión', 'Conexión', 'Acompañamiento'],
      pause: 'Pausar', resume: 'Reanudar', reduced: 'Animación desactivada'
    },
    'de-DE': {
      words: ['Innovation', 'Präzision', 'Verbindung', 'Begleitung'],
      pause: 'Pausieren', resume: 'Fortsetzen', reduced: 'Animation deaktiviert'
    },
    'ja-JP': {
      words: ['革新', '精密さ', 'つながり', 'サポート'],
      pause: '一時停止', resume: '再開', reduced: 'アニメーション無効'
    },
    'zh-CN': {
      words: ['创新', '精准', '连接', '支持'],
      pause: '暂停', resume: '继续', reduced: '动画已关闭'
    }
  };

  const word = document.querySelector('#hero-value');
  const toggle = document.querySelector('#hero-motion-toggle');
  const label = document.querySelector('#hero-motion-label');
  const icon = document.querySelector('#hero-motion-icon');
  const summary = document.querySelector('#hero-values-summary');
  const visual = document.querySelector('.hero-visual');
  const art = document.querySelector('.hero-art');
  const measure = document.createElement('canvas').getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const canAnimate = typeof word.animate === 'function';
  let index = 0;
  let paused = false;
  let inView = true;
  let timer;
  let animation;
  let revision = 0;
  let fitScheduled = false;

  const content = () => messages[document.documentElement.lang] || messages['fr-FR'];
  const canRun = () => canAnimate && !paused && !reducedMotion.matches && !document.hidden && inView;

  function fitWords() {
    if (!measure || !word.clientWidth) return;
    const style = getComputedStyle(word);
    const available = Math.max(1, word.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 8);
    const tracking = parseFloat(style.letterSpacing) || 0;
    // Mesure les vraies largeurs de la police chargee, pas le nombre de lettres.
    measure.font = `${style.fontStyle} ${style.fontWeight} 100px ${style.fontFamily}`;
    let size = Math.min(180, art.clientHeight * 0.28);
    for (const text of content().words) {
      const metrics = measure.measureText(text);
      const width = Math.max(metrics.width, (metrics.actualBoundingBoxLeft || 0) + (metrics.actualBoundingBoxRight || 0));
      const spacing = tracking * Math.max(0, [...text].length - 1);
      if (width > 0) size = Math.min(size, (available - spacing) * 100 / width);
    }
    // Tous les mots conservent cette taille jusqu'au resize ou au changement de langue.
    word.style.setProperty('--hero-word-size', `${Math.max(1, Math.floor(size * 10) / 10)}px`);
  }

  function scheduleFit() {
    if (fitScheduled) return;
    fitScheduled = true;
    requestAnimationFrame(() => {
      fitScheduled = false;
      fitWords();
    });
  }

  function loadWordFonts() {
    scheduleFit();
    if (!document.fonts) return;
    const style = getComputedStyle(word);
    document.fonts.load(`${style.fontWeight} 100px ${style.fontFamily}`, content().words.join(' '))
      .then(scheduleFit).catch(scheduleFit);
  }

  function renderControls() {
    toggle.hidden = !canAnimate;
    toggle.disabled = reducedMotion.matches;
    label.textContent = reducedMotion.matches ? content().reduced : paused ? content().resume : content().pause;
    icon.textContent = paused ? '▶' : 'Ⅱ';
  }

  function stop() {
    revision++;
    clearTimeout(timer);
    if (animation) animation.cancel();
    animation = null;
  }

  async function advance() {
    if (!canRun()) return;
    const currentRevision = revision;
    try {
      animation = word.animate([
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(-12px)' }
      ], { duration: 220, easing: 'ease-in', fill: 'forwards' });
      await animation.finished;
      if (currentRevision !== revision) return;

      index = (index + 1) % content().words.length;
      word.textContent = content().words[index];
      animation.cancel();
      animation = word.animate([
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 360, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      await animation.finished;
      if (currentRevision !== revision) return;
      animation = null;
      if (canRun()) timer = setTimeout(advance, 2800);
    } catch {
      // Annulation normale lors d'une pause ou d'un changement de langue.
    }
  }

  function restart() {
    stop();
    renderControls();
    if (canRun()) timer = setTimeout(advance, 2800);
  }

  function changeLanguage() {
    stop();
    index = 0;
    word.textContent = content().words[index];
    // Liste statique pour les lecteurs d'ecran, sans annonces repetees en boucle.
    summary.textContent = content().words.join(', ') + '.';
    loadWordFonts();
    restart();
  }

  toggle.addEventListener('click', () => {
    paused = !paused;
    restart();
  });
  document.addEventListener('eureka:languagechange', changeLanguage);
  document.addEventListener('visibilitychange', restart);
  reducedMotion.addEventListener('change', restart);
  window.addEventListener('resize', scheduleFit, { passive: true });
  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(scheduleFit);
    resizeObserver.observe(visual);
  }
  if (document.fonts) {
    document.fonts.ready.then(scheduleFit);
    document.fonts.addEventListener('loadingdone', scheduleFit);
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      restart();
    });
    observer.observe(visual);
  }

  changeLanguage();
})();
