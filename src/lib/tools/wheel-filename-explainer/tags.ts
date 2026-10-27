// ============================================================================
// src/lib/tools/wheel-filename-explainer/tags.ts
// ----------------------------------------------------------------------------
// Compatibility tags: read the python, ABI and platform tags of a wheel file
// name, say what each one requires, and build the ordered list of tags an
// installer accepts for a described target (so the page can answer "does this
// wheel install here, and how strongly is it preferred?").
//
// THE RULES (all read 2026-10-27):
//   Python Packaging User Guide, "Platform compatibility tags"
//   (packaging.python.org/en/latest/specifications/platform-compatibility-tags/):
//     - the tag format {python tag}-{abi tag}-{platform tag};
//     - python tag: py (generic), cp (CPython), ip (IronPython), pp (PyPy),
//       jy (Jython), others sys.implementation.name; the version is
//       py_version_nodot ("_" when a dot is needed); "major-version-only tags
//       like py2 and py3 are not shorthand for py20 and py30" but mean "the
//       packager intentionally released a cross-version-compatible
//       distribution";
//     - ABI tag: implementation-specific ABIs abbreviated like the python tag
//       (cp33d = CPython 3.3 with debugging); "The CPython stable ABI is abi3";
//     - platform tag: sysconfig.get_platform() with "-" and "." as "_";
//       manylinux_x_y_arch "should work on any distro using glibc x.y+";
//       manylinux1 = glibc 2.5 (x86_64, i686), manylinux2010 = 2.12 (x86_64,
//       i686), manylinux2014 = 2.17 (x86_64, i686, aarch64, armv7l, ppc64,
//       ppc64le, s390x); musllinux_x_y_arch = musl x.y and higher;
//       macosx_x_y_arch = macOS x.y or later (x 10 to 15, or 26 and later; for
//       11 and later the minor is 0), with the multi-architecture names
//       universal2, universal, intel, fat, fat3, fat64; android_apilevel_abi
//       (four ABIs); ios_x_y_arch_sdk (three multiarch values);
//     - "Compressed Tag Sets": each tag may be a "."-separated, sorted set;
//       the wheel stands for every combination;
//     - "Use": the installer keeps an ordered list of supported tags; a wheel
//       installs when one of its tags is in the list, and the earliest list
//       position wins a tie.
//   PEP 600 (Final): the legacy names are aliases of manylinux_2_5,
//   manylinux_2_12 and manylinux_2_17. PEP 656 (Final): musllinux. PEP 3149
//   (Final): the d, m, u ABI flags. PEP 703 (Final): the "t" flag of
//   free-threaded builds. PEP 803 (Final) and the C API documentation
//   "Stable Application Binary Interfaces" (docs.python.org/3, 3.15): abi3 is
//   for builds that are not free-threaded, abi3t for free-threaded builds;
//   "An extension compiled for Stable ABI 3.x is ABI-compatible with Python
//   3.x and above"; abi3.abi3t covers both. PEP 783 (Accepted): the
//   pyemscripten_YEAR_PATCH_wasm32 platform.
//
// WHERE THE SPECIFICATION LEAVES THE LIST TO THE INSTALLER, the target list
// built here follows packaging 26.3's tags module (the library pip vendors),
// read and run on 2026-10-27 and used as the oracle for the golden vectors.
// pip 26.2.2 still vendors packaging 26.2, which lists linux_<arch> after the
// manylinux and musllinux tags of each group; 26.3 lists it first (its
// changelog: "Prefer native linux_* platform tags"), so pip's own list has the
// same tags, and only the plain linux_<arch> tag of each group moves. The order here:
// CPython's own ABI, then abi3 (or abi3t on a free-threaded build), then none,
// then the stable ABI for every older minor down to 3.2; then pyXY-none for
// the version, py3, and every older minor; then <interpreter>-none-any and the
// pure-Python tags. Platforms: Linux lists linux_<arch>, then manylinux from
// the system's glibc down to 2.17 (2.5 on x86_64 and i686) with the legacy
// names, then musllinux from the system's musl down to x.0; macOS follows
// mac_platforms (binary formats per architecture); Windows lists its one tag.
//
// Every pattern below is anchored and built from digit runs separated by
// literal "_" (a digit class cannot match "_"), so each runs in linear time.
// ============================================================================

