## O que faz

Avalia uma expressão do jeito que `expr`, `if` e `while` fazem num iRule e mostra a avaliação inteira: o valor e como ele é guardado, a expressão com os operandos de cada operador entre parênteses para deixar a precedência visível, uma árvore com cada passo e, numa comparação, o que `==`, `eq`, `<` e `>` fazem com os mesmos dois operandos. As variáveis recebem valores por comandos `set` comuns, então as aspas se comportam exatamente como num iRule.

Dois modos: **Tcl 8.4** (Tcl 8.4.6 puro, a base que a F5 indica no K6091) e **iRules**, que acrescenta os operadores documentados pela F5 (`contains`, `starts_with`, `ends_with`, `equals`, `matches_glob`, `matches_regex`, `and`, `or`, `not`) e comandos de requisição como `[HTTP::uri]`, respondidos a partir de uma requisição de exemplo editável.

## Como ler a árvore

Cada caixa é uma parte da expressão: o trecho, uma seta e o que ele produziu. Os operandos ficam abaixo do seu operador. As notas sob uma caixa dizem o que aconteceu ali, por exemplo "Comparado como inteiros: 10 e 10" para `$x == $y` com `x` valendo `012`, ou "Comparado como texto porque o lado esquerdo não é um número". Uma parte marcada como "nunca avaliado" foi pulada por `&&`, `||` ou `?:`.

## Vale saber

- `==` e os outros operadores de comparação comparam números quando os dois lados são lidos como números, e texto caso contrário. `eq` e `ne` sempre comparam texto.
- Numa comparação de texto, os códigos dos caracteres decidem, então toda letra maiúscula vem antes de toda minúscula: `"bench" < "Chair"` é falso.
- `true == 1` é falso: `true` é uma palavra booleana, não um número, então a comparação é entre textos.
- O Tcl 8.4 não tem o operador `**`; `2 ** 3` é erro de sintaxe.
- A divisão inteira arredonda em direção ao infinito negativo (`7 / -2` dá `-4`) e o resto fica com o sinal do divisor.
- Um literal como `08` escrito na expressão é recusado quando a expressão é compilada, antes que qualquer parte dela rode.
- Coloque as expressões entre chaves. Sem chaves, o Tcl substitui o texto duas vezes, o que é mais lento e deixa dados rodarem como código (F5 K57410758 e K15650046). O executor passo a passo mostra isso acontecendo.

## Limites

A F5 documenta seus operadores em palavra, mas não a precedência deles em relação aos operadores do Tcl; a ferramenta coloca `contains`, `starts_with` e os demais junto com `==`, e `and` e `or` junto com `&&` e `||`. `rand()` e `srand()` são recusados porque seus resultados não podem ser reproduzidos. Comandos que rodam dentro de uma expressão (entre colchetes) usam o mesmo pequeno interpretador do executor passo a passo, limitado a 2.000 comandos. Esta ferramenta não é oferecida pela API, porque executa o Tcl que você fornece.

## Fontes

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (lido em 2026-10-03)
- [Manual do Tcl 8.4: expr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/expr.htm) (lido em 2026-10-03)
- [Referência de iRules da F5: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (lido em 2026-10-02)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (lido em 2026-10-03)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (lido em 2026-10-03)
