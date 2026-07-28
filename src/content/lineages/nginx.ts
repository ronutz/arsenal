// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/content/lineages/nginx.ts
// ----------------------------------------------------------------------------
// NGINX corporate lineage.
//
// This one does not fit the shape of the others, and the file says so rather
// than forcing it. Extreme and Check Point are stories of companies BUYING;
// NGINX is a story of one person's side project becoming a company, being
// BOUGHT, and then being forked twice by people who did not like where it
// went. There is exactly one acquisition in it, and NGINX is the target.
//
// So the `acquisitions` array below is used for the events that changed who
// OWNED OR CONTROLLED the software, which is what a lineage is actually
// tracking. Each entry says plainly which direction it ran. The alternative -
// a page with one row on it - would have been tidier and less true.
//
// The Rambler dispute is included because it is not gossip: it is a claim on
// the ownership of the codebase itself, made by a former employer, six months
// after the sale. Whatever one thinks of the merits, it belongs in a record of
// who has claimed to own this software.
// ============================================================================

import type { VendorLineage } from "./f5";

export const nginxLineage: VendorLineage = {
  key: "nginx",
  name: "NGINX (F5, Inc.)",
  tagline:
    "One system administrator's answer to a scaling problem, released for free, that ended up running a quarter of the web and selling for $670 million.",

  founded: {
    year: 2002,
    dateText: "2002 (first public release 2004)",
    place: "Moscow, Russia",
    asName: "nginx",
    founder: "Igor Sysoev",
  },

  names: [
    {
      name: "nginx (the project)",
      from: "2004",
      note: "Released as free software under a BSD licence. No company, no funding, no support contract - just the source.",
    },
    {
      name: "Nginx, Inc.",
      from: "2011",
      note: "Registered by Sysoev with Maxim Konovalov after Sysoev left Rambler. The open-source project continued alongside commercial products.",
    },
    {
      name: "NGINX, part of F5",
      from: "2019",
      note: "The brand was kept after the acquisition and the founders stayed on as executives.",
    },
  ],

  origin:
    "Igor Sysoev began writing it in 2002 while working as a system administrator at the Russian portal Rambler, in his own time. The problem was concurrency: serving many simultaneous connections without a process or thread for each, which is what the servers of the day did. His answer was an event-driven architecture, and the first public release followed in 2004 under a BSD licence.",

  acquisitions: [
    {
      year: 2011,
      name: "Nginx, Inc. is founded (no acquisition)",
      price: "n/a",
      what: "Sysoev left Rambler and registered a company with Maxim Konovalov, seven years after the software was already widely deployed. Over the following years it raised more than $100M across several rounds.",
      became:
        "NGINX Plus, the commercial build, alongside the open-source project. Gus Robertson joined in 2013 and was chief executive by the time of the sale.",
      sourceNote:
        "Included because it changed who controlled the software - from an individual to a funded company - which is what this list tracks.",
    },
    {
      year: 2019,
      name: "F5 Networks acquires NGINX",
      price: "$670M",
      what: "The one acquisition in this lineage, and NGINX is the target rather than the buyer. Reported revenue was around $26M in 2018, so the price was a substantial multiple.",
      became:
        "NGINX Plus and the modern F5 application-services portfolio. The brand was kept, and Sysoev, Konovalov and Robertson all stayed on.",
      sourceNote:
        "Announced March 2019; some sources date completion to May. Both refer to the same transaction.",
    },
    {
      year: 2019,
      name: "Rambler claims ownership of the codebase",
      price: "n/a",
      what: "Six months after the sale, Sysoev's former employer asserted that the source code belonged to it, because he had been a Rambler system administrator when he wrote the early versions. A criminal copyright case followed, with police searches of the founders' homes and the Moscow office in December 2019. Sysoev has never disputed writing it while employed there - his position is that he did so in his own time, and that Rambler raised nothing for fifteen years.",
      became:
        "Nothing, in the end. Sberbank, which held 46.5% of Rambler, called an extraordinary board meeting asking management to have the case dropped and to talk to F5 instead.",
      sourceNote:
        "Included because it is a claim on the ownership of the software itself, made by a former employer immediately after a large sale - which belongs in a record of who has claimed to own this code.",
    },
    {
      year: 2022,
      name: "Sysoev leaves; the Moscow office closes",
      price: "n/a",
      what: "In January 2022 Sysoev left NGINX and F5, stated as being to spend time with family and pursue personal projects. Weeks later, F5 closed its Moscow office following the invasion of Ukraine.",
      became:
        "The project continued under F5 without its author, and the centre of gravity moved out of Russia permanently.",
    },
    {
      year: 2024,
      name: "freenginx forks the project",
      price: "n/a",
      what: "Long-time core developer Maxim Dounin forked the codebase, stating that F5 had disregarded the project's own policy and the position of its developers. A separate Russian fork, Angie, had already appeared under the vendor Web Server.",
      became:
        "Two independent descendants of the original codebase, both open source. A lineage that produces forks is a lineage where control is contested, and both of these came from the same disagreement about who decides.",
    },
  ],

  asOf: "July 2026",

  sources: [
    {
      label: "Wikipedia: Igor Sysoev (dates, the 2019 detention, the 2022 departure)",
      url: "https://en.wikipedia.org/wiki/Igor_Sysoev",
    },
    {
      label: "Meduza: Rambler's claim to exclusive rights, six months after the sale",
      url: "https://meduza.io/en/feature/2019/12/13/what-s-yours-is-ours",
    },
    {
      label: "Meduza: Konovalov interview on the litigation and the company's 2011 registration",
      url: "https://meduza.io/en/feature/2019/12/13/a-typical-racket-simple-as-that",
    },
    {
      label: "The Register: the freenginx fork, the Moscow office closure, and Angie",
      url: "https://www.theregister.com/2024/02/16/freenginx_fork/",
    },
  ],
};
