// ============================================================================
// src/lib/tools/openssl-s-client-explainer/verify-codes.ts
// ----------------------------------------------------------------------------
// THE CERTIFICATE VERIFICATION RESULT CODES that s_client prints in
// "verify error:num=N:text" and "Verify return code: N (text)".
//
// Basis: OpenSSL 3.5, the long-term-support release (3.5.9; supported until
// 2030-04-08 per openssl-library.org/policies/releasestrat, read 2026-10-27).
// Where each fact comes from (all read 2026-10-27):
//   - openssl-verify(1), OpenSSL 3.5, DIAGNOSTICS: the list of codes and
//     messages is in X509_STORE_CTX_get_error(3), and the full list in the
//     header <openssl/x509_vfy.h>;
//   - X509_STORE_CTX_get_error(3), OpenSSL 3.5, ERROR CODES: each code's
//     constant, message and description (the meanings below are written for
//     this site from those descriptions, not copied);
//   - include/openssl/x509_vfy.h.in at tag openssl-3.5.9: codes 0 to 95;
//   - crypto/x509/x509_txt.c at tag openssl-3.5.9: the exact text printed in
//     the parentheses (the 3.0.13 texts are the same for codes 0 to 94; 3.0.13
//     has no code 95);
//   - openssl-verification-options(1), OpenSSL 3.5: the -x509_strict checks
//     behind codes 80 to 93, and the Suite B options behind 56 to 61.
// KEPT BEYOND 3.5 (marked in the rows): codes 96 to 101 exist only from OpenSSL
// 3.6 (x509_vfy.h.in at openssl-3.6.5; X509_STORE_CTX_get_error(3), 3.6), and
// 3.6 extends code 9's text (x509_txt.c at openssl-3.6.5). They stay so that a
// 3.6 output pasted here is still read; a 3.5 s_client never prints them.
// ============================================================================

import type { Bilingual } from "./options"; // the two-language text shape

/** One verification result code. */
export interface VerifyCode {
  code: number; // the number s_client prints
  constant: string; // the X509_V_* name in x509_vfy.h
  text: string; // X509_verify_cert_error_string() in OpenSSL 3.5.9
  text36?: string; // the 3.6.5 text, when it differs (code 9)
  only36?: boolean; // not in OpenSSL 3.5.9: added in 3.6 (kept to read 3.6 output)
  notIn30?: boolean; // in 3.5.9 but not in the 3.0.13 header
  meaning: Bilingual; // what it means for the reader of s_client output
}

/** Shorthand: one code per line in the table below. */
function c(code: number, constant: string, text: string, en: string, pt: string, extra?: Partial<VerifyCode>): VerifyCode {
  return { code, constant, text, meaning: { en, pt }, ...extra }; // one row
}

