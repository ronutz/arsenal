// ============================================================================
// src/lib/tools/wheel-filename-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// The pinned truth for the wheel filename & PEP 440 version explainer.
//
// WHERE THE EXPECTED VALUES COME FROM (2026-10-27):
//   - Every normalized form, flag, order, specifier match, file name reading
//     and installer verdict below was produced by packaging 26.3 (the PyPA
//     library pip vendors) on CPython 3.13.16, in a throwaway environment, by
//     the build helper's wheel_oracle.py; the installer lists were built with
//     packaging.tags.cpython_tags / generic_tags / compatible_tags and the
//     platform lists of _manylinux, _musllinux and mac_platforms for each
//     described target. "canonical" is the specification's own is_canonical
//     regular expression (Version specifiers, appendix).
//   - The fields packaging has no notion of (the normalization notes, the
//     error codes and positions, the findings) were produced by this engine
//     and then read one by one against the rules in pep440.ts, tags.ts and
//     compute.ts before being frozen.
//   - Beyond these vectors the build helper ran differential tests against
//     packaging: 60,059 version strings (and about 640,000 ordered pairs),
//     59,963 specifier sets, 30,000 file names, 230 target tag lists (202,282
//     tags, compared in order) and 607,200 tag-and-target verdicts, with no
//     difference outside the departures the docs state.
// ============================================================================

import { parseVersion, compareVersions, parseSpecifierSet, setMatches, selectVersions, type Pep440Version, type VersionNote, type VersionErrorCode, type SpecErrorCode } from "./pep440"; // versions
import { explainFilename, type FindingCode } from "./compute"; // file names
import { matchTarget, targetTags, type Target } from "./tags"; // targets
import { EXAMPLE_FILENAME, EXAMPLE_TARGET, EXAMPLE_VERSIONS, EXAMPLE_SPECIFIER } from "./example"; // the page's Example

/** The set id: changes whenever any vector changes (scripts/check-api-sync.mjs reads it). */
export const GOLDEN_VECTOR_SET_ID = "wheel-filename-explainer/2026-10-27a"; // dated the day the set was written

/** A version and what it normalizes to. */
export interface VersionVector { input: string; normalized: string; public: string; base: string; pre: boolean; post: boolean; dev: boolean; epoch: string; release: string; local: string | null; canonical: boolean; notes: VersionNote[] } // one row

