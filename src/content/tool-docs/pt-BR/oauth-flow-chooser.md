# Seletor de fluxo OAuth

A primeira pergunta de toda integração OAuth ou OpenID Connect - PingFederate, PingAM, PingOne, ou qualquer outra - é *qual fluxo*. Esta ferramenta codifica a resposta moderna como uma decisão determinística, e cita a RFC por trás de cada linha.

## Três perguntas

Que tipo de app é (web server-side, SPA, nativo, serviço-a-serviço, ou um dispositivo de entrada limitada)? Ele precisa saber **quem** é o usuário (esse é o trabalho do OpenID Connect, em camada sobre o mesmo fluxo)? Precisa de acesso com o usuário ausente (refresh tokens)?

## As respostas que ela dá

Apps server, SPA e nativos recebem todos **authorization code** - confidencial com segredo onde existe backend, público **com PKCE** (RFC 7636) onde não existe, e a regra do navegador-do-sistema da RFC 8252 explicitada para nativos. Serviço-a-serviço recebe **client credentials** (RFC 6749 §4.4) com a nota de que refresh tokens NÃO DEVEM ser emitidos ali. TVs e quiosques recebem o **device grant** (RFC 8628) com sua dança do user_code num segundo dispositivo.

## A metade que importa tanto quanto

Todo resultado inclui a lista de *evitados*: **implicit** e **ROPC (password)** aposentados pelo nome, conforme a Best Current Practice de Segurança do OAuth 2.0 (RFC 9700), com os motivos - tokens em fragmentos, credenciais dentro de apps - ditos com clareza. Clientes públicos pedindo acesso offline recebem a exigência de **rotação** de refresh tokens; pedir identidade de usuário final a um fluxo máquina-a-máquina gera um aviso de contradição em vez de uma resposta errada.

Tudo é decidido localmente; as três respostas não carregam segredos e nada é transmitido.
