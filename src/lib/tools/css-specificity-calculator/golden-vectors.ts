// ============================================================================
// src/lib/tools/css-specificity-calculator/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the CSS specificity calculator
// (set "css-specificity-calculator-golden-2026-10-05").
//
// Each vector is a block of selectors. The pinned fields are every selector's
// triple, its pieces (kind, text, column, contribution, note) and any error,
// the ranking, the ties and the top specificity. The first vector is the
// examples table of Selectors Level 4 and the second its four worked cases for
// :is(), :where(), :nth-child(of) and :not(); both must come out as the
// specification prints them.
//
// Expected values were captured from compute.run() on 2026-10-05.
// ============================================================================

import { run, type SpecificityResult } from "./compute";

/** The set id: the tool slug and the date the expected values were captured. */
export const GOLDEN_VECTOR_SET_ID = "css-specificity-calculator-golden-2026-10-05";

/** The fields a vector pins. */
export type SpecificityPinned = ReturnType<typeof pin>;

/** One vector. */
export interface SpecificityVector {
  // A short stable name.
  id: string;
  // The input, exactly as the tool takes it.
  input: { selectors: string };
  // The pinned fields of the result.
  expect: SpecificityPinned;
}

/** Reduce a result to the fields a vector pins. */
export function pin(r: SpecificityResult) {
  // Every selector with its pieces as compact rows, the ranking, the ties, the top.
  return {
    selectors: r.selectors.map((s) => ({ selector: s.selector, text: s.text, error: s.error, pieces: s.pieces.map((p) => [p.kind, p.text, p.adds, p.contribution.join(","), p.note] as (string | null)[]) })),
    ranking: r.ranking,
    ties: r.ties,
    top: r.top,
  };
}