import { asciiLower } from "./names"; // ASCII lower-casing

// ---------------------------------------------------------------------------
// Tag readings
// ---------------------------------------------------------------------------

/** The implementations with an abbreviation in the specification. */
export type ImplCode = "py" | "cp" | "pp" | "ip" | "jy" | "other";

/** One python tag, read. */
export interface PythonTag {
  /** The tag as written. */
  tag: string;
  /** The implementation code (or "other"). */
  impl: ImplCode;
  /** The implementation name when "other" (the letters before the version). */
  implName: string;
  /** The major version, or null when there is none. */
  major: number | null;
  /** The minor version, or null for a major-only tag. */
  minor: number | null;
  /** The tag could not be read as letters followed by a version. */
  unreadable: boolean;
} // PythonTag

/** The kinds of ABI tag. */
export type AbiKind = "none" | "abi3" | "abi3t" | "cpython" | "pypy" | "other";

/** One ABI tag, read. */
export interface AbiTag {
  /** The tag as written. */
  tag: string;
  /** Its kind. */
  kind: AbiKind;
  /** For cpython and pypy: the Python major version. */
  major: number | null;
  /** For cpython and pypy: the Python minor version. */
  minor: number | null;
  /** For cpython: the ABI flags (d debug, m pymalloc, u wide unicode, t free-threaded), as written. */
  flags: string;
  /** For pypy: the PyPy release digits after "pp" (73 for PyPy 7.3). */
  pypyRelease: string | null;
} // AbiTag

/** The kinds of platform tag. */
export type PlatformFamily = "any" | "windows" | "manylinux" | "musllinux" | "linux" | "macos" | "ios" | "android" | "pyemscripten" | "other";

/** One platform tag, read. */
export interface PlatformTag {
  /** The tag as written. */
  tag: string;
  /** Its family. */
  family: PlatformFamily;
  /** The architecture part ("" for any). */
  arch: string;
  /** For manylinux and musllinux: the libc major.minor; for macos and ios: the OS major.minor; for android: [api, 0]. */
  version: [number, number] | null;
  /** For a legacy manylinux name: manylinux1, manylinux2010 or manylinux2014. */
  legacy: string | null;
  /** For macOS multi-architecture names: the architectures it contains. */
  archs: string[];
  /** For ios: iphoneos or iphonesimulator. */
  sdk: string | null;
  /** For pyemscripten: [year, patch]. */
  emscripten: [number, number] | null;
} // PlatformTag

/**
 * Read a python tag: letters (the implementation), then a version (digits, or digits "_" digits).
 * @param tag the tag as written
 * @returns the reading
 */
export function readPythonTag(tag: string): PythonTag {
  // Split the leading letters from the rest.
  const t = asciiLower(tag); // tags compare in lower case
  let i = 0; // cursor
  while (i < t.length && t[i] >= "a" && t[i] <= "z") i++; // the letters
  const letters = t.slice(0, i); // implementation
  const rest = t.slice(i); // version
  const known: ImplCode[] = ["py", "cp", "pp", "ip", "jy"]; // the abbreviations
  const impl: ImplCode = (known as string[]).includes(letters) ? (letters as ImplCode) : "other"; // the code
  const out: PythonTag = { tag, impl, implName: letters, major: null, minor: null, unreadable: false }; // filled below
  let m = /^([0-9])$/.exec(rest); // a major version alone
  if (m) { out.major = Number(m[1]); return out; } // e.g. py3
  m = /^([0-9])([0-9]+)$/.exec(rest); // major then minor (py_version_nodot)
  if (m) { out.major = Number(m[1]); out.minor = Number(m[2]); return out; } // e.g. cp313
  m = /^([0-9]+)_([0-9]+)$/.exec(rest); // the underscore form
  if (m) { out.major = Number(m[1]); out.minor = Number(m[2]); return out; } // e.g. cp3_14
  out.unreadable = true; // no letters, no version, or a version in another shape
  return out; // unreadable
} // readPythonTag

