## O que faz

Recebe qualquer número de certificados X.509 em PEM, em qualquer ordem, e faz o que o montador de caminho de um cliente TLS faz antes de conferir uma única assinatura: encontra a entidade final, segue cada certificado até o seu emissor e informa a cadeia que um servidor deve enviar, os certificados que faltam, os que sobram e toda regra estrutural da validação de caminho da RFC 5280 que a cadeia quebra. Depois, a página verifica a assinatura de cada elo no seu navegador com o WebCrypto e diz isso em separado, porque o resultado estrutural é o mesmo em qualquer máquina e a conferência de assinatura depende do que o navegador consegue fazer.

Cole o certificado final, os intermediários, a raiz se tiver, uma assinatura cruzada antiga de que você não tem certeza, o intermediário duas vezes por acidente; a página resolve e diz o que fez com cada um.

## Como a cadeia é montada

- **A entidade final** é o certificado que ninguém mais na entrada emite e cujo basicConstraints não afirma cA. Havendo vários, o primeiro é usado e os outros são relatados; não havendo nenhum (um pacote de intermediários sozinho), a CA mais alta é usada e a página diz isso.
- **Cada elo** é feito por Authority Key Identifier para Subject Key Identifier quando os dois certificados trazem um (RFC 5280, seção 4.2.1.1: o identificador de chave existe "para facilitar a construção do caminho de certificação"), e por nome do emissor para nome do titular quando um deles não traz. Um certificado com o nome certo e uma chave diferente não é emissor; é relatado como uma CA renovada, e o emissor verdadeiro como faltante.
- **Vários emissores possíveis** (uma CA com assinatura cruzada, ou dois certificados para a mesma chave) são resolvidos em favor daquele cuja validade cobre o início do titular, e as alternativas ficam listadas como sobrando.
- **O caminho termina** num certificado autoassinado (titular igual ao emissor e identificadores de chave que não o contradizem), ou quando o próximo emissor não está na entrada. No segundo caso o emissor faltante é nomeado, com o identificador de chave que o titular espera e a URL de caIssuers que o certificado traz, se houver. A página não a busca.

## As regras que confere

Ao longo do caminho, de cima para baixo, as conferências da seção 6.1.4 da RFC 5280 que não precisam de criptografia:

- **(k) basicConstraints.** Um emissor versão 3 precisa trazer a extensão com cA TRUE. "Se o booleano cA não está afirmado, então o bit keyCertSign da extensão key usage NÃO DEVE estar afirmado" e a chave "NÃO DEVE ser usada para verificar assinaturas de certificados" (seção 4.2.1.9).
- **(n) keyUsage.** Quando a extensão está presente num emissor, keyCertSign precisa estar ligado.
- **(l) e (m) pathLenConstraint.** O valor "dá o número máximo de certificados intermediários não autoemitidos que podem seguir este certificado num caminho de certificação válido"; a entidade final "não é incluída nesse limite", e zero significa que nenhum intermediário pode seguir. A página conta do topo do caminho para baixo, pulando certificados autoemitidos, e nomeia a CA cujo limite se esgotou. Uma raiz autoassinada no topo é a âncora de confiança, que "não é incluída como parte do caminho de certificação prospectivo" (seção 6.1); a sua própria restrição é usada só como limite inicial.
- **Validade num instante.** Todo certificado do caminho é julgado no instante escolhido, o seu relógio por padrão ou uma data que você defina, e relatado como expirado ou ainda não válido. Um emissor que expira antes do certificado que emitiu é um aviso com a data, porque a cadeia deixa de validar naquele dia, diga o que disser o certificado final.
- **Algoritmos.** Uma assinatura com SHA-1 ou MD5 em qualquer lugar que não seja uma raiz autoassinada (cuja própria assinatura nenhum validador confere) é sinalizada com base nos Baseline Requirements do CA/Browser Forum, que encerraram o último uso de SHA-1 em certificados em 2026-09-15; uma chave RSA abaixo de 2048 bits é sinalizada com base na seção 6.1.5 do mesmo documento.
- **A entidade final.** Um certificado de servidor sem subjectAltName é sinalizado, já que os navegadores comparam o nome do host apenas com essa extensão.

## Os veredictos

- **Completa**: o caminho vai da entidade final a um certificado autoassinado com todos os elos feitos e nenhuma regra quebrada. Completa aqui quer dizer estruturalmente completa; se a raiz é confiável é uma pergunta para o repositório do cliente.
- **Completa, com avisos**: o mesmo, com algo que vale ler antes.
- **A cadeia termina numa CA cujo emissor não está aqui**: o caminho é íntegro até onde vai e para num intermediário cujo emissor não foi colado. Esse é o formato normal de uma cadeia TLS, já que "um certificado que especifica uma âncora de confiança PODE ser omitido da cadeia, desde que se saiba que os pares suportados possuem os certificados omitidos" (RFC 8446, seção 4.4.2). Se o emissor faltante está nos repositórios dos seus clientes, nada falta; se ele próprio é um intermediário, acrescente-o.
- **Incompleta**: o caminho para na entidade final. Nenhum cliente consegue montar uma cadeia com o que há aqui; acrescente os intermediários.
- **Inválida**: uma regra acima está quebrada. Um cliente conforme rejeita a cadeia.

