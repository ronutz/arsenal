#!/usr/bin/env python3
# ============================================================================
# scripts/old-sites/build-clone.py
# ----------------------------------------------------------------------------
# THE EARLIER SITES, REBUILT AS NAVIGABLE CLONES (PRIME, 2026-10-05 11:03:
# "fetch the whole lot, and let users navigate a modernized local CLONE of the
# old sites. Complete with animated banner and the tools that were available on
# the historical sites").
#
# INPUT: the hosting account's export of 2013-03-05 (mydomain_byebye.zip in
# PRIME's Dropbox folder NTZ_Site, unpacked), one directory per domain:
# nutzmann.net/ (the 2004 frameset site as it stood on the server) and
# ntz.com.br/ (the 2013 site). The export is PRIME's private material and is
# NOT in this repository; the script is kept so the clones can be regenerated
# from it, and so every change made to the pages is written down in one place.
#
# OUTPUT: public/archive/sites/<slug>/... (the pages re-encoded to UTF-8 with
# the minimum of changes, every asset they reference, a few reconstruction
# pages in the old style) and src/content/about/old-sites/<slug>.json (the
# manifest the wrapper page reads: pages, orphans, repairs, counts of every
# kind of change). The reproduction keeps the layout, the frameset, the copy,
# the dates and the rough edges; it removes what cannot run or must not run
# today (Flash, Google Analytics, the FormMail CGI, eval()) and it links to the
# originals instead of cloning other people's pages.
#
# USAGE: python3 scripts/old-sites/build-clone.py <export-dir> <public-dir>
#        <manifest-dir> <flash-encodes-url-base>
# e.g.   python3 scripts/old-sites/build-clone.py ~/NTZ_Site/export public
#        src/content/about/old-sites /archive/earlier-sites/flash/
#
# Every page written carries a provenance comment naming its source file, the
# export date, the original encoding and the changes applied. Every statement
# in this file is commented (CONCORD D-19).
# ============================================================================
import os, re, sys, json, html, shutil  # paths, patterns, arguments, the manifest, entity decoding, file copies
from urllib.parse import urlsplit, unquote  # URL parts and percent-decoding for the references in the pages

# The four arguments: where the export is, where the clones go, where the manifests go, where the bar videos live.
EXPORT, PUBLIC, MANIFESTS, FLASH_BASE = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
# The clones live under this public prefix (served as static assets, outside the Next route tree).
OUT = os.path.join(PUBLIC, "archive", "sites")

# The two sites of this wave. Per site: the export folder, the clone slug, the home file, the hosts the pages used for
# absolute self-links, the stylesheet the reconstruction pages reuse, the Flash files and the name of their video
# encodes, the image folder name, the never-published tools (a reconstruction page each), and the links the original
# carried to pages that were not on the server, with the Internet Archive's record per path (CDX read 2026-10-05).
SITES = [
    {"folder": "nutzmann.net", "slug": "nutzmann-net-2004", "home": "index.htm", "hosts": ["nutzmann.net", "www.nutzmann.net"], "css": "estilo.css",
     "flash": {"imagens/barra2_topo.swf": "barra2_topo"}, "tools_missing": {"ipsubnet.htm": "cidr", "pinout.htm": "pinout"}, "imgdir": "imagens",
     "dead": {"wan.htm": "o Internet Archive registrou 404 em 21/10/2004", "jbsold.htm": "não consta em nenhuma captura do Internet Archive (2004 a 2014)"}},
    {"folder": "ntz.com.br", "slug": "ntz-com-br-2013", "home": "index.html", "hosts": ["ntz.com.br", "www.ntz.com.br"], "css": "estilo.css",
     "flash": {"images/topbar.swf": "topbar", "/images/topbar.swf": "topbar", "barra2_topo.swf": "barra2_topo"}, "tools_missing": {}, "imgdir": "images",
     "dead": {"solucoes.html": "não consta em nenhuma captura do Internet Archive (2008 a 2019); os menus de 2013 ainda apontavam para o nome de 2004",
              "principal.html": "não consta em nenhuma captura do Internet Archive (2008 a 2019); o site de 2013 não tinha mais o quadro principal de 2004",
              "wan.html": "não consta em nenhuma captura do Internet Archive", "jbsold.html": "não consta em nenhuma captura do Internet Archive",
              "comunicredes.html": "não consta em nenhuma captura do Internet Archive; a página existia no site de 2004 (comunicredes.htm)",
              "inferior.htm": "não consta em nenhuma captura do Internet Archive; o rodapé de 2013 era footer.html"}},
]

