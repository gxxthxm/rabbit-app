// App state, persisted to localStorage so saves, tours, offers and chats survive a reload.

(function (R) {
  const KEY = 'rabbit:v1';

  const defaults = () => ({
    onboarded: false,
    user: { name: '' },
    prefs: { budget: 250000, beds: 'any', hoods: [], musts: [] },
    saved: [],
    tours: [], // { id, listingId, date: 'YYYY-MM-DD', slot, type, note, created }
    offers: [], // { id, listingId, amount, downPct, years, moveIn, insp, fin, appr, pay, status, counter, history }
    drafts: {}, // offer builder drafts by listing id
    chats: {}, // messages by listing id
    recent: [],
    notifications: true,
  });

  let state;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    state = Object.assign(defaults(), raw || {});
  } catch {
    state = defaults();
  }

  const listeners = new Set();
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable: keep working in memory */
    }
  };
  const emit = () => listeners.forEach((fn) => fn(state));

  R.store = {
    get: () => state,
    update(fn) {
      fn(state);
      save();
      emit();
    },
    reset() {
      state = defaults();
      save();
      emit();
    },
    on(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
})((window.Rabbit = window.Rabbit || {}));
