## O que faz

Um endereço MAC é um endereço de hardware de 48 bits, normalmente escrito como seis bytes hexadecimais como `00:1b:54:11:22:33`. Os três primeiros bytes são o OUI (Organizationally Unique Identifier), que a IEEE atribui a um fabricante. Esta ferramenta recebe um MAC (em qualquer formato comum) ou apenas um OUI, consulta o OUI em um snapshot embutido do registro IEEE MA-L para nomear o fabricante, e lê os dois bits significativos do primeiro byte. Ela também reconhece endereços cujo significado é definido por uma norma e não por um fabricante: mapeamentos de multicast, roteadores virtuais VRRP, atribuições da IANA e endereços de grupo conhecidos. Tudo roda no seu navegador.

## Os dois bits que importam

O primeiro byte de um MAC carrega duas flags nos seus bits mais baixos:

- O **bit I/G** (bit menos significativo) é unicast quando 0 e multicast quando 1. Um endereço multicast é um endereço de grupo, não uma única interface.
- O **bit U/L** (segundo bit menos significativo) é universal quando 0 e administrado localmente quando 1. Um endereço de administração universal é globalmente único e vem do OUI de um fabricante; um endereço administrado localmente foi definido por software (um hipervisor, uma interface agregada, um MAC de Wi-Fi aleatorizado) e não tem fabricante.

Assim, `02:...` é administrado localmente (não há fabricante a encontrar) e `01:...` é multicast. A exceção prevista em norma é `33-33`, mais abaixo: ele tem o bit Local ligado, mas é o mapeamento de multicast IPv6, e não um endereço escolhido por software (RFC 9542, seção 2.3.1).

## Mapeamentos de multicast

- **Multicast IPv4, de `01-00-5E-00-00-00` a `01-00-5E-7F-FF-FF`.** A seção 6.4 da RFC 1112 mapeia um grupo "placing the low-order 23-bits of the IP address into the low-order 23 bits of the Ethernet multicast address 01-00-5E-00-00-00", copiando os 23 bits mais baixos do endereço IP para os 23 bits mais baixos do MAC. Um endereço de grupo tem 28 bits significativos, então 5 bits se perdem e 32 grupos IPv4 dividem cada MAC. A ferramenta lista os 32: `01:00:5e:00:00:01` é compartilhado por `224.0.0.1`, `224.128.0.1`, `225.0.0.1` e assim por diante até `239.128.0.1`. A metade de cima do bloco não é IPv4: o registro IANA Ethernet Numbers atribui de `01-00-5E-80-00-00` a `8F-FF-FF` ao multicast MPLS (RFC 5332), e a ferramenta mostra isso.
- **Multicast IPv6, `33-33-xx-xx-xx-xx`.** A seção 7 da RFC 2464 envia um pacote multicast IPv6 para "the Ethernet multicast address whose first two octets are the value 3333 hexadecimal and whose last four octets are the last four octets of DST", o MAC que começa com 3333 e termina com os quatro últimos octetos do destino. A ferramenta mostra esses 32 bits finais, então `33:33:00:00:00:01` carrega `0000:0001`, o final de `ff02::1`.

## VRRP e outras atribuições da IANA

A IANA detém o OUI `00-00-5E`. A seção 7.3 da RFC 9568 monta o MAC de um virtual router VRRP como `00-00-5E-00-01-{VRID}` para IPv4 e `00-00-5E-00-02-{VRID}` para IPv6, em que o VRID é "An integer value (1-255)", um inteiro de 1 a 255. A ferramenta mostra, por exemplo, `Roteador virtual VRRP (IPv4), VRID 1` para `00:00:5e:00:01:01` e avisa quando o VRID é 0, fora dessa faixa.

As demais linhas nomeadas do registro IANA Ethernet Numbers também são reconhecidas, cada uma com a RFC que o registro cita:

| Endereço ou faixa | Significado | Referência |
| --- | --- | --- |
| `00-00-5E-00-00-00` a `00-00-5E-00-00-FF` | Reserved | RFC 9542 |
| `00-00-5E-00-52-00`, `-01` | PacketPWEthA, PacketPWEthB | RFC 6658 |
| `00-00-5E-00-52-02` | BFD for VXLAN | RFC 8971 |
| `00-00-5E-00-52-13` | Proxy Mobile IPv6 | RFC 6543 |
| `00-00-5E-00-53-00` a `00-00-5E-00-53-FF` | Documentation (unicast) | RFC 9542 |
| `00-00-5E-90-01-00` e `01-00-5E-90-01-00` | TRILL OAM | RFC 7455 |
| `01-00-5E-80-00-00` a `01-00-5E-8F-FF-FF` | MPLS Multicast | RFC 5332 |
| `01-00-5E-90-00-00` | MPLS-TP p2p | RFC 7213 |
| `01-00-5E-90-00-01` | BFD em interfaces Link Aggregation Group (LAG) | RFC 7130 |
| `01-00-5E-90-00-02`, `-03` | AllL1MI-ISs, AllL2MI-ISs | RFC 8202 |
| `01-00-5E-90-10-00` a `01-00-5E-90-10-FF` | Documentation (multicast) | RFC 9542 |

## Endereços de grupo conhecidos

