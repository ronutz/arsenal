## What it does

Paste a `pyproject.toml` and the tool reads it with its own TOML parser, then explains it table by table and key by key: what each key of `[build-system]`, `[project]`, `[dependency-groups]` and `[tool]` is for, the core metadata field it fills, and what the engine read from its value. Every dependency is taken apart (name, extras, each version clause in words, the URL of a direct reference, the environment marker and the type of each marker field); the version is normalized; the license expression is checked against the SPDX License List and given in canonical case; the readme's content type, the people and the fields they fill, URL labels and the well-known ones, entry points, extras, dependency group includes and each tool's keys are listed. Then it checks the file against the specifications and reports each finding with its line, its key and its strength. Everything runs in your browser, and nothing the file names (a URL, a readme, a license file, a build requirement) is opened, fetched or installed.

It sits beside the [wheel filename explainer](/tools/wheel-filename-explainer), which reads the file names a build produces, and the [Python playground](/tools/python-playground).

## Error, warning, note

Each finding carries the strength of the rule behind it, read from the specification's own words:

- **Error**: the specification says MUST or MUST NOT (or the file is not TOML, or a value has the wrong TOML type). Examples: a `[project]` table without `name`; `name` listed in `dynamic`; a key that is not one of the keys `[project]` defines; a static key also listed in `dynamic` when it is not one of the list or table keys a back-end may extend; a `readme` table with both `file` and `text`; a `console_scripts` group under `[project.entry-points]`; an import name in both `import-names` and `import-namespaces`; a cycle of dependency group includes.
- **Warning**: SHOULD or SHOULD NOT, something the specification says a tool MAY refuse, something deprecated, or TOML 1.1.0 syntax. Examples: a version that is not in normal form; a `License ::` classifier (deprecated by PEP 639); a license expression together with `License ::` classifiers; `extra != "..."` in a marker; an ordered comparison on a string marker field; an `==` pin; a direct reference without a secure transport or a hash.
- **Note**: worth knowing, nothing to fix. Examples: no `[build-system]` table, so the setuptools defaults apply; a key both static and dynamic that PEP 808 allows; a license expression accepted but not in the list's case; a self-referential extra.

## What it checks

- **The tables.** Only `[build-system]`, `[project]`, `[dependency-groups]` and `[tool]` are defined; the specification reserves every other top-level table for future use (warning).
- **`[build-system]`.** `requires` is mandatory in the table and each string is a dependency specifier; `build-backend` is an object reference, `module` or `module:object`, with dotted Python identifiers and no spaces (PEP 517); each `backend-path` directory stays inside the source tree. Without `build-backend`, front-ends fall back to the legacy setuptools behaviour (note); without the table, the defaults `requires = ["setuptools"]` apply (note).
- **`[project]`.** Every key's TOML type and its core metadata field. `name` is a valid project name, never dynamic, compared normalized. `version` is a PEP 440 version, given or listed in `dynamic`. `description` is one line (tools MAY error). `readme` is a path ending in `.md` or `.rst`, or a table with exactly one of `file` and `text` and a `content-type` of `text/plain`, `text/x-rst` or `text/markdown`, charset UTF-8, Markdown variant `GFM` or `CommonMark`. `requires-python` is a version specifier set. `license` is an SPDX license expression (the table form is deprecated, and `file` and `text` are mutually exclusive); `license-files` holds glob patterns that stay inside the project (no `..`, no absolute path, only the characters the glob specification allows) and an empty array means no license files. `authors` and `maintainers` are tables with `name`, `email` or both, a name without commas. `urls` labels are at most 32 characters. `scripts`, `gui-scripts` and `entry-points` hold object references, with entry point groups one level deep and no `console_scripts` or `gui_scripts` group under `entry-points`. `optional-dependencies` keys are valid extra names, in the normalized form core metadata requires, with no two the same once normalized. `import-names` and `import-namespaces` (PEP 794) hold dotted identifiers with an optional `; private`, `import-namespaces` is never empty, and no name is in both. `dynamic` lists only `[project]` keys, never `name`.
- **`dynamic` and PEP 808.** Since May 2026, a list or table key (`authors`, `classifiers`, `dependencies`, `entry-points`, `gui-scripts`, `import-names`, `import-namespaces`, `keywords`, `license-files`, `maintainers`, `optional-dependencies`, `scripts`, `urls`) may be given and also listed in `dynamic`: the back-end may add entries but must not change or remove the ones given (note). Any other key given statically and listed in `dynamic` is an error.
- **Dependency specifiers.** The grammar of the dependency specifiers specification: the name, extras, version clauses (with every PEP 440 rule the wheel filename explainer applies), direct references after `@`, and environment markers with `and`, `or` and parentheses. The marker comparison rules: an ordered comparison or `~=` and `===` on a string field, `in` on a version field, a constant that is not a version on a version field, `extras` and `dependency_groups` outside a lock file, `extra !=` and other operators on `extra`, comparisons between two constants, and the old spellings such as `os.name`. A direct reference should use a secure transport and carry a hash; a `;` written straight after a URL belongs to the URL, so the marker that seems to follow it is not one.
- **Dependency groups** (PEP 735). Group names are valid names compared normalized (duplicates after normalization: warning, as tools SHOULD emit an error); each item is a dependency specifier or a table with exactly one key, `include-group`; includes name existing groups and never form a cycle; a group named like an extra is advised against.
- **`[tool]`.** Each tool keeps its settings in a sub-table named after the project that owns that name on PyPI; the tool lists each one's keys and their TOML types.

