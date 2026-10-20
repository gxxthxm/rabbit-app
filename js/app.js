// App shell: hash router with push/pop transitions, tab bar, bottom sheets, toasts
// and delegated event handling for every screen.

(function (R) {
  const S = R.store;
  const V = R.views;
  const I = R.icon;

  const ROUTES = [
    [/^\/splash$/, 'splash'],
    [/^\/welcome$/, 'welcome'],
    [/^\/onboarding$/, 'onboarding'],
    [/^\/home$/, 'home'],
    [/^\/browse$/, 'browse'],
    [/^\/search$/, 'search'],
    [/^\/listing\/([\w-]+)$/, 'listing', ['id']],
    [/^\/tour\/([\w-]+)$/, 'tour', ['id']],
    [/^\/tours$/, 'tours'],
    [/^\/offer\/([\w-]+)$/, 'offer', ['id']],
    [/^\/checkout\/([\w-]+)$/, 'checkout', ['id']],
    [/^\/confirmed\/([\w-]+)$/, 'confirmed', ['id']],
    [/^\/offers$/, 'offers'],
    [/^\/offers\/([\w-]+)$/, 'offerStatus', ['id']],
    [/^\/saved$/, 'saved'],
    [/^\/account$/, 'account'],
    [/^\/messages$/, 'messages'],
    [/^\/chat\/([\w-]+)$/, 'chat', ['id']],
  ];

  const TABS = [
    ['home', 'For You', 'star'],
    ['browse', 'Browse', 'grid'],
    ['search', 'Search', 'search'],
    ['saved', 'Saved', 'heart'],
    ['account', 'Account', 'user'],
  ];

  const $ = (id) => document.getElementById(id);
  const screen = $('screen');
  const view = $('view');
  const bar = $('bar');
  const tabbar = $('tabbar');
  const toastEl = $('toast');

  let stack = [];
  let replacing = false;

  function parse() {
    const h = location.hash.slice(1);
    const [path, qs = ''] = h.split('?');
    return { path: path || '/', query: Object.fromEntries(new URLSearchParams(qs)) };
  }

  function go(path, { replace = false } = {}) {
    if (replace) {
      replacing = true;
      location.replace('#' + path);
    } else {
      location.hash = path;
    }
  }

  /* ---------- tab bar ---------- */

  tabbar.innerHTML = TABS.map(
    ([k, label, icon]) => `<a class="tab" href="#/${k}" data-tab="${k}">${I(icon, 24)}<span>${label}</span>${k === 'saved' ? '<span class="badge-dot" hidden></span>' : ''}</a>`
  ).join('');

  function paintTabs(active) {
    tabbar.querySelectorAll('.tab').forEach((t) => {
      const on = t.dataset.tab === active;
      t.classList.toggle('on', on);
      if (on) t.setAttribute('aria-current', 'page');
      else t.removeAttribute('aria-current');
    });
    const n = S.get().saved.length;
    const dot = tabbar.querySelector('.badge-dot');
    dot.hidden = !n;
    dot.textContent = n;
  }

  /* ---------- render ---------- */

  function render({ fresh = true, dir = null } = {}) {
    const { path, query } = parse();
    if (path === '/') {
      go(S.get().onboarded ? '/home' : '/splash', { replace: true });
      return;
    }
    let match = null;
    for (const [re, name, keys = []] of ROUTES) {
      const m = path.match(re);
      if (m) {
        match = { name, params: Object.fromEntries(keys.map((k, i) => [k, m[i + 1]])) };
        break;
      }
    }
    const out = match ? V[match.name](match.params, query, { fresh }) : V.notFound();
    const keep = view.scrollTop;

    view.innerHTML = out.html;
    bar.innerHTML = out.bar || '';
    bar.hidden = !out.bar;
    const showTabs = !!out.tab && !out.bar;
    tabbar.hidden = !showTabs;
    screen.classList.toggle('has-tabs', showTabs);
    screen.classList.toggle('has-bar', !!out.bar);
    paintTabs(out.tab);
    document.title = out.title && out.title !== 'Rabbit' ? `${out.title} · Rabbit` : 'Rabbit';

    if (fresh) {
      view.scrollTop = 0;
      view.classList.remove('enter-fwd', 'enter-back', 'enter-fade');
      if (dir) {
        void view.offsetWidth;
        view.classList.add('enter-' + dir);
      }
    } else {
      view.scrollTop = keep;
    }
    out.after && out.after(view);
  }

  window.addEventListener('hashchange', () => {
    const h = location.hash;
    const { path } = parse();
    const isTab = TABS.some(([k]) => path === '/' + k);
    let dir = 'fwd';
    if (replacing) {
      replacing = false;
      stack[stack.length - 1] = h;
      dir = 'fade';
    } else if (stack.length > 1 && stack[stack.length - 2] === h) {
      stack.pop();
      dir = 'back';
    } else if (isTab) {
      stack = [h];
      dir = 'fade';
    } else {
      stack.push(h);
    }
    closeSheet(true);
    render({ fresh: true, dir });
  });

  /* ---------- toast ---------- */

  let toastTimer;
  function toast(msg, icon = 'check') {
    toastEl.innerHTML = `${I(icon, 18, 2.2)}<span>${R.util.esc(msg)}</span>`;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
  }

  /* ---------- bottom sheet ---------- */

  let sheetEl = null;
  let lastFocus = null;
  function sheet(html) {
    closeSheet(true);
    lastFocus = document.activeElement;
    sheetEl = document.createElement('div');
    sheetEl.className = 'sheet-wrap';
    sheetEl.innerHTML = `<div class="sheet-bg" data-action="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" tabindex="-1"><div class="grabber" aria-hidden="true"></div><div class="sheet-body">${html}</div></div>`;
    screen.appendChild(sheetEl);
    const label = sheetEl.querySelector('h2, h3');
    if (label) {
      label.id = 'sheet-label';
      sheetEl.querySelector('.sheet').setAttribute('aria-labelledby', 'sheet-label');
    }
    sheetEl.querySelector('.sheet').focus();
  }
  sheet.update = (html) => {
    if (!sheetEl) return;
    const body = sheetEl.querySelector('.sheet');
    const top = body.scrollTop;
    sheetEl.querySelector('.sheet-body').innerHTML = html;
    body.scrollTop = top;
  };
  function closeSheet(instant = false) {
    if (!sheetEl) return;
    const el = sheetEl;
    sheetEl = null;
    if (instant) el.remove();
    else {
      el.classList.add('closing');
      setTimeout(() => el.remove(), 220);
    }
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  /* ---------- shared actions ---------- */

  function toggleSave(id) {
    let on;
    S.update((s) => {
      on = !s.saved.includes(id);
      s.saved = on ? [...s.saved, id] : s.saved.filter((x) => x !== id);
    });
    document.querySelectorAll(`.save-btn[data-id="${id}"]`).forEach((b) => {
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
      b.setAttribute('aria-label', on ? 'Remove from Saved' : 'Save');
      b.innerHTML = I(on ? 'heartFill' : 'heart', 20);
    });
    paintTabs(tabbar.querySelector('.tab.on')?.dataset.tab);
    if (parse().path === '/saved') render({ fresh: false });
    toast(on ? 'Saved' : 'Removed from Saved', on ? 'heart' : 'check');
  }

  async function share(id) {
    const l = R.data.byId(id);
    const url = location.href;
    const title = `${l.name} ${l.unit} on Rabbit`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied');
    } catch {
      toast('Copy the link from the address bar', 'info');
    }
  }

  const core = {
    back(el) {
      if (stack.length > 1) history.back();
      else go(el.dataset.fallback || '/home');
    },
    save: (el) => toggleSave(el.dataset.id),
    share: (el) => share(el.dataset.id),
    closeSheet: () => closeSheet(),
  };

  /* ---------- event delegation ---------- */

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const name = el.dataset.action;
    const fn = core[name] || V.actions[name];
    if (!fn) return;
    e.preventDefault();
    fn(el, e);
  });
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-input]');
    if (el) V.inputs[el.dataset.input]?.(el, e);
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (el) V.changes[el.dataset.change]?.(el, e);
  });
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-submit]');
    if (!form) return;
    e.preventDefault();
    V.submits[form.dataset.submit]?.(form);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheetEl) closeSheet();
  });

  R.app = { go, toast, sheet, closeSheet, rerender: () => render({ fresh: false }) };

  // boot
  stack = [location.hash || '#/'];
  render({ fresh: true, dir: 'fade' });
})((window.Rabbit = window.Rabbit || {}));
