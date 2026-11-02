## O que faz

Esta ferramenta mapeia entre os níveis de segurança TLS do F5 Distributed Cloud (XC) e as cipher suites que eles negociam, nas duas direções. Escolha um nível - **High**, **Medium** ou **Low** - e ela mostra as versões TLS mínima e máxima exatas e a lista completa de ciphers, com cada suite anotada por key exchange, forward secrecy e força. Ou cole uma cipher suite (forma IANA `TLS_*` ou forma OpenSSL com traços) ou uma linha inteira de scanner, e ela diz quais níveis incluem aquele cipher. Tudo roda no seu navegador.

## A tabela em que ela se baseia

As listas de ciphers são transcritas verbatim da Referência TLS da F5. Duas coisas nessa tabela pegam as pessoas de surpresa. Primeiro, **Default é o nível High**: é mínimo TLS 1.2, máximo TLS 1.3, e é o que um HTTPS load balancer com certificado automático usa. Segundo, os níveis são **cumulativos** - Medium é todo cipher de High mais quatro suites ECDHE-CBC, e Low é todo cipher de Medium mais quatro suites RSA estáticas. Todo nível chega no máximo a TLS 1.3.

## Por que seu scanner sinaliza um load balancer

Duas perguntas de campo aparecem o tempo todo, e a ferramenta responde as duas. Se um scanner reporta **TLS 1.0 ou 1.1 habilitado**, o load balancer está em **Medium ou Low** - esses níveis são mínimo TLS 1.0. O nível Default/High é mínimo TLS 1.2, então ele não apresenta os protocolos antigos (K000148226). Se um scanner reporta **ciphers fracos**, quase sempre são as **suites RSA estáticas que o nível Low adiciona** - elas não têm forward secrecy, que é exatamente o que um scanner rebaixa (K000148079).

## O que as anotações significam

Todo cipher é marcado com seu key exchange (TLS 1.3, ECDHE-ECDSA, ECDHE-RSA ou RSA), se ele fornece forward secrecy (PFS) e uma nota de força. As suites ECDHE são PFS; as suites RSA estáticas não são. TLS 1.3 e as suites AEAD (GCM / ChaCha20) são fortes; as suites CBC-SHA são médias; as suites RSA estáticas são fracas.

## Compartilhar resultado

Cada modo tem o próprio botão **Compartilhar resultado**, abaixo da própria resposta, que cria um link para esta página, só quando você clica, levando o valor daquele modo depois do `#`: abaixo dos ciphers do nível, o nível escolhido; abaixo dos níveis do cipher, a linha de cipher digitada, assim que um cipher nela é reconhecido. Um nível ou uma cipher suite não cita nenhum sistema nem pessoa. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O nível é escolhido e a linha de cipher é preenchida, como se tivessem sido clicados e digitados; as duas leituras aparecem. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
