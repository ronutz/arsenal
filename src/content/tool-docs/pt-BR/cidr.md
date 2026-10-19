## O que faz

A Calculadora de CIDR / Sub-redes trabalha com blocos IPv4 escritos em notação CIDR, um endereço com um comprimento de prefixo, como `192.168.1.0/24`. Ela tem quatro modos, escolhidos nas abas do topo:

- **Sub-rede** analisa um bloco: endereço de rede, último endereço, máscara de rede, máscara curinga, primeiro e último host utilizável, total de endereços e hosts utilizáveis, os bits do endereço e as faixas de uso especial em que o bloco cai ou com que se sobrepõe.
- **VLSM** divide um bloco pai em sub-redes de tamanho variável, conforme uma lista de quantidades de hosts.
- **Super-rede** resume uma lista de prefixos no menor conjunto de blocos que cobre exatamente os mesmos endereços, e no menor prefixo único que cobre todos eles.
- **Sobreposição / lacuna** mostra quais prefixos de uma lista se sobrepõem ou contêm uns aos outros e, se você informar um escopo, lista o espaço dentro dele que nenhum prefixo cobre.

Todo o cálculo roda no seu navegador; nada do que você digita é enviado a lugar nenhum.

## Modo Sub-rede

Um comprimento de prefixo `/n` fixa os `n` bits iniciais do endereço de 32 bits como a parte de rede e deixa `32 - n` bits para hosts, então o bloco abrange `2^(32 - n)` endereços (RFC 4632, seção 3.1). Num bloco de /0 a /30, a ferramenta reserva dois deles: o endereço com todos os bits de host em 0 (o endereço de rede) e o que tem todos em 1 (o broadcast dirigido). A RFC 1122, seção 3.2.1.3, não permite 0 nem todos os bits em 1 no campo de host fora dos casos especiais que ela lista, por isso um bloco de /0 a /30 tem `2^(32 - n) - 2` hosts utilizáveis.

Um /31 e um /32 não reservam nada. A RFC 3021, seção 2.1, diz que, num enlace ponto a ponto com máscara de 31 bits, os dois endereços "MUST be interpreted as host addresses", ou seja, os dois são endereços de host. Por isso a ferramenta conta dois hosts utilizáveis num /31, rotula o primeiro endereço como o identificador da rede que também é um host utilizável e rotula o último como um endereço sem broadcast dirigido. Um /32 é um único host.

Um endereço digitado com bits de host ligados, como `192.168.1.77/24`, é lido como o bloco a que pertence: a linha do endereço de rede mostra `192.168.1.0`. O controle **Comprimento do prefixo** troca o prefixo do endereço atual e recalcula na hora. O botão **Exemplo** carrega `192.168.1.0/24`.

Exemplos resolvidos, como a ferramenta os mostra:

- `192.168.1.0/24`: rede `192.168.1.0`, broadcast `192.168.1.255`, utilizáveis de `192.168.1.1` a `192.168.1.254`, 254 hosts, máscara `255.255.255.0`, curinga `0.0.0.255`.
- `10.0.0.0/30`: rede `10.0.0.0`, broadcast `10.0.0.3`, utilizáveis de `10.0.0.1` a `10.0.0.2`, 2 hosts, máscara `255.255.255.252`.
- `10.0.0.0/31`: dois endereços utilizáveis, `10.0.0.0` e `10.0.0.1`, sem endereço de rede nem de broadcast reservado.

## Classificação de uso especial

Abaixo dos resultados do modo Sub-rede, a ferramenta compara o bloco com cada linha do registro IANA IPv4 Special-Purpose Address Space, baixado em 2026-10-19 (o registro foi atualizado pela última vez em 2025-10-09), mais uma linha para multicast. Ela dá um de três vereditos:

- **Dentro de uma faixa de uso especial**: o bloco inteiro está numa faixa listada. A frase cita a mais específica; por exemplo, `192.168.1.0/24` está dentro de `192.168.0.0/16`, Private-Use (RFC 1918).
- **Parcialmente de uso especial**: o bloco contém uma ou mais faixas listadas e também outros endereços. Dois blocos CIDR ou estão um dentro do outro ou não se tocam, então essa é a única forma de um bloco se sobrepor em parte a uma faixa. A frase dá a contagem; por exemplo, em `10.0.0.0/7`, 16.777.216 de 33.554.432 endereços caem em `10.0.0.0/8`. Linhas aninhadas contam uma vez só: `192.0.0.0/23` contém `192.0.0.0/24` e as seis linhas mais específicas dentro dele, e a ferramenta informa 256 de 512.
- **Nenhuma faixa de uso especial (espaço unicast roteável globalmente)**: o bloco não toca nenhuma faixa listada, por exemplo `172.32.0.0/24`, o /24 logo acima de `172.16.0.0/12`.