/**
 * Read an ABI tag.
 * @param tag the tag as written
 * @returns the reading
 */
export function readAbiTag(tag: string): AbiTag {
  // The fixed names first.
  const t = asciiLower(tag); // lower case
  const base: AbiTag = { tag, kind: "other", major: null, minor: null, flags: "", pypyRelease: null }; // defaults
  if (t === "none" || t === "abi3" || t === "abi3t") return { ...base, kind: t }; // fixed names
  let m = /^cp([0-9])([0-9]+)([a-z]*)$/.exec(t); // cpXY plus flags
  if (m) return { ...base, kind: "cpython", major: Number(m[1]), minor: Number(m[2]), flags: m[3] }; // CPython's own ABI
  m = /^pypy([0-9])([0-9]+)_pp([0-9]+)$/.exec(t); // pypyXY_ppNN
  if (m) return { ...base, kind: "pypy", major: Number(m[1]), minor: Number(m[2]), pypyRelease: m[3] }; // PyPy's ABI
  return base; // another implementation's ABI
} // readAbiTag

// The architectures each legacy manylinux name was defined for.
const LEGACY_MANYLINUX: Record<string, { glibc: [number, number]; archs: string[] }> = {
  manylinux1: { glibc: [2, 5], archs: ["x86_64", "i686"] }, // PEP 513
  manylinux2010: { glibc: [2, 12], archs: ["x86_64", "i686"] }, // PEP 571
  manylinux2014: { glibc: [2, 17], archs: ["x86_64", "i686", "aarch64", "armv7l", "ppc64", "ppc64le", "s390x"] }, // PEP 599
}; // LEGACY_MANYLINUX

// macOS multi-architecture names and what they contain (the specification's table).
export const MAC_MULTI_ARCH: Record<string, string[]> = {
  universal2: ["arm64", "x86_64"], // Apple silicon and Intel
  universal: ["i386", "ppc", "ppc64", "x86_64"], // the old four
  intel: ["i386", "x86_64"], // both Intel
  fat: ["i386", "ppc"], // 32-bit Intel and PowerPC
  fat3: ["i386", "ppc", "x86_64"], // three
  fat64: ["ppc64", "x86_64"], // the 64-bit pair
}; // MAC_MULTI_ARCH

// The four Android ABIs, normalized.
export const ANDROID_ABIS = ["armeabi_v7a", "arm64_v8a", "x86", "x86_64"]; // the specification's list
// The three iOS multiarch values.
export const IOS_MULTIARCH = ["arm64_iphoneos", "arm64_iphonesimulator", "x86_64_iphonesimulator"]; // the specification's list
// Windows platform tags and their architectures.
const WINDOWS: Record<string, string> = { win32: "x86", win_amd64: "x86_64", win_arm64: "arm64", win_ia64: "ia64", win_arm32: "arm32" }; // sysconfig names

/**
 * Read a platform tag.
 * @param tag the tag as written
 * @returns the reading
 */
