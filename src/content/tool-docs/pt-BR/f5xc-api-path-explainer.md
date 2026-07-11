## O que faz

Esta ferramenta explica uma especificação OpenAPI ou Swagger - o artefato exato com o qual o F5 Distributed Cloud (XC) API Protection trabalha. O XC importa uma spec OpenAPI (versão 2.0 ou 3.0.x) para construir seu inventário de API e impor um modelo de segurança positivo, e o XC API Discovery gera um Swagger JSON baixável que você pode editar e reimportar. Cole essa spec e esta ferramenta lista cada path e operação com seu método, parâmetros, request body, respostas, e se ela exige autenticação. Roda inteiramente no seu navegador.

## O inventário que ela constrói

Para cada path, a ferramenta percorre cada operação - GET, POST, PUT, PATCH, DELETE, e as demais - e reporta os mesmos detalhes que o XC usa para definir comportamento válido: os parâmetros (nome, localização, e se são obrigatórios), os content types do request body, os response codes, e os security schemes que se aplicam. Ela resolve parâmetros $ref locais dentro do documento, então um parâmetro definido uma vez e referenciado em várias operações é mostrado por completo em cada uso. O resumo no topo conta os paths, as operações, e quantas são sem autenticação, de nível de objeto, ou deprecadas.

## Autenticação, resolvida corretamente

Se uma operação exige autenticação nem sempre está declarado na própria operação. O OpenAPI deixa você definir um requisito de segurança global e sobrescrevê-lo por operação - e uma operação com uma lista de security vazia é explicitamente pública, mesmo que a API tenha um requisito global. A ferramenta resolve isso da forma que a spec define: uma operação usa seu próprio security se presente, senão o global, e uma lista vazia significa nenhuma autenticação. É por isso que uma operação pode aparecer como sem autenticação mesmo em uma API que na maior parte exige um token.

## Os flags, e por que eles mapeiam para o OWASP

A ferramenta sinaliza duas coisas que importam para a segurança de API. Uma operação sem security efetivo é um risco de Broken Authentication - ela é alcançável sem credenciais. Um endpoint com um parâmetro de path, como /orders/{id}, é um ponto de acesso de nível de objeto e a superfície clássica para Broken Object Level Authorization, o item do topo do OWASP API Security Top 10: a API precisa verificar que o chamador tem permissão para tocar aquele objeto específico, não apenas que ele está logado. Esses são lembretes para verificar seu design de autorização, não prova de uma vulnerabilidade - mas são exatamente os endpoints que vale checar primeiro.
