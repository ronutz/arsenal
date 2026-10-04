// ============================================================================
// src/content/testimonials/kinds.ts
// ----------------------------------------------------------------------------
// THE KIND OF WORK EACH ENDORSEMENT DESCRIBES, kept apart from the verbatim
// dataset on purpose.
//
// WHY A SEPARATE FILE. data.ts is generated from the proofread catalogue and
// carries a "do not hand-edit" notice, and the verbatim-only guardrail says the
// text is never touched. A classification is editorial judgement about the
// text, not part of it, so it lives here, keyed by id, and can be corrected
// without a generator run and without any risk to the quotations.
//
// WHY IT EXISTS (PRIME 2026-10-03, from the advisory review). Eighty-nine
// recommendations are a large asset, but for a reader weighing an advisory
// engagement most of the recent ones establish that Rodolfo Nützmann is an
// excellent instructor, which is a different claim. Splitting the record by
// kind lets the endorsements page be filtered, and lets the advisory page
// surface only the entries that describe design, selection, procurement and
// leadership work.
//
// HOW THE KINDS WERE ASSIGNED. From the text of each recommendation (the
// recorded English translation where the original is Portuguese), read in full
// on 2026-10-03. One entry can carry several kinds. The test for each kind:
//   training     the writer was taught, mentored or trained by him
//   engineering  implementation, deployment, support, troubleshooting, field or
//                systems engineering, service delivery
//   architecture design, conception or analysis of a solution
//   advisory     consulting, recommending, technology definition, vendor
//                relationships, RFP work, assessment delivered to a client
//   leadership   leading or coordinating projects, suppliers or teams;
//                managing conflict; building shared practice
//   general      a character or competence reference with no activity named
// An entry that names no activity is "general" rather than guessed into a kind.
// ============================================================================

/** The kinds a recommendation can describe. */
export type TestimonialKind =
  | "training"
  | "engineering"
  | "architecture"
  | "advisory"
  | "leadership"
  | "general";

/** Display order of the kinds, in filters and badges. */
export const TESTIMONIAL_KINDS: readonly TestimonialKind[] = [
  "training",
  "engineering",
  "architecture",
  "advisory",
  "leadership",
  "general",
] as const;

/**
 * The classification, by testimonial id. Ids absent from this map are
 * "general" (see kindsOf), so a newly captured review that nobody has read for
 * kind yet is never silently filed as advisory evidence.
 */
