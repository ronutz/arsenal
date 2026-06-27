// ============================================================================
// src/content/training/courses.ts
// ----------------------------------------------------------------------------
// THE COURSE CATALOG — the courses Rodolfo Nützmann is authorized to deliver,
// across the four current pillars (F5, Extreme Networks, Fortinet, Netskope).
//
// SOURCING: course names, durations, and module-level tables of contents were
// gathered from the vendors' own current training catalogs (and Red Education,
// Rodolfo's delivery channel) in June 2026. Descriptions here are written in
// original wording, NOT copied from vendor marketing copy. The ToCs are factual
// course structure (the module/chapter skeleton), which is reference fact.
//
// "Representative, not exhaustive": this catalog reflects the courses on record;
// it is presented to visitors as representative. Durations and module lists are
// the best current public information and will be refined when Rodolfo supplies
// the official, current datasheets.
//
// AGENDAS are intentionally omitted for now (to be added later from official
// datasheets). Each course carries: description, duration, and a ToC.
// ============================================================================

export interface Course {
  /** URL slug, unique within a platform (e.g. "configuring-ltm"). */
  slug: string;
  /** Display name of the course. */
  name: string;
  /** Optional former/alternate name shown as context (e.g. "formerly ASM"). */
  altName?: string;
  /** Typical duration, as a short human string (e.g. "3 days"). */
  duration: string;
  /** A one-line summary for cards. */
  summary: string;
  /** A fuller description, in original wording. */
  description: string;
  /** Factual module-level table of contents (the course skeleton). */
  toc: string[];
  /** Optional note (e.g. prerequisite, certification target). */
  note?: string;
}

export interface Platform {
  /** URL slug (e.g. "f5"). */
  slug: string;
  /** Display name. */
  name: string;
  /** Short tagline. */
  tagline: string;
  /** Platform-level description, original wording. */
  intro: string;
  /** Year Rodolfo became an authorized instructor for this platform. */
  since: string;
  /** Year Rodolfo began working hands-on with this technology (depth beyond the instructor years). Optional. */
  workingSince?: string;
  /** i18n key (under training.tech.*) for the underlying-technology label, used instead of the vendor name. Optional; falls back to the platform name. */
  workingTechKey?: string;
  /** The authorized courses for this platform. */
  courses: Course[];
}

