## What it does

BIG-IP Advanced WAF detects a whole class of attacks that hide behind encoding, where a payload is escaped or encoded so an attack signature never sees the real characters, and the web server decodes it back into the attack only after the firewall has looked. F5 groups the defenses under one violation, "Evasion technique detected" (`VIOL_EVASION`), split into eight sub-violations. This tool is the decode side of that violation: type a sub-violation name (or the word `evasions`) to get all eight explained, or paste the `evasions` block of a declarative policy to read each one back as enabled or disabled. It is grounded verbatim in F5's own K7929 and the current BIG-IP ASM violation chapter, and it runs entirely in your browser.

## Two modes, one input

Type `evasions` and the tool lists F5's eight sub-violations, each with its default state (all eight ship enabled), a plain-language description of what it normalizes or detects, and the encoding trick an attacker uses it to catch. Type a single name, like `Multiple decoding` or `Bad unescape`, and you get just that card. The lookup is forgiving about spacing, case, and percent signs, so `multiple decoding` and `Multiple decoding` both resolve.

Paste JSON instead, a bare `evasions` array, the `blocking-settings` object, or a whole `{ "policy": { ... } }` wrapper, and the tool switches to read-back mode: it reports each of the eight sub-violations as enabled, disabled, or not set, where "not set" means the policy inherits its template default rather than turning the check off. A disabled sub-violation is called out as a warning, because switching one off means that normalization is skipped and the evasion it caught can reach the application unresolved.

## The eight sub-violations

The tool covers exactly F5's eight, in the order the manual lists them: `%u decoding` (Microsoft `%u` Unicode escapes), `Apache whitespace` (the ASCII 9, 11, 12, 13 control bytes), `Bad unescape` (illegal hex like `%RR`), `Bare byte decoding` (raw bytes above 127), `Directory traversals` (`../` patterns), `IIS backslashes` (folding `\` to `/`), `IIS Unicode codepoints` (IIS-specific `%u` mappings from Windows-1252), and `Multiple decoding` (repeated decoding of nested encodings). Each name, default, and description is taken directly from F5's documentation.

## Multiple decoding and the pass count

Multiple decoding is the one sub-violation with a tuning value. In the declarative schema it carries `maxDecodingPasses`, which the schema bounds between 2 and 5 with a documented default of 3. The tool surfaces the pass count when a policy sets it, flags a value raised above the default as a note, and flags a value outside the 2-to-5 range as a warning, because the system would reject or clamp it. When the count is not set, the tool states the default that applies rather than guessing.

## The bridge to the encoding tools

Several of these sub-violations are the very same decode operations the toolbox already performs. The `%u` escapes, bare bytes, and the `%XX` percent-encoding that Bad unescape polices are the territory of the Base64/Percent codec, and Multiple decoding is simply percent-decoding run more than once. Each reference card names the related tool, so you can take an encoded string and watch the decode happen by hand, which is the fastest way to build intuition for what the WAF is normalizing away.

## One rule from the schema

The tool also reads the parent violation's learn flag when a full `blocking-settings.violations` array is present. Per the schema, these sub-violations are only *learned* when learning is enabled on `VIOL_EVASION`; if learning is off there, a triggering request is still detected and can be alarmed or blocked, but no learning suggestion is generated. The tool surfaces that state so a policy that will never learn its evasions does not surprise you.

## Grounding and accuracy

Every sub-violation name, default, and description is grounded in F5's K7929 and the current BIG-IP ASM 17.5 "Working with Violations" chapter (the Evasion Techniques Sub-Violations table); the field names, the boolean `enabled`, `maxDecodingPasses`, and the 2-to-5 bound come from F5's Declarative WAF policy schema. It is a decode-only tool: it reads what you paste and never fetches, never validates against a live BIG-IP, and never evaluates traffic. Nothing you paste is uploaded or leaves the page; for a production decision, confirm any reading against the documentation for your BIG-IP version.
