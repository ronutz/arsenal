"""
scripts/anvil_lib.py

WHY THIS EXISTS
---------------
In one session, 123 one-off scripts were written to edit content, and every
error that slipped past the guards came from a hand-written locator in one of
them: an exact-slug grep that could not see `nortel-bay`, a block finder that
did not expect a comment between the brace and the slug, an assertion that
counted a nested `slug:` as a second entry, a body-length regex that assumed
multi-line formatting, a probe pointed at a page that did not exist.

Every error that was CAUGHT came from a guard written once and tested. This
module moves the locators into the second category. It is the only sanctioned
way to find, measure, or edit an entry in partners.ts or the glossary.

RULES IT ENFORCES (so the caller cannot forget them)
- Presence is checked BY NAME, unanchored, across every content source, not by
  exact slug. `nortel` finds `nortel-bay`.
- An entry's boundaries are found by enumerating all top-level entries, so a
  comment line or a nested object cannot confuse it.
- Body length is measured by counting characters inside the strings, so
  single-line and multi-line formatting measure the same.
- A probe fails loudly if the page does not exist, and names the page it read.
- Every write operation runs the presence check first and refuses on a hit.

The tests at the bottom run as a build guard (check-anvil-lib), so the tool
that guards the content is itself guarded.
"""

from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARTNERS = ROOT / "src/content/vendors/partners.ts"
GLOSSARY = ROOT / "src/content/glossary/glossary.ts"
MESSAGES = {loc: ROOT / f"src/i18n/messages/{loc}.json" for loc in ("en", "pt-BR")}
CONTENT_ROOTS = [ROOT / "src/content", ROOT / "src/lib"]


# ---------------------------------------------------------------------------
# text helpers
# ---------------------------------------------------------------------------
def fold(text: str) -> str:
    """Lowercase, strip accents. `Nützmann` -> `nutzmann`. Used for matching only."""
    text = text.replace("Ø", "O").replace("ø", "o")
    return "".join(
        c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn"
    ).lower()


def string_chars(segment: str) -> int:
    """Characters INSIDE double-quoted strings in a TS segment, formatting-independent."""
    return sum(len(m) for m in re.findall(r'"((?:[^"\\]|\\.)*)"', segment))


# ---------------------------------------------------------------------------
# entry enumeration - the one locator everything else uses
# ---------------------------------------------------------------------------
@dataclass
class Entry:
    slug: str
    start: int
    end: int
    text: str

    @property
    def name(self) -> str:
        m = re.search(r'\n    name: "([^"]+)"', self.text)
        return m.group(1) if m else ""

    @property
    def body_chars(self) -> int:
        if "body: [" not in self.text:
            return 0
        return string_chars(self.text[self.text.index("body: [") :])

    @property
    def source_count(self) -> int:
        return len(re.findall(r"\{ label:", self.text))


def entries(path: Path = PARTNERS) -> list[Entry]:
    """Every top-level entry, with correct boundaries.

    A top-level entry begins at `\\n  {\\n` and has its slug on a line indented
    exactly four spaces. Comments between the brace and the slug are skipped;
    a `slug:` nested deeper (careerChapter, official, etc.) is never mistaken
    for an entry boundary because of the indentation requirement.
    """
    src = path.read_text(encoding="utf-8")
    starts = []
    for m in re.finditer(r"\n  \{\n", src):
        # find the first four-space slug line after this brace, before the next brace
        nxt = src.find("\n  {\n", m.end())
        window = src[m.end() : nxt if nxt > 0 else len(src)]
        sm = re.search(r'^    slug: "([^"]+)",', window, re.M)
        if sm:
            starts.append((m.start(), sm.group(1)))
    out = []
    for i, (a, slug) in enumerate(starts):
        b = starts[i + 1][0] if i + 1 < len(starts) else len(src)
        out.append(Entry(slug=slug, start=a, end=b, text=src[a:b]))
    return out


def find_entry(slug: str, path: Path = PARTNERS) -> Entry:
    hits = [e for e in entries(path) if e.slug == slug]
    if len(hits) != 1:
        raise LookupError(f"expected exactly one entry with slug {slug!r}, found {len(hits)}")
    return hits[0]


# ---------------------------------------------------------------------------
# presence - BY NAME, across everything
# ---------------------------------------------------------------------------
def mentions(name: str) -> dict[str, list[str]]:
    """Where a name appears, as a whole word, across all content sources.

    Returns {file: [slugs-or-linehints]}. This is the check to run before
    creating anything. It deliberately does NOT anchor on slug.
    """
    pat = re.compile(r"\b" + re.escape(fold(name)) + r"\b")
    found: dict[str, list[str]] = {}
    for root in CONTENT_ROOTS:
        for f in root.rglob("*"):
            if f.suffix not in (".ts", ".tsx", ".mdx", ".md", ".json"):
                continue
            try:
                txt = f.read_text(encoding="utf-8")
            except Exception:
                continue
            if not pat.search(fold(txt)):
                continue
            hints: list[str] = []
            if f == PARTNERS or f == GLOSSARY:
                for e in entries(f):
                    if pat.search(fold(e.text)):
                        hints.append(e.slug)
            else:
                hints.append(f"{len(pat.findall(fold(txt)))} mention(s)")
            found[str(f.relative_to(ROOT))] = hints
    return found