// ============================================================================
// F5 — 12 BIG-IP courses. Anchor platform. Durations per vendor/partner
// catalogs (Administering 2d, LTM 3d, Troubleshooting 2d, etc.).
// ============================================================================
const f5: Platform = {
  slug: "f5",
  name: "F5",
  tagline: "Application delivery and application security, on BIG-IP.",
  intro:
    "F5 BIG-IP sits in front of applications, controlling how traffic reaches them and protecting them as it does. The platform spans load balancing and traffic management, web application firewalling, access control, DNS, network firewalling, and SSL visibility. These courses build the operational skill to deploy and run BIG-IP across that full range, from first setup through advanced, module-specific configuration.",
  since: "2020",
  workingSince: "2013",
  courses: [
    {
      slug: "administering-big-ip",
      name: "Administering BIG-IP",
      duration: "2 days",
      summary: "The foundation course: set up and operate a BIG-IP system.",
      description:
        "This is the starting point for the BIG-IP curriculum and the prerequisite knowledge base for most of the module-specific courses. It covers bringing a BIG-IP system online and running it as it is commonly deployed in an application delivery network: initial setup and licensing, resource provisioning, networking, and high availability. Students work hands-on with the core traffic-processing objects, pools, virtual servers, health monitors, and address translation, and learn to shape traffic behavior with profiles and persistence, using both the configuration utility and the TMOS shell. Basic troubleshooting, including the iHealth diagnostic tool, rounds out the operational picture.",
      toc: [
        "Setting up the BIG-IP system",
        "Traffic processing building blocks",
        "Using the Traffic Management Shell (tmsh)",
        "Using NATs and SNATs",
        "Monitoring application health",
        "Modifying traffic behavior with profiles",
        "Modifying traffic behavior with persistence",
        "Administering the BIG-IP system",
        "Configuring high availability",
        "Basic troubleshooting and support tools",
      ],
      note: "The prerequisite course for most other F5 BIG-IP training.",
    },
    {
      slug: "configuring-ltm",
      name: "Configuring BIG-IP LTM",
      altName: "Local Traffic Manager",
      duration: "3 days",
      summary: "Load balancing and traffic management with Local Traffic Manager.",
      description:
        "Local Traffic Manager is the load-balancing and traffic-management heart of BIG-IP, and this course builds a working command of it, from commonly used features through more advanced functionality. Students learn to configure virtual servers, pools, and load-balancing methods; tune application health monitoring; and apply persistence appropriately across its several types. The advanced portion covers options like VLAN tagging and trunking, SNMP, packet filters, and route domains, along with customizing delivery using iRules and local traffic policies, and mitigating common network- and application-layer attacks with LTM features.",
      toc: [
        "Setting up the BIG-IP system",
        "Reviewing local traffic configuration",
        "Load balancing traffic with LTM",
        "Modifying traffic behavior with persistence",
        "Monitoring application health in depth",
        "Processing traffic with virtual servers",
        "Processing traffic with SNATs",
        "Modifying traffic behavior with profiles",
        "Selected topics: NATs, route domains, packet filters",
        "Customizing application delivery with iRules and policies",
        "Mitigating common attacks with LTM",
      ],
      note: "First step toward the F5 Certified Technology Specialist, LTM track.",
    },
    {
      slug: "troubleshooting-big-ip",
      name: "Troubleshooting BIG-IP",
      duration: "2 days",
      summary: "Systematic troubleshooting of BIG-IP systems and traffic.",
      description:
        "Built for practitioners who already administer BIG-IP, this course turns operational familiarity into structured diagnostic skill. It works through the hardware and software architecture relevant to troubleshooting, then drills the tools and techniques for isolating problems: reading logs across local, high-speed, and remote logging paths; capturing and interpreting traffic; and using the diagnostic and support tooling the platform provides. The emphasis is methodology, working a problem from symptom to root cause, reinforced through labs and discussion of real failure scenarios.",
      toc: [
        "BIG-IP architecture from a troubleshooting view",
        "Troubleshooting methodology",
        "Working with the Traffic Management Shell",
        "Gathering and interpreting logs",
        "Capturing and analyzing traffic",
        "Diagnostic and support tools (including iHealth)",
        "Troubleshooting common scenarios",
        "Escalation and support data collection",
      ],
      note: "Assumes completion of Administering BIG-IP and production experience.",
    },
    {
      slug: "configuring-dns",
      name: "Configuring BIG-IP DNS",
      altName: "formerly GTM, Global Traffic Manager",
      duration: "2 days",
      summary: "Intelligent DNS and global server load balancing.",
      description:
        "BIG-IP DNS, formerly Global Traffic Manager, brings intelligence and resilience to DNS, distributing users across data centers and clouds based on health, proximity, and load. This course covers standing up BIG-IP DNS, configuring wide IPs and pools, and the load-balancing methods that direct users to the best available resource. It addresses DNS resolution and delegation, synchronization across a DNS sync group, monitoring of distributed resources, and DNS security features, building the skills to run global, fault-tolerant application access.",
      toc: [
        "Setting up the BIG-IP system",
        "Introducing BIG-IP DNS",
        "Accelerating DNS resolution",
        "Implementing wide IPs and pools",
        "Using DNS load balancing methods",
        "Monitoring distributed resources",
        "Configuring a DNS sync group",
        "Securing and delegating DNS",
        "Integrating with LTM and the wider network",
      ],
    },
    {
      slug: "configuring-advanced-waf",
      name: "Configuring F5 Advanced WAF",
      altName: "formerly ASM, Application Security Manager",
      duration: "4 days",
      summary: "Web application firewalling with Advanced WAF.",
      description:
        "Advanced WAF protects web applications from the threats that target them directly, from the OWASP Top 10 through targeted, automated, and layer-7 attacks. This course builds the skill to deploy and tune application security policies: understanding how the WAF inspects traffic, building positive and negative security models, handling false positives, and protecting against attacks such as injection, cross-site scripting, and credential abuse. It covers learning and policy building, attack signatures, bot defense, and DoS protection at the application layer, so students leave able to secure real applications without breaking them.",
      toc: [
        "Setting up the BIG-IP system",
        "Traffic processing with BIG-IP and Advanced WAF",
        "Web application concepts and vulnerabilities",
        "Security policy deployment",
        "Policy tuning and false-positive handling",
        "Attack signatures and the signature lifecycle",
        "Positive security and policy building",
        "Securing cookies and other objects",
        "Bot defense and proactive mitigation",
        "Layer-7 DoS protection",
      ],
      note: "First step toward the F5 Certified Technology Specialist, WAF track.",
    },
    {
      slug: "setting-up-advanced-waf-workshop",
      name: "Setting Up F5 Advanced WAF Workshop",
      duration: "2 days",
      summary: "A hands-on workshop on standing up Advanced WAF protections.",
      description:
        "A shorter, workshop-format complement to the full Advanced WAF course, this session concentrates on getting protections in place quickly and correctly. It is practical and lab-driven: deploying a baseline application security policy, applying the most impactful protections, and validating that legitimate traffic still flows. The workshop suits teams that need to operationalize Advanced WAF efficiently and want concentrated hands-on time on the core deployment path rather than the full certification-track depth.",
      toc: [
        "Advanced WAF deployment essentials",
        "Building a baseline security policy",
        "Applying high-impact protections",
        "Tuning to reduce false positives",
        "Validating legitimate application traffic",
        "Operationalizing and maintaining the policy",
      ],
    },
    {
      slug: "configuring-apm",
      name: "Configuring BIG-IP APM",
      altName: "Access Policy Manager",
      duration: "3 days",
      summary: "Access control, SSL VPN, and identity-aware access.",
      description:
        "Access Policy Manager turns BIG-IP into an access-control and identity gateway, securing how users reach applications. This course covers building access policies with the visual policy editor, authenticating users against external identity stores, and enforcing context-aware access. It addresses SSL VPN and network access, application access and the webtop, single sign-on, and endpoint posture checks, so students can implement secure, federated, identity-aware access to applications whether on-premises or in the cloud.",
      toc: [
        "Setting up the BIG-IP system",
        "Introducing Access Policy Manager",
        "Building access policies with the visual policy editor",
        "Authentication, authorization, and accounting",
        "Configuring SSL VPN and network access",
        "Application access and the webtop",
        "Implementing single sign-on",
        "Endpoint security and posture assessment",
        "Federation and SAML",
      ],
    },
    {
      slug: "configuring-afm",
      name: "Configuring BIG-IP AFM",
      altName: "Advanced Firewall Manager",
      duration: "2 days",
      summary: "Data-center network firewalling and DDoS defense.",
      description:
        "Advanced Firewall Manager adds a high-performance, data-center-grade network firewall to BIG-IP, built to protect the network layer in front of applications. This course covers configuring AFM firewall rules and policies, the order in which they are evaluated, and how AFM integrates with LTM's traffic-processing objects. It addresses network-layer DoS and DDoS protection, IP intelligence, and logging and reporting, building the skill to defend the network perimeter of an application delivery environment.",
      toc: [
        "Setting up the BIG-IP system",
        "Introducing Advanced Firewall Manager",
        "Configuring network firewall rules and policies",
        "Firewall rule evaluation and ordering",
        "Network address translation with AFM",
        "Detecting and mitigating DoS and DDoS",
        "Using IP intelligence",
        "Logging, reporting, and monitoring",
      ],
    },
    {
      slug: "configuring-ssl-orchestrator",
      name: "Configuring F5 SSL Orchestrator",
      duration: "2 days",
      summary: "SSL/TLS visibility and dynamic security service chaining.",
      description:
        "Encrypted traffic hides both legitimate activity and threats, and SSL Orchestrator solves the problem of inspecting it efficiently. This course covers deploying SSL Orchestrator to decrypt traffic once, steer it through a chain of security devices, and re-encrypt it, without each device having to handle decryption itself. It addresses topologies and deployment modes, building service chains, traffic classification and steering rules, and integrating third-party security inspection devices, so students can give an organization's existing security stack visibility into encrypted traffic.",
      toc: [
        "Setting up the BIG-IP system",
        "Introducing SSL Orchestrator",
        "SSL/TLS visibility concepts",
        "Deployment topologies and modes",
        "Building security service chains",
        "Classifying and steering traffic",
        "Integrating inspection devices",
        "Monitoring and troubleshooting the deployment",
      ],
    },
    {
      slug: "developing-irules",
      name: "Developing iRules for BIG-IP",
      duration: "3 days",
      summary: "Custom traffic control with the iRules scripting language.",
      description:
        "iRules is BIG-IP's event-driven scripting language, and it is where the platform becomes programmable, letting an engineer inspect and act on traffic in ways the configuration objects alone cannot. This course builds iRules skill from the ground up: the event model, the syntax, and the most useful commands for inspecting and manipulating traffic. Students learn to parse and modify HTTP, make routing and persistence decisions in code, work with data groups and variables, and write iRules that are correct and performant, with attention to the troubleshooting and tuning that real iRules development requires.",
      toc: [
        "iRules concepts and the event model",
        "Getting started with iRules syntax",
        "Working with HTTP in iRules",
        "Variables, operators, and control structures",
        "Using data groups",
        "Making load-balancing and persistence decisions",
        "Working with strings and parsing",
        "iRules performance and best practices",
        "Troubleshooting and debugging iRules",
      ],
    },
    {
      slug: "configuring-managing-big-iq",
      name: "Configuring and Managing BIG-IQ",
      duration: "2 days",
      summary: "Centralized management of many BIG-IP devices with BIG-IQ.",
      description:
        "When an organization runs many BIG-IP devices, managing them one at a time stops scaling, and BIG-IQ is the answer: a central platform for managing devices, configurations, licenses, and security policies across a BIG-IP estate. This course covers deploying BIG-IQ, discovering and importing managed devices, and centrally administering configuration and licensing. It addresses managing LTM and security objects at scale, license management for virtual editions, and the monitoring, reporting, and role-based administration that make a large deployment governable.",
      toc: [
        "Introducing BIG-IQ",
        "Setting up BIG-IQ and the data collection device",
        "Discovering and importing BIG-IP devices",
        "Centrally managing LTM configuration",
        "Managing security policies at scale",
        "License management for BIG-IP VE",
        "Monitoring, dashboards, and reporting",
        "Role-based access and administration",
      ],
    },
    {
      slug: "automating-big-ip",
      name: "Automating BIG-IP",
      altName: "with Ansible and AS3",
      duration: "3 days",
      summary: "Declarative and automated BIG-IP configuration.",
      description:
        "Modern infrastructure is configured as code, and this course brings BIG-IP into that world, covering the declarative and automation approaches that replace manual, click-by-click configuration. It addresses the Application Services 3 (AS3) declarative model for describing BIG-IP configuration as data, the iControl REST API underneath it, and using Ansible to drive BIG-IP automation repeatably. Students learn to express configuration declaratively, build automation that is idempotent and version-controlled, and fit BIG-IP into a CI/CD and infrastructure-as-code workflow.",
      toc: [
        "Automation concepts for BIG-IP",
        "The iControl REST API",
        "Introducing AS3 and declarative configuration",
        "Building and deploying AS3 declarations",
        "Automating with Ansible",
        "Idempotency and configuration as code",
        "Templating and reuse",
        "Integrating into CI/CD workflows",
      ],
      note: "Reflects the unified automation course consolidating the former AS3 and Ansible offerings.",
    },
  ],
};

