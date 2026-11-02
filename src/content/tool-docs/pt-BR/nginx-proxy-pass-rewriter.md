## O que esta ferramenta faz

Cole um `location`, seu `proxy_pass`, e uma URI de requisição. A ferramenta calcula o que o backend de fato recebe — e mostra a **mesma configuração com a barra final invertida**, para que a diferença seja visível em vez de descrita.

## A regra

`proxy_pass http://backend;` **não tem parte de URI**, então a URI original da requisição passa inalterada, prefixo do location incluído. `proxy_pass http://backend/;` **tem** parte de URI — mesmo essa barra única conta — então a parte da requisição que casa com o prefixo do location é **substituída** por ela.

Com `location /app/` e uma requisição para `/app/page`: a primeira forma envia `/app/page`, a segunda envia `/page`, e `proxy_pass http://backend/v2/;` envia `/v2/page`.

Qual você quer depende do backend. Uma aplicação montada no mesmo caminho precisa do prefixo mantido; uma que não sabe estar atrás de um prefixo precisa dele removido. Escolher errado produz um 404 do backend para uma requisição que o proxy tratou perfeitamente.

## A barra dobrada é real

Um location sem barra final somado a uma parte de URI envia uma barra genuinamente dobrada ao upstream — `location /app` com `proxy_pass http://backend/` transforma `/app/page` em `//page`. Esta ferramenta reproduz isso em vez de arrumar, porque uma resposta mais bonita que a do NGINX esconderia justamente o defeito que você veio procurar.

## O que ela recusa

Locations de expressão regular e nomeados não podem carregar parte de URI: não há prefixo literal a substituir, então o NGINX rejeita a configuração na inicialização. A ferramenta reporta isso em vez de inventar um resultado.

## A exceção da variável

Uma variável em qualquer ponto do valor suspende a substituição de prefixo por completo, e move a resolução do upstream para o tempo de requisição — o que normalmente exige um `resolver` e transforma uma falha de nome em erro de execução, e não num que o `nginx -t` pegaria.

## Limites honestos

Sem `rewrite`, `try_files` ou redirecionamentos internos: isto responde qual caminho o backend recebe, não o que a requisição inteira faz. Blocos upstream não são resolvidos em servidores, e query strings passam sem serem modeladas.

## Compartilhar resultado

Abaixo do resultado, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a caixa como foi digitada depois do `#`, assim que a página tem um resultado. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. O valor de proxy_pass cita um backend, um hostname ou um endereço normalmente interno, e a página o mostra de volta na contraparte invertida, então nada é cortado: o popover pede para você conferir. Antes de oferecer o link, a caixa passa por uma busca de credenciais que um padrão define: uma chave privada PEM, uma linha `Authorization` ou `Proxy-Authorization` com qualquer esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seções 11.6.2 e 11.7.2: o valor "consists of credentials", consiste em credenciais), uma linha `Cookie` ou `Set-Cookie` com valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seção 8.4: os servidores "commonly store a nonce (or "session identifier") in a cookie", costumam guardar num cookie um identificador de sessão), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1), uma senha numa URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1), um access key ID da AWS ou um valor `ENC` do FortiOS; todas lidas em 2026-11-01. Qualquer um deles impede o link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo (um membro JSON `token`, um `token=` numa query) não impede o link; o popover cita o primeiro para você conferir.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A caixa é preenchida como se tivesse sido colada, e a página calcula o path (o upstream nunca é resolvido nem contatado). Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
