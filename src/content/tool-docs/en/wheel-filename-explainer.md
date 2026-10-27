## What it does

Paste the file name of a wheel (`.whl`) or a source distribution (`.tar.gz`), or a URL ending in one, and the tool takes it apart: the project name and its normalized form, the version and its PEP 440 normal form, the optional build tag, and every python, ABI and platform tag, with what each one requires. Compressed tag sets are expanded, and each combination says which interpreters and which systems it covers. Open **Check against an interpreter**, describe one (CPython or PyPy, the Python version, a free-threaded build or not, Linux with glibc or musl, macOS or Windows, the C library or macOS version, the architecture), and the tool says whether the wheel installs there and which of its tags wins.

The **Versions** mode reads a list of versions instead: each one parsed and normalized, with what normalization changed, the list sorted in PEP 440 order with equal versions marked, and, when you add a specifier set such as `>= 1.0, != 1.3.*, < 2`, which versions are in range and which an installer takes by default. Everything runs in your browser; a URL is only cut down to its last segment, and nothing is downloaded. It sits beside the [pyproject.toml explainer](/tools/pyproject-toml-explainer), which reads the file that produces these names, and the [Python playground](/tools/python-playground).

## How a file name is read

The binary distribution format gives a wheel's file name as `{distribution}-{version}(-{build tag})?-{python tag}-{abi tag}-{platform tag}.whl`, so a valid name has four or five hyphens. The rules applied here:

- **The name** is a valid project name (ASCII letters, digits, `.`, `_` and `-`, starting and ending with a letter or a digit), compared in its normalized form: lower case, with every run of `-`, `_` and `.` replaced by one `-`. In a file name, tools write it lower case with every such run as a single `_`; tools reading wheels must still accept `.` and upper case from older files, so those are accepted with a warning. A double underscore is refused, as pip refuses it.
- **The version** is a PEP 440 version. Tools write it normalized; a name that is not is accepted with a warning that gives the normal form.
- **The build tag** must start with a digit. It only breaks a tie between wheels identical in everything else, sorting by its leading digits as a number and then by the rest as text. It is not part of the version, and the specification says a release that people must refer to from outside, such as a security fix, should get a new version rather than a build number.
- **A source distribution** is `{name}-{version}.tar.gz` with precisely one hyphen. A name with more hyphens is read the way pip reads it (the version is after the last hyphen) with a warning; a `.zip` is read as the older form, also with a warning.

## The tags

- **Python tag**: an implementation code (`py` for any implementation, `cp` CPython, `pp` PyPy, `ip` IronPython, `jy` Jython) followed by the version without its dot (`cp313` is CPython 3.13). A major-only tag such as `py3` is not shorthand for `py30`: it means the packager released a wheel meant to work across 3.x versions.
- **ABI tag**: `none` (no extension module tied to a Python ABI), `abi3` (the CPython stable ABI, for builds that are not free-threaded), `abi3t` (the stable ABI for free-threaded builds, PEP 803, from Python 3.15), CPython's own `cpXY` with its flags (`d` debug, `t` free-threaded, and the older `m` and `u`), or PyPy's `pypyXY_ppNN`.
- **Platform tag**: `any`; `win_amd64`, `win32`, `win_arm64`; `manylinux_x_y_arch` (glibc x.y or newer, PEP 600) and its legacy names `manylinux1` (glibc 2.5), `manylinux2010` (2.12) and `manylinux2014` (2.17); `musllinux_x_y_arch` (musl x.y or newer, PEP 656; packaging lists only the same major version of musl); `macosx_x_y_arch` (macOS x.y or later; `10_y` for macOS 10, `x_0` from macOS 11, with x from 10 to 15 or 26 and later), including the multi-architecture names such as `universal2` (arm64 and x86_64); `ios_x_y_arch_sdk`; `android_apilevel_abi`; `pyemscripten_YEAR_PATCH_wasm32` (PEP 783, accepted); and the simple `linux_arch`, which the specification calls insufficient for public distribution. Anything else is read as another system's `sysconfig.get_platform()` value.
- **Compressed tag sets**: each tag can be a `.`-separated, sorted collection, and the wheel then stands for every combination. `py2.py3-none-any` is two combinations; up to 400 are explained one by one, and the rest are counted.

## Which interpreters and systems

The platform compatibility tags specification says an installer keeps a list of the (python, ABI, platform) tags it supports, ordered by preference, and installs a wheel when one of the wheel's tags is in the list. This tool builds that list the way packaging 26.3 builds it for the interpreter and system you describe, compares the wheel's expanded tags against it, and reports the best match and its position. For CPython 3.13 on glibc 2.39, x86-64, the list has 1,147 tags, the same count `python -m pip debug --verbose` printed in the container this tool was built in. pip 26.2 still vendors packaging 26.2, and packaging 26.3 changed one thing in the order: it prefers the plain `linux_*` platform tag over the manylinux and musllinux ones, so in each group the `linux_x86_64` tag now comes first instead of last. pip's own list therefore holds the same tags in nearly the same order: only the plain `linux_*` tag of each group moves, and whether a wheel installs never changes.

