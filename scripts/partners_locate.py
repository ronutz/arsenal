"""
scripts/partners_locate.py

WHY THIS EXISTS
---------------
Editing a single entry in src/content/vendors/partners.ts requires finding where
that entry starts and ends. Over one session that boundary-finding was written
ad hoc seven times and broke in four distinct ways:

  1. `s.index('slug: "nortel"')` matched nothing, because the entry is
     `slug: "nortel-bay"` - the exact-string check answered a question about the
     slug rather than about the company, and a duplicate entry shipped.
  2. `s.index('\\n  {\\n    slug: "cisco"')` matched nothing, because a comment
     line sits between the opening brace and the slug.
  3. `s.rfind('\\n  {\\n', 0, j)` plus `s.find('\\n  {\\n', j)` returned a span
     covering TWO entries, for the same reason.
  4. An assertion of `blk.count('slug: "') == 1` false-failed, because a nested
     `careerChapter: { slug: ... }` contains a second occurrence.

Every one of those was a defect in the tool rather than in the data, which is
the pattern this module exists to end. Import it instead of writing a new regex.

USAGE
-----
    import sys; sys.path.insert(0, "scripts")
    from partners_locate import load, find_entry, entry_slugs, mentions

    src = load()
    start, end = find_entry(src, "cisco")     # raises if absent or ambiguous
    block = src[start:end]

    mentions(src, "nortel")                   # -> ['nortel-bay']  (by NAME)

`mentions` is the one to call BEFORE creating an entry. It answers "is this
company already in the catalogue", which is the question that actually matters;
`find_entry` answers "where is the entry with exactly this slug".
"""

import re

PARTNERS = "src/content/vendors/partners.ts"

# A top-level entry opens with two-space `{` on its own line, then any number of
# lines (comments are common) before the four-space slug line.
# Leading indentation is tolerated rather than assumed: two entries in this file
# opened with a zero-indent brace, and a pattern that demanded two spaces missed
# them silently. Comment lines between the brace and the slug are also normal.
_ENTRY = re.compile(r'\n *\{\n(?:[^\n]*\n)*?    slug: "([^"]+)"')


def load(path: str = PARTNERS) -> str:
    """Read partners.ts."""
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def _bounds(src: str):
    """[(start, end, slug)] for every top-level entry, in file order."""
    hits = [(m.start(), m.group(1)) for m in _ENTRY.finditer(src)]
    out = []
    for i, (at, slug) in enumerate(hits):
        end = hits[i + 1][0] if i + 1 < len(hits) else len(src)
        out.append((at, end, slug))
    return out


def entry_slugs(src: str):
    """Every top-level slug, in file order."""
    return [slug for _, _, slug in _bounds(src)]


def find_entry(src: str, slug: str):
    """
    (start, end) of the entry whose top-level slug is exactly `slug`.

    Raises rather than returning None: a silent miss is how the duplicate got
    written, so the failure mode here is loud on purpose.
    """
    hits = [(a, b) for a, b, s in _bounds(src) if s == slug]
    if not hits:
        raise KeyError(
            f'no entry with slug "{slug}". '
            f"Check mentions(src, name) - it may exist under a compound slug."
        )
    if len(hits) > 1:
        raise ValueError(f'{len(hits)} entries share the slug "{slug}"')
    return hits[0]


def mentions(src: str, name: str):
    """
    Slugs of every entry mentioning `name` anywhere, case-insensitively.

    This is the pre-write check. Search the NAME, not the slug: a company can be
    catalogued under a merged name, a successor's name, or a compound slug.
    """
    pat = re.compile(re.escape(name), re.I)
    return [s for a, b, s in _bounds(src) if pat.search(src[a:b])]


def body_span(block: str):
    """(start, end) of the contents of the entry's `body: [...]`, or None."""
    m = re.search(r"\n    body: \[(.*?)\n    \],", block, re.S)
    return (m.start(1), m.end(1)) if m else None


def sources_span(block: str):
    """(start, end) of the contents of the entry's `sources: [...]`, or None."""
    m = re.search(r"    sources: \[(.*?)\n    \],", block, re.S)
    return (m.start(1), m.end(1)) if m else None


if __name__ == "__main__":
    # Self-test against the entries that actually broke the ad-hoc versions.
    src = load()
    slugs = entry_slugs(src)
    print(f"[partners_locate] {len(slugs)} top-level entries")

    failures = []

    # 1. an entry with a comment between the brace and the slug
    try:
        a, b = find_entry(src, "cisco")
        blk = src[a:b]
        if blk.count('\n    slug: "') != 1:
            failures.append("cisco block spans more than one entry")
        if "CISCO" not in blk:
            failures.append("cisco block does not contain its own comment")
    except Exception as exc:  # noqa: BLE001
        failures.append(f"cisco: {exc}")

    # 2. an ordinary entry
    try:
        a, b = find_entry(src, "ericsson")
        if src[a:b].count('\n    slug: "') != 1:
            failures.append("ericsson block spans more than one entry")
    except Exception as exc:  # noqa: BLE001
        failures.append(f"ericsson: {exc}")

    # 3. the compound slug that defeated the exact-string check
    if "nortel-bay" not in mentions(src, "nortel"):
        failures.append("mentions('nortel') did not surface nortel-bay")
    try:
        find_entry(src, "nortel")
        failures.append('find_entry("nortel") should raise - there is no such slug')
    except KeyError:
        pass

    # 4. every entry must be locatable by its own slug
    for s in slugs:
        try:
            find_entry(src, s)
        except Exception as exc:  # noqa: BLE001
            failures.append(f"{s}: {exc}")

    if failures:
        print("\n[partners_locate] SELF-TEST FAILED:")
        for f in failures:
            print(f"  - {f}")
        raise SystemExit(1)

    print("[partners_locate] self-test OK: comment-prefixed entries, ordinary")
    print("  entries, compound-slug lookup, and all slugs resolve correctly.")