# Files never copied: server-side and binary leftovers that were not part of the pages (CGI, the saved third-party
# pages, Dreamweaver notes, Flash sources, artwork sources, archives, databases, WML, text, SSI error pages, Google
# site-verification files, Windows thumbnails).
SKIP_RE = re.compile(r"(^|/)(cgi-bin|mirrors|_notes)(/|$)|\.(swf|fla|ai|cdr|wmf|zip|tar\.gz|db|pl|htaccess|pemhtaccess|wml|txt|shtml|processed|mno)$|(^|/)google[0-9a-f]+\.html$|(^|/)googlehostedservice\.html$|(^|/)Thumbs\.db$", re.I)
# Pages that are the author's own drafts and copies, never part of the site as served: suffixed variants and the stray
# page copies Dreamweaver left inside the image folders. They stay in the export, out of the clone, listed as excluded.
VARIANT_RE = re.compile(r"(^|/)(imagens|images)/[^/]+\.html?$|(_old|_velha|_clean|__|_|_nahh|_deprecated|_hot|_2008\.05\.1[01]|_NTZ|_ntz|_nutzmann|_2)\.html?$|(^|/)redirect\.html$|(^|/)index\.wml$", re.I)
# The attributes that carry a URL in these pages.
URL_ATTR_RE = re.compile(r"""(?P<attr>\b(?:src|href|background|longdesc|action)\s*=\s*)(?P<q>["']?)(?P<url>[^"'\s>]+)(?P=q)""", re.I)
# The quoted image, style, script and PDF names inside scripts and event handlers (the Dreamweaver rollovers swap and
# preload images by name), so those assets join the clone too.
QUOTED_ASSET_RE = re.compile(r"['\"]([^'\"\s<>()]+\.(?:gif|jpe?g|png|bmp|ico|css|js|pdf))['\"]", re.I)
# The saved third-party pages in mirrors/, mapped to the page each was saved from (the "saved from url=" line in each
# file). No page of the export links to them, so the map is kept for completeness: should a link appear, it goes to the
# Internet Archive's 2004 capture of the original rather than to a clone of someone else's page.
MIRROR_ORIGINALS = {
    "cable pinouts.htm": "http://www.cisco.com/univercd/cc/td/doc/product/rtrmgmt/switprob/inst4.1/probb.htm",
    "default password list.htm": "http://www.phenoelit.de/dpl/dpl.html",
    "ieee oui and company_id assignments.htm": "http://standards.ieee.org/regauth/oui/index.shtml",
    "ietf rfc page.htm": "http://www.ietf.org/rfc.html",
    "rj-45 crossover cable and straight through pinouts.htm": "http://www.ertyu.org/steven_nikkel/ethernetcables.html",
}
# The date the clones were made, written into every provenance comment.
MADE = "2026-10-05"


def read_page(path):
    """Decode a page by its declared charset (iso-8859-1 or windows-1252), falling back to iso-8859-1; return the text and the name."""
    raw = open(path, "rb").read()  # the bytes as served
    m = re.search(rb"charset\s*=\s*[\"']?\s*([A-Za-z0-9_-]+)", raw, re.I)  # the declared charset, if any
    enc = (m.group(1).decode("ascii").lower() if m else "iso-8859-1")  # the 2004 default when undeclared
    if enc in ("windows-1252", "cp1252"):  # four files declared Windows-1252
        return raw.decode("cp1252", errors="replace"), "windows-1252"
    return raw.decode("iso-8859-1"), enc  # everything else was Latin-1


def is_page(name):
    """True for an HTML page file."""
    return name.lower().endswith((".htm", ".html"))