Each combination also gets a plain reading of its interpreter rule: `py3-none` is any Python 3; `cp311-abi3` is CPython 3.11 or later, builds that are not free-threaded; `cp313-cp313t` is CPython 3.13's free-threaded build only. Some combinations are valid names that no installer ever lists, and the tool says so with the reason: `abi3` with a python tag other than `cp`, a compiled ABI with the platform `any`, an ABI naming a different version from the python tag, or a `cp3` tag with an ABI.

What the target check does not model: iOS, Android and Emscripten targets, other implementations than CPython and PyPy (PyPy is taken to be 7.3, ABI `pp73`), and the per-distribution rules an installer may add on top, such as a `Requires-Python` mismatch or an index that hides a file. The Python versions offered are the supported branches on the Python developer's guide: 3.11 to 3.15.

## Findings

| Code | Severity | Meaning |
|---|---|---|
| `not-a-distribution` | error | The name does not end in `.whl`, `.tar.gz` or `.zip` |
| `suffix-case` | error | The suffix is not lower case |
| `wrong-part-count` | error | A wheel name without four or five hyphens |
| `sdist-no-hyphen` | error | A source distribution name without a hyphen |
| `empty-name`, `bad-name` | error | No name, or not a valid project name |
| `double-underscore` | error | `__` in the name part |
| `bad-version` | error | Not a PEP 440 version |
| `bad-build-tag` | error | A build tag that does not start with a digit |
| `empty-tag` | error | An empty tag or an empty member of a compressed set |
| `python-tag-not-identifier` | error | A python tag starting with a digit (pip refuses the name) |
| `name-not-escaped` | warning | Accepted, but not the escaped form tools write today |
| `version-not-normalized` | warning | The version is not in normal form |
| `build-tag-used` | warning | A build tag is present |
| `tags-not-sorted`, `tags-uppercase` | warning | A compressed set out of order, or upper-case letters in a tag |
| `impossible-combination` | warning | A combination no installer lists |
| `unknown-python-tag` | warning | A python tag that is not letters then a version |
| `linux-simple-tag` | warning | `linux_arch` instead of manylinux or musllinux |
| `legacy-arch-mismatch` | warning | A legacy manylinux name on an architecture it was never defined for |
| `macos-version-shape`, `android-abi`, `ios-multiarch` | warning | A platform tag outside its family's stated forms |
| `sdist-zip`, `sdist-hyphens` | warning | An older or non-standard source distribution name |
| `local-version` | note | A local version label (PyPI does not accept local versions) |
| `legacy-manylinux` | note | A legacy manylinux name and the tag it means |
| `unknown-platform` | note | A platform outside the described families |
| `too-many-tags` | note | More than 400 combinations; the rest are counted |

## PEP 440 versions

A version is `[N!]N(.N)*[{a|b|rc}N][.postN][.devN][+local]`. The tool parses the forms the specification accepts and gives the normal form, saying what changed: white space and a leading `v` dropped, upper case lowered, leading zeros dropped, `alpha`, `beta`, `c`, `pre` and `preview` written as `a`, `b` and `rc`, separators removed or written as one dot, a missing pre-release, post-release or development number taken as 0, `-1` after the release read as `.post1`, `-` and `_` in a local label written as `.`, and an epoch of `0!` dropped. A nonzero epoch is shown; the specification discourages it.

Sorting follows the specification: release numbers compare as numbers with missing ones counted as zero, so `1.0`, `1.0.0` and `1` are equal; within one release, development releases come first, then `a`, `b` and `rc`, then the final release, then post-releases; a version with a local label sorts after the same version without one.

## Specifier sets

Each clause is explained in words: `~=2.2` is `>=2.2, ==2.*`; `==1.1.*` is a prefix match; `==1.1` ignores a candidate's local label and pads release numbers with zeros; `<V` leaves out the pre-releases of V unless V is one; `>V` leaves out V's post-releases unless V is one, and V's local versions; `===` compares the text (letters without regard to case) and is heavily discouraged. Clauses are refused for the reasons the specification and packaging 26.3 give: `~=` with one release number, `.*` with an operator other than `==` and `!=` or after a pre-release, post-release or development part, a local label with an operator other than `==` and `!=`, two clauses without a comma.

Pre-release handling follows the specification and packaging 26.3: pre-releases, development releases included, are left out unless a clause names one or every version in range is a pre-release; the table shows both what is in range and what is taken by default, and marks the latest one taken.

## Where it follows packaging, and where it is stricter

Every verdict was compared with packaging 26.3 during development (see Provenance). The tool follows packaging's choices where the specification leaves room, such as the exclusive `<` and `>` rules and the installer tag list. It is stricter in one place, and says so: a file name whose name part is not a valid project name (a leading or trailing `_` or `.`, a non-ASCII letter, a space in an sdist name) is refused here, while packaging's file name parsers accept it.

