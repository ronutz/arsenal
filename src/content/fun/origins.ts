// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/content/fun/origins.ts
// ----------------------------------------------------------------------------
// THE SOURCES BEHIND EACH GAME'S "WHERE IT COMES FROM" (PRIME 06/11/2026
// 13:01: "For the games and puzzles, cite inspirations, roots and origins,
// folklore if any, other famous implementations, etc."). The paragraphs are in
// the message packs (devFun.games.<game>.origins, en and pt-BR); this file
// holds what is not translated: each source's title, publisher and address,
// the day it was read, and the glossary entries on this site that say more.
// Every claim in the paragraphs rests on a source listed here, read on the day
// given; GameOrigins.tsx renders both.
//
// Reading notes kept out of the paragraphs on purpose: the Hidato inventor
// (the page could not be read directly), Gauss's 1850 letter (popular accounts
// of it are unreliable), the moth's exact day (the Navy and the Smithsonian
// disagree on the year as well), the first phishing post (two newsgroups are
// claimed), and who "invented" whac-a-mole (Fechter and Bob's Space Racers
// tell it differently, so the text gives both).
// ============================================================================

/** One source a game's paragraphs rest on. */
export interface OriginSource {
  /** Its title, as the source gives it. */
  title: string;
  /** Who publishes it. */
  publisher: string;
  /** Its address. */
  url: string;
  /** The day it was read for this page, YYYY-MM-DD. */
  accessed: string;
}

/** A game's sources and the glossary entries that say more. */
export interface GameOriginsEntry {
  /** The sources, in the order the paragraphs use them. */
  sources: OriginSource[];
  /** Glossary slugs on this site (a slug that does not exist is skipped). */
  glossary: string[];
}

/** The day every source below was read. */
const READ = "2026-11-06";

/**
 * One source, read on READ.
 *
 * @param title its title, as the source gives it
 * @param publisher who publishes it
 * @param url its address
 * @returns the source
 */
function src(title: string, publisher: string, url: string): OriginSource {
  // The day is the same for all of them.
  return { title, publisher, url, accessed: READ };
}