## The TOML parser

The tool has its own TOML parser. It implements the whole of TOML 1.0.0: basic, literal and multi-line strings with every escape, integers in four bases (with values beyond 64 bits kept exact), floats including `inf` and `nan`, booleans, the four date and time types with range checks, arrays, inline tables, standard tables, arrays of tables, dotted keys, and every rule about defining a table or a key twice. Where the TOML text leaves room, it does what Python's `tomllib` does: a byte order mark at the start is refused, a DEL character in a comment is refused, and a 60th second is refused.

If the file is not TOML 1.0.0, the parser tries TOML 1.1.0 (released 2025-12-18): new lines and a trailing comma inside inline tables, the `\x` and `\e` escapes, and times without seconds. A file that needs 1.1.0 is explained with a warning naming the features and the first line, because Python's `tomllib` reads TOML 1.1.0 only from Python 3.15; in Python 3.11 to 3.14 it reads 1.0.0, so tools built on those versions refuse the file. Nested arrays and inline tables are limited to 100 levels and a dotted key to 128 parts, and the file to 500,000 characters.

## What it does not check

- **Files named in the file.** Whether `README.md` exists, is UTF-8 or renders; whether the license files match anything; whether `backend-path` resolves inside the tree through symbolic links. Nothing is read from disk or the network.
- **The build back-end's own rules**, and any key a back-end requires under `[tool]`. The tool lists those keys but has no schema for them.
- **Classifiers against PyPI's list**, and whether a name is taken on PyPI.
- **Email addresses** beyond their basic shape (one `@` with text on both sides, a dot in the domain, no spaces, angle brackets or commas), so an address that fails is a warning rather than an error.
- **`Requires-Python` against the dependencies**, or whether the dependencies can be resolved together.

## Where it follows the reference implementations

During development the TOML parser was compared with `tomllib` from CPython 3.13.16 (TOML 1.0.0) and `tomli` 2.5.0 (TOML 1.1.0) on 90,137 generated documents, values and verdicts both, with no disagreement. The dependency specifier parser was compared with packaging 26.3 on 60,000 strings: it agrees except where packaging departs from the grammar, and there it follows the grammar (673 cases): empty parentheses with no version clause and `===` without a version are refused, and a `===` clause followed by a comma ends at the comma, where packaging reads the comma into the arbitrary version. The license check was compared with packaging 26.3's `canonicalize_license_expression` on 20,000 expressions and agreed on every one. It departs by design in one case: a lower-case `licenseref-` prefix, which the SPDX annex calls invalid and packaging accepts, is refused here. Like packaging, it refuses the `DocumentRef-` and `AdditionRef-` forms, which the packaging specification does not list.

## Worked examples

