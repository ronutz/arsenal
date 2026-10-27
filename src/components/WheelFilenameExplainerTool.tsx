"use client";

// ============================================================================
// src/components/WheelFilenameExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the wheel filename & PEP 440 version explainer. Two modes:
//   - File name: a wheel (or sdist) file name, or a URL to one. The verdict
//     first; then the parts (name, version, build tag, tags) with what each
//     means; then every expanded tag triple with the interpreters and the
//     platform it needs; then the findings; then a check against a described
//     interpreter and system (does it install, which tag wins, and where that
//     tag sits in the installer's list).
//   - Versions: a list of versions and an optional specifier set. Each version
//     normalized with what normalization changed, the list in PEP 440 order,
//     and, with a specifier, which versions fall in range and which an
//     installer would take by default.
//
// The engine (src/lib/tools/wheel-filename-explainer) does all the work in the
// browser; this component only lays it out and words it. Words:
// "tools.wheel-filename-explainer". Styling reuses existing classes (cidr-*,
// json-*, jwt-*, tcl-*, irl-sev-*, dig-*); no new CSS class.
// ============================================================================

import { useMemo, useState } from "react"; // state and memoised results
import { useTranslations } from "next-intl"; // this tool's messages
import { explainFilename, explainVersions, checkTarget, MAX_INPUT_CHARS, MAX_VERSIONS, type FilenameReading, type VersionsReading } from "@/lib/tools/wheel-filename-explainer/compute"; // the engine
import { MAC_MULTI_ARCH, PYPY_RELEASE, type InterpreterRule, type PlatformTag, type Target } from "@/lib/tools/wheel-filename-explainer/tags"; // tag tables and types
import { compareVersions, type Pep440Version, type SpecClause } from "@/lib/tools/wheel-filename-explainer/pep440"; // the PEP 440 comparison and version types
import { EXAMPLE_FILENAME, EXAMPLE_TARGET, EXAMPLE_VERSIONS, EXAMPLE_SPECIFIER } from "@/lib/tools/wheel-filename-explainer/example"; // the Example (D-83)

/** Implementation codes to display names (the specification's abbreviations). */
const IMPL_NAMES: Record<string, string> = { py: "Python", cp: "CPython", pp: "PyPy", ip: "IronPython", jy: "Jython" }; // names
/** Severity to the shared badge class. */
const SEV_CLASS: Record<string, string> = { error: "irl-sev-high", warning: "irl-sev-warning", note: "irl-sev-info" }; // badge classes
/** The glibc versions offered for a Linux target. */
const GLIBC = [17, 23, 26, 27, 28, 31, 34, 35, 36, 39, 41]; // 2.17 (the manylinux2014 baseline) to 2.41
/** The macOS versions offered. */
const MACOS: Array<[number, number]> = [[10, 9], [10, 13], [10, 15], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [26, 0]]; // 10.9 to 26
/** The Python minor versions offered: the supported branches on the devguide's "Status of Python versions" (read 2026-10-27): 3.11 to 3.13 security, 3.14 and 3.15 bugfix. */
const MINORS = [11, 12, 13, 14, 15]; // 3.10 reached end of life on 2026-10-01; 3.16 is the development branch (first release planned 2027-10-06)

