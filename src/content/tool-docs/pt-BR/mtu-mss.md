## O que ela faz

Informe a MTU (Maximum Transmission Unit, unidade máxima de transmissão) do link e, se quiser, a pilha de encapsulamento que o tráfego atravessa, e a ferramenta calcula tudo o que a linha da MTU controla: a MTU IP interna e o MSS (Maximum Segment Size, tamanho máximo de segmento) do TCP para IPv4 e IPv6, os tamanhos de frame Ethernet que o link precisa aceitar, a MTU de underlay que um overlay exige para levar pacotes internos cheios de 1500 bytes e a eficiência no fio desta MTU comparada às referências de 1500 padrão e 9000 jumbo. Tudo é aritmética fixa de headers das RFCs, calculada localmente.

## A linha de entrada

Comece pela MTU e acrescente tokens em qualquer ordem: `v6` (header externo IPv6 para túneis), `pppoe`, `gre`, `ipip`, `6in4` (ou `sit`), `vxlan`, `geneve`, `wireguard` (ou `wg`), `vlan` (ou `dot1q`), `qinq`, `mpls` ou `mpls2`..`mpls8`, e `+N` para um overhead personalizado em bytes. Assim, `1500 vxlan` é a pergunta clássica de overlay, `1500 gre v6` é GRE sobre IPv6, `9000 vxlan vlan` é um underlay jumbo com tag, `1500 mpls2` é um link levando dois labels e `1500 +57` modela um custo medido de IPsec.

## A distinção que importa

Os overheads ficam em lados diferentes da linha da MTU, e a ferramenta mostra cada camada com o seu lado.

Encapsulamentos (PPPoE, GRE, IP-in-IP, 6in4, VXLAN, GENEVE, WireGuard, o seu `+N`) consomem bytes dentro da MTU do link, então encolhem a MTU IP interna e o MSS: é por isso que um túnel GRE num link de 1500 bytes mostra MTU 1476.

