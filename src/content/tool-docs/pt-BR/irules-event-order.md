## O que faz

Escolha o conjunto de perfis de um virtual server Standard (full-proxy) do BIG-IP, se ele tem um perfil Client-SSL, um perfil HTTP, um perfil Server-SSL e um pool, e a ferramenta mostra a ordem em que os eventos comuns de iRule disparam, de `CLIENT_ACCEPTED` até `CLIENT_CLOSED`, como linha do tempo e como lista. É um modelo do comportamento documentado da F5, calculado no seu navegador; ela nunca se conecta a um equipamento.

## Por que a ordem depende do conjunto de perfis

Uma iRule é orientada a eventos: seu código Tcl roda quando um evento nomeado dispara, e quais eventos disparam, e em que ordem, é decidido pela configuração do virtual server, não pelo script. Um virtual server full-proxy processa o lado do cliente e o lado do servidor como duas conexões separadas, então os eventos percorrem fases distintas: a conexão do cliente é aceita, o handshake TLS do lado do cliente é concluído, a requisição HTTP é analisada, um membro do pool é selecionado, a conexão do lado do servidor é aberta, o handshake TLS do lado do servidor é concluído, a requisição é enviada, a resposta retorna e, por fim, os dois lados são fechados. Mude o conjunto de perfis e o conjunto de eventos muda com ele.

## O que cada perfil acrescenta

- **Nenhum perfil além de um pool** deixa os eventos em nível de conexão: `CLIENT_ACCEPTED` no início, os eventos de balanceamento quando um membro é escolhido, `SERVER_CONNECTED` no lado do servidor e os eventos `CLOSED` no fim.
- **Um perfil Client-SSL** acrescenta os eventos de TLS do lado do cliente, como `CLIENTSSL_CLIENTHELLO` e `CLIENTSSL_HANDSHAKE`, antes de a requisição ser processada.
- **Um perfil HTTP** acrescenta os eventos de requisição e resposta, `HTTP_REQUEST` no lado do cliente e `HTTP_REQUEST_SEND` e `HTTP_RESPONSE` no lado do servidor, para você agir sobre cabeçalhos e payload.
- **Um perfil Server-SSL** acrescenta os eventos de TLS do lado do servidor para a conexão com o membro do pool.

A ferramenta também posiciona os eventos condicionais, os caminhos de coleta de dados e o caminho de falha de balanceamento (`LB_FAILED`), onde eles pertencem na sequência.

## Uma nota sobre múltiplas iRules

Quando duas iRules tratam o mesmo evento, a ordem entre elas não é a ordem em que estão listadas; é controlada pelo comando `priority` dentro de cada evento (F5 K12090273), com uma prioridade padrão aplicada quando nenhuma é definida. Esse é um eixo separado da ordem entre eventos que esta ferramenta apresenta.

## Como usar

Alterne os perfis do seu virtual server e leia a sequência de eventos resultante como linha do tempo e como lista. Ela reflete o modelo de eventos documentado da F5 (a Master List of iRule Events e as referências por evento), então é um apoio de planejamento e aprendizado, não uma captura de um sistema ativo.
