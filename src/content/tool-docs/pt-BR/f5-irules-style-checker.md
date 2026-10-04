## O que faz

Lê um iRule segundo o "iRules Style Guide" do DevCentral (publicado por JRahm com Jim_Deucker em 2022-12-22), acrescenta dois pontos levantados nos comentários do guia e passa sobre ele uma análise de sintaxe Tcl 8.4 real. A regra é analisada, nunca executada. Cada apontamento indica a regra de onde vem, a linha e o que mudar; as linhas apontadas ficam marcadas numa cópia numerada da regra.

## O que verifica

- **Configurações de editor (E1 a E3):** tabulações e indentações que não são múltiplas de 4 espaços, linhas com mais de 100 colunas (alerta acima de 120), fins de linha do Windows, espaço em branco no fim da linha, falta de quebra de linha no final e caracteres fora do ASCII, cada um nomeado com o code point, o nome oficial no Unicode e a coluna.
- **Regras numeradas:** caracteres que quebram o código (R1), o limite de tamanho da F5 (R2), uma `{` sozinha na linha ou `else` numa linha nova (R4), comentários no fim da linha, comentários sem espaço e comentários entre padrões do `switch` (R6), vários comandos numa linha (R7), `if` numa linha só (R8), estado guardado como palavras como `yes` (R9), `and` / `or` / `not` da F5 (R10), `}{` sem espaço ou uma palavra-chave colada à chave (R11), expressões sem chaves (R12), variáveis em expressões sem espaço em volta (R13) ou sem chaves em volta do nome (R14), `switch` e `table` sem `--` (R15), eventos sem prioridade (R16), entradas de `table` sem timeout nem lifetime (R17; sem eles, a referência de `table` da F5 aplica um timeout de 180 segundos e um lifetime indefinido), nomes `static::` sem prefixo (R18), flags de debug em `static::` (R19) e código comentado (R20).
- **Dos comentários do guia (D1, D2):** `==` ou `!=` com um texto, onde se queria `eq` ou `ne` (D1); `break` ou `continue` sem nenhum laço em volta, `break` num ramo de `switch` dentro de um laço, e `return` num ramo de `switch` (D2).
- **Sintaxe:** um erro que o parser do Tcl 8.4 aponta, como `}{` sem espaço ("extra characters after close-brace"), significa que o iRule não consegue nem carregar.

## Caracteres que se escondem no código

A primeira regra do guia trata de aspas curvas e espaços não separáveis que um editor de texto insere. O verificador classifica cada caractere fora do ASCII pelo Unicode Character Database 18.0.0, então encontra a família inteira, não só esses dois:

- **R1, erro:** caracteres invisíveis (a lista Default_Ignorable_Code_Point do Unicode: espaços e junções de largura zero, a marca de ordem de bytes, o hífen condicional, controles bidirecionais), espaços que não são o espaço ASCII (não separável, em, ideográfico e outros) e aspas tipográficas. Testado no tclsh 8.4.6: um espaço não separável cola duas palavras num único nome de comando, aspas curvas não agrupam palavras, e um espaço de largura zero depois de uma chave de fechamento para a regra com "extra characters after close-brace".
- **E3, alerta:** traços que não são o hífen-menos ASCII. O Tcl não os lê nem como hífen de opção nem como sinal de menos: um `switch` com uma meia-risca (U+2013) digitada onde deveria estar `--` toma o traço como valor e silenciosamente não casa nada.
- **E3, nota:** outros caracteres que parecem ASCII (letras de largura total, as reticências, algarismos romanos) e qualquer outro caractere fora do ASCII.

Isso vale para o próprio guia: como publicado em 2026-10-03, o exemplo de `RULE_INIT` tem um espaço de largura zero depois da chave de fechamento, e o exemplo de debug tem uma linha que contém só um deles, então copiar qualquer um dos dois literalmente quebra o iRule.

## O limite de tamanho

O F5 K9204 fixa o limite em 65.520 caracteres; o BIG-IP se recusa a salvar ou carregar um iRule maior, com um erro que diz "Max string size exceeded" e "max:65520". O guia arredonda isso para 64 KB. O verificador conta os caracteres e os bytes que eles ocupam em UTF-8, e aponta R2 quando qualquer um dos dois passa de 65.520.

## Dos comentários do guia

- **D1:** Kai Wilke apontou que o exemplo da regra 10 do guia compara texto com `==`, e os autores concordaram em acrescentar um ponto sobre `eq` / `ne`. O `==` compara como números sempre que os dois lados parecem números: no Tcl 8.4.6, `10 == 012` e `1 == "0x0000001"` são ambos verdadeiros. O How To Write Fast Rules da F5 pede números comparados com números e strings com strings.
- **D2:** Juergen Mang observou que os ramos de um `switch` não precisam de `return` nem de `break` para parar. Um ramo de `switch` nunca segue para o próximo, `return` sai do evento inteiro (a página de `return` da F5), e `break` sem nenhum laço em volta é um erro no Tcl 8.4.6 (verificado no corpo de um proc). A F5 não documenta o que o TMM faz com ele no corpo de um evento.

## Limites

- Variáveis de array como `$static::pools($key)` são Tcl válido, mas o motor de Tcl do site não as modela. O verificador lê cada uma como variável simples, continua verificando o resto da regra e avisa numa nota.
- Algumas regras não podem ser julgadas só pelo texto. Se uma linha começando com `#` é código comentado ou um comentário sem o espaço é um palpite baseado na primeira palavra, então esses apontamentos são notas.
- A regra R3 (dividir o iRule em blocos funcionais) é uma escolha de projeto que o verificador não julga. A R5 (a indentação de 4 espaços levada para valores aninhados, como os ramos de um `switch`) é coberta pela verificação de indentação. A configuração de editor sobre evitar continuações de linha não é verificada.

## Fontes

- [F5 DevCentral: iRules Style Guide, com os comentários](https://community.f5.com/t/irules-style-guide/71151) (lido em 2026-10-03)
- [F5 K9204: iRules are limited to 65,520 characters](https://my.f5.com/manage/s/article/K9204) (lido em 2026-10-03)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (lido em 2026-10-03)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (lido em 2026-10-03)
- [Referência de iRules da F5: How To Write Fast Rules](https://clouddocs.f5.com/api/irules/HowToWriteFastRules.html) (lido em 2026-10-03)
- [Referência de iRules da F5: return](https://clouddocs.f5.com/api/irules/return.html) (lido em 2026-10-03)
- [Referência de iRules da F5: priority](https://clouddocs.f5.com/api/irules/priority.html) (lido em 2026-10-03)
- [Referência de iRules da F5: table](https://clouddocs.f5.com/api/irules/table.html) (lido em 2026-10-03)
- [Manual do Tcl 8.4: switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (lido em 2026-10-03)
- [Manual do Tcl 8.4: break](https://www.tcl-lang.org/man/tcl8.4/TclCmd/break.htm) (lido em 2026-10-03)
- [Unicode Character Database 18.0.0: PropList.txt](https://www.unicode.org/Public/UCD/latest/ucd/PropList.txt) (lido em 2026-10-03)
- [Unicode Character Database 18.0.0: DerivedCoreProperties.txt](https://www.unicode.org/Public/UCD/latest/ucd/DerivedCoreProperties.txt) (lido em 2026-10-03)
- [Unicode Character Database 18.0.0: UnicodeData.txt](https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt) (lido em 2026-10-03)