/** Versions packaging 26.3 accepts, with its normal form and flags, and the engine's normalization notes. */
export const VERSION_VECTORS: VersionVector[] = [
  { input: "1.0", normalized: "1.0", public: "1.0", base: "1.0", pre: false, post: false, dev: false, epoch: "0", release: "1.0", local: null, canonical: true, notes: [] }, // "1.0" -> 1.0
  { input: "1.0.0", normalized: "1.0.0", public: "1.0.0", base: "1.0.0", pre: false, post: false, dev: false, epoch: "0", release: "1.0.0", local: null, canonical: true, notes: [] }, // "1.0.0" -> 1.0.0
  { input: "v1.0", normalized: "1.0", public: "1.0", base: "1.0", pre: false, post: false, dev: false, epoch: "0", release: "1.0", local: null, canonical: false, notes: ["leading-v"] }, // "v1.0" -> 1.0
  { input: " 1.0\n", normalized: "1.0", public: "1.0", base: "1.0", pre: false, post: false, dev: false, epoch: "0", release: "1.0", local: null, canonical: false, notes: ["whitespace"] }, // " 1.0\n" -> 1.0
  { input: "1.0-RC1", normalized: "1.0rc1", public: "1.0rc1", base: "1.0", pre: true, post: false, dev: false, epoch: "0", release: "1.0", local: null, canonical: false, notes: ["case","pre-separator"] }, // "1.0-RC1" -> 1.0rc1
  { input: "v2.1", normalized: "2.1", public: "2.1", base: "2.1", pre: false, post: false, dev: false, epoch: "0", release: "2.1", local: null, canonical: false, notes: ["leading-v"] }, // "v2.1" -> 2.1
  { input: "1.0.0alpha2", normalized: "1.0.0a2", public: "1.0.0a2", base: "1.0.0", pre: true, post: false, dev: false, epoch: "0", release: "1.0.0", local: null, canonical: false, notes: ["pre-spelling"] }, // "1.0.0alpha2" -> 1.0.0a2
  { input: "1.1.a1", normalized: "1.1a1", public: "1.1a1", base: "1.1", pre: true, post: false, dev: false, epoch: "0", release: "1.1", local: null, canonical: false, notes: ["pre-separator"] }, // "1.1.a1" -> 1.1a1
  { input: "1.1-a1", normalized: "1.1a1", public: "1.1a1", base: "1.1", pre: true, post: false, dev: false, epoch: "0", release: "1.1", local: null, canonical: false, notes: ["pre-separator"] }, // "1.1-a1" -> 1.1a1
  { input: "1.0a.1", normalized: "1.0a1", public: "1.0a1", base: "1.0", pre: true, post: false, dev: false, epoch: "0", release: "1.0", local: null, canonical: false, notes: ["pre-separator"] }, // "1.0a.1" -> 1.0a1
  { input: "1.2a", normalized: "1.2a0", public: "1.2a0", base: "1.2", pre: true, post: false, dev: false, epoch: "0", release: "1.2", local: null, canonical: false, notes: ["pre-implicit"] }, // "1.2a" -> 1.2a0
  { input: "1.2-post2", normalized: "1.2.post2", public: "1.2.post2", base: "1.2", pre: false, post: true, dev: false, epoch: "0", release: "1.2", local: null, canonical: false, notes: ["post-separator"] }, // "1.2-post2" -> 1.2.post2
  { input: "1.2post2", normalized: "1.2.post2", public: "1.2.post2", base: "1.2", pre: false, post: true, dev: false, epoch: "0", release: "1.2", local: null, canonical: false, notes: ["post-separator"] }, // "1.2post2" -> 1.2.post2
  { input: "1.2.post-2", normalized: "1.2.post2", public: "1.2.post2", base: "1.2", pre: false, post: true, dev: false, epoch: "0", release: "1.2", local: null, canonical: false, notes: ["post-separator"] }, // "1.2.post-2" -> 1.2.post2
  { input: "1.0-r4", normalized: "1.0.post4", public: "1.0.post4", base: "1.0", pre: false, post: true, dev: false, epoch: "0", release: "1.0", local: null, canonical: false, notes: ["post-separator","post-spelling"] }, // "1.0-r4" -> 1.0.post4
  { input: "1.2.post", normalized: "1.2.post0", public: "1.2.post0", base: "1.2", pre: false, post: true, dev: false, epoch: "0", release: "1.2", local: null, canonical: false, notes: ["post-implicit-number"] }, // "1.2.post" -> 1.2.post0
  { input: "1.0-1", normalized: "1.0.post1", public: "1.0.post1", base: "1.0", pre: false, post: true, dev: false, epoch: "0", release: "1.0", local: null, canonical: false, notes: ["post-implicit"] }, // "1.0-1" -> 1.0.post1
  { input: "1.2-dev2", normalized: "1.2.dev2", public: "1.2.dev2", base: "1.2", pre: true, post: false, dev: true, epoch: "0", release: "1.2", local: null, canonical: false, notes: ["dev-separator"] }, // "1.2-dev2" -> 1.2.dev2
  { input: "1.2dev2", normalized: "1.2.dev2", public: "1.2.dev2", base: "1.2", pre: true, post: false, dev: true, epoch: "0", release: "1.2", local: null, canonical: false, notes: ["dev-separator"] }, // "1.2dev2" -> 1.2.dev2
  { input: "1.2.dev", normalized: "1.2.dev0", public: "1.2.dev0", base: "1.2", pre: true, post: false, dev: true, epoch: "0", release: "1.2", local: null, canonical: false, notes: ["dev-implicit"] }, // "1.2.dev" -> 1.2.dev0
  { input: "1.0+ubuntu-1", normalized: "1.0+ubuntu.1", public: "1.0", base: "1.0", pre: false, post: false, dev: false, epoch: "0", release: "1.0", local: "ubuntu.1", canonical: false, notes: ["local-separator"] }, // "1.0+ubuntu-1" -> 1.0+ubuntu.1
  { input: "1.0+ubuntu_1.007", normalized: "1.0+ubuntu.1.7", public: "1.0", base: "1.0", pre: false, post: false, dev: false, epoch: "0", release: "1.0", local: "ubuntu.1.7", canonical: false, notes: ["local-separator","zeros"] }, // "1.0+ubuntu_1.007" -> 1.0+ubuntu.1.7
  { input: "00", normalized: "0", public: "0", base: "0", pre: false, post: false, dev: false, epoch: "0", release: "0", local: null, canonical: false, notes: ["zeros"] }, // "00" -> 0
  { input: "09000", normalized: "9000", public: "9000", base: "9000", pre: false, post: false, dev: false, epoch: "0", release: "9000", local: null, canonical: false, notes: ["zeros"] }, // "09000" -> 9000
  { input: "1!2.0", normalized: "1!2.0", public: "1!2.0", base: "1!2.0", pre: false, post: false, dev: false, epoch: "1", release: "2.0", local: null, canonical: true, notes: [] }, // "1!2.0" -> 1!2.0
  { input: "0!1.0", normalized: "1.0", public: "1.0", base: "1.0", pre: false, post: false, dev: false, epoch: "0", release: "1.0", local: null, canonical: false, notes: ["epoch-zero"] }, // "0!1.0" -> 1.0
  { input: "1.0c1", normalized: "1.0rc1", public: "1.0rc1", base: "1.0", pre: true, post: false, dev: false, epoch: "0", release: "1.0", local: null, canonical: false, notes: ["pre-spelling"] }, // "1.0c1" -> 1.0rc1
  { input: "1.0rc1.post1.dev2", normalized: "1.0rc1.post1.dev2", public: "1.0rc1.post1.dev2", base: "1.0", pre: true, post: true, dev: true, epoch: "0", release: "1.0", local: null, canonical: true, notes: [] }, // "1.0rc1.post1.dev2" -> 1.0rc1.post1.dev2
  { input: "2026.10", normalized: "2026.10", public: "2026.10", base: "2026.10", pre: false, post: false, dev: false, epoch: "0", release: "2026.10", local: null, canonical: true, notes: [] }, // "2026.10" -> 2026.10
  { input: "1.0.post1", normalized: "1.0.post1", public: "1.0.post1", base: "1.0", pre: false, post: true, dev: false, epoch: "0", release: "1.0", local: null, canonical: true, notes: [] }, // "1.0.post1" -> 1.0.post1
  { input: "1.0a1.dev1", normalized: "1.0a1.dev1", public: "1.0a1.dev1", base: "1.0", pre: true, post: false, dev: true, epoch: "0", release: "1.0", local: null, canonical: true, notes: [] }, // "1.0a1.dev1" -> 1.0a1.dev1
  { input: "3.13.16", normalized: "3.13.16", public: "3.13.16", base: "3.13.16", pre: false, post: false, dev: false, epoch: "0", release: "3.13.16", local: null, canonical: true, notes: [] }, // "3.13.16" -> 3.13.16
  { input: "26.3", normalized: "26.3", public: "26.3", base: "26.3", pre: false, post: false, dev: false, epoch: "0", release: "26.3", local: null, canonical: true, notes: [] }, // "26.3" -> 26.3
  { input: "50.0.2", normalized: "50.0.2", public: "50.0.2", base: "50.0.2", pre: false, post: false, dev: false, epoch: "0", release: "50.0.2", local: null, canonical: true, notes: [] }, // "50.0.2" -> 50.0.2
  { input: "1.0.0-beta.1", normalized: "1.0.0b1", public: "1.0.0b1", base: "1.0.0", pre: true, post: false, dev: false, epoch: "0", release: "1.0.0", local: null, canonical: false, notes: ["pre-separator","pre-spelling"] }, // "1.0.0-beta.1" -> 1.0.0b1
  { input: "1.0.0-rc.1+build.123", normalized: "1.0.0rc1+build.123", public: "1.0.0rc1", base: "1.0.0", pre: true, post: false, dev: false, epoch: "0", release: "1.0.0", local: "build.123", canonical: false, notes: ["pre-separator"] }, // "1.0.0-rc.1+build.123" -> 1.0.0rc1+build.123
  { input: "1.0+abc.5", normalized: "1.0+abc.5", public: "1.0", base: "1.0", pre: false, post: false, dev: false, epoch: "0", release: "1.0", local: "abc.5", canonical: false, notes: [] }, // "1.0+abc.5" -> 1.0+abc.5
  { input: "1.0a..post1", normalized: "1.0a0.post1", public: "1.0a0.post1", base: "1.0", pre: true, post: true, dev: false, epoch: "0", release: "1.0", local: null, canonical: false, notes: ["pre-separator","pre-implicit"] }, // "1.0a..post1" -> 1.0a0.post1
  { input: "1.0alphadev", normalized: "1.0a0.dev0", public: "1.0a0.dev0", base: "1.0", pre: true, post: false, dev: true, epoch: "0", release: "1.0", local: null, canonical: false, notes: ["pre-spelling","pre-implicit","dev-separator","dev-implicit"] }, // "1.0alphadev" -> 1.0a0.dev0
  { input: "1.0RC1", normalized: "1.0rc1", public: "1.0rc1", base: "1.0", pre: true, post: false, dev: false, epoch: "0", release: "1.0", local: null, canonical: false, notes: ["case"] }, // "1.0RC1" -> 1.0rc1
]; // VERSION_VECTORS

