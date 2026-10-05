// ============================================================================
// src/content/about/earlier-sites.ts
// ----------------------------------------------------------------------------
// THE EARLIER SITES, AS THE INTERNET ARCHIVE KEPT THEM (PRIME, 2026-10-03).
// The inventory behind /about/earlier-sites: every archived page of nutzmann.net
// and ntz.com.br that was captured, printed and catalogued on 2026-10-03 from
// the Wayback Machine (web.archive.org), one entry per page with the capture
// timestamp the archive actually served. Generated from the capture logs of
// that session (canon: BUILD-earlier-sites-captured-and-published-20261003);
// the narrative copy lives in the "earlierSites" message namespace, this file
// holds only facts: file, title as rendered, original URL, capture timestamp.
// Titles are the pages' own <title> strings, in the original Portuguese, with
// their original typos, because an inventory does not edit its evidence.
// ============================================================================

/** One archived page: its path on the original site, its own title, the URL the
 *  archive captured and the 14-digit UTC timestamp (YYYYMMDDhhmmss) it served. */
export interface ArchivedPage {
  /** Path relative to the era folder of the capture (e.g. "acervo/ac_geral.htm"). */
  file: string;
  /** The page's own <title>, as rendered; empty when the page had none. */
  title: string;
  /** The original URL as archived (scheme, host and port as the archive recorded them). */
  original: string;
  /** Wayback capture timestamp, UTC, YYYYMMDDhhmmss. */
  captured: string;
}

/** A run of captures that share one design and one purpose on one domain. */
export interface ArchivedEra {
  /** Stable id, also the message-key suffix for this era's copy (earlierSites.<id>.*). */
  id: "nn-2004" | "nn-later" | "ntz-2013" | "ntz-2018" | "ntz-prev";
  /** The domain the captures belong to. */
  domain: "nutzmann.net" | "ntz.com.br";
  /** First and last capture in this inventory, YYYY-MM-DD. */
  from: string;
  to: string;
  /** The pages, index first, then alphabetical by file. */
  pages: ArchivedPage[];
}

/** The day every capture below was read from the archive. Quoted on the page as the access date. */
export const ARCHIVE_READ_DATE = "2026-10-03";

/** The year of the first capture of nutzmann.net (25 August 2004); the page derives the sites' age from it. */
export const FIRST_CAPTURE_YEAR = 2004;

/** The archive URL of one page: the Wayback prefix, the served timestamp and the original URL. */
export function waybackUrl(page: ArchivedPage): string {
  return `https://web.archive.org/web/${page.captured}/${page.original}`;
}

/** YYYYMMDDhhmmss to YYYY-MM-DD, for display. */
export function captureDate(page: ArchivedPage): string {
  return `${page.captured.slice(0, 4)}-${page.captured.slice(4, 6)}-${page.captured.slice(6, 8)}`;
}

