// ============================================================================
// NCSA - the campus lab that made the web visible. Knowledge-based, dates
// well-documented (2026-07-16): founded 1986 at the University of Illinois
// Urbana-Champaign (from Larry Smarr's 1983 "Black Proposal", one of the
// original NSF supercomputing centers). NCSA Telnet gave campuses free
// TCP/IP. Mosaic: Andreessen + Bina, first X release early 1993, Mac/Windows
// later that year - inline images and the visual web; licensed to Spyglass
// 1994, whence Internet Explorer. Andreessen leaves for Mosaic
// Communications (Apr 1994) -> Netscape (cross-links the Netscape profile).
// NCSA httpd (Rob McCool, 1993) dominates early servers and originates CGI;
// when development stalls, its patch community becomes the Apache HTTP
// Server (1995). Blue Waters 2012; NCSA remains active.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const ncsaProfile: VendorProfile = {
  slug: "ncsa",
  foundings: [
    {
      company: "National Center for Supercomputing Applications",
      year: 1986,
      place: "University of Illinois Urbana-Champaign",
      founders: ["Larry Smarr (founding director; from the 1983 'Black Proposal')"],
      story:
        "Larry Smarr's unsolicited 1983 proposal to the NSF - bound in black, arguing American scientists should not have to fly to Europe for supercomputer time - won Urbana-Champaign one of the original national supercomputing centers. The supercomputers mattered; the side projects changed the world: a free Telnet that put TCP/IP on every campus desktop, a web server whose orphaned patches became Apache, and a student-built browser called Mosaic that made the internet something you could SEE.",
    },
  ],
  timeline: [
    { year: 1987, title: "NCSA Telnet", detail: "Free TCP/IP terminal software for Macs and PCs spreads the internet across campuses years before commercial stacks - for a generation of students, NCSA Telnet WAS the network." },
    { year: 1993, title: "Mosaic", detail: "Marc Andreessen and Eric Bina release Mosaic - the browser with inline images, installable by mortals, on Unix and then Mac and Windows. The web stops being a text protocol for physicists and becomes a place. Usage explodes within months.", sourceNote: "First X Window release early 1993; Mac and Windows ports later that year." },
    { year: 1993, title: "httpd and CGI", detail: "Rob McCool's NCSA httpd becomes the dominant early web server, and its Common Gateway Interface defines how the web runs programs - the form-submits-to-script pattern every web application descends from." },
    { year: 1994, title: "The talent leaves, twice", detail: "Andreessen departs to co-found what becomes Netscape (taking much of the Mosaic team); the university licenses Mosaic to Spyglass, whose code Microsoft licenses for Internet Explorer - both branches of the browser wars trace to the same Urbana lab." },
    { year: 1995, title: "Apache", detail: "With McCool gone, httpd development stalls; the webmasters maintaining a shared set of patches organize as the Apache Group and ship the Apache HTTP Server - born from NCSA code, it dominates the web's servers for the next two decades." },
    { year: 2012, title: "Still a supercomputing center", detail: "Blue Waters comes online - NCSA continuing its actual charter, petascale science, while its accidental 1993 legacy runs on several billion screens." },
  ],
  products: [
    { name: "NCSA Mosaic", what: "The browser that made the web visual - the common ancestor, via people and via licenses, of both Netscape and Internet Explorer." },
    { name: "NCSA httpd and CGI", what: "The early web's dominant server and its program-execution interface - the direct ancestor of Apache." },
    { name: "NCSA Telnet", what: "The free TCP/IP client that networked a generation of campuses." },
  ],
  innovations: [
    { title: "The visual web", detail: "Inline images, a friendly UI, ports for ordinary computers - Mosaic's contribution was not a protocol but ACCESS, and access is what made the web an industry." },
    { title: "Open code as infrastructure", detail: "Telnet, httpd, Mosaic - all freely distributed from a public university; the Apache lineage in particular made 'the community maintains the server' a founding norm of the web." },
  ],
  markets: [
    "NCSA never sold products - it seeded markets: the browser industry, the web-server ecosystem, and the pattern of university code becoming world infrastructure.",
  ],
  analyst: [
    "Alongside RAND, the second research institution among these pioneers - RAND imagined the packets, NCSA gave them a face. The Netscape page on this site is the sequel to this one.",
  ],
};