/** The page component. */
export default function WheelFilenameExplainerTool() {
  // This tool's words.
  const t = useTranslations("tools.wheel-filename-explainer");
  // The mode.
  const [mode, setMode] = useState<"file" | "versions">("file"); // file name or versions
  // The file name box.
  const [fileName, setFileName] = useState(""); // empty until typed or Example
  // The versions box and the specifier box.
  const [versions, setVersions] = useState(""); // versions
  const [spec, setSpec] = useState(""); // specifier set
  // The target.
  const [target, setTarget] = useState<Target>(EXAMPLE_TARGET); // starts as the Example's
  // Whether the target check is shown.
  const [showTarget, setShowTarget] = useState(false); // closed until asked

  // The file name reading.
  const file = useMemo((): FilenameReading | "too-long" | null => {
    // Nothing yet, too long, or read.
    if (fileName.trim() === "") return null; // nothing
    if (fileName.length > MAX_INPUT_CHARS) return "too-long"; // refused
    return explainFilename(fileName); // read
  }, [fileName]); // recomputed on change
  // The target match.
  const match = useMemo(() => (file && file !== "too-long" && file.valid && showTarget ? checkTarget(file, target) : null), [file, target, showTarget]); // only when asked
  // The versions reading.
  const vr = useMemo((): VersionsReading | "too-long" | null => {
    // Nothing yet, too long, or read.
    if (versions.trim() === "" && spec.trim() === "") return null; // nothing
    if (versions.length + spec.length > MAX_INPUT_CHARS) return "too-long"; // refused
    return explainVersions(versions, spec); // read
  }, [versions, spec]); // recomputed on change

  /** The Example: both modes filled, the target opened. */
  const example = () => {
    // Fill the current mode's boxes.
    if (mode === "file") { setFileName(EXAMPLE_FILENAME); setTarget(EXAMPLE_TARGET); setShowTarget(true); } // a real wheel
    else { setVersions(EXAMPLE_VERSIONS); setSpec(EXAMPLE_SPECIFIER); } // the compatible-release example
  }; // example
  /** Clear the current mode's boxes. */
  const clear = () => {
    // Empty the inputs.
    if (mode === "file") { setFileName(""); setShowTarget(false); } // file name
    else { setVersions(""); setSpec(""); } // versions
  }; // clear

  /** Words for one version's kind. */
  const kinds = (v: Pep440Version): string => {
    // Final, or the segments it carries.
    const k: string[] = []; // the kinds
    if (v.pre) k.push(t("kind.pre", { phase: v.pre.phase, n: v.pre.n })); // a pre-release
    if (v.post !== null) k.push(t("kind.post", { n: v.post })); // a post-release
    if (v.dev !== null) k.push(t("kind.dev", { n: v.dev })); // a development release
    if (v.local) k.push(t("kind.local", { label: v.local.join(".") })); // a local label
    if (v.epoch !== "0") k.push(t("kind.epoch", { n: v.epoch })); // an epoch
    return k.length ? k.join("; ") : t("kind.final"); // the words
  }; // kinds

  /** Words for an interpreter rule. */
  const ruleText = (r: InterpreterRule): string => {
    // One message per kind.
    switch (r.kind) { // by kind
      case "any-major": return t("rule.anyMajor", { major: r.major }); // pyX
      case "any-from": return t("rule.anyFrom", { major: r.major, minor: r.minor }); // pyXY
      case "pypy-major": return t("rule.pypyMajor", { major: r.major }); // pp3
      case "impl-exact": return t("rule.implExact", { impl: IMPL_NAMES[r.impl] ?? r.implName, version: r.minor === null ? `${r.major}` : `${r.major}.${r.minor}` }); // cpXY-none
      case "cpython-abi": return t(r.freeThreaded ? "rule.cpythonAbiFt" : "rule.cpythonAbi", { version: `${r.major}.${r.minor}` }) + (r.debug ? ` ${t("rule.flagDebug")}` : "") + (r.pymalloc ? ` ${t("rule.flagPymalloc")}` : "") + (r.ucs4 ? ` ${t("rule.flagUcs4")}` : ""); // own ABI
      case "cpython-stable": return t(r.abi === "abi3" ? "rule.stableAbi3" : "rule.stableAbi3t", { version: `${r.major}.${r.minor}` }); // stable ABI
      case "pypy-abi": return t("rule.pypyAbi", { version: `${r.major}.${r.minor}`, release: r.release }); // PyPy ABI
      case "impl-abi": return t("rule.implAbi", { impl: r.implName, abi: r.abi }); // another implementation
      case "impossible": return t(`impossible.${r.reason}`); // no installer lists it
    } // switch
    return ""; // unreachable: every kind is handled
  }; // ruleText

  /** Words for a platform tag. */
  const platText = (p: PlatformTag): string => {
    // One message per family.
    const v = p.version ?? [0, 0]; // the version, when there is one
    switch (p.family) { // by family
      case "any": return t("platform.any"); // anywhere
      case "windows": return t("platform.windows", { arch: p.arch }); // Windows
      case "manylinux": return t(p.legacy ? "platform.manylinuxLegacy" : "platform.manylinux", { major: v[0], minor: v[1], arch: p.arch, legacy: p.legacy ?? "" }); // glibc
      case "musllinux": return t("platform.musllinux", { major: v[0], minor: v[1], arch: p.arch }); // musl
      case "linux": return t("platform.linux", { arch: p.arch }); // the simple form
      case "macos": return MAC_MULTI_ARCH[p.arch] ? t("platform.macosMulti", { major: v[0], minor: v[1], arch: p.arch, archs: p.archs.join(", ") }) : t("platform.macos", { major: v[0], minor: v[1], arch: p.arch }); // macOS
      case "ios": return t("platform.ios", { major: v[0], minor: v[1], arch: p.arch, sdk: p.sdk ?? "" }); // iOS
      case "android": return t("platform.android", { api: v[0], abi: p.arch }); // Android
      case "pyemscripten": return t("platform.pyemscripten", { year: p.emscripten?.[0] ?? 0, patch: p.emscripten?.[1] ?? 0 }); // Emscripten
      case "other": return t("platform.other", { tag: p.tag }); // another platform
    } // switch
    return ""; // unreachable: every family is handled
  }; // platText

  /** Words for one specifier clause. */
  const clauseText = (c: SpecClause): string => {
    // One message per operator.
    const v = c.version; // the version, absent for ===
    if (c.op === "===") return t("clause.arbitrary", { v: c.versionText }); // text equality
    if (c.op === "~=") return t("clause.compatible", { a: c.compatible?.[0] ?? "", b: c.compatible?.[1] ?? "" }); // the pair
    if ((c.op === "==" || c.op === "!=") && c.wildcard) return t(c.op === "==" ? "clause.prefix" : "clause.notPrefix", { prefix: `${v?.epoch !== "0" ? `${v?.epoch}!` : ""}${v?.release.join(".")}` }); // prefix matching
    if (c.op === "==" || c.op === "!=") return t(`${c.op === "==" ? "clause.equal" : "clause.notEqual"}${v?.local ? "Local" : ""}`, { v: v?.normalized ?? "" }); // strict
    const key: Record<string, string> = { ">=": "clause.ge", "<=": "clause.le", "<": "clause.lt", ">": "clause.gt" }; // ordered
    return t(key[c.op], { v: v?.normalized ?? "" }); // ordered comparison
  }; // clauseText

  /** The OS versions offered for the target's operating system. */
  const osVersions = (): Array<[number, number]> => (target.os === "linux-glibc" ? GLIBC.map((m) => [2, m] as [number, number]) : target.os === "linux-musl" ? [[1, 1], [1, 2]] : target.os === "macos" ? MACOS : [[0, 0]]); // per OS
  /** The architectures offered for the target's operating system. */
  const archs = (): string[] => (target.os === "macos" ? ["arm64", "x86_64"] : target.os === "windows" ? ["x86_64", "arm64", "x86"] : ["x86_64", "aarch64", "armv7l", "ppc64le", "s390x"]); // per OS
  /** Change the target's operating system, resetting the version and architecture to sensible ones. */
  const setOs = (os: Target["os"]) => setTarget({ ...target, os, osVersion: os === "linux-glibc" ? [2, 39] : os === "linux-musl" ? [1, 2] : os === "macos" ? [14, 0] : [0, 0], arch: os === "macos" ? "arm64" : "x86_64" }); // reset

  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The two modes. */}
      <div className="json-controls" role="group" aria-label={t("modesLabel")}>
        <div className="json-segmented">
          <button type="button" className={`json-seg${mode === "file" ? " is-active" : ""}`} aria-pressed={mode === "file"} onClick={() => setMode("file")}>
            {t("modeFile")}
          </button>
          <button type="button" className={`json-seg${mode === "versions" ? " is-active" : ""}`} aria-pressed={mode === "versions"} onClick={() => setMode("versions")}>
            {t("modeVersions")}
          </button>
        </div>
      </div>

      {mode === "file" ? (
        <div className="cidr-input-row">
          <div className="dig-input-head">
            <label className="cidr-label" htmlFor="wfe-file">
              {t("fileLabel")}
            </label>
            <div className="dig-input-actions">
              {/* D-83 Example/Clear row: the Example is FILE_VECTORS[0] and TARGET_VECTORS[0]. */}
              <button type="button" className="b64-copy" onClick={example}>
                {t("example")}
              </button>
              <button type="button" className="b64-copy" onClick={clear}>
                {t("clear")}
              </button>
            </div>
          </div>
          <input
            id="wfe-file"
            className="cidr-input mono"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder={t("filePlaceholder")}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-describedby="wfe-privacy"
          />
          <p id="wfe-privacy" className="cidr-privacy">
            <span className="cidr-lock" aria-hidden="true">
              ●
            </span>{" "}
            {t("runsLocally")}
          </p>
        </div>
      ) : (
        <div className="cidr-input-row">
          <div className="dig-input-head">
            <label className="cidr-label" htmlFor="wfe-versions">
              {t("versionsLabel")}
            </label>
            <div className="dig-input-actions">
              {/* D-83 Example/Clear row: the Example is SPEC_VECTORS[0]. */}
              <button type="button" className="b64-copy" onClick={example}>
                {t("example")}
              </button>
              <button type="button" className="b64-copy" onClick={clear}>
                {t("clear")}
              </button>
            </div>
          </div>
          <textarea
            id="wfe-versions"
            className="cidr-input mono json-input"
            rows={4}
            value={versions}
            onChange={(e) => setVersions(e.target.value)}
            placeholder={t("versionsPlaceholder")}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-describedby="wfe-privacy2"
          />
          <label className="cidr-label" htmlFor="wfe-spec">
            {t("specLabel")}
          </label>
          <input id="wfe-spec" className="cidr-input mono" value={spec} onChange={(e) => setSpec(e.target.value)} placeholder={t("specPlaceholder")} autoComplete="off" spellCheck={false} />
          <p id="wfe-privacy2" className="cidr-privacy">
            <span className="cidr-lock" aria-hidden="true">
              ●
            </span>{" "}
            {t("runsLocally")}
          </p>
        </div>
      )}

      {/* File name mode. */}
      {mode === "file" && file === "too-long" && <p className="tcl-verdict tcl-verdict-bad" role="alert">{t("tooLong", { max: MAX_INPUT_CHARS })}</p>}
      {mode === "file" && file && file !== "too-long" && (
        <div className="jwt-results">
          {/* The verdict. */}
          <p className={`tcl-verdict ${file.valid ? "tcl-verdict-ok" : "tcl-verdict-bad"}`}>
            {file.valid ? t(`verdict.${file.kind === "sdist-zip" ? "sdistZip" : file.kind}`, { name: file.name?.normalized ?? "", version: file.version?.normalized ?? "" }) : t("verdict.invalid")}
          </p>
          {file.fromPath && <p className="tcl-muted tcl-small">{t("fromPath", { name: file.fileName })}</p>}

          {/* The parts. */}
          {file.kind !== "unknown" && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("partsTitle")}</h4>
              <div className="tcl-table-wrap">
                <table className="tcl-table">
                  <thead>
                    <tr>
                      <th scope="col">{t("colPart")}</th>
                      <th scope="col">{t("colWritten")}</th>
                      <th scope="col">{t("colMeaning")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">{t("part.distribution")}</th>
                      <td><code>{file.parts.distribution}</code></td>
                      <td>{file.name ? t("meaning.name", { normalized: file.name.normalized, escaped: file.expectedName }) : t("none")}</td>
                    </tr>
                    <tr>
                      <th scope="row">{t("part.version")}</th>
                      <td><code>{file.parts.version}</code></td>
                      <td>{file.version ? t("meaning.version", { normalized: file.version.normalized, kind: kinds(file.version) }) : file.versionError ? t(`versionError.${file.versionError.code}`, { at: file.versionError.at + 1 }) : t("none")}</td>
                    </tr>
                    {file.parts.build !== null && (
                      <tr>
                        <th scope="row">{t("part.build")}</th>
                        <td><code>{file.parts.build}</code></td>
                        <td>{file.build ? t(file.build.rest ? "meaning.build" : "meaning.buildNumber", { number: file.build.number, rest: file.build.rest }) : t("finding.bad-build-tag")}</td>
                      </tr>
                    )}
                    {file.pythonTags.map((p) => (
                      <tr key={`py-${p.tag}`}>
                        <th scope="row">{t("part.python")}</th>
                        <td><code>{p.tag}</code></td>
                        <td>{p.unreadable ? t("meaning.pythonUnreadable") : t(p.impl === "py" ? (p.minor === null ? "meaning.pythonGenericMajor" : "meaning.pythonGeneric") : p.impl === "other" ? "meaning.pythonOther" : p.minor === null ? "meaning.pythonMajor" : "meaning.python", { impl: IMPL_NAMES[p.impl] ?? p.implName, major: p.major ?? 0, version: p.minor === null ? `${p.major}` : `${p.major}.${p.minor}` })}</td>
                      </tr>
                    ))}
                    {file.abiTags.map((a) => (
                      <tr key={`abi-${a.tag}`}>
                        <th scope="row">{t("part.abi")}</th>
                        <td><code>{a.tag}</code></td>
                        <td>{t(`abi.${a.kind}`, { version: `${a.major ?? 0}.${a.minor ?? 0}`, release: a.pypyRelease ?? "" })}{a.kind === "cpython" && [...a.flags].map((f) => ` ${t(`abiFlag.${"dmut".includes(f) ? f : "x"}`, { flag: f })}`).join("")}</td>
                      </tr>
                    ))}
                    {file.platformTags.map((p) => (
                      <tr key={`pl-${p.tag}`}>
                        <th scope="row">{t("part.platform")}</th>
                        <td><code>{p.tag}</code></td>
                        <td>{platText(p)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {file.pythonTags.length + file.abiTags.length + file.platformTags.length > 3 && <p className="tcl-muted tcl-small">{t("compressedNote")}</p>}
            </section>
          )}

          {/* Every combination and what it needs. */}
          {file.expanded.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("installsTitle", { n: file.expandedCount })}</h4>
              <div className="tcl-table-wrap">
                <table className="tcl-table">
                  <thead>
                    <tr>
                      <th scope="col">{t("colTag")}</th>
                      <th scope="col">{t("colInterpreters")}</th>
                      <th scope="col">{t("colPlatform")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {file.expanded.map((e) => (
                      <tr key={e.tag}>
                        <td><code>{e.tag}</code></td>
                        <td>{ruleText(e.interpreter)}</td>
                        <td>{platText(e.platform)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="tcl-muted tcl-small">{t("installsNote")}</p>
            </section>
          )}

          {/* The findings. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("findingsTitle")}</h4>
            {file.findings.length === 0 ? (
              <p className="tcl-verdict tcl-verdict-ok">{t("clean")}</p>
            ) : (
              <ul className="tcl-findings">
                {file.findings.map((f, i) => (
                  <li key={`${f.code}-${i}`} className={`tcl-finding tcl-finding-${f.severity === "note" ? "info" : f.severity}`}>
                    <div className="tcl-finding-head">
                      <span className={`irl-sev ${SEV_CLASS[f.severity]}`}>{t(`sev.${f.severity}`)}</span> <span className="tcl-finding-title">{f.code}</span>
                    </div>
                    <p className="tcl-finding-msg">{t(`finding.${f.code}`, { tag: "", alias: "", legacy: "", expected: "", normalized: "", hyphens: 0, set: "", count: 0, max: 0, pair: "", at: 0, ...f.params, reason: f.params.reason ? t(`impossible.${f.params.reason}`) : "" })}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* The target check. */}
          {file.valid && file.kind === "wheel" && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("target.title")}</h4>
              {!showTarget ? (
                <button type="button" className="b64-copy" onClick={() => setShowTarget(true)}>
                  {t("target.open")}
                </button>
              ) : (
                <>
                  <div className="json-controls" role="group" aria-label={t("target.title")}>
                    <div className="json-control">
                      <label className="json-control-label" htmlFor="wfe-impl">{t("target.impl")}</label>
                      <select id="wfe-impl" className="json-select" value={target.impl} onChange={(e) => setTarget({ ...target, impl: e.target.value === "pypy" ? "pypy" : "cpython", freeThreaded: e.target.value === "pypy" ? false : target.freeThreaded })}>
                        <option value="cpython">CPython</option>
                        <option value="pypy">PyPy</option>
                      </select>
                    </div>
                    <div className="json-control">
                      <label className="json-control-label" htmlFor="wfe-minor">{t("target.python")}</label>
                      <select id="wfe-minor" className="json-select" value={String(target.minor)} onChange={(e) => setTarget({ ...target, minor: Number(e.target.value), freeThreaded: Number(e.target.value) >= 13 && target.freeThreaded })}>
                        {MINORS.map((m) => (<option key={m} value={String(m)}>{`3.${m}`}</option>))}
                      </select>
                    </div>
                    {target.impl === "cpython" && target.minor >= 13 && (
                      <div className="json-control">
                        <label className="json-checkbox">
                          <input type="checkbox" checked={target.freeThreaded} onChange={(e) => setTarget({ ...target, freeThreaded: e.target.checked })} />
                          {t("target.freeThreaded")}
                        </label>
                      </div>
                    )}
                    <div className="json-control">
                      <label className="json-control-label" htmlFor="wfe-os">{t("target.os")}</label>
                      <select id="wfe-os" className="json-select" value={target.os} onChange={(e) => setOs(e.target.value as Target["os"])}>
                        <option value="linux-glibc">{t("target.osLinuxGlibc")}</option>
                        <option value="linux-musl">{t("target.osLinuxMusl")}</option>
                        <option value="macos">{t("target.osMacos")}</option>
                        <option value="windows">{t("target.osWindows")}</option>
                      </select>
                    </div>
                    {target.os !== "windows" && (
                      <div className="json-control">
                        <label className="json-control-label" htmlFor="wfe-osv">{t(target.os === "macos" ? "target.osVersionMacos" : target.os === "linux-musl" ? "target.osVersionMusl" : "target.osVersionGlibc")}</label>
                        <select id="wfe-osv" className="json-select" value={target.osVersion.join(".")} onChange={(e) => setTarget({ ...target, osVersion: e.target.value.split(".").map(Number) as [number, number] })}>
                          {osVersions().map((v) => (<option key={v.join(".")} value={v.join(".")}>{v.join(".")}</option>))}
                        </select>
                      </div>
                    )}
                    <div className="json-control">
                      <label className="json-control-label" htmlFor="wfe-arch">{t("target.arch")}</label>
                      <select id="wfe-arch" className="json-select" value={target.arch} onChange={(e) => setTarget({ ...target, arch: e.target.value })}>
                        {archs().map((a) => (<option key={a} value={a}>{a}</option>))}
                      </select>
                    </div>
                  </div>
                  {match && (
                    <p className={`tcl-verdict ${match.installs ? "tcl-verdict-ok" : "tcl-verdict-bad"}`}>
                      {match.installs ? t("target.yes", { tag: match.bestTag ?? "", rank: match.rank, total: match.listLength }) : t("target.no", { total: match.listLength })}
                    </p>
                  )}
                  <p className="tcl-muted tcl-small">{t("target.howNote")}</p>
                  {target.impl === "pypy" && <p className="tcl-muted tcl-small">{t("target.pypyNote", { release: PYPY_RELEASE })}</p>}
                </>
              )}
            </section>
          )}
        </div>
      )}

      {/* Versions mode. */}
      {mode === "versions" && vr === "too-long" && <p className="tcl-verdict tcl-verdict-bad" role="alert">{t("tooLong", { max: MAX_INPUT_CHARS })}</p>}
      {mode === "versions" && vr && vr !== "too-long" && (
        <div className="jwt-results">
          {vr.truncated && <p className="tcl-verdict tcl-verdict-warn">{t("versions.truncated", { max: MAX_VERSIONS })}</p>}
          {vr.entries.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("versions.title", { n: vr.entries.length })}</h4>
              <div className="tcl-table-wrap">
                <table className="tcl-table">
                  <thead>
                    <tr>
                      <th scope="col">{t("versions.colWritten")}</th>
                      <th scope="col">{t("versions.colNormal")}</th>
                      <th scope="col">{t("versions.colKind")}</th>
                      <th scope="col">{t("versions.colNotes")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vr.entries.map((e, i) => (
                      <tr key={`${i}-${e.text}`}>
                        <td><code>{e.text}</code></td>
                        <td>{e.version ? <code>{e.version.normalized}</code> : <span className="tcl-pill tcl-pill-bad">{t("versions.invalid")}</span>}</td>
                        <td>{e.version ? kinds(e.version) : e.error ? t(`versionError.${e.error.code}`, { at: e.error.at + 1 }) : ""}</td>
                        <td>{e.version ? (e.version.notes.length ? e.version.notes.map((n) => t(`note.${n}`)).join(" ") : e.version.isCanonical ? t("versions.canonical") : t("versions.localOnly")) : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {vr.sorted.length > 1 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("versions.sortedTitle")}</h4>
              <p className="mono">{vr.sorted.map((i, k) => (k === 0 ? "" : compareVersions(vr.entries[vr.sorted[k - 1]].version as Pep440Version, vr.entries[i].version as Pep440Version) === 0 ? "  =  " : "  <  ") + (vr.entries[i].version?.normalized ?? "")).join("")}</p>{/* "=" between versions PEP 440 calls equal, "<" otherwise */}
              {vr.equalGroups.map((g, k) => (
                <p key={k} className="tcl-muted tcl-small">{t("versions.equal", { list: g.map((i) => vr.entries[i].text).join(", ") })}</p>
              ))}
              <p className="tcl-muted tcl-small">{t("versions.orderNote")}</p>
            </section>
          )}
          {vr.specifier && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("spec.title")}</h4>
              {!vr.specifier.ok ? (
                <ul className="tcl-findings">
                  {vr.specifier.errors.map((e, i) => (
                    <li key={i} className="tcl-finding tcl-finding-error">
                      <p className="tcl-finding-msg"><code>{e.text}</code> {t(`specError.${e.code}`)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <ul>
                    {vr.specifier.clauses.map((c, i) => (
                      <li key={i}><code>{c.text}</code>: {clauseText(c)}</li>
                    ))}
                    {vr.specifier.clauses.length === 0 && <li>{t("spec.empty")}</li>}
                  </ul>
                  {vr.selection && vr.entries.some((e) => e.version) && (
                    <>
                      <div className="tcl-table-wrap">
                        <table className="tcl-table">
                          <thead>
                            <tr>
                              <th scope="col">{t("versions.colWritten")}</th>
                              <th scope="col">{t("spec.colInRange")}</th>
                              <th scope="col">{t("spec.colSelected")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vr.entries.map((e, i) =>
                              e.version ? (
                                <tr key={`${i}-${e.text}`}>
                                  <td><code>{e.text}</code>{i === vr.selection!.preferred ? ` ${t("spec.preferred")}` : ""}</td>
                                  <td>{vr.selection!.inRange.includes(i) ? <span className="tcl-pill tcl-pill-true">{t("yes")}</span> : <span className="tcl-pill tcl-pill-false">{t("no")}</span>}</td>
                                  <td>{vr.selection!.selected.includes(i) ? <span className="tcl-pill tcl-pill-true">{t("yes")}</span> : <span className="tcl-pill tcl-pill-false">{t("no")}</span>}</td>
                                </tr>
                              ) : null,
                            )}
                          </tbody>
                        </table>
                      </div>
                      <p className="cipher-note">{t(`spec.policy.${vr.selection.prereleasePolicy}`)}</p>
                    </>
                  )}
                </>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