/** The inventory, in the order the page presents the eras. */
/** The inventory, in the order the page presents the eras. */
export const ARCHIVED_ERAS: readonly ArchivedEra[] = [
  {
    id: "nn-2004", domain: "nutzmann.net", from: "2004-08-25", to: "2005-02-27",
    pages: [
      { file: "index.html", title: "nutzmann.net", original: "http://nutzmann.net:80/", captured: "20040825070001" },
      { file: "acervo.htm", title: "cases", original: "http://nutzmann.net:80/acervo.htm", captured: "20041009113926" },
      { file: "acervo/ac_certificacoes.htm", title: "acervo", original: "http://nutzmann.net:80/acervo/ac_certificacoes.htm", captured: "20050209013121" },
      { file: "acervo/ac_distribuidores.htm", title: "acervo", original: "http://nutzmann.net:80/acervo/ac_distribuidores.htm", captured: "20050209013312" },
      { file: "acervo/ac_documentacao.htm", title: "acervo", original: "http://nutzmann.net:80/acervo/ac_documentacao.htm", captured: "20050209013446" },
      { file: "acervo/ac_fabricantes.htm", title: "acervo", original: "http://nutzmann.net:80/acervo/ac_fabricantes.htm", captured: "20050221210715" },
      { file: "acervo/ac_geral.htm", title: "acervo", original: "http://nutzmann.net:80/acervo/ac_geral.htm", captured: "20050222192415" },
      { file: "acervo/ac_revendas.htm", title: "acervo", original: "http://nutzmann.net:80/acervo/ac_revendas.htm", captured: "20050223060651" },
      { file: "acervo/ac_seguranca.htm", title: "acervo", original: "http://nutzmann.net:80/acervo/ac_seguranca.htm", captured: "20050223185523" },
      { file: "acervo/ac_servicos.htm", title: "acervo", original: "http://nutzmann.net:80/acervo/ac_servicos.htm", captured: "20050224051429" },
      { file: "acervo_menu.htm", title: "Documento sem título", original: "http://nutzmann.net:80/acervo_menu.htm", captured: "20041021065735" },
      { file: "atuacao.htm", title: "atuacao", original: "http://nutzmann.net:80/atuacao.htm", captured: "20041027064314" },
      { file: "bitsandbytes.htm", title: "bitsebytes", original: "http://nutzmann.net:80/bitsandbytes.htm", captured: "20041009131549" },
      { file: "cases.htm", title: "cases", original: "http://nutzmann.net:80/cases.htm", captured: "20041009113125" },
      { file: "cases_menu.htm", title: "Documento sem título", original: "http://nutzmann.net:80/cases_menu.htm", captured: "20041010121326" },
      { file: "comunicredes.htm", title: "comunicredes", original: "http://nutzmann.net:80/comunicredes.htm", captured: "20041027224423" },
      { file: "contato.htm", title: "contato", original: "http://nutzmann.net:80/contato.htm", captured: "20041010153051" },
      { file: "empresa.htm", title: "empresa", original: "http://nutzmann.net:80/empresa.htm", captured: "20041009112659" },
      { file: "empresa_menu.htm", title: "Documento sem título", original: "http://nutzmann.net:80/empresa_menu.htm", captured: "20041210003252" },
      { file: "equipe.htm", title: "equipe", original: "http://nutzmann.net:80/equipe.htm", captured: "20041027081607" },
      { file: "inferior.htm", title: "Documento sem título", original: "http://nutzmann.net:80/inferior.htm", captured: "20041009113220" },
      { file: "missao.htm", title: "missão", original: "http://nutzmann.net:80/missao.htm", captured: "20050207103703" },
      { file: "missao_menu.htm", title: "Documento sem título", original: "http://nutzmann.net:80/missao_menu.htm", captured: "20050225010643" },
      { file: "parceiros.htm", title: "parceiros", original: "http://nutzmann.net:80/parceiros.htm", captured: "20050207104952" },
      { file: "parceiros_menu.htm", title: "Documento sem título", original: "http://nutzmann.net:80/parceiros_menu.htm", captured: "20050227162117" },
      { file: "principal.htm", title: "principal", original: "http://nutzmann.net:80/principal.htm", captured: "20041009091654" },
      { file: "privacidade.htm", title: "privacidade", original: "http://nutzmann.net:80/privacidade.htm", captured: "20050225144033" },
      { file: "servicos.htm", title: "servicos", original: "http://nutzmann.net:80/servicos.htm", captured: "20041009114304" },
      { file: "servicos_menu.htm", title: "Documento sem título", original: "http://nutzmann.net:80/servicos_menu.htm", captured: "20041021114953" },
      { file: "solucoes.htm", title: "solucoes", original: "http://nutzmann.net:80/solucoes.htm", captured: "20041009112300" },
      { file: "solucoes_menu.htm", title: "Documento sem título", original: "http://nutzmann.net:80/solucoes_menu.htm", captured: "20041021134542" },
      { file: "termos.htm", title: "termos", original: "http://nutzmann.net:80/termos.htm", captured: "20050225231835" },
      { file: "topo.htm", title: "Nützmann", original: "http://nutzmann.net:80/topo.htm", captured: "20041009092332" },
    ],
  },
  {
    id: "nn-later", domain: "nutzmann.net", from: "2005-02-01", to: "2021-06-09",
    pages: [
      { file: "2005-02-01/index.html", title: "Nützmann Networks - Redes e Telecomunicações", original: "http://nutzmann.net/", captured: "20050201091724" },
      { file: "2005-02-01/principal.htm", title: "principal", original: "http://nutzmann.net:80/principal.htm", captured: "20050204065139" },
      { file: "2005-02-01/topo.htm", title: "Nützmann", original: "http://nutzmann.net:80/topo.htm", captured: "20050204070813" },
      { file: "2006-01-31/index.html", title: "Nützmann Networks - Redes e Telecomunicações", original: "http://nutzmann.net/", captured: "20060131223909" },
      { file: "2006-01-31/principal.htm", title: "principal", original: "http://nutzmann.net:80/principal.htm", captured: "20050506060006" },
      { file: "2006-01-31/topo.htm", title: "Nützmann", original: "http://nutzmann.net:80/topo.htm", captured: "20050204070813" },
      { file: "2007-06-22/index.html", title: "Nützmann Networks - Redes e Telecomunicações", original: "http://nutzmann.net/", captured: "20070622122220" },
      { file: "2007-06-22/principal.htm", title: "principal", original: "http://nutzmann.net:80/principal.htm", captured: "20050506060006" },
      { file: "2007-06-22/topo.htm", title: "Nützmann", original: "http://nutzmann.net:80/topo.htm", captured: "20050204070813" },
      { file: "2010-12-29_index.html", title: "N T Z - Consultoria em Tecnologias de Comunicação e Segurança em Rede", original: "http://nutzmann.net/", captured: "20101229200707" },
      { file: "2011-01-29_index.html", title: "N T Z - Consultoria em Tecnologias de Comunicação e Segurança em Rede", original: "http://nutzmann.net/", captured: "20110129065529" },
      { file: "2013-06-14_index.html", title: "ntz.com.br", original: "http://nutzmann.net/", captured: "20130614091029" },
      { file: "2014-01-02_index.html", title: "Nützmann Networks | Networks bringing together interests, thoughts and ideas. Connecting people.", original: "http://nutzmann.net/", captured: "20140102195410" },
      { file: "2014-01-31_post-p9.html", title: "Engenharia de Redes | Nützmann Networks", original: "http://nutzmann.net/?p=9", captured: "20140131100623" },
      { file: "2014-03-08_post-p1.html", title: "Engenharia de Redes", original: "http://nutzmann.net/?p=1", captured: "20140308110508" },
      { file: "2015-09-28_index.html", title: "Engenharia de Redes", original: "http://nutzmann.net/", captured: "20150928174302" },
      { file: "2016-01-11_index.html", title: "Engenharia de Redes", original: "http://nutzmann.net/", captured: "20160111011117" },
      { file: "2017-06-25_index.html", title: "Engenharia de Redes", original: "http://nutzmann.net/", captured: "20170625221910" },
      { file: "2021-06-09_www_index.html", title: "Engenharia de Redes", original: "http://www.nutzmann.net/", captured: "20210609052251" },
    ],
  },
  {
    id: "ntz-2013", domain: "ntz.com.br", from: "2013-05-18", to: "2017-05-19",
    pages: [
      { file: "index.html", title: "NTZ :: Consultoria em Tecnologia e Operações : Serviços Especializados : Comunicação em Redes : Segurança : Informática : Computadores : Telecomunicação : Interoperabilidade : Compatibilidade : Integração : Telecomunicaçõe : Gigabit : Ethernet : NAC : IDS : IPS : Firewall : VPN : Cisco : Enterasys : Juniper : Sniffer : Wireshark :", original: "http://ntz.com.br/", captured: "20130518185907" },
      { file: "acervo.html", title: "NTZ Tecnologia :: Acervo", original: "http://ntz.com.br/acervo.html", captured: "20160821103149" },
      { file: "atuacao.html", title: "NTZ Tecnologia :: Áreas de Atuação e Clientes", original: "http://ntz.com.br/atuacao.html", captured: "20161218142304" },
      { file: "bitsandbytes.html", title: "NTZ Tecnologia :: Calculadora e conversão de bits e bytes", original: "http://ntz.com.br/bitsandbytes.html", captured: "20130802011252" },
      { file: "cases.html", title: "NTZ Tecnologia :: Comunicações em Rede :: Gestão de Conhecimento :: Telecomunicações :: Consultoria Técnica e Operacional :: Serviços Profissionais Especializados", original: "http://ntz.com.br/cases.html", captured: "20130802054001" },
      { file: "certificados.html", title: "NTZ Tecnologia :: Certificação", original: "http://ntz.com.br/certificados.html", captured: "20130802060747" },
      { file: "certificados/CCNA.html", title: "Certificação Profissional", original: "http://ntz.com.br/certificados/CCNA.html", captured: "20160305181032" },
      { file: "consultoria.html", title: "NTZ Tecnologia :: Comunicação em Rede : Segurança da Informação : Informática", original: "http://ntz.com.br/consultoria.html", captured: "20130802021509" },
      { file: "consultoria_menu.html", title: "Documento sem título", original: "http://ntz.com.br/consultoria_menu.html", captured: "20131213191843" },
      { file: "contato.html", title: "NTZ Tecnologia :: Contato", original: "http://ntz.com.br/contato.html", captured: "20130802075111" },
      { file: "empresa.html", title: "NTZ Tecnologia :: Comunicação em Rede : Segurança da Informação : Informática", original: "http://ntz.com.br/empresa.html", captured: "20130802020047" },
      { file: "empresa_menu.html", title: "Menu da página http://www.ntz.com.br/empresa.html", original: "http://ntz.com.br/empresa_menu.html", captured: "20131213191722" },
      { file: "footer.html", title: "Footer http://ntz.com.br/", original: "http://ntz.com.br/footer.html", captured: "20130806202737" },
      { file: "header.html", title: "Header http://www.ntz.com.br/", original: "http://ntz.com.br/header.html", captured: "20131213184329" },
      { file: "homepage-by-year/2014-01-07_index.html", title: "NTZ :: Consultoria em Tecnologia e Operações : Serviços Especializados : Comunicação em Redes : Segurança : Informática : Computadores : Telecomunicação : Interoperabilidade : Compatibilidade : Integração : Telecomunicaçõe : Gigabit : Ethernet : NAC : IDS : IPS : Firewall : VPN : Cisco : Enterasys : Juniper : Sniffer : Wireshark :", original: "http://ntz.com.br/", captured: "20140107094112" },
      { file: "homepage-by-year/2015-06-02_index.html", title: "NTZ :: Consultoria em Tecnologia e Operações : Serviços Especializados : Comunicação em Redes : Segurança : Informática : Computadores : Telecomunicação : Interoperabilidade : Compatibilidade : Integração : Telecomunicaçõe : Gigabit : Ethernet : NAC : IDS : IPS : Firewall : VPN : Cisco : Enterasys : Juniper : Sniffer : Wireshark :", original: "http://ntz.com.br/", captured: "20150602225020" },
      { file: "homepage-by-year/2016-01-10_index.html", title: "NTZ :: Consultoria em Tecnologia e Operações : Serviços Especializados : Comunicação em Redes : Segurança : Informática : Computadores : Telecomunicação : Interoperabilidade : Compatibilidade : Integração : Telecomunicaçõe : Gigabit : Ethernet : NAC : IDS : IPS : Firewall : VPN : Cisco : Enterasys : Juniper : Sniffer : Wireshark :", original: "http://ntz.com.br/", captured: "20160110093706" },
      { file: "homepage-by-year/2017-05-19_index.html", title: "NTZ Comunicações e Segurança em Rede - Home", original: "http://ntz.com.br/", captured: "20170519140148" },
      { file: "laboratorio_de_rede.html", title: "NTZ Laboratório de Rede :: Comunicação em Rede : Segurança da Informação : Ethernet : Switches : Roteadores : Firewalls : Planejamento : Instalação : Administração : Operação", original: "http://ntz.com.br/laboratorio_de_rede.html", captured: "20160821105230" },
      { file: "missao.html", title: "NTZ Tecnologia :: Missão e Valores", original: "http://ntz.com.br/missao.html", captured: "20130802060533" },
      { file: "missao_menu.html", title: "Menu da página http://www.ntz.com.br/missao.html", original: "http://ntz.com.br/missao_menu.html", captured: "20131213193509" },
      { file: "parceiros.html", title: "NTZ Tecnologia ::", original: "http://ntz.com.br/parceiros.html", captured: "20160305184450" },
      { file: "portfolio.html", title: "NTZ Tecnologia :: Telecom : TI : Convergência", original: "http://ntz.com.br/portfolio.html", captured: "20130802022759" },
      { file: "privacidade.html", title: "NTZ Tecnologia :: Privacidade", original: "http://ntz.com.br/privacidade.html", captured: "20131205041338" },
      { file: "redes_menu.html", title: "Menu da página http://www.ntz.com.br/redes.html", original: "http://ntz.com.br/redes_menu.html", captured: "20131213184430" },
      { file: "servicos.html", title: "NTZ Tecnologia :: Comunicação em Rede : Segurança da Informação : Informática", original: "http://ntz.com.br/servicos.html", captured: "20130802023727" },
      { file: "servicos_menu.html", title: "Menu da página de serviços da NTZ", original: "http://ntz.com.br/servicos_menu.html", captured: "20131213190229" },
      { file: "tecnologia.html", title: "NTZ Tecnologia :: Comunicações em rede", original: "http://ntz.com.br/tecnologia.html", captured: "20130802005048" },
      { file: "termos.html", title: "NTZ Tecnologia :: Termos de Utilização do Site e das Informações Nele Contidas", original: "http://ntz.com.br/termos.html", captured: "20131205041355" },
      { file: "treinamentos.html", title: "NTZ Treinamentos :: Comunicação em Rede : Segurança da Informação : Ethernet : Switches : Roteadores : Firewalls : Planejamento : Instalação : Administração : Operação", original: "http://ntz.com.br/treinamentos.html", captured: "20140625034809" },
    ],
  },
  {
    id: "ntz-2018", domain: "ntz.com.br", from: "2017-10-03", to: "2018-12-25",
    pages: [
      { file: "index.html", title: "NTZ Comunicações e Segurança em Rede - Home", original: "http://ntz.com.br/index.html", captured: "20171003043058" },
      { file: "2018-08-04_index.html", title: "NTZ Comunicações e Segurança em Rede - Home", original: "http://ntz.com.br/", captured: "20180804003127" },
      { file: "competencias.html", title: "Competências - NTZ Comunicações e Segurança em Rede", original: "http://ntz.com.br/competencias.html", captured: "20181225154529" },
      { file: "consultoria-e-serviccedilos.html", title: "Consultoria e Serviços - NTZ Comunicações e Segurança em Rede", original: "http://ntz.com.br/consultoria-e-serviccedilos.html", captured: "20180815195947" },
      { file: "contrate.html", title: "Contrate - NTZ Comunicações e Segurança em Rede", original: "http://ntz.com.br/contrate.html", captured: "20180815174632" },
      { file: "sobre.html", title: "Sobre - NTZ Comunicações e Segurança em Rede", original: "http://ntz.com.br/sobre.html", captured: "20180815180106" },
    ],
  },
  {
    id: "ntz-prev", domain: "ntz.com.br", from: "2003-06-25", to: "2008-01-28",
    pages: [
      { file: "2003-06-25_produtos.htm", title: "Untitled Document", original: "http://www.ntz.com.br:80/produtos.htm", captured: "20030625102553" },
      { file: "2003-07-18/index.html", title: "Plasticos NTZ", original: "http://www.ntz.com.br:80/", captured: "20030718104439" },
      { file: "2003-07-18/menu.htm", title: "menu", original: "http://www.ntz.com.br:80/menu.htm", captured: "20030806093014" },
      { file: "2003-07-18/principal.htm", title: "principal", original: "http://www.ntz.com.br:80/principal.htm", captured: "20030806094107" },
      { file: "2004-12-06_default.asp.html", title: "Plásticos NTZ", original: "http://www.ntz.com.br:80/default.asp", captured: "20041206204944" },
      { file: "2008-01-28_index.html", title: "Plásticos NTZ", original: "http://www.ntz.com.br:80/", captured: "20080128165251" },
    ],
  },
];

