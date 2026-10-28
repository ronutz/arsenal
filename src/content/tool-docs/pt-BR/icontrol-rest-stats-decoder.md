## O que faz

Cole uma resposta de stats do iControl REST e a ferramenta a achata em uma linha por estatística. Ela desembrulha os invólucros `entries`, `nestedStats`, `value` e `description`, reduz as chaves de URL aos objetos que elas nomeiam e agrupa o resultado por objeto. Transformação puramente local — nada é buscado e nada sai do navegador.

## Por que a resposta precisa ser achatada

Um payload de stats do BIG-IP envolve cada folha em `value` ou `description`, cada nível em `entries` e `nestedStats`, e usa uma URL completa como chave do objeto externo. Três invólucros em volta de um número. O formato é autodescritivo, não perverso, mas não é legível de relance, e um pool com seus membros pode aninhar quatro níveis.

## A divisão de 64 bits, que é a parte que importa

A F5 divide contadores grandes em metades `.high` e `.low` porque números JSON não carregam um inteiro de 64 bits com segurança. `serverside.bitsIn.high = 3` e `serverside.bitsIn.low = 1000000` **não são duas estatísticas** — são um contador cujo valor é `(high << 32) + low`, ou 12.885.901.888.

**A ferramenta combina as metades e marca os valores combinados**, para que você confira a aritmética em vez de confiar nela. Um achatador que reporta as metades separadamente vai sub-reportar em silêncio os seus contadores mais movimentados.

## Totais, não taxas

Todo contador é um total desde o último reset, e o payload não traz intervalo. **Uma única amostra não pode produzir uma taxa.** A ferramenta diz isso em toda decodificação, porque plotar um contador em vez da sua derivada é uma forma rotineira de construir um dashboard que sobe para sempre.

## O que ela não faz

Não interpreta as estatísticas e não conhece o seu intervalo de coleta. Recusa uma resposta de configuração com uma mensagem clara em vez de produzir saída vazia, já que a ausência de um objeto `entries` é o indicador confiável.

## Compartilhar resultado

Abaixo do texto achatado, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a resposta de stats como foi colada depois do `#`. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Uma resposta de stats tem contadores e os objetos a que eles pertencem, não uma credencial: o iControl REST leva o token no header `X-F5-Auth-Token` da requisição ([guia do AS3 da F5, Authentication and Authorization](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/userguide/authentication.html), lido em 2026-10-27). A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então a resposta não é enviada ao servidor quando o link é aberto; ela fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-la.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; os stats de uma coleção podem passar disso, e aí o popover diz o tamanho em vez de oferecer um link.
- **Ao abrir um link.** O JSON preenche a caixa como se tivesse sido colado e a página o achata. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
