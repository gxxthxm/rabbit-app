// Shared helpers: escaping, money, mortgage maths, dates and the Rabbit logo mark.

(function (R) {
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  // 189000 → $189k, 246500 → $246.5k
  const short = (n) => '$' + (Math.round(n / 100) / 10).toString().replace(/\.0$/, '') + 'k';
  const round500 = (n) => Math.round(n / 500) * 500;

  // Example 30- and 15-year fixed rates used for every estimate in the prototype.
  const RATE = 6.4;
  const RATE15 = 5.7;
  const TAX_RATE = 0.011; // yearly property tax estimate, share of price

  function monthly(price, { downPct = 10, years = 30, rate = RATE, hoa = 0 } = {}) {
    const loan = price * (1 - downPct / 100);
    const r = rate / 100 / 12;
    const n = years * 12;
    const pi = (loan * r) / (1 - Math.pow(1 + r, -n));
    const tax = (price * TAX_RATE) / 12;
    return { pi, tax, hoa, total: pi + tax + hoa, loan, down: (price * downPct) / 100 };
  }

  const DAY = 864e5;
  const pad = (n) => String(n).padStart(2, '0');
  const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromIso = (s) => new Date(s + 'T12:00:00');
  const fmtDate = (d, opts = { weekday: 'short', month: 'short', day: 'numeric' }) =>
    (typeof d === 'string' ? fromIso(d) : new Date(d)).toLocaleDateString('en-US', opts);
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  };
  const pct = (v, min, max) => ((v - min) / (max - min)) * 100 + '%';

  // The Rabbit mark: a house with rabbit ears, two window eyes and a door.
  // variant: 'icon' (plum tile), 'ink' (dark on light), 'light' (white on plum)
  function mark(size = 40, variant = 'ink', animated = false) {
    const fg = variant === 'ink' ? '#1C2033' : '#FDFDFE';
    const cut = variant === 'ink' ? '#22848D' : '#544374';
    const tile = variant === 'icon' ? '<rect width="64" height="64" rx="14" fill="#544374"/>' : '';
    const fit = variant === 'icon' ? ' transform="translate(6 6) scale(.8125)"' : '';
    return `<svg class="mark${animated ? ' animated' : ''}" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">${tile}<g${fit}>
      <g class="ear ear-l"><rect x="17" y="3" width="11" height="28" rx="5.5" fill="${fg}" transform="rotate(-10 22.5 31)"/><rect x="20" y="8" width="5" height="16" rx="2.5" fill="${cut}" transform="rotate(-10 22.5 31)"/></g>
      <g class="ear ear-r"><rect x="36" y="3" width="11" height="28" rx="5.5" fill="${fg}" transform="rotate(10 41.5 31)"/><rect x="39" y="8" width="5" height="16" rx="2.5" fill="${cut}" transform="rotate(10 41.5 31)"/></g>
      <path d="M8 33.5 L32 17 L56 33.5 V55 a5 5 0 0 1 -5 5 H13 a5 5 0 0 1 -5 -5 Z" fill="${fg}" stroke="${fg}" stroke-width="3" stroke-linejoin="round"/>
      <circle class="eye" cx="24" cy="41" r="3" fill="${cut}"/><circle class="eye" cx="40" cy="41" r="3" fill="${cut}"/>
      <path d="M28 61.5 V52 a4 4 0 0 1 8 0 V61.5 Z" fill="${cut}"/></g></svg>`;
  }

  R.util = { esc, money, short, round500, monthly, RATE, RATE15, DAY, isoDay, fromIso, fmtDate, fmtTime, greeting, pct, mark };
})((window.Rabbit = window.Rabbit || {}));
