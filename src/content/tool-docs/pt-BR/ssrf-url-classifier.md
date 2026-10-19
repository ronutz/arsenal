## O que faz

Cole uma URL e a ferramenta diz para onde ela realmente aponta: loopback, uma faixa privada ou link-local, um endpoint de metadados de nuvem, o espaço compartilhado CGNAT, outro espaço reservado ou a internet pública. Ela decodifica os truques de ofuscação de IP usados para disfarçar um endereço interno, lê o endereço IPv4 que um endereço IPv6 pode levar dentro de si (seis layouts, Teredo incluído), dá o nome do bloco de uso especial da IANA em que o endereço cai para todas as linhas dos dois registros, marca os endereços anycast de serviço de uso especial, sinaliza esquemas de URL perigosos e credenciais embutidas, e mostra um nível de risco de SSRF. Ela nunca resolve DNS e nunca envia a requisição; é um classificador, não uma sonda.

## O que é SSRF, e por que a classificação importa

Server-Side Request Forgery é um ataque em que um servidor é enganado para fazer uma requisição a uma URL escolhida pelo atacante, tipicamente para alcançar algo que o atacante não consegue alcançar diretamente: um serviço em `localhost`, uma máquina em uma faixa interna, ou o endpoint de metadados de um provedor de nuvem. Defender-se disso se resume a decidir se uma URL é segura para buscar, e essa decisão é mais difícil do que parece, porque um endereço interno pode ser escrito em muitas formas disfarçadas. Esta ferramenta foi feita para essa decisão: ela existe para ajudar você a entender uma URL e projetar uma allow-list, firmemente do lado defensivo da linha.

## As ofuscações que ela decodifica

Um filtro ingênuo que bloqueia `127.0.0.1` deixa passar as muitas outras formas de escrever o mesmo endereço, e os atacantes exploram exatamente isso. A ferramenta as decodifica para que o destino real fique visível:

