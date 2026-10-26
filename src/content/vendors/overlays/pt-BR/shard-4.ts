// ============================================================================
// src/content/vendors/overlays/pt-BR/shard-4.ts
// ----------------------------------------------------------------------------
// pt-BR INDUSTRY OVERLAYS, SHARD 4 of 8 (translation pass planned 2026-10-25;
// see the round 2 TRANSLATION-PLAN). One shard per translator, so parallel
// work never edits the same file. Each entry is keyed by record slug and holds
// ONLY translated prose (PartnerVendorOverlay); facts stay in partners.ts and
// profiles/*.ts. Check with: npx tsx scripts/report-industry-translation.mts --strict
//
// Records assigned to this shard (~26,952 words):
// afina, audiocodes, bell-labs-lucent-alcatel, binario, bluecat, brasil-
// telecom, cabletron-enterasys, capgemini, ciena, corvil, data-general,
// dataprev, e-safer, efficientip, epi, http-gopher, huawei, ingram-micro,
// ivanti, levelblue, marconi, netbr, oxid-it, parxtech, pluralsight, qualcomm,
// radware, red-education, ruckus, sailpoint, scansource, seal, segertech,
// serpro, sniffer-lineage, splunk, tamosoft, tivit, tp-link, unicamp, vision-
// cybersecurity, websense-forcepoint, zabbix, zte, zyxel
// ============================================================================

import type { PartnerVendorOverlay } from "@/content/vendors/localized";

