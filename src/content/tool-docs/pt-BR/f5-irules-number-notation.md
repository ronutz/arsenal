## O que faz

Digite um valor como ele aparece num iRule, como `010`, `0x1F`, `08`, `1e3` ou `" 12 "`, e a ferramenta mostra como o Tcl 8.4.6 o lê. A F5 informa no K6091 que o conjunto de comandos de iRules foi desenvolvido a partir da versão base 8.4.6 do Tcl, então estas são as regras que um BIG-IP aplica. O motor por trás da ferramenta foi conferido contra um interpretador Tcl 8.4.6 real, compilado a partir do código-fonte oficial.

## Como ler o resultado

- **O destaque** diz se o texto é um inteiro, um double (ponto flutuante) ou não é número, em que base o inteiro foi escrito e como o Tcl o imprime. `010` é o inteiro 8, escrito em octal.
- **Outras notações** lista o mesmo inteiro em decimal, hexadecimal, octal e binário, e como escrevê-lo num iRule. O Tcl 8.4 não tem notação binária, então essa linha não tem forma em Tcl.
- **Por dentro do double** mostra o que os 12 dígitos impressos escondem: o Tcl 8.4 imprime doubles com 12 dígitos significativos (o `tcl_precision` vale 12 por padrão), então `0.1` aparece como `0.1` enquanto o valor guardado é `0.1000000000000000055511151231257827021181583404541015625`.
- **Dois lugares onde o Tcl lê números** compara o valor escrito direto na expressão (`expr {08}`, um erro antes que qualquer coisa rode) com o mesmo texto guardado numa variável (`set x 08; expr {$x + 0}`, um erro só quando a aritmética precisa do número).
- **Comparando com** roda `==`, `eq`, `<` e `>` contra um segundo valor à sua escolha, com o motivo de cada resultado.

## Vale saber

- Um 0 inicial significa octal: `010 == 8` é verdadeiro e `010 eq 8` é falso, porque `eq` compara texto.
- `08` e `09` não são números. Na aritmética falham com "can't use invalid octal number"; numa comparação viram texto sem avisar, então `"08" == 8` é falso.
- Para o Tcl, um double nunca é inteiro: `3.0 == 3` é verdadeiro, mas `3.0` é impresso com o ponto decimal e `%` o recusa.
- Valores de 2 elevado a 63 até 2 elevado a 64 menos 1 são aceitos e dão a volta para números negativos; acima disso, são recusados.

## Limites

Os inteiros são modelados com 64 bits. O Tcl 8.4 usa o `long` em C da plataforma para a qual foi compilado, então um build de 32 bits leria valores grandes de outro jeito; a ferramenta avisa quando um valor não cabe em 32 bits.

## Fontes

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (lido em 2026-10-03)
- [Manual do Tcl 8.4: expr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/expr.htm) (lido em 2026-10-03)
- [Referência de iRules da F5: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (lido em 2026-10-02)
- [Código-fonte do Tcl 8.4.6, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (o interpretador de referência; `doc/tclvars.n` documenta o `tcl_precision` padrão de 12)