/** A string that is not a version, with where and why the engine stops. */
export interface VersionRejectVector { input: string; code: VersionErrorCode; at: number } // one row

/** Strings packaging 26.3 refuses as versions. */
export const VERSION_REJECT_VECTORS: VersionRejectVector[] = [
  { input: "", code: "empty", at: -1 }, // refused by packaging too
  { input: "1.0-", code: "unexpected", at: 3 }, // refused by packaging too
  { input: "1.0..dev1", code: "unexpected", at: 3 }, // refused by packaging too
  { input: "1.0+", code: "bad-local", at: 4 }, // refused by packaging too
  { input: "1.0+a..b", code: "bad-local", at: 6 }, // refused by packaging too
  { input: "v", code: "expected-number", at: 1 }, // refused by packaging too
  { input: "1.0 1", code: "unexpected", at: 3 }, // refused by packaging too
  { input: "1.0.0-x.7.z.92", code: "unexpected", at: 5 }, // refused by packaging too
  { input: "latest", code: "expected-number", at: 0 }, // refused by packaging too
  { input: "1.0.*", code: "unexpected", at: 3 }, // refused by packaging too
  { input: "1.0a1.dev1-1", code: "unexpected", at: 10 }, // refused by packaging too
  { input: "1.0+é", code: "bad-local", at: 4 }, // refused by packaging too
]; // VERSION_REJECT_VECTORS

/** Lists in, ascending order out (packaging's sorted(key=Version)). The first is the specification's own ordering example, shuffled. */
export const ORDER_VECTORS: Array<{ input: string[]; sorted: string[] }> = [
  { input: ["1.0.15","1.0b2.post345","1.1.dev1","1.0a12","1.0.post456","1.0rc1","1.0+abc.7","1.dev0","1.0b2.post345.dev456","1.0a2.dev456","1.0+5","1.0.dev456","1.0b1.dev456","1.0","1.0a1","1.0a12.dev456","1.0+abc.5","1.0rc1.dev456","1.0.post456.dev34","1.0b2"], sorted: ["1.dev0","1.0.dev456","1.0a1","1.0a2.dev456","1.0a12.dev456","1.0a12","1.0b1.dev456","1.0b2","1.0b2.post345.dev456","1.0b2.post345","1.0rc1.dev456","1.0rc1","1.0","1.0+abc.5","1.0+abc.7","1.0+5","1.0.post456.dev34","1.0.post456","1.0.15","1.1.dev1"] }, // the "Summary of permitted suffixes" example
  { input: ["1.0.post1","1.0","1.0rc1","1.0a1","1.0.dev1","1.0b2","1.10","1.9","2013.10","1!1.0","2014.04","1!2.0"], sorted: ["1.0.dev1","1.0a1","1.0b2","1.0rc1","1.0","1.0.post1","1.9","1.10","2013.10","2014.04","1!1.0","1!2.0"] }, // numeric order, suffixes and epochs
]; // ORDER_VECTORS