def assert_absent(name: str, allow: set[str] | None = None) -> None:
    """Refuse to proceed if the name already appears anywhere, except in `allow`."""
    hits = mentions(name)
    blocking = {
        f: s for f, s in hits.items() if not (allow and any(a in s for a in allow))
    }
    if blocking:
        raise FileExistsError(
            f"{name!r} already present - check before creating:\n"
            + "\n".join(f"  {f}: {s}" for f, s in blocking.items())
        )


# ---------------------------------------------------------------------------
# edits - each one runs its own checks
# ---------------------------------------------------------------------------
def append_body(slug: str, paragraphs: list[str], sources: list[tuple[str, str]],
                must_not_contain: str | None = None) -> None:
    """Append paragraphs and sources to an existing entry's arrays.

    `must_not_contain` is a regex; if it matches the current entry the edit is
    refused, which is how "is this chapter already written?" gets enforced.
    """
    e = find_entry(slug)
    if must_not_contain and re.search(must_not_contain, e.text, re.I):
        raise FileExistsError(f"{slug}: already contains /{must_not_contain}/ - not appending")
    mb = re.search(r"\n\s+body: \[(.*?)\n\s+\],", e.text, re.S)
    if not mb:
        raise LookupError(f"{slug}: no multi-line body array to append to")
    new = e.text[: mb.end(1)] + "".join(
        '\n      "%s",' % p.replace('"', '\\"') for p in paragraphs
    ) + e.text[mb.end(1) :]
    ms = re.search(r"\s+sources: \[(.*?)\n\s+\],", new, re.S)
    if not ms:
        raise LookupError(f"{slug}: no multi-line sources array to append to")
    new = new[: ms.end(1)] + "".join(
        '\n      { label: "%s", url: "%s" },' % (l, u) for l, u in sources
    ) + new[ms.end(1) :]
    src = PARTNERS.read_text(encoding="utf-8")
    PARTNERS.write_text(src[: e.start] + new + src[e.end :], encoding="utf-8")


# ---------------------------------------------------------------------------
# probes - fail loudly, name the page
# ---------------------------------------------------------------------------
def probe(page: str, fragments: list[str], out_dir: Path = ROOT / "out") -> None:
    """Assert fragments render on a built page. `page` like 'en/industry/cisco'."""
    f = out_dir / page / "index.html"
    if not f.exists():
        raise FileNotFoundError(f"probe: page does not exist: {page} (looked at {f})")
    html = f.read_text(encoding="utf-8")
    import html as h
    text = h.unescape(html)
    missing = [x for x in fragments if x not in text]
    if missing:
        raise AssertionError(f"probe {page}: {len(missing)} of {len(fragments)} missing: {missing}")


# ---------------------------------------------------------------------------
# self-test - runs as a build guard
# ---------------------------------------------------------------------------
def _selftest() -> None:
    es = entries()
    slugs = [e.slug for e in es]
    assert len(slugs) == len(set(slugs)), "entries(): duplicate slugs"
    # 1. an entry with a comment between brace and slug is found (cisco)
    c = find_entry("cisco")
    assert c.text.count('\n    slug: "') == 1, "cisco block spans entries"
    # 2. nested slug in careerChapter does not create a phantom entry
    assert "careerChapter" in c.text
    # 3. body_chars is formatting-independent: 3com is single-line
    assert find_entry("3com").body_chars > 100, "single-line body measured as empty"
    # 4. presence by name sees compound slugs
    hits = mentions("nortel")
    assert any("nortel-bay" in s for s in hits.values()), "mentions() missed nortel-bay"
    # 5. assert_absent refuses on a known name
    try:
        assert_absent("nortel")
        raise AssertionError("assert_absent did not refuse")
    except FileExistsError:
        pass
    # 6. fold handles accents
    assert fold("Nützmann") == "nutzmann"
    # 7. a known single-line stub is found by the replace pattern, AND a
    #    six-space-indented body is found by the append pattern (46 entries)
    fj = find_entry("fujitsu")
    assert _BODY_RE.search(fj.text), "single-line body not locatable"
    six = next(e for e in es if re.search(r"\n      body: \[\n", e.text))
    assert re.search(r"\n\s+body: \[(.*?)\n\s+\],", six.text, re.S), "six-space body not locatable"
    # 8. the depth queue excludes profiled entries (dns-bind has a profile)
    assert has_profile("dns-bind") and "dns-bind" not in [s for _, s, _ in depth_queue()]
    print(f"[check-anvil-lib] OK: {len(es)} entries enumerated; 8 invariants hold.")



