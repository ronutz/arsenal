// ============================================================================
// src/content/vendors/overlays/pt-BR/shard-5.ts
// ----------------------------------------------------------------------------
// pt-BR INDUSTRY OVERLAYS, SHARD 5 of 8 (translation pass planned 2026-10-25;
// see the round 2 TRANSLATION-PLAN). One shard per translator, so parallel
// work never edits the same file. Each entry is keyed by record slug and holds
// ONLY translated prose (PartnerVendorOverlay); facts stay in partners.ts and
// profiles/*.ts. Check with: npx tsx scripts/report-industry-translation.mts --strict
//
// Records assigned to this shard (~27,009 words):
// access-home-fleet, adistec, algosec, arcsight, arm, asus-askey, aws,
// brazilian-market-reserve, brocade-broadcom, cesar, cipher, compugraf,
// contacta, dolch, emc, fatec, ihc-group, ironport, italtel, ixia-keysight,
// ka-solution, kentik, kyndryl, logrhythm, lumen-centurylink-level3, micom,
// microsoft, mitre, netskope, nic-br, ntsec, orange, paradyne, prodam, q13,
// rand, salesforce, siemens, symantec, tenable, texas-instruments, trtec,
// versim, xilinx, ziva, zscaler
// ============================================================================

import type { PartnerVendorOverlay } from "@/content/vendors/localized";

