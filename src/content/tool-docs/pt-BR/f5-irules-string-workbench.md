## O que faz

Roda um subcomando `string` do Tcl 8.4.6 e desenha o resultado numa régua de caracteres: cada caractere da string com seu índice, colorido conforme o que o comando fez com ele (buscado, casado, devolvido, trocado, removido, ou a primeira diferença numa comparação). São dezessete subcomandos: `length`, `bytelength`, `tolower`, `toupper`, `range`, `index`, `first`, `last`, `map`, `match`, `compare`, `equal`, `trim`, `trimleft`, `trimright`, `replace` e `repeat`.

## Como ler o resultado

- **O comando** é a linha exata para colar num iRule, com as aspas de que o Tcl precisa.
- **A régua** numera os caracteres a partir de 0, do mesmo jeito que todo argumento de índice conta.
- **Argumentos de índice** mostra como cada índice foi lido: `end-1` é o penúltimo caractere, e um índice escrito `010` é octal, então significa 8.
- **A passada única do string map** lista cada posição: mantida, ou trocada por qual chave e valor.

## Vale saber

- `length` conta caracteres; `bytelength` conta os bytes do UTF-8 interno do Tcl, então `héllo` tem 5 caracteres e 6 bytes.
- `string map` faz uma passada da esquerda para a direita. Em cada posição vence a primeira chave da lista que casar, e o texto trocado nunca é examinado de novo: `string map {a 1 ab 2} abab` dá `1b1b`, enquanto `{ab 2 a 1}` dá `22`.
- `compare` ordena pelo código do caractere, então `string compare bench Chair` dá 1.
- `string index` e `string range` devolvem uma string vazia, não um erro, quando o índice está fora da string.
- `trim` remove um **conjunto** de caracteres, em qualquer ordem, não uma palavra.
- O Tcl 8.4.6 aceita `e` ou `en` sozinhos como `end`, mas `e-1` dá erro.
- A conversão de caixa usa as tabelas Unicode do próprio Tcl 8.4.6, que diferem das de um navegador moderno em cerca de mil caracteres (por exemplo, o Tcl 8.4.6 não tem forma maiúscula para `µ`).

## Compartilhar resultado

Abaixo do resultado, **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o formulário pelo nome: o subcomando como `#op=`, depois cada campo de argumento preenchido com o próprio nome (`&string=`, `&first=`, `&needle=`, `&haystack=`, `&mapping=` e assim por diante), e `&nocase=1` quando o **-nocase** está marcado num subcomando que o aceita. Não existe um `#input=` único: o campo que guarda o texto trabalhado muda com o subcomando. Tudo o que o link leva vai depois do `#`, e a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado): o navegador não o envia ao servidor quando o link é aberto, mas ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** Um link leva no máximo 16.384 caracteres, o limite que o site usa para todo valor depois do `#`; campos maiores que isso não ganham link, e o popover diz o tamanho.
- **Ao abrir um link.** O subcomando e os campos dele são preenchidos como se você tivesse digitado (um campo que o link não leva fica vazio) e o resultado é calculado. Um subcomando desconhecido, um campo que o subcomando não aceita ou um `-nocase` onde ele não se aplica faz o link inteiro ser ignorado; o texto dos campos é aceito como foi digitado, e um índice inválido recebe o erro do próprio Tcl, como na digitação. Aceitos ou não, os valores saem do endereço da própria página na hora, sem nenhuma requisição, então recarregar, salvar nos favoritos ou usar o botão Compartilhar da própria página não leva nada que você não escolheu compartilhar.

## Limites

Caracteres fora do Plano Multilíngue Básico são recusados, porque o Tcl 8.4 não consegue guardá-los como um único caractere. `string is`, `totitle`, `wordstart` e `wordend` não são modelados. O resultado de `repeat` é limitado a 100.000 caracteres.

## Fontes

- [Manual do Tcl 8.4: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (lido em 2026-10-03)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (lido em 2026-10-03)
- [Código-fonte do Tcl 8.4.6, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (o interpretador de referência contra o qual o motor é testado)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lida em 2026-10-27): seção 3.5, o fragmento, que leva os valores de um link de Compartilhar resultado
