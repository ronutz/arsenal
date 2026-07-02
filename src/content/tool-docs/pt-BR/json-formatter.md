## O que faz

Cole um JSON e a ferramenta o valida e, em seguida, o formata, minifica ou ordena. O que a distingue de um simples `JSON.parse` é o que ela informa quando algo está errado ou incomum: um erro de análise indica a linha, a coluna e o caminho exatos do problema; chaves de objeto repetidas são sinalizadas; e números muito grandes ou muito precisos são preservados exatamente, em vez de arredondados. Tudo roda no seu navegador.

## Um analisador feito para diagnóstico

O motor é um analisador escrito à mão que rastreia a posição enquanto lê, em vez de depender da análise nativa do runtime JavaScript. Isso traz três vantagens que importam na prática:

- **Erros precisos.** Quando a análise falha, você recebe a linha, a coluna, o deslocamento em bytes, uma mensagem em linguagem clara e o caminho JSON Pointer (RFC 6901) até o local, em vez de um único `SyntaxError` dependente do motor e sem caminho.
- **Detecção de chaves duplicadas.** A gramática JSON tecnicamente permite que um objeto repita uma chave, e o `JSON.parse` mantém silenciosamente apenas a última. Esse comportamento silencioso esconde bugs reais, então este motor relata cada duplicata que encontra, por caminho.
- **Números grandes exatos.** Números JSON não têm limite de tamanho, mas um número JavaScript é um ponto flutuante de 64 bits e perde precisão acima de 2^53. O formatador preserva os dígitos que você escreveu, de modo que um id de 20 dígitos ou um decimal de alta precisão não seja arredondado silenciosamente.

## Formatar, minificar e ordenar

Uma vez que o JSON é válido, você pode formatá-lo com indentação consistente, minificá-lo para a menor forma em linha única ou ordenar as chaves dos objetos para que dois documentos que diferem apenas na ordem das chaves fiquem alinhados para comparação. A ordenação é por chave e não reordena arrays, cuja ordem é significativa em JSON.

## Exemplos

- `{"b":1,"a":2}` ordenado por chave vira `{"a":2,"b":1}`.
- `{ "a": 1 }` minificado vira `{"a":1}`, com os espaços em branco removidos.
- `{"id":10000000000000001}` mantém todos os seus dígitos, enquanto uma ida e volta por um ponto flutuante de 64 bits o transformaria em `10000000000000000`.
- `{"a":1,"a":2}` é sinalizado pela chave duplicada `a`; um analisador comum manteria silenciosamente `2`.

## Como usar

Cole um documento JSON e escolha formatá-lo, minificá-lo ou ordená-lo. Se ele não for analisável, o erro aponta o ponto exato; se for analisável mas tiver chaves duplicadas ou números grandes demais, isso é destacado. A ferramenta é uma função pura da entrada, então o mesmo documento sempre dá o mesmo resultado.