| Endereço | Nome | Norma |
| --- | --- | --- |
| `01-80-C2-00-00-00` | Bridge Group address / Nearest Customer Bridge group address | IEEE 802.1Q, 802.1X, 802.1AE, 802.1AX |
| `01-80-C2-00-00-01` | IEEE MAC-specific Control Protocols group address | IEEE 802.1Q |
| `01-80-C2-00-00-02` | IEEE 802.3 Slow_Protocols_Multicast address | IEEE 802.1Q, 802.1AX |
| `01-80-C2-00-00-03` | Nearest non-TPMR Bridge group address / IEEE Std 802.1X PAE address | IEEE 802.1Q, 802.1X, 802.1AE, 802.1AX, 802.1BR |
| `01-80-C2-00-00-04` | IEEE MAC-specific Control Protocols group address | IEEE 802.1Q |
| `01-80-C2-00-00-05`, `-06` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-07` | MEF Forum ELMI protocol group address (não reservado exclusivamente para esse fim) | IEEE 802.1Q |
| `01-80-C2-00-00-08` | Provider Bridge group address | IEEE 802.1Q |
| `01-80-C2-00-00-09`, `-0A` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-0B` | EDE-SS PEP Address | IEEE 802.1Q, 802.1X, 802.1AE |
| `01-80-C2-00-00-0C` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-0D` | Provider Bridge MVRP address | IEEE 802.1Q |
| `01-80-C2-00-00-0E` | Individual LAN Scope group address / Nearest Bridge group address | IEEE 802.1Q, 802.1X, 802.1AE, 802.1AS |
| `01-80-C2-00-00-0F` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-14` | All Level 1 Intermediate Systems (IS-IS AllL1ISs) | ISO/IEC 10589 |
| `01-80-C2-00-00-15` | All Level 2 Intermediate Systems (IS-IS AllL2ISs) | ISO/IEC 10589 |
| `09-00-2B-00-00-04` | All End System Network Entities (ES-IS AllEndSystems) | ISO 9542 |
| `09-00-2B-00-00-05` | All Intermediate System Network Entities (AllIntermediateSystems) | ISO 9542 |

Os nomes são os da IEEE Registration Authority, tirados da listagem pública de endereços MAC de grupo padronizados, e ficam em inglês como na fonte. Os valores do IS-IS batem com a tabela de constantes da RFC 1142, a republicação de 1990 do ISO DP 10589. Para os 16 endereços de `01-80-C2-00-00-00` a `0F`, o tutorial da IEEE sobre endereços de grupo padronizados diz que frames enviados a eles "are not relayed by MAC bridges conforming to IEEE 802.1D", não são repassados por bridges conformes ao IEEE 802.1D, e a ferramenta acrescenta esse aviso. Outros endereços de grupo em `01-80-C2` (por exemplo a faixa de `01-80-C2-00-00-30` a `3F`, das mensagens CCM e Linktrace) ainda não estão na tabela e aparecem como fora do snapshot MA-L.

## Formatos aceitos

As formas com dois-pontos (`00:1b:54:...`), hífen (`00-1b-54-...`), ponto no estilo Cisco (`001b.5411.2233`) e sem separadores (`001b5411...`) funcionam, em maiúsculas ou minúsculas, assim como um OUI de seis hex. Um OUI sozinho só recebe um significado padronizado quando três bytes bastam para decidir (`33-33-xx` é sempre multicast IPv6); `01-00-5E` sozinho pode ser multicast IPv4 ou MPLS, então a ferramenta precisa do endereço completo.

## Sobre os dados

Os nomes de fabricantes vêm da listagem pública IEEE MA-L (OUI), embutida aqui como um snapshot pontual. Por ser um snapshot, um bloco atribuído muito recentemente pode ainda não estar presente, e esta versão cobre o registro MA-L (24 bits), não os blocos menores MA-M (28 bits) ou MA-S (36 bits). O snapshot é carregado sob demanda na sua primeira consulta, então abrir a página é rápido e nada é buscado de um servidor no momento da consulta. Os endereços padronizados acima formam uma pequena tabela fixa no código, cada linha amarrada à sua fonte.

## Como usar

Digite ou cole um endereço MAC ou um OUI. Um endereço administrado localmente ou desconhecido é informado com honestidade, em vez de adivinhado.

## Fontes

- [IEEE Registration Authority: MA-L (OUI) public listing](https://standards-oui.ieee.org/oui/oui.csv) (snapshot de 2026-07-10)
- [RFC 1112: Host Extensions for IP Multicasting, seção 6.4](https://www.rfc-editor.org/rfc/rfc1112) (lida em 2026-10-19)
- [RFC 2464: Transmission of IPv6 Packets over Ethernet Networks, seção 7](https://www.rfc-editor.org/rfc/rfc2464) (lida em 2026-10-19)
- [RFC 9568: Virtual Router Redundancy Protocol (VRRP) Version 3 for IPv4 and IPv6, seção 7.3](https://www.rfc-editor.org/rfc/rfc9568) (lida em 2026-10-19)
- [RFC 9542: IANA Considerations and IETF Protocol and Documentation Usage for IEEE 802 Parameters, seções 2.1.3, 2.1.4 e 2.3.1](https://www.rfc-editor.org/rfc/rfc9542) (lida em 2026-10-19)
- [IANA Ethernet Numbers registry: IANA Unicast and Multicast 48-bit MAC Addresses (atualizado em 2026-10-13)](https://www.iana.org/assignments/ethernet-numbers/ethernet-numbers.txt) (lido em 2026-10-19)
- [IEEE Registration Authority: Standards Group MAC public listing](https://standards.ieee.org/products-programs/regauth/grpmac/public/) (lida em 2026-10-19)
- [IEEE Registration Authority: Standard Group MAC Addresses: A Tutorial Guide (PDF)](https://standards.ieee.org/wp-content/uploads/import/documents/tutorials/macgrp.pdf) (lido em 2026-10-19)
- [RFC 1142: OSI IS-IS Intra-domain Routing Protocol (republicação do ISO DP 10589)](https://www.rfc-editor.org/rfc/rfc1142) (lida em 2026-10-19)
