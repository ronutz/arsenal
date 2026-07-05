"use client";

// ============================================================================
// src/components/CopyEditor.tsx
// ----------------------------------------------------------------------------
// THE COPY EDITOR (client island for the gated /copy-<obscure> page).
//
// Loads every UI string for a selected language and lets an operator edit any of
// them in place, then EXPORT the result. Because ronutz.com is a static export
// with no server and no database (the Worker only serves assets and runs
// stateless compute — there is nowhere to POST a save), this editor CANNOT write
// back to the live site. Its honest job is an authoring/translation workbench:
//   1. pick a language (only the 16 LIVE locales, each of which has a message
//      file; stub locales have no file and just redirect to English);
//   2. edit any string; changes are tracked and highlighted;
//   3. export — either the COMPLETE updated <locale>.json to drop into
//      src/i18n/messages/ and redeploy, or a CHANGED-KEYS view for review.
//
// The source-of-truth copy is handed in as a prop (the server page imports each
// live locale's JSON at build time). We never mutate the incoming data; edits
// live in component state and are merged into a deep copy on export.
//
// DATA SHAPE: messages nest up to ~6 levels; leaf values are strings, arrays of
// strings, or null. We FLATTEN to dotted paths for editing (arrays get an index
// segment, e.g. "a.b.2"), and UNFLATTEN on export to restore the exact nested
// structure, arrays, and nulls. Non-string leaves stay editable as text and are
// coerced back to their original kind on export (null stays null unless edited).
// ============================================================================

import { useMemo, useState } from "react";

// A single editable leaf: its dotted path, current (possibly edited) value, the
// original value, and what kind it was so we can restore structure on export.
// `arrayMask[i]` marks whether the container HOLDING segment i is an array (vs
// an object). This is captured from the SOURCE structure so we never have to
// guess from a segment's shape — objects with all-numeric keys (e.g. a "rating"
// map keyed "1".."5") stay objects, not arrays, on round-trip.
type LeafKind = "string" | "array-item" | "null";
interface Leaf {
  path: string;
  kind: LeafKind;
  original: string;
  arrayMask: boolean[];
}

export interface CopyEditorLabels {
  langLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  onlyChanged: string;
  changedCount: string; // contains {n}
  exportFull: string;
  exportDiff: string;
  copyClipboard: string;
  download: string;
  reset: string;
  resetOne: string;
  empty: string;
  diffTitle: string;
  fullTitle: string;
  close: string;
  copied: string;
  namespaceLabel: string;
}

interface LocaleData {
  /** BCP-47 code, e.g. "pt-BR". */
  code: string;
  /** Display name, e.g. "Português (Brasil)". */
  name: string;
  /** The full message object for this locale. */
  messages: unknown;
}

// ---- flatten / unflatten ---------------------------------------------------
// Flatten a nested messages object into ordered leaves with dotted paths.
// `mask` accumulates, per path segment, whether the container holding it is an
// array; each leaf carries a copy so unflatten can rebuild the exact structure.
function flatten(obj: unknown, prefix: string, mask: boolean[], out: Leaf[]): void {
  if (obj === null) {
    out.push({ path: prefix, kind: "null", original: "", arrayMask: [...mask] });
    return;
  }
  if (typeof obj === "string") {
    out.push({ path: prefix, kind: "string", original: obj, arrayMask: [...mask] });
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => flatten(v, `${prefix}.${i}`, [...mask, true], out));
    return;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      flatten(v, prefix ? `${prefix}.${k}` : k, [...mask, false], out);
    }
  }
}