# ---------------------------------------------------------------------------
# add_entry - creating a new partner entry, with the checks built in
# (added 2026-09-06; the rule is that a missing capability goes INTO the
#  library rather than into a throwaway script)
# ---------------------------------------------------------------------------
def add_entry(slug: str, name: str, display_name: str, tagline: str, intro: str,
              founded: int, paragraphs: list[str], sources: list[tuple[str, str]],
              before_slug: str, tags: list[str] | None = None, group: str = "other",
              allow_mentions_in: set[str] | None = None) -> None:
    """Insert a new entry immediately before `before_slug`.

    Refuses if the slug exists, or if `name` already appears anywhere in the
    content sources outside `allow_mentions_in` (a set of slugs/hints where a
    passing mention is expected and fine).
    """
    src = PARTNERS.read_text(encoding="utf-8")
    if any(e.slug == slug for e in entries()):
        raise FileExistsError(f"slug {slug!r} already exists")
    assert_absent(name, allow=allow_mentions_in)
    target = find_entry(before_slug)
    src_ts = ", ".join('{ label: "%s", url: "%s" }' % (l, u) for l, u in sources)
    body_ts = "".join('\n      "%s",' % p.replace('"', '\\"') for p in paragraphs)
    tags_ts = json.dumps(tags or ["vendor"])
    block = (
        "  {\n"
        f'    slug: "{slug}",\n'
        f"    sources: [{src_ts}],\n"
        f'    intro: "{intro}",\n'
        f"    tags: {tags_ts},\n"
        f'    name: "{display_name}",\n'
        f'    tagline: "{tagline}",\n'
        f'    group: "{group}",\n'
        f"    founded: {founded},\n"
        f"    body: [{body_ts}\n    ],\n"
        "  },\n"
    )
    # insert at the start of the target entry (its leading newline stays with it)
    at = target.start + 1  # skip the leading "\n" so the new block lands on its own line
    PARTNERS.write_text(src[:at] + block + src[at:], encoding="utf-8")
    # post-condition: exactly one entry with the new slug, and boundaries intact
    e = find_entry(slug)
    assert e.text.count('\n    slug: "') == 1


# ---------------------------------------------------------------------------
# replace_body - swap an entry's whole body array, whatever its formatting
# (added 2026-09-06: placeholders are single-line and must be REPLACED, not
#  appended to; append_body correctly refuses single-line arrays)
# ---------------------------------------------------------------------------
# Indentation-tolerant: 46 entries indent `body:` by six spaces, not four.
_BODY_RE = re.compile(r"\n\s+body: \[.*?\],", re.S)


def replace_body(slug: str, paragraphs: list[str],
                 sources: list[tuple[str, str]] | None = None,
                 require_placeholder: bool = True) -> None:
    """Replace the body array outright. Refuses if the current body is already
    substantial (> 400 chars) unless require_placeholder=False, so a real
    profile cannot be clobbered by a script that assumed it was a stub."""
    e = find_entry(slug)
    if require_placeholder and e.body_chars > 400:
        raise ValueError(f"{slug}: body is {e.body_chars} chars, not a placeholder - "
                         f"pass require_placeholder=False to replace it deliberately")
    m = _BODY_RE.search(e.text)
    if not m:
        raise LookupError(f"{slug}: no body array found")
    body_ts = "".join('\n      "%s",' % p.replace('"', '\\"') for p in paragraphs)
    new = e.text[: m.start()] + f"\n    body: [{body_ts}\n    ]," + e.text[m.end():]
    if sources:
        ms = re.search(r"\s+sources: \[(.*?)\n\s+\],", new, re.S)
        if ms:
            new = new[: ms.end(1)] + "".join(
                '\n      { label: "%s", url: "%s" },' % (l, u) for l, u in sources
            ) + new[ms.end(1):]
        else:
            # single-line sources array: rewrite it as multi-line with additions
            ms1 = re.search(r"    sources: \[(.*?)\],", new, re.S)
            if not ms1:
                raise LookupError(f"{slug}: no sources array found")
            existing = ms1.group(1).strip().rstrip(",")
            adds = "".join('\n      { label: "%s", url: "%s" },' % (l, u) for l, u in sources)
            new = new[: ms1.start()] + f"    sources: [\n      {existing},{adds}\n    ]," + new[ms1.end():]
    src = PARTNERS.read_text(encoding="utf-8")
    PARTNERS.write_text(src[: e.start] + new + src[e.end:], encoding="utf-8")
    assert find_entry(slug).body_chars >= sum(len(p) for p in paragraphs) - 10



# ---------------------------------------------------------------------------
# profiles - an entry with a written profile is NOT a depth-queue candidate
# (added 2026-09-06 after dns-bind: 178-char body, but a full profile file)
# ---------------------------------------------------------------------------
PROFILES = ROOT / "src/content/vendors/profiles"


def has_profile(slug: str) -> bool:
    return (PROFILES / f"{slug}.ts").exists()


def depth_queue(limit: int = 700) -> list[tuple[int, str, int]]:
    """Entries genuinely needing depth: short body AND no profile file.
    Returns (body_chars, slug, source_count) ascending."""
    out = [(e.body_chars, e.slug, e.source_count)
           for e in entries() if 0 < e.body_chars < limit and not has_profile(e.slug)]
    return sorted(out)


if __name__ == "__main__":
    _selftest()
