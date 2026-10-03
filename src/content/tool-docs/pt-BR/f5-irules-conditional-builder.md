## O que faz

Descreva uma decisão como regras em ordem ("caminhos que começam com /api vão para api_pool, /login vai para login_pool, o resto para web_pool") e a ferramenta a escreve de três jeitos:

- uma cadeia `if` / `elseif`,
- um `switch` (com `-glob` quando alguma regra precisa e `--` antes do valor),
- uma consulta `class match` a data groups, com as definições dos data groups em `tmsh`.

Em seguida, um valor de teste passa por cada regra gerada no interpretador didático, e a página mostra qual pool cada forma escolheu.

## Por que as formas podem discordar

`if` e `switch` pegam a **primeira** regra que casa, na ordem escrita. `class match` com `starts_with` ou `ends_with` devolve a entrada **mais longa** que casar, seja qual for a ordem (a referência de `class` da F5 diz isso). Com as regras `/api` e `/api/v2`, o valor de teste `/api/v2/users` vai para `api_pool` por `if` e `switch`, mas para `api_v2_pool` por `class match`. A ferramenta também sinaliza uma regra que nunca pode disparar porque uma regra anterior sempre casa antes.

## Vale saber

- Passar o valor para minúsculas (`string tolower`) torna a comparação indiferente à caixa, mas então um valor de regra com maiúsculas nunca casa; a ferramenta avisa sobre isso.
- `class match` não tem comparação glob, então uma regra glob impede a forma com data group.
- Um valor de regra com uma chave sem par é escrito com uma barra invertida na frente (`\{`). O Tcl conta as chaves dentro de um corpo entre chaves mesmo entre aspas duplas (regra 5 da página de sintaxe do Tcl 8.4), então uma chave sozinha quebraria a regra; o Tcl 8.4.6 real para com `missing close-brace`.
- Para `HTTP::path`, o valor de teste é cortado no primeiro ponto de interrogação: `HTTP::path` não inclui a query string (referência de `HTTP::path` da F5), então as regras comparam só a parte anterior a ele.
- Nomes de registro com caracteres além de letras, dígitos e `_ . / : -` são escritos entre aspas duplas nas definições em `tmsh`. Essas aspas não foram testadas num BIG-IP: depois de criar o data group, liste-o no `tmsh` e confira os registros.
- O código gerado segue o iRules Style Guide do DevCentral (indentação de 4 espaços, prioridade no evento, expressões entre chaves, nomes de variáveis entre chaves, `--` em `switch` e `class`) e passa no verificador de estilo deste site sem nenhum apontamento.

## Fontes

- [Referência de iRules da F5: class](https://clouddocs.f5.com/api/irules/class.html) (lido em 2026-10-02)
- [Referência de iRules da F5: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (lido em 2026-10-02)
- [Manual do Tcl 8.4: switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (lido em 2026-10-03)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (lido em 2026-10-03)
- [F5 DevCentral: iRules Style Guide](https://community.f5.com/t/irules-style-guide/71151) (lido em 2026-10-03)
- [Referência de iRules da F5: priority](https://clouddocs.f5.com/api/irules/priority.html) (lido em 2026-10-03)
- [Referência de iRules da F5: HTTP::path](https://clouddocs.f5.com/api/irules/HTTP__path.html) (lido em 2026-10-03)
- [Manual do Tcl 8.4: Tcl (as regras de substituição)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (lido em 2026-10-03)
