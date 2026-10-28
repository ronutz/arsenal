## O que faz

`findstr`, `substr` e `getfield` são comandos que a F5 acrescenta aos iRules para recortar um pedaço de um valor. A ferramenta roda o que você escolher na sua string e marca o resultado numa régua: a string procurada encontrada, os caracteres pulados, o terminador, os separadores e o campo devolvido. Ao lado, o Tcl puro que faz o mesmo trabalho roda no mesmo motor, para você ver se os dois concordam de fato.

## Os três comandos

- `findstr string search ?skip? ?terminator?` encontra `search`, avança `skip` caracteres a partir do início do casamento e devolve até o terminador. Exemplo da F5: `findstr "<sip:+12065551234@sip.example.com>" "@" 1 ">"` devolve `sip.example.com`.
- `substr string skip ?terminator?` começa no índice `skip`, onde 0 é o primeiro caractere. `substr "abcdefghijklm" 2 "gh"` devolve `cdef`.
- `getfield string separator field` divide em cada ocorrência do separador, que pode ser um caractere ou uma string, e devolve aquele campo, contando a partir de 1.

Em `findstr` e `substr`, um terminador numérico é um comprimento (até essa quantidade de caracteres, menos se a string acabar antes); qualquer outro terminador é um texto antes do qual parar. Todos os exemplos publicados pela F5 para esses comandos são reproduzidos exatamente pelos testes da ferramenta.

## O que a F5 não documenta

Onde as páginas da F5 se calam, a ferramenta declara a suposição que fez, marcada como "Não documentado pela F5":

- `findstr` quando a string procurada não aparece. A ferramenta devolve uma string vazia. A F5 diz que `findstr` equivale a `string range` com `string first`, mas esse equivalente devolve a string inteira nesse caso, então as duas descrições não podem estar certas ao mesmo tempo.
- Uma contagem 0. A regra da F5 ("essa quantidade de caracteres") devolveria nada, mas o próprio exemplo de `substr` da F5 com 0 devolve o resto da string; a ferramenta segue o exemplo, e uma nota de colaborador na página da referência de API da F5 relata que 0 não funcionou nas versões 11.5.4 e 11.6.0.
- Um skip além do fim, um skip ou uma contagem negativos, um terminador vazio e um número de campo do `getfield` fora dos campos existentes.

Confirme esses casos num BIG-IP antes de depender deles.

## Compartilhar resultado

Abaixo do resultado, **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o formulário pelo nome: a string como `#input=`, o comando como `&command=` e os campos do comando que estão preenchidos (`&search=`, `&skip=`, `&terminator=`, `&separator=`, `&field=`). Tudo o que o link leva vai depois do `#`, e a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado): o navegador não o envia ao servidor quando o link é aberto, mas ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** Um link leva no máximo 16.384 caracteres, o limite que o site usa para todo valor depois do `#`; campos maiores que isso não ganham link, e o popover diz o tamanho.
- **Ao abrir um link.** O comando, a string e os campos são preenchidos como se você tivesse digitado (um campo que o link não leva fica vazio; um link sem comando abre o `findstr`, o primeiro da página) e o resultado é calculado. Um comando desconhecido ou um campo que o comando não aceita faz o link inteiro ser ignorado. Aceitos ou não, os valores saem do endereço da própria página na hora, sem nenhuma requisição, então recarregar, salvar nos favoritos ou usar o botão Compartilhar da própria página não leva nada que você não escolheu compartilhar.

## Fontes

- [Referência tmsh da F5: findstr](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_findstr.html) (lido em 2026-10-03)
- [Referência tmsh da F5: substr](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_substr.html) (lido em 2026-10-03)
- [Referência tmsh da F5: getfield](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_getfield.html) (lido em 2026-10-03)
- [Referência de iRules da F5: substr, com a nota de colaborador sobre a contagem 0](https://clouddocs.f5.com/api/irules/substr.html) (lido em 2026-10-02)
- [Manual do Tcl 8.4: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (lido em 2026-10-03)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lida em 2026-10-27): seção 3.5, o fragmento, que leva os valores de um link de Compartilhar resultado
