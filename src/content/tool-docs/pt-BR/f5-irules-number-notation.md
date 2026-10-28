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

## Compartilhar resultado

Abaixo do destaque e das notas dele, **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o valor exatamente como foi digitado, com os espaços (eles fazem parte do valor que o Tcl lê), como `#input=`, e o valor de comparação como `&other=` quando esse campo está preenchido. Tudo o que o link leva vai depois do `#`, e a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado): o navegador não o envia ao servidor quando o link é aberto, mas ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** Um link leva no máximo 16.384 caracteres, o limite que o site usa para todo valor depois do `#`; um número é bem mais curto.
- **Ao abrir um link.** Os dois campos são preenchidos como se você tivesse digitado e a página lê o valor; uma comparação que o link não leva deixa esse campo vazio, como estava para quem mandou. Qualquer valor é aceito, como na digitação: a página diz o que o Tcl faz dele. Aceitos ou não, os valores saem do endereço da própria página na hora, sem nenhuma requisição, então recarregar, salvar nos favoritos ou usar o botão Compartilhar da própria página não leva nada que você não escolheu compartilhar.

## Limites

Os inteiros são modelados com 64 bits. O Tcl 8.4 usa o `long` em C da plataforma para a qual foi compilado, então um build de 32 bits leria valores grandes de outro jeito; a ferramenta avisa quando um valor não cabe em 32 bits.

## Fontes

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (lido em 2026-10-03)
- [Manual do Tcl 8.4: expr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/expr.htm) (lido em 2026-10-03)
- [Referência de iRules da F5: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (lido em 2026-10-02)
- [Código-fonte do Tcl 8.4.6, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (o interpretador de referência; `doc/tclvars.n` documenta o `tcl_precision` padrão de 12)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lida em 2026-10-27): seção 3.5, o fragmento, que leva os valores de um link de Compartilhar resultado