Abaixo do veredito, uma tabela lista todas as linhas que o bloco toca, da mais específica para a menos específica: a faixa, o nome no registro, a coluna RFC, a relação (**é este bloco**, **contém este bloco** ou **dentro deste bloco (sobreposição parcial)**) e quatro flags do registro. O próprio registro as define: **Origem** e **Destino** dizem se um endereço da faixa é válido como origem ou destino de um datagrama que atravessa dois dispositivos; **Encaminhável** diz se um roteador pode encaminhar esse datagrama entre interfaces externas; **Alcançável globalmente** diz se ele pode ser encaminhado além de um domínio administrativo definido. Quando o registro anexa uma nota, a ferramenta a mostra: a nota 1 nas flags de Loopback ("Several protocols have been granted exceptions to this rule", vários protocolos receberam exceções a essa regra) e a nota 2 em `192.0.0.0/24` ("Not useable unless by virtue of a more specific reservation", só pode ser usado por meio de uma reserva mais específica).

As linhas, como o registro as lista (Origem, Destino, Encaminhável, Alcançável globalmente):

| Faixa | Nome | RFC | O | D | E | G |
|---|---|---|---|---|---|---|
| `0.0.0.0/8` | "This network" | RFC 791, Section 3.2 | sim | não | não | não |
| `0.0.0.0/32` | "This host on this network" | RFC 1122, Section 3.2.1.3 | sim | não | não | não |
| `10.0.0.0/8` | Private-Use | RFC 1918 | sim | sim | sim | não |
| `100.64.0.0/10` | Shared Address Space | RFC 6598 | sim | sim | sim | não |
| `127.0.0.0/8` | Loopback | RFC 1122, Section 3.2.1.3 | não [1] | não [1] | não [1] | não [1] |
| `169.254.0.0/16` | Link Local | RFC 3927 | sim | sim | não | não |
| `172.16.0.0/12` | Private-Use | RFC 1918 | sim | sim | sim | não |
| `192.0.0.0/24` [2] | IETF Protocol Assignments | RFC 6890, Section 2.1 | não | não | não | não |
| `192.0.0.0/29` | IPv4 Service Continuity Prefix | RFC 7335 | sim | sim | sim | não |
| `192.0.0.8/32` | IPv4 dummy address | RFC 7600 | sim | não | não | não |
| `192.0.0.9/32` | Port Control Protocol Anycast | RFC 7723 | sim | sim | sim | sim |
| `192.0.0.10/32` | Traversal Using Relays around NAT Anycast | RFC 8155 | sim | sim | sim | sim |
| `192.0.0.170/32`, `192.0.0.171/32` | NAT64/DNS64 Discovery | RFC 8880; RFC 7050, Section 2.2 | não | não | não | não |
| `192.0.2.0/24` | Documentation (TEST-NET-1) | RFC 5737 | não | não | não | não |
| `192.31.196.0/24` | AS112-v4 | RFC 7535 | sim | sim | sim | sim |
| `192.52.193.0/24` | AMT | RFC 7450 | sim | sim | sim | sim |
| `192.88.99.0/24` | Deprecated (6to4 Relay Anycast), encerrado em 2015-03 | RFC 7526 | não listado | não listado | não listado | não listado |
| `192.88.99.2/32` | 6a44-relay anycast address | RFC 6751 | sim | sim | sim | não |
| `192.168.0.0/16` | Private-Use | RFC 1918 | sim | sim | sim | não |
| `192.175.48.0/24` | Direct Delegation AS112 Service | RFC 7534 | sim | sim | sim | sim |
| `198.18.0.0/15` | Benchmarking | RFC 2544 | sim | sim | sim | não |
| `198.51.100.0/24` | Documentation (TEST-NET-2) | RFC 5737 | não | não | não | não |
| `203.0.113.0/24` | Documentation (TEST-NET-3) | RFC 5737 | não | não | não | não |
| `224.0.0.0/4` | Multicast | RFC 1112, Section 4; RFC 5771 | não listado | não listado | não listado | não listado |
| `240.0.0.0/4` | Reserved | RFC 1112, Section 4 | não | não | não | não |
| `255.255.255.255/32` | Limited Broadcast | RFC 8190; RFC 919, Section 7 | não | sim | não | não |

