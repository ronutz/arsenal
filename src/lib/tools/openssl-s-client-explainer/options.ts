// ============================================================================
// src/lib/tools/openssl-s-client-explainer/options.ts
// ----------------------------------------------------------------------------
// THE OPTION TABLE of the openssl s_client explainer: every option of the
// OpenSSL 3.5 openssl-s_client(1) synopsis, with whether it takes a value, the
// group it belongs to, and our own explanation in English and Brazilian
// Portuguese. Where a page states what happens when the option is absent, that
// default is given too.
//
// Basis: OpenSSL 3.5, the long-term-support release (3.5.9, supported until
// 2030-04-08; openssl-library.org/policies/releasestrat, read 2026-10-27).
// Where each fact comes from (all read on 2026-10-27, ids as in the manifest):
//   - s_client-3.5: docs.openssl.org/3.5/man1/openssl-s_client/ (the options,
//     the SNI default, -showcerts "not a verified chain", -verify and
//     -verify_return_error, -quiet, -ign_eof, -reconnect, -starttls keywords,
//     HISTORY: -ktls 3.2, -tfo 3.2);
//   - ssl-conf-cmd-3.5: SSL_CONF_cmd(3), "SUPPORTED COMMAND LINE COMMANDS",
//     which the s_client page points to for -cipher, -ciphersuites, -groups,
//     -curves, -sigalgs, -no_ticket, -min_protocol, -max_protocol, -no_ssl3...;
//   - ssl-ctx-set1-curves-3.5: SSL_CTX_set1_groups_list(3), the key shares a
//     client sends and the DEFAULT list (with ssl/t1_lib.c at openssl-3.5.9:
//     "?*X25519MLKEM768 / ?*X25519:?secp256r1 / ...");
//   - openssl-3.5: openssl(1), "TLS Version Options" (-tls1_2 and friends);
//   - verification-options-3.5: openssl-verification-options(1), "Trusted
//     Certificate Options" and "Verification Options" (-CAfile, -CApath,
//     -verify_hostname, -verify_ip, -attime, -partial_chain, -x509_strict...);
//   - passphrase-options-3.5: openssl-passphrase-options(1) (pass:password);
//   - s_client-4.1: the 4.1 page, for the notes on what OpenSSL 4 changed;
//   - openssl-src-3.5.9: apps/s_client.c option table (which options take a
//     value; 197 options, of which only -wdebug is not on the page and is left
//     out) and apps/lib/opt.c (the -opt, --opt and --opt=value forms).
// KEPT BEYOND 3.5 (notIn35 in the rows): -ocsp_check_leaf and -ocsp_check_all,
// added in OpenSSL 3.6 (s_client-3.6, HISTORY; absent from the 3.5 page and
// from the 3.5.9 option table). A 3.5 openssl stops on them with a usage error;
// they stay so that the explainer can say so.
// The explanations are written for this site; no sentence of the manual pages
// is copied (the pages are Apache-2.0 licensed text, cited, not reproduced).
// ============================================================================

/** A text in the two authored languages. */
export interface Bilingual {
  en: string; // British English, no em dashes
  pt: string; // Brazilian Portuguese, jargon kept in English
}

/** The families the explainer groups options into, in display order. */
export type OptionGroup =
  | "target" // where to connect
  | "sni" // the server name sent in the ClientHello
  | "verify" // how the server certificate is verified
  | "trust" // which certificates are trusted
  | "protocol" // which TLS versions are offered
  | "crypto" // cipher suites, groups, signature algorithms
  | "display" // what s_client prints
  | "session" // session caching, tickets, reconnects
  | "client-auth" // the client certificate
  | "app" // STARTTLS and ALPN
  | "status" // OCSP stapling and Certificate Transparency
  | "io" // terminal and input handling
  | "dane" // DANE TLSA authentication
  | "psk" // pre-shared keys and SRP
  | "provider" // providers, engines, randomness
  | "tuning"; // record sizes, pipelines and other rarely used knobs

/** The documents an option's explanation rests on (manifest source ids). */
export type OptionDoc =
  | "s_client-3.5"
  | "s_client-3.6" // only for the two options 3.6 added
  | "ssl-conf-cmd-3.5"
  | "ssl-ctx-set1-curves-3.5"
  | "openssl-3.5"
  | "verification-options-3.5"
  | "passphrase-options-3.5";

/** One row of the option table. */
export interface OptionInfo {
  name: string; // the canonical spelling, with its single dash, e.g. "-connect"
  arg: string | null; // the value's placeholder as the page writes it, or null for a flag
  group: OptionGroup; // where it is shown
  text: Bilingual; // what it does
  dflt?: Bilingual; // what happens when it is absent, when a page states it
  doc: OptionDoc; // the page the explanation rests on
  since?: string; // the OpenSSL release that added it, when HISTORY says so
  deprecated?: boolean; // the page marks it deprecated
  notIn35?: boolean; // not on the OpenSSL 3.5 page: added in a later release (see since)
}

/** Shorthand used by the table below: one option per line. */
function o(name: string, arg: string | null, group: OptionGroup, doc: OptionDoc, en: string, pt: string, extra?: Partial<OptionInfo>): OptionInfo {
  return { name, arg, group, doc, text: { en, pt }, ...extra }; // a frozen-shaped row
}

