// ============================================================================
// src/content/vendors/overlays/pt-BR/shard-2.ts
// ----------------------------------------------------------------------------
// pt-BR INDUSTRY OVERLAYS, SHARD 2 of 8 (translation pass planned 2026-10-25;
// see the round 2 TRANSLATION-PLAN). One shard per translator, so parallel
// work never edits the same file. Each entry is keyed by record slug and holds
// ONLY translated prose (PartnerVendorOverlay); facts stay in partners.ts and
// profiles/*.ts. Check with: npx tsx scripts/report-industry-translation.mts --strict
//
// Records assigned to this shard (~26,958 words):
// agility, altasnet, altavista, anixter, by-seven, cisco, cloudflare, codex,
// cpqd, cybereason, cyclades-avocent-vertiv, d-link, ekahau, embraer, epam,
// extreme, focaldata, hitachi, hpe-juniper-aruba, infoblox, kryterion, lanpro,
// microcamp, nantucket, nbs-nist, netscape, network-secure, network1, nvidia,
// oscium, pearson-vue, polycom, portswigger, proofpoint, q1-labs, quest-
// software, rapid7, raspberry-pi, riverbed, rsa-security, silicon-graphics,
// sophos, teltec, versa, wdc
//
// Translated 2026-10-25, completed 2026-10-26 (pt-BR machine-draft state:
// written with AI, reviewed
// gradually; never labelled reviewed). Profile objects are complete copies of
// the English profiles with only the prose fields replaced, so every year,
// company, founder, personal marker and href is the English one. Quotations
// that the English presents as a source's words, source titles and filing
// names stay verbatim; product and company names keep their spelling.
// ============================================================================

import type { PartnerVendorOverlay } from "@/content/vendors/localized";