- **The Example button**: a `netcheck` project built with hatchling. Five warnings: a license expression together with a `License ::` classifier, that deprecated classifier, an `==` pin on `cryptography`, `os_name > 'nt'` (an ordered comparison on a string field), and the extra `Dev_Tools` not in the normalized form core metadata requires. Three notes: `"mit"` is valid and canonically `MIT`; `dependencies` is both given and dynamic, which PEP 808 allows; `netcheck[test]` is a self-referential extra.
- A file whose `[project]` has neither `name` nor `version` gets two errors; with `dynamic = ["version"]` only the first remains.
- `[project]` then `name = "a"` then `name = "b"` is not TOML: the key `project.name` is defined twice, at line 3, column 1.

## Provenance

The engine is pure: one pass per value, no clock, no network, no randomness, no regular expression with nested quantifiers. It ships golden vectors (set `pyproject-toml-explainer/2026-10-27a`): 96 rows, of which 36 TOML documents (the TOML 1.0.0 page's own valid and invalid examples among them) whose values and errors come from `tomllib` and `tomli`, 24 dependency specifiers and 16 license expressions with packaging 26.3's verdicts, and 20 whole files with every expected finding, line and severity.

## API

The same engine answers the `/api/v1/pyproject-toml-explainer` operation of the site's HTTP API, described in the OpenAPI contract on the [API page](/api); the contract also says whether this site serves the API.

- **Request.** The `pyproject.toml` text, in the body of a POST or in the `input` query parameter of a GET.
- **Response.** `status` (`ok`, `toml-error`, `too-long` or `empty`); `toml` (the grammar the file needed, `1.0.0` or `1.1.0`, the 1.1.0 features used and whether the file had CRLF line ends); `tomlError` (`code`, `line`, `col`, `key`) when the file is not TOML; `sections`, each with its `items` (`path`, `key`, `line`, `type`, `known`, `coreField`, `display`, `dynamic`, and the parsed `version`, `specifier`, `requirements`, `entries`, `urls`, `people`, `license`, `readme`, `keys`, `extras`, `group` or `reference` where they apply); `findings` (`code`, `severity`, `path`, `line`, `params`), errors first; `counts`; and `summary`. A file with findings is a normal answer, not an HTTP error.

## Sources

All read 2026-10-27.

- [Python Packaging User Guide: pyproject.toml specification](https://packaging.python.org/en/latest/specifications/pyproject-toml/) (last updated Oct 27, 2026)
- [Python Packaging User Guide: Core metadata specifications](https://packaging.python.org/en/latest/specifications/core-metadata/) (version 2.6)
- [Python Packaging User Guide: Dependency specifiers](https://packaging.python.org/en/latest/specifications/dependency-specifiers/) and [Version specifiers](https://packaging.python.org/en/latest/specifications/version-specifiers/)
- [Python Packaging User Guide: Names and normalization](https://packaging.python.org/en/latest/specifications/name-normalization/), [Entry points](https://packaging.python.org/en/latest/specifications/entry-points/), [Dependency Groups](https://packaging.python.org/en/latest/specifications/dependency-groups/), [Well-known Project URLs](https://packaging.python.org/en/latest/specifications/well-known-project-urls/), [glob patterns](https://packaging.python.org/en/latest/specifications/glob-patterns/), [License Expression](https://packaging.python.org/en/latest/specifications/license-expression/)
- [SPDX Specification 3.0.1, Annex: SPDX License Expressions](https://spdx.github.io/spdx-spec/v3.0.1/annexes/spdx-license-expressions/) and the [SPDX License List](https://spdx.org/licenses/) 3.29.0 of 2026-09-16
- [PEP 517](https://peps.python.org/pep-0517/), [PEP 518](https://peps.python.org/pep-0518/), [PEP 621](https://peps.python.org/pep-0621/), [PEP 639](https://peps.python.org/pep-0639/), [PEP 735](https://peps.python.org/pep-0735/), [PEP 794](https://peps.python.org/pep-0794/), [PEP 808](https://peps.python.org/pep-0808/)
- [TOML v1.0.0](https://toml.io/en/v1.0.0) and [TOML v1.1.0](https://toml.io/en/v1.1.0)
- [Python documentation: tomllib](https://docs.python.org/3/library/tomllib.html): TOML 1.0.0 from Python 3.11, TOML 1.1.0 from Python 3.15