/** Total pages across every era, for the page lede. */
export const ARCHIVED_PAGE_COUNT = ARCHIVED_ERAS.reduce((n, e) => n + e.pages.length, 0);

// ============================================================================
// THE THREE TOOLS, ON THE RECORD (PRIME, 2026-10-05 02:31: "link to a locally-stored record / rendering /
// reproduction ... and a link to the Internet Archive page on each individual record"). The 2004 home page
// (principal.htm, captured 2004-10-09) linked three tools of its own: /bitsandbytes.htm, /ipsubnet.htm and
// /pinout.htm. What the archive holds of each was read from the Wayback CDX index on 2026-10-05
// (web.archive.org/cdx/search/cdx?url=nutzmann.net/* and ...ntz.com.br/*): the bits-and-bytes calculator was
// captured nine times on nutzmann.net (2004-10-09 to 2013-12-04) and seventeen times on ntz.com.br
// (2013-08-02 to 2017-06-13); the other two were requested four times each between October 2004 and May 2005
// and the archive recorded a 404 every time, so no copy of either page exists anywhere. The 2013 home page
// (index.html, captured 2013-05-18) kept the bits-and-bytes calculator as its own page and linked outside
// pages under the other two names: www.subnet-calculator.com and www.ertyu.org/steven_nikkel/ethernetcables.html.
// The renderings under /archive/earlier-sites/ were made here on 2026-10-05 from the captures saved on
// 2026-10-03 (self-contained HTML, rendered offline in Chromium at 900 or 1024 px; images the archive never
// stored appear as gaps, which is the honest picture of what survives).
// ============================================================================

