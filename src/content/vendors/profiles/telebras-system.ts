// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - pt.wikipedia "Privatização da Telebrás": in the early 1980s a severe
//     financial crisis in the Brazilian public sector cut the investment needed
//     to continue expanding the national system, DEGRADING SERVICE QUALITY
//     across the Telebrás group; the Secretaria de Controle de Empresas
//     Estatais (Sest) ordered large investment cuts across all state companies;
//     the privatisation model was designed by Communications Minister SÉRGIO
//     MOTTA, WHO DIED MONTHS BEFORE THE AUCTION and was replaced by Luiz Carlos
//     Mendonça de Barros; preferred shares equal to 2.18% of capital were
//     offered at a discount to 90,000 employees and pensioners
//   - pt.wikipedia "Telecomunicações Brasileiras S.A.": the Union held 94.5% of
//     capital, the remainder subscribed by the BNDE, Companhia Vale do Rio
//     Doce, Petrobrás and Eletrobrás; Fundo Nacional de Telecomunicações
//     resources transferred from Embratel to Telebrás; the 1962 Código
//     Brasileiro de Telecomunicações established the legal basis
//
// *** BODY READ AFTER DRAFTING. The body has the 900 companies, the founding
// law, the $5,000-to-$20 line cost, CPqD, the auction figures, the Embratel
// chain to Claro, the successor consolidation, and an explicit refusal to judge
// the outcome. What it does NOT have is WHY the system was politically
// vulnerable by 1995 - a decade of deliberate underinvestment. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const telebrasProfile: VendorProfile = {
  slug: "telebras-system",
  foundings: [
    {
      company: "Telecomunicações Brasileiras S.A.",
      year: 1972,
      place: "Brasília",
      founders: ["the Brazilian federal government"],
      story:
        "The legal groundwork was older: the Código Brasileiro de Telecomunicações of 1962 established that telecommunications would be organised by the state. The company that followed a decade later was capitalised 94.5% by the Union, with the remainder subscribed by the national development bank and three other state enterprises - Vale do Rio Doce, Petrobrás and Eletrobrás. The sector's own fund, the Fundo Nacional de Telecomunicações, was moved across to pay for the build.",
    },
  ],
  timeline: [
    {
      year: 1982,
      title: "The decade of not spending",
      detail:
        "A severe public-sector financial crisis led the state enterprise control secretariat to impose deep investment cuts across every state company, including this one. The expansion slowed and service quality degraded - not through mismanagement of the network but through a fiscal decision taken above it. This is the decade that made the later argument for privatisation persuasive, and it is usually left out of both versions of the story.",
    },
    {
      year: 1995,
      title: "Constitutional Amendment 8",
      detail: "The monopoly reservation removed in February, allowing private capital into telecommunications under authorisation, concession or permission.",
    },
    {
      year: 1998,
      title: "The architect does not see it",
      detail:
        "Sérgio Motta, the communications minister who designed the privatisation model, died months before the auction he had spent years constructing. His successor executed it. Ninety thousand employees and pensioners were offered preferred shares at a discount, which is a detail worth keeping: the people who built the system were given a small piece of what it sold for.",
    },
  ],
  products: [
    { name: "The national network", what: "Twenty-seven state operators, a long-distance carrier, satellite capacity and submarine cable - assembled from hundreds of incompatible local systems into one that could complete a call across a continent." },
    { name: "CPqD", what: "The research centre, which appears separately on this timeline. It is the only major component of the system that was not sold and is still operating under its own name." },
    { name: "Satellite capacity", what: "A stake in the geostationary defence and strategic communications satellite programme - infrastructure with no commercial buyer, which is the category of thing a state operator is kept for." },
  ],
  innovations: [
    {
      title: "Standardisation as the actual product",
      detail:
        "The engineering achievement was not any single technology but agreement: one numbering plan, one set of interconnection rules, one technical standard across a country the size of a continent. Nine hundred operators had produced nine hundred ways of doing things, and the merger's real output was that they stopped.",
    },
    {
      title: "A research centre inside the monopoly",
      detail:
        "Building a laboratory whose job was to replace imports, and funding it from the operator's own revenues, is a policy choice rather than a technical one. It gave the country switching, transmission and optical technology it would otherwise have bought, and it is the reason there is a second Brazilian entry on this timeline at all.",
    },
    {
      title: "Underinvestment as the mechanism of change",
      detail:
        "Systems are rarely privatised while they are working well. A decade of enforced capital starvation produced the waiting lists and the poor service that made the case for selling, which means the political argument of the 1990s was in part about conditions created by decisions taken in the 1980s. That sequence recurs wherever public infrastructure changes hands, and it is worth naming rather than assuming.",
    },
    {
      title: "Keeping the shell",
      detail:
        "The holding company was never dissolved. It was retained to administer residual staff, and twelve years later it was reactivated with a new purpose. An institution kept alive on paper turned out to be cheaper to restart than to recreate, which is an argument for not dissolving things completely.",
    },
  ],
  markets: [
    "Its market was the entire country, by law, for twenty-six years. What replaced it was a set of regional concessions and mobile licences held by operators that consolidated within a decade into a handful of groups.",
    "The current entity does not compete: it sells capacity to federal administration and reaches places where no commercial case exists. That is a deliberate remit rather than a market position.",
  ],
  analyst: [
    "Any assessment of the system runs into the same problem the entry above identifies: the achievement and the failure are both real, and which one dominates depends on what is being measured. The network was built. The state that built it could not afford to keep building it. Both are established facts and neither settles the argument.",
    "The narrower observation is about institutional survival. Of everything the system contained, the two things still operating under their original names are the research centre that was detached before the sale and the holding company that was never wound up. What survived was what nobody bought.",
  ],
};
