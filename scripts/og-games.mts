// ============================================================================
// scripts/og-games.mts
// ----------------------------------------------------------------------------
// THE /dev/fun SHARE CARDS (PRIME 05/11/2026: "The attached image shows the
// sharing preview for a game. Please make the graphics meaningful, related to
// each game. As it is, it's not good looking."). Every game page shared in a
// chat unfurled the site's default card, cropped. Each game now has its own
// 1200 x 630 card, drawn from what the game actually shows: Prefix of the
// Day's tries with their arrows, Five Clues' DNS round, an Access Points floor,
// a Bit Balance grid, a Patch Path cable, a spanning tree with its blocked
// link, the day's log with the attacker's line, a homoglyph link with the two
// buttons, the Whack-a-Bug holes, Aggregate's prefix tiles, an ACL with the
// first match, vim's empty buffer with ":q!", the incident dashboard, and a
// mosaic of all of them for the shelf.
//
// COMPOSITION. Chat apps show a 1.91:1 card whole in a large preview but crop
// it in a small one (a square, or about 1.4:1, taken from the middle), and the
// old card lost its left edge that way. So everything that matters sits on
// the centre line: "/dev/fun" above, the game's name, the art below it, the
// address at the foot. A centre crop keeps the name and the art.
//
// DRAWING. satori lays out plain element objects (every multi-child div is a
// flex box). Lines, arcs and shapes are small SVG images (data URIs, no text
// inside them, since a nested SVG's text would need system fonts); every
// character on a card is a satori text node in Inter or JetBrains Mono, the
// two fonts gen-og.mts loads. Glyphs are kept to the fonts' Latin subset
// (arrows up and down, the bullet and the multiplication sign are in it; the
// tick and the right arrow are not, so those are drawn).
//
// The palette is gen-og.mts's Obsidian: OG images are theme-locked, because a
// shared link has no theme. ART_VERSION goes into each card's content hash, so
// a change to a drawing regenerates its cards in CI.
// ============================================================================

/** Bumped when any drawing changes, so the content-hash manifest rewrites the game cards. */
export const ART_VERSION = "1";

/** The Obsidian colours the cards use (mirrors gen-og.mts and globals.css). */
const K = {
  // The page.
  canvas: "#020617",
  // A panel on the page.
  panel: "#0B1220",
  // A raised cell inside a panel.
  cell: "#111A2E",
  // Primary text.
  text: "#F8FAFC",
  // Secondary text.
  sub: "#94A3B8",
  // Faint text and rules.
  faint: "#64748B",
  // Hairlines.
  line: "rgba(148, 163, 184, 0.28)",
  // The accents.
  cyan: "#22D3EE",
  amber: "#F59E0B",
  green: "#22C55E",
  red: "#F87171",
  violet: "#A78BFA",
  sky: "#38BDF8",
  orange: "#FB923C",
  yellow: "#FACC15",
  blue: "#60A5FA",
};

/** A satori element: a plain object with a type and props. */
type El = { type: string; props: Record<string, unknown> };

/**
 * A div (flex by default, so satori accepts several children).
 *
 * @param style its style
 * @param children its children (elements, text, or a list)
 * @returns the element
 */
const div = (style: Record<string, unknown>, children: unknown = []): El => ({ type: "div", props: { style: { display: "flex", ...style }, children } });

/**
 * A line of text.
 *
 * @param s the text
 * @param style its style (font, size, colour)
 * @returns the element
 */
const text = (s: string, style: Record<string, unknown>): El => div(style, s);

/**
 * An SVG drawing as an image (shapes only, no text).
 *
 * @param w its width
 * @param h its height
 * @param body the SVG's inner markup
 * @param style extra style (position, for a layer)
 * @returns the image element
 */
