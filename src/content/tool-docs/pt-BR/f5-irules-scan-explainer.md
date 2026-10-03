## O que faz

`scan` é o jeito barato de desmontar um valor num iRule; a referência de `matches_regex` da F5 observa que um comando de string é mais eficiente que uma expressão regular e que a maioria dos casos pode ser resolvida com `string match` ou `scan`. Informe à ferramenta um valor, um formato e os nomes das variáveis, e ela alinha cada diretiva do formato com os caracteres que consumiu, o valor que produziu e a variável que o recebeu, e diz exatamente por que a leitura parou. O valor é desenhado numa régua, com os caracteres de cada conversão em uma cor.

## Como ler o resultado

- **scan devolveu** é o resultado do comando: com nomes de variáveis, a quantidade de variáveis que receberam valor; sem nomes, uma lista com os valores convertidos.
- **Diretiva por diretiva** tem uma linha por diretiva: um literal que precisava casar, um espaço em branco que pula qualquer quantidade, ou uma conversão como `%d`, `%s` ou `%[^&]`.
- **Variáveis depois** mostra o que cada variável nomeada contém. Uma variável depois do ponto onde a leitura parou não é definida por este scan.

## Vale saber

- `-1` significa que a entrada acabou antes da primeira conversão; `0` significa que uma conversão foi tentada e não casou. Verifique os dois casos quando um valor puder ser vazio.
- `%d` pula espaço em branco inicial e lê decimal; `%i` tira a base de um prefixo, então `08` lido com `%i` dá 0 e para no 8. Use `%d` para horários e códigos com zero à esquerda.
- `%s` para no espaço em branco; `%[^&]` lê tudo até um "e comercial" (`&`).
- O Tcl 8.4.6 guarda as conversões inteiras por meio de um `int` em C: `3000000000` lido com `%d` volta como `-1294967296`, e o modificador `l` não muda isso no 8.4.6. Para manter um número grande intacto, leia-o como texto com `%[0-9]` e deixe o `expr` interpretá-lo.
- `%n` guarda quanto da entrada foi consumido até ali. O manual fala em caracteres, mas o Tcl 8.4.6 conta bytes do seu UTF-8 interno, então cada caractere fora do ASCII conta 2 ou 3.

## Limites

O motor segue o `Tcl_ScanObjCmd` do Tcl 8.4.6 e foi conferido contra um interpretador Tcl 8.4.6 real em milhares de casos gerados. Resultados inteiros que dependem da biblioteca C da plataforma são marcados.

## Fontes

- [Manual do Tcl 8.4: scan](https://www.tcl-lang.org/man/tcl8.4/TclCmd/scan.htm) (lido em 2026-10-03)
- [Referência de iRules da F5: matches_regex](https://clouddocs.f5.com/api/irules/matches_regex.html) (lido em 2026-10-02)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (lido em 2026-10-03)
- [Código-fonte do Tcl 8.4.6, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (o interpretador de referência)
