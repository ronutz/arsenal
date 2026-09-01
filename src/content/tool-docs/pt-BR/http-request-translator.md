## O que faz

Cole uma requisição HTTP/1.1 crua - do tipo que uma captura, um log de proxy ou um exemplo de RFC entrega - e a ferramenta a transforma no comando `curl` equivalente, na chamada `fetch` do navegador, na invocação HTTPie, no trecho em Python `requests` e na linha de PowerShell. Tudo é analisado no seu navegador; nada é enviado, e nenhuma requisição é executada.

## O inverso do explicador de curl

O [explicador de comando curl](/tools/curl-command-explainer) vai numa direção: comando na entrada, requisição crua entre as saídas. Esta ferramenta vai na outra: requisição crua na entrada, comando executável na saída. As duas existem porque as direções são necessárias em momentos diferentes. Uma captura te entrega uma mensagem; um terminal quer um comando; um relato de defeito quer os dois.

## Como a URL é montada

Uma linha de requisição comum carrega apenas um caminho - `GET /users HTTP/1.1` - porque a conexão já sabe qual é o host. Para produzir algo que se possa executar em qualquer lugar, a ferramenta junta esse alvo ao cabeçalho `Host`. Alvos em forma absoluta, usados por proxies, já vêm completos e são usados como estão. Se o `Host` estiver ausente numa requisição em forma de origem, a ferramenta avisa, porque a URL seria um chute.

## Cabeçalhos que ela deliberadamente descarta

`Host`, `Content-Length` e `Connection` não são reemitidos. Todo cliente os define por conta própria, e repassá-los provoca cabeçalho duplicado ou, pior, um comprimento declarado que não bate mais com o corpo que o cliente vai de fato enviar.

## Sobre o que ela avisa

- **Um `Content-Length` que discorda do corpo.** Servidores e proxies podem então discordar sobre onde a mensagem termina, que é a matéria-prima do contrabando de requisições.
- **Um corpo em pedaços (chunked).** Ele é repassado como colado, e não decodificado; decodificar codificações de transferência é trabalho de um decodificador de mensagens, e não de um tradutor.
- **`http` em claro.** Cabeçalhos e corpo viajam legíveis.
- **Um cabeçalho `Authorization` ou um `Cookie`.** Uma requisição capturada em geral é uma credencial viva, e esse é o aviso que mais importa na prática: o texto que você vai colar num chamado pode ser uma sessão funcionando.

## Como usar

Cole a requisição, leia a linha de requisição e os cabeçalhos já analisados, e copie a forma de que precisar. A conversão é determinística e local, então a mesma requisição sempre produz a mesma saída.
