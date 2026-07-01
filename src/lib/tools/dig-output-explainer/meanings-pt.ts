// ============================================================================
// src/lib/tools/dig-output-explainer/meanings-pt.ts
// ----------------------------------------------------------------------------
// Brazilian Portuguese versions of the DNS reference meanings shown by the
// tool. In pt-BR technical usage, the protocol TOKENS (NOERROR, A, RRSIG, the
// flag abbreviations, RFC field names) stay in English; only the explanatory
// prose and descriptive labels are translated. That is the convention the
// audience reads, and it matches how these same concepts are written in the
// tool's pt-BR Learn articles.
//
// The keys here mirror the English maps in compute.ts exactly (RCODE / opcode /
// flag / RR type), and FIELD_LABELS_PT is keyed by the exact English label
// string that breakdownRdata emits, so a simple lookup translates it. Any key
// absent here falls back to the English source at the call site.
// ============================================================================

import type { DigFlag } from "./compute";

export const RCODE_MEANINGS_PT: Record<string, string> = {
  NOERROR: "Sem erro. A consulta foi respondida normalmente.",
  FORMERR: "Erro de formato. O servidor não conseguiu interpretar a consulta.",
  SERVFAIL: "Falha do servidor. O servidor não conseguiu processar a consulta (frequentemente uma delegação quebrada, uma falha de validação DNSSEC ou um timeout upstream).",
  NXDOMAIN: "Domínio inexistente. O nome consultado não existe. A resposta negativa é autoritativa quando a flag aa está definida, e seu TTL vem do minimum do SOA (RFC 2308).",
  NOTIMP: "Não implementado. O servidor não suporta o tipo de consulta ou o opcode solicitado.",
  REFUSED: "Recusado. O servidor recusou-se a responder, normalmente por política (controle de acesso, recursão desabilitada).",
  YXDOMAIN: "O nome existe quando não deveria (usado pelo UPDATE dinâmico).",
  YXRRSET: "O RRset existe quando não deveria (UPDATE dinâmico).",
  NXRRSET: "Um RRset que deveria existir não existe (UPDATE dinâmico).",
  NOTAUTH: "Servidor não autoritativo para a zona, ou requisição não autorizada.",
  NOTZONE: "Nome não contido na zona (UPDATE dinâmico).",
};

export const OPCODE_MEANINGS_PT: Record<string, string> = {
  QUERY: "Uma consulta padrão (o caso normal).",
  IQUERY: "Consulta inversa (obsoleta).",
  STATUS: "Requisição de status do servidor.",
  NOTIFY: "Notificação de mudança de zona de um primário para seus secundários.",
  UPDATE: "Atualização dinâmica de DNS (RFC 2136).",
};

export const FLAG_MEANINGS_PT: Record<DigFlag, string> = {
  qr: "Query Response. Definida em uma resposta (em oposição a uma consulta).",
  aa: "Authoritative Answer. O servidor que respondeu é autoritativo para o nome; o dado vem da própria zona, não de um cache.",
  tc: "TrunCated. A mensagem não coube e foi cortada. O dig normalmente tenta de novo por TCP; se você a vê, a resposta UDP está incompleta.",
  rd: "Recursion Desired. O cliente pediu ao servidor para resolver o nome inteiro por ele.",
  ra: "Recursion Available. O servidor está disposto e apto a recursar.",
  ad: "Authentic Data. O resolvedor validou a resposta com DNSSEC e ela conferiu.",
  cd: "Checking Disabled. O cliente pediu ao resolvedor para pular a validação DNSSEC.",
};

