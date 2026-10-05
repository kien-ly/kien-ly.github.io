/* Progress store: solved problems, rubric scores, notes, flashcard (Leitner) state.
 * Everything lives in localStorage of this browser only. Every access is wrapped in
 * try/catch so the app still works in private windows or when storage is blocked. */
(function () {
  const KEY = "dep_progress_v1";
  const BOX_DAYS = [0, 1, 3, 7, 14, 30]; // index = box (1..5); box 1 = review tomorrow

  const empty = () => ({ solved: {}, attempted: {}, read: {}, rubric: {}, notes: {}, cards: {}, days: [] });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? Object.assign(empty(), JSON.parse(raw)) : empty();
    } catch (e) {
      return empty();
    }
  }
  let state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  }

  function today() { return new Date().toISOString().slice(0, 10); }

  function touchDay() {
    const d = today();
    if (!state.days.includes(d)) { state.days.push(d); state.days = state.days.slice(-400); }
  }

  function streak() {
    const set = new Set(state.days);
    let n = 0;
    const d = new Date();
    if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1); // streak alive until end of today
    while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  // simple stable hash for card ids
  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }

  window.Store = {
    get state() { return state; },
    hash,
    markSolved(id) { state.solved[id] = Date.now(); touchDay(); save(); },
    unmarkSolved(id) { delete state.solved[id]; save(); },
    isSolved(id) { return !!state.solved[id]; },
    markAttempted(id) { state.attempted[id] = Date.now(); touchDay(); save(); },
    markRead(id) { state.read[id] = Date.now(); touchDay(); save(); },
    unmarkRead(id) { delete state.read[id]; save(); },
    isRead(id) { return !!state.read[id]; },
    setRubric(id, arr) { state.rubric[id] = arr; touchDay(); save(); },
    getRubric(id) { return state.rubric[id] || []; },
    setNotes(id, text) { state.notes[id] = text; save(); },
    getNotes(id) { return state.notes[id] || ""; },
    streak,
    // ----- Leitner -----
    card(id) { return state.cards[id]; },
    isDue(id) {
      const c = state.cards[id];
      return !c || c.next <= today();
    },
    rateCard(id, grade) {
      // grade: 0 = again, 1 = hard, 2 = good, 3 = easy
      const c = state.cards[id] || { box: 0, reviews: 0, lapses: 0 };
      if (grade === 0) { c.box = 1; c.lapses++; }
      else if (grade === 1) { c.box = Math.max(1, c.box); }
      else if (grade === 2) { c.box = Math.min(5, c.box + 1); }
      else { c.box = Math.min(5, c.box + 2); }
      const next = new Date();
      next.setDate(next.getDate() + (grade === 0 ? 0 : BOX_DAYS[c.box]));
      c.next = next.toISOString().slice(0, 10);
      c.reviews++;
      c.last = today();
      state.cards[id] = c;
      touchDay();
      save();
      return c;
    },
    boxCounts(ids) {
      const counts = [0, 0, 0, 0, 0, 0]; // index 0 = new
      ids.forEach(id => { const c = state.cards[id]; counts[c ? c.box : 0]++; });
      return counts;
    },
    export() { return JSON.stringify(state, null, 2); },
    import(json) { state = Object.assign(empty(), JSON.parse(json)); save(); },
    reset() { state = empty(); save(); },
  };
})();
