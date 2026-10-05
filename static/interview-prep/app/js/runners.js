/* In-browser execution: SQL via sql.js (SQLite compiled to WebAssembly), Python via Pyodide.
 * Both engines load lazily the first time they are needed. */
(function () {
  const SQLJS_BASE = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/";
  const PYODIDE_BASE = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src; s.onload = resolve; s.onerror = () => reject(new Error("Failed to load " + src));
      document.head.appendChild(s);
    });
  }

  // ---------------- SQL ----------------
  let sqlPromise = null;
  function sqlEngine() {
    if (!sqlPromise) {
      sqlPromise = loadScript(SQLJS_BASE + "sql-wasm.js")
        .then(() => window.initSqlJs({ locateFile: f => SQLJS_BASE + f }));
    }
    return sqlPromise;
  }

  const norm = v => (typeof v === "number" ? Math.round(v * 1e4) / 1e4 : v);

  /** Run a query against a fresh database built from the schema. Returns {columns, rows} of the last statement. */
  async function runSql(schema, query) {
    const SQL = await sqlEngine();
    const db = new SQL.Database();
    try {
      db.exec(schema);
      const res = db.exec(query);
      if (!res.length) return { columns: [], rows: [] };
      const last = res[res.length - 1];
      return { columns: last.columns, rows: last.values };
    } finally {
      db.close();
    }
  }

  /** Compare a result with the expected output. Column names are ignored; values and (optionally) order matter. */
  function compareSql(got, expected, ordered) {
    const g = got.rows.map(r => r.map(norm));
    const e = expected.rows.map(r => r.map(norm));
    if (got.columns.length !== expected.columns.length) {
      return { ok: false, reason: `Expected ${expected.columns.length} columns (${expected.columns.join(", ")}), got ${got.columns.length}.` };
    }
    if (g.length !== e.length) return { ok: false, reason: `Expected ${e.length} rows, got ${g.length}.` };
    const key = r => JSON.stringify(r);
    const gs = g.map(key), es = e.map(key);
    if (!ordered) { gs.sort(); es.sort(); }
    for (let i = 0; i < es.length; i++) {
      if (gs[i] !== es[i]) {
        return { ok: false, reason: ordered ? `Row ${i + 1} differs (row order matters for this problem).` : "Values differ from the expected output." };
      }
    }
    const namesDiffer = got.columns.some((c, i) => c.toLowerCase() !== expected.columns[i].toLowerCase());
    return { ok: true, note: namesDiffer ? "Correct values. Tip: alias your columns to match the expected names." : "" };
  }

  // ---------------- Python ----------------
  let pyPromise = null;
  function pyEngine() {
    if (!pyPromise) {
      pyPromise = loadScript(PYODIDE_BASE + "pyodide.js").then(() => window.loadPyodide({ indexURL: PYODIDE_BASE }));
    }
    return pyPromise;
  }

  // Python side of the runner: per-assert results with actual vs expected values, tracebacks
  // limited to the user's code, and a sys.settrace-based step debugger. Results come back as JSON.
  const PY_HARNESS = String.raw`import ast, io, json, linecache, operator, reprlib, sys, traceback, types

_USER_FILES = ("solution.py", "debug.py")
_TEST_FILE = "tests.py"

_short_repr = reprlib.Repr()
_short_repr.maxstring = 120
_short_repr.maxother = 120
_short_repr.maxlist = _short_repr.maxtuple = _short_repr.maxset = _short_repr.maxdict = 12
_short_repr.maxlevel = 4

_OPS = {
    ast.Eq: (operator.eq, "=="), ast.NotEq: (operator.ne, "!="),
    ast.Lt: (operator.lt, "<"), ast.LtE: (operator.le, "<="),
    ast.Gt: (operator.gt, ">"), ast.GtE: (operator.ge, ">="),
    ast.Is: (operator.is_, "is"), ast.IsNot: (operator.is_not, "is not"),
    ast.In: (lambda a, b: a in b, "in"), ast.NotIn: (lambda a, b: a not in b, "not in"),
}


def _full(v, limit=1500):
    try:
        s = repr(v)
    except Exception as e:  # a broken __repr__ must not hide the test result
        s = f"<unrepresentable {type(v).__name__}: {e}>"
    return s if len(s) <= limit else s[:limit] + " …"


def _short(v):
    try:
        return _short_repr.repr(v)
    except Exception:
        return f"<{type(v).__name__}>"


def _seg(src, node):
    """Source of a top-level statement, including decorators (get_source_segment drops them)."""
    start = min([d.lineno for d in getattr(node, "decorator_list", [])] + [node.lineno])
    return "\n".join(src.splitlines()[start - 1:node.end_lineno])


def _register(name, code):
    linecache.cache[name] = (len(code), None, code.splitlines(True), name)


def _fmt_exc(e):
    frames = [f for f in traceback.extract_tb(e.__traceback__) if f.filename in _USER_FILES + (_TEST_FILE,)]
    lines = []
    for f in frames:
        where = "test" if f.filename == _TEST_FILE else "your code"
        lines.append(f"  {where}, line {f.lineno}, in {f.name}")
        if f.line:
            lines.append(f"    {f.line.strip()}")
    msg = "".join(traceback.format_exception_only(type(e), e)).strip()
    if isinstance(e, AssertionError) and msg == "AssertionError":
        msg = "AssertionError (a check inside this block failed)"
    return ("Traceback:\n" + "\n".join(lines) + "\n" if lines else "") + msg


def _hint(got, exp):
    if got is None and exp is not None:
        return "Your function returned None. Is a return statement missing?"
    if type(got) is not type(exp) and not (isinstance(got, (int, float)) and isinstance(exp, (int, float))):
        return f"Type mismatch: you returned a {type(got).__name__}, the test expects a {type(exp).__name__}."
    if isinstance(exp, (list, tuple)):
        if len(got) != len(exp):
            extra = ""
            try:
                missing = [x for x in exp if x not in got]
                unexpected = [g for g in got if g not in exp]
                if missing:
                    extra += f" Missing: {_short(missing)}."
                if unexpected:
                    extra += f" Not expected: {_short(unexpected)}."
            except Exception:
                pass
            return f"Length mismatch: you returned {len(got)} item(s), the test expects {len(exp)}.{extra}"
        for i, (g, x) in enumerate(zip(got, exp)):
            if g != x:
                if type(g) is not type(x):
                    return (f"Item {i} is a {type(g).__name__} but the test expects a {type(x).__name__} "
                            f"(got {_short(g)}, expected {_short(x)}).")
                try:
                    if sorted(got, key=repr) == sorted(exp, key=repr):
                        return f"Right items, wrong order (first difference at index {i}). Check the sort / tie-breaking rule."
                except Exception:
                    pass
                return f"First difference at index {i}: got {_short(g)}, expected {_short(x)}."
    if isinstance(exp, dict):
        missing = [k for k in exp if k not in got]
        extra = [k for k in got if k not in exp]
        if missing:
            return f"Missing key(s): {_short(missing)}."
        if extra:
            return f"Unexpected key(s): {_short(extra)}."
        for k in exp:
            if got[k] != exp[k]:
                return f"Value for key {k!r} differs: got {_short(got[k])}, expected {_short(exp[k])}."
    if isinstance(exp, float) and isinstance(got, (int, float)):
        return "Numbers differ. If it is a rounding issue, check how the problem asks you to round."
    return ""


class _Capture:
    def __enter__(self):
        self.buf = io.StringIO()
        self.old = sys.stdout, sys.stderr
        sys.stdout = sys.stderr = self.buf
        return self

    def __exit__(self, *exc):
        sys.stdout, sys.stderr = self.old
        return False

    def text(self, limit=20000):
        v = self.buf.getvalue()
        return v if len(v) <= limit else v[:limit] + "\n… (output truncated)"


def _check_assert(node, tests, ns):
    """Evaluate one top-level assert, returning a result dict with actual/expected values on failure."""
    t = node.test
    ev = lambda n: eval(compile(ast.Expression(n), _TEST_FILE, "eval"), ns)
    r = {}
    if isinstance(t, ast.Compare) and len(t.ops) == 1 and type(t.ops[0]) in _OPS:
        fn, sym = _OPS[type(t.ops[0])]
        left = ev(t.left)
        right = ev(t.comparators[0])
        r["ok"] = bool(fn(left, right))
        if not r["ok"]:
            r.update(got=_full(left), expected=_full(right), op=sym,
                     call=ast.get_source_segment(tests, t.left))
            if sym == "==":
                r["hint"] = _hint(left, right)
    else:
        v = ev(t)
        r["ok"] = bool(v)
        if not r["ok"]:
            r.update(got=_full(v), call=ast.get_source_segment(tests, t))
    if not r["ok"] and node.msg is not None:
        try:
            r["message"] = str(ev(node.msg))
        except Exception:
            pass
    return r


def run_code(code):
    _register("solution.py", code)
    res = {"error": None}
    with _Capture() as cap:
        try:
            exec(compile(code, "solution.py", "exec"), {"__name__": "__main__"})
        except BaseException as e:
            res["error"] = _fmt_exc(e)
    res["stdout"] = cap.text()
    return json.dumps(res)


def run_tests(code, tests):
    _register("solution.py", code)
    _register(_TEST_FILE, tests)
    res = {"error": None, "results": []}
    ns = {"__name__": "__main__"}
    with _Capture() as cap:
        try:
            exec(compile(code, "solution.py", "exec"), ns)
        except BaseException as e:
            res["error"] = _fmt_exc(e)
        else:
            for i, node in enumerate(ast.parse(tests).body):
                r = {"src": _seg(tests, node), "node": i}
                try:
                    if isinstance(node, ast.Assert):
                        r.update(_check_assert(node, tests, ns))
                    else:
                        exec(compile(ast.Module([node], []), _TEST_FILE, "exec"), ns)
                        continue  # setup statement that ran fine: not a test of its own
                except BaseException as e:
                    r.update(ok=False, error=_fmt_exc(e))
                res["results"].append(r)
    res["stdout"] = cap.text()
    return json.dumps(res)


def debug_script(code, tests, node_index):
    """Your code + the test statements needed to reproduce one test, with that test's call stored in "result"."""
    body = ast.parse(tests).body
    lines = [code.rstrip("\n"), "", "# ---- reproducing the test: setup + call ----"]
    for node in body[:node_index]:
        if isinstance(node, ast.Assert):
            # earlier checks still run (they may change state, e.g. an LRU cache) but can't stop the debug run
            lines.append("_ = (" + ast.get_source_segment(tests, node.test) + ")")
        else:
            lines.append(_seg(tests, node))
    target = body[node_index]
    if isinstance(target, ast.Assert) and isinstance(target.test, ast.Compare) and len(target.test.ops) == 1:
        lines.append("result = " + ast.get_source_segment(tests, target.test.left))
        lines.append("expected = " + ast.get_source_segment(tests, target.test.comparators[0]))
    elif isinstance(target, ast.Assert):
        lines.append("result = " + ast.get_source_segment(tests, target.test))
    else:
        lines.append(_seg(tests, target))
    return "\n".join(lines) + "\n"


def _is_noise(name, v):
    return (name.startswith("__") or isinstance(v, (types.ModuleType, types.FunctionType, types.BuiltinFunctionType, type))
            or name in ("In", "Out"))


def trace(code, max_steps=1500):
    """Run code under sys.settrace and record every line executed in it with the local variables."""
    _register("debug.py", code)
    steps = []
    res = {"steps": steps, "error": None, "truncated": False}

    class _Stop(BaseException):
        pass

    def stack_of(frame):
        names = []
        while frame is not None:
            if frame.f_code.co_filename == "debug.py":
                names.append("module" if frame.f_code.co_name == "<module>" else frame.f_code.co_name)
            frame = frame.f_back
        return names[::-1]

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != "debug.py":
            return None
        if event in ("line", "return", "exception"):
            if len(steps) >= max_steps:
                res["truncated"] = True
                raise _Stop()
            st = {
                "line": frame.f_lineno, "event": event, "stack": stack_of(frame),
                "locals": {k: _short(v) for k, v in list(frame.f_locals.items()) if not _is_noise(k, v)},
                "out": len(cap.buf.getvalue()),
            }
            if event == "return":
                st["ret"] = _short(arg)
            elif event == "exception":
                st["exc"] = f"{arg[0].__name__}: {arg[1]}"
            steps.append(st)
        return tracer

    ns = {"__name__": "__main__"}
    with _Capture() as cap:
        sys.settrace(tracer)
        try:
            exec(compile(code, "debug.py", "exec"), ns)
        except _Stop:
            pass
        except BaseException as e:
            res["error"] = _fmt_exc(e)
        finally:
            sys.settrace(None)
    res["stdout"] = cap.text(50000)
    return json.dumps(res)


def debug_script_json(code, tests, node_index):
    return json.dumps(debug_script(code, tests, node_index))
`;
  let harnessPromise = null;
  async function pyHarness() {
    const py = await pyEngine();
    if (!harnessPromise) {
      const ns = py.globals.get("dict")();
      harnessPromise = py.runPythonAsync(PY_HARNESS, { globals: ns }).then(() => ns);
    }
    return harnessPromise;
  }
  async function callHarness(fn, ...args) {
    const ns = await pyHarness();
    const f = ns.get(fn);
    try { return JSON.parse(f(...args)); } finally { f.destroy(); }
  }

  /** Run code only. Returns {ok, stdout, error}. */
  async function runPython(code) {
    const r = await callHarness("run_code", code);
    return { ok: !r.error, stdout: r.stdout, error: r.error };
  }
  /** Run code, then each top-level test statement: {error, results:[{src, ok, got, expected, op, hint, call, message, error, node}], stdout}. */
  const runPythonTests = (code, tests) => callHarness("run_tests", code, tests);
  /** Script reproducing top-level test statement `node`: user code + setup + "result = <call>". */
  const debugScript = (code, tests, node) => callHarness("debug_script_json", code, tests, node);
  /** Execute code under the tracer: {steps:[{line, event, stack, locals, out, ret, exc}], stdout, error, truncated}. */
  const tracePython = code => callHarness("trace", code);

  window.Runners = { runSql, compareSql, runPython, runPythonTests, debugScript, tracePython, sqlEngine, pyEngine };
})();
