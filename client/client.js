(() => {
  'use strict';

  /* 01. Données et état de la démonstration. */
  const dictionaries = window.EUREKA_CLIENT_LOCALES;
  const routes = ['dashboard', 'services', 'assistant', 'support', 'account'];
  const products = [
    { id: 'EC-2041', key: 'compute', description: 'descCompute', icon: 'compute', metric: 'memory', used: 24, total: 64, unit: 'GiB', since: '2026-09-08' },
    { id: 'EN-1087', key: 'network', description: 'descNetwork', icon: 'network', metric: 'traffic', used: 132, total: 200, unit: 'GB', since: '2026-09-12' },
    { id: 'ED-3062', key: 'devices', description: 'descDevices', icon: 'devices', metric: 'equipment', used: 18, total: 24, unit: '', since: '2026-10-02' },
    { id: 'EA-4018', key: 'advisory', description: 'descAdvisory', icon: 'assistant', metric: 'setupProgress', used: 35, total: 100, unit: '%', since: null }
  ];
  const storageKey = 'eureka.client.demo.v1';
  const defaultState = {
    profile: { name: 'Camille Martin', email: 'camille.martin@example.com', company: 'Atelier Horizon', type: 'business' },
    statuses: { 'EC-2041': 'active', 'EN-1087': 'active', 'ED-3062': 'active', 'EA-4018': 'pending' },
    tickets: [],
    chat: [],
    activity: [
      { key: 'eventWelcome', at: '2026-11-13T09:00:00Z' },
      { key: 'eventNetwork', at: '2026-09-12T10:00:00Z' }
    ]
  };
  let state = JSON.parse(JSON.stringify(defaultState));
  let locale = 'fr-FR';
  let route = 'dashboard';
  let search = '';
  let statusFilter = 'all';
  let dialogProduct = null;
  let requestedSupportService = null;
  let toastTimer;
  let menuOpen = false;

  try {
    const savedLocale = localStorage.getItem('eureka.locale');
    if (Object.hasOwn(dictionaries, savedLocale)) locale = savedLocale;
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && typeof saved === 'object') {
      for (const key of ['name', 'email', 'company']) {
        if (typeof saved.profile?.[key] === 'string') state.profile[key] = saved.profile[key].slice(0, 150);
      }
      if (['business', 'individual'].includes(saved.profile?.type)) state.profile.type = saved.profile.type;
      for (const product of products) {
        const allowed = product.since ? ['active', 'suspended'] : ['pending'];
        if (allowed.includes(saved.statuses?.[product.id])) state.statuses[product.id] = saved.statuses[product.id];
      }
      if (Array.isArray(saved.tickets)) state.tickets = saved.tickets.filter(validTicket).slice(0, 30);
      if (Array.isArray(saved.chat)) state.chat = saved.chat.filter(validChat).slice(-40);
      if (Array.isArray(saved.activity)) {
        const allowed = ['eventWelcome', 'eventNetwork', 'eventProfile', 'eventStatus', 'eventTicket'];
        state.activity = saved.activity.filter(item => item && allowed.includes(item.key) && validDate(item.at)).slice(0, 12);
      }
    }
  } catch { /* La démo reste utilisable si le stockage est bloqué ou corrompu. */ }

  const workspace = document.querySelector('#workspace');
  const dialog = document.querySelector('#service-dialog');
  const localeSelect = document.querySelector('#locale-select');
  const sidebar = document.querySelector('#sidebar');
  const menuToggle = document.querySelector('#menu-toggle');
  const scrim = document.querySelector('#sidebar-scrim');
  const mobile = matchMedia('(max-width: 900px)');

  function validDate(value) {
    return typeof value === 'string' && !Number.isNaN(Date.parse(value));
  }

  function validTicket(item) {
    return item && typeof item.id === 'string' && typeof item.subject === 'string' && item.subject.length <= 150
      && typeof item.message === 'string' && item.message.length <= 3000 && validDate(item.at)
      && (item.service === 'general' || products.some(product => product.id === item.service));
  }

  function validChat(item) {
    return item && ((item.role === 'user' && typeof item.text === 'string' && item.text.length <= 1000)
      || (item.role === 'bot' && ['botStatus', 'botNetwork', 'botSupport', 'botFallback'].includes(item.key)));
  }

  /* 02. Helpers de rendu : aucune donnée saisie n’est injectée sans échappement. */
  function escape(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  }

  function t(key, values = {}) {
    const text = dictionaries[locale][key] ?? dictionaries['fr-FR'][key] ?? key;
    return text.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
  }

  function icon(name) {
    const paths = {
      dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
      services: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 17.5h.01M11 7.5h6M11 17.5h6"/>',
      assistant: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
      support: '<path d="M4 13v-1a8 8 0 0 1 16 0v1M4 13h3v7H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 1-2ZM20 13h-3v7h2a2 2 0 0 0 2-2v-3a2 2 0 0 0-1-2Z"/>',
      account: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
      compute: '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h6v6H9ZM9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
      network: '<circle cx="12" cy="5" r="3"/><rect x="2" y="17" width="7" height="5" rx="1"/><rect x="15" y="17" width="7" height="5" rx="1"/><path d="M12 8v5M5.5 17v-4h13v4"/>',
      devices: '<rect x="3" y="3" width="13" height="15" rx="2"/><rect x="17" y="10" width="5" height="11" rx="1"/><path d="M7 22h5M9.5 18v4"/>',
      arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.services}</svg>`;
  }

  function date(value) {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'Europe/Paris' }).format(new Date(value));
  }

  function number(value) {
    return new Intl.NumberFormat(locale).format(value);
  }

  function counts() {
    return Object.values(state.statuses).reduce((result, status) => { result[status]++; return result; }, { active: 0, suspended: 0, pending: 0 });
  }

  function avatar() {
    return state.profile.name.trim().split(/\s+/u).slice(0, 2).map(part => [...part][0] || '').join('').toUpperCase() || 'E';
  }

  function notify(key) {
    const toast = document.querySelector('#toast');
    clearTimeout(toastTimer);
    toast.textContent = t(key);
    toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 5000);
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      return true;
    } catch {
      notify('storageError');
      return false;
    }
  }

  function activity(key) {
    state.activity.unshift({ key, at: new Date().toISOString() });
    state.activity = state.activity.slice(0, 12);
  }

  function badge(status) {
    return `<span class="status-badge ${status}"><span aria-hidden="true"></span>${escape(t(status))}</span>`;
  }

  function actionLink(target, text, className = 'button secondary') {
    return `<a class="${className}" href="#${target}">${escape(t(text))}${icon('arrow')}</a>`;
  }

  function pageHeading(eyebrow, title, description) {
    return `<div class="page-heading"><p class="eyebrow">${escape(t(eyebrow))}</p><h1>${escape(title)}</h1><p>${escape(t(description))}</p></div>`;
  }

  /* 03. Navigation et shell responsive. */
  function setMenu(open, returnFocus = false) {
    menuOpen = mobile.matches && open;
    document.body.classList.toggle('menu-open', menuOpen);
    menuToggle.setAttribute('aria-expanded', String(menuOpen));
    menuToggle.setAttribute('aria-label', t(menuOpen ? 'closeMenu' : 'menu'));
    scrim.hidden = !menuOpen;
    sidebar.inert = mobile.matches && !menuOpen;
    if (returnFocus) menuToggle.focus();
  }

  function renderShell() {
    document.documentElement.lang = locale;
    document.title = `Eureka — ${t(route)}`;
    localeSelect.value = locale;
    document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
    document.querySelector('#primary-nav').setAttribute('aria-label', t('navLabel'));
    document.querySelector('#primary-nav').innerHTML = routes.map(item => `<a class="nav-item ${item === route ? 'selected' : ''}" href="#${item}"${item === route ? ' aria-current="page"' : ''}>${icon(item)}<span>${escape(t(item))}</span>${item === 'assistant' ? '<span class="nav-spark" aria-hidden="true">✦</span>' : ''}</a>`).join('');
    document.querySelector('#breadcrumb-page').textContent = t(route);
    document.querySelector('#header-avatar').textContent = avatar();
    document.querySelector('#header-avatar').setAttribute('aria-label', t('account'));
    document.querySelector('#sidebar-profile').innerHTML = `<span class="avatar">${escape(avatar())}</span><span><strong>${escape(state.profile.name)}</strong><small>${escape(t(state.profile.type))}</small></span>`;
    scrim.setAttribute('aria-label', t('closeMenu'));
    document.querySelector('#sidebar-close').setAttribute('aria-label', t('closeMenu'));
    setMenu(menuOpen);
  }

  function metric(product) {
    const paused = state.statuses[product.id] === 'suspended';
    return `<div class="metric-label"><span>${escape(t(product.metric))}</span><strong>${number(product.used)} / ${number(product.total)} ${escape(product.unit)}</strong></div><progress class="${paused ? 'paused-progress' : ''}" max="${product.total}" value="${product.used}" aria-label="${escape(t(product.metric))}"></progress><small class="usage-caption">${escape(t('usage'))}</small>`;
  }

  function serviceCard(product) {
    return `<article class="service-card"><div class="card-heading"><span class="product-icon ${product.key}">${icon(product.icon)}</span>${badge(state.statuses[product.id])}</div><small class="service-id">${product.id}</small><h3>${escape(t(product.key))}</h3><p>${escape(t(product.description))}</p><div class="service-metric">${metric(product)}</div><button class="card-link" type="button" data-details="${product.id}" aria-label="${escape(t('details') + ' — ' + t(product.key))}">${escape(t('details'))}${icon('arrow')}</button></article>`;
  }

  /* 04. Tableau de bord et services. */
  function dashboardView() {
    const totals = counts();
    const firstName = state.profile.name.trim().split(/\s+/u)[0] || 'Camille';
    return `${pageHeading('overview', t('hello', { name: firstName }), 'dashboardIntro')}
      <div class="demo-notice">${icon('assistant')}<span>${escape(t('demoNote'))}</span></div>
      <div class="stats-grid">
        <article class="stat-card"><span class="stat-icon">${icon('check')}</span><p>${escape(t('activeServices'))}</p><strong>${number(totals.active).padStart(2, '0')}</strong><small>${escape(t('serviceTotal', { count: number(products.length) }))}</small></article>
        <article class="stat-card"><span class="stat-icon peach">${icon('clock')}</span><p>${escape(t('pendingServices'))}</p><strong>${number(totals.pending).padStart(2, '0')}</strong><small>${escape(t('localWorkspace'))}</small></article>
        <article class="stat-card"><span class="stat-icon violet">${icon('support')}</span><p>${escape(t('ticketsCount'))}</p><strong>${number(state.tickets.length).padStart(2, '0')}</strong><small>${escape(t('ticketStatus'))}</small></article>
      </div>
      <div class="section-title"><h2>${escape(t('services'))}</h2><a href="#services">${escape(t('viewAll'))} ↗</a></div>
      <div class="service-grid dashboard-services">${products.slice(0, 3).map(serviceCard).join('')}</div>
      <div class="dashboard-bottom"><section class="panel activity-panel"><div class="section-title"><h2>${escape(t('recentActivity'))}</h2></div><p class="muted">${escape(t('activityIntro'))}</p><ol class="activity-list">${state.activity.slice(0, 4).map(item => `<li><span class="activity-dot" aria-hidden="true"></span><div><p>${escape(t(item.key))}</p><time datetime="${escape(item.at)}">${escape(date(item.at))}</time></div></li>`).join('')}</ol></section><section class="help-panel"><span class="help-star" aria-hidden="true">✦</span><h2>${escape(t('quickActions'))}</h2><p>${escape(t('quickIntro'))}</p>${actionLink('assistant', 'askAssistant', 'button primary')}${actionLink('support', 'contactSupport', 'text-link')}</section></div>`;
  }

  function filteredProducts() {
    const query = search.toLocaleLowerCase(locale).trim();
    return products.filter(product => (statusFilter === 'all' || state.statuses[product.id] === statusFilter)
      && `${t(product.key)} ${t(product.description)} ${product.id}`.toLocaleLowerCase(locale).includes(query));
  }

  function servicesView() {
    return `${pageHeading('services', t('servicesTitle'), 'servicesIntro')}<div class="service-toolbar"><label class="search-control"><span class="sr-only">${escape(t('search'))}</span><input id="service-search" type="search" placeholder="${escape(t('search'))}" value="${escape(search)}" maxlength="100"></label><label><span class="sr-only">${escape(t('status'))}</span><select id="status-filter">${['all', 'active', 'suspended', 'pending'].map(status => `<option value="${status}"${statusFilter === status ? ' selected' : ''}>${escape(t(status))}</option>`).join('')}</select></label></div><div class="service-grid all-services" id="service-results">${serviceResults()}</div>`;
  }

  function serviceResults() {
    const list = filteredProducts();
    return list.length ? list.map(serviceCard).join('') : `<p class="empty-state" role="status">${escape(t('noMatches'))}</p>`;
  }

  function renderDialog() {
    const product = products.find(item => item.id === dialogProduct);
    if (!product) return;
    const status = state.statuses[product.id];
    dialog.innerHTML = `<div class="dialog-top"><span class="product-icon ${product.key}">${icon(product.icon)}</span><button class="icon-button" type="button" data-close-dialog aria-label="${escape(t('close'))}">×</button></div><p class="eyebrow">${product.id}</p><h2 id="dialog-title">${escape(t(product.key))}</h2><p class="muted">${escape(t(product.description))}</p>${badge(status)}<div class="dialog-metric">${metric(product)}</div><dl class="detail-list"><div><dt>${escape(t('plan'))}</dt><dd>${escape(t('planValue'))}</dd></div><div><dt>${escape(t('region'))}</dt><dd>${escape(t('regionValue'))}</dd></div><div><dt>${escape(t('project'))}</dt><dd>${escape(t('projectValue'))}</dd></div>${product.since ? `<div><dt>${escape(t('since'))}</dt><dd>${escape(date(product.since))}</dd></div>` : ''}</dl><h3>${escape(t('manage'))}</h3><p class="small muted">${escape(t('serviceNotice'))}</p>${status === 'pending' ? `<p class="inline-notice">${escape(t('pendingNote'))}</p>` : `<button class="button ${status === 'active' ? 'secondary' : 'primary'}" data-toggle-service="${product.id}" type="button">${escape(t(status === 'active' ? 'suspend' : 'resume'))}</button>`}<a class="text-link dialog-support" href="#support" data-dialog-support="${product.id}">${escape(t('contactSupport'))} ↗</a>`;
  }

  /* 05. Chatbot : scénarios locaux, sans API ni messagerie. */
  function botText(key) {
    return t(key, counts());
  }

  function chatMessages() {
    const messages = [{ role: 'bot', key: 'welcome' }, ...state.chat];
    return messages.map(item => `<article class="chat-message ${item.role}"><span class="chat-avatar" aria-hidden="true">${item.role === 'bot' ? '✦' : escape(avatar())}</span><div><strong>${escape(t(item.role === 'bot' ? 'bot' : 'me'))}</strong><p>${escape(item.role === 'bot' ? botText(item.key) : item.text)}</p></div></article>`).join('');
  }

  function assistantView() {
    return `${pageHeading('assistant', t('assistantTitle'), 'assistantIntro')}<section class="chat-panel"><div class="chat-top"><span>${icon('assistant')} ${escape(t('chatNotice'))}</span><button class="quiet-button" type="button" id="clear-chat">${escape(t('clearChat'))}</button></div><div class="chat-feed" id="chat-feed" role="log" aria-live="polite" aria-label="${escape(t('assistant'))}">${chatMessages()}</div><div class="suggestions">${[['status', 'suggestStatus'], ['network', 'suggestNetwork'], ['support', 'suggestSupport']].map(([intent, key]) => `<button type="button" data-intent="${intent}">${escape(t(key))} ↗</button>`).join('')}</div><form id="chat-form" class="chat-composer"><label class="sr-only" for="chat-input">${escape(t('chatPlaceholder'))}</label><textarea id="chat-input" name="chat" rows="2" maxlength="1000" required placeholder="${escape(t('chatPlaceholder'))}"></textarea><button type="submit" class="button primary">${escape(t('send'))}${icon('arrow')}</button></form></section>`;
  }

  function detectIntent(text) {
    if (/support|aide|ayuda|hilfe|サポート|支持|客服/iu.test(text)) return 'support';
    if (/réseau|reseau|network|connect|red\b|netz|ネット|网络/iu.test(text)) return 'network';
    if (/statut|état|etat|status|estado|service|dienst|サービス|服务/iu.test(text)) return 'status';
    return 'fallback';
  }

  function sendChat(text, intent = detectIntent(text)) {
    const keys = { status: 'botStatus', network: 'botNetwork', support: 'botSupport', fallback: 'botFallback' };
    state.chat.push({ role: 'user', text: text.slice(0, 1000) }, { role: 'bot', key: keys[intent] || 'botFallback' });
    state.chat = state.chat.slice(-40);
    save();
    const feed = document.querySelector('#chat-feed');
    feed.innerHTML = chatMessages();
    feed.scrollTop = feed.scrollHeight;
  }

  /* 06. Support et compte : saisies fictives enregistrées localement. */
  function serviceOptions(includeGeneral = true) {
    return `${includeGeneral ? `<option value="general">${escape(t('general'))}</option>` : ''}${products.map(product => `<option value="${product.id}">${escape(t(product.key))}</option>`).join('')}`;
  }

  function ticketsList() {
    if (!state.tickets.length) return `<div class="empty-state">${icon('support')}<p>${escape(t('emptyTickets'))}</p></div>`;
    return state.tickets.map(ticket => `<details class="ticket"><summary><span><small>${escape(ticket.id)} · ${escape(date(ticket.at))}</small><strong>${escape(ticket.subject)}</strong></span><span class="status-badge pending">${escape(t('ticketStatus'))}</span></summary><p class="ticket-service">${escape(t('relatedService'))} : ${escape(ticket.service === 'general' ? t('general') : t(products.find(product => product.id === ticket.service).key))}</p><p class="ticket-message">${escape(ticket.message)}</p></details>`).join('');
  }

  function supportView() {
    return `${pageHeading('support', t('supportTitle'), 'supportIntro')}<div class="support-layout"><section class="panel"><div class="inline-notice">${escape(t('supportNotice'))}</div><form id="support-form" class="stack-form"><label>${escape(t('subject'))}<input name="subject" required minlength="3" maxlength="150" placeholder="${escape(t('subjectPlaceholder'))}"></label><label>${escape(t('relatedService'))}<select name="service">${serviceOptions()}</select></label><label>${escape(t('message'))}<textarea name="message" rows="6" minlength="10" maxlength="3000" required placeholder="${escape(t('messagePlaceholder'))}"></textarea></label><button class="button primary" type="submit">${escape(t('saveTicket'))}${icon('arrow')}</button></form></section><section class="panel tickets-panel"><h2>${escape(t('ticketsTitle'))}</h2><div id="tickets-list">${ticketsList()}</div></section></div>`;
  }

  function accountView() {
    const profile = state.profile;
    return `${pageHeading('account', t('accountTitle'), 'accountIntro')}<div class="account-layout"><section class="panel"><h2>${escape(t('profile'))}</h2><form id="account-form" class="stack-form"><label>${escape(t('name'))}<input name="name" autocomplete="off" maxlength="100" required value="${escape(profile.name)}"></label><label>${escape(t('email'))}<input name="email" type="email" autocomplete="off" maxlength="150" required value="${escape(profile.email)}"></label><label>${escape(t('company'))}<input name="company" autocomplete="off" maxlength="150" value="${escape(profile.company)}"></label><label>${escape(t('type'))}<select name="type"><option value="business"${profile.type === 'business' ? ' selected' : ''}>${escape(t('business'))}</option><option value="individual"${profile.type === 'individual' ? ' selected' : ''}>${escape(t('individual'))}</option></select></label><button class="button primary" type="submit">${escape(t('saveProfile'))}${icon('check')}</button></form></section><aside class="account-summary"><span class="avatar large">${escape(avatar())}</span><h2>${escape(profile.name)}</h2><p>${escape(profile.company)}</p><span class="demo-badge">${escape(t('demo'))}</span><p class="small">${escape(t('accountNotice'))}</p></aside></div>`;
  }

  function render() {
    renderShell();
    workspace.innerHTML = ({ dashboard: dashboardView, services: servicesView, assistant: assistantView, support: supportView, account: accountView })[route]();
  }

  /* 07. Événements et navigation. */
  function navigate() {
    const requested = location.hash.slice(1);
    route = routes.includes(requested) ? requested : 'dashboard';
    if (dialog.open) dialog.close();
    setMenu(false);
    render();
    if (route === 'support' && requestedSupportService) {
      document.querySelector('#support-form').elements.service.value = requestedSupportService;
      requestedSupportService = null;
    }
    workspace.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  localeSelect.addEventListener('change', () => {
    // Préserve les saisies non enregistrées lors du changement de langue.
    const drafts = [...workspace.querySelectorAll('form')].map(form => ({ id: form.id, values: [...new FormData(form)] }));
    locale = localeSelect.value;
    try { localStorage.setItem('eureka.locale', locale); } catch { /* Facultatif. */ }
    render();
    for (const draft of drafts) {
      const form = document.getElementById(draft.id);
      if (form) for (const [name, value] of draft.values) if (form.elements[name]) form.elements[name].value = value;
    }
    if (dialog.open) renderDialog();
    document.querySelector('#toast').classList.remove('visible');
  });

  menuToggle.addEventListener('click', () => {
    setMenu(!menuOpen);
    if (menuOpen) document.querySelector('#sidebar-close').focus();
  });
  document.querySelector('#sidebar-close').addEventListener('click', () => setMenu(false, true));
  scrim.addEventListener('click', () => setMenu(false, true));
  mobile.addEventListener('change', () => {
    const needsFocus = mobile.matches && sidebar.contains(document.activeElement);
    setMenu(false, needsFocus);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuOpen) setMenu(false, true);
    // Le bouton et le panneau forment un cycle de focus quand le menu mobile est ouvert.
    if (event.key === 'Tab' && menuOpen) {
      const items = [...sidebar.querySelectorAll('a[href], button:not([disabled])'), menuToggle];
      const current = items.indexOf(document.activeElement);
      if (current < 0 || (!event.shiftKey && current === items.length - 1) || (event.shiftKey && current === 0)) {
        event.preventDefault();
        (event.shiftKey ? items.at(-1) : items[0]).focus();
      }
    }
  });

  workspace.addEventListener('input', event => {
    if (event.target.id === 'service-search') {
      search = event.target.value;
      document.querySelector('#service-results').innerHTML = serviceResults();
    }
  });
  workspace.addEventListener('change', event => {
    if (event.target.id === 'status-filter') {
      statusFilter = event.target.value;
      document.querySelector('#service-results').innerHTML = serviceResults();
    }
  });
  workspace.addEventListener('click', event => {
    const detailButton = event.target.closest('[data-details]');
    if (detailButton) {
      dialogProduct = detailButton.dataset.details;
      renderDialog();
      dialog.showModal();
    }
    const suggestion = event.target.closest('[data-intent]');
    if (suggestion) {
      const intent = suggestion.dataset.intent;
      const key = { status: 'suggestStatus', network: 'suggestNetwork', support: 'suggestSupport' }[intent];
      sendChat(t(key), intent);
    }
    if (event.target.closest('#clear-chat')) {
      state.chat = [];
      const persisted = save();
      document.querySelector('#chat-feed').innerHTML = chatMessages();
      if (persisted) notify('chatEmpty');
    }
  });

  workspace.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.target;
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    if (form.id === 'chat-form') {
      if (!values.chat.trim()) return;
      sendChat(values.chat.trim());
      form.reset();
      document.querySelector('#chat-input').focus();
    } else if (form.id === 'support-form') {
      if (values.subject.trim().length < 3 || values.message.trim().length < 10) return;
      state.tickets.unshift({ id: `DEMO-${Date.now().toString(36).toUpperCase()}`, subject: values.subject.trim(), message: values.message.trim(), service: values.service, at: new Date().toISOString() });
      state.tickets = state.tickets.slice(0, 30);
      activity('eventTicket');
      const persisted = save();
      form.reset();
      document.querySelector('#tickets-list').innerHTML = ticketsList();
      if (persisted) notify('savedTicket');
    } else if (form.id === 'account-form') {
      if (!values.name.trim()) return;
      state.profile = { name: values.name.trim(), email: values.email.trim(), company: values.company.trim(), type: values.type };
      activity('eventProfile');
      const persisted = save();
      render();
      if (persisted) notify('savedProfile');
    }
  });

  dialog.addEventListener('click', event => {
    if (event.target.closest('[data-close-dialog]')) dialog.close();
    const toggleService = event.target.closest('[data-toggle-service]');
    if (toggleService) {
      const id = toggleService.dataset.toggleService;
      if (!products.some(product => product.id === id && product.since)) return;
      state.statuses[id] = state.statuses[id] === 'active' ? 'suspended' : 'active';
      activity('eventStatus');
      const persisted = save();
      render();
      renderDialog();
      dialog.querySelector('[data-toggle-service]').focus();
      if (persisted) notify('statusChanged');
    }
    const supportLink = event.target.closest('[data-dialog-support]');
    if (supportLink) {
      event.preventDefault();
      requestedSupportService = supportLink.dataset.dialogSupport;
      dialog.close();
      if (location.hash === '#support') navigate();
      else location.hash = 'support';
    }
  });

  window.addEventListener('hashchange', navigate);
  navigate();
})();
