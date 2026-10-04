## O que faz

Num BIG-IP, "isto começa em 0 ou em 1?" não tem uma resposta única. O Tcl, a linguagem por baixo dos iRules, conta toda posição a partir de 0. Vários comandos que a F5 acrescentou contam a partir de 1. Contadores devolvem 1 para o primeiro item. Muitos zeros da configuração são valores e não posições. O localizador reúne 76 desses lugares, cada um com a sua fonte, para você conferir aquele em que vai confiar.

Ele tem dois modos:

- **Consultar** lista os lugares, agrupados por parte do sistema: Tcl dentro dos iRules, comandos que a F5 acrescenta aos iRules, objetos de configuração, plataforma e hardware, APIs, e logs e captura de pacotes. Busque por comando ou termo, ou filtre por onde a contagem começa.
- **Traduzir uma posição** recebe uma posição do jeito que as pessoas contam, em que 1 é o primeiro, converte no número que cada comando precisa, executa cada comando no motor didático de Tcl 8.4.6 do site e mostra ao lado a versão com um a mais ou a menos.

## Como ler uma entrada

- **O selo** diz como o lugar conta: `0` começa em 0, `1` começa em 1, `←` conta pela direita (`end`, `end-1`, os N últimos), `0·1` significa que as duas bases se encontram no mesmo lugar, `=0` significa que 0 é um valor com significado (padrão, sem limite, todos, sucesso, igual) e `n` indica uma contagem fácil de confundir com uma posição.
- **Conta**, **Primeiro**, **Último** e **Quando não há nada** dizem o que é contado, como chegar ao primeiro e ao último item e o que volta quando não há nada (-1, 0 ou uma string vazia).
- **Exemplo** mostra o código e o que ele devolve. Todo exemplo de Tcl foi executado num tclsh 8.4.6 de verdade.
- **Atenção** é a armadilha pela qual aquela entrada é conhecida.
- **As páginas da F5 discordam** aparece quando duas afirmações da F5 não podem estar certas ao mesmo tempo.
- **Grau de certeza** separa quatro níveis: afirmado pelo manual do Tcl e executado no tclsh 8.4.6; afirmado pela fonte; mostrado só por um exemplo na página da fonte; e duas afirmações da F5 que discordam.
- **Fontes** lista cada página em que a entrada se apoia, com a data em que foi lida.

## Regras práticas

1. As posições do Tcl contam a partir de 0, e `end` é o último índice, o comprimento menos um.
2. Os números em estilo de campo da F5 contam a partir de 1: campos de `getfield`, profundidades de `URI::path`, índices de segmento de caminho das políticas LTM, o antigo `matchclass`.
3. Contadores devolvem 1 para o primeiro item: `HTTP::request_num`, `table incr`.
4. Muitos zeros são valores, não posições: domínio de roteamento 0, porta 0, `connection-limit 0`, `SSL::verify_result` 0 e o `0.0` do tcpdump.
5. O menor vai primeiro quase sempre (prioridade de evento, ordinais de política, ordem do BIG-IP DNS, severidade do syslog), exceto nos grupos de prioridade de pool, onde o maior ganha.
6. Num `if`, 0 é falso e qualquer outro número é verdadeiro, inclusive -1: compare um índice com `>= 0` em vez de testá-lo, e guarde suas próprias flags como 0 ou 1, como pede o iRules Style Guide do DevCentral.

## O tradutor

Escolha uma pergunta, informe um valor e N (1 é o primeiro):

- **O N-ésimo caractere**: `string index` e `string range` com N-1, e o `substr` da F5, ao lado de `string index` com N.
- **O N-ésimo campo depois de dividir**: o `getfield` da F5 com N, e `split` seguido de `lindex` com N-1, ao lado dos dois contados do jeito errado.
- **O N-ésimo segmento de um caminho**: os mesmos dois comandos, levando em conta o pedaço vazio antes de uma barra inicial, ao lado da versão que se esquece dele.
- **Os últimos N rótulos de um nome de host**: o `domain` da F5, e `split`, `lrange` a partir do fim e `join`, ao lado da versão que pega um rótulo a mais.
- **O N-ésimo elemento de uma lista Tcl**: `lindex` com N-1, ao lado de `lindex` com N.
- **Onde um texto aparece primeiro**: `string first`, e o teste `>= 0`, ao lado de um `if` sobre o próprio índice.

