// ============================================================================
// src/lib/tools/pyproject-toml-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// The pinned truth for the pyproject.toml explainer.
//
// WHERE THE EXPECTED VALUES COME FROM (2026-10-27):
//   - TOML_VECTORS: what Python's tomllib (CPython 3.13.16, TOML 1.0.0) reads
//     each document as, or, when tomllib refuses it, what tomli 2.5.0 (TOML
//     1.1.0, the project tomllib is taken from) reads; as tagged JSON. The
//     error rows pin this engine's code and position (the comment gives
//     tomllib's message for the same document).
//   - REQUIREMENT_VECTORS and LICENSE_VECTORS: packaging 26.3 (pip's library).
//   - EXPLAIN_VECTORS: no library checks a pyproject.toml against the
//     specifications as a whole, so these findings were produced by this
//     engine and read one by one against the rules in compute.ts before being
//     frozen. Each document targets a group of rules.
//   - Beyond these vectors the build helper ran differential tests: 30,137
//     random and specification documents and 60,000 table-definition stress
//     documents against tomllib and tomli, 60,000 dependency specifiers
//     against packaging (673 grammar departures skipped, stated in the docs),
//     and 20,000 license expressions against packaging; no other difference.
// ============================================================================

import { parseToml, type TomlValue, type TomlErrorCode } from "./toml"; // TOML
import { parseRequirement, markerToString, type RequirementErrorCode } from "./pep508"; // dependency specifiers
import { checkLicenseExpression, type LicenseErrorCode } from "./license"; // license expressions
import { explainPyproject, type FindingCode, type Severity } from "./compute"; // the explainer
import { EXAMPLE_PYPROJECT } from "./example"; // the page's Example

/** The set id: changes whenever any vector changes (scripts/check-api-sync.mjs reads it). */
export const GOLDEN_VECTOR_SET_ID = "pyproject-toml-explainer/2026-10-27a"; // dated the day the set was written

/** A TOML document and what it parses to (canonical JSON from tomllib or tomli), or the engine's error. */
export interface TomlVector { id: string; input: string; version: "1.0.0" | "1.1.0" | null; data: string | null; features: string[]; error: [TomlErrorCode, number, number] | null } // one row