export function readPlatformTag(tag: string): PlatformTag {
  // Defaults, then each family in turn.
  const t = asciiLower(tag); // lower case
  const base: PlatformTag = { tag, family: "other", arch: "", version: null, legacy: null, archs: [], sdk: null, emscripten: null }; // defaults
  if (t === "any") return { ...base, family: "any" }; // pure platform
  if (t in WINDOWS) return { ...base, family: "windows", arch: WINDOWS[t] }; // Windows
  let m = /^manylinux_([0-9]+)_([0-9]+)_([a-z0-9_]+)$/.exec(t); // the perennial form
  if (m) return { ...base, family: "manylinux", version: [Number(m[1]), Number(m[2])], arch: m[3] }; // glibc x.y
  m = /^(manylinux1|manylinux2010|manylinux2014)_([a-z0-9_]+)$/.exec(t); // a legacy name
  if (m) return { ...base, family: "manylinux", version: LEGACY_MANYLINUX[m[1]].glibc, arch: m[2], legacy: m[1] }; // its glibc
  m = /^musllinux_([0-9]+)_([0-9]+)_([a-z0-9_]+)$/.exec(t); // musl
  if (m) return { ...base, family: "musllinux", version: [Number(m[1]), Number(m[2])], arch: m[3] }; // musl x.y
  m = /^macosx_([0-9]+)_([0-9]+)_([a-z0-9_]+)$/.exec(t); // macOS
  if (m) return { ...base, family: "macos", version: [Number(m[1]), Number(m[2])], arch: m[3], archs: MAC_MULTI_ARCH[m[3]] ?? [m[3]] }; // macOS x.y
  m = /^ios_([0-9]+)_([0-9]+)_([a-z0-9]+)_(iphoneos|iphonesimulator)$/.exec(t); // iOS
  if (m) return { ...base, family: "ios", version: [Number(m[1]), Number(m[2])], arch: m[3], sdk: m[4] }; // iOS x.y
  m = /^android_([0-9]+)_([a-z0-9_]+)$/.exec(t); // Android
  if (m) return { ...base, family: "android", version: [Number(m[1]), 0], arch: m[2] }; // API level
  m = /^pyemscripten_([0-9]+)_([0-9]+)_wasm32$/.exec(t); // Emscripten (PEP 783)
  if (m) return { ...base, family: "pyemscripten", arch: "wasm32", emscripten: [Number(m[1]), Number(m[2])] }; // year and patch
  m = /^linux_([a-z0-9_]+)$/.exec(t); // the simple Linux form
  if (m) return { ...base, family: "linux", arch: m[1] }; // linux_<arch>
  return base; // another sysconfig platform
} // readPlatformTag

// ---------------------------------------------------------------------------
// What a python and ABI pair requires
// ---------------------------------------------------------------------------

/** The interpreter requirement of one python tag and ABI tag pair. */
export type InterpreterRule =
  | { kind: "any-major"; major: number } // pyX-none: any implementation of Python X
  | { kind: "any-from"; major: number; minor: number } // pyXY-none: any implementation, Python X.Y or later X
  | { kind: "pypy-major"; major: number } // pp3-none: any PyPy for Python 3 (packaging adds it for PyPy)
  | { kind: "impl-exact"; impl: ImplCode; implName: string; major: number; minor: number | null } // cpXY-none, ppXY-none: that implementation and version only
  | { kind: "cpython-abi"; major: number; minor: number; freeThreaded: boolean; debug: boolean; pymalloc: boolean; ucs4: boolean } // cpXY-cpXY<flags>
  | { kind: "cpython-stable"; major: number; minor: number; abi: "abi3" | "abi3t" } // cpXY-abi3 or -abi3t: X.Y and later
  | { kind: "pypy-abi"; major: number; minor: number; release: string } // ppXY-pypyXY_ppNN
  | { kind: "impl-abi"; implName: string; abi: string } // another implementation's own ABI
  | { kind: "impossible"; reason: ImpossibleReason }; // no installer lists it

/** Why no installer lists a combination. */
export type ImpossibleReason =
  | "stable-abi-not-cpython" // abi3 or abi3t with a python tag other than cp
  | "generic-with-abi" // a py tag with an ABI other than none
  | "abi-version-mismatch" // a cpXY or pypyXY ABI that disagrees with the python tag
  | "major-only-with-abi" // cp3 (no minor) with an ABI, or cp3-none
  | "abi-with-any-platform" // a compiled ABI with the platform "any"
  | "pypy-major-with-platform" // pp3-none with a platform other than "any"
  | "pypy-version-any" // ppXY-none-any (PyPy lists pp3-none-any and ppXY-none-<platform>)
  | "unreadable"; // a python tag in another shape

