## What it does

Paste JSON and this tool validates it, then pretty-prints, minifies, or sorts it. What sets it apart from a plain `JSON.parse` is what it tells you when something is wrong or unusual: a parse error names the exact line, column, and path to the problem; repeated object keys are flagged; and very large or very precise numbers are preserved exactly rather than being rounded. Everything runs in your browser.

## A parser built for diagnostics

The engine is a hand-written parser that tracks position as it reads, rather than relying on the JavaScript runtime's built-in parse. That buys three things that matter in practice:

- **Precise errors.** When parsing fails, you get the line, the column, the byte offset, a plain-language message, and the JSON Pointer (RFC 6901) path to the location, instead of a single engine-dependent `SyntaxError` with no path.
- **Duplicate-key detection.** The JSON grammar technically permits an object to repeat a key, and `JSON.parse` silently keeps only the last one. That silent behavior hides real bugs, so this engine reports every duplicate it finds, by path.
- **Exact large numbers.** JSON numbers have no size limit, but a JavaScript number is a 64-bit float and loses precision above 2^53. The formatter preserves the digits you wrote, so a 20-digit id or a high-precision decimal is not quietly rounded.

## Format, minify, and sort

Once the JSON is valid you can pretty-print it with consistent indentation, minify it to the smallest single-line form, or sort object keys so that two documents which differ only in key order line up for comparison. Sorting is by key and does not reorder arrays, whose order is significant in JSON.

## Worked examples

- `{"b":1,"a":2}` sorted by key becomes `{"a":2,"b":1}`.
- `{ "a": 1 }` minified becomes `{"a":1}`, with the whitespace removed.
- `{"id":10000000000000001}` keeps all its digits, whereas a round-trip through a 64-bit float would turn it into `10000000000000000`.
- `{"a":1,"a":2}` is flagged for the duplicate key `a`; a standard parser would silently keep `2`.

## Using it

Paste a JSON document and choose to format, minify, or sort it. If it does not parse, the error points at the exact spot; if it parses but has duplicate keys or oversized numbers, those are called out. The tool is a pure function of its input, so the same document always gives the same result.