/** Each game's entry, by its id. */
export const GAME_ORIGINS: Record<string, GameOriginsEntry> = {
  // Access Points: eight queens, Star Battle, Two Not Touch, LinkedIn Queens.
  "access-points": {
    sources: [
      // Bezzel 1848 ("Schachfreund") and Nauck's 92.
      src("Algorithms, chapter 2: Backtracking", "Jeff Erickson, University of Illinois", "https://jeffe.cs.illinois.edu/teaching/algorithms/book/02-backtracking.pdf"),
      // The 12 distinct solutions.
      src("Queens Problem", "Wolfram MathWorld", "https://mathworld.wolfram.com/QueensProblem.html"),
      // Star Battle: Eendebak, WPC 2003 in Arnhem, Cattle, the rules.
      src("Star Battle Rules and Info", "GM Puzzles", "https://www.gmpuzzles.com/blog/?p=350"),
      // Two Not Touch in The New York Times from 20 April 2020.
      src("Two Not Touch puzzles in the New York Times", "KrazyDad", "https://blog.krazydad.com/?p=2169"),
      // LinkedIn's three games, 1 May 2024.
      src("LinkedIn now has games to play on-site as you job hunt", "Game Developer", "https://gamedeveloper.com/business/linkedin-launches-three-games-to-play-while-job-hunting"),
      // Queens' rules.
      src("LinkedIn just added 3 games to add to your daily routine", "FOX 10 Phoenix", "https://www.fox10phoenix.com/news/linkedin-games-pinpoint-queens-crossclimb"),
      // Queens as a simplified Star Battle; Snyder's first puzzles.
      src("Star Battle by Thomas Snyder", "GM Puzzles", "https://www.gmpuzzles.com/blog/?p=28808"),
    ],
    // Wireless coverage and interference.
    glossary: ["wifi", "co-channel-interference", "wifi-site-survey"],
  },
  // Bit Balance: Binairo, Tic-Tac-Logic, Takuzu, 0h h1, LinkedIn Tango.
  "bit-balance": {
    sources: [
      // The first Binairo, summer 2009.
      src("Even and Odd Binairo", "PeterFrank", "https://www.peterfrank.be/Puzzles/frmBinairoStart.aspx"),
      // Binairo's classic rules.
      src("Binairo", "PeterFrank", "https://www.peterfrank.be/puzzles/frmBinairo.aspx"),
      // PeterFrank's founders.
      src("Baffling Binary Puzzles", "Charlesbridge", "https://www.charlesbridge.com/products/baffling-binary-puzzles"),
      // Zanellati, PeterFrank at the same time, Takuzu.
      src("Tic-Tac-Logic history", "Conceptis", "https://www.conceptispuzzles.com/index.aspx?uri=puzzle/tic-tac-logic/history"),
      // 0h h1 by Martin Kool and Q42.
      src("0h h1", "Q42", "https://0hh1.com/"),
      // Tango, 7 October 2024.
      src("LinkedIn Announces Tango: Our 4th Thinking-Oriented Game, Plus New Feature Enhancements", "LinkedIn Pressroom", "https://news.linkedin.com/2024/October/linkedin-announces-tango-"),
      // Tango's rules: suns, moons, = and X.
      src("Tango by LinkedIn", "Coolmath Games", "https://www.coolmathgames.com/0-tango-by-linkedin"),
      // Tango evolved from Binairo-type games.
      src("A perfectly innocuous blog post about Tango", "GM Puzzles", "https://www.gmpuzzles.com/blog/?p=32110"),
    ],
    // The unit the grid holds.
    glossary: ["bit"],
  },
  // Patch Path: LinkedIn Zip, Numberlink, Hamiltonian paths, the knight's tour.
  "patch-path": {
    sources: [
      // Zip, 18 March 2025.
      src("LinkedIn Announces Zip: Our 5th Thinking-Oriented Game, Plus New Feature Enhancements", "LinkedIn Pressroom", "https://news.linkedin.com/2025/linkedin-announces-zip-"),
      // Zip's rules.
      src("Introducing Zip", "GM Puzzles", "https://www.gmpuzzles.com/blog/2025/03/introducing-zip"),
      // Numberlink's rule.
      src("Numberlink", "Nikoli", "https://www.nikoli.co.jp/en/puzzles/numberlink/"),
      // The knight's tour as the earliest Hamiltonian path.
      src("Hamiltonian paths and circuits", "John Stalker, Trinity College Dublin", "https://www.maths.tcd.ie/~stalker/22C00/notes/7.11-hamiltonian-paths-and-circuits.html"),
      // al-Adli ar-Rumi.
      src("Puzzles", "MacTutor History of Mathematics, University of St Andrews", "https://mathshistory.st-andrews.ac.uk/Projects/MacQuarrie/chapter-3/"),
    ],
    // The panel the cable runs through.
    glossary: ["patch-panel"],
  },
  // Spanning Tree: Perlman 1985, Algorhyme, 802.1D, 802.1w, RFC 6325.
  "spanning-tree": {
    sources: [
      // The paper and the poem.
      src("An Algorithm for Distributed Computation of a Spanning Tree in an Extended LAN", "Radia Perlman, SIGCOMM '85 (scan at Northeastern University)", "https://prl.khoury.northeastern.edu/img/p-sigcomm-1985.pdf"),
      // Its record: September 1985.
      src("An algorithm for distributed computation of a spanningtree in an extended LAN", "ACM SIGCOMM Computer Communication Review 15(4)", "https://doi.org/10.1145/318951.319004"),
      // 802.1D-1990, approved 31 May 1990.
      src("IEEE 802.1D-1990", "IEEE Standards Association", "https://standards.ieee.org/ieee/802.1D/1028/"),
      // 802.1w-2001.
      src("IEEE 802.1w-2001", "IEEE Standards Association", "https://standards.ieee.org/ieee/802.1w/1046/"),
      // 802.1w incorporated into 802.1D-2004.
      src("802.1w - Rapid Reconfiguration of Spanning Tree", "IEEE 802.1 Working Group", "https://grouper.ieee.org/groups/802/1/pages/802.1w.html"),
      // Algorhyme V2.
      src("RFC 6325: Routing Bridges (RBridges): Base Protocol Specification", "RFC Editor", "https://www.rfc-editor.org/rfc/rfc6325"),
    ],
    // The protocol, its author and what it prevents.
    glossary: ["radia-perlman", "spanning-tree", "stp", "rstp", "bpdu", "broadcast-storm"],
  },
  // First Match: screend 1989, Cisco ACLs, programming puzzles.
  "first-match": {
    sources: [
      // Mogul's screend: rules in order, a default action.
      src("Simple and Flexible Datagram Access Controls for Unix-based Gateways (WRL Research Report 89/4)", "Digital Equipment Corporation Western Research Laboratory (Bitsavers mirror)", "https://ftp.mirrorservice.org/sites/www.bitsavers.org/pdf/dec/tech_reports/WRL-89-4.pdf"),
      // First match and the implicit deny.
      src("IP Access List Overview", "Cisco", "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/sec_data_acl/configuration/15-s/sec-data-acl-15-s-book/sec-access-list-ov.html"),
      // TIS-100.
      src("TIS-100", "Zachtronics", "https://zachtronics.com/tis-100"),
      // Human Resource Machine.
      src("Human Resource Machine", "Tomorrow Corporation", "https://tomorrowcorporation.itch.io/human-resource-machine"),
    ],
    // Access lists and the filters around them.
    glossary: ["acl", "wildcard-mask", "packet-filter", "firewall"],
  },
  // Prefix of the Day: Wordle, CIDR.
  "prefix-of-the-day": {
    sources: [
      // Wordle: October 2021, six tries, the purchase.
      src("'The New York Times' buys Wordle", "NPR", "https://www.npr.org/2022/01/31/1077089945/nyt-wordle"),
      // One game per day.
      src("He made Wordle for his partner. Now it's an online hit.", "Boston.com (The New York Times)", "https://www.boston.com/news/national-news/2022/01/04/he-made-wordle-for-his-partner-now-its-an-online-hit/"),
      // CIDR, September 1993.
      src("RFC 1519: Classless Inter-Domain Routing (CIDR): an Address Assignment and Aggregation Strategy", "RFC Editor", "https://www.rfc-editor.org/rfc/rfc1519"),
      // CIDR today, and the /24 example.
      src("RFC 4632: Classless Inter-domain Routing (CIDR): The Internet Address Assignment and Aggregation Plan", "RFC Editor", "https://www.rfc-editor.org/rfc/rfc4632"),
    ],
    // The arithmetic of the day's address.
    glossary: ["cidr", "subnet", "broadcast", "longest-prefix-match"],
  },
  // Aggregate: 2048, Threes, route aggregation.
  aggregate: {
    sources: [
      // 2048's credits and its merge rule.
      src("2048", "Gabriele Cirulli", "https://gabrielecirulli.github.io/2048/"),
      // Released in March 2014.
      src("19-year-old makes viral game hit in a weekend", "CNBC", "https://www.cnbc.com/2014/03/26/19-year-old-makes-viral-game-hit-in-a-weekend.html"),
      // Threes, 6 February 2014.
      src("Indie puzzler Threes comes to iOS at 33% off, naturally", "Engadget", "https://www.engadget.com/2014/02/06/indie-puzzler-threes-comes-to-ios-at-33-off-naturally/"),
      // The supernetted route.
      src("RFC 1519: Classless Inter-Domain Routing (CIDR): an Address Assignment and Aggregation Strategy", "RFC Editor", "https://www.rfc-editor.org/rfc/rfc1519"),
      // A single aggregate route.
      src("RFC 4632: Classless Inter-domain Routing (CIDR): The Internet Address Assignment and Aggregation Plan", "RFC Editor", "https://www.rfc-editor.org/rfc/rfc4632"),
    ],
    // Summarising and the route table it shrinks.
    glossary: ["supernet", "cidr", "route-table", "longest-prefix-match"],
  },
  // Phish or Legit: the word, AOHell, homographs, Punycode, a famous quiz.
  "phish-or-legit": {
    sources: [
      // 1996, ph from phreaking.
      src("Phishing", "Merriam-Webster", "https://www.merriam-webster.com/dictionary/phishing"),
      // AOHell, in its author's own account.
      src("Early Phishing", "Koceilah Rekouche, arXiv", "https://arxiv.org/abs/1106.4692"),
      // The paper's record: CACM 45(2), February 2002.
      src("The Homograph Attack", "Evgeniy Gabrilovich and Alex Gontmakher", "https://gabrilovich.com/publications/papers/homograph.html"),
      // The registered look-alike.
      src("The Homograph Attack (full paper)", "Evgeniy Gabrilovich and Alex Gontmakher", "https://gabrilovich.com/publications/papers/homograph_full.pdf"),
      // Punycode.
      src("RFC 3492: Punycode: A Bootstring encoding of Unicode for Internationalized Domain Names in Applications (IDNA)", "RFC Editor", "https://www.rfc-editor.org/rfc/rfc3492"),
      // The xn-- prefix.
      src("RFC 3490: Internationalizing Domain Names in Applications (IDNA)", "RFC Editor", "https://www.rfc-editor.org/rfc/rfc3490"),
      // Jigsaw's quiz.
      src("Take Jigsaw's Phishing Quiz", "Jigsaw", "https://phishingquiz.withgoogle.com/"),
    ],
    // The attack itself.
    glossary: ["phishing"],
  },
  // Log Detective: Stoll, the Combined Log Format, Where's Wally?
  "log-detective": {
    sources: [
      // August 1986; the paper of May 1988.
      src("Stalking the Wily Hacker", "Clifford Stoll, Communications of the ACM 31(5)", "https://doi.org/10.1145/42411.42412"),
      // Seventy-five cents, in Stoll's words.
      src("The Cuckoo's Egg: Tracking a Spy Through the Maze of Computer Espionage", "Booknotes, C-SPAN", "https://booknotes.c-span.org/Watch/10122-1"),
      // About nine seconds unpaid.
      src("How a Berkeley Eccentric Beat the Russians, and Then Made Useless, Wondrous Objects", "California Magazine, Cal Alumni Association", "https://alumni.berkeley.edu/california-magazine/spring-2016-war-stories/how-berkeley-eccentric-beat-russians-and-then-made/"),
      // Doubleday, 1989.
      src("The Cuckoo's Egg", "Open Library", "https://openlibrary.org/works/OL3741565W"),
      // The Combined Log Format.
      src("Log Files", "Apache HTTP Server Version 2.4", "https://httpd.apache.org/docs/2.4/logs.html"),
      // Where's Wally?, UK 1987.
      src("15 Facts About 'Where's Waldo?'", "Mental Floss", "https://www.mentalfloss.com/article/90967/14-facts-about-wheres-waldo"),
    ],
    // The book, its author and what the logs show.
    glossary: ["the-cuckoos-egg", "cliff-stoll", "logging", "syslog", "brute-force"],
  },
  // Incident Commander: FIRESCOPE and ICS, the SRE book, idle games.
  "incident-commander": {
    sources: [
      // 1970, 700 homes, 16 lives; chartered in 1972.
      src("FIRESCOPE: Past, Present, Future", "California Governor's Office of Emergency Services, FIRESCOPE", "https://firescope.caloes.ca.gov/SiteCollectionDocuments/past%20present%20future.pdf"),
      // FIRESCOPE included ICS.
      src("ICS Review Document", "FEMA Emergency Management Institute", "https://training.fema.gov/emiweb/is/icsresource/assets/ICS%20Review%20Document.pdf"),
      // Based on the Incident Command System.
      src("Managing Incidents", "Site Reliability Engineering, Google", "https://sre.google/sre-book/managing-incidents/"),
      // Blameless postmortems, a tenet.
      src("Postmortem Culture: Learning from Failure", "Site Reliability Engineering, Google", "https://sre.google/sre-book/postmortem-culture/"),
      // The Wheel of Misfortune.
      src("Accelerating SREs to On-Call and Beyond", "Site Reliability Engineering, Google", "https://sre.google/sre-book/accelerating-sre-on-call/"),
      // Progress Quest needs no interaction.
      src("Progress Quest Manual", "Progress Quest", "https://progressquest.com/info.php"),
      // First released in 2002 (twenty years before January 2022).
      src("Progress Quest", "Progress Quest", "https://progressquest.com/"),
      // Cookie Clicker, web 2013.
      src("Cookie Clicker on Steam", "Steam", "https://store.steampowered.com/app/1454400/Cookie_Clicker/"),
      // Universal Paperclips and Bostrom.
      src("2017: Universal Paperclips", "Aaron A. Reed, 50 Years of Text Games", "https://if50.substack.com/p/2017-universal-paperclips"),
    ],
    // The words of the trade.
    glossary: ["incident", "postmortem", "blameless", "post-incident-review", "mttr", "five-nines"],
  },
  // Whack-a-Bug: Mogura Taiji, Whac-A-Mole, Edison's bug, the moth, the feature.
  "whack-a-bug": {
    sources: [
      // Kato Seisakusho, TOGO, 1975; the US and Fechter, 1977.
      src("なぜか「同じトラブル」を繰り返す人の特徴【世界一流の口癖＃3】", "Diamond Online", "https://diamond.jp/articles/-/401218"),
      // Bob's Space Racers, Denton and Anderson, Fechter's name.
      src("An Oral History of Whac-a-Mole", "MEL Magazine", "https://melmagazine.com/en-us/story/whac-a-mole-oral-history"),
      // Edison to Orton, March 1878.
      src("Did You Know? Edison Coined the Term \"Bug\"", "IEEE Spectrum", "https://spectrum.ieee.org/the-institute/ieee-history/did-you-know-edison-coined-the-term-bug"),
      // The moth of 1947, the caption, not Hopper's.
      src("The Bug in the Computer Bug Story", "JSTOR Daily", "https://daily.jstor.org/the-bug-in-the-computer-bug-story/"),
      // The log book itself.
      src("Log Book With Computer Bug", "Smithsonian National Museum of American History", "https://americanhistory.si.edu/collections/object/nmah_334663"),
      // Not a bug, a feature.
      src("feature", "The Jargon File", "http://www.catb.org/jargon/html/F/feature.html"),
    ],
    // The moth, the officer and the craft.
    glossary: ["the-first-bug", "grace-hopper", "debugging"],
  },
  // Exit the Editor: the question, vi, Vim, the escape room.
  "exit-the-editor": {
    sources: [
      // August 2012, a million, 80 an hour.
      src("Stack Overflow: Helping One Million Developers Exit Vim", "Stack Overflow Blog", "https://stackoverflow.blog/2017/05/23/stack-overflow-helping-one-million-developers-exit-vim/"),
      // vi, 1976, Berkeley.
      src("Bill Joy's greatest gift to man: the vi editor", "The Register", "https://www.theregister.com/2003/09/11/bill_joys_greatest_gift/"),
      // ex's visual mode; the first BSD, 1978.
      src("How Do You Exit Vim? A Newbie Question Turned Tech Meme", "The New Stack", "https://thenewstack.io/how-do-you-exit-vim-a-newbie-question-turned-tech-meme/"),
      // Vim, 2 November 1991.
      src("The iconic text editor Vim celebrates 25 years", "Opensource.com", "https://opensource.com/life/16/11/happy-birthday-vim-25"),
      // More than 30 years.
      src("Vim 9.1 released", "vim.org", "https://www.vim.org/vim-9.1-released.php"),
      // Crimson Room, 2004, the genre.
      src("Crimson Room", "Wikipedia", "https://en.wikipedia.org/wiki/Crimson_Room"),
    ],
    // The programs on the levels.
    glossary: ["vi", "emacs", "nano", "ssh", "telnet"],
  },
  // Five Clues: Only Connect, Pyramid, Connections.
  "five-clues": {
    sources: [
      // BBC Four, 15 September 2008; the host; 5, 3, 2, 1.
      src("Only Connect", "UKGameshows", "https://ukgameshows.com/ukgs/Only_Connect_(2)"),
      // The $10,000 Pyramid, 1973, Dick Clark.
      src("Bob Stewart, 91; produced game shows that enthralled US", "The Boston Globe", "https://www.bostonglobe.com/metro/obituaries/2012/05/06/bob-stewart-produced-game-shows-that-enthralled/FE6jZ1YWTDOk8mvCQMdl7N/story.html"),
      // The Winner's Circle.
      src("Pyramid (game show)", "Wikipedia", "https://en.wikipedia.org/wiki/Pyramid_(game_show)"),
      // Connections, beta in June 2023, 16 words.
      src("Connections: New York Times might've found its next Wordle", "CNN Business", "https://www.cnn.com/2023/08/28/business/connections-nyt-new-game-launch/index.html"),
    ],
    // No glossary entry fits a quiz format.
    glossary: [],
  },
};
