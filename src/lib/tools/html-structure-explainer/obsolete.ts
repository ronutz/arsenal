// ============================================================================
// src/lib/tools/html-structure-explainer/obsolete.ts
// ----------------------------------------------------------------------------
// THE NON-CONFORMING FEATURES of HTML Standard section 16.2, as data.
//
// Generated 2026-10-05 from the standard's source (github.com/whatwg/html, main):
// "Elements in the following list are entirely obsolete, and must not be used by
// authors" (29 elements) and "The following attributes are obsolete (though the
// elements are still part of the language), and must not be used by authors"
// (33 groups). The advice the standard gives for each is a message key on the
// page (obsoleteElement.<name>, obsoleteAttribute.<group>), so it reads in the
// reader's language; the English messages quote the standard verbatim.
// ============================================================================

/** The 29 obsolete elements, each with the key of the standard's advice. */
export const OBSOLETE_ELEMENTS: Readonly<Record<string, string>> = Object.freeze({
  // Use embed or object instead.
  applet: "applet",
  // Use abbr instead.
  acronym: "acronym",
  // Use audio instead.
  bgsound: "bgsound",
  // Use ul instead.
  dir: "dir",
  // Either use iframe and CSS instead, or use server-side includes to generate complete pages with the various inv
  frame: "frames",
  // Either use iframe and CSS instead, or use server-side includes to generate complete pages with the various inv
  frameset: "frames",
  // Either use iframe and CSS instead, or use server-side includes to generate complete pages with the various inv
  noframes: "frames",
  // Use an explicit form and text control combination instead.
  isindex: "isindex",
  // For enterprise device management use cases, use native on-device management capabilities. For certificate enro
  keygen: "keygen",
  // Use pre and code instead.
  listing: "listing",
  // To implement a custom context menu, use script to handle the contextmenu event.
  menuitem: "menuitem",
  // Use GUIDs instead.
  nextid: "nextid",
  // Use object instead of embed when fallback is necessary.
  noembed: "noembed",
  // Use the data attribute of the object element to set the URL of the external resource.
  param: "param",
  // Use the "text/plain" MIME type instead.
  plaintext: "plaintext",
  // Providing the ruby base directly inside the ruby element or using nested ruby elements is sufficient.
  rb: "ruby",
  // Providing the ruby base directly inside the ruby element or using nested ruby elements is sufficient.
  rtc: "ruby",
  // Use del instead if the element is marking an edit, otherwise use s instead.
  strike: "strike",
  // Use pre and code instead, and escape "<" and "&" characters as "&lt;" and "&amp;" respectively.
  xmp: "xmp",
  // Use appropriate elements or CSS instead. Where the tt element would have been used for marking up keyboard inp
  basefont: "presentational",
  // Use appropriate elements or CSS instead. Where the tt element would have been used for marking up keyboard inp
  big: "presentational",
  // Use appropriate elements or CSS instead. Where the tt element would have been used for marking up keyboard inp
  blink: "presentational",
  // Use appropriate elements or CSS instead. Where the tt element would have been used for marking up keyboard inp
  center: "presentational",
  // Use appropriate elements or CSS instead. Where the tt element would have been used for marking up keyboard inp
  font: "presentational",
  // Use appropriate elements or CSS instead. Where the tt element would have been used for marking up keyboard inp
  marquee: "presentational",
  // Use appropriate elements or CSS instead. Where the tt element would have been used for marking up keyboard inp
  multicol: "presentational",
  // Use appropriate elements or CSS instead. Where the tt element would have been used for marking up keyboard inp
  nobr: "presentational",
  // Use appropriate elements or CSS instead. Where the tt element would have been used for marking up keyboard inp
  spacer: "presentational",
  // Use appropriate elements or CSS instead. Where the tt element would have been used for marking up keyboard inp
  tt: "presentational",
});

/** One obsolete attribute: its name, the element it is obsolete on ("*" = all elements), the advice group, a note. */
export interface ObsoleteAttribute { attr: string; on: string; group: string; note: string }