/**
 * Say which interpreters accept one python tag and ABI tag pair (and, when given, the platform tag: a few
 * combinations are listed by installers only with, or only without, the platform "any").
 * @param py the python tag
 * @param abi the ABI tag
 * @param plat the platform tag, when known
 * @returns the requirement
 */
export function interpreterRule(py: PythonTag, abi: AbiTag, plat?: PlatformTag): InterpreterRule {
  // Unreadable tags first.
  if (py.unreadable || py.major === null) return { kind: "impossible", reason: "unreadable" }; // nothing to say
  const anyPlat = plat !== undefined && plat.family === "any"; // the platform "any"
  if (abi.kind === "none") { // no ABI requirement
    if (py.impl === "py") return py.minor === null ? { kind: "any-major", major: py.major } : { kind: "any-from", major: py.major, minor: py.minor }; // generic
    if (py.impl === "pp" && py.minor === null) return plat && !anyPlat ? { kind: "impossible", reason: "pypy-major-with-platform" } : { kind: "pypy-major", major: py.major }; // pp3: only with any
    if (py.impl === "pp" && anyPlat) return { kind: "impossible", reason: "pypy-version-any" }; // ppXY-none-any is not listed
    if (py.minor === null) return { kind: "impossible", reason: "major-only-with-abi" }; // cp3-none and the like are not listed
    return { kind: "impl-exact", impl: py.impl, implName: py.implName, major: py.major, minor: py.minor }; // that implementation and version
  } // none
  if (anyPlat) return { kind: "impossible", reason: "abi-with-any-platform" }; // a compiled ABI needs a platform
  if (py.impl === "py") return { kind: "impossible", reason: "generic-with-abi" }; // generic Python cannot need an ABI
  if (abi.kind === "abi3" || abi.kind === "abi3t") { // the stable ABIs
    if (py.impl !== "cp") return { kind: "impossible", reason: "stable-abi-not-cpython" }; // CPython's only
    if (py.minor === null) return { kind: "impossible", reason: "major-only-with-abi" }; // cp3-abi3: not generated
    return { kind: "cpython-stable", major: py.major, minor: py.minor, abi: abi.kind }; // X.Y and later
  } // stable
  if (abi.kind === "cpython") { // CPython's own ABI
    if (py.impl !== "cp" || py.minor === null || abi.major !== py.major || abi.minor !== py.minor) return { kind: "impossible", reason: "abi-version-mismatch" }; // must agree
    return { kind: "cpython-abi", major: py.major, minor: py.minor, freeThreaded: abi.flags.includes("t"), debug: abi.flags.includes("d"), pymalloc: abi.flags.includes("m"), ucs4: abi.flags.includes("u") }; // that build
  } // cpython
  if (abi.kind === "pypy") { // PyPy's own ABI
    if (py.impl !== "pp" || py.minor === null || abi.major !== py.major || abi.minor !== py.minor) return { kind: "impossible", reason: "abi-version-mismatch" }; // must agree
    return { kind: "pypy-abi", major: py.major, minor: py.minor, release: abi.pypyRelease ?? "" }; // that PyPy
  } // pypy
  return { kind: "impl-abi", implName: py.implName, abi: abi.tag }; // another implementation's ABI
} // interpreterRule

// ---------------------------------------------------------------------------
// The target: an installer's ordered list of tags
// ---------------------------------------------------------------------------

