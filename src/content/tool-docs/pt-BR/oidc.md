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

## Compartilhar resultado

Abaixo dos selos e das constatações, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica. O que ele leva depois do `#` depende do que você colou, e o popover diz o quê antes de qualquer cópia; depois oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

- **Um ID token.** O link leva o header e as claims: os dois primeiros segmentos exatamente como foram colados, seguidos de um segmento de assinatura vazio (`header.payload.`), e uma marca dizendo que o token colado era assinado. Nunca a assinatura, nunca o token como foi colado. Um ID token é um JWT que o token endpoint devolve junto de um access token bearer ([OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html), seções 2 e 3.1.3.3, lida em 2026-11-01), e sem a assinatura a cópia não é um token que algum verificador aceite ([RFC 7515](https://www.rfc-editor.org/rfc/rfc7515), seção 5.2, lida em 2026-11-01: quando nenhuma assinatura é validada, "the JWS MUST be considered invalid"). O popover acrescenta um aviso: as claims identificam uma pessoa, então leia antes de mandar o link. Um header cujo membro `jwk` traz material de chave privada não ganha link.
- **Um documento de discovery.** O link leva o documento como foi digitado: o provedor tem de publicá-lo em `/.well-known/openid-configuration` ([OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html), seção 4, lida em 2026-11-01), então ele é público. Um texto que também traga uma credencial, como o arquivo de configuração de uma aplicação costuma trazer, não ganha link, e o popover cita o membro: `client_secret` ([RFC 7591](https://www.rfc-editor.org/rfc/rfc7591), seção 3.2.1), `registration_access_token` ([RFC 7592](https://www.rfc-editor.org/rfc/rfc7592), seção 3), `access_token` ou `refresh_token` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), seção 5.1), `id_token` (OpenID Connect Core 1.0, seção 3.1.3.3) ou um JWK com membros privados ([RFC 7518](https://www.rfc-editor.org/rfc/rfc7518), seção 6), todos lidos em 2026-11-01. Esta página nunca mostra esses membros, mas um link do texto colado os levaria; tire-os e clique de novo.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então os valores não são enviados ao servidor quando o link é aberto; eles ficam na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-los.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho dele.
- **Ao abrir um link.** O valor preenche a caixa e a página o decodifica como numa colagem: as mesmas claims, datas e constatações de um token (o selo o mostra assinado quando o de quem mandou era, com uma nota dizendo que a assinatura ficou fora do link), os mesmos endpoints e recursos de um documento. Nada é buscado: a página nunca chama o `jwks_uri` nem qualquer endpoint. Um token inteiro, um documento com credencial ou qualquer coisa que a página recuse é ignorado. Nos dois casos o valor sai do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