/** One archive record behind a tool: a capture (status 200, with a rendering) or a refusal (404, no copy). */
export interface ToolArchiveRecord {
  /** The domain the record belongs to. */
  domain: "nutzmann.net" | "ntz.com.br";
  /** The original URL as the archive recorded it. */
  original: string;
  /** The capture timestamp (UTC, YYYYMMDDhhmmss) this record links to: the first capture, or the first 404. */
  captured: string;
  /** What the archive answered: a stored page, or a recorded 404. */
  status: 200 | 404;
  /** How many captures the archive holds (status 200 only). */
  captures?: number;
  /** The last capture, YYYYMMDDhhmmss (status 200 only). */
  lastCaptured?: string;
  /** Every request the archive made and its 404 answer, YYYYMMDDhhmmss (status 404 only). */
  attempts?: string[];
  /** The rendering made here from the saved capture, under /archive/earlier-sites/ (status 200 only). */
  rendering?: string;
}

/** One of the three tools: its message key, the records behind it, where the idea lives on this site today. */
export interface ToolRecord {
  key: "bits" | "ip" | "pinout";
  records: ToolArchiveRecord[];
  /** The 2013 home page's outside link under the tool's name, when the tool was no longer the site's own. */
  outsideLink2013?: string;
  /** The page on this site that carries the idea today (locale-free). */
  today: string;
}

