// ============================================================================
// src/content/vendors/overlays/pt-BR/shard-1.ts
// ----------------------------------------------------------------------------
// pt-BR INDUSTRY OVERLAYS, SHARD 1 of 8 (translation pass planned 2026-10-25;
// see the round 2 TRANSLATION-PLAN). One shard per translator, so parallel
// work never edits the same file. Each entry is keyed by record slug and holds
// ONLY translated prose (PartnerVendorOverlay); facts stay in partners.ts and
// profiles/*.ts. Check with: npx tsx scripts/report-industry-translation.mts --strict
//
// Records assigned to this shard (~26,962 words):
// a10, algar-telecom, allied-telesis, apache, broadcom, cdw, check-point,
// conversys, crowdstrike, crypto-ag, cyberark, cyble, datadog, dell-force10,
// eeye-digital-security, flipside, fluke, google-search, hewlett-packard,
// hexait, highcast, hughes, illumio, marvell, mikrotik, motorola, nec,
// nextdns, nortel-bay, novell, olitel, opennms-group, paessler, proteon, rcx,
// sixdegrees, skytap, spiderlabs, supermicro, tandy-radioshack, tech-data-
// synnex, techdec, tecnocomp, totvs, xerox
// ============================================================================

import type { PartnerVendorOverlay } from "@/content/vendors/localized";

