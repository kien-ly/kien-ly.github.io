/* Privacy-respecting usage analytics (Google Analytics 4), strictly opt-in.
 * - Inactive unless APP_CONFIG.gaMeasurementId is set (config.js).
 * - Loads nothing and sends nothing until the visitor accepts; shares the consent choice
 *   with the host website via the same localStorage key, so one answer covers both.
 * - Events carry page paths and outcomes only: never code, answers or personal data. */
(function () {
  const cfg = window.APP_CONFIG || {};
  const ID = cfg.gaMeasurementId;
  const KEY = cfg.consentKey || "cookie-consent";
  let loaded = false;
  let pending = [];                       // events held until the visitor decides (bounded)

  const consent = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const setConsent = v => { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ } };

  function load() {
    if (!ID || loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", ID, { send_page_view: false });   // the app reports its own virtual pages
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ID);
    document.head.appendChild(s);
    pending.forEach(args => window.gtag.apply(null, args));
    pending = [];
  }

  function send(...args) {
    if (!ID) return;
    const c = consent();
    if (c === "accepted") { load(); window.gtag.apply(null, args); }
    else if (c === null && pending.length < 50) pending.push(args);   // undecided: hold, never send
  }

  /** Virtual page view for the hash route, e.g. #/p/practice/sql/x.md → /interview-prep/app/p/practice/sql/x.md */
  function page() {
    const route = (location.hash || "#/").slice(1).split("?")[0].replace(/^\//, "");
    const base = location.pathname.replace(/index\.html$/, "");
    send("event", "page_view", {
      page_title: document.title,
      page_location: location.origin + base + route,
      page_path: base + route,
    });
  }

  function track(name, params) { send("event", name, params || {}); }

  function banner() {
    if (!ID || consent() !== null) return;
    const el = document.createElement("div");
    el.className = "consent-bar";
    el.innerHTML = `<p>We use cookies (Google Analytics) to understand how the app is used, for example which problems are attempted and solved.
      Your code and answers are never sent. ${cfg.cookiePolicyUrl ? `<a href="${cfg.cookiePolicyUrl}">Learn more</a>.` : ""}</p>
      <div><button class="btn small" data-c="rejected" type="button">Reject</button>
      <button class="btn small primary" data-c="accepted" type="button">Accept</button></div>`;
    el.addEventListener("click", e => {
      const v = e.target.closest("[data-c]")?.dataset.c;
      if (!v) return;
      setConsent(v);
      el.remove();
      if (v === "accepted") load(); else pending = [];
    });
    document.body.appendChild(el);
  }

  // A choice made on the website in another tab applies here too.
  window.addEventListener("storage", e => {
    if (e.key !== KEY) return;
    document.querySelector(".consent-bar")?.remove();
    if (e.newValue === "accepted") load(); else pending = [];
  });

  if (consent() === "accepted") load();
  document.addEventListener("DOMContentLoaded", banner);
  window.Analytics = { page, track, enabled: !!ID };
})();