/** TOML documents: the specification's own examples and rules, CR LF, a BOM, a lone CR, 1.1.0 syntax. */
export const TOML_VECTORS: TomlVector[] = [
  { id: "basic", input: "title = \"TOML Example\"\n[owner]\nname = \"Tom Preston-Werner\"\ndob = 1979-05-27T07:32:00-08:00\n", version: "1.0.0", data: "{\"T\":{\"title\":{\"s\":\"TOML Example\"},\"owner\":{\"T\":{\"name\":{\"s\":\"Tom Preston-Werner\"},\"dob\":{\"dt\":\"offset-date-time\",\"iso\":\"1979-05-27T07:32:00-08:00\"}}}}}", features: [], error: null }, // tomllib (TOML 1.0.0)
  { id: "keys", input: "key = \"value\"\nbare_key = \"value\"\nbare-key = \"value\"\n1234 = \"value\"\n\"127.0.0.1\" = \"value\"\n'key2' = \"value\"\n\"\" = \"blank\"\n", version: "1.0.0", data: "{\"T\":{\"1234\":{\"s\":\"value\"},\"key\":{\"s\":\"value\"},\"bare_key\":{\"s\":\"value\"},\"bare-key\":{\"s\":\"value\"},\"127.0.0.1\":{\"s\":\"value\"},\"key2\":{\"s\":\"value\"},\"\":{\"s\":\"blank\"}}}", features: [], error: null }, // tomllib (TOML 1.0.0)
  { id: "dotted", input: "name = \"Orange\"\nphysical.color = \"orange\"\nphysical.shape = \"round\"\nsite.\"google.com\" = true\n3.14159 = \"pi\"\n", version: "1.0.0", data: "{\"T\":{\"3\":{\"T\":{\"14159\":{\"s\":\"pi\"}}},\"name\":{\"s\":\"Orange\"},\"physical\":{\"T\":{\"color\":{\"s\":\"orange\"},\"shape\":{\"s\":\"round\"}}},\"site\":{\"T\":{\"google.com\":{\"b\":true}}}}}", features: [], error: null }, // tomllib (TOML 1.0.0)
  { id: "strings", input: "str = \"I'm a string. \\\"You can quote me\\\". Name\\tJos\\u00E9\\nLocation\\tSF.\"\nstr2 = \"\"\"\nRoses are red\nViolets are blue\"\"\"\nstr3 = \"\"\"\\\n       The quick brown \\\n       fox.\"\"\"\nwinpath = 'C:\\Users\\nodejs\\templates'\nregex2 = '''I [dw]on't need \\d{2} apples'''\nstr7 = \"\"\"\"This,\" she said, \"is just a pointless statement.\"\"\"\"\n", version: "1.0.0", data: "{\"T\":{\"str\":{\"s\":\"I'm a string. \\\"You can quote me\\\". Name\\tJosé\\nLocation\\tSF.\"},\"str2\":{\"s\":\"Roses are red\\nViolets are blue\"},\"str3\":{\"s\":\"The quick brown fox.\"},\"winpath\":{\"s\":\"C:\\\\Users\\\\nodejs\\\\templates\"},\"regex2\":{\"s\":\"I [dw]on't need \\\\d{2} apples\"},\"str7\":{\"s\":\"\\\"This,\\\" she said, \\\"is just a pointless statement.\\\"\"}}}", features: [], error: null }, // tomllib (TOML 1.0.0)
  { id: "numbers", input: "int1 = +99\nint4 = -17\nint6 = 5_349_221\nhex3 = 0xdead_beef\noct2 = 0o755\nbin1 = 0b11010110\nbig = 18446744073709551616\nflt3 = -0.01\nflt7 = 6.626e-34\nflt8 = 224_617.445_991_228\nsf1 = inf\nsf6 = -nan\nz = -0.0\n", version: "1.0.0", data: "{\"T\":{\"int1\":{\"i\":\"99\"},\"int4\":{\"i\":\"-17\"},\"int6\":{\"i\":\"5349221\"},\"hex3\":{\"i\":\"3735928559\"},\"oct2\":{\"i\":\"493\"},\"bin1\":{\"i\":\"214\"},\"big\":{\"i\":\"18446744073709551616\"},\"flt3\":{\"f\":\"-0.01\"},\"flt7\":{\"f\":\"6.626e-34\"},\"flt8\":{\"f\":\"224617.445991228\"},\"sf1\":{\"f\":\"inf\"},\"sf6\":{\"f\":\"nan\"},\"z\":{\"f\":\"-0.0\"}}}", features: [], error: null }, // tomllib (TOML 1.0.0)
  { id: "dates", input: "odt1 = 1979-05-27T07:32:00Z\nodt3 = 1979-05-27T00:32:00.999999-07:00\nodt4 = 1979-05-27 07:32:00Z\nldt1 = 1979-05-27T07:32:00\nld1 = 1979-05-27\nlt2 = 00:32:00.999999\nleap = 2000-02-29\n", version: "1.0.0", data: "{\"T\":{\"odt1\":{\"dt\":\"offset-date-time\",\"iso\":\"1979-05-27T07:32:00+00:00\"},\"odt3\":{\"dt\":\"offset-date-time\",\"iso\":\"1979-05-27T00:32:00.999999-07:00\"},\"odt4\":{\"dt\":\"offset-date-time\",\"iso\":\"1979-05-27T07:32:00+00:00\"},\"ldt1\":{\"dt\":\"local-date-time\",\"iso\":\"1979-05-27T07:32:00\"},\"ld1\":{\"dt\":\"local-date\",\"iso\":\"1979-05-27\"},\"lt2\":{\"dt\":\"local-time\",\"iso\":\"00:32:00.999999\"},\"leap\":{\"dt\":\"local-date\",\"iso\":\"2000-02-29\"}}}", features: [], error: null }, // tomllib (TOML 1.0.0)
  { id: "arrays", input: "integers = [ 1, 2, 3 ]\nnested_mixed_array = [ [ 1, 2 ], [\"a\", \"b\", \"c\"] ]\nnumbers = [ 0.1, 0.2, 0.5, 1, 2, 5 ]\nintegers3 = [\n  1,\n  2, # this is ok\n]\n", version: "1.0.0", data: "{\"T\":{\"integers\":{\"A\":[{\"i\":\"1\"},{\"i\":\"2\"},{\"i\":\"3\"}]},\"nested_mixed_array\":{\"A\":[{\"A\":[{\"i\":\"1\"},{\"i\":\"2\"}]},{\"A\":[{\"s\":\"a\"},{\"s\":\"b\"},{\"s\":\"c\"}]}]},\"numbers\":{\"A\":[{\"f\":\"0.1\"},{\"f\":\"0.2\"},{\"f\":\"0.5\"},{\"i\":\"1\"},{\"i\":\"2\"},{\"i\":\"5\"}]},\"integers3\":{\"A\":[{\"i\":\"1\"},{\"i\":\"2\"}]}}}", features: [], error: null }, // tomllib (TOML 1.0.0)
  { id: "tables", input: "[dog.\"tater.man\"]\ntype.name = \"pug\"\n[ j . \"ʞ\" . 'l' ]\n[x.y.z.w]\n[x]\n", version: "1.0.0", data: "{\"T\":{\"dog\":{\"T\":{\"tater.man\":{\"T\":{\"type\":{\"T\":{\"name\":{\"s\":\"pug\"}}}}}}},\"j\":{\"T\":{\"ʞ\":{\"T\":{\"l\":{\"T\":{}}}}}},\"x\":{\"T\":{\"y\":{\"T\":{\"z\":{\"T\":{\"w\":{\"T\":{}}}}}}}}}}", features: [], error: null }, // tomllib (TOML 1.0.0)
  { id: "dotted-subtable", input: "[fruit]\napple.color = \"red\"\napple.taste.sweet = true\n[fruit.apple.texture]\nsmooth = true\n", version: "1.0.0", data: "{\"T\":{\"fruit\":{\"T\":{\"apple\":{\"T\":{\"color\":{\"s\":\"red\"},\"taste\":{\"T\":{\"sweet\":{\"b\":true}}},\"texture\":{\"T\":{\"smooth\":{\"b\":true}}}}}}}}}", features: [], error: null }, // tomllib (TOML 1.0.0)
  { id: "inline", input: "name = { first = \"Tom\", last = \"Preston-Werner\" }\nanimal = { type.name = \"pug\" }\n", version: "1.0.0", data: "{\"T\":{\"name\":{\"T\":{\"first\":{\"s\":\"Tom\"},\"last\":{\"s\":\"Preston-Werner\"}}},\"animal\":{\"T\":{\"type\":{\"T\":{\"name\":{\"s\":\"pug\"}}}}}}}", features: [], error: null }, // tomllib (TOML 1.0.0)
  { id: "aot", input: "[[fruits]]\nname = \"apple\"\n[fruits.physical]\ncolor = \"red\"\n[[fruits.varieties]]\nname = \"red delicious\"\n[[fruits]]\nname = \"banana\"\n", version: "1.0.0", data: "{\"T\":{\"fruits\":{\"A\":[{\"T\":{\"name\":{\"s\":\"apple\"},\"physical\":{\"T\":{\"color\":{\"s\":\"red\"}}},\"varieties\":{\"A\":[{\"T\":{\"name\":{\"s\":\"red delicious\"}}}]}}},{\"T\":{\"name\":{\"s\":\"banana\"}}}]}}}", features: [], error: null }, // tomllib (TOML 1.0.0)
  { id: "crlf", input: "a = 1\r\nb = \"\"\"x\r\ny\"\"\"\r\n", version: "1.0.0", data: "{\"T\":{\"a\":{\"i\":\"1\"},\"b\":{\"s\":\"x\\ny\"}}}", features: [], error: null }, // tomllib (TOML 1.0.0)
  { id: "pyproject", input: "[build-system]\nrequires = [\"hatchling >= 1.26\"]\nbuild-backend = \"hatchling.build\"\n\n[project]\nname = \"netcheck\"\nversion = \"0.1.0\"\ndependencies = []\n\n[project.scripts]\nnetcheck = \"netcheck:main\"\n", version: "1.0.0", data: "{\"T\":{\"build-system\":{\"T\":{\"requires\":{\"A\":[{\"s\":\"hatchling >= 1.26\"}]},\"build-backend\":{\"s\":\"hatchling.build\"}}},\"project\":{\"T\":{\"name\":{\"s\":\"netcheck\"},\"version\":{\"s\":\"0.1.0\"},\"dependencies\":{\"A\":[]},\"scripts\":{\"T\":{\"netcheck\":{\"s\":\"netcheck:main\"}}}}}}}", features: [], error: null }, // tomllib (TOML 1.0.0)
  { id: "err-twice", input: "name = \"Tom\"\nname = \"Pradyun\"\n", version: null, data: null, features: [], error: ["duplicate-key",2,1] }, // refused by both; tomllib: Cannot overwrite a value (at line 2, column 17)
  { id: "err-quoted-same", input: "spelling = \"favorite\"\n\"spelling\" = \"favourite\"\n", version: null, data: null, features: [], error: ["duplicate-key",2,1] }, // refused by both; tomllib: Cannot overwrite a value (at line 2, column 25)
  { id: "err-value-to-table", input: "fruit.apple = 1\nfruit.apple.smooth = true\n", version: null, data: null, features: [], error: ["not-a-table",2,1] }, // refused by both; tomllib: Cannot overwrite a value (at line 2, column 26)
  { id: "err-table-twice", input: "[fruit]\napple = \"red\"\n[fruit]\norange = \"orange\"\n", version: null, data: null, features: [], error: ["table-redefined",3,1] }, // refused by both; tomllib: Cannot declare ('fruit',) twice (at line 3, column 7)
  { id: "err-table-over-key", input: "[fruit]\napple = \"red\"\n[fruit.apple]\ntexture = \"smooth\"\n", version: null, data: null, features: [], error: ["not-a-table",3,1] }, // refused by both; tomllib: Cannot overwrite a value (at line 3, column 13)
  { id: "err-header-over-dotted", input: "[fruit]\napple.color = \"red\"\n[fruit.apple]\n", version: null, data: null, features: [], error: ["table-redefined",3,1] }, // refused by both; tomllib: Cannot declare ('fruit', 'apple') twice (at line 3, column 13)
  { id: "err-inline-extend", input: "[product]\ntype = { name = \"Nail\" }\ntype.edible = false\n", version: null, data: null, features: [], error: ["immutable",3,1] }, // refused by both; tomllib: Cannot mutate immutable namespace ('product', 'type') (at line 3, column 20)
  { id: "err-inline-over-table", input: "[product]\ntype.name = \"Nail\"\ntype = { edible = false }\n", version: null, data: null, features: [], error: ["duplicate-key",3,1] }, // refused by both; tomllib: Cannot overwrite a value (at line 3, column 26)
  { id: "err-aot-static", input: "fruits = []\n[[fruits]]\n", version: null, data: null, features: [], error: ["immutable",2,1] }, // refused by both; tomllib: Cannot mutate immutable namespace ('fruits',) (at line 2, column 9)
  { id: "err-table-over-aot", input: "[[fruits]]\nname = \"apple\"\n[[fruits.varieties]]\nname = \"red delicious\"\n[fruits.varieties]\nname = \"granny smith\"\n", version: null, data: null, features: [], error: ["table-redefined",5,1] }, // refused by both; tomllib: Cannot declare ('fruits', 'varieties') twice (at line 5, column 18)
  { id: "err-float", input: "invalid_float_2 = 7.\n", version: null, data: null, features: [], error: ["bad-number",1,19] }, // refused by both; tomllib: Expected newline or end of document after a statement (at line 1, column 20)
  { id: "err-leading-zero", input: "n = 012\n", version: null, data: null, features: [], error: ["bad-number",1,5] }, // refused by both; tomllib: Expected newline or end of document after a statement (at line 1, column 6)
  { id: "err-escape", input: "k = \"\\q\"\n", version: null, data: null, features: [], error: ["bad-escape",1,6] }, // refused by both; tomllib: Unescaped '\' in a string (at line 1, column 8)
  { id: "err-two-per-line", input: "first = \"Tom\" last = \"Preston-Werner\"\n", version: null, data: null, features: [], error: ["expected-newline",1,15] }, // refused by both; tomllib: Expected newline or end of document after a statement (at line 1, column 15)
  { id: "err-no-value", input: "key = # INVALID\n", version: null, data: null, features: [], error: ["expected-value",1,7] }, // refused by both; tomllib: Invalid value (at line 1, column 7)
  { id: "err-bom", input: "﻿a = 1\n", version: null, data: null, features: [], error: ["bom",1,1] }, // refused by both; tomllib: Invalid statement (at line 1, column 1)
  { id: "err-bare-cr", input: "a = 1\rb = 2\n", version: null, data: null, features: [], error: ["bare-cr",1,6] }, // refused by both; tomllib: Expected newline or end of document after a statement (at line 1, column 6)
  { id: "err-date", input: "d = 2001-02-29\n", version: null, data: null, features: [], error: ["bad-date-time",1,5] }, // refused by both; tomllib: Invalid date or datetime (at line 1, column 5)
  { id: "err-second-60", input: "t = 1979-05-27T23:59:60Z\n", version: null, data: null, features: [], error: ["bad-date-time",1,16] }, // refused by both; tomllib: Expected newline or end of document after a statement (at line 1, column 15)
  { id: "err-comment-del", input: "a = 1 # \n", version: null, data: null, features: [], error: ["bad-character",1,9] }, // refused by both; tomllib: Found invalid character '\x7f' (at line 1, column 9)
  { id: "v11-inline", input: "tbl = {\n    key      = \"a string\",\n    moar-tbl =  {\n        key = 1,\n    },\n}\n", version: "1.1.0", data: "{\"T\":{\"tbl\":{\"T\":{\"key\":{\"s\":\"a string\"},\"moar-tbl\":{\"T\":{\"key\":{\"i\":\"1\"}}}}}}}", features: ["inline-newline","inline-trailing-comma"], error: null }, // refused by tomllib, read by tomli 2.5.0 (TOML 1.1.0)
  { id: "v11-escapes", input: "null = \"null byte: \\x00; letter a: \\x61\"\ncsi = \"\\e[\"\n", version: "1.1.0", data: "{\"T\":{\"null\":{\"s\":\"null byte: \\u0000; letter a: a\"},\"csi\":{\"s\":\"\\u001b[\"}}}", features: ["escape-x","escape-e"], error: null }, // refused by tomllib, read by tomli 2.5.0 (TOML 1.1.0)
  { id: "v11-times", input: "dt = 2010-02-03 14:15\nt  = 14:15\n", version: "1.1.0", data: "{\"T\":{\"dt\":{\"dt\":\"local-date-time\",\"iso\":\"2010-02-03T14:15:00\"},\"t\":{\"dt\":\"local-time\",\"iso\":\"14:15:00\"}}}", features: ["time-without-seconds"], error: null }, // refused by tomllib, read by tomli 2.5.0 (TOML 1.1.0)
]; // TOML_VECTORS

