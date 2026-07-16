// ============================================================================
// NETSCAPE - the company that opened the web. Knowledge-based, dates
// well-documented (2026-07-16): founded April 1994 as Mosaic Communications
// by Jim Clark (post-SGI) + Marc Andreessen (NCSA Mosaic); renamed Netscape
// Nov 1994; Navigator ships late 1994; IPO August 9, 1995 (priced $28,
// touched ~$75 day one - the starting gun of the dot-com era); SSL designed
// at Netscape (SSLv2 shipped 1995; SSLv3 1996 -> TLS); JavaScript (Brendan
// Eich, 1995); the HTTP cookie (Lou Montulli, 1994); browser wars vs
// Microsoft IE; source opened as Mozilla March 31, 1998; AOL acquisition
// announced Nov 24, 1998, completed March 17, 1999 (stock deal ~$4.2B at
// announcement, ~$10B at close); Mozilla Foundation 2003 -> Firefox.
// SITE RELEVANCE: SSL/TLS + cookies + JS = this site's daily subject matter.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const netscapeProfile: VendorProfile = {
  slug: "netscape",
  foundings: [
    {
      company: "Netscape (founded as Mosaic Communications)",
      year: 1994,
      place: "Mountain View, California",
      founders: ["Jim Clark", "Marc Andreessen"],
      story:
        "Jim Clark, fresh from Silicon Graphics, found the 22-year-old who had built NCSA Mosaic and asked what he wanted to do next. Mosaic Communications - quickly renamed Netscape - shipped Navigator in late 1994, and the web stopped belonging to universities. No company in this section matters more to this site's daily work: SSL, the ancestor of every TLS handshake the tools here decode, was designed at Netscape; so were JavaScript and the HTTP cookie. Fifty-one months from founding to acquisition, and the world on the other side was not the same one.",
    },
  ],
  timeline: [
    { year: 1994, title: "Navigator - and the cookie", detail: "The browser ships and immediately owns the young web; the same year, Lou Montulli invents the HTTP cookie so a shopping cart can remember itself - state for a stateless protocol, and a privacy debate that never ended." },
    { year: 1995, title: "The IPO that started an era", detail: "August 9, 1995: priced at $28, touching about $75 on day one - the moment Wall Street discovered the internet. The same year ships SSLv2 (Kipp Hickman's design) and Brendan Eich's ten-day language, JavaScript." },
    { year: 1996, title: "SSLv3: the ancestor of TLS", detail: "Paul Kocher and Netscape's engineers rebuild SSL properly; SSLv3 becomes the direct basis of IETF TLS 1.0 (1999) - the protocol family every certificate, cipher, and handshake tool on this site exists to explain." },
    { year: 1997, title: "The browser war turns", detail: "Internet Explorer, bundled free with Windows, grinds Navigator's share down release by release - the fight that becomes the centerpiece of United States v. Microsoft." },
    { year: 1998, title: "Mozilla: opening the source", detail: "March 31, 1998: Netscape releases its browser source - the act that coins 'open source' as a movement's name and, through the Mozilla Foundation (2003), eventually yields Firefox." },
    { year: 1999, title: "AOL closes", detail: "March 17, 1999: AOL completes the all-stock acquisition (announced at ~$4.2 billion, worth roughly $10 billion by close as AOL stock climbed); the Netscape brand fades, the inventions - TLS, JavaScript, the cookie - run everything.", sourceNote: "Announced November 24, 1998; values per the deal record." },
  ],
  products: [
    { name: "Navigator", what: "The browser that took the web mainstream - at its 1996 peak, the way most of the world saw the internet." },
    { name: "SSL", what: "Secure Sockets Layer, designed in-house: the ancestor of TLS and of every padlock icon since." },
    { name: "JavaScript", what: "Eich's ten-day scripting language - today the most widely deployed programming language on earth." },
  ],
  innovations: [
    { title: "Transport security for everyone", detail: "SSL made encryption a default expectation of the web rather than a specialist add-on - the single most consequential security decision of the era, and this site's bread and butter." },
    { title: "The programmable page", detail: "JavaScript and the cookie turned documents into applications - the entire web-app world, this PWA included, descends from those two 1994-95 inventions." },
  ],
  markets: [
    "Netscape's market was taken; its technologies won totally - TLS secures the internet, JavaScript runs it, the cookie tracks it, and Firefox carries the source-code lineage forward.",
  ],
  analyst: [
    "The defining vendor of the first browser evaluations and the canonical case, cited in the antitrust record itself, of platform bundling deciding a product war.",
  ],
};