// Rebuild a nested object from edited leaf values, preserving arrays, nulls, and
// objects-with-numeric-keys. `edits` maps path -> current string value. The
// container type at each level comes from the leaf's arrayMask (source truth),
// NOT from whether a segment looks numeric.
function unflatten(leaves: Leaf[], edits: Record<string, string>): unknown {
  const root: Record<string, unknown> = {};
  for (const leaf of leaves) {
    const value =
      leaf.kind === "null" && !(leaf.path in edits)
        ? null
        : edits[leaf.path] ?? leaf.original;
    const segs = leaf.path.split(".");
    let node: Record<string, unknown> | unknown[] = root;
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      const isLast = i === segs.length - 1;
      // Is the container that will hold the NEXT segment an array?
      const nextIsArray = leaf.arrayMask[i + 1] === true;
      if (isLast) {
        if (Array.isArray(node)) (node as unknown[])[Number(seg)] = value;
        else (node as Record<string, unknown>)[seg] = value;
      } else {
        const key = Array.isArray(node) ? Number(seg) : seg;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing: unknown = (node as any)[key];
        if (existing === undefined) {
          const created: Record<string, unknown> | unknown[] = nextIsArray ? [] : {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (node as any)[key] = created;
          node = created;
        } else {
          node = existing as Record<string, unknown> | unknown[];
        }
      }
    }
  }
  return root;
}

// The top-level namespace of a dotted path (for the group label / filter).
function namespaceOf(path: string): string {
  return path.split(".")[0];
}

