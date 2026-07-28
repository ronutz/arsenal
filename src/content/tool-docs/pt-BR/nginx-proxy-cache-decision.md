## O que esta ferramenta faz

Cole suas diretivas de cache, a requisição, e a resposta do upstream. A ferramenta responde **duas perguntas separadas** — esta resposta será **armazenada**, e uma requisição posterior correspondente será **servida** a partir dela — com o percurso ordenado de regras por trás de cada uma, mais a chave de cache calculada.

Elas são separadas de propósito. Uma resposta pode ser perfeitamente cacheável e nunca ser servida porque a chave difere; uma resposta pode ser servida quando não deveria porque a chave ignora algo que importava.

## As regras de armazenamento, em ordem

O cache está desligado por completo a menos que `proxy_cache` nomeie uma zona — de longe a razão mais comum de nada ser cacheado. Só os métodos em `proxy_cache_methods` são cacheados, com padrão GET e HEAD. Uma resposta com `Set-Cookie` não é armazenada, presumindo que seja específica do usuário. `Cache-Control: no-cache`, `no-store` ou `private` do upstream impede o armazenamento. Um status sem `proxy_cache_valid` e sem cabeçalho de frescor não tem tempo de vida sob o qual ser armazenado. E `proxy_no_cache` com valor não vazio e diferente de zero impede a escrita.

## O par que as pessoas trocam

`proxy_no_cache` impede a **escrita**. `proxy_cache_bypass` pula a **consulta** e ainda escreve o resultado. Parecem sinônimos e são opostos na metade que importa — usar bypass onde você queria no_cache enche o cache exatamente com o que você tentava manter fora.

## A assimetria que vaza

O NGINX exclui **respostas** com cookie do armazenamento. Ele **não** exclui **requisições** com cookie de serem servidas com uma entrada compartilhada.

Isso costuma ser inofensivo, porque as respostas personalizadas nunca foram armazenadas — até alguém acrescentar `proxy_ignore_headers Set-Cookie` para fazer o cache "funcionar" num backend que define um cookie de sessão em toda resposta. Agora respostas por usuário ficam sob uma chave que todos compartilham. A ferramenta alerta exatamente sobre essa combinação, porque é uma mudança de duas linhas que parece um ajuste de desempenho.

## Limites honestos

Uma troca, não o ciclo de vida do cache: sem `proxy_cache_use_stale`, sem `proxy_cache_lock`, sem revalidação, sem contabilidade de `min_uses`, sem tratamento de `Vary`. O frescor é tratado como presente ou ausente em vez de calculado, então uma entrada expirada está fora de escopo. A renderização da chave substitui as variáveis comuns e deixa o resto como escrito.