/** Every option the explainer knows, in the order the explainer lists them inside a group. */
export const OPTIONS: readonly OptionInfo[] = Object.freeze([
  // ---- target: where s_client connects ---------------------------------------------------------------------------
  o("-connect", "host:port", "target", "s_client-3.5",
    "The host and port to connect to. An IPv6 address goes in square brackets, as in [2001:db8::1]:443. The same target may instead be given as the last word of the command, without an option name.",
    "O host e a porta de destino. Um endereço IPv6 vai entre colchetes, como em [2001:db8::1]:443. O mesmo destino pode vir como a última palavra do comando, sem nome de opção.",
    { dflt: { en: "With neither -connect nor a target word, s_client connects to the local host on port 4433.", pt: "Sem -connect e sem destino no fim do comando, o s_client conecta no host local, porta 4433." } }), // -connect
  o("-host", "hostname", "target", "s_client-3.5", "The host to connect to; the page says to use -connect instead.", "O host de destino; a página manda usar -connect no lugar.", { deprecated: true }), // -host
  o("-port", "port", "target", "s_client-3.5", "The port to connect to; the page says to use -connect instead.", "A porta de destino; a página manda usar -connect no lugar.", { deprecated: true }), // -port
  o("-bind", "host:port", "target", "s_client-3.5", "The local address and/or port the connection leaves from, useful when a server or firewall only accepts connections from a given source.", "O endereço e/ou a porta local de onde a conexão sai, útil quando o servidor ou um firewall só aceita conexões de uma origem específica."), // -bind
  o("-proxy", "host:port", "target", "s_client-3.5", "Connect through an HTTP proxy: s_client sends HTTP CONNECT to this proxy for the -connect target, then runs TLS inside the tunnel.", "Conecta através de um proxy HTTP: o s_client manda HTTP CONNECT a este proxy para o destino do -connect e faz o TLS dentro do túnel."), // -proxy
  o("-proxy_user", "userid", "target", "s_client-3.5", "The user name for Basic authentication to the proxy. The page warns that Basic authentication travels as reversible base64 before any TLS is set up.", "O usuário para autenticação Basic no proxy. A página avisa que a autenticação Basic vai em base64 reversível, antes de qualquer TLS."), // -proxy_user
  o("-proxy_pass", "arg", "target", "s_client-3.5", "Where the proxy password comes from, in the pass phrase syntax of openssl-passphrase-options(1) (pass:, env:, file:, fd:, stdin).", "De onde vem a senha do proxy, na sintaxe de openssl-passphrase-options(1) (pass:, env:, file:, fd:, stdin)."), // -proxy_pass
  o("-unix", "path", "target", "s_client-3.5", "Connect over a Unix-domain socket instead of TCP.", "Conecta por um socket Unix em vez de TCP."), // -unix
  o("-4", null, "target", "s_client-3.5", "Use IPv4 only.", "Usa só IPv4."), // -4
  o("-6", null, "target", "s_client-3.5", "Use IPv6 only.", "Usa só IPv6."), // -6
  o("-quic", null, "target", "s_client-3.5", "Connect with QUIC instead of TLS over TCP; the page requires -alpn as well.", "Conecta com QUIC em vez de TLS sobre TCP; a página exige também -alpn."), // -quic
  o("-tfo", null, "target", "s_client-3.5", "Open the connection with TCP Fast Open (RFC 7413).", "Abre a conexão com TCP Fast Open (RFC 7413).", { since: "3.2" }), // -tfo
  o("-mtu", "size", "target", "s_client-3.5", "Set the link MTU (used with DTLS).", "Define o MTU do enlace (usado com DTLS)."), // -mtu
  o("-sctp", null, "target", "s_client-3.5", "Use SCTP instead of UDP for DTLS; needs -dtls, -dtls1 or -dtls1_2 and an OpenSSL built with SCTP.", "Usa SCTP em vez de UDP para DTLS; exige -dtls, -dtls1 ou -dtls1_2 e um OpenSSL compilado com SCTP."), // -sctp
  o("-sctp_label_bug", null, "target", "s_client-3.5", "Reproduce an old OpenSSL bug in DTLS/SCTP key labels, to talk to old broken peers; needs -sctp.", "Reproduz um bug antigo do OpenSSL nos labels de chave do DTLS/SCTP, para falar com peers antigos; exige -sctp."), // -sctp_label_bug

  // ---- sni: the name in the ClientHello -------------------------------------------------------------------------
  o("-servername", "name", "sni", "s_client-3.5",
    "The name sent in the Server Name Indication (SNI) extension of the ClientHello, which tells a server hosting several sites which certificate to present. Whatever you give is sent, even an IP address. It does not make s_client check the certificate against that name: that takes -verify_hostname.",
    "O nome enviado na extensão Server Name Indication (SNI) do ClientHello, que diz a um servidor com vários sites qual certificado apresentar. O que você passar é enviado, até um endereço IP. Isso não faz o s_client conferir o certificado contra esse nome: para isso é preciso -verify_hostname.",
    { dflt: { en: "Without -servername, OpenSSL 1.1.1 and later send the -connect host as SNI when it looks like a DNS name, send nothing when it is an IP address, and send \"localhost\" when there is no -connect either.", pt: "Sem -servername, o OpenSSL 1.1.1 em diante envia como SNI o host do -connect quando ele tem forma de nome DNS, não envia nada quando é um endereço IP, e envia \"localhost\" quando também não há -connect." } }), // -servername
  o("-noservername", null, "sni", "s_client-3.5", "Send no SNI extension at all. It cannot be combined with -servername or -dane_tlsa_domain.", "Não envia extensão SNI nenhuma. Não pode ser combinada com -servername nem com -dane_tlsa_domain."), // -noservername

  // ---- verify: how the server certificate is checked ------------------------------------------------------------
  o("-verify", "depth", "verify", "s_client-3.5",
    "Turn on server certificate verification with a maximum chain depth. Errors are printed and the handshake carries on, so every problem in the chain shows; the connection never fails because of them unless -verify_return_error is also given.",
    "Liga a verificação do certificado do servidor com uma profundidade máxima de cadeia. Os erros são impressos e o handshake continua, para que todos os problemas da cadeia apareçam; a conexão nunca falha por causa deles, a não ser com -verify_return_error.",
    { dflt: { en: "Without it the chain is still checked and the result printed (the \"Verify return code\" line), but the handshake goes on whatever the result.", pt: "Sem ela a cadeia ainda é verificada e o resultado impresso (a linha \"Verify return code\"), mas o handshake segue qualquer que seja o resultado." } }), // -verify
  o("-verify_return_error", null, "verify", "s_client-3.5",
    "Verify the server certificate and abort the handshake on the first verification error, the way a real client should behave.",
    "Verifica o certificado do servidor e aborta o handshake no primeiro erro de verificação, como um cliente de verdade deveria fazer.",
    { dflt: { en: "Without it s_client accepts any chain, trusted or not, and keeps going; the page warns that a real application doing this would be open to a man-in-the-middle.", pt: "Sem ela o s_client aceita qualquer cadeia, confiável ou não, e segue em frente; a página avisa que uma aplicação de verdade que fizesse isso estaria exposta a man-in-the-middle." } }), // -verify_return_error
  o("-verify_quiet", null, "verify", "s_client-3.5", "Print only verification errors, not every depth=... line.", "Imprime só os erros de verificação, não cada linha depth=..."), // -verify_quiet
  o("-verify_hostname", "hostname", "verify", "verification-options-3.5",
    "Check that the certificate is valid for this host name, against the DNS names in Subject Alternative Name or the subject Common Name. A mismatch is verify error 62, hostname mismatch; a match prints \"Verified peername\".",
    "Confere se o certificado vale para este hostname, contra os nomes DNS do Subject Alternative Name ou o Common Name do subject. Se não confere, é o erro de verificação 62, hostname mismatch; se confere, sai a linha \"Verified peername\".",
    { dflt: { en: "Without it (or -verify_ip, -verify_email, or DANE with -dane_tlsa_domain), s_client never compares the certificate with any name: not even the -servername or -connect host.", pt: "Sem ela (ou -verify_ip, -verify_email, ou DANE com -dane_tlsa_domain), o s_client nunca compara o certificado com nome algum: nem com o -servername, nem com o host do -connect." } }), // -verify_hostname
  o("-verify_ip", "ip", "verify", "verification-options-3.5", "Check that the certificate carries this IP address in its Subject Alternative Name. A mismatch is verify error 64.", "Confere se o certificado traz este endereço IP no Subject Alternative Name. Uma divergência é o erro de verificação 64."), // -verify_ip
  o("-verify_email", "email", "verify", "verification-options-3.5", "Check that the certificate carries this e-mail address, in Subject Alternative Name or the subject. A mismatch is verify error 63.", "Confere se o certificado traz este endereço de e-mail, no Subject Alternative Name ou no subject. Uma divergência é o erro de verificação 63."), // -verify_email
  o("-verify_depth", "num", "verify", "verification-options-3.5", "Limit the chain to this many intermediate CAs; neither the leaf nor the trust anchor counts, so the longest chain has num+2 certificates.", "Limita a cadeia a esse número de CAs intermediárias; nem o leaf nem a âncora de confiança contam, então a cadeia mais longa tem num+2 certificados."), // -verify_depth
  o("-verify_name", "name", "verify", "verification-options-3.5", "Use a named set of verification parameters (ssl_client, ssl_server, smime_sign, code_sign, default).", "Usa um conjunto nomeado de parâmetros de verificação (ssl_client, ssl_server, smime_sign, code_sign, default)."), // -verify_name
  o("-purpose", "purpose", "verify", "verification-options-3.5", "The use the leaf certificate must suit. s_client already checks sslserver by default when verification is on.", "O uso a que o certificado leaf precisa servir. O s_client já confere sslserver por padrão quando a verificação está ligada."), // -purpose
  o("-attime", "timestamp", "verify", "verification-options-3.5", "Verify as if the clock read this time, given in seconds since 1970 (Unix time): handy to see whether a chain will still validate on a given day.", "Verifica como se o relógio marcasse este instante, em segundos desde 1970 (Unix time): útil para ver se uma cadeia ainda vai validar em determinado dia."), // -attime
  o("-no_check_time", null, "verify", "verification-options-3.5", "Do not check certificate and CRL validity dates against the current time (unless -attime is given).", "Não confere as datas de validade de certificados e CRLs contra a hora atual (a menos que haja -attime)."), // -no_check_time
  o("-partial_chain", null, "verify", "verification-options-3.5", "Accept a chain that ends at any certificate in the trust store, an intermediate included, not only at a self-signed root.", "Aceita uma cadeia que termine em qualquer certificado do trust store, inclusive uma intermediária, não só numa raiz auto-assinada."), // -partial_chain
  o("-x509_strict", null, "verify", "verification-options-3.5", "Refuse certificates that break RFC 5280 rules OpenSSL otherwise tolerates (CA basicConstraints not critical, no keyUsage on a CA, missing key identifiers, and more), reported as verify errors such as 89 and 92.", "Recusa certificados que violam regras da RFC 5280 que o OpenSSL normalmente tolera (basicConstraints de CA não crítico, CA sem keyUsage, identificadores de chave ausentes e mais), relatados como erros de verificação como o 89 e o 92."), // -x509_strict
  o("-auth_level", "num", "verify", "verification-options-3.5", "The security level for the chain's keys and signatures (see SSL_CTX_set_security_level(3)); at 0 or lower every algorithm is accepted.", "O nível de segurança para as chaves e assinaturas da cadeia (veja SSL_CTX_set_security_level(3)); em 0 ou menos todo algoritmo é aceito."), // -auth_level
  o("-crl_check", null, "verify", "verification-options-3.5", "Check the leaf against a CRL; with no valid CRL available it is an error.", "Confere o leaf contra uma CRL; sem CRL válida disponível, é erro."), // -crl_check
  o("-crl_check_all", null, "verify", "verification-options-3.5", "Check every certificate in the chain against CRLs.", "Confere todos os certificados da cadeia contra CRLs."), // -crl_check_all
  o("-CRL", "filename", "verify", "s_client-3.5", "A CRL file to check the server certificate with.", "Um arquivo de CRL para conferir o certificado do servidor."), // -CRL
  o("-CRLform", "DER|PEM", "verify", "s_client-3.5", "The format of the -CRL file.", "O formato do arquivo do -CRL."), // -CRLform
  o("-crl_download", null, "verify", "s_client-3.5", "Download CRLs from the certificates' distribution points. The page says it is ignored without -crl_check.", "Baixa CRLs dos distribution points dos certificados. A página diz que é ignorada sem -crl_check."), // -crl_download
  o("-use_deltas", null, "verify", "verification-options-3.5", "Allow delta CRLs.", "Permite CRLs delta."), // -use_deltas
  o("-extended_crl", null, "verify", "verification-options-3.5", "Allow indirect CRLs and alternate CRL signing keys.", "Permite CRLs indiretas e chaves alternativas de assinatura de CRL."), // -extended_crl
  o("-ignore_critical", null, "verify", "verification-options-3.5", "Ignore unknown critical extensions instead of rejecting the certificate as RFC 5280 requires.", "Ignora extensões críticas desconhecidas em vez de rejeitar o certificado como a RFC 5280 exige."), // -ignore_critical
  o("-check_ss_sig", null, "verify", "verification-options-3.5", "Also verify the signature of the self-signed certificate at the top of the chain, which is off by default because it adds no security.", "Verifica também a assinatura do certificado auto-assinado no topo da cadeia, desligado por padrão porque não acrescenta segurança."), // -check_ss_sig
  o("-allow_proxy_certs", null, "verify", "verification-options-3.5", "Allow proxy certificates in the chain.", "Permite proxy certificates na cadeia."), // -allow_proxy_certs
  o("-policy", "arg", "verify", "verification-options-3.5", "Turn on certificate policy processing and add this policy to the acceptable set (RFC 5280).", "Liga o processamento de políticas de certificado e acrescenta esta política ao conjunto aceito (RFC 5280)."), // -policy
  o("-policy_check", null, "verify", "verification-options-3.5", "Turn on certificate policy processing.", "Liga o processamento de políticas de certificado."), // -policy_check
  o("-policy_print", null, "verify", "verification-options-3.5", "Print policy processing diagnostics.", "Imprime diagnósticos do processamento de políticas."), // -policy_print
  o("-explicit_policy", null, "verify", "verification-options-3.5", "Require an explicit policy (RFC 5280 require-explicit-policy).", "Exige política explícita (require-explicit-policy da RFC 5280)."), // -explicit_policy
  o("-inhibit_any", null, "verify", "verification-options-3.5", "Set inhibit-any-policy (RFC 5280).", "Define inhibit-any-policy (RFC 5280)."), // -inhibit_any
  o("-inhibit_map", null, "verify", "verification-options-3.5", "Set inhibit-policy-mapping (RFC 5280).", "Define inhibit-policy-mapping (RFC 5280)."), // -inhibit_map
  o("-suiteB_128", null, "verify", "verification-options-3.5", "Suite B mode at the 128-bit or 192-bit level (RFC 6460): ECDSA with P-256 or P-384 and SHA-256 or SHA-384 only.", "Modo Suite B no nível de 128 ou 192 bits (RFC 6460): só ECDSA com P-256 ou P-384 e SHA-256 ou SHA-384."), // -suiteB_128
  o("-suiteB_128_only", null, "verify", "verification-options-3.5", "Suite B mode at the 128-bit level only (RFC 6460).", "Modo Suite B só no nível de 128 bits (RFC 6460)."), // -suiteB_128_only
  o("-suiteB_192", null, "verify", "verification-options-3.5", "Suite B mode at the 192-bit level (RFC 6460).", "Modo Suite B no nível de 192 bits (RFC 6460)."), // -suiteB_192
  o("-trusted_first", null, "verify", "verification-options-3.5", "Prefer trusted certificates when building the chain. Always on since OpenSSL 1.1.0, so it changes nothing.", "Prefere certificados confiáveis ao montar a cadeia. Sempre ligada desde o OpenSSL 1.1.0, então não muda nada."), // -trusted_first
  o("-no_alt_chains", null, "verify", "verification-options-3.5", "Has no effect since OpenSSL 1.1.0.", "Sem efeito desde o OpenSSL 1.1.0."), // -no_alt_chains
  o("-issuer_checks", null, "verify", "verification-options-3.5", "Ignored.", "Ignorada."), // -issuer_checks
  o("-xkey", "infile", "verify", "verification-options-3.5", "Extended verification options (-xkey, -xcert, -xchain, -xchain_build, -xcertform, -xkeyform): supply extra certificate and key material so an alternative chain can be built.", "Opções de verificação estendida (-xkey, -xcert, -xchain, -xchain_build, -xcertform, -xkeyform): fornecem certificados e chaves extras para montar uma cadeia alternativa."), // -xkey
  o("-xcert", "file", "verify", "verification-options-3.5", "Extended verification: an extra certificate (see -xkey).", "Verificação estendida: um certificado extra (veja -xkey)."), // -xcert
  o("-xchain", "file", "verify", "verification-options-3.5", "Extended verification: an extra chain (see -xkey).", "Verificação estendida: uma cadeia extra (veja -xkey)."), // -xchain
  o("-xchain_build", null, "verify", "verification-options-3.5", "Extended verification: build the chain for the extra certificate (see -xkey).", "Verificação estendida: monta a cadeia do certificado extra (veja -xkey)."), // -xchain_build
  o("-xcertform", "DER|PEM", "verify", "verification-options-3.5", "Extended verification: the format of -xcert.", "Verificação estendida: o formato do -xcert."), // -xcertform
  o("-xkeyform", "DER|PEM", "verify", "verification-options-3.5", "Extended verification: the format of -xkey.", "Verificação estendida: o formato do -xkey."), // -xkeyform

  // ---- trust: which certificates are trust anchors -------------------------------------------------------------
  o("-CAfile", "file", "trust", "verification-options-3.5",
    "A file of trusted CA certificates (one in DER, or several in PEM) used as trust anchors when verifying the server.",
    "Um arquivo de certificados de CA confiáveis (um em DER, ou vários em PEM) usados como âncoras de confiança na verificação do servidor.",
    { dflt: { en: "Without -CAfile, -CApath or -CAstore, the default trust store is used. OpenSSL itself ships no trust anchors; many Linux distributions configure their system store as the default.", pt: "Sem -CAfile, -CApath ou -CAstore, vale o trust store padrão. O OpenSSL em si não traz âncoras de confiança; muitas distribuições Linux configuram o store do sistema como padrão." } }), // -CAfile
  o("-CApath", "dir", "trust", "verification-options-3.5", "A directory of trusted CA certificates, each file named by the hash of its subject name (see openssl-rehash(1)).", "Um diretório de certificados de CA confiáveis, cada arquivo nomeado pelo hash do subject (veja openssl-rehash(1))."), // -CApath
  o("-CAstore", "uri", "trust", "verification-options-3.5", "A URI of a store of trusted CA certificates.", "A URI de um store de certificados de CA confiáveis."), // -CAstore
  o("-no-CAfile", null, "trust", "verification-options-3.5", "Do not load the default file of trusted certificates.", "Não carrega o arquivo padrão de certificados confiáveis."), // -no-CAfile
  o("-no-CApath", null, "trust", "verification-options-3.5", "Do not use the default directory of trusted certificates.", "Não usa o diretório padrão de certificados confiáveis."), // -no-CApath
  o("-no-CAstore", null, "trust", "verification-options-3.5", "Do not use the default store of trusted certificates.", "Não usa o store padrão de certificados confiáveis."), // -no-CAstore
  o("-verifyCAfile", "filename", "trust", "s_client-3.5", "A PEM file of trusted certificates for verifying the server only. When any -verifyCA* option is given, its store replaces the -CAfile/-CApath/-CAstore store for that check.", "Um arquivo PEM de certificados confiáveis só para verificar o servidor. Quando há qualquer opção -verifyCA*, o store dela substitui o de -CAfile/-CApath/-CAstore nessa verificação."), // -verifyCAfile
  o("-verifyCApath", "dir", "trust", "s_client-3.5", "A hashed directory of trusted certificates for verifying the server only (see -verifyCAfile).", "Um diretório com hash de certificados confiáveis só para verificar o servidor (veja -verifyCAfile)."), // -verifyCApath
  o("-verifyCAstore", "uri", "trust", "s_client-3.5", "A store URI of trusted certificates for verifying the server only (see -verifyCAfile).", "A URI de um store de certificados confiáveis só para verificar o servidor (veja -verifyCAfile)."), // -verifyCAstore
  o("-chainCAfile", "file", "trust", "s_client-3.5", "Trusted certificates used to build the chain of your own client certificate.", "Certificados confiáveis usados para montar a cadeia do seu próprio certificado de cliente."), // -chainCAfile
  o("-chainCApath", "directory", "trust", "s_client-3.5", "A hashed directory used to build the client certificate chain.", "Um diretório com hash usado para montar a cadeia do certificado de cliente."), // -chainCApath
  o("-chainCAstore", "uri", "trust", "s_client-3.5", "A store URI used to build the client certificate chain.", "A URI de um store usado para montar a cadeia do certificado de cliente."), // -chainCAstore
  o("-requestCAfile", "file", "trust", "s_client-3.5", "Send the subject names of these certificates to the server in the certificate_authorities extension (TLS 1.3 only).", "Envia ao servidor os subjects destes certificados na extensão certificate_authorities (só TLS 1.3)."), // -requestCAfile

  // ---- protocol: which TLS versions -----------------------------------------------------------------------------
  o("-tls1_3", null, "protocol", "openssl-3.5", "Offer and accept TLS 1.3 only.", "Oferece e aceita só TLS 1.3.",
    { dflt: { en: "Without a version option the client offers every version it supports, from the lowest to the highest, and the server picks.", pt: "Sem opção de versão, o cliente oferece todas as versões que suporta, da menor à maior, e o servidor escolhe." } }), // -tls1_3
  o("-tls1_2", null, "protocol", "openssl-3.5", "Offer and accept TLS 1.2 only. Only one version option of this kind may be given, and not together with the -no_* options.", "Oferece e aceita só TLS 1.2. Só pode haver uma opção de versão desse tipo, e não junto com as opções -no_*."), // -tls1_2
  o("-tls1_1", null, "protocol", "openssl-3.5", "Offer and accept TLS 1.1 only. TLS 1.1 is deprecated (RFC 8996) and disabled from security level 1 up.", "Oferece e aceita só TLS 1.1. O TLS 1.1 está depreciado (RFC 8996) e desligado a partir do nível de segurança 1."), // -tls1_1
  o("-tls1", null, "protocol", "openssl-3.5", "Offer and accept TLS 1.0 only. TLS 1.0 is deprecated (RFC 8996) and disabled from security level 1 up.", "Oferece e aceita só TLS 1.0. O TLS 1.0 está depreciado (RFC 8996) e desligado a partir do nível de segurança 1."), // -tls1
  o("-ssl3", null, "protocol", "openssl-3.5", "Offer and accept SSL 3.0 only, if the build still has it. The OpenSSL 4.1 page no longer lists this option.", "Oferece e aceita só SSL 3.0, se a compilação ainda tiver. A página do OpenSSL 4.1 não lista mais esta opção."), // -ssl3
  o("-no_tls1_3", null, "protocol", "ssl-conf-cmd-3.5", "Do not offer TLS 1.3. The -no_* options are deprecated in favour of -min_protocol and -max_protocol.", "Não oferece TLS 1.3. As opções -no_* estão depreciadas em favor de -min_protocol e -max_protocol.", { deprecated: true }), // -no_tls1_3
  o("-no_tls1_2", null, "protocol", "ssl-conf-cmd-3.5", "Do not offer TLS 1.2 (deprecated; use -min_protocol/-max_protocol).", "Não oferece TLS 1.2 (depreciada; use -min_protocol/-max_protocol).", { deprecated: true }), // -no_tls1_2
  o("-no_tls1_1", null, "protocol", "ssl-conf-cmd-3.5", "Do not offer TLS 1.1 (deprecated; use -min_protocol/-max_protocol).", "Não oferece TLS 1.1 (depreciada; use -min_protocol/-max_protocol).", { deprecated: true }), // -no_tls1_1
  o("-no_tls1", null, "protocol", "ssl-conf-cmd-3.5", "Do not offer TLS 1.0 (deprecated; use -min_protocol/-max_protocol).", "Não oferece TLS 1.0 (depreciada; use -min_protocol/-max_protocol).", { deprecated: true }), // -no_tls1
  o("-no_ssl3", null, "protocol", "ssl-conf-cmd-3.5", "Do not offer SSL 3.0 (deprecated; use -min_protocol/-max_protocol).", "Não oferece SSL 3.0 (depreciada; use -min_protocol/-max_protocol).", { deprecated: true }), // -no_ssl3
  o("-min_protocol", "minprot", "protocol", "ssl-conf-cmd-3.5", "The lowest version allowed: SSLv3, TLSv1, TLSv1.1, TLSv1.2, TLSv1.3 (DTLSv1, DTLSv1.2 for DTLS), or None.", "A menor versão permitida: SSLv3, TLSv1, TLSv1.1, TLSv1.2, TLSv1.3 (DTLSv1, DTLSv1.2 para DTLS) ou None."), // -min_protocol
  o("-max_protocol", "maxprot", "protocol", "ssl-conf-cmd-3.5", "The highest version allowed, with the same values as -min_protocol.", "A maior versão permitida, com os mesmos valores do -min_protocol."), // -max_protocol
  o("-dtls", null, "protocol", "openssl-3.5", "Use DTLS (over UDP) instead of TLS and negotiate any DTLS version.", "Usa DTLS (sobre UDP) em vez de TLS e negocia qualquer versão de DTLS."), // -dtls
  o("-dtls1", null, "protocol", "openssl-3.5", "Use DTLS 1.0 only.", "Usa só DTLS 1.0."), // -dtls1
  o("-dtls1_2", null, "protocol", "openssl-3.5", "Use DTLS 1.2 only.", "Usa só DTLS 1.2."), // -dtls1_2
  o("-fallback_scsv", null, "protocol", "s_client-3.5", "Put the TLS_FALLBACK_SCSV signalling value in the ClientHello.", "Coloca o valor de sinalização TLS_FALLBACK_SCSV no ClientHello."), // -fallback_scsv

  // ---- crypto: cipher suites, groups, signature algorithms ------------------------------------------------------
  o("-cipher", "ciphers", "crypto", "ssl-conf-cmd-3.5",
    "The cipher list for TLS 1.2 and below, in OpenSSL cipher-string syntax (see openssl-ciphers(1)). It does not touch TLS 1.3 suites, which -ciphersuites sets; the two lists are combined.",
    "A lista de ciphers para TLS 1.2 e anteriores, na sintaxe de cipher string do OpenSSL (veja openssl-ciphers(1)). Ela não mexe nas suites do TLS 1.3, que o -ciphersuites define; as duas listas são combinadas."), // -cipher
  o("-ciphersuites", "1.3ciphers", "crypto", "ssl-conf-cmd-3.5",
    "The TLS 1.3 cipher suites, a colon-separated list of names (TLS_AES_128_GCM_SHA256 and the like) in order of preference.",
    "As cipher suites do TLS 1.3, uma lista separada por dois-pontos (TLS_AES_128_GCM_SHA256 e afins) em ordem de preferência."), // -ciphersuites
  o("-groups", "groups", "crypto", "ssl-ctx-set1-curves-3.5",
    "The key-exchange groups the client supports, colon-separated, most preferred first, by their IANA names (X25519, secp256r1, X25519MLKEM768...). With a plain list the TLS 1.3 ClientHello carries one key share, for the first group; when some names carry a * prefix, it carries key shares for exactly those groups (at most four).",
    "Os groups de troca de chaves que o cliente suporta, separados por dois-pontos, o preferido primeiro, pelos nomes IANA (X25519, secp256r1, X25519MLKEM768...). Com uma lista simples, o ClientHello do TLS 1.3 leva um key share, do primeiro group; quando alguns nomes levam o prefixo *, ele leva key shares exatamente para esses groups (no máximo quatro).",
    { dflt: { en: "Without it the built-in DEFAULT list is used. In OpenSSL 3.5 it starts with the hybrid post-quantum X25519MLKEM768, and the ClientHello carries two key shares, X25519MLKEM768 and X25519.", pt: "Sem ela vale a lista DEFAULT embutida. No OpenSSL 3.5 ela começa pelo híbrido pós-quântico X25519MLKEM768, e o ClientHello leva dois key shares, X25519MLKEM768 e X25519." } }), // -groups
  o("-curves", "curves", "crypto", "ssl-conf-cmd-3.5", "Another name for -groups.", "Outro nome do -groups."), // -curves
  o("-named_curve", "curve", "crypto", "ssl-conf-cmd-3.5", "The ECDHE curve for TLS 1.0 and 1.1 only; the page recommends leaving it at auto.", "A curva ECDHE só para TLS 1.0 e 1.1; a página recomenda deixar em auto."), // -named_curve
  o("-sigalgs", "algs", "crypto", "ssl-conf-cmd-3.5",
    "The signature algorithms the client accepts for TLS 1.2 and 1.3, colon-separated, as algorithm+hash (RSA+SHA256) or scheme names (ecdsa_secp256r1_sha256, rsa_pss_pss_sha256, ed25519). PKCS#1 v1.5 entries are ignored in TLS 1.3.",
    "Os algoritmos de assinatura que o cliente aceita no TLS 1.2 e 1.3, separados por dois-pontos, como algoritmo+hash (RSA+SHA256) ou nomes de scheme (ecdsa_secp256r1_sha256, rsa_pss_pss_sha256, ed25519). Entradas PKCS#1 v1.5 são ignoradas no TLS 1.3.",
    { dflt: { en: "Without it every signature algorithm of the active providers is allowed.", pt: "Sem ela, todo algoritmo de assinatura dos providers ativos é permitido." } }), // -sigalgs
  o("-client_sigalgs", "algs", "crypto", "ssl-conf-cmd-3.5", "The signature algorithms for the client's own certificate; no effect when the server asks for none. Defaults to -sigalgs.", "Os algoritmos de assinatura para o certificado do próprio cliente; sem efeito quando o servidor não pede certificado. O padrão é o -sigalgs."), // -client_sigalgs
  o("-no_etm", null, "crypto", "ssl-conf-cmd-3.5", "Do not use the encrypt-then-mac extension, which is on by default (it matters for CBC suites, RFC 7366).", "Não usa a extensão encrypt-then-mac, ligada por padrão (ela importa para suites CBC, RFC 7366)."), // -no_etm
  o("-no_ems", null, "crypto", "s_client-3.5", "Do not negotiate the extended master secret (RFC 7627, now called extended main secret).", "Não negocia o extended master secret (RFC 7627, agora chamado extended main secret)."), // -no_ems
  o("-comp", null, "crypto", "ssl-conf-cmd-3.5", "Allow TLS compression. Off by default since OpenSSL 1.1.0, and only usable at security level 1 or lower.", "Permite compressão TLS. Desligada por padrão desde o OpenSSL 1.1.0, e só utilizável no nível de segurança 1 ou menor."), // -comp
  o("-no_comp", null, "crypto", "ssl-conf-cmd-3.5", "Disable TLS compression (already the default).", "Desliga a compressão TLS (já é o padrão)."), // -no_comp
  o("-bugs", null, "crypto", "ssl-conf-cmd-3.5", "Turn on OpenSSL's workarounds for known bugs in other implementations.", "Liga os contornos do OpenSSL para bugs conhecidos de outras implementações."), // -bugs
  o("-serverpref", null, "crypto", "ssl-conf-cmd-3.5", "Server-side option (prefer the server's order); no effect in a client.", "Opção de servidor (preferir a ordem do servidor); sem efeito num cliente."), // -serverpref
  o("-prioritize_chacha", null, "crypto", "ssl-conf-cmd-3.5", "Server-side option; no effect in a client.", "Opção de servidor; sem efeito num cliente."), // -prioritize_chacha
  o("-allow_no_dhe_kex", null, "crypto", "ssl-conf-cmd-3.5", "In TLS 1.3, allow resumption without a fresh (EC)DHE exchange, which gives up forward secrecy for the resumed session.", "No TLS 1.3, permite retomada sem nova troca (EC)DHE, o que abre mão de forward secrecy na sessão retomada."), // -allow_no_dhe_kex
  o("-prefer_no_dhe_kex", null, "crypto", "ssl-conf-cmd-3.5", "Server-side option; no effect in a client.", "Opção de servidor; sem efeito num cliente."), // -prefer_no_dhe_kex
  o("-strict", null, "crypto", "ssl-conf-cmd-3.5", "Strict protocol handling (SSL_CERT_FLAG_TLS_STRICT).", "Tratamento estrito do protocolo (SSL_CERT_FLAG_TLS_STRICT)."), // -strict
  o("-record_padding", "padding", "crypto", "ssl-conf-cmd-3.5", "Pad TLS 1.3 records to a multiple of this many bytes (number[,number]).", "Preenche os records do TLS 1.3 até um múltiplo desse número de bytes (number[,number])."), // -record_padding
  o("-no_middlebox", null, "crypto", "ssl-conf-cmd-3.5", "Turn off TLS 1.3 middlebox compatibility, which is on by default and sends dummy ChangeCipherSpec messages so TLS 1.3 looks more like TLS 1.2 to middleboxes.", "Desliga a compatibilidade com middleboxes do TLS 1.3, ligada por padrão, que envia mensagens ChangeCipherSpec falsas para o TLS 1.3 parecer mais com TLS 1.2 aos olhos de middleboxes."), // -no_middlebox
  o("-debug_broken_protocol", null, "crypto", "ssl-conf-cmd-3.5", "Ignored.", "Ignorada."), // -debug_broken_protocol
  o("-legacy_renegotiation", null, "crypto", "ssl-conf-cmd-3.5", "Permit unsafe legacy renegotiation (without RFC 5746).", "Permite a renegociação legada insegura (sem RFC 5746)."), // -legacy_renegotiation
  o("-legacy_server_connect", null, "crypto", "ssl-conf-cmd-3.5", "Permit connecting to servers that only support unsafe legacy renegotiation.", "Permite conectar a servidores que só suportam a renegociação legada insegura."), // -legacy_server_connect
  o("-no_legacy_server_connect", null, "crypto", "ssl-conf-cmd-3.5", "Refuse servers that only support unsafe legacy renegotiation.", "Recusa servidores que só suportam a renegociação legada insegura."), // -no_legacy_server_connect
  o("-no_renegotiation", null, "crypto", "ssl-conf-cmd-3.5", "Disable renegotiation in TLS 1.2 and earlier.", "Desliga a renegociação no TLS 1.2 e anteriores."), // -no_renegotiation
  o("-client_renegotiation", null, "crypto", "ssl-conf-cmd-3.5", "Server-side option; no effect in a client.", "Opção de servidor; sem efeito num cliente."), // -client_renegotiation
  o("-no_resumption_on_reneg", null, "crypto", "ssl-conf-cmd-3.5", "Server-side option; no effect in a client.", "Opção de servidor; sem efeito num cliente."), // -no_resumption_on_reneg
  o("-no_tx_cert_comp", null, "crypto", "s_client-3.5", "Do not send compressed certificates in TLS 1.3.", "Não envia certificados comprimidos no TLS 1.3.", { since: "3.2" }), // -no_tx_cert_comp
  o("-no_rx_cert_comp", null, "crypto", "s_client-3.5", "Do not accept compressed certificates in TLS 1.3.", "Não aceita certificados comprimidos no TLS 1.3.", { since: "3.2" }), // -no_rx_cert_comp
  o("-enable_server_rpk", null, "crypto", "s_client-3.5", "Accept a raw public key (RFC 7250) from the server instead of an X.509 certificate.", "Aceita uma raw public key (RFC 7250) do servidor em vez de um certificado X.509.", { since: "3.2" }), // -enable_server_rpk
  o("-enable_client_rpk", null, "crypto", "s_client-3.5", "Offer to send a raw public key (RFC 7250) as the client credential.", "Oferece enviar uma raw public key (RFC 7250) como credencial do cliente.", { since: "3.2" }), // -enable_client_rpk

  // ---- display: what gets printed ------------------------------------------------------------------------------
  o("-showcerts", null, "display", "s_client-3.5",
    "Print every certificate the server sent, in PEM, in the order it sent them. It is the list as sent, not a verified chain: a missing intermediate stays missing and a stray extra one shows up.",
    "Imprime todos os certificados que o servidor enviou, em PEM, na ordem em que vieram. É a lista como enviada, não uma cadeia verificada: uma intermediária ausente continua ausente e uma sobrando aparece.",
    { dflt: { en: "Without it the chain is listed by subject and issuer, and only the server's own certificate is printed in PEM.", pt: "Sem ela a cadeia aparece por subject e issuer, e só o certificado do próprio servidor sai em PEM." } }), // -showcerts
  o("-brief", null, "display", "s_client-3.5", "Print a short summary (protocol version, cipher suite, peer certificate, verification) instead of the full report. In the source it also quiets the verify lines down to errors.", "Imprime um resumo curto (versão do protocolo, cipher suite, certificado do peer, verificação) em vez do relatório completo. No código-fonte ela também reduz as linhas de verificação aos erros."), // -brief
  o("-quiet", null, "display", "s_client-3.5", "Print no session or certificate information; it also turns on -ign_eof and -nocommands.", "Não imprime informação de sessão nem de certificado; também liga -ign_eof e -nocommands."), // -quiet
  o("-msg", null, "display", "s_client-3.5", "Print every protocol message as it goes by (ClientHello, ServerHello, Certificate, alerts...); in the captured output each one is followed by a hex dump of its bytes.", "Imprime cada mensagem do protocolo conforme passa (ClientHello, ServerHello, Certificate, alertas...); na saída capturada, cada uma vem seguida de um dump em hex dos bytes."), // -msg
  o("-debug", null, "display", "s_client-3.5", "Print extensive debugging, including a hex dump of all the traffic.", "Imprime depuração extensa, incluindo dump em hex de todo o tráfego."), // -debug
  o("-state", null, "display", "s_client-3.5", "Print each handshake state as the connection moves through it (SSL_connect:...).", "Imprime cada estado do handshake conforme a conexão passa por ele (SSL_connect:...)."), // -state
  o("-trace", null, "display", "s_client-3.5", "Print a verbose decoded trace of every protocol message.", "Imprime um trace decodificado e detalhado de cada mensagem do protocolo."), // -trace
  o("-msgfile", "filename", "display", "s_client-3.5", "Send the -msg or -trace output to this file instead of standard output.", "Manda a saída de -msg ou -trace para este arquivo em vez da saída padrão."), // -msgfile
  o("-tlsextdebug", null, "display", "s_client-3.5", "Print a hex dump of every TLS extension the server sends.", "Imprime em hex cada extensão TLS que o servidor envia."), // -tlsextdebug
  o("-security_debug", null, "display", "s_client-3.5", "Print the security-level callback's decisions.", "Imprime as decisões do callback de nível de segurança."), // -security_debug
  o("-security_debug_verbose", null, "display", "s_client-3.5", "Print more security-level debugging.", "Imprime mais depuração do nível de segurança."), // -security_debug_verbose
  o("-nameopt", "option", "display", "s_client-3.5", "How subject and issuer names are printed (see openssl-namedisplay-options(1)).", "Como subject e issuer são impressos (veja openssl-namedisplay-options(1))."), // -nameopt
  o("-prexit", null, "display", "s_client-3.5", "Print the session information when the program exits, even when the connection failed; the page warns it is not always accurate.", "Imprime a informação da sessão quando o programa sai, mesmo se a conexão falhou; a página avisa que nem sempre é precisa."), // -prexit
  o("-keymatexport", "label", "display", "s_client-3.5", "Export keying material with this label and print it.", "Exporta keying material com este label e imprime."), // -keymatexport
  o("-keymatexportlen", "len", "display", "s_client-3.5", "How many bytes of keying material to export; 20 by default.", "Quantos bytes de keying material exportar; 20 por padrão."), // -keymatexportlen
  o("-keylogfile", "file", "display", "s_client-3.5", "Append the TLS secrets of the connection to this file in the key log format tools such as Wireshark read to decrypt the traffic. Protect the file like a key.", "Acrescenta os segredos TLS da conexão a este arquivo no formato de key log que ferramentas como o Wireshark leem para decifrar o tráfego. Proteja o arquivo como uma chave."), // -keylogfile

  // ---- session: caching, tickets, reconnects -------------------------------------------------------------------
  o("-reconnect", null, "session", "s_client-3.5", "After the first handshake, reconnect to the same server five times reusing the session: a quick test that session resumption works (look for \"Reused\" in the output).", "Depois do primeiro handshake, reconecta ao mesmo servidor cinco vezes reaproveitando a sessão: um teste rápido de que a retomada de sessão funciona (procure \"Reused\" na saída)."), // -reconnect
  o("-sess_out", "filename", "session", "s_client-3.5", "Save the TLS session to this file, so a later run can try to resume it with -sess_in. With TLS 1.3 the session only exists once a ticket arrives after the handshake.", "Grava a sessão TLS neste arquivo, para uma execução posterior tentar retomá-la com -sess_in. No TLS 1.3 a sessão só existe depois que um ticket chega, após o handshake."), // -sess_out
  o("-sess_in", "filename", "session", "s_client-3.5", "Load a saved session and try to resume it.", "Carrega uma sessão salva e tenta retomá-la."), // -sess_in
  o("-no_ticket", null, "session", "ssl-conf-cmd-3.5", "Turn off session ticket support.", "Desliga o suporte a session tickets."), // -no_ticket
  o("-early_data", "file", "session", "s_client-3.5", "Send this file's contents as TLS 1.3 early data (0-RTT); works only when resuming a session that allows it and the server accepts.", "Envia o conteúdo deste arquivo como early data (0-RTT) do TLS 1.3; só funciona ao retomar uma sessão que permite isso e se o servidor aceitar."), // -early_data

  // ---- client-auth: your own certificate -----------------------------------------------------------------------
  o("-cert", "filename", "client-auth", "s_client-3.5",
    "The client certificate, sent only if the server asks for one: having it on the command line does not prove it works.",
    "O certificado de cliente, enviado só se o servidor pedir: tê-lo na linha de comando não prova que funciona.",
    { dflt: { en: "No client certificate is used.", pt: "Nenhum certificado de cliente é usado." } }), // -cert
  o("-key", "filename|uri", "client-auth", "s_client-3.5", "The client's private key.", "A chave privada do cliente.", { dflt: { en: "Without -key the key is read from the -cert file.", pt: "Sem -key, a chave é lida do arquivo do -cert." } }), // -key
  o("-cert_chain", "filename", "client-auth", "s_client-3.5", "Untrusted certificates for building the chain of the client certificate.", "Certificados não confiáveis para montar a cadeia do certificado de cliente."), // -cert_chain
  o("-build_chain", null, "client-auth", "s_client-3.5", "Build the client certificate chain to send to the server.", "Monta a cadeia do certificado de cliente para enviar ao servidor."), // -build_chain
  o("-certform", "DER|PEM|P12", "client-auth", "s_client-3.5", "The client certificate format; obsolete since OpenSSL 3.0.0 and without effect.", "O formato do certificado de cliente; obsoleta desde o OpenSSL 3.0.0 e sem efeito."), // -certform
  o("-keyform", "DER|PEM|P12|ENGINE", "client-auth", "s_client-3.5", "The client key format.", "O formato da chave do cliente."), // -keyform
  o("-pass", "arg", "client-auth", "s_client-3.5", "Where the key and certificate password comes from (openssl-passphrase-options(1)).", "De onde vem a senha da chave e do certificado (openssl-passphrase-options(1))."), // -pass
  o("-enable_pha", null, "client-auth", "s_client-3.5", "Offer TLS 1.3 post-handshake authentication, so the server may ask for a client certificate after the handshake.", "Oferece a autenticação pós-handshake do TLS 1.3, para o servidor poder pedir certificado de cliente depois do handshake."), // -enable_pha
  o("-ssl_client_engine", "id", "client-auth", "s_client-3.5", "The engine for client certificate operations.", "O engine para operações com o certificado de cliente."), // -ssl_client_engine

  // ---- app: STARTTLS and ALPN ----------------------------------------------------------------------------------
  o("-starttls", "protocol", "app", "s_client-3.5",
    "Speak the application protocol's plain-text opening and its upgrade command first, then start TLS on the same connection. Keywords: smtp, pop3, imap, ftp, xmpp, xmpp-server, irc, postgres, mysql, lmtp, nntp, sieve, ldap.",
    "Fala primeiro a abertura em texto puro do protocolo de aplicação e o comando de upgrade dele, e depois inicia o TLS na mesma conexão. Palavras aceitas: smtp, pop3, imap, ftp, xmpp, xmpp-server, irc, postgres, mysql, lmtp, nntp, sieve, ldap."), // -starttls
  o("-name", "hostname", "app", "s_client-3.5", "The host name used inside some STARTTLS dialogues: the stream \"to\" attribute for xmpp, and the EHLO or LHLO name for smtp and lmtp.", "O hostname usado dentro de alguns diálogos STARTTLS: o atributo \"to\" do stream no xmpp, e o nome do EHLO ou LHLO no smtp e no lmtp.",
    { dflt: { en: "For smtp and lmtp the default EHLO/LHLO name is mail.example.com; for xmpp, the -connect host.", pt: "No smtp e no lmtp o nome padrão do EHLO/LHLO é mail.example.com; no xmpp, o host do -connect." } }), // -name
  o("-xmpphost", "hostname", "app", "s_client-3.5", "With -starttls xmpp or xmpp-server, the \"to\" host of the stream; an alias of -name.", "Com -starttls xmpp ou xmpp-server, o host \"to\" do stream; um alias do -name."), // -xmpphost
  o("-alpn", "protocols", "app", "s_client-3.5",
    "Offer these application protocols through ALPN, comma-separated, most wanted first (h2,http/1.1). The server's choice appears as \"ALPN protocol\".",
    "Oferece estes protocolos de aplicação via ALPN, separados por vírgula, o preferido primeiro (h2,http/1.1). A escolha do servidor aparece como \"ALPN protocol\".",
    { dflt: { en: "Without it no ALPN extension is sent and the output says \"No ALPN negotiated\".", pt: "Sem ela nenhuma extensão ALPN é enviada e a saída diz \"No ALPN negotiated\"." } }), // -alpn
  o("-nextprotoneg", "protocols", "app", "s_client-3.5", "Offer protocols through NPN, the older mechanism ALPN replaced; not allowed with -tls1_3.", "Oferece protocolos via NPN, o mecanismo antigo que o ALPN substituiu; não permitida com -tls1_3."), // -nextprotoneg
  o("-serverinfo", "types", "app", "s_client-3.5", "Send these TLS extension type numbers empty in the ClientHello and print the server's answers in PEM.", "Envia estes números de tipo de extensão TLS vazios no ClientHello e imprime as respostas do servidor em PEM."), // -serverinfo
  o("-use_srtp", "value", "app", "s_client-3.5", "Offer SRTP key management with these profiles (colon-separated).", "Oferece gerenciamento de chaves SRTP com estes perfis (separados por dois-pontos)."), // -use_srtp

  // ---- status: OCSP stapling and CT ----------------------------------------------------------------------------
  o("-status", null, "status", "s_client-3.5",
    "Ask the server to staple an OCSP response (the status_request extension) and print what comes back. A line such as \"OCSP response: no response sent\" means the server stapled nothing.",
    "Pede ao servidor uma resposta OCSP via stapling (a extensão status_request) e imprime o que voltar. Uma linha como \"OCSP response: no response sent\" quer dizer que o servidor não mandou resposta nenhuma."), // -status
  o("-ocsp_check_leaf", null, "status", "s_client-3.6", "Require a status check of the server certificate, trying the stapled response first and CRLs after, if enabled; implies -status.", "Exige checagem de status do certificado do servidor, tentando primeiro a resposta recebida via stapling e depois CRLs, se habilitadas; implica -status.", { since: "3.6", notIn35: true }), // -ocsp_check_leaf
  o("-ocsp_check_all", null, "status", "s_client-3.6", "Like -ocsp_check_leaf, for the intermediates too (not the trust anchor).", "Como -ocsp_check_leaf, também para as intermediárias (não a âncora de confiança).", { since: "3.6", notIn35: true }), // -ocsp_check_all
  o("-ct", null, "status", "s_client-3.5", "Ask for Certificate Transparency SCTs and report them at the end of the handshake; also turns on OCSP stapling.", "Pede os SCTs de Certificate Transparency e os relata no fim do handshake; também liga o OCSP stapling."), // -ct
  o("-noct", null, "status", "s_client-3.5", "Do not ask for Certificate Transparency SCTs.", "Não pede SCTs de Certificate Transparency."), // -noct
  o("-ctlogfile", "file", "status", "s_client-3.5", "A file listing the known CT logs.", "Um arquivo com a lista dos logs de CT conhecidos."), // -ctlogfile

  // ---- io: input and terminal handling -------------------------------------------------------------------------
  o("-crlf", null, "io", "s_client-3.5", "Turn each line feed typed at the terminal into CR+LF, as some servers require.", "Transforma cada line feed digitado no terminal em CR+LF, como alguns servidores exigem."), // -crlf
  o("-ign_eof", null, "io", "s_client-3.5",
    "Keep the connection open when the input ends, instead of closing it; it also turns on -nocommands. The page recommends it for scripts, and warns that a server waiting for the client to speak first can then leave s_client hanging.",
    "Mantém a conexão aberta quando a entrada acaba, em vez de fechá-la; também liga -nocommands. A página recomenda para scripts, e avisa que um servidor que espera o cliente falar primeiro pode deixar o s_client parado.",
    { dflt: { en: "Without it, end of input closes the connection; the page notes that a non-interactive run (a script, </dev/null) may then close too early, especially with TLS 1.3.", pt: "Sem ela, o fim da entrada fecha a conexão; a página observa que uma execução sem terminal (um script, </dev/null) pode então fechar cedo demais, sobretudo com TLS 1.3." } }), // -ign_eof
  o("-no_ign_eof", null, "io", "s_client-3.5", "Close the connection at end of input, undoing the -ign_eof that -quiet implies.", "Fecha a conexão no fim da entrada, desfazendo o -ign_eof que o -quiet implica."), // -no_ign_eof
  o("-nocommands", null, "io", "s_client-3.5", "Do not treat Q, R, C, k and K at the start of a line as commands; send them to the server as data.", "Não trata Q, R, C, k e K no início da linha como comandos; manda-os ao servidor como dados."), // -nocommands
  o("-adv", null, "io", "s_client-3.5", "Advanced command mode: commands go in braces, such as {quit} or {keyup:req}.", "Modo de comandos avançado: os comandos vão entre chaves, como {quit} ou {keyup:req}."), // -adv
  o("-no-interactive", null, "io", "s_client-3.5", "Run without interactive use.", "Roda sem uso interativo."), // -no-interactive
  o("-nbio", null, "io", "s_client-3.5", "Use non-blocking I/O.", "Usa I/O não bloqueante."), // -nbio
  o("-nbio_test", null, "io", "s_client-3.5", "Test non-blocking I/O.", "Testa I/O não bloqueante."), // -nbio_test
  o("-timeout", null, "io", "s_client-3.5", "Turn on send and receive timeouts for DTLS.", "Liga timeouts de envio e recepção para DTLS."), // -timeout
  o("-ignore_unexpected_eof", null, "io", "s_client-3.5", "Treat a connection closed without close_notify as a normal close instead of an error.", "Trata uma conexão fechada sem close_notify como fechamento normal em vez de erro."), // -ignore_unexpected_eof
  o("-ktls", null, "io", "s_client-3.5", "Use kernel TLS for sending and receiving; off by default.", "Usa TLS do kernel para enviar e receber; desligado por padrão.", { since: "3.2" }), // -ktls
  o("-async", null, "io", "s_client-3.5", "Asynchronous crypto mode; only useful with an engine that supports it.", "Modo criptográfico assíncrono; só útil com engine que suporte."), // -async

  // ---- dane ------------------------------------------------------------------------------------------------------
  o("-dane_tlsa_domain", "domain", "dane", "s_client-3.5", "Turn on DANE TLSA authentication (RFC 6698, RFC 7671) for this base domain, which also becomes the default SNI and the name checked; needs -dane_tlsa_rrdata.", "Liga a autenticação DANE TLSA (RFC 6698, RFC 7671) para este domínio base, que também vira o SNI padrão e o nome conferido; exige -dane_tlsa_rrdata."), // -dane_tlsa_domain
  o("-dane_tlsa_rrdata", "rrdata", "dane", "s_client-3.5", "One TLSA record (usage, selector, matching type, data in hex); repeat for each record.", "Um registro TLSA (usage, selector, matching type, dados em hex); repita para cada registro."), // -dane_tlsa_rrdata
  o("-dane_ee_no_namechecks", null, "dane", "s_client-3.5", "Skip name checks with DANE-EE(3) records; the page says this is safe for SMTP and XMPP clients, not for browsers.", "Pula a checagem de nome com registros DANE-EE(3); a página diz que é seguro para clientes SMTP e XMPP, não para browsers."), // -dane_ee_no_namechecks

  // ---- psk -------------------------------------------------------------------------------------------------------
  o("-psk", "key", "psk", "s_client-3.5", "A pre-shared key in hex for PSK cipher suites.", "Uma pre-shared key em hex para cipher suites PSK."), // -psk
  o("-psk_identity", "identity", "psk", "s_client-3.5", "The PSK identity; Client_identity by default.", "A identidade PSK; Client_identity por padrão."), // -psk_identity
  o("-psk_session", "file", "psk", "s_client-3.5", "Use a saved session as the basis of a PSK (TLS 1.3 only).", "Usa uma sessão salva como base de uma PSK (só TLS 1.3)."), // -psk_session
  o("-srpuser", "value", "psk", "s_client-3.5", "SRP user name (deprecated).", "Usuário SRP (depreciada).", { deprecated: true }), // -srpuser
  o("-srppass", "value", "psk", "s_client-3.5", "SRP password (deprecated).", "Senha SRP (depreciada).", { deprecated: true }), // -srppass
  o("-srp_lateuser", null, "psk", "s_client-3.5", "SRP user name in the second ClientHello (deprecated).", "Usuário SRP no segundo ClientHello (depreciada).", { deprecated: true }), // -srp_lateuser
  o("-srp_moregroups", null, "psk", "s_client-3.5", "Tolerate other SRP g and N values (deprecated).", "Tolera outros valores g e N de SRP (depreciada).", { deprecated: true }), // -srp_moregroups
  o("-srp_strength", "number", "psk", "s_client-3.5", "Minimum SRP N size in bits (deprecated).", "Tamanho mínimo de N do SRP em bits (depreciada).", { deprecated: true }), // -srp_strength

  // ---- provider, engine, randomness ------------------------------------------------------------------------------
  o("-provider", "name", "provider", "s_client-3.5", "Load this provider (default, legacy, fips...).", "Carrega este provider (default, legacy, fips...)."), // -provider
  o("-provider-path", "path", "provider", "s_client-3.5", "Where providers are loaded from.", "De onde os providers são carregados."), // -provider-path
  o("-provparam", "[name:]key=value", "provider", "s_client-3.5", "Set a provider parameter.", "Define um parâmetro de provider."), // -provparam
  o("-propquery", "propq", "provider", "s_client-3.5", "The property query used to pick algorithms.", "A property query usada para escolher algoritmos."), // -propquery
  o("-engine", "id", "provider", "s_client-3.5", "Load an engine. Deprecated in OpenSSL 3.0 and removed in 4.0.", "Carrega um engine. Depreciada no OpenSSL 3.0 e removida no 4.0.", { deprecated: true }), // -engine
  o("-rand", "files", "provider", "s_client-3.5", "Feed these files to the random number generator.", "Alimenta o gerador de números aleatórios com estes arquivos."), // -rand
  o("-writerand", "file", "provider", "s_client-3.5", "Write random data to this file on exit.", "Grava dados aleatórios neste arquivo na saída."), // -writerand
  o("-ssl_config", "section", "provider", "s_client-3.5", "Configure the TLS context from this section of the configuration file.", "Configura o contexto TLS a partir desta seção do arquivo de configuração."), // -ssl_config

  // ---- tuning ----------------------------------------------------------------------------------------------------
  o("-maxfraglen", "len", "tuning", "s_client-3.5", "Negotiate a maximum fragment length of 512, 1024, 2048 or 4096 bytes.", "Negocia um tamanho máximo de fragmento de 512, 1024, 2048 ou 4096 bytes."), // -maxfraglen
  o("-max_send_frag", "int", "tuning", "s_client-3.5", "The largest fragment of data to send.", "O maior fragmento de dados a enviar."), // -max_send_frag
  o("-split_send_frag", "int", "tuning", "s_client-3.5", "The split size for encryption pipelines.", "O tamanho de divisão para pipelines de cifragem."), // -split_send_frag
  o("-max_pipelines", "int", "tuning", "s_client-3.5", "The number of encryption pipelines (1 by default).", "O número de pipelines de cifragem (1 por padrão)."), // -max_pipelines
  o("-read_buf", "int", "tuning", "s_client-3.5", "The default read buffer size.", "O tamanho padrão do buffer de leitura."), // -read_buf
  o("-help", null, "tuning", "s_client-3.5", "Print the usage message.", "Imprime a mensagem de uso."), // -help
]);

