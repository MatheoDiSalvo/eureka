// Vérifications sans dépendance : rendu des vues et parcours locaux en DOM simulé.
// Ces tests ne remplacent pas un contrôle visuel dans un navigateur.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const directory = __dirname;
const localeCode = fs.readFileSync(path.join(directory, 'locales.js'), 'utf8');
const appCode = fs.readFileSync(path.join(directory, 'client.js'), 'utf8');

function element() {
  const attributes = {};
  const classes = new Set();
  return {
    innerHTML: '', textContent: '', value: '', open: false, handlers: {},
    classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
      toggle(name, active) { if (active) classes.add(name); else classes.delete(name); }
    },
    addEventListener(name, handler) { this.handlers[name] = handler; },
    setAttribute(name, value) { attributes[name] = value; },
    getAttribute(name) { return attributes[name]; },
    focus() { this.focused = true; },
    contains() { return false; },
    querySelectorAll() { return []; },
    querySelector() { return element(); },
    showModal() { this.open = true; },
    close() { this.open = false; }
  };
}

function boot(initialStorage = {}, storageBlocked = false) {
  const nodes = Object.fromEntries([
    'workspace', 'service-dialog', 'locale-select', 'sidebar', 'sidebar-close', 'menu-toggle',
    'sidebar-scrim', 'primary-nav', 'breadcrumb-page', 'header-avatar',
    'sidebar-profile', 'toast', 'service-results', 'chat-feed', 'chat-input',
    'tickets-list', 'support-form'
  ].map(id => [`#${id}`, element()]));
  nodes['#support-form'].elements = { service: { value: 'general' } };
  const storage = new Map(Object.entries(initialStorage));
  const window = { handlers: {}, addEventListener(name, handler) { this.handlers[name] = handler; }, scrollTo() {} };
  const document = {
    documentElement: {}, title: '', body: element(), activeElement: null,
    querySelector(selector) {
      assert.ok(nodes[selector], `Unexpected selector: ${selector}`);
      return nodes[selector];
    },
    querySelectorAll() { return []; },
    getElementById(id) { return nodes[`#${id}`]; },
    addEventListener() {}
  };
  class LocalFormData {
    constructor(form) { this.values = Object.entries(form.values); }
    [Symbol.iterator]() { return this.values[Symbol.iterator](); }
  }
  let hash = '#dashboard';
  const location = {
    get hash() { return hash; },
    set hash(value) { hash = value.startsWith('#') ? value : `#${value}`; }
  };
  const context = {
    window, document, location,
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    localStorage: {
      getItem(key) { if (storageBlocked) throw Error('Blocked'); return storage.get(key) ?? null; },
      setItem(key, value) { if (storageBlocked) throw Error('Blocked'); storage.set(key, value); }
    },
    setTimeout() { return 1; }, clearTimeout() {}, FormData: LocalFormData,
    Intl, Date
  };
  vm.runInNewContext(localeCode, context);
  vm.runInNewContext(appCode, context);
  return {
    context, nodes, storage,
    route(route) { context.location.hash = `#${route}`; window.handlers.hashchange(); },
    language(locale) { nodes['#locale-select'].value = locale; nodes['#locale-select'].handlers.change(); },
    click(selector, dataset = {}) {
      nodes['#workspace'].handlers.click({ target: { closest: key => key === selector ? { dataset } : null } });
    },
    dialogClick(selector, dataset = {}) {
      nodes['#service-dialog'].handlers.click({ preventDefault() {}, target: { closest: key => key === selector ? { dataset } : null } });
    },
    submit(id, values) {
      const form = { id, values, reportValidity() { return true; }, reset() { this.didReset = true; } };
      nodes['#workspace'].handlers.submit({ preventDefault() {}, target: form });
    }
  };
}

function checkMarkup(html) {
  const stack = [];
  const voidTags = new Set(['input', 'img', 'br', 'hr', 'meta', 'link']);
  const ids = new Set();
  for (const match of html.matchAll(/<(\/?)([\w-]+)\b([^>]*?)>/g)) {
    const [, closing, tag, attributes] = match;
    if (closing) assert.equal(stack.pop(), tag, `Unbalanced closing tag: ${tag}`);
    else {
      const id = attributes.match(/\bid="([^"]+)"/)?.[1];
      if (id) { assert.ok(!ids.has(id), `Duplicate ID: ${id}`); ids.add(id); }
      if (!voidTags.has(tag) && !attributes.endsWith('/')) stack.push(tag);
    }
  }
  assert.equal(stack.length, 0, `Unclosed tags: ${stack}`);
}