// ============================================================================
// EXTREME NETWORKS — 9 courses across ExtremeSwitching, ExtremeCloud SD-WAN,
// and ExtremeCloud IQ API & Automation. Durations per Extreme/Red Education
// catalogs (Switching I&C ~3d). ToCs from verified course outlines.
// ============================================================================
const extreme: Platform = {
  slug: "extreme",
  name: "Extreme Networks",
  tagline: "Campus switching, SD-WAN, and cloud-driven network operations.",
  intro:
    "Extreme Networks builds the switching, routing, and cloud-managed networking that runs enterprise campuses. These courses follow the Professional Program across two tracks, ExtremeSwitching on ExtremeXOS / Switch Engine, and ExtremeCloud SD-WAN, each progressing from installation and configuration through management, advanced configuration, and troubleshooting, plus a dedicated course on API and automation for ExtremeCloud IQ. The lineage runs back to Enterasys and Cabletron, where this career began.",
  since: "2021",
  workingSince: "1996",
  workingTechKey: "switchesRouters",
  courses: [
    {
      slug: "switching-installation-configuration",
      name: "ExtremeSwitching: Installation and Configuration",
      duration: "3 days",
      summary: "Layer 2 and Layer 3 configuration on ExtremeXOS / Switch Engine.",
      description:
        "The first step in the ExtremeSwitching track, this course builds the core skills for installing and configuring ExtremeXOS / Switch Engine switches. It works through the Layer 2 mechanisms that underpin a switched network, VLANs, discovery protocols, loop prevention with Spanning Tree, and link redundancy with LAG and MLAG, then moves into Layer 3, covering static routing, virtual routers and VRFs, and gateway redundancy with VRRP. The knowledge is reinforced throughout with hands-on lab work on real equipment.",
      toc: [
        "VLANs: principles and implementation",
        "Discovery protocols",
        "Loop prevention with Spanning Tree",
        "Link redundancy with LAG and MLAG",
        "Redundancy with ELRP and SLPP Guard",
        "Ring redundancy with EAPS and ERPS",
        "Routing overview",
        "Static routing",
        "Virtual routers and VRFs",
        "Gateway redundancy with VRRP",
      ],
      note: "The entry point to the ExtremeSwitching Professional Program track.",
    },
    {
      slug: "switching-management",
      name: "ExtremeSwitching: Management",
      duration: "2 days",
      summary: "Managing switching and routing with ExtremeCloud IQ.",
      description:
        "This course covers preparing an ExtremeXOS / Switch Engine environment for management, whether through ExtremeCloud IQ, ExtremeCloud IQ Site Engine, or capable third-party tools. Students learn to implement the management mechanisms on the switches, onboard devices to the cloud-management platforms, and carry out the common network-management tasks that keep an estate observable and maintainable. The material is exercised hands-on against networking equipment so the management workflows are practiced, not just described.",
      toc: [
        "Management mechanisms in ExtremeXOS / Switch Engine",
        "Preparing devices for onboarding",
        "Onboarding to ExtremeCloud IQ",
        "Onboarding to ExtremeCloud IQ Site Engine",
        "Monitoring and visibility",
        "Common network management tasks",
        "Working with third-party management",
      ],
    },
    {
      slug: "switching-advanced-configuration",
      name: "ExtremeSwitching: Advanced Configuration",
      duration: "2 days",
      summary: "Security, QoS, and automation on ExtremeXOS / Switch Engine.",
      description:
        "Building on installation and configuration, this course covers the more advanced capabilities of ExtremeXOS / Switch Engine. It addresses implementing security mechanisms such as ONEPolicy and access control lists, applying traffic-optimization techniques including Quality of Service, and extending switch capabilities through automation, with Fabric Attach, CLI scripting, and Python scripting and processes. As with the rest of the track, the concepts are reinforced with real-world hands-on tasks in the lab.",
      toc: [
        "Security with ONEPolicy",
        "Access control lists",
        "Quality of Service and traffic optimization",
        "Fabric Attach",
        "CLI scripting",
        "Python scripting and processes",
        "Automating and integrating switch capabilities",
      ],
    },
    {
      slug: "switching-troubleshooting",
      name: "ExtremeSwitching: Troubleshooting",
      duration: "2 days",
      summary: "Troubleshooting methodology and tooling for Switch Engine.",
      description:
        "This course builds structured troubleshooting skill for ExtremeXOS / Switch Engine environments. Students learn a troubleshooting methodology and the toolkit available to network engineers and administrators: determining whether an issue is network-related, diagnosing the switch and the surrounding network with built-in tools, and resolving the problems most frequently encountered. It also covers collecting support data and opening a case with Extreme's support organization, so escalation is handled cleanly when needed. The skills are practiced hands-on in the lab.",
      toc: [
        "Troubleshooting methodology",
        "Is the issue network-related?",
        "Built-in diagnostic tools",
        "Diagnosing Switch Engine and the network",
        "Resolving frequently encountered issues",
        "Collecting support data",
        "Opening and managing a support case",
      ],
      note: "Builds on ExtremeSwitching: Installation and Configuration.",
    },
    {
      slug: "sdwan-installation-configuration",
      name: "ExtremeCloud SD-WAN: Installation and Configuration",
      duration: "2 days",
      summary: "Standing up an ExtremeCloud SD-WAN solution and site types.",
      description:
        "The entry point to the ExtremeCloud SD-WAN track, this course builds the skill to install and configure an ExtremeCloud SD-WAN solution. It covers the major site types, Bridge mode, Router mode, Hybrid mode, and the Remote Visibility Control site, and how each fits different deployment needs. Students learn the platform's architecture and the configuration path to get a working SD-WAN fabric in place, reinforced with hands-on practice.",
      toc: [
        "ExtremeCloud SD-WAN architecture",
        "Site types overview",
        "Bridge mode sites",
        "Router mode sites",
        "Hybrid mode sites",
        "Remote Visibility Control sites",
        "Bringing up the SD-WAN fabric",
      ],
      note: "The entry point to the ExtremeCloud SD-WAN track.",
    },
    {
      slug: "sdwan-management",
      name: "ExtremeCloud SD-WAN: Management",
      duration: "2 days",
      summary: "Operating and monitoring an ExtremeCloud SD-WAN deployment.",
      description:
        "This course covers the day-to-day operation of an ExtremeCloud SD-WAN deployment: monitoring the fabric, managing sites and policies, and maintaining visibility into application performance across the WAN. Students learn the management workflows that keep an SD-WAN running well after it is deployed, practiced hands-on so the operational model is concrete.",
      toc: [
        "Managing the SD-WAN deployment",
        "Monitoring sites and links",
        "Application visibility across the WAN",
        "Policy management",
        "Maintaining performance",
        "Operational best practices",
      ],
    },
    {
      slug: "sdwan-advanced-configuration",
      name: "ExtremeCloud SD-WAN: Advanced Configuration",
      duration: "2 days",
      summary: "Advanced SD-WAN policy, routing, and optimization.",
      description:
        "Building on the SD-WAN fundamentals, this course covers the more advanced configuration of an ExtremeCloud SD-WAN solution: refining application-aware routing and policy, tuning path selection and optimization, and handling the more complex topologies that real deployments require. The material is reinforced with hands-on lab work.",
      toc: [
        "Advanced SD-WAN policy",
        "Application-aware routing",
        "Path selection and steering",
        "WAN optimization techniques",
        "Complex topologies",
        "Tuning and validation",
      ],
    },
    {
      slug: "sdwan-troubleshooting",
      name: "ExtremeCloud SD-WAN: Troubleshooting",
      duration: "2 days",
      summary: "Diagnosing and resolving SD-WAN issues.",
      description:
        "This course builds troubleshooting skill for ExtremeCloud SD-WAN environments. Students learn a methodology for isolating SD-WAN problems, the diagnostic tools available, and how to resolve the issues most commonly seen in fabric, routing, and application-performance scenarios, along with collecting support data and escalating cleanly. The skills are practiced hands-on.",
      toc: [
        "SD-WAN troubleshooting methodology",
        "Isolating fabric and link issues",
        "Diagnostic tools",
        "Routing and path problems",
        "Application-performance issues",
        "Collecting support data and escalating",
      ],
    },
    {
      slug: "cloudiq-api-automation",
      name: "ExtremeCloud IQ: API and Automation",
      duration: "2 days",
      summary: "Automating ExtremeCloud IQ deployments with APIs and scripts.",
      description:
        "Automation turns repetitive operational work into self-running procedures, and this course covers API and automation concepts for ExtremeCloud IQ. Students become familiar with the tools and methods for automating deployments, from day-to-day task automation through automating the deployment itself, working with the platform's APIs and scripting. The emphasis is practical: using automation to make a cloud-managed network estate faster and more consistent to operate.",
      toc: [
        "API and automation concepts",
        "The ExtremeCloud IQ API",
        "Authenticating and working with the API",
        "Automating day-to-day tasks",
        "Automating deployments",
        "Scripting and tooling",
        "Putting automation into practice",
      ],
    },
  ],
};

