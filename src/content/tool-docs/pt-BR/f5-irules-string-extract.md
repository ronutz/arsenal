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
- Um salto além do fim, um salto ou uma contagem negativos, um terminador vazio e um número de campo do `getfield` fora dos campos existentes.

Confirme esses casos num BIG-IP antes de depender deles.

## Fontes

- [Referência tmsh da F5: findstr](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_findstr.html) (lido em 2026-10-03)
- [Referência tmsh da F5: substr](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_substr.html) (lido em 2026-10-03)
- [Referência tmsh da F5: getfield](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_getfield.html) (lido em 2026-10-03)
- [Referência de iRules da F5: substr, com a nota de colaborador sobre a contagem 0](https://clouddocs.f5.com/api/irules/substr.html) (lido em 2026-10-02)
- [Manual do Tcl 8.4: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (lido em 2026-10-03)
