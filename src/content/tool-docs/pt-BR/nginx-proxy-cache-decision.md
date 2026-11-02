## O que esta ferramenta faz

Cole suas diretivas de cache, a requisição, e a resposta do upstream. A ferramenta responde **duas perguntas separadas** — esta resposta será **armazenada**, e uma requisição posterior correspondente será **servida** a partir dela — com o percurso ordenado de regras por trás de cada uma, mais a chave de cache calculada.

Elas são separadas de propósito. Uma resposta pode ser perfeitamente cacheável e nunca ser servida porque a chave difere; uma resposta pode ser servida quando não deveria porque a chave ignora algo que importava.

## As regras de armazenamento, em ordem

O cache está desligado por completo a menos que `proxy_cache` nomeie uma zona — de longe a razão mais comum de nada ser cacheado. Só os métodos em `proxy_cache_methods` são cacheados, com padrão GET e HEAD. Uma resposta com `Set-Cookie` não é armazenada, presumindo que seja específica do usuário. `Cache-Control: no-cache`, `no-store` ou `private` do upstream impede o armazenamento. Um status sem `proxy_cache_valid` e sem header de frescor não tem tempo de vida sob o qual ser armazenado. E `proxy_no_cache` com valor não vazio e diferente de zero impede a escrita.

## O par que as pessoas trocam

`proxy_no_cache` impede a **escrita**. `proxy_cache_bypass` pula a **consulta** e ainda escreve o resultado. Parecem sinônimos e são opostos na metade que importa — usar bypass onde você queria no_cache enche o cache exatamente com o que você tentava manter fora.

## A assimetria que vaza

O NGINX exclui **respostas** com cookie do armazenamento. Ele **não** exclui **requisições** com cookie de serem servidas com uma entrada compartilhada.

Isso costuma ser inofensivo, porque as respostas personalizadas nunca foram armazenadas — até alguém acrescentar `proxy_ignore_headers Set-Cookie` para fazer o cache "funcionar" num backend que define um cookie de sessão em toda resposta. Agora respostas por usuário ficam sob uma chave que todos compartilham. A ferramenta alerta exatamente sobre essa combinação, porque é uma mudança de duas linhas que parece um ajuste de desempenho.

## Limites honestos

Uma troca, não o ciclo de vida do cache: sem `proxy_cache_use_stale`, sem `proxy_cache_lock`, sem revalidação, sem contabilidade de `min_uses`, sem tratamento de `Vary`. O frescor é tratado como presente ou ausente em vez de calculado, então uma entrada expirada está fora de escopo. A renderização da chave substitui as variáveis comuns e deixa o resto como escrito.

## Compartilhar resultado

Abaixo dos dois vereditos, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva uma cópia da caixa depois do `#`; ele só leva a caixa como foi digitada se você marcar a opção descrita abaixo. Os headers da troca são a lição, e colados das ferramentas de desenvolvedor do navegador eles estão ativos: valores de cookie costumam ser identificadores de sessão ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seção 8.4, lida em 2026-11-01) e um valor de `Authorization` "consists of credentials", consiste em credenciais ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2, lida em 2026-11-01). A decisão lê se esses headers existem, nunca os valores; só a cache key renderizada mostra um valor, quando a chave cita `$cookie_<nome>` ou `$http_<nome>` ([ngx_http_core_module, Embedded Variables](https://nginx.org/en/docs/http/ngx_http_core_module.html#variables), lida em 2026-11-01). Por isso a cópia troca por `[redacted]` cada valor de cookie de uma linha `request_header Cookie:`, o valor do cookie de uma linha `response_header Set-Cookie:` (o nome e os atributos ficam), as credenciais depois do esquema de uma linha `Authorization` ou `Proxy-Authorization` (o esquema fica) e o valor inteiro de um header cujo nome pareça de segredo (`X-Api-Key`, `X-Auth-Token`); todo o resto fica como foi digitado, comentários inclusive. Antes de oferecer o link, a cópia é decidida de novo e precisa dar a mesma decisão (armazenado, servido, o resultado de cada regra, cada aviso), senão não há link; a chave e o passo que a cita então mostram `[redacted]` onde havia um valor. Depois a cópia passa por uma busca de credenciais que ainda estejam nela (um JWT na URI, uma chave): qualquer uma impede o link, e o popover diz a linha.

O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. Ele também diz quantos valores foram trocados. Quando algum foi trocado, uma opção logo abaixo da primeira linha, **Incluir no link os valores trocados**, permite mandá-los mesmo assim, para uma troca escrita com valores inventados ou uma chave que cita um cookie: ela vem desmarcada toda vez que o popover abre; marcada, o link leva a caixa como foi digitada, e o popover avisa que valores de cookie costumam ser sessões ativas e que valores de `Authorization` são credenciais. A opção não aparece quando uma credencial já impediu o link.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A cópia (ou, com a opção marcada, a caixa) preenche a caixa como se tivesse sido colada, e a página decide. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
