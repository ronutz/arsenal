## O que faz

Lê um iRule segundo o "iRules Style Guide" do DevCentral (publicado por JRahm com Jim_Deucker em 2022-12-22) e passa sobre ele uma análise de sintaxe Tcl 8.4 real. A regra é analisada, nunca executada. Cada apontamento indica a regra do guia de onde vem, a linha e o que mudar; as linhas apontadas ficam marcadas numa cópia numerada da regra.

## O que verifica

- **Configurações de editor (E1 a E3):** tabulações e indentações que não são múltiplas de 4 espaços, linhas com mais de 100 colunas (alerta acima de 120), fins de linha do Windows, espaço em branco no fim da linha, caracteres fora do ASCII e falta de quebra de linha no final.
- **Regras numeradas:** aspas curvas e espaços não separáveis (R1), o limite de 64 KB (R2), uma `{` sozinha na linha ou `else` numa linha nova (R4), comentários no fim da linha, comentários sem espaço e comentários entre padrões do `switch` (R6), vários comandos numa linha (R7), `if` numa linha só (R8), estado guardado como palavras como `yes` (R9), `and` / `or` / `not` da F5 (R10), `}{` sem espaço (R11), expressões sem chaves (R12), variáveis em expressões sem espaço em volta (R13) ou sem chaves em volta do nome (R14), `switch` e `table` sem `--` (R15), eventos sem prioridade (R16), entradas de `table` sem timeout nem lifetime (R17; sem eles, a referência de `table` da F5 aplica um timeout de 180 segundos e um lifetime indefinido), nomes `static::` sem prefixo (R18), flags de debug em `static::` (R19) e código comentado (R20).
- **Sintaxe:** um erro que o parser do Tcl 8.4 aponta, como `}{` sem espaço ("extra characters after close-brace"), significa que o iRule não consegue nem carregar.

## Limites

Algumas regras não podem ser julgadas só pelo texto: se uma linha começando com `#` é código comentado ou um comentário sem o espaço é um palpite baseado na primeira palavra, então esses apontamentos são notas. A regra R3 (dividir o iRule em blocos funcionais) é uma escolha de projeto que o verificador não julga; a R5 (a indentação de 4 espaços levada para valores aninhados, como os ramos de um `switch`) é coberta pela verificação de indentação, e a configuração de editor sobre evitar continuações de linha não é verificada.

## Fontes

- [F5 DevCentral: iRules Style Guide](https://community.f5.com/t/irules-style-guide/71151) (lido em 2026-10-03)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (lido em 2026-10-03)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (lido em 2026-10-03)
- [Referência de iRules da F5: priority](https://clouddocs.f5.com/api/irules/priority.html) (lido em 2026-10-03)
- [Referência de iRules da F5: table](https://clouddocs.f5.com/api/irules/table.html) (lido em 2026-10-03)
- [Manual do Tcl 8.4: switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (lido em 2026-10-03)
