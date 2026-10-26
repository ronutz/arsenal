// ============================================================================
// src/content/vendors/overlays/pt-BR/shard-8.ts
// ----------------------------------------------------------------------------
// pt-BR INDUSTRY OVERLAYS, SHARD 8 of 8 (translation pass planned 2026-10-25;
// see the round 2 TRANSLATION-PLAN). One shard per translator, so parallel
// work never edits the same file. Each entry is keyed by record slug and holds
// ONLY translated prose (PartnerVendorOverlay); facts stay in partners.ts and
// profiles/*.ts. Check with: npx tsx scripts/report-industry-translation.mts --strict
//
// Records assigned to this shard (~27,018 words):
// arrow-electronics, auvik, banyan, betta, coursera, cyclades-network, damovo,
// dec, dns-bind, dyn, fast-lane, freshworks, inorpel, intel, intel-amd, ish,
// kaspersky, mcafee-fireeye-trellix, metageek, mobileiron, mude, neosecure,
// nozomi-networks, progress-software, promon-logicalis, proof, pulse-secure,
// qd7, qualys, red-hat, sagemcom, secureway, sek, servicenow, skybox, solor,
// soow-sigma, startse, sytek, tdec, ubiquiti, under-protection, watchguard,
// wellfleet, westcon-comstor, xylan
// ============================================================================
//
// Translated 2026-10-26 (pt-BR machine-draft state: written with AI, reviewed
// gradually; never labelled reviewed). Profile objects are complete copies of
// the English profiles with only the prose fields replaced, so every year,
// company, founder, personal marker and href is the English one. Quotations
// that the English presents as a source's words, source titles and filing
// names stay verbatim (with a short Portuguese gloss where useful); product
// and company names keep their spelling.
// ============================================================================

import type { PartnerVendorOverlay } from "@/content/vendors/localized";