/** The obsolete attributes, by group of the standard's list. */
export const OBSOLETE_ATTRIBUTES: readonly ObsoleteAttribute[] = Object.freeze([
  { attr: "charset", on: "a", group: "charset-link", note: "" },
  { attr: "charset", on: "link", group: "charset-link", note: "" },
  { attr: "charset", on: "script", group: "charset-script", note: "(except as noted in the previous section)" },
  { attr: "coords", on: "a", group: "image-map-a", note: "" },
  { attr: "shape", on: "a", group: "image-map-a", note: "" },
  { attr: "methods", on: "a", group: "methods", note: "" },
  { attr: "methods", on: "link", group: "methods", note: "" },
  { attr: "name", on: "a", group: "name-id", note: "(except as noted in the previous section)" },
  { attr: "name", on: "embed", group: "name-id", note: "" },
  { attr: "name", on: "img", group: "name-id", note: "" },
  { attr: "name", on: "option", group: "name-id", note: "" },
  { attr: "rev", on: "a", group: "rev", note: "" },
  { attr: "rev", on: "link", group: "rev", note: "" },
  { attr: "urn", on: "a", group: "urn", note: "" },
  { attr: "urn", on: "link", group: "urn", note: "" },
  { attr: "accept", on: "form", group: "form-accept", note: "" },
  { attr: "hreflang", on: "area", group: "area-useless", note: "" },
  { attr: "type", on: "area", group: "area-useless", note: "" },
  { attr: "nohref", on: "area", group: "nohref", note: "" },
  { attr: "profile", on: "head", group: "profile", note: "" },
  { attr: "manifest", on: "html", group: "manifest", note: "" },
  { attr: "version", on: "html", group: "version", note: "" },
  { attr: "ismap", on: "input", group: "ismap", note: "" },
  { attr: "usemap", on: "input", group: "usemap", note: "" },
  { attr: "usemap", on: "object", group: "usemap", note: "" },
  { attr: "longdesc", on: "iframe", group: "longdesc", note: "" },
  { attr: "longdesc", on: "img", group: "longdesc", note: "" },
  { attr: "lowsrc", on: "img", group: "lowsrc", note: "" },
  { attr: "target", on: "link", group: "link-target", note: "" },
  { attr: "type", on: "menu", group: "menu-type", note: "" },
  { attr: "label", on: "menu", group: "contextmenu", note: "" },
  { attr: "contextmenu", on: "*", group: "contextmenu", note: "" },
  { attr: "onshow", on: "*", group: "contextmenu", note: "" },
  { attr: "scheme", on: "meta", group: "scheme", note: "" },
  { attr: "archive", on: "object", group: "object-plugin", note: "" },
  { attr: "classid", on: "object", group: "object-plugin", note: "" },
  { attr: "code", on: "object", group: "object-plugin", note: "" },
  { attr: "codebase", on: "object", group: "object-plugin", note: "" },
  { attr: "codetype", on: "object", group: "object-plugin", note: "" },
  { attr: "declare", on: "object", group: "declare", note: "" },
  { attr: "standby", on: "object", group: "standby", note: "" },
  { attr: "typemustmatch", on: "object", group: "typemustmatch", note: "" },
  { attr: "language", on: "script", group: "language", note: "(except as noted in the previous section)" },
  { attr: "event", on: "script", group: "script-event", note: "" },
  { attr: "for", on: "script", group: "script-event", note: "" },
  { attr: "type", on: "style", group: "style-type", note: "(except as noted in the previous section)" },
  { attr: "datapagesize", on: "table", group: "datapagesize", note: "" },
  { attr: "summary", on: "table", group: "summary", note: "" },
  { attr: "abbr", on: "td", group: "abbr", note: "" },
  { attr: "dropzone", on: "*", group: "dropzone", note: "" },
  { attr: "alink", on: "body", group: "css", note: "" },
  { attr: "bgcolor", on: "body", group: "css", note: "" },
  { attr: "bottommargin", on: "body", group: "css", note: "" },
  { attr: "leftmargin", on: "body", group: "css", note: "" },
  { attr: "link", on: "body", group: "css", note: "" },
  { attr: "marginheight", on: "body", group: "css", note: "" },
  { attr: "marginwidth", on: "body", group: "css", note: "" },
  { attr: "rightmargin", on: "body", group: "css", note: "" },
  { attr: "text", on: "body", group: "css", note: "" },
  { attr: "topmargin", on: "body", group: "css", note: "" },
  { attr: "vlink", on: "body", group: "css", note: "" },
  { attr: "clear", on: "br", group: "css", note: "" },
  { attr: "align", on: "caption", group: "css", note: "" },
  { attr: "align", on: "col", group: "css", note: "" },
  { attr: "char", on: "col", group: "css", note: "" },
  { attr: "charoff", on: "col", group: "css", note: "" },
  { attr: "valign", on: "col", group: "css", note: "" },
  { attr: "width", on: "col", group: "css", note: "" },
  { attr: "align", on: "div", group: "css", note: "" },
  { attr: "compact", on: "dl", group: "css", note: "" },
  { attr: "align", on: "embed", group: "css", note: "" },
  { attr: "hspace", on: "embed", group: "css", note: "" },
  { attr: "vspace", on: "embed", group: "css", note: "" },
  { attr: "align", on: "hr", group: "css", note: "" },
  { attr: "color", on: "hr", group: "css", note: "" },
  { attr: "noshade", on: "hr", group: "css", note: "" },
  { attr: "size", on: "hr", group: "css", note: "" },
  { attr: "width", on: "hr", group: "css", note: "" },
  { attr: "align", on: "h1", group: "css", note: "" },
  { attr: "align", on: "h2", group: "css", note: "" },
  { attr: "align", on: "h3", group: "css", note: "" },
  { attr: "align", on: "h4", group: "css", note: "" },
  { attr: "align", on: "h5", group: "css", note: "" },
  { attr: "align", on: "h6", group: "css", note: "" },
  { attr: "align", on: "iframe", group: "css", note: "" },
  { attr: "allowtransparency", on: "iframe", group: "css", note: "" },
  { attr: "frameborder", on: "iframe", group: "css", note: "" },
  { attr: "framespacing", on: "iframe", group: "css", note: "" },
  { attr: "hspace", on: "iframe", group: "css", note: "" },
  { attr: "marginheight", on: "iframe", group: "css", note: "" },
  { attr: "marginwidth", on: "iframe", group: "css", note: "" },
  { attr: "scrolling", on: "iframe", group: "css", note: "" },
  { attr: "vspace", on: "iframe", group: "css", note: "" },
  { attr: "align", on: "input", group: "css", note: "" },
  { attr: "border", on: "input", group: "css", note: "" },
  { attr: "hspace", on: "input", group: "css", note: "" },
  { attr: "vspace", on: "input", group: "css", note: "" },
  { attr: "align", on: "img", group: "css", note: "" },
  { attr: "border", on: "img", group: "css", note: "(except as noted in the previous section)" },
  { attr: "hspace", on: "img", group: "css", note: "" },
  { attr: "vspace", on: "img", group: "css", note: "" },
  { attr: "align", on: "legend", group: "css", note: "" },
  { attr: "type", on: "li", group: "css", note: "" },
  { attr: "compact", on: "menu", group: "css", note: "" },
  { attr: "align", on: "object", group: "css", note: "" },
  { attr: "border", on: "object", group: "css", note: "" },
  { attr: "hspace", on: "object", group: "css", note: "" },
  { attr: "vspace", on: "object", group: "css", note: "" },
  { attr: "compact", on: "ol", group: "css", note: "" },
  { attr: "align", on: "p", group: "css", note: "" },
  { attr: "width", on: "pre", group: "css", note: "" },
  { attr: "align", on: "table", group: "css", note: "" },
  { attr: "bgcolor", on: "table", group: "css", note: "" },
  { attr: "border", on: "table", group: "css", note: "" },
  { attr: "bordercolor", on: "table", group: "css", note: "" },
  { attr: "cellpadding", on: "table", group: "css", note: "" },
  { attr: "cellspacing", on: "table", group: "css", note: "" },
  { attr: "frame", on: "table", group: "css", note: "" },
  { attr: "height", on: "table", group: "css", note: "" },
  { attr: "rules", on: "table", group: "css", note: "" },
  { attr: "width", on: "table", group: "css", note: "" },
  { attr: "align", on: "tbody", group: "css", note: "" },
  { attr: "align", on: "thead", group: "css", note: "" },
  { attr: "align", on: "and tfoot", group: "css", note: "" },
  { attr: "char", on: "tbody", group: "css", note: "" },
  { attr: "char", on: "thead", group: "css", note: "" },
  { attr: "char", on: "and tfoot", group: "css", note: "" },
  { attr: "charoff", on: "tbody", group: "css", note: "" },
  { attr: "charoff", on: "thead", group: "css", note: "" },
  { attr: "charoff", on: "and tfoot", group: "css", note: "" },
  { attr: "height", on: "thead", group: "css", note: "" },
  { attr: "height", on: "tbody", group: "css", note: "" },
  { attr: "height", on: "and tfoot", group: "css", note: "" },
  { attr: "valign", on: "tbody", group: "css", note: "" },
  { attr: "valign", on: "thead", group: "css", note: "" },
  { attr: "valign", on: "and tfoot", group: "css", note: "" },
  { attr: "align", on: "td", group: "css", note: "" },
  { attr: "align", on: "th", group: "css", note: "" },
  { attr: "bgcolor", on: "td", group: "css", note: "" },
  { attr: "bgcolor", on: "th", group: "css", note: "" },
  { attr: "char", on: "td", group: "css", note: "" },
  { attr: "char", on: "th", group: "css", note: "" },
  { attr: "charoff", on: "td", group: "css", note: "" },
  { attr: "charoff", on: "th", group: "css", note: "" },
  { attr: "height", on: "td", group: "css", note: "" },
  { attr: "height", on: "th", group: "css", note: "" },
  { attr: "nowrap", on: "td", group: "css", note: "" },
  { attr: "nowrap", on: "th", group: "css", note: "" },
  { attr: "valign", on: "td", group: "css", note: "" },
  { attr: "valign", on: "th", group: "css", note: "" },
  { attr: "width", on: "td", group: "css", note: "" },
  { attr: "width", on: "th", group: "css", note: "" },
  { attr: "align", on: "tr", group: "css", note: "" },
  { attr: "bgcolor", on: "tr", group: "css", note: "" },
  { attr: "char", on: "tr", group: "css", note: "" },
  { attr: "charoff", on: "tr", group: "css", note: "" },
  { attr: "height", on: "tr", group: "css", note: "" },
  { attr: "valign", on: "tr", group: "css", note: "" },
  { attr: "compact", on: "ul", group: "css", note: "" },
  { attr: "type", on: "ul", group: "css", note: "" },
  { attr: "background", on: "body", group: "css", note: "" },
  { attr: "background", on: "table", group: "css", note: "" },
  { attr: "background", on: "thead", group: "css", note: "" },
  { attr: "background", on: "tbody", group: "css", note: "" },
  { attr: "background", on: "tfoot", group: "css", note: "" },
  { attr: "background", on: "tr", group: "css", note: "" },
  { attr: "background", on: "td", group: "css", note: "" },
  { attr: "background", on: "and th", group: "css", note: "" },
]);

/** Look an attribute up: the group when the standard calls it obsolete on this element, else null. */
export function obsoleteAttribute(element: string, attr: string): ObsoleteAttribute | null {
  // Lower-case names (the parser already lower-cases HTML attribute names).
  const a = attr.toLowerCase();
  // The element-specific entry first, then the all-elements entry.
  return OBSOLETE_ATTRIBUTES.find((r) => r.attr === a && (r.on === element || r.on === "*")) ?? null;
}
