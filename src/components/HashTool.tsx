"use client";

// ============================================================================
// src/components/HashTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE HASH TOOL (SHA-1/256/384/512).
//
// PRIVACY/SECURITY: hashing runs ENTIRELY IN THE BROWSER via Web Crypto - no
// fetch, no API, no server. run() is async and computes every algorithm at
// once, so switching the algorithm toggle just re-reads the result. A race
// guard (reqRef) discards stale async results when typing fast. Output renders
// as escaped text; copy uses the local Clipboard API only.
//
// FILES (2026-10-26). Below the text box, a drop zone that is also a
// keyboard-operable button hashes ONE file: the reader picks it with the
// browser's file picker (a hidden <input type="file">) or drops it anywhere on
// the tool. The browser reads the bytes on this device (W3C File API,
// Blob.arrayBuffer) and Web Crypto hashes them; there is still no fetch in this
// component, so the file is never uploaded. The size is checked BEFORE any
// read (FILE_HASH_MAX_BYTES, explained in compute.ts), the four digests run one
// after another with a live status line, and every failure is a message, so
// the page never stalls silently. The only outbound element is a plain link to
// VirusTotal's report for the file's SHA-256, which the reader may follow or
// not; building it sends nothing.
// ============================================================================

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { run, HASH_ALGORITHMS, type HashAlgorithm, type HashResult } from "@/lib/tools/hash";
// 2026-10-26: the file path's pure functions (size limit, Blob read and hash, size wording, VirusTotal link).
import {
  hashBlob,
  decideFileSize,
  describeByteSize,
  virusTotalFileReportUrl,
  FILE_HASH_MAX_BYTES,
  type BlobHashOutcome,
  type BytesHashResult,
} from "@/lib/tools/hash";
// 2026-10-27: the site's rule for links to other sites (new tab, and the rel every external link carries).
import { externalRel } from "@/lib/links";

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "abc";

/** What the browser reported about the chosen file, kept for display. */
interface FileMeta {
  /** The file's name, without any path (WHATWG HTML, File Upload state). */
  name: string;
  /** Its size in bytes (File API, Blob.size). */
  size: number;
  /** Its media type, or "" when the browser cannot determine it (File API, Blob.type). */
  type: string;
  /** How many files were offered at once (only the first is hashed). */
  offered: number;
}

/** The file view's state: nothing yet, reading, hashing step by step, done, or refused with a reason. */
export type FileViewState =
  // Nothing chosen.
  | { phase: "idle" }
  // The bytes are being read.
  | { phase: "reading"; meta: FileMeta }
  // One algorithm is running (step counts from 1).
  | { phase: "hashing"; meta: FileMeta; algorithm: HashAlgorithm; step: number; total: number }
  // All four digests are ready.
  | { phase: "done"; meta: FileMeta; result: BytesHashResult }
  // Refused or failed, with the reason the engine returned.
  | { phase: "refused"; meta: FileMeta; outcome: Exclude<BlobHashOutcome, { ok: true }> };

/** Optional opening state, for a server-side render harness only; the tool page passes nothing. */
interface HashToolProps {
  /** The file view's opening state (defaults to idle). */
  initialFileState?: FileViewState;
}

/** True when a drag carries files (the "Files" type is readable even while the data itself is protected). */
function dragHasFiles(dt: DataTransfer | null): boolean {
  // No data transfer object at all.
  if (!dt) return false;
  // WHATWG HTML: if any files are being dragged, one of the types is the string "Files".
  return Array.from(dt.types ?? []).includes("Files");
}

