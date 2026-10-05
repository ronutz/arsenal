// ============================================================================
// public/workers/python-playground.worker.mjs
// ----------------------------------------------------------------------------
// THE PYTHON PLAYGROUND'S WORKER: the one place on the site where a third-party
// interpreter runs. A module Web Worker (Pyodide requires one: pyodide.asm.mjs
// is an ES module, so a classic worker's importScripts() is not an option, per
// the Pyodide web-worker documentation read 2026-10-04), started by the page
// component only after the reader has pressed the consent button, and
// terminated by the page's Stop button or its 30 s wall clock. Terminating a
// Worker is the only way to interrupt synchronous Python without a
// SharedArrayBuffer interrupt buffer, which would need cross-origin isolation
// headers this static site does not carry.
//
// This file is plain JavaScript on purpose: it is served as a static asset from
// /workers/ and imported by the browser directly, outside the Next.js bundle,
// so the engine URL and the protocol below are the whole contract. It is
// commented like every other file in the repository (D-19).
//
// PROTOCOL (main thread -> worker):
//   { kind: "load", indexURL, files: [{ name, bytes }] }
//       Import the engine from indexURL (an absolute URL on this origin) and
//       start it. While the engine's own fetches run, self.fetch is wrapped so
//       the bytes received per file are counted and reported; nothing is
//       downloaded twice.
//   { kind: "run", id, code, stdin }
//       Run one program in a fresh global namespace (so runs do not leak
//       variables into each other) with the stdin box as sys.stdin, one line
//       per read; stdout and stderr captured byte-exact; the value of the last
//       expression returned as its repr.
//
// PROTOCOL (worker -> main thread):
//   { kind: "progress", file, received, total, totalReceived, totalBytes }
//   { kind: "ready", version, python, ms }
//   { kind: "load-error", message }
//   { kind: "stdout", id, text } / { kind: "stderr", id, text }   (chunks)
//   { kind: "done", id, result, ms, truncated }
//   { kind: "error", id, type, message, traceback, ms, truncated }
//
// The main thread validates every message's kind and id; a program can reach
// this scope through the js bridge module (js.postMessage is one line away),
// so anything that does not fit the protocol is ignored on the other side.
// ============================================================================

/** The engine, once loaded: the Pyodide API object. */
let pyodide = null;
/** Python's built-in repr, kept as a proxy so results can be rendered the way the REPL would. */
let reprFn = null;
/** The decoder for the byte streams (stream mode keeps multi-byte characters whole across writes). */
const decoder = new TextDecoder();
/** Output kept per stream per run before the stream is cut and marked truncated (mirrors LIMITS.maxOutputChars). */
const MAX_OUTPUT = 200000;

/**
 * Wrap self.fetch so the engine's own downloads report progress. Only URLs
 * under the engine's indexURL are counted; everything else passes through
 * untouched. The counted Response keeps the original status and headers, so
 * WebAssembly.instantiateStreaming still sees application/wasm.
 */