/** The capture of the 2004 home page body (principal.htm) that links the three tools, and its rendering. */
export const HOME_2004: ToolArchiveRecord = {
  domain: "nutzmann.net",
  original: "http://nutzmann.net:80/principal.htm",
  captured: "20041009091654",
  status: 200,
  rendering: "/archive/earlier-sites/nutzmann-net-2004-10-09-principal.png",
};

/** The capture of the 2013 home page (index.html) and its rendering. */
export const HOME_2013: ToolArchiveRecord = {
  domain: "ntz.com.br",
  original: "http://ntz.com.br/",
  captured: "20130518185907",
  status: 200,
  rendering: "/archive/earlier-sites/ntz-com-br-2013-05-18-index.png",
};

/** The day the CDX index was read for the records below. */
export const TOOL_RECORDS_READ_DATE = "2026-10-05";

export const TOOL_RECORDS: readonly ToolRecord[] = [
  {
    key: "bits",
    records: [
      { domain: "nutzmann.net", original: "http://nutzmann.net:80/bitsandbytes.htm", captured: "20041009131549", status: 200, captures: 9, lastCaptured: "20131204114346", rendering: "/archive/earlier-sites/nutzmann-net-2004-10-09-bitsandbytes.png" },
      { domain: "ntz.com.br", original: "http://ntz.com.br/bitsandbytes.html", captured: "20130802011252", status: 200, captures: 17, lastCaptured: "20170613164904", rendering: "/archive/earlier-sites/ntz-com-br-2013-08-02-bitsandbytes.png" },
    ],
    today: "/tools/bits-bytes",
  },
  {
    key: "ip",
    records: [
      { domain: "nutzmann.net", original: "http://nutzmann.net:80/ipsubnet.htm", captured: "20041009113804", status: 404, attempts: ["20041009113804", "20041209165241", "20050207163444", "20050506100108"] },
    ],
    outsideLink2013: "http://www.subnet-calculator.com/",
    today: "/tools/cidr",
  },
  {
    key: "pinout",
    records: [
      { domain: "nutzmann.net", original: "http://nutzmann.net:80/pinout.htm", captured: "20041009112525", status: 404, attempts: ["20041009112525", "20041209165649", "20050207164758", "20050506100205"] },
    ],
    outsideLink2013: "http://www.ertyu.org/steven_nikkel/ethernetcables.html",
    today: "/learn/structured-cabling",
  },
];

