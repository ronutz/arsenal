// ============================================================================
// check-acronym-first-mention — D-90 enforced on the Learn corpus.
// ----------------------------------------------------------------------------
// RULING (PRIME, 2026-08-27, ratifying PROPOSTA-D90-retrofit-learn-20260827):
// every ruled acronym is expanded at its first mention on each article, each
// locale, in the "ACRONYM (expansion)" form. CORPUS COMMONS never require
// expansion: DNS, TLS, HTTP(S), IP, TCP, UDP — the protocol vocabulary of the
// whole site — plus API (present bare in 123 articles per locale; expanding it
// everywhere is noise, ruled a commons). BGP, OSPF, NAT and VLAN are commons
// ONLY inside `category: networking`; everywhere else they expand.
//
// Detection matches the 2026-08-27 audit: body only (frontmatter excluded),
// code spans and link targets stripped; an acronym counts as expanded when its
// expansion stem appears anywhere in the body or the first use is immediately
// followed by " (".
//
// BASELINE may only go down (R-19 governs any legitimate lowering); the
// destination is 0.
// ============================================================================
import fs from "node:fs";
import path from "node:path";

const COMMONS_GLOBAL = ["DNS", "TLS", "HTTP", "HTTPS", "IP", "TCP", "UDP", "API"];
const COMMONS_NETWORKING = ["BGP", "OSPF", "NAT", "VLAN"];

/** Ruled set with expansion stems; en first, pt second (either satisfies). */
const RULED = {
  "VPN": ["virtual private network", "rede privada virtual"],
  "VLAN": ["virtual local area network", "rede local virtual"],
  "NAT": ["network address translation", "tradu\u00e7\u00e3o de endere\u00e7os de rede"],
  "BGP": ["Border Gateway Protocol"],
  "OSPF": ["Open Shortest Path First"],
  "SSO": ["single sign-on"],
  "WAF": ["web application firewall"],
  "DLP": ["data loss prevention"],
  "SIEM": ["security information and event management"],
  "LDAP": ["Lightweight Directory Access Protocol"],
  "GSLB": ["global server load balancing"],
  "CASB": ["cloud access security broker"],
  "DDoS": ["distributed denial", "nega\u00e7\u00e3o de servi\u00e7o distribu\u00edda"],
  "SD-WAN": ["software-defined WAN"],
  "OCSP": ["Online Certificate Status Protocol"],
  "SLA": ["service level agreement", "acordo de n\u00edvel de servi\u00e7o"],
  "ZTNA": ["zero trust network access"],
  "PKI": ["public key infrastructure", "infraestrutura de chaves p\u00fablicas"],
  "CDN": ["content delivery network", "rede de distribui\u00e7\u00e3o de conte\u00fado"],
  "MFA": ["multi-factor authentication", "autentica\u00e7\u00e3o multifator"],
  "RADIUS": ["Remote Authentication Dial-In User Service"],
  "IDS": ["intrusion detection system", "sistema de detec\u00e7\u00e3o de intrus\u00e3o"],
  "IPS": ["intrusion prevention system", "sistema de preven\u00e7\u00e3o de intrus\u00e3o"],
  "MPLS": ["Multiprotocol Label Switching"],
  "PoC": ["proof of concept", "prova de conceito"],
  "PoV": ["proof of value", "prova de valor"],
  "RCA": ["root cause analysis", "an\u00e1lise de causa raiz"],
  "MSP": ["managed service provider", "provedor de servi\u00e7os gerenciados"],
  "MSSP": ["managed security service provider"],
  "NOC": ["network operations center", "centro de opera\u00e7\u00f5es de rede"],
  "TAC": ["technical assistance center", "centro de assist\u00eancia t\u00e9cnica"],
  "RTO": ["recovery time objective"],
  "RPO": ["recovery point objective"],
  "SASE": ["secure access service edge"],
  "SOC": ["security operations center", "centro de opera\u00e7\u00f5es de seguran\u00e7a"],
  "SOAR": ["security orchestration"],
  "EDR": ["endpoint detection and response"],
  "XDR": ["extended detection and response"],
  "KPI": ["key performance indicator", "indicador-chave de desempenho"],
  "ROI": ["return on investment", "retorno sobre o investimento"],
  "TCO": ["total cost of ownership", "custo total de propriedade"],
  "SOW": ["statement of work"],
  "RMA": ["return merchandise authorization", "autoriza\u00e7\u00e3o de devolu\u00e7\u00e3o"],
  "SDK": ["software development kit"],
  "CMDB": ["configuration management database"],
  "CAB": ["change advisory board", "comit\u00ea de mudan\u00e7as"],
  "HSM": ["hardware security module"],
  "CRL": ["certificate revocation list", "lista de revoga\u00e7\u00e3o de certificados"],
  "VRF": ["virtual routing and forwarding"],
  "ACL": ["access control list", "lista de controle de acesso"],
  "CI/CD": ["continuous integration", "integra\u00e7\u00e3o e entrega cont\u00ednuas"],
  "IPO": ["initial public offering", "oferta p\u00fablica inicial"],
};

const BASELINE = 0; // DESTINATION reached 2026-08-27: retrofit complete in three batches. // 2026-08-27 count under this exact rule; may only go down.

let defects = 0;
const perFile = [];
for (const loc of ["en", "pt-BR"]) {
  const dir = path.join("src/content/learn", loc);
  for (const fn of fs.readdirSync(dir)) {
    if (!fn.endsWith(".mdx")) continue;
    const raw = fs.readFileSync(path.join(dir, fn), "utf8");
    const parts = raw.split("---");
    const fm = parts[1] ?? "";
    const body = parts.slice(2).join("---");
    const isNetworking = /category:\s*networking\b/.test(fm);
    const clean = body.replace(/`[^`]*`/g, "").replace(/\]\([^)]*\)/g, "");
    const low = clean.toLowerCase();
    let n = 0;
    for (const [ac, stems] of Object.entries(RULED)) {
      if (COMMONS_GLOBAL.includes(ac)) continue;
      if (isNetworking && COMMONS_NETWORKING.includes(ac)) continue;
      const re = new RegExp("(?<![\\w/-])" + ac.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\w-])");
      const m = re.exec(clean);
      if (!m) continue;
      const expanded =
        stems.some((s) => low.includes(s.toLowerCase())) ||
        clean.slice(m.index + ac.length).startsWith(" (");
      if (!expanded) n += 1;
    }
    if (n > 0) perFile.push([`${loc}/${fn}`, n]);
    defects += n;
  }
}

if (defects > BASELINE) {
  perFile.sort((a, b) => b[1] - a[1]);
  console.error(
    `[check-acronym-first-mention] FAIL: ${defects} unexpanded first mention(s), above the baseline of ${BASELINE}. Worst: ` +
      perFile.slice(0, 5).map(([f, n]) => `${f}(${n})`).join(", ")
  );
  process.exit(1);
}
const note = defects < BASELINE ? ` LOWER - drop BASELINE to ${defects}.` : "";
console.log(
  `[check-acronym-first-mention] OK: ${defects} unexpanded first mention(s) across the Learn corpus (baseline ${BASELINE}, may only go down).${note}`
);
