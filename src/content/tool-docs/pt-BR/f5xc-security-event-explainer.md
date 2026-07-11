## O que faz

Esta ferramenta decodifica um evento de segurança do F5 Distributed Cloud (XC). Cole o JSON do evento - da página de eventos de segurança do Console, de um global log receiver, ou da API - e ela mostra o que aconteceu: qual serviço de segurança produziu o evento, a ação que foi tomada e se a requisição foi bloqueada, o contexto da requisição, e a razão exata pela qual o evento disparou. Roda inteiramente no seu navegador.

## Os quatro tipos de evento

O XC produz quatro tipos de evento de segurança, e a ferramenta identifica qual você colou pelo campo sec_event_type. Um evento WAF vem do application firewall e carrega signatures, violations, e attack types. Um evento Bot Defense carrega o veredito de bot. Um evento Service Policy carrega a policy e a rule que deram match. Um evento API carrega resultados de validação OpenAPI e policy hits. Se a tag de tipo estiver ausente, a ferramenta infere o tipo pela forma do evento.

## Ação versus recomendação

Um evento de segurança registra tanto o que o WAF recomendou quanto o que ele de fato fez, e esses nem sempre são a mesma coisa. A ação recomendada (ou calculada) reflete o veredito da policy; a ação tomada reflete o enforcement mode. Em modo de monitoramento - ou enquanto uma signature está em staging - o WAF loga um evento completo com signatures e violations mas não bloqueia, então a ação é report mesmo que a signature tenha dado match. A ferramenta mostra ambos, e deriva uma disposição simples: bloqueado, reportado, ou permitido.

## A razão pela qual disparou

A parte mais útil de um evento é por que ele disparou, e isso vive em campos diferentes por tipo. Para um evento WAF, a ferramenta lista cada signature com seu id, nome, accuracy, e attack type, cada violation com seu context, e os attack types detectados. Para um evento Bot Defense, ela mostra o insight (human, good bot, ou malicious), o automation type, e a recomendação. Para um evento Service Policy, ela nomeia a policy, a rule, e o policy set. Para um evento API, ela mostra a policy e a rule que deram match, o status de validação OpenAPI de request e response, e quaisquer signatures. Junto com o request id, isso é suficiente para abrir um caso de suporte ou construir uma exclusão precisa.