/** Translated prose for this shard's records, keyed by slug. */
export const SHARD_1: Record<string, PartnerVendorOverlay> = {
  // A10 Networks: record prose (no subtitle in the name) and the complete profile.
  "a10": {
    // Name has no subtitle: kept verbatim so the record reports complete.
    name: "A10 Networks",
    // Card line and page intro.
    tagline: "Atacou o application delivery pelo flanco do throughput, onde o tráfego é mais pesado.",
    intro:
      "Lee Chen fundou a A10 em San Jose em 2004, depois de já ter sido cofundador da Centillion Networks e da Foundry Networks. Em vez de disputar o data center corporativo recurso por recurso, a empresa foi aonde o volume decide: carrier-grade NAT, absorção de DDoS e a camada de service providers medida em milhões de sessões simultâneas.",
    // Body paragraphs, same count and order as English.
    body: [
      "O perfil abaixo cobre a fundação, o litígio com a Brocade, a abertura de capital em 2014, a década do CGNAT e a entrada em DDoS e em infraestrutura 5G.",
      "Vale a pena ler ao lado da Kemp, que aparece separadamente aqui e atacou a mesma categoria pela direção oposta: para baixo no preço, em vez de para cima no throughput. Juntas, elas são o motivo de o application delivery nunca ter virado mercado de um fabricante só.",
    ],
    // Complete translated profile; years, company and founders unchanged.
    profile: {
      slug: "a10",
      foundings: [
        {
          company: "A10 Networks",
          year: 2004,
          place: "San Jose, Califórnia",
          founders: ["Lee Chen"],
          story:
            "Lee Chen já tinha sido cofundador da Centillion Networks e da Foundry Networks quando criou a A10 em 2004, um terceiro ato mirando o mercado de application delivery pelo flanco do desempenho. A AX Series, e depois a linha Thunder sobre o sistema operacional ACOS, cortejou os compradores que medem em milhões de sessões simultâneas: service providers, operadoras e os operadores de escala web para quem carrier-grade NAT e absorção de DDoS são itens de orçamento, não recursos. Enquanto o líder de mercado dominava o data center corporativo, a A10 construiu a sua franquia onde o tráfego é mais pesado.",
        },
      ],
      timeline: [
        { year: 2004, title: "Fundação", detail: "A terceira empresa de Chen entra em application delivery com uma tese de desempenho: hardware dedicado e software ACOS para a camada de maior throughput do mercado." },
        { year: 2012, title: "A sombra da Foundry", detail: "Anos de litígio entre a Brocade, que tinha comprado a Foundry, e a A10 sobre propriedade intelectual da era Foundry seguem seu curso e terminam em acordo: um capítulo doloroso que a empresa absorve e ao qual sobrevive.", sourceNote: "Litígio Brocade v. A10 e acordo conforme o registro público; o histórico de veredito e recurso está resumido deliberadamente, sem valores." },
        { year: 2014, title: "Listagem na New York Stock Exchange", detail: "Março de 2014: listada como ATEN, com a franquia de service providers (CGNAT para o fim do IPv4, Thunder TPS para DDoS) já como marca registrada da empresa." },
        { year: 2016, title: "A década do CGNAT", detail: "O esgotamento do IPv4 transforma o carrier-grade NAT de gambiarra de transição em infraestrutura permanente, e o Thunder CGN vira uma das caixas por onde a internet móvel passa sem alarde." },
        { year: 2019, title: "Nova liderança", detail: "Dhrupad Trivedi assume o comando; a empresa se concentra em segurança e infraestrutura de service providers: defesa contra DDoS, inspeção de TLS e a borda do core 5G." },
      ],
      products: [
        { name: "Thunder e ACOS", what: "A linha de ADC, CGNAT e defesa contra DDoS de alto throughput: a resposta alternativa da camada de service providers." },
        { name: "Thunder TPS", what: "Mitigação de DDoS na escala de operadora, onde ataques são clima e não eventos: absorção e limpeza em vez de bloqueio." },
        { name: "Thunder CGN", what: "Carrier-grade NAT, que o esgotamento do IPv4 transformou de medida temporária em infraestrutura permanente por onde passa boa parte do tráfego móvel." },
      ],
      innovations: [
        { title: "Competir em throughput por dólar", detail: "Em vez de igualar o líder recurso por recurso no mercado corporativo, a A10 foi aonde o volume decide: a camada medida em milhões de sessões simultâneas. É um mercado mais estreito e mais difícil de tirar de um incumbente, porque o comprador testa antes de assinar." },
        { title: "Manter os líderes honestos", detail: "A contribuição estrutural de um desafiante crível: toda cotação concorrente durante duas décadas foi escrita sabendo que a A10 podia oferecer mais throughput por dólar. Gravidade competitiva também é inovação, e é o motivo de o application delivery nunca ter virado monopólio." },
      ],
      markets: [
        "Service providers, operadoras e operadores de escala web: carrier-grade NAT, defesa contra DDoS, inspeção de TLS e infraestrutura 5G. O cliente é aquele para quem o volume de tráfego é a restrição definidora, mais do que a amplitude de recursos.",
        "A contraparte vinda da outra direção é a Kemp, que atacou a mesma categoria por baixo, pelo preço, e aparece separadamente nesta linha do tempo.",
      ],
      analyst: [
        "Avaliada como presença duradoura de segundo escalão em application delivery, com liderança real nos segmentos de service providers e DDoS, e não como desafio genérico ao líder.",
        "Os métodos de load balancing ensinados neste site (os algoritmos, os health monitors, os modelos de persistência) são a mesma maquinaria que esta plataforma comercializa. O fabricante muda; a matemática, não.",
      ],
    },
  },
  // Algar Telecom: record prose only (no profile).
  "algar-telecom": {
    // Name: company kept, subtitle translated.
    name: "Algar Telecom - a operadora que o Estado nunca tomou",
    tagline: "Operadora brasileira fundada em 1954 como CTBC em Uberlândia, a única a continuar privada durante a estatização.",
    intro:
      "A Algar Telecom foi fundada em fevereiro de 1954 em Uberlândia, Minas Gerais, como CTBC, e Alexandrino Garcia assumiu o controle em 1958 para expandi-la além da cidade. É a única operadora telefônica brasileira que permaneceu em mãos privadas quando o Estado assumiu o setor, e leva o nome Algar desde 2013.",
    // Body paragraphs, same count and order as English.
    body: [
      "Esse fato, sozinho, é o motivo de ela estar ao lado da Oi nesta linha do tempo. Quando a Telebras foi criada em 1972 e a telefonia passou ao controle estatal, esta empresa não passou, e continua sob controle familiar setenta anos depois de começar. A Oi foi montada a partir de dezesseis empresas estatais pela privatização e entrou com o maior pedido de recuperação judicial da história brasileira; a operadora que nunca entrou no sistema estatal continua operando.",
      "A origem é incomumente específica para uma concessionária. Um empresário local do ramo de veículos, diante de um serviço telefônico que não funcionava, organizou a associação comercial da cidade em torno de consertá-lo, e a empresa saiu disso. É um lembrete de que a infraestrutura chegou ao interior porque alguém do lugar decidiu que ela devia chegar, e não porque um plano chegou até lá.",
      "O interior também é a estratégia inteira. Ela chegou a mais oito cidades até 1967, passou a imprimir as próprias listas telefônicas a partir de 1969 e foi a primeira operadora a levar telefonia celular ao interior do Brasil, em 1993: sempre cedo em lugares que os relatos nacionais desta indústria descrevem como tardios.",
    ],
  },
  // Allied Telesis: record prose and the complete profile.
  "allied-telesis": {
    // Name has no subtitle: kept verbatim so the record reports complete.
    name: "Allied Telesis",
    // Card line and page intro.
    tagline: "O burro de carga global da Ethernet japonesa, dos media converters para cima.",
    intro:
      "Takayoshi Oshima (1940-2022) fundou a empresa em Tóquio em março de 1987 (System Plus por seis meses, Allied Telesis desde então, Allied Telesyn para uma geração de compradores internacionais), começando pelo produto mais humilde das redes: o media converter.",
    // Body paragraphs, same count and order as English.
    body: [
      "Listada em Tóquio em 2000, com o coração dividido entre o Japão e San Jose, e construída sobre o meio nada glamoroso do mercado: os switches e conversores que fazem escolas, fábricas e a infraestrutura das cidades funcionar por décadas sem que ninguém pense neles.",
    ],
    // Complete translated profile; years, company and founders unchanged.
    profile: {
      slug: "allied-telesis",
      foundings: [
        {
          company: "Allied Telesis",
          year: 1987,
          place: "Tóquio, Japão",
          founders: ["Takayoshi Oshima"],
          story:
            "Takayoshi Oshima já tinha passado pelas trincheiras americanas de semicondutores e redes (ITT, Fairchild, AMD, Ungermann-Bass) antes de voltar para casa e construir a resposta japonesa ao boom da Ethernet. A empresa nasceu em março de 1987 como System Plus, adotou o nome Allied Telesis em poucos meses e começou pelo produto mais humilde do catálogo: o media converter, a caixinha que casa cobre com fibra. Desse ponto de apoio nada glamoroso cresceu até virar um fabricante global de switching e infraestrutura (Allied Telesyn para uma geração de compradores internacionais), listado em Tóquio em 2000 e ainda com o coração dividido entre o Japão e o Vale do Silício. Oshima a liderou por 35 anos, até morrer em 2022.",
          sourceNote:
            "Nome de fundação e datas de 1987 conforme a cronologia da empresa na Wikipedia (System Plus, março de 1987; renomeada em setembro de 1987); a carreira anterior de Oshima e a origem nos media converters conforme os materiais de memória e de história da própria Allied Telesis. Algumas fontes secundárias registram o nome original como 'System & Control Japan'; aqui se usa o 'System Plus' da cronologia da empresa.",
        },
      ],
      timeline: [
        { year: 1987, title: "A System Plus vira Allied Telesis", detail: "Fundada em Tóquio em março; renomeada Allied Telesis K.K. em setembro: uma empresa de Ethernet desde o primeiro dia, começando pelos media converters." },
        { year: 1990, title: "A Allied Telesyn vai para o exterior", detail: "O braço internacional é lançado com o nome Allied Telesyn e planta a marca na Ásia-Pacífico, nas Américas e na Europa ao longo dos anos 1990." },
        { year: 2000, title: "Listagem em Tóquio", detail: "A Allied Telesis é listada na Bolsa de Tóquio (6835), uma das primeiras empresas japonesas de redes em escala realmente global." },
        { year: 2006, title: "Um nome no mundo todo", detail: "A marca da era Telesyn volta a convergir para Allied Telesis globalmente, enquanto a linha de produtos sobe para switching gerenciado, anéis resilientes e infraestrutura convergente." },
        { year: 2015, title: "Redes que se defendem sozinhas", detail: "A aposta da empresa em automação de segurança (isolar ao detectar ameaça, dentro da própria malha da rede) vira a sua história corporativa de assinatura, desenvolvida com parcerias com universidades japonesas." },
        { year: 2022, title: "Fecha-se o capítulo do fundador", detail: "Takayoshi Oshima morre em 7 de outubro de 2022, depois de 35 anos à frente da empresa que fundou.", sourceNote: "Conforme o comunicado de falecimento da empresa." },
      ],
      products: [
        { name: "Media converters", what: "A linha de produtos da fundação: conversão de cobre para fibra, ainda um item fixo do catálogo e uma origem apropriada para uma empresa de infraestrutura Ethernet." },
        { name: "Switching e redes industriais", what: "Switches corporativos gerenciados e switches industriais robustecidos, com arquiteturas de anel resiliente para concessionárias de serviços públicos e transporte." },
        { name: "AMF / Self-Defending Network", what: "Gerenciamento autônomo e isolamento de ameaças em toda a malha: a camada de automação sobre a linha de hardware." },
      ],
      innovations: [
        { title: "A confiabilidade como marca", detail: "A Allied Telesis nunca correu atrás da ponta da tecnologia; padronizou o meio confiável: os switches e conversores que fazem escolas, hospitais, fábricas e a infraestrutura das cidades funcionar por décadas sem que ninguém pense neles." },
      ],
      markets: [
        "Redes corporativas, governamentais, educacionais e industriais no mundo todo, com profundidade especial no Japão e na Ásia-Pacífico e uma base instalada duradoura onde quer que o requisito seja disponibilidade sem glamour.",
      ],
      analyst: [
        "Situada entre as contemporâneas como a sobrevivente em regime estável: um fundador, um foco, de um media converter de 1987 a uma linha global de infraestrutura; prova de que, nesta indústria, a resistência é em si uma estratégia.",
      ],
    },
  },
  // The Apache Software Foundation: record prose and the complete profile.
  "apache": {
    // Name has no subtitle: kept verbatim so the record reports complete.
    name: "The Apache Software Foundation",
    // Card line and page intro.
    tagline: "O servidor web que fez a web rodar, construído por oito pessoas trocando patches por e-mail.",
    intro:
      "O Apache começou em fevereiro de 1995 como um conjunto de patches para um servidor web que ninguém mais mantinha. Em um ano era o servidor mais usado da internet, e manteve essa posição durante quase duas décadas: a resposta padrão a \"o que serve este site\" para uma geração inteira da web.",
    // Body paragraphs, same count and order as English.
    body: [
      "O daemon HTTP de domínio público escrito por Rob McCool no National Center for Supercomputing Applications era o software de servidor mais popular da web no começo de 1995, e o desenvolvimento dele tinha parado quando McCool saiu do NCSA, em meados de 1994. Cada webmaster tinha escrito as próprias correções e extensões, sem um lugar comum para guardá-las. Brian Behlendorf (que vinha remendando o código do NCSA para que ele desse conta do cadastro de usuários da HotWired, o site da revista Wired) e Cliff Skolnick montaram uma lista de discussão e uma máquina compartilhada na Bay Area, com banda doada pela HotWired.",
      "No fim de fevereiro de 1995, oito colaboradores centrais tinham formado o Apache Group: Brian Behlendorf, Roy Fielding, Rob Hartill, David Robinson, Cliff Skolnick, Randy Terbush, Robert Thau e Andrew Wilson. A primeira versão pública, a 0.6.2, saiu em abril de 1995; a versão 1.0 veio em 1º de dezembro, e em um ano o Apache tinha ultrapassado o NCSA httpd e se tornado o servidor web mais usado da internet.",
      "O nome tem duas explicações, e o projeto já deu as duas. O FAQ original dizia que o resultado de juntar todos aqueles patches era 'a patchy server' (um servidor remendado). Behlendorf disse em 2000 que o nome foi escolhido em respeito ao povo apache e, em 2007, disse que eram os patches, afinal. A posição atual da própria ASF dá o crédito à tribo. As duas histórias estão no registro, e por isso as duas estão aqui.",
      "Em junho de 1999, o Apache Group se constituiu como Apache Software Foundation, uma organização sem fins lucrativos de Delaware, com Behlendorf como primeiro presidente, para que o projeto sobrevivesse a qualquer voluntário individual. Essa estrutura é o motivo de a ASF hoje abrigar centenas de projetos, e não um servidor só.",
      "Roy Fielding, um dos oito originais, foi depois coautor da especificação HTTP/1.1 e definiu o REST na sua tese de doutorado. As pessoas que escreveram o servidor também escreveram boa parte do que o servidor fala.",
    ],
    // Complete translated profile; years, companies and founders unchanged.
    profile: {
      slug: "apache",
      foundings: [
        {
          company: "The Apache Group",
          year: 1995,
          place: "a internet, coordenada a partir da Bay Area da Califórnia",
          founders: [],
          story:
            "Não era uma empresa e, no começo, nem um projeto: era uma lista de discussão para pessoas que tinham, cada uma, uma correção para o mesmo servidor abandonado e nenhum lugar onde colocá-la. O primeiro problema que ela resolveu foi organizacional, não técnico: o código funcionava, os patches existiam, e não havia caminho de um até o outro.",
        },
        {
          company: "The Apache Software Foundation",
          year: 1999,
          place: "Delaware",
          founders: ["twenty-one members of the Apache Group"],
          story:
            "Vinte e um fundadores, constituindo uma entidade para deter propriedade intelectual e marcas. A organização foi construída para resolver o problema que a tinha criado, o que é uma peça de engenharia mais caprichada do que a maior parte do software.",
        },
      ],
      timeline: [
        { year: 1994, title: "O mantenedor vai embora", detail: "Rob McCool deixa o NCSA rumo à Netscape, e o servidor web mais usado da internet deixa de ser mantido enquanto continua sendo o servidor web mais usado da internet." },
        { year: 1995, title: "O outro lado entra na conversa", detail: "O NCSA retomou o desenvolvimento do próprio servidor nos mesmos meses, e dois membros da equipe entraram na lista do Apache em março como membros honorários, para que os dois projetos pudessem trocar correções. O fork e o original cooperaram em vez de competir, o que não é o roteiro habitual." },
        { year: 1999, title: "A fundação", detail: "A estrutura em que os outros trezentos projetos foram pendurados depois." },
      ],
      products: [
        { name: "Apache HTTP Server", what: "O projeto que dá nome a todo o resto e, durante vinte anos, a resposta padrão para o que está servindo esta página." },
        { name: "A API de módulos", what: "O mecanismo de extensão, e o motivo de o servidor ter sobrevivido às próprias decisões de projeto: criptografia, linguagens de script e reescrita de URLs chegaram todas como módulos escritos por gente de fora do grupo central." },
        { name: "A Apache License", what: "A versão 1.0 trazia uma cláusula de publicidade que exigia reconhecimento em material promocional; a versão 2.0 a eliminou e acrescentou uma concessão explícita de patentes, motivo pelo qual ela é hoje a licença permissiva padrão para contribuições corporativas." },
        { name: "The Apache Software Foundation", what: "Hoje cuida de trezentos ou mais projetos, com vários milhares de committers voluntários: uma estrutura jurídica e de governança oferecida aos projetos que precisam de uma, o que é um produto em todos os sentidos que importam." },
      ],
      innovations: [
        { title: "Shambhala: reescrever o que funcionava", detail: "A nova arquitetura de Robert Thau substituiu o núcleo remendado do NCSA por uma estrutura modular, uma API de extensão e alocação de memória baseada em pools. É a decisão sobre a qual repousam os vinte anos seguintes do projeto: um servidor cujas capacidades podiam ser acrescentadas por estranhos sem mexer no núcleo. Todo módulo de que alguém se lembra foi escrito por alguém que não estava entre os oito originais." },
        { title: "Cooperar com o código do qual se fez o fork", detail: "Quando os mantenedores originais voltaram, os dois lados compartilharam correções em vez de divergir. A história do software está cheia de forks que endureceram em rivalidades, e o contraexemplo merece registro porque foi uma escolha, não um acaso." },
        { title: "Uma fundação como plano de sucessão", detail: "A ASF existe para que a saída de qualquer colaborador não mude nada estrutural: a mesma falha que produziu o Apache, para começo de conversa. Constituir uma entidade para se tornar desnecessário é algo incomum para fundadores, e é o motivo de a organização hoje abrigar projetos que nada têm a ver com servidores web." },
        { title: "A licença permissiva como convite", detail: "Permitir uso comercial sem exigir reciprocidade trouxe as empresas que uma licença copyleft teria mantido de fora. Essa é a troca que a licença faz, e o argumento contra ela é real: muito trabalho sob a licença Apache roda hoje dentro de produtos que não devolvem nada. As duas metades disso são verdadeiras ao mesmo tempo." },
      ],
      markets: [
        "Durante quase duas décadas, a própria web, e ainda uma base instalada enorme, embora o nginx e os load balancers dos próprios provedores de nuvem fiquem hoje com boa parte das novas implantações. O declínio do servidor não é um colapso, e sim um mercado que cresceu ao redor dele.",
        "A posição da fundação é diferente e mais forte: é para onde vai um projeto patrocinado por empresas quando quer se tornar crivelmente independente, um serviço quase sem concorrentes.",
      ],
      analyst: [
        "Não há fabricante para avaliar aqui, e esse é justamente o sentido do arranjo. O que se pode medir é durabilidade: uma base de código que começou como patches para um software abandonado continua em produção trinta anos depois, e a organização construída ao redor dela cuida hoje de várias centenas de outros projetos.",
        "A contribuição duradoura talvez nem seja o servidor. Vários dos oito originais foram escrever as especificações sobre as quais a web roda, e o modelo de governança que a fundação inventou foi copiado por quase todo grande projeto open source desde então, inclusive por empresas que jamais teriam liberado nada sem uma estrutura neutra onde liberá-lo.",
      ],
    },
  },
  // Broadcom: record prose only (no profile).
  "broadcom": {
    // Name: company kept, subtitle translated.
    name: "Broadcom - o silício dentro do switch de quase todo mundo",
    tagline: "Fornecedora de merchant silicon para switching, e a empresa da qual depende, sem dizer, a maior parte dos equipamentos de rede desta linha do tempo.",
    intro:
      "A Broadcom Corporation foi fundada em agosto de 1991 por Henry Nicholas e Henry Samueli como fabricante fabless de chips para Ethernet e cable modem. Hoje é a fornecedora dominante de merchant silicon para switching: as famílias StrataXGS, Trident e Tomahawk, e a linha StrataDNX de buffers profundos, que veio da compra da Dune Networks em 2009.",
    // Body paragraphs, same count and order as English.
    body: [
      "O merchant silicon é o motivo de o mercado de switches ter deixado de ser uma competição de silício. Antes dele, cada fabricante de redes projetava os próprios chips de encaminhamento, e essa exigência de capital era a barreira de entrada: a razão de os fabricantes dos anos 1990 nesta linha do tempo serem poucos e grandes. A família Trident chegou em 2010 e tornou um switch competitivo construível por qualquer um que pudesse comprar a mesma peça, e é por isso que a indústria se encheu de equipamentos que diferem no software e no suporte, não no chip que faz o encaminhamento.",
      "A escala dessa dependência é fácil de subestimar. Todo fabricante de redes estabelecido usa merchant silicon em pelo menos parte dos produtos, e as implementações de referência de switching leaf e spine são construídas, em sua esmagadora maioria, sobre as famílias de um único fornecedor. Muito do equipamento descrito em outras partes deste site é, no plano de encaminhamento, o mesmo chip em chapas metálicas diferentes.",
      "A história corporativa é a parte mais estranha e merece ser dita com todas as letras. A empresa que hoje se chama Broadcom remonta à HP Associates, de 1961, foi separada da Agilent por um fundo de private equity em 2005 como Avago e, em janeiro de 2016, a Avago comprou a Broadcom Corporation por US$ 37 bilhões e adotou o nome dela: a empresa menor e mais lucrativa comprando a maior e assumindo a sua marca. Depois vieram a Brocade em 2017, a CA em 2018, o negócio corporativo da Symantec em 2019 e a VMware por US$ 69 bilhões em 2023.",
      "Esse caminho de aquisições cruza esta linha do tempo várias vezes. A Brocade é onde começa a cadeia da entrada da Ruckus; a Symantec aparece no grupo de segurança; e a VMware está por baixo de boa parte da infraestrutura que os equipamentos de rede conectam. Uma empresa que vendia chips de switching acabou dona também do hypervisor.",
    ],
  },
  // CDW: record prose only (no profile).
  "cdw": {
    // Name: company kept, subtitle translated.
    name: "CDW - a revenda que vende para todo mundo",
    tagline: "Nascida de um anúncio classificado em 1984; o arquétipo americano do value-added reseller, e o lugar onde uma licença de laboratório da F5 custava 108 dólares e um cartão de crédito.",
    intro:
      "A CDW é uma revenda americana de produtos e serviços de tecnologia, fundada em Chicago em 1984 e sediada em Vernon Hills, Illinois, com receita acima de 22 bilhões de dólares.",
    // Body paragraphs, same count and order as English.
    body: [
      "A CDW começou em 1984 como um anúncio classificado. Michael Krasny, ex-vendedor de carros usados, publicou um pequeno anúncio num jornal de Chicago para vender o próprio IBM PC; a segunda pessoa que ligou pediu que ele lhe vendesse um sistema também, e a empresa que nasceu dessa ligação virou Computer Discount Warehouse, depois simplesmente CDW e, em 2025, uma empresa da Fortune 500 com 22,4 bilhões de dólares de receita e quinze mil funcionários, vendendo para empresas, governo, educação e saúde em três países.",
      "É o arquétipo americano do value-added reseller, e vale ser exato no contraste com um distribuidor. A entrada da Versim descreve uma firma que vende só para o canal e nunca para o cliente final; a CDW é a outra coisa, a camada que vende para todo mundo, e já foi aberta, fechada e aberta de novo (listada em 1993, comprada por 7,3 bilhões em 2007, relistada em 2013), enquanto entrava, por aquisição, em serviços com a Berbee em 2006, na Grã-Bretanha com a Kelway em 2015 e, por 2,5 bilhões em 2021, na Sirius.",
      "O que uma revenda desse tipo torna possível se mostra melhor numa única transação. Em outubro de 2019, uma licença de laboratório do BIG-IP Virtual Edition, a edição de 10 megabits que a F5 vende para treinamento e avaliação, podia ser colocada num carrinho online e comprada por 108,29 dólares, com um ano do suporte premium do fabricante por mais 18,99, entregue eletronicamente, sem nada para despachar. Dois dias depois, a confirmação do próprio fabricante do contrato de serviço resultante chegou com o balcão de licenciamento da revenda em cópia. Um engenheiro com um cartão de crédito e nenhuma relação com o fabricante podia montar um laboratório F5 licenciado e com suporte pelo preço de um livro técnico.",
      "Isso é o que se deve entender sobre a camada de revenda: ela não é principalmente uma fonte de desconto, como o nome original afirmava, mas uma fonte de acesso. O contrato do fabricante, o direito ao suporte e o licenciamento chegaram exatamente como teriam chegado para uma grande empresa, porque a revenda já tinha feito a parte que exige relacionamento. As entradas de canal em outros pontos desta seção descrevem distribuidores e integradores defendendo a sua margem com laboratórios, logística e engenheiros. Esta é a versão mais simples do argumento, e cabe num recibo.",
    ],
  },
  // Check Point Software Technologies: record prose and the complete profile.
  "check-point": {
    // Name has no subtitle: kept verbatim so the record reports complete.
    name: "Check Point Software Technologies",
    // Card line and page intro.
    tagline: "Patenteou a stateful inspection, inventou o mercado de firewalls e depois viu os próprios ex-funcionários construírem a concorrência.",
    intro:
      "Gil Shwed, Marius Nacht e Shlomo Kramer fundaram a Check Point em Tel Aviv em 1993. Shwed tinha trabalhado com separação de acesso entre redes durante o serviço militar, e o produto de fundação da empresa, o FireWall-1, levou a stateful inspection a um mercado comercial que vinha se virando com filtros de pacotes e proxies de aplicação.",
    // Body paragraphs, same count and order as English.
    body: [
      "A stateful inspection é a ideia que vale a pena entender, porque tudo o que veio depois a pressupõe. Um filtro de pacotes julga cada pacote isoladamente, o que significa que não consegue distinguir uma resposta de uma conexão não solicitada e precisa deixar portas de retorno abertas. Um proxy de aplicação entende as conversas, mas as termina, o que é lento e exige código para cada protocolo. A stateful inspection rastreava as conexões numa tabela e julgava os pacotes contra esse estado: a segurança de entender a conversa, perto da velocidade da filtragem.",
      "A Check Point a patenteou, vendeu-a como software sobre hardware de uso geral e, na prática, criou a categoria comercial de firewalls. No fim dos anos 1990, detinha uma fatia dominante de um mercado que ela mesma tinha definido.",
      "O que veio depois é a metade mais interessante. Nir Zuk, um dos primeiros funcionários, saiu e acabou fundando a Palo Alto Networks, que ultrapassou a Check Point em receita de firewalls por volta de 2014. Shlomo Kramer, cofundador, foi fundar a Imperva e depois a Cato Networks. A rede de ex-funcionários da empresa semeou uma parte substancial da indústria israelense de segurança, e vários dos seus concorrentes.",
      "A própria Check Point continuou independente, lucrativa e conservadora ao longo de décadas de consolidação, o que, nesta linha do tempo, é realmente raro. Quase todos os pares de 1993 foram comprados, divididos ou renomeados. Ela foi criticada por avançar devagar em recursos de next-generation firewall e em nuvem, e continua aqui, ainda com o próprio nome, dirigida durante boa parte desse tempo por um fundador.",
    ],
    // Complete translated profile; years, company and founders unchanged.
    profile: {
      slug: "check-point",
      foundings: [
        {
          company: "Check Point Software Technologies",
          year: 1993,
          place: "Ramat Gan, Israel",
          founders: ["Gil Shwed", "Marius Nacht", "Shlomo Kramer"],
          story:
            "Gil Shwed trouxe a ideia da Unit 8200, a unidade israelense de inteligência de sinais onde tinha interligado redes classificadas: inspecionar o tráfego de forma stateful, rastreando conexões em vez de julgar pacotes isolados. Com Marius Nacht, Shlomo Kramer e US$ 250.000 de capital semente da BRM, construiu o FireWall-1 e, com ele, na prática, o mercado comercial de firewalls. A Sun assinou um acordo de OEM em 1994, a HP um acordo de distribuição em 1995 e, em fevereiro de 1996, a IDC media a Check Point em quarenta por cento do mercado mundial de firewalls. Kramer saiu em 2003 para fundar a Imperva, cuja página também está nesta seção; Shwed dirigiu a empresa por trinta e um anos, o mandato de CEO mais longo da Nasdaq.",
        },
      ],
      timeline: [
        { year: 1993, title: "Stateful inspection", detail: "Fundada em Ramat Gan sobre a ideia central de Shwed, patenteada como Stateful Inspection: um firewall que se lembra do estado das conexões. O FireWall-1 sai no ano seguinte, com o VPN-1, entre os primeiros produtos comerciais de VPN, logo atrás." },
        { year: 1996, title: "Líder de mercado, depois o IPO", detail: "Em fevereiro, a IDC aponta a Check Point como líder mundial do mercado de firewalls, com 40 por cento de participação; a listagem na NASDAQ como CHKP vem no mesmo ano: a indústria de segurança de Israel chega ao palco mundial." },
        { year: 2009, title: "Os appliances da Nokia voltam para casa", detail: "A Check Point conclui a aquisição do negócio de appliances de segurança da Nokia (a linha de hardware que tinha levado o FireWall-1 a incontáveis data centers) e reúne software e metal sob o mesmo teto, ao lado da arquitetura Software Blades, apresentada no mesmo ano." },
        { year: 2018, title: "Comprando a entrada na era da nuvem", detail: "A Dome9 (cerca de US$ 175 milhões) traz gestão de postura de segurança em nuvem e abre uma sequência de aquisições que acrescenta a Avanan, para segurança de e-mail em nuvem, em 2021: as famílias CloudGuard e Harmony tomam forma." },
        { year: 2023, title: "Perimeter 81 e a virada para SASE", detail: "A aquisição da Perimeter 81, por cerca de US$ 490 milhões, traz o security service edge para o portfólio do trabalho híbrido, incorporado à plataforma Infinity ao lado do Quantum (rede) e da compra da Cyberint, de inteligência de ameaças, em 2024 (cerca de US$ 186 milhões)." },
        { year: 2024, title: "O segundo CEO em trinta e um anos", detail: "Dezembro de 2024: Nadav Zafrir, cofundador da Team8 e ex-comandante da Unit 8200, torna-se apenas o segundo CEO da história da empresa; Gil Shwed passa a Executive Chairman: o inventor do firewall entrega a empresa que construiu.", sourceNote: "Página de liderança da Check Point; anunciado em 24 de julho de 2024." },
      ],
      products: [
        { name: "Quantum", what: "A linhagem de firewalls hoje: gateways da filial à hiperescala, descendentes diretos do FireWall-1." },
        { name: "CloudGuard", what: "Segurança de rede em nuvem e gestão de postura: a herança da Dome9 transformada na família de nuvem." },
        { name: "Harmony", what: "Segurança do espaço de trabalho: endpoint, e-mail (a linhagem Avanan), mobile e SASE (a linhagem Perimeter 81)." },
        { name: "Infinity Platform", what: "A arquitetura unificadora e o cérebro de inteligência de ameaças (ThreatCloud AI) das três famílias." },
      ],
      innovations: [
        { title: "Stateful inspection", detail: "A patente que definiu como os firewalls funcionam: o rastreamento do estado das conexões como a referência contra a qual todo filtro de pacotes foi medido desde então." },
        { title: "A empresa de software de segurança", detail: "A Check Point provou que um fabricante puramente de software podia dominar uma categoria de segurança de rede, e a sua disciplina de lucratividade virou referência para a indústria." },
      ],
      markets: [
        "A Check Point protege mais de 100.000 organizações e compete em segurança de rede, de nuvem e do espaço de trabalho contra Palo Alto Networks, Fortinet e Cisco: a decana do mercado de firewalls que ela criou, vendendo agora a plataforma Infinity, movida a IA.",
      ],
      analyst: [
        "Presença fixa nas avaliações de analistas de firewalls de rede por três décadas, da medição de 40 por cento de participação feita pela IDC em 1996 à era moderna do Magic Quadrant.",
      ],
    },
  },
  // Conversys: record prose only (no profile).
  "conversys": {
    // Name: company kept, subtitle translated.
    name: "Conversys - a infraestrutura e as operações de rede por trás dela",
    tagline: "Integradora brasileira que cobre nuvem híbrida, redes corporativas, SD-WAN e segurança, com centro de operações de rede próprio.",
    intro:
      "A Conversys é uma integradora brasileira cujo catálogo vai da nuvem híbrida e da infraestrutura de borda, passando por redes corporativas e SD-WAN, até segurança, e que opera um centro de operações de rede próprio ao lado da consultoria.",
    // Body paragraphs, same count and order as English.
    body: [
      "O NOC é a parte dessa lista que merece atenção. Vender e instalar infraestrutura é um negócio de projeto, com data para acabar; operá-la é um relacionamento com escala de plantão, caminho de escalonamento e nível de serviço, e as duas coisas exigem empresas diferentes dentro da mesma empresa.",
      "Essa é a transição que a maior parte das integradoras brasileiras deste porte precisou fazer, porque os clientes deixaram de querer um sistema entregue e passaram a querer um que continue funcionando, e o segundo se compra de quem atende o telefone às três da manhã.",
    ],
  },
  // CrowdStrike: record prose and the complete profile.
  "crowdstrike": {
    // Name has no subtitle: kept verbatim so the record reports complete.
    name: "CrowdStrike",
    // Card line and page intro.
    tagline: "Construída sobre o argumento de que se deve caçar o atacante, não o malware; depois provou, numa só manhã, o que realmente significa ter um agente leve em todo lugar.",
    intro:
      "A CrowdStrike foi constituída em 7 de novembro de 2011 por George Kurtz, Dmitri Alperovitch e Gregg Marston. Kurtz tinha sido chief technology officer da McAfee, para quem vendera a empresa anterior, a Foundstone, em 2004. Pediu demissão, passou uma temporada como entrepreneur in residence na Warburg Pincus e saiu de lá com um cheque de US$ 26 milhões para construir aquilo que achava que a McAfee não conseguiria.",
    // Body paragraphs, same count and order as English.
    body: [
      "O argumento de fundação era específico, não promocional. O antivírus baseado em assinaturas pergunta \"já vi este arquivo antes?\", o que só tem resposta para ataques que já aconteceram em outro lugar, e a varredura que ele exige é pesada a ponto de os usuários a desligarem. Alperovitch tinha atribuído as invasões da Operation Aurora, de 2009, a atores chineses quando estava na McAfee, e a lição que os dois fundadores tiraram foi que a pergunta interessante não é qual malware está presente, e sim qual adversário está operando; e adversários repetem comportamentos mesmo quando trocam de ferramentas.",
      "Assim, o Falcon, lançado em 2013, inverteu o modelo: um agente deliberadamente leve que transmite telemetria para uma nuvem onde o comportamento é correlacionado entre todos os clientes ao mesmo tempo. Uma organização que vê algo estranho vira todas as organizações sabendo disso. É um produto realmente diferente de um scanner local, e é por isso que a empresa cresceu tão rápido.",
      "As investigações fizeram o nome. A Sony Pictures em 2014, as invasões do Democratic National Committee em 2015 e 2016: um trabalho que pôs uma empresa privada no meio de uma discussão política nacional, posição que nenhum fabricante de segurança tinha ocupado antes.",
      "Então, em 19 de julho de 2024, às 04h09 UTC, uma atualização de configuração defeituosa do sensor Falcon derrubou cerca de 8,5 milhões de máquinas Windows, segundo as estimativas, e as deixou incapazes de reiniciar. Companhias aéreas, hospitais, bancos, emissoras e terminais de pagamento pararam. É descrita em geral como a maior pane de TI da história, com prejuízos estimados perto de US$ 10 bilhões, e gerou processos cruzados entre a CrowdStrike e a Delta Air Lines.",
      "A parte incômoda é que a pane não foi tanto uma falha da arquitetura quanto a sua conclusão lógica. Um agente leve com acesso ao kernel em milhões de máquinas, atualizado de forma central e rápida, é exatamente o que fazia o modelo de detecção funcionar, e exatamente o que tornou global um único arquivo ruim antes que alguém pudesse intervir. Cada propriedade que tornava o produto bom tornou a falha grande. Vale entender essa troca antes de implantar qualquer coisa com o mesmo formato, o que inclui a maior parte da segurança moderna.",
    ],
    // Complete translated profile; years, company and founders unchanged.
    profile: {
      slug: "crowdstrike",
      foundings: [
        {
          company: "CrowdStrike",
          year: 2011,
          place: "Sunnyvale, Califórnia",
          founders: ["George Kurtz", "Dmitri Alperovitch", "Gregg Marston"],
          story:
            "Constituída em 7 de novembro. Kurtz tinha sido chief technology officer da McAfee, que comprara a empresa anterior dele, a Foundstone; Alperovitch tinha dirigido a pesquisa de ameaças lá. A tese de fundação era que a indústria fazia a pergunta errada (identificar arquivos maliciosos em vez de identificar as pessoas que os enviam) e que um adversário que troca de ferramentas continua reconhecível pela forma como trabalha.",
        },
      ],
      timeline: [
        { year: 2011, title: "Fundação", detail: "Por dois executivos da McAfee e um cofundador vindo da Foundstone, com o argumento de que atribuição e comportamento importam mais do que assinaturas de arquivos." },
        { year: 2013, title: "Sai o Falcon", detail: "Um sensor deliberadamente leve que transmite telemetria para uma nuvem onde o comportamento é correlacionado entre todos os clientes ao mesmo tempo, em vez de um agente pesado tomando decisões locais a partir de uma base local." },
        { year: 2014, title: "Sony Pictures", detail: "A investigação que fez o nome, seguida pelas invasões do Democratic National Committee em 2015 e 2016." },
        { year: 2019, title: "Listagem na NASDAQ", detail: "Listada em junho, avaliada em cerca de US$ 14 bilhões, subiu mais de 70% no primeiro dia." },
        { year: 2022, title: "A Humio vira LogScale", detail: "A plataforma de logs comprada em 2021 virou a base de um produto de SIEM, pondo a empresa em concorrência direta com os incumbentes, inclusive a Splunk, que aparece em outro ponto desta linha do tempo e foi ela mesma comprada pela Cisco dois anos depois." },
        { year: 2024, title: "19 de julho, e o S&P 500", detail: "Uma atualização de configuração defeituosa do sensor tirou do ar, numa manhã, cerca de 8,5 milhões de máquinas Windows, segundo as estimativas. A empresa entrou no S&P 500 no mesmo ano. As avaliações de analistas desde então trataram o evento como um sério problema de confiança que não alterou a posição técnica do produto, uma distinção que vale guardar, porque as duas coisas são de fato separáveis.", sourceNote: "A pane é discutida em seus próprios termos na entrada acima; esta linha do tempo a registra, junto com a leitura dos analistas, sem repetir aquele argumento." },
        { year: 2026, title: "Sétima liderança consecutiva no EPP do Gartner", detail: "Apontada como Leader pela sétima vez seguida, depois de ter sido posicionada mais à direita em completude de visão em três avaliações consecutivas." },
      ],
      products: [
        { name: "Sensor Falcon", what: "Um único agente leve que carrega todos os módulos, sem infraestrutura local por trás. A arquitetura de agente único é a decisão de plataforma da qual tudo o mais depende, e o motivo de uma atualização ruim chegar a todo lugar ao mesmo tempo." },
        { name: "Falcon Insight", what: "O componente de endpoint detection and response, e a parte mais comparada com os concorrentes em avaliações independentes." },
        { name: "Falcon OverWatch e Falcon Complete", what: "Threat hunting gerenciado e managed detection and response: analistas humanos trabalhando sobre a mesma telemetria, vendidos como serviço. O reconhecimento de que a detecção automatizada tem um teto." },
        { name: "Falcon Identity Protection", what: "Cobertura do caminho de ataque por identidade, do acesso inicial à escalada de privilégios e ao movimento lateral, com receita recorrente anual informada acima de US$ 520 milhões e crescendo mais rápido do que a plataforma como um todo." },
        { name: "Falcon Next-Gen SIEM", what: "Construído sobre o LogScale, a plataforma comprada como Humio, e posicionado explicitamente como substituto dos SIEMs incumbentes, não como complemento." },
        { name: "Charlotte AI", what: "Consultas em linguagem natural sobre a telemetria do Falcon, estendidas para triagem e resposta agênticas: o assistente do analista virando substituto do analista no primeiro nível do trabalho." },
        { name: "Falcon Data Replicator", what: "Exportação da telemetria bruta para os sistemas do próprio cliente, o que merece nota ao lado do produto de SIEM: a plataforma vende a sua análise e também entrega os dados para que sejam analisados em outro lugar." },
      ],
      innovations: [
        { title: "A nuvem como ponto de correlação", detail: "A qualidade da detecção melhora com o número de sensores reportando, porque um comportamento que parece banal num cliente é reconhecível entre milhares. Isso faz da base instalada um ativo, não um passivo, e é por isso que é difícil entrar tarde nesse modelo." },
        { title: "O rastreamento de adversários como produto", detail: "Nomear e traçar o perfil de grupos (as ferramentas, os horários, os hábitos) transforma inteligência em algo sobre o qual o cliente pode agir antes de um incidente, e não depois. Também levou uma empresa comercial à atribuição pública, que antes era assunto de governos." },
        { title: "Consolidação em um único agente", detail: "Trinta e poucos módulos entregues por um único sensor atacam um problema operacional real, já que cada agente adicional num endpoint custa desempenho, compatibilidade e administração. A troca é a concentração: um agente é uma dependência, e julho de 2024 é o que isso custa num dia ruim." },
        { title: "Vender os analistas junto com o software", detail: "OverWatch e Complete existem porque a maioria das organizações não consegue manter equipe num centro de operações de segurança 24 horas por dia. Empacotar especialização como assinatura é hoje normal, e esta empresa fez muito para que fosse assim." },
      ],
      markets: [
        "Informa mais de 400 milhões de endpoints protegidos em mais de 30.000 clientes, com vendas que vão de planos para pequenas empresas até contratos corporativos de seis dígitos por ano. O licenciamento flexível (comprar créditos de plataforma em vez de módulos avulsos) chegou a US$ 1,69 bilhão de receita recorrente anual, um sinal de demanda sobre como os clientes querem consolidar.",
        "Os concorrentes hoje estão em três categorias ao mesmo tempo: fabricantes dedicados de endpoint, as suítes de segurança de plataforma e a Microsoft, que entrega um produto concorrente junto com o sistema operacional. A entrada em SIEM acrescentou uma quarta frente, contra incumbentes com décadas de base instalada.",
      ],
      analyst: [
        "Leader no Magic Quadrant de endpoint protection do Gartner em sete avaliações consecutivas, posicionada mais à direita em completude de visão nas três últimas, e Leader no primeiro Magic Quadrant de tecnologias de inteligência de ciberameaças.",
        "Em SIEM, é posicionada como Visionary, não como Leader, o que é a leitura honesta de uma entrante mais nova diante de plataformas estabelecidas há muito tempo, e vale dizer isso em vez de arredondar para cima.",
        "A pane de 2024 é tratada na cobertura dos analistas como um evento de confiança, não de capacidade: preocupação significativa dos clientes, nenhuma mudança na avaliação do produto. Se essa separação se sustenta é uma questão comercial, não técnica.",
      ],
    },
  },
  // Crypto AG: record prose only (no profile).
  "crypto-ag": {
    // Name: company kept, subtitle translated.
    name: "Crypto AG - quando o fabricante era o adversário",
    tagline: "O caso-limite de todo argumento sobre cadeia de suprimentos: os serviços de inteligência não plantaram um backdoor, eram donos da empresa.",
    intro:
      "A Crypto AG era uma fabricante suíça de máquinas de cifra, fundada em 1952 e usada por mais de 120 governos, que pertencia secretamente à CIA e ao BND da Alemanha Ocidental.",
    // Body paragraphs, same count and order as English.
    body: [
      "Todo argumento deste catálogo sobre se um fornecedor merece confiança tem um caso-limite, e é este. A Crypto AG era uma fabricante suíça de máquinas de cifra, fundada em 1952 e vendida a mais de 120 governos. No mais tardar a partir de 1970, pertencia à CIA americana e ao BND da Alemanha Ocidental, o que não é uma história sobre um backdoor inserido no produto de outra pessoa. Os serviços de inteligência eram a empresa.",
      "O programa tinha o codinome Thesaurus e, mais tarde, Rubicon; a própria firma era Minerva. Funcionou por décadas e só foi revelado em fevereiro de 2020, quando o Washington Post e a emissora alemã ZDF obtiveram a história classificada que a própria CIA escreveu sobre ele. Essa história chamava a operação de golpe de inteligência do século.",
      "O ponto estrutural é o que deve ficar com o leitor, e é pior do que parece à primeira vista. Os clientes eram autosselecionados por se importarem com segurança. Um governo comprava esse equipamento justamente porque queria proteger os seus diplomatas e os seus soldados, de modo que o próprio ato de buscar proteção é o que o colocava sob vigilância. Compradores que não se importavam não eram afetados. A diligência era a vulnerabilidade.",
      "Para esta região, o registro é específico, não abstrato. O material desclassificado publicado junto com as reportagens mostra que as máquinas transportavam as comunicações de governos latino-americanos, entre eles os regimes da Operação Condor no Chile, na Argentina e no Uruguai, enquanto esses regimes conduziam repressão além das fronteiras. O Washington Post observou que as histórias das agências evitam em grande parte o que os Estados Unidos sabiam disso, e o que fizeram ou deixaram de fazer a respeito. É nessa lacuna do registro que o relato precisa parar, porque nada publicado até agora a fecha.",
      "Dois detalhes adicionais importam para entender como arranjos assim sobrevivem. Autoridades suíças parecem ter sabido por décadas e só agiram quando a exposição se tornou certa, e os lucros da venda das máquinas voltavam para os serviços que eram donos da empresa. Uma operação dessa duração não se sustenta só com segredo; sustenta-se com o número de pessoas cujos interesses são atendidos por não perguntar.",
      "Nada disso estabelece que algum fabricante específico hoje esteja comprometido. O que estabelece é que a pergunta é legítima, não paranoica, e que vale simetricamente para todo fornecedor sob qualquer governo. Durante a maior parte da vida profissional da maioria das pessoas desta indústria, o maior caso registrado de fabricante comprometido simplesmente não estava registrado, o que vale lembrar antes que alguém fale com confiança sobre os casos que continuam desconhecidos.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A Crypto AG foi desmembrada em fevereiro de 2018, e entre as empresas sucessoras estão a CyOne Security AG e a Crypto International AG, segundo a delegação de fiscalização do parlamento suíço.",
  },
  // CyberArk: record prose, ending note, successor label and the complete profile.
  "cyberark": {
    // Name has no subtitle: kept verbatim so the record reports complete.
    name: "CyberArk",
    // Card line and page intro.
    tagline: "Acesso privilegiado e segurança de identidade.",
    intro:
      "A CyberArk definiu a categoria de privileged access management: guardar em cofre, rotacionar e intermediar as credenciais e os segredos que guardam as chaves de todo o resto, estendida com o tempo para uma plataforma completa de segurança de identidade.",
    // Body paragraphs, same count and order as English.
    body: [
      "A Red Education ministra a trilha oficial de treinamento da CyberArk, com cursos de administração de PAM em turmas abertas nas agendas de Australásia, SAARC e ASEAN e disponíveis sob demanda para as outras regiões.",
      "Fundada em 1999 em Israel por Udi Mokady e Alon Cohen, a CyberArk abriu o capital na NASDAQ em 2014 e virou o fabricante de referência que os auditores citam quando dizem acesso privilegiado. Em 11 de fevereiro de 2026, passou a fazer parte da Palo Alto Networks na maior aquisição de segurança já registrada, uma combinação que a página de história da Palo Alto Networks neste site cobre do lado da compradora.",
      "Em maio de 2026, a plataforma foi relançada como Idira by Palo Alto Networks, estendendo o acesso privilegiado a identidades de máquina e agentes de IA; as páginas do próprio fabricante resumem em quatro palavras, CyberArk, now Idira, e cyberark.com redireciona para elas. O nome CyberArk continua neste registro porque é o nome sob o qual o trabalho de 2020 foi feito.",
    ],
    // Ending note (the year stays in the English record).
    endedNote:
      "Adquirida pela Palo Alto Networks, operação concluída em 11 de fevereiro de 2026 (US$ 45,00 em dinheiro e 2,2005 ações da Palo Alto Networks por ação da CyberArk); a marca virou Idira by Palo Alto Networks em maio de 2026.",
    // Successor link label (the URL stays in the English record).
    successorLabel: "Idira by Palo Alto Networks (antes CyberArk)",
    // Complete translated profile; years, company and founders unchanged.
    profile: {
      slug: "cyberark",
      foundings: [
        {
          company: "CyberArk",
          year: 1999,
          place: "Petah Tikva, Israel",
          founders: ["Udi Mokady", "Alon Cohen"],
          story:
            "A CyberArk começou com um cofre. A tecnologia de cofre digital de Alon Cohen (um repositório isolado e endurecido para as credenciais que ninguém deveria mandar por e-mail) deu a Udi Mokady a base para uma empresa construída sobre uma percepção fora de moda: a conta mais perigosa de qualquer rede é a do administrador. Por uma década, 'privileged access management' foi um nicho; depois, toda análise post-mortem de grande vazamento passou a começar com uma credencial privilegiada roubada, e a CyberArk se viu como o fabricante que definia uma categoria da qual a indústria inteira de repente precisava.",
        },
      ],
      timeline: [
        { year: 1999, title: "O cofre digital", detail: "Fundada em Israel em torno de uma tecnologia de cofre para segredos e credenciais privilegiadas: isolamento de sessão, rotação de credenciais e a trilha de auditoria das contas que podem fazer tudo." },
        { year: 2014, title: "IPO: CYBR", detail: "A CyberArk é listada na Nasdaq como porta-estandarte da categoria de privileged access management, na esteira da era pós-vazamentos em que credenciais de administrador roubadas encabeçam todo relatório de incidente." },
        { year: 2017, title: "Segredos para máquinas", detail: "A aquisição da Conjur estende o cofre ao DevOps: gestão de segredos para aplicações, containers e pipelines de CI/CD; o privilégio nunca foi só humano." },
        { year: 2020, title: "Identidade além do privilégio", detail: "A Idaptive (cerca de US$ 70 milhões) acrescenta gestão de acesso da força de trabalho e SSO, iniciando a ampliação do PAM para uma plataforma completa de segurança de identidade." },
        { year: 2024, title: "Venafi: a aposta na identidade de máquina", detail: "A aquisição da Venafi, por cerca de US$ 1,54 bilhão, acrescenta gestão de certificados e de identidades de máquina em escala; a essa altura, as máquinas superam muitas vezes as identidades humanas, e a CyberArk se move para dominar os dois lados.", sourceNote: "Anunciada em maio de 2024; concluída em outubro de 2024." },
        { year: 2026, title: "A saída de US$ 25 bilhões", detail: "11 de fevereiro de 2026: a Palo Alto Networks conclui a aquisição da CyberArk (US$ 45,00 em dinheiro mais 2,2005 ações PANW por ação, cerca de US$ 25 bilhões, o maior negócio da história da indústria de segurança), tornando a identidade o terceiro pilar da plataforma da Palo Alto, ao lado da segurança de rede e do SOC.", sourceNote: "PAN 10-K FY2025 (termos); fechamento conforme os comunicados das empresas, 11 de fevereiro de 2026." },
      ],
      products: [
        { name: "Privileged Access Manager", what: "O carro-chefe: cofre, isolamento e gravação de sessões, e rotação para as contas que guardam as chaves." },
        { name: "Secrets Manager (Conjur)", what: "Segredos de máquinas e aplicações para pipelines de DevOps, containers e workloads em nuvem." },
        { name: "Venafi machine identity", what: "Ciclo de vida de certificados e gestão de identidades de máquina: a contribuição em escala de TLS da aquisição de 2024." },
        { name: "Identity Security Platform", what: "O guarda-chuva que abrange acesso da força de trabalho, privilégio no endpoint e permissões em nuvem, agora sendo incorporado ao Cortex e ao Strata da Palo Alto." },
      ],
      innovations: [
        { title: "O acesso privilegiado como categoria", detail: "A CyberArk não entrou no mercado de PAM; ela era, em grande medida, o mercado de PAM, e definiu o padrão guardar-isolar-rotacionar-gravar em torno do qual os analistas depois desenharam a categoria." },
        { title: "Toda identidade, inclusive as máquinas", detail: "Os arcos da Conjur e da Venafi estenderam o 'privilégio' dos administradores para workloads e certificados: o enquadramento pelo qual a Palo Alto pagou US$ 25 bilhões, enquanto os agentes de IA multiplicam ainda mais as identidades." },
      ],
      markets: [
        "O fabricante de referência em acesso privilegiado e um líder em segurança de identidade, atendendo a maioria das maiores empresas do mundo; desde fevereiro de 2026, opera dentro da Palo Alto Networks como o seu pilar de identidade.",
      ],
      analyst: [
        "Leader constante nas avaliações de analistas de privileged access management desde as primeiras edições da categoria: a posição que emoldurou a aquisição de 2026.",
      ],
    },
  },
  // Cyble: record prose only (no profile).
  "cyble": {
    // Name: company kept, subtitle translated.
    name: "Cyble - vendendo o que também dá de graça",
    tagline: "Empresa de threat intelligence que cobre monitoramento da dark web, attack surface management e takedowns.",
    intro:
      "A Cyble é uma empresa de threat intelligence cuja plataforma cobre inteligência de ciberameaças, monitoramento da dark web, attack surface management, proteção de marca e serviços de takedown, com um laboratório de pesquisa que publica relatórios regionais sobre o cenário de ameaças.",
    // Body paragraphs, same count and order as English.
    body: [
      "Ela ilustra algo estrutural desta categoria, mais do que algo exclusivo dela. Threat intelligence não pode ser demonstrada como um firewall: o produto é uma afirmação sobre o que o fabricante sabe, e um comprador em potencial não tem como testar essa afirmação de fora. Por isso as empresas do setor publicam (relatórios de pesquisa, perfis de agentes de ameaça e, neste caso, um veículo de notícias próprio) e oferecem de graça ferramentas de consulta que respondem a uma única pergunta contra os mesmos dados sobre os quais roda o produto pago.",
      "Vale entender esse arranjo antes de ler a pesquisa de ameaças de qualquer fabricante, inclusive a dos bons. A publicação é trabalho genuíno e também é a demonstração, e as duas coisas são verdadeiras ao mesmo tempo.",
      "A lista de serviços também é um mapa de para onde o trabalho de segurança se deslocou. Ao lado dos feeds de inteligência esperados ficam proteção de marca, monitoramento de executivos, e takedown e disrupção: conseguir a remoção de domínios fraudulentos e de contas que se passam por outras. Isso está mais perto da fiscalização do que da engenharia, e hoje é vendido ao lado dos produtos técnicos na mesma plataforma.",
    ],
  },
  // Datadog: record prose only (no profile).
  "datadog": {
    // Name has no subtitle: kept verbatim so the record reports complete.
    name: "Datadog",
    // Card line and page intro.
    tagline: "O problema de fundação eram duas equipes olhando para dados diferentes durante a mesma pane.",
    intro:
      "Olivier Pomel e Alexis Lê-Quôc se conheceram como estudantes na École Centrale Paris e depois trabalharam juntos por nove anos na Wireless Generation, uma empresa de software educacional. Quando a News Corp a comprou, em 2010, os dois saíram e fundaram a Datadog em Nova York. Em 2025, ela faturava US$ 3,43 bilhões, com cerca de 8.100 funcionários.",
    // Body paragraphs, same count and order as English.
    body: [
      "O problema que eles se propuseram a resolver era organizacional, não técnico, e essa é a entrada inteira. Na Wireless Generation, viram desenvolvedores e pessoal de operações trabalharem com dados diferentes e incompatíveis durante incidentes, cada lado convencido de que a culpa era do outro, cada um com evidências que o outro não conseguia ver. O jogo de empurra não era falta de boa vontade. Era o resultado previsível de duas equipes olhando para instrumentos diferentes e descrevendo o mesmo evento em termos incompatíveis.",
      "Então a percepção de fundação do produto não é um recurso de monitoramento. É que uma discussão sobre o que está acontecendo não pode ser resolvida enquanto as partes têm dados diferentes, e que uma visão compartilhada encerra a discussão não por resolvê-la, mas por remover a ambiguidade que a alimentava. Tudo na plataforma decorre disso: um único painel cobrindo infraestrutura, aplicações, logs, rede e experiência do usuário, porque no momento em que qualquer um desses vive numa ferramenta separada, com login separado, a velha discussão volta a estar disponível.",
      "Lidas ao lado das outras duas empresas de observabilidade desta linha do tempo, as três chegaram ao mesmo destino por três direções diferentes, e a diferença de ponto de partida ainda aparece naquilo em que cada uma é melhor. A Dynatrace veio de dentro da aplicação, rastreando uma transação pelo código. A Kentik veio da rede, lendo registros de fluxo e roteamento. A Datadog veio da infraestrutura, monitorando hosts e depois tudo o que estava ligado a eles. Três origens, uma convergência; e elas convergiram porque uma pane não respeita a fronteira entre uma aplicação, um host e uma rede, então qualquer ferramenta que a respeite vai acabar sendo convidada a parar de respeitá-la.",
      "Vale guardar um detalhe sobre um dos fundadores. Pomel é um dos autores originais do player de mídia VLC, o software open source presente em quase todo computador de uma certa época, que tocava o arquivo que nenhum outro tocava. Há uma linha reta entre escrever software que dá conta de entradas malformadas vindas do mundo inteiro e construir uma plataforma que ingere telemetria de todo sistema que uma empresa opera, e não é coincidência que os dois trabalhos sejam, em grande parte, sobre lidar com o que você não esperava.",
      "O modelo comercial é baseado em uso, em mais de vinte produtos, vendidos entrando numa equipe e expandindo para as outras. Esse modelo tem uma tensão estrutural que vale nomear, porque se aplica a todo fabricante de observabilidade, e não só a este: quando a conta cresce com o quanto você instrumenta, o incentivo do cliente é observar menos. Ninguém projeta isso de propósito, e é o custo honesto da infraestrutura medida: você pede ao cliente que pague na proporção do cuidado com que observa, exatamente nos momentos em que observar com cuidado mais importa.",
      "Lançou monitoramento de infraestrutura em 2012, o que a deixou em posição quando os containers chegaram e fizeram o número de coisas dignas de monitoramento crescer uma ordem de grandeza da noite para o dia, e abriu o capital na NASDAQ em setembro de 2019. Também foi construída em Nova York, e não na Califórnia, o que os próprios comentaristas dela observam; é um ponto menor do que parece, exceto pelo fato de que os clientes que precisaram dela primeiro foram bancos e empresas de mídia, e não startups.",
    ],
  },
  // Dell and Force10: record prose and the complete profile.
  "dell-force10": {
    // Name: companies kept, subtitle translated.
    name: "Dell & Force10 - o modelo direto e a sua malha",
    tagline: "Um montador de dormitório virou o fornecedor mais amplo do datacenter, e o pioneiro do 10GbE que ele absorveu em 2011 virou a sua linhagem de switching.",
    intro:
      "O modelo direto de Michael Dell redefiniu como o hardware chega aos compradores; o fechamento de capital em 2013 e a aquisição da EMC em 2016 (o maior negócio de tecnologia da história) reconstruíram a empresa em torno do datacenter. Dentro dela corre a engenharia da Force10: a startup de 1999 cuja E-Series, feita sob medida, entregou 10 Gigabit Ethernet em line rate antes de todo mundo, e cuja linhagem FTOS sobrevive hoje como o sistema operacional de switching da Dell.",
    // Body paragraphs, same count and order as English.
    body: [
      "O perfil cobre a fundação no dormitório em 1984 e o modelo direto, o E1200 e as malhas de HPC da Force10, a aquisição de 2011, o fechamento de capital, o megacontrato com a EMC e o presente do PowerSwitch.",
    ],
    // Complete translated profile; years, companies and founders unchanged.
    profile: {
      slug: "dell-force10",
      foundings: [
        {
          company: "Dell (PC's Limited)",
          year: 1984,
          place: "Austin, Texas",
          founders: ["Michael Dell"],
          story:
            "Michael Dell montava PCs num quarto de dormitório da University of Texas a partir de uma premissa que a indústria considerava de nicho: vender direto, fabricar sob encomenda, deixar o estoque se aproximar de zero. O modelo direto fez da Dell a maior fabricante de PCs do mundo em duas décadas, e o segundo ato foi maior: o fechamento de capital em 2013, a aquisição da EMC em 2016 (o maior negócio de tecnologia da história) e a transformação no fornecedor mais amplo do datacenter: servidores, storage e, por meio de uma aquisição de 2011, a malha de rede entre eles.",
        },
        {
          company: "Force10 Networks",
          year: 1999,
          place: "San Jose, Califórnia",
          founders: ["Som Sikdar and co-founders"],
          story:
            "A Force10 apostou cedo que o 10 Gigabit Ethernet precisaria de switches construídos para ele desde o silício, e não de caixas gigabit com uplinks rápidos. A E-Series de 2002 entregou uma densidade de 10GbE em line rate que ninguém mais oferecia, e os mundos de HPC e de escala web perceberam: malhas Force10 transportavam alguns dos maiores clusters da época. O FTOS, o seu sistema operacional derivado do BSD e com CLI familiar, conquistou o respeito de engenharia que fez a empresa valer a compra inteira.",
        },
      ],
      timeline: [
        { year: 1988, title: "A Dell abre o capital", detail: "A PC's Limited vira Dell Computer Corporation: o modelo direto a caminho da Fortune 500, uma caixa feita sob encomenda de cada vez." },
        { year: 2002, title: "O E1200", detail: "O chassi da Force10 entrega 10 Gigabit Ethernet em line rate com densidades que os incumbentes não conseguem igualar: o switch preferido onde os clusters se medem em milhares de nós." },
        { year: 2011, title: "A Dell compra a malha", detail: "A Dell adquire a Force10 (cerca de US$ 700 milhões, segundo a imprensa): a gigante do modelo direto trazendo as redes para dentro de casa; o FTOS vira Dell Networking OS9, depois OS10, nas séries S e Z.", sourceNote: "Valor do negócio conforme a cobertura da época; os termos não foram divulgados formalmente." },
        { year: 2013, title: "O fechamento de capital", detail: "Michael Dell e a Silver Lake fecham o capital da empresa (cerca de US$ 24,9 bilhões) para reconstruí-la longe do holofote trimestral: o prelúdio da maior aposta." },
        { year: 2016, title: "EMC", detail: "Setembro de 2016: fecha-se a aquisição da EMC, por cerca de US$ 67 bilhões, o maior negócio de tecnologia da história, criando a Dell Technologies: servidores, storage EMC, VMware (participação majoritária, separada em 2021) e o switching herdado da Force10 amarrando tudo.", sourceNote: "Valores do negócio conforme o registro público." },
        { year: 2018, title: "De volta à bolsa, com o datacenter em primeiro lugar", detail: "A Dell volta ao mercado; PowerEdge, PowerStore e PowerSwitch emolduram o portfólio: o montador de dormitório agora é o incumbente em todos os racks que os seus switches interligam." },
      ],
      products: [
        { name: "Servidores PowerEdge", what: "A linha de servidores de volume por baixo de uma parcela enorme das cargas de trabalho do mundo: a descendente do modelo direto no datacenter." },
        { name: "Force10 E/S/Z series (PowerSwitch)", what: "A linhagem de switching do pioneiro do 10GbE, do FTOS ao OS10: a herança de malha de rede da Dell." },
        { name: "Linhas de storage EMC", what: "A herança de 2016 (PowerMax, PowerStore, Data Domain) que fez da Dell a prateleira mais ampla do datacenter." },
      ],
      innovations: [
        { title: "O modelo direto", detail: "Fabricação sob encomenda com capital de giro negativo: a inovação de fundação da Dell foi logística, e redefiniu como o hardware chega aos compradores." },
        { title: "10GbE feito sob medida", detail: "A Force10 provou a lição das gerações de Ethernet: cada nova velocidade recompensa o silício projetado para ele, o padrão que todo debate sobre merchant silicon desde então repete." },
      ],
      markets: [
        "A Dell Technologies hoje lidera ou disputa os mercados de servidores, storage corporativo e switching do campus ao datacenter, com a onda de servidores para IA como o capítulo mais novo do alcance do modelo direto.",
      ],
      analyst: [
        "Uma entrada consolidada de propósito: a história de engenharia da Force10 só se resolve dentro da história de escala da Dell; o pioneiro absorvido, a linhagem do sistema operacional intacta, a aposta no 10GbE confirmada por toda transição de velocidade posterior.",
      ],
    },
  },
  // eEye Digital Security: record prose, ending note and successor label (no profile).
  "eeye-digital-security": {
    // Name: company kept, subtitle translated.
    name: "eEye Digital Security - o Retina, e o buraco por onde entrou o Code Red",
    tagline: "A empresa de Irvine cujos pesquisadores encontraram a falha do IIS que o Code Red explorou em 2001, e cujo scanner Retina acabou dentro da BeyondTrust.",
    intro:
      "A eEye Digital Security foi cofundada em Irvine, Califórnia, em 1998 por Marc Maiffret, e o seu produto era o Retina, a linha de gestão e análise de vulnerabilidades que a BeyondTrust comprou em 2012. O seu lugar no registro é uma divulgação, mais do que um produto: em junho de 2001, a eEye publicou a vulnerabilidade .ida no servidor web da Microsoft que o worm Code Red depois explorou, e o artigo deste site sobre a era dos worms traz o próprio anúncio da eEye sobre ela.",
    // Body paragraphs, same count and order as English.
    body: [
      "O The Register, ao noticiar a venda em maio de 2012, chamou a descoberta do .ida de principal motivo de fama de Maiffret: o buraco que o Code Red, o primeiro grande worm da Microsoft, explorou lá em 2001, e que o produto SecureIIS da eEye foi escrito para corrigir. A equipe que analisou o worm deu a ele o nome do refrigerante que a manteve acordada durante a noite, um detalhe que o artigo deste site sobre a era dos worms guarda pela mesma razão que guarda o buraco: quem encontra a falha e quem escreve o exploit em geral não são as mesmas pessoas, e o registro deve dizer quem foi quem.",
      "Maiffret deixou a empresa em 2007 para um sabático de três anos e voltou em 2010 com o título de Chief Hacking Officer. Os investidores da eEye eram Openview Venture Partners, Bessemer Venture Partners e Insight Venture Partners, e a saída veio em 10 de maio de 2012, quando a BeyondTrust, sediada em Carlsbad e então desenvolvedora de software de segurança e controle de acesso, anunciou a aquisição sem divulgar os termos financeiros. Maiffret tornou-se chief technology officer da empresa combinada.",
      "O registro da BeyondTrust em outro ponto desta linha do tempo conta o que veio depois: a eEye foi uma das três aquisições que deram a uma empresa de gestão de privilégios um scanner de vulnerabilidades e uma equipe de pesquisa ao lado do seu núcleo, antes da combinação com a Bomgar em 2018. O Retina é o produto; a divulgação é o motivo de o nome ainda aparecer.",
    ],
    // Ending note (the year stays in the English record).
    endedNote:
      "Adquirida pela BeyondTrust, então sediada em Carlsbad, Califórnia; anunciada em 10 de maio de 2012, sem divulgação dos termos financeiros. Marc Maiffret tornou-se chief technology officer da BeyondTrust.",
    // Successor link label (the URL stays in the English record).
    successorLabel: "BeyondTrust, que adquiriu a eEye em maio de 2012",
  },
  // Flipside: record prose and the complete profile (foundings and timeline only, as in English).
  "flipside": {
    // Name: organisation kept, subtitle translated.
    name: "Flipside - a organização por trás do Roadsec",
    tagline: "Organizou o evento de segurança que chegou às pessoas que as conferências costumam deixar de fora pelo preço.",
    intro:
      "A Flipside é a organização brasileira por trás do Roadsec, descrito no próprio site como o maior festival hacker da América Latina. O glossário do site já traz o Roadsec como parte do folclore; esta entrada dá nome à organização que o produziu, que é como um evento de comunidade ganha a continuidade para acontecer todo ano.",
    // Body paragraphs, same count and order as English.
    body: [
      "A escolha que distinguia o Roadsec era alcance, não prestígio: ele percorria cidades brasileiras em vez de se concentrar em São Paulo, e cobrava preços pensados para estudantes. Essa combinação decide quem está na sala e, portanto, quem acaba na área uma década depois; é o mesmo argumento que as entradas deste site sobre centros de treinamento e sobre o período da reserva de mercado fazem por outras direções.",
      "O registro público do evento é irregular (o próprio site tinha como data mais recente uma edição passada quando esta entrada foi escrita), e isso fica registrado aqui em vez de alisado, porque o arquivo de uma organização de comunidade costuma ser mais fino do que a sua influência.",
    ],
    // Complete translated profile; years, company and (empty) founders unchanged.
    profile: {
      slug: "flipside",
      foundings: [
        {
          company: "Flipside",
          year: 2007,
          place: "São Paulo, Brasil",
          founders: [],
          story:
            "A Flipside foi registrada em São Paulo em 11 de setembro de 2007 como Flipside Treinamento Editora e Comercio, com treinamento profissional e gerencial como atividade principal registrada. Vale ler o registro ao pé da letra, porque no papel ela não é uma empresa de eventos: é um negócio de treinamento e publicação, e o festival pelo qual ficou conhecida é aquilo em que isso se transformou. Passaram-se seis anos entre o registro e o primeiro Roadsec.",
          sourceNote:
            "Razão social, CNPJ e data de abertura conforme o cadastro da Receita Federal, corroborados pela política de privacidade da própria empresa, que informa a mesma pessoa jurídica e um endereço na Avenida Paulista. Nenhum dos dois publica nomes de fundadores, e nenhum é fornecido aqui.",
        },
      ],
      timeline: [
        { year: 2013, title: "O primeiro Roadsec", detail: "O Roadsec aconteceu pela primeira vez. O nome diz o formato: um evento de segurança que viaja, em vez da conferência de uma cidade para a qual todo mundo precisa voar. Essa escolha é o argumento inteiro, porque quem consegue chegar a um local determina quem está na sala, e quem está na sala determina quem está na área dez anos depois.", sourceNote: "Deduzido do aniversário, e não da cobertura da primeira edição: a edição de São Paulo de 10 de novembro de 2018 foi noticiada como comemoração de cinco anos, o que situa a primeira em 2013. Nenhuma reportagem sobre uma edição de 2013 foi localizada diretamente." },
        { year: 2016, title: "Dezessete cidades, dez mil pessoas", detail: "A turnê de 2016 passou por dezessete cidades e reuniu mais de dez mil participantes ao longo da temporada. Uma única grande conferência pode reivindicar uma sala maior; não pode reivindicar dezessete cidades, e a diferença é exatamente o ponto da entrada sobre alcance em vez de prestígio." },
        { year: 2017, title: "Vinte e uma cidades, as cinco regiões e uma viagem à DEF CON", detail: "A temporada de 2017 começou em 18 de fevereiro e cobriu vinte e uma cidades nas cinco regiões brasileiras. As paradas individuais eram pequenas para os padrões de conferência, com o Rio de Janeiro projetado em cerca de quatrocentas pessoas, o que é o formato do modelo, não uma deficiência: muitas salas modestas em muitos lugares em vez de uma grande em São Paulo. Em paralelo corria o Hackaflag, noticiado como a maior competição de capture-the-flag do país, cujo vencedor anterior tinha sido enviado à DEF CON, em Las Vegas, com despesas pagas. Para um estudante de uma cidade sem indústria de segurança, isso é uma carreira tornada visível." },
        { year: 2018, title: "Cinco anos, e a competição ganha empresa própria", detail: "A mega edição de São Paulo, em 10 de novembro de 2018, marcou cinco anos e reuniu mais de cinco mil pessoas, com finalistas da competição vindos de onze estados. Onze estados é o número que mostra a turnê funcionando: a final foi em São Paulo, mas o funil que levava até ela não. Duas semanas antes, em 31 de outubro, a Hackaflag Tecnologia em Informatica tinha sido registrada como empresa própria, vários anos depois de a competição que lhe dá nome ter começado.", sourceNote: "O público de 5.000 se refere àquela única noite em São Paulo e não é comparável aos 10.000 registrados em toda a temporada de 2016. Anderson Ramos é descrito na cobertura desse período como CTO da Flipside e criador do Hackaflag, enquanto o site posterior do próprio Roadsec o apresenta como CEO; os dois títulos estão no registro e nenhum é preferido aqui." },
      ],
    },
  },
  // Fluke: record prose and the complete profile.
  "fluke": {
    // Parent note (official.parent.note), added 26/10/2026 with the parents apply; name, slug and year stay English facts.
    parentNote: "A Fluke Networks é uma das empresas Fluke dentro da Fortive, que se separou da Danaher em 2 de julho de 2016.",
    // Name: company kept, subtitle translated.
    name: "Fluke - os multímetros e certificadores em toda bolsa de campo",
    tagline: "O multímetro 87 e o DSX CableAnalyzer, e uma divisão em três de 2015 (Fortive, NetScout, NetAlly) que vale saber de cor.",
    intro:
      "A empresa de instrumentos que John Fluke Sr. fundou em 1948 virou a palavra genérica para o próprio multímetro, e a Fluke Networks fez da certificação de cabeamento uma categoria de instrumento com peso jurídico. O negócio da Danaher em 2015 dividiu a história: a visibilidade corporativa foi para a NetScout (a linha de portáteis depois renasceu como NetAlly), enquanto a certificação de cabos continuou Fluke Networks, sob a Fortive: uma empresa, três casas atuais.",
    // Body paragraphs, same count and order as English.
    body: [
      "John Fluke e David Packard eram amigos e dividiam moradia quando os dois trabalhavam na General Electric. Um deles foi cofundador da Hewlett-Packard; o outro abriu uma empresa de instrumentos num porão em Connecticut em 1948, e as duas firmas competiram depois em teste e medição por décadas, com a Fluke na liderança em calibração.",
      "O primeiro produto foi um medidor que lia tensão, corrente e potência ao mesmo tempo, e o que mudou o ofício foi o 8020A, de 1977: um multímetro digital que cabia na mão, com display de cristal líquido e um chip conversor feito sob medida dentro dele. A instrumentação saiu da bancada e foi para a bolsa, e esse é todo o motivo de um medidor com esse nome estar nas mãos de pessoas que nunca ouviram falar da empresa que o fabricou.",
      "A metade de redes faz uma coisa que o artigo da família sobre teste e medição descreve com exatidão: produz um número que outra pessoa preferiria não ouvir. Um certificador de cabos emite um veredito contra uma norma publicada (Category 6A, Class EA, ANSI/TIA-1152-A), e esse veredito decide se uma instalação é aceita e se um instalador recebe. O instrumento não está medindo por curiosidade. Está resolvendo uma questão comercial, e as duas partes concordaram de antemão em se submeter a ela.",
      "É por isso que as condições importam mais do que a leitura, e é por isso que equipamentos de certificação são calibrados, datados e rastreáveis de um jeito que as ferramentas de campo comuns não são. Um número sem a sua procedência não resolve nada. A entrada do catálogo sobre a RFC 2544 faz o mesmo argumento sobre benchmarking: o resultado são as condições, não o número.",
      "A história corporativa é uma lição sobre como empresas de instrumentos acabam tendo dono. Uma joint venture com a Philips produziu o ScopeMeter em 1987 e virou uma compra integral em 1993; a Danaher comprou a empresa inteira em 1998; a Fortive foi separada da Danaher em 2016 com a Fluke dentro dela. Os instrumentos de medição sobreviveram a vários dos arranjos que foram donos deles.",
      "Um pequeno fato para o registro: fluke.com foi registrado em outubro de 1986, entre os trinta primeiros domínios .com existentes. Uma fabricante de instrumentos de Everett, Washington, estava na internet comercial antes de quase qualquer um ter motivo para estar.",
    ],
    // Complete translated profile; years, company and founders unchanged.
    profile: {
      slug: "fluke",
      foundings: [
        {
          company: "John Fluke Manufacturing Company",
          year: 1948,
          place: "Estado de Washington, Estados Unidos",
          founders: ["John Fluke Sr."],
          story:
            "John Fluke Sr., engenheiro da Marinha formado pelo MIT que tinha dividido moradia com David Packard, transformou a medição elétrica de precisão numa empresa cujo nome virou o termo genérico para o próprio instrumento: até hoje, engenheiros de campo 'grab the Fluke' (pegam o Fluke), seja qual for a marca no rótulo. O robusto multímetro 87 (1988) é o arquétipo (à prova de quedas, confiável, amarelo), e a linhagem da Fluke Networks levou o mesmo DNA ao cabeamento: se um link está certificado, em algum lugar um testador Fluke assinou por ele.",
        },
      ],
      timeline: [
        { year: 1988, title: "O Fluke 87", detail: "O robusto multímetro true-RMS vira O medidor: o instrumento padrão do mundo industrial, ainda em produção décadas depois, a encarnação física de 'measurement you can bet on' (medição em que se pode apostar)." },
        { year: 1993, title: "Rumo à planta de cabos", detail: "Os analisadores de cabos da série DSP da Fluke levam medição de nível laboratorial à certificação de cabeamento estruturado (aprovado/reprovado contra as normas TIA/ISO, com prova impressa incluída): a categoria que a Fluke Networks vem a dominar." },
        { year: 1998, title: "Danaher", detail: "A Danaher adquire a Fluke (cerca de US$ 625 milhões): a casa de instrumentos entra no conglomerado cujos movimentos de portfólio depois dividirão a história da Fluke Networks ao meio.", sourceNote: "Valor do negócio conforme o registro público." },
        { year: 2009, title: "AirMagnet", detail: "A Fluke Networks adquire a AirMagnet, líder em análise de Wi-Fi: espectro e troubleshooting de WLAN entram na bolsa de campo ao lado da certificação de cobre e fibra." },
        { year: 2015, title: "A divisão: leia com atenção", detail: "A Danaher vende os seus negócios de comunicações para a NetScout (cerca de US$ 2,3 bilhões): as linhas de visibilidade CORPORATIVA da Fluke Networks (OptiView, Visual TruView, AirMagnet) vão junto. O negócio de certificação de cabos NÃO vai: DSX CableAnalyzer, OptiFiber e a franquia de certificação continuam Fluke Networks. A linha de teste de rede portátil (LinkRunner, AirCheck) depois também sai da NetScout: vendida em 2018 e renascida como NetAlly em 2019.", sourceNote: "Estrutura da transação conforme o registro público; a separação da NetAlly foi concluída em 2019." },
        { year: 2016, title: "Fortive", detail: "A Danaher se divide; a Fluke e a Fluke Networks vão para a nova Fortive, onde continuam os medidores amarelos e os certificadores DSX, os instrumentos padrão dos ofícios a que este site serve." },
      ],
      products: [
        { name: "Fluke 87 (e a linha de medidores)", what: "O multímetro de referência: o instrumento do qual 'Fluke' virou a palavra genérica." },
        { name: "DSX CableAnalyzer / OptiFiber", what: "O padrão de certificação de cabeamento estruturado e de fibra: o testador cujo relatório encerra instalações no mundo todo." },
        { name: "Herança LinkRunner / AirCheck", what: "A linha de teste portátil de rede e Wi-Fi nascida na Fluke Networks, continuada hoje pela NetAlly." },
      ],
      innovations: [
        { title: "A certificação como produto", detail: "A Fluke Networks transformou 'does this link meet spec' (este link atende à especificação?) numa categoria de instrumento com peso jurídico: o relatório de certificação impresso é a certidão de nascimento da planta de cabos." },
        { title: "A robustez como especificação", detail: "O projeto do 87, à prova de quedas e com classificação CAT, fez da capacidade de sobreviver parte da precisão: a filosofia de instrumento de campo que toda ferramenta robustecida desde então herda." },
      ],
      markets: [
        "A Fluke (Fortive) continua a referência em teste elétrico; a Fluke Networks domina a certificação de cabeamento; os ramos de visibilidade e de portáteis seguem na NetScout e na NetAlly: uma empresa de 1948, três casas atuais.",
      ],
      analyst: [
        "A entrada de pioneiro mais próxima das mãos de fato dos leitores deste site: o medidor na bancada e o certificador na bolsa; e a divisão em três de 2015 vale saber de cor, porque 'which Fluke' (qual Fluke) é uma pergunta real de compras.",
      ],
    },
  },
  // Google (google-search): record prose and the complete profile (no foundings, as in English).
  "google-search": {
    // Parent note (official.parent.note), added 26/10/2026 with the parents apply; name, slug and year stay English facts.
    parentNote: "A Google LLC é subsidiária da Alphabet Inc., a holding criada na reorganização de 2015.",
    // Name has no subtitle: kept verbatim so the record reports complete.
    name: "Google",
    // Card line and page intro.
    tagline: "Ordenou as páginas por quem apontava para elas, e não por quantas vezes diziam a palavra; e quase foi vendido à AltaVista por um milhão de dólares.",
    intro:
      "Larry Page e Sergey Brin se conheceram em Stanford em 1995 e, em janeiro de 1996, começaram um projeto de pesquisa chamado BackRub, que analisava quais páginas apontavam para quais. A percepção era que um link é um voto, e que votos de páginas muito citadas deveriam valer mais. Chamaram o algoritmo resultante de PageRank.",
    // Body paragraphs, same count and order as English.
    body: [
      "Os buscadores da época ordenavam os resultados, em grande parte, por quantas vezes um termo de busca aparecia numa página, algo trivialmente fácil de manipular e que estava sendo manipulado em larga escala. O PageRank media algo que o próprio autor da página não controla: quem mais achava que ela merecia um link.",
      "Em 1998, Page e Brin tentaram vender o PageRank à AltaVista por US$ 1 milhão, com a intenção de voltar aos estudos. A AltaVista não comprou. Eles registraram google.com em 15 de setembro de 1997 (o nome é uma grafia errada de googol, o dígito um seguido de cem zeros) e constituíram a Google Inc. em 4 de setembro de 1998, na garagem de uma pessoa amiga em Menlo Park.",
      "O primeiro cheque veio de Andy Bechtolsheim, cofundador da Sun Microsystems, seguido de US$ 25 milhões da Kleiner Perkins e da Sequoia em 1999. O IPO de 2004 levantou US$ 1,67 bilhão.",
      "A página inicial era deliberadamente despojada enquanto todos os concorrentes viravam portais. Isso foi em parte convicção e em parte circunstância (nenhum dos fundadores era grande autor de HTML), mas chegou exatamente no momento em que a AltaVista e os seus pares estavam acrescentando compras, e-mail e notícias à página de entrada de um buscador.",
      "Uma nota de rodapé que vale guardar: o RankDex, construído por Robin Li em 1996, explorava a ordenação baseada em links num cronograma parecido. Li patenteou esse trabalho e depois fundou o Baidu. O PageRank não foi a única ideia do gênero; foi a que acabou embutida numa empresa que queria ser um buscador.",
    ],
    // Complete translated profile; years unchanged, section counts unchanged.
    profile: {
      slug: "google-search",
      foundings: [],
      timeline: [
        { year: 1997, title: "Três recusas antes da famosa", detail: "Na primavera, eles ofereceram a tecnologia à Excite, à Infoseek e à Lycos e foram recusados pelas três, segundo relatos porque os incentivos não batiam: um buscador que vende publicidade com base em page views não tem motivo óbvio para querer que os visitantes encontrem o que vieram buscar e vão embora." },
        { year: 1998, title: "E a quarta, com um motivo declarado", detail: "A oferta à AltaVista, por um milhão de dólares, foi recusada porque a controladora, a Digital Equipment Corporation, não era receptiva a tecnologia desenvolvida fora de casa. Quatro empresas do ramo de busca receberam a oferta da coisa que acabaria com a sua indústria, e a última delas a recusou por uma questão de princípio sobre de onde as ideias deveriam vir." },
        { year: 1998, title: "Um cheque para uma empresa que não existia", detail: "Os US$ 100.000 de Andy Bechtolsheim foram nominais a uma entidade que ainda não tinha sido constituída. A patente do PageRank foi depositada em 1º de setembro; a empresa foi constituída no dia 4. A essa altura, o serviço atendia dez mil consultas por dia e sobrecarregava a rede de Stanford." },
        { year: 2000, title: "AdWords, e o leilão", detail: "Publicidade vendida por leilão sobre palavras-chave, e não por posicionamento negociado: a invenção que pagou por tudo, e uma ideia comercial maior do que o algoritmo de ordenação sobre o qual se apoia." },
      ],
      products: [
        { name: "O índice e a ordenação", what: "O produto original, ainda o central, hoje construído sobre centenas de sinais, dos quais a análise de links original é apenas o mais antigo." },
        { name: "AdWords e AdSense", what: "O leilão que monetiza a consulta, e a sua extensão para as páginas de outras pessoas. O buscador é o funil; isto é o negócio." },
        { name: "A página limpa", what: "Vale listar como decisão de produto, e não de design. Tudo o que um concorrente acrescentava à página de entrada tirava atenção da caixa de busca, e a caixa era a proposta inteira." },
      ],
      innovations: [
        { title: "Medir o que o autor não controla", detail: "A frequência de palavras-chave é escrita por quem quer aparecer bem posicionado. Os links de entrada são escritos por todos os outros. Levar o sinal da página para a rede ao redor dela é a ideia inteira, e todo sistema de ordenação desde então tem sido uma discussão sobre quais sinais incontroláveis usar em seguida." },
        { title: "Financiado com dinheiro público, enorme no privado", detail: "O protótipo foi desenvolvido com apoio de um programa da National Science Foundation sobre bibliotecas digitais. Dinheiro público de pesquisa produziu o trabalho de ordenação por trás de uma das empresas mais valiosas já construídas, o que vale dizer com todas as letras sempre que surge a questão de quem deve financiar a pesquisa básica." },
        { title: "Vender atenção por leilão", detail: "Antes do AdWords, a publicidade era negociada: um vendedor, uma tabela de preços, um posicionamento. Fazer um leilão para cada consulta definia o preço automaticamente, escalava sem vendedores e deixava o menor anunciante comprar o mesmo inventário que o maior. A ordenação criou a audiência; o leilão é o que a transformou em dinheiro." },
        { title: "Recusar o portal", detail: "Todos os concorrentes concluíram que um buscador era uma porta de entrada e que a porta devia ser decorada. Este concluiu que um buscador é um lugar de onde as pessoas querem sair rápido, e construiu para isso. A página despojada foi em parte, como a entrada acima observa, falta de interesse em escrever HTML; mas foi a resposta certa pelo motivo errado, o que acontece mais vezes do que as histórias admitem." },
      ],
      markets: [
        "Busca geral na web, com cerca de 90% do mercado global em 2025: uma participação contestada nos tribunais, e não no mercado, cuja durabilidade é hoje uma questão jurídica tanto quanto técnica.",
        "Os concorrentes são os outros buscadores gerais, os regionais que dominam os próprios mercados e, cada vez mais, os assistentes e os answer engines que eliminam o clique do qual todo o modelo de negócio depende.",
      ],
      analyst: [
        "Não há avaliação competitiva significativa a oferecer sobre um serviço com nove décimos de um mercado. As avaliações que importam são regulatórias, e estão em andamento em várias jurisdições.",
        "A observação que esta linha do tempo está mais bem posicionada para fazer é sobre as quatro recusas. Excite, Infoseek, Lycos e AltaVista tiveram, cada uma, a chance de comprar o método de ordenação que as desalojou, e cada uma tinha um motivo para não comprar que fazia sentido visto de dentro. Os incumbentes raramente deixam de enxergar uma tecnologia; eles a enxergam e identificam, corretamente, que adotá-la prejudicaria algo que já têm.",
      ],
    },
  },
  // Hewlett-Packard: record prose, ending note, successor label and the aligned acquisitions (no profile).
  "hewlett-packard": {
    // Name: company kept, subtitle translated.
    name: "Hewlett-Packard - a garagem, o HP 9000 e a divisão",
    tagline: "Fundada numa garagem de Palo Alto em 1939; construiu o HP 9000 e o HP-UX, o OpenView e a LaserJet; fundiu-se com a Compaq em 2002 e se dividiu em duas em 2015.",
    intro:
      "A Hewlett-Packard foi fundada por Bill Hewlett e David Packard em 1939, numa garagem para um carro em Palo Alto, Califórnia, estabelecida formalmente em 2 de julho de 1939, depois de um primeiro grande contrato em 1938 para fornecer osciladores para o Fantasia de Walt Disney, e constituída como sociedade em 18 de agosto de 1947, com Packard como presidente. Vieram primeiro os instrumentos e as calculadoras (a HP-35, de 1972, foi a primeira calculadora científica portátil do mundo), depois os computadores comerciais com o HP 3000, as estações de trabalho e os servidores Unix com o HP 9000 rodando HP-UX e, em 1984, as impressoras jato de tinta e laser para o desktop.",
    // Body paragraphs, same count and order as English.
    body: [
      "O HP-UX é o fio que liga este registro aos sistemas operacionais em outros pontos do glossário. O Hewlett Packard Unix era baseado no System V, inicialmente no System III; a infobox da enciclopédia data o lançamento inicial de 1982 e o texto, de 1984, uma discrepância registrada aqui em vez de resolvida. Rodava no HP Integral PC e nas Series 200, 300 e 400 do HP 9000, com processadores Motorola 68000, na Series 500, com a arquitetura FOCUS da própria HP, depois em PA-RISC e por fim no Itanium da Intel, nos servidores Integrity; foi o primeiro Unix a oferecer listas de controle de acesso para arquivos e um dos primeiros com gerenciador de volumes lógicos embutido. A última versão, a 11i v3, saiu em 22 de maio de 2025 e, com a descontinuação do Itanium, o suporte terminou em 31 de dezembro de 2025.",
      "O OpenView era o lado do gerenciamento. O produto fundamental era o Network Node Manager, software de monitoramento de redes baseado em SNMP, e a família cresceu por compras: a Novadigm e a sua suíte Radia em abril de 2004, a Peregrine Systems em dezembro de 2005, a Mercury Interactive em novembro de 2006, a Opsware. Em 2007, a linha inteira foi rebatizada HP BTO Software, sob a HP Software Division, e o nome OpenView foi aposentado; a HP Software passou para a HPE na divisão e foi vendida à Micro Focus numa fusão concluída em 1º de setembro de 2017.",
      "O arco corporativo: a Agilent, o negócio de teste e medição que era a origem da empresa, foi separada em 1999. Em 3 de setembro de 2001, a HP anunciou um acordo de fusão com a Compaq e, depois de uma votação de acionistas, a fusão se tornou oficial em 3 de maio de 2002, trazendo junto a Digital Equipment Corporation que a Compaq tinha comprado em 1998. A Electronic Data Systems veio em seguida, por um acordo de 13 de maio de 2008, elevando a receita combinada a US$ 118,4 bilhões e a empresa ao nono lugar da Fortune 500 em 2009; 3Com, Palm e 3PAR foram todas compradas em 2010, e a Autonomy depois delas.",
      "Em 1º de novembro de 2015, a Hewlett-Packard se dividiu em Hewlett Packard Enterprise, que ficou com os produtos e serviços corporativos, e HP Inc., que ficou com os computadores pessoais e as impressoras. O card da HPE Networking nesta linha do tempo acompanha a metade de redes, da 3Com e da Aruba até a fusão com a Juniper em 2025; este card termina onde o nome terminou.",
    ],
    // Ending note (the year stays in the English record).
    endedNote:
      "Dividida em 1º de novembro de 2015: o negócio de produtos e serviços corporativos foi separado como Hewlett Packard Enterprise, e os negócios de computadores pessoais e impressoras viraram HP Inc. O HP-UX, que rodava nas linhas HP 9000 e Integrity, chegou ao fim do suporte em 31 de dezembro de 2025.",
    // Successor link label (the URL stays in the English record).
    successorLabel:
      "HP Inc., o negócio de PCs e impressoras; o negócio corporativo virou Hewlett Packard Enterprise, cuja linhagem de redes está no card da HPE Networking",
    // Acquisitions: same order and length as English; names, years and prices stay in the English record.
    acquisitions: [
      // Compaq.
      { what: "Acordo anunciado em 3 de setembro de 2001; a fusão se tornou oficial em 3 de maio de 2002, depois de uma votação de acionistas, e a empresa combinada foi lançada em 7 de maio de 2002. A própria Compaq tinha adquirido a Digital Equipment Corporation em junho de 1998.", became: "O negócio de PCs e servidores padrão de mercado da HP; as linhas da DEC e da Compaq dentro dele.", sourceNote: "Wikipedia: Hewlett-Packard e Digital Equipment Corporation (lidos em 06/10/2026)." },
      // Novadigm.
      { what: "A suíte Radia, incorporada ao OpenView; abril de 2004.", sourceNote: "Wikipedia: HP OpenView (lido em 06/10/2026)." },
      // Peregrine Systems.
      { what: "Software de gestão de ativos e serviços de TI, integrado ao OpenView; dezembro de 2005.", sourceNote: "Wikipedia: HP OpenView (lido em 06/10/2026)." },
      // Mercury Interactive.
      { what: "Compra concluída em novembro de 2006 e aplicações integradas à família OpenView, depois do que os nomes OpenView e Mercury foram aposentados em favor de HP BTO Software.", sourceNote: "Wikipedia: HP OpenView (lido em 06/10/2026)." },
      // Electronic Data Systems.
      { what: "Acordo definitivo anunciado em 13 de maio de 2008; receitas combinadas de US$ 118,4 bilhões naquele ano e nono lugar na Fortune 500 em 2009.", sourceNote: "Wikipedia: Hewlett-Packard (lido em 06/10/2026)." },
      // 3Com.
      { what: "Redes; uma das três compras de 2010, com a Palm e a 3PAR. O card da HPE Networking conta a história da 3Com.", sourceNote: "Wikipedia: Hewlett-Packard (lido em 06/10/2026)." },
      // Palm.
      { what: "Adquirida em 2010, com a 3Com e a 3PAR.", sourceNote: "Wikipedia: Hewlett-Packard (lido em 06/10/2026)." },
      // 3PAR.
      { what: "Adquirida em 2010, com a 3Com e a Palm.", sourceNote: "Wikipedia: Hewlett-Packard (lido em 06/10/2026)." },
    ],
  },
  // HexaIT: record prose only (no profile).
  "hexait": {
    // Name has no subtitle: kept verbatim so the record reports complete.
    name: "HexaIT",
    // Card line and page intro.
    tagline: "Parceira Fortinet de nível Expert no Brasil.",
    intro:
      "Integradora de São Paulo, registrada em 2011, que em 2025 foi a parceira com quem a Fortinet trouxe o FortiCnapp ao mercado brasileiro.",
    // Body paragraphs, same count and order as English (body[2] repeats body[0] in the English record; mirrored as is).
    body: [
      "A Hexait Servicos e Tecnologia da Informacao foi aberta em 18 de agosto de 2011 na Vila Gomes Cardim, em São Paulo, com a atividade registrada de suporte técnico e manutenção. O que a distingue das outras casas de nível Expert aqui é um lançamento com data, e não uma linha de diretório: em março de 2025, ela levou ao mercado brasileiro o FortiCnapp, uma plataforma unificada de segurança em nuvem que abrange gestão de postura, proteção de workloads, gestão de permissões e segurança de código.",
      "Ser a parceira por meio da qual um fabricante lança um produto é diferente de ter um nível. Um nível diz quantos engenheiros certificados uma casa emprega; um lançamento diz que o fabricante espera que essa casa consiga vender e dar suporte a algo que ninguém no mercado implantou ainda, o que é um julgamento sobre as pessoas, e não uma contagem delas.",
      "Registrada como Hexait Servicos e Tecnologia da Informacao em agosto de 2011, no bairro da Vila Gomes Cardim, em São Paulo, com suporte técnico e serviços de TI como atividade declarada. Em março de 2025, trouxe ao mercado brasileiro o FortiCnapp da Fortinet (gestão de postura de segurança em nuvem, proteção de workloads, gestão de permissões e segurança de código numa só plataforma), o que a coloca entre os parceiros que fazem trabalho de lançamento para um fabricante, e não apenas revendem o que já está estabelecido aqui.",
    ],
  },
  // HighCast: record prose only (no profile).
  "highcast": {
    // Name: company kept, subtitle translated.
    name: "HighCast - a consultoria que construiu uma empresa de treinamento",
    tagline: "Consultoria brasileira de redes que trabalhou em backbones de operadoras pela América Latina.",
    intro:
      "A HighCast Informatica foi fundada em 2003 por quatro consultores de telecomunicações e trabalhou em redes de operadoras pela América Latina: os backbones da Telefonica e da Oi, o lançamento da Live TIM e da Telmex México, auditorias na CTBC e na ETB, na Colômbia, e projetos de IPv6 em três operadoras brasileiras.",
    // Body paragraphs, same count and order as English.
    body: [
      "A parte interessante da sua história é o que o trabalho produziu. O relato da própria empresa diz que a especialização dos seus consultores criou demanda de mercado por treinamento técnico, e em 2008 os sócios responderam fundando a inLearn Educacao, o que é um padrão específico e repetível: uma consultoria acumula conhecimento que os clientes começam a pedir para aprender, e ensinar vira um negócio, não um favor.",
      "Essa sequência explica algo sobre como a certificação de fabricantes realmente chega aos engenheiros de um país. O centro de treinamento não chegou porque um fabricante abriu um; chegou porque uma consultoria já tinha feito o trabalho e estava sendo chamada a explicá-lo.",
    ],
  },
  // Hughes: record prose only (no profile).
  "hughes": {
    // Name: company kept, subtitle translated.
    name: "Hughes - a rede onde a latência é uma lei da física",
    tagline: "Satélite geoestacionário: cerca de um quarto de segundo em cada sentido, e nada vai consertar isso.",
    intro:
      "A Hughes Network Systems constrói redes via satélite, historicamente sobre satélites geoestacionários, e a órbita geoestacionária impõe uma restrição que nenhuma engenharia remove. A órbita fica a cerca de 36.000 quilômetros de altura, então um sinal percorre 72.000 quilômetros numa ida e volta antes que qualquer coisa seja processada.",
    // Body paragraphs, same count and order as English.
    body: [
      "Isso produz um piso de latência de cerca de meio segundo, e muda quais protocolos funcionam. O throughput do TCP depende do round-trip time, então uma conexão com latência de satélite e um tamanho de janela comum não consegue encher o link, por mais banda que se provisione; é por isso que as implantações via satélite sempre precisaram de aceleração, de protocol spoofing e de aplicações projetadas para tolerar atraso.",
      "É o caso mais claro, em redes, de um limite que não é um trade-off de engenharia. Banda se compra e hardware se atualiza; a velocidade da luz e a altura da órbita são fixas, e toda decisão de projeto acima delas é uma resposta a esse fato.",
    ],
  },
  // Illumio: record prose and the complete profile.
  "illumio": {
    // Name has no subtitle: kept verbatim so the record reports complete.
    name: "Illumio",
    // Card line and page intro.
    tagline: "Partiu do princípio de que o atacante já está dentro, e fez do produto inteiro o que acontece em seguida.",
    intro:
      "Andrew Rubin e PJ Kirner fundaram a Illumio em 23 de janeiro de 2013, em Sunnyvale, depois de os dois terem deixado a Cymtec no mês anterior. Eles tinham se conhecido num almoço, apresentados por um amigo em comum, o que Kirner descreveu como algo parecido com um encontro às cegas. Rubin ficou com o lado comercial, Kirner com o técnico: ele tinha sido distinguished engineer no escritório do CTO de segurança da Juniper Networks, que aparece neste site como um capítulo de carreira próprio.",
    // Body paragraphs, same count and order as English.
    body: [
      "A tese de fundação estava fora de moda em 2013 e hoje é quase consenso: a segurança de perímetro sozinha não basta, as invasões são inevitáveis, e a pergunta útil é o que um atacante consegue alcançar depois de entrar. A maior parte do gasto com segurança na época ia para manter as pessoas do lado de fora. O argumento da Illumio era que o problema da contenção merecia um produto próprio.",
      "A decisão técnica que decorre disso é a interessante. A segmentação tinha sido historicamente um problema de rede (VLANs, zonas, firewalls entre elas), o que significa que a política mora na topologia, e a segurança de um workload depende de onde ele por acaso está. A Illumio pôs a aplicação das regras no próprio workload, com a política calculada de forma central e enviada aos hosts, de modo que a regra viaja com a aplicação, e não com o cabeamento. É por isso que funciona numa nuvem onde você não é dono da rede, e é o motivo de uma abordagem baseada em software ter conseguido fazer aquilo que a segmentação em hardware não conseguia acompanhar.",
      "E então vem a parte que todo mundo subestima, sobre a qual a empresa tem sido honesta. Não se pode aplicar uma regra de que nada conversa sem motivo enquanto não se sabe o que de fato conversa com o quê. Num data center com alguma idade, ninguém sabe. Assim, o primeiro problema de produto não era a aplicação das regras, e sim o mapeamento de dependências em tempo real (descobrir o grafo real de conversas de um ambiente em funcionamento), e o nome vem de illuminate exatamente por esse motivo.",
      "Também é por isso que a empresa passou vinte e dois meses em stealth antes de mostrar qualquer coisa. Levantou US$ 12,5 milhões da Andreessen Horowitz e da General Catalyst no começo de 2013, saiu do silêncio em outubro de 2014 com uma Series B de US$ 30,2 milhões e teve Morgan Stanley e Plantronics como clientes no primeiro ano. Uma rodada de US$ 100 milhões em 2015 a levou além do bilhão.",
      "Hoje, o enquadramento é segmentação zero trust e contenção de invasões, e os números informados são US$ 557 milhões captados, avaliação de US$ 2,75 bilhões, receita acima de US$ 100 milhões por ano e cerca de um quinto da Fortune 100. Kirner deixou o cargo de chief technology officer em maio de 2023, depois de uma década, e continuou como conselheiro.",
      "Lida ao lado de duas outras entradas daqui, ela completa um retrato de como o perímetro se dissolveu. A Zscaler levou a inspeção para onde os usuários foram. A Netskope atacou o que as pessoas faziam dentro de aplicações que ninguém tinha aprovado. A Illumio tratou do interior do próprio data center, partindo do princípio de que as outras duas às vezes falhariam. Três empresas, três pedaços diferentes da mesma admissão: a fronteira em torno da qual a segurança se organizava tinha deixado de descrever qualquer coisa real.",
    ],
    // Complete translated profile; years, company and founders unchanged.
    profile: {
      slug: "illumio",
      foundings: [
        {
          company: "Illumio",
          year: 2013,
          place: "Sunnyvale, Califórnia",
          founders: ["Andrew Rubin", "PJ Kirner"],
          story:
            "Fundada em 23 de janeiro por um fundador comercial e um distinguished engineer do escritório de segurança da Juniper, um mês depois de os dois terem deixado a Cymtec. O nome vem de illuminate, que descreve o primeiro problema, e não o produto: antes que qualquer coisa possa ser contida, alguém precisa saber o que conversa com o quê.",
        },
      ],
      timeline: [
        { year: 2013, title: "Fundada, e logo em silêncio", detail: "Janeiro, e depois quase dois anos construindo antes de mostrar qualquer coisa, porque o primeiro problema era o mapeamento, e um mapa de nada não demonstra nada." },
        { year: 2014, title: "Fora do stealth", detail: "Outubro, já com referências corporativas no lugar, algo incomum para uma empresa da qual ninguém tinha ouvido falar um ano antes." },
        { year: 2026, title: "Sem agente, usando a telemetria de outros", detail: "Em fevereiro, a empresa lançou visibilidade construída a partir da telemetria de firewalls da Check Point e da Fortinet, e não do próprio agente: ler o mapa de tráfego da infraestrutura que o cliente já tem. Para uma empresa cuja arquitetura inteira era baseada em agente, é uma admissão notável de que o agente é um meio, e não o objetivo." },
      ],
      products: [
        { name: "O PCE e o VEN", what: "Um Policy Compute Engine que calcula o que cada workload deve poder fazer, e um Virtual Enforcement Node em cada host que recebe o resultado. A divisão importa: o raciocínio é central, a aplicação das regras é local." },
        { name: "Illumination", what: "O mapa de dependências ao vivo: a resposta visual para o que de fato conversa com o quê, que é o artefato que os clientes costumam comprar antes de aplicar qualquer regra." },
        { name: "Illumio Core", what: "Segmentação para servidores e workloads de data center, o produto original e ainda o centro do negócio." },
        { name: "CloudSecure e Endpoint", what: "O mesmo modelo de política estendido a workloads cloud-native e a laptops, onde a questão da contenção é o que um endpoint comprometido consegue alcançar, e não o que chega até ele." },
        { name: "Illumio Insights", what: "Observabilidade e detecção sobre o grafo de tráfego e, a partir de 2026, capaz de construir esse grafo a partir da telemetria de firewalls de terceiros, sem nenhum agente implantado." },
      ],
      innovations: [
        { title: "A aplicação das regras entregue ao sistema operacional", detail: "O agente não fica no caminho do tráfego. Ele programa o firewall que o sistema operacional já tem (iptables no Linux, a Windows Filtering Platform no Windows) e depois sai do caminho. A empresa chama isso de enforcement-for-hire, e o código que faz o trabalho está em produção desde 1998, de um lado, e desde por volta de 2007, do outro." },
        { title: "O que acontece quando o agente morre", detail: "Essa é a consequência que vale entender, porque todo agente de segurança precisa responder a ela. Um agente inline que falha ou abre o host ou o bloqueia, e as duas coisas são panes. Aqui, o sistema operacional continua aplicando a última política que recebeu, então um agente morto significa que a política para de ser atualizada, e não que para de valer. Concorrentes que instalam o próprio firewall aceitam um modo de falha mais pesado e um problema nas atualizações do sistema operacional em troca de mais controle." },
        { title: "Rótulos em vez de endereços", detail: "A política é escrita contra quatro dimensões (função, aplicação, ambiente, localização) e nunca contra uma VLAN, uma sub-rede ou um IP. Um workload que se move, ou é reconstruído num novo endereço, mantém as suas regras porque as regras nunca foram sobre onde ele estava. É todo o argumento contra a segmentação baseada em topologia, expresso como modelo de dados." },
        { title: "Quatro modos de aplicação, implantados em ordem", detail: "Ocioso, depois só visibilidade, depois seletivo, depois completo. Essa progressão existe porque o modo de falha honesto da segmentação não é ser contornada: é quebrar uma aplicação de produção que ninguém documentou. Poder rodar em produção vendo exatamente o que teria sido bloqueado, antes de bloquear qualquer coisa, é o que torna o projeto sobrevivível." },
      ],
      markets: [
        "Grandes empresas com data centers antigos o bastante para que ninguém tenha um mapa atualizado deles: serviços financeiros, saúde, governo e os operadores de ambientes onde as dependências de uma aplicação são folclore, e não documentação.",
        "Compete com os outros especialistas em microssegmentação, com os fabricantes de plataforma que acrescentam segmentação a suítes mais amplas e com o argumento de que os security groups cloud-native já são bons o bastante, o que é verdade para ambientes construídos depois de 2015 e não para os que não foram.",
      ],
      analyst: [
        "Leader na avaliação de microssegmentação da Forrester e Customers' Choice na revisão por pares de 2026 do Gartner para microssegmentação de segurança de rede, que é um sinal diferente: reflete as pessoas que a implantaram, e não os analistas que a avaliaram.",
        "A dificuldade da própria categoria merece ser dita. A microssegmentação está a três anos de virar mainstream há cerca de uma década, porque a tecnologia raramente foi o obstáculo: mapear um ambiente não documentado e conseguir permissão para aplicar qualquer regra nele são problemas organizacionais, e nenhum produto resolve isso. A direção sem agente de 2026 se lê como uma resposta à primeira metade disso.",
      ],
    },
  },
  // Marvell: record prose only (no profile).
  "marvell": {
    // Name: company kept, subtitle translated.
    name: "Marvell - fundada sobre um disco rígido, acabou na rede",
    tagline: "Empresa de silício constituída em 1995 por três fundadores, hoje fornecedora de chips de rede e de infraestrutura.",
    intro:
      "A Marvell foi constituída em 10 de fevereiro de 1995 por Sehat Sutardja, Weili Dai e Pantas Sutardja. O primeiro produto foi um read channel para discos rígidos (o circuito que transforma o sinal analógico ruidoso de uma cabeça magnética em dados digitais), construído em CMOS quando a indústria usava um processo mais caro.",
    // Body paragraphs, same count and order as English.
    body: [
      "Tinha chips funcionando no Natal de 1995 e a Seagate como primeiro cliente. A abordagem (amostragem em alta velocidade e filtragem digital em CMOS, onde os incumbentes usavam detecção analógica de picos num processo mais caro) aumentou a densidade de dados que um disco conseguia guardar e tirou a Texas Instruments do negócio de read channels.",
      "O caminho dali até o silício de rede é o caminho comum desta indústria, e vale dizê-lo. Um read channel é um problema de sinal misto: recuperar um sinal analógico fraco em alta velocidade e decidir que bits ele carrega. Assim também é um transceiver de camada física numa porta Ethernet, e assim é o serializador por baixo de toda interface rápida. A mesma abordagem em CMOS se transferiu, e o disco rígido era simplesmente onde estava o dinheiro em 1995.",
      "O momento também é um dado para os marcos de fabricação deste site. O modelo fabless estava acabando de se tornar viável quando a Marvell foi fundada, e a empresa é um dos primeiros sucessos dele: projetar silício que ela não fabricava, no momento em que isso deixou de ser uma desvantagem.",
      "O começo do próprio fundador fica registrado porque a forma como as pessoas entram neste trabalho faz parte da história. Sehat Sutardja construiu um gerador de Van de Graaff em Jacarta depois de encontrar as revistas de hobby do irmão, aprendeu que transistores o melhorariam e tinha licença de técnico de rádio aos treze anos. Os nomes impressos naqueles transistores (Fairchild, National Semiconductor, Motorola, Texas Instruments) eram americanos, e foi isso que o levou aos Estados Unidos em 1980. Fez doutorado em Berkeley e, no fim, tinha mais de quatrocentas patentes. Em 2004, os três fundadores foram reconhecidos em conjunto, na categoria de redes e comunicações.",
      "Uma das ideias posteriores dele tem lugar nos marcos de fabricação. Numa conferência de circuitos de estado sólido em 2015, ele propôs chips modulares: construir um dispositivo grande a partir de vários pequenos interligados, em vez de um único die. A indústria adotou a abordagem com outro nome, chiplets, e hoje é assim que a maioria dos grandes processadores é de fato construída.",
    ],
  },
  // MikroTik: record prose (empty body, as in English), the first-person note and the complete profile.
  "mikrotik": {
    // Name: company kept, subtitle translated.
    name: "MikroTik - a gigante discreta da Letônia",
    tagline: "RouterOS sobre hardware comum: a empresa que tornou o roteamento carrier-grade acessível em todo lugar, e continuou independente.",
    intro:
      "Fundada em Riga em 1996, a MikroTik pôs software de roteamento carrier-grade em PCs x86 comuns (RouterOS, 1997) e depois nas próprias placas (RouterBOARD, 2002). A fórmula de preço e desempenho a tornou onipresente entre ISPs e provedores de internet sem fio no mundo todo, inclusive no Brasil, e em 2022 ela se tornou a primeira empresa privada da Letônia a passar de EUR 1 bilhão em valor. Ainda privada, ainda em Riga, ainda controlada pelos fundadores.",
    // Body is empty in English, so the same empty list keeps parity.
    body: [],
    // Accuracy note: first person kept; the English switches to "he" mid-sentence, rendered here in the first person (see NOTES).
    note:
      "Nem eu nem a Red Education ministramos treinamento MikroTik. Esta página é história corporativa, verificada contra a história da própria MikroTik e registros públicos. A minha ligação vem do campo: equipamentos MikroTik são a espinha dorsal de incontáveis redes de ISPs e WISPs brasileiros ao lado das quais trabalho desde os anos 1990.",
    // Complete translated profile; years, company and founders unchanged.
    profile: {
      slug: "mikrotik",
      foundings: [
        {
          company: "MikroTik (SIA Mikrotīkls)",
          year: 1996,
          place: "Riga, Letônia",
          founders: ["John Tully", "Arnis Riekstiņš"],
          story:
            "Fundada na Riga pós-soviética para construir roteamento para provedores de internet que não podiam pagar os incumbentes. A percepção de fundação era o software em primeiro lugar: desenvolver software de rede para hardware de PC x86 padrão e deixar a economia das commodities fazer o resto. Esse software virou o RouterOS em 1997 e, quando a empresa começou a construir as próprias placas em 2002, nasceu a linha RouterBOARD: recursos carrier-grade a preços que nenhum fabricante estabelecido toparia.",
        },
      ],
      timeline: [
        { year: 1996, title: "Fundada em Riga", detail: "John Tully e Arnis Riekstiņš criam a MikroTik para desenvolver roteadores e sistemas para provedores de internet sem fio, escrevendo software de rede para PCs x86 comuns." },
        { year: 1997, title: "RouterOS", detail: "Sai o software de roteamento baseado em Linux: encaminhamento de pacotes, NAT, firewall e uma profundidade de controle incomum para todo tipo de interface de dados, em hardware que qualquer um podia comprar." },
        { year: 2002, title: "RouterBOARD", detail: "A MikroTik decide fazer o próprio hardware; nasce a marca RouterBOARD, que une o RouterOS a placas feitas sob medida e cria a fórmula de preço e desempenho pela qual a empresa é conhecida.", sourceNote: "Datas conforme a história da própria MikroTik." },
        { year: 2022, title: "O primeiro bilhão privado da Letônia", detail: "Avaliada em EUR 1,30 bilhão, a MikroTik torna-se a 4ª maior empresa da Letônia e a primeira empresa privada letã a superar EUR 1 bilhão em valor." },
        { year: 2023, title: "Equipe pequena, presença global", detail: "Cerca de 367 funcionários em Riga atendem clientes em quase todos os países: uma das histórias mais extremas de receita por funcionário da indústria, inteiramente privada e controlada pelos fundadores." },
      ],
      products: [
        { name: "RouterOS", what: "O sistema operacional de rede baseado em Linux: roteamento, firewall, VPN, gestão de banda, hotspot e wireless numa única imagem; o mesmo sistema de um roteador doméstico de USD 50 à agregação de um ISP." },
        { name: "RouterBOARD", what: "A linha de hardware própria da MikroTik, de minúsculos equipamentos SOHO à série CCR de cloud core routers para ISPs, além de switches e enlaces wireless de 60 GHz." },
        { name: "O ecossistema certificado", what: "Uma rede mundial de instrutores e consultores certificados cresceu em torno do RouterOS; a especialização em MikroTik virou uma habilidade vendável por si só nos mercados de ISPs." },
      ],
      innovations: [
        { title: "Roteamento software-first sobre hardware comum", detail: "Anos antes de 'white box' e NFV entrarem no vocabulário da indústria, a MikroTik entregava recursos de operadora como software sobre PCs padrão." },
        { title: "Ruptura pela relação preço-desempenho", detail: "Profundidade de recursos que rivaliza com fabricantes corporativos a uma fração do custo: a fórmula que construiu a indústria de WISPs nos mercados emergentes." },
        { title: "Um sistema operacional em toda a linha", detail: "O RouterOS é o mesmo sistema em todo lugar, então habilidades, scripts e configurações se transferem do menor equipamento à borda do data center." },
      ],
      markets: [
        "A MikroTik é uma das marcas de rede mais implantadas entre ISPs e provedores de internet sem fio no mundo todo, com força especial nos mercados emergentes, inclusive no Brasil, onde equipamentos MikroTik formam a espinha dorsal de incontáveis redes de provedores no mundo dos ISPs em que eu cresci profissionalmente.",
        "A empresa continua de capital fechado e independente numa indústria definida pela consolidação (sem IPO, sem aquisição, sem controle externo): o contraexemplo de todas as outras histórias desta seção.",
      ],
      analyst: [
        "Em 2022, a MikroTik foi apontada como a 4ª maior empresa da Letônia em valor (EUR 1,30 bilhão) e a primeira empresa privada da história do país a passar da marca de EUR 1 bilhão.",
      ],
    },
  },
  // Motorola: record prose and the complete profile.
  "motorola": {
    // Name: company kept, subtitle translated.
    name: "Motorola - o século do rádio",
    tagline: "Do rádio automotivo ao walkie-talkie, à primeira chamada de celular portátil e à própria Lua; dividida em 2011 entre a Solutions e um braço Mobility que passou pelo Google até chegar à Lenovo.",
    intro:
      "A Motorola pôs o rádio em todo lugar: nos carros nos anos 1930, nas costas dos soldados nos anos 1940, na Lua em 1969 e na mão de Martin Cooper para a primeira chamada celular portátil em 1973. A empresa do século se dividiu em 2011: a Motorola Solutions carrega hoje a linhagem do rádio de missão crítica e das redes de segurança pública, enquanto o lado dos telefones viajou pelo Google até a Lenovo.",
    // Body paragraphs, same count and order as English.
    body: [
      "O perfil cobre a startup dos irmãos Galvin em Chicago, as eras do DynaTAC e do RAZR, a aposta no Iridium, a família de processadores 68000 que alimentou uma geração da computação e as duas metades da divisão.",
    ],
    // Complete translated profile; years, company and founders unchanged.
    profile: {
      slug: "motorola",
      foundings: [
        {
          company: "Motorola (founded as Galvin Manufacturing)",
          year: 1928,
          place: "Chicago, Illinois",
          founders: ["Paul V. Galvin", "Joseph Galvin"],
          story:
            "Os irmãos Galvin começaram com eliminadores de bateria e apostaram a empresa em pôr o rádio no automóvel: 'Motorola', motor mais Victrola, foi o nome do produto antes de ser o da empresa. Nos oitenta anos seguintes, a Motorola pôs o rádio onde o rádio nunca tinha estado: nas costas dos soldados, nas viaturas de polícia, na Lua em 1969 e, com a chamada de Martin Cooper no DynaTAC em 1973, na mão humana. Poucas empresas inventaram tantas primazias sem fio; poucas se desfizeram de forma tão pública.",
        },
      ],
      timeline: [
        { year: 1940, title: "A guerra do Handie-Talkie", detail: "O rádio portátil SCR-536 e o rádio de mochila SCR-300 vão à guerra com a infantaria aliada: o rádio bidirecional portátil nasce como linha de produtos da Motorola, a linhagem que a Motorola Solutions ainda lidera." },
        { year: 1969, title: "Vozes da Lua", detail: "As comunicações da Apollo 11 passam por transponders construídos pela Motorola: 'one small step' (um pequeno passo) chega à Terra pelos rádios da empresa, o teste de alcance definitivo." },
        { year: 1973, title: "A primeira chamada de celular portátil", detail: "3 de abril de 1973: Martin Cooper, numa calçada de Nova York, liga para o seu rival na Bell Labs a partir do protótipo do DynaTAC; o 8000X comercial vem em 1983, a US$ 3.995: a indústria de aparelhos começa aqui." },
        { year: 1979, title: "O 68000", detail: "A família de processadores 68000 da Motorola alimenta o Macintosh, o Amiga, o Atari ST e as primeiras estações de trabalho da Sun: a outra grande dinastia de CPUs da aurora da computação pessoal." },
        { year: 1998, title: "O Iridium cai na Terra", detail: "A constelação global de telefonia com 66 satélites é lançada: triunfo de engenharia, fracasso de mercado; a falência vem em menos de um ano, a lição mais instrutiva da época sobre resolver magnificamente o problema de ontem." },
        { year: 2011, title: "A divisão, o Google, a Lenovo", detail: "4 de janeiro de 2011: a Motorola se divide em Solutions (rádio de segurança pública e corporativo) e Mobility. O Google compra a Mobility em maio de 2012 por US$ 12,5 bilhões, em grande parte pelo acervo de patentes, e a vende à Lenovo em outubro de 2014 por cerca de US$ 2,91 bilhões. A Solutions leva adiante o século do rádio.", sourceNote: "Divisão e valores dos negócios conforme o registro público." },
      ],
      products: [
        { name: "Rádio móvel terrestre (APX, TETRA)", what: "A franquia de rádio bidirecional de missão crítica: polícia, bombeiros e concessionárias no mundo todo, o núcleo da Solutions até hoje." },
        { name: "Do DynaTAC ao RAZR", what: "A dinastia de aparelhos: a primeira chamada portátil, o primeiro ícone flip e o fenômeno de design do RAZR de 2004." },
        { name: "Família de processadores 68000", what: "A linha de CPUs que alimentou uma geração de estações de trabalho e de computadores domésticos queridos." },
      ],
      innovations: [
        { title: "O celular na mão", detail: "A chamada de Cooper no DynaTAC criou a própria categoria de aparelhos: todo telefone desde então é uma nota de rodapé de uma calçada de Manhattan em 1973." },
        { title: "Six Sigma", detail: "Nascido na Motorola em 1986: a metodologia de qualidade que virou ortodoxia global de gestão, uma invenção de processo exportada para todas as indústrias." },
      ],
      markets: [
        "A Motorola Solutions lidera as comunicações de missão crítica (rádio móvel terrestre, redes de segurança pública, software para centros de comando), enquanto a linhagem Mobility continua na Lenovo: o século do rádio dividido, as duas metades vivas.",
      ],
      analyst: [
        "A referência permanente em rádio bidirecional e, nas duas primeiras décadas do aparelho celular, o fabricante contra o qual as avaliações de mobilidade mediam todos os outros, até o smartphone reescrever a categoria longe dela.",
      ],
    },
  },
  // NEC: record prose and the complete profile.
  "nec": {
    // Name: company kept, subtitle translated.
    name: "NEC - a primeira joint venture do Japão",
    tagline: "Fundada em 1899 com capital da Western Electric; o NEAX comutou as chamadas do mundo, o PC-98 dominou o mercado japonês de PCs e a visão C&C deu nome à convergência em que todos vivemos hoje.",
    intro:
      "A NEC foi a primeira joint venture do Japão com capital estrangeiro (Western Electric, 1899) e cresceu até virar a espinha dorsal das comunicações do país: centrais NEAX, satélites, sistemas de cabos submarinos e os supercomputadores vetoriais SX por trás do Earth Simulator. As linhas PC-8001 e PC-98 dominaram o mercado japonês de computadores pessoais por mais de uma década, e o 'C&C' (Computers and Communications) de Koji Kobayashi, de 1977, deu nome à convergência em que toda esta indústria se transformou.",
    // Body paragraphs, same count and order as English.
    body: [
      "O perfil cobre a fundação com a Western Electric, as décadas de comutação e do espaço, a era do PC-98, os anos de número um mundial em semicondutores que terminaram na fusão que criou a Renesas, e os pontos fortes de hoje em biometria e cabos submarinos.",
    ],
    // Complete translated profile; years, company and founders unchanged.
    profile: {
      slug: "nec",
      foundings: [
        {
          company: "NEC (Nippon Electric Company)",
          year: 1899,
          place: "Tóquio, Japão",
          founders: ["Kunihiko Iwadare (with Western Electric capital)"],
          story:
            "A NEC foi a primeira joint venture do Japão com capital estrangeiro: Kunihiko Iwadare se associou à Western Electric em 1899 para fabricar equipamentos telefônicos, e a empresa cresceu até virar a espinha dorsal das comunicações do país, e mais um pouco. As centrais NEAX comutavam chamadas em todos os continentes, os seus satélites e cabos submarinos as levavam de um continente a outro, os seus computadores PC-98 foram o mercado japonês de PCs por quinze anos, e o 'C&C' de Koji Kobayashi, de 1977 (Computers and Communications, convergindo), deu nome ao futuro em que toda esta indústria se transformou.",
        },
      ],
      timeline: [
        { year: 1899, title: "A primeira joint venture", detail: "17 de julho de 1899: Iwadare e a Western Electric fundam a Nippon Electric (capital estrangeiro, empresa japonesa, equipamento telefônico), uma estrutura de fundação tão histórica quanto os produtos." },
        { year: 1977, title: "C&C", detail: "O presidente do conselho Koji Kobayashi apresenta Computers and Communications como um único destino convergente na INTELCOM 77: a declaração precoce mais clara da convergência que define todo o assunto deste site." },
        { year: 1982, title: "PC-98: um universo paralelo", detail: "O PC-9801 inicia a linha que domina o mercado japonês de computadores pessoais: participação majoritária por mais de uma década, um ecossistema de software próprio, um mundo de PCs que correu em paralelo ao compatível com IBM até o Windows unificá-los." },
        { year: 1988, title: "O topo dos semicondutores", detail: "A NEC reina como a maior fabricante de chips do mundo no fim dos anos 1980, o auge da era japonesa dos semicondutores; a linhagem depois se funde na Renesas (2010), enquanto a indústria se reorganiza." },
        { year: 2002, title: "Earth Simulator", detail: "A arquitetura vetorial SX da NEC leva o Earth Simulator ao 1º lugar do TOP500, com uma margem impressionante, mantendo a coroa de 2002 a 2004 e sacudindo uma geração de políticas de HPC.", sourceNote: "Registros do TOP500, 2002-2004." },
        { year: 2021, title: "Biometria, cabos, open RAN", detail: "Sob Takayuki Morita (CEO desde 2021, conforme o último registro aqui; não reverificado), a NEC lidera em reconhecimento facial (o recorde de benchmark do NeoFace), continua entre as três grandes construtoras de cabos submarinos do mundo e impulsiona o 5G open RAN: a visão C&C, meio século depois." },
      ],
      products: [
        { name: "Comutação NEAX e sistemas submarinos", what: "As centrais que comutavam as chamadas do mundo, e os sistemas de cabos (de um dos três fornecedores globais) que as levam por baixo dos oceanos." },
        { name: "Série PC-98", what: "A plataforma de PC dominante no Japão por quinze anos: um ecossistema paralelo completo de hardware e software." },
        { name: "NeoFace e governo digital", what: "A linha de biometria que lidera os benchmarks de precisão, âncora do negócio de infraestrutura pública da NEC hoje." },
      ],
      innovations: [
        { title: "Dar nome à convergência", detail: "O C&C de Kobayashi pôs computadores e comunicações num único roadmap em 1977: a tese que as redes passaram o meio século seguinte provando." },
        { title: "A última coroa da supercomputação vetorial", detail: "O domínio do Earth Simulator foi a melhor hora da arquitetura vetorial, e o alerta que reformulou o investimento americano em HPC." },
      ],
      markets: [
        "A NEC atende operadoras, governos e empresas no mundo todo (cabos submarinos, biometria, 5G e a infraestrutura digital do Japão): a joint venture de 1899 ainda construindo o tecido conectivo.",
      ],
      analyst: [
        "Presença fixa nas avaliações de comutação, de cabos e, hoje, de biometria por décadas, e a empresa dentro de cuja declaração de visão de fundação toda a indústria convergente acabou vivendo.",
      ],
    },
  },
  // NextDNS: record prose only (no profile).
  "nextdns": {
    // Name: company kept, subtitle translated.
    name: "NextDNS - o resolver como filtro configurável",
    tagline: "Resolver público em que as blocklists, os logs e a retenção são configurações do usuário.",
    intro:
      "A NextDNS opera um resolver público cuja filtragem é configurável por perfil: quais blocklists se aplicam, o que é registrado em log e por quanto tempo. Ela fica na ponta oposta do mesmo eixo que o Quad9: um resolver decide a política por você, o outro lhe entrega os controles.",
    // Body paragraphs, same count and order as English.
    body: [
      "A NextDNS foi fundada em maio de 2019 por Romain Cointepas e Olivier Poitrey, que tinham trabalhado juntos na Dailymotion. Poitrey a fundou em 2005 e, quando os dois começaram este projeto, era diretor de engenharia na Netflix, trabalhando no Open Connect, a rede de distribuição de conteúdo que transporta uma parcela substancial do tráfego de internet dos Estados Unidos. Duas pessoas que tinham passado a carreira construindo infraestrutura nessa escala escolheram a resolução de nomes como a coisa que valia a pena reconstruir.",
      "A premissa é dita com clareza pela empresa: resolvers sem criptografia operados por provedores de internet são prejudiciais tanto à neutralidade da rede quanto à privacidade. Cada nome que um dispositivo consulta é um registro do que o usuário está fazendo e, por padrão, esse registro é entregue em texto claro a quem fornece a conexão. Criptografar a consulta leva o registro para uma parte que o próprio usuário escolhe.",
      "O que ela vende é essa escolha tornada operável: um resolver anycast com DNS over HTTPS em todas as plataformas, listas de bloqueio selecionáveis para publicidade, malware, trackers, phishing e criptomineração, e perfis por dispositivo. Acrescentou o CNAME uncloaking em 2019, o que importa porque os trackers tinham começado a se disfarçar de subdomínios do site visitado justamente para derrotar o bloqueio baseado em listas.",
      "Esse último detalhe é o formato inteiro desta categoria. Bloquear por nome e escapar do bloqueio por nome é um loop sem estado final, e cada movimento de um lado está disponível para o outro. Um resolver que filtra é um controle que vale a pena manter, e não uma fronteira que alguém deva tratar como fixa.",
    ],
  },
  // Nortel and Bay Networks: whole record (the ending note moved here on 2026-10-25) and the complete profile.
  "nortel-bay": {
    // Name: companies kept, subtitle translated.
    name: "Nortel & Bay Networks - a gigante que desapareceu",
    tagline: "Da Montreal de 1895 a um terço do índice da bolsa canadense, à maior falência da história do Canadá, e ao leilão de patentes de US$ 4,5 bilhões que pôs fim a tudo.",
    intro:
      "A Northern Electric (1895) virou Northern Telecom, apostou tudo na comutação digital em 1976 e cresceu até virar a Nortel: valia C$ 398 bilhões no pico de 2000, mais de um terço de toda a Toronto Stock Exchange. No caminho, engoliu a Bay Networks (a fusão SynOptics-Wellfleet de 1994) por US$ 9,1 bilhões e a Alteon WebSystems por US$ 7,8 bilhões. O colapso apagou tudo: o pedido de proteção de 14 de janeiro de 2009 foi a maior quebra corporativa da história canadense, os pedaços se espalharam por Ericsson, Avaya, Ciena, Radware e, por fim, Extreme Networks, e o leilão de patentes Rockstar de 2011 (US$ 4,5 bilhões, contra os lances do Google com tema de pi) foi a lápide.",
    // Body paragraphs, same count and order as English.
    body: [
      "As duas metades da fusão de 1994 têm hoje entradas próprias aqui: a Wellfleet construiu os roteadores multiprotocolo e a SynOptics construiu os hubs de cabeamento em par trançado. Lê-las juntas é o ponto: uma empresa de roteadores e uma empresa de hubs detinham, cada uma, metade do que uma rede corporativa precisava, e nenhuma tinha o canal da outra, e é por isso que a fusão fazia sentido no papel e que a firma combinada lutou para virar uma empresa só, e não duas sob um nome novo.",
      "O registro de segurança pertence a esta entrada e costuma ficar de fora dela. No começo de 2004, o consultor sênior de segurança de sistemas da Nortel, um veterano de dezenove anos de casa, investigou um padrão estranho de downloads e descobriu que a rede estava comprometida desde aproximadamente 2000. Sete senhas de executivos tinham sido levadas, inclusive a do presidente-executivo. Os invasores vinham lendo documentos técnicos, relatórios de pesquisa, planos de negócio e e-mails, e conseguiam operar remotamente as máquinas dos funcionários.",
      "A empresa trocou as sete senhas e encerrou a investigação interna depois de seis meses. Essa resposta é a lição, mais do que a invasão: trocar uma senha resolve a credencial, não o acesso. Alguém presente por quatro anos tem outros caminhos de volta, e uma investigação interrompida em seis meses não estabelece que essa pessoa foi embora, apenas que ninguém continua procurando.",
      "O que matou a empresa é controverso e deve continuar controverso. A invasão está documentada. Também estão um escândalo contábil em que três executivos foram demitidos, processados e absolvidos em 2013; o colapso das ponto-com; uma onda de aquisições feita com ações infladas; e uma base de receita que evaporou. Atribuir o fim de uma firma de cento e catorze anos a qualquer um desses fatores isoladamente é mais arrumado do que o registro sustenta, e uma empresa pode ser roubada, mal administrada e azarada ao mesmo tempo.",
    ],
    // Accuracy note: first person kept; G03 wording "no training association is implied" kept exact in meaning. The English switches to "he" mid-sentence; rendered in the first person (see NOTES).
    note:
      "Nortel, Bay Networks, SynOptics e Wellfleet não existem mais como empresas, e nenhuma associação de treinamento com elas ou com as suas sucessoras está implícita. Esta página é história corporativa, verificada contra registros na SEC e fontes primárias. A minha ligação vem do outro lado do campo de batalha: passei de 1996 a 2000 na Cabletron Systems, rival direta da Bay Networks nas guerras de hubs e switches, e o portfólio corporativo descendente da Bay vive hoje na Extreme Networks, um dos fabricantes que eu ensino.",
    // Ending note (moved from localized.ts; the year stays in the English record).
    endedNote:
      "A Nortel entrou em proteção contra credores no Canadá, nos Estados Unidos e no Reino Unido em 14 de janeiro de 2009 e depois vendeu todos os negócios e as patentes; o último relatório anual, arquivado em março de 2012, descreve um encerramento das operações ainda em andamento. Nenhuma data única em que a empresa deixou de existir está registrada aqui. Os negócios seguem com os compradores, entre eles Ericsson, Avaya, Ciena, Radware e GENBAND.",
    // Complete translated profile; years, companies, founders, personal markers and careerLink href unchanged.
    profile: {
      slug: "nortel-bay",
      foundings: [
        {
          company: "Northern Electric and Manufacturing",
          year: 1895,
          place: "Montreal, Quebec",
          founders: ["Bell Telephone Company of Canada"],
          story:
            "Constituída em 7 de dezembro de 1895 com capital de 50.000 dólares, 93 por cento nas mãos da Bell Canada, a partir de um departamento mecânico que fabricava equipamento telefônico desde 1882. Por meio século, a Northern Electric fabricou projetos licenciados da Western Electric; um acordo antitruste de 1949 começou a cortar o cordão. Rebatizada Northern Telecom em março de 1976, fez a aposta mais ousada da indústria: o anúncio 'Digital World', a primeira linha completa de produtos de telecomunicações totalmente digitais, liderada pela central DMS-100, que carregaria a receita da empresa por quase quinze anos.",
        },
        {
          company: "SynOptics Communications",
          year: 1985,
          place: "Santa Clara, Califórnia",
          founders: ["Andrew K. Ludwick", "Ronald V. Schmidt"],
          story:
            "Fundada sobre o trabalho de Ethernet em cobre que Schmidt tinha desenvolvido no Xerox PARC, a SynOptics lançou Ethernet de 10 Mbit/s em par trançado antes do padrão e popularizou o hub Ethernet modular, a caixa que deixou a fiação comum, do tipo telefônico, transportar tráfego de LAN. Os seus hubs passaram a dominar os racks de rede corporativos no fim dos anos 1980 e no começo dos 1990: a revolução do cabeamento estruturado tinha uma empresa.",
        },
        {
          company: "Wellfleet Communications",
          year: 1986,
          place: "Bedford, Massachusetts",
          founders: ["Paul Severino", "Bill Seifert", "Steven Willis", "Jennifer Lamonakis", "David Rowe"],
          story:
            "A potência dos roteadores da Costa Leste: a Wellfleet construiu roteadores multiprotocolo que a tornaram a rival mais feroz da Cisco no começo, chegando em certo momento a até 20 por cento do mercado mundial de roteadores. A Fortune a classificou como a empresa de crescimento mais rápido dos Estados Unidos. Os roteadores de backbone BLN e BCN carregaram uma geração de WANs corporativas a partir de Billerica, Massachusetts.",
        },
      ],
      timeline: [
        { year: 1895, title: "Constituída a Northern Electric", detail: "7 de dezembro de 1895, Montreal: o braço industrial da Bell Canada vira empresa. A aposta 'Digital World' de 1976, a linha de comutação digital DMS, faria dela mais tarde uma potência global em equipamentos para operadoras." },
        { year: 1985, title: "Fundada a SynOptics; a Wellfleet vem em 1986", detail: "As duas metades da futura indústria de LANs aparecem com um ano de diferença: a SynOptics, com Ethernet em par trançado e o hub modular, em Santa Clara; a Wellfleet, com roteadores multiprotocolo, em Massachusetts." },
        { year: 1994, title: "Bay Networks: uma fusão entre iguais", detail: "SynOptics e Wellfleet se fundem num negócio de US$ 2,7 bilhões (anunciado em 6 de julho e concluído em 20 de outubro de 1994), batizado com o nome das duas baías à beira das quais ficavam as sedes: a baía de San Francisco e a baía de Massachusetts. O choque cultural entre as duas costas, com uma Cisco hiperconcentrada no meio, virou estudo de caso de alerta nas escolas de negócios.", sourceNote: "Estrutura da fusão conforme registros na SEC e a imprensa da época; a origem do nome conforme a história da Bay Networks." },
        { year: 1995, title: "A Bay compra a Centillion; a Nortel faz 100 anos", detail: "A Bay adquire a Centillion Networks (maio de 1995), fabricante de switches Token Ring e ATM cofundada por Bobby Johnson, que fundaria a Foundry um ano depois. No Canadá, a Northern Telecom adota a identidade enxuta 'Nortel' no seu centenário." },
        { year: 1996, title: "A NETGEAR nasce dentro da Bay", detail: "A Bay Networks cria em janeiro de 1996 uma divisão para residências e pequenas empresas chamada NETGEAR, separada como empresa independente em setembro de 1999, já sob a Nortel. A marca de redes de consumo das prateleiras do varejo de hoje é uma descendente da Bay Networks." },
        { year: 1998, title: "A Nortel compra a Bay por US$ 9,1 bilhões", detail: "Anunciado em 15 de junho de 1998: 0,60 ação da Nortel por ação da Bay, cerca de US$ 38,21 por ação, aproximadamente 134 milhões de novas ações da Nortel, com os acionistas da Bay ficando com cerca de 21 por cento da empresa combinada. O maior negócio de telecom e dados até então; a Nortel passa a se chamar Nortel Networks.", sourceNote: "Bay Networks SEC 8-K, 15 de junho de 1998." },
        { year: 2000, title: "O pico: a Alteon por US$ 7,8 bilhões", detail: "28 de julho de 2000: a Nortel concorda em comprar a Alteon WebSystems, pioneira de web switching de San Jose, com cerca de 500 funcionários, por um valor estimado de US$ 7,8 bilhões em ações. O e-mail do CEO Dominic Orr à equipe, às 4h53, anunciava o negócio fechado às 4h30 daquela manhã; a aquisição foi concluída em outubro de 2000. No mesmo ano, a Nortel chega a C$ 398 bilhões em valor de mercado (mais de um terço de toda a Toronto Stock Exchange), com 94.500 funcionários e a ação a C$ 124.", sourceNote: "Registros Form 425 da Alteon na SEC; Timeline of Nortel (Wikipedia)." },
        { year: 2002, title: "O tombo", detail: "Em agosto de 2002, o valor de mercado tinha caído de C$ 398 bilhões para menos de C$ 5 bilhões, e a ação de C$ 124 para C$ 0,47. Cerca de 60.000 empregos, dois terços da força de trabalho, são cortados entre 2001 e 2003." },
        { year: 2004, title: "O escândalo contábil", detail: "Um breve retorno fabricado à lucratividade dispara US$ 70 milhões em bônus para executivos; depois, o CEO Frank Dunn, o CFO e o controller são demitidos por justa causa quando vem à tona a manipulação de provisões. Processados em 2008, os três são absolvidos em janeiro de 2013; o dano à confiança nunca é reparado." },
        { year: 2009, title: "14 de janeiro: a maior quebra da história canadense", detail: "A Nortel pede proteção em três jurisdições ao mesmo tempo (o Chapter 11 nos Estados Unidos, a CCAA no Canadá, o Insolvency Act no Reino Unido), com um pagamento de juros de US$ 107 milhões vencendo no dia seguinte e cerca de US$ 2,3 bilhões em caixa. As ações são retiradas da TSX em junho, a 0,185 dólar. Uns 20.000 aposentados canadenses têm os benefícios cortados." },
        { year: 2009, title: "Começa o desmembramento", detail: "A Ericsson leva o negócio wireless de CDMA e LTE por US$ 1,13 bilhão (julho); a Avaya vence com o negócio Enterprise Solutions, a linhagem da Bay Networks, fechando em 18 de dezembro por US$ 943 milhões em dinheiro (US$ 933 milhões no valor final); a Ciena leva Metro Ethernet e óptico por US$ 530 milhões em dinheiro mais US$ 239 milhões em títulos; o negócio de GSM vai para a Ericsson e a Kapsch por US$ 103 milhões; e a Radware compra a linha de application delivery Alteon por US$ 18 milhões, uma desvalorização de 99,8 por cento sobre o preço que a Nortel pagou em 2000.", sourceNote: "Avaya 10-K FY2010; Timeline of Nortel (Wikipedia)." },
        { year: 2011, title: "Rockstar: a lápide de US$ 4,5 bilhões", detail: "Cerca de 6.000 patentes e pedidos de patente (wireless, 4G, óptico, dados, voz, semicondutores) vão a leilão em junho de 2011. O Google abre como stalking horse a US$ 900 milhões e dá lances com constantes matemáticas pelo caminho: US$ 1.902.160.540 (a constante de Brun), US$ 2.614.972.128 (Meissel-Mertens) e US$ 3,14159 bilhões (pi). O consórcio Rockstar (Apple, Microsoft, RIM, Ericsson, Sony, EMC) vence com US$ 4,5 bilhões, então a maior venda de patentes da história. Em 2014, cerca de 4.000 das patentes são revendidas à RPX por aproximadamente US$ 900 milhões.", sourceNote: "Timeline of Nortel (Wikipedia); cobertura do leilão na época." },
        { year: 2017, title: "O DNA da Bay chega à Extreme", detail: "A Avaya, ela mesma em Chapter 11, vende o seu negócio de redes (o portfólio de fabric e switching descendente da Bay Networks e da Nortel Enterprise) à Extreme Networks. Anunciado em 7 de março e concluído em 14 de julho de 2017: US$ 100 milhões no valor anunciado, US$ 79,8 milhões líquidos depois de ajustes. A linhagem da SynOptics e da Wellfleet continua viva num dos fabricantes que eu ensino.", sourceNote: "Extreme Networks 10-K e 10-Q FY2017." },
      ],
      products: [
        { name: "Comutação digital DMS e as linhas SL-1 / Norstar", what: "O portfólio 'Digital World': centrais DMS-100 atendendo até 100.000 linhas, mais os PABX digitais e os sistemas de ramais que puseram a Nortel em empresas do mundo todo." },
        { name: "LattisNet e as famílias de hubs SynOptics", what: "Ethernet em par trançado anterior ao padrão e os hubs modulares que cabearam a era do cabeamento estruturado: os racks de rede do começo dos anos 1990 estavam cheios deles." },
        { name: "Roteadores Wellfleet BLN / BCN", what: "Os roteadores de backbone multiprotocolo que fizeram da Wellfleet a principal rival da Cisco, levados adiante como a linha de roteadores da Bay (BayRS) até a Nortel." },
        { name: "Routing switches Accelar / Passport", what: "A linha de routing switches da Bay virou o Passport 8600 da Nortel e, na Avaya, o portfólio de fabric ERS e VSP: os produtos que a Extreme adquiriu em 2017." },
        { name: "Web switches Alteon", what: "Os content switches de camada 4-7 que a Nortel comprou por US$ 7,8 bilhões em 2000, vendidos à Radware por US$ 18 milhões em 2009 e ainda vendidos com o nome Alteon hoje." },
        { name: "NETGEAR", what: "Nascida como divisão da Bay Networks em janeiro de 1996 e separada em setembro de 1999: a marca de redes de consumo é a sobrevivente mais visível da linhagem." },
      ],
      innovations: [
        { title: "A aposta no totalmente digital", detail: "A Northern Telecom foi a primeira da sua indústria a anunciar e entregar uma linha completa de produtos de telecom totalmente digitais (1976): a onda DMS alimentou quinze anos de crescimento e fez da Nortel uma potência global em equipamentos." },
        { title: "Ethernet sobre fiação telefônica", detail: "A Ethernet em par trançado da SynOptics, anterior ao padrão, ajudou a tirar as LANs do coaxial e levá-las para o cabeamento estruturado: a camada física que o escritório moderno ainda usa." },
        { title: "O mercado de roteadores multiprotocolo", detail: "A Wellfleet provou que dava para enfrentar a Cisco (até 20 por cento do mercado mundial de roteadores) antes que as dificuldades de integração da fusão que criou a Bay entregassem a década à Cisco." },
        { title: "As patentes como desfecho", detail: "O ativo mais valioso da Nortel acabou sendo o seu arquivo: o leilão Rockstar, de US$ 4,5 bilhões, precificou as ideias acima de qualquer um dos negócios operacionais e mudou a forma como a indústria avaliava propriedade intelectual." },
      ],
      markets: [
        "No pico de 2000, a Nortel valia C$ 398 bilhões (mais de um terço de toda a Toronto Stock Exchange), com 94.500 funcionários. O colapso apagou cerca de 99 por cento desse valor em dois anos e terminou na maior quebra corporativa da história canadense.",
        "O DNA se espalhou na dissecação: wireless para operadoras na Ericsson, óptico na Ciena, a linha corporativa descendente da Bay na Avaya e depois na Extreme Networks (2017), a Alteon na Radware, a NETGEAR independente havia muito tempo, e as patentes, via Rockstar, na RPX. Quase todas as peças sobrevivem, só que em nenhum lugar sob o mesmo teto.",
      ],
      analyst: [
        "Cronologia da queda, conforme o registro público: de C$ 398 bilhões de valor de mercado em setembro de 2000 para menos de C$ 5 bilhões em agosto de 2002; de C$ 124 por ação para C$ 0,47; de 94.500 funcionários para cerca de 35.000 em dois anos de demissões.",
        "Os US$ 4,5 bilhões do leilão Rockstar foram cinco vezes o lance stalking horse de US$ 900 milhões do Google e, na época, a maior venda de patentes da história.",
      ],
      careerLink: {
        href: "/industry/chapters/cabletron-enterasys",
        label: "Lutei as guerras de hubs e switches do outro lado, na Cabletron (1996-2000): a página da Cabletron",
      },
    },
  },
  // Novell: record prose, ending note, successor label and the complete profile.
  "novell": {
    // Name: company kept, subtitle translated.
    name: "Novell - o sistema operacional de rede",
    tagline: "O NetWare dominou a era das LANs e o IPX fez os escritórios do mundo funcionarem; a linhagem terminou na OpenText em 2023.",
    intro:
      "Antes de o TCP/IP vencer, a rede corporativa falava IPX e fazia login no NetWare, e uma profissão inteira cresceu em torno das certificações Novell. A empresa que definiu o sistema operacional de rede passou depois duas décadas procurando um segundo ato: UnixWare, WordPerfect, SUSE, o pacto com a Microsoft e uma cadeia de aquisições que terminou na OpenText em 2023.",
    // Body paragraphs, same count and order as English.
    body: [
      "A fortuna da Novell veio de uma equipe que não fez o que lhe mandaram. Em 1983, o grupo Superset foi encarregado de construir um sistema de compartilhamento de disco para o CP/M, a plataforma para a qual a empresa então vendia hardware. A equipe julgou o CP/M condenado, ignorou a encomenda e construiu, em vez disso, um sistema de compartilhamento de arquivos para o recém-chegado PC compatível com IBM. Estavam certos, e a empresa que nasceu disso chegou a doze mil funcionários.",
      "Para testar a coisa, escreveram o Snipes, um jogo em modo texto jogado pela rede: uma das primeiras aplicações em rede que alguém escreveu, e um ancestral de todo título multiplayer que veio depois. O primeiro uso que alguém encontrou para uma rede local foi jogar uns contra os outros nela.",
      "O que o NetWare se tornou é difícil de exagerar agora que a categoria desapareceu. Uma participação de 63 por cento dos sistemas operacionais de rede pela medida mais comum, mais de 70 por cento por outras, e cerca de 90 por cento dos servidores baseados em PC antes da chegada do Windows NT Server em 1993. Mais de meio milhão de redes instaladas e mais de cinquenta milhões de usuários. A Novell era a segunda maior empresa de software para computadores pessoais do mundo, atrás apenas da Microsoft.",
      "Uma tática merece uma linha própria, porque reaparece pela direção oposta: a Novell vendia as próprias placas Ethernet, caras, a preço de custo, de propósito, para aumentar a base instalada na qual o seu software era vendido. Destruir a margem do hardware para ganhar a camada de cima é exatamente o que a Intel faria depois com o mercado de adaptadores do qual a 3Com vivia. A Novell fez isso primeiro, consigo mesma, de propósito.",
      "Ray Noorda cunhou o termo coopetition para alianças entre concorrentes que fazem um mercado crescer antes de dividi-lo, o que é uma descrição justa de como um protocolo proprietário virou o padrão da computação corporativa sem um órgão de normas por trás.",
      "O fim não veio de um sistema operacional de rede melhor. Veio do sistema operacional absorvendo a rede: quando arquivos e impressão passaram a estar no Windows, um produto separado para isso deixou de ser uma categoria. A resposta foi comprar um caminho até o desktop (a Unix System Laboratories em 1993, o WordPerfect e o Quattro Pro em 1994) e enfrentar a Microsoft onde a Microsoft era mais forte. O portfólio serpenteou pela SUSE e por uma cadeia de donos até a OpenText. O que sobrevive não é o software. É o formato do erro, que é defender uma categoria depois que a categoria se mudou.",
      "A profissão que cresceu em torno do produto tinha a sua própria escada, e a Novell a construiu antes de todo mundo. Pelo relato da própria empresa, ela foi pioneira da certificação de TI em 1986, com o programa Certified Novell Instructor, o CNI; o Certified NetWare Engineer, o CNE, veio em seguida (o comunicado da Novell de 1996 diz 1990, o de 1999 diz 1989, e os dois estão no registro), depois o Certified Novell Administrator, o CNA, em 1992, e o Master CNE em 1995. Em março de 1996, havia mais de 4.000 CNIs, 82.000 CNEs, 93.000 CNAs e 6.500 Master CNEs, formados em 1.450 Novell Authorized Education Centers e testados em mais de mil centros Sylvan Prometric, com o milionésimo exame aplicado em 1995; em 1999, a Novell contava mais de 150.000 CNEs e quase um milhão de certificações concedidas ou em andamento. O CNE foi, por uma década, aquilo sobre o que se construía uma carreira em redes, e todo o aparato de certificação de fabricantes ao qual servem os guias de estudo deste site descende dele.",
      "O arco do próprio NetWare está contado na sua entrada no glossário: a ideia de servidor de arquivos de 1983, o NetWare 286 independente de hardware, de 1986, o NetWare 386 em 1989, o serviço de diretório em 1993, a troca do protocolo central para TCP/IP no NetWare 5, em outubro de 1998 (o 'The market has spoken, and TCP/IP has won' de Eric Schmidt, ou seja, o mercado falou e o TCP/IP venceu), e o último service pack, o 6.5 SP8, em maio de 2009, com o Open Enterprise Server sobre o SUSE Linux levando os serviços adiante.",
    ],
    // Ending note (the year stays in the English record).
    endedNote:
      "Tornou-se subsidiária integral da Attachmate em 27 de abril de 2011, a US$ 6,10 por ação em dinheiro, logo depois de vender um portfólio de patentes à CPTN por US$ 450 milhões; o portfólio passou depois à OpenText.",
    // Successor link label (the URL stays in the English record).
    successorLabel: "OpenText, que detém o portfólio da Novell",
    // Complete translated profile; years, company and founders unchanged.
    profile: {
      slug: "novell",
      foundings: [
        {
          company: "Novell",
          year: 1983,
          place: "Provo, Utah",
          founders: ["Ray Noorda (reorganizing Novell Data Systems, f. 1979)"],
          story:
            "Antes de o TCP/IP vencer, a rede do escritório falava IPX e fazia login no NetWare. Ray Noorda assumiu em 1983 uma startup de hardware de Utah em dificuldades, jogou fora o hardware e apostou num software que transformava um PC em servidor de arquivos; e o NetWare virou o sistema operacional da própria era das LANs, chegando no auge a rodar a maioria das redes de escritório do mundo. Noorda cunhou 'coopetition', financiou metade do encanamento da indústria e construiu uma cultura de certificação (o CNE) que formou uma geração de engenheiros de rede, inclusive a geração do autor deste site.",
        },
      ],
      timeline: [
        { year: 1983, title: "Sai o NetWare", detail: "A Novell reorganizada por Noorda lança o sistema operacional de rede: serviços de arquivo e impressão sobre IPX/SPX que transformam ilhas de PCs em escritórios, o produto sobre o qual roda a década das LANs." },
        { year: 1993, title: "O NDS, e a cartada do Unix", detail: "O NetWare Directory Services entrega um diretório global anos à frente dos rivais, enquanto a Novell compra a Unix System Laboratories da AT&T, adquirindo os direitos autorais do Unix cujo destino posterior alimenta a saga judicial da SCO nos anos 2000." },
        { year: 1994, title: "O erro do WordPerfect", detail: "A aquisição do WordPerfect, por cerca de US$ 855 milhões, tenta construir uma rival em escala de Microsoft e fracassa rapidamente: vendido à Corel em 1996, enquanto a própria franquia do NetWare fica sob o cerco do Windows NT." },
        { year: 2003, title: "A virada para o Linux: SUSE", detail: "A Novell compra a SUSE e a Ximian e se refaz como empresa de Linux corporativo; o polêmico pacto de interoperabilidade com a Microsoft, em 2006, define o seu último ato independente." },
        { year: 2011, title: "Nas mãos dos consolidadores", detail: "A Attachmate adquire a Novell por cerca de US$ 2,2 bilhões, separando a SUSE; a Micro Focus engole a Attachmate em 2014, e os descendentes do NetWare viram produtos em modo de manutenção no portfólio de uma compradora." },
        { year: 2023, title: "A última bandeira: OpenText", detail: "31 de janeiro de 2023: a OpenText conclui a aquisição da Micro Focus, o último pouso corporativo da linhagem que um dia fez as LANs do mundo funcionarem.", sourceNote: "Fechamento da OpenText conforme o registro do negócio." },
      ],
      products: [
        { name: "NetWare", what: "O sistema operacional de rede por excelência da era das LANs: serviços de arquivo, impressão e, depois, diretório que definiram o que era um servidor." },
        { name: "NDS / eDirectory", what: "O serviço de diretório que chegou ao mercado sete anos antes do Active Directory: o ancestral da identidade na era das LANs." },
        { name: "IPX/SPX", what: "A suíte de protocolos que uma geração inteira configurou antes de o TCP/IP varrer o campo." },
      ],
      innovations: [
        { title: "A categoria do sistema operacional de rede", detail: "A Novell definiu o servidor como categoria de produto e a LAN como algo administrado: a descrição do cargo de administrador de redes é, em grande parte, invenção da Novell." },
        { title: "A certificação como indústria", detail: "O programa CNE construiu o modelo (currículo, exames, escada de carreira) do qual descende toda certificação de fabricante desde então, inclusive o mundo de ensino deste site." },
      ],
      markets: [
        "Os mercados da Novell foram absorvidos pelo Windows Server e pelo TCP/IP; a herança de diretório persiste em nichos sob a OpenText, e o seu verdadeiro legado é a cultura do profissional certificado sobre a qual a indústria inteira roda hoje.",
      ],
      analyst: [
        "A líder indiscutível das avaliações de sistemas operacionais de rede por uma década, e depois o caso de manual de um rei de categoria que perde a guerra de plataforma acima da sua categoria.",
      ],
    },
  },
  // Olitel: record prose only (no profile).
  "olitel": {
    // Name has no subtitle: kept verbatim so the record reports complete.
    name: "Olitel",
    // Card line and page intro.
    tagline: "Faz os telefones dos outros funcionarem há quarenta anos, atravessando quatro tecnologias incompatíveis.",
    intro:
      "O Grupo Olitel (Olitel Brasil S/A e Olibras Telecomunicações) é uma integradora de tecnologia de comunicações de São Paulo, de capital inteiramente brasileiro, com cerca de setenta funcionários. A empresa informa ter de 43 a 44 anos em 2024-25, o que situa a fundação por volta de 1981; o seu perfil no LinkedIn diz 36 anos, o que a colocaria em 1989-90. Esta entrada segue o número da própria empresa e registra a discrepância em vez de escondê-la.",
    // Body paragraphs, same count and order as English.
    body: [
      "Se a data mais antiga estiver certa, o intervalo é a história. Uma empresa fundada por volta de 1981 nas comunicações brasileiras começou a trabalhar antes de a reserva de mercado da informática virar lei, em 1984, bem antes da privatização do sistema Telebrás, em 1998, e cerca de quinze anos antes de alguém vender voz sobre IP a uma empresa. Cada uma dessas reviravoltas tem a sua própria entrada nesta linha do tempo. Esta empresa atravessou todas elas.",
      "E o fio condutor é uma única função sem glamour, executada de quatro maneiras incompatíveis. Fazer os telefones de uma organização funcionarem significou, em sequência: PABX com aparelhos proprietários e fiação física de ramais; PABX digital com integração computador-telefonia acoplada; telefonia IP, em que o telefone virou um endpoint da rede de dados e a equipe de telefonia perdeu o seu império particular para a equipe de redes; e agora comunicações unificadas entregues como serviço, em que a plataforma é de outra pessoa e o trabalho do integrador é se conectar a ela. O requisito do cliente nunca mudou. A habilidade necessária para atendê-lo mudou completamente, quatro vezes.",
      "Esse é o verdadeiro risco de carreira nesta indústria, e vale dizê-lo com todas as letras. Ninguém, em 1981, perdeu o emprego pela chegada da telefonia IP. Perdeu por não aprendê-la; e o intervalo entre uma tecnologia ficar visível e ficar obrigatória tem sido em geral de cerca de uma década, longo o bastante para ser ignorado com conforto e curto o bastante para pegar alguém desprevenido. Uma empresa que sobrevive a quatro dessas transições requalificou o seu pessoal quatro vezes, o que é uma conquista mais difícil do que qualquer produto que ela venda.",
      "O portfólio atual reflete a quarta transição: comunicações unificadas e contact center entregues como serviço, telefones de mesa e SIP, headsets, videoconferência, gravação de chamadas, workforce management, bilhetagem e tarifação, cabeamento estruturado e integração com plataformas de atendimento ao cliente baseadas em IA generativa. Entre os parceiros estão a Twilio e a Yealink.",
      "Um detalhe é um mecanismo de confiança de um tipo conhecido. A empresa tem uma certificação TRACE, uma credencial de due diligence anticorrupção emitida por terceiros. Para um negócio que vende infraestrutura de comunicações a grandes empresas brasileiras, é um sinal deliberado, e funciona exatamente como as certificações e normas neutras em outros pontos desta linha do tempo: uma afirmação que não valeria nada vinda da própria empresa passa a valer alguma coisa quando um órgão externo a faz. O assunto muda; o mecanismo é idêntico.",
    ],
  },
  // The OpenNMS Group: record prose and ending note (no profile).
  "opennms-group": {
    // Name: company and product kept verbatim; the subtitle is the product name, so nothing to translate.
    name: "The OpenNMS Group - OpenNMS",
    tagline: "Uma das plataformas open source de gerenciamento de redes mais antigas, iniciada em 1999, com uma empresa por trás desde 2004 e a NantHealth como dona desde 2020.",
    intro:
      "O OpenNMS é uma plataforma livre e open source de monitoramento e gerenciamento de redes escrita em Java (gestão de falhas, coleta de dados de desempenho, monitoramento de serviços, processamento de eventos e mapeamento de topologia), iniciada em julho de 1999 por Steve Giles, Brian Weaver e Luke Rindfuss na empresa deles, a PlatformWorks, e registrada no SourceForge como projeto 4141 em março de 2000, cerca de dois meses depois do projeto que virou o Nagios. A OpenNMS Group, a empresa que oferece suporte comercial, treinamento e a distribuição corporativa Meridian, foi fundada em setembro de 2004 por Tarus Balog, Matt Brozowski e David Hustace.",
    // Body paragraphs, same count and order as English.
    body: [
      "O projeto quase morreu duas vezes antes de a empresa existir. A PlatformWorks foi comprada em 28 de setembro de 2000 pela Atipa, uma fabricante de sistemas Linux de Kansas City que mudou o nome para Oculan em julho de 2001, e em setembro de 2002 a Oculan deixou de apoiar o OpenNMS. Tarus Balog, então funcionário da Oculan, saiu para continuar o projeto de forma independente e, dois anos depois, fundou a OpenNMS Group com Brozowski e Hustace. A Order of the Green Polo foi criada pouco depois para governar o projeto separadamente do negócio comercial.",
      "Desse arranjo saíram duas linhas de versões: a Horizon, a versão da comunidade com os recursos novos, e a Meridian, a versão corporativa com ciclos de suporte mais longos, ambas sob a AGPLv3. A descrição que a plataforma faz de si mesma é a afirmação mais antiga desta categoria (a primeira plataforma do mundo de monitoramento de serviços de rede de nível corporativo totalmente open source), e a lista de prêmios vai do LinuxWorld 2006 ao Best of Open Source da InfoWorld em 2015.",
      "Em 22 de julho de 2020, a NantHealth concluiu a aquisição da OpenNMS Group, então sediada em Morrisville, Carolina do Norte, com David Hustace como presidente-executivo, chamando-a de principal empresa de gerenciamento de redes open source do mundo, com clientes que incluíam três empresas da Fortune 100; nenhum termo foi divulgado. A página institucional da empresa hoje informa um endereço em Lewisville, Texas, e a NantHealth como controladora. Uma empresa de tecnologia para saúde ser dona de uma plataforma de monitoramento de redes é uma combinação incomum; o comunicado descreve a plataforma como atendendo clientes de saúde, tecnologia, finanças e governo.",
    ],
    // Ending note (the year stays in the English record).
    endedNote:
      "Adquirida pela NantHealth; a transação foi concluída em 22 de julho de 2020 e anunciada de Culver City em 27 de julho de 2020, sem divulgação de termos. O OpenNMS continua como empresa da NantHealth, com site próprio.",
  },
  // Paessler: record prose and the complete profile.
  "paessler": {
    // Name has no subtitle: kept verbatim so the record reports complete.
    name: "Paessler",
    // Card line and page intro.
    tagline: "PRTG: o padrão de monitoramento de redes do mercado intermediário.",
    intro:
      "A Paessler desenvolve o PRTG, a plataforma de monitoramento baseada em sensores que milhares de equipes de TI usam como painel único para a saúde da rede, dos servidores e da infraestrutura.",
    // Body paragraphs, same count and order as English.
    body: [
      "A Red Education oferece Paessler nas suas cinco agendas regionais, ministrando o treinamento oficial de PRTG, que transforma a ferramenta que a maioria dos administradores aprende por osmose numa disciplina ensinada como se deve.",
      "Fundada em 1997 por Dirk Paessler em Nuremberg, na Alemanha, a empresa se manteve focada e independente por quase três décadas, uma trajetória cada vez mais rara neste catálogo de aquisições. O modelo de sensores do PRTG tornou o monitoramento acessível para equipes sem um orçamento de ferramentas do tamanho da sua rede.",
    ],
    // Complete translated profile; years, company and founders unchanged.
    profile: {
      slug: "paessler",
      foundings: [
        {
          company: "Paessler",
          year: 1997,
          place: "Nuremberg, Alemanha",
          founders: ["Dirk Paessler"],
          story:
            "A Paessler começou do jeito que as empresas alemãs de engenharia começam: com um estudante irritado com uma ferramenta. Dirk Paessler, que escrevia software para o buscador Fireball em 1997, construiu o Webserver Stress Tool quando o próprio código vivia derrubando servidores; depois, precisando monitorar uma rede em crescimento e recusando-se a enfrentar as sete páginas de instruções de instalação do MRTG, escreveu em vez disso o PRTG Traffic Grapher (o próprio nome, uma reverência ao MRTG). A Paessler GmbH veio em 22 de agosto de 2001, a AG em 2005, e a empresa cresceu de um projeto de estudante a meio milhão de usuários em 190 países sem nenhum venture capital: a contra-história do Mittelstand diante de todo fabricante movido a rodadas de investimento nestas páginas.",
        },
      ],
      timeline: [
        { year: 1997, title: "Um estudante, uma visão, uma garagem", detail: "O trabalho de Dirk Paessler no Fireball gera o Webserver Stress Tool, o precursor, e a frustração com o MRTG que viraria o PRTG." },
        { year: 2001, title: "Paessler GmbH", detail: "Fundada em 22 de agosto de 2001; o PRTG Traffic Grapher e o IPCheck Server Monitor são vendidos como shareware enquanto a empresa passa da sala de estar para um escritório." },
        { year: 2008, title: "PRTG Network Monitor", detail: "O Traffic Grapher e o IPCheck se fundem no PRTG Network Monitor 7: um produto, sensores para tudo, licenciado pelo número de sensores, o formato que o PRTG mantém até hoje. A empresa tinha se mudado para Nuremberg, perto do castelo, no ano anterior." },
        { year: 2018, title: "O fundador dá um passo atrás", detail: "Dirk Paessler passa adiante o cargo de CEO (Christian Twardawa e, depois, Helmut Binder em 2019), com a empresa já acima de 300 pessoas: ainda de propriedade da família e dos funcionários, ainda só de monitoramento, por estratégia explícita." },
        { year: 2024, title: "Turn/River: o primeiro capital externo", detail: "23 de maio de 2024: a Turn/River Capital faz um investimento estratégico; depois de 27 anos de crescimento puramente orgânico até mais de 500.000 usuários, é o primeiro dinheiro institucional da história da empresa, abrindo o capítulo de expansão para OT e para o mercado corporativo.", sourceNote: "Anúncio conjunto Paessler/Turn-River." },
      ],
      products: [
        { name: "PRTG Network Monitor", what: "O carro-chefe: monitoramento sem agente por sensores (SNMP, WMI, NetFlow, packet sniffing, HTTP e centenas de outros), com mapas, alertas e relatórios numa única instalação." },
        { name: "PRTG Enterprise Monitor", what: "A edição para grandes ambientes: escala horizontal com vários servidores e o ITOps Board por cima." },
        { name: "PRTG Hosted Monitor", what: "O mesmo motor como serviço hospedado: monitoramento sem ser dono do servidor de monitoramento." },
      ],
      innovations: [
        { title: "Um monitoramento de que o administrador realmente gosta", detail: "A aposta do PRTG foi a usabilidade: descoberta automática, padrões sensatos e uma interface que um administrador generalista conseguia dominar; monitoramento de redes como produto, não como projeto." },
        { title: "A prova do crescimento orgânico", detail: "Meio milhão de usuários em 190 países sem financiamento de venture capital por 27 anos: evidência de que um foco disciplinado em produto pode construir um fabricante global só com receita." },
      ],
      markets: [
        "O padrão de monitoramento das pequenas e médias empresas, expandindo-se para cima e para ambientes de OT e industriais, contra SolarWinds, ManageEngine e as pilhas open source, com o licenciamento baseado em sensores como marca registrada.",
      ],
      analyst: [
        "Presença constante nas listas de recomendação de monitoramento de redes e nas avaliações do mercado intermediário: mais a referência de usabilidade da categoria do que a líder em número de recursos.",
      ],
    },
  },
  // Proteon: record prose only (no profile).
  "proteon": {
    // Name: company kept, subtitle translated.
    name: "Proteon - o token ring, e o caminho não tomado",
    tagline: "Uma alternativa séria à Ethernet, construída por gente que achava que o acesso determinístico importava mais do que a simplicidade.",
    intro:
      "A Proteon, de Westborough, Massachusetts, construiu equipamentos de rede token ring e roteadores durante o período em que a disputa das redes locais ainda estava realmente aberta. A passagem de token dá a uma rede uma propriedade que a Ethernet não tem: uma espera máxima limitada no pior caso, porque uma estação só transmite quando detém o token.",
    // Body paragraphs, same count and order as English.
    body: [
      "A Proteon foi fundada em Westborough, Massachusetts, em 1972, por Howard Salwen, como uma consultoria em comunicações, e não como fabricante. Virou fabricante por causa de um contrato: no começo de 1979, o Laboratory for Computer Science do MIT pagou cem mil dólares para que ela construísse a segunda versão da sua Local Network Interface token ring, com o raciocínio de que comprar seria mais rápido do que construir. A entrega de placas funcionando levou até junho de 1981, o que é uma correção útil ao modo como essas histórias costumam ser contadas.",
      "O que saiu disso foi o ProNET-10, uma rede de passagem de token de dez megabits lançada em junho de 1981: os primeiros produtos Token Ring comerciais, anos antes de a IBM anunciar os seus, em meados dos anos 1980. A empresa então fez algo de maior consequência e menos lembrado: em 1986, lançou o p4200, o primeiro roteador multiprotocolo disponível comercialmente, construído sobre o roteador multiprotocolo do MIT com código escrito por Noel Chiappa. E produziu o OSPF, o protocolo link-state que ainda é o protocolo de roteamento interno rodando dentro de uma grande parte das redes corporativas hoje.",
      "Nada disso a salvou, e os números dizem por quê. Em 1990, a IBM detinha 57,7 por cento do mercado de adaptadores Token Ring de quatro megabits e 92,6 por cento do de dezesseis megabits, deixando para a Proteon e a Madge, as duas principais independentes, cerca de dez por cento cada. Ser a segunda depois da IBM num mercado que a IBM definiu não é uma posição, é uma sala de espera. Os resultados de 1987 mostram a pressão diretamente: 22,3 milhões de dólares em vendas, alta de quinze por cento, contra um prejuízo de 5,7 milhões, um terço de tudo o que os investidores de venture capital tinham posto.",
      // Corrected 2026-10-26 (endings apply), mirroring the English: a rename by shareholder vote, not a relaunch.
      "Em junho de 1998, a empresa mudou o próprio nome para OpenROUTE Networks, por votação dos acionistas, e daí passou por Netrix, NX Networks e NSGDatacom. A leitura que vale guardar é sobre quais invenções sobrevivem aos seus inventores. O hardware da Proteon desapareceu completamente e o seu protocolo está em produção em centenas de milhares de equipamentos, porque uma especificação pode ser implementada por qualquer um, enquanto um produto precisa ser comprado de você.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "Os acionistas da Proteon aprovaram a mudança do nome da empresa para OpenROUTE Networks, Inc. em 10 de junho de 1998, e a empresa passou a operar com esse nome.",
  },
  // RCX: record prose only (no profile).
  "rcx": {
    // Name has no subtitle: kept verbatim so the record reports complete.
    name: "RCX",
    // Card line and page intro.
    tagline: "Parceira Fortinet de nível Expert no Brasil.",
    intro: "Pequena integradora de Porto Alegre com nível Expert na Fortinet em SASE e SD-WAN.",
    // Body paragraphs, same count and order as English.
    body: [
      "A RCX Network Servicos de Informatica está registrada como microempresa, e a combinação desse porte jurídico com um grau de nível Expert é o que vale registrar. O nível se conquista com engenheiros certificados e se mantém com receita, então uma empresa muito pequena que o alcança concentrou as suas certificações em vez de espalhá-las: duas especializações nomeadas, em profundidade, em vez de um portfólio amplo e raso.",
      "É uma estratégia viável neste mercado e é o oposto da estratégia de distribuidor descrita em outros pontos deste catálogo. Uma casa deste porte não ganha pela amplitude nem pelo crédito; ganha porque as duas coisas que faz são as duas coisas que um cliente específico precisa que sejam bem feitas.",
    ],
  },
  // SixDegrees.com: record prose and ending note (no profile).
  "sixdegrees": {
    // Name has no subtitle: kept verbatim so the record reports complete.
    name: "SixDegrees.com",
    // Card line and page intro.
    tagline: "A primeira rede social, e ela fracassou porque ainda não havia gente suficiente online.",
    intro:
      "O SixDegrees.com é amplamente reconhecido como o primeiro site de rede social: o primeiro a combinar um perfil de usuário, uma lista visível de amigos e a possibilidade de navegar pelas conexões das outras pessoas. Andrew Weinreich o fundou em maio de 1996 e o lançou em 1997, batizando-o com a ideia dos seis graus de separação.",
    // Body paragraphs, same count and order as English.
    body: [
      "Os recursos parecem banais hoje porque todo mundo os copiou. Os usuários podiam criar um perfil, listar amigos e familiares, convidar pessoas que ainda não eram membros, mandar mensagens e publicar para quem estava no seu primeiro, segundo e terceiro graus, e, algo incomum, ver como estavam conectados a qualquer outro membro.",
      "Weinreich depositou a primeira patente sobre redes sociais, 'Method and apparatus for constructing a networking database and system' (método e aparelho para construir um banco de dados e sistema de rede de relacionamentos), conhecida em geral como a patente Six Degrees.",
      "Chegou a cerca de 3,5 milhões de usuários, o que soa como sucesso e não era suficiente. O problema era estrutural: uma rede social só é útil se as pessoas que você conhece estão nela, e no fim dos anos 1990 a maioria das pessoas simplesmente não estava online. Milhões de usuários espalhados por um mundo mal conectado produziram pouco engajamento.",
      "Foi vendido à YouthStream Media Networks em dezembro de 2000 e fechado em 2001, três anos antes do Facebook. A ideia estava certa e a infraestrutura ainda não tinha chegado, o que é um tipo de fracasso diferente do da AltaVista, e que vale guardar ao lado dele.",
    ],
    // Ending note, mirrored as written (its dates differ from body[3]; see NOTES).
    endedNote:
      "Comprado pela YouthStream Media Networks em dezembro de 1999 por US$ 125 milhões e fechado cerca de um ano depois, em 30 de dezembro de 2000.",
  },
  // Kyndryl Cloud Uplift (formerly Skytap): record prose only (no profile).
  "skytap": {
    // Name: the company segment is kept exactly as written (it contains "formerly"); only the subtitle is translated.
    name: "Kyndryl Cloud Uplift (formerly Skytap) - o laboratório é a parte difícil",
    tagline: "Plataforma de ambientes em nuvem fundada em 2006 como Skytap por pesquisadores universitários, muito usada para laboratórios virtuais de treinamento; hoje Kyndryl Cloud Uplift.",
    intro:
      "A Skytap foi fundada em Seattle em 2006, como Illumita, por três professores da University of Washington que pesquisavam virtualização e um aluno de pós-graduação. Ela oferece ambientes em nuvem self-service usados para desenvolvimento, testes e laboratórios virtuais de treinamento. A Kyndryl a adquiriu em 2024 e hoje a oferece como Kyndryl Cloud Uplift.",
    // Body paragraphs, same count and order as English.
    body: [
      "A própria documentação mostra do que um laboratório de treinamento precisa. Cada ambiente tem uma rede privada separada, isolada de todas as outras, de modo que os ambientes podem usar endereços idênticos ou sobrepostos e cópias idênticas podem rodar lado a lado: uma por aluno. Um curso sobre máquinas virtuais precisa de máquinas; um curso de redes precisa de uma topologia, com os seus domínios de broadcast, links com tag, adjacências de roteamento e falhas provocadas de propósito, e de uma cópia dela para cada pessoa na sala.",
      "O laboratório é a metade cara do treinamento técnico, e a metade que ninguém vê na descrição de um curso. Equipamentos que reproduzem um ambiente de produção, por aluno, disponíveis na hora em que a aula começa e destruídos depois, são um problema mais difícil do que o ensino, e decidem o que pode honestamente ser ensinado.",
      "Ela também é incomum no que roda. Ao lado de servidores comuns, suporta AIX e IBM i em hardware Power: os sistemas que continuam operando em bancos e seguradoras muito depois de a indústria ter parado de escrever sobre eles. Esses ambientes ainda precisam de gente que saiba operá-los, e as pessoas são treinadas onde os sistemas estão. Sob a Kyndryl, isso virou a manchete: a página do Kyndryl Cloud Uplift abre com a migração de workloads IBM Power para o Azure sem reescrevê-los.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A Kyndryl anunciou em 13 de maio de 2024 que havia adquirido a Skytap, cuja plataforma hoje vende como Kyndryl Cloud Uplift.",
  },
  // SpiderLabs: record prose only (no profile).
  "spiderlabs": {
    // Parent note (official.parent.note), added 26/10/2026 with the parents apply; name, slug and year stay English facts.
    parentNote: "Uma divisão, não uma empresa: a SpiderLabs veio com a Trustwave quando a LevelBlue concluiu essa aquisição, em 19 de agosto de 2025, e hoje opera como LevelBlue SpiderLabs.",
    // Name has no subtitle: kept verbatim so the record reports complete.
    name: "SpiderLabs",
    // Card line and page intro.
    tagline: "A equipe de pesquisa, testes e resposta a incidentes da Trustwave, mantida com nome próprio através de três donos.",
    intro:
      "A SpiderLabs é a equipe de pesquisa, testes de invasão, threat hunting e resposta a incidentes que a Trustwave construiu e que a LevelBlue hoje apresenta como LevelBlue SpiderLabs. Não é nem nunca foi uma empresa; está neste registro porque é a parte da Trustwave que a indústria conhece pelo nome, e porque esse nome sobreviveu aos donos.",
    // Body paragraphs, same count and order as English.
    body: [
      "A descrição que a Trustwave fazia da equipe em janeiro de 2011 já parece a de uma prática madura: uma equipe avançada de segurança focada em forense, hacking ético e testes de segurança de aplicações, com centenas de investigações forenses e milhares de exercícios de hacking ético nas costas, uma equipe de pesquisa produzindo ferramentas de prova de conceito e membros palestrando na Black Hat, na DEF CON, na OWASP e no SANS. Uma ficha técnica de 2014 contava mais de cem pessoas em mais de dez países; uma descrição de 2022 as organiza em quatro equipes (Security Research, Security Testing, Threat Hunting e Digital Forensics and Incident Response), que publicam mais de cinquenta blogs e advisories por ano e divulgam dezenas de vulnerabilidades de fabricantes, com ferramentas como Responder, SocialMapper e CrackQ liberadas para a área.",
      "Quando a LevelBlue concluiu a aquisição da Trustwave, em 19 de agosto de 2025, o seu comunicado chamou a SpiderLabs de equipe de elite da Trustwave que fornece pesquisa de ameaças, inteligência e threat hunting, e as páginas da LevelBlue hoje trazem o nome como LevelBlue SpiderLabs. O ano de fundação da equipe não aparece em nenhum documento lido para este registro, e o card não traz ano em vez de trazer um inventado.",
      "Por que ela pertence a um registro de redes: os nomes que sobrevivem a aquisições são os que têm reputação própria, e uma equipe de pesquisa cujos advisories, ferramentas e relatórios foram citados por duas décadas é o tipo de unidade que um comprador mantém e um leitor reconhece.",
    ],
  },
  // Supermicro: record prose only (no profile).
  "supermicro": {
    // Name: company kept, subtitle translated.
    name: "Supermicro - o hardware por baixo da marca de outra pessoa",
    tagline: "Muita infraestrutura é construída sobre placas cujo fabricante não aparece no painel frontal.",
    intro:
      "A Supermicro fornece servidores, placas-mãe e sistemas, frequentemente como a base física de produtos vendidos com outros nomes. Essa posição, a do fabricante por trás do appliance, é comum em redes e segurança e quase nunca visível para as pessoas que operam o resultado.",
    // Body paragraphs, same count and order as English.
    body: [
      "A Supermicro foi fundada em San Jose em setembro de 1993 por Charles Liang, com Sara Liu e Wally Liaw. Liang nasceu em Chiayi, Taiwan, deixou um cargo de professor na própria universidade nos anos 1980 rumo ao Vale do Silício e tinha passado os dois anos anteriores dirigindo uma empresa de projeto de placas-mãe. Pelo relato dele, o novo negócio era lucrativo em seis meses, e assinou a sua primeira parceria de distribuição europeia no ano da fundação.",
      "Durante a maior parte da sua vida, foi a metade sem glamour da indústria: placas-mãe, gabinetes e subsistemas, vendidos pela engenharia e não pela marca, para compradores que especificavam máquinas em vez de comprá-las prontas. Essa posição pareceu um teto por quase três décadas. Virou o oposto quando a demanda se deslocou para a computação acelerada, densa e faminta de energia, e a empresa informou receita de quase 22 bilhões de dólares em 2025, com cerca de 6.200 funcionários.",
      "Uma decisão dentro dessa história merece ser destacada. Ela começou a desenvolver servidores com eficiência energética em 2004, bem antes de a energia ser critério de compra para a maioria dos compradores, e a fabricar em Taiwan a partir de 2012. Construir pensando em eficiência antes do mercado é uma aposta que só se paga se o mercado acabar chegando, e no hardware de datacenter ele chegou: energia e refrigeração viraram a restrição que decide o que pode ser instalado.",
      "A lição para quem lê uma linha do tempo de tecnologia é sobre onde o valor fica ao longo do tempo. Uma empresa de componentes competindo em engenharia pareceu estrategicamente inferior a uma marca por cerca de trinta anos, e então a camada que ela ocupava virou a escassa. A posição numa pilha não é permanente, e a camada que é tediosa num ciclo é com frequência a restrição no seguinte.",
    ],
  },
  // Tandy and RadioShack: record prose, ending note and the complete profile.
  "tandy-radioshack": {
    // Name has no subtitle: kept verbatim so the record reports complete.
    name: "Tandy and RadioShack",
    // Card line and page intro.
    tagline: "Vendeu três vezes mais que a Apple com um computador pior, porque tinha sete mil lojas.",
    intro:
      "Em 1975, Don French, comprador da RadioShack na Costa Oeste, comprou um MITS Altair para controlar o estoque e ficou fascinado o bastante para começar a projetar o seu. Passou um ano convencendo John Roach, então vice-presidente de fabricação, de que uma rede de lojas de eletrônicos deveria vender um computador. Em novembro de 1976, contrataram um rapaz de 24 anos da National Semiconductor chamado Steve Leininger (membro do Homebrew Computer Club, como Jobs e Wozniak) para projetá-lo.",
    // Body paragraphs, same count and order as English.
    body: [
      "O protótipo foi demonstrado a Charles Tandy em fevereiro de 1977, rodando um programa de contabilidade fiscal. O próprio Tandy era um texano que tinha construído o negócio a partir da empresa de couro do pai, em Fort Worth; a rede de eletrônicos foi uma aquisição que cresceu mais do que todo o resto.",
      "Roach se comprometeu a fabricar 3.000 unidades, número escolhido porque correspondia ao número de lojas RadioShack: se nunca vendessem nenhuma, cada loja poderia usar a sua para a contabilidade. Leininger defendeu pelo menos 50.000 e riram dele. O TRS-80 foi anunciado em 3 de agosto de 1977 e vendeu cerca de 50.000 no primeiro mês.",
      "Era, pelos próprios méritos, o mais fraco do que a revista Byte batizou de 1977 Trinity. O Apple II tinha gráficos coloridos e slots de expansão; o Commodore PET tinha um projeto integrado; o TRS-80 tinha um Zilog Z80 escolhido porque custava US$ 25, um gravador cassete da prateleira da loja para armazenamento e reclamações de qualidade inteiramente justificadas. Também custava cerca de metade do preço de um Apple II.",
      "E venceu, por anos. Em 1979, tinha a maior biblioteca de software do mercado de microcomputadores. Em 1980, a Tandy despachou três vezes mais computadores do que a Apple. A RadioShack foi a maior varejista de computadores pessoais do mundo até 1982, com 7.000 lojas declaradas em 40 países.",
      "O motivo é a lição inteira: todos os outros vendiam computadores por reembolso postal ou por meio de um punhado de revendas especializadas, e a Tandy os vendia numa prateleira pela qual os clientes já passavam. A RadioShack só adotou o formato de superloja em 1991, quando a vantagem já tinha se invertido: compatíveis IBM e o Macintosh eram vendidos em todo lugar, e estar nas próprias lojas já não era estar em todo lugar. A Tandy saiu da fabricação de computadores em maio de 1993.",
      "Vale a pena se demorar nisso, porque o padrão se repete o tempo todo e costuma ser descrito ao contrário. A Tandy não venceu a Apple na tecnologia; venceu no alcance, e depois perdeu quando o alcance virou commodity. Quem já trabalhou em distribuição reconhece as duas metades disso.",
    ],
    // Ending note (the year stays in the English record).
    endedNote:
      "A Tandy saiu da fabricação de computadores em maio de 1993, vendendo o negócio à AST. A rede RadioShack continuou por muito tempo depois que as máquinas pararam.",
    // Complete translated profile; years, company and founders unchanged.
    profile: {
      slug: "tandy-radioshack",
      foundings: [
        {
          company: "Hinckley-Tandy Leather",
          year: 1919,
          place: "Fort Worth, Texas",
          founders: ["Norton Hinckley", "Dave L. Tandy"],
          story:
            "Um negócio de fornecimento de couro, cuja ideia mais lucrativa acabou sendo kits de artesanato vendidos a escoteiros e campistas. Esse é o padrão sobre o qual a empresa inteira funciona: encontrar pessoas que já fazem coisas e vender a elas as peças.",
        },
      ],
      timeline: [
        { year: 1963, title: "Uma rede falida por US$ 300.000", detail: "A RadioShack era nove lojas e um negócio de reembolso postal em Boston, perto de quebrar. A recuperação foi brutal e rápida: as linhas de estoque cortadas de cerca de quarenta mil para dois mil e quinhentos itens, um depósito exigido nas vendas a crédito e depois o crédito abolido de vez. Era lucrativa em menos de dois anos.", sourceNote: "As fontes dão 1962 e 1963 para a compra; as duas datas aparecem em relatos respeitáveis." },
        { year: 1978, title: "Morre Charles Tandy", detail: "De forma inesperada, no ano seguinte ao lançamento do TRS-80 e antes que alguém soubesse se o negócio de computadores ia dar certo." },
        { year: 1984, title: "De dezenove por cento para menos de nove", detail: "A participação no mercado de computadores pessoais caiu mais ou menos pela metade em poucos anos, e o motivo apontado na época não foi preço nem desempenho. Foi que as máquinas só rodavam software escrito para elas." },
      ],
      products: [
        { name: "A linha TRS-80", what: "O Model I e os seus sucessores, vendidos nas lojas e não por revendas, e por vários anos os computadores pessoais mais vendidos do mundo." },
        { name: "Todo o resto da loja", what: "Componentes, cabos, pilhas, kits e as peças que ninguém mais tinha em estoque: o negócio que fazia a rede valer a pena e que sobreviveu aos computadores por duas décadas." },
        { name: "Trinta e quatro fábricas", what: "A Tandy fabricava os próprios produtos, de fios a microchips, em plantas que lhe pertenciam. A varejista era fabricante, o que fazia as margens funcionarem e o que acabou lhe custando o mercado de computadores." },
      ],
      innovations: [
        { title: "Vender peças a quem faz coisas", detail: "Kits de couro para escoteiros, depois componentes para hobbistas de rádio, depois computadores para quem queria programá-los. O cliente era sempre alguém construindo algo, e a loja era sempre o lugar aonde ia buscar a peça que faltava." },
        { title: "Ser dono da cadeia inteira", detail: "Marca própria sempre que possível, fabricação interna sempre que possível, venda só nas próprias lojas. É uma doutrina coerente, resgatou uma varejista que estava quebrando e produziu margens que ninguém mais em eletrônicos de consumo conseguia igualar." },
        { title: "E então a doutrina se inverteu", detail: "A mesma política aplicada aos computadores significava que software escrito para um TRS-80 rodava num TRS-80. Enquanto a Apple e o mundo compatível com IBM acumulavam aplicações de terceiros de qualquer um que se dispusesse a escrevê-las, esta plataforma acumulava o que o dono encomendava. Dezenove por cento do mercado viraram menos de nove, e a causa foi a estratégia que tinha salvado a empresa vinte anos antes. A integração vertical é uma posição sobre quanto do mundo você quer trabalhando para você, e a resposta muda quando o mundo está escrevendo software." },
      ],
      markets: [
        "Hobbistas, pequenas empresas, escolas e famílias: os clientes que queriam um computador sem conhecer uma revenda, num país onde a RadioShack mais próxima ficava a um curto trajeto de carro de quase qualquer pessoa. Esse alcance é toda a história comercial.",
        "Os concorrentes em computação eram a Apple, a Commodore e, por fim, os fabricantes de compatíveis IBM; os concorrentes no varejo não eram ninguém em particular, até chegarem as superlojas de eletrônicos e depois a internet.",
      ],
      analyst: [
        "A posição em computação terminou em 1993 e a do varejo se deteriorou nas duas décadas seguintes. O que vale avaliar é o modelo, não o resultado.",
        "Duas lições moram na mesma empresa, e só se contradizem se você ignorar as datas. A integração vertical e a distribuição exclusiva resgataram uma varejista falida em 1963 e destruíram um negócio de computadores líder de mercado até 1984, e a diferença é o que o produto era. Para vender um resistor a alguém, não importa quem o fabricou. Para vender um computador, o que importa é o que outras pessoas escreveram para ele, e uma empresa que fabrica tudo sozinha não tem como querer isso.",
      ],
    },
  },
  // Tech Data and SYNNEX (now TD SYNNEX): record prose, aligned acquisitions and the complete profile.
  "tech-data-synnex": {
    // Name has no " - " subtitle: kept verbatim so the record reports complete.
    name: "Tech Data and SYNNEX (now TD SYNNEX)",
    // Card line and page intro.
    tagline: "Um pai a vendeu ao filho por dez mil dólares; hoje é a maior distribuidora de tecnologia do mundo.",
    intro:
      "Edward C. Raymund constituiu a Tech Data em Clearwater, Flórida, em 19 de novembro de 1974, vendendo fitas e discos: suprimentos de processamento de dados para minicomputadores e mainframes. Por volta de 1984, vendeu o negócio ao filho Steven por US$ 10.000. Essa empresa se fundiu com a SYNNEX em 2021 para criar a TD SYNNEX, que informou receita de US$ 58,5 bilhões no ano fiscal de 2024.",
    // Body paragraphs, same count and order as English.
    body: [
      "Os dez mil dólares não são um erro de arredondamento num negócio maior: são a transação inteira, e é o tipo de detalhe que se perde quando uma empresa fica grande o bastante para ter a história escrita pelo departamento de comunicação. Steven Raymund então fez o que importava: a partir de 1983, transformou uma revenda de suprimentos para mainframe numa distribuidora nacional de linha completa de produtos para computadores pessoais, que é um negócio diferente usando o mesmo nome. Tornou-se presidente-executivo em 1986, o ano em que a empresa abriu o capital na NASDAQ.",
      "A SYNNEX é a outra metade e começou num lugar irreconhecível. Robert T. Huang a fundou em Fremont, Califórnia, em 1980, como Compac Microelectronics, fazendo montagem sob contrato e comprando componentes na Ásia. A MiTAC International assumiu o controle majoritário em 1992, e a empresa abriu o capital na New York Stock Exchange em 2003, com Huang ainda como o maior acionista individual. Passou as décadas seguintes comprando: distribuição de games, terceirização de processos de negócio e, em 2013, a operação mundial de atendimento ao cliente da IBM, que ela acabou separando como Concentrix em 2020.",
      "Então as duas se juntaram, e a sequência importa. A Apollo Global Management fechou o capital da Tech Data em 2020 por cerca de US$ 6 bilhões. No ano seguinte, a Apollo a fundiu com a SYNNEX numa transação avaliada em cerca de US$ 7,2 bilhões, concluída em 1º de setembro de 2021. Os antigos acionistas da SYNNEX ficaram com 55% do resultado e a Apollo com 45%, e a Apollo já saiu em etapas. A empresa combinada opera em Fremont e em Clearwater ao mesmo tempo, que é o que acontece quando duas sedes se fundem e nenhuma perde.",
      "E aqui as entradas de distribuidoras desta linha do tempo fecham um círculo. A SYNNEX comprou o negócio da Westcon-Comstor nas Américas em 2017 por US$ 600 milhões. Quatro anos depois, a SYNNEX se fundiu com a Tech Data. Assim, a operação da Westcon nas Américas (a que tinha sido da Datatec, no mesmo grupo da Logicalis) hoje está dentro da TD SYNNEX, ao lado do que era a Tech Data. Quatro das distribuidoras descritas aqui estão ligadas por controle acionário, e a quinta, a ScanSource, compete com o resultado depois de ter montado o seu próprio negócio latino-americano do mesmo jeito.",
      "Vale dizer a escala, porque ela é o argumento da distribuição broadline. A TD SYNNEX fatura mais do que a Ingram Micro. Nenhuma das duas é uma empresa de tecnologia em qualquer sentido útil: são negócios de logística e crédito que por acaso movimentam tecnologia, mantendo estoque no próprio balanço para que a revenda não precise fazê-lo. É algo sem glamour, intensivo em capital e quase invisível de dentro de uma equipe de engenharia, e nada que um engenheiro compra chega sem passar por uma delas.",
    ],
    // Acquisitions: same order and length as English; names and years stay in the English record.
    acquisitions: [
      // Westcon-Comstor Americas (by SYNNEX).
      { what: "O negócio de distribuição da Westcon-Comstor na América do Norte e na América Latina, então controlado pela Datatec.", became: "Parte da SYNNEX e, portanto, parte da TD SYNNEX depois de 2021: foi assim que um negócio da Datatec acabou dentro da maior distribuidora de tecnologia do mundo." },
      // Tech Data (by Apollo Global Management).
      { what: "O fechamento de capital que preparou a fusão. As participações da família fundadora foram em grande parte convertidas em dinheiro.", became: "Controlada pela Apollo, depois 45% da TD SYNNEX um ano mais tarde." },
      // The merger itself.
      { what: "Tech Data e SYNNEX combinadas, operação concluída em 1º de setembro de 2021.", became: "TD SYNNEX: mais de 100 países, e receita maior do que a de qualquer outra distribuidora de tecnologia.", sourceNote: "A receita combinada é informada de várias formas, em torno de US$ 57-60 bilhões, conforme o período considerado; o número do ano fiscal de 2024, US$ 58,5 bilhões, é o usado acima." },
    ],
    // Complete translated profile; years unchanged, section counts unchanged (no foundings, as in English).
    profile: {
      slug: "tech-data-synnex",
      foundings: [],
      timeline: [
        { year: 1974, title: "Não começou como distribuidora", detail: "O negócio original vendia suprimentos de processamento de dados diretamente às organizações que os usavam. Vender ao usuário final é exatamente o que uma distribuidora não faz (a ScanSource, em outro ponto desta linha do tempo, foi fundada sobre a recusa disso), de modo que a empresa que virou uma das duas maiores atacadistas do mundo passou a primeira década sendo aquilo que as atacadistas existem para não ser." },
        { year: 2019, title: "Duzentas e quarenta mil pessoas", detail: "A SYNNEX empregava cerca de 240.000 pessoas, contra 15.000 da Tech Data, com receita menor. A diferença é toda a história do que a SYNNEX tinha se tornado: um negócio de distribuição com uma enorme operação de terceirização acoplada, em que a segunda empregava dezesseis pessoas para cada uma da primeira. Fundir as duas significou primeiro separá-las." },
        { year: 2021, title: "Nove meses", detail: "A Apollo concluiu a compra em 30 de junho de 2020 e anunciou a transação com a SYNNEX em 22 de março de 2021: menos de nove meses como dona antes de fechar o negócio que a combinaria. O private equity costuma ser descrito como capital paciente; isto não foi isso, e a velocidade diz que a compradora já tinha visto a combinação antes de comprar a primeira metade." },
      ],
      products: [
        { name: "Distribuição broadline de produtos", what: "Dispositivos de usuário, hardware de data center, redes, software e eletrônicos de consumo de milhares de fabricantes, vendidos a revendas, integradores e varejistas." },
        { name: "Advanced solutions", what: "Data center, segurança, nuvem e analytics vendidos com pré-venda técnica acoplada: a ponta de margem maior, onde uma distribuidora precisa saber projetar, além de despachar." },
        { name: "Marketplace de nuvem e gestão de assinaturas", what: "Provisionamento e cobrança do software que a revenda já não recebe fisicamente. A categoria que aos poucos está substituindo aquela sobre a qual a empresa foi construída." },
        { name: "Financiamento e crédito", what: "Prazos concedidos aos parceiros contra o estoque que a distribuidora já possui. As duas metades desta empresa foram construídas sobre isso, e continua sendo o motivo de a maioria das revendas conseguir operar." },
      ],
      innovations: [
        { title: "Virar atacadista de propósito", detail: "Passar de vender ao usuário final a vender só por meio de revendas significa abrir mão dos clientes que você tem em troca de clientes que precisa recrutar. Pouquíssimas empresas fazem essa troca voluntariamente, e é a decisão que a entrada acima credita à segunda geração." },
        { title: "Dois negócios que dividiam um nome e pouco mais", detail: "A distribuição gira uma receita enorme com margens finas e pouca gente; a terceirização de processos de negócio gira uma receita modesta com mão de obra. Manter as duas significou apresentar uma empresa cujo número de funcionários não fazia sentido diante da receita, e a separação final do braço de terceirização foi menos uma virada estratégica do que a admissão de que as duas nunca tinham pertencido ao mesmo balanço." },
        { title: "A escala como defesa única", detail: "Na distribuição broadline, o maior compra melhor, financia mais barato e é mais difícil de ser contornado por um fabricante. Não há outra vantagem duradoura, e é por isso que a indústria se consolida sem trégua e que uma fusão que produziu a maior distribuidora foi o movimento óbvio, e não um movimento ousado." },
      ],
      markets: [
        "Revendas, integradores, provedores de serviços gerenciados e varejistas em mais de cem países, com cerca de US$ 58 bilhões de receita anual. O cliente final é toda organização que compra tecnologia por meio de alguém, ou seja, a maioria delas.",
        "A principal concorrente é a Ingram Micro, e as duas hoje têm tamanhos próximos o bastante para que a classificação dependa do ano. Abaixo delas, as especialistas competem pela profundidade em categorias a que as casas broadline chegam mais tarde.",
      ],
      analyst: [
        "A distribuição é avaliada pela eficiência do capital de giro, pelas autorizações de fabricantes e pela cobertura geográfica. Nesta escala, as avaliações são na prática uma comparação de duopólio, com todo o resto da categoria uma ordem de grandeza menor.",
        "O detalhe da fundação merece a última palavra por um motivo além do charme. Um negócio vendido dentro de uma família por dez mil dólares se tornou, cinquenta anos depois, o maior do seu tipo no mundo, e fez isso abandonando os clientes originais, mudando duas vezes o que vendia, fundindo-se com uma empresa que tinha começado em montagem sob contrato e passando, nesse meio-tempo, pelas mãos de um fundo de private equity que a manteve por nove meses. Quase nada da empresa que Edward Raymund vendeu sobrevive na que existe, exceto o nome e o fato de que ela movimenta os produtos dos outros.",
      ],
    },
  },
  // TechDEC: record prose only (no profile).
  "techdec": {
    // Name has no subtitle: kept verbatim so the record reports complete.
    name: "TechDEC",
    // Card line and page intro.
    tagline: "Parceira nomeada tanto pela Extreme Networks quanto pela Netskope no Brasil.",
    intro:
      "Integradora brasileira que aparece do lado dos parceiros de dois fabricantes ao mesmo tempo: a Extreme no lado de redes e a Netskope no lado de segurança. Essa combinação é o formato comum do canal brasileiro: a mesma casa vende a rede e o controle que a inspeciona, porque o cliente que compra uma é o cliente que precisa operar o outro.",
    // Body paragraphs, same count and order as English. Places take their native diacritics (Petrópolis, Operação Persona); the company name Grupo Binario stays as written (see NOTES).
    body: [
      "Nomeada em duas listas de fabricantes ao mesmo tempo: cita a Extreme entre os seus parceiros de tecnologia e já implantou switching Extreme em projetos de clientes, e também aparece como parceira atual da Netskope. Esse par é o formato comum do canal brasileiro: a mesma casa vende a rede e o controle que a inspeciona, porque o cliente que compra uma é o cliente que precisa operar o outro.",
      "A TechDEC foi fundada em dezembro de 1996 em Porto Alegre, começando na Avenida Taquara, no bairro Petrópolis, e os seus clientes se concentram no sul do país. Saúde é o segmento em que ela foi mais fundo: tem uma certificação HIMSS Analytics e descreve a sua própria abrangência como indo da identificação do paciente à infraestrutura de data center, um arco incomumente específico para uma integradora regional.",
      "Em 2004 abriu uma filial na Flórida, e o motivo declarado é a importação: um braço nos Estados Unidos encurta e barateia o processo de trazer equipamentos para o Brasil. É a TERCEIRA empresa deste catálogo com o mesmo arranjo: o Grupo Binario mantém um armazém em Miami, e os equipamentos do caso Operação Persona também passaram pela Flórida. Vender hardware de rede no Brasil há muito tempo significa resolver primeiro um problema de importação, e a versão lícita dessa solução se parece estruturalmente com a ilícita.",
    ],
  },
  // Tecnocomp: record prose only (no profile).
  "tecnocomp": {
    // Name: company kept, subtitle translated.
    name: "Tecnocomp - a rede que chega a 200 cidades",
    // Card line and page intro (São Bernardo do Campo takes its native diacritic).
    tagline: "Empresa brasileira de serviços de TI fundada em 1985, atuando em serviços gerenciados, infraestrutura e data centers.",
    intro:
      "A Tecnocomp é uma empresa brasileira de serviços de tecnologia da informação e comunicação, registrada em 1985 em São Bernardo do Campo, que atua em serviços gerenciados, infraestrutura de TI e data centers para grandes empresas e governo.",
    // Body paragraphs, same count and order as English.
    body: [
      "O detalhe que separa este tipo de empresa de uma consultoria é o atendimento em campo em mais de duzentas cidades. Isso não é um território de vendas, é uma obrigação: alguém precisa conseguir chegar a um equipamento com defeito num lugar sem escritório local, dentro do prazo que o contrato estipular, e o custo dessa promessa é uma rede permanente de técnicos e peças de reposição, e não uma equipe de projeto.",
      "É a metade sem glamour da indústria, e a metade que decide se o resto funciona. Service desk, serviços de campo, gestão de ativos e monitoramento de rede são as funções que mantêm os equipamentos funcionando muito depois de encerrado o projeto de instalação, e num país de escala continental a logística de fazer isso é um problema de engenharia genuíno por si só.",
      "O trabalho para o governo convive com o lado corporativo, o que traz a mesma disciplina que esta linha do tempo registra em outros pontos: licitações publicadas, escopos definidos e a exigência de demonstrar conformidade, em vez de argumentar com base num relacionamento.",
    ],
  },
  // TOTVS: record prose only (no profile). Founders' names stay exactly as the English writes them.
  "totvs": {
    // Name: company kept, subtitle translated.
    name: "TOTVS - o software sobre o qual a maioria das empresas brasileiras de fato roda",
    // Card line and page intro.
    tagline: "Fabricante brasileira de software de gestão empresarial (ERP), fundada em 1983 e listada na B3.",
    intro:
      "A TOTVS foi fundada em 1983 por Laercio Cosentino e Ernesto Haberkorn, ganhou a forma atual com a combinação de Microsiga e Logocenter e é a principal fabricante de ERP do mercado brasileiro. Emprega cerca de doze mil pessoas e tem ações negociadas na B3.",
    // Body paragraphs, same count and order as English.
    body: [
      "Não é uma empresa que começou em 2005. Começou em 1983 como Microsiga, foi rebatizada depois da transação com a Logocenter, e o nome TOTVS deriva do latim para tudo, ou todo.",
      "Ela pertence a uma linha do tempo de redes e segurança por um motivo que não tem nada a ver com redes: o ERP é o sistema cuja disponibilidade decide se uma empresa consegue faturar, pagar, despachar ou fechar o mês. Toda discussão sobre redundância, janelas de manutenção e disaster recovery numa empresa brasileira é, no fim, uma discussão sobre essa classe de sistema, e com frequência sobre o software desta empresa especificamente.",
      "A trajetória também é um raro contraexemplo brasileiro ao padrão que a maior parte desta linha do tempo registra. Onde integradoras e especialistas daqui foram compradas repetidamente por grupos estrangeiros, a TOTVS cresceu adquirindo (Microsiga e Logocenter primeiro, depois Bematech, Virtual Age, PRX e PC Sistemas) e continuou sendo a compradora, em vez de virar a comprada.",
    ],
  },
  // Xerox: record prose and the complete profile.
  "xerox": {
    // Name: company kept, subtitle translated.
    name: "Xerox - a empresa que deixou o futuro escapar",
    // Card line and page intro.
    tagline: "A xerografia construiu o império; o PARC inventou a Ethernet, a GUI e a impressão a laser, e a história das redes passa por aquele laboratório.",
    intro:
      "A Xerox importa para este site por causa de um prédio acima de tudo: o Palo Alto Research Center, onde a própria Ethernet foi inventada em 1973. A gigante das copiadoras comercializou quase nada do que o PARC criou, o tropeço mais produtivo da história da tecnologia, e o seu próprio negócio de impressão segue em frente, tendo concluído a aquisição da Lexmark em 2025.",
    // Body paragraphs, same count and order as English (Steve Jobs's words are reported, not quoted, in the English, so they are translated).
    body: [
      "O Palo Alto Research Center foi fundado em 1970 e, em meados daquela década, cerca de metade dos cem cientistas da computação mais respeitados do mundo trabalhava lá. Em cinco anos, tinha produzido o computador pessoal, a interface gráfica com janelas e ícones, o mouse que as comandava, a edição WYSIWYG (what-you-see-is-what-you-get), a programação orientada a objetos, a impressora a laser e a Ethernet.",
      "A frase que mais importa para este catálogo é do próprio Steve Jobs, de 1995. Ele disse que lhe mostraram três coisas, e que ficou tão ofuscado pela primeira, a interface gráfica do usuário, que não absorveu as outras duas. Uma delas era a Ethernet. A tecnologia sobre a qual toda esta seção se apoia foi demonstrada ao visitante de maiores consequências da história da indústria, e ele passou direto por ela.",
      "Robert Metcalfe, que a tinha construído lá, saiu para fundar uma empresa com o propósito de vendê-la. É a terceira vez que esta seção registra o padrão: o banco de dados relacional foi inventado na IBM e vendido pela Oracle, a arquitetura do PC foi publicada pela IBM e liderada pela Compaq, e a Ethernet foi inventada na Xerox e tornada comprável pela 3Com. Inventar uma coisa e ser a empresa que a fornece são problemas distintos, e organizações excelentes no primeiro não se tornam, só por isso, competentes no segundo.",
      "A versão consagrada disso, a de que a Xerox não viu nada e a Apple viu tudo, é arrumada demais, e a correção pertence ao registro. A impressora a laser foi construída no mesmo laboratório em 1971, em menos de nove meses, e a Xerox a comercializou até virar item obrigatório de todo escritório do mundo. O laboratório que supostamente não conseguia entregar nada entregou o equipamento de escritório mais lucrativo das duas décadas seguintes.",
      "A empresa também estava, naquele momento, defendendo um negócio de fotocopiadoras contra a concorrência de baixo custo e respondendo a uma investigação antitruste do governo sobre o seu domínio desse mercado. Uma grande empresa cuidando do mercado que tem, enquanto um laboratório que ela financia inventa o mercado que vai substituí-lo, é o formato comum do problema, e não uma falha de visão.",
      "Desde então, a Xerox doou o PARC à SRI International, declarando que queria se concentrar no seu negócio principal. Cinquenta e tantos anos depois do Alto, o mesmo julgamento, feito de novo, e declarado na mesma linguagem.",
      "Há também um capítulo de espionagem, e ele merece mais do que uma nota de rodapé. Em 1962, a CIA procurou Ray Zoppoth, engenheiro mecânico da Xerox, com um problema: a Embaixada Soviética em Washington não admitia quase nenhum americano, mas admitia o técnico que consertava a fotocopiadora. Construiu-se uma câmera para ficar dentro da máquina e fotografar cada página que passasse por ela. Depois de testes num boliche desativado, o dispositivo foi instalado na própria Xerox 914 da embaixada e, a partir de 1963, um técnico treinado trocava o filme nas suas visitas de manutenção. A agência nunca confirmou nem negou.",
      "Duas coisas ali valem mais do que a anedota. Primeiro, o motivo de o técnico ter acesso permanente era que a 914 era pouco confiável e propensa a pegar fogo, então precisava de manutenção constante. O canal de manutenção era a porta de entrada, que é exatamente a preocupação moderna com a cadeia de suprimentos em equipamentos que aceitam atualizações do fabricante, chegando sessenta anos antes e em forma mecânica.",
      "Segundo, a copiadora mudou o que significava roubar. Antes dela, levar um documento significava retirá-lo, e o vão na prateleira era a prova. Depois, o original ficava exatamente onde estava e quem saía era a cópia. Toda discussão posterior sobre exfiltração, e todo controle projetado para detectar dados saindo em vez de dados sumindo, descende de uma máquina que tornou a duplicação barata o bastante para ser invisível.",
    ],
    // Complete translated profile; years, company and founders unchanged.
    profile: {
      slug: "xerox",
      foundings: [
        {
          company: "Xerox (founded as The Haloid Company)",
          year: 1906,
          place: "Rochester, Nova York",
          founders: ["Joseph C. Wilson (Haloid); Chester Carlson (xerography)"],
          story:
            "A Xerox é duas histórias vestindo um nome só. A primeira: uma fabricante de papel fotográfico de Rochester aposta tudo na estranha invenção de cópia a seco de Chester Carlson, rejeitada por IBM, GE e RCA, e a copiadora 914, de 1959, vira um dos produtos mais lucrativos da história industrial. A segunda história é o motivo de esta página existir num site de redes: em 1970, a fortuna das copiadoras financiou o Palo Alto Research Center, onde, em três anos milagrosos, pesquisadores inventaram o computador pessoal como o conhecemos, a impressão a laser, a interface gráfica e, no trabalho de Bob Metcalfe e David Boggs em 1973, a própria Ethernet. A Xerox comercializou quase nada disso.",
        },
      ],
      // Timeline: same order and years; the quoted phrase stays in English with a gloss.
      timeline: [
        { year: 1938, title: "Xerografia", detail: "Chester Carlson faz a primeira cópia eletrofotográfica em Astoria, Queens; a Haloid licencia a invenção órfã em 1947 e dá ao processo o seu nome de raiz grega: escrita seca." },
        { year: 1959, title: "A 914", detail: "Chega ao mercado a primeira copiadora de escritório em papel comum, que reconfigura o próprio trabalho de escritório; a empresa passa a se chamar Xerox em 1961 e vira verbo." },
        { year: 1970, title: "Abre o PARC", detail: "O Palo Alto Research Center reúne os melhores cientistas da computação que o dinheiro consegue encontrar e lhes dá espaço; o Alto, a impressão a laser, o Smalltalk e a GUI moderna surgem em cinco anos." },
        { year: 1973, title: "Nasce a Ethernet", detail: "O memorando de Bob Metcalfe descreve uma rede de broadcast para o Alto, construída com David Boggs e batizada em homenagem ao éter luminífero. Metcalfe sai em 1979 para fundar a 3Com e comercializá-la; DEC, Intel e Xerox publicam o padrão DIX em 1980. Todo cabo deste site descende daquele memorando." },
        { year: 1979, title: "A visita famosa", detail: "A equipe da Apple visita o PARC e vê o futuro da GUI que a sede da Xerox não conseguia ver; a expressão 'fumbling the future' (deixar o futuro escapar) entra no vocabulário da indústria como o seu conto de advertência mais estudado." },
        { year: 2025, title: "Lexmark", detail: "1º de julho de 2025: a Xerox conclui a aquisição da Lexmark junto à Ninestar e à PAG, por US$ 1,5 bilhão; dois ícones da impressão combinados, entre os cinco primeiros em todos os grandes segmentos de impressão, sob o CEO Steve Bandrowczak.", sourceNote: "8-K e 10-K da Xerox; fechamento em julho de 2025." },
      ],
      // Products: brand tokens kept, generic descriptors localised.
      products: [
        { name: "Impressão de produção e de escritório", what: "O núcleo herdeiro das copiadoras: impressoras, multifuncionais (MFPs) e serviços gerenciados de impressão, agora incluindo a linha A4 da Lexmark." },
        { name: "Xerox IT Solutions", what: "O braço de serviços construído a partir da ITsavvy: a diversificação para além da página." },
        { name: "O legado do PARC", what: "Não é um produto que a Xerox vende: Ethernet, impressão a laser e a GUI, o substrato operacional da indústria, entregue de graça." },
      ],
      // Innovations, markets and analyst lines: same counts as English.
      innovations: [
        { title: "Ethernet", detail: "Inventada no PARC em 1973, padronizada como DIX em 1980 e hoje a palavra padrão para uma porta de rede em todo o planeta: a invenção de maiores consequências de qualquer página desta seção." },
        { title: "O escritório moderno, duas vezes", detail: "A 914 definiu o escritório de papel; o PARC definiu o digital. Nenhuma outra empresa inventou as duas eras, nem lucrou de forma tão desigual com elas." },
      ],
      markets: [
        "Hoje a Xerox é uma empresa focada em impressão e serviços para o ambiente de trabalho, ampliada pela Lexmark para mais de 200.000 clientes em mais de 170 países, enquanto o seu legado de pesquisa sustenta, sem royalties, praticamente toda a indústria de redes.",
      ],
      analyst: [
        "Presença centenária nas avaliações do setor de impressão e, em toda escola de negócios do planeta, o estudo de caso canônico de inventar o futuro e deixá-lo sair porta afora.",
      ],
    },
  },
};
