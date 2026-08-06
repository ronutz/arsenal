// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - kali.org press release (13 March 2013, Black Hat Europe): the motto "Try
//     Harder"; Aharoni quoted that "for IT professionals, an experiment is worth
//     a thousand theories", and that simulating attacks is the only sure way to
//     understand a defence; the company renamed from Offensive Security to
//     OffSec in March 2023
//   - Grokipedia: Kali reached 90,000 downloads in its first five days
//   - HandWiki: in September 2019 the company took its FIRST venture capital
//     investment, from Spectrum Equity, and Ning Wang replaced Joe Steinbach,
//     who had run the business FROM THE PHILIPPINES for the previous four years
//
// *** BODY READ AFTER DRAFTING, AND IT IS EXCEPTIONAL. It already has the full
// Whoppix/WHAX/BackTrack/Kali lineage, the maintainable-base-over-familiar-name
// argument, the inverted business model, the Pearson VUE and Prometric
// contrast, the 2019 cheating allegations, Aharoni's departure and the
// succession, and - in paragraph [4] - a general principle about assessment
// that is better than anything research produced:
//
//   "Every assessment model is vulnerable in exactly the place its strength
//    comes from. Standardisation makes an exam scalable and memorisable.
//    Realism makes an exam unfakeable and leakable."
//
// This profile therefore adds FACTS AND STRUCTURE ONLY, and deliberately does
// not re-argue the assessment question. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const offsecProfile: VendorProfile = {
  slug: "offsec",
  foundings: [],
  timeline: [
    {
      year: 2013,
      title: "Ninety thousand downloads in five days",
      detail:
        "Kali's reception on release. The number matters because it settles a question the rebuild raised: whether an established user base would follow a distribution to a new foundation and a new name. It did, immediately.",
    },
    {
      year: 2019,
      title: "Outside money, and a change of chair",
      detail:
        "The first venture capital investment, from Spectrum Equity, and a new chief executive. The previous one had run the company from the Philippines for four years - which is a fair description of what it had been until then, and of how much the funding changed.",
    },
    { year: 2023, title: "Offensive Security becomes OffSec", detail: "March. The shorter name arrived alongside a broader course catalogue, which is usually what a shortened name signals." },
  ],
  products: [
    { name: "Kali Linux", what: "The distribution, free and open source, and the platform every course is taught on. It is simultaneously the product, the marketing and the entrance to the funnel." },
    { name: "Kali NetHunter", what: "The mobile build, for testing from a phone rather than a laptop - which matters in physical engagements where carrying a laptop is the thing that gets noticed." },
    { name: "ExploitDB", what: "The exploit archive, maintained as a public resource. Anybody researching a vulnerability ends up here eventually, whether or not they have heard of the company." },
    { name: "The certification ladder", what: "OSCP as the entry point, with more advanced examinations in exploit development, web application attack and evasion above it. Each is practical, and each takes considerably longer than the equivalent in any other programme." },
    { name: "Metasploit Unleashed and VulnHub", what: "Free training material and deliberately vulnerable machines to practise against - the tier below the paid courses, and the reason people arrive already committed." },
  ],
  innovations: [
    {
      title: "An experiment is worth a thousand theories",
      detail:
        "The founder's own formulation, and the pedagogy in one line: you cannot know whether a defence works by reasoning about it, only by attacking it. Every course this company sells follows from that sentence, and so does the shape of its examinations.",
    },
    {
      title: "Try Harder as a support policy",
      detail:
        "The motto is usually quoted as a slogan and functions as something harsher: it is what students are told instead of an answer. Refusing to help is an unusual thing to build a training brand on, and it selects hard for the kind of person who will keep going without being rescued - which is either the point or the criticism, depending on who is describing it.",
    },
    {
      title: "Giving the whole toolkit away",
      detail:
        "Hundreds of tools, packaged, maintained and free, used daily by people who will never pay anything. The maintenance burden is real and continuous, and it is carried because the distribution is what makes the certification mean something: the examination is credible precisely because everybody has the same tools available.",
    },
  ],
  markets: [
    "Individual practitioners paying their own money far more often than employers paying for them, plus corporate security teams and government. The buyer is frequently the person sitting the exam, which is unusual in a market where certification is normally an employer's purchase and explains a good deal about how the courses are priced and written.",
    "It competes with the vendor-neutral certification bodies elsewhere on this timeline and with the vendors' own security tracks, on a proposition none of them makes: that the assessment is the work itself rather than a description of it.",
  ],
  analyst: [
    "There is no analyst coverage of a private training company of this size, and the relevant assessment is reputational rather than financial: hiring managers in offensive security treat the OSCP as evidence in a way they treat few other credentials.",
    "The commercial question is separate from the assessment one the entry above discusses, and less often asked. A credential whose worth rests on scarcity is in tension with a business that grows by selling more of it, and an owner with outside investors has a view on which of those matters. Nothing in the record so far settles it either way.",
  ],
};