/** A described target machine. */
export interface Target {
  /** CPython or PyPy. */
  impl: "cpython" | "pypy";
  /** Python major version (3). */
  major: number;
  /** Python minor version. */
  minor: number;
  /** A free-threaded CPython build (3.13 and later). */
  freeThreaded: boolean;
  /** The operating system family. */
  os: "linux-glibc" | "linux-musl" | "macos" | "windows";
  /** glibc, musl or macOS major.minor (ignored on Windows). */
  osVersion: [number, number];
  /** The machine architecture as sysconfig names it (x86_64, aarch64, arm64, amd64 ...). */
  arch: string;
} // Target

/** The PyPy ABI release assumed for a PyPy target (PyPy 7.3). */
export const PYPY_RELEASE = "73"; // stated on the page

/**
 * The platform tags a target accepts, best first (packaging 26.3's order).
 * @param t the target
 * @returns the platform tags
 */
export function targetPlatforms(t: Target): string[] {
  // One branch per operating system.
  const out: string[] = []; // the list
  if (t.os === "windows") { // one tag
    out.push(t.arch === "x86_64" || t.arch === "amd64" ? "win_amd64" : t.arch === "arm64" ? "win_arm64" : "win32"); // sysconfig's name
    return out; // done
  } // windows
  if (t.os === "linux-glibc" || t.os === "linux-musl") { // Linux
    out.push(`linux_${t.arch}`); // the simple form first (packaging 26.3)
    if (t.os === "linux-glibc") { // manylinux
      const [gMaj, gMin] = t.osVersion; // the system's glibc
      const floor = t.arch === "x86_64" || t.arch === "i686" ? 5 : 17; // the oldest glibc considered (2.5 on x86, 2.17 elsewhere)
      if (gMaj === 2) { // the only glibc major in use
        for (let minor = gMin; minor >= floor; minor--) { // down to the floor
          out.push(`manylinux_2_${minor}_${t.arch}`); // the perennial name
          const legacy = minor === 17 ? "manylinux2014" : minor === 12 ? "manylinux2010" : minor === 5 ? "manylinux1" : null; // a legacy alias
          if (legacy) out.push(`${legacy}_${t.arch}`); // right after it
        } // minors
      } // glibc 2
    } else { // musllinux
      const [mMaj, mMin] = t.osVersion; // the system's musl
      for (let minor = mMin; minor >= 0; minor--) out.push(`musllinux_${mMaj}_${minor}_${t.arch}`); // same major, down to x.0
    } // libc
    return out; // done
  } // linux
  // macOS: mac_platforms(version, arch).
  const [vMaj, vMin] = t.osVersion; // the macOS version
  /** The binary formats a version and CPU accept (packaging's _mac_binary_formats). */
  const formats = (ver: [number, number], cpu: string): string[] => { // formats for one version
    const f = [cpu]; // the CPU itself
    const lt = (a: [number, number], b: [number, number]) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]); // version less-than
    if (cpu === "x86_64") { if (lt(ver, [10, 4])) return []; f.push("intel", "fat64", "fat3"); } // 64-bit Intel
    else if (cpu === "i386") { if (lt(ver, [10, 4])) return []; f.push("intel", "fat3", "fat"); } // 32-bit Intel
    if (cpu === "arm64" || cpu === "x86_64") f.push("universal2"); // the two-architecture format
    if (cpu === "x86_64" || cpu === "i386") f.push("universal"); // the old four-architecture format
    return f; // the formats
  }; // formats
  if (vMaj === 10) { // macOS 10.x: every older minor
    for (let minor = vMin; minor >= 0; minor--) for (const f of formats([10, minor], t.arch)) out.push(`macosx_10_${minor}_${f}`); // 10.minor
  } else { // macOS 11 and later: every major down to 11 (minor 0), then the 10.x tags
    for (let major = vMaj; major > 10; major--) for (const f of formats([major, 0], t.arch)) out.push(`macosx_${major}_0_${f}`); // major.0
    for (let minor = 16; minor > 3; minor--) { // 10.16 down to 10.4
      if (t.arch === "x86_64") for (const f of formats([10, minor], t.arch)) out.push(`macosx_10_${minor}_${f}`); // Intel accepts the old ones
      else out.push(`macosx_10_${minor}_universal2`); // Apple silicon: only universal2 can be that old
    } // 10.x
  } // macOS
  return out; // the list
} // targetPlatforms

