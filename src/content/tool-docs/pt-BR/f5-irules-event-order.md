## O que faz

Escolha o conjunto de perfis de um virtual server Standard (full-proxy) do BIG-IP, se ele tem um perfil Client-SSL, um perfil HTTP, um perfil Server-SSL e um pool, e a ferramenta mostra a ordem em que os eventos comuns de iRule disparam, de `CLIENT_ACCEPTED` até `CLIENT_CLOSED`, como linha do tempo e como lista. É um modelo do comportamento documentado da F5, calculado no seu navegador; ela nunca se conecta a um equipamento.

## Por que a ordem depende do conjunto de perfis

Uma iRule é orientada a eventos: seu código Tcl roda quando um evento nomeado dispara, e quais eventos disparam, e em que ordem, é decidido pela configuração do virtual server, não pelo script. Um virtual server full-proxy processa o lado do cliente e o lado do servidor como duas conexões separadas, então os eventos percorrem fases distintas: a conexão do cliente é aceita, o handshake TLS do lado do cliente é concluído, a requisição HTTP é analisada, um membro do pool é selecionado, a conexão do lado do servidor é aberta, o handshake TLS do lado do servidor é concluído, a requisição é enviada, a resposta retorna e, por fim, os dois lados são fechados. Mude o conjunto de perfis e o conjunto de eventos muda com ele.

## O que cada perfil acrescenta

- **Nenhum perfil além de um pool** deixa os eventos em nível de conexão: `CLIENT_ACCEPTED` no início, os eventos de balanceamento quando um membro é escolhido, `SERVER_CONNECTED` no lado do servidor e os eventos `CLOSED` no fim.
- **Um perfil Client-SSL** acrescenta os eventos de TLS do lado do cliente, como `CLIENTSSL_CLIENTHELLO` e `CLIENTSSL_HANDSHAKE`, antes de a requisição ser processada.
- **Um perfil HTTP** acrescenta os eventos de requisição e resposta, `HTTP_REQUEST` no lado do cliente e `HTTP_REQUEST_SEND` e `HTTP_RESPONSE` no lado do servidor, para você agir sobre headers e payload.
- **Um perfil Server-SSL** acrescenta os eventos de TLS do lado do servidor para a conexão com o membro do pool.
- **Um perfil JSON ou SSE** fica fora deste modelo. O BIG-IP 21.0.0 introduziu os eventos JSON ([`JSON_REQUEST`](https://clouddocs.f5.com/api/irules/JSON_REQUEST.html), `JSON_RESPONSE` e as variantes de erro e de ausência) e o [`SSE_RESPONSE`](https://clouddocs.f5.com/api/irules/SSE_RESPONSE.html), e eles precisam de um perfil JSON ou SSE no virtual server junto com o perfil HTTP ([referência de perfis do BIG-IP 21.0](https://techdocs.f5.com/en-us/bigip-21-0-0/big-ip-local-traffic-management-profiles-reference/model-context-protocol.html), lida em 2026-10-26). A ferramenta os nomeia nas notas em vez de posicioná-los na sequência.

A ferramenta também posiciona os eventos condicionais, os caminhos de coleta de dados e o caminho de falha de balanceamento (`LB_FAILED`), onde eles pertencem na sequência.

## Uma nota sobre múltiplas iRules

Quando duas iRules tratam o mesmo evento, a ordem entre elas não é a ordem em que estão listadas; é controlada pelo comando `priority` dentro de cada evento (F5 K12090273), com uma prioridade padrão aplicada quando nenhuma é definida. Esse é um eixo separado da ordem entre eventos que esta ferramenta apresenta.

## Como usar

Alterne os perfis do seu virtual server e leia a sequência de eventos resultante como linha do tempo e como lista. Ela reflete o modelo de eventos documentado da F5 (a Master List of iRule Events e as referências por evento), então é um apoio de planejamento e aprendizado, não uma captura de um sistema ativo.

## Compartilhar resultado

Acima da sequência de eventos, **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva as cinco opções de perfil pelo nome, cada uma como `1` ou `0` (`#clientssl=1&http=1&serverssl=1&pool=1&fastl4=0`), e mais nada; sempre existe uma sequência, então um conjunto com todas as opções desligadas também ganha link. Tudo o que o link leva vai depois do `#`, e a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado): o navegador não o envia ao servidor quando o link é aberto, mas ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** Um link leva no máximo 16.384 caracteres, o limite que o site usa para todo valor depois do `#`; cinco opções são bem mais curtas.
- **Ao abrir um link.** As opções assumem os valores do link (uma opção que o link não leva fica desligada) e a sequência é desenhada, como se você tivesse clicado nelas. Um valor diferente de `1` ou `0` faz o link inteiro ser ignorado. Aceitos ou não, os valores saem do endereço da própria página na hora, sem nenhuma requisição, então recarregar, salvar nos favoritos ou usar o botão Compartilhar da própria página não leva nada que você não escolheu compartilhar.
