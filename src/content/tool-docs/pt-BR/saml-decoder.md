## O que faz

Cole uma resposta ou asserção SAML, como XML bruto, base64 ou URL-encoded, e a ferramenta a decodifica: o emissor, o status, o sujeito, as condições, a audiência e os atributos. Ela roda uma avaliação de segurança baseada em regras junto com a decodificação, e analisa o XML de um jeito protegido contra XXE. Tudo acontece no seu navegador.

## SAML em resumo

SAML, Security Assertion Markup Language, é o padrão baseado em XML por trás de boa parte do single sign-on corporativo. Depois que você se autentica, um provedor de identidade emite uma **Assertion** assinada, geralmente envolta em uma **Response**, que afirma quem você é para um provedor de serviço. As partes que a ferramenta extrai são as que decidem se aquela asserção deve ser confiável: o **Issuer** (qual IdP), o **Status** (se a autenticação teve sucesso), o **Subject** e seu NameID (quem), as **Conditions** (a janela de validade e a **AudienceRestriction** que nomeia para quem a asserção se destina) e os **Attributes** (as afirmações sobre o usuário). Como o SAML trafega codificado em base64 no binding HTTP-POST e comprimido com DEFLATE no HTTP-Redirect, a ferramenta normaliza essas codificações primeiro.

## O modelo de segurança: rejeição de XXE

A propriedade principal desta ferramenta é como ela analisa. XML não confiável é perigoso por causa de ataques de XML External Entity (XXE) e de ataques de expansão de entidades como o billion laughs, e ambos exigem que o documento declare uma DTD, por meio de um `DOCTYPE` ou de uma declaração `<!ENTITY>`, para definir suas entidades. Uma mensagem SAML legítima nunca precisa de uma DTD, então o analisador rejeita de imediato qualquer documento que contenha uma. Essa única regra derrota o XXE clássico e a expansão billion laughs por construção, em vez de tentar sanitizá-los depois.

## O que a avaliação verifica

Além de decodificar, a ferramenta avalia a mensagem em relação às orientações de segurança do SAML: se ela está assinada, se depende de algoritmos de assinatura ou de digest fracos (como o SHA-1), e se suas condições e audiência estão presentes e coerentes. Se a asserção estiver criptografada, a ferramenta detecta o `EncryptedAssertion` e o reporta, em vez de tentar descriptografá-lo. Essas verificações espelham as perguntas da orientação de SAML do OWASP, então a saída aponta para as coisas que de fato causam vulnerabilidades de SAML.

## Como usar

Cole uma resposta ou asserção SAML em qualquer uma de suas formas comuns e leia o emissor, o status, o sujeito, as condições, a audiência e os atributos decodificados, junto com a avaliação de segurança. A análise é determinística e local, e o analisador que rejeita DTD a torna segura para inspecionar mensagens não confiáveis.

Para ler uma mensagem longa organizada linha a linha, o [formatador e validador de XML](/tools/xml-formatter) a formata; a documentação dele explica por que uma mensagem assinada não pode ser repassada reformatada.

## Compartilhar resultado

Abaixo dos selos do resultado, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a mensagem como foi colada depois do `#` (XML puro, URL-encoded ou base64), assim que a página a decodifica. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. Uma mensagem SAML cita o seu identity provider e o seu service provider, e um subject pode identificar uma pessoa, então o popover pede que você a confira antes de mandar o link.

Uma mensagem que traz uma credencial não ganha link: uma assertion assinada, uma assertion dentro de uma Response assinada, ou uma `EncryptedAssertion`. O [SAML 2.0 Profiles](https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf) (OASIS, lido em 2026-11-01) diz, sobre o método bearer, que "the subject of the assertion is the bearer of the assertion" (seção 3.3), e que as assertions entregues pelo binding HTTP POST "MUST be signed" (seção 4.1.4.5); o service provider só guarda os IDs usados enquanto a assertion for válida. Então uma assertion assinada serve de login para o subject, e um link a entregaria a qualquer pessoa que o recebesse até ela expirar; uma criptografada ([SAML 2.0 Core](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf), seção 2.3.4) é uma que o service provider consegue abrir. Tirar a assinatura mudaria o que esta página mostra, então a mensagem também não é copiada. Uma AuthnRequest, uma LogoutRequest ou LogoutResponse, metadata, uma Response de erro (que "MUST NOT include any assertions", seção 4.1.4.2 do Profiles) e uma assertion sem assinatura ganham link.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A mensagem preenche a caixa como se tivesse sido colada e a página a decodifica, localmente; ela nunca verifica, busca nem descriptografa nada. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
