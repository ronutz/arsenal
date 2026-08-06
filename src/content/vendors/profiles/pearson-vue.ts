// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - Ashton Testing Services: VUE was begun in 1994 "with the intention to
//     create a WORLD-CLASS TRAINING SERVICES COMPANY for the IT industry" -
//     the founding purpose was training, not testing
//   - Pearson VUE's own vision page: 5,500 test centres in more than 180
//     countries; the Pearson Professional Center introduced 2002; OnVUE 2019
//   - Learn & Work Ecosystem Library: the Pearson Skilling Partner Program is
//     transforming the network of 4,600+ test centres into "one-stop learning
//     and certification hubs", offering training courses through the Pearson
//     Skilling Suite and Training Marketplace ALONGSIDE the certification exam
//   - Multiple sources: nearly 21 million exams delivered annually
//
// *** BODY READ AFTER DRAFTING, AND IT IS OUTSTANDING. It has the chain of
// trust ("a credential is worth exactly what that verification is worth"), the
// security apparatus as the product, the OnVUE timing described honestly as
// luck, the remote-proctoring trade WITH the surveillance objection, Pearson's
// own 1844 construction origins, the earned Ingram Industries parallel, the
// acquisition portfolio, and "the ordinary condition of infrastructure".
//
// Research adds TWO FACTS that together form a circle the body does not
// describe. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const pearsonVueProfile: VendorProfile = {
  slug: "pearson-vue",
  foundings: [],
  timeline: [
    {
      year: 1994,
      title: "Founded to be a training company",
      detail:
        "The stated intention at the outset was a world-class training services business for the information technology industry. Testing was not the plan; it was what the company turned out to be good at, and what it became instead.",
    },
    {
      year: 2025,
      title: "And returning to training, thirty years later",
      detail:
        "The current programme is converting the test-centre network into venues that sell training alongside the examination - courses in cloud, security and artificial intelligence delivered in the same locations that administer the certificate at the end. The company founded to do training and diverted into testing is now using the testing network to do training.",
    },
  ],
  products: [
    { name: "Test centre delivery", what: "Around five and a half thousand locations, and the physical layer of the industry: a room, a proctor, a locker for your belongings and a machine that is not yours." },
    { name: "OnVUE", what: "Remote proctored delivery, and now a substantial share of volume. Whatever one concludes about the trade the entry above describes, it made certification available to candidates hundreds of miles from the nearest centre, which was always a real barrier and rarely discussed." },
    { name: "Exam development", what: "The tooling behind the questions - item banking, psychometrics, performance-based and simulated tasks. This is where a certification is made harder to memorise, and it is bought as a service by the vendors whose names appear on the certificates." },
    { name: "Registration and credential administration", what: "Scheduling, payment, identity records and results delivery. Unglamorous, and the part a candidate actually experiences most of." },
  ],
  innovations: [
    {
      title: "The separation that certification rests on",
      detail:
        "The reason a credential means anything is that the party teaching you is not the party deciding whether you passed. That separation is the industry's foundation, and it is why the testing companies exist as separate businesses at all rather than as departments inside the vendors.",
    },
    {
      title: "And the question the current strategy raises",
      detail:
        "If the organisation delivering the examination also sells the course that prepares for it, the separation narrows. It does not disappear - the vendor still writes the objectives and owns the credential, and a training arm and a delivery arm can be run apart - but it is worth stating plainly that the arrangement is changing, and that nobody sitting an exam is told which parts of the chain are under one roof.",
    },
    {
      title: "Standardising an experience across five thousand rooms",
      detail:
        "The hard engineering problem here is not the software. It is making a test in Recife identical in security, timing and conditions to the same test in Rotterdam, in premises the company mostly does not own, staffed by people it mostly does not employ. Franchised consistency is the whole product, and it is why the centre standard introduced in 2002 mattered more than any technology the company has shipped.",
    },
  ],
  markets: [
    "Technology certification is the visible part and the smaller one. The larger business is professional licensing - healthcare, finance, law - academic admissions, and government programmes, at around twenty-one million examinations a year.",
    "Its principal competitor appears elsewhere on this timeline, and the two between them deliver most of the world's high-stakes computer-based examinations, which is a concentration worth noticing in an industry whose credibility depends on independent verification.",
  ],
  analyst: [
    "There is no analyst market to assess. The relevant measure is trust, and the relevant threat to it is not competition but incident: a single well-publicised failure of verification damages every credential delivered through the same channel.",
    "The strategic question is the one raised above. A company that began as a training business, became the neutral examiner, and is now selling training again has travelled a full circle in thirty years. Whether that is convergence or conflict depends entirely on how carefully the two halves are kept apart, and that is not something a candidate can inspect.",
  ],
};