/** A dependency specifier: packaging 26.3's reading (name, extras, clauses sorted as it prints them, URL present, marker in its normal form), or the engine's error code. */
export interface RequirementVector { input: string; ok: boolean; name: string; extras: string[]; spec: string[]; hasUrl: boolean; marker: string | null; error: RequirementErrorCode | null } // one row

/** Dependency specifiers, many of them the specification's own examples and test strings. */
export const REQUIREMENT_VECTORS: RequirementVector[] = [
  { input: "requests [security,tests] >= 2.8.1, == 2.8.* ; python_version < \"3.7\"", ok: true, name: "requests", extras: ["security","tests"], spec: ["==2.8.*",">=2.8.1"], hasUrl: false, marker: "python_version < \"3.7\"", error: null }, // packaging 26.3
  { input: "pip @ https://github.com/pypa/pip/archive/1.3.1.zip#sha1=da9234ee9982d4bbb3c72346a6de940a148ea686", ok: true, name: "pip", extras: [], spec: [], hasUrl: true, marker: null, error: null }, // packaging 26.3
  { input: "name; os_name=='a' and os_name=='b' or os_name=='c'", ok: true, name: "name", extras: [], spec: [], hasUrl: false, marker: "os_name == \"a\" and os_name == \"b\" or os_name == \"c\"", error: null }, // packaging 26.3
  { input: "name; os_name=='a' and (os_name=='b' or os_name=='c')", ok: true, name: "name", extras: [], spec: [], hasUrl: false, marker: "os_name == \"a\" and (os_name == \"b\" or os_name == \"c\")", error: null }, // packaging 26.3
  { input: "name; os_name=='a' or os_name=='b' and os_name=='c'", ok: true, name: "name", extras: [], spec: [], hasUrl: false, marker: "os_name == \"a\" or os_name == \"b\" and os_name == \"c\"", error: null }, // packaging 26.3
  { input: "pywin32 >1.0; sys_platform == 'win32'", ok: true, name: "pywin32", extras: [], spec: [">1.0"], hasUrl: false, marker: "sys_platform == \"win32\"", error: null }, // packaging 26.3
  { input: "zope.interface (>3.5.0)", ok: true, name: "zope.interface", extras: [], spec: [">3.5.0"], hasUrl: false, marker: null, error: null }, // packaging 26.3
  { input: "A.B-C_D", ok: true, name: "A.B-C_D", extras: [], spec: [], hasUrl: false, marker: null, error: null }, // packaging 26.3
  { input: "name>=3,", ok: true, name: "name", extras: [], spec: [">=3"], hasUrl: false, marker: null, error: null }, // packaging 26.3
  { input: "name [fred,bar] @ http://foo.com ; python_version=='2.7'", ok: true, name: "name", extras: ["bar","fred"], spec: [], hasUrl: true, marker: "python_version == \"2.7\"", error: null }, // packaging 26.3
  { input: "hatchling >= 1.26", ok: true, name: "hatchling", extras: [], spec: [">=1.26"], hasUrl: false, marker: null, error: null }, // packaging 26.3
  { input: "cryptography == 50.0.2", ok: true, name: "cryptography", extras: [], spec: ["==50.0.2"], hasUrl: false, marker: null, error: null }, // packaging 26.3
  { input: "foo; os.name == 'nt'", ok: true, name: "foo", extras: [], spec: [], hasUrl: false, marker: "os_name == \"nt\"", error: null }, // packaging 26.3
  { input: "foo; \"dev\" not in dependency_groups", ok: true, name: "foo", extras: [], spec: [], hasUrl: false, marker: "\"dev\" not in dependency_groups", error: null }, // packaging 26.3
  { input: "foo; extra == 'Test_Me'", ok: true, name: "foo", extras: [], spec: [], hasUrl: false, marker: "extra == \"test-me\"", error: null }, // packaging 26.3
  { input: "foo>=1.0 <2", ok: false, name: "", extras: [], spec: [], hasUrl: false, marker: null, error: "bad-specifier" }, // refused by packaging too
  { input: "foo-", ok: false, name: "", extras: [], spec: [], hasUrl: false, marker: null, error: "trailing" }, // refused by packaging too
  { input: "foo; python_version < 3.8", ok: false, name: "", extras: [], spec: [], hasUrl: false, marker: null, error: "bad-marker" }, // refused by packaging too
  { input: "foo @", ok: false, name: "", extras: [], spec: [], hasUrl: false, marker: null, error: "expected-url" }, // refused by packaging too
  { input: "foo==1.0a1.*", ok: false, name: "", extras: [], spec: [], hasUrl: false, marker: null, error: "bad-specifier" }, // refused by packaging too
  { input: "foo>=1.0+l", ok: false, name: "", extras: [], spec: [], hasUrl: false, marker: null, error: "bad-specifier" }, // refused by packaging too
  { input: "foo @ https://x/y.whl;python_version>'3'", ok: true, name: "foo", extras: [], spec: [], hasUrl: true, marker: null, error: null }, // packaging 26.3
  { input: "foo; os_name == 'a' and", ok: false, name: "", extras: [], spec: [], hasUrl: false, marker: null, error: "bad-marker" }, // refused by packaging too
  { input: "foo[a", ok: false, name: "", extras: [], spec: [], hasUrl: false, marker: null, error: "bad-extras" }, // refused by packaging too
]; // REQUIREMENT_VECTORS

