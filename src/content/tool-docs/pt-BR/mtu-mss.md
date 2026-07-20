## O que ela faz

Informe a MTU (Maximum Transmission Unit, unidade máxima de transmissão) do link e, opcionalmente, a pilha de encapsulamento que o tráfego atravessa, e a ferramenta calcula tudo o que a linha da MTU controla: a MTU IP interna e o MSS (Maximum Segment Size, tamanho máximo de segmento) do TCP para IPv4 e IPv6, os tamanhos de quadro Ethernet que o link precisa aceitar, a MTU de underlay que um overlay exige para transportar pacotes internos cheios de 1500 bytes e a eficiência no fio desta MTU comparada às referências de 1500 padrão e 9000 jumbo. Tudo é aritmética fixa de cabeçalhos das RFCs, calculada localmente.

## A linha de entrada

Comece pela MTU e adicione tokens em qualquer ordem: `v6` (cabeçalho externo IPv6 para túneis), `pppoe`, `gre`, `ipip`, `6in4` (ou `sit`), `vxlan`, `geneve`, `wireguard` (ou `wg`), `vlan` (ou `dot1q`), `qinq`, `mpls` ou `mpls2`..`mpls8`, e `+N` para um overhead personalizado em bytes. Assim, `1500 vxlan` é a pergunta clássica de overlay, `1500 gre v6` é GRE sobre IPv6, `9000 vxlan vlan` é um underlay jumbo com tag, e `1500 +57` modela um custo medido de IPsec.

## A distinção que importa

Os overheads vivem em dois lados diferentes da linha da MTU. Encapsulamentos (PPPoE, GRE, IP-in-IP, 6in4, VXLAN, GENEVE, WireGuard, o seu `+N` personalizado) consomem bytes dentro da MTU do link, então encolhem a MTU IP interna e o MSS: por isso um túnel GRE em um link de 1500 bytes mostra MTU 1476. Shims de camada 2 (tags VLAN 802.1Q, QinQ, rótulos MPLS) viajam no cabeçalho do quadro, fora do payload IP, então a MTU IP não se move; o quadro é que cresce - e é por isso que uma única tag VLAN cria o baby giant de 1522 bytes e por que plataformas de switch carregam folga de quadro (MTUs de sistema como 9216) em vez de encolher a MTU IP. A ferramenta apresenta as duas famílias separadamente para que a distinção fique visível.

## Os números que ela usa

Cada constante é fixada por protocolo: cabeçalho IPv4 20 (RFC 791), IPv6 40 (RFC 8200), TCP 20 (RFC 9293), UDP 8 (RFC 768), cabeçalho Ethernet 14 + FCS 4 com 20 bytes de preâmbulo e intervalo entre quadros no fio, tag 802.1Q 4, rótulo MPLS 4 (RFC 3032), PPPoE 8 (RFC 2516), base GRE 4 (RFC 2784), IP-in-IP e 6in4 apenas com o cabeçalho externo (RFC 2003 / RFC 4213), VXLAN 8 + UDP + IP externo + Ethernet interno = 50 com externo IPv4 ou 70 com IPv6 (RFC 7348), GENEVE a mesma base com opções variáveis por cima (RFC 8926), e WireGuard 60 com externo IPv4 ou 80 com IPv6. O IPsec ESP deliberadamente não é um preset: o overhead dele varia de verdade com o modo, a cifra, o tamanho do IV, o padding, a tag de integridade e o NAT-T, então fingir um número único seria desonesto. Meça o seu (ou tire da documentação da sua plataforma) e informe como `+N`.

## Exemplos resolvidos

`1500` sozinho dá MSS 1460 (IPv4) e 1440 (IPv6), quadro máximo de 1518 bytes e 94,93% de eficiência no fio. `1500 gre` dá a clássica MTU interna de 1476. `1500 vxlan` dá 1450 interno e responde à pergunta de projeto: um underlay de 1550 bytes transporta pacotes internos cheios de 1500. `1500 pppoe` dá o famoso 1492. `1500 vlan` mantém a MTU interna em 1500 e faz o quadro crescer até o baby giant de 1522 bytes. `9000 vxlan` dá 8950 interno, a resposta padrão de overlay em data center. `1500 wireguard` dá 1440, e `1492 wireguard` (WireGuard sobre PPPoE) dá 1432.

## Procedência

Os tamanhos de cabeçalho vêm das RFCs citadas acima; os overheads compostos (GRE 24, VXLAN 50/70, WireGuard 60/80, PPPoE 8) foram verificados de forma cruzada em múltiplas referências independentes de overhead de túnel em 20/07/2026. A ferramenta traz 22 vetores dourados fixando cada número clássico, então qualquer deriva na aritmética quebra o build.
