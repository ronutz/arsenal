// ============================================================================
// src/content/vendors/overlays/pt-BR/shard-7.ts
// ----------------------------------------------------------------------------
// pt-BR INDUSTRY OVERLAYS, SHARD 7 of 8 (translation pass planned 2026-10-25;
// see the round 2 TRANSLATION-PLAN). One shard per translator, so parallel
// work never edits the same file. Each entry is keyed by record slug and holds
// ONLY translated prose (PartnerVendorOverlay); facts stay in partners.ts and
// profiles/*.ts. Check with: npx tsx scripts/report-industry-translation.mts --strict
//
// Records assigned to this shard (~27,009 words):
// 3cx, alura, apple, bbn, blue-coat-packeteer, blue-eye, bridge-
// communications, cobra, compaq, comptia, connection-br, cylk, dimension-data,
// eds, elgin, etek-novared, f5, freeradius, global-knowledge, grafana-labs,
// hcl, inlearn, lotus, nagios, netgear, nowcy, oi, okta, penso, prometric,
// proteus, qos-training, quad9, riverstone, sage-networks, solarwinds, spacex,
// tandem, tecban, toshiba, tufin, udemy, unisys, usrobotics, world-zone, yssy
//
//
//
//
//
//
//
//
//
// Translated 2026-10-26 (pt-BR machine-draft state: written with AI, reviewed
// gradually; never labelled reviewed). Profile objects are complete copies of
// the English profiles with only the prose fields replaced, so every year,
// company, founder, personal marker and href is the English one. Quotations
// that the English presents as a source's words, source titles and filing
// names stay verbatim; product and company names keep their spelling.
// ============================================================================

import type { PartnerVendorOverlay } from "@/content/vendors/localized";