/** License expressions: packaging 26.3's canonical form, or refused (the License Expression page's own valid and invalid examples among them). */
export const LICENSE_VECTORS: Array<{ input: string; valid: boolean; canonical: string; error: LicenseErrorCode | null }> = [
  { input: "MIT", valid: true, canonical: "MIT", error: null }, // packaging 26.3
  { input: "mit", valid: true, canonical: "MIT", error: null }, // packaging 26.3
  { input: "BSD-3-Clause", valid: true, canonical: "BSD-3-Clause", error: null }, // packaging 26.3
  { input: "MIT AND (Apache-2.0 OR BSD-2-Clause)", valid: true, canonical: "MIT AND (Apache-2.0 OR BSD-2-Clause)", error: null }, // packaging 26.3
  { input: "MIT OR GPL-2.0-or-later OR (FSFUL AND BSD-2-Clause)", valid: true, canonical: "MIT OR GPL-2.0-or-later OR (FSFUL AND BSD-2-Clause)", error: null }, // packaging 26.3
  { input: "GPL-3.0-only WITH Classpath-Exception-2.0 OR BSD-3-Clause", valid: true, canonical: "GPL-3.0-only WITH Classpath-exception-2.0 OR BSD-3-Clause", error: null }, // packaging 26.3
  { input: "LicenseRef-Special-License OR CC0-1.0 OR Unlicense", valid: true, canonical: "LicenseRef-Special-License OR CC0-1.0 OR Unlicense", error: null }, // packaging 26.3
  { input: "LicenseRef-Proprietary", valid: true, canonical: "LicenseRef-Proprietary", error: null }, // packaging 26.3
  { input: "Use-it-after-midnight", valid: false, canonical: "", error: "unknown-license" }, // packaging 26.3
  { input: "Apache-2.0 OR 2-BSD-Clause", valid: false, canonical: "", error: "unknown-license" }, // packaging 26.3
  { input: "LicenseRef-License with spaces", valid: false, canonical: "", error: "unknown-exception" }, // packaging 26.3
  { input: "LicenseRef-License_with_underscores", valid: false, canonical: "", error: "bad-license-ref" }, // packaging 26.3
  { input: "mit or apache-2.0", valid: true, canonical: "MIT OR Apache-2.0", error: null }, // packaging 26.3
  { input: "GPL-2.0+", valid: true, canonical: "GPL-2.0+", error: null }, // packaging 26.3
  { input: "MIT OR", valid: false, canonical: "", error: "syntax" }, // packaging 26.3
  { input: "(MIT", valid: false, canonical: "", error: "syntax" }, // packaging 26.3
]; // LICENSE_VECTORS

