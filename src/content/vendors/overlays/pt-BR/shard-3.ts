// ============================================================================
// src/content/vendors/overlays/pt-BR/shard-3.ts
// ----------------------------------------------------------------------------
// pt-BR INDUSTRY OVERLAYS, SHARD 3 of 8 (translation pass planned 2026-10-25;
// see the round 2 TRANSLATION-PLAN). One shard per translator, so parallel
// work never edits the same file. Each entry is keyed by record slug and holds
// ONLY translated prose (PartnerVendorOverlay); facts stay in partners.ts and
// profiles/*.ts. Check with: npx tsx scripts/report-industry-translation.mts --strict
//
// Records assigned to this shard (~26,963 words):
// accenture, anthropic, ashton-tate, atos, barracuda, beyondtrust, bull, clm,
// cloudshare, conviso, danresa, datacom, dxc, dynatrace, excelan, exclusive-
// networks, fortinet, gantech, genesys, it-one, microsiga, nava, ncsa, netapp,
// netscreen-juniper, niva, nokia, nutanix, nv7, offsec, openai, palo-alto,
// ping-identity, procera-networks, prodesp, prolan, sans-institute, sonda,
// stefanini, telebras-system, tivoli-systems, unentel, ungermann-bass, veeam,
// wang
// ============================================================================

import type { PartnerVendorOverlay } from "@/content/vendors/localized";