/** Translated prose for this shard's records, keyed by slug. */
export const SHARD_5: Record<string, PartnerVendorOverlay> = {
  // access-home-fleet: record prose plus the complete translated profile.
  "access-home-fleet": {
    // Card title (company kept verbatim), tagline and intro.
    name: "A frota de acesso e residencial - Netgear, TP-Link, Zyxel, Asus & Askey, Allied Telesis",
    tagline: "As caixas que todo mundo realmente tem: o primeiro hop da maioria dos pacotes da Terra, contado como uma frota só.",
    intro:
      "Cinco nomes, uma camada: o CPE e o equipamento SOHO que levaram as redes para cômodos comuns. As raízes da Netgear como spin-off da Bay Networks, a coroa de embarques da TP-Link por mais de uma década, o pedigree da Zyxel na era dos modems, a dupla varejo e ODM de ASUS e Askey, e a Allied Telesis segurando a borda de acesso desde 1987, mais a geopolítica de 2024 que a escala acaba atraindo.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O perfil conta as cinco fundações, as viradas da malha e do gerenciamento em nuvem, a cultura do firmware de entusiastas, a frota invisível de ODM para operadoras e por que esta camada é ao mesmo tempo o campo de provas da indústria e a sua maior superfície de ataque.",
    ],
    // Complete profile copy: facts verbatim from profiles/access-home-fleet.ts, prose translated.
    profile: {
      slug: "access-home-fleet",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "Allied Telesis (founded as Allied Telesyn)",
          year: 1987,
          place: "Tóquio, Japão",
          founders: ["Takayoshi Oshima"],
          story:
            "A empresa mais discreta deste verbete é a que entrega redes de acesso há mais tempo. A Allied Telesyn de Takayoshi Oshima (rebatizada Allied Telesis em 2006) construiu a camada sem glamour: conversores de mídia ligando fibra e cobre, switches de acesso confiáveis e o tipo de equipamento que governos, hospitais e plantas industriais padronizam e depois esquecem por uma década, o que, em redes de acesso, é o maior elogio possível.",
        },
        {
          company: "Zyxel Communications",
          year: 1989,
          place: "Hsinchu, Taiwan",
          founders: ["Shun-I Chu"],
          story:
            "A Zyxel fez o nome na guerra dos modems (o U-1496 era a caixa de 14.4k dos conhecedores na era das BBS do começo dos anos noventa) e depois surfou a transição para o DSL com mais força do que quase todo mundo: os roteadores Prestige ficavam na ponta das linhas telefônicas em todos os continentes enquanto a última milha virava banda larga. A empresa que começou fazendo a conexão discada cantar hoje vende redes gerenciadas pela nuvem (Nebula) e gateways de segurança, um dos poucos nomes de CPE com uma linha ininterrupta da era acústica até o presente.",
        },
        {
          company: "ASUS - and Askey, its carrier-side shadow",
          year: 1989,
          place: "Taipé, Taiwan",
          founders: ["T.H. Tung", "Ted Hsu", "Wayne Hsieh", "M.T. Liao"],
          story:
            "Quatro ex-engenheiros da Acer fundaram a ASUS como fabricante de placas-mãe e a transformaram num pilar da indústria de PCs; a sua linha de roteadores virou algo mais raro, o padrão dos entusiastas, com a série RT ganhando uma comunidade dedicada de firmware de terceiros (as builds Merlin) que trata um roteador doméstico como plataforma. A metade menos visível da história é a Askey (fundada em 1989, uma empresa do ASUS Group): o ODM cujos gateways e CPE de set-top são entregues aos milhões com os logotipos das próprias operadoras; a mesma linhagem de engenharia, um selo que você escolheu e outro que não escolheu.",
        },
        {
          company: "Netgear",
          year: 1996,
          place: "San Jose, Califórnia (fundada dentro da Bay Networks)",
          founders: ["Patrick Lo"],
          story:
            "A Netgear começou em janeiro de 1996 como a aposta de Patrick Lo, incubada dentro da Bay Networks, de que os gigantes das redes estavam ignorando as casas e os pequenos escritórios, e os pequenos switches não gerenciáveis de metal azul que vieram depois se tornaram os objetos mais reconhecíveis da categoria, ligados em armários e mesas pelo planeta inteiro. Independente da controladora e de capital aberto em 2003, a Netgear continuou batizando as eras do consumo: Nighthawk para a era dos roteadores gamer, Orbi (2016) para a malha e Arlo, separada em 2018, para a era da câmera na varanda que ela começou sem querer.",
        },
        {
          company: "TP-Link",
          year: 1996,
          place: "Shenzhen, China",
          founders: ["Zhao Jianjun (Cliff Chao)", "Zhao Jiaxing"],
          story:
            "Dois irmãos batizaram a empresa em homenagem ao link de par trançado e depois executaram ao máximo a estratégia mais simples da indústria: fazer a caixa boa o suficiente, fazê-la espantosamente barata e fazer todas elas. A TP-Link é a número um mundial em Wi-Fi de consumo por unidades embarcadas há mais de uma década de trimestres consecutivos, o roteador padrão estatístico da Terra, enquanto a Omada construiu a sua linha corporativa e a Deco a levou para a malha. Uma escala tão grande acaba virando geopolítica: em 2024, a empresa dividiu a sua estrutura societária, com a TP-Link Systems sediada em Irvine, na Califórnia, em meio a um escrutínio do governo dos EUA, segundo a imprensa, sobre a posição de mercado e a postura de segurança da marca.",
        },
      ],
      // Timeline: same years, same order, same personal markers.
      timeline: [
        { year: 1992, title: "A escolha dos conhecedores de modem", detail: "O U-1496 da Zyxel vira o modem dos sonhos da era das BBS (baseado em DSP, com firmware atualizável, mais rápido na prática do que a sua especificação), o primeiro sinal de que uma fabricante taiwanesa de CPE podia superar em engenharia os nomes conhecidos." },
        { year: 1996, title: "Dois padrões são fundados", detail: "A Netgear (dentro da Bay Networks) e a TP-Link (em Shenzhen) começam no mesmo ano, mirando o mesmo comprador negligenciado a partir de pontas opostas da cadeia de suprimentos, e juntas vão acabar em mais mesas e prateleiras do que todos os outros fabricantes desta enciclopédia somados." },
        { year: 2003, title: "A Netgear anda sozinha", detail: "De capital aberto na NASDAQ e livre do destino da sua incubadora (a Bay Networks tinha desaparecido dentro da Nortel), a Netgear vira a empresa independente de referência em redes de consumo da década da banda larga." },
        { year: 2011, title: "A coroa dos embarques", detail: "A TP-Link chega ao topo do ranking de embarques de WLAN de consumo da IDC e simplesmente fica lá, trimestre após trimestre, por mais de uma década: a posição de número um menos disputada das redes.", sourceNote: "Rankings de embarques de WLAN de consumo da IDC, sustentados do começo dos anos 2010 em diante." },
        { year: 2016, title: "A malha chega ao grande público", detail: "O Orbi da Netgear e o Deco da TP-Link fazem da malha para a casa inteira uma categoria de varejo; o roteador solitário piscando no armário do corredor vira uma constelação." },
        { year: 2018, title: "A Arlo é separada", detail: "A Netgear abre o capital do seu negócio de câmeras como Arlo: a divisão de casa inteligente nascida por acaso vira uma empresa de capital aberto própria, um lembrete de que o gateway doméstico é uma cabeça de ponte, e não um ponto final." },
        { year: 2024, title: "A escala encontra a geopolítica", detail: "A TP-Link se reestrutura (a TP-Link Systems, sediada em Irvine, na Califórnia, separada societariamente da origem em Shenzhen) em meio a investigações dos EUA sobre a marca, segundo a imprensa. No momento em que isto é escrito, esse escrutínio é noticiado, não julgado; fica registrado aqui como a questão em aberto que é.", sourceNote: "Separação societária nos EUA e escrutínio do Departamento de Comércio e do Departamento de Justiça segundo noticiário público do fim de 2024; nenhuma decisão até o momento em que isto é escrito." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "O switch não gerenciável e o roteador doméstico", what: "A caixa de metal azul da Netgear, o TP-Link WR841 e o seu milhão de descendentes, o gateway DSL da Zyxel: os dispositivos que levaram 'redes' para cômodos comuns." },
        { name: "A plataforma dos entusiastas", what: "Os roteadores ASUS da série RT e a comunidade do firmware Merlin: a prova de que o CPE doméstico consegue sustentar um ecossistema de software de verdade." },
        { name: "A frota invisível", what: "Os gateways de operadora da Askey e os switches de acesso e conversores de mídia da Allied Telesis: o equipamento que é entregue com outros nomes ou sem alarde nenhum, e que discretamente supera tudo em número." },
      ],
      // Innovations.
      innovations: [
        { title: "Bom o suficiente, em todo lugar", detail: "A contribuição desta camada não é um protocolo: é a disciplina de atingir o preço em que a rede vira um objeto doméstico padrão. A onipresença é um recurso, e estas empresas a projetaram." },
        { title: "A casa como rede gerenciada", detail: "Sistemas em malha, painéis em nuvem (Nebula, Omada) e configuração centrada em aplicativo importaram ideias corporativas (controladoras, telemetria, zero-touch provisioning) para apartamentos, uma década depois de as empresas terem pago dez vezes mais por elas." },
      ],
      // Markets, same entry count.
      markets: [
        "A borda de acesso de tudo: casas, pequenos escritórios, CPE de operadoras, acesso em campus, plantas industriais. Estatisticamente, o primeiro hop da maioria dos pacotes da Terra pertence a uma empresa deste verbete, e o primeiro roteador que qualquer pessoa desta profissão configurou provavelmente também.",
      ],
      // Analyst standing, same entry count.
      analyst: [
        "A frota SOHO é onde as ideias da indústria viram universais ou ficam de nicho: gerações de Wi-Fi, malha, gerenciamento em nuvem e transições de WPA se provam todas aqui, em escala, em hardware comprado pelo preço de um jantar.",
        "É também a maior superfície de ataque da indústria (credenciais padrão, firmware abandonado e recrutamento para botnets acontecem nesta camada), e é por isso que o trabalho de hardening e de fingerprinting volta sempre ao humilde gateway doméstico.",
      ],
    },
    // Lineage note (PRIME ruling 2, 26/10/2026): what this card covers.
    lineageNote: "Cinco nomes de equipamentos de acesso e residenciais contados como uma frota só; cada um tem seu próprio cartão aqui, com sua própria situação.",
  },

  // adistec: record prose.
  "adistec": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Adistec - distribuição pensada para uma região, não para um país",
    tagline: "Distribuidora de valor agregado para a América Latina e o Caribe, fundada em 2002, com sede em Miami.",
    intro:
      "A Adistec é uma distribuidora de valor agregado que atende a América Latina e o Caribe a partir de Miami, fundada em 2002, com linhas de cibersegurança, redes, storage, virtualização, nuvem e data center.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Miami como sede de uma distribuidora latino-americana não é um acaso de preferência. É onde uma empresa consegue manter dólares, comprar de fabricantes dos Estados Unidos em condições dos Estados Unidos e vender para uma dúzia de jurisdições com regimes tributários e regras de importação diferentes, e isso é a maior parte do que a distribuição de valor agregado realmente é, deixado o marketing de lado.",
      "A outra metade é a capacitação, e os anúncios da empresa dizem isso com todas as letras: ativação de parceiros, treinamento técnico e comercial, geração de demanda. Uma distribuidora desse tipo não está, antes de tudo, movendo caixas; está fabricando a capacidade das revendas que vão movê-las, porque um fabricante sem parceiros locais certificados não tem mercado, por melhor que seja o produto.",
    ],
  },

  // algosec: record prose.
  "algosec": {
    // Card title (company kept verbatim), tagline and intro.
    name: "AlgoSec - a política do ponto de vista da aplicação",
    tagline: "Pergunta a que aplicação uma regra serve, justamente a pergunta que a regra não registra.",
    intro:
      "A AlgoSec trabalha nos mesmos ambientes que o resto deste grupo e enquadra o problema de outro jeito: em vez de partir da regra, parte da aplicação e pergunta de que conectividade essa aplicação precisa. O próprio material da empresa descreve a automação da conectividade de aplicações ao lado da política de segurança.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A AlgoSec foi fundada por Yuval Baron, o seu CEO, e Avishai Wool, o seu CTO: em 2004, pelo relato da própria empresa, em 2003, pelo currículo do próprio Wool e pelo Globes. A tecnologia central é anterior à empresa: Wool, que criou o seu Firewall Analyzer, tinha sido membro do corpo técnico do Secure Systems Research Department da Bell Labs de outubro de 1996 a março de 2000, e depois cofundou a Lumeta, que começou em 2000 como startup interna da Lucent. Baron vinha da Comverse e da RAD Data Communications e tinha cofundado a Actelis Networks em 1999.",
      "O problema que ela ataca é um que todo ambiente de vida longa tem e poucas organizações admitem. Um conjunto de regras de firewall se acumula: regras são acrescentadas para um projeto, uma exceção, uma migração, um fornecedor, e quase nenhuma é removida, porque ninguém consegue provar o que quebraria. Depois de uma década, a base de regras é um registro de cada decisão que a organização tomou e a explicação de nenhuma delas.",
      "O que a categoria faz é transformar isso em algo que se pode responder. Quais regras não são usadas, quais são encobertas por outras, quais permitem mais do que a política autoriza, e o que uma mudança proposta realmente abriria: perguntas triviais de formular e impossíveis de responder lendo, quando a contagem passa de alguns milhares, espalhados por vários fabricantes.",
      "O detalhe que vale guardar é financeiro, não técnico: a empresa funcionou com recursos próprios durante catorze anos antes de aceitar investimento externo. Uma empresa só consegue isso se os clientes pagam cedo e continuam pagando, o que diz mais sobre quanto o problema dói do que qualquer dimensionamento de mercado diria. Categorias sem glamour, com dor operacional genuína, não precisam de venture capital para encontrar compradores.",
    ],
  },

  // arcsight: record prose plus the complete translated profile.
  "arcsight": {
    // Card title (company kept verbatim), tagline and intro.
    name: "ArcSight",
    tagline: "Decidiu de antemão o que importava, o contrário do que a sua principal rival decidiu.",
    intro:
      "A ArcSight foi constituída em Delaware em 3 de maio de 2000 com o nome Wahoo Technologies, e rebatizada antes de lançar qualquer coisa. Hugh Njemanze foi o seu CTO fundador e é o único nome em que todos os relatos concordam: ele já foi descrito como o arquiteto inicial do security information and event management e tem mais de vinte patentes na área. Alex Daly aparece como CEO fundador. Outras fontes citam outros fundadores, e elas não se conciliam, então só os nomes consistentes aparecem aqui.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Vale dizer em termos simples o problema que ela existia para resolver. Uma rede grande produz milhões de linhas de log por dia, vindas de firewalls, servidores, aplicações e sensores de intrusão, cada uma no seu formato, e nenhuma significa nada sozinha. Um login que falhou é ruído. Quatrocentos logins que falharam a partir de um mesmo endereço, seguidos de um que deu certo, seguido de uma transferência para fora, são um incidente. Alguém precisa notar a diferença às três da manhã.",
      "A resposta da ArcSight foi o ESM, e a arquitetura é a parte interessante. Ele normalizava primeiro cada evento num esquema comum, de modo que uma negação de um Cisco e uma falha de auditoria do Windows virassem objetos comparáveis, e depois rodava regras de correlação sobre esse fluxo. As regras codificam o que você já sabe que importa. É um compromisso real: você decide de antemão como é um incidente, e o sistema fica vigiando por ele o tempo todo.",
      "Ponha isso ao lado do Splunk, que também está nesta linha do tempo, e você tem duas apostas opostas. O Splunk indexava os dados brutos e deixava pesquisá-los depois, decidindo o que importava quando houvesse um motivo para perguntar. A ArcSight decidia primeiro e vigiava. Regras pegam o que você previu, no momento em que acontece; a pesquisa encontra o que você não previu, depois que você sabe onde olhar. Nenhuma das duas está errada, e a maioria das equipes de segurança maduras acaba rodando um pouco de cada, mas os dois designs puxaram o mercado em direções diferentes durante uma década.",
      "O apoio financeiro da empresa é um detalhe que vale notar: ao lado da Kleiner Perkins, entre os primeiros investidores estava a In-Q-Tel, o braço de venture capital da CIA. Abriu capital em 2008 e, no ano fiscal de 2010, informava US$ 181,4 milhões de receita, vindos de mais de mil clientes, com 512 funcionários, depois de crescer cerca de quarenta por cento ao ano.",
      "A HP a adquiriu em 2010 a US$ 43,50 por ação, tudo em dinheiro, cerca de US$ 1,5 bilhão, com conclusão em 22 de outubro. Depois, a cadeia de donos que esta linha do tempo não para de produzir: a divisão da HP em 2015 a mandou para a Hewlett Packard Enterprise; a HPE fundiu o seu negócio de software com a Micro Focus, operação concluída em 1º de setembro de 2017; e a OpenText adquiriu a Micro Focus em 2023. Quatro donos em treze anos, nenhum dos quais a escreveu.",
      "E esse é o contraste que faz valer a pena ler as duas juntas. O Splunk ficou independente por duas décadas e foi comprado pela Cisco em 2024, por cerca de US$ 28 bilhões, como peça central estratégica. A ArcSight foi comprada cedo e depois carregada por mais três transações como uma linha no portfólio de outra empresa. Mesmo mercado, mesma época, conquista técnica comparável, e a diferença no desfecho teve muito mais a ver com o momento em que cada uma vendeu do que com qual arquitetura era melhor.",
      "Njemanze passou depois a comandar a engenharia e a pesquisa do grupo de segurança corporativa da HP e, mais tarde, tornou-se CEO da ThreatStream, que virou a Anomali.",
    ],
    // Ending note (the year stays in the English record).
    endedNote:
      "Adquirida pela HP por cerca de US$ 1,5 bilhão, com conclusão em 22 de outubro de 2010. A linha de produtos passou depois à HPE na divisão de 2015, à Micro Focus em 1º de setembro de 2017 e à OpenText em 2023: quatro donos em treze anos.",
    // Successor link label (the URL stays in the English record).
    successorLabel:
      "OpenText, que detém o portfólio ArcSight",
    // Complete profile copy: facts verbatim from profiles/arcsight.ts, prose translated.
    profile: {
      slug: "arcsight",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "ArcSight",
          year: 2000,
          place: "Cupertino, Califórnia",
          founders: [],
          story:
            "Alex Daly, o CEO fundador, chegou depois de ter comandado a Cygnus Solutions, a empresa que comercializou as ferramentas GNU e foi comprada pela Red Hat. É um histórico relevante para o problema: a Cygnus vendia suporte e integração em torno de software que todo mundo já tinha, e o problema dos eventos de segurança também é o de tornar útil a saída de outros sistemas.",
          sourceNote:
            "As atribuições de fundadores variam muito entre as fontes e não são conciliadas aqui; o cargo anterior de Daly é o único detalhe relatado de forma consistente.",
        },
      ],
      // Timeline: same years, same order, same personal markers.
      timeline: [
        { year: 2003, title: "Visionária num quadrante sem líderes", detail: "O Gartner a pôs como visionária na sua avaliação de gerenciamento de segurança de TI daquele ano, na qual ninguém foi posto como líder. A categoria era nova demais para alguém tê-la liderado, a declaração mais clara possível de quão cedo aquilo era." },
        { year: 2008, title: "A única", detail: "Estreou na NASDAQ em 14 de fevereiro, a única empresa do Vale do Silício a fazê-lo naquele ano, em plena crise financeira. Tom Reilly tornou-se CEO no mesmo ano." },
        { year: 2013, title: "Dez anos como líder", detail: "Em maio, já estava havia dez anos consecutivos na área de líderes do Magic Quadrant de SIEM: uma década no topo de uma categoria pela invenção da qual tinha sido chamada de visionária." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "ESM", what: "O Enterprise Security Manager: normalizar cada evento num só esquema e depois rodar regras de correlação sobre o fluxo combinado. A normalização é a metade sem glamour, e o motivo de a correlação ser possível." },
        { name: "Connectors", what: "Os parsers de cada dispositivo de origem, e o verdadeiro fosso. Suportar os formatos de log de centenas de produtos são anos de trabalho tedioso que um concorrente precisa repetir por inteiro, e é por isso que a posição de incumbente nesta categoria é duradoura." },
        { name: "Logger", what: "Armazenamento de longo prazo dos eventos brutos para conformidade e investigação, vendido ao lado do motor de correlação porque auditores e analistas querem coisas diferentes dos mesmos dados." },
        { name: "Detecção de ameaças e SOAR", what: "Acréscimos posteriores, incluindo resposta automatizada, parte deles adquirida: a mesma consolidação que todo fabricante deste mercado fez." },
      ],
      // Innovations.
      innovations: [
        { title: "Normalizar antes de analisar", detail: "Decidir que todo evento de todo dispositivo seria traduzido para um só esquema antes de qualquer coisa olhar para ele é o compromisso arquitetural em que o produto se apoia. É caro, precisa ser mantido para cada dispositivo que um dia muda o formato do seu log, e é o que permite a uma regra raciocinar sobre um firewall e um servidor de diretório na mesma frase." },
        { title: "A cobertura de conectores como o verdadeiro produto", detail: "O motor de correlação é o que os clientes compram, e a biblioteca de conectores é o que os mantém. Qualquer concorrente consegue escrever um motor de regras; ninguém quer refazer os parsers de quatrocentos dispositivos. É um fosso feito inteiramente de trabalho de que ninguém gosta." },
        { title: "Criar uma categoria pelo lado do comprador", detail: "Ser chamada de visionária num quadrante sem líderes é a cara que a criação genuína de uma categoria tem no gráfico de um analista: os compradores tinham o problema, os analistas tinham o segmento, e ninguém ainda tinha construído algo que estivesse disposto a chamar de pronto." },
        { title: "Vender primeiro às organizações com o pior problema", detail: "A estratégia eram as contas de ponta no varejo e nos serviços financeiros, os setores com mais obrigações regulatórias e mais a perder. Começar onde a dor é maior financia a engenharia, e também define para sempre a forma do produto: aquilo nunca seria um software que uma empresa pequena conseguisse operar." },
      ],
      // Markets, same entry count.
      markets: [
        "Grandes empresas e governo, com viés para setores regulados desde o início. Informava mais de mil clientes antes da aquisição pela HP, e a sua base instalada é o motivo de o produto ter sobrevivido a três trocas de dono posteriores.",
        "Os concorrentes eram os outros fabricantes pioneiros de SIEM e, estruturalmente, a arquitetura oposta, que esta linha do tempo registra no Splunk. Os entrantes posteriores, incluindo as plataformas cloud-native, competem no custo de ingestão, que é o eixo em que um design de normalizar tudo fica menos à vontade.",
      ],
      // Analyst standing, same entry count.
      analyst: [
        "Dez anos consecutivos na área de líderes do Magic Quadrant de SIEM estão entre as sequências mais longas de qualquer categoria de segurança, e cobrem exatamente o período entre a invenção da categoria e a sua comoditização.",
        "A posição atual é mais difícil de enunciar, porque o que se avalia hoje é uma linha de produtos dentro de um grande portfólio de software, e não uma empresa. Esse é o fim honesto deste verbete: a tecnologia ainda é vendida, ainda é implantada e ainda é mantida, e desde 2010 não houve ninguém para quem ela fosse o negócio principal.",
      ],
    },
  },

  // arm: record prose.
  "arm": {
    // Parent note (official.parent.note), added 26/10/2026 with the parents apply; name, slug and year stay English facts.
    parentNote: "Listada na Nasdaq desde 2023, mas controlada pelo SoftBank Group, que detinha cerca de 86,4% das ações em maio de 2026.",
    // Card title (company kept verbatim), tagline and intro.
    name: "Arm - o processador que quase ninguém compra da Arm",
    tagline: "Formada em 1990; licencia uma arquitetura de processador em vez de vender processadores.",
    intro:
      "A Arm foi formada em 1990 como joint venture e vende algo incomum: não chips, mas o direito de fabricá-los. Empresas licenciam os seus projetos de processador, acrescentam a própria lógica e mandam outra empresa fabricar o resultado.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A consequência aparece em quase todo dispositivo que este site descreve. O processador de gerência dentro de um switch, o controlador de uma placa de rede, a unidade de processamento de dados que faz criptografia numa placa, o access point no teto: boa parte deles roda um núcleo Arm que o fabricante do equipamento licenciou, e não comprou.",
      "É a terceira separação no arranjo que os marcos de fabricação registram. A fabricação já tinha sido separada do projeto pela foundry; depois, a arquitetura foi separada das duas. Um fabricante pode licenciar um núcleo, acrescentar a própria lógica de processamento de pacotes, mandar uma foundry fabricá-lo e um fabricante contratado montar o produto, sem ser dono de nenhuma dessas quatro coisas.",
      "Esse modelo também explica por que a arquitetura se espalhou como se espalhou. Uma empresa que vende chips compete com os clientes quando eles querem fazer os seus próprios; uma empresa que vende licenças, não, e assim quem estava mais bem posicionado para projetar silício especializado não tinha motivo para procurar outra opção.",
    ],
  },

  // asus-askey: record prose plus the complete translated profile.
  "asus-askey": {
    // Card title (company kept verbatim), tagline and intro.
    name: "ASUS + Askey",
    tagline: "O império das placas-mãe e o seu braço de comunicações de rede.",
    intro:
      "A ASUS nasceu como a startup de placas-mãe de quatro ex-engenheiros da Acer, em 1989, e virou a quinta maior fabricante de PCs do mundo; a Askey, fundada no mesmo ano e depois integrada ao ASUS Group, é o ODM invisível por trás de décadas de modems, gateways e CPE 5G de operadoras, com escritórios que incluem o Brasil.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Consolidadas num único perfil, conforme a realidade societária: a gigante de sistemas com marca própria e a máquina de hardware de acesso white-label, um só grupo, duas fundações em Taipé em 1989.",
    ],
    // Complete profile copy: facts verbatim from profiles/asus-askey.ts, prose translated.
    profile: {
      slug: "asus-askey",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "ASUS (ASUSTeK Computer)",
          year: 1989,
          place: "Taipé, Taiwan",
          founders: ["Ted Hsu", "M.T. Liao", "Wayne Tsiah", "T.H. Tung"],
          story:
            "Quatro engenheiros de hardware deixaram a Acer para construir a empresa de placas-mãe que achavam que Taiwan merecia, batizada em homenagem a Pegasus, sem as três primeiras letras, para que o nome continuasse aparecendo perto do topo de um catálogo. A ASUS ganhou a reputação do jeito pouco glamoroso: placas que rodavam corretamente o silício mais novo da Intel, às vezes antes dos próprios projetos de referência da Intel. A confiança nas placas-mãe se multiplicou em laptops, servidores, celulares e na linha Republic of Gamers, levando a empresa ao grupo das cinco maiores fabricantes de PCs do mundo: um império que começou acertando as trilhas do chipset.",
          sourceNote:
            "Data de fundação e fundadores segundo o registro da empresa na Wikipedia (que também lista Luca D.M. entre os fundadores); 'fifth-largest PC vendor' (quinta maior fabricante de PCs) segundo a citação de participação de mercado do mesmo registro.",
        },
        {
          company: "Askey Computer",
          year: 1989,
          place: "Taipé, Taiwan",
          founders: [],
          story:
            "Fundada no mesmo ano que a ASUS e depois incorporada ao grupo, a Askey ficou com a metade invisível do negócio de redes: o lado ODM. Se você alugou um cable modem, um gateway DSL ou um set-top box de operadora ao longo de três décadas, na América do Norte, na Europa ou no Brasil, onde a Askey mantém escritório, há uma boa chance de que a Askey o tenha fabricado, qualquer que fosse a marca na etiqueta. O portfólio acompanhou a própria rede de acesso: modems analógicos, depois DOCSIS e DSL, depois CPE Wi-Fi, e agora unidades 5G de acesso fixo sem fio e small cells de 5G privado.",
          sourceNote:
            "Ano de fundação e participação no ASUS Group segundo os materiais da própria Askey e registros de expositores; o registro da empresa no Golden data a aquisição pela Asus em 2006. Os nomes dos fundadores não aparecem de forma consistente nas fontes públicas e ficam sem menção, em vez de serem adivinhados.",
        },
      ],
      // Timeline: same years, same order, same personal markers.
      timeline: [
        { year: 1989, title: "Duas fundações em Taipé", detail: "A ASUS começa com placas-mãe; a Askey começa com modems: as metades com marca e white-label do que vira um único grupo." },
        { year: 1997, title: "A ASUS vai além da placa", detail: "Notebooks entram na linha; a fabricante de componentes vira uma empresa de sistemas, sem perder a coroa das placas-mãe para entusiastas." },
        { year: 2006, title: "A Askey entra no ASUS Group", detail: "A Askey passa a integrar o ASUS Group e ganha escala como ODM de comunicações de rede, com grandes operações de fabricação em Taiwan e em Suzhou.", sourceNote: "Ano da aquisição segundo o registro da empresa no Golden; os materiais da Askey descrevem a participação contínua na ASUSTeK." },
        { year: 2006, title: "Republic of Gamers", detail: "A ASUS lança a ROG, a submarca que transforma hardware para entusiastas numa identidade duradoura e puxa para cima as expectativas de todo o mercado de PCs para games." },
        { year: 2008, title: "O momento dos netbooks", detail: "A onda do Eee PC: a ASUS redefine por um tempo a categoria de portáteis baratos e demonstra a capacidade de criar mercados, não apenas de atendê-los." },
        { year: 2020, title: "A Askey surfa as transições do acesso", detail: "O portfólio de CPE abrange DOCSIS, xPON, Wi-Fi 6 e além, 5G de acesso fixo sem fio e small cells de 5G privado: o mesmo papel de construtora invisível, uma geração de acesso depois." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "Placas-mãe ASUS / ROG", what: "As linhas de placas para entusiastas e OEM que construíram a marca, e a submarca de games que a ampliou." },
        { name: "Sistemas ASUS", what: "Notebooks, desktops, servidores e equipamentos de rede: o portfólio completo de uma das cinco maiores fabricantes de PCs do mundo." },
        { name: "CPE de operadora Askey", what: "Cable modems e modems DSL, gateways residenciais, set-top boxes, unidades 5G FWA e small cells, fabricados em regime ODM para operadoras do mundo todo." },
      ],
      // Innovations.
      innovations: [
        { title: "Confiança como componente", detail: "A ASUS fez da placa-mãe, a parte menos visível e mais sujeita a falhas de um PC, uma marca que o consumidor pedia pelo nome; todo o arco do grupo decorre dessa confiança conquistada." },
        { title: "A máquina ODM do acesso", detail: "O papel da Askey é o segredo aberto da indústria: os terminais da rede de acesso são em grande parte fabricados por empresas de que ninguém ouviu falar, em escala, conforme a especificação de cada operadora, e a Askey é uma das maiores delas." },
      ],
      // Markets, same entry count.
      markets: [
        "A ASUS compete em PCs de consumo e corporativos, componentes e games; a Askey atende operadoras como ODM de comunicações de rede, com fabricação em Taiwan, na China e no Vietnã e escritórios que incluem o Brasil.",
      ],
      // Analyst standing, same entry count.
      analyst: [
        "Situadas entre as contemporâneas: a ASUS como uma das fabricantes duradouras do primeiro escalão da indústria de PCs, a Askey como o braço de redes do grupo e um lembrete de que boa parte do hardware de borda do mundo conectado é fabricada por ODMs. Consolidadas num único perfil, conforme o agrupamento que faz sentido societário.",
      ],
    },
  },

  // aws: record prose.
  "aws": {
    // Parent note (official.parent.note), added 26/10/2026 with the parents apply; name, slug and year stay English facts.
    parentNote: "Criada dentro da Amazon, não adquirida: a Amazon Web Services, Inc. é subsidiária integral da Amazon.com, Inc.",
    // Card title (company kept verbatim), tagline and intro.
    name: "Amazon Web Services",
    tagline: "A plataforma de nuvem que definiu a categoria.",
    intro:
      "A Amazon Web Services é a maior nuvem pública, a plataforma cujo lançamento do S3 e do EC2 em 2006 transformou a computação em utilidade pública e definiu o que a indústria hoje entende por nuvem.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A Red Education cita a AWS entre as principais marcas com que trabalha nas suas candidaturas a prêmios e entrega cursos AWS ao lado do seu portfólio de fabricantes de segurança, estendendo o mesmo formato conduzido por instrutor e baseado em laboratórios aos fundamentos e à arquitetura de nuvem.",
      "A AWS começou dentro da Amazon como encanamento de infraestrutura e foi aberta ao mundo em 2006; em uma década, era o motor de lucro da controladora e o substrato padrão de startups e grandes empresas. Todo currículo de SASE, de SSE e de segurança em nuvem no resto deste catálogo pressupõe, no fim das contas, um mundo que a AWS criou.",
      "Dois incidentes descrevem o que significa um único fornecedor deter tanto da computação do mundo, e o relato da própria empresa sobre o primeiro é a melhor fonte para ele. Na manhã de 28 de fevereiro de 2017, um engenheiro da região do norte da Virgínia, seguindo um playbook estabelecido, executou um comando destinado a remover alguns servidores de um subsistema de faturamento. Um parâmetro foi digitado errado. Entre os servidores removidos estavam os que guardavam o índice de todos os objetos do storage da região, e a reinicialização que se seguiu derrubou o S3, e com ele o lançamento de instâncias, o block storage e o Lambda para tudo o que dependia daquela região, o que na época era boa parte da internet de consumo. Um erro de digitação foi mais longe do que a maioria dos ataques jamais foi, e o motivo não foi o erro de digitação, mas a concentração.",
      "O segundo é o vazamento da Capital One em 2019, e é o caso em que o design do fornecedor fez parte da resposta. Uma pessoa que tinha trabalhado na AWS encontrou uma falha de request forgery num web firewall mal configurado rodando no EC2 e a usou para pedir credenciais ao serviço de metadados da instância. O serviço, na forma original, respondia a qualquer requisição vinda da máquina sem autenticação, por design. As credenciais pertenciam a um papel que podia ler centenas de buckets de storage, e mais de cem milhões de registros de clientes saíram. Durou quatro meses e foi descoberto porque a pessoa que atacou postou a respeito e um desconhecido percebeu.",
      "O modelo de responsabilidade compartilhada diz, corretamente, que o cliente configurou mal o firewall e deu permissões demais ao papel. Também é verdade que, quatro meses depois, a AWS lançou uma segunda versão do serviço de metadados que exige antes um token de sessão, uma mudança que só existe porque o primeiro design tornou a falha letal. Um senador perguntou ao CEO da empresa se os próprios serviços dela tinham contribuído, que é exatamente a pergunta que o modelo foi escrito para antecipar, sendo feita assim mesmo.",
      "A vida posterior dessa correção é a parte recorrente. O serviço de metadados reforçado é opcional; anos depois, uma grande parcela das instâncias ainda roda o original. O verbete da Siemens descreve uma correção que não consegue chegar à base instalada porque o equipamento não pode ser alterado. Aqui o equipamento pode ser alterado com uma configuração, e não é, porque o padrão nunca foi mudado, e uma correção que exige que cada cliente faça opt-in é, em escala, uma correção que metade deles não tem.",
      "Nada disso é um argumento contra a plataforma. É um argumento de que, quando um fornecedor vira o substrato de todo o resto, um comando digitado errado e um endpoint sem autenticação deixam de ser problemas desse fornecedor e passam a ser de todo mundo, e de que o modelo de responsabilidade que soa como uma divisão de trabalho é, na prática, uma descrição de quais falhas caem sobre quem.",
    ],
  },

  // brazilian-market-reserve: record prose.
  "brazilian-market-reserve": {
    // Card title (company kept verbatim), tagline and intro.
    name: "A reserva de mercado brasileira (Cobra, Scopus, Itautec)",
    tagline: "Uma política que fracassou no objetivo declarado e teve sucesso num que ninguém escreveu.",
    intro:
      "A Cobra (Computadores e Sistemas Brasileiros) foi fundada em 1974 e foi a primeira empresa brasileira a projetar, fabricar e vender computadores, chegando à produção comercial em 1976. Dez anos depois, a Lei 7.232, de 29 de outubro de 1984, transformou isso em política nacional: o mercado interno de equipamentos de informática ficou reservado a empresas de capital brasileiro, com um prazo de oito anos escrito na lei desde o início. Foi aprovada por unanimidade no Congresso.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O raciocínio era explícito, e não era tolo. O Brasil enfrentava uma crise de balanço de pagamentos e seguia uma estratégia de substituição de importações. O argumento era que, protegidas por uma década, as empresas nacionais construiriam capacidade genuína e depois poderiam competir abertamente, e o Japão e os Estados Unidos eram citados como precedentes de protecionismo que tinha dado certo. Academia, indústria, imprensa, governo e oposição apoiavam a lei.",
      "O argumento contra é substancial e deve vir primeiro, porque é o que costuma ficar de fora dos relatos nostálgicos. Livres da concorrência estrangeira, vários fabricantes não foram pioneiros; clonaram. Máquinas muito parecidas com produtos da Apple, da Tandy, da Atari e da Commodore apareceram com nomes brasileiros. A Scopus copiou o MS-DOS da Microsoft e o lançou como SISNE, o que lhe rendeu uma ameaça de processo por pirataria da Microsoft. Em 1985, os Estados Unidos acusaram formalmente o Brasil de práticas comerciais desleais e aplicaram retaliações. E entre 1989 e 1992, todas as fábricas de semicondutores do país fecharam ou foram embora. O contrabando era tão disseminado que uma operação policial que apreendeu máquinas contrabandeadas provocou revolta pública, e não aprovação.",
      "E o argumento a favor também tem números, e é por isso que a discussão nunca se encerrou. Entre 1984 e 1987, o mercado brasileiro de microcomputadores cresceu cerca de 7,4% ao ano, a maior taxa do mundo capitalista na época. As empresas nacionais passaram de 23% do mercado em 1979 para 40% em 1982. Os computadores instalados passaram de 1.200 unidades em 1974 para 23.200 em 1982.",
      "O número que mais importa para este site é outro. O emprego em informática e automação passou de cerca de 42.000 pessoas em 1984 para cerca de 74.000 em 1989. O que quer que aquelas empresas estivessem construindo, estavam contratando, treinando e puxando tecnologia pela economia, e uma geração de engenheiros brasileiros aprendeu o ofício dentro delas.",
      "Essa é a parte que sobreviveu à política. A lei expirou em 1992, como previsto, e a maioria dos fabricantes não sobreviveu ao contato com a concorrência aberta. Mas as pessoas sobreviveram, e foram para as distribuidoras, integradoras, operadoras e bancos que aparecem em outros pontos desta linha do tempo. Uma política industrial protecionista fracassou em construir uma indústria de computadores e teve sucesso em construir uma força de trabalho, que não era o seu objetivo declarado.",
      "Para onde as empresas foram é a segunda constatação, e não é coincidência. A Cobra foi adquirida pelo Banco do Brasil. A Scopus foi comprada pelo Bradesco e mais tarde passou para a IBM Brasil. A Itautec virou uma divisão do Itaú. A Microsiga mudou o nome para Totvs e foi para o software corporativo. Três dos maiores nomes sobreviventes foram absorvidos por bancos e se voltaram para a automação bancária, o que é parte substancial do motivo de a tecnologia bancária brasileira ter ficado tão avançada. Uma indústria de computadores protegida, incapaz de competir em hardware, foi reabsorvida pelos seus maiores clientes e ficou muito boa em exatamente uma coisa.",
      "Lido contra o resto desta linha do tempo, o padrão é conhecido e incômodo. Toda discussão sobre capacidade tecnológica nacional (quem a constrói, quem tem permissão para comprá-la, o que acontece com as pessoas formadas sob ela) é uma reprise desta, com outro vocabulário. O resumo honesto é que a política conseguiu algo real e não conseguiu aquilo para que existia, e que as duas metades costumam ser relatadas separadamente por quem prefere uma delas.",
      "Os marcos deste site trazem a mesma década vista do outro lado: a Irlanda a passou se oferecendo como o lugar onde os produtos de qualquer um seriam fabricados, enquanto esta política fechava um mercado para que os seus próprios fossem. As duas eram estratégias industriais deliberadas, e produziram indústrias opostas.",
    ],
    // Ending note (the year stays in the English record).
    endedNote:
      "A Lei de Informática tinha um prazo fixo de oito anos escrito desde o início e expirou em 1992. As empresas sobreviveram mudando o que fabricavam.",
  },

  // brocade-broadcom: record prose plus the complete translated profile.
  "brocade-broadcom": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Brocade & Foundry - a diáspora da Broadcom",
    tagline: "Dois pioneiros dos anos 1990, um desmembramento em 2017: SAN para a Broadcom, data center para a Extreme, campus e Wi-Fi para a CommScope.",
    intro:
      "A Brocade construiu o fabric Fibre Channel comutado que tornou possíveis as storage area networks; a Foundry lançou os primeiros switches gigabit Ethernet, de Camada 3 e de Camadas 4-7. As duas se fundiram em 2008, e em 2017 a Broadcom desmontou a combinação: o negócio de SAN ficou com a Broadcom, as linhas de data center derivadas da Foundry foram para a Extreme Networks, e o switching de campus mais o Wi-Fi Ruckus foram para a ARRIS e depois para a CommScope, com a Belden anunciada como a próxima dona em 2026.",
    // Accuracy note, claims kept exactly.
    note:
      "Nem eu nem a Red Education ministramos treinamento de Brocade ou de Broadcom. Esta página é história corporativa, verificada contra registros na SEC e fontes primárias. Uma conexão precisa: a Extreme Networks, que absorveu o portfólio de data center derivado da Foundry em 2017, é um dos fabricantes que eu sou autorizado a ensinar.",
    // Ending note (the year stays in the English record).
    endedNote:
      "A Brocade, que tinha se fundido com a Foundry em 2008, foi adquirida pela Broadcom em 17 de novembro de 2017; as suas redes de data center foram para a Extreme Networks, e o switching de campus e o Wi-Fi Ruckus para a ARRIS.",
    // Successor link label (the URL stays in the English record).
    successorLabel:
      "Broadcom",
    // Complete profile copy: facts verbatim from profiles/brocade-broadcom.ts, prose translated.
    profile: {
      slug: "brocade-broadcom",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "Brocade Communications Systems",
          year: 1995,
          place: "San Jose, Califórnia",
          founders: ["Seth Neiman", "Kumar Malavalli", "Paul R. Bonderson"],
          story:
            "Fundada em agosto de 1995 por um trio incomum: Neiman, investidor de venture capital, ex-executivo da Sun Microsystems e piloto profissional de automobilismo, que virou o primeiro CEO; Malavalli, coautor da própria especificação Fibre Channel; e Bonderson, ex-executivo da Intel e da Sun. O switch Fibre Channel SilkWorm chegou ao mercado no início de 1997, sobre o ASIC Stitch da própria Brocade, com um Fabric OS baseado em VxWorks, e a era das storage area networks ganhou a sua espinha dorsal. A Brocade abriu capital em 25 de maio de 1999.",
        },
        {
          company: "Foundry Networks",
          year: 1996,
          place: "Santa Clara, Califórnia",
          founders: ["Bobby R. Johnson, Jr.", "H. Earl Ferguson"],
          story:
            "Fundada em maio de 1996 por Johnson, que já tinha fundado a fabricante de switches de LAN Centillion Networks, com Ferguson como CTO fundador. A empresa passou os primeiros meses como Perennium Networks e StarRidge Networks antes de virar Foundry, em janeiro de 1997. Depois andou com uma velocidade espantosa: o primeiro switch gigabit Ethernet e o primeiro switch de Camada 3 em 1997, o primeiro switch de Camadas 4-7, o ServerIron, em 1998. O seu IPO da era pontocom chegou a uma avaliação de US$ 9 bilhões no primeiro dia de negociação.",
        },
      ],
      // Timeline: same years, same order, same personal markers.
      timeline: [
        { year: 1995, title: "A Brocade é fundada", detail: "Agosto de 1995, San Jose: um investidor e piloto de corridas, um coautor da especificação Fibre Channel e um ex-executivo da Intel se propõem a construir o fabric de storage comutado." },
        { year: 1996, title: "A Foundry é fundada", detail: "Maio de 1996, Santa Clara: a segunda startup de redes de Bobby Johnson, brevemente chamada Perennium e StarRidge antes de o nome Foundry pegar, em janeiro de 1997.", sourceNote: "Data de fundação segundo o 10-K da própria Foundry na SEC." },
        { year: 1997, title: "O SilkWorm chega; as primeiras da Foundry em Ethernet", detail: "O switch Fibre Channel SilkWorm da Brocade chega sobre o ASIC Stitch com o Fabric OS. No mesmo ano, a Foundry lança o primeiro switch gigabit Ethernet e o primeiro switch de Camada 3." },
        { year: 1998, title: "ServerIron: o primeiro switch de Camadas 4-7", detail: "A Foundry inventa o switching na camada de aplicação: load balancing de servidores antes de a indústria ter decidido um nome para isso." },
        { year: 1999, title: "As duas empresas abrem capital na bolha", detail: "A Brocade estreia em 25 de maio de 1999 (US$ 4,75, ajustado por desdobramentos). A estreia da Foundry chega a uma avaliação de US$ 9 bilhões no primeiro dia: um dos IPOs que definiram a era pontocom." },
        { year: 2007, title: "A Brocade absorve a McDATA", detail: "Concluída em 29 de janeiro de 2007: a Brocade adquire a sua maior rival em Fibre Channel, negócio anunciado em 8 de agosto de 2006 por US$ 713 milhões, consolidando o mercado de fabrics SAN." },
        { year: 2008, title: "A Brocade adquire a Foundry (~US$ 2,6 bilhões)", detail: "Anunciado em 21 de julho de 2008 por cerca de US$ 3,0 bilhões (US$ 19,25 por ação em dinheiro e ações); a crise financeira forçou uma renegociação para US$ 16,50 por ação, tudo em dinheiro, cerca de US$ 2,6 bilhões. Concluído em 18 de dezembro de 2008: a Brocade passa das SANs para o mercado completo de Ethernet e IP.", sourceNote: "10-Q da Brocade do ano fiscal de 2008; termos renegociados segundo a imprensa da época." },
        { year: 2016, title: "A Brocade acrescenta a Ruckus; a Broadcom bate à porta", detail: "A Brocade conclui a aquisição da fabricante de Wi-Fi Ruckus Wireless em maio de 2016. Em 2 de novembro, a Broadcom anuncia que vai adquirir a Brocade, ficando com o negócio de SAN Fibre Channel e vendendo todo o resto para não competir com os próprios clientes de chips." },
        { year: 2017, title: "O desmembramento", detail: "A Extreme Networks conclui a compra do negócio de redes de data center da Brocade em outubro de 2017 por US$ 55 milhões (US$ 35 milhões no fechamento, US$ 20 milhões diferidos): as linhas SLX, VDX, MLX, CES e CER mais o Workflow Composer. A Broadcom conclui a aquisição da Brocade em 17 de novembro (~US$ 5,3 bilhões em dinheiro mais US$ 701 milhões para quitar o term loan da Brocade). Em 1º de dezembro, a ARRIS conclui a compra da Ruckus Wireless e do negócio de switches de campus ICX por US$ 800 milhões.", sourceNote: "10-K da Broadcom do ano fiscal de 2018; comunicado Broadcom/Extreme de 29 de março de 2017; 8-K da ARRIS de 22 de fevereiro de 2017." },
        { year: 2019, title: "Ruckus e ICX mudam de novo", detail: "A CommScope conclui a aquisição da ARRIS, de US$ 7,4 bilhões, em abril de 2019, levando junto os portfólios Ruckus e ICX." },
        { year: 2026, title: "A diáspora continua em movimento", detail: "Em 30 de abril de 2026, a Belden anuncia a compra da Ruckus Networks da CommScope por US$ 1,85 bilhão: o quarto dono da linhagem de campus desde a Brocade.", sourceNote: "Anunciado; conclusão pendente na data da última verificação desta página." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "SilkWorm e a linha SAN da Brocade", what: "Do SilkWorm de 1997 aos fabrics de classe director sobre o Fabric OS: a espinha dorsal Fibre Channel que ainda carrega o nome Brocade dentro da Broadcom." },
        { name: "BigIron / FastIron / NetIron", what: "As famílias de switching e roteamento Ethernet da Foundry para empresas e provedores de serviço, com liderança de desempenho no início do mercado de 10 Gigabit Ethernet." },
        { name: "ServerIron", what: "O primeiro switch de Camadas 4-7 (1998): load balancing de servidores e entrega de aplicações antes de existir a categoria ADC, um dos primeiros rivais no mercado que a F5 viria a definir." },
        { name: "SLX / VDX / MLX", what: "As linhas de switching e roteamento de data center que foram para a Extreme Networks em 2017 e seguem vivas no portfólio dela." },
        { name: "Switching de campus ICX e Wi-Fi Ruckus", what: "A linha de campus descendente do FastIron e o wireless Ruckus, que viajaram da Brocade para a ARRIS e para a CommScope, com a Belden anunciada como a próxima." },
      ],
      // Innovations.
      innovations: [
        { title: "O fabric Fibre Channel comutado", detail: "Malavalli foi coautor da especificação Fibre Channel; a Brocade a transformou numa categoria de produto. O zoning e os serviços de fabric do Fabric OS tornaram as redes de storage compartilhado operáveis em escala corporativa." },
        { title: "Pioneirismo em switching gigabit e de Camada 3", detail: "A Foundry lançou os dois em 1997, definindo a régua de desempenho da era do Ethernet em velocidade de fio." },
        { title: "Switching de aplicações nas Camadas 4-7", detail: "O ServerIron (1998) pôs o load balancing dentro do fabric de switching, anos antes de 'application delivery controller' entrar no vocabulário." },
        { title: "Cultura de engenharia centrada em ASIC", detail: "As duas empresas venceram com silício próprio (as gerações Stitch e BLOOM da Brocade, o encaminhamento em velocidade de fio da Foundry), provando que chips feitos sob medida superam projetos de uso geral no fabric." },
      ],
      // Markets, same entry count.
      markets: [
        "Durante duas décadas, a Brocade foi a fabricante dominante de fabrics Fibre Channel: no terceiro trimestre de 2008, o Dell'Oro Group pôs a Brocade acima de 55% do mercado de switches SAN modulares, com a Cisco em torno de 44%, uma disputa de dois cavalos que definiu as redes de storage. O negócio de SAN FC continua sob a Broadcom, atendendo a expansão do storage da era do flash e da IA.",
        "A Foundry atendia empresas e provedores de serviço com Ethernet em velocidade de fio, e o seu DNA hoje está distribuído: switching e roteamento de data center na Extreme Networks, switching de campus e Wi-Fi Ruckus na CommScope (com a Belden anunciada como a próxima dona em 2026) e o fabric SAN na Broadcom.",
      ],
      // Analyst standing, same entry count.
      analyst: [
        "Dell'Oro Group, terceiro trimestre de 2008: a Brocade detinha mais de 55% do mercado de switches SAN modulares, com a Cisco em cerca de 44%, a estrutura de mercado que fez do negócio com a Foundry a aposta da Brocade para enfrentar a Cisco na rede inteira.",
        "Os próprios materiais da fusão, de julho de 2008, posicionavam a Foundry como a inovadora com liderança de desempenho no então emergente mercado de 10 Gigabit Ethernet.",
      ],
      // Career cross-link: label translated, href unchanged.
      careerLink: { href: "/industry/chapters/extreme", label: "A linha de data center da Foundry (SLX, VDX, MLX) segue viva na Extreme Networks: veja a minha página da Extreme" },
    },
  },

  // cesar: record prose.
  "cesar": {
    // Card title (company kept verbatim), tagline and intro.
    name: "CESAR - o centro fundado para impedir que as pessoas fossem embora",
    tagline: "Centro de inovação do Recife criado em 1996 para manter profissionais de tecnologia em Pernambuco, e uma das âncoras do Porto Digital.",
    intro:
      "O CESAR é um centro privado sem fins lucrativos de inovação e educação no Recife, fundado em 1996 por pesquisadores da universidade federal, e uma das instituições âncora do parque tecnológico Porto Digital.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O CESAR foi fundado no Recife em 1996 por três professores e pesquisadores do centro de informática da Universidade Federal de Pernambuco (Silvio Meira, Ismar Kaufman e Fabio Silva), e o propósito declarado era incomumente concreto. Ele existia para aproximar a produção científica da universidade daquilo de que a indústria realmente precisava, e para manter profissionais qualificados de tecnologia em Pernambuco, em vez de vê-los partir para outras regiões.",
      "Esse segundo objetivo é o que merece atenção. A instituição foi criada para conter uma fuga de cérebros, o que significa que foi fundada sobre o diagnóstico de um lugar, e não sobre uma tecnologia. Quase nada neste catálogo foi fundado assim.",
      "Em 2000, participou da criação do Porto Digital e virou uma das instituições âncora do parque. Mantém uma escola, um laboratório de experimentação, um centro de pesquisa e desenvolvimento e um venture builder, com cerca de 1.500 pessoas pela sua própria contagem no aniversário de trinta anos, em maio de 2026, e algo como cem milhões de reais de receita, e Silvio Meira continua sendo o seu cientista-chefe.",
      "A resposta mensurável sobre se a intervenção funcionou é uma empresa. A Tempest foi incubada ali em 2000, virou spin-off em 2003 e hoje faz parte de um negócio de cibersegurança avaliado em centenas de milhões de reais. É a mesma forma da história de Campinas em outro ponto deste catálogo (uma instituição de pesquisa posicionada de propósito, um polo se formando em volta dela), com uma diferença que vale notar: aqui o mecanismo era explícito desde o começo. Reter as pessoas, construir o parque, incubar as empresas, deixá-las seguir.",
    ],
  },

  // cipher: record prose plus the complete translated profile.
  "cipher": {
    // Parent note (official.parent.note), added 26/10/2026 with the parents apply; name, slug and year stay English facts.
    parentNote: "A Cipher é a divisão de cibersegurança da Prosegur: a Prosegur concluiu a compra no primeiro trimestre de 2019 e reuniu todas as suas operações de cibersegurança sob a marca Cipher.",
    // Card title (company kept verbatim), tagline and intro.
    name: "Cipher - a outra que foi comprada",
    tagline: "Uma grande empresa brasileira de segurança adquirida por uma multinacional de segurança patrimonial, dois anos antes de o mesmo acontecer com a rival.",
    intro:
      "A Cipher foi uma das maiores empresas brasileiras de cibersegurança até 2018, quando a Prosegur, uma multinacional de segurança privada com mais de 175.000 funcionários em 25 países, assinou um acordo para ficar com uma participação majoritária.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Lida ao lado do verbete da Tempest, ela mostra algo que nenhuma das duas mostra sozinha. Em cerca de dois anos, as duas maiores empresas brasileiras especializadas em segurança foram compradas por empresas de fora da indústria de tecnologia: uma por uma fabricante de aviões, a outra por uma operadora de segurança patrimonial.",
      "Os dois compradores estavam comprando a mesma coisa: uma capacidade digital que não conseguiam construir na velocidade em que os seus clientes já existentes a pediam. É uma condição de mercado específica, e não uma coincidência, e é por isso que o período viu tão pouca consolidação da segurança brasileira entre empresas brasileiras de tecnologia.",
    ],
    // Complete profile copy: facts verbatim from profiles/cipher.ts, prose translated.
    profile: {
      slug: "cipher",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "Cipher",
          year: 2000,
          place: "Brasil",
          founders: ["Eduardo Boucas"],
          story:
            "A Cipher foi fundada em 2000 e cresceu até virar uma das maiores especialistas brasileiras em cibersegurança, operando os próprios centros de operações de segurança em vez de revender os de outros. O detalhe que importa para o que veio depois é que ela construiu um serviço gerenciado: um negócio cujo valor são pessoas olhando telas 24 horas por dia, em instalações, sob contrato. É um ativo que um comprador consegue absorver e manter funcionando desde o primeiro dia, o que não vale para a maioria das coisas que uma empresa de tecnologia possui.",
          sourceNote:
            "O ano de fundação e o nome do fundador constam do próprio anúncio de aquisição da Prosegur, datado de 10 de dezembro de 2018, fonte primária para os dois. A cidade não é informada ali e não é inventada aqui.",
        },
      ],
      // Timeline: same years, same order, same personal markers.
      timeline: [
        { year: 2016, title: "A Prosegur compra antes uma startup portuguesa de segurança", detail: "Antes do Brasil, a Prosegur adquiriu a Dognaedis, uma empresa de cibersegurança nascida do programa Carnegie Mellon Portugal, em março de 2016. Lido para a frente, parece uma nota de rodapé; lido de trás para a frente, é o primeiro movimento de uma estratégia, porque uma multinacional de segurança patrimonial montando uma divisão digital precisa de uma segunda aquisição antes que a primeira signifique alguma coisa." },
        { year: 2018, title: "Uma empresa de vigilância compra um negócio de operações de segurança", detail: "Em 10 de dezembro de 2018, a Prosegur anunciou um acordo para ficar com uma participação majoritária na Cipher. O comunicado da própria Prosegur situava a Cipher na América do Norte, na América Latina e na Europa, com dois centros de operações de segurança funcionando 24 horas, e o grupo combinado com seis. Eduardo Boucas, fundador e CEO da Cipher, continuou como acionista e como Global CEO da Prosegur Cybersecurity; Alejandro Alonso, que vinha comandando a unidade de cibersegurança da própria Prosegur, tornou-se Executive Chairman. O tamanho da participação não foi divulgado.", sourceNote: "O comunicado da Prosegur diz majoritária, sem percentual, e não informa preço. Nenhum dos dois números aparece aqui, porque os únicos números disponíveis para este negócio são os que a Prosegur escolheu publicar." },
        { year: 2019, title: "O nome adquirido vira o nome do grupo", detail: "Em 2019, todas as empresas da divisão de cibersegurança da Prosegur, Dognaedis incluída, passaram para uma única marca global: Cipher, a Prosegur Company. Esta é a parte que merece uma pausa. O desfecho comum de uma aquisição é o nome do comprador sobreviver e o do vendido ser aposentado em um ou dois anos. Aqui foi ao contrário: o nome da empresa brasileira foi aplicado à unidade de cibersegurança que o comprador já tinha e à sua aquisição portuguesa anterior. A Prosegur comprou um negócio e depois adotou a marca dele. Desde então, os nomes mudaram mais uma vez, e a divisão se apresenta como Prosegur Cybersecurity, com a sua plataforma xMDR sob esse nome, de modo que a marca da especialista foi promovida acima da do comprador e, mais tarde, superada por ela de qualquer forma.", sourceNote: "A consolidação de 2019 na marca Cipher é datada pelo CMU Portugal, que escreve sobre a Dognaedis como empresa saída do próprio programa. A mudança posterior para Prosegur Cybersecurity é visível nas páginas atuais da Prosegur, mas nenhuma fonte localizada a anuncia com data, então ela é descrita aqui sem uma, em vez de receber um ano que não tem como sustentar." },
      ],
    },
  },

  // compugraf: record prose plus the complete translated profile.
  "compugraf": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Compugraf (hoje CG One)",
    tagline: "Uma empresa de computação gráfica que virou empresa de segurança e manteve o nome por quarenta anos.",
    intro:
      "O nome é a história. A Compugraf foi registrada em São Paulo em abril de 1982 e fazia o que o nome dizia: computação gráfica. Em algum momento dos anos 1990, passou para a segurança da informação, e ficou ali por três décadas, sob um nome que tinha deixado de descrevê-la.",
    // Body paragraphs, same count and order as the English.
    body: [
      "É um padrão mais comum nesta indústria do que as histórias arrumadinhas sugerem, e esta linha do tempo tem vários exemplos dele. As empresas raramente mudam de nome quando o negócio muda, porque o nome é aquilo em que os clientes já confiam, e assim o nome comercial vira um fóssil do que a empresa costumava fazer. Quem conhecesse a Compugraf como integradora de segurança em 2010 não tinha nenhum motivo especial para saber que ela já tinha vendido sistemas gráficos.",
      "O negócio de segurança se acomodou no formato que a maioria das integradoras brasileiras da sua geração assumiu: segurança de redes e da informação para grandes clientes nacionais da indústria, dos serviços financeiros e da energia, vendida e suportada localmente, e não pelo canal de uma multinacional. A empresa se descreve como cem por cento brasileira, com mais de 150 funcionários e mais de quinhentas empresas clientes atendidas ao longo de duas décadas.",
      "Em 2024, finalmente mudou de nome, para CG One, que mantém as iniciais do negócio gráfico enquanto abandona a palavra. Quarenta e dois anos é muito tempo para carregar um nome que ficou pequeno, e encurtá-lo para duas letras é o meio-termo de sempre entre continuidade e precisão.",
    ],
    // Complete profile copy: facts verbatim from profiles/compugraf.ts, prose translated.
    profile: {
      slug: "compugraf",
      // Founding stories (company, year and founders unchanged).
      foundings: [
      ],
      // Timeline: same years, same order, same personal markers.
      timeline: [
        { year: 1982, title: "Um grupo, não uma empresa", detail: "O registro original é de abril, e várias outras pessoas jurídicas vieram depois: um braço de telecomunicações em 1998, uma empresa de segurança digital em 2010, uma empresa de segurança da informação em 2021. Essa estrutura é comum no Brasil e vale a pena entendê-la: o cliente que contrata um desses nomes está contratando uma empresa dentro de um grupo, e não o negócio de quarenta anos a que a marca se refere." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "Segurança de perímetro e de rede", what: "Firewall, segmentação e controle de acesso, construídos sobre Check Point e Forescout: o núcleo tradicional da prática de uma integradora, e a parte com os relacionamentos mais longos com clientes." },
        { name: "Entrega e segurança de aplicações", what: "F5, para load balancing e proteção na camada de aplicação. É a prática que exige mais conhecimento especializado para vender e mais para suportar, e é por isso que relativamente poucas integradoras a carregam bem." },
        { name: "Gestão de políticas e de mudanças", what: "AlgoSec, para gerenciar conjuntos de regras de firewall em todo um ambiente. Um produto que existe porque grandes organizações acumulam milhares de regras cujo motivo ninguém lembra, que é a condição real da maioria das redes." },
        { name: "Privacidade e governança", what: "OneTrust, para conformidade com a proteção de dados. O acréscimo que data o portfólio: a lei geral de proteção de dados do Brasil fez da privacidade uma decisão de compra, e não um parecer jurídico, e as integradoras acrescentaram práticas de acordo." },
      ],
      // Innovations.
      innovations: [
        { title: "A lista de parceiros é a estratégia", detail: "Uma integradora não tem produtos próprios, então a sua lista de fabricantes é a descrição mais honesta do que ela faz. Esta se lê como perímetro, entrega de aplicações e conformidade, e não como endpoint, detecção ou cloud-native: uma prática construída em torno de proteger a fronteira e a aplicação, para organizações com ambientes de porte e reguladores a quem prestar contas. Ler uma lista de parceiros assim diz mais do que qualquer declaração de posicionamento." },
        { title: "Continuar local quando as multinacionais chegaram", detail: "O mercado brasileiro é atendido desde os anos 1990 por integradoras globais e pelos canais dos próprios fabricantes. Uma empresa deste porte permanecer independente e se descrever como inteiramente brasileira é uma posição, e não um acaso: o argumento é que um cliente que quer alguém que atenda o telefone no mesmo fuso horário, sob a mesma legislação contratual, vai pagar por isso." },
      ],
      // Markets, same entry count.
      markets: [
        "Grandes organizações brasileiras da indústria, dos serviços financeiros e da energia, com mais de trezentos clientes ativos informados e mais de quinhentos atendidos ao longo de duas décadas, e cerca de 150 funcionários.",
        "Compete com as integradoras globais que operam no Brasil, com os braços de serviços das próprias distribuidoras e com os fabricantes que vendem direto, este último o risco permanente deste negócio, já que todo parceiro é também um concorrente em potencial.",
      ],
      // Analyst standing, same entry count.
      analyst: [
        "Não existe cobertura de analistas para uma empresa privada deste porte, e nenhuma demonstração financeira é pública. O que se pode verificar é a longevidade, uma certificação ISO 9001 e uma lista de fabricantes que exige as certificações que esses fabricantes cobram.",
        "A observação que vale registrar é sobre a categoria, não sobre a empresa. Uma integradora independente de quarenta anos é um objeto cada vez mais incomum: a economia empurra para a consolidação nas distribuidoras e nas empresas globais de serviços, e esta linha do tempo registra várias que seguiram esse caminho. Permanecer independente nesta escala significa ou uma especialidade defensável ou um dono que não quer vender, e de fora as duas coisas parecem idênticas.",
      ],
    },
  },

  // contacta: record prose.
  "contacta": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Contacta - segurança em todas as camadas, e um SOC",
    tagline: "Integradora brasileira de segurança que opera o próprio centro de operações de segurança baseado em XDR.",
    intro:
      "A Contacta é uma integradora brasileira de segurança da informação que cobre segurança de nuvem, de endpoint, de rede e web, com práticas de governança e DevSecOps, e opera o próprio centro de operações de segurança construído sobre XDR.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Uma integradora que opera um SOC cruzou a mesma linha que outra que opera um NOC, e em segurança a travessia é mais difícil: um centro de operações de rede sabe como é o normal a partir da topologia que ele mesmo construiu, enquanto um centro de operações de segurança precisa decidir o que justifica acordar alguém, e isso é um julgamento, não um limiar.",
      "É também por isso que o mercado de SOC se consolida em torno de empresas que já fazem integração. As detecções só são tão boas quanto o conhecimento do que foi implantado e por quê, e esse conhecimento pertence a quem colocou aquilo lá.",
    ],
  },

  // dolch: record prose plus the complete translated profile.
  "dolch": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Dolch (linhagem Kontron / Azonix)",
    tagline: "O portátil robusto em que o Sniffer morava.",
    intro:
      "A Dolch Computer Systems fabricava os portáteis robustos em formato de mala que carregaram uma geração de engenharia de campo e, acima de tudo, o analisador Sniffer da Network General, que era entregue em PACs da Dolch com tanta regularidade que o Computer History Museum os cataloga como plataformas do Sniffer.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Fundada em 1987 na Califórnia por Volker Dolch; duas vezes em primeiro lugar em portáteis robustos (VDC, 1999 e 2002); adquirida pela Kontron AG em fevereiro de 2005, com a plataforma móvel robusta passando para a Azonix em 2007. A metade de hardware da história da análise de pacotes contada no perfil da linhagem Sniffer.",
    ],
    // Ending note (the year stays in the English record).
    endedNote:
      "Adquirida pela Kontron AG em fevereiro de 2005; a plataforma móvel robusta passou para a Azonix em 2007.",
    // Complete profile copy: facts verbatim from profiles/dolch.ts, prose translated.
    profile: {
      slug: "dolch",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "Dolch Computer Systems",
          year: 1987,
          place: "Califórnia, Estados Unidos",
          founders: ["Volker Dolch"],
          story:
            "Volker Dolch construiu a máquina de que o campo realmente precisava: uma mala que podia ser despachada como bagagem, aberta no piso de um data center e encarregada de placas de expansão de comprimento total que nenhum laptop jamais aceitaria. Os portáteis da série PAC combinavam construção industrial com barramentos comerciais (EISA, VESA Local Bus, depois PCI), o que fez deles a casa natural do software de campo mais pesado da época, e um morador acima de todos fez a marca: o Sniffer da Network General era entregue em portáteis Dolch com tanta regularidade que o Computer History Museum cataloga os modelos PAC simplesmente como 'Sniffer platform'. Para uma geração de engenheiros de rede, a maleta cinza da Dolch ERA a cara de um analisador de protocolos.",
          sourceNote:
            "Ano de fundação, fundador e destino segundo a Wikipedia e o Centre for Computing History; a associação com o Sniffer segundo o catálogo do acervo do Computer History Museum (PAC 62/63/64).",
        },
      ],
      // Timeline: same years, same order, same personal markers.
      timeline: [
        { year: 1987, title: "O portátil robusto", detail: "A Dolch começa a fabricar portáteis robustos de alto padrão para engenheiros, máquinas em formato de mala com slots de expansão de verdade, voltadas para trabalho industrial, militar e de teste e medição." },
        { year: 1992, title: "O PAC-60 e a era dos analisadores", detail: "O PAC-60, da classe 486 (e os PACs Pentium que vieram depois), vira o chassi de campo definitivo para análise de redes: vários slots, várias interfaces e resistência suficiente para viver num crash cart." },
        { year: 1996, title: "O fundador deixa a propriedade", detail: "Volker Dolch vende a sua participação na empresa, mas continua a dirigi-la até se aposentar em 2001.", sourceNote: "Segundo o registro da empresa na Wikipedia." },
        { year: 1999, title: "Primeiro lugar no ranking", detail: "A Venture Development Corporation põe a Dolch em primeiro lugar no mercado de portáteis robustos, posição que se repete em 2002.", sourceNote: "Segundo o Centre for Computing History e o comunicado de aquisição da Kontron de 2005." },
        { year: 2005, title: "A Kontron adquire a Dolch", detail: "A Kontron AG compra a Dolch Computer Systems da Siegel-Robert em fevereiro de 2005; a Dolch passa a operar como unidade de negócio da Kontron America.", sourceNote: "Segundo o anúncio de aquisição da Kontron, de 25 de fevereiro de 2005." },
        { year: 2007, title: "A linha segue adiante", detail: "A Kontron vende a plataforma móvel robusta à Azonix: o fim do nome Dolch, embora os portáteis cinza continuem na ativa em campo e em anúncios do eBay por muitos anos." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "Série PAC (PAC 60-65)", what: "Portáteis robustos em formato de mala com slots de expansão de tamanho integral, do 486 ao Pentium MMX: a plataforma de campo canônica do Sniffer." },
        { name: "Displays robustos", what: "Displays touch vedados contra choque, vibração e intempéries para instalações industriais e militares." },
      ],
      // Innovations.
      innovations: [
        { title: "O chassi de análise de campo", detail: "A Dolch entendeu que ferramentas sérias de campo precisavam de barramentos de desktop num corpo portátil. Os PACs carregavam o hardware de captura com várias interfaces que os laptops da época simplesmente não comportavam, e fizeram da análise profunda de protocolos uma disciplina portátil." },
      ],
      // Markets, same entry count.
      markets: [
        "Portáteis robustos para teste e medição, petróleo e gás, forças armadas e segurança pública, com o mercado de análise de redes como a joia visível: aonde quer que um Sniffer fosse nos anos 1990, normalmente era uma Dolch que o levava.",
      ],
      // Analyst standing, same entry count.
      analyst: [
        "Incluída na linhagem pioneira como infraestrutura do ofício: a metade de hardware da história da análise de pacotes contada no perfil da linhagem Sniffer. Duas vezes em primeiro lugar no seu mercado antes de a aquisição pela Kontron em 2005 e a passagem para a Azonix em 2007 encerrarem o capítulo.",
      ],
    },
  },

  // emc: record prose plus the complete translated profile; acquisitions index-aligned.
  "emc": {
    // Card title (company kept verbatim), tagline and intro.
    name: "EMC Corporation",
    tagline: "Fez do storage uma categoria própria e depois virou a maior aquisição de tecnologia da história.",
    intro:
      "A EMC foi constituída em Massachusetts em agosto de 1979 por Richard Egan e Roger Marino, cujas iniciais são o E e o M. Começou vendendo placas de memória e se tornou a empresa que fez do storage corporativo uma decisão de compra por si só, e não algo que vinha embutido com um servidor.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A estratégia era incomum e deliberada: convencer os clientes a escolher o storage independentemente de quem fornecia o resto da sua infraestrutura. É por isso que a EMC acabou vendendo para contas IBM, HP e Sun indistintamente, e por isso 'best of breed' virou uma expressão que os compradores de storage usavam.",
      "Ela comprou muito. A Data General em 1999, em grande parte pela linha de arrays CLARiiON, e foi assim que uma das primeiras empresas de minicomputadores acabou dentro de uma fabricante de storage. A Documentum e a Legato em 2003. A RSA Security em 2006, o que pôs um negócio de segurança dentro de uma empresa de storage. A VMware em 2004, por US$ 625 milhões, que acabou sendo a de maior consequência de todas.",
      "A Iomega veio em 2008, depois rebatizada LenovoEMC por meio de uma joint venture de 2013, desfeita quando a Dell chegou.",
      "Em 2016, a Dell adquiriu a EMC por US$ 67 bilhões, a maior aquisição de tecnologia já registrada até então, formando a Dell Technologies. A participação na VMware que a EMC tinha comprado por US$ 625 milhões doze anos antes era parte substancial do que tornava o preço razoável.",
    ],
    // Ending note (the year stays in the English record).
    endedNote:
      "Adquirida pela Dell por US$ 67 bilhões, a maior aquisição de tecnologia da história até então, formando a Dell Technologies. A marca Dell EMC permaneceu nos produtos até por volta de 2020.",
    // Successor link label (the URL stays in the English record).
    successorLabel:
      "Dell Technologies",
    // Acquisitions prose, index-aligned with the English list (year, name, price, founder stay English).
    acquisitions: [
      // 0: Data General (1999).
      { what: "Uma das primeiras empresas de minicomputadores, comprada em grande parte pela linha de arrays de storage CLARiiON.", became: "O negócio de arrays de médio porte.", subAcquisitions: [{ what: "Fundada por ex-engenheiros da DEC; definiu o mercado de minicomputadores antes de terminar dentro de uma fabricante de storage, trinta e um anos depois." }] },
      // 1: Documentum and Legato (2003).
      { what: "Software de gestão de conteúdo e de backup, comprados no mesmo ano.", became: "A metade de software do que virou a federação EMC." },
      // 2: VMware (2004).
      { what: "Virtualização de servidores, comprada antes de a virtualização ser uma categoria para a qual a maioria dos compradores tinha uma linha no orçamento.", became: "Em 2016, uma grande parte do que tornava razoável um preço de US$ 67 bilhões pela EMC. A compra de maior consequência que a EMC já fez." },
      // 3: RSA Security (2006).
      { what: "Criptografia e autenticação, o que pôs um negócio de segurança dentro de uma empresa de storage.", became: "RSA, mais tarde vendida." },
      // 4: Iomega (2008).
      { what: "Storage para consumidores e pequenas empresas.", became: "Rebatizada LenovoEMC por meio de uma joint venture de 2013, desfeita quando a Dell chegou." },
    ],
    // Complete profile copy: facts verbatim from profiles/emc.ts, prose translated.
    profile: {
      slug: "emc",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "EMC",
          year: 1979,
          place: "Massachusetts",
          founders: ["Richard Egan", "Roger Marino"],
          story:
            "Dois ex-colegas de quarto da Northeastern, de 43 e 40 anos, largaram os empregos em agosto sem produto e sem plano, e começaram vendendo móveis de escritório para financiar o que viesse depois. No ano seguinte, tornaram-se os representantes da Intel na Nova Inglaterra, e construíram o primeiro produto de verdade em 1981, por sugestão de um cliente: placas de memória para minicomputadores Prime, mais confiáveis do que as da própria Prime e pela metade do preço.",
          sourceNote:
            "O C de EMC costuma ser atribuído a Connolly e Curley, dois participantes que saíram cedo, e é por isso que o nome durou mais do que eles e as iniciais já não se decifram.",
        },
      ],
      // Timeline: same years, same order, same personal markers.
      timeline: [
        { year: 1981, title: "O primeiro produto", detail: "Placas de memória de 64 kilobytes para a Prime Computer, vendidas pela confiabilidade e pelo preço contra as do próprio fabricante. O negócio, na primeira década, era prolongar a vida de máquinas construídas por outros." },
        { year: 1990, title: "Symmetrix", detail: "Um Integrated Cached Disk Array: muitos discos pequenos atrás de um cache grande, apresentados a um mainframe como storage. Antes dele, o storage era um detalhe que vinha com o computador, um único disco grande e caro, escolhido por quem tivesse vendido o mainframe. Em 1991, esse único produto respondia por 38% da receita." },
        { year: 1991, title: "O negócio de memória é encerrado", detail: "Depois de construir a empresa sobre placas de memória, Egan as descontinuou para se concentrar em arrays de discos. O seu cofundador disse publicamente em 1994 que, na época, não conseguia entender por que alguém mataria uma linha tão lucrativa, e que tinha passado a ver aquilo como um senso de oportunidade excepcional." },
        { year: 1999, title: "Acima de cinco bilhões", detail: "Receita anual acima de US$ 5 bilhões, numa categoria de produto que a empresa tinha em grande parte inventado como categoria." },
        { year: 2009, title: "Data Domain, depois Isilon", detail: "US$ 2,1 bilhões por deduplicação e, no ano seguinte, US$ 2,25 bilhões por storage scale-out: a compra das duas arquiteturas que estavam deslocando a que ela tinha construído." },
        { year: 2016, title: "Dell", detail: "US$ 67 bilhões, financiados com cerca de US$ 50 bilhões em dívida recém-emitida, e a Dell levou junto uma participação de 81% na VMware." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "Symmetrix", what: "O array de ponta que fez a empresa, e o motivo de a compra de storage ter virado uma decisão separada da compra de servidores." },
        { name: "CLARiiON", what: "A linha de médio porte, vendida onde um Symmetrix era mais array do que o cliente precisava, o problema de segmentação que todo fabricante de ponta acaba tendo de resolver." },
        { name: "Data Domain e Isilon", what: "Deduplicação e storage de arquivos scale-out, comprados em vez de construídos, atacando duas coisas em que o array monolítico era estruturalmente ruim." },
        { name: "VMware", what: "Nunca foi um produto de storage, e nunca foi integrada a um. Foi mantida, e não absorvida, algo incomum o bastante para ser o motivo de ela ter conservado o seu valor." },
        { name: "RSA", what: "Criptografia, tokens e identidade: um argumento coerente sobre proteção de dados e um encaixe desajeitado ao lado da engenharia de arrays." },
      ],
      // Innovations.
      innovations: [
        { title: "Fazer do storage uma compra por si só", detail: "Antes do Symmetrix, quem comprava um mainframe levava o storage que o fabricante do mainframe vendesse. Construir um array que superava essas opções e funcionava com todas elas transformou um componente embutido num mercado competitivo, a maior coisa que esta empresa fez, e criou a categoria em que todos os outros fabricantes desta linha do tempo vendem." },
        { title: "Muitos discos baratos atrás de um cache grande", detail: "A percepção era que um array de pequenos discos commodity, com cache suficiente na frente, podia vencer um único disco grande e caro em velocidade, resiliência e espaço ao mesmo tempo. É o mesmo argumento que depois espalhou o RAID por toda parte, chegando como produto, e não como artigo acadêmico." },
        { title: "Matar o negócio lucrativo", detail: "Descontinuar a linha de memória em 1991, quando ela ainda dava dinheiro, foi a decisão sobre a qual a empresa virou, e a admissão do cofundador de que se opôs a ela na época vale mais do que qualquer declaração de estratégia. A maioria das empresas desta linha do tempo que fracassaram fracassou defendendo uma linha lucrativa um ano além da conta." },
        { title: "Comprar o que estava te devorando", detail: "A Data Domain e a Isilon foram compradas porque as arquiteturas de deduplicação e scale-out estavam minando o array monolítico. A VMware virou o bem mais valioso da empresa. Um incumbente que compra a própria disrupção cedo o bastante consegue manter o cliente; o registro desta linha do tempo é que a maioria compra tarde demais." },
      ],
      // Markets, same entry count.
      markets: [
        "Data centers corporativos, primeiro mainframes e depois sistemas abertos: as organizações para as quais o storage é uma rubrica grande o bastante para ter compras próprias. A receita passou de US$ 5 bilhões em 1999, e a empresa era a referência contra a qual a NetApp, a HDS e as divisões de storage da IBM eram medidas.",
        "A sua posição se apoiava em ser independente dos fabricantes de servidores, e foi isso que fez de 'best of breed' uma expressão que os compradores de storage realmente usavam, e que acabou quando ela passou a fazer parte de um deles.",
      ],
      // Analyst standing, same entry count.
      analyst: [
        "Por cerca de duas décadas, foi avaliada como líder em storage corporativo sem discussão séria, e a pergunta interessante era sempre qual concorrente estava ganhando terreno, e não se a EMC estava na frente.",
        "O veredito final é aritmético. Uma empresa construída sobre placas de memória para os minicomputadores de outros virou uma aquisição de US$ 67 bilhões, e parte substancial desse preço era uma empresa de virtualização que ela nunca tinha incorporado à própria linha de produtos. O melhor investimento que uma empresa de storage já fez foi em software que não tinha nada a ver com storage.",
      ],
    },
  },

  // fatec: record prose.
  "fatec": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Fatec - o curso de tecnólogo, e para quem ele é",
    tagline: "Faculdades estaduais de tecnologia que oferecem cursos superiores curtos e aplicados, em vez de cursos completos de engenharia.",
    intro:
      "As Fatecs são as faculdades de tecnologia do estado de São Paulo, que oferecem cursos superiores de tecnologia aplicados, mais curtos do que um curso de engenharia e voltados diretamente para um emprego. São uma resposta diferente à mesma pergunta que as universidades respondem, e alcançam uma pessoa diferente.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O centro estadual de educação tecnológica que se tornou a rede Fatec foi criado por decreto-lei em 6 de outubro de 1969, no governo de Abreu Sodre, como resultado de um grupo de trabalho encarregado de avaliar a criação de uma rede de cursos superiores de tecnologia de dois e três anos. Começou a dar aulas em 1970, com três cursos de construção civil e dois de mecânica, e as duas primeiras faculdades foram instaladas em Sorocaba e em São Paulo, esta no antigo prédio da Escola Politécnica da Universidade de São Paulo.",
      "O modelo é o que importa. São cursos superiores públicos, curtos e profissionalizantes, desenhados para colocar gente tecnicamente capaz na indústria rapidamente, e ficam ao lado da universidade de pesquisa, não abaixo dela. O Brasil construiu os dois tipos de instituição no mesmo período e pelo mesmo motivo: o estado queria uma base industrial e entendia que precisava de dois tipos diferentes de formado para chegar lá.",
      "Para esta linha do tempo, a data que importa é 2 de junho de 1974, quando o curso de Processamento de Dados foi aprovado. Ponha isso ao lado do resto da década e a intenção é inconfundível: a Prodesp foi criada em 1969, o centro de educação tecnológica dias depois no mesmo ano, a Dataprev em 1974, e o curso que formaria o pessoal delas no mesmo ano da Dataprev. O estado construiu as organizações de computação e as escolas para preenchê-las no espaço de cinco anos.",
      "A rede cresceu até virar um dos maiores sistemas públicos de educação técnica de qualquer lugar. O Centro Paula Souza mantém hoje 218 escolas técnicas e 64 faculdades de tecnologia, com mais de 283.000 alunos em mais de 300 municípios.",
      "Quem ensina tecnologia no Brasil esbarra nessa rede o tempo todo, e o motivo é estrutural, não sentimental. Um país que tornou o ensino superior técnico gratuito, curto e distribuído geograficamente produziu uma força de trabalho que já chega capaz de fazer o trabalho, e uma expectativa permanente de que o treinamento é algo que o estado oferece, e não algo que um empregador compra.",
    ],
  },

  // ihc-group: record prose.
  "ihc-group": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Grupo IHC - uma consultoria, uma escola e uma integradora",
    tagline: "Grupo brasileiro cujas três empresas foram fundadas em sequência, cada uma nascida da anterior.",
    intro:
      "O Grupo IHC é o grupo brasileiro formado pela HighCast, fundada em 2003 como consultoria de redes; pela inLearn Educacao, criada pelos sócios da HighCast em 2008 como centro oficial de treinamento da Juniper, da F5 Networks e de outros fabricantes; e por uma terceira empresa, de 2010, a integradora que hoje opera como CYLK.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A sequência é o que importa, e é incomum o bastante para ser registrada. A maioria dos grupos se monta por aquisição; este cresceu com cada empresa criando a seguinte a partir de uma demanda que a anterior tinha gerado: a consultoria gerou demanda por treinamento, e consultoria mais treinamento geraram demanda por alguém que implementasse e operasse o que tinha sido projetado e ensinado.",
      "Uma observação sobre o nome, porque ele é uma armadilha. \"Grupo IHC\" também corresponde a uma empresa de sistemas construtivos em Chihuahua e a um grupo brasileiro de home care e ambulâncias, nenhum dos dois relacionado a este. O próprio material do grupo acrescenta mais um aviso: o domínio ihcinformatica.com.br não tem relação com a IHC Solucoes em Informatica, cujo domínio oficial é cylk.com.br.",
    ],
  },

  // ironport: record prose plus the complete translated profile.
  "ironport": {
    // Card title (company kept verbatim), tagline and intro.
    name: "IronPort Systems",
    tagline: "Descobriu que a pergunta útil sobre um e-mail não era o que ele continha, mas quem o enviou.",
    intro:
      "A IronPort foi fundada em 2000 por Scott Weiss e Scott Banister para construir appliances de segurança de e-mail num momento em que o spam passava de incômodo a custo operacional. A resposta dela não foi um filtro de conteúdo melhor, mas uma pergunta completamente diferente.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A filtragem de conteúdo pergunta se uma mensagem parece spam. Isso é uma corrida armamentista, porque o remetente pode reescrever a mensagem. O SenderBase da IronPort perguntava, em vez disso, quem estava enviando e como esse remetente tinha se comportado em todos os outros lugares: volume, taxas de reclamação, há quanto tempo aquele endereço enviava e-mail. Um remetente sem histórico e com volume repentino é suspeito, diga a mensagem o que disser.",
      "Esses dados de reputação eram agregados entre todos os clientes, o que fazia da própria rede o produto: quanto mais organizações a usavam, melhor o sinal. É o mesmo argumento estrutural que a segurança entregue pela nuvem vem fazendo desde então, e a IronPort o fazia sobre e-mail em 2002.",
      "Os appliances rodavam um mail transfer agent feito sob medida para manter um número enorme de conexões simultâneas, porque um gateway de e-mail sob uma enxurrada de spam falha no tratamento de conexões muito antes de falhar na filtragem.",
      "A Cisco anunciou a aquisição em janeiro de 2007, por cerca de US$ 830 milhões. A tecnologia virou a linha Email Security Appliance da Cisco, e a abordagem de reputação sobreviveu à marca por décadas.",
    ],
    // Ending note (the year stays in the English record).
    endedNote:
      "Adquirida pela Cisco por cerca de US$ 830 milhões, em negócio anunciado em janeiro de 2007, e incorporada ao negócio de segurança da Cisco.",
    // Complete profile copy: facts verbatim from profiles/ironport.ts, prose translated.
    profile: {
      slug: "ironport",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "IronPort Systems",
          year: 2000,
          place: "San Bruno, Califórnia",
          founders: ["Scott Banister", "Scott Weiss"],
          story:
            "Fundada em dezembro de 2000 por dois insiders originais das mensagens na internet: Banister, o 'VP of Ideas' (vice-presidente de ideias) da Idealab, que inventou o leilão de palavras-chave com lance por posição por trás da Overture e fez parte do conselho fundador do PayPal; e Weiss, um dos primeiros integrantes da equipe do Hotmail, como CEO. Montaram a equipe com gente do Hotmail, do eGroups, do ListBot e do Yahoo, e apostaram numa ideia então contrária ao consenso: que o spam seria derrotado não pela inspeção do conteúdo das mensagens, mas pela pontuação do comportamento e da reputação das máquinas que as enviavam, entregue em appliances feitos sob medida. Cerca de US$ 90 milhões em venture capital tinham apoiado a tese até 2004.",
        },
      ],
      // Timeline: same years, same order, same personal markers.
      timeline: [
        { year: 2000, title: "Fundada em San Bruno", detail: "Dezembro de 2000: Banister e Weiss criam a IronPort em torno da reputação do remetente e do modelo de appliance, caixas brancas para a borda do e-mail, no momento em que o spam está virando um problema econômico." },
        { year: 2003, title: "O SenderBase ganha escala; a SpamCop chega", detail: "O SenderBase cresce até virar a primeira e maior rede de monitoramento de tráfego de e-mail do mundo: dados de mais de 100.000 provedores, universidades e empresas, mais de 110 parâmetros medidos por servidor de e-mail, mais de 5 bilhões de consultas por dia. Em 24 de novembro de 2003, a IronPort adquire o serviço de filtragem e denúncia SpamCop e o mantém como entidade independente." },
        { year: 2004, personal: true, title: "Meu capítulo", detail: "Do fim de 2004 até 2005: o breve trabalho independente registrado na narrativa acima, enquanto os gateways C-Series da IronPort se espalham pelas bordas de e-mail de grandes empresas e dos maiores provedores." },
        { year: 2006, title: "Os números antes do negócio", detail: "Em agosto de 2006: US$ 25 milhões em vendas trimestrais, cerca de 3.000 clientes, entre eles oito dos dez maiores provedores, 408 funcionários e nomes de peso como CNN, Microsoft, Nasdaq e PayPal na lista de clientes. Em meados dos anos 2000, a plataforma processa mais de 10 bilhões de e-mails por dia." },
        { year: 2007, title: "A Cisco paga US$ 830 milhões", detail: "Anunciado em 4 de janeiro de 2007 e concluído em 25 de junho de 2007: a Cisco, ela mesma cliente da IronPort havia muito tempo, adquire a empresa por US$ 830 milhões e a incorpora ao Security Technology Group. O SenderBase é rebatizado de SensorBase quando outros dispositivos Cisco começam a alimentar a base de dados.", sourceNote: "Datas do negócio segundo o registro corporativo da IronPort; US$ 830 milhões segundo o anúncio da Cisco." },
        { year: 2012, title: "A marca se aposenta; o nome sobrevive no DNS", detail: "26 de novembro de 2012: a IronPort passa formalmente para a lista de preços da Cisco, e a marca é aposentada. O vestígio sobrevive até hoje: o serviço de e-mail em nuvem da Cisco ainda responde em iphmx.com, IronPort Hosted MX." },
        { year: 2021, title: "A linhagem hoje", detail: "Os appliances viraram o Cisco Secure Email Gateway, e o serviço em nuvem o Cisco Secure Email Cloud Gateway, ambos ainda rodando AsyncOS, e a ideia de telemetria do SenderBase amadureceu no Talos, o grupo de inteligência de ameaças da Cisco, que analisa cerca de 600 bilhões de e-mails por dia." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "Gateways de segurança de e-mail C-Series", what: "Os appliances carro-chefe: antispam em várias camadas, antivírus e aplicação de políticas na borda SMTP, construídos para ficar na frente dos maiores sistemas de e-mail do mundo." },
        { name: "AsyncOS", what: "O sistema operacional proprietário: um kernel FreeBSD modificado com um modelo de threads sem pilha que permitia a um único appliance manter mais de 10.000 conexões simultâneas, construído para os picos assimétricos do tráfego SMTP." },
        { name: "SenderBase / SensorBase", what: "A rede de reputação que fazia os produtos funcionarem: telemetria global de e-mail pontuando cada servidor remetente da internet, licenciada até para a comunidade de código aberto, e ancestral da inteligência Talos da Cisco." },
        { name: "SpamCop", what: "O serviço comunitário de denúncia de spam e de blocklist, adquirido em 2003 e mantido independente de propósito: sinal de base alimentando um motor corporativo." },
        { name: "Appliances de segurança web", what: "A extensão S-Series do modelo para o tráfego web: a mesma filosofia de reputação em primeiro lugar aplicada ao HTTP, completando o portfólio de gateways que a Cisco comprou." },
      ],
      // Innovations.
      innovations: [
        { title: "Reputação antes do conteúdo", detail: "A percepção central da IronPort: quem envia prevê o spam melhor do que aquilo que é dito. A pontuação de reputação do remetente virou a primeira linha de defesa do e-mail na indústria, e continua sendo." },
        { title: "A telemetria como produto", detail: "O SenderBase transformou a base de clientes numa rede de sensores: cada appliance deixava todos os outros mais inteligentes, um modelo de efeito de rede que o Talos ainda opera na escala da Cisco." },
        { title: "A categoria de appliance de e-mail", detail: "Caixas feitas sob medida, com um sistema operacional feito sob medida para as patologias de um único protocolo: o design sem pilha do AsyncOS dava conta de volumes de conexão que servidores de e-mail de uso geral não aguentavam." },
      ],
      // Markets, same entry count.
      markets: [
        "A IronPort definiu o mercado de appliances corporativos de segurança de e-mail dos anos 2000, guardando as bordas de e-mail dos maiores provedores e de um quinto das maiores empresas do mundo antes de a Cisco absorvê-la. A categoria que ela criou foi depois para a nuvem, onde o serviço sucessor da Cisco ainda carrega as iniciais da IronPort no DNS.",
        "O meu trabalho, no fim de 2004 e em 2005, pertence à era independente, registrado aqui como capítulo próprio justamente porque a aquisição veio dois anos depois.",
      ],
      // Analyst standing, same entry count.
      analyst: [
        "O SenderBase na época da aquisição: telemetria de mais de 100.000 organizações, mais de 110 parâmetros por servidor de e-mail, mais de 5 bilhões de consultas por dia; a maior rede de monitoramento de e-mail do mundo, segundo a cobertura da época.",
        "Os US$ 830 milhões que a Cisco pagou em 2007 compraram uma empresa com trimestres de US$ 25 milhões e 408 funcionários, e uma rede de reputação cujo descendente, o Talos, hoje analisa cerca de 600 bilhões de e-mails por dia.",
      ],
      // Career cross-link: label translated, href unchanged.
      careerLink: { href: "/industry/chapters/cisco", label: "A IronPort virou a linhagem de segurança de e-mail da Cisco em 2007: a página da Cisco" },
    },
  },

  // italtel: record prose.
  "italtel": {
    // Parent note (official.parent.note), added 26/10/2026 with the parents apply; name, slug and year stay English facts.
    parentNote: "Desde 25 de junho de 2024, o fundo Nextalia Credit Opportunities, administrado pela Nextalia SGR, detém 71,38% da Italtel; a Clessidra Capital Credit SGR detém os 28,62% restantes.",
    // Card title (company kept verbatim), tagline and intro.
    name: "Italtel - um século da rede telefônica de outros",
    tagline: "Fundada como filial da Siemens em 1921, e ainda construindo redes cem anos depois, sob outros donos.",
    intro:
      "A Italtel começou em 1921 como filial italiana da Siemens e se tornou uma das campeãs nacionais que construíram a infraestrutura telefônica da Itália, o padrão que quase todo país europeu repetiu com um fabricante nacional atrelado à sua operadora estatal. Continua em atividade, hoje como empresa de TIC e integração de redes, e a sua lista de acionistas foi reescrita várias vezes.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Vale entender o modelo europeu das campeãs nacionais, porque ele produziu uma indústria diferente da norte-americana que esta linha do tempo documenta na maior parte. Um fabricante cujo principal cliente é o monopólio telefônico estatal otimiza para essa relação: ciclos de produto longos, integração profunda com as práticas de uma operadora e engenharia voltada para uma especificação, e não para um mercado.",
      "O que acontece com essas empresas quando o monopólio acaba é a parte interessante, e a Italtel é um exemplo resolvido de cem anos: sobreviveu virando integradora do equipamento de outros, em vez de continuar fabricante do seu próprio.",
      "A origem é mais estranha do que o modelo sugere, e vale contá-la porque quase ninguém conta. A empresa começou em Milão, em dezembro de 1898, como representante italiana da Siemens, e foi a Siemens que instalou a primeira central automática da Itália, numa exposição em 1906. Em 1945, a subsidiária foi confiscada como propriedade alemã pelo comitê aliado que liquidava bens inimigos e entregue ao Tesouro italiano. Liberada do confisco em 1950, entrou na holding industrial estatal e virou o núcleo fabril do sistema telefônico nacional. A campeã nacional italiana, em outras palavras, começou como reparação de guerra: uma subsidiária da Siemens que o verbete da Siemens não menciona ter perdido.",
      "Durante trinta anos, carregou o nome alemão de uma forma ou de outra, virando SIT-Siemens em 1960 e ainda atuando como agente da Siemens. Só virou Italtel em 1981, e a troca de nome veio com uma troca de comando: Marisa Bellisario, uma das primeiras mulheres a dirigir uma grande empresa industrial europeia, foi nomeada para recuperá-la, e recuperou. A dependência que os parágrafos acima descrevem pode ser posta num número: a empresa fornecia cerca de sessenta por cento de tudo o que a operadora estatal comprava. Uma fusão com a Telettra, que teria criado um grupo italiano de equipamentos com escala, foi discutida ao longo da década e emperrou; Bellisario morreu de repente em agosto de 1988, e em junho seguinte a empresa escolheu a AT&T como parceira.",
      "A estratégia de sobrevivência tem um caso concreto. No começo dos anos 2000, a empresa, trabalhando com a Cisco, tirou a maior parte do tráfego de voz de longa distância da Itália da rede telefônica comutada e o levou para IP (softswitches da Italtel controlando media gateways da Cisco) e, pelo próprio relato, foi a primeira no mundo a passar uma grande parcela da voz de uma incumbente para pacotes. É exatamente a transição de fabricante para integradora do equipamento de outros descrita acima, e aconteceu na rede nacional, em escala, antes que a maioria das incumbentes tivesse decidido se faria isso.",
      "A composição acionária de hoje (um fundo de private equity, um fundo de crédito e a antiga operadora estatal com dezoito por cento) é a cara do fim do modelo quando o Estado já saiu, mas a operadora ainda não largou de vez. Um século depois do confisco, a empresa ainda existe, ainda italiana, ainda abastecendo o mesmo cliente, e já não fabrica aquilo pelo qual foi confiscada.",
    ],
  },

  // ixia-keysight: record prose; acquisitions index-aligned.
  "ixia-keysight": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Ixia e Keysight",
    tagline: "Teste de redes, comprado pela parte da Hewlett-Packard que Hewlett e Packard realmente começaram.",
    intro:
      "A Ixia foi fundada em 1º de janeiro de 1997 em Calabasas, na Califórnia, para testar redes IP: gerar tráfego em line rate, quebrar as coisas de propósito e medir o que aconteceu. Quando a Keysight concluiu a aquisição, em abril de 2017, por cerca de US$ 1,6 bilhão, a Ixia atendia os quinze maiores fabricantes de equipamentos de rede, quarenta e sete das cinquenta maiores operadoras e setenta e sete das empresas da Fortune 100, com mais de 400 patentes concedidas e pendentes.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A categoria merece explicação, porque a maioria dos engenheiros nunca compra dela e tudo o que eles compram passou por ela. Antes de um switch, um firewall ou um load balancer chegar ao mercado, alguém estabelece o que ele realmente faz em line rate, sob ataque, com entrada malformada, e no ponto exato em que ele cai. Datasheets citam números; os equipamentos de teste são de onde esses números vêm, e onde um concorrente os confere.",
      "A Ixia cresceu por aquisição, e a direção é a parte interessante: Anue Systems em junho de 2012, BreakingPoint Systems em agosto daquele ano, Net Optics em outubro de 2013. A Anue e a Net Optics eram visibilidade e agregação de taps; a BreakingPoint era teste de segurança. A empresa passou de testar redes num laboratório a enxergar dentro delas em produção: o mesmo instrumento que prova que um dispositivo funciona virando o instrumento que o observa funcionando.",
      "Depois, o comprador, e é aí que a linhagem compensa a atenção. A Keysight foi separada da Agilent em 2014. A Agilent tinha sido separada da Hewlett-Packard em 1999, num IPO que levantou US$ 2,1 bilhões e foi o maior da história do Vale do Silício até então. A Keysight é o negócio original de teste e medição da HP, a linha de trabalho que começou com o oscilador de áudio 200A que Bill Hewlett e Dave Packard construíram numa garagem em 1939, o primeiro produto da empresa.",
      "Então a coisa mais antiga que a HP já fez foi separada duas vezes e hoje é negociada com nome próprio, enquanto os negócios que ficaram com as letras fazem impressoras, PCs e infraestrutura corporativa. A parte de que todo mundo lembra na história da garagem é a parte que foi embora.",
      "O negócio foi fechado em 18 de abril de 2017 a US$ 19,65 por ação em dinheiro, o maior da Keysight desde que se tornou independente, maior do que o da Anite, de US$ 606 milhões, em 2015. A Ixia virou o Ixia Solutions Group. A CEO na época, Bethany Mayer, tinha vindo da HP, o que faz disso um reencontro menor do que parece.",
    ],
    // Acquisitions prose, index-aligned with the English list (year, name, price, founder stay English).
    acquisitions: [
      // 0: Anue Systems (2012).
      { what: "Software de visibilidade de rede e agregação de taps, fundada por Kevin Przybocki, Hemi Thaker e Chip Webb.", became: "O passo da Ixia do teste em laboratório para a visibilidade em produção.", sourceNote: "Noticiada a US$ 145 milhões no anúncio e a cerca de US$ 155 milhões depois; os dois números circulam." },
      // 1: BreakingPoint Systems (2012).
      { what: "Teste de segurança de redes: geração de tráfego de ataque realista contra os dispositivos em teste.", became: "A metade de segurança do portfólio de testes." },
      // 2: Net Optics (2013).
      { what: "Taps de rede e acesso para monitoramento.", became: "Completou a linha de visibilidade que a Keysight depois citou como um dos motivos para comprar a empresa." },
    ],
  },

  // ka-solution: record prose.
  "ka-solution": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Ka Solution",
    tagline: "Carrega os currículos oficiais de quinze fabricantes ao mesmo tempo, um negócio diferente de carregar um só.",
    intro:
      "A Ka Solution oferece treinamento e consultoria em tecnologia em São Paulo desde 1993. Ela se descreve como o maior centro oficial de treinamento SAP da América Latina e o maior centro oficial Microsoft e Oracle do Brasil, e informa treinar mais de 15.000 alunos por ano em duas unidades em São Paulo.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A lista de fabricantes é o verbete, pelo que carregar tantos ao mesmo tempo realmente exige. SAP, Microsoft, AWS, Oracle, Java, VMware, Citrix, Dell EMC, Cisco, CompTIA, EC-Council, EXIN, (ISC)² e Dynatrace, quatro dos quais têm verbete próprio nesta linha do tempo. Cada uma dessas autorizações é um contrato separado, uma trilha separada de certificação de instrutores, uma licença separada de material didático, uma auditoria separada e um conjunto separado de requisitos de laboratório que raramente se parecem entre si.",
      "Então a dificuldade é administrativa antes de ser pedagógica, e essa é a parte que quem está de fora subestima sistematicamente. Um instrutor certificado por um fabricante não está certificado por outro; uma sala configurada para os laboratórios de um fabricante não está configurada para os de outro; uma agenda que lota uma academia SAP não lota um curso de segurança. Uma escola multifabricante opera uma dúzia de pequenos negócios que por acaso dividem a mesma recepção.",
      "Isso faz dela o sexto modelo distinto de treinamento registrado aqui, e vale situá-la diante dos outros. A CompTIA é certificação que não pertence a ninguém. A EPI é um órgão especializado num único domínio. A reserva de mercado formou uma força de trabalho dentro de fabricantes protegidos. A Microcamp ensinava o público em geral. A Red Education entrega currículos autorizados como parceira de fabricantes, internacionalmente. Esta tem a mesma função de entrega autorizada que a Red Education, organizada de outro jeito: uma cidade, muitos fabricantes, matrícula de balcão e um modelo de negócio mais próximo de uma escola de idiomas do que de uma consultoria.",
      "O mercado que ela atende é o que este site raramente descreve. A maior parte da discussão sobre certificação supõe um empregador corporativo pagando o treinamento como parte de um projeto. Uma escola comercial no centro de uma cidade atende outro cliente: a pessoa que paga do próprio bolso, à noite, para mudar aquilo para que está qualificada. Esses dois clientes querem coisas diferentes do mesmo curso (o primeiro quer a equipe produtiva num produto que já comprou, o segundo quer uma credencial que um empregador reconheça), e uma escola com quinze fabricantes está, estruturalmente, atendendo o segundo.",
      "A oferta em volta do treinamento reflete isso: parcelamento, turmas noturnas e remotas com instrutor ao vivo e acordos de colocação profissional com consultorias. A credencial é o produto, e todo o resto está organizado para levar as pessoas até ela, o que é a descrição honesta de boa parte desta indústria, e uma que a indústria não costuma usar sobre si mesma.",
    ],
  },

  // kentik: record prose.
  "kentik": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Kentik",
    tagline: "Quem operava as redes construiu a ferramenta que não conseguia comprar.",
    intro:
      "A Kentik foi fundada em San Francisco em 2014 como CloudHelix e adotou o nome atual em 2015. A lista de fundadores aparece com quatro nomes na maioria dos relatos (Avi Freedman, Ian Applegate, Ian Pye e Justin Biegel) e com cinco em outros, que acrescentam Dan Ellis; as duas versões ficam registradas aqui. O que não está em discussão é de onde eles vieram.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Avi Freedman abriu o primeiro provedor de internet da Filadélfia, o netaxs, em 1992. Depois comandou as operações de rede da Akamai por mais de uma década, como vice-presidente de infraestrutura de rede e depois como chief network scientist, e também comandou a rede da AboveNet e foi CTO da ServerCentral. Ian Pye é descrito como o primeiro funcionário da Cloudflare; Ian Applegate também veio da Cloudflare. Dan Ellis veio da Netflix. Biegel veio da Internap.",
      "Então a equipe fundadora é uma convergência de empresas que já estão nesta linha do tempo: a Akamai e a Cloudflare têm verbetes próprios aqui, e as duas foram construídas sobre a mesma percepção de para onde o tráfego realmente vai. As pessoas que tinham operado essas redes saíram para construir algo para quem ainda as operava.",
      "O motivo que deram é o verbete. No relato de Freedman, grandes empresas web, corporações e provedores de serviço viviam dizendo a eles que as análises disponíveis dentro das empresas de escala de nuvem simplesmente não existiam no mercado comercial, sobretudo para visibilidade da internet e para arquiteturas que tinham deixado de se parecer com um data center. Então construíram o que tinham desejado e não conseguiam comprar. É um formato específico e recorrente: uma categoria existe porque quem precisava dela era sênior o bastante para construí-la em vez de esperar.",
      "O produto ingere o que uma rede realmente emite, e não o que uma ferramenta de monitoramento gostaria que ela emitisse: registros NetFlow, IPFIX e sFlow, SNMP, streaming telemetry, flow logs de nuvem, agentes em hosts, testes sintéticos e roteamento BGP. Os registros de fluxo são a parte interessante para quem já tentou isso em escala, porque chegam em volume enorme, são lossy por design, e a pergunta analítica quase nunca é sobre um único registro, e é por isso que o problema é um problema de dados fantasiado de problema de redes.",
      "A tração foi incomumente rápida: rodada seed de US$ 3,1 milhões em setembro de 2014, uma Série A de US$ 12,1 milhões em junho de 2015, implantações em poucos meses e mais de vinte grandes clientes pagantes em menos de um ano, entre eles Yelp e Box. Rodadas posteriores levaram o financiamento total para algo entre US$ 102 milhões e US$ 118 milhões, conforme a contagem usada.",
      "Uma contribuição pública merece registro, porque é o tipo de coisa que essa classe de ferramenta torna possível: a Kentik esteve entre os que identificaram um sequestro substancial de endereços IP no período anterior à posse presidencial de 2021 nos Estados Unidos. Sequestros de rota só são visíveis para quem observa a tabela global de roteamento de perto o bastante para notar que um bloco de endereços começou a ser anunciado do lugar errado. A empresa também emprega Doug Madory, cujas análises de roteamento da internet são amplamente citadas.",
      "Foi adquirida pela Infoblox em 2026. O arco é conhecido nesta linha do tempo (uma ferramenta independente, construída por praticantes, acaba comprada por um fabricante de plataforma que quer a capacidade dentro do próprio produto), e se isso melhora a ferramenta ou apenas a absorve ainda não dá para responder.",
    ],
  },

  // kyndryl: record prose plus the complete translated profile.
  "kyndryl": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Kyndryl",
    tagline: "O maior spin-off de tecnologia em número de funcionários, em que a independência era o objetivo, e não o preço.",
    intro:
      "A IBM anunciou em outubro de 2020 que separaria o seu negócio de infraestrutura gerenciada. A unidade recebeu o nome Kyndryl em abril de 2021 (kyn de kinship, parentesco, e dryl de tendril, gavinha, uma construção que divertiu um pouco a imprensa), e a separação foi concluída em 4 de novembro de 2021, quando as ações começaram a ser negociadas na Bolsa de Nova York, com cerca de 90.000 funcionários. Foi, e continua sendo, o maior spin-off de tecnologia em número de funcionários.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A escala é mais fácil de entender pelo outro lado. O Financial Times descreveu a operação como a IBM se desfazendo de um quarto do seu negócio, e a unidade levou consigo o grosso do que tinha sido a IBM Global Technology Services: cerca de 4.400 clientes, incluindo perto de três quartos da Fortune 100, operações em sessenta e três países e uns quatrocentos data centers.",
      "O motivo normalmente apontado é o declínio, e ele é verdadeiro, mas incompleto. Dentro da IBM, o negócio tinha penado na era da nuvem, porque os clientes estavam levando cargas de trabalho para os hyperscalers e poucos ainda tinham apetite pelos contratos de outsourcing longos e grandes em torno dos quais a unidade tinha sido construída. Livrar-se de um negócio em encolhimento para se concentrar na nuvem híbrida é uma estratégia compreensível, e foi o que a cobertura destacou.",
      "O motivo mais interessante é estrutural, e é o que vale levar daqui. Um negócio de serviços gerenciados pertencente a um fabricante de nuvem não consegue recomendar com credibilidade a nuvem de um concorrente. O que quer que os engenheiros realmente pensem, o conselho chega de uma empresa cuja controladora vende a alternativa, e o cliente o desconta de acordo. A independência não foi o prêmio de consolação por não ser desejado: foi o que tornou o negócio vendável de novo.",
      "A prova está no calendário. A Kyndryl anunciou uma parceria com a Microsoft em novembro de 2021, o mesmo mês da separação, e com o Google Cloud em dezembro. Nenhuma das duas estava disponível nesses termos para uma divisão da IBM.",
      "É o mesmo argumento que esta linha do tempo registra em outro ponto, num cenário diferente. As certificações da CompTIA são valiosas justamente porque não pertencem a nenhum fabricante, e a questão em aberto ali é se isso sobrevive à propriedade de um fundo de private equity. A Kyndryl é a imagem espelhada: um negócio cujo conselho valia menos enquanto tinha dono, e passou a valer mais quando deixou de ter. Nos dois casos, o ativo é a neutralidade, e a neutralidade é uma propriedade de quem é o seu dono, e não do que você sabe.",
      "Martin Schroeter, que tinha sido CFO da IBM e depois vice-presidente sênior, deixou a empresa em junho de 2020 e voltou em janeiro de 2021 para comandar a nova. O primeiro veredito do mercado foi frio: as ações fecharam o dia de estreia a US$ 26,38, queda de cerca de sete por cento, e recuaram mais no after-hours.",
      "E é a terceira vez que a IBM aparece nesta linha do tempo entregando algo. Comprou a Lotus em 1995 pela tecnologia do Notes, vendeu o Notes e o Domino à HCL num negócio anunciado em 2018 e separou este negócio em 2021. Uma empresa que passou décadas adquirindo é hoje mais visível aqui pelo que deixou ir.",
    ],
    // Complete profile copy: facts verbatim from profiles/kyndryl.ts, prose translated.
    profile: {
      slug: "kyndryl",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "Kyndryl",
          year: 2021,
          place: "Nova York",
          founders: ["IBM"],
          story:
            "Não tanto fundada quanto separada: a IBM Global Technology Services, que ganhou um nome em abril de 2021 e listagem própria em 4 de novembro. O que a tornava incomum como empresa nova era que começou com uma base de clientes completa, uma estrutura de custos completa e nenhuma possibilidade de escolher nenhuma das duas.",
        },
      ],
      // Timeline: same years, same order, same personal markers.
      timeline: [
        { year: 2020, title: "O anúncio", detail: "Outubro: a IBM diz que vai separar o seu negócio de infraestrutura gerenciada." },
        { year: 2021, title: "Batizada, listada, com parceiros", detail: "Batizada em abril, separada em 4 de novembro, e com parcerias com hyperscalers em poucas semanas." },
        { year: 2023, title: "Os três As", detail: "Alliances, Advanced Delivery e Accounts: aumentar a receita com parcerias com hyperscalers, automatizar a entrega para que as pessoas possam ser realocadas, e não substituídas, e corrigir ou encerrar os relacionamentos com clientes que davam margens abaixo do padrão. Um programa em três partes sem glamour, e a totalidade da recuperação." },
        { year: 2025, title: "A tese, medida", detail: "O ano fiscal de 2025 gerou US$ 1,2 bilhão de receita ligada às alianças com hyperscalers de nuvem, mais do que o dobro do ano anterior, e acima da meta. Esse número é o argumento da neutralidade expresso em dinheiro: é o negócio que a empresa não poderia ter fechado enquanto a IBM era a dona." },
        { year: 2026, title: "Contratações acima da receita", detail: "Contratações nos últimos doze meses de US$ 15,4 bilhões a US$ 15,6 bilhões contra uma receita de cerca de US$ 15,0 bilhões, receita com hyperscalers a caminho de uma meta de US$ 1,8 bilhão e a Kyndryl Consult crescendo na casa dos vinte e poucos por cento enquanto se aproxima de um quarto do negócio. Só no terceiro trimestre, onze contratos acima de US$ 50 milhões cada." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "Serviços de infraestrutura gerenciada", what: "O negócio original: operar mainframes, redes, storage e data centers para organizações que não vão operá-los elas mesmas. Fora de moda, enorme, e o motivo de três quartos da Fortune 100 serem clientes desde o primeiro dia." },
        { name: "Kyndryl Consult", what: "Consultoria e implementação, e o movimento deliberado para cima na cadeia de valor: hoje cerca de US$ 3,6 bilhões de receita, crescendo na casa dos vinte e poucos por cento, e a parte do negócio que decide se a empresa é uma prestadora de serviços ou uma conselheira." },
        { name: "Kyndryl Bridge", what: "A plataforma de operação: a telemetria de entrega de milhares de ambientes gerenciados transformada num produto que os clientes enxergam. É o que um outsourcer tem e ninguém mais tem: dados observados sobre como grandes ambientes realmente se comportam." },
        { name: "Práticas de hyperscalers", what: "Práticas dedicadas para as principais nuvens, com equipes e certificações separadas. O ponto é que todas existem ao mesmo tempo, e essa é a proposta inteira." },
        { name: "Práticas de segurança, resiliência e redes", what: "As linhas especializadas vendidas na mesma base de clientes: o padrão de uma empresa de serviços que cresce em profundidade, e não com novos logotipos." },
      ],
      // Innovations.
      innovations: [
        { title: "A neutralidade como item do balanço", detail: "O argumento de que um conselheiro independente pode recomendar qualquer nuvem é fácil de fazer e difícil de provar. Aqui ele é mensurável: a receita ligada aos hyperscalers mais do que dobrou num único ano e caminha para US$ 1,8 bilhão. Isso não é posicionamento de marca, é negócio que antes não poderia ter sido fechado." },
        { title: "Automatizar a entrega para realocar, e não para cortar", detail: "A iniciativa Advanced Delivery liberou pessoas para atender trabalho novo e repor a rotatividade, em vez de serem demitidas. Se esse enquadramento sobrevive a uma crise ainda não foi testado, mas um negócio intensivo em mão de obra que automatiza a própria entrega precisa decidir para que servem as economias, e este disse isso em voz alta." },
        { title: "Corrigir ou abandonar contratos sem lucro", detail: "A iniciativa Accounts significou renegociar ou encerrar negócios que a empresa tinha herdado com margens ruins. Encolher a receita de propósito é difícil dentro de uma empresa de capital aberto, e quase impossível dentro de uma divisão de uma empresa maior, em que a linha de receita pertence à história de outra pessoa." },
        { title: "Vender de volta os dados de operação", detail: "O Bridge transforma em produto o que a empresa vê em milhares de ambientes. O verdadeiro ativo de um outsourcer não são as suas pessoas, mas as suas observações, e transformá-las em algo que o cliente possa ver é a diferença entre vender horas e vender conhecimento." },
      ],
      // Markets, same entry count.
      markets: [
        "Grandes empresas e governos em mais de sessenta países, com cerca de US$ 15 bilhões de receita anual: as organizações cujos ambientes de tecnologia são grandes demais, antigos demais ou regulados demais para mudar de uma vez, uma posição duradoura enquanto essas condições durarem.",
        "Compete com as integradoras e consultorias globais, com os serviços profissionais dos próprios hyperscalers e, em custo, com os provedores de serviços offshore. A sua diferenciação é aquela que a separação criou: ela pode ser indiferente, com credibilidade, a qual nuvem um cliente escolhe.",
      ],
      // Analyst standing, same entry count.
      analyst: [
        "Contratações acima da receita são a medida que vale acompanhar num negócio de serviços, porque são o único indicador antecedente de uma empresa cuja receita é contratada com anos de antecedência. Por essa medida, a trajetória é positiva desde a separação.",
        "O veredito sobre a pergunta original já está em grande parte dado. Cinco anos depois de uma estreia fria, as linhas que mais crescem são as que dependem inteiramente de ser independente. Se o negócio teria declinado mais devagar dentro da IBM é impossível saber, mas o negócio que ela fechou desde que saiu não é um negócio que poderia ter fechado se tivesse ficado.",
      ],
    },
  },

  // logrhythm: record prose.
  "logrhythm": {
    // Card title (company kept verbatim), tagline and intro.
    name: "LogRhythm - o problema do SIEM, dito com honestidade",
    tagline: "Coletar tudo é fácil; o custo é que alguém precisa ler.",
    intro:
      // Corrected 2026-10-26 (endings apply), mirroring the English: past tense since the 2024 merger.
      "A LogRhythm fazia security information and event management, a categoria que centraliza os logs de um ambiente e tenta transformá-los em detecções. A tecnologia é bem compreendida, e o modo de falha é organizacional: um SIEM só é tão bom quanto a atenção que recebe, e atenção é o recurso mais escasso de qualquer equipe de segurança.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A LogRhythm foi fundada em Boulder em 2003 por Chris Petersen e Phillip Villella, e não começou com esse nome: operou como Security Conscious, Inc. até um rebranding em 2005. Para financiar o começo, Petersen vendeu a casa em Washington por cem mil dólares e se mudou para o Colorado, uma imagem mais precisa de como uma empresa de segurança começa do que qualquer narrativa de fundação.",
      "O problema que eles se propuseram a resolver era o estado da gestão de logs: sistemas que coletavam volumes enormes e os tornavam caros de armazenar e difíceis de consultar. Essa lacuna definiu toda a categoria de security information and event management e nunca se fechou por completo: a economia de guardar tudo e a necessidade de pesquisar depressa continuam puxando em direções opostas.",
      "A empresa foi adquirida pela Thoma Bravo em 2018 e fundida com a Exabeam em 2024, o que encerrou a marca como nome independente. Esse caminho (private equity e depois a combinação com um concorrente) é o desfecho padrão de uma empresa de produto de segurança que está estabelecida, e não crescendo, e se repete neste catálogo com frequência suficiente para contar como padrão, e não como evento.",
      "O que ela deixa é uma categoria que a maioria das organizações opera e poucas apreciam. Uma plataforma que ingere tudo e alerta sobre parte disso é julgada pelos alertas sobre os quais ninguém agiu, o que faz deste o canto da segurança em que ferramenta e equipe são menos separáveis: o produto não pode ser melhor do que o número de pessoas disponíveis para ler o que ele produz.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A LogRhythm e a Exabeam concluíram sua fusão em 17 de julho de 2024, e a empresa combinada manteve o nome Exabeam.",
  },

  // lumen-centurylink-level3: record prose plus the complete translated profile; acquisitions index-aligned.
  "lumen-centurylink-level3": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Lumen, CenturyLink, Level 3 e Global Crossing",
    tagline: "Uma companhia telefônica rural da Luisiana que acabou dona de um dos maiores backbones da internet.",
    intro:
      "Esta é uma empresa só, por sucessão, e quatro ou cinco, pela história. Foi constituída em 1968 como Central Telephone and Electronics Corporation, rebatizada Century Telephone Enterprises em 1971, e passou quatro décadas como CenturyTel, uma operadora local rural com sede em Monroe, na Luisiana, crescendo pela compra de outras operadoras rurais. Hoje é a Lumen Technologies, e opera o AS3356.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A era da operadora rural é a parte menos glamorosa e mais instrutiva. Comprar pequenas operadoras locais uma a uma é fora de moda, intensivo em capital e lento, e em 2008 isso tinha feito da CenturyTel uma das maiores operadoras rurais dos Estados Unidos, ou seja, grande o bastante para comprar coisas muito mais conhecidas do que ela.",
      "A Embarq veio em 2009, o antigo negócio de telefonia fixa da Sprint, ele próprio descendente da United Telephone. As fontes divergem sobre o preço: US$ 5,8 bilhões em troca de ações num relato, cerca de US$ 11,6 bilhões em outro, e a diferença quase certamente está em contar ou não a dívida. A empresa resultante da fusão adotou o nome CenturyLink.",
      "A Qwest veio em 2011, por cerca de US$ 12,2 bilhões, e a Qwest era ela mesma uma companhia Bell por descendência: a US West, antes Mountain Bell, que atendia catorze estados do oeste e do meio-oeste. Isso fez da CenturyLink a terceira maior operadora de telefonia fixa do país, atrás da Verizon e da AT&T.",
      "Depois, a Level 3, com conclusão em 1º de novembro de 2017. Anunciada por US$ 25,6 bilhões, comumente noticiada em cerca de US$ 34 bilhões incluindo a dívida. A Level 3 tinha sido fundada em 1985, sediada em Broomfield, no Colorado, e era a maior operadora local competitiva dos Estados Unidos e uma das maiores operadoras de fibra de qualquer lugar: a empresa cujo número de sistema autônomo, o AS3356, aparece em mais traceroutes do que quase qualquer outro.",
      "E a Level 3 também vinha se montando. WilTel, Broadwing, Looking Glass, Progress Telecom, TelCove, TW Telecom em 2014, e Global Crossing em 2011, que é o verbete dentro deste verbete que vale a pena ler.",
      "A Global Crossing foi fundada em março de 1997 por Gary Winnick e David L. Lee para lançar cabos submarinos e, durante a bolha de 1999, foi avaliada em US$ 47 bilhões. Nunca teve um único ano lucrativo. Em 2002, entrou com um dos maiores pedidos de falência da história, os seus executivos foram acusados de encobrir um escândalo contábil e, em 2011, a Level 3 comprou o que restava por US$ 3 bilhões, incluindo a assunção de US$ 1,1 bilhão em dívidas. O CEO na época era John Legere, que depois comandou a T-Mobile.",
      "A Global Crossing também tinha comprado a Impsat, a operadora de redes latino-americana, e foi assim que a fibra construída para a Argentina, o Brasil e a região acabou dentro de uma operadora rural da Luisiana, passando por uma falência nas Bermudas.",
      "Em 2022, a Lumen vendeu as suas operações de telefonia local em vinte estados à Brightspeed, mantendo uma presença no oeste e o negócio de fibra. Assim, a empresa passou cinquenta anos adquirindo linhas telefônicas rurais e depois vendeu a maior parte delas, depois de usá-las para comprar um backbone global.",
    ],
    // Acquisitions prose, index-aligned with the English list (year, name, price, founder stay English).
    acquisitions: [
      // 0: Embarq (2009).
      { what: "O antigo negócio de telefonia fixa da Sprint, presente em dezoito estados.", became: "A empresa resultante da fusão foi rebatizada CenturyLink.", sourceNote: "As fontes discordam sobre o valor; os dois são informados, em vez de se escolher um. A diferença mais provável é a dívida.", subAcquisitions: [{ what: "A Embarq descendia da United Telephone, que virou as operações locais da Sprint antes de ser separada; assim, este negócio comprou uma linhagem mais antiga do que o comprador." }] },
      // 1: Qwest Communications (2011).
      { what: "Catorze estados do oeste e do meio-oeste, fibra de longa distância e clientes corporativos.", became: "A terceira maior operadora de telefonia fixa dos EUA, atrás da Verizon e da AT&T.", subAcquisitions: [{ what: "A Qwest era uma companhia Bell por linhagem, depois de se fundir com a US West em 2000, ela própria uma das operadoras regionais criadas quando o Bell System foi desmembrado." }] },
      // 2: Level 3 Communications (2017).
      { what: "A maior operadora local competitiva dos EUA e operadora do AS3356, um dos principais backbones da internet. Concluída em 1º de novembro de 2017.", became: "A empresa combinada virou a Lumen Technologies, e o backbone é o motivo de o nome ser conhecido fora da Luisiana.", sourceNote: "Os dois números refletem valor patrimonial versus enterprise value; ambos aparecem em coberturas respeitáveis.", subAcquisitions: [{ what: "Avaliada em US$ 47 bilhões em 1999, nunca lucrativa em nenhum ano, falida em 2002 num dos maiores pedidos da história, e vendida por uma fração do seu pico doze anos depois. Ela própria tinha adquirido a Impsat, a operadora latino-americana, e foi assim que a fibra regional do Brasil e da Argentina entrou nesta linhagem." }, { what: "Fibra metropolitana e Ethernet em mercados dos EUA, de onde veio boa parte da presença em data centers da Lumen." }, { what: "Uma das várias redes de longa distância que a Level 3 consolidou nos anos pós-bolha, quando a capacidade construída para a demanda de 1999 era vendida por uma fração do custo." }] },
    ],
    // Complete profile copy: facts verbatim from profiles/lumen-centurylink-level3.ts, prose translated.
    profile: {
      slug: "lumen-centurylink-level3",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "Central Telephone and Electronics Corporation, which became CenturyTel, CenturyLink and Lumen",
          year: 1968,
          place: "Luisiana",
          founders: [],
          story:
            "William Clarke e Marie Williams compraram o negócio telefônico local em 1930, com 75 assinantes pagantes, por US$ 500, e ele continuou sendo operado pela família até ser constituído na Luisiana em 1968 como Central Telephone and Electronics. Rebatizado Century Telephone Enterprises em 1971, passou quatro décadas como CenturyTel, uma operadora local rural em Monroe, na Luisiana, que crescia comprando outras operadoras rurais, antes de as aquisições da Embarq, da Qwest e da Level 3 a transformarem em CenturyLink e depois em Lumen.",
          sourceNote:
            "Constituição na Luisiana em 1968 segundo o Form 10-K da Lumen de 2025 (\"Since being incorporated in Louisiana in 1968\", desde a constituição na Luisiana em 1968); a compra de 1930 e a operação familiar até 1968 segundo o artigo Lumen Technologies da Wikipedia, cujo infobox data a empresa de 1930; nomes anteriores segundo o mesmo artigo.",
        },
        {
          company: "Kiewit Diversified Group, which became Level 3",
          year: 1985,
          place: "Omaha, Nebraska",
          founders: ["Peter Kiewit Sons'"],
          story:
            "O veículo de uma construtora para tudo o que não era construção. Essa origem não é casual: a especialidade da Kiewit era cavar, e a rede que a sua subsidiária acabou construindo refletiu isso. James Crowe já tinha construído a MFS Communications dentro do mesmo grupo (a empresa que adquiriu a UUNET e foi vendida à WorldCom por US$ 14,3 bilhões) e, em 1997, recomeçou, trazendo de volta da WorldCom dezoito dos seus antigos executivos e vendendo os ativos do grupo que não eram de telecomunicações para pagar a fibra.",
        },
      ],
      // Timeline: same years, same order, same personal markers.
      timeline: [
        { year: 1998, title: "Batizada com o nome de uma camada", detail: "O novo nome aponta para a Camada 3 do modelo OSI, a camada de roteamento. Uma empresa de telecomunicações se batizou com o nome da parte da pilha que pretendia atender, num momento em que os concorrentes ainda vendiam circuitos." },
        { year: 2003, title: "A Genuity, e o AS1", detail: "A compra da Genuity trouxe junto o primeiro número de sistema autônomo já alocado, que tinha pertencido à BBN, a empresa que construiu a ARPANET. A rede opera no AS3356 e detém o AS1 desde então, sem usá-lo." },
        { year: 2017, title: "O CEO da empresa adquirida assume o comando", detail: "A fusão foi concluída em 1º de novembro, depois de o Departamento de Justiça exigir a venda de vinte e quatro rotas de fibra em trinta pares de cidades e de três mercados de Ethernet metropolitana. O CEO da Level 3 virou COO da empresa combinada e, um ano depois, CEO, numa sucessão acertada antes do fechamento do negócio." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "O backbone IP", what: "O AS3356, uma das redes mais densamente conectadas da internet, que alcança a maior parte dela sem pagar trânsito a ninguém. É o ativo em torno do qual todo o resto da empresa hoje se organiza." },
        { name: "Fibra e comprimentos de onda corporativos", what: "Capacidade dedicada entre sites de clientes e data centers, vendida às organizações para as quais a internet pública não é um caminho aceitável." },
        { name: "Edge computing e serviços de segurança", what: "Computação posicionada na rede, e não numa região, e mitigação de DDoS entregue a partir de um backbone grande o bastante para absorver ataques: o mesmo argumento que as redes de entrega de conteúdo fazem, pela direção oposta." },
        { name: "Serviços de telefonia local", what: "O negócio de telefonia rural que a empresa passou cinquenta anos montando, cuja maior parte já foi vendida." },
      ],
      // Innovations.
      innovations: [
        { title: "Duto, não cabo", detail: "A rede foi construída enterrando dutos vazios e puxando fibra por dentro deles, para que a capacidade pudesse ser ampliada depois sem cavar a rota de novo. É a resposta de uma construtora a um problema de telecomunicações, e é o motivo de uma rede projetada no fim dos anos noventa continuar competitiva: a parte cara era a vala, e a vala foi construída para ser reutilizada." },
        { title: "Construir para pacotes quando o dinheiro estava em circuitos", detail: "Otimizar para o protocolo IP, e não para a voz comutada, era uma aposta contra a própria base de receita da indústria na época. Batizar a empresa com o nome da camada de roteamento foi um jeito de dizer isso em voz alta." },
        { title: "Vender o resto da empresa para financiar a rede", detail: "O capital inicial veio da liquidação dos ativos não relacionados de um grupo de construção. Infraestrutura nessa escala não pode ser financiada aos poucos com a receita, e as empresas que tentaram no mesmo período estão nesta linha do tempo como falências." },
        { title: "Montar um backbone com os fracassos dos outros", detail: "Quase todo grande ativo chegou de uma empresa que não conseguia sustentá-lo sozinha. Construir do zero era ruinoso; comprar depois era acessível. Essa é a economia real da era da fibra, e esta empresa é o exemplo mais claro do lado que sobreviveu a ela." },
      ],
      // Markets, same entry count.
      markets: [
        "Empresas, governos, provedores de conteúdo e outras operadoras, além das linhas residenciais e empresariais que sobraram depois da venda de 2022. O cliente do backbone é qualquer um que mova tráfego suficiente para se importar com qual rede o transporta.",
        "Compete com as outras grandes operadoras de backbone e, cada vez mais, com as redes privadas dos hyperscalers, que hoje transportam uma parcela substancial do tráfego mundial em infraestrutura que eles mesmos construíram, em vez de comprar.",
      ],
      // Analyst standing, same entry count.
      analyst: [
        "As avaliações se concentram na dívida assumida para montar a rede, contra o valor de possuir rotas de fibra que ninguém financiaria construir de novo hoje. O ativo é de fato difícil de reproduzir; o balanço é o argumento.",
        "A visão mais longa é que uma subsidiária de construção em Nebraska e uma companhia telefônica rural na Luisiana acabaram, juntas, donas de um dos principais backbones da internet, e nenhuma das duas tinha esse objetivo. As rotas existiam porque alguém estava disposto a cavar, e cavar acabou sendo a parte duradoura.",
      ],
    },
  },

  // micom: record prose.
  "micom": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Micom - concentradores, e o que eles realmente vendiam",
    tagline: "Menos linhas dedicadas para o mesmo número de terminais, um argumento que qualquer diretor financeiro entende.",
    intro:
      "A Micom foi fundada em 1975 por Stephen Bernard Dorsey e construiu o negócio sobre concentradores de dados, equipamentos que permitiam a muitos terminais compartilhar um circuito em vez de cada um precisar do seu. Foi vendida à Philips em 1984 e adquiriu a Spectrum Digital em 1987.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A história das comunicações de computadores de James L. Pelkey registra um capítulo anterior ao que o registro corporativo mostra: a American Data Systems se desfez entre 1970 e 1972, e o empreendimento ressurgiu como Micom, que viria a ser um dos maiores sucessos da época. É a forma mais rara nesta linha do tempo: a maioria dos verbetes aqui foi adquirida e absorvida, e uma empresa que fracassou e voltou com outro nome é outra história. O relato é de Pelkey, e a história dele dá a isso duas seções numeradas, o colapso no §5.11 e o renascimento no §7.6, uma citação mais precisa do que o registro corporativo oferece, já que nenhum registro acessível aqui sequer traz essa ligação.",
      "O concentrador é o caso mais claro, nesse período, de um produto vendido pela aritmética e não pela capacidade. Uma linha dedicada era um custo recorrente, e os terminais ficavam ociosos a maior parte do tempo; uma caixa que permitia a oito terminais compartilhar uma linha se pagava contra o aluguel da linha, e o argumento técnico mal precisava ser feito.",
      "Esse formato se repete o tempo todo em redes e vale a pena reconhecê-lo: os produtos que se espalham mais depressa costumam ser aqueles cujo benefício pode ser escrito como uma subtração na conta mensal de alguém.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A MICOM Communications Corp. tornou-se uma subsidiária integral indireta da Northern Telecom quando a fusão que se seguiu à oferta pública da Nortel foi concluída em 21 de junho de 1996.",
  },

  // microsoft: record prose.
  "microsoft": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Microsoft",
    tagline: "A empresa de plataforma: Windows, Azure e Microsoft 365.",
    intro:
      "Os sistemas operacionais, a suíte de produtividade e a nuvem Azure da Microsoft formam o substrato da maioria dos ambientes de TI corporativos, o que torna as suas tecnologias uma presença constante em qualquer catálogo sério de treinamento.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A Microsoft aparece como fabricante selecionável no buscador de cursos da Red Education, ensinada com o mesmo modelo conduzido por instrutor do resto do portfólio e, muitas vezes, ao lado das plataformas de segurança que protegem ambientes centrados em Microsoft.",
      "Fundada em 1975 por Bill Gates e Paul Allen, a Microsoft ancora a computação corporativa há cinco décadas, do BASIC e do MS-DOS ao Windows e ao Office, até o Azure e o seu negócio de segurança, hoje um dos maiores da indústria. Várias histórias do glossário deste site, da Open Letter do Homebrew Computer Club à contestada citação dos 640K, remontam a ela.",
      "O verbete da IBM registra a decisão que fez esta empresa: uma arquitetura aberta de PC que entregou a economia da plataforma ao fornecedor do sistema operacional. Tudo o que veio depois (o Office, o negócio de servidores, o Azure, um negócio de segurança hoje entre os maiores da indústria) descende de uma licença do DOS. Vale lembrar que a maior empresa de software do mundo começou como beneficiária do erro de outra.",
      "A posição da empresa faz do seu histórico de segurança o caso que mais importa. Em 2023, um ator ligado a um Estado leu e-mails de vinte e duas organizações, entre elas os Departamentos de Estado e de Comércio dos EUA, por pelo menos seis semanas: cerca de sessenta mil mensagens só do Departamento de Estado. O instrumento foi uma chave de assinatura do serviço de consumo, emitida em 2016, que não deveria mais assinar nada, e que o serviço corporativo aceitou assim mesmo. Uma chave que deveria estar morta forjava tokens para praticamente qualquer caixa postal do mundo.",
      "A conclusão do conselho de revisão do governo foi direta: a intrusão nunca deveria ter acontecido, e teve sucesso por causa de uma cascata de falhas de segurança. O conselho encontrou uma cultura corporativa que tinha despriorizado o investimento em segurança e a gestão de riscos, e recomendou que o CEO e o conselho de administração publicassem um plano de reforma com prazos e fossem cobrados por ele. A empresa respondeu com uma Secure Future Initiative.",
      "Dois detalhes carregam a lição. Primeiro, a empresa ainda não sabe como a chave foi obtida; investigava dezenas de hipóteses quando o Board apresentou o relatório. Segundo, em setembro de 2023, publicou uma causa mais provável (a chave num crash dump) para a qual o Board não encontrou evidência alguma; a empresa sabia desde novembro que o relato estava errado e o deixou de pé até março, quando o Board estava concluindo o trabalho. É a mesma disciplina, vista do outro lado: a declaração de um fornecedor sobre um incidente é uma alegação, e a distância entre o que ela diz e o que se sabe pode ficar aberta por seis meses, mesmo na empresa que está no centro do ecossistema.",
      "O argumento da simetria do verbete da Huawei se aplica aqui sem ajuste. A questão de quem pode obrigar um fornecedor, e de se o relato que um fornecedor faz de si mesmo merece confiança, não depende de onde o fornecedor está constituído. Este é o fornecedor que a maior parte do mundo acha tranquilizador, e a conclusão foi uma cascata.",
    ],
  },

  // mitre: record prose.
  "mitre": {
    // Card title (company kept verbatim), tagline and intro.
    name: "MITRE - a organização sem fins lucrativos entre o comprador e o fabricante",
    tagline: "Uma organização sem produto para vender, assessorando o cliente que compra o produto de todos os outros.",
    intro:
      "A MITRE opera centros de pesquisa e desenvolvimento financiados pelo governo federal, um formato comercial incomum: assessora o governo em compras técnicas sem disputar o trabalho que avalia. Num período em que o maior comprador individual de comunicações de computadores era o governo dos Estados Unidos, essa posição a tornou estruturalmente importante para o desenvolvimento da área.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A MITRE é uma corporação sem fins lucrativos que opera centros de pesquisa financiados pelo governo federal, uma forma institucional incomum que vale a pena entender: trabalha só para patrocinadores governamentais, não tem produtos comerciais e existe em parte para que o julgamento técnico sobre sistemas possa ser comprado sem ser comprado de um concorrente na licitação.",
      "Em redes, a contribuição dela é um sistema de que a maioria das pessoas nunca ouviu falar. A MITRENET era uma rede local de banda larga construída sobre a infraestrutura de TV a cabo, e semeou uma linha de pensamento que desaguou diretamente na indústria: a equipe da Ford Aerospace cujo trabalho remontava à MITRENET fundou depois a Sytek, que construiu a empresa inteira sobre banda larga e mais tarde forneceu a tecnologia por trás da PC LAN da IBM.",
      "A MITRE também trabalhou ao lado do National Bureau of Standards ao longo dos anos 1970 em redes locais, e o workshop que as duas organizações promoveram em janeiro de 1979 fica imediatamente antes do simpósio e da onda de fundações de empresas que se seguiu. Essa sequência é o fato que vale registrar: os empreendedores que fundaram a indústria de redes locais em meados de 1979 tinham passado os meses anteriores em salas convocadas por um órgão de padronização e por um centro federal de pesquisa.",
      "É o tipo menos visível de contribuição, e um dos de maior consequência. Nada do que a MITRE construiu virou produto, e as pessoas a quem tinha sido mostrado o que era possível saíram para construir os produtos.",
    ],
  },

  // netskope: record prose plus the complete translated profile.
  "netskope": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Netskope",
    tagline: "Começou com a constatação de que ninguém sabia quais aplicações de nuvem a própria equipe estava usando.",
    intro:
      "A Netskope foi fundada em 2012 por Sanjay Beri e outros, no momento em que o software como serviço tinha virado, sem alarde, o jeito de trabalhar, e as equipes de segurança não tinham visibilidade nenhuma sobre isso.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A constatação fundadora era específica e fácil de verificar: pergunte a uma organização quantas aplicações de nuvem ela usa, e a resposta é invariavelmente uma ordem de grandeza abaixo da verdade. Os funcionários adotam ferramentas sem passar por compras, os dados vão para serviços que ninguém aprovou, e um firewall de perímetro vê tráfego criptografado para um provedor de hospedagem e não consegue dizer nada de útil a respeito.",
      "Os cloud access security brokers resolveram a metade da visibilidade. A metade mais difícil era fazer algo a respeito sem bloquear o trabalho, o que exige entender a ATIVIDADE dentro de uma aplicação, e não a aplicação em si: a diferença entre fazer upload para um tenant corporativo e fazer upload do mesmo arquivo para um pessoal, que parecem quase idênticos na rede.",
      "Essa distinção é o motivo de o produto precisar entender a semântica das aplicações, e não apenas domínios, e é a razão de a categoria não poder ser atendida por um proxy que só enxergava hostnames.",
      "Desde então, o mercado incorporou o CASB ao security service edge, combinando-o com secure web gateway e acesso zero trust, e a Netskope construiu a própria rede global, a NewEdge, em vez de alugar capacidade: uma decisão de capital que só faz sentido se você acredita que a inspeção precisa acontecer perto do usuário.",
    ],
    // Complete profile copy: facts verbatim from profiles/netskope.ts, prose translated.
    profile: {
      slug: "netskope",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "Netskope",
          year: 2012,
          place: "Santa Clara, Califórnia",
          founders: ["Sanjay Beri", "Lebin Cheng", "Ravi Ithal", "Krishna Narayanaswamy"],
          story:
            "Sanjay Beri deixou uma vice-presidência na Juniper Networks em 2012 convencido de que o perímetro já tinha acabado: o trabalho estava indo para SaaS e para a nuvem mais depressa do que qualquer firewall conseguia acompanhar. Com três colegas veteranos de engenharia da Juniper (Lebin Cheng, Ravi Ithal e Krishna Narayanaswamy), fundou a Netskope para enxergar e governar esse tráfego diretamente, aplicação por aplicação, atividade por atividade. A empresa virou um nome definidor da novíssima categoria CASB e passou a década seguinte se expandindo a partir dela até cobrir todo o edge de segurança em nuvem.",
        },
      ],
      // Timeline: same years, same order, same personal markers.
      timeline: [
        { year: 2012, title: "Fundada por ex-funcionários da Juniper", detail: "A Netskope começa em Santa Clara com uma premissa contrária ao consenso: o tráfego interessante já não está na sua rede, então a segurança precisa ir para onde estão os usuários e o SaaS. Accel e Lightspeed financiam as primeiras rodadas." },
        { year: 2015, title: "Os anos do CASB", detail: "Quando 'cloud access security broker' entra no vocabulário dos analistas, a cobertura profunda da Netskope, via API e inline, de milhares de aplicações SaaS faz dela uma das implementações de referência da categoria: visibilidade e controle na granularidade de uma única ação dentro de uma aplicação." },
        { year: 2020, title: "Do CASB ao SASE", detail: "O trabalho remoto torna a tese dominante da noite para o dia. A Netskope se expande para secure web gateway e zero trust network access, sustentados pela NewEdge, a sua nuvem privada de segurança, construída para fazer a inspeção perto de cada usuário, em vez de levar o tráfego de volta por pontos de estrangulamento." },
        { year: 2021, title: "Avaliação privada de US$ 7,5 bilhões", detail: "Julho de 2021: uma rodada de US$ 300 milhões liderada pela ICONIQ avalia a empresa em US$ 7,5 bilhões, financiando a expansão da NewEdge e a investida no mercado convergente de edge.", sourceNote: "Comunicado da empresa; noticiário da imprensa." },
        { year: 2022, title: "Leader no primeiro Magic Quadrant de SSE", detail: "O Gartner separa o Security Service Edge do SASE e aponta a Netskope como Leader no Magic Quadrant inaugural, posição que ela manteve à medida que a categoria amadureceu. O Borderless SD-WAN (vindo da aquisição da Infiot) completa o retrato do SASE de fornecedor único." },
        { year: 2025, title: "IPO: NTSK", detail: "18 de setembro de 2025: a Netskope estreia na Nasdaq como NTSK depois de precificar a ação a US$ 19, o topo de uma faixa já elevada, levantando US$ 908 milhões numa das estreias de segurança mais marcantes do ano; as ações abrem a US$ 23, para um valor de mercado de cerca de US$ 8,6 bilhões. O ARR é de US$ 707 milhões, alta de 33%.", sourceNote: "CNBC, 17 e 18 de setembro de 2025." },
        { year: 2026, title: "Netskope One", detail: "A era da plataforma: serviços de segurança e de rede convergidos como Netskope One, abrangendo SSE, SD-WAN e gerenciamento da experiência digital sobre a NewEdge e, cada vez mais, controles para o uso corporativo de IA." },
        { year: 2025, personal: true, title: "Meu capítulo", detail: "A maratona de credenciamento: Administrator, Integrator e Architect conquistadas de 2024 a 2026, e Netskope Certified Cloud Security Instructor em 2025; SSE ensinado de dentro do fabricante que define a categoria." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "Netskope One", what: "A plataforma convergente: CASB, secure web gateway, ZTNA, firewall, DLP e SD-WAN entregues como um único serviço em nuvem, com um único modelo de políticas." },
        { name: "Next Gen Secure Web Gateway", what: "Inspeção inline do tráfego web e de nuvem, com o contexto de aplicação e de atividade pelo qual a Netskope é conhecida." },
        { name: "Netskope Private Access", what: "Zero trust network access: conectividade de usuário para aplicação que nunca coloca o usuário dentro da rede." },
        { name: "NewEdge", what: "A nuvem de segurança operada de forma privada por trás de tudo: pontos de inspeção espalhados por dezenas de regiões, com peering direto com os grandes provedores de SaaS e de nuvem, para que a segurança não custe latência." },
      ],
      // Innovations.
      innovations: [
        { title: "Visibilidade de nuvem no nível da atividade", detail: "Não apenas 'qual aplicação', mas 'qual ação, em qual instância da aplicação, por qual usuário': a granularidade que definiu o CASB e que ainda distingue a inspeção cloud-native dos firewalls de porta e protocolo." },
        { title: "Uma nuvem privada de segurança", detail: "NewEdge: construir a própria rede global de inspeção, com peering próprio, em vez de alugar regiões de nuvem pública; desempenho como recurso de segurança." },
        { title: "SASE de fornecedor único, pelo lado da segurança", detail: "Crescer do CASB para o SSE completo e depois acrescentar a WAN: o caminho inverso ao que os fabricantes de redes fizeram para chegar ao mesmo mercado." },
      ],
      // Markets, same entry count.
      markets: [
        "A Netskope compete no centro do mercado de SSE e SASE contra Zscaler, Palo Alto Networks, Cisco e Broadcom, atendendo mais de 4.300 clientes, entre eles mais de 30 empresas da Fortune 100: organizações que trocam web proxies, VPNs e pilhas de segurança de filiais por inspeção entregue pela nuvem.",
      ],
      // Analyst standing, same entry count.
      analyst: [
        "Leader no Magic Quadrant de Security Service Edge do Gartner desde a edição inaugural de 2022: o enquadramento dos analistas que transformou a tese fundadora da empresa num mercado com nome.",
      ],
    },
  },

  // nic-br: record prose.
  "nic-br": {
    // Card title (company kept verbatim), tagline and intro.
    name: "NIC.br - o registro que financia o encanamento",
    tagline: "Opera o .br, distribui os endereços do país e gasta a receita em infraestrutura que todo mundo usa.",
    intro:
      "O Nucleo de Informacao e Coordenacao do Ponto BR foi constituído como pessoa jurídica em 2003 e assumiu o registro do .br em dezembro de 2005, executando as decisões do CGI.br, o comitê multissetorial criado em 1995 que governa a internet no Brasil.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Vale guardar a origem: o trabalho começou dentro da equipe de redes da Fapesp, a fundação de amparo à pesquisa do estado de São Paulo, que é onde a internet brasileira começou. Um registro nacional nasceu de um grupo universitário de redes, e a continuidade das pessoas é parte do motivo de ele se comportar como se comporta.",
      "O modelo de financiamento é a parte incomum, e é o que a maioria dos países não fez. As taxas de registro de domínios .br não vão para um acionista; financiam o CERT.br para resposta a incidentes, o Cetic.br para medição, o Ceptro.br para engenharia de redes, o Ceweb.br para tecnologias web e o IX.br para troca de tráfego. Um registro é uma licença para cobrar um pequeno aluguel de cada domínio de um país, e este foi apontado de volta para a rede.",
      "O IX.br é a consequência mais clara. O CGI.br defendia desde 1998 que os pontos de troca de tráfego importavam, e o motivo dado era operacional, não político: antes deles, dados enviados entre dois pontos da mesma cidade, em redes diferentes, rotineiramente iam ao exterior e voltavam, o que custava dinheiro, acrescentava atraso e expunha o tráfego no caminho.",
      "O modelo de governança é o outro produto de exportação. O CGI.br reúne governo, setor empresarial, academia e sociedade civil num único órgão de composição definida, numa época em que a maioria dos países tinha ou um ministério ou um contratado. Se esse modelo é melhor, discute-se; que é incomum, não.",
    ],
  },

  // ntsec: record prose.
  "ntsec": {
    // Card title (company kept verbatim), tagline and intro.
    name: "NTSec Group - segurança comprada pelo setor público",
    tagline: "Integradora brasileira de segurança com sede em Brasília, filiais em oito estados e academia própria.",
    intro:
      "O NTSec Group é uma integradora brasileira de tecnologia e segurança da informação com sede em Brasília e filiais em oito estados, perto de quatrocentos especialistas, certificação ISO 27001 e um centro de operações de segurança 24 horas. As suas parcerias estratégicas incluem F5 e Check Point, e a lista de tecnologias inclui Fortinet, Netskope, Tenable, CyberArk, Qualys e Wiz, entre outras.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A sede é o fato que explica o resto. Uma integradora de segurança sediada em Brasília, e não em São Paulo, é uma integradora construída em torno do governo federal e dos tribunais, e a lista de clientes publicada confirma isso: tribunais regionais eleitorais e do trabalho, instituições de saúde e de pesquisa, bancos federais, empresas estaduais de processamento de dados e forças de segurança pública.",
      "É um negócio diferente de atender a iniciativa privada, e a diferença está nas compras. O trabalho chega por licitação pública, então a relação começa como uma proposta, e não como uma conversa, e a continuidade depende de vencer de novo: um dos depoimentos publicados pela própria empresa descreve uma licitação de firewall em 2017 que cresceu até virar atendimento à maior parte da Justiça do Trabalho do país, e depois uma segunda licitação, anos mais tarde, que acrescentou serviços gerenciados.",
      "Os quatro nomes não são uma estrutura de marcas. O grupo afirma que surgiu da união de quatro empresas (Ziva, NTSec, InfoSec e CloudSec), de modo que NTSec, InfoSec, CloudSec e ZivaSec são as partes constituintes, preservadas como os nomes daquilo em que se transformaram. É o terceiro grupo brasileiro montado nesta linha do tempo, depois do Grupo IHC e da CPM Braxis, e o padrão é consistente: as marcas que parecem linhas de produto muitas vezes são as empresas que foram compradas.",
      "Uma academia ao lado delas descreve a estratégia que vários outros verbetes aqui registram: uma integradora que parou de vender produtos e começou a vender capacidade, com o ensino como parte da oferta, e não como um detalhe secundário.",
      "O ato constitutivo é de registro público: o contrato social foi arquivado na Junta Comercial do Distrito Federal por despacho de 18 de outubro de 2007. Que o documento possa ser lido é um acaso das compras públicas: ele sobrevive dentro de um dossiê de licitação entregue a uma empresa estadual de tecnologia, que é onde boa parte da história empresarial brasileira fica discretamente preservada.",
    ],
  },

  // orange: record prose.
  "orange": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Orange - um antigo monopólio estatal com um braço corporativo global",
    tagline: "O outro lado da história europeia: a operadora que as campeãs nacionais foram criadas para abastecer.",
    intro:
      "A Orange é uma operadora multinacional francesa de telecomunicações, descendente do monopólio estatal, e está nesta linha do tempo como contraparte de verbetes como o da Italtel: onde a campeã nacional fabricava, a operadora nacional comprava, e a relação entre as duas moldou ambas.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A Orange Business descende de uma cooperativa de companhias aéreas. Em 1949, um consórcio de empresas aéreas europeias (Air France, KLM, Sabena, Swissair, as duas companhias estatais britânicas e as operadoras escandinavas) reuniu as suas redes de comunicação na Societe Internationale de Telecommunications Aeronautiques, uma entidade sem fins lucrativos criada para administrar uma rede de que todas precisavam e que nenhuma queria construir sozinha. A Equant nasceu desse grupo, levando serviços de rede ao transporte aéreo.",
      "O motivo de ela chegar a todo lugar está contido nessa origem. A rede de uma companhia aérea precisa funcionar em todo aeroporto para onde a companhia voa, inclusive naqueles sem mercado comercial para serviços de dados, de modo que o alcance foi construído por necessidade operacional, e não vendido com lucro. A empresa que o herdou opera em mais de 220 países e territórios, um número de cobertura que quase ninguém mais consegue apresentar.",
      "A France Telecom montou a empresa moderna em etapas. Comprou as participações da Sprint e da Deutsche Telekom na joint venture Global One em janeiro de 2000, por US$ 3,88 bilhões, assumiu o controle da Equant em novembro daquele ano, pagando à SITA 3,5 bilhões pela sua parte e investindo mais 1,2 bilhão, fundiu as duas em 2001 sob o nome Equant e adquiriu as ações restantes em 2005. Em 1º de junho de 2006, rebatizou o resultado como Orange Business Services.",
      "O momento dessa integração é a parte que vale guardar. Ela terminou por volta do fim de 2001, bem no colapso da indústria global de telecomunicações, e a empresa atravessou o período enquanto concorrentes muito endividados pediam proteção contra falência, porque a política herdada tinha mantido quase nenhuma dívida de longo prazo no balanço.",
      "É um fato sobre estrutura de capital, não sobre tecnologia, e decidiu mais do que qualquer produto. Numa crise, a operadora de rede que sobrevive não costuma ser a de melhor engenharia; é a que ainda consegue pagar o que tomou emprestado. Quem escolhe um fornecedor para um ambiente de quinze anos está fazendo um julgamento financeiro tanto quanto técnico, quer o enquadre assim, quer não.",
    ],
  },

  // paradyne: record prose.
  "paradyne": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Paradyne - as últimas milhas da era analógica",
    tagline: "Arrancando taxas de dados utilizáveis do cobre que já estava enterrado.",
    intro:
      "A Paradyne fabricava modems e equipamentos de transmissão de dados no período em que a linha de acesso era a restrição de tudo. O problema dela era o que a indústria inteira compartilhava e em que poucas empresas se especializavam: o fio entre um prédio e a rede já estava instalado, não podia ser trocado de forma econômica e nunca tinha sido projetado para dados.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A Paradyne foi formada em 1969 em Largo, na Flórida, para fornecer sistemas de comunicação de computadores, e passou os anos 1970 e 1980 no mercado de modems de ponta, contra a Motorola Codex, a Racal-Milgo e as divisões de equipamentos da AT&T e da IBM. Esse mercado só existia por causa da regulação, não da tecnologia: a decisão Carterfone e os inquéritos que vieram depois abriram à força o direito de conectar equipamentos à rede telefônica, e uma indústria surgiu no espaço que a decisão criou.",
      "O topo de linha importava mais do que a expressão sugere. Os dados corporativos trafegavam por linhas analógicas dedicadas, e espremer mais bits por um circuito fixo valia o preço, de modo que os modems eram produtos de engenharia com margens reais, não commodities. Tudo o que tornava esse negócio bom (contratos longos, poucos fornecedores, clientes que não conseguiam trocar com facilidade) se dissolveu quando os circuitos ficaram digitais.",
      "Virou AT&T Paradyne em 1989, voltou à independência como Paradyne Networks em 1996 e foi adquirida pela Zhone Technologies em 2005. A trajetória é o destino comum de um fabricante de equipamentos de cliente: o valor que antes ficava na caixa migrou para a própria rede, e uma empresa que fazia terminais caros para circuitos caros ficou sem nada que justificasse ser cara.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A Zhone Technologies concluiu a aquisição da Paradyne Networks em 1º de setembro de 2005.",
  },

  // prodam: record prose.
  "prodam": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Prodam - a cidade de São Paulo, computada",
    tagline: "Empresa municipal de TIC criada em 1971, a serviço de uma cidade com mais de doze milhões de habitantes.",
    intro:
      "A Prodam-SP foi criada por lei municipal em 23 de junho de 1971 e é a empresa de tecnologia da cidade de São Paulo, um município com mais de doze milhões de habitantes, maior do que a maioria dos países cujas organizações nacionais de TI aparecem nesta linha do tempo.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A Prodam é a empresa municipal de tecnologia de São Paulo, criada pela Lei 7619, de 23 de junho de 1971, e opera a infraestrutura de computação e o processamento de dados da prefeitura, o que neste caso significa um município com mais habitantes do que a maioria dos países das Américas.",
      "A camada municipal é a menos examinada das três e a mais próxima do cidadão. Os sistemas federais cuidam de impostos e benefícios, e os estaduais de documentos e policiamento, mas é numa empresa municipal que a coleta de lixo, as unidades de saúde, as escolas, os cartões de transporte e os alvarás de construção são realmente operados. Quando um sistema ali falha, ninguém lê a respeito no noticiário nacional, e alguns milhares de pessoas não conseguem fazer algo de que precisavam naquela manhã.",
      "A computação pública brasileira foi construída em três níveis, federal, estadual e municipal, cada um com a própria empresa, as próprias compras e o próprio parque, e o atrito entre eles é uma característica permanente, não uma fase de transição. Quem integra serviços públicos no Brasil está integrando três organizações que nunca foram pensadas para ser uma só.",
    ],
  },

  // q13: record prose.
  "q13": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Q13 - metade da receita é dinheiro público",
    tagline: "Integradora brasileira fundada em 2018, atuando em nuvem, segurança, redes e colaboração.",
    intro:
      "A Q13, antes Quantum13 Solucoes em Tecnologia, é uma integradora de São Paulo fundada em abril de 2018, que cobre nuvem, segurança de dados, redes, colaboração e serviços profissionais, incluindo centros de operações de rede e de segurança.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O detalhe que justifica o verbete é a divisão da receita: cerca de metade vem do governo e metade de empresas. Os clientes públicos citados se concentram em torno do Rio de Janeiro (uma assembleia legislativa estadual, a empresa estadual de processamento de dados, uma câmara municipal, um banco nacional de desenvolvimento, uma geradora de energia elétrica), e esse mix descreve uma trajetória de carreira real nesta indústria que quase nada escrito em inglês reconhece.",
      "O trabalho no setor público é uma disciplina própria, não o mesmo trabalho com outra papelada. Ele corre sobre licitações publicadas, atas de registro de preços e escopos definidos, de modo que o argumento vencedor é a especificação técnica e a conformidade demonstrável, não o relacionamento. Engenheiros que passam a carreira nele ficam excepcionalmente precisos sobre o que um requisito realmente diz.",
      "É também uma empresa recente, fundada em 2018, numa linha do tempo de empresas que remontam aos anos 1960 e 1970. O modelo de integradora que o Grupo IHC e os seus contemporâneos inventaram continua sendo começado do zero, e esse é o fato mais interessante a respeito dela.",
    ],
  },

  // rand: record prose plus the complete translated profile.
  "rand": {
    // Card title (company kept verbatim), tagline and intro.
    name: "RAND Corporation - onde a comutação de pacotes foi imaginada",
    tagline: "O 'On Distributed Communications' de Paul Baran, de 1964, defendia que uma rede sem centro sobreviveria a qualquer coisa; a AT&T se recusou a construí-la, e a internet a construiu.",
    intro:
      "Um think tank de Santa Monica, não um fabricante, incluído por um mérito que nenhum fabricante iguala. A RAND construiu as ciências da decisão do pós-guerra (a oficina da teoria dos jogos, a programação linear, o método Delphi), rodou as primeiras experiências de IA no seu próprio JOHNNIAC e empregou o engenheiro cujos onze relatórios de 1964 especificaram redes distribuídas, de blocos de mensagem e store-and-forward: a raiz conceitual de cada roteador destas páginas.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O perfil cobre as origens do Project RAND em 1946, os anos do ferramental matemático, o argumento de Baran sobre capacidade de sobrevivência e a sua invenção paralela por Donald Davies, e o caminho da ideia até a ARPANET.",
    ],
    // Complete profile copy: facts verbatim from profiles/rand.ts, prose translated.
    profile: {
      slug: "rand",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "RAND Corporation",
          year: 1948,
          place: "Santa Monica, Califórnia",
          founders: ["Spun from Project RAND (Douglas Aircraft / US Air Force, 1946)"],
          story:
            "O Project RAND começou em 1946 dentro da Douglas Aircraft para manter viva a pesquisa operacional do tempo de guerra; o seu primeiro relatório estudou a viabilidade de um satélite artificial, onze anos antes do Sputnik. Constituída como entidade independente sem fins lucrativos em maio de 1948, a RAND virou o arquétipo do think tank: matemáticos, economistas e engenheiros pagos para pensar décadas à frente. Um deles, um engenheiro chamado Paul Baran, passou o começo dos anos 1960 perguntando como uma rede de comunicações poderia sobreviver à perda da maior parte de si mesma, e respondeu com a ideia de que a internet é feita.",
        },
      ],
      // Timeline: same years, same order, same personal markers.
      timeline: [
        { year: 1950, title: "A oficina da teoria dos jogos", detail: "Flood e Dresher formalizam o exercício que Tucker logo batiza de dilema do prisioneiro; Nash presta consultoria nos verões; a programação linear de Dantzig amadurece ali: a RAND constrói o ferramental matemático sobre o qual roda a tomada de decisão do pós-guerra." },
        { year: 1953, title: "JOHNNIAC", detail: "A RAND constrói o próprio computador de arquitetura von Neumann e lhe dá o nome dele: uma das máquinas em que a análise de sistemas, as primeiras experiências de IA (o trabalho de Newell, Shaw e Simon) e o sistema de tempo compartilhado JOSS são forjados." },
        { year: 1964, title: "On Distributed Communications", detail: "Agosto de 1964: a série de onze volumes de Baran expõe tudo. Quebrar as mensagens em blocos, rotear cada um de forma independente por uma malha redundante, deixar os nós encaminharem no estilo 'hot potato', e a rede sobrevive a danos que matam qualquer projeto centralizado. A AT&T analisou a ideia e se recusou a construí-la.", sourceNote: "Memorandos da RAND RM-3420-PR e correlatos, disponíveis publicamente na RAND." },
        { year: 1965, title: "Dois inventores, uma ideia", detail: "Donald Davies, no National Physical Laboratory do Reino Unido, chega ao mesmo projeto de forma independente e lhe dá o nome que pegou: packet switching, a comutação de pacotes. Os planejadores da ARPANET bebem das duas linhagens: a rara invenção com dois pais legítimos." },
        { year: 1969, title: "Para dentro da ARPANET", detail: "Os primeiros nós da ARPANET se acendem levando a filosofia de projeto que os relatórios de Baran defendiam: nenhum centro para matar, inteligência nas bordas, pacotes encontrando o próprio caminho; o argumento que as ferramentas de roteamento deste site ainda pressupõem." },
        { year: 2020, title: "Ainda pensando à frente", detail: "A RAND continua como instituição de pesquisa de políticas públicas (defesa, saúde, educação), com o seu capítulo de redes encerrado, mas canônico: a raiz conceitual de tudo o que estas páginas medem." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "On Distributed Communications (1964)", what: "A série de relatórios que especificou redes com capacidade de sobrevivência, de blocos de mensagem e store-and-forward: a certidão de nascimento norte-americana da comutação de pacotes." },
        { name: "JOHNNIAC e JOSS", what: "O computador próprio da RAND e o seu pioneiro sistema de tempo compartilhado: a bancada da primeira análise de sistemas e da IA." },
        { name: "O método Delphi e a análise de sistemas", what: "Maquinário de tomada de decisão exportado para governos e indústrias do mundo todo: os outros produtos duradouros da RAND são métodos." },
      ],
      // Innovations.
      innovations: [
        { title: "A comutação de pacotes, defendida pela capacidade de sobrevivência", detail: "Baran não otimizou pela eficiência; otimizou pela sobrevivência a um ataque, e a arquitetura resultante (distribuída, redundante, com inteligência nas bordas) mostrou-se superior para todo o resto também." },
        { title: "O próprio think tank", detail: "A RAND inventou a forma institucional: interdisciplinar, de horizonte longo, com publicação aberta; o motivo pelo qual uma entidade sem fins lucrativos financiada pela indústria aeroespacial pôde semear a ideia central da internet." },
      ],
      // Markets, same entry count.
      markets: [
        "A RAND nunca vendeu produtos de rede; o seu mercado são ideias, e esta chegou a todo lugar: cada roteador, cada datagrama, cada malha destas páginas implementa um memorando de 1964.",
      ],
      // Analyst standing, same entry count.
      analyst: [
        "Incluída entre os pioneiros por um mérito que nenhum fabricante iguala: o ancestral mais profundo. Quando as ferramentas deste site raciocinam sobre caminhos, rotas e resiliência, estão falando a língua de Baran.",
      ],
    },
  },

  // salesforce: record prose.
  "salesforce": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Salesforce - a empresa que declarou o fim do software",
    tagline: "Fundada num apartamento alugado em 1999, com uma palavra riscada num broche; a objeção dos clientes era a palavra controle, era a objeção certa, e eles compraram assim mesmo.",
    intro:
      "A Salesforce é uma empresa norte-americana de software em nuvem fundada em San Francisco em 1999 por Marc Benioff e três programadores, cujo CRM entregue por assinatura estabeleceu o modelo de software como serviço.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Em março de 1999, um ex-executivo da Oracle e três programadores começaram a trabalhar, num apartamento alugado de um quarto em Telegraph Hill, num software de vendas que não seria instalado, não seria atualizado pelo cliente e seria pago por mês. Benioff chamou a missão de fim do software e usava a palavra riscada num broche. O dinheiro veio dele mesmo e do antigo chefe, Larry Ellison, não de venture capital, e quando investidores chegaram a olhar, insistiram que ele também vendesse uma versão empacotada, porque ninguém acreditava que a hospedada seria aceita.",
      "A objeção merece ser registrada com exatidão, porque era a certa. As pessoas diziam que as empresas nunca deixariam outro guardar os dados dos seus clientes e, como lembrou um dos primeiros executivos, a palavra controle aparecia muito. É a objeção que se repete por toda esta história (quem guarda o registro, quem pode alcançá-lo, quem pode ser obrigado a entregá-lo), levantada no momento em que a indústria decidiu entregar o registro mesmo assim. Os clientes estavam certos sobre o que estavam abrindo mão e compraram assim mesmo, porque não ter de operar o software valia mais para eles do que controlá-lo.",
      "A empresa abriu capital em 2004, lançou em 2005 um marketplace de aplicações de terceiros que fez da plataforma algo sobre o qual outros construíam, e cunhou e depois desgastou a expressão cloud computing. Hoje faz parte do Dow, com receita acima de quarenta bilhões de dólares, e é dona, entre outras coisas, do workspace Slack e da camada de integração MuleSoft, por onde passa hoje uma grande quantidade de dados corporativos. Um pequeno fato mostra o quanto ela se afastou do apartamento: opera o próprio sistema autônomo na internet, como uma operadora.",
      "O fim do software não chegou; o software mudou de lugar. O que acabou foi a posse do software pelo cliente, e cada assinatura, cada mudança de termos de serviço e cada bloqueio de conta desde então é consequência da troca feita em 1999. O verbete da Starlink registra um campo de batalha governado pelos termos de serviço de um fornecedor. O caminho de lá até um broche com uma palavra riscada é mais curto do que parece.",
    ],
  },

  // siemens: record prose plus the complete translated profile.
  "siemens": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Siemens - a startup de telégrafos de 1847",
    tagline: "Werner von Siemens construiu a linha telegráfica indo-europeia; a linhagem de comunicações do conglomerado passa pelo EWSD, pela joint venture com a Nokia e pela Unify.",
    intro:
      "A Siemens é, por décadas de diferença, a empresa mais antiga desta seção: uma oficina berlinense de 1847 cujo telégrafo de ponteiro cresceu até virar um império elétrico global. A sua linhagem de comunicações (centrais telefônicas, a central EWSD, a Nokia Siemens Networks e a linha de comunicações corporativas Unify) atravessa metade da história da indústria, enquanto a Siemens de hoje lidera a automação industrial e as redes dela.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A empresa mais antiga desta seção começou em 12 de outubro de 1847, com dez pessoas num pátio dos fundos em Berlim, construindo um telégrafo que apontava uma agulha para letras em vez de transmitir Morse.",
      "Em abril de 1870, a linha indo-europeia foi inaugurada, e uma mensagem de Londres a Calcutta deixou de levar trinta dias e passou a levar vinte e oito minutos. Todos os outros números de latência deste catálogo são refinamentos daquela tarde: o problema nunca foi a velocidade por si mesma, mas o fato de que uma decisão não podia ser tomada até uma resposta voltar, e durante toda a história anterior a isso a resposta voltava de navio.",
      "A empresa quase não sobreviveu para construí-la. No começo dos anos 1850, o governo prussiano se recusou a conceder contratos de continuidade e, no relato da própria Siemens, isso mergulhou a jovem empresa numa crise existencial. A resposta foi sair de casa: para a Rússia, onde construiu uma rede estatal de nove mil quilômetros, e para a Inglaterra. Perder o cliente doméstico foi o que fez dela uma empresa internacional, um padrão que vale lembrar sempre que a maior conta de um fornecedor parecer segurança.",
      "Dois fatos dos anos 1870 destoam da engenharia e merecem ser registrados como são. Em outubro de 1872, a empresa criou um fundo de pensão e um fundo para viúvas e órfãos, numa época em que quase ninguém fazia isso. Em 1873, passou Berlim para uma jornada de nove horas, quando dez era o padrão, e para oito horas e meia em 1891. Halske, que tinha saído em 1867 por discordar de como a empresa devia ser dirigida, continuou financiando essa pensão do próprio bolso.",
      "A linhagem de comunicações é longa e termina em pedaços. Uma divisão formada em 1998 se dividiu em 2006, metade para a joint venture com a Nokia e a outra metade para um negócio corporativo que passou a donos externos. A empresa do telégrafo saiu das telecomunicações quase exatamente quando as telecomunicações viraram a internet.",
      "Aquilo para onde ela foi é o motivo de esta ser uma história de redes. A automação industrial (controladores, acionamentos, sistemas de planta) é hoje o centro do negócio, e esse parque é exatamente a população que o artigo sobre controle de acesso descreve como o caso difícil: equipamentos que não conseguem rodar um agente, frequentemente não conseguem se autenticar e não podem ser desligados para serem corrigidos. A empresa que resolveu a distância em 1870 é hoje dona de boa parte do problema que a solução da distância criou.",
      "O parque industrial é também onde esta empresa encontrou a primeira arma ciberfísica, e o lado do fabricante nessa história é a parte que costuma ficar de fora. O Stuxnet, descoberto em 2010, foi escrito contra os controladores Siemens S7-300 e S7-400 programados pelo Step7, e chegou a eles num pendrive levado porta adentro de uma instalação sem conexão com a internet. Quatro vulnerabilidades do Windows o levaram pela rede de engenharia. Depois, ele forçou centrífugas de enriquecimento a passar por velocidades de ressonância enquanto mostrava números normais aos operadores que acompanhavam. O Institute for Science and International Security estimou que cerca de mil centrífugas podem ter sido danificadas.",
      "A Siemens foi visada pelo motivo comum de que os seus controladores eram o que a planta usava. Ser o padrão em controle industrial é o que transformou a base instalada num mecanismo de entrega, e nenhuma decisão de engenharia do fabricante teria mudado isso.",
      "Dois detalhes do caso deveriam sobreviver ao incidente. O malware levava um rootkit para o controlador: quando uma ferramenta de monitoramento perguntava que programa estava carregado, recebia um código limpo, enquanto o verdadeiro rodava por baixo. O instrumento que teria revelado o problema era o instrumento que tinha sido subvertido, a mesma falha que o artigo sobre teste e medição descreve, chegando a uma planta industrial.",
      "E o remédio mostra por que esse parque é genuinamente difícil, e não apenas negligenciado. A Siemens acrescentou autenticação e criptografia ao protocolo em 2014, nas linhas S7-1500 e S7-1200. Essa atualização não serve para os controladores S7-300 mais antigos, que são os que continuam instalados e expostos. A correção existe e não consegue chegar ao equipamento que precisa dela, porque esse equipamento não pode ser trocado de forma barata nem desligado para ser corrigido. Uma planta não para por uma janela de patch, e um controlador que roda desde antes de o ataque ser escrito está fazendo exatamente aquilo para que foi comprado.",
    ],
    // Complete profile copy: facts verbatim from profiles/siemens.ts, prose translated.
    profile: {
      slug: "siemens",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "Siemens (Telegraphen-Bauanstalt von Siemens & Halske)",
          year: 1847,
          place: "Berlim, Alemanha",
          founders: ["Werner von Siemens", "Johann Georg Halske"],
          story:
            "A empresa mais antiga desta seção começou como uma startup de telégrafos: o telégrafo de ponteiro de Werner von Siemens, construído com o artesão Johann Georg Halske numa oficina de fundo de quintal em Berlim, em 1847. Em uma geração, ela tinha estendido a linha telegráfica indo-europeia de Londres a Calcutta e descoberto o princípio dinamoelétrico que fez da engenharia elétrica uma indústria. A Siemens passou o século XX como a empresa elétrica de tudo da Europa, e as suas linhagens de comunicações atravessam metade das outras páginas daqui antes de a empresa escolher a sua identidade moderna: a automação da própria indústria.",
        },
      ],
      // Timeline: same years, same order, same personal markers.
      timeline: [
        { year: 1847, title: "O telégrafo de ponteiro", detail: "Siemens e Halske fundam a sua Telegraphen-Bauanstalt em Berlim; a linha indo-europeia de 1870, de Londres a Calcutta, com mensagens em minutos em vez de semanas, faz da jovem empresa uma construtora global de infraestrutura." },
        { year: 1866, title: "O dínamo", detail: "Werner von Siemens formula o princípio dinamoelétrico, a geração prática de eletricidade, e a empresa de telégrafos vira a semente de um império elétrico: energia, ferrovias, iluminação, medicina." },
        { year: 1980, title: "O EWSD cabeia o mundo", detail: "A central pública digital de Munique vira um dos sistemas de comutação mais implantados da história: a Siemens como fabricante de telecomunicações de primeira linha durante a era da telefonia fixa." },
        { year: 2005, title: "Começa a retirada das comunicações", detail: "O negócio de celulares vai para a BenQ; em 2007, o negócio de redes de operadoras é fundido na joint venture Nokia Siemens Networks, da qual a Siemens sai por completo em 2013: o século das telecomunicações encerrado de propósito." },
        { year: 2016, title: "A Unify vai embora", detail: "A linhagem de comunicações corporativas, a Siemens Enterprise Communications rebatizada de Unify, é vendida à Atos e passa à Mitel em 2023: a última linhagem de comunicações deixa a casa." },
        { year: 2020, title: "A gigante focada", detail: "Com a separação da Siemens Energy (a Healthineers já de capital aberto), a empresa completa a sua transformação: automação industrial, infraestrutura inteligente e ferrovias, incluindo o mundo das redes industriais SCALANCE e PROFINET, onde o chão de fábrica encontra o assunto deste site." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "Digital Industries", what: "Automação fabril e software industrial: CLPs SIMATIC, TIA Portal e a plataforma Xcelerator." },
        { name: "SCALANCE e redes industriais", what: "Switches, wireless e segurança para o mundo OT: o território do PROFINET, onde a rede encontra o chão de fábrica." },
        { name: "Smart Infrastructure and Mobility", what: "Tecnologia de rede elétrica, edifícios e ferrovias: a herança do império elétrico, modernizada." },
      ],
      // Innovations.
      innovations: [
        { title: "A engenharia elétrica como indústria", detail: "O princípio dinamoelétrico e os empreendimentos de infraestrutura construídos sobre ele: a Siemens não entrou na era elétrica; é um dos motivos de a era ter acontecido." },
        { title: "A saída disciplinada", detail: "Poucas gigantes deixaram uma indústria carro-chefe de forma tão deliberada quanto a Siemens deixou as telecomunicações: um desmonte de uma década que financiou a identidade de automação que ela veste hoje." },
      ],
      // Markets, same entry count.
      markets: [
        "A Siemens lidera hoje a automação industrial e a infraestrutura no mundo todo, e as suas linhas de redes OT fazem dela vizinha do mundo deste site onde quer que uma rede fabril encontre uma rede corporativa.",
      ],
      // Analyst standing, same entry count.
      analyst: [
        "Presença centenária nas avaliações do setor elétrico e de automação; na história das telecomunicações, a coautora discreta da era da telefonia fixa, cujas saídas moldaram a ascensão da Nokia.",
      ],
    },
  },

  // symantec: record prose plus the complete translated profile.
  "symantec": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Symantec",
    tagline: "A marca de segurança de uma geração, hoje a linha corporativa da Broadcom.",
    intro:
      "A Symantec foi por décadas o maior nome em software de segurança, do Norton no desktop às suítes corporativas de endpoint, web e proteção de dados que levaram o seu selo amarelo a todo grande ambiente de TI.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Os cursos corporativos da Symantec continuam nos catálogos da Red Education para Australásia, SAARC e ASEAN, atendendo a considerável base instalada das suas plataformas de endpoint e de segurança web.",
      // Corrected 2026-10-26 (endings apply), mirroring the English: the corporation survived the sale under another name.
      "Fundada em 1982, a Symantec cresceu por aquisição até virar um conglomerado de segurança, antes de se dividir: o negócio de segurança corporativa foi vendido à Broadcom, numa venda concluída em 4 de novembro de 2019, e a Broadcom mantém a marca Symantec para ele. No mesmo dia, a própria empresa mudou de nome para NortonLifeLock, ficando com o lado de consumo, e depois da fusão com a Avast virou Gen Digital. É mais uma linhagem que as páginas de indústria deste site acompanham: o nome sobrevive na Broadcom, e a empresa que o carregava sobrevive com outro nome.",
    ],
    // Complete profile copy: facts verbatim from profiles/symantec.ts, prose translated.
    profile: {
      slug: "symantec",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "Symantec",
          year: 1982,
          place: "Sunnyvale, Califórnia",
          founders: ["Gary Hendrix"],
          story:
            "A Symantec é mais antiga do que a indústria de segurança para PC que ela passou a simbolizar. Gary Hendrix a fundou em 1982, com uma bolsa da National Science Foundation, para fazer processamento de linguagem natural (o nome funde syntax, semantics e technology), e o seu primeiro sucesso, o Q&A, era um banco de dados com uma interface em inglês. A identidade de segurança chegou por aquisição: a compra da Peter Norton Computing em 1990 deu à Symantec o nome mais confiável em utilitários para PC, e o Norton AntiVirus virou a caixa amarela pela qual uma geração conheceu a segurança de computadores. Tudo o que veio depois (Veritas, Blue Coat, Broadcom) é a história dessa franquia ganhando escala corporativa e depois se dividindo.",
        },
      ],
      // Timeline: same years, same order, same personal markers.
      timeline: [
        { year: 1982, title: "Fundada para a linguagem natural", detail: "Hendrix cria a Symantec a partir da pesquisa em IA; as consultas em inglês ao banco de dados do Q&A são o primeiro sucesso da empresa, e a segurança ainda não aparece em parte alguma do plano." },
        { year: 1990, title: "Norton", detail: "A Symantec adquire a Peter Norton Computing; o Norton Utilities e o Norton AntiVirus tornam a marca sinônimo de manter PCs funcionando, e a franquia de segurança de consumo financia três décadas de ambição corporativa." },
        { year: 2005, title: "A fusão com a Veritas", detail: "A fusão de cerca de US$ 13,5 bilhões com a Veritas casa segurança com gerenciamento de storage, um dos maiores negócios da história do software e um dos mais questionados depois; a combinação nunca dá liga, e a Veritas é vendida à Carlyle em 2016." },
        { year: 2016, title: "Blue Coat", detail: "A Symantec paga cerca de US$ 4,65 bilhões pela Blue Coat, levando a sua pilha de web gateway e segurança em nuvem e o seu CEO, Greg Clark: o portfólio corporativo que mais tarde ancora o negócio com a Broadcom." },
        { year: 2019, title: "A Broadcom compra o nome", detail: "A Broadcom adquire o negócio de segurança corporativa da Symantec por cerca de US$ 10,7 bilhões, com conclusão em novembro de 2019; a própria marca Symantec vai para a Broadcom, vendida às maiores contas pelo seu grupo de software. A metade de consumo continua como NortonLifeLock." },
        { year: 2022, title: "Gen Digital", detail: "A NortonLifeLock conclui a fusão com a Avast e muda o nome para Gen Digital: a linhagem Norton e a sua antiga rival europeia sob o mesmo teto, enquanto a Symantec da Broadcom carrega a bandeira corporativa." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "Symantec Endpoint Security", what: "A linhagem de proteção de endpoint corporativa, descendente das edições corporativas da franquia AntiVirus, hoje sob a Broadcom." },
        { name: "Symantec Web Protection", what: "A herança da Blue Coat: secure web gateway (linhagem ProxySG) e segurança web entregue pela nuvem." },
        { name: "Symantec DLP", what: "A suíte de prevenção contra perda de dados (descendente da aquisição da Vontu), por muito tempo um produto de referência da categoria DLP." },
      ],
      // Innovations.
      innovations: [
        { title: "Segurança de consumo como mercado de massa", detail: "O Norton AntiVirus fez da segurança um produto de varejo comprado por pessoas comuns: o motor de receita que construiu uma das maiores empresas de software." },
        { title: "A lição do conglomerado", detail: "O arco de fundir e desfazer da Symantec (a Veritas entra, a Veritas sai; o corporativo para a Broadcom, o consumo para a Gen) virou o estudo de caso da indústria sobre como portfólios de segurança se combinam e se dividem." },
      ],
      // Markets, same entry count.
      markets: [
        "Sob a Broadcom desde 2019, a Symantec vende proteção de endpoint, web e dados às maiores empresas globais, um negócio focado e movido pela base instalada, enquanto a linhagem de consumo Norton segue separadamente dentro da Gen Digital.",
      ],
      // Analyst standing, same entry count.
      analyst: [
        "Por duas décadas, a Leader padrão das avaliações de proteção de endpoint, com as linhas de DLP e de secure web gateway igualmente canônicas nas suas categorias: uma posição que a era Broadcom herda.",
      ],
    },
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A Symantec Corporation concluiu a venda do seu negócio de segurança corporativa para a Broadcom em 4 de novembro de 2019 e, no mesmo dia, mudou sua razão social para NortonLifeLock Inc.; desde então nenhuma empresa opera com o nome Symantec.",
  },

  // tenable: record prose plus the complete translated profile.
  "tenable": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Tenable",
    tagline: "Construída sobre um scanner que um garoto de dezessete anos escreveu, e que depois teve o código fechado para financiar a empresa.",
    intro:
      "Em abril de 1998, aos dezessete anos, Renaud Deraison lançou a primeira versão do Nessus. Em setembro de 2002, levou-o para uma empresa fundada com Ron Gula e Jack Huffard, em Columbia, Maryland. A maioria das fontes data a constituição de 16 de setembro de 2002; uma dá 4 de outubro, e as duas ficam registradas aqui, em vez de se escolher uma.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Ron Gula tinha trabalhado na National Security Agency nos anos 1990 e escrito o sistema de detecção de intrusão Dragon, e a empresa que ele fundou antes desta foi vendida à Enterasys Networks, que aparece em outro ponto desta linha do tempo como o resquício corporativo da Cabletron. Marcus Ranum, uma das pessoas que construíram os primeiros firewalls comerciais, entrou como chief security officer em 2004.",
      "A decisão que define a empresa veio em outubro de 2005. Com o lançamento do Nessus 3, o scanner virou proprietário, e os dois motivos declarados eram honestos: gerar receita e parar de dar aos concorrentes um produto grátis para revender. A comunidade fez um fork da última versão aberta, e esse fork virou o OpenVAS, que existe até hoje.",
      "Isso merece reflexão, e não um julgamento rápido. Uma ferramenta gratuita escrita por um adolescente virou o scanner de vulnerabilidades padrão da indústria, e a única forma de financiar a engenharia de que ela passou a precisar era deixar de ser gratuita. O fechamento e o fork foram, ambos, respostas razoáveis ao mesmo fato.",
      "A Tenable funcionou com recursos próprios por uma década. O seu primeiro dinheiro institucional foi uma Série A de US$ 50 milhões da Accel em setembro de 2012, dez anos depois da fundação, o que não é o roteiro habitual das histórias de financiamento. Abriu capital em 2018 e, em 2023, informava cerca de US$ 799 milhões de receita e aproximadamente 44.000 clientes, incluindo a maioria da Fortune 500.",
      "O argumento do produto passou, desde então, da varredura à priorização, porque a constatação que mudou a categoria foi que ninguém consegue aplicar todos os patches. A pontuação de risco e o catálogo da CISA de vulnerabilidades sabidamente exploradas trocaram a completude pela triagem, e todos os fabricantes deste segmento fizeram o mesmo movimento mais ou menos ao mesmo tempo.",
    ],
    // Complete profile copy: facts verbatim from profiles/tenable.ts, prose translated.
    profile: {
      slug: "tenable",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "Nessus",
          year: 1998,
          place: "França",
          founders: ["Renaud Deraison"],
          story:
            "Lançado em abril por um garoto de dezessete anos, como software livre, porque os scanners comerciais da época eram caros e o autor queria um. Virou o scanner de vulnerabilidades padrão da internet antes de haver uma empresa ligada a ele.",
        },
        {
          company: "Tenable Network Security",
          year: 2002,
          place: "Columbia, Maryland",
          founders: ["Renaud Deraison", "Ron Gula", "Jack Huffard"],
          story:
            "Fundada em 16 de setembro. Gula tinha trabalhado na National Security Agency e escrito o sistema de detecção de intrusão Dragon; a combinação pôs um scanner amplamente implantado e experiência operacional em detecção dentro da mesma empresa.",
        },
      ],
      // Timeline: same years, same order, same personal markers.
      timeline: [
        { year: 1998, title: "Nessus 1.0", detail: "Gratuito, de código aberto, e rapidamente o scanner padrão da área." },
        { year: 2002, title: "A empresa é fundada", detail: "16 de setembro, em Maryland, em torno do scanner e do trabalho de Gula em detecção." },
        { year: 2005, title: "O Nessus 3 fecha o código", detail: "Em outubro, o scanner virou proprietário. O motivo declarado foi financiar a engenharia; o efeito foi que uma ferramenta que a comunidade tinha ajudado a construir deixou de ser dela." },
        { year: 2012, title: "O primeiro dinheiro institucional", detail: "Uma Série A de US$ 50 milhões da Accel, dez anos depois da fundação: incomumente tarde, e sinal de que o negócio vinha se financiando sozinho." },
        { year: 2018, title: "Listagem na NASDAQ", detail: "Listada como TENB." },
        { year: 2023, title: "Escala e prejuízos", detail: "Receita de US$ 799 milhões contra um prejuízo operacional de US$ 52 milhões, com cerca de 2.000 funcionários: o formato comum de um negócio de assinaturas que ainda está comprando crescimento." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "Nessus", what: "O scanner, ainda vendido diretamente: Professional para praticantes, Expert acrescentando cobertura de aplicações web e de superfície de ataque externa. Continua sendo a implementação de referência que a maioria dos engenheiros já usou." },
        { name: "Tenable Vulnerability Management", what: "A plataforma em nuvem construída em torno do scanner, cobrada por ativo, voltada para avaliação contínua, e não para varreduras periódicas." },
        { name: "Tenable Security Center", what: "A implantação on-premises, para organizações que não podem ou não querem enviar dados de varredura para a nuvem de um fornecedor, um requisito que continua real em defesa e em setores regulados." },
        { name: "Tenable One", what: "A plataforma de gerenciamento de exposição: inventário de ativos, exposição de identidades e postura de nuvem reunidos numa só visão, ao lado das vulnerabilidades encontradas." },
        { name: "Tenable OT Security", what: "Tecnologia industrial e operacional, onde a descoberta passiva importa porque a varredura ativa pode atrapalhar equipamentos que nunca foram projetados para ser sondados." },
      ],
      // Innovations.
      innovations: [
        { title: "A cobertura de plugins como o verdadeiro produto", detail: "Um scanner só é tão bom quanto as suas verificações, e manter dezenas de milhares delas para todo sistema operacional, appliance e biblioteca é um trabalho contínuo e sem glamour. Os compradores ainda decidem por isso, e não pela marca da plataforma acima dele." },
        { title: "Fechar o código para financiar a engenharia", detail: "A decisão de 2005 é a que define a empresa, e corta para os dois lados. Financiou duas décadas dessa manutenção; também converteu a contribuição da comunidade em ativo comercial, e os forks de código aberto que vieram depois nunca igualaram a cobertura." },
        { title: "Descoberta passiva para redes que não se pode perturbar", detail: "Observar o tráfego para inferir o que existe numa rede, em vez de sondá-la, é a única abordagem segura em ambientes industriais, e a técnica que permitiu ao gerenciamento de vulnerabilidades ir além da TI." },
        { title: "A priorização como resposta ao volume", detail: "Quando uma varredura devolve cinquenta mil achados, a varredura já não é a parte difícil. Pontuar quais achados são de fato alcançáveis e de fato explorados é para onde a categoria foi." },
      ],
      // Markets, same entry count.
      markets: [
        "Empresas e governo, com posição forte no trabalho federal e de defesa dos Estados Unidos, decorrente da opção on-premises e do histórico dos fundadores. Preços de alguns milhares por ano, para ambientes pequenos, a seis dígitos, para os grandes.",
        "Compete diretamente com a Qualys e a Rapid7, ambas nesta linha do tempo, e cada vez mais com fabricantes cloud-native de postura que abordam o mesmo problema pela outra ponta.",
      ],
      // Analyst standing, same entry count.
      analyst: [
        "Situada de forma consistente entre as líderes nas avaliações de vulnerabilidades e de exposição, com o próprio Nessus funcionando como o benchmark informal contra o qual os concorrentes são medidos.",
        "Vale registrar a observação sobre a categoria inteira: os três fabricantes estabelecidos estão se reposicionando em torno do gerenciamento de exposição, e nenhum completou a transição, de modo que as compras ainda se decidem pela cobertura do scanner, pela arquitetura de varredura e pela pontuação de risco, e não pela marca da plataforma.",
      ],
    },
  },

  // texas-instruments: record prose.
  "texas-instruments": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Texas Instruments - onde o circuito integrado foi demonstrado",
    tagline: "Empresa de semicondutores cujo funcionário demonstrou o primeiro circuito integrado em 1958.",
    intro:
      "A Texas Instruments começou como uma empresa de levantamentos sísmicos para a indústria do petróleo e adotou o nome atual em 1951. Em 1958, um dos seus engenheiros, Jack Kilby, demonstrou que vários componentes podiam ser construídos sobre uma única peça de semicondutor: o circuito integrado.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Essa demonstração é um marco deste site, e não uma linha deste verbete, e o marco registra a ressalva com honestidade: Kilby mostrou que era possível, e a abordagem planar de Noyce na Fairchild é o que tornou a coisa fabricável. Os dois recebem o crédito, e a distinção entre provar que algo é possível e torná-lo repetível é toda a diferença entre um laboratório e uma indústria.",
      "A empresa, desde então, é menos visível e mais onipresente do que a origem sugere. O negócio dela é em grande parte silício analógico e embarcado: gerenciamento de energia, condicionamento de sinal, interface, as peças pequenas que nunca aparecem no resumo de um datasheet e sem as quais nada mais na placa funciona.",
      "Ela também aparece em outro ponto desta linha do tempo como alguém que perdeu um mercado. O verbete da Marvell registra que um read channel digital construído em CMOS tirou a Texas Instruments do negócio de read channels para discos rígidos, o que lembra que uma empresa pode inventar a tecnologia fundadora de uma indústria e ainda assim ser deslocada dentro dela.",
    ],
  },

  // trtec: record prose.
  "trtec": {
    // Card title (company kept verbatim), tagline and intro.
    name: "TRTEC",
    tagline: "Parceira Fortinet de nível Expert no Brasil.",
    intro:
      "Integradora de São Paulo, nível Expert na Fortinet, especializada apenas em SASE.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Uma única especialização declarada merece tanta atenção quanto uma lista longa. A TRTEC Informatica tem nível Expert em SASE e nada mais registrado, o que descreve uma casa que foi fundo numa arquitetura em vez de colecionar selos. SASE é também a especialização da Fortinet mais difícil de preencher com gente, porque atravessa redes e segurança, e a maioria dos engenheiros é formada em só uma das duas.",
    ],
  },

  // versim: record prose.
  "versim": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Versim - distribuição e treinamento, Polônia",
    tagline: "Distribuidora polonesa e centro de treinamento autorizado da Extreme Networks.",
    intro:
      "A Versim está no mercado polonês desde 2005 e é, pelo faturamento, uma das maiores distribuidoras de soluções de rede do país. Distribui tecnologias avançadas de redes e de segurança de TI, com e sem fio, a partir de Poznań, e desde 2016 mantém também um Authorized Training Center, certificado para Extreme Networks, Techstep e Gigaset Pro.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A Versim é uma distribuidora de valor agregado de Poznań, no mercado desde 2005 e, pelo próprio relato, uma das maiores distribuidoras de redes da Polônia em faturamento. Vende só para o canal (integradores, revendas, provedores de serviço) e nunca para o cliente na ponta, a posição clássica de distribuidora, e detém a autorização da Extreme Networks para a Polônia e, desde 2023, para a Bulgária.",
      "A parte que vale estudar é o braço de treinamento, e a ordem em que as duas coisas chegaram. A Versim ATP opera como centro de treinamento autorizado desde 2016; o contrato de distribuição com a Extreme veio em 2017. A empresa ensinava a plataforma antes de estar autorizada a vendê-la. Essa sequência diz para que serve o centro de treinamento: não é um complemento da distribuição, mas o mecanismo pelo qual a distribuidora torna o próprio canal competente o bastante para valer a pena abastecê-lo.",
      "O centro se descreve como o primeiro, e portanto o mais experiente, centro de treinamento em EMEA e APAC para o programa Extreme Certified Professional, e autorizado a aplicar os exames ECP. Oferece todas as trilhas de certificação da Extreme, bootcamps presenciais em Poznań ou no cliente, e dá aulas em polonês e inglês. Em março de 2025, acrescentou a autorização CWNP para wireless, e mantém uma série contínua, Fabric Best Practice, e um programa Smarter Partner voltado para o nível mais novo e menos estabelecido de parceiros da Extreme, justamente os que mais precisam de ajuda e menos tendem a pagar um terceiro por ela.",
      "Dois dos quatro instrutores citados são também engenheiros de sistemas de segurança da própria distribuidora, o arranjo que o site chama de conhecimento sustentado pela prática. O instrutor que acabou de terminar uma implementação ensina a partir da implementação, e o parceiro na sala está sendo treinado pela pessoa que vai atender o telefone quando a implantação der errado. É um produto diferente do instrutor de uma empresa de treinamento, e é o motivo de uma distribuidora manter o próprio centro em vez de encaminhar os parceiros para outro lugar.",
      "O portfólio em volta da Extreme é pequeno e deliberado: Cambium para backhaul sem fio, Techstep para gerenciamento de dispositivos móveis, Check Point e Hillstone para segurança, Gigaset para voz, e o NACVIEW, um sistema polonês de controle de acesso à rede, vendido com um argumento explícito de conformidade com a NIS2. Um produto nacional de NAC na linha de uma distribuidora é incomum, e se liga à história do controle de acesso em outro ponto deste catálogo: a disciplina que começou na Cabletron e na Enterasys agora tem um fabricante polonês competindo com base numa diretiva europeia.",
    ],
  },

  // xilinx: record prose.
  "xilinx": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Xilinx - o chip que você mesmo termina de escrever",
    tagline: "Pioneira dos field-programmable gate arrays, fundada em 1984 e adquirida pela AMD em 2022.",
    intro:
      "A Xilinx foi fundada no Vale do Silício em 1984 e fabricava field-programmable gate arrays: chips cuja lógica é configurada depois da fabricação, pelo cliente, e pode ser reconfigurada mais tarde. A AMD a adquiriu em fevereiro de 2022 e aposentou o nome em junho de 2023.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O FPGA fica entre as duas opções que os marcos de fabricação descrevem. Um processador de uso geral roda qualquer coisa e é lento em trabalho especializado; um chip customizado é rápido e custa milhões para ser projetado e fabricado antes que exista uma única unidade. Um dispositivo programável em campo é comprado como peça pronta e recebe a sua função depois, o que torna acessíveis os volumes pequenos e os requisitos que mudam.",
      "É por isso que ele aparece em redes. Processamento de pacotes em line rate que não tem volume para justificar um chip customizado (uma função de inspeção especializada, um protocolo que ninguém mais implementa, um acelerador cuja especificação muda todo ano) é trabalho de FPGA. A mesma propriedade explica por que fabricantes de equipamentos de rede os embarcam há décadas em produtos que ninguém descreve como hardware programável.",
      "Também explica a aquisição. O que a AMD comprou foi a capacidade de pôr lógica programável ao lado dos seus processadores, e as pessoas que projetam os serializadores por baixo das interfaces rápidas, num momento em que a placa de rede estava virando um computador por si só.",
    ],
    // Ending note (the year stays in the English record).
    endedNote:
      "Adquirida pela AMD em 14 de fevereiro de 2022, com a marca descontinuada gradualmente em junho de 2023; as linhas de produtos continuam sob a AMD.",
  },

  // ziva: record prose.
  "ziva": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Ziva",
    tagline: "Parceira brasileira citada no canal da Fortinet.",
    intro:
      "Uma parceira brasileira no canal da Fortinet. Registrá-la completa uma lista, sem fazer uma afirmação: o sentido de listar o canal é justamente que a indústria não é feita só dos fabricantes cujos logotipos aparecem nos equipamentos.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Integradora Fortinet de nível Expert e provedora de serviços gerenciados de segurança, especializada em segurança de nuvem, tecnologia operacional, SASE e operações de segurança. Registrá-la completa uma lista, sem fazer uma afirmação: o sentido de listar o canal é justamente que a indústria não é feita só dos fabricantes cujos logotipos aparecem nos equipamentos.",
    ],
  },

  // zscaler: record prose plus the complete translated profile.
  "zscaler": {
    // Card title (company kept verbatim), tagline and intro.
    name: "Zscaler",
    tagline: "Defendeu que, se os usuários não estão no escritório, a pilha de segurança também não deveria estar.",
    intro:
      "Jay Chaudhry fundou a Zscaler em 2007, depois de já ter fundado e vendido várias empresas de segurança. O argumento era que levar os usuários remotos de volta por um data center corporativo para chegar à internet estava prestes a deixar de fazer sentido.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O design tradicional punha a inspeção onde os usuários estavam, ou seja, no escritório, e mandava todo o resto de volta para lá por uma VPN. Isso funcionava enquanto as aplicações também moravam no data center. Quando as aplicações foram para a nuvem e os usuários saíram do escritório, o tráfego passou a viajar até um prédio que nem o usuário nem a aplicação tinham qualquer motivo para visitar.",
      "A Zscaler levou a inspeção para um conjunto distribuído de pontos de presença, de modo que o usuário se conecta a um próximo, é inspecionado ali e segue para onde quer que a aplicação de fato esteja. Isso elimina o hairpin, e significa que a capacidade passa a ser uma propriedade do provedor, e não do appliance de cada escritório.",
      "Também muda a economia de escala de um jeito que vale a pena entender. Uma plataforma de inspeção compartilhada vê o tráfego de todos os clientes, de modo que uma ameaça identificada para um passa a ser bloqueada para todos: o mesmo argumento estrutural que a IronPort fez sobre reputação de e-mail em 2002 e a CrowdStrike sobre endpoints em 2013. Esta linha do tempo mostra esse argumento sendo redescoberto para cada camada da pilha, uma de cada vez.",
      "A empresa abriu capital em 2018, e a categoria que ela definiu virou o security service edge, no qual compete diretamente com a Netskope, que também está neste site e chegou ao mesmo lugar a partir do problema da visibilidade, e não do roteamento.",
      "A Zscaler também mantém um braço de venture capital corporativo, a Zenith Ventures, que ela descreve como agnóstico quanto ao estágio (incomum para um CVC, já que a maioria escolhe um estágio e fica nele) e que investe em empresas de cibersegurança com uma base explicitamente estratégica: a expectativa declarada é que a empresa do portfólio aproveite a nuvem de segurança da Zscaler e se integre à plataforma. É um instrumento diferente de um fundo financeiro. Compra distribuição e integração para a plataforma tanto quanto compra participação, e o fundador que aceita o dinheiro está aceitando junto uma direção técnica.",
      "Duas empresas do portfólio são citadas na própria página da Zscaler. A Deep Instinct aplica deep learning à prevenção de malware; a P0 Security constrói governança de identidade unificada e acesso privilegiado para recursos de nuvem, cobrindo identidades de máquina além das humanas, a camada de governança de acesso de que uma rede zero trust ainda precisa por cima. As duas ficam ao lado do produto da Zscaler, e não dentro dele, e esse é o sentido de um investimento estratégico, em oposição a uma aquisição. Há um vínculo mais próximo do que isso: a mesma página cita Lane Bess como CEO da Deep Instinct, e o prospecto de 2018 da Zscaler o registra como COO da própria Zscaler de maio de 2011 a fevereiro de 2015 e como membro do conselho desde maio de 2011.",
      "Um alerta para quem for pesquisar isto: o nome colide. Buscar \"Zenith Ventures\" ou \"Zenith Venture Capital\" traz uma empresa de Estocolmo fundada em 2015, cujo portfólio inclui Truecaller e Urb-it e que não tem nada a ver com a Zscaler. Vários sites de bases de dados de investidores devolvem a empresa sueca para a busca da Zscaler. A única fonte confiável sobre o fundo da Zscaler é a própria página da Zscaler.",
    ],
    // Complete profile copy: facts verbatim from profiles/zscaler.ts, prose translated.
    profile: {
      slug: "zscaler",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "Zscaler",
          year: 2007,
          place: "San Jose, Califórnia",
          founders: ["Jay Chaudhry", "K. Kailash"],
          story:
            "Jay Chaudhry já tinha fundado e vendido uma série de empresas de segurança (SecureIT, CipherTrust e AirDefense entre elas) quando apostou o próprio dinheiro, em 2007, na ideia menos na moda da era dos appliances: a de que o secure web gateway não deveria ser uma caixa. Com o cofundador K. Kailash, construiu a Zscaler como uma nuvem de inspeção multi-tenant desde o primeiro dia, lançada em 2008, para que um usuário em qualquer cidade passasse por um nó de aplicação de políticas próximo, em vez de fazer um hairpin pela matriz. A indústria levou uma década e uma pandemia para concordar.",
        },
      ],
      // Timeline: same years, same order, same personal markers.
      timeline: [
        { year: 2007, title: "Uma nuvem, não uma caixa", detail: "A Zscaler é fundada em San Jose com a premissa de que a segurança deve ficar entre o usuário e a internet como um serviço; a plataforma entra no ar em 2008, anos antes de 'SASE' ou 'SSE' existirem como palavras." },
        { year: 2016, title: "O ZPA e a virada zero trust", detail: "O Zscaler Private Access aplica a mesma ideia às aplicações internas: conectar usuários a aplicações, nunca a redes. Junto com o ZIA, vira o modelo do que os analistas depois vão formalizar como zero trust network access." },
        { year: 2018, title: "IPO: ZS", detail: "Março de 2018: a Zscaler estreia na Nasdaq, levantando US$ 192 milhões, o primeiro dos nomes de segurança puramente em nuvem a abrir capital, e um termômetro para o modelo. Entra no Nasdaq-100 em dezembro de 2021." },
        { year: 2023, title: "A Zero Trust Exchange em escala", detail: "A marca da plataforma se consolida em torno da Zero Trust Exchange, uma nuvem global de inspeção que intermedeia conexões de usuário para aplicação, de workload para workload e de IoT/OT, processando centenas de bilhões de transações por dia." },
        { year: 2024, title: "Data fabric e SASE de fornecedor único", detail: "Janeiro traz o Zero Trust SASE sobre a plataforma SSE da empresa; março acrescenta o Data Fabric for Security da Avalor (US$ 310 milhões, segundo a imprensa) e abril a segmentação sem agente da Airgap Networks: as peças de analytics e de tráfego leste-oeste.", sourceNote: "8-K da Zscaler do ano fiscal de 2024; valor da Avalor segundo o noticiário da imprensa." },
        { year: 2025, title: "Red Canary e o SOC com IA", detail: "1º de agosto de 2025: a Zscaler conclui a aquisição da Red Canary, líder em MDR, unindo a sua experiência em detecção e resposta agêntica à telemetria da Zero Trust Exchange; com o negócio da SPLX, o total chega a US$ 692 milhões em contraprestação, e a ambição declarada é o SOC movido a IA.", sourceNote: "Comunicado da Zscaler; valor agregado do 8-K do primeiro trimestre do ano fiscal de 2026." },
        { year: 2026, title: "A escala como fosso", detail: "Protegendo cerca de 45% da Fortune 500 e inspecionando mais de 500 bilhões de transações por dia, o argumento da Zscaler hoje é menos sobre a ideia, que todos já admitem, e mais sobre quem opera a maior e mais inteligente nuvem de aplicação de políticas." },
        { year: 2026, personal: true, title: "Meu capítulo", detail: "O capítulo zero trust que se abre em 2026: o segmento em que o perímetro deixa de ser um lugar e passa a ser uma decisão tomada a cada sessão." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "Zscaler Internet Access (ZIA)", what: "O produto fundador: secure web gateway, firewall, sandbox e DLP entregues pela nuvem, entre os usuários e a internet." },
        { name: "Zscaler Private Access (ZPA)", what: "Zero trust network access para aplicações internas: os usuários chegam às aplicações pela exchange sem nunca entrar na rede." },
        { name: "Zscaler Digital Experience (ZDX)", what: "Monitoramento de ponta a ponta da experiência do usuário sobre a mesma nuvem: a contrapartida operacional da segurança inline." },
        { name: "Zero Trust Exchange", what: "A própria plataforma: a nuvem de inspeção e políticas distribuída globalmente sobre a qual rodam todos os serviços, hoje alimentando uma pilha de operações de segurança movida a IA, construída sobre o data fabric da Avalor e a Red Canary." },
      ],
      // Innovations.
      innovations: [
        { title: "A segurança como nuvem multi-tenant", detail: "Construir o plano de inspeção como um serviço global feito sob medida em 2008: a aposta arquitetural que antecedeu, e depois definiu, a categoria SSE." },
        { title: "Usuário para aplicação, nunca usuário para rede", detail: "A inversão do acesso remoto feita pelo ZPA: nenhum listener de entrada, nenhuma superfície para movimento lateral; o padrão em que todo o mercado de ZTNA se padronizou." },
        { title: "Da telemetria às operações", detail: "Transformar meio trilhão de transações diárias num data fabric (Avalor) e em detecção e resposta agêntica (Red Canary): operações de segurança como produto da escala." },
      ],
      // Markets, same entry count.
      markets: [
        "A Zscaler lidera o mercado de edge de segurança entregue pela nuvem que ela efetivamente criou, vendendo a grandes empresas que trocam appliances de web proxy e concentradores de VPN, e compete de frente com Netskope, Palo Alto Networks e Cisco enquanto as categorias SSE e zero trust se consolidam.",
      ],
      // Analyst standing, same entry count.
      analyst: [
        "Presença constante entre os Leaders do Magic Quadrant de Security Service Edge do Gartner desde a edição inaugural, com a herança de secure web gateway que fez dela o ponto de referência em torno do qual a categoria foi desenhada.",
      ],
    },
  },
};