// ============================================================================
// FORTINET — 5 courses, Secure Networking (FCP) track, FortiGate-centered.
// NOTE: Fortinet renamed/restructured its program (mid-2026); "FortiGate
// Administrator" is now "FortiOS Administrator" (NSE 4 level), FortiGate
// Operator at NSE 3. Durations per vendor/partner catalogs (Administrator 4d).
// This set is REPRESENTATIVE of the FCP Secure Networking path and will be
// refined to Rodolfo's exact current authorizations from official datasheets.
// ============================================================================
const fortinet: Platform = {
  slug: "fortinet",
  name: "Fortinet",
  tagline: "Network security on FortiGate and the Fortinet Security Fabric.",
  intro:
    "Fortinet's FortiGate is one of the most widely deployed network security platforms, and its training centers on operating FortiGate effectively, firewall policy, secure connectivity, and the security profiles that inspect and control traffic. These courses follow the Fortinet Certified Professional path in Secure Networking, from foundational operation through administration and into the management and analytics tools of the Security Fabric. Fortinet recently restructured its certification program; the courses below reflect that path and will be refined to the exact current titles.",
  since: "2024",
  workingSince: "1998",
  workingTechKey: "firewalls",
  courses: [
    {
      slug: "fortigate-operator",
      name: "FortiGate Operator",
      altName: "NSE 3 level",
      duration: "1 day",
      summary: "Foundational, day-to-day operation of FortiGate.",
      description:
        "The foundational course in the FortiGate path, FortiGate Operator builds the knowledge to carry out high-level operational tasks on FortiGate devices. It suits professionals responsible for day-to-day operation, particularly in small and mid-sized environments, and establishes the base understanding of FortiGate device management, basic policy, and monitoring that the Administrator course then builds on. It is the recommended prerequisite for FortiOS Administrator.",
      toc: [
        "FortiGate and the Security Fabric overview",
        "Basic device management",
        "Introduction to firewall policy",
        "Monitoring and logging basics",
        "Common day-to-day operational tasks",
      ],
      note: "Recommended prerequisite for the Administrator course (NSE 3 level).",
    },
    {
      slug: "fortigate-administrator",
      name: "FortiGate Administrator",
      altName: "FortiOS Administrator, NSE 4 level",
      duration: "4 days",
      summary: "Configuring and administering the most-used FortiGate features.",
      description:
        "The core FortiGate course and the heart of the FCP Secure Networking path, this builds a working command of the features used most in production. In hands-on labs, students configure firewall policies and NAT, user authentication including Fortinet Single Sign-On with Active Directory, and secure connectivity with SSL and site-to-site IPsec VPN. They apply the security profiles that make FortiGate a next-generation firewall, antivirus, web filtering, intrusion prevention, and application control, and work with high availability, SD-WAN, the Security Fabric, and diagnostics and troubleshooting.",
      toc: [
        "System and network settings",
        "Firewall policies and NAT",
        "Routing",
        "Firewall authentication",
        "Fortinet Single Sign-On (FSSO)",
        "Certificate operations",
        "Antivirus",
        "Web filtering",
        "Intrusion prevention and application control",
        "SSL VPN",
        "IPsec VPN",
        "SD-WAN configuration and monitoring",
        "Security Fabric",
        "High availability",
        "Diagnostics and troubleshooting",
      ],
      note: "Prepares for the FCP FortiGate / FortiOS Administrator exam (NSE 4 level).",
    },
    {
      slug: "fortimanager",
      name: "FortiManager",
      altName: "NSE 5 level",
      duration: "2 days",
      summary: "Centralized management of many FortiGate devices.",
      description:
        "FortiManager provides centralized configuration and policy management across a fleet of FortiGate devices, and this course builds the skill to run it. It covers deploying FortiManager, bringing managed devices under control, and administering device configuration and firewall policy centrally through device and policy management workflows. Students learn the administrative-domain model, configuration installation, and the management practices that make a large FortiGate estate consistent and governable.",
      toc: [
        "Introduction to centralized management",
        "Deploying and setting up FortiManager",
        "Adding and managing devices",
        "Administrative domains (ADOMs)",
        "Device-level configuration management",
        "Central policy and object management",
        "Installing and verifying configuration",
        "Monitoring and administration",
      ],
      note: "Part of the FCP Secure Networking path (NSE 5 level). Representative listing.",
    },
    {
      slug: "fortianalyzer",
      name: "FortiAnalyzer",
      altName: "NSE 5 level",
      duration: "2 days",
      summary: "Centralized logging, analytics, and reporting.",
      description:
        "FortiAnalyzer is the centralized logging and analytics platform for the Fortinet Security Fabric, and this course covers using it to turn logs into security insight. Students learn to bring logs in from FortiGate and other Fabric devices, identify current and potential threats through log analysis, and manage events, incidents, and reports. It addresses the analytics and reporting workflows, and the automation of response with playbooks, that make FortiAnalyzer a working tool for security operations.",
      toc: [
        "Introduction to FortiAnalyzer",
        "Deployment and setup",
        "Log collection and storage",
        "Log analysis and threat identification",
        "Event and incident management",
        "Reports and reporting automation",
        "Playbooks and task automation",
        "Administration and maintenance",
      ],
      note: "Part of the FCP Secure Networking path (NSE 5 level). Representative listing.",
    },
    {
      slug: "secure-sdwan",
      name: "FortiGate Secure SD-WAN",
      duration: "2 days",
      summary: "Designing and operating SD-WAN on FortiGate.",
      description:
        "FortiGate's SD-WAN capabilities bring application-aware routing and resilient connectivity to the WAN, and this course builds the skill to design and run it. It covers configuring SD-WAN members and zones, building the rules that steer traffic by application and performance, and the SLA monitoring that drives path selection. Students also work with centralized SD-WAN management and the monitoring needed to keep an SD-WAN deployment performing, all reinforced with hands-on practice.",
      toc: [
        "SD-WAN concepts on FortiGate",
        "SD-WAN members and zones",
        "Performance SLAs and link monitoring",
        "SD-WAN rules and application steering",
        "Routing with SD-WAN",
        "Centralized SD-WAN management",
        "Monitoring and troubleshooting",
      ],
      note: "Representative of the SD-WAN specialization within Secure Networking.",
    },
  ],
};