/** Translated prose for this shard's records, keyed by slug. */
export const SHARD_7: Record<string, PartnerVendorOverlay> = {
  // ---- 3cx: pt-BR prose for the record (facts stay in the English record) ----
  "3cx": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "3CX - o primeiro comprometimento de supply chain em cascata",
    // Card line (also the meta description) and intro paragraph.
    tagline: "O download pessoal, feito por um funcionário, de um app de trading já descontinuado de outro fabricante virou a porta de entrada para os servidores de build de um produto de telefonia com doze milhões de usuários.",
    intro: "A 3CX é uma desenvolvedora cipriota de sistemas telefônicos em software, fundada em 2005, cujo aplicativo desktop assinado foi usado em março de 2023 para distribuir malware depois de um comprometimento que começou em outro fabricante.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "A 3CX é uma empresa de software cipriota, fundada em Nicósia em 2005, cujo produto trocou a central telefônica do armário por software num servidor. Vende só pelo canal e, em 2023, contava mais de seiscentas mil organizações clientes e doze milhões de usuários. Ela está neste catálogo pelo que aconteceu em março daquele ano, que acrescentou à taxonomia de comprometimento de fornecedores uma rota de que os outros verbetes não tinham precisado.",
      "Em março de 2023, o próprio aplicativo desktop assinado da empresa, entregue pelo próprio mecanismo de atualização dela, começou a levar malware aos clientes. Até aí, nada que não se tivesse visto antes. O inédito foi outra coisa: quando os responsáveis pela resposta ao incidente rastrearam a intrusão de volta para dentro da empresa, descobriram que ela tinha começado no produto de outro fabricante. Em 2022, um funcionário tinha baixado, num computador pessoal, o instalador de um aplicativo de trading de outra empresa. O aplicativo tinha sido descontinuado em 2020, mas continuava disponível no site do fabricante, e a cópia estava trojanizada, e assinada com um certificado ainda válido. Ela abriu a máquina do funcionário, as credenciais corporativas que estavam nela foram roubadas e, dali, os invasores chegaram aos ambientes de build das versões para Windows e para Mac do produto da 3CX. O MITRE registra o caso como o primeiro relato público de um comprometimento de supply chain que desencadeou outro.",
      "Três detalhes valem mais do que a sequência. O primeiro é o produto descontinuado. Ninguém no fabricante cuidava dele, e ele continuava no site com o nome e a assinatura da empresa. Um produto descontinuado não é uma porta fechada; é uma porta sem vigia, e o argumento do verbete da Siemens sobre a base instalada que não pode ser atualizada tem aqui um gêmeo em software: o download que ninguém pensou em tirar do ar.",
      "O segundo é que o alerta existia. Um ano antes de o incidente da 3CX vir à tona, o Google tinha publicado que o site da empresa de trading fora comprometido pelos mesmos operadores. A informação era pública. A ligação entre um alerta sobre um fabricante e a exposição de outro não foi feita, porque nada no processo de nenhuma das duas empresas foi desenhado para fazê-la. É a lição do verbete da Nortel, de que uma investigação encerrada não é uma ameaça eliminada, estendida para além da fronteira de uma empresa.",
      "O terceiro é a assinatura. Tanto o instalador trojanizado quanto as versões envenenadas da 3CX estavam legitimamente assinados. Uma assinatura de código certifica que um build saiu do pipeline de onde diz ter saído; não diz nada sobre se o comprometido foi o próprio pipeline. O verbete do XZ Utils faz o mesmo argumento sobre a distância entre o que é revisado e o que é compilado. Aqui, essa distância estava assinada.",
      "Para a taxonomia, esta é uma sétima rota, e ela difere em natureza das seis anteriores: não é um caminho de entrada, mas um caminho de passagem. As rotas se somam. Um fabricante de software de trading virou a entrada para um fabricante de telefonia, cujos clientes eram o alvo, e nenhum dos dois fabricantes era o objetivo. Quando o fabricante intermediário é só um corredor, a pergunta sobre se confiamos nele deixa de ser, de todo, uma pergunta sobre esse fabricante.",
    ],
  },
  // ---- alura: pt-BR prose for the record (facts stay in the English record) ----
  "alura": {
    // Parent note (official.parent.note), added 26/10/2026 with the parents apply; name, slug and year stay English facts.
    parentNote: "A Alura faz parte do Grupo Alun, nome que seu grupo de educação adotou em 2025, ao lado de FIAP, PM3 e StartSe.",
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Alura - uma sala de 36 metros quadrados com seis computadores que virou a maior escola de tecnologia do Brasil",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Dois irmãos que queriam ser professores abriram a Caelum em 2004 no quarteirão onde moravam; a plataforma online de 2011 virou Alura em 2013 e, em 2025, o grupo que eles construíram, o Grupo Alun, reunia FIAP, PM3 e StartSe.",
    intro: "A Alura é a maior escola online de tecnologia do Brasil, nascida em 2011 como a plataforma online da Caelum, a escola presencial de São Paulo que os irmãos Paulo e Guilherme Silveira fundaram em 2004; o grupo que ela encabeça, o Grupo Alun, inclui FIAP, PM3 e StartSe.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "Paulo Silveira queria ser professor. Formado em ciência da computação pela USP, estava no meio de um mestrado em algoritmos quando, em 2004, ele e o irmão Guilherme abriram uma escola em vez disso, no quarteirão onde moravam em São Paulo: uma sala de trinta e seis metros quadrados com seis computadores de tubo, chamada Caelum, céu em latim. Ensinava os assuntos historicamente difíceis, Java, métodos ágeis, open source, para quem já sabia programar, um mercado mais estreito e mais difícil do que o de ensinar iniciantes, e fazia isso presencialmente, com cinco pessoas, durante sete anos.",
      "A virada veio em 2011, quando a banda larga brasileira era lenta o bastante para os fundadores se preocuparem com a qualidade da experiência, e eles construíram a plataforma online mesmo assim; em 2013 ela ganhou o nome Alura e investimento externo, e a escola presencial passou a ser a parte menor da própria criação. Em 2023, a plataforma tinha passado de meio milhão de alunos, e a comunidade no Discord, de cem mil pessoas. O conteúdo sempre foi prática, e não teoria (nas palavras do próprio site, a escola precisa derrubar seus muros e ir para fora), o mesmo instinto dos centros de treinamento dos fabricantes, aplicado a tecnologias abertas sem fabricante para certificá-las.",
      "Depois, ela comprou a faculdade. Em 2022, com o fundo de private equity Crescera e o grupo australiano Seek por trás, a Alura assumiu o controle da FIAP, uma faculdade de tecnologia de São Paulo com dez mil alunos, num negócio que deveria dobrar o faturamento combinado para 420 milhões de reais; o fundador disse que o velho sonho de ser professor tinha, de certa forma, se realizado. A escola de gestão de produto PM3 e a StartSe, a empresa de educação executiva das missões ao Vale do Silício, que tem verbete próprio, entraram no mesmo grupo, e em 2025 o ecossistema ganhou um nome, Grupo Alun, com Silveira como chief vision officer e Adriano Almeida, na empresa desde 2008, no comando da Alura.",
      "O arco corre no sentido oposto ao da Pluralsight. Aquela empresa começou com instrutores em salas de aula, virou uma biblioteca e terminou como garantia de um credor. Esta começou com dois aspirantes a professor numa sala, virou uma biblioteca e comprou para si uma faculdade. O que as duas têm em comum é a sala: nos dois casos, toda a estrutura posterior se apoia num punhado de pessoas capazes de explicar com clareza uma coisa difícil, e a diferença entre os finais está em quem manteve o controle do que construiu.",
    ],
  },
  // ---- apple: pt-BR prose for the record (facts stay in the English record) ----
  "apple": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Apple",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Perdeu feio o primeiro round do mercado de computadores pessoais e ganhou todos os rounds seguintes.",
    intro: "A Apple Computer Company foi fundada em 1º de abril de 1976 por Steve Jobs, Steve Wozniak e Ronald Wayne, em Cupertino, para vender um computador montado à mão que Wozniak tinha projetado. Jobs e Wozniak ficaram com 45% cada um, e Wayne com 10%. Onze dias depois, Wayne revendeu sua parte por US$ 800, recebendo mais tarde outros US$ 1.500 para encerrar o assunto, uma decisão chamada com frequência de a mais cara da história das startups, e que ele tomou porque tinha família e não podia carregar o risco.",
    // Body: 8 paragraph(s), same order as the English.
    body: [
      "O capital inicial foi uma Kombi e uma calculadora programável. Jobs vendeu a perua, Wozniak vendeu sua HP-65, e o Apple I saiu como uma placa de circuito nua a US$ 666,66: sem gabinete, sem teclado, sem monitor, porque uma placa totalmente montada já era em si a inovação, quando a alternativa era um kit. Foram vendidas cerca de duzentas unidades, e o pedido que importou veio de Paul Terrell, da Byte Shop, que levou cinquenta.",
      "Wozniak tinha mostrado a máquina no Homebrew Computer Club, e esse detalhe liga este verbete a outro desta linha do tempo. Steve Leininger, o engenheiro que a Tandy contratou para projetar o TRS-80, também era membro do Homebrew. Duas das três máquinas do que a revista Byte chamou de Trindade de 1977 saíram da mesma reunião de hobbistas no Vale do Silício, o que é um candidato razoável ao título de sala mais produtiva da história da indústria.",
      "Mike Markkula, um veterano da Intel, entrou com US$ 250.000 e com a supervisão adulta, e a empresa foi constituída em janeiro de 1977, quando Wayne já tinha saído. O Apple II chegou em abril daquele ano, com gabinete, teclado, gráficos coloridos e slots de expansão, e é a máquina que fez da computação pessoal um mercado, e não um hobby.",
      "E então ela perdeu. O verbete da Tandy nesta linha do tempo registra que, em 1980, a Tandy despachou três vezes mais computadores do que a Apple, porque a Tandy tinha sete mil lojas e a Apple tinha revendedores. A vantagem da Apple era mais lenta e mais duradoura: slots de expansão abertos permitiam que outras empresas fabricassem placas para ela, e o VisiCalc, a primeira planilha eletrônica, saiu primeiro para o Apple II. Uma máquina que outras pessoas podem ampliar e para a qual podem escrever software acumula motivos para ser comprada. Uma máquina vendida numa prateleira conveniente acumula apenas vendas.",
      "A abertura de capital de 1980 levantou US$ 110 milhões. O Lisa, em 1983, custava US$ 9.995 e fracassou. O Macintosh, em 1984, era a ideia certa lançada com pouca potência. Jobs recrutou John Sculley na Pepsi com uma frase que sobreviveu aos dois produtos (se ele queria vender água com açúcar pelo resto da vida ou vir mudar o mundo) e, em setembro de 1985, Sculley o tirou da empresa. Wozniak já tinha saído em fevereiro para virar professor de escola.",
      "A década interessante é a ruim. A Apple passou os anos 1990 demonstrando os limites de um sistema fechado num mercado que tinha se padronizado no sistema de outra empresa e, em 1997, sua participação mundial estava em torno de três por cento. Enquanto isso, Jobs tinha fundado a NeXT e comprado a divisão de computação gráfica da Lucasfilm, que virou a Pixar.",
      "Então a volta aconteceu por meio de uma aquisição, e é a de maiores consequências desta página: a Apple comprou a NeXT, o sistema operacional da NeXT virou a base do macOS, e o fundador da NeXT virou o CEO da Apple. Uma empresa adquiriu um fornecedor e saiu disso com um novo líder, um novo kernel e uma nova década. Todo iPhone roda um descendente do software escrito pela empresa que o fundador expulso da Apple construiu enquanto estava fora.",
      "O que vem depois está bem documentado em outros lugares e não precisa ser recontado aqui. A parte que vale guardar numa página sobre linhagem é a forma: a Apple é a única empresa desta linha do tempo que foi ultrapassada, quase morreu, comprou a empresa que seu fundador exilado tinha construído e voltou para se tornar a primeira empresa americana a valer três trilhões de dólares. Todas as outras histórias de recuperação aqui terminam numa aquisição por outra empresa.",
    ],
    // Acquisitions: index-aligned with the English list (year, name, price and founder stay English).
    acquisitions: [
      // [0] NeXT (1997)
      { what: "A empresa de Steve Jobs, fundada depois de sua saída forçada da Apple em 1985. O sistema operacional orientado a objetos da NeXT era a tecnologia de que a Apple precisava e que não conseguiria construir a tempo.", became: "O Mac OS X e todos os seus descendentes: macOS, iOS, watchOS, tvOS. A aquisição também trouxe Jobs de volta, e ele se tornou CEO.", sourceNote: "O preço da compra foi omitido aqui porque as fontes lidas para este registro não o informavam e os números citados com frequência variam." },
      // [1] Lucasfilm's Computer Graphics Division (by Jobs personally, not Apple) (1986)
      { what: "Comprada por Jobs quando ele estava fora da Apple e rebatizada de Pixar. Aparece aqui porque faz parte da mesma linhagem de decisões, e não porque a Apple a tenha comprado.", became: "Pixar Animation Studios, depois adquirida pela Disney." },
    ],
  },
  // ---- bbn: pt-BR prose for the record (facts stay in the English record) ----
  "bbn": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "BBN - a contratada que construiu a primeira rede",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Uma empresa de pesquisa ganhou o contrato da ARPANET, e o packet switch virou produto porque alguém tinha de fabricá-lo.",
    intro: "A Bolt Beranek and Newman começou na acústica (a empresa era contratada para fazer auditórios soarem bem) e acabou construindo a máquina que tornou real a comutação de pacotes. Ganhar em 1968 o contrato do Interface Message Processor da ARPANET transformou uma ideia financiada em hardware que alguém precisava entregar, dar suporte e consertar, um problema diferente de provar que a ideia funciona.",
    // Body: 5 paragraph(s), same order as the English.
    body: [
      "A BBN não nasceu para construir redes. Começou quando Richard Bolt, que dirigia o laboratório de acústica do MIT, ganhou em 1946 uma encomenda para assessorar a acústica da sede das Nações Unidas, percebeu ao ver as plantas em 1948 que aquilo não era trabalho para um homem só e chamou Leo Beranek para assumi-lo com ele. Robert Newman entrou em 1950, o nome mudou, e a empresa foi constituída em 1953 como consultoria de acústica.",
      "Entrou na computação em 1957 com uma premissa deliberadamente vaga, a de que a empresa precisava estar nesse negócio para se tornar conhecida, e a vagueza acabou sendo a estratégia. J.C.R. Licklider chegou naquela primavera. A primeira máquina veio em 1958, o primeiro PDP-1 da DEC em 1960, e a chegada do hardware foi o que permitiu à BBN contratar John McCarthy e Marvin Minsky. Por volta de 1960, o lado de computação já era tão substancial quanto o de acústica, e a empresa tinha construído um dos primeiros sistemas de time-sharing.",
      "Em julho de 1968, a ARPA abriu uma concorrência para um dispositivo chamado Interface Message Processor. A BBN venceu em janeiro de 1969, contra concorrentes muito maiores, com uma equipe formada por Frank Heart, Dave Walden, Bernie Cosell, Severo Ornstein, Robert Kahn e Will Crowther, e construiu quatro máquinas por quase um milhão de dólares entre setembro e dezembro daquele ano. Esses IMPs foram a primeira geração do que a indústria hoje chama de routers.",
      "O detalhe famoso merece ser contado com precisão justamente porque costuma ser contado como piada. A primeira mensagem entre as máquinas da UCLA e do Stanford Research Institute foi 'LO': o pesquisador estava digitando LOGIN e o host receptor travou no meio. A primeira transmissão de uma rede foi uma palavra pela metade causada por uma falha, uma introdução ao campo mais fiel do que qualquer sucesso teria sido.",
      "A leitura que importa aqui é sobre a forma institucional. A BBN era uma consultoria contratada para construir algo, e não uma empresa de produtos defendendo um mercado, e é exatamente por isso que pôde aceitar o trabalho: não tinha base instalada a proteger nem linha de negócio ameaçada pela novidade. Quase toda peça fundamental da rede inicial veio de uma organização com essa característica (um laboratório, uma universidade, uma contratada) e quase nenhuma das empresas que então vendiam equipamento de comunicação.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A BBN Technologies foi adquirida pela Raytheon em 2009 e continua como RTX BBN Technologies, uma unidade da RTX apresentada como uma página do site da controladora, e não em um site próprio.",
  },
  // ---- blue-coat-packeteer: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "blue-coat-packeteer": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Blue Coat & Packeteer - as empresas do ponto de passagem obrigatório",
    // Card line (also the meta description) and intro paragraph.
    tagline: "A guinada da CacheFlow fez do proxy uma plataforma de segurança; o PacketShaper criou o traffic shaping. Juntas, são a pré-história da categoria SSE.",
    intro: "Duas empresas de 1996 que responderam à mesma pergunta (o que acontece no ponto de passagem obrigatório, aquele por onde todo o tráfego precisa passar) para o conteúdo e para a banda. A Blue Coat (nascida CacheFlow) fez do proxy inline o ponto de aplicação de políticas da web corporativa, inspeção SSL incluída; o PacketShaper da Packeteer ensinou à WAN que o tráfego tem identidade. Unidas em 2008 e levadas pela Symantec até a Broadcom, sua arquitetura é a que todo secure web gateway em nuvem roda hoje.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "O perfil cobre o lendário IPO da CacheFlow, a guinada para Blue Coat em 2002, a criação de categoria do PacketShaper, a aquisição de 2008, os anos de private equity e a passagem da Symantec para a Broadcom.",
    ],
    // Profile: complete copy of profiles/blue-coat-packeteer.ts; years, companies, founders, personal markers and hrefs come from the English.
    profile: {
      // Same slug as the English profile.
      slug: "blue-coat-packeteer",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          company: "CacheFlow (Blue Coat Systems from 2002)",
          year: 1996,
          place: "Sunnyvale, Califórnia",
          founders: ["Michael Malcolm"],
          story: "A CacheFlow construía appliances que guardavam a web mais perto de quem a lia, e surfou a bolha até um dos primeiros dias de pregão mais espetaculares de 1999. Quando o mercado de cache murchou junto com a bolha, a empresa executou uma das guinadas mais limpas da época: a mesma caixa, no mesmo lugar, entre os usuários e a internet, revendida como controle de SEGURANÇA. Rebatizado em 2002 como Blue Coat, o ProxySG virou o web proxy corporativo por excelência: autenticação, filtragem e, mais tarde, inspeção SSL, o ponto de passagem por onde o tráfego web corporativo aprendeu a transitar.",
        },
        {
          company: "Packeteer",
          year: 1996,
          place: "Cupertino, Califórnia",
          founders: ["Brett Galloway and colleagues"],
          story: "O PacketShaper da Packeteer respondia a uma pergunta que os routers da época não sabiam responder: não SE o tráfego passa, mas QUANTO, DE QUÊ e QUEM vai primeiro. Classificando os fluxos por aplicação e impondo taxas por classe, criou do zero a categoria de traffic shaping (o árbitro da WAN numa época em que uma única transferência FTP podia sufocar uma filial) e deu à indústria o vocabulário do controle de banda com consciência de aplicação.",
        },
      ],
      // Timeline: same events, same order, same years and personal markers; prose translated.
      timeline: [
        { year: 1999, title: "O IPO da CacheFlow", detail: "Novembro de 1999: uma das lendárias disparadas de primeiro dia da era pontocom, o cache web precificado como o futuro, meses antes de o futuro mudar de ideia." },
        { year: 2002, title: "A guinada para Blue Coat", detail: "O cache vira proxy, que vira segurança: rebatizada, a Blue Coat vende a mesma posição topológica, inline, entre os usuários e a web, como aplicação de políticas. A linha ProxySG define o secure web gateway corporativo por uma década." },
        { year: 2008, title: "A Packeteer chega", detail: "A Blue Coat adquire a Packeteer (cerca de US$ 268 milhões), juntando o controle de conteúdo do proxy ao controle de banda do PacketShaper: visibilidade e controle da WAN num só portfólio.", sourceNote: "Valor do negócio conforme o registro público." },
        { year: 2011, title: "Os anos de private equity", detail: "A Thoma Bravo fecha o capital da Blue Coat (cerca de US$ 1,3 bilhão, 2011); a Bain a compra (cerca de US$ 2,4 bilhões, 2015). A franquia de inspeção SSL cresce em silêncio fora da bolsa." },
        { year: 2016, title: "Symantec", detail: "Junho de 2016: a Symantec adquire a Blue Coat por cerca de US$ 4,65 bilhões e põe Greg Clark, da Blue Coat, como CEO da Symantec: na prática, a empresa de proxy assume o controle de quem a comprou.", sourceNote: "Valor do negócio conforme o registro público." },
        { year: 2019, title: "Para dentro da Broadcom", detail: "O negócio corporativo da Symantec, linhagem do ProxySG incluída, é vendido à Broadcom (cerca de US$ 10,7 bilhões). Os descendentes da caixa de cache de 1996 agora aplicam políticas web sob a terceira bandeira corporativa." },
      ],
      // Products: names as the vendor writes them (generic descriptors localised); descriptions translated.
      products: [
        { name: "ProxySG", what: "O secure web gateway corporativo: autenticação, categorização e inspeção SSL no ponto de passagem que a Blue Coat tornou padrão." },
        { name: "PacketShaper", what: "O traffic shaper com consciência de aplicação que criou sua categoria: visibilidade e controle de taxa por aplicação na WAN." },
        { name: "Appliances SSL Visibility", what: "A linha dedicada a decifrar e repassar o tráfego que fez de 'inspect the encrypted' (inspecionar o que é cifrado) uma arquitetura, e não um improviso." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "O proxy como plataforma de segurança", detail: "A Blue Coat provou que o forward proxy inline era o ponto natural de aplicação de políticas da era da web: o ancestral arquitetônico de onde descende toda nuvem SSE e SWG destas páginas." },
        { title: "Controle de banda com consciência de aplicação", detail: "O modelo de classificar e depois moldar do PacketShaper ensinou à indústria que o tráfego tem identidade, o raciocínio que QoS, o direcionamento de SD-WAN e os firewalls com consciência de aplicação herdam." },
      ],
      // Markets paragraphs, same count.
      markets: [
        "A linhagem segue dentro do portfólio corporativo Symantec da Broadcom e, conceitualmente, em toda parte: todo proxy em nuvem que inspeciona TLS em escala está jogando a jogada da Blue Coat.",
      ],
      // Analyst statements, same count.
      analyst: [
        "Um verbete consolidado porque as duas empresas responderam à mesma pergunta (o que acontece no ponto de passagem obrigatório, aquele por onde todo o tráfego precisa passar) para o conteúdo e para a banda; juntas, são a pré-história da categoria SSE que os capítulos de Zscaler e Netskope deste site ensinam.",
      ],
    },
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A Symantec concluiu a aquisição da Blue Coat em 1º de agosto de 2016, oito anos depois de a Blue Coat ter incorporado a Packeteer em uma fusão concluída em 6 de junho de 2008.",
  },
  // ---- blue-eye: pt-BR prose for the record (facts stay in the English record) ----
  "blue-eye": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Blue Eye",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Parceira citada pela Zscaler no Brasil.",
    intro: "Uma parceira brasileira do lado da Zscaler. Vale registrá-la ao lado das distribuidoras, e não abaixo delas: numa categoria de assinatura, a relação com o parceiro muitas vezes sobrevive ao acordo de distribuição, porque a conversa da renovação é com quem opera o serviço.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "Mantém uma prática ativa de soluções Zscaler. Vale registrá-la ao lado das distribuidoras, e não abaixo delas: numa categoria de assinatura, a relação com o parceiro muitas vezes sobrevive ao acordo de distribuição, porque a conversa da renovação é com quem opera o serviço.",
    ],
  },
  // ---- bridge-communications: pt-BR prose for the record (facts stay in the English record) ----
  "bridge-communications": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Bridge Communications - a caixa entre as redes",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Fabricou o equipamento que unia redes incompatíveis e depois se fundiu com a 3Com em 1987.",
    intro: "A Bridge Communications fabricava equipamento de interconexão de redes, os dispositivos que ligavam redes locais entre si e aos hosts, nos anos em que um prédio podia facilmente abrigar várias redes sem nenhum meio de alcançar umas às outras. Fundiu-se com a 3Com em 1987, que é o destino habitual de uma empresa bem-sucedida nessa janela.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "A Bridge Communications construía servidores de terminal e equipamento de interconexão no começo dos anos 1980, na janela em que as redes locais se multiplicavam mais depressa do que alguém conseguia ligá-las umas às outras. Foi uma das empresas de Ethernet que chegaram a uma oferta pública inicial, o que importou mais do que parece: o balanço reforçado por um IPO foi o que permitiu às empresas de Ethernet cortar preços agressivamente enquanto os fabricantes de token ring não conseguiam.",
      "Em 1987, ela foi incorporada à 3Com, na mesma consolidação em que a Tandem Computers adquiriu a Ungermann-Bass e a Interlan foi absorvida pela Micom. Esse agrupamento de datas é o fato que merece registro: as empresas independentes de redes locais não sumiram uma de cada vez ao longo de uma década; foram absorvidas num intervalo de mais ou menos dezoito meses umas das outras, porque o mercado se consolidou num ritmo ditado por preços que caíam mais depressa do que qualquer uma delas conseguia cortar custos.",
      "Para a 3Com, a fusão comprou capacidade de interconexão de redes exatamente no momento em que o centro de valor da indústria se deslocava das placas e dos hubs para as caixas que uniam redes. Se comprou o suficiente é outra questão, e a resposta veio depois, quando o roteamento virou um mercado definido pela Cisco, e não um mercado em que a 3Com competia.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A Bridge Communications fundiu-se com a 3Com em setembro de 1987.",
  },
  // ---- cobra: pt-BR prose for the record (facts stay in the English record) ----
  "cobra": {
    // Parent note (official.parent.note), added 26/10/2026 with the parents apply; name, slug and year stay English facts.
    parentNote: "Hoje BB Tecnologia e Serviços (BBTS), controlada integralmente pelo Banco do Brasil S.A.",
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Cobra - o computador que o país construiu, e o sistema operacional que mandaram parar",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Computadores e Sistemas Brasileiros, fundada em 1974; hoje BB Tecnologia e Servicos.",
    intro: "A Cobra, Computadores e Sistemas Brasileiros, foi fundada no Rio de Janeiro em 18 de julho de 1974 e se tornou a peça central da tentativa brasileira de construir uma indústria de computação própria. Sobrevive como BB Tecnologia e Servicos, dentro do grupo Banco do Brasil.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "Seu produto mais notável foi um software. O SOX era um sistema operacional compatível com UNIX escrito do zero no Brasil no fim dos anos 1980, sob a liderança de Ivan da Costa Marques, e obteve reconhecimento formal de conformidade da X/Open, o que fez dele, por um breve período, uma resposta brasileira a uma pergunta que a indústria inteira fazia.",
      "O que aconteceu em seguida está registrado num depoimento em primeira pessoa de Jorge Monteiro Fernandes, que trabalhou na Cobra de 1987 a 1990, apresentado como artigo no simpósio de história da computação SHIALC em 2012. A Academia de Ciências da Rússia procurou a Cobra para portar o SOX para uma máquina RISC que tinha construído, porque os controles de fluxo de tecnologia dos Estados Unidos lhe negavam acesso ao UNIX. Um acordo foi assinado, e três desenvolvedores russos vieram trabalhar na Cobra. Propôs-se então uma joint venture, entre a Cobra, a Academia Russa e uma empresa chinesa, para vender o SOX internacionalmente, e ela foi aprovada pelo próprio órgão do Itamaraty e pelo serviço nacional de inteligência do Brasil.",
      "Segundo o relato de Fernandes, o cônsul dos Estados Unidos disse ao presidente da Cobra, durante um almoço, que seu governo se opunha à joint venture e que ela deveria ser abandonada, ou o governo agiria por outros meios. O assunto chegou ao presidente da República, e a decisão foi não confrontar os Estados Unidos. Fernandes registra a própria resposta ao general que lhe comunicou a decisão, a de que aquilo era um recuo e uma entrega de soberania, e a resposta do general: que tinha consciência disso, mas o Brasil não tinha a Sexta Frota.",
      "A Cobra parou de desenvolver tecnologia própria e virou revendedora de produtos estrangeiros para o Banco do Brasil. O mesmo depoimento observa que o Cobra 1.000 era, ele próprio, um produto americano vendido no Brasil sob licença, cada venda exigindo autorização do Departamento de Estado, a descrição mais precisa que existe do que a autonomia tecnológica significava na prática.",
    ],
  },
  // ---- compaq: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "compaq": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Compaq - o clone que virou rei",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Três ex-engenheiros da Texas Instruments rabiscaram um portátil num jogo americano, recriaram o BIOS da IBM em clean room e construíram a empresa que mais depressa chegou ao bilhão de dólares; depois compraram a DEC e se fundiram à HP.",
    intro: "A Compaq legitimou a indústria dos compatíveis com PC: seu BIOS clean-room de 1982 fez de 'IBM compatible' (compatível com IBM) uma categoria legal de produto, seu Deskpro 386 chegou ao 386 da Intel antes da IBM e, em meados dos anos 1990, ela era a maior fabricante de PCs do mundo. As aquisições da Tandem e da DEC fizeram dela, por um breve período, a empresa que fazia de tudo na indústria, até a fusão com a HP em 2002 fechar o arco.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "Três gerentes da Texas Instruments puseram mil dólares cada um, captaram dois milhões e meio com Ben Rosen e pediram a um designer industrial aposentado que desenhasse a máquina deles num jogo americano de papel, numa casa de tortas de Houston. A orientação que ele recebeu foi que ela deveria parecer um Osborne 1, mas com menos cara de sobra do exército.",
      "O nome diz o que era o produto: Compatibility and Quality, compatibilidade e qualidade. Não um computador melhor: o mesmo computador, legalmente. O Portable saiu em novembro de 1982, com vinte e oito libras e um BIOS obtido por engenharia reversa, e a IBM não teve resposta comparável até fevereiro de 1984. O primeiro ano completo trouxe 53.000 unidades e 111 milhões de dólares, as maiores vendas de primeiro ano da história empresarial americana, e a empresa chegou à Fortune 500 e ao bilhão de faturamento mais depressa do que qualquer outra.",
      "Nada disso seria possível sem a decisão descrita no verbete da IBM. A compatibilidade só podia ser comprada porque a arquitetura tinha sido publicada, e o BIOS clean-room transformou \"compatível com IBM\" de descrição em categoria legal de produto, em que qualquer um podia entrar.",
      "O Deskpro 386, em 1986, é o momento em que a plataforma deixou de ser da IBM. Foi a primeira troca de processador na linha PC que a IBM não iniciou; a máquina 386 da própria IBM chegou sete meses depois, quando a Compaq já era a fornecedora preferida e, no julgamento da época, a IBM tinha perdido sua imagem de liderança técnica. Um clone tinha assumido a liderança técnica do padrão que clonava.",
      "Depois, a mesma lógica veio atrás da Compaq. A Dell vendia direto e montava sob encomenda, com uma vantagem de custo de dez a quinze por cento sobre um canal de revendas, e tomou o mercado americano em 1999. A Compaq tinha vencido por ser a mesma coisa mais barata; perdeu para algo que era a mesma coisa mais barata ainda. Esse padrão não poupa a empresa que o usou.",
      "Um detalhe humano merece entrar no registro. Quando Canion foi afastado depois do primeiro prejuízo da empresa, em 1991, cento e cinquenta funcionários fizeram um protesto improvisado com cartazes que diziam We love you, Rod (nós te amamos, Rod) e compraram um anúncio de jornal para dizer o mesmo. A Compaq ainda engoliria a Tandem e a DEC antes de desaparecer dentro da HP, de modo que três empresas terminaram dentro de uma só linhagem; mas os cartazes são a parte que não aparece em balanço nenhum.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "Adquirida pela Hewlett-Packard em 2002 e aposentada como marca até 2010. Ela própria tinha absorvido a Tandem em 1997 e a DEC em 1998, de modo que três empresas terminaram dentro de uma só linhagem.",
    // Successor link label (the URL stays in the English record).
    successorLabel: "HP, que se fundiu com a Compaq em 2002",
    // Profile: complete copy of profiles/compaq.ts; years, companies, founders, personal markers and hrefs come from the English.
    profile: {
      // Same slug as the English profile.
      slug: "compaq",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          company: "Compaq",
          year: 1982,
          place: "Houston, Texas",
          founders: ["Rod Canion","Jim Harris","Bill Murto"],
          story: "Três gerentes da Texas Instruments rabiscaram um computador portátil num jogo americano da House of Pies em 1982 e construíram o clone de maiores consequências da história. A verdadeira invenção da Compaq foi jurídica, não técnica: uma engenharia reversa em clean room do BIOS do IBM PC (engenheiros que nunca tinham visto o código da IBM escrevendo a partir de uma especificação preparada por quem tinha visto), que fez de 'IBM compatible' (compatível com IBM) uma categoria lícita de produto. O Portable faturou um recorde de US$ 111 milhões no primeiro ano, e a indústria dos compatíveis que a Compaq legitimou acabou ficando maior do que a própria IBM.",
        },
      ],
      // Timeline: same events, same order, same years and personal markers; prose translated.
      timeline: [
        { year: 1983, title: "O Portable, e o recorde", detail: "O 'luggable' (portátil de carregar como mala) de 28 libras sai totalmente compatível com IBM; US$ 111 milhões de receita no primeiro ano, o começo mais rápido da história empresarial americana até então." },
        { year: 1986, title: "Deskpro 386: passando a IBM", detail: "Setembro de 1986: a Compaq lança o 80386 da Intel antes da IBM, o momento em que a liderança do padrão PC passa visivelmente do criador do padrão para os seus clonadores." },
        { year: 1988, title: "EISA contra Micro Channel", detail: "A Compaq reúne a 'Gang of Nine' (o grupo dos nove) em torno do barramento aberto EISA contra o MCA proprietário da IBM, e vence; agora é a indústria dos compatíveis, e não a IBM, quem governa a plataforma." },
        { year: 1993, title: "ProLiant, e a guerra de preços", detail: "A ofensiva de preços de Eckhard Pfeiffer em 1992 e a linha de servidores ProLiant levam a Compaq ao posto de maior fabricante de PCs do mundo em meados da década; os servidores x86 começam a ocupar o espaço onde viviam os minicomputadores." },
        { year: 1998, title: "Engolindo a Tandem e a DEC", detail: "A linha NonStop da Tandem (1997, cerca de US$ 3 bilhões) e depois a Digital Equipment (cerca de US$ 9,6 bilhões, 1998, o maior negócio de computação até então) fazem da Compaq uma empresa de tudo da noite para o dia; digerir a DEC se mostra mais difícil do que comprá-la. A linhagem absorvida é contada na página da DEC desta seção." },
        { year: 2002, title: "A fusão com a HP", detail: "3 de maio de 2002: a fusão de cerca de US$ 25 bilhões com a HP se conclui depois da amarga disputa de procurações entre Fiorina e Walter Hewlett; a empresa do jogo americano termina dentro da empresa da garagem, e a marca Compaq vai se apagando ao longo da década.", sourceNote: "Anunciada em 3 de setembro de 2001; fechamento conforme o registro do negócio." },
      ],
      // Products: names as the vendor writes them (generic descriptors localised); descriptions translated.
      products: [
        { name: "Compaq Portable", what: "O portátil de carregar que fundou a indústria dos compatíveis, e a empresa, num só produto." },
        { name: "Linha Deskpro", what: "O porta-estandarte do desktop corporativo, que várias vezes chegou ao próximo chip da Intel antes da IBM." },
        { name: "Servidores ProLiant", what: "A franquia de servidores x86 que sobreviveu a todas as marcas acima dela, e ainda é o nome dos servidores da HPE hoje." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "O BIOS clean-room", detail: "A engenharia jurídica da Compaq fez do PC uma plataforma aberta na prática: todo compatível, e talvez todo o mundo de hardware commodity em que rodam as ferramentas deste site, descende dele." },
        { title: "Governança da plataforma por coalizão", detail: "O EISA provou que os clones podiam padronizar melhor do que o dono do padrão: consórcios da indústria como arma competitiva." },
      ],
      // Markets paragraphs, same count.
      markets: [
        "O DNA da Compaq sobrevive na linha ProLiant da HPE e na herança de consumo da HP; seu legado mais profundo é a própria plataforma PC aberta, arrancada da IBM sem nenhum processo perdido.",
      ],
      // Analyst statements, same count.
      analyst: [
        "O compatível de referência das avaliações por duas décadas: primeiro como o clone premium, depois como o rei do volume que o modelo de venda direta acabou superando em preço.",
      ],
    },
  },
  // ---- comptia: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "comptia": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "CompTIA",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Todo o seu valor estava em não pertencer a ninguém, e em 2024 ela foi comprada.",
    intro: "A CompTIA começou em 1982 como Association of Better Computer Dealers, a ABCD, uma entidade de classe de revendedores de computadores. Essa origem explica tudo sobre ela. Os revendedores vendiam hardware e software de vários fabricantes ao mesmo tempo, e o que precisavam não era o selo de mais um fabricante, mas um padrão que não pertencesse a nenhum deles: referências comuns para compatibilidade, para a prática de vendas e para saber se um técnico de fato conhecia o ofício.",
    // Body: 8 paragraph(s), same order as the English.
    body: [
      "A neutralidade em relação a fabricantes não foi uma posição de marketing adotada depois. Foi a condição de fundação, e distinguiu a associação dos programas proprietários dos fabricantes desde o primeiro dia. O nome mudou para Computing Technology Industry Association até o fim dos anos 1980, à medida que o escopo se ampliava para além das revendas, rumo à educação e ao desenvolvimento da força de trabalho.",
      "A certificação A+ chegou no começo dos anos 1990, e vale explicitar a ideia por trás dela, porque hoje é fácil tomá-la como óbvia: uma credencial que diz que você sabe fazer o trabalho, e não que sabe operar os produtos de uma empresa. Network+, Security+ e as demais seguiram a mesma lógica. Mais de 3,5 milhões de certificações já foram concedidas.",
      "Leia isso ao lado do verbete da Cisco nesta linha do tempo e aparecem as duas metades de um argumento. CCNA, CCNP e CCIE, da Cisco, criaram a escada de competências definida pelo fabricante, e todo fabricante deste site com uma trilha de certificação trabalha a partir desse modelo, inclusive os quatro cujo treinamento oficial o autor deste site ministra. A CompTIA é a outra resposta à mesma pergunta: a de que a competência de um técnico é uma propriedade do técnico, e não de uma relação com um fornecedor. Os dois modelos continuam de pé, e a maioria dos engenheiros na ativa tem credenciais dos dois tipos.",
      "Há aqui um detalhe que importa a qualquer pessoa que ensina. O CTT+, a credencial Certified Technical Trainer, era uma certificação neutra quanto a fabricantes para o próprio ato de ensinar, adquirida do Chauncey Institute e construída com a IT Training Association e a Computer Education Management Association. Foi aposentada em 31 de outubro de 2023. Quem já a tinha continua certificado. Não há substituta direta, o que significa que a única credencial amplamente reconhecida para ensinar tecnologia, independentemente do que se ensinava, deixou de existir.",
      "E então vem a parte que não está resolvida. Em novembro de 2024, a H.I.G. Capital e a Thoma Bravo fecharam acordo para adquirir a marca CompTIA e seu negócio de certificação e treinamento. A transação foi concluída no começo de 2025 e dividiu a organização em duas: o negócio de certificação passa a operar com fins lucrativos, sob controle de private equity, enquanto a associação sem fins lucrativos 501(c)(6), baseada em membros, se separa e continua. Terminaram quarenta e dois anos de operação sem fins lucrativos.",
      "A posição da empresa é que nada de relevante muda: as certificações continuam acreditadas pela ANSI e neutras quanto a fabricantes, e os novos donos trazem recursos para expandir. Profissionais da própria comunidade de instrutores da CompTIA estavam menos seguros, e a objeção deles é específica, e não sentimental: o ativo comprado é a neutralidade, e a neutralidade é a única coisa que não se pode comprar sem levantar a pergunta sobre se ela sobreviveu à compra. Um deles disse confiar mais numa certificadora administrada como entidade sem fins lucrativos, porque entidades sem fins lucrativos respondem a uma missão e empresas respondem a um número.",
      "Isso não está resolvido, porque ainda não é resolvível. A garantia está registrada, e a dúvida também, e a única coisa honesta a dizer é que a resposta chega ao longo de anos, conforme os objetivos dos exames continuem descrevendo o trabalho ou passem a descrever o produto de alguém.",
      "Vale notar quem é o comprador: a Thoma Bravo agora aparece em quatro verbetes desta linha do tempo, como dona da Sophos, como dona da LANDESK antes de ela virar Ivanti, fechando duas vezes o capital da Ping Identity e combinando-a com a ForgeRock, e agora aqui. Numa página sobre linhagem, o nome recorrente nem é de um fabricante.",
    ],
    // Profile: complete copy of profiles/comptia.ts; years, companies, founders, personal markers and hrefs come from the English.
    profile: {
      // Same slug as the English profile.
      slug: "comptia",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
      ],
      // Timeline: same events, same order, same years and personal markers; prose translated.
      timeline: [
        { year: 1982, title: "Cinco revendas", detail: "A associação foi formada por representantes de cinco revendas de microcomputadores, para estimular a colaboração entre os fabricantes e quem vendia seus produtos. Um grupo tão pequeno que se propõe a escrever padrões para uma indústria ou é presunçoso ou chegou cedo, e ele tinha chegado cedo." },
        { year: 1993, title: "Um fabricante ajudou a construir o padrão neutro", detail: "O problema dos revendedores era que os clientes precisavam de gente capaz de instalar e consertar o que lhes tinha sido vendido, e esse treinamento não existia. A Compaq Computer se associou à entidade para desenvolver uma certificação para técnicos de suporte, e o resultado foi a A+. A primeira credencial que não pertencia a nenhum fabricante foi desenvolvida em conjunto com um, o que é menos contraditório do que parece, já que um fabricante que vende por revendas precisa mais que essas revendas tenham equipes competentes do que de mais um selo próprio." },
      ],
      // Products: names as the vendor writes them (generic descriptors localised); descriptions translated.
      products: [
        { name: "A+", what: "Fundamentos de suporte e, por três décadas, a primeira certificação que um número enorme de técnicos chegou a ter. Sua importância está em descrever um trabalho, e não uma linha de produtos." },
        { name: "Network+ e Security+", what: "A mesma lógica aplicada aos níveis acima. A Security+, em particular, virou um filtro de contratação nas compras do governo dos Estados Unidos, o que deu a uma credencial neutra quanto a fabricantes algo próximo de força regulatória." },
        { name: "O programa de pesquisa", what: "Dezenas de estudos setoriais por ano, a parte da produção de uma entidade de classe que ninguém compra e todo mundo cita." },
        { name: "Creating IT Futures", what: "O braço filantrópico, que treina e certifica pessoas que entram na indústria vindas de fora dela: adultos de baixa renda e militares voltando à vida civil. Vale listá-lo entre os produtos porque, para as pessoas que ele alcança, ele é o produto." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "A neutralidade como consequência, não como postura", detail: "Cinco revendedores, cada um vendendo equipamentos de vários fabricantes, precisam de um técnico que saiba trabalhar em todos eles. A neutralidade não foi adotada como princípio; ela decorreu de quem estava na sala. É o tipo mais forte de neutralidade, porque não depende de ninguém continuar acreditando nela, e é exatamente o que muda quando a sala muda." },
        { title: "A validade de três anos, que é o modelo de negócio", detail: "As certificações vencem três anos depois de obtidas, e renovar significa pagar de novo e, sem créditos de educação continuada, fazer o exame de novo. Isso converte uma compra única numa assinatura mantida por milhões de pessoas que precisam dela para continuar empregadas. É defensável pelo mérito (o conteúdo de fato envelhece) e é também, exatamente, o que torna uma certificadora um ativo atraente para um comprador financeiro. A pergunta que o verbete acima deixa em aberto tem uma forma comercial, além da ética." },
        { title: "O problema de autoria mais difícil", detail: "Escrever objetivos a partir da implementação de um fornecedor é um exercício de documentação; escrevê-los a partir de uma tarefa executada em equipamentos de uma dúzia de fornecedores não é. A credencial neutra custa mais para manter, envelhece mais depressa e exige que alguém continue decidindo em que o trabalho consiste agora, justamente o trabalho mais fácil de parar de fazer sem que ninguém perceba." },
      ],
      // Markets paragraphs, same count.
      markets: [
        "Pessoas que entram e progridem em funções de suporte técnico, redes e segurança, em mais de cento e vinte países, com vários milhões de certificações concedidas. Quem compra costuma ser o candidato ou o orçamento de treinamento do empregador, e não um departamento de compras, uma relação comercial diferente de quase tudo o mais nesta linha do tempo.",
        "O lado de entidade de classe da organização agora continua separado, como GTIA, atendendo às empresas de canal para as quais a ABCD original foi criada. O negócio de certificação e a entidade de membros que o criou deixaram, desde 2025, de ser a mesma organização.",
      ],
      // Analyst statements, same count.
      analyst: [
        "Suas certificações são acreditadas segundo normas internacionais e citadas nos requisitos de força de trabalho do governo federal dos Estados Unidos, uma forma de validação externa mais forte do que a cobertura de analistas, e mais difícil de perder.",
        "A medida que vai resolver a questão em aberto é mais estreita do que o debate em torno dela, e já é observável: a economia da renovação. Se os caminhos de educação continuada se ampliarem e a renovação continuar barata, o argumento da missão se sustentou. Se a renovação virar a principal linha de receita e os caminhos se estreitarem, a objeção estava certa. Qualquer pessoa que tenha a credencial pode verificar isso todo ano, o que é um teste melhor do que qualquer garantia.",
      ],
    },
  },
  // ---- connection-br: pt-BR prose for the record (facts stay in the English record) ----
  "connection-br": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Connection",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Parceira Fortinet de nível Expert no Brasil.",
    intro: "Integradora e provedora de segurança gerenciada de Porto Alegre, listada no nível Expert da Fortinet em SASE, SD-WAN e redes de campus.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "Registrada como Connection Conectividade e Integracao de Sistemas, ela tem três especializações nomeadas, e não uma só, e a combinação é coerente: SASE para o usuário remoto, SD-WAN para a filial e redes seguras na LAN. É um único parceiro cobrindo todo o caminho que um pacote percorre de uma pessoa até uma aplicação, um conjunto de exames mais difícil de manter coberto por uma equipe do que qualquer uma dessas linhas isoladamente.",
      "O Rio Grande do Sul ocupa mais espaço neste catálogo do que o tamanho do estado sugere, e não por acaso: Porto Alegre tem uma base universitária técnica antiga e profunda, e uma casa de canal que consegue recrutar localmente não precisa competir com os salários de São Paulo para manter seus engenheiros certificados.",
    ],
  },
  // ---- cylk: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "cylk": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "CYLK - integração de segurança, São Paulo",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Uma integradora brasileira de segurança: o ofício de fazer os produtos dos outros funcionarem juntos no ambiente de outra pessoa.",
    intro: "A CYLK foi fundada em junho de 2010 como empresa de integração de sistemas e serviços gerenciados para redes, data center e segurança, e pertence ao Grupo IHC. Ela não fabrica produtos; faz com que funcionem. Hoje é especializada em cibersegurança, governança, risco e compliance, privacidade, conscientização, testes de invasão e avaliações para empresas brasileiras.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "É a terceira empresa do Grupo IHC, depois da HighCast (2003) e da inLearn (2008). O grupo cresceu com cada empresa criando a seguinte a partir da demanda que a anterior tinha gerado, e não por aquisições.",
      "O trabalho da integradora é aquele de que trata boa parte do acervo de Prática deste site: chegar a um ambiente que outra pessoa projetou, com fabricantes que supõem, cada um, ser o único presente. A CYLK também está no mesmo grupo que a InLearn, o Grupo IHC, fundado em 2003, cuja primeira empresa foi a HighCast, de modo que o negócio de integração e o negócio de treinamento cresceram sob o mesmo teto.",
    ],
    // Profile: complete copy of profiles/cylk.ts; years, companies, founders, personal markers and hrefs come from the English.
    profile: {
      // Same slug as the English profile.
      slug: "cylk",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          company: "CYLK",
          year: 2010,
          place: "São Paulo, Brasil",
          founders: [],
          story: "A CYLK foi fundada em junho de 2010 como a terceira empresa do Grupo IHC, depois da HighCast em 2003 e da inLearn em 2008, para fazer integração de sistemas e serviços gerenciados para redes, data center e segurança. A forma do grupo é a parte interessante: ele não cresceu comprando empresas, mas com cada uma criando a seguinte a partir da demanda que já tinha gerado. Uma prática de consultoria produz perguntas que uma empresa de treinamento sabe responder, e as duas produzem ambientes que alguém precisa integrar. Nenhum nome de fundador é publicado, e nenhum é fornecido aqui.",
          sourceNote: "Junho de 2010 aparece com as mesmas palavras no Baguete e no Resinfo em março de 2015: \"Fundada em junho de 2010, a CYLK, membro do Grupo IHC\". A fundação do grupo em 2003 é confirmada pelo Baguete em maio de 2016. Os anos de fundação de cada empresa, HighCast e inLearn, não estão em nenhum desses dois artigos e vêm das fontes já existentes do verbete.",
        },
      ],
      // Timeline: same events, same order, same years and personal markers; prose translated.
      timeline: [
        { year: 2010, personal: true, title: "Rodolfo entra no ano de fundação", detail: "Rodolfo Nützmann trabalhou dentro da CYLK de 2010 a 2011, o primeiro período completo de existência da empresa. Uma integradora no ano de estreia é um lugar particular para trabalhar: as práticas ainda não estão escritas, e o que um engenheiro novo aprende é como as decisões são tomadas, e não o que foi decidido.", sourceNote: "Datas do próprio registro de Rodolfo Nützmann, 11/08/2026. Não derivadas de nenhuma fonte pública." },
        { year: 2014, title: "Capital, um presidente e uma meta", detail: "Em julho de 2014, a CYLK recebeu um aporte de capital não divulgado e contratou Carlos Carnevali Jr. como presidente, com a missão de abrir novos mercados verticais em saúde, varejo e serviços, expandir pela América Latina e dobrar o tamanho da empresa em dois anos. É o momento em que um grupo que tinha crescido por geração interna passou a ser administrado contra um número externo.", sourceNote: "Baguete, 21 de julho de 2014. Nem o valor nem o investidor foram divulgados. O repórter especulou que o investidor poderia ser Carlos Carnevali pai, presidente da Cisco Brasil até 2007; essa é uma inferência do jornalista e não é registrada aqui como fato." },
        { year: 2015, title: "Certificações, que é o que uma integradora vende", detail: "Em março de 2015, a empresa era descrita como detentora da ISO/IEC 20000, de gestão de serviços de TI, e de uma certificação Juniper. Para um negócio cujo produto é fazer o equipamento dos outros funcionar junto, uma certificação de fabricante não é um selo, mas a permissão para estar na sala, e uma norma de gestão de serviços é o argumento de que o trabalho ainda vai estar rodando no ano seguinte." },
      ],
    },
  },
  // ---- dimension-data: pt-BR prose for the record (facts stay in the English record) ----
  "dimension-data": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Dimension Data - integração em escala continental",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Uma integradora de sistemas que cresceu além da região de origem e foi absorvida por uma operadora japonesa.",
    intro: "A Dimension Data construiu um grande negócio de integração de redes e serviços gerenciados, e seu arco é o mesmo que esta linha do tempo registra repetidamente a partir de pontos de partida diferentes: uma integradora cresce além da região que a produziu, torna-se atraente para uma operadora que quer capacidade de entrega e é adquirida.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A Dimension Data foi fundada em Joanesburgo em 1983 por Keith McLachlan, Werner Sievers, Jeremy Ord, Peter Neale e Kevin Hamilton, e abriu capital na Bolsa de Valores de Joanesburgo em 15 de julho de 1987. Seu movimento decisivo veio em 1991, quando se tornou a distribuidora oficial da Cisco Systems na África do Sul, uma posição assumida no momento em que a interconexão de redes estava virando o centro da computação corporativa, e não depois.",
      "É o contraexemplo mais claro deste catálogo à suposição de que as integradoras globais de tecnologia vêm dos Estados Unidos ou da Europa. A partir de um país então sob sanções e em grande parte isolado dos mercados internacionais, ela chegou a quase cinquenta países e a cerca de 5,8 bilhões de dólares de receita em 2010, comprando seu caminho pelas regiões por meio de aquisições.",
      "A Nippon Telegraph and Telephone a adquiriu em 2010 por 3,2 bilhões de dólares e, a partir de 1º de julho de 2019, tudo o que ficava fora do Oriente Médio e da África foi incorporado à NTT Ltd, com a marca desaparecendo dentro da NTT DATA até 2024. É o fim habitual de uma grande integradora: elas são compradas por operadoras, porque uma operadora que vende conectividade quer a empresa que decide o que o cliente conecta.",
      "Vale guardar essa trajetória porque ela se repete em todos os mercados, inclusive no Brasil. Uma integradora local constrói cedo uma relação com um fabricante, cresce sobre essa relação, expande-se regionalmente e acaba adquirida por algo maior que quer a lista de clientes. O nome na nota fiscal muda; os engenheiros, em geral, não.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A Nippon Telegraph and Telephone concluiu sua oferta em dinheiro pela Dimension Data Holdings em 25 de outubro de 2010, tornando-a uma subsidiária da NTT, e dimensiondata.com hoje redireciona para a NTT DATA.",
  },
  // ---- eds: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "eds": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Electronic Data Systems (EDS)",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Inventou a ideia de que uma empresa podia entregar toda a sua computação a outra.",
    intro: "Ross Perot fundou a Electronic Data Systems em 1962, em Dallas, sobre uma proposta que mal existia como mercado: a de que as organizações prefeririam pagar a outra empresa para operar seu processamento de dados a operá-lo elas mesmas. Todo serviço gerenciado e todo contrato de outsourcing desde então descende dessa aposta.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "A EDS construiu sistemas que viraram infraestrutura invisível, entre eles as redes que permitiam aos caixas eletrônicos aceitar e entregar dinheiro. Seu negócio nunca foi o hardware; era operar a coisa em nome de outra empresa, sob contrato, a um preço combinado de antemão.",
      "Ela está nesta linha do tempo porque o modelo de serviços que criou é o que todo fabricante do resto desta página vende hoje junto com seus produtos, e porque um negócio de treinamento conduzido por instrutor é ele próprio um descendente da mesma ideia: a de que a especialização pode ser contratada como serviço, em vez de empregada.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "Adquirida pela Hewlett-Packard por quase US$ 14 bilhões, negócio concluído em agosto de 2008, e incorporada à HP Enterprise Services.",
    // Successor link label (the URL stays in the English record).
    successorLabel: "DXC Technology",
    // Profile: complete copy of profiles/eds.ts; years, companies, founders, personal markers and hrefs come from the English.
    profile: {
      // Same slug as the English profile.
      slug: "eds",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          company: "Electronic Data Systems",
          year: 1962,
          place: "Dallas, Texas",
          founders: ["Ross Perot"],
          story: "Constituída em 27 de junho com US$ 1.000 emprestados da esposa, Margot, numa sala com uma mesa no quinto andar do prédio da Blue Cross Blue Shield, a US$ 100 por mês. Perot tinha entrado na IBM em 1957, depois da Academia Naval e de quatro anos no mar, e em janeiro de 1962 já tinha batido a cota anual de vendas que a empresa lhe atribuíra. Ele propôs que a IBM vendesse a gestão do processamento de dados, e não só as máquinas. A IBM não se interessou, então ele saiu e fez isso por conta própria.",
        },
      ],
      // Timeline: same events, same order, same years and personal markers; prose translated.
      timeline: [
        { year: 1962, title: "Fundada, e desde o início com pouco capital", detail: "Em vez de comprar computadores, a EDS alugava tempo em máquinas que outras organizações já tinham comprado e não usavam por inteiro. Isso mantinha a necessidade de capital perto de zero e fez a empresa ser nacional muito cedo, porque as máquinas emprestadas estavam espalhadas pelo país." },
        { year: 1963, title: "Os primeiros contratos de longo prazo", detail: "A Frito-Lay, por meio de Herman Lay, e o processamento de dados de seguros para a Mercantile Security Life: o começo de uma linha que, em 1990, fazia da EDS a maior processadora de dados de seguros dos Estados Unidos." },
        { year: 1965, title: "Medicare", detail: "Os novos programas federais de saúde geravam papelada numa escala para a qual ninguém tinha sistemas. A EDS construiu o processamento de sinistros. Em 1968, Medicare e Medicaid respondiam por cerca de um quarto da receita; em 1977, os sinistros de saúde eram quase quarenta por cento dela." },
        { year: 1968, title: "Abertura de capital", detail: "Sete por cento da empresa vendidos, e as receitas desse período praticamente dobravam de um ano para o outro." },
        { year: 1979, title: "Irã", detail: "Um contrato de três anos e US$ 41 milhões com a administração da previdência social do Irã terminou com o país seis meses atrasado nos pagamentos e a EDS suspendendo o trabalho. Dois executivos, Bill Gaylord e Paul Chiapparone, foram presos, com fiança fixada em US$ 12 milhões. Com os canais diplomáticos fechados, Perot montou uma equipe privada de resgate sob o comando de um coronel reformado das Boinas Verdes, Arthur Simons, que ele já tinha empregado antes na busca por militares americanos desaparecidos no Vietnã. Os dois saíram.", sourceNote: "Valor do contrato, a disputa de pagamento, as prisões e o valor da fiança conforme a Encyclopedia.com e a FundingUniverse, que dão um relato substancialmente igual." },
        { year: 1984, title: "General Motors, vinte e dois anos depois, no mesmo dia", detail: "A GM comprou a EDS em 27 de junho de 1984 por US$ 2,5 bilhões, a maior soma paga até então por uma empresa de serviços de computação, exatamente vinte e dois anos depois da constituição da empresa. Os termos obrigavam a GM a manter a EDS como entidade separada, com ações de desempenho próprias, uma concessão incomum e um sinal do quanto a vendida valia. Vieram disputas sobre autonomia, e com elas a saída de Perot." },
        { year: 1996, title: "Independente de novo", detail: "A GM desmembrou a EDS e logo se tornou uma de suas maiores clientes, o argumento do outsourcing expresso como ato societário." },
        { year: 2008, title: "Hewlett-Packard", detail: "Anunciada em 13 de maio, por US$ 13,9 bilhões, e concluída em 26 de agosto. A EDS tinha registrado US$ 22,1 bilhões de receita e 136.000 funcionários no ano anterior." },
        { year: 2017, title: "Para dentro da DXC", detail: "Fundiu-se com a Computer Sciences Corporation em 3 de abril para formar a DXC Technology, encerrando o nome depois de cinquenta e cinco anos." },
      ],
      // Products: names as the vendor writes them (generic descriptors localised); descriptions translated.
      products: [
        { name: "Facilities management", what: "O serviço original e a palavra original para ele: a EDS operava o seu processamento de dados em seu nome, pessoal e máquinas incluídos, num contrato longo. Tudo o que a indústria depois chamou de outsourcing descende disso." },
        { name: "Processamento de sinistros de saúde", what: "A administração do Medicare e do Medicaid para programas estaduais, e o processamento de seguros comerciais: sem glamour, enorme e, por uma década, a maior parte do negócio." },
        { name: "Redes bancárias e de transações", what: "Entre os sistemas que permitiam a caixas eletrônicos funcionar entre instituições diferentes, o tipo de infraestrutura que ninguém nota até que ela pare." },
        { name: "Integração de sistemas e aplicações", what: "O portfólio posterior, competindo com as consultorias à medida que o mercado amadurecia e a distinção entre operar sistemas e construí-los se desfazia." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "O contrato de longo prazo a preço fixo", detail: "A indústria vendia projetos curtos; a EDS vendia compromissos de vários anos a preço fixo. Isso transferia do cliente para o fornecedor o risco de operar os sistemas, exatamente o que tornava a oferta atraente e exatamente o que a tornava difícil de precificar. Todo contrato de serviço gerenciado desde então tem sido uma discussão sobre essa mesma transferência." },
        { title: "Vender a operação, e não o equipamento", detail: "A proposta era que a computação de uma empresa era o negócio principal de outra, e não o dela. Essa ideia é hoje tão comum que os provedores de nuvem a dão como certa, e era estranha o bastante em 1962 para que a maior empresa de computadores do mundo se recusasse a segui-la." },
        { title: "Alugar capacidade em vez de possuí-la", detail: "Comprar tempo nas máquinas subutilizadas de outras organizações é a mesma lógica econômica que depois vendeu a virtualização e, em seguida, a nuvem: capacidade é cara para possuir e barata para compartilhar, e alguém precisa ser quem a agrega." },
        { title: "O governo como cliente âncora", detail: "Ganhar a administração de novos programas públicos deu à empresa escala, previsibilidade e uma referência que nenhum cliente comercial poderia igualar. É a estratégia por trás de muitíssimas das empresas de serviços que vieram depois, e ela amarra o destino de um negócio à legislação, e não aos mercados." },
      ],
      // Markets paragraphs, same count.
      markets: [
        "Grandes corporações e governo, nessa ordem no início, e depois cada vez mais o contrário. Administração de saúde, seguros, bancos e, por fim, o setor automotivo sob a GM; em 2007, era um negócio de US$ 22 bilhões com 136.000 funcionários no mundo todo.",
        "Seus concorrentes passaram a ser as integradoras de sistemas e as consultorias e, por fim, os provedores de nuvem, que vendem a mesma proposta sem a mão de obra.",
      ],
      // Analyst statements, same count.
      analyst: [
        "Avaliada em seu tempo como a empresa de outsourcing por definição, e a referência contra a qual toda empresa de serviços posterior foi medida, uma posição que nenhuma entidade sucessora ocupou desde então.",
        "O veredito mais longo é que o modelo sobreviveu à empresa. A EDS inventou o arranjo, foi comprada por um cliente, voltou a ser independente, foi absorvida por um fabricante de hardware e fundida numa sucessora que já não leva o nome, enquanto a prática que ela criou virou o jeito padrão de grandes organizações comprarem computação.",
      ],
    },
  },
  // ---- elgin: pt-BR prose for the record (facts stay in the English record) ----
  "elgin": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Elgin - o ponto de venda, e tudo o que se liga a ele",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Fabricante brasileira de equipamentos de automação comercial; registrada como dona da Bematech.",
    intro: "A Elgin fabrica o equipamento de que é feito um balcão de loja brasileiro (impressoras térmicas, leitores de código de barras, computadores de ponto de venda, terminais de autoatendimento e gavetas de dinheiro) numa linha que vai de um único caixa a uma rede de varejo.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "Ela está nesta linha do tempo pelo que possui, e não só pelo que fabrica: a enciclopédia em português registra a Elgin como dona da Bematech, o que reúne num só lugar dois nomes da automação comercial brasileira. O verbete da Bematech aqui observa que a TOTVS também lista a Bematech entre suas subsidiárias, e nenhuma das duas afirmações é resolvida neste site.",
      "Vale entender a categoria em si, porque ela é invisível até falhar. O hardware de ponto de venda é comprado uma vez, instalado por alguém que não vai voltar, deve funcionar por uma década e fica ligado a um regime fiscal que muda por legislação, e não por ciclo de versões. Pouquíssimo equipamento corporativo tem essa combinação de restrições.",
    ],
  },
  // ---- etek-novared: pt-BR prose for the record (facts stay in the English record) ----
  "etek-novared": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Etek NovaRed - uma empresa brasileira controlada de Miami, depois de Santiago",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Empresa brasileira de segurança da informação, joint venture chileno-americana a partir de 2012 e de controle inteiramente chileno a partir de 2021.",
    intro: "A Etek NovaRed Brasil foi uma das maiores provedoras brasileiras de segurança da informação integrada, com mais de trinta anos de atividade e serviços que iam de educação e conscientização a consultoria e segurança gerenciada. A partir de 2012, foi uma joint venture entre a NovaRed, do Chile, e a Etek International Corporation, de Miami; em agosto de 2021, a NovaRed comprou a outra metade e o nome Etek saiu de cena.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "O caminho societário é a razão de ela estar aqui, porque é uma forma que o resto desta linha do tempo não contém. As empresas brasileiras de segurança destas páginas foram compradas por uma fabricante de aviões, uma multinacional de segurança física, uma consolidadora de private equity e uma concorrente, todas elas brasileiras ou do hemisfério norte. Esta foi controlada metade a partir de Miami e depois inteiramente a partir de Santiago.",
      "Isso importa por uma razão que vai além da novidade. Um comprador regional compra por razões regionais: as mesmas línguas, reguladores vizinhos, clientes que operam em vários dos mesmos países e um centro de operações de segurança num país que pode vigiar ambientes em outro. O grupo resultante opera três desses centros, um deles no Brasil.",
      "É também um lembrete de que a tecnologia latino-americana tem um mercado interno que as reportagens feitas de fora da região raramente descrevem. O comprador não foi um consolidador global chegando; foi um vizinho.",
    ],
    // Parent note (PRIME ruling 1, 26/10/2026): what the buy-out changed.
    parentNote: "O nome Etek saiu com a compra da participação do sócio: a empresa brasileira hoje opera como NovaRed, a partir do escritório do grupo em São Paulo.",
  },
  // ---- f5: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "f5": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "F5",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Batizada com o nome de um tornado, passou trinta anos subindo na pilha, das portas às aplicações.",
    intro: "A F5 Labs foi fundada em Seattle em 1996 por Jeff Hussey e Michael Almquist. O nome vem da escala Fujita: F5 é a categoria mais forte de tornado, o tipo de nome que uma startup de redes dava a si mesma nos anos 1990.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "O perfil abaixo cobre a fundação em 1996, a franquia BIG-IP, a reescrita full-proxy do TMOS, as aquisições a partir da NGINX e a virada para a segurança de aplicações.",
      "Uma consequência merece ser dita a quem está aprendendo a plataforma. Como as iRules rodam TCL por conexão no data path, boa parte do conhecimento de F5 é específico, e não geral: os conceitos se transferem, mas a fluência não. É por isso que a trilha de certificação é longa, e por isso que os profissionais costumam ser profundos em F5, em vez de abrangentes em vários application delivery controllers.",
    ],
    // Profile: complete copy of profiles/f5.ts; years, companies, founders, personal markers and hrefs come from the English.
    profile: {
      // Same slug as the English profile.
      slug: "f5",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          company: "F5 Labs (later F5 Networks, today F5, Inc.)",
          year: 1996,
          place: "Seattle, Washington",
          founders: ["Jeffrey Hussey"],
          story: "Fundada em Seattle em 1996 como F5 Labs, a empresa tirou o nome do topo da escala Fujita de tornados (o ano em que o filme Twister lotou os cinemas), um emblema apropriado para um produto feito para ficar na frente de uma tempestade de tráfego web. A aposta era que a web nascente precisaria de máquinas cujo único trabalho fosse distribuir carga entre servidores, e o load balancer BIG/ip que veio em 1997 transformou essa aposta numa categoria. Jeffrey Hussey conduziu a empresa até o IPO de 1999; John McAdam a liderou em seguida na era em que o load balancing amadureceu e virou application delivery.",
        },
      ],
      // Timeline: same events, same order, same years and personal markers; prose translated.
      timeline: [
        { year: 1996, title: "A F5 Labs abre em Seattle", detail: "A empresa é fundada para resolver um problema novíssimo: sites caindo sob o peso da própria popularidade. O nome vem da categoria mais forte de tornado: o tráfego como clima.", sourceNote: "Prospecto Form 424B4 da F5 Networks de 4 de junho de 1999, notas às demonstrações financeiras: a empresa, antes F5 Labs, Inc., foi constituída em 26 de fevereiro de 1996 no estado de Washington, e suas contas correm a partir dessa data como início; o endereço da capa é 200 First Avenue West, Seattle. O EDGAR registra a mudança de nome de F5 Labs em março de 1999. O prospecto não traz a história da categoria de tornado por trás do nome." },
        { year: 1997, title: "O BIG/ip é lançado", detail: "O primeiro produto, o load balancer BIG/ip, distribui o tráfego entre servidores e monitora a saúde deles. A grafia muda ao longo dos anos; a franquia, nunca: o BIG-IP continua sendo o coração da F5 três décadas depois." },
        { year: 1999, title: "IPO na janela pontocom", detail: "Junho de 1999: a F5 estreia na NASDAQ como FFIV, na mesma onda que levou à bolsa os nomes de redes da época. John McAdam assume como CEO em 2000 e fica no cargo durante a maior parte de duas décadas." },
        { year: 2004, title: "TMOS v9: a reescrita full-proxy", detail: "A versão 9 do BIG-IP reconstrói o produto sobre o TMOS, um sistema operacional de tráfego feito sob medida que termina por completo os dois lados de cada conexão. A arquitetura full-proxy com os scripts iRules, e a comunidade DevCentral em torno deles, transformam um load balancer numa plataforma programável e definem até hoje como o produto é ensinado." },
        { year: 2017, title: "François Locoh-Donou assume", detail: "Abril de 2017: o veterano da Ciena se torna presidente e CEO, herdando uma líder de ADC ancorada em hardware e conduzindo-a rumo a software, SaaS e segurança." },
        { year: 2019, title: "NGINX", detail: "A F5 adquire a NGINX, a empresa por trás do servidor web e reverse proxy que fica na frente de boa parte da internet, por cerca de US$ 670 milhões, fincando bandeira no open source e nas stacks modernas de aplicação.", sourceNote: "Anunciada em março de 2019, concluída em maio de 2019." },
        { year: 2020, title: "Shape Security", detail: "A aquisição da Shape Security, de cerca de US$ 1 bilhão, é concluída em janeiro de 2020, trazendo defesa contra bots e antifraude baseadas em machine learning: a semente do atual Distributed Cloud Bot Defense." },
        { year: 2021, title: "Volterra, e um novo nome", detail: "Janeiro de 2021: a F5 compra a Volterra por cerca de US$ 500 milhões como base de sua plataforma de edge e multicloud; a Threat Stack (US$ 68 milhões) vem em setembro. Em novembro, a empresa muda formalmente de nome, de F5 Networks para F5, Inc.: a era 'Networks' se encerra oficialmente." },
        { year: 2022, title: "F5 Distributed Cloud Services", detail: "As linhagens Volterra, Shape e BIG-IP convergem no F5 Distributed Cloud Services: proteção de aplicações web e APIs (WAAP) entregue como SaaS, redes multicloud e edge compute num só console." },
        { year: 2025, title: "Começa o capítulo da segurança de IA", detail: "A F5 incorpora a classificação de dados em trânsito (LeakSignal, em fevereiro) e a segurança de runtime de IA corporativa (CalypsoAI, concluída em 26 de setembro por US$ 145,2 milhões) à recém-batizada Application Delivery and Security Platform, apresentando dias depois o F5 AI Guardrails e o AI Red Team.", sourceNote: "10-K da F5 do ano fiscal de 2025; contraprestação anunciada de US$ 180 milhões conforme o 8-K de 11 de setembro." },
        { year: 2020, personal: true, title: "Meu capítulo: a plataforma âncora", detail: "Certificações desde 2015, F5 Authorized Instructor desde 2020, DevCentral MVP de 2022 a 2024: doze cursos oficiais de BIG-IP e TMOS, e a âncora da prática de ensino de onde este site nasce." },
      ],
      // Products: names as the vendor writes them (generic descriptors localised); descriptions translated.
      products: [
        { name: "BIG-IP (LTM, DNS, APM, Advanced WAF)", what: "A família principal de entrega e segurança de aplicações (gerenciamento de tráfego local e global, acesso e web application firewall) em hardware, edições virtuais e plataformas F5OS (rSeries, VELOS)." },
        { name: "NGINX", what: "O servidor web, reverse proxy e ingress de Kubernetes que carrega uma fatia enorme dos sites do mundo; a ponte da F5 para o open source e para as equipes de aplicações modernas." },
        { name: "F5 Distributed Cloud Services", what: "WAAP, defesa contra bots, segurança de APIs, redes multicloud e edge compute entregues como SaaS: as linhagens Volterra e Shape unificadas." },
        { name: "F5 Application Delivery and Security Platform (ADSP)", what: "O guarda-chuva da era 2025 que faz convergir BIG-IP, NGINX e Distributed Cloud numa só plataforma para entregar e proteger cada aplicação e cada API, agora incluindo AI Guardrails e AI Red Team." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "O full proxy", detail: "O TMOS termina os lados do cliente e do servidor de forma independente, permitindo ao BIG-IP inspecionar, transformar e proteger o tráfego nos dois sentidos: a ideia arquitetônica que o separou dos load balancers que apenas encaminhavam pacotes." },
        { title: "iRules e DevCentral", detail: "Scripts Tcl orientados a eventos no data path, e a comunidade que cresceu em torno deles: programabilidade como recurso do produto uma década antes de 'infrastructure as code' (infraestrutura como código) virar slogan." },
        { title: "Do ADC ao WAAP", detail: "A migração deliberada de uma franquia de appliances para a proteção de aplicações e APIs entregue como SaaS, sem abandonar a base instalada: BIG-IP, NGINX e Distributed Cloud como um único contínuo." },
      ],
      // Markets paragraphs, same count.
      markets: [
        "O mercado de origem da F5 é a entrega e a segurança de aplicações para o mundo corporativo: o tráfego na frente de bancos, operadoras, governos e da maior parte da Fortune 500 passa por um BIG-IP, um NGINX ou pelos dois. O centro de gravidade da empresa se deslocou dos ADCs em hardware para software, serviços de segurança SaaS e, desde 2025, a proteção de aplicações e de inferência de IA.",
      ],
      // Analyst statements, same count.
      analyst: [
        "Durante a maior parte de duas décadas, a F5 definiu a categoria de application delivery controller com a qual os analistas mediam todos os demais; à medida que a própria categoria se dissolveu em WAAP e serviços de aplicação multicloud, a F5 aparece consistentemente entre os líderes e principais players desses mercados sucessores.",
      ],
    },
  },
  // ---- freeradius: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "freeradius": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "FreeRADIUS",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Autentica cerca de um terço das pessoas na internet e tem o mesmo líder de projeto desde 1999.",
    intro: "O FreeRADIUS foi fundado em junho de 1999 por Miquel van Smoorenburg e Alan DeKok, com a primeira versão alfa pública em agosto, e é por isso que as fontes dão os dois meses. Era um fork do servidor Cistron RADIUS, que o próprio van Smoorenburg tinha escrito e que fora amplamente adotado por um motivo específico: o servidor RADIUS original tinha deixado de ser mantido.",
    // Body: 7 paragraph(s), same order as the English.
    body: [
      "O protocolo tem uma origem precisa. Em 1991, a Merit Network, um provedor de internet sem fins lucrativos, precisava gerenciar o acesso discado em pontos de presença operados por organizações diferentes. Não queria distribuir nomes de usuário e senhas para cada servidor de acesso remoto, então queria que esses servidores perguntassem a um servidor central e recebessem de volta um sim ou um não. A Livingston Enterprises construiu isso e o chamou de Remote Authentication Dial-In User Service.",
      "A Livingston merece um parágrafo só para ela. Fundada em 1986 por Ronald Willens e o filho, Steven, em Pleasanton, na Califórnia, financiada pelos fundadores e depois pelos próprios lucros operacionais, e não por venture capital, ela fabricava o servidor de acesso PortMaster, que em meados dos anos 1990 detinha algo como dois terços do mercado de provedores e atendia mais de dois mil deles. Tinha noventa funcionários. A Lucent a adquiriu em 1997, e o servidor RADIUS que ela distribuía de graça deixou de ser mantido.",
      "Foi essa lacuna que o Cistron preencheu, e depois o FreeRADIUS fez um fork do Cistron. Assim, o software que autentica hoje uma grande fração da internet descende, por dois forks, de um programa escrito para resolver o problema de acesso discado de uma entidade sem fins lucrativos em 1991.",
      "Os números são a parte em que as pessoas não acreditam. Uma pesquisa de novembro de 2006, com mais de quinhentos respondentes, estimou o uso diário em cerca de cem milhões de pessoas, mais ou menos um terço do acesso global à internet na época. Mais de cinquenta mil sites o rodam, de instalações com dez usuários a outras com mais de dez milhões. Ele sustenta o eduroam, a rede de autenticação em roaming usada por universidades do mundo todo. Se você já se conectou ao wireless de um campus em qualquer lugar da Europa, foi ele que disse sim.",
      "Ele suporta mais tipos de autenticação do que qualquer outro servidor RADIUS open source e foi, por muito tempo, o único open source a implementar EAP, o que importa porque o EAP é a base da autenticação wireless 802.1X. A versão 2.0.0, em 2008, acrescentou servidores virtuais, IPv6 e uma linguagem de políticas; a 3.0.0, em 2013, acrescentou o RadSec, levando o RADIUS sobre TLS, o que corrigiu um protocolo cuja segurança de transporte original era um segredo compartilhado e MD5.",
      "E eis por que ele pertence ao lado de três outros verbetes desta linha do tempo. A Tenable fechou seu scanner open source em 2005 para financiar a empresa e sofreu um fork. A Rapid7 comprou um projeto open source e o manteve aberto como diferencial comercial. A Elastic fechou um, sofreu um fork e o reabriu três anos depois. O FreeRADIUS não fez nada disso. Continuou aberto e virou aquilo contra o qual todos os outros constroem. Existe suporte comercial, por meio de uma empresa construída em torno dele, um arranjo diferente de vender o software ou de restringi-lo.",
      "Alan DeKok lidera o projeto desde 1999, vinte e seis anos, com uma equipe central que se formou devagar: Alexander Clouter em 2009, Arran Cudbard-Bell em 2012, Matthew Newton em 2016. Numa linha do tempo composta sobretudo de aquisições, mudanças de marca e saídas estratégicas, uma peça de infraestrutura mantida em silêncio pela mesma pessoa durante um quarto de século é o verbete de fato incomum.",
    ],
    // Profile: complete copy of profiles/freeradius.ts; years, companies, founders, personal markers and hrefs come from the English.
    profile: {
      // Same slug as the English profile.
      slug: "freeradius",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          company: "The FreeRADIUS project",
          year: 1999,
          place: "distribuído, sem sede",
          founders: [],
          story: "Uma reescrita, e não uma continuação. O objetivo declarado era um design modular que permitisse a outras pessoas contribuir sem entender o servidor inteiro, uma decisão sobre a forma de uma comunidade expressa como decisão sobre a forma de uma base de código.",
        },
      ],
      // Timeline: same events, same order, same years and personal markers; prose translated.
      timeline: [
        { year: 2001, title: "Versão 0.1", detail: "Quase dois anos depois da primeira alfa. Software de infraestrutura desse tipo demora a se declarar pronto, e a primeira versão estável só chegou em 2004." },
        { year: 2025, title: "Ainda sendo lançado", detail: "Versão 3.2.8 em agosto, vinte e seis anos depois do início do projeto, pelo mesmo líder de projeto." },
      ],
      // Products: names as the vendor writes them (generic descriptors localised); descriptions translated.
      products: [
        { name: "O servidor", what: "Escrito em C, sob a versão 2 da GPL, e a implementação de referência na prática, ainda que não no nome: aquilo contra o qual outras implementações de RADIUS são testadas." },
        { name: "O conjunto de módulos", what: "Cada método de autenticação é um módulo, e cada conector de banco de dados é um módulo. Acrescentar um novo em geral não exige mudança alguma no núcleo do servidor, e é por isso que ele suporta mais tipos de autenticação do que qualquer outro produto da categoria." },
        { name: "Dicionários de fabricantes", what: "Atributos específicos de mais de cem fabricantes: Cisco, Juniper, Microsoft, HP, Lucent e os demais. Essa biblioteca é sem glamour, enorme, e é a razão de o servidor funcionar com equipamentos que nenhum dos envolvidos jamais viu." },
        { name: "As bibliotecas cliente", what: "Uma biblioteca cliente sob licença BSD, um módulo Apache e um módulo PAM, para que aplicações falem RADIUS sem precisar implementá-lo." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "A modularidade como estratégia de recrutamento", detail: "Separar cada método de autenticação e cada backend de armazenamento num módulo próprio significa que um colaborador pode acrescentar suporte a uma coisa entendendo só essa coisa. A decisão de design é técnica; o motivo dela foi social, e é por isso que um projeto com uma equipe central pequena suporta mais mecanismos do que produtos comerciais com equipes grandes." },
        { title: "Uma base de código de dez usuários a dez milhões", detail: "O mesmo servidor atende um pequeno escritório e uma operadora nacional mudando padrões, e não sendo outro produto. Pouquíssimo software cobre quatro ordens de grandeza de carga sem se dividir em edições, e os que conseguem costumam acabar virando infraestrutura." },
        { title: "O mantenedor que escreve o padrão", detail: "O líder do projeto é coautor de várias das RFCs que definem os protocolos que o servidor implementa. Isso fecha um ciclo incomum (quem mantém a implementação mais implantada está também entre os que especificam o que ela deve fazer), e é esse arranjo que mantém utilizável um protocolo de trinta anos." },
        { title: "A mesma forma do Apache", detail: "Uma implementação de referência muito usada deixou de ser mantida, uma solução provisória preencheu a lacuna, e uma reescrita modular virou o padrão pelo quarto de século seguinte. Esta linha do tempo registra a mesma sequência no Apache, nos mesmos anos, em outro protocolo. O abandono pelo autor original é uma origem mais comum para infraestrutura durável do que a invenção." },
      ],
      // Markets paragraphs, same count.
      markets: [
        "Provedores de internet, universidades, empresas e operadoras: qualquer lugar onde uma rede precisa decidir se deixa algo entrar. Ele fica por baixo da autenticação wireless, do acesso VPN, da gestão de assinantes de banda larga e das federações de roaming que permitem a um visitante se autenticar contra a instituição de origem a partir de outro continente.",
        "Seus concorrentes são os servidores de políticas comerciais vendidos pelos fabricantes de equipamentos de rede, que costumam se integrar mais de perto ao hardware de um fabricante. A troca é a de sempre, e esta linha do tempo a registra sob vários outros nomes: profundidade de integração contra independência de qualquer fornecedor único.",
      ],
      // Analyst statements, same count.
      analyst: [
        "Não há posição de fabricante a avaliar. A medida que importa é a implantação, e pela pesquisa do próprio projeto o número é de cerca de cem milhões de usuários diários, um número que vale atribuir, e não afirmar, já que vem do projeto e data de 2006.",
        "A observação duradoura é sobre manutenção, e não sobre inovação. A maior parte do software desta linha do tempo mudou de mãos, mudou de rumo ou parou. Este foi mantido continuamente pela mesma pessoa desde 1999, e a camada de autenticação da internet repousa sobre esse arranjo mais do que a maioria de quem a usa imagina.",
      ],
    },
  },
  // ---- global-knowledge: pt-BR prose for the record (facts stay in the English record) ----
  "global-knowledge": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Global Knowledge - a maior delas, hoje dentro da Skillsoft",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Empresa de treinamento corporativo em TI, Cisco Platinum Learning Partner, hoje parte da Skillsoft.",
    intro: "A Global Knowledge é uma empresa de educação corporativa que oferece mais de três mil cursos de TI e de negócios por meio de mais de mil e cem especialistas no assunto, em sala de aula, em sala de aula virtual e em formatos digitais. É Cisco Platinum Learning Partner e hoje opera como Skillsoft Global Knowledge.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "Lida ao lado da Fast Lane, ela descreve as duas pontas do mesmo mercado. As duas têm as mesmas autorizações de primeiro nível dos mesmos fabricantes; uma é especialista independente em treinamento, a outra está hoje dentro de uma empresa cujo negócio principal é uma biblioteca de conteúdo por assinatura.",
      "Essa diferença decide o que é um curso. Uma especialista em treinamento vende dias do tempo de um instrutor e vive de saber se a sala valeu a pena. Uma plataforma de conteúdo vende acesso a um catálogo e vive da renovação. Os dois modelos entregam a mesma certificação, e não são o mesmo produto, a distinção que todo comprador de treinamento técnico acaba descobrindo e que poucos ouvem de antemão.",
      "A cadeia de controle é a parte que vale registrar, porque é a da indústria em miniatura. A Global Knowledge Network foi fundada em 1995, com a Welsh, Carson, Anderson & Stowe investindo em dezembro daquele ano; a MidOcean Partners a comprou deles em outubro de 2011 por 145 milhões de dólares; o Rhone Group a comprou da MidOcean em novembro de 2014; e, numa transação anunciada em outubro de 2020 e concluída em junho de 2021, uma empresa de aquisição de propósito específico se fundiu com a Skillsoft e depois adquiriu a Global Knowledge do Rhone, o conjunto valendo cerca de 1,5 bilhão de dólares, listando a empresa combinada na Bolsa de Nova York. Quatro donos de private equity em vinte e seis anos, depois uma abertura de capital por meio de um veículo de cheque em branco.",
      "Ao longo de tudo isso, o negócio operacional continuou o que era: Cary, na Carolina do Norte, mais de mil funcionários, mais de um milhão de entregas de cursos por ano a cerca de duzentos mil profissionais de tecnologia, e as autorizações de primeiro nível; a empresa já foi eleita parceira do ano por Cisco, Palo Alto Networks, CompTIA e EC-Council no mesmo ano. É o argumento que os verbetes da Pluralsight e do edX fazem pelo outro lado. Os instrutores, as autorizações e os clientes de uma empresa de treinamento são o que dura; o nome na linha de controle muda a cada poucos anos, e as pessoas na sala de aula raramente percebem.",
    ],
  },
  // ---- grafana-labs: pt-BR prose for the record (facts stay in the English record) ----
  "grafana-labs": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Grafana Labs",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Um projeto paralelo de dashboards de 2013 que virou a plataforma aberta de observabilidade: US$ 270 milhões a uma avaliação de US$ 6 bilhões em 2024.",
    intro: "A história contada pela própria Grafana Labs começa em dezembro de 2013, quando Torkel Ödegaard, buscando um jeito melhor de tornar os dados mais acessíveis e interativos, criou uma ferramenta open source de dashboards que chamou de Grafana; ela foi lançada em janeiro de 2014, desdobramento do trabalho dele com o Graphite na Orbitz, com uma interface originalmente baseada na versão 3 do Kibana. A empresa em torno dela foi fundada em 2014 como Raintank e depois adotou o nome do produto, que combina Graphite e Kibana; seus cofundadores são Raj Dutt, o CEO, Ödegaard e Anthony Woods.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "O Grafana não armazena as métricas, os logs nem os traces que mostra. Ele consulta outros sistemas (Prometheus, Graphite, InfluxDB e OpenTSDB para métricas, Loki e Elasticsearch para logs, Tempo, Jaeger e Zipkin para traces, os bancos de dados SQL) e combina os resultados num painel, guardando num banco de dados próprio apenas dashboards, usuários e o estado dos alertas. Esse design é o motivo de ele ter virado o front end da telemetria de todo mundo, e o motivo de a empresa ter conseguido construir Loki, Tempo, Mimir, Pyroscope, k6, Faro, Beyla e Alloy em volta dele.",
      "O dinheiro veio atrás da adoção: US$ 24 milhões em 2019, US$ 50 milhões em 2020, US$ 220 milhões em 2021 a uma avaliação de US$ 3 bilhões e, em 21 de agosto de 2024, uma rodada de US$ 270 milhões liderada pela Lightspeed a uma avaliação acima de US$ 6 bilhões, quando a empresa já tinha passado de US$ 250 milhões em receita recorrente anual, de 5.000 clientes pagantes, ante 2.000 em 2022, e de 20 milhões de usuários no mundo; o próprio site dela diz hoje que tem a confiança de mais de 10.000 clientes. As aquisições montaram a stack: Kausal em 2018, k6, Pace e Amixr em 2021, Pyroscope e Asserts.ai em 2023, TailCtrl em 2024 e LogLine em 2026.",
      "Em 2021, a licença passou da Apache 2.0 para a AGPLv3, o mesmo movimento que o Zabbix fez em 2024 e um primo da briga registrada no verbete da Elastic. Grafana Cloud e Grafana Enterprise são as formas comerciais. Das empresas de monitoramento deste registro, esta é a que nunca vendeu um coletor; vendeu a tela.",
    ],
    // Acquisitions: index-aligned with the English list (year, name, price and founder stay English).
    acquisitions: [
      // [0] Kausal (2018)
      { what: "Listada entre as aquisições da Grafana Labs; a página lida não descreve o produto.", sourceNote: "Wikipedia: Grafana (lida em 06/10/2026)." },
      // [1] k6 (2021)
      { what: "Testes de carga.", sourceNote: "Wikipedia: Grafana (lida em 06/10/2026)." },
      // [2] Pace (2021)
      { what: "Ferramentas para desenvolvedores.", sourceNote: "Wikipedia: Grafana (lida em 06/10/2026)." },
      // [3] Amixr (2021)
      { what: "Resposta a incidentes.", sourceNote: "Wikipedia: Grafana (lida em 06/10/2026)." },
      // [4] Pyroscope (2023)
      { what: "Profiling contínuo.", sourceNote: "Wikipedia: Grafana (lida em 06/10/2026)." },
      // [5] Asserts.ai (2023)
      { what: "Observabilidade assistida por IA.", sourceNote: "Wikipedia: Grafana (lida em 06/10/2026)." },
      // [6] TailCtrl (2024)
      { what: "Amostragem de traces.", sourceNote: "Wikipedia: Grafana (lida em 06/10/2026)." },
      // [7] LogLine (2026)
      { what: "Consulta de logs.", sourceNote: "Wikipedia: Grafana (lida em 06/10/2026)." },
    ],
  },
  // ---- hcl: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "hcl": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "HCLTech",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Nasceu porque a IBM saiu da Índia e, quarenta e um anos depois, comprou o software da IBM.",
    intro: "Um grupo de engenheiros da Delhi Cloth & General Mills, liderado por Shiv Nadar, constituiu a empresa em 11 de agosto de 1976, mudando no mesmo dia o nome de Microcomp Limited para Hindustan Computers Limited. Trabalhavam num barsaati, um apartamento de cobertura em Délhi, com cerca de ₹1,83 lakh de capital, aproximadamente US$ 22.000 na época, e financiaram os computadores que de fato queriam construir vendendo primeiro calculadoras teledigitais.",
    // Body: 7 paragraph(s), same order as the English.
    body: [
      "O contexto é a história inteira. As regras cambiais da Índia exigiam que as multinacionais diluíssem seu capital em favor de acionistas locais, e a IBM preferiu deixar o país a cumpri-las. Isso tirou o fornecedor dominante de um mercado onde havia, segundo uma contagem da época, cerca de 250 computadores no país inteiro. A HCL foi uma das empresas que se formaram no espaço assim aberto.",
      "Em 1978, ela lançou um microcomputador de 8 bits projetado no país, no mesmo ano das primeiras máquinas da Apple e três anos antes do IBM PC. Vieram em seguida um sistema operacional de rede e uma arquitetura cliente-servidor em 1983, e um UNIX multiprocessado de granularidade fina em 1988, que a empresa observa ter chegado três anos antes da Sun e da HP.",
      "Em 1982, Nadar fundou o NIIT, um instituto de treinamento em computação, partindo do raciocínio de que uma indústria nacional de tecnologia não consegue crescer mais depressa do que a oferta de pessoas capazes de trabalhar nela. É um negócio de treinamento criado como infraestrutura para uma indústria, e não como produto, o tipo de decisão que só parece óbvia depois.",
      "O braço de serviços de software foi desmembrado em 12 de novembro de 1991, inicialmente como HCL Overseas Limited, passando a HCL Consulting em 1994 e a HCL Technologies em 1999. Abriu capital em janeiro de 2000, passou de US$ 10 bilhões de receita em 2021 e se rebatizou HCLTech em 2022.",
      "E então vem a inversão. A IBM anunciou a venda do Notes e do Domino à HCL em 6 de dezembro de 2018, e a transação mais ampla foi concluída em 1º de julho de 2019: sete produtos de software (Notes e Domino, AppScan, BigFix, Commerce, Connections, Digital Experience e Unica) por US$ 1,8 bilhão, a maior aquisição feita por uma empresa indiana de TI até então. Os dois anos aparecem nas fontes porque um é o do anúncio e o outro, o da conclusão.",
      "Assim, a empresa que existe em parte porque a IBM se retirou da Índia nos anos 1970 hoje é dona e desenvolvedora de um software pelo qual a IBM comprou a Lotus em 1995. O Lotus Notes teve três donos ao longo de quatro décadas, e o atual foi fundado por pessoas que começaram vendendo calculadoras para financiar um computador que ninguém mais lhes venderia.",
      "Mais dois pontos. Roshni Nadar Malhotra sucedeu o pai na presidência do conselho, tornando-se a primeira mulher a presidir o conselho de uma empresa indiana de TI de capital aberto. E a própria lista de fundadores é genuinamente disputada: as fontes falam em seis ou em oito fundadores e, embora Shiv Nadar, Arjun Malhotra, Ajai Chowdhry e Yogesh Vaidya apareçam sempre, os demais nomes variam entre os relatos. Essa divergência fica visível aqui, em vez de resolvida pela escolha da versão que soa melhor.",
    ],
    // Acquisitions: index-aligned with the English list (year, name, price and founder stay English).
    acquisitions: [
      // [0] Seven IBM software products (2019)
      { what: "Notes e Domino, AppScan, BigFix, Commerce, Connections, Digital Experience e Unica. Anunciada em 6 de dezembro de 2018 e concluída em 1º de julho de 2019; a maior aquisição feita por uma empresa indiana de TI até então.", became: "HCL Software, e o motivo de o Notes ainda ser vendido e suportado hoje.", subAcquisitions: [{ what: "A IBM tinha comprado a Lotus em 1995 principalmente para obter o Notes. Assim, este negócio transferiu, por cerca de metade do preço original e vinte e quatro anos depois, o ativo que o tinha justificado." }] },
      // [1] Actian (2018)
      { what: "Gestão e análise de dados, incluindo a linhagem do banco de dados Ingres. A HCL America comprou os 19,6% restantes em 2021 por US$ 100,2 milhões.", became: "A divisão de dados e analytics da HCL Software." },
    ],
    // Profile: complete copy of profiles/hcl.ts; years, companies, founders, personal markers and hrefs come from the English.
    profile: {
      // Same slug as the English profile.
      slug: "hcl",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
      ],
      // Timeline: same events, same order, same years and personal markers; prose translated.
      timeline: [
        { year: 1978, title: "O HCL 8C", detail: "A máquina tinha nome, o que vale registrar: não um protótipo ou um programa, mas um produto, projetado e fabricado num país que quase não tinha computadores com que aprender nem fornecedor disposto a vender livremente as peças." },
        { year: 1991, title: "Quinze anos de hardware antes da guinada", detail: "O negócio de serviços de software foi desmembrado depois de a empresa passar uma década e meia construindo máquinas. O negócio de hardware é o que se apagou desde então; o braço criado para fazer outra coisa é o que leva o nome hoje. Essa sequência, o negócio fundador superado por um posterior, se repete nesta linha do tempo, e raramente é planejada." },
      ],
      // Products: names as the vendor writes them (generic descriptors localised); descriptions translated.
      products: [
        { name: "Serviços de TI e de engenharia", what: "Desenvolvimento de aplicações, gestão de infraestrutura e engenharia de produto entregues globalmente: o grosso da receita e o negócio que a maioria das pessoas tem em mente ao ouvir o nome." },
        { name: "HCLSoftware", what: "Produtos próprios, e não serviços: Notes e Domino, AppScan, BigFix, Unica, Commerce, Connections e outros, todos adquiridos da IBM. Esta é a parte incomum, discutida abaixo." },
        { name: "Consultoria digital e de nuvem", what: "Migração, plataformas de dados e trabalho com inteligência artificial vendidos aos mesmos clientes do negócio de serviços, a preços mais altos." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "Uma empresa indiana de serviços que é dona de produtos", detail: "As grandes empresas indianas de tecnologia são negócios de serviços: constroem e operam software que pertence a outras empresas. Esta comprou um portfólio inteiro e hoje o mantém, vende e desenvolve, o que significa carregar roadmaps, obrigações de suporte e a receita de licenças de uma base instalada, em vez de faturar por hora. É um negócio materialmente diferente dentro da mesma empresa, e raro entre seus pares." },
        { title: "Financiar o produto real com outro sem relação", detail: "Vender calculadoras para pagar a construção de computadores é um padrão que esta linha do tempo registra mais de uma vez: a EMC vendia móveis de escritório antes de vender memória, e a Veeam foi financiada por mais de uma década por uma atividade paralela que ficou maior do que a controladora. A forma comum é um fundador que sabe o que quer construir e encontra algo vendável para financiá-lo, o que o venture capital substituiu e o que a falta dele exige." },
        { title: "Formar a força de trabalho como infraestrutura", detail: "O instituto de treinamento descrito acima não era uma linha de produtos, mas uma pré-condição. Esse enquadramento, pessoas como problema de cadeia de suprimentos, e não de contratação, é o motivo de a indústria indiana de serviços ter conseguido crescer no ritmo em que cresceu, e ele reaparece na Stefanini, em outro ponto desta linha do tempo, alcançado de forma independente." },
      ],
      // Markets paragraphs, same count.
      markets: [
        "Cerca de duzentas e cinquenta empresas da Fortune 500 e seiscentas e cinquenta da Global 2000, atendidas a partir de sessenta países por cerca de 219.000 pessoas, com aproximadamente US$ 14 bilhões de receita anual: a terceira maior empresa de serviços sediada na Índia em receita.",
        "Ela compete com as outras grandes empresas indianas de serviços, com as consultorias globais e, de forma única entre seus pares indianos, com fabricantes de software, porque hoje vende produtos com que eles competem.",
      ],
      // Analyst statements, same count.
      analyst: [
        "Avaliada ao lado dos outros grandes provedores de serviços offshore em escala de entrega, profundidade vertical e preço, com o portfólio de software tratado como um negócio separado dentro da mesma entidade de reporte.",
        "A questão que vale acompanhar é se ser dona dos produtos terá sido a troca certa. Software adquirido carrega obrigações de manutenção com clientes que não escolheram o novo dono, e o portfólio foi comprado justamente porque o dono anterior já não o queria. Ser um bom guardião de um software de que outra empresa desistiu é uma competência específica, e as evidências sobre ela se acumulam devagar.",
      ],
    },
  },
  // ---- inlearn: pt-BR prose for the record (facts stay in the English record) ----
  "inlearn": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "InLearn - treinamento oficial, Brasil",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Centro de treinamento autorizado brasileiro para cursos de F5 e Fortinet.",
    intro: "A InLearn Educação Ltda foi constituída em 14 de abril de 2002, registrada em Barueri, na Grande São Paulo, e é parceira oficial de treinamento da Fortinet e da F5, ministrando os cursos e as trilhas de certificação dos próprios fabricantes. Como a TDec, ela se data de duas maneiras diferentes: o registro diz 2002, enquanto a empresa se apresenta como formadora de profissionais “since 2008” (desde 2008). As duas datas ficam registradas aqui, e a de 2008 agora tem uma explicação: a história publicada pelo próprio Grupo IHC diz que a inLearn foi criada naquele ano pelos sócios da HighCast, uma consultoria de redes fundada em 2003, depois que a especialização de seus consultores gerou demanda por treinamento.",
    // Body: 2 paragraph(s), same order as the English.
    body: [
      "Um centro de treinamento autorizado é a camada que a maior parte da documentação dos fabricantes nunca menciona: o fabricante escreve o material do curso, e alguém local precisa agendá-lo, atribuir instrutores certificados e pôr laboratórios funcionando na frente das pessoas. Isso importa mais num mercado como o Brasil do que o organograma sugere: uma certificação que só existe em inglês, só do outro lado de uma barreira cambial e só em outro fuso horário é uma certificação que a maioria dos engenheiros locais não vai obter.",
      "A InLearn pertence ao Grupo IHC, fundado em 2003, ao lado da HighCast e da CYLK, o que significa que duas empresas desta enciclopédia são negócios irmãos no mesmo grupo.",
    ],
  },
  // ---- lotus: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "lotus": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Lotus Development",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Previu um milhão de dólares no primeiro ano, faturou cinquenta e três e lançou um software que ainda roda quatro décadas depois.",
    intro: "Mitch Kapor e Jonathan Sachs fundaram a Lotus em abril de 1982, com o apoio de Ben Rosen. Kapor tinha 32 anos e havia sido chefe de desenvolvimento na VisiCorp, a distribuidora do VisiCalc, onde escreveu o VisiPlot e o VisiTrend e teve seus direitos comprados por US$ 1,7 milhão. Sachs passou então dez meses escrevendo o Lotus 1-2-3 em assembly para o IBM PC.",
    // Body: 9 paragraph(s), same order as the English.
    body: [
      "O 1-2-3 saiu em 26 de janeiro de 1983, e o nome descrevia três usos (planilha, gráficos, banco de dados), dos quais as pessoas usavam esmagadoramente o primeiro. O que o fez vencer foi menos romântico do que o nome: era rápido, recalculava depressa e foi escrito para aproveitar máquinas com 256K de memória, e não as menores que o antecessor tinha como alvo.",
      "Os números daquele primeiro ano merecem ser ditos por inteiro. O plano de negócios previa US$ 1 milhão em vendas. A Lotus faturou US$ 53 milhões e, em 1983, era a terceira maior empresa de software para microcomputadores do mundo. Pouquíssimas empresas desta linha do tempo erraram a própria projeção por um fator de cinquenta na direção certa.",
      "O antecessor já está neste site. O verbete da Apple registra o VisiCalc como o software que fez o Apple II valer a compra: a primeira planilha eletrônica, e o motivo de uma empresa justificar um computador pessoal. Kapor veio da empresa que o distribuía e construiu o produto que o substituiu. Depois, em 1985, a Lotus adquiriu a Software Arts, a empresa que de fato escreveu o VisiCalc, e o descontinuou. O sucessor comprou o antecessor e o desligou.",
      "Jim Manzi chegou em 1982 como consultor da McKinsey, virou funcionário quatro meses depois, presidente em outubro de 1984 e CEO em abril de 1986, quando Kapor deixou o cargo. Ele dirigiu a empresa até a venda.",
      "E então vem o produto que sobreviveu a todo o resto. O Lotus Notes saiu da Iris Associates, de Ray Ozzie, e não era uma planilha, um cliente de e-mail nem um banco de dados, mas algo construído a partir dos três: repositórios de documentos replicados que funcionavam desconectados, com lógica de aplicação acoplada. É um design incomum, e é exatamente por isso que sobreviveu: as organizações construíram dentro dele seus processos de negócio de verdade, e um processo de negócio é muito mais difícil de migrar do que um formato de arquivo.",
      "A IBM comprou a Lotus em 1995 por US$ 3,5 bilhões, principalmente pelo Notes, e especificamente para entrar na computação cliente-servidor enquanto o seu próprio OfficeVision, baseado em host, ficava obsoleto. No caminho, a Lotus também tinha adquirido o cc:Mail em 1991, que aparece nesta linha do tempo no verbete da Qualys, porque o fundador do cc:Mail, Philippe Courtot, dirigiu depois a Qualys por duas décadas.",
      "Em 6 de dezembro de 2018, a IBM anunciou a venda do Notes e do Domino à HCL por US$ 1,8 bilhão. Assim, o software já teve três donos ao longo de mais de trinta anos e continua vendido, suportado e rodando os processos internos de organizações que os construíram nos anos 1990 e nunca encontraram um motivo caro o bastante para justificar a saída.",
      "Esse é o fato que vale levar daqui, e ele contradiz o modo como esta indústria costuma falar de si mesma. A maioria das empresas desta linha do tempo foi comprada por uma tecnologia aposentada em silêncio poucos anos depois. A Lotus foi comprada por uma que sobreviveu ao interesse do comprador, à estratégia do comprador e, por fim, ao próprio comprador.",
      "Duas notas de rodapé sobre os fundadores, ambas boas. Sachs saiu em 1985 para escrever software de edição de fotos e vem lançando esse software desde 1994. Kapor largou um mestrado na MIT Sloan em 1979 para ir começar tudo isso, e o concluiu em 2025, quarenta e seis anos depois.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "Adquirida pela IBM por US$ 3,5 bilhões, principalmente para obter o Notes. A marca persistiu por anos depois disso, e os produtos Notes e Domino foram revendidos à HCL num negócio anunciado em 6 de dezembro de 2018, por US$ 1,8 bilhão.",
    // Successor link label (the URL stays in the English record).
    successorLabel: "HCLTech, que adquiriu o portfólio Notes e Domino",
    // Acquisitions: index-aligned with the English list (year, name, price and founder stay English).
    acquisitions: [
      // [0] Software Arts (1985)
      { what: "A empresa que escreveu o VisiCalc, a primeira planilha eletrônica e o software que fez do Apple II uma compra empresarial.", became: "O VisiCalc foi descontinuado. O produto que a Lotus tinha vencido no mercado foi comprado e desligado pela empresa que o venceu." },
      // [1] cc:Mail (1991)
      { what: "A plataforma dominante de e-mail corporativo da época, com cerca de 40% do mercado.", became: "O negócio de e-mail da Lotus, depois superado pelo próprio Notes.", sourceNote: "O valor da compra é amplamente noticiado, mas não confirmado pelas fontes lidas para este registro; trate-o como aproximado." },
      // [2] Iris Associates (1994)
      { what: "A empresa de Ray Ozzie, que desenvolvia o Notes sob contrato para a Lotus desde os anos 1980.", became: "O Notes e, mais tarde, o Domino: os produtos que sobreviveram a mais dois donos e ainda são vendidos hoje." },
    ],
    // Profile: complete copy of profiles/lotus.ts; years, companies, founders, personal markers and hrefs come from the English.
    profile: {
      // Same slug as the English profile.
      slug: "lotus",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          company: "Lotus Development",
          year: 1982,
          place: "Cambridge, Massachusetts",
          founders: ["Mitch Kapor","Jonathan Sachs"],
          story: "Um fundador que tinha construído produtos para a empresa que distribuía o VisiCalc, e outro que passou dez meses escrevendo o substituto em assembly. A divisão de trabalho é a história inteira: alguém que entendia o que o mercado queria a seguir, e alguém capaz de escrevê-lo depressa o bastante para fazer diferença.",
        },
        {
          company: "Iris Associates",
          year: 1984,
          place: "Westford, Massachusetts",
          founders: ["Ray Ozzie","Tim Halvorsen","Len Kawell"],
          story: "A empresa separada que construiu o Notes, financiada pela Lotus e adquirida por ela em 1994. Seus fundadores tinham trabalhado no PLATO, o sistema universitário de ensino cujos notesfiles estiveram entre os primeiros espaços de discussão online, e a linhagem aparece: o Notes descende de uma ferramenta acadêmica de colaboração, e não de um produto de e-mail.",
        },
      ],
      // Timeline: same events, same order, same years and personal markers; prose translated.
      timeline: [
        { year: 1983, title: "O 1-2-3 é lançado", detail: "26 de janeiro, escrito para máquinas com 256K de memória quando o antecessor tinha sido feito para menos: uma aposta deliberada de que o hardware chegaria." },
        { year: 1989, title: "Notes 1.0", detail: "Mensagens em grupo, discussões, contatos, criptografia, autenticação de mensagens e links entre documentos, em DOS e OS/2: uma lista de recursos que o resto da indústria levou boa parte de uma década para igualar." },
        { year: 1991, title: "cc:Mail", detail: "Adquirido; seu fundador dirigiria depois outra empresa desta linha do tempo por duas décadas." },
        { year: 1994, title: "A Iris é adquirida", detail: "A desenvolvedora do Notes é trazida para dentro, um ano antes de a IBM comprar o conjunto inteiro." },
        { year: 2026, title: "Domino 14.5", detail: "Uma camada de IA rodando dentro do ambiente do próprio cliente, e não na nuvem de um fabricante, ao lado de interfaces REST e gRPC e suporte a containers: trabalho de arquitetura, e não de manutenção." },
      ],
      // Products: names as the vendor writes them (generic descriptors localised); descriptions translated.
      products: [
        { name: "Lotus 1-2-3", what: "A planilha que definiu a categoria no IBM PC, e cuja linguagem de macros a transformou de calculadora em ambiente de programação que os departamentos financeiros de fato programavam." },
        { name: "Notes e Domino", what: "O cliente e o servidor: repositórios de documentos replicados com lógica de aplicação dentro deles, uma descrição que hoje soa banal e que não tinha equivalente em 1989." },
        { name: "cc:Mail", what: "E-mail corporativo, adquirido em 1991 e por fim substituído pelo e-mail do próprio Notes, da mesma empresa." },
        { name: "SmartSuite", what: "O pacote de escritório (Word Pro, Freelance Graphics, Approach), que perdeu para o da Microsoft por motivos mais ligados à distribuição do que à qualidade." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "A aplicação vive dentro do próprio arquivo de banco de dados", detail: "Um arquivo NSF guarda os documentos, os formulários que os exibem, as visões que os indexam e o código que os processa, tudo junto. É por isso que uma aplicação Notes é portátil, e por isso que sair é tão caro: você não está migrando um banco de dados, está migrando uma aplicação cuja lógica não existe fora do próprio formato de armazenamento. O texto acima observa que um processo de negócio é mais difícil de mover do que um formato de arquivo; este é o mecanismo." },
        { title: "Cada documento sabe o que é em toda parte", detail: "Uma nota carrega um identificador local e, separadamente, um identificador de origem que nomeia o mesmo documento em todas as réplicas e registra sua última modificação. Esse par é o que torna tratável a replicação bidirecional: duas cópias editadas de forma independente podem ser reconhecidas como o mesmo documento e comparadas, em vez de uma sobrescrever a outra em silêncio." },
        { title: "Replicação feita para redes que não funcionavam", detail: "As duas pontas enviam e puxam, só as mudanças trafegam, e as edições feitas offline ficam numa fila local até aparecer uma conexão. Isso foi projetado para acesso discado e linhas dedicadas caras, e produziu um software que funcionava num laptop dentro de um trem em 1993, mais ou menos quando o resto da indústria decidiu que isso era impossível." },
        { title: "Documentos sem schema, décadas antes", detail: "Os campos podiam guardar conteúdos variados, e os documentos de um mesmo repositório não precisavam ter a mesma forma. O banco de dados de documentos não foi inventado em 2009; já estava sendo vendido em 1989, num produto de que a maioria das pessoas se lembra pelo cliente de e-mail." },
      ],
      // Markets paragraphs, same count.
      markets: [
        "Grandes organizações que construíram aplicações internas: aprovações, tratamento de casos, cadastros, os fluxos de trabalho que nunca justificaram um sistema sob medida, mas que mesmo assim faziam o negócio rodar. Essas aplicações são o motivo de o software ter sobrevivido a três donos: foram escritas por pessoas que saíram, numa linguagem que ninguém substituiu, fazendo um trabalho que ninguém documentou por inteiro.",
        "Perdeu o mercado de pacotes de escritório para a Microsoft e o de e-mail para o Exchange, e manteve a única coisa que nenhum dos dois concorrentes substituiu diretamente: um lugar onde um departamento podia construir uma aplicação funcional sem pedir permissão a ninguém.",
      ],
      // Analyst statements, same count.
      analyst: [
        "Não há posição atual de analistas a relatar para uma empresa que deixou de existir como tal em 1995. O que se pode avaliar é o software, e a avaliação é incomum: ainda vendido, ainda desenvolvido, ainda recebendo trabalho de arquitetura três décadas depois de o mercado declará-lo legado.",
        "O motivo, numa linha: o que foi adquirido não era um produto, mas um lugar onde outras pessoas tinham posto o seu trabalho.",
      ],
    },
  },
  // ---- nagios: pt-BR prose for the record (facts stay in the English record) ----
  "nagios": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Nagios - NetSaint, Nagios Core e Nagios Enterprises",
    // Card line (also the meta description) and intro paragraph.
    tagline: "O NetSaint de Ethan Galstad, de 1999, virou Nagios em 2002 e uma empresa de St. Paul em 2007; seu modelo de plugins moldou uma geração de monitoramento.",
    intro: "O Nagios é um sistema open source de monitoramento de redes e infraestrutura que vigia hosts, serviços e dispositivos de rede e emite alertas quando eles falham e de novo quando se recuperam. Ethan Galstad o lançou como NetSaint 0.0.1 em 14 de março de 1999 e o rebatizou de Nagios em 2002, depois que os donos de uma marca registrada de nome parecido levantaram uma contestação jurídica; o novo nome é um acrônimo recursivo, Nagios Ain't Gonna Insist On Sainthood (o Nagios não vai insistir na santidade), e 'agios' é santo em grego. Galstad fundou a Nagios Enterprises em 2007 em St. Paul, Minnesota, para oferecer suporte comercial e o Nagios XI, proprietário.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "O design é o que é preciso entender. O Nagios Core não faz monitoramento nenhum por si: ele agenda programas externos, os plugins, cada um dos quais testa um serviço ou recurso e devolve um código de status, 0 para OK, 1 para alerta, 2 para crítico, 3 para desconhecido. Existem centenas de plugins da comunidade, e essa arquitetura é o motivo de o sistema ter se espalhado: qualquer pessoa capaz de escrever um script podia monitorar qualquer coisa. Escrito em C, licenciado sob a GPLv2, roda em Linux e em outros sistemas Unix.",
      "As versões marcaram o arco: a 2.0 em fevereiro de 2006, com a Event Broker API, a 3.0 em março de 2008, a 4.0 em setembro de 2013, com processos worker para verificações em paralelo. Os produtos da empresa comercial são Nagios XI, Core, Log Server, Network Analyzer e Fusion.",
      "Os forks também fazem parte do registro. Em maio de 2009, um grupo de desenvolvedores da comunidade fez um fork do Nagios chamado Icinga, alegando desenvolvimento lento e resposta insuficiente aos patches; o Icinga 2, de 2014, foi uma reescrita do zero. Em 16 de janeiro de 2014, a Nagios Enterprises redirecionou o domínio nagios-plugins.org para um servidor sob seu controle sem avisar a equipe de plugins da comunidade, cujos mantenedores desalojados seguiram como Monitoring Plugins. Shinken, Naemon e Checkmk são os outros derivados. Um projeto que fez do monitoramento um ofício comunitário teve depois de conviver com o que uma comunidade faz quando discorda.",
    ],
  },
  // ---- netgear: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "netgear": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "NETGEAR",
    // Card line (also the meta description) and intro paragraph.
    tagline: "A empresa que pôs as redes na prateleira do varejo.",
    intro: "Fundada dentro da Bay Networks em 1996 por Patrick Lo e Mark Merrill, a NETGEAR inventou as redes como produto de varejo: os switches azuis de metal, depois o Nighthawk e o Orbi, o primeiro equipamento de rede que milhões de pessoas compraram por conta própria.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "Sobreviveu à absorção da controladora pela Nortel, chegou à independência e à listagem na NASDAQ em 2003, desmembrou a Arlo em 2018 e ainda define como as redes domésticas e de pequenas empresas se apresentam numa prateleira.",
    ],
    // Profile: complete copy of profiles/netgear.ts; years, companies, founders, personal markers and hrefs come from the English.
    profile: {
      // Same slug as the English profile.
      slug: "netgear",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          company: "NETGEAR",
          year: 1996,
          place: "San Jose, Califórnia",
          founders: ["Patrick Lo","Mark Merrill"],
          story: "A proposta de Patrick Lo dentro da Bay Networks era herética para 1996: redes deveriam ser um produto de varejo, em caixa, de prateleira, instalável por alguém que nunca ouviu falar de sub-rede. A NETGEAR nasceu como subsidiária da Bay para provar isso, e os pequenos switches azuis de metal viraram o primeiro equipamento de rede que milhões de pessoas compraram com o próprio dinheiro. A empresa sobreviveu à absorção da controladora pela Nortel, chegou à independência e à listagem na NASDAQ em 2003 e passou as décadas da banda larga como a resposta padrão na prateleira: se uma casa ou um pequeno escritório se conectava, era provável que houvesse uma caixa NETGEAR no meio.",
          sourceNote: "Fundação como subsidiária da Bay Networks e IPO na NASDAQ em 2003 (NTGR) conforme o registro corporativo usual; o interlúdio Nortel decorre da aquisição da Bay em 1998.",
        },
      ],
      // Timeline: same events, same order, same years and personal markers; prose translated.
      timeline: [
        { year: 1996, title: "Nascida dentro da Bay", detail: "A NETGEAR nasce como subsidiária da Bay Networks com uma tese de varejo: redes como produto de consumo, vendidas em caixas, com suporte de eletrodoméstico." },
        { year: 1998, title: "O interlúdio Nortel", detail: "A aquisição da Bay Networks pela Nortel leva a NETGEAR junto; a marca de varejo continua construindo seu canal enquanto a controladora faz a integração." },
        { year: 2003, title: "Independência e IPO", detail: "A NETGEAR estreia na NASDAQ como NTGR, uma empresa independente bem quando explode a demanda por banda larga doméstica e Wi-Fi." },
        { year: 2009, title: "A escada das PMEs", detail: "Os switches ProSafe, o armazenamento ReadyNAS e o wireless para pequenas empresas fazem da NETGEAR a marca do degrau intermediário entre o equipamento de consumo e os preços corporativos." },
        { year: 2013, title: "Nighthawk", detail: "A linha de routers Nighthawk transforma o Wi-Fi de alto desempenho numa categoria de consumo com identidade própria: o router como objeto que as pessoas escolhem, e não apenas aceitam." },
        { year: 2016, title: "Orbi e a era mesh", detail: "O Orbi surfa a onda do mesh para a casa inteira, mantendo a NETGEAR na dianteira da transição do Wi-Fi de consumo que ela ajudou a criar." },
        { year: 2018, title: "A Arlo se separa", detail: "O negócio de câmeras Arlo abre capital como empresa separada, e a NETGEAR volta o foco para o núcleo de redes." },
      ],
      // Products: names as the vendor writes them (generic descriptors localised); descriptions translated.
      products: [
        { name: "Switches não gerenciáveis azuis de metal", what: "Os switches de mesa de cinco e oito portas que fizeram de 'just add ports' (é só acrescentar portas) uma compra de varejo; talvez o produto de rede mais manuseado dos anos 2000." },
        { name: "Nighthawk / Orbi", what: "Routers de alto desempenho e mesh para a casa inteira: os carros-chefe do Wi-Fi de consumo." },
        { name: "ProSafe / ReadyNAS / Insight", what: "A camada para PMEs: switching gerenciável, armazenamento em rede e redes gerenciadas pela nuvem sem preço corporativo." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "Redes como varejo", detail: "A verdadeira invenção da NETGEAR foi a categoria: embalagem, canal, garantia e linguagem de design que permitiram às redes serem vendidas ao lado de impressoras. Toda marca de redes de consumo desde então opera no espaço que ela abriu." },
      ],
      // Markets paragraphs, same count.
      markets: [
        "Redes de consumo e para PMEs no mundo todo (routers, mesh, switching e pequenas redes gerenciadas pela nuvem), competindo com TP-Link, ASUS, Ubiquiti e o gateway fornecido pelo provedor.",
      ],
      // Analyst statements, same count.
      analyst: [
        "Situada entre as contemporâneas como a criadora da categoria de varejo com linhagem pioneira: nascida da Bay Networks, sobrevivente da Nortel e ainda definindo como as redes domésticas se apresentam numa prateleira.",
      ],
    },
  },
  // ---- nowcy: pt-BR prose for the record (facts stay in the English record) ----
  "nowcy": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "NowCy",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Parceira citada pela Zscaler no Brasil.",
    intro: "Uma das parceiras brasileiras do lado da Zscaler. O canal brasileiro da Zscaler é pequeno e recente em comparação com o dos fabricantes de redes, que é a cara de um mercado enquanto uma categoria ainda está sendo estabelecida, e não substituída.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "Apresenta-se como parceira e especialista Zscaler reconhecida no Brasil. O canal brasileiro da Zscaler é pequeno e recente perto do dos fabricantes de redes, que é a cara de um mercado enquanto uma categoria ainda está sendo estabelecida, e não substituída.",
      "O registro é datado de 21 de fevereiro de 2022, em Belo Horizonte, e a imprensa especializada que noticiou a venda da empresa um ano depois diz que ela foi criada em 2021: a distância comum entre um negócio começar e a papelada alcançá-lo. A data do registro é a usada aqui porque é a documentada, e o relato de 2021 fica registrado ao lado dela, em vez de preterido ou preferido.",
      "Esse mesmo registro aparece sob DOIS nomes empresariais, conforme a época em que um diretório o coletou: Now Treinamento e Locacao, e Nowcy Seguranca da Informacao. Os códigos de atividade secundária ainda carregam a forma antiga (treinamento profissional, aluguel de equipamentos, comércio varejista de suprimentos de informática), de modo que o registro mostra uma empresa que se reposicionou de treinamento e locação para segurança e não se deu ao trabalho de reescrever seu histórico de códigos CNAE.",
      "Em fevereiro de 2023, ela foi incorporada à BHS, um grupo mineiro de serviços de TI, como a quarta empresa do grupo. É a terceira empresa deste catálogo a terminar dentro de uma holding maior em vez de continuar independente (a Proteus foi para a Patria e passou a fazer parte da SEK, e a Segertech está dentro de um grupo de comércio exterior), que é o que o mercado de especialistas brasileiros em segurança vem fazendo há alguns anos.",
    ],
  },
  // ---- oi: pt-BR prose for the record (facts stay in the English record) ----
  "oi": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Oi - dezesseis empresas montadas numa só, depois desmontadas",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Operadora brasileira criada pela privatização da Telebras em 1998; entrou em 2016 com o maior pedido de recuperação judicial da história do Brasil e, em 2026, estava em falência, ainda operando provisoriamente.",
    intro: "A Oi começou em 1998 como Tele Norte Leste, uma das doze empresas criadas quando o sistema estatal de telecomunicações foi desmembrado e vendido. Fundiu dezesseis operadoras locais estatais que cobriam o Norte, o Nordeste e o Sudeste, operou como Telemar a partir de 1999, adotou o nome Oi para o serviço móvel em 2002 e o estendeu a tudo a partir de 2007.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "A escala do que foi montado é a parte que vale guardar. Dezesseis empresas estatais separadas, cada uma com sua própria planta, numeração, equipe e prática operacional, foram fundidas numa única operadora por uma transação, e não por um plano, e a rede resultante é aquela de que boa parte do Brasil ainda depende.",
      "Em junho de 2016, ela entrou com um pedido de recuperação judicial de sessenta e cinco bilhões de reais, o maior da história do Brasil. Uma empresa montada pela privatização foi desmontada de novo pelos tribunais, o que está muito longe do argumento usado a favor da venda em 1998. Em 2026, os tribunais foram além: em 26 de agosto de 2026, a Oi informou que o Tribunal de Justiça do Estado do Rio de Janeiro tinha mantido a decisão que converteu a recuperação judicial do grupo em falência. O próprio site hoje a identifica como massa falida em continuação provisória das atividades (Massa Falida de Oi S.A., Em Continuação Provisória de Atividades); os serviços seguem, e a telefonia fixa passa para a OI SERVICOS TELEFÔNICOS S.A. a partir de 1º de novembro de 2026.",
      "Ela aparece ao longo desta linha do tempo como cliente de outra pessoa: a operadora cujos circuitos as integradoras destas páginas instalaram, em cujo backbone os fabricantes de equipamento venderam, e cujo nome aparece muito mais nos históricos de projetos do que nos relatos sobre a indústria.",
    ],
  },
  // ---- okta: pt-BR prose for the record (facts stay in the English record) ----
  "okta": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Okta",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Identidade na nuvem para 10.000 organizações, a compra da Auth0 por US$ 6,5 bilhões e as violações de 2022 e 2023 que mostraram quanto vale para um atacante a central de suporte de um provedor de identidade.",
    intro: "A Okta foi cofundada em janeiro de 2009, em San Francisco, como SaaSure Inc., por Todd McKinnon e Frederic Kerrest, que tinham trabalhado juntos na Salesforce; adotou o nome Okta em 2010, a partir da unidade meteorológica de cobertura de nuvens. Vende gestão de identidade e acesso a partir da nuvem: um serviço de single sign-on para entrar em outros sistemas (a empresa promete um login para Gmail, Workday, Salesforce e Slack), serviços de autenticação de APIs e, desde a compra da Auth0, autenticação para quem constrói aplicações. McKinnon continua CEO; a empresa registrou US$ 2,92 bilhões de receita e 6.366 funcionários em 2026.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "O financiamento e a abertura de capital foram convencionais: US$ 75 milhões em 2015 de Andreessen Horowitz, Greylock e Sequoia a uma avaliação de US$ 1,2 bilhão, uma oferta pública inicial na Nasdaq em 2017 a US$ 17,00 por ação, levantando US$ 187 milhões, a Sequoia como maior acionista, com 21,2 por cento, e mais de 100 milhões de usuários registrados informados em janeiro de 2019. Em 3 de maio de 2021, a Okta concluiu a aquisição da Auth0 numa transação em ações avaliada em cerca de US$ 6,5 bilhões, anunciada em março daquele ano, apresentando-se como a principal provedora independente de identidade, com a confiança de mais de 10.000 organizações. A atSpoke veio em agosto de 2021, por US$ 90 milhões, a Spera em dezembro de 2023, e a Axiom Security, uma empresa de acesso privilegiado centrado em identidade, em setembro de 2025.",
      "As violações são o motivo de este registro ser mais longo do que a lista de produtos. Em 22 de março de 2022, o grupo Lapsus$ publicou capturas de tela dos sistemas internos da Okta; a Okta concluiu que no máximo 366 clientes podem ter sido afetados e que a intrusão começou no computador de um dos engenheiros de suporte ao cliente de uma terceirizada. Em dezembro de 2022, seu código-fonte foi levado do repositório no GitHub.",
      "Depois veio o próprio sistema de suporte. O diretor de segurança da Okta, David Bradbury, expôs a causa raiz em 3 de novembro de 2023: de 28 de setembro a 17 de outubro de 2023, um agente de ameaça usou uma conta de serviço armazenada no sistema de suporte ao cliente para ver arquivos enviados por 134 clientes, menos de um por cento da base, e usou tokens de sessão de cinco deles para sequestrar sessões. O nome de usuário e a senha da conta de serviço tinham sido salvos na conta pessoal do Google de um funcionário, que estava conectada ao navegador Chrome de um laptop gerenciado pela Okta. A 1Password relatou atividade suspeita em 29 de setembro, e a BeyondTrust em 2 de outubro, fornecendo o indicador de IP decisivo em 13 de outubro. A Okta desativou a conta, bloqueou perfis pessoais do Google no Chrome dos dispositivos gerenciados, acrescentou monitoramento ao sistema de suporte e vinculou os tokens de sessão de administradores à localização de rede. Em 29 de novembro de 2023, soube-se que o incidente atingiu todos os usuários do sistema de suporte ao cliente.",
      "A lição é estrutural, e não um veredito sobre uma empresa. A central de suporte de um provedor de identidade recebe os arquivos usados para depurar problemas de login, e esses arquivos carregam as sessões dos próprios administradores dos clientes; quem lê a central de suporte pode se tornar qualquer um deles. As medidas de proteção que a Okta publicou são exatamente as que todo cliente de todo provedor de identidade agora pergunta, e é nesse sentido que o relatório de 2023 prestou um serviço à indústria. Ao lado deste verbete, CyberArk, BeyondTrust e SailPoint contam os lados de acesso privilegiado e de governança de identidade da mesma história.",
    ],
    // Acquisitions: index-aligned with the English list (year, name, price and founder stay English).
    acquisitions: [
      // [0] Auth0 (2021)
      { what: "Autenticação para quem constrói aplicações; o comunicado de fechamento diz que a Auth0 protege bilhões de transações de login por mês. Anunciada em março de 2021 e concluída em 3 de maio de 2021.", sourceNote: "Anexo 99.1 do 8-K da Okta, 3 de maio de 2021, e Wikipedia: Okta, Inc. (lida em 06/10/2026)." },
      // [1] atSpoke (2021)
      { what: "Adquirida em agosto de 2021.", sourceNote: "Wikipedia: Okta, Inc. (lida em 06/10/2026)." },
      // [2] Spera (2023)
      { what: "Uma empresa de segurança adquirida em dezembro de 2023.", sourceNote: "Wikipedia: Okta, Inc. (lida em 06/10/2026)." },
      // [3] Axiom Security (2025)
      { what: "Gestão de acesso privilegiado centrada em identidade para ambientes de nuvem, SaaS e bancos de dados; concluída em setembro de 2025.", became: "Integrada ao Okta Privileged Access.", sourceNote: "Wikipedia: Okta, Inc. (lida em 06/10/2026)." },
    ],
  },
  // ---- penso: pt-BR prose for the record (facts stay in the English record) ----
  "penso": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Penso - um milhão de caixas postais e um provedor pioneiro por trás",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Empresa brasileira de serviços de TI fundada em 2003, cujos fundadores ajudaram a criar um dos primeiros provedores de internet do país.",
    intro: "A Penso Tecnologia é uma empresa de serviços de São Paulo fundada em 2003, que hoje atua em nuvem, e-mail corporativo e colaboração, backup e recuperação de desastres. Seus fundadores tinham participado antes da criação da STI Internet, um dos primeiros provedores brasileiros depois que o serviço foi aberto ao uso comercial.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "Essa participação anterior é o que a situa nesta linha do tempo. As pessoas que construíram o primeiro acesso comercial à internet no Brasil não pararam de trabalhar quando essa fase acabou; criaram as empresas seguintes, e a ligação entre a chegada da internet comercial em meados dos anos 1990 e o mercado de serviços que veio depois passa por indivíduos, e não por instituições.",
      "O negócio em que ela se transformou é incomum num aspecto que vale registrar. Ela gerencia mais de um milhão de caixas postais corporativas, construídas em boa parte sobre o Zimbra e consolidadas por meio de aquisições: uma prática nacional de e-mail e colaboração num momento em que quase toda organização desse porte tinha migrado para uma de duas suítes americanas. Alguém precisa operar a alternativa, e há mais dela do que a narrativa do mercado sugere.",
      "Dois números do próprio relato da empresa descrevem o modelo de serviços melhor do que qualquer descrição: cerca de mil e seiscentos clientes, e uma relação média com cada cliente de uns oito anos. Num mercado em que a tecnologia é substituída a cada poucos anos, a relação dura mais do que quase tudo o que está instalado debaixo dela.",
    ],
  },
  // ---- prometric: pt-BR prose for the record (facts stay in the English record) ----
  "prometric": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Prometric",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Seis donos em trinta e cinco anos, e a camada que deliberadamente não escreve as questões que aplica.",
    intro: "A Drake International criou a Drake Prometric em 1990 para operar centros de testes informatizados e, depois de vendê-la, fundou a Kryterion, que aparece separadamente nesta linha do tempo. A Sylvan Learning a comprou em 1995 por cerca de US$ 44,5 milhões em dinheiro e ações, a Thomson Corporation em 2000 por aproximadamente US$ 775 milhões, o Educational Testing Service em 2007 por US$ 435 milhões, a Baring Private Equity Asia em 2018, e hoje ela está com a EQT. Seis donos em trinta e cinco anos, para um negócio cujo produto inteiro é merecer confiança.",
    // Body: 7 paragraph(s), same order as the English.
    body: [
      "O fato estrutural é o que a maioria das pessoas entende errado, e merece ser dito primeiro: a Prometric não escreve os exames. Seus clientes desenvolvem o conteúdo, escrevem as questões e definem as notas de aprovação. A Prometric fornece a aplicação segura, a verificação de identidade, a supervisão e a divulgação dos resultados. Essa separação é deliberada, e é a fonte da credibilidade da indústria: a organização que decide o que é competência não é a que decide se você a demonstrou, e nenhuma das duas pode ajustar em silêncio o trabalho da outra.",
      "O que torna um período de sua história genuinamente interessante. De 2007 a 2018, a Prometric pertenceu ao Educational Testing Service, autor do SAT e do GRE. Durante onze anos, um grande autor de exames foi dono de um grande aplicador de exames. Nada de impróprio foi alegado, e os próprios testes do ETS não eram o grosso do que a Prometric aplicava. Mas o arranjo é exatamente aquele que a separação de poderes da indústria foi desenhada para evitar, e ele terminou: o ETS vendeu em 2018. A mesma pergunta paira, sem resposta, sobre os negócios de exames e de credenciais que hoje têm o mesmo dono, e vale apontar o paralelo, porque ceticismo aplicado seletivamente não é ceticismo.",
      "O arco de preços é a ilustração mais limpa de uma bolha nesta linha do tempo. A Sylvan pagou cerca de US$ 44,5 milhões em 1995. A Thomson pagou aproximadamente US$ 775 milhões em 2000, no auge da bolha pontocom. O ETS pagou US$ 435 milhões em 2007, pouco mais da metade do que a Thomson tinha pago sete anos antes. O negócio não tinha encolhido. O que tinha encolhido era a opinião do mercado sobre quanto valia uma rede de testes.",
      "Um detalhe menor que vale guardar: o ETS tinha vendido à Thomson um negócio de testes chamado CapStar por cerca de US$ 200 milhões em 2004, e o recebeu de volta três anos depois como parte da compra da Prometric. Vender algo e recomprá-lo dentro de um negócio maior é mais comum nesta indústria do que qualquer um gosta de admitir.",
      "A lista de clientes explica por que o que está em jogo é maior do que a certificação em tecnologia: o United States Medical Licensing Examination, os exames de enfermagem, as licenças de regulação financeira, o exame de registro em arquitetura. Não são credenciais que melhoram um currículo; são as que decidem se alguém pode exercer a profissão. Uma falha de aplicação nesse contexto não é um inconveniente.",
      "E a aplicação falha. A edição de agosto de 2023 do Law School Admission Test gerou queixas generalizadas dos candidatos, especialmente dos que faziam a prova remotamente. As falhas de uma empresa de infraestrutura são a única parte do seu trabalho que fica visível, e fingir que elas não acontecem seria um jeito estranho de descrever um negócio cujo produto é a confiabilidade.",
      "Lidas ao lado da Pearson VUE, as duas definem o mercado. Ambas operam redes globais de centros, ambas acrescentaram supervisão remota, ambas aplicam provas para centenas de entidades certificadoras, e nenhuma escreve o que aplica. A diferença interessante está no histórico de controle, e não na capacidade: uma está dentro de um único grupo de educação há um quarto de século; a outra passou por uma empresa de recrutamento, uma rede de reforço escolar, um conglomerado de mídia, um autor de testes e duas gestoras de private equity. Se a estabilidade ou a circulação produz o melhor guardião dos exames alheios é uma pergunta que o registro não resolve.",
    ],
    // Acquisitions: index-aligned with the English list (year, name, price and founder stay English).
    acquisitions: [
      // [0] Drake Prometric (by Sylvan Learning) (1995)
      { what: "O negócio de testes informatizados criado pela Drake International em 1990.", became: "Sylvan Prometric." },
      // [1] Sylvan Prometric (by Thomson) (2000)
      { what: "Comprada no auge da bolha pontocom.", became: "Thomson Prometric, e uma avaliação que a venda seguinte não alcançaria." },
      // [2] Prometric (by ETS) (2007)
      { what: "Vendida pela Thomson ao sair da educação; o ETS também recuperou a CapStar, que tinha vendido à Thomson por cerca de US$ 200 milhões em 2004.", became: "Onze anos sob o controle de um grande autor de exames.", sourceNote: "O preço é pouco mais da metade do que a Thomson pagou sete anos antes: a ilustração isolada mais clara do pico de avaliações de 2000 nesta linha do tempo." },
      // [3] Prometric (by Baring Private Equity Asia) (2018)
      { what: "O ETS se desfez dela; a BPEA depois passou a fazer parte da EQT.", became: "Controle de private equity, e o fim do arranjo em que o autor era dono do aplicador." },
    ],
  },
  // ---- proteus: pt-BR prose for the record (facts stay in the English record) ----
  "proteus": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Proteus - a metade brasileira",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Empresa brasileira de segurança comprada pela Patria em 2021 e incorporada à SEK.",
    intro: "A Proteus foi a empresa brasileira de segurança da informação que a Patria Investimentos adquiriu em 2021, e uma das duas empresas combinadas em 2023 para criar a SEK.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "Ela aparece aqui como metade de uma fusão, e não por conta própria, e essa é a forma honesta do que se consegue alcançar: a cobertura da transação é extensa, e a cobertura da empresa antes dela é escassa. Uma empresa pode ser substancial o bastante para ancorar uma estratégia de consolidação de duzentos e cinquenta milhões de dólares e ainda assim deixar a maior parte de sua própria história por escrever.",
      "De todo modo, o ponto é o par. Uma empresa chilena e uma brasileira foram compradas para serem combinadas, o que significa que o comprador lia a região como um mercado único antes que qualquer uma das duas empresas o fizesse.",
      "Sua origem está documentada, e seu ano de fundação não, uma combinação incomum que vale dizer com clareza. A Exame situou a origem da empresa em 1995, quando Joao Mendes Carvalho e Marcelo Weyne Romcy, estudantes de ciência da computação da Universidade Federal do Ceará, criaram um CD que guiava o usuário para entrar na internet e o venderam a cem provedores pelo país. Depois passaram seis meses estudando segurança de redes antes de construir a ferramenta de avaliação que era a base do negócio, levaram a empresa do Ceará para São Paulo e mais tarde abriram operação nos Estados Unidos. Se 1995 é a fundação da empresa ou o começo da parceria que a produziu, as fontes não dizem.",
      "O nome registrado completo era Proteus Risk Management. A Patria Investimentos montou o veículo que a comprou em outubro de 2021, originalmente chamado CBS CyberSecurity Holding, e adquiriu no mesmo movimento a chilena NeoSecure: duas empresas compradas para serem combinadas, e não operadas separadamente.",
      "A combinação foi lançada como SEK, Security Ecosystem Knowledge, em 30 de março de 2023, depois de cerca de 100 milhões de dólares gastos na integração das duas, diante de um compromisso declarado de 250 milhões com o setor. Estreou com 650 clientes, 100 milhões de dólares de receita em 2022 e cerca de 750 pessoas, com a Patria detendo 80 por cento. A SEK comprou depois a CleanCloud em 2023 e a Proof em 2024.",
      "O que aconteceu com o nome Proteus é o destino comum de uma empresa comprada para ser fundida: sobreviveu cerca de dezoito meses como marca e depois virou parte da marca de outra. A engenharia e a base de clientes seguiram adiante; o nome, não.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "Seu registro foi baixado em 1º de dezembro de 2021, por incorporação a outra empresa; o cadastro não informa qual empresa a incorporou.",
  },
  // ---- qos-training: pt-BR prose for the record (facts stay in the English record) ----
  "qos-training": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "QoS - um centro de treinamento Juniper para a América Latina",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Ministra os cursos de certificação do fabricante desde 2006, de dentro de uma integradora.",
    intro: "A QoS é a divisão de serviços profissionais do Grupo Binario e operou como centro de treinamento Juniper para a América Latina, ministrando os cursos de certificação do fabricante desde 2006, com mais de três mil alunos até 2016.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "Um centro de treinamento operado de dentro de uma integradora é um arranjo específico com uma vantagem específica: os instrutores são os engenheiros que implementam as redes, de modo que o material do curso é testado contra implantações reais, e não apenas contra um currículo. Tem um risco correspondente: a capacidade de ensinar compete pelas mesmas pessoas com o trabalho de projeto faturável.",
      "Um detalhe do anúncio de 2016 vale guardar, porque descreve um atrito real da certificação: antes, os alunos terminavam o curso e depois viajavam para outro lugar para fazer o exame, o que somava custo e atraso. Oferecer o exame no mesmo lugar e na mesma data eliminou uma lacuna que não tinha nada a ver com aprendizado e tudo a ver com logística, o tipo de problema que decide quantos engenheiros um país de fato certifica.",
      "A QoS é uma divisão do Grupo Binario, criado em São Paulo em 2005, que dividia seu trabalho entre a Binario, para integração, e a QoS, para serviços profissionais, com uma terceira divisão de mobilidade durante um período. Em 2018, o grupo tinha mais de 150 funcionários e cinco filiais, e mantinha um armazém próprio em Miami para encurtar o ciclo de importação, um detalhe que diz muito sobre o que vender equipamento de rede no Brasil realmente envolve.",
      "O treinamento Juniper começou em 2006, um ano depois da fundação do grupo, e até 2016 tinha formado 3.208 alunos em 389 turmas. O grupo reunia cerca de 80 profissionais certificados Juniper, com mais de 200 certificações entre eles, chegando ao nível de parceiro Elite e recebendo o prêmio Americas Services Partner of the Year da Juniper referente a 2017. Em 2016, a QoS começou a aplicar o exame de certificação no mesmo dia do curso, o que elimina a lacuna em que a maioria dos candidatos, sem alarde, nunca chega a fazer a prova.",
    ],
  },
  // ---- quad9: pt-BR prose for the record (facts stay in the English record) ----
  "quad9": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Quad9 - um resolver público que bloqueia por padrão",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Resolver recursivo público sediado na Suíça, que se recusa a responder por domínios sabidamente maliciosos.",
    intro: "O Quad9 opera um resolver DNS recursivo público a partir da Suíça, e sua escolha distintiva é que o bloqueio é o padrão, e não uma opção: consultas a domínios presentes em seus feeds de ameaças não recebem resposta.",
    // Body: 7 paragraph(s), same order as the English.
    body: [
      "Isso faz dele o exemplo prático mais claro de DNS como controle de segurança disponível para qualquer pessoa, sem appliance nem assinatura. Apontar um resolver para ele aplica um feed de ameaças a todos os dispositivos da rede, inclusive aos que não conseguem rodar um agente.",
      "A jurisdição suíça faz parte do design, e não é um detalhe da constituição da entidade, porque a pergunta que um resolver público precisa responder é o que acontece com o log de consultas. A postura de privacidade de um resolver é uma posição jurídica tanto quanto técnica, e é a propriedade que vale comparar entre provedores.",
      "A afirmação acima, de que a postura de privacidade de um resolver é uma posição jurídica, foi posta à prova entre 2021 e 2023, e o resultado é mais instrutivo do que qualquer um dos lados esperava. Em junho de 2021, um tribunal de Hamburgo, a pedido da Sony Music, ordenou ao Quad9 que deixasse de resolver um site que trazia links para gravações piratas. A ordem foi a primeira do tipo contra um resolver público. O tribunal entendeu que um serviço de DNS não goza das proteções de responsabilidade de um provedor de internet ou de um registrador de domínios, e fixou a multa por descumprimento em 250.000 euros por consulta infratora.",
      "Todos os elementos do caso estavam fora da Alemanha. O domínio ficava sob o domínio de topo de Tonga, os servidores dele e os servidores para os quais ele apontava estavam em outros lugares, e o Quad9 não tinha escritório nem presença no país. A jurisdição suíça não impediu o processo: um tratado entre a Suíça e a União Europeia permitiu que a liminar fosse cumprida do outro lado da fronteira. E como a geolocalização não consegue excluir com certeza os usuários de um país, o autor da ação exigiu, e a fundação, diante daquela multa por consulta, implementou, um bloqueio que valia para todos os que usavam o resolver, em qualquer lugar.",
      "Esse é o mecanismo que vale guardar. Uma ordem judicial nacional, aplicada a um serviço usado no mundo todo, virou um bloqueio global apenas pela imprecisão da geolocalização; a fragmentação que o verbete da Cisco descreve chegando pelas mãos de governos chegou aqui pelas mãos de uma gravadora. O Tribunal Regional de Leipzig foi além em março de 2023 e considerou o resolver responsável, como infrator, pelo que seus usuários faziam com a resposta a uma consulta.",
      "O Tribunal Regional Superior de Dresden reverteu isso em dezembro de 2023: um resolver não tem papel central na infração e não pode ser responsabilizado por ela. O argumento da fundação tinha sido o mesmo que o artigo da família DNS deste catálogo faz em bases técnicas: um resolver repassa metadados, não armazena conteúdo e é, no máximo, um conduto. O tribunal de apelação concordou. Levou dois anos e meio, e um tribunal italiano chegou à conclusão oposta sobre o resolver da Cloudflare no mesmo período.",
      "Duas coisas sobrevivem ao caso. A primeira é que a pergunta sobre quem pode obrigar um fornecedor, feita em outro ponto deste catálogo a respeito de serviços de inteligência, tem também uma resposta no direito civil, e quem obriga não precisa ser um Estado. A segunda é que a estrutura da multa fez o trabalho antes de a questão jurídica ser resolvida: uma ameaça precificada por consulta é existencial para um serviço que responde a bilhões delas, e um bloqueio global foi implementado sob essa pressão e só retirado quando a apelação foi bem-sucedida. A decisão final foi a correta. O serviço já tinha sido obrigado a se comportar como se estivesse errado.",
    ],
  },
  // ---- riverstone: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "riverstone": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Riverstone Networks",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Desmembrada da Cabletron para correr atrás do boom da Ethernet metropolitana, ficou sem estrada quando o boom parou.",
    intro: "A Riverstone começou como Yago Systems, uma startup que construía switching de Camada 3 em velocidade de linha, adquirida pela Cabletron em 1998 e usada como base da sua linha SmartSwitch Router. Quando a Cabletron se dividiu em quatro empresas na virada do milênio, o negócio de roteamento virou a Riverstone Networks e foi desmembrado como empresa independente de capital aberto em 2001.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "Seu mercado era a Ethernet metropolitana: operadoras trocando equipamentos SONET e ATM por Ethernet em redes do tamanho de uma cidade, entregando serviços a clientes empresariais sobre anéis de fibra. Era uma categoria genuinamente nova por volta de 2000, e a Riverstone esteve entre as empresas que definiram como deveria ser o equipamento para ela: Gigabit Ethernet, MPLS e entrega de serviços por assinante em caixas projetadas para a central de uma operadora, e não para o armário de cabeamento de uma empresa.",
      "O problema foi o momento. A empresa foi desmembrada exatamente quando os investimentos em telecom desabaram. As operadoras que vinham construindo redes metropolitanas pararam, e um fabricante cujo mercado inteiro era o gasto das operadoras não tinha para onde ir.",
      "Uma investigação contábil sobre a forma como a receita tinha sido reconhecida piorou as coisas, atrasando relatórios e forçando republicações de resultados. A Riverstone entrou com pedido de Chapter 11 em fevereiro de 2006, e seus ativos foram comprados pela Lucent Technologies, que se fundiu com a Alcatel no fim do mesmo ano; assim, a tecnologia acabou dentro da Alcatel-Lucent e, mais tarde, dentro da Nokia.",
      "Não foi a engenharia que falhou. O encaminhamento em velocidade de linha da Yago era bom o bastante para que a Cabletron construísse sobre ele sua geração seguinte, e a tese da Ethernet metropolitana se revelou correta: ela apenas chegou vários anos antes de o mercado estar disposto a pagar por ela, e a Riverstone não tinha balanço para esperar.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "Ativos adquiridos pela Lucent Technologies no começo de 2006, depois de um pedido de Chapter 11, e absorvidos pela Alcatel-Lucent quando as duas se fundiram no fim daquele ano.",
    // Profile: complete copy of profiles/riverstone.ts; years, companies, founders, personal markers and hrefs come from the English.
    profile: {
      // Same slug as the English profile.
      slug: "riverstone",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          company: "Yago Systems",
          year: 1996,
          place: "Sunnyvale, Califórnia",
          founders: ["Piyush Patel","Romulus Pereira"],
          story: "Fundada em setembro de 1996 por três sócios, entre eles Patel e Pereira, este recém-saído da Cisco e da Kalpana, a empresa que tinha inventado o switch Ethernet. A Yago construía switching de Camadas 3/4 em velocidade de linha para backbones Gigabit Ethernet a partir de um escritório em Sunnyvale, na Vaqueros Avenue, com enxutos US$ 4,9 milhões de investidores que incluíam a Sequoia Capital. A Cabletron ficou cedo com um quarto da empresa, anunciou a aquisição do restante em janeiro de 1998 por cerca de US$ 90 milhões e concluiu o negócio em 17 de março de 1998 a um custo registrado de US$ 165,7 milhões; depois, nas palavras do próprio prospecto, 'renamed Yago to Riverstone' (rebatizou a Yago como Riverstone).",
        },
        {
          company: "Riverstone Networks",
          year: 2000,
          place: "Santa Clara, Califórnia",
          founders: ["Romulus Pereira","the Yago engineering team"],
          story: "Nascida na divisão da Cabletron em quatro, em fevereiro de 2000, como a empresa voltada a provedores de serviço: cerca de 250 pessoas em torno da linha SmartSwitch Router derivada da Yago, lideradas por Pereira como CEO, mirando as redes metropolitanas que as operadoras corriam para construir. Foi aqui que eu trabalhei de 2000 a 2002: Santa Clara, no centro da onda da Ethernet de operadora, na empresa cujo DNA de engenharia ressurgiu depois na Versa Networks.",
        },
      ],
      // Timeline: same events, same order, same years and personal markers; prose translated.
      timeline: [
        { year: 1996, title: "Fundação da Yago Systems", detail: "Setembro de 1996, Sunnyvale: roteamento em velocidade de linha e switching de Camada 4 para a era Gigabit Ethernet, de uma equipe de três fundadores que incluía Piyush Patel e Romulus Pereira, engenheiro vindo da Cisco e da Kalpana." },
        { year: 1998, title: "A Cabletron conclui a compra da Yago", detail: "Anunciada em janeiro por cerca de US$ 90 milhões e concluída em 17 de março de 1998 a um custo registrado de US$ 165,7 milhões em ações, com US$ 150 milhões lançados como P&D em andamento. A Cabletron rebatiza a Yago como Riverstone; o SmartSwitch Router vira o carro-chefe do grupo.", sourceNote: "Documentos 10-Q/A da Cabletron e 424B4 da Riverstone na SEC." },
        { year: 2000, personal: true, title: "A divisão cria a Riverstone", detail: "Fevereiro de 2000: a divisão da Cabletron em quatro faz da Riverstone a empresa de provedores de serviço (Santa Clara, Pereira como CEO, versões da linha Yago voltadas a operadoras). Eu entro no mesmo ano." },
        { year: 2001, title: "IPO e independência", detail: "16 de fevereiro de 2001: a Riverstone vende 10,0 milhões de ações a US$ 12, com receita líquida de US$ 108,8 milhões, um dos poucos IPOs de redes a sair depois do estouro da bolha. Em agosto, a Cabletron distribui sua participação de 87 por cento aos acionistas e se dissolve; a Riverstone é o único spin-off de verdade da divisão.", sourceNote: "10-K da Enterasys do ano fiscal de 2002; 8-K da Cabletron, 30 de julho de 2001." },
        { year: 2002, title: "A SEC bate à porta", detail: "A Riverstone revela uma investigação da SEC sobre sua contabilidade de receitas; a ação cai pela metade, para US$ 7,70, apagando quase um bilhão de dólares de valor enquanto o colapso das telecomunicações destrói o gasto das operadoras." },
        { year: 2003, title: "A republicação dos resultados", detail: "Agosto de 2003: os resultados dos anos fiscais de 2002 e 2003 são republicados; a denúncia posterior da SEC calculou a receita inflada em quase US$ 30 milhões, vinda de negócios irregulares. A receita trimestral cai para US$ 12,7 milhões, ante US$ 30,1 milhões um ano antes." },
        { year: 2004, title: "Arrumação sob nova direção", detail: "Um acordo de US$ 18,5 milhões nas ações coletivas de investidores é fechado em março de 2004; a empresa ainda tem US$ 254,4 milhões em caixa, mas enfrenta o processo de patentes da Toshiba, uma arbitragem com a Enterasys e a deslistagem: a negociação passa para as Pink Sheets, como RSTN.PK." },
        { year: 2006, title: "Section 363 por escolha", detail: "7 de fevereiro de 2006: a Riverstone assina com a Lucent um acordo de compra de ativos de US$ 170 milhões e entra com pedido de Chapter 11 em Delaware na mesma semana, de propósito, como empresa solvente (cerca de US$ 98 milhões em ativos contra US$ 130 milhões em passivos na petição, além do caixa), usando o leilão supervisionado da Section 363 para vender de forma limpa e se dissolver.", sourceNote: "8-K da Riverstone na SEC, 7 de fevereiro de 2006." },
        { year: 2006, title: "A Lucent supera a Ericsson: US$ 207 milhões", detail: "21 de março de 2006: a Lucent vence o leilão com US$ 207 milhões em dinheiro, elevando a própria oferta em US$ 37 milhões para superar o lance de US$ 178 milhões da Ericsson. A venda é concluída em maio; a empresa remanescente passa a se chamar RNI Wind Down Corporation, e os acionistas recebem inicialmente US$ 1,06 por ação, contra o preço de US$ 12 do IPO.", sourceNote: "Computerworld/Network World, março de 2006; NH Business Review." },
        { year: 2006, title: "Para dentro da Alcatel-Lucent, e para fora", detail: "1º de dezembro de 2006: a Lucent conclui sua fusão entre iguais com a Alcatel. Os produtos da Riverstone se sobrepõem ao portfólio combinado, e a linha é descontinuada: o fio Yago-Riverstone termina dentro da Alcatel-Lucent, oito anos e três donos depois do SmartSwitch Router dos tempos de garagem." },
      ],
      // Products: names as the vendor writes them (generic descriptors localised); descriptions translated.
      products: [
        { name: "Switch routers RS", what: "Os switch routers multicamada RS 3000/8000/8600/32000/38000: a linhagem SmartSwitch da Yago reconstruída para operadoras, feita sob medida para IP sobre Ethernet e serviços de VPN MPLS em redes metropolitanas." },
        { name: "RapidOS", what: "O sistema operacional de classe operadora da Riverstone: MPLS, contabilização por fluxo via LFAP, RMON e o Hitless Protection System, com failover do módulo de controle e até atualizações de software sem derrubar sessões de tráfego." },
        { name: "Riverstone 15000", what: "A linha de edge routers Ethernet que, com a família RS, fez da Riverstone o primeiro fabricante de routers Ethernet MPLS listado pelo Rural Utilities Service do USDA, abrindo o financiamento de banda larga rural ao seu equipamento." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "Camadas 3/4 em velocidade de linha, em silício", detail: "A herança da Yago: roteamento e inteligência de Camada 4 em velocidade de switch, em hardware, quando a maioria dos routers ainda fazia isso em software." },
        { title: "Carrier Ethernet antes do nome", detail: "A Riverstone vendia Ethernet a operadoras para serviços triple play metropolitanos anos antes de 'Carrier Ethernet' virar a bandeira da indústria, o mercado que a Lucent e a Ericsson depois disputaram em leilão." },
        { title: "Operação sem interrupção", detail: "O Hitless Protection System do RapidOS mantinha as sessões vivas durante failovers do controle e atualizações de software: um patamar de disponibilidade definido para equipamento de operadora." },
        { title: "A falência como instrumento", detail: "O pedido de 2006 foi estratégia, e não colapso: uma empresa solvente usando a Section 363 para conduzir um leilão supervisionado limpo, e o leilão funcionou, somando US$ 37 milhões ao preço inicial." },
      ],
      // Markets paragraphs, same count.
      markets: [
        "A Riverstone competiu em Ethernet metropolitana e de operadora contra Cisco, Extreme e Foundry, vendendo a operadoras, provedores de internet e operadoras de cabo que construíam redes triple play. O escândalo contábil de 2002-2003 e a depressão das telecomunicações quebraram sua independência; a tecnologia era valiosa o bastante para que a Lucent e a Ericsson disputassem os restos em lances.",
        "A rede de ex-funcionários é o legado vivo desta página: Kumar e Apurva Mehta, ambos em cargos de liderança na Riverstone e na Yago antes dos anos de Juniper, fundaram depois a Versa Networks; e eu, que trabalhei aqui de 2000 a 2002, ensino hoje as tecnologias sucessoras de toda essa era.",
      ],
      // Analyst statements, same count.
      analyst: [
        "O veredito do leilão sobre a tecnologia: a Lucent elevou o próprio lance de stalking horse em US$ 37 milhões para vencer com US$ 207 milhões, contra os US$ 178 milhões da Ericsson; os dois gigantes queriam o portfólio de Ethernet metropolitana para preencher lacunas em dados.",
        "O balanço do acionista, conforme o registro público: um IPO a US$ 12 em fevereiro de 2001, US$ 7,70 depois da revelação da SEC e US$ 1,06 por ação devolvidos inicialmente na liquidação.",
      ],
      // Career link: href from the English profile, label translated.
      careerLink: { href: "/industry/versa", label: "Os ex-funcionários da Riverstone Kumar e Apurva Mehta fundaram a Versa Networks: a página da linhagem Versa" },
    },
  },
  // ---- sage-networks: pt-BR prose for the record (facts stay in the English record) ----
  "sage-networks": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Sage Networks - mitigação é um problema de rede",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Empresa brasileira de engenharia de redes fundada em 2018, especializada em defesa contra negação de serviço.",
    intro: "A Sage Networks é uma empresa de engenharia de redes fundada em 2018 na região de Campinas, que trabalha com defesa contra negação de serviço distribuída: appliances on-premises, detecção automática, mitigação em nuvem e um centro de operações com equipe permanente.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "Escolher a negação de serviço como especialidade diz algo sobre onde a dificuldade realmente está. Mitigação não é uma decisão de produto, é uma decisão de roteamento: a questão é onde o tráfego é absorvido e com que rapidez o caminho pode ser mudado, o que faz dela um problema de engenharia de redes com rótulo de segurança.",
      "A combinação que ela vende reflete isso. O equipamento on-premises cuida do que cabe no link; a mitigação em nuvem cuida do que não cabe, porque nenhuma capacidade local sobrevive a um ataque maior do que o circuito. Decidir o que é o quê, nos segundos disponíveis, é para isso que serve o centro de operações.",
      "É também uma empresa jovem num mercado cujos incumbentes são grandes e estabelecidos há muito tempo. A defesa contra negação de serviço recompensa isso: as decisões são operacionais e tomadas em segundos, e uma equipe pequena dona do próprio caminho de mitigação consegue responder mais depressa do que um processo que precisa atravessar três departamentos.",
    ],
  },
  // ---- solarwinds: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "solarwinds": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "SolarWinds",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Vendia o software que vigia tudo, e é exatamente por isso que alguém o quis.",
    intro: "A SolarWinds foi fundada em 1999 em Tulsa, Oklahoma, por dois irmãos, Donald Yonce, ex-executivo do Walmart, e David Yonce. O negócio era sem glamour e muito bom: monitoramento de redes acessível para as pessoas que de fato operam redes, vendido sem a máquina de vendas corporativas que encarecia os concorrentes. A empresa se mudou para Austin e, em 2020, sua plataforma Orion estava dentro de uma fatia enorme das organizações que importam.",
    // Body: 8 paragraph(s), same order as the English.
    body: [
      "A sacada comercial foi perceber que o monitoramento era caro demais e vendido demais. Um engenheiro de redes que precisava saber se um link estava saturado não queria um ciclo de compras de seis meses, e a SolarWinds montou um catálogo de ferramentas que podiam ser baixadas, testadas e compradas no cartão. Esse modelo a levou de Tulsa à abertura de capital em outubro de 2018, e no caminho ela comprou sua entrada em categorias vizinhas: Pingdom para verificações externas de disponibilidade, Papertrail para agregação de logs, Loggly, AppOptics.",
      "E então vem o que faz esta página valer a leitura. Em outubro de 2019, atacantes que já estavam dentro da SolarWinds começaram a testar se conseguiam injetar código no build do Orion. Cerca de quatro meses depois, conseguiram e, a partir de 26 de março de 2020, a própria SolarWinds distribuiu o resultado, um backdoor que a indústria batizou de SUNBURST, dentro de atualizações legítimas e assinadas das versões 2019.4 a 2020.2.1 do Orion.",
      "Ele só foi descoberto em dezembro de 2020, e não pela SolarWinds. A FireEye o encontrou ao investigar o próprio comprometimento, o que vale notar porque a FireEye também aparece nesta linha do tempo: uma empresa de segurança encontrou o maior ataque de supply chain da história ao investigar como ela mesma tinha sido invadida. Em abril de 2021, os governos dos Estados Unidos e do Reino Unido atribuíram a operação ao serviço de inteligência externa da Rússia, o SVR, o grupo rastreado como APT29 ou Cozy Bear.",
      "O número que todo mundo cita precisa de uma ressalva. Cerca de 18.000 clientes receberam a atualização com o backdoor. A avaliação do próprio governo americano foi que um número muito menor foi de fato comprometido por atividade subsequente, porque o backdoor era uma porta, e não uma ocupação: os atacantes escolhiam por onde atravessá-la, e foram extremamente seletivos. Repetir 18.000 como contagem de vítimas é exagerar, e a distinção entre ter o malware e ser explorado por meio dele é exatamente a distinção que um profissional de segurança é pago para entender.",
      "O detalhe da resposta que fica na memória: a SolarWinds não podia usar o próprio e-mail para coordenar a investigação, porque os atacantes o estavam lendo. A equipe trabalhou por telefone e por contas externas, durante uma pandemia, de casa. O CEO brincou depois que cada vírgula do primeiro documento enviado aos reguladores custou à empresa US$ 20.000 em honorários advocatícios.",
      "Depois vem a discussão sobre a culpa, que não está resolvida e é apresentada aqui como não resolvida. Em outubro de 2023, a SEC acusou a SolarWinds e seu diretor de segurança da informação, Timothy Brown, de fraude, alegando que, desde a abertura de capital de 2018, a empresa divulgava apenas riscos genéricos enquanto sabia internamente de deficiências específicas. A SolarWinds chamou a ação de tentativa de \"revictimise the victim\" (revitimizar a vítima) e disse que suas divulgações eram precisas. Em julho de 2024, um juiz federal rejeitou a maior parte do processo, incluindo tudo o que dizia respeito às divulgações feitas depois do ataque, mas permitiu que seguisse a acusação baseada na declaração de segurança publicada pela empresa.",
      "Esse desfecho é a parte com dentes para quem trabalha nesta área. Uma pessoa nomeada foi acusada pessoalmente pela forma como uma violação foi descrita e, embora a maior parte do processo não tenha sobrevivido, a parte sobrevivente diz respeito a uma página de marketing sobre práticas de segurança. O que uma empresa diz sobre a própria postura virou matéria de direito do mercado de capitais, e todo CISO que lê isto hoje escreve de outro jeito por causa disso.",
      "A lição para os profissionais é arquitetônica, e não moral, e este site já traz a sua gêmea. A pane da CrowdStrike em julho de 2024 derrubou 8,5 milhões de máquinas porque um agente confiável com acesso profundo é atualizado de forma central e rápida. O SUNBURST comprometeu milhares de redes pela mesma razão estrutural. Uma foi um acidente e a outra, uma operação de inteligência, e a propriedade que exploraram era idêntica: construímos uma indústria sobre software que se atualiza a partir de uma única fonte, e a confiança nesse canal sustenta a estrutura inteira.",
    ],
    // Acquisitions: index-aligned with the English list (year, name, price and founder stay English).
    acquisitions: [
      // [0] Pingdom (2014)
      { what: "Monitoramento externo de disponibilidade e desempenho, verificado de fora da rede, e não de dentro dela.", became: "A linha de monitoramento em nuvem da SolarWinds." },
      // [1] Papertrail (2015)
      { what: "Agregação de logs hospedada e live tail, popular entre pequenas equipes de engenharia por ser útil de imediato.", became: "Parte do mesmo portfólio de nuvem, mantida com nome próprio." },
      // [2] Librato and TraceView (2015)
      { what: "Métricas e tracing de aplicações, comprados da AppNeta.", became: "AppOptics, que fundiu os dois num único produto." },
    ],
    // Profile: complete copy of profiles/solarwinds.ts; years, companies, founders, personal markers and hrefs come from the English.
    profile: {
      // Same slug as the English profile.
      slug: "solarwinds",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          company: "SolarWinds",
          year: 1999,
          place: "Tulsa, Oklahoma",
          founders: ["Donald Yonce","David Yonce"],
          story: "Dois irmãos, um deles ex-executivo do Walmart, construindo monitoramento de redes para as pessoas que operam redes, e não para as que assinam a compra. A empresa depois se mudou para Austin, onde continua.",
        },
      ],
      // Timeline: same events, same order, same years and personal markers; prose translated.
      timeline: [
        { year: 1999, title: "Fundada em Tulsa", detail: "Monitoramento acessível vendido sem uma máquina de vendas corporativas." },
        { year: 2016, title: "Capital fechado", detail: "Thoma Bravo e Silver Lake compraram a empresa por cerca de US$ 4,5 bilhões." },
        { year: 2018, title: "Volta à bolsa", detail: "Abriu capital em outubro, levantando US$ 375 milhões a uma avaliação de US$ 4,6 bilhões, com as duas gestoras de private equity mantendo cerca de 65% das ações com direito a voto." },
        { year: 2019, title: "Começa a intrusão", detail: "Outubro: as primeiras injeções de teste no build do Orion." },
        { year: 2020, title: "SUNBURST distribuído, depois encontrado", detail: "De 26 de março a dezembro, da primeira atualização com backdoor à descoberta." },
        { year: 2021, title: "Atribuição", detail: "Em abril, os Estados Unidos e o Reino Unido atribuíram a operação ao SVR da Rússia." },
        { year: 2025, title: "Capital fechado de novo, mais ou menos pelo preço de partida", detail: "A Turn/River Capital fechou acordo em 7 de fevereiro para comprar a empresa a US$ 18,50 por ação, cerca de US$ 4,4 bilhões, e concluiu a compra em 16 de abril; a ação saiu da Bolsa de Nova York. Nove anos antes, a mesma empresa tinha tido o capital fechado por cerca de US$ 4,5 bilhões. Passou por uma abertura de capital e pelo maior ataque de supply chain de software já registrado, e saiu mais ou menos de onde entrou." },
        { year: 2025, title: "O caso da SEC termina, em grande parte", detail: "As acusações restantes foram rejeitadas em novembro, encerrando uma ação que corria desde outubro de 2023." },
      ],
      // Products: names as the vendor writes them (generic descriptors localised); descriptions translated.
      products: [
        { name: "Orion, e a SolarWinds Platform", what: "A plataforma de monitoramento (desempenho de rede, monitoramento de servidores e aplicações, gestão de configuração) e o produto cujo sistema de build foi comprometido." },
        { name: "SolarWinds Observability", what: "A plataforma atual, oferecida tanto como serviço hospedado quanto self-hosted, o que, para uma parte substancial desta base de clientes, não é preferência, mas exigência." },
        { name: "Database Performance Analyzer e SQL Sentry", what: "Monitoramento de bancos de dados, vendido sob uma licença combinada: uma especialidade sem glamour, com seguidores fiéis entre as pessoas que de fato otimizam consultas." },
        { name: "Service Desk", what: "Gestão de serviços de TI, acrescentada para pôr o chamado ao lado do alerta." },
        { name: "Pingdom, Papertrail, Loggly e AppOptics", what: "Ferramentas adquiridas de monitoramento externo, agregação de logs e desempenho de aplicações, compradas em vez de construídas: o padrão que levou a empresa depressa a categorias vizinhas." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "O atalho nas compras, e seu segundo gume", detail: "Software comprado sem ciclo de compras é também software comprado sem revisão de segurança, sem comitê de arquitetura e sem registro no inventário. O modelo que fez a empresa foi o modelo que deixou seus clientes incapazes de responder, em dezembro de 2020, à única pergunta que importava: onde isso está instalado." },
        { title: "Amplitude a um preço que o mid-market paga", detail: "Um catálogo de ferramentas específicas, em vez de uma plataforma cara, permitia ao cliente comprar exatamente a peça de que precisava. O modelo comercial e a base instalada são o mesmo fato." },
        { title: "Reconstruir o processo de build em público", detail: "Depois de 2020, a empresa reconstruiu seu build de software para passar o mesmo código-fonte por vários pipelines independentes e comparar os resultados, de modo que um único ambiente comprometido não consiga produzir um artefato confiável. Publicou a abordagem em vez de guardá-la, que é a resposta útil para quem virou o estudo de caso." },
      ],
      // Markets paragraphs, same count.
      markets: [
        "Equipes de operações de TI em grandes empresas, mid-market e governo, com uma presença que inclui uma fatia grande da Fortune 500 e, em 2020, boa parte do governo federal dos Estados Unidos, o que fez do comprometimento um evento de segurança nacional, e não comercial.",
        "Ela compete hoje com fabricantes de observabilidade nativos de nuvem que cresceram depois de seu modelo estar estabelecido, e sua posição distintiva é a mesma de sempre: ampla, acessível e implantável on-premises para clientes que não podem usar outra coisa.",
      ],
      // Analyst statements, same count.
      analyst: [
        "Avaliada como uma incumbente de peso em monitoramento de redes e gestão de operações de TI, com uma base de clientes cujo tamanho é seu principal ativo e, em 2020, foi seu principal passivo.",
        "O veredito comercial está nos números: capital fechado por cerca de US$ 4,5 bilhões em 2016 e venda por cerca de US$ 4,4 bilhões em 2025. Uma empresa pode sobreviver ao pior ataque de supply chain já registrado e ainda valer o que valia, o que diz algo sobre a durabilidade do software instalado que nem o ataque nem a narrativa de recuperação captam.",
      ],
    },
  },
  // ---- spacex: pt-BR prose for the record (facts stay in the English record) ----
  "spacex": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "SpaceX - a órbita baixa, e o que ela faz com o piso de latência",
    // Card line (also the meta description) and intro paragraph.
    tagline: "A restrição que não podia ser eliminada pela engenharia foi contornada por ela, mudando os satélites de lugar.",
    intro: "A SpaceX opera uma constelação de satélites em órbita terrestre baixa, e sua relevância para esta linha do tempo é um único número. Enquanto a órbita geoestacionária fica a cerca de 36.000 quilômetros de altitude, a órbita baixa fica a algumas centenas, o que derruba a latência de ida e volta de cerca de meio segundo para uma faixa com que os protocolos comuns e as aplicações interativas conseguem trabalhar.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "A troca não é de graça, e é o motivo de ninguém ter feito isso antes. Um satélite a essa altitude só fica sobre a cabeça por minutos, então a cobertura contínua exige milhares deles, handover constante entre eles e uma economia de lançamentos que torne a substituição da constelação uma rotina, e não uma catástrofe.",
      "Lida ao lado do verbete da Hughes, ela faz um argumento geral sobre limites: o piso de latência geoestacionário nunca foi um problema tecnológico a ser resolvido com modems melhores. Era consequência de uma escolha de órbita, e só se moveu quando a escolha mudou.",
      "A órbita é a história técnica. A que pertence ao lado dos verbetes da Huawei e da Atos é o que aconteceu quando a constelação virou uma rede de campo de batalha. Depois da invasão de fevereiro de 2022, a SpaceX mandou terminais para a Ucrânia, de início de graça e sem contrato militar, e eles se tornaram a camada de comunicações de boa parte da guerra.",
      "Em setembro de 2022, segundo a biografia do CEO da empresa, a Ucrânia enviou seis drones submarinos carregados de explosivos contra a frota russa em Sebastopol, guiados pelo Starlink. O primeiro relato do livro dizia que a cobertura tinha sido desligada num raio de cem quilômetros da costa da Crimeia; o executivo respondeu que as regiões nunca tinham sido ativadas e que nada tinha sido desativado, e o biógrafo esclareceu então que a Ucrânia acreditava que a cobertura chegava à Crimeia quando não chegava, tinha pedido que ela fosse habilitada e tivera o pedido recusado. Os drones perderam a conectividade e foram parar na praia. A razão declarada pelo executivo foi que concordar teria tornado a empresa cúmplice de um grande ato de guerra, e que os termos do serviço proíbem o uso militar ofensivo.",
      "Qual dos dois verbos é o certo, desativar ou recusar-se a habilitar, foi discutido por uma semana e deve ser registrado como contestado, porque é. O que não é contestado é a parte que importa a este catálogo: numa noite, se um trecho de litoral teria conectividade durante uma operação militar de um Estado aliado foi decidido por um único indivíduo privado, com base numa conversa com um embaixador estrangeiro e nos termos de serviço de uma empresa. Nenhum tratado regia aquilo, e nenhum Legislativo foi consultado. Os termos de serviço de um fornecedor foram, naquela noite, a lei de um campo de batalha.",
      "O remédio é a parte instrutiva, e é o mesmo remédio que o verbete da Atos registra por outro caminho. As Forças Armadas dos Estados Unidos passaram a contratar o serviço em seus próprios termos, e a empresa começou a construir para o governo uma constelação separada, que seria de propriedade e controle dele. O cliente que não pode aceitar a discricionariedade de um fornecedor compra a discricionariedade do fornecedor. Três senadores pediram ao secretário de Defesa que explicasse o que tinha acontecido; as perguntas que fizeram eram as que valem para todo fornecedor, e a resposta foi a mesma de qualquer outro lugar: depende de quem é dono do interruptor.",
    ],
  },
  // ---- tandem: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "tandem": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Tandem Computers - a máquina que nunca para",
    // Card line (also the meta description) and intro paragraph.
    tagline: "A arquitetura NonStop de Jimmy Treybig fez da tolerância a falhas um produto em 1976; ela ainda roda bolsas de valores e redes de cartões hoje, como HPE NonStop.",
    intro: "A Tandem construía computadores sobre uma única premissa: nenhum ponto único de falha. Processadores em par, tudo espelhado, hardware e software projetados para que o sistema sobrevivesse a qualquer falha isolada no meio de uma transação. Caixas eletrônicos, redes de cartões, bolsas de valores e sistemas de emergência 911 se padronizaram no NonStop, e meio século depois a arquitetura ainda é vendida, pela HPE, fazendo os mesmos trabalhos.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "O perfil cobre a fundação em 1974, a arquitetura de pares de processos, a lendária cultura da empresa, o interconector ServerNet cujas ideias alimentaram o InfiniBand e a aquisição pela Compaq em 1997, que levou o NonStop para a HP.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "Adquirida pela Compaq em 1997 por US$ 3 bilhões e, com a Compaq, levada para a HP em 2002. A linha NonStop sobrevive como divisão da HPE, de modo que a tecnologia sobreviveu à empresa por décadas.",
    // Successor link label (the URL stays in the English record).
    successorLabel: "Hewlett Packard Enterprise, via Compaq",
    // Profile: complete copy of profiles/tandem.ts; years, companies, founders, personal markers and hrefs come from the English.
    profile: {
      // Same slug as the English profile.
      slug: "tandem",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          company: "Tandem Computers",
          year: 1974,
          place: "Cupertino, Califórnia",
          founders: ["Jimmy Treybig","Mike Green","Jim Katzman","Jack Loustaunou"],
          story: "Jimmy Treybig saiu da HP com uma premissa herética: construir um computador partindo do princípio de que os componentes VÃO falhar, e arquitetá-lo de modo que nenhuma falha isolada jamais interrompa uma transação. O NonStop I, de 1976, cumpriu a promessa: processos em par fazendo sombra um ao outro num multiprocessador shared-nothing, discos espelhados, um sistema operacional (Guardian) que tornava a assunção invisível. Bancos, redes de cartões e bolsas de valores, os lugares onde um minuto fora do ar se mede em milhões, se padronizaram na Tandem, e cinquenta anos depois a arquitetura ainda é vendida, pela HPE, fazendo exatamente esses trabalhos.",
        },
      ],
      // Timeline: same events, same order, same years and personal markers; prose translated.
      timeline: [
        { year: 1976, title: "NonStop I", detail: "Sai o primeiro computador comercial tolerante a falhas: pares de processos, nenhuma memória compartilhada, cada caminho espelhado. Disponibilidade contínua como arquitetura, e não como promessa." },
        { year: 1980, title: "A década das transações", detail: "Redes de caixas eletrônicos, autorização de cartões e bolsas adotam o NonStop como padrão da categoria; a Tandem entra na Fortune 500 com uma cultura (as festas de cerveja das sextas-feiras, a transparência interna radical) tão famosa quanto as máquinas." },
        { year: 1987, title: "Escalar horizontalmente antes de a palavra existir", detail: "Os interconectores de fibra FOX ligam sistemas NonStop naquilo que a indústria depois chamaria de clusters; o escalonamento shared-nothing da Tandem antecipa em uma década a ortodoxia dos sistemas distribuídos." },
        { year: 1995, title: "ServerNet", detail: "Sai o interconector de área de sistema: ideias de baixa latência, comutadas, com sabor de RDMA, cuja linhagem desemboca na padronização do InfiniBand alguns anos depois; o encanamento da Tandem sobrevive à sua independência." },
        { year: 1997, title: "Compaq", detail: "Junho de 1997: a Compaq adquire a Tandem num negócio em ações de cerca de US$ 3 bilhões, o rei dos clones comprando credibilidade corporativa um ano antes de comprar a DEC; o NonStop chega à HP em 2002.", sourceNote: "Negócio conforme o registro público." },
        { year: 2010, title: "Ainda NonStop, na HPE", detail: "Portado de MIPS para Itanium e depois para x86, o HPE NonStop mantém sua alma de pares de processos em silício commodity: uma das arquiteturas mais longevas da computação, ainda processando as passadas de cartão do mundo." },
      ],
      // Products: names as the vendor writes them (generic descriptors localised); descriptions translated.
      products: [
        { name: "Sistemas NonStop", what: "A linha tolerante a falhas do NonStop I ao atual HPE NonStop X: disponibilidade contínua para processamento de transações." },
        { name: "Guardian / NonStop OS", what: "O sistema operacional construído em torno de pares de processos e da assunção: falhas tratadas abaixo do que a aplicação chega a perceber." },
        { name: "ServerNet", what: "O interconector comutado de área de sistema cujas ideias de design alimentaram a era InfiniBand." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "Tolerância a falhas como arquitetura", detail: "A Tandem tirou a confiabilidade das caixas redundantes e a transformou numa propriedade projetada do sistema inteiro: o raciocínio de disponibilidade que toda plataforma distribuída moderna herda." },
        { title: "Escalonamento horizontal shared-nothing", detail: "Processadores independentes cooperando por troca de mensagens, estado espelhado, assunção transparente: o padrão que os bancos de dados em nuvem redescobriram, lançado em 1976." },
      ],
      // Markets paragraphs, same count.
      markets: [
        "O negócio NonStop persiste dentro da HPE, rodando redes de pagamento, bolsas e operadoras de telecomunicações: a rara arquitetura dos anos 1970 ainda vendida nova, para clientes que não podem ficar fora do ar.",
      ],
      // Analyst statements, same count.
      analyst: [
        "O fabricante de referência das avaliações de tolerância a falhas por duas décadas, e a arquitetura que a literatura de sistemas distribuídos continua redescobrindo com vocabulário novo.",
      ],
    },
  },
  // ---- tecban: pt-BR prose for the record (facts stay in the English record) ----
  "tecban": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "TecBan - as máquinas não são de ninguém em particular",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Rede brasileira compartilhada de autoatendimento fundada em 1982 por três bancos, operadora do Banco24Horas.",
    intro: "A Tecnologia Bancaria S.A. foi fundada em 22 de setembro de 1982 por Unibanco, Nacional e Bamerindus e opera o Banco24Horas: cerca de trinta mil máquinas em mais de mil cidades brasileiras, compartilhadas por mais de cento e cinquenta instituições financeiras.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A lógica da fundação é o verbete inteiro, e é um argumento de redes vestido de banco. Três bancos juntaram infraestrutura porque os três maiores, Banco do Brasil, Bradesco e Itau, eram os únicos que podiam bancar sozinhos, cada um, uma rede nacional de máquinas. Compartilhar não era uma filosofia; era o único jeito de as instituições menores oferecerem o mesmo serviço.",
      "É o mesmo cálculo por trás de todo ponto de troca de tráfego, todo tronco compartilhado e todo acordo de peering desta linha do tempo: abaixo de certa escala, construir o próprio sai mais caro do que fazer um acordo com os concorrentes. O incomum é o quanto o resultado ficou visível: o mosaico de logotipos de bancos na frente de uma máquina vermelha é um acordo de peering que as pessoas comuns olham todos os dias sem reconhecê-lo.",
      "Vale mencionar também a metade física, porque uma rede não é uma abstração. A TecBan descreve viagens de até catorze horas de barco para chegar a máquinas em regiões remotas da Amazônia. Toda discussão sobre metas de disponibilidade acaba encontrando um rio.",
      "Ela também tem um braço de telecomunicações, a TBNet, ao lado das unidades de transporte de valores e de serviços integrados; assim, a empresa que compartilha as máquinas também opera a rede pela qual elas se comunicam, a resposta comum à pergunta sobre do que de fato consiste uma rede financeira.",
    ],
  },
  // ---- toshiba: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "toshiba": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Toshiba - a empresa que deu a memória flash ao mundo",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Fujio Masuoka inventou a flash NOR e depois a NAND na Toshiba, nos anos 1980; todo SSD, celular e cartão de memória descende dela, e o T1100 deu início à era do laptop.",
    intro: "De uma oficina de telégrafos de 1875, fundada por um fabricante de bonecos mecânicos, ao conglomerado que inventou a memória flash e o laptop de mercado de massa; e depois, passando pelo desastre da Westinghouse e pelo escândalo contábil, a venda das joias da coroa da memória (a atual Kioxia) e a saída da bolsa depois de 74 anos. Uma contribuição imortal emoldurada por uma história corporativa bem mortal.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "O perfil cobre as raízes Tanaka e Hakunetsusha, a fusão de 1939, os pioneirismos do JW-10 e do T1100, as invenções NOR e NAND de Masuoka, os capítulos do DVD e do HD DVD e o desmonte que vai da Westinghouse à Kioxia.",
    ],
    // Profile: complete copy of profiles/toshiba.ts; years, companies, founders, personal markers and hrefs come from the English.
    profile: {
      // Same slug as the English profile.
      slug: "toshiba",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          company: "Tanaka Seisakusho, later Shibaura Seisakusho (Toshiba's oldest root)",
          year: 1875,
          place: "Tóquio, Japão",
          founders: ["Hisashige Tanaka"],
          story: "Hisashige Tanaka, o célebre inventor apelidado de 'Karakuri Giemon' por causa de seus bonecos mecânicos, abriu a primeira fábrica de equipamentos de telégrafo do Japão em 1875, aos 76 anos. A sucessora de sua empresa (Shibaura Seisakusho) se fundiu em 1939 com a Tokyo Denki, herdeira da fábrica de lâmpadas Hakunetsusha, que fez as primeiras lâmpadas incandescentes do Japão, formando a Tokyo Shibaura Denki: a Toshiba. Um século depois da fundação, um engenheiro da Toshiba chamado Fujio Masuoka inventaria a memória em que todo o mundo móvel se armazena.",
        },
      ],
      // Timeline: same events, same order, same years and personal markers; prose translated.
      timeline: [
        { year: 1939, title: "Tokyo Shibaura Denki", detail: "A fábrica de equipamentos elétricos pesados Shibaura e a fabricante de lâmpadas Tokyo Denki se fundem; o apelido-amálgama 'Toshiba' vira o nome oficial em 1978, quando já estava ligado a tudo, de turbinas a televisores." },
        { year: 1978, title: "O JW-10", detail: "A Toshiba lança o primeiro processador de texto em japonês, resolvendo a conversão de kana para kanji, um problema de computação sem equivalente no Ocidente, e abrindo a era da automação de escritório no Japão." },
        { year: 1985, title: "O T1100", detail: "Amplamente reconhecido como o primeiro laptop de mercado de massa: com disquete, alimentado por bateria, compatível com IBM, defendido internamente contra o ceticismo por Atsutoshi Nishida, que mais tarde dirigiu a empresa. O tiro de largada comercial da computação portátil." },
        { year: 1987, title: "Memória flash", detail: "Fujio Masuoka, que tinha inventado a flash NOR por volta de 1980 (apresentada em 1984), apresenta a NAND em 1987: apagável em blocos, densa, barata. O comentário de um colega de que o apagamento lembrava o flash de uma câmera lhe deu o nome. Todo SSD, celular e cartão de memória descende desse trabalho.", sourceNote: "Cronologia da invenção conforme as apresentações de Masuoka no IEDM e as histórias de referência." },
        { year: 2006, title: "A aposta na Westinghouse", detail: "A Toshiba paga cerca de US$ 5,4 bilhões pelo negócio nuclear da Westinghouse, a aquisição cujos estouros de custo explodem uma década depois: o escândalo contábil de 2015 (lucros inflados em cerca de US$ 1,2 bilhão), o Chapter 11 da Westinghouse em 2017 e a venda forçada das joias da coroa.", sourceNote: "Números conforme o registro público." },
        { year: 2018, title: "O negócio de memória vai embora", detail: "Para sobreviver, a Toshiba vende sua unidade de memória, o legado de Masuoka, a um consórcio liderado pela Bain por cerca de US$ 18 bilhões; rebatizada de Kioxia em 2019, ela continua sendo uma das gigantes mundiais de NAND. Em 2023, a própria Toshiba tem o capital fechado e sai da bolsa depois de 74 anos: o longo desmonte do conglomerado." },
      ],
      // Products: names as the vendor writes them (generic descriptors localised); descriptions translated.
      products: [
        { name: "Memória flash NAND", what: "A invenção: armazenamento não volátil apagável em blocos, o substrato dos SSDs, dos celulares e de todo cartão de memória. Continuada hoje pela Kioxia." },
        { name: "Laptops da série T", what: "Do T1100 em diante, a linha que fez dos PCs portáteis um mercado de massa." },
        { name: "Discos rígidos de 1,8 polegada", what: "Os discos minúsculos que tornaram possíveis os primeiros iPods: armazenamento Toshiba em um bilhão de bolsos antes de a flash assumir (com a invenção da própria Toshiba)." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "Memória flash (NOR e NAND)", detail: "As invenções de Masuoka mudaram o que o armazenamento É: nenhuma peça móvel, leituras endereçáveis por byte, apagamento em blocos. A tecnologia habilitadora da computação móvel, inventada por um engenheiro num conglomerado." },
        { title: "O laptop de mercado de massa", detail: "O T1100 provou que a computação portátil, compatível e alimentada por bateria podia vender: o formato que todo engenheiro de campo destas páginas carrega descende dele." },
      ],
      // Markets paragraphs, same count.
      markets: [
        "Depois de sair da bolsa, a Toshiba continua em energia, infraestrutura e dispositivos; o legado da memória prospera de forma independente como Kioxia, a invenção sobrevivendo à posse dela por quem a inventou.",
      ],
      // Analyst statements, same count.
      analyst: [
        "A ascensão e o desmonte de um conglomerado emoldurando uma contribuição imortal: se este site tivesse de nomear a única invenção de que o trabalho de campo moderno mais depende em silêncio, a flash apagável em blocos estaria na lista curta.",
      ],
    },
  },
  // ---- tufin: pt-BR prose for the record (facts stay in the English record) ----
  "tufin": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Tufin - a política de firewall, lida de volta para você",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Uma empresa cujo produto é entender as regras que você já escreveu.",
    intro: "A Tufin faz software que analisa, visualiza e altera a política de firewall num ambiente heterogêneo. O mercado em que ela está existe por uma razão: passadas algumas centenas de regras, escritas por várias pessoas ao longo de vários anos, ninguém consegue dizer com segurança o que um firewall permite, e o próprio equipamento não vai dizer, porque responde à pergunta que lhe foi feita, e não à pergunta que você quis fazer.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "A Tufin foi fundada em Tel Aviv em 2005 por Ruvi Kitov e Reuven Harrison, ambos vindos da Check Point, e esse é o fato relevante sobre ela. Pessoas que tinham construído um firewall foram construir a ferramenta para conviver com um, depois de ver o que os clientes de fato faziam com as bases de regras ao longo dos anos, e não o que a documentação do produto supunha.",
      "Sua suíte divide o problema do jeito que a operação o divide: SecureTrack para visibilidade, auditoria e compliance sobre o que está implantado, SecureChange para automatizar a mudança em si, e SecureApp para descrever a conectividade em termos da aplicação, e não de endereços e portas. Este último enquadramento é o útil, porque quem pede uma mudança descreve uma necessidade de negócio, e alguém depois a traduz em regras que sobrevivem ao pedido.",
      "Ela se manteve com financiamento privado até a listagem em Nova York, em abril de 2019, e em agosto de 2022 a Turn/River Capital fechou seu capital num negócio todo em dinheiro de cerca de 570 milhões de dólares, um prêmio de 44 por cento sobre o fechamento anterior.",
      "Lida ao lado da AlgoSec, fundada um ano antes e autofinanciada por catorze anos, o padrão fica claro o bastante para ser dito. Duas empresas criadas para gerenciar política de firewall se financiaram com clientes por muito tempo, o que acontece quando um produto resolve um problema que o comprador já sabe que tem. O mercado não precisou ser criado; precisou ser notado.",
    ],
  },
  // ---- udemy: pt-BR prose for the record (facts stay in the English record) ----
  "udemy": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Udemy - qualquer um podia ensinar, e noventa e cinco mil ensinaram",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Criada em 2010 por um fundador de uma aldeia turca que aprendeu online porque a escola não conseguia ensiná-lo; um marketplace de um quarto de milhão de cursos em setenta e cinco línguas, subsidiária integral da Coursera desde maio de 2026.",
    intro: "A Udemy é um marketplace americano de cursos online fundado em San Francisco em 2010 por Eren Bali, Oktay Caglar e Gagan Biyani, onde qualquer instrutor pode publicar um curso; abriu capital na Nasdaq em 2021 e, desde maio de 2026, é subsidiária integral da Coursera, ainda operando com o próprio nome.",
    // Body: 4 paragraph(s), same order as the English.
    body: [
      "Eren Bali cresceu em Durulova, uma aldeia da Turquia rural onde a escola não conseguia lhe ensinar o que ele queria aprender, e ele aprendeu com software. A empresa que fundou em San Francisco em maio de 2010 com Oktay Caglar e Gagan Biyani era a generalização disso: um marketplace onde qualquer pessoa com algo a ensinar podia gravar e vender, sem instituição no meio. Mais de trinta investidores recusaram a ideia por achá-la pouco séria. Em poucos meses, mil instrutores tinham publicado dois mil cursos, de Photoshop a cálculo de várias variáveis.",
      "É o modelo oposto ao da Coursera. Lá, o nome da universidade é o produto e a plataforma é o canal; aqui, o instrutor é o produto e a plataforma é a prateleira. Em 2025, a prateleira tinha mais de um quarto de milhão de cursos em setenta e cinco línguas, com mais de um bilhão de matrículas, e uma fatia muito grande do treinamento técnico prático do mundo (redes, nuvem, preparação para exames de segurança) era vendida ali por pessoas que nunca tinham trabalhado para uma empresa de treinamento. A empresa abriu capital na Nasdaq em outubro de 2021.",
      "A economia se voltou contra o marketplace antes da venda. A receita ficou estável, em torno de 790 milhões de dólares em 2025, dois terços dela vindos agora de assinaturas corporativas, enquanto o marketplace de consumo encolhia; a empresa chegou à lucratividade no mesmo ano em que começou a pôr publicidade nos cursos gratuitos, sem que nada dessa receita fosse para os instrutores cujos cursos a exibiam. Quatro executivos saíram até o fim do ano, entre eles o fundador, que tinha voltado como CTO. Em 17 de dezembro de 2025, a empresa aceitou se combinar com a Coursera, e o negócio foi concluído em 11 de maio de 2026: a Udemy, Inc. sobreviveu à fusão como subsidiária integral da Coursera, e o udemy.com continua operando com o nome Udemy, agora sob o ticker de outra empresa.",
      "Vale guardar o registro porque o modelo era genuinamente novo e porque a perda da sua independência diz algo sobre ele. Uma prateleira em que qualquer um pode pôr um curso só vale o que valem os cursos que estão nela, e as pessoas que os fizeram foram as últimas a receber e as primeiras a ser solicitadas a aceitar menos. Um instrutor que esteja pensando onde publicar tem agora esta história para ler antes de decidir.",
    ],
  },
  // ---- unisys: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "unisys": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "Unisys - as linhagens mais antigas da computação",
    // Card line (also the meta description) and intro paragraph.
    tagline: "A Burroughs (1886) mais o UNIVAC da Sperry, a empresa dos criadores do ENIAC, fundidos em 1986: a linhagem mais profunda desta seção, ainda rodando descendentes ClearPath hoje.",
    intro: "A Unisys é onde se encontram as duas linhagens comerciais mais antigas da computação: a empresa de máquinas de somar de William Seward Burroughs, de 1886, e a divisão UNIVAC da Sperry, construída sobre Eckert e Mauchly, os engenheiros do próprio ENIAC, cujo UNIVAC I, de 1951, foi o primeiro computador comercial dos Estados Unidos e ficou famoso por prever o resultado da eleição de 1952 na CBS. A fusão de 1986 criou a Unisys; a herança dos mainframes sobrevive no ClearPath.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "Dois troncos se encontram aqui. A Burroughs começou em 1886 com uma máquina de somar; a Sperry começou em 1910, no Brooklyn, fabricando equipamentos de navegação. Juntas, elas recuam mais na computação comercial do que qualquer outra coisa desta seção.",
      "A linha que importa passou por Eckert e Mauchly, que construíram o ENIAC e depois foram forçados a sair da Universidade da Pensilvânia numa disputa de patentes sobre ele. Abriram uma empresa para construir computadores, a Remington Rand a comprou em 1950, e o primeiro UNIVAC foi para o Census Bureau em março de 1951. Foram vendidos quarenta e seis, a mais de um milhão de dólares cada.",
      "Na noite da eleição de 1952, com três milhões de votos apurados, o UNIVAC deu a Eisenhower chances de 100 para 1, e a impressão mostrou 00, porque o campo tinha dois dígitos de largura e ninguém tinha imaginado chances acima de noventa e nove. Na noite em que o computador virou um nome conhecido em todos os lares americanos, ele exibia um número que não cabia nele. Todo verbete posterior deste catálogo sobre um campo estreito demais, do ano de dois dígitos ao timestamp de trinta e dois bits, é o mesmo erro cometido de novo em escala maior.",
      "Depois, ela perdeu. A fusão de 1955 que criou a Sperry Rand não apoiou adequadamente a equipe do UNIVAC, a ERA foi comprada e posta para competir com ela internamente, os produtos atrasaram, e a IBM passou à frente. A empresa que lançou o primeiro computador comercial dos Estados Unidos foi ultrapassada em menos de uma década por um marketing melhor e entregas mais regulares.",
      "Vale pôr isso ao lado do verbete da IBM, porque a IBM aparece dos dois lados do mesmo padrão. Aqui, é ela quem toma uma categoria da empresa que a criou; no próprio verbete, é ela quem cria categorias e as perde. Inventar primeiro é uma posição fraca, e a mesma empresa pode demonstrar isso por qualquer uma das pontas.",
      "O desfecho de 1986 foi uma aquisição hostil: a Burroughs comprou a Sperry por 4,8 bilhões de dólares, e o nome da empresa combinada saiu de um concurso entre os funcionários que recebeu milhares de sugestões. A Sperry já tinha aposentado o nome UNIVAC dois anos antes. O que sobrevive é a linha de mainframes, ainda em produção, e um negócio de serviços: o destino comum da linhagem profunda, que é virar um contrato de suporte.",
    ],
    // Profile: complete copy of profiles/unisys.ts; years, companies, founders, personal markers and hrefs come from the English.
    profile: {
      // Same slug as the English profile.
      slug: "unisys",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          company: "Unisys (Burroughs + Sperry merger)",
          year: 1986,
          place: "Blue Bell, Pensilvânia",
          founders: ["W. Michael Blumenthal (merger architect); lineages of W.S. Burroughs, and Eckert & Mauchly"],
          story: "A Unisys é onde convergem as duas linhagens comerciais mais antigas da computação. Um tronco começa em 1886 com a máquina de somar de William Seward Burroughs (o cálculo de escritório como indústria) e cresce até o audacioso B5000 de 1961, uma máquina de arquitetura de pilha, nativa em ALGOL, décadas à frente da moda. O outro passa pelo próprio ENIAC: a empresa de J. Presper Eckert e John Mauchly construiu o UNIVAC I, o primeiro computador comercial dos Estados Unidos, que ficou famoso por prever na CBS a vitória de Eisenhower na eleição de 1952 enquanto as pesquisas diziam outra coisa. A aquisição da Sperry pela Burroughs em 1986 (o nome veio de um concurso entre funcionários) fundiu os troncos na Unisys.",
        },
      ],
      // Timeline: same events, same order, same years and personal markers; prose translated.
      timeline: [
        { year: 1886, title: "A máquina de somar", detail: "William Seward Burroughs patenteia sua máquina de somar com impressão em St. Louis: a linhagem corporativa mais antiga de qualquer página desta seção, um século antes da fusão que a leva adiante." },
        { year: 1951, title: "UNIVAC I", detail: "A máquina de Eckert e Mauchly, entregue ao Census Bureau sob a Remington Rand, é o primeiro computador comercial construído nos Estados Unidos, e em 1952 prevê a vitória esmagadora de Eisenhower ao vivo na televisão, quando os humanos não queriam acreditar." },
        { year: 1961, title: "A heresia do B5000", detail: "A Burroughs lança uma máquina de pilha projetada para ALGOL, com proteção de memória baseada em descritores: ideias que a indústria passa as três décadas seguintes redescobrindo; seus descendentes ainda rodam no ClearPath MCP." },
        { year: 1986, title: "A fusão", detail: "A Burroughs conclui a aquisição da Sperry, de cerca de US$ 4,8 bilhões; 'Unisys' sai de um concurso de nomes entre os funcionários. Por um breve período, a segunda maior empresa de computadores da indústria, bem à sombra da IBM." },
        { year: 1996, title: "ClearPath: duas arquiteturas, uma linha", detail: "As heranças 2200 (Sperry) e A-Series/MCP (Burroughs) convergem num hardware comum como ClearPath: uma aula magna de como levar adiante bases instaladas insubstituíveis, chegando por fim ao x86." },
        { year: 2020, title: "A empresa de serviços", detail: "Décadas de guinadas se completam: a Unisys hoje é serviços de digital workplace, nuvem e computação corporativa, com o ClearPath Forward ainda rodando fielmente as cargas de companhias aéreas, bancos e governos que nunca puderam falhar." },
      ],
      // Products: names as the vendor writes them (generic descriptors localised); descriptions translated.
      products: [
        { name: "ClearPath Forward", what: "A continuação das duas linhagens de mainframe, MCP e OS 2200, sobre infraestrutura moderna, ainda em produção onde parar é impensável." },
        { name: "Sistemas da herança UNIVAC", what: "A linha 1100/2200: cinco décadas de evolução compatível, das válvulas às máquinas virtuais." },
        { name: "Serviços de digital workplace e nuvem", what: "O núcleo de receita moderno: service desks, migração para a nuvem e serviços de segurança corporativa." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "O próprio computador comercial", detail: "O UNIVAC I criou o mercado: a ideia de que uma empresa, e não um laboratório, compraria um computador começa nesta linhagem." },
        { title: "Uma arquitetura à frente do seu século", detail: "A disciplina de pilha, a tipagem em hardware e o raciocínio de memória virtual do B5000 anteciparam metade do design de sistemas moderno: heresia em 1961, ortodoxia hoje." },
      ],
      // Markets paragraphs, same count.
      markets: [
        "A Unisys vende serviços corporativos e continuidade ClearPath no mundo todo: uma empresa mais discreta cujas duas linhagens, a de 1886 e a do ENIAC, fazem dela a linhagem mais profunda de toda esta seção.",
      ],
      // Analyst statements, same count.
      analyst: [
        "Por décadas, a eterna número dois que as avaliações de mainframes punham diante da IBM; hoje avaliada como uma empresa de serviços focada, com uma base instalada singularmente insubstituível.",
      ],
    },
  },
  // ---- usrobotics: pt-BR prose for the record and its profile (facts stay in the English record) ----
  "usrobotics": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "USRobotics",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Venceu três vezes com protocolos proprietários e abriu mão dos três assim que chegou um padrão.",
    intro: "Casey Cowell e quatro sócios fundaram a U.S. Robotics numa garagem em Skokie, Illinois, em 1976, batizando-a com o nome da empresa fictícia das histórias de robôs de Asimov. O primeiro modem saiu em 1979, e o negócio só se abriu ao público em geral depois que o desmembramento da AT&T, em 1984, tornou legal que qualquer pessoa ligasse equipamentos à rede telefônica.",
    // Body: 6 paragraph(s), same order as the English.
    body: [
      "As duas linhas de produtos são a história, e a relação entre elas é melhor do que qualquer uma das duas. O Courier foi feito para operadores de BBS e empresas: robusto, com diagnóstico remoto e um processador digital de sinais atualizável, de modo que um Courier comprado em 1994 como V.34 Ready saía falando V.FC, porque o V.34 ainda não estava pronto, e era atualizado em campo quando ficava. É por isso que a linha acabou sendo chamada de V.Everything. O Sportster, lançado em 1991, era a linha de consumo e, em meados dos anos 1990, um modelo de 28.8 custava cerca de US$ 149.",
      "Eles compartilhavam a placa-mãe. Em certos Sportsters de 14.4, uma sequência de comandos AT habilitava o modo HST de 16.8, mais rápido, pelo qual os Couriers eram vendidos. O hardware era o mesmo; a diferença entre o modem de consumo e o profissional era firmware e preço. A segmentação por software, e não por silício, é hoje tão normal que tem nome, e este é um dos lugares onde ela foi aprendida.",
      "O padrão real da empresa é proprietário primeiro, padrão depois, três vezes seguidas. O HST era o protocolo de alta velocidade da própria USR, e funcionava: se a BBS para a qual você discava tinha um Courier, as transferências corriam mais rápido do que qualquer outro conseguia, e é por isso que o HST se espalhou pelo mundo das BBS e tornou suportáveis as rodadas de correio da FidoNet. Depois chegou o V.32bis, e o HST deixou de importar. Anos mais tarde, a mesma jogada se repetiu com o x2 contra o K56flex de um consórcio rival, e nenhum dos dois venceu, porque todo mundo via o V.90 chegando. A USR abandonou o x2 quando ele chegou.",
      "Vale dizer isso com todas as letras, porque vai contra um fio a que este site volta com frequência. Em outros pontos, a linha do tempo registra a neutralidade e a abertura compensando: pontos de troca neutros quanto a operadoras, certificação neutra quanto a fabricantes, protocolos que continuaram abertos e viraram infraestrutura. A USRobotics fez o contrário, e funcionou repetidas vezes: um protocolo proprietário comprou vantagem real por anos reais. O que ele não comprou foi permanência. Toda vez que chegava um padrão, a vantagem evaporava, e a empresa teve o bom senso de parar de defendê-la.",
      "A escala veio com o Sportster. A receita foi de US$ 889 milhões em 1995 e de US$ 1,98 bilhão no ano encerrado em setembro de 1996, um aumento de 122 por cento. A empresa comprou a Palm em 1995, adquirindo o PalmPilot, e foi ela própria adquirida pela 3Com em junho de 1997. Depois foi desmembrada de novo, mudou-se para Schaumburg, Illinois, e hoje pertence à UNICOM Global.",
      "Um detalhe do lado dos operadores merece registro: a primeira implantação em larga escala de Couriers na rede da CompuServe revelou um bug que travava os modems e os impedia de atender chamadas sob alto volume. O modem mais confiável do mercado encontrou seu limite do jeito que tudo encontra: numa escala que ninguém tinha testado.",
    ],
    // Ending note (the year stays in the English record).
    endedNote: "A U.S. Robotics Corporation tornou-se subsidiária integral da 3Com em 12 de junho de 1997, com cada ação trocada por 1,75 ação da 3Com. O nome USRobotics voltou depois como negócio separado, acompanhado no texto abaixo.",
    // Acquisitions: index-aligned with the English list (year, name, price and founder stay English).
    acquisitions: [
      // [0] Palm, Inc. (1995)
      { what: "A empresa por trás do handheld PalmPilot.", became: "Parte da USRobotics, depois da 3Com, e mais tarde independente de novo: um caminho societário mais movimentado do que o do produto." },
    ],
    // Profile: complete copy of profiles/usrobotics.ts; years, companies, founders, personal markers and hrefs come from the English.
    profile: {
      // Same slug as the English profile.
      slug: "usrobotics",
      // Founding stories: place (geography localised), story and provenance translated.
      foundings: [
        {
          company: "U.S. Robotics",
          year: 1976,
          place: "Chicago, depois Skokie, Illinois",
          founders: ["Casey Cowell","Paul Collard","Stephen Muka","Stan Metcalf","Tom Rossen"],
          story: "Vários deles vieram da Universidade de Chicago, onde Collard trabalhava no Computation Center; ele tinha formação em física aplicada por Sussex e projetou os modems até meados dos anos 1980. Cowell tinha terminado uma graduação em economia no ano anterior e dirigiu a empresa durante a maior parte de sua existência. O primeiro produto se comunicava a trezentos bits por segundo.",
          sourceNote: "A empresa recebeu o nome da fictícia U.S. Robots and Mechanical Men, de Asimov, com a justificativa declarada de que, nas histórias dele, ela se tornava a maior empresa da galáxia conhecida. Em 2004, a empresa real apareceu no filme I, Robot fazendo o papel da fictícia.",
        },
      ],
      // Timeline: same events, same order, same years and personal markers; prose translated.
      timeline: [
        { year: 1979, title: "O primeiro modem", detail: "Trezentos bits por segundo, o que era competitivo." },
        { year: 1996, title: "Um quarto do mercado", detail: "Mais de um quarto das vendas de modems da América do Norte, com lucro 158% maior em um ano, e a Hayes, que tinha definido a categoria e sua linguagem de comandos, desalojada da liderança." },
      ],
      // Products: names as the vendor writes them (generic descriptors localised); descriptions translated.
      products: [
        { name: "Courier", what: "A linha profissional: robusta, com diagnóstico remoto, comprada pelas pessoas cujos modems atendiam chamadas o dia inteiro." },
        { name: "Courier Dual Standard", what: "O que importou comercialmente. Falava tanto o HST quanto o padrão v.32, de modo que quem ligasse com um modem de qualquer fabricante conectava na velocidade máxima, em vez de cair para 2400 bits por segundo. Ele tornou seguro implantar um protocolo proprietário." },
        { name: "Sportster", what: "A linha de consumo, e o negócio de volume: o modem com que um número enorme de pessoas se conectou à internet pela primeira vez." },
        { name: "Palm", what: "Adquirida em 1995 junto com a Megahertz e a ISDN Systems, e de longe a coisa mais valiosa que a empresa já comprou." },
      ],
      // Innovations: title and detail translated.
      innovations: [
        { title: "Subsidiar o centro para vender as pontas", detail: "A USR vendia modems aos operadores de BBS com um desconto substancial. Esse é o mecanismo por trás de todo o resto: um sysop com um Courier com desconto dava a cada pessoa que ligava um motivo para comprar um modem USR, porque as velocidades HST só estavam disponíveis se as duas pontas tivessem um. Dar desconto a um lado de um mercado para criar demanda no outro é prática comum hoje, e era uma coisa incomum de entender no fim dos anos 1980." },
        { title: "Tornar seguro adotar o protocolo proprietário", detail: "O Dual Standard é o motivo de a estratégia ter funcionado em vez de sair pela culatra. Um modem que só falasse HST teria sido uma aposta; um que falava HST e o padrão era estritamente melhor do que um modem só de padrão, então não havia risco em comprá-lo. A vantagem proprietária era oferecida como acréscimo, e não como substituição." },
        { title: "Desalojar a empresa que escreveu a linguagem de comandos", detail: "A Hayes definiu a categoria de modems de forma tão completa que seu conjunto de comandos ainda se chama conjunto de comandos Hayes e ainda começa cada linha com AT. Ser ultrapassado por um concorrente cujos produtos falam a sua própria língua é um jeito incomum de perder um mercado, e aconteceu porque confiabilidade e velocidade se revelaram mais importantes do que a autoria." },
        { title: "Comprar aquilo que sobreviveu ao negócio", detail: "A Palm foi uma de três aquisições num único ano, e a única de que alguém se lembra. Uma empresa de modems comprou uma empresa de computadores de mão, e o negócio de handhelds acabou definindo uma categoria de produto enquanto o negócio de modems era tornado obsoleto pela banda larga." },
      ],
      // Markets paragraphs, same count.
      markets: [
        "Primeiro os operadores de BBS, depois os consumidores, em números enormes, nos anos em que entrar na internet significava discar, e as empresas que compravam equipamentos de acesso remoto. A receita chegou a cerca de US$ 2 bilhões antes da aquisição pela 3Com.",
        "O mercado que ela dominou não existe mais nessa forma. O que resta da marca vende equipamentos de conectividade para uso industrial e de gestão remota, onde um link discado ou celular até algo no meio de um campo ainda é a resposta prática.",
      ],
      // Analyst statements, same count.
      analyst: [
        "O histórico comercial da empresa se lê melhor como um caso de vantagem proprietária no momento certo: três tentativas, um sucesso claro e a disposição de abandonar cada posição assim que um padrão a tornava indefensável.",
        "A organização sobreviveu à empresa que a adquiriu. A própria 3Com foi absorvida, enquanto o nome USRobotics foi desmembrado de novo, passou por uma compra pela gestão e ainda opera: uma vida após a morte incomum para uma marca cuja categoria de produto definidora foi eliminada pela tecnologia que a substituiu.",
      ],
    },
  },
  // ---- world-zone: pt-BR prose for the record (facts stay in the English record) ----
  "world-zone": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "World Zone",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Parceira brasileira citada no canal Fortinet.",
    intro: "Uma parceira brasileira do canal Fortinet. O canal brasileiro de segurança é um mercado de muitas integradoras pequenas e médias, e não de poucas grandes, uma diferença estrutural em relação à América do Norte que explica por que os programas de certificação dos fabricantes pesam tanto aqui.",
    // Body: 1 paragraph(s), same order as the English.
    body: [
      "Integradora Fortinet de nível Expert e provedora de serviços de segurança gerenciada, com um dos portfólios de especializações mais amplos do diretório brasileiro do fabricante. A amplitude de especializações é o indicador público mais próximo da profundidade de engenharia, já que cada uma precisa ser conquistada com equipe certificada, e não comprada.",
    ],
  },
  // ---- yssy: pt-BR prose for the record (facts stay in the English record) ----
  "yssy": {
    // Title: company verbatim, subtitle (if any) translated; the " - " separator is structural.
    name: "YSSY - integração com os certificados para provar",
    // Card line (also the meta description) and intro paragraph.
    tagline: "Uma integradora brasileira cuja face pública é a lista de normas que ela detém.",
    intro: "A YSSY é uma empresa brasileira de tecnologia que cobre infraestrutura, nuvem, dados, observabilidade e cibersegurança, atuando em setores onde a continuidade é regulada, e não apenas desejável: energia, saúde, serviços financeiros e governo.",
    // Body: 3 paragraph(s), same order as the English.
    body: [
      "O que distingue sua apresentação pública é a lista de certificações: ISO 9001, 14001, 20000-1, 27001, 27701 e 37001, ou seja, qualidade, meio ambiente, gestão de serviços de TI, segurança da informação, privacidade e antissuborno. Essa combinação não é tanto uma escolha de marketing quanto um requisito de entrada, porque os compradores desses setores não podem contratar um fornecedor que não as tenha.",
      "É uma ilustração útil de como o mercado corporativo brasileiro de fato filtra fornecedores. Nos segmentos em que um auditor revisa a cadeia de suprimentos, um certificado não é, para um engenheiro, evidência de qualidade: é a permissão para concorrer, e as empresas se organizam em torno de obtê-lo.",
      "Sua própria história começa em 1996, com a fundação do grupo, e não da marca. O Grupo MTel é o antecessor, e a distinção importa na hora de ler a data: os trinta anos no contador pertencem ao grupo, e o nome que um cliente vê hoje é bem mais jovem do que o negócio por trás dele.",
    ],
  },
};