/** Translated prose for this shard's records, keyed by slug. */
export const SHARD_3: Record<string, PartnerVendorOverlay> = {
  // Accenture: record prose and the complete profile (no foundings in the English profile).
  "accenture": {
    // Name has no subtitle: carried verbatim so the record reads complete.
    name: "Accenture",
    // Card line and page prose.
    tagline: "Passou anos lutando para manter um nome, perdeu, e foi a derrota mais afortunada da história da consultoria.",
    intro:
      "A prática de consultoria cresceu dentro da Arthur Andersen, a firma de contabilidade fundada em 1913. Ela foi constituída formalmente como Andersen Consulting em 1989, sob uma holding suíça, com um arranjo que provocaria tudo o que veio depois: os consultores geravam a maior parte da receita e repassavam uma fatia dela aos contadores.",
    body: [
      "Um dos primeiros trabalhos merece estar nesta linha do tempo por si só. Em 1953, a prática conduziu para a General Electric um estudo de viabilidade que levou à instalação de um UNIVAC I, um dos primeiros usos de um computador para a administração comum de negócios, e não para ciência ou defesa. O UNIVAC aparece em outro ponto desta seção como um dos BUNCH, os cinco fabricantes que passaram os anos 1960 competindo com a IBM.",
      "A relação azedou exatamente pelo motivo esperado. Nos anos 1980, os consultores produziam a maior parte da receita enquanto a repassavam para cima, e em 1995 a Arthur Andersen criou um braço de consultoria próprio, o que os consultores viram como uma quebra do espírito do acordo, dissesse o texto o que dissesse. Em dezembro de 1997, os sócios da Andersen Consulting votaram por unanimidade dissolver a sociedade, alegando graves violações contratuais e diferenças irreconciliáveis, e levaram o caso à arbitragem na International Chamber of Commerce.",
      "A decisão, em 7 de agosto de 2000, foi contra eles na pergunta que tinham feito. O árbitro, Guillermo Gamba, concluiu que a Arthur Andersen não tinha, tecnicamente, violado o acordo de 1989. Concedeu a separação total mesmo assim, mas exigiu que a consultoria pagasse um acordo, noticiado em cerca de US$ 1 bilhão e, em alguns relatos, US$ 1,2 bilhão, e que abandonasse o nome Andersen por completo até 1º de janeiro de 2001.",
      "Ou seja, eles tinham quatro meses para rebatizar uma firma global. Um concurso interno produziu Accenture, proposto por um funcionário chamado Kim Petersen, que trabalhava em Oslo, a partir de *accent on the future*. O nome foi amplamente ridicularizado como jargão de consultor, e a mudança custou algo entre US$ 100 milhões e US$ 175 milhões para ser executada e divulgada. A firma abriu capital na New York Stock Exchange em julho de 2001, levantando cerca de US$ 1,7 bilhão a US$ 14,50 por ação.",
      "E então veio a Enron. Em 2002, a Arthur Andersen foi condenada por obstrução ligada às auditorias da Enron, e a firma desmoronou. O nome Andersen passou, em questão de meses, de uma marca de respeitabilidade profissional com oitenta anos a sinônimo de documentos triturados.",
      "O que faz desta a derrota mais afortunada da história da consultoria. Eles tinham lutado durante anos para escapar de uma controladora mantendo a marca. Perderam a discussão, pagaram um bilhão de dólares e foram obrigados a abandonar o nome a um custo enorme. Dezoito meses depois, aquilo que foram forçados a largar os teria destruído. A Forbes resumiu melhor na época: depois da Enron, qualquer nome era melhor do que Andersen.",
      "Vale ser preciso sobre o que a arbitragem de fato fez, porque é aí que está a lição. A decisão não se limitou a rebatizá-los: ela os estabeleceu como uma entidade juridicamente separada, e é por isso que a condenação criminal da Arthur Andersen não atravessou a fronteira para levar a consultoria junto. O firewall era uma condição que eles detestavam e acabou sendo o que os salvou.",
      "O que veio depois é o arco comum em escala extraordinária: centros de entrega offshore na Índia e nas Filipinas, expansão para outsourcing e processos de negócio, e crescimento de cerca de US$ 9 bilhões de receita em 1998 para aproximadamente US$ 64 bilhões em 2024, com um número de funcionários que hoje se aproxima de 800.000 pessoas em mais de 120 países.",
    ],
    // Complete translated profile: same shape, years and entries as profiles/accenture.ts.
    profile: {
      slug: "accenture",
      foundings: [],
      timeline: [
        {
          year: 1997,
          title: "Três anos, não um",
          detail:
            "A arbitragem foi pedida em dezembro de 1997, e a sentença só saiu em julho de 2000. Foram dois anos e meio de processo, durante os quais o negócio de consultoria continuou operando dentro de um arranjo que seus sócios tinham votado por unanimidade dissolver. A duração é a parte que se perde: não foi um evento, foi uma condição, sustentada pelo tempo de um ciclo normal de produto.",
        },
        {
          year: 1998,
          title: "Pago com dinheiro já retido",
          detail:
            "A partir de 1998, os pagamentos de transferência devidos para cima passaram a ser depositados em escrow em vez de entregues. Quando o acordo venceu, boa parte dele era dinheiro que a consultoria vinha segurando havia dois anos, um detalhe que muda a forma de ler o número.",
        },
        {
          year: 2001,
          title: "E então os contrataram",
          detail:
            "Em 1º de março, junto com as quitações e indenizações que concluíram a separação, os dois lados firmaram contratos de serviço pelos quais a Arthur Andersen prestaria serviços à Accenture, incluindo trabalho tributário, por seis anos, a US$ 60 milhões por ano. Depois de lutar três anos para se afastar, a primeira coisa que a nova empresa fez foi assinar um contrato de seis anos com a firma que tinha deixado.",
        },
      ],
      products: [
        { name: "Strategy and consulting", what: "O negócio de assessoria que dá nome à firma, e a metade menor: a parte que decide o que a metade maior vai depois ser paga para construir." },
        { name: "Technology services", what: "Integração de sistemas, desenvolvimento de aplicações e migração para a nuvem em escala industrial, entregues em grande parte a partir de centros offshore. É o grosso da receita e o concorrente direto das empresas indianas de serviços que aparecem em outros pontos desta linha do tempo." },
        { name: "Operations", what: "Operar processos em nome do cliente: finanças, compras, atendimento. É o negócio de outsourcing, aquele que transforma uma firma de projetos em renda recorrente." },
        { name: "Song", what: "Serviços de marketing e criação, montados a partir de dezenas de aquisições de agências. Uma consultoria comprando agências de publicidade é uma aposta de que as duas disciplinas sempre foram vizinhas, e as avaliações foram mistas." },
      ],
      innovations: [
        {
          title: "A precisão que importa sobre a decisão",
          detail:
            "A conclusão do tribunal costuma ser resumida como uma derrota, e o próprio documento da empresa a coloca de forma mais estreita: a Andersen Worldwide, a entidade coordenadora que ficava acima dos dois negócios, foi considerada culpada de violar suas obrigações materiais. Isso não equivale a uma decisão contra a firma de contabilidade, e a distinção é exatamente do tipo que importa quando um processo criminal depois tenta alcançar tudo o que está ligado a um nome.",
        },
        {
          title: "Separação como estrutura jurídica, não como sentimento",
          detail:
            "Vale repetir o ponto da entrada acima na forma mais estreita: o que protegeu a consultoria não foi distância nem reputação, mas o fato de um tribunal já a ter declarado uma entidade distinta, sem obrigações remanescentes. Separações corporativas costumam ser julgadas por fazerem sentido comercial. Esta é julgada por resistir à leitura de um promotor, e resistiu.",
        },
        {
          title: "Um nome escolhido para não significar nada",
          detail:
            "A encomenda para o novo nome era achar uma palavra sem significado em nenhuma língua, justamente para que não pudesse carregar um significado ruim. É o oposto de como marcas costumam ser construídas, e é uma resposta racional para quem acabou de descobrir com que rapidez um nome com oitenta anos de significado pode adquirir o errado.",
        },
      ],
      markets: [
        "Grandes empresas e governos em mais de cento e vinte países, numa escala em que a firma é ao mesmo tempo consultoria, integradora de sistemas, empresa de outsourcing e grupo de publicidade.",
        "Ela compete com as casas de estratégia no topo, com as empresas indianas de serviços no custo de entrega e com os braços de serviços profissionais dos próprios fabricantes de tecnologia; e, cada vez mais, com o software que seus clientes compram, já que a automação reduz as horas que ela pode faturar.",
      ],
      analyst: [
        "Avaliada como a maior firma de serviços profissionais em receita e número de funcionários, com a pergunta recorrente dos analistas sendo a margem sob a concorrência offshore, e não a demanda.",
        "A exposição estrutural que vale nomear é que um negócio que vende horas é o beneficiário mais direto da complexidade e a vítima mais direta da sua eliminação. Cada ferramenta que simplifica uma integração reduz o trabalho que ela pode cobrar, e a própria prática de assessoria da firma vende essas ferramentas. A tensão não é nova, é a mesma que toda consultoria carrega desde o primeiro estudo de sistemas, mas a velocidade com que o software hoje elimina trabalho humano é.",
      ],
    },
  },
  // Anthropic: record prose (no profile, no acquisitions).
  "anthropic": {
    // Name has no subtitle: carried verbatim so the record reads complete.
    name: "Anthropic",
    // Card line and page prose; the paper title stays in English.
    tagline: "Fundada por pessoas que saíram da OpenAI por discordar do rumo que ela tomava, e construída em torno da aposta de que pesquisa de segurança e capacidade de fronteira precisam acontecer sob o mesmo teto.",
    intro:
      "A Anthropic foi constituída em janeiro de 2021 por pessoas de alto escalão que tinham acabado de deixar a OpenAI, principalmente os irmãos Dario Amodei, VP of Research da OpenAI, e Daniela Amodei, sua VP of Safety and Policy. O motivo declarado da saída foi divergência de direção, especificamente sobre os acordos de 2019 da OpenAI com a Microsoft.",
    body: [
      "Os demais fundadores citados nos registros são Jared Kaplan, Jack Clark, Chris Olah, Ben Mann, Sam McCandlish e Tom Brown. As fontes descrevem o grupo como sete ex-funcionários da OpenAI e, ao mesmo tempo, listam oito nomes contando os Amodei; a discrepância está nas fontes e fica visível aqui, em vez de ser resolvida escolhendo uma delas.",
      "A premissa é uma afirmação técnica específica, não um slogan: não dá para fazer pesquisa útil de segurança em sistemas que você não está construindo, porque os problemas só aparecem na fronteira. Dario Amodei tinha sido coautor de 'Concrete Problems in AI Safety' em 2016, que descrevia modos de falha (efeitos colaterais, exploração insegura) que eram teóricos na época e hoje são preocupações de engenharia.",
      "O histórico de captação inclui um fato que a empresa provavelmente preferiria não carregar: da Series B de US$ 580 milhões em abril de 2022, cerca de US$ 500 milhões vieram da Alameda Research, a trading ligada a Sam Bankman-Fried, meses antes do colapso dela. Isso está no registro público e faz parte de qualquer relato honesto de como a empresa foi capitalizada.",
      "Ela é estruturada como public benefit corporation com um trust de governança, e seus produtos são os modelos Claude. Está nesta linha do tempo porque a era da IA generativa não é a história de uma única empresa, e porque um site que ensina as pessoas a checar suas fontes deve nomear aquela com a qual foi construído.",
    ],
  },
  // Ashton-Tate: record prose, ending note and successor label (no profile).
  "ashton-tate": {
    // Company kept verbatim; only the subtitle is localised (product names stay).
    name: "Ashton-Tate - dBASE II e III",
    // Card line and page prose.
    tagline: "Um banco de dados para bolões de futebol escrito em assembly 8080 virou o dBASE II, 70 por cento do mercado de bancos de dados para microcomputadores e uma das Big Three; depois, o dBASE IV saiu cedo demais.",
    intro:
      "A Ashton-Tate foi fundada em agosto de 1980 por George Tate e Hal Lashlee, dois empreendedores de software que já tinham montado três startups (uma venda por catálogo, uma distribuidora e uma rede de lojas) e que, em 1981, descobriram o Vulcan, um aplicativo de banco de dados que Wayne Ratliff, programador da Martin Marietta, tinha escrito em 1978 em assembly do Intel 8080 para CP/M, para ajudá-lo a escolher palpites de bolões de futebol, inspirado no JPLDIS, um programa Univac do Jet Propulsion Laboratory. Eles o licenciaram com um contrato de uma página e royalties generosos e o venderam como dBASE II; Ashton era o papagaio de Tate, batizado depois do fato, e os fundadores acharam que Ashton-Tate soava melhor do que Lashlee-Tate.",
    body: [
      "O dBASE II custava US$ 700 e vinha com uma garantia incomum: uma versão limitada para experimentar e um disco lacrado com a completa, que podia ser devolvido fechado em até trinta dias. Ele foi portado para o IBM PC e lançado em setembro de 1982 e, à medida que os discos rígidos cresciam, tornou-se um dos primeiros bancos de dados a vender em volume; no início de 1984, a InfoWorld estimava que a Ashton-Tate era a sexta maior empresa de software para microcomputadores do mundo, com US$ 35 milhões em vendas em 1983, e que o dBASE II detinha, segundo relatos, 70 por cento do mercado de bancos de dados para microcomputadores, com 150.000 cópias vendidas, um catálogo de 700 aplicações escritas na sua linguagem e mais de trinta livros e cursos que a ensinavam. A PC Magazine disse que essa participação causaria inveja à Procter & Gamble ou à General Motors.",
      "O dBASE III foi anunciado em maio e lançado em julho de 1984, junto com o Framework, a suíte integrada de escritório que a Forefront Corporation desenvolveu com dinheiro da Ashton-Tate; uma convenção da empresa inteira a bordo do Queen Mary, em Long Beach, apresentou os dois no início de agosto. Dias depois, em 10 de agosto de 1984, George Tate morreu de ataque cardíaco aos quarenta anos. David Cole, o chairman e CEO que os fundadores tinham contratado em 1981, saiu em outubro para a Ziff-Davis, e Ed Esber, o profissional de marketing que tinha lançado o VisiCalc, assumiu; o dBASE III 1.1 veio em novembro para corrigir os bugs da 1.0, e Ratliff, cuja relação com Esber era tumultuada, saiu meses depois.",
      "Os sete anos de Esber foram os mais prósperos e os mais controversos. O dBASE III Plus respondia por 63 por cento da receita do ano fiscal de 1987, um cliente a chamou de empresa essencialmente de um produto só, e Esber admitiu que ela era vista como retardatária tecnológica: dBASE, MultiMate e Framework eram todos aquisições, e o dBASE passou 22 meses sem atualização. O dBASE IV 1.0 saiu em outubro de 1988 com boas críticas, até os usuários encontrarem os bugs; Esber reconheceu em agosto de 1989 que ele tinha saído cedo demais, e a 1.1 só chegou em julho de 1990. A essa altura, os clones xBase (FoxBASE+ e FoxPro, e o compilador Clipper da Nantucket) já tinham os desenvolvedores.",
      "A Borland comprou a empresa em setembro de 1991, pagando em ações, e no mesmo ano a Microsoft comprou a Fox Software e a Computer Associates comprou a Nantucket: as três principais empresas xBase absorvidas em doze meses. O Departamento de Justiça depois exigiu que a Borland encerrasse seu processo contra a Fox e deixasse outros usarem a linguagem dBASE. Os verbetes de dBASE e Clipper no glossário tratam da linguagem; este registro trata da empresa que fez uma linguagem de programação a partir do banco de dados de um hobbista e a perdeu para quem a compilava melhor.",
    ],
    // Ending note (the year stays in the English record) and successor label (URL stays English).
    endedNote:
      "Vendida à Borland em setembro de 1991 numa transação inteiramente em ações; extinta em outubro de 1991. A linha dBASE continuou sob a Borland e donos posteriores.",
    successorLabel: "Borland, que comprou a Ashton-Tate em 1991 e hoje faz parte da OpenText",
  },
  // Atos: record prose (no profile, no acquisitions).
  "atos": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Atos - o parque que outra empresa opera",
    // Card line and page prose.
    tagline: "Outsourcing de TI em larga escala, onde o contrato decide a arquitetura.",
    intro:
      "A Atos é uma empresa francesa de serviços de TI que opera na escala em que uma organização entrega por inteiro a operação da sua infraestrutura. Esse arranjo muda a engenharia de um jeito pouco discutido: o formato de um sistema deixa de ser decidido por arquitetos e passa a ser decidido pelo que o contrato de serviço precificou.",
    body: [
      "Um parque terceirizado acumula um tipo específico de dívida técnica. Cada mudança custa dinheiro, então pequenas melhorias que sairiam de graça internamente são adiadas até poderem ser agrupadas, o pacote vira um projeto, e o projeto vira uma negociação. O resultado são parques que avançam em passos grandes e raros, e não de forma contínua.",
      "Nada disso é uma crítica ao modelo, que existe porque operar bem uma infraestrutura é de fato difícil e de fato pouco glamoroso. É uma constatação sobre onde as decisões realmente moram, e é isso que um engenheiro que chega a um parque assim precisa entender primeiro.",
      "O que acontece com a empresa de outsourcing quando os parques vão embora é a segunda metade da história, e a Atos a forneceu entre 2023 e 2025. A empresa chegou a valer mais de dez bilhões de euros no auge. No fim de 2024, suas ações valiam dezoito centavos, os credores tinham convertido 2,9 bilhões de euros de dívida em participação acionária, e a dívida líquida que a afundou foi atribuída à causa mais banal do setor: clientes saindo dos serviços on-premises que ela operava para nuvens que ela não operava.",
      "Seria um colapso comercial comum, não fosse o que a empresa detinha. Por meio da compra da Bull em 2014 (que tem verbete próprio aqui), a Atos construiu os supercomputadores que rodam o programa francês de dissuasão nuclear, projetou o sistema de informação de combate do exército, levava as comunicações das forças armadas e dos serviços de inteligência, e era a fornecedora oficial de tecnologia dos Jogos Olímpicos de Paris enquanto tudo isso se desenrolava. Um fornecedor nessa posição não pode simplesmente ser vendido a quem der o maior lance.",
      "Então o Estado entrou. Depois que a venda da divisão estratégica para a Airbus fracassou, o ministro das finanças anunciou que o governo compraria ele mesmo as partes sensíveis, para mantê-las sob controle exclusivo da França e longe de interesses estrangeiros. A oferta passou de um bilhão de euros de receita no perímetro para 625 milhões em valor, e depois para 410 milhões confirmados em meados de 2025 por um negócio de computação enxugado, com fechamento previsto para 2026. A Atos concluiu a venda em 31 de março de 2026, por um enterprise value de até 404 milhões de euros, e o Estado francês se tornou o único acionista da Bull.",
      "Daí saem duas leituras. A primeira fica ao lado dos verbetes da Huawei e da Cisco, que perguntam quem pode obrigar um fornecedor e registram governos restringindo fabricantes estrangeiros. Aqui está a mesma lógica vista do outro lado: um governo tratando um fornecedor nacional como ativo soberano e comprando-o da própria falência em vez de deixar as máquinas por trás da sua dissuasão mudarem de mãos. A pergunta sobre onde um fornecedor está constituído corta para os dois lados, e esta é a aparência do lado protetor.",
      "A segunda é mais discreta. Durante a maior parte de um ano, a empresa que operava os computadores da dissuasão e os sistemas das Olimpíadas pertencia a quem detinha sua dívida, porque é isso que uma conversão de credores significa. O verbete da Crypto AG pergunta quem é o dono do fornecedor. Ninguém plantou nada na Atos; a resposta simplesmente passou a ser, por um tempo, os bancos, e um Estado teve de pagar quatrocentos milhões de euros para que ela passasse a ser outra coisa.",
    ],
  },
  // Barracuda Networks: record prose (no profile, no acquisitions).
  "barracuda": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Barracuda Networks - segurança para os parques sobre os quais ninguém escreve",
    // Card line and page prose.
    tagline: "Construiu um negócio onde o orçamento é pequeno, a equipe é uma pessoa só e a ameaça é idêntica.",
    intro:
      "A Barracuda vende segurança de e-mail, de rede e de aplicações para o mercado intermediário: organizações com os mesmos atacantes de um banco e uma fração da equipe. Esse posicionamento é uma restrição real de engenharia, e não um segmento de marketing, porque um produto para um parque sem equipe dedicada de segurança precisa funcionar corretamente com as configurações padrão.",
    body: [
      "A Barracuda começou como uma solução interna. Em 2002, Dean Drako, Michael Perone e Zach Levow tocavam um provedor de internet, não encontravam um produto acessível de bloqueio de spam para o próprio negócio e construíram um, num pequeno escritório em Los Altos onde o pátio ao lado de um restaurante mexicano muitas vezes fazia as vezes de sala de reunião. O Spam and Virus Firewall saiu em 2003, e os fundadores foram o próprio primeiro cliente.",
      "A sacada comercial foi o preço, não a tecnologia. Segurança de e-mail na época era vendida a preços corporativos para compradores corporativos, o que deixava todas as organizações abaixo dessa linha com o mesmo problema e nenhum produto. A Barracuda vendia um appliance barato, que chegava configurado e fazia uma coisa só, e alcançou um mercado que tinha sido excluído pelo preço, e não mal atendido.",
      "A partir daí o portfólio se ampliou para filtragem web, load balancing, arquivamento e backup, e o histórico de controle parece um resumo de como esta indústria se financia hoje: abertura de capital na New York Stock Exchange em novembro de 2013 a dezoito dólares por ação, fechamento de capital pela Thoma Bravo em 2018 por 1,6 bilhão de dólares, e revenda à KKR em 2022.",
      "Duas trocas de controle em quatro anos merecem atenção, e não ser puladas. Um produto que atende duzentas mil organizações é uma fonte de receita previsível, e receita previsível é o que private equity compra; os clientes sentem isso como mudanças de roadmap e reorganizações do suporte que chegam por motivos nunca explicados a eles. É uma consideração operacional real na hora de escolher um fornecedor, e não aparece em nenhum datasheet.",
    ],
  },
  // BeyondTrust: record prose and the four acquisitions, index-aligned with partners.ts.
  "beyondtrust": {
    // Name has no subtitle: carried verbatim so the record reads complete.
    name: "BeyondTrust",
    // Card line and page prose.
    tagline: "Fundada como Symark em 1985, rebatizada com o nome de uma empresa que comprou em 2009 e fundida numa empresa que adotou o nome dela em 2018.",
    intro:
      "A BeyondTrust vende privileged access management: o cofre e a intermediação de credenciais administrativas, a aplicação do menor privilégio nos endpoints e o acesso remoto seguro para equipes de suporte e fornecedores. A empresa por trás do nome foi fundada em 1985 como Symark, por Bob Sommers e Doug Yarrow; em 2009, a Symark adquiriu uma empresa chamada BeyondTrust e passou a usar esse nome, e é essa linha que o registro acompanha.",
    body: [
      "O conjunto de produtos foi montado por aquisições ao longo dos anos 2010: Likewise Software em 2011, eEye Digital Security, a empresa de gestão de vulnerabilidades, em maio de 2012, e Blackbird Group em dezembro de 2012, o que deu a uma empresa de privilégios um scanner de vulnerabilidades e um conjunto de ferramentas de Active Directory ao lado do seu núcleo.",
      "O evento decisivo é a combinação de 2018. A Bomgar, a empresa de suporte remoto que Joel Bomgaars tinha começado como ExpertVNC em 2003, foi comprada pela Francisco Partners em abril de 2018; em 13 de setembro de 2018, a Bomgar anunciou que adquiriria a BeyondTrust de uma afiliada da Veritas Capital e operaria a empresa combinada sob o nome BeyondTrust, com sede em Atlanta e escritórios em Phoenix, mais de 19.000 clientes e o CEO da Bomgar, Matt Dircks, no comando. O comprador adotou o nome do comprado.",
      "Em dezembro de 2024, o serviço de suporte remoto da empresa foi o caminho de uma intrusão de nível estatal: uma chave de API do seu Remote Support SaaS foi roubada e usada para chegar ao Tesouro dos Estados Unidos, que revelou em 30 de dezembro de 2024 que documentos não classificados tinham sido acessados. O incidente pôs nas manchetes o próprio acesso de um fornecedor de acesso privilegiado, que é exatamente o risco que a categoria existe para gerir.",
      "Por que ela pertence a um registro de redes: o acesso privilegiado é onde o perímetro dos anos 1990 foi parar. A senha do administrador, a conta de serviço e o túnel de suporte do fornecedor são as credenciais que todo relatório de violação posterior cita, e as empresas que as guardam em cofre, esta e a linha da CyberArk que virou Idira, são a camada de identidade à qual as páginas de segurança deste site sempre voltam.",
    ],
    // Acquisitions: prose only, same order and length as the English list.
    acquisitions: [
      { what: "Ponte de Active Directory para Unix, Linux e macOS; o lado de autenticação do portfólio.", sourceNote: "Wikipedia: BeyondTrust (lido em 06/10/2026)." },
      { what: "Gestão de vulnerabilidades (Retina) e pesquisa; adquirida em maio de 2012.", sourceNote: "Wikipedia: BeyondTrust (lido em 06/10/2026)." },
      { what: "Gestão e auditoria de Active Directory; adquirida em dezembro de 2012.", sourceNote: "Wikipedia: BeyondTrust (lido em 06/10/2026)." },
      {
        what: "Anunciado em 13 de setembro de 2018: a Bomgar, controlada pela Francisco Partners desde abril de 2018, adquire a BeyondTrust de uma afiliada da Veritas Capital; a empresa combinada opera como BeyondTrust a partir de Atlanta, com mais de 19.000 clientes.",
        became: "A BeyondTrust de hoje: o suporte remoto da Bomgar ao lado da gestão de privilégios da Symark, sob o nome desta última.",
        sourceNote: "Francisco Partners, comunicado à imprensa de 13 de setembro de 2018 (lido em 06/10/2026).",
      },
    ],
  },
  // Bull: record prose and the complete profile (founders string kept verbatim: it is a fact field).
  "bull": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Bull - a campeã europeia da computação",
    // Card line and page prose.
    tagline: "Guerras de cartões perfurados contra a IBM nos anos 1930, o profético Gamma 60, estatização e privatização, o primeiro supercomputador exascale da Europa construído dentro da Atos, e de novo uma empresa independente a partir de 2026.",
    intro:
      "Fundada sobre as patentes de tabuladoras de um engenheiro norueguês, a Compagnie des Machines Bull passou noventa anos como a campeã nacional por excelência: enfrentou a IBM formato de cartão contra formato de cartão, sobreviveu ao controle da GE e da Honeywell, à estatização sob Mitterrand e à privatização. Dentro da Atos, sob a marca Eviden, construiu as máquinas BullSequana que movem o JUPITER, o primeiro sistema exascale da Europa; em 31 de março de 2026, a Atos concluiu sua venda ao Estado francês, que se tornou o único acionista, e a Bull voltou a ser uma empresa independente. O campo GECOS no /etc/passwd é a sua impressão digital da era Unix.",
    body: [
      "O perfil cobre as patentes de Fredrik Rosing Bull, o Gamma 3 e o Gamma 60, o Plan Calcul e a CII-Honeywell-Bull, os anos do Groupe Bull, a virada para HPC do Tera-10 à BullSequana, os anos exascale na Atos/Eviden e a venda de 2026 que fez da Bull de novo uma empresa independente.",
    ],
    // Complete translated profile: same shape, years and entries as profiles/bull.ts.
    profile: {
      slug: "bull",
      foundings: [
        {
          company: "Compagnie des Machines Bull",
          year: 1931,
          place: "Paris, França",
          // Fact field: kept exactly as the English record writes it.
          founders: ["Founded on Fredrik Rosing Bull's patents (H.W. Egli-Bull, 1931; renamed 1933)"],
          story:
            "Fredrik Rosing Bull era um engenheiro norueguês que patenteou máquinas tabuladoras de cartões perfurados para uma seguradora entre 1919 e 1921, e morreu jovem, em 1925. Suas patentes atravessaram a Europa até Paris, onde a empresa que levava seu nome se tornou a resposta do continente à IBM: as guerras de cartões perfurados dos anos 1930 aos 1950, travadas formato de cartão contra formato de cartão, foram as batalhas fundadoras da Bull. Nos noventa anos seguintes, a Bull foi o estudo de caso do que é uma campeã nacional de computação: crises, donos estrangeiros, estatização, privatização e um ato final como construtora de supercomputadores da Europa.",
        },
      ],
      timeline: [
        { year: 1952, title: "Gamma 3", detail: "A calculadora eletrônica da Bull é lançada e vende numa escala rara para a Europa dos anos 1950, cerca de 1.200 unidades, provando que um fabricante europeu conseguia transformar eletrônica em produto contra a maré da IBM." },
        { year: 1960, title: "Gamma 60", detail: "Ambicioso ao extremo: um dos primeiros computadores projetados para multiprocessamento real e unidades de programa paralelas. Profético na arquitetura, punitivo no comercial, e uma lição sobre chegar uma década adiantado." },
        { year: 1966, title: "Plan Calcul", detail: "A França responde ao domínio americano (e a uma exportação de supercomputador bloqueada) com um programa nacional, criando a CII como campeã ao lado da Bull controlada pela GE; a fusão de 1975 na CII-Honeywell-Bull reúne a indústria francesa sob um mesmo teto." },
        { year: 1970, title: "O GCOS chega com a Honeywell", detail: "A GE sai da computação e sua linha passa para a Honeywell, trazendo a herança do GE-600 e o GECOS, o sistema operacional cujo nome sobrevive, justamente, como o 'campo GECOS' em todo /etc/passwd de Unix que os leitores deste site já editaram." },
        { year: 1982, title: "Groupe Bull", detail: "Estatizada sob Mitterrand, a Bull consolida a indústria francesa (mainframes das linhas DPS e, mais tarde, PCs da Zenith Data Systems, em 1989) antes da longa privatização de 1994 a 1997, com NEC, IBM e Motorola como acionistas ao longo do caminho." },
        { year: 2005, title: "A virada para HPC", detail: "O Tera-10, para a agência francesa de energia atômica, é o sistema mais poderoso da Europa na entrega, e a Bull se reinventa como a casa de supercomputadores do continente: NovaScale, bullx e a linha BullSequana." },
        { year: 2014, title: "Na Atos, e rumo ao exascale", detail: "A Atos adquire a Bull (cerca de 620 milhões de euros); a marca ressurge sob a Eviden (2022) nas máquinas BullSequana, incluindo o XH3000 que move o JUPITER em Julich, inaugurado em 2025 como o primeiro supercomputador exascale da Europa. A missão da campeã, levada adiante sob uma nova bandeira.", sourceNote: "Marcos do negócio e do JUPITER segundo o registro público; o ano da Eviden segundo a linha do tempo do próprio site bull.com, lida em 26/10/2026." },
        // Added 26/10/2026 with the English entry: the sale that ended the Atos years.
        { year: 2026, title: "A Bull de novo", detail: "Em 31 de março de 2026, a Atos conclui a venda da Bull, suas atividades de Advanced Computing (HPC e quântica, computação empresarial e IA), ao Estado francês, por um enterprise value de até 404 milhões de euros. O Estado passa a ser o único acionista, e a Bull volta a ser uma empresa independente, separada do Atos Group.", sourceNote: "Comunicado à imprensa do Atos Group de 31 de março de 2026 e página About do bull.com, ambos lidos em 26/10/2026 (HTTP 200)." },
      ],
      products: [
        { name: "Gamma series", what: "As primeiras calculadoras e computadores eletrônicos europeus com sucesso comercial: a declaração de independência da Bull." },
        { name: "GCOS mainframes (DPS lines)", what: "O sistema operacional de herança Honeywell e as máquinas que rodaram instituições francesas e europeias por décadas." },
        { name: "BullSequana supercomputers", what: "A linha moderna, do bullx ao BullSequana XH3000, culminando no primeiro sistema exascale da Europa." },
      ],
      innovations: [
        { title: "Multiprocessamento pioneiro (Gamma 60)", detail: "Unidades de execução paralelas e fluxos de programa simultâneos em 1960: a arquitetura que os livros-texto citam como décadas à frente do seu mercado." },
        { title: "A cartilha da campeã nacional", detail: "A Bull é o caso definitivo do que o apoio estatal consegue preservar (capacidade, soberania) e do que não consegue (o timing de mercado): uma lição de política pública que todo debate sobre soberania tecnológica ainda cita." },
      ],
      markets: [
        "Desde 2026, a linhagem é de novo a Bull, uma empresa independente que pertence ao Estado francês: HPC e computação quântica europeus, computação empresarial e IA, e a era exascale. A desafiante dos cartões perfurados de 1931 agora constrói as maiores máquinas do continente.",
      ],
      analyst: [
        "Noventa anos sobrevivendo à IBM, à GE, à Honeywell, à estatização e à privatização para terminar construindo o primeiro computador exascale da Europa: persistência como modelo de negócio, e o easter egg do /etc/passwd sai de graça.",
      ],
    },
    // The state owner's name in Portuguese, with the noun Estado the pt-BR status line expects after "pertence ao" (kind "state", 26/10/2026).
    parentName:
      "Estado francês",
  },
  // CLM: record prose (no profile, no acquisitions).
  "clm": {
    // Company kept verbatim; only the subtitle is localised.
    name: "CLM - distribuição de valor agregado na América Latina",
    // Card line and page prose.
    tagline: "A camada que decide quais produtos de segurança um revendedor latino-americano consegue de fato vender.",
    intro:
      "A CLM é uma distribuidora de valor agregado que atua na América Latina (Brasil, Colômbia, Peru, Equador e Estados Unidos), especializada em segurança da informação, infraestrutura e proteção de dados. Seu portfólio, ao longo dos anos, incluiu Cisco Security, Sophos, Barracuda, A10 Networks, Arista, Huawei e outros.",
    body: [
      "O catálogo de uma distribuidora é um documento histórico útil, e o da CLM é um mapa compacto desta linha do tempo: vários dos fabricantes que ela representou têm verbetes próprios aqui, e os que não aparecem mais na lista dela, em sua maioria, deixaram de existir com esses nomes.",
      "O alcance regional é a parte que merece nota. A distribuição costuma ser organizada país a país, porque regras de importação, câmbio e relações de canal são nacionais; uma distribuidora que atua em cinco países absorve cinco conjuntos desses problemas em nome de revendedores que não conseguiriam resolvê-los sozinhos, um por um.",
      "Ela foi criada em 1993 a partir de uma cisão e de uma aquisição envolvendo o banco francês Societe Generale no Brasil: uma origem bancária, e não tecnológica, o que é menos incomum neste mercado do que parece. Distribuição precisa de capital de giro antes de precisar de engenheiros, e as empresas que conseguiam levantá-lo muitas vezes vinham de lugares que já o tinham.",
    ],
  },
  // CloudShare: record prose (no profile, no acquisitions).
  "cloudshare": {
    // Name has no subtitle: carried verbatim so the record reads complete.
    name: "CloudShare",
    // Card line and page prose.
    tagline: "Seu fundador a comprou de volta dos investidores por quatro dólares e depois a dirigiu com lucro por uma década.",
    intro:
      "A CloudShare foi fundada em Tel Aviv em janeiro de 2007 como IT Structures (a Wikipedia cita Avner Rosenan, Ophir Kra-Oz e Zvi Guterman; outras fontes, dois dos três) e se mudou para a Califórnia em 2009. Ela constrói ambientes de laboratório virtual: réplicas de sistemas on-premises complexos, rodando na nuvem, para treinamento, demonstrações e provas de conceito.",
    body: [
      "A página da equipe da própria empresa traz uma frase que a maioria das empresas não publicaria. Guterman, diz ela, comprou a CloudShare dos seus investidores por quatro dólares e depois a transformou na líder de mercado em ambientes de laboratório. A empresa tinha captado cerca de US$ 26 milhões em três rodadas. Um negócio não inventa uma história em que os próprios investidores o avaliaram em quatro dólares, e esse é o melhor motivo para acreditar nela; o desfecho é que ela foi vendida a uma gestora de ativos de Denver por valores noticiados entre US$ 60 milhões e US$ 80 milhões, depois de cerca de uma década de crescimento lucrativo e sem capital externo.",
      "Vale se demorar nessa sequência, porque ela inverte a narrativa padrão que esta linha do tempo registra sem parar. Captar, crescer rápido, vender. Aqui: captar, ver os investidores darem baixa total, comprar de volta por um valor simbólico e então crescer devagar com a própria receita até valer dezenas de milhões. O caminho do venture capital é o que vira notícia, e não é o único que funciona.",
      "O problema técnico é específico, e os leitores deste site vão reconhecê-lo na hora. Software corporativo pressupõe um data center: várias máquinas, uma topologia de rede particular, licenças, um estado instalado que leva um dia para ser alcançado. Quem já ensinou um produto assim sabe que a restrição real não é o material: é que trinta alunos precisam, cada um, de uma cópia funcional de um ambiente que leva horas para montar e que eles inevitavelmente vão quebrar. A resposta da CloudShare é tirar um snapshot de um ambiente totalmente configurado e entregar a cada usuário uma réplica independente em cerca de um minuto.",
      "A sacada do modelo de negócio é que um laboratório de treinamento e uma demonstração de vendas são o mesmo artefato. Os dois são uma réplica funcional de um sistema que o público ainda não tem, num estado que o mostra fazendo algo útil. A diferença está no que se pede ao público depois, e essa diferença está inteira no enquadramento, não na infraestrutura; é por isso que uma única plataforma atende treinamento, demos de pré-venda e provas de conceito.",
      "É aí que se aplica um argumento já feito neste site. Uma prova de conceito deveria ser um teste que pode falhar; uma demonstração deveria dar certo. Quando as duas rodam em infraestrutura idêntica, preparada pelas mesmas pessoas, a linha entre elas é uma questão de intenção, e não de montagem, e uma prova de conceito desenhada para não poder falhar é uma demonstração com outro nome. Boas plataformas de laboratório facilitam o teste honesto e o desonesto exatamente na mesma medida.",
      "Entre os clientes estão Palo Alto Networks, Atlassian, HP, Microsoft, RSA, Salesforce e ForgeRock, várias delas presentes em outros pontos desta linha do tempo, que é a condição normal da camada que este grupo documenta: as empresas de que você já ouviu falar rodam sobre empresas de que você nunca ouviu.",
      "E ela fecha o grupo onde ele começou. A Kryterion tem parceria com a CloudShare para acrescentar supervisão aos laboratórios práticos, que é a indústria convergindo para o híbrido: o realismo de uma avaliação prática, num ambiente reproduzível, com a verificação de identidade de uma prova supervisionada. Cada pedaço dessa frase é uma empresa diferente, e nenhuma delas escreve as questões.",
    ],
  },
  // Conviso: record prose (no profile, no acquisitions).
  "conviso": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Conviso - segurança de aplicações, do Brasil",
    // Card line and page prose.
    tagline: "A parte da segurança que precisa ser negociada com desenvolvedores, e não configurada num equipamento.",
    intro:
      "A Conviso é uma empresa brasileira de segurança de aplicações, que trabalha na disciplina mais distante dos equipamentos de rede de que trata a maior parte desta linha do tempo: revisar código, testar aplicações e construir práticas de desenvolvimento seguro dentro de equipes que entregam software.",
    body: [
      "Segurança de aplicações é estruturalmente mais difícil de vender do que segurança de perímetro, porque não dá para instalá-la. Um firewall é comprado, montado no rack e apontado para um problema; desenvolvimento seguro é uma mudança na forma como as pessoas trabalham, negociada com engenheiros que já têm prazos, e seu sucesso se mede em defeitos que nunca chegaram à produção.",
      "Esse problema de medição (provar o valor de algo que não aconteceu) é o mesmo que os verbetes de gateways de e-mail e de gestão de políticas desta linha do tempo descrevem, e é o motivo pelo qual toda a metade preventiva da segurança defende seu orçamento a partir de uma posição mais fraca do que a metade reativa.",
      "Fundada em 2008, ela lançou em 2010 a primeira versão do que viria a ser sua plataforma. O intervalo de dois anos é a parte interessante: a consultoria veio primeiro, e o produto foi construído a partir do que a consultoria vivia tendo de fazer à mão.",
    ],
  },
  // Danresa: record prose (no profile, no acquisitions).
  "danresa": {
    // Name has no subtitle: carried verbatim so the record reads complete.
    name: "Danresa",
    // Card line and page prose.
    tagline: "Parceira brasileira citada no canal da Fortinet.",
    intro:
      "Uma das casas brasileiras no canal da Fortinet, que é com folga o canal de segurança mais populoso do país. Essa densidade é, ela própria, o fato: um fabricante com muitos parceiros tem concorrência de preço dentro do próprio canal, e a experiência do cliente varia mais de parceiro para parceiro do que de produto para produto.",
    body: [
      "A lista de fabricantes é a parte interessante, e é mais longa do que costuma ser a de um parceiro de canal: Fortinet, Sophos, Aruba, NSFocus, Carbon Black, Tenable, Forcepoint e Nozomi, com o nível Platinum na Fortinet e a certificação de engenharia de nível mais alto que o acompanha.",
      "Carregar oito fabricantes é uma escolha deliberada e desconfortável. Cada um exige certificações, compromissos de receita e engenheiros que se mantenham atualizados, então a amplitude é paga continuamente, e não adquirida de uma vez. A recompensa é que a recomendação não é imposta pelo catálogo (uma empresa com um produto só descobre que todo cliente precisa daquele produto), e o custo é que ninguém na equipe pode se especializar numa coisa só.",
      "A DANRESA se apresenta como uma casa de segurança e redes, e não como revenda, e a lista de fabricantes por trás dessa afirmação é a substância: Fortinet com FortiGate, ao lado de Sophos, Aruba, NSFocus, Nozomi, Forcepoint, Tenable e Carbon Black. A Nozomi é o indício: é um fabricante de monitoramento de tecnologia operacional, e carregá-la significa que a empresa trabalha em ambientes industriais, onde um controle de segurança que falha fechado interrompe um processo físico, e não uma aplicação.",
      "A Fortinet a classifica no nível Expert como integradora e provedora de serviços gerenciados de segurança, com um conjunto de especializações excepcionalmente amplo, e também como parceira Preferred Services e de suporte técnico. Essa última designação é a que vale entender: significa que o fabricante encaminha trabalho de suporte ao parceiro, uma relação diferente e mais difícil do que a revenda, porque a empresa passa a responder pelo produto em vez de vendê-lo.",
      "A oferta própria é organizada como um provedor gerenciado organiza a sua: acesso remoto, firewall de nova geração e endpoint juntos, proteção de aplicações web, gestão de dispositivos móveis, relatórios centralizados e suporte 24x7x365. Suporte ininterrupto é a linha que separa uma revenda de um negócio de serviços, já que exige gente suficiente para preencher uma escala de plantão, e não gente suficiente para fechar uma venda.",
    ],
  },
  // Datacom: record prose and the complete profile (founders and quoted words kept verbatim).
  "datacom": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Datacom - a fabricante brasileira de equipamentos de rede",
    // Card line and page prose.
    tagline: "O verbete da casa: equipamentos para operadoras, GPON e um sistema operacional nacional, projetados e fabricados no Rio Grande do Sul desde 1998.",
    intro:
      "Todas as outras empresas desta enciclopédia precisaram ser importadas para o Brasil; a Datacom cresceu aqui. Suas linhas próprias de switching e GPON, sobre o próprio DmOS, sustentaram o boom da fibra dos provedores regionais do país: uma prova viva de que soberania de rede pode ser construída, nascida da mesma tradição de engenharia brasileira que, uma década antes, produziu a Cyclades.",
    body: [
      "O perfil cobre a fundação em 1998, os anos de carrier Ethernet do DmSwitch, o DmOS, a onda GPON dos provedores, o fator estrutural do financiamento nacional dito com todas as letras e a marca de um quarto de século.",
    ],
    // Complete translated profile: same shape, years and entries as profiles/datacom.ts.
    profile: {
      slug: "datacom",
      foundings: [
        {
          company: "Datacom",
          year: 1998,
          place: "Porto Alegre, Rio Grande do Sul, Brasil",
          // Fact field: kept exactly as the English record writes it.
          founders: ["A group of gaúcho engineers"],
          story:
            "Todas as outras empresas desta enciclopédia precisaram ser importadas para o Brasil; a Datacom é a que cresceu aqui. Fundada em 1998 em Porto Alegre por um grupo de engenheiros gaúchos, e hoje sediada na vizinha Eldorado do Sul, a Datacom se propôs a provar o improvável: que equipamentos de rede de nível de operadora (os switches, o transporte óptico e, mais tarde, a camada de acesso GPON) podiam ser projetados e fabricados no país, com sistema operacional de rede próprio, e se sustentar num mercado que os gigantes globais tratavam como destino de exportação. Um quarto de século depois, é a maior fabricante brasileira de equipamentos de rede de origem nacional, o que a torna algo mais raro do que um fornecedor: uma prova de existência.",
          sourceNote: "Ano de fundação, origem em Porto Alegre e \"group of gaúcho engineers\" (grupo de engenheiros gaúchos) segundo datacom.com.br; a empresa está hoje situada em Eldorado do Sul, RS.",
        },
      ],
      timeline: [
        { year: 1998, title: "Fundada no Sul", detail: "A Datacom começa no polo tecnológico do Rio Grande do Sul, parte da mesma tradição de engenharia brasileira que, uma década antes, tinha levado a Cyclades de uma garagem em São Paulo ao Vale do Silício, mirando os equipamentos de transporte e acesso que as operadoras brasileiras importavam." },
        { year: 2005, title: "Os anos de carrier Ethernet", detail: "A linhagem DmSwitch leva a Datacom para carrier Ethernet e redes metropolitanas: switching projetado no Brasil nos backbones de operadoras brasileiras, a primeira prova da empresa de que 'fabricante nacional' podia significar mais do que montagem." },
        { year: 2012, title: "Um sistema operacional nacional", detail: "O DmOS consolida o portfólio sobre o sistema operacional de rede da própria Datacom: a forma mais profunda de independência que um fabricante de redes pode reivindicar, e a que separa fabricantes de integradores." },
        { year: 2016, title: "A onda GPON", detail: "O boom da fibra no Brasil passa desproporcionalmente por milhares de provedores regionais (os provedores que cabearam o interior enquanto os gigantes se concentravam nas capitais), e as linhas de OLT e ONU da Datacom se tornam itens básicos nacionais dessa expansão." },
        { year: 2020, title: "A vantagem estrutural, dita com todas as letras", detail: "O financiamento à indústria nacional (linhas de crédito ligadas ao BNDES que historicamente favoreceram equipamentos fabricados no Brasil) dá ao equipamento nacional uma vantagem real nas compras de operadoras e de projetos públicos. É a política industrial funcionando como foi desenhada, e parte do motivo pelo qual um fabricante nacional de redes é viável.", sourceNote: "Mecanismos de financiamento com conteúdo nacional do BNDES/FINAME segundo o registro público da política industrial brasileira." },
        { year: 2024, title: "A marca de um quarto de século", detail: "A Datacom segue como a fabricante de redes de referência do Brasil: linhas de acesso, transporte e switching sob o DmOS, exportações para a América Latina e uma resposta permanente à pergunta sobre se o país consegue construir a própria camada de rede." },
      ],
      products: [
        { name: "Acesso GPON (linhas OLT/ONU)", what: "A maquinaria de fibra até a casa do boom dos provedores regionais: a camada de acesso do interior do país, projetada no Brasil." },
        { name: "DmSwitch e carrier Ethernet", what: "Switching metropolitano e de operadora: a linhagem que estabeleceu a Datacom nos backbones das operadoras." },
        { name: "DmOS", what: "O sistema operacional de rede da própria empresa em todo o portfólio: a camada de soberania, em software." },
      ],
      innovations: [
        { title: "A prova de existência", detail: "A contribuição da Datacom é a própria demonstração: um fabricante nacional com escolhas próprias de silício, sistema operacional próprio e roadmap próprio, sobrevivendo por décadas num mercado que os fabricantes globais consideram deles." },
        { title: "Feito para os provedores", detail: "Projetar para os milhares de pequenos provedores regionais do Brasil (faixas de preço, suporte em português, compatibilidade com financiamento) é uma disciplina de produto em si, e a Datacom fez disso uma franquia." },
      ],
      markets: [
        "Operadoras brasileiras, redes do setor público e, acima de tudo, o mercado de provedores regionais que levou fibra ao interior do país, com exportações para a América Latina. O fabricante da terra natal deste registro.",
      ],
      analyst: [
        "A presença global da Datacom é modesta e sua importância nacional não é: ela sustenta o argumento de que a soberania de rede pode ser construída, o mesmo argumento que se desenrola em escala continental em outros pontos desta enciclopédia.",
        "Para este registro, é também geografia pessoal: a tradição de engenharia brasileira que passa pelos fundadores paulistas da Cyclades e pela carreira contada neste site passa também pelo Rio Grande do Sul.",
      ],
    },
  },
  // DXC Technology: record prose (no profile, no acquisitions).
  "dxc": {
    // Company kept verbatim; only the subtitle is localised.
    name: "DXC Technology - o que uma fusão de negócios de serviços herda",
    // Card line and page prose.
    tagline: "Formada a partir de duas grandes organizações de serviços de TI e, portanto, a partir dos contratos delas.",
    intro:
      "A DXC Technology é uma empresa multinacional de serviços de TI formada pela combinação de grandes negócios de serviços já existentes. Fundir organizações de serviços não se parece com fundir empresas de produtos: o que se adquire não é um catálogo, mas uma carteira de contratos de longa duração, cada um com seu próprio parque herdado, seu modelo de equipe e um conjunto de promessas feitas anos antes.",
    body: [
      "A DXC foi montada, e não fundada. A Hewlett Packard Enterprise separou seu negócio Enterprise Services em 31 de março de 2017, a CSC se fundiu com uma subsidiária da DXC no dia seguinte, e a empresa combinada começou a ser negociada em 3 de abril, com cerca de 25 bilhões de dólares de receita anual esperada e quase seis mil clientes em setenta países.",
      "Vale nomear o mecanismo, porque ele explica o formato do resultado. Foi um Reverse Morris Trust, uma estrutura que permitiu à HPE separar um negócio sem impostos fundindo-o em outra empresa, deixando os ex-acionistas da CSC com 49,9 por cento e os acionistas da HPE com 50,1 por cento. Ninguém comprou ninguém. Dois grupos de acionistas acabaram donos de uma única empresa, e a DXC também assumiu dívidas e passivos do segmento separado.",
      "O que isso produziu foi uma empresa ao mesmo tempo nova e muito antiga. A CSC datava de 1959, e o parque de serviços da HPE continha contratos e centros de entrega herdados da EDS, de modo que um negócio constituído em 2017 ficou imediatamente responsável por parques de mainframe e acordos de outsourcing mais antigos do que a maioria dos seus funcionários. O próprio slogan de lançamento admitia isso: nova, mas não nascida ontem.",
      "Até o nome reflete a montagem. Um FAQ interno precisou avisar os funcionários de que DXC não é sigla: não significa nada, e o X pretende sugerir um multiplicador de força. Esse documento chegou ao público por um fórum anônimo de pessoas que tinham perdido o emprego.",
      "A leitura é sobre quem carrega o risco de integração. Grandes empresas de serviços de tecnologia hoje são construídas por engenharia financeira tanto quanto por crescimento, e um cliente cujos sistemas são operados sob um contrato assinado com uma das antecessoras vive a fusão como equipes de conta trocadas, condições renegociadas e ferramentas migradas. A estrutura é desenhada em torno do tratamento tributário e das proporções entre acionistas; as consequências operacionais caem sobre parques que ninguém consultou.",
    ],
  },
  // Dynatrace: record prose (no profile, no acquisitions).
  "dynatrace": {
    // Name has no subtitle: carried verbatim so the record reads complete.
    name: "Dynatrace",
    // Card line and page prose.
    tagline: "Reescreveu a plataforma inteira do zero sob controle de private equity, o que não é como essa história costuma terminar.",
    intro:
      "A dynaTrace Software GmbH foi fundada em Linz, na Áustria, em 2005, por Bernd Greifeneder com Sok-Kheng Taing e Hubert Gerstmayr; alguns relatos acrescentam Alois Reitbauer, e a data de fundação aparece tanto como 2 de fevereiro quanto como 1º de julho. O problema que ela se propôs a resolver era específico: as aplicações tinham ficado tão distribuídas que ninguém conseguia dizer qual componente estava lento.",
    body: [
      "O PurePath, patenteado em 2006, é a contribuição técnica. Ele rastreava uma única transação de ponta a ponta, do navegador ao banco de dados, por todos os serviços que ela tocava, no nível do código, com overhead baixo o bastante para ficar ligado em produção. Essa última parte é a difícil. Um rastreamento que só é seguro em ambiente de teste fala sobre um ambiente de teste, e as falhas interessantes não acontecem lá.",
      "A Bain Capital Ventures investiu um ano depois da fundação e a Bay Partners três anos depois, ficando juntas com cerca de dois terços da empresa. Em 2011, a Compuware a comprou por US$ 256 milhões, quando ela tinha cerca de 180 funcionários e mais de 500 clientes. Dois dos fundadores aproveitaram a saída; Greifeneder ficou e, pelo próprio relato, o objetivo nunca tinha sido o dinheiro.",
      "Então veio 2014, a parte que justifica o verbete. A Thoma Bravo comprou a Compuware por cerca de US$ 2,4 bilhões e separou o negócio de monitoramento como empresa independente. A lembrança do próprio Greifeneder é direta sobre o choque de culturas: o novo dono era especializado em negócios com um bom produto e uma liderança ineficaz, e não estava acostumado a esperar entre o investimento e o resultado. Os hábitos de startup dele não eram o que tinham comprado.",
      "O que aconteceu em seguida é o oposto do que costumam acusar o private equity de produzir. Ele passou três meses com seus melhores profissionais de produto e voltou com a recomendação de recomeçar: uma equipe separada, uma plataforma inteiramente nova, escrita do zero, com o argumento de que a ruptura da nuvem era uma oportunidade para disparar na frente, e não um problema a sobreviver. Eles toparam. Uma empresa sob controle financiado por dívida, da qual se esperava retorno, reconstruiu o produto do nada. Ela abriu capital na New York Stock Exchange em agosto de 2019 a US$ 16 por ação e subiu 49% na estreia.",
      "E aqui ela inverte um padrão que esta linha do tempo registra em outro ponto. A USRobotics venceu três vezes com protocolos proprietários e perdeu a vantagem cada vez que chegou um padrão. A Dynatrace tinha uma patente de rastreamento distribuído desde 2006 e depois contribuiu com o OpenTelemetry, o W3C Trace Context, o Keptn e o OpenFeature, os padrões abertos que generalizam exatamente o que o PurePath fazia de forma privada. Diante da mesma situação, uma empresa defendeu o fosso e a outra ajudou a cavar o canal. Qual delas está certa depende de a sua vantagem ser o mecanismo ou aquilo que você constrói em cima dele.",
      "A Thoma Bravo reduziu sua participação entre 2019 e 2024, deixando uma empresa de capital pulverizado cuja receita chegou a US$ 1,70 bilhão no ano fiscal encerrado em março de 2025, ante US$ 1,43 bilhão no ano anterior. É a quinta aparição da Thoma Bravo nesta linha do tempo, depois de Sophos, LANDESK, Ping e CompTIA: um lembrete de que um punhado de firmas moldou mais o controle acionário desta indústria do que qualquer um dos fabricantes.",
      "A sede foi para Massachusetts, mas a engenharia ficou em Linz, uma cidade universitária da Alta Áustria que não está na lista de ninguém dos lugares de onde saem plataformas de software, e é justamente esse o ponto.",
    ],
  },
  // Excelan: record prose (no profile, no acquisitions).
  "excelan": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Excelan - TCP/IP numa placa, antes de ser óbvio",
    // Card line and page prose.
    tagline: "Vendia TCP/IP para empresas em 1982, o que exigia acreditar que o protocolo de uma rede de pesquisa tinha futuro comercial.",
    intro:
      "A Excelan fabricava placas de rede que rodavam a pilha TCP/IP na própria placa, tirando esse trabalho de um processador host que, no início dos anos 1980, mal podia arcar com ele. Fundada em 1982 e incorporada à Novell em 1989, toda a sua existência cabe na janela em que ainda não era óbvio qual suíte de protocolos as empresas iam adotar como padrão.",
    body: [
      "A Excelan fazia placas e software de rede TCP/IP para estações de trabalho e PCs numa época em que essa combinação era incomum: a maior parte das redes locais da época era proprietária, e o TCP/IP ainda era sobretudo um protocolo de pesquisa e de governo, não de escritório. Vendê-lo comercialmente significava apostar que o protocolo usado pelas universidades se tornaria o protocolo usado pelas empresas.",
      "A aposta estava certa, e a empresa não pôde colher sozinha. A Novell adquiriu a Excelan em 1989, como noticiaram o New York Times em 24 de março e o Los Angeles Times três dias depois, e incorporou a tecnologia a uma empresa cuja própria pilha de rede era IPX, e não IP.",
      "É nisso que vale se demorar. A Novell dominou as redes locais no início dos anos 1990 com um protocolo de desenho próprio, e sua resposta ao TCP/IP foi comprar conhecimento em vez de construí-lo, o que comprou tempo, e não uma posição, porque o protocolo que venceu foi o que não tinha dono. A aquisição parece astuta em 1989 e, em retrospecto, parece uma proteção contra o futuro, e foi as duas coisas.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A Excelan foi adquirida pela Novell em junho de 1989.",
  },
  // Exclusive Networks: record prose (no profile, no acquisitions).
  "exclusive-networks": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Exclusive Networks - distribuição com quinhentos engenheiros",
    // Card line and page prose; the company's own slogan stays in English.
    tagline: "Distribuidora francesa especializada em cibersegurança, listada na Euronext Paris em 2021 e com o capital fechado de novo a partir de 2024.",
    intro:
      "A Exclusive Networks foi fundada em 2003 perto de Paris e se tornou a maior distribuidora especializada em tecnologia de cibersegurança, com vendas brutas de 2,9 bilhões de euros em 2020, escritórios em mais de quarenta países e entregas em mais de cento e setenta.",
    body: [
      "Um número do próprio material de listagem explica o que significa distribuição especializada: 2.200 funcionários, dos quais mais de quinhentos são engenheiros. Uma distribuidora generalista movimenta produto e concede crédito; cerca de um quarto da equipe desta empresa existe para fazer uma tecnologia funcionar num mercado onde o fabricante não tem ninguém. A expressão da própria empresa para o modelo é global scale, local sale.",
      "Essa é a camada que a maior parte da documentação dos fabricantes nunca menciona e da qual todo fabricante depende. Um fabricante de segurança que entra num país novo não abre um escritório; ele contrata um distribuidor que já tem os parceiros, as relações de crédito, o suporte no idioma local e os engenheiros capazes de responder a uma pergunta na hora certa.",
      "O histórico de controle é uma pequena lição sobre para que serve uma listagem em bolsa. Fundos da Permira eram donos dela, abriram seu capital na Euronext Paris em setembro de 2021 a uma avaliação perto de 1,8 bilhão de euros, mantiveram cerca de 55% e, a partir de 2024, se juntaram à Clayton Dubilier & Rice para recomprar as ações em circulação e fechar o capital de novo. A listagem não foi uma saída, mas uma etapa, e a empresa passou três anos na bolsa entre dois períodos de controle privado.",
    ],
  },
  // Fortinet: record prose and the complete profile (company field and founders kept verbatim; first person kept).
  "fortinet": {
    // Name has no subtitle: carried verbatim so the record reads complete.
    name: "Fortinet",
    // Card line and page prose.
    tagline: "Fundada pelo homem que já tinha construído uma empresa de firewall, com o mesmo argumento levado mais longe.",
    intro:
      "Ken Xie fundou a Fortinet em 2000 com o irmão, Michael. Ele tinha sido cofundador da NetScreen em 1996 e saído dela, e a NetScreen aparece em outro ponto desta linha do tempo como a startup cujos ex-funcionários semearam uma parcela notável da indústria de segurança, sendo a Fortinet a primeira delas.",
    body: [
      "O argumento da NetScreen era que o firewall pertence a um silício feito sob medida, e não a um processador de uso geral. A Fortinet levou isso adiante: se você já vai construir silício próprio, construa-o para fazer tudo de que o tráfego precisa numa única passada (firewall, antivírus, prevenção de intrusão, filtragem web), em vez de encadear caixas separadas que reinspecionam, cada uma, os mesmos pacotes.",
      "Isso virou unified threat management, e o FortiASIC é o motivo pelo qual a promessa era crível, e não marketing. Inspecionar conteúdo em line rate é de fato difícil em hardware comum, e é por isso que os concorrentes que vendiam software em servidores tinham de escolher entre funcionalidades e throughput.",
      "A consequência comercial importou mais do que a técnica. O UTM tornou a segurança de verdade acessível para organizações que não podiam montar uma equipe de segurança, e o crescimento da Fortinet veio em boa parte do mercado intermediário e do canal, e não de desalojar os fornecedores estabelecidos nas grandes empresas.",
      "Desde então, o portfólio foi muito além do firewall, para switching, wireless, endpoint, SIEM e SD-WAN, amarrados por uma malha de gerenciamento: a mesma proposta de um fabricante para a pilha inteira que a Cisco fez em redes, aplicada à segurança.",
    ],
    // Complete translated profile: same shape, years and entries as profiles/fortinet.ts.
    profile: {
      slug: "fortinet",
      foundings: [
        {
          // Fact field: kept exactly as the English record writes it.
          company: "Fortinet (born Appligation, then ApSecure)",
          year: 2000,
          place: "Sunnyvale, Califórnia",
          founders: ["Ken Xie", "Michael Xie"],
          story:
            "Ken Xie já tinha construído o primeiro appliance de firewall/VPN baseado em ASIC e fundado a NetScreen quando saiu, em 2000, para recomeçar com o irmão Michael, engenheiro vindo da NetScreen e da Milkyway Networks. Constituída em outubro de 2000 (primeiro como Appligation, depois ApSecure e, por fim, Fortinet, de 'Fortified Networks'), a empresa apostou que as funções de segurança deviam andar juntas, em silício feito sob medida, na velocidade da rede. O FortiGate que veio em seguida reuniu firewall, VPN, antivírus e prevenção de intrusão numa só caixa acelerada por ASIC e deu nome a uma categoria: unified threat management. Ken é CEO desde o primeiro dia; Michael, presidente e CTO, ainda comanda a tecnologia.",
        },
      ],
      timeline: [
        { year: 2000, title: "O segundo ato depois da NetScreen", detail: "Outubro de 2000: os irmãos Xie constituem a empresa em Sunnyvale em pleno estouro da bolha pontocom e levantam US$ 13 milhões em capital privado até o início de 2003, com base num protótipo funcional e num argumento de desempenho: segurança integrada sem a penalidade de throughput.", sourceNote: "Biografias do conselho no site de RI da Fortinet; Wikipedia." },
        { year: 2002, title: "O FortiGate chega ao mercado", detail: "Maio de 2002: os primeiros appliances FortiGate são lançados, com firewall, VPN, antivírus e prevenção de intrusão consolidados em hardware FortiASIC sob o FortiOS. Antispam e filtragem web vêm em seguida, e a categoria de unified threat management se forma em torno do produto." },
        { year: 2009, title: "IPO como líder de UTM", detail: "Novembro de 2009: a Fortinet abre capital na NASDAQ como FTNT, levantando cerca de US$ 156 milhões, com a IDC atribuindo a ela mais de 15 por cento do mercado de unified threat management. A startup discreta da época da crise chega como líder de categoria." },
        { year: 2015, title: "A Meru e a entrada em wireless", detail: "A aquisição da Meru Networks traz o Wi-Fi corporativo para o portfólio, o primeiro grande passo para crescer do firewall para toda a borda da rede: switching, access points e, mais tarde, SD-WAN sobre o mesmo FortiOS." },
        { year: 2016, title: "O Security Fabric", detail: "Abril de 2016: a Fortinet formula o Security Fabric, com FortiGate, endpoints, acesso, nuvem e terceiros compartilhando telemetria e política como um único sistema. Ele se torna a ideia organizadora e o discurso de vendas da empresa na década." },
        { year: 2019, title: "Completando a prateleira do SOC", detail: "A Bradford Networks (2018) tinha trazido controle de acesso à rede como FortiNAC; o fim de 2019 acrescenta a enSilo (detecção em endpoints, que vira FortiEDR) e a CyberSponse (SOAR), e o lado de operações do fabric se completa." },
        { year: 2024, title: "A Lacework e o avanço cloud-native", detail: "Junho de 2024: a Fortinet adquire a empresa de segurança em nuvem Lacework, incorporando um CNAPP ao seu discurso de SASE universal e nuvem; a especialista em prevenção de perda de dados Next DLP vem em agosto." },
        { year: 2026, title: "O programa NSE volta", detail: "15 de julho de 2026: a Fortinet aposenta os nomes de certificação FCF / FCA / FCP / FCSS e restaura a progressão NSE 1-8 em oito níveis, transpondo as certificações ativas: o arco de treinamento que a página de credenciais deste site registra em primeira mão." },
        { year: 2024, personal: true, title: "O meu capítulo", detail: "A escada NSE subida desde 2022, Fortinet Certified Trainer desde 2024: o currículo FCP ministrado como o terceiro pilar de ensino do portfólio." },
      ],
      products: [
        { name: "FortiGate", what: "A família principal de firewalls de nova geração, de unidades de mesa a chassis e edições virtuais e em nuvem, todas rodando FortiOS com aceleração FortiASIC/série NP." },
        { name: "FortiOS", what: "O sistema operacional único de todo o portfólio: firewall, SD-WAN, ZTNA, switching e controle de Wi-Fi convergidos num só modelo de política." },
        { name: "FortiManager e FortiAnalyzer", what: "Gerenciamento centralizado e logs/análise para frotas de FortiGates: a dupla operacional ensinada em toda trilha Fortinet." },
        { name: "FortiGuard Labs", what: "O motor de inteligência de ameaças e serviços de segurança por trás das assinaturas: assinaturas de IPS, filtragem web, antivírus e feeds de detecção assistida por IA." },
      ],
      innovations: [
        { title: "Segurança em silício", detail: "ASICs feitos sob medida (FortiASIC e, depois, as linhas NP e CP) executando trabalho de segurança em wire speed: a tese fundadora, e ainda o argumento de desempenho por dólar por trás do FortiGate." },
        { title: "Unified threat management", detail: "A consolidação de firewall, VPN, antivírus, IPS e filtragem num só appliance: a categoria que o FortiGate praticamente criou e que o levou ao IPO de 2009." },
        { title: "O Security Fabric", detail: "O portfólio inteiro de um fabricante se comportando como um único sistema que compartilha telemetria: consolidação como arquitetura, e não como pacote." },
      ],
      markets: [
        "A Fortinet é um dos fabricantes de segurança mais implantados do planeta, ancorada no domínio do FortiGate em volume de unidades, das filiais aos data centers, com um segundo negócio de crescimento rápido em redes seguras (switching, Wi-Fi, SD-WAN), além de segurança de OT e, desde 2024, um avanço mais profundo em segurança cloud-native.",
      ],
      analyst: [
        "A IDC atribuiu à Fortinet a maior participação em unified threat management no IPO de 2009; nos anos seguintes, a empresa tem sido presença constante entre os líderes das avaliações de analistas de network firewall e SD-WAN, com o discurso de consolidação do Security Fabric no centro dessa posição.",
      ],
    },
  },
  // Gantech: record prose (no profile, no acquisitions).
  "gantech": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Gantech - segurança em nuvem, pelas suas siglas",
    // Card line and page prose; category acronyms stay as the field writes them.
    tagline: "Empresa brasileira de segurança da informação especializada em proteção de workloads e de postura em nuvem.",
    intro:
      "A Gantech é uma empresa brasileira de segurança da informação cuja prática de nuvem é organizada pelas siglas de categoria que a área produziu: CNAPP, CSPM, CWP, WAAS e CIEM, ao lado de segurança de código.",
    body: [
      "Essa lista é um artefato útil em si. A segurança em nuvem se fragmentou em categorias com nome mais depressa do que a maioria das áreas, e cada sigla marca um ponto em que um controle existente se revelou intransferível: a gestão de postura existe porque uma configuração errada não é uma vulnerabilidade, a proteção de workloads porque um contêiner efêmero não é um servidor, e a gestão de permissões porque uma identidade numa conta de nuvem não é um usuário num diretório.",
      "Uma empresa que organiza sua prática desse jeito está descrevendo um mapa real do problema, e também está herdando um vocabulário que muda a cada poucos anos, o que é um custo de manutenção à parte.",
    ],
  },
  // Genesys: record prose, three acquisitions (index-aligned) and the complete profile.
  "genesys": {
    // Name has no subtitle: carried verbatim so the record reads complete.
    name: "Genesys",
    // Card line and page prose.
    tagline: "Dois filhos de emigrantes soviéticos se conheceram num jogo de cartas e decidiram que a ligação telefônica e a ficha do cliente deviam chegar juntas.",
    intro:
      "A Genesys Telecommunications Laboratories foi fundada em outubro de 1990 por Gregory Shenkman e Alec Miloslavsky. Os pais deles tinham fugido da União Soviética em 1980 e se instalado na comunidade russa de San Francisco; os dois se conheceram anos depois num jogo de cartas. O capital inicial foram US$ 150.000 em empréstimos das famílias, e o primeiro escritório ficava em Daly City.",
    body: [
      "Miloslavsky tinha estudado engenharia civil em Berkeley e trabalhado para Steve Jobs na Pixar, o que liga esta página ao verbete da Apple nesta linha do tempo, onde está registrada a compra, por Jobs, da divisão de computação gráfica da Lucasfilm. Shenkman tinha sido vendedor de telecomunicações. Nenhuma das duas combinações produz, de forma óbvia, uma empresa de contact center.",
      "A ideia era pequena, precisa, e acabou sendo enorme. Quando uma ligação chegava a uma empresa em 1990, o sistema telefônico conhecia o número e o sistema de computador conhecia o cliente, e os dois nunca conversavam. Então um atendente atendia, perguntava quem você era e digitava, toda vez, em toda ligação. A integração computador-telefonia uniu esses dois sistemas, e o resultado visível foi o screen pop: o telefone toca e a ficha do cliente já está aberta.",
      "A Genesys lançou o T-Server em 1991 para fazer isso e depois foi além do pop, roteando ligações por habilidades, e não para quem estivesse livre, o que significa que a pergunta deixa de ser *há alguém disponível* e passa a ser *a pessoa certa está disponível*. Essa mudança de enquadramento é todo o desenho moderno de contact center, e o software ficava como middleware entre os switches que o cliente já tinha.",
      "Ela abriu capital na NASDAQ em junho de 1997 como GCTI, levantando US$ 45 milhões a US$ 18 por ação. A Alcatel então a comprou por US$ 1,5 bilhão, negócio anunciado em 1999 e concluído em janeiro de 2000, conforme a fonte que se lê, e ela sumiu dentro de um gigante de telecomunicações por doze anos.",
      "A Alcatel-Lucent é uma segunda ligação com esta linha do tempo. A Riverstone Networks, um capítulo de carreira deste site, teve seus ativos comprados pela Lucent em 2006 e absorvidos pela Alcatel-Lucent quando as duas se fundiram naquele ano. Assim, um negócio de metro Ethernet saído de um spin-off da Cabletron e uma empresa de roteamento de chamadas saída de uma garagem em Daly City acabaram dentro da mesma controladora franco-americana por caminhos inteiramente diferentes.",
      "Em fevereiro de 2012, a Permira e a TCV compraram a Genesys da Alcatel-Lucent por US$ 1,5 bilhão, o mesmo valor que a Alcatel tinha pago doze anos antes. Uma empresa pode valer exatamente o que custou, uma dúzia de anos depois, e esse fato diz mais sobre quem a controlava do que sobre o que ela construiu.",
      "A independência produziu a virada para a nuvem que a controladora não tinha produzido. A Hellman & Friedman ficou com uma participação de US$ 900 milhões em 2016, a uma avaliação de US$ 3,8 bilhões, a Interactive Intelligence foi comprada no mesmo ano por US$ 1,4 bilhão, e a receita passou de US$ 2 bilhões em 2022. A empresa que começou fazendo um telefone conversar com um banco de dados hoje se descreve em termos de orquestração e IA, que é o mesmo problema reformulado: a interação e o contexto sobre ela não deviam chegar separados.",
    ],
    // Acquisitions: prose only, same order and length as the English list.
    acquisitions: [
      { what: "Uma plataforma de contact center em nuvem, comprada no mesmo ano em que a Hellman & Friedman ficou com sua participação.", became: "A base da linha em nuvem que levou a empresa a passar de US$ 2 bilhões de receita." },
      { what: "Análise da jornada do cliente: prever o que um cliente está tentando fazer antes que ele diga." },
      { what: "Engajamento digital, comprado da LogMeIn.", became: "Parte do conjunto de produtos digitais e voltados para IA." },
    ],
    // Complete translated profile: same shape, years and entries as profiles/genesys.ts.
    profile: {
      slug: "genesys",
      foundings: [
        {
          company: "Genesys Telecommunications Laboratories",
          year: 1990,
          place: "Daly City, Califórnia",
          founders: ["Gregory Shenkman", "Alec Miloslavsky"],
          story:
            "Constituída em 1º de outubro. O nome remete a gênese, e a ambição era mais estreita do que o nome: fazer o sistema telefônico e o banco de dados de clientes trocarem uma informação no momento em que uma ligação se completa.",
        },
      ],
      timeline: [
        { year: 1991, title: "T-Server", detail: "O middleware que fez a conexão, posicionado entre os switches que o cliente já tinha e as aplicações nas mesas dos atendentes." },
        { year: 1995, title: "Fora da Califórnia", detail: "Uma subsidiária no Reino Unido e, no ano seguinte, uma na Rússia: expansão internacional precoce para uma empresa de cinco anos e ainda de capital fechado." },
        { year: 1997, title: "NASDAQ", detail: "Em junho, como GCTI, levantando US$ 45 milhões a US$ 18 por ação." },
        { year: 2016, title: "Interactive Intelligence", detail: "Comprada por cerca de US$ 1,4 bilhão, e a Hellman & Friedman ficou com uma participação no mesmo ano: os dois movimentos que transformaram um negócio on-premises num negócio em nuvem." },
        { year: 2024, title: "Pedido de volta à bolsa", detail: "Um pedido confidencial de abertura de capital, que segundo relatos buscava até US$ 2 bilhões, o que faria dela a terceira estrutura de controle distinta desde 1997." },
      ],
      products: [
        { name: "T-Server e a camada CTI", what: "O middleware original e a decisão de arquitetura em que toda a empresa se apoia: ele se integra ao switch que você já tem, em vez de substituí-lo." },
        { name: "Roteamento por habilidades", what: "Ligar quem chama a uma competência, e não a qualquer pessoa disponível. É o motivo pelo qual os contact centers são organizados como são, e sobreviveu por muito tempo ao telefone como canal único." },
        { name: "Genesys Cloud CX", what: "A plataforma atual: voz, canais digitais, autoatendimento, gestão da força de trabalho e análise como um único serviço, e não uma pilha de integrações." },
        { name: "Workforce engagement", what: "Previsão, escalas e gestão de qualidade: a metade operacional de tocar um contact center, para onde vai boa parte do orçamento real." },
      ],
      innovations: [
        {
          title: "Resolver um problema no vão entre dois sistemas",
          detail:
            "Nem o switch telefônico nem o banco de dados de clientes estavam quebrados. A falha era que eles não conversavam, e ninguém era dono do vão entre os dois. Construir um negócio no espaço entre dois sistemas que funcionam é um formato recorrente nesta indústria, e exige ter a confiança dos dois lados.",
        },
        {
          title: "Por que a independência era estrutural, e não sentimental",
          detail:
            "Um middleware que se conecta a qualquer switch vale mais quando o dono não vende switches. Dentro de um fabricante de telecomunicações, cada integração com o equipamento de um concorrente é uma conversa sobre a linha de produtos da própria controladora, e todo cliente sabe disso. É o mesmo mecanismo que esta linha do tempo registra na Kyndryl, cujo conselho passou a valer mais quando um fabricante de nuvem deixou de ser dono dela, e na Nozomi, cujo novo dono fabrica o equipamento que ela monitora.",
        },
        {
          title: "Rotear por competência",
          detail:
            "A passagem de há alguém livre para a pessoa certa está livre parece pequena e reorganiza tudo o que vem atrás: como os atendentes são treinados, como as equipes são estruturadas, como o desempenho é medido. A maior parte do software de contact center desde então foi um desdobramento dessa ideia.",
        },
        {
          title: "Captar nada, depois captar tudo",
          detail:
            "Ela começou com US$ 150.000 emprestados das famílias e desde então captou perto de US$ 3 bilhões em dez rodadas. O primeiro número comprou um produto; o segundo comprou uma transição de software on-premises para serviço em nuvem, que é a mais cara das duas coisas.",
        },
      ],
      markets: [
        "Organizações médias e grandes que operam centrais de atendimento (bancos, companhias aéreas, seguradoras, empresas de telecomunicações, serviços públicos), com cerca de US$ 2,0 bilhões de receita e mais de seis mil funcionários.",
        "Ela compete com os provedores de contact center nativos da nuvem que nunca carregaram um negócio on-premises, com os fabricantes de CRM que se estendem para atendimento e com as plataformas de telefonia que acrescentam recursos de contact center. Seu ativo distintivo continua sendo aquele com que começou: funciona com o que o cliente já tem.",
      ],
      analyst: [
        "Colocada de forma consistente entre os líderes das avaliações de contact center ao longo de duas décadas e vários donos, o que é incomum: a maioria das empresas contra as quais ela começou desapareceu ou foi absorvida.",
        "A pergunta em aberto é a que o pedido de 2024 levanta. Uma empresa que já foi de capital aberto, depois controlada por um fabricante e depois por private equity, propõe voltar à bolsa. Cada estrutura serviu a uma fase diferente, e o registro sugere que a fase que menos lhe serviu foi aquela em que o dono vendia o equipamento em relação ao qual ela foi projetada para ser neutra.",
      ],
    },
  },
  // IT-ONE: record prose (no profile, no acquisitions).
  "it-one": {
    // Company kept verbatim; only the subtitle is localised.
    name: "IT-ONE - fornecimento e integração num só lugar",
    // Card line and page prose.
    tagline: "Integradora brasileira de TI que cobre nuvem, cibersegurança, infraestrutura e observabilidade.",
    intro:
      "A IT-ONE fornece e integra TI no Brasil em nuvem, cibersegurança, proteção de dados, modernização de infraestrutura e observabilidade, a combinação que descreve uma integradora e não uma revenda, porque a segunda metade dessa lista não pode ser despachada numa caixa.",
    body: [
      "O próprio material de segurança da empresa faz um argumento que vale repetir, porque é o correto e raramente é o que se vende: a gestão de vulnerabilidades deve se concentrar nos ativos que carregam mais risco para o negócio, para que a equipe não seja soterrada por uma lista que trata todo achado como igual.",
      "É a mesma ideia que o verbete da Skybox nesta linha do tempo registra do lado do produto (alcançabilidade e exposição decidem qual vulnerabilidade importa), chegando aqui como proposta de serviços.",
    ],
  },
  // Microsiga: record prose (no profile, no acquisitions).
  "microsiga": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Microsiga - a aposta de que os microcomputadores substituiriam os mainframes",
    // Card line and page prose.
    tagline: "Empresa brasileira de software de gestão fundada em 1983 e rebatizada TOTVS em 2005.",
    intro:
      "A Microsiga foi fundada em 1983 por Laercio Cosentino, então com 23 anos e diretor da empresa de processamento de dados Siga, e pelo fundador da Siga, Ernesto Haberkorn. Ela escrevia software de gestão para pequenas e médias empresas, fundiu-se com a Siga em 1989 e foi rebatizada TOTVS em 2005.",
    body: [
      "A proposta de fundação é a parte que vale registrar, porque era uma posição minoritária na época. Segundo o relato de Haberkorn, Cosentino propôs a empresa durante um almoço, apostando nos microcomputadores quando, nas palavras dele, quase ninguém acreditava que eles substituiriam os mainframes. O negócio da Siga era prestar serviços de computação a empresas que não tinham computador; a Microsiga era uma aposta de que logo teriam.",
      "O que ela fez com essa aposta é a segunda metade. A década seguinte trouxe crescimento por meio de uma rede de franquias e expansão para a Argentina e o México, um modelo de distribuição incomum para software corporativo e muito eficaz num país desse tamanho: os franqueados carregavam as relações locais e o trabalho de implantação que uma empresa central não conseguiria cobrir com gente própria.",
      "O nome sobrevive em dois lugares. O Protheus, o ERP que lidera o mercado brasileiro, descende dela, e microsiga.com.br ainda é um site no ar. Uma observação sobre datas: as fontes sobre a fundação da própria Siga divergem, dando tanto 1969 quanto 1974, e nenhuma das duas é dada como resolvida aqui.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A Microsiga Software S.A. alterou sua razão social para TOTVS S.A. em 2005, segundo o próprio formulário de referência da TOTVS.",
  },
  // Nava: record prose and the complete profile (foundings and timeline only, as in English).
  "nava": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Nava - três empresas que viraram um nome só",
    // Card line and page prose.
    tagline: "A Unicom construía a infraestrutura, a FlexVision construía o software, e a empresa resultante da fusão precisou ser as duas coisas.",
    intro:
      "A Nava é o resultado da fusão de unidades de negócio que começaram como empresas separadas: a Unicom, que atuava em infraestrutura, data centers e conectividade, e a FlexVision, criada para o desenvolvimento e o suporte de plataformas de TI e para operações de infraestrutura. Sua especialização setorial está em pagamentos, telecomunicações, serviços financeiros e indústria.",
    body: [
      "A combinação descreve uma mudança real no que os compradores corporativos brasileiros queriam. Uma organização que antes comprava infraestrutura de um fornecedor e software de outro passou a querer, cada vez mais, um único responsável por um sistema que abrange os dois, e a fusão de uma empresa de infraestrutura com uma de software é o lado da oferta respondendo a isso.",
      "Também explica por que o registro corporativo de empresas assim é confuso: as pessoas jurídicas persistem com os nomes originais em cadastros e processos judiciais muito depois de a marca ter sido unificada, e é exatamente isso que as torna difíceis de pesquisar e fáceis de deixar fora de uma linha do tempo.",
    ],
    // Complete translated profile: same shape, years and entries as profiles/nava.ts.
    profile: {
      slug: "nava",
      foundings: [
        {
          company: "Unicom",
          year: 1996,
          place: "Brasil",
          founders: [],
          story:
            "O que hoje é a Nava foi fundado em 1996 como Unicom, atuando em infraestrutura, data centers e conectividade. É a ponta pouco glamorosa do mercado e também a mais duradoura: uma empresa que começa operando o piso do data center de outra pessoa acumula acesso a como o parque realmente se comporta, que é o ativo sobre o qual se constrói cada movimento posterior desta linha do tempo. Nenhum nome de fundador é publicado no histórico da própria empresa, e nenhum é fornecido aqui.",
          sourceNote:
            "O ano de 1996 e o nome original constam da página de história da própria Nava, que substitui o cadastro de diretório em que o verbete antes precisava se apoiar. A sede é registrada num diretório de terceiros como Barueri, São Paulo; a página da própria empresa não traz cidade, então nenhuma é afirmada aqui.",
        },
      ],
      timeline: [
        {
          year: 2009,
          title: "FlexVision, criada e não adquirida",
          detail:
            "A empresa criou a FlexVision, dedicada a desenvolver e dar suporte a plataformas de TI e a operações de infraestrutura. Um negócio de infraestrutura que constrói o próprio braço de software é o lado da oferta respondendo a uma mudança no que os compradores queriam: um único responsável por um sistema que abrange os dois, em vez de uma integradora para o hardware e uma software house para tudo o que fica acima dele.",
          sourceNote:
            "A linha do tempo da própria Nava situa a criação da FlexVision em 2009. Um cadastro de empresas de terceiros descreve a Nava como o resultado de uma fusão entre FlexVision e Unicom, o que se lê como a união de duas firmas independentes. Os dois relatos não são compatíveis e ambos ficam registrados. A visão dos cadastros pode explicar a diferença: o grupo opera com mais de uma pessoa jurídica, e unidades registradas separadamente parecem, de fora, empresas separadas.",
        },
        {
          year: 2012,
          title: "Application Services",
          detail:
            "As aplicações foram reforçadas como linha própria, o ponto em que uma empresa que opera plataformas passa a ser paga pelo que roda nelas.",
        },
        {
          year: 2016,
          title: "Dados e nuvem",
          detail:
            "Serviços de dados e de nuvem foram acrescentados à oferta, vinte anos depois de uma fundação construída sobre ser dona das máquinas. A sequência é a da indústria em miniatura: um negócio cujo primeiro ativo era infraestrutura precisou aprender a vender aquilo que torna a infraestrutura invisível.",
        },
        {
          year: 2018,
          title: "Um nome sobre o grupo",
          detail:
            "O grupo foi consolidado sob o nome Nava, e com ele vieram automação inteligente, BPO digital e IoT. Consolidar uma marca costuma ser tratado como marketing; para uma empresa cujas unidades tinham crescido separadas, é o momento em que a conversa de vendas deixa de ser sobre vários fornecedores com um dono em comum e passa a ser sobre um fornecedor com várias capacidades.",
        },
        {
          year: 2019,
          title: "Advanced Analytics e DigitalOPS",
          detail:
            "Foram criadas uma prática de análise de dados e uma de operações digitais, as primeiras linhas desta linha do tempo que pressupõem o trabalho com dados de 2016, e não o trabalho de infraestrutura de 1996.",
        },
        {
          year: 2020,
          title: "Serviços financeiros e pagamentos",
          detail:
            "Um novo ciclo de crescimento começou com práticas dedicadas a serviços financeiros e pagamentos. Pagamentos é o setor em que a herança de infraestrutura rende de forma mais direta, porque ali disponibilidade não é um nível de serviço, é o próprio produto.",
        },
        {
          year: 2021,
          title: "Cibersegurança",
          detail:
            "As operações de segurança foram ampliadas para uma oferta de cibersegurança. Repare na ordem desta linha do tempo: a segurança chega vinte e cinco anos depois da infraestrutura e dois anos depois da análise de dados, o que é um retrato justo de como as empresas brasileiras de serviços corporativos de fato fizeram essa sequência.",
        },
        {
          year: 2024,
          title: "Chega a Crescera Capital",
          detail:
            "A Crescera Capital entrou como sócia. Capital externo é o que transforma uma sequência de práticas criadas internamente num programa de aquisições, e os dois anos seguintes são esse programa.",
        },
        {
          year: 2025,
          title: "A primeira aquisição",
          detail:
            "A GH Brandtech foi adquirida, levando a empresa para a inovação criativa, e a Nava descreve isso como o início da sua jornada de fusões e aquisições. Vinte e nove anos construindo linhas internamente, e então uma comprada.",
        },
        {
          year: 2026,
          title: "Mais duas, ambas completando a pilha",
          detail:
            "A Ventura ERM foi adquirida para completar um portfólio de cibersegurança, e a CS Global IT para completar um de nuvem. As duas são o mesmo movimento: comprar a versão pronta de uma linha que a empresa já tinha começado a construir sozinha, que é para isso que serve o capital.",
        },
      ],
    },
  },
  // NCSA: record prose and the complete profile (founders string kept verbatim: it is a fact field).
  "ncsa": {
    // Company kept verbatim; only the subtitle is localised.
    name: "NCSA - o laboratório universitário que tornou a web visível",
    // Card line and page prose.
    tagline: "O Mosaic deu um rosto à web em 1993; os patches órfãos do NCSA httpd viraram o Apache; o NCSA Telnet pôs em rede uma geração de campi.",
    intro:
      "Um centro nacional de supercomputação cujos projetos paralelos mudaram o mundo: o Mosaic de Andreessen e Bina fez da internet algo que se podia ver (e, via Spyglass, também semeou o Internet Explorer), o httpd e o CGI de Rob McCool definiram como a web inicial servia páginas e executava programas, e sua comunidade de patches se tornou o Apache HTTP Server. A página da Netscape neste site é a continuação desta.",
    body: [
      "O perfil cobre a Black Proposal de 1983 e a fundação em 1986, o NCSA Telnet, a explosão do Mosaic em 1993 e seus dois descendentes na guerra dos navegadores, o httpd e o CGI, e o nascimento do Apache a partir dos patches órfãos.",
    ],
    // Complete translated profile: same shape, years and entries as profiles/ncsa.ts.
    profile: {
      slug: "ncsa",
      foundings: [
        {
          company: "National Center for Supercomputing Applications",
          year: 1986,
          place: "University of Illinois Urbana-Champaign",
          // Fact field: kept exactly as the English record writes it.
          founders: ["Larry Smarr (founding director; from the 1983 'Black Proposal')"],
          story:
            "A proposta não solicitada que Larry Smarr enviou à NSF em 1983 (encadernada em preto, argumentando que cientistas americanos não deviam ter de voar até a Europa para conseguir tempo de supercomputador) deu a Urbana-Champaign um dos centros nacionais de supercomputação originais. Os supercomputadores importavam; os projetos paralelos mudaram o mundo: um Telnet gratuito que pôs TCP/IP em todo desktop de campus, um servidor web cujos patches órfãos viraram o Apache e um navegador feito por estudantes chamado Mosaic, que fez da internet algo que se podia VER.",
        },
      ],
      timeline: [
        { year: 1987, title: "NCSA Telnet", detail: "Software de terminal TCP/IP gratuito para Macs e PCs espalha a internet pelos campi anos antes das pilhas comerciais: para uma geração de estudantes, o NCSA Telnet ERA a rede." },
        { year: 1993, title: "Mosaic", detail: "Marc Andreessen e Eric Bina lançam o Mosaic, o navegador com imagens inline, instalável por mortais, no Unix e depois no Mac e no Windows. A web deixa de ser um protocolo de texto para físicos e vira um lugar. O uso explode em poucos meses.", sourceNote: "Primeira versão para X Window no início de 1993; versões para Mac e Windows mais tarde naquele ano." },
        { year: 1993, title: "httpd e CGI", detail: "O NCSA httpd de Rob McCool se torna o servidor web dominante dos primeiros tempos, e sua Common Gateway Interface define como a web executa programas: o padrão formulário-envia-para-script do qual descende toda aplicação web." },
        { year: 1994, title: "O talento sai, duas vezes", detail: "Andreessen sai para cofundar o que viria a ser a Netscape (levando boa parte da equipe do Mosaic); a universidade licencia o Mosaic para a Spyglass, cujo código a Microsoft licencia para o Internet Explorer. Os dois ramos da guerra dos navegadores remontam ao mesmo laboratório de Urbana." },
        { year: 1995, title: "Apache", detail: "Com a saída de McCool, o desenvolvimento do httpd para; os webmasters que mantinham um conjunto compartilhado de patches se organizam como Apache Group e lançam o Apache HTTP Server. Nascido do código do NCSA, ele domina os servidores da web pelas duas décadas seguintes." },
        { year: 2012, title: "Ainda um centro de supercomputação", detail: "O Blue Waters entra em operação: o NCSA segue com sua missão de fato, ciência em escala petaflópica, enquanto o legado acidental de 1993 roda em vários bilhões de telas." },
      ],
      products: [
        { name: "NCSA Mosaic", what: "O navegador que tornou a web visual: o ancestral comum, por meio de pessoas e de licenças, tanto da Netscape quanto do Internet Explorer." },
        { name: "NCSA httpd e CGI", what: "O servidor dominante da web inicial e sua interface de execução de programas: o ancestral direto do Apache." },
        { name: "NCSA Telnet", what: "O cliente TCP/IP gratuito que pôs em rede uma geração de campi." },
      ],
      innovations: [
        { title: "A web visual", detail: "Imagens inline, uma interface amigável, versões para computadores comuns: a contribuição do Mosaic não foi um protocolo, mas ACESSO, e o acesso é o que fez da web uma indústria." },
        { title: "Código aberto como infraestrutura", detail: "Telnet, httpd, Mosaic: todos distribuídos livremente por uma universidade pública; a linhagem do Apache, em especial, fez de 'a comunidade mantém o servidor' uma norma fundadora da web." },
      ],
      markets: [
        "O NCSA nunca vendeu produtos: semeou mercados. A indústria de navegadores, o ecossistema de servidores web e o padrão do código universitário que vira infraestrutura mundial.",
      ],
      analyst: [
        "Ao lado da RAND, a segunda instituição de pesquisa entre esses pioneiros: a RAND imaginou os pacotes, o NCSA deu um rosto a eles. A página da Netscape neste site é a continuação desta.",
      ],
    },
  },
  // NetApp: record prose, two acquisitions (index-aligned) and the complete profile.
  "netapp": {
    // Name has no subtitle: carried verbatim so the record reads complete.
    name: "NetApp",
    // Card line and page prose.
    tagline: "Batizou-se exatamente com o que vendia, e isso acabou sendo a maior parte da estratégia.",
    intro:
      "A Network Appliance foi fundada em Sunnyvale em 1992 por David Hitz, James Lau e Michael Malcolm, a partir da constatação de que montar armazenamento de arquivos com servidores de uso geral era mais difícil do que precisava ser. O produto era um appliance: uma caixa que fazia uma coisa só, com um sistema operacional (o Data ONTAP) escrito só para essa função.",
    body: [
      "O nome dizia o que ela era, uma vantagem num mercado em que todo o resto era montado a partir de peças. O primeiro filer saiu em 1993, a Sequoia financiou a empresa em 1994, e ela abriu capital em 1995.",
      "Sua principal concorrente no início era a Auspex Systems, onde Hitz e Malcolm tinham trabalhado antes, que é o jeito comum de empresas de armazenamento começarem: pessoas saindo de uma para construir aquilo que ela não queria construir.",
      "Os anos pontocom levaram a NetApp a passar de US$ 1 bilhão de receita anual. Quando a bolha estourou, a receita caiu para cerca de US$ 800 milhões no ano fiscal de 2002, e a recuperação a partir daí foi lenta e pouco glamorosa, e não dramática. Ela mudou a razão social de Network Appliance para NetApp em 2008.",
      "Dois fios que valem ser seguidos a partir daqui. Michael Malcolm deixou o cargo de CEO em 1994 e fundou a CacheFlow em 1996, que virou a Blue Coat Systems, e em 2006 a NetApp vendeu sua linha de produtos NetCache para a Blue Coat: uma empresa vendeu um negócio à firma que seu próprio cofundador tinha construído. A carreira anterior de Malcolm tinha passado pela Sun Microsystems e pela Tandem Computers, que aparecem nesta linha do tempo tendo terminado dentro de outra empresa.",
      "Hitz e Lau dividiram o IEEE Reynold B. Johnson Information Storage Systems Award em 2007. Hitz se aposentou em 2019.",
    ],
    // Acquisitions: prose only, same order and length as the English list.
    acquisitions: [
      { what: "Tecnologia de armazenamento em cluster.", became: "A arquitetura clustered Data ONTAP." },
      { what: "Gestão de serviços de armazenamento.", became: "SANscreen, depois OnCommand Insight." },
    ],
    // Complete translated profile: same shape, years and entries as profiles/netapp.ts.
    profile: {
      slug: "netapp",
      foundings: [
        {
          company: "Network Appliance",
          year: 1992,
          place: "Sunnyvale, Califórnia",
          founders: ["David Hitz", "James Lau", "Michael Malcolm"],
          story:
            "Constituída em abril com a proposta de que o armazenamento de arquivos devia ser uma caixa que faz uma coisa só, e não um servidor de uso geral convencido a fazê-la. A ambição declarada era tornar o armazenamento tão simples quanto um eletrodoméstico, e a empresa tirou seu nome da categoria que pretendia criar.",
        },
      ],
      timeline: [
        { year: 1992, title: "Fundação", detail: "Em Sunnyvale, por três pessoas, duas das quais vinham da Auspex." },
        { year: 1993, title: "O primeiro filer", detail: "Um servidor de arquivos de rede dedicado, vendido como coisa pronta, e não como peças para montar." },
        { year: 1994, title: "A Sequoia investe", detail: "E Michael Malcolm deixa o cargo de CEO no mesmo ano." },
        { year: 1995, title: "Abertura de capital", detail: "Três anos depois da fundação, com uma linha de produtos de um item só." },
        { year: 2002, title: "A correção", detail: "Receita do ano fiscal de 2002 em torno de US$ 800 milhões, abaixo dos mais de US$ 1 bilhão anteriores." },
        { year: 2008, title: "A Network Appliance vira NetApp", detail: "A razão social mudou." },
        {
          year: 2025,
          title: "A virada aparecendo nos números",
          detail:
            "Receita trimestral de US$ 1,64 bilhão, all-flash num ritmo anualizado de US$ 3,8 bilhões e serviços de armazenamento em nuvem crescendo mais de 40% ano contra ano: o negócio de software crescendo mais do que o de hardware, numa empresa cuja tese fundadora era o hardware.",
        },
      ],
      products: [
        { name: "ONTAP", what: "O sistema operacional, e o produto de verdade. Ele tem três partes (o ambiente de execução, o sistema de arquivos e a camada de proteção de dados) e hoje roda em hardware NetApp, em servidores comuns e dentro das três grandes nuvens." },
        { name: "AFF e FAS", what: "Os arrays all-flash e híbridos. A série A fica com os workloads de missão crítica, a série C com os de uso geral, e ambas falam arquivo, bloco e objeto a partir do mesmo sistema." },
        { name: "StorageGRID", what: "Armazenamento de objetos para os dados que são guardados, e não usados: arquivos históricos, compliance, o material que ninguém lê até alguém precisar." },
        { name: "Cloud Volumes ONTAP", what: "O mesmo sistema operacional rodando dentro da AWS, do Azure e do Google Cloud, para que um workload possa se mover sem mudar o comportamento do seu armazenamento. É a virada, expressa como produto." },
        { name: "FabricPool", what: "Tiering automático dos blocos frios para armazenamento de objetos: a economia pouco glamorosa de reservar a mídia cara para os dados que de fato estão sendo lidos." },
        { name: "Keystone", what: "Armazenamento vendido como assinatura, e não como bem de capital: a mesma mudança a que o modelo de preços da nuvem empurrou todo fabricante de infraestrutura." },
      ],
      innovations: [
        {
          title: "Nunca sobrescrever um bloco",
          detail:
            "O WAFL grava os dados alterados num bloco novo e move o ponteiro, em vez de reescrever o original. Essa única decisão é a base: torna as gravações rápidas, porque elas podem ir para onde for conveniente, e torna a recuperação após uma pane rápida, porque o estado consistente anterior continua intacto no disco.",
        },
        {
          title: "Snapshots como aritmética de ponteiros",
          detail:
            "Como nada é sobrescrito, uma cópia de um ponto no tempo é uma cópia dos ponteiros, e não dos dados. Isso torna os snapshots praticamente instantâneos e quase gratuitos em espaço, e é por isso que um recurso ao qual todo concorrente acabou tendo de responder era, aqui, uma consequência do sistema de arquivos, e não um produto acoplado a ele.",
        },
        {
          title: "Metadados guardados em arquivos comuns",
          detail:
            "A maioria dos sistemas de arquivos fixa suas estruturas de metadados no formato em disco, o que transforma qualquer mudança numa migração. O WAFL guarda metadados em arquivos regulares, então o formato pode evoluir sem mover os dados de ninguém. É boa parte do motivo pelo qual um projeto de 1992 ainda está sendo vendido.",
        },
        {
          title: "Vender o software quando a caixa deixou de ser o ponto",
          detail:
            "Uma empresa batizada com o nome de um appliance hoje vende seu sistema operacional para rodar dentro das nuvens de outras empresas, e essa linha cresce mais depressa do que o hardware. Funcionou porque o valor sempre foi o sistema de arquivos, e não a chapa de metal em volta dele, o que não era óbvio na época e é o motivo pelo qual a transição foi sobrevivível.",
        },
      ],
      markets: [
        "Armazenamento corporativo em todos os setores que guardam mais dados do que conseguem mover: serviços financeiros, saúde, mídia, computação de pesquisa e, cada vez mais, os pipelines de dados por trás do machine learning, onde o problema é alimentar os aceleradores com rapidez suficiente, e não armazenar barato.",
        "Receita anual reportada em torno de US$ 6,6 bilhões, com all-flash e serviços de nuvem puxando o crescimento. Seus concorrentes são os outros grandes fabricantes de arrays, os serviços de armazenamento dos próprios hyperscalers e os entrantes de software-defined que fazem o mesmo argumento que a NetApp fez em 1992 contra os estabelecidos daquela década.",
      ],
      analyst: [
        "Colocada entre os três maiores fabricantes globais de armazenamento corporativo no tracker trimestral da IDC do terceiro trimestre de 2025, e apontada como Leader e Fast Mover na avaliação de armazenamento primário da GigaOm.",
        "A avaliação que vale notar não é o ranking, mas o formato: uma empresa de hardware de trinta anos cuja linha de crescimento mais rápido é software rodando em infraestrutura que não é dela. A maioria das suas contemporâneas de 1992 não conseguiu fazer essa transição, e várias aparecem em outros pontos desta linha do tempo tendo terminado dentro de outra empresa.",
      ],
    },
  },
  // NetScreen and Juniper: record prose, acquisitions (index-aligned, with the nested entry) and the complete profile.
  "netscreen-juniper": {
    // Name has no subtitle: carried verbatim so the record reads complete.
    name: "NetScreen and Juniper Networks",
    // Card line and page prose.
    tagline: "Uma empresa de firewall cujos ex-funcionários fundaram ou moldaram a maioria das outras.",
    intro:
      "A NetScreen foi fundada em 1996 por Yan Ke, Ken Xie e Feng Deng, com o argumento de que o firewall devia ser feito em silício, e não num processador de uso geral. A Juniper Networks, fundada em 1996 por Pradeep Sindhu, vindo do Xerox PARC, comprou-a em 2004 por cerca de US$ 4 bilhões em ações, e a história mais interessante é a de quem saiu.",
    body: [
      "O argumento do ASIC foi o fundador. Os firewalls em software de meados dos anos 1990 rodavam em CPUs comuns e ficavam mais lentos à medida que as regras se acumulavam, então a NetScreen construiu silício projetado para a função e vendeu throughput previsível. É o mesmo argumento que todo fabricante de segurança em hardware usou desde então, e a NetScreen foi a primeira a usá-lo em escala.",
      "Ken Xie saiu em 2000 e fundou a Fortinet com o irmão, Michael. A Fortinet aparece neste site como um fabricante cujo treinamento é ministrado pelo autor do site.",
      "A NetScreen comprou a OneSecure em 2002, fundada por Nir Zuk, um dos primeiros funcionários da Check Point. Zuk ficou durante a aquisição pela Juniper, saiu em 2005 e fundou a Palo Alto Networks, que ultrapassou a Check Point em receita de firewall em 2014.",
      "Changming Liu, também da NetScreen, foi cofundador da Aerohive, que a Extreme Networks adquiriu em 2019.",
      "Ou seja, uma única startup de 1996 semeou a Fortinet, a Palo Alto Networks e parte da Extreme, e no caminho absorveu uma empresa fundada por um dos primeiros funcionários da Check Point. Quatro dos oito fabricantes que este site ensina remontam, em alguma parte, àquele único prédio.",
      "A própria Juniper foi a outra metade deste capítulo. Fundada para construir roteadores de operadora capazes de aguentar tráfego em escala de internet, ela criou o JUNOS (um único sistema operacional em toda a linha, com um modelo de configuração que fazia commit de forma atômica ou não fazia) e passou duas décadas como a alternativa crível à Cisco nas redes de provedores de serviço. Seu negócio de SSL VPN foi depois separado e vendido, virando a Pulse Secure, que é um capítulo à parte aqui e terminou dentro da Ivanti.",
    ],
    // Acquisitions: prose only, same order and length as the English list (nested entry aligned too).
    acquisitions: [
      { what: "Prevenção de intrusão.", became: "Zuk saiu em 2005 e fundou a Palo Alto Networks." },
      {
        what: "O negócio de firewall e VPN, numa das maiores aquisições de segurança da sua época.",
        became: "A linha de segurança da Juniper; a parte de SSL VPN foi depois vendida e virou a Pulse Secure.",
        subAcquisitions: [
          { what: "Assim, a Juniper adquiriu a empresa de Nir Zuk ao adquirir a empresa que a tinha adquirido, e o perdeu um ano depois para a firma que viria a ser sua concorrente." },
        ],
      },
    ],
    // Complete translated profile: same shape, years and entries as profiles/netscreen-juniper.ts.
    profile: {
      slug: "netscreen-juniper",
      foundings: [
        {
          company: "Juniper Networks",
          year: 1996,
          place: "Sunnyvale, Califórnia",
          founders: ["Pradeep Sindhu", "Dennis Ferguson", "Bjorn Liencres"],
          story:
            "Depois de onze anos no Computer Science Lab do Xerox PARC, Pradeep Sindhu tirou uma licença em 1995, saiu de férias e voltou com uma empresa: roteadores construídos como computadores para pacotes, com silício próprio separando o encaminhamento do controle, mirando o núcleo da internet que a Cisco dominava com mais de 90 por cento de participação. Constituída em 6 de fevereiro de 1996 com Dennis Ferguson (ex-MCI) e Bjorn Liencres (ex-Sun); Vinod Khosla, da Kleiner Perkins, tinha passado seis meses de reuniões semanais dando forma à ideia. Scott Kriens, veterano da StrataCom, virou CEO no sétimo mês, enquanto Sindhu passava a CTO, e a rodada de 1997 disse tudo à indústria: quatro dos cinco maiores fabricantes de equipamentos de telecomunicações (Siemens, Ericsson, Nortel e 3Com) entraram como investidores.",
        },
        {
          company: "NetScreen Technologies",
          year: 1997,
          place: "Sunnyvale, Califórnia",
          founders: ["Yan Ke", "Ken Xie", "Feng Deng"],
          story:
            "Três ex-alunos da Universidade Tsinghua construíram a metade de segurança da história desta página. Ken Xie (Tsinghua e engenharia elétrica em Stanford) já tinha construído o primeiro appliance de firewall/VPN baseado em ASIC na sua garagem em Palo Alto em 1996; a NetScreen foi constituída em outubro de 1997 para transformar segurança na velocidade do silício numa empresa, e seu NetScreen-1000 se tornou o primeiro firewall de velocidade gigabit. Robert Thomas chegou da Sun como CEO em 1998; Xie ficou como CTO até 2000, quando saiu para fundar a Fortinet com o irmão Michael, e o FortiGate saiu em maio de 2002. A receita foi de US$ 5,9 milhões a US$ 245,3 milhões em quatro anos, com a IDC classificando a NetScreen como a fabricante de firewall número um no Japão. (Constituída em outubro de 1997 segundo o advogado de longa data da empresa; o protótipo da garagem e alguns históricos datam o empreendimento de 1996.)",
        },
      ],
      timeline: [
        { year: 1996, title: "A Juniper é constituída; a IBM fabrica o silício", detail: "6 de fevereiro de 1996: a empresa de roteadores de núcleo projetada do zero por Sindhu nasce com US$ 2 milhões de capital semente. Em julho, a IBM já está contratada para fabricar os ASICs próprios da Juniper, os motores de encaminhamento de pacotes que são toda a aposta." },
        { year: 1997, title: "Os clientes viram investidores; o JUNOS chega", detail: "Uma rodada estratégica de US$ 40 milhões traz Siemens, Ericsson, Nortel e 3Com, quatro dos cinco maiores fabricantes de equipamentos de telecomunicações, além de dinheiro da Qwest e da AT&T. Em dezembro, o JUNOS é lançado: o primeiro sistema operacional da indústria projetado especificamente para roteamento de backbone da internet. No mesmo outono, a NetScreen é constituída em torno do firewall ASIC que Xie montou na garagem." },
        { year: 1998, title: "O M40 chega", detail: "Setembro de 1998: o M40 é lançado, com 40 milhões de pacotes por segundo e o plano de controle separado de um plano de encaminhamento em silício, cerca de dez vezes o throughput da concorrência baseada em software, contra mais de 90 por cento de participação da Cisco no núcleo. Receita do primeiro trimestre: US$ 3,8 milhões." },
        { year: 1999, title: "O IPO da época", detail: "25 de junho de 1999: a Juniper é precificada a US$ 34 e fecha o primeiro dia a US$ 99, levantando US$ 63 milhões. A receita passa de US$ 100 milhões com o primeiro trimestre lucrativo; cinquenta operadoras rodam o M40." },
        { year: 2001, title: "37 por cento do núcleo; a NetScreen abre capital", detail: "A participação da Juniper em roteamento de núcleo chega a 37 por cento: o duopólio é real. Em dezembro, a NetScreen faz IPO na NASDAQ (NSCN) na janela estreita depois do 11 de setembro, uma das poucas estreias de segurança da recessão." },
        { year: 2002, title: "A NetScreen compra os fundadores dos seus futuros rivais", detail: "A OneSecure, por US$ 45 milhões em ações, traz prevenção de intrusão em linha, e seus cofundadores: Nir Zuk, um dos primeiros funcionários da Check Point, vira CTO da NetScreen; Rakesh Loonkar depois cofunda a Trusteer. Em 2003, a Neoteris acrescenta SSL VPN por cerca de US$ 245 milhões em ações mais US$ 20 milhões em dinheiro.", sourceNote: "OneSecure noticiada a US$ 45 milhões (alguns relatos falam em US$ 40 milhões); condições da Neoteris segundo a EE Times, outubro de 2003." },
        { year: 2004, title: "A Juniper paga US$ 4 bilhões pela NetScreen", detail: "Anunciado em 9 de fevereiro de 2004 (1,404 ação da Juniper por ação da NetScreen, cerca de US$ 4 bilhões em ações) e concluído em 16 de abril. A Juniper fica com o ScreenOS, a franquia de segurança em ASIC e a fabricante de firewall número um do Japão; a linhagem vira a série SSG e depois o SRX.", sourceNote: "Documentos Form 425 na SEC; conclusão segundo o comunicado da Juniper de 16 de abril de 2004." },
        { year: 2005, title: "A máfia da NetScreen se dispersa", detail: "Nir Zuk sai da Juniper para fundar a Palo Alto Networks; Yan Ke e Feng Deng saem para criar a Northern Light Venture Capital; a Fortinet de Ken Xie já tem quatro anos. Uma única startup de Sunnyvale semeou três das instituições que definem a segurança." },
        { year: 2008, personal: true, title: "A ofensiva corporativa, e a minha porta de entrada", detail: "A Juniper lança seu primeiro switch Ethernet, o EX 4200, e os services gateways SRX; Kriens vira chairman e Kevin Johnson, da Microsoft, assume como CEO. Os roteadores de borda MX (2006), construídos por uma equipe liderada por Kumar e Apurva Mehta, depois na Versa, ancoram o portfólio que eu represento quando entro na Juniper no Brasil em 2009, até 2010." },
        { year: 2014, title: "A Pulse sai; o funcionário nº 32 assume", detail: "A linha de SSL VPN descendente da Neoteris é vendida a private equity por US$ 250 milhões como Pulse Secure. Rami Rahim, o funcionário número 32 da Juniper, vira CEO." },
        { year: 2015, title: "A revelação do ScreenOS", detail: "Dezembro de 2015: a Juniper anuncia ter encontrado código não autorizado no ScreenOS, presente desde 2012: um backdoor de acesso root e uma constante Dual_EC_DRBG alterada que permitia decifração passiva. Um dos incidentes de cadeia de suprimentos mais estudados da história da segurança." },
        { year: 2019, title: "Mist: a virada para a IA", detail: "Concluída em 1º de abril de 2019 (anunciada a US$ 405 milhões; US$ 359,2 milhões líquidos segundo o 10-Q), a compra da Mist põe o wireless guiado por IA no centro da história corporativa da Juniper e, mais tarde, torna-o o ativo com que os reguladores mais se importam.", sourceNote: "10-Q da Juniper." },
        { year: 2025, title: "Para dentro da HPE", detail: "Anunciado em 9 de janeiro de 2024 a US$ 40 por ação (cerca de US$ 14 bilhões); processado pelo DOJ em 30 de janeiro de 2025; acordo em 28 de junho (a HPE se desfaz do Instant On e licencia o código-fonte do AIOps da Mist, com o DOJ observando que HPE mais Cisco detêm mais de 70 por cento das redes corporativas dos EUA); concluído em 2 de julho de 2025 por cerca de US$ 13,4 bilhões em dinheiro, segundo o 10-K da HPE. Rami Rahim vira presidente da HPE Networking; o Magic Quadrant de 2025 do Gartner para redes com e sem fio ainda lista a Juniper como Leader." },
      ],
      products: [
        { name: "Junos", what: "O primeiro sistema operacional de roteamento da indústria específico para backbone (dezembro de 1997), e a disciplina de um sistema operacional só da Juniper em roteamento, switching e segurança por duas décadas." },
        { name: "Séries M e T", what: "Os roteadores de núcleo que quebraram o monopólio: o plano de encaminhamento em silício do M40, depois o M160, a série T e o núcleo multichassi que carregou a internet dos anos 2000." },
        { name: "Roteadores de borda MX", what: "A plataforma de borda de 2006 (engenharia liderada por Kumar e Apurva Mehta, depois fundadores da Versa), que virou a franquia de batalha da Juniper." },
        { name: "ScreenOS, SSG e SRX", what: "A linhagem da NetScreen: firewalls ASIC e o ScreenOS, evoluídos para a série SSG e depois para os services gateways SRX, a linha de segurança dos meus anos de Juniper." },
        { name: "Switching EX e Mist AI", what: "A entrada em switches corporativos de 2008 e a aquisição da Mist em 2019: o portfólio com e sem fio guiado por IA que a HPE valorizou a ponto de comprar a empresa inteira, e que o DOJ valorizou a ponto de forçar sua abertura." },
      ],
      innovations: [
        { title: "Separar controle de encaminhamento", detail: "A arquitetura do M40, um plano de dados em silício sob um plano de controle em software, virou a forma como todo roteador sério foi construído desde então." },
        { title: "Clientes como investidores", detail: "A rodada de 1997 tornou acionistas quatro dos cinco maiores fabricantes de equipamentos de telecomunicações: distribuição, validação e capital num só movimento." },
        { title: "Segurança em wire speed", detail: "O ASIC de garagem de Xie e o NetScreen-1000, o primeiro firewall gigabit, provaram que a segurança não precisava ser o gargalo da rede." },
        { title: "A máfia da NetScreen", detail: "Os ex-funcionários de uma única empresa fundaram a Fortinet (Ken e Michael Xie), a Palo Alto Networks (Nir Zuk) e a Northern Light Venture Capital (Ke e Deng): possivelmente a diáspora de fundadores de maior consequência na segurança de redes." },
      ],
      markets: [
        "A Juniper transformou o roteamento de núcleo de monopólio em duopólio (37 por cento de participação em 2001) e depois passou duas décadas se expandindo para borda, segurança, switching e redes corporativas guiadas por IA, terminando como a peça central de US$ 13,4 bilhões das ambições de redes da HPE em 2025.",
        "O meu capítulo foi o Brasil, de 2009 a 2010: a onda corporativa de EX e SRX, o Junos como argumento de um sistema operacional só e a linha de segurança descendente da NetScreen, nos mesmos anos em que a franquia MX construída por ex-funcionários da Riverstone carregava o negócio de operadoras.",
      ],
      analyst: [
        "O duopólio, em números: a Cisco acima de 90 por cento do roteamento de núcleo em 1998; a Juniper com 37 por cento em 2001, a mudança de participação mais rápida que o mercado de roteadores já viu.",
        "A IDC classificava a NetScreen como a fabricante de firewall número um no Japão antes da aquisição de 2004; o Magic Quadrant for Enterprise Wired and Wireless LAN de 2025 do Gartner ainda lista a Juniper como Leader dentro da HPE, e o acordo do DOJ de 2025 situou HPE mais Cisco em mais de 70 por cento das redes corporativas dos EUA.",
      ],
      careerLink: {
        // The href is a fact and stays the English record's.
        href: "/fortinet",
        label: "Ken Xie, cofundador da NetScreen, depois fundou a Fortinet: o meu hub da Fortinet",
      },
    },
  },
  // Niva: record prose (no profile, no acquisitions).
  "niva": {
    // Name has no subtitle: carried verbatim so the record reads complete.
    name: "Niva",
    // Card line and page prose.
    tagline: "Uma integradora cuja lista de parceiros é um mapa desta linha do tempo.",
    intro:
      "A Niva Tecnologia da Informação é uma integradora de Brasília que atua em três linhas: segurança da informação, segurança eletrônica e data center.",
    body: [
      "A lista de parceiros é a coisa mais informativa do registro público, e vale lê-la como documento, e não como rol: F5, Palo Alto Networks, NetApp, CrowdStrike, Forescout, Netskope, Citrix, Avigilon, Furukawa e Lenel. Seis desses são fabricantes de redes e segurança; dois são de segurança física; um é de cabeamento estruturado; um é de armazenamento.",
      "Essa combinação descreve um tipo específico de empresa, que esta linha do tempo documentou de todos os lados menos deste. Uma integradora que carrega segurança da informação e segurança eletrônica ao mesmo tempo vende para um prédio, e não para uma rede: firewalls e controladoras de porta, controle de acesso à rede e câmeras, no mesmo projeto, para o mesmo cliente, que tem um orçamento e um conjunto de empreiteiros. A distinção entre as duas disciplinas é muito mais nítida nos catálogos dos fabricantes do que num canteiro de obras.",
      "A presença da Furukawa nessa lista é o indício. O cabeamento estruturado fica por baixo tanto da câmera de segurança quanto do firewall, e a empresa que passa o cabo está bem posicionada para vender o que se pendura nele, a mesma observação que o verbete da Anixter faz do lado da distribuição, chegando aqui pelo lado da instalação.",
    ],
  },
  // Nokia: record prose and the complete profile.
  "nokia": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Nokia - da fábrica de papel à gigante de redes",
    // Card line and page prose.
    tagline: "Um arco de 160 anos: de botas de borracha à liderança mundial em celulares e a uma das três empresas que constroem as redes móveis do mundo.",
    intro:
      "A Nokia é a grande metamorfa da indústria: uma fábrica de papel finlandesa de 1865 que se tornou a maior fabricante de celulares do mundo, perdeu essa coroa nas guerras dos smartphones e se reconstruiu como potência de redes, absorvendo a Alcatel-Lucent e o Bell Labs em 2016 e a fabricante de equipamentos ópticos Infinera em 2025.",
    body: [
      "A empresa que hoje é uma das três capazes de construir uma rede móvel nacional começou como uma fábrica de pasta de madeira, licenciada em maio de 1865 junto a umas corredeiras em Tampere. O nome vem da segunda fábrica, construída três anos depois às margens do Nokianvirta, porque esse rio tinha melhor potencial hidrelétrico.",
      "Idestam não foi o primeiro a tentar pasta mecânica de madeira na Finlândia. Uma fábrica fundada perto de Vyborg cinco anos antes tinha tido mau desempenho e fechado. Ele teve sucesso onde o antecessor fracassou, e é a lição mais antiga do catálogo aparecendo logo no começo de uma empresa de cento e sessenta anos: ser o primeiro não é a conquista, e o registro costuma lembrar do segundo de qualquer forma.",
      "A borracha chegou em 1898 e os cabos em 1912, e as três se fundiram formalmente em 1967 num conglomerado que fazia botas, pneus e fio telefônico. Em 1981, o serviço Nordic Mobile Telephone entrou no ar, a primeira rede celular internacional do mundo e a primeira que permitia ao assinante fazer roaming entre países, e a Nokia fornecia equipamentos para ela.",
      "Um número descreve o que aconteceu depois melhor do que qualquer narrativa. A série 2100, de 1994, foi planejada para 400.000 unidades e vendeu vinte milhões. Ninguém entendia a escala do que estava chegando, nem mesmo a empresa que estava prestes a abocanhá-la: o faturamento foi de 6,5 bilhões de euros para 31 bilhões entre 1996 e 2001, e em 2007 quase metade dos aparelhos vendidos no planeta eram Nokia.",
      "As decisões de um lado e de outro disso são o motivo pelo qual vale estudar esta empresa. Em 1992, Jorma Ollila decidiu vender a borracha, os cabos e a eletrônica de consumo e apostar tudo em telecomunicações: um conglomerado se transformando deliberadamente em especialista. Vinte e um anos depois, a especialista vendeu justamente o negócio em que tinha apostado e voltou a construir os equipamentos que carregam os celulares dos outros. A empresa sobreviveu duas vezes abandonando o que era, algo que quase nada nesta seção conseguiu fazer uma vez.",
      "O contraste com a Ericsson é instrutivo, já que as duas são oficinas do século XIX que viraram fornecedoras de redes. A Ericsson vendeu para operadoras o tempo todo e ainda vende. A Nokia foi ao público, conquistou-o por completo, perdeu-o e voltou a vender para operadoras. Mesmo destino; a diferença é que uma delas detém o recorde da ida e volta mais espetacular da indústria.",
    ],
    // Complete translated profile: same shape, years and entries as profiles/nokia.ts.
    profile: {
      slug: "nokia",
      foundings: [
        {
          company: "Nokia",
          year: 1865,
          place: "Tampere, Finlândia",
          founders: ["Fredrik Idestam"],
          story:
            "A Nokia é a grande metamorfa da indústria. A fábrica de pasta de madeira que Fredrik Idestam abriu em 1865 junto às corredeiras de Tammerkoski se tornou, por meio de uma fusão tripla em 1967 com a Finnish Rubber Works e a Finnish Cable Works, um conglomerado que fazia de botas a televisores. A decisão de Jorma Ollila, em 1992, de apostar a empresa inteira em telecomunicações produziu a marca mais reconhecível da década móvel e, quando as guerras dos smartphones tiraram essa coroa, a Nokia mudou de forma outra vez, tornando-se uma das três empresas do planeta capazes de construir uma rede móvel nacional de ponta a ponta.",
        },
      ],
      timeline: [
        { year: 1865, title: "Uma fábrica de papel", detail: "Idestam mói pasta de madeira às margens do rio Nokianvirta; a fusão de 1967 com as fábricas de borracha e de cabos cria a Nokia Corporation, e os cabos são o fio que leva, décadas depois, às telecomunicações." },
        { year: 1992, title: "A virada de Ollila", detail: "O novo CEO, Jorma Ollila, se desfaz de tudo o que não é telecom justamente quando o GSM é lançado (a Nokia tinha conduzido a primeira chamada GSM do mundo em 1991) e surfa a telefonia móvel digital de experimento nórdico a padrão global." },
        { year: 1998, title: "A coroa", detail: "A Nokia passa a Motorola como a maior fabricante de celulares do mundo e mantém o título por treze anos; o 3310 e seus parentes se tornam os eletrônicos mais fabricados da sua época." },
        { year: 2011, title: "A plataforma em chamas", detail: "O memorando de Stephen Elop admite a derrota na guerra dos smartphones; segue-se a aliança com o Windows Phone e, em 2014, o próprio negócio de aparelhos vai para a Microsoft por cerca de 5,44 bilhões de euros. O que sobra é a empresa de redes." },
        { year: 2016, title: "A Alcatel-Lucent, e o Bell Labs", detail: "A Nokia conclui a aquisição da Alcatel-Lucent, absorvendo a linhagem franco-americana e, com ela, o próprio Bell Labs, depois de já ter assumido o controle total da joint venture de redes com a Siemens em 2013. A gigante de infraestrutura está montada." },
        { year: 2025, title: "Óptica, e um novo comandante", detail: "28 de fevereiro de 2025: a aquisição da Infinera é concluída, aprofundando as redes ópticas para a era dos data centers de IA. Em 1º de abril, Justin Hotard, vindo do grupo Data Center and AI da Intel, torna-se presidente e CEO: um executivo de data center para uma década de data centers.", sourceNote: "Documentos 6-K da Nokia, 2025." },
      ],
      products: [
        { name: "Mobile Networks", what: "RAN do 2G ao 5G Advanced: um dos três fabricantes que constroem as redes móveis do mundo." },
        { name: "Network Infrastructure", what: "Redes fixas, roteamento IP e, com a Infinera, óptica: a metade cabeada da gigante." },
        { name: "Nokia Bell Labs", what: "A joia da coroa herdada: o laboratório do transistor, da teoria da informação e do Unix, ainda inventando." },
      ],
      innovations: [
        { title: "GSM em escala", detail: "A Nokia transformou o padrão digital europeu no sistema telefônico do mundo, e o celular no primeiro computador universal." },
        { title: "Reinvenção corporativa como disciplina", detail: "Papel, borracha, cabos, televisores, celulares, redes: nenhuma empresa desta seção mudou com sucesso, mais vezes, aquilo que fundamentalmente é." },
      ],
      markets: [
        "A Nokia compete globalmente em infraestrutura de redes móveis e fixas contra Ericsson e Huawei, com linhas crescentes de data center e defesa: o terceiro ato da gigante finlandesa, comandado desde 2025 por um especialista em data centers.",
      ],
      analyst: [
        "Presença permanente nas avaliações de infraestrutura de telecomunicações e, antes disso, a fabricante que definiu a era dos aparelhos que o smartphone desfez.",
      ],
    },
  },
  // Nutanix: record prose (Red Education training claim kept exact, award titles in English) and the complete profile.
  "nutanix": {
    // Name has no subtitle: carried verbatim so the record reads complete.
    name: "Nutanix",
    // Card line and page prose.
    tagline: "Multicloud híbrida e infraestrutura hiperconvergente.",
    intro:
      "A Nutanix constrói a plataforma de multicloud híbrida que executa e gerencia aplicações e dados em nuvens privadas e públicas, construída sobre infraestrutura hiperconvergente.",
    body: [
      "A Red Education é Nutanix Authorised Training Partner, reconhecida pela Nutanix como Highest Quality and Top Performing Authorized Training Partner of the Year, com índice de satisfação de clientes de 98% nos seus cursos Nutanix.",
    ],
    // Complete translated profile: same shape, years and entries as profiles/nutanix.ts.
    profile: {
      slug: "nutanix",
      foundings: [
        {
          company: "Nutanix",
          year: 2009,
          place: "San Jose, Califórnia",
          founders: ["Dheeraj Pandey", "Mohit Aron", "Ajeet Singh"],
          story:
            "A Nutanix perguntou por que o data center precisava de uma SAN, afinal. Dheeraj Pandey, Mohit Aron (que tinha trabalhado no Google File System, o documento-mãe do armazenamento distribuído) e Ajeet Singh fundaram a empresa em 2009 para fundir computação e armazenamento numa única camada scale-out: servidores comuns, um sistema de arquivos distribuído entre eles, máquinas virtuais por cima. A indústria chamou isso de infraestrutura hiperconvergente e traçou uma categoria em volta do que a Nutanix já vendia; Aron sairia depois para fundar a Cohesity e aplicar o mesmo DNA de sistemas distribuídos ao backup.",
        },
      ],
      timeline: [
        { year: 2009, title: "Fundada sobre armazenamento ao estilo Google", detail: "Três fundadores com pedigree em sistemas distribuídos começam a construir uma plataforma scale-out em que cada nó contribui com computação e armazenamento: a SAN eliminada da arquitetura já no projeto." },
        { year: 2011, title: "'No SAN'", detail: "A primeira Virtual Computing Platform é lançada com um slogan de marketing que dá nome à revolução; a infraestrutura hiperconvergente se torna a categoria traçada mais depressa na década, com a Nutanix como eixo." },
        { year: 2015, title: "AHV: o hypervisor gratuito", detail: "A Nutanix lança seu próprio Acropolis Hypervisor, baseado em KVM, levando a relação com a VMware da simbiose para a rivalidade: quem é dono da plataforma faz do hypervisor um recurso." },
        { year: 2016, title: "IPO: NTNX", detail: "A listagem na Nasdaq em setembro é o IPO de tecnologia corporativa de maior destaque do ano: a líder da categoria HCI chegando ao mercado aberto no meio da transição de appliances para software." },
        { year: 2020, title: "A Bain, e a saída do fundador", detail: "O investimento conversível de US$ 750 milhões da Bain Capital chega junto com o anúncio da aposentadoria de Dheeraj Pandey; Rajiv Ramaswami, COO da VMware, assume em dezembro, e a VMware processa por causa da contratação, um processo depois resolvido enquanto a virada para assinaturas acelera." },
        { year: 2023, title: "O dividendo Broadcom", detail: "Enquanto a aquisição da VMware pela Broadcom vira o licenciamento de cabeça para baixo em toda a indústria, a Nutanix Cloud Platform com AHV se torna a conversa de referência sobre migração: o argumento da plataforma alternativa que a empresa vinha construindo havia uma década." },
      ],
      products: [
        { name: "Nutanix Cloud Platform", what: "O núcleo HCI amadurecido: armazenamento distribuído (AOS), o hypervisor AHV e o gerenciamento numa única plataforma por assinatura." },
        { name: "AHV", what: "O hypervisor embutido baseado em KVM: a peça que transformou um fabricante de infraestrutura numa plataforma de virtualização." },
        { name: "Nutanix Cloud Clusters (NC2)", what: "A mesma pilha rodando em bare metal da AWS e do Azure: nuvem híbrida como um único modelo operacional." },
      ],
      innovations: [
        { title: "A própria hiperconvergência", detail: "A Nutanix transformou armazenamento distribuído em escala web num produto corporativo e obrigou a indústria, VMware vSAN incluído, a seguir a arquitetura que ela provou." },
        { title: "O modelo operacional de um clique", detail: "O padrão de design do Prism (atualizações, capacidade e recuperação como ações únicas) redefiniu as expectativas de como deve ser operar software de infraestrutura." },
      ],
      markets: [
        "Uma líder do mercado de HCI que ela criou, vendendo a Cloud Platform em nuvens privadas e públicas, com o parque VMware pós-Broadcom como a oportunidade competitiva que define seu capítulo atual.",
      ],
      analyst: [
        "Leader nas avaliações de hiperconvergência desde as primeiras edições, revezando a primeira posição com a VMware ao longo de toda a história da categoria.",
      ],
    },
  },
  // NV7 Soluções Tecnológicas: record prose (no profile, no acquisitions).
  "nv7": {
    // Name has no subtitle: carried verbatim so the record reads complete.
    name: "NV7 Soluções Tecnológicas",
    // Card line and page prose.
    tagline: "Publica as próprias políticas de segurança, algo mais raro entre empresas de segurança do que deveria ser.",
    intro:
      "A NV7 Soluções Tecnológicas é uma integradora paulistana de segurança da informação, instalada na Torre Norte do Centro Empresarial Nações Unidas, na Avenida das Nações Unidas. Sua prática se organiza em quatro linhas (segurança de dados, segurança em nuvem, segurança de endpoint e de aplicações), sobre uma carteira de parceiros formada por Palo Alto Networks, F5, CrowdStrike, Forescout, Tenable, Fortinet, Netskope, Claroty e Tuvis.",
    body: [
      "A carteira de clientes se lê como um corte transversal da economia brasileira, e não como um único setor: a bolsa B3, WEG, Honda, Eurofarma, Hypera, Unipar, Tramontina, Assaí, Iguatemi e Unimed ao lado dos negócios digitais (OLX, Locaweb, Loggi, Movida, Neon, Pismo, Catho e Tembici). Uma integradora de segurança que atende ao mesmo tempo uma fabricante de motores e uma startup de pagamentos está resolvendo os mesmos problemas sob restrições muito diferentes de cada lado.",
      "Uma prática a distingue da maioria das empresas da sua categoria. A NV7 publica abertamente a própria documentação de gestão da segurança da informação: um padrão de classificação da informação, um padrão de código malicioso, um padrão de gestão de vulnerabilidades técnicas, procedimentos e responsabilidades operacionais, um padrão de áreas seguras e sua política de resposta a incidentes. A maioria das empresas de segurança descreve o que faria por um cliente e não diz nada sobre o que faz por si mesma.",
      "É uma posição mais difícil de sustentar do que parece. Publicar os próprios controles convida a pergunta óbvia em toda reunião de vendas (se a empresa os cumpre) e elimina a opção de uma resposta vaga. É também a única versão do argumento que tem peso, porque um fornecedor de segurança que pede ao cliente que aceite um padrão que ele mesmo não descreve para si está pedindo uma confiança que não ofereceu.",
      "A parceria com a Claroty marca uma competência específica: tecnologia operacional e sistemas de controle industrial, uma disciplina diferente da segurança corporativa, e não uma extensão dela. Os modos de falha são físicos, os equipamentos antecedem as redes IP em décadas, e as janelas de manutenção se medem em anos. Sua presença ao lado da Forescout na mesma carteira aponta para visibilidade de ativos num parque em que ninguém tem um inventário completo.",
      "A empresa também mantém um patrocínio na Stock Car e um podcast, e sua diretora comercial, Cássia Tavares, falou na conferência de segurança e risco do Gartner sobre a fadiga de confiança entre líderes de segurança: o argumento é que a verificação constante e a suspeita permanente são, elas próprias, uma fonte de esgotamento numa profissão que trata as duas como virtudes.",
    ],
  },
  // OffSec: record prose and the complete profile (no foundings in the English profile; founder's formulation and motto kept in English).
  "offsec": {
    // Name has no subtitle (the parenthesis is the company's former name): carried verbatim.
    name: "OffSec (Offensive Security)",
    // Card line and page prose.
    tagline: "Dá a ferramenta de graça e cobra pela prova de que você sabe usá-la.",
    intro:
      "Mati Aharoni começou o que viria a ser a Offensive Security por volta de 2007 (a empresa foi constituída em 2008), trabalhando da sala de casa com a esposa, Iris, e a Wikipedia cita Devon Kearns como cofundador. Ela faz o Kali Linux, mantém o ExploitDB e emite a OSCP, cuja prova prática de 24 horas tem uma reputação pela qual a maioria das certificações daria muita coisa.",
    body: [
      "A linhagem da ferramenta remonta a duas fusões. O BackTrack apareceu pela primeira vez em maio de 2006, formado pela combinação do WHAX (a distribuição do próprio Aharoni baseada em Slax, antes chamada Whoppix e baseada em Knoppix) com a Auditor Security Collection. Rodou sobre Slackware por três versões, passou para o Ubuntu por mais duas e terminou na 5 R3, em agosto de 2012. Em março de 2013, a equipe o reconstruiu sobre Debian e o lançou como Kali Linux, uma decisão mais difícil do que parece: jogar fora uma distribuição com nome estabelecido e grande base de usuários em favor de uma base que tornava o empacotamento e a manutenção de longo prazo viáveis. Eles escolheram a base sustentável em vez do nome conhecido, que é a decisão correta e quase nunca a popular.",
      "Vale dizer o modelo de negócio com todas as letras, porque ele inverte o habitual. A ferramenta é gratuita e a prova é cara. O Kali não custa nada, é open source e é usado por gente que nunca vai comprar nada. O que a OffSec vende é treinamento e certificação, e a ferramenta gratuita é o que constrói o público para isso. Compare com os fabricantes, em outros pontos desta linha do tempo, que vendem o produto e dão o treinamento; os dois modelos funcionam, e selecionam tipos de cliente inteiramente diferentes.",
      "E então a avaliação, que é o motivo pelo qual este verbete fica ao lado da Pearson VUE e da Prometric, e não longe delas. Essas empresas existem para aplicar provas controladas em salas supervisionadas, onde a pergunta é se a pessoa certa respondeu. A OSCP faz o contrário: vinte e quatro horas, máquinas reais numa rede de teste, comprometê-las e depois escrever o relatório. A prova é o próprio trabalho, e não um substituto dele. Não dá para blefar um shell que você não conseguiu.",
      "Isso inverte o problema da confiança em vez de resolvê-lo, e a inversão tem um custo documentado. Uma prova de múltipla escolha pode ser decorada, e é por isso que as empresas de aplicação investem tanto em verificar que a pessoa na cadeira é o candidato. Uma prova prática não pode ser blefada, mas as máquinas-alvo são reutilizáveis, então conhecê-las de antemão é a trapaça. Em 2019, um crítico publicou o passo a passo de uma máquina da prova e ameaçou publicar mais, alegando que a trapaça era generalizada e que o valor da certificação estava sendo corroído por dentro.",
      "Ponha os dois modos de falha lado a lado e o princípio geral aparece. Todo modelo de avaliação é vulnerável exatamente no ponto de onde vem a sua força. A padronização torna uma prova escalável e decorável. O realismo torna uma prova impossível de falsificar e possível de vazar. Não existe desenho forte nas duas direções, e é por isso que a pergunta séria sobre qualquer certificação não é se ela pode ser burlada, mas de que forma pode ser burlada, e se as pessoas que confiam nela sabem disso.",
      "Aharoni saiu em 2019, depois de mais de duas décadas em segurança. Jim O'Gorman assumiu como líder do projeto Kali, com Raphaël Hertzog, desenvolvedor Debian, como terceiro pilar técnico. Vale notar que o fundador saiu sem que o projeto vacilasse, porque esta linha do tempo registra em outros pontos várias ferramentas que não sobreviveram à saída do autor.",
      "A distribuição também tem uma pegada cultural desproporcional ao número de usuários, tendo aparecido várias vezes em *Mr. Robot*, o raro caso de tecnologia na tela precisa o bastante para que os profissionais não passassem vergonha.",
    ],
    // Complete translated profile: same shape, years and entries as profiles/offsec.ts.
    profile: {
      slug: "offsec",
      foundings: [],
      timeline: [
        {
          year: 2013,
          title: "Noventa mil downloads em cinco dias",
          detail:
            "A recepção do Kali no lançamento. O número importa porque responde a uma pergunta que a reconstrução levantou: se uma base de usuários estabelecida seguiria uma distribuição para uma nova base técnica e um novo nome. Seguiu, imediatamente.",
        },
        {
          year: 2019,
          title: "Dinheiro de fora, e uma troca no comando",
          detail:
            "O primeiro investimento de venture capital, da Spectrum Equity, e um novo CEO. O anterior tinha dirigido a empresa das Filipinas por quatro anos, o que descreve bem o que ela tinha sido até então, e o quanto o financiamento mudou as coisas.",
        },
        { year: 2023, title: "A Offensive Security vira OffSec", detail: "Março. O nome mais curto chegou junto com um catálogo de cursos mais amplo, que é o que um nome encurtado costuma sinalizar." },
      ],
      products: [
        { name: "Kali Linux", what: "A distribuição, gratuita e open source, e a plataforma em que todo curso é ensinado. É ao mesmo tempo o produto, o marketing e a entrada do funil." },
        { name: "Kali NetHunter", what: "A versão móvel, para testar a partir de um celular em vez de um notebook, o que importa em trabalhos presenciais em que carregar um notebook é justamente o que chama a atenção." },
        { name: "ExploitDB", what: "O arquivo de exploits, mantido como recurso público. Qualquer pessoa que pesquisa uma vulnerabilidade acaba chegando aqui, tenha ouvido falar da empresa ou não." },
        { name: "A escada de certificações", what: "A OSCP como porta de entrada, com provas mais avançadas de desenvolvimento de exploits, ataque a aplicações web e evasão acima dela. Todas são práticas, e cada uma leva consideravelmente mais tempo do que a equivalente em qualquer outro programa." },
        { name: "Metasploit Unleashed e VulnHub", what: "Material de treinamento gratuito e máquinas deliberadamente vulneráveis para praticar: o nível abaixo dos cursos pagos, e o motivo pelo qual as pessoas já chegam comprometidas." },
      ],
      innovations: [
        {
          title: "An experiment is worth a thousand theories (um experimento vale mil teorias)",
          detail:
            "A formulação do próprio fundador, e a pedagogia numa linha: não dá para saber se uma defesa funciona raciocinando sobre ela, só atacando-a. Todo curso que esta empresa vende decorre dessa frase, e o formato das suas provas também.",
        },
        {
          title: "Try Harder como política de suporte",
          detail:
            "O lema costuma ser citado como slogan e funciona como algo mais duro: é o que os alunos ouvem no lugar de uma resposta. Recusar ajuda é uma base incomum para uma marca de treinamento, e seleciona com rigor o tipo de pessoa que segue em frente sem ser resgatada, o que é o objetivo ou a crítica, dependendo de quem descreve.",
        },
        {
          title: "Dar o kit de ferramentas inteiro de graça",
          detail:
            "Centenas de ferramentas, empacotadas, mantidas e gratuitas, usadas todo dia por gente que nunca vai pagar nada. O peso da manutenção é real e contínuo, e é carregado porque a distribuição é o que dá significado à certificação: a prova é crível justamente porque todo mundo tem as mesmas ferramentas à disposição.",
        },
      ],
      markets: [
        "Profissionais individuais pagando do próprio bolso com muito mais frequência do que empregadores pagando por eles, além de equipes corporativas de segurança e governo. O comprador muitas vezes é a própria pessoa que faz a prova, o que é incomum num mercado em que a certificação normalmente é uma compra do empregador, e explica boa parte de como os cursos são precificados e escritos.",
        "Ela compete com as entidades certificadoras independentes de fabricante que aparecem em outros pontos desta linha do tempo e com as trilhas de segurança dos próprios fabricantes, com uma proposta que nenhuma delas faz: que a avaliação é o próprio trabalho, e não uma descrição dele.",
      ],
      analyst: [
        "Não há cobertura de analistas para uma empresa privada de treinamento deste porte, e a avaliação relevante é de reputação, e não financeira: gestores de contratação em segurança ofensiva tratam a OSCP como evidência de um jeito que tratam poucas outras credenciais.",
        "A pergunta comercial é separada da pergunta de avaliação discutida acima, e é feita com menos frequência. Uma credencial cujo valor se apoia na escassez está em tensão com um negócio que cresce vendendo mais dela, e um dono com investidores externos tem opinião sobre qual dessas coisas importa. Nada no registro até agora resolve isso para um lado ou para o outro.",
      ],
    },
  },
  // OpenAI: record prose (no profile, no acquisitions).
  "openai": {
    // Name has no subtitle: carried verbatim so the record reads complete.
    name: "OpenAI",
    // Card line and page prose.
    tagline: "Fundada como organização sem fins lucrativos para evitar que a IA fosse controlada por uma única empresa, e hoje em grande parte de propriedade de uma única empresa.",
    intro:
      "A OpenAI foi anunciada em 11 de dezembro de 2015 como organização sem fins lucrativos, com US$ 1 bilhão em financiamento prometido e a missão declarada de construir uma inteligência artificial geral que beneficie toda a humanidade, e de construí-la às claras, e não atrás dos muros de uma única corporação. A estrutura sem fins lucrativos era o ponto: uma proteção deliberada contra a tecnologia acabar controlada pelo Google, pela Microsoft ou por quem quer que fosse.",
    body: [
      "O grupo fundador incluía Sam Altman, Greg Brockman, Elon Musk, Ilya Sutskever, Wojciech Zaremba e John Schulman. Schulman liderou o trabalho de aprendizado por reforço com feedback humano que, mais tarde, fez o ChatGPT parecer uma conversa, e não um gerador de texto.",
      "A estrutura não se sustentou. A OpenAI se reestruturou como sociedade de lucro limitado em 2019 e se converteu em public benefit corporation em 2025. A Microsoft detém cerca de 27% da nova entidade (uns US$ 135 bilhões na rodada de março de 2026), e a organização sem fins lucrativos ficou com 26%. Críticos, entre eles vários ex-funcionários, argumentaram que a conversão reduziu o controle prático da organização sem fins lucrativos sobre o que a empresa faz com o que constrói. Seja qual for a leitura que se faça disso, é uma distância impressionante percorrida desde a premissa fundadora.",
      "O ChatGPT foi lançado em 30 de novembro de 2022 e não estava no plano original de produtos. Chegou a um milhão de usuários em cinco dias e a cem milhões de usuários mensais em dois meses, a adoção pelo consumidor mais rápida de qualquer coisa até então.",
      "Essa data é o marco que vale guardar. Grandes modelos de linguagem existiam antes dela e vinham melhorando havia anos; o que mudou foi que usar um deixou de exigir uma chave de API, um vínculo com pesquisa ou qualquer noção do que é um transformer. A tecnologia não se tornou capaz em novembro de 2022. Ela se tornou disponível.",
    ],
  },
  // Palo Alto Networks: record prose, one acquisition (index-aligned) and the complete profile (first person and quoted words kept).
  "palo-alto": {
    // Name has no subtitle: carried verbatim so the record reads complete.
    name: "Palo Alto Networks",
    // Card line and page prose.
    tagline: "Fundada por um ex-funcionário da Check Point com o argumento de que os números de porta tinham deixado de significar alguma coisa.",
    intro:
      "Nir Zuk fundou a Palo Alto Networks em 2005. Ele tinha sido um dos primeiros funcionários da Check Point e depois fundou a OneSecure, que a NetScreen adquiriu em 2002 e que a Juniper adquiriu junto com a NetScreen em 2004. Saiu no ano seguinte e construiu a empresa que ultrapassaria seu primeiro empregador.",
    body: [
      "A constatação fundadora foi que os firewalls tradicionais tomavam decisões com base em portas e endereços, e as aplicações tinham deixado de respeitar as duas coisas. Tudo passava em túnel pela 80 e pela 443, então uma regra que permitia tráfego web permitia praticamente qualquer coisa, e a política do firewall já não descrevia o que de fato era permitido.",
      "A resposta foi o App-ID: identificar a aplicação pelo próprio tráfego, e não pela porta por onde ele chegava, e escrever a política nesses termos. Essa mudança de enquadramento é o que a indústria acabou chamando de next-generation firewall, e todos os fornecedores estabelecidos acabaram lançando a sua versão, a evidência mais clara de que o argumento estava certo.",
      "Ela abriu capital em 2012 e passou a Check Point em receita de firewall por volta de 2014, cerca de nove anos depois de ter sido fundada por alguém que tinha ajudado a construir os primeiros produtos da Check Point.",
      "Desde então, ela se expandiu por aquisições para endpoint, segurança em nuvem e operações de segurança, e se mostrou notavelmente disposta a comprar categorias em vez de esperar para construí-las, um padrão que esta linha do tempo mostra se repetindo em cada geração de fabricantes de segurança.",
      "A maior dessas compras é a mais recente: a CyberArk, a empresa de acesso privilegiado, anunciada em julho de 2025 por cerca de US$ 25 bilhões e concluída em 11 de fevereiro de 2026, depois relançada como Idira by Palo Alto Networks em maio de 2026, o que fez da segurança de identidade um pilar da plataforma ao lado do firewall com que ela foi fundada.",
    ],
    // Acquisitions: prose only, same order and length as the English list.
    acquisitions: [
      {
        what: "A empresa de privileged access management fundada em Israel em 1999, já então uma plataforma completa de segurança de identidade; a maior aquisição de segurança já registrada no momento do anúncio.",
        became: "Idira by Palo Alto Networks, a plataforma de segurança de identidade relançada com esse nome em maio de 2026; cyberark.com redireciona para ela.",
        sourceNote: "Conclusão e contraprestação segundo o anexo 99.1 do 8-K de 11 de fevereiro de 2026; o enterprise value anunciado segundo o anexo 99.2 do 8-K de 30 de julho de 2025; a mudança de nome segundo a SDxCentral, 13 de maio de 2026, e paloaltonetworks.com/idira (lido em 06/10/2026).",
      },
    ],
    // Complete translated profile: same shape, years and entries as profiles/palo-alto.ts.
    profile: {
      slug: "palo-alto",
      foundings: [
        {
          company: "Palo Alto Networks",
          year: 2005,
          place: "Santa Clara, Califórnia",
          founders: ["Nir Zuk"],
          story:
            "Pelo relato da própria Sequoia, Nir Zuk entrou no estacionamento deles num BMW velho com a placa CHKPKLR, de Check Point killer (o matador da Check Point). Ele tinha cacife para isso: líder de software na Unit 8200 das IDF, depois um dos primeiros engenheiros da Check Point em stateful inspection, cofundador da pioneira em prevenção de intrusão OneSecure e CTO da NetScreen e, depois da aquisição de 2004, da Juniper, o caminho contado na página da NetScreen nesta seção. Ao sair, em 2005, passou nove meses numa mesa da Sequoia lapidando uma ideia: o firewall devia classificar aplicações, usuários e conteúdo, e não portas. Jim Goetz e Asheem Chandna, da Greylock, trouxeram Rajiv Batra para comandar a engenharia, com Yuming Mao, Dave Stevens e Fengmin Gong entre os primeiros construtores, e em janeiro de 2006 a Greylock e a Sequoia financiaram a empresa com uma Series A de US$ 10 milhões.",
        },
      ],
      timeline: [
        { year: 2005, title: "O matador da Check Point é incubado", detail: "De março a dezembro de 2005: uma mesa na Sequoia, uma placa personalizada e nove meses afunilando a tese. A última grande lacuna da segurança corporativa é o próprio firewall, ainda cego para o que realmente passa por ele." },
        { year: 2007, title: "PA-4000: o termo é cunhado", detail: "O primeiro produto é lançado: o App-ID classificando o tráfego por aplicação, usuário e conteúdo numa arquitetura de processamento paralelo de passada única. A própria empresa cunha o rótulo 'next-generation firewall', e a indústria, depois o Gartner, adota a categoria que ela nomeou." },
        { year: 2011, title: "Começa a sequência no Gartner", detail: "O Gartner coloca a Palo Alto Networks pela primeira vez como Leader no Magic Quadrant de firewall corporativo: o início de uma liderança que dura mais do que a de todos os fornecedores estabelecidos que ela desalojou." },
        { year: 2012, title: "O quarto maior IPO de tecnologia do ano", detail: "20 de julho de 2012: a PANW estreia na NYSE, levantando US$ 260 milhões, o 4º maior IPO de tecnologia de 2012 (a listagem passa para a Nasdaq em outubro de 2021)." },
        { year: 2013, personal: true, title: "O meu capítulo", detail: "De 2013 a 2015: a atuação focada contada acima, com firewalls de nova geração levados pelo canal brasileiro de revendas e integradores e para a sala de aula, nos anos entre a estreia no Gartner e a era da plataforma. Uma atuação passada; não está entre as plataformas ensinadas hoje." },
        { year: 2014, title: "Além da caixa", detail: "A Cyvera vira a linha de endpoint Traps; a equipe de pesquisa de ameaças Unit 42 dá à empresa uma voz pública em inteligência; e a Palo Alto cofunda a Cyber Threat Alliance com Fortinet, McAfee e NortonLifeLock, rivais compartilhando inteligência de ameaças 'for the greater good' (pelo bem maior)." },
        { year: 2018, title: "Arora e a plataformização", detail: "Junho de 2018: Nikesh Arora, ex-executivo do Google e da SoftBank, assume como CEO. A estratégia passa a ser a própria consolidação (Strata para segurança de rede, Prisma para nuvem, com Evident.io e RedLock dando origem ao Prisma Cloud, Cortex para o SOC), comprando e construindo rumo a uma única plataforma." },
        { year: 2024, title: "A maior independente", detail: "A receita do ano fiscal de 2024 chega a US$ 8,03 bilhões, alta de 16 por cento, atendendo mais de 70.000 organizações em mais de 150 países, entre elas 85 das Fortune 100, como a maior fabricante independente de cibersegurança em valor de mercado. Em agosto de 2025, Nir Zuk se aposenta como CTO, entregando produto e tecnologia a Lee Klarich, na equipe desde 2006." },
        { year: 2026, title: "CyberArk: o maior negócio da história da segurança", detail: "Anunciada em 30 de julho de 2025 a um valor de referência perto de US$ 25 bilhões e concluída em 11 de fevereiro de 2026 (US$ 45 em dinheiro mais 2,2005 ações da PANW por ação da CyberArk, aprovada por 99,8 por cento dos votos), a aquisição faz da identidade o terceiro pilar da plataforma, ao lado da segurança de rede e do SOC. O próprio 10-Q da Palo Alto registra uma contraprestação total de compra de US$ 21,1 bilhões: US$ 2,3 bilhões em dinheiro e 112 milhões de ações.", sourceNote: "10-Q da PANW do ano fiscal de 2026 (contraprestação contábil); condições do anúncio segundo a cobertura da época." },
      ],
      products: [
        { name: "PAN-OS e App-ID", what: "O sistema operacional e o motor de classificação que deram início a tudo: aplicações, usuários e conteúdo como primitivas da política, inspecionados uma vez numa única passada." },
        { name: "Strata e Prisma SASE", what: "O parque de segurança de rede: NGFW em hardware, virtual e entregue pela nuvem, com o Prisma Access e a linhagem SD-WAN da CloudGenix levando o firewall para o SASE." },
        { name: "Prisma Cloud", what: "A plataforma de segurança cloud-native montada a partir de Evident.io, RedLock, Twistlock e sucessoras: proteção do código ao runtime nas nuvens públicas." },
        { name: "Cortex", what: "A plataforma do SOC: detecção XDR, automação XSOAR vinda da Demisto e o XSIAM, a aposta em operações de segurança guiadas por IA da era da plataformização." },
        { name: "Segurança de identidade CyberArk", what: "O terceiro pilar de 2026: acesso privilegiado e identidade para humanos, máquinas e agentes de IA, a maior capacidade que a Palo Alto já comprou." },
      ],
      innovations: [
        { title: "O firewall que enxerga aplicações", detail: "O App-ID fez da aplicação, e não da porta, a unidade da política: a ruptura de arquitetura que definiu a categoria e obrigou todos os rivais a segui-la." },
        { title: "Dar nome à categoria", detail: "'Next-generation firewall' foi uma criação da própria empresa: prova rara de que uma startup pode definir o vocabulário que toda a sua indústria, e os seus analistas, acabam usando." },
        { title: "Plataformização", detail: "Sob Arora, a consolidação virou o produto: rede, nuvem, SOC e agora identidade vendidos como uma só plataforma, com o mercado premiando a estratégia numa escala que nenhuma empresa só de segurança tinha alcançado." },
        { title: "A obra-prima da máfia", detail: "Esta empresa é a maior obra da diáspora da NetScreen: a mesma linhagem que produziu a Fortinet e a Northern Light produziu, por meio de Zuk, a maior empresa da indústria de segurança, e a sua maior aquisição." },
      ],
      markets: [
        "A Palo Alto Networks fecha o círculo de segurança desta seção de carreira: o fio que começa na Check Point e passa por OneSecure, NetScreen e Juniper nas páginas anteriores termina aqui, na maior empresa independente de cibersegurança do mundo, que em 2026 absorveu a CyberArk no maior negócio que a indústria já viu.",
        "O meu capítulo foram os anos de canal, de 2013 a 2015: firewalls de nova geração por meio de revendas e integradores brasileiros, com aulas em paralelo. Uma atuação passada, registrada aqui como a última parada da estrada da carreira.",
      ],
      analyst: [
        "O Gartner coloca a Palo Alto Networks como Leader no seu Magic Quadrant de firewall desde 2011, uma sequência que atravessa toda a era da plataforma e as duas gerações de CEO.",
        "A escala, em números primários: receita de US$ 8,03 bilhões no ano fiscal de 2024; 85 das Fortune 100 como clientes; e uma compra da CyberArk registrada em US$ 21,1 bilhões de contraprestação, contra um valor anunciado de cerca de US$ 25 bilhões, a maior transação da história da cibersegurança.",
      ],
      careerLink: {
        // The href is a fact and stays the English record's.
        href: "/industry/chapters/netscreen-juniper",
        label: "O caminho de Nir Zuk passa pela página da NetScreen, onde começa o círculo de segurança desta seção",
      },
    },
  },
  // Ping Identity: record prose and the complete profile (two foundings; first person kept).
  "ping-identity": {
    // Name has no subtitle: carried verbatim so the record reads complete.
    name: "Ping Identity",
    // Card line and page prose.
    tagline: "Apostou cedo que a identidade teria de funcionar entre organizações, e não só dentro de uma.",
    intro:
      "Andre Durand fundou a Ping Identity em Denver em 2002, apostando em algo que hoje parece óbvio e na época não parecia: que o problema difícil de identidade não era autenticar a própria equipe, mas deixar os usuários de uma organização entrarem nas aplicações de outra sem que nenhum dos lados compartilhasse um banco de senhas.",
    body: [
      "A federação é a resposta, e os padrões que a fazem funcionar (o SAML e, depois, o OAuth e o OpenID Connect) estavam sendo escritos mais ou menos no momento em que a empresa foi fundada. A Ping construiu produtos sobre eles desde cedo e se tornou um dos fabricantes cujas implementações definiram o que interoperabilidade significava na prática.",
      "Vale explicitar a ideia por baixo, porque é fácil deixá-la passar: uma asserção assinada por uma parte em quem você confia é melhor do que uma credencial que você precisa guardar. Ela desloca o problema de segurança de proteger segredos para verificar assinaturas, e toda implantação de single sign-on desde então se apoia nessa troca.",
      "O controle mudou várias vezes. A Vista Equity Partners fechou o capital da empresa em 2016, ela voltou à bolsa em 2019, e a Thoma Bravo fechou o capital de novo em 2022, a mesma firma que aparece em outros pontos desta linha do tempo como dona da Sophos e da LANDESK.",
      "Em 2023, a Thoma Bravo adquiriu a ForgeRock e a combinou com a Ping, juntando dois dos maiores fabricantes independentes de identidade e deixando o portfólio combinado com duas linhas de produtos sobrepostas para conciliar.",
    ],
    // Complete translated profile: same shape, years and entries as profiles/ping-identity.ts.
    profile: {
      slug: "ping-identity",
      foundings: [
        {
          company: "Ping Identity",
          year: 2002,
          place: "Denver, Colorado",
          founders: ["Andre Durand", "Bryan Field-Elliot"],
          story:
            "Andre Durand já tinha dado à internet um protocolo aberto de mensagens (ele fundou a Jabber, cuja linhagem XMPP a Cisco adquiriu em 2008) quando se voltou para um problema de federação mais difícil: a identidade. A Ping Identity, fundada em Denver em 2002 com Bryan Field-Elliot, apostou que as empresas precisariam confiar nos logins umas das outras através das fronteiras organizacionais e se tornou porta-estandarte do SAML e dos protocolos de federação que vieram depois. Duas décadas depois, a empresa que Durand ainda lidera sustenta a identidade de mais da metade das Fortune 100.",
        },
        {
          company: "ForgeRock",
          year: 2010,
          place: "Oslo, Noruega (sede nos EUA depois em San Francisco)",
          founders: ["Lasse Andresen", "Jonathan Scudder", "Hermann Svoron", "Steve Ferris", "Victor Ake"],
          story:
            "Quando a Oracle concluiu a aquisição da Sun Microsystems em janeiro de 2010 e suspendeu o trabalho de identidade open source da Sun, cinco dos engenheiros que o tinham construído se recusaram a deixá-lo morrer. Em fevereiro de 2010, fundaram a ForgeRock na Noruega, com um capital semente famosamente pequeno, e fizeram um fork da pilha que conheciam linha por linha: o OpenSSO virou OpenAM, a linhagem de diretório virou OpenDJ, e o OpenIDM e o OpenIG cresceram ao lado, amadurecendo na ForgeRock Identity Platform. É uma das grandes histórias de bote salva-vidas do open source: uma decisão de roadmap corporativo desfeita pelas pessoas que tinham escrito o código, que depois levaram o produto resgatado até a New York Stock Exchange.",
        },
      ],
      timeline: [
        { year: 2002, title: "Fundada sobre a federação", detail: "A Ping começa em Denver com uma tese anos à frente do seu mercado: o single sign-on devia atravessar as fronteiras entre empresas, sustentado por padrões abertos, e não por senhas compartilhadas." },
        { year: 2003, title: "PingFederate", detail: "O servidor de federação principal, e o produto que tornou o argumento concreto: um identity provider de um lado, um service provider do outro, e uma asserção assinada atravessando entre duas organizações que não compartilham diretório. Ele se tornou o cavalo de batalha corporativo para conectar equipes e parceiros a aplicações, e a implementação de referência contra a qual muitas integrações foram testadas." },
        { year: 2005, title: "A Sun Microsystems abre o código do OpenSSO", detail: "Começa a outra linhagem: a Sun lança a herança do seu Java System Access Manager como o projeto open source OpenSSO, DNA do iPlanet e do Sun ONE agora desenvolvido às claras. A linhagem de diretório da Sun vai junto.", sourceNote: "Histórico de planejamento de implantação do AM da própria ForgeRock." },
        { year: 2010, title: "ForgeRock: o fork que salvou a pilha de identidade da Sun", detail: "A Oracle conclui a aquisição da Sun em janeiro de 2010 e suspende o OpenSSO. Em fevereiro, cinco ex-engenheiros da Sun fundam a ForgeRock na Noruega para levar o código adiante: o OpenSSO renasce como OpenAM, o diretório como OpenDJ, com o OpenIDM e o OpenIG se juntando, as sementes da ForgeRock Identity Platform.", sourceNote: "Os registros da empresa indicam fevereiro de 2010; a pessoa jurídica norueguesa ForgeRock AS foi constituída em outubro de 2009." },
        { year: 2016, title: "A Vista fecha o capital da empresa", detail: "Junho de 2016: a Vista Equity Partners adquire o controle majoritário por cerca de US$ 600 milhões, financiando a expansão da federação para uma plataforma completa de identidade: MFA, gestão de acesso, diretório e a nuvem PingOne." },
        { year: 2019, title: "IPO na NYSE", detail: "Setembro de 2019: a Ping abre capital na New York Stock Exchange como PING, três anos como empresa aberta que terminam como boa parte da década do mercado de identidade terminou, nas mãos de private equity." },
        { year: 2021, title: "IPO da ForgeRock: FORG", detail: "16 de setembro de 2021: onze anos e cerca de US$ 233,7 milhões em financiamento depois do fork, a ForgeRock abre capital na New York Stock Exchange, subindo cerca de 44 por cento no primeiro dia, a uma avaliação de cerca de US$ 2 bilhões: a pilha open source resgatada tocando o sino." },
        { year: 2022, title: "Thoma Bravo, US$ 2,8 bilhões", detail: "18 de outubro de 2022: a Thoma Bravo conclui o fechamento de capital da Ping, todo em dinheiro, a US$ 28,50 por ação, uma peça da onda de compras de identidade da firma ao lado da SailPoint e, com acordo assinado dias antes, da ForgeRock.", sourceNote: "Comunicado à imprensa da Thoma Bravo." },
        { year: 2023, title: "A ForgeRock é incorporada", detail: "23 de agosto de 2023: a Thoma Bravo conclui a aquisição da ForgeRock, de cerca de US$ 2,3 bilhões, e a combina com a Ping no mesmo dia, unindo duas Leaders do Magic Quadrant de Access Management sob Durand: uma fusão de rivais diretas executada em cerca de cem dias.", sourceNote: "Comunicado à imprensa da Thoma Bravo; as duas empresas eram Leaders no MQ de Access Management de 2023 do Gartner." },
        { year: 2024, title: "Uma plataforma, as duas heranças", detail: "A empresa combinada racionaliza os portfólios sobrepostos sem migrações forçadas: o PingOne e a linhagem ForgeRock continuam lado a lado, com a orquestração (DaVinci) como tecido conectivo entre identidade de força de trabalho e de clientes." },
        { year: 2026, personal: true, title: "O meu capítulo", detail: "PingFederate Practitioner em 2025 pelo Ping Identity Training, e o capítulo de identidade se abrindo em 2026: os protocolos que este hub cobre são os que carregam o resto do portfólio." },
      ],
      products: [
        { name: "PingFederate", what: "O servidor corporativo de federação: intermediação SAML, OAuth e OpenID Connect para single sign-on de equipes e parceiros; o produto com que as ferramentas de identidade deste site mais conversam." },
        { name: "PingOne", what: "A plataforma de identidade em nuvem: SSO, MFA (PingID), risco e verificação de identidade entregues como SaaS." },
        { name: "PingOne DaVinci", what: "Orquestração de identidade no-code: o construtor visual de jornadas (vindo da aquisição da Singular Key) que costura sinais de autenticação, risco e fraude em fluxos." },
        { name: "PingAccess e PingDirectory", what: "Aplicação de políticas de acesso a web/API e o diretório de alta escala que sustenta grandes implantações." },
        { name: "ForgeRock Identity Platform (Advanced Identity Cloud)", what: "A herança da ForgeRock levada adiante depois da fusão: Access Management, Identity Management, Directory Services e Identity Gateway, as linhagens OpenAM, OpenIDM, OpenDJ e OpenIG, com journey Trees para orquestração." },
      ],
      innovations: [
        { title: "A federação como produto", detail: "Transformar o SAML de especificação em software corporativo confiável: a contribuição fundadora da Ping, e o motivo pelo qual 'PingFederate' virou quase um substantivo comum no trabalho de identidade." },
        { title: "Orquestração de identidade", detail: "A orquestração em tempo de jornada do DaVinci (montar visualmente verificações de autenticação e de fraude), uma das capacidades que os analistas destacaram tanto na Ping quanto na ForgeRock." },
        { title: "Open source como bote salva-vidas", detail: "O movimento fundador da ForgeRock, fazer o fork do OpenSSO e do OpenDS no mesmo mês em que a Oracle os engavetou, continua sendo uma prova canônica de que o licenciamento aberto permite que uma comunidade sobreviva a um roadmap corporativo." },
        { title: "A consolidação da identidade", detail: "A combinação Ping-ForgeRock: prova de que até rivais diretas de IAM podiam ser fundidas numa única empresa de plataforma sem forçar migrações de clientes." },
      ],
      markets: [
        "A Ping compete no topo da gestão de identidade e acesso de força de trabalho e de clientes contra Microsoft e Okta, concentrada em empresas grandes e complexas (bancos, operadoras, governos), onde implantação híbrida, profundidade em padrões e orquestração decidem o negócio.",
      ],
      analyst: [
        "A Ping Identity e a ForgeRock foram ambas apontadas como Leaders no Magic Quadrant de Access Management de 2023 do Gartner, o ano em que a Thoma Bravo as combinou numa única empresa.",
      ],
    },
  },
  // Procera Networks: record prose (no profile, no acquisitions).
  "procera-networks": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Procera Networks - a empresa que lê o tráfego",
    // Card line and page prose.
    tagline: "Fabricante de deep packet inspection, com o capital fechado em 2015 e fundida à Sandvine em 2017.",
    intro:
      "A Procera Networks construía sistemas de deep packet inspection (o PacketLogic), que identificam o que um fluxo de aplicação realmente é, para que uma operadora possa medi-lo, priorizá-lo, cobrar por ele ou bloqueá-lo. A Francisco Partners fechou o capital da empresa em 2015 por US$ 240 milhões e a fundiu com sua rival de longa data, a Sandvine, em 2017, mantendo o nome Sandvine.",
    body: [
      "Deep packet inspection é a mesma capacidade descrita em outros pontos deste site sob o tema filtragem, e levanta a mesma pergunta. Um sistema capaz de distinguir um stream de vídeo de uma chamada de voz, para que a chamada de voz não sofra atraso, é exatamente o mesmo sistema capaz de saber que uma pessoa está usando determinado aplicativo de mensagens. A engenharia não distingue entre esses usos; só a política e a lei distinguem.",
      "Não é uma observação abstrata sobre esta empresa. Em 2016, um engenheiro pediu demissão por causa de uma implantação proposta, e a Forbes noticiou o uso da tecnologia na Turquia no mesmo ano. Os dois fatos são citados aqui porque uma linha do tempo que registra o que um equipamento faz deve registrar para que ele foi usado, e porque as pessoas que constroem esses sistemas às vezes são as primeiras a dizê-lo.",
      "A história comercial é mais curta. Capital aberto por meio de uma fusão reversa em 2003, na NASDAQ a partir de 2011, comprada sob pressão de acionistas ativistas em 2015 e depois fundida com a concorrente contra a qual tinha passado uma década, as duas já então controladas pelo mesmo investidor. Duas rivais num mercado acabam como uma só empresa porque um comprador quis as duas, um padrão que esta linha do tempo registra repetidamente.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A Procera Networks teve o capital fechado por afiliadas da Francisco Partners em uma fusão concluída em 5 de junho de 2015, e em 2017 a Francisco Partners anunciou que combinaria a Procera com a Sandvine sob o nome Sandvine.",
  },
  // Prodesp: record prose (no profile); Brazilian place names take their Portuguese diacritics.
  "prodesp": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Prodesp - o estado de São Paulo, computado",
    // Card line and page prose.
    tagline: "Criada em 1969 com dois funcionários e nenhum equipamento; hoje opera a rede e o data center do estado.",
    intro:
      "A Prodesp foi criada em 24 de julho de 1969 por decreto estadual e começou a trabalhar em outubro daquele ano numa sala emprestada da Secretaria da Fazenda, com dois funcionários e nenhum equipamento. Sua primeira máquina, um IBM 360/65 comprado por cerca de nove milhões de dólares, rodou o primeiro trabalho em julho de 1970: a folha de pagamento de um governo estadual que então empregava 290.000 pessoas.",
    body: [
      "A Prodesp foi criada em 24 de julho de 1969 pelo Decreto Estadual 137 e começou a operar em outubro daquele ano com dois funcionários, nenhum equipamento e uma sala emprestada no prédio da Secretaria da Fazenda, no centro de São Paulo. A primeira sede própria, em 1970, foi uma casa de três andares na Ponte Pequena.",
      "A primeira máquina foi um IBM 360/65 que custou cerca de nove milhões de dólares, e o primeiro trabalho, em julho de 1970, foi a folha de pagamento do estado, então com 290.000 servidores. A distância entre esses dois fatos e as duas pessoas numa sala emprestada no ano anterior é todo o caráter da computação estatal daquela época: a instituição era improvisada, e a carga de trabalho não era opcional.",
      "O que veio depois é uma tensão que todo grande parque acaba enfrentando. Enquanto se consolidava fisicamente numa nova sede em Taboão da Serra, a empresa descentralizou deliberadamente sua operação: um centro regional em Bauru, unidades dedicadas à segurança pública e ao hospital-escola, e seus primeiros serviços de teleprocessamento. O parque de equipamentos mais do que dobrou entre 1987 e 1989, e a Rede Estadual de Processamento de Dados instalou centros regionais de computação em Campinas, Bauru, Presidente Prudente e Ribeirão Preto.",
      "O motivo para registrar isso é que aconteceu por razões de geografia e de política, e não de arquitetura. O estado de São Paulo é maior do que a maioria dos países, o interior precisava de atendimento, e o país se democratizava ao mesmo tempo. Centralizar o prédio e distribuir o processamento é uma decisão a que a maioria das empresas chega muito mais tarde e costuma descrever como inovação. Em 2021, a Prodesp absorveu a Imprensa Oficial, uma instituição com 130 anos de história própria.",
    ],
  },
  // Prolan: record prose (no profile, no acquisitions).
  "prolan": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Prolan - a promessa medida em horas",
    // Card line and page prose.
    tagline: "Uma integradora paulistana cujo diferencial declarado é o alcance: suporte em mais de 950 localidades.",
    intro:
      "A Prolan é uma integradora de sistemas brasileira sediada em São Paulo, que atua em redes e comunicações corporativas.",
    body: [
      "A Prolan é uma integradora paulistana cuja filosofia declarada é incomumente específica para a categoria: uma cultura enraizada em redes, com base no princípio de que a rede é o mecanismo vital da informação, e não um sistema entre vários. Seu trabalho é descrito como projetos de rede de alcance mundial para corporações e instituições financeiras, e estratégia para órgãos de governo e operadoras de telecomunicações.",
      "O número que merece uma pausa não é uma tecnologia. A Prolan declara cobertura de suporte em mais de 950 localidades brasileiras, com atendimento em quatro horas, e em uma hora nas principais cidades, a partir de centros que funcionam ininterruptamente.",
      "É uma afirmação de logística, e neste país a logística é a parte difícil. Um parque distribuído no Brasil falha em algum lugar longe dos engenheiros, e a integradora capaz de estar lá no mesmo dia está resolvendo um problema de geografia, e não de protocolo. É a mesma restrição que moldou as operadoras e o modelo de distribuição, chegando aqui como uma promessa sobre horários de chegada.",
    ],
  },
  // SANS Institute: record prose (no profile, no acquisitions).
  "sans-institute": {
    // Company kept verbatim; only the subtitle is localised.
    name: "SANS Institute - a cooperativa que virou a escola da profissão de segurança",
    // Card line and page prose.
    tagline: "Fundado em 1989 por um ex-projetista de navios da Marinha e sua esposa como uma cooperativa para troca de informações técnicas; hoje é a maior organização de treinamento em segurança que existe, com entidade certificadora própria, faculdade credenciada própria e a sua própria violação de dados, em 2020.",
    intro:
      "O SANS Institute é uma organização americana de treinamento e pesquisa em cibersegurança fundada em 1989 por Alan Paller, que opera a entidade certificadora GIAC e o SANS Technology Institute, a primeira faculdade credenciada dedicada à cibersegurança.",
    body: [
      "Alan Paller tinha usado computadores para projetar navios para a Marinha, cofundado uma empresa de timesharing no Havaí e dirigido uma consultoria de computação gráfica antes de, em 1989, ele e a esposa criarem uma cooperativa por meio da qual profissionais de segurança da informação pudessem trocar informações técnicas e receber treinamento. A razão social ainda é Escal Institute of Advanced Technologies; todo mundo a chama de SANS. A convicção de Paller, que segundo quem trabalhou com ele nunca vacilou, era que a segurança só podia melhorar elevando o nível de habilidade das pessoas que a praticam, e não comprando produtos, e ele construiu a instituição em torno dessa única ideia por trinta e dois anos, até se afastar em abril de 2021; morreu em novembro daquele ano, aos setenta e seis.",
      "Três coisas cresceram a partir da cooperativa. Os cursos, ministrados por profissionais que ainda fazem o trabalho, em imersões de uma semana que se tornaram o vocabulário comum da profissão: em 2021, cerca de quarenta mil pessoas por ano e, pela contagem posterior da própria organização, muito mais. A GIAC, a entidade certificadora afiliada, cujas cerca de trinta e cinco provas práticas são as credenciais que os empregadores da área de fato reconhecem, e que já emitiu mais de 230.000 delas. E o SANS Technology Institute, fundado em 2005, a primeira faculdade com credenciamento regional dedicada à cibersegurança, o que significa que um mestrado em segurança existe porque uma empresa de treinamento decidiu que devia existir.",
      "O registro também traz as duas críticas que o acompanham por toda parte, e um incidente. Os cursos são caros, e o debate sobre se um profissional individual recupera o custo é permanente. Parte do material (defesa ativa, hacking back) fica numa zona cinzenta jurídica, e o instituto o ensina mesmo assim. E, em 2020, o instituto confirmou uma violação própria que expôs as informações pessoais de milhares das pessoas que ele treina. O verbete da Trend Micro registra um fabricante de segurança pego pelo próprio insider; aqui, a escola de segurança foi pega pela coisa que ensina as pessoas a pegar. Nenhum dos dois é motivo para pensar menos do ensino. Os dois são o motivo pelo qual o ensino é necessário.",
      "Para um instrutor de redes e segurança, o instituto é o padrão contra o qual o modelo autorizado pelos fabricantes é medido. Um curso de fabricante ensina um produto; um curso do SANS ensina uma disciplina que sobrevive a todos os produtos que há nela. Os dois não são rivais (um profissional precisa de ambos), mas respondem a perguntas diferentes, e a diferença é aquela em torno da qual os verbetes de centros de treinamento da enciclopédia vivem girando: se o que está sendo certificado é uma ferramenta ou uma pessoa.",
    ],
  },
  // Sonda: record prose (no profile, no acquisitions).
  "sonda": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Sonda - a maior empresa de tecnologia da América Latina é chilena",
    // Card line and page prose.
    tagline: "Multinacional chilena de serviços de TI fundada em 1974, que se tornou a maior prestadora do Brasil comprando treze empresas.",
    intro:
      "A SONDA (Sociedade Nacional de Processamento de Dados) foi fundada em Santiago em 1974 por Andres Navarro com os irmãos e o apoio da Copec, começando com dez programadores. Hoje é a maior empresa de serviços de tecnologia da informação da América Latina, presente em dez países, com cerca de vinte e dois mil funcionários.",
    body: [
      "Sua história brasileira é a que esta linha do tempo precisa, porque inverte a direção habitual. A Sonda chegou no início dos anos 2000, achou lento o crescimento orgânico e, em vez disso, entrou comprando: mais de trezentos milhões de dólares em empresas brasileiras em dez anos, começando pela Imares em 2002 e passando pela Procwork em 2007, por US$ 118 milhões, depois Telsinc, Softeam e Kaizen em 2010, Pars em 2012, CTIS em 2014, por R$ 400 milhões, e 60% da operadora de data centers Ativas em 2016.",
      "A compra da CTIS a tornou a maior prestadora de serviços de tecnologia da informação do Brasil. Ou seja, o maior fornecedor do mercado brasileiro é uma empresa chilena, montada a partir de empresas brasileiras, e quase todo relato desta indústria escrito em inglês descreve a tecnologia latino-americana como algo que acontece à região, e não dentro dela.",
      "Os nomes que ela comprou deixaram de existir em janeiro de 2012, quando Sonda Procwork, Sonda Software, Sonda Telsinc e Sonda Kaizen foram unificadas como Sonda IT. É o mesmo apagamento que esta linha do tempo registra para a CPM Braxis e para a Etek: o conhecimento prático continua sob uma marca única, e as histórias ficam invisíveis a menos que alguém as escreva.",
      "O que ela de fato faz é menos glamoroso do que a aritmética das aquisições e mais importante: modernização do setor público. Sistemas de registro civil e de compras públicas no Chile, rastreabilidade animal no Uruguai e controle de tráfego tanto em Santiago quanto em São Paulo. Sistemas que o cidadão nunca escolhe e dos quais não pode escapar.",
    ],
  },
  // Stefanini: record prose and the complete profile (no foundings in the English profile).
  "stefanini": {
    // Name has no subtitle: carried verbatim so the record reads complete.
    name: "Stefanini",
    // Card line and page prose.
    tagline: "Um professor a começou num quarto vago, e foi o ensino que conquistou os primeiros trabalhos.",
    intro:
      "Marco Stefanini fundou a empresa em 1987 num quarto da própria casa em São Paulo, aos 26 anos. Não era uma consultoria. Ela começou como um negócio de treinamento, dando cursos de programação e tecnologia para funcionários de grandes empresas, e só migrou para consultoria de TI cerca de dois anos depois.",
    body: [
      "Vale contar o caminho até ali, porque quase nada dele foi planejado. Ele estudou geologia na Universidade de São Paulo, passou um mês numa mina de cassiterita no interior de Goiás e concluiu que a profissão não era para ele. Com dificuldade de encontrar trabalho em São Paulo, foi para a tecnologia por incentivo da irmã, que já estava no Serpro, o serviço federal de processamento de dados, fez um curso de análise de sistemas e entrou no departamento de TI do Bradesco. Também trabalhou na Engesa, a fabricante de veículos militares, e na IBM.",
      "E ele dava aulas na época, e esse é o detalhe que importa. Pelo próprio relato, como já dava aulas, entrar no ramo de treinamento foi natural, e foi essa habilidade que conquistou os primeiros projetos da empresa. O negócio de um professor virou um negócio de tecnologia, e não o contrário.",
      "O primeiro escritório tinha trinta e oito metros quadrados. O momento era bom: os grandes bancos e grupos industriais brasileiros estavam se informatizando, e uma empresa capaz de treinar pessoas e também de fornecê-las não encontrava falta de trabalho. Vieram depois o desenvolvimento de sistemas e o outsourcing de TI, e nos primeiros anos a empresa foi inteiramente nacional.",
      "Então ela foi para fora, algo que as empresas brasileiras de tecnologia em geral não fizeram. A expansão para outros mercados se tornou a estratégia central de crescimento, e não um detalhe, e o resultado é uma empresa realmente incomum: uma multinacional brasileira num setor em que as multinacionais quase sempre chegam de outro lugar. Em 2025, ela declarava operações em 41 países e mais de 35.000 funcionários falando 45 idiomas, com receita em torno de US$ 1,4 bilhão em 2024. Um estudo da Fundação Dom Cabral chegou a classificá-la como a quinta empresa brasileira mais internacionalizada de qualquer setor.",
      "O crescimento se deu em boa parte por aquisições, e a empresa diz isso com todas as letras, com uma meta declarada de R$ 2 bilhões em compras até 2027, e faz questão de não ser alavancada, o que, num ambiente de juros altos, é menos uma vantagem a exibir do que uma explicação de por que ela consegue continuar comprando quando outras não conseguem.",
      "Lidas ao lado do verbete da HCL, as duas formam um par simétrico, invertido. Lá, o fundador de uma empresa de tecnologia criou um instituto de treinamento em 1982 porque uma indústria nacional não consegue crescer mais depressa do que a oferta de gente capaz de trabalhar nela: treinamento construído como infraestrutura para um negócio. Aqui, o treinamento veio primeiro e o negócio cresceu a partir dele. As duas empresas concluíram que ensino e serviços de tecnologia são o mesmo ofício abordado por pontas diferentes, uma conclusão pela qual este site tem certa simpatia.",
    ],
    // Complete translated profile: same shape, years and entries as profiles/stefanini.ts.
    profile: {
      slug: "stefanini",
      foundings: [],
      timeline: [
        {
          year: 1996,
          title: "Buenos Aires, e o motivo",
          detail:
            "O primeiro escritório fora do Brasil. O gatilho não foi ambição no exterior, mas pressão em casa: ao longo dos anos 1990, as grandes empresas internacionais de serviços chegaram ao Brasil e, em vez de disputar com elas as mesmas contas nacionais, a empresa foi competir nos mercados delas. Ir para fora foi um movimento defensivo que virou a estratégia.",
        },
        {
          year: 2009,
          title: "O método muda, a direção não",
          detail:
            "Até a crise financeira, expandir significava abrir escritórios e construir operações do zero. A crise desvalorizou moedas e ativos a ponto de comprar uma empresa estabelecida custar menos do que construir uma, e a empresa mudou de método. A TechTeam (Michigan, 2.300 funcionários, subsidiárias em dezesseis países) foi conquistada contra outros sete interessados.",
        },
        { year: 2025, title: "Mais de quarenta aquisições depois", detail: "Mais de quarenta compras desde a fundação, treze delas em quatro anos, com uma meta declarada de mais R$ 2 bilhões até 2027." },
      ],
      products: [
        { name: "Desenvolvimento e manutenção de aplicações", what: "O negócio original de consultoria: construir e operar software para organizações que preferem não empregar as pessoas que fazem isso." },
        { name: "Outsourcing de TI e service desk", what: "O negócio de volume, e o que tornou necessária a presença internacional: dar suporte a um cliente multinacional significa dar suporte onde quer que ele opere." },
        { name: "Serviços digitais e de dados", what: "Migração para a nuvem, análise de dados e automação, boa parte adquirida e não construída, incluindo práticas especializadas em torno de provedores de nuvem específicos." },
        { name: "Plataformas verticais", what: "Software bancário e financeiro vendido como produto, e não como projeto: a tentativa que toda empresa de serviços faz de ganhar dinheiro de outro jeito que não por hora." },
      ],
      innovations: [
        {
          title: "Internacionalizar fugindo da concorrência, e não indo atrás da oportunidade",
          detail:
            "O relato habitual de uma empresa que vai para fora envolve uma demanda que ela quer alcançar. Esta foi para fora porque a concorrência tinha vindo até ela. É um cálculo diferente e mais difícil, já que as empresas que ela seguiu até em casa eram maiores, mais conhecidas e atuavam em mercados onde ninguém tinha ouvido falar dela.",
        },
        {
          title: "Viajar com o passaporte dos clientes",
          detail:
            "Abrir num país novo é mais fácil quando um cliente atual já opera lá e quer o mesmo fornecedor. As multinacionais que ela atendia no Brasil forneceram tanto o motivo inicial para estar presente quanto a primeira receita na chegada, que é o único jeito barato de uma empresa de porte médio entrar num mercado estrangeiro.",
        },
        {
          title: "Construir até comprar ficar barato",
          detail:
            "Expansão greenfield até 2009 e aquisições depois disso é uma empresa lendo corretamente o mercado de câmbio. Uma desvalorização torna ativos estrangeiros baratos para quem tem outra moeda, e a mesma crise que fechou oportunidades para outros abriu esta, e é por isso que a estratégia de aquisições data de uma recessão, e não de um boom.",
        },
        {
          title: "A retenção como métrica de verdade",
          detail:
            "Cerca de 97% de retenção de clientes, com relacionamento médio perto de doze anos, é o número que importa neste negócio. Empresas de serviços não costumam perder contratos para propostas melhores; perdem decepcionando alguém aos poucos. Um índice de retenção é uma afirmação de que isso não acontece, sustentada por uma década.",
        },
      ],
      markets: [
        "Serviços financeiros acima de tudo no Brasil e na América Latina, e automotivo e manufatura no resto do mundo: dois centros de gravidade diferentes numa só empresa, refletindo de onde veio o trabalho de cada região.",
        "Ela compete com os integradores de sistemas globais e com as grandes empresas indianas de serviços, com uma presença realmente mundial, mas uma escala que não é. Cerca de 40% da receita hoje vem de fora do Brasil.",
      ],
      analyst: [
        "Sua característica distintiva é fácil de dizer e difícil de alcançar: é uma multinacional de serviços de tecnologia com sede num país que em geral as recebe. Os rankings de empresas brasileiras internacionalizadas a colocam perto do topo há anos, depois de a terem colocado em décimo sétimo lugar em 2011.",
        "A trajetória a observar é se uma empresa construída sobre arbitragem de mão de obra e relacionamento com clientes consegue manter esses relacionamentos à medida que o próprio trabalho fica mais automatizado. Relacionamentos com média de doze anos são um ativo num mercado estável e um passivo num mercado em que o serviço comprado muda por baixo do contrato.",
      ],
    },
  },
  // The Telebrás System: record prose, ending note and the complete profile (founders string kept verbatim).
  "telebras-system": {
    // No " - " subtitle; "The ... System" is English wording around the names, given its Portuguese form (the system's own name in Brazil).
    name: "O Sistema Telebrás (Telebrás, Telesp, Embratel)",
    // Card line and page prose.
    tagline: "Novecentas companhias telefônicas viraram uma, depois doze, depois um punhado controlado de fora.",
    intro:
      "Antes de 1972, havia mais de novecentas empresas de telecomunicações operando no Brasil. A Lei 5.792, de 11 de julho de 1972, autorizou uma única holding estatal, e a Telecomunicações Brasileiras S.A. foi instalada em 9 de novembro daquele ano, durante o governo militar. Em poucos anos, ela tinha absorvido quase todas: vinte e sete operadoras estaduais mais a Embratel, a operadora de longa distância, conhecidas em conjunto como Sistema Telebrás.",
    body: [
      "A Telebras foi criada pela Lei 5.792, de 11 de julho de 1972, e passou a existir em novembro daquele ano, para consolidar e executar toda a política pública de telecomunicações do Brasil. Ela se tornou a holding de um sistema, e não uma operadora propriamente dita: vinte e sete companhias telefônicas estaduais, a operadora de longa distância Embratel e o centro de pesquisa CPqD.",
      "Os resultados dessa consolidação costumam ser contados em números de serviço, e os números são o argumento. Os telefones públicos em serviço passaram de cerca de treze mil em 1972 para mais de trinta e um mil no fim de 1977; a discagem direta a distância, que tirou a telefonista da ligação, chegou a 156 localidades em 1974 e a cerca de 533 cidades três anos depois. Um monopólio com um plano de investimento fez em cinco anos o que operadoras privadas fragmentadas não tinham feito em décadas.",
      "A mesma estrutura que entregou isso também fixou o teto. As filas de espera por uma linha se mediam em anos, e a assinatura telefônica virou um bem que as pessoas compravam e vendiam, porque a oferta era definida por um plano, e não pela demanda. É a troca permanente da infraestrutura em monopólio: coordenação e alcance em troca de um ritmo que ninguém de fora do plano consegue mudar.",
      "O sistema foi privatizado em leilão em 29 de julho de 1998, na bolsa de valores do Rio de Janeiro, dividido em operadoras regionais e vendido. Tudo nas telecomunicações brasileiras depois disso (a concorrência, a cobertura, as tarifas e o regulador) é consequência de como aquele único dia foi estruturado.",
    ],
    // Ending note (the year stays in the English record).
    endedNote:
      "O sistema foi privatizado em 29 de julho de 1998 e dividido em doze holdings regionais. A própria Telebrás foi reativada em 2010, com outra missão.",
    // Complete translated profile: same shape, years and entries as profiles/telebras-system.ts.
    profile: {
      slug: "telebras-system",
      foundings: [
        {
          company: "Telecomunicações Brasileiras S.A.",
          year: 1972,
          place: "Brasília",
          // Fact field: kept exactly as the English record writes it.
          founders: ["the Brazilian federal government"],
          story:
            "A base legal era mais antiga: o Código Brasileiro de Telecomunicações, de 1962, estabeleceu que as telecomunicações seriam organizadas pelo Estado. A empresa que veio uma década depois teve 94,5% do capital integralizado pela União, e o restante subscrito pelo banco nacional de desenvolvimento e por outras três estatais: Vale do Rio Doce, Petrobrás e Eletrobrás. O fundo do próprio setor, o Fundo Nacional de Telecomunicações, foi transferido para pagar a construção.",
        },
      ],
      timeline: [
        {
          year: 1982,
          title: "A década sem gastar",
          detail:
            "Uma grave crise financeira do setor público levou a secretaria de controle das empresas estatais a impor cortes profundos de investimento em todas as estatais, inclusive nesta. A expansão desacelerou e a qualidade do serviço se degradou, não por má gestão da rede, mas por uma decisão fiscal tomada acima dela. É a década que tornou convincente o argumento posterior pela privatização, e costuma ficar de fora das duas versões da história.",
        },
        {
          year: 1995,
          title: "Emenda Constitucional 8",
          detail: "A reserva de monopólio é retirada em fevereiro, permitindo a entrada de capital privado nas telecomunicações por autorização, concessão ou permissão.",
        },
        {
          year: 1998,
          title: "O arquiteto não chega a ver",
          detail:
            "Sérgio Motta, o ministro das comunicações que desenhou o modelo de privatização, morreu meses antes do leilão que tinha passado anos construindo. Seu sucessor o executou. Noventa mil funcionários e aposentados receberam a oferta de ações preferenciais com desconto, um detalhe que vale guardar: as pessoas que construíram o sistema ganharam um pequeno pedaço daquilo pelo qual ele foi vendido.",
        },
      ],
      products: [
        { name: "A rede nacional", what: "Vinte e sete operadoras estaduais, uma operadora de longa distância, capacidade de satélite e cabo submarino, montadas a partir de centenas de sistemas locais incompatíveis numa rede capaz de completar uma ligação através de um continente." },
        { name: "CPqD", what: "O centro de pesquisa, que aparece separadamente nesta linha do tempo. É o único componente importante do sistema que não foi vendido e ainda opera com o próprio nome." },
        { name: "Capacidade de satélite", what: "Uma participação no programa do satélite geoestacionário de defesa e comunicações estratégicas: infraestrutura sem comprador comercial, que é o tipo de coisa para a qual se mantém uma operadora estatal." },
      ],
      innovations: [
        {
          title: "A padronização como o produto de fato",
          detail:
            "A conquista de engenharia não foi uma tecnologia isolada, mas um acordo: um plano de numeração, um conjunto de regras de interconexão, um padrão técnico em um país do tamanho de um continente. Novecentas operadoras tinham produzido novecentas maneiras de fazer as coisas, e o verdadeiro resultado da fusão foi que elas pararam.",
        },
        {
          title: "Um centro de pesquisa dentro do monopólio",
          detail:
            "Construir um laboratório cuja função era substituir importações, e financiá-lo com as receitas da própria operadora, é uma escolha de política pública, e não técnica. Ela deu ao país tecnologia de centrais telefônicas, de transmissão e óptica que de outro modo teria comprado, e é o motivo pelo qual existe um segundo verbete brasileiro nesta linha do tempo.",
        },
        {
          title: "O subinvestimento como mecanismo de mudança",
          detail:
            "Sistemas raramente são privatizados enquanto funcionam bem. Uma década de asfixia de capital imposta produziu as filas de espera e o serviço ruim que justificaram a venda, o que significa que o argumento político dos anos 1990 era em parte sobre condições criadas por decisões tomadas nos anos 1980. Essa sequência se repete onde quer que infraestrutura pública mude de mãos, e vale nomeá-la em vez de pressupô-la.",
        },
        {
          title: "Manter a casca",
          detail:
            "A holding nunca foi dissolvida. Foi mantida para administrar o pessoal remanescente e, doze anos depois, foi reativada com um novo propósito. Uma instituição mantida viva no papel se revelou mais barata de reativar do que de recriar, o que é um argumento para não dissolver as coisas por completo.",
        },
      ],
      markets: [
        "Seu mercado era o país inteiro, por lei, durante vinte e seis anos. O que a substituiu foi um conjunto de concessões regionais e licenças móveis nas mãos de operadoras que, em uma década, se consolidaram num punhado de grupos.",
        "A entidade atual não compete: vende capacidade à administração federal e chega a lugares onde não existe caso comercial. É uma missão deliberada, e não uma posição de mercado.",
      ],
      analyst: [
        "Qualquer avaliação do sistema esbarra no mesmo problema que a entrada acima identifica: a conquista e o fracasso são ambos reais, e qual deles predomina depende do que se mede. A rede foi construída. O Estado que a construiu não tinha como continuar construindo. As duas coisas são fatos estabelecidos, e nenhuma resolve a discussão.",
        "A observação mais estreita é sobre sobrevivência institucional. De tudo o que o sistema continha, as duas coisas que ainda operam com os nomes originais são o centro de pesquisa, separado antes da venda, e a holding, que nunca foi liquidada. O que sobreviveu foi o que ninguém comprou.",
      ],
    },
  },
  // Tivoli Systems: record prose, ending note and successor label (no profile).
  "tivoli-systems": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Tivoli Systems - gerenciamento para as máquinas de todos os outros",
    // Card line and page prose.
    tagline: "Fundada por gente da IBM que recebeu ordem de gerenciar só máquinas IBM; comprada pela IBM sete anos depois por US$ 800 milhões.",
    intro:
      "A Tivoli Systems foi fundada em Austin, no Texas, em 1989, por Bob Fabbio, a quem logo se juntaram Peter Valdes, Todd Smith e Steve Marcie, todos ex-funcionários da IBM. Fabbio já disse que o objetivo era oferecer gerenciamento de sistemas para máquinas de um conjunto diverso de fabricantes, depois de ter recebido na IBM a orientação de se concentrar apenas em produtos IBM. O produto era o Tivoli Management Environment, e ele levou a empresa à abertura de capital na NASDAQ em março de 1995, sob o CEO Frank Moss.",
    body: [
      "A saída veio um ano depois da abertura de capital. O relatório trimestral da IBM dos três primeiros meses de 1996 registra que, em 1º de março de 1996, ela adquiriu todas as ações em circulação da Tivoli Systems por cerca de US$ 800 milhões, US$ 716 milhões em caixa líquido, e baixou como despesa US$ 417 milhões do preço, a título de pesquisa e desenvolvimento em andamento adquiridos (purchased in-process research and development): software ainda em desenvolvimento que não tinha alcançado viabilidade tecnológica. A empresa que saiu da IBM para gerenciar os sistemas de todo mundo foi comprada de volta pela IBM para fazer exatamente isso.",
      "O que veio depois é a história mais longa. No início de 2002, a Tivoli Systems virou Tivoli Software, uma marca dentro da IBM, e a IBM ampliou o portfólio sob ela por desenvolvimento e aquisições (o Netcool/OMNIbus da Micromuse chegou em fevereiro de 2006 e virou a plataforma de gestão de eventos da suíte), a ponto de o Gartner atribuir à IBM a maior participação no mercado de software de gerenciamento de operações de TI em 2012, com 18 por cento. O Tivoli Management Framework original, construído sobre CORBA, já tinha chegado então ao fim da vida, à medida que o Secure Shell desbancava o CORBA e a IBM promovia produtos fora do framework.",
      "Em abril de 2013, a IBM rebatizou a divisão Tivoli Software como Cloud & Smarter Infrastructure, e a própria marca foi sendo aposentada: o Tivoli Storage Manager virou IBM Spectrum Protect e o Tivoli Workload Scheduler virou IBM Workload Scheduler. Um nome que tinha significado gerenciamento de sistemas corporativos para uma geração de administradores desapareceu numa hierarquia de produtos, que é o destino comum de uma marca adquirida, e vale registrá-lo justamente porque tantas das ferramentas de monitoramento deste registro (OpenNMS, Nagios, Zabbix, MRTG) foram escritas por pessoas que não podiam pagar por um framework como este.",
    ],
    // Ending note (the year stays in the English record) and successor label (URL stays English).
    endedNote:
      "Adquirida pela IBM em 1º de março de 1996 por cerca de US$ 800 milhões (US$ 716 milhões em caixa líquido). O nome sobreviveu como a marca Tivoli Software da IBM de 2002 até a IBM começar a aposentá-la em 2013; em 2016, os produtos já tinham sido rebatizados.",
    successorLabel:
      "IBM, que adquiriu a Tivoli Systems em 1º de março de 1996 e manteve os produtos sob a marca Tivoli Software até meados dos anos 2010",
  },
  // Unentel: record prose (no profile, no acquisitions).
  "unentel": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Unentel - colaboração, redes e as partes que ninguém fotografa",
    // Card line and page prose.
    tagline: "Revenda brasileira de comunicações unificadas e segurança de rede, com locação e pós-venda como linhas de negócio nomeadas.",
    intro:
      "A Unentel trabalha com duas unidades de negócio (comunicações unificadas e colaboração, com os dispositivos que as acompanham, e redes e cibersegurança), ao lado de uma oferta de locação de equipamentos, de um serviço de pós-venda com nome próprio e de um canal de e-commerce próprio.",
    body: [
      "A locação e o pós-venda aparecerem como linhas de negócio nomeadas, e não como apêndices, é o que vale registrar. As duas são a forma como uma revenda sobrevive à compressão da margem de hardware: a primeira transforma uma compra numa assinatura, e a segunda é a única parte da relação em que um concorrente não consegue vencer apenas com preço menor.",
      "Comunicações unificadas também é o segmento em que o dispositivo importa mais e é menos discutido: um headset, um sistema de sala e um aparelho telefônico são o que o usuário realmente toca, e a decisão de plataforma muitas vezes é tomada por quem já fornece esses itens.",
    ],
  },
  // Ungermann-Bass: record prose (no profile, no acquisitions).
  "ungermann-bass": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Ungermann-Bass - a primeira empresa que só fazia redes",
    // Card line and page prose.
    tagline: "Ralph Ungermann saiu da Zilog para construir redes e nada mais, algo que ninguém tinha feito como negócio antes.",
    intro:
      "Fundada em 1979, a Ungermann-Bass costuma ser descrita como a primeira empresa cujo negócio inteiro era redes de computadores, e não computadores que por acaso se ligavam em rede. É uma distinção real: até então, a rede era um recurso vendido por quem fabricava as máquinas, e as opções do cliente eram limitadas pelo fabricante do seu computador.",
    body: [
      "A Ungermann-Bass foi constituída em julho de 1979 em Santa Clara por Ralph Ungermann e Charlie Bass, ambos vindos da Zilog. Ungermann tinha gerenciado o projeto do 8080 na Intel e saído em 1974 com Federico Faggin para fundar a Zilog; quando o investimento da Exxon trouxe pressão, ele se desentendeu com a direção e foi afastado no fim de 1978. Bass, que tinha doutorado e tinha lecionado em Berkeley e Stanford, juntou-se a ele. Eles recrutaram Judith Estrin e John Davidson, sendo Davidson um dos criadores do NCP, o protocolo de transporte que a ARPANET usava antes do TCP.",
      "Um detalhe da captação vale mais do que o valor levantado. Os investidores de venture capital não fechariam a rodada só com base naquela equipe de engenharia; aceitaram investir apenas quando um executivo de vendas experiente, Jim Jordan, veio da Four-Phase Systems. Uma empresa montada com alguns dos melhores engenheiros de rede disponíveis ainda precisou contratar um vendedor antes que alguém a financiasse.",
      "A decisão técnica que a definiu foi tomada contra a alternativa. Bass investigou o broadband e o rejeitou, construindo consenso em torno da Ethernet: a imagem espelhada da escolha que a Sytek fez na mesma cidade, no mesmo ano, e as duas foram deliberadas. O primeiro produto, o NIU-1, conectava de oito a trinta e dois terminais a computadores host por Ethernet usando XNS. A UB se tornou a primeira grande empresa de redes independente de qualquer fabricante de computadores, e essa era toda a proposta: na época, o equipamento de rede vinha do fabricante do computador e só falava os protocolos daquele fabricante.",
      "O que acabou por derrubá-la foi outra aposta em padrões. A UB apoiou o OSI, a suíte de protocolos oficialmente sancionada com que comitês e governos tinham concordado, enquanto o TCP/IP (não sancionado, já em operação e gratuito) ficou com o mercado. Apoiar o padrão oficial contra o que funciona é um modo de falha reconhecível, e um que parece prudente na hora e só vira erro em retrospecto.",
      "A Tandem Computers a adquiriu em 1988 por cerca de 260 milhões de dólares, depois que uma oferta menor de um comprador rival tinha sido rejeitada, e a base instalada que ela trouxe incluía a rede de quarenta mil dispositivos nas fábricas da General Motors. A Tandem depois vendeu a unidade à Newbridge Networks, e a empresa foi liquidada em 1997. Das três que deram início às redes do Vale do Silício em 1979, nenhuma sobreviveu como empresa independente, o que diz menos sobre a engenharia delas do que sobre o quanto o mercado que criaram foi reorganizado em torno de um único fabricante.",
    ],
    // Ending note (the year stays in the English record; endings apply, 26/10/2026).
    endedNote:
      "A Tandem Computers adquiriu a Ungermann-Bass em 1988 e a manteve como sua subsidiária UB Networks.",
  },
  // Veeam: record prose and the one acquisition (no profile, no ending).
  "veeam": {
    // Name has no subtitle: carried verbatim so the record reads complete.
    name: "Veeam",
    // Card line and page prose.
    tagline: "O projeto paralelo engoliu o negócio principal, duas vezes, e uma saída anterior foi a única rodada de financiamento durante uma década.",
    intro:
      "Ratmir Timashev e Andrei Baronov dividiam quarto na Ohio State. Em 1995, quando Timashev ainda era aluno de pós-graduação em física química, os dois abriram uma loja online de peças de computador. Em 1996, criaram em paralelo algumas ferramentas para administradores de Windows NT. As ferramentas faturaram mais do que a loja, e eles fundaram uma empresa em torno delas: a Aelita Software, vendida à Quest em 2004 por cerca de US$ 115 milhões. A Veeam veio em 2006.",
    body: [
      "Essa sequência é um padrão que esta linha do tempo ainda não tinha nomeado, e ele se repete o tempo todo. A coisa construída para dar suporte ao negócio vira o negócio, porque ela resolve um problema que quem a construiu de fato tinha, enquanto o negócio principal era um palpite sobre um problema que outra pessoa talvez tivesse. Quem já escreveu uma ferramenta interna que colegas de outros departamentos começaram a pedir viu o começo disso. O erro habitual é tratar a atividade paralela como uma distração do plano, e não como evidência de que o plano mirava o problema errado.",
      "A Veeam foi financiada pela saída da Aelita, e por mais nada, durante bem mais de uma década. Os fundadores detinham quase todo o capital, não aceitaram dinheiro institucional até a Insight Partners aportar US$ 500 milhões em janeiro de 2019 e reinvestiram os lucros. É uma segunda via que este site já registrou duas vezes: o fundador da CloudShare recomprou a empresa dos investidores por quatro dólares e a fez crescer com receita. O caminho do venture capital não é o único que chega a um bilhão de dólares; é o que vira assunto, porque quem escreve sobre ele participa dele.",
      "O momento técnico era a oportunidade inteira, e vale ser preciso sobre o porquê. A VMware estava consolidando muitos servidores físicos em poucos hosts físicos. O software de backup da época rodava um agente dentro de cada máquina e lia o sistema de arquivos, o que funcionava bem quando cada máquina tinha os próprios discos e a própria capacidade ociosa, e se tornou insustentável quando trinta agentes acordavam num só host e disputavam os mesmos discos e a mesma placa de rede. O método antigo não parou de funcionar; deixou de caber no orçamento, uma distinção que a maioria das histórias de produto embaralha. A resposta da Veeam foi fazer o backup no nível do hypervisor (copiar o disco virtual e ignorar o guest), o que só é possível porque o hypervisor existe.",
      "E os primeiros produtos nem eram de backup. O Veeam Monitor e o Veeam Reporter faziam monitoramento, relatórios e documentação de infraestrutura virtual. O negócio de backup começou com o FastSCP em 2007, lançado de graça (uma ferramenta para copiar arquivos de VMs), que se tornou a base dos produtos de proteção de dados que vieram depois. Primeiro a ferramenta gratuita, depois o produto pago: é o mesmo formato do verbete do Kali, em outro ponto deste site. O brinde não é gasto de marketing, é como se descobre qual problema as pessoas realmente têm.",
      "A Insight Partners comprou a empresa por US$ 5 bilhões em janeiro de 2020, os fundadores se afastaram e o negócio concluiu a migração de licenças perpétuas para assinatura, que é exatamente para isso que serve esse tipo de dono, e é uma transição mais difícil do que parece, porque converte um pagamento grande hoje num pagamento pequeno repetido, e os anos intermediários parecem declínio em qualquer gráfico.",
      "Uma consequência da aquisição é estrutural e merece registro. A Veeam era registrada em Baar, na Suíça; a aquisição transferiu o domicílio societário para Columbus, Ohio, onde Timashev tinha estudado e construído a Aelita. Ter domicílio nos Estados Unidos torna uma empresa elegível para disputar contratos federais. É um fato simples sobre como funcionam as compras públicas, e ele pertence ao lado dos verbetes sobre soberania em outros pontos daqui: aqueles registram países construindo a própria infraestrutura para que a propriedade não possa ser usada contra eles, e este registra uma empresa mudando a própria nacionalidade para que a propriedade pudesse ser usada a seu favor. O mesmo mecanismo, apontado em direções opostas.",
    ],
    // Acquisitions: index-aligned with the English list (year, name and price stay in partners.ts).
    acquisitions: [
      // 2018, N2WS.
      {
        what: "Backup e recuperação de desastres cloud-native para a Amazon Web Services.",
        became: "A porta de entrada da Veeam para fazer backup do que roda numa nuvem pública, e não num hypervisor que ela consegue enxergar.",
      },
    ],
  },
  // Wang Laboratories: record prose, ending note and the complete profile.
  "wang": {
    // Company kept verbatim; only the subtitle is localised.
    name: "Wang Laboratories - o escritório antes do PC",
    // Card line and page prose.
    tagline: "As patentes de memória de núcleos magnéticos de An Wang financiaram um império de processamento de texto que dominou o escritório do fim dos anos 1970, e o PC o desfez em menos de uma década.",
    intro:
      "Antes do PC, o escritório funcionava com Wang: sistemas dedicados de processamento de texto tão dominantes que secretárias listavam 'Wang' como habilidade. O Dr. An Wang, que vendeu suas patentes de memória de núcleos magnéticos à IBM e construiu a empresa-símbolo do Massachusetts Miracle, viu o minicomputador e o escritório convergirem antes de quase todo mundo. O PC de uso geral rodando WordPerfect apagou a categoria que ele criou.",
    body: [
      "Da fundação em Boston, em 1951, passando pelos anos dourados do WPS e do VS, pela sucessão fracassada e pelo Chapter 11 de 1992, o perfil conta a ascensão e queda de um único produto mais nítida desta seção.",
    ],
    // Ending note (the year stays in the English record).
    endedNote:
      "Adquirida pela holandesa Getronics em 1999. A Getronics North America passou para a KPN em 2007 e para a CompuCom em 2008.",
    // Complete translated profile: same shape, years and entries as profiles/wang.ts.
    profile: {
      slug: "wang",
      foundings: [
        {
          company: "Wang Laboratories",
          year: 1951,
          place: "Boston, Massachusetts",
          founders: ["Dr. An Wang"],
          story:
            "An Wang chegou de Xangai, fez doutorado em Harvard, foi coinventor do mecanismo de escrita da memória de núcleos magnéticos e vendeu as patentes à IBM para financiar uma empresa própria. A Wang Laboratories subiu três degraus em sequência: calculadoras de mesa, minicomputadores e, depois, o produto que transformou o nome em verbo em todo escritório do fim dos anos 1970, o processamento de texto dedicado. No auge, 'Wang' era uma habilidade em currículos e uma torre no horizonte de Lowell; em quinze anos, o PC de uso geral tinha apagado a categoria por completo.",
        },
      ],
      timeline: [
        { year: 1956, title: "A venda das patentes à IBM", detail: "Wang vende suas patentes de memória de núcleos à IBM por cerca de US$ 500.000: o capital inicial, e uma desconfiança vitalícia do gigante, que financiam tudo o que vem depois.", sourceNote: "Valor conforme o registro mais comum (cerca de US$ 500 mil)." },
        { year: 1965, title: "O LOCI e os anos das calculadoras", detail: "As calculadoras de mesa da Wang, com truques logarítmicos fazendo multiplicação uma década antes dos chips baratos, dão à empresa a primeira fortuna e a reputação de engenharia." },
        { year: 1976, title: "WPS: o escritório muda", detail: "O Wang Word Processing System põe a edição numa tela, com uma interface amigável para secretárias; os escritórios compram andares inteiros deles, e a Wang domina a categoria que ela praticamente criou." },
        { year: 1977, title: "A linha VS", detail: "Os minicomputadores VS levam a Wang ao processamento de dados de uso geral (máquinas para enfrentar a IBM, com clientes famosamente fiéis) e conduzem a empresa à escala da Fortune 500 e ao estrelato do Massachusetts Miracle." },
        { year: 1989, title: "A sucessão fracassa", detail: "Fred Wang, posto no cargo pelo pai, renuncia enquanto os prejuízos se acumulam; o Dr. Wang, já doente, morre em 1990: o fracasso de sucessão do fundador que as escolas de negócios ainda ensinam ao lado do fracasso de produto." },
        { year: 1992, title: "Chapter 11", detail: "Agosto de 1992: o PC rodando software barato de processamento de texto dissolveu a categoria dedicada; a Wang pede falência e ressurge como empresa de serviços, que a Getronics adquire em 1999. As torres sobrevivem ao império." },
      ],
      products: [
        { name: "Wang WPS / OIS", what: "Os sistemas dedicados de processamento de texto que definiram a automação de escritório antes do PC." },
        { name: "Wang VS", what: "A linha de minicomputadores com a proposta de integração com o escritório, e alguns dos usuários mais devotados da época." },
        { name: "Calculadoras Wang", what: "As máquinas de mesa LOCI e da série 300 que construíram o primeiro ato da empresa." },
      ],
      innovations: [
        { title: "O escritório baseado em tela", detail: "A Wang pôs a edição de documentos num display, com uma interface pensada primeiro no operador: a experiência do software de escritório, inventada como appliance." },
        { title: "Criar a categoria, correr o risco da categoria", detail: "A ascensão e queda da Wang é a lição canônica de que ser dono de uma categoria não é ser dono da plataforma por baixo dela: o PC absorveu a função e a fortuna." },
      ],
      markets: [
        "Os mercados da Wang foram absorvidos inteiros pelo PC; seu legado é o próprio paradigma da automação de escritório, e uma história de fundador imigrante que continua sendo uma das maiores da tecnologia americana.",
      ],
      analyst: [
        "Durante uma década, o fabricante do qual partia toda avaliação de automação de escritório; depois, a demonstração mais clara da época de que hardware dedicado perde para plataformas de uso geral.",
      ],
    },
  },
};