/** A pyproject.toml and every finding it must produce: [code, severity, path, line], in the engine's order. */
export interface ExplainVector { id: string; input: string; status: "ok" | "toml-error"; findings: Array<[FindingCode, Severity, string, number]> } // one row

/** Documents that exercise every rule; expected findings written by the engine and read one by one against the rules before freezing. */
export const EXPLAIN_VECTORS: ExplainVector[] = [
  { id: "example", input: "[build-system]\nrequires = [\"hatchling >= 1.26\"]\nbuild-backend = \"hatchling.build\"\n\n[project]\nname = \"netcheck\"\nversion = \"0.1.0\"\ndescription = \"Summarise a list of prefixes\"\nreadme = \"README.md\"\nrequires-python = \">= 3.11\"\nlicense = \"mit\"\nlicense-files = [\"LICEN[CS]E*\"]\nauthors = [{ name = \"Ana Lima\", email = \"ana@example.com\" }]\nclassifiers = [\"Programming Language :: Python :: 3\", \"License :: OSI Approved :: MIT License\"]\ndependencies = [\n  \"requests >= 2.32, < 3\",\n  \"cryptography == 50.0.2\",\n  \"pywin32; sys_platform == 'win32'\",\n  \"colorama; os_name > 'nt'\",\n]\ndynamic = [\"dependencies\"]\n\n[project.optional-dependencies]\ntest = [\"pytest >= 8\"]\nDev_Tools = [\"netcheck[test]\", \"ruff\"]\n\n[project.scripts]\nnetcheck = \"netcheck:main\"\n\n[project.urls]\nHomepage = \"https://example.com/netcheck\"\n\"Source Code\" = \"https://example.com/netcheck.git\"\n\n[dependency-groups]\nlint = [\"ruff >= 0.7\"]\nci = [{include-group = \"lint\"}, \"pytest\"]\n\n[tool.ruff]\nline-length = 100\n[tool.ruff.lint]\nselect = [\"E\", \"F\"]\n", status: "ok", findings: [["license-classifier-with-expression","warning","project.license",11],["license-classifier","warning","project.classifiers[1]",14],["requirement-strict-pin","warning","project.dependencies[1]",17],["requirement-marker","warning","project.dependencies[3]",19],["extra-not-normalized","warning","project.optional-dependencies.Dev_Tools",25],["license-not-canonical","note","project.license",11],["static-and-dynamic-extensible","note","project.dependencies",15],["self-reference","note","project.optional-dependencies.Dev_Tools[0]",25]] }, // the page's Example: every table, a few warnings
  { id: "minimal", input: "[build-system]\nrequires = [\"hatchling >= 1.26\"]\nbuild-backend = \"hatchling.build\"\n\n[project]\nname = \"netcheck\"\nversion = \"0.1.0\"\ndescription = \"Summarise a list of prefixes\"\nrequires-python = \">= 3.11\"\ndependencies = []\n\n[project.scripts]\nnetcheck = \"netcheck:main\"\n", status: "ok", findings: [] }, // the Learn article's project
  { id: "tool-only", input: "[tool.ruff]\nline-length = 100\n", status: "ok", findings: [["no-build-system","note","build-system",0],["no-project","note","project",0]] }, // a file that only configures tools
  { id: "required", input: "[build-system]\nrequires = [\"setuptools\"]\n[project]\ndescription = \"x\"\n", status: "ok", findings: [["name-missing","error","project.name",3],["version-missing","error","project.version",3],["bs-backend-missing","note","build-system.build-backend",1]] }, // name and version missing
  { id: "dynamic", input: "[build-system]\nrequires = [\"setuptools>=77\"]\nbuild-backend = \"setuptools.build_meta\"\n[project]\nname = \"demo\"\ndescription = \"One line\"\ndependencies = [\"requests\"]\ndynamic = [\"name\", \"version\", \"description\", \"dependencies\", \"colour\", \"version\"]\n", status: "ok", findings: [["static-and-dynamic","error","project.description",6],["dynamic-unknown","error","project.dynamic",8],["name-dynamic","error","project.dynamic",8],["dynamic-duplicate","warning","project.dynamic",8],["static-and-dynamic-extensible","note","project.dependencies",7]] }, // name dynamic; description static and dynamic; dependencies extensible; unknown and duplicate entries
  { id: "name-version", input: "[project]\nname = \"-demo_\"\nversion = \"1.0-RC1+Local.1\"\n", status: "ok", findings: [["name-invalid","error","project.name",2],["version-not-normalized","warning","project.version",3],["no-build-system","note","build-system",0],["version-local","note","project.version",3]] }, // an invalid name, a version that is not normalized, a local version
  { id: "readme", input: "[project]\nname = \"a\"\nversion = \"1\"\nreadme = \"README.txt\"\n", status: "ok", findings: [["readme-suffix","error","project.readme",4],["no-build-system","note","build-system",0]] }, // readme suffix, table rules, content type, charset
  { id: "readme-table", input: "[project]\nname = \"a\"\nversion = \"1\"\nreadme = { file = \"README.md\", text = \"Hi\", content-type = \"text/html; charset=latin-1\" }\n", status: "ok", findings: [["readme-both","error","project.readme",4],["readme-content-type-unsupported","error","project.readme.content-type",4],["readme-charset","warning","project.readme.content-type",4],["no-build-system","note","build-system",0]] }, // a readme table with file and text, an unsupported type and a charset
  { id: "license", input: "[project]\nname = \"a\"\nversion = \"1\"\nlicense = \"MIT OR Use-it-after-midnight\"\nlicense-files = [\"../LICENSE\", \"/abs/LICENSE\", \"LICEN{CSE*\", \"licenses/*\"]\nclassifiers = [\"License :: OSI Approved :: MIT License\"]\n", status: "ok", findings: [["license-invalid","error","project.license",4],["license-files-invalid","error","project.license-files[0]",5],["license-files-invalid","error","project.license-files[1]",5],["license-files-invalid","error","project.license-files[2]",5],["license-classifier-with-expression","warning","project.license",4],["license-classifier","warning","project.classifiers[0]",6],["no-build-system","note","build-system",0]] }, // an invalid expression, License classifiers, bad globs
  { id: "license-table", input: "[project]\nname = \"a\"\nversion = \"1\"\nlicense = { file = \"LICENSE\", text = \"MIT\" }\n", status: "ok", findings: [["license-table-both","error","project.license",4],["license-table","warning","project.license",4],["no-build-system","note","build-system",0]] }, // the deprecated table with both keys
  { id: "people", input: "[project]\nname = \"a\"\nversion = \"1\"\nauthors = [{}, { name = \"Lima, Ana\" }, { email = \"not-an-address\" }, { name = \"Bia\", email = \"bia@example.org\", url = \"https://example.org\" }]\nmaintainers = [{ name = \"Caio\", email = \"caio@example.org\" }]\n", status: "ok", findings: [["person-empty","error","project.authors[0]",4],["person-name-comma","error","project.authors[1].name",4],["person-email-invalid","warning","project.authors[2].email",4],["person-unknown-key","warning","project.authors[3].url",4],["no-build-system","note","build-system",0]] }, // authors and maintainers
  { id: "urls-scripts", input: "[project]\nname = \"a\"\nversion = \"1\"\n[project.urls]\n\"A label that is far too long for core metadata\" = \"https://example.org\"\nDocs = \"example.org/docs\"\n[project.scripts]\nok = \"pkg.cli:main\"\nbad = \"pkg.cli:main()\"\n[project.entry-points.console_scripts]\nx = \"pkg:x\"\n[project.entry-points.\"my-plugins\"]\ny = \"pkg:y\"\n[project.entry-points.good]\nz = { nested = \"pkg:z\" }\n", status: "ok", findings: [["url-label-long","error","project.urls.A label that is far too long for core metadata",5],["entry-point-reference","error","project.scripts.bad",9],["entry-points-reserved-group","error","project.entry-points.console_scripts",10],["entry-points-group-name","error","project.entry-points.my-plugins",12],["entry-points-nested","error","project.entry-points.good.z",15],["url-no-scheme","warning","project.urls.Docs",6],["no-build-system","note","build-system",0]] }, // URL labels, entry points
  { id: "dependencies", input: "[project]\nname = \"demo\"\nversion = \"1\"\ndependencies = [\n  \"requests>=2 <3\",\n  \"pinned == 1.0\",\n  \"legacy === 1.0-foo\",\n  \"lib @ http://example.org/lib-1.0.tar.gz\",\n  \"lib2 @ https://example.org/lib2.whl;python_version>'3'\",\n  \"a; \\\"dev\\\" in dependency_groups\",\n  \"b; os_name > \\\"nt\\\"\",\n  \"c; python_version in \\\"3.12 3.13\\\"\",\n  \"d; extra != \\\"x\\\"\",\n  \"e[Dev_Tools]\",\n  \"zope.interface (>3.5.0)\",\n  \"demo[gui]\",\n]\n[project.optional-dependencies]\ncli = [\"click\"]\n", status: "ok", findings: [["requirement-invalid","error","project.dependencies[0]",5],["requirement-strict-pin","warning","project.dependencies[1]",6],["requirement-arbitrary","warning","project.dependencies[2]",7],["requirement-direct-url","warning","project.dependencies[3]",8],["requirement-url-unverified","warning","project.dependencies[3]",8],["requirement-direct-url","warning","project.dependencies[4]",9],["requirement-url-semicolon","warning","project.dependencies[4]",9],["requirement-url-unverified","warning","project.dependencies[4]",9],["requirement-marker","warning","project.dependencies[5]",10],["requirement-marker","warning","project.dependencies[6]",11],["requirement-marker","warning","project.dependencies[7]",12],["requirement-marker","warning","project.dependencies[8]",13],["requirement-extra-name","warning","project.dependencies[9]",14],["self-extra-unknown","warning","project.dependencies[11]",16],["no-build-system","note","build-system",0],["requirement-parenthesized","note","project.dependencies[10]",15],["self-reference","note","project.dependencies[11]",16]] }, // requirement errors and warnings
  { id: "extras", input: "[project]\nname = \"a\"\nversion = \"1\"\n[project.optional-dependencies]\n\"-bad\" = []\nDev_Tools = [\"ruff\"]\ndev-tools = [\"black\"]\n", status: "ok", findings: [["extra-invalid","error","project.optional-dependencies.-bad",5],["extra-clash","error","project.optional-dependencies.dev-tools",7],["extra-not-normalized","warning","project.optional-dependencies.Dev_Tools",6],["no-build-system","note","build-system",0]] }, // extra names: invalid, not normalized, clashing
  { id: "import-names", input: "[project]\nname = \"zope-interface\"\nversion = \"1\"\nimport-names = [\"zope.interface\", \"_private ; private\", \"1bad\", \"x ; secret\"]\nimport-namespaces = [\"zope\", \"zope.interface\"]\n", status: "ok", findings: [["import-name-invalid","error","project.import-names[2]",4],["import-name-invalid","error","project.import-names[3]",4],["import-name-both","error","project.import-names",4],["no-build-system","note","build-system",0]] }, // PEP 794
  { id: "groups", input: "[project]\nname = \"a\"\nversion = \"1\"\n[project.optional-dependencies]\ntest = [\"pytest\"]\n[dependency-groups]\ntest = [\"pytest>7\"]\nlint = [{include-group = \"docs\"}, {include-group = \"nowhere\"}]\ndocs = [{include-group = \"lint\"}, 42]\nLint = [\"ruff\"]\n\"-x\" = []\n", status: "ok", findings: [["group-include-unknown","error","dependency-groups.lint",8],["group-cycle","error","dependency-groups.lint",8],["group-name-invalid","error","dependency-groups.-x",11],["group-matches-extra","warning","dependency-groups.test",7],["group-item-invalid","warning","dependency-groups.docs[1]",9],["group-duplicate","warning","dependency-groups.Lint",10],["no-build-system","note","build-system",0]] }, // dependency groups
  { id: "build-system", input: "[build-system]\nbuild-backend = \"my backend\"\nbackend-path = [\"../outside\", \"backend\"]\nuse-isolation = true\n[tool]\nflag = true\n[tool.black]\nline-length = 88\n[bogus]\nx = 1\n", status: "ok", findings: [["bs-requires-missing","error","build-system.requires",1],["bs-backend-invalid","error","build-system.build-backend",2],["bs-backend-path-outside","error","build-system.backend-path[0]",3],["bs-unknown-key","warning","build-system.use-isolation",4],["tool-not-table","warning","tool.flag",6],["unknown-top-level","warning","bogus",9],["no-project","note","project",0]] }, // build-system rules, [tool] and other tables
  { id: "types", input: "[build-system]\nrequires = \"setuptools\"\n[project]\nname = 1\nversion = \"1\"\nkeywords = \"a, b\"\nurls = [\"https://example.org\"]\n", status: "ok", findings: [["wrong-type","error","build-system.requires",2],["wrong-type","error","project.name",4],["wrong-type","error","project.keywords",6],["wrong-type","error","project.urls",7],["bs-backend-missing","note","build-system.build-backend",1]] }, // wrong types
  { id: "toml-1-1", input: "[project]\nname = \"a\"\nversion = \"1\"\nauthors = [\n  {\n    name = \"Ana\",\n  },\n]\n", status: "ok", findings: [["toml-1-1","warning","",5],["no-build-system","note","build-system",0]] }, // TOML 1.1.0 syntax
  { id: "not-toml", input: "[project]\nname = \"a\"\nname = \"b\"\n", status: "toml-error", findings: [] }, // not TOML at all
]; // EXPLAIN_VECTORS