const KINDS_BY_ID: Readonly<Record<string, readonly TestimonialKind[]>> = Object.freeze({
  // ---- LinkedIn recommendations, oldest first ----
  "78": ["general"],                    // 2004, Rodney Reis: knowledge and commitment, no activity named
  "81": ["engineering"],                // 2004, Mario Pires: hired as probationary, moved to FE/SE
  "74": ["engineering"],                // 2004, Mario Pires: FE at Cabletron, SE at Enterasys
  "73": ["general"],                    // 2004, Marcelo Rezende: talent and execution, no activity named
  "75": ["general"],                    // 2004, Luiz Eduardo: recommended him twice; understands and "feels" networking
  "79": ["architecture", "engineering"],// 2004, Igor Giangrossi: pre-sales SE developing solutions; helped post-sales on SSR/Xpedition
  "54": ["engineering", "leadership"],  // 2004, Igor Giangrossi: built the Riverstone technical library and a documenting culture
  "77": ["leadership", "engineering", "training"], // 2004, Durval Stendard: coordinating and implementing critical projects; teaching in training
  "61": ["general"],                    // 2004, David Kallas: communication and relationship skills
  "76": ["general"],                    // 2004, Bernhard Behn: technical abilities over twelve years
  "65": ["general"],                    // 2004, Adilson Gal: smart, dedicated, team player
  "56": ["general"],                    // 2004, Marcus Klein: relationship, self-learning, entrepreneurship
  "72": ["engineering"],                // 2005, Martin Gudmon: solid network engineer, customer focused
  "80": ["engineering"],                // 2005, Dave Potter: case management at the TAC
  "57": ["engineering", "leadership"],  // 2005, Dave Potter: co-built the knowledge base and its processes
  "67": ["general"],                    // 2006, Durval Stendard: market recognition, from a client's seat
  "63": ["architecture", "leadership", "engineering"], // 2008, Joel Ambar (client): led design, conception, analysis and implementation across several suppliers
  "38": ["advisory", "leadership"],     // 2008, Luis Antonio Nascimento: consulting, vendor relationships, technology definition, RFP, implementation contact
  "70": ["advisory", "engineering"],    // 2008, Kristiane Cardoso: deploying OSPF environments; consultant to an end user evaluating a security product
  "66": ["advisory", "engineering"],    // 2008, João Paulo Felix: technology he was supporting and recommending
  "58": ["leadership", "general"],      // 2008, Valdir Bignardi: execution and natural leadership
  "39": ["engineering"],                // 2008, Julianna Knauer: resolving customer issues
  "60": ["general"],                    // 2008, Hélder Farias: technical skill and team spirit
  "36": ["general"],                    // 2008, Jose P. Leal Junior: results, track record
  "62": ["general"],                    // 2008, Eduardo Ritter: customer satisfaction and service
  "64": ["engineering"],                // 2008, Carlos Mont'Alverne: engineer on the Serpro account
  "55": ["general"],                    // 2008, Benny Zatyrko: business oriented, market knowledge
  "69": ["engineering", "leadership"],  // 2008, Arapoan Fernandes: single point of contact role at Serpro
  "51": ["engineering"],                // 2008, Antonio Martins: project implementation, documentation
  "71": ["training"],                   // 2008, Claudio Neiva: sped up his training on Enterasys products
  "59": ["general"],                    // 2008, Alex Marques: dedication to technical development
  "68": ["general"],                    // 2008, Adriano Mazza: customer needs first
  "48": ["engineering"],                // 2009, Rodrigo Hirooka: technical reference for professional services engineers
  "53": ["general"],                    // 2009, Maurilio Gonçalves: responsible with projects
  "37": ["engineering"],                // 2009, Fabio Correa: technical support on projects
  "45": ["general"],                    // 2009, Amir Hamad: learned many things from him
  "40": ["engineering"],                // 2010, Leonardo Luy Peixoto: helped operate UNIVALI's network
  "47": ["advisory"],                   // 2011, Oscar Nogueira: capacity planning and monitoring answers for a project
  "42": ["advisory", "architecture"],   // 2012, Andrea Ramos: data-link capacity analysis, results presented
  "50": ["general"],                    // 2014, Rodrigo Larrabure: proactive, customer oriented
  "44": ["leadership", "engineering"],  // 2014, Paulo Sousa: leadership and focus on complex projects
  "46": ["engineering"],                // 2014, Mauricio Nazario: network engineering and security experience
  "35": ["engineering"],                // 2014, Marcos Buzo: implementation of the Campinas metropolitan network
  "52": ["engineering"],                // 2014, Marcelo Fernandes: dealt with high-level challenges at Enterasys
  "34": ["general"],                    // 2014, Jonildo Cordeiro: specialist at what he does
  "49": ["general"],                    // 2014, Fábio de Faria: committed, always learning
  "43": ["general"],                    // 2014, Adilson Caputo: solution and project development, no activity named
  "41": ["training", "engineering"],    // 2014, Andrey Tavares: Extreme course; metropolitan network implementation
  "24": ["general"],                    // 2020, Rodrigo Larrabure: dedicated, customer-centric
  "30": ["general"],                    // 2020, Leandro Sardim: smart and capable
  "22": ["engineering", "training"],    // 2020, Fabiana Conz Weiler: F5 projects at Westcon; gift for teaching
  "21": ["general"],                    // 2020, Eduardo Casseano: helpful, proactive
  "28": ["architecture"],               // 2020, Edson Lemos: effective in designing projects, by concept not trial
  "32": ["training"],                   // 2020, Dieise Ramos: excellent F5 instructor
  "31": ["engineering"],                // 2020, Dan Peres: engineer at Network1 and Westcon, product demonstrations
  "33": ["training"],                   // 2020, Caroline Soares: taught her much of information security
  "27": ["general"],                    // 2020, Andre Ricardo: dedicated, team spirit
  "20": ["advisory", "training"],       // 2021, Fernando Camargo: guidance to partners; instructor
  "18": ["training"],                   // 2023, Wagner Valério: four training courses
  "12": ["training"],                   // 2023, Thiago Marins: 201 exam preparation
  "11": ["training"],                   // 2023, Salvador Neves: WAF training
  "13": ["training"],                   // 2023, Rodrigo Kowalski: three F5 courses
  "14": ["training"],                   // 2023, Peterson Pereira: instructor
  "19": ["training"],                   // 2023, Luiz Marcelo Serique: F5 certification courses
  "23": ["training"],                   // 2023, Josep Zabulon: technology transfer through certified training
  "16": ["training"],                   // 2023, Josan Neves: instructor
  "29": ["training"],                   // 2023, Jorge Barone: taught him most of what he knows about F5
  "26": ["training"],                   // 2023, Eduardo Ushiama: teaching, F5
  "17": ["training"],                   // 2023, Eduardo Mariano: F5 academy, two certifications
  "15": ["training"],                   // 2023, Augusto Batista: WAF course
  // ---- Google reviews and verified student reviews: every one is about a course ----
  "1": ["training"], "2": ["training"], "3": ["training"], "4": ["training"], "5": ["training"],
  "6": ["training"], "7": ["training"], "8": ["training"], "9": ["training"], "10": ["training"],
  "82": ["training"], "83": ["training"], "84": ["training"], "85": ["training"], "86": ["training"],
  "87": ["training"], "88": ["training"], "89": ["training"], "90": ["training"],
});

/** The kinds for one testimonial id; "general" when nobody has classified it. */
export function kindsOf(id: string): readonly TestimonialKind[] {
  return KINDS_BY_ID[id] ?? ["general"];
}

/** The ids the advisory page shows as analogous work, in display order. */
export const ADVISORY_EVIDENCE_IDS: readonly string[] = ["38", "63", "42", "28"] as const;
