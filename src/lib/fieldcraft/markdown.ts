// ============================================================================
// src/lib/fieldcraft/markdown.ts
// ----------------------------------------------------------------------------
// OPERATIONS & FIELDCRAFT - shared Markdown renderer for ExportArtifact.
// One deliberately boring function: the artifact must paste cleanly into a
// ticket, a bridge chat, or a TAC case (D-86 §2: usable, not decorative).
// Pure and deterministic: same artifact in, same Markdown out.
//
// PAGE LANGUAGE (02/11/2026): the artifact the page renders is already in the
// page's language (the forms build it from sentences with ids, see text.ts);
// the one line this file writes itself, the "Generated" line, is a sentence
// with an id too, and the page passes its lookups so that line follows the
// page's language as well. Without them it is the English, as before.
// ============================================================================

import type { ExportArtifact } from "./schema"; // the artifact
import { say, type EngineText } from "../tools/engine-text"; // the Generated line as a sentence with an id

/**
 * The line under the title that dates the export.
 * @param date the ISO date the page supplies at export time
 * @returns the sentence (pack key engine.md.generated)
 */
export function generatedLine(date: string): EngineText {
  return say("md.generated", `_Generated ${date} - ronutz.com, local-compute; advisory structure, not a diagnosis._`, { date }); // the English, as before
} // generatedLine

/** What the renderer reads: an ExportArtifact, or the page's copy of one (inPageLanguage() types its sections as arrays). */
export type MarkdownArtifact = Pick<ExportArtifact, "title" | "generated"> & { sections: readonly (readonly string[])[] };

/**
 * Render an ExportArtifact to plain Markdown.
 * @param artifact the artifact (its texts in the page's language)
 * @param tx the page's sentence lookup, for the Generated line; without it the line is the English
 * @returns the Markdown
 */
export function artifactToMarkdown(artifact: MarkdownArtifact, tx?: { say(m: EngineText): string }): string {
  const lines: string[] = [`# ${artifact.title}`]; // the title
  if (artifact.generated) { // dated at export time
    const g = generatedLine(artifact.generated); // the sentence
    lines.push("", tx ? tx.say(g) : g.text); // in the page's language, or the English
  } // generated
  for (const [heading, body] of artifact.sections) { // each section
    lines.push("", `## ${heading}`, "", body); // heading and body
  } // sections
  return lines.join("\n") + "\n"; // one trailing newline
} // artifactToMarkdown