/** A specifier set applied to candidates: in range (prereleases=True) and selected by default (filter()). */
export interface SpecVector { spec: string; candidates: string[]; inRange: string[]; selected: string[] } // one row

/** Specifier sets, many of them the specification's own examples. */
export const SPEC_VECTORS: SpecVector[] = [
  { spec: "~=2.2", candidates: ["2.1","2.2","2.9.1","3.0","2.10rc1"], inRange: ["2.2","2.9.1","2.10rc1"], selected: ["2.2","2.9.1"] }, // packaging 26.3
  { spec: "~=1.4.5", candidates: ["1.4.4","1.4.5","1.4.9","1.5.0","1.4.6a1"], inRange: ["1.4.5","1.4.9","1.4.6a1"], selected: ["1.4.5","1.4.9"] }, // packaging 26.3
  { spec: "~= 2.2.post3", candidates: ["2.2","2.2.post3","2.5","3.0"], inRange: ["2.2.post3","2.5"], selected: ["2.2.post3","2.5"] }, // packaging 26.3
  { spec: "~=1.4.5a4", candidates: ["1.4.5a3","1.4.5a4","1.4.5","1.4.9","1.5"], inRange: ["1.4.5a4","1.4.5","1.4.9"], selected: ["1.4.5a4","1.4.5","1.4.9"] }, // packaging 26.3
  { spec: "== 1.1", candidates: ["1.1","1.1.0","1.1.post1","1.1a1","1.1.dev1","1.1+local"], inRange: ["1.1","1.1.0","1.1+local"], selected: ["1.1","1.1.0","1.1+local"] }, // packaging 26.3
  { spec: "== 1.1.*", candidates: ["1.1","1.1.post1","1.1a1","1.1.5","1.2","1.10"], inRange: ["1.1","1.1.post1","1.1a1","1.1.5"], selected: ["1.1","1.1.post1","1.1.5"] }, // packaging 26.3
  { spec: "!= 1.1.*", candidates: ["1.1","1.1.post1","1.2","1.0"], inRange: ["1.2","1.0"], selected: ["1.2","1.0"] }, // packaging 26.3
  { spec: ">1.7", candidates: ["1.7","1.7.0.post1","1.7.1","1.7+local","1.8a1"], inRange: ["1.7.1","1.8a1"], selected: ["1.7.1"] }, // packaging 26.3
  { spec: ">1.7.post2", candidates: ["1.7.0","1.7.0.post2","1.7.0.post3","1.7.1"], inRange: ["1.7.0.post3","1.7.1"], selected: ["1.7.0.post3","1.7.1"] }, // packaging 26.3
  { spec: "<1.0", candidates: ["0.9","1.0a1","1.0.dev0","0.9.post1","1.0"], inRange: ["0.9","0.9.post1"], selected: ["0.9","0.9.post1"] }, // packaging 26.3
  { spec: "<1.0rc1", candidates: ["1.0a1","1.0rc1","0.9"], inRange: ["1.0a1","0.9"], selected: ["1.0a1","0.9"] }, // packaging 26.3
  { spec: "==1.0+local", candidates: ["1.0","1.0+local","1.0+other"], inRange: ["1.0+local"], selected: ["1.0+local"] }, // packaging 26.3
  { spec: "===1.0", candidates: ["1.0","1.0.0","1.0+downstream1"], inRange: ["1.0"], selected: ["1.0"] }, // packaging 26.3
  { spec: ">=1.0, !=1.3.4.*, <2.0", candidates: ["0.9","1.0","1.3.4","1.3.4.1","1.3.5","2.0","1.9rc1"], inRange: ["1.0","1.3.5","1.9rc1"], selected: ["1.0","1.3.5"] }, // packaging 26.3
  { spec: ">=1.0", candidates: ["1.0","2.0a1","1.5"], inRange: ["1.0","2.0a1","1.5"], selected: ["1.0","1.5"] }, // packaging 26.3
  { spec: ">=1.0", candidates: ["2.0a1","2.0b1"], inRange: ["2.0a1","2.0b1"], selected: ["2.0a1","2.0b1"] }, // packaging 26.3
  { spec: ">=1.0a1", candidates: ["1.0","2.0a1"], inRange: ["1.0","2.0a1"], selected: ["1.0","2.0a1"] }, // packaging 26.3
  { spec: "", candidates: ["1.0","2.0a1"], inRange: ["1.0","2.0a1"], selected: ["1.0"] }, // packaging 26.3
  { spec: "~=3.1", candidates: ["3.1","3.9","4.0","3.0"], inRange: ["3.1","3.9"], selected: ["3.1","3.9"] }, // packaging 26.3
  { spec: "~=3.1.2", candidates: ["3.1.2","3.1.9","3.2.0"], inRange: ["3.1.2","3.1.9"], selected: ["3.1.2","3.1.9"] }, // packaging 26.3
  { spec: "==3.1.*", candidates: ["3.1.0","3.1.7","3.2"], inRange: ["3.1.0","3.1.7"], selected: ["3.1.0","3.1.7"] }, // packaging 26.3
  { spec: "~=3.1.0, != 3.1.3", candidates: ["3.1.0","3.1.3","3.1.4","3.2.0"], inRange: ["3.1.0","3.1.4"], selected: ["3.1.0","3.1.4"] }, // packaging 26.3
]; // SPEC_VECTORS

