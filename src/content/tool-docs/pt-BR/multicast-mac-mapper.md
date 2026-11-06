## O que ela faz

Um switch Ethernet nunca vê um grupo multicast IP. Ele vê um endereço MAC de destino calculado a partir do grupo, e essa conta joga bits fora. Este mapeador faz a conta nos dois sentidos, no seu navegador:

- **De um grupo para o MAC.** Digite um grupo IPv4 (224.0.0.0 a 239.255.255.255) ou IPv6 (ff00::/8) e a página mostra o endereço MAC dele, quais bits do grupo chegam ao MAC e quais se perdem, onde o grupo está nos registros da IANA e, no IPv4, os 32 grupos que dividem o mesmo MAC.
- **De um MAC para os grupos.** Digite um MAC multicast na notação com dois-pontos (`01:00:5e:01:01:01`), com hífens (`01-00-5E-01-01-01`) ou com pontos da Cisco (`0100.5e01.0101`). Um MAC IPv4 dá os 32 grupos que podem ter gerado ele, cada um com o bloco e o nome na IANA quando tem; um MAC IPv6 dá o padrão que todo grupo correspondente segue e os endereços que a IANA nomeia com esses últimos 32 bits.

Todo MAC aparece nas três notações, cada uma com um botão de copiar, e **Ler este MAC de volta** transforma a leitura de um grupo na leitura inversa. É a conta do artigo [Multicast: o preço de não inundar](/learn/multicast-what-it-costs-to-not-flood) e do capítulo 4.7 do curso aberto Operação e Manutenção de Switches LAN, onde o `show igmpsnooping mfdb` lista o endereço MAC de cada grupo.

## IPv4: 23 bits de 28