O registro de uso especial não lista multicast. A linha de multicast vem do registro IANA IPv4 Multicast Address Space, cuja nota dá "the range 224.0.0.0 through 239.255.255.255", de 224.0.0.0 a 239.255.255.255, a mesma faixa que a RFC 1112, seção 4, dá para endereços de grupo de hosts. Esse registro não tem colunas de flags, então a ferramenta mostra essas flags como **não listado** em vez de adivinhá-las; faz o mesmo com a linha obsoleta do relay 6to4, cujas células de flag o registro deixa em branco.

Algumas linhas ficam mais claras com a RFC delas. A RFC 1918, seção 3, reserva os três blocos Private-Use "for private internets", para redes privadas. A RFC 6598 reserva `100.64.0.0/10` para Carrier-Grade NAT e diz que "Shared Address Space is distinct from RFC 1918 private address space because it is intended for use on Service Provider networks", ou seja, esse espaço é distinto do privado da RFC 1918 porque se destina às redes de provedores. A RFC 5737 reserva os três blocos TEST-NET para documentação. A RFC 1112, seção 4, diz que os endereços com "1111" nos quatro bits de ordem mais alta "are reserved for future addressing modes", estão reservados para modos de endereçamento futuros: é a linha `240.0.0.0/4`.

O que a classificação não faz: ela informa as linhas do registro e nada mais. Não consulta se um bloco está alocado a alguém ou anunciado na Internet, e o próprio registro observa que os prefixos listados "are not guaranteed routability in any particular local or global context", não têm roteabilidade garantida em nenhum contexto local ou global.

## Modo VLSM

Informe um **bloco pai** e uma linha por sub-rede: um nome opcional e a quantidade de hosts que ela precisa comportar. **Alocar** dimensiona e posiciona cada pedido:

1. **Tamanho.** Um pedido de `h` hosts recebe o menor bloco com pelo menos `h + 2` endereços, os dois sendo o de rede e o de broadcast (RFC 1122, seção 3.2.1.3). 100 hosts recebem um /25, 25 hosts um /27, 2 hosts um /30. Um pedido de 0 hosts é recusado com uma mensagem que aponta o problema; um pedido maior do que qualquer bloco IPv4 aparece como não coube.
2. **Ordem.** Os pedidos são alocados do maior bloco para o menor, não na ordem digitada, e o resultado diz isso. Assim cada bloco começa num múltiplo do próprio tamanho, e os blocos alocados não deixam buracos entre si.
3. **Posição.** Cada bloco ocupa a próxima posição alinhada dentro do pai; um pedido cujo bloco alinhado sairia do pai aparece em **Não couberam**.

A opção **Dar um /31 aos pedidos de 2 hosts (enlaces ponto a ponto, RFC 3021)** vem desligada. Marcada, um pedido de exatamente 2 hosts recebe um /31 em vez de um /30, e a linha dele não mostra broadcast: a RFC 3021, seção 2.1, faz dos dois endereços hosts, e a seção 2.2 diz que o broadcast limitado "MUST be used for all broadcast traffic on a point-to-point link with a 31-bit subnet mask", ou seja, é ele que leva todo o tráfego de broadcast nesse enlace. Use a opção só onde as duas pontas do enlace suportam prefixos de 31 bits: a seção 5 avisa que um enlace "in which only one end supports the use of 31-bit prefixes may not operate correctly", em que só uma ponta suporta /31, pode não funcionar direito.

Um bloco pai digitado com bits de host ligados, como `192.0.2.77/24`, é mascarado para `192.0.2.0/24`, e o resultado avisa isso acima da tabela, em vez de dividir o plano em silêncio a partir de um bloco diferente do digitado.

O resultado mostra o bloco pai, os endereços usados e livres, a utilização, uma tabela com cada sub-rede (nome, hosts pedidos, rede, prefixo, máscara, faixa utilizável, broadcast, hosts utilizáveis), o espaço livre que sobrou no pai em blocos CIDR e os pedidos que não couberam.

Exemplo resolvido: bloco pai `203.0.113.0/24` com um escritório de 100 hosts, uma LAN de visitantes de 25, uma LAN de gerência de 10 e dois enlaces entre roteadores de 2 hosts cada.

