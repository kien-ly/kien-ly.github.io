/* Markdown rendering: marked + DOMPurify + highlight.js + mermaid, with repo-relative
 * links rewritten to in-app routes and images pointed at the repository files. */
(function () {
  const PAGES = new Set((window.CONTENT && window.CONTENT.pages || []).map(p => p.path));

  function dirOf(path) { return path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : ""; }

  function resolve(base, rel) {
    const parts = (dirOf(base) + rel).split("/");
    const out = [];
    for (const p of parts) {
      if (p === "..") out.pop();
      else if (p !== "." && p !== "") out.push(p);
    }
    return out.join("/") + (rel.endsWith("/") ? "/" : "");
  }

  function routeFor(path) {
    let p = path.replace(/\/$/, "");
    if (PAGES.has(p)) return "#/p/" + p;
    if (PAGES.has(p + "/README.md")) return "#/p/" + p + "/README.md";
    if (p === "platform" || p.startsWith("platform/")) return "#/";
    return null;
  }

  let mermaidReady = false;
  function initMermaid() {
    if (mermaidReady || !window.mermaid) return;
    window.mermaid.initialize({
      startOnLoad: false, securityLevel: "strict", theme: "base",
      flowchart: { htmlLabels: true, curve: "basis", padding: 12 },
      themeVariables: {
        fontFamily: "Inter, -apple-system, Segoe UI, Helvetica, Arial, sans-serif", fontSize: "14px",
        primaryColor: "#eef0ff", primaryBorderColor: "#6366f1", primaryTextColor: "#1e1b4b",
        secondaryColor: "#ecfdf5", secondaryBorderColor: "#10b981", tertiaryColor: "#f8fafc",
        lineColor: "#64748b", clusterBkg: "#f8fafc", clusterBorder: "#cbd5e1",
        edgeLabelBackground: "#ffffff", noteBkgColor: "#fff7ed", noteBorderColor: "#f59e0b",
      },
    });
    mermaidReady = true;
  }

  const renderer = new marked.Renderer();
  renderer.code = function (code, infostring) {
    // marked v12 passes (code, infostring, escaped)
    const text = typeof code === "object" ? code.text : code;
    const info = (typeof code === "object" ? code.lang : infostring) || "";
    const lang = info.split(/\s+/)[0];
    if (lang === "mermaid") return `<pre class="mermaid">${escapeHtml(text)}</pre>`;
    let html;
    try {
      html = lang && hljs.getLanguage(lang) ? hljs.highlight(text, { language: lang }).value : hljs.highlightAuto(text).value;
    } catch (e) { html = escapeHtml(text); }
    return `<pre><code class="hljs language-${escapeHtml(lang)}">${html}</code></pre>`;
  };
  marked.setOptions({ renderer, gfm: true, breaks: false });

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function toHtml(md) {
    const raw = marked.parse(md || "");
    return DOMPurify.sanitize(raw, { ADD_ATTR: ["target"], ADD_TAGS: ["details", "summary"] });
  }

  function fixRefs(el, pagePath) {
    el.querySelectorAll("a[href]").forEach(a => {
      const href = a.getAttribute("href");
      if (/^(https?:|mailto:)/.test(href)) { a.target = "_blank"; a.rel = "noopener"; return; }
      if (href.startsWith("#")) {
        const id = href.slice(1);
        a.addEventListener("click", ev => {
          ev.preventDefault();
          const target = el.querySelector(`[id="${CSS.escape(id)}"]`);
          if (target) target.scrollIntoView({ behavior: "smooth" });
        });
        return;
      }
      const [path, frag] = href.split("#");
      const abs = resolve(pagePath, path);
      const route = routeFor(abs);
      a.setAttribute("href", route || "../" + abs + (frag ? "#" + frag : ""));
      if (!route) { a.target = "_blank"; a.rel = "noopener"; }
    });
    el.querySelectorAll("img[src]").forEach(img => {
      const src = img.getAttribute("src");
      if (!/^(https?:|data:)/.test(src)) img.setAttribute("src", "../" + resolve(pagePath, src));
      img.loading = "lazy";
    });
    // heading ids for in-page anchors (GitHub-style slugs)
    el.querySelectorAll("h1, h2, h3").forEach(h => {
      if (!h.id) h.id = h.textContent.trim().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s/g, "-");
    });
  }

  async function runMermaid(el) {
    const nodes = el.querySelectorAll("pre.mermaid");
    if (!nodes.length || !window.mermaid) return;
    initMermaid();
    try { await window.mermaid.run({ nodes }); } catch (e) { console.warn("mermaid", e); }
  }

  /** Render markdown into an element. */
  function into(el, md, pagePath) {
    el.classList.add("md");
    el.innerHTML = toHtml(md);
    fixRefs(el, pagePath || "");
    runMermaid(el);
    return el;
  }

  /** Split markdown into a preamble and level-2 sections (ignoring headings inside code fences). */
  function sections(md) {
    const lines = (md || "").split("\n");
    const out = [{ title: null, lines: [] }];
    let fence = false;
    for (const line of lines) {
      if (/^```/.test(line)) fence = !fence;
      const m = !fence && /^##\s+(.+?)\s*$/.exec(line);
      if (m) out.push({ title: m[1], lines: [line] });
      else out[out.length - 1].lines.push(line);
    }
    return out.map(s => ({ title: s.title, md: s.lines.join("\n") }));
  }

  /** Remove fenced blocks whose info string matches (e.g. "sql solution"), returning the rest. */
  function stripFences(md, infos) {
    return md.replace(/^```([^\n]*)\n[\s\S]*?^```[ \t]*$/gm, (m, info) => infos.includes(info.trim()) ? "" : m);
  }

  window.Render = { into, toHtml, sections, stripFences, escapeHtml, resolve };
})();