/** Specifier sets refused, with the engine's code for the first bad clause. */
export const SPEC_REJECT_VECTORS: Array<{ spec: string; code: SpecErrorCode }> = [
  { spec: "~=1", code: "compatible-one-segment" }, // refused by packaging's requirement parser too
  { spec: "==1.0a1.*", code: "wildcard-after-suffix" }, // refused by packaging's requirement parser too
  { spec: ">=1.0+local", code: "local-not-allowed" }, // refused by packaging's requirement parser too
  { spec: ">=1.0.*", code: "wildcard-not-allowed" }, // refused by packaging's requirement parser too
  { spec: "=1.0", code: "no-operator" }, // refused by packaging's requirement parser too
  { spec: "== ", code: "no-version" }, // refused by packaging's requirement parser too
  { spec: ">=1.0,,<2", code: "empty" }, // refused by packaging's requirement parser too
  { spec: ",>=1", code: "empty" }, // refused by packaging's requirement parser too
  { spec: "~=1.0.*", code: "wildcard-not-allowed" }, // refused by packaging's requirement parser too
  { spec: "==1.*.0", code: "bad-version" }, // refused by packaging's requirement parser too
  { spec: ">= 1.0 <2", code: "bad-characters" }, // refused by packaging's requirement parser too
  { spec: "===", code: "no-version" }, // packaging accepts an empty arbitrary version; the grammar needs one character (stated in the docs)
  { spec: ",", code: "empty" }, // refused by packaging's requirement parser too
]; // SPEC_REJECT_VECTORS

/** A file name and its reading. */
export interface FileVector { input: string; valid: boolean; name: string | null; version: string | null; build: [string, string] | null; tags: string[]; findings: FindingCode[] } // one row

