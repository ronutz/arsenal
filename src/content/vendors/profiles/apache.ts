// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - httpd.apache.org/ABOUT_APACHE.html: development stalled after McCool left
//     NCSA mid-1994; Behlendorf and Skolnick set up the list with bandwidth and
//     disk donated by HotWired and Organic Online; eight core contributors by
//     end of February 1995; first public release 0.6.2 in April 1995; AND that
//     NCSA restarted its own development in the same period, with two of its
//     server team joining the Apache list in March as HONORARY MEMBERS so the
//     two projects could share ideas and fixes
//   - Cybercultural: Robert Thau's new server architecture, code-named
//     Shambhala, introducing a modular structure, an API for extensibility and
//     pool-based memory allocation
//   - Grokipedia and apache.org: Apache 1.0 on 1 December 1995; ASF
//     incorporated 1 June 1999 as a Delaware 501(c)(3) with 21 founders; the
//     Apache License 1.0 carrying an advertising clause, superseded by 2.0;
//     300+ active projects and 9,900+ volunteer committers today
//
// *** BODY READ AFTER DRAFTING (third run of the inverted order). The body
// already covers the founding, the eight names, the name dispute in both
// versions, the ASF's purpose and Fielding's later work on HTTP/1.1 and REST.
// It does NOT have Shambhala or the NCSA cooperation, which is what this adds.
// ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const apacheProfile: VendorProfile = {
  slug: "apache",
  foundings: [
    {
      company: "The Apache Group",
      year: 1995,
      place: "the internet, coordinated from the California Bay Area",
      founders: [],
      story:
        "Not a company and not, at the start, a project - a mailing list for people who each had a fix for the same abandoned server and nowhere to put it. The problem it solved first was organisational rather than technical: the code worked, the patches existed, and there was no route from one to the other.",
    },
    {
      company: "The Apache Software Foundation",
      year: 1999,
      place: "Delaware",
      founders: ["twenty-one members of the Apache Group"],
      story:
        "Twenty-one founders, incorporating to hold intellectual property and trademarks. The organisation was built to solve the problem that had created it, which is a tidier piece of engineering than most software.",
    },
  ],
  timeline: [
    { year: 1994, title: "The maintainer leaves", detail: "Rob McCool departs NCSA for Netscape, and the most-used web server on the internet stops being maintained while remaining the most-used web server on the internet." },
    {
      year: 1995,
      title: "The other side joins in",
      detail:
        "NCSA restarted its own server development in the same months, and two of its team joined the Apache list in March as honorary members so the two projects could exchange fixes. The fork and the original cooperated rather than competed, which is not how this usually goes.",
    },
    { year: 1999, title: "The foundation", detail: "The structure the other three hundred projects were later hung on." },
  ],
  products: [
    { name: "Apache HTTP Server", what: "The project everything else is named after, and for twenty years the default answer to what is serving this page." },
    { name: "The module API", what: "The extension mechanism, and the reason the server outlived its own design decisions - encryption, scripting languages and URL rewriting all arrived as modules written by people outside the core group." },
    { name: "The Apache License", what: "Version 1.0 carried an advertising clause requiring acknowledgement in promotional material; version 2.0 dropped it and added an explicit patent grant, which is why it is the default permissive licence for corporate contribution today." },
    { name: "The Apache Software Foundation", what: "Now stewarding three hundred or more projects with several thousand volunteer committers - a legal and governance structure offered to projects that need one, which is a product in every sense that matters." },
  ],
  innovations: [
    {
      title: "Shambhala: rewriting the thing that worked",
      detail:
        "Robert Thau's new architecture replaced the patched NCSA core with a modular structure, an extension API and pool-based memory allocation. That is the decision the project's next twenty years rest on: a server whose capabilities could be added by strangers without touching the core. Every module anybody remembers was written by somebody who was not in the original eight.",
    },
    {
      title: "Cooperating with the code you forked",
      detail:
        "When the original maintainers came back, both sides shared fixes rather than diverging. Software history is full of forks that hardened into rivalries, and the counterexample is worth recording because it was a choice rather than an accident.",
    },
    {
      title: "A foundation as succession planning",
      detail:
        "The ASF exists so that the departure of any contributor changes nothing structural - the same failure that produced Apache in the first place. Incorporating to make yourself unnecessary is an unusual thing for founders to do, and it is why the organisation now hosts projects that have nothing to do with web servers.",
    },
    {
      title: "The permissive licence as an invitation",
      detail:
        "Allowing commercial use without requiring reciprocity brought in the companies that a copyleft licence would have kept out. That is the trade the licence makes, and the argument against it is real: a great deal of Apache-licensed work now runs inside products that contribute nothing back. Both halves of that are true at once.",
    },
  ],
  markets: [
    "For most of two decades, the web itself - and still an enormous installed base, though nginx and the cloud providers' own load balancers now take much of the new deployment. The server's decline is not a collapse but a market that grew around it.",
    "The foundation's own position is different and stronger: it is where a corporate-sponsored project goes to become credibly independent, which is a service with almost no competitors.",
  ],
  analyst: [
    "There is no vendor here to assess, which is the point of the arrangement. What can be measured is durability: a codebase that began as patches to abandoned software is still in production thirty years later, and the organisation built around it now stewards several hundred other projects.",
    "The lasting contribution is arguably not the server at all. Several of the original eight went on to write the specifications the web runs on, and the governance model the foundation invented has been copied by nearly every large open-source project since - including by companies that would never have released anything without a neutral structure to release it into.",
  ],
};