export { EXAMPLE_PYPROJECT }; // re-exported
/** The OpenAPI example and the input detector's example: the Learn article's project (EXPLAIN_VECTORS "minimal"). */
export const API_EXAMPLE = EXPLAIN_VECTORS[1].input; // a short, valid file

// ---------------------------------------------------------------------------
// The runner
// ---------------------------------------------------------------------------

/**
 * A date or time as Python's isoformat() prints it (how tomllib's values were tagged).
 * @param kind the TOML kind
 * @param raw the text as written
 * @returns the isoformat text
 */
function iso(kind: string, raw: string): string {
  // Times: seconds default to 00 (TOML 1.1.0), fractions truncated to microseconds and printed only when not zero.
  const time = (t: string): string => { // HH:MM[:SS[.frac]]
    const [hm, frac] = t.split("."); // fraction apart
    const p = hm.split(":"); // parts
    const base = `${p[0]}:${p[1]}:${p[2] ?? "00"}`; // seconds default
    const us = frac ? frac.slice(0, 6).padEnd(6, "0") : "000000"; // microseconds
    return us === "000000" ? base : `${base}.${us}`; // printed only when not zero
  }; // time
  if (kind === "local-date") return raw; // YYYY-MM-DD
  if (kind === "local-time") return time(raw); // the time
  let rest = raw.slice(11); // after the date and the delimiter
  let off = ""; // the offset
  if (kind === "offset-date-time") { // split it off
    if (rest.endsWith("Z") || rest.endsWith("z")) { rest = rest.slice(0, -1); off = "+00:00"; } // UTC
    else { off = rest.slice(-6); rest = rest.slice(0, -6); if (off.slice(1) === "00:00") off = "+00:00"; } // numeric
  } // offset
  return `${raw.slice(0, 10)}T${time(rest)}${off}`; // isoformat
} // iso