## Worked examples

- **The Example button**: `cryptography-50.0.2-cp311-abi3-manylinux_2_34_x86_64.whl`. CPython 3.11 or later, stable ABI, builds that are not free-threaded, on Linux with glibc 2.34 or newer on x86-64. Against CPython 3.13 on glibc 2.39 it installs, as tag 163 of 1,147 (pip 26.2.2, with packaging 26.2, prints it at 162); on glibc 2.31 it does not; on a free-threaded 3.14 it does not, because `abi3` is not listed for free-threaded builds.
- `markupsafe-3.0.4-cp313-cp313-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl` expands to three combinations; `manylinux2014` is noted as the legacy name of `manylinux_2_17`.
- `Foo.Bar-1.0-py2.py3-none-any.whl` is accepted with a warning: tools today write `foo_bar`.
- **Versions**: the Example list `2.1 2.2 2.9.1 3.0 2.10rc1` with `~=2.2` puts `2.2`, `2.9.1` and `2.10rc1` in range and takes `2.2` and `2.9.1`, because a final release is in range.

## Provenance

The engine is pure: string scanners and comparisons, no clock, no network, no randomness, no regular expression with nested quantifiers. Input is bounded at 20,000 characters, 256 per version, 1,024 per specifier set and 500 versions. It ships golden vectors (set `wheel-filename-explainer/2026-10-27a`): 134 rows covering 40 accepted and 12 refused versions, two ordering lists (one of them the specification's own), 22 specifier sets (many of them the specification's own examples) and 13 refused ones, 33 file names and 12 interpreter targets, each verdict taken from packaging 26.3. During development the engine was also compared with packaging 26.3 on generated inputs: 60,059 versions, 59,963 specifier sets, 30,000 file names, 230 targets and 607,200 tag-to-rule checks, with no disagreement other than the stricter name rule above.

## API

The same engine answers the `/api/v1/wheel-filename-explainer` operation of the site's HTTP API, described in the OpenAPI contract on the [API page](/api); the contract also says whether this site serves the API.

- **Request.** Text, in the body of a POST or in the `input` query parameter of a GET. A single token ending in `.whl`, `.tar.gz` or `.zip` (or a URL to one) is read as a file name; anything else is read as versions, one per line or separated by spaces or commas, and the first line starting with `~`, `=`, `!`, `<` or `>` is the specifier set.
- **Response.** `mode` (`filename`, `versions`, `empty` or `too-long`). In file name mode, `filename` holds `kind`, `fileName`, `parts`, `name`, `expectedName`, `version` (with `normalized`, `epoch`, `release`, `pre`, `post`, `dev`, `local` and the normalization `notes`), `build`, the parsed `pythonTags`, `abiTags` and `platformTags`, the `expanded` combinations with their `interpreter` rule, `expandedCount`, `findings` and `valid`. In versions mode, `versions` holds `entries`, the `sorted` order, `equalGroups`, the parsed `specifier` and the `selection`. The target check is a page feature only.

## Sources

All read 2026-10-27.

- [Python Packaging User Guide: Binary distribution format](https://packaging.python.org/en/latest/specifications/binary-distribution-format/): the file name convention, escaping, the build tag
- [Python Packaging User Guide: Source distribution format](https://packaging.python.org/en/latest/specifications/source-distribution-format/): the sdist file name
- [Python Packaging User Guide: Platform compatibility tags](https://packaging.python.org/en/latest/specifications/platform-compatibility-tags/): python, ABI and platform tags, manylinux, musllinux, macOS, iOS and Android tags, compressed tag sets, how installers use them
- [Python Packaging User Guide: Names and normalization](https://packaging.python.org/en/latest/specifications/name-normalization/)
- [Python Packaging User Guide: Version specifiers](https://packaging.python.org/en/latest/specifications/version-specifiers/) and [PEP 440](https://peps.python.org/pep-0440/)
- [PEP 427](https://peps.python.org/pep-0427/), [PEP 600](https://peps.python.org/pep-0600/), [PEP 656](https://peps.python.org/pep-0656/), [PEP 803](https://peps.python.org/pep-0803/), [PEP 3149](https://peps.python.org/pep-3149/), [PEP 703](https://peps.python.org/pep-0703/), [PEP 783](https://peps.python.org/pep-0783/)
- [Python documentation: C API Stability](https://docs.python.org/3/c-api/stable.html): `abi3` and `abi3t`
- [packaging 26.3: Tags](https://packaging.pypa.io/en/stable/tags.html): the order of the installer's tag list; [changelog](https://packaging.pypa.io/en/stable/changelog.html): 26.3 prefers native `linux_*` platform tags
- [Python developer's guide: Status of Python versions](https://devguide.python.org/versions/): the supported branches offered in the target check