export default function CopyEditor({
  locales,
  labels,
}: {
  locales: LocaleData[];
  labels: CopyEditorLabels;
}) {
  const [activeCode, setActiveCode] = useState(locales[0]?.code ?? "en");
  const [query, setQuery] = useState("");
  const [onlyChanged, setOnlyChanged] = useState(false);
  // edits keyed by "code::path" so switching languages keeps each one's edits.
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<null | { title: string; text: string }>(null);
  const [copied, setCopied] = useState(false);

  const active = locales.find((l) => l.code === activeCode) ?? locales[0];

  // Flatten the active locale once per language change.
  const leaves = useMemo(() => {
    const out: Leaf[] = [];
    if (active) flatten(active.messages, "", [], out);
    return out;
  }, [active]);

  const editKey = (path: string) => `${activeCode}::${path}`;
  const currentValue = (leaf: Leaf) => edits[editKey(leaf.path)] ?? leaf.original;
  const isChanged = (leaf: Leaf) => {
    const k = editKey(leaf.path);
    return k in edits && edits[k] !== leaf.original;
  };

  const changedLeaves = leaves.filter(isChanged);

  // Visible rows: apply the text filter (path or value) and the changed filter.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leaves.filter((leaf) => {
      if (onlyChanged && !isChanged(leaf)) return false;
      if (!q) return true;
      return (
        leaf.path.toLowerCase().includes(q) ||
        currentValue(leaf).toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaves, query, onlyChanged, edits, activeCode]);

  const setValue = (path: string, value: string) =>
    setEdits((e) => ({ ...e, [editKey(path)]: value }));

  const resetOne = (path: string) =>
    setEdits((e) => {
      const next = { ...e };
      delete next[editKey(path)];
      return next;
    });

  const resetActive = () =>
    setEdits((e) => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(e)) {
        if (!k.startsWith(`${activeCode}::`)) next[k] = v;
      }
      return next;
    });

  // Build the export payloads for the active locale.
  const buildFull = (): string => {
    const localEdits: Record<string, string> = {};
    for (const leaf of leaves) {
      const k = editKey(leaf.path);
      if (k in edits) localEdits[leaf.path] = edits[k];
    }
    const rebuilt = unflatten(leaves, localEdits);
    return JSON.stringify(rebuilt, null, 2) + "\n";
  };
  const buildDiff = (): string => {
    const lines = changedLeaves.map((leaf) => ({
      path: leaf.path,
      from: leaf.original,
      to: currentValue(leaf),
    }));
    return JSON.stringify(lines, null, 2) + "\n";
  };

  const openFull = () => setModal({ title: `${labels.fullTitle} — ${active?.code}.json`, text: buildFull() });
  const openDiff = () => setModal({ title: labels.diffTitle, text: buildDiff() });

  const copyModal = async () => {
    if (!modal) return;
    try {
      await navigator.clipboard.writeText(modal.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked; the textarea is selectable as a fallback */
    }
  };

  const downloadModal = () => {
    if (!modal) return;
    const isFull = modal.title.startsWith(labels.fullTitle);
    const name = isFull ? `${active?.code}.json` : `${active?.code}.changes.json`;
    const blob = new Blob([modal.text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="copyedit">
      <div className="copyedit-toolbar">
        <label className="copyedit-field">
          <span className="copyedit-field-label">{labels.langLabel}</span>
          <select
            className="copyedit-select"
            value={activeCode}
            onChange={(e) => setActiveCode(e.target.value)}
          >
            {locales.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name} ({l.code})
              </option>
            ))}
          </select>
        </label>

        <label className="copyedit-field copyedit-field-search">
          <span className="copyedit-field-label">{labels.searchLabel}</span>
          <input
            type="text"
            className="copyedit-search"
            value={query}
            placeholder={labels.searchPlaceholder}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <label className="copyedit-check">
          <input
            type="checkbox"
            checked={onlyChanged}
            onChange={(e) => setOnlyChanged(e.target.checked)}
          />
          {labels.onlyChanged}
        </label>

        <span className="copyedit-count mono">
          {labels.changedCount.replace("{n}", String(changedLeaves.length))}
        </span>
      </div>

      <div className="copyedit-actions">
        <button type="button" className="btn btn-primary copyedit-btn" onClick={openFull}>
          {labels.exportFull}
        </button>
        <button
          type="button"
          className="btn btn-secondary copyedit-btn"
          onClick={openDiff}
          disabled={changedLeaves.length === 0}
        >
          {labels.exportDiff}
        </button>
        <button
          type="button"
          className="btn btn-secondary copyedit-btn"
          onClick={resetActive}
          disabled={changedLeaves.length === 0}
        >
          {labels.reset}
        </button>
      </div>

      <div className="copyedit-list">
        {visible.length === 0 ? (
          <p className="copyedit-empty">{labels.empty}</p>
        ) : (
          visible.map((leaf) => {
            const changed = isChanged(leaf);
            const val = currentValue(leaf);
            const multiline = val.length > 60 || val.includes("\n");
            return (
              <div key={leaf.path} className={`copyedit-row${changed ? " is-changed" : ""}`}>
                <div className="copyedit-row-head">
                  <code className="copyedit-path mono">{leaf.path}</code>
                  <span className="copyedit-ns mono">{namespaceOf(leaf.path)}</span>
                  {changed && (
                    <button
                      type="button"
                      className="copyedit-reset-one"
                      onClick={() => resetOne(leaf.path)}
                      title={labels.resetOne}
                    >
                      ↺
                    </button>
                  )}
                </div>
                {multiline ? (
                  <textarea
                    className="copyedit-input copyedit-textarea"
                    value={val}
                    rows={Math.min(val.split("\n").length + 1, 8)}
                    onChange={(e) => setValue(leaf.path, e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    className="copyedit-input"
                    value={val}
                    onChange={(e) => setValue(leaf.path, e.target.value)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {modal && (
        <div className="copyedit-modal" role="dialog" aria-modal="true" aria-label={modal.title} onClick={() => setModal(null)}>
          <div className="copyedit-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="copyedit-modal-head">
              <h2 className="copyedit-modal-title mono">{modal.title}</h2>
              <button type="button" className="copyedit-modal-close" onClick={() => setModal(null)} aria-label={labels.close}>
                ✕
              </button>
            </div>
            <textarea className="copyedit-modal-text mono" readOnly value={modal.text} />
            <div className="copyedit-modal-actions">
              <button type="button" className="btn btn-primary" onClick={copyModal}>
                {copied ? labels.copied : labels.copyClipboard}
              </button>
              <button type="button" className="btn btn-secondary" onClick={downloadModal}>
                {labels.download}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