/** Translated prose for this shard's records, keyed by slug. */
export const SHARD_4: Record<string, PartnerVendorOverlay> = {
  // afina: record prose only (no profile, no acquisitions).
  "afina": {
    // Card title, tagline and intro.
    name: "Afina - a distribuidora que a Westcon comprou para chegar à América Latina",
    tagline: "Distribuidora espanhola de segurança e data center, fundada em 1990 e adquirida pelo Westcon Group em 2012.",
    intro:
      "A Afina foi fundada em 1990, com sedes em Madri e Miami, e distribuía tecnologia de segurança e de data center pela América Latina, pelo Caribe, pela Península Ibérica, pela França e pelo Marrocos. Era uma empresa familiar, comandada por Pedro Galatas, e o Westcon Group a adquiriu em julho de 2012.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O número que explica a transação está na imprensa especializada espanhola, não no comunicado: em 2011, pela primeira vez, a Afina faturou mais na América Latina do que na Europa, 52% contra 48%. Uma empresa espanhola tinha virado, pela receita, uma empresa latino-americana, e era exatamente isso que uma distribuidora norte-americana sem presença na região precisava comprar.",
      "As duas sedes contam a mesma história. Madri para a Península Ibérica e o Marrocos, Miami para as Américas: a mesma escolha que o verbete da Adistec registra nesta linha do tempo, pelos mesmos motivos, ou seja, dólares, condições de compra dos Estados Unidos e alcance sobre uma dúzia de jurisdições a partir de um só lugar.",
      "Os serviços de canal incluíam treinamento, a parte da distribuição que nunca aparece num datasheet e que decide se uma tecnologia é utilizável num país. Um portfólio de fabricantes não vale nada sem parceiros certificados para instalá-lo, e alguém precisa dar essas aulas.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "O Westcon Group anunciou em 2 de julho de 2012 que havia adquirido o Grupo Afina por meio da compra da GLS Software e de suas subsidiárias.",
  },

  // audiocodes: record prose only; the name has no subtitle and stays as written.
  "audiocodes": {
    // Card title (company name only), tagline and intro.
    name: "AudioCodes",
    tagline: "Fez o codec, depois a placa, depois o gateway, depois o software, e manteve o mesmo CEO por trinta e três anos.",
    intro:
      "A AudioCodes foi fundada em Israel em 1993, num dia sobre o qual os registros não concordam: o histórico da própria empresa diz 21 de fevereiro, enquanto relatos de terceiros dão 9 de maio e 1º de julho. Os fundadores foram Shabtai Adlersberg e Leon Bialik, e alguns relatos citam outros fundadores. Os dois vinham da DSP Group, a empresa israelense de semicondutores que Adlersberg tinha cofundado em 1987. Começou licenciando algoritmos de compressão de voz e vendendo placas de processamento de sinais a fabricantes de telecomunicações, abriu capital na NASDAQ em maio de 1999 e hoje fatura cerca de US$ 242 milhões.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O problema de origem era aritmético. Uma chamada telefônica digitalizada do jeito padrão consome 64 kbps, e uma rede de pacotes do começo dos anos 1990 não conseguia transportar muitas delas. Tudo o que viria a ser voz sobre IP dependia de comprimir a fala o suficiente para caber, sem que o resultado soasse como uma máquina. É um problema de processamento de sinais antes de ser um problema de redes, e é exatamente por isso que os fundadores eram gente de chip, não gente de rede.",
      "E o trabalho deles com codecs entrou num padrão internacional. A codificação de fala da AudioCodes contribuiu para o G.723.1, adotado pela ITU: o codec de baixa taxa de bits sobre o qual rodou boa parte da VoIP inicial. A especificação de uma empresa virar o padrão que todo mundo implementa é a segunda ocorrência desse padrão em dois verbetes seguidos desta linha do tempo: o programa Levels da Anixter virou as Categorias da TIA, e isto virou uma recomendação da ITU.",
      "Vale nomear isso como um mecanismo, em vez de tratar como duas coincidências. Órgãos de padronização raramente inventam; eles ratificam. O que ratificam costuma ser aquilo que já foi construído por quem precisava disso a ponto de construir, e a recompensa dessa empresa não é a receita de licenciamento: é que o padrão da indústria passa a ter as suas digitais, e cada concorrente implementa algo que você entende melhor do que ele. O fosso não é a patente. É a vantagem de largada.",
      "A linha de produtos subiu uma camada de cada vez, e a sequência é invulgarmente limpa: o codec, depois a placa que carrega o codec, depois o media gateway que carrega as placas, depois o session border controller que leva a função do gateway para o software, depois a gestão e a análise em volta dele. A maioria das empresas de componentes é comoditizada quando a sua camada vira um recurso da camada de cima. Esta continuou subindo antes que isso acontecesse, uma estratégia fácil de descrever e difícil de executar, porque significa competir com os próprios clientes.",
      "Depois, um fato estrutural que merece registro. Adlersberg é CEO desde 1993, uma permanência de trinta e três anos, entre as mais longas de qualquer fundador ainda à frente de uma empresa de capital aberto. Os pares em voz corporativa trocaram de liderança repetidas vezes e, como diz uma análise, oscilaram entre mandatos de crescimento e mandatos de reestruturação. Uma empresa que troca de CEO a cada quatro anos não consegue executar uma estratégia que leva dez, e o cemitério da voz corporativa está cheio de negócios que estavam no terceiro ano de uma transição quando a pessoa que a começou foi embora.",
      "A linhagem israelense é a outra metade do contexto. Adlersberg cofundou a DSP Group em 1987, montou ali uma equipe de pesquisa em telefonia celular digital que virou spin-off como DSP Communications em 1992 e fundou a AudioCodes no ano seguinte. Três empresas saídas de um mesmo grupo de engenharia em menos de uma década: é assim que um ecossistema técnico funcional se parece visto de dentro, e é a mesma forma que o verbete da Kentik descreve para operações de rede na Califórnia.",
    ],
  },

  // bell-labs-lucent-alcatel: record prose plus the complete translated profile.
  "bell-labs-lucent-alcatel": {
    // Card title, tagline, intro and body.
    name: "Bell Labs, Lucent & Alcatel - a linhagem do transistor",
    tagline:
      "O transistor, a teoria da informação, o Unix, o laser, a telefonia celular: dez Prêmios Nobel de fundamentos, transformados na Lucent em 1996, fundidos com a Alcatel em 2006 e levados para a Nokia em 2016.",
    intro:
      "Nenhuma instituição moldou mais esta indústria do que os Bell Telephone Laboratories: o transistor de 1947, a teoria da informação de Shannon em 1948, o Unix e o C, o CCD, o conceito celular. A vida corporativa posterior (o IPO recordista da Lucent, a queda mais dura da bolha, a fusão com a Alcatel, a aquisição pela Nokia) é a lição mais aguda da indústria de que inventar o futuro e capturar o seu valor são habilidades diferentes.",
    body: [
      "O perfil cobre a fundação em 1925, a sequência de invenções de 1947 a 1969, a trivestiture de 1996 e a ascensão e queda da Lucent, a escalada da Alcatel da CGE até a ITT, a fusão de 2006 e a passagem para a Nokia em 2016, onde a Bell Labs continua.",
    ],
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "bell-labs-lucent-alcatel",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "Bell Telephone Laboratories",
          year: 1925,
          place: "Nova York (depois Murray Hill, Nova Jersey)",
          founders: ["AT&T and Western Electric (consolidated R&D)"],
          story:
            "A AT&T reuniu os seus departamentos de engenharia num único laboratório em 1º de janeiro de 1925 e, sem querer, criou a instituição de pesquisa mais importante que a indústria já teve. O transistor (1947), a teoria da informação (1948), a célula fotovoltaica (1954), as bases teóricas do laser (1958), o CCD (1969), o Unix e o C, o conceito celular: o trabalho feito nos seus corredores rendeu dez Prêmios Nobel (pela contagem da própria Nokia Bell Labs, que inclui o prêmio de 2018), e praticamente não existe dispositivo no tema deste site que não descenda de algo inventado ali.",
        },
        {
          company: "Compagnie Générale d'Électricité (Alcatel's root)",
          year: 1898,
          place: "Paris, França",
          founders: ["Pierre Azaria"],
          story:
            "O conglomerado elétrico francês que, gerações depois, emprestaria à indústria o nome Alcatel, um acrônimo herdado de uma subsidiária, a Société Alsacienne de Constructions Atomiques, de Télécommunications et d'Électronique. Quando o braço de telecomunicações da CGE absorveu o império telefônico europeu da ITT em 1986-87, a Alcatel virou da noite para o dia a segunda maior fabricante de equipamentos de telecomunicações do mundo: o contrapeso europeu aos herdeiros industriais do Bell System.",
        },
      ],
      // Timeline: same years, same order.
      timeline: [
        { year: 1947, title: "O transistor", detail: "Dezembro de 1947, Murray Hill: Bardeen, Brattain e Shockley demonstram o transistor de ponto de contato. Todo processador, todo switch e todo rádio desde então descendem dele. Prêmio Nobel em 1956, e a startup que Shockley abriu depois semeia o próprio Vale do Silício." },
        { year: 1948, title: "A teoria da informação", detail: "Claude Shannon publica A Mathematical Theory of Communication no Bell System Technical Journal: bits, capacidade de canal, codificação, a matemática por baixo de todo link budget, todo modem, todo esquema de compressão." },
        { year: 1969, title: "Unix, C e o CCD", detail: "Thompson e Ritchie começam o Unix num PDP-7 que estava sobrando; o C de Ritchie vem no início dos anos 1970; no mesmo ano, Boyle e Smith inventam o dispositivo de carga acoplada. Sistemas operacionais, a linguagem da programação de sistemas e a imagem digital: um laboratório, um ano." },
        { year: 1983, title: "A telefonia celular vira negócio", detail: "O conceito celular esboçado num memorando da Bell Labs de 1947 vira o AMPS, lançado comercialmente em 1983: a arquitetura de reuso de frequência e de handoff que toda geração móvel desde então refina." },
        { year: 1996, title: "Lucent Technologies", detail: "A trivestiture da AT&T transforma o seu negócio de equipamentos (a herança da Western Electric mais a Bell Labs) na Lucent. O IPO de abril de 1996 é o maior da história dos EUA até então; em dezembro de 1999, a Lucent está entre as empresas mais valiosas do planeta.", sourceNote: "Escala do IPO e pico de valor segundo o registro público." },
        { year: 2002, title: "A queda", detail: "A bolha das telecomunicações estoura e a Lucent cai mais do que quase todo mundo: a receita desaba, surgem problemas contábeis, o número de funcionários cai de mais de 150.000 para perto de 30.000 e a ação chega a menos de um dólar, depois de a empresa separar a Avaya (2000) e a Agere (2001) no caminho para baixo." },
        { year: 2006, title: "Alcatel-Lucent", detail: "Anunciada em 2 de abril e concluída em 30 de novembro de 2006, a fusão transatlântica de cerca de 10,6 bilhões de euros une o herdeiro do Bell System à campeã europeia: o casamento de duas culturas de engenharia orgulhosas que nunca chegaram a ganhar dinheiro juntas.", sourceNote: "Números do negócio segundo o registro público." },
        { year: 2016, title: "Para dentro da Nokia", detail: "A Nokia conclui a aquisição da Alcatel-Lucent, de cerca de 15,6 bilhões de euros, em janeiro de 2016. A Bell Labs continua como Nokia Bell Labs, ainda em Murray Hill: a linhagem que começou em 1925 agora corre por Espoo." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "O transistor e seus descendentes", what: "Os transistores de ponto de contato e de junção, os artefatos fundadores da era dos semicondutores." },
        { name: "Unix e C", what: "O sistema operacional e a linguagem que viraram o substrato de servidores, de dispositivos de rede e de todo descendente BSD/Linux sobre o qual rodam as ferramentas deste site." },
        { name: "5ESS", what: "A central digital de 1982 que transportou uma parcela substancial das chamadas do mundo durante décadas: o carro-chefe da Western Electric/Lucent na era da comutação de circuitos." },
        { name: "Linhas ópticas e de DSL da Alcatel", what: "Sistemas submarinos, transporte SDH/DWDM e as linhas de DSLAM que cabearam boa parte da primeira milha da banda larga do mundo." },
      ],
      // Innovations.
      innovations: [
        { title: "O laboratório de pesquisa como instituição", detail: "A Bell Labs provou que uma empresa podia conduzir pesquisa fundamental aberta em grande escala e colher os frutos por um século: o modelo que todo laboratório corporativo desde então imitou e que nenhum igualou." },
        { title: "A teoria da informação", detail: "Shannon deu à indústria a sua física: capacidade, entropia, codificação. Toda resposta a \"qual a velocidade máxima deste link\" neste site deriva de um único artigo de 1948." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "A linhagem persiste dentro da Nokia: a Nokia Bell Labs continua a pesquisa fundamental, e o portfólio combinado (fixo, móvel, óptico, submarino) disputa todas as redes de operadoras do planeta.",
      ],
      analyst: [
        "Nenhum verbete destas páginas pesa mais por parágrafo: o transistor, a teoria da informação, o Unix, o laser, a telefonia celular. Tire a Bell Labs e a indústria que este site ensina simplesmente não existe.",
        "A vida corporativa posterior é uma lição à parte: pesquisa sem igual, três donos, uma bolha e a verdade dura de que inventar o futuro e capturar o seu valor são habilidades diferentes.",
      ],
    },
    // Lineage note (lineage.note; member slugs stay the English record's; endings apply, 26/10/2026).
    lineageNote:
      "O Bell Labs continua como Nokia Bell Labs, enquanto a Alcatel-Lucent passou ao controle da Nokia em janeiro de 2016 e o próprio relatório anual da Nokia cita a Lucent Technologies como antecessora da sua subsidiária americana.",
  },

  // binario: record prose only.
  "binario": {
    // Card title, tagline and intro.
    name: "Grupo Binario - o integrador Juniper e seu braço de treinamento",
    tagline: "Escolheu um único fabricante na fundação e construiu em volta dele uma esteira de certificações.",
    intro:
      "O Grupo Binario foi criado em São Paulo em 2005 como integrador de redes para o mundo IP e escolheu a Juniper Networks desde o início, em vez de montar um catálogo multifabricante. Essa decisão definiu tudo o que veio depois: implantar redes para as grandes operadoras de telecomunicações brasileiras e, em 2015, ser descrito como o maior integrador Juniper do país, com o maior número de engenheiros certificados.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O grupo se organizou em divisões (a Binario para integração e a QoS para serviços profissionais, com uma divisão de mobilidade ao lado delas durante um período) e chegou a cerca de 160 funcionários em cinco filiais, atendendo provedores de serviço, empresas, governo e educação.",
      "O compromisso com um único fabricante é a parte que vale entender. Um integrador que se espalha por vários fabricantes protege o risco e dilui a profundidade; um que se compromete ganha as certificações, o caminho de escalonamento e os prêmios, e aceita que o seu destino fica atrelado ao de um fabricante. Os prêmios vieram (Services Partner of the Year 2017 para as Américas, e os níveis de parceria que só se abrem acima de um patamar de certificações), e a exposição também veio, quando a Juniper foi adquirida mais tarde.",
    ],
  },

  // bluecat: record prose only.
  "bluecat": {
    // Card title, tagline and intro.
    name: "BlueCat Networks - DDI pelo lado das operações",
    tagline: "DNS, DHCP e gestão de endereços vendidos como operação de rede, não como infraestrutura.",
    intro:
      "A BlueCat atua no mesmo terreno de DDI que a Infoblox (DNS, DHCP e gestão de endereços IP unificados) e o enquadra como operação de rede: o argumento de que quem detém os registros de endereços detém o mapa da rede.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A disputa entre fabricantes de DDI tem menos a ver com recursos de protocolo, que são padronizados, do que com o que o sistema faz com o registro depois que o detém: integração com provedores de nuvem, interfaces de automação e os relatórios que transformam um banco de endereços num inventário.",
      "Isso é útil saber antes de avaliar um deles, porque uma comparação de recursos entre implementações de DNS e DHCP vai encontrar pouca coisa que os diferencie.",
      "Foi lançada em 2001 por dois irmãos, Richard e Michael Hyatt, com o objetivo declarado de fazer appliances de rede simples, seguros e acessíveis. É uma ambição modesta para uma categoria que, na época, não era nenhuma dessas três coisas.",
    ],
  },

  // brasil-telecom: record prose, ending note and the complete translated profile.
  "brasil-telecom": {
    // Card title (company name only), tagline and intro.
    name: "Brasil Telecom",
    tagline: "Uma das doze partes, que passou uma década voltando a fazer parte de uma peça maior.",
    intro:
      "A Brasil Telecom foi uma das três holdings de telefonia fixa criadas quando o Sistema Telebrás foi leiloado, em 29 de julho de 1998, e cobria o Sul, o Centro-Oeste e parte do Norte do país. Durou cerca de onze anos como empresa independente.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A história dela é a discussão sobre a privatização em miniatura. O sistema foi dividido para criar concorrência, com o raciocínio de que várias operadoras atenderiam melhor os clientes do que uma só. O que aconteceu na década seguinte foi que as partes começaram a comprar umas às outras: a Brasil Telecom foi adquirida pela Oi, o grupo construído sobre a Telemar, outra das três holdings de telefonia fixa, num negócio concluído em 2009.",
      "Assim, duas das três partes que o Estado tinha separado de propósito estavam juntas de novo em menos de onze anos, e a terceira (a operadora de São Paulo, a Telesp) tinha virado o negócio brasileiro de uma multinacional espanhola. Novecentas empresas tinham virado uma, depois doze, e agora voltavam a caminhar para um punhado.",
      "Se isso é uma falha do desenho ou simplesmente o que as telecomunicações fazem é uma pergunta justa, e continua em aberto. Redes têm fortes economias de escala e custos de interconexão que premiam a consolidação; os reguladores sabem disso e tentam segurar a linha. O padrão não é exclusivo do Brasil, e qualquer argumento de que ele prova algo sobre a privatização precisa explicar por que a mesma consolidação aconteceu em países que privatizaram de outro jeito, e em alguns que não privatizaram.",
      "Os últimos anos da empresa também foram marcados por uma disputa societária longa e pública, e o grupo que saiu da fusão teve a sua própria história financeira difícil. A situação atual é melhor conferida em documentos recentes.",
    ],
    // The ending's note (the year stays in the English record).
    endedNote:
      "Adquirida pela Oi (então Telemar), reunindo duas das três holdings de telefonia fixa que a privatização de 1998 tinha separado.",
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "brasil-telecom",
      // Founding story (company, year and founders unchanged).
      foundings: [
        {
          company: "Tele Centro Sul Participações",
          year: 1998,
          place: "Brasília",
          founders: ["Banco Opportunity", "Telecom Italia", "Brazilian pension funds"],
          story:
            "Constituída em 22 de maio e leiloada em julho a um consórcio, e não a uma única operadora: um banco nacional, uma operadora italiana e fundos de pensão, o que descreve bem quem conseguia levantar tanto capital no Brasil naquela época. Adotou o nome Brasil Telecom em abril de 2002.",
        },
      ],
      // Timeline: same years, same order.
      timeline: [
        { year: 1998, title: "O ágio diz o que valia a pena ter", detail: "A concessão de telefonia fixa de São Paulo foi vendida com ágio de 64% sobre o preço mínimo. Esta foi vendida com 6%. Os compradores não estavam em dúvida sobre qual lote queriam; a diferença entre esses dois números é a diferença entre uma cidade e um continente, precificada no próprio dia." },
        { year: 1998, title: "O leilão não foi pacífico", detail: "Mais de três mil policiais protegeram a bolsa do Rio de Janeiro contra manifestações do movimento dos trabalhadores sem terra, dos sindicatos e da central sindical. O MST tinha ocupado o saguão do banco de desenvolvimento na véspera, e a venda só começou depois que várias liminares judiciais foram derrubadas." },
        { year: 2000, title: "CRT", detail: "A operadora do Rio Grande do Sul, comprada por cerca de R$ 1,4 bilhão, fez do grupo o segundo do país em área de cobertura: o primeiro lance de uma década de comprar em vez de construir." },
        { year: 2002, title: "Cabo submarino", detail: "A compra do sistema de fibra submarina GlobeNet, junto com uma participação na MetroRED: uma operadora regional de telefonia fixa comprando capacidade intercontinental, uma ambição maior do que a concessão sugeria." },
        { year: 2009, title: "A marca sai de cena", detail: "O controle passou em 8 de janeiro, por uma cadeia de holdings, e a marca Oi substituiu a Brasil Telecom em 17 de maio." },
      ],
      // Products: descriptor words localised; descriptions translated.
      products: [
        { name: "Concessão de telefonia fixa, Região II", what: "Serviço local e intrarregional no Distrito Federal e em nove estados, com 8,1 milhões de linhas no auge." },
        { name: "Longa distância CSP 14", what: "O código de seleção de prestadora, a partir de 1999 no âmbito regional e de 2004 no nacional e internacional: o mecanismo pelo qual uma concessionária regional competia fora da própria região." },
        { name: "Telefonia móvel", what: "Entrou em 2004, seis anos depois do negócio fixo, e passou de quatro milhões de assinantes em três anos. A largada tardia é a própria história: as licenças móveis tinham sido vendidas separadamente em 1998." },
        { name: "Banda larga e data center", what: "1,8 milhão de assinantes de ADSL e serviços de hospedagem: os negócios que cresceram enquanto a voz fixa encolhia." },
      ],
      // Innovations.
      innovations: [
        { title: "A geografia era o business case, e era um mau business case", detail: "A Região II cobria cerca de um terço do território brasileiro e aproximadamente um quarto da população. A economia das telecomunicações premia a densidade, e uma concessão com um terço da terra e um quarto das pessoas é o inverso do que uma operadora quer. O ágio de 6% não era pessimismo; era aritmética." },
        { title: "Comprar alcance em vez de construí-lo", detail: "Uma operadora regional que adquire outra operadora, depois um sistema de cabo submarino, depois uma participação numa rede metropolitana, está tentando escapar das fronteiras da própria concessão. A estratégia é coerente e também é uma confissão: o território licenciado, sozinho, não era um negócio suficiente." },
        { title: "Competir fora da própria região por código", detail: "Os códigos de seleção de prestadora permitiam ao cliente escolher de quem era a rede que levava uma ligação de longa distância, discando dois dígitos a mais. É um dispositivo regulatório, não de engenharia, e foi assim que um mercado desenhado como monopólios regionais separados passou a ter alguma concorrência." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "Cerca de 41 milhões de pessoas no Distrito Federal e em nove estados, atendidas no auge com 8,1 milhões de linhas fixas, 5,6 milhões de assinantes móveis e 1,8 milhão de conexões de banda larga, com aproximadamente vinte mil funcionários.",
        "Os concorrentes eram as outras concessionárias que atuavam além das fronteiras regionais pelos mesmos mecanismos que ela usava e, no fim, o grupo que a comprou.",
      ],
      analyst: [
        "Qualquer avaliação hoje é do grupo sucessor, e não desta empresa, e o histórico desse grupo é um assunto à parte.",
        "O número que vale guardar é o do primeiro dia. Um ágio de 6% queria dizer que o mercado achava que esta concessão valia quase exatamente o preço mínimo, enquanto São Paulo saiu por dois terços a mais do que o seu. Onze anos depois, o lote barato foi absorvido pelo grupo que tinha comprado outro lote, e o lote caro tinha virado o negócio brasileiro de uma multinacional espanhola. A consolidação que o verbete acima descreve já estava visível nos preços do leilão antes de qualquer parte dela acontecer.",
      ],
    },
  },

  // cabletron-enterasys: record prose, ending note, acquisitions and the complete translated profile.
  "cabletron-enterasys": {
    // Card title (company names only), tagline and intro.
    name: "Cabletron Systems and Enterasys",
    tagline: "Vendia cabos montados numa garagem, virou o rival mais sério da Cisco e depois se desmontou de propósito.",
    intro:
      "Robert Levine e Craig Benson fundaram a Cabletron Systems em Rochester, New Hampshire, em março de 1983, trabalhando na garagem de Levine e vendendo cabos montados. Ela se tornou uma das maiores empresas de redes do mundo e, por um período no início dos anos 1990, foi a alternativa crível à Cisco no mercado corporativo.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O produto que a fez foi o hub MMAC e, mais tarde, a linha SmartSwitch, vendidos com uma filosofia de operação incomum para a época: a Cabletron mantinha a sua própria organização de serviço de campo, em vez de empurrar tudo pelas revendas, e é por isso que tinha fama de aparecer quando chamada.",
      "Comprou de forma agressiva ao longo dos anos 1990, e as aquisições importam mais do que os números de receita, porque foi nelas que a empresa acabou se dividindo.",
      "Em 2000, a Cabletron anunciou que se dividiria em quatro empresas independentes antes que alguém a desmembrasse. A Enterasys ficou com o negócio de switching corporativo, a Riverstone com o negócio de roteamento para operadoras e redes metropolitanas construído sobre a Yago, a Aprisma com a gestão de redes e a plataforma Spectrum, e a GlobalNetwork Technology Services com os serviços profissionais. É um dos poucos exemplos de uma grande empresa de redes que escolheu a dissolução como estratégia.",
      "A Enterasys carregou o nome corporativo por uma década, sobrevivendo a um escândalo contábil que levou a condenações de executivos, antes de ter o capital fechado e depois adquirida pela Extreme Networks em 2013 por US$ 180 milhões. Assim, a linha corporativa que começou numa garagem de New Hampshire em 1983 hoje sai de fábrica como Extreme.",
      "O fio condutor que vale notar é que quatro verbetes separados desta linha do tempo (Enterasys, Riverstone, Aprisma e, por fim, Extreme) remontam à mesma garagem de 1983, e dois deles aparecem aqui como capítulos de uma carreira, além de empresas.",
    ],
    // The ending's note (the year stays in the English record).
    endedNote: "A Enterasys, o remanescente corporativo da Cabletron, foi adquirida pela Extreme Networks em 2013 por US$ 180 milhões.",
    // Acquisitions: same length and order as the English list.
    acquisitions: [
      {
        what: "Switching de camada 3 em wire speed, que virou o SmartSwitch Router.",
        became: "Separada como Riverstone Networks em 2001, e um verbete próprio nesta linha do tempo.",
      },
      {
        what: "A divisão de redes da DEC, comprada da Digital pouco antes de a Compaq adquirir o resto da empresa.",
        subAcquisitions: [
          { what: "A DEC foi fundada em 1957 e definiu a era do minicomputador; o seu braço de redes acabou na Cabletron e o restante na Compaq em 1998, que a HP adquiriu depois, em 2002." },
        ],
      },
      {
        what: "Acesso remoto ISDN e switching ATM, comprados no mesmo ano em que o mercado discutia qual tecnologia levaria o backbone corporativo.",
      },
    ],
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "cabletron-enterasys",
      // Founding story (company, year and founders unchanged).
      foundings: [
        {
          company: "Cabletron Systems",
          year: 1983,
          place: "Massachusetts (uma garagem); Rochester, New Hampshire, a partir de 1985",
          founders: ["Robert Levine", "Craig Benson"],
          story:
            "Em março de 1983, um cliente pediu ao vendedor de cabos Robert Levine, de 25 anos, 1.000 pés de cabo de rede especial, e o fornecedor dele se recusou a cortar menos de 10.000. Levine e Craig Benson, de 28 anos, especialista em materiais vindo da pioneira de LAN Interlan, começaram a cortar o cabo eles mesmos na garagem de Levine. Mudaram-se para New Hampshire em 1985 pelos impostos, pelo espaço fabril barato e pelos engenheiros dispensados pelos gigantes do minicomputador em declínio da Route 128, e abriram capital em 1989. Levine conduzia reuniões de vendas em uniforme de combate, brandindo um facão; Benson se tornou depois o 79º governador de New Hampshire. No auge: 6.600 funcionários e receita acima de US$ 1,8 bilhão.",
        },
      ],
      // Timeline: same years, same order, the personal marker unchanged.
      timeline: [
        { year: 1983, title: "Fundada numa garagem", detail: "Março de 1983: Levine e Benson começam a cortar o cabo Ethernet que nenhum fornecedor vendia em lotes pequenos. Em dois anos, estão instalando redes e projetando os seus próprios equipamentos em Rochester, New Hampshire." },
        { year: 1988, title: "Começa a era do MMAC", detail: "Os primeiros sucessos da Cabletron (o ST-500, o primeiro transceiver Ethernet com LEDs de diagnóstico, e o kit de teste de campo LAN-MD) levam aos hubs modulares MMAC. Módulos 10BASE-T de alta densidade (24 ou 48 portas por slot) e o gerenciador de elementos Prism fazem do MMAC-8 o wiring closet do início dos anos 1990.", sourceNote: "Histórico de produtos segundo o artigo da Wikipedia sobre a Cabletron; a família MMAC data do fim dos anos 1980, quando o 10BASE-T se padronizou." },
        { year: 1989, title: "IPO e a escalada", detail: "A Cabletron abre capital. A receita passa de US$ 418 milhões em 1993 e de US$ 1 bilhão em 1996: uma das \"quatro grandes\" de redes, ao lado de Cisco, Bay e 3Com, famosa por uma cultura de vendas tão agressiva quanto a sua engenharia. No começo, chegou a desenvolver com a Cisco um módulo de roteador para o MMAC-8, antes de construir o seu próprio roteamento." },
        { year: 1996, title: "Começa a farra de aquisições: Network Express", detail: "A Cabletron compra a Network Express, fabricante de acesso comutado ISDN, para incorporar o acesso remoto discado às suas plataformas: o primeiro de uma série de negócios feitos para comprar o que Rochester não tinha construído.", sourceNote: "8-K da Network Express na SEC, 1996." },
        { year: 1997, title: "A liderança racha; o negócio com a DEC", detail: "Em 1º de setembro de 1997, Levine renuncia ao cargo de presidente e CEO e Benson recua para a presidência do conselho. A Cabletron concorda em adquirir o Network Products Business da Digital Equipment Corporation por cerca de US$ 430 milhões: um canal de distribuidores, a herança do GIGAswitch e um acordo de revenda com a Digital válido até meados de 2001, operado como Digital Network Products Group.", sourceNote: "S-4 da Cabletron na SEC, ano fiscal de 1998; US$ 430 milhões segundo a Forbes, outubro de 1998." },
        { year: 1998, title: "Yago Systems: a melhor compra que a Cabletron já fez", detail: "17 de março de 1998: já com cerca de 25% da startup, a Cabletron adquire a Yago Systems, fabricante de roteadores em wire speed, por aproximadamente US$ 165,7 milhões em ações: 6,0 milhões de ações de imediato, mais 5,2 milhões emitidas em setembro de 1999 pela garantia de US$ 35 por ação prevista no negócio, com US$ 150 milhões lançados como P&D em andamento. O SmartSwitch Router da Yago prometia 100 vezes o desempenho dos roteadores em software; um analista chamou depois a Yago de 'the best thing Cabletron ever bought into.' (a melhor coisa em que a Cabletron já investiu). O mesmo ano traz a NetVantage, fabricante de switches Fast Ethernet, e as fabricantes de DSL Ariel e FlowPoint.", sourceNote: "Documentos 10-Q/A da Cabletron e 424B4 da Riverstone na SEC; Forbes, outubro de 1998; Computerworld, fevereiro de 2001." },
        { year: 2000, title: "A divisão em quatro", detail: "Fevereiro de 2000: o CEO Piyush Patel, ele mesmo ex-CEO da Yago, divide a Cabletron em quatro: Riverstone Networks (Santa Clara, provedores de serviço, a linha Yago, liderada por Romulus Pereira), Enterasys Networks (Rochester, o mercado corporativo, liderada por Henry Fiallo), Aprisma Management Technologies (a suíte de gestão Spectrum, Michael Skubisz) e GNTS (serviços profissionais, Earle Humphreys). A Cabletron vira uma holding com 4.500 funcionários, com a fabricação já vendida para a Flextronics.", sourceNote: "EE Times e Computerworld, fevereiro de 2000." },
        { year: 2001, title: "A Cabletron deixa de existir", detail: "A Riverstone faz o IPO em fevereiro de 2001 e é distribuída aos acionistas naquele verão: o único spin-off de verdade. A holding é incorporada à Enterasys em agosto de 2001, e o nome Cabletron entra para a história dezoito anos depois da garagem." },
        { year: 2003, title: "A Enterasys paga pelos seus números", detail: "Uma reapresentação de balanço de 2002, por reconhecimento de receita, apaga os primeiros lucros pós-divisão; a investigação da SEC e as ações de acionistas terminam em acordo em outubro de 2003 por US$ 50,4 milhões, e em dezembro de 2006 quatro ex-executivos são condenados à prisão." },
        { year: 2006, title: "Capital fechado sob a Gores", detail: "O Gores Group e a Tennenbaum Capital fecham o capital da Enterasys por cerca de US$ 386 milhões (anúncio em novembro de 2005, conclusão em março de 2006); em 2008, a Gores a junta com uma participação de 51% na Siemens Enterprise Communications numa transação de US$ 550 milhões." },
        { year: 2013, title: "O DNA chega à Extreme", detail: "12 de setembro de 2013: a Extreme Networks anuncia a aquisição da Enterasys por cerca de US$ 180 milhões em dinheiro (US$ 105 milhões em caixa, US$ 75 milhões emprestados), praticamente dobrando a receita da Extreme. A linhagem da Cabletron, e a base de clientes que eu atendi a partir do Brasil, segue viva num dos fabricantes que eu ensino hoje.", sourceNote: "Network World e Network Computing, setembro de 2013." },
        { year: 1996, personal: true, title: "Começa o meu capítulo", detail: "De 1996 a 2000 na Cabletron Systems no Brasil, o primeiro emprego de uma carreira que começa no meio da guerra dos hubs, e uma segunda passagem, de 2005 a 2007, na Enterasys, dentro da mesma linhagem depois da divisão. Parte da primeira passagem foi o lado Cisco do catálogo: a Cabletron era então a maior revenda da Cisco, pela linha OEM que pôs o Cisco IOS e o roteamento Cisco dentro dos hubs MMAC, e eu era um dos seus especialistas, levando aos clientes explicações de recursos e exemplos de configuração tirados dos CDs de documentação interna que a empresa enviava aos seus escritórios.", sourceNote: "Comunicado de imprensa da Cisco, 27 de março de 1995 (a Cabletron integra o Cisco IOS em toda a sua linha de hubs inteligentes, sobre a tecnologia de roteamento 2500/4000/4500, numa parceria de cinco anos); a posição de revenda e o detalhe de campo são registro do próprio autor." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "ST-500 e LAN-MD", what: "Os produtos fundadores: o primeiro transceiver Ethernet com LEDs de diagnóstico e o primeiro kit de teste de campo prático para 10BASE5, ferramentas para a época em que a Ethernet em coaxial grosso era quase impossível de depurar." },
        { name: "Hubs modulares MMAC", what: "O MMAC-8, o -5 e o -3, com módulos 10BASE-T de alta densidade e o gerenciador de elementos Prism: os wiring closets de cabeamento estruturado do início dos anos 1990 e a resposta da Cabletron à SynOptics." },
        { name: "SPECTRUM", what: "A plataforma de gestão de redes cuja inteligência baseada em modelos sobreviveu a todo o resto: separada como Aprisma em 2000, vendida à Concord Communications e depois à Computer Associates por US$ 350 milhões, e ainda hoje uma linhagem de gestão." },
        { name: "SmartSwitch Router (Yago)", what: "Switching de camada 3/4 em wire speed vindo da aquisição da Yago em 1998: o produto que virou a linha para operadoras da Riverstone e o núcleo de roteamento corporativo da Enterasys." },
        { name: "Digital Network Products Group", what: "O patrimônio de redes da DEC, de US$ 430 milhões: a herança do GIGAswitch, uma base instalada e um canal de revenda que por pouco tempo fez da Cabletron a parceira estratégica de redes da Digital." },
      ],
      // Innovations.
      innovations: [
        { title: "A capacidade de diagnóstico como produto", detail: "As primeiras vitórias da Cabletron vieram de tornar a Ethernet observável (LEDs no transceiver, um kit de teste na maleta de campo), uma filosofia que amadureceu na gestão baseada em modelos do SPECTRUM." },
        { title: "A virada de comprar em vez de construir", detail: "No fim dos anos 1990, a Cabletron tentou entrar por aquisição em roteamento e acesso WAN (Network Express, NetVantage, Ariel, FlowPoint, o patrimônio da DEC e, acima de tudo, a Yago), uma farra cujo único sucesso inequívoco semeou duas empresas." },
        { title: "A destruição criativa como estratégia", detail: "A divisão em quatro de 2000 foi um dos atos corporativos mais ousados da época: dissolver de propósito uma marca de um bilhão de dólares para que as suas partes sobrevivessem, e três das quatro sobreviveram." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "A Cabletron foi uma das \"quatro grandes\" de redes dos anos 1990, com Cisco, Bay Networks e 3Com, chegando a mais de US$ 1,8 bilhão de receita e 6.600 funcionários antes que o mercado de hubs de LAN que ela dominava se comoditizasse por baixo dela.",
        "Cada fio encontrou um destino: a linha corporativa, pela Enterasys, até a Extreme Networks (2013); a linha de roteamento da Yago, pela Riverstone, até uma venda em falência para a Lucent em 2006; e o SPECTRUM, pela Aprisma e pela Concord, até a Computer Associates. Eu vivi dois capítulos a partir do Brasil (Cabletron de 1996 a 2000 e Enterasys de 2005 a 2007) e hoje ensino a linhagem sobrevivente na Extreme.",
      ],
      analyst: [
        "Joel Conover, da Current Analysis, sobre o negócio de 1998 que fez diferença: 'The Yago group was the best thing Cabletron ever bought into' (o grupo da Yago foi a melhor coisa em que a Cabletron já investiu); a tecnologia e as pessoas dela sustentaram tanto a Enterasys quanto a Riverstone depois da divisão.",
        "O balanço da farra, segundo os documentos na SEC: a Yago, por US$ 165,7 milhões, gerou duas empresas; o patrimônio da DEC, de US$ 430 milhões, foi revendido em menos de três anos, quando a divisão reorientou o portfólio.",
      ],
    },
  },

  // capgemini: record prose plus the complete translated profile.
  "capgemini": {
    // Card title, tagline, intro and body.
    name: "Capgemini - e o negócio brasileiro de serviços que ela absorveu",
    tagline: "Multinacional francesa de serviços de TI; compradora da empresa brasileira TI Braxis.",
    intro:
      "A Capgemini é uma multinacional francesa de serviços de TI e aparece nesta linha do tempo por causa de uma aquisição: a empresa brasileira de serviços CPM Braxis foi absorvida por ela, e foi assim que uma parte substancial da capacidade brasileira de aplicações e outsourcing passou a ter dono em Paris.",
    body: [
      "A transação é uma ocorrência de um padrão que esta linha do tempo registra várias vezes, a partir de pontos de partida diferentes. Um negócio de serviços é comprado pelas pessoas e pelos contratos, ambos locais; o comprador não é, e a contabilidade, a metodologia e o plano de carreira que vêm depois são os do comprador.",
      "A empresa que a Capgemini comprou foi a CPM Braxis, que tem verbete próprio aqui. TI Braxis não era um nome trocado para ela, mas uma das empresas que a formaram: a Braxis Tecnologia da Informacao adquiriu a Unitech em novembro de 2006 e ficou com 33% da CPM em março de 2007, e a empresa resultante levou os dois nomes.",
    ],
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "capgemini",
      // Founding story (company, year and founders unchanged).
      foundings: [
        {
          company: "Sogeti",
          year: 1967,
          place: "Grenoble, França",
          founders: ["Serge Kampf"],
          story:
            "A Capgemini começou em Grenoble em 1967 como Sogeti, a Société pour la Gestion de l'Entreprise et le Traitement de l'Information, fundada por Serge Kampf no mesmo ano em que ele saiu do Groupe Bull. Vale ler o nome ao pé da letra, porque ele diz com clareza qual era o negócio original: gestão de empresas e processamento de informação, nessa ordem. Era uma firma que vendia como serviço o tratamento dos dados de um cliente numa época em que o computador que fazia esse tratamento ainda pertencia a outra pessoa, e a ordem desses dois substantivos é toda a indústria de serviços em miniatura.",
          sourceNote:
            "Grenoble e 1967 aparecem de forma consistente nos registros. O número de fundadores, não: o relato da carreira do próprio Kampf diz que ele e três colegas fundaram a Sogeti, enquanto a empresa costuma ser descrita como fundada só por Kampf. Os três não são nomeados nas fontes lidas, por isso não são nomeados aqui.",
        },
      ],
      // Timeline: same years, same order.
      timeline: [
        { year: 1975, title: "Duas aquisições viram o nome", detail: "A Sogeti adquiriu o Centre d'Analyse et de Programmation e a Gemini Computer Systems e adotou o nome composto CAP Gemini Sogeti. Uma firma que se batiza com o nome do que comprou está dizendo como pretende crescer, e os cinquenta anos seguintes não a desmentiram." },
        { year: 1996, title: "Cap Gemini", detail: "O elemento Sogeti saiu da razão social, que ficou Cap Gemini. O nome original de 1967 sobreviveu como marca de uma subsidiária, em vez de desaparecer, que é o destino habitual de um nome fundador dentro de um grupo que cresceu além dele." },
        { year: 2010, title: "Cinquenta e cinco por cento da CPM Braxis, e uma opção sobre o resto", detail: "Em 2 de setembro de 2010, a Capgemini anunciou que ficaria com 55% da empresa brasileira de serviços de TI CPM Braxis por R$ 517 milhões, cerca de 233 milhões de euros, sobre um enterprise value estimado em R$ 970 milhões, cerca de 437 milhões de euros. O dinheiro foi para duas direções ao mesmo tempo: um aumento de capital de R$ 287 milhões na empresa e uma recompra de R$ 230 milhões em ações dos acionistas existentes. A CPM Braxis projetava cerca de R$ 1 bilhão de receita em 2010, com mais de 5.500 pessoas. A conclusão foi anunciada em outubro.", sourceNote: "Números do anúncio e dos comunicados de conclusão da própria Capgemini, conforme reproduzidos pela MarketScreener. O anúncio previa a conclusão no início de outubro; o comunicado de conclusão foi publicado em 13 de outubro de 2010 e indica uma data de conclusão em outubro, de modo que o mês é certo e o dia não é repetido aqui." },
        { year: 2010, title: "Os quarenta e cinco por cento que ficaram onde estavam", detail: "Maioria não é propriedade, e a estrutura dizia isso. A Capgemini tinha opções de compra sobre os 45% restantes e os acionistas vendedores tinham opções de venda equivalentes, e nenhum dos lados podia exercê-las antes do terceiro aniversário da conclusão, com limite máximo de cinco anos e preço fixado pelo valor justo de mercado no momento do exercício. A CPM Braxis foi consolidada nas contas da Capgemini de imediato, com o valor estimado desses 45% registrado no balanço como passivo. Durante pelo menos três anos, o negócio brasileiro foi integralmente consolidado sem ser integralmente possuído, e o preço do resto era desconhecido por desenho.", sourceNote: "Os termos das opções e o tratamento contábil vêm do anúncio de conclusão da Capgemini. Nenhuma fonte localizada registra o exercício das opções, por isso nenhum evento aqui diz que elas foram exercidas." },
        { year: 2012, title: "CPM Braxis Capgemini, e os bancos", detail: "Em junho de 2012, o negócio operava com o nome conjunto CPM Braxis Capgemini, com mais de 6.500 pessoas e mais de 200 clientes no Brasil, e anunciou a Caixa Econômica Federal como cliente na condição de fornecedor preferencial, ao lado de uma relação já existente com o Bradesco. Dois dos maiores bancos do país numa só frase respondem por que um grupo francês pagou por uma empresa brasileira de serviços em vez de construir uma: os contratos eram o ativo, e contratos desse tamanho não começam do zero nas mãos de um recém-chegado." },
        { year: 2017, title: "Capgemini SE", detail: "O grupo virou Capgemini SE, adotando a forma de sociedade europeia. Cinquenta anos depois de Grenoble, o elemento do nome que sobrevive é a metade que veio de uma aquisição." },
      ],
    },
  },

  // ciena: record prose plus the complete translated profile.
  "ciena": {
    // Card title, tagline, intro and body.
    name: "Ciena - a empresa que ensinou a fibra a carregar cores",
    tagline:
      "A primeira implantação comercial de DWDM (Sprint, 1996) multiplicou por dezesseis a fibra instalada, e a Ciena vem acumulando ganhos na camada óptica desde então, herança da Nortel incluída.",
    intro:
      "A multiplexação densa por divisão de comprimento de onda de David Huber transformou um único fio de vidro em dezesseis canais sem cavar um metro de vala: a implantação na Sprint, em 1996, que mudou da noite para o dia a economia da longa distância. A Ciena sobreviveu à quebra que matou os rivais, herdou a coroa óptica da Nortel em 2010, e a sua óptica coerente WaveLogic fez da capacidade por comprimento de onda uma curva de semicondutores.",
    body: [
      "O perfil cobre a fundação em 1992, o MultiWave 1600 e o IPO recordista de 1997, os anos da quebra, a aquisição da divisão óptica da Nortel e a era coerente, dos 40G até a classe de 800G de hoje.",
    ],
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "ciena",
      // Founding story (company, year and founders unchanged).
      foundings: [
        {
          company: "Ciena (founded as HydraLite)",
          year: 1992,
          place: "Maryland, Estados Unidos",
          founders: ["David Huber (Patrick Nettles, founding CEO)"],
          story:
            "A sacada de David Huber foi que a fibra já enterrada podia carregar muitos comprimentos de onda ao mesmo tempo (cores, cada uma um canal completo) se alguém transformasse em produto a multiplexação densa por divisão de comprimento de onda. Em junho de 1996, a Sprint acendeu o MultiWave 1600 da Ciena e um fio de vidro virou dezesseis: capacidade multiplicada sem cavar. O IPO de fevereiro de 1997 bateu recordes, a quebra quase matou o setor, e a Ciena saiu dela como a pure-play que define a camada óptica, chegando a herdar a coroa óptica da Nortel.",
        },
      ],
      // Timeline: same years, same order.
      timeline: [
        { year: 1996, title: "O primeiro DWDM comercial", detail: "A Sprint implanta o MultiWave 1600: dezesseis canais de 2,5 Gb/s numa só fibra. A economia da longa distância muda da noite para o dia: banda deixa de significar valas e passa a significar transponders.", sourceNote: "Data de implantação segundo o registro público." },
        { year: 1997, title: "O IPO recordista", detail: "Fevereiro de 1997: a Ciena abre capital com a maior avaliação de primeiro dia até então para uma startup financiada por venture capital, o mercado precificando o que a fibra multiplicada significava para a expansão da internet que vinha pela frente." },
        { year: 2002, title: "Sobrevivendo ao inverno", detail: "A quebra das telecomunicações devasta os gastos com óptica; a Ciena corta fundo, diversifica (ONI Systems e outras) e sobrevive a um campo de rivais bem financiados: a disciplina que a posiciona para o maior prêmio da década." },
        { year: 2010, title: "A herança óptica da Nortel", detail: "A Ciena adquire o negócio Metro Ethernet Networks da Nortel (cerca de US$ 770 milhões) na falência: chegam os pioneiros do coerente de 40G e as linhas OME/6500, e a Ciena vira a herdeira da grande tradição óptica canadense.", sourceNote: "Valor do negócio segundo o registro público." },
        { year: 2012, title: "A era coerente WaveLogic", detail: "A detecção coerente (codificar em fase e polarização, desfazendo as degradações em DSP) vira a franquia da Ciena; cada geração WaveLogic praticamente dobra o que um comprimento de onda carrega, dos 40G até a classe de 800G de hoje." },
        { year: 2020, title: "A camada por baixo de tudo", detail: "Construções submarinas, DCI metropolitano, automação Blue Planet: a Ciena se acomoda no seu papel. Seja qual for o logotipo no roteador, os fótons por baixo muitas vezes viajam em sistemas de linha da Ciena." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "MultiWave 1600", what: "O primeiro sistema comercial de WDM denso: o artefato de 1996 que multiplicou a fibra instalada." },
        { name: "Família 6500", what: "A plataforma convergente packet-optical (com a herança da Nortel por dentro) que ancora redes de operadoras e de DCI." },
        { name: "Óptica coerente WaveLogic", what: "A linha de modems definida por DSP que transformou a capacidade por comprimento de onda num produto melhorado por software." },
      ],
      // Innovations.
      innovations: [
        { title: "O DWDM como produto", detail: "Outros demonstraram a multiplexação por comprimento de onda; a Ciena a ENTREGOU numa rede de operadora em produção: o momento em que a capacidade da fibra se desvinculou da obra civil." },
        { title: "Liderança em óptica coerente", detail: "Apostar a empresa no DSP coerente fez de distância vezes capacidade uma curva de semicondutores: a Lei de Moore da própria camada óptica." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "A Ciena continua sendo a principal fabricante independente de sistemas ópticos (longa distância, submarino, metropolitano e interconexão de data centers): a pure-play que sobreviveu à bolha e à maioria dos rivais.",
      ],
      analyst: [
        "Todo número de throughput que as calculadoras deste site produzem acaba viajando num comprimento de onda, e o motivo de os comprimentos de onda serem baratos é uma implantação na Sprint em 1996 e a empresa que continuou multiplicando aquele ganho.",
      ],
    },
  },

  // corvil: record prose, ending note and successor label.
  "corvil": {
    // Card title, tagline and intro.
    name: "Corvil - o microssegundo, medido em Dublin",
    tagline:
      "Uma empresa de Dublin que transformou a captura de pacotes nas medições do próprio pregão eletrônico e se vendeu a uma provedora de infraestrutura de Nova York em 2019.",
    intro:
      "A Corvil foi fundada em Dublin em 2000 pelo professor John Lewis, três funcionários da Telia e três pós-graduandos do Trinity College Dublin, e virou a empresa de análise de dados de rede do trading eletrônico: appliances que capturam sem perdas o tráfego de uma infraestrutura de negociação, decodificam os protocolos de dados de mercado e de ordens que ele carrega e relatam o que aconteceu com cada ordem, cada tick e cada execução, e quanto tempo isso levou. Os clientes eram as bolsas e os bancos, entre eles NYSE, London Stock Exchange, Nasdaq, Moscow Exchange, Nomura, Thomson Reuters e Commerzbank, e a empresa mantinha escritórios em Nova York, Londres, Tóquio, Toronto e Cracóvia.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Vale descrever o produto com precisão, porque é o único canto deste catálogo em que uma rede é medida na moeda da aplicação que roda sobre ela. Onde uma ferramenta de monitoramento convencional relata utilização e erros, a Corvil relata latência e lacunas nos feeds, tempos de tick-to-trade e taxas de execução, com os sintomas de rede por trás deles (retransmissões, congestionamento e tempos de ida e volta) em resolução de um segundo. Um milissegundo tem preço num pregão, e a análise foi construída para dizer qual.",
      "Em 9 de julho de 2019, a Pico, provedora nova-iorquina de infraestrutura de data center, conectividade com bolsas e serviços de nuvem para os mercados financeiros, assinou um acordo definitivo para adquirir a Corvil, com conclusão prevista em trinta dias; no fim de julho, as partes previam o início de agosto, e nenhuma revelou os termos, já que ambas eram de capital fechado. A empresa combinada atenderia mais de quatrocentos bancos, bolsas, gestoras de ativos, fornecedores de fintech e firmas de trading em cinco continentes, e o CEO da Corvil, Donal Byrne, virou o seu CTO. A própria Pico opera cerca de trinta e cinco locais de data center e tem participação minoritária de Goldman Sachs, JP Morgan, UBS e Wells Fargo.",
      "Hoje o nome sobrevive como Corvil Analytics, descrita pela Pico como a sua plataforma de análise derivada da rede para mercados financeiros: captura de pacotes sem perdas e decodificação profunda de protocolos a até 200 gigabits por segundo sustentados, com métricas de cada ordem, cada tick e cada execução ao longo de todo o ciclo de negociação. A engenharia de Dublin que começou como pesquisa universitária é hoje a camada de medição de uma empresa de infraestrutura de Wall Street, um caminho longo para percorrer na força de saber exatamente quando um pacote chegou.",
    ],
    // The ending's note (the year stays in the English record) and the successor label (the URL stays English).
    endedNote: "adquirida pela Pico em 2019; continua como a Corvil Analytics da Pico",
    successorLabel: "Corvil Analytics, na Pico",
  },

  // data-general: record prose, ending note, successor label and the complete translated profile.
  "data-general": {
    // Card title, tagline, intro and body.
    name: "Data General - a alma de uma nova máquina",
    tagline:
      "Edson de Castro saiu da DEC para construir o Nova; o Pulitzer de Tracy Kidder imortalizou o Eagle; o storage CLARiiON levou o DNA para a EMC em 1999.",
    intro:
      "A Data General nasceu da debandada mais famosa da indústria: Edson de Castro, projetista do PDP-8 da DEC, saiu quando Ken Olsen engavetou o seu projeto seguinte, e o Nova de 1969 (elegante, barato, de dezesseis bits) obrigou todo o mercado de minicomputadores a reagir. The Soul of a New Machine, de Tracy Kidder, fez do projeto Eagle a história de engenharia mais celebrada já escrita.",
    body: [
      "O perfil acompanha as décadas do Nova e do Eclipse, a virada para o AViiON e a linha de storage CLARiiON, cuja aquisição pela EMC em 1999 semeou a dinastia do storage de médio porte que vive hoje na Dell.",
    ],
    // The ending's note (the year stays in the English record) and the successor label (the URL stays English).
    endedNote: "Comprada pela EMC em 1999, em grande parte por causa da sua linha de storage arrays CLARiiON.",
    successorLabel: "Dell, via EMC",
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "data-general",
      // Founding story (company, year and founders unchanged).
      foundings: [
        {
          company: "Data General",
          year: 1968,
          place: "Hudson, Massachusetts",
          founders: ["Edson de Castro", "Henry Burkhardt", "Richard Sogge", "Herbert Richman"],
          story:
            "A Data General nasceu da debandada mais famosa da indústria. Edson de Castro tinha projetado o PDP-8 da DEC, a máquina que criou o mercado de minicomputadores, e quando Ken Olsen engavetou o sucessor de 16 bits, de Castro saiu com dois colegas e o construiu assim mesmo. O Nova de 1969, elegante e implacável a US$ 8.000, obrigou toda a indústria a reagir, e os anúncios arrogantes da Data General ('the best small computer in the world', o melhor computador pequeno do mundo) combinavam com uma cultura de empresa tão briguenta que o livro de Tracy Kidder sobre ela ganhou o Prêmio Pulitzer.",
        },
      ],
      // Timeline: same years, same order.
      timeline: [
        { year: 1969, title: "O Nova", detail: "Dezesseis bits em quatro placas, a um preço que constrangeu todo mundo: o Nova vende dezenas de milhares de unidades e faz da Data General a rival de ascensão mais rápida da empresa de onde o seu fundador tinha saído." },
        { year: 1974, title: "Eclipse", detail: "A linha mais sofisticada estende a franquia para o médio porte e prepara a briga de arquitetura que é o tema da história de engenharia mais famosa da década seguinte." },
        { year: 1980, title: "O Eagle, e o livro", detail: "O MV-8000, feito em skunkworks por Tom West, alcança o VAX da DEC por trás; Tracy Kidder se instala com a equipe, e 'The Soul of a New Machine' (Pulitzer, 1982) faz do 'signing up' (o compromisso total com o projeto) e da depuração à meia-noite a mitologia permanente da própria engenharia." },
        { year: 1989, title: "AViiON: a virada para o Unix", detail: "Os minis proprietários estão morrendo; a Data General aposta em servidores Unix com Motorola 88000 (depois Intel), a linha AViiON, e numa coisa paralela chamada storage." },
        { year: 1992, title: "CLARiiON", detail: "O projeto paralelo de disk arrays vira o evento principal: storage RAID para sistemas abertos que vende além das expectativas e vira em silêncio o futuro da empresa enquanto os servidores definham." },
        { year: 1999, title: "A EMC fecha o negócio", detail: "Outubro de 1999: a EMC conclui a aquisição de cerca de US$ 1,1 bilhão querendo exatamente uma coisa, o CLARiiON, que vira a dinastia de storage de médio porte da EMC e vive hoje no fundo da linhagem de storage da Dell.", sourceNote: "Conclusão segundo o registro do negócio." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "Nova e Eclipse", what: "As linhas de minicomputadores que fizeram a DEC suar: dezenas de milhares vendidas para laboratórios, fábricas e racks de OEM." },
        { name: "MV-8000 'Eagle'", what: "A máquina de 32 bits da volta por cima, e a protagonista do livro de engenharia mais celebrado já escrito." },
        { name: "CLARiiON", what: "O storage array que sobreviveu à empresa: a linha de médio porte da EMC por duas décadas depois da aquisição." },
      ],
      // Innovations.
      innovations: [
        { title: "A máquina enxuta", detail: "A elegância minimalista do Nova (o máximo de computador com o mínimo de placas) estabeleceu um padrão de engenharia de custos que toda a indústria de minicomputadores perseguiu." },
        { title: "A engenharia como literatura", detail: "O relato de Kidder, de dentro da equipe do Eagle, deu à indústria o seu autorretrato definitivo: como sistemas ambiciosos são construídos de fato, mitologia dos prazos incluída." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "Os mercados da Data General se dissolveram junto com o minicomputador, mas o DNA do CLARiiON persiste no portfólio de storage da Dell, e a história do Eagle persiste em toda equipe de engenharia que já fez o seu \"signing up\".",
      ],
      analyst: [
        "O algoz mais afiado da DEC nas avaliações de minicomputadores dos anos 70 e, no fim, lembrada menos pela participação de mercado do que pelo livro que explicou a indústria para ela mesma.",
      ],
    },
  },

  // dataprev: record prose only.
  "dataprev": {
    // Card title, tagline and intro.
    name: "Dataprev - a previdência social como problema de computação",
    tagline: "Formada pela fusão dos centros de processamento dos institutos de previdência, e ainda guardiã do registro de quem tem direito a quê.",
    intro:
      "A Dataprev foi criada em 1974 a partir da fusão dos centros de processamento de dados dos institutos de previdência social do Brasil e opera os sistemas que decidem se uma aposentadoria é paga. Os seus registros são o histórico nacional de vínculos e contribuições, o que faz dela um dos poucos sistemas cuja correção é diretamente a renda de uma pessoa.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A Dataprev foi criada pela Lei 6.125, de 4 de novembro de 1974, como empresa pública vinculada ao ministério da previdência social, com sede no Rio de Janeiro. Não foi construída do nada: foi montada a partir dos centros de processamento de dados dos institutos de previdência separados que existiram até 1964, o que faz da sua fundação um ato de consolidação, e não de criação. O Estado já tinha a computação e decidiu que ela deveria ser uma só organização.",
      "O hardware herdado veio com um contrato. Em 1975, o acordo entre o instituto de previdência social e a Burroughs passou para a Dataprev, que assumiu a operação das máquinas instaladas no Rio de Janeiro e em São Paulo. É um detalhe que vale guardar para quem trabalha com parques do setor público: a empresa começou operando a decisão de compra de outra pessoa, que é como a maior parte da computação pública começa de fato.",
      "O que ela faz hoje é a parte que muda a forma de lê-la. Ela guarda o Cadastro Nacional de Informações Sociais, a maior base de dados social do país, e processa o pagamento mensal de cada aposentado e beneficiário do sistema nacional de previdência social: pela conta da própria empresa, a maior folha de pagamento do mundo, que nunca atrasou uma única vez em mais de quarenta anos. Em cerca de quinhentos municípios brasileiros, esses benefícios representam mais de um quarto da atividade econômica local.",
      "Esse último número é o que faz deste um verbete de infraestrutura, e não de governo. Uma indisponibilidade na Dataprev não é um incidente de tecnologia da informação; é um evento econômico regional em centenas de cidades ao mesmo tempo, a ilustração mais clara possível de por que a disponibilidade fica ao lado da confidencialidade e da integridade, e não abaixo delas. A empresa também operou em escala nacional, e em pouco tempo, os pagamentos do auxílio emergencial de 2020, e mantém três data centers certificados TIER III.",
    ],
  },

  // e-safer: record prose only.
  "e-safer": {
    // Card title, tagline and intro.
    name: "e-Safer - cibersegurança e fraude, juntas",
    tagline: "Empresa brasileira de segurança cuja prática une cibersegurança e prevenção a fraudes.",
    intro:
      "A e-Safer trata cibersegurança e prevenção a fraudes como uma só prática, abrangendo serviços gerenciados de segurança, testes de intrusão, avaliação de segurança de aplicações, threat intelligence, detecção e resposta gerenciadas, gestão de vulnerabilidades, um SOC, zero trust e governança.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A combinação na própria descrição é a escolha interessante. Fraude e cibersegurança costumam ser departamentos separados, com orçamentos e linhas de reporte separados (um responde a risco, o outro a tecnologia), e investigam os mesmos eventos por lados diferentes, muitas vezes sem compartilhar o que encontraram.",
      "Nos serviços financeiros brasileiros em particular, essa separação sai cara: o comprometimento de uma credencial é um incidente de segurança até o dinheiro se mover, e nesse momento vira um caso de fraude, e as evidências necessárias para entendê-lo ficam dos dois lados de uma linha traçada por um organograma.",
    ],
  },

  // efficientip: record prose only.
  "efficientip": {
    // Card title, tagline and intro.
    name: "EfficientIP - DDI com o argumento de segurança anexado",
    tagline: "Fabricante de DDI cujo posicionamento começa pela segurança de DNS, e não pela gestão de endereços.",
    intro:
      "A EfficientIP vende DDI e abre com a segurança de DNS, uma ênfase diferente dentro da mesma categoria de produto: os mesmos registros, apresentados como uma superfície de ataque a defender, e não como um inventário a gerir.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A EfficientIP foi fundada na França em 2004 e vende o que a indústria chama de DDI: a combinação de DNS, DHCP e gestão de endereços IP, operada como um sistema, e não como três. Agrupá-los não é marketing. Esses três serviços decidem para onde um nome resolve, que endereço um dispositivo recebe e quais endereços existem, e uma organização que os gerencia separadamente costuma descobrir a ligação entre eles durante um incidente.",
      "A categoria é definida pela invisibilidade. Ninguém compra gestão de endereços com entusiasmo, e os três serviços por baixo dela são aqueles sem os quais nada funciona: um escopo de DHCP que se esgota, uma zona de DNS que fica desatualizada ou uma faixa de endereços registrada só numa planilha produzem, cada um, indisponibilidades que se apresentam como algo completamente diferente.",
      "Os seus produtos tratam o DNS como superfície de segurança, e não só como diretório, e essa é a posição de fundo: a resolução é ao mesmo tempo o primeiro passo de quase toda conexão e um canal conveniente para exfiltração e tráfego de comando, então o mesmo appliance que responde às consultas está bem posicionado para notar as que não deveriam existir.",
      "É também um dos poucos fabricantes europeus com posição séria num mercado definido, no mais, por empresas americanas, competindo com firmas consideravelmente maiores. A soberania da infraestrutura é uma consideração viva nas compras europeias, e é um dos motivos pelos quais um fornecedor menor consegue manter um lugar num mercado consolidado.",
    ],
  },

  // epi: record prose only; the name has no subtitle and stays as written.
  "epi": {
    // Parent note (official.parent.note), added 26/10/2026 with the parents apply; name, slug and year stay English facts.
    parentNote: "A EPI se apresenta como parte do TÜV NORD GROUP, que a adquiriu em outubro de 2025.",
    // Card title (company name only), tagline and intro.
    name: "EPI",
    tagline: "Treinamento em data center e certificação TIA-942.",
    intro:
      "A EPI (Enterprise Products Integration Pte Ltd), com sede em Singapura, é a entidade por trás da escada de certificações de data center independentes de fabricante (CDCP, CDCS, CDCE, CDFOM e outras) e uma das principais auditoras que certificam instalações segundo a norma ANSI/TIA-942.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A Red Education ministra os cursos de data center da EPI nas suas regiões, trazendo treinamento em projeto de instalações, operações e conformidade com normas para o mesmo catálogo das suas trilhas de redes e segurança; as certificações são avaliadas de forma independente pela EXIN.",
      "O framework da EPI é ensinado em mais de 50 países e virou a língua comum das equipes de operação de data center: só o CDCP já é a credencial de entrada que engenheiros de instalações do mundo todo são solicitados a apresentar pelo nome. A sua prática de auditoria TIA-942 certifica os prédios onde roda o software do resto desta indústria.",
    ],
  },

  // http-gopher: record prose plus the complete translated profile.
  "http-gopher": {
    // Card title, tagline, intro and body.
    name: "HTTP & Gopher - o protocolo da web e o rival que ela eclipsou",
    tagline:
      "Dois futuros saíram em 1991; uma primavera de licenciamento decidiu entre eles: o CERN deu a web de graça, Minnesota pediu dinheiro.",
    intro:
      "O Gopher era o sistema mais bem organizado e, por dois anos, estava ganhando. Então, com semanas de diferença em 1993, Minnesota anunciou taxas para o servidor e o CERN declarou a web livre de royalties para sempre: o experimento natural mais limpo já feito em economia de protocolos. O HTTP passou depois a trocar o próprio transporte duas vezes sem quebrar uma URL.",
    body: [
      "O perfil cobre a proposta do CERN de 1989 e o HTTP/0.9, a ascensão do Gopher e o Veronica, a bifurcação de licenciamento da primavera de 1993, o Mosaic, o header Host, o REST e o arco do HTTP/2 ao HTTP/3 sobre QUIC que o material de WAF deste site continua.",
    ],
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "http-gopher",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "HTTP and the World Wide Web",
          year: 1989,
          place: "CERN, Genebra, Suíça",
          founders: ["Tim Berners-Lee", "Robert Cailliau (co-author of the 1990 proposal)"],
          story:
            "Em março de 1989, Tim Berners-Lee fez circular no CERN um memorando propondo um sistema de hipertexto para acompanhar as informações do laboratório; o seu gerente, Mike Sendall, escreveu 'vague, but exciting' (vago, mas empolgante) na margem e o deixou construí-lo. No Natal de 1990, uma estação NeXT rodava o primeiro servidor web e o primeiro navegador, falando HTTP/0.9, um protocolo tão pequeno que cabia numa linha: GET, um caminho, um documento de volta, conexão encerrada. O projeto foi anunciado ao mundo no newsgroup alt.hypertext em 6 de agosto de 1991. A ideia fundadora da web era a simplicidade radical: URLs, HTML e HTTP eram, cada um, mínimos o bastante para serem reimplementados num fim de semana, e foi exatamente isso que um planeta de programadores passou a fazer.",
        },
        {
          company: "Gopher",
          year: 1991,
          place: "Universidade de Minnesota, Minneapolis",
          founders: ["Mark P. McCahill", "Farhad Anklesaria", "Paul Lindner", "Daniel Torrey", "Bob Alberti"],
          story:
            "Semanas antes do anúncio da web, a Universidade de Minnesota lançou o Gopher: um sistema de informação do campus organizado em menus, e não em hipertexto, leve o bastante para os terminais de texto e os modems de 1991, e batizado com o nome do mascote da universidade. Por dois anos, pareceu o futuro: o gopherspace cresceu de forma explosiva, havia clientes para todas as plataformas e, com o Veronica em 1992, ele teve busca de verdade antes que a web tivesse alguma. O Gopher era, pela maioria das medidas práticas do momento, o sistema mais bem organizado, e é isso que faz do que aconteceu em seguida a lição mais citada da indústria.",
        },
      ],
      // Timeline: same years, same order.
      timeline: [
        { year: 1991, title: "Dois futuros são lançados", detail: "O Gopher (na primavera, em Minnesota) e a web (anúncio em 6 de agosto, no CERN) chegam com meses de diferença. Os menus do Gopher são imediatamente práticos nos terminais que as pessoas de fato têm; o hipertexto da web é mais difícil de entender para que serve, até que as telas, e depois os navegadores, o alcancem.", sourceNote: "Anúncio no alt.hypertext, 6 de agosto de 1991." },
        { year: 1992, title: "Veronica", detail: "O gopherspace ganha um mecanismo de busca, construído na University of Nevada, Reno, antes que a web tenha algo comparável; o Jughead vem em 1993. Por um momento, o mundo dos menus é o que se pode pesquisar." },
        { year: 1993, title: "Minnesota pede dinheiro", detail: "Na primavera, a universidade anuncia taxas de licenciamento para uso comercial do servidor Gopher. Nada muda no protocolo, mas o esfriamento da comunidade é imediato, famoso e terminal. Decisões de adoção tomadas naquela temporada viram de lado em silêncio.", sourceNote: "Anúncio de licenciamento da Universidade de Minnesota, primavera de 1993, uma das decisões de licenciamento mais documentadas da história da internet." },
        { year: 1993, title: "O CERN dá a web de graça", detail: "30 de abril de 1993: o CERN coloca a tecnologia da web em domínio público, livre de royalties: qualquer um pode construir sobre ela, para sempre, sem pagar nada. Junto com o lance de Minnesota semanas antes, é o experimento natural mais limpo já feito em economia de protocolos; os resultados chegaram em dezoito meses.", sourceNote: "Declaração de domínio público do CERN, 30 de abril de 1993 (documento preservado pelo CERN)." },
        { year: 1993, title: "O Mosaic a torna visual", detail: "O navegador do NCSA põe imagens no meio do texto e se instala em minutos: a web deixa de ser uma ideia e vira um lugar (essa história está no perfil do NCSA nesta enciclopédia). Os menus limpos do Gopher de repente parecem uma listagem de diretório ao lado de uma revista." },
        { year: 1995, title: "A ultrapassagem", detail: "O tráfego web passa o do Gopher no backbone da NSFNET entre 1994 e 1995 e nunca mais olha para trás; o Netscape é lançado, o SSL traz o HTTPS e o gopherspace comercial se estabiliza num declínio longo e silencioso." },
        { year: 1999, title: "O HTTP amadurece", detail: "O HTTP/1.0 (RFC 1945, 1996) formaliza o que todo mundo já fazia; o HTTP/1.1 (RFC 2068 em 1997, refinado como RFC 2616 em 1999) acrescenta conexões persistentes, transferência chunked e o header Host, o único header que tornou economicamente possível o virtual hosting por nome e, com ele, a hospedagem web em massa a preço acessível. A tese de Roy Fielding, de 2000, dá nome ao estilo arquitetural: REST.", sourceNote: "RFC 1945 (1996), RFC 2068 (1997), RFC 2616 (1999); tese de Fielding (2000)." },
        { year: 2000, title: "O epílogo do Gopher sob a GPL", detail: "A Universidade de Minnesota relicencia o Gopher sob a GPL: um gesto elegante, correto e sete anos atrasado. Um pequeno gopherspace persiste até hoje, mantido por gente que se lembra." },
        { year: 2015, title: "HTTP/2", detail: "A RFC 7540, nascida do SPDY do Google: framing binário, multiplexação, compressão de headers. É a primeira ruptura de formato no fio na história do protocolo, levando por baixo a mesma semântica de requisição.", sourceNote: "RFC 7540, maio de 2015." },
        { year: 2022, title: "HTTP/3 sobre QUIC", detail: "A RFC 9114 sobre a RFC 9000: o próprio transporte é substituído (o QUIC, baseado em UDP e com TLS embutido) enquanto a semântica acima sobrevive intacta. É a linhagem que o material de WAF sobre QUIC deste site retoma no tempo presente.", sourceNote: "RFC 9000 (2021) / RFC 9114 (2022)." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "Do HTTP/0.9 ao HTTP/3", what: "De um GET de uma linha a um protocolo multiplexado, criptografado e transportado sobre UDP: quatro gerações de transporte sob um mesmo conjunto de semânticas de requisição, e é por isso que uma URL dos anos 1990 ainda pode resolver." },
        { name: "URLs, HTML e a web livre de royalties", what: "A abertura do trio era o produto: especificações mínimas, gratuitas para sempre por declaração, implementáveis por qualquer um em dias." },
        { name: "Gopher e Veronica", what: "O espaço de informação estruturado em menus e o seu mecanismo de busca: o melhor sistema pré-web, e a prova permanente de que ser mais bem organizado não é a mesma coisa que vencer." },
      ],
      // Innovations.
      innovations: [
        { title: "A simplicidade radical como estratégia", detail: "O HTTP/0.9 podia ser implementado numa tarde, e esse piso baixo recrutou a maior base de implementadores da história dos protocolos. A complexidade veio depois, após a ubiquidade, e a ordem importa." },
        { title: "O header Host", detail: "Um único campo do HTTP/1.1 permitiu que um endereço IP servisse mil nomes: provavelmente o header de maior consequência comercial já lançado, e a base silenciosa da economia da hospedagem compartilhada." },
        { title: "O licenciamento como destino", detail: "Primavera de 1993, uma decisão para cada lado: Minnesota pediu taxas, o CERN declarou a web livre para sempre. Todo debate sobre estratégia open source desde então citou o resultado, em geral nos primeiros cinco minutos." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "Tudo, no fim: publicação, comércio, distribuição de software e depois as próprias aplicações, incluindo o progressive web app que este site entrega sobre HTTPS. O Gopher sobrevive como um pequeno espaço de entusiastas, mantido com carinho.",
      ],
      analyst: [
        "O Gopher não perdeu na tecnologia; perdeu na governança. A lição generalizada se mantém há três décadas: quando o prêmio é um efeito de rede, o aberto e desimpedido vence o organizado e com dono.",
        "O HTTP é o raro protocolo que trocou a própria plataforma de transporte duas vezes (de texto sobre TCP para framing binário e depois para QUIC) sem quebrar a sua semântica: uma aula magistral de como evoluir o fio honrando o contrato.",
        "Para este site, a dupla é estrutural: o HTTP é o substrato de todas as ferramentas aqui, e o capítulo do QUIC é material atual, de trabalho; veja o artigo sobre WAF sobre QUIC em Learn.",
      ],
    },
    // Lineage note (PRIME ruling 2, 26/10/2026): what this card covers.
    lineageNote: "Dois protocolos, HTTP e Gopher, contados como uma só história: nenhum dos dois é uma empresa.",
  },

  // huawei: record prose plus the complete translated profile.
  "huawei": {
    // Card title, tagline, intro and body.
    name: "Huawei - a ascensão de Shenzhen",
    tagline:
      "De revendedora de PABX em 1987 a maior fabricante de equipamentos de telecomunicações do mundo, e o centro da maior tempestade de política tecnológica da década.",
    intro:
      "A ascensão da Huawei é a história industrial que define as redes modernas: fundada em Shenzhen em 1987 com cerca de 21.000 yuans, ela superou os incumbentes em engenharia e em preço até liderar o mundo em equipamentos de telecomunicações. A Entity List dos Estados Unidos, em 2019, a colocou no centro da era da soberania tecnológica, e a sua volta por cima no silício desde então é uma história ainda em curso.",
    body: [
      "A Huawei foi fundada em Shenzhen em setembro de 1987 por Ren Zhengfei, ex-engenheiro do Exército Popular de Libertação, com capital social de 21.000 yuans e um apartamento. Começou revendendo centrais telefônicas importadas via Hong Kong, passou a construir as suas próprias no início dos anos 1990 e, em 2012, ultrapassou a Ericsson para se tornar a maior fabricante de equipamentos de telecomunicações do mundo.",
      "A estratégia comercial nesse intervalo é a parte que um catálogo de redes deveria estudar, porque é a mesma que aparece repetidas vezes nestas páginas. Diante de Alcatel, Lucent e Nortel, a empresa não as atacou onde eram fortes. Foi para cidades pequenas e áreas rurais que os fabricantes estabelecidos achavam pouco compensadoras, competiu em preço, serviço e disposição para customizar e ganhou escala nos lugares que ninguém defendia. É o lance da Ericsson em 1883 e o da Ubiquiti em 2005, executado em escala nacional.",
      "A disputa de segurança precisa ser exposta, não resolvida, e o jeito honesto de fazer isso é separar o que está estabelecido do que é contestado. Estabelecido: os Estados Unidos e vários outros governos restringiram ou excluíram os equipamentos da empresa das suas redes, citando violações de sanções, roubo de propriedade intelectual e risco de espionagem. Também estabelecido: a empresa nega a acusação de espionagem, não tem ações em nenhuma bolsa, se descreve como de propriedade dos funcionários, com o fundador detendo cerca de 1%, e o restante é administrado por um comitê sindical cuja composição não foi tornada pública.",
      "Contestado, e marcado como tal pelo próprio serviço de pesquisa do Congresso dos EUA: o grau em que o crescimento da empresa se apoia em apoio estatal. Alguns observadores atribuem a ele o seu sucesso; o serviço registra com clareza que a extensão disso é objeto de debate. Um catálogo como este não é o lugar para julgar a questão, e fingir o contrário valeria menos para o leitor do que dizer onde de fato passa a linha dos fatos estabelecidos.",
      "O que vale extrair é estrutural e não depende da resposta para nenhum fabricante em particular. Equipamento de rede é infraestrutura de confiança: vê tudo o que passa por ele, recebe atualizações do fabricante e não pode, na prática, ser auditado linha por linha pela operadora que o roda. Isso faz da pergunta sobre quem pode obrigar um fornecedor uma preocupação real de engenharia, e não só uma questão política, e ela se aplica, de forma simétrica, a todo fabricante sob qualquer jurisdição, incluindo aquelas que um determinado leitor acha tranquilizadoras.",
      "A consequência prática para a indústria já está visível. Três empresas conseguem construir uma rede móvel nacional de ponta a ponta, e as decisões dos governos sobre quais das três são permitidas dividiram as redes do mundo por linhas traçadas pela política, e não pela engenharia. É uma mudança no funcionamento desta indústria, e é a primeira vez desde a era dos padrões que o lugar onde um fabricante está constituído passa a importar mais do que aquilo que o seu equipamento faz.",
    ],
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "huawei",
      // Founding story (company, year and founders unchanged).
      foundings: [
        {
          company: "Huawei",
          year: 1987,
          place: "Shenzhen, China",
          founders: ["Ren Zhengfei"],
          story:
            "Ren Zhengfei, ex-engenheiro do Exército Popular de Libertação, fundou a Huawei em Shenzhen em 1987 com cerca de 21.000 yuans e um negócio de revenda de centrais PABX importadas. A decisão que define a empresa veio cedo: despejar a receita em P&D próprio e vender primeiro onde os incumbentes não iam, o interior da China, depois o mundo em desenvolvimento, depois todo lugar. Três décadas depois, a Huawei liderava o mundo em equipamentos de telecomunicações, e a sua colisão com a política tecnológica dos Estados Unidos virou a história de política industrial que define a época.",
        },
      ],
      // Timeline: same years, same order.
      timeline: [
        { year: 1987, title: "Vinte e um mil yuans", detail: "Fundada em Shenzhen como revendedora de PABX; no início dos anos 1990, a Huawei já projeta as suas próprias centrais e adota a estratégia que a define: cercar as cidades a partir do campo." },
        { year: 2004, title: "HiSilicon", detail: "A Huawei cria o seu próprio braço de projeto de chips, uma proteção contra a dependência de fornecedores que, quinze anos depois, vira o centro da sua história de sobrevivência." },
        { year: 2012, title: "Número um", detail: "A Huawei ultrapassa a Ericsson como a maior fabricante de equipamentos de telecomunicações do mundo, a primeira vez que o principal fabricante da indústria é chinês, enquanto as suas linhas corporativa e de consumo aceleram." },
        { year: 2019, title: "A Entity List", detail: "Maio de 2019: os Estados Unidos incluem a Huawei na Entity List de controle de exportações, cortando o acesso a tecnologia americana, incluindo semicondutores avançados e serviços do Google; restrições de aliados a equipamentos 5G vêm em seguida em vários países. Meng Wanzhou, detida no Canadá desde 2018, volta à China em 2021." },
        { year: 2023, title: "A volta do silício", detail: "O Mate 60 chega com um processador Kirin fabricado no país, a volta por cima da era das sanções que ninguém de fora previu naquele prazo, enquanto o HarmonyOS amadurece numa aposta de ecossistema completo." },
        { year: 2024, title: "A pilha paralela", detail: "O capítulo atual da Huawei é vertical: silício próprio, sistema operacional próprio, nuvem e hardware de IA, construindo uma pilha tecnológica completa projetada para não precisar de permissão, com a estrutura de propriedade dos funcionários e presidência rotativa intacta por baixo." },
      ],
      // Products: descriptor names localised; descriptions translated.
      products: [
        { name: "Redes de operadoras", what: "Infraestrutura sem fio, fixa e óptica: o portfólio que fez da Huawei a maior fabricante de equipamentos do planeta." },
        { name: "Corporativo e nuvem", what: "Redes de campus e de data center, storage e Huawei Cloud: as linhas CloudEngine e OceanStor." },
        { name: "Dispositivos e HarmonyOS", what: "O braço de consumo: os topos de linha Mate e Pura com silício Kirin, e o sistema operacional próprio em todos eles." },
      ],
      // Innovations.
      innovations: [
        { title: "P&D em escala avassaladora", detail: "O gasto da Huawei com pesquisa, dezenas de bilhões de dólares por ano, entre os maiores do mundo, transformou uma revendedora numa empresa que registra mais patentes do que quase qualquer outra." },
        { title: "A pilha da autossuficiência", detail: "Do silício ao sistema operacional e à nuvem sob o mesmo teto, construída sob controles de exportação: seja qual for a posição política de cada um, um feito industrial sem precedente moderno." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "A Huawei vende tecnologia para operadoras, empresas, nuvem e consumidores na maior parte do mundo, com restrições em vários mercados ocidentais: um dos três grandes do 5G, com Ericsson e Nokia, e o centro da discussão que define a era da soberania tecnológica.",
      ],
      analyst: [
        "Líder nas avaliações de infraestrutura para operadoras há mais de uma década, com um asterisco geopolítico que nenhum outro fabricante desta seção carrega.",
      ],
    },
  },

  // ingram-micro: record prose, acquisitions and the complete translated profile.
  "ingram-micro": {
    // Parent note (official.parent.note), added 26/10/2026 with the funds2 apply; name and year stay English facts.
    parentNote: "A Ingram Micro é negociada na Bolsa de Nova York como companhia controlada: a Platinum Equity detém cerca de 90% do poder de voto.",
    // Card title (company name only), tagline and intro.
    name: "Ingram Micro",
    tagline: "Dois professores a começaram, e hoje ela movimenta cinquenta bilhões de dólares por ano em produtos dos outros.",
    intro:
      "A Micro D, Inc. foi fundada em julho de 1979 no sul da Califórnia por Geza Czige e Lorraine Mecca, marido e mulher, ambos professores. O histórico da própria empresa diz que eles trouxeram uma abordagem acadêmica para a logística. As vendas do primeiro ano ficaram em torno de US$ 3,5 milhões; em 1988 eram US$ 553 milhões, e o negócio que nasceu dali registrou US$ 52,6 bilhões de receita em 2025.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A origem no ensino é a terceira desta linha do tempo e merece registro como padrão, e não como coincidência. A Stefanini foi fundada por um homem que já dava aulas, e o seu negócio de treinamento virou uma empresa de tecnologia. O fundador da HCL abriu um instituto de treinamento em 1982 porque uma indústria nacional não cresce mais rápido do que a oferta de pessoas capazes de trabalhar nela. E a maior distribuidora de tecnologia do mundo foi começada por dois professores. Distribuição e ensino acabam compartilhando uma disciplina: as duas tratam de levar algo complicado de quem o fez para quem precisa dele, numa forma que essa pessoa consiga usar.",
      "A empresa como existe hoje é a fusão de duas concorrentes, e a lógica é a parte instrutiva. Em 1982, Ronald Schreiber, Irwin Schreiber, Gerald Lippes e Paul Willax fundaram a Software Distribution Services em Buffalo, Nova York. A Ingram Industries a comprou em 1985 e a rebatizou de Ingram Software e depois de Ingram Computer. A Ingram também vinha comprando a Micro D (o controle em fevereiro de 1986 e o restante em março de 1989, a US$ 14,75 por ação, cerca de US$ 44 milhões pelos 41% restantes) e então fundiu as duas.",
      "Elas se encaixavam porque vendiam para públicos diferentes: a Micro D era especializada nas grandes redes varejistas de computadores, enquanto a Ingram atendia revendas de valor agregado e varejistas menores. A combinação virou a Ingram Micro D, a primeira distribuidora atacadista de um bilhão de dólares da indústria de microcomputadores, com sede em Santa Ana e a operação da Costa Leste mantida em Buffalo. O D caiu em janeiro de 1991, e a empresa abriu capital na Bolsa de Nova York em 1996.",
      "Comparada com a ScanSource, esta é o outro tipo de distribuidora, e o contraste é o ponto. A tese fundadora da ScanSource era pegar os produtos no caminho para virar commodity: especialista, profunda em poucas categorias, chegando antes que as casas broadline aparecessem para vender por preço. A Ingram Micro *é* a casa broadline. O seu negócio é descrito nos próprios documentos regulatórios como intensivo em estoque e em capital, e não asset-light: ela compra hardware, software e serviços de nuvem e os mantém no balanço. A especialista vende conhecimento; a distribuidora broadline vende escala, e as duas não disputam a mesma coisa até que uma categoria termine a sua transição.",
      "A história societária desde então foi agitada. O grupo chinês HNA fechou o capital da empresa em 2016 por cerca de US$ 6 bilhões. A Platinum Equity a comprou de afiliadas da HNA por aproximadamente US$ 7,2 bilhões, com conclusão em 2 de julho de 2021, mais até US$ 325 milhões condicionados ao EBITDA ajustado até 2023, um pagamento conquistado integralmente e feito em abril de 2022. Ela voltou à Bolsa de Nova York em 2024.",
      "Uma nota de rodapé de longo alcance: a Ingram Industries, o negócio familiar que montou tudo isso, remonta à década de 1830 e fez dinheiro com madeira e transporte antes de passar por refino de petróleo, barcaças fluviais e distribuição de livros. Produtos de informática foram uma diversificação dos anos 1980 para uma empresa que vinha transportando mercadorias dos outros havia um século e meio, o que é uma descrição razoável do que é distribuição.",
    ],
    // Acquisitions: same length and order as the English list.
    acquisitions: [
      {
        what: "Fundada em Buffalo, Nova York, em 1982 por Ronald Schreiber, Irwin Schreiber, Gerald Lippes e Paul Willax. Comprada pelo Ingram Distribution Group na primavera de 1985.",
        became: "Ingram Software, depois Ingram Computer em fevereiro de 1988, depois metade da Ingram Micro D.",
      },
      {
        what: "A distribuidora do sul da Califórnia fundada por Czige e Mecca em 1979, forte nas grandes redes varejistas de computadores.",
        became: "Fundida com a Ingram Computer para criar a Ingram Micro D, a primeira distribuidora atacadista de um bilhão de dólares da indústria de microcomputadores.",
      },
    ],
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "ingram-micro",
      // No founding stories in the English profile.
      foundings: [],
      // Timeline: same years, same order.
      timeline: [
        { year: 1989, title: "Um terço do mercado no primeiro dia", detail: "Esperava-se que a empresa resultante detivesse de imediato cerca de 35% da distribuição de microcomputadores dos Estados Unidos. Juntar a principal distribuidora do canal varejista com a principal do canal de revendas não criou uma concorrente; criou o padrão, e tudo o que o negócio fez desde então foi uma discussão sobre como manter essa posição enquanto os produtos por baixo dela mudavam." },
        { year: 1996, title: "De capital aberto, mas nem tanto", detail: "A abertura de capital levantou cerca de US$ 392 milhões com um valor de mercado perto de US$ 3,5 bilhões, e a família manteve aproximadamente três quartos das ações com direito a voto. Essa estrutura explica por que a empresa pôde depois ser vendida inteira a um único comprador sem briga: ela tinha sido ao mesmo tempo negociada em bolsa e controlada de forma privada por vinte anos." },
      ],
      // Products: descriptor names localised (Xvantage kept); descriptions translated.
      products: [
        { name: "Distribuição broadline", what: "Hardware, software e nuvem de milhares de fabricantes, armazenados, financiados e despachados para revendas. A amplitude do catálogo é o produto, e o capital de giro por trás dele é a barreira de entrada." },
        { name: "Crédito e financiamento", what: "O serviço que ninguém de fora do canal nota e do qual toda revenda depende. Uma distribuidora concede prazos que permitem a um pequeno integrador aceitar um pedido maior do que o seu saldo bancário, o que é um negócio de crédito vestido com as roupas de um negócio de logística." },
        { name: "Marketplace de nuvem", what: "Revender assinaturas em vez de caixas: a transição que a indústria inteira vem administrando, e a que tira o estoque de um negócio cuja característica definidora era o estoque." },
        { name: "Xvantage", what: "A plataforma em torno da qual a empresa hoje se descreve: pedidos, cotações e gestão como software, e não como telefonemas para um representante. É uma tentativa de deixar de ser um armazém com um site e virar a própria interface." },
      ],
      // Innovations.
      innovations: [
        { title: "Comprar a outra metade do canal", detail: "Duas distribuidoras que atendem tipos diferentes de cliente não são de fato concorrentes, e é por isso que a fusão produziu alcance complementar, e não sobreposição. Perceber isso antes dos rivais é como a consolidação cria algo, em vez de apenas subtrair um concorrente." },
        { title: "Listada em bolsa, controlada de forma privada", detail: "Manter uma supermaioria dos votos ao longo de uma listagem em bolsa dá a uma família o mercado de capitais sem a governança. É legal, comum em empresas familiares e raramente discutido, e determina o que pode acontecer com uma empresa muito mais do que o preço da ação." },
        { title: "Tentando escapar do armazém", detail: "Assinaturas de nuvem e uma plataforma digital são a mesma aposta feita duas vezes: a de que o valor pode passar de manter estoque para ser o sistema pelo qual as transações acontecem. Se uma distribuidora consegue completar essa mudança é a pergunta em aberto de toda a categoria, porque a intensidade de capital que o verbete acima descreve também é o fosso." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "Revendas, provedores de serviços gerenciados e integradores, em cerca de duzentos países. O cliente não é a organização que usa a tecnologia, mas a que a vende e instala, e é por isso que quase ninguém fora do canal sabe dizer o nome da maior empresa dele.",
        "Os concorrentes são as outras distribuidoras broadline e, nas bordas, as especialistas e os fabricantes que vendem direto. A venda direta é anunciada como o fim da distribuição há quarenta anos e não foi, porque um fabricante que vende direto também precisa financiar, armazenar e dar suporte a dezenas de milhares de pequenas revendas.",
      ],
      analyst: [
        "As medidas que importam aqui são a eficiência do capital de giro e a participação nos programas dos fabricantes, e não o crescimento. Uma distribuidora é avaliada por quão pouco caixa imobiliza por dólar movimentado, uma razão sem glamour que decide o negócio inteiro.",
        "Um fato pertence ao tempo presente, e não ao passado. A Ingram Industries não se desfez depois de vender o negócio de informática: continua entre as duzentas e cinquenta maiores empresas privadas dos Estados Unidos, com cerca de US$ 2,7 bilhões em vendas, e entre as suas linhas atuais está o fornecimento de livros eletrônicos para a Apple. As barcaças continuam navegando. Seja qual for a conclusão sobre a distribuidora de tecnologia, a família que a construiu tratou tudo isso como uma linha de negócio entre várias e continua operando nessa base.",
      ],
    },
  },


  // ivanti: record prose, acquisitions (index-aligned) and the complete translated profile.
  "ivanti": {
    // Card title (company name only), tagline and intro.
    name: "Ivanti",
    tagline: "Uma empresa de 2017 montada com quarenta anos de software alheio, e o lugar onde dois fabricantes deste site foram parar.",
    intro:
      "A Ivanti foi criada em 23 de janeiro de 2017, quando a Clearlake Capital comprou a LANDESK da Thoma Bravo e a fundiu com a HEAT Software. Nenhuma das duas metades era nova: a linhagem por trás dela remonta a 1985, e quase nada no portfólio foi escrito pela empresa cujo nome está nele.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O lado LANDESK começou como LANSystems em 1985, foi adquirido pela Intel em 1991 e operado como a sua divisão LANDESK, e virou empresa independente num spin-off em 2002. A Avocent o comprou em 2006 por US$ 416 milhões (a mesma Avocent que aparece em outro ponto desta linha do tempo, na linhagem da Cyclades), e a Thoma Bravo ficou com ele em 2010. No caminho, a LANDESK absorveu a Wavelink (2012), a Shavlik, comprada da VMware (2013), a Naurtech (2014), a Xtraction (2015) e a AppSense (2016).",
      "O lado HEAT também foi montado, formado em 2015 a partir da FrontRange Solutions e da Lumension Security. A Lumension tinha começado como High Tech Software em 1991 e passado a se chamar PatchLink em 1999.",
      "A Ivanti continuou comprando: a Concorde Solutions e a RES Software em 2017, depois a Cherwell e a RiskSense. Em setembro de 2020, anunciou a aquisição da MobileIron e da Pulse Secure, concluída em 1º de dezembro daquele ano. É por isso que duas empresas que aparecem em outros pontos deste site terminaram no mesmo dia, no mesmo lugar.",
      "A MobileIron tinha sido fundada em 2007 por Ajay Mishra e Suresh Batchu e aberto capital na NASDAQ em 2014. A Pulse Secure carregava o negócio de SSL VPN da Juniper, vendido à Siris Capital em 2014.",
      "A empresa ficou mais conhecida depois de vulnerabilidades graves nos appliances de VPN que vende, e o motivo é estrutural: um portfólio montado com uma dúzia de aquisições herda uma dúzia de bases de código, e a postura de segurança do todo é a postura de segurança da peça mais fraca.",
    ],
    // Acquisitions prose, same length and order as the English list.
    acquisitions: [
      {
        what: "Gestão de ativos de software do Reino Unido, e automação de workspace e identidade da Holanda e dos EUA.",
        became: "As camadas de gestão de serviços e de automação.",
      },
      {
        what: "Gestão de dispositivos móveis e acesso zero trust para endpoints. Anunciada em setembro de 2020 e concluída em 1º de dezembro.",
        became: "Ivanti Neurons for MDM. A MobileIron aparece neste site com verbete próprio, como parceira de treinamento da Red Education.",
      },
      {
        what: "Acesso seguro híbrido, adquirida no mesmo anúncio e concluída no mesmo dia que a MobileIron.",
        became: "Ivanti Connect Secure, a linha de VPN que mais tarde atraiu divulgações de vulnerabilidades graves.",
        // The nested deal's prose, aligned with the English sub-list.
        subAcquisitions: [
          {
            what: "A Pulse Secure foi separada da Juniper e vendida a um fundo de private equity, e é por isso que uma empresa fundada em 2014 carregava uma linha de produtos mais antiga do que ela. A Juniper é um capítulo do próprio histórico de carreira deste site.",
          },
        ],
      },
    ],
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "ivanti",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "LANSystems, later LANDESK",
          year: 1985,
          place: "Estados Unidos",
          founders: [],
          story:
            "Adquirida pela Intel em 1991 e operada como a sua divisão LANDESK, depois separada num spin-off. A linhagem de gestão de desktops que virou a metade de endpoints do portfólio.",
        },
        {
          company: "Ivanti",
          year: 2017,
          place: "South Jordan, Utah",
          founders: ["Clearlake Capital"],
          story:
            "Criada em 23 de janeiro, quando a Clearlake Capital comprou a LANDESK da Thoma Bravo e a fundiu com a HEAT Software, que por sua vez tinha sido montada dois anos antes a partir da FrontRange Solutions e da Lumension Security. A empresa foi uma estrutura de holding antes de ser uma linha de produtos.",
        },
      ],
      // Timeline: same years, same order.
      timeline: [
        { year: 2017, title: "A formação", detail: "LANDESK e HEAT se combinam em janeiro." },
        { year: 2020, title: "MobileIron e Pulse Secure", detail: "As duas concluídas em 1º de dezembro, acrescentando gestão de dispositivos móveis e a linha de SSL VPN." },
        { year: 2021, title: "Cherwell e RiskSense", detail: "Gestão de serviços e priorização de vulnerabilidades, compradas com poucos meses de diferença." },
        { year: 2023, title: "Dezembro: começa a exploração", detail: "Um bypass de autenticação e uma injeção de comandos no Connect Secure e no Policy Secure, encadeados por um ator mais tarde avaliado como estatal, e explorados amplamente antes da divulgação." },
        { year: 2024, title: "O alerta, a carta e o compromisso", detail: "Um alerta conjunto dos Five Eyes no fim de fevereiro avisou que a exploração continuava. Em abril, o CEO publicou uma carta aberta prometendo reconstruir a engenharia, a segurança e a gestão de vulnerabilidades. Em maio, a empresa esteve entre as primeiras signatárias do Secure by Design pledge da agência de cibersegurança dos Estados Unidos: o fabricante no seu pior ano assinando primeiro, o que soa cínico ou exatamente certo, dependendo do que vier depois." },
        { year: 2025, title: "A resposta arquitetural", detail: "O Connect Secure 25.X saiu reconstruído sobre uma base Linux corporativa, com controle de acesso obrigatório ativado e a plataforma endurecida: uma troca da fundação, não um patch por cima dela. Vulnerabilidades críticas continuaram a ser divulgadas no mesmo período, incluindo uma falha de execução remota de código sem autenticação no começo do ano.", sourceNote: "As divulgações que continuaram estão registradas de propósito: uma reconstrução desse tipo leva anos, e relatar o compromisso sem os CVEs que vieram depois daria uma ideia errada de onde a empresa está." },
      ],
      // Products: names kept as the vendor writes them; descriptions translated.
      products: [
        { name: "Endpoint Manager", what: "A linha LANDESK: distribuição de software, patches e inventário para desktops. O código mais antigo da empresa, e ainda entre os mais implantados." },
        { name: "Neurons", what: "A marca de plataforma que cobre gestão de patches, descoberta, gestão de serviços e automação, e a tentativa de fazer uma coisa só a partir de muitas compradas." },
        { name: "Connect Secure and Policy Secure", what: "Os appliances de SSL VPN e de controle de acesso à rede, vindos da Juniper via Pulse Secure, com raízes na NetScreen. Os produtos no centro da exploração de 2024." },
        { name: "Ivanti Neurons for MDM", what: "A linha MobileIron, que gerencia frotas móveis: a outra metade da aquisição dupla de dezembro de 2020." },
        { name: "Service Manager and the Cherwell line", what: "Gestão de serviços de TI vinda de duas aquisições separadas, o que já é um problema de consolidação por si só." },
        { name: "Security Controls and Patch SDK", what: "Componentes de patching dos quais vários outros produtos dependem, e é por isso que uma única falha no SDK aparece nos alertas de metade do portfólio de uma vez." },
      ],
      // Innovations.
      innovations: [
        { title: "A consolidação como estratégia inteira", detail: "A proposta é que um fabricante cobrindo endpoint, mobilidade, service desk, patches e acesso é mais fácil de operar do que seis. É um argumento real para um departamento de TI com pouca gente, e a empresa é o teste mais claro dele neste mercado." },
        { title: "O problema do código herdado, tornado visível", detail: "Comprar oito empresas significa ser dono de oito bases de código, oito conjuntos de premissas e oito históricos de segurança, alguns escritos antes de existirem as ameaças que hoje enfrentam. As divulgações de 2024 são a cara disso sob ataque continuado, e nenhuma marca compartilhada muda o código por baixo." },
        { title: "Trocar a fundação em vez de remendá-la", detail: "Reconstruir um appliance sobre um sistema operacional corporativo endurecido, com controle de acesso obrigatório, é uma resposta cara e lenta que ataca a classe real do problema, e não os casos individuais. A maioria dos fabricantes sob essa pressão prefere soltar patches mais depressa." },
        { title: "Publicar os compromissos", detail: "Assinar um compromisso público com metas específicas e verificáveis (autenticação multifator, nenhuma credencial padrão, divulgação ampliada, progresso acompanhado) transforma intenções em coisas que o cliente pode cobrar. Também cria um registro contra o qual as falhas posteriores são medidas, e é justamente essa a ideia." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "Operações de TI corporativas e do setor público, com forte presença em organizações que valorizam um único fabricante para muitas funções e, no caso dos produtos de acesso, em redes de governo, e é por isso que a exploração de 2024 gerou alertas nacionais, e não apenas cobertura da imprensa especializada.",
        "Compete separadamente com especialistas em gestão de endpoints, plataformas de gestão de serviços e fabricantes de acesso, e não como um mercado só. É o custo da estratégia de consolidação: cada concorrente é especialista numa das muitas coisas que a empresa faz.",
      ],
      analyst: [
        "Avaliada como presença relevante em gestão unificada de endpoints e em gestão de serviços de TI, com a amplitude reconhecida como ponto forte e a profundidade de integração entre as linhas compradas como crítica recorrente.",
        "O histórico de segurança agora faz parte de toda avaliação. A posição honesta é que a resposta foi mais estrutural do que a da maioria (uma reconstrução da fundação e compromissos públicos e verificáveis) e que as divulgações continuaram mesmo assim, que é exatamente como remediar uma década de código herdado parece visto de fora.",
      ],
    },
  },

  // levelblue: record prose and acquisitions (index-aligned); no profile.
  "levelblue": {
    // Card title (company name only), tagline and intro.
    name: "LevelBlue",
    tagline: "O negócio de serviços de segurança da AT&T, separado em 2024, que comprou a Trustwave, a Cybereason e os consultores de cibersegurança da Aon em dezoito meses.",
    intro:
      "A LevelBlue foi lançada em 6 de maio de 2024, na RSA Conference, como empresa independente de serviços gerenciados de segurança: uma joint venture entre a AT&T, que manteve uma participação minoritária e uma cadeira no conselho, e a WillJam Ventures, cujo managing partner Bob McCullen virou presidente do conselho e CEO. Começou com o que a AT&T Cybersecurity tinha sido: mais de mil funcionários, quatro centros de operações de segurança e três centros de operações de rede, a plataforma USM Anywhere e a Open Threat Exchange, que o comunicado de lançamento contava em 235.000 profissionais de segurança enviando mais de 20 milhões de indicadores de ameaça por dia.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Depois, comprou, e rápido. Em 1º de agosto de 2025, concluiu a aquisição dos grupos de consultoria em cibersegurança e em litígios de propriedade intelectual da Aon; em 19 de agosto de 2025, concluiu a aquisição da Trustwave, a empresa de segurança gerenciada e da SpiderLabs sediada em Chicago, e chamou o resultado de maior provedor pure-play de serviços gerenciados de segurança do mundo; em 14 de outubro de 2025, anunciou, e em 25 de novembro de 2025 concluiu, a aquisição da Cybereason, cujos investidores SoftBank Corp., SoftBank Vision Fund 2 e Liberty Strategic Capital passaram a ser investidores da LevelBlue; e em 27 de janeiro de 2026 anunciou uma parceria de serviços gerenciados com a Fortra que inclui a aquisição do negócio de managed detection and response Alert Logic, da Fortra.",
      "O que essas compras montaram é uma empresa de serviços com os braços de pesquisa de outras empresas dentro dela: a SpiderLabs agora aparece nas páginas da LevelBlue como LevelBlue SpiderLabs, a plataforma da Cybereason como o seu XDR e a Open Threat Exchange como a sua base de inteligência. A empresa é comandada de Dallas.",
      "Por que ela pertence a um registro de redes: o provedor de segurança gerenciada é a forma como a maioria das organizações consome segurança de rede hoje, e este é o ponto atual de chegada de três linhagens que este registro acompanha: o negócio de segurança da AT&T, os vinte anos da Trustwave em Chicago e a década de venture capital da Cybereason.",
    ],
    // Acquisitions prose, same length and order as the English list.
    acquisitions: [
      {
        what: "Concluída em 1º de agosto de 2025; a prática de consultoria que inclui a antiga expertise da Stroz Friedberg.",
        sourceNote: "Sala de imprensa da LevelBlue, 1º de agosto de 2025 (lido em 06/10/2026).",
      },
      {
        what: "A empresa de segurança gerenciada e da SpiderLabs sediada em Chicago, fundada em 1995; concluída em 19 de agosto de 2025, valores não divulgados.",
        became: "O núcleo do maior provedor pure-play de serviços gerenciados de segurança do mundo, pela descrição da LevelBlue; a SpiderLabs continua como LevelBlue SpiderLabs.",
        sourceNote: "LevelBlue, Dallas, 19 de agosto de 2025 (lido em 06/10/2026).",
      },
      {
        what: "XDR, perícia digital e resposta a incidentes, inteligência de ameaças; anunciada em 14 de outubro de 2025, concluída em 25 de novembro de 2025, valores não divulgados; SoftBank Corp., SoftBank Vision Fund 2 e Liberty Strategic Capital passaram a ser investidores da LevelBlue.",
        became: "O XDR e a resposta a incidentes da LevelBlue; 'Cybereason is now LevelBlue' (a Cybereason agora é a LevelBlue).",
        sourceNote: "LevelBlue, 14 de outubro e 25 de novembro de 2025 (lido em 06/10/2026).",
      },
      {
        what: "Anunciada em 27 de janeiro de 2026, dentro de uma parceria de serviços gerenciados com a Fortra; conclusão não verificada.",
        sourceNote: "Sala de imprensa da LevelBlue, 27 de janeiro de 2026 (lido em 06/10/2026).",
      },
    ],
  },

  // marconi: record prose plus the complete translated profile.
  "marconi": {
    // Card title, tagline, intro and body.
    name: "Marconi - a própria telegrafia sem fio, e depois a bolha",
    tagline:
      "Guglielmo Marconi atravessou o Atlântico em 1901; um século depois, a empresa com o nome dele virou a lição mais dura da bolha ponto-com nas telecomunicações, desmembrada pela Ericsson em 2006.",
    intro:
      "A Marconi são duas histórias separadas por um século: o homem que transformou o rádio em negócio (sinais transatlânticos em 1901, os operadores a bordo do Titanic em 1912) e o conglomerado GEC que adotou o nome dele em 1999, apostou a sua fortuna em equipamentos de telecomunicações exatamente no topo da bolha e desabou em dois anos. Poucas linhagens contêm ao mesmo tempo o nascimento de uma indústria e a sua morte corporativa mais instrutiva.",
    body: [
      "O perfil acompanha a Wireless Telegraph and Signal Company pelo império eletrônico da GEC, a troca de nome e a onda de aquisições de 1999, o colapso de 2001 e o desmembramento pela Ericsson em 2006, que encerrou o nome no mundo das redes.",
    ],
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "marconi",
      // Founding story (company, year and founders unchanged).
      foundings: [
        {
          company: "Marconi (Wireless Telegraph & Signal Company)",
          year: 1897,
          place: "Londres, Reino Unido",
          founders: ["Guglielmo Marconi"],
          story:
            "Guglielmo Marconi não descobriu as ondas de rádio (quem fez isso foi Hertz), mas fez delas um negócio: a Wireless Telegraph and Signal Company, de 1897, transformou faíscas de laboratório em serviço entre navio e terra, e o sinal transatlântico de 1901, da Cornualha à Terra Nova, fez da telegrafia sem fio uma indústria mundial com um único nome. Um século depois, esse nome, ressuscitado sobre os restos do conglomerado GEC, virou o colapso mais instrutivo das telecomunicações: a empresa que apostou tudo em equipamentos de rede exatamente no topo da bolha.",
        },
      ],
      // Timeline: same years, same order.
      timeline: [
        { year: 1901, title: "Através do Atlântico", detail: "12 de dezembro de 1901: a letra S, enviada de Poldhu, na Cornualha, é recebida em Signal Hill, na Terra Nova. A telegrafia sem fio de longa distância é real, e a empresa de Marconi é dona do momento e do mercado." },
        { year: 1912, title: "Titanic", detail: "Os operadores da Marconi a bordo do Titanic transmitem os chamados CQD e SOS que trazem o Carpathia; mais de 700 pessoas sobrevivem porque havia telegrafia sem fio a bordo. O desastre tornou o rádio obrigatório no mar, e a empresa, um nome conhecido em todas as casas." },
        { year: 1968, title: "Para dentro do império GEC", detail: "A English Electric, que tinha absorvido a Marconi em 1946, é adquirida pela General Electric Company de Arnold Weinstock, e o nome Marconi vira a joia de eletrônica e defesa do grande conglomerado britânico por três décadas." },
        { year: 1999, title: "O renascimento fatídico", detail: "A GEC vende o seu negócio de defesa à British Aerospace (a semente da BAE Systems), rebatiza o restante como Marconi plc e gasta a famosa montanha de caixa em equipamentos de telecomunicações norte-americanos (a FORE Systems por cerca de US$ 4,5 bilhões, a RELTEC por cerca de US$ 2,1 bilhões) exatamente no topo do mercado.", sourceNote: "Valores dos negócios como divulgados no anúncio." },
        { year: 2001, title: "O colapso", detail: "Os gastos das operadoras param; os alertas de lucro se sucedem; as ações perdem cerca de 97% do valor, e a reestruturação de 2003, com conversão de dívida em ações, praticamente zera os antigos acionistas: a baixa corporativa mais dura da era ponto-com no Reino Unido." },
        { year: 2006, title: "A Ericsson fica com os ativos", detail: "Janeiro de 2006: a Ericsson conclui a aquisição, de cerca de 1,2 bilhão de libras, dos principais negócios de telecomunicações da Marconi; o restante vira a telent, uma empresa de serviços, e o nome que começou o rádio deixa os equipamentos de rede.", sourceNote: "Conclusão segundo o registro do negócio." },
      ],
      // Products: descriptor words localised; descriptions translated.
      products: [
        { name: "Telegrafia sem fio marítima e de longa distância", what: "O negócio fundador: estações entre navio e terra, circuitos transoceânicos e os operadores que os guarneciam." },
        { name: "Eletrônica GEC-Marconi", what: "Radar, aviônica e eletrônica de defesa: as décadas do conglomerado, vendidas para o que virou a BAE Systems." },
        { name: "Redes ópticas e de acesso (Marconi plc)", what: "O portfólio SDH, óptico e de acesso do ato final: as peças com que a Ericsson ficou." },
      ],
      // Innovations.
      innovations: [
        { title: "O rádio como infraestrutura", detail: "Marconi transformou uma curiosidade eletromagnética num serviço de comunicação regular e cobrado: o modelo de negócio de toda rede sem fio desde então." },
        { title: "Uma obra-prima do que não fazer", detail: "O arco de 1999 a 2001 (caixa de conglomerado convertido em aquisições no topo da bolha) é ensinado como o fracasso de manual da estratégia movida pelo embalo." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "O nome Marconi sobrevive na memória histórica e nos serviços da telent; o seu legado na telegrafia sem fio é a indústria do rádio inteira, e o seu colapso continua sendo o caso de referência da década da bolha nas telecomunicações.",
      ],
      analyst: [
        "Na primeira metade do século XX, o padrão contra o qual o mundo da telegrafia sem fio era medido; no século XXI, o estudo de caso que toda revisão de estratégia em telecomunicações cita.",
      ],
    },
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A Marconi Corporation concluiu a venda de seus negócios de equipamentos de telecomunicações e de serviços internacionais para a Ericsson em 24 de janeiro de 2006 e, no mesmo dia, mudou seu nome para telent plc.",
  },

  // netbr: record prose only (no profile, no acquisitions).
  "netbr": {
    // Card title, tagline and intro.
    name: "Netbr - identidade, antes de alguém chamar assim",
    tagline: "Especialista brasileira em gestão de identidades e acessos, fundada em 2003 e adquirida pela SEK em 2025.",
    intro:
      "A Netbr foi fundada em 2003 em São Paulo, entregando projetos de infraestrutura crítica, segurança e automação, e virou a especialista brasileira em gestão de identidades e acessos (governança, acesso privilegiado e identidade de clientes) para bancos, operadoras de telecomunicações e grandes varejistas. A SEK a adquiriu em 2025.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A lista de clientes é o argumento do verbete: os dez maiores bancos brasileiros. Trabalho de identidade nessa escala não é instalação de produto. É decidir quem pode fazer o quê em sistemas acumulados ao longo de décadas, numa instituição onde a resposta tem consequências regulatórias, e depois automatizar a entrada, as mudanças de função e a saída de dezenas de milhares de pessoas sem quebrar nada disso.",
      "Também se tornou a primeira consultoria e integradora de identidade da América Latina a ter o status de delivery partner da Ping Identity, depois de já ter entregado projetos Ping para open banking e open insurance. Isso a coloca lado a lado com as autorizações de fabricante que o próprio site carrega, e lembra que um fabricante que entra num mercado depende de alguém local que já tenha aprendido o produto direito.",
      "O desfecho é o padrão que esta linha do tempo registrou repetidas vezes nos últimos três anos. Uma especialista construída ao longo de vinte anos é absorvida por um grupo montado por um fundo de investimento (aqui a SEK, ela própria criada a partir de uma empresa chilena e de uma brasileira), e a marca vira uma especialidade dentro do ecossistema de outra pessoa. O conhecimento fica no país; a propriedade não fica na empresa.",
    ],
    // Parent note (PRIME ruling 1, 26/10/2026): the size of SEK's stake.
    parentNote: "Pelas contas da própria Netbr, a SEK detém 55% da empresa; a imprensa descreve a transação de 2025 como a aquisição da empresa inteira.",
  },

  // oxid-it: record prose and the ending note (the year stays in the English record).
  "oxid-it": {
    // Card title, tagline and intro.
    name: "oxid.it - um homem, uma ferramenta e um site que já não existe",
    tagline:
      "Massimiliano Montoro publicou o Cain & Abel num domínio pessoal italiano por mais de uma década; o software ensinou a uma geração como as redes comutadas se comportam de verdade, e a documentação hoje só existe no Internet Archive.",
    intro:
      "oxid.it era o site pessoal do consultor de redes italiano Massimiliano Montoro, de onde ele publicou o Cain & Abel, a ferramenta para Windows de recuperação de senhas e análise de rede, até a última versão, em 2014.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Era o domínio de uma pessoa só. Montoro, consultor de redes, publicou o Cain & Abel ali por bem mais de uma década, ao lado de alertas que ele mesmo escrevia, incluindo a divulgação, em 2005, de uma fraqueza de man-in-the-middle no protocolo de área de trabalho remota da Microsoft, que a própria ferramenta dele passou a implementar. Não havia empresa, rodada de investimento nem contrato de suporte. O software era gratuito, só para Windows e extremamente capaz: sniffing, extração de credenciais, criptoanálise com tabelas pré-calculadas, gravação de chamadas de voz, recuperação de chaves de redes sem fio e o ataque à resolução de endereços que ele chamou de ARP Poison Routing.",
      "Os fabricantes de antivírus lançaram assinaturas de detecção para ele, o que era razoável e também revelador: o mesmo código era instrumento de diagnóstico em umas mãos e ferramenta de intrusão em outras, e nenhuma propriedade do software distinguia os dois casos. A última versão, a 4.9.56, é datada de 7 de abril de 2014.",
      "O site acabou. O que o fazia merecer um verbete não é o programa, mas a documentação: ela explicava os mecanismos em vez de listar os botões, e muitos profissionais aprenderam com ela como as redes comutadas se comportam de fato, por que um switch não é uma fronteira de segurança e o que um protocolo sem autenticação de 1982 permite. Esse material hoje só existe no Internet Archive: uma publicação de uma pessoa só que moldou o entendimento da profissão, preservada por acaso, e não pela intenção de alguém.",
      "A avaliação do próprio Montoro, em 2009, envelheceu para algo maior do que o comentário de um autor de ferramenta. Os fabricantes tinham lançado centenas de patches, disse ele, e com todos aplicados o software dele continuava funcionando, porque o protocolo não tinha mudado; e ele nunca tinha encontrado uma empresa que tivesse pensado em mitigá-lo. Dezessete anos depois, o protocolo continua igual, e as mitigações continuam sendo recursos opcionais de switch que alguém precisa decidir ativar.",
    ],
    // The ending's note; the quoted page strings stay verbatim.
    endedNote:
      "O site parou de servir o Cain & Abel em meados de 2019. O Internet Archive guarda a página real (a versão 4.9.56, com o rodapé “Copyright (c) 2001-2014”) até 21 de junho de 2019; no fim de junho de 2019, a URL retornava 404, e a partir de 15 de agosto de 2019 servia apenas uma pequena página provisória. O domínio hoje mostra uma página de estacionamento “Coming Soon”. A última RELEASE foi em 2014; o site sobreviveu a ela por cinco anos.",
  },

  // parxtech: record prose plus the complete translated profile.
  "parxtech": {
    // Card title (company name only), tagline and intro.
    name: "Parxtech",
    tagline: "Vende a camada que ninguém fotografa: cabo, encaminhamento, energia e o levantamento que decide onde cada coisa vai.",
    intro:
      "A Parxtech foi fundada em São Paulo em 1992 para prestar serviços de conectividade e de tecnologia da informação, e se descreve como de capital inteiramente brasileiro, com capacidade de atendimento nacional. As suas linhas são redes, cabeamento estruturado, CFTV, prevenção de intrusão em redes sem fio, instalações elétricas e outsourcing.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Vale parar nessa combinação, porque é um negócio de camada física com um produto de segurança acoplado, e as duas metades têm mais relação do que parece. Redes, cabeamento, CFTV e elétrica são todos trabalho de campo: alguém mede um prédio, decide onde as coisas vão, passa o cabo por ele e termina as duas pontas. A prevenção de intrusão em redes sem fio é a estranha no papel, mas não na prática: detectar um access point clandestino é um problema de levantamento antes de ser um problema de software, e a empresa já é dona da escada.",
      "A linha de elétrica é o detalhe que identifica o tipo de negócio. Muitos integradores param no patch panel. Uma empresa que também faz a parte de energia vende para quem precisa fazer a sala funcionar, não para quem precisa fazer a rede funcionar, e com frequência são pessoas diferentes, com orçamentos diferentes. É por isso que os programas de canal da maioria dos fabricantes não fazem ideia de como classificar uma empresa assim.",
    ],
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "parxtech",
      // Founding story (company, year and founders unchanged).
      foundings: [
        {
          company: "Parxtech",
          year: 1992,
          place: "São Paulo, Brasil",
          founders: [],
          story:
            "A Parxtech foi fundada em São Paulo em 1992 para fornecer serviços de conectividade e de tecnologia da informação, e se descreve como de capital inteiramente brasileiro, com alcance de atendimento nacional. O seu trabalho abrange redes, cabeamento estruturado, circuito fechado de televisão, prevenção de intrusão em redes sem fio, instalações elétricas e outsourcing, uma combinação que a coloca na camada física de um prédio, e não só na rede dele. A linha de elétrica é a que a distingue: muitos integradores param no patch panel, e uma empresa que também faz a parte de energia vende para quem precisa fazer a sala funcionar, e não para quem precisa fazer a rede funcionar.",
          sourceNote:
            "Ano de fundação, controle acionário e linhas de serviço tirados do site da própria empresa, que é tudo o que se localizou de registro público. Nenhum nome de fundador é publicado, e nenhum é fornecido aqui.",
        },
      ],
    },
  },

  // pluralsight: record prose only (no profile, no acquisitions).
  "pluralsight": {
    // Card title, tagline and intro.
    name: "Pluralsight - a sala de aula que virou biblioteca, e a biblioteca que virou garantia",
    tagline:
      "Em 2004, quatro instrutores com 5.000 dólares cada voavam até escritórios para ensinar ferramentas da Microsoft; a virada de 2007 para a assinatura online a transformou numa empresa de 3,5 bilhões de dólares; em agosto de 2024, os credores eram donos de tudo.",
    intro:
      "A Pluralsight é uma plataforma norte-americana de capacitação em tecnologia, fundada em Utah em 2004 como empresa de treinamento presencial, convertida em biblioteca online por assinatura em 2007, tirada da bolsa pela Vista Equity Partners em 2021 e tomada pelos credores em 2024.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Começou como o negócio que todo leitor desta lista que já viveu de dar aula vai reconhecer: quatro instrutores, cinco mil dólares cada, voando até escritórios para ensinar desenvolvedores a usar as ferramentas da Microsoft. Era 2004, em Farmington, Utah, e a empresa deu lucro desde o início, sem financiamento de ninguém. A decisão que importou veio em 2007, antes de alguém dizer a palavra MOOC: parar de viajar, gravar os cursos, vender assinatura. Uma sala de aula tem economia linear: um instrutor, uma sala, um dia. Uma biblioteca tem economia de software: um curso gravado uma vez, vendido milhares de vezes, com o autor recebendo royalties por visualização. Passaram-se nove anos até a empresa aceitar dinheiro de fora, e a essa altura ela não precisava dele.",
      "O resto é a curva do venture capital na sua forma mais ortodoxa. Uma Série A em 2012, valuation de unicórnio em 2016, listagem na Nasdaq em maio de 2018, dezoito mil clientes corporativos, incluindo a maior parte da Fortune 500, e, em dezembro de 2020, um acordo para ser fechada pela Vista Equity Partners por 3,5 bilhões de dólares, concluído em abril do ano seguinte a 22,50 por ação. A compra foi, como costumam ser essas compras, feita em grande parte com dinheiro emprestado.",
      "O que veio depois é a versão da indústria de treinamento do verbete da Atos. A dívida foi dimensionada para uma receita que devia continuar crescendo e não cresceu. A Vista transferiu a propriedade intelectual da empresa (a biblioteca de cursos, a coisa que os quatro instrutores tinham construído) para uma subsidiária e tomou empréstimos dando-a em garantia para pagar as parcelas da dívida. Em abril de 2024, o CEO fundador, vinte anos no cargo, foi substituído. Em agosto de 2024, os credores ficaram com a empresa inteira: cerca de 1,3 bilhão de dólares de dívida virou participação acionária, eles aportaram 250 milhões de dinheiro novo, e o dono de private equity saiu sem nada, um caso que um escritório de advocacia chamou de ponta do iceberg do crédito privado. A sede saiu de Utah para o Texas em 2025.",
      "A biblioteca continua lá e continua à venda; o que mudou é quem é dono dela e para que ela serve. Um catálogo de cursos construído por instrutores foi, durante três anos, garantia de empréstimo, e quem grava os cursos é pago por visualização, o que significa que o valor dado em garantia era deles, e o empréstimo não. Quem vive de gravar aulas deveria saber quanto uma biblioteca vale para um credor, quanto vale para quem a fez e quão distantes esses dois números se revelaram.",
    ],
  },

  // qualcomm: record prose only (no profile, no acquisitions).
  "qualcomm": {
    // Card title, tagline and intro.
    name: "Qualcomm - um serviço para caminhoneiros pagou a rede móvel",
    tagline: "Fundada em 1985; financiou a sua pesquisa em CDMA com um sistema de mensagens via satélite vendido a transportadoras.",
    intro:
      "A Qualcomm foi fundada em 1º de julho de 1985, em San Diego, por sete pessoas que tinham saído da Linkabit, lideradas por Irwin Jacobs, e o nome vem de quality communications. Começou fazendo pesquisa sob contrato para o governo e a defesa.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Vale contar em ordem a sequência que a formou, porque é o contrário de como essas empresas costumam ser descritas. O seu produto comercial era o OmniTRACS: mensagens e posicionamento via satélite vendidos a transportadoras de longa distância, lançado em 1988. Os lucros de rastrear caminhões pagaram a pesquisa em acesso múltiplo por divisão de código que virou a base de uma geração de redes móveis.",
      "A aposta técnica por baixo disso é a parte interessante. A indústria caminhava para o acesso múltiplo por divisão de tempo, que divide um canal pelo tempo; a Qualcomm defendeu dividi-lo por código, de modo que todo transmissor usa a banda inteira ao mesmo tempo e a separação é feita pela matemática, e não pelo agendamento. É um problema de engenharia mais difícil e um uso melhor do espectro, e ter razão nisso é a maior parte da história da empresa.",
      "O seu lugar numa linha do tempo de redes é direto. O silício sem fio de muitíssimos access points e gateways domésticos carrega o nome Atheros, que ela adquiriu, e o modem de um aparelho celular é onde a rede móvel de fato termina. Um dos fundadores também deu à indústria o algoritmo de Viterbi, que decodifica códigos convolucionais e fica dentro da camada física de uma quantidade enorme de equipamentos descritos em outros pontos deste site.",
    ],
  },

  // radware: record prose, the accuracy note (first person kept) and the complete translated profile.
  "radware": {
    // Card title, tagline and intro (the English body is empty, so no body here).
    name: "Radware - a linhagem Zisapel",
    tagline: "Nascida do RAD Group israelense em 1997; a especialista em ADC e DDoS que resgatou a Alteon dos destroços da Nortel por cerca de US$ 18 milhões.",
    intro:
      "Uma fundação de pai e filho dentro da família mais célebre das redes em Israel: o patriarca do RAD Group, Yehuda Zisapel, e o filho Roy, CEO desde o início. A Radware abriu capital na NASDAQ em 1999, construiu a linha DefensePro de proteção contra DDoS e, em abril de 2009, comprou da massa falida da Nortel os lendários ativos de application switching da Alteon por cerca de US$ 18 milhões, virando de imediato uma das três maiores fabricantes de ADC. Continua independente e comandada pelo fundador.",
    // The accuracy note: the teaching claim stays exactly as precise as in English.
    note:
      "Nem eu nem a Red Education ministramos treinamento de Radware. Esta página é história corporativa, conferida com documentos da SEC e fontes primárias. A Radware compete no mercado de application delivery, em que eu ensino F5 todos os dias: conhecer os rivais faz parte de conhecer o mercado.",
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "radware",
      // Founding story (company, year and founders unchanged).
      foundings: [
        {
          company: "Radware",
          year: 1997,
          place: "Tel Aviv, Israel",
          founders: ["Roy Zisapel", "Yehuda Zisapel"],
          story:
            "Uma fundação de pai e filho dentro da família mais célebre das redes em Israel: Yehuda Zisapel, cofundador da RAD Data Communications e da distribuidora BYNET, no coração do RAD Group, semeou a empresa dentro do modelo de incubação do grupo; o filho Roy, formado em matemática e ciência da computação pela Universidade de Tel Aviv e então com uns vinte e poucos anos, é presidente e CEO desde o início. O primeiro produto, o Web Server Director, distribuía tráfego HTTP entre fazendas de servidores, à medida que as cargas de trabalho web iam para a internet.",
        },
      ],
      // Timeline: same years, same order.
      timeline: [
        { year: 1997, title: "Fundada dentro do RAD Group", detail: "Roy e Yehuda Zisapel criam a Radware em Tel Aviv em torno da gestão de tráfego ciente da aplicação; o Web Server Director é o primeiro produto.", sourceNote: "Os próprios documentos da Radware na SEC datam o início em maio de 1996; os históricos da empresa costumam citar abril-maio de 1997." },
        { year: 1999, title: "IPO na NASDAQ", detail: "A Radware entra na NASDAQ em setembro de 1999, levantando cerca de US$ 60 milhões na janela ponto-com: o modelo do RAD Group produz mais uma empresa de capital aberto." },
        { year: 2007, title: "Covelight", detail: "Uma aquisição de US$ 16 milhões traz auditoria e monitoramento de aplicações web para o portfólio, alimentando o que vira o web application firewall AppWall." },
        { year: 2009, title: "A Alteon resgatada da Nortel", detail: "Em abril de 2009, a Radware paga cerca de US$ 18 milhões (US$ 17,65 milhões) pelos ativos de application switching da Alteon, da Nortel, enquanto a Nortel é desmontada na falência. A Nortel tinha pago cerca de US$ 7,8 bilhões em ações pela Alteon WebSystems em 2000 (negócio concluído em outubro de 2000): uma desvalorização de 99,8% em nove anos, que fez da Radware de imediato uma das três maiores fabricantes de ADC.", sourceNote: "Preço da Nortel segundo os documentos SEC Form 425 da Alteon, de julho de 2000; veja a página da linhagem Nortel & Bay Networks." },
        { year: 2013, title: "Strangeloop", detail: "A otimização de desempenho web entra no portfólio de entrega." },
        { year: 2017, title: "Seculert", detail: "Janeiro de 2017: a proteção em nuvem contra invasões e exfiltração de dados é acrescentada ao lado de segurança." },
        { year: 2019, title: "ShieldSquare", detail: "Janeiro de 2019: chega a gestão de bots, o Radware Bot Manager, no momento em que o tráfego automatizado vira a ameaça que define as aplicações." },
      ],
      // Products: names kept as the vendor writes them; descriptions translated.
      products: [
        { name: "Alteon ADC", what: "A linha de application delivery controllers que leva o nome Alteon da era ponto-com até hoje: load balancing, SSL offload e aceleração de aplicações." },
        { name: "DefensePro", what: "Os appliances de mitigação de DDoS da Radware: detecção comportamental de ataques em tempo real para redes e data centers, complementada por serviços de limpeza de DDoS na nuvem." },
        { name: "AppWall and Cloud WAF", what: "Web application firewall local e como serviço, descendente em parte da tecnologia da Covelight." },
        { name: "Bot Manager", what: "A linhagem ShieldSquare: distinguir tráfego humano, de bots legítimos e automatizado hostil em escala de aplicação." },
      ],
      // Innovations.
      innovations: [
        { title: "O modelo de incubação do RAD Group", detail: "A Radware é uma das vitrines de uma instituição tipicamente israelense: o RAD Group da família Zisapel semeou dezenas de empresas de redes, financiando-as com recursos do grupo, e não com rodadas de venture capital." },
        { title: "Mitigação comportamental de DDoS", detail: "O DefensePro construiu a sua reputação com análise comportamental em tempo real, e não com assinaturas estáticas, protegendo operadoras e bancos sob ataque ativo." },
        { title: "O golpe da Alteon", detail: "Comprar uma linha de produtos de primeira grandeza de uma massa falida por cerca de US$ 18 milhões e operá-la por décadas é uma das grandes aquisições de valor da indústria." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "A Radware compete em application delivery e em segurança de aplicações: o mercado de ADC, em que a F5 é o fabricante de referência, e os mercados de DDoS e WAF, ao lado dos provedores de limpeza na nuvem. Continua independente e listada na NASDAQ (RDWR), ainda comandada pelo CEO fundador.",
        "O controle ficou em casa: Yehuda Zisapel continuou como maior acionista, com cerca de 15%, e Roy com cerca de 3,4%, uma estrutura controlada pelos fundadores rara entre fabricantes de segurança de capital aberto.",
      ],
      analyst: [
        "A compra da Alteon em 2009 foi amplamente reconhecida como o lance que levou a Radware ao primeiro escalão dos fabricantes de application delivery, trazendo milhares de clientes corporativos da noite para o dia.",
      ],
      // Career link: label translated, href unchanged.
      careerLink: {
        href: "/f5",
        label: "A Radware compete no mercado de ADC que eu ensino todos os dias: o hub da F5",
      },
    },
  },

  // red-education: record prose only (no profile, no acquisitions); award titles stay in English.
  "red-education": {
    // Card title (company name only), tagline and intro.
    name: "Red Education",
    tagline: "O treinamento é distribuído do mesmo jeito que os produtos, e é assim que isso se parece.",
    intro:
      "Daniel Storey trabalhava na F5 Networks quando lhe ofereceram uma função em treinamento. Ele aceitou, passou um período ministrando treinamento técnico pela Ásia-Pacífico e concluiu que havia um negócio em fazer isso direito. A Red Education foi fundada em Sydney em 2005. Pelo relato da própria empresa, a F5 foi o seu primeiro fabricante e, no início, o único. Vinte anos depois, ela ministra treinamento credenciado por fabricantes na Ásia-Pacífico, nas Américas, na Europa, na Índia e no Oriente Médio, e informa mais de 120.000 vagas de treinamento.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O ponto estrutural é o que vale levar, e esta linha do tempo vem rondando-o há semanas. Um fabricante não quer manter uma operação de treinamento em cada país onde vende. Certificar instrutores, manter equipamentos de laboratório, agendar turmas no fuso e no idioma certos, e fazer tudo isso com uma qualidade à altura da marca, é um negócio em si, e não é o negócio de construir o produto. Por isso os fabricantes autorizam parceiros a fazê-lo, mais ou menos pela mesma lógica que os leva a autorizar distribuidores a manter estoque e conceder crédito.",
      "O treinamento é distribuído. Depois que se percebe isso, a forma da indústria faz mais sentido: uma empresa de treinamento autorizada está para o material de curso de um fabricante mais ou menos como um distribuidor está para o hardware dele, e os fabricantes que ela representa aparecem no seu line card do mesmo jeito.",
      "Os primeiros anos são descritos pelo fundador como algumas caixas de hardware e uma agenda pesada de voos: as salas de aula viajavam de avião com o instrutor. O crescimento veio à medida que mais fabricantes decidiam que queriam um parceiro em quem pudessem confiar para representá-los, que é o mesmo problema de confiança que um distribuidor resolve, com a mesma resposta.",
      "A origem dos instrutores é o detalhe que decide se algo disso funciona. A empresa descreve os seus instrutores como profissionais experientes, muitos deles ex-integrantes das equipes técnicas de fabricantes ou de grandes clientes. Isso não é casual: um curso dado por alguém que só o ensinou é um curso diferente de um dado por alguém que operou o produto em produção e foi chamado às três da manhã quando ele falhou. O segundo tipo consegue responder à pergunta que não está no material.",
      "A lista de fabricantes cresceu muito além da F5 (Palo Alto Networks, Cisco, Check Point, Fortinet, Nutanix, AWS, Arista, Red Hat, VMware, AlgoSec, Paessler, EPI e outros), e a empresa acumulou o tipo de reconhecimento que vem em seguida: a Check Point a nomeou Authorised Training Company of the Year na CPX 2024, em Bangkok, e parceira Platinum Elite ATC, e em 2025 a parceria levou um Gold Stevie Award for Global Partnership of the Year.",
      "Os próprios fabricantes dizem isso. A Palo Alto Networks a nomeou o seu parceiro global de treinamento autorizado do ano para a região JAPAC onze anos seguidos. A F5 a nomeou o centro de treinamento autorizado de melhor desempenho para Austrália, Pacífico, China e Japão em 2022, depois de já lhe ter dado um prêmio de melhor ATC em 2020/21. A Fortinet a nomeou parceira ATC do ano para a APAC em 2026, uma categoria concedida ao centro de treinamento que mais pessoas ensinou. A Check Point a fez parceira platinum elite do ano em 2024; a Nutanix lhe deu um prêmio de qualidade no mesmo período; a AlgoSec a fez a única provedora de treinamento da região SAARC.",
      "Lidos em conjunto, não são enfeites. São o mesmo julgamento, feito de forma independente por empresas que concorrem entre si, sobre um fornecedor que nenhuma delas controla, e os critérios diferem o bastante para serem informativos: a Fortinet contou alunos ensinados, a Nutanix contou notas de qualidade, a F5 contou desempenho numa região. Uma empresa de treinamento que satisfaz os três está sendo medida ao mesmo tempo por volume, por satisfação e por cobertura.",
      "Lida ao lado dos outros verbetes de treinamento daqui, ela completa um conjunto. A CompTIA é certificação que não pertence a ninguém, definindo o que competência significa entre fabricantes. A EPI é uma entidade especialista num único domínio. O verbete da reserva de mercado mostra a força de trabalho de engenharia de um país inteiro sendo treinada dentro de fabricantes protegidos. E este é o quarto modelo: a entrega independente do currículo de outra empresa, sob autorização dela, que é como a maior parte do treinamento de fabricantes, na maioria dos países, chega de fato à pessoa sentada na sala.",
    ],
  },

  // ruckus: record prose only (no profile, no acquisitions).
  "ruckus": {
    // Card title, tagline and intro.
    name: "Ruckus - seis donos em dez anos",
    tagline: "Empresa de redes sem fio fundada em 2004, que passou pela Brocade, pela Arris, pela CommScope, pela Vistance e pela Belden.",
    intro:
      "A Ruckus foi fundada em 17 de junho de 2004, em Menlo Park, por William Kish e Victor Shtrom, e virou líder em redes locais sem fio corporativas e a maior fornecedora de Wi-Fi para provedores de serviço. Em 2016, tinha mais de mil funcionários em trinta e oito países e mais de US$ 370 milhões de receita anual. Desde então, teve cinco donos.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A cadeia é o verbete. Capital aberto na Bolsa de Nova York em 2012; comprada pela Brocade por cerca de US$ 1,5 bilhão em 2016; revendida à Arris no ano seguinte, junto com a linha de switches ICX da Brocade, por US$ 800 milhões; para dentro da CommScope com a aquisição da Arris em 2019; rebatizada sob a Vistance Networks em janeiro de 2026, quando a CommScope vendeu o seu negócio de cabo e o nome foi junto; e adquirida pela Belden em 2026.",
      "Um número dessa sequência merece ser lido duas vezes. A Brocade pagou cerca de US$ 1,5 bilhão; a Arris pagou US$ 800 milhões dezoito meses depois, pela Ruckus mais um negócio de switches que não estava na primeira transação. O ativo não passou a valer a metade; o comprador é que tinha mudado de ideia sobre o que estava fazendo, e o preço de uma empresa de tecnologia muitas vezes diz mais sobre o dono do que sobre a tecnologia.",
      "Para quem opera esse equipamento, a consequência prática é a continuidade do suporte e do roadmap ao longo de cinco trocas de dono numa década, que é o risco que ninguém precifica quando compara access points pelo throughput. A linha de produtos sobreviveu a todas elas, e essa é a metade mais surpreendente.",
      "Ela começou num lugar completamente diferente: distribuir televisão pela casa via rede sem fio, numa época em que a dificuldade era fazer o vídeo sobreviver a um ambiente de rádio doméstico. A tecnologia de antenas que resolveu esse problema é o que a tornou competitiva em redes sem fio corporativas, o que é uma forma comum: o problema difícil é resolvido para um mercado e acaba valendo mais em outro.",
    ],
  },

  // sailpoint: record prose only (no profile, no acquisitions).
  "sailpoint": {
    // Parent note (official.parent.note), added 26/10/2026 with the funds2 apply; name and year stay English facts.
    parentNote: "A SailPoint é listada na Nasdaq como companhia controlada: a Thoma Bravo detinha cerca de 85% do poder de voto em 31 de janeiro de 2026.",
    // Card title, tagline and intro.
    name: "SailPoint - governança, a metade sem glamour da identidade",
    tagline: "A autenticação pergunta quem você é. A governança pergunta por que você ainda tem aquele acesso.",
    intro:
      "A SailPoint trabalha com governança de identidades: não o login, mas a pergunta muito maior de quem detém quais permissões, quem as aprovou e se alguma delas ainda se justifica. O material atual da empresa estende isso às identidades de máquinas e de agentes, que é onde a contagem cresce mais depressa.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O problema que a governança ataca é cumulativo, não dramático. O acesso é concedido para um projeto, uma substituição, uma migração, e quase nunca é retirado, de modo que um funcionário com dez anos de casa acumula a soma de todos os papéis que já ocupou. Nada falha por causa disso, e é exatamente por isso que persiste.",
      "A consequência de segurança só aparece quando uma conta é comprometida, e nesse momento a pergunta não é como o atacante entrou, mas até onde a conta alcançava: uma pergunta decidida anos antes por uma série de aprovações, cada uma razoável isoladamente.",
      "Essa é a metade da identidade que esta empresa domina. A autenticação (os verbetes da Ping e da Okta) responde se uma pessoa é quem diz ser; a governança responde depois à pergunta mais difícil: quem tem acesso a quê, por quê, quem aprovou e se ainda deveria ser assim. Os fundadores tinham vendido uma empresa de identidade anterior à Sun e voltaram pela segunda pergunta, e o CEO fundador comanda esta há duas décadas.",
      "O IdentityIQ, a plataforma de governança on-premises, chegou em 2007 e continua no catálogo dezenove anos depois, ao lado do serviço em nuvem que veio em seguida, em 2014. É o padrão de base instalada que esta seção não para de registrar, porque os clientes que compraram governança em 2008 são bancos e hospitais, e eles não mudam só porque um fabricante gostaria. O arco corporativo é o que os verbetes da Atos e da 3CX tornam familiar por outros caminhos: uma listagem em bolsa em 2017, um fechamento de capital de 6,9 bilhões de dólares pela Thoma Bravo em 2022 e a volta ao mercado em 2025, com 813 milhões de dólares de receita recorrente e, a essa altura, a alegação de atender mais da metade da Fortune 500.",
      "A virada atual do produto diz o que o setor pensa que será a próxima década. A empresa agora vende um fabric para identidades humanas e outro para o que chama de agentic enterprise: as contas de serviço, as máquinas e os agentes de IA que detêm credenciais com as quais ninguém faz login. O verbete da Nortel registra uma empresa que trocou sete senhas e considerou uma intrusão encerrada; a governança é a disciplina construída sobre a premissa oposta, a de que a credencial não é o acesso, e de que a lista de quem alcança o quê é o registro que importa. Vários verbetes desta seção dependem de esse registro existir e ser lido. Este é o fabricante cujo negócio inteiro é produzi-lo.",
    ],
  },

  // seal: record prose only (no profile, no acquisitions).
  "seal": {
    // Card title, tagline and intro.
    name: "Seal Sistemas - o código de barras é uma interface",
    tagline: "Integradora brasileira de mobilidade, automação e visibilidade corporativa, fundada em 2001.",
    intro:
      "A Seal Sistemas é uma empresa de São Paulo que trabalha com mobilidade, automação e o que chama de visibilidade corporativa: os equipamentos e o software que permitem a uma organização saber onde estão as suas coisas.",
    // Body paragraphs, same count and order as the English.
    body: [
      "É um canto da indústria que o mundo das redes raramente olha de frente e do qual depende o tempo todo. Coletores de dados portáteis, código de barras e identificação por radiofrequência, impressão industrial e a cobertura sem fio que todos eles pressupõem formam a camada em que um armazém ou um chão de fábrica se torna legível para os sistemas acima dele.",
      "O enquadramento de visibilidade é o preciso. Um código de barras não é uma etiqueta, é uma interface: o ponto em que um objeto físico tem permissão para afirmar algo sobre si mesmo a um software. Tudo o que vem depois, da acuracidade do estoque a um aviso de entrega, se apoia nessa afirmação ter sido capturada corretamente num dispositivo que alguém carregava.",
      "Isso também explica por que esse trabalho fica ao lado das redes, e não dentro da logística. A cobertura precisa ser contínua por onde as pessoas andam, os dispositivos precisam se autenticar, e o modo de falha não é uma página que não carrega, mas um palete que o sistema acredita estar onde não está.",
    ],
  },

  // segertech: record prose only (no profile, no acquisitions); the name has no subtitle.
  "segertech": {
    // Card title (company name only), tagline and intro.
    name: "Segertech",
    tagline: "Parceira citada para a Extreme Networks no Brasil.",
    intro:
      "Uma das casas brasileiras do lado dos parceiros da Extreme. Verbetes como este importam para o registro por um motivo que vale dizer: o fabricante aparece em todo lugar, e o parceiro é quem de fato instala, configura e atende o telefone, que é onde se decide a maior parte da experiência que o cliente tem do produto.",
    // Body paragraphs, same count and order as the English.
    body: [
      "Tem o status de parceira Gold da Extreme. O nível importa mais do que parece de fora: os níveis de um fabricante controlam desconto, acesso a oportunidades e quais engenheiros podem ser certificados, de modo que o grau de um parceiro decide o que ele consegue vender com lucro antes de qualquer conversa com um cliente.",
      "A Segertech é o braço de redes do Grupo SEGER, um grupo de Florianópolis cujo negócio principal é o comércio exterior (despacho aduaneiro, frete e logística), com bases em São Paulo, no Paraná e em Minas Gerais e uma subsidiária nos Estados Unidos. Uma empresa irmã importa aeronaves e peças desde 2012. A própria Segertech faz parte do grupo há mais de quinze anos e cobre comunicações unificadas, segurança digital e infraestrutura sem fio e cabeada.",
      "Esse controle acionário é o exemplo mais claro neste catálogo de um padrão visível em vários verbetes: no Brasil, vender equipamento de rede há muito tempo significa resolver primeiro um problema de importação. A TechDEC abriu uma filial na Flórida para isso em 2004, e o Grupo Binario mantém um armazém em Miami para isso. A Segertech vai um passo além: a integradora pertence à empresa de frete, em vez de contratar uma.",
      "É um centro autorizado no Brasil para os fabricantes que representa, com instrutores certificados e treinamento em laboratório, e dá suporte à base instalada Ruckus em todo o país, um alcance incomum para uma empresa do seu porte.",
    ],
  },

  // serpro: record prose only (no profile, no acquisitions).
  "serpro": {
    // Card title, tagline and intro.
    name: "Serpro - o processamento de dados do governo federal",
    tagline: "Opera os sistemas dos quais um cidadão brasileiro não tem como se desligar.",
    intro:
      "O Serpro é o serviço de processamento de dados do governo federal brasileiro, e opera a categoria de sistema que não tem concorrente nem tempo de indisponibilidade aceitável: arrecadação de impostos, comércio exterior, cadastros federais. Quando um sistema assim fica fora do ar, a alternativa não é outro fornecedor: é a função do governo parar naquele dia.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O Serpro foi criado pela Lei 4.516, de 1º de dezembro de 1964, e reorganizado pela Lei 5.615, de 1970, que contém a frase que o moldou: ele executaria os serviços do Ministério da Fazenda com prioridade e exclusividade. Um fornecedor que não pode ser substituído pelo seu principal cliente é uma instituição diferente de um fornecedor que pode, e cada força e cada fraqueza que vieram depois descendem dessa cláusula.",
      "O trabalho começou pelos impostos. A partir de 1965, ele construiu os sistemas de arrecadação do imposto de renda, e a capacidade do Estado de enxergar o que lhe era devido cresceu junto com a computação, e não à frente dela. Essa é a forma geral da computação pública nesse período, e é fácil contá-la de trás para a frente: os sistemas não automatizaram uma capacidade que já existia, eles a criaram.",
      "Seis décadas depois, está entre as maiores empresas públicas de tecnologia do mundo, com sede em Brasília e onze regionais, e em 2021 informou 2,78 bilhões de reais de receita, com 7.822 funcionários. Guarda os registros de identidade, fiscais e de veículos do país inteiro.",
      "Essa concentração tem consequências, e uma delas se tornou pública. Em junho de 2020, o The Intercept Brasil revelou que a agência nacional de inteligência tinha pedido ao Serpro acesso total ao cadastro nacional de motoristas habilitados: os registros de 76 milhões de brasileiros, cerca de 36% da população, atualizados mensalmente, por pouco mais de 330.000 reais. O pedido não foi uma invasão, nem precisava ser. Quando uma única organização guarda os registros do país, o risco interessante deixa de ser a intrusão e passa a ser o acesso: quem pode pedir, com que autoridade, e se alguém de fora chegaria a saber. Essa é uma propriedade de governança da arquitetura, não uma falha dela, e é o motivo pelo qual a concentração de dados é um tema de segurança, e não de eficiência.",
    ],
  },

  // scansource: record prose, acquisitions (index-aligned) and the complete translated profile.
  "scansource": {
    // Card title (company name only), tagline and intro.
    name: "ScanSource",
    tagline: "Distribuiu produtos que estavam a caminho de virar commodities, e tentou chegar primeiro.",
    intro:
      "Mike Baur e Steve Owings fundaram a ScanSource em Greenville, na Carolina do Sul, em dezembro de 1992, para distribuir equipamentos de código de barras e de ponto de venda. A maioria dos relatos cita os dois; um descreve seis fundadores, com Baur como o arquiteto, e as duas versões ficam registradas aqui. Abriu capital em 1994, levantando US$ 5,5 milhões.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O seu negócio de comunicações na América Latina veio da Network1, a distribuidora de valor agregado de São Paulo que ela concordou em comprar em agosto de 2014 e cuja compra concluiu em janeiro de 2015. A operação combinada usou o nome Network1-ScanSource durante anos, o que significa que quem entrou numa empresa se viu trabalhando para a outra sem trocar de mesa: uma troca de nome, e não uma mudança, e o motivo pelo qual os dois nomes aparecem no mesmo trecho de uma única carreira.",
      "A tese de fundação é a parte que vale guardar, porque é uma estratégia real, e não uma descrição. O objetivo declarado de Baur era ser um distribuidor de produtos *transicionais*, e ele nomeou as duas transições que estava caçando: do proprietário para o aberto, e do alto custo para o baixo custo. A ideia era encontrar produtos a caminho de virar commodity e chegar cedo, enquanto um canal especializado ainda precisava de explicação e antes que os distribuidores de linha ampla chegassem para vendê-los pelo preço.",
      "E a arbitragem por baixo disso é a ilustração mais clara do que um distribuidor vende. O número de revendas focadas em código de barras estava na casa das centenas. O número de revendas focadas em computadores estava na casa das centenas de milhares. O que a ScanSource oferecia aos fabricantes de código de barras não era armazenagem; era acesso a um canal três ordens de grandeza maior do que aquele que eles já conheciam. Esse é o produto do distribuidor, dito da forma mais simples possível.",
      "A política de vender só pelo canal veio da mesma lógica: nenhuma venda direta a clientes finais, nunca. Um distribuidor que vende direto compete com as revendas das quais depende, e revendas sabem fazer conta. Manter essa linha é o que faz o resto do arranjo funcionar.",
      "O portfólio se ampliou do jeito que esses negócios se ampliam: a Catalyst Telecom para telefonia empresarial, depois comunicações, segurança física e, por fim, nuvem e pagamentos, por meio de aquisições como Imago, POS Portal e intY. Hoje é uma empresa da Fortune 1000, de cerca de US$ 3 bilhões, com uns 2.100 funcionários na América do Norte e no Brasil, e o Brasil é incomum o bastante na presença de um distribuidor norte-americano para merecer atenção.",
      "Ao lado da Westcon-Comstor, as duas formam um par útil. Ambas são distribuidoras especializadas, e não de linha ampla, e ambas cresceram por serem as que conseguiam explicar uma categoria. Mas se especializaram em direções diferentes: a Westcon foi fundo em redes e segurança, a Comstor especificamente em Cisco, enquanto a ScanSource foi fundo nas coisas que leem e imprimem (scanners, terminais, impressoras) e depois acompanhou as suas revendas para fora, rumo à telefonia e à segurança. Nenhuma tentou carregar tudo, e é exatamente isso que as distingue da Ingram Micro e da Tech Data, as casas de linha ampla cuja chegada a uma categoria é o sinal de que a transição dela terminou.",
    ],
    // Acquisitions prose, same length and order as the English list.
    acquisitions: [
      {
        what: "Uma empresa de dez anos de Marietta, na Geórgia, comprada em maio de 1993, poucos meses depois da fundação da própria ScanSource.",
        became: "Escala inicial no negócio de AIDC, e a primeira de uma longa série de aquisições complementares.",
      },
      {
        what: "Então a maior distribuidora de valor agregado de automação comercial da região. A entrada da ScanSource no Brasil.",
        became: "A primeira metade de um negócio latino-americano montado por compra, e não construído.",
      },
      {
        what: "Uma das principais distribuidoras de valor agregado brasileiras, fundada em 2004, operando no Brasil, no México, na Colômbia, no Chile e no Peru, com cerca de 400 funcionários, 8.000 clientes e mais de 60 fabricantes. Anunciada em 15 de agosto de 2014 e concluída em janeiro de 2015, foi a maior aquisição que a ScanSource tinha feito até então.",
        became: "Network1-ScanSource, e o negócio de comunicações da ScanSource na América Latina.",
        sourceNote: "Comprada POR MEIO DA CDC Brasil, a subsidiária adquirida em 2011: uma aquisição foi o veículo da seguinte.",
      },
    ],
    // Complete profile copy: facts verbatim, prose translated (the English has no foundings).
    profile: {
      slug: "scansource",
      // No founding entries in the English profile.
      foundings: [],
      // Timeline: same years, same order.
      timeline: [
        { year: 1992, title: "Lançada com um distribuidor de linha ampla por trás", detail: "Fundada em 18 de dezembro. A logística era fornecida pela Gates/FA Distributing, da qual Owings tinha sido CEO, de modo que um distribuidor especializado começou a operar com a armazenagem de uma operação de linha ampla já estabelecida por trás. Começar um negócio de nicho dentro da infraestrutura de outra empresa é o jeito de uma equipe pequena competir em conhecimento, e não em capital." },
        { year: 1994, title: "Capital aberto, e sem sair do lugar", detail: "A abertura de capital, no relato do próprio fundador, deu o capital para crescer depressa e, ao mesmo tempo, continuar em Greenville. Distribuição é um negócio em que a sede não precisa ficar perto de nada em especial, e escolher não se mudar é uma decisão que a maioria das empresas desse porte não tem a chance de tomar duas vezes." },
        { year: 2016, title: "Intelisys, e a saída do estoque", detail: "A aquisição trouxe um modelo de agentes e consultores: intermediar serviços de conectividade, nuvem, comunicações unificadas e contact center em troca de comissão, em vez de comprá-los e revendê-los. Desde então virou um dos dois segmentos que a empresa reporta, e não carrega estoque nenhum." },
      ],
      // Products: names kept as the vendor writes them; descriptions translated.
      products: [
        { name: "Specialty Technology Solutions", what: "O negócio original, ampliado: captura de dados, ponto de venda, pagamentos, segurança física, hardware de redes e de colaboração, vendidos só por meio de parceiros." },
        { name: "Intelisys and Advisory", what: "Serviços intermediados, e não revendidos, com comissão recorrente. Um negócio diferente usando o nome da mesma empresa, e o de margem mais alta dos dois." },
        { name: "Configuração e financiamento", what: "Dispositivos preparados, com imagem gravada e despachados prontos para instalar, em condições que a revenda não conseguiria obter sozinha. Em hardware especializado, este costuma ser o verdadeiro motivo pelo qual um parceiro usa um distribuidor em vez de comprar direto." },
      ],
      // Innovations.
      innovations: [
        { title: "Única ao recusar a venda direta, e não apenas incomum", detail: "A política descrita no verbete acima não era uma opção entre várias na época. Relatos contemporâneos registram esta como a única distribuidora das suas categorias que não vendia também a usuários finais. Um compromisso que todo mundo assume é uma posição de marketing; um que só você assume é uma escolha estrutural, e é por isso que as revendas lhe mostravam as suas listas de clientes." },
        { title: "Responder à pergunta que as casas de linha ampla ainda fazem", detail: "O problema que define a distribuição é que ela prende capital em estoque. A rota de fuga costuma ser uma plataforma ou um marketplace de nuvem acoplado ao negócio existente. Esta empresa tomou outro caminho: comprou um negócio que nunca tinha tido estoque e o operou como segmento separado. Se isso vale como regra geral é duvidoso, porque as estruturas de margem são totalmente diferentes, mas é o exemplo mais claro nesta linha do tempo de um distribuidor que de fato completou a transição, em vez de anunciá-la." },
        { title: "Seguir as revendas, e não os produtos", detail: "A expansão dos scanners para a telefonia, a segurança e os pagamentos parece deriva de categoria, e não foi. Cada passo acompanhou os mesmos parceiros rumo ao que estavam sendo chamados a instalar em seguida. Um distribuidor que se expande por categoria de produto está chutando; um que se expande observando os clientes que já tem está sendo informado." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "Revendas de valor agregado, integradores e provedores de serviços gerenciados na América do Norte e no Brasil, com cerca de US$ 3 bilhões em vendas, e com os consultores de tecnologia como um tipo de cliente distinto e crescente, que não existia quando a empresa foi fundada.",
        "Compete com os distribuidores de linha ampla quando uma categoria amadurece e com outros especialistas antes disso, que é todo o conteúdo da tese dos produtos transicionais descrita no verbete acima.",
      ],
      analyst: [
        "A medida que vale acompanhar é a divisão entre os dois segmentos. A distribuição de hardware tem receita alta e margem fina; o negócio de consultoria tem receita pequena e margem alta, e recorrente. Uma empresa que informa forte geração de caixa num ano de vendas menores está mostrando o efeito desse mix, e não do volume.",
        "A leitura estratégica é que este é um distribuidor com um hedge contra a própria indústria. Se a distribuição de hardware especializado continuar a se comprimir, o segmento que intermedeia serviços em vez de estocar mercadorias não está exposto à mesma compressão. Pouquíssimas empresas desta linha do tempo são donas de um negócio que lucra com o declínio do negócio original delas.",
      ],
    },
  },

  // sniffer-lineage: record prose plus the complete translated profile. The title's first part is a
  // descriptive label, not a company name, so it is localised (as shard 3 did for the Telebrás System).
  "sniffer-lineage": {
    // Card title, tagline, intro and body.
    name: "A linhagem Sniffer - da Network General à NetScout",
    tagline:
      "O Sniffer de 1986 fez da análise de protocolos uma profissão; passando pelos portáteis robustos da Dolch, pela Network Associates e pela telemetria de DDoS da Arbor, a linhagem inteira convergiu para a NetScout.",
    intro:
      "Um verbete para cinco empresas, porque elas são uma só história: o Sniffer da Network General deu nome à prática que todo engenheiro ainda usa, os portáteis robustos de Volker Dolch foram o seu chassi de campo, a fusão e a desfusão da Network Associates carregaram a marca pela era das consolidações, a Arbor Networks levou o raciocínio de pacotes à telemetria de DDoS em escala de internet, e a NetScout, fundada dois anos antes de o Sniffer existir, virou a casa onde toda a tradição dos analisadores foi parar.",
    body: [
      "O perfil cobre o Sniffer de 1986, a Sniffer University, o chassi da Dolch, a fusão com a NAI em 1997 e o renascimento em 2004, o Peakflow e o ATLAS da Arbor e as aquisições consolidadoras da NetScout em 2007 e 2015.",
    ],
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "sniffer-lineage",
      // Founding stories (company, year and founders unchanged).
      foundings: [
        {
          company: "Network General",
          year: 1986,
          place: "Mountain View, Califórnia",
          founders: ["Harry Saal", "Len Shustek"],
          story:
            "Harry Saal e Len Shustek transformaram em produto algo que os engenheiros vinham improvisando com osciloscópios e hex dumps: uma máquina que capturava o tráfego de rede e o DECODIFICAVA, protocolo por protocolo, em linguagem legível. O Sniffer deu nome a uma atividade inteira (até hoje os engenheiros fazem 'sniff' do tráfego, não importa de quem seja o analisador que têm nas mãos), e a Sniffer University formou a primeira geração de pessoas capazes de ler a conversa real de uma rede. Tudo o que este site ensina sobre pontos de captura descende da profissão que a Network General criou.",
        },
        {
          company: "NetScout Systems",
          year: 1984,
          place: "Westford, Massachusetts",
          founders: ["Anil Singhal", "Narendra Popat"],
          story:
            "Fundada como Frontier Software Development dois anos antes de o Sniffer existir, a NetScout seguiu pelo outro caminho: não o analisador portátil na bolsa de campo, mas a visibilidade permanente e distribuída, com probes e a plataforma nGenius observando redes de produção continuamente. Duas décadas depois, os caminhos se juntaram: a NetScout virou a casa onde toda a linhagem da análise de pacotes (o próprio Sniffer e, mais tarde, a telemetria de DDoS da Arbor) foi parar.",
        },
      ],
      // Timeline: same years, same order.
      timeline: [
        { year: 1986, title: "O Sniffer chega ao mercado", detail: "A análise de protocolos vira produto: capturar, decodificar, exibir. O verbo genérico que a indústria ainda usa é o fantasma da marca registrada desta máquina." },
        { year: 1988, title: "O chassi da Dolch", detail: "Os portáteis robustos de Volker Dolch, nascidos da sua empresa de analisadores lógicos de 1976, viram o Sniffer portátil clássico: um PC de nível de campo com alça, o ancestral de todo laptop reforçado no porta-malas de todo engenheiro de campo." },
        { year: 1997, title: "Network Associates", detail: "Dezembro de 1997: a Network General se funde com a McAfee Associates (cerca de US$ 1,3 bilhão) e forma a NAI. O Sniffer passa a dividir o teto com antivírus, PGP e o firewall Gauntlet numa das grandes consolidações de segurança da época.", sourceNote: "Números do negócio segundo o registro público." },
        { year: 2004, title: "Renascida para ser adquirida", detail: "A NAI se reorienta como McAfee e vende a Sniffer Technologies à Silver Lake e à TPG (cerca de US$ 275 milhões); os compradores ressuscitam o nome Network General, numa segunda vida de três anos para a marca original." },
        { year: 2007, title: "De volta para casa, na NetScout", detail: "A NetScout adquire a Network General (cerca de US$ 205 milhões): a tradição do analisador portátil e a tradição do monitoramento contínuo finalmente se fundem numa única casa de visibilidade." },
        { year: 2015, title: "A Arbor chega", detail: "A NetScout adquire os negócios de comunicações da Danaher (cerca de US$ 2,3 bilhões em ações): a Tektronix Communications e a Arbor Networks, cujos Peakflow e ATLAS definiram a detecção de DDoS e a telemetria de ameaças em escala de internet desde 2000. A linhagem agora vai de um único frame capturado até a meteorologia planetária dos ataques.", sourceNote: "Estrutura do negócio segundo o registro público." },
      ],
      // Products: names kept as the vendor writes them; descriptions translated.
      products: [
        { name: "The Sniffer", what: "O analisador de protocolos original: captura e decodificação legível por humanos, o produto que deu nome à prática." },
        { name: "nGenius platform", what: "A linha de visibilidade contínua e distribuída da NetScout: o analisador transformado em infraestrutura." },
        { name: "Arbor Peakflow / ATLAS", what: "Detecção de DDoS baseada em fluxos e a rede global de telemetria de ataques: análise de pacotes em escala de internet." },
      ],
      // Innovations.
      innovations: [
        { title: "A decodificação", detail: "Transformar frames em conversas rotuladas e explicadas criou uma profissão; cada título de coluna do Wireshark é neto do Sniffer." },
        { title: "A visibilidade como camada permanente", detail: "O arco da linhagem, de um portátil que se leva até o problema a probes que nunca saem do lugar, é a história do amadurecimento das operações de rede." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "A NetScout hoje abrange garantia de serviço e defesa contra DDoS (Arbor) em operadoras e empresas: a casa consolidada da tradição dos analisadores.",
      ],
      analyst: [
        "Um verbete para cinco empresas, de propósito: o Sniffer, o seu chassi da Dolch, o desvio pela NAI, a telemetria da Arbor e o teto da NetScout são uma única história, a biografia do ponto de captura.",
      ],
    },
  },

  // tamosoft: record prose only (no profile, no acquisitions); the subtitle is a product name and stays.
  "tamosoft": {
    // Card title (product subtitle kept as written), tagline and intro.
    name: "TamoSoft - TamoGraph",
    tagline: "Uma empresa privada de Christchurch cujo TamoGraph faz levantamentos de Wi-Fi passivos, ativos e preditivos em Windows e macOS.",
    intro:
      "A TamoSoft Ltd é uma empresa de capital fechado fundada em 1998, com sede em Christchurch, na Nova Zelândia, que atende clientes de mais de 100 países. O seu catálogo, na descrição da própria empresa, tem uma ferramenta de site survey sem fio e modelagem de RF, um monitor de rede e analisador de pacotes para redes cabeadas, outro para redes sem fio 802.11 a/b/g/n/ac/ax/be, uma ferramenta de projeto e planejamento para redes celulares privadas 4G LTE e 5G NR e um utilitário para testar o desempenho da rede.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O TamoGraph Site Survey é o produto pelo qual a maioria dos engenheiros de campo conhece a empresa: software de planejamento e site survey de Wi-Fi para criar e manter redes confiáveis, com levantamentos passivos, ativos e preditivos (modelagem de RF), suporte completo a 802.11be (Wi-Fi 7), 802.11ax (Wi-Fi 6 e 6E) e 802.11ac, além dos padrões legados, disponível para Windows 10, 11 e Server 2016 a 2022 e para macOS do Monterey ao Tahoe.",
      "Ele está neste registro ao lado da Ekahau e das ferramentas da MetaGeek como uma das três formas com que o ofício responde à mesma pergunta (o Wi-Fi vai funcionar neste prédio antes de alguém instalar qualquer coisa?) e como a que continuou independente. A empresa não publica uma página de história, então o verbete diz o que o site dela diz, e nada mais.",
    ],
  },

  // splunk: record prose, ending note, acquisitions (index-aligned) and the complete translated profile.
  "splunk": {
    // Card title (company name only), tagline and intro.
    name: "Splunk",
    tagline: "O nome vem da espeleologia, porque era assim que procurar nos próprios logs parecia.",
    intro:
      "Michael Baum, Rob Das e Erik Swan fundaram a Splunk em San Francisco em outubro de 2003, depois de cada um passar anos com software de infraestrutura e chegar à mesma queixa: encontrar qualquer coisa em logs gerados por máquinas significava rastejar por eles à mão. Batizaram a empresa a partir de spelunking, a exploração de cavernas.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A decisão técnica que a fez funcionar foi o schema-on-read. Um banco de dados relacional exige que você decida o formato dos dados antes de armazená-los, o que é impossível quando os dados são o que quer que cem sistemas diferentes por acaso emitam. A Splunk indexava o texto à medida que chegava e deixava a estrutura ser aplicada na hora da busca. Essa inversão é o motivo pelo qual ela conseguia ingerir qualquer coisa, e é a ideia sobre a qual o produto inteiro se apoia.",
      "A entrada no mercado foi igualmente deliberada: um plano gratuito de 500 MB por dia, adotado por engenheiros que depois o levavam para dentro das empresas onde trabalhavam. De baixo para cima, e não de cima para baixo, anos antes de isso ser uma estratégia reconhecida.",
      "Levantou cerca de US$ 40 milhões no total, pouco para o que ela viria a ser, dava lucro em 2009 e abriu capital em 2012 valendo cerca de US$ 1,6 bilhão. Baum tinha deixado o cargo de CEO em 2009; mudou-se para a Borgonha em 2014 e comprou uma vinícola, uma saída mais elegante do que a maioria das que esta linha do tempo oferece.",
      "A Cisco anunciou a aquisição em 21 de setembro de 2023 e a concluiu em 18 de março de 2024, por cerca de US$ 28 bilhões, um dos maiores negócios de software já feitos. A Cisco é um capítulo do próprio histórico de carreira deste site, então as duas pontas dessa transação aparecem nesta página.",
    ],
    // The ending's note (the year stays in the English record).
    endedNote:
      "Adquirida pela Cisco por cerca de US$ 28 bilhões, com anúncio em 21 de setembro de 2023 e conclusão em 18 de março de 2024. Continua como unidade de negócio da Cisco.",
    // Acquisitions prose, same length and order as the English list.
    acquisitions: [
      {
        what: "Análise de dados móveis e captura de dados de rede, compradas com poucos meses de diferença.",
        became: "Inteligência móvel e ingestão de dados de rede (wire data).",
      },
      {
        what: "Gestão de incidentes e de plantão.",
        became: "Splunk On-Call.",
      },
      {
        what: "Monitoramento de nuvem em tempo real, e a maior compra que a Splunk fez.",
        became: "Splunk Observability Cloud: a segunda metade de uma história que até então era só sobre logs.",
      },
    ],
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "splunk",
      // Founding story (company, year and founders unchanged).
      foundings: [
        {
          company: "Splunk",
          year: 2003,
          place: "San Francisco, Califórnia",
          founders: ["Michael Baum", "Rob Das", "Erik Swan"],
          story:
            "Três pessoas que tinham passado anos, cada uma, com software de infraestrutura e chegado à mesma queixa: os dados que dizem por que um sistema falhou já existem, nos logs, e não há um bom jeito de procurar neles. O nome vem de spelunking, a exploração de cavernas, porque era assim que vasculhar os próprios arquivos de log parecia.",
        },
      ],
      // Timeline: same years, same order.
      timeline: [
        { year: 2003, title: "A fundação", detail: "Em San Francisco, a partir da constatação de que os dados gerados por máquinas eram abundantes e impossíveis de pesquisar." },
        { year: 2012, title: "Listagem na NASDAQ", detail: "Listada como SPLK, valendo cerca de US$ 1,6 bilhão, depois de levantar só uns US$ 40 milhões no total, um valor excepcionalmente baixo para a escala que alcançou." },
        { year: 2019, title: "SignalFx", detail: "Adquirida por cerca de US$ 1,05 bilhão, e a base do negócio de observabilidade: métricas em streaming e monitoramento de desempenho de aplicações ao lado da plataforma de logs." },
        { year: 2023, title: "A Cisco anuncia", detail: "Anunciada em 21 de setembro, por cerca de US$ 28 bilhões, uma das maiores aquisições de software já registradas." },
        { year: 2024, title: "A conclusão, e um sentido de viagem incomum", detail: "Concluída em 18 de março. Gary Steele subiu para dentro da Cisco sem deixar de ser o general manager da Splunk, e a Cisco levou o seu próprio produto de observabilidade, o AppDynamics, para dentro da Splunk, e não o contrário. Um comprador que dobra o produto que já tinha para dentro da empresa que acabou de comprar está dizendo qual plataforma considera a sobrevivente.", sourceNote: "O papel duplo de Steele e a mudança do AppDynamics segundo a imprensa especializada da época e o resumo da Wikipedia." },
        { year: 2025, title: "O Talos dentro da Splunk", detail: "A inteligência de ameaças da Cisco passou a vir dentro do Splunk Enterprise Security sem custo adicional, o benefício concreto mais claro da aquisição para um cliente existente." },
      ],
      // Products: names kept as the vendor writes them; descriptions translated.
      products: [
        { name: "Splunk Enterprise and Splunk Cloud", what: "A plataforma central: ingerir qualquer coisa, indexar, pesquisar. Vendida por volume de dados por dia, local ou hospedada." },
        { name: "SPL, the Search Processing Language", what: "A linguagem de consulta, e o motivo pelo qual os profissionais ficam. Ela correlaciona fontes numa única busca (crash loops de containers contra falhas de API de nuvem contra autenticações no diretório), que é a capacidade que os usuários citam primeiro e a coisa mais difícil de reproduzir em outro lugar." },
        { name: "Splunk Enterprise Security", what: "O SIEM, agora com análise de comportamento de usuários e automação embutidas, em vez de vendidas à parte, e com alertas baseados em risco voltados para o problema de volume que torna os centros de operações de segurança inviáveis." },
        { name: "Splunk SOAR", what: "Orquestração e resposta automatizada, desenvolvidas a partir da aquisição da Phantom, com várias centenas de playbooks prontos e integrações com ferramentas de outros fabricantes." },
        { name: "Observability Cloud, ITSI and AppDynamics", what: "Métricas, traces e monitoramento de nível de serviço: a linha SignalFx, à qual se juntou, depois da aquisição, o próprio produto de desempenho de aplicações da Cisco." },
        { name: "Splunkbase", what: "Vários milhares de apps e add-ons da comunidade e de fabricantes. O ecossistema é uma parte substancial do motivo pelo qual a plataforma é onde os dados de uma organização acabam parando." },
      ],
      // Innovations.
      innovations: [
        { title: "Schema-on-read", detail: "Armazenar os dados primeiro e decidir o que significam na hora da consulta. Isso inverte a premissa dos bancos de dados, e é a única resposta viável quando a pergunta que você vai precisar fazer ainda não aconteceu, que é a condição normal de um incidente." },
        { title: "Os logs como tipo de dado de primeira classe", detail: "Antes disso, logs eram algo em que se dava um tail quando alguma coisa quebrava. Tratá-los como um acervo pesquisável, com uma linguagem de consulta, transformou um incômodo operacional numa categoria de análise, e os mercados de segurança e de observabilidade nasceram dessa mudança de enquadramento." },
        { title: "A linguagem como fosso", detail: "A SPL é poderosa e proprietária, e as duas coisas são o mesmo fato. Cada busca salva, dashboard e regra de detecção que uma organização escreve é um ativo que só roda aqui, então sair significa reescrever anos de trabalho acumulado, e não exportar dados." },
        { title: "Adoção de baixo para cima", detail: "Um plano gratuito que os engenheiros instalavam por conta própria e depois levavam para as empresas onde trabalhavam. Chegar ao comprador pelo profissional, e não o contrário, era incomum em infraestrutura corporativa nos anos 2000 e hoje é a receita padrão." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "Operações de segurança e observabilidade de TI, vendidas a grandes empresas: relatada em uso em mais de noventa empresas da Fortune 100, processando volumes medidos em exabytes por dia. O cliente é uma organização com dados suficientes para que encontrar qualquer coisa neles tenha virado um problema em si.",
        "Duas críticas são consistentes o bastante no retorno dos clientes para pertencer a qualquer descrição honesta. É cara: o preço por volume em escala é a queixa mais frequente, e implantações de cem gigabytes por dia são cotadas na casa das centenas de milhares por ano. E sair dela é caro pelo motivo acima: as consultas não viajam. Concorrentes como a CrowdStrike, cujo próprio SIEM aparece em outro ponto desta linha do tempo, se posicionam explicitamente contra as duas coisas.",
      ],
      analyst: [
        "Leader no Magic Quadrant de SIEM do Gartner por mais de dez avaliações consecutivas, com a posição mais alta em capacidade de execução em 2025, e Leader em plataformas de observabilidade três anos seguidos: segundo relatos, o único fabricante a ocupar as duas posições ao mesmo tempo três vezes.",
        "A pergunta em aberto sob a Cisco é se uma plataforma cuja força é ser neutra quanto às fontes de dados continua assim dentro de uma empresa de redes, e os primeiros sinais apontam para os dois lados: a inteligência do Talos acrescentada sem custo é um benefício para o cliente, enquanto a chegada do AppDynamics é consolidação.",
      ],
    },
  },

  // tivit: record prose plus the complete translated profile (the English profile has no foundings).
  "tivit": {
    // Card title (company name only), tagline and intro.
    name: "TIVIT",
    tagline: "Um tenista profissional, uma casa noturna e uma empresa construída fundindo outras duas que alguém já tinha.",
    intro:
      "A TIVIT não começou numa garagem. Foi montada. Em 2005, a Votorantim Novos Negócios fundiu duas empresas do próprio portfólio, a Optiglobe, comprada em 2002, e a Proceda, comprada uns oito meses antes, e batizou o resultado de TIVIT. Ela chegou com cerca de dois mil funcionários e mais de duzentos clientes, entre eles Petrobras, Xerox e White Martins. A linha do tempo da própria empresa data a marca de 2004; a cobertura de imprensa da época sobre a fusão é de agosto de 2005, e as duas datas ficam registradas aqui.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A pessoa por trás dela teve uma carreira anterior incomum. Luiz Mattar passou dez anos como tenista profissional antes de entrar nos negócios. O seu primeiro empreendimento como investidor foi uma cervejaria com casa noturna. Pouco depois, com quatro sócios e R$ 150.000, ele criou a Telefutura, uma empresa de call center e de terceirização de processos de negócio, que vendeu 20% à Votorantim Novos Negócios em 2001, uma transação que importou menos pelo dinheiro do que pela credibilidade que comprou junto a clientes do setor financeiro.",
      "A ideia que Mattar não parava de defender era a de um one stop shop: um cliente capaz de comprar todo tipo de serviço de TI de um único fornecedor, em vez de montar um a partir de muitos. A Votorantim acabou concluindo que tinha as peças para construir isso, e construiu, e é por isso que a TIVIT existe como fusão, e não como fundação. A própria Telefutura foi incorporada em 2007.",
      "A abertura de capital é um detalhe que vale guardar. A TIVIT entrou no Novo Mercado da BM&FBovespa em setembro de 2009, a R$ 15 por ação, levantando mais de R$ 660 milhões, depois de duas tentativas anteriores abandonadas por causa das condições de mercado. Na época, era a única empresa de serviços de TI listada na bolsa brasileira: as outras empresas de tecnologia listadas eram fabricantes de hardware, como Positivo, Itautec e Bematech, ou de software, como a Totvs. Um negócio de serviços é mais difícil de explicar ao mercado de capitais do que uma fábrica, e por um tempo ninguém mais tentou.",
      "Não ficou listada por muito tempo. Em 2010, a Apax Partners comprou o controle, pagando um prêmio de vinte a trinta por cento sobre um valor de mercado de cerca de R$ 1,47 bilhão, e foi o primeiro investimento da Apax no Brasil. Sob esse controle, a empresa se expandiu pela região, adquirindo a Synapsis em 2014 e chegando a dez países latino-americanos.",
      "O que veio depois é o arco comum de um negócio de serviços nesse período: uma plataforma de nuvem em 2016, um braço de soluções digitais, uma unidade de inovação, uma prática de cibersegurança que informou crescimento de cerca de noventa por cento em 2023, a separação do negócio de data centers sob o nome Takoda e a aquisição pelo grupo italiano Almaviva. O histórico da própria TIVIT situa essa aquisição em 2025 e descreve a Almaviva como líder global em transformação digital, IA e cloud.",
      "Lidas ao lado do verbete da Stefanini, as duas são construções opostas da mesma coisa. A Stefanini começou com um homem dando aulas num quarto vago e cresceu para fora durante décadas. A TIVIT começou pronta, com dois mil funcionários e uma lista de clientes, porque uma holding decidiu que o mercado queria algo e chegou lá por fusões. As duas são grandes empresas brasileiras de serviços de tecnologia; nenhuma poderia ter sido construída do jeito da outra. Uma precisou de paciência, a outra de capital, e a pergunta interessante é qual modelo viaja melhor: a Stefanini foi para o exterior por conta própria, enquanto a expansão regional da TIVIT chegou com private equity junto.",
    ],
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "tivit",
      // No founding entries in the English profile.
      foundings: [],
      // Timeline: same years, same order.
      timeline: [
        { year: 1999, title: "Um cliente, e depois o problema de ter um cliente só", detail: "O primeiro cliente da Telefutura foi o iG, o provedor de internet gratuita, que crescia mais depressa do que tinha planejado e precisava de gente para atender telefones. No fim do primeiro ano, cerca de noventa e cinco por cento da receita vinha de um único setor: a posição a que toda empresa de serviços jovem chega, e a que decide se ela vira um negócio ou um fornecedor." },
        { year: 2025, title: "Vendida sem os data centers", detail: "A Takoda, o spin-off que detém a operação de data centers, ficou de fora da transação com a Almaviva e foi posta à venda separadamente. Uma empresa montada em 2005 em torno da Optiglobe, um negócio de data centers, trocou de mãos vinte anos depois com os data centers recortados do negócio. O que o comprador queria era a camada de serviços que tinha sido construída em cima deles." },
        { year: 2025, title: "Não uma entrada, mas uma aposta dobrada", detail: "O comprador já estava aqui. A operação brasileira da Almaviva era a maior fora da Itália antes do negócio (umas trinta e sete mil pessoas e R$ 1,7 bilhão de receita), então trata-se de um grupo estrangeiro que já tinha feito a sua aposta no país e a estava aumentando, e não de um que chegava." },
      ],
      // Products: descriptor words localised; descriptions translated.
      products: [
        { name: "Gestão de nuvem e infraestrutura", what: "Operar as plataformas, em vez de ser dono dos prédios, que é a distinção que a separação da Takoda tornou estrutural." },
        { name: "Cibersegurança", what: "Uma unidade de negócio própria, e a parte do portfólio que mais cresceu nos últimos anos: a mesma curva de demanda que toda empresa de serviços desta região surfou." },
        { name: "SAP e serviços de aplicações", what: "Implantar e operar os sistemas corporativos dos quais as empresas brasileiras dependem, o que é sem glamour, difícil de trocar e o motivo pelo qual os clientes ficam uma década." },
        { name: "Terceirização de processos de negócio", what: "A herança da Telefutura: operar processos em nome de um cliente, ainda presente no portfólio duas décadas depois de ter sido a empresa inteira." },
      ],
      // Innovations.
      innovations: [
        { title: "Montada sob especificação", detail: "A maioria das empresas descobre o que é. Esta foi projetada: uma holding decidiu que o mercado queria um único fornecedor para tudo o que é técnico, verificou quais dos seus próprios ativos podiam ser combinados para isso e os fundiu. É estratégia corporativa executada como fundação, e produziu uma empresa que tinha escala antes de ter história." },
        { title: "Vender a camada, e não o piso", detail: "Separar os data centers dos serviços e vendê-los à parte é uma declaração sobre onde está o valor. Prédios cheios de racks são um ativo com preço conhecido e custo de capital; as práticas que rodam neles são mais difíceis de avaliar e de substituir. O mercado respondeu a essa pergunta comprando um e deixando o outro na prateleira." },
        { title: "O private equity como veículo da expansão regional", detail: "O verbete acima observa que a expansão regional chegou com private equity junto. Essa é a troca: capital e disciplina de aquisições em troca de um relógio. Quinze anos sob um mesmo dono é muito para esse modelo, e as várias tentativas de venda abandonadas sugerem que a saída foi mais difícil de encontrar do que a entrada." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "Grandes empresas brasileiras e latino-americanas (serviços financeiros acima de tudo, além de indústria, varejo e setor público) em dez países, com cerca de R$ 2,1 bilhões de receita.",
        "Compete com a Stefanini e as outras empresas de serviços regionais, com os integradores globais e, cada vez mais, com os próprios provedores de nuvem, cujas ofertas gerenciadas eliminam trabalho que antes era terceirizado.",
      ],
      analyst: [
        "O retrato financeiro informado na época da venda merece ser dito com clareza: receita de cerca de R$ 2,1 bilhões em 2024, e um lucro de R$ 5,7 milhões em 2023 que reverteu um prejuízo de R$ 47,2 milhões no ano anterior. São margens finas sobre uma receita substancial, que é a condição comum dos serviços baseados em mão de obra e o motivo pelo qual a consolidação não para.",
        "O preço da compra não foi divulgado, e o número de 2010 é ele próprio informado de duas formas: R$ 874 milhões num relato e um bilhão de dólares em outro. Quando uma empresa trocou de mãos três vezes e os números não batem entre as fontes, a posição honesta é informar a faixa e registrar que ninguém de fora das transações tem como resolver a questão.",
      ],
    },
  },

  // tp-link: record prose plus the complete translated profile.
  "tp-link": {
    // Card title (company name only), tagline, intro and body.
    name: "TP-Link",
    tagline: "A rainha do volume nas redes de consumo.",
    intro:
      "Fundada em Shenzhen em 1996 pelos irmãos Zhao Jianjun e Zhao Jiaxing (o nome abrevia twisted pair link), a TP-Link chegou ao topo dos rankings globais de remessas de WLAN de consumo com uma relação custo-desempenho disciplinada e ficou lá por anos.",
    body: [
      "Archer e Deco carregam o núcleo de volume, o Omada leva o modelo de controladora ao segmento de valor das pequenas e médias empresas, o Tapo chega à casa inteligente e, mantendo-se aos fatos, o escrutínio do governo dos EUA noticiado desde o fim de 2024 continua no registro público, sem desfecho na data da verificação.",
    ],
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "tp-link",
      // Founding story (company, year and founders unchanged).
      foundings: [
        {
          company: "TP-Link",
          year: 1996,
          place: "Shenzhen, China",
          founders: ["Zhao Jianjun", "Zhao Jiaxing"],
          story:
            "Dois irmãos em Shenzhen deram à empresa o nome do próprio cabo (TP de twisted pair, o par trançado) e construíram a máquina de volume mais disciplinada que as redes de consumo já viram. A receita era consistência a um preço que ninguém conseguia igualar: roteadores, switches e adaptadores que funcionavam assim que saíam da caixa, despachados em quantidades impressionantes e aprimorados sem trégua. Isso levou a TP-Link ao topo dos rankings globais de remessas de WLAN de consumo e a manteve lá ano após ano: a marca sobre a qual uma grande parte do mundo conectado de fato roda, pense ela em redes ou não.",
          sourceNote:
            "Ano de fundação, fundadores e a origem do nome no par trançado segundo o registro corporativo padrão; a liderança sustentada em remessas de WLAN de consumo segundo os números da IDC, como amplamente citados.",
        },
      ],
      // Timeline: same years, same order.
      timeline: [
        { year: 1996, title: "Batizada com o nome do cabo", detail: "Os irmãos Zhao fundam a TP-Link em Shenzhen ('twisted pair link'), construindo adaptadores de rede e o segmento de valor das redes domésticas." },
        { year: 2005, title: "Rumo ao mundo", detail: "A expansão internacional começa para valer; a fórmula de preço com confiabilidade funciona em vários mercados, e a TP-Link vira presença fixa no varejo do mundo inteiro." },
        { year: 2010, title: "A coroa das remessas", detail: "A TP-Link chega ao topo dos rankings globais de remessas de WLAN de consumo, uma posição que mantém por anos seguidos.", sourceNote: "Segundo os rankings da IDC, como amplamente citados pela empresa e pela imprensa especializada." },
        { year: 2016, title: "Além do roteador", detail: "As linhas de casa inteligente Kasa (e depois Tapo), a malha Deco para a casa inteira e o segmento Omada, de redes gerenciadas na nuvem para pequenas e médias empresas, ampliam o portfólio para cima no mercado e para dentro de casa." },
        { year: 2024, title: "Sob o microscópio", detail: "É noticiado o escrutínio do governo dos EUA sobre os roteadores TP-Link, com possíveis restrições em discussão; enquanto isso, a estrutura corporativa separou uma TP-Link Systems com sede nos EUA da original de Shenzhen.", sourceNote: "Segundo reportagens da imprensa a partir do fim de 2024; sem desfecho na data de verificação deste perfil (22/07/2026), registrado como fato, não julgado." },
      ],
      // Products: names kept as the vendor writes them; descriptions translated.
      products: [
        { name: "Archer / Deco", what: "As linhas de roteadores de consumo e de malha para a casa inteira: o núcleo de volume." },
        { name: "Omada", what: "Redes gerenciadas na nuvem para pequenas e médias empresas (access points, switches, gateways): o modelo de controladora no segmento de valor." },
        { name: "Kasa / Tapo", what: "Tomadas inteligentes, câmeras e automação residencial: a cabeça de ponte da empresa de roteadores na casa inteligente." },
      ],
      // Innovations.
      innovations: [
        { title: "A disciplina como estratégia", detail: "A contribuição da TP-Link é operacional: a prova de que rigor na cadeia de suprimentos e aprimoramento incansável da relação custo-desempenho podem ganhar um mercado global contra todos os incumbentes. É a versão difícil de 'bom o bastante, em todo lugar, a preço acessível'." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "A líder global em volume nas redes de consumo por anos seguidos, com posições crescentes em pequenas e médias empresas (Omada) e na casa inteligente (Tapo) e, mantendo-se aos fatos, um holofote geopolítico pelo qual hoje navega.",
      ],
      analyst: [
        "Situada entre as contemporâneas como a história definitiva de volume na categoria que a NETGEAR inventou, e um estudo de caso vivo de como o hardware de redes virou objeto da política de cadeia de suprimentos e de segurança nacional.",
      ],
    },
  },

  // unicamp: record prose only (no profile, no acquisitions).
  "unicamp": {
    // Card title, tagline and intro.
    name: "Unicamp - a outra metade da esteira paulista",
    tagline: "Universidade pública no centro de um polo tecnológico regional.",
    intro:
      "A Unicamp fica no meio da região tecnológica de Campinas, e a sua presença explica por que uma grande parte do trabalho brasileiro em hardware e telecomunicações aconteceu num trecho específico de cem quilômetros, em vez de se espalhar pelo país.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A Unicamp foi oficialmente fundada em 5 de outubro de 1966, quando a pedra fundamental foi lançada em trinta alqueires de terra doada, a doze quilômetros de Campinas. O motivo de ela ter sido posta ali, e não na capital, é a parte que importa: o governo estadual queria um centro de pesquisa no interior especificamente para impulsionar o desenvolvimento e a industrialização da região. A universidade foi um instrumento de política industrial antes de ser um instrumento acadêmico.",
      "Para esta linha do tempo, o seu ato decisivo veio três anos depois. Em 1969, a Unicamp criou um bacharelado em ciência da computação, o primeiro do Brasil, e ele virou o modelo que outras universidades copiaram. Todo curso brasileiro de computação que veio depois descende de um currículo desenhado numa universidade que existia havia três anos.",
      "A localização deu resultado de um jeito visível no mapa. O CPqD, o centro de pesquisa em telecomunicações criado pela Telebras em 1976, foi instalado na mesma cidade; a região virou a maior concentração de pesquisa e de fabricação de tecnologia do país; e, em 2019, estimava-se que só a universidade gerava 13,8 bilhões de reais de impacto na região de Campinas.",
      "Vale contar essa sequência com clareza, porque ela costuma ser contada como sorte. Um estado pôs deliberadamente uma universidade de pesquisa numa cidade do interior para industrializá-la, um centro de pesquisa federal veio uma década depois, e o polo se formou em torno deles, e não o contrário. Regiões tecnológicas costumam ser explicadas depois do fato pelo clima, pelas universidades e pela cultura empreendedora; esta foi uma decisão, e os documentos que a registram dizem o motivo.",
    ],
  },

  // vision-cybersecurity: record prose only (no profile, no acquisitions).
  "vision-cybersecurity": {
    // Card title, tagline and intro.
    name: "Vision Cybersecurity - uma base de clientes vendida por conta própria",
    tagline: "O braço corporativo da ISH Tecnologia, adquirido pela SPX em 2026 e fundido com a Tempest.",
    intro:
      "A Vision Cybersecurity é uma empresa brasileira de serviços de segurança, formada a partir do braço corporativo da ISH Tecnologia e adquirida pela SPX em 2026.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A Vision Cybersecurity era o braço corporativo da ISH Tecnologia, a empresa de segurança do Espírito Santo, e atendia clientes empresariais privados. A SPX a adquiriu em janeiro de 2026, separando essa base de clientes da empresa-mãe.",
      "A posição de mercado é a parte interessante. Enquanto a Tempest vende para empresas com faturamento acima de um bilhão de reais, a Vision trabalha com empresas de médio porte, e as duas prestam serviços de modo geral parecidos: análise de vulnerabilidades em software, plataformas, aplicações, chatbots e sistemas industriais, incluindo varejo e setor automotivo.",
      "O meio do mercado é onde os serviços de segurança são mais difíceis de tornar lucrativos. Contas grandes justificam equipes dedicadas, e as pequenas compram produtos padronizados; as empresas no meio precisam de trabalho de avaliação de verdade a um preço que não comporta um projeto sob medida, e é por isso que tão poucas independentes sobrevivem ali e que essa base de clientes valia ser comprada separadamente da empresa que a construiu.",
      "Em 2026, a Embraer e a SPX anunciaram a fusão da Tempest e da Vision numa única empresa, com cerca de setecentos milhões de reais de faturamento, juntando o negócio de grandes contas e o do mercado médio sob o mesmo teto, que é a consolidação para a qual este segmento caminha há uma década.",
    ],
  },

  // zabbix: record prose only (no profile, no acquisitions); the name has no subtitle.
  "zabbix": {
    // Card title (company name only), tagline and intro.
    name: "Zabbix",
    tagline: "A ferramenta interna de Alexei Vladishev, de 2001, virou uma empresa de Riga em 2005 e uma plataforma de monitoramento com escritórios em quatro continentes, livre e de código aberto o tempo todo.",
    intro:
      "O Zabbix é uma plataforma de monitoramento de código aberto para redes, servidores, máquinas virtuais e serviços de nuvem: coleta métricas por SNMP, IPMI, JMX e pelos próprios agentes, armazena-as num banco de dados relacional e oferece alertas, visualização e relatórios por meio de um front-end web. Alexei Vladishev o começou em 2001 como ferramenta interna de monitoramento e lançou a primeira versão estável, a 1.0, em 2004; o histórico da própria empresa diz que ela começou em 2005, com um pequeno grupo de pessoas apaixonadas lideradas por Vladishev, que continua CEO e fundador.",
    // Body paragraphs, same count and order as the English.
    body: [
      "A empresa, a Zabbix SIA, tem sede na Letônia e escritórios nos EUA, no Brasil, no México, no Japão e na França. A descrição que ela própria faz do modelo cabe numa frase: software livre e de código aberto sustentado por um fabricante maduro e confiável. O servidor e o agente original são escritos em C, um agente mais novo, o agent2, em Go, o front-end web em PHP, e um gateway Java cuida do JMX.",
      "O histórico de versões é um mapa do que monitoramento passou a significar. A 1.8, em dezembro de 2009, trouxe a descoberta automática e o autorregistro de hosts; a 2.0, em maio de 2012, o sistema de dashboards e a herança de templates; a 3.0, em fevereiro de 2016, a primeira versão de suporte de longo prazo, criptografia entre agente e servidor e triggers preditivos; a 4.0, em outubro de 2018, o agente em Go com arquitetura de plugins; a 5.0 LTS, em maio de 2020, o proxy de monitoramento para sites distribuídos e o SAML; a 6.0 LTS, em fevereiro de 2022, clustering de alta disponibilidade, monitoramento de Kubernetes e detecção de anomalias; a 7.0 LTS, em junho de 2024, o monitoramento sintético baseado em navegador e o load balancing de proxies, além da troca de licença da GPLv2 para a AGPLv3.",
      "Ao lado do Nagios e do OpenNMS neste registro, o Zabbix é o que manteve uma única empresa e uma única base de código desde o início, e o que tem escritório no Brasil.",
    ],
  },

  // websense-forcepoint: record prose, acquisitions (index-aligned) and the complete translated profile.
  "websense-forcepoint": {
    // Card title (two company names, joined in Portuguese), tagline and intro.
    name: "Websense e Forcepoint",
    tagline: "Uma revenda que virou filtro, depois IPO da bolha, depois o braço cibernético de uma empresa de defesa, depois private equity de novo.",
    intro:
      "Phil Trubey fundou a NetPartners em Sorrento Valley, San Diego, em 1994, revendendo produtos de segurança de rede de outras empresas. O que fez a empresa foi aquilo que ela construiu, e não o que revendia: software para controlar o que os funcionários podiam acessar na internet. Passou a se chamar Websense em junho de 1999 e, em março de 2000, no pico real da bolha ponto-com, levantou US$ 72 milhões num IPO cuja ação dobrou de preço no primeiro dia.",
    // Body paragraphs, same count and order as the English.
    body: [
      "O fundador não estava lá para ver. Em 1998, com US$ 6 milhões de venture capital levantados e US$ 6 milhões de receita anual, os investidores tiraram Trubey do cargo de CEO e nomearam John Carrington. A troca de nome, o IPO e tudo o que veio depois aconteceram sem a pessoa que começou a empresa, o que é comum o bastante para não chamar atenção no agregado e merece ser dito no caso particular.",
      "Vale descrever com precisão o que o produto de fato fazia, porque o mecanismo explica a crítica. Um banco de dados de categorias classifica os sites; uma política decide quais categorias um dado usuário pode acessar; o ponto de aplicação fica entre o usuário e a web. É a mesma arquitetura dos proxies que aparecem em outros pontos desta linha do tempo, e tem a mesma fraqueza inevitável: uma classificação é um julgamento, feito em escala, por pessoas que o usuário afetado nunca vai conhecer.",
      "Por isso o produto era chamado de censorware, e a queixa não era infundada. O bloqueio excessivo pegava informação sobre saúde sexual, material político e muitos sites comuns que caíam do lado errado da fronteira de uma categoria. Isso não é um bug que se corrige; é o modo de falha da abordagem inteira, e qualquer relato honesto sobre filtragem web precisa dizer isso. A defesa é que um empregador restringindo a própria rede é uma questão diferente de um Estado restringindo uma população; mas o mesmo produto servia aos dois, e costuma servir.",
      "A empresa cresceu comprando capacidades: a PortAuthority em 2006, para fingerprinting de dados, a SurfControl em 2007, para segurança de e-mail, a Defensio em 2009, para spam em redes sociais. Em 2011, o Facebook a usava para verificar cada link publicado na plataforma, uma medida impressionante de quão longe um produto corporativo de filtragem tinha ido a partir da rede corporativa.",
      "Depois veio o carrossel de donos, a outra metade da história. A Vista Equity Partners fechou o capital da empresa em 2013 por US$ 906 milhões, a US$ 24,75 por ação, e a transferiu de San Diego para Austin. Em abril de 2015, a Raytheon, uma empresa de defesa, comprou 80% por US$ 1,9 bilhão, líquidos de caixa, aportando a sua própria Raytheon Cyber Products, avaliada em cerca de US$ 400 milhões, e criando uma joint venture de cerca de US$ 2,3 bilhões, com a Vista ficando com o restante. Em outubro daquele ano, ela comprou a Stonesoft e a Sidewinder da Intel por US$ 389 milhões, sendo a Stonesoft o next-generation firewall da McAfee. Em 14 de janeiro de 2016, o conjunto todo passou a se chamar Forcepoint. A Raytheon ficou com os 20% restantes em 2019 e, em janeiro de 2021, vendeu a empresa à Francisco Partners.",
      "Quatro nomes, cinco donos, trinta anos. NetPartners, Websense, Raytheon|Websense, Forcepoint. O que o período da empresa de defesa comprou não foi tanto tecnologia, mas habilitação de segurança: trabalho para o governo exige um fornecedor capaz de recebê-lo, e uma empresa comercial de filtragem não era. O produto foi até onde os donos conseguiam levá-lo, o que é uma descrição mais honesta da maior parte das consolidações da indústria de segurança do que a linguagem de estratégia usada na época.",
    ],
    // Acquisitions prose, same length and order as the English list.
    acquisitions: [
      {
        what: "Fingerprinting de dados: identificar conteúdo sensível pela forma, e não por regra.",
        became: "O começo da linha de prevenção de perda de dados que acabou importando mais do que a filtragem.",
      },
      {
        what: "Uma concorrente em filtragem web e de e-mail.",
        became: "A concentração do mercado de filtragem em menos mãos.",
      },
      {
        what: "Compradas da Intel. A Stonesoft tinha sido vendida como McAfee Next-Generation Firewall.",
        became: "A linha de firewalls da Forcepoint, e mais um pedaço do espólio da McAfee trocando de mãos, algo que esta linha do tempo registra repetidas vezes.",
      },
      {
        what: "Operações de segurança e detecção gerenciada.",
        became: "Capacidade de serviços ao lado dos produtos.",
      },
    ],
    // Complete profile copy: facts verbatim, prose translated (the English has no foundings).
    profile: {
      slug: "websense-forcepoint",
      // No founding entries in the English profile.
      foundings: [],
      // Timeline: same years, same order.
      timeline: [
        { year: 2009, title: "Iêmen", detail: "Constatou-se que o governo do Iêmen usava os produtos da empresa para monitorar o uso público da internet e bloquear aplicações. A empresa declara uma política contra vender a governos e provedores que restringem a internet, o que torna o caso mais agudo, e não mais brando: uma posição declarada não impediu a implantação, porque a tecnologia de filtragem chega ao usuário final por distribuidores, revendas e integradores, e uma política no topo dessa cadeia é um documento, e não um controle.", sourceNote: "Relatado em fontes secundárias, e não em documentos da empresa ou em conclusões de órgãos reguladores." },
        { year: 2013, title: "Um prêmio de 29% para fechar o capital", detail: "A Vista pagou bem acima do preço recente de negociação, que é o que um comprador de private equity oferece quando acha que uma empresa aberta está sendo avaliada pela métrica errada." },
        { year: 2015, title: "Seiscentos milhões eram um empréstimo", detail: "Parte do US$ 1,9 bilhão da Raytheon tomou a forma de um empréstimo entre empresas para a joint venture, e não de compra de participação. Essa estrutura importa: é uma empresa de defesa mantendo opções abertas sobre o quanto queria ser dona de um negócio de software comercial, e seis anos depois ela exerceu essa opção vendendo." },
      ],
      // Products: descriptor words localised; descriptions translated.
      products: [
        { name: "Segurança web", what: "O filtro original, ainda o produto reconhecível: classificar o destino, aplicar a política, impor no caminho." },
        { name: "Prevenção de perda de dados", what: "Inspecionar o que sai, e não o que é acessado. Chegou por aquisição e virou o negócio mais defensável à medida que a filtragem web virava commodity." },
        { name: "SureView e risco interno", what: "A contribuição da Raytheon: observar o que os usuários autorizados fazem, partindo do raciocínio de que a pessoa com acesso legítimo é o problema mais difícil. É também a capacidade mais próxima da vigilância, e o posicionamento da própria empresa como segurança centrada no ser humano é um jeito de descrevê-la." },
        { name: "Next-generation firewall", what: "A linha Stonesoft, comprada da Intel depois de ter sido da McAfee: um produto que já pertenceu a quatro empresas sem mudar muito." },
        { name: "Soluções cross-domain e para governo", what: "Transferência controlada entre redes classificadas de níveis diferentes, vendida a clientes de defesa e de inteligência. É a parte que exigiu os donos que o verbete acima descreve." },
      ],
      // Innovations.
      innovations: [
        { title: "Uma política não é um controle", detail: "A recusa declarada da empresa de vender a governos que censuram é genuína, e não impediu que os seus produtos fossem usados assim. Software desse tipo chega ao operador por canais, e uma intenção mantida no fabricante não desce por eles. Todo fabricante cujo produto pode restringir o que as pessoas leem tem esse problema, e declarar uma política é a menos eficaz das respostas disponíveis, embora também seja a única que não custa nada." },
        { title: "Do que você acessa para o que você envia", detail: "A filtragem web pergunta para onde o usuário está indo. A prevenção de perda de dados pergunta o que está saindo. A segunda pergunta sobreviveu à comoditização da primeira, porque uma classificação de destinos pode ser comprada de qualquer um, enquanto o entendimento dos dados de uma organização específica não pode." },
        { title: "Comprar habilitação de segurança", detail: "Vale repetir em termos de produto a observação do verbete acima: soluções cross-domain e implantações classificadas não são vendidas por empresas sem pessoal e instalações habilitados. A empresa de defesa não acrescentou muita tecnologia, e acrescentou a única coisa que abre esse mercado." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "Empresas de setores regulados, serviços financeiros e governo: relatados mais de doze mil clientes em mais de vinte setores, com receita em torno de US$ 658 milhões em 2019 e cerca de 1.800 funcionários em 2025. A base instalada se concentra onde a proteção de dados é exigência de conformidade, e não compra discricionária, que é o tipo mais durável de demanda em segurança.",
        "Compete com os fabricantes de secure web gateway, com os especialistas em proteção de dados e com as suítes de plataforma que hoje empacotam as duas coisas: um mercado em que o produto original é um recurso da plataforma de outra empresa, e é por isso que o centro de gravidade da empresa mudou.",
      ],
      analyst: [
        "As avaliações a situam entre os fabricantes estabelecidos em proteção de dados e secure web gateway, e não na liderança, e a cobertura reflete uma empresa cuja linha de produtos foi montada a partir de quatro décadas de compras.",
        "O ponto duradouro é aquele com que o verbete acima termina. Um produto comercial de filtragem obteve habilitação federal por aquisição, vendeu soluções cross-domain apoiado nela e depois foi revendido a um dono financeiro sem essa condição. A capacidade ficou; o que mudou foi quem tinha permissão para vendê-la, o que lembra que, em partes desta indústria, a licença é o ativo.",
      ],
    },
  },

  // zte: record prose plus the complete translated profile.
  "zte": {
    // Card title, tagline, intro and body.
    name: "ZTE - a outra gigante da China",
    tagline: "Shenzhen, 1985, entre as quatro maiores em 5G, e a denial order de 2018 que fez da dependência da cadeia de suprimentos a lição mais vívida da indústria.",
    intro:
      "Fundada dois anos antes da vizinha Huawei, em Shenzhen, a ZTE cresceu a partir da comutação digital até virar uma das quatro grandes fabricantes mundiais de equipamentos móveis. Em abril de 2018, uma proibição norte-americana de componentes parou a empresa em poucas semanas; o acordo de US$ 1,4 bilhão que a religou (multa, depósito em garantia, gestão substituída, monitores instalados dentro da empresa) transformou 'de onde vem o seu silício' numa questão de projeto de rede discutida nos conselhos de administração do mundo inteiro.",
    body: [
      "O perfil cobre a fundação em 1985, a era do ZXJ10, a escala global com o CDMA e os aparelhos celulares, a confissão de culpa de 2017 e a crise da denial order de 2018, com o seu acordo, e o mercado de 5G dividido em dois blocos em que a ZTE vive hoje.",
    ],
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "zte",
      // Founding story (company, year and founders unchanged).
      foundings: [
        {
          company: "ZTE (founded as Zhongxing Semiconductor; later Zhongxing Telecommunication Equipment)",
          year: 1985,
          place: "Shenzhen, China",
          founders: ["Hou Weigui (founding chairman) and aerospace-ministry investors"],
          story:
            "Fundada na zona econômica especial de Shenzhen em 1985, dois anos antes da vizinha Huawei, a ZTE cresceu da montagem de semicondutores até virar a outra gigante chinesa de equipamentos de telecomunicações: a contraparte ligada ao Estado e de capital aberto da rival de capital fechado. A sua central ZXJ10 ajudou a cabear o boom da telefonia na China, os seus equipamentos CDMA e aparelhos celulares ganharam escala global nos anos 2000 e, nos anos 2010, ela estava entre as cinco maiores fabricantes de equipamentos do mundo. Então, em 2018, uma denial order norte-americana desligou o seu fornecimento de componentes, e por algumas semanas o mundo viu uma empresa de cem mil pessoas demonstrar exatamente o que dependência significa.",
        },
      ],
      // Timeline: same years, same order.
      timeline: [
        { year: 1993, title: "ZXJ10", detail: "O grande sistema de comutação digital da ZTE chega no momento em que a rede telefônica chinesa explode: comutação nacional para o mercado que mais crescia no mundo, a base de receita sobre a qual tudo o que veio depois se apoiou." },
        { year: 2005, title: "Escala global", detail: "Sistemas CDMA, DSL e aparelhos celulares de baixo custo levam a ZTE a mercados emergentes do mundo inteiro; ao lado da Huawei, ela faz de 'equipamento chinês de telecomunicações' uma categoria global, e não mais doméstica." },
        { year: 2017, title: "A confissão de culpa", detail: "Março de 2017: a ZTE se declara culpada nos EUA por enviar ilegalmente equipamentos de origem norte-americana ao Irã e à Coreia do Norte, com cerca de US$ 892 milhões em penalidades e outros US$ 300 milhões suspensos, condicionados ao cumprimento do acordo.", sourceNote: "Números segundo os acordos com o Departamento de Comércio e o DOJ dos EUA, registro público." },
        { year: 2018, title: "A denial order", detail: "Abril de 2018: por ter violado os termos do acordo, a ZTE é proibida de comprar componentes norte-americanos por sete anos. Em poucas semanas, as principais operações param: sem silício da Qualcomm, sem óptica norte-americana, sem licenciamento do Android. A demonstração ao vivo mais crua que a indústria já teve da dependência da cadeia de suprimentos como risco existencial.", sourceNote: "Segundo o registro público da denial order do BIS e a divulgação da própria ZTE de que as principais atividades operacionais tinham cessado." },
        { year: 2018, title: "O recomeço de US$ 1,4 bilhão", detail: "Junho-julho de 2018: um novo acordo, substituindo o anterior (multa de US$ 1 bilhão, US$ 400 milhões em depósito em garantia, conselho e alta gestão substituídos, monitores de conformidade escolhidos pelos EUA instalados dentro da empresa), suspende a proibição. A ZTE sobrevive, mudada para sempre, e toda operadora de rede do planeta relê a sua lista de materiais.", sourceNote: "Termos do acordo segundo o registro público." },
        { year: 2020, title: "A grande do 5G", detail: "A ZTE se firma como uma das quatro grandes globais de RAN, dominante em casa e relevante na Ásia, na África e na América Latina, enquanto a inclusão na covered list dos EUA a deixa de fora das redes norte-americanas; o mercado dividido em dois blocos vira o mapa da indústria." },
      ],
      // Products: descriptor words localised; descriptions translated.
      products: [
        { name: "ZXJ10 e sucessores", what: "A linhagem de comutação digital que cabeou o boom chinês: a franquia fundadora da ZTE." },
        { name: "RAN e core (5G)", what: "Um dos quatro portfólios de redes móveis em escala global, do rádio ao packet core." },
        { name: "Acesso fixo e óptica", what: "Linhas de GPON, DSL e transporte que levam boa parte da banda larga do mundo emergente." },
      ],
      // Innovations.
      innovations: [
        { title: "Engenharia de custo em escala nacional", detail: "A contribuição da ZTE foi econômica: equipamentos com preço pensado para os mercados que os incumbentes ignoravam, a receita que redesenhou o mapa de fabricantes do Sul Global." },
        { title: "A lição de conformidade (aprendida em público)", detail: "A parada e o recomeço de 2018 fizeram da exposição a controles de exportação um dado de engenharia discutido nos conselhos de administração de toda a indústria: a ZTE é o estudo de caso que toda avaliação de risco da cadeia de suprimentos cita." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "A ZTE continua entre as quatro maiores fabricantes de equipamentos móveis do mundo e é uma gigante do acesso fixo, dentro de uma das metades de um mercado mundial dividido em dois blocos, cuja linha divisória a sua própria crise de 2018 ajudou a traçar.",
      ],
      analyst: [
        "Posta de propósito ao lado do perfil da Huawei: duas gigantes de Shenzhen, duas histórias de controle acionário, uma lição em comum e, para os leitores deste site, A resposta canônica para por que 'de onde vem o seu silício' é uma questão de projeto de rede.",
      ],
    },
  },

  // zyxel: record prose plus the complete translated profile.
  "zyxel": {
    // Card title (company name only), tagline, intro and body.
    name: "Zyxel",
    tagline: "A pioneira da era dos modems, vinda de Hsinchu.",
    intro:
      "Começada num apartamento alugado em Taoyuan em 1988 e fundada no Hsinchu Science Park em 1989 pelo Dr. Shun-I Chu, a Zyxel construiu os modems U-1496 pelos quais a geração das BBS juntava dinheiro, e depois lançou o primeiro modem integrado de dados, fax e voz do mundo (1992) e o primeiro modem ISDN analógico/digital (1995).",
    body: [
      "Listada em Taiwan em 1999 e reestruturada sob a holding Zyxel Group, ela ainda fornece CPE para operadoras e redes com segurança para pequenas e médias empresas em todas as gerações de acesso desde o modem, com o episódio dos zero-days em equipamentos em fim de vida, de 2025, mantido com honestidade no registro.",
    ],
    // Complete profile copy: facts verbatim, prose translated.
    profile: {
      slug: "zyxel",
      // Founding story (company, year and founders unchanged).
      foundings: [
        {
          company: "Zyxel",
          year: 1989,
          place: "Hsinchu Science Park, Taiwan (iniciada em 1988 num apartamento em Taoyuan)",
          founders: ["Dr. Shun-I Chu"],
          story:
            "Enquanto as startups de Taiwan se amontoavam no começo do alfabeto para ganhar lugar nas listas telefônicas, Shun-I Chu foi de propósito para o outro lado (Zyx, do fim, com 'el' de excellence, excelência) e construiu modems bons o bastante para tornar famoso o nome do contra. O desenvolvimento começou num apartamento alugado em Taoyuan em 1988; a empresa propriamente dita se instalou no Hsinchu Science Park em 1989. Para a geração das BBS, o ZyXEL U-1496 era o modem pelo qual valia juntar dinheiro: firmware atualizável, cheio de recursos e mais rápido do que a era das folhas de especificação ao redor dele. Os pioneirismos vieram em seguida (o modem integrado de dados, fax e voz em 1992, o modem ISDN analógico/digital em 1995) antes de a empresa atravessar todas as transições de acesso desde então: DSL, CPE de fibra, firewalls, Wi-Fi e acesso fixo sem fio 5G.",
          sourceNote:
            "A origem no apartamento (1988, Taoyuan) e a fundação em Hsinchu em 1989 segundo os materiais de história e de 30º aniversário da própria Zyxel; os pioneirismos mundiais de 1992 e 1995 segundo o registro da empresa; a posição do U-1496 na era das BBS segundo o registro geral do período.",
        },
      ],
      // Timeline: same years, same order.
      timeline: [
        { year: 1988, title: "O laboratório no apartamento", detail: "Shun-I Chu aluga um apartamento em Taoyuan e começa a construir um modem analógico: a história da garagem, edição taiwanesa." },
        { year: 1989, title: "A fundação em Hsinchu", detail: "A Zyxel se estabelece no Hsinchu Science Park com um punhado de engenheiros e um nome deliberadamente de trás para a frente." },
        { year: 1992, title: "Três máquinas em uma", detail: "Sai o primeiro modem integrado de dados, fax e voz do mundo, e a família U-1496 faz da Zyxel o modem dos conhecedores no mundo das BBS.", sourceNote: "Alegação de pioneirismo mundial segundo o registro da empresa." },
        { year: 1995, title: "O analógico encontra o digital", detail: "O primeiro modem ISDN analógico/digital integrado une os dois mundos do acesso numa só caixa.", sourceNote: "Segundo o registro da empresa." },
        { year: 1999, title: "Capital aberto na TSE", detail: "A Zyxel entra na Bolsa de Valores de Taiwan (3704); a fabricante de modems agora é uma fornecedora ampla de equipamentos de acesso para operadoras e empresas." },
        { year: 2016, title: "A era da holding", detail: "Uma reestruturação societária põe as empresas operacionais sob uma estrutura de holding (Unizyx, depois Zyxel Group) que abrange CPE para operadoras, redes empresariais e segurança." },
        { year: 2025, title: "A lição do fim de vida", detail: "A Zyxel se recusa a corrigir zero-days ativamente explorados em CPE em fim de vida que ainda estão em campo e ainda à venda em marketplaces: um estudo de caso que os leitores deste site precisam conhecer. A política de EOL é uma propriedade de segurança.", sourceNote: "Segundo reportagens públicas de segurança, 2025; registrado como fato." },
      ],
      // Products: names kept, descriptor words localised; descriptions translated.
      products: [
        { name: "U-1496 e a linha de modems", what: "Os modems de alta velocidade com firmware atualizável que construíram a marca na era das BBS." },
        { name: "CPE para operadoras", what: "Equipamentos terminais de DSL, fibra e acesso fixo sem fio 5G para provedores de serviço: a espinha dorsal de volume do negócio." },
        { name: "Redes empresariais e segurança", what: "Firewalls, switches, access points e gestão em nuvem Nebula para o segmento de pequenas e médias empresas." },
      ],
      // Innovations.
      innovations: [
        { title: "Pioneirismos de integração", detail: "As integrações de dados, fax e voz de 1992 e de ISDN analógico/digital de 1995 foram pioneirismos mundiais genuínos: a Zyxel juntou repetidas vezes caixas vizinhas numa só antes que o mercado esperasse isso." },
      ],
      // Markets and analyst standing, same entry counts.
      markets: [
        "CPE de acesso para operadoras e redes com segurança para pequenas e médias empresas no mundo inteiro, a partir de uma base em Hsinchu: um dos nomes da era dos modems que ainda compete em todas as gerações de acesso desde então.",
      ],
      analyst: [
        "Situada entre as contemporâneas com credenciais genuínas de pioneira na era dos modems: uma desbravadora cuja reputação da era das BBS a geração de sysops de Rodolfo Nützmann lembra em primeira mão, e cujo episódio de EOL de 2025 mantém o registro honesto.",
      ],
    },
  },
};
