// ============================================================================
// src/lib/tools/nslookup-output-explainer/meanings-pt.ts
// ----------------------------------------------------------------------------
// Brazilian Portuguese versions of the nslookup reference meanings. Same
// convention as the dig tool: protocol tokens and canonical field names stay
// in English (A, MX, SOA, serial, refresh, ...); only the explanatory prose and
// descriptive labels are translated. FIELD_LABELS_PT is keyed by the exact
// English label a field carries after parsing, so a simple lookup translates
// it, with per-key English fallback at the call site.
// ============================================================================

export const NS_TYPE_MEANINGS_PT: Record<string, string> = {
  A: "Endereço IPv4. O nslookup o imprime em uma linha Address: sob o Name: (RFC 1035).",
  AAAA: "Endereço IPv6, também mostrado em uma linha Address:; dá para distinguir pelos dois-pontos (RFC 3596).",
  MX: "Mail exchanger. O valor é um número de preferência seguido de um hostname; a menor preferência é a preferida (RFC 1035).",
  NS: "Servidor de nomes autoritativo para a zona (RFC 1035).",
  CNAME: "Nome canônico, um alias que aponta este nome para outro nome; os registros reais ficam sob o alvo (RFC 1035).",
  TXT: "Texto livre, usado para SPF, DKIM e verificação de domínio (RFC 1035).",
  PTR: "Ponteiro, o mapeamento reverso de um endereço de volta para um nome; o nslookup o imprime como name = (RFC 1035).",
  SRV: "Localizador de serviço. O valor é prioridade, peso, porta e host alvo (RFC 2782).",
  SOA: "Start of Authority, o registro do ápice da zona. O nslookup lista seus campos (origin, mail addr, serial e os timers refresh / retry / expire / minimum) um por linha (RFC 1035, RFC 2308).",
};

/**
 * pt-BR labels for the field breakdowns, keyed by the exact English label the
 * field carries after parsing (SOA fields resolved via SOA_FIELD_LABELS, and
 * the MX / SRV breakdown labels). Canonical RFC field names (Serial, Refresh,
 * Retry, Expire) stay as-is.
 */
export const FIELD_LABELS_PT: Record<string, string> = {
  "Primary server (origin)": "Servidor primário (origin)",
  "Admin mailbox (mail addr)": "Caixa postal do administrador (mail addr)",
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
};