/** The vectors. */
export const VECTORS: SpecificityVector[] = [
  // The ten examples of Selectors Level 4's specificity section, in its order.
  {
    id: "spec-examples",
    input: { selectors: "*\nLI\nUL LI\nUL OL+LI\nH1 + *[REL=up]\nUL OL LI.red\nLI.red.level\n#x34y\n#s12:not(FOO)\n.foo :is(.bar, #baz)" },
    expect: {"selectors":[{"selector":"*","text":"0,0,0","error":null,"pieces":[["universal","*",null,"0,0,0","universal"]]},{"selector":"LI","text":"0,0,1","error":null,"pieces":[["type","LI","C","0,0,1",null]]},{"selector":"UL LI","text":"0,0,2","error":null,"pieces":[["type","UL","C","0,0,1",null],["combinator"," ",null,"0,0,0",null],["type","LI","C","0,0,1",null]]},{"selector":"UL OL+LI","text":"0,0,3","error":null,"pieces":[["type","UL","C","0,0,1",null],["combinator"," ",null,"0,0,0",null],["type","OL","C","0,0,1",null],["combinator","+",null,"0,0,0",null],["type","LI","C","0,0,1",null]]},{"selector":"H1 + *[REL=up]","text":"0,1,1","error":null,"pieces":[["type","H1","C","0,0,1",null],["combinator","+",null,"0,0,0",null],["universal","*",null,"0,0,0","universal"],["attribute","[REL=up]","B","0,1,0",null]]},{"selector":"UL OL LI.red","text":"0,1,3","error":null,"pieces":[["type","UL","C","0,0,1",null],["combinator"," ",null,"0,0,0",null],["type","OL","C","0,0,1",null],["combinator"," ",null,"0,0,0",null],["type","LI","C","0,0,1",null],["class",".red","B","0,1,0",null]]},{"selector":"LI.red.level","text":"0,2,1","error":null,"pieces":[["type","LI","C","0,0,1",null],["class",".red","B","0,1,0",null],["class",".level","B","0,1,0",null]]},{"selector":"#x34y","text":"1,0,0","error":null,"pieces":[["id","#x34y","A","1,0,0",null]]},{"selector":"#s12:not(FOO)","text":"1,0,1","error":null,"pieces":[["id","#s12","A","1,0,0",null],["pseudo-class",":not(FOO)","C","0,0,1","not-max"]]},{"selector":".foo :is(.bar, #baz)","text":"1,1,0","error":null,"pieces":[["class",".foo","B","0,1,0",null],["combinator"," ",null,"0,0,0",null],["pseudo-class",":is(.bar, #baz)","A","1,0,0","is-max"]]}],"ranking":[9,8,7,6,5,4,3,2,1,0],"ties":[],"top":[1,1,0]},
  },
  // The specification's four worked cases for :is(), :where(), :nth-child(of) and :not(), plus :has().
  {
    id: "is-where-not",
    input: { selectors: ":is(em, #foo)\n.qux:where(em, #foo#bar#baz)\n:nth-child(even of li, .item)\n:not(em, strong#foo)\n.card:has(> img)" },
    expect: {"selectors":[{"selector":":is(em, #foo)","text":"1,0,0","error":null,"pieces":[["pseudo-class",":is(em, #foo)","A","1,0,0","is-max"]]},{"selector":".qux:where(em, #foo#bar#baz)","text":"0,1,0","error":null,"pieces":[["class",".qux","B","0,1,0",null],["pseudo-class",":where(em, #foo#bar#baz)",null,"0,0,0","where-zero"]]},{"selector":":nth-child(even of li, .item)","text":"0,2,0","error":null,"pieces":[["pseudo-class",":nth-child(even of li, .item)","B","0,2,0","nth-of"]]},{"selector":":not(em, strong#foo)","text":"1,0,1","error":null,"pieces":[["pseudo-class",":not(em, strong#foo)","A","1,0,1","not-max"]]},{"selector":".card:has(> img)","text":"0,1,1","error":null,"pieces":[["class",".card","B","0,1,0",null],["pseudo-class",":has(> img)","C","0,0,1","has-max"]]}],"ranking":[3,0,2,4,1],"ties":[],"top":[1,0,1]},
  },
  // Pseudo-elements count as type selectors; the legacy single-colon forms too.
  {
    id: "pseudo-elements",
    input: { selectors: "a:hover::before\np:first-line\np::first-line\nli::marker\n::part(label)" },
    expect: {"selectors":[{"selector":"a:hover::before","text":"0,1,2","error":null,"pieces":[["type","a","C","0,0,1",null],["pseudo-class",":hover","B","0,1,0",null],["pseudo-element","::before","C","0,0,1",null]]},{"selector":"p:first-line","text":"0,0,2","error":null,"pieces":[["type","p","C","0,0,1",null],["pseudo-element",":first-line","C","0,0,1","legacy-pseudo-element"]]},{"selector":"p::first-line","text":"0,0,2","error":null,"pieces":[["type","p","C","0,0,1",null],["pseudo-element","::first-line","C","0,0,1",null]]},{"selector":"li::marker","text":"0,0,2","error":null,"pieces":[["type","li","C","0,0,1",null],["pseudo-element","::marker","C","0,0,1",null]]},{"selector":"::part(label)","text":"0,0,1","error":null,"pieces":[["pseudo-element","::part(label)","C","0,0,1","part"]]}],"ranking":[0,1,2,3,4],"ties":[[1,2,3]],"top":[0,1,2]},
  },
  // A repeated class counts twice; the universal selector counts for nothing.
  {
    id: "repeated-and-universal",
    input: { selectors: ".a.a\n.a\n* .a\n*|*:is(:hover, :focus)\nhtml body div.a" },
    expect: {"selectors":[{"selector":".a.a","text":"0,2,0","error":null,"pieces":[["class",".a","B","0,1,0",null],["class",".a","B","0,1,0","repeated"]]},{"selector":".a","text":"0,1,0","error":null,"pieces":[["class",".a","B","0,1,0",null]]},{"selector":"* .a","text":"0,1,0","error":null,"pieces":[["universal","*",null,"0,0,0","universal"],["combinator"," ",null,"0,0,0",null],["class",".a","B","0,1,0",null]]},{"selector":"*|*:is(:hover, :focus)","text":"0,1,0","error":null,"pieces":[["universal","*|*",null,"0,0,0","universal"],["pseudo-class",":is(:hover, :focus)","B","0,1,0","is-max"]]},{"selector":"html body div.a","text":"0,1,3","error":null,"pieces":[["type","html","C","0,0,1",null],["combinator"," ",null,"0,0,0",null],["type","body","C","0,0,1",null],["combinator"," ",null,"0,0,0",null],["type","div","C","0,0,1",null],["class",".a","B","0,1,0",null]]}],"ranking":[0,4,1,2,3],"ties":[[1,2,3]],"top":[0,2,0]},
  },
  // :host(), :host-context() and ::slotted() add their argument's specificity.
  {
    id: "shadow-dom",
    input: { selectors: ":host\n:host(.dark)\n:host-context(body.dark)\n::slotted(span)\n:host(.dark) ::slotted(span.x)" },
    expect: {"selectors":[{"selector":":host","text":"0,1,0","error":null,"pieces":[["pseudo-class",":host","B","0,1,0",null]]},{"selector":":host(.dark)","text":"0,2,0","error":null,"pieces":[["pseudo-class",":host(.dark)","B","0,2,0","host-plus"]]},{"selector":":host-context(body.dark)","text":"0,2,1","error":null,"pieces":[["pseudo-class",":host-context(body.dark)","B","0,2,1","host-plus"]]},{"selector":"::slotted(span)","text":"0,0,2","error":null,"pieces":[["pseudo-element","::slotted(span)","C","0,0,2","slotted-plus"]]},{"selector":":host(.dark) ::slotted(span.x)","text":"0,3,2","error":null,"pieces":[["pseudo-class",":host(.dark)","B","0,2,0","host-plus"],["combinator"," ",null,"0,0,0",null],["pseudo-element","::slotted(span.x)","C","0,1,2","slotted-plus"]]}],"ranking":[4,2,1,0,3],"ties":[],"top":[0,3,2]},
  },
  // A pasted stylesheet: the declarations are dropped, the selector lists split, each selector ranked.
  {
    id: "a-stylesheet",
    input: { selectors: "nav a:hover, nav a:focus-visible {\n  color: red;\n}\n#site-nav a {\n  color: blue;\n}\n.nav .link {\n  color: green;\n}" },
    expect: {"selectors":[{"selector":"nav a:hover","text":"0,1,2","error":null,"pieces":[["type","nav","C","0,0,1",null],["combinator"," ",null,"0,0,0",null],["type","a","C","0,0,1",null],["pseudo-class",":hover","B","0,1,0",null]]},{"selector":"nav a:focus-visible","text":"0,1,2","error":null,"pieces":[["type","nav","C","0,0,1",null],["combinator"," ",null,"0,0,0",null],["type","a","C","0,0,1",null],["pseudo-class",":focus-visible","B","0,1,0",null]]},{"selector":"#site-nav a","text":"1,0,1","error":null,"pieces":[["id","#site-nav","A","1,0,0",null],["combinator"," ",null,"0,0,0",null],["type","a","C","0,0,1",null]]},{"selector":".nav .link","text":"0,2,0","error":null,"pieces":[["class",".nav","B","0,1,0",null],["combinator"," ",null,"0,0,0",null],["class",".link","B","0,1,0",null]]}],"ranking":[2,3,0,1],"ties":[[0,1]],"top":[1,0,1]},
  },
  // Equal specificities tie; order of appearance decides.
  {
    id: "ties",
    input: { selectors: "h1.title\n.hero h1\nheader .title\n#x" },
    expect: {"selectors":[{"selector":"h1.title","text":"0,1,1","error":null,"pieces":[["type","h1","C","0,0,1",null],["class",".title","B","0,1,0",null]]},{"selector":".hero h1","text":"0,1,1","error":null,"pieces":[["class",".hero","B","0,1,0",null],["combinator"," ",null,"0,0,0",null],["type","h1","C","0,0,1",null]]},{"selector":"header .title","text":"0,1,1","error":null,"pieces":[["type","header","C","0,0,1",null],["combinator"," ",null,"0,0,0",null],["class",".title","B","0,1,0",null]]},{"selector":"#x","text":"1,0,0","error":null,"pieces":[["id","#x","A","1,0,0",null]]}],"ranking":[3,0,1,2],"ties":[[0,1,2]],"top":[1,0,0]},
  },
  // A dangling combinator, an unclosed bracket, an unclosed parenthesis, and one valid selector.
  {
    id: "errors",
    input: { selectors: "div >\n[unclosed\n:is(\n.ok" },
    expect: {"selectors":[{"selector":"div >","text":"0,0,1","error":{"what":"dangling-combinator","at":5},"pieces":[["type","div","C","0,0,1",null],["combinator",">",null,"0,0,0",null]]},{"selector":"[unclosed","text":"0,0,0","error":{"what":"unbalanced","at":0},"pieces":[]},{"selector":":is(","text":"0,0,0","error":{"what":"unbalanced","at":3},"pieces":[]},{"selector":".ok","text":"0,1,0","error":null,"pieces":[["class",".ok","B","0,1,0",null]]}],"ranking":[3],"ties":[],"top":[0,1,0]},
  },
];

