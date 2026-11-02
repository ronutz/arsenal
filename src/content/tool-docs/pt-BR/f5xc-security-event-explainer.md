## O que faz

Esta ferramenta decodifica um evento de segurança do F5 Distributed Cloud (XC). Cole o JSON do evento - da página de eventos de segurança do Console, de um global log receiver, ou da API - e ela mostra o que aconteceu: qual serviço de segurança produziu o evento, a ação que foi tomada e se a requisição foi bloqueada, o contexto da requisição, e a razão exata pela qual o evento disparou. Roda inteiramente no seu navegador.

## Os quatro tipos de evento

O XC produz quatro tipos de evento de segurança, e a ferramenta identifica qual você colou pelo campo sec_event_type. Um evento WAF vem do application firewall e carrega signatures, violations, e attack types. Um evento Bot Defense carrega o veredito de bot. Um evento Service Policy carrega a policy e a rule que deram match. Um evento API carrega resultados de validação OpenAPI e policy hits. Se a tag de tipo estiver ausente, a ferramenta infere o tipo pela forma do evento.

## Ação versus recomendação

Um evento de segurança registra tanto o que o WAF recomendou quanto o que ele de fato fez, e esses nem sempre são a mesma coisa. A ação recomendada (ou calculada) reflete o veredito da policy; a ação tomada reflete o enforcement mode. Em modo de monitoramento - ou enquanto uma signature está em staging - o WAF loga um evento completo com signatures e violations mas não bloqueia, então a ação é report mesmo que a signature tenha dado match. A ferramenta mostra ambos, e deriva uma disposição simples: bloqueado, reportado, ou permitido.

## A razão pela qual disparou

A parte mais útil de um evento é por que ele disparou, e isso vive em campos diferentes por tipo. Para um evento WAF, a ferramenta lista cada signature com seu id, nome, accuracy, e attack type, cada violation com seu context, e os attack types detectados. Para um evento Bot Defense, ela mostra o insight (human, good bot, ou malicious), o automation type, e a recomendação. Para um evento Service Policy, ela nomeia a policy, a rule, e o policy set. Para um evento API, ela mostra a policy e a rule que deram match, o status de validação OpenAPI de request e response, e quaisquer signatures. Junto com o request id, isso é suficiente para abrir um caso de suporte ou construir uma exclusão precisa.

## Compartilhar resultado

Abaixo do tipo e da disposição do evento, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva uma cópia do evento depois do `#`, nunca o evento como foi colado. A [Security Events Reference](https://docs.cloud.f5.com/docs-v2/platform/reference/security-events-reference) da F5 (lida em 2026-11-01) lista o que um evento pode trazer: `req_headers` ("Request headers"), `req_body` ("Request body"), `req_parameters`, `user` ("User identifier as configured in User Identification Policy", o identificador do usuário), `tenant`, e o endereço e a localização do cliente. Os headers da requisição trazem cookies e valores de `Authorization`, e um body pode conter uma senha. A página lê um conjunto fixo de campos, então a cópia leva só esses: o tipo e o nome do evento, a ação, o resultado e a recomendação; o método, o host, o path, o endereço do cliente, o load balancer, o namespace, o id da requisição e a hora; o id, o nome, a precisão e o tipo de ataque de cada signature (nunca o `matching_info`, que pode citar a requisição), o nome e o contexto de cada violation, os tipos de ataque, o veredito de bot, e a política e a regra de service policy ou de API. Um envelope (uma string `message`, uma página `events`, uma lista) dá o único evento que a página lê. Antes de oferecer o link, a página lê a cópia de novo e precisa chegar à mesma leitura, senão não há link; depois a cópia passa por uma busca de credenciais que ainda estejam num campo que a página mostra (um token no path): qualquer uma impede o link.

O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. Ele também diz que a cópia mantém o host, o path, o endereço do cliente, o load balancer e o namespace, para você conferir.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A cópia preenche a caixa como se tivesse sido colada, e a página a lê. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