/**
 * The installer's full ordered tag list for a target (packaging 26.3's sys_tags order).
 * @param t the target
 * @returns tag triples, best first
 */
export function targetTags(t: Target): string[] {
  // Platforms first, then the interpreter-specific part, then the compatible part.
  const plats = targetPlatforms(t); // platform tags
  const out: string[] = []; // the list
  const nodot = (minor: number) => `${t.major}${minor}`; // py_version_nodot
  if (t.impl === "cpython") { // cpython_tags
    const interp = `cp${nodot(t.minor)}`; // cp313
    const abi = `cp${nodot(t.minor)}${t.freeThreaded ? "t" : ""}`; // its ABI
    for (const p of plats) out.push(`${interp}-${abi}-${p}`); // own ABI
    if (!t.freeThreaded) for (const p of plats) out.push(`${interp}-abi3-${p}`); // stable ABI
    if (t.freeThreaded) for (const p of plats) out.push(`${interp}-abi3t-${p}`); // free-threaded stable ABI
    for (const p of plats) out.push(`${interp}-none-${p}`); // no ABI, this platform
    for (let minor = t.minor - 1; minor > 1; minor--) for (const p of plats) out.push(`cp${nodot(minor)}-${t.freeThreaded ? "abi3t" : "abi3"}-${p}`); // older stable ABIs
  } else { // generic_tags for PyPy
    const interp = `pp${nodot(t.minor)}`; // pp310
    for (const p of plats) out.push(`${interp}-pypy${nodot(t.minor)}_pp${PYPY_RELEASE}-${p}`); // its ABI
    for (const p of plats) out.push(`${interp}-none-${p}`); // no ABI
  } // implementation
  const pyRange = [`py${nodot(t.minor)}`, `py${t.major}`, ...Array.from({ length: t.minor }, (_, k) => `py${nodot(t.minor - 1 - k)}`)]; // _py_interpreter_range
  for (const v of pyRange) for (const p of plats) out.push(`${v}-none-${p}`); // pyXY-none-<platform>
  out.push(t.impl === "cpython" ? `cp${nodot(t.minor)}-none-any` : "pp3-none-any"); // the interpreter's own pure tag
  for (const v of pyRange) out.push(`${v}-none-any`); // pure Python
  return out; // the list
} // targetTags

/** The answer for one wheel and one target. */
export interface TargetMatch {
  /** True when one of the wheel's tags is in the target's list. */
  installs: boolean;
  /** The best (earliest) matching tag, or null. */
  bestTag: string | null;
  /** Its 1-based position in the target's list, or 0. */
  rank: number;
  /** The length of the target's list. */
  listLength: number;
  /** Every matching tag of the wheel, best first. */
  matches: string[];
} // TargetMatch

/**
 * Does a wheel with these expanded tags install on the target?
 * @param expanded the wheel's tag triples (lower case)
 * @param t the target
 * @returns the match
 */
export function matchTarget(expanded: string[], t: Target): TargetMatch {
  // Index the target's list once.
  const list = targetTags(t); // ordered tags
  const pos = new Map<string, number>(); // tag to position
  list.forEach((tag, i) => { if (!pos.has(tag)) pos.set(tag, i); }); // first position wins
  const matches = expanded.filter((tag) => pos.has(tag)).sort((a, b) => (pos.get(a) as number) - (pos.get(b) as number)); // matching, best first
  const bestTag = matches[0] ?? null; // the winner
  return { installs: bestTag !== null, bestTag, rank: bestTag ? (pos.get(bestTag) as number) + 1 : 0, listLength: list.length, matches }; // the answer
} // matchTarget