/* Parité des dictionnaires et rendu des 30 combinaisons langue/vue. */
const app = boot();
const dictionaries = app.context.window.EUREKA_CLIENT_LOCALES;
const keys = Object.keys(dictionaries['fr-FR']).sort();
for (const [locale, dictionary] of Object.entries(dictionaries)) {
  assert.deepEqual(Object.keys(dictionary).sort(), keys, `Missing translations: ${locale}`);
  assert.ok(Object.values(dictionary).every(value => typeof value === 'string' && value.length));
  app.language(locale);
  for (const route of ['dashboard', 'services', 'assistant', 'support', 'account']) {
    app.route(route);
    const html = app.nodes['#workspace'].innerHTML;
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert.ok(!/undefined|NaN/.test(html));
    checkMarkup(html);
    assert.equal(app.context.document.documentElement.lang, locale);
  }
}

/* Fiches, mise en pause, restauration, filtrage et support lié au service. */
app.language('fr-FR');
app.route('services');
app.click('[data-details]', { details: 'EC-2041' });
assert.equal(app.nodes['#service-dialog'].open, true);
checkMarkup(app.nodes['#service-dialog'].innerHTML);
app.dialogClick('[data-toggle-service]', { toggleService: 'EC-2041' });
let saved = JSON.parse(app.storage.get('eureka.client.demo.v1'));
assert.equal(saved.statuses['EC-2041'], 'suspended');
const restored = boot(Object.fromEntries(app.storage));
restored.route('services');
assert.ok(restored.nodes['#workspace'].innerHTML.includes('En pause'));
app.nodes['#workspace'].handlers.input({ target: { id: 'service-search', value: 'EC-2041' } });
assert.ok(app.nodes['#service-results'].innerHTML.includes('Eureka Compute'));
assert.ok(!app.nodes['#service-results'].innerHTML.includes('Eureka Connect'));
app.dialogClick('[data-dialog-support]', { dialogSupport: 'EC-2041' });
app.context.window.handlers.hashchange();
assert.equal(app.nodes['#support-form'].elements.service.value, 'EC-2041');

/* Profil et support : données échappées et conservées dans le navigateur. */
app.route('account');
app.submit('account-form', { name: '<script>alert(1)</script>', email: 'demo@example.com', company: 'Demo', type: 'individual' });
assert.ok(!app.nodes['#workspace'].innerHTML.includes('<script>'));
assert.ok(app.nodes['#workspace'].innerHTML.includes('&lt;script&gt;'));
app.route('support');
app.submit('support-form', { subject: '<img src=x onerror=alert(1)>', message: 'Une question de démonstration.', service: 'EC-2041' });
saved = JSON.parse(app.storage.get('eureka.client.demo.v1'));
assert.equal(saved.tickets.length, 1);
assert.ok(app.nodes['#tickets-list'].innerHTML.includes('&lt;img'));
assert.ok(!app.nodes['#tickets-list'].innerHTML.includes('<img'));

/* Conversation scénarisée et aucun accès réseau des données utilisateur. */
app.route('assistant');
app.click('[data-intent]', { intent: 'status' });
assert.ok(app.nodes['#chat-feed'].innerHTML.includes('2 service(s) actif(s)'));
app.submit('chat-form', { chat: 'Comment fonctionne mon réseau ?' });
saved = JSON.parse(app.storage.get('eureka.client.demo.v1'));
assert.equal(saved.chat.at(-1).key, 'botNetwork');
app.click('#clear-chat');
assert.equal(JSON.parse(app.storage.get('eureka.client.demo.v1')).chat.length, 0);
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(appCode));

/* Dégradation propre lorsque le stockage n’est pas disponible. */
const blocked = boot({}, true);
blocked.route('support');
blocked.submit('support-form', { subject: 'Essai local', message: 'Message de test fictif.', service: 'general' });
assert.ok(blocked.nodes['#toast'].textContent.includes('stockage'));

/* Ressources locales, CSS et absence de marqueurs de conflit. */
for (const name of ['index.html', 'client.css', 'client.js', 'locales.js']) {
  const text = fs.readFileSync(path.join(directory, name), 'utf8');
  assert.ok(!/^(<<<<<<<|=======|>>>>>>>)/m.test(text));
}
const html = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (!match[1].startsWith('https:')) assert.ok(fs.existsSync(path.resolve(directory, match[1])), match[1]);
}
const css = fs.readFileSync(path.join(directory, 'client.css'), 'utf8');
assert.equal([...css].filter(c => c === '{').length, [...css].filter(c => c === '}').length);
console.log(`OK — ${Object.keys(dictionaries).length} langues, ${keys.length} textes par langue, 30 vues, services, support, profil, chatbot, persistance et échappement HTML.`);
