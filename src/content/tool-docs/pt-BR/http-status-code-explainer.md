# Explicador de códigos de status HTTP

Cole códigos de status - sozinhos (`404`), vários de uma vez (`301 302 307`) ou famílias inteiras (`5xx`) - e receba cada um decodificado: a família a que pertence, o nome registrado, o significado documentado e as notas operacionais que importam quando o código aparece num log às 3 da manhã.

## O que ele explica

O registro por trás da ferramenta é fundamentado no catálogo de status da RFC 9110 mais as extensões registradas (428/429/431/511 da RFC 6585, o 451 da RFC 7725, o 103 da RFC 8297). As notas carregam as distinções que [o artigo companheiro](/learn/http-status-codes-the-five-families) deste site ensina: quais redirecionamentos preservam o método (307/308) e quais historicamente não preservavam (301/302), por que o 304 é um handshake de cache e não um redirecionamento, por que o 401 deve chegar com `WWW-Authenticate` enquanto o 403 recusa de qualquer jeito, e a leitura de triagem de incidente do trio de proxy - 502 culpa a conversa com o backend, 503 a capacidade do serviço, 504 o relógio.

## A regra de fallback, como recurso

Cole um código válido que o registro nunca viu - um `599` de algum middlebox - e a ferramenta não dá erro. Ela responde com a própria regra de compatibilidade futura do protocolo: um cliente que não reconhece um código deve tratá-lo como o `x00` da família, então o primeiro dígito sozinho define o comportamento exigido. Essa regra é o motivo de o registro de status ter crescido por trinta anos sem quebrar um único cliente antigo, e a ferramenta a considera uma resposta que vale apresentar, não uma lacuna que mereça desculpas.

## Gramática de entrada

Tokens separados por espaços, vírgulas ou quebras de linha. Cada token é ou três dígitos em 100-599 ou uma família na forma `1xx` a `5xx`. Duplicatas deduplicam preservando a ordem; vinte tokens por rodada é o teto. Tudo roda localmente no seu navegador.

## Compartilhar resultado

No alto da leitura, acima dos cartões, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a caixa como foi digitada depois do `#`, e mais nada: códigos de status e famílias, que não dizem nada sobre você. O popover diz primeiro o que o link leva, e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. Os links do decodificador de mensagens HTTP que passam um código de status para esta página usam o mesmo `#input=` e preenchem a caixa do mesmo jeito.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o texto não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue ler.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O texto preenche a caixa como se tivesse sido digitado e a página o explica; nada é enviado a lugar nenhum. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Fontes

- RFC 9110: HTTP Semantics - o catálogo central, as regras de família e o fallback x00
- RFC 6585: Additional HTTP Status Codes - 428, 429, 431, 511
- RFC 7725: 451 Unavailable For Legal Reasons
- RFC 8297: 103 Early Hints
- RFC 3986: URI Generic Syntax - seção 3.5, o fragmento, que o link de Compartilhar resultado usa (lida em 2026-11-01)