/** The archive URL of one tool record (the same form as waybackUrl, for a record rather than an inventory page). */
export function recordWaybackUrl(original: string, captured: string): string {
  return `https://web.archive.org/web/${captured}/${original}`;
}

// ============================================================================
// THE FLASH TOP BARS, REPRODUCED (PRIME, 2026-10-05 03:22: "versions of the old site's flash top animation. If you
// can faithfully reproduce them in modern ... technology"). PRIME's own files, from a backup dated 30 May 2013:
// barra2_topo.fla and five SWFs (Flash 5 format, 798 x 78 px, 12 frames per second, timeline animations with no
// script beyond a stop and a button to principal.htm). The 2004 nutzmann.net header (topo.htm) embedded
// imagens/barra2_topo.swf (620 frames, 51.7 s, the Nützmann logo and taglines); the 2013 ntz.com.br home page
// embedded images/topbar.swf (568 frames, 47.3 s, the NTZ Tecnologia logo and the same taglines). Two more SWFs
// in the backup are variants of the 2013 bar (one identical to topbar_old.swf, one with a different logo text).
// Reproduction, 2026-10-05: every frame rendered from the SWF by the JPEXS Free Flash Decompiler 24.0.1
// (timeline, shapes, embedded fonts and the lossless background bitmap), then encoded with ffmpeg at the
// original 12 frames per second as WebM (VP9) and MP4 (H.264), with the first frame as the poster. The
// clickable button of the original is not reproduced; nothing else is changed. Served from this origin.
// ============================================================================

