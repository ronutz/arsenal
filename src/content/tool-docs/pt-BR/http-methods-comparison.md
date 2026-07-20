## O que ela faz

Informe de um a quatro nomes de métodos HTTP (Hypertext Transfer Protocol, protocolo de transferência de hipertexto) e a ferramenta retorna os fatos de protocolo de cada um: se é seguro, idempotente e cacheável, qual a semântica do corpo da requisição, se o CORS (Cross-Origin Resource Sharing, compartilhamento de recursos entre origens) permite que navegadores o enviem sem preflight, se formulários HTML conseguem produzi-lo declarativamente e qual RFC o define. Peça dois ou mais ("get vs query") e ela também nomeia exatamente as propriedades em que diferem. A tabela cobre os nove métodos centrais da RFC 9110, o PATCH (RFC 5789), o trio WebDAV PROPFIND, REPORT e SEARCH, e a linha manchete: o QUERY, registrado pela RFC 10008 em junho de 2026 - o primeiro método HTTP novo desde o PATCH, em 2010.

## O vocabulário, com precisão

Seguro significa que o cliente não pede mudança de estado; idempotente significa que repetir a requisição idêntica deixa o servidor no mesmo estado - o que torna repetições automáticas legais. Ambos são promessas registradas na IANA sobre intenção: um cache, proxy ou camada de retry genérica pode agir sobre elas sem saber nada da sua API. Nenhum dos dois diz nada sobre o payload: um corpo de QUERY carrega a mesma tentativa de injeção que um corpo de POST, e é por isso que a nota final da ferramenta insiste em inspeção de nível POST para o QUERY.

A cacheabilidade tem três valores honestos na tabela: GET e HEAD são o par cacheável; respostas de POST e PATCH só são cacheáveis com informação explícita de frescor (na prática, quase nunca); o QUERY é cacheável por projeto, com a exigência da RFC 10008 de que a chave de cache incorpore o conteúdo da requisição - o mecanismo que torna cacheável uma requisição com corpo, e o ponto exato onde uma implementação de cache desleixada vira envenenamento de cache.

A semântica do corpo separa quatro casos que o ecossistema vive confundindo: corpos que são o ponto (POST, PUT, PATCH, QUERY, o trio WebDAV), corpos sem semântica definida que servidores podem rejeitar de cara (GET, HEAD, DELETE - a RFC 9110 diz isso explicitamente), corpos permitidos porém sem significado (OPTIONS) e corpos proibidos (CONNECT, TRACE).

## Por que o QUERY é a linha interessante

O QUERY é o meio que faltava, e a tabela o torna visível: seguro + idempotente + cacheável como GET, corpo como POST. Ele existe porque o GET força a consulta para dentro da URL (limites de tamanho, dor de codificação, vazamento em logs e no Referer), enquanto o POST /search mente para a infraestrutura - nada no protocolo o marca como somente leitura, então nada no meio do caminho consegue cachear ou repetir. A comparação "post vs query" mostra cinco propriedades virando de uma vez; "get vs query" mostra as três que importam para a adoção: o corpo, o preflight do CORS (o QUERY não está na safelist) e os formulários HTML (um form com method="query" hoje recua para GET e descarta o corpo).

## Exemplos resolvidos

`query` sozinho dá a linha completa da RFC 10008. `get vs query` responde à pergunta canônica com três diferenças. `post,query` mostra a história da migração: cinco viradas. `put delete` mostra o par que é idempotente sem ser seguro. `trace` e `connect` mostram os dois métodos proibidos de ter corpo. `search` conta a história do nome: os primeiros rascunhos do QUERY se chamavam SEARCH, até a renomeação de 2021.

## Procedência

Cada valor de seguro/idempotente é a própria coluna do Registro de Métodos HTTP da IANA, cruzada com a RFC 9110 §9.3, a RFC 10008, a RFC 5789 e as especificações WebDAV (RFC 4918, 3253, 5323); a safelist do CORS segue a especificação Fetch do WHATWG, e o status dos formulários, a discussão aberta no HTML do WHATWG. Todas as fontes foram buscadas em 20/07/2026. A ferramenta traz 19 vetores dourados fixando cada linha, então qualquer deriva na tabela quebra o build.
