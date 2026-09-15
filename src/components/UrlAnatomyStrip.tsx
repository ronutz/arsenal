"use client";

// ============================================================================
// src/components/UrlAnatomyStrip.tsx
// ----------------------------------------------------------------------------
// A VISUAL anatomy of a URL: the string the reader typed, cut into its parts,
// each part coloured and named.
//
// WHY (PRIME, 2026-09-11): "in /url-anatomy we could very well have a more
// visual explainer of the URL and its components." His three decisions when
// asked: interactive, following the TOOLS schema with an example and the
// reader's own URL, and en + pt-BR only at this phase.
//
// Following the tools schema is why this lives inside the url-inspector tool
// rather than being bolted onto the Learn article. The engine, the golden
// vectors and the privacy posture already exist there; a second parser living
// in an article would drift from the first one within a month.
//
// ---------------------------------------------------------------------------
// WHY IT COMPUTES ITS OWN SPANS
//
// `UrlReport` gives the VALUES of each component but not their positions in the
// input, and the golden vectors that pin the parser are frozen - adding offsets
// to the report would mean regenerating them, which is a large change to a
// verified module for a presentational feature.
//
// So this walks the raw input left to right, consuming each component in the
// order a URL requires. The walk is deliberately CONSERVATIVE: every step
// checks that what it expects is actually there, and the moment anything fails
// to line up it returns null. A null renders the plain input with no
// highlighting at all.
//
// That is the important property. A strip that cannot segment something shows
// the reader an unsegmented string, which is merely unhelpful. A strip that
// GUESSES would label the wrong characters with confident colours, which is
// worse than showing nothing - and this site has spent a session learning that
// a confident wrong answer costs more than an absent one.
// ============================================================================

import { useTranslations } from "next-intl";
import type { UrlReport } from "@/lib/tools/url-inspector";

/** The component kinds a URL can be cut into, in the order they appear. */
export type UrlPartKind =
  | "scheme"
  | "punct"
  | "userinfo"
  | "host"
  | "port"
  | "path"
  | "query"
  | "fragment";

export interface UrlPart {
  kind: UrlPartKind;
  text: string;
}

/**
 * Cut `input` into labelled parts using the parsed report.
 *
 * Returns null when the input cannot be accounted for exactly - see the header.
 * The concatenation of every returned part always equals the input; that is
 * asserted before returning, so a silent mismatch cannot reach the screen.
 */
export function splitUrl(input: string, report: UrlReport): UrlPart[] | null {
  if (!input) return null;
  const parts: UrlPart[] = [];
  let i = 0;

  const take = (kind: UrlPartKind, len: number) => {
    if (len <= 0) return;
    parts.push({ kind, text: input.slice(i, i + len) });
    i += len;
  };
  /** Consume literal punctuation, failing if it is not what we expect. */
  const expect = (lit: string): boolean => {
    if (!input.startsWith(lit, i)) return false;
    take("punct", lit.length);
    return true;
  };

  if (report.scheme) {
    // The scheme is compared case-insensitively: the report lower-cases it,
    // the input may not.
    const raw = input.slice(i, i + report.scheme.length);
    if (raw.toLowerCase() !== report.scheme.toLowerCase()) return null;
    take("scheme", report.scheme.length);
    if (!expect(":")) return null;
  }

  if (report.hasAuthority) {
    if (!expect("//")) return null;

    if (report.userinfo) {
      const at = input.indexOf("@", i);
      if (at < 0) return null;
      take("userinfo", at - i);
      if (!expect("@")) return null;
    }

    if (report.host) {
      // The report may hold a decoded IDN host, so match on length in the
      // input rather than on the report's own string. IPv6 keeps its brackets.
      const rest = input.slice(i);
      const end = rest.search(/[:/?#]/);
      let hostLen = end < 0 ? rest.length : end;
      if (rest.startsWith("[")) {
        const close = rest.indexOf("]");
        if (close < 0) return null;
        hostLen = close + 1;
      }
      if (hostLen <= 0) return null;
      take("host", hostLen);
    }

    if (report.port !== null && input.startsWith(":", i)) {
      if (!expect(":")) return null;
      const rest = input.slice(i);
      const end = rest.search(/[/?#]/);
      take("port", end < 0 ? rest.length : end);
    }
  }

  // Path runs to the first "?" or "#".
  {
    const rest = input.slice(i);
    const end = rest.search(/[?#]/);
    const len = end < 0 ? rest.length : end;
    if (len > 0) take("path", len);
  }

  if (input.startsWith("?", i)) {
    if (!expect("?")) return null;
    const rest = input.slice(i);
    const end = rest.indexOf("#");
    take("query", end < 0 ? rest.length : end);
  }

  if (input.startsWith("#", i)) {
    if (!expect("#")) return null;
    take("fragment", input.length - i);
  }

  if (i !== input.length) return null; // unconsumed tail: refuse rather than guess
  const rebuilt = parts.map((p) => p.text).join("");
  if (rebuilt !== input) return null; // belt and braces
  return parts.filter((p) => p.text.length > 0);
}

export default function UrlAnatomyStrip({
  input,
  report,
}: {
  input: string;
  report: UrlReport;
}) {
  const t = useTranslations("urlAnatomy");
  const parts = splitUrl(input, report);

  if (!parts) {
    return (
      <div className="url-anatomy">
        <p className="url-anatomy-raw mono">{input}</p>
        <p className="url-anatomy-fallback">{t("cannotSegment")}</p>
      </div>
    );
  }

  // Which named kinds are present, for the key beneath the strip.
  const named = parts.filter((p) => p.kind !== "punct");
  const kinds = Array.from(new Set(named.map((p) => p.kind)));

  return (
    <div className="url-anatomy">
      <p className="url-anatomy-strip mono">
        {parts.map((p, n) =>
          p.kind === "punct" ? (
            <span key={n} className="url-anatomy-punct">
              {p.text}
            </span>
          ) : (
            // The part is named in its own title and aria-label, so the meaning
            // never depends on colour alone.
            <span
              key={n}
              className={`url-anatomy-part url-anatomy-${p.kind}`}
              title={t(p.kind)}
              aria-label={`${t(p.kind)}: ${p.text}`}
            >
              {p.text}
            </span>
          )
        )}
      </p>
      <ul className="url-anatomy-key">
        {kinds.map((k) => (
          <li key={k} className="url-anatomy-key-item">
            <span className={`url-anatomy-swatch url-anatomy-${k}`} aria-hidden />
            <span className="url-anatomy-key-label">{t(k)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
