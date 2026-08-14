## O que faz

Informe um I-SID, um nickname SPB ou um papel de switch, e a ferramenta organiza o vocabulário do Shortest Path Bridging: qual backbone VLAN carrega o serviço e por quê, a que um L2VSN e um L3VSN realmente se ligam, o que uma B-VLAN é e o que não é, e o que muda entre um backbone edge bridge e um backbone core bridge. Determinístico e offline — explica identificadores, não consulta um fabric.

## O comportamento que vale conferir

**I-SIDs pares circulam por uma backbone VLAN e ímpares pela outra.** Com os padrões Extreme de 4051 e 4052, o I-SID 20010 é carregado na 4052 e o 20011 na 4051. Duas árvores de caminho mais curto, cada uma carregando cerca de metade dos serviços.

A ferramenta diz que essa é **a distribuição padrão, e não uma regra do standard**, porque uma implantação pode atribuir de outra forma — e quando um serviço se comporta diferente dos vizinhos, em qual árvore ele está é a primeira coisa a verificar.

## O fato que a ferramenta repete em todo resultado

**Uma B-VLAN não é uma VLAN.** Ela não inunda unicast desconhecido, broadcast nem multicast. Encaminha apenas com tabelas de backbone MAC que o IS-IS provisionou a partir de árvores de caminho mais curto. Sem spanning tree, nada bloqueado.

O resto decorre: se o encaminhamento é calculado, o núcleo não aprende; se o núcleo não aprende, não precisa saber que os seus serviços existem. É por isso que **adicionar um serviço mexe apenas nos switches de borda onde ele aparece.**

## Validação que ela faz

Um I-SID precisa estar na faixa de 24 bits, e a ferramenta recusa valores fora dela em vez de explicar um número que não pode existir. Um nickname precisa estar na forma `x.xx.xx`, e um malformado gera aviso — **um nickname duplicado ou malformado é um dos poucos erros aqui que quebra coisas longe de onde foi digitado.**

## O que ela não faz

Não enxerga o seu fabric. Não conhece a sua topologia, as suas adjacências nem se o IS-IS está de fato ativo. Ela explica o que os seus números significam dentro de um fabric, não o que o seu fabric está fazendo.

## Como isto difere do decodificador de identificadores de fabric do VOSS

Os dois aceitam um I-SID e um nickname, e respondem perguntas diferentes:

- **O decodificador de identificadores valida um identificador.** Cole algo e ele descobre se é um I-SID de 24 bits, um nickname de 20 bits ou um system-id, e se está na faixa válida.
- **Esta ferramenta explica o que o identificador significa dentro de um fabric.** Qual backbone VLAN o carrega e por quê, a que um L2VSN e um L3VSN se ligam, o que uma B-VLAN é e o que não é, e o que muda entre um edge bridge e um core bridge.

Decodifique o valor lá; entenda o arranjo aqui.
