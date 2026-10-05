/* Data Engineering Interview Prep: single-page app over the content bundle (window.CONTENT). */
(function () {
  const C = window.CONTENT || { pages: [] };
  const PAGES = C.pages;
  const BY_PATH = Object.fromEntries(PAGES.map(p => [p.path, p]));
  const $view = document.getElementById("view");
  const esc = s => Render.escapeHtml(s == null ? "" : s);

  // ------------------------------------------------------------------ catalogue
  const LEARN = [
    { id: "system-design", title: "System Design", desc: "Interview framework, estimation, building blocks, reliability patterns." },
    { id: "architecture", title: "Data Architecture", desc: "Lakehouse, streaming, CDC, table formats, quality, governance, AI, mesh." },
    { id: "sql", title: "SQL", desc: "Window functions, advanced patterns, performance and dialects." },
    { id: "python", title: "Python", desc: "The DE coding round, toolkit and algorithm patterns." },
    { id: "data-modeling", title: "Data Modeling", desc: "Grain, dimensional modeling, SCDs, Data Vault, modern modeling." },
    { id: "spark-databricks", title: "Spark", desc: "Internals, shuffles, spill and skew, serialization, tuning, Delta and streaming." },
    { id: "cloud", title: "Cloud Platforms", desc: "Databricks: compute, Delta internals, Unity Catalog, pipelines, jobs, DevOps and security." },
  ];
  const PRACTICE = [
    { id: "system-design", title: "System Design", desc: "Full designs with diagrams, trade-offs and rubrics.", kind: "design" },
    { id: "sql", title: "SQL", desc: "Runnable problems, auto-checked in your browser.", kind: "sql" },
    { id: "python", title: "Python", desc: "Data engineering coding problems with tests, run in your browser.", kind: "python" },
    { id: "algorithms", title: "Algorithms", desc: "Classic DSA problems grouped by pattern, with tests and a step debugger.", kind: "python" },
    { id: "data-modeling", title: "Data Modeling", desc: "Case studies with ERDs and rubrics.", kind: "design" },
    { id: "spark", title: "Spark", desc: "Written PySpark/Delta problems.", kind: "design" },
  ];
  const DIFF_ORDER = { easy: 0, medium: 1, hard: 2 };

  const learnPages = id => PAGES.filter(p => p.meta.section === id && p.meta.type === "learn").sort(byOrder);
  const practicePages = id => PAGES.filter(p => p.meta.section === id && p.meta.type === "practice").sort(byOrder);
  const qaPages = () => PAGES.filter(p => p.meta.type === "qa").sort(byOrder);
  function byOrder(a, b) { return (a.meta.order ?? 999) - (b.meta.order ?? 999) || a.path.localeCompare(b.path); }

  const cardId = (path, q) => Store.hash(path + "::" + q);
  const allCards = () => qaPages().flatMap(p => (p.cards || []).map(c => ({ ...c, deck: p.path, id: cardId(p.path, c.q) })));

  // ------------------------------------------------------------------ helpers
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }
  function pill(text, cls = "") { return `<span class="pill ${cls}">${esc(text)}</span>`; }
  function diffPill(d) { return d ? pill(d, d) : ""; }
  function pct(a, b) { return b ? Math.round((100 * a) / b) : 0; }
  function bar(a, b) { return `<div class="bar"><span style="width:${pct(a, b)}%"></span></div>`; }
  function setTitle(t) { document.title = t ? `${t} · DE Interview Prep` : "DE Interview Prep"; }
  function asList(v) { return Array.isArray(v) ? v : v ? [v] : []; }

  // ------------------------------------------------------------------ icons
  const ICON_PATHS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    "system-design": '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/><path d="m3 17.5 9 5 9-5"/>',
    architecture: '<path d="M3 21h18"/><path d="M5 21V9l7-5 7 5v12"/><path d="M9 21v-6h6v6"/>',
    sql: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    python: '<path d="m8 8-5 4 5 4"/><path d="m16 8 5 4-5 4"/><path d="m13.5 5-3 14"/>',
    algorithms: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8 7.5 10.8 16M16 7.5 13.2 16M8.5 6h7"/>',
    "data-modeling": '<rect x="3" y="3" width="7" height="6" rx="1.2"/><rect x="14" y="3" width="7" height="6" rx="1.2"/><rect x="8.5" y="15" width="7" height="6" rx="1.2"/><path d="M6.5 9v3h11V9M12 12v3"/>',
    "spark-databricks": '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    spark: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    cloud: '<path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 9.5Z"/>',
    playground: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 10 3 2-3 2M13 15h4"/>',
    cards: '<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>',
    qa: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.2-4.4A8 8 0 1 1 21 12Z"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4V14M12 17h.01"/>',
    progress: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    lesson: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z"/><path d="M19 19v2H6"/>',
  };
  const icon = (name, cls = "ico") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON_PATHS[name] || ICON_PATHS.lesson}</svg>`;

  // ------------------------------------------------------------------ navigation
  function renderNav(route) {
    const s = Store.state;
    const due = allCards().filter(c => Store.isDue(c.id)).length;
    const link = (href, label, ico, count) =>
      `<a href="${href}" class="${route === href ? "active" : ""}">${icon(ico)}<span class="label">${esc(label)}</span>${count != null ? `<span class="count">${count}</span>` : ""}</a>`;
    let html = `<div class="nav-group">${link("#/", "Dashboard", "dashboard")}</div>`;
    html += `<div class="nav-group"><div class="nav-title">Learn</div>`;
    LEARN.forEach(t => {
      const ps = learnPages(t.id);
      html += link(`#/learn/${t.id}`, t.title, t.id, `${ps.filter(p => s.read[p.path]).length}/${ps.length}`);
    });
    html += `</div><div class="nav-group"><div class="nav-title">Practice</div>`;
    PRACTICE.forEach(t => {
      const ps = practicePages(t.id);
      html += link(`#/practice/${t.id}`, t.title, t.id, `${ps.filter(p => s.solved[p.path]).length}/${ps.length}`);
    });
    html += `</div><div class="nav-group"><div class="nav-title">Interview</div>`;
    html += link("#/cards", "Flashcards", "cards", due ? `${due} due` : null);
    html += link("#/p/interview-qa/README.md", "Question banks", "qa");
    html += `</div><div class="nav-group"><div class="nav-title">Tools</div>`;
    html += link("#/playground", "Python playground", "playground");
    html += link("#/progress", "Progress", "progress");
    html += `</div>`;
    document.getElementById("nav").innerHTML = html;
  }

  // ------------------------------------------------------------------ command palette (⌘K)
  const KIND = p => p.meta.type === "learn" ? "Lesson" : p.meta.type === "qa" ? "Questions" :
    p.sql ? "SQL problem" : p.python ? (p.meta.section === "algorithms" ? "Algorithm" : "Python problem") :
    p.meta.type === "practice" ? (p.meta.section === "system-design" ? "System design" : "Case study") : "Overview";
  const KIND_ICON = p => p.meta.type === "learn" ? "lesson" : p.meta.type === "qa" ? "qa" : (p.meta.section in ICON_PATHS ? p.meta.section : "lesson");
  const SEARCH_INDEX = PAGES.map(p => ({ p, hay: [p.meta.title, p.meta.description, ...asList(p.meta.topics || p.meta.tags), p.meta.section, p.meta.pattern || ""].join(" ").toLowerCase() }));
  let palSel = 0, palItems = [];
  function paletteSearch(q) {
    q = q.trim().toLowerCase();
    if (!q) return PAGES.filter(p => p.meta.type === "learn" || p.meta.type === "index").slice(0, 12);
    const terms = q.split(/\s+/);
    return SEARCH_INDEX
      .filter(x => terms.every(t => x.hay.includes(t)))
      .map(x => ({ p: x.p, score: (x.p.meta.title.toLowerCase().includes(q) ? 10 : 0) + (x.p.meta.title.toLowerCase().startsWith(terms[0]) ? 5 : 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 30).map(x => x.p);
  }
  function paintPalette() {
    const box = document.getElementById("paletteResults");
    box.innerHTML = palItems.length ? palItems.map((p, i) => `
      <a class="pal-item ${i === palSel ? "sel" : ""}" href="#/p/${p.path}" data-i="${i}">
        ${icon(KIND_ICON(p))}
        <span class="pal-main"><span class="pal-title">${esc(p.meta.title)}</span><span class="pal-desc">${esc(p.meta.description || "")}</span></span>
        <span class="pal-kind">${esc(KIND(p))}</span>
      </a>`).join("") : `<div class="pal-empty">No matches. Try a topic like <b>skew</b>, <b>window</b> or <b>CDC</b>.</div>`;
    const sel = box.querySelector(".sel");
    if (sel) sel.scrollIntoView({ block: "nearest" });
  }
  function openPalette() {
    const pal = document.getElementById("palette"), input = document.getElementById("paletteInput");
    pal.hidden = false; input.value = ""; palSel = 0; palItems = paletteSearch(""); paintPalette();
    setTimeout(() => input.focus(), 0);
  }
  function closePalette() { document.getElementById("palette").hidden = true; }
  document.getElementById("paletteInput").addEventListener("input", e => { palSel = 0; palItems = paletteSearch(e.target.value); paintPalette(); });
  document.getElementById("paletteInput").addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); palSel = Math.min(palSel + 1, palItems.length - 1); paintPalette(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); palSel = Math.max(palSel - 1, 0); paintPalette(); }
    else if (e.key === "Enter" && palItems[palSel]) { window.Analytics && Analytics.track("search", { search_term: e.target.value.trim().slice(0, 60) }); location.hash = `#/p/${palItems[palSel].path}`; closePalette(); }
    else if (e.key === "Escape") closePalette();
  });
  document.getElementById("paletteResults").addEventListener("click", () => {
    window.Analytics && Analytics.track("search", { search_term: document.getElementById("paletteInput").value.trim().slice(0, 60) });
    closePalette();
  });
  document.getElementById("palette").addEventListener("mousedown", e => { if (e.target.id === "palette") closePalette(); });
  document.getElementById("searchOpen").onclick = openPalette;
  document.getElementById("searchOpenMobile").onclick = openPalette;
  document.addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); }
    else if (e.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && !document.activeElement.closest(".CodeMirror")) { e.preventDefault(); openPalette(); }
  });

  // ------------------------------------------------------------------ views
  function ring(pctDone, size = 112, stroke = 10) {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - pctDone / 100);
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="currentColor" stroke-opacity=".18" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
  }

  function viewDashboard() {
    setTitle("");
    const s = Store.state;
    const sql = practicePages("sql"), py = [...practicePages("python"), ...practicePages("algorithms")];
    const designs = [...practicePages("system-design"), ...practicePages("data-modeling"), ...practicePages("spark")];
    const learnAll = LEARN.flatMap(t => learnPages(t.id));
    const allWork = [...learnAll, ...PRACTICE.flatMap(t => practicePages(t.id))];
    const doneWork = allWork.filter(p => s.read[p.path] || s.solved[p.path]).length;
    const overall = pct(doneWork, allWork.length);
    const cards = allCards();
    const due = cards.filter(c => Store.isDue(c.id)).length;
    const nextSql = sql.find(p => !s.solved[p.path]);
    const nextLearn = learnAll.find(p => !s.read[p.path]);
    const nextDesign = practicePages("system-design").find(p => !s.solved[p.path]);
    const nextAlgo = practicePages("algorithms").find(p => !s.solved[p.path]);
    const tile = (ico, n, label) => `<div class="tile">${icon(ico)}<div><div class="tile-n">${n}</div><div class="tile-l">${label}</div></div></div>`;
    const cont = (p, ico, kind) => p ? `<a class="card cont-card" href="#/p/${p.path}"><span class="cont-ico">${icon(ico)}</span>
      <span class="cont-kind">${kind}</span><h3>${esc(p.meta.title)}</h3><p>${esc(p.meta.description || "")}</p><span class="cont-go">Start →</span></a>` : "";
    const counts = { lessons: learnAll.length, problems: sql.length + py.length, designs: designs.length, cards: cards.length };
    $view.innerHTML = `
      <section class="hero">
        <div class="hero-text">
          <span class="eyebrow">Senior data engineering interview prep</span>
          <h1>Prepare like the interview is tomorrow.</h1>
          <p>${counts.lessons} lessons, ${counts.problems} runnable SQL, Python and algorithm problems, ${counts.designs} design case studies with diagrams, and ${counts.cards} spaced-repetition questions. No account needed: progress stays in this browser.</p>
          <div class="hero-cta">
            ${nextLearn ? `<a class="btn primary" href="#/p/${nextLearn.path}">Continue learning</a>` : ""}
            <button class="btn ghost" id="heroSearch" type="button">${icon("lesson")} Search everything <kbd>⌘K</kbd></button>
          </div>
        </div>
        <div class="hero-ring">${ring(overall)}<div class="ring-label"><b>${overall}%</b><span>complete</span></div></div>
      </section>
      <div class="tiles">
        ${tile("progress", Store.streak() + " 🔥", "day streak")}
        ${tile("lesson", `${learnAll.filter(p => s.read[p.path]).length}/${learnAll.length}`, "lessons read")}
        ${tile("sql", `${sql.filter(p => s.solved[p.path]).length}/${sql.length}`, "SQL solved")}
        ${tile("python", `${py.filter(p => s.solved[p.path]).length}/${py.length}`, "Python & algorithms")}
        ${tile("system-design", `${designs.filter(p => s.solved[p.path]).length}/${designs.length}`, "designs reviewed")}
        ${tile("cards", due, "flashcards due")}
      </div>
      <div class="section-head"><h2>Pick up where you left off</h2></div>
      <div class="grid cols-4">
        ${cont(nextLearn, "lesson", "Next lesson")}
        ${cont(nextDesign, "system-design", "System design")}
        ${cont(nextSql, "sql", "SQL problem")}
        ${cont(nextAlgo, "algorithms", "Algorithm")}
      </div>
      <div class="section-head"><h2>Learn</h2><span class="muted">concepts and mental models</span></div>
      <div class="grid cols-3">${LEARN.map(t => trackCard(`#/learn/${t.id}`, t, learnPages(t.id), p => s.read[p.path], "lessons")).join("")}</div>
      <div class="section-head"><h2>Practice</h2><span class="muted">apply it under interview conditions</span></div>
      <div class="grid cols-3">${PRACTICE.map(t => trackCard(`#/practice/${t.id}`, t, practicePages(t.id), p => s.solved[p.path], "problems")).join("")}</div>
      <div class="section-head"><h2>Interview drills</h2></div>
      <div class="grid cols-3">
        <a class="card track-card" href="#/cards"><div class="tc-head">${icon("cards", "ico tc-ico")}<h3>Flashcards</h3></div><p>Leitner spaced repetition across ${cards.length} questions. ${due} due today.</p></a>
        <a class="card track-card" href="#/p/interview-qa/README.md"><div class="tc-head">${icon("qa", "ico tc-ico")}<h3>Question banks</h3></div><p>Rapid-fire banks plus long-form senior deep dives on reliability, operations and architecture.</p></a>
        <a class="card track-card" href="#/playground"><div class="tc-head">${icon("playground", "ico tc-ico")}<h3>Python playground</h3></div><p>A real Python interpreter in your browser with a step-by-step debugger.</p></a>
      </div>
      <div class="section-head"><h2>Suggested 4-week plan</h2></div>
      <div class="plan">
        ${[["Week 1", "Foundations", "System design framework and building blocks; architecture 1–4; SQL window functions; 10 SQL problems; sliding window and two-pointer algorithms."],
           ["Week 2", "Core designs", "Clickstream, CDC, top-K and billing designs out loud; data modeling 1–3; Python for data engineers; 10 SQL + 8 Python problems."],
           ["Week 3", "Depth", "Ads, fraud, inventory, governed lakehouse; Spark shuffle/spill/salting and tuning; Databricks track; senior reliability deep dive."],
           ["Week 4", "Polish", "AI designs; hard SQL, Python and algorithms; resume grilling and behavioral story bank; two timed mock designs; daily flashcards."]]
          .map(([w, t, d]) => `<div class="plan-step"><span class="plan-w">${w}</span><h3>${t}</h3><p>${d}</p></div>`).join("")}
      </div>`;
    document.getElementById("heroSearch").onclick = openPalette;
  }

  function trackCard(href, t, pages, doneFn, noun = "done") {
    const done = pages.filter(doneFn).length;
    return `<a class="card track-card" href="${href}">
      <div class="tc-head">${icon(t.id, "ico tc-ico")}<h3>${esc(t.title)}</h3><span class="tc-count">${pages.length} ${noun}</span></div>
      <p>${esc(t.desc)}</p>${bar(done, pages.length)}<div class="tc-foot"><span>${done}/${pages.length} complete</span><span class="tc-go">Open →</span></div></a>`;
  }

  const readMins = p => Math.max(1, Math.round((p.body || "").split(/\s+/).length / 220));

  function viewLearnTrack(id) {
    const t = LEARN.find(x => x.id === id);
    if (!t) return viewNotFound();
    setTitle(t.title);
    const pages = learnPages(id);
    const index = BY_PATH[`learn/${id}/README.md`];
    const done = pages.filter(p => Store.isRead(p.path)).length;
    $view.innerHTML = `
      <div class="breadcrumb"><a href="#/">Dashboard</a> / Learn</div>
      <div class="track-hero">${icon(id, "ico th-ico")}<div><h1 class="page-title">${esc(t.title)}</h1><p class="page-sub">${esc(t.desc)}</p></div>
        <div class="th-progress"><b>${done}/${pages.length}</b><span>lessons read</span>${bar(done, pages.length)}</div></div>
      <ol class="lessons">${pages.map((p, i) => `
        <li><a class="lesson ${Store.isRead(p.path) ? "read" : ""}" href="#/p/${p.path}">
          <span class="lesson-n">${Store.isRead(p.path) ? "✓" : i + 1}</span>
          <span class="lesson-main"><span class="lesson-title">${esc(p.meta.title)}</span><span class="lesson-desc">${esc(p.meta.description || "")}</span></span>
          <span class="lesson-meta">${readMins(p)} min read</span>
        </a></li>`).join("")}</ol>
      ${index ? `<p class="muted" style="margin-top:18px">Overview: <a href="#/p/${index.path}">${esc(index.meta.title)}</a></p>` : ""}`;
  }

  function viewPracticeTrack(id) {
    const t = PRACTICE.find(x => x.id === id);
    if (!t) return viewNotFound();
    setTitle(t.title + " practice");
    const pages = practicePages(id);
    const topics = [...new Set(pages.flatMap(p => asList(p.meta.topics || p.meta.tags)))].sort();
    $view.innerHTML = `
      <div class="breadcrumb"><a href="#/">Dashboard</a> / Practice</div>
      <h1 class="page-title">${esc(t.title)} practice</h1>
      <p class="page-sub">${esc(t.desc)}</p>
      <div class="filters">
        <input id="q" placeholder="Search title, topic, company…" aria-label="Search">
        <select id="fd" aria-label="Difficulty"><option value="">All difficulties</option><option>easy</option><option>medium</option><option>hard</option></select>
        <select id="ft" aria-label="Topic"><option value="">All topics</option>${topics.map(x => `<option>${esc(x)}</option>`).join("")}</select>
        <select id="fs" aria-label="Status"><option value="">Any status</option><option value="todo">To do</option><option value="done">Done</option></select>
      </div>
      <div class="diff-summary">${["easy", "medium", "hard"].map(d => {
        const ps = pages.filter(p => p.meta.difficulty === d), dn = ps.filter(p => Store.isSolved(p.path)).length;
        return ps.length ? `<div class="ds ${d}"><span class="ds-l">${d}</span><span class="ds-n">${dn}/${ps.length}</span>${bar(dn, ps.length)}</div>` : "";
      }).join("")}</div>
      <table class="list"><thead><tr><th>#</th><th>Problem</th><th>Difficulty</th><th>Topics</th><th>Companies</th></tr></thead><tbody id="rows"></tbody></table>`;
    const draw = () => {
      const q = document.getElementById("q").value.toLowerCase();
      const fd = document.getElementById("fd").value, ft = document.getElementById("ft").value, fs = document.getElementById("fs").value;
      const rows = pages.filter(p => {
        const m = p.meta, tops = asList(m.topics || m.tags);
        const hay = [m.title, m.description, ...tops, ...asList(m.companies)].join(" ").toLowerCase();
        const done = Store.isSolved(p.path);
        return (!q || hay.includes(q)) && (!fd || m.difficulty === fd) && (!ft || tops.includes(ft)) &&
               (!fs || (fs === "done" ? done : !done));
      });
      let lastGroup = null;
      document.getElementById("rows").innerHTML = rows.map((p, i) => {
        const m = p.meta;
        const group = m.pattern && m.pattern !== lastGroup ? `<tr class="group-row"><td colspan="5">${esc(m.pattern)}</td></tr>` : "";
        lastGroup = m.pattern || lastGroup;
        return `${group}<tr>
          <td class="muted">${m.order ?? i + 1}</td>
          <td><div class="pcell"><span class="status-dot ${Store.isSolved(p.path) ? "on" : ""}" title="${Store.isSolved(p.path) ? "Solved" : "Not solved yet"}"></span><a href="#/p/${p.path}">${esc(m.title)}</a></div></td>
          <td>${diffPill(m.difficulty)}</td>
          <td>${asList(m.topics || m.tags).slice(0, 3).map(x => pill(x)).join(" ")}</td>
          <td class="muted">${esc(asList(m.companies).slice(0, 3).join(", "))}</td></tr>`;
      }).join("") || `<tr><td colspan="5" class="muted">No problems match.</td></tr>`;
    };
    ["q", "fd", "ft", "fs"].forEach(id => document.getElementById(id).addEventListener("input", draw));
    draw();
  }

  // ------------------------------------------------------------------ page dispatcher
  function viewPage(path) {
    const page = BY_PATH[path];
    if (!page) return viewNotFound();
    setTitle(page.meta.title);
    const m = page.meta;
    if (page.sql) return viewSql(page);
    if (page.python) return viewPython(page);
    if (m.type === "practice") return viewDesign(page);
    if (m.type === "qa") return viewQaPage(page);
    return viewDoc(page);
  }

  function header(page, extra = "") {
    const m = page.meta;
    const track = m.type === "practice" ? `<a href="#/practice/${m.section}">${esc(m.section)}</a>` :
      m.type === "learn" && LEARN.some(t => t.id === m.section) ? `<a href="#/learn/${m.section}">${esc(m.section)}</a>` : esc(m.section || "");
    const meta = [diffPill(m.difficulty), ...asList(m.topics || m.tags).map(t => pill(t)),
      ...(asList(m.companies).length ? [pill("asked at: " + asList(m.companies).slice(0, 4).join(", "))] : [])].join(" ");
    return `<div class="breadcrumb"><a href="#/">Dashboard</a> / ${track}</div>
      ${meta ? `<div class="page-meta">${meta}</div>` : ""}${extra}`;
  }

  function prevNext(page, list) {
    const i = list.findIndex(p => p.path === page.path);
    if (i < 0) return "";
    const prev = list[i - 1], next = list[i + 1];
    return `<div class="toc-next">
      ${prev ? `<a class="pn prev" href="#/p/${prev.path}"><span>← Previous</span><b>${esc(prev.meta.title)}</b></a>` : "<span></span>"}
      ${next ? `<a class="pn next" href="#/p/${next.path}"><span>Next →</span><b>${esc(next.meta.title)}</b></a>` : "<span></span>"}</div>`;
  }

  // Generic document (learn pages, indexes)
  function viewDoc(page) {
    const isLearn = page.meta.type === "learn";
    $view.innerHTML = `${header(page)}
      <div class="doc-layout">
        <div class="doc-main">
          ${isLearn ? `<div class="page-actions"><span class="read-time">${icon("lesson")} ${readMins(page)} min read</span><button class="btn small" id="readBtn"></button></div>` : ""}
          <article id="doc"></article>
          ${isLearn && LEARN.some(t => t.id === page.meta.section) ? prevNext(page, learnPages(page.meta.section)) : ""}
        </div>
        <aside class="doc-toc" id="toc"></aside>
      </div>`;
    Render.into(document.getElementById("doc"), page.body, page.path);
    buildToc(document.getElementById("doc"), document.getElementById("toc"));
    if (isLearn) {
      const btn = document.getElementById("readBtn");
      const paint = () => { btn.textContent = Store.isRead(page.path) ? "✓ Marked as read" : "Mark as read"; btn.className = Store.isRead(page.path) ? "btn small ok" : "btn small"; };
      btn.addEventListener("click", () => {
        if (Store.isRead(page.path)) Store.unmarkRead(page.path); else { Store.markRead(page.path); window.Analytics && Analytics.track("lesson_read", { lesson: page.path, track: page.meta.section }); }
        paint(); renderNav(location.hash);
      });
      paint();
    }
  }

  function buildToc(article, host) {
    const heads = [...article.querySelectorAll("h2, h3")].filter(h => h.textContent.trim());
    if (heads.length < 3) { host.remove(); return; }
    heads.forEach((h, i) => { if (!h.id) h.id = "s-" + i + "-" + h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40); });
    host.innerHTML = `<div class="toc-title">On this page</div>` + heads.map(h =>
      `<a href="#" data-target="${h.id}" class="${h.tagName === "H3" ? "sub" : ""}">${esc(h.textContent)}</a>`).join("");
    host.querySelectorAll("a").forEach(a => a.addEventListener("click", e => {
      e.preventDefault();
      document.getElementById(a.dataset.target).scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    if ("IntersectionObserver" in window) {
      const links = new Map([...host.querySelectorAll("a")].map(a => [a.dataset.target, a]));
      const obs = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { links.forEach(l => l.classList.remove("on")); const l = links.get(en.target.id); if (l) l.classList.add("on"); } });
      }, { rootMargin: "0px 0px -75% 0px" });
      heads.forEach(h => obs.observe(h));
    }
  }

  // Q&A bank page: full render + flashcard entry
  function viewQaPage(page) {
    const n = (page.cards || []).length;
    $view.innerHTML = `${header(page)}
      <div class="page-actions">
        <a class="btn primary small" href="#/cards/study?decks=${encodeURIComponent(page.path)}">Study ${n} cards as flashcards</a>
        <span class="muted" style="font-size:13px">or click questions below to reveal answers</span>
      </div><article id="doc"></article>`;
    Render.into(document.getElementById("doc"), page.body, page.path);
  }

  // ------------------------------------------------------------------ SQL workbench
  const SQL_HIDDEN = /^(solution|explanation|follow-up questions|dialect notes)$/i;
  const PY_HIDDEN = /^(solution|explanation|follow-up questions)$/i;
  const DROP = /^starter code$/i; // shown in the editor instead

  function splitHidden(body, hiddenRe, stripInfos) {
    const secs = Render.sections(Render.stripFences(body, stripInfos));
    const visible = secs.filter(s => !s.title || (!hiddenRe.test(s.title) && !DROP.test(s.title))).map(s => s.md).join("\n");
    const hidden = secs.filter(s => s.title && hiddenRe.test(s.title)).map(s => s.md).join("\n");
    return { visible, hidden };
  }

  function isDark() { return getComputedStyle(document.documentElement).colorScheme.includes("dark"); }

  function makeEditor(host, value, mode, onChange) {
    if (window.CodeMirror) {
      const cm = CodeMirror(host, {
        value, mode, lineNumbers: true, indentUnit: 4, tabSize: 4, matchBrackets: true,
        theme: isDark() ? "dracula" : "default", viewportMargin: Infinity, extraKeys: { Tab: cm2 => cm2.replaceSelection("    ") },
      });
      cm.on("change", () => onChange(cm.getValue()));
      setTimeout(() => cm.refresh(), 50);
      return { get: () => cm.getValue(), set: v => cm.setValue(v), cm };
    }
    const ta = document.createElement("textarea");
    ta.className = "code-fallback"; ta.value = value; ta.spellcheck = false;
    ta.addEventListener("input", () => onChange(ta.value));
    host.appendChild(ta);
    return { get: () => ta.value, set: v => { ta.value = v; } };
  }

  function resultTable(res, limit = 50) {
    if (!res.columns.length) return `<div class="status info">Statement executed (no result set).</div>`;
    const rows = res.rows.slice(0, limit).map(r => `<tr>${r.map(v => `<td>${v === null ? "<i>NULL</i>" : esc(v)}</td>`).join("")}</tr>`).join("");
    return `<table><thead><tr>${res.columns.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>
      ${res.rows.length > limit ? `<p class="muted">… ${res.rows.length - limit} more rows</p>` : ""}<p class="muted">${res.rows.length} row(s)</p>`;
  }

  function solvedBtnHtml(page) {
    return Store.isSolved(page.path) ? `<span class="pill done">✓ solved</span>` : "";
  }

  function viewSql(page) {
    const { visible, hidden } = splitHidden(page.body, SQL_HIDDEN, ["sql starter"]);
    const draftKey = "code:" + page.path;
    const starter = Store.getNotes(draftKey) || page.sql.starter;
    $view.innerHTML = `${header(page, `<div class="page-actions" id="solvedArea">${solvedBtnHtml(page)}</div>`)}
      <div class="workbench">
        <div class="pane-left"><article id="doc"></article>
          <div class="hidden-sections" id="hiddenBox"><p class="muted">The solution, explanation and follow-ups are hidden. Try it first!</p>
          <button class="btn" id="reveal">Reveal solution</button></div>
          <article id="hidden" style="display:none"></article>
          ${prevNext(page, practicePages("sql"))}
        </div>
        <div class="pane-right">
          <div class="editor-wrap">
            <div class="editor-toolbar">
              <div class="left"><strong>SQL</strong><span class="muted" style="font-size:12px">SQLite · <kbd>Ctrl</kbd>+<kbd>Enter</kbd> run</span></div>
              <div class="right">
                <button class="btn small" id="reset">Reset</button>
                <button class="btn small" id="run">Run</button>
                <button class="btn small primary" id="submit">Submit</button>
              </div>
            </div>
            <div id="editor"></div>
          </div>
          <div class="result" id="result"><div class="status info">Write a query, then Run to see results or Submit to check against the expected output.</div></div>
        </div>
      </div>`;
    Render.into(document.getElementById("doc"), visible, page.path);
    const ed = makeEditor(document.getElementById("editor"), starter, "text/x-sqlite", v => Store.setNotes(draftKey, v));
    const out = document.getElementById("result");
    const run = async check => {
      out.innerHTML = `<div class="status info">Running… (the SQL engine loads on first use)</div>`;
      try {
        const res = await Runners.runSql(page.sql.schema, ed.get());
        Store.markAttempted(page.path);
        if (!check) { out.innerHTML = resultTable(res); window.Analytics && Analytics.track("sql_run", { problem: page.path }); return; }
        const cmp = Runners.compareSql(res, page.sql.expected, page.sql.ordered);
        window.Analytics && Analytics.track("sql_submit", { problem: page.path, result: cmp.ok ? "correct" : "incorrect", difficulty: page.meta.difficulty });
        if (cmp.ok && !Store.isSolved(page.path)) window.Analytics && Analytics.track("problem_solved", { problem: page.path, track: "sql", difficulty: page.meta.difficulty });
        if (cmp.ok) {
          Store.markSolved(page.path);
          document.getElementById("solvedArea").innerHTML = solvedBtnHtml(page);
          renderNav(location.hash);
          out.innerHTML = `<div class="status ok">✓ Correct! ${esc(cmp.note || "")}</div>${resultTable(res)}`;
          toast("Solved: " + page.meta.title);
        } else {
          out.innerHTML = `<div class="status bad">✗ Not quite. ${esc(cmp.reason)}</div>${resultTable(res)}`;
        }
      } catch (e) {
        out.innerHTML = `<div class="status bad">Error</div><pre>${esc(e.message || e)}</pre>`;
        if (check) window.Analytics && Analytics.track("sql_submit", { problem: page.path, result: "error", difficulty: page.meta.difficulty });
      }
    };
    document.getElementById("run").onclick = () => run(false);
    document.getElementById("submit").onclick = () => run(true);
    document.getElementById("reset").onclick = () => { ed.set(page.sql.starter); };
    if (ed.cm) ed.cm.setOption("extraKeys", { "Ctrl-Enter": () => run(false), "Cmd-Enter": () => run(false), Tab: c => c.replaceSelection("    ") });
    document.getElementById("reveal").onclick = () => {
      window.Analytics && Analytics.track("solution_revealed", { problem: page.path });
      const h = document.getElementById("hidden");
      Render.into(h, hidden, page.path); h.style.display = "";
      document.getElementById("hiddenBox").style.display = "none";
    };
  }

  // ------------------------------------------------------------------ Python workbench
  const PY_LOADING = "(the first run downloads Python, ~10 MB, and takes a few seconds)";

  function pyToolbar(extra = "") {
    return `<div class="editor-toolbar">
      <div class="left"><strong>Python</strong><span class="muted" style="font-size:12px">CPython in your browser</span></div>
      <div class="right">${extra}
        <button class="btn small" id="run" title="Run your code and show print() output">Run</button>
        <button class="btn small" id="debug" title="Step through line by line and watch variables">Debug</button>
      </div></div>`;
  }

  function stdoutBlock(text) {
    return text ? `<div class="out-title">Output</div><pre class="out">${esc(text)}</pre>` : "";
  }

  function testResultsHtml(r) {
    if (r.error) {
      return `<div class="status bad">✗ Your code raised an error before the tests could run</div><pre class="err">${esc(r.error)}</pre>${stdoutBlock(r.stdout)}`;
    }
    const res = r.results;
    const failed = res.filter(t => !t.ok);
    const num = new Map(res.map((t, i) => [t, i + 1]));
    const head = failed.length
      ? `<div class="status bad">✗ ${failed.length} of ${res.length} test${res.length === 1 ? "" : "s"} failed</div>`
      : `<div class="status ok">✓ All ${res.length} tests passed</div>`;
    const failHtml = failed.map(t => `
      <div class="test bad">
        <div class="test-head"><span>✗ Test ${num.get(t)}</span>
          <button class="btn tiny" data-debug="${t.node}" title="Replay this test line by line">Step through</button></div>
        <pre class="test-src">${esc(t.src)}</pre>
        ${t.error ? `<pre class="err">${esc(t.error)}</pre>` : `
          ${t.call ? `<div class="kv-label">Call</div><pre class="kv">${esc(t.call)}</pre>` : ""}
          <div class="kv-label">Your result</div><pre class="kv got">${esc(t.got)}</pre>
          ${t.expected != null ? `<div class="kv-label">Expected${t.op && t.op !== "==" ? ` (${esc(t.op)})` : ""}</div><pre class="kv exp">${esc(t.expected)}</pre>` : ""}
          ${t.message ? `<div class="hint">${esc(t.message)}</div>` : ""}
          ${t.hint ? `<div class="hint">💡 ${esc(t.hint)}</div>` : ""}`}
      </div>`).join("");
    const passHtml = res.filter(t => t.ok).map(t =>
      `<div class="test ok"><span>✓ Test ${num.get(t)}</span><code>${esc(t.src.split("\n")[0].replace(/^assert\s+/, "").slice(0, 110))}</code></div>`).join("");
    return head + failHtml + passHtml + stdoutBlock(r.stdout);
  }

  /** Line-by-line replay of a trace produced by Runners.tracePython. */
  function showDebugger(host, code, tr) {
    const lines = code.replace(/\n$/, "").split("\n");
    const hl = l => (window.hljs ? hljs.highlight(l, { language: "python", ignoreIllegals: true }).value : esc(l));
    const codeHtml = lines.map((l, i) => `<div class="dbg-line" data-line="${i + 1}"><span class="ln">${i + 1}</span><span class="src">${hl(l) || " "}</span></div>`).join("");
    const steps = tr.steps;
    if (!steps.length) {
      host.innerHTML = `<div class="status info">Nothing to step through: no lines ran.</div>${tr.error ? `<pre class="err">${esc(tr.error)}</pre>` : ""}`;
      return;
    }
    host.innerHTML = `<div class="debugger" tabindex="0">
      <div class="dbg-toolbar">
        <button class="btn tiny" data-go="first" title="First step">⏮</button>
        <button class="btn tiny" data-go="prev" title="Previous step (←)">◀ Back</button>
        <button class="btn tiny primary" data-go="next" title="Next step (→)">Step ▶</button>
        <button class="btn tiny" data-go="last" title="Last step">⏭</button>
        <input type="range" min="0" max="${steps.length - 1}" value="0" aria-label="Step">
        <span class="dbg-count"></span>
      </div>
      ${tr.truncated ? `<div class="status info">Stopped after ${steps.length} steps (possible infinite loop). Showing the first ${steps.length}.</div>` : ""}
      <div class="dbg-grid">
        <div class="dbg-code">${codeHtml}</div>
        <div class="dbg-side">
          <div class="dbg-event"></div>
          <div class="out-title">Call stack</div><div class="dbg-stack"></div>
          <div class="out-title">Variables</div><div class="dbg-vars"></div>
          <div class="out-title">Output so far</div><pre class="out dbg-out"></pre>
        </div>
      </div>
      ${tr.error ? `<div class="out-title">Error at the end of the run</div><pre class="err">${esc(tr.error)}</pre>` : ""}
    </div>`;
    const $ = sel => host.querySelector(sel);
    const range = $("input[type=range]");
    let i = 0;
    const show = n => {
      i = Math.max(0, Math.min(steps.length - 1, n));
      const st = steps[i];
      const prev = steps.slice(0, i).reverse().find(p => p.stack.join(">") === st.stack.join(">"));
      range.value = i;
      $(".dbg-count").textContent = `Step ${i + 1} / ${steps.length}`;
      host.querySelectorAll(".dbg-line").forEach(el => el.classList.toggle("current", +el.dataset.line === st.line));
      const cur = host.querySelector(`.dbg-line[data-line="${st.line}"]`);
      if (cur) {
        const box = $(".dbg-code");
        if (cur.offsetTop < box.scrollTop || cur.offsetTop > box.scrollTop + box.clientHeight - 30) box.scrollTop = cur.offsetTop - 60;
      }
      const what = st.event === "return" ? `<span class="ret">↩ ${esc(st.stack[st.stack.length - 1])}() returns <code>${esc(st.ret)}</code></span>`
        : st.event === "exception" ? `<span class="exc">⚠ ${esc(st.exc)}</span>`
        : `About to run line ${st.line}`;
      $(".dbg-event").innerHTML = what;
      $(".dbg-stack").innerHTML = st.stack.map(f => `<span class="pill">${esc(f)}</span>`).join(" → ");
      const names = Object.keys(st.locals);
      $(".dbg-vars").innerHTML = names.length
        ? `<table>${names.map(k => {
            const changed = prev ? prev.locals[k] !== st.locals[k] : false;
            return `<tr class="${changed ? "changed" : ""}"><td>${esc(k)}</td><td><code>${esc(st.locals[k])}</code></td></tr>`;
          }).join("")}</table>`
        : `<p class="muted">No local variables yet.</p>`;
      $(".dbg-out").textContent = tr.stdout.slice(0, st.out) || "(nothing printed yet)";
    };
    host.querySelectorAll("[data-go]").forEach(b => {
      b.onclick = () => show({ first: 0, prev: i - 1, next: i + 1, last: steps.length - 1 }[b.dataset.go]);
    });
    range.oninput = () => show(+range.value);
    $(".debugger").addEventListener("keydown", e => {
      if (e.key === "ArrowRight") { e.preventDefault(); show(i + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); show(i - 1); }
    });
    show(0);
    $(".debugger").focus({ preventScroll: true });
  }

  async function debugInto(host, code, label) {
    host.innerHTML = `<div class="status info">Tracing your code ${PY_LOADING}…</div>`;
    try {
      const tr = await Runners.tracePython(code);
      showDebugger(host, code, tr);
      if (label) host.insertAdjacentHTML("afterbegin", `<div class="dbg-label">${label}</div>`);
    } catch (e) {
      host.innerHTML = `<div class="status bad">Could not run the debugger</div><pre class="err">${esc(e.message || e)}</pre>`;
    }
  }

  function viewPython(page) {
    const { visible, hidden } = splitHidden(page.body, PY_HIDDEN, ["python starter"]);
    const draftKey = "code:" + page.path;
    const starter = Store.getNotes(draftKey) || page.python.starter;
    $view.innerHTML = `${header(page, `<div class="page-actions" id="solvedArea">${solvedBtnHtml(page)}</div>`)}
      <div class="workbench">
        <div class="pane-left"><article id="doc"></article>
          <div class="hidden-sections" id="hiddenBox"><p class="muted">The reference solution and explanation are hidden.</p>
          <button class="btn" id="reveal">Reveal solution</button></div>
          <article id="hidden" style="display:none"></article>
          ${prevNext(page, practicePages(page.meta.section))}
        </div>
        <div class="pane-right">
          <div class="editor-wrap">
            ${pyToolbar(`<button class="btn small" id="reset" title="Restore the starter code">Reset</button>`)}
            <div id="editor"></div>
            <div class="editor-foot"><button class="btn small primary" id="test">Run tests</button>
              <span class="muted">Tip: add <code>print(...)</code> calls and press Run, or Debug to step through a test.</span></div>
          </div>
          <div class="result" id="result"><div class="status info">Implement the function, then Run tests ${PY_LOADING}.</div></div>
          <div class="result" id="dbg"></div>
        </div>
      </div>`;
    Render.into(document.getElementById("doc"), visible, page.path);
    const ed = makeEditor(document.getElementById("editor"), starter, "python", v => Store.setNotes(draftKey, v));
    const out = document.getElementById("result");
    const dbg = document.getElementById("dbg");
    let lastFailing = null;

    const debugTest = async node => {
      window.Analytics && Analytics.track("python_debug", { problem: page.path });
      dbg.innerHTML = `<div class="status info">Preparing the test ${PY_LOADING}…</div>`;
      const script = await Runners.debugScript(ed.get(), page.python.tests, node);
      await debugInto(dbg, script, `Replaying a test: your code, then the test's setup and call (the value ends up in <code>result</code>).`);
      dbg.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    document.getElementById("test").onclick = async () => {
      out.innerHTML = `<div class="status info">Running tests ${PY_LOADING}…</div>`;
      dbg.innerHTML = "";
      try {
        const r = await Runners.runPythonTests(ed.get(), page.python.tests);
        Store.markAttempted(page.path);
        const allOk = !r.error && r.results.every(t => t.ok);
        lastFailing = r.error ? null : (r.results.find(t => !t.ok) || {}).node ?? null;
        window.Analytics && Analytics.track("python_tests_run", { problem: page.path, track: page.meta.section, result: allOk ? "passed" : r.error ? "error" : "failed",
          passed: r.error ? 0 : r.results.filter(t => t.ok).length, total: r.error ? 0 : r.results.length });
        if (allOk && !Store.isSolved(page.path)) window.Analytics && Analytics.track("problem_solved", { problem: page.path, track: page.meta.section, difficulty: page.meta.difficulty });
        if (allOk) {
          Store.markSolved(page.path);
          document.getElementById("solvedArea").innerHTML = solvedBtnHtml(page);
          renderNav(location.hash);
          toast("All tests passed: " + page.meta.title);
        }
        out.innerHTML = testResultsHtml(r);
        out.querySelectorAll("[data-debug]").forEach(b => { b.onclick = () => debugTest(+b.dataset.debug); });
      } catch (e) {
        out.innerHTML = `<div class="status bad">Could not run Python</div><pre class="err">${esc(e.message || e)}</pre>`;
      }
    };
    document.getElementById("run").onclick = async () => {
      out.innerHTML = `<div class="status info">Running ${PY_LOADING}…</div>`;
      dbg.innerHTML = "";
      try {
        const r = await Runners.runPython(ed.get());
        out.innerHTML = r.ok
          ? `<div class="status ok">✓ Ran without errors</div>${stdoutBlock(r.stdout) || `<p class="muted">No output. Add <code>print(top_level_call(...))</code> to see values, or press Run tests.</p>`}`
          : `<div class="status bad">✗ Error</div><pre class="err">${esc(r.error)}</pre>${stdoutBlock(r.stdout)}`;
      } catch (e) {
        out.innerHTML = `<div class="status bad">Could not run Python</div><pre class="err">${esc(e.message || e)}</pre>`;
      }
    };
    // Debug replays the first failing test (or test 1 before any run)
    document.getElementById("debug").onclick = async () => {
      let node = lastFailing;
      if (node == null) {
        try {
          const r = await Runners.runPythonTests(ed.get(), page.python.tests);
          node = r.error ? null : ((r.results.find(t => !t.ok) || r.results[0]) || {}).node;
        } catch (e) { node = null; }
      }
      if (node == null) return debugInto(dbg, ed.get(), "Stepping through your code.");
      debugTest(node);
    };
    document.getElementById("reset").onclick = () => ed.set(page.python.starter);
    document.getElementById("reveal").onclick = () => {
      window.Analytics && Analytics.track("solution_revealed", { problem: page.path });
      const h = document.getElementById("hidden");
      Render.into(h, hidden, page.path); h.style.display = "";
      document.getElementById("hiddenBox").style.display = "none";
    };
  }

  // ------------------------------------------------------------------ Python playground
  const PLAYGROUND_SAMPLE = `# Python playground: try anything, then Run, or Debug to step through line by line.
from collections import Counter

def top_k(words, k):
    counts = Counter(w.lower() for w in words)
    return sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:k]

print(top_k(["Spark", "kafka", "spark", "Delta", "KAFKA", "spark"], 2))
`;

  function viewPlayground() {
    setTitle("Python playground");
    const key = "code:playground";
    $view.innerHTML = `<div class="breadcrumb"><a href="#/practice/python">Python</a> / Playground</div>
      <h1 class="page-title">Python playground</h1>
      <p class="muted">A scratchpad with a real Python interpreter running in your browser. <strong>Run</strong> shows printed output; <strong>Debug</strong> replays your program line by line with the call stack and every variable. Your code is saved in this browser.</p>
      <div class="playground">
        <div class="editor-wrap">
          ${pyToolbar(`<button class="btn small" id="reset" title="Restore the sample">Sample</button>`)}
          <div id="editor"></div>
        </div>
        <div class="result" id="result"><div class="status info">Press Run or Debug ${PY_LOADING}.</div></div>
      </div>`;
    const ed = makeEditor(document.getElementById("editor"), Store.getNotes(key) || PLAYGROUND_SAMPLE, "python", v => Store.setNotes(key, v));
    const out = document.getElementById("result");
    document.getElementById("run").onclick = async () => {
      out.innerHTML = `<div class="status info">Running ${PY_LOADING}…</div>`;
      try {
        const r = await Runners.runPython(ed.get());
        out.innerHTML = r.ok
          ? `<div class="status ok">✓ Ran without errors</div>${stdoutBlock(r.stdout) || `<p class="muted">No output. Use <code>print()</code> to see values.</p>`}`
          : `<div class="status bad">✗ Error</div><pre class="err">${esc(r.error)}</pre>${stdoutBlock(r.stdout)}`;
      } catch (e) {
        out.innerHTML = `<div class="status bad">Could not run Python</div><pre class="err">${esc(e.message || e)}</pre>`;
      }
    };
    document.getElementById("debug").onclick = () => { window.Analytics && Analytics.track("playground_debug"); debugInto(out, ed.get()); };
    document.getElementById("reset").onclick = () => ed.set(PLAYGROUND_SAMPLE);
  }

  // ------------------------------------------------------------------ design practice (system design, modeling, spark)
  const PROMPT_SECTIONS = /^(problem|prompt|business questions|problem statement|requirements|context|hints?|requirements to clarify|setup|constraints|scenario|evidence|given|symptoms|the data|your task)\b/i;
  const RUBRIC_SECTIONS = /rubric/i;

  function viewDesign(page) {
    const secs = Render.sections(page.body);
    // practice mode shows the preamble + leading prompt sections; everything after is the reference answer
    let cut = secs.length;
    for (let i = 1; i < secs.length; i++) { if (!PROMPT_SECTIONS.test(secs[i].title)) { cut = i; break; } }
    const promptMd = secs.slice(0, cut).map(s => s.md).join("\n");
    const answerMd = secs.slice(cut).map(s => s.md).join("\n");
    const minutes = page.meta.time_minutes || 45;
    const notesKey = "notes:" + page.path;
    $view.innerHTML = `${header(page)}
      <div class="page-actions">
        <button class="btn small" id="timerBtn">Start ${minutes}-min timer</button>
        <span class="timer" id="timer">${minutes}:00</span>
        <button class="btn small" id="readMode">Show everything</button>
        <span id="doneArea">${Store.isSolved(page.path) ? pill("✓ reviewed", "done") : ""}</span>
      </div>
      <article id="prompt"></article>
      <div class="card" style="margin:18px 0">
        <strong>Your design notes</strong> <span class="muted" style="font-size:13px">(saved in this browser) Requirements, estimates, components, data model, trade-offs…</span>
        <textarea class="notes" id="notes" placeholder="1. Clarifying questions…&#10;2. Estimates…&#10;3. High-level design…">${esc(Store.getNotes(notesKey))}</textarea>
      </div>
      <div class="hidden-sections" id="hiddenBox"><p class="muted">The reference answer is hidden so you can practise first.</p>
        <button class="btn primary" id="reveal">Reveal reference answer</button></div>
      <article id="answer" style="display:none"></article>
      <div id="score"></div>
      ${prevNext(page, practicePages(page.meta.section))}`;
    Render.into(document.getElementById("prompt"), promptMd, page.path);
    document.getElementById("notes").addEventListener("input", e => Store.setNotes(notesKey, e.target.value));

    const reveal = () => {
      const a = document.getElementById("answer");
      if (a.style.display !== "none") return;
      Render.into(a, answerMd, page.path);
      a.style.display = "";
      document.getElementById("hiddenBox").style.display = "none";
      wireRubric(page, a);
      Store.markAttempted(page.path);
    };
    document.getElementById("reveal").onclick = () => { window.Analytics && Analytics.track("solution_revealed", { problem: page.path }); reveal(); };
    document.getElementById("readMode").onclick = reveal;

    // timer
    let left = minutes * 60, handle = null;
    const tEl = document.getElementById("timer"), tBtn = document.getElementById("timerBtn");
    const paint = () => { tEl.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; tEl.style.color = left < 300 ? "var(--bad)" : ""; };
    tBtn.onclick = () => {
      if (handle) { clearInterval(handle); handle = null; tBtn.textContent = "Resume timer"; return; }
      tBtn.textContent = "Pause timer";
      handle = setInterval(() => { left = Math.max(0, left - 1); paint(); if (!left) { clearInterval(handle); handle = null; toast("Time's up. Compare with the reference answer."); } }, 1000);
    };
    window.addEventListener("hashchange", () => handle && clearInterval(handle), { once: true });
  }

  function wireRubric(page, root) {
    // find checkboxes inside the rubric section (task list items rendered by marked)
    const heads = [...root.querySelectorAll("h2")].filter(h => RUBRIC_SECTIONS.test(h.textContent));
    if (!heads.length) return;
    const boxes = [];
    let n = heads[0].nextElementSibling;
    while (n && n.tagName !== "H2") { boxes.push(...n.querySelectorAll('input[type="checkbox"]')); n = n.nextElementSibling; }
    if (!boxes.length) return;
    const saved = Store.getRubric(page.path);
    const scoreEl = document.getElementById("score");
    const update = () => {
      const vals = boxes.map(b => b.checked);
      Store.setRubric(page.path, vals);
      const got = vals.filter(Boolean).length;
      const p = pct(got, boxes.length);
      if (p >= 70 && !Store.isSolved(page.path)) window.Analytics && Analytics.track("problem_solved", { problem: page.path, track: page.meta.section, difficulty: page.meta.difficulty });
      if (p >= 70) { Store.markSolved(page.path); document.getElementById("doneArea").innerHTML = pill("✓ reviewed", "done"); renderNav(location.hash); }
      scoreEl.innerHTML = `<div class="card" style="margin-top:12px"><strong>Rubric score: ${got}/${boxes.length} (${p}%)</strong>
        ${bar(got, boxes.length)}<p class="muted" style="margin:8px 0 0;font-size:13px">${p >= 70 ? "Solid. Revisit in a week to keep it fresh." : "Below 70%: redo this design in a few days (spaced repetition works for design too)."}</p></div>`;
    };
    boxes.forEach((b, i) => { b.disabled = false; b.checked = !!saved[i]; b.addEventListener("change", update); });
    if (saved.length) update();
  }

  // ------------------------------------------------------------------ flashcards
  function viewDecks() {
    setTitle("Flashcards");
    const decks = qaPages().filter(p => (p.cards || []).length);
    const cards = allCards();
    const counts = Store.boxCounts(cards.map(c => c.id));
    const due = cards.filter(c => Store.isDue(c.id)).length;
    $view.innerHTML = `
      <div class="breadcrumb"><a href="#/">Dashboard</a> / Flashcards</div>
      <h1 class="page-title">Flashcards</h1>
      <p class="page-sub">Leitner spaced repetition: rate each answer honestly. "Again" sends a card back to box 1; good answers move it up and it returns later (1 → 3 → 7 → 14 → 30 days).</p>
      <div class="card" style="margin-bottom:18px">
        <div class="boxes">
          <div class="box"><b>${counts[0]}</b><span>new</span></div>
          ${[1, 2, 3, 4, 5].map(b => `<div class="box"><b>${counts[b]}</b><span>box ${b}</span></div>`).join("")}
        </div>
      </div>
      <div class="section-head"><h2>Choose decks</h2><span class="muted">${due} cards due across all decks</span></div>
      <div class="deck-list">${decks.map(d => {
        const ids = d.cards.map(c => cardId(d.path, c.q));
        const dd = ids.filter(id => Store.isDue(id)).length;
        return `<label class="card deck"><input type="checkbox" value="${esc(d.path)}" checked>
          <span><b>${esc(d.meta.title)}</b><br><span class="muted" style="font-size:13px">${d.cards.length} cards · ${dd} due</span></span></label>`;
      }).join("")}</div>
      <div class="page-actions" style="margin-top:18px">
        <button class="btn primary" id="start">Start review (due cards)</button>
        <button class="btn" id="cram">Cram all selected</button>
      </div>`;
    const selected = () => [...$view.querySelectorAll(".deck input:checked")].map(i => i.value);
    document.getElementById("start").onclick = () => { location.hash = `#/cards/study?decks=${encodeURIComponent(selected().join(","))}`; };
    document.getElementById("cram").onclick = () => { location.hash = `#/cards/study?all=1&decks=${encodeURIComponent(selected().join(","))}`; };
  }

  function viewStudy(params) {
    setTitle("Study");
    const decks = (params.get("decks") || "").split(",").filter(Boolean);
    const all = params.get("all") === "1";
    let queue = allCards().filter(c => decks.includes(c.deck) && (all || Store.isDue(c.id)));
    queue = queue.sort(() => Math.random() - 0.5).slice(0, 40);
    let i = 0, shown = false, stats = { again: 0, ok: 0 };
    const draw = () => {
      if (i >= queue.length) {
        $view.innerHTML = `<div class="flashcard card" style="text-align:center">
          <h2>${queue.length ? "Session complete 🎉" : "Nothing due right now"}</h2>
          <p class="muted">${queue.length ? `${stats.ok} remembered · ${stats.again} to relearn` : "All cards in these decks are scheduled for later. Use “Cram” to review anyway."}</p>
          <div class="page-actions" style="justify-content:center"><a class="btn primary" href="#/cards">Back to decks</a></div></div>`;
        renderNav(location.hash);
        return;
      }
      const c = queue[i], deck = BY_PATH[c.deck], box = (Store.card(c.id) || {}).box || 0;
      $view.innerHTML = `
        <div class="breadcrumb"><a href="#/cards">Flashcards</a> / ${esc(deck.meta.title)}${c.section ? " / " + esc(c.section) : ""}</div>
        <div class="flashcard">
          ${bar(i, queue.length)}<p class="muted" style="font-size:13px">Card ${i + 1} of ${queue.length} · ${box ? "box " + box : "new"}</p>
          <div class="card">
            <div class="q">${esc(c.q)}</div>
            <div id="ans" class="a md" style="display:${shown ? "" : "none"}"></div>
            ${shown ? `<div class="rate">
                <button class="btn" data-g="0">Again <kbd>1</kbd></button>
                <button class="btn" data-g="1">Hard <kbd>2</kbd></button>
                <button class="btn primary" data-g="2">Good <kbd>3</kbd></button>
                <button class="btn ok" data-g="3">Easy <kbd>4</kbd></button></div>`
              : `<div class="rate"><button class="btn primary" id="show">Show answer <kbd>Space</kbd></button></div>`}
          </div>
          <p class="muted" style="font-size:13px;text-align:center">Say your answer out loud before revealing. That's what the interview feels like.</p>
        </div>`;
      if (shown) Render.into(document.getElementById("ans"), c.a, c.deck);
      const btnShow = document.getElementById("show");
      if (btnShow) btnShow.onclick = () => { shown = true; draw(); };
      $view.querySelectorAll("[data-g]").forEach(b => b.onclick = () => rate(+b.dataset.g));
    };
    const rate = g => {
      const c = queue[i];
      Store.rateCard(c.id, g);
      window.Analytics && Analytics.track("flashcard_review", { deck: c.deck, rating: ["again", "hard", "good", "easy"][g] || String(g) });
      if (g === 0) { stats.again++; queue.push(c); } else stats.ok++;
      i++; shown = false; draw();
    };
    const onKey = e => {
      if (!location.hash.startsWith("#/cards/study")) { document.removeEventListener("keydown", onKey); return; }
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
      if (!shown && (e.code === "Space" || e.key === "Enter")) { e.preventDefault(); shown = true; draw(); }
      else if (shown && ["1", "2", "3", "4"].includes(e.key)) rate(+e.key - 1);
    };
    document.addEventListener("keydown", onKey);
    draw();
  }

  // ------------------------------------------------------------------ progress
  function viewProgress() {
    setTitle("Progress");
    const s = Store.state;
    const rows = [
      ...LEARN.map(t => ({ name: "Learn · " + t.title, pages: learnPages(t.id), done: p => s.read[p.path] })),
      ...PRACTICE.map(t => ({ name: "Practice · " + t.title, pages: practicePages(t.id), done: p => s.solved[p.path] })),
    ];
    const cards = allCards();
    const counts = Store.boxCounts(cards.map(c => c.id));
    $view.innerHTML = `
      <div class="breadcrumb"><a href="#/">Dashboard</a> / Progress</div>
      <h1 class="page-title">Progress</h1>
      <p class="page-sub">Stored only in this browser (localStorage); nothing is sent to a server. Export it to back up or move between devices; clearing site data erases it.</p>
      <table class="list"><thead><tr><th>Track</th><th>Done</th><th style="width:40%">Progress</th></tr></thead><tbody>
        ${rows.map(r => { const d = r.pages.filter(r.done).length; return `<tr><td>${esc(r.name)}</td><td>${d}/${r.pages.length}</td><td>${bar(d, r.pages.length)}</td></tr>`; }).join("")}
      </tbody></table>
      <div class="section-head"><h2>Flashcards</h2><span class="muted">${cards.length} cards · mastered (box 5): ${counts[5]}</span></div>
      <div class="card"><div class="boxes"><div class="box"><b>${counts[0]}</b><span>new</span></div>
        ${[1, 2, 3, 4, 5].map(b => `<div class="box"><b>${counts[b]}</b><span>box ${b}</span></div>`).join("")}</div></div>
      <div class="section-head"><h2>Backup</h2></div>
      <div class="page-actions">
        <button class="btn" id="exp">Export progress</button>
        <label class="btn">Import progress<input type="file" id="imp" accept="application/json" hidden></label>
        <button class="btn" id="rst">Reset all progress</button>
      </div>`;
    document.getElementById("exp").onclick = () => {
      const blob = new Blob([Store.export()], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "de-interview-progress.json"; a.click();
    };
    document.getElementById("imp").onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => { try { Store.import(t); toast("Progress imported"); route(); } catch (err) { toast("Invalid file"); } });
    };
    document.getElementById("rst").onclick = () => { if (confirm("Reset all progress in this browser?")) { Store.reset(); route(); } };
  }

  function viewNotFound() {
    setTitle("Not found");
    $view.innerHTML = `<h1 class="page-title">Page not found</h1><p><a href="#/">Back to dashboard</a></p>`;
  }

  // ------------------------------------------------------------------ router
  function route() {
    const hash = location.hash || "#/";
    const [pathPart, query] = hash.slice(1).split("?");
    const params = new URLSearchParams(query || "");
    renderNav("#" + pathPart);
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("scrim").classList.remove("on");
    closePalette();
    window.scrollTo(0, 0);
    if (pathPart === "/" || pathPart === "") return viewDashboard();
    if (pathPart.startsWith("/learn/")) return viewLearnTrack(pathPart.slice(7));
    if (pathPart.startsWith("/practice/")) return viewPracticeTrack(pathPart.slice(10));
    if (pathPart.startsWith("/p/")) return viewPage(decodeURIComponent(pathPart.slice(3)));
    if (pathPart === "/cards") return viewDecks();
    if (pathPart === "/cards/study") return viewStudy(params);
    if (pathPart === "/progress") return viewProgress();
    if (pathPart === "/playground") return viewPlayground();
    viewNotFound();
  }

  // ------------------------------------------------------------------ theme + boot
  const THEMES = ["auto", "dark", "light"];
  function applyTheme(t) {
    if (t === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
    document.getElementById("themeToggle").textContent = "Theme: " + t;
  }
  let theme = "auto";
  try { theme = localStorage.getItem("dep_theme") || "auto"; } catch (e) { /* ignore */ }
  applyTheme(theme);
  document.getElementById("themeToggle").onclick = () => {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    try { localStorage.setItem("dep_theme", theme); } catch (e) { /* ignore */ }
    applyTheme(theme);
  };
  const toggleMenu = open => { document.getElementById("sidebar").classList.toggle("open", open); document.getElementById("scrim").classList.toggle("on", open); };
  document.getElementById("menuToggle").onclick = () => toggleMenu(!document.getElementById("sidebar").classList.contains("open"));
  document.getElementById("scrim").onclick = () => toggleMenu(false);

  const navigate = () => { route(); if (window.Analytics) Analytics.page(); };
  window.addEventListener("hashchange", navigate);
  if (!PAGES.length) {
    $view.innerHTML = `<h1 class="page-title">Content bundle missing</h1><p>Run <code>python3 scripts/build.py</code> to generate <code>platform/data/content.js</code>.</p>`;
  } else {
    navigate();
  }
})();
