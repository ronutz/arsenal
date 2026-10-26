// ============================================================================
// src/content/vendors/localized.ts
// ----------------------------------------------------------------------------
// LOCALE OVERLAYS FOR INDUSTRY RECORDS (Round 1, ARC-02 and CC06, 2026-10-25).
//
// Industry records (partners.ts) and their rich profiles (profiles/*.ts) are
// authored in English and rendered as English in every locale. The audit found
// the Portuguese 3Com page entirely in English under a Portuguese interface.
// This file lets a record carry authored prose for a locale WITHOUT forking the
// record: an overlay replaces only the prose fields it supplies, and every
// fact-bearing field (years, founded, ended.year, slugs, sources, tags,
// relationships) stays in the single English record, so a locale can never
// drift on a date or a status.
//
// RULES
//   - An overlay is a TRANSLATION of the record's own prose. It adds no fact
//     the English record does not state; a correction lands in the English
//     record first and is mirrored here in the same change.
//   - A record with no overlay renders exactly as before (English), which is
//     the site's per-key English-fallback policy. Nothing here relabels English
//     as Portuguese.
//   - A profile overlay is a COMPLETE translated profile with the same shape
//     and the same years as the English one; it is used whole or not at all,
//     so a half-translated page cannot occur.
//   - The Portuguese text is part of the pt-BR pack's machine-draft state (AI
//     assisted, gradual review), like the rest of the pt-BR narrative; it is
//     not marked reviewed anywhere.
//
// Portuguese here keeps technical terms in English as practitioners say them
// (switch, hub, slot, transceiver, handheld, joint venture).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";
// The translation shards (overlays/pt-BR/shard-1..8.ts), one per translator (2026-10-25).
import { PT_BR_SHARDS, mergeShards } from "@/content/vendors/overlays/pt-BR";

/** The prose fields an overlay may replace. Facts are never overlaid. */
export interface PartnerVendorOverlay {
  /** Card and page title. */
  name?: string;
  /** One-line positioning on the card and hero. */
  tagline?: string;
  /** Intro paragraph on the page. */
  intro?: string;
  /** Body paragraphs, replacing the English list whole. */
  body?: string[];
  /** The accuracy note aside. */
  note?: string;
  /** The ending's note (the year, if any, stays in the English record). */
  endedNote?: string;
  /** The successor link's label (the URL stays in the English record). */
  successorLabel?: string;
  /** The parent company's note (official.parent.note); its name (unless a state's, see parentName), slug and year stay the English record's (26/10/2026). */
  parentNote?: string;
  /**
   * A STATE owner's name in this locale (official.parent.name where kind is "state"; endings apply, 26/10/2026).
   * A company's or a fund's name is a fact kept as it writes itself, but "French State" is a description, not a
   * brand, so pt-BR says "Estado francês". It must start with "Estado": the pt-BR message reads "pertence ao
   * {parent}". check-vendor-status-fields.mts refuses it on any other kind of owner and requires it on a state.
   */
  parentName?: string;
  /** The lineage card's note (lineage.note); its member slugs stay the English record's (26/10/2026). */
  lineageNote?: string;
  /** A complete translated profile, same shape and years as the English one. */
  profile?: VendorProfile;
  /**
   * Translated prose of the record's `acquisitions`, INDEX-ALIGNED with the
   * English list (same order, same length). Only prose is carried: year, name,
   * price and founder stay the English record's. If the lengths differ the
   * whole list falls back to English and the translation report flags it.
   */
  acquisitions?: AcquisitionOverlay[];
}

/** The prose of one acquisition, aligned by position with the English entry. */
export interface AcquisitionOverlay {
  /** What the acquired company did or brought. */
  what?: string;
  /** What it became inside the acquirer. */
  became?: string;
  /** The entry's provenance note (source titles and quotations kept verbatim). */
  sourceNote?: string;
  /** The nested acquisitions' prose, aligned with the English sub-list. */
  subAcquisitions?: { what?: string }[];
}