/**
 * A parsed value as the oracle's tagged JSON (floats as Python's repr).
 * @param v the value
 * @returns the tagged value
 */
function canon(v: TomlValue): unknown {
  // One tag per type.
  switch (v.t) { // by type
    case "string": return { s: v.v }; // string
    case "integer": return { i: v.v }; // exact integer
    case "float": return { f: Number.isNaN(v.v) ? "nan" : v.v === Infinity ? "inf" : v.v === -Infinity ? "-inf" : Object.is(v.v, -0) ? "-0.0" : pyRepr(v.v) }; // repr()
    case "boolean": return { b: v.v }; // boolean
    case "datetime": return { dt: v.kind, iso: iso(v.kind, v.raw) }; // date-time
    case "array": return { A: v.items.map(canon) }; // array
    case "table": return { T: Object.fromEntries([...v.entries].map(([k, x]) => [k, canon(x)])) }; // table, insertion order
  } // switch
} // canon

/**
 * Python's repr() of a float, for the values in these vectors (shortest round-trip digits; exponent form below 1e-4
 * and from 1e16, as Python writes it).
 * @param x a finite number
 * @returns the repr text
 */
function pyRepr(x: number): string {
  // JavaScript's shortest round-trip digits, then Python's layout.
  const ax = Math.abs(x); // magnitude
  if (ax !== 0 && (ax < 1e-4 || ax >= 1e16)) { // exponent form
    const [m, e] = x.toExponential().split("e"); // mantissa and exponent
    const ex = Number(e); // exponent value
    return `${m}e${ex < 0 ? "-" : "+"}${String(Math.abs(ex)).padStart(2, "0")}`; // 6.626e-34
  } // exponent
  const s = String(x); // plain digits
  return s.includes(".") ? s : `${s}.0`; // 0.5, 224617.445991228, 5.0
} // pyRepr