/** Wheel and sdist file names: validity, name, version, build tag and expanded tags from packaging 26.3; findings from the engine. */
export const FILE_VECTORS: FileVector[] = [
  { input: "cryptography-50.0.2-cp311-abi3-manylinux_2_34_x86_64.whl", valid: true, name: "cryptography", version: "50.0.2", build: null, tags: ["cp311-abi3-manylinux_2_34_x86_64"], findings: [] }, // accepted by packaging
  { input: "netcheck-0.1.0-py3-none-any.whl", valid: true, name: "netcheck", version: "0.1.0", build: null, tags: ["py3-none-any"], findings: [] }, // accepted by packaging
  { input: "markupsafe-3.0.4-cp313-cp313-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl", valid: true, name: "markupsafe", version: "3.0.4", build: null, tags: ["cp313-cp313-manylinux2014_x86_64","cp313-cp313-manylinux_2_17_x86_64","cp313-cp313-manylinux_2_28_x86_64"], findings: ["legacy-manylinux"] }, // accepted by packaging
  { input: "pip-26.2.2-py3-none-any.whl", valid: true, name: "pip", version: "26.2.2", build: null, tags: ["py3-none-any"], findings: [] }, // accepted by packaging
  { input: "Foo.Bar-1.0-py2.py3-none-any.whl", valid: true, name: "foo-bar", version: "1.0", build: null, tags: ["py2-none-any","py3-none-any"], findings: ["name-not-escaped"] }, // accepted by packaging
  { input: "foo-1.0-1-py3-none-any.whl", valid: true, name: "foo", version: "1.0", build: ["1",""], tags: ["py3-none-any"], findings: ["build-tag-used"] }, // accepted by packaging
  { input: "foo-1.0-2abc-cp315-abi3.abi3t-win_amd64.whl", valid: true, name: "foo", version: "1.0", build: ["2","abc"], tags: ["cp315-abi3-win_amd64","cp315-abi3t-win_amd64"], findings: ["build-tag-used"] }, // accepted by packaging
  { input: "foo-1.0-cp314-cp314t-macosx_11_0_arm64.whl", valid: true, name: "foo", version: "1.0", build: null, tags: ["cp314-cp314t-macosx_11_0_arm64"], findings: [] }, // accepted by packaging
  { input: "foo-1.0-pp311-pypy311_pp73-manylinux_2_17_aarch64.whl", valid: true, name: "foo", version: "1.0", build: null, tags: ["pp311-pypy311_pp73-manylinux_2_17_aarch64"], findings: [] }, // accepted by packaging
  { input: "foo-1.0-cp313-cp313-musllinux_1_2_x86_64.whl", valid: true, name: "foo", version: "1.0", build: null, tags: ["cp313-cp313-musllinux_1_2_x86_64"], findings: [] }, // accepted by packaging
  { input: "foo-1.0-cp312-cp312-ios_13_0_arm64_iphoneos.whl", valid: true, name: "foo", version: "1.0", build: null, tags: ["cp312-cp312-ios_13_0_arm64_iphoneos"], findings: [] }, // accepted by packaging
  { input: "foo-1.0-cp313-cp313-android_24_arm64_v8a.whl", valid: true, name: "foo", version: "1.0", build: null, tags: ["cp313-cp313-android_24_arm64_v8a"], findings: [] }, // accepted by packaging
  { input: "foo-1.0-cp314-cp314-pyemscripten_2026_0_wasm32.whl", valid: true, name: "foo", version: "1.0", build: null, tags: ["cp314-cp314-pyemscripten_2026_0_wasm32"], findings: [] }, // accepted by packaging
  { input: "foo-1.0-cp313-cp313-linux_x86_64.whl", valid: true, name: "foo", version: "1.0", build: null, tags: ["cp313-cp313-linux_x86_64"], findings: ["linux-simple-tag"] }, // accepted by packaging
  { input: "foo-1.0-cp312-abi3-any.whl", valid: true, name: "foo", version: "1.0", build: null, tags: ["cp312-abi3-any"], findings: ["impossible-combination"] }, // accepted by packaging
  { input: "foo-1.0-py3-none-macosx_10_9_universal2.whl", valid: true, name: "foo", version: "1.0", build: null, tags: ["py3-none-macosx_10_9_universal2"], findings: [] }, // accepted by packaging
  { input: "foo-1.0.0-py3-none-any.whl", valid: true, name: "foo", version: "1.0.0", build: null, tags: ["py3-none-any"], findings: [] }, // accepted by packaging
  { input: "foo__bar-1.0-py3-none-any.whl", valid: false, name: null, version: null, build: null, tags: [], findings: ["double-underscore"] }, // refused by packaging
  { input: "foo-1.0-x1-py3-none-any.whl", valid: false, name: null, version: null, build: null, tags: [], findings: ["bad-build-tag"] }, // refused by packaging
  { input: "foo-1.0-py3-none-any.WHL", valid: false, name: null, version: null, build: null, tags: [], findings: ["suffix-case"] }, // refused by packaging
  { input: "foo-1.0-py3-none.whl", valid: false, name: null, version: null, build: null, tags: [], findings: ["wrong-part-count"] }, // refused by packaging
  { input: "foo-not.a.version-py3-none-any.whl", valid: false, name: null, version: null, build: null, tags: [], findings: ["bad-version"] }, // refused by packaging
  { input: "foo-1.0-py3..py2-none-any.whl", valid: false, name: null, version: null, build: null, tags: [], findings: ["empty-tag"] }, // refused by packaging
  { input: "foo-1.0-3py-none-any.whl", valid: false, name: null, version: null, build: null, tags: [], findings: ["python-tag-not-identifier"] }, // refused by packaging
  { input: "netcheck-0.1.0.tar.gz", valid: true, name: "netcheck", version: "0.1.0", build: null, tags: [], findings: [] }, // accepted by packaging
  { input: "Net_Check-0.1.0.tar.gz", valid: true, name: "net-check", version: "0.1.0", build: null, tags: [], findings: ["name-not-escaped"] }, // accepted by packaging
  { input: "foo-bar-1.0.tar.gz", valid: true, name: "foo-bar", version: "1.0", build: null, tags: [], findings: ["sdist-hyphens","name-not-escaped"] }, // accepted by packaging
  { input: "foo-1.0.zip", valid: true, name: "foo", version: "1.0", build: null, tags: [], findings: ["sdist-zip"] }, // accepted by packaging
  { input: "foo.tar.gz", valid: false, name: null, version: null, build: null, tags: [], findings: ["sdist-no-hyphen"] }, // refused by packaging
  { input: "foo-1.0.tgz", valid: false, name: null, version: null, build: null, tags: [], findings: ["not-a-distribution"] }, // refused by packaging
  { input: "https://files.pythonhosted.org/packages/ab/cd/pip-26.2.2-py3-none-any.whl#sha256=00", valid: true, name: "pip", version: "26.2.2", build: null, tags: ["py3-none-any"], findings: [] }, // accepted by packaging
  { input: "foo-1.0+local.1-py3-none-any.whl", valid: true, name: "foo", version: "1.0+local.1", build: null, tags: ["py3-none-any"], findings: ["local-version"] }, // accepted by packaging
  { input: "foo-1.0-py3-none-manylinux1_aarch64.whl", valid: true, name: "foo", version: "1.0", build: null, tags: ["py3-none-manylinux1_aarch64"], findings: ["legacy-manylinux","legacy-arch-mismatch"] }, // accepted by packaging
]; // FILE_VECTORS

/** A wheel against a described target: does it install, which tag wins, and where it sits in the installer's list. */
export interface TargetVector { file: string; target: Target; installs: boolean; bestTag: string | null; rank: number; listLength: number } // one row