export const RRTYPE_MEANINGS_PT: Record<string, string> = {
  A: "Endereço IPv4 (RFC 1035).",
  AAAA: "Endereço IPv6 (RFC 3596).",
  CNAME: "Nome canônico - um alias que aponta este nome para outro nome (RFC 1035).",
  MX: "Mail exchanger - para onde o e-mail do domínio deve ser entregue, com um valor de preferência (RFC 1035).",
  NS: "Servidor de nomes - um servidor autoritativo para a zona (RFC 1035).",
  SOA: "Start of Authority - o registro do ápice da zona, com o servidor primário, a caixa postal do administrador, o serial e os timers refresh / retry / expire / minimum (RFC 1035, RFC 2308).",
  TXT: "Texto livre - usado para SPF, DKIM, verificação de domínio e mais (RFC 1035).",
  PTR: "Ponteiro - o mapeamento reverso de um endereço de volta para um nome (RFC 1035).",
  SRV: "Localizador de serviço - host e porta para um serviço nomeado, com prioridade e peso (RFC 2782).",
  CAA: "Certification Authority Authorization - quais CAs podem emitir certificados para o domínio (RFC 8659).",
  NAPTR: "Naming Authority Pointer - reescrita baseada em regex, usada por ENUM / SIP (RFC 3403).",
  SPF: "Tipo de registro SPF legado (obsoleto; SPF agora vive em TXT).",
  HTTPS: "HTTPS service binding - parâmetros de conexão (ALPN, porta, dicas de IP) para origens HTTP (RFC 9460).",
  SVCB: "Service binding geral, o pai do HTTPS (RFC 9460).",
  TLSA: "DANE - associa um certificado ou chave pública a um nome via DNSSEC (RFC 6698).",
  DNSKEY: "Chave pública DNSSEC usada para verificar assinaturas na zona (RFC 4034).",
  RRSIG: "Assinatura DNSSEC sobre um RRset, com o tipo coberto, o algoritmo, o key tag e a janela de validade (RFC 4034).",
  DS: "Delegation Signer - um hash da DNSKEY da zona filha, publicado na pai para construir a cadeia de confiança (RFC 4034).",
  NSEC: "Negação de existência autenticada - prova que um nome ou tipo não existe apontando para o próximo nome (RFC 4034).",
  NSEC3: "Negação de existência autenticada com hash - como NSEC, mas com nomes em hash para resistir à varredura da zona (RFC 5155).",
  NSEC3PARAM: "Parâmetros (hash, iterações, salt) para os registros NSEC3 da zona (RFC 5155).",
  CDS: "Cópia filha do DS que a pai deve publicar (RFC 7344).",
  CDNSKEY: "Cópia filha da DNSKEY para manutenção automatizada do DS (RFC 7344).",
};

/**
 * pt-BR labels for rdata field breakdowns, keyed by the exact English label
 * that breakdownRdata emits. Descriptive labels are translated; canonical RFC
 * field names (Serial, Refresh, Retry, Expire, Key tag, Digest, Flags,
 * Protocol) stay as-is, because that is how they appear in zone files and how
 * the audience refers to them.
 */
export const FIELD_LABELS_PT: Record<string, string> = {
  "Primary server (MNAME)": "Servidor primário (MNAME)",
  "Admin mailbox (RNAME)": "Caixa postal do administrador (RNAME)",
  "Serial": "Serial",
  "Refresh": "Refresh",
  "Retry": "Retry",
  "Expire": "Expire",
  "Minimum / negative-cache TTL": "Minimum / TTL de cache negativo",
  "Preference": "Preferência",
  "Mail exchanger": "Servidor de e-mail (exchanger)",
  "Priority": "Prioridade",
  "Weight": "Peso",
  "Port": "Porta",
  "Target": "Alvo",
  "Flags": "Flags",
  "Tag": "Tag",
  "Value": "Valor",
  "Type covered": "Tipo coberto",
  "Algorithm": "Algoritmo",
  "Labels": "Labels",
  "Original TTL": "TTL original",
  "Signature expiration": "Expiração da assinatura",
  "Signature inception": "Início da assinatura",
  "Key tag": "Key tag",
  "Signer's name": "Nome do signatário",
  "Protocol": "Protocolo",
  "Public key": "Chave pública",
  "Digest type": "Tipo de digest",
  "Digest": "Digest",
};
