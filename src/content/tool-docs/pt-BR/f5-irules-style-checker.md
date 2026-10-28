## O que faz

Lê um iRule segundo o "iRules Style Guide" do DevCentral (publicado por JRahm com Jim_Deucker em 2022-12-22), acrescenta dois pontos levantados nos comentários do guia e passa sobre ele uma análise de sintaxe Tcl 8.4 real. A regra é analisada, nunca executada. Cada apontamento indica a regra de onde vem, a linha e o que mudar; as linhas apontadas ficam marcadas numa cópia numerada da regra.

## O que verifica

- **Configurações de editor (E1 a E3):** tabulações e indentações que não são múltiplas de 4 espaços, linhas com mais de 100 colunas (alerta acima de 120), fins de linha do Windows, espaço em branco no fim da linha, falta de quebra de linha no final e caracteres fora do ASCII, cada um nomeado com o code point, o nome oficial no Unicode e a coluna.
- **Regras numeradas:** caracteres que quebram o código (R1), o limite de tamanho da F5 (R2), uma `{` sozinha na linha ou `else` numa linha nova (R4), comentários no fim da linha, comentários sem espaço e comentários entre padrões do `switch` (R6), vários comandos numa linha (R7), `if` numa linha só (R8), estado guardado como palavras como `yes` (R9), `and` / `or` / `not` da F5 (R10), `}{` sem espaço ou uma palavra-chave colada à chave (R11), expressões sem chaves (R12), variáveis em expressões sem espaço em volta (R13) ou sem chaves em volta do nome (R14), `switch` e `table` sem `--` (R15), eventos sem prioridade (R16), entradas de `table` sem timeout nem lifetime (R17; sem eles, a referência de `table` da F5 aplica um timeout de 180 segundos e um lifetime indefinido), nomes `static::` sem prefixo (R18), flags de debug em `static::` (R19) e código comentado (R20).
- **Dos comentários do guia (D1, D2):** `==` ou `!=` com um texto, onde se queria `eq` ou `ne` (D1); `break` ou `continue` sem nenhum loop em volta, `break` num ramo de `switch` dentro de um loop, e `return` num ramo de `switch` (D2).
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
- **D2:** Juergen Mang observou que os ramos de um `switch` não precisam de `return` nem de `break` para parar. Um ramo de `switch` nunca segue para o próximo, `return` sai do evento inteiro (a página de `return` da F5), e `break` sem nenhum loop em volta é um erro no Tcl 8.4.6 (verificado no corpo de um proc). A F5 não documenta o que o TMM faz com ele no corpo de um evento.

## Compartilhar resultado

Abaixo do veredito, **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a iRule como foi colada depois do `#`, e mais nada. Antes de você copiar qualquer coisa, o popover acrescenta um alerta: uma iRule pode citar hosts internos, pools e data groups.

Antes de oferecer qualquer link, a página procura na iRule chaves e credenciais escritas por extenso onde as próprias referências da F5 as colocam (todas lidas em 2026-10-27):

- a passphrase de `HTTP::cookie encrypt` e `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- uma chave na forma de string `AES 128 <hex>`, ou a chave de `AES::encrypt` e `AES::decrypt` escrita por extenso ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- o valor de `-key` ou `-keyhex` em `CRYPTO::encrypt`, `decrypt`, `sign` e `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- um header `Authorization` ou `Proxy-Authorization` escrito com `HTTP::header insert` ou `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), cujo valor a [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (seções 11.6.2 e 11.7.2) define como as credenciais;
- um literal atribuído com `set` a uma variável usada num desses lugares, como no próprio exemplo de `CRYPTO::encrypt`;
- e, pela verificação de segredos do site, chave privada PEM, JWT, ID de chave de acesso da AWS ou senha dentro de uma URL.

Quando a página encontra um desses, não há link: o popover aponta a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo (`set static::api_token "..."`) não impede o link; o alerta aponta esse valor em vez disso. Nenhuma verificação acha todo segredo, então leia o que vai mandar.

Tudo o que o link leva vai depois do `#`, e a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado): o navegador não o envia ao servidor quando o link é aberto, mas ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres, o limite que o site usa para todo valor depois do `#`; uma iRule maior não ganha link, e o popover diz o tamanho. A F5 aceita uma iRule de até 65.520 caracteres (K9204), então uma iRule longa pode passar por este verificador e ainda assim ser grande demais para um link.
- **Ao abrir um link.** O texto preenche a caixa como se tivesse sido colado, e a página o lê como lê uma colagem; a iRule nunca é executada. Aceitos ou não, os valores saem do endereço da própria página na hora, sem nenhuma requisição, então recarregar, salvar nos favoritos ou usar o botão Compartilhar da própria página não leva nada que você não escolheu compartilhar.

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
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lida em 2026-10-27): seção 3.5, o fragmento, que leva os valores de um link de Compartilhar resultado
- [Referência de iRules da F5: HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html), [AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html), [CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html) e [HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html) (lidas em 2026-10-27): onde uma iRule guarda passphrase, chave ou credenciais, que impedem um link de Compartilhar resultado
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (lida em 2026-10-27): seções 11.6.2 e 11.7.2, os valores de Authorization e Proxy-Authorization são credenciais