/** Targets, with packaging 26.3's verdicts (the first is this container: CPython 3.13 on glibc 2.39, x86-64, 1,147 tags, as pip debug --verbose printed). */
export const TARGET_VECTORS: TargetVector[] = [
  { file: "cryptography-50.0.2-cp311-abi3-manylinux_2_34_x86_64.whl", target: {"impl":"cpython","major":3,"minor":13,"freeThreaded":false,"os":"linux-glibc","osVersion":[2,39],"arch":"x86_64"}, installs: true, bestTag: "cp311-abi3-manylinux_2_34_x86_64", rank: 163, listLength: 1147 }, // packaging 26.3
  { file: "cryptography-50.0.2-cp311-abi3-manylinux_2_34_x86_64.whl", target: {"impl":"cpython","major":3,"minor":13,"freeThreaded":false,"os":"linux-glibc","osVersion":[2,31],"arch":"x86_64"}, installs: false, bestTag: null, rank: 0, listLength: 915 }, // packaging 26.3
  { file: "cryptography-50.0.2-cp311-abi3-manylinux_2_34_x86_64.whl", target: {"impl":"cpython","major":3,"minor":14,"freeThreaded":true,"os":"linux-glibc","osVersion":[2,39],"arch":"x86_64"}, installs: false, bestTag: null, rank: 0, listLength: 1226 }, // packaging 26.3
  { file: "cryptography-50.0.2-cp311-abi3-manylinux_2_34_x86_64.whl", target: {"impl":"cpython","major":3,"minor":10,"freeThreaded":false,"os":"linux-glibc","osVersion":[2,39],"arch":"x86_64"}, installs: false, bestTag: null, rank: 0, listLength: 910 }, // packaging 26.3
  { file: "markupsafe-3.0.4-cp313-cp313-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl", target: {"impl":"cpython","major":3,"minor":13,"freeThreaded":false,"os":"linux-glibc","osVersion":[2,35],"arch":"x86_64"}, installs: true, bestTag: "cp313-cp313-manylinux_2_28_x86_64", rank: 9, listLength: 1031 }, // packaging 26.3
  { file: "markupsafe-3.0.4-cp313-cp313-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl", target: {"impl":"cpython","major":3,"minor":13,"freeThreaded":false,"os":"linux-musl","osVersion":[1,2],"arch":"x86_64"}, installs: false, bestTag: null, rank: 0, listLength: 132 }, // packaging 26.3
  { file: "netcheck-0.1.0-py3-none-any.whl", target: {"impl":"pypy","major":3,"minor":11,"freeThreaded":false,"os":"windows","osVersion":[0,0],"arch":"x86_64"}, installs: true, bestTag: "py3-none-any", rank: 18, listLength: 29 }, // packaging 26.3
  { file: "foo-1.0-cp315-abi3.abi3t-win_amd64.whl", target: {"impl":"cpython","major":3,"minor":15,"freeThreaded":true,"os":"windows","osVersion":[0,0],"arch":"x86_64"}, installs: true, bestTag: "cp315-abi3t-win_amd64", rank: 2, listLength: 51 }, // packaging 26.3
  { file: "foo-1.0-cp315-abi3.abi3t-win_amd64.whl", target: {"impl":"cpython","major":3,"minor":16,"freeThreaded":false,"os":"windows","osVersion":[0,0],"arch":"x86_64"}, installs: true, bestTag: "cp315-abi3-win_amd64", rank: 4, listLength: 54 }, // packaging 26.3
  { file: "foo-1.0-py3-none-macosx_10_9_universal2.whl", target: {"impl":"cpython","major":3,"minor":14,"freeThreaded":false,"os":"macos","osVersion":[14,0],"arch":"arm64"}, installs: true, bestTag: "py3-none-macosx_10_9_universal2", rank: 352, listLength: 668 }, // packaging 26.3
  { file: "foo-1.0-cp314-cp314t-macosx_11_0_arm64.whl", target: {"impl":"cpython","major":3,"minor":14,"freeThreaded":false,"os":"macos","osVersion":[26,0],"arch":"arm64"}, installs: false, bestTag: null, rank: 0, listLength: 1412 }, // packaging 26.3
  { file: "foo-1.0-cp313-cp313-musllinux_1_2_x86_64.whl", target: {"impl":"cpython","major":3,"minor":13,"freeThreaded":false,"os":"linux-musl","osVersion":[1,1],"arch":"x86_64"}, installs: false, bestTag: null, rank: 0, listLength: 103 }, // packaging 26.3
]; // TARGET_VECTORS

// ---------------------------------------------------------------------------
// The Example and the API example
// ---------------------------------------------------------------------------

export { EXAMPLE_FILENAME, EXAMPLE_TARGET, EXAMPLE_VERSIONS, EXAMPLE_SPECIFIER }; // re-exported
/** The OpenAPI example and the first input detector's example: the Example file name. */
export const API_EXAMPLE = EXAMPLE_FILENAME; // one real wheel

// ---------------------------------------------------------------------------
// The runner
// ---------------------------------------------------------------------------