A RFC 1112 define os grupos como os endereços com "1110" nos quatro bits mais altos, de 224.0.0.0 a 239.255.255.255; os que começam com "1111" são "reserved for future addressing modes", e 224.0.0.0 "is guaranteed not to be assigned to any group" (seção 4). Ela leva um grupo para a Ethernet "by placing the low-order 23-bits of the IP address into the low-order 23 bits of the Ethernet multicast address 01-00-5E-00-00-00 (hex)", e completa: "Because there are 28 significant bits in an IP host group address, more than one host group address may map to the same Ethernet multicast address" ([RFC 1112](https://www.rfc-editor.org/rfc/rfc1112.txt), seção 6.4).

Por isso a página divide os 32 bits do grupo em três partes: os quatro bits 1110 que marcam todo grupo, os cinco bits seguintes, que nenhum MAC carrega, e os 23 bits baixos, que vêm depois de 01-00-5E. Cinco bits perdidos fazem 2^5 = 32 grupos por MAC, e a página lista todos em ordem numérica, com o grupo digitado marcado. 224.1.1.1, 239.1.1.1 (o grupo do laboratório do curso) e 239.129.1.1 caem todos em 01-00-5E-01-01-01.

A metade da IANA no próprio OUI confirma o formato: 01-00-5E-00-00-00 a 01-00-5E-7F-FF-FF é atribuído ao multicast IPv4, então o 25º bit do MAC, o mais alto do quarto octeto, é sempre 0 ([RFC 9542](https://www.rfc-editor.org/rfc/rfc9542.txt), seção 2.1.3). A RFC 9542 é a versão atual dessas regras da IANA; ela torna obsoleta a RFC 7042.

## O que um switch consegue e não consegue separar

A RFC 4541 diz que switches com IGMP snooping "may maintain forwarding tables based on either MAC addresses or IP addresses", e que "IP address based forwarding is preferred because the mapping between IP multicast addresses and link-layer multicast addresses is ambiguous. In the case of Ethernet, there is a multiplicity of 1 Ethernet address to 32 IP addresses" ([RFC 4541](https://www.rfc-editor.org/rfc/rfc4541.txt), seção 2.1.2). O questionário dela pergunta aos fabricantes se 224.1.2.3 e 239.129.2.3, dois grupos no mesmo MAC, são encaminhados nas mesmas portas (seção 4). Uma tabela indexada pelo MAC não separa os 32 grupos; uma indexada pelo endereço IP separa. Um host que entra num grupo pode receber frames dos outros 31, e a camada IP dele os descarta "without generating any error report or log entry" (RFC 1112, seções 7.2 e 7.3).

A mesma RFC diz que pacotes para a faixa 224.0.0.X "which are not IGMP must be forwarded on all ports" (seção 2.1.2), e o questionário pergunta se frames para 01:00:5E:00:00:01 a 01:00:5E:00:00:FF são encaminhados em todas as portas, haja joins ou não (seção 4). Quando um grupo divide o MAC com um endereço de 224.0.0.1 a 224.0.0.255 (225.0.0.1, 232.0.0.1, 239.128.0.1 e todo grupo cujos 23 bits baixos estão abaixo de 0x100), a página avisa: um switch que inunda pelo MAC inunda esse grupo também. A RFC 4607 diz o mesmo para o SSM: "SSM destinations in 232.0.0.0/24 and 232.128.0.0/24 use the same link-layer addresses as the reserved IP multicast group range 224.0.0.0/24" (seção 9). O próprio 224.0.0.0 nunca é destino, então um MAC dividido só com ele não gera aviso.

## Onde um grupo IPv4 fica

- **Bloco**, como o registro IPv4 Multicast Address Space da IANA (atualizado em 2026-08-20) e a RFC 5771 (seções 3 a 10) dividem o espaço: Local Network Control (224.0.0.0/24), Internetwork Control (224.0.1.0/24), AD-HOC Blocks I, II e III, SDP/SAP (224.2.0.0/16), DIS Transient Groups (224.252.0.0/14), Source-Specific Multicast (232.0.0.0/8), GLOP (233.0.0.0 a 233.251.255.255), unicast-prefix-based (234.0.0.0/8), Administratively Scoped (239.0.0.0/8) e as faixas reservadas entre eles.
- **Escopo**, como a RFC 2365 mapeia (seções 6 e 8): link-local para 224.0.0.0/24, global para 224.0.1.0 a 238.255.255.255 e, dentro de 239.0.0.0/8, a IPv4 Local Scope (239.255.0.0/16), a IPv4 Organization Local Scope (239.192.0.0/14), as faixas guardadas para cada uma crescer (239.253.0.0/16 e 239.254.0.0/16; 239.0.0.0/10, 239.64.0.0/10 e 239.128.0.0/10) e o resto, para o qual a RFC 2365 não nomeia escopo.
- **Nome na IANA**, do registro e em inglês, como a IANA publica (a página marca esses nomes como texto em inglês, para o leitor de tela ler na língua certa): todas as linhas dos blocos Local Network Control e Internetwork Control (224.0.0.5 é "OSPFIGP All Routers", 224.0.0.22 "IGMP", 224.0.1.129 "PTP-primary"), as linhas de SDP/SAP, as três linhas do SSM, MCAST-TEST-NET (233.252.0.0/24) e os endereços relativos dos dois escopos, contados para baixo a partir de 239.255.255.255 e 239.195.255.255 (RFC 2365, seção 9: 239.255.255.250 é o endereço relativo 5, SSDP). Linhas que o registro marca como Unassigned não nomeiam nada, e as atribuições dos blocos AD-HOC a organizações aparecem só pelo bloco.
- **GLOP**: 233.X.Y.0/24 pertence ao sistema autônomo de 16 bits X.Y ([RFC 3180](https://www.rfc-editor.org/rfc/rfc3180.txt), seção 3); 233.22.30.1 está no /24 do AS 5662, o exemplo da própria RFC.
- **Unicast-prefix-based**: um grupo de 234/8 deslocado 8 bits para a esquerda dá o prefixo unicast da organização que pode usá-lo ([RFC 6034](https://www.rfc-editor.org/rfc/rfc6034.txt), seção 3); 234.192.0.2 dá 192.0.2.0/24.
- Endereços de documentação aparecem marcados: 233.252.0.0/24, o offset relativo 10 (239.255.255.245) e os prefixos GLOP dos AS 64496 a 64511 ([RFC 6676](https://www.rfc-editor.org/rfc/rfc6676.txt), seção 2).

## IPv6: 32 bits de 128

A RFC 2464 envia um pacote multicast IPv6 para "the Ethernet multicast address whose first two octets are the value 3333 hexadecimal and whose last four octets are the last four octets of DST" ([RFC 2464](https://www.rfc-editor.org/rfc/rfc2464.txt), seção 7); a RFC 9542 confirma que 33-33-00-00-00-00 a 33-33-FF-FF-FF-FF é usado para multicast IPv6 (seção 2.3.1). Os primeiros 96 bits se perdem: para cada valor de flags e escopo, 2^(112 - 32) endereços, "more than 1.2e24", dividem um MAC (RFC 4541, seção 3), 2^88 ao todo, então ff02::101 e ff05::101 dividem 33-33-00-00-01-01. A RFC 3307 mantém os group IDs, os 32 bits baixos, curtos o bastante para que eles "will generate unique link-layer addresses within a given multicast scope" ([RFC 3307](https://www.rfc-editor.org/rfc/rfc3307.txt), seção 2), e a RFC 4541 recomenda que "IPv6 address based forwarding is preferred to MAC address based forwarding" (seção 3).

A página também lê o que o endereço diz de si mesmo:

- **Flags**, tratadas como bits separados, como a RFC 7371 exige (seção 3): T = 0 para um endereço "permanently-assigned ("well-known")" e T = 1 para um transitório ([RFC 4291](https://www.rfc-editor.org/rfc/rfc4291.txt), seção 2.7); P para endereços unicast-prefix-based ([RFC 3306](https://www.rfc-editor.org/rfc/rfc3306.txt), seção 4, em que P = 1 exige T = 1); R para RP embutido ([RFC 3956](https://www.rfc-editor.org/rfc/rfc3956.txt), atualizada pela [RFC 7371](https://www.rfc-editor.org/rfc/rfc7371.txt)); X, guardado "for future assignment".
- **Escopo**, pela tabela da RFC 4291, seção 2.7, atualizada pela [RFC 7346](https://www.rfc-editor.org/rfc/rfc7346.txt) (o escopo 3 é Realm-Local), com as regras da RFC 4291 para os escopos 0, 1 e F, e a observação da RFC 4541 de que ff00::/15 nunca aparece no enlace.
- **SSM**: P = 1, T = 1 e plen 0 fazem um endereço SSM ([RFC 4607](https://www.rfc-editor.org/rfc/rfc4607.txt), seção 1), ff3x::/32 e, com a flag X ligada, ffbx::/32 também (RFC 7371). A faixa do group ID é nomeada: inválida abaixo de 0x40000000, 0x40000000 reservado como valor nulo, alocação pela IANA até 0x7FFFFFFF, alocação dinâmica pelos hosts acima disso (seções 1 e 4.3).
- **Unicast-prefix-based e RP embutido**: com P = 1 e plen de 1 a 64, o prefixo da rede dona do grupo; com R = 1 também, o RP, feito copiando "the first "plen" bits of the "network prefix"" para um endereço zerado e pondo o RIID nos últimos 4 bits dele (RFC 3956, seção 4). Um RIID 0, um RP em fe80::/10, ::/16 ou ff00::/8, um plen acima de 64 e bits reservados diferentes de zero são sinalizados com a regra que quebram.
- **Solicited-node**: ff02::1:ffXX:XXXX é formado com "the low-order 24 bits of an address (unicast or anycast)" (RFC 4291, seção 2.7.1), e a página mostra esses 24 bits.
- **Nomes na IANA**, do registro IPv6 Multicast Address Space (atualizado em 2026-04-07): as tabelas node-local, link-local, site-local e de escopo variável, ff0X::db8:0:0/96 para documentação (RFC 6676, seção 3), e o registro Dynamic Multicast Group IDs que a RFC 10028 criou em agosto de 2026 para group IDs de 0x80000000 para cima (MADCAP, alocação de grupos SSM pelos hosts, uso privado e experimental, solicited-node).

Um endereço pode trazer um zone index depois do `%`, como `ff02::1%eth0` (a RFC 9844 mostra a mesma forma, `fe80::1234%eth0`, num host Linux). A ferramenta deixa o zone index de lado: identificadores de zona "have purely local meaning within the node in which they are defined" ([RFC 9844](https://www.rfc-editor.org/rfc/rfc9844.txt), seção 1, que atualiza a [RFC 4007](https://www.rfc-editor.org/rfc/rfc4007.txt), seção 11), então o grupo e o MAC dele são os mesmos sem ele. Os grupos IPv6 aparecem no texto canônico da RFC 5952 ([RFC 5952](https://www.rfc-editor.org/rfc/rfc5952.txt), seção 4).

## O que ela recusa, e por quê

- **Um endereço unicast**: um endereço IPv4 abaixo de 224.0.0.0, ou um endereço IPv6 que não começa com ff. Um endereço IPv6 IPv4-mapped como `::ffff:224.0.0.1` também não começa com ff (a RFC 4291 o lista entre os endereços unicast, seção 2.5.5.2), então é recusado também.
- **240.0.0.0 para cima**: esses começam com 1111, reservado pela RFC 1112.
- **Um MAC unicast**: o bit de grupo, o mais baixo do primeiro octeto, é 0 ([RFC 9542](https://www.rfc-editor.org/rfc/rfc9542.txt), seção 2.1.1).
- **A metade de cima de 01-00-5E** (01-00-5E-80-00-00 em diante): o 25º bit é 1, então nenhum grupo IPv4 cai ali. A recusa nomeia a linha do registro IANA OUI Ethernet Numbers (atualizado em 2026-10-13): MPLS Multicast para 01-00-5E-80-00-00 a 01-00-5E-8F-FF-FF, as atribuições avulsas em 01-00-5E-90-00-00 a 01-00-5E-90-00-03 e 01-00-5E-90-01-00, documentação em 01-00-5E-90-10-00 a 01-00-5E-90-10-FF, e Unassigned no resto.
- **O endereço de broadcast e outros MACs de grupo** (01-80-C2-00-00-00, um grupo de backbone SPBM como 03-00-10-00-00-64): nenhum grupo IP cai neles. A página aponta para a [Consulta de fabricante por OUI / MAC](/tools/oui-lookup), que lê endereços de grupo padronizados, e para o [Construtor de endereço multicast SPBM](/tools/extreme-spbm-multicast-mac), que calcula os do SPBM.
- **Texto malformado**: um octeto acima de 255, um zero à esquerda (alguns sistemas leem como octal), um comprimento de prefixo, texto IPv6 que quebra as regras da RFC 4291, um MAC com cinco octetos, separadores misturados ou hex sem separador, mais de uma linha ou mais de 80 caracteres. Cada recusa diz o que esperava.

## Exemplos

- **O Exemplo, 233.252.0.1** (MCAST-TEST-NET, o grupo que o artigo do Learn destrincha): binário 1110 10011 11111000000000000000001; os cinco bits 10011 se perdem e 0x7C0001 vem depois de 01-00-5E, o que dá 01-00-5E-7C-00-01, que 224.124.0.1, 224.252.0.1, 239.124.0.1 e 239.252.0.1 dividem entre os 32.
- **224.0.0.1** cai em 01-00-5E-00-00-01, dividido com 239.128.0.1 (o par do artigo); digitar 239.128.0.1 traz o aviso de que um switch que inunda 224.0.0.x pelo MAC inunda esse grupo também.
- **01:00:5e:00:00:16**, o destino do report IGMPv3 capturado no artigo, volta para 224.0.0.22, "IGMP", e mais 31, entre eles 232.0.0.22 e 232.128.0.22 no bloco SSM.
- **ff02::1:ff0e:8c6c**, o exemplo de solicited-node da RFC 4291, cai em 33-33-FF-0E-8C-6C; lido de volta, esse MAC nomeia ff02::1:ff0e:8c6c e ff02::2:ff0e:8c6c (Node Information Queries).
- **ff02::9 e ff32::8000:9**, os dois exemplos da RFC 3307, caem em 33-33-00-00-00-09 e 33-33-80-00-00-09.
- **ff7e:120:2001:db8::1234**, montado a partir do exemplo de RP embutido da RFC 6676, dá o RP 2001:db8::1.

## O que ela não faz

Ela não enxerga a sua rede: não sabe qual dos 32 grupos está em uso, se o seu switch indexa a tabela pelo MAC ou pelo endereço IP, nem se ele inunda 224.0.0.x pelo MAC. Ela mapeia só em Ethernet, como a RFC 1112 e a RFC 2464 definem; a RFC 6085 acrescenta que um pacote multicast IPv6 pode, em algumas circunstâncias, ir para um MAC unicast, e que o receptor "MUST NOT drop the packet" por isso ([RFC 6085](https://www.rfc-editor.org/rfc/rfc6085.txt), seção 3), o que a ferramenta não modela. Os nomes da IANA são os dos registros como lidos em 2 de novembro de 2026; os registros mudam, e as atribuições dos blocos AD-HOC aparecem só pelo bloco. Escopos administrativos são configurados em cada rede: a ferramenta conhece só as faixas que a RFC 2365 nomeia, e calcula endereços relativos só para a Local Scope e a Organization Local Scope.

## Compartilhar resultado

Abaixo da manchete, **Compartilhar resultado** monta um link para esta página, só quando você clica e só enquanto a página mostra uma leitura, que leva o campo como foi digitado depois do `#`, como `input`. Um grupo multicast ou um MAC multicast nomeia um grupo, não um host nem uma pessoa; uma entrada que a ferramenta recusa, como um endereço unicast, não gera link.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-02) define o fragmento como "separated from the rest of the URI prior to a dereference", então o valor não vai para o servidor quando o link é aberto; ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** Um link leva no máximo 16.384 caracteres, o limite que o site usa para todo valor depois do `#`; o campo tem no máximo 80.
- **Abrir um link.** O campo é preenchido como uma colagem o preencheria, e a página faz o mapeamento. Um valor em branco, com mais de uma linha ou com mais de 80 caracteres é ignorado. Aceito ou não, o valor sai na hora do endereço da própria página, sem requisição, então recarregar, guardar nos favoritos ou usar o botão de compartilhar da página não leva nada que você não tenha escolhido compartilhar.

## Procedência

O motor é aritmética fixa sobre as regras acima e duas tabelas compactadas geradas do XML dos registros da IANA, sem relógio, sem rede e sem aleatoriedade. Ele traz 140 golden vectors (conjunto `multicast-mac-mapper-golden-2026-11-02`): os dois sentidos, as duas versões de IP e as três notações de MAC; todos os blocos IPv4 nas bordas, todos os escopos da RFC 2365, endereços relativos, GLOP, UBM e MCAST-TEST-NET; a colisão de 32 para 1, com os 32 grupos fixados para vários MACs; flags, escopos, faixas SSM, endereços unicast-prefix-based e com RP embutido, solicited-node e os nomes da IANA no IPv6; e 42 recusas. Cada valor esperado veio de uma implementação separada (o módulo ipaddress do Python e aritmética de inteiros, com leitura própria dos registros), não da execução deste motor, e uma comparação de todos os campos que o oráculo calcula não achou diferença.

## API

O mesmo motor responde em `/api/v1/multicast-mac-mapper` na API HTTP do site; o contrato está na [página da API](/api), que também diz se este site serve a API.

- **Requisição.** Texto puro, como no campo: `?input=233.252.0.1` no GET, ou o valor como corpo do POST.
- **Resposta.** `direction` (`forward` ou `reverse`) e `family` (`ipv4` ou `ipv6`), e depois, conforme a leitura: um grupo IPv4 dá `group`, `groupHex`, `bits` (`prefix`, `lost`, `kept`), `keptHex`, `mac` (`colon`, `hyphen`, `dot`), `macBits`, `block`, `blockName`, `blockRange`, `scope`, `scopeName`, `registered`, `table`, `glopAs`, `ubmPrefix`, `relativeOffset`, `sharing` (32 objetos com `group`, `block`, `scope`, `registered`, `table`), `sharesLocalControl`; um MAC IPv4 dá `notation`, `mac`, `macBits`, `kept`, `keptHex`, `pattern` e `candidates` (32 objetos); um grupo IPv6 dá `group`, `exploded`, `zone`, `flags` (`bits`, `x`, `r`, `p`, `t`), `scope`, `scopeId`, `scopeName`, `lostHex`, `low32Hex`, `mac`, `macBits`, `groupId`, `dynamicRow`, `ssm`, `unicastPrefix`, `plen`, `embeddedRp`, `riid`, `solicitedLow24`, `documentation`, `registered` e `sameMac`; um MAC IPv6 dá `notation`, `mac`, `macBits`, `low32Hex`, `pattern`, `groupId`, `dynamicRow`, `ssm`, `solicited` e `candidates`. Toda leitura traz `warnings` e `notes`, em inglês na API. Para o Exemplo a API responde `mac.hyphen` `01-00-5E-7C-00-01` e `bits.lost` `10011`.
- **Erros.** HTTP 400, `invalid_input`, com a mensagem do motor, por exemplo `10.0.0.1 is not a multicast group: ...` ou `01-00-5E-80-00-00 has the 25th bit set ...`.

## Fontes

- [RFC 1112, Host Extensions for IP Multicasting, agosto de 1989 (STD 5)](https://www.rfc-editor.org/rfc/rfc1112.txt) (lida em 2026-11-02): seções 4, 6.4, 7.2 e 7.3
- [RFC 2464, Transmission of IPv6 Packets over Ethernet Networks, dezembro de 1998](https://www.rfc-editor.org/rfc/rfc2464.txt) (lida em 2026-11-02): seção 7
- [RFC 6085, Address Mapping of IPv6 Multicast Packets on Ethernet, janeiro de 2011](https://www.rfc-editor.org/rfc/rfc6085.txt) (lida em 2026-11-02): seção 3, que atualiza a RFC 2464
- [RFC 9542, IANA Considerations and IETF Protocol and Documentation Usage for IEEE 802 Parameters, abril de 2024 (BCP 141)](https://www.rfc-editor.org/rfc/rfc9542.txt) (lida em 2026-11-02): seções 2.1.1, 2.1.3, 2.1.4 e 2.3.1; torna obsoleta a [RFC 7042](https://www.rfc-editor.org/rfc/rfc7042.txt) (lida no mesmo dia)
- [IANA, IANA OUI Ethernet Numbers registry](https://www.iana.org/assignments/ethernet-numbers/ethernet-numbers.xhtml), atualizado em 2026-10-13 (lido em 2026-11-02)
- [IANA, IPv4 Multicast Address Space registry](https://www.iana.org/assignments/multicast-addresses/multicast-addresses.xhtml), atualizado em 2026-08-20 (lido em 2026-11-02)
- [RFC 5771, IANA Guidelines for IPv4 Multicast Address Assignments, março de 2010 (BCP 51)](https://www.rfc-editor.org/rfc/rfc5771.txt) (lida em 2026-11-02): seções 3 a 10
- [RFC 2365, Administratively Scoped IP Multicast, julho de 1998 (BCP 23)](https://www.rfc-editor.org/rfc/rfc2365.txt) (lida em 2026-11-02): seções 3, 4, 6, 8 e 9
- [RFC 4607, Source-Specific Multicast for IP, agosto de 2006](https://www.rfc-editor.org/rfc/rfc4607.txt) (lida em 2026-11-02): seções 1, 4.3 e 9
- [RFC 3180, GLOP Addressing in 233/8, setembro de 2001 (BCP 53)](https://www.rfc-editor.org/rfc/rfc3180.txt) (lida em 2026-11-02): seção 3
- [RFC 6034, Unicast-Prefix-Based IPv4 Multicast Addresses, outubro de 2010](https://www.rfc-editor.org/rfc/rfc6034.txt) (lida em 2026-11-02): seções 3 e 4
- [RFC 6676, Multicast Addresses for Documentation, agosto de 2012](https://www.rfc-editor.org/rfc/rfc6676.txt) (lida em 2026-11-02): seções 2 e 3
- [IANA, IPv6 Multicast Address Space registry](https://www.iana.org/assignments/ipv6-multicast-addresses/ipv6-multicast-addresses.xhtml), atualizado em 2026-04-07 (lido em 2026-11-02)
- [RFC 4291, IP Version 6 Addressing Architecture, fevereiro de 2006](https://www.rfc-editor.org/rfc/rfc4291.txt) (lida em 2026-11-02): seções 2.5.5.2, 2.7 e 2.7.1
- [RFC 7346, IPv6 Multicast Address Scopes, agosto de 2014](https://www.rfc-editor.org/rfc/rfc7346.txt) (lida em 2026-11-02): seção 2
- [RFC 7371, Updates to the IPv6 Multicast Addressing Architecture, setembro de 2014](https://www.rfc-editor.org/rfc/rfc7371.txt) (lida em 2026-11-02): seções 2 a 4
- [RFC 3306, Unicast-Prefix-based IPv6 Multicast Addresses, setembro de 2002](https://www.rfc-editor.org/rfc/rfc3306.txt) (lida em 2026-11-02): seção 4
- [RFC 3956, Embedding the Rendezvous Point (RP) Address in an IPv6 Multicast Address, novembro de 2004](https://www.rfc-editor.org/rfc/rfc3956.txt) (lida em 2026-11-02): seções 3, 4 e 6.3
- [RFC 3307, Allocation Guidelines for IPv6 Multicast Addresses, setembro de 2002](https://www.rfc-editor.org/rfc/rfc3307.txt) (lida em 2026-11-02): seções 2 e 4
- [RFC 10028, Updates to Dynamic IPv6 Multicast Address Group IDs, agosto de 2026](https://www.rfc-editor.org/rfc/rfc10028.txt) (lida em 2026-11-02): seções 3 e 6
- [RFC 5952, A Recommendation for IPv6 Address Text Representation, agosto de 2010](https://www.rfc-editor.org/rfc/rfc5952.txt) (lida em 2026-11-02): seção 4
- [RFC 4007, IPv6 Scoped Address Architecture, março de 2005](https://www.rfc-editor.org/rfc/rfc4007.txt) (lida em 2026-11-02): seção 11
- [RFC 9844, Entering IPv6 Zone Identifiers in User Interfaces, agosto de 2025](https://www.rfc-editor.org/rfc/rfc9844.txt) (lida em 2026-11-02): seção 1
- [RFC 4541, Considerations for Internet Group Management Protocol (IGMP) and Multicast Listener Discovery (MLD) Snooping Switches, maio de 2006](https://www.rfc-editor.org/rfc/rfc4541.txt) (lida em 2026-11-02): seções 2.1.2, 3 e 4
- [RFC Editor, RFC index (XML)](https://www.rfc-editor.org/rfc-index.xml) (lido em 2026-11-02): o status atual de cada RFC acima
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lida em 2026-11-02): seção 3.5, o fragmento, que leva o valor de um link de Compartilhar resultado