def build_site(site):
    """Build one clone: walk the export's link graph, copy assets, transform and write pages, write the manifest."""
    src_root = os.path.join(EXPORT, site["folder"])  # the export folder of this site
    out_root = os.path.join(OUT, site["slug"])  # the clone folder
    prefix = f"/archive/sites/{site['slug']}/"  # the clone's public URL prefix
    # Every file of the export by its relative path, and a lower-cased map for case repairs (the server was case-sensitive).
    files = {}
    for root, _, names in os.walk(src_root):  # every file under the site folder
        for n in names:  # each file
            rel = os.path.relpath(os.path.join(root, n), src_root).replace(os.sep, "/")  # its path relative to the site root
            files[rel] = os.path.join(root, n)  # mapped to its real path
    lower = {}
    for rel in files: lower.setdefault(rel.lower(), rel)  # first spelling wins for each lower-cased path
    # The manifest: the facts the wrapper page shows.
    manifest = {"site": site["folder"], "slug": site["slug"], "made": MADE, "exportDate": "2013-03-05", "pages": [], "orphans": [], "assets": 0,
                "changes": {"charset": 0, "analytics": 0, "flash": 0, "forms": 0, "mirrors": 0, "missingTools": 0, "caseFixes": 0, "pathFixes": 0, "deadLinks": 0, "eval": 0, "linkTypos": 0, "absoluteSelf": 0, "externalLinks": 0, "crossSite": 0},
                "excluded": [], "unresolved": [], "repairs": [], "dead": site["dead"], "toolsMissing": site["tools_missing"]}
    # The link graph starts at the home page; pages reached through frames, iframes, anchors and forms; the assets they reference.
    reachable_pages, assets, queue = set(), set(), [site["home"]]
    other = [s for s in SITES if s is not site][0]  # the other site, for cross-site links
    other_files = set()
    for root, _, names in os.walk(os.path.join(EXPORT, other["folder"])):  # the other site's files, to check cross-site targets
        for n in names: other_files.add(os.path.relpath(os.path.join(root, n), os.path.join(EXPORT, other["folder"])).replace(os.sep, "/"))

    def fix_typos(u):
        """The author's link typos, repaired the way a reader would: "/http://host/page" (a slash before the scheme),
        "www.host/path" (no scheme) and "htto://" (a mistyped scheme). Anything else is returned as written."""
        if re.match(r"^/https?://", u): u = u[1:]  # drop the slash before the scheme
        if re.match(r"^www\.[a-z0-9-]+\.[a-z.]+(/|$)", u, re.I): u = "http://" + u  # give the schemeless host a scheme
        if re.match(r"^htto://", u, re.I): u = "http://" + u[7:]  # the mistyped scheme
        return u

    def resolve(base_rel, url):
        """Resolve a URL written in page base_rel to (a path within the export, its kind): special, external, self (an
        absolute URL to this site), other (the other site), absolute (root-relative) or relative."""
        u = html.unescape(url.strip())  # entities decoded, whitespace off
        if u.startswith(("mailto:", "javascript:", "#", "about:", "clsid", "data:")) or u == "": return None, "special"  # not a file
        u = fix_typos(u)  # the typos, before parsing
        parts = urlsplit(u)  # scheme, host, path
        if parts.scheme in ("http", "https") or u.startswith("//"):  # an absolute URL
            host = (parts.netloc or "").lower().split(":")[0]  # the host without a port
            if host in site["hosts"]:  # this site's own host
                return unquote(parts.path.lstrip("/")) or site["home"], "self"
            if host in other["hosts"]:  # the other site's host
                return unquote(parts.path.lstrip("/")) or other["home"], "other"
            return None, "external"  # someone else's site
        if parts.scheme: return None, "special"  # another scheme (ftp:, news:)
        path = unquote(parts.path)  # the path, percent-decoded
        if path.startswith("/"):  # root-relative: the 2004 server root is the clone's prefix now, so these are re-rooted on output
            rel = path.lstrip("/") or site["home"]
            return rel, "absolute"
        rel = os.path.normpath(os.path.join(os.path.dirname(base_rel), path)).replace(os.sep, "/")  # relative to the page
        if rel in ("", "."): rel = site["home"]  # an empty path means the home
        return rel, "relative"

    def exists(rel):
        """The real path of a file, repairing case; None when absent."""
        if rel in files: return rel  # as written
        if rel.lower() in lower: return lower[rel.lower()]  # with its real case
        return None

    def repair(rel):
        """A second chance for a reference the 2004 server would have failed: the same path from the site root (the case
        pages in cases/ wrote imagens/x.gif meaning /imagens/x.gif), the other image folder name (the 2013 case pages
        kept 2004's /imagens/ while the 2013 site used images/), and the .htm/.html twin of a page (the 2013 menus kept
        2004's .htm names). Returns (real path, repair kind) or (None, None); never a guess by similarity."""
        cands = []  # the candidates, in order of trust
        parts = rel.split("/")  # the path segments
        base = parts[-1]  # the file name
        if len(parts) > 1: cands.append(("root", "/".join(parts[1:])))  # the same path from the site root
        for a, b in (("imagens", "images"), ("images", "imagens")):  # the two image folder names
            if a in [x.lower() for x in parts[:-1]]:  # the path goes through one of them
                cands.append(("imgdir", "/".join(b if x.lower() == a else x for x in parts)))  # the other name, same place
                cands.append(("imgdir", b + "/" + base))  # the other name at the root
        if is_page(rel):  # a page: its .htm/.html twin
            cands.append(("ext", re.sub(r"\.html?$", lambda m: ".html" if m.group(0).lower() == ".htm" else ".htm", rel, flags=re.I)))
        for kind, c in cands:  # the first candidate that exists and is not an excluded file wins
            r = exists(c)
            if r is not None and not VARIANT_RE.search(r) and not SKIP_RE.search(r): return r, kind
        return None, None  # no repair

    def outside_scripts_plain(text):
        """The text with <script> blocks blanked, for link scanning (URL-shaped tokens inside scripts are code, not links)."""
        return re.sub(r"<script\b.*?</script>", " ", text, flags=re.I | re.S)

    def scan(real):
        """Queue the pages a page links to and collect the assets it references (in attributes, and the names quoted inside
        scripts and event handlers)."""
        text, _ = read_page(files[real])  # the page text
        for m in QUOTED_ASSET_RE.finditer(text):  # assets named in quotes anywhere (rollovers, preloads)
            target, kind = resolve(real, m.group(1))
            if kind not in ("relative", "self", "absolute") or target is None: continue  # not a file of this site
            t = exists(target)
            if t is None: t, _ = repair(target)  # repaired if the server would have missed it
            if t is not None and not is_page(t) and not SKIP_RE.search(t): assets.add(t)  # an asset
        for m in URL_ATTR_RE.finditer(outside_scripts_plain(text)):  # URLs in attributes, outside scripts
            target, kind = resolve(real, m.group("url"))
            if kind not in ("relative", "self", "absolute") or target is None: continue  # not a file of this site
            clean = target.split("#")[0].split("?")[0]  # without fragment or query
            t = exists(clean)
            if t is None: t, _ = repair(clean)  # repaired if possible
            if t is None or SKIP_RE.search(t) or VARIANT_RE.search(t): continue  # absent or excluded
            if is_page(t): queue.append(t)  # a page to visit
            else: assets.add(t)  # an asset to copy

    def drain():
        """Visit every queued page once, scanning each for more."""
        while queue:  # until nothing is queued
            rel = queue.pop()
            if rel in reachable_pages: continue  # seen
            real = exists(rel)
            if real is None or not is_page(real) or SKIP_RE.search(real) or VARIANT_RE.search(real): continue  # absent or excluded
            reachable_pages.add(real)  # reached
            scan(real)  # and scanned

    drain()  # the pages the menus reach
    # The orphans: content pages on the server that no menu reached (drafts the author left; the case studies of 2004
    # are among them). They join the clone and the manifest lists them apart, so the wrapper page can say so.
    orphans = []
    for rel in sorted(files):  # every page file not reached
        if is_page(rel) and rel not in reachable_pages and not SKIP_RE.search(rel) and not VARIANT_RE.search(rel):
            orphans.append(rel); reachable_pages.add(rel); scan(rel)  # listed, included, scanned
    drain()  # pages the orphans link to
    manifest["orphans"] = orphans  # for the wrapper page
    # Copy the assets.
    for a in sorted(assets):  # each referenced asset
        dst = os.path.join(out_root, a)  # at the same relative path
        os.makedirs(os.path.dirname(dst), exist_ok=True)  # folders as needed
        shutil.copyfile(files[a], dst)  # bytes unchanged
    manifest["assets"] = len(assets)  # the count
    # Everything in the export that is not carried over, for the record.
    for rel in sorted(files):
        if rel not in assets and rel not in reachable_pages: manifest["excluded"].append(rel)

    def outside_scripts(text, fn):
        """Apply fn to the parts of the text outside <script> blocks."""
        parts = re.split(r"(<script\b.*?</script>)", text, flags=re.I | re.S)  # split keeping the script blocks
        return "".join(part if part.lower().startswith("<script") else fn(part) for part in parts)  # scripts untouched

    def transform(real, text, enc):
        """Apply the listed changes to one page; return the new text and the list of change kinds applied."""
        changed = []  # the kinds applied to this page
        # 1. Charset: one meta charset utf-8, the http-equiv declaration replaced in place (or added after <head>).
        new, n = re.subn(r"<meta\s+http-equiv\s*=\s*[\"']?content-type[\"']?\s+content\s*=\s*[\"'][^\"']*[\"']\s*/?>", '<meta charset="utf-8">', text, flags=re.I)
        if n == 0: new, n = re.subn(r"(<head[^>]*>)", r'\1\n<meta charset="utf-8">', new, count=1, flags=re.I)  # none declared: add one
        if n: changed.append("charset")
        # 2. Google Analytics: urchin.js and its _uacct block (2004), ga.js with _gaq or _gat._getTracker (2013).
        new, n1 = re.subn(r"<script[^>]*src\s*=\s*[\"']https?://www\.google-analytics\.com/urchin\.js[\"'][^>]*>\s*</script>\s*", "", new, flags=re.I)
        new, n2 = re.subn(r"<script[^>]*>\s*(?:<!--)?\s*_uacct\s*=\s*[\"'][^\"']*[\"'];?\s*urchinTracker\(\);?\s*(?:-->)?\s*</script>\s*", "", new, flags=re.I)
        new, n3 = re.subn(r"<script[^>]*>(?:(?!</script>).)*?_gaq(?:(?!</script>).)*?</script>\s*", "", new, flags=re.I | re.S)
        new, n4 = re.subn(r"<script[^>]*>(?:(?!</script>).)*?google-analytics\.com/ga\.js(?:(?!</script>).)*?</script>\s*", "", new, flags=re.I | re.S)
        new, n5 = re.subn(r"<script[^>]*>(?:(?!</script>).)*?(?:_gat\._getTracker|pageTracker\._trackPageview)(?:(?!</script>).)*?</script>\s*", "", new, flags=re.I | re.S)
        if n1 or n2 or n3 or n4 or n5: changed.append("analytics")

        # 3. URLs: rewrite each one according to its kind (outside scripts; before the Flash and form passes, whose
        #    injected URLs must not be touched).
        def url_repl(m):
            """Rewrite one URL attribute."""
            url = m.group("url"); q = m.group("q") or '"'  # the URL and its quote
            target, kind = resolve(real, url)  # where it points
            if kind == "external":  # another site: as it was (a mistyped scheme repaired and counted); the anchor pass opens it in a new tab
                fixed_url = fix_typos(html.unescape(url.strip()))
                if fixed_url != html.unescape(url.strip()):
                    manifest["changes"]["linkTypos"] += 1
                    return f'{m.group("attr")}{q}{html.escape(fixed_url, quote=True)}{q}'
                return m.group(0)
            if kind == "special" or target is None: return m.group(0)  # mailto:, javascript:, fragments
            if url.startswith("/archive/"): return m.group(0)  # already rewritten
            frag = ("#" + url.split("#", 1)[1]) if "#" in url else ""  # the fragment, kept
            clean = target.split("#")[0].split("?")[0]  # the path alone
            if kind == "other":  # the other site: into its clone when the page exists there
                if clean in other_files and is_page(clean) and not SKIP_RE.search(clean):
                    manifest["changes"]["crossSite"] += 1
                    return f'{m.group("attr")}{q}/archive/sites/{other["slug"]}/{clean}{frag}{q}'
                return m.group(0)
            if clean.lower().startswith("mirrors/"):  # a saved third-party page: the Internet Archive's capture of the original instead
                orig = MIRROR_ORIGINALS.get(os.path.basename(clean).lower())
                manifest["changes"]["mirrors"] += 1
                return f'{m.group("attr")}{q}https://web.archive.org/web/2004/{orig}{q}' if orig else f'{m.group("attr")}{q}{prefix}_reconstruido/espelho.htm{q}'
            if clean in site["tools_missing"]:  # a never-published tool: its reconstruction page at the same path
                manifest["changes"]["missingTools"] += 1
                return f'{m.group("attr")}{q}{prefix}{clean}{frag}{q}'
            if clean in site["dead"] or os.path.basename(clean) in site["dead"]:  # a page the original linked but never had
                manifest["changes"]["deadLinks"] += 1
                return f'{m.group("attr")}{q}{prefix}{os.path.basename(clean)}{frag}{q}'
            if clean.lower().endswith(".swf"): return m.group(0)  # Flash: the Flash pass below handles the whole block
            fixed = exists(clean)  # the file, case repaired
            if fixed is None:  # not there as written: a repair, or broken as in the original
                fixed, how = repair(clean)
                if fixed is not None:
                    manifest["changes"]["pathFixes"] += 1
                    manifest["repairs"].append({"page": real, "url": url, "to": fixed, "how": how})
                    return f'{m.group("attr")}{q}{prefix}{fixed}{frag}{q}'
            if fixed is None:  # broken in the original too: kept broken, listed, re-rooted so the miss stays inside the archive
                manifest["unresolved"].append({"page": real, "url": url})
                return f'{m.group("attr")}{q}{prefix}{clean}{frag}{q}' if kind in ("self", "absolute") else m.group(0)
            if fixed != clean: manifest["changes"]["caseFixes"] += 1  # the case differed
            if kind in ("self", "absolute"):  # "http://nutzmann.net/x" and "/x" both meant the server root: the clone's prefix now
                manifest["changes"]["absoluteSelf"] += 1
                if fix_typos(html.unescape(url.strip())) != html.unescape(url.strip()): manifest["changes"]["linkTypos"] += 1
                return f'{m.group("attr")}{q}{prefix}{fixed}{frag}{q}'
            if fixed != clean:  # a relative reference with the wrong case: the real case, still relative
                relfix = os.path.relpath(fixed, os.path.dirname(real) or ".").replace(os.sep, "/")
                return f'{m.group("attr")}{q}{relfix}{frag}{q}'
            return m.group(0)  # as written
        new = outside_scripts(new, lambda part: URL_ATTR_RE.sub(url_repl, part))

        # 4. External anchors open in a new tab with no referrer (the clone runs inside the wrapper page's frame).
        def ext_anchor(m):
            """Give one external anchor target="_blank" and rel="noopener noreferrer"."""
            tag = m.group(0)  # the opening tag
            if re.search(r"\btarget\s*=", tag, re.I): tag = re.sub(r"\btarget\s*=\s*[\"']?[^\"'\s>]+[\"']?", 'target="_blank"', tag, flags=re.I)  # replace the target
            else: tag = tag[:-1] + ' target="_blank"' + tag[-1]  # or add one
            if not re.search(r"\brel\s*=", tag, re.I): tag = tag[:-1] + ' rel="noopener noreferrer"' + tag[-1]  # and the rel
            manifest["changes"]["externalLinks"] += 1
            return tag
        new = outside_scripts(new, lambda part: re.sub(r"<a\b[^>]*\bhref\s*=\s*[\"']?https?://(?!(?:www\.)?(?:" + "|".join(re.escape(h) for h in site["hosts"] + other["hosts"]) + r"))[^>]*>", ext_anchor, part, flags=re.I))

        # 5. Flash: the <object><embed ...swf></embed></object> block (or a bare <embed>) becomes the video of the same bar.
        def flash_repl(m):
            """Replace one Flash block by the video encoded from the same SWF (same box, autoplay, muted, loop, poster)."""
            block = m.group(0)  # the whole block
            mm = re.search(r"[\"']?([^\"'\s>]+\.swf)[\"']?", block, re.I)  # the SWF it embeds
            key = mm.group(1) if mm else ""
            name = None  # the encode name
            for k, v in site["flash"].items():  # the known bars
                if key.lower().endswith(k.lower().lstrip("/")): name = v
            if name is None: return block  # an unknown SWF: left as it was (object-src 'none' blocks it; nothing else to show)
            w = re.search(r"width\s*=\s*[\"']?(\d+)", block, re.I); h = re.search(r"height\s*=\s*[\"']?(\d+)", block, re.I)  # the box
            ww = w.group(1) if w else "798"; hh = h.group(1) if h else "78"  # the bars' own size when unstated
            return (f'<!-- reconstructed: the Flash bar {key} plays as video (encoded from the original SWF at its own 12 fps, {MADE}) -->'
                    f'<video width="{ww}" height="{hh}" autoplay muted loop playsinline poster="{FLASH_BASE}{name}-poster.png" style="display:block">'
                    f'<source src="{FLASH_BASE}{name}.webm" type="video/webm"><source src="{FLASH_BASE}{name}.mp4" type="video/mp4">'
                    f'<img src="{FLASH_BASE}{name}-poster.png" width="{ww}" height="{hh}" alt=""></video>')
        new, n = re.subn(r"<object\b(?:(?!</object>).)*?</object>", flash_repl, new, flags=re.I | re.S)  # object blocks
        if n: changed.append("flash")
        new, n = re.subn(r"<embed\b[^>]*\.swf[^>]*>(?:\s*</embed>)?", lambda m: flash_repl(m), new, flags=re.I)  # bare embeds

        # 6. Forms: the FormMail CGI no longer runs; the form submits (GET, nothing sent) to a page that says so.
        def form_repl(m):
            """Point one form at the explanation page."""
            return re.sub(r"action\s*=\s*[\"'][^\"']*[\"']", f'action="{prefix}_reconstruido/formulario.htm"', m.group(0), flags=re.I).replace('method="post"', 'method="get"').replace('method="POST"', 'method="get"')
        new, n = re.subn(r"<form\b[^>]*>", form_repl, new, flags=re.I)
        if n: changed.append("forms")
        # 7. eval(): the bits-and-bytes calculator wrapped four numeric values in eval() (a number, a numeric string, or a
        #    sum of the two); the clone runs under a Content Security Policy without 'unsafe-eval', so each call becomes
        #    Number(), which returns the same value for every input the calculator produces (blank gives 0 either way).
        new, n = re.subn(r"\beval\(", "Number(", new)
        if n: changed.append("eval")
        # 8. Robots: the reconstruction is not for search engines; the wrapper page is the indexed entry.
        new = re.sub(r"(<head[^>]*>)", r'\1\n<meta name="robots" content="noindex">', new, count=1, flags=re.I)
        # 9. Provenance: the source file, the export date, the original encoding, the changes.
        new = f"<!-- reconstructed {MADE} from {site['folder']}/{real} (hosting export of 2013-03-05, {enc}); changes: {', '.join(changed) or 'charset only'}; see /about/earlier-sites/{site['slug']}/ -->\n" + new
        return new, changed

    # Transform and write every page.
    for real in sorted(reachable_pages):  # each page
        text, enc = read_page(files[real])  # decoded
        new, changed = transform(real, text, enc)  # transformed
        dst = os.path.join(out_root, real)  # at the same relative path
        os.makedirs(os.path.dirname(dst), exist_ok=True)  # folders as needed
        with open(dst, "w", encoding="utf-8") as f: f.write(new)  # UTF-8
        title = re.search(r"<title>(.*?)</title>", new, re.I | re.S)  # the page's own title
        manifest["pages"].append({"path": real, "title": html.unescape(re.sub(r"\s+", " ", title.group(1)).strip()) if title else "", "encoding": enc, "changes": changed, "bytes": len(new.encode("utf-8"))})
        for c in changed: manifest["changes"][c] = manifest["changes"].get(c, 0) + 1  # per-page kinds counted per page

    # The reconstruction pages, in the old style: the never-published tools, the dead links, the form, the mirrors fallback.
    css = f"{prefix}{site['css']}"  # the site's own stylesheet

    def recon(title, body, path):
        """Write one reconstruction page (Portuguese, like the sites; marked as not part of the original)."""
        page = (f"<!-- reconstructed page, written {MADE}; not part of the original site; see /about/earlier-sites/{site['slug']}/ -->\n"
                f'<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="robots" content="noindex">\n<title>{html.escape(title)} :: reconstrução</title>\n'
                f'<link rel="stylesheet" href="{css}" type="text/css">\n<style>body{{margin:24px;font-family:Verdana,Arial,Helvetica,sans-serif;font-size:12px;color:#333}}h1{{font-size:14px;color:#1D3485}}p{{line-height:1.5}}</style>\n</head>\n<body bgcolor="#FFFFFF">\n{body}\n</body>\n</html>\n')
        dst = os.path.join(out_root, path); os.makedirs(os.path.dirname(dst), exist_ok=True)  # the path within the clone
        open(dst, "w", encoding="utf-8").write(page)  # written
    home_link = f'<p><a href="{prefix}{site["home"]}" target="_top">Página inicial da reconstrução</a> &middot; <a href="javascript:history.back()">Voltar</a></p>'  # the footer of every reconstruction page
    for p, kind in site["tools_missing"].items():  # the two tools the 2004 pages linked but never published
        if kind == "cidr":
            recon("Calculadora de sub-redes IP", f"<h1>Calculadora de sub-redes IP</h1><p>Este endereço (<code>/{p}</code>) era um link do site de 2004, mas a página nunca foi publicada: o Internet Archive registrou 404 em todas as tentativas de captura, e o arquivo não existe na exportação da hospedagem de 2013.</p><p>A calculadora que existe hoje: <a href=\"/tools/cidr\" target=\"_top\">ronutz.com/tools/cidr</a> (roda no seu navegador, nada é enviado).</p>{home_link}", p)
        elif kind == "pinout":
            recon("Pinagem de cabos", f"<h1>Pinagem de cabos</h1><p>Este endereço (<code>/{p}</code>) era um link do site de 2004, mas a página nunca foi publicada: o Internet Archive registrou 404 em todas as tentativas de captura, e o arquivo não existe na exportação da hospedagem de 2013. Em 2013 o site passou a apontar para uma página externa (ertyu.org).</p><p>O artigo que existe hoje: <a href=\"/learn/structured-cabling\" target=\"_top\">ronutz.com/learn/structured-cabling</a>.</p>{home_link}", p)
    for p, fact in site["dead"].items():  # the dead links: one page each, stating the archive's record
        recon("Página não publicada", f"<h1>Esta página não existia no servidor</h1><p>O site original tinha um link para <code>/{p}</code>, mas a página não estava no servidor: {html.escape(fact)}. O arquivo também não existe na exportação da hospedagem de 2013. O link foi mantido como estava; esta página explica o que acontecia ao clicar nele.</p>{home_link}", p)
    recon("Formulário", f"<h1>Este formulário não envia mais</h1><p>Em 2004 este formulário era processado por um CGI (FormMail.pl) no servidor da época. A reconstrução não executa programas no servidor e não envia nada.</p><p>Para falar com Rodolfo Nützmann hoje: <a href=\"/contact\" target=\"_top\">ronutz.com/contact</a>.</p>{home_link}", "_reconstruido/formulario.htm")
    recon("Página espelhada", f"<h1>Página de terceiros</h1><p>Em 2004 o site guardava cópias de algumas páginas de outros sites para consulta sem conexão. Essas páginas não são reproduzidas aqui; os links apontam para as versões originais no Internet Archive.</p>{home_link}", "_reconstruido/espelho.htm")
    # The manifest: next to the clone (for anyone reading the files) and under src/content (for the wrapper page).
    manifest["pageCount"] = len(manifest["pages"])  # the count
    os.makedirs(MANIFESTS, exist_ok=True)  # the content folder
    for dst in (os.path.join(out_root, "_reconstruido", "manifest.json"), os.path.join(MANIFESTS, f"{site['slug']}.json")):  # both copies
        with open(dst, "w", encoding="utf-8") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2); f.write("\n")  # UTF-8, indented, trailing newline
    print(f"{site['folder']}: {len(reachable_pages)} pages, {len(assets)} assets, {len(manifest['excluded'])} excluded files, {len(manifest['unresolved'])} unresolved references; changes {manifest['changes']}")
    return manifest


if __name__ == "__main__":  # run as a script
    for s in SITES: build_site(s)  # both sites