/**
 * verifyVectors: run every vector; collect every failure.
 * @returns the set id, how many checks ran, how many passed, and the failures
 */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Count every check; keep the failing ones.
  const failures: string[] = []; // failures, with the vector they belong to
  let total = 0; // checks run
  /** Record one check. */
  const check = (ok: boolean, msg: string): void => { total++; if (!ok) failures.push(msg); }; // counted, kept when failed
  /** Parse a version known to be valid. */
  const pv = (s: string): Pep440Version => { const r = parseVersion(s); if (!r.ok) throw new Error(`not a version: ${s}`); return r.version; }; // parse or throw
  for (const v of VERSION_VECTORS) { // each version
    const r = parseVersion(v.input); // the engine
    check(r.ok, `[version ${JSON.stringify(v.input)}] refused`); // accepted
    if (!r.ok) continue; // nothing more to compare
    const x = r.version; // parsed
    const got = { normalized: x.normalized, public: x.public, base: x.base, pre: x.isPrerelease, post: x.isPostrelease, dev: x.isDevrelease, epoch: x.epoch, release: x.release.join("."), local: x.local ? x.local.join(".") : null, canonical: x.isCanonical, notes: x.notes }; // the engine's view
    const want = { normalized: v.normalized, public: v.public, base: v.base, pre: v.pre, post: v.post, dev: v.dev, epoch: v.epoch, release: v.release, local: v.local, canonical: v.canonical, notes: v.notes }; // the vector
    check(JSON.stringify(got) === JSON.stringify(want), `[version ${JSON.stringify(v.input)}] got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); // equal
  } // versions
  for (const v of VERSION_REJECT_VECTORS) { // each refusal
    const r = parseVersion(v.input); // the engine
    check(!r.ok && r.error.code === v.code && r.error.at === v.at, `[reject ${JSON.stringify(v.input)}] got ${JSON.stringify(r.ok ? "ok" : r.error)}`); // refused, same code and place
  } // refusals
  for (const o of ORDER_VECTORS) { // each list
    const sorted = [...o.input].sort((a, b) => compareVersions(pv(a), pv(b))); // ascending (Array.prototype.sort is stable)
    check(JSON.stringify(sorted) === JSON.stringify(o.sorted), `[order] got ${JSON.stringify(sorted)}`); // same order
  } // lists
  for (const s of SPEC_VECTORS) { // each specifier set
    const p = parseSpecifierSet(s.spec); // the engine
    check(p.ok, `[spec ${s.spec}] refused`); // accepted
    if (!p.ok) continue; // nothing more
    const inRange = s.candidates.filter((c) => setMatches(pv(c), p.clauses)); // range
    check(JSON.stringify(inRange) === JSON.stringify(s.inRange), `[spec ${s.spec}] in range ${JSON.stringify(inRange)}`); // same
    const sel = selectVersions(s.candidates.map(pv), p.clauses).selected.map((i) => s.candidates[i]); // the default policy
    check(JSON.stringify(sel) === JSON.stringify(s.selected), `[spec ${s.spec}] selected ${JSON.stringify(sel)}`); // same
  } // specifier sets
  for (const s of SPEC_REJECT_VECTORS) { // each refused set
    const p = parseSpecifierSet(s.spec); // the engine
    check(!p.ok && p.errors[0]?.code === s.code, `[spec reject ${JSON.stringify(s.spec)}] got ${p.ok ? "ok" : p.errors[0]?.code}`); // refused with the code
  } // refused sets
  for (const f of FILE_VECTORS) { // each file name
    const r = explainFilename(f.input); // the engine
    check(r.valid === f.valid, `[file ${f.input}] valid ${r.valid}`); // verdict
    check(JSON.stringify(r.findings.map((x) => x.code)) === JSON.stringify(f.findings), `[file ${f.input}] findings ${JSON.stringify(r.findings.map((x) => x.code))}`); // findings
    if (!f.valid) continue; // nothing more
    check(r.name?.normalized === f.name, `[file ${f.input}] name ${r.name?.normalized}`); // normalized name
    check(r.version?.normalized === f.version, `[file ${f.input}] version ${r.version?.normalized}`); // normalized version
    check(JSON.stringify(r.build ? [r.build.number, r.build.rest] : null) === JSON.stringify(f.build), `[file ${f.input}] build ${JSON.stringify(r.build)}`); // build tag
    const tags = [...new Set(r.expanded.map((e) => e.tag))].sort(); // expanded tags
    check(JSON.stringify(tags) === JSON.stringify(f.tags), `[file ${f.input}] tags ${JSON.stringify(tags)}`); // same set
  } // file names
  for (const t of TARGET_VECTORS) { // each target
    const r = explainFilename(t.file); // the wheel
    const all = r.pythonTags.flatMap((p) => r.abiTags.flatMap((a) => r.platformTags.map((pl) => `${p.tag}-${a.tag}-${pl.tag}`.toLowerCase()))); // every triple
    const m = matchTarget(all, t.target); // the engine
    check(m.installs === t.installs && m.bestTag === t.bestTag && m.rank === t.rank && m.listLength === t.listLength, `[target ${t.file} ${JSON.stringify(t.target)}] got ${JSON.stringify(m)}`); // same verdict
    check(targetTags(t.target).length === t.listLength, `[target list ${JSON.stringify(t.target)}] length`); // same list length
  } // targets
  check(FILE_VECTORS[0].input === EXAMPLE_FILENAME && TARGET_VECTORS[0].file === EXAMPLE_FILENAME, "[example] the file name is not FILE_VECTORS[0] / TARGET_VECTORS[0]"); // D-83
  check(JSON.stringify(TARGET_VECTORS[0].target) === JSON.stringify(EXAMPLE_TARGET), "[example] the target is not TARGET_VECTORS[0]'s"); // D-83
  check(SPEC_VECTORS[0].spec === EXAMPLE_SPECIFIER && SPEC_VECTORS[0].candidates.join(" ") === EXAMPLE_VERSIONS, "[example] the versions are not SPEC_VECTORS[0]'s"); // D-83
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures }; // the report
} // verifyVectors
