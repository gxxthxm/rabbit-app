// Screens. Each view returns { html, tab?, bar?, title?, after? } for the router in app.js.
// View-local UI state (onboarding answers, search filters, tour picks) lives in this module;
// anything worth keeping goes through Rabbit.store.

(function (R) {
  const { esc, money, short, round500, monthly, RATE, RATE15, DAY, isoDay, fmtDate, fmtTime, greeting, pct, mark } = R.util;
  const D = R.data;
  const S = R.store;
  const I = R.icon;
  const app = () => R.app;
  const st = () => S.get();

  /* ---------- shared helpers ---------- */

  const isSaved = (id) => st().saved.includes(id);
  const bedsLabel = (l) => (l.beds === 0 ? 'Studio' : `${l.beds} bd${l.den ? ' + den' : ''}`);
  const bedsLong = (l) => (l.beds === 0 ? 'Studio' : `${l.beds} bedroom${l.beds > 1 ? 's' : ''}${l.den ? ' + den' : ''}`);
  const hoodName = (l) => D.hoods[l.hood].name;
  const pic = (name, alt = '', eager = false) => `<img src="assets/photos/${name}.jpg" alt="${esc(alt)}" decoding="async"${eager ? '' : ' loading="lazy"'}>`;
  const rateFor = (years) => (years === 15 ? RATE15 : RATE);
  const estimate = (l, o = {}) => {
    const years = o.years ?? 30;
    return monthly(o.amount ?? l.price, { downPct: o.downPct ?? 10, years, rate: rateFor(years), hoa: l.hoa });
  };
  const BADGE = { 'Price drop': 'drop', New: 'new', 'Great value': 'value' };
  const badge = (l) => (l.badge ? `<span class="badge ${BADGE[l.badge] || ''}">${l.badge}</span>` : '');

  function heartBtn(id, cls = 'heart') {
    const on = isSaved(id);
    return `<button class="${cls} save-btn${on ? ' on' : ''}" data-action="save" data-id="${id}" aria-pressed="${on}" aria-label="${on ? 'Remove from Saved' : 'Save'}">${I(on ? 'heartFill' : 'heart', 20)}</button>`;
  }

  const specs = (l) =>
    `<div class="specs"><span>${I('bed', 16)}${bedsLabel(l)}</span><span>${I('bath', 16)}${l.baths} ba</span><span>${I('area', 16)}${l.sqft.toLocaleString()} sq ft</span></div>`;

  function card(l, wide = false) {
    const m = estimate(l);
    return `<article class="hcard${wide ? ' wide' : ''}">
      <a class="card-link" href="#/listing/${l.id}">
        <div class="pic">${pic(l.images[0])}</div>
        <div class="info">
          <div class="price-line"><span class="price num">${money(l.price)}</span>${l.was ? `<s class="was num">${short(l.was)}</s>` : ''}</div>
          <b class="name">${esc(l.name)} · ${esc(l.unit)}</b>
          <span class="meta">${hoodName(l)} · est. <span class="num">${money(m.total)}</span>/mo</span>
          ${specs(l)}
        </div>
      </a>${badge(l)}${heartBtn(l.id)}
    </article>`;
  }

  function row(l, extra = '') {
    return `<a class="lrow" href="#/listing/${l.id}">
      <div class="thumb">${pic(l.images[0])}</div>
      <div class="grow"><b class="name">${esc(l.name)} ${esc(l.unit)}</b>
        <span class="meta">${hoodName(l)} · ${bedsLabel(l)} · ${l.sqft} sq ft</span>
        <span class="price-sm num">${money(l.price)}${l.was ? ` <s class="was">${money(l.was)}</s>` : ''}</span>${extra}</div>
      ${I('chevR', 18)}</a>`;
  }

  const navbar = (title, back = '/home', right = '') =>
    `<header class="navbar"><button class="circle-btn" data-action="back" data-fallback="${back}" aria-label="Back">${I('back', 20)}</button><h2>${title}</h2><div class="nav-right">${right}</div></header>`;

  const largeTitle = (title, eyebrow = '', right = '') =>
    `<header class="lt-head"><div>${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}<h1 class="lt">${title}</h1></div>${right}</header>`;

  const avatarLink = () => {
    const n = st().user.name;
    return `<a class="avatar" href="#/account" aria-label="Account">${n ? esc(n[0].toUpperCase()) : I('user', 20)}</a>`;
  };

  const empty = (title, text, cta = '') =>
    `<div class="empty">${mark(56, 'ink')}<h3>${title}</h3><p>${text}</p>${cta}</div>`;

  const agentAvatar = (a, size = 44) =>
    `<span class="agent-av" style="width:${size}px;height:${size}px;background:${a.tone}">${a.initials}</span>`;

  /* ---------- matching ---------- */

  function matchScore(l, p) {
    if (l.price > p.budget) return -1;
    let s = 3;
    if (p.beds === 'any' || (p.beds === '2' ? l.beds >= 2 : String(l.beds) === p.beds)) s += 2;
    else return -1;
    if (p.hoods.length && !p.hoods.includes(l.hood)) return -1;
    s += p.musts.filter((m) => l.tags.includes(m)).length;
    return s;
  }
  function matchList(p = st().prefs) {
    return D.listings
      .map((l) => ({ l, s: matchScore(l, p) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s || a.l.price - b.l.price)
      .map((x) => x.l);
  }

  /* ---------- tours & offers ---------- */

  const SLOTS = ['10:00 AM', '11:30 AM', '1:00 PM', '3:30 PM', '5:00 PM', '6:30 PM'];
  const slotTaken = (date, i) => (date.split('-').reduce((a, b) => a + Number(b), 0) + i * 7) % 5 === 0;
  const upcomingTours = () => {
    const today = isoDay(new Date());
    return st()
      .tours.filter((t) => t.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot);
  };

  const CLOSED = ['closed', 'withdrawn', 'declined'];
  const STATUS = {
    submitted: { label: 'Seller reviewing', tone: 'wait' },
    countered: { label: 'Counteroffer received', tone: 'act' },
    accepted: { label: 'Accepted · inspection next', tone: 'good' },
    inspected: { label: 'Closing scheduled', tone: 'good' },
    closed: { label: 'Closed · keys ready', tone: 'good' },
    withdrawn: { label: 'Withdrawn', tone: 'off' },
    declined: { label: 'Counter declined', tone: 'off' },
  };
  const statusPill = (o) => `<span class="status ${STATUS[o.status].tone}">${STATUS[o.status].label}</span>`;
  const activeOfferFor = (id) => st().offers.find((o) => o.listingId === id && !CLOSED.includes(o.status));

  const V = {};

  /* ---------- splash & welcome ---------- */

  V.splash = () => {
    setTimeout(() => {
      if (location.hash === '#/splash') app().go('/welcome', { replace: true });
    }, 2000);
    return {
      title: 'Rabbit',
      html: `<a class="splash" href="#/welcome" aria-label="Continue to Rabbit">
        ${mark(132, 'light', true)}
        <span class="wordmark">rabbit</span>
        <span class="splash-tag">Pre-loved condos. Fair prices.</span>
      </a>`,
    };
  };

  V.welcome = () => ({
    title: 'Welcome',
    html: `<section class="welcome">
      <div class="brand-row">${mark(34, 'ink')}<span class="wordmark">rabbit</span></div>
      <div class="collage" aria-hidden="true">
        <div class="tile t1">${pic('ext-juniper', '', true)}</div>
        <div class="tile t2">${pic('living-1', '', true)}</div>
        <div class="tile t3">${pic('ext-maple', '', true)}</div>
        <span class="sticker s1">Studios from $159k</span>
        <span class="sticker s2">${I('shield', 16)} Every home inspected</span>
      </div>
      <h1>Your first place starts here.</h1>
      <p class="welcome-sub">Pre-loved condos, inspected by us and priced for people buying their first home.</p>
      <div class="cta-stack">
        <a class="btn block" href="#/onboarding">Get started</a>
        <button class="btn ghost block" data-action="guest">Browse as guest</button>
      </div>
      <p class="fine">Prototype with sample listings. No real payments.</p>
    </section>`,
  });

  /* ---------- onboarding ---------- */

  let ob = null;
  V.onboarding = (p, q, ctx) => {
    if (ctx.fresh || !ob) {
      const s = st();
      ob = { step: 0, edit: !!q.edit, name: s.user.name, ...JSON.parse(JSON.stringify(s.prefs)) };
    }
    const n = matchList(ob).length;
    const steps = [
      () => `<h1 class="ob-h">First, what should we call you?</h1>
        <p class="q-sub">We’ll use it to personalize your feed.</p>
        <div class="field"><label for="ob-name">First name</label>
        <input id="ob-name" class="input" data-input="obName" value="${esc(ob.name)}" autocomplete="given-name" placeholder="Your first name" maxlength="24"></div>`,
      () => `<h1 class="ob-h">What’s your budget?</h1>
        <p class="q-sub">We’ll show condos at or under this price.</p>
        <div class="bigamt num" id="ob-budget">Up to ${money(ob.budget)}</div>
        <label class="sr" for="ob-range">Maximum price</label>
        <input type="range" id="ob-range" min="120000" max="350000" step="5000" value="${ob.budget}" data-input="obBudget" style="--p:${pct(ob.budget, 120000, 350000)}">
        <div class="range-ends"><span>$120k</span><span>$350k</span></div>
        <div class="panel note">${I('info', 18)}<p>At this price you’d pay about <b class="num" id="ob-mo">${money(monthly(ob.budget, { hoa: 300 }).total)}</b>/mo with 10% down over 30 years at an example ${RATE}% rate, including HOA and taxes.</p></div>`,
      () => `<h1 class="ob-h">How many bedrooms?</h1>
        <p class="q-sub">Pick the smallest size you’d be happy with.</p>
        <div class="opts">${[
          ['0', 'Studio', 'One open room, lowest prices'],
          ['1', '1 bedroom', 'A door to close at night'],
          ['2', '2+ bedrooms', 'Room for a roommate or an office'],
          ['any', 'Show me everything', 'I’m flexible'],
        ]
          .map(([v, t, d]) => `<button class="opt${ob.beds === v ? ' on' : ''}" data-action="obBeds" data-v="${v}" aria-pressed="${ob.beds === v}"><span><b>${t}</b><span class="sub">${d}</span></span>${ob.beds === v ? I('check', 20, 2.4) : ''}</button>`)
          .join('')}</div>`,
      () => `<h1 class="ob-h">Where, and what matters?</h1>
        <p class="q-sub">Leave it blank to see the whole city.</p>
        <h3 class="mini-h">Neighborhoods</h3>
        <div class="chips">${Object.entries(D.hoods)
          .map(([k, h]) => `<button class="chip${ob.hoods.includes(k) ? ' on' : ''}" data-action="obHood" data-v="${k}" aria-pressed="${ob.hoods.includes(k)}">${h.name}</button>`)
          .join('')}</div>
        <h3 class="mini-h">Must-haves</h3>
        <div class="chips">${D.musts
          .map((m) => `<button class="chip${ob.musts.includes(m) ? ' on' : ''}" data-action="obMust" data-v="${m}" aria-pressed="${ob.musts.includes(m)}">${I(D.tagIcons[m], 16)}${m}</button>`)
          .join('')}</div>`,
    ];
    const last = ob.step === steps.length - 1;
    return {
      title: 'Get started',
      html: `<section class="ob">
        <div class="ob-top">
          <button class="circle-btn" data-action="${ob.step ? 'obPrev' : 'back'}" data-fallback="${ob.edit ? '/account' : '/welcome'}" aria-label="Back">${I('back', 20)}</button>
          <div class="prog" role="progressbar" aria-valuemin="1" aria-valuemax="${steps.length}" aria-valuenow="${ob.step + 1}" aria-label="Step ${ob.step + 1} of ${steps.length}"><i style="width:${((ob.step + 1) / steps.length) * 100}%"></i></div>
          <button class="link" data-action="obFinish">Skip</button>
        </div>
        <p class="eyebrow">Step ${ob.step + 1} of ${steps.length}</p>
        ${steps[ob.step]()}
      </section>`,
      bar: `<button class="btn block" data-action="${last ? 'obFinish' : 'obNext'}">${last ? (n ? `Show my ${n} match${n === 1 ? '' : 'es'}` : 'Show all condos') : 'Continue'}</button>`,
    };
  };

  /* ---------- For You ---------- */

  V.home = () => {
    const s = st();
    const m = matchList();
    const top = (m.length ? m : [...D.listings].sort((a, b) => a.listed - b.listed)).slice(0, 5);
    const drops = D.listings.filter((l) => l.was);
    const tour = upcomingTours()[0];
    const offers = s.offers.filter((o) => !CLOSED.includes(o.status));
    const hi = `${greeting()}${s.user.name ? `, ${esc(s.user.name)}` : ''}.`;
    const lede = m.length
      ? `${m.length} condo${m.length === 1 ? '' : 's'} fit your budget of ${short(s.prefs.budget)}.`
      : 'Nothing matches every preference yet, so here are the newest listings.';

    const statusCards = [
      ...offers.map((o) => {
        const l = D.byId(o.listingId);
        return `<a class="status-card" href="#/offers/${o.id}"><span class="sc-ico carrot">${I('doc', 20)}</span><span class="grow"><span class="eyebrow">Your offer · ${money(o.counter && o.status === 'countered' ? o.counter : o.amount)}</span><b>${esc(l.name)} ${esc(l.unit)}</b>${statusPill(o)}</span>${I('chevR', 18)}</a>`;
      }),
      tour
        ? (() => {
            const l = D.byId(tour.listingId);
            return `<a class="status-card" href="#/tours"><span class="sc-ico leaf">${I('calendar', 20)}</span><span class="grow"><span class="eyebrow">Next tour · ${fmtDate(tour.date)}</span><b>${esc(l.name)} ${esc(l.unit)}</b><span class="sub">${SLOTS[tour.slot]} · ${tour.type === 'video' ? 'Video call' : 'In person'}</span></span>${I('chevR', 18)}</a>`;
          })()
        : '',
    ].join('');

    return {
      tab: 'home',
      title: 'For You',
      html: `${largeTitle('For You', fmtDate(Date.now(), { weekday: 'long', month: 'long', day: 'numeric' }), avatarLink())}
      <p class="lede">${hi} ${lede}</p>
      ${statusCards ? `<div class="section stack">${statusCards}</div>` : ''}
      <section class="section">
        <div class="sec-head"><h3>${m.length ? 'Your top matches' : 'New this week'}</h3><a class="link" href="#/search">See all</a></div>
        <div class="hscroll">${top.map((l) => card(l)).join('')}</div>
      </section>
      <section class="section">
        <div class="sec-head"><h3>Price drops</h3></div>
        <div class="stack">${drops.map((l) => row(l, `<span class="drop-tag">${I('tag', 14)} ${short(l.was - l.price)} off</span>`)).join('')}</div>
      </section>
      <section class="section">
        <div class="sec-head"><h3>Explore neighborhoods</h3><a class="link" href="#/browse">Browse</a></div>
        <div class="hscroll">${Object.entries(D.hoods)
          .map(([k, h]) => {
            const c = D.listings.filter((l) => l.hood === k).length;
            return `<a class="hood-card" href="#/search?hood=${k}"><div class="pic">${pic(h.img)}</div><b>${h.name}</b><span class="meta">${c} condos · from ${short(Math.min(...D.listings.filter((l) => l.hood === k).map((l) => l.price)))}</span></a>`;
          })
          .join('')}</div>
      </section>
      <section class="section">
        <div class="sec-head"><h3>Buyer school</h3></div>
        <div class="hscroll">${D.guides
          .map((g) => `<button class="guide-card ${g.tone}" data-action="guide" data-id="${g.id}"><span class="g-ico">${I(g.icon, 22)}</span><b>${g.title}</b><span class="meta">${g.mins} min read</span></button>`)
          .join('')}</div>
      </section>`,
    };
  };

  /* ---------- Browse ---------- */

  const CATS = [
    { id: 'studio', label: 'Studios', icon: 'building' },
    { id: 'one', label: '1 bedroom', icon: 'bed' },
    { id: 'two', label: '2+ bedrooms', icon: 'home' },
    { id: 'under200', label: 'Under $200k', icon: 'tag' },
    { id: 'pets', label: 'Pet friendly', icon: 'paw' },
    { id: 'parking', label: 'With parking', icon: 'car' },
  ];
  let browseSort = 'new';
  const SORTS = { new: ['Newest', (a, b) => a.listed - b.listed], low: ['Lowest price', (a, b) => a.price - b.price], high: ['Highest price', (a, b) => b.price - a.price] };

  V.browse = () => {
    const list = [...D.listings].sort(SORTS[browseSort][1]);
    return {
      tab: 'browse',
      title: 'Browse',
      html: `${largeTitle('Browse', `${D.listings.length} condos for sale`, avatarLink())}
      <div class="section"><a class="searchbox" href="#/search?focus=1">${I('search', 18)}<span>Neighborhood, building or feature</span></a></div>
      <section class="section">
        <div class="cats">${CATS.map((c) => {
          const f = defaultSearch();
          applyCat(f, c.id);
          return `<a class="cat" href="#/search?cat=${c.id}"><span class="cat-ico">${I(c.icon, 22)}</span><span><b>${c.label}</b><span class="meta">${filterListings(f).length} condos</span></span></a>`;
        }).join('')}</div>
      </section>
      <section class="section">
        <div class="sec-head"><h3>Neighborhoods</h3></div>
        <div class="stack">${Object.entries(D.hoods)
          .map(([k, h]) => `<a class="hood-row" href="#/search?hood=${k}"><div class="pic">${pic(h.img)}</div><span class="grow"><b>${h.name}</b><span class="meta">${h.blurb}</span></span>${I('chevR', 18)}</a>`)
          .join('')}</div>
      </section>
      <section class="section">
        <div class="sec-head"><h3>All condos</h3></div>
        <div class="seg" role="group" aria-label="Sort">${Object.entries(SORTS)
          .map(([k, [label]]) => `<button class="${browseSort === k ? 'on' : ''}" data-action="browseSort" data-v="${k}" aria-pressed="${browseSort === k}">${label}</button>`)
          .join('')}</div>
        <div class="stack cards">${list.map((l) => card(l, true)).join('')}</div>
      </section>`,
    };
  };

  /* ---------- Search ---------- */

  const MAXP = 350000;
  function defaultSearch() {
    return { q: '', maxPrice: MAXP, beds: 'any', hoods: [], musts: [], sort: 'relevance' };
  }
  function applyCat(f, cat) {
    if (cat === 'studio') f.beds = '0';
    if (cat === 'one') f.beds = '1';
    if (cat === 'two') f.beds = '2';
    if (cat === 'under200') f.maxPrice = 200000;
    if (cat === 'pets') f.musts = ['Pet friendly'];
    if (cat === 'parking') f.musts = ['Parking'];
  }
  function textScore(l, q) {
    if (!q) return 1;
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const hay = [l.name, l.unit, hoodName(l), l.condition, l.exposure, ...l.tags, l.summary, bedsLong(l)].join(' ').toLowerCase();
    let s = 0;
    for (const w of words) {
      if (!hay.includes(w)) return 0;
      s += (l.name + ' ' + hoodName(l)).toLowerCase().includes(w) ? 3 : 1;
    }
    return s;
  }
  function filterListings(f) {
    const out = D.listings
      .map((l) => ({ l, s: textScore(l, f.q.trim()) }))
      .filter(({ l, s }) => {
        if (!s) return false;
        if (l.price > f.maxPrice) return false;
        if (f.beds !== 'any' && (f.beds === '2' ? l.beds < 2 : String(l.beds) !== f.beds)) return false;
        if (f.hoods.length && !f.hoods.includes(l.hood)) return false;
        return f.musts.every((m) => l.tags.includes(m));
      });
    const sorters = {
      relevance: (a, b) => b.s - a.s || a.l.listed - b.l.listed,
      low: (a, b) => a.l.price - b.l.price,
      high: (a, b) => b.l.price - a.l.price,
      new: (a, b) => a.l.listed - b.l.listed,
      size: (a, b) => b.l.sqft - a.l.sqft,
    };
    return out.sort(sorters[f.sort]).map((x) => x.l);
  }
  const filterCount = (f) => (f.maxPrice < MAXP ? 1 : 0) + f.hoods.length + f.musts.length;
  const BEDS = [['any', 'Any size'], ['0', 'Studio'], ['1', '1 bd'], ['2', '2+ bd']];

  let sq = defaultSearch();

  function searchResults() {
    const list = filterListings(sq);
    const fc = filterCount(sq);
    const pills = [
      sq.maxPrice < MAXP ? `<button class="pill-x" data-action="sqClear" data-k="price">Up to ${short(sq.maxPrice)} ${I('x', 14)}</button>` : '',
      ...sq.hoods.map((h) => `<button class="pill-x" data-action="sqClear" data-k="hood" data-v="${h}">${D.hoods[h].name} ${I('x', 14)}</button>`),
      ...sq.musts.map((m) => `<button class="pill-x" data-action="sqClear" data-k="must" data-v="${m}">${m} ${I('x', 14)}</button>`),
    ].join('');
    const recent = st().recent;
    const idle = !sq.q.trim() && !fc && sq.beds === 'any';
    return `${pills ? `<div class="pills-row">${pills}<button class="link" data-action="sqReset">Clear all</button></div>` : ''}
      ${idle && recent.length ? `<div class="sub-block"><div class="sec-head"><h4>Recent searches</h4><button class="link" data-action="clearRecent">Clear</button></div><div class="chips">${recent.map((r) => `<button class="chip" data-action="searchFill" data-q="${esc(r)}">${I('clock', 16)}${esc(r)}</button>`).join('')}</div></div>` : ''}
      ${idle ? `<div class="sub-block"><div class="sec-head"><h4>Try searching</h4></div><div class="chips">${['Riverside', 'rooftop', 'pet friendly', 'water view', 'exposed brick'].map((r) => `<button class="chip" data-action="searchFill" data-q="${r}">${I('search', 16)}${r}</button>`).join('')}</div></div>` : ''}
      <p class="count" aria-live="polite">${list.length} condo${list.length === 1 ? '' : 's'}${sq.q.trim() ? ` for “${esc(sq.q.trim())}”` : ''}</p>
      ${list.length ? `<div class="stack cards">${list.map((l) => card(l, true)).join('')}</div>` : empty('No condos match', 'Try a different word, or remove a filter to widen the search.', `<button class="btn ghost sm" data-action="sqReset">Clear search</button>`)}`;
  }

  V.search = (p, q, ctx) => {
    if (ctx.fresh && (q.cat || q.hood)) {
      sq = defaultSearch();
      if (q.cat) applyCat(sq, q.cat);
      if (q.hood) sq.hoods = [q.hood];
    }
    const fc = filterCount(sq);
    return {
      tab: 'search',
      title: 'Search',
      html: `${largeTitle('Search', '', avatarLink())}
      <div class="section search-top">
        <form class="searchbox live" data-submit="search" role="search">
          ${I('search', 18)}
          <label class="sr" for="search-input">Search condos</label>
          <input id="search-input" type="search" data-input="searchQ" value="${esc(sq.q)}" placeholder="Neighborhood, building or feature" autocomplete="off" enterkeyhint="search">
        </form>
        <button class="filter-btn${fc ? ' on' : ''}" data-action="openFilters" aria-label="Filters${fc ? `, ${fc} active` : ''}">${I('sliders', 20)}${fc ? `<span class="fc">${fc}</span>` : ''}</button>
      </div>
      <div class="section tight"><div class="chips scroll-x">${BEDS.map(([v, t]) => `<button class="chip${sq.beds === v ? ' on' : ''}" data-action="sqBeds" data-v="${v}" aria-pressed="${sq.beds === v}">${t}</button>`).join('')}</div></div>
      <div class="section" id="results">${searchResults()}</div>`,
      after: (root) => {
        if (q.focus && ctx.fresh) root.querySelector('#search-input')?.focus();
      },
    };
  };

  let fDraft = null;
  function filtersSheet() {
    const f = fDraft;
    const n = filterListings(f).length;
    return `<div class="sheet-head"><h3>Filters</h3><button class="link" data-action="fReset">Reset</button></div>
      <div class="f-block"><h4>Max price</h4><div class="row-between"><span class="meta">Up to</span><b class="num" id="f-price">${f.maxPrice >= MAXP ? 'Any price' : money(f.maxPrice)}</b></div>
        <label class="sr" for="f-range">Maximum price</label>
        <input type="range" id="f-range" min="150000" max="${MAXP}" step="5000" value="${f.maxPrice}" data-input="fPrice" style="--p:${pct(f.maxPrice, 150000, MAXP)}"></div>
      <div class="f-block"><h4>Bedrooms</h4><div class="chips">${BEDS.map(([v, t]) => `<button class="chip${f.beds === v ? ' on' : ''}" data-action="fBeds" data-v="${v}">${t}</button>`).join('')}</div></div>
      <div class="f-block"><h4>Neighborhoods</h4><div class="chips">${Object.entries(D.hoods).map(([k, h]) => `<button class="chip${f.hoods.includes(k) ? ' on' : ''}" data-action="fHood" data-v="${k}">${h.name}</button>`).join('')}</div></div>
      <div class="f-block"><h4>Must-haves</h4><div class="chips">${D.musts.map((m) => `<button class="chip${f.musts.includes(m) ? ' on' : ''}" data-action="fMust" data-v="${m}">${I(D.tagIcons[m], 16)}${m}</button>`).join('')}</div></div>
      <div class="f-block"><h4>Sort by</h4><div class="chips">${[['relevance', 'Best match'], ['low', 'Lowest price'], ['high', 'Highest price'], ['new', 'Newest'], ['size', 'Largest']].map(([v, t]) => `<button class="chip${f.sort === v ? ' on' : ''}" data-action="fSort" data-v="${v}">${t}</button>`).join('')}</div></div>
      <button class="btn block sheet-cta" data-action="fApply" id="f-apply">Show ${n} condo${n === 1 ? '' : 's'}</button>`;
  }

  /* ---------- Listing ---------- */

  function scoreRing(score) {
    const C = 2 * Math.PI * 26;
    return `<span class="ring"><svg width="68" height="68" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="none" stroke="var(--fill)" stroke-width="7"/><circle cx="32" cy="32" r="26" fill="none" stroke="var(--leaf)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(C * score) / 100} ${C}" transform="rotate(-90 32 32)"/></svg><b class="num">${score}</b></span>`;
  }
  const mapArt = (l) => `<div class="map" role="img" aria-label="Map showing ${esc(l.name)} in ${hoodName(l)}">
    <svg viewBox="0 0 350 170" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">
      <rect width="350" height="170" fill="#ECEDF3"/>
      <path d="M-10 128 C 80 98, 140 158, 220 118 S 330 78, 360 98 L360 170 L-10 170Z" fill="#CFE2EA"/>
      <rect x="190" y="14" width="58" height="22" rx="4" fill="#CDE6E2"/><rect x="18" y="52" width="40" height="22" rx="4" fill="#CDE6E2"/>
      <g stroke="#FFFFFF" stroke-width="8" fill="none"><path d="M0 44 H350"/><path d="M0 88 H350"/><path d="M76 0 V170"/><path d="M172 0 V170"/><path d="M266 0 V170"/></g>
      <g stroke="#FFFFFF" stroke-width="3" fill="none"><path d="M0 66 H350"/><path d="M124 0 V170"/><path d="M220 0 V170"/><path d="M310 0 V170"/></g>
    </svg>
    <span class="map-pin" style="left:${l.pin[0]}%;top:${l.pin[1]}%">${I('home', 16, 2.2)}</span>
    <span class="map-label">${hoodName(l)}</span>
  </div>`;

  V.listing = ({ id }) => {
    const l = D.byId(id);
    if (!l) return V.notFound();
    const m = estimate(l);
    const a = D.agents[l.agent];
    const tour = upcomingTours().find((t) => t.listingId === id);
    const offer = activeOfferFor(id);
    const similar = D.listings
      .filter((x) => x.id !== id)
      .sort((x, y) => (x.hood === l.hood ? -1 : 0) - (y.hood === l.hood ? -1 : 0) || Math.abs(x.price - l.price) - Math.abs(y.price - l.price))
      .slice(0, 4);
    const st8 = { good: 'Good', ok: 'Fair', fix: 'Needs work' };

    return {
      title: `${l.name} ${l.unit}`,
      html: `<div class="gallery">
        <div class="track" data-gallery tabindex="0" aria-label="Photos">${l.images.map((im, i) => `<div class="slide">${pic(im, `${D.imgAlt(im)}, photo ${i + 1} of ${l.images.length}`, i === 0)}<span class="credit">Photo: ${esc(D.photos[im][0])} / Pexels</span></div>`).join('')}</div>
        <div class="gal-nav">
          <button class="glass" data-action="back" data-fallback="/home" aria-label="Back">${I('back', 20)}</button>
          <div class="grp"><button class="glass" data-action="share" data-id="${id}" aria-label="Share">${I('share', 19)}</button>${heartBtn(id, 'glass')}</div>
        </div>
        <div class="dots" aria-hidden="true">${l.images.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
        <span class="gal-count num" aria-hidden="true">1 / ${l.images.length}</span>
      </div>
      <div class="detail">
        <div class="pills"><span class="pill leaf">${I('shield', 14, 2)} Rabbit Inspected</span><span class="pill">${l.condition}</span>${l.badge ? `<span class="pill ${BADGE[l.badge]}">${l.badge}</span>` : ''}</div>
        <h1 class="title-xl">${esc(l.name)}</h1>
        <p class="meta">${esc(l.unit)} · ${hoodName(l)} · Listed ${l.listed === 1 ? 'yesterday' : `${l.listed} days ago`}</p>
        <div class="price-line big"><span class="price-xl num">${money(l.price)}</span>${l.was ? `<s class="was num">${money(l.was)}</s>` : ''}</div>
        <p class="est">Est. <b class="num">${money(m.total)}/mo</b> with 10% down <button class="info-btn" data-action="estInfo" aria-label="How we estimate monthly cost">${I('info', 16)}</button></p>
        <div class="spec-grid">
          <div class="spec">${I('bed', 20)}<b>${l.beds === 0 ? 'Studio' : l.beds}</b><span>${l.beds === 0 ? 'Open plan' : l.den ? 'Bed + den' : l.beds === 1 ? 'Bedroom' : 'Bedrooms'}</span></div>
          <div class="spec">${I('bath', 20)}<b>${l.baths}</b><span>Bath${l.baths > 1 ? 's' : ''}</span></div>
          <div class="spec">${I('area', 20)}<b class="num">${l.sqft.toLocaleString()}</b><span>Sq ft</span></div>
          <div class="spec">${I('layers', 20)}<b>${l.floor}</b><span>Floor</span></div>
        </div>
        ${offer ? `<a class="status-card tint" href="#/offers/${offer.id}"><span class="sc-ico carrot">${I('doc', 20)}</span><span class="grow"><span class="eyebrow">Your offer · ${money(offer.amount)}</span>${statusPill(offer)}</span>${I('chevR', 18)}</a>` : ''}
        ${tour ? `<a class="status-card tint" href="#/tours"><span class="sc-ico leaf">${I('calendar', 20)}</span><span class="grow"><span class="eyebrow">Tour booked</span><b>${fmtDate(tour.date)} · ${SLOTS[tour.slot]}</b></span>${I('chevR', 18)}</a>` : ''}
        <div class="cta-row">
          <a class="btn dark" href="#/tour/${id}">${I('calendar', 18)} ${tour ? 'Reschedule' : 'Book a tour'}</a>
          <a class="btn ghost" href="#/chat/${id}">${I('chat', 18)} Ask ${a.first}</a>
        </div>

        <section class="d-sec"><h3>About this home</h3><p class="body">${l.summary}</p></section>

        <section class="d-sec"><h3>What you get</h3>
          <div class="tags">${l.tags.map((t) => `<span class="tag"><span class="t-ico">${I(D.tagIcons[t], 18)}</span>${t}</span>`).join('')}</div>
        </section>

        <section class="d-sec"><h3>Inspection report</h3>
          <div class="panel">
            <div class="score">${scoreRing(l.score)}<div><b>Condition score ${l.score}/100</b><p class="meta">Checked by a licensed inspector before listing.</p></div></div>
            <ul class="insp">${l.inspection.map(([k, v, s]) => `<li><span class="i-dot ${s}" aria-hidden="true"></span><span class="grow"><b>${k}</b><span class="meta">${v}</span></span><span class="i-tag ${s}">${st8[s]}</span></li>`).join('')}</ul>
            <button class="link" data-action="inspectInfo">How Rabbit inspects ${I('arrowR', 16)}</button>
          </div>
        </section>

        <section class="d-sec"><h3>Monthly cost</h3>
          <div class="panel">
            <div class="kv"><span>Mortgage (principal &amp; interest)</span><span class="num">${money(m.pi)}</span></div>
            <div class="kv"><span>HOA fee</span><span class="num">${money(l.hoa)}</span></div>
            <div class="kv"><span>Property tax (est.)</span><span class="num">${money(m.tax)}</span></div>
            <div class="kv total"><span>Total per month</span><span class="num">${money(m.total)}</span></div>
            <p class="fine left">Example: 10% down (${money(m.down)}), 30-year fixed at ${RATE}%. Your rate will vary.</p>
            <a class="link" href="#/offer/${id}">Try other numbers ${I('arrowR', 16)}</a>
          </div>
        </section>

        <section class="d-sec"><h3>The building</h3>
          <div class="panel">
            <div class="kv"><span>Year built</span><span>${l.built}</span></div>
            <div class="kv"><span>HOA reserve fund</span><span>${l.reserve}</span></div>
            <div class="kv"><span>Exposure</span><span>${l.exposure}</span></div>
            <div class="kv"><span>Parking</span><span>${l.parking}</span></div>
            <div class="kv"><span>Price per sq ft</span><span class="num">${money(l.price / l.sqft)}</span></div>
          </div>
        </section>

        <section class="d-sec"><h3>Location</h3>${mapArt(l)}<p class="meta with-ico">${I('train', 18)} ${l.transit}</p></section>

        <section class="d-sec"><h3>Your agent</h3>
          <div class="panel agent">${agentAvatar(a)}<span class="grow"><b>${a.name}</b><span class="meta">Rabbit agent for ${hoodName(l)}</span></span><a class="btn sm ghost" href="#/chat/${id}">Message</a></div>
        </section>

        <section class="d-sec"><h3>Similar condos</h3><div class="hscroll">${similar.map((x) => card(x)).join('')}</div></section>
      </div>`,
      bar: `<div class="bar-price"><b class="num">${money(l.price)}</b><span class="num">est. ${money(m.total)}/mo</span></div>
        <a class="btn" href="#/offer/${id}">${offer ? 'New offer' : 'Make an offer'}</a>`,
      after: (root) => {
        const track = root.querySelector('[data-gallery]');
        const dots = root.querySelectorAll('.dots i');
        const count = root.querySelector('.gal-count');
        track.addEventListener(
          'scroll',
          () => {
            const i = Math.round(track.scrollLeft / track.clientWidth);
            dots.forEach((d, j) => d.classList.toggle('on', i === j));
            count.textContent = `${i + 1} / ${l.images.length}`;
          },
          { passive: true }
        );
      },
    };
  };

  /* ---------- Book a tour ---------- */

  let td = null;
  V.tour = ({ id }, q, ctx) => {
    const l = D.byId(id);
    if (!l) return V.notFound();
    const a = D.agents[l.agent];
    if (ctx.fresh || !td || td.listingId !== id) {
      const ex = q.tour ? st().tours.find((t) => t.id === q.tour) : upcomingTours().find((t) => t.listingId === id);
      td = { listingId: id, editing: ex?.id || null, type: ex?.type || 'person', date: ex?.date || null, slot: ex?.slot ?? null, note: ex?.note || '' };
    }
    const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() + (i + 1) * DAY));
    const ready = td.date && td.slot !== null;
    return {
      title: 'Book a tour',
      html: `${navbar(td.editing ? 'Reschedule tour' : 'Book a tour', `/listing/${id}`)}
      <div class="section">${row(l)}</div>
      <section class="section">
        <h3 class="q">How do you want to tour?</h3>
        <div class="opts two">
          <button class="opt col${td.type === 'person' ? ' on' : ''}" data-action="tourType" data-v="person" aria-pressed="${td.type === 'person'}">${I('home', 22)}<b>In person</b><span class="sub">Meet ${a.first} at the building</span></button>
          <button class="opt col${td.type === 'video' ? ' on' : ''}" data-action="tourType" data-v="video" aria-pressed="${td.type === 'video'}">${I('video', 22)}<b>Video call</b><span class="sub">A live walkthrough on your phone</span></button>
        </div>
      </section>
      <section class="section">
        <h3 class="q">Pick a day</h3>
        <div class="hscroll days">${days
          .map((d) => {
            const iso = isoDay(d);
            const on = td.date === iso;
            return `<button class="day${on ? ' on' : ''}" data-action="tourDay" data-v="${iso}" aria-pressed="${on}" aria-label="${fmtDate(iso, { weekday: 'long', month: 'long', day: 'numeric' })}"><span>${fmtDate(iso, { weekday: 'short' })}</span><b class="num">${d.getDate()}</b><span>${fmtDate(iso, { month: 'short' })}</span></button>`;
          })
          .join('')}</div>
      </section>
      <section class="section">
        <h3 class="q">Pick a time</h3>
        ${td.date
          ? `<div class="slots">${SLOTS.map((s, i) => {
              const taken = slotTaken(td.date, i);
              const on = td.slot === i;
              return `<button class="slot${on ? ' on' : ''}" data-action="tourSlot" data-v="${i}" ${taken ? 'disabled aria-label="' + s + ', booked"' : `aria-pressed="${on}"`}>${s}</button>`;
            }).join('')}</div>`
          : `<p class="meta">Choose a day to see open times.</p>`}
      </section>
      <section class="section">
        <div class="field"><label for="tour-note">Anything ${a.first} should know? <span class="meta">(optional)</span></label>
        <textarea id="tour-note" class="input area" rows="3" data-input="tourNote" placeholder="I’d like to see the storage locker and the gym.">${esc(td.note)}</textarea></div>
      </section>`,
      bar: `<div class="bar-price"><b>${ready ? fmtDate(td.date) : 'No time picked'}</b><span>${ready ? `${SLOTS[td.slot]} · ${td.type === 'video' ? 'Video call' : 'In person'}` : 'Pick a day and time'}</span></div>
        <button class="btn" data-action="confirmTour" ${ready ? '' : 'disabled'}>${td.editing ? 'Update tour' : 'Confirm tour'}</button>`,
    };
  };

  V.tours = () => {
    const list = upcomingTours();
    return {
      tab: 'account',
      title: 'Tours',
      html: `${navbar('Tours', '/account')}
      <div class="section">${list.length
        ? `<div class="stack">${list
            .map((t) => {
              const l = D.byId(t.listingId);
              const a = D.agents[l.agent];
              return `<article class="tour-card">
                <div class="tc-top"><span class="date-block"><span>${fmtDate(t.date, { month: 'short' })}</span><b class="num">${Number(t.date.slice(8))}</b></span>
                <a class="grow" href="#/listing/${l.id}"><b>${esc(l.name)} ${esc(l.unit)}</b><span class="meta">${fmtDate(t.date, { weekday: 'long' })} · ${SLOTS[t.slot]}</span><span class="meta with-ico">${I(t.type === 'video' ? 'video' : 'pin', 16)} ${t.type === 'video' ? `Video call with ${a.first}` : `Meet ${a.first} in the lobby`}</span></a></div>
                ${t.note ? `<p class="tc-note">“${esc(t.note)}”</p>` : ''}
                <div class="tc-actions"><a class="btn sm ghost" href="#/tour/${l.id}?tour=${t.id}">Reschedule</a><button class="btn sm ghost danger" data-action="cancelTour" data-id="${t.id}">Cancel</button></div>
              </article>`;
            })
            .join('')}</div>`
        : empty('No tours booked', 'Pick a condo and book a time that suits you. Tours take about 30 minutes.', '<a class="btn sm" href="#/browse">Browse condos</a>')}</div>`,
    };
  };

  /* ---------- Make an offer ---------- */

  const defaultDraft = (l) => ({ mode: 'asking', amount: l.price, downPct: 10, years: 30, moveIn: '45', insp: true, fin: true, appr: false });
  const draftFor = (l) => st().drafts[l.id] || defaultDraft(l);
  const DOWN = [3, 5, 10, 20];
  const MOVE = [['30', '30 days'], ['45', '45 days'], ['60', '60 days'], ['flex', 'Flexible']];
  const moveLabel = (v) => MOVE.find((m) => m[0] === v)[1];

  function offerNumbers(l, d) {
    const m = estimate(l, d);
    const diff = d.amount - l.price;
    return { m, diff, diffText: diff === 0 ? 'Full asking price' : `${money(Math.abs(diff))} ${diff < 0 ? 'under' : 'over'} asking (${Math.abs((diff / l.price) * 100).toFixed(1)}%)` };
  }

  V.offer = ({ id }) => {
    const l = D.byId(id);
    if (!l) return V.notFound();
    const d = draftFor(l);
    const { m, diffText } = offerNumbers(l, d);
    const amounts = [
      ['asking', 'Full asking price', l.price],
      ['2', '2% under asking', round500(l.price * 0.98)],
      ['5', '5% under asking', round500(l.price * 0.95)],
    ];
    const lo = round500(l.price * 0.85);
    const hi = round500(l.price * 1.05);
    const fixes = l.inspection.filter((x) => x[2] === 'fix').map((x) => x[0].toLowerCase());
    return {
      title: 'Make an offer',
      html: `${navbar('Make an offer', `/listing/${id}`)}
      <div class="section">${row(l)}</div>
      <section class="section">
        <h3 class="q">How much do you want to offer?</h3>
        <p class="q-sub">${fixes.length ? `The inspection flagged the ${fixes.join(' and ')}. That’s fair to factor in.` : 'The inspection came back clean, so a strong offer is more likely to win.'}</p>
        <div class="opts">${amounts
          .map(([k, t, v]) => `<button class="opt${d.mode === k ? ' on' : ''}" data-action="ofMode" data-v="${k}" aria-pressed="${d.mode === k}"><b>${t}</b><span class="num">${money(v)}</span></button>`)
          .join('')}
          <button class="opt${d.mode === 'custom' ? ' on' : ''}" data-action="ofMode" data-v="custom" aria-pressed="${d.mode === 'custom'}"><b>Choose my own amount</b>${I(d.mode === 'custom' ? 'check' : 'edit', 18)}</button>
        </div>
        ${d.mode === 'custom'
          ? `<div class="panel custom">
              <div class="bigamt num" id="of-amt">${money(d.amount)}</div>
              <p class="meta center" id="of-diff">${diffText}</p>
              <div class="stepper"><button class="circle-btn" data-action="ofStep" data-v="-500" aria-label="Lower by $500">${I('minus', 18)}</button>
              <label class="sr" for="of-range">Offer amount</label>
              <input type="range" id="of-range" min="${lo}" max="${hi}" step="500" value="${d.amount}" data-input="ofAmt" style="--p:${pct(d.amount, lo, hi)}">
              <button class="circle-btn" data-action="ofStep" data-v="500" aria-label="Raise by $500">${I('plus', 18)}</button></div>
            </div>`
          : ''}
      </section>
      <section class="section">
        <h3 class="q">Down payment</h3>
        <p class="q-sub">20% down usually avoids mortgage insurance (PMI).</p>
        <div class="opts two">${DOWN.map((p) => `<button class="opt col${d.downPct === p ? ' on' : ''}" data-action="ofDown" data-v="${p}" aria-pressed="${d.downPct === p}"><b>${p}%</b><span class="sub num" data-down="${p}">${money((d.amount * p) / 100)}</span></button>`).join('')}</div>
      </section>
      <section class="section">
        <h3 class="q">Loan term</h3>
        <div class="opts two">
          <button class="opt col${d.years === 30 ? ' on' : ''}" data-action="ofYears" data-v="30" aria-pressed="${d.years === 30}"><b>30-year fixed</b><span class="sub">Lower monthly payment · ${RATE}%</span></button>
          <button class="opt col${d.years === 15 ? ' on' : ''}" data-action="ofYears" data-v="15" aria-pressed="${d.years === 15}"><b>15-year fixed</b><span class="sub">Less interest overall · ${RATE15}%</span></button>
        </div>
      </section>
      <section class="section">
        <h3 class="q">When do you want to move in?</h3>
        <div class="chips">${MOVE.map(([v, t]) => `<button class="chip${d.moveIn === v ? ' on' : ''}" data-action="ofMove" data-v="${v}" aria-pressed="${d.moveIn === v}">${t}</button>`).join('')}</div>
      </section>
      <section class="section">
        <h3 class="q">Protect yourself</h3>
        <div class="group">
          ${[
            ['insp', 'Inspection contingency', 'Walk away if a serious problem turns up'],
            ['fin', 'Financing contingency', 'Protected if your loan falls through'],
            ['appr', 'Appraisal contingency', 'Renegotiate if the home appraises low'],
          ]
            .map(([k, t, s]) => `<label class="item switch-row" for="of-${k}"><span class="grow"><b>${t}</b><span class="sub">${s}</span></span><input type="checkbox" class="switch" id="of-${k}" data-change="ofToggle" data-k="${k}" ${d[k] ? 'checked' : ''}></label>`)
            .join('')}
        </div>
      </section>
      <section class="section">
        <h3 class="q">Your monthly estimate</h3>
        <div class="panel">
          <div class="kv"><span>Mortgage</span><span class="num" id="of-pi">${money(m.pi)}</span></div>
          <div class="kv"><span>HOA fee</span><span class="num">${money(l.hoa)}</span></div>
          <div class="kv"><span>Property tax (est.)</span><span class="num" id="of-tax">${money(m.tax)}</span></div>
          <div class="kv total"><span>Total</span><span class="num" id="of-total">${money(m.total)}</span></div>
          <p class="fine left">Example rates for illustration. A lender will confirm yours.</p>
        </div>
      </section>`,
      bar: `<div class="bar-price"><b class="num" id="of-mo">${money(m.total)}/mo</b><span class="num" id="of-bar-amt">Offer ${money(d.amount)}</span></div>
        <a class="btn" href="#/checkout/${id}">Review offer</a>`,
    };
  };

  /* ---------- Checkout ---------- */

  const DEPOSIT = 500;
  let co = { pay: 'wallet', agreed: false };
  const PAY = {
    wallet: { label: 'Rabbit Wallet', sub: 'Demo balance $2,500', icon: 'card' },
    bank: { label: 'Checking •••• 4821', sub: 'Demo bank account', icon: 'bank' },
  };

  V.checkout = ({ id }, q, ctx) => {
    const l = D.byId(id);
    if (!l) return V.notFound();
    if (ctx.fresh) co = { pay: co.pay, agreed: false };
    const d = draftFor(l);
    const { m, diffText } = offerNumbers(l, d);
    const prot = [d.insp && 'Inspection', d.fin && 'Financing', d.appr && 'Appraisal'].filter(Boolean);
    return {
      title: 'Review offer',
      html: `${navbar('Review offer', `/offer/${id}`)}
      <div class="section"><div class="review-head"><div class="thumb">${pic(l.images[0])}</div><div><p class="eyebrow">Your offer for</p><b class="name">${esc(l.name)} ${esc(l.unit)}</b><span class="price-xl num">${money(d.amount)}</span><span class="meta">${diffText}</span></div></div></div>
      <section class="section">
        <div class="panel">
          <div class="kv"><span>Asking price</span><span class="num">${money(l.price)}</span></div>
          <div class="kv"><span>Down payment</span><span class="num">${d.downPct}% · ${money(m.down)}</span></div>
          <div class="kv"><span>Loan amount</span><span class="num">${money(m.loan)}</span></div>
          <div class="kv"><span>Loan term</span><span>${d.years}-year fixed</span></div>
          <div class="kv"><span>Move-in</span><span>${moveLabel(d.moveIn)}</span></div>
          <div class="kv"><span>Contingencies</span><span>${prot.length ? prot.join(', ') : 'None'}</span></div>
          <div class="kv total"><span>Est. monthly cost</span><span class="num">${money(m.total)}</span></div>
        </div>
        <a class="link edit-link" href="#/offer/${id}">${I('edit', 16)} Edit offer</a>
      </section>
      <section class="section">
        <h3 class="q">Due today</h3>
        <div class="panel due"><div class="row-between"><b>Good-faith deposit</b><b class="num">${money(DEPOSIT)}</b></div><p class="meta">Refunded if the seller declines or you withdraw before they accept. Applied to your down payment at closing.</p></div>
      </section>
      <section class="section">
        <h3 class="q">Pay with</h3>
        <div class="opts">${Object.entries(PAY)
          .map(([k, p]) => `<button class="opt${co.pay === k ? ' on' : ''}" data-action="coPay" data-v="${k}" aria-pressed="${co.pay === k}"><span class="opt-ico">${I(p.icon, 22)}</span><span class="grow"><b>${p.label}</b><span class="sub">${p.sub}</span></span><span class="radio${co.pay === k ? ' on' : ''}" aria-hidden="true"></span></button>`)
          .join('')}</div>
      </section>
      <section class="section">
        <label class="check" for="agree"><input type="checkbox" id="agree" data-change="agree" ${co.agreed ? 'checked' : ''}><span>I’ve reviewed my offer. I understand this prototype doesn’t send real offers or move real money.</span></label>
      </section>`,
      bar: `<button class="btn block" id="pay-btn" data-action="submitOffer" data-id="${id}" ${co.agreed ? '' : 'disabled'}>Submit offer · Pay ${money(DEPOSIT)}</button>`,
    };
  };

  V.confirmed = ({ id }) => {
    const o = st().offers.find((x) => x.id === id);
    if (!o) return V.notFound();
    const l = D.byId(o.listingId);
    const a = D.agents[l.agent];
    const colors = ['#544374', '#485274', '#144B5C', '#22848D', '#C9C1DD'];
    const confetti = Array.from({ length: 26 }, (_, i) => `<i style="left:${(i * 37) % 100}%;background:${colors[i % 5]};animation-delay:${(i % 9) * 0.09}s;--r:${(i * 47) % 360}deg;--x:${((i * 29) % 60) - 30}px"></i>`).join('');
    return {
      title: 'Offer sent',
      html: `<section class="done">
        <div class="confetti" aria-hidden="true">${confetti}</div>
        <span class="done-check">${I('check', 44, 2.6)}</span>
        <h1>Offer sent</h1>
        <p class="done-sub">Your offer of <b class="num">${money(o.amount)}</b> for ${esc(l.name)} ${esc(l.unit)} is with the seller. We’ll let you know the moment they respond.</p>
        <div class="ticket">
          <div class="kv"><span>Offer number</span><span class="num">${o.id}</span></div>
          <div class="kv"><span>Deposit paid</span><span class="num">${money(DEPOSIT)}</span></div>
          <div class="kv"><span>Paid with</span><span>${PAY[o.pay].label}</span></div>
          <div class="kv"><span>Your agent</span><span>${a.name}</span></div>
        </div>
        <div class="cta-stack">
          <a class="btn block" href="#/offers/${o.id}">Track your offer</a>
          <a class="btn ghost block" href="#/home">Back to For You</a>
        </div>
      </section>`,
    };
  };

  /* ---------- Offers ---------- */

  V.offers = () => {
    const list = [...st().offers].reverse();
    return {
      tab: 'account',
      title: 'Your offers',
      html: `${navbar('Your offers', '/account')}
      <div class="section">${list.length
        ? `<div class="stack">${list
            .map((o) => {
              const l = D.byId(o.listingId);
              return `<a class="lrow" href="#/offers/${o.id}"><div class="thumb">${pic(l.images[0])}</div><div class="grow"><b class="name">${esc(l.name)} ${esc(l.unit)}</b><span class="meta num">${o.id} · ${money(o.amount)}</span>${statusPill(o)}</div>${I('chevR', 18)}</a>`;
            })
            .join('')}</div>`
        : empty('No offers yet', 'When you find a place you love, make an offer from its listing page.', '<a class="btn sm" href="#/browse">Browse condos</a>')}</div>`,
    };
  };

  function timeline(o, l) {
    const order = ['submitted', 'accepted', 'inspected', 'closed'];
    const at = o.status === 'countered' ? 0 : order.indexOf(o.status);
    const final = o.final ?? o.amount;
    const steps = [
      ['Offer submitted', `${money(o.amount)} · deposit paid`],
      [o.status === 'countered' ? 'Seller countered' : 'Seller response', at >= 1 ? `Accepted at ${money(final)}` : o.status === 'countered' ? `Counteroffer at ${money(o.counter)}` : 'Usually within 48 hours'],
      ['Inspection & appraisal', at >= 2 ? 'All clear' : 'Final walkthrough and lender appraisal'],
      ['Closing', at >= 3 ? 'Documents signed' : 'Sign with the title company'],
      ['Keys in hand', at >= 3 ? 'Welcome home' : `Move-in: ${moveLabel(o.moveIn)}`],
    ];
    // index of the step that is "now"
    const now = CLOSED.includes(o.status) && o.status !== 'closed' ? -1 : o.status === 'closed' ? 5 : at + 1;
    return `<ol class="tl">${steps
      .map(([t, s], i) => {
        const cls = i < now ? 'done' : i === now ? 'now' : '';
        return `<li class="tl-step ${cls}"><span class="dot">${i < now ? I('check', 16, 2.6) : i + 1}</span><span><b>${t}</b><span class="meta">${s}</span></span></li>`;
      })
      .join('')}</ol>`;
  }

  V.offerStatus = ({ id }) => {
    const o = st().offers.find((x) => x.id === id);
    if (!o) return V.notFound();
    const l = D.byId(o.listingId);
    const a = D.agents[l.agent];
    const canSim = ['submitted', 'accepted', 'inspected'].includes(o.status);
    const canWithdraw = ['submitted', 'countered'].includes(o.status);
    const hero = {
      submitted: ['The seller is reviewing your offer', `${a.first} sent it over and will chase a reply.`],
      countered: [`The seller countered at ${money(o.counter)}`, `That’s ${money(o.counter - o.amount)} more than you offered and ${money(l.price - o.counter)} under asking.`],
      accepted: ['Your offer was accepted', 'Next up: the final inspection and the lender’s appraisal.'],
      inspected: ['Inspection passed', 'Closing is booked. Your agent will send the documents to sign.'],
      closed: ['The keys are yours', `Congratulations on ${esc(l.name)} ${esc(l.unit)}.`],
      withdrawn: ['You withdrew this offer', 'Your deposit has been refunded.'],
      declined: ['You declined the counteroffer', 'Your deposit has been refunded. You can make a new offer any time.'],
    }[o.status];
    return {
      tab: 'account',
      title: `Offer ${o.id}`,
      html: `${navbar(`Offer ${o.id}`, '/offers')}
      <div class="section">${row(l)}</div>
      <section class="section">
        <div class="offer-hero ${STATUS[o.status].tone}">
          ${o.status === 'closed' ? `<span class="oh-ico">${I('key', 26)}</span>` : ''}
          ${statusPill(o)}
          <h2>${hero[0]}</h2><p>${hero[1]}</p>
          ${o.status === 'countered'
            ? `<div class="oh-actions"><button class="btn block" data-action="acceptCounter" data-id="${o.id}">Accept ${money(o.counter)}</button><div class="row2"><a class="btn ghost" href="#/offer/${l.id}">New offer</a><button class="btn ghost" data-action="declineCounter" data-id="${o.id}">Decline</button></div></div>`
            : ''}
          ${o.status === 'declined' || o.status === 'withdrawn' ? `<a class="btn ghost sm" href="#/offer/${l.id}">Make a new offer</a>` : ''}
        </div>
      </section>
      <section class="section"><h3 class="q">Progress</h3>${timeline(o, l)}</section>
      ${canSim ? `<section class="section"><div class="demo-box"><span class="demo-tag">Demo</span><p>Skip ahead to see the next step of the flow.</p><button class="btn dark sm" data-action="simulate" data-id="${o.id}">${I('sparkle', 16)} Simulate ${o.status === 'submitted' ? 'seller response' : 'next step'}</button></div></section>` : ''}
      <section class="section">
        <h3 class="q">Offer details</h3>
        <div class="panel">
          <div class="kv"><span>Your offer</span><span class="num">${money(o.amount)}</span></div>
          ${o.final ? `<div class="kv"><span>Agreed price</span><span class="num">${money(o.final)}</span></div>` : ''}
          <div class="kv"><span>Down payment</span><span class="num">${o.downPct}%</span></div>
          <div class="kv"><span>Loan term</span><span>${o.years}-year fixed</span></div>
          <div class="kv"><span>Deposit</span><span class="num">${money(DEPOSIT)}${['withdrawn', 'declined'].includes(o.status) ? ' · refunded' : ''}</span></div>
          <div class="kv"><span>Submitted</span><span>${fmtDate(o.created)} at ${fmtTime(o.created)}</span></div>
        </div>
      </section>
      <section class="section stack">
        <a class="btn ghost block" href="#/chat/${l.id}">${I('chat', 18)} Message ${a.first}</a>
        ${canWithdraw ? `<button class="btn ghost block danger" data-action="withdraw" data-id="${o.id}">Withdraw offer</button>` : ''}
      </section>`,
    };
  };

  /* ---------- Saved ---------- */

  V.saved = () => {
    const list = st().saved.map(D.byId).filter(Boolean);
    const n = list.length;
    const prices = list.map((l) => l.price);
    return {
      tab: 'saved',
      title: 'Saved',
      html: `${largeTitle('Saved', n ? `${n} condo${n === 1 ? '' : 's'}` : '', n >= 2 ? `<button class="btn sm dark" data-action="compare">Compare</button>` : avatarLink())}
      <div class="section">${n
        ? `<div class="stack">${list
            .map((l) => {
              const m = estimate(l);
              return `<article class="saved-card">
                <a class="sv-top" href="#/listing/${l.id}"><div class="thumb">${pic(l.images[0])}</div>
                  <div class="grow"><b class="name">${esc(l.name)} ${esc(l.unit)}</b><span class="meta">${hoodName(l)} · ${bedsLabel(l)} · ${l.sqft} sq ft</span><span class="price-sm num">${money(l.price)}</span><span class="meta num">est. ${money(m.total)}/mo</span></div></a>
                <button class="sv-remove" data-action="save" data-id="${l.id}" aria-label="Remove ${esc(l.name)} from Saved">${I('x', 18)}</button>
                <div class="sv-actions"><a class="btn sm ghost" href="#/tour/${l.id}">${I('calendar', 16)} Tour</a><a class="btn sm" href="#/offer/${l.id}">Make an offer</a></div>
              </article>`;
            })
            .join('')}</div>
          <div class="panel summary">
            <div class="kv"><span>Price range</span><span class="num">${short(Math.min(...prices))} – ${short(Math.max(...prices))}</span></div>
            <div class="kv"><span>Average HOA</span><span class="num">${money(list.reduce((s, l) => s + l.hoa, 0) / n)}/mo</span></div>
            <div class="kv"><span>Best inspection score</span><span>${list.reduce((b, l) => (l.score > b.score ? l : b)).name}</span></div>
          </div>`
        : empty('Nothing saved yet', 'Tap the heart on any condo to keep it here and compare it later.', '<a class="btn sm" href="#/browse">Browse condos</a>')}</div>`,
    };
  };

  function compareSheet() {
    const list = st().saved.map(D.byId).filter(Boolean).slice(0, 4);
    const best = (fn, dir) => {
      const vals = list.map(fn);
      return dir === 'min' ? Math.min(...vals) : Math.max(...vals);
    };
    const rows = [
      ['Price', (l) => l.price, money, 'min'],
      ['Est. monthly', (l) => estimate(l).total, money, 'min'],
      ['Size', (l) => l.sqft, (v) => `${v.toLocaleString()} sq ft`, 'max'],
      ['Price / sq ft', (l) => l.price / l.sqft, money, 'min'],
      ['HOA', (l) => l.hoa, money, 'min'],
      ['Inspection', (l) => l.score, (v) => `${v}/100`, 'max'],
    ];
    return `<div class="sheet-head"><h3>Compare</h3><button class="circle-btn" data-action="closeSheet" aria-label="Close">${I('x', 18)}</button></div>
      <p class="meta">Best value in each row is highlighted.</p>
      <div class="cmp-wrap"><table class="cmp">
        <thead><tr><th scope="col"><span class="sr">Detail</span></th>${list.map((l) => `<th scope="col"><div class="thumb">${pic(l.images[0])}</div>${esc(l.name)}</th>`).join('')}</tr></thead>
        <tbody>
          <tr><th scope="row">Area</th>${list.map((l) => `<td>${hoodName(l)}</td>`).join('')}</tr>
          <tr><th scope="row">Rooms</th>${list.map((l) => `<td>${bedsLabel(l)} · ${l.baths} ba</td>`).join('')}</tr>
          ${rows.map(([k, fn, f, dir]) => {
            const b = best(fn, dir);
            return `<tr><th scope="row">${k}</th>${list.map((l) => `<td class="num${fn(l) === b ? ' best' : ''}">${f(fn(l))}</td>`).join('')}</tr>`;
          }).join('')}
          <tr><th scope="row">Condition</th>${list.map((l) => `<td>${l.condition}</td>`).join('')}</tr>
        </tbody></table></div>`;
  }

  /* ---------- Account ---------- */

  V.account = () => {
    const s = st();
    const name = s.user.name || 'Guest';
    const p = s.prefs;
    const prefLine = [p.budget ? `Up to ${short(p.budget)}` : '', p.beds === 'any' ? 'any size' : p.beds === '0' ? 'studios' : `${p.beds}${p.beds === '2' ? '+' : ''} bd`, p.hoods.length ? p.hoods.map((h) => D.hoods[h].name).join(', ') : 'all areas'].join(' · ');
    const tours = upcomingTours().length;
    const chats = Object.keys(s.chats).length;
    return {
      tab: 'account',
      title: 'Account',
      html: `${largeTitle('Account')}
      <section class="section">
        <div class="profile"><span class="avatar xl">${s.user.name ? esc(s.user.name[0].toUpperCase()) : I('user', 30)}</span><div><b class="p-name">${esc(name)}</b><span class="meta">${prefLine}</span></div></div>
        <div class="tiles">
          <a class="tile-stat" href="#/offers"><b class="num">${s.offers.length}</b><span>Offers</span></a>
          <a class="tile-stat" href="#/tours"><b class="num">${tours}</b><span>Tours</span></a>
          <a class="tile-stat" href="#/saved"><b class="num">${s.saved.length}</b><span>Saved</span></a>
        </div>
      </section>
      <section class="section">
        <h3 class="group-h">Activity</h3>
        <div class="group">
          <a class="item" href="#/offers"><span class="ico">${I('doc', 18)}</span><span class="grow">Your offers</span>${I('chevR', 18)}</a>
          <a class="item" href="#/tours"><span class="ico">${I('calendar', 18)}</span><span class="grow">Tours</span>${I('chevR', 18)}</a>
          <a class="item" href="#/messages"><span class="ico">${I('chat', 18)}</span><span class="grow">Messages${chats ? ` <span class="count-pill">${chats}</span>` : ''}</span>${I('chevR', 18)}</a>
        </div>
      </section>
      <section class="section">
        <h3 class="group-h">Preferences</h3>
        <div class="group">
          <a class="item" href="#/onboarding?edit=1"><span class="ico">${I('sliders', 18)}</span><span class="grow">Search preferences<span class="sub">${prefLine}</span></span>${I('chevR', 18)}</a>
          <label class="item switch-row" for="notif"><span class="ico">${I('bell', 18)}</span><span class="grow">Notifications<span class="sub">Price drops and offer updates</span></span><input type="checkbox" class="switch" id="notif" data-change="notif" ${s.notifications ? 'checked' : ''}></label>
        </div>
      </section>
      <section class="section">
        <h3 class="group-h">Learn</h3>
        <div class="group">
          <button class="item" data-action="guides"><span class="ico">${I('doc', 18)}</span><span class="grow">Buyer school</span>${I('chevR', 18)}</button>
          <button class="item" data-action="inspectInfo"><span class="ico">${I('shield', 18)}</span><span class="grow">How Rabbit inspects</span>${I('chevR', 18)}</button>
          <button class="item" data-action="about"><span class="ico">${I('info', 18)}</span><span class="grow">About this prototype</span>${I('chevR', 18)}</button>
        </div>
      </section>
      <section class="section"><button class="btn ghost block danger" data-action="resetDemo">${I('refresh', 18)} Reset demo data</button></section>`,
    };
  };

  /* ---------- Messages & chat ---------- */

  V.messages = () => {
    const chats = st().chats;
    const ids = Object.keys(chats).sort((a, b) => chats[b].at(-1).at - chats[a].at(-1).at);
    return {
      tab: 'account',
      title: 'Messages',
      html: `${navbar('Messages', '/account')}
      <div class="section">${ids.length
        ? `<div class="group">${ids
            .map((id) => {
              const l = D.byId(id);
              const a = D.agents[l.agent];
              const last = chats[id].at(-1);
              return `<a class="item msg-row" href="#/chat/${id}">${agentAvatar(a, 44)}<span class="grow"><span class="row-between"><b>${a.name}</b><span class="meta">${fmtTime(last.at)}</span></span><span class="sub">${esc(l.name)} ${esc(l.unit)}</span><span class="preview">${last.from === 'me' ? 'You: ' : ''}${esc(last.text)}</span></span></a>`;
            })
            .join('')}</div>`
        : empty('No messages yet', 'Ask an agent anything from a listing page. They know the building inside out.', '<a class="btn sm" href="#/browse">Browse condos</a>')}</div>`,
    };
  };

  const QUICK = ['Is the price negotiable?', 'What does the HOA cover?', 'Can I see it this week?', 'Any repairs needed?'];

  function bubbles(id) {
    const msgs = st().chats[id] || [];
    return msgs
      .map((m) => `<div class="bub ${m.from}">${esc(m.text)}${m.link ? `<a class="bub-link" href="${m.link.href}">${m.link.label} ${I('arrowR', 14)}</a>` : ''}</div>`)
      .join('');
  }

  V.chat = ({ id }, q, ctx) => {
    const l = D.byId(id);
    if (!l) return V.notFound();
    const a = D.agents[l.agent];
    if (!st().chats[id]) {
      const n = st().user.name;
      S.update((s) => {
        s.chats[id] = [{ from: 'agent', text: `Hi${n ? ` ${n}` : ''}, I’m ${a.first}, the Rabbit agent for ${l.name}. What would you like to know about ${l.unit}?`, at: Date.now() }];
      });
    }
    return {
      title: `Chat with ${a.first}`,
      html: `<header class="navbar chat-nav"><button class="circle-btn" data-action="back" data-fallback="/listing/${id}" aria-label="Back">${I('back', 20)}</button>
        <a class="chat-who" href="#/listing/${id}">${agentAvatar(a, 34)}<span><b>${a.name}</b><span class="meta">${esc(l.name)} ${esc(l.unit)}</span></span></a><div></div></header>
      <div class="chat" id="chat-list" aria-live="polite">${bubbles(id)}</div>
      <div class="chips scroll-x quick">${QUICK.map((t) => `<button class="chip" data-action="quickReply" data-id="${id}" data-q="${t}">${t}</button>`).join('')}</div>`,
      bar: `<form class="composer" data-submit="chat" data-id="${id}"><label class="sr" for="chat-input">Message</label><input id="chat-input" class="input pill" autocomplete="off" placeholder="Message ${a.first}" enterkeyhint="send"><button class="send" aria-label="Send">${I('send', 20)}</button></form>`,
      after: (root) => {
        root.scrollTop = root.scrollHeight;
      },
    };
  };

  function agentReply(text, l) {
    const t = text.toLowerCase();
    const n = st().user.name;
    const petAlt = D.listings.filter((x) => x.tags.includes('Pet friendly') && x.id !== l.id).slice(0, 2).map((x) => x.name);
    if (/negotia|lower|price|cheaper|deal|discount/.test(t))
      return { text: `The sellers are asking ${money(l.price)}${l.was ? `, down from ${money(l.was)}` : ''}. There’s usually some room on a pre-loved condo, especially with the inspection in hand. Want to try some numbers?`, link: { href: `#/offer/${l.id}`, label: 'Open the offer builder' } };
    if (/hoa|fee|dues|cover/.test(t))
      return { text: `The HOA is ${money(l.hoa)}/mo. It covers building insurance, water, trash and upkeep of the shared spaces${l.tags.includes('Gym') ? ', including the gym' : ''}. The reserve fund is ${l.reserve.toLowerCase()}.` };
    if (/tour|see|visit|view|show|week|tomorrow|weekend/.test(t))
      return { text: `I’d love to show you ${l.unit}. I’m free most afternoons this week. Grab any open slot and I’ll meet you in the lobby.`, link: { href: `#/tour/${l.id}`, label: 'Pick a time' } };
    if (/repair|issue|problem|inspect|condition|fix/.test(t)) {
      const fixes = l.inspection.filter((x) => x[2] !== 'good');
      return { text: fixes.length ? `The inspection scored it ${l.score}/100. Things to know: ${fixes.map((x) => `${x[0].toLowerCase()} (${x[1].toLowerCase()})`).join(', ')}. Nothing structural.` : `It scored ${l.score}/100 on inspection with nothing flagged. It’s in great shape.` };
    }
    if (/pet|dog|cat/.test(t))
      return { text: l.tags.includes('Pet friendly') ? 'Yes, the building is pet friendly. I can send you the pet rules from the HOA documents.' : `This building has pet restrictions. If you have a pet, I’d look at ${petAlt.join(' or ')}.` };
    if (/park|car/.test(t))
      return { text: l.parking === 'Garage spot' ? 'It comes with one deeded garage spot.' : l.parking === 'Street permit' ? 'Parking here is by residential street permit, which is easy to get.' : `There’s no parking with this unit, but it’s a ${l.transit.toLowerCase()}.` };
    if (/^(hi|hey|hello|yo)\b/.test(t)) return { text: `Hi${n ? ` ${n}` : ''}! What would you like to know about ${l.name}?` };
    if (/thank/.test(t)) return { text: 'Any time. Message me whenever something comes up.' };
    return { text: `Good question. I’ll check with the sellers and get back to you today. The inspection report on the listing covers most building details in the meantime.` };
  }

  /* ---------- fallback ---------- */

  V.notFound = () => ({
    tab: 'home',
    title: 'Not found',
    html: `${navbar('', '/home')}<div class="section">${empty('This page hopped away', 'The link may be out of date.', '<a class="btn sm" href="#/home">Go to For You</a>')}</div>`,
  });

  /* ---------- actions (click), inputs, changes, submits ---------- */

  const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const rerender = () => app().rerender();

  function saveDraft(id, patch) {
    S.update((s) => {
      const l = D.byId(id);
      s.drafts[id] = { ...(s.drafts[id] || defaultDraft(l)), ...patch };
    });
  }
  const currentId = () => location.hash.split('/')[2]?.split('?')[0];

  function finishOnboarding() {
    const n = matchList(ob).length;
    S.update((s) => {
      s.user.name = ob.name.trim();
      s.prefs = { budget: ob.budget, beds: ob.beds, hoods: ob.hoods, musts: ob.musts };
      s.onboarded = true;
    });
    const edit = ob.edit;
    ob = null;
    app().go(edit ? '/account' : '/home');
    app().toast(edit ? 'Preferences updated' : `${n} condo${n === 1 ? '' : 's'} match your search`);
  }

  function sendChat(id, text) {
    text = text.trim();
    if (!text) return;
    const l = D.byId(id);
    S.update((s) => s.chats[id].push({ from: 'me', text, at: Date.now() }));
    const list = document.getElementById('chat-list');
    const view = document.getElementById('view');
    if (list) {
      list.innerHTML = bubbles(id) + '<div class="bub agent typing" aria-label="Typing"><span></span><span></span><span></span></div>';
      view.scrollTop = view.scrollHeight;
    }
    setTimeout(() => {
      S.update((s) => s.chats[id].push({ from: 'agent', at: Date.now(), ...agentReply(text, l) }));
      const el = document.getElementById('chat-list');
      if (el && currentId() === id) {
        el.innerHTML = bubbles(id);
        view.scrollTop = view.scrollHeight;
      }
    }, 1100);
  }

  function setOffer(id, fn) {
    S.update((s) => {
      const o = s.offers.find((x) => x.id === id);
      fn(o, s);
      o.history.push({ status: o.status, at: Date.now() });
    });
  }

  function guideSheet(g) {
    return `<div class="sheet-head"><span class="g-ico ${g.tone}">${I(g.icon, 22)}</span><button class="circle-btn" data-action="closeSheet" aria-label="Close">${I('x', 18)}</button></div>
      <p class="eyebrow">Buyer school · ${g.mins} min read</p><h2 class="sheet-title">${g.title}</h2>
      ${g.body.map((p) => `<p class="body">${p}</p>`).join('')}`;
  }

  V.actions = {
    guest() {
      S.update((s) => (s.onboarded = true));
      app().go('/home');
    },
    obNext() {
      ob.step++;
      rerender();
      document.getElementById('view').scrollTop = 0;
    },
    obPrev() {
      ob.step--;
      rerender();
    },
    obFinish: finishOnboarding,
    obBeds(el) {
      ob.beds = el.dataset.v;
      rerender();
    },
    obHood(el) {
      ob.hoods = toggle(ob.hoods, el.dataset.v);
      rerender();
    },
    obMust(el) {
      ob.musts = toggle(ob.musts, el.dataset.v);
      rerender();
    },
    browseSort(el) {
      browseSort = el.dataset.v;
      rerender();
    },
    sqBeds(el) {
      sq.beds = el.dataset.v;
      rerender();
    },
    sqClear(el) {
      const { k, v } = el.dataset;
      if (k === 'price') sq.maxPrice = MAXP;
      if (k === 'hood') sq.hoods = sq.hoods.filter((h) => h !== v);
      if (k === 'must') sq.musts = sq.musts.filter((m) => m !== v);
      rerender();
    },
    sqReset() {
      sq = defaultSearch();
      rerender();
    },
    searchFill(el) {
      sq.q = el.dataset.q;
      rerender();
    },
    clearRecent() {
      S.update((s) => (s.recent = []));
      rerender();
    },
    openFilters() {
      fDraft = JSON.parse(JSON.stringify(sq));
      app().sheet(filtersSheet());
    },
    fBeds(el) {
      fDraft.beds = el.dataset.v;
      app().sheet.update(filtersSheet());
    },
    fHood(el) {
      fDraft.hoods = toggle(fDraft.hoods, el.dataset.v);
      app().sheet.update(filtersSheet());
    },
    fMust(el) {
      fDraft.musts = toggle(fDraft.musts, el.dataset.v);
      app().sheet.update(filtersSheet());
    },
    fSort(el) {
      fDraft.sort = el.dataset.v;
      app().sheet.update(filtersSheet());
    },
    fReset() {
      fDraft = { ...defaultSearch(), q: fDraft.q };
      app().sheet.update(filtersSheet());
    },
    fApply() {
      sq = fDraft;
      app().closeSheet();
      rerender();
    },
    estInfo() {
      app().sheet(`<div class="sheet-head"><h3>How we estimate</h3><button class="circle-btn" data-action="closeSheet" aria-label="Close">${I('x', 18)}</button></div>
        <p class="body">Monthly estimates add three things: your mortgage payment, the building’s HOA fee and property tax.</p>
        <p class="body">We assume 10% down and a 30-year fixed loan at an example rate of ${RATE}%, with property tax at about 1.1% of the price per year. Insurance and mortgage insurance (PMI) aren’t included.</p>
        <p class="body">Open the offer builder on any listing to change the down payment and loan term.</p>`);
    },
    inspectInfo() {
      app().sheet(`<div class="sheet-head"><span class="g-ico leaf">${I('shield', 22)}</span><button class="circle-btn" data-action="closeSheet" aria-label="Close">${I('x', 18)}</button></div>
        <h2 class="sheet-title">How Rabbit inspects</h2>
        <p class="body">Before a condo goes live on Rabbit, a licensed inspector checks the unit and the building’s shared systems: plumbing, electrical, heating and cooling, windows, appliances and visible structure.</p>
        <p class="body">You get every finding in plain language, marked Good, Fair or Needs work, plus a condition score out of 100. Items that need work are listed up front so you can factor them into your offer.</p>
        <p class="body">We also pull the HOA’s reserve fund figures, so you know whether the building is saving enough for big repairs.</p>`);
    },
    about() {
      app().sheet(`<div class="about">${mark(84, 'icon')}<span class="wordmark">rabbit</span>
        <p class="body center">Rabbit helps young adults buy their first home with inspected, pre-loved condos at fair prices.</p>
        <p class="meta center">This is a clickable prototype. Listings, agents, payments and messages are sample data saved in this browser only. Photos are from Pexels; each one credits its photographer.</p>
        <button class="btn ghost block" data-action="closeSheet">Close</button></div>`);
    },
    guide(el) {
      app().sheet(guideSheet(D.guides.find((g) => g.id === el.dataset.id)));
    },
    guides() {
      app().sheet(`<div class="sheet-head"><h3>Buyer school</h3><button class="circle-btn" data-action="closeSheet" aria-label="Close">${I('x', 18)}</button></div>
        <div class="group">${D.guides.map((g) => `<button class="item" data-action="guide" data-id="${g.id}"><span class="ico">${I(g.icon, 18)}</span><span class="grow">${g.title}<span class="sub">${g.mins} min read</span></span>${I('chevR', 18)}</button>`).join('')}</div>`);
    },
    tourType(el) {
      td.type = el.dataset.v;
      rerender();
    },
    tourDay(el) {
      td.date = el.dataset.v;
      if (td.slot !== null && slotTaken(td.date, td.slot)) td.slot = null;
      rerender();
    },
    tourSlot(el) {
      td.slot = Number(el.dataset.v);
      rerender();
    },
    confirmTour() {
      const d = { ...td };
      S.update((s) => {
        if (d.editing) {
          Object.assign(s.tours.find((t) => t.id === d.editing), { date: d.date, slot: d.slot, type: d.type, note: d.note });
        } else {
          s.tours = s.tours.filter((t) => t.listingId !== d.listingId);
          s.tours.push({ id: 'T' + Date.now().toString(36), listingId: d.listingId, date: d.date, slot: d.slot, type: d.type, note: d.note, created: Date.now() });
        }
      });
      td = null;
      app().go('/tours');
      app().toast(`${d.editing ? 'Tour moved to' : 'Tour booked for'} ${fmtDate(d.date)}, ${SLOTS[d.slot]}`);
    },
    cancelTour(el) {
      const t = st().tours.find((x) => x.id === el.dataset.id);
      const l = D.byId(t.listingId);
      app().sheet(`<h3 class="sheet-title">Cancel this tour?</h3><p class="body">${esc(l.name)} ${esc(l.unit)} on ${fmtDate(t.date)} at ${SLOTS[t.slot]}. ${D.agents[l.agent].first} will be notified.</p>
        <div class="stack"><button class="btn dark block" data-action="cancelTourYes" data-id="${t.id}">Cancel tour</button><button class="btn ghost block" data-action="closeSheet">Keep it</button></div>`);
    },
    cancelTourYes(el) {
      S.update((s) => (s.tours = s.tours.filter((t) => t.id !== el.dataset.id)));
      app().closeSheet();
      rerender();
      app().toast('Tour cancelled');
    },
    ofMode(el) {
      const id = currentId();
      const l = D.byId(id);
      const v = el.dataset.v;
      const amt = { asking: l.price, 2: round500(l.price * 0.98), 5: round500(l.price * 0.95) }[v];
      saveDraft(id, { mode: v, ...(amt ? { amount: amt } : {}) });
      rerender();
    },
    ofStep(el) {
      const id = currentId();
      const l = D.byId(id);
      const d = draftFor(l);
      const amount = Math.min(round500(l.price * 1.05), Math.max(round500(l.price * 0.85), d.amount + Number(el.dataset.v)));
      saveDraft(id, { amount });
      rerender();
    },
    ofDown(el) {
      saveDraft(currentId(), { downPct: Number(el.dataset.v) });
      rerender();
    },
    ofYears(el) {
      saveDraft(currentId(), { years: Number(el.dataset.v) });
      rerender();
    },
    ofMove(el) {
      saveDraft(currentId(), { moveIn: el.dataset.v });
      rerender();
    },
    coPay(el) {
      co.pay = el.dataset.v;
      rerender();
    },
    submitOffer(el) {
      const id = el.dataset.id;
      const l = D.byId(id);
      const d = draftFor(l);
      el.disabled = true;
      el.innerHTML = '<span class="spin" aria-hidden="true"></span> Sending your offer…';
      setTimeout(() => {
        const o = {
          id: 'RB-' + String(Math.floor(1000 + Math.random() * 9000)),
          listingId: id,
          amount: d.amount,
          downPct: d.downPct,
          years: d.years,
          moveIn: d.moveIn,
          insp: d.insp,
          fin: d.fin,
          appr: d.appr,
          pay: co.pay,
          status: 'submitted',
          counter: null,
          created: Date.now(),
          history: [{ status: 'submitted', at: Date.now() }],
        };
        S.update((s) => {
          s.offers.push(o);
          delete s.drafts[id];
        });
        app().go(`/confirmed/${o.id}`, { replace: true });
      }, 1300);
    },
    simulate(el) {
      const id = el.dataset.id;
      const o = st().offers.find((x) => x.id === id);
      const l = D.byId(o.listingId);
      let msg = '';
      setOffer(id, (x) => {
        if (x.status === 'submitted') {
          if (x.amount >= l.price * 0.98) {
            x.status = 'accepted';
            x.final = x.amount;
            msg = 'The seller accepted your offer!';
          } else {
            x.status = 'countered';
            x.counter = round500((x.amount + l.price) / 2);
            msg = `The seller countered at ${money(x.counter)}`;
          }
        } else if (x.status === 'accepted') {
          x.status = 'inspected';
          msg = 'Inspection and appraisal passed';
        } else if (x.status === 'inspected') {
          x.status = 'closed';
          msg = 'Closed! The keys are yours';
        }
      });
      rerender();
      if (st().notifications) app().toast(msg, 'bell');
    },
    acceptCounter(el) {
      setOffer(el.dataset.id, (o) => {
        o.status = 'accepted';
        o.final = o.counter;
      });
      rerender();
      app().toast('Counteroffer accepted');
    },
    declineCounter(el) {
      setOffer(el.dataset.id, (o) => (o.status = 'declined'));
      rerender();
      app().toast('Counteroffer declined, deposit refunded');
    },
    withdraw(el) {
      app().sheet(`<h3 class="sheet-title">Withdraw this offer?</h3><p class="body">The seller will be told and your ${money(DEPOSIT)} deposit will be refunded.</p>
        <div class="stack"><button class="btn dark block" data-action="withdrawYes" data-id="${el.dataset.id}">Withdraw offer</button><button class="btn ghost block" data-action="closeSheet">Keep my offer</button></div>`);
    },
    withdrawYes(el) {
      setOffer(el.dataset.id, (o) => (o.status = 'withdrawn'));
      app().closeSheet();
      rerender();
      app().toast('Offer withdrawn');
    },
    compare() {
      app().sheet(compareSheet());
    },
    quickReply(el) {
      sendChat(el.dataset.id, el.dataset.q);
    },
    resetDemo() {
      app().sheet(`<h3 class="sheet-title">Reset the demo?</h3><p class="body">This clears your name, preferences, saved condos, tours, offers and messages in this browser.</p>
        <div class="stack"><button class="btn dark block" data-action="resetYes">Reset everything</button><button class="btn ghost block" data-action="closeSheet">Cancel</button></div>`);
    },
    resetYes() {
      S.reset();
      sq = defaultSearch();
      ob = td = null;
      app().closeSheet();
      app().go('/splash');
    },
  };

  V.inputs = {
    obName(el) {
      ob.name = el.value;
    },
    obBudget(el) {
      ob.budget = Number(el.value);
      el.style.setProperty('--p', pct(ob.budget, 120000, 350000));
      document.getElementById('ob-budget').textContent = `Up to ${money(ob.budget)}`;
      document.getElementById('ob-mo').textContent = money(monthly(ob.budget, { hoa: 300 }).total);
    },
    searchQ(el) {
      sq.q = el.value;
      document.getElementById('results').innerHTML = searchResults();
    },
    fPrice(el) {
      fDraft.maxPrice = Number(el.value);
      el.style.setProperty('--p', pct(fDraft.maxPrice, 150000, MAXP));
      document.getElementById('f-price').textContent = fDraft.maxPrice >= MAXP ? 'Any price' : money(fDraft.maxPrice);
      const n = filterListings(fDraft).length;
      document.getElementById('f-apply').textContent = `Show ${n} condo${n === 1 ? '' : 's'}`;
    },
    tourNote(el) {
      td.note = el.value;
    },
    ofAmt(el) {
      const id = currentId();
      const l = D.byId(id);
      const lo = round500(l.price * 0.85);
      const hi = round500(l.price * 1.05);
      saveDraft(id, { amount: Number(el.value) });
      const d = draftFor(l);
      const { m, diffText } = offerNumbers(l, d);
      el.style.setProperty('--p', pct(d.amount, lo, hi));
      const set = (sel, txt) => {
        const n = document.getElementById(sel);
        if (n) n.textContent = txt;
      };
      set('of-amt', money(d.amount));
      set('of-diff', diffText);
      set('of-pi', money(m.pi));
      set('of-tax', money(m.tax));
      set('of-total', money(m.total));
      set('of-mo', `${money(m.total)}/mo`);
      set('of-bar-amt', `Offer ${money(d.amount)}`);
      document.querySelectorAll('[data-down]').forEach((n) => (n.textContent = money((d.amount * Number(n.dataset.down)) / 100)));
    },
  };

  V.changes = {
    ofToggle(el) {
      saveDraft(currentId(), { [el.dataset.k]: el.checked });
    },
    agree(el) {
      co.agreed = el.checked;
      document.getElementById('pay-btn').disabled = !el.checked;
    },
    notif(el) {
      S.update((s) => (s.notifications = el.checked));
      app().toast(el.checked ? 'Notifications on' : 'Notifications off', 'bell');
    },
  };

  V.submits = {
    search(form) {
      const q = sq.q.trim();
      form.querySelector('input').blur();
      if (q.length > 1) S.update((s) => (s.recent = [q, ...s.recent.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 5)));
    },
    chat(form) {
      const input = form.querySelector('input');
      sendChat(form.dataset.id, input.value);
      input.value = '';
    },
  };

  R.views = V;
})((window.Rabbit = window.Rabbit || {}));
