## O que faz

Cole uma requisição HTTP/1.1 crua - do tipo que uma captura, um log de proxy ou um exemplo de RFC entrega - e a ferramenta a transforma no comando `curl` equivalente, na chamada `fetch` do navegador, na invocação HTTPie, no trecho em Python `requests` e na linha de PowerShell. Tudo é analisado no seu navegador; nada é enviado, e nenhuma requisição é executada.

## O inverso do explicador de curl

O [explicador de comando curl](/tools/curl-command-explainer) vai numa direção: comando na entrada, requisição crua entre as saídas. Esta ferramenta vai na outra: requisição crua na entrada, comando executável na saída. As duas existem porque as direções são necessárias em momentos diferentes. Uma captura te entrega uma mensagem; um terminal quer um comando; um relato de defeito quer os dois.

## Como a URL é montada

Uma linha de requisição comum carrega apenas um caminho - `GET /users HTTP/1.1` - porque a conexão já sabe qual é o host. Para produzir algo que se possa executar em qualquer lugar, a ferramenta junta esse alvo ao header `Host`. Alvos em forma absoluta, usados por proxies, já vêm completos e são usados como estão. Se o `Host` estiver ausente numa requisição em forma de origem, a ferramenta avisa, porque a URL seria um chute.

## Headers que ela deliberadamente descarta

`Host`, `Content-Length` e `Connection` não são reemitidos. Todo cliente os define por conta própria, e repassá-los provoca header duplicado ou, pior, um comprimento declarado que não bate mais com o corpo que o cliente vai de fato enviar.

## Sobre o que ela avisa

- **Um `Content-Length` que discorda do corpo.** Servidores e proxies podem então discordar sobre onde a mensagem termina, que é a matéria-prima do contrabando de requisições.
- **Um corpo em pedaços (chunked).** Ele é repassado como colado, e não decodificado; decodificar codificações de transferência é trabalho de um decodificador de mensagens, e não de um tradutor.
- **`http` em claro.** Headers e corpo viajam legíveis.
- **Um header `Authorization` ou um `Cookie`.** Uma requisição capturada em geral é uma credencial viva, e esse é o aviso que mais importa na prática: o texto que você vai colar num chamado pode ser uma sessão funcionando.

## Como usar

Cole a requisição, leia a linha de requisição e os headers já analisados, e copie a forma de que precisar. A conversão é determinística e local, então a mesma requisição sempre produz a mesma saída.

## Compartilhar resultado

Abaixo da linha da requisição e dos avisos, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a requisição depois do `#` com toda credencial mascarada, nunca como foi digitada: uma requisição capturada costuma trazer um header Authorization ou um cookie de sessão, e esta página mostra todo valor de header em claro e em cinco traduções. O popover diz primeiro o que o link leva e quantos valores foram mascarados, e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

O que é mascarado:

- **Campos de header**, pelo nome: `Authorization` e `Proxy-Authorization` mantêm o esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seções 11.6.2 e 11.7.2: o valor "consists of credentials", é feito de credenciais); o Basic mantém o user-id e perde a senha ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), seção 2); um JWT mantém o header protegido e perde as claims e a assinatura ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1); todo valor de `Cookie` sai ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seção 4.2.1); um campo com nome de segredo (`X-API-Key`) vai inteiro; um token dentro de qualquer outro valor (um `Referer` com code) sai. Cada um vira `REDACTED`.
- **O alvo da requisição**: a senha de um `usuário:senha@` ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1) e os parâmetros secretos da query viram `REDACTED`.
- **O corpo**: membros JSON e parâmetros de formulário com nome de segredo (`access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), seções 2.2 e 2.3), `refresh_token`, `client_secret`, `password` e `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), seções 2.3.1, 4.1.2, 4.3.2 e 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), seção 4.5), e qualquer nome terminado em token, secret, password ou api key) são preenchidos com `*` para cada octeto, então o corpo mantém o tamanho: um `Content-Length` que batia continua batendo.

Os vetores de compartilhamento da ferramenta conferem que a página que abre o link lê a mesma requisição (os mesmos avisos, campos e tamanho de corpo). Se sobrar uma chave ou token onde nenhum nome o marca (um JWT colado como corpo de texto puro), não há link: o popover diz a linha.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então a cópia não é enviada ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue ler.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A cópia preenche a caixa como se tivesse sido colada e a página a traduz; nada é enviado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
