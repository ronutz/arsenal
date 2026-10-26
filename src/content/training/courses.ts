// ============================================================================
// src/content/training/courses.ts
// ----------------------------------------------------------------------------
// THE COURSE CATALOGUE: the courses Rodolfo Nützmann currently delivers, across
// the four pillars (F5, Extreme Networks, Fortinet, Netskope).
//
// PERSONAL CATALOGUE (Model A, PRIME 2026-10-04; confirmed EXACT by PRIME on
// 2026-10-25: 28 courses, F5 12, Extreme 9, Fortinet 5, Netskope 2). An entry
// leaves when a course leaves the delivery portfolio and arrives when one joins;
// every count on the site is derived from this list (COURSE_COUNT), never typed.
//
// ROUND 1 (2026-10-25; audit CC06, CC07, CC08). Every course now carries, as
// structured fields rendered on its page in en and pt-BR:
//   - prerequisites (a course of this catalogue, a vendor-stated text, or an
//     explicit "not published" when no public outline could be read);
//   - certification relevance: "vendor-stated" (the vendor's own page ties the
//     course to the exam), "topic-overlap" (the instructor's mapping, said so on
//     the page) or "not-exam-specific"; never a claim that a course awards one;
//   - the recommended next course, from the vendor's published sequence, or an
//     explained "no fixed next course";
//   - the official outline source (S2): URL, the vendor's own title, the vendor
//     course identifier and version WHEN PUBLISHED (null means not stated
//     publicly), the day of the read and its CONTENT outcome (a sign-in page is
//     login_required, never a verification);
//   - curriculumChecked: the day of the last SUCCESSFUL verification of THIS
//     course. It advances only for a course whose source was re-read and
//     verified; a failed attempt leaves it where it was (CC08-E).
// The on-page outline is labelled as a summary in the site's own words, with
// the source and check date beside it; outlineNote carries version and legacy
// context (CC08-C, CC08-D). Sources and read times: the Round 1 training NOTES.
//
// LANGUAGE (CC06): every site-authored sentence is Localized {en, pt-BR};
// official course names, exam names and codes stay as the vendor writes them.
// Locales other than en and pt-BR render the English with lang="en".
// ============================================================================

/** Site-authored text in the two authored locales. */
export interface Localized {
  /** British English. */
  en: string;
  /** Brazilian Portuguese. */
  "pt-BR": string;
}

/** How a read of a course source turned out as CONTENT, whatever the HTTP status said (S2). */
export type CourseSourceOutcome =
  // The page or document was read and carries the course facts.
  | "verified"
  // The content sits behind a sign-in (e.g. Fortinet's course SSO, Extreme's partner portal).
  | "login_required"
  // A bot challenge or an access denial answered instead of the content.
  | "blocked"
  // No page or document for the course could be found at the vendor.
  | "not_found"
  // HTTP 200, but only an empty application shell with no course content.
  | "application_shell";

/** A reference to another course of this catalogue. */
export interface CourseRef {
  /** Platform slug (e.g. "f5"). */
  platform: string;
  /** Course slug within that platform. */
  course: string;
}

/** The official outline source of a course and the latest read of it (S2). */
export interface CourseSource {
  /** The vendor's public course page or outline document; null when none could be found. */
  url: string | null;
  /** The vendor's own title for the course on that source, verbatim; null when none. */
  title: string | null;
  /** The vendor's course number or document identifier, verbatim, when the source publishes one. */
  vendorCourseId: string | null;
  /** The product or courseware version the source states, verbatim; null means not stated publicly. */
  version: string | null;
  /** The day of the latest read (attempt), YYYY-MM-DD. */
  checkedOn: string;
  /** The content outcome of that read. */
  outcome: CourseSourceOutcome;
  /** What the read showed beyond the outcome, in both authored locales. */
  finding?: Localized;
}

/** One prerequisite: a course of this catalogue, a vendor-stated text, or "not published". */
export type Prerequisite =
  // Another course of this catalogue, linked on the page.
  | { course: CourseRef }
  // A prerequisite as the vendor states it, in the site's words.
  | { text: Localized }
  // No public vendor outline could be read, so the prerequisites are unknown (an interim gap, not "none").
  | { unknown: true };

/** How a course relates to a vendor credential (CC07-A, CC07-B). */
export interface CertificationRelevance {
  /** vendor-stated: the vendor ties course and exam; topic-overlap: the instructor's mapping; not-exam-specific. */
  kind: "vendor-stated" | "topic-overlap" | "not-exam-specific";
  /** The credential or exam, as the vendor names it; null when not exam-specific. */
  credential: string | null;
  /** Slugs of this site's free study guides for that credential (src/content/certifications/study-guides.ts). */
  guides: readonly string[];
  /** The basis of the statement, with its source and read date. */
  basis: Localized;
}

/** What follows a course (CC07-C). */
export type NextStep =
  // One or more named courses of this catalogue, from the vendor's published sequence.
  | { kind: "courses"; courses: readonly CourseRef[]; basis: Localized }
  // The vendor's named follow-on course, which this catalogue does not include.
  | { kind: "external"; name: string; url: string; basis: Localized }
  // No fixed next course, with the reason.
  | { kind: "none"; basis: Localized };

export interface Course {
  /** URL slug, unique within a platform (e.g. "configuring-ltm"). */
  slug: string;
  /** Display name of the course, as the catalogue lists it (official names stay in English). */
  name: string;
  /** Optional former or alternate name shown as context (e.g. "formerly ASM"). */
  altName?: Localized;
  /** Duration in instructor-led days (rendered with the locale's plural rules). */
  days: number;
  /** A one-line summary for cards. */
  summary: Localized;
  /** A fuller description, in original wording. */
  description: Localized;
  /** The on-page outline: a summary in the site's own words of the vendor's published outline. */
  toc: readonly Localized[];
  /** Version, edition or legacy context for the summary, when there is any. */
  outlineNote?: Localized;
  /** Prerequisites, in the order to show them. */
  prerequisites: readonly Prerequisite[];
  /** Certification relevance. */
  certification: CertificationRelevance;
  /** The recommended next step. */
  next: NextStep;
  /** The official outline source and the latest read of it. */
  source: CourseSource;
  /** Day of the last SUCCESSFUL verification of this course's facts (YYYY-MM-DD), or null when never verified. */
  curriculumChecked: string | null;
}

export interface Platform {
  /** URL slug (e.g. "f5"). */
  slug: string;
  /** Display name. */
  name: string;
  /** Short tagline. */
  tagline: Localized;
  /** Platform-level description, original wording. */
  intro: Localized;
  /** Year Rodolfo became an authorized instructor for this platform. */
  since: string;
  /** Year Rodolfo began working hands-on with this technology (depth beyond the instructor years). Optional. */
  workingSince?: string;
  /** i18n key (under training.tech.*) for the underlying-technology label, used instead of the vendor name. Optional; falls back to the platform name. */
  workingTechKey?: string;
  /** The courses for this platform. */
  courses: Course[];
}