/** Translated prose for this shard's records, keyed by slug. */
export const SHARD_8: Record<string, PartnerVendorOverlay> = {
  // ---- arrow-electronics: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "arrow-electronics": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Arrow Electronics",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Começou na Radio Row vendendo rádios usados; perdeu treze de seus líderes numa única tarde e se reconstruiu.",
    intro: "A Arrow Radio abriu em 1935 na Cortlandt Street, no trecho do sul de Manhattan conhecido como Radio Row, vendendo rádios e peças de segunda mão. O fundador era Maurice Goldberg. Dois de seus vizinhos naquela rua eram Charles Avnet e Seymour Schweber, e os três nomes acabaram em empresas de distribuição; é por isso que a Radio Row tem bons motivos para reivindicar o título de berço da distribuição de eletrônicos.",
    // Body: 7 paragraph(s), same order as the English.
    body: [
      "A empresa como existe hoje data de 1968, quando três ex-alunos recém-formados da Harvard Business School que trabalhavam num banco de investimento de Nova York, B. Duke Glenn Jr., Roger E. Green e John C. Waddell, lideraram um grupo de investidores que comprou o controle por cerca de US$ 1 milhão em dinheiro emprestado. Compraram também um negócio que recuperava chumbo de baterias velhas de carro, o que diz algo sobre o estado da oportunidade quando a encontraram.",
      "Eles estavam certos sobre a distribuição de componentes eletrônicos. Em 1979, a Arrow tinha adquirido a Cramer Electronics, então a segunda maior distribuidora de componentes eletrônicos dos Estados Unidos, com cerca de US$ 150 milhões em vendas anuais, e já era um negócio nacional de peso.",
      "Em 4 de dezembro de 1980, a alta direção se reuniu no centro de conferências de um hotel em Harrison, Nova York, para as reuniões anuais de orçamento. Um incêndio no prédio matou treze deles. Entre os mortos estavam Glenn, então chairman, Green, então vice-presidente executivo, e todos os chefes de departamento da divisão de distribuição de eletrônicos. Waddell sobreviveu porque não estava lá: tinha ficado na sede para responder a perguntas sobre um desdobramento de ações de dois por um anunciado mais cedo naquele mesmo dia.",
      "No dia seguinte ao incêndio, Lynn Glenn, viúva do chief executive, foi à sede da empresa e falou aos funcionários. Disse que não conhecia o rosto deles, mas conheceria os nomes, porque o marido falava deles.",
      "Waddell assumiu uma empresa que tinha perdido a maior parte das pessoas que sabiam como ela funcionava. Recrutou Stephen Kaufman, da McKinsey, em 1982; Kaufman tornou-se chief executive em 1986 e chairman em 1994, e conduziu a consolidação da distribuição de eletrônicos nos Estados Unidos e a expansão para a Europa e a Ásia. A Arrow se recuperou em cerca de três anos, e o episódio produziu mudanças no planejamento de sucessão que uma empresa só faz depois de ter precisado delas.",
      "A aquisição da Kierulff Electronics em 1988 mostra o método: a Arrow fechou os quatro armazéns da Kierulff, e o negócio combinado passou de um prejuízo de US$ 16 milhões em 1987 para US$ 10 milhões de lucro operacional em um ano. Essa é a economia da distribuição numa frase: o valor está na rede e no capital de giro, não nos prédios.",
      "Lida ao lado das outras distribuidoras desta seção, a Arrow é a mais antiga e aquela cuja história menos tem a ver com estratégia. A Ingram Micro foi fundada por professores, a ScanSource por uma tese sobre produtos de transição, a Westcon por aquisição e a Network1 por ter sido comprada. O momento que definiu a Arrow foi uma tarde que ninguém planejou, e o que ele demonstra é algo que nenhum documento de estratégia cobre: que uma organização não é só as suas pessoas, porque esta perdeu de uma vez treze das mais experientes e ainda existia três anos depois; e também que ela não é nada além das suas pessoas, porque a reconstrução levou três anos e exigiu um estranho vindo de uma consultoria.",
    ],
    // Acquisitions: index-aligned with the English list (year, name, price and founder stay English).
    acquisitions: [
      { what: "Então a segunda maior distribuidora de componentes eletrônicos dos Estados Unidos, com cerca de US$ 150 milhões em vendas anuais, forte na costa oeste.", became: "A primeira grande aquisição da Arrow no setor e sua porta de entrada para os mercados do oeste dos Estados Unidos." },
      { what: "Uma concorrente adquirida como parte de uma estratégia explícita de crescimento por consolidação sob Stephen Kaufman.", became: "Absorvida: os quatro armazéns da Kierulff foram fechados, e o negócio combinado passou de um prejuízo de US$ 16 milhões em 1987 para US$ 10 milhões de lucro operacional em um ano." },
    ],
    // Profile: complete copy of profiles/arrow-electronics.ts; years and personal markers untouched.
    profile: {
      // Same slug as the English profile.
      slug: "arrow-electronics",
      // The English profile has no founding stories.
      foundings: [],
      // Timeline: same order and years as the English; prose translated.
      timeline: [
        { year: 1946, title: "Incorporada com o nome que usa até hoje", detail: "Onze anos depois da abertura da loja. A essa altura ela vendia rádios novos da RCA, da General Electric e da Philco na parte da frente e peças de excedente no balcão de um departamento nos fundos; e o departamento de peças era a parte com futuro." },
        { year: 1950, title: "A virada que de fato a tornou distribuidora", detail: "No início dos anos 1950, com franquias de fabricantes e uma pequena equipe de vendas de campo, ela começou a vender componentes para clientes industriais, e não para amadores que entravam pela porta. Essa é a passagem de loja a distribuidora, e aconteceu uns quinze anos antes da compra que costuma ser tratada como o início da empresa." },
        { year: 1991, title: "Um vizinho compra o outro", detail: "Entre as cerca de cinquenta distribuidoras adquiridas durante a consolidação estava a Schweber Electronics, por meio da controladora Lex. Duas lojas na mesma rua de Manhattan nos anos 1930, e uma delas acabou comprando a outra: o desfecho mais redondo possível para a história da Radio Row, que levou uns cinquenta e cinco anos para chegar.", sourceNote: "A Schweber aparece na lista de aquisições da própria empresa como Lex (Schweber); o ano exato dessa transação não consta das fontes consultadas." },
      ],
      // Products: descriptor words localised, descriptions translated.
      products: [
        { name: "Componentes eletrônicos", what: "Semicondutores, passivos e interconexão vendidos aos fabricantes que constroem coisas: o negócio original, ainda o maior, e um em que o cliente é um engenheiro de projeto, e não um departamento de compras." },
        { name: "Soluções de computação corporativa", what: "Servidores, armazenamento, software e nuvem vendidos por meio de revendas e integradores. Outro cliente, outro modo de vender, e o motivo de esta empresa aparecer numa linha do tempo sobre redes." },
        { name: "Serviços de design e engenharia", what: "Ajudar os clientes a escolher e integrar componentes antes de comprá-los, que é o que distingue uma distribuidora de componentes de um armazém: a especificação acontece no escritório da distribuidora." },
        { name: "Logística global e cadeia de suprimentos", what: "A metade sem glamour: previsão de demanda, amortecimento de faltas, gestão de peças em fim de vida. Em semicondutores, isso não é um serviço em torno do produto; durante uma escassez, É o produto." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "Vender ao engenheiro antes de existir o pedido de compra", detail: "Uma distribuidora de componentes que ajuda a projetar uma placa está presente no momento em que as peças são escolhidas, meses ou anos antes de qualquer compra e muito antes de se negociar um preço. Essa posição vale mais do que qualquer desconto, e é por isso que este negócio nunca pôde ser reduzido a logística." },
        { title: "Consolidação como método operacional", detail: "Mais de cinquenta aquisições nos Estados Unidos, na Alemanha, na Itália e na China, conduzidas com um princípio constante: manter o relacionamento com os clientes e as franquias, fechar a infraestrutura duplicada. A entrada acima dá a aritmética de um desses negócios, e ela valeu de forma ampla; é isso que transforma uma série de compras numa estratégia, e não num hábito de gastar." },
        { title: "Dois negócios que não compartilham quase nada", detail: "Componentes e computação corporativa convivem numa só empresa e têm clientes diferentes, margens diferentes, ciclos diferentes e concorrentes diferentes. Manter os dois é defensável como diversificação e questionável como foco, e a discussão corre dentro do setor há trinta anos sem se resolver." },
      ],
      // Markets: same number of entries as the English.
      markets: [
        "Fabricantes de equipamento original, fabricantes contratados e engenheiros de projeto do lado dos componentes; revendas, integradores e provedores de serviços gerenciados do lado corporativo. A empresa está na Fortune 500 e atende clientes na maioria dos países industrializados.",
        "Concorre com a Avnet em componentes, uma vizinha da mesma rua nos anos 1930 e ainda sua principal rival noventa anos depois, e com as distribuidoras de tecnologia de linha ampla do lado corporativo.",
      ],
      // Analyst: same number of entries as the English.
      analyst: [
        "A distribuição de componentes é avaliada pela amplitude das franquias, pelo registro de design wins e pelo giro de estoque; o negócio corporativo, pelas autorizações dos fabricantes e pelo alcance entre parceiros. São avaliações separadas da mesma empresa, e essa é justamente a observação.",
        "A rivalidade com a Avnet merece nota pela idade. Dois negócios fundados a poucas portas um do outro durante a Depressão continuam, noventa anos depois, sendo as duas maiores distribuidoras de componentes eletrônicos do mundo e ainda medidas uma contra a outra. Muito pouca coisa neste setor foi estável o bastante para sustentar uma rivalidade tão longa.",
      ],
    },
  },
  // ---- auvik: pt-BR prose for the record (facts stay in the English record) ----
  "auvik": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Auvik",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Gerenciamento de redes em nuvem de Waterloo para MSPs: 100.000 redes, 12 milhões de dispositivos e um cheque de US$ 250 milhões da Great Hill Partners.",
    intro: "A Auvik foi fundada em 2011 por Alex Hoff, Marc Morin e David Yach e se mudou para a sede em Waterloo, Ontário, em 2018. Hoje se descreve como uma plataforma de gerenciamento de TI orientada por IA que combina dados de infraestrutura em tempo real com agentes inteligentes, e diz ajudar provedores de serviços gerenciados e equipes de TI a gerenciar mais de 100.000 redes no mundo todo e doze milhões de dispositivos distintos.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "A história contada pela própria empresa vai de 21 funcionários em 2013 a 305 em 2023. Em 2018, ela adquiriu a Talaia e levantou uma Series C de CAD$ 20 milhões; em 2021, a Great Hill Partners investiu US$ 250 milhões; em 2022, comprou a MetaGeek, a empresa de ferramentas de Wi-Fi de Boise, e em 2024 a Saaslio e a Boardgent. Douglas Murray tornou-se chief executive e Mark Ralls presidente em 2024.",
      "O capítulo da MetaGeek é o que este registro acompanha mais de perto, porque correu nos dois sentidos: a Auvik adquiriu as ferramentas Wi-Spy, inSSIDer e Chanalyzer em abril de 2022 e vendeu o negócio à Oscium em outubro de 2024, de modo que os analisadores de redes sem fio que por pouco tempo fizeram parte de uma plataforma de gerenciamento em nuvem estão de volta com um fabricante de instrumentos. Os registros da MetaGeek e da Oscium trazem os detalhes.",
      "Por que uma ferramenta para provedores de serviços gerenciados está num registro construído em torno de redes corporativas: o mercado de MSPs é para onde o monitoramento de redes foi quando os frameworks corporativos da era Tivoli e OpenView ficaram pesados demais para as organizações que mais precisavam ser vigiadas. A Auvik, como os monitores open source em outros pontos desta linha do tempo, é uma resposta à pergunta de quem vigia as redes que não podem pagar por um centro de operações de rede.",
    ],
    // Acquisitions: index-aligned with the English list (year, name, price and founder stay English).
    acquisitions: [
      { what: "Listada no histórico da própria Auvik em 2018, ao lado de uma Series C de CAD$ 20 milhões; a página lida não descreve o produto.", sourceNote: "auvik.com/about (lido em 06/10/2026)." },
      { what: "As ferramentas de análise de Wi-Fi de Boise Wi-Spy, inSSIDer e Chanalyzer, fundada em 2005; termos não divulgados.", became: "Vendida à Oscium em outubro de 2024.", sourceNote: "ChannelE2E, 15 de abril de 2022, e auvik.com/about (lido em 06/10/2026)." },
      { what: "Listada no histórico da própria Auvik em 2024; a página lida não descreve o produto.", sourceNote: "auvik.com/about (lido em 06/10/2026)." },
      { what: "Listada no histórico da própria Auvik em 2024; a página lida não descreve o produto.", sourceNote: "auvik.com/about (lido em 06/10/2026)." },
    ],
  },
  // ---- banyan: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "banyan": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Banyan Systems - a pioneira dos diretórios",
    // Card line (also the meta description) and intro paragraph.
    tagline: "VINES e StreetTalk entregaram um verdadeiro serviço de diretório global anos antes do NDS ou do Active Directory, e perderam mesmo assim; a ideia venceu em toda parte.",
    intro: "A Banyan resolveu primeiro o problema mais difícil das redes corporativas: o StreetTalk, o serviço global de nomes e diretório dentro do VINES, deixava um usuário fazer login em qualquer ponto de uma rede mundial anos antes de existirem o NDS da Novell ou o Active Directory da Microsoft. O Corpo de Fuzileiros Navais dos Estados Unidos rodava sobre ele. Estar certa cedo, contra o canal do NetWare e o empacotamento do NT, não bastou.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "O perfil faz par natural com a página da Novell: a fundação em 1983, a arquitetura do VINES baseada em Unix, a liderança de design do StreetTalk, a derrota na guerra das plataformas e a dissolução discreta, nos anos 2000, da empresa cuja ideia central hoje roda em todas as empresas do planeta.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "Operando como ePresence desde o início de 2000, a empresa vendeu seu negócio de serviços à Unisys e sua participação na Switchboard à InfoSpace em 3 de junho de 2004, quando os acionistas também aprovaram a liquidação, e registrou os atos de dissolução em Massachusetts em 14 de junho de 2004.",
    // Profile: complete copy of profiles/banyan.ts; years, companies, founders and personal markers untouched.
    profile: {
      // Same slug as the English profile.
      slug: "banyan",
      // Founding stories: place (geography localised) and story translated; company, year and founders verbatim.
      foundings: [
        {
          company: "Banyan Systems",
          year: 1983,
          place: "Westborough, Massachusetts",
          founders: ["David Mahoney (with ex-Data General engineers)"],
          story: "A Banyan, fundada por ex-funcionários da Data General, mais um ramo dessa linhagem, resolveu primeiro o problema mais difícil das redes corporativas. O StreetTalk, o serviço de nomes e diretório dentro do VINES, dava a cada usuário, impressora e serviço um nome global em toda uma rede mundial: login em qualquer lugar, tudo localizável, uma década antes de o setor alcançá-la. O Corpo de Fuzileiros Navais dos Estados Unidos rodava sobre ele. Estar arquiteturalmente certa em 1985 não bastou contra a máquina de canal do NetWare e o empacotamento do Windows NT: a empresa definhou; a ideia de diretório hoje roda em todas as empresas do planeta.",
        },
      ],
      // Timeline: same order and years as the English; prose translated.
      timeline: [
        { year: 1984, title: "O VINES chega ao mercado", detail: "Um sistema operacional de rede construído sobre o Unix System V, com roteamento, serviços e administração projetados para MUITAS redes interligadas, quando os rivais ainda pensavam em LANs isoladas." },
        { year: 1985, title: "StreetTalk", detail: "Chega o diretório global: nomes em três partes (item@group@organization) resolvíveis de qualquer ponto da inter-rede; autenticação, localização e administração unificadas anos antes de existirem o NDS ou o Active Directory." },
        { year: 1991, title: "O padrão do Corpo de Fuzileiros Navais", detail: "A cabeça de ponte federal da Banyan chega ao auge: o Corpo de Fuzileiros Navais dos Estados Unidos e outras agências padronizam o VINES exatamente para aquilo que o StreetTalk faz de melhor, um só diretório para um mundo disperso." },
        { year: 1994, title: "A derrota na guerra das plataformas", detail: "O exército de revendas do NetWare e depois o empacotamento do Windows NT espremem o VINES dos dois lados; o ENS (StreetTalk para NetWare/NT) tenta vender a joia da coroa em várias plataformas, tarde demais para mudar a aritmética." },
        { year: 1996, title: "Switchboard", detail: "A Banyan leva a ideia de diretório para a web de consumo com o Switchboard.com, um localizador de pessoas e empresas: uma virada visionária que antecipa a era da busca sem conquistá-la." },
        { year: 2001, title: "ePresence, e o fim", detail: "Rebatizada ePresence Solutions, a empresa encerra seus produtos e se dissolve em poucos anos, enquanto todas as empresas do planeta implantam o conceito de diretório global que a Banyan lançou primeiro." },
      ],
      // Products: names verbatim, descriptions translated.
      products: [
        { name: "VINES", what: "O sistema operacional de rede baseado em Unix construído para inter-redes de redes." },
        { name: "StreetTalk", what: "O primeiro serviço de diretório de fato corporativo: nomes, autenticação e localização como um só tecido." },
        { name: "ENS", what: "Enterprise Network Services: o StreetTalk oferecido sobre NetWare e NT; a joia da coroa, desempacotada tarde demais." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "O diretório global", detail: "Um só namespace para todos os usuários e recursos de uma organização inteira: a Banyan lançou o conceito que o Active Directory depois tornou universal." },
        { title: "Pensar a rede a partir da WAN", detail: "O VINES pressupunha a empresa com vários sites desde o primeiro dia, com roteamento e serviços projetados para a longa distância enquanto os concorrentes otimizavam a LAN isolada." },
      ],
      // Markets: same number of entries as the English.
      markets: [
        "O mercado da Banyan foi para a Novell e depois para a Microsoft; sua arquitetura foi para toda parte: a identidade moderna, do AD aos diretórios em nuvem que as ferramentas de identidade deste site decodificam, descende da premissa do StreetTalk.",
      ],
      // Analyst: same number of entries as the English.
      analyst: [
        "A eterna terceira colocada tecnicamente superior nas avaliações de NOS, e a prova mais limpa do setor de que o melhor diretório não vence a melhor distribuição.",
      ],
    },
  },
  // ---- betta: pt-BR prose for the record (facts stay in the English record) ----
  "betta": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Betta",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Parceira Fortinet de nível Expert no Brasil.",
    intro: "Integradora de São Paulo no nível Expert da Fortinet em SASE e SD-WAN, e um registro cuja própria identidade ainda não está resolvida.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "O diretório lista a Betta Telecomunicacoes e Eletronica no nível Expert em São Paulo, como integradora, com SASE e SD-WAN. O nome no diretório e a empresa sobre a qual este registro foi escrito não coincidem com clareza, o que fica registrado nas notas de fonte em vez de resolvido: uma empresa de telecomunicações e eletrônica e um parceiro de canal de TI podem ter o mesmo nome no Brasil sem serem o mesmo negócio, e o ano de fundação que este registro traz depende de qual das duas se trata.",
      "A regra seguida aqui é a mesma aplicada a todo CNPJ deste catálogo: um registro é associado pelo código de atividade e pelo endereço, nunca pelo nome. Até que essa associação seja feita, as duas leituras continuam valendo.",
    ],
  },
  // ---- coursera: pt-BR prose for the record (facts stay in the English record) ----
  "coursera": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Coursera - cem mil alunos de uma vida inteira, alcançados em poucas semanas",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Dois professores de Stanford puseram três cursos online em 2011, e cada um atraiu em semanas mais alunos do que qualquer deles ensinaria numa carreira; em 2026, a empresa que fundaram adquiriu a Udemy e virou a maior plataforma de ensino que existe.",
    intro: "A Coursera é uma plataforma americana de ensino online fundada em 2012 pelos professores de Stanford Andrew Ng e Daphne Koller, que oferece cursos, certificados e diplomas de universidades e da indústria; concluiu a combinação com a Udemy em 2026 e tem a Udemy, Inc. como subsidiária integral.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "Em 16 de agosto de 2011, alguns professores de Stanford anunciaram que três de seus cursos de ciência da computação seriam oferecidos de graça online. Em poucas semanas, cada um tinha mais de cem mil inscritos: mais, como diz o relato da própria empresa, do que qualquer um dos professores poderia esperar ensinar numa vida inteira. Não tinha havido marketing. Daphne Koller chamou aquilo de alerta sobre a demanda, e em 2012 ela e Andrew Ng saíram para construir a plataforma, fechando com Princeton, Penn e Michigan em poucos meses, sem nenhum plano para ganhar dinheiro e com investidores que entraram mesmo assim.",
      "O modelo que surgiu é o da universidade: os parceiros institucionais fornecem os cursos e os próprios nomes, os alunos podem estudar de graça e pagar pela credencial verificada, e o certificado carrega a autoridade do parceiro, e não a da plataforma. A empresa abriu o capital em 2021, passou de cem milhões de alunos cadastrados em 2022 e, no fim de 2025, tinha mais de 190 milhões. A receita, porém, vem menos desses alunos do que dos empregadores deles, e a taxa de plataforma que ela passou a cobrar das universidades parceiras em 2026, de quinze por cento, marcou o momento em que os interesses da plataforma e os de seus fornecedores de conteúdo se separaram à vista de todos.",
      "Depois, ela comprou o outro modelo. Em 17 de dezembro de 2025, Coursera e Udemy anunciaram uma combinação inteiramente em ações; o prospecto mostrou depois que a Coursera tinha feito três abordagens em dois anos e que uma rival, a dona da Pluralsight, tinha oferecido dinheiro. Os acionistas aprovaram em 9 de abril de 2026 e a transação foi concluída em maio: 290 milhões de alunos, dezoito mil clientes corporativos, noventa e cinco mil instrutores. A empresa listada manteve o nome Coursera, enquanto a Udemy, Inc. sobreviveu à fusão como sua subsidiária integral, e o udemy.com continua operando como Udemy. As duas empresas tinham pago aos instrutores e às universidades parceiras cerca de 440 milhões de dólares em 2025, segundo estimativa.",
      "Para quem vive de ensinar, esse último número é o que merece atenção, porque a combinação põe o modelo credenciado e o modelo de marketplace aberto sob um único dono, com um único conjunto de margens a proteger. Os centros de treinamento de fabricantes em outros pontos desta lista vendem instrução escassa e certificada sobre produtos específicos; uma plataforma deste tamanho vende abundância. Os dois existem porque o valor de um curso depende de quem está do outro lado dele, e o setor ainda não decidiu que lado é esse.",
    ],
  },
  // ---- cyclades-network: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "cyclades-network": {
    // Title: no " - " subtitle; the parenthesis names an institute and a country, kept verbatim but for the country name.
    name: "CYCLADES (IRIA, França)",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Onde nasceu o datagrama.",
    intro: "A rede de pesquisa de Louis Pouzin no IRIA, de 1972 a 1973, foi a primeira a tornar os hosts responsáveis pela confiabilidade sobre um substrato de pacotes não confiável (Pouzin cunhou a palavra datagrama para isso), e o artigo fundador do TCP/IP de Cerf e Kahn, de 1974, cita o trabalho diretamente.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "Morta pela política dos PTT franceses em favor da Transpac e do X.25 (desligada em 1977, segundo o relato do INRIA, e forçada a sair do ar até 1981, segundo o registro geral), a CYCLADES é ao mesmo tempo o ancestral de design mais profundo da internet e a parábola clássica sobre monopólios e inovação. Distinta da Cyclades brasileira da história dos servidores de console, e guardada ao lado dela: mesmo nome, outro continente, as duas homenageadas aqui.",
    ],
    // Profile: complete copy of profiles/cyclades-network.ts; years, companies, founders and personal markers untouched.
    profile: {
      // Same slug as the English profile.
      slug: "cyclades-network",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          company: "CYCLADES (IRIA research network)",
          year: 1972,
          place: "IRIA (hoje INRIA), Rocquencourt, França",
          founders: ["Louis Pouzin"],
          story: "Louis Pouzin recebeu uma missão que a maioria dos engenheiros teria cumprido pelo caminho seguro: construir a resposta francesa à ARPANET. Em vez disso, ele construiu a correção da ARPANET. Onde a rede americana tornava os switches responsáveis pela confiabilidade, a equipe de Pouzin empurrou a confiabilidade para os hosts e deixou a rede transportar pacotes simples, autocontidos e não confiáveis, que ele batizou de datagramas: dado mais telegrama. A primeira demonstração rodou em novembro de 1973, com três hosts e um switch de pacotes, e a ideia viajou mais depressa do que a rede: o artigo de Vint Cerf e Bob Kahn de 1974 que virou o TCP/IP cita diretamente o trabalho da CYCLADES. A decisão de design mais profunda da internet, rede simples e bordas inteligentes, foi provada aqui primeiro.",
          sourceNote: "Lançamento do projeto (1972), recrutamento de Pouzin em novembro de 1971 e primeira demonstração em novembro de 1973 segundo o relato histórico do INRIA e o arquivo History of Computer Communications; as citações de Cerf e Kahn em 1974 segundo a própria lista de referências do artigo, conforme documentada no registro geral.",
        },
      ],
      // Timeline: same order and years as the English; prose translated.
      timeline: [
        { year: 1971, title: "Pouzin recebe a missão", detail: "Recrutado pela Delegation a l'Informatique em novembro de 1971, Louis Pouzin, veterano do Multics, é encarregado de construir uma rede de pesquisa francesa e monta a equipe do IRIA." },
        { year: 1972, title: "A CYCLADES começa no IRIA", detail: "Começam o design e a formação da equipe. A aposta arquitetural é feita cedo: uma camada de rede de datagramas não confiável, com a confiabilidade como responsabilidade fim a fim, do lado dos hosts." },
        { year: 1973, title: "Três hosts, um switch, e uma palavra nova", detail: "A primeira demonstração roda em novembro de 1973. Dentro do projeto, Pouzin cunha 'datagram', e a sub-rede de pacotes Cigale prova que o design sem conexão funciona na prática." },
        { year: 1974, title: "A ideia atravessa o Atlântico", detail: "'A Protocol for Packet Network Intercommunication', de Cerf e Kahn, o artigo fundador do TCP/IP, cita diretamente as contribuições da CYCLADES; Pouzin defendia o datagrama no International Network Working Group desde 1973.", sourceNote: "As citações do trabalho da CYCLADES no artigo segundo o registro geral da sua lista de referências." },
        { year: 1977, title: "O cerco dos PTT", detail: "A transmissão de dados é monopólio do Estado francês, e os PTT não veem motivo para financiar uma concorrente da futura rede X.25 Transpac. O relato do INRIA dá a CYCLADES como desligada em 1977; o registro geral descreve a rede sendo forçada a sair do ar até 1981.", sourceNote: "Divergência sobre a data do desligamento preservada: 1977 segundo o próprio relato histórico do INRIA; 'by 1981' (até 1981) segundo o registro geral. Os dois concordam sobre a causa." },
        { year: 2013, title: "A história paga a dívida", detail: "Louis Pouzin divide o primeiro Queen Elizabeth Prize for Engineering com Cerf, Kahn, Berners-Lee e Andreessen: o inventor do datagrama reconhecido ao lado da internet e da web que ele tornou possíveis." },
      ],
      // Products: descriptor words localised, descriptions translated.
      products: [
        { name: "O datagrama", what: "O pacote autocontido e sem conexão: a palavra cunhada por Pouzin, o substrato da CYCLADES e o modelo de pacote sobre o qual a internet ainda roda." },
        { name: "Cigale", what: "A sub-rede de comutação de pacotes da CYCLADES, com switches deliberadamente simples, porque a inteligência morava nas bordas." },
        { name: "O argumento fim a fim, na prática", what: "Confiabilidade a cargo dos hosts sobre uma rede não confiável, demonstrada funcionando em escala antes de o princípio ganhar seu nome famoso." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "Rede simples, bordas inteligentes", detail: "A CYCLADES provou que levar a confiabilidade para os hosts simplificava os switches e produzia uma rede que funcionava bem: a decisão de design fundamental do TCP/IP e da internet." },
        { title: "O custo de matá-la", detail: "A vitória dos PTT em favor da Transpac e do X.25 é a parábola clássica do setor sobre monopólios estabelecidos e inovação: a França, depois de inventar a ideia-chave da internet, adotou a internet tarde; veteranos do projeto estimam a liderança industrial perdida em bem mais de uma década." },
      ],
      // Markets: same number of entries as the English.
      markets: [
        "Uma rede de pesquisa financiada pelo Estado, não uma empresa: seu mercado eram as ideias, e suas ideias venceram em toda parte, menos, por vinte anos dolorosos, em casa.",
      ],
      // Analyst: same number of entries as the English.
      analyst: [
        "Arquivada na linhagem dos pioneiros ao lado da RAND e do NCSA: as instituições de pesquisa sobre as quais o setor foi construído. E guardada, com um sorriso, perto da Cyclades brasileira da história dos servidores de console: mesmo nome, outro continente, as duas parte da história deste site.",
      ],
    },
  },
  // ---- damovo: pt-BR prose for the record (facts stay in the English record) ----
  "damovo": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Damovo - uma divisão que sobreviveu a três donos",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Empresa europeia de serviços de tecnologia separada da Ericsson em 2001, hoje controlada pela Global Growth.",
    intro: "A Damovo foi criada em 2001, quando a Apax Partners comprou as operações de vendas diretas e serviços da Ericsson por cerca de US$ 480 milhões, num management buyout que começou em Glasgow e hoje tem sede em Dusseldorf. Entrega comunicações unificadas, redes corporativas, contact center e serviços gerenciados em mais de cento e cinquenta países.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "A própria descrição fala em mais de cinquenta anos de experiência numa empresa fundada em 2001, e as duas metades são verdadeiras ao mesmo tempo. A experiência pertencia à divisão corporativa da Ericsson e viajou com as pessoas quando a divisão foi vendida. Esse é o formato honesto de um carve-out: a pessoa jurídica é nova e os engenheiros não são, e é por isso que compradores pagam por esses negócios.",
      "A história financeira é a parte que vale registrar, porque é o desfecho que o private equity não anuncia. A Apax a comprou em 2001 e, em dezembro de 2006, tinha entregado toda a sua participação acionária aos credores da empresa; seguiu-se em 2007 uma reestruturação de dívida por ações, com os detentores de títulos trocando cerca de EUR 358 milhões em dívida pelo controle. A empresa comprada com dinheiro emprestado acabou pertencendo aos credores.",
      "Depois, ela foi dividida e vendida em partes, o negócio do Reino Unido para um lado e o europeu para outro, e adquirida de novo em 2022. Ao longo de quatro estruturas societárias, a lista de clientes continuou reconhecível: companhias aéreas, empresas de logística, um banco central e um serviço prisional, todos operando parques de voz e de rede sobre os quais alguém precisa continuar atendendo o telefone.",
    ],
  },
  // ---- dec: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "dec": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Digital Equipment Corporation - a rainha dos minicomputadores",
    // Card line (also the meta description) and intro paragraph.
    tagline: "As máquinas PDP e VAX de Ken Olsen definiram duas décadas de computação; a DEC foi coautora da Ethernet e terminou dentro da Compaq em 1998.",
    intro: "A DEC tirou a computação da sala de vidro: o PDP-8 tornou os computadores departamentais, o PDP-11 os tornou onipresentes, e o VAX/VMS fez deles um império de arquitetura. A DEC também assinou, com a Intel e a Xerox, o padrão Ethernet DIX, o motivo de este setor cabear do jeito que cabeia.",
    // Body: 5 paragraph(s), same order as the English.
    body: [
      "O perfil acompanha a trajetória da tecelagem de lã de Maynard até a aquisição pela Compaq por US$ 9,6 bilhões, então a maior da história da computação, e a linhagem do VMS ao Windows NT que seguiu as pessoas quando elas saíram.",
      "Ken Olsen e Harlan Anderson eram engenheiros do Lincoln Laboratory do MIT e tinham notado algo curioso: os alunos faziam fila por horas para usar o TX-0, uma máquina despojada, enquanto praticamente ignoravam um computador IBM mais rápido ao lado. Em 1957, vendo o meio empresarial americano hostil às empresas de computadores, eles aceitaram US$ 70.000 da American Research and Development por 70 por cento de uma empresa cujo nome evitava a palavra computador, e se instalaram numa tecelagem da época da Guerra Civil em Maynard, Massachusetts, onde o espaço fabril era barato. O PDP-8 veio em 22 de março de 1965, o PDP-11 em 1970 e, em outubro de 1977, o VAX-11/780, o superminicomputador cuja combinação de recursos, preço e marketing tomou a liderança do mercado quase assim que começou a ser entregue, em 1978. Naquele mesmo ano, Olsen disse que não havia motivo para alguém ter um computador em casa.",
      "O VMS foi anunciado junto com o VAX. O VAX/VMS, Virtual Address eXtension e Virtual Memory System, saiu dos projetos Star e Starlet, com Dave Cutler, Dick Hustvedt e Peter Lipman como líderes técnicos, e é o sistema operacional ao qual este registro sempre volta, porque sua gente saiu duas vezes: Cutler foi para a Microsoft, onde o Windows NT foi, na expressão da enciclopédia, possibilitado por ex-engenheiros da Digital, e o próprio sistema foi rebatizado OpenVMS em julho de 1992 para sinalizar compatibilidade com POSIX e Unix e tirar o VAX do nome enquanto a arquitetura mudava por baixo dele. Foi portado para o Alpha, para os servidores Integrity baseados em Itanium e, desde que a VMS Software Inc. assumiu o desenvolvimento e o suporte em 2014, para x86-64, com o kit early adopter V9.0 saindo em maio de 2020. Bancos, hospitais, operadoras de telecomunicações e fabricantes ainda o usam.",
      "As redes são o motivo de a DEC estar nesta linha do tempo. Em 1984, a empresa lançou sua primeira Ethernet de 10 Mbit/s e, com o VAXcluster, o DECnet e os servidores de terminal LAT, tinha uma arquitetura de armazenamento em rede que concorria diretamente com a IBM, tirando dela cerca de US$ 2 bilhões em meados dos anos 1980, segundo estimativas; a DEC tinha assinado a especificação Ethernet DIX com a Intel e a Xerox, e a Ethernet substituiu o Token Ring e virou o modelo dominante em uso até hoje. No auge, no fim dos anos 1980, a empresa vendia US$ 14 bilhões e estava entre as mais lucrativas dos Estados Unidos.",
      "O colapso foi rápido. As vendas de minicomputadores caíram, o VAX 9000 fracassou no topo de linha, e Olsen foi afastado em julho de 1992, substituído por Robert Palmer, a primeira pessoa a ter o título de chief executive nos 35 anos da empresa; o ano fiscal de 1992 fechou com prejuízo de US$ 2,8 bilhões. Os processadores Alpha de 1992, rodando OpenVMS, DEC OSF/1 e Windows NT, ganharam terreno em meados dos anos 1990, mas tarde demais; a propriedade intelectual do StrongARM foi para a Intel num acordo de 1997. Em junho de 1998, a Compaq adquiriu a DEC no que era então a maior fusão da história do setor de computadores, e descobriu que tinha pouca ideia do que fazer com as aquisições; a própria Compaq foi comprada pela Hewlett-Packard em maio de 2002, e é aí que o registro da Hewlett-Packard nesta linha do tempo retoma a linhagem.",
    ],
    // Ending note and successor label (the year and the URL stay in the English record).
    endedNote: "Adquirida pela Compaq em junho de 1998, então a maior fusão da história do setor de computadores; a própria Compaq foi comprada pela Hewlett-Packard em maio de 2002. O VMS sobreviveu aos dois donos: o OpenVMS é desenvolvido e suportado pela VMS Software Inc. desde 2014 e hoje roda em x86-64.",
    successorLabel: "HP, por meio da Compaq, que adquiriu a Digital em 1998",
    // Profile: complete copy of profiles/dec.ts; years, companies, founders and personal markers untouched.
    profile: {
      // Same slug as the English profile.
      slug: "dec",
      // Founding stories: place (geography localised) and story translated; company, year and founders verbatim.
      foundings: [
        {
          company: "Digital Equipment Corporation",
          year: 1957,
          place: "Maynard, Massachusetts",
          founders: ["Ken Olsen", "Harlan Anderson"],
          story: "Ken Olsen e Harlan Anderson aceitaram US$ 70.000 da American Research and Development de Georges Doriot, um dos investimentos fundadores do venture capital, e se instalaram numa tecelagem de lã da época da Guerra Civil para construir computadores que as pessoas pudessem de fato tocar. A linha PDP tirou a computação da sala de vidro do mainframe: o PDP-8 pôs um computador no departamento, o PDP-11 pôs um no laboratório, na fábrica e na central telefônica, e o VAX/VMS construiu um império sobre a compatibilidade. No auge, a DEC era a segunda maior empresa de computadores do mundo e a âncora, na Nova Inglaterra, de um setor inteiro.",
        },
      ],
      // Timeline: same order and years as the English; prose translated.
      timeline: [
        { year: 1957, title: "A tecelagem de Maynard", detail: "Fundada com dinheiro de venture capital da ARD numa tecelagem de lã: primeiro módulos, depois o PDP-1, no qual um certo hack do MIT chamado Spacewar! vira um dos primeiros videogames." },
        { year: 1965, title: "PDP-8: o minicomputador", detail: "O primeiro minicomputador produzido em massa, a US$ 18.000, cria uma categoria: computação que um departamento pode comprar sem pedir ao conselho." },
        { year: 1970, title: "PDP-11", detail: "Talvez a arquitetura de computador mais influente já lançada: a máquina em que o Unix e o C cresceram, embarcada em toda parte, de fábricas a centrais telefônicas, por décadas." },
        { year: 1977, title: "VAX/VMS", detail: "O império de 32 bits: uma arquitetura do desktop ao datacenter, em cluster antes de cluster virar palavra, com o DECnet ligando tudo; o mundo das redes proprietárias que a Ethernet iria tanto servir quanto destronar." },
        { year: 1980, title: "O padrão DIX", detail: "A DEC é coautora da especificação Ethernet com a Intel e a Xerox: o gesto pragmático que fez da invenção do PARC um padrão do setor e, com o tempo, o único cabo que importa." },
        { year: 1998, title: "Compaq, depois HP", detail: "Depois que a aposta no Alpha e a curiosidade do AltaVista não conseguiram reverter o declínio, a Compaq conclui em junho de 1998 a aquisição de cerca de US$ 9,6 bilhões, então o maior negócio da história da computação, e leva a DEC para a HP em 2002. A equipe do VMS de Dave Cutler já tinha levado suas ideias para a Microsoft como Windows NT.", sourceNote: "Registro do negócio; a linhagem do VMS ao NT é amplamente documentada." },
      ],
      // Products: names verbatim, descriptions translated.
      products: [
        { name: "PDP-8 e PDP-11", what: "Os minicomputadores que criaram a computação departamental, e o solo natal do Unix e do C." },
        { name: "VAX/VMS", what: "O império de arquitetura e sistema operacional de 32 bits, em cluster e em rede, que definiu a computação corporativa entre o mainframe e o PC." },
        { name: "Alpha", what: "O canto do cisne RISC de 64 bits: por anos o processador mais rápido do planeta, uma década à frente do seu mercado." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "A categoria do minicomputador", detail: "A DEC inventou a computação em escala de departamento, o degrau entre a sala de vidro da IBM e o PC em cada mesa, e a dominou por vinte anos." },
        { title: "A coassinatura da Ethernet", detail: "O padrão DIX é o motivo de a Ethernet ter vencido: o peso corporativo da DEC por trás da ideia do PARC transformou uma rede de laboratório no cabeamento do mundo." },
      ],
      // Markets: same number of entries as the English.
      markets: [
        "Os mercados da DEC se dissolveram no mundo dos PCs e servidores que ela se recusou a levar a sério; seu DNA persiste na arquitetura do Windows NT, na onipresença da Ethernet e na diáspora de engenheiros da computação da Nova Inglaterra.",
      ],
      // Analyst: same number of entries as the English.
      analyst: [
        "Por duas décadas, o contrapeso à IBM em toda avaliação que importava; e, depois, o estudo de caso clássico de uma grande empresa de engenharia que perdeu uma mudança de plataforma que ela mesma tinha tornado possível.",
      ],
    },
  },
  // ---- dns-bind: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "dns-bind": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "DNS & BIND - a lista telefônica da internet e sua implementação de referência",
    // Card line (also the meta description) and intro paragraph.
    tagline: "O design de Mockapetris de 1983 e o software de Berkeley que o rodou: delegação, cache e quarenta anos do mesmo formato de transmissão.",
    intro: "Antes do DNS, os nomes da internet viviam num arquivo de texto que todo mundo baixava. O design de Paul Mockapetris de 1983 o substituiu por um banco de dados planetário, delegado e com cache, e quatro alunos de pós-graduação de Berkeley escreveram o BIND, a implementação que fez de 'rodar DNS' e 'rodar BIND' a mesma frase por um quarto de século.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "O perfil cobre o colapso do HOSTS.TXT, as RFCs 882/883 e 1034/1035, o registro MX, Vixie e o ISC, o BIND 9, o patch de Kaminsky, a assinatura da raiz em 2010, o dia da Dyn e a era do DoT/DoH.",
    ],
    // Profile: complete copy of profiles/dns-bind.ts; years, companies, founders and personal markers untouched.
    profile: {
      // Same slug as the English profile.
      slug: "dns-bind",
      // Founding stories: place (geography localised) and story translated; company, year and founders verbatim.
      foundings: [
        {
          company: "The Domain Name System (RFC 882/883)",
          year: 1983,
          place: "USC Information Sciences Institute, Marina del Rey, Califórnia",
          founders: ["Paul Mockapetris (design)", "Jon Postel (impetus and stewardship)"],
          story: "Antes do DNS havia um arquivo de texto. O Network Information Center do SRI, o grupo de Elizabeth Feinler, mantinha o HOSTS.TXT, a lista mestra de todas as máquinas da rede, e cada host baixava por FTP uma cópia nova confiando no que recebia. No início dos anos 1980, o arquivo, e o processo, desmoronavam à vista de todos sob o crescimento. Jon Postel entregou a Paul Mockapetris o problema de unificar as correções concorrentes, e ele voltou com algo mais ambicioso do que o pedido: um banco de dados distribuído, hierárquico e com cache, em que a autoridade é delegada ao longo dos próprios nomes. As RFCs 882 e 883 saíram em novembro de 1983, com uma primeira implementação chamada JEEVES no TOPS-20; a reescrita de 1987, como RFCs 1034 e 1035, refinou o design nos documentos que ainda regem cada consulta feita hoje.",
        },
        {
          company: "BIND (Berkeley Internet Name Domain)",
          year: 1984,
          place: "University of California, Berkeley",
          founders: ["Douglas Terry", "Mark Painter", "David Riggle", "Songnian Zhou"],
          story: "Um protocolo sem implementação é um papel; quatro alunos de pós-graduação de Berkeley, trabalhando com uma bolsa da DARPA, tornaram o DNS real para o UNIX ao escrever o Berkeley Internet Name Domain para o 4.3BSD. A manutenção passou por Kevin Dunlap, na DEC, e depois, a partir de 1988, a Paul Vixie, o mesmo Vixie que escreveu o cron que a maioria dos sistemas ainda roda, que se tornou o guardião do software por décadas e, em 1994, foi cofundador do Internet Software Consortium para dar a ele uma casa permanente e neutra em relação a fabricantes. Por longos trechos da história da internet, a frase 'esta rede roda DNS' e a frase 'esta rede roda BIND' foram, na prática, a mesma frase.",
        },
      ],
      // Timeline: same order and years as the English; prose translated.
      timeline: [
        { year: 1983, title: "Duas RFCs substituem um arquivo de texto", detail: "RFCs 882 e 883, novembro de 1983: os nomes viram uma hierarquia delegada, as consultas viram um protocolo de consulta distribuído, e a implementação JEEVES no TOPS-20 prova que funciona. O ponto único de falha que era o HOSTS.TXT começa a se aposentar.", sourceNote: "RFC 882 / RFC 883, novembro de 1983." },
        { year: 1986, title: "O registro MX", detail: "A RFC 974 de Craig Partridge desacopla o roteamento de e-mail dos nomes de host: um domínio pode receber e-mail sem que a máquina de e-mail carregue o seu nome. O tipo de registro que tornou estruturalmente possível o e-mail hospedado e, mais tarde, o e-mail em nuvem.", sourceNote: "RFC 974, janeiro de 1986." },
        { year: 1987, title: "RFC 1034 / 1035", detail: "A reescrita que ainda rege tudo: zonas, delegação, cache com TTLs, o modelo de resource records. O formato de transmissão que um resolver fala hoje é reconhecidamente o do documento de 1987: quarenta anos de crescimento planetário sobre os mesmos conceitos.", sourceNote: "RFC 1034 / RFC 1035, novembro de 1987." },
        { year: 1988, title: "Vixie assume o bastão", detail: "Paul Vixie assume a manutenção do BIND na DEC e, em 1994, é cofundador do Internet Software Consortium como sua casa permanente: infraestrutura aberta financiada por consórcio antes de a expressão existir. O ISC também passa a operar o F-root, uma das treze identidades de root server." },
        { year: 2000, title: "BIND 9", detail: "Uma reescrita do zero, financiada por uma coalizão de fabricantes e por dinheiro da DARPA depois dos problemas de segurança da linhagem BIND 4/8, construída para estar pronta para DNSSEC, para views e para a postura de segurança que a década anterior tinha mostrado ser necessária." },
        { year: 2008, title: "A falha de Kaminsky", detail: "Dan Kaminsky descobre um ataque prático de envenenamento de cache contra o próprio protocolo. A resposta, um patch simultâneo de vários fabricantes coordenado em segredo, que introduziu a randomização da porta de origem, vira o modelo de divulgação sincronizada em todo o setor.", sourceNote: "CERT Vulnerability Note VU#800113, julho de 2008." },
        { year: 2010, title: "A raiz é assinada", detail: "O DNSSEC chega à zona raiz em 15 de julho de 2010, dando à hierarquia uma âncora de confiança criptográfica e transformando 'esta resposta é autêntica?' de uma esperança numa propriedade verificável, onde a cadeia está implantada.", sourceNote: "Registro da implantação do DNSSEC na zona raiz pela ICANN / Verisign, 15 de julho de 2010." },
        { year: 2016, title: "O dia da Dyn", detail: "21 de outubro de 2016: o DDoS da botnet Mirai contra a Dyn, provedora de DNS gerenciado, deixa grandes sites inacessíveis durante boa parte do dia; o momento em que 'o DNS é infraestrutura crítica' deixou de ser frase de engenheiro e virou manchete.", sourceNote: "Análise pública do incidente pela Dyn e cobertura da imprensa na época, outubro de 2016." },
        { year: 2018, title: "Resolução criptografada", detail: "DNS over TLS (RFC 7858, 2016) e DNS over HTTPS (RFC 8484, 2018) fecham a brecha de escuta na última milha e levam a escolha do resolver para dentro de navegadores e sistemas operacionais, transformando a política de resolução num debate vivo sobre privacidade e governança.", sourceNote: "RFC 7858 (2016) / RFC 8484 (2018)." },
      ],
      // Products: descriptor words localised, descriptions translated.
      products: [
        { name: "O próprio DNS", what: "Um banco de dados distribuído, hierárquico e com cache: da raiz ao TLD e à zona, com autoridade delegada ao longo do nome e respostas em cache na borda. O maior sistema distribuído já implantado, e o primeiro que toda conexão consulta." },
        { name: "BIND 4 / 8 / 9", what: "A linhagem da implementação de referência: named, arquivos de zona e, a partir do BIND 9, a maquinaria de views e DNSSEC; o software que 'rodar DNS' significou na prática por um quarto de século." },
        { name: "O modelo de resource records", what: "A, AAAA, NS, SOA, MX, CNAME, TXT, SRV e seus parentes: um design extensível de registros tipados (esticado ainda mais pelo EDNS0 em 1999) que permitiu a um esquema de 1983 absorver todas as eras desde então." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "Delegação como arquitetura", detail: "A autoridade é distribuída ao longo da própria hierarquia de nomes: a escala vem de repassar, e nenhum operador central é necessário além da raiz. O design escalou de centenas de hosts para bilhões sem mudar de forma." },
        { title: "Cache com TTLs", detail: "O cache dos resolvers fez um banco de dados planetário parecer instantâneo, e o TTL virou o botão que todo plano de migração desde então girou; o motivo de 'propagação' ser uma palavra que engenheiros de rede usam suspirando." },
        { title: "A implementação de referência aberta", detail: "O BIND provou que um padrão dá certo quando uma implementação aberta, financiada em comum, o carrega; e depois provou também o perigo da monocultura, respondido com diversidade deliberada: djbdns, NSD e Unbound, PowerDNS, Knot." },
      ],
      // Markets: same number of entries as the English.
      markets: [
        "Toda transação na internet começa com uma consulta: registries e registrars, resolvers de provedores e públicos (a era do 8.8.8.8 e do 1.1.1.1), DNS corporativo e global server load balancing; o material de GSLB e BIG-IP DNS ensinado neste site se apoia diretamente nessas fundações.",
      ],
      // Analyst: same number of entries as the English.
      analyst: [
        "O DNS é o sistema distribuído mais bem-sucedido da internet: mais de quarenta anos, os mesmos conceitos de transmissão, escala planetária, porque o design de 1983 acertou a delegação e o cache de primeira.",
        "A trajetória do BIND é a economia da infraestrutura open source antes de o termo existir: semeado pela DARPA, nascido na universidade, financiado por consórcio; e seus anos de monocultura são o argumento permanente a favor da diversidade de implementações em software crítico.",
        "Esta dupla é o motivo de as ferramentas de DNS deste site existirem: decodificação do dig, fluxos de decisão de GSLB, aritmética de propagação, tudo isso a jusante de duas RFCs que Mockapetris escreveu em 1983.",
      ],
    },
    // Lineage note (PRIME ruling 2, 26/10/2026): what this card covers.
    lineageNote: "Um protocolo, o Domain Name System, e sua implementação de referência, o BIND: nenhum dos dois é uma empresa.",
  },
  // ---- dyn: pt-BR prose for the record (facts stay in the English record) ----
  "dyn": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Dyn - DNS gerenciado, e o dia em que ele caiu",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Provedora de DNS gerenciado e DNS dinâmico, depois adquirida pela Oracle.",
    intro: "A Dyn oferecia DNS dinâmico e DNS autoritativo gerenciado, e foi adquirida pela Oracle. Está nesta linha do tempo pela lição de arquitetura que sua queda de 2016 ensinou ao resto do setor.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "Um ataque distribuído de negação de serviço contra a infraestrutura da Dyn deixou uma longa lista de grandes serviços inacessíveis ao mesmo tempo, não porque esses serviços estivessem fora do ar, mas porque os nomes que apontavam para eles não podiam ser resolvidos. As aplicações estavam saudáveis, e a internet não conseguia encontrá-las.",
      "A lição valeu para além de uma empresa: o DNS autoritativo é um ponto único de falha que não parece um num diagrama de arquitetura, porque é desenhado como uma consulta, e não como uma dependência. A resposta do setor foram provedores secundários e vários serviços autoritativos, uma decisão de design que chega em forma de fatura.",
      "Os detalhes merecem registro, porque é fácil concordar com a lição geral acima, e são os pormenores que a fixam. O ataque começou por volta das 11h10 UTC da sexta-feira, 21 de outubro de 2016, contra o DNS gerenciado da Dyn na região US-East, em três ondas, duas das quais derrubaram o serviço por completo. Algo acima de 100.000 dispositivos participaram, e o tráfego foi estimado em 1,2 terabit por segundo, entre os maiores já medidos até então. Twitter, Netflix, Reddit, Spotify, GitHub e PayPal ficaram inacessíveis para milhões de pessoas nos Estados Unidos e na Europa, todos funcionando normalmente atrás de nomes que ninguém conseguia resolver.",
      "A arma era o Mirai, e a biografia dele é a parte incômoda. Ele varria a internet IPv4 inteira atrás de qualquer coisa com telnet aberto e fazia login com uma lista de sessenta e duas senhas de fábrica. Não usava amplificação nem reflexão, só o volume bruto de muitíssimas máquinas pequenas. Os autores eram três universitários cujo interesse era hospedar servidores de Minecraft, e três semanas antes do ataque à Dyn um deles publicou o código-fonte completo num fórum, de modo que, em 21 de outubro, qualquer um podia montar o mesmo exército. Eles se declararam culpados em 2017 e foram condenados em 2018 a liberdade condicional e serviço comunitário. Um worm feito por estudantes para ganhar um jogo ainda aparece em ataques recordes uma década depois, porque a condição que ele explora não mudou.",
      "Do que ele era feito importa para um catálogo de redes. Os dispositivos eram câmeras de segurança e gravadores de vídeo domésticos, baratos, sem supervisão e nunca atualizados; um fabricante chinês de componentes fez recall das placas de muitos deles em poucos dias. Essa é a população que o artigo sobre controle de acesso descreve como o caso difícil, equipamento que não roda um agente e muitas vezes não se distingue da mobília, e o incidente é a prova de que o dispositivo mais barato da rede pode ser o que decide se o serviço mais caro continua acessível.",
      "A própria Dyn foi absorvida pela Oracle nas semanas seguintes. Se isso foi um reconhecimento da sua importância ou uma consequência da sua exposição, dá para argumentar dos dois jeitos; o que não se discute é que o setor tirou a conclusão de design registrada acima, e que um único provedor autoritativo passou a ser tratado, desde então, como um risco a ser precificado.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A Dyn foi adquirida pela Oracle, em uma transação anunciada em 21 de novembro de 2016, e dyn.com hoje redireciona para a página do serviço de DNS da Oracle.",
  },
  // ---- fast-lane: pt-BR prose for the record (facts stay in the English record) ----
  "fast-lane": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Fast Lane - a independente que ensina os cursos dos fabricantes",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Empresa global de treinamento em TI que entrega currículos autorizados da Cisco, da Microsoft, da Aruba, da NetApp e de outros.",
    intro: "A Fast Lane entrega o treinamento dos próprios fabricantes sob autorização, Cisco, Microsoft, Red Hat, Aruba, NetApp, na maior parte do mundo, e aparece entre as vinte maiores empresas de treinamento em TI todos os anos desde 2008.",
    // Body: 7 paragraph(s), same order as the English.
    body: [
      "O negócio em que ela atua é aquele a partir do qual este site é escrito, e vale descrever o formato, porque ele é invisível de fora. Um fabricante escreve um curso e certifica quem pode ministrá-lo; uma empresa de treinamento independente reúne essas autorizações de vários fabricantes ao mesmo tempo e emprega os instrutores que as têm. O cliente compra um curso do fabricante; a pessoa na sala não trabalha nem para o fabricante nem para o cliente.",
      "A lista de prêmios é um documento útil por esse motivo: Cisco Learning Partner of the Year na América Latina, no Chile, no Japão, no Benelux, na França, na Itália, no Oriente Médio e no mundo, ao longo de mais de uma década. O treinamento de fabricante é entregue regionalmente e avaliado regionalmente, porque um curso é tão bom quanto a pessoa diante da turma, e essa pessoa é local.",
      "As parcerias com a Tech Data e a Ingram Micro para entregar currículos da IBM são a outra metade da história e se ligam aos registros de distribuição desta seção: as mesmas distribuidoras que movimentam produto também levam treinamento, porque um canal que não consegue implantar o que vende não vende a segunda vez.",
      "A empresa por trás desses prêmios é alemã, o que vale dizer, porque o setor de treinamento que este site descreve costuma ser presumido americano. O Fast Lane Institute for Knowledge Transfer foi fundado em Hamburgo em 1996; seu chief executive e chairman, Torsten Poels, tinha aberto sua primeira empresa de serviços de rede em 1990, dirigido vários learning partners da Cisco e entrado em 2003 para expandir o grupo: para a Rússia e a CEI, as Américas a partir de maio de 2005, o Japão, a Coreia a partir de 2006. Hoje ela declara cerca de quatro mil profissionais, noventa países e uma posição que nenhuma outra empresa de treinamento ocupa: a única parceira global de treinamento dos três hiperescaladores de nuvem ao mesmo tempo, ao lado de cerca de trinta outros fabricantes.",
      "Dois dos prêmios recentes dizem algo sobre para onde o modelo foi. Os da VMware e da Red Hat são do tipo conhecido: um fabricante reconhecendo um parceiro por entregar bem o currículo do próprio fabricante. O prêmio da Cisco de 2025 é diferente: é por trabalho derivado, o termo do fabricante para o material didático que o parceiro escreve ele mesmo, construído sobre o material do fabricante, mas não idêntico a ele. Uma empresa de treinamento que só entrega o curso de outra é um canal; uma cujo material didático próprio recebe prêmios do fabricante está mais perto de uma editora, e a diferença está em onde terminam a margem e a propriedade intelectual.",
      "Uma empresa alemã que virou o maior grupo independente de treinamento multifabricante é a versão, no setor de treinamento, da história que os registros da Italtel e da Atos contam sobre equipamentos: o modelo foi inventado nos Estados Unidos, e uma empresa europeia construiu a maior instância dele por estar em mais países do que o braço educacional de qualquer fabricante conseguiria alcançar. O instrutor na sala em Santiago ou em Seul trabalha para uma empresa de Hamburgo, ensinando um curso escrito em San Jose, a um cliente que talvez nunca saiba nenhum desses fatos.",
      "A Fast Lane é um grupo, e não uma empresa única, e é por isso que circulam duas datas de fundação para ela. O grupo data de 1996 e tem sede em Morrisville, Carolina do Norte; a Fast Lane Institute for Knowledge Transfer GmbH, a empresa alemã cujo nome muitas vezes é usado para a organização inteira, foi constituída em 2003 e opera a partir de Hamburgo. As duas são a Fast Lane, e um banco de dados que cita uma ou outra está descrevendo uma pessoa jurídica diferente, não se contradizendo.",
    ],
  },
  // ---- freshworks: pt-BR prose for the record (facts stay in the English record) ----
  "freshworks": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Freshworks - o help desk que nasceu de um comentário no Hacker News",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Fundada num galpão de 700 pés quadrados em Chennai, em 2010, por um chefe de produto da Zoho que leu que um concorrente tinha aumentado os preços; a primeira empresa indiana de software como serviço a abrir capital na Nasdaq.",
    intro: "A Freshworks é uma empresa de software de atendimento ao cliente e de serviços de TI fundada em Chennai em 2010 como Freshdesk, hoje com sede na Califórnia e listada na Nasdaq desde 2021.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "A origem é bem documentada fora do comum porque o fundador a contou ele mesmo. Girish Mathrubootham tinha passado nove anos na Zoho, a empresa geralmente considerada a primeira verdadeira empresa indiana de produtos de software, e chefiava a gestão de produto da divisão ManageEngine quando leu uma discussão no Hacker News sobre um concorrente de help desk que tinha aumentado os preços de sessenta a trezentos por cento, e sobre a revolta dos usuários. Ele construía help desks on-premises desde 2004 e percebeu que o mesmo produto entregue a partir da nuvem seria um grande negócio. Pediu demissão, com dois filhos pequenos para sustentar, e em outubro de 2010 fundou a Freshdesk com o colega Shan Krishnasamy e uma equipe de seis pessoas num galpão de setecentos pés quadrados em Chennai.",
      "A empresa sempre foi americana no papel e indiana na substância, com Chennai como base de engenharia e, mais tarde, San Mateo como sede. Foi rebatizada Freshworks quando a linha de produtos se ampliou do suporte ao cliente para vendas, marketing e gestão de serviços de TI, o mesmo território que a ServiceNow ocupa de cima, abordado de baixo com um produto que uma pequena empresa conseguia adotar numa tarde. Em 22 de setembro de 2021, abriu capital na Nasdaq a trinta e seis dólares por ação, a primeira empresa de software como serviço fundada por indianos e apoiada por venture capital a abrir capital nos Estados Unidos, e hoje informa receita acima de oitocentos milhões de dólares.",
      "Duas coisas sobre ela pertencem a este catálogo. A primeira é a linhagem: a Zoho formou o fundador, o modelo da Zoho de construir produtos em Chennai para o mundo foi o molde, e a empresa resultante provou que uma empresa indiana de produtos, e não uma empresa de serviços que fornece pessoal para projetos alheios, o modelo da EPAM, podia competir em pé de igualdade numa categoria de software americana. A segunda é o gatilho. Uma decisão de preço de uma empresa estabelecida, discutida em público, criou o próprio concorrente. Os registros da Nortel e da Nokia registram empresas estabelecidas que não enxergaram um desafiante; aqui, o desafiante estava lendo os comentários.",
    ],
  },
  // ---- inorpel: pt-BR prose for the record (facts stay in the English record) ----
  "inorpel": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Inorpel",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Parceira Fortinet de nível Expert no Brasil.",
    intro: "Parceira Fortinet de nível Expert em Cabedelo, Paraíba, e um dos poucos registros desta seção cujo nome pertence a duas empresas ao mesmo tempo.",
    // Body: 4 paragraph(s), same order as the English (registered company names kept as the English writes them).
    body: [
      "O cadastro traz a Inorpel Comercio e Servicos, aberta em 25 de junho de 2009 em Cabedelo, com atividade de suporte técnico e manutenção, e, separadamente, a Inorpel Industria Nordestina de Produtos Eletricos, fundada em 26 de outubro de 1994 no mesmo endereço. Uma empresa de serviços de TI que divide o nome e a cidade com uma fabricante de material elétrico quinze anos mais velha é o formato comum de um grupo familiar brasileiro entrando numa nova linha, e os dois registros ficam anotados aqui em vez de se escolher um.",
      "No diretório do fabricante, ela aparece como integradora e provedora de segurança gerenciada, com SASE, SD-WAN e operações de segurança. Um parceiro que mantém uma prática de operações de segurança a partir da Paraíba merece nota por si só: o Nordeste é sub-representado em toda lista de canais brasileira, inclusive esta.",
      "O nome é uma sigla e explica a empresa: INdustria NORdestina de Produtos ELetricos, uma fabricante nordestina de produtos elétricos. Há dois registros em Cabedelo, Paraíba: o industrial, aberto em 1994, e a Inorpel Comercio e Servicos, aberta em 25 de junho de 2009, cuja atividade registrada é suporte técnico e serviços de TI. A data de 2009 é a usada aqui porque essa é a pessoa jurídica que faz este trabalho.",
      "A empresa se descreve com mais de quarenta anos em tecnologia, o que recua mais do que qualquer dos dois registros; um lembrete de que um CNPJ brasileiro data uma pessoa jurídica, não um negócio. Ela se posiciona como a primeira empresa da Paraíba especializada em serviços e consultoria de segurança da informação, com a cibersegurança como um segmento mais novo ao lado do trabalho mais antigo em tecnologia, e trabalha com Fortinet, Bitdefender, Acronis, Qualys e PRTG, entre outros.",
    ],
  },
  // ---- intel: pt-BR prose for the record (facts stay in the English record) ----
  "intel": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Intel - o processador no plano de controle",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Fundada em 1968 por Moore e Noyce; a arquitetura x86, o primeiro microprocessador e a interface de rede que todo mundo usa.",
    intro: "A Intel foi fundada em 18 de julho de 1968 por Gordon Moore e Robert Noyce, produziu o primeiro microprocessador disponível comercialmente em 1971 e definiu a arquitetura x86, sobre a qual ainda roda a maior parte da computação de uso geral.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "O lugar dela numa linha do tempo de redes não é o processador de um notebook. É o processador no plano de controle: a CPU de gerenciamento dentro de um switch, o appliance que roda um firewall ou um load balancer, e o servidor que termina o tráfego na ponta. Boa parte dos equipamentos descritos em outros pontos deste site é uma máquina x86 com silício especializado ao lado, e o sistema operacional no processador de gerenciamento é onde mora a configuração.",
      "O segundo lugar é a interface de rede. Os controladores Ethernet da Intel são, na prática, a implementação de referência: os drivers vêm com todo sistema operacional, o comportamento é o que a documentação pressupõe, e uma grande quantidade de software de processamento de pacotes foi escrita primeiro contra eles.",
      "Duas de suas decisões aparecem nos marcos deste site, e não aqui. O 4004, em 1971, é onde o microprocessador começa, e a escolha de Leixlip, em 1989, para a primeira fábrica de wafers fora dos Estados Unidos é uma das âncoras da história da manufatura irlandesa.",
    ],
  },
  // ---- intel-amd: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "intel-amd": {
    // Title: companies verbatim, subtitle translated (the " - " separator is structural).
    name: "Intel & AMD - os filhos da Fairchild: a rivalidade do x86",
    // Card line (also the meta description) and intro paragraph.
    tagline: "O 4004, a Lei de Moore e o segundo fornecedor que escreveu o AMD64: um só registro, porque nenhuma das duas histórias se entende sem a outra.",
    intro: "As duas empresas saíram da Fairchild Semiconductor com um ano de diferença, Noyce e Moore em 1968, Jerry Sanders em 1969, e passaram o meio século seguinte pondo preço na computação para todo mundo. A Intel inventou o microprocessador comercial e ditou o ritmo do setor; a AMD foi de segundo fornecedor licenciado a autora do conjunto de instruções x86 de 64 bits que o mundo inteiro (a Intel incluída) roda hoje.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "O perfil cobre o êxodo da Fairchild, o 4004 e a exigência de fornecimento duplo do IBM PC, a saída da memória, a corrida dos gigahertz, a ironia do AMD64, a volta por cima do Zen e as apostas divergentes do duopólio.",
    ],
    // Profile: complete copy of profiles/intel-amd.ts; years, companies, founders and personal markers untouched.
    profile: {
      // Same slug as the English profile.
      slug: "intel-amd",
      // Founding stories: place (geography localised) and story translated; company, year and founders verbatim.
      foundings: [
        {
          company: "Intel",
          year: 1968,
          place: "Mountain View, Califórnia",
          founders: ["Robert Noyce", "Gordon Moore"],
          story: "Dois dos fundadores da Fairchild Semiconductor, Noyce, coinventor do circuito integrado, e Moore, cuja observação de 1965 sobre a contagem de transistores virou o metrônomo do setor, saíram para construir a Integrated Electronics, com Andy Grove como primeira contratação. A Intel significava memória primeiro (a DRAM 1103), mas um contrato de calculadora em 1971 produziu o 4004, o primeiro microprocessador comercial, e a empresa passou o meio século seguinte como a implementação de referência da Lei de Moore.",
        },
        {
          company: "Advanced Micro Devices",
          year: 1969,
          place: "Sunnyvale, Califórnia",
          founders: ["Jerry Sanders", "and seven Fairchild colleagues"],
          story: "Um ano depois de Noyce e Moore, o extravagante chefe de vendas da Fairchild, Jerry Sanders, fundou a AMD a poucas quadras dali, e, como ficou famoso, com o dinheiro de venture capital chegando com mais dificuldade ('Noyce raised his in an afternoon; it took me a million years to raise a million dollars', ou seja, Noyce levantou o dele numa tarde; eu levei um milhão de anos para levantar um milhão de dólares). A AMD construiu suas primeiras décadas como o segundo fornecedor do setor, a alternativa licenciada que os grandes compradores exigiam, e as seguintes como a rival que, repetidas vezes, manteve o duopólio do x86 honesto.",
        },
      ],
      // Timeline: same order and years as the English; prose translated.
      timeline: [
        { year: 1971, title: "O 4004", detail: "Novembro de 1971: Faggin, Hoff e Mazor (com Shima, da Busicom) lançam o primeiro microprocessador comercial, 2.300 transistores fazendo o que fazia uma placa de calculadora. O processador de uso geral como PRODUTO começa aqui." },
        { year: 1981, title: "A IBM escolhe o x86, com dois fornecedores", detail: "O IBM PC escolhe o 8088 da Intel, e a política de fornecimento duplo da IBM torna a AMD uma fabricante oficial de x86 por meio do acordo de troca de tecnologia de 1982: o contrato cujo desmanche alimenta uma década de litígios e o triunfo em clean room do Am386 em 1991." },
        { year: 1985, title: "A Intel sai da memória", detail: "O famoso experimento mental de Grove e Moore, 'if the board fired us, what would the new CEOs do?' (se o conselho nos demitisse, o que os novos CEOs fariam?), tira a Intel do negócio de DRAM que ela mesma tinha inventado e a põe inteira nos microprocessadores: a virada estratégica que as escolas de administração ainda ensinam." },
        { year: 2000, title: "A corrida dos gigahertz", detail: "Março de 2000: o Athlon da AMD passa de 1 GHz dias antes da Intel, a desafiante ditando o ritmo pela primeira vez, sobre o K7 de Dirk Meyer; um tiro de advertência do que 2003 traria." },
        { year: 2003, title: "AMD64: a desafiante escreve o ISA", detail: "Opteron e Athlon 64 trazem uma extensão de 64 bits do x86 enquanto a Intel aposta no Itanium. O mercado escolhe a compatibilidade; a Intel adota o conjunto de instruções da AMD. O x86 de 64 bits que o mundo inteiro roda foi definido pelo segundo fornecedor: a ironia que define a rivalidade.", sourceNote: "A adoção pela Intel saiu como EM64T em 2004, depois 'Intel 64'." },
        { year: 2017, title: "Zen", detail: "Sob Lisa Su, a arquitetura Zen da AMD chega como Ryzen e EPYC: a volta por cima depois dos anos do Bulldozer, que reabre o mercado de servidores e puxa para a frente, mais uma vez, o roadmap do duopólio inteiro." },
        { year: 2022, title: "Dois gigantes diferentes", detail: "A AMD conclui a aquisição da Xilinx, de cerca de US$ 49 bilhões, e vira uma casa de CPU, GPU e FPGA; a Intel redobra a aposta na manufatura própria com sua estratégia de foundry: as rivais agora competem em eixos diferentes da mesma lei da física.", sourceNote: "Valor do negócio segundo o registro público no fechamento." },
      ],
      // Products: names verbatim (descriptor words localised), descriptions translated.
      products: [
        { name: "Linha x86 da Intel (8086 a Core e Xeon)", what: "A família de processadores que definiu a computação pessoal e de servidores: o silício padrão de toda empresa em que os leitores deste site trabalham." },
        { name: "AMD Athlon, Opteron, Ryzen, EPYC", what: "A linha desafiante e, com o AMD64, a autoria do conjunto de instruções de 64 bits que as duas empresas hoje entregam." },
        { name: "Lei de Moore", what: "Não um produto, mas o documento de planejamento do setor: a observação de 1965 que ditou o ritmo sobre o qual corre a curva de preço e desempenho de todo dispositivo de rede." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "O microprocessador como commodity", detail: "A Intel transformou a CPU de um gabinete num componente: a precondição para que todo appliance, firewall e load balancer destas páginas seja 'um computador fantasiado'." },
        { title: "O segundo fornecedor que virou autor", detail: "A trajetória da AMD de copista licenciada a autora do ISA (AMD64) é o melhor estudo de caso do setor sobre como o sócio menor de um duopólio mantém a plataforma inteira honesta, e de vez em quando a conduz." },
      ],
      // Markets: same number of entries as the English.
      markets: [
        "O duopólio resiste: Intel e AMD, juntas, ainda fornecem os processadores de quase todo servidor, desktop e appliance de rede; agora, com a era das GPUs testando se o centro do x86 se sustenta.",
      ],
      // Analyst: same number of entries as the English.
      analyst: [
        "Um só registro, de propósito: a história de nenhuma das duas se entende sem a outra; os preços, os litígios, as ultrapassagens alternadas e o fato estranho de que a desafiante escreveu o conjunto de instruções que a empresa estabelecida entrega.",
        "A linhagem da Fairchild importa: Shockley saiu da Bell Labs, os oito saíram da Shockley, Noyce e Sanders saíram da Fairchild; a genealogia do setor passa por pedidos de demissão.",
      ],
    },
    // Lineage note (PRIME ruling 2, 26/10/2026): what this card covers.
    lineageNote: "Duas empresas contadas como uma só história, Intel e AMD; cada uma tem seu próprio cartão aqui, com sua própria situação.",
  },
  // ---- ish: pt-BR prose for the record (facts stay in the English record) ----
  "ish": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "ISH Tecnologia - segurança com a governança junto",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Empresa brasileira de segurança que cobre GRC, planos de continuidade, privacidade e gestão de riscos.",
    intro: "A ISH Tecnologia é uma empresa brasileira de segurança e tecnologia cujo portfólio começa por governança, risco e compliance, planos de continuidade de negócios, privacidade e gestão de riscos, e não por produtos.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "A ISH Tecnologia é uma empresa de segurança do Espírito Santo, o que por si só merece nota: o mercado brasileiro de segurança se concentra fortemente em São Paulo, e uma empresa relevante construída fora do eixo principal é incomum o bastante para ser registrada.",
      "A estrutura dela separou um braço corporativo que atendia clientes empresariais privados do resto do negócio e, em janeiro de 2026, esse braço foi vendido à SPX como Vision Cybersecurity, um movimento específico e instrutivo, e não uma aquisição genérica. Uma empresa de serviços é um conjunto de relacionamentos com clientes, e esses relacionamentos podem ser divididos por segmento e vendidos separadamente da marca que os construiu.",
      "O que ficou sob o nome original continua no mercado que construiu. O episódio é uma ilustração limpa de como a consolidação de fato funciona nos serviços de segurança: em geral não empresas inteiras compradas por completo, mas bases de clientes separadas, avaliadas e transferidas.",
    ],
  },
  // ---- kaspersky: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "kaspersky": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Kaspersky",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Pesquisa de malware de nível mundial e um problema geopolítico, na mesma empresa, ambos reais.",
    intro: "A Kaspersky Lab foi fundada em Moscou em 1997 por quatro pessoas: Eugene Kaspersky, Natalya Kaspersky, Alexey De-Monderik e Vadim Bogdanov, que saíram de uma empresa chamada KAMI para continuar desenvolvendo o mecanismo antivírus que vinham construindo desde 1991. Ele se chamava AVP, de AntiViral Toolkit Pro, e foi rebatizado Kaspersky Anti-Virus depois que uma empresa americana registrou a marca AVP nos Estados Unidos.",
    // Body: 8 paragraph(s), same order as the English.
    body: [
      "O caminho de Eugene Kaspersky até a área é incomum, e é o fato mais citado sobre ele. Aos dezesseis anos, entrou na Faculdade Técnica da Escola Superior da KGB, formou-se em 1987 em engenharia matemática e serviu como engenheiro de software na inteligência militar soviética. O interesse por segurança começou de forma prosaica: em 1989, o computador do trabalho pegou o vírus Cascade, e ele escreveu um programa para removê-lo.",
      "Natalya Kaspersky construiu o negócio, e isso costuma ficar de fora. Ela assumiu a distribuição do toolkit em setembro de 1994, quando ele rendia cem ou duzentos dólares por mês. Em um ano, rendia US$ 130.000; em 1996, mais de US$ 600.000; e em 1997, mais de um milhão, o que tornou possível fundar uma empresa independente. Ela lançou a fundação da empresa em junho de 1997, foi central na escolha do nome e foi chief executive por mais de dez anos. A divisão inicial foi de 50% para Eugene, 20% para De-Monderik e para Bogdanov cada um, e 10% para Natalya.",
      "A virada veio em 1998. Um estudante taiwanês liberou o CIH, um vírus que sobrescrevia a BIOS e podia deixar uma máquina incapaz de dar boot, e nas três primeiras semanas do surto o produto da Kaspersky era o único capaz de removê-lo. Esse único fato rendeu acordos de licenciamento com empresas de antivírus no Japão, na Finlândia e na Alemanha, e a receita cresceu 280% entre 1998 e 2000, a maior parte vinda de fora da Rússia.",
      "A pesquisa é a parte desta empresa que seus críticos raramente contestam. Suas equipes publicaram sobre Stuxnet, Flame, Duqu, Red October, Equation Group e ProjectSauron, e o que importa é a quem essas operações são atribuídas. Stuxnet e Flame são amplamente atribuídos aos Estados Unidos e a Israel; o arsenal do Equation Group foi ligado à inteligência americana. Uma empresa russa construiu boa parte da sua reputação publicando análises detalhadas de operações de inteligência ocidentais, ao mesmo tempo em que publicava sobre campanhas atribuídas à Rússia. Sergey Ulasen, que trabalhava numa empresa bielorrussa depois incorporada à Kaspersky, costuma receber o crédito por ter identificado o Stuxnet primeiro.",
      "E então a outra metade, dita com franqueza. Em 13 de setembro de 2017, o Department of Homeland Security dos Estados Unidos proibiu os produtos da Kaspersky em todas as agências federais, alegando que a empresa tinha trabalhado em projetos com o Serviço Federal de Segurança da Rússia. Em outubro de 2017, reportagens alegaram que hackers do governo russo tinham obtido material sigiloso do computador doméstico de um terceirizado que rodava o software. Em 20 de junho de 2024, o Departamento de Comércio dos Estados Unidos foi além e proibiu a venda e o uso do software no país, e o Tesouro sancionou a liderança da empresa. O escritório federal de segurança da Alemanha tinha feito um alerta contra ele em março de 2022, e o Reino Unido e a Austrália impuseram restrições próprias.",
      "A empresa negou de forma consistente qualquer ligação com serviços de inteligência, descrevendo as alegações como especulação sem provas, e ofereceu auditorias de código-fonte por terceiros e centros de transparência numa tentativa de respondê-las. Essas medidas não mudaram a posição de nenhum governo.",
      "Isso não está resolvido, porque o registro público não resolve. O que se pode dizer é mais estreito e mais útil: um produto de segurança exige mais confiança do que quase qualquer outro software, porque roda com os privilégios mais altos, vê tudo o que há na máquina e se atualiza continuamente a partir do fabricante. Os registros da SolarWinds e da CrowdStrike nesta linha do tempo mostram o que acontece quando essa confiança é traída por acidente e por ataque. Um governo que raciocina sobre um fabricante sujeito a um sistema jurídico estrangeiro está raciocinando sobre a mesma propriedade, e pode chegar a uma conclusão restritiva sem que nenhuma irregularidade específica tenha sido provada.",
      "Esse é o ponto de fato instrutivo aqui, e vale muito além de uma empresa. A jurisdição faz parte do modelo de ameaças de um produto. Onde os engenheiros de um fabricante podem ser legalmente obrigados, e por quem, é uma propriedade de segurança do software, e ela não aparece em nenhuma comparação de recursos.",
    ],
    // Profile: complete copy of profiles/kaspersky.ts; years, companies, founders and personal markers untouched.
    profile: {
      // Same slug as the English profile.
      slug: "kaspersky",
      // Founding stories: place (geography localised) and story translated; company, year and founders verbatim.
      foundings: [
        {
          company: "Kaspersky Lab",
          year: 1997,
          place: "Moscou, Rússia",
          founders: ["Eugene Kaspersky", "Natalya Kaspersky", "Alexey De-Monderik", "Vadim Bogdanov"],
          story: "Quatro pessoas saíram de uma empresa chamada KAMI para continuar desenvolvendo um toolkit antivírus que tinha sido um projeto paralelo. Natalya Kaspersky tinha assumido a distribuição dele em 1994 e cuidou do lado de negócios nos primeiros quinze anos da empresa, o que costuma ficar de fora dos relatos que a tratam como empresa de um homem só.",
        },
      ],
      // Timeline: same order and years as the English; prose translated.
      timeline: [
        { year: 1997, title: "Fundada em Moscou", detail: "Por quatro pessoas, em torno de um mecanismo antivírus que já existia." },
        { year: 1998, title: "CIH", detail: "Um vírus que sobrescrevia a BIOS e podia deixar uma máquina incapaz de iniciar. Lidar bem com ele firmou a reputação da empresa fora da Rússia." },
        { year: 2010, title: "A análise do Stuxnet", detail: "O início de uma década de pesquisa sobre malware construído por Estados, Flame, Duqu, Red October e outros, publicada em detalhe independentemente de quem fosse implicado." },
        { year: 2017, title: "Agências federais dos Estados Unidos", detail: "Em 13 de setembro, o Department of Homeland Security determinou que as agências federais removessem os produtos. O alcance eram os sistemas do governo." },
        { year: 2024, title: "A proibição comercial", detail: "Em 20 de junho, o Departamento de Comércio proibiu as vendas a pessoas dos Estados Unidos em geral. As vendas novas pararam depois de 20 de julho, e as atualizações de assinaturas e de software foram cortadas depois de 29 de setembro, o que acaba com a utilidade de um produto de segurança muito mais completamente do que uma proibição de vendas, já que um mecanismo antivírus sem atualizações se degrada a partir do dia em que elas param.", sourceNote: "Datas segundo a determinação do Departamento de Comércio, conforme noticiada pela imprensa do setor; o efeito sobre as atualizações é o que distingue esta medida da de 2017." },
      ],
      // Products: descriptor words localised, descriptions translated.
      products: [
        { name: "Antivírus para endpoint e consumidor", what: "O negócio original, ainda o maior, vendido a consumidores e empresas nos mercados em que continua disponível." },
        { name: "Kaspersky EDR e XDR", what: "Detecção e resposta construídas sobre o mesmo mecanismo, seguindo a mesma mudança de categoria que todo fabricante de endpoint fez." },
        { name: "Inteligência de ameaças e relatórios de pesquisa", what: "Análises publicadas de campanhas direcionadas, e o resultado mais citado por quem discorda da empresa em todo o resto." },
        { name: "Segurança de sistemas de controle industrial", what: "Uma linha de produtos à parte para tecnologia operacional, e uma área em que a pesquisa dela tem sido substancial." },
        { name: "KasperskyOS", what: "Um sistema operacional de microkernel construído para uso embarcado e industrial, com o argumento de que proteger um sistema operacional de uso geral depois do fato é o ponto de partida errado." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "Publicar sobre malware estatal, seja qual for a origem", detail: "Suas equipes documentaram campanhas atribuídas a vários governos, e o trabalho técnico raramente é contestado, mesmo pelos críticos. Pesquisa que constrange alguém poderoso é o tipo cuja independência é mais difícil de sustentar." },
        { title: "Construir um sistema operacional em vez de defender um", detail: "Um microkernel projetado para que operações não autorizadas sejam estruturalmente impossíveis, e não detectadas, é uma aposta incomum para uma empresa de antivírus, e o raciocínio, de que acoplar segurança a posteriori a um sistema de uso geral tem limites, é sólido, seja qual for a conclusão sobre o fabricante." },
        { title: "Centros de transparência e revisão de código", detail: "Transferir o processamento de dados para a Suíça e oferecer inspeção do código-fonte são as respostas disponíveis a um fabricante cujo problema é confiança, e não capacidade. Se elas conseguem resolver uma preocupação jurisdicional é exatamente a questão em aberto." },
      ],
      // Markets: same number of entries as the English.
      markets: [
        "Segurança para consumidores e empresas na Europa, na Ásia, na América Latina, na África e no Oriente Médio. O mercado dos Estados Unidos está fechado para ela; vários outros governos impuseram restrições mais estreitas ao uso no setor público.",
        "Sua posição comercial hoje é moldada menos pela concorrência de produtos do que por onde ela tem permissão para vender, uma restrição incomum para uma empresa de software e o motivo pelo qual o registro acima trata a jurisdição como parte de um modelo de ameaças, e não como política.",
      ],
      // Analyst: same number of entries as the English.
      analyst: [
        "Os testes independentes de detecção puseram seu mecanismo no topo ou perto do topo de forma consistente ao longo de duas décadas, e esse histórico não é seriamente contestado.",
        "A cobertura formal de analistas nos mercados ocidentais ficou complicada pelas restrições, e não pelas avaliações, uma distinção que vale manter: um produto pode ser excluído de um mercado por razões que nada têm a ver com quão bem ele funciona.",
      ],
    },
  },
  // ---- mcafee-fireeye-trellix: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "mcafee-fireeye-trellix": {
    // Title: companies verbatim, subtitle translated (the " - " separator is structural).
    name: "McAfee, FireEye & Mandiant - o caminho até a Trellix",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Três pioneiras da segurança, uma remontagem de private equity: Trellix e Skyhigh sob a STG, Mandiant dentro do Google Cloud, McAfee consumidor de capital fechado.",
    intro: "Três histórias de fundação, a McAfee e o antivírus comercial (1987), a FireEye e a detonação em máquina virtual (2004), a Mandiant e a resposta a incidentes como disciplina (2004), colidiram em 2021-2022. A Symphony Technology Group separou a McAfee Enterprise (US$ 4,0 bi) e os produtos da FireEye junto com o nome FireEye (US$ 1,2 bi), fundiu-os na Trellix e desmembrou o portfólio de SSE como Skyhigh Security; a empresa remanescente passou a se chamar Mandiant e entrou para o Google Cloud; o negócio de consumo da McAfee fechou o capital por mais de US$ 14 bilhões.",
    // The English body is empty, so the overlay carries none.
    // Accuracy note: the Red Education sentence keeps its exact claim and first person.
    note: "Nem eu nem a Red Education ministramos treinamento de McAfee, Trellix, FireEye ou Mandiant. Esta página é história corporativa, verificada em documentos da SEC e fontes primárias. A minha ligação vem do lado da distribuição: FireEye na Westcon-Comstor e, depois, McAfee na Network1/ScanSource; dois empregadores, em sequência.",
    // Profile: complete copy of profiles/mcafee-fireeye-trellix.ts; years, companies, founders, personal markers and href untouched.
    profile: {
      // Same slug as the English profile.
      slug: "mcafee-fireeye-trellix",
      // Founding stories: place (geography localised) and story translated; company, year and founders verbatim.
      foundings: [
        {
          company: "McAfee Associates",
          year: 1987,
          place: "Santa Clara, Califórnia",
          founders: ["John McAfee"],
          story: "Uma das primeiras empresas comerciais de antivírus, construída sobre um modelo de distribuição shareware então radical: deixar o software se espalhar e cobrar das empresas. John McAfee deixou o cargo de CEO em 1993 e saiu da empresa em 1994; o negócio se fundiu com a Network General (junto com a PGP e a Helix Software) para formar a Network Associates em 1997, e retomou o nome McAfee em 2004. A marca sobreviveu por décadas ao envolvimento do fundador.",
        },
        {
          company: "FireEye",
          year: 2004,
          place: "Milpitas, Califórnia",
          founders: ["Ashar Aziz"],
          story: "Fundada por um ex-engenheiro da Sun Microsystems a partir de uma ideia simples e cara: detonar o tráfego suspeito dentro de máquinas virtuais antes que ele chegue à rede. O mecanismo MVX foi lançado como o primeiro produto comercial da FireEye em 2010 e, depois do IPO de setembro de 2013, a empresa virou o nome para o qual as empresas ligavam quando suspeitavam que um Estado-nação já estava dentro.",
        },
        {
          company: "Mandiant",
          year: 2004,
          place: "Alexandria, Virgínia",
          founders: ["Kevin Mandia"],
          story: "Um ex-oficial da Força Aérea dos Estados Unidos fundou a empresa como Red Cliff Consulting em 2004 e a rebatizou Mandiant em 2006, transformando a resposta a incidentes numa disciplina: a equipe para quem se liga quando algo já deu muito errado. O relatório APT1, de fevereiro de 2013, rastreou a espionagem contra mais de 141 organizações até a Unidade 61398 do ELP, no distrito de Pudong, em Xangai: um marco na atribuição pública. A Mandiant depois liderou as respostas aos casos SolarWinds (2020) e Colonial Pipeline (2021).",
        },
      ],
      // Timeline: same order and years as the English (the personal event stays last and marked); prose translated.
      timeline: [
        { year: 1987, title: "Fundada a McAfee Associates", detail: "John McAfee abre uma das primeiras empresas comerciais de antivírus, distribuindo o VirusScan no estilo shareware." },
        { year: 1994, title: "John McAfee sai", detail: "O fundador deixou o cargo de CEO em 1993, passou a CTO e saiu de vez em 1994; a marca seguiu sem ele." },
        { year: 1997, title: "Nasce a Network Associates", detail: "A McAfee Associates se funde com a Network General, junto com a PGP e a Helix Software: segurança de endpoint e de rede sob o mesmo teto." },
        { year: 2004, title: "Três histórias se alinham", detail: "A Network Associates vende a Magic e a Sniffer e retoma o nome McAfee. No mesmo ano, Ashar Aziz funda a FireEye em Milpitas e Kevin Mandia funda a Red Cliff Consulting na Virgínia (rebatizada Mandiant em 2006)." },
        { year: 2010, title: "A Intel faz oferta pela McAfee; a FireEye lança produto", detail: "Em 19 de agosto de 2010, a Intel anuncia a aquisição da McAfee a US$ 48 por ação, por US$ 7,68 bilhões. A linha de produtos da FireEye baseada no MVX chega ao mercado no mesmo ano." },
        { year: 2011, title: "A Intel conclui; a era da segurança no chip", detail: "A aquisição é concluída em fevereiro de 2011; a partir de janeiro de 2014, a marca vira Intel Security, um experimento de embutir segurança no silício que nunca chegou a encontrar sua sinergia." },
        { year: 2013, title: "APT1, o IPO da FireEye e uma união de US$ 1 bi", detail: "Fevereiro: o relatório APT1 da Mandiant aponta a Unidade 61398 do ELP. Setembro: IPO da FireEye. 30 de dezembro: a FireEye conclui a aquisição da Mandiant por mais de US$ 1 bilhão (cerca de US$ 900 milhões em ações e cerca de US$ 106,5 milhões em dinheiro); a tecnologia de detecção encontra os principais especialistas em resposta do setor." },
        { year: 2017, title: "A McAfee volta a se separar", detail: "A joint venture da Intel com a TPG é concluída em 3 de abril de 2017: a TPG fica com 51%, a Intel mantém 49%, e o nome McAfee volta, com avaliação de cerca de US$ 4,2 bilhões." },
        { year: 2020, title: "Segundo IPO; SolarWinds", detail: "A McAfee volta à NASDAQ em outubro de 2020 a US$ 20 por ação (avaliação de cerca de US$ 8,6 bi). Em dezembro, a Mandiant lidera a investigação do comprometimento da cadeia de suprimentos da SolarWinds." },
        { year: 2021, title: "Os carve-outs da STG", detail: "A Symphony Technology Group compra a McAfee Enterprise por US$ 4,0 bilhões (anunciado em 8 de março, concluído em julho) e o negócio de produtos da FireEye, incluindo o nome FireEye, por US$ 1,2 bilhão (anunciado em junho, concluído em outubro). A empresa remanescente passa a se chamar Mandiant.", sourceNote: "Comunicado de imprensa da Trellix; CyberScoop; Dark Reading." },
        { year: 2022, title: "A remontagem se completa", detail: "19 de janeiro: a STG lança a Trellix, McAfee Enterprise mais FireEye, uma empresa de XDR com cerca de 40.000 clientes, cerca de 5.000 funcionários e quase US$ 2 bi de receita, liderada por Bryan Palma. Março: o portfólio de SSE é desmembrado como Skyhigh Security, e um grupo liderado por Advent e Permira fecha o capital do negócio de consumo da McAfee por mais de US$ 14 bilhões (concluído em 1º de março). 12 de setembro: o Google conclui a aquisição da Mandiant.", sourceNote: "Anunciada a US$ 5,4 bi; o 10-K da Alphabet registra um preço de compra total de US$ 6,1 bi, incluindo caixa e dívida: a segunda maior aquisição do Google, depois da Motorola Mobility." },
        { year: 2024, title: "Mandia se afasta", detail: "Kevin Mandia passa a um papel de consultor no Google em 31 de maio de 2024, duas décadas depois de fundar a empresa." },
        { year: 2025, title: "A Trellix troca de comando", detail: "A STG nomeia Vishal Rao CEO da Trellix em janeiro de 2025." },
        { year: 2015, personal: true, title: "O meu capítulo: o lado da distribuição", detail: "De 2015 a 2018: a FireEye fazia parte do portfólio que eu levava na Westcon-Comstor no Brasil. De 2018 a 2019: a McAfee fazia parte do portfólio na Network1/ScanSource, ao lado da Ixia e da Pulse Secure. As duas linhas pertencem a dois empregadores diferentes e não devem ser lidas como um único período: arquitetura de pré-venda, demonstrações e capacitação de canal nas duas, em sequência, e não juntas. A página da carreira em distribuição conta a história." },
      ],
      // Products: names verbatim (descriptor words localised), descriptions translated.
      products: [
        { name: "VirusScan e ePolicy Orchestrator (ePO)", what: "A suíte de endpoint e o console de gerenciamento que administraram uma geração de endpoints corporativos; o modelo de política centralizada do ePO virou o molde da categoria." },
        { name: "Appliances FireEye MVX", what: "Detonação na rede e no e-mail: objetos suspeitos executados em máquinas virtuais instrumentadas antes da entrega; o sandbox que definiu a detecção de APT." },
        { name: "Resposta a incidentes e inteligência de ameaças da Mandiant", what: "Resposta a violações, perícia forense e inteligência sobre adversários; hoje Mandiant Consulting e Google Threat Intelligence dentro do Google Cloud." },
        { name: "Plataforma Trellix XDR", what: "O portfólio fundido, a análise do FireEye Helix mais o endpoint McAfee ENS, construído para ingerir mais de 600 tecnologias de segurança nativas e abertas." },
        { name: "Skyhigh Security SSE", what: "O portfólio de borda da McAfee Enterprise relançado: secure web gateway, CASB, ZTNA, DLP em nuvem, isolamento remoto de navegador, firewall em nuvem e CNAPP." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "Antivírus comercial em escala", detail: "A McAfee provou que o software de segurança podia se espalhar como as ameaças que combatia: a distribuição shareware construiu a base instalada, e as empresas pagavam pelo gerenciamento." },
        { title: "Gerenciamento centralizado de endpoints", detail: "O ePolicy Orchestrator tornou milhares de endpoints administráveis a partir de um só console, definindo como a segurança de endpoints corporativos é operada." },
        { title: "Detonação em máquina virtual", detail: "O mecanismo MVX da FireEye analisava malware deixando-o rodar numa VM controlada, pegando o que as assinaturas não pegavam." },
        { title: "Atribuição pública de APT", detail: "O relatório APT1 da Mandiant apontou uma unidade militar chinesa específica com provas publicadas, mudando o que a inteligência de ameaças do setor privado podia dizer em voz alta." },
        { title: "Resposta a incidentes como setor", detail: "A Mandiant transformou 'para quem você liga depois da violação' numa categoria de produto e, por fim, numa aquisição de US$ 6,1 bi pelo Google." },
      ],
      // Markets: same number of entries as the English.
      markets: [
        "A linhagem hoje abrange quatro donos e quatro mercados: a Trellix (STG) vende XDR e segurança de endpoint a empresas, lançada com cerca de 40.000 clientes e quase US$ 2 bilhões de receita; a Skyhigh Security (STG) leva o portfólio de SSE; a Mandiant opera dentro do Google Cloud como seu braço de inteligência de ameaças e resposta a incidentes; e o negócio de consumo da McAfee protege usuários domésticos como empresa de capital fechado, sob um grupo liderado por Advent e Permira.",
        "A minha ligação com esta linhagem vem do lado da distribuição: FireEye nos anos de Westcon-Comstor, McAfee nos anos de Network1/ScanSource que vieram depois.",
      ],
      // Analyst: same number of entries as the English.
      analyst: [
        "No lançamento, em janeiro de 2022, a Trellix reunia cerca de 40.000 clientes, 5.000 funcionários e quase US$ 2 bilhões de receita: de imediato, uma das maiores fabricantes de segurança corporativa pure-play.",
        "A compra da Mandiant pelo Google foi concluída como a segunda maior aquisição da história da empresa, atrás apenas do negócio de US$ 12,5 bilhões da Motorola Mobility: uma medida do quanto a credibilidade em resposta a incidentes tinha passado a valer.",
      ],
      // Career link: label translated, href verbatim.
      careerLink: { href: "/industry/chapters/fireeye-mcafee-ixia", label: "Eu distribuí FireEye e McAfee no Brasil: veja a página da carreira" },
    },
  },
  // ---- metageek: pt-BR prose for the record (facts stay in the English record) ----
  "metageek": {
    // Title: company verbatim; the subtitle is product names, only the conjunction is translated.
    name: "MetaGeek - Wi-Spy, inSSIDer e Chanalyzer",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Um analisador de espectro de noites e fins de semana, de Boise, que virou o kit de campo do Wi-Fi e depois trocou de mãos duas vezes em dois anos.",
    intro: "A MetaGeek nasceu no verão de 2005, nas palavras do fundador Ryan Woodings, como um projeto paralelo de noites e fins de semana em Boise, Idaho. Pouco depois de lançar o primeiro Wi-Spy, ele largou o emprego e tocou a empresa de um escritório em casa e da sala de estar por um ano, antes de alugar espaço numa incubadora de tecnologia local; em 2010, o inSSIDer e o Wi-Spy DBx, para análise de espectro em 2,4 e 5 GHz, tinham firmado a MetaGeek como inovadora em ferramentas de Wi-Fi, e o Eye P.A. e o Wi-Spy Air vieram em seguida.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "Em 15 de abril de 2022, a Auvik, a empresa de gerenciamento de redes de Waterloo, Ontário, que tinha recebido US$ 250 milhões da Great Hill Partners em julho do ano anterior, adquiriu a MetaGeek em termos não divulgados. O anúncio do próprio Woodings resumiu a lógica numa linha: a oportunidade de unir a experiência da MetaGeek em Wi-Fi à experiência da Auvik em gerenciamento de redes.",
      "Dois anos e meio depois, as ferramentas mudaram de novo. Em 7 de outubro de 2024, a Oscium, fabricante de equipamentos de teste sem fio de Oklahoma City, anunciou que tinha adquirido a MetaGeek, com Bryan Lee, presidente da Oscium, à frente da empresa combinada, Brian Tuttle, cofundador da MetaGeek, voltando para liderar o desenvolvimento de software, e nenhum detalhe financeiro divulgado. Wi-Spy, inSSIDer e Chanalyzer estão hoje ao lado do analisador Nomad, da própria Oscium, e metageek.com redireciona para oscium.com.",
      "O registro mantém a MetaGeek pelo que o primeiro Wi-Spy foi: análise de espectro, antes trabalho de instrumento de bancada, num dispositivo que um engenheiro de campo podia pagar. Tudo o que veio depois no ofício de site survey sem fio, o Ekahau Sidekick, o survey do TamoGraph, o Nomad, herda esse movimento do instrumento do laboratório para a mochila do notebook.",
    ],
    // Ending note and successor label (the year and the URL stay in the English record).
    endedNote: "Adquirida pela Auvik em abril de 2022, em termos não divulgados, e revendida à Oscium em outubro de 2024; as ferramentas continuam sob a Oscium, e as páginas da própria MetaGeek agora redirecionam para lá.",
    successorLabel: "Oscium, que adquiriu o negócio da MetaGeek da Auvik em outubro de 2024 e hoje hospeda suas páginas",
  },
  // ---- mobileiron: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "mobileiron": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "MobileIron",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Pioneira do gerenciamento de dispositivos móveis, hoje parte da Ivanti.",
    intro: "A MobileIron foi uma das pioneiras do gerenciamento de dispositivos móveis, construindo a plataforma que as empresas usaram primeiro para cadastrar, proteger e apagar frotas de smartphones quando eles inundaram o local de trabalho.",
    // Body: 2 paragraph(s), same order as the English (the Red Education sentence keeps its exact claim).
    body: [
      "O material didático da MobileIron continua nos catálogos regionais da Red Education para a base instalada que ainda o roda, ensinado dentro do mesmo contexto de gerenciamento unificado de endpoints em que vivem os produtos que o sucederam.",
      "Fundada em 2007 em Mountain View, a MobileIron ajudou a definir o MDM como categoria e abriu capital na NASDAQ em 2014. Em dezembro de 2020, foi adquirida pela Ivanti, junto com a Pulse Secure, e sua tecnologia continua dentro da linha de gerenciamento unificado de endpoints da Ivanti: a mesma linhagem que atravessa os fabricantes da era da carreira desta seção.",
    ],
    // Ending note and successor label (the year and the URL stay in the English record).
    endedNote: "Adquirida pela Ivanti, negócio anunciado em setembro de 2020 e concluído em 1º de dezembro, junto com a Pulse Secure.",
    successorLabel: "Ivanti, que adquiriu a MobileIron em 2020",
    // Profile: complete copy of profiles/mobileiron.ts; years, companies, founders and personal markers untouched.
    profile: {
      // Same slug as the English profile.
      slug: "mobileiron",
      // Founding stories: place (geography localised) and story translated; company, year and founders verbatim.
      foundings: [
        {
          company: "MobileIron",
          year: 2007,
          place: "Mountain View, Califórnia",
          founders: ["Ajay Mishra", "Suresh Batchu"],
          story: "A MobileIron foi fundada em 2007, o ano do iPhone, apostando que os celulares estavam prestes a virar o endpoint corporativo que ninguém gerenciava. Ajay Mishra e Suresh Batchu construíram a plataforma que deu à TI um plano de políticas para dispositivos que ela não possuía: cadastro, configuração, catálogos de apps, apagamento seletivo. Quando a onda do BYOD quebrou sobre a TI corporativa, a MobileIron era a especialista parada exatamente onde ela chegou, e o 'mobile device management' cresceu até o enterprise mobility management e o unified endpoint management, com os lançamentos da empresa marcando cada etapa.",
        },
      ],
      // Timeline: same order and years as the English; prose translated.
      timeline: [
        { year: 2007, title: "Fundada junto com o iPhone", detail: "Mishra e Batchu abrem a MobileIron quando os smartphones seguem para as empresas: o gerenciamento de dispositivos como disciplina própria, e não um apêndice das ferramentas de desktop." },
        { year: 2011, title: "A porta-bandeira do BYOD", detail: "Quando o bring-your-own-device vira política de verdade, o modelo de contêiner e apagamento seletivo da MobileIron, dados de trabalho gerenciados e dados pessoais intocados, vira a arquitetura de referência." },
        { year: 2014, title: "IPO: MOBL", detail: "A listagem na Nasdaq em junho coroa a era das especialistas em MDM, direto para a colisão com o VMware AirWatch e os gigantes de plataforma que entravam na categoria." },
        { year: 2017, title: "Do MDM ao UEM", detail: "A categoria consolida desktops, celulares e dispositivos robustos sob o gerenciamento unificado de endpoints; a MobileIron muda junto, acrescentando zero sign-on e mobile threat defense à medida que o perímetro se dissolve." },
        { year: 2020, title: "A aquisição dupla da Ivanti", detail: "28 de setembro de 2020: a Ivanti, apoiada pela Clearlake Capital e pela TA Associates, anuncia a aquisição de cerca de US$ 872 milhões (US$ 7,05 por ação, um prêmio de 27 por cento), junto com a da Pulse Secure, ambas concluídas em 1º de dezembro. A plataforma da MobileIron vira o núcleo de UEM do Ivanti Neurons.", sourceNote: "SEC 8-K, 28 de setembro de 2020; conclusão segundo os anúncios da Ivanti e da Siris, 1º de dezembro de 2020." },
      ],
      // Products: names verbatim, descriptions translated.
      products: [
        { name: "MobileIron UEM (hoje Ivanti Neurons for UEM)", what: "A plataforma de gerenciamento unificado de endpoints: cadastro, políticas, apps e compliance, dos celulares aos desktops." },
        { name: "MobileIron Access / zero sign-on", what: "A virada para o lado da identidade: acesso condicional e autenticação sem senha ancorados no dispositivo gerenciado." },
        { name: "Mobile Threat Defense", what: "Detecção de ameaças no próprio dispositivo incorporada ao plano de gerenciamento: segurança e gerenciamento como um só agente." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "O celular como endpoint gerenciado", detail: "A MobileIron ajudou a definir o próprio MDM: o ciclo de cadastro, política e apagamento que tornou os dados corporativos em dispositivos pessoais toleráveis para as equipes de segurança." },
        { title: "A confiança no dispositivo como sinal de identidade", detail: "O zero sign-on inverteu o modelo: o dispositivo gerenciado vira a credencial, uma forma precoce, já entregue em produto, do que o setor hoje chama de zero trust vinculado ao dispositivo." },
      ],
      // Markets: same number of entries as the English.
      markets: [
        "A tecnologia da MobileIron hoje serve dentro do portfólio de UEM e segurança da Ivanti, gerenciando parques de endpoints de empresas no mundo todo: a herança de especialista levada para um fabricante de plataforma consolidada, contra o Microsoft Intune e a pilha sucessora da VMware.",
      ],
      // Analyst: same number of entries as the English.
      analyst: [
        "Líder nas avaliações de analistas de MDM, EMM e UEM ao longo de toda a história de nomes da categoria: a régua das especialistas até a consolidação absorver o campo.",
      ],
    },
  },
  // ---- mude: pt-BR prose for the record (facts stay in the English record) ----
  "mude": {
    // Title: company verbatim, subtitle translated; the operation's name takes its Portuguese spelling.
    name: "Mude - a distribuidora no centro da Operação Persona",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Importadora brasileira de equipamentos Cisco investigada a partir de 2007 num caso federal de fraude no comércio exterior.",
    intro: "A Mude Comercio e Servicos Ltda era a importadora brasileira de equipamentos Cisco no centro da Operação Persona, uma ação conjunta do Ministério Público Federal, da Polícia Federal e do fisco deflagrada em 16 de outubro de 2007. Este registro relata o que as fontes citadas relatam e não vai além delas.",
    // Body: 8 paragraph(s), same order as the English. The last English paragraph ends mid-sentence; mirrored (see NOTES).
    body: [
      "O mecanismo alegado, como descrito pelo Ministério Público, merece ser entendido porque é uma estrutura de distribuição, e não de invasão. As mercadorias iam do fabricante nos Estados Unidos ao verdadeiro importador no Brasil por meio de uma cadeia de empresas de fachada, controladas por laranjas e por entidades offshore no Panamá, nas Bahamas e nas Ilhas Virgens Britânicas, que simulavam compras e revendas entre si. Isso ocultava tanto o verdadeiro destinatário quanto o preço efetivamente pago, e o subfaturamento é o que reduzia o imposto devido na importação.",
      "A operação em si foi grande. Seiscentos e cinquenta agentes, quarenta e quatro mandados de prisão e noventa e três mandados de busca em três estados num único dia.",
      "O desfecho precisa ser dito com precisão, porque um caso não é uma sentença, e uma sentença de primeira instância não é o fim. Em fevereiro de 2011, um juiz federal condenou seis diretores e executivos da empresa a cinco anos e dois meses por contrabando ou descaminho e por associação criminosa, e os absolveu da acusação de uso de documentos falsos. Outros seis réus foram absolvidos de todas as acusações, entre eles um ex-executivo da Cisco, um dos sócios da empresa, seu advogado e três funcionários. O Ministério Público recorreu das absolvições. Uma ação separada por lavagem de dinheiro veio em 2016.",
      "Os valores noticiados diferem entre as fontes, e nenhum número único é afirmado aqui. O cálculo do fisco para o imposto não pago aparece como R$ 1,5 bilhão no próprio comunicado do Ministério Público e como R$ 3,4 bilhões incluindo multas em outras reportagens; a sentença situou as importações fraudulentas acima de US$ 370 milhões, enquanto declarações da polícia na época falavam em US$ 500 milhões declarados. As referências judiciais também variam entre a quarta e a quinta varas federais de São Paulo.",
      "Está nesta linha do tempo por um motivo. Boa parte dos equipamentos que construíram as redes brasileiras chegou por meio de importadores, e o modo como chegou era uma questão comercial com consequências jurídicas que a literatura técnica nunca discute. Este é o caso em que isso virou assunto de registro público.",
      "A razão social era Mude Comercio e Servicos Ltda, uma distribuidora de produtos de TI com filial nos Estados Unidos. Os equipamentos saíam da Flórida e a maior parte era encaminhada para a Bahia, onde a lei estadual oferecia incentivos a empresas de tecnologia: um destino escolhido pelo tratamento tributário, e não pelos clientes.",
      "A Operação Persona foi deflagrada em 16 de outubro de 2007 pela Polícia Federal, pelo fisco e pelo Ministério Público Federal. Resultou em 44 mandados de prisão em São Paulo, Salvador, Campinas, Rio, Ilhéus e Santos, dos quais 40 foram cumpridos em um dia. O imposto não pago alegado era de cerca de 1,5 bilhão de reais; as importações fraudulentas foram depois estimadas em mais de 370 milhões de dólares, em dezesseis operações identificadas. Três auditores fiscais foram depois demitidos por envolvimento.",
      "O mecanismo era a interposição de empresas: uma cadeia de intermediários no Brasil e nos Estados Unidos cuja função era ocultar quem de fato importava. É isso que deu nome à operação: persona é uma máscara.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "A Operação Persona foi deflagrada em 16 de outubro de 2007. A empresa não opera; esta linha do tempo a registra por causa do caso, e não apesar dele.",
  },
  // ---- neosecure: pt-BR prose for the record (facts stay in the English record) ----
  "neosecure": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "NeoSecure - a metade chilena",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Empresa chilena de segurança, líder no mercado de origem, absorvida pela SEK.",
    intro: "A NeoSecure era a principal empresa de segurança da informação do Chile, com operações na Argentina, na Colômbia, no Peru e no Brasil. Passou do The Rohatyn Group para a Patria Investimentos em julho de 2021 e foi fundida com a Proteus para formar a SEK em 2023.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "A trajetória dela é uma descrição compacta de como uma empresa latino-americana de tecnologia cresce: liderar um mercado nacional, estender-se aos vizinhos e passar de projetos a serviços recorrentes, o que torna o negócio valioso para um comprador, porque receita recorrente é o que se consegue modelar.",
      "É também a segunda empresa chilena nesta linha do tempo a acabar dona de operações brasileiras de segurança, ou fundida com elas, depois da NovaRed. O mercado regional se move nos dois sentidos, e raramente aparece nos relatos escritos de fora dele.",
      "Fundada no Chile em 1999, ela foi adquirida junto com a Proteus em 2021 por um fundo de investimento que montava o que descreveu como a maior plataforma especializada em segurança da informação da América Latina, abrangendo Brasil, Chile, Argentina, Peru e Colômbia. O padrão é o que esta linha do tempo registra repetidas vezes nos anos 2020: especialistas nacionais com vinte anos de estrada, combinados num grupo regional pelo capital, e não por uma fusão entre iguais.",
    ],
  },
  // ---- nozomi-networks: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "nozomi-networks": {
    // Parent note (official.parent.note), added 26/10/2026 with the parents apply; name, slug and year stay English facts.
    parentNote: "Opera de forma independente como subsidiária integral da Mitsubishi Electric, que concluiu a aquisição em 28 de janeiro de 2026.",
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Nozomi Networks",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Construída sobre a restrição de que não se pode fazer scan de uma rede industrial sem pôr a planta em risco.",
    intro: "Andrea Carcano e Moreno Carullo fundaram a Nozomi Networks na Suíça em 2013, com operações europeias em Mendrisio e, mais tarde, sede em San Francisco. Carcano tinha feito engenharia de segurança na Eni, a empresa italiana de energia, e pesquisa para a Comissão Europeia, e tinha publicado trabalhos acadêmicos, entre eles uma descrição dos primeiros malwares voltados a sistemas SCADA. Carullo é doutor em inteligência artificial e integrou o IEC TC57 WG15, o subcomitê que escreve normas de segurança para comunicações de sistemas de energia. Juntos, eles somam exatamente o par de formações de que o problema precisava.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "Vale enunciar primeiro a restrição que define toda esta categoria, porque ela explica o produto. Na segurança de TI comum, você descobre o que há numa rede fazendo um scan: envia tráfego a um dispositivo e lê o que volta. Numa rede de controle industrial, isso não é possível. Um controlador lógico programável que roda uma linha de produção pode ter vinte anos, pode ter uma pilha de rede anterior à própria ideia de entrada hostil e pode cair com um pacote inesperado. O scan que inventaria seu escritório com segurança pode parar uma planta.",
      "Por isso, a segurança de OT teve de ser construída ao contrário: de forma passiva. Você observa o tráfego que já está passando, deduz dele quais dispositivos existem, o que são, o que normalmente dizem uns aos outros, e então percebe quando isso muda. O produto principal se chamava SCADAguardian, e a técnica é a análise comportamental de rede aplicada a um lugar onde o comportamento é excepcionalmente previsível, a única vantagem das redes industriais. Uma rede de escritório é um caos; uma linha de engarrafamento faz mais ou menos a mesma coisa todo dia, então uma anomalia de fato significa algo.",
      "Os fundadores a dirigiram pessoalmente até por volta de 2016, quando recrutaram Edgard Capdevielle para construir uma organização comercial enquanto eles se concentravam no produto. Esse arranjo durou uma década, durante a qual a empresa passou de US$ 100 milhões em receita recorrente anual e, segundo o próprio relato, se tornou a primeira empresa de segurança de OT de capital fechado a atingir equilíbrio sustentado de fluxo de caixa. Consta que sua plataforma roda em cinco das dez maiores empresas de petróleo e gás, em sete das dez maiores fabricantes farmacêuticas e em sete das dez maiores concessionárias de serviços públicos.",
      "Depois, a questão do controle. A Mitsubishi Electric, que já tinha 7,0% da empresa, fechou acordo em 9 de setembro de 2025 para comprar os 93,0% restantes por US$ 883 milhões (negócio noticiado em outros lugares como de cerca de US$ 1 bilhão) e concluiu a aquisição em 2026, e em 28 de julho de 2026 Carcano voltou como chief executive, com Capdevielle passando a um papel de consultor. A empresa afirma que continua operando de forma independente e que sua abordagem neutra em relação a fabricantes não foi afetada.",
      "Essa afirmação merece atenção, e não aceitação, e esta linha do tempo é o lugar certo para dizer por quê. A Mitsubishi Electric fabrica equipamentos de automação industrial. O produto da Nozomi monitora equipamentos de automação industrial, incluindo, necessariamente, os do seu novo dono. Os investidores estratégicos na cap table antes da aquisição já tinham o mesmo perfil: Honeywell, Schneider Electric e Johnson Controls, todos fabricantes dos próprios equipamentos que estão sendo vigiados.",
      "A mesma pergunta atravessa várias empresas desse tipo. As certificações da CompTIA valem porque não pertencem a nenhum fabricante, e se isso sobrevive ao private equity é questão em aberto. O conselho da Kyndryl passou a valer mais no momento em que a IBM deixou de ser dona dela, porque o braço de serviços de um fornecedor de nuvem não consegue recomendar com credibilidade a nuvem de um concorrente. A Equinix construiu um negócio inteiro sendo uma locadora sem rede própria. A Nozomi é o caso em andamento: uma empresa de monitoramento controlada por um fabricante das coisas que ela monitora, afirmando que isso não muda nada. Pode muito bem estar certa. O ponto é que a afirmação é o que se deve observar, e a resposta chega ao longo dos anos, em saber se as constatações dela sobre os equipamentos de um fabricante soam iguais às constatações sobre os de outro.",
    ],
    // Profile: complete copy of profiles/nozomi-networks.ts; years, companies, founders and personal markers untouched.
    profile: {
      // Same slug as the English profile.
      slug: "nozomi-networks",
      // Founding stories: place (geography localised) and story translated; company, year and founders verbatim.
      foundings: [
        {
          company: "Nozomi Networks",
          year: 2013,
          place: "Suíça",
          founders: ["Andrea Carcano", "Moreno Carullo"],
          story: "Duas pessoas com metades exatamente complementares do problema: uma com engenharia de segurança industrial numa empresa de energia e pesquisa publicada sobre malware de SCADA, a outra com doutorado em inteligência artificial e uma cadeira no comitê que escreve normas de segurança para comunicações de sistemas de energia. A segurança industrial precisa de alguém que entenda de plantas e de alguém que entenda de detecção de anomalias, e é raro ter os dois na mesma sala desde o começo.",
        },
      ],
      // Timeline: same order and years as the English; prose translated.
      timeline: [
        { year: 2013, title: "Fundada na Suíça", detail: "Com operações europeias em Mendrisio e, mais tarde, sede em San Francisco." },
        { year: 2016, title: "Uma organização comercial", detail: "Edgard Capdevielle é trazido para construir o go-to-market enquanto os fundadores ficam no produto; um arranjo que durou cerca de uma década." },
        { year: 2024, title: "Guardian Air", detail: "Um sensor de espectro sem fio, a partir da observação de que um dispositivo pode conversar com um sistema de controle sem jamais aparecer na rede cabeada e, portanto, sem aparecer em nenhum inventário construído a partir do tráfego cabeado." },
        { year: 2025, title: "Arc, Vantage IQ e a oferta", detail: "Resposta automatizada em ambientes operacionais e um assistente de IA privado, no mesmo ano em que a Mitsubishi Electric ofereceu US$ 883 milhões pela empresa, em 9 de setembro." },
        { year: 2026, title: "Concluída, em 29 de janeiro", detail: "A empresa continua com marca própria como subsidiária independente. No mesmo período, foi nomeada Leader no Magic Quadrant do Gartner para proteção de sistemas ciberfísicos pelo segundo ano seguido, com as notas mais altas nos quatro casos de uso de capacidades críticas." },
      ],
      // Products: names verbatim, descriptions translated.
      products: [
        { name: "Guardian", what: "O sensor de rede passivo, antes SCADAguardian: lê o tráfego que já está no cabo, monta o inventário de ativos a partir do que ouve, aprende como é o normal e relata os desvios. Nada é enviado aos dispositivos." },
        { name: "Guardian Air", what: "Um sensor de espectro sem fio. Um dispositivo intruso num telhado ou num veículo nunca toca a rede cabeada, então um inventário só do cabo não consegue vê-lo; este escuta o rádio." },
        { name: "Arc", what: "Um sensor de endpoint para as máquinas que conseguem levar um, estendendo a visibilidade até onde o tráfego de rede sozinho não chega e, a partir de 2025, automatizando a resposta em ambientes onde a resposta automatizada historicamente era impensável." },
        { name: "Vantage", what: "O console em nuvem que une rede, sem fio e endpoint entre os sites: uma visão única para organizações cujas plantas estão em dezenas de países." },
        { name: "Smart Polling", what: "Consultas ativas seletivas e cuidadosamente moldadas para os casos em que escutar passivamente de fato não responde à pergunta. A parte interessante é o quão estreito é o escopo, porque toda a filosofia do produto existe para evitar justamente isto." },
        { name: "Asset and Threat Intelligence", what: "Feeds que identificam equipamentos industriais e as vulnerabilidades conhecidas deles: os dados de referência que transformam um dispositivo observado num dispositivo avaliado." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "Inventário pela escuta", detail: "Montar um registro de ativos a partir do tráfego observado, e não de consultas, é a restrição fundadora transformada em técnica. Também produz algo que um scan não produz: não só o que existe, mas com o que cada coisa normalmente conversa, a linha de base da qual todo o resto depende." },
        { title: "Estender ao espectro", detail: "Uma vez que o inventário é montado a partir do que a rede ouve, a lacuna óbvia é tudo o que se comunica sem entrar na rede. Escutar o rádio a fecha, e é a mesma lógica arquitetural aplicada uma camada para fora." },
        { title: "Automatizar a resposta onde a automação era proibida", detail: "A contenção automatizada é rotina na segurança corporativa e tem sido quase impensável em tecnologia operacional, porque a ação automática errada para a produção. Entregá-la já é uma declaração de confiança na linha de base, e é a coisa mais difícil de acertar nesta categoria de produto." },
        { title: "A previsibilidade como propriedade explorável", detail: "A vantagem das redes industriais é que elas são entediantes. Uma linha de produção faz a mesma coisa todo dia, então um desvio carrega uma informação que o mesmo desvio numa rede de escritório não carregaria. Todo o modelo de detecção se apoia nisso, e é por isso que a técnica não se transfere de forma limpa para a TI." },
      ],
      // Markets: same number of entries as the English.
      markets: [
        "Infraestrutura crítica: energia, farmacêutica, serviços públicos, manufatura, transporte; os ambientes em que a consequência de uma falha de segurança é física. A lista de parceiros inclui Schneider Electric, Hitachi Cyber e Nvidia, e o enquadramento de compliance passa pelas normas industriais, e não pelas de TI.",
        "Seus concorrentes são os outros especialistas em segurança de OT e as grandes plataformas de segurança que se estendem para baixo, até os ambientes operacionais, e seu diferencial é a profundidade em protocolos industriais, e não a amplitude na empresa como um todo.",
      ],
      // Analyst: same number of entries as the English.
      analyst: [
        "Leader no Magic Quadrant do Gartner para plataformas de proteção de CPS em 2025 e em 2026, o único fabricante apontado como Customers' Choice no Voice of the Customer correspondente, e Leader na avaliação de segurança de IoT da Forrester. Na avaliação de capacidades críticas de 2026, ficou com a nota mais alta nos quatro casos de uso, e não em um ou dois, que é a distinção que merece nota: indica uma plataforma não ajustada a um único formato de implantação.",
        "Um fato pertence ao lado da questão do controle levantada acima, porque a torna mais aguda. A Mitsubishi Electric não era uma recém-chegada: o próprio material da empresa a apontava, ao lado da Johnson Controls e da Schneider Electric, como investidora já existente antes da aquisição. A compradora já estava na cap table. Se isso torna a mudança menor ou o arranjo original maior é exatamente a questão, e não é uma que um anúncio consiga resolver.",
      ],
    },
  },
  // ---- progress-software: pt-BR prose for the record (facts stay in the English record) ----
  "progress-software": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Progress Software - a empresa dona do debugger, do load balancer e do MOVEit",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Empresa americana de software que adquiriu a Telerik, a Ipswitch e a Kemp e, em 2023, virou a origem de uma das maiores campanhas isoladas de roubo de dados já registradas.",
    intro: "A Progress Software é uma empresa americana de software de aplicações e infraestrutura cujas aquisições incluem a Telerik, criadora do proxy de depuração Fiddler, a linha de load balancers Kemp e o produto de transferência gerenciada de arquivos MOVEit.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "Progress não é um nome que a maioria dos profissionais reconheceria, e a maioria deles usa algo que pertence a ela. Por aquisição, ela detém a Telerik e, com ela, o Fiddler, o proxy de depuração com que gerações de desenvolvedores aprenderam a ler HTTP; a linha de load balancers Kemp, que tem registro próprio nesta seção; e o MOVEit, um produto de transferência gerenciada de arquivos usado por governos, bancos e hospitais para mover justamente os arquivos que eles mais precisam mover com segurança.",
      "Esse último é o motivo de a empresa estar neste catálogo. No fim de semana do Memorial Day americano de 2023, um feriado escolhido, pelo que as evidências indicam, porque é quando os defensores reagem mais devagar, o grupo CL0P explorou uma falha de SQL injection até então desconhecida na aplicação web do MOVEit Transfer, catalogada como CVE-2023-34362. A falha permitia que um atacante não autenticado alcançasse o banco de dados. O grupo instalou um web shell chamado LEMURLOOT e o usou para enumerar e exfiltrar tudo o que o servidor guardava. A Progress publicou seu alerta em 31 de maio; a exploração tinha sido observada desde 27 de maio. Uma segunda falha no mesmo código foi encontrada e corrigida dias depois.",
      "A escala noticiada é o que faz dele um marco: mais de duas mil e setecentas organizações e os dados pessoais de mais de noventa e cinco milhões de pessoas, a partir de uma única vulnerabilidade num único produto. E o detalhe crucial está no alerta do governo, e não na cobertura da imprensa: o mesmo ator tinha conduzido campanhas de zero-day contra o appliance de transferência de arquivos da Accellion em 2020 e 2021, e contra o GoAnywhere da Fortra no início de 2023. A transferência gerenciada de arquivos não foi escolhida por acaso. É a categoria em que as organizações concentram seus dados de saída mais sensíveis, em geral num servidor exposto à internet, muitas vezes operado por uma equipe que o vê como encanamento.",
      "Para um profissional, a lição é sobre a categoria, e não sobre o fabricante. Um produto cujo propósito inteiro é guardar arquivos sensíveis e ser alcançável de fora é um alvo de um tipo específico, e a pergunta a fazer sobre ele não é se o fabricante é cuidadoso, mas o que acontece quando, e não se, uma falha pré-autenticação for encontrada nele. Esse é o argumento do artigo sobre o código perfeito, e o MOVEit é a ilustração isolada mais clara dele.",
    ],
  },
  // ---- proof: pt-BR prose for the record (facts stay in the English record) ----
  "proof": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Proof - detecção gerenciada, e mais uma absorvida",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Empresa de segurança do Rio de Janeiro adquirida pela SEK em 2024.",
    intro: "A Proof era uma empresa de segurança da informação do Rio de Janeiro com mais de quinze anos de atividade, que oferecia managed detection and response ao lado de consultoria em governança, risco e compliance, e tinha construído a própria plataforma. A SEK a adquiriu em abril de 2024.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "A compradora é a parte que completa um padrão que esta linha do tempo vem registrando. A SEK, que tem registro próprio aqui, foi ela mesma montada por uma gestora de investimentos a partir da união de duas empresas de segurança existentes, a chilena NeoSecure e a brasileira Proteus, com capital para consolidar o mercado latino-americano, e já tinha comprado uma startup de segurança em nuvem antes deste negócio.",
      "Assim, a sequência para empresas brasileiras de segurança deste porte agora está bem documentada aqui a partir de três direções distintas: a Tempest para uma fabricante de aeronaves, a Cipher para uma multinacional de segurança física e a Proof para uma consolidação de private equity. A Skybox, que não era uma empresa brasileira, mostra um quarto desfecho: encerrou as operações em 24 de fevereiro de 2025, e uma concorrente, a Tufin, abriu um programa para os clientes dela. Os compradores diferem; o desfecho para uma especialista independente, não.",
    ],
  },
  // ---- promon-logicalis: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "promon-logicalis": {
    // Title: no " - " subtitle; the two company names are joined by a conjunction, translated.
    name: "Promon e Logicalis",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Uma empresa de engenharia que pertence inteiramente a quem trabalha nela, em joint venture com a subsidiária britânica de uma holding sul-africana.",
    intro: "A Promon foi fundada em São Paulo em dezembro de 1960 como uma joint venture entre a americana Procon e a brasileira Montreal Montagem e Representação Industrial, formada para entregar quatro novas unidades na refinaria Presidente Bernardes da Petrobras, em Cubatão: um projeto de um tipo nunca feito antes no Brasil. Os dois sócios originais acabaram saindo. O que ficou virou algo incomum.",
    // Body: 7 paragraph(s), same order as the English.
    body: [
      "Os únicos acionistas da Promon são os profissionais que trabalham ou trabalharam nela. Nem uma família fundadora, nem um fundo, nem ações em bolsa: as pessoas que fazem o trabalho são donas da empresa, e entram na sociedade voluntariamente. Esse modelo sobrevive desde os anos 1970, quando a Procon encerrou suas operações brasileiras e a empresa se separou da Montreal, e é reforçado por uma fundação de previdência criada em 1975 exclusivamente para quem trabalha ou trabalhou no grupo.",
      "O documento cultural que acompanha esse modelo se chama Carta de Campos do Jordão, escrita no mesmo período e ainda descrita pela empresa como um símbolo definidor. Uma empresa que pertence aos próprios funcionários precisa pôr por escrito para que existe, porque não há um proprietário para decidir.",
      "O histórico de engenharia é substancial: trabalhos em refinarias para a Petrobras a partir de 1961, uma fábrica de fertilizantes em Cubatão em 1962, depois a expansão, ao longo dos anos 1970, para energia elétrica, mineração e metais, e infraestrutura, incluindo o Metrô de São Paulo. Entre os clientes ao longo das décadas estão Vale, CESP, Light, Ford, General Motors, Volkswagen, Renault e Suzano.",
      "Em 2008, o braço de tecnologia do grupo se fundiu com as operações latino-americanas da Logicalis, criando o que então foi descrito como a maior integradora independente de TIC da América Latina. A Logicalis tinha sido fundada no Reino Unido em 1997 e se internacionalizou sob a Datatec; a joint venture opera como Logicalis em toda a região, com cerca de 3.000 funcionários em onze ou doze países latino-americanos.",
      "E é aí que um fio desta linha do tempo se fecha. A Datatec tinha três divisões: distribuição de tecnologia, como Westcon-Comstor; integração e serviços gerenciados, como Logicalis; e consultoria, como Analysys Mason. Ou seja, a distribuidora e a integradora eram irmãs sob uma mesma holding, e a Datatec informa que seu grupo detém, na prática, 68,4% do braço latino-americano da integradora, cujo sócio é uma empresa brasileira que pertence aos próprios funcionários. Duas teorias opostas sobre quem deve ser dono de uma empresa, operando como um só negócio.",
      "A Promon Engenharia foi arrastada para a Operação Lava Jato a partir de 2014, e a Petrobras a impediu de firmar novos contratos; seguiu-se um inquérito da Polícia Federal em janeiro de 2015. O negócio de engenharia e a joint venture de tecnologia são empresas separadas sob a mesma holding, e a investigação faz parte de qualquer relato da história do grupo. A situação jurídica atual deve ser conferida em registros judiciais recentes.",
      "A holding hoje se descreve como uma empresa de investimentos com dois negócios: a Promon Engenharia, integralmente controlada, e a Logicalis Latin America, a joint venture. Sessenta e cinco anos, dois sócios originais que já se foram, uma ideia de propriedade que durou mais do que eles.",
    ],
    // Profile: complete copy of profiles/promon-logicalis.ts; years and personal markers untouched.
    profile: {
      // Same slug as the English profile.
      slug: "promon-logicalis",
      // The English profile has no founding stories.
      foundings: [],
      // Timeline: same order and years as the English; prose translated.
      timeline: [
        { year: 1960, title: "O nome são os dois fundadores", detail: "PROMON vem de PROcon e MONtreal, os sócios americano e brasileiro da joint venture que ela era. Os dois acabaram saindo, e o nome ficou com eles. Sessenta e cinco anos depois, uma empresa que pertence aos próprios funcionários ainda opera sob uma palavra montada a partir de duas organizações que já não têm parte nela." },
        { year: 2008, title: "Com o que a joint venture começou", detail: "Cento e vinte milhões de dólares em ativos e duzentos e cinquenta funcionários brasileiros, com a meta declarada de dobrar a receita para quinhentos milhões em três anos. A assimetria entre os sócios merece nota: a Datatec faturava US$ 3,3 bilhões no grupo inteiro contra cerca de US$ 340 milhões da Promon, então tratava-se de uma grande multinacional se unindo a uma empresa local muito menor e pondo a gestão local no comando da região." },
        { year: 2008, title: "Trópico, e um fio até o CPqD", detail: "Entre as subsidiárias do grupo na época estava a Trópico, a linha brasileira de centrais telefônicas digitais, que planejava dobrar as vendas naquele ano. A Trópico foi desenvolvida no CPqD, o centro estatal de pesquisa em telecomunicações que aparece separadamente nesta linha do tempo, e transferida para a indústria para ser fabricada; e esta é uma das empresas que a fabricaram. O centro de pesquisa a projetou; uma empresa de engenharia paulistana pertencente aos próprios funcionários a construiu." },
      ],
      // Products: descriptor words localised (company names verbatim), descriptions translated.
      products: [
        { name: "Integração de redes e data centers", what: "Projeto, implantação e gerenciamento de infraestrutura para grandes empresas e operadoras em toda a América Latina: o negócio para o qual a joint venture foi formada." },
        { name: "Serviços gerenciados", what: "Operar o que foi construído, sob contrato. A transição que toda integradora faz, porque construir é irregular e operar não é." },
        { name: "Práticas de segurança e nuvem", what: "Vendidas junto com o trabalho de rede aos mesmos clientes, a extensão natural para uma integradora que já cuida do parque." },
        { name: "Promon Engenharia", what: "O negócio de engenharia integralmente controlado, atuando em energia, mineração, petroquímica e transporte. Não faz parte da joint venture de tecnologia, e é o objeto da investigação que o registro acima descreve." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "Alcance medido contra a economia de um continente", detail: "O grupo informa cobrir cerca de 89% do produto interno bruto da região e alcançar 98% das quinhentas maiores empresas da América Latina. São métricas incomuns de se publicar, e descrevem a posição real de uma integradora melhor do que a receita: o que importa não é quanto você vendeu, mas em quanto da economia você está dentro." },
        { title: "Gestão local da região de uma multinacional", detail: "Uma joint venture costuma significar que o sócio maior a comanda. Aqui, o negócio regional manteve a liderança brasileira e o próprio nome no mercado por anos depois. Para uma multinacional de tecnologia que entra na América Latina, comprar metade de uma empresa local estabelecida e deixá-la no comando é um caminho mais lento do que uma aquisição, e consideravelmente mais duradouro." },
        { title: "Propriedade dos funcionários encontra propriedade de acionistas", detail: "A observação com que o registro acima se encerra merece ser guardada em termos operacionais. Uma empresa cujos donos são os próprios funcionários otimiza para a continuidade, a reputação técnica e o longo prazo, porque os acionistas não podem vender a ninguém além deles mesmos. A subsidiária de uma multinacional listada em bolsa otimiza para o trimestre. Operar um só negócio sobre as duas bases é um teste de verdade, e ele já dura bem mais de uma década." },
      ],
      // Markets: same number of entries as the English.
      markets: [
        "Grandes empresas, operadoras de telecomunicações e órgãos públicos em onze países latino-americanos, com cerca de R$ 3,5 bilhões de receita bruta, cerca de três mil funcionários na região e mil e quatrocentos no Brasil. Sessenta por cento da receita vem de clientes que operam em mais de um país da região, e esse é todo o argumento a favor de uma integradora regional, e não nacional.",
        "Concorre com as integradoras globais, com os braços de serviços profissionais das próprias operadoras e com as system houses locais de cada mercado; estas últimas são as que entendem o país, mas não conseguem acompanhar um cliente através das fronteiras.",
      ],
      // Analyst: same number of entries as the English.
      analyst: [
        "Integradoras são avaliadas por certificações de fabricantes, capacidade de entrega e pela proporção de receita recorrente, e não por posições de produto. Nas medidas regionais que o grupo publica, sua cobertura entre as grandes empresas é quase completa.",
        "A pergunta duradoura é a que o arranjo de propriedade levanta. Acionistas funcionários não conseguem sair com facilidade, o que produz paciência e também produz um limite: o capital para expansão precisa vir dos lucros ou de um sócio, e a própria joint venture é a resposta a essa restrição. Se o modelo escala para além de uma região não foi testado, e o grupo não tentou.",
      ],
    },
  },
  // ---- pulse-secure: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "pulse-secure": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Pulse Secure",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Uma empresa criada para abrigar uma linha de produtos mais velha do que ela.",
    intro: "A Pulse Secure foi formada em 2014, quando a Juniper vendeu seu negócio Junos Pulse à Siris Capital. É uma fundação incomum: a empresa existia, no primeiro dia, com um produto maduro, uma base instalada e uma obrigação de suporte, e nenhuma história própria.",
    // Body: 5 paragraph(s), same order as the English.
    body: [
      "O produto era SSL VPN, que a Juniper tinha adquirido com a NetScreen em 2004, e que a NetScreen tinha construído sobre tecnologia da Neoteris. Ou seja, o código é mais de uma década mais antigo do que a empresa que o vendia, e a linhagem passa por duas aquisições antes do carve-out.",
      "O mercado que ela atendia era o comum: usuários remotos que precisavam de acesso a aplicações internas sem um túnel completo na camada de rede, autenticados na borda e recebendo só o que a política permitia. Os appliances Pulse Connect Secure ficavam nessa fronteira num número enorme de empresas e redes de governo, e esse é o detalhe que importa para o que aconteceu depois.",
      "Ser um carve-out molda uma empresa. O controle por private equity significou foco na base instalada e na receita de manutenção, e não em reinvenção, e o código carregava uma década de decisões acumuladas, tomadas dentro de dois donos anteriores.",
      "A Ivanti adquiriu a Pulse Secure no mesmo anúncio da MobileIron, com conclusão em 1º de dezembro de 2020. Vulnerabilidades graves nesses appliances de VPN foram depois exploradas em escala suficiente para motivar diretivas de emergência de agências nacionais de cibersegurança; essa é a parte desta história que mais afetou pessoas que nunca compraram nada da empresa, já que os appliances ficavam na frente de redes que importavam.",
      "É um registro útil justamente porque a falha foi estrutural, e não descuidada. Uma linha de produtos herdada através de três donos, cada um com prioridades diferentes e nenhum deles tendo escrito o código, é um tipo específico de risco, e esta linha do tempo mostra isso acontecendo repetidas vezes.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "Adquirida pela Ivanti junto com a MobileIron, negócio anunciado em setembro de 2020 e concluído em 1º de dezembro.",
    // Profile: complete copy of profiles/pulse-secure.ts; years, companies, founders and personal markers untouched.
    profile: {
      // Same slug as the English profile.
      slug: "pulse-secure",
      // Founding stories: place (geography localised) and story translated; company, year and founders verbatim.
      foundings: [
        {
          company: "Pulse Secure",
          year: 2014,
          place: "San Jose, Califórnia",
          founders: ["Carved out of Juniper Networks by Siris Capital"],
          story: "A Pulse Secure já nasceu veterana. O produto no centro dela começou como o Instant Virtual Extranet da Neoteris, o appliance que definiu a SSL VPN clientless, que a NetScreen comprou em 2003 e que a Juniper herdou junto com a própria NetScreen em 2004. Dentro da Juniper, ele virou a série SA e depois o Junos Pulse, o padrão de acesso remoto de uma era corporativa; em 2014, a Siris Capital separou o negócio por cerca de US$ 250 milhões e a Pulse Secure ficou de pé sozinha, uma família de produtos carregando a história de quatro empresas. O autor deste site a conheceu do lado da distribuição, levando a Pulse no portfólio da ScanSource, enquanto o capítulo anterior dele dentro da Juniper tinha coincidido justamente com os anos em que o Junos Pulse tomou forma.",
        },
      ],
      // Timeline: same order and years as the English (the personal event stays last and marked); prose translated.
      timeline: [
        { year: 2003, title: "A herança da Neoteris", detail: "A NetScreen adquire a Neoteris, cujo Instant Virtual Extranet definiu a SSL VPN clientless; a aquisição da NetScreen pela Juniper em 2004 traz a linha para dentro de casa: a história que a página NetScreen/Juniper conta pelo outro lado.", sourceNote: "Form 8-K da NetScreen, comunicado de imprensa de 17 de novembro de 2003: a aquisição da Neoteris foi concluída nesse dia, anunciada em 6 de outubro de 2003, por cerca de 10,9 milhões de ações da NetScreen mais US$ 20 milhões em dinheiro e até US$ 30 milhões adicionais condicionados a metas de receita, com a Neoteris chamada de líder de mercado em SSL VPN. Form 8-K da Juniper e da NetScreen, comunicado de imprensa de 16 de abril de 2004: acordo de reorganização datado de 9 de fevereiro de 2004, 1,404 ação da Juniper por ação da NetScreen, aprovado pelos acionistas das duas empresas e com conclusão prevista para aquele dia. Nenhum dos comunicados usa o nome Instant Virtual Extranet; os dois chamam os produtos de Neoteris Secure Access Appliances." },
        { year: 2014, title: "A Siris separa a Pulse Secure", detail: "A Siris Capital adquire o negócio Junos Pulse da Juniper (cerca de US$ 250 milhões, segundo a imprensa), formando a Pulse Secure LLC: a franquia de SSL VPN como empresa independente, com a startup de segurança móvel MobileSpaces comprada no mesmo ano." },
        { year: 2015, title: "Pulse One", detail: "Chega o gerenciamento central de políticas, unificando o acesso seguro de endpoints e dispositivos móveis a aplicações on-premises e na nuvem: o portfólio se ampliando para além do gateway." },
        { year: 2017, title: "Chega o fio da Zeus", detail: "A Pulse adquire o negócio de ADC virtual da Brocade, a linhagem de load balancing que começou na Zeus Technology e passou pela Riverbed como SteelApp, reunindo por pouco tempo duas linhagens de produto célebres sob um fabricante pequeno." },
        { year: 2020, title: "Para dentro da Ivanti", detail: "28 de setembro de 2020: a Ivanti anuncia a aquisição da Pulse Secure junto à Siris (termos não divulgados), junto com a MobileIron; as duas são concluídas em 1º de dezembro de 2020. O Pulse Connect Secure vira Ivanti Connect Secure: a linha de acesso remoto sob sua quinta bandeira.", sourceNote: "SEC 8-K e anúncios da Ivanti e da Siris." },
        { year: 2018, personal: true, title: "O meu capítulo", detail: "De 2018 a 2019: o Pulse Connect Secure fazia parte do meu portfólio na ScanSource; pré-venda e capacitação de parceiros num produto que eu tinha conhecido primeiro de dentro da Juniper." },
      ],
      // Products: names verbatim, descriptions translated.
      products: [
        { name: "Pulse Connect Secure", what: "O carro-chefe de SSL VPN: o gateway da linhagem Neoteris, acesso remoto para uma geração de empresas, hoje Ivanti Connect Secure." },
        { name: "Pulse Policy Secure", what: "Controle de acesso à rede a partir da mesma plataforma: postura, perfilamento e aplicação de políticas no ponto de entrada." },
        { name: "Pulse One", what: "O plano de gerenciamento central para gateways, endpoints e dispositivos móveis." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "SSL VPN clientless", detail: "O design da Neoteris herdado pela Pulse pôs o acesso remoto num navegador, sem cliente pesado e sem a cerimônia do IPsec, e definiu o modelo que as VPNs corporativas seguiram por duas décadas." },
        { title: "Um produto, cinco bandeiras", detail: "Neoteris, NetScreen, Juniper, Pulse Secure, Ivanti: a mesma linhagem de acesso seguro levada através de quatro aquisições; a cadeia de suprimentos de ideias das redes numa única família de produtos." },
      ],
      // Markets: same number of entries as the English.
      markets: [
        "O portfólio Pulse hoje é vendido como a linha de acesso seguro da Ivanti, defendendo uma enorme base instalada de VPN enquanto o centro de gravidade do mercado se desloca para o zero-trust network access: o parque estabelecido que todo fabricante de ZTNA disputa para substituir.",
      ],
      // Analyst: same number of entries as the English.
      analyst: [
        "Por anos, a referência de SSL VPN ao lado da Cisco e da F5 nas avaliações de acesso seguro: a posição que fez a franquia valer um carve-out, e valer duas aquisições.",
      ],
    },
  },
  // ---- qd7: pt-BR prose for the record (facts stay in the English record) ----
  "qd7": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "QD7 - a regulação é a porta de entrada",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Consultoria de cibersegurança de São Paulo que combina monitoramento, resposta a incidentes e treinamento de conscientização com trabalho de LGPD.",
    intro: "A QD7 é uma empresa de cibersegurança de São Paulo que oferece consultoria, monitoramento contínuo, resposta a incidentes e treinamento de conscientização em segurança, e posiciona sua prática tanto em torno do cenário regulatório brasileiro quanto em torno da tecnologia.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "As declarações de clientes que ela mesma publica apontam para algo que esta linha do tempo ainda não tinha registrado: a lei de proteção de dados é o caminho pelo qual o trabalho de segurança chega a muitas organizações brasileiras. A conversa começa como compliance e vira um inventário, um esquema de monitoramento e um plano de resposta a incidentes. É uma origem menos satisfatória do que uma invasão, e consideravelmente melhor, porque o trabalho acontece antes, e não depois.",
      "O treinamento de conscientização aparece na mesma lista de serviços que o monitoramento e a resposta a incidentes, que é o lugar honesto para ele. A maioria dos incidentes começa com uma pessoa fazendo algo razoável no momento errado, e nenhuma quantidade de detecção muda isso; o treinamento é um controle ao lado dos controles técnicos, e não uma cortesia oferecida depois que eles foram vendidos.",
      "O posicionamento público dela também menciona criptografia pós-quântica, o que é cedo para uma consultoria deste porte e merece nota pelo que diz sobre o mercado, e não sobre a empresa: a migração está sendo discutida com empresas comuns no Brasil, e não só nos órgãos de padronização.",
    ],
  },
  // ---- qualys: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "qualys": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Qualys",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Entregou varredura de segurança como serviço em 2000, antes de alguém ter uma palavra para isso.",
    intro: "A Qualys foi fundada em 1999 por Philippe Langlois e Gilles Samoun, constituída em Delaware no fim daquele dezembro, com Langlois como chief technology officer e Samoun como chief executive. Philippe Courtot investiu em 1999 e se tornou chief executive e chairman em março de 2001, e é pela gestão dele que a empresa costuma ser lembrada. Algumas fontes descrevem Courtot como fundador; a maioria o registra como o investidor inicial que depois a dirigiu por vinte anos, e esse é o relato usado aqui.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "O QualysGuard foi lançado em 2000, e a decisão que o tornou diferente não foi o que ele varria, mas como ele chegava. Os concorrentes vendiam software que você instalava. A Qualys vendia a assinatura de um serviço, numa época em que software como serviço mal existia como expressão, e o argumento a favor era específico, e não modismo: dados de vulnerabilidade envelhecem mal. Um scanner é tão bom quanto o seu conhecimento do que procurar, e um software instalado é exatamente tão atual quanto a sua última atualização, o que na maioria das organizações não é muito. Um serviço atualizado centralmente está atualizado para todos ao mesmo tempo.",
      "É o mesmo argumento que esta linha do tempo mostra repetidas vezes, chegando pela quinta vez. A IronPort o aplicou à reputação de remetentes de e-mail em 2002, a Zscaler ao tráfego web em 2007, a Cloudflare à web em 2009, a CrowdStrike ao comportamento de endpoints em 2013. A Qualys o aplicou ao conhecimento sobre vulnerabilidades em 2000, o que a torna o caso mais antigo nesta página. A ideia de que uma plataforma operada centralmente vence o software instalado localmente porque nunca fica desatualizada foi elaborada primeiro neste segmento.",
      "E ela completa aqui um trio num eixo diferente. Tenable, Rapid7 e Qualys competem no mesmo mercado, e os outros dois registros as contrastam pelo open source: uma fechou um projeto para se financiar, a outra comprou um projeto e o manteve aberto. A Qualys difere em algo totalmente diferente: nunca entregou software para o cliente rodar. Três empresas, três estratégias, três respostas sobre o que um fabricante de segurança de fato vende.",
      "A carreira de Philippe Courtot antes da Qualys merece um parágrafo próprio. Em 1988, ele fundou a cc:Mail, levou-a a cerca de quarenta por cento do mercado de plataformas de e-mail e a vendeu à Lotus em 1991. Em 1993, tornou-se chief executive da Verity, que abriu capital em 1995. Depois, conduziu a Signio até a aquisição pela VeriSign. A Qualys foi seu quinto cargo de chief executive, e ele a dirigiu por duas décadas.",
      "Ele também dedicou esse tempo a trabalhos sem retorno comercial: ajudou a fundar a Cloud Security Alliance em 2008, criou o Trustworthy Internet Movement e o CSO Interchange e foi curador da Internet Society. Deixou o cargo em março de 2021 por motivos de saúde e morreu em 5 de junho daquele ano, aos 76 anos.",
      "A empresa abriu capital em 2012 e informou receita de US$ 669 milhões em 2025, com cerca de 2.625 funcionários. O argumento do produto foi para onde foi o de todos os fabricantes deste segmento, de encontrar tudo para ranquear o que importa, porque a restrição há muito deixou de ser a detecção e passou a ser o fato de que ninguém consegue corrigir tudo.",
    ],
    // Profile: complete copy of profiles/qualys.ts; years, companies, founders and personal markers untouched.
    profile: {
      // Same slug as the English profile.
      slug: "qualys",
      // Founding stories: place (geography localised) and story translated; company, year and founders verbatim.
      foundings: [
        {
          company: "Qualys",
          year: 1999,
          place: "Delaware, constituída; Califórnia, em operação",
          founders: ["Philippe Langlois", "Gilles Samoun"],
          story: "Constituída no fim de dezembro de 1999, com Langlois como chief technology officer e Samoun como chief executive. O QualysGuard veio em 2000, e a decisão que a distinguiu foi a entrega, e não a detecção: o scanner era um serviço que se assinava, numa época em que o software de segurança chegava num disco e morava no seu rack.",
        },
      ],
      // Timeline: same order and years as the English; prose translated.
      timeline: [
        { year: 1999, title: "Constituída", detail: "Em Delaware, nos últimos dias do ano." },
        { year: 2000, title: "QualysGuard", detail: "Varredura de vulnerabilidades entregue a partir da infraestrutura do fabricante: software como serviço antes de o termo ser de uso geral, e anos antes de alguém comprar segurança desse jeito sem discussão." },
        { year: 2008, title: "A Cloud Security Alliance", detail: "Philippe Courtot, chief executive desde 2001, esteve entre os fundadores: parte de um padrão de trabalho sem retorno comercial direto." },
        { year: 2012, title: "Listagem na NASDAQ", detail: "Listada como QLYS." },
        { year: 2025, title: "Escala", detail: "Receita de US$ 669 milhões, com cerca de 2.625 funcionários, e reconhecimento como líder tanto no quadrante do Gartner para exposure assessment quanto na avaliação de exposure management da IDC." },
      ],
      // Products: names verbatim, descriptions translated.
      products: [
        { name: "VMDR", what: "Vulnerability Management, Detection and Response: varredura, priorização e implantação de patches numa só plataforma, atrás de um único agente; o argumento da consolidação tornado concreto." },
        { name: "Qualys Cloud Agent", what: "Um agente leve que reporta continuamente, o que transforma a avaliação de algo agendado em algo ambiente." },
        { name: "TruRisk", what: "A camada de priorização, que pontua as constatações pela explorabilidade e pela importância do ativo, e não só pela severidade." },
        { name: "TotalCloud", what: "Cobertura de postura de nuvem e de workloads, e a parte do portfólio que mais cresce em atenção dos profissionais." },
        { name: "Policy Compliance", what: "Os relatórios de compliance mais profundos da categoria, segundo a maioria dos relatos, PCI, HIPAA e o resto, e é por isso que a plataforma muitas vezes é comprada por organizações movidas pela auditoria, e não pelo risco." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "Segurança por assinatura, em 2000", detail: "Convencer as organizações a deixar os dados de varredura saírem das suas instalações levou anos de discussão, e a discussão hoje está tão resolvida que é difícil lembrar a dificuldade. Tudo na categoria é entregue desse jeito hoje." },
        { title: "Patches dentro do scanner", detail: "Encontrar uma vulnerabilidade e corrigi-la tinham sido, historicamente, produtos separados comprados por equipes separadas. Pôr a implantação na mesma plataforma ataca a falha real, que não é a descoberta, mas o intervalo entre a descoberta e a correção." },
        { title: "A visibilidade agregada como ativo defensivo", detail: "Um fabricante que varre muitos parques vê quais vulnerabilidades estão sendo exploradas no mundo real antes que qualquer cliente isolado veria. A base instalada melhora o produto para todos que estão nela." },
        { title: "Pesquisa publicada, e não guardada", detail: "O trabalho da Threat Research Unit foi reconhecido pelos prêmios do próprio meio, inclusive por pesquisa de execução remota de código: o tipo de resultado que não tem receita direta associada e constrói a credibilidade que tem." },
      ],
      // Markets: same number of entries as the English.
      markets: [
        "Empresas e setores fortemente regulados, com a profundidade em compliance como motivo distintivo de compra. Precificada por ativo, cotada em torno de duzentos dólares por ativo por ano antes de negociação.",
        "Concorre com a Tenable e a Rapid7, ambas nesta seção, e com fabricantes de postura nativos de nuvem na frente do TotalCloud.",
      ],
      // Analyst: same number of entries as the English.
      analyst: [
        "Leader no Gartner Magic Quadrant de 2025 para plataformas de exposure assessment e líder na avaliação de exposure management da IDC, com seus produtos de nuvem e de vulnerabilidade reconhecidos separadamente em prêmios do setor.",
        "Como no caso das duas concorrentes, o reposicionamento para exposure management está incompleto em toda a categoria, e os compradores ainda decidem pela cobertura de varredura e pela pontuação de risco, e não pela camada de plataforma acima delas.",
      ],
    },
  },
  // ---- red-hat: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "red-hat": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Red Hat",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Open source corporativo: RHEL, OpenShift, Ansible.",
    intro: "A Red Hat tornou o open source seguro para as empresas: Red Hat Enterprise Linux, OpenShift e Ansible são a espinha dorsal com suporte comercial dos parques Linux, das plataformas de contêineres e da automação no mundo todo.",
    // Body: 2 paragraph(s), same order as the English (the Red Education sentence keeps its exact claim).
    body: [
      "O treinamento de Red Hat está no catálogo da Red Education para a Australásia e no seu buscador de cursos, estendendo o portfólio dos appliances de rede e segurança para a camada de sistema operacional e automação que fica por baixo deles.",
      "Fundada em 1993 e lucrativa com um modelo de negócios que os céticos diziam não poder existir, vender suporte para um software que qualquer um podia copiar, a Red Hat provou a tese do open source corporativo, uma história que o glossário deste site conta por meio de The Cathedral and the Bazaar. A IBM a adquiriu em julho de 2019 por 34 bilhões de dólares, então a maior aquisição de software da história, e a opera como uma unidade distinta.",
    ],
    // Profile: complete copy of profiles/red-hat.ts; years, companies, founders and personal markers untouched.
    profile: {
      // Same slug as the English profile.
      slug: "red-hat",
      // Founding stories: place (geography localised), story and provenance translated; company, year and founders verbatim.
      foundings: [
        {
          company: "Red Hat",
          year: 1993,
          place: "Connecticut (como ACC Corp., Inc.); depois Durham, Carolina do Norte",
          founders: ["Bob Young", "Marc Ewing"],
          story: "Marc Ewing montou sua distribuição Linux em 1994 e a batizou em homenagem ao boné vermelho de lacrosse de Cornell que usava; Bob Young vendia CDs de Linux num negócio de catálogo, constituído em 1993 como ACC Corp., e reconhecia distribuição quando via. Em 1995, os dois negócios se juntaram e a empresa de Young adotou o nome Red Hat Software, construída sobre uma ideia herética: dar o software de graça e vender a confiança, empacotamento, atualizações, certificação, suporte. O IPO de agosto de 1999, um dos primeiros dias de pregão mais delirantes da era pontocom, pôs um preço de mercado nessa ideia; a virada de 2002 para o Red Hat Enterprise Linux a aperfeiçoou. Assinaturas de open source viraram um negócio do tamanho de uma gigante de software, que foi exatamente o que acabou comprando a empresa.",
          sourceNote: "O prospecto do IPO da Red Hat (SEC Form 424B1, 11 de agosto de 1999) registra a linha societária: constituída em Connecticut em março de 1993 como ACC Corp., Inc.; rebatizada Red Hat Software, Inc. em setembro de 1995; reconstituída em Delaware em setembro de 1998; rebatizada Red Hat, Inc. em junho de 1999. A Wikipedia descreve a etapa de 1995 como Young comprando o negócio de Ewing e marca essa frase como precisando de esclarecimento.",
        },
      ],
      // Timeline: same order and years as the English; prose translated.
      timeline: [
        { year: 1994, title: "O Red Hat Linux chega", detail: "A distribuição de Ewing chega, com o gerenciamento de pacotes RPM a caminho: o Linux instalável para quem tem emprego; no ano seguinte, a empresa de Young, constituída em 1993 como ACC Corp., adota o nome Red Hat Software." },
        { year: 1999, title: "O IPO que ecoou pelo Vale", detail: "A listagem de agosto dispara no primeiro dia: o open source chega a Wall Street, com a Red Hat como prova de que software livre podia ter código de negociação na bolsa." },
        { year: 2002, title: "RHEL: o modelo aperfeiçoado", detail: "O Red Hat Enterprise Linux separa o produto estável, certificado e por assinatura do fluxo comunitário de evolução rápida, o Fedora, a partir de 2003, criando o modelo que todo negócio open source desde então estudou." },
        { year: 2006, title: "Subindo na pilha: JBoss", detail: "A aquisição da JBoss acrescenta middleware; a Ansible (2015) depois acrescenta automação, e a CoreOS (2018), o DNA de Linux para contêineres: cada uma ampliando as assinaturas para além do sistema operacional." },
        { year: 2019, title: "IBM: US$ 34 bilhões", detail: "A IBM conclui a aquisição em 9 de julho de 2019, então o maior negócio de software da história, comprando tanto a posição do OpenShift em nuvem híbrida quanto o RHEL, com a Red Hat mantida deliberadamente semiautônoma. Matt Hicks assume como CEO em 2022." },
        { year: 2020, title: "CentOS Stream", detail: "O anúncio de dezembro leva o CentOS de rebuild downstream para o Stream upstream: polêmico entre os rebuilders, esclarecedor para o negócio do RHEL, e a faísca de uma nova geração de distribuições downstream." },
      ],
      // Products: names verbatim, descriptions translated.
      products: [
        { name: "Red Hat Enterprise Linux", what: "O sistema operacional do open source corporativo: a assinatura, o ecossistema de certificação e os ciclos de vida de dez anos sobre os quais o modelo é construído." },
        { name: "OpenShift", what: "A plataforma Kubernetes: a peça central de nuvem híbrida que motivou o negócio com a IBM." },
        { name: "Ansible Automation Platform", what: "A língua franca da automação, e a linguagem de configuração por trás de boa parte das ferramentas do mundo das redes, o público deste site incluído." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "O modelo de negócios open source", detail: "A estrutura de assinatura e certificação do RHEL provou que software livre podia financiar um fabricante corporativo: o modelo para toda empresa comercial de open source depois dela." },
        { title: "O RPM e o ofício da distribuição", detail: "O gerenciamento de pacotes, a resolução de dependências e a disciplina de engenharia de releases que a Red Hat construiu viraram o substrato do próprio Linux corporativo." },
      ],
      // Markets: same number of entries as the English.
      markets: [
        "Dentro da IBM desde 2019, mas operada como a porta-bandeira do open source: RHEL e OpenShift ancoram a nuvem híbrida em praticamente todos os setores, contra a Canonical, a SUSE e as pilhas próprias dos hiperescaladores.",
      ],
      // Analyst: same number of entries as the English.
      analyst: [
        "O fabricante de referência do Linux corporativo e Leader nas avaliações de plataformas de contêineres: a rara empresa cujos nomes de produto também são nomes de categoria.",
      ],
    },
  },
  // ---- sagemcom: pt-BR prose for the record (facts stay in the English record) ----
  "sagemcom": {
    // Parent note (official.parent.note), added 26/10/2026 with the funds2 apply; name and year stay English facts.
    parentNote: "A Charterhouse investiu em setembro de 2016 e manteve o controle, junto com seus coinvestidores, depois de uma venda parcial em 2018; a Sagemcom a aponta como principal acionista de seu quinto LBO, em 2024, e os funcionários detêm cerca de 30% do capital.",
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Sagemcom - a caixa na casa que ninguém escolheu",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Fabricante francesa de gateways de banda larga, set-top boxes e medidores, separada da Safran em 2008.",
    intro: "A Sagemcom fabrica equipamentos de instalação do cliente: o gateway de banda larga que uma operadora instala numa casa, o set-top box de televisão ao lado dele e o medidor inteligente do lado de fora. Foi separada da Safran em 2008 num management buyout alavancado, e descende da Sagem, uma fabricante francesa que data de 1924.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "Os equipamentos de instalação do cliente são a maior categoria de hardware de rede do mundo em número de unidades e a menos examinada. Quase ninguém escolhe a caixa da própria parede: uma operadora a escolhe, a envia, a configura remotamente e a substitui no próprio cronograma. As especificações segundo as quais ela é construída são as da operadora, e é por isso que os equipamentos desta linha do tempo que as pessoas de fato possuem costumam ser aqueles sobre os quais elas menos sabem.",
      "Esse arranjo decide mais do que parece. O gateway é onde se definem o endereço de rede de uma casa, o canal sem fio, o comportamento do firewall e, muitas vezes, o resolver, de modo que um número enorme das decisões sobre as quais este site escreve é tomado uma vez, por um fornecedor e uma operadora juntos, para milhões de casas de cada vez.",
      "O detalhe societário que vale registrar é o controle. Ela passou por cinco leveraged buyouts sucessivos desde a separação e, ao longo de todos eles, cerca de trinta por cento do capital esteve nas mãos dos próprios funcionários. A maioria dos carve-outs desta linha do tempo terminou com os funcionários sem nada, o que faz este valer ser dito, e não presumido.",
    ],
  },
  // ---- secureway: pt-BR prose for the record (facts stay in the English record) ----
  "secureway": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Secureway",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Parceira Fortinet de nível Expert no Brasil.",
    intro: "Integradora de São Paulo no nível Expert da Fortinet em SD-WAN e redes seguras.",
    // Body: 2 paragraph(s), same order as the English (the registered name kept as the English writes it).
    body: [
      "Registrada como Secureway Tecnologia da Informacao, MSP, Servicos, a própria razão social carrega a reivindicação de serviço gerenciado, o que é incomum e levemente útil: data a empresa de uma época em que se chamar de MSP valia a pena ser escrito no registro, e não só no marketing.",
      "Suas duas especializações são a rede de longa distância e o campus, a dupla que um parceiro monta quando seus clientes são empresas com vários sites e sem equipe de rede própria.",
    ],
  },
  // ---- sek: pt-BR prose for the record (facts stay in the English record) ----
  "sek": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "SEK - uma empresa de segurança montada por um fundo",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Empresa latino-americana de cibersegurança criada pela Patria Investimentos a partir da NeoSecure e da Proteus.",
    intro: "A SEK (Security Ecosystem Knowledge) foi lançada em 30 de março de 2023 como a marca unificada de duas empresas que a Patria Investimentos tinha comprado em 2021: a chilena NeoSecure e a brasileira Proteus. Começou com 650 clientes, 750 pessoas e cerca de cem milhões de dólares de receita, e declarou a meta de quinhentos milhões em cinco anos.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "É o caso mais claro, nesta linha do tempo, de uma empresa que existe porque o capital decidiu que um mercado devia se consolidar. A Patria comprometeu US$ 250 milhões com a cibersegurança latino-americana, criou uma holding para isso em outubro de 2021, comprou as duas empresas, contratou no ano seguinte um chief executive de fora do setor e lançou a marca combinada dezoito meses depois. Cada passo é uma decisão financeira que, por acaso, produz uma empresa de segurança.",
      "Vale nomear o motivo de isso funcionar neste mercado em particular. Serviços de segurança são comprados com base em confiança e entregues por pessoas, então os ativos são relacionamentos e especialistas, ambos nacionais, e nenhum deles escala com a abertura de um escritório. Comprar duas empresas estabelecidas compra os dois de uma vez, em cinco países.",
      "A prioridade que ela mesma declarou ao lado do crescimento, nos anúncios de fundação, é a formação: usar o próprio porte para ajudar a produzir especialistas em segurança da informação, porque a falta deles é a restrição de todo o setor. É raro uma empresa apoiada por private equity nomear isso como meta na sua primeira coletiva de imprensa, e é o mesmo argumento que os registros de treinamento desta linha do tempo fazem pelo outro lado.",
      "As aquisições continuaram depois do lançamento: a Proof em 2024 e a NetBR em 2025, levando-a a mais de novecentas pessoas e oitocentos clientes em cinco países.",
    ],
  },
  // ---- servicenow: pt-BR prose for the record (facts stay in the English record) ----
  "servicenow": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "ServiceNow - o help desk que virou o workflow da empresa",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Fundada por uma só pessoa, aos cinquenta anos, um chief technology officer cuja empresa anterior tinha desmoronado numa fraude contábil; um sistema de tickets que cresceu até virar a plataforma pela qual os outros sistemas passam.",
    intro: "A ServiceNow é uma empresa americana de software em nuvem fundada em Santa Clara em 2004 como Glidesoft, cuja plataforma de gestão de serviços de TI virou a camada de workflow das operações corporativas.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A empresa começou como uma recuperação pessoal. Fred Luddy tinha sido chief technology officer da Peregrine Systems por treze anos quando ela desmoronou numa fraude contábil e pediu falência em setembro de 2002, levando junto, segundo um relato, cerca de 35 milhões de dólares em ações dele. Em junho de 2004, duas semanas antes de completar cinquenta anos, ele constituiu a Glidesoft na Califórnia, tendo a si mesmo como único funcionário. O produto era um help desk: um sistema de tickets, um banco de dados de configuração e um motor de workflow, entregues pela web, uma instância por cliente, numa época em que a ideia de rodar as operações de TI nos servidores de outra empresa era vista como imprudente.",
      "No começo ele o distribuía de graça, para descobrir o que estava quebrado, e tinha aprendido na Peregrine exatamente quão grande era a distância entre o que o software corporativo prometia e o que ele fazia pelas pessoas que o usavam. O primeiro cliente pagante foi um pequeno fabricante de software; uma rodada seed de 2,5 milhões de dólares veio em 2005; o nome mudou em 2006 para dizer o que a empresa era. Foi lucrativa cedo e quase se vendeu cedo demais. Frank Slootman assumiu como chief executive em 2011, a empresa abriu capital em junho de 2012 com avaliação de cerca de dois bilhões de dólares, e hoje integra o S&P 100, com receita acima de treze bilhões.",
      "Aquilo em que ela se transformou é mais interessante do que os números. Um help desk registra o que está quebrado e quem está consertando. Quando esse registro passa a ser a fonte oficial e todo o resto, o inventário de ativos, as aprovações de mudança, os incidentes de segurança, os tickets com fornecedores, está ligado a ele, o sistema de tickets vira o lugar onde as operações da organização de fato são decididas. O crescimento da ServiceNow foi a descoberta de que o workflow em torno do ticket valia mais do que o ticket, e de que quem detém o workflow detém o processo da empresa. Para o profissional de redes e segurança, é onde o incidente é aberto, onde a janela de mudança é aprovada e onde mora a trilha de auditoria.",
      "A origem pertence ao lado do escândalo contábil do registro da Nortel e do histórico do registro da Fujitsu. Uma empresa foi construída por alguém que tinha visto, de dentro, o que acontece quando o registro sobre o qual uma organização funciona não é confiável, e que se propôs a fazer do registro operacional algo em que se pudesse confiar.",
    ],
  },
  // ---- skybox: pt-BR prose for the record (facts stay in the English record) ----
  "skybox": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Skybox Security - caminhos de ataque, e um desfecho",
    // Card line (also the meta description) and intro paragraph.
    // Corrected 2026-10-26 (endings apply), mirroring the English: a closure, not an absorption.
    tagline: "Modelava como um atacante percorreria a rede que você documentou, e encerrou suas operações em 2025.",
    intro: "A Skybox Security criava software de modelagem de rede e gestão de vulnerabilidades cuja ideia distintiva era o caminho de ataque: em vez de listar vulnerabilidades por severidade, perguntava quais delas um atacante conseguiria de fato alcançar, dadas a topologia e as regras da própria rede.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "Essa é a pergunta certa, e é por isso que a severidade sozinha é um mau critério de priorização: uma vulnerabilidade crítica num host para o qual nada consegue rotear é um problema diferente de uma moderada num host exposto à internet. Modelar o caminho entre elas exige conhecer a topologia, as regras e os endereços ao mesmo tempo, e é por isso que esta empresa estava no mesmo mercado que os fabricantes de gestão de políticas.",
      // Corrected 2026-10-26 (endings apply), mirroring the English: the closure date, and "aquisição" became "fim".
      "Em 2026, o domínio dela serve uma página da Tufin dirigida aos clientes da Skybox, segundo a qual a Skybox encerrou suas operações em 24 de fevereiro de 2025. O registro é mantido porque a ideia sobreviveu à empresa, e porque o site do próprio fabricante costuma ser o primeiro lugar onde o seu fim fica visível para quem dependia dele.",
      "Foi fundada em 2002 por Eran Reshef e Gidi Cohen, e operou inicialmente com o nome SecLucid. A troca de nome é do tipo comum, mas vale registrar, porque uma empresa que muda de nome cedo deixa um rastro fácil de perder: o ano de fundação fica preso a um nome de que quase ninguém se lembra.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A Skybox Security encerrou suas operações em 24 de fevereiro de 2025, segundo a página que a concorrente Tufin hoje publica em skyboxsecurity.com.",
  },
  // ---- solor: pt-BR prose for the record (facts stay in the English record) ----
  "solor": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Solor",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Parceira brasileira citada no canal Fortinet.",
    intro: "Uma parceira brasileira no canal Fortinet. O programa de parceiros do fabricante classifica as empresas por nível e especialização, o que torna seu diretório brasileiro excepcionalmente enumerável em comparação com fabricantes cujos localizadores são renderizados por script e, portanto, invisíveis para quem tenta mapear o mercado.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "Integradora Fortinet de nível Expert e provedora de serviços de segurança gerenciados, especializada em tecnologia operacional, SASE, firewall, LAN e operações de segurança. A especialização em tecnologia operacional merece nota: ambientes industriais são onde um controle de segurança que falha fechado interrompe um processo físico, e não uma aplicação.",
    ],
  },
  // ---- soow-sigma: pt-BR prose for the record (facts stay in the English record) ----
  "soow-sigma": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Soow Sigma",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Parceira citada pela Netskope no Brasil.",
    intro: "Uma parceira brasileira do lado da Netskope. O canal de segurança em nuvem no Brasil é mais jovem do que o de redes, e isso aparece nos nomes: empresas construídas em torno da entrega de software e de assinaturas, e não da distribuição de hardware, o que é outro negócio, com outra economia.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A empresa mais interessante desta lista, porque não é o que o nome atual sugere. A Soow Sigma é a Sigma Telecom rebatizada, que completou quarenta anos em 2025; ou seja, uma empresa que começou em telecomunicações em meados dos anos 1980 hoje é uma integradora estratégica de cibersegurança. A empresa teve o cuidado de publicar que a mudança de marca, de nome fantasia e de razão social não mexeu no CNPJ, nem, com ele, em nenhum contrato já assinado, que é a metade prática de um rebranding que ninguém fora do financeiro costuma ver.",
      "Sua posição junto aos fabricantes é excepcionalmente forte para uma empresa brasileira. A Netskope a lista na Service Delivery Specialization para a América Latina e a descreve como parceira estratégica, o que a coloca acima de uma relação comum de revenda nesse programa. A Fortinet a classifica como Expert Partner e a nomeou 2025 Brazil Unified SASE Partner of the Year, além de um prêmio de Best Strategic Project, reconhecimentos em 2025 por vendas na região Sul e por especialização, e indicações nas categorias de serviços de segurança gerenciados e de tecnologia operacional.",
      "O portfólio que ela descreve abrange cibersegurança, conectividade, experiência do cliente e cidades inteligentes, o que parece uma lista até se perceber que é a herança de telecom sendo reaproveitada. Quarenta anos de trabalho com operadoras e conectividade são exatamente a bagagem que torna a tecnologia operacional e os projetos municipais viáveis, porque esses são problemas de rede antes de serem problemas de segurança.",
      "Essa trajetória é a leitura que vale guardar. O canal brasileiro de segurança costuma ser descrito como jovem, e partes dele são; mas algumas de suas empresas mais fortes são antigas empresas de telecom que mudaram o que vendem, e não startups que chegaram junto com a categoria. A cultura de engenharia veio com elas.",
    ],
  },
  // ---- startse: pt-BR prose for the record (facts stay in the English record) ----
  "startse": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "StartSe - um curso de trinta reais numa sala de estar em Minas, e as missões ao Vale do Silício",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Fundada em 2015 no interior de Minas Gerais com um curso online de duas horas que custava trinta reais; um ano depois, quatro ex-sócios da XP Investimentos entraram no negócio, e o produto virou a missão de uma semana ao Vale do Silício.",
    intro: "A StartSe é uma empresa brasileira de educação executiva fundada em 2015, conhecida pelas missões de imersão ao Vale do Silício, à China e a Israel, pelos eventos sobre a nova economia e por um campus em Palo Alto inaugurado em 2019.",
    // Body: 5 paragraph(s), same order as the English (people's names kept as the English writes them).
    body: [
      "Começou como o menor produto possível. Em 2015, no interior de Minas Gerais, Junior Borneli e Joao Evaristo vendiam um curso online de duas horas chamado Startup de A a Z por trinta reais, dado da sala de estar de Borneli para empreendedores que queriam entender o que era uma startup. O plano era uma empresa de educação digital. O que aconteceu no lugar disso é a parte interessante: quatro ex-sócios da XP Investimentos, Pedro Englert, Marcelo Maisonnave, Eduardo Glitz e Mauricio Benvenutti, entraram com 800.000 reais, Englert virou chief executive, e o produto se transformou em algo que os fundadores não tinham planejado: a missão.",
      "Uma missão é uma semana no Vale do Silício, depois também na China e em Israel, passada não numa sala de aula, mas em visitas a aceleradoras, incubadoras e empresas de tecnologia, vendida a executivos e empresários brasileiros como uma imersão no que a empresa chamava de nova economia. A partir de agosto de 2016, ela virou o núcleo do negócio, com eventos para setores específicos em volta. O faturamento mensal foi de 80.000 para 500.000 reais na primeira fase; em 2019, a empresa gastou cinco milhões de reais num campus de quinhentos metros quadrados em Palo Alto, com uma sala de aula para cem pessoas e um laboratório de inteligência artificial, e abriu filiais em São Paulo e em Xangai. A premissa declarada do chief executive era que a educação tradicional tinha ficado obsoleta, e que a pergunta tinha deixado de ser onde você estudou para ser como você continua se desenvolvendo.",
      "A pandemia parou as viagens das quais o modelo dependia, e o relato da própria empresa sobre aquele ano é um mea culpa e uma volta aos cursos online com que ela tinha começado, traduzidos para quatro idiomas e distribuídos por parceiros no exterior, o primeiro deles uma escola de negócios portuguesa. Borneli reassumiu a cadeira de chief executive em julho de 2020.",
      "O motivo de ela estar ao lado dos centros de treinamento de fabricantes é o contraste. Um centro de treinamento autorizado vende o currículo de um fabricante, entregue por um instrutor que o fabricante certificou, a pessoas que precisam operar o produto. A StartSe vendia proximidade: uma semana no lugar onde os produtos são feitos, a pessoas que queriam entender a cultura que os fez. O primeiro tipo de treinamento diz como uma coisa funciona. O segundo diz como é o lugar de onde a coisa veio; e, para um executivo brasileiro em 2017, essa era, pelo preço, a mercadoria mais escassa.",
      "A empresa não continuou independente. O relato da própria Alura registra que, em 2020 e 2022, a StartSe se juntou à Alura, à FIAP e à PM3 no que o grupo chama de maior ecossistema de educação em tecnologia da América Latina, que adotou o nome Grupo Alun em 2025. O curso da sala de estar, as missões e o campus de Palo Alto hoje estão dentro do mesmo grupo que a maior escola online de tecnologia do Brasil e uma de suas universidades de tecnologia; o registro da Alura traz o resto dessa história.",
    ],
  },
  // ---- sytek: pt-BR prose for the record (facts stay in the English record) ----
  "sytek": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Sytek - LANs broadband, e o NetBIOS",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Rodava redes locais sobre a infraestrutura de TV a cabo e deixou para trás uma interface que sobreviveu à empresa por décadas.",
    intro: "A Sytek construía redes locais sobre cabo coaxial broadband, o mesmo meio que a TV a cabo usava, o que permitia a uma rede cobrir um campus, e não um andar, e transportar vários canais ao mesmo tempo. Ela é mais lembrada por algo menor: a interface NetBIOS que desenvolveu com a IBM, que virou a base das redes de PC por uma geração.",
    // Body: 5 paragraph(s), same order as the English.
    body: [
      "A Sytek foi constituída em julho de 1979 por cinco pessoas, Michael Pliner, Ken Biba, Tom Berson, Jack Goldsmith e Bob Kroll, e começou, como várias de suas contemporâneas, como empresa de consultoria, e não como fabricante. O primeiro cliente foi a Xerox, que pagou 250.000 dólares para que ela escrevesse os protocolos de comunicação de uma rede interna. O primeiro ano fechou com catorze clientes, 1,3 milhão de dólares de receita e 300.000 dólares no banco, e foi isso que comprou a liberdade de escolher uma estratégia.",
      "A escolha que fizeram em 1980 define tudo o que veio depois. Três empresas de redes locais foram constituídas com poucas semanas de diferença naquele verão, 3Com, Ungermann-Bass e Sytek, e enquanto as outras duas ficaram com a Ethernet, a Sytek foi deliberadamente para o broadband, justamente porque isso a diferenciaria. O broadband rodava sobre a infraestrutura de TV a cabo, transportava muitos canais ao mesmo tempo e se adequava a redes em escala de campus com grande número de estações. Foi uma aposta técnica real contra o consenso do baseband, e não uma falha em percebê-lo.",
      "A aposta deu um retorno espetacular e breve. Em 14 de agosto de 1984, a IBM anunciou a PC LAN, que era uma LocalNet da Sytek reprojetada. A Sytek tinha fabricado catorze mil unidades antes do anúncio e abastecido o canal de distribuição da IBM; no mês seguinte, a IBM investiu seis milhões de dólares por 4,9 por cento, avaliando a empresa em mais de 120 milhões. Um detalhe da especificação era o aviso sobre o qual ninguém podia agir: a IBM limitou o produto a 72 estações, quando toda a vantagem do broadband aparecia com grande número de estações.",
      "O anúncio do Token Ring pela IBM, em 15 de outubro de 1985, mudou o destino da Sytek, e o formato dessa reviravolta é a lição. Uma empresa cujo maior cliente também é quem define o padrão não tem posição independente: a mesma relação que produziu catorze mil unidades de demanda podia removê-la anunciando outra coisa. A Sytek foi vendida a uma unidade da GM Hughes Electronics em março de 1989, com 330 funcionários e cinquenta a sessenta milhões de dólares de receita, virando Hughes LAN Systems e, mais tarde, em 1995, Whittaker Communications.",
      "O que sobreviveu a tudo isso foi um software. A Sytek criou a interface NetBIOS, que a Microsoft adotou em suas primeiras redes, e cujos descendentes ainda estavam sendo desativados em guias de hardening corporativo quatro décadas depois. O broadband se foi, a empresa se foi, e a API que ela escreveu para conversar com os IBM PCs é a parte que precisou ser discutida muito depois de todo mundo esquecer quem a tinha escrito.",
    ],
  },
  // ---- tdec: pt-BR prose for the record and its profile (facts stay in the English record; mirrors the 2026-10-26 English edits) ----
  "tdec": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "TDec Network Group - redes e segurança, três países",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Uma empresa brasileira de redes e segurança que cresceu para fora: Brasil, Estados Unidos, Portugal.",
    intro: "A TDec Network Group opera a partir de São Paulo e remonta à TDEC Informática Ltda., empresa registrada em Cotia em 6 de março de 1992 e que depois passou a operar como The Network Group. O próprio site se apresenta como \"est. 1993\" (fundada em 1993) enquanto descreve mais de trinta anos de atuação: uma discrepância de um ano que a empresa nunca conciliou, e que vale deixar visível em vez de escolher um lado. Atua no Brasil, nos Estados Unidos e em Portugal em cibersegurança, redes corporativas e TI global.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "A pessoa jurídica fundadora é a TDEC Informática Ltda. (CNPJ 67.521.195/0001-96), registrada em Cotia em março de 1992, um endereço de registro, e não um local de trabalho, distinção que vale manter num histórico societário brasileiro; uma empresa posterior, a TDec Redes de Computadores Ltda. (CNPJ 06.093.568/0001-80), foi aberta em janeiro de 2004 e é a pessoa jurídica ativa associada ao grupo hoje. Um registro de 2004 não é uma fundação em 2004, e os dois são mantidos separados aqui. O fundador é José Valter “Junior” Távora de Castro.",
    ],
    // Profile: complete copy of profiles/tdec.ts; years, companies, founders and personal markers untouched.
    profile: {
      // Same slug as the English profile.
      slug: "tdec",
      // Founding stories: place (geography localised), story and provenance translated; company, year and founders verbatim.
      foundings: [
        {
          company: "TDEC Informatica Ltda.",
          year: 1992,
          place: "Cotia, São Paulo, Brasil",
          founders: ["Jose Valter “Junior” Tavora de Castro"],
          story: "A pessoa jurídica fundadora foi registrada em Cotia em março de 1992 como TDEC Informatica Ltda. O próprio site da empresa se apresenta como est. 1993 enquanto descreve mais de trinta anos de atuação, e a diferença de um ano fica de pé aqui, sem ser resolvida, porque uma data de registro e o relato de uma empresa sobre quando começou a operar são dois fatos diferentes, e vale ter os dois. O que a sequência estabelece é o ponto de partida: uma integradora de redes IP, no início da internet comercial brasileira, e não depois dele.",
          sourceNote: "1992 é a data de registro do CNPJ (67.521.195/0001-96), um endereço de registro, e não um local de trabalho. O est. 1993 do site é citado como reivindicação da própria empresa. Nenhum dos dois é preferido. Pela regra editorial para datas de fundação conflitantes (2026-09-12), uma discrepância de um ano como esta é registrada, e não decidida.",
        },
      ],
      // Timeline: same order and years as the English; prose translated.
      timeline: [
        { year: 2004, title: "Uma segunda pessoa jurídica, e por que isso não é uma segunda fundação", detail: "A TDec Redes de Computadores Ltda. foi aberta em janeiro de 2004 e é a pessoa jurídica ativa associada ao grupo hoje. Vale dizer com todas as letras que isso não é uma fundação em 2004: um grupo brasileiro abre rotineiramente uma nova empresa por razões tributárias, contratuais ou de credenciamento de parceiros enquanto o negócio continua sem interrupção, e ler o CNPJ mais novo como data de nascimento é um dos jeitos mais fáceis de errar a história de uma empresa brasileira." },
        { year: 2013, personal: true, title: "Rodolfo trabalha lá dentro", detail: "Rodolfo Nützmann trabalhou dentro da TDec de 2013 a 2014. Uma integradora deste porte é onde a distância entre a arquitetura de referência de um fabricante e o parque real de um cliente fica mais visível, porque não há uma camada de processo entre o engenheiro e a consequência.", sourceNote: "Datas do registro do próprio Rodolfo Nützmann, 2026-08-11. Não derivadas de nenhuma fonte pública." },
        { year: 2026, title: "Três países, e um reposicionamento para IA", detail: "A empresa hoje se apresenta como TDEC Network Group no Brasil, nos Estados Unidos e em Portugal, e se reposicionou da integração de redes IP para a proteção de ambientes, dados e modelos de inteligência artificial, com segurança de IA, SOC em tempo real e zero trust como linhas de solução nomeadas. O cabeamento estruturado ainda aparece na mesma frase que a proteção de modelos de IA, o que não é incoerência: é uma descrição precisa do que a base de clientes de uma integradora com trinta anos de estrada de fato pede ao mesmo tempo.", sourceNote: "Do site da própria empresa como exibido em 2026-09-27, onde uma seção traz o rótulo ECOSSISTEMA TDEC - 2026. O ano marca o estado do site lido naquela data, e não um evento anunciado." },
      ],
    },
  },
  // ---- ubiquiti: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "ubiquiti": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Ubiquiti - recursos corporativos a preço de prosumer",
    // Card line (also the meta description) and intro paragraph.
    tagline: "O airMAX equipou os WISPs, o UniFi fez do modelo de controller uma compra de US$ 200, e dois incidentes que todo leitor de segurança deveria saber de cor.",
    intro: "A aposta de Robert Pera era que o desempenho de rádio dos grandes fabricantes podia sair por uma fração do preço, vendido pela comunidade em vez de por uma força de vendas. O airMAX conectou os lugares que as operadoras pularam; o UniFi virou a resposta padrão para redes pequenas e para uma parcela crescente das sérias. Contados com rigor, a fraude de BEC de 2015 e o caso de insider de 2020-21 são material clássico de ensino em segurança.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "Quase todas as outras empresas desta seção são definidas pelo seu canal: as revendas, as distribuidoras, os parceiros autorizados, os engenheiros certificados. O relatório anual da própria Ubiquiti afirma o contrário numa única linha: ela não emprega uma força de vendas direta tradicional. O conhecimento da marca vem de reviews, de distribuidoras e de uma comunidade de usuários que conversa diretamente com as equipes de engenharia e de suporte.",
      "Isso não é uma preferência de marketing; é de onde vem o preço. A margem que pagaria uma organização de vendas é tirada do custo, e é assim que rádios e access points chegam a valores que um pequeno operador consegue pagar. Robert Pera, ex-engenheiro da Apple, abriu a empresa em 2005 com as próprias economias e a apontou para os lugares que as operadoras tinham pulado.",
      "O resultado aparece nos documentos oficiais: mais de setenta milhões de dispositivos entregues em mais de duzentos países. Os provedores de internet sem fio que conectam áreas rurais e mal atendidas foram construídos sobre esses equipamentos, e o modelo de controller, uma rede administrada a partir de um só software, e não dispositivo por dispositivo, chegou a preços de pequena empresa enquanto a mesma ideia ainda era item de orçamento corporativo em outros lugares.",
      "A empresa é também o cenário do caso de insider mais claro da memória recente, e vale conhecê-lo justamente porque os números contrariam a intuição. Em 2021, um engenheiro que ganhava perto de um quarto de milhão de dólares por ano roubou dezenas de gigabytes de dados, exigiu um resgate de 1,9 milhão de dólares e publicou os dados quando o pedido foi recusado. Ele foi condenado a seis anos.",
      "O roubo não foi a parte cara. A remediação custou à empresa mais de 1,5 milhão de dólares. Depois, o mesmo homem se passou por denunciante e plantou relatos falsos de uma invasão que ele mesmo tinha cometido, e em um único dia a ação caiu o bastante para apagar mais de quatro bilhões de dólares de valor de mercado. O relato falso de um incidente causou mais de duas mil e quinhentas vezes o estrago do próprio incidente.",
      "Duas coisas decorrem disso para quem defende uma rede. O atacante era a pessoa paga para protegê-la, algo que nenhum perímetro resolve. E a versão dele sobre o que aconteceu, oferecida enquanto ajudava a investigar o caso, foi aceita por tempo suficiente para fazer diferença; portanto, o registro de quem fez o quê, guardado onde o insider não alcança, não é formalidade de auditoria. É a única coisa que separa um incidente de uma história sobre um incidente.",
    ],
    // Profile: complete copy of profiles/ubiquiti.ts; years, companies, founders and personal markers untouched.
    profile: {
      // Same slug as the English profile.
      slug: "ubiquiti",
      // Founding stories: place (geography localised) and story translated; company, year and founders verbatim.
      foundings: [
        {
          company: "Ubiquiti",
          year: 2005,
          place: "San Jose, Califórnia",
          founders: ["Robert Pera"],
          story: "Robert Pera saiu do grupo de Wi-Fi da Apple convencido de que o desempenho de rádio que os grandes fabricantes reservavam para etiquetas de preço corporativas podia sair por uma fração do custo, e de que os compradores não atendidos estavam em toda parte: ISPs sem fio atravessando vales, integradores cabeando pequenas empresas, entusiastas que leem datasheets por diversão. O airMAX equipou os WISPs do mundo; o UniFi levou redes gerenciadas por controller a qualquer um com duzentos dólares e um navegador. Quase nenhuma força de vendas, marketing pela comunidade: um modelo que o setor dizia que não funcionaria, conduzido por uma empresa de maioria do fundador que o fez funcionar mesmo assim.",
        },
      ],
      // Timeline: same order and years as the English; prose translated.
      timeline: [
        { year: 2007, title: "O airMAX e o mundo dos WISPs", detail: "Wireless fixo de longo alcance baseado em 802.11 a preços radicais: a linha de produtos que conectou os lugares que as operadoras pularam e construiu a primeira comunidade fiel da Ubiquiti." },
        { year: 2011, title: "UniFi, e o IPO", detail: "A linha UniFi estreia a tese completa: access points competentes gerenciados por um software de controller gratuito, sem licença por AP; e a empresa abre capital no mesmo ano, ainda gastando quase nada com vendas." },
        { year: 2015, title: "A lição de US$ 46,7 milhões", detail: "A Ubiquiti divulga uma fraude de business email compromise: atacantes se passando por executivos tiraram cerca de US$ 46,7 milhões pelos fluxos de trabalho financeiros. Vira o estudo de caso clássico de BEC: o processo, e não os firewalls, como a camada violada.", sourceNote: "Segundo a divulgação da própria empresa à SEC, 2015." },
        { year: 2021, title: "O caso de insider", detail: "Revela-se que um incidente de extorsão de dados tinha sido trabalho interno: um então funcionário roubou dados, se passou por atacante anônimo e exigiu resgate; ele foi condenado e sentenciado em 2023. Para um público atento à segurança, fica o par incômodo com 2015: as ameaças mais difíceis vieram do e-mail e de dentro.", sourceNote: "Segundo o registro da acusação do DOJ, sentença em 2023." },
        { year: 2022, title: "O padrão prosumer", detail: "O ecossistema UniFi, gateways, switches, câmeras, controle de acesso a portas, vira a resposta padrão para redes pequenas e para uma parcela crescente das sérias; os fóruns da comunidade continuam sendo a força de vendas." },
      ],
      // Products: names verbatim, descriptions translated.
      products: [
        { name: "UniFi", what: "APs, switching, gateways e câmeras gerenciados por controller: gerenciamento no estilo corporativo sem licença por dispositivo." },
        { name: "airMAX / airFiber", what: "As linhas de wireless fixo de longo alcance que equipam WISPs no mundo todo." },
        { name: "EdgeMAX", what: "A linha de roteamento (herança do EdgeRouter) que pôs encaminhamento de pacotes sério a preços de hobbista." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "A ruptura do modelo de negócios", detail: "Hardware perto do custo, software gratuito, comunidade como marketing: a Ubiquiti provou que um fabricante de redes podia escalar só com crescimento puxado pelo produto, e redefiniu as expectativas de preço de toda uma faixa do mercado." },
        { title: "O gerenciamento como produto", detail: "O controller de painel único do UniFi para redes abaixo do porte corporativo antecipou o modelo gerenciado em nuvem que os grandes fabricantes depois venderam para o topo do mercado, licenças à parte." },
      ],
      // Markets: same number of entries as the English.
      markets: [
        "A Ubiquiti domina as redes prosumer e de PMEs e o mundo dos equipamentos para WISPs: a prova contemporânea de que os modelos de distribuição, e não só o silício, são onde a concorrência em redes acontece.",
      ],
      // Analyst: same number of entries as the English.
      analyst: [
        "Incluída entre as contemporâneas tanto pelo modelo quanto pelos equipamentos; e, contados com rigor, seus dois incidentes são material de ensino que os leitores de segurança deste site deveriam saber de cor: o BEC vence os firewalls, e os insiders vencem a mentalidade de perímetro.",
      ],
    },
  },
  // ---- under-protection: pt-BR prose for the record (facts stay in the English record) ----
  "under-protection": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Under Protection",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Parceira Fortinet de nível Expert no Brasil.",
    intro: "Parceira Fortinet de nível Expert cuja própria história a data de 2001, quando começou com consultoria em segurança da informação para empresas brasileiras que não tinham nenhuma política de controle de acesso.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "O relato da empresa sobre o próprio começo é a parte útil, porque data o mercado, e não a empresa. Em 2001, a segurança digital mal era discutida no Brasil, e o primeiro trabalho dela foi consultoria para organizações que não tinham políticas básicas de controle de acesso. Uma prática de segurança fundada naquele ano não começou vendendo produtos; começou explicando que o problema existia.",
      "Vinte e cinco anos depois, a mesma empresa está no nível Expert de um programa de fabricante cujos níveis são conquistados com engenheiros certificados. Essa é a trajetória do canal brasileiro de segurança num só registro: de defender a causa a ser avaliado por quantas pessoas você tem capazes de implementá-la.",
      "A Under Protection foi fundada em 2001, e vale levar a sério o relato dela sobre o porquê: começou fazendo consultoria em segurança da informação para empresas brasileiras que não tinham nenhuma política de controle de acesso. Isso é cedo. A lei geral de proteção de dados do Brasil ainda estava a dezenove anos de distância, e a maior parte da pressão de compliance que hoje sustenta esse tipo de consultoria não existia; os primeiros clientes compravam, portanto, um julgamento sobre risco, e não um jeito de satisfazer um regulador.",
      "O trabalho descrito desde o início é avaliação de riscos, compliance e prevenção de incidentes segundo frameworks internacionais, ISO 27001 e 27701, e NIST, e não revenda de produtos, e hoje a própria empresa tem ISO 9001 e 27001. A conclusão que ela declara depois de duas décadas é que as falhas graves vieram menos de ferramentas mal configuradas do que da ausência de estratégia e de processo em torno delas.",
    ],
  },
  // ---- watchguard: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "watchguard": {
    // Parent note (official.parent.note), added 26/10/2026 with the funds2 apply; name and year stay English facts.
    parentNote: "A WatchGuard fechou o capital em 2006, comprada pela Gladiator Corporation, afiliada da Francisco Partners, com a Vector Capital III, L.P. bancando parte do capital; a Francisco Partners lista seu investimento como encerrado, e a Vector Capital lista a WatchGuard como buyout ativo.",
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "WatchGuard - a caixa vermelha que fez do firewall um appliance",
    // Card line (also the meta description) and intro paragraph.
    tagline: "O Firebox de 1996 transformou a segurança de projeto em objeto, e o mercado intermediário roda sobre ele desde então.",
    intro: "A aposta fundadora da WatchGuard foi o empacotamento: software de firewall lacrado num appliance de aço vermelho, com preço e console pensados para a empresa com uma única pessoa de TI. A categoria que os gigantes hoje dominam foi provada aqui primeiro, e a empresa nunca abandonou o mercado intermediário e o canal de MSPs que criou.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "O perfil cobre o Firebox, o IPO de 1999 e o fechamento de capital em 2006, os anos de UTM com o Fireware, o AuthPoint, a aquisição da Panda Security e o presente centrado nos MSPs.",
    ],
    // Profile: complete copy of profiles/watchguard.ts; years, companies, founders and personal markers untouched.
    profile: {
      // Same slug as the English profile.
      slug: "watchguard",
      // Founding stories: place (geography localised) and story translated; company, year and founders verbatim.
      foundings: [
        {
          company: "WatchGuard Technologies (founded as Seattle Software Labs)",
          year: 1996,
          place: "Seattle, Washington",
          founders: ["Founded as Seattle Software Labs, 1996"],
          story: "Em 1996, um firewall era quase sempre um projeto: software, uma máquina UNIX endurecida e um consultor que conhecia os dois. A percepção fundadora da WatchGuard foi que o mercado intermediário nunca compraria um projeto; compraria um objeto. O Firebox era esse objeto: software de firewall lacrado num appliance de aço vermelho inconfundível, configurado a partir de um console Windows, com preço para empresas que tinham uma pessoa de TI sobrecarregada em vez de uma equipe de segurança. A caixa vermelha virou o ícone da categoria, e 'appliance de segurança' virou uma classe de produto em grande parte porque a WatchGuard provou que as empresas comprariam um na prateleira.",
        },
      ],
      // Timeline: same order and years as the English; prose translated.
      timeline: [
        { year: 1996, title: "O Firebox chega ao mercado", detail: "Segurança numa caixa para o mercado intermediário: o Firebox empacota o firewall num appliance vermelho com gerenciamento acessível, o formato que o setor inteiro, gigantes incluídos, acabaria adotando." },
        { year: 1999, title: "Capital aberto em pleno boom", detail: "A WatchGuard abre capital na onda de segurança da era pontocom, com as caixas vermelhas se multiplicando pelo mundo das PMEs e das filiais que os fabricantes corporativos deixaram de fora pelo preço." },
        { year: 2006, title: "Capital fechado de novo", detail: "A Francisco Partners e a Vector Capital fecham o capital da WatchGuard, e a empresa se acomoda no seu jogo de longo prazo: o mercado intermediário, sem glamour e duradouro, que ela nunca deixou de atender.", sourceNote: "Fechamento de capital por cerca de US$ 151 milhões, segundo a imprensa da época, 2006." },
        { year: 2008, title: "Os anos de UTM", detail: "As plataformas XTM baseadas no Fireware reúnem firewall, VPN, antivírus de gateway e filtragem de conteúdo: o unified threat management como toda a pilha de segurança do mercado intermediário num só chassi vermelho." },
        { year: 2018, title: "AuthPoint", detail: "O MFA em nuvem entra no portfólio: a identidade chegando como novo perímetro justamente para os clientes menos preparados para construí-la sozinhos." },
        { year: 2020, title: "Panda Security", detail: "A WatchGuard adquire a fabricante espanhola de endpoint, completando a virada de fabricante de firewall para plataforma de segurança unificada: rede, identidade e endpoint sob um único console amigável aos MSPs." },
        { year: 2024, title: "A era do canal de MSPs", detail: "O centro de gravidade da empresa hoje é o provedor de serviços gerenciados: milhares de pequenas empresas protegidas por intermédio de terceiros, com a caixa vermelha cada vez mais um nó gerenciado em nuvem no centro de operações de outra empresa." },
      ],
      // Products: names verbatim (descriptor words localised), descriptions translated.
      products: [
        { name: "Firebox", what: "O appliance que deu nome à abordagem: firewall, VPN e serviços de UTM no característico chassi vermelho, das unidades de mesa para filiais aos modelos de rack." },
        { name: "Fireware", what: "O sistema operacional e o motor de políticas por baixo: um só modelo de gerenciamento em toda a linha." },
        { name: "A plataforma unificada", what: "MFA AuthPoint, endpoint da linhagem Panda (EPDR), filtragem de DNS e gerenciamento em nuvem: toda a pilha do mercado intermediário, operada por MSPs." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "Segurança como appliance", detail: "A WatchGuard apostou que o empacotamento, uma caixa lacrada, um console sensato, um preço previsível, era ele mesmo o produto de que o mercado intermediário precisava. A linha de appliances de todo fabricante de firewall descende dessa aposta." },
        { title: "O modelo centrado nos MSPs", detail: "Muito antes de 'MSSP' ser um segmento de mercado, a WatchGuard construiu para o operador de canal que gerencia cinquenta redes pequenas ao mesmo tempo: o gerenciamento multi-tenant como objetivo de design de primeira classe, e não como apêndice corporativo." },
      ],
      // Markets: same number of entries as the English.
      markets: [
        "O mercado intermediário e o canal de MSPs: redes varejistas, clínicas, escolas, filiais; o enorme estrato de redes abaixo da atenção dos fabricantes corporativos e acima de não fazer nada, defendido de forma desproporcional por caixas vermelhas.",
      ],
      // Analyst: same number of entries as the English.
      analyst: [
        "O quarto de século da WatchGuard é a prova de que o mercado intermediário é um negócio de segurança duradouro, e não um degrau: a empresa sobreviveu a rivais mais vistosos por nunca abandonar o comprador que todos os outros deixaram para trás.",
        "A linhagem do Firebox é também uma discussão permanente com que o material de firewall deste site lida o tempo todo: simplicidade integrada contra profundidade best-of-breed, e o que uma operação pequena consegue de fato manter.",
      ],
    },
  },
  // ---- wellfleet: pt-BR prose for the record (facts stay in the English record) ----
  "wellfleet": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Wellfleet - uma metade da Bay Networks",
    // Card line (also the meta description) and intro paragraph.
    tagline: "A empresa de roteadores que se fundiu com uma empresa de hubs, produzindo um negócio que foi, por pouco tempo, a alternativa crível à Cisco.",
    intro: "A Wellfleet Communications construía roteadores multiprotocolo durante a janela da interconexão de redes, concorrendo diretamente com a Cisco numa época em que ainda não estava decidido quem venceria. A fusão com a SynOptics em 1994 produziu a Bay Networks, que por alguns anos foi a alternativa mais crível à Cisco que o mercado corporativo teve.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A Wellfleet foi fundada em junho de 1986 por Paul Severino com Bill Seifert, Steven Willis, Jennifer Lamonakis e David Rowe, em Bedford e depois em Billerica, Massachusetts. Severino chegou a ela por um caminho que vale registrar: tinha fundado a Interlan em 1981 para vender produtos Ethernet, concluiu que a empresa estava subcapitalizada, conduziu sua venda à Micom em 1985 por sessenta e cinco milhões de dólares e então achou insuportável o cargo de staff que veio junto. Saiu em setembro de 1985 procurando uma empresa para abrir, e o que voltava sempre era o problema de interligar redes locais por circuitos T-1.",
      "Esse problema era o mercado de interconexão de redes, e o momento pôs a Wellfleet diretamente contra a Cisco, fundada dois anos antes. Ela anunciou seu primeiro produto antes do fim de 1987, começou a faturar com ele em meados de 1988, abriu capital em 1991 e foi apontada pela Fortune como a empresa de crescimento mais rápido dos Estados Unidos em 1992 e em 1993. Quase nada nessa trajetória sugere uma empresa com um problema.",
      "Ela tinha um mesmo assim, e ele era estrutural, e não comercial: a Cisco estava vencendo o mercado de roteadores de que ela precisava, e nenhuma taxa de crescimento fecha a distância para um concorrente que cresce a partir de uma base maior. Em outubro de 1994, a Wellfleet se fundiu com a SynOptics num negócio de 2,7 bilhões de dólares para formar a Bay Networks: duas empresas, cada uma forte numa camada, se unindo para enfrentar uma rival forte nas duas.",
      "A leitura é a que esta linha do tempo não para de produzir. Uma fusão entre iguais de duas empresas saudáveis é quase sempre um movimento defensivo contra uma terceira, e a empresa combinada herda duas culturas, duas linhas de produtos e duas sedes, enquanto a rival não herda nada. A Bay Networks foi adquirida pela Northern Telecom em 1998, quatro anos depois.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A Wellfleet Communications combinou-se com a SynOptics em outubro de 1994, e a empresa resultante adotou o nome Bay Networks.",
  },
  // ---- xylan: pt-BR prose for the record (facts stay in the English record) ----
  "xylan": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Xylan - a empresa de interconexão de redes que mais rápido cresceu até então",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Empresa de switching de LAN fundada em 1993 em Calabasas, adquirida pela Alcatel em 1999.",
    intro: "A Xylan foi fundada em 1993 em Calabasas, Califórnia, por Steve Kim e três sócios, e construía switches de alta largura de banda para redes locais. Nas palavras da própria compradora, foi a empresa de interconexão de redes que mais rápido cresceu na história do setor: mais de quatro mil clientes e US$ 348 milhões de receita em cinco anos. A Alcatel a comprou em 1999 por cerca de dois bilhões de dólares.",
    // Body: 5 paragraph(s), same order as the English.
    body: [
      "Vale dar os números com precisão, porque eles descrevem uma condição de mercado que não existe mais. Uma empresa fundada em 1993 chegou a trezentos e quarenta e oito milhões de dólares de receita anual em 1998, crescendo cerca de sessenta e cinco por cento em cada um dos seus dois últimos anos independentes, com cerca de novecentos e cinquenta funcionários. Era assim o mercado de switching quando todas as empresas do mundo estavam substituindo os hubs de meio compartilhado ao mesmo tempo.",
      "A aquisição não foi um ataque surpresa. A Alcatel detinha 6,5% da Xylan desde 1995, e as empresas trabalhavam juntas havia quatro anos, o que lembra que as grandes aquisições desta linha do tempo costumam ser o último passo de uma longa relação, e não o primeiro passo de uma nova.",
      "A mecânica é visível porque foi registrada em documentos oficiais. Uma oferta pública de compra em dinheiro, a trinta e sete dólares por ação, foi aberta em 8 de março de 1999 e encerrada em 2 de abril com cerca de noventa e sete por cento das ações ofertadas, depois de expirado o prazo de espera antitruste. Ler os documentos, e não a cobertura da imprensa, é como um leitor consegue ver o que de fato foi acordado, e é por isso que eles são citados aqui.",
      "O que a Alcatel comprou foi tanto acesso quanto tecnologia: um negócio americano de switching corporativo, uma divisão federal que vendia para a Força Aérea, a NASA e o Departamento de Energia, e uma posição contra a Cisco, a Lucent e a 3Com num mercado em que ela não conseguiria entrar depressa de outra forma.",
      "Ela cresceu nos anos em que projetar silício deixou de exigir uma fábrica. Os marcos de foundry e fabless deste site descrevem o arranjo que permitiu a uma empresa fundada em 1993 pôr silício de switching sob medida num produto sem jamais construir uma planta.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "Adquirida pela Alcatel. Uma oferta pública de compra em dinheiro a US$ 37,00 por ação foi aberta em 8 de março de 1999 e encerrada em 2 de abril com cerca de 97% das ações ofertadas; a Xylan virou subsidiária indireta integral naquele mês. A linha de switching continuou como o negócio corporativo da Alcatel.",
  },
  // ---- westcon-comstor: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "westcon-comstor": {
    // Parent note (official.parent.note), added 26/10/2026 with the parents apply; name, slug and year stay English facts.
    parentNote: "O negócio da Westcon-Comstor em EMEA e Ásia-Pacífico é a Westcon International, divisão central do grupo Datatec, listado na bolsa de Joanesburgo.",
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Westcon-Comstor",
    // Card line (also the meta description) and intro paragraph.
    tagline: "A camada entre o fabricante e a revenda, que decide o que é viável comprar no seu país.",
    intro: "A Westcon foi fundada em 1985 como sociedade do estado de Nova York, e a Comstor em 1986, em Chantilly, Virgínia. Elas viraram uma só empresa em agosto de 1999, quando a Westcon comprou a Comstor por US$ 95 milhões, e o negócio combinado passou as décadas seguintes fazendo algo em que a maioria dos engenheiros nunca precisou pensar: ficar entre as empresas que fabricam equipamentos de redes e segurança e as empresas que os instalam.",
    // Body: 8 paragraph(s), same order as the English (the teaching and employment wording kept as precise as the English).
    body: [
      "A presença latino-americana dela foi comprada, e não construída: em julho de 2012, ela adquiriu o Grupo Afina, uma distribuidora de Madri e Miami que no ano anterior já faturava mais na América Latina do que na Europa. A Afina tem registro próprio nesta seção.",
      "Em junho de 2017, a Synnex fechou acordo para adquirir da Datatec as operações da Westcon-Comstor na América do Norte e na América Latina, junto com um décimo do negócio internacional restante, e concluiu a compra em 1º de setembro de 2017: cerca de US$ 600 milhões em dinheiro, com até US$ 200 milhões a mais de earn-out, que somados dão os US$ 800 milhões muitas vezes noticiados; assim, a operação brasileira trocou de dono sem mudar o que fazia. A própria Synnex se fundiu com a Tech Data em 1º de setembro de 2021 para formar a TD Synnex, quando o vínculo empregatício registrado neste site já tinha terminado. O nome volta a aparecer depois por outro motivo: a TD SYNNEX Brasil mantém uma academia de treinamento autorizada, e os anos de instrutor incluem cursos de Extreme Networks ministrados para ela sob demanda entre 2021 e 2023. A mesma empresa, duas relações sem ligação entre si, com uma década de distância.",
      "O que uma distribuidora de fato faz, já que esta é a primeira nesta linha do tempo. Um fabricante como a Cisco ou a F5 não quer ter uma relação comercial com cada revenda de cada país; só as análises de crédito já seriam um negócio. Uma revenda não quer um contrato, uma moeda, um arranjo de logística e uma escalada de suporte separados com cada um dos quarenta fabricantes do seu portfólio. A distribuidora fica entre os dois e absorve isso: mantém estoque, concede crédito, cuida da importação e da alfândega, agrega a papelada e treina as revendas nos produtos que elas acabaram de começar a vender.",
      "Essa última parte é o motivo de a distribuição aparecer num site sobre ensino. O treinamento certificado de um fabricante é caro e voltado para as prioridades do próprio fabricante; a capacitação de uma distribuidora é voltada para aquilo que suas revendas não estão conseguindo vender. Não são o mesmo currículo, e o segundo diz mais sobre aquilo com que o mercado de fato está lutando.",
      "A consequência estratégica é a parte interessante: uma distribuidora decide o que é viável comprar num país. Um produto sem distribuição no Brasil não está exatamente indisponível, mas toda revenda que o cotar precisa importá-lo por conta própria, assumir o risco cambial e explicar ao cliente um prazo de entrega mais longo, o que na prática significa que ela cota outra coisa. A participação de mercado numa região muitas vezes reflete mais os acordos de distribuição do que o produto.",
      "A história societária é uma cadeia de controle, e não uma cadeia de invenção. A Datatec, um grupo sul-africano, adquiriu a Westcon em 1998. A Westcon acrescentou o RBR Group, no Reino Unido, em setembro de 1998, e depois a Comstor, em agosto de 1999; a Comstor tinha sido fundada em 1986, vendida à GE Capital IT Solutions por volta de 1996 e faturava cerca de US$ 500 milhões por ano quando trocou de mãos. A distribuição da Cisco começou em 1999 e a da Avaya em 2000. A empresa combinada faturava cerca de US$ 1,5 bilhão, e US$ 1,85 bilhão em 2004.",
      "Em 2017, a SYNNEX comprou o negócio das Américas por US$ 600 milhões em dinheiro, mais US$ 30 milhões por um décimo das operações internacionais, assumindo cerca de US$ 190 milhões em dívida, com até US$ 200 milhões adicionais condicionados a metas. O negócio das Américas faturava cerca de US$ 2,2 bilhões. As operações da Westcon-Comstor na EMEA e na Ásia-Pacífico ficaram com a Datatec, e é por isso que a mesma marca pode ser uma subsidiária da SYNNEX num hemisfério e um negócio da Datatec no outro.",
      "E uma ligação que vale seguir. A Datatec tinha três divisões: distribuição de tecnologia, como Westcon-Comstor; integração e serviços gerenciados, como Logicalis; e consultoria, como Analysys Mason. Ou seja, a distribuidora e a integradora eram irmãs sob uma mesma holding: duas camadas da mesma cadeia de suprimentos, com os mesmos donos, um arranjo que vale notar quando se tenta entender por que determinado produto continuava aparecendo em determinado mercado.",
    ],
    // Acquisitions: index-aligned with the English list (year, name, price and founder stay English).
    acquisitions: [
      { what: "Uma distribuidora especializada em Cisco fundada em Chantilly, Virgínia, em 1986, vendida à GE Capital IT Solutions por volta de 1996, e faturando cerca de US$ 500 milhões por ano em 1999.", became: "A divisão Comstor, e é por isso que a empresa combinada leva os dois nomes até hoje." },
      { what: "Uma distribuidora Cisco no Reino Unido, adquirida em setembro de 1998.", became: "O início da especialização em Cisco que a Comstor completou um ano depois." },
    ],
    // Profile: complete copy of profiles/westcon-comstor.ts; years, companies, founders and personal markers untouched.
    profile: {
      // Same slug as the English profile.
      slug: "westcon-comstor",
      // Founding stories: place (geography localised) and story translated; company, year and founders verbatim.
      foundings: [
        {
          company: "Westcon Associates",
          year: 1985,
          place: "interior do estado de Nova York",
          founders: ["Thomas Dolan", "Philip Raffiani", "Roman Michalowski"],
          story: "Três pessoas numa garagem, a origem padrão de uma empresa de software e uma origem incomum para uma distribuidora, um negócio que normalmente exige um armazém e uma linha de crédito antes de qualquer outra coisa. O que eles vendiam não era estoque, mas acesso: saber quais revendas precisavam de quais produtos, num mercado em que ninguém ainda tinha organizado isso.",
        },
      ],
      // Timeline: same order and years as the English; prose translated.
      timeline: [
        { year: 2003, title: "Profundidade, não amplitude", detail: "Uma manchete da imprensa do setor naquela época resumiu a estratégia em quatro palavras, e ela ainda é a declaração mais clara do que separa este tipo de distribuidora das casas de linha ampla. Trabalhar com menos fabricantes, com mais profundidade, significa que o engenheiro de vendas consegue de fato responder à pergunta, e significa que a distribuidora está apostando o negócio nos fabricantes que escolheu." },
        { year: 2026, title: "Acima de três bilhões", detail: "Vendas brutas anuais acima de US$ 3 bilhões só do lado da Datatec, com o negócio das Américas operando sob outro controle desde 2017: uma marca atuando em dois hemisférios sob dois donos, algo incomum o bastante para confundir quem trabalha num deles." },
      ],
      // Products: descriptor words localised (brand names verbatim), descriptions translated.
      products: [
        { name: "Distribuição de redes e comunicações unificadas", what: "A linha original da Westcon: os fabricantes cujos equipamentos as revendas instalam, e não aqueles cujos produtos os usuários finais compram na prateleira." },
        { name: "Distribuição de segurança", what: "A categoria que mais cresceu e a que mais combina com a distribuição especializada, porque um firewall não é uma compra que uma revenda consegue atender sem entendê-lo." },
        { name: "Comstor", what: "A prática Cisco, mantida como marca própria por um quarto de século depois da aquisição. Isso é incomum e deliberado: para o canal, o nome significa um fabricante, e diluí-lo na controladora teria jogado fora a única coisa pela qual ela foi comprada." },
        { name: "Capacitação e treinamento de parceiros", what: "Cursos voltados para aquilo que as revendas ainda não conseguem vender, um programa diferente do do próprio fabricante; e, como o registro acima observa, um indicador melhor de onde o mercado de fato está travado." },
        { name: "Serviços e marketplace de nuvem", what: "Implantação, suporte e provisionamento de assinaturas vendidos a revendas que não conseguem manter equipe para essas funções. É aqui que uma distribuidora deixa de ser logística e passa a ser capacidade." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "Especializar-se por fabricante, e não por categoria", detail: "Esta linha do tempo agora tem três modelos de distribuidora lado a lado. A casa de linha ampla trabalha com tudo e compete em escala. A ScanSource se especializou por categoria, pegando produtos no caminho para virarem commodity. Esta se especializou por fabricante, construindo uma prática profunda em torno de um pequeno número de fabricantes: o modelo que serve a produtos complexos com ciclos de venda longos, e o mais exposto se um fabricante escolhido vacilar." },
        { title: "Manter a marca adquirida", detail: "A Comstor continuou Comstor. Num canal em que a prática Cisco de uma revenda é uma parte distinta do negócio, com equipe distinta e certificações distintas, uma marca de distribuidora que significa Cisco vale mais do que o nome da controladora. A maioria dos compradores não resiste a consolidar uma marca; a disciplina aqui esteve em não fazer isso." },
        { title: "Ser o motivo de um produto ser comprável", detail: "O ponto que o registro acima levanta merece ser dito como modelo de negócios, e não como consequência. Uma distribuidora especializada vende a um fabricante a capacidade de ser cotado num país: não vendas, mas presença no conjunto de coisas que uma revenda local consegue propor na prática. Os fabricantes pagam por isso porque a alternativa é estar tecnicamente disponível e comercialmente invisível." },
      ],
      // Markets: same number of entries as the English.
      markets: [
        "Revendas, integradores e provedores de serviços gerenciados, na Europa, no Oriente Médio, na África e na Ásia-Pacífico do lado da Datatec, e nas Américas sob controle separado. O cliente é sempre o parceiro, e não o usuário final, e isso molda tudo na forma como o negócio é conduzido.",
        "Concorre com as distribuidoras de linha ampla em disponibilidade e com outras especialistas em profundidade, e seu risco estrutural é a concentração: um portfólio construído sobre um pequeno número de fabricantes fica exposto a qualquer um deles mudar sua estratégia de canal.",
      ],
      // Analyst: same number of entries as the English.
      analyst: [
        "A distribuição é avaliada pelas autorizações dos fabricantes, pela cobertura geográfica e pela profundidade do programa de parceiros, e não pelas métricas que se aplicam a empresas de produto, e por essas medidas esta está entre as especialistas estabelecidas em redes e segurança.",
        "O fato estrutural com que vale terminar é o que este negócio de fato possui. Os principais ativos de uma distribuidora especializada são autorizações, contratos que concedem o direito de vender os produtos de um fabricante em territórios definidos, e elas ficam a critério do fabricante e podem ser revogadas mediante aviso. Nenhum outro negócio desta linha do tempo tem seu ativo central nas mãos de outra pessoa. É por isso que a relação com um pequeno número de fabricantes é administrada com tanto cuidado, e é por isso que o modelo de especialista profundo é ao mesmo tempo a posição mais forte da distribuição e a menos possuída.",
      ],
    },
  },
};