const svg = (w: number, h: number, body: string, style: Record<string, unknown> = {}): El => ({
  type: "img",
  props: { width: w, height: h, style, src: "data:image/svg+xml;base64," + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`).toString("base64") },
});

/**
 * A layer placed at an exact spot inside a relative box.
 *
 * @param x left
 * @param y top
 * @param child what to place
 * @returns the positioned element
 */
const at = (x: number, y: number, child: El): El => div({ position: "absolute", left: x, top: y }, [child]);

/** The mono face. */
const MONO = "JetBrains Mono";
/** The sans face. */
const SANS = "Inter";

/** A tick drawn as a path (the fonts' Latin subset has no check mark). */
const tickPath = (x: number, y: number, s: number, c: string, w = 4) => `<path d="M${x} ${y + s * 0.55} L${x + s * 0.38} ${y + s * 0.9} L${x + s} ${y + s * 0.1}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
/** A cross drawn as two lines. */
const crossPath = (cx: number, cy: number, r: number, c: string, w = 3) => `<path d="M${cx - r} ${cy - r} L${cx + r} ${cy + r} M${cx + r} ${cy - r} L${cx - r} ${cy + r}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
/** A right arrow drawn as a line and a head. */
const arrowPath = (x1: number, y: number, x2: number, c: string, w = 4) => `<path d="M${x1} ${y} L${x2} ${y} M${x2 - 12} ${y - 10} L${x2} ${y} L${x2 - 12} ${y + 10}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

/** What every drawing receives: the card's locale and the strings it may show. */
export interface ArtContext {
  /** The card's locale, "en" or "pt-BR". */
  locale: string;
  /** devFun.games from the locale's pack (names and the few labels a drawing shows). */
  games: Record<string, Record<string, unknown>>;
}

/** The art box: every drawing is this size, centred under the name. */
const AW = 600;
/** Its height. */
const AH = 360;

// ---- The drawings -------------------------------------------------------------------------------------------------

/** Prefix of the Day: three tries at 172.16.40.0/22 (network, broadcast, mask, hosts), arrows where the answer lies. */
function prefixArt(): El {
  // The tries, each field with its mark: the answer is higher (up), lower (down), or this (ok).
  const rows: [string, "up" | "down" | "ok"][][] = [
    [["172.16.0.0", "up"], ["172.16.255.255", "down"], ["255.255.0.0", "up"], ["65534", "down"]],
    [["172.16.32.0", "up"], ["172.16.47.255", "down"], ["255.255.240.0", "up"], ["4094", "down"]],
    [["172.16.40.0", "ok"], ["172.16.43.255", "ok"], ["255.255.252.0", "ok"], ["1022", "ok"]],
  ];
  // One tile.
  const tile = ([v, m]: [string, "up" | "down" | "ok"]) =>
    div({ width: 138, height: 70, borderRadius: 10, alignItems: "center", justifyContent: "center", flexDirection: "column", backgroundColor: m === "ok" ? K.green : K.cell, border: `2px solid ${m === "ok" ? K.green : K.amber}` }, [
      // The value typed.
      text(v, { fontFamily: MONO, fontSize: 15, fontWeight: 700, color: m === "ok" ? K.canvas : K.text }),
      // Where the answer is, under it.
      text(m === "up" ? "↑" : m === "down" ? "↓" : "", { fontFamily: MONO, fontSize: 18, fontWeight: 700, color: K.amber, height: m === "ok" ? 0 : 22 }),
    ]);
  // Three rows of four, then three empty slots of the six.
  return div({ width: AW, height: AH, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }, [
    ...rows.map((r) => div({ gap: 10 }, r.map(tile))),
    div({ gap: 10 }, [0, 1, 2, 3].map(() => div({ width: 138, height: 22, borderRadius: 8, border: `2px dashed ${K.line}` }))),
  ]);
}

/** Five Clues: the DNS round (NAPTR, SSHFP, SRV shown, two still hidden) and the guess, right. */
function fiveCluesArt(c: ArtContext): El {
  // The category, in the card's language (the puzzle's own text).
  const cat = c.locale === "pt-BR" ? "Tipos de registro DNS" : "DNS record types";
  // The clues, hardest first, as the puzzle lists them; the last two not yet revealed.
  const clues = ["NAPTR", "SSHFP", "SRV", null, null];
  // One clue row.
  const row = (cl: string | null, i: number) =>
    div({ width: 420, height: 44, alignItems: "center", gap: 14, borderRadius: 10, backgroundColor: cl ? K.cell : "transparent", border: `2px ${cl ? "solid" : "dashed"} ${cl ? K.violet : K.line}`, paddingLeft: 12 }, [
      // Its number.
      div({ width: 28, height: 28, borderRadius: 14, backgroundColor: cl ? K.violet : "transparent", border: cl ? "none" : `2px solid ${K.faint}`, alignItems: "center", justifyContent: "center" }, [text(String(i + 1), { fontFamily: MONO, fontSize: 15, fontWeight: 700, color: cl ? K.canvas : K.faint })]),
      // The clue, or the dots of one not yet shown.
      text(cl ?? "• • •", { fontFamily: MONO, fontSize: 22, fontWeight: 700, color: cl ? K.text : K.faint }),
    ]);
  // The rows, then the guess with its tick.
  return div({ width: AW, height: AH, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }, [
    ...clues.map(row),
    div({ marginTop: 8, height: 48, alignItems: "center", gap: 12, paddingLeft: 20, paddingRight: 16, borderRadius: 24, backgroundColor: K.green }, [
      // The guess.
      text(cat, { fontFamily: SANS, fontSize: 22, fontWeight: 800, color: K.canvas }),
      // Right.
      svg(26, 26, tickPath(2, 2, 22, K.canvas, 4)),
    ]),
  ]);
}

/** A 6 x 6 board's geometry, shared by the three grid puzzles. */
const G = { n: 6, s: 54, x: (AW - 6 * 54) / 2, y: (AH - 6 * 54) / 2 };

/** Access Points: a floor in six zones, three access points none touching, the cells beside them ruled out. */
function accessPointsArt(): El {
  // The zones, row by row.
  const zones = ["AABBBC", "AABCCC", "DAEECC", "DDEEFC", "DDDEFF", "DFFFFF"];
  // A tint per zone.
  const tint: Record<string, string> = { A: "#14233A", B: "#1A2338", C: "#122A33", D: "#22203A", E: "#1B2A28", F: "#26222E" };
  // The access points placed, and the cells ruled out around the first.
  const aps = [[0, 4], [2, 0], [4, 5]];
  // The marks: the neighbours of the first, and one more.
  const xs = [[0, 3], [0, 5], [1, 3], [1, 4], [1, 5], [3, 1]];
  // The cells.
  let body = "";
  // Each cell, filled with its zone's tint.
  for (let r = 0; r < 6; r++) for (let q = 0; q < 6; q++) body += `<rect x="${G.x + q * G.s}" y="${G.y + r * G.s}" width="${G.s}" height="${G.s}" fill="${tint[zones[r][q]]}" stroke="${K.line}" stroke-width="1"/>`;
  // The zone borders: a thick line wherever two neighbours are in different zones.
  for (let r = 0; r < 6; r++) for (let q = 0; q < 6; q++) {
    // Right neighbour.
    if (q < 5 && zones[r][q] !== zones[r][q + 1]) body += `<path d="M${G.x + (q + 1) * G.s} ${G.y + r * G.s} V${G.y + (r + 1) * G.s}" stroke="${K.sub}" stroke-width="4"/>`;
    // Lower neighbour.
    if (r < 5 && zones[r][q] !== zones[r + 1][q]) body += `<path d="M${G.x + q * G.s} ${G.y + (r + 1) * G.s} H${G.x + (q + 1) * G.s}" stroke="${K.sub}" stroke-width="4"/>`;
  }
  // The outer frame.
  body += `<rect x="${G.x}" y="${G.y}" width="${6 * G.s}" height="${6 * G.s}" fill="none" stroke="${K.sub}" stroke-width="4" rx="4"/>`;
  // The ruled-out cells.
  for (const [r, q] of xs) body += crossPath(G.x + q * G.s + G.s / 2, G.y + r * G.s + G.s / 2, 9, K.faint, 3);
  // The access points: a disc and the three arcs of a signal.
  for (const [r, q] of aps) {
    // The cell's centre.
    const cx = G.x + q * G.s + G.s / 2, cy = G.y + r * G.s + G.s / 2;
    // The disc.
    body += `<circle cx="${cx}" cy="${cy}" r="21" fill="${K.sky}"/>`;
    // The signal: a dot and two arcs.
    body += `<circle cx="${cx}" cy="${cy + 8}" r="3.5" fill="${K.canvas}"/><path d="M${cx - 8} ${cy + 1} A11 11 0 0 1 ${cx + 8} ${cy + 1} M${cx - 14} ${cy - 5} A19 19 0 0 1 ${cx + 14} ${cy - 5}" fill="none" stroke="${K.canvas}" stroke-width="3.2" stroke-linecap="round"/>`;
  }
  // The drawing.
  return svg(AW, AH, body);
}

/** Bit Balance: a 6 x 6 grid of bits in progress, givens bold, the player's in cyan, with = and x signs. */
function bitBalanceArt(): El {
  // A valid solution (three of each per line, no run of three), row by row.
  const sol = ["011010", "100101", "010110", "101001", "101100", "010011"];
  // Which cells show: g = given, p = placed by the player, . = still empty.
  const shown = ["g.p.g.", "pg..gp", ".gp.g.", "g..p.g", "pg.g..", ".g.pg."];
  // The signs between cells: [row, col, "right" or "down", "=" or "x"].
  const signs: [number, number, "r" | "d", string][] = [[0, 1, "r", "="], [2, 3, "d", "×"], [3, 0, "d", "="], [4, 4, "d", "×"], [1, 1, "r", "="]];
  // The grid lines.
  let body = `<rect x="${G.x}" y="${G.y}" width="${6 * G.s}" height="${6 * G.s}" rx="6" fill="${K.cell}" stroke="${K.sub}" stroke-width="3"/>`;
  // The inner lines.
  for (let i = 1; i < 6; i++) body += `<path d="M${G.x + i * G.s} ${G.y} V${G.y + 6 * G.s} M${G.x} ${G.y + i * G.s} H${G.x + 6 * G.s}" stroke="${K.line}" stroke-width="1.5"/>`;
  // The layers: the grid, then the bits and the signs on top.
  const layers: El[] = [svg(AW, AH, body, { position: "absolute", left: 0, top: 0 })];
  // Each shown bit.
  for (let r = 0; r < 6; r++) for (let q = 0; q < 6; q++) {
    // Empty.
    if (shown[r][q] === ".") continue;
    // A given or a placed bit, centred in its cell.
    layers.push(at(G.x + q * G.s, G.y + r * G.s, div({ width: G.s, height: G.s, alignItems: "center", justifyContent: "center" }, [text(sol[r][q], { fontFamily: MONO, fontSize: 28, fontWeight: 700, color: shown[r][q] === "g" ? K.text : K.cyan })])));
  }
  // Each sign, a small disc on the line between its two cells.
  for (const [r, q, dir, s] of signs) {
    // The point on the shared edge.
    const cx = G.x + (dir === "r" ? (q + 1) * G.s : q * G.s + G.s / 2), cy = G.y + (dir === "d" ? (r + 1) * G.s : r * G.s + G.s / 2);
    // The disc and its sign.
    layers.push(at(cx - 12, cy - 12, div({ width: 24, height: 24, borderRadius: 12, backgroundColor: K.amber, alignItems: "center", justifyContent: "center" }, [text(s, { fontFamily: MONO, fontSize: 16, fontWeight: 700, color: K.canvas })])));
  }
  // The drawing.
  return div({ position: "relative", width: AW, height: AH }, layers);
}

/** Patch Path: one cable through the panel, ports numbered in order, a duct to go around. */
function patchPathArt(): El {
  // The cable so far, cell by cell [row, col].
  const path: [number, number][] = [[0, 0], [0, 1], [0, 2], [1, 2], [1, 1], [1, 0], [2, 0], [3, 0], [3, 1], [2, 1], [2, 2], [2, 3], [1, 3], [0, 3], [0, 4], [0, 5], [1, 5], [1, 4], [2, 4], [3, 4], [3, 3]];
  // The ports: number, row, col.
  const ports: [number, number, number][] = [[1, 0, 0], [2, 3, 1], [3, 0, 4], [4, 4, 5], [5, 5, 0]];
  // The duct cell, which the cable must go around.
  const duct = [5, 3];
  // A cell's centre.
  const c = (r: number, q: number) => [G.x + q * G.s + G.s / 2, G.y + r * G.s + G.s / 2];
  // The panel and its holes.
  let body = `<rect x="${G.x}" y="${G.y}" width="${6 * G.s}" height="${6 * G.s}" rx="6" fill="${K.cell}" stroke="${K.sub}" stroke-width="3"/>`;
  // A faint hole in every cell.
  for (let r = 0; r < 6; r++) for (let q = 0; q < 6; q++) { const [x, y] = c(r, q); body += `<circle cx="${x}" cy="${y}" r="4" fill="${K.line}"/>`; }
  // The duct, hatched.
  const [dx, dy] = [G.x + duct[1] * G.s, G.y + duct[0] * G.s];
  // Its fill and its hatching.
  body += `<rect x="${dx + 3}" y="${dy + 3}" width="${G.s - 6}" height="${G.s - 6}" rx="4" fill="#1E293B"/><path d="M${dx + 6} ${dy + 26} L${dx + 26} ${dy + 6} M${dx + 6} ${dy + 46} L${dx + 46} ${dy + 6} M${dx + 26} ${dy + 46} L${dx + 46} ${dy + 26}" stroke="${K.faint}" stroke-width="3"/>`;
  // The cable.
  body += `<polyline points="${path.map(([r, q]) => c(r, q).join(",")).join(" ")}" fill="none" stroke="${K.amber}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`;
  // Its plug at the end.
  const [ex, ey] = c(...path[path.length - 1]);
  // A white ring round the cable end.
  body += `<circle cx="${ex}" cy="${ey}" r="11" fill="${K.amber}" stroke="${K.text}" stroke-width="3"/>`;
  // The layers: the drawing, then the port numbers.
  const layers: El[] = [svg(AW, AH, body, { position: "absolute", left: 0, top: 0 })];
  // Each port: a disc with its number (reached ones on the cable, the rest waiting).
  for (const [n, r, q] of ports) {
    // Reached when the cable passes it.
    const reached = path.some(([pr, pq]) => pr === r && pq === q);
    // The disc.
    layers.push(at(G.x + q * G.s + G.s / 2 - 16, G.y + r * G.s + G.s / 2 - 16, div({ width: 32, height: 32, borderRadius: 16, backgroundColor: reached ? K.text : K.canvas, border: `3px solid ${reached ? K.amber : K.sub}`, alignItems: "center", justifyContent: "center" }, [text(String(n), { fontFamily: MONO, fontSize: 17, fontWeight: 700, color: reached ? K.canvas : K.text })])));
  }
  // The drawing.
  return div({ position: "relative", width: AW, height: AH }, layers);
}

/** Spanning Tree: four switches in a ring with a diagonal, the root elected, port roles, the one blocked link. */
function spanningTreeArt(): El {
  // The switches: name, centre x, centre y, priority.
  const sw: Record<string, [number, number, string]> = { SW1: [300, 52, "4096"], SW2: [110, 180, "32768"], SW3: [490, 180, "32768"], SW4: [300, 308, "32768"] };
  // The links; the blocked one is drawn dashed in red.
  const links: [string, string, boolean][] = [["SW1", "SW2", false], ["SW1", "SW3", false], ["SW2", "SW4", false], ["SW3", "SW4", true], ["SW2", "SW3", true]];
  // The lines.
  let body = "";
  // Each link.
  for (const [a, b, blocked] of links) {
    // Its ends.
    const [x1, y1] = sw[a], [x2, y2] = sw[b];
    // A line, dashed and red when blocked.
    body += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${blocked ? K.red : K.sub}" stroke-width="5" ${blocked ? 'stroke-dasharray="12 10"' : ""} stroke-linecap="round"/>`;
  }
  // The blocked ports, a cross at the blocking end: SW4's on SW3-SW4 (SW3 is nearer the root, so its end is the
  // designated one) and SW3's on SW2-SW3 (equal costs; SW2, the lower bridge ID in this drawing, keeps its end).
  body += crossPath(378, 256, 10, K.red, 5) + crossPath(396, 180, 10, K.red, 5);
  // The layers: the links, then the switches and the port roles.
  const layers: El[] = [svg(AW, AH, body, { position: "absolute", left: 0, top: 0 })];
  // Each switch, a box with its name and priority; the root in green.
  for (const [name, [x, y, prio]] of Object.entries(sw)) {
    // The root.
    const root = name === "SW1";
    // The box.
    layers.push(at(x - 66, y - 34, div({ width: 132, height: 68, borderRadius: 12, flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: root ? K.green : K.cell, border: `3px solid ${root ? K.green : K.sub}` }, [
      // Its name.
      text(name, { fontFamily: MONO, fontSize: 22, fontWeight: 700, color: root ? K.canvas : K.text }),
      // Its priority.
      text(prio, { fontFamily: MONO, fontSize: 14, color: root ? K.canvas : K.sub }),
    ])));
  }
  // The port roles at the link ends: root ports toward the root, designated ports away.
  const role = (x: number, y: number, r: string, c: string) => layers.push(at(x, y, div({ paddingLeft: 6, paddingRight: 6, height: 24, borderRadius: 6, backgroundColor: K.canvas, border: `2px solid ${c}`, alignItems: "center" }, [text(r, { fontFamily: MONO, fontSize: 13, fontWeight: 700, color: c })])));
  // SW2 and SW3 reach the root directly: root ports; SW1's ports are designated.
  role(150, 118, "RP", K.cyan); role(420, 118, "RP", K.cyan); role(206, 74, "DP", K.green); role(362, 74, "DP", K.green);
  // SW4's root port faces SW2; SW2's port toward SW4 is designated, as is SW3's toward SW4.
  role(196, 252, "RP", K.cyan); role(140, 228, "DP", K.green); role(444, 214, "DP", K.green);
  // The drawing.
  return div({ position: "relative", width: AW, height: AH }, layers);
}

/** Log Detective: the day's access log, the attacker's address picked out, the line where it got in highlighted. */
function logDetectiveArt(): El {
  // The lines (documentation addresses, RFC 5737): a brute force, then the success.
  const lines: [string, string, string, boolean][] = [
    ["198.51.100.14", "GET  /index.html     ", "200", false],
    ["203.0.113.66 ", "POST /wp-login.php   ", "401", false],
    ["203.0.113.66 ", "POST /wp-login.php   ", "401", false],
    ["192.0.2.41   ", "GET  /static/app.css ", "200", false],
    ["203.0.113.66 ", "POST /wp-login.php   ", "401", false],
    ["203.0.113.66 ", "POST /wp-login.php   ", "302", true],
    ["203.0.113.66 ", "GET  /wp-admin/      ", "200", false],
  ];
  // One line: the address (amber when it is the attacker's), the request, the status.
  const line = ([ip, req, st, hit]: [string, string, string, boolean]) =>
    div({ height: 38, alignItems: "center", paddingLeft: 16, borderRadius: 6, backgroundColor: hit ? "rgba(248, 113, 113, 0.22)" : "transparent", border: hit ? `2px solid ${K.red}` : "2px solid transparent", whiteSpace: "pre" }, [
      // The client address.
      text(ip, { fontFamily: MONO, fontSize: 19, fontWeight: 700, color: ip.startsWith("203.0.113.66") ? K.amber : K.sub, whiteSpace: "pre" }),
      // The request.
      text("  " + req, { fontFamily: MONO, fontSize: 19, color: K.text, whiteSpace: "pre" }),
      // The status.
      text(" " + st, { fontFamily: MONO, fontSize: 19, fontWeight: 700, color: st.startsWith("2") || st.startsWith("3") ? K.green : K.red, whiteSpace: "pre" }),
    ]);
  // The terminal panel.
  return div({ width: AW, height: AH, flexDirection: "column", justifyContent: "center", padding: 14, borderRadius: 14, backgroundColor: K.panel, border: `2px solid ${K.line}`, gap: 4 }, lines.map(line));
}

/** Phish or Legit: a message with a homoglyph in its link, the 1 in place of the l picked out, and the two buttons. */
function phishArt(c: ArtContext): El {
  // The buttons' words, from the game.
  const g = c.games["phish-or-legit"] ?? {};
  // "Phish".
  const phish = String(g.phish ?? "Phish");
  // "Legit".
  const legit = String(g.legit ?? "Legit");
  // A part of the address, the suspicious character picked out.
  const part = (s: string, bad = false) => text(s, { fontFamily: MONO, fontSize: 25, fontWeight: 700, color: bad ? K.canvas : K.text, backgroundColor: bad ? K.red : "transparent", borderRadius: 4, paddingLeft: bad ? 3 : 0, paddingRight: bad ? 3 : 0 });
  // The card, then the buttons.
  return div({ width: AW, height: AH, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26 }, [
    div({ width: 540, flexDirection: "column", gap: 16, padding: 22, borderRadius: 16, backgroundColor: K.panel, border: `2px solid ${K.line}` }, [
      // The sender, behind an envelope.
      div({ alignItems: "center", gap: 14 }, [
        svg(40, 30, `<rect x="2" y="2" width="36" height="26" rx="4" fill="none" stroke="${K.sub}" stroke-width="3"/><path d="M3 4 L20 17 L37 4" fill="none" stroke="${K.sub}" stroke-width="3"/>`),
        div({}, [part("support@examp"), part("1", true), part("e-bank.com")]),
      ]),
      // The link it asks you to follow.
      div({ alignItems: "center", gap: 6, paddingTop: 12, borderTop: `2px solid ${K.line}` }, [
        text("https://", { fontFamily: MONO, fontSize: 25, color: K.sub }),
        part("examp"), part("1", true), part("e-bank.com/verify"),
      ]),
    ]),
    // The two answers.
    div({ gap: 22 }, [
      div({ width: 170, height: 56, borderRadius: 28, backgroundColor: K.red, alignItems: "center", justifyContent: "center" }, [text(phish, { fontFamily: SANS, fontSize: 24, fontWeight: 800, color: K.canvas })]),
      div({ width: 170, height: 56, borderRadius: 28, border: `3px solid ${K.green}`, alignItems: "center", justifyContent: "center" }, [text(legit, { fontFamily: SANS, fontSize: 24, fontWeight: 800, color: K.green })]),
    ]),
  ]);
}

/** Whack-a-Bug: nine holes, two bugs up, one feature to leave alone, a hit, the score and the clock. */
function whackArt(): El {
  // The holes' centres.
  const holes = [0, 1, 2].flatMap((r) => [0, 1, 2].map((q) => [130 + q * 170, 90 + r * 105]));
  // The holes, as dark ellipses.
  let body = holes.map(([x, y]) => `<ellipse cx="${x}" cy="${y + 28}" rx="62" ry="17" fill="#000814" stroke="${K.line}" stroke-width="2"/>`).join("");
  // A bug at a hole: shell, head, legs and feelers.
  const bug = (x: number, y: number) =>
    `<g stroke="${K.text}" stroke-width="3" stroke-linecap="round"><path d="M${x - 20} ${y - 2} L${x - 32} ${y - 10} M${x - 20} ${y + 8} L${x - 34} ${y + 8} M${x - 20} ${y + 18} L${x - 32} ${y + 26} M${x + 20} ${y - 2} L${x + 32} ${y - 10} M${x + 20} ${y + 8} L${x + 34} ${y + 8} M${x + 20} ${y + 18} L${x + 32} ${y + 26} M${x - 6} ${y - 30} L${x - 14} ${y - 42} M${x + 6} ${y - 30} L${x + 14} ${y - 42}"/></g>` +
    `<ellipse cx="${x}" cy="${y + 8}" rx="21" ry="25" fill="${K.red}"/><circle cx="${x}" cy="${y - 22}" r="11" fill="${K.red}"/><path d="M${x} ${y - 14} L${x} ${y + 32}" stroke="${K.canvas}" stroke-width="3"/>`;
  // Two bugs up.
  body += bug(holes[1][0], holes[1][1]) + bug(holes[5][0], holes[5][1]);
  // The feature in another hole: a box with a tick, in green.
  const [fx, fy] = holes[6];
  // Its box, lid and tick.
  body += `<rect x="${fx - 24}" y="${fy - 18}" width="48" height="40" rx="5" fill="${K.canvas}" stroke="${K.green}" stroke-width="3.5"/><path d="M${fx - 24} ${fy - 6} L${fx + 24} ${fy - 6} M${fx} ${fy - 18} L${fx} ${fy - 6}" stroke="${K.green}" stroke-width="3.5"/>` + tickPath(fx - 12, fy, 24, K.green, 4);
  // A hit, a star of short strokes over a hole.
  const [hx, hy] = holes[3];
  // The burst.
  body += [0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const r = (a * Math.PI) / 180; return `<path d="M${hx + Math.cos(r) * 16} ${hy + Math.sin(r) * 16} L${hx + Math.cos(r) * 34} ${hy + Math.sin(r) * 34}" stroke="${K.amber}" stroke-width="4" stroke-linecap="round"/>`; }).join("");
  // The layers: the board, then the score and the clock.
  return div({ position: "relative", width: AW, height: AH }, [
    svg(AW, AH, body, { position: "absolute", left: 0, top: 0 }),
    // The points for the hit.
    at(hx - 30, hy - 66, text("+10", { fontFamily: MONO, fontSize: 26, fontWeight: 700, color: K.amber })),
    // The clock.
    at(500, 0, text("0:42", { fontFamily: MONO, fontSize: 22, fontWeight: 700, color: K.sub })),
  ]);
}

/** Aggregate: a board of prefix tiles coloured by length, and two sibling /24s summarising into a /23. */
function aggregateArt(): El {
  // The board, row by row (null for an empty cell).
  const board = [[26, 25, null, 24], [27, null, 24, 23], [null, 25, null, null], [24, null, 26, 22]];
  // The colour of a length, as the game colours its tiles.
  const col = (len: number) => (len >= 27 ? K.blue : len === 26 ? K.green : len === 25 ? K.yellow : len === 24 ? K.orange : len === 23 ? K.red : K.violet);
  // One tile.
  const tile = (len: number | null, size = 72) => div({ width: size, height: size, borderRadius: 10, backgroundColor: len === null ? K.cell : col(len), alignItems: "center", justifyContent: "center", border: len === null ? `2px solid ${K.line}` : "none" }, len === null ? [] : [text(`/${len}`, { fontFamily: SANS, fontSize: size > 70 ? 24 : 26, fontWeight: 800, color: K.canvas })]);
  // The board on the left, the summary on the right.
  return div({ width: AW, height: AH, alignItems: "center", justifyContent: "center", gap: 34 }, [
    div({ flexDirection: "column", gap: 8, padding: 10, borderRadius: 14, backgroundColor: K.panel, border: `2px solid ${K.line}` }, board.map((r) => div({ gap: 8 }, r.map((l) => tile(l))))),
    div({ flexDirection: "column", alignItems: "center", gap: 10 }, [
      // Two siblings.
      div({ gap: 10, alignItems: "center" }, [tile(24, 66), text("+", { fontFamily: SANS, fontSize: 30, fontWeight: 800, color: K.sub }), tile(24, 66)]),
      // Become one.
      svg(40, 44, `<path d="M20 2 L20 38 M8 26 L20 40 L32 26" fill="none" stroke="${K.sub}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`),
      tile(23, 66),
    ]),
  ]);
}

/** First Match: a packet, an access list, and the first entry that matches it, the implicit deny waiting below. */
function firstMatchArt(): El {
  // The entries, the matching one first.
  const aces: [string, "hit" | "no" | "implicit"][] = [
    ["10 permit tcp any host 192.0.2.10 eq 443", "hit"],
    ["20 deny   ip 198.51.100.0 0.0.0.255 any", "no"],
    ["30 permit udp any any eq 53", "no"],
    ["   deny   ip any any", "implicit"],
  ];
  // One entry.
  const ace = ([s, k]: [string, "hit" | "no" | "implicit"]) =>
    div({ height: 46, alignItems: "center", justifyContent: "space-between", paddingLeft: 14, paddingRight: 12, borderRadius: 8, backgroundColor: k === "hit" ? "rgba(34, 197, 94, 0.16)" : K.cell, border: `2px ${k === "implicit" ? "dashed" : "solid"} ${k === "hit" ? K.green : K.line}` }, [
      // The entry's text.
      text(s, { fontFamily: MONO, fontSize: 18, fontWeight: k === "hit" ? 700 : 400, color: k === "implicit" ? K.faint : K.text, whiteSpace: "pre" }),
      // The match, ticked.
      k === "hit" ? svg(26, 26, tickPath(2, 2, 22, K.green, 4)) : div({ width: 26 }),
    ]);
  // The packet above, then the list.
  return div({ width: AW, height: AH, flexDirection: "column", justifyContent: "center", gap: 10 }, [
    div({ alignItems: "center", gap: 12, marginBottom: 6 }, [
      // The packet.
      div({ height: 40, alignItems: "center", paddingLeft: 14, paddingRight: 14, borderRadius: 20, backgroundColor: K.cyan }, [text("tcp 203.0.113.9 > 192.0.2.10:443", { fontFamily: MONO, fontSize: 17, fontWeight: 700, color: K.canvas })]),
      // Into the list.
      svg(60, 24, arrowPath(4, 12, 54, K.cyan, 4)),
    ]),
    ...aces.map(ace),
  ]);
}

/** Exit the Editor: vim's empty buffer, its tildes, and ":q!" typed at the bottom with the cursor after it. */
function exitArt(): El {
  // The terminal: a title bar, the tildes, the command line.
  return div({ width: AW, height: AH, flexDirection: "column", borderRadius: 14, backgroundColor: "#000814", border: `2px solid ${K.line}`, overflow: "hidden" }, [
    // The title bar with its three dots and the program's name.
    div({ height: 40, alignItems: "center", gap: 9, paddingLeft: 16, backgroundColor: K.cell, borderBottom: `2px solid ${K.line}` }, [
      div({ width: 14, height: 14, borderRadius: 7, backgroundColor: K.red }),
      div({ width: 14, height: 14, borderRadius: 7, backgroundColor: K.amber }),
      div({ width: 14, height: 14, borderRadius: 7, backgroundColor: K.green }),
      text("vim", { fontFamily: MONO, fontSize: 17, color: K.sub, marginLeft: 12 }),
    ]),
    // The empty buffer: the cursor line, then vim's tildes.
    div({ flexDirection: "column", paddingLeft: 18, paddingTop: 10, flexGrow: 1 }, [
      div({ width: 13, height: 26, backgroundColor: K.sub, marginBottom: 2 }),
      ...[0, 1, 2, 3, 4, 5].map(() => text("~", { fontFamily: MONO, fontSize: 24, fontWeight: 700, color: K.blue, height: 32 })),
    ]),
    // The command line: ":q!" and the cursor.
    div({ height: 52, alignItems: "center", paddingLeft: 18, borderTop: `2px solid ${K.line}` }, [
      text(":q!", { fontFamily: MONO, fontSize: 30, fontWeight: 700, color: K.green }),
      div({ width: 16, height: 32, backgroundColor: K.green, marginLeft: 4 }),
    ]),
  ]);
}

/** Incident Commander: the service's uptime, the incident in progress, the latency spike, and the review switch off. */
function incidentArt(): El {
  // The latency bars, one spike.
  const bars = [22, 26, 21, 24, 28, 25, 30, 84, 110, 62, 34, 27, 24, 26];
  // The bars drawn.
  const chart = bars.map((h, i) => `<rect x="${8 + i * 28}" y="${130 - h}" width="18" height="${h}" rx="3" fill="${h > 60 ? K.red : K.sky}"/>`).join("") + `<path d="M0 131 H400" stroke="${K.line}" stroke-width="2"/>`;
  // A tile of the dashboard.
  const tile = (w: number, children: El[]) => div({ width: w, height: 150, flexDirection: "column", justifyContent: "center", padding: 16, borderRadius: 14, backgroundColor: K.panel, border: `2px solid ${K.line}`, gap: 6 }, children);
  // Two rows: uptime and the incident; the chart and the switch.
  return div({ width: AW, height: AH, flexDirection: "column", justifyContent: "center", gap: 16 }, [
    div({ gap: 16 }, [
      // Uptime.
      tile(292, [text("99.95%", { fontFamily: MONO, fontSize: 44, fontWeight: 700, color: K.green }), div({ height: 10, borderRadius: 5, backgroundColor: K.green, width: 250 })]),
      // The incident.
      tile(292, [div({ alignItems: "center", gap: 10 }, [div({ height: 40, paddingLeft: 14, paddingRight: 14, borderRadius: 8, backgroundColor: K.amber, alignItems: "center" }, [text("SEV2", { fontFamily: MONO, fontSize: 24, fontWeight: 700, color: K.canvas })]), text("00:14:32", { fontFamily: MONO, fontSize: 26, fontWeight: 700, color: K.text })]), div({ height: 10, borderRadius: 5, width: 250, backgroundColor: K.amber })]),
    ]),
    div({ gap: 16 }, [
      // Latency.
      div({ width: 430, height: 150, alignItems: "flex-end", padding: 10, borderRadius: 14, backgroundColor: K.panel, border: `2px solid ${K.line}` }, [svg(400, 132, chart)]),
      // The approve-without-review switch, off.
      div({ width: 154, height: 150, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: K.panel, border: `2px solid ${K.line}` }, [
        svg(96, 52, `<rect x="2" y="2" width="92" height="48" rx="24" fill="${K.cell}" stroke="${K.sub}" stroke-width="3"/><circle cx="27" cy="26" r="17" fill="${K.sub}"/>`),
      ]),
    ]),
  ]);
}

/** The shelf: one small motif per daily puzzle, a mosaic of the games. */
function shelfArt(): El {
  // A motif: a coloured tile with a few characters from the game.
  const m = (s: string, c: string) => div({ width: 132, height: 104, borderRadius: 14, backgroundColor: K.panel, border: `3px solid ${c}`, alignItems: "center", justifyContent: "center" }, [text(s, { fontFamily: MONO, fontSize: 30, fontWeight: 700, color: c, whiteSpace: "pre" })]);
  // Two rows of four.
  return div({ width: AW, height: AH, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }, [
    div({ gap: 18 }, [m("/22", K.green), m("MX", K.violet), m("0 1", K.cyan), m("SW1", K.green)]),
    div({ gap: 18 }, [m("401", K.red), m("/24", K.orange), m(":q!", K.green), m("+10", K.amber)]),
  ]);
}

/** Each game's drawing and accent colour, by its id; "shelf" is the /dev/fun shelf itself. */
export const GAME_ART: Record<string, { color: string; draw: (c: ArtContext) => El }> = {
  "prefix-of-the-day": { color: K.green, draw: prefixArt },
  "five-clues": { color: K.violet, draw: fiveCluesArt },
  "access-points": { color: K.sky, draw: accessPointsArt },
  "bit-balance": { color: K.cyan, draw: bitBalanceArt },
  "patch-path": { color: K.amber, draw: patchPathArt },
  "spanning-tree": { color: K.green, draw: spanningTreeArt },
  "log-detective": { color: K.red, draw: logDetectiveArt },
  "phish-or-legit": { color: K.red, draw: phishArt },
  "whack-a-bug": { color: K.amber, draw: whackArt },
  aggregate: { color: K.orange, draw: aggregateArt },
  "first-match": { color: K.cyan, draw: firstMatchArt },
  "exit-the-editor": { color: K.green, draw: exitArt },
  "incident-commander": { color: K.amber, draw: incidentArt },
  shelf: { color: K.amber, draw: shelfArt },
};

/**
 * A game's whole card: "/dev/fun" over the game's name, the drawing under it, the address at the foot, all on the
 * centre line, on a canvas lit faintly in the game's colour.
 *
 * @param id the game's id, or "shelf"
 * @param title the game's name (or "/dev/fun" for the shelf)
 * @param c the locale and the games' strings
 * @returns the 1200 x 630 element
 */
export function gameCard(id: string, title: string, c: ArtContext): El {
  // The drawing and its colour.
  const art = GAME_ART[id];
  // The address the card stands for.
  const address = id === "shelf" ? "ronutz.com/dev/fun" : `ronutz.com/dev/fun/${id}`;
  // The card.
  return div({ width: 1200, height: 630, flexDirection: "column", alignItems: "center", backgroundColor: K.canvas, backgroundImage: `radial-gradient(circle at 50% 62%, ${art.color}26 0%, rgba(2,6,23,0) 58%)`, borderTop: `8px solid ${art.color}` }, [
    // The shelf's name, small, above (not repeated on the shelf's own card).
    text(id === "shelf" ? "ronutz.com" : "/dev/fun", { fontFamily: MONO, fontSize: 24, fontWeight: 700, color: art.color, marginTop: 26, letterSpacing: 2 }),
    // The game's name.
    text(title, { fontFamily: SANS, fontSize: 58, fontWeight: 800, color: K.text, letterSpacing: -1, marginTop: 4 }),
    // The drawing.
    div({ marginTop: 18 }, [art.draw(c)]),
    // The address.
    text(address, { fontFamily: MONO, fontSize: 20, color: K.faint, marginTop: 14 }),
  ]);
}
