// ============================================================================
// src/content/vendors/overlays/pt-BR/shard-6.ts
// ----------------------------------------------------------------------------
// pt-BR INDUSTRY OVERLAYS, SHARD 6 of 8 (translation pass planned 2026-10-25;
// see the round 2 TRANSLATION-PLAN). One shard per translator, so parallel
// work never edits the same file. Each entry is keyed by record slug and holds
// ONLY translated prose (PartnerVendorOverlay); facts stay in partners.ts and
// profiles/*.ts. Check with: npx tsx scripts/report-industry-translation.mts --strict
//
// Records assigned to this shard (~26,965 words):
// akamai, amd, arista, avaya, ax4b, bematech, borland, brightcloud, commscope,
// cpm-braxis, credly, ec-council, edx, elastic, equinix, ericsson, firemon,
// fujitsu, getronics, goldnet, honeywell, ibm, imperva-thales, kemp, madge,
// multiplus, netcraft, opendns, oracle, petrobras, readytech, sap,
// security4it, sisco, sun-microsystems, synoptics, tempest, tippingpoint, tld-
// hub, trend-micro, trustwave, tsmc, usp, wztech, xz-utils
//
// Translated 2026-10-26 (pt-BR machine-draft state: written with AI, reviewed
// gradually; never labelled reviewed). Profile objects are complete copies of
// the English profiles with only the prose fields replaced, so every year,
// company, founder, personal marker and href is the English one. Quotations
// that the English presents as a source's words, source titles and filing
// names stay verbatim (with a short Portuguese gloss where useful); product
// and company names keep their spelling. Spaced hyphens used as dashes in the
// English become commas, colons or parentheses in Portuguese.
// ============================================================================

import type { PartnerVendorOverlay } from "@/content/vendors/localized";

