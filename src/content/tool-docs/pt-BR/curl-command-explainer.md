## O que faz

Cole um comando `curl` e a ferramenta o explica flag por flag, depois o traduz para quatro outras formas: uma chamada `fetch` de navegador, uma requisição HTTP crua, um comando HTTPie e código Python `requests`. O comando é tokenizado e decodificado no seu navegador; nada é jamais enviado, e nenhuma requisição é executada.

## Uma análise, cinco visões

Por baixo há um único passo: a ferramenta analisa seu comando `curl` em um único modelo de requisição, capturando o método, a URL, os headers, o corpo, a autenticação e as demais opções. Tudo o que você vê é derivado desse único modelo. Como traduzir um comando corretamente já exige entender cada flag, a explicação flag por flag é justamente esse mesmo modelo exibido com rótulos, e é por isso que a explicação e as traduções sempre concordam.

## Como as opções são lidas

Toda opção a que o curl dá um argumento também leva esse argumento aqui, como o curl lê, então um valor nunca é confundido com a URL. A lista é a própria tabela de opções do curl ([src/tool_getparam.c](https://raw.githubusercontent.com/curl/curl/master/src/tool_getparam.c), lida em 2026-11-01), conferida com a [man page do curl](https://curl.se/docs/manpage.html) (lida em 2026-11-01). As opções que dão forma à requisição são explicadas uma a uma; qualquer outra aparece com o nome e o argumento. Algumas pedem mais que um nome:

- **`--oauth2-bearer`** é autenticação Bearer ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), seção 2.1): as traduções enviam `Authorization: Bearer` e o token, a não ser que um header `Authorization` seja escrito com `-H`, que é o que o curl envia no lugar.
- **`-u usuário:senha`** é autenticação Basic, o método padrão do curl ([manual do curl](https://curl.se/docs/manpage.html), `--basic`, lido em 2026-11-01): as traduções `fetch` e HTTP crua enviam `Authorization: Basic` e o Base64 de `usuário:senha` ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), seção 2, lida em 2026-11-01), o HTTPie recebe o próprio `-a usuário:senha` e o Python `requests` o próprio `auth=`. Com `--digest`, o HTTPie recebe `-A digest` e o `requests` o `HTTPDigestAuth` ([documentação do requests](https://requests.readthedocs.io/en/latest/user/authentication/), lida em 2026-11-01). Só com o usuário, o curl pede a senha, então `fetch` e HTTP crua não levam o header e o `-a usuário` do HTTPie também pede a senha. Com `--digest`, `--ntlm`, `--negotiate`, `--anyauth` ou `--aws-sigv4` nenhum header Basic é escrito, porque esses métodos respondem a um desafio ou assinam a requisição. Um `Authorization` escrito com `-H`, ou o `--oauth2-bearer`, tem precedência.
- **`--json`** é, nas palavras da man page, um atalho para `--data-binary`, `--header "Content-Type: application/json"` e `--header "Accept: application/json"`: o corpo é o JSON como foi digitado, vários pedaços de `--json` se juntam sem nada entre eles, e um header escrito com `-H` substitui o que o `--json` acrescenta.
- **`--url-query`** acrescenta o argumento ao fim da query da URL, codificado como o `--data-urlencode` codifica, ou como foi escrito quando começa com `+`; um argumento lido de arquivo (`nome@arquivo`) aparece com o nome, mas não pode ser acrescentado.
- **`-U` / `--proxy-user`, `-E` / `--cert`, `--proxy-cert`, `--pass`, `--proxy-pass`, `--tlspassword`, `--proxy-tlspassword`, `--httpsig-key` e `--ftp-account`** são explicadas sem o segredo: o usuário, ou o arquivo do certificado, aparece; uma senha, uma passphrase, uma chave ou dados de conta não.

## As formas que ela produz

- **curl explicado.** Cada opção é nomeada e descrita, para que uma flag desconhecida deixe de ser um mistério.
- **fetch.** A chamada da Fetch API do navegador, seguindo a semântica da MDN, pronta para colar no JavaScript.
- **HTTP cru.** A linha de requisição, os headers e o corpo de fato, como iriam para a rede, que é a forma mais clara de ver exatamente o que uma requisição é.
- **HTTPie.** O comando `http` equivalente, para quem prefere esse cliente.
- **Python requests.** O código equivalente usando a biblioteca Requests.

## Por que traduzir em vez de executar

A ferramenta deliberadamente nunca executa a requisição. Essa é uma escolha de privacidade e segurança: você pode decodificar e converter um comando que carrega credenciais ou aponta para um host interno sem que nada disso saia do seu navegador, e sem disparar o que quer que a requisição faria. Ela é uma tradutora e uma explicadora, não um cliente.

## Como usar

Cole um comando `curl` e leia a explicação flag por flag e as quatro traduções. A conversão é determinística e local, então o mesmo comando sempre produz a mesma saída.

A ferramenta inversa é o [tradutor de requisições HTTP](/tools/http-request-translator): cole uma requisição crua e receba um comando executável. Se você chegou aqui procurando por ela, ela está no nome que a descreve.

## Compartilhar resultado

Abaixo da linha da requisição, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o comando depois do `#` com toda credencial trocada por `REDACTED`, nunca como foi digitado: um comando curl colado durante a depuração de uma API muitas vezes tem uma, e esta página mostra em claro os valores dos headers, os cookies e, na tradução para Python, a senha do `-u`. O popover diz primeiro o que o link leva e quantos valores foram trocados, e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

O que é trocado, cada valor onde a [man page do curl](https://curl.se/docs/manpage.html) (lida em 2026-11-01) ou um padrão HTTP o define:

- **`-u` / `--user` e `-U` / `--proxy-user`**: a senha ("The username and passwords are split up on the first colon", usuário e senha se separam no primeiro dois-pontos); o usuário fica.
- **`--oauth2-bearer`, `--pass`, `--proxy-pass`, `--tlspassword`, `--proxy-tlspassword` e `--ftp-account`**: o valor inteiro; **`--httpsig-key`** também, a não ser que indique um arquivo com `@`. **`-E` / `--cert` e `--proxy-cert`**: a senha depois do primeiro dois-pontos do certificado que não esteja escrito como `\:`.
- **`-H` / `--header` e `--proxy-header`**, pelo nome do campo: `Authorization` e `Proxy-Authorization` mantêm o esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seções 11.6.2 e 11.7.2: o valor "consists of credentials", é feito de credenciais); o Basic mantém o user-id e perde a senha ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), seção 2); um JWT mantém o header protegido e perde as claims e a assinatura ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1); uma credencial AWS Signature Version 4 (`AWS4-HMAC-SHA256`) mantém o escopo da credencial e o `SignedHeaders` e perde o ID da chave de acesso e a assinatura ([Create a signed AWS API request](https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html), lida em 2026-11-01); o `Cookie` mantém os nomes; um campo com nome de segredo (`X-API-Key`, `X-Auth-Token`) vai inteiro; um token dentro de qualquer outro valor sai.
- **`-b` / `--cookie`**: cada valor de `NAME1=VALUE1; NAME2=VALUE2` ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seção 4.2.1); um nome de arquivo fica.
- **`-d` e a família `--data`, `--json`, `--url-query` e `-F`**: membros JSON e parâmetros `nome=valor` cujo nome indica segredo: `access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), seções 2.2 e 2.3), `refresh_token`, `client_secret`, `password` e `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), seções 2.3.1, 4.1.2, 4.3.2 e 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), seção 4.5), e qualquer nome terminado em token, secret, password ou api key. Um `@arquivo` fica.
- **A URL, `--url`, `-x` / `--proxy` e `-e` / `--referer`**: a senha de um `usuário:senha@` ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1) e os parâmetros secretos da query e do fragmento; do `X-Amz-Credential`, só o ID da chave de acesso. O argumento de qualquer outra opção é lido do mesmo jeito, então um `--preproxy` ou um host SOCKS escrito com `usuário:senha@` perde a senha.

Um valor vazio, um placeholder ou uma variável do shell (`$TOKEN`) fica. Cada troca é escrita no lugar, então a cópia mantém as aspas, os espaços e as continuações de linha do que foi colado; um valor escrito com escapes no meio é recolocado entre aspas inteiro. Os vetores de compartilhamento da ferramenta conferem que a página que abre o link lê a mesma requisição. Se sobrar uma chave ou token onde nenhum nome o marca (um JWT no caminho da URL, uma chave privada), não há link: o popover diz a linha, e você coloca um placeholder ali e clica de novo.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então a cópia não é enviada ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue ler.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A cópia preenche a caixa como se tivesse sido colada e a página a explica; nada é enviado nem executado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