/** What verifyVectors reports (the shape scripts/run-golden-vectors.mts reads). */
export interface VerifyReport {
  // The set id.
  setId: string;
  // Vectors run.
  total: number;
  // Vectors whose pinned fields matched.
  passed: number;
  // The ones that did not, with the first difference.
  failures: { id: string; reason: string }[];
}

/** Run every vector and compare its pinned fields byte for byte. */
export function verifyVectors(): VerifyReport {
  // Failures found.
  const failures: { id: string; reason: string }[] = [];
  // Each vector.
  for (const v of VECTORS) {
    // A throw is a failure too.
    try {
      // Run and reduce (through JSON, as the expected values were captured).
      const got = JSON.stringify(pin(run(v.input)));
      // The expected text.
      const want = JSON.stringify(v.expect);
      // Compare.
      if (got !== want) {
        // The first differing character, for a readable reason.
        let k = 0;
        // Walk to it.
        while (k < got.length && got[k] === want[k]) k++;
        // Record.
        failures.push({ id: v.id, reason: `differs at ${k}: got ...${got.slice(Math.max(0, k - 30), k + 50)}... want ...${want.slice(Math.max(0, k - 30), k + 50)}...` });
      }
    } catch (e) {
      // The error.
      failures.push({ id: v.id, reason: `threw: ${(e as Error).message}` });
    }
  }
  // The report.
  return { setId: GOLDEN_VECTOR_SET_ID, total: VECTORS.length, passed: VECTORS.length - failures.length, failures };
}