/** Translated prose for this shard's records, keyed by slug. */
export const SHARD_6: Record<string, PartnerVendorOverlay> = {
  // ---- akamai: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "akamai": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Akamai Technologies",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Respondeu a uma pergunta de Tim Berners-Lee sobre congestionamento, e a resposta virou a maior parte de como a web é entregue.",
    intro: "A Akamai foi constituída em 20 de agosto de 1998 por Tom Leighton, professor de matemática aplicada do MIT, e Danny Lewin, seu aluno de pós-graduação, com Jonathan Seelig, Preetish Nijhawan e Randall Kaplan. Nasceu como resposta a um desafio que Tim Berners-Lee tinha lançado ao MIT: a web ia ficar congestionada, e alguém precisava descobrir o que fazer a respeito.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "O perfil abaixo cobre a fundação, o consistent hashing, a abertura de capital de 1999, o 11 de setembro de 2001 e a passagem da entrega de conteúdo para segurança e computação.",
      "Dois detalhes ficam fora desse relato. A propriedade intelectual foi licenciada do MIT, e não pertencia de saída à empresa, o que é o arranjo comum para um spin-off universitário e uma restrição real para uma empresa nova. E o negócio de segurança foi montado tanto por compras quanto por extensão (a Prolexic, para limpeza de tráfego de negação de serviço, em 2014, e mais tarde a Guardicore, para segmentação) sobre uma capacidade que já existia para a entrega.",
    ],
    // Profile: complete copy of profiles/akamai.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "akamai",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          company: "Akamai Technologies",
          year: 1998,
          place: "Cambridge, Massachusetts",
          founders: ["Tom Leighton", "Danny Lewin", "Jonathan Seelig", "Preetish Nijhawan", "Randall Kaplan"],
          story: "O problema veio do fim do corredor. Tim Berners-Lee, então no MIT, descreveu o que vinha sendo chamado de World Wide Wait: uma página popular desabava sob a própria audiência, porque cada pedido por ela viajava até um único servidor. Tom Leighton, que liderava o grupo de ciência da computação teórica do Laboratory for Computer Science do MIT, e seu aluno de pós-graduação Danny Lewin passaram dois anos tratando aquilo como um problema de matemática, e não de engenharia. A resposta de Lewin virou sua dissertação de mestrado. Os dois se inscreveram na competição de empreendedorismo de US$ 50.000 do MIT em 1997 e não venceram, o que acabou não importando, e constituíram a empresa em 20 de agosto de 1998. O nome quer dizer esperto em havaiano.",
          sourceNote: "Lista de fundadores segundo os históricos da empresa; além de Leighton e Lewin, as fontes variam em quem citam e em que ordem. O ano do título de Lewin aparece tanto como SM '97 quanto como SM '98 nas próprias publicações do MIT.",
        },
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        { year: 1997, title: "Consistent hashing", detail: "O trabalho de dissertação de Lewin, desenvolvido com Leighton, sobre como distribuir pedidos por um conjunto variável de servidores de modo que acrescentar ou retirar um deles mova o menor número possível de chaves. No ano seguinte, ganhou o prêmio do MIT de melhor apresentação de dissertação de mestrado." },
        { year: 1998, title: "Constituição", detail: "Fundada em 20 de agosto em Cambridge, depois de uma inscrição numa competição de planos de negócio que não venceu, mas atraiu capital de risco." },
        { year: 1999, title: "March Madness, e depois o IPO", detail: "A primeira prova pública foi o torneio universitário de basquete dos Estados Unidos: sessenta e quatro times, poucos dias e uma audiência que chegava toda de uma vez. A empresa abriu capital na NASDAQ em 29 de outubro, levantando cerca de US$ 234 milhões. As ações abriram a US$ 26 e fecharam o primeiro dia acima de US$ 145." },
        { year: 2001, title: "O crash, e o 11 de setembro", detail: "A ação caiu de mais de US$ 300 para menos de US$ 5 enquanto o colapso das pontocom seguia seu curso. Em 10 de setembro, os executivos ficaram até tarde decidindo quem demitir. Na manhã seguinte, Danny Lewin foi morto a bordo do voo 11 da American Airlines, aos 31 anos; costuma-se considerá-lo a primeira pessoa morta nos atentados. No mesmo dia, a rede que ele tinha projetado sustentou sites de notícias durante o maior tráfego que eles já tinham visto, e a equipe que restou passou o dia concluindo integrações de emergência para editores cujos próprios servidores tinham caído.", sourceNote: "Voo, idade e o trabalho de integração de emergência segundo a página memorial da própria Akamai, a citação da Marconi Society e a cobertura da CNN na época. Lewin, ex-oficial das forças especiais israelenses, é amplamente apontado como alguém que tentou impedir o sequestro; esse relato se apoia em análise do gravador de voo e não está comprovado." },
        { year: 2005, title: "Speedera", detail: "A aquisição do concorrente mais próximo também encerrou o litígio de patentes entre as duas, um formato comum em infraestrutura: comprar um rival e comprar o fim de um processo ao mesmo tempo." },
        { year: 2017, title: "National Inventors Hall of Fame", detail: "Leighton e Lewin foram incluídos juntos, dezesseis anos depois da morte de Lewin, pelos algoritmos por trás da entrega de conteúdo." },
      ],
      // Products: names as the vendor writes them (descriptor words localised); descriptions translated.
      products: [
        { name: "FreeFlow, e o que virou EdgeSuite", what: "O serviço original: o editor reescrevia as URLs dos seus objetos pesados para que resolvessem para a Akamai, e as imagens e os vídeos vinham de um servidor perto do leitor, e não da origem." },
        { name: "Plataforma de edge delivery", what: "Cache e roteamento numa rede que chegou a dezenas de milhares de servidores dentro de redes de operadoras e provedores de acesso, e não num punhado de grandes data centers: a escolha de arquitetura que a distingue dos que chegaram depois." },
        { name: "Kona e App & API Protector", what: "Web application firewall e mitigação de DDoS entregues a partir da mesma edge, com o raciocínio de que uma rede que já termina a conexão é o lugar natural para inspecioná-la." },
        { name: "Segmentação Guardicore", what: "Adquirida em 2021, levou a empresa ao tráfego leste-oeste dentro do data center, um problema diferente daquele para o qual ela foi fundada." },
        { name: "Linode e computação conectada", what: "Adquirida em 2022, acrescentou computação em nuvem de uso geral a uma rede de entrega e pôs a empresa num mercado diante do qual ela antes ficava, e não dentro dele." },
      ],
      // Innovations: titles and details translated.
      innovations: [
        { title: "Consistent hashing", detail: "A contribuição fundadora, que há muito tempo ficou maior que a empresa. Distribuir as chaves num anel de modo que acrescentar ou retirar um servidor mova só uma pequena fração delas, em vez de embaralhar tudo de novo. Hoje é padrão em caches distribuídos, bancos de dados particionados em shards e load balancers construídos por gente que nunca pensou em entrega de conteúdo. Uma dissertação de mestrado virou infraestrutura." },
        { title: "Pôr servidores dentro das redes dos outros", detail: "Em vez de construir poucos data centers grandes, a Akamai instalou máquinas no fundo das redes de operadoras e provedores. Isso é mais difícil comercialmente do que tecnicamente, porque exige milhares de relações separadas, e é por isso que a rede está perto dos usuários em lugares que um desenho centralizado não alcança." },
        { title: "O mapeamento como sistema vivo", detail: "Decidir qual servidor de edge deve responder a um pedido é um problema contínuo de medição, e não uma configuração estática. A decisão de roteamento reage a congestionamentos e falhas no momento em que acontecem, e essa é a parte de fato difícil de copiar." },
        { title: "Entrega e defesa como uma só rede", detail: "A capacidade construída para absorver picos de tráfego legítimo também absorve os ilegítimos. A empresa que resolveu a multidão repentina descobriu que tinha construído o lugar natural para parar um ataque de negação de serviço, e o negócio de segurança decorreu do negócio de entrega, em vez de ser acoplado a ele." },
      ],
      // Market paragraphs: same count as the English.
      markets: [
        "Primeiro, distribuição de mídia e de software, os clientes que sentem um pico de tráfego como uma queda; depois, comércio, bancos e governo, e cada vez mais segurança corporativa. A lista inicial de clientes trazia Yahoo, Apple, CNN e Microsoft, o que descreve bem quem tinha um problema de escala em 1999.",
        "Hoje ela concorre com os que chegaram depois, com arquiteturas diferentes: provedores de nuvem que empacotam a entrega com as próprias plataformas, e empresas de edge criadas quando os problemas que a Akamai resolveu já tinham virado pressupostos. Sua posição distintiva continua sendo a profundidade da presença dentro das redes das operadoras, e não a amplitude de recursos.",
      ],
      // Analyst statements: same count as the English.
      analyst: [
        "Colocada de forma constante entre os líderes em entrega de conteúdo, e cada vez mais em proteção de aplicações web e APIs, o que reflete uma empresa que transformou a própria infraestrutura numa posição em segurança, em vez de comprar uma.",
        "A medida mais longa é que os algoritmos sobre os quais ela foi fundada são ensinados como ciência da computação geral, e não como tecnologia de uma empresa, e que os padrões de tráfego para os quais ela foi construída, todo mundo chegando ao mesmo tempo, são hoje a condição normal da web, e não uma exceção.",
      ],
    },
  },
  // ---- amd: pt-BR prose for the record (facts stay in the English record) ----
  "amd": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "AMD - a empresa que comprou a entrada na rede",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Fundada em 1969; adquiriu a Xilinx e a Pensando em 2022 para chegar ao adaptador de rede e à unidade de processamento de dados.",
    intro: "A Advanced Micro Devices foi fundada em 1969 por pessoas que tinham saído da Fairchild Semiconductor e passou cinco décadas como segunda fonte e, depois, como concorrente em processadores x86. Em 2022, concluiu duas aquisições em três meses que a levaram ao silício de rede: a Xilinx em fevereiro e a Pensando em maio.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "Vale nomear com precisão o que ela comprou, porque isso descreve para onde o processamento de pacotes foi. A Xilinx trouxe os field-programmable gate arrays e os engenheiros que projetam os serializadores de alta velocidade que estão por baixo de toda interface rápida. A Pensando trouxe as unidades de processamento de dados: uma interface de rede com um pipeline de pacotes programável e seu próprio complexo de processadores, rodando serviços que antes rodavam no servidor em que ela está espetada.",
      "É esse o formato da discussão atual sobre onde a rede termina. Uma unidade de processamento de dados faz firewall, criptografia e switching virtual no próprio adaptador, de modo que a fronteira entre o servidor e a rede deixa de ser o cabo e passa a ser uma linha traçada dentro da placa. Várias das funções de segurança descritas em outras partes deste site são candidatas a se mudar para lá.",
      "Há uma ironia na história da própria empresa que os marcos de fabricação tornam legível. O presidente de longa data da AMD é lembrado por insistir que homem de verdade tem fab (\"real men have fabs\"); mais tarde, a empresa se separou inteiramente da fabricação e projeta silício que não fabrica. O marco fabless deste site descreve o arranjo que ela acabou adotando.",
    ],
  },
  // ---- arista: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "arista": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Arista Networks",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Redes de data center e de campus em escala de nuvem (EOS).",
    intro: "A Arista Networks constrói redes de alto desempenho em escala de nuvem: switches e roteadores que rodam o sistema operacional programável EOS, amplamente adotados em data centers.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "A Red Education é parceira de treinamento autorizada da Arista e ministra o programa de certificação Arista Cloud Engineer (ACE), com índice de satisfação de clientes de 98%.",
    ],
    // Profile: complete copy of profiles/arista.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "arista",
      // Founding stories: place (geography localised) and story translated.
      foundings: [
        {
          company: "Arista Networks (founded as Arastra)",
          year: 2004,
          place: "Menlo Park, Califórnia",
          founders: ["Andy Bechtolsheim", "David Cheriton", "Ken Duda"],
          story: "A Arista é o que acontece quando o cofundador da Sun Microsystems decide que o switching Ethernet merece uma empresa de software. Andy Bechtolsheim e David Cheriton já tinham vendido a Granite Systems para a Cisco em 1996 (e, no caminho, assinado o primeiro cheque externo do Google), de modo que, quando fundaram a Arastra com Ken Duda em 2004, estavam atacando o negócio central do próprio comprador, de propósito. A tese: rodar uma única imagem limpa de sistema operacional, o EOS, com Linux comum por baixo e cada processo lendo estado compartilhado do SysDB, sobre silício de mercado, e deixar quem constrói nuvens programar a rede como programa os servidores ao lado. Quando Jayshree Ullal deixou a Cisco para dirigir a empresa em 2008, a fórmula estava pronta: conquistar o respeito dos engenheiros dos clientes, vender para quem constrói nuvens e deixar os incumbentes defenderem o passado.",
        },
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        { year: 2004, title: "Fundação da Arastra", detail: "Bechtolsheim, Cheriton e Duda começam a construir uma empresa de switches em torno de software: o EOS em binário único sobre silício de mercado, com o compartilhamento de estado do SysDB tornando o sistema reiniciável e programável. Um sistema operacional de rede projetado como software moderno, porque é um." },
        { year: 2008, title: "Ullal, e o 7100", detail: "Jayshree Ullal, que comandava o negócio multibilionário de switching da Cisco, torna-se CEO; a empresa, rebatizada de Arista, entrega a série 7100 para redes de trading de baixa latência. Os clientes que medem nanossegundos validam a tese do silício de mercado antes que os gigantes da nuvem a levem à escala." },
        { year: 2014, title: "IPO, e a Cisco ataca", detail: "A Arista abre capital na NYSE como ANET em junho; meses depois, a Cisco move ações de patente e de direito autoral contra a empresa dos seus ex-executivos. Foram quatro anos de processos na ITC respondidos com contornos entregues em software, a arquitetura do EOS provando sua agilidade, na prática, nos tribunais.", sourceNote: "Litígio e acordo segundo o registro público." },
        { year: 2016, title: "Os titãs da nuvem", detail: "Microsoft e Meta ancoram o negócio (cada uma informada por muito tempo, nos documentos da Arista, como cliente de mais de dez por cento) enquanto as fabrics de hiperescala se padronizam nas linhas 7050/7280/7500: leaf-spine em escala planetária, gerenciado como software porque é software." },
        { year: 2017, title: "Além do data center", detail: "Campus cognitivo: a Arista estende o EOS ao switching de campus e, com a aquisição da Mojo Networks (2018), ao Wi-Fi, levando o manual da nuvem à borda corporativa. No caminho, o CloudVision amadurece como plano de gerenciamento de toda a frota." },
        { year: 2018, title: "O acordo de US$ 400 milhões", detail: "O litígio com a Cisco termina em agosto, com a Arista pagando US$ 400 milhões e os dois lados recuando: caro, mas o impulso na nuvem sai intacto, e se encerra a grande rixa do setor naquela década.", sourceNote: "Valor do acordo segundo o registro público de agosto de 2018." },
        { year: 2024, title: "A candidata da fabric de IA", detail: "Plataformas de 800G, o spine 7800 e o argumento da Ethernet para IA (fabrics escalonadas, controle de congestionamento, a direção da Ultra Ethernet) posicionam a Arista como a campeã do silício de mercado contra o InfiniBand na briga de rede que define a época." },
      ],
      // Products: names as the vendor writes them (descriptor words localised); descriptions translated.
      products: [
        { name: "EOS", what: "O sistema operacional de rede único em todo o portfólio, baseado em Linux, centrado no SysDB e reiniciável por projeto: a própria tese de software, e o produto sobre o qual a empresa de fato se apoia." },
        { name: "Plataformas da série 7000", what: "As fabrics leaf-spine da nuvem de hiperescala (7050/7280/7500) até o spine de IA 7800: switching de data center e de IA sobre silício de mercado, do ToR ao chassi." },
        { name: "CloudVision", what: "O plano de gerenciamento e telemetria por streaming de estado: estado de toda a rede, automação e controle de mudanças, a frota operada como um único sistema." },
      ],
      // Innovations: titles and details translated.
      innovations: [
        { title: "O switch que nasce do software", detail: "A arquitetura SysDB do EOS, com todo o estado num banco de dados compartilhado e os processos reiniciáveis em volta dele, provou que um sistema operacional de rede podia ser projetado como software moderno, e que os operadores pagariam por essa diferença em escala." },
        { title: "O silício de mercado vingado", detail: "A Arista apostou que o silício de switching mais rápido viria da Broadcom e companhia, e não de impérios internos de ASIC: a aposta que encerrou, por uma época, a discussão entre silício próprio e de mercado e que hoje sustenta o avanço das fabrics Ethernet para IA." },
      ],
      // Market paragraphs: same count as the English.
      markets: [
        "O fabricante de switching da era da hiperescala e da IA: dominante nos data centers de nuvem ao lado dos seus clientes-âncora entre os titãs da nuvem, em expansão para campus e roteamento. A desafiante moderna que virou incumbente, com Cisco, Juniper e NVIDIA como referência competitiva.",
      ],
      // Analyst statements: same count as the English.
      analyst: [
        "Líder nas avaliações de redes de data center desde que a categoria ganhou sua forma moderna: o modelo de referência de EOS com silício de mercado para o qual o resto do mercado se moveu.",
        "A contemporânea que toda discussão de fabric neste site acaba tocando: leaf-spine, EVPN/VXLAN e o caso da Ethernet para IA são todos argumentos que a Arista apresentou ou levou ao mainstream.",
      ],
    },
  },
  // ---- avaya: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "avaya": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Avaya",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Comunicações corporativas: Aura, IP Office e contact center.",
    intro: "A Avaya constrói plataformas de comunicações corporativas e de contact center (a suíte Aura, o IP Office e a Experience Platform) e leva décadas de herança em engenharia de voz para as comunicações unificadas e a experiência do cliente.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "A Red Education mantém uma das agendas Avaya mais completas do seu catálogo: cursos de componentes centrais do Aura, administração do System Manager e do Communication Manager, integração e suporte do IP Office, Meetings Server, Messaging, Experience Portal e Call Center Elite, oferecidos nas suas cinco regiões, com turmas abertas praticamente toda semana.",
      "A Avaya foi separada da Lucent Technologies em 2000 e herdou a metade corporativa de uma linhagem que remonta, pela AT&T, aos Bell Labs. Passou duas vezes por reestruturação no Chapter 11, em 2017 e de novo, brevemente, em 2023, e hoje se concentra em comunicações e contact center para grandes empresas, cada vez mais entregues como serviços em nuvem e híbridos.",
    ],
    // Profile: complete copy of profiles/avaya.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "avaya",
      // Founding stories: place (geography localised) and story translated; the founders entry is a fact field and stays English.
      foundings: [
        {
          company: "Avaya",
          year: 2000,
          place: "Basking Ridge, Nova Jersey",
          founders: ["Spun off from Lucent Technologies"],
          story: "A Avaya nasceu carregando um século de herança telefônica. Quando a Lucent (ela própria o spin-off de 1996 da linhagem de sistemas da AT&T e dos Bell Labs) se desfez do seu negócio de comunicações corporativas em outubro de 2000, os PABXs, os call centers e os sistemas de mensagens descendentes da Western Electric viraram uma empresa independente. A Avaya herdou a base instalada da telefonia corporativa exatamente no momento em que a voz se transformava em software, e toda a sua história seguinte (private equity, o leilão da Nortel, duas falências, a virada para a nuvem) é o drama de carregar essa herança através da transição para IP.",
        },
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        { year: 2000, title: "Separada da Lucent", detail: "O negócio de comunicações corporativas da Lucent Technologies abre capital como Avaya: DNA do Bell System, agora vendendo PABXs e contact centers sob bandeira própria enquanto o VoIP chega para valer." },
        { year: 2007, title: "O private equity assume", detail: "TPG e Silver Lake fecham o capital da Avaya por cerca de US$ 8,2 bilhões: o capítulo alavancado cuja dívida molda os quinze anos seguintes." },
        { year: 2009, title: "O leilão da Nortel", detail: "A Avaya arremata o negócio Enterprise Solutions da Nortel por cerca de US$ 900 milhões no leilão da falência, absorvendo a base de voz corporativa da grande rival e, com ela, a linha de redes de dados que remonta à Bay Networks (essa história continua na página Nortel/Bay desta seção)." },
        { year: 2017, title: "Chapter 11, e as redes para a Extreme", detail: "A Avaya entra com pedido de Chapter 11 em janeiro para reestruturar a dívida da compra alavancada; como parte da reformulação, o negócio de redes, a velha linhagem Nortel/Bay, vai para a Extreme Networks, cuja página de carreira conta o lado do comprador. A Avaya volta à NYSE em 2018 como empresa de software e serviços." },
        { year: 2023, title: "A segunda reestruturação", detail: "Um Chapter 11 pré-negociado em fevereiro de 2023 corta a dívida de novo; a Avaya sai dele em poucos meses, de capital fechado e reconcentrada na Avaya Experience Platform, com o contact center como centro de gravidade.", sourceNote: "Data de saída segundo a cobertura da imprensa de 2023." },
      ],
      // Products: names as the vendor writes them (descriptor words localised); descriptions translated.
      products: [
        { name: "Avaya Experience Platform", what: "A linha de contact center como serviço, a descendente moderna de décadas de engenharia de call center." },
        { name: "Avaya Aura", what: "A plataforma corporativa de comunicações unificadas e controle de chamadas que leva a linhagem do PABX para o IP." },
        { name: "A herança do Communication Manager", what: "A linha Definity/Communication Manager: da Western Electric à Lucent e à Avaya, uma única linhagem telefônica sem interrupção." },
      ],
      // Innovations: titles and details translated.
      innovations: [
        { title: "Voz corporativa na escala Bell", detail: "A Avaya herdou e operou a maior base instalada da telefonia corporativa: a implementação de referência de como as grandes organizações se falam." },
        { title: "A encruzilhada da consolidação", detail: "A compra da Nortel em 2009 fez da Avaya o ponto de encontro das duas grandes linhagens de voz corporativa, e a venda do seu negócio de redes para a Extreme em 2017 semeou outro fabricante ensinado neste site." },
      ],
      // Market paragraphs: same count as the English.
      markets: [
        "A Avaya hoje é um fabricante de capital fechado de contact center e comunicações unificadas que atende uma enorme base instalada, concorrendo com players de CCaaS nativos de nuvem enquanto monetiza o maior parque legado da voz corporativa.",
      ],
      // Analyst statements: same count as the English.
      analyst: [
        "Presença constante nas avaliações de comunicações unificadas e de contact center por duas décadas: a incumbente com que todo desafiante se comparava, em todos os capítulos de controle acionário.",
      ],
    },
  },
  // ---- ax4b: pt-BR prose for the record (facts stay in the English record) ----
  "ax4b": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "AX4B - um produto, depois um catálogo",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Integradora de São Paulo fundada em 2006 em torno do Microsoft Dynamics AX, que depois cresceu por aquisições.",
    intro: "A AX4B foi fundada em São Paulo em 2006 para trabalhar exclusivamente com o Microsoft Dynamics AX e cresceu desse único produto até virar uma integradora nacional, com escritórios em sete estados e um catálogo que abrange software de gestão, nuvem, backup, segurança e automação de processos.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A AX4B foi fundada em São Paulo em 2006 por uma equipe que escolheu trabalhar exclusivamente com um produto, o Microsoft Dynamics AX, e é daí que vem o nome. Antonio Felix a lidera como CEO desde a expansão que veio depois. Começar como especialista numa única suíte de ERP é como uma empresa pequena conquista o direito de ser chamada: ela não consegue vencer uma grande integradora em amplitude, então concorre por ser a casa que conhece uma coisa por completo.",
      "O crescimento depois disso foi comprado, e não aprendido. Em 2017, ela adquiriu a integradora de sistemas Gripho por quatro milhões de reais e, no mesmo ano, a consultoria porto-alegrense Basis IT, que trouxe competências em SAP NetWeaver e Basis. A compra ligada à SAP cruzou uma linha que a maioria dos parceiros Microsoft não cruza, e a lógica declarada na época era a convergência (o S/4 da SAP rodando na nuvem da Microsoft), de modo que uma empresa fluente nas duas tinha um lugar onde se apoiar que nenhum parceiro de um só fabricante alcançava. A essa altura, o Dynamics AX representava cerca de um terço da receita, e não ela toda.",
      "O portfólio de hoje se lê como o resultado acumulado dessa estratégia, e não como um plano: software de gestão e os serviços em volta dele, mais nuvem, backup, segurança de endpoint e automação de processos. As alianças citadas incluem Huawei Cloud, Veeam, ESET, Trend Micro, Kaspersky, Adobe, Autodesk, Automation Anywhere e Hyland, uma lista que, de propósito, não é a pilha de um único fabricante, porque um cliente que troca um componente não deveria ter de trocar de integradora.",
      "Ela opera com escritórios em São Paulo, Minas Gerais, Rio de Janeiro, Rio Grande do Sul, Goiás e Distrito Federal, Espírito Santo e Pernambuco. Essa geografia é a parte que merece atenção de quem estuda o canal brasileiro: cobertura nacional neste mercado se constrói cidade por cidade, em geral comprando a empresa que já tinha os relacionamentos ali, porque software corporativo é vendido por gente que consegue estar na sala.",
    ],
  },
  // ---- bematech: pt-BR prose for the record (facts stay in the English record) ----
  "bematech": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Bematech - uma dissertação que virou o caixa",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Fabricante brasileira de automação comercial fundada em 1990 em Curitiba, conhecida pelas impressoras fiscais.",
    intro: "A Bematech foi fundada em 1990 em Curitiba e se tornou uma das fabricantes brasileiras de automação comercial, mais conhecida pelas impressoras fiscais, a classe de equipamento que existe porque o Estado exige que uma máquina no ponto de venda produza um registro que ele possa auditar.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A origem dela é incomumente específica e vale ser guardada. Marcel Malczewski e Wolney Betiol se conheceram no programa de pós-graduação em informática industrial do CEFET-PR, hoje Universidade Tecnológica Federal do Paraná, e construíram um sistema de impressão para telex como dissertação de mestrado. O tema era uma exigência da banca examinadora; eles o trataram como oportunidade, e em dezembro de 1989 o projeto virou o primeiro empreendimento aceito pela INTEC, a incubadora de tecnologia de Curitiba recém-fundada.",
      "É um caminho completo de um departamento universitário até uma fabricante, e é o mesmo argumento que os verbetes da USP e da Unicamp nesta linha do tempo fazem pelo outro lado: as empresas foram fundadas por pessoas que se conheceram em algum lugar, e esse lugar era com frequência uma instituição pública.",
      "A trajetória comercial é a parte comum: investimento privado em 1991 com seis novos sócios, constituição como empresa, uma década de diversificação e, a partir de 2006, aquisições de software e serviços para virar uma fornecedora completa. O controle mudou desde então: a enciclopédia registra a Elgin como dona atual, enquanto a TOTVS lista a Bematech entre suas subsidiárias, e as duas afirmações são reproduzidas aqui sem decidir qual é a atual.",
      "Ela também é uma das poucas fabricantes desta linha do tempo que de fato fabricam. A maior parte do equipamento descrito nestas páginas foi projetada por uma empresa, fabricada por outra e montada por uma terceira, o arranjo registrado nos marcos de fabricação.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A Bematech S.A., cuja reorganização societária para se tornar subsidiária integral da TOTVS foi acordada em agosto de 2015, hoje opera como TOTVS Large Enterprise Tecnologia S.A., segundo o próprio formulário de referência da TOTVS.",
  },
  // ---- borland: pt-BR prose for the record (facts stay in the English record) ----
  "borland": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Borland - o Turbo Pascal e os anos de Big Four",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Vendeu um compilador Pascal de US$ 49,95 por reembolso postal em 1983, entrou nos Big Four da Forrester, comprou o dBASE, lançou o Delphi, virou Inprise e terminou dentro da Micro Focus.",
    intro: "A Borland International foi fundada em 1983 na Califórnia por Niels Jensen, Ole Henriksen, Mogens Glad e Philippe Kahn. Os três dinamarqueses tinham criado a Borland Ltd em agosto de 1981 para vender produtos para CP/M, como o Word Index, perceberam na feira CP/M-82, em San Francisco, que precisavam de uma empresa americana para chegar ao mercado americano, e conheceram Kahn, recém-chegado ao Vale do Silício depois de desenvolver o Micral. Kahn foi presidente do conselho, presidente e CEO desde o início até 1995. A empresa teve sede primeiro em Scotts Valley, depois em Cupertino e depois em Austin.",
    // Body: 5 paragraph(s), same order as the English.
    body: [
      "O nome tem uma história própria. A empresa americana se chamou primeiro MIT, de Market In Time; uma carta do Massachusetts Institute of Technology provocou a mudança, e, por orientação jurídica, os fundadores adotaram o nome de um pequeno cliente irlandês falido, a Borland. O primeiro produto foi o Turbo Pascal, lançado em 1983 e desenvolvido por Anders Hejlsberg, cujo compilador tinha sido vendido na Escandinávia como Compas Pascal. A ideia de Kahn era empacotar editor, compilador e tudo o que fosse preciso para produzir um programa num kit rápido e barato e vendê-lo por mala direta a US$ 49,95, passando por cima de varejistas e revendas numa época em que ferramentas profissionais custavam centenas. O Sidekick, um dos primeiros utilitários residentes em memória (terminate-and-stay-resident), veio em 1984; em 1985, a lenda do Turbo Pascal tinha chegado, nas palavras de um crítico, a \"mythic proportions\" (proporções míticas), e empresas faziam planos em reuniões de marketing para virar a próxima Borland.",
      "A Forrester Research contava a Borland, com o banco de dados Reflex da Analytica comprado em 1985, entre os Big Four do software para computador pessoal, ao lado de Ashton-Tate, Lotus e Microsoft. A receita do ano fiscal de 1987 foi de US$ 29,2 milhões; em setembro daquele ano, a Borland comprou a Ansa-Software e seu banco de dados Paradox, e em 1989 lançou a planilha Quattro Pro, que atraiu o processo de direito autoral da Lotus Development sobre look and feel, Lotus v. Borland. Em setembro de 1991, a Borland comprou a Ashton-Tate numa transação inteiramente em ações, trazendo o dBASE e o InterBase para dentro de casa.",
      "A fusão com a Ashton-Tate foi, segundo o relato da enciclopédia, uma parte grande da queda: o portfólio era fraco, sem nenhuma previsão para o ambiente gráfico do Windows, quase todas as linhas de produto foram descontinuadas, consolidar escritórios duplicados custou caro, e o dBASE for Windows saiu tão tarde que a comunidade de desenvolvedores já tinha seguido em frente. As demissões de 1993 foram as terceiras em cinco anos. Kahn e o conselho divergiram sobre o foco e ele renunciou em janeiro de 1995, o ano em que foi lançado o Delphi 1, o ambiente de desenvolvimento rápido de aplicações de Hejlsberg. Hejlsberg depois construiu o C# e o .NET na Microsoft.",
      "Em abril de 1998, a Borland International anunciou que tinha virado Inprise Corporation, um nome tão diferente do antigo que muita gente achou que a empresa tinha fechado; o nome Borland voltou. Em 8 de fevereiro de 2006, ela anunciou a venda da divisão de ferramentas de desenvolvimento (Delphi, JBuilder e InterBase) para se concentrar no gerenciamento do ciclo de vida de aplicações, formou a subsidiária CodeGear em novembro daquele ano e, em 7 de maio de 2008, vendeu a CodeGear para a Embarcadero Technologies por US$ 23 milhões previstos, mais US$ 7 milhões em recebíveis. Em 6 de maio de 2009, a Micro Focus anunciou que compraria o que restava por US$ 75 milhões, US$ 1,50 por ação, e concluiu a compra no fim de julho de 2009. A Micro Focus foi para a OpenText em 2023.",
      "A lição que o registro guarda é a que a etiqueta de preço ensina. Um compilador a US$ 49,95 por reembolso postal fez com as ferramentas de desenvolvimento o que as placas Ethernet a preço de custo da Novell fizeram com o hardware de rede na mesma década: tornou o instrumento do profissional barato o bastante para o estudante, e os estudantes viraram a profissão. Pascal, Turbo Pascal e dBASE têm seus próprios verbetes no glossário; a Ashton-Tate e a Nantucket, a empresa do Clipper, seus próprios registros.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "Adquirida pela Micro Focus: anunciada em 6 de maio de 2009 por US$ 75 milhões, aprovada pelos acionistas em 22 de julho de 2009 a US$ 1,50 por ação e concluída no fim de julho de 2009. A própria Micro Focus foi adquirida pela OpenText em 2023, que incorporou o portfólio da Borland à sua divisão de application delivery management.",
    // Successor link label (the URL stays in the English record).
    successorLabel: "OpenText, que em 2023 adquiriu a Micro Focus, dona da Borland desde 2009",
    // Acquisitions: index-aligned with the English list (year, name, price and founder stay English).
    acquisitions: [
      // [0] 1985 Analytica
      { what: "O banco de dados Reflex; a equipe de engenharia, gerida por Brad Silverberg e que incluía o cofundador do Reflex, Adam Bosworth, foi para a Borland.", sourceNote: "Wikipedia: Borland (lido em 06/10/2026)." },
      // [1] 1987 Ansa-Software
      { what: "A ferramenta de gerenciamento de banco de dados Paradox, na versão 2.0; Richard Schwartz, cofundador da Ansa, virou CTO da Borland. Setembro de 1987.", sourceNote: "Wikipedia: Borland (lido em 06/10/2026)." },
      // [2] 1991 Ashton-Tate
      { what: "O dBASE e o InterBase, numa transação inteiramente em ações de setembro de 1991. O portfólio se mostrou fraco para o Windows e a maior parte das linhas foi descontinuada.", became: "O dBASE for Windows, atrasado; o InterBase ficou com a Borland até a venda da CodeGear em 2006.", sourceNote: "Wikipedia: Borland (lido em 06/10/2026)." },
      // [3] 2006 Segue Software
      { what: "Ferramentas de teste e qualidade de software; a aquisição planejada foi anunciada em 8 de fevereiro de 2006, quando a Borland se voltou para o gerenciamento do ciclo de vida de aplicações.", sourceNote: "Wikipedia: Borland (lido em 06/10/2026)." },
      // [4] 2006 Gauntlet Systems
      { what: "Análise de software em desenvolvimento quanto a qualidade e segurança; anunciada em 20 de março de 2006.", sourceNote: "Wikipedia: Borland (lido em 06/10/2026)." },
    ],
  },
  // ---- brightcloud: pt-BR prose for the record (facts stay in the English record) ----
  "brightcloud": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "BrightCloud",
    // Card line (also the meta description) and intro paragraph.
    tagline: "A camada de classificação por baixo dos produtos de segurança dos outros, inclusive dos concorrentes do antigo empregador do fundador.",
    intro: "Quinn Curtis fundou a BrightCloud em San Diego em 2005. Ele tinha sido diretor de gerenciamento de produto da Websense e, antes disso, passou quase nove anos na Microsoft, na equipe que construiu e lançou a primeira versão do Exchange. A empresa fazia uma coisa só: classificar a web, com categorias de reputação e de conteúdo que cobriam, quando a Webroot a comprou em julho de 2010, mais de 200 milhões de URLs e endereços IP.",
    // Body: 5 paragraph(s), same order as the English.
    body: [
      "O que faz disto um verbete é o modelo de negócio, e não o produto. A BrightCloud não vendia filtragem para empresas. Vendia classificação para as empresas que vendem filtragem para empresas. Os dados eram licenciados a parceiros que os embutiam nos próprios gateways, firewalls e proxies, e o cliente nunca via o nome.",
      "Isso produz um fato em que a maioria dos engenheiros nunca pensou: dois produtos de segurança concorrentes podem estar fazendo o mesmo julgamento, porque o compram do mesmo lugar. Quando o firewall de um fabricante e o web gateway de outro concordam que um site é malicioso, essa concordância pode ser evidência, ou pode ser a opinião de um único fornecedor chegando duas vezes. As categorias em outras partes desta linha do tempo são descritas como julgamentos feitos em escala por pessoas que o usuário afetado nunca vai conhecer, e é aqui que essas pessoas trabalham.",
      "O ciclo do fundador é a outra metade. Curtis tinha dirigido o gerenciamento de produto da Websense, cujo produto inteiro consistia em agir sobre classificações. Ele saiu para construir a própria classificação, uma camada abaixo, e vendê-la para todo mundo, inclusive, necessariamente, para empresas que concorriam com seu antigo empregador. A camada abaixo de um mercado costuma ser um negócio melhor que o próprio mercado, porque tem menos clientes, eles são mais fiéis e concorrem entre si, e não com você.",
      "A Webroot adquiriu a empresa em 7 de julho de 2010, em termos não divulgados, e incorporou a equipe ao seu grupo de engenharia de nuvem. A própria Webroot tinha sido fundada em 1997 em Broomfield, Colorado, e no ano fiscal de 2018 faturava cerca de US$ 215 milhões, com mais de 14.000 parceiros de serviços gerenciados. A Carbonite comprou a Webroot em 2019; a OpenText comprou a Carbonite no fim do mesmo ano. O serviço de classificação continua sendo vendido sob o nome BrightCloud a outros fabricantes de segurança, três donos depois, o que diz algo sobre como uma posição de infraestrutura é durável em comparação com uma posição de produto.",
      "Uma cautela merece mais que uma nota de rodapé. Uma fonte de classificação compartilhada significa um ponto cego compartilhado. Se o banco de dados classifica algo errado, todo produto que o consome classifica errado a mesma coisa, no mesmo instante, e a diversidade que os clientes acham que compraram ao escolher fabricantes diferentes não está lá. É o mesmo argumento que esta linha do tempo faz sobre plataformas compartilhadas e canais de atualização confiáveis, chegando por uma direção para a qual a maioria das pessoas não olha.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A BrightCloud foi adquirida pela Webroot, e seu serviço de threat intelligence hoje é vendido com o nome BrightCloud pela OpenText, para onde brightcloud.com redireciona.",
  },
  // ---- commscope: pt-BR prose for the record (facts stay in the English record) ----
  "commscope": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "CommScope - a casa do cabo que comprou a marca de cabeamento estruturado dos Bell Labs, e a vendeu de novo",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Cabo coaxial de Hickory, Carolina do Norte, a marca de cabeamento estruturado SYSTIMAX comprada da Avaya em 2004 e uma venda de 10,5 bilhões de dólares à Amphenol em 2026.",
    intro: "A CommScope começou em 1961 como Comm/Scope, uma divisão da Superior Continental que desenvolvia sistemas de televisão a cabo, e virou empresa em agosto de 1976, quando Frank Drendel e Jearld Leonhardt a fundaram em Hickory, Carolina do Norte, depois de levantar 5,1 milhões de dólares. Passou os anos 1990 dentro da General Instrument e foi separada como empresa de capital aberto quando a General Instrument se dividiu em três, em 1997. Para o mercado de redes, ela importa sobretudo por uma aquisição: em 31 de janeiro de 2004, comprou o negócio Connectivity Solutions da Avaya e, com ele, o SYSTIMAX, o sistema de cabeamento estruturado que nasceu como o Premises Distribution System dos Bell Laboratories.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "O SYSTIMAX é a história mais antiga. Em 1983, os Bell Laboratories desenvolveram o primeiro sistema de cabeamento estruturado e o chamaram de Premises Distribution System, uma arquitetura controlada para o cabeamento de voz, dados e vídeo dentro de um prédio; em 1989, a AT&T lhe deu a marca SYSTIMAX Structured Cabling System. A divisão foi para a Lucent Technologies quando a AT&T se desfez dela em 1996, para a Avaya quando a Lucent separou seu negócio corporativo em 2000, e para a CommScope em 2004, por 250 milhões de dólares em dinheiro e cerca de 1,8 milhão de ações da CommScope. Três donos em oito anos, e o cabeamento nas paredes dos prédios nem percebeu.",
      "Depois, a empresa comprou sua entrada em todas as camadas da planta. A Andrew Corporation, fabricante de antenas e infraestrutura sem fio, por 2,6 bilhões de dólares em 2007; a divisão de soluções de rede de banda larga da TE Connectivity em 2015; a Arris, com o negócio de wireless e switching da Ruckus dentro dela, concluída em 4 de abril de 2019, por um preço que as próprias citações da Wikipedia dão como 7,4 e como 4,93 bilhões de dólares, registrado aqui como discrepância. O negócio de redes domésticas foi para a Vantiva em outubro de 2023 em troca de um quarto das ações da Vantiva.",
      "Então ela vendeu a parte pela qual o mercado a conhecia. Em 4 de agosto de 2025, a Amphenol concordou em comprar o negócio Connectivity and Cable Solutions, conectividade em fibra e cobre para data centers, redes de comunicação e prédios, por 10,5 bilhões de dólares em dinheiro, um negócio com cerca de 3,6 bilhões de dólares de vendas previstas para 2025 e mais de quinze mil funcionários; a venda foi concluída em 12 de janeiro de 2026, com a Amphenol esperando que o negócio gerasse cerca de 4,1 bilhões de dólares em 2026, com uns vinte mil funcionários. Dois dias depois, a controladora listada, já com sede em Richardson, Texas, passou a se chamar Vistance Networks, negociada como VISN a partir de 14 de janeiro de 2026, ficando com o negócio de redes de acesso, rebatizado de Aurora Networks, e com a Ruckus. O nome CommScope e o SYSTIMAX foram junto com a venda: commscope.com hoje se assina CommScope Technologies LLC, an Amphenol company. A Ruckus, como registra seu próprio verbete, foi vendida em seguida para a Belden em maio de 2026.",
      "A lição do card é a que a credencial de cabeamento estruturado neste site ensina. A planta de cabeamento de um prédio sobrevive a todo equipamento ligado a ela e à maioria das empresas que a venderam: a planta SYSTIMAX certificada em 1998 foi projetada sob um dono, instalada sob outro, garantida por um terceiro e hoje é vendida por um quarto, e os pares trançados na parede são os mesmos.",
    ],
    // Ending note (the year stays in the English record; lower-case start mirrors the English, which the page prefixes).
    endedNote: "Vendeu seu negócio Connectivity and Cable Solutions, com o SYSTIMAX e o nome CommScope incluídos, à Amphenol em 12 de janeiro de 2026; a controladora listada virou Vistance Networks em 14 de janeiro de 2026",
  },
  // ---- cpm-braxis: pt-BR prose for the record (facts stay in the English record) ----
  "cpm-braxis": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "CPM Braxis - a maior empresa brasileira de serviços de TI, vendida",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Empresa brasileira de serviços de TI adquirida pela Capgemini em 2010 e absorvida pela marca dela até 2012.",
    intro: "A CPM Braxis era a maior empresa brasileira de serviços de tecnologia da informação, com receita prevista de cerca de um bilhão de reais em 2010 e o 48º lugar naquele ano no IAOP Global Outsourcing 100, a posição mais alta que uma empresa sul-americana tinha alcançado. Em setembro de 2010, a Capgemini concordou em comprar 55% dela por R$ 517 milhões, e em 2012 o nome tinha desaparecido.",
    // Body: 5 paragraph(s), same order as the English (the English repeats its opening line in the fifth; kept).
    body: [
      "Ela foi montada, e não fundada, e a montagem é a parte interessante. A Braxis Tecnologia da Informacao (a TI Braxis das próprias anotações de trabalho desta linha do tempo) era ela mesma uma união de financistas e operadores: os fundadores do Banco Patrimonio e da Cotia Trading, a quem se juntaram um ex-presidente da Ernst & Young Brasil e o chefe mundial de TI da Bain. Em novembro de 2006, a Braxis adquiriu a Unitech, uma empresa de TI fundada em 1995 que tinha chegado a cerca de cem milhões de reais e uns mil e seiscentos funcionários. Quatro meses depois, em março de 2007, a Braxis ficou com 33% da CPM. O resultado foi a CPM Braxis, que chegou a um bilhão de reais de receita em 2009.",
      "O detalhe acionário explica a empresa. O Bradesco era ao mesmo tempo seu maior cliente e seu maior acionista, depois de comprar a participação do Deutsche Bank no começo daquele mesmo ano, e manteve 20% após a venda. Um negócio de serviços cujo maior cliente é seu dono é um arranjo específico com consequências específicas: volume garantido, e uma estratégia definida em parte por um comprador que também é proprietário.",
      "A estrutura da transação também merece leitura. Cerca de R$ 230 milhões foram para os acionistas e R$ 287 milhões entraram na empresa como capital para investimento e dívida, de modo que mais da metade do preço não foi pagamento a ninguém: foi o custo de deixar o negócio pronto para ter dono.",
      "Dois anos depois, a marca foi aposentada em favor apenas da Capgemini, alinhando o Brasil aos outros trinta e nove países. Trinta anos de história comercial e seis mil pessoas continuaram; o nome não, o que é o final comum de uma campeã nacional comprada por uma global.",
      "As demonstrações publicadas pela própria empresa dão a versão curta. A CPM Braxis surgiu em 2007 da fusão de duas prestadoras de serviços brasileiras, a CPM, constituída em 1982, e a Braxis, criada em 2006, e a empresa resultante foi ela própria adquirida pela Capgemini em outubro de 2010, operando com o nome Capgemini a partir de outubro de 2012. Três empresas e vinte e cinco anos de trabalho acumulado terminam dentro de um grupo francês, e só o nome do meio sobrevive no registro.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A Capgemini anunciou em 13 de outubro de 2010 que havia concluído a aquisição de uma participação de controle de 55% na CPM Braxis.",
  },
  // ---- credly: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "credly": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Credly",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Verifica a credencial, como sua dona verifica a pessoa; e a empresa pequena comprou o produto da grande antes de a grande comprá-la.",
    intro: "Jonathan Finkelstein fundou a Credly em Nova York em 2012 para emitir credenciais digitais, badges com metadados legíveis por máquina sobre o que foi conquistado, quem emitiu, quando e o que foi exigido, construídas sobre o Open Badges, a especificação aberta que a Mozilla lançou em 2011 e depois entregou a um órgão de padronização. Antes, ele tinha fundado a LearningTimes e cofundado a HorizonLive, que a Blackboard adquiriu.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "O problema que ela ataca é a metade da certificação que a prova não resolve. Um centro de testes estabelece que a pessoa certa fez a prova. Depois, não diz nada: um certificado em PDF pode ser editado, uma linha no currículo não pode ser conferida sem contatar o emissor, e nenhum dos dois traz uma validade que qualquer um possa ver. Uma credencial digital é um objeto verificável: basta clicar nela para que o próprio registro do emissor responda, inclusive se ela já expirou ou foi revogada. A corrente é tão forte quanto seu elo mais fraco, e por anos o elo mais fraco não foi a prova, foi a afirmação sobre a prova.",
      "O controle acionário importa. A verificação da pessoa e a verificação da credencial estão hoje sob um único dono: a Pearson opera os centros de testes e, desde 2022, é dona da Credly. Isso não é uma acusação, já que as peças de fato funcionam melhor juntas e ninguém alegou o contrário. Simplesmente vale dizer: quando a mesma organização atesta que você fez a prova e que seu certificado é verdadeiro, a independência entre esses dois atestados é organizacional, e não estrutural.",
      "A sequência societária é uma inversão elegante. A Pearson lançou uma plataforma de badges chamada Acclaim em 2014. Em 2018, a Credly, de longe a empresa menor, a adquiriu, com a Pearson ficando com uma participação minoritária de cerca de vinte por cento e um assento no conselho. A Pearson investiu de novo na rodada de 2019. Em janeiro de 2022, a Pearson adquiriu a Credly por inteiro. A empresa pequena absorveu o produto da grande, e quatro anos depois a grande absorveu a pequena. O produto de badges hoje é comercializado com os dois nomes.",
      "E então vem a parte que merece cuidado, porque está de fato sem solução. A Credly detém patentes nos Estados Unidos que cobrem a criação, o gerenciamento e o acompanhamento de credenciais digitais. Isso alarmou a comunidade do Open Badges, cuja premissa inteira é uma especificação aberta que qualquer um pode implementar, e cuja plataforma era anterior às patentes. A empresa disse que não tinha intenção de fazer valer as patentes contra essa comunidade e ofereceu uma licença razoável e não discriminatória, depois ampliada para cobrir tanto os elementos obrigatórios quanto os opcionais do padrão.",
      "A objeção que resta é estrutural, e não sobre intenção. Uma promessa de não fazer valer uma patente é uma promessa, e promessas sobrevivem a critério de quem for o próximo dono da patente, que, desde 2022, é uma empresa diferente da que fez a promessa. A cobertura da época também observou que ninguém tinha de fato pedido uma das licenças oferecidas, o que pode ser lido como sinal de que a comunidade se tranquilizou ou de que a licença era irrelevante. Isso não fica resolvido aqui. Um padrão aberto com patentes do líder de mercado pairando sobre ele é o tipo de arranjo que vale conhecer antes de construir em cima.",
      "Lido ao lado de outros dois verbetes daqui, o formato é conhecido. A USRobotics defendeu protocolos proprietários até que os padrões lhe tirassem a vantagem. A Dynatrace detinha uma patente e depois ajudou a construir o padrão aberto que a generalizou. A Credly é uma terceira posição: implementar o padrão aberto, virar sua maior implementadora e manter patentes ao lado dele. Se isso é um fosso, um seguro ou simplesmente o que os advogados de uma empresa fazem sem que ninguém decida nada, o registro público não resolve.",
    ],
    // Acquisitions: index-aligned with the English list (year, name, price and founder stay English).
    acquisitions: [
      // [0] 2018 Acclaim (from Pearson)
      { what: "A plataforma Open Badge da Pearson, lançada em 2014 e usada por Microsoft, IBM e o American Council on Education, entre outros.", became: "Incorporada à Credly, com a Pearson ficando com uma participação minoritária de cerca de 20% e um assento no conselho, o que armou a aquisição inversa quatro anos depois." },
    ],
    // Profile: complete copy of profiles/credly.ts; years, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "credly",
      // No founding stories in the English profile.
      foundings: [],
      // Timeline: same events, same order, same years; title and detail translated.
      timeline: [
        { year: 2013, title: "O primeiro badge", detail: "Emitido um ano depois da fundação, sobre uma especificação que a empresa não possuía: a decisão da qual decorre todo o resto desta página." },
        { year: 2022, title: "Quinze vezes a receita", detail: "O preço de compra foi de cerca de US$ 200 milhões, contra uma receita de US$ 13,3 milhões em 2021. Não é um múltiplo que alguém pague por um fluxo de lucros. É o preço de um registro: cinquenta milhões de credenciais em poder de vinte e cinco milhões de pessoas, emitidas por duas mil organizações, entre elas os maiores fabricantes de tecnologia. O que se comprou foi o registro de quem tem o quê." },
      ],
      // Products: names as the vendor writes them (descriptor words localised); descriptions translated.
      products: [
        { name: "A plataforma de credenciais", what: "Emissão, hospedagem e verificação de badges, vendidas às organizações que as concedem, e não às pessoas que as detêm, o que vale saber, porque significa que o cliente é o emissor e o detentor é o assunto do produto, e não seu comprador." },
        { name: "O endpoint de verificação", what: "O que de fato importa: um link que leva ao registro atual do próprio emissor, inclusive à revogação. Um certificado que responde por si mesmo é um objeto diferente de um PDF." },
        { name: "Analytics para emissores", what: "Quais credenciais são conquistadas, compartilhadas e levadas em conta. Para um fabricante que mantém um programa de certificação, é o ciclo de retorno que antes simplesmente não existia." },
      ],
      // Innovations: titles and details translated.
      innovations: [
        { title: "Tornar verificável a afirmação, não só a prova", detail: "O problema da verificação tem duas metades, e o setor resolveu uma delas primeiro. Garantir que a pessoa certa fez o teste foi resolvido há décadas com a aplicação supervisionada; garantir que uma afirmação no currículo é verdadeira ficou a cargo de quem estivesse contratando, o que em geral significava que não se garantia nada." },
        { title: "O registro é o ativo", detail: "Uma plataforma que guarda as credenciais de vinte e cinco milhões de pessoas tem algo que nenhum concorrente consegue construir escrevendo software melhor: os próprios registros, e o custo de migrá-los. É por isso que o preço não tinha relação com a receita, e é o mesmo formato de ativo de uma bolsa ou de uma autoridade certificadora: valor que se acumula para quem já guarda os dados de todo mundo." },
        { title: "Portável pela especificação, concentrado pelo mercado", detail: "O Open Badges existe para que uma credencial pertença à pessoa e circule entre plataformas. A especificação deu certo e o mercado se concentrou mesmo assim, porque a portabilidade dos dados não impede a concentração do serviço. É um resultado geral que vale levar adiante: um formato aberto limita o aprisionamento sem impedir o domínio." },
      ],
      // Market paragraphs: same count as the English.
      markets: [
        "Órgãos certificadores, fabricantes de tecnologia, universidades e associações profissionais: as organizações que concedem algo e precisam que isso seja levado a sério depois. Os fabricantes de tecnologia da lista de clientes são os mesmos cujas certificações aparecem ao longo desta linha do tempo.",
        "Seus concorrentes são as outras plataformas de credenciais e, cada vez mais, os próprios emissores, que decidem se mantêm a própria verificação em vez de delegá-la.",
      ],
      // Analyst statements: same count as the English.
      analyst: [
        "O mercado é pequeno o bastante para que a cobertura formal seja escassa, e a posição se descreve melhor pela concentração do que por ranking: uma plataforma detém uma parcela grande das credenciais emitidas pelo setor de tecnologia.",
        "A observação que decorre do preço é a que vale guardar. Uma empresa com cerca de US$ 13 milhões de receita e sessenta funcionários foi vendida por duzentos milhões por causa do que guardava, e não do que ganhava. Quem pensa em onde está a alavanca na cadeia da certificação deveria notar que a posição mais valiosa acabou não sendo escrever a prova nem aplicá-la, mas manter a lista de quem passou.",
      ],
    },
  },
  // ---- ec-council: pt-BR prose for the record (facts stay in the English record) ----
  "ec-council": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "EC-Council",
    // Card line (also the meta description) and intro paragraph.
    tagline: "A certificação mais exigida da sua área, e a mais discutida, que são o mesmo fato visto duas vezes.",
    intro: "O International Council of E-Commerce Consultants foi fundado em 2001, em resposta aos atentados de 11 de setembro e à pergunta sobre se a comunidade de segurança estava preparada para um ataque equivalente contra a infraestrutura comercial. Lançou o Certified Ethical Hacker em 2003, e o CEH se tornou a certificação de segurança mais exigida do mundo, e a mais persistentemente criticada. Os dois fatos estão ligados.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "Comece pela crítica que não depende da opinião de ninguém, porque o próprio EC-Council a publicou. O Certified Network Defence Architect era vendido como uma credencial defensiva. A página de perguntas frequentes do próprio EC-Council dizia que, tirando o título, o conteúdo da prova era o mesmo do CEH. Uma prova, dois nomes, vendida a dois públicos como qualificações diferentes. Seja qual for a conclusão sobre o resto, isso está documentado nas palavras da própria organização e é difícil de defender.",
      "A crítica mais ampla é antiga e fácil de encontrar: os pesquisadores de segurança do attrition.org mantêm uma página que defende o argumento; há acusações de marketing por spam em comentários, que o presidente da organização descartou como uma teoria fictícia; há o conselho publicado em 2015 de que mulheres deveriam usar terninho com salto para ter credibilidade num teste de invasão; e há incidentes de segurança no site de uma organização que vende segurança de sites. Um site que registra as críticas à CompTIA, à filtragem web e às provas práticas deve registrar estas também, e registra.",
      "E a acreditação é real, que é a outra metade de um relato honesto. O EC-Council tem acreditação ISO/IEC 17024 para organismos de certificação de pessoas, e o CEH é reconhecido pela Diretiva 8140 do Departamento de Defesa dos Estados Unidos (antes, 8570), o que significa que atende a uma exigência obrigatória para certas funções de defesa. Esse reconhecimento não é marketing. É por causa dele que a certificação aparece em requisitos de vagas escritos por pessoas que nunca ouviram falar das críticas.",
      "A explicação estrutural é mais útil que um veredito. Uma certificação que se torna obrigatória ganha um volume enorme, porque passa a ser feita por gente que não a teria escolhido. Volume produz variação: entre centenas de milhares de titulares haverá profissionais excelentes e pessoas que decoraram um banco de questões, e todos têm a mesma credencial. A variação produz a anedota (todo mundo neste setor já conheceu um portador de certificado que não sabia fazer a coisa), e a anedota viaja muito mais longe que a mediana. Ser exigida é o que torna uma certificação valiosa e o que degrada o que ela sinaliza, e não existe versão de credencial obrigatória que escape disso.",
      "O que cai exatamente onde cai o resto deste grupo. Provas padronizadas são escaláveis e decoráveis. Provas práticas são impossíveis de fingir e possíveis de vazar. Provas obrigatórias são reconhecidas por todos e diluídas para todos. Todo mecanismo que torna uma credencial útil ataca aquilo que fazia valer a pena tê-la, e a posição honesta para quem contrata é que nenhuma certificação é prova de capacidade: é prova de que alguém passou num teste específico num dia específico, uma afirmação menor e mais útil.",
      "A EQT Private Equity investiu em setembro de 2021. É a segunda participação da EQT nesta linha do tempo, depois da Prometric, um lembrete de que o controle do setor de certificação está concentrado em menos mãos do que a variedade de marcas sugere. Os totais de certificações divulgados variam muito entre os materiais do próprio EC-Council e seus comunicados de imprensa, de cinquenta mil a mais de quatrocentos mil, e este verbete não afirma nenhum deles.",
    ],
  },
  // ---- edx: pt-BR prose for the record (facts stay in the English record) ----
  "edx": {
    // Parent note (official.parent.note), added 26/10/2026 with the parents apply; name, slug and year stay English facts.
    parentNote: "A 2U comprou a marca, o site e o marketplace do edX em 2021, e o próprio site da 2U hoje se descreve como movido pelo edX.",
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "edX - a organização sem fins lucrativos que foi vendida, e a empresa que a comprou faliu",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Harvard e MIT a fundaram em 2012 para que qualquer pessoa fizesse seus cursos de graça; em 2021, a venderam por 800 milhões de dólares a uma empresa que pediu falência três anos depois, com o dinheiro guardado numa fundação que mal se manifestou desde então.",
    intro: "O edX é uma plataforma de ensino online fundada em maio de 2012 como organização sem fins lucrativos pelo MIT e por Harvard, vendida em 2021 à 2U, empresa com fins lucrativos, por 800 milhões de dólares; a 2U pediu proteção contra falência pelo Chapter 11 em julho de 2024.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "Em maio de 2012, semanas depois de o Coursera fechar com suas primeiras universidades, o MIT e Harvard lançaram a própria resposta com uma premissa diferente: uma organização sem fins lucrativos, financiada pelas duas instituições com uns oitenta milhões de dólares do próprio bolso ao longo dos anos, cuja promessa era que qualquer pessoa no mundo poderia fazer de graça uma disciplina de Harvard ou do MIT. Cresceu de um curso de circuitos do MIT para 160 universidades parceiras e 3.300 cursos, e a plataforma Open edX por baixo dela era ela própria open source. Na época da venda, tinha 35 milhões de alunos e, no ano encerrado em junho de 2020, receita de 85 milhões de dólares e prejuízo operacional de 17.",
      "Em 29 de junho de 2021, as duas universidades a venderam (a marca, o site, o marketplace) à 2U, uma empresa com fins lucrativos que opera programas de graduação online para universidades, por 800 milhões de dólares em dinheiro, uma quantia que a 2U tinha tomado emprestada na véspera. O dinheiro foi para uma nova organização sem fins lucrativos, a Axim Collaborative, encarregada de levar adiante a missão aberta. Anant Agarwal, primeiro presidente do edX, disse que o comprador tinha assumido um compromisso juridicamente vinculante de preservar essa missão e foi para a empresa. Um professor de Harvard chamou a venda de traição da confiança que professores e alunos tinham depositado na plataforma ao aderir a ela. As duas declarações estão registradas.",
      "O que veio depois levou três anos. As ações da 2U caíram 86 por cento desde a compra; as demissões vieram em ondas, e a cada reorganização o fundador recebia um novo cargo; o blog do edX, inclusive o anúncio da venda, foi tirado do ar. Uma empresa avaliada em cinco bilhões de dólares em 2018 valia menos de 35 milhões em maio de 2024 e, em 27 de julho de 2024, pediu proteção contra falência pelo Chapter 11, com a dívida da compra do edX (cerca de 42 milhões de dólares por ano em juros) no centro do pedido. A plataforma continuou funcionando, sob o controle dos credores. A fundação que guardava os 800 milhões, a essa altura, mal tinha se manifestado.",
      "O verbete da Pluralsight registra uma biblioteca de treinamento que virou garantia de um credor. Este registra um catálogo gratuito de cursos universitários que virou garantia de um credor, com a diferença de que quem o construiu foram duas das universidades mais ricas do mundo, e foram elas que embolsaram o dinheiro. Ninguém interrompeu os cursos. Todo o resto que tinha feito da coisa o que ela era (a organização sem fins lucrativos, a promessa aberta, as pessoas) desapareceu em três anos, e o registro da decisão que fez isso precisa ser lido no Internet Archive.",
    ],
  },
  // ---- elastic: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "elastic": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Elastic",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Mudou a licença para barrar um provedor de nuvem, sofreu um fork e voltou atrás três anos depois.",
    intro: "Shay Banon construiu o Elasticsearch sobre o Apache Lucene, depois de ter escrito uma biblioteca de busca chamada Compass, e a empresa em volta dele foi fundada em 2012. O produto fazia algo de fato útil: tornava a busca de texto completo sobre documentos JSON arbitrários algo que um desenvolvedor conseguia pôr de pé numa tarde, com uma linguagem de consulta que não exigia um administrador de banco de dados.",
    // Body: 8 paragraph(s), same order as the English.
    body: [
      "Elasticsearch e Kibana eram Apache 2.0, e essa licença é permissiva por projeto: qualquer um pode pegar o código e vender um serviço construído sobre ele, sem obrigação de devolver nada. Em 2015, a Amazon Web Services começou a oferecer exatamente isso: um serviço gerenciado de Elasticsearch. Em 2019, depois que a Elastic lançou partes dos recursos comerciais do x-pack sob licenças restritivas, a AWS lançou o Open Distro for Elasticsearch como empacotamento alternativo.",
      "Em janeiro de 2021, com a versão 7.11, a Elastic tirou o Elasticsearch e o Kibana do Apache 2.0 e os passou para uma licença dupla: a Server Side Public License, escrita originalmente pela MongoDB, e a nova Elastic License. Nenhuma das duas é aprovada pela Open Source Initiative. A intenção declarada da Elastic na época era impedir que empresas oferecessem seus produtos como serviço sem colaborar com ela, e a AWS foi citada explicitamente.",
      "Existem três relatos diferentes do porquê, e os três ficam registrados aqui. A posição da Elastic em 2021 era sobre revenda sem colaboração. Em 2024, Banon pôs a ênfase em outro lugar, dizendo que o problema nunca foi a AWS oferecer o software (o Apache 2.0 permitia isso), e sim chamá-lo de Amazon Elasticsearch, o que ele caracterizou como clara violação de marca respondida com mil advogados. Adrian Cockcroft, ex-AWS, deu uma terceira versão: a de que só a AGPL já teria barrado a AWS, e que a verdadeira divergência era a AWS querer contribuir com recursos de segurança para o projeto aberto enquanto a Elastic queria manter a segurança comercial. Esses relatos não são compatíveis, vêm de participantes identificados, e o registro não arbitra entre eles.",
      "Em abril de 2021, a AWS fez um fork do Elasticsearch e do Kibana na versão 7.10.2 e criou o OpenSearch, sob Apache 2.0, depois colocado na Linux Foundation. A Elastic então tornou suas bibliotecas de cliente incompatíveis com o OpenSearch, e o OpenSearch escreveu as próprias.",
      "Vale citar a reação da comunidade em vez de resumi-la, porque é a parte que sobreviveu à discussão. Drew DeVault observou que o Elasticsearch pertencia aos seus 1.573 colaboradores, que tinham concedido à Elastic uma licença para distribuir o trabalho deles, e não para relicenciá-lo. Simon Phipps, da Open Source Initiative, disse que a Elastic tinha tirado do open source todo o benefício que pôde e agora cuspia os ossos. A versão de Corey Quinn era mais curta: quem dependesse de garantias da Elastic deveria fazer outros planos.",
      "Em setembro de 2024, a Elastic acrescentou a AGPLv3, uma licença aprovada pela OSI, ao lado da SSPL e da Elastic License, licenciando os produtos centrais de três formas e tornando-os de novo open source por qualquer definição padrão. O anúncio de Banon tinha seções intituladas com nomes de músicas de Kendrick Lamar, um documento realmente incomum de encontrar num arquivo de licenciamento. Ele disse que a mudança tinha funcionado: a Amazon estava totalmente investida no seu fork, a confusão no mercado estava em grande parte resolvida e a parceria com a AWS estava mais forte do que nunca. Também negou explicitamente que a mudança de 2021 tivesse sido um erro.",
      "O raciocínio comercial é coerente, e o resultado é instrutivo mesmo assim. O fork não voltou. Profissionais citados na época foram diretos sobre o porquê: colaboradores que tinham visto seu trabalho sob licença Apache virar ativo exclusivo de outra pessoa não tinham motivo para voltar, e a confiança leva muito mais tempo para ser reconstruída do que para ser perdida. O OpenSearch continua, e o ecossistema que era um projeto em 2020 são dois.",
      "Lido ao lado de outros dois verbetes desta linha do tempo, aparece um padrão. A Tenable fechou seu scanner open source em 2005 para financiar a empresa, e a comunidade fez dele o fork OpenVAS. A Rapid7 comprou um projeto open source e o manteve aberto. A Elastic fechou um, sofreu um fork e o reabriu. Três empresas, três estratégias, e em duas das três o fork continua rodando. Se uma licença permissiva é um presente ou um passivo depende inteiramente de quem mais tem dinheiro para operar o seu software em escala, uma pergunta que ninguém precisava fazer antes de existir a nuvem de hiperescala.",
    ],
    // Profile: complete copy of profiles/elastic.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "elastic",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          company: "Compass, then Elasticsearch",
          year: 2004,
          place: "Amsterdã, Países Baixos",
          founders: ["Shay Banon"],
          story: "Banon escreveu uma biblioteca de busca chamada Compass e depois reconstruiu a ideia sobre o Apache Lucene, como um mecanismo de busca distribuído com interface HTTP. O relato que ele conta é que a primeira versão foi escrita para a esposa procurar receitas, o tipo de origem que parece inventada e está documentada o bastante para ser mantida.",
          sourceNote: "A origem na busca de receitas é o relato repetido do próprio Banon; fica registrada como versão dele, e não como fato estabelecido de forma independente.",
        },
        {
          company: "Elastic",
          year: 2012,
          place: "Amsterdã e Mountain View",
          founders: ["Shay Banon", "Steven Schuurman", "Uri Boness", "Simon Willnauer"],
          story: "Formada em torno de um projeto que já era amplamente adotado, o que definiu o problema comercial com que a empresa passou a década seguinte: como ganhar dinheiro com um software que todo mundo já tinha de graça.",
        },
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        { year: 2010, title: "Lançamento do Elasticsearch", detail: "Busca distribuída sobre o Lucene, sob Apache 2.0, com uma interface simples o bastante para que a adoção não exigisse uma conversa com vendas." },
        { year: 2012, title: "Fundação da empresa", detail: "Em torno de um projeto já amplamente usado." },
        { year: 2015, title: "A stack ELK", detail: "Elasticsearch, Logstash e Kibana viraram o jeito padrão de lidar com logs para uma geração de engenheiros, em grande parte sem que ninguém pagasse por isso." },
        { year: 2018, title: "Listagem na NYSE", detail: "Listada como ESTC." },
        { year: 2021, title: "A mudança de licença, e o fork", detail: "Em janeiro, a versão 7.11 saiu do Apache 2.0. Em abril, a AWS fez o fork da 7.10.2 como OpenSearch, sob Apache 2.0, e rebatizou seu serviço gerenciado de acordo." },
        { year: 2024, title: "Duas reviravoltas num só ano", detail: "Em setembro, a Elastic acrescentou a AGPLv3, uma licença open source aprovada, ao lado das outras. No mesmo mês, a AWS transferiu a governança do OpenSearch para a Linux Foundation. Cada lado abriu mão daquilo que o outro o acusava de reter: um restaurou uma licença aberta, o outro abriu mão do controle do fork.", sourceNote: "Os dois eventos são de setembro de 2024; a simetria é registrada, e nenhuma relação causal entre eles é afirmada." },
        { year: 2025, title: "Escala", detail: "Receita do ano fiscal de 2025 acima de US$ 1,4 bilhão, com a nuvem respondendo pela maior parte das novas vendas: a transição de que a briga de licenças, no fundo, tratava." },
      ],
      // Products: names as the vendor writes them; descriptions translated.
      products: [
        { name: "Elasticsearch", what: "O mecanismo distribuído de busca e analytics, ainda construído sobre o Lucene, ainda a peça em que todo o resto se encaixa." },
        { name: "Kibana", what: "A camada de visualização e exploração, e a parte da stack com a vantagem mais clara sobre o fork depois de cinco anos de desenvolvimento separado." },
        { name: "Elastic Cloud", what: "Serviço gerenciado nos principais provedores de nuvem, em mais de quarenta regiões, inclusive na AWS, o que vale notar dada a história." },
        { name: "Observability and Security", what: "Monitoramento de desempenho de aplicações, logs e métricas de um lado; SIEM e endpoint do outro. Os dois são o mesmo mecanismo apontado para perguntas diferentes, que é o argumento a favor da plataforma." },
        { name: "ES|QL", what: "Uma linguagem de consulta com pipes acrescentada em 2025, voltada para o trabalho analítico que a interface de consulta original atendia mal. O fork respondeu com sua própria linguagem com pipes, um retrato justo de como os dois se desenvolvem hoje." },
        { name: "ESRE, ELSER e BBQ", what: "O trabalho de recuperação e vetores: um modelo de recuperação esparsa que roda no cluster sem hardware externo de inferência, e uma quantização que comprime vetores cerca de dezesseis vezes com pouca perda de recall relatada. Foi aqui que a empresa fez sua aposta para a era da geração aumentada por recuperação." },
      ],
      // Innovations: titles and details translated.
      innovations: [
        { title: "Busca como infraestrutura, e não como recurso", detail: "Uma interface HTTP sobre um problema difícil de sistemas distribuídos significava que os desenvolvedores podiam adotá-la numa tarde, sem uma equipe de banco de dados. Essa acessibilidade construiu a base instalada, e tornou impossível cobrar dela." },
        { title: "Rodar o modelo dentro do cluster", detail: "Um modelo de recuperação que dispensa um serviço externo de inferência remove a barreira operacional e de custo que impede a maioria das organizações de usar busca semântica. A decisão de projeto é sobre implantação, e não sobre precisão." },
        { title: "Comprimir vetores em vez de comprar memória", detail: "Quantizar vetores para uma fração do tamanho torna a busca vetorial viável em volumes nos quais, de outro modo, a conta de memória decide a arquitetura. É a engenharia sem glamour que determina se um recurso é utilizável em produção." },
        { title: "Licenciamento triplo como acordo", detail: "Manter ao mesmo tempo uma licença proprietária, uma source-available e uma open source aprovada é uma posição estranha, e é a cara de uma empresa que precisa resolver o problema do provedor de nuvem e satisfazer a comunidade ao mesmo tempo." },
      ],
      // Market paragraphs: same count as the English.
      markets: [
        "Analytics de logs continua sendo o maior uso, ao lado de busca corporativa, observabilidade e segurança. O cliente é qualquer organização com mais dados do que consegue varrer com grep, o que hoje é a maioria delas.",
        "Seu principal concorrente é um fork do próprio código, hoje sob governança independente e com centenas de milhões de downloads. Os benchmarks entre os dois são contestados e devem ser lidos com isso em mente: os números do próprio fabricante alegam grandes vantagens, um benchmark independente de 2025 achou o fork mais rápido em cargas mistas, e a resposta honesta é que o resultado depende da carga.",
      ],
      // Analyst statements: same count as the English.
      analyst: [
        "Avaliada como líder em busca e, cada vez mais, em observabilidade, com o trabalho de vetores e recuperação como seu diferencial atual mais claro.",
        "O resultado duradouro do episódio das licenças é um mercado com dois mecanismos em vez de um, ambos sob governança crível, e uma empresa que chegou a US$ 1,4 bilhão de receita mesmo assim. Se a mudança de licença causou o crescimento ou apenas coincidiu com a transição para a nuvem é algo que o registro público não permite separar.",
      ],
    },
  },
  // ---- equinix: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "equinix": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Equinix",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Dois gerentes de instalações saíram da DEC porque as operadoras apitavam um jogo em que também jogavam.",
    intro: "A Equinix foi constituída em 22 de junho de 1998 por Al Avery e Jay Adelson, dois gerentes de instalações da Digital Equipment Corporation que tinham construído e operado o PAIX, o Palo Alto Internet Exchange, de propriedade da DEC. Por um breve período, ela se chamou Quark Communications. O nome que acabou ficando é um argumento comprimido em oito letras: EQUality, Neutrality, Internet eXchange (igualdade, neutralidade, ponto de troca de tráfego da internet).",
    // Body: 7 paragraph(s), same order as the English.
    body: [
      "O problema que eles saíram para resolver é específico e ainda vale ser entendido. As redes precisam se encontrar em algum lugar para trocar tráfego. Nos anos 1990, os lugares onde se encontravam pertenciam em grande parte a operadoras de telecomunicações, que também eram participantes, e um juiz que joga a partida vai favorecer o próprio tráfego, seja de propósito, seja pela gravidade comum do interesse próprio. O congestionamento nesses pontos de troca não era só um problema de capacidade; era um problema de governança.",
      "A resposta foi um prédio pertencente a alguém sem rede própria. Se o dono do imóvel não vende trânsito, não tem tráfego a priorizar e não concorre com nenhum dos clientes instalados no prédio, operadoras rivais podem se encontrar lá dentro sem que nenhuma delas abra mão de nada. Neutralidade, aqui, não é uma virtude que a empresa anuncia. É o produto.",
      "O próprio PAIX merece uma linha, porque foi onde a ideia foi provada. Começou a operar em 1996 sob a DEC e, nos primeiros tempos, a malha de interconexão era um DELNI, o concentrador Ethernet da própria Digital, uma caixa projetada para redes de escritório, posta para servir de ponto de encontro da internet comercial. Adelson trabalhou lá ao lado de Stephen Stuart e Paul Vixie, cujo nome está no BIND e, portanto, na maior parte do DNS que as ferramentas deste site desmontam.",
      "O financiamento mostra quem concordava com a tese: uma rodada de US$ 12 milhões liderada pela Benchmark Capital, com Cisco e Microsoft como investidores estratégicos, um fabricante de rede e uma empresa de software, nenhum dos quais vende trânsito, e ambos beneficiados por uma internet que se interconecta de forma limpa.",
      "O insight do modelo de negócio veio um pouco depois e é o mais valioso. Eles começaram vendendo espaço, energia e refrigeração. O que descobriram foi que o dinheiro e a durabilidade estavam no cross-connect, o cabo físico entre dois clientes. Um cliente escolhe um prédio por causa de quem já está lá dentro, e cada novo cliente torna o prédio mais valioso para o próximo. É um efeito de rede expresso em concreto e cobre, e é por isso que a colocation se consolidou em um punhado de operadores, em vez de continuar um negócio imobiliário de commodity.",
      "E então um ciclo se fecha. A Equinix adquiriu a Switch and Data em 2010, e a Switch and Data era dona do PAIX. Os fundadores tinham saído da DEC para construir um ponto de troca neutro porque o que eles operavam não era deles; doze anos depois, a empresa deles o comprou.",
      "Lido ao lado de outros quatro verbetes daqui, o padrão é difícil de ignorar. O valor da CompTIA está em não pertencer a nenhum fabricante, e se isso sobrevive ao private equity é questão em aberto. O conselho da Kyndryl passou a valer mais no momento em que a IBM deixou de ser dona dela. O FreeRADIUS continuou aberto e virou aquilo contra o qual todo mundo constrói. A Equinix foi mais longe: não só se beneficiou da neutralidade, como descobriu que neutralidade podia ser vendida por metro quadrado.",
    ],
    // Profile: complete copy of profiles/equinix.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "equinix",
      // Founding stories: place (geography localised) and story translated.
      foundings: [
        {
          company: "PAIX, the Palo Alto Internet Exchange",
          year: 1996,
          place: "Palo Alto, Califórnia",
          founders: ["Digital Equipment Corporation"],
          story: "Construído e operado dentro da DEC, e o lugar onde a ideia foi provada antes de existir uma empresa para vendê-la. Um ponto de troca operado por alguém sem rede própria acabou sendo um produto diferente de um ponto de troca operado por uma operadora, porque o operador não tinha nada a ganhar com o caminho que o tráfego seguia.",
        },
        {
          company: "Equinix",
          year: 1998,
          place: "Redwood City, Califórnia",
          founders: ["Al Avery", "Jay Adelson"],
          story: "Constituída em 22 de junho pelos dois gerentes de instalações da DEC que tinham operado o PAIX. A tese era que os prédios onde as redes se encontram deveriam pertencer a alguém que não vende trânsito, não carrega tráfego e não concorre com nenhum dos clientes. A Benchmark Capital liderou uma rodada de US$ 12 milhões com Cisco e Microsoft como investidores estratégicos, uma indicação justa de quem achou o argumento convincente.",
        },
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        { year: 1996, title: "O PAIX começa a operar", detail: "Dentro da DEC, como prova de que um ponto de troca neutro se comporta de modo diferente de um operado por uma operadora." },
        { year: 1998, title: "Constituição da Equinix", detail: "Em 22 de junho, por Al Avery e Jay Adelson, para construir pontos de troca neutros como negócio, e não como instalação de pesquisa." },
        { year: 2000, title: "Listagem na NASDAQ", detail: "Listada em agosto, meses antes do colapso que eliminou a maioria das suas contemporâneas." },
        { year: 2010, title: "Switch and Data, e o PAIX volta para casa", detail: "A aquisição trouxe as instalações da Switch and Data e, com elas, o próprio PAIX." },
        { year: 2015, title: "Conversão em real estate investment trust", detail: "Uma decisão estrutural com consequências de comportamento: um REIT precisa distribuir a grande maioria do seu lucro tributável, o que empurra o negócio para receita recorrente previsível e contratos longos, em vez de crescimento a qualquer custo." },
        { year: 2025, title: "Interconexão em escala, e a questão da hiperescala", detail: "Mais de 499.000 interconexões implantadas, com receita de interconexão de US$ 422 milhões só no terceiro trimestre. Enquanto isso, 56 grandes projetos estavam em andamento em 33 regiões metropolitanas, doze deles construções de hiperescala xScale financiadas por joint ventures com investidores institucionais.", sourceNote: "Resultados do terceiro trimestre de 2025 e divulgação de projetos do primeiro trimestre de 2025; as contagens mudam de trimestre para trimestre." },
      ],
      // Products: names as the vendor writes them (descriptor words localised); descriptions translated.
      products: [
        { name: "Colocation IBX", what: "O International Business Exchange: espaço em rack ou em gaiola, circuitos de energia e segurança física, vendidos em contratos recorrentes longos. O espaço é a porta de entrada, e não o produto." },
        { name: "Cross-connects", what: "Uma fibra dedicada entre dois clientes dentro do mesmo prédio. A linha de maior margem do negócio, e a que um concorrente não consegue replicar sem antes reunir o mesmo conjunto de clientes." },
        { name: "Equinix Fabric", what: "Conexões definidas por software entre partes e entre regiões metropolitanas, que estendem a ideia do cross-connect para além das paredes de uma instalação. As vendas cresceram 57% em relação ao ano anterior em 2025." },
        { name: "Cloud on-ramps", what: "Conexões privadas diretas com os principais provedores de nuvem, tratadas como medida de participação de mercado por si mesmas: quantos dos on-ramps de uma região metropolitana chegam ao seu prédio." },
        { name: "xScale", what: "Campi de hiperescala construídos sob medida para os maiores operadores de nuvem, financiados por joint ventures e não pelo balanço: outro cliente, outra economia, e uma separação deliberada do negócio de interconexão." },
      ],
      // Innovations: titles and details translated.
      innovations: [
        { title: "Neutralidade como propriedade física, e não como política", detail: "O dono do imóvel não tem rede, não vende trânsito e não carrega tráfego. Não é um compromisso que uma gestão futura possa revisar: é a descrição do que a empresa não possui, e é por isso que clientes que concorrem entre si aceitam dividir um andar." },
        { title: "O efeito de rede que não se compra", detail: "Um prédio ganha valor na proporção de quem já está nele, e cada novo cliente o torna mais valioso para o seguinte. Quase meio milhão de interconexões não é uma lista de recursos: é o motivo pelo qual um concorrente com prédios idênticos e preços menores ainda perde o negócio." },
        { title: "Vender a conexão, e não o espaço", detail: "A interconexão é cerca de um quinto da receita, com margem muito maior que a da colocation, e cresce mais rápido. O negócio que parece imobiliário é, em boa parte, um negócio de conectividade operando dentro de imóveis." },
        { title: "A estrutura de REIT como estratégia", detail: "A conversão em 2015 comprometeu a empresa a distribuir a maior parte do seu lucro, o que combina com uma base de ativos de vida útil de vinte anos e receita contratada. Também limita a velocidade com que ela pode correr atrás de um mercado, uma disciplina num setor em que o excesso de construção já matou concorrentes antes." },
      ],
      // Market paragraphs: same count as the English.
      markets: [
        "Cerca de 260 instalações em aproximadamente 70 regiões metropolitanas de 33 países, atendendo mais de 10.000 clientes: provedores de nuvem e de hiperescala, operadoras, redes de conteúdo e empresas com arquiteturas híbridas que precisam tocar várias nuvens sem atravessar a internet pública para isso. A receita divulgada foi de aproximadamente US$ 8,3 bilhões a US$ 8,8 bilhões em 2024, com projeção de cerca de US$ 9,2 bilhões para 2025.",
        "A expansão recente foi para mercados sem densidade de interconexão estabelecida (Joanesburgo, Kuala Lumpur, Chennai), onde a proposta é virar o ponto de encontro antes de qualquer outro, a mesma jogada da original, que depende de chegar primeiro.",
      ],
      // Analyst statements: same count as the English.
      analyst: [
        "Classificada de forma constante no topo das avaliações de provedores de data center e colocation, com a densidade de interconexão, e não a área ou a capacidade de energia, como métrica distintiva.",
        "A questão estrutural a que os analistas sempre voltam é se os maiores clientes acabarão construindo os próprios data centers. Hyperscalers levando capacidade para dentro de casa tirariam os maiores clientes do modelo neutro, e as joint ventures xScale são em parte uma resposta a isso: atender a construção de hiperescala em vez de concorrer com ela.",
        "Cerca de 94% da receita é recorrente e cerca de 92% vem de clientes existentes, que é a cara, numa demonstração financeira, de um negócio construído sobre custos de troca.",
      ],
    },
  },
  // ---- ericsson: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "ericsson": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Ericsson - 150 anos de telefonia",
    // Card line (also the meta description) and intro paragraph.
    tagline: "De uma oficina de telégrafos em Estocolmo, em 1876, ao switch AXE, ao GSM, ao Bluetooth e ao triunvirato do 5G de hoje.",
    intro: "A Ericsson constrói a rede telefônica desde que o telefone era novidade. O switch digital AXE ligou o mundo, seus engenheiros foram centrais para o GSM, um projeto da Ericsson dos anos 1990 deu ao mundo o Bluetooth, e hoje ela está, com a Nokia e a Huawei, entre as três empresas capazes de construir uma rede móvel nacional de ponta a ponta.",
    // Body: 10 paragraph(s), same order as the English.
    body: [
      "Uma das três empresas capazes de construir uma rede móvel nacional de ponta a ponta começou como oficina de consertos numa antiga cozinha de treze metros quadrados numa rua de Estocolmo. O primeiro cliente foi o corpo de bombeiros da cidade, que em 6 de abril de 1876 pagou duas coroas para consertar alguns instrumentos.",
      "Ela não foi fundada para explorar uma invenção. Pelo relato da própria empresa, o objetivo era o desejo do fundador de trabalhar por conta própria, e a equipe, além de Lars Magnus, era um colega e um menino de recados de doze anos. No mesmo ano, sem que nenhum deles soubesse, Alexander Graham Bell registrava a patente do telefone nos Estados Unidos.",
      "A origem gira inteiramente em torno dessa patente e, mais precisamente, de onde ela não foi registrada. Bell protegeu o telefone em quase todo o mundo e não o protegeu na Suécia. Assim, quando clientes traziam aparelhos Bell para conserto, Lars Magnus era livre para estudá-los, melhorá-los e construir os seus, e foi o que fez, analisando também telefones Siemens. Os dele não eram tecnicamente inovadores. Eram mais bem-feitos e mais baratos, e em 1878 ele já os vendia.",
      "Há uma ironia que vale registrar sem insistir nela: uma empresa que existe por causa de uma patente não registrada foi fundada por um homem que era, pelo registro, um tanto contrário a patentes. Ele também não gostava de publicidade e não queria ser idolatrado, aposentou-se aos cinquenta e quatro anos e tinha vendido todas as ações em 1905.",
      "O que abriu o mercado não foi o produto, mas um cliente. As subsidiárias da Bell controlaram o serviço telefônico sueco até 1883, quando Henrik Tore Cedergren fundou uma operadora rival e comprou seus equipamentos da Ericsson. Um fabricante sem caminho até o mercado encontrou um ao abastecer o concorrente do incumbente, o movimento mais antigo deste setor e ainda o mais confiável.",
      "O telefone de parede que veio depois foi vendido no exterior como o padrão sueco, e o negócio de exportação que nasceu dele é o fio que leva a tudo o que veio depois: o switch AXE, o trabalho em GSM, o projeto Bluetooth e um presente em que três fabricantes no mundo conseguem fornecer uma rede móvel. Cento e cinquenta anos depois, a empresa ainda vende para operadoras, e não para o público: a mesma posição, em outra escala.",
      "Vender para operadoras significa que o equipamento fica onde as chamadas de um país são comutadas, e um episódio mostra o que essa posição carrega. Entre junho de 2004 e março de 2005, cerca de cem celulares da Vodafone Grécia foram interceptados: o primeiro-ministro e a esposa, ministros, autoridades militares e policiais, jornalistas. Os grampos rodavam em centrais Ericsson AXE, pelo recurso de interceptação legal que existe nesse tipo de equipamento porque os governos o exigem.",
      "O detalhe que deveria ser ensinado a partir disso é sobre como o recurso foi vendido. O AXE trata a interceptação legal em duas partes: um subsistema que executa o grampo e um sistema de gerenciamento que acrescenta grampos e mantém o registro. Onde os dois rodam, todo número interceptado fica registrado e um administrador pode auditar grampos que ninguém autorizou. A Vodafone não tinha comprado a opção de interceptação legal, então o sistema de gerenciamento estava ausente, mas uma atualização de software anterior já tinha entregado o subsistema de grampo. A capacidade de ouvir estava presente e a capacidade de perceber não.",
      "A porta de entrada também foi um recurso funcionando corretamente. As centrais AXE permitem aplicar patches no código sem reinicializar, porque uma rede nacional não pode parar para manutenção. É o mesmo formato do técnico de fotocopiadora em Washington e do controlador industrial que não pode ser desligado: o arranjo que mantém um sistema reparável é o arranjo que deixa alguém entrar.",
      "O desfecho é insatisfatório e precisa ser relatado assim. O software foi removido por ordem do CEO, o que também removeu as provas. Um dia depois, um engenheiro da Vodafone de 38 anos, que se casaria dali a três meses, foi encontrado enforcado; nenhuma ligação com o caso jamais foi estabelecida, e nenhuma deve ser sugerida. A investigação foi encerrada em 2008 sem suspeitos, e foram apresentadas acusações contra quem viesse a ser identificado como responsável, sem nomear ninguém. Duas décadas depois, o mecanismo de interceptação legal que um parlamento exigiu foi usado uma vez, em escala nacional, por partes ainda desconhecidas, o que é o argumento sobre acesso obrigatório sendo feito pelos fatos, e não pela opinião de alguém.",
    ],
    // Profile: complete copy of profiles/ericsson.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "ericsson",
      // Founding stories: place (geography localised) and story translated.
      foundings: [
        {
          company: "Ericsson",
          year: 1876,
          place: "Estocolmo, Suécia",
          founders: ["Lars Magnus Ericsson"],
          story: "Lars Magnus Ericsson abriu uma oficina de conserto de telégrafos em Estocolmo em 1876, o mesmo ano em que Bell patenteou o telefone, e logo estava construindo telefones melhores do que os que consertava. Um século e meio depois, a empresa que ele fundou teve participação em quase todas as gerações da rede telefônica mundial: os switches AXE que a digitalizaram, o padrão móvel nórdico que a tornou sem fio, o trabalho em GSM que tornou o sem fio global e as redes 5G que a tornam invisível. Poucas empresas foram infraestrutura essencial por tanto tempo.",
        },
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        { year: 1876, title: "A oficina", detail: "Ericsson começa consertando instrumentos de telégrafo e, em poucos anos, fabricando telefones, exportando-os para a Europa, a Rússia e além enquanto a tecnologia ainda é novidade." },
        { year: 1977, title: "AXE", detail: "O sistema de comutação digital AXE, desenvolvido com a Televerket na joint venture Ellemtel, torna-se uma das centrais telefônicas de maior sucesso da história: o burro de carga que digitalizou redes em todos os continentes." },
        { year: 1981, title: "NMT: começa a telefonia móvel", detail: "A rede Nordic Mobile Telephone, o primeiro sistema celular internacional automático do mundo, é lançada sobre comutação Ericsson; a vantagem nórdica vira liderança em GSM uma década depois." },
        { year: 1998, title: "O Bluetooth sai do laboratório", detail: "O trabalho de Jaap Haartsen em rádio de curto alcance na Ericsson, em meados dos anos 1990, batizado em homenagem a um rei viking, vira um SIG do setor e acaba saindo em mais aparelhos por ano do que há pessoas no mundo." },
        { year: 2001, title: "Sony Ericsson", detail: "A joint venture de celulares leva a Ericsson pela década do consumidor; a Sony compra a parte dela em 2012, e a Ericsson se dedica inteiramente à rede em si." },
        { year: 2022, title: "A virada corporativa", detail: "A aquisição da Vonage, de cerca de US$ 6,2 bilhões, acrescenta APIs de comunicação e se junta ao 5G corporativo da Cradlepoint: a Ericsson apostando que os futuros clientes da rede vão programá-la, e não ligar por ela. Börje Ekholm lidera a empresa desde 2017.", sourceNote: "Liderança conforme o último registro aqui; não reverificada nas páginas atuais da empresa." },
      ],
      // Products: names as the vendor writes them (descriptor words localised); descriptions translated.
      products: [
        { name: "Radio System e RAN", what: "O portfólio de rádio 5G: com Nokia e Huawei, uma das três respostas completas para construir uma rede móvel nacional." },
        { name: "Core e OSS/BSS", what: "O packet core e o parque de software da operadora: a metade invisível de toda assinatura." },
        { name: "Vonage e wireless corporativo", what: "APIs de CPaaS e WAN 5G da Cradlepoint: a rede como produto corporativo programável." },
      ],
      // Innovations: titles and details translated.
      innovations: [
        { title: "Bluetooth", detail: "Inventado na Ericsson e entregue a um grupo do setor: o rádio de curto alcance que, em silêncio, virou a tecnologia sem fio mais onipresente já fabricada." },
        { title: "Comutar o mundo, duas vezes", detail: "O AXE digitalizou a rede com fio; o trabalho da Ericsson em GSM e 5G fez isso de novo, sem fios: liderança em infraestrutura mantida ao longo de todas as gerações." },
      ],
      // Market paragraphs: same count as the English.
      markets: [
        "A Ericsson vende redes móveis, cores e comunicações corporativas no mundo todo: a integrante sueca do triunvirato do 5G, com a América do Norte como maior mercado e a aposta na rede programável definindo seu capítulo atual.",
      ],
      // Analyst statements: same count as the English.
      analyst: [
        "Líder permanente nas avaliações de infraestrutura móvel em todas as gerações: o fabricante cuja herança centenária em comutação ainda ancora as referências da categoria.",
      ],
    },
  },
  // ---- firemon: pt-BR prose for the record (facts stay in the English record) ----
  "firemon": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "FireMon - de olho na mudança de política",
    // Card line (also the meta description) and intro paragraph.
    tagline: "O valor não está na auditoria; está em perceber o que mudou no dia seguinte a ela.",
    intro: "A plataforma da FireMon gerencia políticas de firewall com ênfase na visibilidade em tempo real, que é o eixo que separa os produtos deste grupo: não como o conjunto de regras está hoje, mas o que mudou e quem mudou.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "Uma auditoria pontual descreve um ambiente que deixa de ser exato no momento em que alguém faz uma mudança de emergência às duas da manhã. As regras que causam incidentes raramente são as revisadas; são as acrescentadas sob pressão e nunca revistas, e elas são invisíveis para qualquer processo que faça amostragens trimestrais.",
      "Esse é o argumento operacional a favor do monitoramento contínuo de políticas, e é o mesmo argumento do controle de mudanças em qualquer outro lugar: o estado perigoso não é o que você inspecionou, é o que chegou depois.",
      "O produto é mais antigo que a empresa. O FireMon 1.0 foi lançado em março de 2001, quando fazia parte da FishNet Security, e o negócio separado veio depois; é por isso que uma data de fundação aqui se refere ao produto, e não à pessoa jurídica, e as duas são fatos de fato diferentes.",
    ],
  },
  // ---- fujitsu: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "fujitsu": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Fujitsu - a porta-bandeira da computação japonesa",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Nascida de um spin-off da Fuji Electric em 1935 (ela própria uma joint venture Furukawa-Siemens), a Fujitsu enfrentou a IBM com a Amdahl, absorveu a ICL e construiu os supercomputadores K e Fugaku.",
    intro: "A Fujitsu carrega o século do mainframe japonês: os computadores FACOM dos anos 1950, a parceria com a Amdahl que levou a briga dos compatíveis com IBM aos próprios clientes da IBM, a aquisição da ICL que a tornou uma potência europeia, e as máquinas K e Fugaku, que duas vezes lideraram o ranking mundial de supercomputadores. Seus negócios ópticos e de rede cabeiam uma parcela considerável do Pacífico.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "A Fujitsu é um dos nomes mais antigos da computação japonesa e, pela aquisição da ICL, a herdeira de boa parte da computação britânica. O motivo pelo qual ela está nesta seção é um caso sem nenhum atacante, o que faz dele um alerta de outro tipo em relação a todos os outros verbetes daqui: ninguém invadiu o Horizon. As pessoas que ele prejudicou foram prejudicadas por confiar nele.",
      "O Horizon era o sistema de contabilidade que a Fujitsu operava para os Correios britânicos (o Post Office) desde 1999, na época o maior projeto de TI não militar da Europa. Ele calculava quanto dinheiro cada agência deveria ter em caixa. Os sub-postmasters eram prestadores autônomos, e o contrato os tornava responsáveis por qualquer diferença entre o dinheiro no balcão e o número que o sistema produzia. Relatos de faltas sem explicação começaram quase de imediato.",
      "Entre 2000 e 2015, cerca de novecentos deles foram processados por furto, fraude e falsificação contábil com base nos números do Horizon. Alguns foram presos; alguns foram à falência; mais de duas mil pessoas foram afetadas, e algumas tiraram a própria vida. A Fujitsu sabia que o sistema tinha erros capazes de produzir perdas fantasmas, e suas testemunhas disseram aos tribunais que o sistema era robusto.",
      "A Court of Appeal, ao anular trinta e nove condenações em abril de 2021, resumiu o mecanismo numa frase: ao apresentar o sistema como confiável, a acusação tinha, na prática, invertido o ônus da prova. O número do computador era presumido verdadeiro, então o réu precisava provar uma negativa. E o registro que poderia ter resolvido a questão, um log completo de cada tecla digitada, guardado pela operadora, rotineiramente não era apresentado à defesa. Este catálogo defende em outro lugar que o registro de quem fez o quê precisa ficar onde ninguém com interesse possa alcançá-lo; aqui, o registro existia, a parte interessada o guardava, e as pessoas que ele teria inocentado nunca o viram.",
      "A reparação levou vinte e cinco anos e, no fim, uma minissérie de televisão. A Computer Weekly revelou a história em 2009; o inquérito público foi aberto em 2021; e foi uma dramatização em quatro episódios, em janeiro de 2024, que produziu a indignação pública que produziu a legislação de emergência para inocentar os condenados. No inquérito, o chefe europeu da Fujitsu admitiu que a empresa tinha perdido a oportunidade de evitar as condenações, e a Fujitsu pediu desculpas e aceitou o que chamou de obrigação moral de reparação. Em 2025, a maioria das vítimas ainda não tinha sido indenizada por completo.",
      "Para um catálogo de redes e segurança, a lição é incômoda porque não é técnica. Toda salvaguarda descrita nestas páginas (proveniência, logs, testes, revisão) pressupõe que, quando o sistema e um ser humano discordam, alguém vai olhar. O Horizon mostra o que acontece quando uma instituição decide de antemão que o sistema está certo: as salvaguardas não falham, simplesmente nunca são consultadas, e um defeito de software vira ficha criminal.",
    ],
    // Profile: complete copy of profiles/fujitsu.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "fujitsu",
      // Founding stories: place (geography localised) and story translated; company and founders stay English (fact fields).
      foundings: [
        {
          company: "Fujitsu (Fuji Tsushinki Seizo, or Fuji Telecommunications Equipment Manufacturing)",
          year: 1935,
          place: "Kawasaki, Japão",
          founders: ["Spun from Fuji Electric (the 1923 Furukawa-Siemens venture)"],
          story: "A linhagem da Fujitsu passa pela empresa mais antiga desta seção: ela foi separada em 1935 da Fuji Electric, ela própria uma joint venture de 1923 entre Furukawa e Siemens. Primeiro equipamentos telefônicos; depois, com o computador a relés FACOM 100 de 1954, a vanguarda da computação japonesa. Por noventa anos, a Fujitsu lutou em todos os cumes: mainframes compatíveis com IBM pela Amdahl, escala europeia pela ICL, infraestrutura nacional pela FENICS e pelas suas linhas ópticas, e o topo da TOP500 duas vezes, com o K e depois com o Fugaku movido a ARM.",
        },
      ],
      // Timeline: same events, same order, same years (the English order is kept as written); title, detail and provenance translated.
      timeline: [
        { year: 1954, title: "FACOM 100", detail: "Um computador a relés construído quando transistores eram exóticos: a indústria de computação do Japão começa, na prática, aqui, dentro de uma empresa de equipamentos telefônicos." },
        { year: 1972, title: "A aliança com a Amdahl", detail: "A Fujitsu investe na empresa de compatíveis de Gene Amdahl, o próprio arquiteto do 360 da IBM vendendo mainframes compatíveis com IBM com tecnologia Fujitsu; a aquisição completa vem em 1997, a parceria mais longa das guerras dos compatíveis." },
        { year: 1990, title: "ICL", detail: "A Fujitsu assume o controle majoritário da britânica ICL (controle total em 1998): um gigante japonês adquirindo uma campeã nacional europeia, refeita ao longo da década como o braço de serviços da Fujitsu para a Europa." },
        { year: 2011, title: "K: número um", detail: "Junho de 2011: o computador K, construído com o RIKEN, lidera a TOP500, com mais de 10 petaflops de SPARC64, a volta do Japão ao topo da supercomputação." },
        { year: 2019, title: "A era dos serviços", detail: "Takahito Tokita assume o comando do que hoje é a maior empresa de serviços de TI do Japão, com o Uvance como bandeira da transformação e as linhas de rede e HPC seguindo por baixo dele (liderança conforme o último registro aqui, não reverificada)." },
        { year: 2020, title: "Fugaku", detail: "Junho de 2020: o Fugaku assume o primeiro lugar com ARM, o processador A64FX da própria Fujitsu, e o mantém por quatro listas; a máquina que provou o ARM no topo, prenunciando a década da arquitetura nos data centers.", sourceNote: "Registros da TOP500, 2020-2021." },
      ],
      // Products: names as the vendor writes them (descriptor words localised); descriptions translated.
      products: [
        { name: "Serviços e Uvance", what: "O maior negócio de serviços de TI do Japão: consultoria, integração e serviços gerenciados em escala nacional." },
        { name: "Fujitsu Network Communications", what: "A linha de transporte óptico que cabeia backbones de operadoras, sobretudo na América do Norte e no Pacífico." },
        { name: "PRIMERGY, e a linha de HPC", what: "Servidores x86 e as joias da coroa da supercomputação: da herança SPARC64 ao A64FX do Fugaku." },
      ],
      // Innovations: titles and details translated.
      innovations: [
        { title: "A guerra dos compatíveis", detail: "Pela Amdahl, a Fujitsu provou que a própria arquitetura da IBM podia ser construída melhor e por menos: uma concorrência que disciplinou os preços dos mainframes por uma geração." },
        { title: "ARM no topo", detail: "O A64FX do Fugaku fez do ARM uma arquitetura de HPC de primeira linha: a prova que a onda ARM da hiperescala cita." },
      ],
      // Market paragraphs: same count as the English.
      markets: [
        "A Fujitsu lidera os serviços de TI japoneses, fornece redes ópticas por toda a orla do Pacífico e continua uma potência de primeira linha em supercomputação: a empresa telefônica descendente da Siemens que virou campeã nacional.",
      ],
      // Analyst statements: same count as the English.
      analyst: [
        "Presença permanente nas avaliações de serviços e infraestrutura do Japão e da Europa e, duas vezes, literalmente o número um da lista pela qual a supercomputação se mede.",
      ],
    },
  },
  // ---- getronics: pt-BR prose for the record (facts stay in the English record) ----
  "getronics": {
    // Parent note (official.parent.note), added 26/10/2026 with the parents apply; name, slug and year stay English facts.
    parentNote: "A Cheyne Capital, gestora global de investimentos, detém 87% da Getronics.",
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Getronics",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Uma empresa elétrica holandesa dos anos 1880 que acabou dona do que restou da Wang Laboratories.",
    intro: "A Getronics remonta à Groeneveld, van der Poll & Co., uma empresa eletrotécnica holandesa do fim do século XIX. Ela está nesta linha do tempo por um motivo: em 1999, adquiriu a Wang Global e virou o lugar onde foi repousar uma empresa que tinha definido o processamento de texto.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "A Wang Laboratories tinha chegado ao auge com cerca de US$ 3 bilhões de receita nos anos 1980 e 33.000 funcionários. Em 1999, o que a Getronics comprou foi a Wang Global, o negócio de serviços que sobrou depois do fim da era do hardware.",
      "As peças continuaram se movendo. A Getronics North America foi vendida à KPN em 2007 e, em seguida, à CompuCom, de Dallas, em 2008; assim, o resíduo da Wang passou por mais três donos depois da aquisição que supostamente tinha encerrado a história.",
      "Essa trajetória é o formato comum do fim de uma empresa de tecnologia. Empresas raramente param; são absorvidas, divididas e revendidas até que o nome original sobreviva apenas numa página de linhagem como esta.",
    ],
  },
  // ---- goldnet: pt-BR prose for the record (facts stay in the English record) ----
  "goldnet": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Goldnet TI - trinta anos com os mesmos dois fabricantes",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Integradora brasileira de TI com práticas Cisco e Microsoft, com atuação nacional.",
    intro: "A Goldnet TI integra soluções de TI no Brasil há trinta anos, com a prática organizada em torno de Cisco e Microsoft e incluindo site survey, o levantamento físico de radiofrequência que decide onde os access points sem fio de fato vão ficar.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "Vale notar que o site survey ganhou lugar no menu principal da empresa. É o serviço menos abstrato das redes corporativas (alguém percorre o prédio com um medidor) e o mais pulado, e é por isso que tantas implantações sem fio passam meses sendo diagnosticadas como problemas de software.",
      "Uma prática de trinta anos construída sobre dois fabricantes também é o contraexemplo do catálogo multivendor: profundidade naquilo que os clientes já usam, em vez de amplitude sobre o que eles talvez comprem.",
    ],
  },
  // ---- honeywell: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "honeywell": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Honeywell",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Uma empresa de termostatos que virou empresa de mainframes e depois voltou a controlar coisas físicas.",
    intro: "Mark Honeywell fundou a Honeywell Heating Specialty Company em Wabash, Indiana, em 1906. A outra metade da linhagem é ainda mais antiga: Albert Butz tinha formado a Butz Thermo-Electric Regulator Company em 1886 para comercializar um dispositivo que abria e fechava sozinho o registro de ar de uma fornalha, e esse negócio virou a Minneapolis Heat Regulator Company. As duas se fundiram em 1927 como Minneapolis-Honeywell, e por seus primeiros cinquenta anos o negócio da empresa foi regular temperatura.",
    // Body: 7 paragraph(s), same order as the English.
    body: [
      "Depois ela virou empresa de computadores, o que a maioria das pessoas esqueceu. Entrou por uma joint venture com a Raytheon em 1955, comprou a parte do sócio, adquiriu a Computer Control Corporation em 1966 e, ao longo dos anos 1960, foi um dos fabricantes apelidados em conjunto de Branca de Neve e os Sete Anões (a IBM era a Branca de Neve). Quando o campo se reduziu a cinco, os sobreviventes foram rebatizados pelas iniciais: Burroughs, UNIVAC, NCR, Control Data e Honeywell. O BUNCH.",
      "Em 1970, ela comprou a divisão de computadores da General Electric, e é essa a transação que importa aqui. Rebatizou os mainframes GE-600 como série Honeywell 6000 e herdou o projeto de sistema operacional que a GE tinha em andamento, o Multics.",
      "O Multics importa aqui pelo que estabeleceu. Era um sistema de timesharing enormemente ambicioso, e definiu o padrão do que um sistema assim deveria fazer em particular quanto à segurança: anéis de proteção, controle de acesso sobre segmentos, a ideia de que uma máquina compartilhada por usuários que desconfiam uns dos outros precisa que o sistema operacional imponha essa desconfiança. Sua influência sobre o Unix não é uma herança vaga: o nome Unix foi cunhado em contraste deliberado com ele. Todo sistema derivado do Unix em uso hoje, inclusive aqueles em que rodam as ferramentas deste site, descende de uma discussão sobre o Multics.",
      "A Honeywell também se tornou uma força séria em armazenamento. Sua joint venture com a Bull e a Control Data, a Magnetic Peripherals, foi a líder mundial em discos de catorze polegadas ao longo dos anos 1970 e do começo dos anos 1980.",
      "E então ela saiu. Fundiu suas operações de computação com a Bull e a NEC em 1986, vendeu a divisão por inteiro ao Groupe Bull e, em 1991, estava totalmente fora do negócio de computadores. Em 1986, tinha comprado a Sperry Aerospace, um pedaço de outro membro do BUNCH, e se voltado de novo para aviônica e sistemas de controle.",
      "A transação de 1999 merece ser descrita com precisão, porque costuma ser contada ao contrário. A AlliedSignal adquiriu a Honeywell e depois adotou para si o nome Honeywell, porque esse nome valia mais que o seu. A marca da empresa adquirida sobreviveu à da compradora.",
      "O que ela faz hoje fecha um círculo. A Honeywell constrói automação industrial, controle predial e sistemas aeroespaciais, ou seja, está de novo no negócio de controlar coisas físicas, depois de passar trinta e cinco anos no negócio de computá-las. E é investidora da Nozomi Networks, que aparece nesta linha do tempo pelo monitoramento da segurança de sistemas de controle industrial. Uma empresa que passou os anos 1970 rodando o sistema operacional que ensinou o setor sobre domínios de proteção agora financia as pessoas que vigiam os próprios controladores dela em busca de intrusões.",
    ],
    // Acquisitions: index-aligned with the English list (year, name, price and founder stay English).
    acquisitions: [
      // [0] 1970 General Electric's computer division
      { what: "O negócio de mainframes da GE, rebatizado como série Honeywell 6000.", became: "A Honeywell Information Systems, e a guarda do projeto Multics, cujo desenho moldou o Unix e, portanto, a maior parte do que veio depois.", sourceNote: "O negócio de controle de processos da GE veio separadamente, em 1974." },
      // [1] 1975 Xerox Data Systems
      { what: "A linha Sigma, que tinha uma base de clientes pequena, mas fiel.", became: "Absorvida pela linha da Honeywell; o sistema operacional CP-6 descende deste lado da casa." },
      // [2] 1986 Sperry Aerospace Group
      { what: "Comprada da Unisys, ou seja, dos restos fundidos de outros dois membros do BUNCH.", became: "A base do negócio moderno de aviônica da Honeywell." },
    ],
    // Profile: complete copy of profiles/honeywell.ts; years, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "honeywell",
      // No founding stories in the English profile.
      foundings: [],
      // Timeline: same events, same order, same years; title and detail translated.
      timeline: [
        { year: 1974, title: "O relatório do tiger team", detail: "Uma equipe da Força Aérea liderada por Paul Karger e Roger Schell atacou o Multics e documentou o que encontrou. As falhas individuais importavam menos que a demonstração: eles mostraram que o mecanismo de proteção podia ser subvertido por software malicioso colocado dentro dele, em vez de derrotado de fora. Entre as observações, em poucas linhas, estava a de que um back door podia ser escondido no binário de um compilador." },
        { year: 1975, title: "Project Guardian", detail: "Um esforço conjunto da Honeywell, do MIT e da Força Aérea, iniciado por Schell, para construir um kernel de segurança mínimo e verificável em resposta ao próprio relatório dele. A conclusão em que o trabalho se apoiava era que reestruturar o sistema em torno de um kernel assim era essencial antes que qualquer sistema pudesse ser exposto a atacantes profissionais determinados, algo escrito sobre timesharing que se lê como descrição da internet." },
        { year: 1985, title: "O primeiro B2", detail: "O Multics se tornou o primeiro sistema operacional certificado no nível B2 dos Trusted Computer System Evaluation Criteria, vinte anos depois do início do projeto e cerca de uma década depois do relatório que dizia que ele não era seguro o bastante." },
      ],
      // Products: names as the vendor writes them (descriptor words localised); descriptions translated.
      products: [
        { name: "O Honeywell 6180", what: "A máquina específica contra a qual as avaliações de segurança foram feitas, e aquela cujo hardware impunha os anéis de proteção de que o software dependia. Um trabalho de segurança desse tipo é sempre sobre um processador em particular, digam o que disserem os artigos depois." },
        { name: "Multics", what: "O sistema de timesharing herdado com a divisão da GE, e a única peça da história de computação desta empresa que ainda é discutida." },
        { name: "O Access Isolation Mechanism", what: "Controles de acesso obrigatórios entregues em todo Multics, e não numa edição militar especial, porque a Força Aérea queria sistemas disponíveis comercialmente, e não exclusivos do governo." },
      ],
      // Innovations: titles and details translated.
      innovations: [
        { title: "Anéis, que ainda estão no processador em que você lê isto", detail: "Os anéis de proteção impostos pelo hardware saíram deste trabalho, e o vocabulário sobrevive exatamente: ring 0 para o kernel e ring 3 para o código de usuário são termos do Multics que descrevem uma ideia do Multics, implementada em todo processador x86 fabricado desde então. Muito pouco da pesquisa em sistemas operacionais dos anos 1970 ainda está presente no silício." },
        { title: "Segurança da qual não se compra a versão barata", detail: "Como a Força Aérea insistiu em sistemas comerciais de prateleira, e não numa edição especial para o governo, os controles de acesso obrigatórios foram entregues a todos os clientes, com tudo configurado por padrão na classificação mais baixa. É uma decisão de compra incomum, com uma consequência duradoura: a configuração segura era o produto comum, e não um upgrade." },
        { title: "O back door no compilador, dez anos antes", detail: "A ideia de que um compilador poderia ser modificado para inserir um back door em tudo o que compilasse aparece no relatório de 1974, uma década antes de ficar famosa como palestra. Que a observação tenha sido feita durante uma avaliação de segurança governamental de um sistema operacional comercial, e depois em grande parte esquecida até alguém reformulá-la de modo memorável, é um comentário em si sobre como o conhecimento de segurança se propaga." },
        { title: "O crítico que escreveu o padrão", detail: "Schell liderou a equipe que documentou as fraquezas do Multics e depois dirigiu a agência que produziu o Orange Book, os critérios pelos quais sistemas seguros foram avaliados na década seguinte, e que se lê do começo ao fim como se tivesse sido escrito por alguém que passou anos atacando um sistema específico. A avaliação virou o padrão porque seu autor teve a chance de generalizá-la." },
      ],
      // Market paragraphs: same count as the English.
      markets: [
        "Seus clientes de computação eram governos, universidades e grandes empresas que compravam timesharing num momento em que um computador era um recurso institucional compartilhado, e não pessoal. Só o Air Force Data Services Center, no Pentágono, recebeu cinco grandes sistemas Multics.",
        "Seu mercado hoje é automação industrial e predial e o setor aeroespacial: controlar processos físicos, em vez de fazer cálculos sobre eles.",
      ],
      // Analyst statements: same count as the English.
      analyst: [
        "Não resta nenhuma posição em computação a avaliar. O que sobrevive é um conjunto de trabalhos publicados: o artigo sobre anéis de proteção, a avaliação de Karger e Schell, os princípios de projeto que saíram do mesmo grupo e os critérios que decorreram deles.",
        "O registro aqui é que uma divisão de mainframes vendida e esquecida é, ainda assim, estrutural. O vocabulário da proteção em sistemas operacionais, a prática de avaliar formalmente afirmações de segurança e a observação de que ferramentas confiáveis podem trair você remontam todos a esta máquina, e cada um deles surgiu porque alguém foi pago para atacá-la e anotar o que funcionou.",
      ],
    },
  },
  // ---- ibm: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "ibm": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "IBM - a empresa do século",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Dos cartões perfurados ao System/360, ao PC e à Red Hat: a empresa em relação à qual o resto do setor se definiu.",
    intro: "Durante a maior parte da história da computação, a IBM foi o setor: o monopólio da tabulação, a aposta de US$ 5 bilhões no System/360 que criou o mundo dos mainframes, o PC que coroou sem querer a Microsoft e a Intel, e a virada para serviços que a salvou. Suas impressões digitais em redes (SNA, Token Ring) atravessam várias outras páginas desta seção, e a aquisição da Red Hat em 2019 a liga à linhagem open source contada ali.",
    // Body: 7 paragraph(s), same order as the English.
    body: [
      "A importância da IBM para este catálogo não está no tamanho. Está em que, duas vezes, com décadas de distância, ela criou um mercado com o mesmo princípio e ficou com apenas um deles.",
      "O System/360, anunciado em 7 de abril de 1964, custou cerca de cinco bilhões de dólares e era conhecido dentro da empresa como a aposta que punha o negócio em jogo. O que ele comprou foi compatibilidade: pela primeira vez, uma arquitetura cobria toda a linha, de modo que o software escrito para uma máquina rodava nas outras. Antes dele, comprar um computador novo significava jogar fora os programas e começar de novo. É o modelo de negócio de plataforma, inventado aqui, e o setor vem reconstruindo-o desde então na busca, no comércio e na nuvem.",
      "A consequência foi permanente, e um historiador a resume bem: o efeito foi tão completo que a IBM nunca mais pôde lançar um computador incompatível com os já existentes. Vencer desse jeito define os termos de toda decisão posterior: a compatibilidade deixou de ser estratégia e virou obrigação.",
      "Dezessete anos depois, o Personal Computer aplicou a mesma abertura a outro problema, e o resultado se inverteu. Construído às pressas com componentes de prateleira e arquitetura publicada, o 5150 de agosto de 1981 criou um mercado enorme e entregou sua economia ao fornecedor do processador e ao fornecedor do sistema operacional. O 360 fez da IBM a plataforma; o PC fez da IBM uma fabricante na plataforma de outros. A diferença estava em quem era dono das peças que não podiam ser substituídas.",
      "O histórico em redes segue o mesmo formato. O SNA definiu como os grandes ambientes se comunicavam por uma geração, e o Token Ring era a rede local mais bem projetada pela maioria das medidas da época: determinística sob carga, sem colisões, com latência previsível. Perdeu para a Ethernet, que era mais barata e boa o bastante, e que uma empresa fundada pelo seu coinventor tornou comprável como placa. É a constatação mais repetida deste catálogo, e aqui ela aconteceu com a maior empresa do setor.",
      "Entre o mainframe e o PC está a máquina que provou o princípio da compatibilidade pela terceira vez. O Application System/400, anunciado em 21 de junho de 1988 e lançado em agosto daquele ano pelo laboratório de Rochester, Minnesota, como sucessor do System/36 e do System/38, trazia uma arquitetura, e não um processador: a Technology Independent Machine Interface permitia compilar as aplicações uma vez e traduzi-las abaixo da interface, de modo que, quando a linha passou dos processadores IMPI de 48 bits para chips de 64 bits derivados do PowerPC em 1995, e para o POWER4 em 2001, os programas nem perceberam. Cerca de 111.000 sistemas estavam instalados no fim de 1990, quando a linha faturou US$ 14 bilhões, e cerca de 500.000 tinham sido entregues até 1997; seu sistema operacional, o OS/400 de 26 de agosto de 1988, virou i5/OS em 2004 e IBM i em 2008, e em 2008 o hardware se fundiu com o System p no Power Systems. O IBM i 7.6 saiu em 18 de abril de 2025. O verbete AS/400 do glossário traz a linhagem em detalhe.",
      "O que a IBM fez com o século é a parte que costuma ser pulada: ela sobreviveu. A virada para serviços dos anos 1990, a venda do negócio de PCs e a aquisição da Red Hat em 2019 são uma única decisão contínua de parar de defender o que estava virando commodity e ir para onde a margem tinha ido. A maioria das empresas desta seção não conseguiu isso nem uma vez.",
    ],
    // Profile: complete copy of profiles/ibm.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "ibm",
      // Founding stories: place (geography localised) and story translated; company and founders stay English (fact fields).
      foundings: [
        {
          company: "IBM (formed as the Computing-Tabulating-Recording Company, CTR)",
          year: 1911,
          place: "Endicott, Nova York",
          founders: ["Charles Flint (merger architect); Thomas J. Watson Sr. (builder)"],
          story: "A IBM começou como uma fusão de holdings em 1911 (balanças, relógios de ponto e os tabuladores de censo de Herman Hollerith) que Thomas Watson Sr. transformou na International Business Machines até 1924. Durante a maior parte da história da computação, a IBM simplesmente foi o setor: o monopólio da tabulação, o mainframe, o disco rígido, o modelo relacional, o PC. Todas as outras empresas desta seção se definiram com a IBM, contra ela ou à sombra dela, inclusive na guerra do Token Ring contada na página da Madge e na era open source à qual ela finalmente aderiu comprando a Red Hat.",
        },
      ],
      // Timeline: same events, same order, same years; title and detail translated.
      timeline: [
        { year: 1924, title: "A máquina THINK de Watson", detail: "A CTR vira IBM sob Thomas Watson Sr.: a tabulação em cartões perfurados como infraestrutura de dados do mundo, e uma cultura de vendas que o setor imitaria por um século." },
        { year: 1964, title: "System/360: a aposta de US$ 5 bilhões", detail: "Uma arquitetura compatível do pequeno ao grande: a aposta que criou o mundo dos mainframes, a indústria de software que rodava sobre ele e o conceito de compatibilidade de que a computação ainda vive." },
        { year: 1981, title: "O PC, e o presente dado de graça", detail: "O IBM PC legitima a computação pessoal da noite para o dia, e sua arquitetura aberta, mais o DOS e o processador terceirizados, coroam a Microsoft e a Intel: a decisão de fazer ou comprar de maiores consequências na história dos negócios." },
        { year: 1993, title: "Gerstner", detail: "Depois do maior prejuízo corporativo da história americana até então, Lou Gerstner mantém a IBM inteira e a direciona para serviços: o elefante aprende a dançar, e o modelo de soluções integradas define as duas décadas seguintes." },
        { year: 2019, title: "Red Hat: US$ 34 bilhões", detail: "9 de julho de 2019: é concluída a maior aquisição de software até então; a IBM compra a porta-bandeira do open source para a nuvem híbrida, a história contada pelo outro lado na página da Red Hat desta seção. Arvind Krishna, o arquiteto do negócio, torna-se CEO em 2020." },
        { year: 2021, title: "Kyndryl, e a IBM concentrada", detail: "O negócio de infraestrutura gerenciada é separado como Kyndryl; o que fica é nuvem híbrida, IA (watsonx), computação quântica e o eterno mainframe, com a linha z ainda liquidando as transações do mundo." },
      ],
      // Products: names as the vendor writes them (descriptor words localised); descriptions translated.
      products: [
        { name: "IBM Z e Power", what: "A linhagem do mainframe e dos sistemas corporativos: descendentes diretos do System/360, ainda rodando os bancos." },
        { name: "Red Hat e nuvem híbrida", what: "OpenShift e RHEL como plataforma de nuvem híbrida: a aposta de 2019 como núcleo da estratégia atual." },
        { name: "watsonx e computação quântica", what: "A plataforma de IA e o programa quântico: a empresa de pesquisa que a IBM nunca deixou de ser." },
      ],
      // Innovations: titles and details translated.
      innovations: [
        { title: "A própria compatibilidade", detail: "O System/360 inventou a ideia de que o software sobrevive às gerações de hardware: o pacto sob o qual todo o setor opera hoje." },
        { title: "O motor da pesquisa", detail: "O modelo relacional, a DRAM, o disco rígido, o RISC, o FORTRAN, o SQL: a IBM Research inventou mais fundamentos deste setor do que qualquer instituição, com exceção dos Bell Labs." },
      ],
      // Market paragraphs: same count as the English.
      markets: [
        "A IBM vende nuvem híbrida, IA e sistemas corporativos às maiores instituições do mundo: uma empresa centenária concentrada, cujo passado em redes (SNA, Token Ring) e cujo presente open source (Red Hat) atravessam esta seção.",
      ],
      // Analyst statements: same count as the English.
      analyst: [
        "A empresa para cuja cobertura o setor de analistas foi praticamente inventado: presença constante em toda avaliação corporativa desde que avaliações existem.",
      ],
    },
  },
  // ---- imperva-thales: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "imperva-thales": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Imperva - da WebCohort à Thales",
    // Card line (also the meta description) and intro paragraph.
    tagline: "A pioneira do WAF fundada por um cofundador da Check Point, hoje o braço de segurança de aplicações de um gigante francês da defesa.",
    intro: "Fundada em Israel em 2002 como WebCohort por Shlomo Kramer (cofundador da Check Point, depois fundador da Cato Networks), Amichai Shulman e Mickey Boodaei, a empresa lançou o SecureSphere em 2003 e ajudou a definir a categoria do web application firewall. IPO na NYSE em 2011, fechamento de capital pela Thoma Bravo por US$ 2,1 bilhões em janeiro de 2019, e aquisição pela Thales por US$ 3,6 bilhões concluída em 4 de dezembro de 2023.",
    // Accuracy note: first person and the no-training statement kept exact.
    note: "Nem eu nem a Red Education ministramos treinamento Imperva ou Thales. Esta página é história corporativa, verificada em fontes primárias. A Imperva foi pioneira no mercado de WAF que eu ensino com o F5 Advanced WAF: a história dos rivais é a história do mercado.",
    // Profile: complete copy of profiles/imperva-thales.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "imperva-thales",
      // Founding stories: place (geography localised) and story translated.
      foundings: [
        {
          company: "WebCohort (renamed Imperva, 2004)",
          year: 2002,
          place: "Tel Aviv, Israel",
          founders: ["Shlomo Kramer", "Amichai Shulman", "Mickey Boodaei"],
          story: "Três fundadores com currículos que parecem a ementa de um curso israelense de segurança: Kramer tinha cofundado a própria Check Point; Shulman vinha do mundo da inteligência eletrônica das IDF; Boodaei fundaria depois a Trusteer (adquirida pela IBM) e a Transmit Security. A tese deles era o problema de dentro para fora: as redes estavam sendo protegidas enquanto as aplicações e os dados por trás delas continuavam expostos. O SecureSphere, lançado em 2003, atacou exatamente essa lacuna, e em 2004 a empresa passou a se chamar Imperva: tornar os dados impermeáveis.",
        },
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        { year: 2002, title: "Fundação da WebCohort", detail: "Kramer, Shulman e Boodaei abrem a empresa em Israel para proteger o que os firewalls não protegiam: as aplicações e os dados por trás delas." },
        { year: 2003, title: "Lançamento do SecureSphere", detail: "Chega o SecureSphere Web Application Database Protection: um web application firewall pioneiro, que aprendia o comportamento das aplicações, combinado com monitoramento de atividade de banco de dados." },
        { year: 2004, title: "Rebatizada como Imperva", detail: "A empresa adota o nome que mantém: dados críticos para o negócio tornados impermeáveis a ataques." },
        { year: 2011, title: "IPO na NYSE", detail: "A Imperva abre capital na New York Stock Exchange (IMPV); a sede se muda para os Estados Unidos no ano seguinte, com o desenvolvimento ancorado em Tel Aviv." },
        { year: 2014, title: "Incapsula absorvida", detail: "A Imperva adquire as ações restantes da Incapsula, seu braço de segurança de aplicações em nuvem e CDN: a pioneira do WAF on-premises vira também fornecedora de WAF em nuvem." },
        { year: 2019, title: "A Thoma Bravo fecha o capital", detail: "A gestora de private equity conclui o fechamento de capital por US$ 2,1 bilhões em janeiro de 2019 e tira a empresa da bolsa; a Distil Networks (gerenciamento de bots) é adquirida no mesmo ano, e a CloudVector (segurança de APIs) vem em 2021." },
        { year: 2023, title: "Thales", detail: "Anunciada em 25 de julho de 2023 e concluída em 4 de dezembro de 2023: a francesa Thales adquire a Imperva da Thoma Bravo por cerca de US$ 3,6 bilhões e a incorpora ao seu negócio de ciberdefesa. A Thales citou receita prevista para 2023 acima de US$ 500 milhões, com EBITDA de US$ 110 milhões; cerca de 1.400 funcionários, 500 deles no centro de desenvolvimento de Tel Aviv.", sourceNote: "Globes; Reuters; CRN (conclusão em 4 de dezembro de 2023)." },
      ],
      // Products: names as the vendor writes them (descriptor words localised); descriptions translated.
      products: [
        { name: "SecureSphere / Imperva WAF", what: "A linhagem de web application firewall de 2003 até hoje: appliances on-premises e o WAF em nuvem descendente da Incapsula." },
        { name: "Segurança de banco de dados", what: "Monitoramento de atividade de banco de dados e proteção centrada nos dados: a segunda metade da tese fundadora, hoje comercializada como Imperva Data Security Fabric." },
        { name: "Proteção de bots e APIs", what: "Advanced Bot Protection (da Distil Networks) e API Security (da CloudVector): a superfície moderna de ataque às aplicações." },
      ],
      // Innovations: titles and details translated.
      innovations: [
        { title: "A própria categoria do WAF", detail: "O SecureSphere é um dos produtos que fizeram de \"web application firewall\" um mercado: aprendizado comportamental do tráfego das aplicações, em vez de apenas regras estáticas." },
        { title: "Segurança centrada nos dados", detail: "A Imperva combinou o WAF com monitoramento de banco de dados desde o início: proteger os dados, e não só o perímetro à frente deles." },
        { title: "A diáspora dos fundadores", detail: "Os três fundadores seguiram adiante para construir de novo (Kramer fundou a Cato Networks, Boodaei fundou a Trusteer e a Transmit Security, Shulman cofundou a Nokod Security), uma medida do talento que começou aqui." },
      ],
      // Market paragraphs: same count as the English (first person kept).
      markets: [
        "A Imperva concorre em proteção de aplicações web e APIs (WAAP), o mercado em que eu ensino o Advanced WAF da F5 todos os dias, e em segurança de dados, hoje como o braço de segurança de aplicações da Thales, o grupo francês aeroespacial e de defesa.",
        "A trajetória da empresa é o ciclo de vida completo de um fabricante de segurança: startup israelense, pioneira de categoria, listagem na NYSE, controle por private equity e, por fim, aquisição estratégica por um conglomerado de defesa.",
      ],
      // Analyst statements: same count as the English.
      analyst: [
        "Na aquisição pela Thales, esperava-se que a Imperva entregasse mais de US$ 500 milhões de receita em 2023, com EBITDA de US$ 110 milhões: uma avaliação de US$ 3,6 bilhões para uma empresa cujo capital tinha sido fechado por US$ 2,1 bilhões menos de cinco anos antes.",
      ],
      // Career link: label translated (first person kept), href untouched.
      careerLink: {
        href: "/f5",
        label: "A Imperva foi pioneira no mercado de WAF que eu ensino com o F5 Advanced WAF: a central da F5",
      },
    },
  },
  // ---- kemp: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "kemp": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Kemp Technologies",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Pôs no load balancer um preço para o administrador, e não para o comitê, e virou virtual antes do mercado.",
    intro: "A Kemp foi fundada em Nova York em 2000, num mercado em que um application delivery controller significava um chassi de seis dígitos e um ciclo de compras. O LoadMaster custava o preço de um servidor e era vendido para quem simplesmente precisava manter uma carga de trabalho no ar. A Progress Software adquiriu a empresa em 2021.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "O perfil abaixo cobre a fundação, a ida precoce para appliances virtuais e a aquisição de 2021.",
      "Vale ler ao lado da A10, que aparece separadamente aqui e atacou a mesma categoria por cima, pelo throughput. As duas rotas de fuga dos preços de um incumbente dominante são para baixo e para o lado, e estas são as empresas que as tomaram.",
    ],
    // Profile: complete copy of profiles/kemp.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "kemp",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          company: "Kemp Technologies",
          year: 2000,
          place: "Nova York, Estados Unidos",
          founders: [],
          story: "A Kemp atacou o mercado de load balancing por baixo. Enquanto os líderes vendiam chassis de seis dígitos para quem tinha comitês de controle de mudanças, o LoadMaster custava o preço de um servidor e era vendido ao administrador que só precisava manter o Exchange no ar, e a Kemp apostou justamente nesse comprador, publicando guias de implantação para cargas Microsoft tão específicos que viraram a documentação de referência. Uma ida precoce e convicta para appliances virtuais alargou a brecha: quando o hypervisor virou o data center, a Kemp já estava lá, com preço para o mercado intermediário que os gigantes viviam esquecendo.",
          sourceNote: "Peter Melerud é citado entre os tecnólogos fundadores; uma lista completa de fundadores não está estabelecida aqui.",
        },
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        { year: 2000, title: "Fundada em Nova York", detail: "Num mercado em que um application delivery controller significava um chassi de seis dígitos e um processo de compras." },
        { year: 2008, title: "O LoadMaster vira virtual cedo", detail: "Edições virtuais lançadas quando boa parte do setor ainda associava um ADC a chapa metálica: uma aposta no hypervisor que rendeu dividendos crescentes à medida que os data centers se virtualizavam." },
        { year: 2021, title: "A Progress Software adquire a Kemp", detail: "Cerca de US$ 258 milhões: a pioneira do ADC acessível vira o braço de experiência de aplicações de uma casa de software, com o LoadMaster seguindo sob novo dono.", sourceNote: "Cerca de US$ 258 milhões, anunciada em setembro de 2021 e concluída em novembro de 2021, segundo as declarações públicas da Progress Software." },
      ],
      // Products: names as the vendor writes them (descriptor words localised); descriptions translated.
      products: [
        { name: "LoadMaster", what: "O ADC acessível em versões de hardware, virtual e nuvem: load balancing dimensionado e precificado para as cargas que a maioria das organizações de fato roda, e não para as maiores." },
        { name: "Templates para cargas Microsoft", what: "Guias de implantação e templates pré-configurados para Exchange, SharePoint e o resto, específicos o bastante para virarem a documentação que os profissionais buscavam, inclusive profissionais que tinham comprado o load balancer de outra empresa." },
      ],
      // Innovations: titles and details translated.
      innovations: [
        { title: "O ADC virtual em primeiro lugar", detail: "Lançar appliances virtuais cedo reformulou o ADC como software com hardware opcional, a formulação que o mercado inteiro, líderes incluídos, acabou adotando. Chegar cedo a isso valeu mais que qualquer recurso." },
        { title: "Preço para o administrador, e não para o comitê", detail: "Vender pelo preço de um servidor deixou a compra abaixo do limite que dispara um processo de compras, o que muda quem é o cliente. O comprador é a pessoa com o problema, e não a pessoa com a autoridade sobre o orçamento, e isso é outro produto mesmo quando a tecnologia é parecida." },
        { title: "Documentação como canal de vendas", detail: "Publicar guias de implantação específicos o bastante para terem autoridade atraiu clientes que já chegavam sabendo como o produto funcionava. É um método lento e difícil de copiar, porque exige ser de fato útil antes que alguém tenha pagado." },
      ],
      // Market paragraphs: same count as the English.
      markets: [
        "Organizações do mercado intermediário e ambientes de cargas Microsoft, e desde 2021 dentro do portfólio da Progress Software. O cliente é aquele que os fabricantes corporativos afastaram pelo preço, e não aquele que disputavam.",
        "Sua contraparte vinda da direção oposta é a A10, que atacou a mesma categoria por cima, pelo throughput, e aparece separadamente nesta linha do tempo. Entre as duas, são o motivo pelo qual application delivery é um mercado, e não um monopólio.",
      ],
      // Analyst statements: same count as the English.
      analyst: [
        "Avaliada historicamente como a líder em custo-benefício em application delivery, com a aposta no virtual em primeiro lugar reconhecida, em retrospecto, como antecipação do caminho que a categoria inteira seguiu.",
        "Sua posição hoje é a de um componente dentro de um portfólio de software maior, e não a de uma desafiante independente, o final comum para uma empresa cujo ativo distintivo era a disciplina de preço.",
      ],
    },
  },
  // ---- madge: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "madge": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Madge Networks - a porta-bandeira do Token Ring",
    // Card line (also the meta description): The Register's quoted words stay in English with a gloss.
    tagline: "De uma fazenda em Buckinghamshire a vencer a IBM nos tribunais no próprio jogo da IBM, e a afundar com o protocolo que defendeu: 'the Betamax of the networking world' (o Betamax do mundo das redes).",
    // Intro paragraph.
    intro: "Robert Madge fundou a empresa na fazenda da família em 1986 sem nenhuma tecnologia nova, só com a aposta de que o Token Ring da IBM podia ser construído melhor e vendido com mais garra do que a IBM fazia. Venceu a briga judicial que o tornou livre de royalties, levou o anel a mais de 25 países e à Sunday Times Rich List, protegeu-se com a israelense Lannet (vendida à Lucent por US$ 117 milhões em 1998) e absorveu o negócio de Token Ring da rival Olicom em 1999, quando o anel já era 81 por cento das vendas, um mercado encolhendo sob seu último campeão. Um tribunal holandês decretou a falência em 2003; os restos foram parar na Ringdale, coroada a maior fornecedora mundial de tecnologia Token Ring depois que o mundo tinha parado de comprá-la.",
    // Accuracy note: first person, the no-training statement and the English's switch to "he" kept as written.
    note: "A Madge Networks não existe mais como empresa em operação, e nenhuma associação de treinamento com ela ou com qualquer sucessora está implícita. Esta página é história corporativa, verificada nos documentos da Madge na SEC e em fontes primárias. Minha ligação vem da trincheira oposta da grande guerra de protocolos: na Cabletron, de 1996 a 2000, eu lutei pela Ethernet nas contas de ambiente IBM, comuns no Brasil, em que o Token Ring da Madge era o incumbente. Todas as páginas da guerra dos hubs nesta seção contam o lado da Ethernet; esta homenageia a tecnologia que perdeu.",
    // Ending note (the year stays in the English record).
    endedNote: "Um tribunal holandês decretou a falência em 2003, depois que um administrador foi nomeado em 17 de abril; os restos do Token Ring foram parar na Ringdale.",
    // Profile: complete copy of profiles/madge.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "madge",
      // Founding stories: place (geography localised) and story translated.
      foundings: [
        {
          company: "Madge Networks",
          year: 1986,
          place: "A fazenda da família Madge, Buckinghamshire, Inglaterra (sede depois em Wexham; N.V. domiciliada nos Países Baixos)",
          founders: ["Robert Madge"],
          story: "Robert Madge dava aulas de equitação antes de escrever software: jogos de xadrez para computador na britânica Intelligent Software, onde também gerenciou o projeto do microcomputador Enterprise. Em 1986, ele se instalou na fazenda da família em Buckinghamshire com uma heresia de startup: nenhuma tecnologia nova. Enquanto todo mundo se amontoava na Ethernet, a Madge apostou no protocolo que a IBM tinha inventado, o Token Ring, e se propôs a vendê-lo melhor do que a IBM. Os primeiros produtos saíram em 1987, uma segunda sede foi aberta em San Jose e, quando a IBM veio cobrar royalties, a Madge brigou nos tribunais e ganhou o direito de construir Token Ring sem pagá-los: a vitória que pôs uma startup de fazenda inglesa em posição privilegiada no próprio mercado da IBM, e seu fundador na Sunday Times Rich List.",
        },
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        { year: 1986, title: "Fundada na fazenda", detail: "Uma startup numa casa de fazenda de Buckinghamshire encara o caminho não tomado do mercado de redes: o Token Ring, determinístico, ordenado e tecnicamente elegante, contra a Ethernet barata e caótica que todo mundo está construindo." },
        { year: 1994, title: "Os anos de auge", detail: "Em meados dos anos 1990, a Madge é líder mundial em redes de alta velocidade: adaptadores (ISA, PCI, PC Card), switches e stacks, com escritórios em mais de 25 países e sedes principais em Wexham, Eatontown e San Jose; a única casa séria de Token Ring além da própria IBM, listada na NASDAQ como N.V." },
        { year: 1995, title: "A proteção na Ethernet: Lannet", detail: "Novembro de 1995: a Madge adquire a israelense Lannet, uma das principais fabricantes de hubs Ethernet e de switching, a aposta na diversificação, seguida pela Teleos, especialista em vídeo e ISDN, em fevereiro de 1996. O Token Ring ainda é 65 por cento das vendas; a proteção existe para corrigir isso.", sourceNote: "Datas das aquisições segundo os documentos da Madge na SEC e a cobertura da época." },
        { year: 1998, title: "O recuo, e o cemitério da Lucent", detail: "A proteção é desfeita: a Lannet é vendida à Lucent Technologies por US$ 117 milhões (anunciada em julho de 1998), juntando-se à mesma colecionadora que mais tarde reuniria a Riverstone e a Alteon. Entre julho de 1997 e setembro de 1998, a Madge corta cerca de dois terços do pessoal e empurra o High-Speed Token Ring, de 16 a 100 Mbit/s com ambições de gigabit, como o caminho dos fiéis.", sourceNote: "Números da venda e da reestruturação segundo os documentos F-3/F-3A da Madge na SEC (1999); o documento registra a venda em agosto de 1998." },
        { year: 1999, title: "A última consolidadora de um mundo encolhendo", detail: "Agosto de 1999: a Madge compra o negócio de Token Ring da rival Olicom e vira a única grande produtora da tecnologia além da IBM. O próprio documento dela na SEC conta a história real: o Token Ring agora é 81 por cento das vendas, concentração por encolhimento, e não por crescimento. A Gains International (fevereiro) vira Madge.web, uma tentativa de fuga para os serviços gerenciados." },
        { year: 2001, title: "O desmonte", detail: "O negócio de vídeo vai para a Initia (setembro de 2000); a empresa de wireless Red-M é transferida a uma coligada (abril de 2001); a Madge.web entra em Administration no Reino Unido em 27 de abril de 2001, e seus ativos de voz para traders são vendidos à Tullett & Tokyo em julho. O próprio Robert Madge sai em 2001, depois de quinze anos, tendo, pelo próprio relato, levado a empresa para cima e levado a empresa para baixo." },
        { year: 2003, title: "O fim num tribunal holandês", detail: "Um administrador é nomeado pela justiça holandesa em 17 de abril de 2003, e uma ordem de falência, o equivalente holandês do Chapter 7, é decretada em maio. O negócio operacional é reconstituído no Reino Unido como Madge Ltd. O The Register escreve o epitáfio da era: o Token Ring, embora tecnicamente superior, tinha virado 'the Betamax of the networking world' (o Betamax do mundo das redes)." },
        { year: 2006, title: "A vida após a morte", detail: "Reestruturados como Madge Inc. e reinventados por um tempo em torno de LAN sem fio, os restos são absorvidos em 2006 pela Network Technology PLC e fundidos ao seu braço Ringdale sob o nome Madge, o que faz da Ringdale a maior fornecedora mundial de tecnologia Token Ring, um superlativo concedido para um mercado que já não existia. Robert Madge, por sua vez, seguiu adiante e foi aclamado em RFID e rastreamento." },
      ],
      // Products: names as the vendor writes them (descriptor words localised); descriptions translated.
      products: [
        { name: "Adaptadores Token Ring", what: "As famílias ISA, PCI e PC Card que puseram anéis da Madge em milhões de desktops de ambientes IBM: a franquia central, construída sem royalties depois da vitória nos tribunais." },
        { name: "Switches e stacks Token Ring", what: "O switching de grupo de trabalho, o empilhamento e a infraestrutura de anel que levaram o Token Ring corporativo ao seu auge, e a resposta da Madge à onda dos switches Ethernet." },
        { name: "High-Speed Token Ring (HSTR)", what: "A liderança da Madge na padronização do sucessor de 100 Mbit/s: compatível com o anterior, com ambições de gigabit e, no fim, o último ato de engenharia de um protocolo derrotado." },
        { name: "Lannet Ethernet (1995-1998)", what: "A linha israelense de hubs e switching que foi a proteção da Madge no lado vencedor: mantida por três anos e depois vendida à Lucent." },
        { name: "Vídeo, ISDN e Madge.web", what: "Os equipamentos de conferência herdados da Teleos, os Edge Switching Nodes para operadoras ISDN e a empresa de serviços gerenciados: as diversificações que nunca substituíram o anel." },
      ],
      // Innovations: titles and details translated.
      innovations: [
        { title: "Executar melhor que o inventor", detail: "A Madge não trouxe nenhuma tecnologia nova: simplesmente construiu o protocolo da IBM melhor, mais barato e mais rápido que a IBM, e venceu a briga judicial que o tornou livre de royalties. Uma aula de estratégia de seguidor rápido, até a própria categoria morrer." },
        { title: "A campeã das redes determinísticas", detail: "A passagem de token do Token Ring dava latência previsível e um comportamento sob carga que a Ethernet compartilhada não conseguia igualar: o argumento de engenharia que a Madge carregou, com razão, até a irrelevância." },
        { title: "O caso exemplar", detail: "Investimento em ATM sem retorno algum, uma proteção na Ethernet abandonada, uma virada tardia para o wireless: o fim da Madge é o caso de manual, e seu próprio fundador reconheceu depois que, quando uma tecnologia declina, fundir ou vender é o caminho lógico. Ele a manteve independente porque ela levava o nome dele." },
      ],
      // Market paragraphs: same count as the English (first person kept).
      markets: [
        "A Madge é o capítulo que falta à guerra dos hubs desta seção: todas as outras páginas contam a história pelo lado da Ethernet. Em meados dos anos 1990, o desfecho era de fato incerto: o Token Ring dominava a empresa centrada na IBM, e em nenhum lugar mais do que em mercados como o Brasil, onde os ambientes de mainframe faziam do anel o incumbente contra o qual a minha Cabletron lutou de 1996 a 2000.",
        "A trajetória dos próprios números da empresa na SEC conta a tragédia inteira: o Token Ring era 65 por cento das vendas em 1996 e 81 por cento em 1999, não porque o anel cresceu, mas porque todo o resto foi vendido ou fechado. A última consolidadora de um mercado que desaparecia.",
      ],
      // Analyst statements: same count as the English (The Register's quoted words stay in English with a gloss).
      analyst: [
        "Segundo os próprios documentos F-3 da Madge na SEC, o Token Ring representou 65, 65 e 72 por cento das vendas líquidas em 1996, 1997 e 1998, e 81 por cento nos primeiros nove meses de 1999: a curva de concentração de uma tecnologia em declínio terminal.",
        "O veredito do The Register em 2003 permanece como epitáfio de toda a guerra de protocolos: o Token Ring, embora tecnicamente superior, virou 'the Betamax of the networking world' (o Betamax do mundo das redes), e a Madge, sua maior campeã independente, afundou junto com ele.",
      ],
      // Career link: label translated (first person kept), href untouched.
      careerLink: {
        href: "/industry/chapters/cabletron-enterasys",
        label: "Lutei a guerra entre Token Ring e Ethernet do outro lado: a página da Cabletron",
      },
    },
  },
  // ---- multiplus: pt-BR prose for the record (facts stay in the English record) ----
  "multiplus": {
    // Title: company verbatim as the English writes it, subtitle translated (the " - " separator is structural).
    name: "Multiplus Ciberseguranca - a camada de entrega, protegida",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Empresa brasileira de cibersegurança que cobre proteção de dados, endpoints, application delivery e observabilidade.",
    intro: "A Multiplus Ciberseguranca atua em compliance e proteção de dados, proteção de endpoints, application delivery moderno, segurança de rede, nuvem e aplicações, e observabilidade: um catálogo que põe o application delivery ao lado da segurança, em vez de tratá-los como compras separadas.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "Essa combinação é a correta para quem já operou um load balancer. O equipamento que distribui o tráfego é também o que termina o TLS, vê cada requisição em texto claro e, portanto, é o lugar natural para impor uma política, e é por isso que application delivery e segurança de aplicações web convergiram em produtos únicos em todo este setor.",
      "Uma empresa organizada do mesmo jeito está descrevendo essa convergência, e não um pacote, e é o formato que a maior parte do material de F5 neste site pressupõe sem dizer.",
    ],
  },
  // ---- netcraft: pt-BR prose for the record (facts stay in the English record) ----
  "netcraft": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Netcraft",
    // Card line (also the meta description) and intro paragraph.
    tagline: "A empresa que conta os servidores da web todo mês desde 1995 e hoje derruba um terço do phishing do mundo.",
    intro: "A Netcraft é uma empresa de cibersegurança fundada em Bath, Inglaterra, por Mike Prettejohn em 1994 e dirigida a partir de Londres desde 2023. Durante a maior parte da vida da web, ela foi conhecida por uma tabela mensal: a Web Server Survey, lançada em 1995, que pergunta a cada hostname que consegue encontrar qual software responde e, assim, virou o registro público do que roda na web, citado em toda discussão sobre participação de mercado de servidores web desde então. A mesma máquina de varredura e classificação, apontada para criminosos em vez de servidores, virou o negócio: detectar sites de phishing, golpes e aplicativos falsos e tirá-los da internet.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A linha do tempo da própria empresa vai da pesquisa de 1995 à SSL Survey de 1996, a um serviço de detecção de fraude em 2004, a um feed de phishing em 2005 e às primeiras remoções em 2006, às primeiras remoções automatizadas em 2013, a modelos de machine learning a partir de 2014 e, em 2024, a um serviço conversacional de inteligência sobre golpes. Hoje ela afirma realizar um terço das remoções de phishing do mundo, com tempo mediano de trinta e três minutos entre a detecção e a remoção, e conta entre seus clientes dezesseis dos cinquenta maiores bancos e nove dos cinquenta maiores governos.",
      "Ela foi de capital fechado e sem investimento externo por quase três décadas. Em 18 de julho de 2023, a Spectrum Equity investiu mais de US$ 100 milhões, o primeiro capital externo da empresa, e Ryan Woodley se tornou CEO; a sede se mudou de Bath para Londres no mesmo ano. Em 12 de setembro de 2023, a Netcraft comprou a FraudWatch International, de Melbourne, uma empresa de proteção de marca online com um centro de operações de segurança funcionando 24 horas, o que lhe deu uma base na Austrália.",
      "A Netcraft Ltd, a pessoa jurídica, foi constituída em 4 de setembro de 1987 e está registrada em 63 Catherine Place, Londres, o endereço que o site indica como sede; o negócio que o registro descreve começou em 1994, e o card traz esse ano.",
      "Por que ela pertence a um registro de redes: a Web Server Survey é a medição pública contínua mais longa do que roda na web, e qualquer pessoa que já discutiu participação de mercado de Apache, IIS ou nginx a citou. O negócio de remoções é a ponta prática da mesma disciplina que este site ensina nas suas páginas de segurança: um site de phishing é um registro DNS, um certificado e um servidor web, e removê-lo significa saber a quem pedir, e em que ordem.",
    ],
    // Acquisitions: index-aligned with the English list (year, name, price and founder stay English).
    acquisitions: [
      // [0] 2023 FraudWatch International
      { what: "Empresa de proteção de marca online de Melbourne, Austrália, com centro de operações de segurança 24/7; phishing, falsificação de perfis em redes sociais, violação de marca e aplicativos móveis falsos. Termos não divulgados.", became: "A operação australiana da Netcraft.", sourceNote: "Notícias da Netcraft, 12 de setembro de 2023; Wikipedia: Netcraft (lido em 06/10/2026)." },
    ],
  },
  // ---- opendns: pt-BR prose for the record (facts stay in the English record) ----
  "opendns": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural; "resolver" kept as practitioners say it).
    name: "OpenDNS - o resolver que virou produto de segurança",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Um resolver DNS público adquirido pela Cisco e reconstruído como Umbrella.",
    intro: "A OpenDNS operava um resolver recursivo público e foi adquirida pela Cisco, tornando-se a base do Cisco Umbrella. Sua importância está no movimento que ela demonstrou: um resolver que responde a consultas é também um dispositivo que vê cada nome que uma rede pede, antes que qualquer conexão seja feita.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A OpenDNS foi fundada em 1º de novembro de 2005 por David Ulevitch, que estava no setor desde o ensino fundamental, trabalhando num provedor de internet de San Diego que foi membro fundador da Packet Clearing House enquanto ela construía um dos primeiros pontos de troca de tráfego da internet. Ainda estudante, em 2001, ele já tinha criado o EveryDNS, um serviço autoritativo que depois vendeu para a Dyn.",
      "A proposta original era um resolver público gratuito, mais rápido que o oferecido pelo seu provedor, que corrigia erros de digitação e bloqueava sites de phishing. Isso é um produto de consumo, e o movimento interessante veio por volta de 2009, quando a mesma infraestrutura foi apontada para empresas: todo dispositivo numa rede pergunta ao resolver onde as coisas estão, então um resolver vê a intenção antes que uma conexão seja feita, e pode recusá-la.",
      "O Umbrella foi o resultado: uma aplicação de políticas que acompanha o dispositivo para fora da rede corporativa, porque um laptop num hotel continua precisando resolver nomes. É o argumento para pôr um controle na camada de nomes, e não no perímetro, e ele chegou antes de a maioria das organizações aceitar que o perímetro tinha deixado de ser onde seus usuários estavam.",
      "A Cisco adquiriu a empresa em 2015 por 635 milhões de dólares, quando ela já operava 25 data centers e concorria com provedores, operadoras e o Google. O comentário do próprio Ulevitch sobre a venda merece ser preservado porque é incomumente direto sobre a diferença entre duas coisas que os fundadores normalmente confundem: eles tinham considerado e recusado outras ofertas e, nas palavras dele, não decidiram vender a OpenDNS; decidiram vender a OpenDNS para a Cisco.",
    ],
  },
  // ---- oracle: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "oracle": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Oracle - o império do banco de dados",
    // Card line (also the meta description) and intro paragraph.
    tagline: "O primeiro banco de dados SQL comercial, quatro décadas de aquisições, a Sun entre elas, e a passagem de comando para co-CEOs em 2025, para a era da IA.",
    intro: "A Oracle comercializou o banco de dados relacional antes que a IBM, empregadora do seu inventor, se mexesse para isso, e vem multiplicando essa vantagem há quase cinquenta anos. Sua máquina de aquisições redesenhou o mapa do setor ao absorver PeopleSoft, BEA, Sun Microsystems, NetSuite e Cerner, e a passagem de comando para co-CEOs em 2025 marca a virada para a era da infraestrutura de IA.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "O banco de dados relacional foi inventado na IBM. O artigo de Edgar Codd de 1970 era da IBM, o System R era da IBM, e o SQL era da IBM. A empresa que o vendeu foi formada por três programadores vindos da Ampex com dois mil dólares, mil e duzentos deles das economias do próprio Larry Ellison, e nenhum capital de risco.",
      "O detalhe que decidiu tudo é pequeno e vale ser guardado. Ellison não pretendia concorrer com a IBM; queria que seu produto fosse compatível com o System R, o que o teria tornado um complemento, e não um rival. A IBM manteve em segredo os códigos de erro do seu banco de dados, a compatibilidade se tornou impossível, e então ele construiu um concorrente. Uma empresa protegeu um detalhe menor de implementação e fabricou a própria concorrência.",
      "É a segunda vez que esta seção registra o padrão com a mesma empresa do lado perdedor, e o verbete da IBM conta a outra metade: a empresa que cria uma categoria muitas vezes não é a que fica com ela.",
      "Dois detalhes da fundação sobreviveram às suas circunstâncias. O nome veio de um projeto da CIA em que os três tinham trabalhado juntos, de modo que o maior banco de dados do setor leva o nome de um codinome do governo. E a primeira versão saiu como Version 2, com o raciocínio de que compradores desconfiam de uma versão 1; nunca houve versão 1, e o truque vem sendo copiado discretamente desde então.",
      "A ausência de capital de risco também não é nota de rodapé. Ela deixou o controle concentrado, e um controle concentrado é o que permitiu a uma única figura conduzir uma estratégia de aquisições por quatro décadas sem precisar explicar cada compra a um conselho que tivesse mais da empresa do que ele. PeopleSoft, Siebel, BEA, Sun, NetSuite e Cerner são o resultado visível.",
      "A Sun, em 2010, é a que importa para este catálogo, porque pôs o Java, o Solaris e o MySQL sob o mesmo teto do banco de dados comercial que eles, cada um a seu modo, sustentavam e ameaçavam. Comprar a plataforma em que seu produto roda é um movimento defensivo que parece expansão, e o padrão se repete sempre que uma camada de que alguém depende deixa de ser, com segurança, de outra pessoa.",
    ],
    // Profile: complete copy of profiles/oracle.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "oracle",
      // Founding stories: place (geography localised) and story translated.
      foundings: [
        {
          company: "Oracle (founded as Software Development Laboratories)",
          year: 1977,
          place: "Santa Clara, Califórnia",
          founders: ["Larry Ellison", "Bob Miner", "Ed Oates"],
          story: "Larry Ellison leu os artigos de Edgar Codd sobre o modelo relacional e fez o que a IBM, empregadora de Codd, hesitava em fazer: lançou um produto. A Software Development Laboratories (Ellison, Bob Miner e Ed Oates) tirou o nome do produto de um projeto da CIA em que eles tinham trabalhado e lançou o Oracle V2 em 1979 (não houve V1; Ellison raciocinou que ninguém compra uma versão um) como o primeiro banco de dados relacional SQL comercial. Quase cinquenta anos de crescimento acumulado depois, a empresa de banco de dados é uma gigante de infraestrutura em nuvem cuja passagem de comando para co-CEOs em 2025 marcou sua virada completa para a era da IA.",
        },
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        { year: 1979, title: "Oracle V2: SQL à venda", detail: "Sai o primeiro banco de dados relacional SQL comercial, chegando ao mercado antes da própria linhagem System R da IBM e definindo a categoria de produto sobre a qual o software corporativo ainda se apoia." },
        { year: 1990, title: "Quase a morte, e depois a disciplina", detail: "O reconhecimento agressivo de receita cobra seu preço: prejuízos, republicação de balanços, demissões, e a profissionalização (Jeff Henley, Ray Lane) que transforma uma bagunça brilhante numa máquina." },
        { year: 2005, title: "Começa a máquina de aquisições", detail: "A perseguição hostil de 18 meses à PeopleSoft termina em cerca de US$ 10,3 bilhões e abre a era: Siebel, BEA e dezenas de outras; a Oracle consolida o software corporativo camada por camada." },
        { year: 2010, title: "Sun", detail: "27 de janeiro de 2010: é concluída a aquisição da Sun Microsystems, de cerca de US$ 7,4 bilhões; Java, Solaris, SPARC e MySQL entram no império, e o lado do vendedor é contado na página da Sun desta seção." },
        { year: 2022, title: "Cerner, e a virada vertical", detail: "A aquisição da Cerner, de cerca de US$ 28,3 bilhões, a maior da Oracle até então, leva a empresa de banco de dados ao núcleo operacional da saúde: a estratégia de suítes setoriais em plena escala." },
        { year: 2025, title: "Co-CEOs para a era da IA", detail: "22 de setembro de 2025: Clay Magouyrk (OCI) e Mike Sicilia (Industries) são promovidos a CEOs; Safra Catz vira Executive Vice Chair depois de onze anos como CEO, com Ellison como presidente do conselho e CTO o tempo todo: a passagem de comando cronometrada para um boom de infraestrutura de IA que inflou as obrigações de desempenho remanescentes para US$ 455 bilhões.", sourceNote: "Form 8-K e DEF 14A da Oracle, setembro de 2025." },
      ],
      // Products: names as the vendor writes them (descriptor words localised); descriptions translated.
      products: [
        { name: "Oracle Database", what: "O produto que construiu o império, hoje o AI Database no centro da narrativa da plataforma." },
        { name: "Oracle Cloud Infrastructure", what: "A OCI Gen2: a nuvem de hiperescala e de treinamento de IA, o motor de crescimento da era atual." },
        { name: "Fusion e aplicações setoriais", what: "As suítes de ERP/HCM mais as pilhas verticais, incluindo a linhagem de saúde da Cerner." },
      ],
      // Innovations: titles and details translated.
      innovations: [
        { title: "Comercializar o modelo relacional", detail: "A Oracle transformou a teoria de Codd na arquitetura de dados padrão do setor e defendeu essa posição em todas as mudanças de plataforma desde então." },
        { title: "Consolidação como estratégia", detail: "A máquina de aquisições pós-2004 reescreveu o funcionamento dos mercados de software maduros: comprar a base instalada, ficar com a manutenção, integrar a pilha." },
      ],
      // Market paragraphs: same count as the English.
      markets: [
        "A Oracle vende o banco de dados, infraestrutura em nuvem e suítes de aplicações para todos os setores: uma provedora de infraestrutura de IA de primeira linha cuja estrutura de liderança de 2025 foi construída explicitamente para essa corrida.",
      ],
      // Analyst statements: same count as the English.
      analyst: [
        "A líder permanente das avaliações de banco de dados por quatro décadas, hoje avaliada entre os hyperscalers: uma empresa que sobreviveu a todas as categorias em que já foi confinada.",
      ],
    },
  },
  // ---- petrobras: pt-BR prose for the record (facts stay in the English record) ----
  "petrobras": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Petrobras - a rede que segue o petróleo",
    // Card line (also the meta description) and intro paragraph (the legal name is kept as the English writes it).
    tagline: "Petrolífera estatal criada em 1953, e uma das maiores redes privadas do país.",
    intro: "A Petroleo Brasileiro S.A. foi criada pela Lei 2.004, de 3 de outubro de 1953, que também estabeleceu o monopólio estatal sobre exploração, refino e transporte, um monopólio que não estava no projeto original e foi acrescentado durante quase vinte e dois meses de tramitação no Congresso.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "Ela aparece nesta linha do tempo por um motivo que não tem nada a ver com petróleo: uma operação com esse formato é um dos problemas de rede mais difíceis de qualquer país. Plataformas offshore são sites remotos sem rota alternativa, refinarias são ambientes de controle industrial em que uma mudança de rede pode parar um processo físico, e o processamento sísmico por trás da exploração é computação de alto desempenho em escala nacional.",
      "A lei do petróleo de 1997 acabou com o monopólio legal e abriu o setor a outras empresas constituídas sob as leis brasileiras, o que mudou o que a empresa precisava ser. Um monopólio constrói infraestrutura para servir a si mesmo; um concorrente a constrói para ser mais barata que a de outro.",
      "Para engenheiros, a herança interessante é a mistura. Redes corporativas, sistemas industriais anteriores à internet, links de satélite e submarinos para as plataformas e computação de pesquisa pertencem todos à mesma organização e à mesma política, e é nesse cenário que a discussão entre segurança e disponibilidade deixa de ser abstrata, porque aplicar um controle do jeito errado custa produção, e não conveniência.",
    ],
  },
  // ---- readytech: pt-BR prose for the record (facts stay in the English record) ----
  "readytech": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "ReadyTech - a aula começa, com o laboratório pronto ou não",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Plataforma de treinamento virtual para laboratórios práticos, em turmas com instrutor e em cursos no ritmo do aluno.",
    intro: "A ReadyTech oferece ambientes de laboratório no navegador para treinamento técnico, tanto em turmas com instrutor quanto em cursos no ritmo do aluno, e também pode pôr as máquinas já existentes de uma sala de aula sob o mesmo gerenciamento.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "Dois detalhes do próprio material dela descrevem a economia deste negócio melhor do que qualquer descrição da tecnologia. As turmas precisam escalar de poucos alunos a dezenas, e os ambientes não usados precisam ser liberados quando os alunos não aparecem, porque um laboratório é provisionado antes que alguém saiba quem de fato vem, e alguém paga pelos que ninguém usa.",
      "O outro é o compromisso de suporte. Uma falha de laboratório durante uma aula ao vivo não é um chamado; é uma hora de uma sala cheia de gente, e não existe versão disso que seja remarcada discretamente. É por isso que as plataformas desta categoria anunciam o tempo de resposta das suas pessoas, e não a especificação das suas máquinas.",
      "Seus clientes contam que a adotaram durante a pandemia como medida temporária e a mantiveram depois, o que é a história honesta da entrega virtual neste setor: era um substituto que acabou virando um formato.",
    ],
  },
  // ---- sap: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "sap": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "SAP - cinco engenheiros contra o mainframe",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Fundadores vindos da IBM criaram a categoria do ERP em 1972; o R/3 conquistou o mundo cliente-servidor e o HANA reinventou o núcleo.",
    intro: "A SAP é a maior história do software europeu: cinco engenheiros da IBM em Mannheim que apostaram, em 1972, que software de gestão podia ser um produto padrão, e não um projeto sob medida. O R/3 surfou a onda cliente-servidor até chegar a quase toda grande empresa do planeta, e a empresa reinventou as próprias fundações duas vezes: o HANA em memória, em 2010, e a virada para a nuvem depois dele.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "O perfil acompanha Walldorf do R/1 ao RISE, o ecossistema que emprega uma pequena nação de consultores, e a realidade vizinha das redes: o tráfego SAP moldou uma geração de projetos de QoS.",
    ],
    // Profile: complete copy of profiles/sap.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "sap",
      // Founding stories: place (geography localised) and story translated.
      foundings: [
        {
          company: "SAP",
          year: 1972,
          place: "Weinheim, Alemanha",
          founders: ["Dietmar Hopp", "Hasso Plattner", "Klaus Tschira", "Hans-Werner Hector", "Claus Wellenreuther"],
          story: "Em 1972, cinco engenheiros da IBM em Mannheim viram o empregador engavetar a ideia em que acreditavam (software de gestão padronizado, construído uma vez e vendido a muitos) e saíram para construí-lo eles mesmos. A Systemanalyse und Programmentwicklung escreveu seu primeiro sistema financeiro em tempo real para o mainframe de uma fábrica de náilon, e o crescimento acumulado começou: o R/2 conquistou o mundo do ERP em mainframe, o R/3 conquistou o cliente-servidor, e a SAP virou o sistema operacional dos negócios globais, a maior empresa de software da Europa e o motivo pelo qual uma geração de engenheiros de rede aprendeu QoS com tráfego de ERP.",
        },
      ],
      // Timeline: same events, same order, same years (the English order is kept as written); title, detail and provenance translated.
      timeline: [
        { year: 1972, title: "Cinco fundadores, uma fábrica de náilon", detail: "Os cinco ex-IBM escrevem software financeiro em tempo real na fábrica da ICI em Östringen; o 'R' de realtime vira o nome da linha de produtos e o credo da empresa: dados processados enquanto o negócio acontece." },
        { year: 1992, title: "R/3: a conquista do cliente-servidor", detail: "Arquitetura em três camadas exatamente no momento certo: o R/3 surfa a onda do downsizing até quase toda grande empresa do planeta, e o consultor SAP vira uma profissão do tamanho de uma pequena nação." },
        { year: 2010, title: "HANA", detail: "A aposta de Hasso Plattner num banco colunar em memória sai como SAP HANA: o banco de dados por baixo de tudo o que a SAP constrói em seguida, e o raro caso de um gigante de aplicações que reinventa com sucesso as próprias fundações." },
        { year: 2015, title: "S/4HANA", detail: "O núcleo do ERP reescrito nativamente sobre o HANA: a migração que define duas décadas de roadmaps de TI corporativa e metade dos projetos de WAN que o público deste site já orçou." },
        { year: 2020, title: "A gestão de Klein", detail: "Christian Klein se torna CEO único em abril de 2020, conduzindo a transição para a nuvem e a era da IA no ERP: o rumo de Walldorf desde então.", sourceNote: "Liderança conforme o último registro aqui; não reverificada nas páginas atuais da empresa." },
        { year: 2021, title: "RISE: a virada para a nuvem", detail: "O RISE with SAP empacota a ida para o ERP em nuvem como um único movimento comercial: conversão para assinatura na escala da base instalada, com a Business Technology Platform como narrativa de extensão. A Qualtrics, comprada por cerca de US$ 8 bilhões em 2019, é separada de novo em 2023." },
      ],
      // Products: names as the vendor writes them (descriptor words localised); descriptions translated.
      products: [
        { name: "S/4HANA Cloud", what: "O núcleo do ERP (finanças, cadeia de suprimentos, manufatura) sobre a fundação em memória." },
        { name: "SAP HANA e BTP", what: "O banco de dados e a Business Technology Platform: o substrato e a camada de extensão." },
        { name: "As suítes de linha de negócio", what: "SuccessFactors, Ariba, Concur: a constelação de nuvem adquirida em volta do núcleo." },
      ],
      // Innovations: titles and details translated.
      innovations: [
        { title: "Software de gestão padronizado", detail: "A SAP provou que as empresas rodariam com software empacotado e configurado, e não escrito sob medida: a premissa sobre a qual todo o setor de software corporativo se apoia." },
        { title: "Memória no núcleo", detail: "O HANA levou os mundos analítico e transacional para um único mecanismo em memória: uma reescrita das fundações executada com o avião no ar." },
      ],
      // Market paragraphs: same count as the English.
      markets: [
        "A SAP roda o núcleo operacional da maioria das maiores empresas do mundo: a empresa de tecnologia mais valiosa da Europa ao longo da sua transição para a nuvem, e a carga de trabalho por trás de incontáveis projetos de redes corporativas.",
      ],
      // Analyst statements: same count as the English.
      analyst: [
        "A líder permanente das avaliações de ERP por quatro décadas: o fabricante em torno de cujos cronogramas de migração o resto da TI corporativa se planeja.",
      ],
    },
  },
  // ---- security4it: pt-BR prose for the record (facts stay in the English record) ----
  "security4it": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Security4IT",
    // Card line (also the meta description) and intro paragraph (the English's "two rosters" here and "three" below are both kept).
    tagline: "Parceira citada tanto pela Netskope quanto pela Check Point no Brasil.",
    intro: "Uma integradora brasileira de segurança que aparece nas listas de dois fabricantes. O padrão nesta parte do canal é que o mesmo punhado de casas trabalha com vários fabricantes de segurança ao mesmo tempo, porque as competências se transferem e os clientes se sobrepõem, o que também significa que um cliente que troca de fabricante muitas vezes fica com as mesmas pessoas.",
    // Body: 3 paragraph(s), same order as the English (names of people as the English writes them).
    body: [
      "A Security4IT foi fundada em São Paulo em 8 de fevereiro de 2008 e é dirigida por três administradores identificados: Cassio David Pereira, Fabio Maeji Amaro e Rodrigo Cavalcante de Souza. Sua atividade registrada é o comércio varejista de equipamentos e suprimentos de informática, a descrição cadastral comum para uma casa cujo negócio real é a integração: a classificação segue a nota fiscal, e não o trabalho.",
      "Ela aparece nas listas de três fabricantes ao mesmo tempo (Netskope, Check Point e Fortinet), o padrão nesta parte do canal brasileiro. Um punhado de casas trabalha com vários fabricantes de segurança simultaneamente porque as competências se transferem e os clientes se sobrepõem, e isso significa que um cliente que troca de fabricante muitas vezes fica com os mesmos engenheiros. Essa continuidade vale mais para o cliente do que o logotipo na caixa, e é o motivo pelo qual uma relação com um parceiro muitas vezes dura mais que a decisão de produto que a iniciou.",
      "Fundada em 2008, ela pertence à geração de empresas brasileiras de segurança que cresceu junto com a passagem dos appliances de perímetro para os controles entregues pela nuvem, em vez de ter de sobreviver a ela. Esse momento aparece nos fabricantes com que ela trabalha: dois dos três são empresas que não existiam como categorias quando as integradoras mais antigas foram fundadas.",
    ],
  },
  // ---- sisco: pt-BR prose for the record (facts stay in the English record) ----
  "sisco": {
    // Title: company verbatim; the part after the separator is the company's own Portuguese name, so it stays as written.
    name: "Sisco - Sistemas e Computadores",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Fabricante brasileira de computadores da era da reserva de mercado, fechada em 2001.",
    intro: "A Sisco - Sistemas e Computadores S.A. construía computadores no Brasil nos anos em que fazer isso era política nacional. Pertencia ao Grupo Maksoud, tinha unidades em vários estados, e seu pessoal ficava: registros de ex-funcionários mostram permanências de vinte e nove a trinta e sete anos.",
    // Body: 5 paragraph(s), same order as the English (its upper-case passages and repetitions are mirrored, not resolved).
    body: [
      "Ela pertence, ao lado de Cobra, Scopus e Itautec nesta linha do tempo, ao grupo de fabricantes que a reserva de mercado foi construída para tornar possíveis, e seu fim é o mesmo que aquele período produziu repetidas vezes: a empresa fechou por volta de 2001, depois que a proteção acabou e a máquina importada ficou mais barata.",
      "O detalhe que vale guardar é o que aconteceu em seguida. Em 15 de junho de 2001, enquanto a Sisco encerrava as atividades, cinco funcionários dela fundaram a Ferje Informatica com o objetivo declarado de não deixar os clientes da Sisco desamparados, apoiados no conhecimento que a equipe detinha desde 1979. É o formato honesto de como essas empresas de fato terminam: a pessoa jurídica se dissolve, e o conhecimento de trabalho sai pela porta do prédio e se constitui em outro lugar.",
      "Quase nada da Sisco sobrevive num registro público acessível: um anúncio de 1982, um índice de processos judiciais e as avaliações de pessoas que passaram a carreira lá. Isso não é incomum para um fabricante desta era, e vale dizê-lo em vez de preencher a lacuna.",
      "A Sisco pertencia ao Grupo Maksoud, a mesma holding dona da Hidroservice, então uma das maiores empresas de engenharia do Brasil, da revista semanal de notícias Revista Visao e do hotel Maksoud Plaza, em São Paulo. Vale notar um fabricante de computadores dentro desse conglomerado em particular: a reserva protegia empresas nacionais da concorrência estrangeira, e o capital que aproveitava a proteção era com frequência um capital que tinha feito dinheiro em outra área totalmente diferente.",
      "A empresa construía hardware e software para máquinas micro, mini e de médio porte, e anunciava com o próprio nome em 1982. Encerrou as atividades por volta de 2001: a Ferje Informatica foi fundada em 15 de junho de 2001 por cinco funcionários da Sisco justamente para que os clientes da Sisco não ficassem sem suporte, e descreve a experiência da sua equipe como adquirida desde 1979, o que põe a Sisco em operação naquele ano, no mais tardar.",
    ],
  },
  // ---- sun-microsystems: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "sun-microsystems": {
    // Title: company verbatim; the subtitle is Sun's own English slogan, so it stays as written.
    name: "Sun Microsystems - the network is the computer",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Quatro fundadores da órbita de Stanford, SPARC, Solaris, Java: o ponto do ponto-com, absorvida pela Oracle em 2010.",
    intro: "A Sun concentrou em 28 anos mais ideias que moldaram o setor do que a maioria dos fabricantes consegue num século: a workstation, o slogan da rede em primeiro lugar que o mundo levou décadas para alcançar, o NFS, o SPARC, o Solaris e o Java. Seu fim dentro da Oracle, em 2010, espalhou uma diáspora que ainda comanda o setor, inclusive as histórias da ForgeRock e da Arista em outras partes desta seção.",
    // Body: 5 paragraph(s), same order as the English.
    body: [
      "Da workstation Stanford University Network de Andy Bechtolsheim ao Java rodando em bilhões de dispositivos, a trajetória da Sun é a trajetória dos próprios sistemas abertos, contada por inteiro no perfil abaixo, com as linhagens que saem dela.",
      "A fundação é uma história de Stanford com um epílogo em Berkeley. Em 24 de fevereiro de 1982, três alunos de pós-graduação de Stanford, Scott McNealy, Andy Bechtolsheim e Vinod Khosla, fundaram a empresa em torno da workstation que Bechtolsheim tinha projetado para o projeto Stanford University Network, uma máquina Motorola 68000 com uma unidade de gerenciamento de memória construída para rodar Unix com memória virtual; o nome são as iniciais da rede. Bill Joy, de Berkeley, um dos principais desenvolvedores da Berkeley Software Distribution, entrou logo depois e é contado como fundador. A Sun foi a segunda empresa, depois da Apollo Computer, a se especializar em workstations, e deu lucro desde o primeiro trimestre, em julho de 1982.",
      "Seu próprio sistema operacional seguiu essa linha de Berkeley. O SunOS, de 1982, foi baseado em BSD até a versão 4.1.4, de setembro de 1994, e o nome costuma ser usado só para essas versões. Em 1987, AT&T e Sun anunciaram que fundiriam BSD, System V e Xenix no System V Release 4 e, em 4 de setembro de 1991, a Sun anunciou que sua próxima grande versão passaria do código derivado do BSD para o SVR4, sob uma nova marca guarda-chuva, Solaris: o SunOS 4.1.1 foi rebatizado como Solaris 1.0, e o SunOS 5.0 passou a fazer parte do Solaris 2.0. O Solaris substituiu o SunOS em 1993, chegou ao x86 com a 2.1 em junho daquele ano e a uma base de código única para SPARC e x86 com a 2.4, em 1994, e mais tarde deu ao setor o DTrace e o ZFS. A Sun continuou vendendo o SunOS 4.1.3 e 4.1.4 até 27 de dezembro de 1998 e lhes deu suporte até 30 de setembro de 2003.",
      "O SPARC, a arquitetura RISC própria da Sun, chegou em 1987 com a linha Sun-4 e passou a 64 bits com o SPARC V9 em 1995. O NFS fez dos sistemas de arquivos um serviço de rede; John Gage cunhou The Network is the Computer; James Gosling liderou a equipe que construiu o Java; Jon Bosak liderou a especificação do XML no W3C. Whitfield Diffie, Radia Perlman e Ivan Sutherland estavam na folha de pagamento. Em junho de 2005, a Sun liberou a maior parte do Solaris sob a CDDL como OpenSolaris e, em 2008, pagou US$ 1 bilhão pelo MySQL.",
      "O fim foi anunciado em 20 de abril de 2009: a Oracle adquiriria a Sun por US$ 7,4 bilhões, US$ 5,6 bilhões líquidos do caixa e da dívida da Sun. A Comissão Europeia abriu uma investigação aprofundada em 3 de setembro de 2009, apresentou objeções em 9 de novembro e aprovou o negócio em 21 de janeiro de 2010, depois de se convencer de que o PostgreSQL era uma alternativa crível ao MySQL; a Oracle concluiu a aquisição em 27 de janeiro de 2010. O OpenSolaris foi descontinuado em seguida e ganhou o fork Illumos; o Solaris virou Oracle Solaris, e a 11.4 veio em 2018. A empresa que tinha 38.600 funcionários perto do auge, em 2006, terminou como uma linha num comunicado de imprensa da Oracle.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "Adquirida pela Oracle em 2010. Java, Solaris, ZFS e a pilha de identidade que virou ForgeRock passaram todos com ela.",
    // Successor link label (the URL stays in the English record).
    successorLabel: "Oracle, que adquiriu a Sun em 2010",
    // Profile: complete copy of profiles/sun-microsystems.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "sun-microsystems",
      // Founding stories: place (geography localised) and story translated (the slogan stays in English as quoted).
      foundings: [
        {
          company: "Sun Microsystems",
          year: 1982,
          place: "Santa Clara, Califórnia",
          founders: ["Vinod Khosla", "Andy Bechtolsheim", "Scott McNealy", "Bill Joy"],
          story: "A Sun começou como um projeto de pós-graduação de Stanford com um plano de negócios anexado: a workstation SUN de Andy Bechtolsheim, a placa da Stanford University Network, juntou-se à ambição de Vinod Khosla, às operações de Scott McNealy e, em poucos meses, a Bill Joy, que trouxe consigo o Unix de Berkeley. A sacada da fundação estava no nome: computadores eram, antes de tudo, cidadãos da rede. 'The network is the computer' (a rede é o computador) soava como marketing em 1984, quando a Sun publicou o NFS como protocolo aberto; hoje soa como profecia.",
        },
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        { year: 1982, title: "Quatro fundadores, uma rede", detail: "Workstations com Unix BSD e Ethernet embutida por padrão: a Sun entrega o computador nativo de rede enquanto os rivais ainda tratam a rede como opcional." },
        { year: 1984, title: "O NFS, dado de graça", detail: "A Sun publica o Network File System como protocolo aberto e licenciável: arquivos pela rede viram algo comum, e a jogada de abertura da Sun vira o modelo do setor." },
        { year: 1987, title: "SPARC", detail: "A Sun aposta a empresa na sua própria arquitetura RISC e ganha uma década do mercado de workstations e servidores; o Solaris vem em seguida como o Unix a ser batido." },
        { year: 1995, title: "O Java muda de assunto", detail: "Write once, run anywhere: a linguagem de Gosling transforma a Sun de fabricante de hardware no centro do software da internet, e acaba rodando em bilhões de dispositivos que seu inventor nunca vendeu." },
        { year: 2000, title: "O ponto do ponto-com", detail: "Os servidores E10000 da Sun movem a expansão da internet e o slogan se escreve sozinho; quando a bolha estoura, o crash cai com mais força sobre a empresa que vendeu o hardware do boom." },
        { year: 2005, title: "A virada open source", detail: "O OpenSolaris e a abertura do código da pilha de identidade como OpenSSO, o código que cinco ex-engenheiros da Sun resgatariam como ForgeRock em 2010, uma história de bote salva-vidas contada na página da Ping Identity desta seção. O MySQL entra por cerca de US$ 1 bilhão em 2008." },
        { year: 2010, title: "A Oracle conclui", detail: "27 de janeiro de 2010: a Oracle conclui a aquisição de cerca de US$ 7,4 bilhões depois de uma análise da UE. Java, Solaris e SPARC continuam sob nova gestão; a diáspora da Sun, Bechtolsheim rumo à Arista entre eles, continua em todos os outros lugares.", sourceNote: "Data de conclusão segundo o registro do negócio; o lado do comprador está na página da Oracle." },
      ],
      // Products: names as the vendor writes them (descriptor words localised); descriptions translated.
      products: [
        { name: "SPARC e Solaris", what: "A dupla de arquitetura e sistema operacional que definiu o Unix corporativo por duas décadas." },
        { name: "Java", what: "A linguagem e o runtime que ficaram maiores que seu criador: ainda uma das plataformas mais implantadas do planeta." },
        { name: "NFS", what: "O protocolo aberto de arquivos em rede que fez de 'the network is the computer' (a rede é o computador) uma realidade cotidiana." },
      ],
      // Innovations: titles and details translated.
      innovations: [
        { title: "Protocolos abertos como estratégia", detail: "Publicar o NFS e licenciar o SPARC ensinou ao setor que a abertura podia ser uma arma: o manual que todo fabricante open source seguiu desde então." },
        { title: "O computador nativo de rede", detail: "A Sun entregou máquinas que pressupunham a rede desde o primeiro dia, uma década antes de o resto do setor aceitar a premissa." },
      ],
      // Market paragraphs: same count as the English.
      markets: [
        "As tecnologias da Sun persistem dentro da Oracle e em todo o setor (Java em toda parte, ZFS e DTrace em descendentes abertos), enquanto seu pessoal semeou a Arista, a ForgeRock e metade das empresas de infraestrutura do Vale do Silício.",
      ],
      // Analyst statements: same count as the English.
      analyst: [
        "Nas eras da workstation Unix e do servidor de internet, a Sun era o fabricante de referência em torno do qual as avaliações eram escritas, até que o x86 de commodity e o Linux desfizeram a própria categoria.",
      ],
    },
  },
  // ---- synoptics: pt-BR prose for the record (facts stay in the English record) ----
  "synoptics": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "SynOptics - a outra metade da Bay Networks",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Ethernet sobre fiação telefônica, o que transformou um barramento coaxial em algo para o qual um prédio podia de fato ser cabeado.",
    intro: "A SynOptics construiu hubs de cabeamento estruturado que rodavam Ethernet sobre par trançado, uma ideia derivada do Xerox PARC que mudou o jeito de cabear prédios. Sua fusão com a Wellfleet em 1994 produziu a Bay Networks, unindo o negócio de cabeamento ao de roteamento.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A SynOptics foi fundada em Santa Clara em 1985 por Andrew K. Ludwick e Ronald V. Schmidt, e sua contribuição foi a que tornou a Ethernet comum: rodá-la sobre o cabeamento telefônico de par trançado não blindado que os prédios já tinham, e vendê-la em hubs modulares. Antes disso, Ethernet significava puxar cabo coaxial, o que é uma obra, e não uma compra.",
      "Essa única decisão é o motivo pelo qual a Ethernet venceu as alternativas pela economia, e não pelo mérito. Uma rede que se instala usando a fiação que já está nas paredes é um produto diferente de uma que exige uma empreiteira, e o mercado respondeu à altura: a receita foi de 1,8 milhão de dólares em 1986 para mais de 388 milhões em 1992, com pico de cerca de 700 milhões em 1993.",
      // Corrected 2026-10-26 (endings apply), mirroring the English: "6 de julho" became outubro de 1994, per the Bay Networks 10-K405.
      "O sucesso nessa escala trouxe um problema próprio. Os hubs viraram commodity (o mercado de camadas um e dois que ela dominava era justamente a parte da rede em que os preços caem mais rápido), e o lucro estava subindo para o roteamento, onde a SynOptics não era forte. Em outubro de 1994, ela se fundiu com a Wellfleet, que era forte ali e fraca onde a SynOptics era forte, num negócio de 2,7 bilhões de dólares que formou a Bay Networks. O nome dividiu a diferença entre a baía de San Francisco e a baía de Massachusetts, o que resume bem o arranjo todo.",
      "A lição que sobreviveu à empresa é sobre onde o valor fica numa pilha. A SynOptics venceu por completo a camada do cabeamento e ainda assim precisou se fundir, porque vencer uma camada que vira commodity é uma corrida que você termina e depois precisa correr de novo em algum lugar mais acima.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A SynOptics combinou-se com a Wellfleet Communications em outubro de 1994, e a empresa resultante adotou o nome Bay Networks.",
  },
  // ---- tempest: pt-BR prose for the record (facts stay in the English record) ----
  "tempest": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Tempest - cibersegurança feita no Recife",
    // Card line (also the meta description) and intro paragraph.
    tagline: "A maior empresa especializada em segurança do Brasil, construída fora do eixo de São Paulo e comprada por uma fabricante de aviões.",
    intro: "A Tempest é uma empresa brasileira de cibersegurança fundada e sediada no Recife, com escritórios em São Paulo e Londres. Seu portfólio abrange consultoria, serviços gerenciados de segurança, integração de software de segurança e proteção de identidade, e cerca de metade da sua base de clientes está no setor financeiro, o setor que financia o trabalho de segurança primeiro e com mais constância.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A Tempest nasceu no ano 2000 como startup incubada no CESAR, dentro do Porto Digital, e sua sequência inicial é documentada pela própria empresa: separou-se do CESAR em 2003 para concorrer mais diretamente no mercado brasileiro, abriu um escritório em São Paulo em 2004 e lançou serviços gerenciados de segurança em 2006.",
      "Essa separação é a parte que vale marcar. Uma instituição criada para manter gente de tecnologia em Pernambuco incubou uma empresa de segurança e depois a deixou sair do ninho como negócio independente, o que é o resultado pretendido de um venture builder e, na tecnologia brasileira, um resultado mais raro do que a popularidade do modelo sugere.",
      "A Embraer investiu primeiro em 2015, por meio de um fundo de inovação de que o banco nacional de desenvolvimento também participava, e assumiu o controle em 2020. A empresa atende grandes empresas, com receita acima de um bilhão de reais, e esse perfil de cliente é o que lhe abriu contas internacionais.",
      "Em 2026, a Embraer e a SPX anunciaram que a Tempest se fundiria com a Vision Cybersecurity, formando uma empresa com cerca de setecentos milhões de reais de receita e combinando o negócio de grandes contas com um de mercado intermediário. Uma fabricante de aviões acabar como uma das principais donas da cibersegurança brasileira é um lembrete de que, neste país, o capital para segurança em escala veio da indústria e dos bancos de desenvolvimento, e não de fundos de venture capital.",
    ],
  },
  // ---- tippingpoint: pt-BR prose for the record (facts stay in the English record) ----
  "tippingpoint": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "TippingPoint - quatro donos, e o bug bounty que sobreviveu a todos eles",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Uma empresa de IPS de Austin que mudou de mãos três vezes em onze anos. O que sobreviveu a todas as vendas não foi o appliance, mas o programa de pesquisa ligado a ele.",
    intro: "A TippingPoint é uma linha de prevenção de intrusão em rede fundada em Austin em 1999 e que pertenceu, sucessivamente, a si mesma, à 3Com, à Hewlett-Packard e à Trend Micro. É a empresa que criou a Zero Day Initiative, e é por isso que ela ainda importa muito depois de ter deixado de ser uma empresa.",
    // Body: 5 paragraph(s), same order as the English (its upper-case passages are mirrored).
    body: [
      "A TippingPoint foi fundada em Austin, Texas, em 1999 e foi negociada na NASDAQ como TPTI antes de ser comprada. Seu produto era um sistema de prevenção de intrusão inline: uma caixa que ficava no caminho do tráfego e descartava os ataques, em vez de relatá-los depois, que era a discussão que a categoria inteira travava no começo dos anos 2000.",
      // Corrected 2026-10-26 (endings apply), mirroring the English: the terms from 3Com's 8-K, press totals attributed.
      "A 3Com concordou em comprá-la em dezembro de 2004 e concluiu a compra em janeiro de 2005. O documento da própria 3Com resolve os termos: o acordo de fusão é datado de 13 de dezembro de 2004, a conclusão foi anunciada em 31 de janeiro de 2005, e cada ação da TippingPoint foi convertida no direito de receber US$ 47,00 em dinheiro. A imprensa fala num total de cerca de 430 ou 442 milhões de dólares, e a SecurityWeek descreve o pagamento como feito em ações; o documento descreve dinheiro por ação, e nenhum total é calculado aqui a partir dele.",
      "Seis meses depois de passar à 3Com, em 25 de julho de 2005, a TippingPoint criou a Zero Day Initiative: pagar pesquisadores independentes por vulnerabilidades, revelá-las ao fabricante para correção e proteger quem as encontra da exposição jurídica que tornava arriscado reportá-las. É o programa por trás do Pwn2Own, e continua sendo o maior bug bounty independente de fabricante do setor.",
      "A Hewlett-Packard adquiriu a 3Com em 2010 por 2,7 bilhões de dólares, e a TippingPoint veio junto. Cinco anos depois, a HP decidiu fazer parcerias em segurança de rede em vez de ser dona de um negócio na área e vendeu a linha à Trend Micro: anunciada em outubro de 2015, concluída em 9 de março de 2016, por 300 milhões de dólares. A Trend Micro manteve o nome, a equipe de pesquisa Digital Vaccine Labs e a Zero Day Initiative.",
      "O padrão merece ser nomeado porque não é o habitual. Uma linha de produto vendida três vezes normalmente chega ao terceiro dono esvaziada. O que a TippingPoint carregou em todas as vendas foi uma função de pesquisa, e todos os donos a mantiveram, o que sugere que as aquisições foram em parte sobre a pesquisa, e não sobre o appliance.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A 3Com concluiu a aquisição da TippingPoint Technologies em janeiro de 2005; a Hewlett-Packard adquiriu a 3Com em 12 de abril de 2010, e a Trend Micro concluiu a compra da TippingPoint da Hewlett Packard Enterprise em 9 de março de 2016.",
  },
  // ---- tld-hub: pt-BR prose for the record (facts stay in the English record) ----
  "tld-hub": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "TLD Hub",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Parceira brasileira citada no canal Fortinet.",
    intro: "Uma casa brasileira do canal Fortinet. Nomes como este são a parte do setor que nenhuma linha do tempo de fabricante registra: as empresas que levam um produto para dentro de um prédio de verdade, e cuja própria história costuma ser mais curta que a do produto.",
    // Body: 3 paragraph(s), same order as the English (the legal name is kept as the English writes it).
    body: [
      "Integradora Fortinet de nível Expert e provedora de serviços gerenciados de segurança, especializada em nuvem, tecnologia operacional, SASE, SD-WAN, firewall e LAN, e parceira Preferred Services. Casas como esta são a parte do setor que nenhuma linha do tempo de fabricante registra: as empresas que levam um produto para dentro de um prédio de verdade.",
      "O nome atual é recente, e a empresa não. TLD Hub de Ciberseguranca e Conectividade é um rebranding de 2024 da TLD TeleData, apresentado em Salvador em 19 de março daquele ano com a Fortinet, descrita como sua maior parceira estratégica, presente. O nome antigo é o que se deve pesquisar para qualquer coisa anterior a 2024, e o texto do rebranding se apoia em tradição e posição consolidada, e não em novidade, o que não é o jeito como uma empresa jovem se apresenta.",
      "Ela fica na Bahia, o que importa mais do que parece: o estado oferece há muito tempo incentivos fiscais a empresas de tecnologia e aparece repetidas vezes neste catálogo como destino de equipamentos importados. Uma integradora de cibersegurança e conectividade sediada ali opera dentro desse arranjo, e não à margem dele.",
    ],
  },
  // ---- trend-micro: pt-BR prose for the record (facts stay in the English record) ----
  "trend-micro": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Trend Micro - o fabricante que compra as falhas contra as quais defende",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Fundada com um dongle, dirigida por uma cofundadora desde 2005, dona da Zero Day Initiative, e a origem de uma atualização de 2005 que causou mais estrago em noventa minutos do que o worm que ela mirava.",
    intro: "A Trend Micro é uma empresa nipo-americana de segurança fundada em Los Angeles em 1988 e sediada em Tóquio, conhecida por segurança de endpoint e de nuvem, pela Zero Day Initiative e pelas competições Pwn2Own.",
    // Body: 5 paragraph(s), same order as the English.
    body: [
      "A Trend Micro começou em Los Angeles em outubro de 1988 com o dinheiro de um dongle de proteção contra cópia, fundada por Steve Chang, sua esposa Jenny Chang e a irmã dela, Eva Chen. Mudou-se quase imediatamente para Taipé e, depois de assumir uma empresa de software japonesa em 1992, para Tóquio, onde tem ações listadas desde 1998. O crescimento inicial veio pelos canais de outros: a Intel vendia seu antivírus para LAN com o nome Intel, com os royalties fluindo num sentido na América e na Europa e no outro na Ásia, e a partir de 1993 a Novell o empacotou com o NetWare, a mesma Novell que aparece em outras partes deste catálogo vendendo hardware a preço de custo para aumentar a base instalada.",
      "Eva Chen se tornou CEO em janeiro de 2005 e continua no cargo, o que faz dela uma das líderes mais longevas da segurança e uma das poucas pessoas fundadoras, de qualquer sexo, a dirigir uma empresa desse porte por duas décadas. A plataforma atual da empresa é vendida como Vision One, com a marca de IA que todo fabricante de segurança carrega hoje; o registro que vale guardar é mais antigo que a marca e vem em três partes.",
      "A primeira é a Zero Day Initiative, adquirida com a TippingPoint da HP em 2015 por 300 milhões de dólares. Criada em 2005, ela compra vulnerabilidades de pesquisadores independentes e as entrega aos fabricantes afetados para correção antes da divulgação, e organiza as competições Pwn2Own, em que os navegadores, os celulares e, ultimamente, os carros do ano são quebrados no palco em troca de prêmios em dinheiro. Um fabricante de segurança que compra as falhas contra as quais defende está concorrendo em preço com o mercado cinza, e o efeito de um comprador legítimo é elevar o piso do valor de uma vulnerabilidade. É desse mercado que hoje vem boa parte do conhecimento que o setor tem das próprias fraquezas.",
      "A segunda é a manhã de 23 de abril de 2005, quando uma atualização rotineira de padrões levou os processadores a cem por cento no Windows XP e no Server 2003. O arquivo foi retirado depois de noventa minutos; a essa altura, já tinha sido baixado cerca de trezentas mil vezes, o suporte recebeu cerca de 370.000 ligações, e a East Japan Railway e três jornais nacionais perderam suas redes durante parte de uma manhã. A causa foram testes insuficientes na pressa de detectar um novo worm. A lição é a que o técnico da Xerox e os controladores da Siemens ensinam: o canal que mantém um produto atualizado é o canal pelo qual ele pode causar mais estrago, e um produto defensivo com atualizações automáticas tem um raio de destruição que a ameaça que ele mira só poderia invejar.",
      "A terceira é de 2019, e a empresa disse com todas as letras: não foi um ataque externo. Um funcionário com um plano premeditado acessou um banco de dados de suporte ao consumidor, pegou os dados de contato de cerca de 68.000 clientes e os vendeu a criminosos, que então telefonaram para esses clientes se passando pelo suporte da Trend Micro. O verbete da Ubiquiti registra o que alguém de dentro pode fazer com dados; isto é a mesma coisa numa empresa cujo produto é a defesa contra isso, e a divulgação franca da própria empresa é a fonte. Um fabricante de segurança é uma empresa como as outras, com funcionários como os outros, e os controles dele são aqueles pelos quais pedem que ele seja julgado.",
    ],
  },
  // ---- trustwave: pt-BR prose for the record (facts stay in the English record) ----
  "trustwave": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Trustwave",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Trinta anos de segurança gerenciada a partir de Chicago, sob o controle sucessivo de uma operadora de Singapura, de um fundo da Chertoff e de um negócio separado da AT&T.",
    intro: "A Trustwave foi fundada em Chicago em 1995 e cresceu até virar uma provedora de serviços gerenciados de segurança: managed detection and response, serviços gerenciados de segurança, segurança de banco de dados e de e-mail e, por muitos anos, o negócio de compliance de cartões de pagamento que fez dela a avaliadora por trás de uma grande parcela das validações PCI do mundo. Seu braço de pesquisa, testes e resposta a incidentes, a SpiderLabs, tem registro próprio neste site.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "A cadeia de controle é o card. Em 7 de abril de 2015, a Singtel, a operadora de Singapura, anunciou a aquisição da Trustwave por US$ 810 milhões, concluída mais tarde naquele ano, e a operou como seu braço de cibersegurança; em outubro de 2021, a Trustwave vendeu seu negócio de compliance PCI à Sysnet por US$ 80 milhões; em janeiro de 2024, a Singtel vendeu a Trustwave ao MC² Security Fund, uma afiliada do The Chertoff Group, por US$ 205 milhões; e em 19 de agosto de 2025 a LevelBlue concluiu sua aquisição, em termos não divulgados, chamando o resultado de maior provedora pure-play de serviços gerenciados de segurança do mundo.",
      "Em outubro de 2026, a página institucional da própria empresa responde com um redirecionamento para a da LevelBlue, e é por isso que o registro marca o nome como encerrado em 2025, enquanto as pessoas, os centros de operações e a SpiderLabs continuam sob o novo dono.",
      "Por que ela pertence a um registro de redes: a Trustwave é o caso mais claro nesta linha do tempo de uma empresa de serviços de segurança que muda de mãos por região e por tese, uma operadora que queria um braço de segurança, um fundo que queria uma plataforma, uma empresa de serviços que queria escala, com a mesma operação de Chicago por baixo das três.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "Adquirida pela LevelBlue, com conclusão em 19 de agosto de 2025, depois de ter pertencido à Singtel (2015, US$ 810 milhões) e ao MC² Security Fund (janeiro de 2024, US$ 205 milhões); trustwave.com hoje redireciona para a LevelBlue.",
    // Successor link label (the URL stays in the English record).
    successorLabel: "LevelBlue (Trustwave adquirida em 19 de agosto de 2025; a SpiderLabs continua como LevelBlue SpiderLabs)",
    // Acquisitions: index-aligned with the English list (year, name, price and founder stay English).
    acquisitions: [
      // [0] 2015 Trustwave acquired BY Singtel
      { what: "Anunciada em 7 de abril de 2015; o braço de cibersegurança da Singtel pelos nove anos seguintes.", sourceNote: "Wikipedia: Trustwave Holdings (lido em 06/10/2026)." },
      // [1] 2024 Trustwave acquired BY the MC² Security Fund (The Chertoff Group)
      { what: "A venda pela Singtel, em janeiro de 2024.", sourceNote: "Wikipedia: Trustwave Holdings (lido em 06/10/2026)." },
      // [2] 2025 Trustwave acquired BY LevelBlue
      { what: "Concluída em 19 de agosto de 2025, em termos não divulgados.", became: "Parte da LevelBlue; a SpiderLabs como LevelBlue SpiderLabs.", sourceNote: "LevelBlue, Dallas, 19 de agosto de 2025 (lido em 06/10/2026)." },
    ],
  },
  // ---- tsmc: pt-BR prose for the record (facts stay in the English record) ----
  "tsmc": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "TSMC - a fábrica por trás da maior parte do silício deste site",
    // Card line (also the meta description) and intro paragraph.
    tagline: "A primeira foundry pure-play de semicondutores, fundada em 1987, que fabrica projetos que não são dela.",
    intro: "A Taiwan Semiconductor Manufacturing Company foi fundada em 1987 por Morris Chang como uma empresa que fabrica os projetos de semicondutores de outras empresas e não concorre com nenhuma delas. É a maior fabricante de chips sob contrato do mundo.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "Ela pertence a esta linha do tempo por um motivo que não tem nada a ver com produtos de rede e tudo a ver com o porquê de eles existirem. O silício de switching de mercado com que a maior parte dos equipamentos deste site encaminha pacotes é projetado por empresas que não têm fábrica. Alguém precisa construir esses chips, e para a maioria delas é esta empresa.",
      "O arranjo está registrado nos marcos de fabricação daqui, porque é uma invenção estrutural, e não um produto: antes de existir uma foundry, projetar um chip significava ter uma fábrica, e só empresas muito grandes projetavam chips. Depois, uma equipe com um projeto e um pedido de compra podia ter silício.",
      "É também o ponto em que boa parte da computação do mundo depende de um pequeno número de prédios num só lugar, um fato sobre cadeias de suprimentos, e não sobre tecnologia, e é por isso que o assunto aparece hoje na política industrial de vários países ao mesmo tempo.",
    ],
  },
  // ---- usp: pt-BR prose for the record (facts stay in the English record) ----
  "usp": {
    // Title: institution verbatim, subtitle translated (the " - " separator is structural).
    name: "USP - onde muito disto começou",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Universidade pública brasileira cujos departamentos de computação semearam o setor ao seu redor.",
    intro: "A Universidade de São Paulo aparece numa linha do tempo do setor pelo mesmo motivo que o MIT e Stanford aparecem na americana: as empresas deste registro foram fundadas por pessoas que se conheceram em algum lugar, e, para uma grande parcela das brasileiras, esse lugar foi uma universidade pública.",
    // Body: 7 paragraph(s), same order as the English. The machines' names (White Swan, Ugly Duckling) are given in their original Portuguese, Cisne Branco and Patinho Feio, which the English itself uses further down.
    body: [
      "O padrão é visível ao longo desta linha do tempo sem estar declarado em lugar nenhum dela. Uma indústria nacional de computação precisa de três coisas ao mesmo tempo (engenheiros, um motivo para empregá-los e um lugar onde eles se encontrem antes de ter emprego), e uma grande universidade pública fornece a primeira e a terceira sem custo para as empresas que se beneficiam.",
      "É também por isso que o argumento da reserva de mercado tinha uma base técnica, e não só política. As pessoas que defendiam que o Brasil podia construir as próprias máquinas eram, em muitos casos, as pessoas que ensinavam a matéria.",
      "O padrão acima tem um caso fundador, e é a máquina exposta no corredor da diretoria da Escola Politécnica. Em julho de 1972, o primeiro computador inteiramente concebido, projetado e construído no Brasil foi concluído ali, como projeto final de uma disciplina de pós-graduação em arquitetura de computadores, com o orçamento da própria escola. Era uma caixa de metal de um metro quadrado e oitenta centímetros de profundidade, pesando cem quilos, e os alunos tinham construído o hardware, o software e cada interface de periférico eles mesmos, porque nada disso era fabricado no país. Tiveram de aprender a fazer cada item.",
      "O nome é a tese deste catálogo em miniatura. A Unicamp tinha anunciado, com a Marinha, que construiria o primeiro computador brasileiro, o Cisne Branco. Um aluno de mestrado da Poli disse que eles estavam construindo o Patinho Feio, mas que ele seria o primeiro a funcionar. O Cisne Branco nunca foi concluído. A constatação recorrente do catálogo, a de que o primeiro anunciado não é o que o registro guarda, era verdadeira no Brasil antes de ser verdadeira para a maioria das empresas daqui.",
      "A demonstração pública merece ser registrada exatamente como faz a revista da própria universidade. O bispo, o governador do estado e o reitor estavam em volta da máquina; quando o governador estendeu a mão para o interruptor, um fotógrafo tropeçou num cabo e arrancou a tomada. A memória se apagou e a demonstração não aconteceu. O primeiro computador construído no país foi derrotado na sua apresentação pela falha mais antiga da infraestrutura, que é alguém pisando no fio.",
      "O que veio depois é a linhagem que o verbete da Cobra retoma. A Marinha queria uma máquina para seu programa de nacionalização da eletrônica embarcada, e o Patinho Feio virou a base do G-10, construído pela Poli com a PUC-Rio. A administração da universidade não conseguia acompanhar o ritmo da Marinha, então o reitor criou uma fundação em dezembro de 1972 para conduzir o projeto fora dela, um contorno institucional que virou o modelo de como universidades, governo e indústria trabalhariam juntos aqui. O G-10 foi o protótipo do MC 500, o primeiro computador comercial brasileiro, e a Cobra foi criada em 1974 para construí-lo.",
      "Os engenheiros, o motivo e o lugar de encontro: a máquina forneceu os três de uma vez. O curso de engenharia de computação da Poli se consolidou por causa dela, o departamento de mecatrônica nasceu do mesmo grupo, e a geração que a construiu foi fundar as empresas que aparecem em outras partes desta seção. A reserva de mercado que veio depois tinha uma base técnica porque uma sala em São Paulo já tinha mostrado que o argumento podia ser construído, ainda que não, naquele dia, ligado.",
    ],
  },
  // ---- wztech: pt-BR prose for the record (facts stay in the English record) ----
  "wztech": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "WZTech Networks - integração a partir do interior",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Integradora brasileira multimarcas de São José do Rio Preto, com infraestrutura de dados, voz e vídeo.",
    intro: "A WZTech Networks é uma integradora multimarcas sediada em São José do Rio Preto, no interior do estado de São Paulo, que atua em infraestrutura de comunicação para dados, voz, imagem e vídeo, junto com conectividade, segurança, mobilidade, alta disponibilidade e gerenciamento de redes.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A descrição que ela faz do próprio escopo é a parte útil: ambientes que vão do pequeno escritório corporativo ao backbone de alta criticidade de uma operadora de telecomunicações. Essa amplitude é normal para uma integradora neste mercado e incomum em qualquer outro lugar, e explica por que os engenheiros dessas empresas tendem a ser mais abrangentes que seus pares dentro de um único fabricante.",
      "A localização é o outro ponto. Esta linha do tempo já registra a Altasnet em Belo Horizonte e a CTBC em Uberlândia, e o padrão se repete aqui: trabalho substancial de integração de redes feito a partir de cidades que os relatos sobre o setor brasileiro, escritos a partir do litoral, costumam nem mencionar.",
      "Ela também afirma algo que vale registrar num site sobre treinamento. O próprio material dela enfatiza o investimento contínuo na equipe técnica por meio de cursos, certificações e programas de atualização com os fabricantes, o mesmo ponto que o verbete da Teltec faz pelo outro lado. Neste mercado, a qualificação dos engenheiros é o produto, e as empresas que sobrevivem dizem isso em voz alta.",
      "A empresa se data de 2007 e descreve seu próprio começo como implantação e revenda de hardware de fabricantes estabelecidos, antes de passar à integração de software e depois a plataformas automatizadas que orquestram os dois. Algumas bases de dados de empresas trazem 2005, e o LinkedIn também; a data de 2007 é a que a própria WZTech publica, então é a usada aqui.",
    ],
  },
  // ---- xz-utils: pt-BR prose for the record (facts stay in the English record) ----
  "xz-utils": {
    // Title: project verbatim, subtitle translated (the " - " separator is structural).
    name: "XZ Utils - a cadeia de suprimentos sem fornecedor",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Uma campanha de dois anos contra um mantenedor voluntário esgotado, descoberta por um engenheiro que notou meio segundo de latência.",
    intro: "O XZ Utils é uma biblioteca de compressão open source amplamente usada cujas versões de 2024 carregaram por pouco tempo um backdoor, inserido depois de uma campanha de vários anos para obter acesso de mantenedor.",
    // Body: 5 paragraph(s), same order as the English.
    body: [
      "O XZ Utils é uma biblioteca de compressão, sem glamour e onipresente: quase trinta mil pacotes do Debian e do Ubuntu dependiam dela. Em fevereiro e março de 2024, duas de suas versões carregaram um backdoor que teria permitido a qualquer pessoa com uma determinada chave privada executar comandos nas máquinas afetadas por meio do OpenSSH. Ele foi descoberto semanas antes de chegar às versões estáveis das principais distribuições.",
      "O ataque começou por volta de 2021 e mirava uma pessoa, e não um sistema. Uma conta que contribuía sob o nome Jia Tan construiu credibilidade técnica genuína ao longo de dois anos. Enquanto isso, outras contas apareciam nas listas de discussão do projeto reclamando que o mantenedor era lento, que o projeto estava abandonado, que era preciso um comantenedor. O mantenedor, um voluntário lidando com burnout, acabou concedendo acesso de commit e depois o status de comantenedor. A vulnerabilidade explorada foi a exaustão humana, e não existe controle técnico que trate disso.",
      "O desenho técnico merece a mesma atenção. O código malicioso nunca foi incluído no repositório. Ele vivia no tarball de release, o arquivo empacotado a partir do qual as distribuições de fato compilam, escondido em arquivos binários apresentados como casos de teste de compressão deliberadamente corrompidos, e ativado por alterações ofuscadas num script de build que só rodava durante uma compilação de pacote no estilo das distribuições, e não a partir de um checkout limpo do código-fonte. Qualquer pessoa que revisasse o código teria revisado o artefato errado. Era no espaço entre o que se lê e o que se compila que ele morava.",
      "Ele foi encontrado porque um engenheiro da Microsoft, fazendo benchmark de um banco de dados, notou que o login por SSH levava quinhentos milissegundos em vez de cem. Não um scanner, não um comitê de revisão, não um programa de segurança: meio segundo de latência sem explicação, e alguém que decidiu gastar algumas horas com isso. O artigo de testes e medição deste catálogo defende que o produto da disciplina é um número que alguém preferiria não ouvir. Este é o caso em que o número era meio segundo e o alguém era um adversário de nível estatal.",
      "Para a taxonomia do comprometimento de fornecedores, isto acrescenta uma quinta rota às quatro que o verbete da Cisco expõe, e é a que não tem fornecedor nenhum. Ninguém foi pago, nenhum contrato foi violado, nenhuma empresa podia ser processada, auditada ou excluída de uma lista de compras. A dependência era mantida por um voluntário, de graça, porque precisava existir. Essa é a condição real de boa parte da infraestrutura, e o incidente deve ser lido menos como alerta sobre uma biblioteca do que como descrição do arranjo sobre o qual todo o resto é construído.",
    ],
  },
};