// ============================================================================
// F5: 12 courses.
// ============================================================================
const f5: Platform = { // the F5 platform
  slug: "f5", // URL slug
  name: "F5", // display name
  tagline: { // short tagline
    en: "Application delivery and application security, on BIG-IP.", // British English
    "pt-BR": "Application delivery e segurança de aplicações no BIG-IP.", // Brazilian Portuguese
  },
  intro: { // platform introduction
    en: "F5 BIG-IP sits in front of applications, controlling how traffic reaches them and protecting them as it does. The platform spans load balancing and traffic management, web application firewalling, access control, DNS, network firewalling, and SSL visibility. These courses build the operational skill to deploy and run BIG-IP across that full range, from first setup through advanced, module-specific configuration.", // British English
    "pt-BR": "O F5 BIG-IP fica na frente das aplicações, controlando como o tráfego chega até elas e protegendo-as no caminho. A plataforma cobre load balancing e gerência de tráfego, web application firewall, controle de acesso, DNS, firewall de rede e visibilidade de SSL. Estes cursos constroem a habilidade operacional para implantar e operar o BIG-IP em toda essa extensão, da primeira configuração até a configuração avançada de cada módulo.", // Brazilian Portuguese
  },
  since: "2020", // authorized instructor since
  workingSince: "2013", // hands-on with the technology since
  courses: [ // the courses, in display order
    { // Administering BIG-IP
      slug: "administering-big-ip", // URL slug
      name: "Administering BIG-IP", // catalogue name (official names stay in English)
      days: 2, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "The foundation course: set up and operate a BIG-IP system.", // British English
        "pt-BR": "O curso de base: configurar e operar um sistema BIG-IP.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "This is the starting point for the BIG-IP curriculum and the knowledge base the module-specific courses assume. It covers bringing a BIG-IP system online and running it as it is commonly deployed in an application delivery network: initial setup and licensing, resource provisioning, networking, and high availability. Students work hands-on with the core traffic-processing objects, pools, virtual servers, health monitors, and address translation, and learn to shape traffic behaviour with profiles and persistence, using both the Configuration utility and the TMOS shell. Basic troubleshooting, including tcpdump and the iHealth diagnostic tool, rounds out the operational picture.", // British English
        "pt-BR": "Este é o ponto de partida do currículo de BIG-IP e a base de conhecimento que os cursos de cada módulo pressupõem. Ele cobre colocar um BIG-IP no ar e operá-lo do jeito como costuma ser implantado em uma rede de application delivery: setup inicial e licenciamento, provisionamento de recursos, rede e alta disponibilidade. Os alunos trabalham na prática com os objetos centrais de processamento de tráfego, pools, virtual servers, health monitors e tradução de endereços, e aprendem a moldar o comportamento do tráfego com profiles e persistence, usando tanto o Configuration utility quanto o TMOS shell. Troubleshooting básico, incluindo tcpdump e a ferramenta de diagnóstico iHealth, completa a visão operacional.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "Setting up the BIG-IP system", "pt-BR": "Setup do sistema BIG-IP" }, // outline item 1
        { en: "Traffic processing building blocks", "pt-BR": "Blocos básicos de processamento de tráfego" }, // outline item 2
        { en: "Using the Traffic Management Shell (tmsh)", "pt-BR": "Uso do Traffic Management Shell (tmsh)" }, // outline item 3
        { en: "Using NATs and SNATs", "pt-BR": "Uso de NAT e SNAT" }, // outline item 4
        { en: "Monitoring application health", "pt-BR": "Monitoração da saúde das aplicações" }, // outline item 5
        { en: "Modifying traffic behaviour with profiles", "pt-BR": "Ajuste do comportamento do tráfego com profiles" }, // outline item 6
        { en: "Modifying traffic behaviour with persistence", "pt-BR": "Ajuste do comportamento do tráfego com persistence" }, // outline item 7
        { en: "Administering the BIG-IP system", "pt-BR": "Administração do sistema BIG-IP" }, // outline item 8
        { en: "Configuring high availability", "pt-BR": "Configuração de alta disponibilidade" }, // outline item 9
        { en: "Basic troubleshooting and support tools", "pt-BR": "Troubleshooting básico e ferramentas de suporte" }, // outline item 10
      ],
      prerequisites: [ // prerequisites, in display order
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "F5's course page states no formal prerequisite.", // British English
            "pt-BR": "A página do curso na F5 não informa pré-requisito formal.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "topic-overlap", // vendor-stated | topic-overlap | not-exam-specific
        credential: "F5 Certified Administrator, BIG-IP (F5-CA, BIG-IP)", // credential or exam, as the vendor names it
        guides: ["f5-ca-install-config-upgrade", "f5-ca-data-plane-concepts", "f5-ca-data-plane-configuration", "f5-ca-control-plane-administration", "f5-ca-support-and-troubleshoot"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "F5 does not publish a course-to-exam mapping on a public page: its certification-training page asks for a sign-in (checked 25 October 2026). This pairing is the instructor's reading of where the course topics and the exam objectives overlap, not a vendor statement.", // British English
          "pt-BR": "A F5 não publica em página aberta qual curso prepara para qual exame: a página de certification training pede login (conferido em 25 de outubro de 2026). Esta associação é a leitura do instrutor sobre onde os tópicos do curso e os objetivos do exame se sobrepõem, não uma declaração do fabricante.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "courses", // courses | external | none
        courses: [{ platform: "f5", course: "configuring-ltm" }], // named next course(s) of this catalogue
        basis: { // basis of the recommendation
          en: "F5's Configuring BIG-IP LTM page describes that course as expanding on Administering BIG-IP, and F5 schedules the two together as an instructor-led bundle (education.f5.com, read 25 October 2026).", // British English
          "pt-BR": "A página do Configuring BIG-IP LTM na F5 descreve esse curso como uma ampliação do Administering BIG-IP, e a F5 agenda os dois juntos como pacote com instrutor (education.f5.com, lida em 25 de outubro de 2026).", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://education.f5.com/courses/1118", // vendor page or outline document
        title: "Administering BIG-IP", // the vendor's own title, verbatim
        vendorCourseId: "F5-TRG-BIG-OP-ADMIN-SDT", // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "F5's course page publishes the description and objectives (and the online edition's running time), not a module list or a courseware version.", // British English
          "pt-BR": "A página do curso na F5 publica a descrição e os objetivos (e a duração da edição online), não uma lista de módulos nem a versão do material.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // Configuring BIG-IP LTM
      slug: "configuring-ltm", // URL slug
      name: "Configuring BIG-IP LTM", // catalogue name (official names stay in English)
      altName: { // former or alternate name
        en: "Local Traffic Manager", // British English
        "pt-BR": "Local Traffic Manager", // Brazilian Portuguese
      },
      days: 3, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Load balancing and traffic management with Local Traffic Manager.", // British English
        "pt-BR": "Load balancing e gerência de tráfego com o Local Traffic Manager.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "Local Traffic Manager is the load-balancing and traffic-management heart of BIG-IP, and this course builds a working command of it, from commonly used features through more advanced functionality. Students learn to configure virtual servers, pools and load-balancing methods, tune application health monitoring and apply the right kind of persistence. The advanced portion covers options such as VLAN tagging and trunking, SNMP, packet filters and route domains, customising delivery with iRules and local traffic policies, and mitigating common network-layer and application-layer attacks with LTM features.", // British English
        "pt-BR": "O Local Traffic Manager é o coração de load balancing e gerência de tráfego do BIG-IP, e este curso constrói domínio prático sobre ele, dos recursos mais usados às funções mais avançadas. Os alunos aprendem a configurar virtual servers, pools e métodos de load balancing, ajustar a monitoração de saúde das aplicações e aplicar o tipo certo de persistence. A parte avançada cobre opções como VLAN tagging e trunking, SNMP, packet filters e route domains, personalização da entrega com iRules e local traffic policies, e mitigação de ataques comuns de camada de rede e de aplicação com recursos do LTM.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "Setting up the BIG-IP system", "pt-BR": "Setup do sistema BIG-IP" }, // outline item 1
        { en: "Reviewing local traffic configuration", "pt-BR": "Revisão da configuração de tráfego local" }, // outline item 2
        { en: "Load balancing traffic with LTM", "pt-BR": "Load balancing de tráfego com o LTM" }, // outline item 3
        { en: "Modifying traffic behaviour with persistence", "pt-BR": "Ajuste do comportamento do tráfego com persistence" }, // outline item 4
        { en: "Monitoring application health in depth", "pt-BR": "Monitoração de saúde das aplicações em profundidade" }, // outline item 5
        { en: "Processing traffic with virtual servers", "pt-BR": "Processamento de tráfego com virtual servers" }, // outline item 6
        { en: "Processing traffic with SNATs", "pt-BR": "Processamento de tráfego com SNAT" }, // outline item 7
        { en: "Modifying traffic behaviour with profiles", "pt-BR": "Ajuste do comportamento do tráfego com profiles" }, // outline item 8
        { en: "Selected topics: NATs, route domains, packet filters", "pt-BR": "Tópicos selecionados: NAT, route domains, packet filters" }, // outline item 9
        { en: "Customising application delivery with iRules and policies", "pt-BR": "Personalização da entrega de aplicações com iRules e policies" }, // outline item 10
        { en: "Mitigating common attacks with LTM", "pt-BR": "Mitigação de ataques comuns com o LTM" }, // outline item 11
      ],
      prerequisites: [ // prerequisites, in display order
        { course: { platform: "f5", course: "administering-big-ip" } }, // a course of this catalogue
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "F5 asks for a basic understanding of BIG-IP local traffic concepts (virtual servers, pools, health monitors and profiles) and suggests familiarity with web application delivery, TCP, HTTP and TLS/SSL.", // British English
            "pt-BR": "A F5 pede uma compreensão básica dos conceitos de tráfego local do BIG-IP (virtual servers, pools, health monitors e profiles) e sugere familiaridade com entrega de aplicações web, TCP, HTTP e TLS/SSL.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "topic-overlap", // vendor-stated | topic-overlap | not-exam-specific
        credential: "F5 Certified Technology Specialist, BIG-IP LTM (F5-CTS, BIG-IP LTM)", // credential or exam, as the vendor names it
        guides: ["f5-cts-ltm-base-config-networking", "f5-cts-ltm-virtual-servers-config-objects", "f5-cts-ltm-irules-analytics-templates", "f5-cts-ltm-upgrades-ha-monitoring", "f5-cts-ltm-pcap-tcp-udp-app", "f5-cts-ltm-pcap-tls-ssl"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "F5 does not publish a course-to-exam mapping on a public page: its certification-training page asks for a sign-in (checked 25 October 2026). This pairing is the instructor's reading of where the course topics and the exam objectives overlap, not a vendor statement.", // British English
          "pt-BR": "A F5 não publica em página aberta qual curso prepara para qual exame: a página de certification training pede login (conferido em 25 de outubro de 2026). Esta associação é a leitura do instrutor sobre onde os tópicos do curso e os objetivos do exame se sobrepõem, não uma declaração do fabricante.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "F5 publishes no fixed course to follow this one. The module courses build on the same BIG-IP base, so the next course is the one for the module your team runs.", // British English
          "pt-BR": "A F5 não publica um curso fixo para depois deste. Os cursos de módulo partem da mesma base de BIG-IP, então o próximo curso é o do módulo que a sua equipe opera.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://education.f5.com/courses/1119", // vendor page or outline document
        title: "Configuring BIG-IP LTM: Local Traffic Manager", // the vendor's own title, verbatim
        vendorCourseId: "F5-TRG-BIG-LTM-CFG-3-SDT", // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "F5's course page publishes the description and objectives (and the online edition's running time), not a module list or a courseware version.", // British English
          "pt-BR": "A página do curso na F5 publica a descrição e os objetivos (e a duração da edição online), não uma lista de módulos nem a versão do material.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // Troubleshooting BIG-IP
      slug: "troubleshooting-big-ip", // URL slug
      name: "Troubleshooting BIG-IP", // catalogue name (official names stay in English)
      days: 2, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Systematic troubleshooting of BIG-IP systems and traffic.", // British English
        "pt-BR": "Troubleshooting sistemático de sistemas BIG-IP e do tráfego.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "Built for practitioners who already run BIG-IP, this course turns operational familiarity into structured diagnostic skill, working from the bottom of the stack upwards. It drills the lower-layer tools (ping, bigtop, netstat and tcpdump), protocol analysis in Wireshark across capture formats, HTTP session analysis with the Fiddler proxy and curl, and comparing configurations between devices with KDiff. It then covers local and remote logging, using iRules to log, and analytics profiles for traffic statistics and application visibility, reinforced through hands-on lab scenarios.", // British English
        "pt-BR": "Feito para quem já opera BIG-IP, este curso transforma familiaridade operacional em habilidade estruturada de diagnóstico, de baixo para cima na pilha. Ele pratica as ferramentas de camadas inferiores (ping, bigtop, netstat e tcpdump), a análise de protocolos no Wireshark em vários formatos de captura, a análise de sessões HTTP com o proxy Fiddler e com curl, e a comparação de configurações entre equipamentos com o KDiff. Depois cobre logging local e remoto, o uso de iRules para gerar log e os analytics profiles para estatísticas de tráfego e visibilidade de aplicações, com reforço em cenários práticos de laboratório.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "Bottom-up troubleshooting method", "pt-BR": "Método de troubleshooting de baixo para cima" }, // outline item 1
        { en: "Lower-layer tools: ping, bigtop, netstat, tcpdump", "pt-BR": "Ferramentas de camadas inferiores: ping, bigtop, netstat, tcpdump" }, // outline item 2
        { en: "Protocol analysis with Wireshark", "pt-BR": "Análise de protocolos com o Wireshark" }, // outline item 3
        { en: "HTTP session analysis with Fiddler and curl", "pt-BR": "Análise de sessões HTTP com Fiddler e curl" }, // outline item 4
        { en: "Comparing device configurations with KDiff", "pt-BR": "Comparação de configurações entre equipamentos com o KDiff" }, // outline item 5
        { en: "Local and remote logging", "pt-BR": "Logging local e remoto" }, // outline item 6
        { en: "Logging with iRules", "pt-BR": "Logging com iRules" }, // outline item 7
        { en: "Analytics profiles and application visibility", "pt-BR": "Analytics profiles e visibilidade de aplicações" }, // outline item 8
      ],
      prerequisites: [ // prerequisites, in display order
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "F5's course page states no formal prerequisite.", // British English
            "pt-BR": "A página do curso na F5 não informa pré-requisito formal.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "topic-overlap", // vendor-stated | topic-overlap | not-exam-specific
        credential: "F5 Certified Administrator, BIG-IP (F5-CA, BIG-IP)", // credential or exam, as the vendor names it
        guides: ["f5-ca-support-and-troubleshoot"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "F5 does not publish a course-to-exam mapping on a public page: its certification-training page asks for a sign-in (checked 25 October 2026). This pairing is the instructor's reading of where the course topics and the exam objectives overlap, not a vendor statement.", // British English
          "pt-BR": "A F5 não publica em página aberta qual curso prepara para qual exame: a página de certification training pede login (conferido em 25 de outubro de 2026). Esta associação é a leitura do instrutor sobre onde os tópicos do curso e os objetivos do exame se sobrepõem, não uma declaração do fabricante.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "F5 publishes no fixed course to follow this one. The module courses build on the same BIG-IP base, so the next course is the one for the module your team runs.", // British English
          "pt-BR": "A F5 não publica um curso fixo para depois deste. Os cursos de módulo partem da mesma base de BIG-IP, então o próximo curso é o do módulo que a sua equipe opera.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://education.f5.com/courses/1197", // vendor page or outline document
        title: "Troubleshooting BIG-IP", // the vendor's own title, verbatim
        vendorCourseId: "F5-TRG-BIG-TRBL-INT2", // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "F5's course page publishes the description and objectives (and the online edition's running time), not a module list or a courseware version.", // British English
          "pt-BR": "A página do curso na F5 publica a descrição e os objetivos (e a duração da edição online), não uma lista de módulos nem a versão do material.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // Configuring BIG-IP DNS
      slug: "configuring-dns", // URL slug
      name: "Configuring BIG-IP DNS", // catalogue name (official names stay in English)
      altName: { // former or alternate name
        en: "formerly GTM, Global Traffic Manager", // British English
        "pt-BR": "antigo GTM, Global Traffic Manager", // Brazilian Portuguese
      },
      days: 2, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Intelligent DNS and global server load balancing.", // British English
        "pt-BR": "DNS inteligente e global server load balancing.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "BIG-IP DNS, formerly Global Traffic Manager, brings intelligence and resilience to DNS, distributing users across data centres and clouds by health, proximity and load. This course covers standing up BIG-IP DNS, configuring wide IPs and pools, and the load-balancing methods that send users to the best available resource. It addresses DNS resolution and delegation, synchronisation across a DNS sync group, monitoring of distributed resources and DNS security features, building the skills to run global, fault-tolerant application access.", // British English
        "pt-BR": "O BIG-IP DNS, antigo Global Traffic Manager, traz inteligência e resiliência ao DNS, distribuindo os usuários entre data centers e nuvens conforme saúde, proximidade e carga. Este curso cobre a colocação do BIG-IP DNS no ar, a configuração de wide IPs e pools e os métodos de load balancing que mandam o usuário para o melhor recurso disponível. Ele trata de resolução e delegação de DNS, sincronização em um DNS sync group, monitoração de recursos distribuídos e recursos de segurança de DNS, construindo a habilidade de operar acesso global e tolerante a falhas às aplicações.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "Setting up the BIG-IP system", "pt-BR": "Setup do sistema BIG-IP" }, // outline item 1
        { en: "Introducing BIG-IP DNS", "pt-BR": "Apresentação do BIG-IP DNS" }, // outline item 2
        { en: "Accelerating DNS resolution", "pt-BR": "Aceleração da resolução de DNS" }, // outline item 3
        { en: "Implementing wide IPs and pools", "pt-BR": "Implementação de wide IPs e pools" }, // outline item 4
        { en: "Using DNS load-balancing methods", "pt-BR": "Uso dos métodos de load balancing de DNS" }, // outline item 5
        { en: "Monitoring distributed resources", "pt-BR": "Monitoração de recursos distribuídos" }, // outline item 6
        { en: "Configuring a DNS sync group", "pt-BR": "Configuração de um DNS sync group" }, // outline item 7
        { en: "Securing and delegating DNS", "pt-BR": "Segurança e delegação de DNS" }, // outline item 8
        { en: "Integrating with LTM and the wider network", "pt-BR": "Integração com o LTM e com o restante da rede" }, // outline item 9
      ],
      prerequisites: [ // prerequisites, in display order
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "F5 states no F5-specific prerequisite, but recommends the Administering BIG-IP course, or the F5 Certified BIG-IP Administrator certification, to students with limited BIG-IP experience.", // British English
            "pt-BR": "A F5 não informa pré-requisito específico de F5, mas recomenda o curso Administering BIG-IP, ou a certificação F5 Certified BIG-IP Administrator, a quem tem pouca experiência com BIG-IP.", // Brazilian Portuguese
          },
        },
        { course: { platform: "f5", course: "administering-big-ip" } }, // a course of this catalogue
      ],
      certification: { // certification relevance
        kind: "topic-overlap", // vendor-stated | topic-overlap | not-exam-specific
        credential: "F5 Certified Technology Specialist, BIG-IP DNS (F5-CTS, BIG-IP DNS)", // credential or exam, as the vendor names it
        guides: ["f5-cts-dns-302"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "F5 does not publish a course-to-exam mapping on a public page: its certification-training page asks for a sign-in (checked 25 October 2026). This pairing is the instructor's reading of where the course topics and the exam objectives overlap, not a vendor statement.", // British English
          "pt-BR": "A F5 não publica em página aberta qual curso prepara para qual exame: a página de certification training pede login (conferido em 25 de outubro de 2026). Esta associação é a leitura do instrutor sobre onde os tópicos do curso e os objetivos do exame se sobrepõem, não uma declaração do fabricante.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "F5 publishes no fixed course to follow this one. The module courses build on the same BIG-IP base, so the next course is the one for the module your team runs.", // British English
          "pt-BR": "A F5 não publica um curso fixo para depois deste. Os cursos de módulo partem da mesma base de BIG-IP, então o próximo curso é o do módulo que a sua equipe opera.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://education.f5.com/courses/1122", // vendor page or outline document
        title: "Configuring BIG-IP DNS", // the vendor's own title, verbatim
        vendorCourseId: "F5-TRG-BIG-DNS-IL-SDT", // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "F5's course page publishes the description and objectives (and the online edition's running time), not a module list or a courseware version.", // British English
          "pt-BR": "A página do curso na F5 publica a descrição e os objetivos (e a duração da edição online), não uma lista de módulos nem a versão do material.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // Configuring F5 Advanced WAF
      slug: "configuring-advanced-waf", // URL slug
      name: "Configuring F5 Advanced WAF", // catalogue name (official names stay in English)
      altName: { // former or alternate name
        en: "formerly ASM, Application Security Manager", // British English
        "pt-BR": "antigo ASM, Application Security Manager", // Brazilian Portuguese
      },
      days: 4, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Web application firewalling with Advanced WAF.", // British English
        "pt-BR": "Web application firewall com o Advanced WAF.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "Advanced WAF protects web applications from the threats that target them directly, from the OWASP Top 10 through targeted, automated and layer 7 attacks. This course builds the skill to deploy and tune application security policies: how the WAF inspects traffic, positive and negative security models, handling false positives, and protection against attacks such as injection, cross-site scripting and credential stuffing. It covers learning and policy building, attack signatures and threat campaigns, bot defence and layer 7 DoS protection, so students leave able to secure real applications without breaking them.", // British English
        "pt-BR": "O Advanced WAF protege aplicações web das ameaças que miram nelas diretamente, do OWASP Top 10 a ataques direcionados, automatizados e de camada 7. Este curso constrói a habilidade de implantar e ajustar políticas de segurança de aplicação: como o WAF inspeciona o tráfego, modelos de segurança positivo e negativo, tratamento de falsos positivos e proteção contra ataques como injection, cross-site scripting e credential stuffing. Ele cobre learning e construção de políticas, attack signatures e threat campaigns, bot defense e proteção contra DoS de camada 7, para que o aluno saia capaz de proteger aplicações reais sem quebrá-las.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "Setting up the BIG-IP system", "pt-BR": "Setup do sistema BIG-IP" }, // outline item 1
        { en: "Traffic processing with BIG-IP and Advanced WAF", "pt-BR": "Processamento de tráfego com BIG-IP e Advanced WAF" }, // outline item 2
        { en: "Web application concepts and vulnerabilities", "pt-BR": "Conceitos e vulnerabilidades de aplicações web" }, // outline item 3
        { en: "Security policy deployment", "pt-BR": "Implantação de políticas de segurança" }, // outline item 4
        { en: "Policy tuning and false-positive handling", "pt-BR": "Ajuste de políticas e tratamento de falsos positivos" }, // outline item 5
        { en: "Attack signatures and threat campaigns", "pt-BR": "Attack signatures e threat campaigns" }, // outline item 6
        { en: "Positive security and policy building", "pt-BR": "Segurança positiva e construção de políticas" }, // outline item 7
        { en: "Securing cookies and other objects", "pt-BR": "Proteção de cookies e outros objetos" }, // outline item 8
        { en: "Bot defence and proactive mitigation", "pt-BR": "Bot defense e mitigação proativa" }, // outline item 9
        { en: "Layer 7 DoS protection", "pt-BR": "Proteção contra DoS de camada 7" }, // outline item 10
      ],
      prerequisites: [ // prerequisites, in display order
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "F5's course page states no formal prerequisite.", // British English
            "pt-BR": "A página do curso na F5 não informa pré-requisito formal.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "topic-overlap", // vendor-stated | topic-overlap | not-exam-specific
        credential: "F5 Certified Technology Specialist, BIG-IP ASM (F5-CTS, BIG-IP ASM)", // credential or exam, as the vendor names it
        guides: ["f5-cts-asm-303"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "F5 does not publish a course-to-exam mapping on a public page: its certification-training page asks for a sign-in (checked 25 October 2026). This pairing is the instructor's reading of where the course topics and the exam objectives overlap, not a vendor statement.", // British English
          "pt-BR": "A F5 não publica em página aberta qual curso prepara para qual exame: a página de certification training pede login (conferido em 25 de outubro de 2026). Esta associação é a leitura do instrutor sobre onde os tópicos do curso e os objetivos do exame se sobrepõem, não uma declaração do fabricante.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "F5 publishes no fixed course to follow this one. The module courses build on the same BIG-IP base, so the next course is the one for the module your team runs.", // British English
          "pt-BR": "A F5 não publica um curso fixo para depois deste. Os cursos de módulo partem da mesma base de BIG-IP, então o próximo curso é o do módulo que a sua equipe opera.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://education.f5.com/courses/1121", // vendor page or outline document
        title: "Configuring BIG-IP Advanced WAF: Web Application Firewall", // the vendor's own title, verbatim
        vendorCourseId: "F5-TRG-BIG-AWF-CFG-SDT", // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "F5's course page publishes the description and objectives (and the online edition's running time), not a module list or a courseware version.", // British English
          "pt-BR": "A página do curso na F5 publica a descrição e os objetivos (e a duração da edição online), não uma lista de módulos nem a versão do material.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // Setting Up F5 Advanced WAF Workshop
      slug: "setting-up-advanced-waf-workshop", // URL slug
      name: "Setting Up F5 Advanced WAF Workshop", // catalogue name (official names stay in English)
      days: 2, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "A hands-on workshop on standing up Advanced WAF protections.", // British English
        "pt-BR": "Um workshop prático para colocar as proteções do Advanced WAF no ar.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "A shorter, workshop-format complement to the full Advanced WAF course, this session concentrates on getting protections in place quickly and correctly. It is practical and lab-driven: deploying a baseline application security policy, applying the most impactful protections, and validating that legitimate traffic still flows. The workshop suits teams that need to put Advanced WAF into operation efficiently and want concentrated hands-on time on the core deployment path rather than the full depth of the four-day course.", // British English
        "pt-BR": "Complemento mais curto, em formato de workshop, do curso completo de Advanced WAF, esta sessão se concentra em colocar as proteções no lugar com rapidez e correção. É prática e guiada por laboratório: implantar uma política de segurança de aplicação de base, aplicar as proteções de maior impacto e validar que o tráfego legítimo continua passando. O workshop serve a equipes que precisam colocar o Advanced WAF em operação com eficiência e querem tempo prático concentrado no caminho central de implantação, em vez de toda a profundidade do curso de quatro dias.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "Advanced WAF deployment essentials", "pt-BR": "Fundamentos de implantação do Advanced WAF" }, // outline item 1
        { en: "Building a baseline security policy", "pt-BR": "Construção de uma política de segurança de base" }, // outline item 2
        { en: "Applying high-impact protections", "pt-BR": "Aplicação das proteções de maior impacto" }, // outline item 3
        { en: "Tuning to reduce false positives", "pt-BR": "Ajuste para reduzir falsos positivos" }, // outline item 4
        { en: "Validating legitimate application traffic", "pt-BR": "Validação do tráfego legítimo da aplicação" }, // outline item 5
        { en: "Running and maintaining the policy", "pt-BR": "Operação e manutenção da política" }, // outline item 6
      ],
      outlineNote: { // version, edition or legacy context
        en: "F5's public course catalogue (education.f5.com, read 25 October 2026) lists no course of this name, so this summary and the duration are unverified against a vendor outline.", // British English
        "pt-BR": "O catálogo público de cursos da F5 (education.f5.com, lido em 25 de outubro de 2026) não lista curso com este nome, então este resumo e a duração não foram conferidos com uma ementa do fabricante.", // Brazilian Portuguese
      },
      prerequisites: [ // prerequisites, in display order
        { unknown: true }, // no public vendor outline could be read
      ],
      certification: { // certification relevance
        kind: "not-exam-specific", // vendor-stated | topic-overlap | not-exam-specific
        credential: null, // credential or exam, as the vendor names it
        guides: [], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "A short workshop on deployment practice; no F5 exam is attached to it.", // British English
          "pt-BR": "Um workshop curto sobre a prática de implantação; nenhum exame da F5 está associado a ele.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "No vendor sequence is published for this workshop. Teams that want the full depth go on to the four-day Configuring F5 Advanced WAF course.", // British English
          "pt-BR": "Não há sequência publicada pelo fabricante para este workshop. Equipes que querem toda a profundidade seguem para o curso de quatro dias Configuring F5 Advanced WAF.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: null, // vendor page or outline document
        title: null, // the vendor's own title, verbatim
        vendorCourseId: null, // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "not_found", // content outcome of that read
        finding: { // what the read showed
          en: "No course of this name in F5's public catalogue of 110 courses (education.f5.com/courses, read 25 October 2026).", // British English
          "pt-BR": "Nenhum curso com este nome no catálogo público da F5, de 110 cursos (education.f5.com/courses, lido em 25 de outubro de 2026).", // Brazilian Portuguese
        },
      },
      curriculumChecked: null, // last successful verification of this course
    },
    { // Configuring BIG-IP APM
      slug: "configuring-apm", // URL slug
      name: "Configuring BIG-IP APM", // catalogue name (official names stay in English)
      altName: { // former or alternate name
        en: "Access Policy Manager", // British English
        "pt-BR": "Access Policy Manager", // Brazilian Portuguese
      },
      days: 3, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Access control, SSL VPN, and identity-aware access.", // British English
        "pt-BR": "Controle de acesso, SSL VPN e acesso baseado em identidade.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "Access Policy Manager turns BIG-IP into an access-control and identity gateway, securing how users reach applications. This course covers building access policies with the visual policy editor, authenticating users against Active Directory or RADIUS, and granting or denying access by conditions such as group membership, geolocation and endpoint posture. It addresses SSL VPN and network access, per-application layer 4 and reverse-proxy layer 7 access, remote desktop access, and single sign-on by credential reuse or SAML federation, as service provider and identity provider.", // British English
        "pt-BR": "O Access Policy Manager transforma o BIG-IP em um gateway de controle de acesso e identidade, protegendo o caminho do usuário até as aplicações. Este curso cobre a construção de access policies no visual policy editor, a autenticação de usuários contra Active Directory ou RADIUS e a liberação ou bloqueio de acesso por condições como grupo, geolocalização e postura do endpoint. Ele trata de SSL VPN e network access, acesso por aplicação em camada 4 e por reverse proxy em camada 7, acesso a remote desktop e single sign-on por reaproveitamento de credenciais ou por federação SAML, como service provider e como identity provider.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "Setting up the BIG-IP system", "pt-BR": "Setup do sistema BIG-IP" }, // outline item 1
        { en: "Introducing Access Policy Manager", "pt-BR": "Apresentação do Access Policy Manager" }, // outline item 2
        { en: "Building access policies with the visual policy editor", "pt-BR": "Construção de access policies no visual policy editor" }, // outline item 3
        { en: "Authentication, authorisation and accounting", "pt-BR": "Autenticação, autorização e accounting" }, // outline item 4
        { en: "SSL VPN and network access", "pt-BR": "SSL VPN e network access" }, // outline item 5
        { en: "Application access, remote desktop and the webtop", "pt-BR": "Acesso a aplicações, remote desktop e o webtop" }, // outline item 6
        { en: "Single sign-on", "pt-BR": "Single sign-on" }, // outline item 7
        { en: "Endpoint security and posture assessment", "pt-BR": "Segurança de endpoint e avaliação de postura" }, // outline item 8
        { en: "Federation and SAML", "pt-BR": "Federação e SAML" }, // outline item 9
      ],
      prerequisites: [ // prerequisites, in display order
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "F5's course page states no formal prerequisite.", // British English
            "pt-BR": "A página do curso na F5 não informa pré-requisito formal.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "topic-overlap", // vendor-stated | topic-overlap | not-exam-specific
        credential: "F5 Certified Technology Specialist, BIG-IP APM (F5-CTS, BIG-IP APM)", // credential or exam, as the vendor names it
        guides: ["f5-cts-apm-304"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "F5 does not publish a course-to-exam mapping on a public page: its certification-training page asks for a sign-in (checked 25 October 2026). This pairing is the instructor's reading of where the course topics and the exam objectives overlap, not a vendor statement.", // British English
          "pt-BR": "A F5 não publica em página aberta qual curso prepara para qual exame: a página de certification training pede login (conferido em 25 de outubro de 2026). Esta associação é a leitura do instrutor sobre onde os tópicos do curso e os objetivos do exame se sobrepõem, não uma declaração do fabricante.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "F5 publishes no fixed course to follow this one. The module courses build on the same BIG-IP base, so the next course is the one for the module your team runs.", // British English
          "pt-BR": "A F5 não publica um curso fixo para depois deste. Os cursos de módulo partem da mesma base de BIG-IP, então o próximo curso é o do módulo que a sua equipe opera.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://education.f5.com/courses/1195", // vendor page or outline document
        title: "Configuring BIG-IP APM: Access Policy Manager", // the vendor's own title, verbatim
        vendorCourseId: "F5-TRG-BIG-EGW-APM", // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "F5's course page publishes the description, not a module list or a courseware version.", // British English
          "pt-BR": "A página do curso na F5 publica a descrição, não uma lista de módulos nem a versão do material.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // Configuring BIG-IP AFM
      slug: "configuring-afm", // URL slug
      name: "Configuring BIG-IP AFM", // catalogue name (official names stay in English)
      altName: { // former or alternate name
        en: "Advanced Firewall Manager", // British English
        "pt-BR": "Advanced Firewall Manager", // Brazilian Portuguese
      },
      days: 2, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Data-centre network firewalling and DDoS defence.", // British English
        "pt-BR": "Firewall de rede para data center e defesa contra DDoS.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "Advanced Firewall Manager adds a high-performance, data-centre-grade network firewall to BIG-IP, built to protect the network layer in front of applications. This course covers configuring AFM firewall rules and policies, the order in which they are evaluated, and how AFM works with the traffic-processing objects of LTM. It addresses network-layer DoS and DDoS protection, IP Intelligence, and logging and reporting, building the skill to defend the network perimeter of an application delivery environment.", // British English
        "pt-BR": "O Advanced Firewall Manager acrescenta ao BIG-IP um firewall de rede de alto desempenho, de nível de data center, feito para proteger a camada de rede na frente das aplicações. Este curso cobre a configuração de regras e políticas de firewall no AFM, a ordem em que são avaliadas e como o AFM trabalha com os objetos de processamento de tráfego do LTM. Ele trata de proteção contra DoS e DDoS de camada de rede, IP Intelligence e logging e relatórios, construindo a habilidade de defender o perímetro de rede de um ambiente de application delivery.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "Setting up the BIG-IP system", "pt-BR": "Setup do sistema BIG-IP" }, // outline item 1
        { en: "Introducing Advanced Firewall Manager", "pt-BR": "Apresentação do Advanced Firewall Manager" }, // outline item 2
        { en: "Network firewall rules and policies", "pt-BR": "Regras e políticas de firewall de rede" }, // outline item 3
        { en: "Rule evaluation and ordering", "pt-BR": "Avaliação e ordem das regras" }, // outline item 4
        { en: "Network address translation with AFM", "pt-BR": "Tradução de endereços com o AFM" }, // outline item 5
        { en: "Detecting and mitigating DoS and DDoS", "pt-BR": "Detecção e mitigação de DoS e DDoS" }, // outline item 6
        { en: "Using IP Intelligence", "pt-BR": "Uso do IP Intelligence" }, // outline item 7
        { en: "Logging, reporting and monitoring", "pt-BR": "Logging, relatórios e monitoração" }, // outline item 8
      ],
      prerequisites: [ // prerequisites, in display order
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "F5's course page states no formal prerequisite.", // British English
            "pt-BR": "A página do curso na F5 não informa pré-requisito formal.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "not-exam-specific", // vendor-stated | topic-overlap | not-exam-specific
        credential: null, // credential or exam, as the vendor names it
        guides: [], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "F5's public certification list (education.f5.com, read 25 October 2026) has no credential specific to this product. The course builds operational skill rather than preparing for a particular exam.", // British English
          "pt-BR": "A lista pública de certificações da F5 (education.f5.com, lida em 25 de outubro de 2026) não tem credencial específica para este produto. O curso constrói habilidade operacional, sem preparar para um exame em particular.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "F5 publishes no fixed course to follow this one. The module courses build on the same BIG-IP base, so the next course is the one for the module your team runs.", // British English
          "pt-BR": "A F5 não publica um curso fixo para depois deste. Os cursos de módulo partem da mesma base de BIG-IP, então o próximo curso é o do módulo que a sua equipe opera.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://education.f5.com/courses/1115", // vendor page or outline document
        title: "Configuring BIG-IP AFM: Advanced Firewall Manager", // the vendor's own title, verbatim
        vendorCourseId: "F5-TRG-BIG-AFM-CFG-SDT", // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "F5's course page publishes the description and objectives (and the online edition's running time), not a module list or a courseware version.", // British English
          "pt-BR": "A página do curso na F5 publica a descrição e os objetivos (e a duração da edição online), não uma lista de módulos nem a versão do material.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // Configuring F5 SSL Orchestrator
      slug: "configuring-ssl-orchestrator", // URL slug
      name: "Configuring F5 SSL Orchestrator", // catalogue name (official names stay in English)
      days: 2, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "SSL/TLS visibility and dynamic security service chaining.", // British English
        "pt-BR": "Visibilidade de SSL/TLS e encadeamento dinâmico de serviços de segurança.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "Encrypted traffic hides both legitimate activity and threats, and SSL Orchestrator inspects it efficiently: decrypt once, steer the traffic through a chain of security devices, and re-encrypt, without each device handling decryption itself. This course covers the PKI and certificate essentials, the HTTP, ICAP, layer 3, layer 2 and TAP security services, choosing a topology, Guided Configuration deployments for outbound and inbound scenarios, traffic classification and URL bypass in security policies, high availability, and troubleshooting the traffic flow.", // British English
        "pt-BR": "O tráfego criptografado esconde tanto a atividade legítima quanto as ameaças, e o SSL Orchestrator o inspeciona com eficiência: descriptografa uma vez, conduz o tráfego por uma cadeia de equipamentos de segurança e criptografa de novo, sem que cada equipamento precise cuidar da descriptografia. Este curso cobre o essencial de PKI e certificados, os serviços de segurança HTTP, ICAP, camada 3, camada 2 e TAP, a escolha da topologia, as implantações por Guided Configuration para cenários de saída e de entrada, a classificação de tráfego e o URL bypass nas políticas de segurança, alta disponibilidade e troubleshooting do fluxo de tráfego.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "SSL Orchestrator compared with manual service chaining", "pt-BR": "SSL Orchestrator comparado ao encadeamento manual de serviços" }, // outline item 1
        { en: "PKI and certificate essentials", "pt-BR": "Fundamentos de PKI e certificados" }, // outline item 2
        { en: "HTTP, ICAP, layer 3, layer 2 and TAP security services", "pt-BR": "Serviços de segurança HTTP, ICAP, camada 3, camada 2 e TAP" }, // outline item 3
        { en: "Choosing a topology", "pt-BR": "Escolha da topologia" }, // outline item 4
        { en: "Guided Configuration deployments", "pt-BR": "Implantações por Guided Configuration" }, // outline item 5
        { en: "Traffic classification and URL bypass", "pt-BR": "Classificação de tráfego e URL bypass" }, // outline item 6
        { en: "High availability for SSL Orchestrator", "pt-BR": "Alta disponibilidade para o SSL Orchestrator" }, // outline item 7
        { en: "Troubleshooting the traffic flow", "pt-BR": "Troubleshooting do fluxo de tráfego" }, // outline item 8
      ],
      prerequisites: [ // prerequisites, in display order
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "F5's course page states no formal prerequisite.", // British English
            "pt-BR": "A página do curso na F5 não informa pré-requisito formal.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "not-exam-specific", // vendor-stated | topic-overlap | not-exam-specific
        credential: null, // credential or exam, as the vendor names it
        guides: [], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "F5's public certification list (education.f5.com, read 25 October 2026) has no credential specific to this product. The course builds operational skill rather than preparing for a particular exam.", // British English
          "pt-BR": "A lista pública de certificações da F5 (education.f5.com, lida em 25 de outubro de 2026) não tem credencial específica para este produto. O curso constrói habilidade operacional, sem preparar para um exame em particular.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "F5 publishes no fixed course to follow this one. The module courses build on the same BIG-IP base, so the next course is the one for the module your team runs.", // British English
          "pt-BR": "A F5 não publica um curso fixo para depois deste. Os cursos de módulo partem da mesma base de BIG-IP, então o próximo curso é o do módulo que a sua equipe opera.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://education.f5.com/courses/1130", // vendor page or outline document
        title: "Configuring BIG-IP SSL Orchestrator (SSLO)", // the vendor's own title, verbatim
        vendorCourseId: "F5-TRG-BIG-SSLO-SDT", // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "F5's course page publishes the description and objectives (and the online edition's running time), not a module list or a courseware version.", // British English
          "pt-BR": "A página do curso na F5 publica a descrição e os objetivos (e a duração da edição online), não uma lista de módulos nem a versão do material.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // Developing iRules for BIG-IP
      slug: "developing-irules", // URL slug
      name: "Developing iRules for BIG-IP", // catalogue name (official names stay in English)
      days: 3, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Custom traffic control with the iRules scripting language.", // British English
        "pt-BR": "Controle de tráfego personalizado com a linguagem de script iRules.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "iRules is BIG-IP's event-driven scripting language, and it is where the platform becomes programmable, letting an engineer inspect and act on traffic in ways the configuration objects alone cannot. This course builds iRules skill from the ground up: the event model, the syntax, and the most useful commands for inspecting and changing traffic. Students learn to parse and modify HTTP, make load-balancing and persistence decisions in code, work with data groups and variables, and write iRules that are correct and efficient, with attention to the troubleshooting and tuning that real iRules development requires.", // British English
        "pt-BR": "iRules é a linguagem de script orientada a eventos do BIG-IP, e é nela que a plataforma se torna programável, permitindo ao engenheiro inspecionar e agir sobre o tráfego de formas que os objetos de configuração sozinhos não permitem. Este curso constrói a habilidade em iRules desde a base: o modelo de eventos, a sintaxe e os comandos mais úteis para inspecionar e alterar o tráfego. Os alunos aprendem a analisar e modificar HTTP, tomar decisões de load balancing e de persistence em código, trabalhar com data groups e variáveis e escrever iRules corretas e eficientes, com atenção ao troubleshooting e ao ajuste que o desenvolvimento real de iRules exige.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "iRules concepts and the event model", "pt-BR": "Conceitos de iRules e o modelo de eventos" }, // outline item 1
        { en: "Getting started with iRules syntax", "pt-BR": "Primeiros passos na sintaxe de iRules" }, // outline item 2
        { en: "Working with HTTP in iRules", "pt-BR": "HTTP em iRules" }, // outline item 3
        { en: "Variables, operators and control structures", "pt-BR": "Variáveis, operadores e estruturas de controle" }, // outline item 4
        { en: "Using data groups", "pt-BR": "Uso de data groups" }, // outline item 5
        { en: "Load-balancing and persistence decisions", "pt-BR": "Decisões de load balancing e de persistence" }, // outline item 6
        { en: "Working with strings and parsing", "pt-BR": "Strings e parsing" }, // outline item 7
        { en: "iRules performance and good practice", "pt-BR": "Desempenho e boas práticas em iRules" }, // outline item 8
        { en: "Troubleshooting and debugging iRules", "pt-BR": "Troubleshooting e depuração de iRules" }, // outline item 9
      ],
      prerequisites: [ // prerequisites, in display order
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "F5 asks for a basic understanding of BIG-IP local traffic concepts (virtual servers, pools and profiles) and recommends familiarity with web application delivery, TCP, HTTP and TLS/SSL.", // British English
            "pt-BR": "A F5 pede uma compreensão básica dos conceitos de tráfego local do BIG-IP (virtual servers, pools e profiles) e recomenda familiaridade com entrega de aplicações web, TCP, HTTP e TLS/SSL.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "topic-overlap", // vendor-stated | topic-overlap | not-exam-specific
        credential: "F5 Certified Technology Specialist, BIG-IP LTM (F5-CTS, BIG-IP LTM)", // credential or exam, as the vendor names it
        guides: ["f5-cts-ltm-irules-analytics-templates"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "F5 does not publish a course-to-exam mapping on a public page: its certification-training page asks for a sign-in (checked 25 October 2026). This pairing is the instructor's reading of where the course topics and the exam objectives overlap, not a vendor statement.", // British English
          "pt-BR": "A F5 não publica em página aberta qual curso prepara para qual exame: a página de certification training pede login (conferido em 25 de outubro de 2026). Esta associação é a leitura do instrutor sobre onde os tópicos do curso e os objetivos do exame se sobrepõem, não uma declaração do fabricante.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "F5 publishes no fixed course to follow this one. The module courses build on the same BIG-IP base, so the next course is the one for the module your team runs.", // British English
          "pt-BR": "A F5 não publica um curso fixo para depois deste. Os cursos de módulo partem da mesma base de BIG-IP, então o próximo curso é o do módulo que a sua equipe opera.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://education.f5.com/courses/1120", // vendor page or outline document
        title: "Developing iRules for BIG-IP", // the vendor's own title, verbatim
        vendorCourseId: "F5-TRG-BIG-IRULE-CFG-SDT", // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "F5's course page publishes the description and objectives (and the online edition's running time), not a module list or a courseware version.", // British English
          "pt-BR": "A página do curso na F5 publica a descrição e os objetivos (e a duração da edição online), não uma lista de módulos nem a versão do material.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // Configuring and Managing BIG-IQ
      slug: "configuring-managing-big-iq", // URL slug
      name: "Configuring and Managing BIG-IQ", // catalogue name (official names stay in English)
      days: 2, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Centralised management of many BIG-IP devices with BIG-IQ.", // British English
        "pt-BR": "Gerência centralizada de muitos equipamentos BIG-IP com o BIG-IQ.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "When an organisation runs many BIG-IP devices, managing them one at a time stops scaling, and BIG-IQ is the answer: a central platform for managing devices, configurations, licences and security policies across a BIG-IP estate. This course covers building, configuring and resetting BIG-IQ, discovering and importing managed devices, a BIG-IQ high-availability pair, and centrally administering BIG-IP LTM devices, including clustered ones. It also addresses managing security objects at scale, licence management for Virtual Editions, and the monitoring, reporting and role-based administration that make a large deployment governable.", // British English
        "pt-BR": "Quando uma organização opera muitos equipamentos BIG-IP, gerenciá-los um a um deixa de escalar, e o BIG-IQ é a resposta: uma plataforma central para gerenciar equipamentos, configurações, licenças e políticas de segurança em todo o parque de BIG-IP. Este curso cobre a construção, configuração e reset do BIG-IQ, a descoberta e importação dos equipamentos gerenciados, um par de alta disponibilidade de BIG-IQ e a administração centralizada de equipamentos BIG-IP LTM, inclusive em cluster. Também trata da gerência de objetos de segurança em escala, da gerência de licenças de Virtual Editions e da monitoração, dos relatórios e da administração por papéis que tornam governável uma implantação grande.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "Introducing BIG-IQ", "pt-BR": "Apresentação do BIG-IQ" }, // outline item 1
        { en: "Setting up BIG-IQ and the data collection device", "pt-BR": "Setup do BIG-IQ e do data collection device" }, // outline item 2
        { en: "Discovering and importing BIG-IP devices", "pt-BR": "Descoberta e importação de equipamentos BIG-IP" }, // outline item 3
        { en: "Centrally managing LTM configuration", "pt-BR": "Gerência centralizada da configuração de LTM" }, // outline item 4
        { en: "Managing security policies at scale", "pt-BR": "Gerência de políticas de segurança em escala" }, // outline item 5
        { en: "Licence management for BIG-IP Virtual Edition", "pt-BR": "Gerência de licenças do BIG-IP Virtual Edition" }, // outline item 6
        { en: "Monitoring, dashboards and reporting", "pt-BR": "Monitoração, dashboards e relatórios" }, // outline item 7
        { en: "Role-based access and administration", "pt-BR": "Acesso por papéis e administração" }, // outline item 8
      ],
      outlineNote: { // version, edition or legacy context
        en: "F5 now publishes this material as two courses: Configuring BIG-IQ, instructor-led or online (the outline linked here), and Managing BIG-IP Products with BIG-IQ, online only. This summary spans both.", // British English
        "pt-BR": "A F5 hoje publica este conteúdo como dois cursos: Configuring BIG-IQ, com instrutor ou online (a ementa linkada aqui), e Managing BIG-IP Products with BIG-IQ, só online. Este resumo abrange os dois.", // Brazilian Portuguese
      },
      prerequisites: [ // prerequisites, in display order
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "F5's course page states no formal prerequisite.", // British English
            "pt-BR": "A página do curso na F5 não informa pré-requisito formal.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "not-exam-specific", // vendor-stated | topic-overlap | not-exam-specific
        credential: null, // credential or exam, as the vendor names it
        guides: [], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "F5's public certification list (education.f5.com, read 25 October 2026) has no credential specific to this product. The course builds operational skill rather than preparing for a particular exam.", // British English
          "pt-BR": "A lista pública de certificações da F5 (education.f5.com, lida em 25 de outubro de 2026) não tem credencial específica para este produto. O curso constrói habilidade operacional, sem preparar para um exame em particular.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "external", // courses | external | none
        name: "Managing BIG-IP Products with BIG-IQ", // the vendor's follow-on course, verbatim
        url: "https://education.f5.com/courses/1126", // its public page
        basis: { // basis of the recommendation
          en: "F5 states that Configuring BIG-IQ is a required prerequisite for its online course Managing BIG-IP Products with BIG-IQ (education.f5.com, read 25 October 2026). That course is not part of my catalogue.", // British English
          "pt-BR": "A F5 informa que o Configuring BIG-IQ é pré-requisito obrigatório do curso online Managing BIG-IP Products with BIG-IQ (education.f5.com, lido em 25 de outubro de 2026). Esse curso não faz parte do meu catálogo.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://education.f5.com/courses/1125", // vendor page or outline document
        title: "Configuring BIG-IQ", // the vendor's own title, verbatim
        vendorCourseId: "F5-TRG-BIQ-CFG-SDT", // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "F5's course page publishes the description and objectives (and the online edition's running time), not a module list or a courseware version.", // British English
          "pt-BR": "A página do curso na F5 publica a descrição e os objetivos (e a duração da edição online), não uma lista de módulos nem a versão do material.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // Automating BIG-IP
      slug: "automating-big-ip", // URL slug
      name: "Automating BIG-IP", // catalogue name (official names stay in English)
      altName: { // former or alternate name
        en: "with Ansible and AS3", // British English
        "pt-BR": "com Ansible e AS3", // Brazilian Portuguese
      },
      days: 3, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Declarative and automated BIG-IP configuration.", // British English
        "pt-BR": "Configuração declarativa e automatizada do BIG-IP.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "Modern infrastructure is configured as code, and this course brings BIG-IP into that world. After a review of the Linux command line and BIG-IP basics, it covers automation and DevOps concepts (infrastructure as code, orchestration, source of truth, idempotency, imperative and declarative APIs), JSON and the iControl REST API, onboarding with Declarative Onboarding (DO), and deploying applications with AS3 from curl and Postman. It closes with YAML and Ansible: architecture, modules, inventories, playbooks with conditional tasks and vaults, used to onboard, license and deploy highly available applications.", // British English
        "pt-BR": "A infraestrutura moderna é configurada como código, e este curso leva o BIG-IP para esse mundo. Depois de uma revisão da linha de comando Linux e do básico de BIG-IP, ele cobre conceitos de automação e DevOps (infraestrutura como código, orquestração, source of truth, idempotência, APIs imperativas e declarativas), JSON e a API iControl REST, onboarding com o Declarative Onboarding (DO) e implantação de aplicações com AS3 a partir do curl e do Postman. Fecha com YAML e Ansible: arquitetura, módulos, inventários, playbooks com tarefas condicionais e vaults, usados para fazer onboarding, licenciar e implantar aplicações em alta disponibilidade.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "Linux command line and BIG-IP basics review", "pt-BR": "Revisão da linha de comando Linux e do básico de BIG-IP" }, // outline item 1
        { en: "Automation and DevOps concepts", "pt-BR": "Conceitos de automação e DevOps" }, // outline item 2
        { en: "JSON and the iControl REST API", "pt-BR": "JSON e a API iControl REST" }, // outline item 3
        { en: "Onboarding with iControl REST and Declarative Onboarding", "pt-BR": "Onboarding com iControl REST e Declarative Onboarding" }, // outline item 4
        { en: "Deploying applications with AS3", "pt-BR": "Implantação de aplicações com AS3" }, // outline item 5
        { en: "YAML", "pt-BR": "YAML" }, // outline item 6
        { en: "Ansible architecture, modules and inventories", "pt-BR": "Arquitetura, módulos e inventários do Ansible" }, // outline item 7
        { en: "Playbooks, vaults and highly available deployments", "pt-BR": "Playbooks, vaults e implantações em alta disponibilidade" }, // outline item 8
      ],
      prerequisites: [ // prerequisites, in display order
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "F5's course page states no formal prerequisite.", // British English
            "pt-BR": "A página do curso na F5 não informa pré-requisito formal.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "not-exam-specific", // vendor-stated | topic-overlap | not-exam-specific
        credential: null, // credential or exam, as the vendor names it
        guides: [], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "F5's public certification list (education.f5.com, read 25 October 2026) has no credential specific to this product. The course builds operational skill rather than preparing for a particular exam.", // British English
          "pt-BR": "A lista pública de certificações da F5 (education.f5.com, lida em 25 de outubro de 2026) não tem credencial específica para este produto. O curso constrói habilidade operacional, sem preparar para um exame em particular.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "F5 publishes no fixed course to follow this one. The module courses build on the same BIG-IP base, so the next course is the one for the module your team runs.", // British English
          "pt-BR": "A F5 não publica um curso fixo para depois deste. Os cursos de módulo partem da mesma base de BIG-IP, então o próximo curso é o do módulo que a sua equipe opera.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://education.f5.com/courses/1194", // vendor page or outline document
        title: "Automating BIG-IP", // the vendor's own title, verbatim
        vendorCourseId: "F5-TRG-BIG-AUTO-AS3", // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "F5's course page publishes the description, not a module list or a courseware version. F5 also lists separate online courses, Automating BIG-IP with Ansible and Automating BIG-IP with AS3.", // British English
          "pt-BR": "A página do curso na F5 publica a descrição, não uma lista de módulos nem a versão do material. A F5 também lista cursos online separados, Automating BIG-IP with Ansible e Automating BIG-IP with AS3.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
  ],
};

// ============================================================================
// EXTREME NETWORKS: 9 courses.
// ============================================================================
const extreme: Platform = { // the Extreme Networks platform
  slug: "extreme", // URL slug
  name: "Extreme Networks", // display name
  tagline: { // short tagline
    en: "Campus switching, SD-WAN, and cloud-driven network operations.", // British English
    "pt-BR": "Switching de campus, SD-WAN e operação de rede gerenciada pela nuvem.", // Brazilian Portuguese
  },
  intro: { // platform introduction
    en: "Extreme Networks builds the switching, routing, and cloud-managed networking that runs enterprise campuses. These courses follow Extreme's Professional Program across two tracks, Extreme Switching on ExtremeXOS / Switch Engine and ExtremeCloud SD-WAN, each progressing from installation and configuration through management, advanced configuration, and troubleshooting, plus a dedicated course on API and automation for ExtremeCloud IQ. The lineage runs back to Enterasys and Cabletron, where this career began.", // British English
    "pt-BR": "A Extreme Networks fabrica o switching, o roteamento e a rede gerenciada pela nuvem que sustentam campi corporativos. Estes cursos seguem o Professional Program da Extreme em duas trilhas, Extreme Switching em ExtremeXOS / Switch Engine e ExtremeCloud SD-WAN, cada uma indo de instalação e configuração a gerência, configuração avançada e troubleshooting, além de um curso dedicado a API e automação para o ExtremeCloud IQ. A linhagem vem da Enterasys e da Cabletron, onde esta carreira começou.", // Brazilian Portuguese
  },
  since: "2021", // authorized instructor since
  workingSince: "1996", // hands-on with the technology since
  workingTechKey: "switchesRouters", // training.tech.* label key
  courses: [ // the courses, in display order
    { // ExtremeSwitching: Installation and Configuration
      slug: "switching-installation-configuration", // URL slug
      name: "ExtremeSwitching: Installation and Configuration", // catalogue name (official names stay in English)
      days: 3, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Layer 2 and layer 3 configuration on ExtremeXOS / Switch Engine.", // British English
        "pt-BR": "Configuração de camada 2 e camada 3 em ExtremeXOS / Switch Engine.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "The first step in the Extreme Switching track, this course builds the core skills for deploying and configuring ExtremeXOS / Switch Engine switches from the CLI. It works through the layer 2 mechanisms that underpin a switched network (VLANs, discovery protocols, loop prevention and redundancy with Spanning Tree, link aggregation, MLAG, EAPS and ERPS, ELRP and SLPP Guard), then moves into layer 3: static routing, virtual routers and VRFs, gateway redundancy, OSPF, IP multicast with PIM, and IPv6. The knowledge is reinforced throughout with hands-on lab work on real equipment.", // British English
        "pt-BR": "Primeiro passo da trilha Extreme Switching, este curso constrói as habilidades centrais para implantar e configurar switches ExtremeXOS / Switch Engine pela CLI. Ele percorre os mecanismos de camada 2 que sustentam uma rede comutada (VLANs, protocolos de descoberta, prevenção de loop e redundância com Spanning Tree, link aggregation, MLAG, EAPS e ERPS, ELRP e SLPP Guard) e depois entra na camada 3: roteamento estático, virtual routers e VRFs, redundância de gateway, OSPF, IP multicast com PIM e IPv6. O conhecimento é reforçado o tempo todo com laboratório prático em equipamento real.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "VLAN principles and operations", "pt-BR": "Princípios e operação de VLANs" }, // outline item 1
        { en: "Discovery protocols", "pt-BR": "Protocolos de descoberta" }, // outline item 2
        { en: "Loop prevention and redundancy: Spanning Tree and link aggregation", "pt-BR": "Prevenção de loop e redundância: Spanning Tree e link aggregation" }, // outline item 3
        { en: "MLAG", "pt-BR": "MLAG" }, // outline item 4
        { en: "Ring redundancy with EAPS and ERPS", "pt-BR": "Redundância em anel com EAPS e ERPS" }, // outline item 5
        { en: "ELRP and SLPP Guard", "pt-BR": "ELRP e SLPP Guard" }, // outline item 6
        { en: "Routing overview and static routing", "pt-BR": "Visão geral de roteamento e roteamento estático" }, // outline item 7
        { en: "Virtual routers and VRFs", "pt-BR": "Virtual routers e VRFs" }, // outline item 8
        { en: "Gateway redundancy", "pt-BR": "Redundância de gateway" }, // outline item 9
        { en: "OSPF", "pt-BR": "OSPF" }, // outline item 10
        { en: "IP multicast and PIM", "pt-BR": "IP multicast e PIM" }, // outline item 11
        { en: "IPv6 operations", "pt-BR": "Operação de IPv6" }, // outline item 12
      ],
      outlineNote: { // version, edition or legacy context
        en: "On Extreme's global courses page the outline link for this course opens the Extreme Fabric - Installation and Configuration document instead, so the outline used here is Extreme's UK course page.", // British English
        "pt-BR": "Na página global de cursos da Extreme, o link de ementa deste curso abre o documento do Extreme Fabric - Installation and Configuration, então a ementa usada aqui é a página do curso no site da Extreme no Reino Unido.", // Brazilian Portuguese
      },
      prerequisites: [ // prerequisites, in display order
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "Extreme requires the Meet Extreme Switching Welcome Series certification before the class, and a solid grasp of LAN concepts, including advanced Ethernet and TCP/IP.", // British English
            "pt-BR": "A Extreme exige a certificação Meet Extreme Switching Welcome Series antes da turma e domínio sólido de conceitos de LAN, incluindo Ethernet avançado e TCP/IP.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "vendor-stated", // vendor-stated | topic-overlap | not-exam-specific
        credential: "Extreme Certified Professional in Extreme Switching", // credential or exam, as the vendor names it
        guides: ["extreme-ecp-switching"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "Extreme's outline for the Extreme Certified Professional in Extreme Switching lists this course as one of the track's four knowledge credentials. The ECP exam opens only after all four, and the certification also needs a one-day practical lab assessment.", // British English
          "pt-BR": "A ementa da Extreme para o Extreme Certified Professional in Extreme Switching lista este curso como uma das quatro knowledge credentials da trilha. O exame ECP só é liberado depois das quatro, e a certificação ainda exige uma avaliação prática de laboratório de um dia.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "courses", // courses | external | none
        courses: [{ platform: "extreme", course: "switching-management" }, { platform: "extreme", course: "switching-advanced-configuration" }, { platform: "extreme", course: "switching-troubleshooting" }], // named next course(s) of this catalogue
        basis: { // basis of the recommendation
          en: "Extreme names this course's learning credential as the mandatory prerequisite of the three other Extreme Switching courses, which can follow in any order.", // British English
          "pt-BR": "A Extreme aponta a learning credential deste curso como pré-requisito obrigatório dos outros três cursos de Extreme Switching, que podem vir em qualquer ordem.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://uk.extremenetworks.com/e_courses/extreme-switching-installation-and-configuration/", // vendor page or outline document
        title: "Extreme Switching – Installation and Configuration", // the vendor's own title, verbatim
        vendorCourseId: null, // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "Extreme's UK course page gives a 3-day duration, the prerequisite, objectives and agenda, and no courseware or software version.", // British English
          "pt-BR": "A página do curso no site da Extreme no Reino Unido traz duração de 3 dias, o pré-requisito, os objetivos e a agenda, e nenhuma versão do material ou do software.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // ExtremeSwitching: Management
      slug: "switching-management", // URL slug
      name: "ExtremeSwitching: Management", // catalogue name (official names stay in English)
      days: 1, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Preparing and managing switching with ExtremeCloud IQ and Site Engine.", // British English
        "pt-BR": "Preparar e gerenciar o switching com o ExtremeCloud IQ e o Site Engine.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "This course covers preparing an ExtremeXOS / Switch Engine environment for management, whether through ExtremeCloud IQ, ExtremeCloud IQ Site Engine or capable third-party tools. Students implement the management mechanisms on the switches, onboard devices to ExtremeCloud IQ, manage and configure them from it and from Site Engine, and carry out the common network-management tasks that keep an estate observable and maintainable, practised hands-on against real equipment.", // British English
        "pt-BR": "Este curso cobre a preparação de um ambiente ExtremeXOS / Switch Engine para gerência, seja pelo ExtremeCloud IQ, pelo ExtremeCloud IQ Site Engine ou por ferramentas de terceiros compatíveis. Os alunos implementam os mecanismos de gerência nos switches, fazem o onboarding dos equipamentos no ExtremeCloud IQ, gerenciam e configuram os switches a partir dele e do Site Engine e executam as tarefas comuns de gerência de rede que mantêm o parque observável e fácil de manter, tudo praticado em equipamento real.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "ExtremeXOS / Switch Engine management basics", "pt-BR": "Fundamentos de gerência no ExtremeXOS / Switch Engine" }, // outline item 1
        { en: "Network management", "pt-BR": "Gerência de rede" }, // outline item 2
        { en: "Onboarding ExtremeXOS / Switch Engine to ExtremeCloud IQ", "pt-BR": "Onboarding do ExtremeXOS / Switch Engine no ExtremeCloud IQ" }, // outline item 3
        { en: "Managing ExtremeXOS / Switch Engine with ExtremeCloud IQ", "pt-BR": "Gerência do ExtremeXOS / Switch Engine com o ExtremeCloud IQ" }, // outline item 4
        { en: "Configuring ExtremeXOS / Switch Engine with ExtremeCloud IQ", "pt-BR": "Configuração do ExtremeXOS / Switch Engine com o ExtremeCloud IQ" }, // outline item 5
        { en: "Managing ExtremeXOS / Switch Engine with ExtremeCloud IQ Site Engine", "pt-BR": "Gerência do ExtremeXOS / Switch Engine com o ExtremeCloud IQ Site Engine" }, // outline item 6
      ],
      prerequisites: [ // prerequisites, in display order
        { course: { platform: "extreme", course: "switching-installation-configuration" } }, // a course of this catalogue
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "Extreme requires the full learning credential for Extreme Switching - Installation and Configuration: the course and its exam.", // British English
            "pt-BR": "A Extreme exige a learning credential completa de Extreme Switching - Installation and Configuration: o curso e o exame dele.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "vendor-stated", // vendor-stated | topic-overlap | not-exam-specific
        credential: "Extreme Certified Professional in Extreme Switching", // credential or exam, as the vendor names it
        guides: ["extreme-ecp-switching"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "Extreme's outline for the Extreme Certified Professional in Extreme Switching lists this course as one of the track's four knowledge credentials. The ECP exam opens only after all four, and the certification also needs a one-day practical lab assessment.", // British English
          "pt-BR": "A ementa da Extreme para o Extreme Certified Professional in Extreme Switching lista este curso como uma das quatro knowledge credentials da trilha. O exame ECP só é liberado depois das quatro, e a certificação ainda exige uma avaliação prática de laboratório de um dia.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "No fixed next course: Management, Advanced Configuration and Troubleshooting each build on Installation and Configuration and can be taken in any order. Once all four are complete, the next step in Extreme's programme is the ECP in Extreme Switching exam and lab assessment, not another course.", // British English
          "pt-BR": "Sem próximo curso fixo: Management, Advanced Configuration e Troubleshooting partem de Installation and Configuration e podem ser feitos em qualquer ordem. Concluídos os quatro, o próximo passo no programa da Extreme é o exame e a avaliação de laboratório do ECP in Extreme Switching, não outro curso.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://extr-p-001.sitecorecontenthub.cloud/api/public/content/703c126605c1429c96b5636162379d33?v=0a63debd", // vendor page or outline document
        title: "Course Outline: Extreme Switching – Management", // the vendor's own title, verbatim
        vendorCourseId: null, // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "Extreme's course outline document gives the duration, prerequisite, objectives and agenda. It states no courseware or software version.", // British English
          "pt-BR": "O documento de ementa da Extreme traz a duração, o pré-requisito, os objetivos e a agenda. Não informa versão do material nem do software.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // ExtremeSwitching: Advanced Configuration
      slug: "switching-advanced-configuration", // URL slug
      name: "ExtremeSwitching: Advanced Configuration", // catalogue name (official names stay in English)
      days: 2, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Layer 3, security, optimisation and automation on ExtremeXOS / Switch Engine.", // British English
        "pt-BR": "Camada 3, segurança, otimização e automação em ExtremeXOS / Switch Engine.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "Building on installation and configuration, this course covers the more advanced capabilities of ExtremeXOS / Switch Engine. It addresses layer 3 operations (virtual routers and VRFs, IP multicast with PIM, IPv6), security mechanisms such as authentication, authorisation and accounting, access control lists and ONEPolicy, traffic optimisation including Quality of Service, and extending the switch through automation with Fabric Attach, CLI scripting and Python. As with the rest of the track, the concepts are reinforced with real-world hands-on tasks in the lab.", // British English
        "pt-BR": "Partindo da instalação e configuração, este curso cobre os recursos mais avançados do ExtremeXOS / Switch Engine. Ele trata da operação de camada 3 (virtual routers e VRFs, IP multicast com PIM, IPv6), de mecanismos de segurança como autenticação, autorização e accounting, access control lists e ONEPolicy, da otimização de tráfego, incluindo Quality of Service, e da extensão do switch por automação com Fabric Attach, scripts de CLI e Python. Como no resto da trilha, os conceitos são reforçados com tarefas práticas do mundo real no laboratório.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "Layer 3: virtual routers and VRFs", "pt-BR": "Camada 3: virtual routers e VRFs" }, // outline item 1
        { en: "IP multicast and PIM", "pt-BR": "IP multicast e PIM" }, // outline item 2
        { en: "IPv6", "pt-BR": "IPv6" }, // outline item 3
        { en: "ExtremeXOS security overview", "pt-BR": "Visão geral de segurança no ExtremeXOS" }, // outline item 4
        { en: "Authentication, authorisation and accounting", "pt-BR": "Autenticação, autorização e accounting" }, // outline item 5
        { en: "Access control lists", "pt-BR": "Access control lists" }, // outline item 6
        { en: "Policy (ONEPolicy)", "pt-BR": "Policy (ONEPolicy)" }, // outline item 7
        { en: "Traffic optimisation", "pt-BR": "Otimização de tráfego" }, // outline item 8
        { en: "Automation: CLI and Python scripting", "pt-BR": "Automação: scripts de CLI e Python" }, // outline item 9
        { en: "Fabric Attach", "pt-BR": "Fabric Attach" }, // outline item 10
      ],
      prerequisites: [ // prerequisites, in display order
        { course: { platform: "extreme", course: "switching-installation-configuration" } }, // a course of this catalogue
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "Extreme requires the full learning credential for Extreme Switching - Installation and Configuration: the course and its exam.", // British English
            "pt-BR": "A Extreme exige a learning credential completa de Extreme Switching - Installation and Configuration: o curso e o exame dele.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "vendor-stated", // vendor-stated | topic-overlap | not-exam-specific
        credential: "Extreme Certified Professional in Extreme Switching", // credential or exam, as the vendor names it
        guides: ["extreme-ecp-switching"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "Extreme's outline for the Extreme Certified Professional in Extreme Switching lists this course as one of the track's four knowledge credentials. The ECP exam opens only after all four, and the certification also needs a one-day practical lab assessment.", // British English
          "pt-BR": "A ementa da Extreme para o Extreme Certified Professional in Extreme Switching lista este curso como uma das quatro knowledge credentials da trilha. O exame ECP só é liberado depois das quatro, e a certificação ainda exige uma avaliação prática de laboratório de um dia.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "No fixed next course: Management, Advanced Configuration and Troubleshooting each build on Installation and Configuration and can be taken in any order. Once all four are complete, the next step in Extreme's programme is the ECP in Extreme Switching exam and lab assessment, not another course.", // British English
          "pt-BR": "Sem próximo curso fixo: Management, Advanced Configuration e Troubleshooting partem de Installation and Configuration e podem ser feitos em qualquer ordem. Concluídos os quatro, o próximo passo no programa da Extreme é o exame e a avaliação de laboratório do ECP in Extreme Switching, não outro curso.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://extr-p-001.sitecorecontenthub.cloud/api/public/content/ec286a2fc8b34e94987ccdabc0ab9eba?v=c974db81", // vendor page or outline document
        title: "Course Outline: Extreme Switching – Advanced Configuration", // the vendor's own title, verbatim
        vendorCourseId: null, // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "Extreme's course outline document gives the duration, prerequisite, objectives and agenda. It states no courseware or software version.", // British English
          "pt-BR": "O documento de ementa da Extreme traz a duração, o pré-requisito, os objetivos e a agenda. Não informa versão do material nem do software.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // ExtremeSwitching: Troubleshooting
      slug: "switching-troubleshooting", // URL slug
      name: "ExtremeSwitching: Troubleshooting", // catalogue name (official names stay in English)
      days: 2, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Troubleshooting method and tooling for Switch Engine.", // British English
        "pt-BR": "Método e ferramentas de troubleshooting para o Switch Engine.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "This course builds structured troubleshooting skill for ExtremeXOS / Switch Engine environments. Students learn a troubleshooting mindset and the toolkit available to network engineers and administrators: deciding whether an issue is network-related, diagnosing the switch and the surrounding network with built-in tools layer by layer, and resolving the problems met most often. It also covers preparing a case for Extreme's GTAC support organisation, so escalation is handled cleanly when needed. The skills are practised hands-on in the lab.", // British English
        "pt-BR": "Este curso constrói habilidade estruturada de troubleshooting para ambientes ExtremeXOS / Switch Engine. Os alunos aprendem uma mentalidade de troubleshooting e o conjunto de ferramentas à disposição de engenheiros e administradores de rede: decidir se o problema é de rede, diagnosticar o switch e a rede ao redor com ferramentas nativas, camada por camada, e resolver os problemas mais frequentes. Também cobre a preparação de um chamado para o GTAC, o suporte da Extreme, para que a escalada aconteça de forma limpa quando necessário. As habilidades são praticadas no laboratório.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "Troubleshooting mindset", "pt-BR": "Mentalidade de troubleshooting" }, // outline item 1
        { en: "Troubleshooting toolset", "pt-BR": "Ferramentas de troubleshooting" }, // outline item 2
        { en: "Layer 1 network issues", "pt-BR": "Problemas de rede de camada 1" }, // outline item 3
        { en: "Layer 2 network issues", "pt-BR": "Problemas de rede de camada 2" }, // outline item 4
        { en: "Layer 3 network issues", "pt-BR": "Problemas de rede de camada 3" }, // outline item 5
        { en: "GTAC case preparation", "pt-BR": "Preparação de chamado para o GTAC" }, // outline item 6
      ],
      prerequisites: [ // prerequisites, in display order
        { course: { platform: "extreme", course: "switching-installation-configuration" } }, // a course of this catalogue
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "Extreme requires the full learning credential for Extreme Switching - Installation and Configuration: the course and its exam.", // British English
            "pt-BR": "A Extreme exige a learning credential completa de Extreme Switching - Installation and Configuration: o curso e o exame dele.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "vendor-stated", // vendor-stated | topic-overlap | not-exam-specific
        credential: "Extreme Certified Professional in Extreme Switching", // credential or exam, as the vendor names it
        guides: ["extreme-ecp-switching"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "Extreme's outline for the Extreme Certified Professional in Extreme Switching lists this course as one of the track's four knowledge credentials. The ECP exam opens only after all four, and the certification also needs a one-day practical lab assessment.", // British English
          "pt-BR": "A ementa da Extreme para o Extreme Certified Professional in Extreme Switching lista este curso como uma das quatro knowledge credentials da trilha. O exame ECP só é liberado depois das quatro, e a certificação ainda exige uma avaliação prática de laboratório de um dia.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "No fixed next course: Management, Advanced Configuration and Troubleshooting each build on Installation and Configuration and can be taken in any order. Once all four are complete, the next step in Extreme's programme is the ECP in Extreme Switching exam and lab assessment, not another course.", // British English
          "pt-BR": "Sem próximo curso fixo: Management, Advanced Configuration e Troubleshooting partem de Installation and Configuration e podem ser feitos em qualquer ordem. Concluídos os quatro, o próximo passo no programa da Extreme é o exame e a avaliação de laboratório do ECP in Extreme Switching, não outro curso.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://extr-p-001.sitecorecontenthub.cloud/api/public/content/dfbfaa44a5b345e9a52f43f78b930fa6?v=de9d22be", // vendor page or outline document
        title: "Course Outline: Extreme Switching – Troubleshooting", // the vendor's own title, verbatim
        vendorCourseId: null, // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "Extreme's course outline document gives the duration, prerequisite, objectives and agenda. It states no courseware or software version.", // British English
          "pt-BR": "O documento de ementa da Extreme traz a duração, o pré-requisito, os objetivos e a agenda. Não informa versão do material nem do software.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // ExtremeCloud SD-WAN: Installation and Configuration
      slug: "sdwan-installation-configuration", // URL slug
      name: "ExtremeCloud SD-WAN: Installation and Configuration", // catalogue name (official names stay in English)
      days: 2, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Standing up an ExtremeCloud SD-WAN solution in every deployment mode.", // British English
        "pt-BR": "Colocar uma solução ExtremeCloud SD-WAN no ar em todos os modos de implantação.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "The entry point to the ExtremeCloud SD-WAN track, this course builds the skill to install and configure an ExtremeCloud SD-WAN in all its deployment modes: full router, bridge, hybrid and Remote Visibility & Control (RVC). Students learn the architecture of the solution (connectivity, security, application performance and orchestration), onboard the SD-WAN appliances (ipes) from the ExtremeCloud SD-WAN Orchestrator, and work with templates, overlays, security, application group policies and the features behind application visibility, application control and dynamic WAN selection, validating application flows in the lab.", // British English
        "pt-BR": "Porta de entrada da trilha ExtremeCloud SD-WAN, este curso constrói a habilidade de instalar e configurar um ExtremeCloud SD-WAN em todos os seus modos de implantação: full router, bridge, híbrido e Remote Visibility & Control (RVC). Os alunos aprendem a arquitetura da solução (conectividade, segurança, desempenho de aplicações e orquestração), fazem o onboarding dos appliances de SD-WAN (ipes) pelo ExtremeCloud SD-WAN Orchestrator e trabalham com templates, overlays, segurança, políticas por grupo de aplicações e os recursos por trás de application visibility, application control e dynamic WAN selection, validando os fluxos de aplicação no laboratório.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "ExtremeCloud SD-WAN overview", "pt-BR": "Visão geral do ExtremeCloud SD-WAN" }, // outline item 1
        { en: "SD-WAN appliances (ipes): architecture, addressing, communications", "pt-BR": "Appliances de SD-WAN (ipes): arquitetura, endereçamento, comunicação" }, // outline item 2
        { en: "Product range and installation", "pt-BR": "Linha de produtos e instalação" }, // outline item 3
        { en: "ExtremeCloud SD-WAN Orchestrator and workflows", "pt-BR": "ExtremeCloud SD-WAN Orchestrator e workflows" }, // outline item 4
        { en: "Templates and overlays", "pt-BR": "Templates e overlays" }, // outline item 5
        { en: "Security and application group policies", "pt-BR": "Segurança e políticas por grupo de aplicações" }, // outline item 6
        { en: "ipe local parameters", "pt-BR": "Parâmetros locais dos ipes" }, // outline item 7
        { en: "Application visibility, cloud application database and application control", "pt-BR": "Application visibility, base de aplicações em nuvem e application control" }, // outline item 8
        { en: "Dynamic WAN selection", "pt-BR": "Dynamic WAN selection" }, // outline item 9
      ],
      prerequisites: [ // prerequisites, in display order
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "Extreme requires the Meet ExtremeCloud SD-WAN Welcome Series certification before the class, and a solid grasp of LAN and WAN concepts, including Ethernet, MPLS, TCP/IP and software applications.", // British English
            "pt-BR": "A Extreme exige a certificação Meet ExtremeCloud SD-WAN Welcome Series antes da turma e domínio sólido de conceitos de LAN e WAN, incluindo Ethernet, MPLS, TCP/IP e aplicações de software.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "vendor-stated", // vendor-stated | topic-overlap | not-exam-specific
        credential: "Extreme Certified Professional in ExtremeCloud SD-WAN", // credential or exam, as the vendor names it
        guides: ["extreme-ecp-sdwan"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "Extreme's outline for the Extreme Certified Professional in ExtremeCloud SD-WAN lists this course as one of the track's four knowledge credentials. The ECP exam opens only after all four, and the certification also needs a one-day practical lab assessment.", // British English
          "pt-BR": "A ementa da Extreme para o Extreme Certified Professional in ExtremeCloud SD-WAN lista este curso como uma das quatro knowledge credentials da trilha. O exame ECP só é liberado depois das quatro, e a certificação ainda exige uma avaliação prática de laboratório de um dia.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "courses", // courses | external | none
        courses: [{ platform: "extreme", course: "sdwan-management" }, { platform: "extreme", course: "sdwan-advanced-configuration" }, { platform: "extreme", course: "sdwan-troubleshooting" }], // named next course(s) of this catalogue
        basis: { // basis of the recommendation
          en: "Extreme names this course as the mandatory prerequisite of the three other ExtremeCloud SD-WAN courses, which can follow in any order.", // British English
          "pt-BR": "A Extreme aponta este curso como pré-requisito obrigatório dos outros três cursos de ExtremeCloud SD-WAN, que podem vir em qualquer ordem.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://extr-p-001.sitecorecontenthub.cloud/api/public/content/883f341317cc41f18de205ec1919238e?v=43706c6a", // vendor page or outline document
        title: "Course Outline: ExtremeCloud™ SD-WAN – Installation and Configuration", // the vendor's own title, verbatim
        vendorCourseId: null, // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "Extreme's course outline document gives the duration, prerequisite, objectives and agenda. It states no courseware or software version.", // British English
          "pt-BR": "O documento de ementa da Extreme traz a duração, o pré-requisito, os objetivos e a agenda. Não informa versão do material nem do software.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // ExtremeCloud SD-WAN: Management
      slug: "sdwan-management", // URL slug
      name: "ExtremeCloud SD-WAN: Management", // catalogue name (official names stay in English)
      days: 1, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Application visibility, control and reporting on ExtremeCloud SD-WAN.", // British English
        "pt-BR": "Visibilidade, controle e relatórios de aplicações no ExtremeCloud SD-WAN.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "Building on the installation and configuration course and its labs, this lab-intensive course analyses WAN application traffic and how it is distributed across the bridge, router, hybrid and RVC site types. Students learn to read the application metrics (throughput and goodput, jitter, delay, loss, retransmissions and the Experience Quality Score), work the application dashboards, define applications and application groups with QoS profiles, implement application visibility, application control, WAN optimisation and dynamic WAN selection, and build reports for day-to-day operations.", // British English
        "pt-BR": "Partindo do curso de instalação e configuração e dos seus laboratórios, este curso, intensivo em laboratório, analisa o tráfego de aplicações na WAN e como ele se distribui entre os tipos de site bridge, router, híbrido e RVC. Os alunos aprendem a ler as métricas de aplicação (throughput e goodput, jitter, atraso, perda, retransmissões e o Experience Quality Score), usar os dashboards de aplicações, definir aplicações e grupos de aplicações com QoS profiles, implementar application visibility, application control, WAN optimization e dynamic WAN selection e montar relatórios para a operação do dia a dia.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "User accounts and licences", "pt-BR": "Contas de usuário e licenças" }, // outline item 1
        { en: "Application metrics and the Experience Quality Score", "pt-BR": "Métricas de aplicação e o Experience Quality Score" }, // outline item 2
        { en: "Application overview dashboard", "pt-BR": "Dashboard de visão geral de aplicações" }, // outline item 3
        { en: "Applications, application groups and criticality", "pt-BR": "Aplicações, grupos de aplicações e criticidade" }, // outline item 4
        { en: "SaaS applications, application flows and real-time graphs", "pt-BR": "Aplicações SaaS, fluxos de aplicação e gráficos em tempo real" }, // outline item 5
        { en: "Advanced reporting and analysis", "pt-BR": "Relatórios avançados e análise" }, // outline item 6
        { en: "Dynamic WAN selection: visibility and policy", "pt-BR": "Dynamic WAN selection: visibilidade e política" }, // outline item 7
        { en: "Labs: application visibility, application control, WAN optimisation, dynamic WAN selection", "pt-BR": "Laboratórios: application visibility, application control, WAN optimization, dynamic WAN selection" }, // outline item 8
      ],
      prerequisites: [ // prerequisites, in display order
        { course: { platform: "extreme", course: "sdwan-installation-configuration" } }, // a course of this catalogue
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "Extreme makes the Installation and Configuration course mandatory and expects experience with the ExtremeCloud SD-WAN Orchestrator.", // British English
            "pt-BR": "A Extreme torna obrigatório o curso de Installation and Configuration e espera experiência com o ExtremeCloud SD-WAN Orchestrator.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "vendor-stated", // vendor-stated | topic-overlap | not-exam-specific
        credential: "Extreme Certified Professional in ExtremeCloud SD-WAN", // credential or exam, as the vendor names it
        guides: ["extreme-ecp-sdwan"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "Extreme's outline for the Extreme Certified Professional in ExtremeCloud SD-WAN lists this course as one of the track's four knowledge credentials. The ECP exam opens only after all four, and the certification also needs a one-day practical lab assessment.", // British English
          "pt-BR": "A ementa da Extreme para o Extreme Certified Professional in ExtremeCloud SD-WAN lista este curso como uma das quatro knowledge credentials da trilha. O exame ECP só é liberado depois das quatro, e a certificação ainda exige uma avaliação prática de laboratório de um dia.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "No fixed next course: Management, Advanced Configuration and Troubleshooting each build on Installation and Configuration and can be taken in any order. Once all four are complete, the next step in Extreme's programme is the ECP in ExtremeCloud SD-WAN exam and lab assessment, not another course.", // British English
          "pt-BR": "Sem próximo curso fixo: Management, Advanced Configuration e Troubleshooting partem de Installation and Configuration e podem ser feitos em qualquer ordem. Concluídos os quatro, o próximo passo no programa da Extreme é o exame e a avaliação de laboratório do ECP in ExtremeCloud SD-WAN, não outro curso.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://extr-p-001.sitecorecontenthub.cloud/api/public/content/b85b56d477d44e79bf26a091eef646ed?v=f60c92af", // vendor page or outline document
        title: "Course Outline: ExtremeCloud™ SD-WAN – Management", // the vendor's own title, verbatim
        vendorCourseId: null, // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "Extreme's course outline document gives the duration, prerequisite, objectives and agenda. It states no courseware or software version.", // British English
          "pt-BR": "O documento de ementa da Extreme traz a duração, o pré-requisito, os objetivos e a agenda. Não informa versão do material nem do software.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // ExtremeCloud SD-WAN: Advanced Configuration
      slug: "sdwan-advanced-configuration", // URL slug
      name: "ExtremeCloud SD-WAN: Advanced Configuration", // catalogue name (official names stay in English)
      days: 1, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Advanced features and parameters of ExtremeCloud SD-WAN.", // British English
        "pt-BR": "Recursos e parâmetros avançados do ExtremeCloud SD-WAN.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "This course covers the advanced parameters and features of an ExtremeCloud SD-WAN solution: what happens inside the ipes, OSPF, high availability, EdgeSentry, DHCP, colouring and the other advanced parameters, and how Fabric over SD-WAN works for engineers who already know Extreme Fabric. It is aimed at the people who configure the solution, and the material is reinforced in the lab.", // British English
        "pt-BR": "Este curso cobre os parâmetros e recursos avançados de uma solução ExtremeCloud SD-WAN: o que acontece dentro dos ipes, OSPF, alta disponibilidade, EdgeSentry, DHCP, coloring e os demais parâmetros avançados, e como funciona o Fabric over SD-WAN para engenheiros que já conhecem o Extreme Fabric. É voltado a quem configura a solução, e o conteúdo é reforçado no laboratório.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "Inside the ipes", "pt-BR": "Por dentro dos ipes" }, // outline item 1
        { en: "OSPF", "pt-BR": "OSPF" }, // outline item 2
        { en: "High availability", "pt-BR": "Alta disponibilidade" }, // outline item 3
        { en: "EdgeSentry", "pt-BR": "EdgeSentry" }, // outline item 4
        { en: "DHCP", "pt-BR": "DHCP" }, // outline item 5
        { en: "Colouring", "pt-BR": "Coloring" }, // outline item 6
        { en: "Advanced parameters", "pt-BR": "Parâmetros avançados" }, // outline item 7
        { en: "Fabric over SD-WAN", "pt-BR": "Fabric over SD-WAN" }, // outline item 8
      ],
      prerequisites: [ // prerequisites, in display order
        { course: { platform: "extreme", course: "sdwan-installation-configuration" } }, // a course of this catalogue
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "Extreme requires the full learning credential for ExtremeCloud SD-WAN - Installation and Configuration.", // British English
            "pt-BR": "A Extreme exige a learning credential completa de ExtremeCloud SD-WAN - Installation and Configuration.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "vendor-stated", // vendor-stated | topic-overlap | not-exam-specific
        credential: "Extreme Certified Professional in ExtremeCloud SD-WAN", // credential or exam, as the vendor names it
        guides: ["extreme-ecp-sdwan"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "Extreme's outline for the Extreme Certified Professional in ExtremeCloud SD-WAN lists this course as one of the track's four knowledge credentials. The ECP exam opens only after all four, and the certification also needs a one-day practical lab assessment.", // British English
          "pt-BR": "A ementa da Extreme para o Extreme Certified Professional in ExtremeCloud SD-WAN lista este curso como uma das quatro knowledge credentials da trilha. O exame ECP só é liberado depois das quatro, e a certificação ainda exige uma avaliação prática de laboratório de um dia.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "No fixed next course: Management, Advanced Configuration and Troubleshooting each build on Installation and Configuration and can be taken in any order. Once all four are complete, the next step in Extreme's programme is the ECP in ExtremeCloud SD-WAN exam and lab assessment, not another course.", // British English
          "pt-BR": "Sem próximo curso fixo: Management, Advanced Configuration e Troubleshooting partem de Installation and Configuration e podem ser feitos em qualquer ordem. Concluídos os quatro, o próximo passo no programa da Extreme é o exame e a avaliação de laboratório do ECP in ExtremeCloud SD-WAN, não outro curso.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://extr-p-001.sitecorecontenthub.cloud/api/public/content/0914ba64d1684758a7cedf897f1784c5?v=9fc17858", // vendor page or outline document
        title: "Course Outline: ExtremeCloud™ SD-WAN – Advanced Configuration", // the vendor's own title, verbatim
        vendorCourseId: null, // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "Extreme's course outline document gives the duration, prerequisite, objectives and agenda. It states no courseware or software version.", // British English
          "pt-BR": "O documento de ementa da Extreme traz a duração, o pré-requisito, os objetivos e a agenda. Não informa versão do material nem do software.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // ExtremeCloud SD-WAN: Troubleshooting
      slug: "sdwan-troubleshooting", // URL slug
      name: "ExtremeCloud SD-WAN: Troubleshooting", // catalogue name (official names stay in English)
      days: 3, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Diagnosing ExtremeCloud SD-WAN faults and application issues.", // British English
        "pt-BR": "Diagnóstico de falhas do ExtremeCloud SD-WAN e de problemas de aplicação.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "This course builds troubleshooting skill for ExtremeCloud SD-WAN with the tools of the Orchestrator and of the ipes themselves: getting under the hood of the appliances, scripts and debug commands, traffic captures, connectivity issues, crashes and processes, visibility synchronisation and correlation, the advanced principles of dynamic WAN selection, and bandwidth tracking and queuing for application control. It aims at isolating both SD-WAN misconfigurations and faults and end-user application issues, with helpdesk flowcharts and hands-on lab work in the instructor-led edition.", // British English
        "pt-BR": "Este curso constrói habilidade de troubleshooting para o ExtremeCloud SD-WAN com as ferramentas do Orchestrator e dos próprios ipes: o funcionamento interno dos appliances, scripts e comandos de debug, captura de tráfego, problemas de conectividade, travamentos e processos, sincronização e correlação de visibilidade, os princípios avançados do dynamic WAN selection e o bandwidth tracking e as filas do application control. O objetivo é isolar tanto erros de configuração e falhas do SD-WAN quanto problemas de aplicação do usuário final, com fluxogramas de helpdesk e laboratório prático na edição com instrutor.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "Access to ipes: under the hood", "pt-BR": "Acesso aos ipes: por dentro" }, // outline item 1
        { en: "Scripts and debug commands", "pt-BR": "Scripts e comandos de debug" }, // outline item 2
        { en: "Traffic captures", "pt-BR": "Captura de tráfego" }, // outline item 3
        { en: "Connectivity issues", "pt-BR": "Problemas de conectividade" }, // outline item 4
        { en: "Crashes and ipe processes", "pt-BR": "Travamentos e processos dos ipes" }, // outline item 5
        { en: "Visibility: synchronisation and correlation", "pt-BR": "Visibilidade: sincronização e correlação" }, // outline item 6
        { en: "Dynamic WAN selection: advanced principles and troubleshooting", "pt-BR": "Dynamic WAN selection: princípios avançados e troubleshooting" }, // outline item 7
        { en: "Control: bandwidth tracking, queuing and troubleshooting", "pt-BR": "Controle: bandwidth tracking, filas e troubleshooting" }, // outline item 8
        { en: "Helpdesk flowcharts", "pt-BR": "Fluxogramas de helpdesk" }, // outline item 9
      ],
      prerequisites: [ // prerequisites, in display order
        { course: { platform: "extreme", course: "sdwan-installation-configuration" } }, // a course of this catalogue
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "Extreme requires the full learning credential for ExtremeCloud SD-WAN - Installation and Configuration and recommends several months of experience with the product.", // British English
            "pt-BR": "A Extreme exige a learning credential completa de ExtremeCloud SD-WAN - Installation and Configuration e recomenda vários meses de experiência com o produto.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "vendor-stated", // vendor-stated | topic-overlap | not-exam-specific
        credential: "Extreme Certified Professional in ExtremeCloud SD-WAN", // credential or exam, as the vendor names it
        guides: ["extreme-ecp-sdwan"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "Extreme's outline for the Extreme Certified Professional in ExtremeCloud SD-WAN lists this course as one of the track's four knowledge credentials. The ECP exam opens only after all four, and the certification also needs a one-day practical lab assessment.", // British English
          "pt-BR": "A ementa da Extreme para o Extreme Certified Professional in ExtremeCloud SD-WAN lista este curso como uma das quatro knowledge credentials da trilha. O exame ECP só é liberado depois das quatro, e a certificação ainda exige uma avaliação prática de laboratório de um dia.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "No fixed next course: Management, Advanced Configuration and Troubleshooting each build on Installation and Configuration and can be taken in any order. Once all four are complete, the next step in Extreme's programme is the ECP in ExtremeCloud SD-WAN exam and lab assessment, not another course.", // British English
          "pt-BR": "Sem próximo curso fixo: Management, Advanced Configuration e Troubleshooting partem de Installation and Configuration e podem ser feitos em qualquer ordem. Concluídos os quatro, o próximo passo no programa da Extreme é o exame e a avaliação de laboratório do ECP in ExtremeCloud SD-WAN, não outro curso.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://extr-p-001.sitecorecontenthub.cloud/api/public/content/2a00612b1ed74e5caea8a2913b7e9ff9?v=bd1f700d", // vendor page or outline document
        title: "Course Outline: ExtremeCloud™ SD-WAN – Troubleshooting", // the vendor's own title, verbatim
        vendorCourseId: null, // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "Extreme's course outline document gives the duration, prerequisite, objectives and agenda. It states no courseware or software version.", // British English
          "pt-BR": "O documento de ementa da Extreme traz a duração, o pré-requisito, os objetivos e a agenda. Não informa versão do material nem do software.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // ExtremeCloud IQ: API and Automation
      slug: "cloudiq-api-automation", // URL slug
      name: "ExtremeCloud IQ: API and Automation", // catalogue name (official names stay in English)
      days: 2, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Automating ExtremeCloud IQ deployments with APIs and scripts.", // British English
        "pt-BR": "Automação de implantações do ExtremeCloud IQ com APIs e scripts.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "Automation turns repetitive operational work into procedures that run themselves, and this course covers API and automation concepts for ExtremeCloud IQ. Students become familiar with the tools and methods for automating deployments, from day-to-day task automation through automating the deployment itself, working with the platform's APIs and scripting. The emphasis is practical: using automation to make a cloud-managed network estate faster and more consistent to operate.", // British English
        "pt-BR": "A automação transforma trabalho operacional repetitivo em procedimentos que rodam sozinhos, e este curso cobre conceitos de API e automação para o ExtremeCloud IQ. Os alunos conhecem as ferramentas e os métodos para automatizar implantações, da automação das tarefas do dia a dia à automação da própria implantação, trabalhando com as APIs e os scripts da plataforma. A ênfase é prática: usar a automação para tornar um parque de rede gerenciado pela nuvem mais rápido e mais consistente de operar.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "API and automation concepts", "pt-BR": "Conceitos de API e automação" }, // outline item 1
        { en: "The ExtremeCloud IQ API", "pt-BR": "A API do ExtremeCloud IQ" }, // outline item 2
        { en: "Authenticating and working with the API", "pt-BR": "Autenticação e uso da API" }, // outline item 3
        { en: "Automating day-to-day tasks", "pt-BR": "Automação de tarefas do dia a dia" }, // outline item 4
        { en: "Automating deployments", "pt-BR": "Automação de implantações" }, // outline item 5
        { en: "Scripting and tooling", "pt-BR": "Scripts e ferramentas" }, // outline item 6
        { en: "Putting automation into practice", "pt-BR": "Automação na prática" }, // outline item 7
      ],
      outlineNote: { // version, edition or legacy context
        en: "Extreme's courses page describes this as an introductory course and links it only to its training portal, which asks for a sign-in; no public outline was available, so this summary and the duration are unverified.", // British English
        "pt-BR": "A página de cursos da Extreme descreve este curso como introdutório e só o liga ao portal de treinamento, que pede login; não havia ementa pública, então este resumo e a duração não foram conferidos.", // Brazilian Portuguese
      },
      prerequisites: [ // prerequisites, in display order
        { unknown: true }, // no public vendor outline could be read
      ],
      certification: { // certification relevance
        kind: "not-exam-specific", // vendor-stated | topic-overlap | not-exam-specific
        credential: null, // credential or exam, as the vendor names it
        guides: [], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "Extreme's courses page lists no exam or certification with this course (read 25 October 2026).", // British English
          "pt-BR": "A página de cursos da Extreme não lista exame nem certificação para este curso (lida em 25 de outubro de 2026).", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "Extreme publishes no course sequence after this one.", // British English
          "pt-BR": "A Extreme não publica uma sequência de cursos depois deste.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://training.extremenetworks.com/extremecloud-iq-api-and-automation/", // vendor page or outline document
        title: "ExtremeCloud IQ – API and Automation", // the vendor's own title, verbatim
        vendorCourseId: null, // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "login_required", // content outcome of that read
        finding: { // what the read showed
          en: "The course link on Extreme's courses page redirects to a partner sign-in (HTTP 401), so no outline could be read.", // British English
          "pt-BR": "O link do curso na página de cursos da Extreme redireciona para um login de parceiro (HTTP 401), então nenhuma ementa pôde ser lida.", // Brazilian Portuguese
        },
      },
      curriculumChecked: null, // last successful verification of this course
    },
  ],
};

// ============================================================================
// FORTINET: 5 courses.
// ============================================================================
const fortinet: Platform = { // the Fortinet platform
  slug: "fortinet", // URL slug
  name: "Fortinet", // display name
  tagline: { // short tagline
    en: "Network security on FortiGate and the Fortinet Security Fabric.", // British English
    "pt-BR": "Segurança de rede no FortiGate e no Fortinet Security Fabric.", // Brazilian Portuguese
  },
  intro: { // platform introduction
    en: "Fortinet's FortiGate is one of the most widely deployed network security platforms, and its training centers on operating FortiGate effectively: firewall policy, secure connectivity, and the security profiles that inspect and control traffic. These courses sit on Fortinet's NSE ladder as reorganised in July 2026: FortiGate Operator at NSE 3, FortiOS Administrator at NSE 4, SD-WAN at NSE 5 in the Secure Networking track, and FortiManager and FortiAnalyzer at NSE 6, from foundational operation through administration and into the management plane.", // British English
    "pt-BR": "O FortiGate é uma das plataformas de segurança de rede mais implantadas do mercado, e o treinamento da Fortinet gira em torno de operá-lo bem: política de firewall, conectividade segura e os security profiles que inspecionam e controlam o tráfego. Estes cursos ficam na escada NSE da Fortinet, reorganizada em julho de 2026: FortiGate Operator no NSE 3, FortiOS Administrator no NSE 4, SD-WAN no NSE 5 da trilha Secure Networking, e FortiManager e FortiAnalyzer no NSE 6, da operação básica à administração e ao plano de gerência.", // Brazilian Portuguese
  },
  since: "2024", // authorized instructor since
  workingSince: "1998", // hands-on with the technology since
  workingTechKey: "firewalls", // training.tech.* label key
  courses: [ // the courses, in display order
    { // FortiGate Operator
      slug: "fortigate-operator", // URL slug
      name: "FortiGate Operator", // catalogue name (official names stay in English)
      altName: { // former or alternate name
        en: "NSE 3 level", // British English
        "pt-BR": "nível NSE 3", // Brazilian Portuguese
      },
      days: 1, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Foundational, day-to-day operation of FortiGate.", // British English
        "pt-BR": "Operação básica do FortiGate no dia a dia.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "The foundational course in the FortiGate path, FortiGate Operator builds the knowledge to carry out high-level operational tasks on FortiGate devices and harden a network with the most common FortiGate features. It suits professionals responsible for day-to-day operation, particularly in small and mid-sized environments, and ranges from access and basic networking through firewall policies, logging, user authentication, SSL inspection and the security profiles, to ZTNA and IPsec remote access, maintenance, the Security Fabric, high availability, FortiLink and cloud. It is the base the FortiOS Administrator course builds on.", // British English
        "pt-BR": "Curso de base da trilha FortiGate, o FortiGate Operator constrói o conhecimento para executar tarefas operacionais de alto nível em equipamentos FortiGate e reforçar a segurança da rede com os recursos mais usados do FortiGate. Serve a profissionais responsáveis pela operação do dia a dia, principalmente em ambientes pequenos e médios, e vai do acesso e da rede básica a políticas de firewall, logging, autenticação de usuários, SSL inspection e security profiles, até ZTNA e acesso remoto por IPsec, manutenção, o Security Fabric, alta disponibilidade, FortiLink e nuvem. É a base sobre a qual o curso FortiOS Administrator se constrói.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "FortiGate overview and access", "pt-BR": "Visão geral do FortiGate e acesso" }, // outline item 1
        { en: "System settings and basic networking", "pt-BR": "Configurações do sistema e rede básica" }, // outline item 2
        { en: "Firewall policies", "pt-BR": "Políticas de firewall" }, // outline item 3
        { en: "Logging events", "pt-BR": "Registro de eventos em log" }, // outline item 4
        { en: "Authenticating network users", "pt-BR": "Autenticação de usuários da rede" }, // outline item 5
        { en: "Inspecting SSL traffic", "pt-BR": "Inspeção de tráfego SSL" }, // outline item 6
        { en: "Blocking malware and web filtering", "pt-BR": "Bloqueio de malware e web filtering" }, // outline item 7
        { en: "Intrusion prevention and application control", "pt-BR": "Prevenção de intrusão e application control" }, // outline item 8
        { en: "Securing remote access with ZTNA", "pt-BR": "Acesso remoto seguro com ZTNA" }, // outline item 9
        { en: "IPsec VPNs", "pt-BR": "VPNs IPsec" }, // outline item 10
        { en: "System maintenance and monitoring", "pt-BR": "Manutenção e monitoração do sistema" }, // outline item 11
        { en: "The Fortinet Security Fabric", "pt-BR": "O Fortinet Security Fabric" }, // outline item 12
        { en: "High availability", "pt-BR": "Alta disponibilidade" }, // outline item 13
        { en: "FortiLink", "pt-BR": "FortiLink" }, // outline item 14
        { en: "Securing public and private clouds", "pt-BR": "Segurança de nuvens públicas e privadas" }, // outline item 15
        { en: "FortiCare and FortiCloud", "pt-BR": "FortiCare e FortiCloud" }, // outline item 16
      ],
      outlineNote: { // version, edition or legacy context
        en: "Fortinet's public page lists this course as self-paced online, with an estimated 8 hours, and names no instructor-led duration, so the one-day figure here comes from the training partner's catalogue.", // British English
        "pt-BR": "A página pública da Fortinet lista este curso como online e autodirigido, com estimativa de 8 horas, e não informa duração com instrutor, então o número de um dia aqui vem do catálogo do parceiro de treinamento.", // Brazilian Portuguese
      },
      prerequisites: [ // prerequisites, in display order
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "Fortinet recommends understanding the topics of Networking Fundamentals, NSE 1 Cybersecurity and Cloud Fundamentals and NSE 2 Introduction to Next Generation Firewall, or equivalent experience.", // British English
            "pt-BR": "A Fortinet recomenda conhecer os tópicos de Networking Fundamentals, NSE 1 Cybersecurity and Cloud Fundamentals e NSE 2 Introduction to Next Generation Firewall, ou ter experiência equivalente.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "vendor-stated", // vendor-stated | topic-overlap | not-exam-specific
        credential: "NSE 3 in Cybersecurity (NSE 3 - FortiGate Operator exam)", // credential or exam, as the vendor names it
        guides: ["fortinet-nse-3-fortigate-operator"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "Fortinet's NSE 3 page: the certification is achieved by passing the NSE 3 - FortiGate Operator online exam presented at the end of the course (read 25 October 2026).", // British English
          "pt-BR": "Página do NSE 3 na Fortinet: a certificação é obtida com a aprovação no exame online NSE 3 - FortiGate Operator, apresentado ao final do curso (lida em 25 de outubro de 2026).", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "courses", // courses | external | none
        courses: [{ platform: "fortinet", course: "fortigate-administrator" }], // named next course(s) of this catalogue
        basis: { // basis of the recommendation
          en: "Fortinet's FortiOS Administrator page asks for a thorough understanding of every FortiGate Operator topic before attending.", // British English
          "pt-BR": "A página do FortiOS Administrator na Fortinet pede domínio de todos os tópicos do FortiGate Operator antes do curso.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://training.fortinet.com/local/staticpage/view.php?page=library_fortigate-operator", // vendor page or outline document
        title: "FortiGate Operator", // the vendor's own title, verbatim
        vendorCourseId: null, // vendor course identifier, when published
        version: "FortiOS 7.6", // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "Fortinet's public course page lists the agenda, prerequisites and product version (FortiOS 7.6) and estimates 8 hours in total. It publishes no course part number.", // British English
          "pt-BR": "A página pública do curso na Fortinet lista a agenda, os pré-requisitos e a versão do produto (FortiOS 7.6) e estima 8 horas no total. Não publica número de peça do curso.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // FortiOS Administrator
      slug: "fortigate-administrator", // URL slug
      name: "FortiOS Administrator", // catalogue name (official names stay in English)
      altName: { // former or alternate name
        en: "formerly FortiGate Administrator, NSE 4 level", // British English
        "pt-BR": "antigo FortiGate Administrator, nível NSE 4", // Brazilian Portuguese
      },
      days: 4, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Configuring and administering the most-used FortiGate features.", // British English
        "pt-BR": "Configuração e administração dos recursos mais usados do FortiGate.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "The core FortiGate course, the one behind the NSE 4 certification, builds a working command of the features used most in production. In hands-on labs, students configure system and network settings, logging and monitoring, firewall policies and NAT, routing, firewall authentication including Fortinet Single Sign-On with Active Directory, certificates and SSL inspection, and site-to-site IPsec VPN. They apply the security profiles that make FortiGate a next-generation firewall (antivirus, web filtering, intrusion prevention and application control) and work with SD-WAN, high availability and diagnostics, with an introduction to FortiGate in the cloud and FortiSASE.", // British English
        "pt-BR": "O curso central de FortiGate, o que está por trás da certificação NSE 4, constrói domínio prático dos recursos mais usados em produção. Em laboratórios práticos, os alunos configuram parâmetros de sistema e de rede, logging e monitoração, políticas de firewall e NAT, roteamento, autenticação no firewall, incluindo o Fortinet Single Sign-On com Active Directory, certificados e SSL inspection, e VPN IPsec site a site. Aplicam os security profiles que fazem do FortiGate um next-generation firewall (antivírus, web filtering, prevenção de intrusão e application control) e trabalham com SD-WAN, alta disponibilidade e diagnóstico, com uma introdução ao FortiGate na nuvem e ao FortiSASE.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "System and network settings", "pt-BR": "Configurações de sistema e de rede" }, // outline item 1
        { en: "Logging and monitoring", "pt-BR": "Logging e monitoração" }, // outline item 2
        { en: "Firewall policies and NAT", "pt-BR": "Políticas de firewall e NAT" }, // outline item 3
        { en: "Routing", "pt-BR": "Roteamento" }, // outline item 4
        { en: "Firewall authentication", "pt-BR": "Autenticação no firewall" }, // outline item 5
        { en: "Fortinet Single Sign-On", "pt-BR": "Fortinet Single Sign-On" }, // outline item 6
        { en: "Certificate operations", "pt-BR": "Operações com certificados" }, // outline item 7
        { en: "Antivirus", "pt-BR": "Antivírus" }, // outline item 8
        { en: "Web filtering", "pt-BR": "Web filtering" }, // outline item 9
        { en: "Intrusion prevention and application control", "pt-BR": "Prevenção de intrusão e application control" }, // outline item 10
        { en: "IPsec VPN", "pt-BR": "VPN IPsec" }, // outline item 11
        { en: "SD-WAN configuration and monitoring", "pt-BR": "Configuração e monitoração de SD-WAN" }, // outline item 12
        { en: "High availability", "pt-BR": "Alta disponibilidade" }, // outline item 13
        { en: "Diagnostics and troubleshooting", "pt-BR": "Diagnóstico e troubleshooting" }, // outline item 14
        { en: "FortiGate in the cloud", "pt-BR": "FortiGate na nuvem" }, // outline item 15
        { en: "FortiSASE", "pt-BR": "FortiSASE" }, // outline item 16
      ],
      outlineNote: { // version, edition or legacy context
        en: "This summary follows Fortinet's public FortiOS Administrator outline, which lists FortiOS 8.0 and 16 modules. Fortinet still lists its earlier FortiGate Administrator edition, for FortiOS 7.4.1 and now self-paced only, with 15 modules that include SSL VPN and Security Fabric. The NSE 4 exam page shows the FortiOS 7.6 exam as Available and the FortiOS 8.0 exam as Coming Soon. Which courseware edition a scheduled class uses is confirmed when you book.", // British English
        "pt-BR": "Este resumo segue a ementa pública do FortiOS Administrator na Fortinet, que indica FortiOS 8.0 e 16 módulos. A Fortinet ainda lista a edição anterior, FortiGate Administrator, para FortiOS 7.4.1 e hoje só autodirigida, com 15 módulos que incluem SSL VPN e Security Fabric. A página do exame NSE 4 mostra o exame de FortiOS 7.6 como Available e o de FortiOS 8.0 como Coming Soon. A edição do material usada em uma turma agendada é confirmada na hora da inscrição.", // Brazilian Portuguese
      },
      prerequisites: [ // prerequisites, in display order
        { course: { platform: "fortinet", course: "fortigate-operator" } }, // a course of this catalogue
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "Fortinet asks for knowledge of network protocols, a basic understanding of firewall concepts and a thorough understanding of every FortiGate Operator topic.", // British English
            "pt-BR": "A Fortinet pede conhecimento de protocolos de rede, compreensão básica de conceitos de firewall e domínio de todos os tópicos do FortiGate Operator.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "vendor-stated", // vendor-stated | topic-overlap | not-exam-specific
        credential: "Fortinet NSE 4 - FortiOS 7.6 Administrator", // credential or exam, as the vendor names it
        guides: ["fortinet-nse-4-fortios-administrator"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "Fortinet's FortiOS Administrator exam page names the FortiOS 7.6 Administrator course as training for the NSE 4 - FortiOS 7.6 Administrator exam (status: Available) and the FortiOS 8.0 course for the NSE 4 - FortiOS 8.0 Administrator exam (status: Coming Soon), read 25 October 2026.", // British English
          "pt-BR": "A página do exame FortiOS Administrator na Fortinet indica o curso FortiOS 7.6 Administrator como preparação para o exame NSE 4 - FortiOS 7.6 Administrator (status: Available) e o curso de FortiOS 8.0 para o exame NSE 4 - FortiOS 8.0 Administrator (status: Coming Soon), lida em 25 de outubro de 2026.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "courses", // courses | external | none
        courses: [{ platform: "fortinet", course: "fortimanager" }, { platform: "fortinet", course: "secure-sdwan" }], // named next course(s) of this catalogue
        basis: { // basis of the recommendation
          en: "Fortinet's FortiManager Administrator page asks for familiarity with the FortiGate Administrator topics, and its SD-WAN Core Administrator page recommends the FortiGate 7.6 Administrator topics; either can follow.", // British English
          "pt-BR": "A página do FortiManager Administrator na Fortinet pede familiaridade com os tópicos do FortiGate Administrator, e a do SD-WAN Core Administrator recomenda os tópicos do FortiGate 7.6 Administrator; qualquer um dos dois pode vir em seguida.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://training.fortinet.com/local/staticpage/view.php?page=library_fortios-administrator", // vendor page or outline document
        title: "FortiOS Administrator", // the vendor's own title, verbatim
        vendorCourseId: null, // vendor course identifier, when published
        version: "FortiOS 8.0", // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "Fortinet's public course page lists FortiOS 8.0, 16 agenda modules and an estimated 24 hours (4 full days). The enrolment link behind it redirects to Fortinet's sign-in, so that page was not read.", // British English
          "pt-BR": "A página pública do curso na Fortinet indica FortiOS 8.0, 16 módulos na agenda e estimativa de 24 horas (4 dias completos). O link de inscrição por trás dela redireciona para o login da Fortinet, então essa página não foi lida.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // FortiManager Administrator
      slug: "fortimanager", // URL slug
      name: "FortiManager Administrator", // catalogue name (official names stay in English)
      altName: { // former or alternate name
        en: "NSE 6 level", // British English
        "pt-BR": "nível NSE 6", // Brazilian Portuguese
      },
      days: 2, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Centralised management of many FortiGate devices.", // British English
        "pt-BR": "Gerência centralizada de muitos equipamentos FortiGate.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "FortiManager provides centralised configuration and policy management across a fleet of FortiGate devices, and this course builds the skill to run it. In interactive labs it covers deployment strategies with single or multiple ADOMs, workspace modes, device registration, provisioning templates for device-level changes, policy packages with shared and dynamic objects, the global ADOM, installing configuration changes, high availability, backup and firmware management, FortiManager as a local FortiGuard distribution server, and troubleshooting import and installation issues.", // British English
        "pt-BR": "O FortiManager oferece gerência centralizada de configuração e de políticas para uma frota de equipamentos FortiGate, e este curso constrói a habilidade de operá-lo. Em laboratórios interativos, cobre estratégias de implantação com um ou vários ADOMs, workspace modes, registro de equipamentos, provisioning templates para mudanças por equipamento, policy packages com objetos compartilhados e dinâmicos, o ADOM global, instalação de mudanças de configuração, alta disponibilidade, backup e gerência de firmware, o FortiManager como servidor local de distribuição do FortiGuard e troubleshooting de problemas de importação e instalação.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "Introduction and initial configuration", "pt-BR": "Introdução e configuração inicial" }, // outline item 1
        { en: "Administration and management", "pt-BR": "Administração e gerência" }, // outline item 2
        { en: "Device registration", "pt-BR": "Registro de equipamentos" }, // outline item 3
        { en: "Device-level configuration and installation", "pt-BR": "Configuração por equipamento e instalação" }, // outline item 4
        { en: "Policy and objects", "pt-BR": "Políticas e objetos" }, // outline item 5
        { en: "Global ADOM and central management", "pt-BR": "ADOM global e gerência central" }, // outline item 6
        { en: "Diagnostics and troubleshooting", "pt-BR": "Diagnóstico e troubleshooting" }, // outline item 7
        { en: "Additional configuration", "pt-BR": "Configurações adicionais" }, // outline item 8
      ],
      prerequisites: [ // prerequisites, in display order
        { course: { platform: "fortinet", course: "fortigate-administrator" } }, // a course of this catalogue
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "Fortinet asks for knowledge of firewall concepts in an IPv4 network, familiarity with every topic of the FortiGate Administrator course and a basic understanding of network management systems.", // British English
            "pt-BR": "A Fortinet pede conhecimento de conceitos de firewall em uma rede IPv4, familiaridade com todos os tópicos do curso FortiGate Administrator e compreensão básica de sistemas de gerência de rede.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "vendor-stated", // vendor-stated | topic-overlap | not-exam-specific
        credential: "Fortinet NSE 6 - FortiManager 7.6 Administrator", // credential or exam, as the vendor names it
        guides: ["fortinet-nse-6-fortimanager-administrator"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "Fortinet's FortiManager Administrator exam page names the FortiManager 7.6 Administrator course as training for the NSE 6 - FortiManager 7.6 Administrator exam (status: Available), read 25 October 2026.", // British English
          "pt-BR": "A página do exame FortiManager Administrator na Fortinet indica o curso FortiManager 7.6 Administrator como preparação para o exame NSE 6 - FortiManager 7.6 Administrator (status: Available), lida em 25 de outubro de 2026.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "Fortinet publishes no course that takes FortiManager Administrator as its prerequisite within this catalogue.", // British English
          "pt-BR": "A Fortinet não publica, dentro deste catálogo, curso que tenha o FortiManager Administrator como pré-requisito.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://training.fortinet.com/local/staticpage/view.php?page=library_fortimanager-administrator", // vendor page or outline document
        title: "FortiManager Administrator", // the vendor's own title, verbatim
        vendorCourseId: null, // vendor course identifier, when published
        version: "FortiManager 7.6.1", // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "Fortinet's public course page lists the agenda, prerequisites and product version (FortiManager 7.6.1) and estimates 13 hours (2 full days). It publishes no course part number.", // British English
          "pt-BR": "A página pública do curso na Fortinet lista a agenda, os pré-requisitos e a versão do produto (FortiManager 7.6.1) e estima 13 horas (2 dias completos). Não publica número de peça do curso.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // FortiAnalyzer Administrator
      slug: "fortianalyzer", // URL slug
      name: "FortiAnalyzer Administrator", // catalogue name (official names stay in English)
      altName: { // former or alternate name
        en: "NSE 6 level", // British English
        "pt-BR": "nível NSE 6", // Brazilian Portuguese
      },
      days: 1, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Deploying and running FortiAnalyzer for centralised logging and reporting.", // British English
        "pt-BR": "Implantação e operação do FortiAnalyzer para logging e relatórios centralizados.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "FortiAnalyzer is the centralised logging and analytics platform of the Fortinet Security Fabric, and this course covers deploying, configuring and securing it. Students learn its operating modes and the log workflow, configure network settings and secure administrative access with two-factor authentication, register and manage devices, enable and manage ADOMs, configure and manage high-availability clusters and disk quotas, set log redundancy, encryption, rollover and retention, and manage reports and routine maintenance, including backups and firmware upgrades.", // British English
        "pt-BR": "O FortiAnalyzer é a plataforma centralizada de logging e analytics do Fortinet Security Fabric, e este curso cobre a implantação, a configuração e a proteção dele. Os alunos aprendem os modos de operação e o fluxo dos logs, configuram rede e acesso administrativo seguro com autenticação de dois fatores, registram e gerenciam equipamentos, habilitam e gerenciam ADOMs, configuram e gerenciam clusters de alta disponibilidade e cotas de disco, definem redundância, criptografia, rollover e retenção de logs e gerenciam relatórios e a manutenção de rotina, incluindo backups e atualizações de firmware.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "Introduction and initial configuration", "pt-BR": "Introdução e configuração inicial" }, // outline item 1
        { en: "Administration and management", "pt-BR": "Administração e gerência" }, // outline item 2
        { en: "ADOMs and high availability", "pt-BR": "ADOMs e alta disponibilidade" }, // outline item 3
        { en: "Managing devices", "pt-BR": "Gerência de equipamentos" }, // outline item 4
        { en: "Logs and reports management", "pt-BR": "Gerência de logs e relatórios" }, // outline item 5
      ],
      outlineNote: { // version, edition or legacy context
        en: "Fortinet's current outline estimates 7 hours (1 full day). Playbooks and incident handling belong to Fortinet's separate FortiAnalyzer Analyst course, not to this one.", // British English
        "pt-BR": "A ementa atual da Fortinet estima 7 horas (1 dia completo). Playbooks e tratamento de incidentes pertencem ao curso separado FortiAnalyzer Analyst, da Fortinet, e não a este.", // Brazilian Portuguese
      },
      prerequisites: [ // prerequisites, in display order
        { course: { platform: "fortinet", course: "fortigate-operator" } }, // a course of this catalogue
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "Fortinet asks for an understanding of every FortiGate Operator topic, or equivalent experience.", // British English
            "pt-BR": "A Fortinet pede compreensão de todos os tópicos do FortiGate Operator, ou experiência equivalente.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "topic-overlap", // vendor-stated | topic-overlap | not-exam-specific
        credential: "NSE 6 FortiAnalyzer Administrator", // credential or exam, as the vendor names it
        guides: ["fortinet-nse-6-fortianalyzer-administrator"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "Fortinet's FortiAnalyzer Administrator exam page showed only \"Coming soon!\" when read on 25 October 2026, with no exam version listed, so no vendor course-to-exam statement could be confirmed.", // British English
          "pt-BR": "A página do exame FortiAnalyzer Administrator na Fortinet mostrava apenas \"Coming soon!\" quando lida em 25 de outubro de 2026, sem versão de exame listada, então não foi possível confirmar uma associação entre curso e exame declarada pelo fabricante.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "Fortinet publishes no course that takes FortiAnalyzer Administrator as its prerequisite within this catalogue.", // British English
          "pt-BR": "A Fortinet não publica, dentro deste catálogo, curso que tenha o FortiAnalyzer Administrator como pré-requisito.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://training.fortinet.com/local/staticpage/view.php?page=library_fortianalyzer-administrator", // vendor page or outline document
        title: "FortiAnalyzer Administrator", // the vendor's own title, verbatim
        vendorCourseId: null, // vendor course identifier, when published
        version: "FortiAnalyzer 7.6", // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "Fortinet's public course page lists the agenda, prerequisites and product version (FortiAnalyzer 7.6) and estimates 7 hours (1 full day). It publishes no course part number.", // British English
          "pt-BR": "A página pública do curso na Fortinet lista a agenda, os pré-requisitos e a versão do produto (FortiAnalyzer 7.6) e estima 7 horas (1 dia completo). Não publica número de peça do curso.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // FortiGate Secure SD-WAN
      slug: "secure-sdwan", // URL slug
      name: "FortiGate Secure SD-WAN", // catalogue name (official names stay in English)
      altName: { // former or alternate name
        en: "SD-WAN Core Administrator, NSE 5 level", // British English
        "pt-BR": "SD-WAN Core Administrator, nível NSE 5", // Brazilian Portuguese
      },
      days: 2, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Designing and operating SD-WAN on FortiGate.", // British English
        "pt-BR": "Projeto e operação de SD-WAN no FortiGate.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "FortiGate's SD-WAN brings application-aware routing and resilient connectivity to the WAN, and this course builds the skill to configure and run it on a single device or a small topology. It covers SD-WAN members, zones and performance SLAs, defining rules and the strategies that steer traffic by application and link quality, the route and rule lookup process, how SD-WAN interacts with FortiGate routing, sessions and firewall, how it responds to changing link conditions, troubleshooting routing and rule matching, and managing simple deployments centrally with FortiManager.", // British English
        "pt-BR": "O SD-WAN do FortiGate traz roteamento consciente de aplicação e conectividade resiliente para a WAN, e este curso constrói a habilidade de configurá-lo e operá-lo em um único equipamento ou em uma topologia pequena. Ele cobre membros, zonas e performance SLAs do SD-WAN, a definição de regras e as estratégias que direcionam o tráfego por aplicação e qualidade de link, o processo de lookup de rotas e regras, como o SD-WAN interage com o roteamento, as sessões e o firewall do FortiGate, como reage a mudanças nas condições dos links, troubleshooting de roteamento e de rule matching e a gerência centralizada de implantações simples com o FortiManager.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "Introduction", "pt-BR": "Introdução" }, // outline item 1
        { en: "Members, zones and performance SLAs", "pt-BR": "Membros, zonas e performance SLAs" }, // outline item 2
        { en: "Defining and configuring rules", "pt-BR": "Definição e configuração de regras" }, // outline item 3
        { en: "Rule strategies in action", "pt-BR": "Estratégias de regras na prática" }, // outline item 4
        { en: "Routing and sessions", "pt-BR": "Roteamento e sessões" }, // outline item 5
        { en: "Centralised management", "pt-BR": "Gerência centralizada" }, // outline item 6
      ],
      prerequisites: [ // prerequisites, in display order
        { course: { platform: "fortinet", course: "fortigate-administrator" } }, // a course of this catalogue
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "Fortinet asks for advanced networking knowledge and extensive hands-on FortiGate experience, and recommends the FortiGate 7.6 Administrator topics.", // British English
            "pt-BR": "A Fortinet pede conhecimento avançado de redes e ampla experiência prática com FortiGate, e recomenda os tópicos do FortiGate 7.6 Administrator.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "vendor-stated", // vendor-stated | topic-overlap | not-exam-specific
        credential: "Fortinet NSE 5 - SD-WAN Core 7.6 Administrator", // credential or exam, as the vendor names it
        guides: ["fortinet-nse-5-sdwan-core-administrator"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "Fortinet's SD-WAN Core Administrator exam page names the SD-WAN 7.6 Core Administrator course as training for the NSE 5 - SD-WAN Core 7.6 Administrator exam (status: Available), read 25 October 2026.", // British English
          "pt-BR": "A página do exame SD-WAN Core Administrator na Fortinet indica o curso SD-WAN 7.6 Core Administrator como preparação para o exame NSE 5 - SD-WAN Core 7.6 Administrator (status: Available), lida em 25 de outubro de 2026.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "Within this catalogue there is no fixed next course; Fortinet's Secure Networking track continues at NSE 7, which is not taught here.", // British English
          "pt-BR": "Dentro deste catálogo não há próximo curso fixo; a trilha Secure Networking da Fortinet continua no NSE 7, que não é ministrado aqui.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://training.fortinet.com/local/staticpage/view.php?page=library_sd-wan-core-administrator", // vendor page or outline document
        title: "SD-WAN Core Administrator", // the vendor's own title, verbatim
        vendorCourseId: null, // vendor course identifier, when published
        version: "FortiOS 7.6.3, FortiManager 7.6.3", // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "Fortinet's public course page lists the agenda, prerequisites and product version (FortiOS 7.6.3 and FortiManager 7.6.3) and estimates 13 hours (2 full days). It publishes no course part number.", // British English
          "pt-BR": "A página pública do curso na Fortinet lista a agenda, os pré-requisitos e a versão do produto (FortiOS 7.6.3 e FortiManager 7.6.3) e estima 13 horas (2 dias completos). Não publica número de peça do curso.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
  ],
};

// ============================================================================
// NETSKOPE: 2 courses.
// ============================================================================
const netskope: Platform = { // the Netskope platform
  slug: "netskope", // URL slug
  name: "Netskope", // display name
  tagline: { // short tagline
    en: "Cloud security and SASE on the Netskope One platform.", // British English
    "pt-BR": "Segurança em nuvem e SASE na plataforma Netskope One.", // Brazilian Portuguese
  },
  intro: { // platform introduction
    en: "Netskope secures how organizations use the cloud, the web, and private applications, bringing visibility and control to traffic that traditional perimeters never saw. Its instructor-led training centers on the Netskope One platform. The two courses here cover administering the platform's core security controls and implementing and operating it in an enterprise environment. Rodolfo added Netskope to his delivery in 2025.", // British English
    "pt-BR": "A Netskope protege o uso que as organizações fazem da nuvem, da web e das aplicações privadas, trazendo visibilidade e controle para um tráfego que os perímetros tradicionais nunca enxergaram. O treinamento com instrutor da Netskope gira em torno da plataforma Netskope One. Os dois cursos aqui cobrem a administração dos controles de segurança centrais da plataforma e a implementação e operação dela em um ambiente corporativo. Rodolfo passou a ministrar Netskope em 2025.", // Brazilian Portuguese
  },
  since: "2025", // authorized instructor since
  workingSince: "2008", // hands-on with the technology since
  workingTechKey: "webCloudSecurity", // training.tech.* label key
  courses: [ // the courses, in display order
    { // Netskope One Administrator
      slug: "netskope-one-administrator", // URL slug
      name: "Netskope One Administrator", // catalogue name (official names stay in English)
      altName: { // former or alternate name
        en: "formerly NSCO&A, Security Cloud Operation and Administration", // British English
        "pt-BR": "antigo NSCO&A, Security Cloud Operation and Administration", // Brazilian Portuguese
      },
      days: 3, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Administering core security controls on the Netskope One platform.", // British English
        "pt-BR": "Administração dos controles de segurança centrais da plataforma Netskope One.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "This course builds the skill to navigate, monitor and manage the Netskope One platform day to day. It begins with the platform architecture, how the main components serve requests in the data and control planes, and the tenant interface, then moves through user management, traffic steering and the Netskope Client. Students design real-time and API data protection policies to stop unauthorised exfiltration, apply web security controls and the cloud firewall, and work with Data Loss Prevention and threat protection, including scanning and User and Entity Behaviour Analytics, using Advanced Analytics and enhanced reporting to validate outcomes and troubleshoot.", // British English
        "pt-BR": "Este curso constrói a habilidade de navegar, monitorar e gerenciar a plataforma Netskope One no dia a dia. Começa pela arquitetura da plataforma, por como os componentes principais atendem as requisições nos planos de dados e de controle e pela interface do tenant, e passa por gerência de usuários, traffic steering e o Netskope Client. Os alunos projetam políticas de proteção de dados em tempo real e por API para impedir exfiltração não autorizada, aplicam controles de web security e o cloud firewall e trabalham com Data Loss Prevention e threat protection, incluindo scanning e User and Entity Behavior Analytics, usando o Advanced Analytics e os relatórios avançados para validar resultados e fazer troubleshooting.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "Netskope platform architecture", "pt-BR": "Arquitetura da plataforma Netskope" }, // outline item 1
        { en: "Netskope interface basics", "pt-BR": "Fundamentos da interface da Netskope" }, // outline item 2
        { en: "User management", "pt-BR": "Gerência de usuários" }, // outline item 3
        { en: "Traffic steering", "pt-BR": "Traffic steering" }, // outline item 4
        { en: "The Netskope Client", "pt-BR": "O Netskope Client" }, // outline item 5
        { en: "Real-time and API protection policies", "pt-BR": "Políticas de proteção em tempo real e por API" }, // outline item 6
        { en: "Web security", "pt-BR": "Web security" }, // outline item 7
        { en: "Netskope Cloud Firewall", "pt-BR": "Netskope Cloud Firewall" }, // outline item 8
        { en: "Data Loss Prevention (DLP)", "pt-BR": "Data Loss Prevention (DLP)" }, // outline item 9
        { en: "Threat protection", "pt-BR": "Threat protection" }, // outline item 10
        { en: "Netskope Advanced Analytics", "pt-BR": "Netskope Advanced Analytics" }, // outline item 11
        { en: "Enhanced reporting", "pt-BR": "Relatórios avançados (Enhanced Reporting)" }, // outline item 12
      ],
      outlineNote: { // version, edition or legacy context
        en: "Netskope's training page, read the same day, lists Netskope One Professional and Netskope One Expert as its paid instructor-led courses and an SSE Administrator course as self-paced; this course's datasheet (TR-920-1, dated 08/25) is still published.", // British English
        "pt-BR": "A página de treinamento da Netskope, lida no mesmo dia, lista o Netskope One Professional e o Netskope One Expert como cursos pagos com instrutor e um curso SSE Administrator como autodirigido; o datasheet deste curso (TR-920-1, de 08/25) continua publicado.", // Brazilian Portuguese
      },
      prerequisites: [ // prerequisites, in display order
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "Netskope lists one optional prerequisite: Netskope Security Cloud Introductory Online Technical Training (NSCIOTT).", // British English
            "pt-BR": "A Netskope lista um pré-requisito opcional: o Netskope Security Cloud Introductory Online Technical Training (NSCIOTT).", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "topic-overlap", // vendor-stated | topic-overlap | not-exam-specific
        credential: "Netskope Administrator Accreditation", // credential or exam, as the vendor names it
        guides: ["netskope-administrator-accreditation"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "Netskope's accreditation datasheet (TR-772-1, 09/24) lists the Security Cloud Operation & Administration course (NSCO&A), this course's former name, among its preparation resources; the accreditation itself comes only from passing Netskope's 60-question exam.", // British English
          "pt-BR": "O datasheet da acreditação da Netskope (TR-772-1, 09/24) lista o curso Security Cloud Operation & Administration (NSCO&A), nome antigo deste curso, entre os recursos de preparação; a acreditação em si vem só da aprovação no exame de 60 questões da Netskope.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "none", // courses | external | none
        basis: { // basis of the recommendation
          en: "Netskope publishes no fixed course after this one: its academy names SSE Administrator e-learning, not this course, as the recommended preparation for Netskope One Professional.", // British English
          "pt-BR": "A Netskope não publica curso fixo depois deste: a academia dela aponta o e-learning SSE Administrator, e não este curso, como preparação recomendada para o Netskope One Professional.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://www.netskope.com/wp-content/uploads/2025/07/2025-08-Netskope-One-Administrator-TR-920-1.pdf", // vendor page or outline document
        title: "Netskope One Administrator", // the vendor's own title, verbatim
        vendorCourseId: "TR-920-1", // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "Netskope's course datasheet (TR-920-1, 08/25) gives the 24-hour (3-day) duration, the optional prerequisite and twelve modules. It states no product or courseware version.", // British English
          "pt-BR": "O datasheet do curso na Netskope (TR-920-1, 08/25) traz a duração de 24 horas (3 dias), o pré-requisito opcional e doze módulos. Não informa versão do produto nem do material.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
    { // Netskope One Professional
      slug: "netskope-one-professional", // URL slug
      name: "Netskope One Professional", // catalogue name (official names stay in English)
      altName: { // former or alternate name
        en: "formerly NSCI&I, Security Cloud Implementation and Integration", // British English
        "pt-BR": "antigo NSCI&I, Security Cloud Implementation and Integration", // Brazilian Portuguese
      },
      days: 3, // instructor-led duration in days
      summary: { // one-line summary for cards
        en: "Implementing and operating the Netskope SSE platform, hands-on.", // British English
        "pt-BR": "Implementação e operação da plataforma SSE da Netskope, na prática.", // Brazilian Portuguese
      },
      description: { // description, original wording
        en: "A hands-on course for security administrators who implement and operate the Netskope Security Service Edge platform, built around virtual labs. The first half covers user provisioning with Directory Importer and SCIM, deploying and scaling the Netskope Client, configuring the Secure Web Gateway for web policy, and the Netskope Cloud Firewall for outbound non-web traffic, balancing visibility with user privacy. The second half covers standard and advanced Data Loss Prevention (OCR, Exact Data Match and fingerprinting), advanced threat scanning, securing generative AI traffic with gateway interception and guardrails, and Advanced Analytics and enhanced reporting for dashboards and audits.", // British English
        "pt-BR": "Um curso prático para administradores de segurança que implementam e operam a plataforma Security Service Edge da Netskope, construído em torno de laboratórios virtuais. A primeira metade cobre provisionamento de usuários com o Directory Importer e SCIM, implantação e escala do Netskope Client, configuração do Secure Web Gateway para políticas web e do Netskope Cloud Firewall para o tráfego de saída que não é web, equilibrando visibilidade e privacidade do usuário. A segunda metade cobre Data Loss Prevention padrão e avançado (OCR, Exact Data Match e fingerprinting), scanning avançado de ameaças, proteção do tráfego de IA generativa com interceptação no gateway e guardrails, e o Advanced Analytics e os relatórios avançados para dashboards e auditorias.", // Brazilian Portuguese
      },
      toc: [ // outline summary, one item per line
        { en: "User provisioning: Directory Importer and SCIM", "pt-BR": "Provisionamento de usuários: Directory Importer e SCIM" }, // outline item 1
        { en: "Deploying and scaling the Netskope Client", "pt-BR": "Implantação e escala do Netskope Client" }, // outline item 2
        { en: "Secure Web Gateway policies", "pt-BR": "Políticas do Secure Web Gateway" }, // outline item 3
        { en: "Netskope Cloud Firewall", "pt-BR": "Netskope Cloud Firewall" }, // outline item 4
        { en: "Standard and advanced DLP: OCR, Exact Data Match, fingerprinting", "pt-BR": "DLP padrão e avançado: OCR, Exact Data Match, fingerprinting" }, // outline item 5
        { en: "Advanced threat scanning", "pt-BR": "Scanning avançado de ameaças" }, // outline item 6
        { en: "Securing generative AI traffic", "pt-BR": "Proteção do tráfego de IA generativa" }, // outline item 7
        { en: "Advanced Analytics and enhanced reporting", "pt-BR": "Advanced Analytics e relatórios avançados" }, // outline item 8
      ],
      outlineNote: { // version, edition or legacy context
        en: "Netskope's course page describes the content rather than listing modules, so this summary follows its description. Topics taught under the course's former name, such as SAML, Private Access, the REST API, posture management, Remote Browser Isolation and Cloud Exchange, are not in the current description.", // British English
        "pt-BR": "A página do curso na Netskope descreve o conteúdo em vez de listar módulos, então este resumo segue essa descrição. Tópicos ensinados com o nome antigo do curso, como SAML, Private Access, a REST API, gerência de postura, Remote Browser Isolation e Cloud Exchange, não estão na descrição atual.", // Brazilian Portuguese
      },
      prerequisites: [ // prerequisites, in display order
        { // vendor-stated prerequisite
          text: { // prerequisite text
            en: "Netskope recommends SASE Essentials Associate, SASE Essentials Specialist and the SSE Administrator e-learning.", // British English
            "pt-BR": "A Netskope recomenda SASE Essentials Associate, SASE Essentials Specialist e o e-learning SSE Administrator.", // Brazilian Portuguese
          },
        },
      ],
      certification: { // certification relevance
        kind: "topic-overlap", // vendor-stated | topic-overlap | not-exam-specific
        credential: "Netskope Integrator Accreditation", // credential or exam, as the vendor names it
        guides: ["netskope-integrator-accreditation"], // this site's study guides for it
        basis: { // basis, with source and read date
          en: "Netskope's Integrator Accreditation datasheet (TR-773-1, 09/24) lists the Security Cloud Implementation & Integration course (NSCI&I), this course's former name, among its preparation resources; the current course page names no accreditation.", // British English
          "pt-BR": "O datasheet da Integrator Accreditation da Netskope (TR-773-1, 09/24) lista o curso Security Cloud Implementation & Integration (NSCI&I), nome antigo deste curso, entre os recursos de preparação; a página atual do curso não cita acreditação.", // Brazilian Portuguese
        },
      },
      next: { // recommended next step
        kind: "external", // courses | external | none
        name: "Netskope One Expert SSE", // the vendor's follow-on course, verbatim
        url: "https://netskopeacademy.arlo.co/w/events/31-netskope-one-expert-sse", // its public page
        basis: { // basis of the recommendation
          en: "Netskope Academy lists Netskope One Professional as a recommended prerequisite of its advanced Netskope One Expert course (read 25 October 2026). That course is not part of my catalogue.", // British English
          "pt-BR": "A Netskope Academy lista o Netskope One Professional como pré-requisito recomendado do curso avançado Netskope One Expert (lido em 25 de outubro de 2026). Esse curso não faz parte do meu catálogo.", // Brazilian Portuguese
        },
      },
      source: { // official outline source (S2)
        url: "https://netskopeacademy.arlo.co/w/events/32-netskope-one-professional-sse", // vendor page or outline document
        title: "Netskope One Professional SSE", // the vendor's own title, verbatim
        vendorCourseId: null, // vendor course identifier, when published
        version: null, // version as published; null = not stated publicly
        checkedOn: "2026-10-25", // day of the latest read
        outcome: "verified", // content outcome of that read
        finding: { // what the read showed
          en: "Netskope Academy's course page gives the 24-hour (3-day) duration, the format, the description and the recommended prerequisites. It states no product or courseware version.", // British English
          "pt-BR": "A página do curso na Netskope Academy traz a duração de 24 horas (3 dias), o formato, a descrição e os pré-requisitos recomendados. Não informa versão do produto nem do material.", // Brazilian Portuguese
        },
      },
      curriculumChecked: "2026-10-25", // last successful verification of this course
    },
  ],
};

// ============================================================================
// The full catalogue, in pillar order.
// ============================================================================
export const PLATFORMS: Platform[] = [f5, extreme, fortinet, netskope];

/** Total number of courses across all platforms, derived from the records (CC07-F). */
export const COURSE_COUNT = PLATFORMS.reduce((n, p) => n + p.courses.length, 0);

/** Look up a platform by slug. */
export function getPlatform(slug: string): Platform | undefined {
  // The first platform whose slug matches.
  return PLATFORMS.find((p) => p.slug === slug);
}

/** Look up a course within a platform by slugs. */
export function getCourse(platformSlug: string, courseSlug: string): Course | undefined {
  // The platform first, then the course inside it.
  return getPlatform(platformSlug)?.courses.find((c) => c.slug === courseSlug);
}

/** Resolve a CourseRef to its platform and course, or undefined when the reference is broken. */
export function resolveCourseRef(ref: CourseRef): { platform: Platform; course: Course } | undefined {
  // The referenced platform.
  const platform = getPlatform(ref.platform);
  // The referenced course inside it.
  const course = platform?.courses.find((c) => c.slug === ref.course);
  // Both must exist for the reference to resolve.
  return platform && course ? { platform, course } : undefined;
}

/** The text of a Localized value for a locale: pt-BR gets Portuguese, every other locale the English source. */
export function localizedText(text: Localized, locale: string): { text: string; lang: "en" | "pt-BR" } {
  // Brazilian Portuguese is the only other authored locale.
  if (locale === "pt-BR") return { text: text["pt-BR"], lang: "pt-BR" };
  // Everything else reads the English source (marked lang="en" by the caller when the page is not English).
  return { text: text.en, lang: "en" };
}

/** All [platformSlug, courseSlug] pairs, for static path generation. */
export function allCoursePaths(): { platform: string; course: string }[] {
  // One pair per course of every platform.
  return PLATFORMS.flatMap((p) => p.courses.map((c) => ({ platform: p.slug, course: c.slug })));
}