/**
 * verifyVectors: run every vector; collect every failure.
 * @returns the set id, how many checks ran, how many passed, and the failures
 */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Count every check; keep the failing ones.
  const failures: string[] = []; // failures
  let total = 0; // checks run
  /** Record one check. */
  const check = (ok: boolean, msg: string): void => { total++; if (!ok) failures.push(msg); }; // counted, kept when failed
  for (const v of TOML_VECTORS) { // each document
    const r = parseToml(v.input); // the engine
    if (v.version === null) { check(!r.ok && JSON.stringify([r.error.code, r.error.line, r.error.col]) === JSON.stringify(v.error), `[toml ${v.id}] got ${JSON.stringify(r.ok ? "ok" : r.error)}`); continue; } // refused at the right place
    check(r.ok && r.version === v.version, `[toml ${v.id}] got ${r.ok ? r.version : JSON.stringify(r.error)}`); // read with the right grammar
    if (!r.ok) continue; // nothing more
    check(JSON.stringify(canon(r.root)) === v.data, `[toml ${v.id}] data ${JSON.stringify(canon(r.root))}`); // the same data, key order included
    check(JSON.stringify([...new Set(r.features.map((f) => f.feature))]) === JSON.stringify(v.features), `[toml ${v.id}] features`); // 1.1.0 features
  } // documents
  for (const v of REQUIREMENT_VECTORS) { // each requirement
    const r = parseRequirement(v.input); // the engine
    check(r.ok === v.ok, `[requirement ${v.input}] ok ${r.ok}`); // verdict
    if (!r.ok) { check(r.error.code === v.error, `[requirement ${v.input}] code ${r.error.code}`); continue; } // the code
    const q = r.req; // parsed
    const spec = (q.specifier?.clauses ?? []).map((c) => c.op + c.versionText + (c.wildcard ? ".*" : "")).sort(); // packaging's str() order
    const got = { name: q.name, extras: [...q.extras].sort(), spec, hasUrl: q.url !== null, marker: q.marker ? markerToString(q.marker) : null }; // the engine's view
    const want = { name: v.name, extras: v.extras, spec: v.spec, hasUrl: v.hasUrl, marker: v.marker }; // the vector
    check(JSON.stringify(got) === JSON.stringify(want), `[requirement ${v.input}] got ${JSON.stringify(got)}`); // equal
  } // requirements
  for (const v of LICENSE_VECTORS) { // each expression
    const r = checkLicenseExpression(v.input); // the engine
    check(r.valid === v.valid && r.canonical === v.canonical && (r.error?.code ?? null) === v.error, `[license ${v.input}] got ${JSON.stringify(r)}`); // equal
  } // expressions
  for (const v of EXPLAIN_VECTORS) { // each document
    const r = explainPyproject(v.input); // the engine
    check(r.status === v.status, `[explain ${v.id}] status ${r.status}`); // status
    const got = r.findings.map((f) => [f.code, f.severity, f.path, f.line]); // findings
    check(JSON.stringify(got) === JSON.stringify(v.findings), `[explain ${v.id}] findings ${JSON.stringify(got)}`); // the same, in order
  } // documents
  check(EXPLAIN_VECTORS[0].id === "example" && EXPLAIN_VECTORS[0].input === EXAMPLE_PYPROJECT, "[example] the Example is not EXPLAIN_VECTORS[0]'s input"); // D-83
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures }; // the report
} // verifyVectors
