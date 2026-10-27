// ============================================================================
// src/lib/tools/pyproject-toml-explainer/example.ts
// ----------------------------------------------------------------------------
// The page's Example (D-83), in a module of its own so the page imports the
// engine and the Example without pulling the golden vectors into its bundle.
// golden-vectors.ts checks that it is verbatim the input of EXPLAIN_VECTORS[0]
// ("example"), so the two cannot drift. It is a small network tool's project
// file that uses every table the specifications define and trips a few of the
// warnings on purpose (a strict pin, a License :: classifier beside a license
// expression, a string field compared with ">", an extra not in normal form).
// ============================================================================

/** The Example pyproject.toml, one line per array element so every line can be read. */
export const EXAMPLE_PYPROJECT = [
  "[build-system]", // line 1
  "requires = [\"hatchling >= 1.26\"]", // line 2
  "build-backend = \"hatchling.build\"", // line 3
  "", // line 4 (blank)
  "[project]", // line 5
  "name = \"netcheck\"", // line 6
  "version = \"0.1.0\"", // line 7
  "description = \"Summarise a list of prefixes\"", // line 8
  "readme = \"README.md\"", // line 9
  "requires-python = \">= 3.11\"", // line 10
  "license = \"mit\"", // line 11
  "license-files = [\"LICEN[CS]E*\"]", // line 12
  "authors = [{ name = \"Ana Lima\", email = \"ana@example.com\" }]", // line 13
  "classifiers = [\"Programming Language :: Python :: 3\", \"License :: OSI Approved :: MIT License\"]", // line 14
  "dependencies = [", // line 15
  "  \"requests >= 2.32, < 3\",", // line 16
  "  \"cryptography == 50.0.2\",", // line 17
  "  \"pywin32; sys_platform == 'win32'\",", // line 18
  "  \"colorama; os_name > 'nt'\",", // line 19
  "]", // line 20
  "dynamic = [\"dependencies\"]", // line 21
  "", // line 22 (blank)
  "[project.optional-dependencies]", // line 23
  "test = [\"pytest >= 8\"]", // line 24
  "Dev_Tools = [\"netcheck[test]\", \"ruff\"]", // line 25
  "", // line 26 (blank)
  "[project.scripts]", // line 27
  "netcheck = \"netcheck:main\"", // line 28
  "", // line 29 (blank)
  "[project.urls]", // line 30
  "Homepage = \"https://example.com/netcheck\"", // line 31
  "\"Source Code\" = \"https://example.com/netcheck.git\"", // line 32
  "", // line 33 (blank)
  "[dependency-groups]", // line 34
  "lint = [\"ruff >= 0.7\"]", // line 35
  "ci = [{include-group = \"lint\"}, \"pytest\"]", // line 36
  "", // line 37 (blank)
  "[tool.ruff]", // line 38
  "line-length = 100", // line 39
  "[tool.ruff.lint]", // line 40
  "select = [\"E\", \"F\"]", // line 41
].join("\n") + "\n"; // joined with LF, ending with one