/**
 * pt-BR overlays, keyed by record slug.
 *
 * 3com: the record the audit sampled (CC06), translated whole: card, page and
 * profile. Every other record is translated in overlays/pt-BR/shard-N.ts (the
 * nortel-bay ending note moved to shard 1 on 2026-10-25).
 */
const PT_BR: Record<string, PartnerVendorOverlay> = {
  "3com": {
    name: "3Com - a Ethernet sai do laboratório",
    tagline:
      "Bob Metcalfe comercializou a própria invenção do PARC; a EtherLink pôs em rede a era do PC, a Palm veio junto, e a história terminou na HP em 2010.",
    intro:
      "A 3Com é a segunda metade da história da Ethernet que esta seção começa na página da Xerox: Metcalfe deixou o PARC em 1979 para vender a rede que tinha inventado, e a placa EtherLink pôs a Ethernet dentro do próprio IBM PC. Computers, Communication, Compatibility, os três \"Coms\" do nome, viraram a empresa de conectividade da década das LANs.",
    body: [
      "Das primeiras placas Ethernet para PC à fusão com a US Robotics, que trouxe a Palm a bordo, até a joint venture H3C na China e a aquisição pela HP em 2010: o perfil abaixo acompanha o cabo saindo do laboratório e chegando a tudo.",
    ],
    endedNote:
      "Adquirida pela Hewlett-Packard Company em 12 de abril de 2010, dia em que a NASDAQ suspendeu a negociação das ações. A Hewlett Packard Enterprise, separada da HP em 2015, é uma sucessora posterior, não a compradora de 2010.",
    successorLabel:
      "Hewlett Packard Enterprise, a sucessora posterior: a Hewlett-Packard Company adquiriu a 3Com em 2010, e a HPE foi separada dela em 1º de novembro de 2015 com o negócio corporativo, redes incluídas",
    profile: {
      slug: "3com",
      foundings: [
        {
          company: "3Com",
          year: 1979,
          place: "Santa Clara, Califórnia",
          founders: ["Bob Metcalfe", "Howard Charney", "Bruce Borden", "Greg Shaw"],
          story:
            "Bob Metcalfe inventou a Ethernet no Xerox PARC em 1973; em 1979, saiu para vendê-la. A 3Com (Computers, Communication, Compatibility) apostou que a rede que a Xerox não ia comercializar podia virar produto para todo mundo, e o padrão DIX de 1980 (Metcalfe tinha convencido a DEC, a Intel e o antigo empregador a publicá-lo) tornou a aposta segura. A placa EtherLink de 1982 pôs a Ethernet num slot ISA dentro do IBM PC, e a LAN deixou de ser um conceito de laboratório. Se a página da Xerox nesta seção conta a invenção, esta conta a indústria.",
        },
      ],
      timeline: [
        { year: 1980, title: "O padrão DIX", detail: "A evangelização de Metcalfe leva DEC, Intel e Xerox a publicar a Ethernet como especificação aberta: o gesto que permitiu a uma startup construir um mercado sobre a invenção de um gigante." },
        { year: 1982, title: "EtherLink", detail: "O primeiro adaptador Ethernet para o IBM PC com o transceiver na própria placa: coaxial fino, um slot, e a LAN do escritório vira algo que uma empresa compra no varejo." },
        { year: 1987, title: "Bridge Communications", detail: "A fusão com a Bridge acrescenta roteadores, servidores de terminal e ambição corporativa; ao longo dos anos 1990, os adaptadores, hubs e switches da 3Com ligam em rede uma parcela enorme dos desktops do mundo." },
        { year: 1997, title: "US Robotics, e a Palm", detail: "A fusão por troca de ações de cerca de US$ 6,6 bilhões traz os modems no auge e, quase por acaso, a Palm, cujo Pilot vira o handheld de referência e, no IPO de março de 2000, chega a valer por um momento mais do que a controladora.", sourceNote: "Form 8-K da 3Com arquivado em 27 de fevereiro de 1997 (Item 5, anexo 99.1): o acordo de fusão é datado de 26 de fevereiro de 1997, cada ação da U.S. Robotics se converte em 1,75 ação da 3Com, a contabilização é por pooling of interests, e o valor de US$ 6,6 bilhões é calculado pelo preço de fechamento da 3Com em 25 de fevereiro de 1997." },
        { year: 2003, title: "H3C: a aposta na China", detail: "Depois de recuar do mercado corporativo de ponta em 2000, a 3Com forma a Huawei-3Com; compra o controle total em novembro de 2007, e uma aquisição liderada pela Bain em 2008, com participação da Huawei, cai na revisão de segurança nacional do CFIUS: uma prévia da década seguinte." },
        { year: 2010, title: "A HP fecha o negócio", detail: "12 de abril de 2010: a HP conclui a aquisição a US$ 7,90 por ação em dinheiro, um enterprise value de cerca de US$ 2,7 bilhões, como a HP anunciou, e cerca de US$ 3,15 bilhões no total pelas ações da 3Com, como diz o documento de fechamento, apontando a H3C e as redes da 3Com contra a Cisco; a marca se dissolve na HP Networking, e o braço chinês mais tarde ancora a H3C controlada pela Tsinghua Unigroup.", sourceNote: "Dois números, duas medidas, ambos lidos em 25/10/2026. O anúncio da HP de 11 de novembro de 2009, arquivado na SEC no processo da 3Com: \"$7.90 per share in cash or an enterprise value of approximately $2.7 billion\" (US$ 7,90 por ação em dinheiro, ou enterprise value de cerca de US$ 2,7 bilhões). O Form 8-K da 3Com de 12 de abril de 2010: a fusão entrou em vigor nesse dia, cada ação foi convertida em US$ 7,90 em dinheiro, e o valor total pago por todas as ações ordinárias da 3Com foi de cerca de US$ 3,15 bilhões." },
      ],
      products: [
        { name: "Adaptadores EtherLink", what: "As placas que puseram a Ethernet no PC, entre os produtos de rede de maior volume da época." },
        { name: "SuperStack e CoreBuilder", what: "As linhas de switches empilháveis e corporativos da expansão das LANs nos anos 1990." },
        { name: "Palm (1997–2000)", what: "O handheld que chegou com a US Robotics e, por um tempo, ofuscou todo o resto da casa." },
      ],
      innovations: [
        { title: "Comercializar um padrão aberto", detail: "A 3Com provou a receita que toda esta indústria segue: dar o padrão de graça e ganhar na implementação. O fundador vendeu ao mercado a ideia de abertura antes de vender uma única placa." },
        { title: "Ethernet no desktop", detail: "Transceivers na placa e a economia do slot de PC transformaram a Ethernet de infraestrutura predial em commodity por mesa." },
      ],
      markets: [
        "A linhagem da 3Com segue dentro do portfólio de redes da HPE e no mercado chinês da H3C; o verdadeiro monumento dela é que a porta que ela comercializou se chama simplesmente Ethernet em todo lugar.",
      ],
      analyst: [
        "Nas categorias de adaptadores e de redes para pequenas e médias empresas do fim dos anos 80 e dos anos 90, a 3Com era a líder de volume que as avaliações davam como certa: o contrapeso à Cisco abaixo do núcleo corporativo, até as categorias se fundirem por cima dela.",
      ],
    },
  },
};

/**
 * Overlays by locale. Only locales with authored prose appear. Read through
 * src/lib/vendorLocale.ts (localizePartnerVendor, localizeProfile), never
 * directly by a page, so the "facts stay English" rule lives in one function.
 */
export const VENDOR_OVERLAYS: Record<string, Record<string, PartnerVendorOverlay>> = {
  // The core entries above plus the eight translation shards; a slug defined twice stops the build.
  "pt-BR": mergeShards(PT_BR, PT_BR_SHARDS),
};
