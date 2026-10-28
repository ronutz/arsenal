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

## Compartilhar resultado

Abaixo do veredito sobre o valor de teste, **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a decisão inteira pelo nome: `#subject=` (e `&header=` para um header), `&lower=1` ou `0`, as regras em ordem como uma lista Tcl de listas `{comparação valor pool}` (`&rules={starts_with /api api_pool} {equals /login login_pool}`, com percent-encoding no link), e o pool padrão, o nome do data group e o valor de teste (`&default=`, `&group=`, `&test=`) quando estão preenchidos. Os nomes de pool, data group e header são seus; o aviso padrão do popover vale para eles. Tudo o que o link leva vai depois do `#`, e a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado): o navegador não o envia ao servidor quando o link é aberto, mas ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** Um link leva no máximo 16.384 caracteres, o limite que o site usa para todo valor depois do `#`; mesmo 50 regras ficam bem abaixo disso.
- **Ao abrir um link.** A decisão do link substitui o formulário inteiro, inclusive o Exemplo com que a página abre (um campo que o link não leva fica vazio; uma decisão com base num header sem nome usa `User-Agent`, o padrão da página), e as três formas são geradas. Um valor de requisição ou uma comparação desconhecidos, um valor de regras que não seja uma lista de listas de três elementos, mais de 50 regras ou um valor maior do que a página permite faz o link inteiro ser ignorado. Aceitos ou não, os valores saem do endereço da própria página na hora, sem nenhuma requisição, então recarregar, salvar nos favoritos ou usar o botão Compartilhar da própria página não leva nada que você não escolheu compartilhar.

## Fontes

- [Referência de iRules da F5: class](https://clouddocs.f5.com/api/irules/class.html) (lido em 2026-10-02)
- [Referência de iRules da F5: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (lido em 2026-10-02)
- [Manual do Tcl 8.4: switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (lido em 2026-10-03)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (lido em 2026-10-03)
- [F5 DevCentral: iRules Style Guide](https://community.f5.com/t/irules-style-guide/71151) (lido em 2026-10-03)
- [Referência de iRules da F5: priority](https://clouddocs.f5.com/api/irules/priority.html) (lido em 2026-10-03)
- [Referência de iRules da F5: HTTP::path](https://clouddocs.f5.com/api/irules/HTTP__path.html) (lido em 2026-10-03)
- [Manual do Tcl 8.4: Tcl (as regras de substituição)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (lido em 2026-10-03)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lida em 2026-10-27): seção 3.5, o fragmento, que leva os valores de um link de Compartilhar resultado