/** Translated prose for this shard's records, keyed by slug. */
export const SHARD_2: Record<string, PartnerVendorOverlay> = {
  // ---- agility: pt-BR prose for the record (facts stay in the English record) ----
  "agility": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Agility - a metade de infraestrutura da segurança",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Integradora de São Paulo especializada em infraestrutura e cibersegurança para ambientes críticos.",
    intro: "A Agility é uma integradora de São Paulo que define a própria especialidade como InfraSec: infraestrutura e cibersegurança tratadas como uma única prática, e não duas, para ambientes de missão crítica e de alta complexidade, on-premises, em nuvem, multicloud e híbridos.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "A prática de infraestrutura cita quatro itens: DHCP, load balancing, stack de aplicação e DNS. Vale ler essa lista devagar, porque é exatamente o conjunto de serviços que ninguém percebe até que um deles pare e tudo pareça quebrar de uma vez. Uma integradora que se apresenta pelo DNS, e não por uma marca de firewall, está descrevendo outro tipo de trabalho.",
      "A lista de parceiros diz o resto. F5 e Infoblox nas camadas de entrega e de nomes, Palo Alto e CyberArk do lado da segurança, Gigamon e ExtraHop para visibilidade, e uma prática de serviços gerenciados construída por cima: managed detection and response, acesso seguro gerenciado e um centro de operações com equipe permanente. O padrão que esta linha do tempo registra repetidas vezes é que as integradoras brasileiras vendem mais a operação da coisa do que a coisa em si.",
      "Ela também publica, o que é incomum o bastante para registrar. O blog traz vários textos sobre ameaças ao DNS e sobre DNS em ambientes industriais e de dispositivos conectados, o mesmo assunto que os artigos do Learn deste site cobrem, escrito do lado do operador do mesmo mercado.",
    ],
  },
  // ---- altasnet: pt-BR prose for the record (facts stay in the English record) ----
  "altasnet": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Altasnet - TI de Belo Horizonte",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Integradora brasileira de cibersegurança, redes, data center e nuvem, com mais de vinte anos de mercado.",
    intro: "A Altasnet é uma integradora de TI que atua em cibersegurança, redes, data center e nuvem, e fluxo de trabalho digital, com mais de vinte e três anos de mercado e mais de cinco mil clientes atendidos. Opera a partir de Belo Horizonte.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "A localização é o que merece nota numa linha do tempo que, no mais, é uma história paulistana com uma exceção recifense. Minas Gerais tem sua própria economia de tecnologia, suas próprias universidades alimentando essa economia e sua própria base de clientes, e uma integradora que atendeu cinco mil clientes a partir de Belo Horizonte ao longo de duas décadas é a prova de um mercado que não aparece nos relatos escritos a partir do litoral.",
      "O mix de serviços é o habitual de hoje, e isso por si só é informativo: as mesmas quatro linhas, segurança, redes, infraestrutura e fluxo de trabalho, se repetem em toda integradora desse porte nesta linha do tempo, porque são o que uma empresa brasileira de médio porte de fato compra.",
    ],
  },
  // ---- altavista: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "altavista": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "AltaVista",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Criado para pôr um processador à prova, virou o melhor buscador da web, e depois foi transformado em portal.",
    intro: "O AltaVista não nasceu como buscador. As máquinas Alpha de 64 bits da DEC eram tão rápidas que os benchmarks padrão da época não conseguiam exigir delas, e um pesquisador de férias esboçou um jeito de gerar uma carga caótica o bastante para tentar: apontar um crawler para a World Wide Web inteira.",
    // Body: 5 paragraph(s), same order as the English.
    body: [
      "A ideia foi de Paul Flaherty. Louis Monier escreveu o crawler, o Scooter, e Michael Burrows escreveu o indexador, no Network Systems Laboratory e no Western Research Laboratory da DEC, em Palo Alto. O serviço estreou em 15 de dezembro de 1995 em altavista.digital.com, com um índice de dezesseis milhões de documentos, um número enorme para a época, oferecendo busca de texto completo com operadores booleanos e consultas em linguagem natural quando a alternativa era um diretório mantido à mão.",
      "Funcionou de imediato. Em 1996 já era o provedor exclusivo de busca do Yahoo, que tinha começado, ele próprio, como diretório. O AltaVista lançou também o Babel Fish, o primeiro serviço de tradução automática da web, batizado em homenagem ao peixe de Douglas Adams.",
      "Depois, o controle mudou de mãos quatro vezes em cinco anos. A Compaq comprou a DEC em 1998 por US$ 9,6 bilhões, a maior aquisição de tecnologia até então, e consta que alguns executivos da Compaq nem sabiam que o AltaVista existia. A Compaq pagou mais US$ 3,3 milhões pelo domínio altavista.com, que outra pessoa tinha registrado em 1994. Sob um novo CEO, o buscador foi refeito como portal (compras, e-mail grátis, notícias) para concorrer com o Yahoo, o que significava concorrer em tudo, menos naquilo em que ele era o melhor.",
      "Em junho de 1999, a Compaq vendeu 83% à CMGI por cerca de US$ 2,3 bilhões em ações. O IPO planejado foi cancelado quando a bolha estourou em 2000. Em 2002, o AltaVista tinha abandonado os recursos de portal e voltado a se concentrar na qualidade da busca, um bom trabalho que chegou tarde: o Google já tinha tomado o mercado. Em fevereiro de 2003, a Overture o comprou por US$ 140 milhões, cerca de seis por cento da avaliação da CMGI três anos antes, e o Yahoo adquiriu a Overture cinco meses depois.",
      "Em 2004, o Scooter e o mecanismo de ranqueamento original foram desligados, e o AltaVista virou uma fachada para os resultados do Yahoo. Foi encerrado formalmente em 8 de julho de 2013. Não foi a tecnologia que falhou; foi a decisão de deixar de ser um buscador.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "Encerrado pelo Yahoo em 8 de julho de 2013; desde então, o domínio redireciona para o Yahoo Search.",
    // Profile: complete copy of profiles/altavista.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "altavista",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          "company": "AltaVista",
          "year": 1995,
          "place": "Palo Alto, Califórnia",
          "founders": [
            "Paul Flaherty",
            "Louis Monier",
            "Michael Burrows"
          ],
          "story": "O nome é espanhol para vista alta, escolhido por causa das colinas acima de Palo Alto. Ilene Lang, contratada para fazer crescer o negócio de software da DEC, tornou-se a primeira CEO, um detalhe que merece nota porque o projeto começou como pesquisa e ganhou uma estrutura comercial em volta, e não o contrário."
        }
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        {
          "year": 1995,
          "title": "Lançamento",
          "detail": "Trezentos mil acessos no primeiro dia."
        },
        {
          "year": 1998,
          "title": "Vinte máquinas, e por que elas importavam",
          "detail": "O back-end rodava em vinte sistemas Alpha multiprocessados, com 130 GB de memória e 500 GB de disco somados. No mesmo ano, uma pesquisa com pesquisadores profissionais o pôs em primeiro lugar, com 45%, mais que o dobro do segundo colocado."
        },
        {
          "year": 1997,
          "title": "Oitenta milhões de acessos por dia",
          "detail": "E cerca de US$ 50 milhões em receita de patrocínio: a primeira demonstração de que a busca em si era um negócio, e não um recurso."
        },
        {
          "year": 2000,
          "title": "O mapa da forma da web",
          "detail": "Pesquisadores do AltaVista, da IBM e da Compaq usaram os dados do crawl para publicar a primeira análise séria de como a web é de fato conectada. O crawler criado para gerar uma carga de benchmark acabou produzindo o conjunto de dados de referência sobre a estrutura da própria web."
        }
      ],
      // Products: names as the vendor writes them; descriptions translated.
      products: [
        {
          "name": "Scooter",
          "what": "O crawler. Multithread quando os dos concorrentes não eram, e é exatamente por isso que seu índice era maior: buscava muitas páginas de uma vez, em vez de uma depois da outra."
        },
        {
          "name": "O índice de texto completo",
          "what": "Cada palavra de cada página, mantida em memória ao longo do cluster para que uma consulta pudesse ser respondida sem tocar no disco, e era isso que dava a sensação de instantâneo."
        },
        {
          "name": "Babel Fish",
          "what": "Construído sobre o mecanismo de tradução da Systran, e não internamente, e sobreviveu ao próprio negócio de busca do AltaVista: ainda funcionava sob o nome do Yahoo em 2008, anos depois de o índice por trás dele ter sido desligado."
        },
        {
          "name": "Busca de imagens, áudio e vídeo",
          "what": "Acrescentada antes que o resto do mercado pensasse na web como algo que contivesse mais do que documentos."
        }
      ],
      // Innovations: title and detail translated.
      innovations: [
        {
          "title": "Os sessenta e quatro bits eram o ponto, não o marketing",
          "detail": "Uma máquina de 32 bits endereça quatro gigabytes. Um índice da web grande o bastante para responder rápido precisa ficar em memória, e em 1998 este ocupava 130 GB ao longo do cluster, mais de trinta vezes o que uma arquitetura de 32 bits alcançava. O Alpha da DEC era um dos pouquíssimos processadores capazes de endereçar isso. O buscador não apenas demonstrava o hardware; ele não poderia ter existido sem ele."
        },
        {
          "title": "Crawling em paralelo",
          "detail": "Buscar uma página, esperar e então buscar a próxima é algo limitado pela latência da rede, não por qualquer coisa que a máquina possa fazer. Rodar centenas de buscas ao mesmo tempo parece óbvio em retrospecto e não era prática padrão, e essa é a diferença entre um índice de milhões e um índice de centenas de milhões."
        },
        {
          "title": "Texto completo, não curadoria",
          "detail": "Indexar cada palavra de cada página era uma aposta de que a web cresceria além da capacidade de qualquer equipe editorial de catalogá-la. Os diretórios que perderam não eram mal administrados: eram estruturalmente incapazes de acompanhar, e a empresa que mais precisava dessa resposta estava comprando resultados deste buscador em menos de um ano."
        },
        {
          "title": "Um artefato de pesquisa que mapeou o próprio objeto",
          "detail": "O crawl produziu os dados por trás do primeiro estudo de verdade sobre a estrutura de conectividade da web. É uma sobrevida incomum para uma carga de benchmark, e uma boa ilustração do que os laboratórios de pesquisa corporativos produziam quando eram financiados para ser curiosos, e não produtivos."
        }
      ],
      // Markets paragraphs.
      markets: [
        "Busca geral na web, num momento em que o mercado ainda não sabia que era um mercado. Chegou a cerca de treze milhões de consultas por dia no auge e foi o décimo primeiro site mais visitado da web em 1998 e de novo em 2000, e, o que é revelador, o favorito absoluto dos pesquisadores profissionais, que se importavam com a abrangência dos resultados, não com uma página inicial.",
        "Os concorrentes eram os diretórios, os outros crawlers e, por fim, uma empresa com uma ideia melhor de ranqueamento e nenhum interesse em ser portal."
      ],
      // Analyst standing statements.
      analyst: [
        "Não há nada atual para avaliar. O que há, em vez disso, é um dos registros de advertência mais claros desta indústria, e essa clareza vem do fato de que a tecnologia continuou funcionando o tempo todo.",
        "O índice era o maior, o hardware era o mais rápido, os usuários profissionais o preferiam, e a pesquisa que ele gerou ainda é citada. A virada de 2002 é a prova, não o argumento: a mesma equipe e a mesma tecnologia, de volta ao mesmo trabalho, três anos tarde demais."
      ],
    },
  },
  // ---- anixter: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "anixter": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Anixter",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Uma distribuidora escreveu a especificação que virou Cat 5 e Cat 6.",
    intro: "Alan e Bill Anixter abriram um negócio de distribuição de fios e cabos nos arredores de Chicago em 1957 (a Wikipedia data o início em 1956) com um empréstimo da família que a empresa calcula em US$ 10.000 e a Wikipedia em US$ 20.000, vindos da mãe deles. Em uma década, faturava US$ 10 milhões. Quando a WESCO a comprou em 2020, por cerca de US$ 4,5 bilhões, ela tinha aproximadamente 130.000 clientes, 600.000 produtos e 316 armazéns em uns cinquenta países.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "Eis o que vale saber, e quase ninguém sabe. Em 1989, a Anixter publicou o programa Levels, a primeira especificação escrita de desempenho para sistemas de cabeamento de dados. Era um documento de distribuidora, produzido para que os clientes pudessem comparar cabos pelo desempenho medido, e não pelas garantias do fabricante. A TIA, o órgão de padronização, o adotou e rebatizou os Levels de Categories.",
      "Ou seja: todo engenheiro de redes vivo que diz Cat 5, Cat 5e ou Cat 6 está usando um vocabulário inventado por uma distribuidora de cabos, por razões comerciais, e depois promovido a padrão internacional. É um caminho realmente incomum para uma especificação percorrer, e diz algo específico sobre a origem dos padrões úteis: nem sempre vêm dos fabricantes, que têm interesse em que nada seja comparável, nem dos comitês, que precisam de algo para padronizar, mas às vezes de quem fica encarregado de explicar a diferença a um comprador.",
      "O laboratório de 1995 segue a mesma lógica e é a outra metade do argumento. A Anixter abriu um laboratório de interoperabilidade em Illinois, com processos de teste verificados pela UL, e se apresentava como a única distribuidora com um. Uma distribuidora que testa o que vende está fazendo algo estruturalmente estranho: ela não é o fabricante, então não tem produto para defender, e não é o cliente, então tem o volume que justifica equipamentos que ninguém que compra uma única bobina poderia bancar. É o mesmo argumento de neutralidade que esta linha do tempo faz sobre os pontos de troca neutros em relação às operadoras e a certificação neutra em relação aos fabricantes, aparecendo no lugar mais improvável: o meio de uma cadeia de suprimentos.",
      "O mecanismo de crescimento foi a aquisição, e de forma explícita. Alan Anixter contou ao Chicago Tribune que andava com uma lista de alvos de aquisição no bolso, e a empresa comprou dezenove negócios até o fim dos anos 1960. Abriu capital na bolsa American em 1967 e na de Nova York em 1975, foi adquirida pela holding Itel e mais tarde adotou o nome Anixter International, passou de US$ 1 bilhão em vendas em 1991 e chegou a US$ 3 bilhões em 1999.",
      "O desfecho é uma das disputas de lances mais bem documentadas da distribuição. A Clayton, Dubilier & Rice ofereceu US$ 3,8 bilhões em outubro de 2019, com uma janela de quarenta dias que permitia à Anixter buscar propostas melhores. A WESCO apareceu, e o preço subiu para US$ 3,9 bilhões, US$ 4,0 bilhões, US$ 4,3 bilhões e, por fim, US$ 4,5 bilhões em janeiro de 2020, quando a CD&R abriu mão do direito de cobrir a oferta. O negócio combinado tinha receita pro forma em torno de US$ 17 bilhões, e o anúncio projetava US$ 200 milhões de economia anual de custos até o terceiro ano, o que na distribuição significa filiais e centros de distribuição, porque é lá que está a duplicação.",
      "Lida ao lado das outras seis distribuidoras daqui, a Anixter é a que moldou o que vendia, em vez de apenas movimentá-lo. Ingram e Tech Data construíram logística e crédito; a ScanSource escolheu uma tese de produto; Westcon e Arrow consolidaram. Esta escreveu uma especificação que a indústria inteira ainda fala. Uma distribuidora costuma ser descrita como uma camada que acrescenta custo entre o fabricante e o cliente, e o contra-argumento mais forte é que alguém nessa camada teve de definir o que os produtos eram antes que pudessem ser comparados.",
    ],
    // Acquisitions: 1 entries index-aligned with the English; year, name, price and founder stay English.
    acquisitions: [
      // [0] 1998 Pacer Electronics
      {
        "what": "Distribuição de fios, cabos e conectores eletrônicos.",
        "became": "Parte da expansão da Anixter no fornecimento para OEMs."
      },
    ],
    // Profile: complete copy of profiles/anixter.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "anixter",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        {
          "year": 1968,
          "title": "O Blue Book",
          "detail": "Um catálogo, escrito quando a empresa faturava cerca de dez milhões de dólares com setecentos funcionários. Publicar um documento de referência é o que uma distribuidora faz em vez de anunciar: o comprador o deixa sobre a mesa, e a empresa que o escreveu vira o lugar natural para perguntar. O programa Levels, duas décadas depois, é o mesmo instinto em escala maior."
        },
        {
          "year": 1989,
          "title": "O problema que a especificação foi escrita para resolver",
          "detail": "A Ethernet a dez megabits por segundo estava chegando aos prédios, e um cliente que comprava cabo não tinha como saber se o que estava instalando a suportaria. Não era uma divergência sobre qualidade: não havia medição nenhuma. O documento existe porque alguém precisava responder a essa pergunta numa conversa de vendas, repetidas vezes, e acabou pondo a resposta por escrito."
        }
      ],
      // Products: names as the vendor writes them; descriptions translated.
      products: [
        {
          "name": "Cabeamento estruturado",
          "what": "Cobre e fibra para dentro dos prédios, mais os conectores, patch panels e racks em volta: a categoria cujo vocabulário a empresa definiu."
        },
        {
          "name": "Segurança e vídeo",
          "what": "Vigilância, controle de acesso e o cabeamento por trás dos dois, vendidos às integradoras que os instalam: uma extensão natural para um negócio que já vendia o que passa por dentro das paredes."
        },
        {
          "name": "Fios e cabos elétricos",
          "what": "O negócio original, e ainda grande. A maior parte dos produtos não tem software nenhum, o que é incomum nesta linha do tempo e lembra do que a camada física de fato é feita."
        },
        {
          "name": "Fixadores e componentes Classe C",
          "what": "Parafusos, presilhas e peças pequenas vendidos pela mesma lógica de cadeia de suprimentos: individualmente triviais, coletivamente o motivo pelo qual uma linha de montagem para."
        }
      ],
      // Innovations: title and detail translated.
      innovations: [
        {
          "title": "Duas das categorias nunca foram padrão",
          "detail": "O argumento sobre vocabulário feito acima é mais forte do que parece. A TIA adotou o programa Levels do Level 3 para cima, e as Categories 1 e 2 nunca foram emitidas como padrões oficiais: continuam sendo os nomes de fato das designações Level 1 e Level 2 da Anixter. Um engenheiro que especifica Cat 1 para um lance de voz não está usando um padrão de forma frouxa; está usando a classificação de produtos de uma distribuidora que nenhum órgão de padronização jamais ratificou."
        },
        {
          "title": "Escrever a referência em vez de comprar o anúncio",
          "detail": "Um catálogo em 1968, uma especificação de desempenho em 1989, um laboratório de testes em 1995. É sempre o mesmo movimento: produzir o documento de que o mercado precisa e virar a parte que todos consultam. É mais lento que o marketing, e não expira."
        },
        {
          "title": "A medição como ato comercial",
          "detail": "Publicar como os produtos realmente se comportam só interessa a um vendedor cujos produtos variam. Um fabricante com o melhor cabo não quer um padrão de comparação, assim como não quer o que tem o pior: o primeiro perde o prêmio de preço e o segundo perde a venda. Só quem vende o cabo de todo mundo se beneficia de a comparação existir, e é por isso que ela veio do meio da cadeia."
        }
      ],
      // Markets paragraphs.
      markets: [
        "Empreiteiras, integradoras, empresas, concessionárias de serviços públicos e operadores industriais: quem instala infraestrutura, não quem especifica aplicações. Cerca de 130.000 clientes e 600.000 produtos no momento da aquisição.",
        "Os concorrentes eram as outras distribuidoras de material elétrico e de comunicações, e quem a adquiriu era uma delas. O que a distinguia não era preço nem amplitude, mas os documentos que publicava, que nenhum concorrente igualou."
      ],
      // Analyst standing statements.
      analyst: [
        "Não resta posição independente para avaliar; ela opera dentro de uma distribuidora maior. O que dá para avaliar é a durabilidade do que ela escreveu, e a resposta é incomum: o vocabulário sobreviveu com folga à independência da empresa e não dá sinal de ser substituído.",
        "A medida que vale registrar é que uma distribuidora de fios de Illinois é citada todos os dias, no mundo inteiro, por gente que nunca ouviu falar dela. Poucas empresas desta linha do tempo podem dizer que seu principal legado é uma palavra, e menos ainda que duas das palavras em questão nunca foram ratificadas por ninguém e são usadas assim mesmo."
      ],
    },
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A WESCO International concluiu a aquisição da Anixter International em 22 de junho de 2020, e anixter.com hoje leva ao site da Wesco (leitura de 26 de outubro de 2026).",
  },
  // ---- by-seven: pt-BR prose for the record (facts stay in the English record) ----
  "by-seven": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "By Seven",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Parceira Fortinet de nível Expert no Brasil.",
    intro: "Empresa de Joinville, fundada em outubro de 2011 por três sócios, hoje no nível Expert do diretório brasileiro da Fortinet.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "O próprio site da empresa conta a fundação: outubro de 2011, inicialmente três sócios, com crescimento constante desde então. Três pessoas abrindo um negócio de canal e chegando ao nível mais alto de um fabricante é um tipo específico de história, e o mecanismo não tem mistério: nesse porte, todo sócio também é engenheiro, então as certificações que um nível exige ficam com os donos, em vez de serem contratadas.",
      "Joinville é o outro detalhe. Santa Catarina é um estado industrial, com uma base manufatureira real e um setor de tecnologia que cresceu para atendê-la, e é por isso que uma parceira de lá consegue construir um negócio com clientes operacionais sem nunca vender para São Paulo.",
    ],
  },
  // ---- cisco: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "cisco": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Cisco Systems",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Não inventou o roteador, mas foi a primeira a vender um que falava o protocolo de todo mundo ao mesmo tempo.",
    intro: "Leonard Bosack e Sandy Lerner fundaram a Cisco em dezembro de 1984, depois de trabalharem na interligação de redes incompatíveis em Stanford. O nome é o final de San Francisco e o logotipo é a Golden Gate, o que já mostra que a empresa inteira começou como um problema local.",
    // Body: 9 paragraph(s), same order as the English.
    body: [
      "O problema era que o campus rodava várias redes que não conversavam entre si, cada uma com seu protocolo. O roteador multiprotocolo, uma única caixa que falava TCP/IP, AppleTalk, IPX, DECnet e os demais simultaneamente, foi a resposta, e chegou exatamente quando organizações do mundo todo descobriram que tinham a mesma bagunça.",
      "Esse timing explica a maior parte do que veio depois. A Cisco não precisou convencer ninguém de que a interconexão de redes importava; precisou ser a empresa com um produto à venda quando as pessoas chegassem sozinhas a essa conclusão. O IOS virou a língua em que as redes corporativas eram descritas, a ponto de concorrentes lançarem linhas de comando parecidas com o IOS porque era o que os operadores já conheciam.",
      "A máquina de aquisições foi a outra metade. A Cisco comprou mais de duzentas empresas, e a estratégia era explícita: comprar a categoria em vez de construí-la, integrar a tecnologia ao portfólio e usar o canal para vendê-la. A Crescendo, em 1993, virou o Catalyst. A Grand Junction virou Fast Ethernet. A IronPort, que tem verbete próprio nesta linha do tempo, virou a linha de segurança de e-mail em 2007. A Splunk, também presente aqui, virou o negócio de dados de observabilidade e segurança em 2024, por cerca de US$ 28 bilhões, a maior compra da história da empresa.",
      "O programa de certificação merece menção à parte, porque mudou a forma como a indústria contrata. CCNA, CCNP e CCIE criaram uma escada de competências definida pelo fabricante que os empregadores passaram a tratar como indicador de habilidade, e todo fabricante deste site com uma trilha de certificação trabalha a partir de um modelo que a Cisco estabeleceu.",
      "Ela foi desafiada em todos os segmentos que ocupa e perdeu terreno em vários, mas a forma das redes corporativas (o vocabulário, o modelo de certificação, a premissa de que um único fabricante pode fornecer a pilha inteira) é, em grande parte, desenho da Cisco.",
      "Em maio de 2014, um documento divulgado com o relato de Glenn Greenwald sobre o material de Snowden mostrou algo que esta empresa não fez e não poderia ter evitado. Um boletim interno de junho de 2010, do chefe do departamento de Access and Target Development da National Security Agency, descrevia a interdição na cadeia de suprimentos: equipamento de rede a caminho de um alvo é interceptado, desviado para um local secreto, recebe um firmware de rastreamento numa estação montada para isso, é lacrado de novo com os lacres de fábrica restaurados e entregue. As fotografias mostram uma caixa com a marca Cisco sendo aberta.",
      "A posição da empresa tem de constar no registro com exatidão. O diretor jurídico declarou que, por política e por prática, a Cisco não trabalha com nenhum governo, nem mesmo o seu, para enfraquecer seus produtos, e o CEO escreveu ao presidente pedindo que a prática acabasse. Nada no material divulgado indica que o fabricante tenha participado. O equipamento foi tomado entre a fábrica e o cliente, um lugar que nenhum fabricante controla.",
      "Isso faz desta a quarta rota distinta pela qual o produto de um fornecedor vira instrumento de outra pessoa, e vale a pena manter as quatro juntas. Um serviço de inteligência pode ser dono do fabricante, como no caso da Crypto AG. Pode usar o canal de manutenção, como no caso da fotocopiadora numa embaixada em Washington. Pode escrever uma arma para um produto que é simplesmente o padrão, como no caso dos controladores de Natanz. Ou pode interceptar a remessa. Só uma dessas quatro é afetada pela escolha de outro fornecedor.",
      "Uma linha da resposta envelheceu até virar prova. O CEO alertou que não reparar a confiança ameaçaria a evolução da internet e levaria à sua fragmentação. Hoje as redes estão divididas conforme qual governo permite qual fornecedor: a fragmentação que ele descreveu, chegando pelo lado contra o qual ele argumentava.",
    ],
    // Acquisitions: 3 entries index-aligned with the English; year, name, price and founder stay English.
    acquisitions: [
      // [0] 1993 Crescendo Communications
      {
        "what": "Tecnologia de switching, e a primeira grande aquisição da Cisco.",
        "became": "A linha Catalyst, que virou a família dominante de switches corporativos por duas décadas."
      },
      // [1] 2007 IronPort Systems
      {
        "what": "Segurança de e-mail baseada na reputação do remetente, e não na inspeção de conteúdo.",
        "became": "Cisco Email Security Appliance. A IronPort tem verbete próprio nesta linha do tempo.",
        "subAcquisitions": [
          {
            "what": "Fundada sobre o argumento de que QUEM envia uma mensagem prevê spam melhor do que o que ela contém, um argumento que a segurança em nuvem repete desde então."
          }
        ]
      },
      // [2] 2024 Splunk
      {
        "what": "Busca em dados de máquina, observabilidade e análise de segurança. Anunciada em setembro de 2023, concluída em 18 de março de 2024.",
        "became": "O negócio de segurança e observabilidade da Cisco, e a maior aquisição que ela já fez. A Splunk tem verbete próprio aqui."
      },
    ],
    // Profile: complete copy of profiles/cisco.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "cisco",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          "company": "Cisco Systems",
          "year": 1984,
          "place": "Menlo Park, Califórnia (a partir da Stanford University)",
          "founders": [
            "Leonard Bosack",
            "Sandy Lerner"
          ],
          "story": "Um casal administrava instalações de computação a 500 jardas de distância uma da outra em Stanford, Bosack (ex-DEC, arquitetura de memória do PDP-10) em Computer Science e Lerner na Graduate School of Business, e construiu um roteador multiprotocolo para ligar os dois departamentos. Abriram a empresa em 10 de dezembro de 1984 com os colegas Greg Setz, Bill Westfield e Kirk Lougheed, e a batizaram em homenagem a San Francisco enquanto atravessavam a Golden Gate de carro; o logotipo são as torres da ponte. Stanford forçou a saída de Bosack e Lougheed em 11 de julho de 1986 e cogitou queixas criminais antes de fechar um acordo: uma licença de 1987 por exatos US$ 169.300. Cerca de 80 investidores de venture capital disseram não antes que Don Valentine, da Sequoia, dissesse sim, assumisse o controle em 1988 e pusesse John Morgridge como CEO. A Cisco abriu capital em fevereiro de 1990 com avaliação de US$ 224 milhões; em agosto, Lerner tinha sido demitida e Bosack tinha saído. Os fundadores nunca viram o império por dentro."
        }
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        {
          "year": 1984,
          "title": "Fundada a partir de um problema de campus",
          "detail": "10 de dezembro de 1984: o roteador multiprotocolo que ligava as redes departamentais incompatíveis de Stanford vira empresa, comercializando a tecnologia que carregaria a era da Internet."
        },
        {
          "year": 1986,
          "title": "Sai o primeiro roteador; Stanford reage",
          "detail": "O primeiro roteador TCP/IP comercial chega ao mercado no mesmo ano em que Stanford força a renúncia dos fundadores por causa de propriedade intelectual. O acordo de 1987 licencia o software e duas placas à Cisco por US$ 169.300, talvez o pior negócio que uma universidade já fez."
        },
        {
          "year": 1990,
          "title": "IPO, e a saída dos fundadores",
          "detail": "Fevereiro de 1990: a Cisco estreia na NASDAQ com valor de mercado de US$ 224 milhões. Em poucos meses, Sandy Lerner é demitida e Leonard Bosack pede demissão; na década seguinte, a ação sobe cerca de 30.000 por cento sem eles."
        },
        {
          "year": 1993,
          "title": "O ultimato da Boeing: Crescendo",
          "detail": "Negociando um pedido de roteadores de US$ 10 milhões, a Boeing avisa John Chambers que não há negócio a menos que a Cisco trabalhe com a Crescendo Communications, de Mario Mazzola. Em 24 de setembro de 1993, depois de sete anos apenas construindo, a Cisco compra a Crescendo por cerca de US$ 90 milhões. Ela vira a linha de switching Catalyst, e Mazzola e Jayshree Ullal, vindos da Crescendo, transformam o switching da Cisco num negócio de US$ 15 bilhões.",
          "sourceNote": "Cisco 10-K FY1996 (6,8 milhões de ações, pooling); o preço aparece entre US$ 89 milhões e US$ 97 milhões, conforme o relato."
        },
        {
          "year": 1994,
          "title": "Kalpana, e o primeiro bilhão",
          "detail": "Dezembro de 1994: a Cisco adquire a Kalpana, pioneira em switching Ethernet, por cerca de US$ 204 milhões em ações (13,6 milhões de ações), a empresa onde Romulus Pereira, cofundador da Riverstone, tinha construído motores de switching. No mesmo ano fiscal, a receita passa de US$ 1 bilhão pela primeira vez (US$ 1,24 bilhão, alta de 92 por cento)."
        },
        {
          "year": 1995,
          "title": "Chambers assume",
          "detail": "John Chambers sucede Morgridge como CEO e comanda a empresa por vinte anos: o arquiteto da máquina de aquisições e o executivo mais visível da era da bolha."
        },
        {
          "year": 1996,
          "title": "StrataCom: o primeiro meganegócio",
          "detail": "A StrataCom, fabricante de ATM e Frame Relay, por cerca de US$ 4,5 bilhões em ações, é a maior compra da Cisco até então e a primeira para a qual ela contrata um banco coordenador: a máquina passa das pequenas incorporações amigáveis de startups para negócios que moldam o mercado.",
          "sourceNote": "O valor aparece entre US$ 4,0 bilhões e US$ 4,67 bilhões, conforme o relato."
        },
        {
          "year": 1999,
          "title": "Dezessete empresas num só ano",
          "detail": "O pico das compras: 17 aquisições só em 1999, lideradas pela Cerent, fabricante de transporte óptico, por aproximadamente US$ 6,9 bilhões (98,1 milhões de ações, segundo o próprio 10-Q da Cisco), além da GeoTel (US$ 1,9 bilhão), da Aironet, de wireless (US$ 800 milhões), e do negócio óptico da Pirelli."
        },
        {
          "year": 2000,
          "title": "O cume",
          "detail": "Março de 2000: o valor de mercado da Cisco passa de US$ 500 bilhões e ela se torna a empresa mais valiosa do mundo, à frente da Microsoft. Em maio, paga cerca de US$ 5,7 bilhões pela ArrowPoint, fabricante de content switches e rival da Alteon. Então a bolha estoura: 80 por cento do valor some até 2002."
        },
        {
          "year": 2003,
          "personal": true,
          "title": "Começa a minha fase: Linksys",
          "detail": "20 de março de 2003: a Cisco anuncia a aquisição da Linksys por cerca de US$ 500 milhões, entrando em redes domésticas enquanto a banda larga se espalha. No mesmo ano, eu entro na Cisco em Brasília, a linha de frente do setor de governo no Brasil de um gigante em recuperação.",
          "sourceNote": "Cisco SEC 8-K, 20 de março de 2003; concluída em junho de 2003."
        },
        {
          "year": 2004,
          "title": "CRS-1: um recorde do Guinness",
          "detail": "25 de maio de 2004: estreia o Carrier Routing System, com 92 terabits por segundo, a primeira interface de 40 Gbps de verdade da indústria e um novo sistema operacional (IOS XR) feito para ele. Em 1º de julho, o Guinness World Records o certifica como o roteador de Internet de maior capacidade já construído, a primeira tecnologia de redes no livro dos recordes. Um fecho adequado: no mesmo trimestre, a Boeing anuncia que vai convergir 150.000 funcionários para as comunicações IP da Cisco.",
          "sourceNote": "Cisco 8-K FY2004; sala de imprensa da Cisco; InfoWorld."
        },
        {
          "year": 2024,
          "title": "A maior refeição da máquina",
          "detail": "Março de 2024: fecha a aquisição da Splunk por US$ 28 bilhões, a maior da história da Cisco, apontando a compradora de quatro décadas para análise de segurança e IA. Sob Chuck Robbins (CEO desde 2015), a empresa que entrou no Dow em 2009 opera com cerca de US$ 56 bilhões de receita anual: o único gigante de redes dos anos 1990 que ainda dita as regras."
        }
      ],
      // Products: names as the vendor writes them; descriptions translated.
      products: [
        {
          "name": "IOS and IOS XR",
          "what": "O sistema operacional cuja linha de comando virou a língua franca da indústria, e a reconstrução modular XR criada para o mundo sempre ligado das operadoras do CRS-1."
        },
        {
          "name": "Catalyst",
          "what": "A dinastia de switching nascida da Crescendo em 1993: o padrão do armário de fiação e do campus que sobreviveu a todos os rivais da era dos hubs que aparecem nas outras páginas deste site."
        },
        {
          "name": "CRS e o núcleo das operadoras",
          "what": "O Carrier Routing System de 92 Tbps, recordista do Guinness (2004), e seus descendentes: o núcleo multichassi das redes IP de nova geração."
        },
        {
          "name": "Nexus",
          "what": "Switching de data center vindo do spin-in Nuova, o segundo ato de Mazzola, incluindo Fibre Channel over Ethernet com o Nexus 5000."
        },
        {
          "name": "Segurança e observabilidade",
          "what": "De PIX e ASA, passando por Sourcefire e Duo, até a plataforma Splunk de US$ 28 bilhões: a máquina de aquisições montando um negócio de segurança na escala da Cisco."
        }
      ],
      // Innovations: title and detail translated.
      innovations: [
        {
          "title": "Comercializar o roteador multiprotocolo",
          "detail": "A Cisco não inventou o roteamento: fez do roteamento um produto, depois um mercado, depois a base da Internet comercial."
        },
        {
          "title": "Aquisição como P&D",
          "detail": "A partir do negócio da Crescendo, forçado pela Boeing, comprar virou metade da atividade de negócios da Cisco, segundo a própria história da empresa: um modelo que a indústria chamou de 'A&D' e imitou por trinta anos."
        },
        {
          "title": "O spin-in",
          "detail": "A Andiamo e a Nuova, de Mazzola, foram fundadas, financiadas e reabsorvidas de propósito: redes de armazenamento e a linha Nexus construídas como startups com comprador garantido."
        },
        {
          "title": "O volante de talentos",
          "detail": "As aquisições trouxeram as pessoas que construíram a década seguinte: Mazzola e Ullal, da Crescendo, e Bechtolsheim, via Granite; e as saídas deles semearam rivais como a Arista, onde Ullal é CEO."
        }
      ],
      // Markets paragraphs.
      markets: [
        "A Cisco é a constante de todas as outras páginas desta seção: a rival que segurou a Wellfleet em 20 por cento, a vencedora da guerra dos hubs contra Cabletron e SynOptics, a única par da Brocade em SAN, o padrão que Nortel e Bay não conseguiram bater e, segundo o acordo do DOJ de 2025 no caso HPE-Juniper, ainda, junto com a HPE, mais de 70 por cento das redes corporativas dos Estados Unidos quatro décadas depois.",
        "O meu capítulo foi Brasília, 2003-2004: a linha de frente do setor de governo no Brasil, na janela estreita entre o fundo do poço pós-bolha e o recorde do CRS-1 no Guinness, com o gigante reaprendendo a crescer."
      ],
      // Analyst standing statements.
      analyst: [
        "Março de 2000: um valor de mercado acima de US$ 500 bilhões fez da Cisco a empresa mais valiosa do mundo, seguido de uma queda de 80 por cento até 2002, a ida e volta que define a época.",
        "Segundo o histórico de aquisições da Wikipedia, as compras representaram 50 por cento da atividade de negócios da Cisco desde 1993: cerca de 170 empresas até o fim de 2014, coroadas pela conclusão da Splunk, de US$ 28 bilhões, em março de 2024."
      ],
      // Career cross-link: label translated, href untouched.
      careerLink: {
        "href": "/industry/chapters/riverstone",
        "label": "O DNA de switching da Kalpana passa pela Riverstone (o cofundador Pereira construiu lá antes da Yago): a página da Riverstone"
      },
    },
  },
  // ---- cloudflare: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "cloudflare": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Cloudflare",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Começou como um projeto que perguntava de onde vinha o spam, e virou infraestrutura depois que os usuários pediram que ele barrasse o spam.",
    intro: "Em 2004, Matthew Prince e Lee Holloway criaram o Project Honey Pot para responder a uma pergunta restrita: de onde vem, de fato, o spam de e-mail? Qualquer pessoa com um site podia participar, e milhares, em mais de 185 países, participaram. Os usuários faziam sempre o mesmo pedido (não basta rastreá-los, é preciso barrá-los) e, cinco anos depois, esse pedido virou empresa.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "Prince conheceu Michelle Zatlyn na Harvard Business School durante um período sabático, descreveu o projeto, e os dois, mais Holloway, fundaram a Cloudflare em julho de 2009. Ela venceu a competição de planos de negócio da escola em abril daquele ano e fechou uma Série A de US$ 2,1 milhões em novembro, com Venrock e Pelion.",
      "O produto era um reverse proxy em que se entrava trocando o DNS, uma barreira realmente baixa: sem hardware, sem software, sem contrato, e com plano gratuito desde o início. Essa decisão de freemium foi estratégica, não generosa. Todo site gratuito manda tráfego pela rede, e todo ataque contra um site gratuito é um ataque que a rede aprende a reconhecer para todos os outros.",
      "É o mesmo argumento que esta linha do tempo mostra três vezes antes. A IronPort o aplicou à reputação de remetentes de e-mail em 2002. A Zscaler, ao tráfego web em 2007. A CrowdStrike, ao comportamento de endpoints em 2013. A Cloudflare o aplicou à própria web, e tirou seus primeiros dados de ameaças de um projeto de rastreamento de spam, que foi também onde a IronPort tinha começado.",
      "O lançamento público foi no TechCrunch Disrupt, em setembro de 2010, e o tráfego passou de cerca de 50 milhões de page views por mês para mais de 5 bilhões no primeiro ano.",
      "Desde então, a empresa virou algo mais difícil de classificar: mitigação de DDoS, WAF, DNS, acesso zero trust e uma plataforma de computação serverless que roda código nos mesmos pontos de presença que servem o cache, o que transforma uma rede de conteúdo num lugar onde as aplicações de fato executam. Abriu capital em 2019, e sua rede hoje se estende por mais de 300 cidades.",
      "Ela também ocupa uma posição incômoda que não escolheu por completo. Uma empresa que atende quase qualquer um, em escala e de graça, acaba decidindo quem pode continuar online, e já foi criticada tanto por agir quanto por se recusar a agir.",
    ],
    // Profile: complete copy of profiles/cloudflare.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "cloudflare",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          "company": "Project Honey Pot",
          "year": 2004,
          "place": "Chicago, Illinois",
          "founders": [
            "Matthew Prince",
            "Lee Holloway"
          ],
          "story": "Cinco anos antes de a empresa existir, Prince e Holloway construíram um sistema distribuído que permitia a qualquer dono de site observar como os spammers coletavam endereços de e-mail. Funcionou, e produziu uma comunidade de webmasters com uma pergunta que o projeto não conseguia responder: saber quem os atacava não fazia nada para impedir o ataque. Essa distância entre observar e defender é o que a empresa acabou sendo criada para fechar."
        },
        {
          "company": "Cloudflare",
          "year": 2009,
          "place": "Palo Alto, Califórnia",
          "founders": [
            "Matthew Prince",
            "Michelle Zatlyn",
            "Lee Holloway"
          ],
          "story": "Prince estava num período sabático fazendo MBA na Harvard Business School quando descreveu o Project Honey Pot a uma colega de turma, Michelle Zatlyn. Ela viu de imediato a forma comercial da ideia: não rastrear ameaças, mas bloqueá-las. O primeiro plano de negócio se chamava Project Web Wall e não convenceu ninguém. Um amigo de Prince descreveu o que eles estavam construindo como um firewall na nuvem, e o nome que saiu daí pegou. Holloway escreveu o protótipo durante o verão. A empresa foi constituída em 26 de julho de 2009, e o primeiro escritório ficava em cima de um salão de manicure.",
          "sourceNote": "Data de fundação e lista de fundadores segundo o relato da própria Cloudflare e a Wikipedia; a sequência do nome e o título provisório Project Web Wall vêm da página Our Story da empresa."
        }
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        {
          "year": 2004,
          "title": "Project Honey Pot",
          "detail": "Uma rede distribuída de rastreamento de spam mantida por Prince e Holloway sob a Unspam Technologies, e a origem tanto dos dados de ameaças quanto da pergunta que deu origem à empresa."
        },
        {
          "year": 2009,
          "title": "Constituída, e uma competição de planos de negócio vencida",
          "detail": "Fundada em 26 de julho em Palo Alto, depois de vencer a competição de planos de negócio da Harvard Business School no início daquele ano. Em novembro veio uma Série A de US$ 2,1 milhões, com a Pelion Venture Partners e a Venrock."
        },
        {
          "year": 2010,
          "title": "Lançamento público no TechCrunch Disrupt",
          "detail": "Lançada em 27 de setembro. O tráfego pela rede passou de cerca de 50 milhões de page views por mês para mais de cinco bilhões no primeiro ano, num modelo freemium que dava o plano gratuito e aprendia com o tráfego dele."
        },
        {
          "year": 2016,
          "title": "Lee Holloway se afasta",
          "detail": "O cofundador que escreveu o protótipo original e liderou a primeira equipe de engenharia, incluindo o trabalho com Anycast, afastou-se após um diagnóstico de demência frontotemporal. O IPO da empresa em 2019 teve o codinome Project Holloway.",
          "sourceNote": "Relatado publicamente por Prince e Zatlyn na Cloudflare TV. Incluído porque a própria empresa conta a história e porque a engenharia que ela credita a ele é estrutural."
        },
        {
          "year": 2018,
          "title": "1.1.1.1",
          "detail": "Um resolver DNS público lançado com compromisso de privacidade e auditorias independentes, num endereço curto o bastante para ser memorizado e antes usado como depósito para equipamentos mal configurados."
        },
        {
          "year": 2019,
          "title": "Listagem na Bolsa de Nova York",
          "detail": "Listada como NET, dez anos depois da constituição."
        },
        {
          "year": 2025,
          "title": "Escala, e o custo dela",
          "detail": "Receita de US$ 2,168 bilhões contra um prejuízo operacional de US$ 207 milhões, com 5.156 funcionários. Construir uma rede global e dar boa parte dela de graça custa caro em qualquer escala.",
          "sourceNote": "Números do resumo da Wikipedia sobre as demonstrações financeiras de 2025."
        }
      ],
      // Products: names as the vendor writes them; descriptions translated.
      products: [
        {
          "name": "CDN reverse proxy e WAF",
          "what": "O serviço original: o tráfego é apontado para a Cloudflare pelo DNS, guardado em cache e inspecionado na borda, e encaminhado à origem. Todo o resto foi construído sobre esse caminho."
        },
        {
          "name": "Mitigação de DDoS",
          "what": "Absorver ataques volumétricos numa rede grande o bastante para que um ataque dimensionado para derrubar um cliente não esteja dimensionado para derrubar a rede que o transporta."
        },
        {
          "name": "Workers",
          "what": "Código que roda na borda, e não numa região, num modelo de isolates que inicia rápido o bastante para ficar no caminho da requisição sem acrescentar um cold start a ela."
        },
        {
          "name": "R2",
          "what": "Armazenamento de objetos vendido sem taxa de egress, uma decisão de preço apontada diretamente para a cobrança que torna caro sair de um provedor de nuvem."
        },
        {
          "name": "Cloudflare One and Zero Trust",
          "what": "Serviços de acesso, gateway e túnel que põem a mesma borda na frente das aplicações internas, concorrendo com os fabricantes de secure service edge que aparecem em outros pontos desta linha do tempo."
        },
        {
          "name": "1.1.1.1",
          "what": "Um resolver recursivo público, oferecido de graça, que também dá à empresa uma visão do comportamento do DNS numa escala que pouquíssimas organizações têm."
        }
      ],
      // Innovations: title and detail translated.
      innovations: [
        {
          "title": "O plano gratuito como instrumento, não como desconto",
          "detail": "O plano gratuito não era só aquisição de clientes. Uma rede que transporta milhões de sites pequenos vê ataques mais cedo e com mais frequência do que uma que transporta poucos sites grandes, e os dados melhoram a defesa vendida a todos. A gratuidade é o jeito como o produto aprende."
        },
        {
          "title": "Anycast como arquitetura, não como recurso",
          "detail": "O mesmo endereço anunciado de todos os locais, de modo que o tráfego cai no ponto de presença mais próximo e um ataque se divide pela rede em vez de se concentrar. É por isso que capacidade e defesa são o mesmo ativo aqui."
        },
        {
          "title": "Computação na borda sem cold start",
          "detail": "Os Workers usam V8 isolates em vez de containers, trocando força de isolamento e liberdade de linguagem por tempos de inicialização baixos o bastante para rodar a cada requisição. Essa troca é toda a decisão de produto, e é o motivo pelo qual o modelo serve para tratar requisições, e não para tarefas longas."
        },
        {
          "title": "O preço de egress como arma competitiva",
          "detail": "Não cobrar nada para tirar dados ataca justamente a taxa que torna cara a migração entre nuvens. É um argumento de preço apontado para um argumento estrutural."
        }
      ],
      // Markets paragraphs.
      markets: [
        "Dois clientes muito diferentes numa só plataforma: milhões de sites pequenos nos planos gratuito e de baixo custo, e empresas que compram desempenho, segurança e, cada vez mais, serviços de rede. A empresa declara mais de 100.000 clientes pagantes contra dezenas de milhões de propriedades, que é a forma do freemium dita com todas as letras.",
        "Sua rede alcança 300 ou mais cidades em 100 ou mais países, e sua posição concorre em várias frentes ao mesmo tempo: entrega de conteúdo contra a Akamai, segurança contra os fabricantes de firewall e de secure service edge, e plataforma para desenvolvedores contra os grandes provedores de nuvem cujas taxas de egress ela derruba."
      ],
      // Analyst standing statements.
      analyst: [
        "Citada na cobertura de analistas em várias categorias distintas, e não em uma só, o que reflete um portfólio montado em torno de uma única rede, e não de uma única linha de produtos.",
        "Vale ler a situação financeira junto com o crescimento: receita acima de US$ 2 bilhões em 2025, com prejuízo operacional, que é a cara, num balanço, de construir infraestrutura global e dar boa parte dela de graça."
      ],
    },
  },
  // ---- codex: pt-BR prose for the record (facts stay in the English record) ----
  "codex": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Codex - os modems, e a matemática por baixo deles",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Uma empresa cujo produto era processamento de sinais vendido numa caixa, na janela que um órgão regulador acabara de abrir.",
    intro: "A Codex fabricou modems de alta velocidade nos anos seguintes às decisões de interconexão que tornaram legal que alguém além da companhia telefônica ligasse equipamentos a uma linha. Seu trabalho ficava no lado matemático da comunicação de dados (fazer passar por um circuito de qualidade de voz mais bits do que o circuito parecia capaz de carregar), uma disciplina diferente do switching e da multiplexação de que trata a maior parte desta linha do tempo.",
    // Body: 5 paragraph(s), same order as the English.
    body: [
      "A Codex foi constituída em julho de 1962 por James Cryer e Arthur Kohlenberg, um diretor e um cientista-chefe de uma divisão de pesquisa da Melpar na região de Boston, por um motivo banal: o empregador estava se mudando para outro estado e nenhum dos dois queria deixar a região. Levaram consigo o conhecimento e os contatos e viveram de contratos de defesa, e foi a incerteza disso (nunca saber se viria outro contrato) que os empurrou para a fabricação de produtos.",
      "O produto nasceu de uma conversa. Robert Gallager, do MIT, disse a eles que um modem de 9600 bits por segundo era possível, quatro vezes o modem comercial mais rápido que a AT&T vendia na época, e os apontou para Jerry Holsinger, doutor pelo MIT em 1965 com uma tese sobre transmissão em alta velocidade por linhas telefônicas. Holsinger tinha um protótipo desenvolvido com financiamento da National Security Agency, uma empresa chamada Teldata e nenhum sucesso em levantar dinheiro. A Codex a comprou em maio de 1967.",
      "O AE-96 chegou ao mercado em maio de 1968 como o primeiro modem de 9600 bps do mundo, e sua ficha técnica é a coisa mais útil deste verbete. Pesava cerca de 125 libras, tinha sessenta e seis placas de circuito impresso com lógica resistor-transistor, e cada par precisava ser ajustado à mão para o circuito telefônico específico em que funcionava, e reajustado sempre que a linha mudava, o que acontecia sempre. Um produto pioneiro que mal se consegue operar continua sendo pioneiro, e a liderança de mercado ficou com a segunda geração, a L Series, desenvolvida sob David Forney.",
      "Há uma segunda lição por baixo dessa. A Bell Labs sabia desde meados dos anos 1950 que essas velocidades eram alcançáveis e só tinha chegado a 2400 bps, enquanto o projeto que funcionou veio de uma pessoa de fora da maior organização de pesquisa em comunicações do mundo. Isso não prova que grandes laboratórios não conseguem inovar; lembra que um problema importante para um indivíduo determinado pode ultrapassar um problema atribuído a um departamento.",
      "A Motorola procurou a Codex em 1976 e a adquiriu, e ela operou como divisão da Motorola por décadas antes de virar Vanguard Managed Solutions e depois Vanguard Networks. A última decisão estratégica como linha independente também merece registro: em 1984, ela encerrou seus próprios esforços em redes locais e passou a revender produtos da Ungermann-Bass. Uma empresa que tinha definido o topo de um mercado não conseguiu atravessar para o mercado vizinho, o que é o desfecho muito mais frequente do que a travessia.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A Codex Corporation tornou-se uma subsidiária integral da Motorola e depois foi dissolvida, com seus negócios incorporados a outras operações da Motorola, conforme o relatório anual da Motorola de 1994.",
  },
  // ---- cpqd: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "cpqd": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "CPqD",
    // Card line (also the meta description) and intro paragraph.
    tagline: "O centro de pesquisa estatal que sobreviveu à privatização do Estado.",
    intro: "A Telebrás criou o Centro de Pesquisa e Desenvolvimento em Telecomunicações em 1976, em Campinas, com uma missão explicitamente industrial, e não acadêmica: desenvolver tecnologia nacional de telecomunicações para que o Brasil comprasse menos do exterior. Quando o Sistema Telebrás foi desmembrado e vendido em 1998, o CPqD não foi junto. Tornou-se uma fundação independente e continua em operação.",
    // Body: 5 paragraph(s), same order as the English.
    body: [
      "A diretoria da Telebras decidiu criar o Centro de Pesquisa e Desenvolvimento em 31 de agosto de 1976, com um objetivo declarado abertamente na época: reproduzir no Brasil um modelo de pesquisa em telecomunicações voltado à autonomia tecnológica nacional. Fazia parte do segundo plano nacional de desenvolvimento, cujo propósito era a substituição de importações, e assumiu a pesquisa aplicada, a pesquisa básica conduzida com universidades sob coordenação e financiamento da Telebras, e a transferência de tecnologia, protótipos e produtos para a indústria.",
      "A última dessas três é a que o tornou incomum. Um centro de pesquisa dentro de um monopólio estatal poderia ter guardado o que construía; este foi estruturado para entregar projetos aos fabricantes, e é por isso que chegou a existir uma indústria nacional de equipamentos de telecomunicações. Sistemas de comutação digital, de transmissão e de rede saíram dele e foram fabricados por empresas que não os tinham desenvolvido.",
      "Ele cresceu do jeito que as instituições de fato crescem, e não do jeito como são descritas. Começou num escritório no centro de Campinas, mudou-se para instalações da Embratel e se espalhou por cinco endereços antes da compra, em junho de 1980, do terreno do campus que ocupa hoje, na rodovia Campinas–Mogi Mirim.",
      "A data mais reveladora está no fim. A Telebras foi privatizada em leilão em 29 de julho de 1998, e em 23 de julho, seis dias antes, o CPqD foi convertido numa fundação de direito privado com base na Lei Geral de Telecomunicações. A instituição de pesquisa foi retirada de propósito antes de o monopólio ser vendido. Um país que vendia seu sistema telefônico decidiu, à parte, que queria manter o lugar onde vivia o conhecimento de engenharia, uma distinção que a maioria das privatizações nem se dá ao trabalho de fazer.",
      "Ele sobreviveu a essa transição e continuou trabalhando, tornando-se o maior depositante de registros de software do país e um depositante importante de patentes, com participação em empresas que comercializam o que ele desenvolve. O programa de pesquisa que mantém é descrito como o maior da América Latina em sua área.",
    ],
    // Profile: complete copy of profiles/cpqd.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "cpqd",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          "company": "Centro de Pesquisa e Desenvolvimento da Telebrás",
          "year": 1976,
          "place": "Campinas, São Paulo",
          "founders": [
            "Telebrás",
            "Ministério das Comunicações"
          ],
          "story": "Aprovado pela diretoria da Telebrás em 31 de agosto, com um propósito declarado de forma incomumente explícita no registro: autonomia tecnológica do país em telecomunicações. Começou num escritório no centro da cidade, depois ocupou espaço cedido pela Embratel e passou por cinco endereços antes da compra, em 1980, do terreno do campus que ainda usa."
        }
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        {
          "year": 1980,
          "title": "Um campus próprio",
          "detail": "Compra do terreno do que viria a ser o Pólis de Tecnologia: 360.000 metros quadrados, dos quais cerca de 55.000 construídos. A escala diz muito sobre quanto tempo se esperava que o projeto durasse."
        },
        {
          "year": 1998,
          "title": "Independente seis dias antes da venda da controladora",
          "detail": "O CPqD tornou-se fundação de direito privado em 23 de julho, com base na Lei Geral das Telecomunicações. O leilão da Telebrás aconteceu em 29 de julho. A capacidade de pesquisa foi separada de propósito antes que aquilo que a financiava fosse desmembrado e vendido, uma decisão que alguém teve de tomar deliberadamente."
        }
      ],
      // Products: names as the vendor writes them; descriptions translated.
      products: [
        {
          "name": "Comutação digital Trópico",
          "what": "Centrais telefônicas de projeto brasileiro, desenvolvidas aqui e fabricadas pela indústria: o maior empreendimento isolado da era anterior à privatização e a razão de ser da missão."
        },
        {
          "name": "O orelhão de cartão indutivo",
          "what": "O cartão e o telefone que o aceitava, usados por praticamente todo mundo no Brasil durante uma década. É a parte do trabalho desta instituição que o maior número de pessoas tocou fisicamente, e quase ninguém sabia de onde ela vinha."
        },
        {
          "name": "Componentes ópticos",
          "what": "Fibra óptica, lasers semicondutores e equipamentos de transmissão óptica: as tecnologias que mais tarde viraram spin-offs, como Padtec e BrPhotonics, em vez de ficarem na pesquisa."
        },
        {
          "name": "Sistemas de suporte a operações e a negócios",
          "what": "O software sobre o qual uma operadora funciona: provisionamento, faturamento, gerência de rede. Sem glamour, enorme, e a parte com maior probabilidade de ser importada se ninguém no país a construir."
        },
        {
          "name": "Testes e certificação",
          "what": "Avaliação de conformidade e interoperabilidade, e participação no padrão brasileiro de televisão digital: um trabalho que produz documentos, e não aparelhos."
        }
      ],
      // Innovations: title and detail translated.
      innovations: [
        {
          "title": "Desenvolver aqui, fabricar lá",
          "detail": "O modelo era explícito: o CPqD fazia pesquisa aplicada, coordenava pesquisa básica com universidades, construía protótipos e depois transferia a tecnologia a empresas que a fabricavam e vendiam. O instituto nunca virou fábrica. Essa separação é o que permitiu a um centro de pesquisa estatal produzir produtos comerciais sem virar um fabricante estatal, e é o mecanismo por trás da missão industrial que o verbete acima descreve."
        },
        {
          "title": "Gerar spin-offs em vez de segurar",
          "detail": "A Padtec, em transmissão óptica, a Trópico, em comutação, a BrPhotonics, em fotônica, e uma dúzia de outras surgiram de trabalhos feitos aqui e são chamadas, em conjunto, de universo CPqD. Uma instituição que se mede pelo que sai dela é estruturada de forma muito diferente de uma que se mede pelo que retém."
        },
        {
          "title": "A autonomia tecnológica como programa de engenharia",
          "detail": "A substituição de importações costuma ser uma política comercial. Aqui foi uma agenda de pesquisa com entregas (comutação, transmissão, fibra, lasers), cada uma escolhida porque o país a comprava do exterior. Se a política deu certo é algo discutido em outros pontos desta linha do tempo; o que não está em dúvida é que alguém pôs no papel quais tecnologias importavam e depois as construiu."
        },
        {
          "title": "Contar a produção em registros",
          "detail": "Ele se tornou o maior depositante de registros de software do Brasil e o segundo maior depositante não acadêmico de pedidos de patente. Para uma instituição cujos produtos pertencem a outras empresas, o histórico de propriedade intelectual é a única medida honesta do que ela produziu."
        }
      ],
      // Markets paragraphs.
      markets: [
        "Operadoras de telecomunicações, concessionárias de energia, instituições financeiras, governo e defesa: os clientes que precisam de tecnologia construída para as condições e a regulação locais e que não podem simplesmente comprar um produto projetado para outro mercado.",
        "Ele vende pesquisa, desenvolvimento e certificação, e não produtos, o que o coloca diante de consultorias e laboratórios universitários, e não de fabricantes. Seu ativo distintivo é fazer isso no setor de telecomunicações de um país há cinquenta anos e lembrar o que já foi tentado antes."
      ],
      // Analyst standing statements.
      analyst: [
        "Seu programa de pesquisa é descrito como o maior do gênero em tecnologia da informação e comunicação na América Latina, e o campus faz parte do sistema de parques tecnológicos do estado de São Paulo.",
        "A medida que vale aplicar é incomum: uma instituição criada para servir a um monopólio sobreviveu a ele por quase três décadas, e o fez vendendo para as empresas em que o monopólio foi dividido. Muito pouco do Sistema Telebrás sobrevive com o próprio nome. A parte que sobreviveu foi a que não foi vendida."
      ],
    },
  },
  // ---- cybereason: pt-BR prose for the record (facts stay in the English record) ----
  "cybereason": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Cybereason",
    // Card line (also the meta description) and intro paragraph.
    tagline: "A empresa de detecção em endpoints que achou o kill switch do NotPetya, levantou mais de US$ 850 milhões e terminou dentro de uma empresa de serviços.",
    intro: "A Cybereason foi fundada em 2012 por Lior Div e Yonatan Striem-Amit, constituída em Delaware, e instalou sua sede em Boston em 2014. Seu produto era endpoint detection and response, depois vendido como extended detection and response, entregue como plataforma e como serviço gerenciado; seu braço de pesquisa, o Nocturnus, foi o primeiro a publicar uma vacina para os surtos de NotPetya e Bad Rabbit de 2017 e, em 2019, revelou a Operation Soft Cell, uma campanha chinesa de espionagem estatal contra provedores de telecomunicações.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "O dinheiro foi a história durante uma década. A SoftBank era a principal investidora, a CapitalG, do Google Cloud, aportou US$ 50 milhões em outubro de 2021, e o total captado passou de US$ 850 milhões; em fevereiro de 2022, a Reuters noticiou uma abertura de capital planejada com avaliação de US$ 5 bilhões, abandonada até outubro daquele ano, depois do que vieram demissões sucessivas e um efetivo de cerca de 950 pessoas. Eric Gan, o CEO que sucedeu Div, renunciou em 5 de março de 2025, em meio a uma disputa com investidores sobre financiamento, e Manish Narula assumiu o cargo.",
      "O desfecho veio do lado dos serviços da indústria. Em 14 de outubro de 2025, a LevelBlue, a provedora de segurança gerenciada separada da AT&T, anunciou que compraria a empresa pelo XDR, pela forense digital e resposta a incidentes e pela inteligência de ameaças; o negócio foi concluído em 25 de novembro de 2025, e a SoftBank Corp., o SoftBank Vision Fund 2 e a Liberty Strategic Capital passaram a ser investidores da LevelBlue como parte dele. O site da LevelBlue hoje diz, em quatro palavras, Cybereason is now LevelBlue (a Cybereason agora é a LevelBlue).",
      "Por que ela pertence a um registro de redes: a detecção em endpoints é para onde foi o problema de visibilidade da rede depois que a criptografia fechou o cabo, e o destino de uma empresa de produto bem financiada, comprada por uma empresa de serviços pela telemetria e pelas pessoas, é o padrão dos anos 2020 que esta cronologia não para de registrar.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "Adquirida pela LevelBlue, com anúncio em 14 de outubro de 2025 e conclusão em 25 de novembro de 2025; a marca foi absorvida pela LevelBlue.",
    // Successor link label (the URL stays in the English record).
    successorLabel: "LevelBlue (Cybereason is now LevelBlue)",
  },
  // ---- cyclades-avocent-vertiv: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "cyclades-avocent-vertiv": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Cyclades, Avocent & Vertiv - a camada física da disponibilidade",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Uma pioneira dos console servers fundada no Brasil, as líderes de KVM e o clima de sala de computadores da Liebert, consolidados na empresa cujo produto é a própria disponibilidade.",
    intro: "A Cyclades, fundada em 1988 numa garagem de São Paulo por João Lima e Daniel Dalarossa, defensora pioneira do Linux que depois se mudou para a Califórnia, construiu a disciplina do out-of-band: o caminho de console que não compartilha o destino da rede que gerencia. Pela herança de KVM da Avocent e pela Emerson Network Power (cuja outra raiz é a refrigeração de precisão de Ralph Liebert, de 1965), a linhagem virou Vertiv: acesso, energia e refrigeração como um único problema, hoje a restrição em torno da qual se planeja a expansão da IA. O nome também merece uma nota de rodapé honrosa: a rede de pesquisa CYCLADES de Pouzin, a ancestral francesa a quem o TCP/IP dá crédito, agora tem perfil próprio nesta linhagem de pioneiros; mesmo nome, outro continente, nenhuma relação societária.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "O perfil cobre a fundação brasileira de 1988, a categoria dos console servers, a aquisição pela Avocent em 2006, a Emerson Network Power e a raiz Liebert, a separação da Vertiv em 2016 e a era da densidade da IA.",
    ],
    // Profile: complete copy of profiles/cyclades-avocent-vertiv.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "cyclades-avocent-vertiv",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          "company": "Cyclades Corporation",
          "year": 1988,
          "place": "São Paulo, Brasil",
          "founders": [
            "João \"John\" Lima",
            "Daniel Dalarossa"
          ],
          "story": "A Cyclades começou em 1988 numa garagem da Vila Olímpia, em São Paulo (a ideia surgiu naquele ano numa mesa da lanchonete Wells, na Rua Augusta), fundada por João \"John\" Lima e Daniel Dalarossa com cerca de seis mil dólares de capital inicial. Mais tarde se mudou para Fremont, na Califórnia, mas a fundação foi brasileira, e o instinto também: construir a disciplina de alcançar os equipamentos quando a rede está fora do ar, com console servers seriais, caminhos out-of-band, energia remota, o plano de último recurso que todo operador torce para ter configurado. Adepta precoce e entusiasmada do Linux (seus console servers rodavam código aberto e o defendiam), a Cyclades virou o nome nos adaptadores RJ-45 para serial de uma geração de carrinhos de emergência de data center, e um marco discreto da diáspora tecnológica brasileira.",
          "sourceNote": "Ano de fundação, origem paulistana e nomes dos fundadores segundo pt.wikipedia.org/wiki/Cyclades."
        },
        {
          "company": "Liebert (Vertiv's physical-layer root)",
          "year": 1965,
          "place": "Columbus, Ohio",
          "founders": [
            "Ralph Liebert"
          ],
          "story": "Ralph Liebert construiu o primeiro ar-condicionado de precisão feito para salas de computadores: o reconhecimento de que as máquinas precisam de um clima próprio. As linhas de refrigeração e de UPS da Liebert, adquiridas pela Emerson em 1987, viraram a espinha dorsal da Emerson Network Power: a outra metade da história que termina na Vertiv, onde o console server e a unidade CRAC dividem o mesmo crachá, gerência e ambiente, as duas metades da disponibilidade física."
        }
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        {
          "year": 1994,
          "title": "A categoria dos console servers",
          "detail": "Os terminal servers e console servers da Cyclades transformam o 'ir até o local com um laptop e um cabo' num serviço de rede: o acesso out-of-band como camada projetada, e não como improviso de emergência."
        },
        {
          "year": 2000,
          "title": "Nasce a Avocent",
          "detail": "Apex e Cybex, as duas líderes em switches KVM, se fundem como Avocent: teclado, vídeo e mouse a distância, a outra tecnologia de mãos remotas da época."
        },
        {
          "year": 2006,
          "title": "A Cyclades entra na Avocent",
          "detail": "A Avocent adquire a Cyclades (cerca de US$ 90 milhões): consoles seriais e KVM sob o mesmo teto, o kit completo de out-of-band, herança Linux incluída.",
          "sourceNote": "Valor do negócio segundo o registro público."
        },
        {
          "year": 2009,
          "title": "Para dentro da Emerson Network Power",
          "detail": "A Emerson Electric adquire a Avocent (cerca de US$ 1,2 bilhão) e a junta às linhas de refrigeração e energia da Liebert: plano de gerência e plano físico consolidados."
        },
        {
          "year": 2016,
          "title": "Vertiv",
          "detail": "A Emerson vende a Network Power à Platinum Equity (cerca de US$ 4 bilhões); rebatizada de Vertiv, ela abre capital em 2020: UPS, refrigeração, PDUs e a herança de acesso Avocent/Cyclades numa só empresa cujo produto é, na prática, a própria disponibilidade.",
          "sourceNote": "Valores dos negócios segundo o registro público."
        },
        {
          "year": 2023,
          "title": "A era da densidade da IA",
          "detail": "À medida que os racks sobem de alguns quilowatts para as dezenas, o conjunto de problemas da Vertiv (energia, refrigeração líquida e, ainda, aquele console serial quando todo o resto está apagado) vira a restrição em torno da qual a indústria inteira se planeja."
        }
      ],
      // Products: names as the vendor writes them; descriptions translated.
      products: [
        {
          "name": "Cyclades TS/ACS console servers",
          "what": "A linha de acesso out-of-band: consoles seriais alcançáveis quando a rede de produção não está."
        },
        {
          "name": "Avocent KVM and DCIM",
          "what": "Teclado, vídeo e mouse remotos, e a camada de gerenciamento de infraestrutura de data center que cresceu a partir deles."
        },
        {
          "name": "Energia e refrigeração Liebert",
          "what": "Refrigeração de precisão e UPS: a metade ambiental de manter os racks vivos."
        }
      ],
      // Innovations: title and detail translated.
      innovations: [
        {
          "title": "O out-of-band como arquitetura",
          "detail": "A Cyclades fez da independência do plano de gerência um princípio de projeto: um caminho até o console que não compartilha o destino da rede que gerencia, a disciplina que todo runbook destas páginas pressupõe."
        },
        {
          "title": "A disponibilidade como categoria de produto",
          "detail": "A consolidação da Vertiv deu nome a uma verdade: acesso, energia e refrigeração são um único problema, a camada física da disponibilidade."
        }
      ],
      // Markets paragraphs.
      markets: [
        "A Vertiv é hoje um dos fornecedores que definem a expansão da IA (energia e refrigeração em densidade sem precedentes), com a linhagem de acesso Avocent/Cyclades ainda no catálogo."
      ],
      // Analyst standing statements.
      analyst: [
        "O verbete com nota de terra natal: uma empresa fundada no Brasil na raiz da disciplina do out-of-band e, a um xará honroso de distância, a rede CYCLADES de Pouzin, a pioneira francesa dos datagramas a quem os autores do TCP/IP dão crédito. Duas linhagens, um nome, ambas dignas de conhecer."
      ],
    },
  },
  // ---- d-link: pt-BR prose for the record (facts stay in the English record) ----
  "d-link": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "D-Link - o adaptador dentro da máquina, não no rack",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Fabricante taiwanesa de equipamentos de rede fundada em 1986 como Datex Systems; a primeira empresa de redes listada em Taiwan.",
    intro: "A D-Link foi fundada em Taipei em 1986 por Ken Kao e outros seis sócios como Datex Systems (data e exchange), vendendo adaptadores de rede. Mudou de nome em 1992, mantendo o D e acrescentando Link, e em 1994 tornou-se a primeira empresa de redes listada na Bolsa de Valores de Taiwan.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "Ela entrou na indústria pela ponta oposta à da maioria dos fabricantes desta linha do tempo. As empresas que dominam estas páginas vendiam para operadoras e grandes empresas; esta vendia a placa que ia dentro do computador pessoal, depois o hub, depois o roteador de escritório pequeno. É a metade da rede sobre a qual ninguém escreve histórias e que a maioria das pessoas de fato já tocou.",
      "Uma decisão de 1989 merece ser posta ao lado dos marcos de fabricação daqui. Ela passou a projetar e fabricar os próprios chips controladores Ethernet em vez de comprá-los, para reduzir custo e dependência, exatamente a direção oposta à que a indústria tomou depois, quando o merchant silicon tornou comprar o chip a opção mais barata e construí-lo a mais cara. As duas escolhas estavam certas em sua década, e é esse o ponto.",
      "O objetivo declarado do fundador era uma empresa que fizesse os próprios produtos, em vez de fabricar com a marca de outra, num país cuja indústria eletrônica foi construída em grande parte justamente fazendo isso. A linha do tempo registra em outros pontos as versões irlandesa e brasileira dessa questão; esta é a taiwanesa, respondida por uma empresa que pôs o próprio nome na caixa.",
    ],
  },
  // ---- ekahau: pt-BR prose for the record (facts stay in the English record) ----
  "ekahau": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Ekahau",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Software de projeto e site survey de Wi-Fi nascido num grupo de machine learning da Universidade de Helsinque, vendido à Ookla em 2018 e levado para dentro da Accenture em 2026.",
    intro: "A Ekahau foi fundada em 2000 por pesquisadores da Universidade de Helsinque do grupo CoSCo, no Helsinki Institute for Information Technology, entre eles Henry Tirri, Petri Myllymäki, Teemu Roos, Kimmo Valtonen, Tomi Silander, Petri Kontkanen, Antti Tuominen, Jussi Lahtinen e Hannes Wettig. Em 2018 ela era, nas palavras das partes envolvidas em sua venda, a principal fornecedora de soluções para projeto e troubleshooting de redes wireless corporativas, com 75 profissionais, a maioria na Finlândia.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "Em outubro de 2018, a Nexit Ventures vendeu a Ekahau à Ookla LLC, a empresa do Speedtest e subsidiária da Ziff Davis. O preço não foi divulgado; o Helsingin Sanomat o estimou entre 100 e 130 milhões de euros, e o Finnish Center for Artificial Intelligence registrou o negócio como Finnish machine learning research behind an acclaimed acquisition (pesquisa finlandesa em machine learning por trás de uma aquisição aclamada).",
      "A linha de produtos hoje, segundo o próprio site da Ekahau: Ekahau Plan, Measure Pro e a Software Suite, o dispositivo de medição Sidekick 2, AI Pro Online, Survey, Analyzer e Optimizer, além de um braço de treinamento. O rodapé desse site dizia, no dia em que este verbete foi escrito, 'Ookla, LLC., an Accenture company' (Ookla, LLC., uma empresa Accenture): em 2 de março de 2026, a Accenture anunciou, de Barcelona, que adquiriria a Ookla da Ziff Davis, citando Speedtest, Downdetector, Ekahau e RootMetrics como as marcas e sem divulgar os termos.",
      "A linhagem é incomum para este registro. O Finnish Center for Artificial Intelligence arquivou a venda sob Finnish machine learning research behind an acclaimed acquisition, e os nomes dos fundadores são a lista de um grupo de pesquisa, não a de um engenheiro de campo: das três ferramentas de survey desta linha do tempo, a Ekahau é a que começou como algoritmos universitários.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "Vendida pela Nexit Ventures à Ookla LLC, subsidiária da Ziff Davis, em outubro de 2018, por um preço que as partes não informaram e que o Helsingin Sanomat estimou entre 100 e 130 milhões de euros. Os produtos Ekahau continuam sob a Ookla, cuja venda à Accenture foi anunciada em 2 de março de 2026; o rodapé do site da Ekahau agora diz 'Ookla, LLC., an Accenture company'.",
  },
  // ---- embraer: pt-BR prose for the record (facts stay in the English record) ----
  "embraer": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Embraer - o Estado construiu uma empresa aeroespacial e depois a vendeu",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Fundada em 1969 como campeã nacional, privatizada em 1994, terceira maior fabricante de aeronaves civis.",
    intro: "A Embraer foi fundada em 19 de agosto de 1969 em São José dos Campos por Ozires Silva, com financiamento do governo, como uma tentativa deliberada de criar capacidade aeroespacial nacional. Abasteceu primeiro a Força Aérea, passou nos anos 1980 aos aviões regionais para exportação, foi privatizada em 1994 e é hoje a terceira maior fabricante de aeronaves civis.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "A trajetória é a parte interessante, e é incomum: uma campeã nacional financiada pelo Estado que sobreviveu à privatização e depois competiu internacionalmente pela engenharia, e não pela proteção. A maioria das tentativas dessa sequência fracassa no segundo passo.",
      "A computação por trás dela é o motivo pelo qual ela importa. O projeto de aeronaves são décadas de dados de engenharia que precisam continuar legíveis e rastreáveis por toda a vida útil da aeronave, que é mais longa do que a vida de qualquer formato, de qualquer fornecedor e da maioria dos sistemas operacionais. Gerência de configuração nessa escala de tempo é um problema de registros antes de ser um problema de armazenamento.",
      "Ela é também uma fabricante sujeita a controle de exportação, com fornecedores em vários continentes, o que faz da rede tanto uma superfície de compliance quanto um meio de transporte: o que pode cruzar qual fronteira, em qual direção, é uma pergunta sobre dados tanto quanto sobre peças.",
    ],
  },
  // ---- epam: pt-BR prose for the record (facts stay in the English record) ----
  "epam": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "EPAM Systems - o corredor entre dois mundos, e o que uma guerra fez com ele",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Fundada num apartamento em New Jersey e num porão em Minsk em 1993; em 2022 tinha 14.000 engenheiros na Ucrânia e 18.000 em Belarus e na Rússia, e o silêncio do fundador virou a história.",
    intro: "A EPAM Systems é uma empresa americana de serviços de engenharia de software fundada em 1993 por dois amigos de escola bielorrussos, um em Princeton e outro em Minsk, que cresceu até entrar no S&P 500 entregando engenharia do Leste Europeu para clientes ocidentais.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "O nome é a abreviação de Effective Programming for America, e o arranjo da fundação era exatamente isso: em 1993, Arkadiy Dobkin, dois anos depois de deixar Minsk, vendia o trabalho a partir de seu apartamento em New Jersey enquanto o amigo de escola Leo Lozner comandava os engenheiros no porão do prédio dele em Minsk. A União Soviética tinha formado um número enorme de programadores muito bons e depois deixado de existir; a empresa foi construída sobre a diferença entre o que eles custavam em Belarus e o que o trabalho deles valia nos Estados Unidos, e sobre tornar essa diferença confiável através de uma fronteira.",
      "Minsk ganhou um centro de entrega de verdade em 1994, Budapeste em 1995 e a Ucrânia a partir de 2000, que virou a maior base de engenharia de todas. A empresa abriu capital em Nova York em 2012, a primeira de Belarus a fazê-lo, e entrou no S&P 500 com mais de sessenta mil pessoas em mais de cinquenta países. Dobkin a comandou por trinta e dois anos, até virar presidente executivo do conselho em 1º de setembro de 2025 e passar o cargo de CEO a Balazs Fejes. A mãe do próprio Dobkin tinha fugido do gueto de Minsk aos quinze anos.",
      "Então as duas metades do modelo entraram em guerra uma com a outra. No início de 2022, a empresa tinha cerca de 14.000 funcionários na Ucrânia e 18.000 em Belarus e na Rússia. Quando a Rússia invadiu, em 24 de fevereiro, a declaração pública do fundador não citou a Rússia, nem Putin, nem sua Belarus natal, e ele recusou os apelos para pôr a infraestrutura da empresa a serviço do lado ucraniano. A reação dentro e fora da empresa foi dura. Sua defesa, segundo o que foi noticiado, era que a empresa não podia deixar seus sistemas serem usados para ciberataques e que precisava proteger as pessoas na Rússia e em Belarus das represálias políticas comuns por lá. Tanto a declaração quanto as críticas pertencem ao registro; o que um fundador devia a quais de seus funcionários naquela semana não é uma pergunta que o registro resolva.",
      "O que a empresa fez em seguida é menos ambíguo: suspendeu suas operações na Rússia e em Belarus, o país de onde veio, e tirou boa parte de sua força de trabalho, com as famílias, do caminho da guerra. Os verbetes da Huawei e da Atos perguntam onde um fornecedor está constituído. Este pergunta onde estão as pessoas dele, e mostra que uma empresa de serviços é um conjunto de seres humanos em lugares específicos, e que uma fronteira atravessando seu meio não é uma abstração. Todo comprador de engenharia offshore desde então teve de perguntar de que lado de qual linha estão as pessoas que fazem o trabalho.",
    ],
  },
  // ---- extreme: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "extreme": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Extreme Networks",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Fabricante de equipamentos de rede: switching corporativo, wireless e software de rede gerenciado em nuvem.",
    intro: "A Extreme Networks foi fundada em maio de 1996 por Gordon Stitt, Herb Schneider e Stephen Haddock, todos vindos da Network Peripherals, para construir switches Gigabit Ethernet para empresas. Sua identidade inicial era puxada pelo hardware: silício próprio, um único sistema operacional e uma linha de produtos deliberadamente estreita numa época em que os concorrentes vendiam catálogos.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A estratégia que a define veio depois, e é incomum. Em vez de disputar participação em projetos novos contra a Cisco, a Extreme comprou os negócios de redes corporativas dos quais empresas maiores estavam saindo: a Enterasys em 2013, a linha wireless da Zebra em 2016, o negócio de redes da Avaya em 2017, o negócio de data center da Brocade em 2017 e a Aerohive em 2019.",
      "Cada um desses foi o recuo estratégico de outra empresa. A Enterasys era o que restava da Cabletron, uma empresa que um dia tinha sido a rival mais séria da Cisco. O braço de redes da Avaya vinha da Nortel. O da Brocade tinha vindo da Foundry. A Aerohive tinha sido fundada por gente saída da NetScreen. Assim, a linha de produtos da Extreme é um acúmulo de linhagens que esta linha do tempo cobre separadamente, e sua base instalada inclui clientes que compraram de quatro empresas que já não existem.",
      "Isso cria um problema de engenharia específico, e a empresa tem sido franca sobre ele: vários sistemas operacionais herdados de uma só vez, e uma década de trabalho para convencer uma base instalada a convergir para menos deles. EXOS e VOSS persistem porque os dois vieram com clientes que não tinham motivo para migrar.",
      "O trabalho de Fabric Connect, herdado com a linha da Avaya e originalmente da Nortel, é a coisa tecnicamente mais distintiva do portfólio: shortest path bridging usado para fazer do provisionamento de serviços uma operação só na borda. É o tema de uma das ferramentas deste site, e chegou por meio da aquisição de uma aquisição.",
    ],
    // Profile: complete copy of profiles/extreme.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "extreme",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          "company": "Extreme Networks",
          "year": 1996,
          "place": "Cupertino, Califórnia (depois Santa Clara e San Jose; hoje Morrisville, Carolina do Norte)",
          "founders": [
            "Gordon Stitt",
            "Stephen Haddock",
            "Herb Schneider"
          ],
          "story": "Três colegas da Network Peripherals fundaram a Extreme em maio de 1996 para construir switching Ethernet em wire speed para a era do gigabit. Gordon Stitt, que tinha sido cofundador da própria Network Peripherals, assumiu a cadeira de CEO que ocuparia por uma década. Stephen Haddock, o CTO, não estava só construindo de acordo com o padrão Gigabit Ethernet; ele era um dos editores do padrão e presidiu o comitê IEEE 802.3ad de link aggregation. Herb Schneider, VP de Engenharia, tinha passado de 1981 a 1990 na National Semiconductor trabalhando nos primeiros chipsets Ethernet e FDDI da indústria antes de comandar o desenvolvimento de switches LAN na Network Peripherals. Norwest, AVI, Trinity e Kleiner Perkins os apoiaram, e o roxo virou a cor da Ethernet de alto desempenho."
        }
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        {
          "year": 1996,
          "title": "Fundada por quem escrevia o padrão",
          "detail": "Maio de 1996: o trio da Network Peripherals abre a Extreme em Cupertino, apostando que o switching Ethernet multicamada em wire speed (desempenho de ATM a custo de Ethernet) é para onde as redes de campus estão indo."
        },
        {
          "year": 1997,
          "title": "Summit1",
          "detail": "Sai o primeiro produto: o Summit1, entre os switches Gigabit Ethernet pioneiros em wire speed, seguido pelo chassi modular BlackDiamond para ancorar o topo de linha, com o ExtremeWare (depois ExtremeXOS) como espinha dorsal de software."
        },
        {
          "year": 1999,
          "title": "O quarto IPO de 1999 destas páginas",
          "detail": "9 de abril de 1999: a Extreme estreia na NASDAQ como EXTR, na mesma janela de ouro que levou à bolsa Brocade, Foundry e Juniper. Gordon Stitt comanda a empresa até agosto de 2006; Ed Meyercord, CEO desde abril de 2015, lidera a fase seguinte."
        },
        {
          "year": 2013,
          "title": "Começa a década da consolidação: Enterasys",
          "detail": "Anunciado em 12 de setembro de 2013: a Extreme adquire a Enterasys por cerca de US$ 180 milhões em dinheiro, a linhagem da Cabletron e o DNA de gerência de rede que vira central na história de software da Extreme. O meu próprio capítulo Extreme começa na mesma temporada: as implantações metropolitanas da RNP RedeComep de 2013-2014 contadas acima.",
          "sourceNote": "Números como registrados na página Cabletron/Enterasys desta seção."
        },
        {
          "year": 2016,
          "title": "A WLAN da Zebra: a herança Symbol e Motorola",
          "detail": "Anunciado em 13 de setembro e concluído em 28 de outubro de 2016, por cerca de US$ 55 milhões em dinheiro: o negócio de wireless LAN da Zebra Technologies (o sistema operacional WiNG, o NSight e o AirDefense), cuja linhagem remonta, pela Motorola Solutions (comprada pela Zebra por US$ 3,45 bilhões em 2014), à Symbol Technologies. Meyercord chama o resultado de terceiro maior fornecedor de redes de campus corporativas.",
          "sourceNote": "Extreme 10-Q FY2017; Zebra 10-K FY2016/FY2017."
        },
        {
          "year": 2017,
          "title": "Mais duas linhagens num só ano",
          "detail": "14 de julho de 2017: fecha a compra do negócio Avaya Networking (US$ 100 milhões no anúncio, US$ 79,8 milhões líquidos), trazendo para casa o DNA SynOptics-Wellfleet-Bay-Nortel. Outubro de 2017: o negócio de roteamento de data center da Brocade (a linhagem Foundry: SLX, VDX, MLX) chega da Broadcom por US$ 55 milhões. Em quatro anos, a Extreme reuniu os espólios de três das outras páginas desta seção.",
          "sourceNote": "Números dos 10-K/10-Q da Extreme; as páginas Nortel-Bay e Brocade desta seção."
        },
        {
          "year": 2019,
          "title": "Aerohive: a nuvem vira a plataforma",
          "detail": "Anunciado em 26 de junho e concluído em 9 de agosto de 2019, por cerca de US$ 272 milhões: o wireless gerenciado em nuvem e o SD-WAN da Aerohive, a base sobre a qual o ExtremeCloud IQ foi construído, transformando uma década de espólios de hardware adquiridos num único portfólio gerenciado em nuvem."
        },
        {
          "year": 2021,
          "personal": true,
          "title": "SD-WAN, e começa um capítulo de ensino",
          "detail": "15 de setembro de 2021: chega o negócio de SD-WAN Ipanema, da Infovista. No mesmo ano, eu me torno Extreme Networks Certified Instructor, o início da única relação desta seção de carreira que continua ativa em sala de aula hoje."
        },
        {
          "year": 2024,
          "title": "A chamada das linhagens",
          "detail": "Segundo a própria empresa, o histórico de fusões da Extreme carrega o DNA de redes de pelo menos dezenove empresas, entre elas Digital, Cabletron, Enterasys, Symbol, Motorola, Zebra, Wellfleet, SynOptics, Bay Networks, Nortel, Avaya, Foundry, Brocade e Aerohive. Quatro dessas histórias têm páginas próprias nesta seção; todas terminam aqui."
        },
        {
          "year": 2013,
          "personal": true,
          "title": "O meu capítulo de campo",
          "detail": "2013 a 2014: implantação em campo e entrega de treinamentos com equipamentos Extreme no Brasil, o primeiro capítulo Extreme, oito anos antes de a autorização de instrutor torná-lo o capítulo ativo."
        }
      ],
      // Products: names as the vendor writes them; descriptions translated.
      products: [
        {
          "name": "Summit and BlackDiamond",
          "what": "As franquias fundadoras: switches fixos gigabit em wire speed e o chassi modular que levou a Ethernet de campus e metropolitana, incluindo os anéis ópticos EAPS das minhas implantações na RNP."
        },
        {
          "name": "ExtremeXOS",
          "what": "O sistema operacional modular descendente do ExtremeWare: o EXOS que eu implantei em campo em 2013-2014 e ensino hoje."
        },
        {
          "name": "Fabric Engine and VOSS",
          "what": "A linha de fabric descendente da Avaya: redes shortest-path-bridging da linhagem Bay e Nortel, renascidas como a história de fabric da Extreme."
        },
        {
          "name": "Wireless: do WiNG ao Wi-Fi 7",
          "what": "A herança de WLAN Symbol-Motorola-Zebra mais o gerenciamento em nuvem da Aerohive, fundidos no portfólio ExtremeWireless e na segurança AirDefense."
        },
        {
          "name": "ExtremeCloud IQ",
          "what": "O plano de gerenciamento em nuvem construído pela Aerohive que unifica todo o espólio, e a plataforma por trás dos cursos de ExtremeCloud IQ que eu ministro como instrutor certificado."
        }
      ],
      // Innovations: title and detail translated.
      innovations: [
        {
          "title": "Padrões por dentro",
          "detail": "O CTO da Extreme ajudou a escrever as regras do jogo (editor do padrão Gigabit Ethernet e presidente do esforço de link aggregation), então os produtos nasceram nativos nos padrões desde o primeiro dia."
        },
        {
          "title": "Switching multicamada em wire speed",
          "detail": "O Summit1 ajudou a provar que a Camada 3 em wire speed gigabit, com a economia da Ethernet, batia a complexidade do ATM: a aposta que o mercado de campus inteiro acabou fazendo."
        },
        {
          "title": "Anéis resilientes EAPS",
          "detail": "O protocolo Ethernet Automatic Protection Switching trouxe failover de anel abaixo de um segundo para a Ethernet metropolitana: o mecanismo no centro dos anéis ópticos da RedeComep sobre os quais eu construí."
        },
        {
          "title": "A consolidação como estratégia",
          "detail": "Cinco aquisições em oito anos (Enterasys, Zebra WLAN, Avaya Networking, data center da Brocade, Aerohive), executadas como um segundo ato deliberado: comprar os espólios dos pioneiros e unificá-los na nuvem."
        }
      ],
      // Markets paragraphs.
      markets: [
        "A Extreme é onde as histórias desta seção convergem: a página da Cabletron, a página Nortel-Bay e a página Brocade-Foundry terminam todas em negócios registrados aqui, com uma empresa reunindo discretamente o DNA sobrevivente da guerra dos hubs num portfólio corporativo gerenciado em nuvem.",
        "A minha relação é única nesta seção: implantação em campo em 2013-2014 (anéis metropolitanos da RNP RedeComep em EXOS e EAPS) e instrução desde 2021. A Extreme é o único fabricante das páginas de carreira que eu ainda ensino, com nove cursos autorizados no portfólio."
      ],
      // Analyst standing statements.
      analyst: [
        "No fechamento da WLAN da Zebra, a Extreme se posicionou como o terceiro maior fornecedor de redes de campus corporativas, com a expectativa de que os ativos de WLAN adquiridos acrescentassem mais de US$ 115 milhões em receita anualizada.",
        "A década da consolidação em números: Enterasys, cerca de US$ 180 milhões (2013); Zebra WLAN, cerca de US$ 55 milhões (2016); Avaya Networking, US$ 79,8 milhões líquidos (2017); data center da Brocade, US$ 55 milhões (2017); Aerohive, cerca de US$ 272 milhões (2019). Cerca de US$ 640 milhões para reunir o que os rivais gastaram dezenas de bilhões construindo."
      ],
      // Career cross-link: label translated, href untouched.
      careerLink: {
        "href": "/extreme",
        "label": "A Extreme é uma plataforma que eu ensino hoje: o hub da Extreme neste site"
      },
    },
  },
  // ---- focaldata: pt-BR prose for the record (facts stay in the English record) ----
  "focaldata": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Focaldata",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Parceira Fortinet de nível Expert no Brasil.",
    intro: "Integradora de Barueri listada no nível Expert da Fortinet, e a única parceira deste catálogo cujo modelo de negócio registrado inclui um marketplace.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "O diretório a lista como integradora, marketplace e provedora de segurança gerenciada, com segurança em nuvem, SD-WAN e as duas especializações de secure networking. A linha do marketplace é a que a separa de todas as outras empresas de nível Expert daqui, e descreve outra transação: vender pelo catálogo do próprio provedor de nuvem, onde o gasto já comprometido do cliente paga o software e a parceira nunca chega a emitir uma fatura.",
      "Barueri também merece uma palavra. É onde fica boa parte da TI corporativa de São Paulo, perto o bastante da capital para atendê-la e longe o bastante para que o espaço de escritório caiba no orçamento, e várias empresas deste catálogo estão registradas lá exatamente por esse motivo.",
    ],
  },
  // ---- hitachi: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "hitachi": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Hitachi - o gigante industrial que armazena o mundo",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Do motor de cinco cavalos de uma mina em 1910 aos arrays VSP, aos discos HGST e aos trens expressos britânicos: o conglomerado cuja linhagem de armazenamento atravessa toda SAN.",
    intro: "Namihei Odaira acreditava que o Japão devia construir as próprias máquinas; a oficina de reparos que ele comandava virou uma das empresas de engenharia mais abrangentes do planeta. Para os propósitos deste site, a linha de armazenamento é a que mais importa: a guerra dos mainframes plug-compatible (e a armadilha do FBI de 1982), os arrays corporativos da Hitachi Data Systems e a compra, em 2003, do negócio de discos rígidos da IBM, a empresa que inventou o disco rígido, absorvido e levado adiante.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "O perfil cobre a fundação em 1910, os trilhos de 1924 até as frotas do Reino Unido, a era dos mainframes e o caso IBM, da HDS à Vantara, da HGST à Western Digital, e a virada para os dados da era Lumada.",
    ],
    // Profile: complete copy of profiles/hitachi.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "hitachi",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          "company": "Hitachi",
          "year": 1910,
          "place": "Hitachi, Ibaraki, Japão",
          "founders": [
            "Namihei Odaira"
          ],
          "story": "Namihei Odaira comandava a oficina de reparos elétricos de uma mina de cobre e acreditava que o Japão devia construir as próprias máquinas em vez de importá-las; seu primeiro produto, um motor de indução de cinco cavalos, ainda é o ícone de origem da empresa. Daquele motor cresceu uma das empresas industriais mais abrangentes do planeta: locomotivas e turbinas, mainframes e discos rígidos, arrays de armazenamento e terapia por feixe de prótons, um conglomerado cuja linhagem de armazenamento, em particular, passa direto pelo assunto deste site."
        }
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        {
          "year": 1924,
          "title": "Começam os trilhos",
          "detail": "A Hitachi entrega a primeira grande locomotiva elétrica de corrente contínua construída no Japão, o início de uma linhagem ferroviária que depois contribui com composições do Shinkansen e, a partir de 2015, constrói a frota intercidades britânica no condado de Durham."
        },
        {
          "year": 1974,
          "title": "A era plug-compatible",
          "detail": "Os mainframes da série M da Hitachi enfrentam a IBM de frente como plug-compatibles: a engenharia japonesa igualando a arquitetura de Armonk com melhor relação preço-desempenho, uma das disputas industriais que definiram a época."
        },
        {
          "year": 1982,
          "title": "A armadilha da IBM",
          "detail": "Uma operação do FBI flagra funcionários da Hitachi comprando documentos de projeto da IBM; as confissões de culpa vêm em 1983. O caso é um marco da história da espionagem industrial, e uma medida de quão alto era o que estava em jogo nos mainframes.",
          "sourceNote": "Segundo o extenso registro público da época sobre o caso."
        },
        {
          "year": 1989,
          "title": "Hitachi Data Systems",
          "detail": "Hitachi e EDS adquirem a National Advanced Systems e criam a HDS, o canal pelo qual os mainframes da Hitachi e, de forma decisiva, seus arrays de armazenamento corporativo (depois as linhas USP e VSP) chegam aos data centers do mundo."
        },
        {
          "year": 2003,
          "title": "Comprando os discos da IBM",
          "detail": "A Hitachi adquire o negócio que inventou o disco rígido (cerca de US$ 2 bilhões) e forma a HGST: Deskstar, Travelstar, o Microdrive. Nove anos depois, a HGST é vendida à Western Digital por cerca de US$ 4,8 bilhões, com sua engenharia ainda dentro de boa parte do armazenamento giratório do mundo.",
          "sourceNote": "Valores dos negócios segundo o registro público."
        },
        {
          "year": 2017,
          "title": "A Vantara e a virada",
          "detail": "A HDS vira Hitachi Vantara (armazenamento mais a análise de dados Pentaho); a Lumada (2016) enquadra a estratégia de IoT e dados; a GlobalLogic (cerca de US$ 9,6 bilhões, 2021) e as redes de transmissão de energia da ABB (Hitachi Energy) completam a transformação num gigante de 'social innovation' (inovação social): indústria mais dados."
        }
      ],
      // Products: names as the vendor writes them; descriptions translated.
      products: [
        {
          "name": "Arrays de armazenamento VSP",
          "what": "A linha de armazenamento corporativo (via HDS/Vantara) por muito tempo sinônimo de confiabilidade classe mainframe nas SANs de sistemas abertos."
        },
        {
          "name": "Discos HGST",
          "what": "O capítulo de 2003-2012 que pôs a engenharia da Hitachi dentro dos discos rígidos do mundo, do Deskstar ao Ultrastar."
        },
        {
          "name": "Sistemas ferroviários",
          "what": "Daquela locomotiva de 1924 aos componentes do Shinkansen e à frota Class 800 do Reino Unido: a outra rede que a Hitachi constrói."
        }
      ],
      // Innovations: title and detail translated.
      innovations: [
        {
          "title": "O armazenamento como disciplina corporativa",
          "detail": "Os arrays da Hitachi fizeram do armazenamento com cinco noves uma categoria de produto própria: a cultura de confiabilidade que os administradores de SAN herdaram."
        },
        {
          "title": "O conglomerado que manteve a engenharia",
          "detail": "Enquanto os pares se financeirizaram, a amplitude da Hitachi (de motores a mainframes e à medicina) continuou ancorada na manufatura; a virada para os dados (Lumada, Vantara) também é liderada pela engenharia."
        }
      ],
      // Markets paragraphs.
      markets: [
        "A Hitachi hoje abrange TI (Vantara, GlobalLogic), energia (Hitachi Energy) e mobilidade, uma das maiores empresas do Japão, com sua linhagem de armazenamento ainda montada em racks de data centers corporativos do mundo todo."
      ],
      // Analyst standing statements.
      analyst: [
        "O gigante discreto destas páginas: menos famoso por logotipo do que os pares, mas toque numa SAN, num disco rígido de certa safra ou num trem expresso britânico e há boa chance de a engenharia remontar à oficina de motores de Odaira."
      ],
    },
  },
  // ---- hpe-juniper-aruba: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "hpe-juniper-aruba": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "HPE Networking - HP, 3Com, Aruba, Juniper",
    // Card line (also the meta description) and intro paragraph.
    tagline: "A grande consolidação: da garagem da Addison Avenue à fusão de US$ 14 bilhões com a Juniper.",
    intro: "Quatro histórias de fundação convergiram numa só empresa: a Hewlett-Packard (1939), a 3Com e a comercialização da Ethernet (1979), a Juniper Networks e o silício de roteamento feito sob medida (1996), e a Aruba Networks e a empresa mobile-first (2002). A HP adquiriu a 3Com em 2010 e a Aruba em 2015, dividiu-se em HP Inc e HPE nesse mesmo ano, e concluiu a aquisição da Juniper Networks em 2 de julho de 2025, montando o desafio mais amplo da indústria à Cisco.",
    // Accuracy note, claims kept at the same strength.
    note: "Nem eu nem a Red Education ministramos treinamentos de HPE, Aruba ou Juniper. Esses cursos são oferecidos pela HPE Education Services e por parceiros de educação autorizados pela HPE / Juniper. Esta página é história corporativa: um registro da linhagem dos pioneiros, verificado em fontes primárias.",
    // Profile: complete copy of profiles/hpe-juniper-aruba.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "hpe-juniper-aruba",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          "company": "Hewlett-Packard",
          "year": 1939,
          "place": "Palo Alto, Califórnia",
          "founders": [
            "Bill Hewlett",
            "Dave Packard"
          ],
          "story": "Dois colegas de Stanford começaram numa garagem de um carro só, no número 367 da Addison Avenue, hoje um marco histórico da Califórnia conhecido como o berço do Vale do Silício. O primeiro produto foi o oscilador de áudio HP 200A; um dos primeiros clientes foi o Walt Disney Studios, que usou osciladores HP para testar o som dos cinemas para Fantasia. A ordem do nome, Hewlett-Packard, foi decidida no cara ou coroa."
        },
        {
          "company": "3Com",
          "year": 1979,
          "place": "Santa Clara, Califórnia",
          "founders": [
            "Robert Metcalfe (with co-founders)"
          ],
          "story": "Robert Metcalfe coinventou a Ethernet no Xerox PARC em 1973 e depois fundou a 3Com (Computer Communication Compatibility) para comercializá-la. Os adaptadores da 3Com puseram a rede dentro dos PCs comuns e ajudaram a fazer da Ethernet a LAN padrão do mundo. Metcalfe recebeu o ACM Turing Award em 2022 pela Ethernet."
        },
        {
          "company": "Juniper Networks",
          "year": 1996,
          "place": "Vale do Silício, Califórnia",
          "founders": [
            "Pradeep Sindhu"
          ],
          "story": "Cientista da computação do Xerox PARC, Sindhu fundou a Juniper em fevereiro de 1996 com a convicção de que o roteamento em escala de Internet precisava de silício feito sob medida, e não de CPUs de uso geral. O roteador de núcleo M40, projetado do zero, e o sistema operacional Junos chegaram ao mercado em 1998, cerca de dez vezes mais rápidos que os equipamentos estabelecidos, com os planos de controle e de encaminhamento separados, uma arquitetura que a indústria depois passou a tratar como padrão."
        },
        {
          "company": "Aruba Networks",
          "year": 2002,
          "place": "Sunnyvale, Califórnia",
          "founders": [
            "Keerti Melkote",
            "Pankaj Manglik"
          ],
          "story": "A Aruba foi construída para a empresa mobile-first: o Wi-Fi como camada de acesso principal, e não como pensamento tardio, envolto num controle de acesso baseado em identidade que depois virou o ClearPass. Ela cresceu até se tornar uma das empresas que definiram o wireless corporativo de sua época."
        }
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        {
          "year": 1939,
          "title": "A HP é fundada na garagem da Addison Avenue",
          "detail": "Bill Hewlett e Dave Packard abrem a Hewlett-Packard em Palo Alto; o oscilador de áudio HP 200A é o primeiro produto."
        },
        {
          "year": 1973,
          "title": "A Ethernet é inventada no Xerox PARC",
          "detail": "Robert Metcalfe coinventa a Ethernet, a tecnologia que a 3Com depois levará a todos os escritórios."
        },
        {
          "year": 1979,
          "title": "A 3Com é fundada para comercializar a Ethernet",
          "detail": "A startup de Metcalfe transforma uma tecnologia de laboratório na rede local padrão da era do PC."
        },
        {
          "year": 1997,
          "title": "A 3Com se funde com a U.S. Robotics (cerca de US$ 6,6 bilhões)",
          "detail": "Anunciada em fevereiro de 1997 e concluída em 12 de junho de 1997, a fusão por troca de ações de cerca de US$ 6,6 bilhões com a rainha dos modems U.S. Robotics fez da 3Com uma empresa de redes de US$ 5 bilhões, atrás apenas da Cisco. A USR, fundada em 1976 e batizada em homenagem à fabricante fictícia de robôs das histórias de Isaac Asimov, fabricava os modems Courier e Sportster que carregaram boa parte da Internet discada e acabara de lançar o 56k x2; trouxe junto também a Palm Computing, adquirida em 1995, cujo PalmPilot a 3Com separaria em 2000 antes de sair dos modems analógicos e devolver o nome U.S. Robotics a uma empresa independente.",
          "sourceNote": "3Com 10-K FY1997 (fusão concluída em 12 de junho de 1997, pooling of interests); imprensa da época (US$ 6,6 bilhões, fevereiro de 1997)."
        },
        {
          "year": 1996,
          "title": "A Juniper Networks é fundada",
          "detail": "Pradeep Sindhu abre a Juniper em fevereiro de 1996 para construir roteadores IP sobre silício feito sob medida."
        },
        {
          "year": 1998,
          "title": "A Juniper lança o M40 e o Junos",
          "detail": "O roteador de núcleo projetado do zero chega cerca de 10 vezes mais rápido que os equipamentos estabelecidos, com os planos de controle e de encaminhamento separados."
        },
        {
          "year": 1999,
          "title": "IPO da Juniper",
          "detail": "Em 25 de junho de 1999, a ação salta de US$ 34 para US$ 99 no primeiro dia, um dos IPOs que definiram a época. Em 2000, a Juniper detém cerca de 30% do mercado de roteadores de núcleo de alto desempenho."
        },
        {
          "year": 2002,
          "title": "A Aruba Networks é fundada",
          "detail": "Keerti Melkote e Pankaj Manglik abrem a Aruba em Sunnyvale para a empresa mobile-first."
        },
        {
          "year": 2004,
          "title": "A Juniper adquire a NetScreen (cerca de US$ 4 bilhões)",
          "detail": "Anunciada em 9 de fevereiro de 2004: uma fusão por troca de ações (1,404 ação da Juniper por ação da NetScreen, cerca de US$ 4 bilhões) que leva a Juniper à segurança, a linhagem por trás da linha de firewalls SRX.",
          "sourceNote": "NetScreen SEC Form 425, 9 de fevereiro de 2004; valor calculado pelo fechamento da Juniper a US$ 29,47."
        },
        {
          "year": 2009,
          "title": "A HP anuncia a aquisição da 3Com (US$ 2,7 bilhões)",
          "detail": "Anunciada em 11 de novembro de 2009 e concluída em abril de 2010, trazendo o switching da 3Com (e a H3C, na China) para o negócio de redes da HP.",
          "sourceNote": "Comunicado de imprensa da HP, 11 de novembro de 2009."
        },
        {
          "year": 2015,
          "title": "A HP adquire a Aruba e depois se divide em HP Inc e HPE",
          "detail": "A compra da Aruba é anunciada em 2 de março de 2015 a US$ 24,67 por ação (cerca de US$ 3,0 bilhões em equity, cerca de US$ 2,7 bilhões descontado o caixa) e concluída em 19 de maio. Em 1º de novembro, a HP se separa em HP Inc e Hewlett Packard Enterprise; a Aruba ancora o Intelligent Edge da HPE.",
          "sourceNote": "Aruba SEC 8-K, 2 de março de 2015."
        },
        {
          "year": 2019,
          "title": "A Juniper adquire a Mist Systems",
          "detail": "Concluída em 1º de abril de 2019: Wi-Fi gerenciado em nuvem e guiado por IA, e o assistente virtual de rede Marvis, a tecnologia que reformulou a história corporativa da Juniper.",
          "sourceNote": "Anunciada por US$ 405 milhões; o 10-Q da Juniper registra US$ 359,2 milhões de contraprestação total."
        },
        {
          "year": 2024,
          "title": "A HPE anuncia a aquisição da Juniper (cerca de US$ 14 bilhões)",
          "detail": "9 de janeiro de 2024: um acordo totalmente em dinheiro a US$ 40,00 por ação, cerca de US$ 14 bilhões em equity value."
        },
        {
          "year": 2025,
          "title": "Processo do DOJ, acordo e fechamento",
          "detail": "O DOJ entra com a ação em 30 de janeiro de 2025; um acordo de 28 de junho exige a venda do negócio Instant On da HPE e o licenciamento do código-fonte do Mist AIOps da Juniper; a fusão é concluída em 2 de julho de 2025, por cerca de US$ 13,4 bilhões em dinheiro. A Juniper vira o coração da HPE Networking.",
          "sourceNote": "HPE 10-K FY2025; 8-K da HPE/Juniper, 28 de junho de 2025."
        },
        {
          "year": 2009,
          "personal": true,
          "title": "O meu capítulo: dentro da Juniper",
          "detail": "2009 a 2010: eu trabalho na Juniper Networks no Brasil, representando o portfólio da era MX e SRX, anos que coincidem com o nascimento do Junos Pulse, uma linha que mais tarde voltou a cruzar o meu caminho na distribuição. A página de carreira NetScreen e Juniper conta o capítulo por inteiro."
        }
      ],
      // Products: names as the vendor writes them; descriptions translated.
      products: [
        {
          "name": "Junos OS",
          "what": "Um único sistema operacional para roteamento, switching e segurança da Juniper desde 1998."
        },
        {
          "name": "Roteamento MX / PTX",
          "what": "Roteamento de borda e de núcleo para provedores de serviço: a linhagem da série M que construiu o backbone da Internet moderna."
        },
        {
          "name": "Switching EX / QFX",
          "what": "Switching de campus corporativo e de data center sobre o Junos."
        },
        {
          "name": "Segurança SRX",
          "what": "A linha de firewalls que leva o DNA da NetScreen para a era Junos."
        },
        {
          "name": "Mist AI and Marvis",
          "what": "Operações de rede cabeada e wireless gerenciadas em nuvem e guiadas por IA, com um assistente de rede conversacional."
        },
        {
          "name": "Wi-Fi Aruba, switching CX e ClearPass",
          "what": "Wireless corporativo, switching de campus e controle de acesso à rede baseado em identidade."
        },
        {
          "name": "HPE Aruba Networking Central",
          "what": "O plano de gerenciamento em nuvem do portfólio de borda da HPE."
        }
      ],
      // Innovations: title and detail translated.
      innovations: [
        {
          "title": "Ethernet para todos",
          "detail": "A 3Com transformou a invenção de Metcalfe no PARC em adaptadores de commodity, fazendo da Ethernet a LAN do mundo."
        },
        {
          "title": "Silício de roteamento feito sob medida",
          "detail": "O M40 da Juniper provou que separar os planos de controle e de encaminhamento em ASICs próprios podia superar os projetos de uso geral em uma ordem de grandeza."
        },
        {
          "title": "Controle de acesso baseado em identidade",
          "detail": "O ClearPass da Aruba fez de quem você é, e não da porta em que você se conecta, a base do acesso à rede."
        },
        {
          "title": "Operações de rede nativas em IA",
          "detail": "Os microsserviços em nuvem da Mist e o assistente Marvis levaram o troubleshooting de rede da arqueologia em CLI para operações autônomas."
        }
      ],
      // Markets paragraphs.
      markets: [
        "A empresa combinada abrange campus e filiais corporativos, data center e nuvem, roteamento para provedores de serviço e a nova expansão de data centers de IA. A Aruba cresceu de cerca de US$ 729 milhões em vendas na aquisição para US$ 5,2 bilhões no ano fiscal de 2023 da HPE; a Juniper acrescenta o lado de provedores de serviço e de redes para IA que a HPE nunca teve.",
        "A própria petição do DOJ em 2025 sublinhou o que estava em jogo: argumentava que a HPE-Juniper combinada e a Cisco deteriam juntas mais de 70% do mercado de equipamentos de rede dos Estados Unidos, uma medida de quão concentradas as redes corporativas se tornaram."
      ],
      // Analyst standing statements.
      analyst: [
        "O Gartner nomeou a Juniper Leader no Magic Quadrant 2025 for Enterprise Wired and Wireless LAN Infrastructure.",
        "A Aruba (como HPE) e a Juniper passaram, cada uma, anos como presenças fixas no quadrante de Leaders desse mesmo Magic Quadrant antes que a fusão unisse seus portfólios."
      ],
      // Career cross-link: label translated, href untouched.
      careerLink: {
        "href": "/industry/chapters/netscreen-juniper",
        "label": "Os meus próprios anos de NetScreen e Juniper (página de carreira)"
      },
    },
  },
  // ---- infoblox: pt-BR prose for the record (facts stay in the English record) ----
  "infoblox": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Infoblox - DDI, e por que é um só produto",
    // Card line (also the meta description) and intro paragraph.
    tagline: "DNS, DHCP e gerenciamento de endereços são três protocolos e uma única fonte da verdade.",
    intro: "A Infoblox faz DDI, a contração que a indústria usa para DNS, DHCP e gerenciamento de endereços IP vendidos como um único sistema. A contração existe porque os três não podem, honestamente, ser operados separados: um endereço é alocado pelo DHCP, registrado no gerenciamento de endereços e tornado localizável pelo DNS, e qualquer discordância entre eles produz uma falha que aparece em outro lugar completamente diferente.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A Infoblox foi fundada em Chicago em 1999 por Stuart Bailey, com Michael Ford, Greg Lanier, Tom Kowal e Ivan Pulleyn, e na prática criou o mercado hoje chamado de DDI: DNS, DHCP e gerenciamento de endereços vendidos como um sistema gerenciado único, e não como três conjuntos de arquivos de configuração em máquinas que alguém montou anos antes.",
      "A proposta era confiabilidade antes de ser segurança. O SilverBox, em 2005, foi um dos primeiros appliances ininterruptos para DNS e DHCP, e o argumento era que serviços tão fundamentais não deviam depender de um servidor específico, de um administrador específico ou de um arquivo de texto específico. Quem já rastreou uma queda até um arquivo de zona editado à mão entende o argumento sem precisar de explicação.",
      "O histórico societário segue o caminho padrão: capital aberto na Bolsa de Nova York a partir de 2012, fechamento de capital pela Vista Equity Partners em 2016, depois com a Warburg Pincus ao lado. A empresa que transformou os serviços centrais de rede em produto é hoje, ela própria, um ativo de private equity, que é o que acontece com um negócio de receita previsível numa categoria madura.",
      "O enquadramento de segurança veio depois, e seguiu os dados, não o marketing. Um sistema que responde a toda consulta de nome numa organização guarda o registro mais completo do que as máquinas dessa organização estão tentando alcançar, o que faz dele uma superfície de detecção tanto quanto uma superfície operacional, e é o motivo pelo qual os fabricantes de DDI e os de resolvers acabaram no mesmo mercado vindo de direções opostas.",
    ],
  },
  // ---- kryterion: pt-BR prose for the record (facts stay in the English record) ----
  "kryterion": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Kryterion",
    // Card line (also the meta description) and intro paragraph.
    tagline: "A mesma controladora que fundou a Prometric, fazendo tudo uma segunda vez, e aplicando provas online com supervisão catorze anos antes de todo mundo ser obrigado a isso.",
    intro: "A Kryterion começou como uma divisão da Drake International por volta de 2000 ou 2001, conforme a fonte. A Drake tinha fundado a Drake Prometric em 1990 e a vendido à Sylvan Learning em 1995. Ou seja, a empresa que criou uma das duas redes dominantes de aplicação de provas a vendeu e depois construiu outra. A Kryterion opera a partir de Phoenix, no Arizona, com escritórios no Reino Unido, na África do Sul e na Ásia.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "Sua primeira reivindicação genuína de pioneirismo merece ser confrontada com o resto deste grupo. A Kryterion diz ter introduzido a supervisão online de provas em 2005, catorze anos antes de a Pearson VUE lançar o OnVUE e quinze antes de a pandemia tornar a aplicação remota a única opção. A afirmação vem da página de história da própria empresa e deve ser lida como tal, mas a direção é clara o bastante: a capacidade existia, estava disponível comercialmente e não foi amplamente adotada até que as circunstâncias eliminassem a alternativa. É o padrão comum da infraestrutura, e vale lembrar dele na próxima vez que algo for descrito como inédito.",
      "O modelo de negócio é a diferença real em relação às duas redes maiores, e é uma escolha arquitetural genuína, não uma distinção de marketing. Pearson VUE e Prometric são full-service: o cliente entrega uma prova e a rede a aplica. A Kryterion vende o Webassessor, uma plataforma na qual os clientes constroem, modificam e publicam as próprias provas, com o argumento de venda explícito de que alterar um item não gera taxa de publicação. Um modelo trata a prova como algo que se terceiriza; o outro, como algo que se opera. Qual serve a uma organização depende inteiramente de suas provas mudarem com frequência, e as organizações sistematicamente subestimam com que frequência as delas vão mudar.",
      "A rede de centros tem cerca de mil locais, contra vários milhares das redes maiores, uma limitação real e honesta. Uma rede menor é um alcance menor, e a resposta a isso é a aplicação online e baseada em eventos em que a empresa se apoiou cedo.",
      "E há a diferença estratégica que faz este verbete valer a leitura ao lado do da Credly. A Kryterion monta sua pilha por parcerias: CloudShare para ambientes de laboratório virtual, TrueAbility para avaliação baseada em desempenho e Credly para credenciais digitais, a mesma Credly que a Pearson comprou integralmente em 2022. A pilha funcional idêntica, montada por aquisição de um lado e por parceria do outro.",
      "Nenhuma das duas é obviamente a certa. A aquisição garante que a capacidade está lá e pode ser integrada a fundo; também concentra a cadeia de confiança num único dono, que é a observação que este site fez sobre a Pearson e repetiu sobre a ETS ser dona da Prometric. A parceria mantém as peças independentes, de modo que o provedor de credenciais de um cliente não é subsidiária do seu provedor de provas; mas também significa que as peças podem mudar de mãos, ser descontinuadas ou começar a concorrer com você. A pergunta não é qual estrutura é melhor, mas qual falha você prefere ter, e é uma pergunta que a maioria dos compradores nunca percebe que está respondendo.",
      "A Kryterion também suporta provas baseadas em desempenho de terceiros dentro de um navegador supervisionado, que é o híbrido para o qual o grupo inteiro vem convergindo: o realismo de uma avaliação prática com a verificação de identidade de uma avaliação supervisionada. Se essa combinação herda as forças dos dois modelos ou as fraquezas ainda não dá para responder com o registro público: a abordagem é nova demais, e os modos de falha de uma avaliação levam anos para aparecer.",
    ],
  },
  // ---- lanpro: pt-BR prose for the record (facts stay in the English record) ----
  "lanpro": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "LAN Professional - o canal da Cabletron no Brasil",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Distribuidora paulistana e centro de treinamento autorizado de Cabletron, Enterasys, F5 Networks e IronPort.",
    intro: "LAN Professional era o nome fantasia da LWS Comercio e Servicos em Informatica, na Rua Bacaetava, 35, no Brooklin, em São Paulo. Distribuiu Cabletron Systems e depois Enterasys Networks no Brasil e no Mercosul e, a partir de 2005, foi o centro de treinamento autorizado de F5 Networks e IronPort para o Brasil e o Mercosul.",
    // Body: 7 paragraph(s), same order as the English.
    body: [
      "Duas empresas foram registradas em 2000, a LWS Comercio e Servicos em Informatica em maio e a ABPR Participacoes em agosto, e operavam sob um terceiro nome que nenhuma das duas trazia no papel. Juntas eram o Grupo LWS; para o mercado eram a LAN Professional, e o slogan era sempre ao seu lado.",
      "Começaram como distribuidora da Cabletron Systems no Brasil, e o timing foi acidental, mas decisivo: em poucos meses, a Cabletron se reorganizou em quatro empresas, e o problema da LAN Professional passou a ser manter a relação de pé com um fabricante que já não existia com aquele nome. Deu certo. Sob a Enterasys, chegaram a responder por cerca de noventa por cento da distribuição desse fabricante no país, e o pedido de recuperação é franco sobre o motivo: a Enterasys tinha estado distante de seu canal brasileiro, e a solução foi alguém atender o telefone. Onde os concorrentes ofereciam e-mail e chat, esta oferecia uma pessoa.",
      "Em seis meses de operação, passou de dez milhões de reais. A receita cresceu 269 por cento entre 2000 e 2001, num ano de atentados de 11 de setembro, crise argentina e racionamento de energia no Brasil, que segurou o crescimento nacional em 1,31 por cento. A lista de clientes parece um mapa da época: Volkswagen e Chevrolet, Unicamp e Mackenzie, Banco do Brasil, Anatel e Infraero, TAM e Embraer, Albert Einstein e Samaritano.",
      "A partir de 2003, manteve seu próprio centro de treinamento e, em 2005, tornou-se o centro de treinamento autorizado de F5 Networks e IronPort para o Brasil e o Mercosul, ensinando switching, roteamento, wireless, defesa contra intrusão, firewall de aplicação, armazenamento e SSL VPN para o mesmo canal que abastecia.",
      "O CONTRATO QUE DECIDIU TUDO. Em 2004, ganharam a Cobra Tecnologia, um contrato de 43,4 milhões de reais. Foi entregue por inteiro e no prazo, a receita dobrou, e foi o maior ano da história da empresa. Então o pagamento atrasou. O plano dá ao mecanismo um nome preciso, um reverse overtrading, e essa é a história inteira: uma distribuidora de margens apertadas tinha financiado um contrato maior que seu capital de giro, executado tudo perfeitamente, e não podia esperar. A partir de 2005, a empresa se financiou com dinheiro emprestado, e os encargos financeiros consumiram 13,2 milhões de reais em quatro anos, uma média de cinco por cento ao mês de toda a receita obtida.",
      "Tudo o que veio depois é consequência. As licitações públicas a partir de 2007 levantaram a receita de novo, enquanto os juros comiam a margem. Um sistema de armazenamento de 3,65 milhões de reais foi destruído em trânsito em novembro de 2008, e a transportadora não pagou. O mercado de crédito fechou. Em 20 de fevereiro de 2009, a empresa pediu recuperação judicial, com dívidas de 49,5 milhões de reais e trinta pessoas ainda empregadas.",
      "A lição não é que tenham administrado mal. Executaram corretamente o maior contrato da vida deles. Para um negócio de margem apertada e capital emprestado, um único cliente grande o bastante para dobrar o ano é um risco existencial mesmo quando tudo dá certo, e o risco não cai na entrega, mas na data em que o dinheiro chega.",
    ],
  },
  // ---- microcamp: pt-BR prose for the record (facts stay in the English record) ----
  "microcamp": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Microcamp",
    // Card line (also the meta description) and intro paragraph.
    tagline: "O pioneirismo foi o público, não a tecnologia, e ela ensinou nas máquinas que a reserva de mercado construiu.",
    intro: "Eloy Tuffi abriu a Flama Microinformática na Vila Mariana, em São Paulo, em 1977, e ela virou Microcamp depois que ele se mudou para Campinas em 1981. É descrita em geral como a primeira escola de informática do Brasil. Ao longo de quatro décadas, declara ter ensinado mais de dois milhões de alunos no Brasil, em Portugal, na Espanha e na Argentina.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "O fundador não era tecnólogo. Ele já era dono de quatro escolas de inglês, depois de começar vendendo livros e cursos de inglês aos dezoito anos, e chegou à informática como alguém que sabia vender instrução para gente comum. Isso importa mais do que parece, e explica a forma de tudo o que veio depois.",
      "Porque o pioneirismo foi o público, não a tecnologia. Cursos de informática já existiam no Brasil em 1977. Eram para programadores, ligados aos mainframes que eram os únicos computadores da maioria das organizações, e eram caros e restritos. A proposta de Tuffi era que pessoas comuns (não futuros programadores, só pessoas) pagariam por instrução em informática se ela fosse acessível. É a intuição fundadora de praticamente todo negócio de treinamento técnico desde então, e não era óbvia na época.",
      "A pedagogia veio do ensino de idiomas, e se encaixa melhor do que qualquer um esperava. Uma escola de idiomas funciona com mensalidades, níveis graduados, turmas pequenas e a premissa de que a competência se constrói com prática repetida ao longo de meses, e não se transfere numa semana. Aplique essa estrutura à informática e ela funciona, exatamente pelo mesmo motivo: as duas são habilidades, não corpos de conhecimento, e uma habilidade adquirida num intensivo de cinco dias se deteriora num ritmo que surpreende quem pagou por ela. O grupo depois manteve escolas que combinavam inglês e informática, que é o mesmo reconhecimento vindo pelo outro lado.",
      "E aqui as duas metades da história da reserva de mercado nesta linha do tempo se encontram num detalhe. Tuffi equipou sua primeira escola com doze microcomputadores: máquinas CP 500 e TK 85, fabricadas no país, produtos justamente da indústria protegida descrita em outro ponto deste site. A reserva fabricou o hardware; escolas como esta fabricaram os usuários. Nenhuma das metades funciona sem a outra, e os documentos de política da época discutem a primeira longamente e a segunda quase nada.",
      "A história comercial é uma história de franquias: primeira filial em Ribeirão Preto em 1986, Portugal em 1989, um sistema de franquias lançado em 1994 e levado ao exterior no ano seguinte, um instituto de formação para a própria equipe e os franqueados em 1995. A franquia é o que permitiu a um método de ensino crescer além do alcance de quem o inventou, e o instituto existe porque uma escola franqueada é tão boa quanto seu pior instrutor, que é o mesmo problema que os verbetes de treinamento autorizado deste site descrevem do lado do fabricante.",
      "O número que vale levar daqui é o denominador. O verbete da reserva de mercado registra o emprego em informática e automação subindo de cerca de 42.000 para cerca de 74.000 pessoas ao longo dos anos 1980: essa é a indústria. Dois milhões de pessoas passaram por estas salas de aula. A maioria não virou engenheiro, e é esse o ponto: um país não fica capaz de usar computadores formando sua indústria de computadores, e sim formando todos os outros. A reserva fica com as histórias da política; esta ficou com os alunos.",
    ],
  },
  // ---- nantucket: pt-BR prose for the record (facts stay in the English record) ----
  "nantucket": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Nantucket - Clipper",
    // Card line (also the meta description) and intro paragraph.
    tagline: "O compilador que transformava programas dBASE III em aplicações DOS independentes; milhões foram construídas entre 1985 e 1992, e depois o dono perdeu o bonde do Windows.",
    intro: "A Nantucket Corporation foi criada em 1984 por Barry ReBell, no lado da gestão, e Brian Russell, no lado técnico, com Larry Heimendinger como presidente, para vender o Clipper: um compilador de código nativo para bancos de dados e programas dBASE III, lançado pela primeira vez em 1985 como Nantucket Clipper Winter '84, com data de 25 de maio de 1985. A vantagem do Clipper sobre o dBASE era que um programa podia ser compilado e executado no DOS como aplicação independente, sem o interpretador do dBASE e sem seu prompt interativo de ponto.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "Entre 1985 e 1992, milhões de aplicações Clipper foram construídas, em geral para pequenas empresas que gerenciavam clientes e estoque; para muitas delas, uma aplicação Clipper feita sob medida foi a primeira experiência com desenvolvimento de software, e bancos e seguradoras a usavam nos sistemas pequenos demais para o mainframe e como front-end dos sistemas de mainframe que já tinham. As versões levavam nomes de estações (Summer '85, Winter '85, Autumn '86, Summer '87, em 21 de dezembro de 1987) até o Clipper 5.0, em 1990, e o 5.01, em abril de 1991, quando a linguagem já tinha absorvido elementos de C e Pascal, programação orientada a objetos e o code block, um híbrido de macros do dBASE com ponteiros de função que a tornou muito mais poderosa que a original.",
      "Em 1992, a empresa foi vendida à Computer Associates por 190 milhões de dólares, e o produto virou CA-Clipper: 5.20 em fevereiro de 1993, 5.30 em junho de 1995, 5.3b em 20 de maio de 1997, a última versão. Sob o novo dono, o Clipper não conseguiu fazer a transição do DOS para o Windows, e quase nenhuma aplicação comercial nova foi escrita nele depois de 1995; o projeto Aspen da Nantucket amadureceu como CA-Visual Objects para Windows, e os desenvolvedores migraram para Visual Basic, Microsoft Access, Delphi e PowerBuilder, todos fortemente tipados, ao contrário da tradição dBASE. Em novembro de 1991, o New York Times tinha noticiado o sucesso da Nantucket em convencer desenvolvedores soviéticos de que comprar era melhor que piratear: 2.000 cópias vendidas lá, contra 250.000 no mundo.",
      "A linguagem sobreviveu à empresa duas vezes. O Xbase++ da Alaska Software e o FlagShip a implementam comercialmente, e o Harbour e o xHarbour sob a GPL, portáveis para Windows, Linux, Unix e macOS. A Nantucket, com a Ashton-Tate e a Fox Software, foi uma das três empresas xBase compradas no intervalo de um ano, quando a categoria chegou ao auge; os verbetes de glossário de dBASE e Clipper cuidam da linguagem, e os registros da Borland e da Ashton-Tate, do resto da família.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "Vendida à Computer Associates em 1992 por 190 milhões de dólares; o produto foi rebatizado de CA-Clipper, e sua última versão, a 5.3b, saiu em 20 de maio de 1997.",
  },
  // ---- nbs-nist: pt-BR prose for the record (facts stay in the English record) ----
  "nbs-nist": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "NBS / NIST - o laboratório de medição que testou os padrões",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Alguém precisa decidir se duas implementações de uma especificação de fato interoperam, e quase nunca são as pessoas que a escreveram.",
    intro: "O National Bureau of Standards, rebatizado de National Institute of Standards and Technology em 1988, é um laboratório de medição, e não uma empresa de redes, e aparece nesta história porque o período OSI fez dos testes uma questão central. Conformidade com um documento e interoperação com o produto de outro fabricante são propriedades diferentes, e a distância entre elas precisava de um árbitro sem interesse comercial no resultado.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "O National Bureau of Standards foi criado pelo Organic Act de 3 de março de 1901, com uma equipe de doze pessoas, como o primeiro laboratório de ciências físicas do governo federal. Foi rebatizado de National Institute of Standards and Technology em 1988, e vale ter o nome anterior em mente ao ler qualquer coisa de antes disso.",
      "Seu trabalho em segurança de computadores começou antes do que a maioria imagina, e num lugar sem glamour: as senhas. Publicou orientações sobre o uso de senhas para controlar o acesso a recursos computacionais em 1977 e o primeiro Password Usage Standard em 1985, tratando de composição e tempo de vida, conceitos ainda em discussão quatro décadas depois. Em 1979, publicou uma das primeiras metodologias formais de análise de risco para sistemas de processamento de dados, que levou a área de uma lista de controles para a precificação da exposição, e em 1981, um guia de planejamento de contingência.",
      "O Computer Security Act de 1987 então tornou o arranjo lei: os padrões para sistemas computacionais federais não classificados seriam desenvolvidos por um órgão civil de padronização, e não pela comunidade de inteligência, junto com treinamento obrigatório em segurança para quem opera esses sistemas. Essa divisão de responsabilidades é o motivo pelo qual as orientações de segurança americanas são publicadas abertamente e podem ser lidas, citadas e adotadas por qualquer um, inclusive por organizações de outros países sem nenhuma obrigação de segui-las.",
      "É a instituição menos visível deste catálogo e uma das mais usadas. Boa parte do que uma equipe de segurança faz todos os dias remonta a um documento de uma agência fundada para padronizar pesos e medidas, e o padrão vale em geral: as organizações que moldam a prática de forma mais duradoura costumam ser as que publicam especificações, e não as que vendem produtos.",
    ],
  },
  // ---- netscape: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "netscape": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Netscape - a empresa que abriu a web",
    // Card line (also the meta description) and intro paragraph.
    tagline: "O Navigator de Clark e Andreessen levou a internet ao grande público; SSL, JavaScript e o cookie foram inventados aqui. O navegador perdeu a guerra, as invenções ganharam tudo.",
    intro: "Nenhuma empresa desta página importa mais para o assunto diário deste site: o SSL, ancestral de toda sessão TLS que as ferramentas daqui decodificam, foi projetado na Netscape, assim como o JavaScript e o cookie HTTP. O navegador Navigator levou a web da academia para todo mundo, deflagrou a guerra dos navegadores e deixou de herança a Mozilla e a própria web aberta.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "Do segundo ato de Jim Clark depois da SGI e do IPO de 1995 que deu início à era pontocom até a aquisição pela AOL e a sobrevida no Firefox: o perfil acompanha os cinquenta e um meses que religaram o mundo.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "A America Online concluiu a aquisição em 17 de março de 1999; a Netscape sobreviveu à fusão como subsidiária integral da AOL, com cada ação convertida em 0,9 ação da AOL.",
    // Successor link label (the URL stays in the English record).
    successorLabel: "o projeto Mozilla, que nasceu da abertura do código-fonte da Netscape",
    // Profile: complete copy of profiles/netscape.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "netscape",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          "company": "Netscape (founded as Mosaic Communications)",
          "year": 1994,
          "place": "Mountain View, Califórnia",
          "founders": [
            "Jim Clark",
            "Marc Andreessen"
          ],
          "story": "Jim Clark, recém-saído da Silicon Graphics, procurou o rapaz de 22 anos que tinha construído o NCSA Mosaic e perguntou o que ele queria fazer em seguida. A Mosaic Communications, logo rebatizada de Netscape, lançou o Navigator no fim de 1994, e a web deixou de pertencer às universidades. Nenhuma empresa desta seção importa mais para o trabalho diário deste site: o SSL, ancestral de todo handshake TLS que as ferramentas daqui decodificam, foi projetado na Netscape; o JavaScript e o cookie HTTP também. Cinquenta e um meses da fundação à aquisição, e o mundo do outro lado já não era o mesmo."
        }
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        {
          "year": 1994,
          "title": "O Navigator, e o cookie",
          "detail": "O navegador chega ao mercado e domina de imediato a web nascente; no mesmo ano, Lou Montulli inventa o cookie HTTP para que um carrinho de compras consiga se lembrar de si mesmo: estado para um protocolo sem estado, e um debate sobre privacidade que nunca terminou."
        },
        {
          "year": 1995,
          "title": "O IPO que deu início a uma era",
          "detail": "9 de agosto de 1995: precificada a US$ 28, a ação chega a cerca de US$ 75 no primeiro dia, o momento em que Wall Street descobriu a internet. No mesmo ano saem o SSLv2 (projeto de Kipp Hickman) e a linguagem que Brendan Eich fez em dez dias, o JavaScript."
        },
        {
          "year": 1996,
          "title": "SSLv3: o ancestral do TLS",
          "detail": "Paul Kocher e os engenheiros da Netscape refazem o SSL do jeito certo; o SSLv3 vira a base direta do TLS 1.0 da IETF (1999), a família de protocolos que toda ferramenta de certificados, cifras e handshake deste site existe para explicar."
        },
        {
          "year": 1997,
          "title": "A guerra dos navegadores vira",
          "detail": "O Internet Explorer, embutido de graça no Windows, corrói a participação do Navigator versão após versão: a briga que vira o centro do processo United States v. Microsoft."
        },
        {
          "year": 1998,
          "title": "Mozilla: abrindo o código",
          "detail": "31 de março de 1998: a Netscape libera o código-fonte do navegador, o ato que consagra 'open source' como o nome de um movimento e, por meio da Mozilla Foundation (2003), acaba gerando o Firefox."
        },
        {
          "year": 1999,
          "title": "A AOL fecha o negócio",
          "detail": "17 de março de 1999: a AOL conclui a aquisição totalmente em ações (anunciada em cerca de US$ 4,2 bilhões e valendo aproximadamente US$ 10 bilhões no fechamento, com a alta da ação da AOL); a marca Netscape se apaga, e as invenções (TLS, JavaScript, o cookie) comandam tudo.",
          "sourceNote": "Anunciada em 24 de novembro de 1998; valores segundo o registro do negócio."
        }
      ],
      // Products: names as the vendor writes them; descriptions translated.
      products: [
        {
          "name": "Navigator",
          "what": "O navegador que levou a web ao grande público: no auge, em 1996, o jeito como a maior parte do mundo via a internet."
        },
        {
          "name": "SSL",
          "what": "Secure Sockets Layer, projetado internamente: o ancestral do TLS e de todo ícone de cadeado desde então."
        },
        {
          "name": "JavaScript",
          "what": "A linguagem de script que Eich fez em dez dias, hoje a linguagem de programação mais implantada do planeta."
        }
      ],
      // Innovations: title and detail translated.
      innovations: [
        {
          "title": "Segurança de transporte para todos",
          "detail": "O SSL fez da criptografia uma expectativa padrão da web, e não um acessório de especialista: a decisão de segurança de maiores consequências da época, e o arroz com feijão deste site."
        },
        {
          "title": "A página programável",
          "detail": "O JavaScript e o cookie transformaram documentos em aplicações: todo o mundo dos web apps, incluindo este PWA, descende dessas duas invenções de 1994-95."
        }
      ],
      // Markets paragraphs.
      markets: [
        "O mercado da Netscape foi tomado; suas tecnologias venceram por completo: o TLS protege a internet, o JavaScript a faz funcionar, o cookie a rastreia e o Firefox leva adiante a linhagem do código-fonte."
      ],
      // Analyst standing statements.
      analyst: [
        "O fabricante que definiu as primeiras avaliações de navegadores e o caso canônico, citado no próprio processo antitruste, de empacotamento de plataforma decidindo uma guerra de produtos."
      ],
    },
  },
  // ---- network-secure: pt-BR prose for the record (facts stay in the English record) ----
  "network-secure": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Network Secure",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Parceira Fortinet de nível Expert no Brasil.",
    intro: "Tem DOIS registros separados de nível Expert no diretório brasileiro de parceiros da Fortinet, um em Fortaleza e outro em Cuiabá, que é a cara de uma parceira que construiu uma segunda operação regional, e não um segundo escritório.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "Os dois registros não são um artefato contábil. A entidade de Fortaleza está listada como integradora e provedora de segurança gerenciada, com SD-WAN como especialização; a de Cuiabá está listada apenas como integradora, sem especialização. É uma parceira do Nordeste que se estendeu ao Centro-Oeste e ainda está construindo o lado gerenciado de lá, e o diretório registra a diferença em vez de diluí-la numa média.",
      "É também a ilustração mais clara de por que vale a pena citar o diretório da Fortinet. A maioria dos fabricantes publica um localizador de parceiros que responde onde comprar e nada mais. Este publica nível, cidade, modelo de negócio e especializações nomeadas, o que significa que uma afirmação sobre a posição de uma parceira pode ser conferida pelo leitor, em vez de aceita na confiança. Todo verbete de nível Expert deste catálogo se apoia nisso, e os fabricantes cujos diretórios não podem ser enumerados são justamente aqueles cujas afirmações sobre parceiros continuam ralas aqui.",
    ],
  },
  // ---- network1: pt-BR prose for the record (facts stay in the English record) ----
  "network1": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Network1",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Comprada pela empresa que o próprio comprador tinha comprado quatro anos antes.",
    intro: "A Network1, razão social Intersmart Comércio Importação Exportação de Equipamentos Eletrônicos, foi fundada em 2004, com sede em São Paulo. Em 2014, era uma das principais distribuidoras de valor agregado de equipamentos de comunicação do Brasil, com operações no Brasil, no México, na Colômbia, no Chile e no Peru, mais de 60 fabricantes, 8.000 clientes e perto de 400 funcionários.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "Vale ler a linha de produtos como um documento em si, porque ela é um retrato do que um comprador corporativo latino-americano de fato conseguia comprar em meados dos anos 2010: Avaya, Axis, Check Point, Dell, Extreme, F5, HP, Juniper, Polycom, Microsoft, Riverbed, Schneider Electric. Várias delas têm verbete próprio nesta linha do tempo, e várias já não operam com esses nomes, que é a cara do catálogo de qualquer distribuidora uma década depois.",
      "Ela também mantinha um centro de treinamento autorizado, a parte da distribuição de valor agregado que a maioria das explicações pula. Uma distribuidora com sessenta fabricantes tem revendas que precisam se certificar em produtos que começaram a vender no trimestre anterior, e os cursos dos próprios fabricantes não são nem frequentes nem locais o bastante para dar conta.",
      "A aquisição tem um detalhe que vale o verbete inteiro. A ScanSource anunciou a compra em 15 de agosto de 2014 e a concluiu em janeiro de 2015, por R$ 156.928.000 mais pagamentos atrelados ao EBITDA dos quatro anos seguintes, e comprou a Network1 por meio da CDC Brasil, a distribuidora brasileira que a própria ScanSource tinha adquirido em 2011. Uma aquisição foi o veículo da seguinte. O negócio latino-americano da empresa americana não foi construído; foi comprado duas vezes, e a segunda compra foi feita pela primeira.",
      "Foi a maior aquisição que a ScanSource tinha feito até então. As vendas líquidas de 2014 divulgadas variam conforme a base: cerca de R$ 720 milhões (US$ 306 milhões) em base ajustada ao US-GAAP, no documento da própria ScanSource, e cerca de R$ 850 milhões (US$ 374 milhões) no comunicado em português. Os dois números ficam registrados aqui; a diferença é o ajuste, não uma divergência sobre o negócio.",
      "A geografia é a parte prática. O negócio acrescentou unidades em Goiás, Pernambuco e Espírito Santo à presença brasileira que a ScanSource já tinha em São Paulo e no Paraná, que é como uma distribuidora cresce de verdade, já que atender uma revenda no Recife a partir de São Paulo é uma proposta diferente de atender uma ali na esquina. Rafael Paloni, CEO da Network1, passou a comandar o negócio de comunicações da ScanSource na América Latina.",
      "E assim o ciclo se fecha. A ScanSource aparece nesta linha do tempo como uma distribuidora especializada de Greenville, na Carolina do Sul, cuja tese fundadora era pegar os produtos no caminho para virarem commodities. Quem trabalhou para a ScanSource no Brasil depois de 2015 trabalhou dentro do que tinha sido a Network1, sob uma marca que se apresentou como Network1-ScanSource durante anos.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "Adquirida pela ScanSource, com anúncio em 15 de agosto de 2014 e conclusão em janeiro de 2015. Operou como Network1-ScanSource durante anos depois disso e virou o negócio de comunicações da ScanSource na América Latina.",
  },
  // ---- nvidia: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "nvidia": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Nvidia - a empresa de GPUs que comanda o fabric",
    // Card line (also the meta description) and intro paragraph.
    tagline: "A aposta do CUDA uma década adiantada, a faísca do AlexNet, a Mellanox: o maior cliente da rede virou um de seus fabricantes.",
    intro: "A Nvidia deu nome à GPU, tornou-a programável uma década antes de o mundo precisar disso e virou a plataforma da era da IA. Para os leitores deste site, a aquisição da Mellanox em 2020 é a dobradiça: InfiniBand, Ethernet Spectrum-X e DPUs BlueField fazem da Nvidia, ao mesmo tempo, a carga mais exigente que as redes transportam e um fabricante de redes de primeira linha, os dois lados da discussão sobre o fabric de IA.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "O perfil cobre a fundação em 1993, a sobrevivência do RIVA ao GeForce e a criação do nome, o CUDA, o AlexNet, a virada para as redes com a Mellanox, a escalada ao trilhão de dólares e a guerra dos fabrics NVLink/InfiniBand/Spectrum-X.",
    ],
    // Profile: complete copy of profiles/nvidia.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "nvidia",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          "company": "Nvidia",
          "year": 1993,
          "place": "Sunnyvale, Califórnia (fundada numa mesa de um Denny's, segundo o folclore da empresa)",
          "founders": [
            "Jensen Huang",
            "Chris Malachowsky",
            "Curtis Priem"
          ],
          "story": "Três engenheiros apostaram em 1993 que os gráficos se tornariam o problema mais difícil e mais valioso da computação. O primeiro chip quase matou a empresa; o RIVA 128 a salvou; o GeForce 256 deu nome à categoria de produto: GPU. O lance decisivo veio em 2006: o CUDA tornou o chip gráfico programável para qualquer coisa, uma década antes de o mundo precisar exatamente disso. Quando o deep learning chegou (AlexNet, 2012, treinado em placas de games), a Nvidia era dona do substrato, e a aquisição da Mellanox em 2020 a fez, discretamente, uma das empresas de REDES mais importantes do planeta."
        }
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        {
          "year": 1997,
          "title": "RIVA 128",
          "detail": "Depois do tropeço quase fatal do NV1, o RIVA 128 conquista o mercado de aceleradores 3D pelo desempenho por dólar: o capítulo da sobrevivência com que toda história da Nvidia começa."
        },
        {
          "year": 1999,
          "title": "GeForce 256",
          "detail": "Outubro de 1999: transform-and-lighting em hardware, vendido como a primeira GPU do mundo; a sigla pega, a categoria ganha nome, e o IPO do mesmo ano financia a corrida."
        },
        {
          "year": 2006,
          "title": "CUDA",
          "detail": "A aposta que define a empresa: programabilidade de uso geral em toda GeForce vendida, mais uma década de construção de ecossistema sem lucro, de modo que, quando os pesquisadores precisaram de matemática paralela em massa, a ferramenta já estava na mesa deles."
        },
        {
          "year": 2012,
          "title": "AlexNet",
          "detail": "Uma rede neural treinada em duas GPUs de consumo esmaga o benchmark ImageNet: a faísca do deep learning. O negócio de data center que vem em seguida transforma a Nvidia de fabricante de componentes na plataforma da era da IA."
        },
        {
          "year": 2020,
          "title": "Mellanox: a Nvidia vira fabricante de redes",
          "detail": "Fecha a aquisição de cerca de US$ 7 bilhões: InfiniBand, switching Ethernet Spectrum, NICs ConnectX, DPUs BlueField. A sacada (o data center é o computador, então a REDE é o backplane) faz do desempenho do fabric um problema de produto da própria Nvidia.",
          "sourceNote": "Valor do negócio segundo o registro público no fechamento, abril de 2020."
        },
        {
          "year": 2023,
          "title": "A escalada ao trilhão",
          "detail": "Maio de 2023: a primeira fabricante de chips a chegar a US$ 1 trilhão em valor de mercado; US$ 2 trilhões vêm em fevereiro de 2024 e US$ 3 trilhões em junho, com períodos como a empresa mais valiosa do mundo: o mercado precificando a computação, e os fabrics que a alimentam, como o recurso mais escasso da época.",
          "sourceNote": "Datas dos marcos segundo o registro público."
        },
        {
          "year": 2024,
          "title": "Blackwell e a guerra dos fabrics",
          "detail": "Domínios de scale-up NVLink, scale-out InfiniBand e Ethernet Spectrum-X oferecida contra o mundo do merchant silicon: a rede do cluster de IA vira a discussão central de arquitetura da indústria, com a Nvidia dos dois lados da mesa do comprador."
        }
      ],
      // Products: names as the vendor writes them; descriptions translated.
      products: [
        {
          "name": "GeForce / RTX",
          "what": "A linha de gráficos de consumo que financiou tudo, e deu nome à categoria GPU."
        },
        {
          "name": "CUDA",
          "what": "A plataforma de programação que é o verdadeiro fosso: a camada de software contra a qual uma geração de IA é escrita."
        },
        {
          "name": "InfiniBand, Spectrum-X, BlueField",
          "what": "O portfólio de redes herdado da Mellanox: os fabrics e DPUs do data center de IA."
        }
      ],
      // Innovations: title and detail translated.
      innovations: [
        {
          "title": "A GPU como computação de uso geral",
          "detail": "O CUDA converteu um componente gráfico no processador que define a época: a aposta de plataforma que deu retorno uma década depois, em escala civilizacional."
        },
        {
          "title": "A rede como backplane",
          "detail": "A tese de fabric da Nvidia (NVLink para cima, InfiniBand ou Spectrum-X para fora) fez da topologia de rede um parâmetro de primeira ordem no projeto de computação; todo diagrama de cluster de IA destas páginas reflete isso."
        }
      ],
      // Markets paragraphs.
      markets: [
        "A Nvidia domina a computação para IA e é um fabricante de redes de primeira linha em receita por meio da linhagem Mellanox: ao mesmo tempo o maior cliente da indústria de redes, sua carga mais exigente e um de seus fabricantes."
      ],
      // Analyst standing statements.
      analyst: [
        "A primeira entre as contemporâneas por desenho: nenhuma empresa define mais diretamente o que as redes de hoje precisam transportar, e sua posição InfiniBand versus Ethernet é a discussão viva que todo projeto de fabric de IA com que os leitores deste site lidam precisa responder."
      ],
    },
  },
  // ---- oscium: pt-BR prose for the record (facts stay in the English record) ----
  "oscium": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Oscium",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Instrumentos de Oklahoma City para o tablet do técnico de campo e, desde 2024, a casa do Wi-Spy, do inSSIDer e do Chanalyzer.",
    intro: "A Oscium é uma empresa de hardware de Oklahoma City fundada em 2010 por dois irmãos, Matt Lee e Bryan Lee, que fabrica ferramentas de teste portáteis para técnicos de campo. Em 2023, lançou o Nomad, que descreve como um analisador de redes Wi-Fi 7 ultraportátil com quatro rádios simultâneos e, em 2024, nas palavras dela, sua missão deu o maior passo: adquiriu a MetaGeek, a equipe por trás do inSSIDer, do Chanalyzer e do Wi-Spy.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "A compra da MetaGeek foi anunciada de Oklahoma City em 7 de outubro de 2024, com Bryan Lee, presidente da Oscium, à frente da empresa combinada, e Brian Tuttle, cofundador da MetaGeek, voltando para comandar o lado de software; os detalhes financeiros não foram divulgados. A Oscium disse na época que tinha passado mais de dezesseis anos transformando tecnologia complexa em ferramentas que funcionam melhor para todos, e as páginas da MetaGeek agora ficam no site dela.",
      "O motivo pelo qual uma fabricante de instrumentos wireless pertence a um registro de redes é o mesmo da MetaGeek: o analisador de espectro e o scanner de Wi-Fi deixaram de ser equipamento de bancada e viraram algo que um engenheiro leva para um site survey. O Nomad da Oscium e as ferramentas da MetaGeek são a forma atual dessa ideia.",
    ],
    // Acquisitions: 1 entries index-aligned with the English; year, name, price and founder stay English.
    acquisitions: [
      // [0] 2024 MetaGeek
      {
        "what": "Wi-Spy, inSSIDer e Chanalyzer, as ferramentas de análise de Wi-Fi fundadas em Boise em 2005; compradas da Auvik, dona delas desde abril de 2022; termos não divulgados.",
        "became": "Parte da linha wireless da Oscium, ao lado do analisador Nomad; Brian Tuttle voltou para liderar o desenvolvimento de software.",
        "sourceNote": "Comunicado de imprensa da Oscium, 7 de outubro de 2024, e oscium.com/about (lido em 2026-10-06)."
      },
    ],
  },
  // ---- pearson-vue: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "pearson-vue": {
    // Parent note (official.parent.note), added 26/10/2026 with the parents apply; name, slug and year stay English facts.
    parentNote: "Um negócio da Pearson que mantém o próprio nome: a Pearson VUE é o braço de aplicação de exames da Pearson plc.",
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Pearson VUE",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Uma certificação vale exatamente o que vale sua verificação, e é aqui que a verificação acontece.",
    intro: "A Virtual University Enterprises foi fundada em 1994 (o relato da própria empresa cita Clarke Porter, Steve Nordberg e Kirk Lundeen; algumas fontes creditam apenas E. Clarke Porter). Expandiu-se para a Holanda e a Austrália no ano seguinte, foi adquirida pela NCS e depois pela Pearson em 2000, e virou Pearson VUE. Hoje aplica algo como 21 milhões de provas por ano em mais de 180 países.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "O motivo pelo qual ela pertence a um site sobre ensino é uma cadeia de confiança que quase ninguém examina. Um fabricante define o que significa competência e emite uma credencial. Uma empresa de treinamento ensina com esse alvo. E em algum ponto no meio, um estranho precisa comprovar que a pessoa sentada ao teclado é a pessoa cujo nome está no certificado, que ela não teve ajuda e que não viu as questões antes. Uma credencial vale exatamente o que vale essa verificação, e nada mais. Toda discussão sobre se as certificações significam alguma coisa é, na verdade, uma discussão sobre esta camada.",
      "Por isso o aparato de segurança é o produto: documentos de identidade conferidos com o agendamento, captura de assinatura, leitura das veias da palma da mão em alguns centros, vigilância, um fiscal que observa e uma sala despojada de tudo o que um candidato poderia consultar. Os Pearson Professional Centers, introduzidos em 2002, existem para padronizar exatamente isso, porque uma certificação aplicada de forma inconsistente em cinco mil locais é uma certificação cujo valor varia conforme o CEP.",
      "Um detalhe de timing merece registro sem leitura exagerada. O OnVUE, a plataforma de aplicação com supervisão online, foi lançado em 2019. No ano seguinte, os centros de prova do mundo inteiro fecharam, e a supervisão remota virou a única forma de obter a maioria das certificações. A capacidade existia um ano antes de se tornar indispensável, o que foi sorte, e não previsão; mas a alternativa, uma indústria obrigada a inventar a supervisão remota em pleno lockdown, teria sido bem pior.",
      "A supervisão remota também deslocou o problema de confiança em vez de resolvê-lo. Num centro de provas, o ambiente é controlado pelo examinador; numa mesa de cozinha, é controlado pelo candidato, e a verificação passa a ser uma câmera, uma varredura da sala e monitoramento comportamental. É uma garantia mais fraca descrita com honestidade, e a indústria discute essa troca desde então, ao lado de uma segunda discussão, sobre a vigilância de pessoas dentro da própria casa, que é outra objeção, e uma objeção justa.",
      "A controladora é a outra metade da história. A Pearson remonta a 1844 e começou como construtora (S. Pearson & Son, empreiteiros) antes de virar editora e depois empresa de educação. É o segundo negócio desta linha do tempo que passou o primeiro século movimentando coisas físicas e o segundo movimentando informação, depois da Ingram Industries, que atuava com madeira e navegação desde os anos 1830 antes de acabar distribuindo computadores. Dois dos nomes mais antigos daqui chegaram da indústria pesada, o que é menos uma coincidência do que um lembrete de que o que dura numa empresa raramente é o produto.",
      "O portfólio de aplicação de provas foi montado por compras (Goal Designs em 2001, Promissor em 2006, Integral7 em 2010, Exam Design em 2013), e o negócio hoje vai muito além da certificação em tecnologia: provas de admissão acadêmica, licenciamento em saúde e finanças e programas de governo, incluindo exames teóricos de direção. A maioria das pessoas que já fez uma prova Pearson VUE nunca ouviu o nome, que é a condição normal da infraestrutura.",
    ],
    // Acquisitions: 4 entries index-aligned with the English; year, name, price and founder stay English.
    acquisitions: [
      // [0] 2000 Virtual University Enterprises
      {
        "what": "A empresa de provas computadorizadas de 1994, adquirida pela NCS e depois pela Pearson.",
        "became": "Pearson VUE.",
        "sourceNote": "A maioria das fontes data a aquisição pela Pearson em 2000; uma fonte secundária diz 2006 e não é seguida aqui."
      },
      // [1] 2001 Goal Designs
      {
        "what": "Consultoria em gestão de programas de certificação.",
        "became": "Parte do portfólio de desenvolvimento de provas."
      },
      // [2] 2006 Promissor
      {
        "what": "Provas de licenciamento e certificação.",
        "became": "Expansão para além de TI, rumo às profissões regulamentadas."
      },
      // [3] 2013 Exam Design
      {
        "what": "Ferramentas de autoria de provas e psicometria.",
        "became": "Suporte a provas baseadas em desempenho e a itens de simulação."
      },
    ],
    // Profile: complete copy of profiles/pearson-vue.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "pearson-vue",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        {
          "year": 1994,
          "title": "Fundada para ser uma empresa de treinamento",
          "detail": "A intenção declarada no início era um negócio de serviços de treinamento de classe mundial para a indústria de tecnologia da informação. Provas não eram o plano; foram aquilo em que a empresa se revelou boa, e o que ela virou no lugar disso."
        },
        {
          "year": 2025,
          "title": "E de volta ao treinamento, trinta anos depois",
          "detail": "O programa atual está convertendo a rede de centros de provas em locais que vendem treinamento junto com a prova: cursos de nuvem, segurança e inteligência artificial ministrados nos mesmos locais que aplicam o certificado no fim. A empresa fundada para fazer treinamento e desviada para as provas agora usa a rede de provas para fazer treinamento."
        }
      ],
      // Products: names as the vendor writes them; descriptions translated.
      products: [
        {
          "name": "Aplicação em centros de provas",
          "what": "Cerca de cinco mil e quinhentos locais, e a camada física da indústria: uma sala, um fiscal, um armário para os seus pertences e uma máquina que não é sua."
        },
        {
          "name": "OnVUE",
          "what": "Aplicação com supervisão remota, hoje uma parcela considerável do volume. Seja qual for a conclusão sobre a troca descrita no verbete acima, ela tornou a certificação acessível a candidatos a centenas de quilômetros do centro mais próximo, o que sempre foi uma barreira real e raramente discutida."
        },
        {
          "name": "Desenvolvimento de provas",
          "what": "As ferramentas por trás das questões: bancos de itens, psicometria, tarefas baseadas em desempenho e simuladas. É aqui que uma certificação fica mais difícil de decorar, e isso é comprado como serviço pelos fabricantes cujos nomes aparecem nos certificados."
        },
        {
          "name": "Inscrição e administração de credenciais",
          "what": "Agendamento, pagamento, registros de identidade e entrega de resultados. Sem glamour, e a parte que o candidato de fato mais vivencia."
        }
      ],
      // Innovations: title and detail translated.
      innovations: [
        {
          "title": "A separação sobre a qual a certificação se apoia",
          "detail": "O motivo pelo qual uma credencial significa alguma coisa é que quem ensina não é quem decide se você passou. Essa separação é a fundação da indústria, e é por isso que as empresas de provas existem como negócios separados, e não como departamentos dentro dos fabricantes."
        },
        {
          "title": "E a pergunta que a estratégia atual levanta",
          "detail": "Se a organização que aplica a prova também vende o curso que prepara para ela, a separação se estreita. Ela não desaparece (o fabricante ainda escreve os objetivos e é dono da credencial, e um braço de treinamento e um braço de aplicação podem ser operados separadamente), mas vale dizer com todas as letras que o arranjo está mudando, e que ninguém que faz uma prova é informado sobre quais partes da cadeia estão sob o mesmo teto."
        },
        {
          "title": "Padronizar uma experiência em cinco mil salas",
          "detail": "O problema de engenharia difícil aqui não é o software. É fazer uma prova no Recife ser idêntica em segurança, tempo e condições à mesma prova em Roterdã, em instalações que a empresa na maioria das vezes não possui, com pessoas que ela na maioria das vezes não emprega. A consistência de franquia é o produto inteiro, e é por isso que o padrão de centros introduzido em 2002 importou mais do que qualquer tecnologia que a empresa já lançou."
        }
      ],
      // Markets paragraphs.
      markets: [
        "A certificação em tecnologia é a parte visível, e a menor. O negócio maior é o licenciamento profissional (saúde, finanças, direito), a admissão acadêmica e os programas de governo, em torno de vinte e um milhões de provas por ano.",
        "Sua principal concorrente aparece em outro ponto desta linha do tempo, e as duas, juntas, aplicam a maior parte das provas computadorizadas de alto risco do mundo, uma concentração que merece atenção numa indústria cuja credibilidade depende de verificação independente."
      ],
      // Analyst standing statements.
      analyst: [
        "Não há mercado de analistas para avaliar. A medida relevante é a confiança, e a ameaça relevante a ela não é a concorrência, mas o incidente: uma única falha de verificação amplamente divulgada prejudica toda credencial aplicada pelo mesmo canal.",
        "A questão estratégica é a levantada acima. Uma empresa que começou como negócio de treinamento, virou a examinadora neutra e agora vende treinamento de novo deu uma volta completa em trinta anos. Se isso é convergência ou conflito depende inteiramente do cuidado com que as duas metades são mantidas separadas, e isso não é algo que um candidato possa inspecionar."
      ],
    },
  },
  // ---- polycom: pt-BR prose for the record (facts stay in the English record) ----
  "polycom": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Polycom - o triângulo em toda mesa de reunião",
    // Card line (also the meta description) and intro paragraph.
    tagline: "A empresa que pôs um viva-voz triangular em toda mesa de reunião, comprada por uma fabricante de headsets, rebatizada e comprada de novo pela HP.",
    intro: "A Polycom foi cofundada em 1990 por Brian L. Hinman e Jeffrey Rodman, colegas vindos da PictureTel, e logo se mudou de San Francisco para San Jose. Seu primeiro produto, em 1992, foi o SoundStation: um viva-voz triangular para conferências com áudio full-duplex, ou seja, os dois lados podiam falar ao mesmo tempo sem que a linha cortasse, e o formato virou o emblema da sala de reunião por um quarto de século. A empresa cresceu do áudio para o vídeo e foi, durante a maior parte dos anos 2000 e 2010, o nome de referência em terminais de conferência.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A linha de vídeo veio por aquisição e depois por engenharia própria. Em janeiro de 1998, a Polycom comprou a ViaVideo por 54 milhões de dólares e, com ela, a unidade de vídeo set-top que virou o ViewStation; em outubro de 2001, adquiriu a PictureTel, a empresa da qual seus próprios fundadores tinham saído. Veio então o RealPresence, primeiro como cliente de desktop e depois como sistemas de sala, incluindo o imersivo RealPresence Experience de 2006. Em 2017, a empresa teve receita de 1,1 bilhão de dólares.",
      "A cadeia de donos é o que justifica o verbete. Em abril de 2016, a Mitel concordou em comprar a Polycom por 1,96 bilhão de dólares; em julho, o negócio foi abandonado em favor de uma oferta totalmente em dinheiro da Siris Capital, uma gestora de private equity de Nova York, que fechou o capital da empresa por 1,7 bilhão. Em 28 de março de 2018, a Plantronics, fabricante de headsets de Santa Cruz, anunciou que compraria a Polycom por cerca de 2 bilhões de dólares, e concluiu a aquisição em 2 de julho de 2018: 1,638 bilhão de dólares em dinheiro e 6,352 milhões de ações da Plantronics. Em 2019, a empresa combinada mudou o nome para Poly.",
      "Três anos depois, foi comprada de novo. A HP anunciou a aquisição da Poly em 28 de março de 2022 e a concluiu em 29 de agosto de 2022, uma transação totalmente em dinheiro a 40 dólares por ação, um enterprise value de cerca de 3,3 bilhões de dólares incluindo a dívida líquida da Poly, descrevendo a Poly como videoconferência, câmeras, headsets, voz e software. O nome Polycom sobrevive como uma linha no catálogo da HP e, neste site, como duas credenciais de 2014 cujo emissor já não existe.",
      "Por que ela pertence a um registro de redes: uma videochamada é a aplicação que expõe mais depressa uma rede mal construída. Jitter, perda de pacotes e um projeto de qualidade de serviço que nunca foi testado aparecem numa tela Polycom antes de aparecer em qualquer outro lugar, e é por isso que o engenheiro de redes de uma integradora acabou certificado nos terminais dela.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "adquirida pela Plantronics em julho de 2018 e absorvida no nome Poly em 2019; a HP comprou a Poly em agosto de 2022",
    // Successor link label (the URL stays in the English record).
    successorLabel: "Poly, uma linha de produtos da HP (antes Polycom e Plantronics)",
  },
  // ---- portswigger: pt-BR prose for the record (facts stay in the English record) ----
  "portswigger": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "PortSwigger - o projeto paralelo do consultor que virou o padrão",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Dafydd Stuttard escreveu ferramentas para agilizar a própria consultoria numa cidadezinha de Cheshire, deu a uma delas um nome qualquer, e ela virou o instrumento padrão dos testes de aplicações web.",
    intro: "A PortSwigger é uma empresa britânica de software fundada pelo consultor de segurança Dafydd Stuttard, criadora do Burp Suite, o kit de ferramentas para testes de segurança de aplicações web.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A origem é a mais comum deste catálogo e produziu um de seus desfechos menos comuns. Dafydd Stuttard era um consultor de segurança que morava em Knutsford, uma cidade de feira em Cheshire, fazendo para uma série de clientes o trabalho que os consultores fazem. As partes rotineiras desse trabalho eram repetitivas, então ele escreveu pequenos programas para agilizá-las, deu a cada um um nome qualquer, usou-o por um tempo e seguiu em frente. De vez em quando os compartilhava com uma comunidade que já o conhecia como autor e profissional da área.",
      "Um deles se chamava Burp (arroto, em inglês), sem motivo nenhum, e as primeiras versões faziam barulhos de arroto de verdade. A versão 1.0 saiu em junho de 2003 como a primeira encarnação da ferramenta Intruder; as peças separadas (um proxy, um spider, um repeater) foram unificadas numa suíte em 2005, e o scanning automatizado chegou em 2008. O que fez dele o padrão não foi o scanner. Foi o proxy: uma ferramenta que permite ao testador ver e modificar cada requisição entre o navegador e a aplicação, que é a operação irredutível do teste de aplicações web e algo que nenhum produto automatizado substitui.",
      "A estrutura da empresa merece nota para quem ensina. Uma edição Community gratuita mantém as ferramentas manuais disponíveis para estudantes, autodidatas e qualquer pessoa cujo empregador não queira pagar, enquanto as edições Professional e Enterprise trazem a automação que uma consultoria cobra. Esse arranjo, mais o Web Application Hacker's Handbook, do qual Stuttard é coautor, significa que a mesma pessoa deu a uma geração tanto o instrumento quanto o livro-texto, e o plano gratuito é o motivo pelo qual é nesse instrumento que as pessoas aprendem.",
      "A ressalva relevante cabe à ferramenta, e não à empresa, e o artigo sobre interceptação deste site a faz: um proxy de interceptação é tecnicamente idêntico, esteja a pessoa que o opera autorizada ou não. O que separa um teste de uma invasão é um documento de escopo e uma assinatura, e é por isso que a disciplina profissional em torno deste produto é procedimental, e não técnica.",
    ],
  },
  // ---- proofpoint: pt-BR prose for the record (facts stay in the English record) ----
  "proofpoint": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Proofpoint - o gateway de e-mail, ainda",
    // Card line (also the meta description) and intro paragraph.
    tagline: "O e-mail continuou sendo a porta de entrada muito depois de a indústria deixar de achá-lo interessante.",
    intro: "A Proofpoint construiu seu negócio sobre a segurança de e-mail numa época em que a atenção da área se deslocava para outros lugares. Esse timing acabou sendo justamente o ponto: o e-mail continuou sendo o vetor de acesso inicial mais comum ao longo de duas décadas de superfícies de ataque mais novas e mais interessantes.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A Proofpoint foi fundada em Sunnyvale em julho de 2002 por Eric Hahn, que tinha sido CTO da Netscape, e lançada um ano depois, após uma primeira rodada de sete milhões de dólares. Sua aposta era estatística: onde o mercado vendia appliances baseados em regras, ela embutiu classificação e machine learning na filtragem, com o raciocínio de que spam e phishing mudam mais rápido do que qualquer conjunto de regras é atualizado.",
      "Abriu capital em abril de 2012 a treze dólares por ação e cresceu principalmente por aquisições: treinamento de conscientização em segurança em 2018, monitoramento de ameaças internas em 2019, zero trust network access no mesmo ano, prevenção de perda de dados gerenciada em 2021, análise comportamental de e-mail em 2023. O padrão é o que todo fabricante de plataforma segue: comprar a categoria vizinha antes que o cliente a compre de outra empresa.",
      "Em 2021, a Thoma Bravo a adquiriu por 12,3 bilhões de dólares, uma das maiores compras de empresas de software já registradas, e a segurança de e-mail entrou na longa lista de categorias hoje controladas por private equity, e não por acionistas do mercado aberto.",
      "O incidente EchoSpoofing de 2024 pertence ao registro. Uma fragilidade de configuração permitiu que até catorze milhões de mensagens fraudulentas por dia fossem retransmitidas pela própria infraestrutura da empresa durante cerca de seis meses, pegando emprestada sua reputação de envio. Uma plataforma de segurança é infraestrutura como qualquer outra, e a reputação que a torna útil para os clientes é exatamente o que a torna valiosa para um atacante que consiga enviar por meio dela.",
    ],
  },
  // ---- q1-labs: pt-BR prose for the record (facts stay in the English record) ----
  "q1-labs": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Q1 Labs - QRadar",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Um spin-off da Universidade de New Brunswick cujo software de inteligência de segurança virou o IBM QRadar, e depois dois produtos com dois donos.",
    intro: "A Q1 Labs foi fundada em Fredericton, New Brunswick, em 2001, como spin-off da Universidade de New Brunswick e, quando a IBM a comprou em 2011, tinha sede em Waltham, Massachusetts, com presença ainda forte em Fredericton. Seu produto, o QRadar, era o que o mercado chamava de inteligência de segurança: gerenciamento de logs, ameaças e compliance, com processadores de flows e de eventos que liam eventos de rede e de segurança e dados de flows de rede e de aplicação, vendido a 1.800 clientes.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "A IBM anunciou a aquisição em 4 de outubro de 2011, sem divulgar os termos financeiros, e a concluiu em 26 de outubro de 2011. O CEO da Q1 Labs, Brendan Hannigan, tornou-se gerente-geral de uma divisão recém-criada, a IBM Security Systems, o que revela o que a IBM estava comprando: não uma linha de produtos para encaixar num portfólio existente, mas o centro de um novo.",
      "Treze anos depois, o produto se dividiu. Em 4 de setembro de 2024, a Palo Alto Networks concluiu a aquisição dos ativos de QRadar Software as a Service da IBM, oferecendo aos clientes elegíveis migração gratuita para sua plataforma Cortex XSIAM com a ajuda da IBM Consulting, enquanto os clientes de QRadar que quisessem permanecer no produto on-premises continuaram recebendo recursos e suporte da IBM. Um nome, dois donos, dois futuros: a versão em nuvem virou um caminho de migração para a plataforma de um concorrente, e a versão on-premises ficou onde estava.",
      "O registro mantém a empresa porque o padrão se repete nesta linha do tempo. Um spin-off de uma universidade regional constrói o produto de que uma categoria precisa, um gigante o compra para fundar uma divisão e, uma década depois, o produto vale mais como lista de clientes do que como código. Os engenheiros de Fredericton que escreveram os processadores de flows são a parte da história que os dois comunicados de imprensa deixam de fora.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "Adquirida pela IBM; o negócio foi anunciado em 4 de outubro de 2011 e concluído em 26 de outubro de 2011, e o CEO da Q1 Labs tornou-se gerente-geral da nova divisão Security Systems da IBM. Em setembro de 2024, os ativos de QRadar SaaS passaram à Palo Alto Networks, enquanto o QRadar on-premises ficou com a IBM.",
    // Successor link label (the URL stays in the English record).
    successorLabel: "IBM, que adquiriu a Q1 Labs em 2011 e ainda vende o QRadar on-premises; os ativos de QRadar SaaS foram para a Palo Alto Networks em 2024",
  },
  // ---- quest-software: pt-BR prose for the record (facts stay in the English record) ----
  "quest-software": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Quest Software - vendida para comprar outra coisa",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Fabricante de software de gerenciamento de sistemas e bancos de dados fundada em 1987, comprada pela Dell e depois revendida duas vezes.",
    intro: "A Quest Software foi fundada em 1987 na Califórnia, escrevendo inicialmente software de alta disponibilidade e middleware para minicomputadores Hewlett-Packard, e ficou amplamente conhecida pelo Toad, uma ferramenta que administradores de bancos de dados usam todos os dias. A Dell a comprou em 2012 por US$ 2,36 bilhões; quatro anos depois, foi vendida de novo, e mais uma vez em 2021.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "A venda de 2016 é a parte que vale dizer com todas as letras, porque o motivo é incomumente legível. A Dell precisava de dinheiro para a aquisição da EMC, então vendeu a divisão de software que tinha montado: a Quest, a SonicWall e, junto, o negócio de identidade. Uma empresa que tinha sido comprada para completar um portfólio foi vendida para financiar uma compra maior, e os clientes das três se viram sob novos donos em consequência de uma transação da qual não tiveram parte nenhuma.",
      "A One Identity saiu desse grupo como marca própria em 2017 e atua no mesmo campo dos fabricantes de identidade com que este site trabalha. Governança de identidade, acesso privilegiado e recuperação de diretório são a metade sem glamour da segurança: ninguém os compra depois de uma demonstração, e toda organização descobre que precisava deles no pior momento possível.",
      "Há uma coincidência na cadeia societária que merece atenção, porque esta linha do tempo agora registra os dois lados dela. A gestora de private equity que tirou esta empresa da Dell é a mesma que fechou o capital da Procera Networks e a fundiu com a Sandvine. Um único investidor teve ao mesmo tempo o fabricante de deep packet inspection e o fabricante de gerenciamento de identidade, o que diz algo sobre como esta indústria é de fato montada que nenhuma comparação de produtos mostraria.",
    ],
  },
  // ---- rapid7: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "rapid7": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Rapid7",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Comprou o kit de ataque mais conhecido da indústria, o oposto do que sua principal concorrente fez com o código aberto.",
    intro: "A Rapid7 foi fundada em 2000 em Boston, e a decisão que lhe deu uma posição própria veio nove anos depois: em 2009, ela adquiriu o Metasploit Framework, o kit de exploração de código aberto que HD Moore tinha criado em 2003, e levou Moore junto.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A importância fica mais clara diante da Tenable, que também está nesta linha do tempo. A Tenable foi construída sobre um scanner de código aberto e o fechou em 2005 para financiar a empresa. A Rapid7 foi pelo caminho contrário: comprou integralmente um projeto de código aberto, manteve-o aberto e o usou como motivo para confiar nos produtos comerciais ao lado dele. Dois fabricantes num mesmo mercado tomaram posições opostas sobre a mesma questão do código aberto, e os dois continuam operando.",
      "Ser dona do Metasploit também mudou o que a Rapid7 podia afirmar. Um scanner informa que um host provavelmente está vulnerável; um framework de exploração demonstra que está. Ter os dois significava que a empresa podia fechar a distância entre um achado e uma prova, e essa distinção é todo o argumento a favor do teste de invasão em vez de apenas o scanning.",
      "O problema a que o segmento dedicou duas décadas não é a detecção, mas o volume. O scan de uma grande organização devolve dezenas de milhares de achados e ninguém consegue agir sobre todos, então o trabalho útil virou ranquear, e é por isso que todo fabricante daqui, a Rapid7 incluída, acabou lançando uma pontuação de risco e se apoiando no catálogo público de vulnerabilidades sabidamente exploradas em atividade.",
      "A Rapid7 abriu capital em 2015 e se expandiu para detecção e resposta, postura de nuvem e serviços gerenciados, pela mesma lógica que toda empresa de segurança desta página acaba seguindo: depois que você é o sistema de registro de um tipo de risco, os tipos vizinhos são a coisa mais barata que você pode vender em seguida.",
    ],
    // Acquisitions: 1 entries index-aligned with the English; year, name, price and founder stay English.
    acquisitions: [
      // [0] 2009 Metasploit Framework
      {
        "what": "O kit de exploração de código aberto mais usado, mantido aberto depois da aquisição.",
        "became": "O Metasploit Pro ao lado da edição comunitária, e o motivo pelo qual a Rapid7 podia provar a explorabilidade, e não apenas relatá-la."
      },
    ],
    // Profile: complete copy of profiles/rapid7.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "rapid7",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          "company": "Rapid7",
          "year": 2000,
          "place": "Boston, Massachusetts",
          "founders": [],
          "story": "Fundada em 2000, e a decisão que lhe deu uma posição própria veio nove anos depois, quando adquiriu o Metasploit Framework e o manteve em código aberto. Uma empresa de gerenciamento de vulnerabilidades dona do kit de exploração mais conhecido da indústria é um arranjo incomum, e é o inverso do que sua concorrente mais próxima fez com o scanner sobre o qual foi construída.",
          "sourceNote": "Os nomes dos fundadores não são informados de forma consistente e não são fornecidos aqui."
        }
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        {
          "year": 2000,
          "title": "Fundação",
          "detail": "Em Boston, no mercado de avaliação de vulnerabilidades."
        },
        {
          "year": 2009,
          "title": "Metasploit",
          "detail": "Adquirido, e mantido aberto. O framework continuou gratuito enquanto a empresa construía produtos comerciais ao lado dele: a direção oposta à do Nessus quatro anos antes."
        },
        {
          "year": 2015,
          "title": "Listagem na NASDAQ",
          "detail": "Listada como RPD."
        },
        {
          "year": 2020,
          "title": "Consolidação da plataforma Insight",
          "detail": "Achados de vulnerabilidades, detecção e resposta, segurança de aplicações e postura de nuvem reunidos sobre dados compartilhados, apostando que os clientes querem os achados correlacionados com telemetria ao vivo, e não entregues como um relatório separado."
        }
      ],
      // Products: names as the vendor writes them; descriptions translated.
      products: [
        {
          "name": "InsightVM",
          "what": "O sucessor em nuvem do Nexpose: dashboards ao vivo, priorização baseada em risco e integração com sistemas de tickets e pipelines de entrega, para que os achados virem itens de trabalho, e não PDFs."
        },
        {
          "name": "Metasploit",
          "what": "O framework de exploração, ainda em código aberto, ao lado de uma edição comercial Pro. É ao mesmo tempo um produto, uma ferramenta de recrutamento e o motivo pelo qual muitíssimos profissionais sequer conhecem a empresa."
        },
        {
          "name": "InsightIDR",
          "what": "Detecção e resposta, alimentadas pelos mesmos dados da plataforma; o argumento é que uma vulnerabilidade importa de outro jeito quando algo já está se movendo na rede."
        },
        {
          "name": "InsightAppSec",
          "what": "Testes dinâmicos de segurança de aplicações, sondando aplicações em execução em vez de escanear hosts. Um produto separado porque responde a outra pergunta."
        },
        {
          "name": "Active Risk",
          "what": "Priorização com inteligência de ameaças e machine learning, e não apenas pela severidade publicada, apontada diretamente para a distância entre o que é pontuado como crítico e o que está de fato sendo explorado."
        }
      ],
      // Innovations: title and detail translated.
      innovations: [
        {
          "title": "A tutela de uma ferramenta de uso dual",
          "detail": "Manter o Metasploit aberto tornou a empresa responsável por um framework que atacantes usam com a mesma facilidade que defensores. Cada novo módulo é uma capacidade liberada para os dois lados ao mesmo tempo, e a justificativa (a técnica já é conhecida, e são os defensores que precisam dela empacotada) é o mesmo argumento em torno do qual gira todo o debate sobre divulgação."
        },
        {
          "title": "Validação dentro da mesma plataforma",
          "detail": "Como o framework de exploração e o scanner têm o mesmo dono, confirmar um achado é uma etapa do fluxo de trabalho, e não um projeto à parte com outro fornecedor, o que muda quem pode fazê-lo e com que frequência."
        },
        {
          "title": "Achados como fluxo de trabalho, não como relatórios",
          "detail": "A integração nativa com sistemas de tickets reflete o modo de falha real: o relatório é produzido e nada acontece. Transformar um achado num ticket atribuído com uma meta de nível de serviço é uma decisão de produto sobre comportamento organizacional, e não sobre scanning."
        },
        {
          "title": "Correlacionar exposição com dados de ataque ao vivo",
          "detail": "Achados de vulnerabilidades e telemetria de detecção numa só plataforma significam que a pergunta deixa de ser qual destes cinquenta mil achados importa e passa a ser qual deles está sendo tocado agora."
        }
      ],
      // Markets paragraphs.
      markets: [
        "Médias e grandes empresas, com preço de entrada abaixo do da principal concorrente e fama de servir a equipes que querem o trabalho com vulnerabilidades dentro do processo de entrega que já têm, e não ao lado dele.",
        "Concorre com Tenable e Qualys, ambas nesta linha do tempo, e seus produtos de detecção a colocam diante de um segundo grupo de fabricantes completamente diferente, que é a troca de consolidação que toda empresa de segurança deste segmento fez."
      ],
      // Analyst standing statements.
      analyst: [
        "Avaliada regularmente entre os fabricantes estabelecidos de gerenciamento de vulnerabilidades, com a priorização e a amplitude de integrações citadas como pontos fortes e a complexidade de configuração como a crítica constante nas avaliações de profissionais.",
        "A observação sobre a categoria vale aqui também: a marca migrou para exposure management nos três fabricantes, e nenhum concluiu a migração, então as avaliações ainda giram em torno de arquitetura de scan, cobertura e pontuação."
      ],
    },
  },
  // ---- raspberry-pi: pt-BR prose for the record (facts stay in the English record) ----
  "raspberry-pi": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Raspberry Pi - a máquina que você tem permissão para quebrar",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Computador de placa única criado para levar a computação de volta ao ensino, hoje embutido em redes e no trabalho de laboratório.",
    intro: "O Raspberry Pi é um computador de placa única desenvolvido no Reino Unido por uma fundação criada para promover o ensino de ciência da computação, a um preço que fez dele algo que uma escola ou um aprendiz podia se arriscar a usar.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "Ele pertence a um site sobre aprender redes pelo que mudou na prática, e não pelo que computa. Antes dele, um laboratório significava equipamento emprestado ou um simulador; depois, uma máquina funcional com uma interface de rede de verdade custava menos que um livro didático. O aprendiz pode configurá-la, quebrá-la, reinstalá-la e quebrá-la de novo, que é como o assunto se aprende de fato e é justamente o que o equipamento de laboratório compartilhado não permite.",
      "Nas redes em produção, ele apareceu assim mesmo, como pequenos roteadores, sondas, nós de monitoramento, console servers e capturas de pacotes numa prateleira. É o destino comum de um computador barato de uso geral com uma porta Ethernet: alguém descobre a tarefa que ele faz bem, e a tarefa deixa de precisar de um dispositivo dedicado.",
      "Ele também demonstra o arranjo que os marcos de fabricação descrevem, na menor escala possível. Uma fundação sem fábrica projetou uma placa em torno de uma arquitetura de processador licenciada, mandou fabricar o silício com uma empresa e montar as placas com outra, e vendeu o resultado pelo preço de uma refeição.",
    ],
  },
  // ---- riverbed: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "riverbed": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Riverbed",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Pioneira em otimização de WAN que virou empresa de observabilidade.",
    intro: "A Riverbed definiu a otimização de WAN: seus appliances SteelHead faziam aplicações distantes parecerem locais na época em que toda filial vivia na ponta de um circuito estreito e caro, e desde então a empresa se reconstruiu em torno de observabilidade e aceleração.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "A Red Education fornece capacitação em Riverbed ao mercado desde 2008 e é Riverbed Authorised Consulting Partner, com cursos que seguem em seus catálogos da Australásia, da SAARC e da ASEAN.",
      "Fundada em 2002 por Jerry Kennelly e Steve McCanne (este, coautor do tcpdump e do Berkeley Packet Filter, ferramentas que metade dos tutoriais deste site pressupõe), a Riverbed surfou a era SteelHead até um IPO, teve o capital fechado em 2015 e passou por uma reestruturação sob supervisão judicial no fim de 2021. Hoje concorre em observabilidade unificada, bem longe da WAN de filial que foi criada para encolher.",
    ],
    // Profile: complete copy of profiles/riverbed.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "riverbed",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          "company": "Riverbed Technology",
          "year": 2002,
          "place": "San Francisco, Califórnia",
          "founders": [
            "Jerry Kennelly",
            "Steve McCanne"
          ],
          "story": "Steve McCanne já tinha deixado uma marca permanente nas redes antes de a Riverbed existir: no Lawrence Berkeley National Laboratory, foi coautor do BSD Packet Filter e da biblioteca de captura libpcap, a maquinaria por baixo do tcpdump e, décadas depois, das próprias ferramentas de captura deste site. Com Jerry Kennelly, fundou a Riverbed em 2002 sobre um problema comercial mais afiado: a WAN era lenta e cara, e as filiais sofriam com isso. O appliance Steelhead respondeu com deduplicação, compressão e aceleração de protocolos nas duas pontas do link, e 'WAN optimization' virou um mercado com o nome da Riverbed no topo."
        }
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        {
          "year": 2002,
          "title": "Fundada sobre uma WAN lenta",
          "detail": "Kennelly e McCanne abrem a Riverbed para fazer os links de longa distância parecerem locais: redução de dados e aceleração de TCP e de protocolos de aplicação num par simétrico de appliances."
        },
        {
          "year": 2004,
          "title": "Sai o Steelhead",
          "detail": "Chega o carro-chefe e define a categoria: Steelheads na filial e no data center deduplicando e acelerando o tráfego entre si, muitas vezes transformando upgrades de WAN em itens adiados do orçamento."
        },
        {
          "year": 2006,
          "title": "IPO: RVBD",
          "detail": "A Riverbed estreia na Nasdaq como a líder clara em otimização de WAN, posição que mantém durante a década de ouro da categoria."
        },
        {
          "year": 2012,
          "title": "OPNET e a virada para a visibilidade",
          "detail": "A aquisição da OPNET, de cerca de US$ 1 bilhão, leva a Riverbed ao gerenciamento de desempenho de aplicações e de rede: a aposta de que, quando a WAN já é rápida, a pergunta seguinte é por que a aplicação ainda está lenta."
        },
        {
          "year": 2015,
          "title": "A Thoma Bravo fecha o capital",
          "detail": "Uma compra de cerca de US$ 3,6 bilhões encerra o capítulo de capital aberto, enquanto o SD-WAN começa a corroer o mercado clássico de otimização que o Steelhead definiu."
        },
        {
          "year": 2021,
          "title": "Reestruturação, e depois um novo dono",
          "detail": "Um Chapter 11 pré-negociado reestrutura a dívida enquanto a categoria encolhe; em 2023, a Vector Capital adquire a empresa e a reorienta para aceleração mais o portfólio de observabilidade da linhagem Aternity: o segundo ato da Riverbed como fabricante de observabilidade unificada.",
          "sourceNote": "Trajetória societária segundo a cobertura da imprensa sobre a reestruturação de 2021 e a aquisição pela Vector em 2023."
        }
      ],
      // Products: names as the vendor writes them; descriptions translated.
      products: [
        {
          "name": "SteelHead",
          "what": "O carro-chefe da otimização de WAN: deduplicação, compressão e aceleração de protocolos, o appliance que deu nome à categoria."
        },
        {
          "name": "Riverbed IQ and Aternity",
          "what": "O lado da observabilidade: monitoramento unificado de rede e de experiência digital, levando adiante as linhagens OPNET e Aternity."
        },
        {
          "name": "AppResponse and NetProfiler",
          "what": "Análise de desempenho de rede em nível de pacote e de flow: captura com fidelidade total encontrando a visibilidade em escala de NetFlow."
        }
      ],
      // Innovations: title and detail translated.
      innovations: [
        {
          "title": "A otimização de WAN como categoria",
          "detail": "O modelo simétrico de deduplicar e acelerar do Steelhead fez do desempenho de aplicações um produto de rede, e fez da Riverbed, por uma década, uma das grandes histórias de crescimento das redes."
        },
        {
          "title": "A herança da captura",
          "detail": "Por meio de McCanne, o DNA da Riverbed inclui o próprio BPF e a libpcap; a empresa depois foi, por anos, a patrocinadora comercial do Wireshark: realeza da análise de pacotes."
        }
      ],
      // Markets paragraphs.
      markets: [
        "A Riverbed hoje vende aceleração e observabilidade unificada a grandes empresas, um segundo ato focado depois que a era do SD-WAN absorveu a otimização de WAN clássica, concorrendo no mercado de monitoramento de desempenho em vez de definir uma categoria própria."
      ],
      // Analyst standing statements.
      analyst: [
        "A líder perene das avaliações de otimização de WAN enquanto os analistas as fizeram, uma categoria tão identificada com um único fabricante que sua consolidação e a reinvenção da Riverbed chegaram juntas."
      ],
    },
  },
  // ---- rsa-security: pt-BR prose for the record (facts stay in the English record) ----
  "rsa-security": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "RSA Security - a empresa que combateu o Clipper e depois distribuiu o Dual_EC",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Nove anos com um gerador de números aleatórios suspeito como padrão, um contrato de 10 milhões de dólares e um desmentido que respondia a outra pergunta.",
    intro: "A RSA Security é uma empresa americana de segurança, fundada em 1982 pelos autores do algoritmo RSA, cujo kit BSAFE trouxe o gerador Dual_EC_DRBG como padrão de 2004 a 2013.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "A RSA Security leva o nome do algoritmo que seus fundadores publicaram e, durante a maior parte dos anos 1990, foi a empresa que enfrentou o governo por causa da criptografia e venceu: a campanha contra o Clipper Chip, a proposta de obrigar a presença de uma chave acessível ao governo em todo telefone, foi liderada daqui. É essa história que faz o que veio depois valer um verbete inteiro, e não um parágrafo.",
      "De 2004 a 2013, o gerador de números aleatórios padrão do BSAFE, o kit criptográfico amplamente licenciado da empresa, foi o Dual_EC_DRBG. É dos números aleatórios que vêm as chaves, e um gerador cuja saída pode ser prevista torna recuperável toda chave derivada dele. Em 2007, dois pesquisadores da Microsoft mostraram numa conferência de criptografia que esse projeto em particular tinha uma propriedade que ninguém conseguia explicar: um de seus parâmetros, se escolhido com um segredo em mente, dava a quem o escolheu a capacidade de reverter o gerador. Eles não afirmaram que alguém tivesse feito isso. Mostraram que a porta tinha uma fechadura, e que alguém podia ter a chave.",
      "Ele continuou sendo o padrão por mais seis anos. Em dezembro de 2013, a Reuters noticiou que um contrato de 10 milhões de dólares com a National Security Agency tinha determinado essa escolha, e que definir o algoritmo como padrão era uma condição dele. O número precisa de contexto: a divisão BSAFE tinha faturado 27,5 milhões de dólares no ano anterior, então o pagamento correspondia a mais de um terço do que o negócio inteiro gerava. O material de Snowden já tinha confirmado, a essa altura, que a agência tinha contribuído com o algoritmo para o padrão.",
      "A resposta da empresa deve ser lida com o mesmo cuidado com que foi escrita. Ela negou categoricamente ter firmado um contrato secreto para incorporar um gerador sabidamente falho, e disse que tinha escolhido o algoritmo em 2004, antes de a falha ser pública, quando a agência era um participante confiável no fortalecimento da criptografia; que o gerador era uma opção entre várias; e que foi mantido por seu valor para o compliance. Um grupo universitário de criptografia descreveu isso como um quase-desmentido redigido com habilidade. O que não foi negado foi o pagamento.",
      "Duas coisas nesse parágrafo importam para além desta empresa. A primeira é o compliance. O algoritmo sobreviveu a seis anos de alertas de especialistas porque estava no padrão do governo, e usar o padrão é o que o compliance recompensa; assim, o processo destinado a certificar a segurança foi o que manteve o componente suspeito no lugar. A segunda é a forma do desmentido. Ele responde à acusação tal como foi formulada e deixa o fato de pé, e a disciplina de ler o comunicado de um fabricante pelo que ele não diz é uma que este catálogo recomenda em toda parte.",
      "Para a taxonomia do comprometimento de fornecedores, isto acrescenta uma sexta rota às cinco já registradas: comprometer o padrão, e todo produto em conformidade herda a fraqueza sem que nenhum fabricante isolado precise ser convencido. O NIST, que publica o padrão, retirou o algoritmo da revisão preliminar em abril de 2014, e a empresa o removeu do kit em 2015. A invasão de 2011 aos tokens SecurID da mesma empresa tem verbete próprio no glossário e é outra história; esta é sobre uma escolha, e ela foi feita duas vezes: uma em 2004, e de novo a cada ano em que não foi revertida.",
    ],
  },
  // ---- silicon-graphics: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "silicon-graphics": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Silicon Graphics - a geometria de Hollywood",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Os geometry engines de Jim Clark renderizaram Jurassic Park e inventaram o OpenGL; o nome terminou na HPE em 2016.",
    intro: "A SGI construiu as máquinas que ensinaram os computadores a ver: pipelines de geometria, IRIX sobre MIPS e as workstations roxas por trás de uma década de magia no cinema. Sua queda é tão instrutiva quanto sua ascensão: os PCs de commodity devoraram o mercado de gráficos que a SGI criou, e o OpenGL sobreviveu à empresa que o escreveu.",
    // Body: 5 paragraph(s), same order as the English.
    body: [
      "O fundador Jim Clark saiu em 1994 para cofundar a Netscape; o capítulo Cray da empresa, suas duas falências e a aquisição pela HPE em 2016 fecham o ciclo contado no perfil abaixo.",
      "As máquinas começaram com o Geometry Engine que Clark e Marc Hannah tinham projetado em Stanford sob um contrato da ARPA, e Clark deixou o cargo de professor associado de engenharia elétrica para fundar a empresa com sete estudantes de pós-graduação e pesquisadores de Stanford, entre eles Kurt Akeley. A enciclopédia data a fundação em novembro de 1981, em Mountain View; este site adota 1982, o ano em que Clark deixou Stanford, por uma decisão registrada na citação ao lado. Os gráficos saíam por uma biblioteca proprietária, a IRIS GL, até 1992, quando a SGI a reformulou como OpenGL, licenciou-a barato aos próprios concorrentes e criou o OpenGL Architecture Review Board para cuidar do padrão: a API sobreviveu à empresa que a escreveu.",
      "O IRIX era o sistema operacional, nome que junta IRIS e UNIX, um System V com extensões BSD sobre processadores MIPS. A SGI começou a usar o nome com a versão 3.0, em 1988, para a linha IRIS 4D, e o XFS, como o OpenGL, foi construído para ele antes de ser portado para o Linux. Uma SGI Crimson rodando o navegador tridimensional de arquivos fsn apareceu em Jurassic Park em 1993, que é a cena pela qual a maioria das pessoas se lembra da empresa. A última versão, a 6.5.30, saiu em 16 de agosto de 2006.",
      "Em fevereiro de 1996, a SGI comprou a Cray Research por US$ 740 milhões. Vieram então os movimentos que, nas palavras da enciclopédia, abalaram sua credibilidade: as Visual Workstations com Windows NT no fim dos anos 1990, um desastre financeiro que abalou a confiança dos clientes na linha MIPS, e o anúncio prematuro de uma migração do MIPS para o Itanium da Intel, cujos sistemas rodavam SUSE Linux, e não IRIX. Uma análise da Computerworld de 2001 encontrou o IRIX em estado crítico; os clientes de MIPS e IRIX convenceram a SGI a continuar dando suporte à plataforma até 2006.",
      "O fim veio em duas falências. A SGI pediu Chapter 11 em 8 de maio de 2006 e saiu dele em 17 de outubro de 2006; em 6 de setembro de 2006, anunciou o fim das linhas de produtos MIPS e IRIX, a produção terminou em 29 de dezembro de 2006, com as últimas entregas em março de 2007, e o suporte acabou em dezembro de 2013. Em 1º de abril de 2009, pediu falência de novo e vendeu praticamente todos os seus ativos à Rackable Systems, num negócio anunciado em US$ 25 milhões e concluído em 11 de maio de 2009 por US$ 42,5 milhões, com a Rackable adotando o nome Silicon Graphics International. A Hewlett Packard Enterprise concluiu a aquisição dessa empresa em 1º de novembro de 2016, a US$ 7,75 por ação, chamando-a de líder em computação de alto desempenho, análise de dados e gerenciamento de dados, e pondo o supercomputador Pleiades, do NASA Ames, em seu portfólio.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "A Silicon Graphics, Inc. vendeu praticamente todos os seus ativos à Rackable Systems numa venda concluída em 11 de maio de 2009, e a Rackable adotou o nome Silicon Graphics International; a Hewlett Packard Enterprise concluiu a aquisição dessa empresa em 1º de novembro de 2016, a US$ 7,75 por ação, e o nome terminou ali.",
    // Successor link label (the URL stays in the English record).
    successorLabel: "Hewlett Packard Enterprise, que adquiriu a SGI em 2016",
    // Profile: complete copy of profiles/silicon-graphics.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "silicon-graphics",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          "company": "Silicon Graphics (SGI)",
          "year": 1982,
          "place": "Mountain View, Califórnia",
          "founders": [
            "Jim Clark"
          ],
          "story": "Jim Clark saiu de Stanford com o Geometry Engine, um hardware que fazia a matemática da perspectiva 3D na velocidade do silício, e fundou a Silicon Graphics para vender computadores capazes de ver. Nos anos 1980 e 1990, as máquinas da SGI eram os carros esportivos exóticos da computação: IRIX sobre MIPS, gabinetes roxos e preços à altura, renderizando de simuladores de caças aos dinossauros de Jurassic Park. O próprio Clark saiu em 1994 para cofundar a Netscape; a empresa que ele construiu ensinou gráficos à indústria e depois viu os PCs de commodity aprenderem a lição bem demais."
        }
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        {
          "year": 1982,
          "title": "O Geometry Engine",
          "detail": "O trabalho de Clark em Stanford vira empresa: silício dedicado à transformação 3D, o ancestral de todo pipeline de GPU desde então."
        },
        {
          "year": 1992,
          "title": "MIPS, e o OpenGL",
          "detail": "A SGI adquire a MIPS Computer Systems para ser dona de sua linha de processadores e abre sua herança IRIS GL como OpenGL, a API gráfica multiplataforma que sobrevive a tudo o mais nesta história."
        },
        {
          "year": 1993,
          "title": "O computador de Hollywood",
          "detail": "Os dinossauros de Jurassic Park são renderizados em máquinas SGI, e a marca vira sinônimo de magia no cinema: a Industrial Light & Magic e, depois, a indústria de efeitos inteira padronizam nas caixas roxas."
        },
        {
          "year": 1996,
          "title": "Comprando a Cray",
          "detail": "A SGI adquire a Cray Research, unindo por pouco tempo os gráficos de Hollywood à realeza da supercomputação; o encaixe nunca chega a funcionar, e a Cray é revendida em 2000."
        },
        {
          "year": 2006,
          "title": "A longa queda",
          "detail": "Os PCs de commodity com GPUs de consumo, rodando OpenGL, o presente da própria SGI, devoraram o mercado de workstations; o Chapter 11 chega em 2006 e de novo em 2009, quando a Rackable Systems compra os ativos e adota o nome."
        },
        {
          "year": 2016,
          "title": "O nome chega à HPE",
          "detail": "A Hewlett Packard Enterprise conclui a aquisição da SGI, de cerca de US$ 275 milhões, em novembro de 2016, incorporando sua linha de computação de alto desempenho à da HPE: a última bandeira sobre um nome lendário.",
          "sourceNote": "Anúncio e fechamento da HPE segundo o registro do negócio."
        }
      ],
      // Products: names as the vendor writes them; descriptions translated.
      products: [
        {
          "name": "Workstations IRIS e Onyx",
          "what": "Os supercomputadores gráficos dos mundos do cinema, da ciência e da defesa: IRIX sobre MIPS no auge do Unix proprietário."
        },
        {
          "name": "OpenGL",
          "what": "A API gráfica aberta destilada da IRIS GL em 1992: o produto mais duradouro da SGI, e era gratuito."
        },
        {
          "name": "Servidores Origin e Altix",
          "what": "A linha NUMA de computação de alto desempenho cuja linhagem a HPE adquiriu."
        }
      ],
      // Innovations: title and detail translated.
      innovations: [
        {
          "title": "O pipeline gráfico em hardware",
          "detail": "O modelo de transformar e renderizar do Geometry Engine é o ancestral conceitual da GPU moderna, a arquitetura que a NVIDIA e a indústria de games industrializaram."
        },
        {
          "title": "Abrir as joias da coroa",
          "detail": "O OpenGL padronizou os gráficos 3D em toda a indústria e, numa tragédia perfeita, armou o hardware de commodity que desfez o negócio da SGI."
        }
      ],
      // Markets paragraphs.
      markets: [
        "A SGI sobrevive como herança de produtos da HPE e como memória estética; sua verdadeira fatia de mercado vive em todo pipeline de GPU e em todo descendente do OpenGL rodando hoje."
      ],
      // Analyst standing statements.
      analyst: [
        "O fabricante definitivo da categoria de workstations de visualização enquanto a categoria existiu: um caso de manual, estudado desde então, de pioneira transformada em commodity pelo próprio padrão."
      ],
    },
  },
  // ---- sophos: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "sophos": {
    // Title: no subtitle, so the company name verbatim (listed so the report counts the record complete).
    name: "Sophos",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Nasceu em Oxford um ano antes de o primeiro vírus de PC se espalhar, e continua aqui com o próprio nome.",
    intro: "Jan Hruska e Peter Lammer fundaram a Sophos em Oxford em setembro de 1985, escrevendo detecção de vírus para o IBM PC antes que a maioria das pessoas tivesse visto um vírus. O nome é a palavra grega para sabedoria, escolhida para sinalizar uma postura guiada pela pesquisa, e não pelo produto.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "O negócio inicial era deliberadamente estreito: clientes corporativos e educacionais na Grã-Bretanha e na Europa, em grande parte com recursos próprios, numa época em que o antivírus era uma indústria artesanal de pesquisadores independentes trocando amostras. No início dos anos 1990, já protegia milhares de endpoints corporativos.",
      "Expandiu-se para a criptografia, depois para o unified threat management, e tornou-se um dos poucos fabricantes de segurança cuja linha de produtos cobre endpoint e rede sem que nenhuma das duas metades tenha sido comprada às pressas, tarde.",
      "A Sophos abriu capital na Bolsa de Londres em 2015 e teve o capital fechado pela Thoma Bravo em 2020, a mesma gestora que aparece em outros pontos desta linha do tempo como dona da LANDESK antes da Ivanti e da Ping Identity antes da ForgeRock. Desde então, adquiriu a Secureworks.",
      "O que a torna notável aqui é uma longevidade de um tipo específico. Quase toda empresa desta página que começou nos anos 1980 terminou dentro de outra. A Sophos tem quarenta anos, capital fechado e continua operando com o nome que os fundadores escolheram.",
    ],
    // Profile: complete copy of profiles/sophos.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "sophos",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          "company": "Sophos",
          "year": 1985,
          "place": "Oxford, Inglaterra",
          "founders": [
            "Jan Hruska",
            "Peter Lammer"
          ],
          "story": "Fundada em setembro, escrevendo detecção de vírus para o IBM PC antes que a maioria das pessoas tivesse encontrado um vírus; o primeiro vírus de PC se espalhou no ano seguinte. O nome é a palavra grega para sabedoria. Quarenta anos depois, a empresa continua com sede na mesma cidade, algo que quase nenhuma de suas contemporâneas pode dizer."
        }
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        {
          "year": 1985,
          "title": "Fundada em Oxford",
          "detail": "Dois fundadores, em grande parte com recursos próprios, vendendo para clientes corporativos e educacionais na Grã-Bretanha e na Europa."
        },
        {
          "year": 2010,
          "title": "A Apax assume uma participação majoritária",
          "detail": "O primeiro controle externo depois de vinte e cinco anos de independência."
        },
        {
          "year": 2015,
          "title": "Listagem na Bolsa de Londres",
          "detail": "Listada em Londres, e não em Nova York, o que por si só é incomum para uma empresa de segurança daquele porte."
        },
        {
          "year": 2020,
          "title": "Capital fechado pela Thoma Bravo",
          "detail": "Depois de cinco anos como empresa de capital aberto."
        },
        {
          "year": 2025,
          "title": "Secureworks",
          "detail": "Concluída em 3 de fevereiro, totalmente em dinheiro, por aproximadamente US$ 859 milhões, tirando a Secureworks da NASDAQ. Trouxe a plataforma Taegis e a Counter Threat Unit, uma equipe de pesquisa que acompanha mais de 150 grupos de ameaça, e fez da Sophos a maior provedora pure-play de managed detection and response."
        },
        {
          "year": 2025,
          "title": "Dezesseis posições consecutivas como líder",
          "detail": "Nomeada Leader no Gartner Magic Quadrant de proteção de endpoints pela décima sexta avaliação seguida, um período que cobre toda a transição da varredura por assinaturas para a detecção comportamental e para a resposta gerenciada."
        }
      ],
      // Products: names as the vendor writes them; descriptions translated.
      products: [
        {
          "name": "Sophos Endpoint and Intercept X",
          "what": "O produto central de proteção, com o trabalho contra ransomware e de prevenção de exploits que virou sua capacidade distintiva."
        },
        {
          "name": "Sophos MDR",
          "what": "Managed detection and response, hoje a maior parte da proposta e o motivo pelo qual a compra da Secureworks fez sentido."
        },
        {
          "name": "Taegis",
          "what": "A plataforma da Secureworks, mantida em vez de absorvida, e, desde setembro de 2025, entregue com o Sophos Endpoint incluído sem custo adicional, um jeito incomumente direto de demonstrar que uma aquisição beneficia os clientes que já existiam."
        },
        {
          "name": "Sophos Firewall, Switch, Email and ZTNA",
          "what": "Produtos de rede e de acesso gerenciados no mesmo console. A amplitude mira diretamente as organizações em que uma única pessoa cuida de toda a segurança."
        },
        {
          "name": "Sophos X-Ops",
          "what": "A organização de pesquisa combinada: inteligência de ameaças, análise de malware e pesquisa ofensiva publicadas abertamente, agora com a Counter Threat Unit."
        }
      ],
      // Innovations: title and detail translated.
      innovations: [
        {
          "title": "Atender a organização que não tem equipe de segurança",
          "detail": "O mercado intermediário sempre foi o problema mais difícil: as mesmas ameaças de uma grande empresa, e nenhuma das equipes. Um único console cobrindo endpoint, firewall, e-mail e acesso é uma decisão de produto derivada dessa restrição, e não de uma matriz de recursos."
        },
        {
          "title": "O comportamento do ransomware, e não suas assinaturas",
          "detail": "Detectar o ato da criptografia em massa de arquivos e revertê-lo trata do único modo de falha em que detectar depois do fato não vale nada. É uma boa ilustração de defesa baseada em comportamento resolvendo algo que as assinaturas, estruturalmente, não conseguem."
        },
        {
          "title": "A resposta gerenciada como produto, e não como venda adicional",
          "detail": "Vender os analistas, e não só o software, decorre do mesmo cliente: um alerta que ninguém está acordado para ler não é defesa. Comprar a maior provedora independente desse serviço fez dele o centro do negócio."
        },
        {
          "title": "Manter a plataforma adquirida",
          "detail": "A Taegis foi mantida e ampliada em vez de desligada, com o produto de endpoint da compradora acrescentado de graça. Nesta indústria, as aquisições terminam com mais frequência com a plataforma menor sendo aposentada discretamente."
        }
      ],
      // Markets paragraphs.
      markets: [
        "Mais de 600.000 clientes, com peso maior em organizações pequenas e médias e atendidos principalmente por parceiros e provedores de serviços gerenciados, e não diretamente: um modelo de distribuição que combina com o porte do cliente e é difícil de construir tarde.",
        "Concorre com os fabricantes de plataformas de endpoint acima dela e com os produtos embutidos no sistema operacional abaixo dela e, cada vez mais, em serviços gerenciados, onde a concorrência são tanto os analistas de outros provedores quanto o software de outros fabricantes."
      ],
      // Analyst standing statements.
      analyst: [
        "Dezesseis posições consecutivas como Leader no Gartner Magic Quadrant de proteção de endpoints, uma das mais longas sequências ininterruptas da categoria e a prova mais clara da longevidade que o verbete acima descreve.",
        "Seus resultados de detecção em testes independentes são consistentemente fortes, e o que distingue sua avaliação em geral não é a detecção bruta, mas a combinação de proteção e resposta gerenciada vendida a um preço que o mercado intermediário consegue bancar."
      ],
    },
  },
  // ---- teltec: pt-BR prose for the record (facts stay in the English record) ----
  "teltec": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Teltec Solutions - Florianópolis, e um prêmio da Cisco por treinamento",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Integradora brasileira de TIC de Santa Catarina, reconhecida duas vezes pela Cisco na América Latina.",
    intro: "A Teltec Solutions é uma integradora de tecnologia da informação e comunicação com sede em Florianópolis, Santa Catarina, e filiais em Brasília, Curitiba e Recife. A Cisco a nomeou vencedora latino-americana em 2013 e sua melhor parceira do setor público na região em 2016.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "O motivo declarado do primeiro prêmio é a parte que vale guardar. O diretor de engenharia da Cisco no Brasil o atribuiu ao investimento contínuo em treinamento e certificação e ao fato de a empresa ter construído uma cultura interna em torno disso: um fabricante premiando publicamente uma parceira não pela receita, mas por quantas de suas pessoas aprenderam o produto direito.",
      "É o argumento comercial a favor da certificação dito pela parte com menos incentivo para exagerá-lo, e é o mesmo argumento que este site faz do lado do instrutor.",
      "A localização também importa. Santa Catarina tem uma economia de tecnologia própria, e uma integradora que atende governo federal, educação e saúde a partir de Florianópolis, e não de São Paulo ou Brasília, é prova disso.",
      "A empresa não começou como Teltec. Nasceu em 18 de março de 1991 como Santec, fundada em Florianópolis por Glauco Brites Ramos com dois sócios, funcionando num depósito de móveis de um deles, com dois funcionários. A Santec participou da chegada da telefonia a 110 municípios de Santa Catarina e chegou a 180 pessoas, e, quando o setor foi privatizado em 1998, o negócio teve de se reinventar pela primeira vez. A pessoa jurídica atual só data de 2002, o que lembra que uma empresa brasileira costuma ser bem mais velha do que o CNPJ com que opera.",
    ],
  },
  // ---- versa: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "versa": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "Versa Networks - a independente do SASE",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Dois irmãos vindos da Riverstone e da Juniper construindo SASE unificado: uma das últimas grandes independentes num mercado consolidado.",
    intro: "Fundada em 2012 pelos irmãos Kumar e Apurva Mehta depois de oito anos à frente da série MX da Juniper e, antes disso, de cargos seniores na Riverstone Networks, onde eu trabalhei de 2000 a 2002. A Versa construiu rede e segurança como uma única pilha de software multi-tenant anos antes de o Gartner chamar a categoria de SASE, levantou cerca de US$ 316 milhões enquanto as rivais eram vendidas a Cisco, VMware, Aruba e Palo Alto, e continua independente.",
    // Accuracy note, claims kept at the same strength.
    note: "Nem eu nem a Red Education ministramos treinamentos de Versa. Esta página é história corporativa, verificada nas biografias de liderança da própria Versa e em fontes primárias. A ligação de linhagem é real: os dois fundadores construíram na Riverstone Networks (minha empregadora em Santa Clara, 2000-2002) antes dos anos na Juniper.",
    // Profile: complete copy of profiles/versa.ts; years, companies, founders, personal markers and hrefs untouched.
    profile: {
      // Same slug as the English profile.
      slug: "versa",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          "company": "Versa Networks",
          "year": 2012,
          "place": "Santa Clara, Califórnia",
          "founders": [
            "Kumar Mehta",
            "Apurva Mehta"
          ],
          "story": "Dois irmãos que tinham passado oito anos na Juniper construindo a série MX, Kumar como VP de Engenharia e Apurva como CTO e arquiteto-chefe da unidade de negócios de mobilidade, saíram para reconstruir a WAN como software. Os currículos de antes da Juniper refazem a própria linhagem deste site: os dois ocuparam cargos seniores na Riverstone Networks (onde eu trabalhei, em Santa Clara, de 2000 a 2002) e na Yago Systems, e Apurva tinha antes projetado software ATM na Centillion Networks, a primeira empresa de Bobby Johnson, fundador da Foundry. A aposta fundadora: funções de rede e de segurança como software multi-tenant sobre hardware de commodity."
        }
      ],
      // Timeline: same events, same order, same years; title, detail and provenance translated.
      timeline: [
        {
          "year": 2012,
          "title": "Fundada pelos irmãos Mehta",
          "detail": "Kumar e Apurva Mehta deixam a Juniper para abrir a Versa no Vale do Silício; a primeira rodada de investimento fecha em novembro de 2012, com Sequoia Capital e Mayfield entre os primeiros investidores."
        },
        {
          "year": 2015,
          "title": "FlexVNF, Director, Analytics",
          "detail": "Estreia a linha de produtos: funções virtualizadas de rede e de segurança em software sobre hardware de baixo custo, com gerenciamento centralizado; CPE virtual, SD-WAN e segurança de filial antes de o SASE ter nome."
        },
        {
          "year": 2016,
          "title": "Kelly Ahuja assume o comando",
          "detail": "O veterano da Cisco vira CEO, e os fundadores permanecem como CDO e CTO."
        },
        {
          "year": 2019,
          "title": "O Gartner cunha o SASE",
          "detail": "Quando o Gartner define o secure access service edge (rede e segurança convergidas como serviço em nuvem), a arquitetura de pilha única da Versa a posiciona como uma das candidatas naturais da categoria."
        },
        {
          "year": 2021,
          "title": "Rodada de US$ 84 milhões",
          "detail": "Junho de 2021: uma rodada liderada em conjunto pela Princeville Capital e pela RPS Ventures leva o total captado a US$ 196 milhões, enquanto a demanda por SASE acelera."
        },
        {
          "year": 2022,
          "title": "US$ 120 milhões e a maior nota do Gartner",
          "detail": "27 de outubro de 2022: uma rodada de US$ 120 milhões (com investidores como Sequoia, Mayfield e BlackRock) eleva o total captado a cerca de US$ 316 milhões em seis rodadas. No mesmo ano, o VOS da Versa recebe a maior nota no caso de uso Large Global WAN do Critical Capabilities for SD-WAN do Gartner.",
          "sourceNote": "TechCrunch; Tracxn; Gartner 2022 Critical Capabilities, conforme citado pela Versa."
        },
        {
          "year": 2024,
          "title": "VersaONE",
          "detail": "O portfólio converge na VersaONE Universal SASE Platform (SSE, SD-WAN e SD-LAN numa única pilha assistida por IA), enquanto a Versa continua de capital fechado e, segundo o CEO, voltada para um IPO, e não para uma venda."
        }
      ],
      // Products: names as the vendor writes them; descriptions translated.
      products: [
        {
          "name": "VOS (Versa Operating System)",
          "what": "A pilha de software única por baixo de tudo: roteamento, SD-WAN, firewall de nova geração e serviços de segurança, multi-tenant por projeto para provedores de serviço e empresas."
        },
        {
          "name": "VersaONE Universal SASE",
          "what": "A plataforma convergente (SSE com SWG, CASB, ZTNA e DLP, mais SD-WAN e SD-LAN), gerenciada por um único console e implantável em nuvem, on-premises ou nos dois."
        },
        {
          "name": "Versa Director and Analytics",
          "what": "Orquestração centralizada e visibilidade granular: a dupla de gerenciamento que ancora a arquitetura desde o lançamento de 2015."
        }
      ],
      // Innovations: title and detail translated.
      innovations: [
        {
          "title": "A aposta na pilha única",
          "detail": "Enquanto os concorrentes parafusavam segurança no SD-WAN ou SD-WAN na segurança, a Versa construiu desde o início um único sistema operacional que carregava os dois: a arquitetura que o SASE depois passou a exigir."
        },
        {
          "title": "Multi-tenancy de nível operadora",
          "detail": "Construída primeiro para provedores de serviço: uma plataforma hospedando muitos clientes, o que fez da Versa uma favorita das ofertas de SD-WAN gerenciado no mundo todo."
        },
        {
          "title": "A independência como estratégia",
          "detail": "A Viptela foi para a Cisco, a VeloCloud para a VMware, a Silver Peak para a Aruba, a CloudGenix para a Palo Alto; a Versa continuou independente durante a onda de consolidação, uma das últimas grandes pure-plays de seu mercado."
        }
      ],
      // Markets paragraphs.
      markets: [
        "A Versa concorre em SASE unificado contra os maiores nomes de redes e segurança: o mercado convergente de SD-WAN e SSE que a categoria do Gartner hoje define. Seus clientes incluem milhares de empresas e os provedores de serviço que a revendem como oferta gerenciada.",
        "Para este site, a Versa é também um marco de linhagem: o caminho de seus fundadores passa pela Riverstone Networks, a mesma empresa de Santa Clara onde eu trabalhei de 2000 a 2002, e volta até a Centillion, ligando a era do SASE à guerra dos switches dos anos 1990."
      ],
      // Analyst standing statements.
      analyst: [
        "O VOS da Versa recebeu a maior nota no caso de uso Large Global WAN do Critical Capabilities for SD-WAN de 2022 do Gartner.",
        "Captação total de cerca de US$ 316 milhões em seis rodadas (até outubro de 2022), com investidores como Sequoia Capital, Mayfield, BlackRock e Verizon Ventures, e com a liderança declarando publicamente preferir o caminho do IPO ao da aquisição."
      ],
      // Career cross-link: label translated, href untouched.
      careerLink: {
        "href": "/industry/chapters/riverstone",
        "label": "Os fundadores da Versa construíram na Riverstone Networks antes da Juniper: a minha página da Riverstone"
      },
    },
  },
  // ---- wdc: pt-BR prose for the record (facts stay in the English record) ----
  "wdc": {
    // Title: company verbatim, subtitle translated (the " - " separator is structural).
    name: "WDC Networks - a distribuidora que fabrica",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Distribuidora brasileira de tecnologia fundada em 2003, listada na B3, que trabalha com um modelo de tecnologia como serviço.",
    intro: "A WDC Networks distribui tecnologia no Brasil em banda larga por fibra, segurança eletrônica, telefonia, redes, cibersegurança, áudio e vídeo profissional, casa inteligente e energia solar, com cerca de sessenta marcas, e está listada na B3 desde 2021.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "Duas coisas a separam dos verbetes de distribuição que já estão nesta linha do tempo. Ela afirma industrializar no Brasil mais da metade de seus itens de maior volume, o que faz dela uma fabricante dentro de uma distribuidora, e não apenas um negócio de logística e crédito. E construiu sua oferta em torno da tecnologia como serviço, vendendo hardware e software por assinatura, e não como compra.",
      "As duas são respostas à mesma pressão. A função clássica de uma distribuidora (estoque, crédito, logística e alcance de canal) é a parte da cadeia mais fácil de comprimir, e as duas saídas são fabricar alguma coisa ou mudar o que está sendo comprado. A WDC fez as duas coisas.",
      "O simples fato de fabricar já é incomum o bastante para situá-la diante dos marcos: a foundry e a fábrica terceirizada existem para que as empresas não precisem ser donas da produção, e uma distribuidora que industrializa metade do próprio volume está remando contra uma corrente de quarenta anos.",
    ],
  },
};