Os labels do MPLS (Multiprotocol Label Switching) também gastam MTU do link. A RFC 3032 define o payload do frame como o frame sem os headers e trailers de enlace, o 802.1Q incluído, e diz que, num pacote com label, "the Frame Payload consists of the label stack entries and the IP datagram", o payload é a pilha de labels mais o datagrama IP ([RFC 3032, seção 3.1](https://www.rfc-editor.org/rfc/rfc3032.txt)). Cada entrada da pilha tem 4 octetos (seção 2.1), então num link mantido no payload convencional de 1500 bytes do Ethernet o datagrama IP fica com 1496 bytes com um label, 1492 com dois e 1488 com três; 1488 é o tamanho que a seção 3.2 dá para um datagrama que ainda cabe num link de 1500 bytes "even if as many as three labels are pushed onto its label stack", mesmo com três labels empilhados. O frame Ethernet não cresce. Para levar pacotes IP cheios de 1500 bytes, a MTU MPLS do link precisa subir 4 bytes por label, e esse é o exemplo da própria RFC 3032: um pacote com payload de 1500 bytes que ganha mais um label tem de seguir "as frame with a 1504-byte payload", num frame com payload de 1504 bytes (seção 3).

Tags VLAN 802.1Q e QinQ são os shims de camada 2 de verdade: vão no header do frame, fora do payload, então a MTU IP não muda nada; quem cresce é o frame, e é por isso que uma única tag VLAN gera o baby giant de 1522 bytes e que plataformas de switch trazem folga de frame (MTUs de sistema como 9216) em vez de encolher a MTU IP.

## Path MTU Discovery: como o emissor chega a esses números

A MTU interna que a ferramenta mostra é o número que o emissor precisa descobrir num caminho real. No Path MTU Discovery (PMTUD) do IPv4, a origem manda datagramas com o bit Don't Fragment (DF) ligado e conta com os erros do ICMP (Internet Control Message Protocol) para saber quando passaram do tamanho; o roteador que não consegue encaminhar um deles sem fragmentar "will discard them and return ICMP Destination Unreachable messages with a code meaning 'fragmentation needed and DF set'", descarta e devolve um Destination Unreachable com esse código, e a origem reduz a estimativa ([RFC 1191, seção 2](https://www.rfc-editor.org/rfc/rfc1191.txt)). O roteador "MUST include the MTU of that next-hop network", precisa informar a MTU do próximo link nessa mensagem ICMP (seção 4), e esse Next-Hop MTU é o mesmo tipo de número que a ferramenta calcula para um túnel ou uma pilha de labels. No IPv6 a mensagem é o ICMPv6 Packet Too Big: "Path MTU Discovery relies on ICMPv6 Packet Too Big (PTB) to determine the MTU of the path", o PMTUD depende dela ([RFC 8201, seção 1](https://www.rfc-editor.org/rfc/rfc8201.txt)). O MPLS preserva o mecanismo: um datagrama IPv4 com label grande demais e com DF ligado "MUST NOT be forwarded", não pode ser encaminhado, e a resposta ICMP leva um Next-Hop MTU igual ao payload máximo efetivo do frame menos os bytes de label ([RFC 3032, seção 3.4](https://www.rfc-editor.org/rfc/rfc3032.txt)).

A falha comum é um filtro que descarta essas mensagens ICMP. O PMTUD "fails when the appropriate ICMP messages are not received by the originating host", falha quando o ICMP não chega à origem, os pacotes somem "into a PMTUD black hole", e o defeito é difícil de achar "as pings and some interactive TCP connections to the destination host work", porque ping e sessões interativas funcionam enquanto transferências grandes param no primeiro pacote grande ([RFC 2923, seção 2.1](https://www.rfc-editor.org/rfc/rfc2923.txt)). A RFC 8201 descreve o mesmo estado no IPv6: conexões "that complete the TCP three-way handshake correctly but then hang when data is transferred", o handshake fecha e a conexão trava na hora dos dados (seção 1). O contorno usual para TCP é o MSS clamping: os endpoints do túnel reduzem o MSS para que a conexão "automatically restricts itself to the maximum available packet size", se limite sozinha ao maior pacote possível; isso não resolve UDP nem outros protocolos sem MSS, e pressupõe que todo o tráfego passe pelos endpoints que fazem o clamping ([RFC 4459, seção 3.2](https://www.rfc-editor.org/rfc/rfc4459.txt)). No Linux, o target `TCPMSS` do iptables reescreve o MSS dos pacotes TCP SYN, em geral para a MTU da interface de saída menos 40 no IPv4 ou 60 no IPv6, a mesma subtração das duas linhas de MSS da ferramenta, e o manual diz o que ele contorna: ISPs ou servidores "which block 'ICMP Fragmentation Needed' or 'ICMPv6 Packet Too Big' packets", que bloqueiam essas mensagens ([iptables-extensions(8), TCPMSS](https://man7.org/linux/man-pages/man8/iptables-extensions.8.html)). O clamping esconde o sintoma; o conselho da RFC 2923 continua valendo: "Ideally, the ICMP black holes should be fixed when they are found", o certo é corrigir o filtro (seção 2.1).

## Os números que ela usa

Cada constante é fixada por protocolo: header IPv4 20 (RFC 791), IPv6 40 (RFC 8200), TCP 20 (RFC 9293), UDP 8 (RFC 768), header Ethernet 14 + FCS 4, com 20 bytes de preâmbulo e intervalo entre frames no fio, tag 802.1Q 4 no header do frame, entrada de label MPLS 4 dentro do payload do frame (RFC 3032), PPPoE 8 (RFC 2516), base GRE 4 (RFC 2784), IP-in-IP e 6in4 apenas com o header externo (RFC 2003 / RFC 4213), VXLAN 8 + UDP + IP externo + Ethernet interno = 50 com externo IPv4 ou 70 com IPv6 (RFC 7348), GENEVE a mesma base com opções variáveis por cima (RFC 8926), e WireGuard 60 com externo IPv4 ou 80 com IPv6. O IPsec ESP de propósito não é um preset: o overhead dele varia de verdade com o modo, a cifra, o tamanho do IV, o padding, a tag de integridade e o NAT-T, então fingir um número único seria desonesto. Meça o seu (ou tire da documentação da sua plataforma) e informe como `+N`.

## Exemplos resolvidos

`1500` sozinho dá MSS 1460 (IPv4) e 1440 (IPv6), frame máximo de 1518 bytes e 94,93% de eficiência no fio. `1500 gre` dá a clássica MTU interna de 1476. `1500 vxlan` dá 1450 interno e responde à pergunta de projeto: um underlay de 1550 bytes leva pacotes internos cheios de 1500. `1500 pppoe` dá o famoso 1492. `1500 vlan` mantém a MTU interna em 1500 e faz o frame crescer até o baby giant de 1522 bytes. `1500 mpls` dá 1496 interno e MSS 1456, mantém o frame em 1518 e mostra que o link precisa de payload de 1504 bytes para pacotes IP cheios de 1500; `1500 vlan mpls2` dá 1492 interno, frame de 1522 bytes e exige payload de 1508. `9000 vxlan` dá 8950 interno, a resposta padrão de overlay em data center. `1500 wireguard` dá 1440, e `1492 wireguard` (WireGuard sobre PPPoE) dá 1432.

## Compartilhar resultado

Abaixo dos números principais, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva depois do `#` a linha de entrada como você digitou: `/tools/mtu-mss#input=1500%20vxlan`. O popover dele diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então a linha não é enviada ao servidor quando o link é aberto; ela fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-la.

- **Ao abrir um link.** A linha preenche a caixa como se tivesse sido colada e a página calcula; uma linha que a calculadora não entende mostra a mensagem de sempre. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Procedência

Os tamanhos de header vêm das RFCs citadas acima; os overheads compostos (GRE 24, VXLAN 50/70, WireGuard 60/80, PPPoE 8) foram conferidos em várias referências independentes de overhead de túnel em 20/07/2026. Em 19/10/2026 a regra do MPLS foi corrigida pela seção 3.1 da RFC 3032: as versões anteriores punham os labels no header do frame junto com as tags 802.1Q e deixavam a MTU IP intacta. A ferramenta traz 25 golden vectors (conjunto `mtu-mss/2026-10-19a`) que fixam cada número clássico, entre eles o 1504 e o 1488 da RFC 3032, então qualquer desvio na aritmética quebra o build.

## API

O mesmo motor responde à operação `/api/v1/mtu-mss` da API HTTP do site, descrita campo a campo no contrato OpenAPI da [página da API](/api), com exemplos tirados dos vetores de ouro. O contrato também diz se este site serve a API.

- **Requisição.** A linha de entrada como texto, por exemplo `1500 vlan mpls2`.
- **Resposta.** `mtu`, `outer`, `layers` (cada uma com `id`, `bytes` e `kind`: `encap`, `label` ou `shim`), `encapTotal`, `labelTotal`, `shimTotal`, `innerMtu`, `mssV4`, `mssV6`, `frame`, `efficiency`, `underlay` (presente quando a pilha gasta bytes dentro da MTU), `innerIsV6Only` e `hasVariableLayer`. Para `1500 vlan mpls2` a API responde `innerMtu` 1492, `labelTotal` 8, `shimTotal` 4, `frame.maxFrame` 1522 e `underlay.requiredMtu` 1508.
- **Erros.** HTTP 400, `invalid_input`, com a mensagem do motor, por exemplo `mpls label count must be 1..8` para `1500 mpls9`.

Desde 2026-10-19 os labels MPLS são do tipo `label`: `labelTotal` é novo e sai da MTU, `shimTotal` conta só as tags 802.1Q e QinQ, e `underlay.requiredMtu` é 1500 mais `encapTotal` mais `labelTotal`.

## Fontes

- [RFC 3032, MPLS Label Stack Encoding, janeiro de 2001](https://www.rfc-editor.org/rfc/rfc3032.txt) (lida em 2026-10-19): seção 2.1 (entrada de label de 4 octetos), seção 3 (o exemplo do payload de 1504 bytes), seção 3.1 (Frame Payload), seção 3.2 (1488 com três labels), seção 3.4 (datagramas IPv4 com label grandes demais)
- [RFC 1191, Path MTU Discovery, novembro de 1990](https://www.rfc-editor.org/rfc/rfc1191.txt) (lida em 2026-10-19): seções 2 e 4
- [RFC 8201, Path MTU Discovery for IP version 6, julho de 2017](https://www.rfc-editor.org/rfc/rfc8201.txt) (lida em 2026-10-19): seção 1
- [RFC 2923, TCP Problems with Path MTU Discovery, setembro de 2000](https://www.rfc-editor.org/rfc/rfc2923.txt) (lida em 2026-10-19): seção 2.1, Black Hole Detection
- [RFC 4459, MTU and Fragmentation Issues with In-the-Network Tunneling, abril de 2006](https://www.rfc-editor.org/rfc/rfc4459.txt) (lida em 2026-10-19): seção 3.2, MSS clamping
- [iptables-extensions(8), iptables 1.8.13, página de manual do Linux](https://man7.org/linux/man-pages/man8/iptables-extensions.8.html) (lida em 2026-10-19): o target TCPMSS
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lida em 2026-10-27): seção 3.5, o fragmento, que leva os valores de um link de Compartilhar resultado