// ============================================================================
// NETSKOPE — 2 courses. Names confirmed via Red Education (Rodolfo's channel)
// and Netskope: NSCO&A is now Netskope One Administrator (3d); NSCI&I is now
// Netskope One Professional (3d). ToCs from verified course outlines.
// ============================================================================
const netskope: Platform = {
  slug: "netskope",
  name: "Netskope",
  tagline: "Cloud security and SASE on the Netskope One platform.",
  intro:
    "Netskope secures how organizations use the cloud, the web, and private applications, bringing visibility and control to traffic that traditional perimeters never saw. Its instructor-led training centers on the Netskope One platform: administering the core security controls, then implementing and integrating the platform into an enterprise environment. These two courses form a clear path, from operating the platform day to day to deploying it end to end. Rodolfo added Netskope to his delivery in 2025.",
  since: "2025",
  workingSince: "2008",
  workingTechKey: "webCloudSecurity",
  courses: [
    {
      slug: "netskope-one-administrator",
      name: "Netskope One Administrator",
      altName: "formerly NSCO&A, Security Cloud Operation and Administration",
      duration: "3 days",
      summary: "Administering core security controls on the Netskope One platform.",
      description:
        "This course builds the skill to administer the Netskope One platform day to day. It begins with the platform's architecture, the management plane and data plane, and the tenant interface, then moves through the core operational controls: user management and traffic steering, and configuring and managing the Netskope Client for connectivity and policy enforcement. Students design real-time and API data protection policies, apply web security controls, and work with the cloud firewall, Data Loss Prevention, and threat protection including behavioral analytics, using analytics and reporting to validate outcomes and troubleshoot.",
      toc: [
        "Netskope platform architecture",
        "Navigating the tenant interface",
        "User management",
        "Traffic steering",
        "Configuring and managing the Netskope Client",
        "Real-time protection policies",
        "API data protection policies",
        "Web security",
        "Cloud firewall",
        "Data Loss Prevention (DLP)",
        "Threat protection and UEBA",
        "Advanced analytics and reporting",
      ],
      note: "The foundational Netskope instructor-led course.",
    },
    {
      slug: "netskope-one-professional",
      name: "Netskope One Professional",
      altName: "formerly NSCI&I, Security Cloud Implementation and Integration",
      duration: "3 days",
      summary: "Implementing and integrating Netskope into the enterprise.",
      description:
        "Building on the Administrator course, this course covers implementing and integrating the Netskope One platform into a real enterprise environment. It addresses identity integration with SAML, Netskope Private Access for zero-trust application access, advanced Data Loss Prevention, and web security, along with the platform's REST API for automation and integration. Students also work with Advanced Analytics, Security Posture Management, Remote Browser Isolation, and Cloud Exchange, with examples and hands-on practice on deploying the platform end to end.",
      toc: [
        "Single sign-on with SAML",
        "Netskope Private Access (NPA)",
        "Advanced Data Loss Prevention",
        "Web security in depth",
        "Netskope Advanced Analytics",
        "The Netskope REST API",
        "Security Posture Management",
        "Remote Browser Isolation (RBI)",
        "Netskope Cloud Exchange",
      ],
      note: "Requires the Netskope One Administrator course.",
    },
  ],
};

// ============================================================================
// The full catalog, in pillar order.
// ============================================================================
export const PLATFORMS: Platform[] = [f5, extreme, fortinet, netskope];

/** Total number of courses across all platforms. */
export const COURSE_COUNT = PLATFORMS.reduce((n, p) => n + p.courses.length, 0);

/** Look up a platform by slug. */
export function getPlatform(slug: string): Platform | undefined {
  return PLATFORMS.find((p) => p.slug === slug);
}

/** Look up a course within a platform by slugs. */
export function getCourse(platformSlug: string, courseSlug: string): Course | undefined {
  return getPlatform(platformSlug)?.courses.find((c) => c.slug === courseSlug);
}

/** All [platformSlug, courseSlug] pairs, for static path generation. */
export function allCoursePaths(): { platform: string; course: string }[] {
  return PLATFORMS.flatMap((p) => p.courses.map((c) => ({ platform: p.slug, course: c.slug })));
}
