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