export default function HashTool({ initialFileState }: HashToolProps = {}) {
  const t = useTranslations("tools.hash");

  const [value, setValue] = useState("");
  const [result, setResult] = useState<HashResult | null>(null);
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("SHA-256");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  // 2026-10-26: the file view's state, and whether a file is being dragged over the tool.
  const [fileState, setFileState] = useState<FileViewState>(initialFileState ?? { phase: "idle" });
  // True while a drag carrying files is over the tool (the drop zone shows it).
  const [dragging, setDragging] = useState(false);

  // Monotonic request id: only the most recent async hash is allowed to win.
  const reqRef = useRef(0);
  // 2026-10-26: the same guard for files (a new file, or Clear, makes an older read's result stale).
  const fileReqRef = useRef(0);
  // The hidden file input the drop zone opens.
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = useCallback(async (next: string) => {
    setValue(next);
    setCopiedKey(null);
    if (next === "") {
      setResult(null);
      return;
    }
    const myReq = ++reqRef.current;
    const r = await run(next);
    if (reqRef.current === myReq) setResult(r);
  }, []);

  const copy = useCallback(async (text: string, key: string) => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
    } catch {
      // Clipboard unavailable: output stays selectable by hand.
    }
  }, []);

  /** Hash the first of the files offered (from the picker or a drop). */
  const handleFiles = useCallback(async (list: FileList | null) => {
    // The files as an array (a FileList is array-like).
    const files = list ? Array.from(list) : [];
    // Nothing offered: nothing to do.
    if (files.length === 0) return;
    // Only the first is hashed; the count is shown if there were more.
    const file = files[0];
    // What the browser reports, captured now (the File object is not kept).
    const meta: FileMeta = { name: file.name, size: file.size, type: file.type, offered: files.length };
    // This request's id; any later file or Clear supersedes it.
    const myReq = ++fileReqRef.current;
    // A new file clears any "Copied" mark.
    setCopiedKey(null);
    // The size decision first, so a refused file never shows "Reading".
    const decision = decideFileSize(file.size);
    // Refused before any read.
    if (!decision.ok) {
      // The decision carries the reason and the numbers the message needs.
      setFileState({ phase: "refused", meta, outcome: decision });
      // Nothing is read.
      return;
    }
    // Reading starts.
    setFileState({ phase: "reading", meta });
    // Read and hash, one algorithm at a time, reporting each step while this request is still current.
    const outcome = await hashBlob(file, {
      // Each step updates the status line ("SHA-384, 2 of 4").
      onStep: (alg, index, total) => {
        // A superseded request no longer touches the screen.
        if (fileReqRef.current === myReq) setFileState({ phase: "hashing", meta, algorithm: alg, step: index + 1, total });
      },
    });
    // A newer file or Clear arrived meanwhile: drop this result.
    if (fileReqRef.current !== myReq) return;
    // Done, or refused with the engine's reason.
    setFileState(outcome.ok ? { phase: "done", meta, result: outcome.result } : { phase: "refused", meta, outcome });
  }, []);

  /** Open the browser's file picker (needs the user's click or key press, which every caller is). */
  const openPicker = useCallback(() => {
    // The hidden input's activation shows the picker.
    inputRef.current?.click();
  }, []);

  /** Forget the file and its digests. */
  const clearFile = useCallback(() => {
    // Any read or hash still running becomes stale.
    fileReqRef.current++;
    // Back to the empty view.
    setFileState({ phase: "idle" });
    // No "Copied" mark left behind.
    setCopiedKey(null);
  }, []);

  const digest = result ? result.digests[algorithm] : null;
  const bits = digest ? digest.hex.length * 4 : 0;
  const bytes = digest ? digest.hex.length / 2 : 0;

  // 2026-10-26: the file's digest for the selected algorithm, once done.
  const fileDigest = fileState.phase === "done" ? fileState.result.digests[algorithm] : null;
  // The VirusTotal link is always for the SHA-256, whichever algorithm is shown.
  const vtUrl = fileState.phase === "done" ? virusTotalFileReportUrl(fileState.result.digests["SHA-256"].hex) : null;
  // The file currently described, in any phase but idle.
  const fileMeta = fileState.phase === "idle" ? null : fileState.meta;

  /** A byte count in words: "1,536 bytes (1.5 KiB)", or just "12 bytes" under one KiB. */
  const formatSize = (n: number): string => {
    // The IEC description, or null for a value that is not a byte count.
    const d = describeByteSize(n);
    // Not a byte count (refused as invalid): show the raw value.
    if (!d) return String(n);
    // Under one KiB the exact count says it all.
    if (d.unit === "B") return t("sizeBytes", { bytes: n });
    // Otherwise the exact count and the rounded unit.
    return t("sizeBytesUnit", { bytes: n, value: d.value, unit: d.unit });
  };

  /** A byte count in its unit only ("256 MiB"), for the limit. */
  const formatShort = (n: number): string => {
    // The IEC description (the limit is always a byte count).
    const d = describeByteSize(n);
    // Unit form.
    return d ? t("sizeShort", { value: d.value, unit: d.unit }) : String(n);
  };

  /** The refusal or failure message for an outcome. */
  const refusalText = (meta: FileMeta, outcome: Exclude<BlobHashOutcome, { ok: true }>): string => {
    // One message per reason.
    switch (outcome.reason) {
      // Over the limit: refused before reading.
      case "too-large":
        return t("fileTooLarge", { name: meta.name, size: formatSize(outcome.size), limit: formatShort(outcome.limit) });
      // A size that is not a byte count: refused before reading.
      case "invalid-size":
        return t("fileInvalidSize", { name: meta.name });
      // The read failed (File API errors).
      case "read-failed":
        return t("fileReadFailed", { name: meta.name, error: outcome.errorName });
      // The read returned a different length.
      case "size-mismatch":
        return t("fileSizeMismatch", { name: meta.name, size: formatSize(outcome.size), read: formatSize(outcome.read) });
      // Read, but not hashed.
      case "hash-failed":
        return t("fileHashFailed", { name: meta.name, error: outcome.errorName });
    }
  };

  return (
    <div
      className="cidr-tool jwt-tool"
      // 2026-10-26: a file dropped ANYWHERE on the tool is hashed (text drags are left to the text box).
      onDragEnter={(e) => {
        // Only drags carrying files are claimed.
        if (!dragHasFiles(e.dataTransfer)) return;
        // Cancelling dragenter/dragover is what allows a drop here (WHATWG HTML drag-and-drop processing model).
        e.preventDefault();
        // Show the drop zone's "over" state.
        setDragging(true);
      }}
      onDragOver={(e) => {
        // Only drags carrying files are claimed.
        if (!dragHasFiles(e.dataTransfer)) return;
        // Allow the drop.
        e.preventDefault();
        // A copy: the file stays where it is.
        e.dataTransfer.dropEffect = "copy";
        // Keep the "over" state (dragenter may have been missed on a child).
        if (!dragging) setDragging(true);
      }}
      onDragLeave={(e) => {
        // Moving between the tool's own children is not leaving it.
        const next = e.relatedTarget as Node | null;
        // Still inside: keep the state.
        if (next && e.currentTarget.contains(next)) return;
        // Left the tool.
        setDragging(false);
      }}
      onDrop={(e) => {
        // A text drop goes to the text box as usual.
        if (!dragHasFiles(e.dataTransfer)) return;
        // Stop the browser from opening the file instead.
        e.preventDefault();
        // The drag is over.
        setDragging(false);
        // Hash the first file dropped (the list is readable during drop only).
        void handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="seg-group">
        <div className="seg" role="group" aria-label={t("algorithmLabel")}>
          {HASH_ALGORITHMS.map((algo) => (
            <button
              key={algo}
              type="button"
              className={`seg-btn${algorithm === algo ? " seg-btn--active" : ""}`}
              aria-pressed={algorithm === algo}
              onClick={() => {
                setAlgorithm(algo);
                setCopiedKey(null);
              }}
            >
              {algo}
            </button>
          ))}
        </div>
      </div>

      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="hash-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => onChange(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => onChange("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="hash-input"
          className="cidr-input jwt-input mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("inputPlaceholder")}
          rows={4}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="hash-privacy"
        />
        <p id="hash-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
      </div>

      {digest && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="hash-algo-title">{algorithm}</h4>
            <p className="jwt-verify-hint">{t("bits", { bits, bytes })}</p>
            {algorithm === "SHA-1" && (
              <p className="jwt-badge jwt-badge--warn">{t("sha1Note")}</p>
            )}

            <div className="hash-out">
              <div className="b64-output-head">
                <span className="jwt-panel-title">{t("hex")}</span>
                <button
                  type="button"
                  className="b64-copy"
                  onClick={() => copy(digest.hex, "hex")}
                >
                  {copiedKey === "hex" ? t("copied") : t("copy")}
                </button>
              </div>
              <pre className="jwt-json">
                <code>{digest.hex}</code>
              </pre>
            </div>

            <div className="hash-out">
              <div className="b64-output-head">
                <span className="jwt-panel-title">{t("base64")}</span>
                <button
                  type="button"
                  className="b64-copy"
                  onClick={() => copy(digest.base64, "base64")}
                >
                  {copiedKey === "base64" ? t("copied") : t("copy")}
                </button>
              </div>
              <pre className="jwt-json">
                <code>{digest.base64}</code>
              </pre>
            </div>
          </section>
        </div>
      )}

      {/* ---- 2026-10-26: FILE VIEW ---- */}
      <div className="cidr-input-row">
        {/* The section's label, which also names the drop zone for assistive technology. */}
        <div className="dig-input-head">
          <span className="cidr-label" id="hash-file-label">
            {t("fileLabel")}
          </span>
        </div>
        {/* The picker itself: hidden (out of the focus order and the accessibility tree), opened by the zone; any type; one file. */}
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(e) => {
            // The chosen file(s).
            void handleFiles(e.target.files);
            // Reset, so choosing the same file again still fires change.
            e.target.value = "";
          }}
        />
        {/* The drop zone IS the file button: focusable, Enter or Space opens the picker, a click does too. */}
        <div
          className={dragging ? "pcap-drop pcap-drop--over" : "pcap-drop"}
          role="button"
          tabIndex={0}
          aria-labelledby="hash-file-label hash-file-title"
          aria-describedby="hash-file-hint hash-file-privacy"
          onClick={openPicker}
          onKeyDown={(e) => {
            // Enter activates on key down, like a native button.
            if (e.key === "Enter") {
              // No form submission or other default.
              e.preventDefault();
              // Open the picker.
              openPicker();
            } else if (e.key === " ") {
              // Space activates on key up; stop the page scrolling meanwhile.
              e.preventDefault();
            }
          }}
          onKeyUp={(e) => {
            // Space activates on key up, like a native button.
            if (e.key === " ") {
              // No scroll.
              e.preventDefault();
              // Open the picker.
              openPicker();
            }
          }}
        >
          {/* What to do, and the state while a drag is over the tool. */}
          <p className="pcap-drop-title" id="hash-file-title">
            {dragging ? t("fileDropActive") : t("fileDropTitle")}
          </p>
          {/* Any type, the limit. */}
          <p className="pcap-drop-hint" id="hash-file-hint">
            {t("fileDropHint", { limit: formatShort(FILE_HASH_MAX_BYTES) })}
          </p>
        </div>
        {/* Where the file goes: nowhere. */}
        <p id="hash-file-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("fileRunsLocally")}
        </p>
      </div>

      {/* Progress, announced politely: reading, then each algorithm in turn. */}
      <p className="cipher-note" role="status" aria-live="polite">
        {fileState.phase === "reading"
          ? t("fileReading", { name: fileState.meta.name })
          : fileState.phase === "hashing"
            ? t("fileHashing", { name: fileState.meta.name, algorithm: fileState.algorithm, step: fileState.step, total: fileState.total })
            : ""}
      </p>

      {/* Refused or failed: the reason, never a silent stop. */}
      {fileState.phase === "refused" && (
        <p className="cidr-error" role="alert">
          {refusalText(fileState.meta, fileState.outcome)}
        </p>
      )}

      {/* The result: what the browser reported, then the selected digest, then the lookup link. */}
      {fileState.phase === "done" && fileMeta && fileDigest && (
        <div className="jwt-results">
          <section className="jwt-panel" aria-labelledby="hash-file-result-title">
            {/* Title and Clear. */}
            <div className="b64-output-head">
              <span className="jwt-panel-title" id="hash-file-result-title">
                {t("fileResultTitle")}
              </span>
              <button type="button" className="b64-copy" onClick={clearFile}>
                {t("fileClear")}
              </button>
            </div>
            {/* Name, size and type, as the browser reports them. */}
            <dl className="jwt-claims">
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("fileName")}</dt>
                <dd className="jwt-claim-value mono">{fileMeta.name}</dd>
              </div>
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("fileSize")}</dt>
                <dd className="jwt-claim-value mono">{formatSize(fileMeta.size)}</dd>
              </div>
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("fileType")}</dt>
                <dd className="jwt-claim-value mono">{fileMeta.type || t("fileTypeUnknown")}</dd>
              </div>
            </dl>
            {/* What those values are, and that only the bytes count. */}
            <p className="jwt-verify-hint">{t("fileReportedNote")}</p>
            {/* More than one file offered. */}
            {fileMeta.offered > 1 && <p className="cidr-note">{t("fileMultiple", { count: fileMeta.offered, name: fileMeta.name })}</p>}
            {/* An empty file: the digests of empty input. */}
            {fileState.result.byteLength === 0 && <p className="cidr-note">{t("fileEmpty")}</p>}

            {/* The selected algorithm's digest of the file, as for text. */}
            <h4 className="hash-algo-title">{algorithm}</h4>
            <p className="jwt-verify-hint">{t("bits", { bits: fileDigest.hex.length * 4, bytes: fileDigest.hex.length / 2 })}</p>
            {algorithm === "SHA-1" && <p className="jwt-badge jwt-badge--warn">{t("sha1Note")}</p>}

            <div className="hash-out">
              <div className="b64-output-head">
                <span className="jwt-panel-title">{t("hex")}</span>
                <button type="button" className="b64-copy" onClick={() => copy(fileDigest.hex, "file-hex")}>
                  {copiedKey === "file-hex" ? t("copied") : t("copy")}
                </button>
              </div>
              <pre className="jwt-json">
                <code>{fileDigest.hex}</code>
              </pre>
            </div>

            <div className="hash-out">
              <div className="b64-output-head">
                <span className="jwt-panel-title">{t("base64")}</span>
                <button type="button" className="b64-copy" onClick={() => copy(fileDigest.base64, "file-base64")}>
                  {copiedKey === "file-base64" ? t("copied") : t("copy")}
                </button>
              </div>
              <pre className="jwt-json">
                <code>{fileDigest.base64}</code>
              </pre>
            </div>

            {/* The outbound lookup: a plain link the reader chooses to follow, carrying the SHA-256 only. It opens in a
                new tab with the rel the site gives every external link (src/lib/links.ts: "noopener noreferrer" for
                every host but the training partner's), so VirusTotal gets no opener and no Referer. */}
            {vtUrl && (
              <>
                <p className="cidr-note">
                  <a href={vtUrl} target="_blank" rel={externalRel(vtUrl)}>
                    {t("vtLink")} <span aria-hidden="true">↗</span>
                    <span className="sr-only"> {t("newTab")}</span>
                  </a>
                </p>
                <p className="jwt-verify-hint">{t("vtNote")}</p>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
