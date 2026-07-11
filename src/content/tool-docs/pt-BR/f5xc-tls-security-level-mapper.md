## O que faz

Esta ferramenta mapeia entre os níveis de segurança TLS do F5 Distributed Cloud (XC) e as cipher suites que eles negociam, nas duas direções. Escolha um nível - **High**, **Medium** ou **Low** - e ela mostra as versões TLS mínima e máxima exatas e a lista completa de ciphers, com cada suite anotada por key exchange, forward secrecy e força. Ou cole uma cipher suite (forma IANA `TLS_*` ou forma OpenSSL com traços) ou uma linha inteira de scanner, e ela diz quais níveis incluem aquele cipher. Tudo roda no seu navegador.

## A tabela em que ela se baseia

As listas de ciphers são transcritas verbatim da Referência TLS da F5. Duas coisas nessa tabela pegam as pessoas de surpresa. Primeiro, **Default é o nível High**: é mínimo TLS 1.2, máximo TLS 1.3, e é o que um HTTPS load balancer com certificado automático usa. Segundo, os níveis são **cumulativos** - Medium é todo cipher de High mais quatro suites ECDHE-CBC, e Low é todo cipher de Medium mais quatro suites RSA estáticas. Todo nível chega no máximo a TLS 1.3.

## Por que seu scanner sinaliza um load balancer

Duas perguntas de campo aparecem o tempo todo, e a ferramenta responde as duas. Se um scanner reporta **TLS 1.0 ou 1.1 habilitado**, o load balancer está em **Medium ou Low** - esses níveis são mínimo TLS 1.0. O nível Default/High é mínimo TLS 1.2, então ele não apresenta os protocolos antigos (K000148226). Se um scanner reporta **ciphers fracos**, quase sempre são as **suites RSA estáticas que o nível Low adiciona** - elas não têm forward secrecy, que é exatamente o que um scanner rebaixa (K000148079).

## Lendo as anotações

Todo cipher é marcado com seu key exchange (TLS 1.3, ECDHE-ECDSA, ECDHE-RSA ou RSA), se ele fornece forward secrecy (PFS) e uma nota de força. As suites ECDHE são PFS; as suites RSA estáticas não são. TLS 1.3 e as suites AEAD (GCM / ChaCha20) são fortes; as suites CBC-SHA são médias; as suites RSA estáticas são fracas.