## A cadeia para configurar

A página recodifica os certificados do caminho a partir dos seus bytes, base64 em 64 colunas, na ordem que a seção 4.4.2 da RFC 8446 pede: "O certificado do remetente DEVE vir na primeira CertificateEntry da lista. Cada certificado seguinte DEVERIA certificar diretamente o imediatamente anterior." A raiz pode ser incluída ou deixada de fora; os servidores normalmente a deixam de fora. Onde o arquivo vai depende do servidor:

- **nginx**: um arquivo só, "o certificado do servidor deve aparecer antes dos certificados encadeados no arquivo combinado"; a ordem errada falha na inicialização com um erro de chave que não corresponde, porque o nginx tenta a chave privada contra o primeiro certificado que encontra.
- **Apache httpd 2.4.8 e posteriores**: `SSLCertificateFile` "também pode incluir certificados de CA intermediárias, ordenados da folha à raiz", o que "torna obsoleta a SSLCertificateChainFile".
- **F5 BIG-IP**: os intermediários são importados como um objeto de certificado próprio (colados "em sequência, sem espaço entre eles") e selecionados como Chain do certificado e da chave no perfil Client SSL ou Server SSL; o certificado final fica no seu próprio objeto. O artigo da F5 acrescenta que "colocar o certificado da CA raiz no pacote é opcional, e nunca fará o cliente confiar na CA raiz".

## O que a página verifica criptograficamente, e o que não verifica

A assinatura de cada elo é conferida no navegador, contra a chave pública do emissor mostrado na tabela: RSASSA-PKCS1-v1_5 e RSASSA-PSS com SHA-1, SHA-256, SHA-384 ou SHA-512, ECDSA em P-256, P-384 e P-521, e Ed25519 onde o navegador suporta. Uma raiz autoassinada é conferida contra a própria chave, o que prova que o certificado é consistente, não que alguém confia nele. O que o navegador não consegue fazer aparece como não conferido, nunca como falha.

Não feito, e feito por um validador: consultar um repositório de confiança, comparar o nome do host com o subjectAltName, avaliar restrições de nome, restrições de política e uso estendido de chave ao longo do caminho, e conferir revogação. Os ponteiros de CRL e OCSP do caminho são listados; nenhum é contatado.

## Limites

- Até 32 blocos de certificado e 262.144 caracteres de entrada; só PEM (um arquivo DER se converte com `openssl x509 -inform der -outform pem`).
- Os nomes são comparados como os nomes distintos em linha única que o decodificador imprime, o que é mais estrito do que a comparação da seção 7.1 da RFC 5280 em casos de canto de tipo de string e caixa; uma cadeia que só se liga sob essas regras é relatada como não ligada.
- O instante é uma data às 00:00 UTC quando você define uma, e o seu relógio ao segundo quando não define.
- Os navegadores diferem no que fazem com um intermediário faltante: alguns o buscam na URL de caIssuers na hora, o Firefox pré-carrega os intermediários a partir do banco de CAs da Mozilla (desde o Firefox 75) e não busca. Uma cadeia que funciona num navegador e não em outro normalmente é isso.

## Fontes

- [RFC 5280: Internet X.509 Public Key Infrastructure Certificate and CRL Profile](https://www.rfc-editor.org/rfc/rfc5280) (lida em 2026-10-04): seções 4.2.1.1, 4.2.1.2, 4.2.1.3, 4.2.1.9, 6.1 e 6.1.4
- [RFC 8446: The Transport Layer Security (TLS) Protocol Version 1.3, seção 4.4.2](https://www.rfc-editor.org/rfc/rfc8446#section-4.4.2) (lida em 2026-10-04)
- [CA/Browser Forum: Baseline Requirements for TLS Server Certificates, versão 2.3.1](https://github.com/cabforum/servercert/blob/main/docs/BR.md) (lido em 2026-10-04): seção 6.1.5 e o registro de alterações
- [RFC 9155: Deprecating MD5 and SHA-1 Signature Hashes in TLS 1.2 and DTLS 1.2](https://www.rfc-editor.org/rfc/rfc9155) (lida em 2026-10-04)
- [nginx: Configuring HTTPS servers, SSL certificate chains](https://nginx.org/en/docs/http/configuring_https_servers.html) (lido em 2026-10-04)
- [Apache HTTP Server 2.4: mod_ssl, SSLCertificateFile e SSLCertificateChainFile](https://httpd.apache.org/docs/2.4/mod/mod_ssl.html) (lido em 2026-10-04)
- [F5 K13302: Configure the BIG-IP system to use an SSL chain certificate](https://my.f5.com/manage/s/article/K13302) (atualizado em 2025-11-26, lido em 2026-10-04)
- [Mozilla: Intermediate CA Preloading](https://wiki.mozilla.org/Security/CryptoEngineering/Intermediate_Preloading) (lido em 2026-10-04)
- [Let's Encrypt: Chains of Trust](https://letsencrypt.org/certificates/) (lido em 2026-10-04): a hierarquia a que pertence a cadeia do exemplo
