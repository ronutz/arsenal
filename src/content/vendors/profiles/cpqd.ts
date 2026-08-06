// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - forumcampinas.org.br: created 31 August 1976 by decision of the Telebrás
//     board, under the Ministry of Telecommunications, with the objective of
//     reproducing in Brazil a telecommunications research model aimed at the
//     country's TECHNOLOGICAL AUTONOMY; responsible for applied research, basic
//     research conducted with universities under Telebrás coordination and
//     funding, and the TRANSFER of prototypes and products to industry; largest
//     depositor of software registrations in Brazil and second among
//     non-academic research institutions for patent applications at INPI
//     (Conexis, 2011)
//   - Alchetron and ci-brasil.gov.br: technologies developed include digital
//     switching centres, antennas, digital and optical transmission equipment,
//     optical fibre, semiconductor lasers, packet switching, the INDUCTIVE-CARD
//     PUBLIC TELEPHONE, telex switching and operations support systems; the
//     spin-out companies known collectively as the CPqD universe - Padtec,
//     Trópico, BrPhotonics, ClearTech, Instituto Atlântico and others
//   - forumcampinas PDF: CPqD became Fundação CPqD on 23 JULY 1998 under the
//     Lei Geral das Telecomunicações; the Telebrás auction was 29 JULY 1998
//   - Conexis: campus land acquired June 1980; the Pólis de Tecnologia site is
//     360,000 m² with 55,000 m² built
//
// *** BODY READ AFTER DRAFTING. The body has the industrial-not-academic brief,
// the guaranteed-customer advantage, the 1998 break-up into twelve holdings,
// the survival, and the neutrality argument tying to carrier-neutral exchanges
// and vendor-neutral certification. It does not say HOW the industrial brief
// worked, or WHAT was built. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const cpqdProfile: VendorProfile = {
  slug: "cpqd",
  foundings: [
    {
      company: "Centro de Pesquisa e Desenvolvimento da Telebrás",
      year: 1976,
      place: "Campinas, São Paulo",
      founders: ["Telebrás", "Ministério das Comunicações"],
      story:
        "Approved by the Telebrás board on 31 August with a stated purpose that is unusually explicit in the record: autonomia tecnológica, technological autonomy for the country in telecommunications. It began in a downtown office, then borrowed space from Embratel, and occupied five locations before land was bought in 1980 for the campus it still uses.",
    },
  ],
  timeline: [
    {
      year: 1980,
      title: "A campus of its own",
      detail: "Land acquired for what became the Pólis de Tecnologia - 360,000 square metres, of which around 55,000 are built. The scale is a statement about how long the project was expected to run.",
    },
    {
      year: 1998,
      title: "Independent six days before the parent was sold",
      detail:
        "CPqD became a private-law foundation on 23 July under the Lei Geral das Telecomunicações. The Telebrás auction took place on 29 July. The research capability was deliberately detached before the thing that funded it was broken up and sold, which is a decision somebody had to make on purpose.",
    },
  ],
  products: [
    { name: "Trópico digital switching", what: "Brazilian-designed telephone exchanges, developed here and manufactured by industry - the single largest undertaking of the pre-privatisation era and the reason the brief existed." },
    { name: "The inductive-card payphone", what: "The card and the telephone that took it, used by essentially everybody in Brazil for a decade. It is the piece of this institution's work that the largest number of people physically touched, and almost nobody knew where it came from." },
    { name: "Optical components", what: "Optical fibre, semiconductor lasers and optical transmission equipment - the technologies that later spun out as Padtec and BrPhotonics rather than remaining research." },
    { name: "Operations and business support systems", what: "The software an operator runs on: provisioning, billing, network management. Unglamorous, enormous, and the part most likely to be imported if nobody local builds it." },
    { name: "Testing and certification", what: "Conformance and interoperability evaluation, and participation in the Brazilian digital television standard - work that produces documents rather than devices." },
  ],
  innovations: [
    {
      title: "Develop here, manufacture there",
      detail:
        "The model was explicit: CPqD did applied research, coordinated basic research with universities, built prototypes, and then transferred the technology to companies that manufactured and sold it. The institute never became a factory. That separation is what let a state research centre produce commercial products without becoming a state manufacturer, and it is the mechanism behind the industrial brief the entry above describes.",
    },
    {
      title: "Spinning out rather than holding on",
      detail:
        "Padtec in optical transmission, Trópico in switching, BrPhotonics in photonics and a dozen others emerged from work done here and are collectively called the CPqD universe. An institution that measures itself by what leaves it is structured very differently from one that measures itself by what it retains.",
    },
    {
      title: "Technological autonomy as an engineering programme",
      detail:
        "Import substitution is usually a trade policy. Here it was a research agenda with deliverables - switching, transmission, fibre, lasers - each chosen because the country was buying it from abroad. Whether the policy succeeded is argued elsewhere on this timeline; what is not in doubt is that somebody wrote down which technologies mattered and then built them.",
    },
    {
      title: "Counting the output in registrations",
      detail:
        "It became the largest depositor of software registrations in Brazil and the second-largest non-academic filer of patent applications. For an institution whose products belong to other companies, the intellectual property record is the only honest measure of what it produced.",
    },
  ],
  markets: [
    "Telecommunications operators, energy utilities, financial institutions, government and defence - the customers who need technology built for local conditions and regulation, and who cannot simply buy a product designed for another market.",
    "It sells research, development and certification rather than products, which places it against consultancies and university laboratories rather than against vendors. Its distinguishing asset is that it has been doing this in one country's telecommunications sector for fifty years and remembers what was tried before.",
  ],
  analyst: [
    "Its research programme is described as the largest of its kind in information and communications technology in Latin America, and the campus is part of the São Paulo state technology park system.",
    "The measure worth applying is unusual: an institution created to serve a monopoly outlived the monopoly by nearly three decades, and did so by selling to the companies the monopoly was broken into. Very little of the Telebrás system survives under its own name. The part that did was the part that was not sold.",
  ],
};