/** Every option by canonical name, for O(1) look-up while parsing. */
export const OPTION_BY_NAME: ReadonlyMap<string, OptionInfo> = new Map(OPTIONS.map((x) => [x.name, x])); // name -> row

/** The STARTTLS keywords the 3.5 page lists (identical in the 3.0 and 3.6 pages). */
export const STARTTLS_PROTOCOLS: readonly string[] = Object.freeze([
  "smtp", "pop3", "imap", "ftp", "xmpp", "xmpp-server", "irc", "postgres", "mysql", "lmtp", "nntp", "sieve", "ldap", // the thirteen keywords
]);

/** The group labels, in both languages, in display order. */
export const GROUP_LABELS: Readonly<Record<OptionGroup, Bilingual>> = Object.freeze({
  target: { en: "Where to connect", pt: "Para onde conectar" }, // target
  sni: { en: "Server name (SNI)", pt: "Nome do servidor (SNI)" }, // sni
  verify: { en: "Certificate verification", pt: "Verificação do certificado" }, // verify
  trust: { en: "Trust store", pt: "Trust store" }, // trust
  protocol: { en: "Protocol versions", pt: "Versões do protocolo" }, // protocol
  crypto: { en: "Cipher suites, groups and signatures", pt: "Cipher suites, groups e assinaturas" }, // crypto
  display: { en: "What s_client prints", pt: "O que o s_client imprime" }, // display
  session: { en: "Sessions and resumption", pt: "Sessões e retomada" }, // session
  "client-auth": { en: "Client certificate", pt: "Certificado de cliente" }, // client-auth
  app: { en: "STARTTLS and ALPN", pt: "STARTTLS e ALPN" }, // app
  status: { en: "OCSP stapling and CT", pt: "OCSP stapling e CT" }, // status
  io: { en: "Input and terminal", pt: "Entrada e terminal" }, // io
  dane: { en: "DANE", pt: "DANE" }, // dane
  psk: { en: "PSK and SRP", pt: "PSK e SRP" }, // psk
  provider: { en: "Providers and randomness", pt: "Providers e aleatoriedade" }, // provider
  tuning: { en: "Tuning", pt: "Ajustes finos" }, // tuning
});