Cada linha é marcada como **A numeração do próprio comando** (o número certo para aquele comando), **Erro de um** ou **Uma resposta relacionada**. A resposta no topo é o que a primeira linha certa devolveu, e uma nota aparece quando linhas certas discordam entre si. As notas explicam os casos que mudam os números: um valor que começa com o separador, um caminho com query string (`HTTP::uri` a inclui, `HTTP::path` não), um separador de mais de um caractere (`split` trata cada caractere como separador, `getfield` usa a string inteira) e um casamento no índice 0 ou uma ausência em -1.

## Onde as páginas da F5 discordam

Ler as fontes com atenção revelou lugares em que duas afirmações da F5 não podem estar certas ao mesmo tempo. Nenhum foi testado num BIG-IP para esta ferramenta, então trate cada um como uma pergunta a confirmar na sua versão: a contagem 0 do `substr`, os comentários do exemplo de `URI::path`, o valor do `matchclass` quando nada casa, o intervalo na página de `priority`, o nome da variável no exemplo de `DNSMSG::record`, a descrição do ordinal de política no iControl REST, a ordem das listas de controle de acesso (ACLs) do APM e a prioridade que `LB::server` informa para um membro sem prioridade configurada. Cada conflito aparece na sua entrada, com as duas fontes.

## Limites

- O tradutor aceita um valor de até 2.000 caracteres, N de 1 a 1.000, um separador de até 20 caracteres e um texto de busca de até 200 caracteres, e cada comando para depois de 200 passos.
- Os comandos da F5 no tradutor se comportam como as páginas da F5 os descrevem. Onde uma página é omissa, a linha avisa: a página de `getfield` da F5 não tem exemplo em que a string começa com o separador, então a leitura da ferramenta para esse caso é marcada como suposição.
- As entradas de plataforma, configuração e API vêm da documentação da F5 e não foram testadas em hardware para esta ferramenta.
- Tudo roda no seu navegador. Nada é enviado para lugar nenhum, e nada roda num BIG-IP.

## Fontes

A ferramenta lista cada fonte com a data em que foi lida, 109 no total. As principais:

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (lido em 2026-10-03)
- [F5 K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)](https://my.f5.com/manage/s/article/K36322151) (lido em 2026-10-03)
- [Manual do Tcl 8.4: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (lido em 2026-10-03)
- [Manual do Tcl 8.4: lindex](https://www.tcl-lang.org/man/tcl8.4/TclCmd/lindex.htm) (lido em 2026-10-03)
- [Manual do Tcl 8.4: split](https://www.tcl-lang.org/man/tcl8.4/TclCmd/split.htm) (lido em 2026-10-03)
- [Manual do Tcl 8.4: if](https://www.tcl-lang.org/man/tcl8.4/TclCmd/if.htm) (lido em 2026-10-03)
- [Referência de iRules da F5: getfield](https://clouddocs.f5.com/api/irules/getfield.html) (lido em 2026-10-03)
- [Referência de iRules da F5: substr](https://clouddocs.f5.com/api/irules/substr.html) (lido em 2026-10-03)
- [Referência de iRules da F5: domain](https://clouddocs.f5.com/api/irules/domain.html) (lido em 2026-10-03)
- [Referência de iRules da F5: URI::path](https://clouddocs.f5.com/api/irules/URI__path.html) (lido em 2026-10-03)
- [Referência de iRules da F5: priority](https://clouddocs.f5.com/api/irules/priority.html) (lido em 2026-10-03)
- [Referência do tmsh da F5: ltm policy](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_policy.html) (lido em 2026-10-03)
- [Referência do tmsh da F5: ltm pool](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_pool.html) (lido em 2026-10-03)
- [F5 K411: Overview of packet tracing with the tcpdump utility](https://my.f5.com/manage/s/article/K411) (lido em 2026-10-03)
- [F5 DevCentral: iRules Style Guide](https://community.f5.com/t/irules-style-guide/71151) (lido em 2026-10-03)
