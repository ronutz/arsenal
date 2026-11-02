# Seletor de fluxo OAuth

A primeira pergunta de toda integração OAuth ou OpenID Connect - PingFederate, PingAM, PingOne, ou qualquer outra - é *qual fluxo*. Esta ferramenta codifica a resposta moderna como uma decisão determinística, e cita a RFC por trás de cada linha.

## Três perguntas

Que tipo de app é (web server-side, SPA, nativo, serviço-a-serviço, ou um dispositivo de entrada limitada)? Ele precisa saber **quem** é o usuário (esse é o trabalho do OpenID Connect, em camada sobre o mesmo fluxo)? Precisa de acesso com o usuário ausente (refresh tokens)?

## As respostas que ela dá

Apps server, SPA e nativos recebem todos **authorization code** - confidencial com segredo onde existe backend, público **com PKCE** (RFC 7636) onde não existe, e a regra do navegador-do-sistema da RFC 8252 explicitada para nativos. Serviço-a-serviço recebe **client credentials** (RFC 6749 §4.4) com a nota de que refresh tokens NÃO DEVEM ser emitidos ali. TVs e quiosques recebem o **device grant** (RFC 8628) com sua dança do user_code num segundo dispositivo.

## A metade que importa tanto quanto

Todo resultado inclui a lista de *evitados*: **implicit** e **ROPC (password)** aposentados pelo nome, conforme a Best Current Practice de Segurança do OAuth 2.0 (RFC 9700), com os motivos - tokens em fragmentos, credenciais dentro de apps - ditos com clareza. Clientes públicos pedindo acesso offline recebem a exigência de **rotação** de refresh tokens; pedir identidade de usuário final a um fluxo máquina-a-máquina gera um aviso de contradição em vez de uma resposta errada.

Tudo é decidido localmente; as três respostas não carregam segredos e nada é transmitido.

## Compartilhar resultado

Abaixo do nome e do grant do fluxo recomendado, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva as suas três respostas depois do `#`: o tipo de aplicação pelo nome estável (`app=spa`) e cada pergunta a que você respondeu sim (`identity=1`, `offline=1`). Nada do que você digita vai, porque não há o que digitar. O popover dele diz primeiro o que o link leva e depois oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então as respostas não são enviadas ao servidor quando o link é aberto; elas ficam na barra de endereço e no histórico de quem abre.

- **Ao abrir um link.** As três respostas substituem as do formulário e a página recomenda o mesmo fluxo, no navegador. Um tipo de aplicação que a página não oferece, ou uma resposta diferente de 1 ou 0, faz o link inteiro ser ignorado. Nos dois casos os valores saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
