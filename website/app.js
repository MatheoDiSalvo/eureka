(() => {
  'use strict';
  const services = window.EUREKA_SERVICES;
  const grid = document.querySelector('#service-grid');
  const form = document.querySelector('#request-form');
  const select = document.querySelector('#service-select');
  const status = document.querySelector('#form-status');
  const storageKey = 'eureka.request.draft.v1';
  const t = key => window.EUREKA_I18N.t(key);
  let currentAudience = 'all';
  let statusKey = '';
  function setStatus(key) { statusKey = key; status.textContent = t(key); }
  const audienceNames = { entreprise: 'Entreprises', particulier: 'Particuliers' };
  for (const service of services) {
    const option = document.createElement('option');
    option.value = service.id;
    option.textContent = t(service.label);
    select.append(option);
  }
  function render(audience = 'all') {
    currentAudience = audience;
    grid.replaceChildren();
    const visible = services.filter(service => audience === 'all' || service.audience.includes(audience));
    for (const service of visible) {
      const card = document.createElement('article');
      card.className = 'service-card';
      const top = document.createElement('div'); top.className = 'card-top';
      const category = document.createElement('span'); category.textContent = t(service.category);
      const number = document.createElement('span'); number.textContent = service.number;
      top.append(category, number);
      const symbol = document.createElement('div'); symbol.className = 'service-symbol'; symbol.textContent = service.symbol; symbol.setAttribute('aria-hidden', 'true');
      const heading = document.createElement('h3'); heading.textContent = t(service.title);
      const description = document.createElement('p'); description.textContent = t(service.description);
      const tags = document.createElement('small'); tags.textContent = service.audience.map(a => t(audienceNames[a])).join(' / ');
      const button = document.createElement('button'); button.type = 'button'; button.className = 'service-link'; button.textContent = t('Préparer un projet ↗'); button.setAttribute('aria-label', `${t('Préparer un projet :')} ${t(service.label)}`);
      button.addEventListener('click', () => {
        select.value = service.id;
        form.elements.audience.value = audience === 'all' ? service.audience[0] : audience;
        validateAudience();
        document.querySelector('#demande').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        select.focus({ preventScroll: true });
      });
      card.append(top, symbol, heading, description, tags, button); grid.append(card);
    }
    document.querySelector('#filter-status').textContent = `${visible.length} ${t('services affichés.')}`;
  }
  document.querySelectorAll('[data-audience]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-audience]').forEach(filter => {
      const active = filter === button; filter.classList.toggle('active', active); filter.setAttribute('aria-pressed', String(active));
    });
    render(button.dataset.audience);
  }));
  function validateAudience() {
    const service = services.find(item => item.id === select.value);
    select.setCustomValidity(service && !service.audience.includes(form.elements.audience.value) ? t('Ce service est proposé aux entreprises. Choisissez un autre service ou changez votre profil.') : '');
  }
  form.addEventListener('change', validateAudience);
  function getDraft() { return Object.fromEntries(new FormData(form)); }
  function validatedDraft() { validateAudience(); return form.reportValidity() ? getDraft() : null; }
  form.addEventListener('submit', event => {
    event.preventDefault(); const draft = validatedDraft(); if (!draft) return;
    try { localStorage.setItem(storageKey, JSON.stringify(draft)); setStatus('Brouillon enregistré sur cet appareil. Aucune demande n’a été envoyée.'); }
    catch { setStatus('Le stockage local est indisponible. Vous pouvez télécharger votre brouillon.'); }
  });
  document.querySelector('#download-draft').addEventListener('click', () => {
    const draft = validatedDraft(); if (!draft) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'eureka-brouillon.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('Téléchargement du brouillon préparé. Aucune demande n’a été envoyée.');
  });
  document.querySelector('#clear-draft').addEventListener('click', () => {
    try { localStorage.removeItem(storageKey); } catch { setStatus('Impossible d’accéder au stockage local pour effacer le brouillon.'); return; }
    form.reset(); validateAudience(); setStatus('Brouillon effacé de cet appareil.');
  });
  try {
    const draft = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (draft && typeof draft === 'object') {
      for (const name of ['audience', 'service', 'name', 'email', 'message']) if (typeof draft[name] === 'string') form.elements[name].value = draft[name];
      validateAudience(); setStatus('Votre brouillon local a été restauré.');
    }
  } catch { /* Le formulaire reste utilisable sans stockage local. */ }
  document.addEventListener('eureka:languagechange', () => {
    services.forEach(service => { select.querySelector(`option[value="${service.id}"]`).textContent = t(service.label); });
    render(currentAudience);
    validateAudience();
    if (statusKey) setStatus(statusKey);
  });
  render();
})();
