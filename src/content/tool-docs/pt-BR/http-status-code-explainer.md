# Explicador de códigos de status HTTP

Cole códigos de status - sozinhos (`404`), vários de uma vez (`301 302 307`) ou famílias inteiras (`5xx`) - e receba cada um decodificado: a família a que pertence, o nome registrado, o significado documentado e as notas operacionais que importam quando o código aparece num log às 3 da manhã.

## O que ele explica

O registro por trás da ferramenta é fundamentado no catálogo de status da RFC 9110 mais as extensões registradas (428/429/431/511 da RFC 6585, o 451 da RFC 7725, o 103 da RFC 8297). As notas carregam as distinções que [o artigo companheiro](/learn/http-status-codes-the-five-families) deste site ensina: quais redirecionamentos preservam o método (307/308) e quais historicamente não preservavam (301/302), por que o 304 é um aperto de mãos de cache e não um redirecionamento, por que o 401 deve chegar com `WWW-Authenticate` enquanto o 403 recusa de qualquer jeito, e a leitura de triagem de incidente do trio de proxy - 502 culpa a conversa com o backend, 503 a capacidade do serviço, 504 o relógio.

## A regra de fallback, como recurso

Cole um código válido que o registro nunca viu - um `599` de algum middlebox - e a ferramenta não dá erro. Ela responde com a própria regra de compatibilidade futura do protocolo: um cliente que não reconhece um código deve tratá-lo como o `x00` da família, então o primeiro dígito sozinho define o comportamento exigido. Essa regra é o motivo de o registro de status ter crescido por trinta anos sem quebrar um único cliente antigo, e a ferramenta a considera uma resposta que vale apresentar, não uma lacuna que mereça desculpas.

## Gramática de entrada

Tokens separados por espaços, vírgulas ou quebras de linha. Cada token é ou três dígitos em 100-599 ou uma família na forma `1xx` a `5xx`. Duplicatas deduplicam preservando a ordem; vinte tokens por rodada é o teto. Tudo roda localmente no seu navegador.

## Fontes

- RFC 9110: HTTP Semantics - o catálogo central, as regras de família e o fallback x00
- RFC 6585: Additional HTTP Status Codes - 428, 429, 431, 511
- RFC 7725: 451 Unavailable For Legal Reasons
- RFC 8297: 103 Early Hints