/** Every code of OpenSSL 3.5.9 (0 to 95), then the six that 3.6 added, in numeric order. */
export const VERIFY_CODES: readonly VerifyCode[] = Object.freeze([
  c(0, "X509_V_OK", "ok", "Verification succeeded: a chain was built from the server certificate to a trusted anchor and every check passed. It says nothing about the host name unless -verify_hostname or -verify_ip was given.", "A verificação passou: montou-se uma cadeia do certificado do servidor até uma âncora confiável e todas as checagens passaram. Não diz nada sobre o hostname, a menos que -verify_hostname ou -verify_ip tenham sido usados."), // 0
  c(1, "X509_V_ERR_UNSPECIFIED", "unspecified certificate verification error", "An unspecified error; the documentation says it should not happen.", "Erro não especificado; a documentação diz que não deveria acontecer."), // 1
  c(2, "X509_V_ERR_UNABLE_TO_GET_ISSUER_CERT", "unable to get issuer certificate", "The issuer of a certificate found in the trust store could not be found: the trust store holds an intermediate without the root above it. -partial_chain would let that intermediate end the chain.", "Não se achou o emissor de um certificado encontrado no trust store: o trust store tem uma intermediária sem a raiz acima dela. -partial_chain deixaria essa intermediária encerrar a cadeia."), // 2
  c(3, "X509_V_ERR_UNABLE_TO_GET_CRL", "unable to get certificate CRL", "CRL checking was asked for and no CRL for the certificate could be found.", "A checagem de CRL foi pedida e não se achou CRL para o certificado."), // 3
  c(4, "X509_V_ERR_UNABLE_TO_DECRYPT_CERT_SIGNATURE", "unable to decrypt certificate's signature", "The certificate's signature value could not be recovered at all (RSA only), which is different from it not matching.", "Não foi possível recuperar o valor da assinatura do certificado (só RSA), o que é diferente de ela não conferir."), // 4
  c(5, "X509_V_ERR_UNABLE_TO_DECRYPT_CRL_SIGNATURE", "unable to decrypt CRL's signature", "A CRL's signature value could not be recovered; documented as unused.", "Não foi possível recuperar a assinatura de uma CRL; documentado como não usado."), // 5
  c(6, "X509_V_ERR_UNABLE_TO_DECODE_ISSUER_PUBLIC_KEY", "unable to decode issuer public key", "The issuer's public key could not be read.", "Não foi possível ler a chave pública do emissor."), // 6
  c(7, "X509_V_ERR_CERT_SIGNATURE_FAILURE", "certificate signature failure", "A certificate's signature does not verify with its issuer's key: corrupted, tampered with, or paired with the wrong issuer.", "A assinatura de um certificado não confere com a chave do emissor: corrompido, adulterado ou associado ao emissor errado."), // 7
  c(8, "X509_V_ERR_CRL_SIGNATURE_FAILURE", "CRL signature failure", "A CRL's signature is invalid.", "A assinatura de uma CRL é inválida."), // 8
  c(9, "X509_V_ERR_CERT_NOT_YET_VALID", "certificate is not yet valid", "A certificate's notBefore date is still in the future: the certificate was issued with a future start, or the clock of the machine running s_client is wrong.", "A data notBefore de um certificado ainda está no futuro: o certificado foi emitido com início futuro, ou o relógio da máquina que roda o s_client está errado.", { text36: "certificate is not yet valid or the system clock is incorrect" }), // 9
  c(10, "X509_V_ERR_CERT_HAS_EXPIRED", "certificate has expired", "A certificate's notAfter date has passed. The depth on the verify error line says which one: 0 is the server certificate, higher numbers are intermediates.", "A data notAfter de um certificado já passou. A profundidade na linha de erro diz qual: 0 é o certificado do servidor, números maiores são intermediárias."), // 10
  c(11, "X509_V_ERR_CRL_NOT_YET_VALID", "CRL is not yet valid", "A CRL is not valid yet.", "Uma CRL ainda não é válida."), // 11
  c(12, "X509_V_ERR_CRL_HAS_EXPIRED", "CRL has expired", "A CRL has expired.", "Uma CRL expirou."), // 12
  c(13, "X509_V_ERR_ERROR_IN_CERT_NOT_BEFORE_FIELD", "format error in certificate's notBefore field", "A certificate's notBefore field holds an invalid time.", "O campo notBefore de um certificado tem uma data inválida."), // 13
  c(14, "X509_V_ERR_ERROR_IN_CERT_NOT_AFTER_FIELD", "format error in certificate's notAfter field", "A certificate's notAfter field holds an invalid time.", "O campo notAfter de um certificado tem uma data inválida."), // 14
  c(15, "X509_V_ERR_ERROR_IN_CRL_LAST_UPDATE_FIELD", "format error in CRL's lastUpdate field", "A CRL's lastUpdate field holds an invalid time.", "O campo lastUpdate de uma CRL tem uma data inválida."), // 15
  c(16, "X509_V_ERR_ERROR_IN_CRL_NEXT_UPDATE_FIELD", "format error in CRL's nextUpdate field", "A CRL's nextUpdate field holds an invalid time.", "O campo nextUpdate de uma CRL tem uma data inválida."), // 16
  c(17, "X509_V_ERR_OUT_OF_MEM", "out of memory", "Memory ran out during verification.", "A memória acabou durante a verificação."), // 17
  c(18, "X509_V_ERR_DEPTH_ZERO_SELF_SIGNED_CERT", "self-signed certificate", "The server certificate signs itself and that same certificate is not in the trust store. Typical of a test or appliance default certificate.", "O certificado do servidor assina a si mesmo e esse mesmo certificado não está no trust store. Típico de certificado de teste ou padrão de appliance."), // 18
  c(19, "X509_V_ERR_SELF_SIGNED_CERT_IN_CHAIN", "self-signed certificate in certificate chain", "The chain could be built, but it ends in a self-signed root this client does not trust: often the server sends its root and the client lacks it, as with a private CA.", "A cadeia pôde ser montada, mas termina numa raiz auto-assinada em que este cliente não confia: muitas vezes o servidor envia a raiz e o cliente não a tem, como numa CA privada."), // 19
  c(20, "X509_V_ERR_UNABLE_TO_GET_ISSUER_CERT_LOCALLY", "unable to get local issuer certificate", "The issuer of a certificate the server sent was found neither among the certificates sent nor in the trust store. Either the server left out an intermediate, or the client lacks the root (or private CA) that issued the chain.", "O emissor de um certificado enviado pelo servidor não foi achado nem entre os certificados enviados nem no trust store. Ou o servidor deixou de fora uma intermediária, ou falta ao cliente a raiz (ou a CA privada) que emitiu a cadeia."), // 20
  c(21, "X509_V_ERR_UNABLE_TO_VERIFY_LEAF_SIGNATURE", "unable to verify the first certificate", "No signature could be checked: the chain has a single certificate that is not self-signed, so there is nothing to verify it with. Usually seen right after error 20 when a server sends its certificate without the intermediate.", "Nenhuma assinatura pôde ser conferida: a cadeia tem um único certificado, que não é auto-assinado, então não há com o que verificá-lo. Costuma aparecer logo depois do erro 20, quando o servidor envia o certificado sem a intermediária."), // 21
  c(22, "X509_V_ERR_CERT_CHAIN_TOO_LONG", "certificate chain too long", "The chain is longer than the allowed depth (-verify or -verify_depth).", "A cadeia é mais longa que a profundidade permitida (-verify ou -verify_depth)."), // 22
  c(23, "X509_V_ERR_CERT_REVOKED", "certificate revoked", "A certificate in the chain has been revoked.", "Um certificado da cadeia foi revogado."), // 23
  c(24, "X509_V_ERR_NO_ISSUER_PUBLIC_KEY", "issuer certificate doesn't have a public key", "The issuer certificate has no public key.", "O certificado do emissor não tem chave pública."), // 24
  c(25, "X509_V_ERR_PATH_LENGTH_EXCEEDED", "path length constraint exceeded", "A CA's basicConstraints pathLenConstraint allows fewer intermediates below it than the chain has.", "O pathLenConstraint do basicConstraints de uma CA permite menos intermediárias abaixo dela do que a cadeia tem."), // 25
  c(26, "X509_V_ERR_INVALID_PURPOSE", "unsuitable certificate purpose", "The leaf cannot be used for this purpose. s_client checks the TLS server purpose (sslserver): an extended key usage that leaves out serverAuth, or a key usage without digitalSignature, keyEncipherment or keyAgreement, fails it.", "O leaf não serve para esse propósito. O s_client confere o propósito de servidor TLS (sslserver): um extended key usage que deixa de fora serverAuth, ou um key usage sem digitalSignature, keyEncipherment ou keyAgreement, reprova."), // 26
  c(27, "X509_V_ERR_CERT_UNTRUSTED", "certificate not trusted", "The root is not marked trusted for this purpose.", "A raiz não está marcada como confiável para esse propósito."), // 27
  c(28, "X509_V_ERR_CERT_REJECTED", "certificate rejected", "The root is marked to reject this purpose.", "A raiz está marcada para rejeitar esse propósito."), // 28
  c(29, "X509_V_ERR_SUBJECT_ISSUER_MISMATCH", "subject issuer mismatch", "A candidate issuer was rejected because its subject is not the certificate's issuer name.", "Um candidato a emissor foi rejeitado porque o subject dele não é o nome do issuer do certificado."), // 29
  c(30, "X509_V_ERR_AKID_SKID_MISMATCH", "authority and subject key identifier mismatch", "A candidate issuer was rejected because its subject key identifier does not match the certificate's authority key identifier.", "Um candidato a emissor foi rejeitado porque o subject key identifier dele não confere com o authority key identifier do certificado."), // 30
  c(31, "X509_V_ERR_AKID_ISSUER_SERIAL_MISMATCH", "authority and issuer serial number mismatch", "A candidate issuer was rejected because its name and serial do not match the authority key identifier.", "Um candidato a emissor foi rejeitado porque nome e serial não conferem com o authority key identifier."), // 31
  c(32, "X509_V_ERR_KEYUSAGE_NO_CERTSIGN", "key usage does not include certificate signing", "A candidate issuer was rejected because its keyUsage does not allow signing certificates.", "Um candidato a emissor foi rejeitado porque o keyUsage dele não permite assinar certificados."), // 32
  c(33, "X509_V_ERR_UNABLE_TO_GET_CRL_ISSUER", "unable to get CRL issuer certificate", "The certificate that issued a CRL could not be found.", "Não se achou o certificado que emitiu uma CRL."), // 33
  c(34, "X509_V_ERR_UNHANDLED_CRITICAL_EXTENSION", "unhandled critical extension", "A certificate carries a critical extension OpenSSL does not understand, so it must be rejected.", "Um certificado traz uma extensão crítica que o OpenSSL não entende, então precisa ser rejeitado."), // 34
  c(35, "X509_V_ERR_KEYUSAGE_NO_CRL_SIGN", "key usage does not include CRL signing", "The CRL issuer's keyUsage does not allow signing CRLs.", "O keyUsage do emissor da CRL não permite assinar CRLs."), // 35
  c(36, "X509_V_ERR_UNHANDLED_CRITICAL_CRL_EXTENSION", "unhandled critical CRL extension", "A CRL carries a critical extension OpenSSL does not understand.", "Uma CRL traz uma extensão crítica que o OpenSSL não entende."), // 36
  c(37, "X509_V_ERR_INVALID_NON_CA", "invalid non-CA certificate (has CA markings)", "A non-CA certificate carries CA markings.", "Um certificado que não é de CA traz marcações de CA."), // 37
  c(38, "X509_V_ERR_PROXY_PATH_LENGTH_EXCEEDED", "proxy path length constraint exceeded", "A proxy certificate path length constraint was exceeded.", "Um limite de comprimento de caminho de proxy certificate foi excedido."), // 38
  c(39, "X509_V_ERR_KEYUSAGE_NO_DIGITAL_SIGNATURE", "key usage does not include digital signature", "The keyUsage lacks digitalSignature.", "O keyUsage não tem digitalSignature."), // 39
  c(40, "X509_V_ERR_PROXY_CERTIFICATES_NOT_ALLOWED", "proxy certificates not allowed, please set the appropriate flag", "A proxy certificate appeared and proxy certificates were not allowed (-allow_proxy_certs).", "Apareceu um proxy certificate e eles não estavam permitidos (-allow_proxy_certs)."), // 40
  c(41, "X509_V_ERR_INVALID_EXTENSION", "invalid or inconsistent certificate extension", "A certificate extension is badly encoded or contradicts another one.", "Uma extensão do certificado está mal codificada ou contradiz outra."), // 41
  c(42, "X509_V_ERR_INVALID_POLICY_EXTENSION", "invalid or inconsistent certificate policy extension", "A certificate policies extension is invalid (only with policy processing on).", "Uma extensão de políticas de certificado é inválida (só com processamento de políticas ligado)."), // 42
  c(43, "X509_V_ERR_NO_EXPLICIT_POLICY", "no explicit policy", "An explicit policy was required and none was present.", "Exigiu-se política explícita e não havia nenhuma."), // 43
  c(44, "X509_V_ERR_DIFFERENT_CRL_SCOPE", "different CRL scope", "The only CRLs found do not cover this certificate's scope.", "As únicas CRLs encontradas não cobrem o escopo deste certificado."), // 44
  c(45, "X509_V_ERR_UNSUPPORTED_EXTENSION_FEATURE", "unsupported extension feature", "A certificate extension feature is not supported; documented as unused.", "Um recurso de extensão de certificado não é suportado; documentado como não usado."), // 45
  c(46, "X509_V_ERR_UNNESTED_RESOURCE", "RFC 3779 resource not subset of parent's resources", "An RFC 3779 IP or AS resource is not within the issuer's resources.", "Um recurso IP ou AS da RFC 3779 não está contido nos recursos do emissor."), // 46
  c(47, "X509_V_ERR_PERMITTED_VIOLATION", "permitted subtree violation", "A name falls outside a CA's permitted name constraints.", "Um nome está fora das name constraints permitidas de uma CA."), // 47
  c(48, "X509_V_ERR_EXCLUDED_VIOLATION", "excluded subtree violation", "A name falls inside a CA's excluded name constraints.", "Um nome está dentro das name constraints excluídas de uma CA."), // 48
  c(49, "X509_V_ERR_SUBTREE_MINMAX", "name constraints minimum and maximum not supported", "A name constraint uses minimum or maximum, which OpenSSL does not support.", "Uma name constraint usa minimum ou maximum, que o OpenSSL não suporta."), // 49
  c(50, "X509_V_ERR_APPLICATION_VERIFICATION", "application verification failure", "An application's own verification callback failed the chain.", "O callback de verificação da própria aplicação reprovou a cadeia."), // 50
  c(51, "X509_V_ERR_UNSUPPORTED_CONSTRAINT_TYPE", "unsupported name constraint type", "A name constraint of a type OpenSSL does not support (it supports directory name, DNS name, e-mail and URI).", "Uma name constraint de tipo que o OpenSSL não suporta (ele suporta directory name, DNS name, e-mail e URI)."), // 51
  c(52, "X509_V_ERR_UNSUPPORTED_CONSTRAINT_SYNTAX", "unsupported or invalid name constraint syntax", "A name constraint in a form OpenSSL does not recognise.", "Uma name constraint num formato que o OpenSSL não reconhece."), // 52
  c(53, "X509_V_ERR_UNSUPPORTED_NAME_SYNTAX", "unsupported or invalid name syntax", "A name in a syntax OpenSSL does not support.", "Um nome numa sintaxe que o OpenSSL não suporta."), // 53
  c(54, "X509_V_ERR_CRL_PATH_VALIDATION_ERROR", "CRL path validation error", "The CRL's own path failed to verify (extended CRL checking only).", "O caminho da própria CRL não passou na verificação (só com checagem estendida de CRL)."), // 54
  c(55, "X509_V_ERR_PATH_LOOP", "path loop", "Chain building went round in a loop.", "A montagem da cadeia entrou em loop."), // 55
  c(56, "X509_V_ERR_SUITE_B_INVALID_VERSION", "Suite B: certificate version invalid", "Suite B mode (RFC 6460): the certificate version is not allowed.", "Modo Suite B (RFC 6460): a versão do certificado não é permitida."), // 56
  c(57, "X509_V_ERR_SUITE_B_INVALID_ALGORITHM", "Suite B: invalid public key algorithm", "Suite B mode: the public key algorithm is not allowed.", "Modo Suite B: o algoritmo de chave pública não é permitido."), // 57
  c(58, "X509_V_ERR_SUITE_B_INVALID_CURVE", "Suite B: invalid ECC curve", "Suite B mode: the curve is not P-256 or P-384.", "Modo Suite B: a curva não é P-256 nem P-384."), // 58
  c(59, "X509_V_ERR_SUITE_B_INVALID_SIGNATURE_ALGORITHM", "Suite B: invalid signature algorithm", "Suite B mode: the signature algorithm is not allowed.", "Modo Suite B: o algoritmo de assinatura não é permitido."), // 59
  c(60, "X509_V_ERR_SUITE_B_LOS_NOT_ALLOWED", "Suite B: curve not allowed for this LOS", "Suite B mode: the curve does not match the chosen security level.", "Modo Suite B: a curva não corresponde ao nível de segurança escolhido."), // 60
  c(61, "X509_V_ERR_SUITE_B_CANNOT_SIGN_P_384_WITH_P_256", "Suite B: cannot sign P-384 with P-256", "Suite B mode: a P-384 key was signed with P-256.", "Modo Suite B: uma chave P-384 foi assinada com P-256."), // 61
  c(62, "X509_V_ERR_HOSTNAME_MISMATCH", "hostname mismatch", "The certificate is not valid for the name given to -verify_hostname: no matching DNS name in Subject Alternative Name (or Common Name).", "O certificado não vale para o nome passado ao -verify_hostname: nenhum nome DNS correspondente no Subject Alternative Name (ou Common Name)."), // 62
  c(63, "X509_V_ERR_EMAIL_MISMATCH", "email address mismatch", "The certificate does not carry the address given to -verify_email.", "O certificado não traz o endereço passado ao -verify_email."), // 63
  c(64, "X509_V_ERR_IP_ADDRESS_MISMATCH", "IP address mismatch", "The certificate does not carry the address given to -verify_ip in its Subject Alternative Name.", "O certificado não traz no Subject Alternative Name o endereço passado ao -verify_ip."), // 64
  c(65, "X509_V_ERR_DANE_NO_MATCH", "no matching DANE TLSA records", "DANE was on and no TLSA record matched the chain; the documentation says only s_client can produce it.", "O DANE estava ligado e nenhum registro TLSA conferiu com a cadeia; a documentação diz que só o s_client produz este erro."), // 65
  c(66, "X509_V_ERR_EE_KEY_TOO_SMALL", "EE certificate key too weak", "The server certificate's key is too weak for the security level.", "A chave do certificado do servidor é fraca demais para o nível de segurança."), // 66
  c(67, "X509_V_ERR_CA_KEY_TOO_SMALL", "CA certificate key too weak", "A CA certificate's key is too weak for the security level.", "A chave de um certificado de CA é fraca demais para o nível de segurança."), // 67
  c(68, "X509_V_ERR_CA_MD_TOO_WEAK", "CA signature digest algorithm too weak", "A CA signature uses a digest too weak for the security level (SHA-1 or MD5, for instance).", "Uma assinatura de CA usa um digest fraco demais para o nível de segurança (SHA-1 ou MD5, por exemplo)."), // 68
  c(69, "X509_V_ERR_INVALID_CALL", "invalid certificate verification context", "The verification context was invalid.", "O contexto de verificação era inválido."), // 69
  c(70, "X509_V_ERR_STORE_LOOKUP", "issuer certificate lookup error", "Looking up the issuer in the store failed.", "A busca do emissor no store falhou."), // 70
  c(71, "X509_V_ERR_NO_VALID_SCTS", "Certificate Transparency required, but no valid SCTs found", "Certificate Transparency was required and no valid SCT came with the certificate.", "Certificate Transparency era exigida e nenhum SCT válido veio com o certificado."), // 71
  c(72, "X509_V_ERR_PROXY_SUBJECT_NAME_VIOLATION", "proxy subject name violation", "A proxy certificate's subject name breaks the rules.", "O subject de um proxy certificate viola as regras."), // 72
  c(73, "X509_V_ERR_OCSP_VERIFY_NEEDED", "OCSP verification needed", "The verify callback asked for an OCSP check.", "O callback de verificação pediu uma checagem OCSP."), // 73
  c(74, "X509_V_ERR_OCSP_VERIFY_FAILED", "OCSP verification failed", "The OCSP check failed.", "A checagem OCSP falhou."), // 74
  c(75, "X509_V_ERR_OCSP_CERT_UNKNOWN", "OCSP unknown cert", "The OCSP responder does not know the certificate.", "O responder OCSP não conhece o certificado."), // 75
  c(76, "X509_V_ERR_UNSUPPORTED_SIGNATURE_ALGORITHM", "Cannot find certificate signature algorithm", "The certificate's signature algorithm is not available.", "O algoritmo de assinatura do certificado não está disponível."), // 76
  c(77, "X509_V_ERR_SIGNATURE_ALGORITHM_MISMATCH", "subject signature algorithm and issuer public key algorithm mismatch", "The issuer's key type cannot produce the signature the certificate claims.", "O tipo de chave do emissor não produz a assinatura que o certificado declara."), // 77
  c(78, "X509_V_ERR_SIGNATURE_ALGORITHM_INCONSISTENCY", "cert info signature and signature algorithm mismatch", "The algorithm inside the signed part and the one on the signature disagree.", "O algoritmo dentro da parte assinada e o da assinatura discordam."), // 78
  c(79, "X509_V_ERR_INVALID_CA", "invalid CA certificate", "A certificate used as a CA is not a valid CA, or its extensions do not fit the purpose.", "Um certificado usado como CA não é uma CA válida, ou as extensões dele não servem ao propósito."), // 79
  c(80, "X509_V_ERR_PATHLEN_INVALID_FOR_NON_CA", "Path length invalid for non-CA cert", "-x509_strict: a non-CA certificate carries a pathLenConstraint.", "-x509_strict: um certificado que não é de CA traz pathLenConstraint."), // 80
  c(81, "X509_V_ERR_PATHLEN_WITHOUT_KU_KEY_CERT_SIGN", "Path length given without key usage keyCertSign", "-x509_strict: a pathLenConstraint without keyCertSign in keyUsage.", "-x509_strict: um pathLenConstraint sem keyCertSign no keyUsage."), // 81
  c(82, "X509_V_ERR_KU_KEY_CERT_SIGN_INVALID_FOR_NON_CA", "Key usage keyCertSign invalid for non-CA cert", "-x509_strict: keyCertSign on a certificate that is not a CA.", "-x509_strict: keyCertSign num certificado que não é de CA."), // 82
  c(83, "X509_V_ERR_ISSUER_NAME_EMPTY", "Issuer name empty", "-x509_strict: the issuer name is empty.", "-x509_strict: o nome do emissor está vazio."), // 83
  c(84, "X509_V_ERR_SUBJECT_NAME_EMPTY", "Subject name empty", "-x509_strict: the subject name is empty where it must not be.", "-x509_strict: o subject está vazio onde não poderia."), // 84
  c(85, "X509_V_ERR_MISSING_AUTHORITY_KEY_IDENTIFIER", "Missing Authority Key Identifier", "-x509_strict: a v3 certificate that is not self-signed lacks an authority key identifier.", "-x509_strict: um certificado v3 que não é auto-assinado não tem authority key identifier."), // 85
  c(86, "X509_V_ERR_MISSING_SUBJECT_KEY_IDENTIFIER", "Missing Subject Key Identifier", "-x509_strict: a v3 CA certificate lacks a subject key identifier.", "-x509_strict: um certificado v3 de CA não tem subject key identifier."), // 86
  c(87, "X509_V_ERR_EMPTY_SUBJECT_ALT_NAME", "Empty Subject Alternative Name extension", "-x509_strict: the Subject Alternative Name extension is present but empty.", "-x509_strict: a extensão Subject Alternative Name existe mas está vazia."), // 87
  c(88, "X509_V_ERR_EMPTY_SUBJECT_SAN_NOT_CRITICAL", "Subject empty and Subject Alt Name extension not critical", "An empty subject with a non-critical Subject Alternative Name extension.", "Subject vazio com a extensão Subject Alternative Name não crítica."), // 88
  c(89, "X509_V_ERR_CA_BCONS_NOT_CRITICAL", "Basic Constraints of CA cert not marked critical", "-x509_strict: a CA's basicConstraints is not marked critical.", "-x509_strict: o basicConstraints de uma CA não está marcado como crítico."), // 89
  c(90, "X509_V_ERR_AUTHORITY_KEY_IDENTIFIER_CRITICAL", "Authority Key Identifier marked critical", "-x509_strict: the authority key identifier is marked critical.", "-x509_strict: o authority key identifier está marcado como crítico."), // 90
  c(91, "X509_V_ERR_SUBJECT_KEY_IDENTIFIER_CRITICAL", "Subject Key Identifier marked critical", "-x509_strict: the subject key identifier is marked critical.", "-x509_strict: o subject key identifier está marcado como crítico."), // 91
  c(92, "X509_V_ERR_CA_CERT_MISSING_KEY_USAGE", "CA cert does not include key usage extension", "-x509_strict: a CA certificate has no keyUsage extension.", "-x509_strict: um certificado de CA não tem a extensão keyUsage."), // 92
  c(93, "X509_V_ERR_EXTENSIONS_REQUIRE_VERSION_3", "Using cert extension requires at least X509v3", "A certificate with extensions is not version 3.", "Um certificado com extensões não é versão 3."), // 93
  c(94, "X509_V_ERR_EC_KEY_EXPLICIT_PARAMS", "Certificate public key has explicit ECC parameters", "The certificate's EC key spells out its curve parameters instead of naming the curve.", "A chave EC do certificado escreve os parâmetros da curva por extenso em vez de nomear a curva."), // 94
  c(95, "X509_V_ERR_RPK_UNTRUSTED", "Raw public key untrusted, no trusted keys configured", "A raw public key was received and nothing was configured to trust it.", "Recebeu-se uma raw public key e nada foi configurado para confiar nela.", { notIn30: true }), // 95
  c(96, "X509_V_ERR_OCSP_RESP_INVALID", "OCSP response(s) invalid", "Added in OpenSSL 3.6; 3.5 has no such code. One or more OCSP responses are invalid.", "Acrescentado no OpenSSL 3.6; o 3.5 não tem este código. Uma ou mais respostas OCSP são inválidas.", { only36: true }), // 96
  c(97, "X509_V_ERR_OCSP_SIGNATURE_FAILURE", "OCSP response signature verification failure", "Added in OpenSSL 3.6; 3.5 has no such code. An OCSP response's signature does not verify.", "Acrescentado no OpenSSL 3.6; o 3.5 não tem este código. A assinatura de uma resposta OCSP não confere.", { only36: true }), // 97
  c(98, "X509_V_ERR_OCSP_NOT_YET_VALID", "OCSP response not yet valid (contains a date in the future)", "Added in OpenSSL 3.6; 3.5 has no such code. An OCSP response's thisUpdate is in the future.", "Acrescentado no OpenSSL 3.6; o 3.5 não tem este código. O thisUpdate de uma resposta OCSP está no futuro.", { only36: true }), // 98
  c(99, "X509_V_ERR_OCSP_HAS_EXPIRED", "OCSP response has expired", "Added in OpenSSL 3.6; 3.5 has no such code. An OCSP response has expired.", "Acrescentado no OpenSSL 3.6; o 3.5 não tem este código. Uma resposta OCSP expirou.", { only36: true }), // 99
  c(100, "X509_V_ERR_OCSP_NO_RESPONSE", "no OCSP response available for certificate", "Added in OpenSSL 3.6; 3.5 has no such code. No OCSP response is available for the certificate (with -ocsp_check_leaf or -ocsp_check_all).", "Acrescentado no OpenSSL 3.6; o 3.5 não tem este código. Não há resposta OCSP disponível para o certificado (com -ocsp_check_leaf ou -ocsp_check_all).", { only36: true }), // 100
  c(101, "X509_V_ERR_CRL_VERIFY_FAILED", "unknown certificate verification error", "Added in OpenSSL 3.6; 3.5 has no such code. Defined in the 3.6.5 header without a message of its own: OpenSSL prints the generic text.", "Acrescentado no OpenSSL 3.6; o 3.5 não tem este código. Definido no header do 3.6.5 sem mensagem própria: o OpenSSL imprime o texto genérico.", { only36: true }), // 101
]);

/** Look-up by number. */
export const VERIFY_CODE_BY_NUMBER: ReadonlyMap<number, VerifyCode> = new Map(VERIFY_CODES.map((v) => [v.code, v])); // code -> row
