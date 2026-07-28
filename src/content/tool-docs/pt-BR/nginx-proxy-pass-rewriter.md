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