- a forma inteira **decimal**, em que `2130706433` é `127.0.0.1` e `2852039166` é o endereço de metadados `169.254.169.254` (é esse que o botão Exemplo carrega);
- as formas de octeto **octal** e **hexadecimal**;
- o IPv4 em **forma curta**, em que `127.1` se expande para `127.0.0.1`;
- **qualquer grafia de um endereço IPv6**: a ferramenta converte o endereço nos seus oito blocos de 16 bits antes de classificar qualquer coisa, então `[0:0:0:0:0:0:0:1]` e `[0000:0000:0000:0000:0000:0000:0000:0001]` são o loopback `::1`, do mesmo jeito que a RFC 4291 lista `0:0:0:0:0:0:0:1` e `::1` como duas grafias do endereço de loopback, em que "The use of "::" indicates one or more groups of 16 bits of zeros", o `::` vale por um ou mais grupos de 16 bits zerados ([RFC 4291, seção 2.2](https://www.rfc-editor.org/rfc/rfc4291.txt)); e
- os **endereços IPv6 que levam um endereço IPv4**, descritos na próxima seção.

Ela então classifica o literal resolvido em relação a todas as linhas dos registros de uso especial da IANA e destaca os endereços de metadados de nuvem, que são alvos primários de SSRF. O endereço decodificado aparece no texto canônico da [RFC 5952](https://www.rfc-editor.org/rfc/rfc5952.txt): minúsculas, sem zeros à esquerda, a maior sequência de blocos zerados escrita como `::` (seção 4) e, para os prefixos que por si só marcam um IPv4 embutido, a notação mista com o final em decimal com pontos, porque "mixed notation is RECOMMENDED if the following condition is met", a notação mista é recomendada quando a condição vale, e a condição é um prefixo bem conhecido como os que a RFC 4291 define (seção 5).

## Endereços IPv6 que levam um endereço IPv4

Seis layouts de IPv6 colocam um endereço IPv4 dentro dos 128 bits. Um filtro que só confere o texto IPv6 deixa passar o alvo IPv4 interno, então a ferramenta decodifica o endereço IPv4, classifica a URL por ele, diz qual embutimento decodificou e mostra a linha do registro do endereço carregado. Um endereço público carregado num embutimento sai como público, com o embutimento identificado.

| Layout | Prefixo | Onde fica o endereço IPv4 | Fonte |
|---|---|---|---|
| IPv4-mapped | `::ffff:0:0/96` | nos 32 bits finais | [RFC 4291, seção 2.5.5.2](https://www.rfc-editor.org/rfc/rfc4291.txt) |
| IPv4-compatible (descontinuado) | `::/96`, menos `::` e `::1` | nos 32 bits finais | [RFC 4291, seção 2.5.5.1](https://www.rfc-editor.org/rfc/rfc4291.txt) |
| Well-Known Prefix do NAT64 | `64:ff9b::/96` | nos 32 bits finais (o layout /96) | [RFC 6052, seções 2.1 e 2.2](https://www.rfc-editor.org/rfc/rfc6052.txt) |
| Prefixo de uso local do NAT64 | `64:ff9b:1::/48` | depende do tamanho de prefixo escolhido pelo operador: o layout /48, /56, /64 ou /96 da RFC 6052 | [RFC 8215, seções 1 e 5](https://www.rfc-editor.org/rfc/rfc8215.txt) |
| 6to4 | `2002::/16` | nos bits 16 a 47 (o campo V4ADDR) | [RFC 3056, seção 2](https://www.rfc-editor.org/rfc/rfc3056.txt) |
| Teredo | `2001::/32` | dois endereços: o servidor nos bits 32 a 63, o cliente invertido nos bits 96 a 127 | [RFC 4380, seção 4](https://www.rfc-editor.org/rfc/rfc4380.txt) |

**IPv4-mapped.** `[::ffff:127.0.0.1]` é o endereço de loopback vestido de IPv6. O navegador não o mostra assim: o serializador de IPv6 do WHATWG URL Standard escreve cada bloco de 16 bits como "the shortest possible lowercase hexadecimal number", o menor hexadecimal possível em minúsculas, então a mesma URL volta como `[::ffff:7f00:1]` ([WHATWG URL Standard, serializador de IPv6](https://url.spec.whatwg.org/)). As duas grafias saem como loopback, risco alto.

**IPv4-compatible.** A RFC 4291 define `::a.b.c.d`, com 96 bits zerados na frente do endereço IPv4, e depois o aposenta: o formato "is now deprecated because the current IPv6 transition mechanisms no longer use these addresses", foi descontinuado porque os mecanismos de transição atuais não usam mais esses endereços, e o IPv4 que ele carrega "must be a globally-unique IPv4 unicast address", precisa ser um unicast IPv4 globalmente único ([RFC 4291, seção 2.5.5.1](https://www.rfc-editor.org/rfc/rfc4291.txt)). O registro não tem linha para ele. Uma pilha que ainda aceite o formato alcança o endereço carregado, então `[::127.0.0.1]` e o gêmeo hexadecimal `[::7f00:1]` saem como loopback, `[::a9fe:a9fe]` como metadados de nuvem e `[::8.8.8.8]` como público; em todos os casos o resultado avisa que o formato foi descontinuado. `::` e `::1` têm linhas próprias no registro e nunca são lidos como IPv4-compatible.

**Well-Known Prefix do NAT64.** `[64:ff9b::169.254.169.254]` e o gêmeo hexadecimal `[64:ff9b::a9fe:a9fe]` levam o endereço de metadados link-local, então saem como metadados de nuvem. A RFC 6052 diz "The Well-Known Prefix MUST NOT be used to represent non-global IPv4 addresses", o Well-Known Prefix não pode representar endereços IPv4 não globais, e manda os tradutores descartarem esses pacotes ([RFC 6052, seção 3.1](https://www.rfc-editor.org/rfc/rfc6052.txt)). O endereço continua apontando para aquele alvo interno, e por isso o filtro precisa rejeitá-lo em vez de confiar em todo tradutor do caminho. Um endereço sob o Well-Known Prefix que leve um IPv4 público, como `64:ff9b::8.8.8.8`, sai como público, porque o registro marca `64:ff9b::/96` como globalmente alcançável.

**Prefixo de uso local do NAT64.** A RFC 8215 reserva `64:ff9b:1::/48` para tradução dentro de uma rede e deixa o tamanho do prefixo de tradução a critério do operador; os nós "must not make any assumptions regarding the syntax or properties of those addresses", não podem presumir nada sobre a sintaxe ou as propriedades desses endereços ([RFC 8215, seção 5](https://www.rfc-editor.org/rfc/rfc8215.txt)). Por isso a ferramenta lê o endereço com cada layout da RFC 6052 que cabe num /48 (/96, /64, /56 e /48), fica com a leitura que aponta mais para dentro (metadados de nuvem, depois loopback, link-local, privada) e mostra a leitura /96 quando nenhuma aponta. Todo layout pula os bits 64 a 71, e a RFC 6052 diz "These bits MUST be set to zero", esses bits precisam ser zero ([RFC 6052, seção 2.2](https://www.rfc-editor.org/rfc/rfc6052.txt)); quando não são, nenhum endereço IPv4 é decodificado. Como o registro da IANA marca `64:ff9b:1::/48` como não globalmente alcançável, um endereço dentro dele nunca sai abaixo de reservado.

**6to4.** A RFC 3056 monta o prefixo de um site a partir do prefixo `2002` de 16 bits e do endereço IPv4 de 32 bits do site, escrito `2002:V4ADDR::/48` ([RFC 3056, seção 2](https://www.rfc-editor.org/rfc/rfc3056.txt)). Assim, `[2002:7f00:1::]` leva `127.0.0.1` e sai como loopback; `[2002:a9fe:a9fe::1]` leva o endereço de metadados.

**Teredo.** Um endereço Teredo tem cinco partes: "Prefix", "Server IPv4", "Flags", "Port" e "Client IPv4" ([RFC 4380, seção 4](https://www.rfc-editor.org/rfc/rfc4380.txt)). O prefixo é `2001:0000:/32` (seção 2.6). O endereço do servidor fica nos bits 32 a 63 do jeito que é. A porta e o endereço mapeados do cliente vêm ofuscados: "Each bit in the address and port number is reversed; this can be done by an exclusive OR of the 16-bit port number with the hexadecimal value 0xFFFF, and an exclusive OR of the 32-bit address with the hexadecimal value 0xFFFFFFFF", cada bit é invertido com um XOR de `0xFFFF` na porta e de `0xFFFFFFFF` no endereço (seção 4). A RFC 5991 redefiniu depois o campo Flags com bits aleatórios, mas manteve os campos de servidor e de cliente como estavam ([RFC 5991, seção 3.1](https://www.rfc-editor.org/rfc/rfc5991.txt)). A ferramenta desfaz o XOR, avalia os dois endereços IPv4, deixa o mais interno decidir (no empate vale o servidor) e mostra o servidor, o cliente, a porta do cliente e as flags. `[2001:0:808:808:0:feae:80ff:fffe]` tem o servidor `8.8.8.8` e o cliente `127.0.0.1` (`0x80fffffe` XOR `0xffffffff`), então sai como loopback; `[2001:0:808:808:0:feae:fefd:fcfb]` leva o cliente `1.2.3.4` na porta 337, o mesmo par que a RFC 4380 usa no próprio exemplo de ofuscação (seção 5.1.1), e sai como público. A RFC 4380 acrescenta que "the identifiers used in global addresses MUST include a global scope unicast IPv4 address", os identificadores de endereços globais precisam incluir um unicast IPv4 de escopo global (seção 4), então um endereço Teredo que leve um IPv4 interno aponta para um alvo que nenhum endereço Teredo válido deveria carregar.

**O que ela não decodifica: 6a44.** A RFC 6751 monta um endereço 6a44 a partir de "the 6a44-network IPv6 prefix C (a /48 the ISP has assigned to its 6a44 relays)", o /48 que o provedor atribuiu aos seus relays 6a44, seguido do endereço IPv4 do site do cliente, de uma porta e do IPv4 local do cliente ([RFC 6751, seção 5](https://www.rfc-editor.org/rfc/rfc6751.txt)). Como cada provedor escolhe o seu /48, nenhum prefixo fixo marca um endereço 6a44, e a ferramenta não consegue distingui-lo de qualquer outro endereço sem a configuração daquele provedor. O lado IPv4 ela identifica: `192.88.99.2` é o endereço anycast dos relays 6a44 (seção 8).

## Todos os blocos de uso especial, com o nome dos registros da IANA

A ferramenta carrega todas as linhas dos registros IPv4 e IPv6 Special-Purpose Address Space da IANA ([CSV do IPv4](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) e [CSV do IPv6](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv), os dois atualizados pela última vez em 2025-10-09, lidos em 2026-10-19): 25 linhas de IPv4 e 25 de IPv6. Cada endereço é comparado com a linha mais específica que o cobre, e o resultado mostra o bloco, o nome que o registro dá a ele e a RFC, sem alteração. O registro define Globally Reachable como "whether an IP datagram whose destination address is drawn from the allocated special-purpose address block is forwardable beyond a specified administrative domain", se um datagrama destinado ao bloco pode ser encaminhado para além de um domínio administrativo, e a classificação segue esse valor:

- **Globally Reachable False** sai como **reservado** (risco alto na escala desta ferramenta), a não ser que a linha tenha uma categoria mais precisa: loopback, privada, link-local ou CGNAT.
- **Globally Reachable True** sai como **público** (risco baixo), e o bloco continua identificado pelo nome, então nada do registro cai num "público" anônimo.
- **Sem valor** acontece de dois jeitos. Nas linhas de embutimento (6to4, Teredo) o registro diz N/A e remete à RFC, então quem decide é o IPv4 carregado. Nas duas linhas descontinuadas o registro não tem booleanos, e a ferramenta as classifica como reservadas: a RFC 7526 diz "The prefix 192.88.99.0/24 MUST NOT be reassigned for other use except by a future IETF Standards Action", o prefixo não pode ser reatribuído a não ser por uma futura Standards Action do IETF, e registra que "The Boolean values for the address block 192.88.99.0/24 have been removed", os valores booleanos do bloco foram retirados ([RFC 7526, seções 4 e 7](https://www.rfc-editor.org/rfc/rfc7526.txt)); e `2001:10::/28` fica dentro de `2001::/23`, que não é globalmente alcançável "Unless allowed by a more specific allocation", a não ser que uma alocação mais específica permita (nota [1] do registro).

Os blocos de multicast `224.0.0.0/4` e `ff00::/8` não são linhas de uso especial (têm registros próprios) e continuam saindo como reservados, sem linha identificada.

### IPv4

| Bloco | Nome na IANA | RFC | Globally Reachable | Classificação |
|---|---|---|---|---|
| `0.0.0.0/8` | "This network" | RFC 791, Section 3.2 | False | reservado, alto |
| `0.0.0.0/32` | "This host on this network" | RFC 1122, Section 3.2.1.3 | False | reservado, alto |
| `10.0.0.0/8` | Private-Use | RFC 1918 | False | privado, alto |
| `100.64.0.0/10` | Shared Address Space | RFC 6598 | False | CGNAT, médio |
| `127.0.0.0/8` | Loopback | RFC 1122, Section 3.2.1.3 | False | loopback, alto |
| `169.254.0.0/16` | Link Local | RFC 3927 | False | link-local, alto (`169.254.169.254`: metadados de nuvem) |
| `172.16.0.0/12` | Private-Use | RFC 1918 | False | privado, alto |
| `192.0.0.0/24` | IETF Protocol Assignments | RFC 6890, Section 2.1 | False | reservado, alto |
| `192.0.0.0/29` | IPv4 Service Continuity Prefix | RFC 7335 | False | reservado, alto |
| `192.0.0.8/32` | IPv4 dummy address | RFC 7600 | False | reservado, alto |
| `192.0.0.9/32` | Port Control Protocol Anycast | RFC 7723 | True | público, baixo, anycast de serviço |
| `192.0.0.10/32` | Traversal Using Relays around NAT Anycast | RFC 8155 | True | público, baixo, anycast de serviço |
| `192.0.0.170/32`, `192.0.0.171/32` | NAT64/DNS64 Discovery | RFC 8880; RFC 7050, Section 2.2 | False | reservado, alto |
| `192.0.2.0/24` | Documentation (TEST-NET-1) | RFC 5737 | False | reservado, alto |
| `192.31.196.0/24` | AS112-v4 | RFC 7535 | True | público, baixo |
| `192.52.193.0/24` | AMT | RFC 7450 | True | público, baixo |
| `192.88.99.0/24` | Deprecated (6to4 Relay Anycast) | RFC 7526 | nenhum | reservado, alto |
| `192.88.99.2/32` | 6a44-relay anycast address | RFC 6751 | False | reservado, alto, anycast de serviço |
| `192.168.0.0/16` | Private-Use | RFC 1918 | False | privado, alto |
| `192.175.48.0/24` | Direct Delegation AS112 Service | RFC 7534 | True | público, baixo |
| `198.18.0.0/15` | Benchmarking | RFC 2544 | False | reservado, alto |
| `198.51.100.0/24` | Documentation (TEST-NET-2) | RFC 5737 | False | reservado, alto |
| `203.0.113.0/24` | Documentation (TEST-NET-3) | RFC 5737 | False | reservado, alto |
| `240.0.0.0/4` | Reserved | RFC 1112, Section 4 | False | reservado, alto |
| `255.255.255.255/32` | Limited Broadcast | RFC 8190; RFC 919, Section 7 | False | reservado, alto |

Dentro de `192.0.0.0/24` quem decide é a nota de rodapé do registro: o /24 é "Not useable unless by virtue of a more specific reservation", não pode ser usado a não ser por uma reserva mais específica, então vale a linha mais específica. `100.100.100.200`, um endereço de metadados de nuvem, fica no Shared Address Space e sai como metadados de nuvem, com essa linha identificada.

### IPv6

| Bloco | Nome na IANA | RFC | Globally Reachable | Classificação |
|---|---|---|---|---|
| `::1/128` | Loopback Address | RFC 4291 | False | loopback, alto |
| `::/128` | Unspecified Address | RFC 4291 | False | reservado, alto |
| `::ffff:0:0/96` | IPv4-mapped Address | RFC 4291 | False | pelo IPv4 carregado |
| `64:ff9b::/96` | IPv4-IPv6 Translat. | RFC 6052 | True | pelo IPv4 carregado |
| `64:ff9b:1::/48` | IPv4-IPv6 Translat. | RFC 8215 | False | pelo IPv4 carregado, nunca abaixo de reservado |
| `100::/64` | Discard-Only Address Block | RFC 6666 | False | reservado, alto |
| `100:0:0:1::/64` | Dummy IPv6 Prefix | RFC 9780 | False | reservado, alto |
| `2001::/23` | IETF Protocol Assignments | RFC 2928 | False | reservado, alto |
| `2001::/32` | TEREDO | RFC 4380; RFC 8190 | N/A | pelo mais interno dos dois IPv4 carregados |
| `2001:1::1/128` | Port Control Protocol Anycast | RFC 7723 | True | público, baixo, anycast de serviço |
| `2001:1::2/128` | Traversal Using Relays around NAT Anycast | RFC 8155 | True | público, baixo, anycast de serviço |
| `2001:1::3/128` | DNS-SD Service Registration Protocol Anycast | RFC 9665 | True | público, baixo, anycast de serviço |
| `2001:2::/48` | Benchmarking | RFC 5180; RFC Errata 1752 | False | reservado, alto |
| `2001:3::/32` | AMT | RFC 7450 | True | público, baixo |
| `2001:4:112::/48` | AS112-v6 | RFC 7535 | True | público, baixo |
| `2001:10::/28` | Deprecated (previously ORCHID) | RFC 4843 | nenhum | reservado, alto |
| `2001:20::/28` | ORCHIDv2 | RFC 7343 | True | público, baixo |
| `2001:30::/28` | Drone Remote ID Protocol Entity Tags (DETs) Prefix | RFC 9374 | True | público, baixo |
| `2001:db8::/32` | Documentation | RFC 3849 | False | reservado, alto |
| `2002::/16` | 6to4 | RFC 3056 | N/A | pelo IPv4 carregado |
| `2620:4f:8000::/48` | Direct Delegation AS112 Service | RFC 7534 | True | público, baixo |
| `3fff::/20` | Documentation | RFC 9637 | False | reservado, alto |
| `5f00::/16` | Segment Routing (SRv6) SIDs | RFC 9602 | False | reservado, alto |
| `fc00::/7` | Unique-Local | RFC 4193; RFC 8190 | False | privado, alto (`fd00:ec2::254`: metadados de nuvem) |
| `fe80::/10` | Link-Local Unicast | RFC 4291 | False | link-local, alto |

Algumas linhas merecem um comentário. O prefixo de benchmarking é `2001:2::/48` porque a errata 1752 corrigiu a RFC 5180, que tinha publicado `2001:0200::/48`; a errata diz "The IANA has assigned 2001:0002::/48 for IPv6 benchmarking", a IANA atribuiu `2001:0002::/48` para benchmarking de IPv6 ([RFC Errata 1752](https://www.rfc-editor.org/errata/eid1752)). O `5f00::/16` guarda identificadores de segmento do Segment Routing over IPv6, e as especificações de SRv6 "are intended to be applicable to a contained SR Domain or between collaborating SR Domains", valem dentro de um SR Domain ou entre SR Domains que colaboram ([RFC 9602, seção 5](https://www.rfc-editor.org/rfc/rfc9602.txt)). O `100:0:0:1::/64` é o prefixo IPv6 fictício que a RFC 9780 recomenda no lugar de "an IPv4 loopback address mapped to IPv6", um loopback IPv4 mapeado em IPv6 ([RFC 9780, resumo](https://www.rfc-editor.org/rfc/rfc9780.txt)). Endereços ORCHIDv2 e DET são identificadores, não localizadores: os ORCHIDs "are considered non-routable addresses from the IPv6-layer perspective", não são roteáveis do ponto de vista da camada IPv6 ([RFC 7343, resumo](https://www.rfc-editor.org/rfc/rfc7343.txt)), e os HHITs "are valid, though non-routable, IPv6 addresses", são endereços IPv6 válidos, mas não roteáveis ([RFC 9374, seção 1](https://www.rfc-editor.org/rfc/rfc9374.txt)). Mesmo assim o registro marca os dois blocos como globalmente alcançáveis, então a ferramenta segue o registro e os classifica como públicos, com o bloco identificado. Para os prefixos de documentação, a RFC 3849 é direta: "This assignment implies that IPv6 network operators should add this address prefix to the list of non-routeable IPv6 address space", os operadores devem pôr esse prefixo na lista de espaço IPv6 não roteável ([RFC 3849, seção 3](https://www.rfc-editor.org/rfc/rfc3849.txt)).

## Os endereços anycast de serviço, e por que saem como públicos

Cinco linhas são endereços anycast de serviço que o registro marca como globalmente alcançáveis: `192.0.0.9` e `2001:1::1` para o Port Control Protocol, `192.0.0.10` e `2001:1::2` para o TURN, e `2001:1::3` para o Service Registration Protocol do DNS-SD. Uma sexta, `192.88.99.2`, é o endereço anycast dos relays 6a44, que o registro marca como não globalmente alcançável. A ferramenta mantém a classificação que o registro implica (público para as cinco primeiras, reservado para a sexta), mas identifica o bloco pelo nome e acrescenta uma flag dizendo que é um endereço anycast de serviço de uso especial, para que o leitor perceba.

Por que marcar? Um endereço anycast não é uma máquina só: "A packet sent to an anycast address is delivered to the 'topologically nearest' network interface with the anycast address", o pacote é entregue à interface mais próxima na topologia que tem esse endereço ([RFC 8155, seção 6](https://www.rfc-editor.org/rfc/rfc8155.txt)). No PCP isso é, por definição, um middlebox próximo: os endereços permitem que os clientes "transmit signaling messages to their closest PCP-aware on-path NAT, firewall, or other middlebox", mandem a sinalização ao NAT, firewall ou middlebox com PCP mais próximo no caminho ([RFC 7723, resumo](https://www.rfc-editor.org/rfc/rfc7723.txt)). O `2001:1::3` é "a fixed anycast address that can be commonly used as a destination for SRP Updates when no SRP registrar is explicitly configured", um anycast fixo para onde vão os SRP Updates quando nenhum registrar SRP está configurado ([RFC 9665, seção 10.5](https://www.rfc-editor.org/rfc/rfc9665.txt)). Um servidor que busca uma dessas URLs pode, portanto, conversar com equipamentos no caminho da própria rede, algo que uma classificação pública sozinha esconderia. A classificação continua pública porque é o que o registro diz; a flag existe para que a allow-list cite esses endereços explicitamente em vez de deixá-los passar como hosts comuns da internet. A flag também acompanha um embutimento: `[64:ff9b::192.0.0.9]` sai como público e marcado, porque o endereço que ele leva é o anycast do PCP.

## Exemplos trabalhados

Os golden vectors da ferramenta fixam todos os exemplos abaixo, junto com um vector por linha dos registros.

| Entrada | Classificação | Motivo |
|---|---|---|
| `http://2852039166/latest/meta-data/` | metadados de nuvem, alto | forma decimal de `169.254.169.254` (o botão Exemplo) |
| `http://[::ffff:7f00:1]/` | loopback, alto | IPv4-mapped, leva `127.0.0.1` |
| `http://[0:0:0:0:0:0:0:1]/` | loopback, alto | uma grafia expandida de `::1` |
| `http://[::7f00:1]/` | loopback, alto | IPv4-compatible (descontinuado), leva `127.0.0.1` |
| `http://[64:ff9b::169.254.169.254]/` | metadados de nuvem, alto | Well-Known Prefix do NAT64, leva `169.254.169.254` |
| `http://[2002:7f00:1::]/` | loopback, alto | 6to4, leva `127.0.0.1` |
| `http://[2001:0:808:808:0:feae:80ff:fffe]/` | loopback, alto | Teredo, o cliente leva `127.0.0.1` |
| `http://[2001:0:a9fe:a9fe:8000:feae:fefd:fcfb]/` | metadados de nuvem, alto | Teredo, o servidor é `169.254.169.254` |
| `http://[2001:2::1]/` | reservado, alto | Benchmarking, `2001:2::/48` |
| `http://[5f00::1]/` | reservado, alto | Segment Routing (SRv6) SIDs, `5f00::/16` |
| `http://192.88.99.1/` | reservado, alto | Deprecated (6to4 Relay Anycast), sem valor de Globally Reachable |
| `http://192.0.0.10/` | público, baixo, marcado | endereço anycast de serviço do TURN |
| `http://[2001:1::3]/` | público, baixo, marcado | endereço anycast do Service Registration Protocol do DNS-SD |
| `http://192.31.196.1/` | público, baixo, identificado | AS112-v4 |

## Esquemas, credenciais e o desconhecido honesto

Além do endereço, a ferramenta sinaliza esquemas de URL perigosos (os que vão além de `http` e `https` e que payloads de SSRF costumam abusar) e credenciais embutidas na forma `usuário:senha@host`. Uma coisa sobre a qual ela tem o cuidado de ser honesta: um nome de host simples que não seja um nome especial conhecido é reportado como resolvido em tempo de execução, e não adivinhado, porque a ferramenta nunca faz resolução de DNS. Essa é a resposta verdadeira, e é também por isso que a ferramenta é segura: ela classifica o que a URL diz, em vez de sair buscando.

## Como usar

Cole uma URL, ou aperte Exemplo, e leia a classificação, o destino decodificado, o endereço IPv4 embutido com a própria linha de registro, os dois endereços do Teredo quando houver dois, o bloco de uso especial, qualquer flag de anycast ou de descontinuação, os esquemas ou credenciais sinalizados e o nível de risco de SSRF. Tudo é calculado localmente; nenhuma requisição é feita.

## API

O mesmo motor responde à operação `/api/v1/ssrf-url-classifier` da API HTTP do site, descrita campo a campo no contrato OpenAPI da [página da API](/api), com exemplos tirados dos vetores de ouro. O contrato também diz se este site serve a API.

- **Requisição.** A URL ou o host como texto: `?input=` no GET, ou no corpo do POST.
- **Resposta.** As partes da URL (`scheme`, `host`, `port`, `path`, `hasUserinfo`, `schemeFlag`), o endereço (`isIp`, `ipVersion`, `canonicalIp`, `obfuscated`, `obfuscationForm`), a classificação (`category`, `risk`, `reasons` em inglês) e a decodificação: `embedding` (`ipv4-mapped`, `ipv4-compatible`, `nat64-wkp`, `nat64-local`, `6to4`, `teredo` ou `null`), `embeddedIpv4` (o endereço que decide), `embeddingLayout`, `specialBlock` e `embeddedSpecialBlock` (cada um `{prefix, name, rfc, globallyReachable}` ou `null`), `teredo` (`serverIpv4`, `clientIpv4`, `clientPort`, `flags` ou `null`) e `anycastService`. Para `http://[2001:0:808:808:0:feae:80ff:fffe]/` a API responde `loopback` / `high`, com `teredo` servidor `8.8.8.8`, cliente `127.0.0.1`, porta 337 e flags 0, e `embeddedSpecialBlock` `127.0.0.0/8` "Loopback".
- **Erros.** Só uma entrada vazia é recusada: HTTP 400. Um host que a ferramenta não consegue situar não é erro; ele sai como `unresolved` ou `internal-name`.

`embedding`, `embeddedIpv4`, `embeddingLayout` e `specialBlock` entraram em 2026-10-19; mais tarde no mesmo dia `embedding` ganhou `ipv4-compatible` e `teredo`, `specialBlock` passou a cobrir todas as linhas do registro, `embeddedSpecialBlock`, `teredo` e `anycastService` entraram, e o `canonicalIp` de um endereço IPv4-compatible passou para a notação mista (`::127.0.0.1`).

## Fontes

Todas lidas em 2026-10-19.

- [IANA, IPv4 Special-Purpose Address Space, CSV, registro atualizado pela última vez em 2025-10-09](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) (lido em 2026-10-19): as 25 linhas; a nota [2] vem da [edição em XML](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xml)
- [IANA, IPv6 Special-Purpose Address Space, CSV, registro atualizado pela última vez em 2025-10-09](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv) (lido em 2026-10-19): as 25 linhas; as notas [1] a [4] e a definição de Globally Reachable vêm da [edição em XML](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xml)
- [RFC 4291, IP Version 6 Addressing Architecture, fevereiro de 2006](https://www.rfc-editor.org/rfc/rfc4291.txt) (lida em 2026-10-19): seção 2.2 (formas de texto), seções 2.5.5.1 e 2.5.5.2 (IPv4-compatible e IPv4-mapped)
- [RFC 5952, A Recommendation for IPv6 Address Text Representation, agosto de 2010](https://www.rfc-editor.org/rfc/rfc5952.txt) (lida em 2026-10-19): seções 4 e 5
- [RFC 6052, IPv6 Addressing of IPv4/IPv6 Translators, outubro de 2010](https://www.rfc-editor.org/rfc/rfc6052.txt) (lida em 2026-10-19): seções 2.1 a 2.4 e 3.1
- [RFC 8215, Local-Use IPv4/IPv6 Translation Prefix, agosto de 2017](https://www.rfc-editor.org/rfc/rfc8215.txt) (lida em 2026-10-19): seções 1, 4.1 e 5
- [RFC 3056, Connection of IPv6 Domains via IPv4 Clouds, fevereiro de 2001](https://www.rfc-editor.org/rfc/rfc3056.txt) (lida em 2026-10-19): seção 2
- [RFC 4380, Teredo: Tunneling IPv6 over UDP through Network Address Translations (NATs), fevereiro de 2006](https://www.rfc-editor.org/rfc/rfc4380.txt) (lida em 2026-10-19): seções 2.6 e 4
- [RFC 5991, Teredo Security Updates, setembro de 2010](https://www.rfc-editor.org/rfc/rfc5991.txt) (lida em 2026-10-19): seção 3.1
- [RFC 6751, Native IPv6 behind IPv4-to-IPv4 NAT Customer Premises Equipment (6a44), outubro de 2012](https://www.rfc-editor.org/rfc/rfc6751.txt) (lida em 2026-10-19): seções 5 e 8
- [RFC 7526, Deprecating the Anycast Prefix for 6to4 Relay Routers, maio de 2015](https://www.rfc-editor.org/rfc/rfc7526.txt) (lida em 2026-10-19): seções 4 e 7
- [RFC 7723, Port Control Protocol (PCP) Anycast Addresses, janeiro de 2016](https://www.rfc-editor.org/rfc/rfc7723.txt) (lida em 2026-10-19): resumo e seção 1
- [RFC 8155, Traversal Using Relays around NAT (TURN) Server Auto Discovery, abril de 2017](https://www.rfc-editor.org/rfc/rfc8155.txt) (lida em 2026-10-19): seções 6 e 8
- [RFC 9665, Service Registration Protocol for DNS-Based Service Discovery, junho de 2025](https://www.rfc-editor.org/rfc/rfc9665.txt) (lida em 2026-10-19): seção 10.5
- [RFC Errata 1752 da RFC 5180, IPv6 Benchmarking Methodology for Network Interconnect Devices](https://www.rfc-editor.org/errata/eid1752) (lida em 2026-10-19): o prefixo de benchmarking corrigido
- [RFC 7343, An IPv6 Prefix for Overlay Routable Cryptographic Hash Identifiers Version 2 (ORCHIDv2), setembro de 2014](https://www.rfc-editor.org/rfc/rfc7343.txt) (lida em 2026-10-19): resumo
- [RFC 9374, DRIP Entity Tag (DET) for Unmanned Aircraft System Remote ID (UAS RID), março de 2023](https://www.rfc-editor.org/rfc/rfc9374.txt) (lida em 2026-10-19): seção 1
- [RFC 9602, Segment Routing over IPv6 (SRv6) Segment Identifiers in the IPv6 Addressing Architecture, outubro de 2024](https://www.rfc-editor.org/rfc/rfc9602.txt) (lida em 2026-10-19): seções 5 e 6
- [RFC 9780, Bidirectional Forwarding Detection (BFD) for Multipoint Networks over Point-to-Multipoint MPLS Label Switched Paths (LSPs), maio de 2025](https://www.rfc-editor.org/rfc/rfc9780.txt) (lida em 2026-10-19): resumo
- [RFC 3849, IPv6 Address Prefix Reserved for Documentation, julho de 2004](https://www.rfc-editor.org/rfc/rfc3849.txt) (lida em 2026-10-19): seções 2 e 3
- [RFC 9637, Expanding the IPv6 Documentation Space, agosto de 2024](https://www.rfc-editor.org/rfc/rfc9637.txt) (lida em 2026-10-19): resumo e IANA considerations
- [RFC 6666, A Discard Prefix for IPv6, agosto de 2012](https://www.rfc-editor.org/rfc/rfc6666.txt) (lida em 2026-10-19): seções 2 e 4
- [RFC 7050, Discovery of the IPv6 Prefix Used for IPv6 Address Synthesis, novembro de 2013](https://www.rfc-editor.org/rfc/rfc7050.txt) (lida em 2026-10-19): seção 2.2
- [WHATWG, URL Standard, Living Standard atualizado pela última vez em 19 de outubro de 2026](https://url.spec.whatwg.org/) (lido em 2026-10-19): o serializador de IPv6
