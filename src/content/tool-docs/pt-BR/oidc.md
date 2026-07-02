## O que faz

Cole um ID token do OpenID Connect ou o documento `.well-known/openid-configuration` de um provedor, e a ferramenta o decodifica. Para um ID token, ela lê as claims principais de identidade, as claims de perfil padrão e os hashes de vínculo, e executa um conjunto de verificações de segurança. Para um documento de discovery, ela apresenta os endpoints e as capacidades do provedor. Ela detecta automaticamente qual dos dois você colou, e tudo roda no seu navegador.

## OIDC em um parágrafo

O OpenID Connect é uma camada de identidade construída sobre o OAuth 2.0. O OAuth responde "o que este aplicativo tem permissão de fazer"; o OIDC acrescenta "e quem é o usuário". Ele faz isso fazendo o provedor emitir um **ID token**, um JWT assinado que afirma quem entrou, junto com o access token do OAuth. Como um ID token é um JWT, a ferramenta o decodifica pelo mesmo núcleo de JWT usado em outras partes do site, e então o interpreta com o significado específico do OIDC.

## O ID token e suas verificações

As claims principais identificam o token: `iss` (quem o emitiu), `sub` (o identificador estável do usuário), `aud` (o cliente para o qual foi emitido) e as claims de tempo. Além dessas, o OIDC adiciona claims que vale entender: `nonce`, um valor que o cliente gera e o provedor devolve para que um token reproduzido possa ser detectado; `at_hash` e `c_hash`, que vinculam o ID token ao access token e ao código de autorização para que não possam ser trocados; `amr`, os métodos de autenticação usados (valores como `pwd`, `otp` ou `mfa`, registrados na RFC 8176); e claims de perfil padrão como `name` e `email`. As verificações de segurança da ferramenta olham exatamente o que um cliente cuidadoso olharia: que as claims obrigatórias estão presentes, que o algoritmo de assinatura é sólido em vez de `none` ou fraco, que há um nonce presente, e que a audiência é a que você espera.

## O documento de discovery

O documento `.well-known/openid-configuration` é como um provedor se anuncia. Ele lista os endpoints de que um cliente precisa (autorização, token, userinfo e o `jwks_uri` onde ficam as chaves de assinatura), os scopes e os tipos de resposta que ele suporta, os algoritmos com que assinará os ID tokens e os métodos de code challenge do PKCE que aceita. Lê-lo diz num relance o que um provedor suporta e se ele anuncia proteções modernas como o PKCE `S256`.

## Como usar

Cole um ID token para decodificar suas claims e ver a avaliação de segurança, ou cole um documento de discovery para ler os endpoints e as capacidades de um provedor. A decodificação é uma leitura pura do que o token ou o documento contém; ela não contata o provedor.
