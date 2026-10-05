## What it does

Real CPython 3.14 runs in your browser. The engine is Pyodide 314.0.7, the Pyodide project's build of CPython for WebAssembly, served from this origin and pinned by version and SHA-256 digest. You write a program, optionally give it some standard input, press Run, and read stdout, stderr and the value of the last expression, the way a REPL would show it. Nothing you type leaves the page: the interpreter lives in a Web Worker on your device, has no network and no processes, and the page's own policy would refuse them anyway.

It is the first tool on this site that runs code which is not the site's own. Three things follow, and the page says each of them out loud rather than hiding them:

- **A download happens, once, when you say so.** The engine is about 13.5 MB in five files. The page opens with the editor and an example but without the engine; one button, which names the size, starts the download with a progress bar. Your browser caches the files (they are versioned and marked immutable), so a second visit costs nothing.
- **A third-party engine runs.** The site's own checks cover the harness around it: the preflight, the limits, the examples (which are re-run through the real engine at every build), and the pinned files' digests. The interpreter's behaviour is the Pyodide project's.
- **The standard library is what is available.** The Pyodide distribution offers 357 packages (numpy, pandas, requests and the rest); none of them is loaded in this version. Forty standard-library modules are absent from the WebAssembly build (tkinter, curses, pwd, grp, readline, among others) and the preflight names them if you import one.

## The preflight

Before anything is sent to the engine, the program text is read (never executed) and you are told what will not work here and why, in the engine's own terms:

- an import of a standard-library module this build lacks, with the error the engine raises;
- an import of a package the Pyodide distribution offers but this version does not load, named by its package name (PIL is Pillow, yaml is pyyaml);
- an import of something nobody can install here, or a relative import, which has no package to be relative to;
- network modules (socket, urllib, http, requests...) and process modules (subprocess, multiprocessing, os.system), which Emscripten refuses;
- zoneinfo, which finds no time zone database here and raises ZoneInfoNotFoundError;
- input() with an empty stdin box, which raises EOFError on the first read;
- a time.sleep longer than the wall-clock limit, an unbounded while True, modules whose output changes between runs (random, time, uuid, datetime.now);
- files, which live in the engine's memory and vanish with the run; a program that prints nothing (the last expression's value is shown instead); tabs and spaces mixed in indentation.

Items marked as errors block the run; the rest are notes.

## Limits

- Program: 20,000 characters. Standard input: 20,000 characters.
- Wall clock: 30 seconds per run. At the limit the Worker is terminated and a fresh one is started from the cached files.
- Output: 200,000 characters per stream, then cut and marked.
- Stop terminates the Worker at once (the only way to interrupt synchronous Python without a cross-origin-isolated interrupt buffer, which this static site does not carry) and starts a new one.
- Each run starts in a fresh global namespace with `__name__` set to `"__main__"`, so runs do not leak variables into each other and the main-guard idiom works.

## Standard input

The stdin box feeds `input()` and `sys.stdin`, one line per read, then end of file. A trailing newline does not add an empty line. `for line in sys.stdin:` reads all of it.

## The examples

Twelve programs written for the people this site is for: splitting a /24 into /26s, aggregating prefixes, netmasks and wildcards in binary, a modified EUI-64 from a MAC, a DNS header built with struct, HMAC-SHA256 in hex and base64url, latency statistics with p95 and jitter, transfer times at three line rates, a syslog count by severity from pasted log text, lines read from the stdin box, fields picked from an API response, and the bare last expression. Their exact output is recorded as golden vectors and re-measured through the real engine under Node at every build; an engine upgrade that changes any of them fails the build and is looked at on purpose.

## What the API does not do

This tool is not exposed on the HTTP API. Executing arbitrary Python on shared infrastructure would be remote code execution; the engine runs in your browser only. The preflight is a teaching aid around the editor, not a stable contract.

## Sources

The Pyodide documentation (web worker and standard-stream pages, version 314.0.7), the package's own package.json, pyodide-lock.json and typings on the npm registry, the CPython 3.14 documentation for the modules the examples use, RFC 1035 section 4.1.1, RFC 4291 Appendix A and RFC 5424 section 6.2.1 for the examples' arithmetic, and MDN for the module Worker and the Content Security Policy source list. All read on 2026-10-04 and listed on the tool page.