/** One reproduced Flash bar. */
export interface FlashBar {
  /** The era it belongs to (the es-era section it renders in). */
  era: ArchivedEra["id"];
  /** The SWF's file name as the backup names it, and the page that embedded it. */
  file: string;
  embeddedBy: string;
  /** Frames, frames per second, pixel size: read from the SWF header. */
  frames: number;
  fps: number;
  width: number;
  height: number;
  /** The reproductions, under /archive/earlier-sites/flash/: the two video encodes, the animated GIF, the first frame. */
  webm: string;
  mp4: string;
  gif: string;
  poster: string;
}

export const FLASH_BARS: readonly FlashBar[] = [
  { era: "nn-2004", file: "barra2_topo.swf", embeddedBy: "topo.htm", frames: 620, fps: 12, width: 798, height: 78, webm: "/archive/earlier-sites/flash/barra2_topo.webm", mp4: "/archive/earlier-sites/flash/barra2_topo.mp4", gif: "/archive/earlier-sites/flash/barra2_topo.gif", poster: "/archive/earlier-sites/flash/barra2_topo-poster.png" },
  { era: "ntz-2013", file: "topbar.swf", embeddedBy: "index.html", frames: 568, fps: 12, width: 798, height: 78, webm: "/archive/earlier-sites/flash/topbar.webm", mp4: "/archive/earlier-sites/flash/topbar.mp4", gif: "/archive/earlier-sites/flash/topbar.gif", poster: "/archive/earlier-sites/flash/topbar-poster.png" },
];
