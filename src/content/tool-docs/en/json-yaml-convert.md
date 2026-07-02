## What it does

Convert a document between JSON and YAML in either direction, in your browser. Going from JSON it produces block-style YAML; going from YAML it produces JSON. When a parse fails, the error names the exact line and column, and when a conversion loses something along the way, a note explains what and why.

## The two directions

- **JSON to YAML.** The JSON is first validated by the same precise, position-tracking parser the JSON formatter uses, so an invalid document is rejected with a line, column, and JSON Pointer path rather than a vague failure. The valid data is then written as block-style YAML.
- **YAML to JSON.** The YAML is parsed under a JSON-compatible schema and serialized to JSON. Anchors and aliases (YAML's `&name` and `*name` reuse mechanism) are expanded inline, and block scalars (YAML's multi-line string styles) become ordinary JSON strings.

## The quoting traps it handles

YAML is famously willing to read a bare word as something other than a string, which is where round-trips go wrong. The best-known case is the "Norway problem": the bare word `NO` is read as the boolean false, and the same happens to `yes`, `on`, and `off`, and to values like `1.0` (a number, not the string "1.0") and `08` (which is not valid octal). When emitting YAML, the converter quotes these values so that what you meant as a string survives as a string.

## What conversion can lose

Some things exist in one format but not the other, so the notes flag them:

- **Comments.** YAML has comments and JSON does not, so comments are dropped when converting YAML to JSON.
- **Anchors and aliases.** These are expanded to their full value, so a compact shared reference in the source YAML becomes repeated data in the output.

## Worked examples

- JSON `{"port":8080,"tls":true}` becomes the YAML lines `port: 8080` and `tls: true`.
- YAML `country: NO` becomes JSON `{"country":"NO"}` on the way in, and when that is emitted back to YAML the value is quoted as `country: "NO"` so it is not mistaken for false.

## Using it

Paste JSON to get YAML, or YAML to get JSON. Read the conversion notes when they appear: they tell you whether anything, such as a comment or an anchor, changed in a way you should be aware of. The conversion is deterministic for a given input.
