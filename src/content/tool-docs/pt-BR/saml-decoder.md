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