function countDownloads(indexURL, files) {
  // The expected sizes, for a percentage when a server omits Content-Length.
  const expected = Object.fromEntries(files.map((f) => [f.name, f.bytes]));
  // The three files the loader fetches (the module files arrive through import(), which fetch does not see).
  const totalBytes = files.filter((f) => !f.name.endsWith(".mjs")).reduce((n, f) => n + f.bytes, 0);
  const received = {};
  let lastReport = 0;
  const original = self.fetch.bind(self);
  self.fetch = async (input, init) => {
    // The URL as a string, whatever form the caller used.
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const response = await original(input, init);
    if (!url.startsWith(indexURL) || !response.body) return response;
    const name = url.slice(indexURL.length).split(/[?#]/)[0];
    const total = Number(response.headers.get("content-length")) || expected[name] || 0;
    received[name] = 0;
    // A pass-through stream that counts what goes by and reports at most every 80 ms.
    const counter = new TransformStream({
      transform(chunk, controller) {
        received[name] += chunk.byteLength;
        const now = Date.now();
        if (now - lastReport > 80) {
          lastReport = now;
          const totalReceived = Object.values(received).reduce((a, b) => a + b, 0);
          self.postMessage({ kind: "progress", file: name, received: received[name], total, totalReceived, totalBytes });
        }
        controller.enqueue(chunk);
      },
      flush() {
        // The last report for this file is exact.
        const totalReceived = Object.values(received).reduce((a, b) => a + b, 0);
        self.postMessage({ kind: "progress", file: name, received: received[name], total, totalReceived, totalBytes });
      },
    });
    return new Response(response.body.pipeThrough(counter), { status: response.status, statusText: response.statusText, headers: response.headers });
  };
}

/** Load the engine from this origin and report readiness. */
async function load(indexURL, files) {
  const t0 = performance.now();
  try {
    countDownloads(indexURL, files);
    // The loader module, then the engine; both from this origin, both pinned by path.
    const mod = await import(indexURL + "pyodide.mjs");
    pyodide = await mod.loadPyodide({ indexURL });
    reprFn = pyodide.runPython("repr");
    self.postMessage({ kind: "ready", version: pyodide.version, python: pyodide.runPython("import sys; sys.version.split()[0]"), ms: Math.round(performance.now() - t0) });
  } catch (e) {
    self.postMessage({ kind: "load-error", message: String((e && e.message) || e) });
  }
}

/**
 * Trim the engine's own frames from a traceback: everything before the first
 * frame of the reader's program (File "<exec>") is Pyodide's eval machinery,
 * which says nothing about the program.
 */
function trimTraceback(text) {
  const lines = String(text).split("\n");
  const first = lines.findIndex((l) => l.includes('File "<exec>"'));
  if (first <= 0) return String(text).trim();
  // Keep the "Traceback" header if the program's first frame is inside the first traceback block.
  const header = lines.findIndex((l) => l.startsWith("Traceback (most recent call last)"));
  const kept = header >= 0 && header < first ? [lines[header], ...lines.slice(first)] : lines.slice(first);
  return kept.join("\n").trim();
}

/** Run one program with the stdin box as its standard input. */
async function run(id, code, stdinText) {
  if (!pyodide) {
    self.postMessage({ kind: "error", id, type: "EngineNotLoaded", message: "The engine is not loaded.", traceback: "", ms: 0, truncated: false });
    return;
  }
  const t0 = performance.now();
  let out = "";
  let err = "";
  let truncated = false;
  // Byte-exact capture; chunks are forwarded as they cross 8 KB so a long run shows progress, the rest at the end.
  let pendingOut = "";
  let pendingErr = "";
  const flush = () => {
    if (pendingOut) self.postMessage({ kind: "stdout", id, text: pendingOut });
    if (pendingErr) self.postMessage({ kind: "stderr", id, text: pendingErr });
    pendingOut = "";
    pendingErr = "";
  };
  const writer = (which) => (buffer) => {
    const text = decoder.decode(buffer, { stream: true });
    if (which === "out") {
      if (out.length < MAX_OUTPUT) { out += text; pendingOut += text; } else truncated = true;
    } else {
      if (err.length < MAX_OUTPUT) { err += text; pendingErr += text; } else truncated = true;
    }
    if (pendingOut.length + pendingErr.length > 8192) flush();
    return buffer.length;
  };
  pyodide.setStdout({ write: writer("out") });
  pyodide.setStderr({ write: writer("err") });
  // One line per read; a trailing newline does not add an empty line; null is end of file.
  const lines = String(stdinText || "").split("\n");
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  pyodide.setStdin({ stdin: () => (lines.length ? lines.shift() : null), autoEOF: true });
  // A fresh namespace per run, with __name__ set so the main-guard idiom works.
  const globals = pyodide.runPython('{"__name__": "__main__"}');
  try {
    const value = await pyodide.runPythonAsync(code, { globals });
    let result = null;
    if (value !== undefined) {
      result = String(reprFn(value));
      if (value && typeof value.destroy === "function") value.destroy();
    }
    flush();
    self.postMessage({ kind: "done", id, result, ms: Math.round(performance.now() - t0), truncated });
  } catch (e) {
    flush();
    // Pyodide's PythonError carries the exception type and the full traceback in its message.
    const type = (e && e.type) || (e && e.name) || "Error";
    const traceback = trimTraceback((e && e.message) || String(e));
    const last = traceback.split("\n").filter((l) => l.trim()).pop() || "";
    self.postMessage({ kind: "error", id, type, message: last, traceback, ms: Math.round(performance.now() - t0), truncated });
  } finally {
    globals.destroy();
  }
}

/** Dispatch on the protocol; anything else is ignored. */
self.onmessage = (event) => {
  const m = event.data;
  if (!m || typeof m !== "object") return;
  if (m.kind === "load" && typeof m.indexURL === "string" && Array.isArray(m.files)) void load(m.indexURL, m.files);
  else if (m.kind === "run" && typeof m.id === "number" && typeof m.code === "string") void run(m.id, m.code, m.stdin);
};