- Opção desligada: `203.0.113.0/25`, `203.0.113.128/27`, `203.0.113.160/28`, `203.0.113.176/30`, `203.0.113.180/30`; 184 endereços usados, 72 livres (71,9%), blocos livres `203.0.113.184/29` e `203.0.113.192/26`.
- Opção ligada: os enlaces viram `203.0.113.176/31` e `203.0.113.178/31`; 180 usados, 76 livres (70,3%), blocos livres `203.0.113.180/30`, `203.0.113.184/29` e `203.0.113.192/26`.

## Modo Super-rede

Cole até 1.024 prefixos, separados por quebras de linha, vírgulas ou espaços. **Agregar** junta os prefixos (os que se sobrepõem ou são adjacentes viram uma única faixa) e mostra:

- o **conjunto mínimo de cobertura**: o menor número de blocos CIDR alinhados que cobre exatamente os mesmos endereços das entradas, nem um a mais;
- a **super-rede única**: o menor prefixo único que cobre todas as entradas, e quantos endereços ele acrescenta além delas quando é maior que a união.

Exemplos: `192.168.0.0/24` e `192.168.1.0/24` viram `192.168.0.0/23`, sem nada a mais. `10.0.0.0/24` e `10.0.2.0/24` continuam dois blocos; a super-rede única `10.0.0.0/22` acrescentaria 512 endereços que não estão em nenhuma das entradas.

## Modo Sobreposição / lacuna

Cole até 1.024 prefixos e, se quiser, um **escopo**. **Verificar** compara cada par e rotula cada par sobreposto como **idêntico a**, **contém** ou **está dentro de**, com a faixa compartilhada e o tamanho dela; dois blocos CIDR ou estão um dentro do outro ou não se tocam, então toda sobreposição é uma dessas. A ferramenta também conta os endereços cobertos pelos prefixos. Com escopo, ela lista as **lacunas no escopo**: os endereços dentro do escopo que nenhum prefixo cobre, como os maiores blocos alinhados que cabem.

Exemplo: `10.0.0.0/26` e `10.0.0.128/26` no escopo `10.0.0.0/24` não se sobrepõem, cobrem 128 de 256 endereços e deixam as lacunas `10.0.0.64/26` e `10.0.0.192/26`.

## Fontes

- [IANA, IPv4 Special-Purpose Address Space registry, CSV](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) (registro atualizado em 2025-10-09; lido em 2026-10-19): cada linha de uso especial, suas flags e notas
- [IANA, IPv4 Multicast Address Space registry](https://www.iana.org/assignments/multicast-addresses/multicast-addresses.xml) (registro atualizado em 2026-08-20; lido em 2026-10-19): a faixa de multicast
- [RFC 4632: Classless Inter-domain Routing (CIDR)](https://www.rfc-editor.org/rfc/rfc4632) (lida em 2026-10-19): seção 3.1, notação de prefixo e tamanhos de bloco
- [RFC 1122: Requirements for Internet Hosts - Communication Layers](https://www.rfc-editor.org/rfc/rfc1122) (lida em 2026-10-19): seção 3.2.1.3, os valores reservados do campo de host
- [RFC 3021: Using 31-Bit Prefixes on IPv4 Point-to-Point Links](https://www.rfc-editor.org/rfc/rfc3021) (lida em 2026-10-19): seções 2.1, 2.2 e 5
- [RFC 6890: Special-Purpose IP Address Registries](https://www.rfc-editor.org/rfc/rfc6890) (lida em 2026-10-19), atualizada pela [RFC 8190](https://www.rfc-editor.org/rfc/rfc8190) (lida em 2026-10-19): a estrutura do registro
- [RFC 1918: Address Allocation for Private Internets](https://www.rfc-editor.org/rfc/rfc1918) (lida em 2026-10-19): seção 3
- [RFC 6598: IANA-Reserved IPv4 Prefix for Shared Address Space](https://www.rfc-editor.org/rfc/rfc6598) (lida em 2026-10-19)
- [RFC 5737: IPv4 Address Blocks Reserved for Documentation](https://www.rfc-editor.org/rfc/rfc5737) (lida em 2026-10-19)
- [RFC 3927: Dynamic Configuration of IPv4 Link-Local Addresses](https://www.rfc-editor.org/rfc/rfc3927) (lida em 2026-10-19)
- [RFC 1112: Host Extensions for IP Multicasting](https://www.rfc-editor.org/rfc/rfc1112) (lida em 2026-10-19): seção 4, endereços de grupo de hosts e a faixa da classe E
- [RFC 5771: IANA Guidelines for IPv4 Multicast Address Assignments](https://www.rfc-editor.org/rfc/rfc5771) (lida em 2026-10-19)
