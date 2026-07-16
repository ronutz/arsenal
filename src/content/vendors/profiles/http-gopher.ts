// ============================================================================
// HTTP & GOPHER - the web's protocol and the rival it eclipsed. Knowledge-
// based, dates well-documented (2026-07-17): Berners-Lee's March 1989 CERN
// proposal (Sendall's "vague, but exciting"); first server + browser on
// NeXT by Christmas 1990; HTTP/0.9 one-line GET; public announcement on
// alt.hypertext August 6, 1991. Gopher released spring 1991 at the
// University of Minnesota (McCahill, Anklesaria, Lindner, Torrey, Alberti);
// Veronica search 1992 (U Nevada Reno), Jughead 1993. Spring 1993: UMN
// announces licensing fees for commercial Gopher servers; April 30, 1993:
// CERN places web technology royalty-free in the public domain - the
// licensing natural experiment. Mosaic 1993 (see the NCSA profile). Web
// traffic passes Gopher on the NSFNET backbone 1994-95. HTTP/1.0 RFC 1945
// (1996); HTTP/1.1 RFC 2068 (1997) -> RFC 2616 (1999); Fielding's REST
// dissertation 2000; UMN GPLs Gopher 2000. HTTP/2 RFC 7540 (2015, from
// SPDY); HTTP/3 over QUIC RFC 9114/9000 (2022). SourceNotes anchor the
// document-specific claims.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const httpGopherProfile: VendorProfile = {
  slug: "http-gopher",
  foundings: [
    {
      company: "HTTP and the World Wide Web",
      year: 1989,
      place: "CERN, Geneva, Switzerland",
      founders: ["Tim Berners-Lee", "Robert Cailliau (co-author of the 1990 proposal)"],
      story:
        "In March 1989 Tim Berners-Lee circulated a memo at CERN proposing a hypertext system for keeping track of the laboratory's information; his manager Mike Sendall wrote 'vague, but exciting' in the margin and let him build it. By Christmas 1990 a NeXT workstation was running the first web server and the first browser, speaking HTTP/0.9 - a protocol so small it was one line: GET, a path, a document back, connection closed. The project was announced to the world on the alt.hypertext newsgroup on August 6, 1991. The web's founding insight was radical simplicity: URLs, HTML, and HTTP were each minimal enough to reimplement in a weekend - which is exactly what a planet of programmers proceeded to do.",
    },
    {
      company: "Gopher",
      year: 1991,
      place: "University of Minnesota, Minneapolis",
      founders: ["Mark P. McCahill", "Farhad Anklesaria", "Paul Lindner", "Daniel Torrey", "Bob Alberti"],
      story:
        "Weeks before the web's announcement, the University of Minnesota released Gopher - a campus information system organized as menus rather than hypertext, light enough for the text terminals and modems of 1991, and named for the school's mascot. For two years it looked like the future: gopherspace grew explosively, clients existed for every platform, and with Veronica in 1992 it had real search before the web had any. Gopher was, by most practical measures of the moment, the better-organized system - which is what makes what happened next the industry's most-cited lesson.",
    },
  ],
  timeline: [
    { year: 1991, title: "Two futures ship", detail: "Gopher (spring, Minnesota) and the web (August 6 announcement, CERN) arrive months apart. Gopher's menus are instantly practical on the terminals people actually have; the web's hypertext is harder to see the point of - until screens, and then browsers, catch up.", sourceNote: "alt.hypertext announcement, August 6, 1991." },
    { year: 1992, title: "Veronica", detail: "Gopherspace gets a search engine - built at the University of Nevada, Reno - before the web has anything comparable; Jughead follows in 1993. For a moment, the menu world is the searchable one." },
    { year: 1993, title: "Minnesota asks for money", detail: "In the spring, the university announces licensing fees for commercial use of the Gopher server. Nothing about the protocol changes - but the community's chill is immediate, famous, and terminal. Adoption decisions being made that season quietly flip.", sourceNote: "University of Minnesota licensing announcement, spring 1993 - among the most-documented licensing decisions in internet history." },
    { year: 1993, title: "CERN gives the web away", detail: "April 30, 1993: CERN places the web's technology royalty-free into the public domain - anyone may build on it, forever, for nothing. Paired with Minnesota's move weeks earlier, it is the cleanest natural experiment in protocol economics ever run; the results arrived within eighteen months.", sourceNote: "CERN public-domain declaration, April 30, 1993 (document preserved by CERN)." },
    { year: 1993, title: "Mosaic makes it visual", detail: "NCSA's browser puts images inline with text and installs in minutes - the web stops being an idea and becomes a place (that story is told in this encyclopedia's NCSA profile). Gopher's clean menus suddenly look like a directory listing next to a magazine." },
    { year: 1995, title: "The crossing", detail: "Web traffic passes Gopher on the NSFNET backbone during 1994-95 and never looks back; Netscape ships, SSL brings HTTPS, and commercial gopherspace plateaus into a long, quiet fade." },
    { year: 1999, title: "HTTP grows up", detail: "HTTP/1.0 (RFC 1945, 1996) formalizes what everyone was doing; HTTP/1.1 (RFC 2068 in 1997, refined as RFC 2616 in 1999) adds persistent connections, chunked transfer, and the Host header - the single header that made name-based virtual hosting, and thus affordable mass web hosting, economically possible. Roy Fielding's 2000 dissertation names the architectural style: REST.", sourceNote: "RFC 1945 (1996), RFC 2068 (1997), RFC 2616 (1999); Fielding dissertation (2000)." },
    { year: 2000, title: "Gopher's GPL epilogue", detail: "The University of Minnesota relicenses Gopher under the GPL - gracious, correct, and seven years too late. A small gopherspace persists to this day, maintained by people who remember." },
    { year: 2015, title: "HTTP/2", detail: "RFC 7540, grown from Google's SPDY: binary framing, multiplexing, header compression - the first wire-format break in the protocol's history, carrying the same request semantics underneath.", sourceNote: "RFC 7540, May 2015." },
    { year: 2022, title: "HTTP/3 over QUIC", detail: "RFC 9114 over RFC 9000: the transport itself is replaced - UDP-based QUIC with TLS built in - while the semantics above survive intact. The lineage this site's WAF-over-QUIC material picks up in the present tense.", sourceNote: "RFC 9000 (2021) / RFC 9114 (2022)." },
  ],
  products: [
    { name: "HTTP/0.9 through HTTP/3", what: "From a one-line GET to a multiplexed, encrypted, UDP-transported protocol - four transport generations under one set of request semantics, which is why a 1990s URL can still resolve." },
    { name: "URLs, HTML, and the royalty-free web", what: "The trio's openness was the product: minimal specifications, free forever by declaration, implementable by anyone in days." },
    { name: "Gopher and Veronica", what: "The menu-structured information space and its search engine - the best pre-web system, and the standing proof that better-organized is not the same thing as winning." },
  ],
  innovations: [
    { title: "Radical simplicity as strategy", detail: "HTTP/0.9 could be implemented in an afternoon, and that low floor recruited the largest implementer base in protocol history. Complexity came later, after ubiquity - the order matters." },
    { title: "The Host header", detail: "One HTTP/1.1 field let a single IP address serve a thousand names - arguably the most commercially consequential header ever shipped, and the quiet foundation of the shared-hosting economy." },
    { title: "Licensing as fate", detail: "Spring 1993, one decision each way: Minnesota asked for fees, CERN declared the web free forever. Every open-source strategy debate since has cited the outcome, usually within the first five minutes." },
  ],
  markets: [
    "Everything, eventually: publishing, commerce, software distribution, and then applications themselves - the progressive web app this site ships over HTTPS included. Gopher survives as a small, affectionately maintained hobbyist space.",
  ],
  analyst: [
    "Gopher did not lose on technology - it lost on governance. The generalized lesson has held for three decades: when the prize is a network effect, open and unencumbered beats organized and owned.",
    "HTTP is the rare protocol that replatformed its own transport twice (TCP text to binary framing to QUIC) without breaking its semantics - a masterclass in evolving the wire while honoring the contract.",
    "For this site the pairing is load-bearing: HTTP is the substrate of every tool here, and the QUIC chapter is current, working material - see the WAF-over-QUIC article in Learn.",
  ],
};
