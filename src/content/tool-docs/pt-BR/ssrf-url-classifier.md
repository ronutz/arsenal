## O que faz

Cole uma URL e a ferramenta diz para onde ela realmente aponta: loopback, uma faixa privada ou link-local, um endpoint de metadados de nuvem, o espaço compartilhado CGNAT, outro espaço reservado ou a internet pública. Ela decodifica os truques de ofuscação de IP usados para disfarçar um endereço interno, lê o endereço IPv4 que um endereço IPv6 pode levar dentro de si, dá o nome do bloco de uso especial da IANA em que o endereço cai, sinaliza esquemas de URL perigosos e credenciais embutidas, e mostra um nível de risco de SSRF. Ela nunca resolve DNS e nunca envia a requisição; é um classificador, não uma sonda.

## O que é SSRF, e por que a classificação importa

Server-Side Request Forgery é um ataque em que um servidor é enganado para fazer uma requisição a uma URL escolhida pelo atacante, tipicamente para alcançar algo que o atacante não consegue alcançar diretamente: um serviço em `localhost`, uma máquina em uma faixa interna, ou o endpoint de metadados de um provedor de nuvem. Defender-se disso se resume a decidir se uma URL é segura para buscar, e essa decisão é mais difícil do que parece, porque um endereço interno pode ser escrito em muitas formas disfarçadas. Esta ferramenta foi feita para essa decisão: ela existe para ajudar você a entender uma URL e projetar uma allow-list, firmemente do lado defensivo da linha.

## As ofuscações que ela decodifica

Um filtro ingênuo que bloqueia `127.0.0.1` deixa passar as muitas outras formas de escrever o mesmo endereço, e os atacantes exploram exatamente isso. A ferramenta as decodifica para que o destino real fique visível:

- a forma inteira **decimal**, em que `2130706433` é `127.0.0.1`;
- as formas de octeto **octal** e **hexadecimal**;
- o IPv4 em **forma curta**, em que `127.1` se expande para `127.0.0.1`;
- **qualquer grafia de um endereço IPv6**: a ferramenta converte o endereço nos seus oito blocos de 16 bits antes de classificar qualquer coisa, então `[0:0:0:0:0:0:0:1]` e `[0000:0000:0000:0000:0000:0000:0000:0001]` são o loopback `::1`, do mesmo jeito que a RFC 4291 lista `0:0:0:0:0:0:0:1` e `::1` como duas grafias do endereço de loopback, em que "The use of "::" indicates one or more groups of 16 bits of zeros", o `::` vale por um ou mais grupos de 16 bits zerados ([RFC 4291, seção 2.2](https://www.rfc-editor.org/rfc/rfc4291.txt)); e
- os **endereços IPv6 que levam um endereço IPv4**, descritos na próxima seção.

Ela então classifica o literal resolvido em relação às faixas reservadas (RFC 1918 privada, RFC 3927 link-local, RFC 6598 CGNAT, os blocos de uso especial da IANA, e as demais) e destaca o endereço de metadados de nuvem, que é um alvo primário de SSRF. O endereço decodificado aparece no texto canônico da [RFC 5952](https://www.rfc-editor.org/rfc/rfc5952.txt): minúsculas, sem zeros à esquerda, a maior sequência de blocos zerados escrita como `::` (seção 4) e, para os dois prefixos que por si só marcam um IPv4 embutido, a notação mista com o final em decimal com pontos, porque "mixed notation is RECOMMENDED if the following condition is met", a notação mista é recomendada quando a condição vale, e a condição é um prefixo bem conhecido (seção 5).

## Endereços IPv6 que levam um endereço IPv4

Quatro layouts de IPv6 colocam um endereço IPv4 dentro dos 128 bits. Um filtro que só confere o texto IPv6 deixa passar o alvo IPv4 interno, então a ferramenta decodifica o endereço IPv4, classifica a URL por ele e diz qual embutimento decodificou. O resultado mostra o embutimento e o endereço carregado ao lado da forma canônica.

| Layout | Prefixo | Onde fica o endereço IPv4 | Fonte |
|---|---|---|---|
| IPv4-mapped | `::ffff:0:0/96` | nos 32 bits finais | [RFC 4291, seção 2.5.5.2](https://www.rfc-editor.org/rfc/rfc4291.txt) |
| Well-Known Prefix do NAT64 | `64:ff9b::/96` | nos 32 bits finais (o layout /96) | [RFC 6052, seções 2.1 e 2.2](https://www.rfc-editor.org/rfc/rfc6052.txt) |
| Prefixo de uso local do NAT64 | `64:ff9b:1::/48` | depende do tamanho de prefixo escolhido pelo operador: o layout /48, /56, /64 ou /96 da RFC 6052 | [RFC 8215, seções 1 e 5](https://www.rfc-editor.org/rfc/rfc8215.txt) |
| 6to4 | `2002::/16` | nos bits 16 a 47 (o campo V4ADDR) | [RFC 3056, seção 2](https://www.rfc-editor.org/rfc/rfc3056.txt) |

**IPv4-mapped.** `[::ffff:127.0.0.1]` é o endereço de loopback vestido de IPv6. O navegador não o mostra assim: o serializador de IPv6 do WHATWG URL Standard escreve cada bloco de 16 bits como "the shortest possible lowercase hexadecimal number", o menor hexadecimal possível em minúsculas, então a mesma URL volta como `[::ffff:7f00:1]` ([WHATWG URL Standard, serializador de IPv6](https://url.spec.whatwg.org/)). As duas grafias agora saem como loopback, risco alto; antes de 2026-10-19 a grafia hexadecimal saía como pública.

**Well-Known Prefix do NAT64.** `[64:ff9b::169.254.169.254]` e o gêmeo hexadecimal `[64:ff9b::a9fe:a9fe]` levam o endereço de metadados link-local, então saem como metadados de nuvem. A RFC 6052 diz "The Well-Known Prefix MUST NOT be used to represent non-global IPv4 addresses", o Well-Known Prefix não pode representar endereços IPv4 não globais, e manda os tradutores descartarem esses pacotes ([RFC 6052, seção 3.1](https://www.rfc-editor.org/rfc/rfc6052.txt)). O endereço continua apontando para aquele alvo interno, e por isso o filtro precisa rejeitá-lo em vez de confiar em todo tradutor do caminho. Um endereço sob o Well-Known Prefix que leve um IPv4 público, como `64:ff9b::8.8.8.8`, sai como público, porque o registro marca `64:ff9b::/96` como globalmente alcançável.

**Prefixo de uso local do NAT64.** A RFC 8215 reserva `64:ff9b:1::/48` para tradução dentro de uma rede e deixa o tamanho do prefixo de tradução a critério do operador; os nós "must not make any assumptions regarding the syntax or properties of those addresses", não podem presumir nada sobre a sintaxe ou as propriedades desses endereços ([RFC 8215, seção 5](https://www.rfc-editor.org/rfc/rfc8215.txt)). Por isso a ferramenta lê o endereço com cada layout da RFC 6052 que cabe num /48 (/96, /64, /56 e /48), fica com a leitura que aponta mais para dentro (metadados de nuvem, depois loopback, link-local, privada) e mostra a leitura /96 quando nenhuma aponta. Todo layout pula os bits 64 a 71, e a RFC 6052 diz "These bits MUST be set to zero", esses bits precisam ser zero ([RFC 6052, seção 2.2](https://www.rfc-editor.org/rfc/rfc6052.txt)); quando não são, nenhum endereço IPv4 é decodificado. Como o registro da IANA marca `64:ff9b:1::/48` como não globalmente alcançável, um endereço dentro dele nunca sai abaixo de reservado.

**6to4.** A RFC 3056 monta o prefixo de um site a partir do prefixo `2002` de 16 bits e do endereço IPv4 de 32 bits do site, escrito `2002:V4ADDR::/48` ([RFC 3056, seção 2](https://www.rfc-editor.org/rfc/rfc3056.txt)). Assim, `[2002:7f00:1::]` leva `127.0.0.1` e sai como loopback; `[2002:a9fe:a9fe::1]` leva o endereço de metadados.

## Blocos reservados com o nome dos registros da IANA

A ferramenta também dá nome aos blocos abaixo a partir dos registros IPv4 e IPv6 Special-Purpose Address Space da IANA ([CSV do IPv4](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) e [CSV do IPv6](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv), os dois atualizados pela última vez em 2025-10-09). Um bloco com Globally Reachable igual a False sai como **reservado**, que na escala desta ferramenta é risco alto, a mesma classificação que as faixas IPv4 de documentação já tinham. O resultado mostra o bloco, o nome que o registro dá a ele e a RFC.

| Bloco | Nome na IANA | RFC | Globally Reachable | Classificação |
|---|---|---|---|---|
| `2001:db8::/32` | Documentation | RFC 3849 | False | reservado, alto |
| `3fff::/20` | Documentation | RFC 9637 | False | reservado, alto |
| `100::/64` | Discard-Only Address Block | RFC 6666 | False | reservado, alto |
| `192.0.0.0/24` | IETF Protocol Assignments | RFC 6890, Section 2.1 | False | reservado, alto |
| `192.0.0.0/29` | IPv4 Service Continuity Prefix | RFC 7335 | False | reservado, alto |
| `192.0.0.8/32` | IPv4 dummy address | RFC 7600 | False | reservado, alto |
| `192.0.0.9/32` | Port Control Protocol Anycast | RFC 7723 | True | público, baixo |
| `192.0.0.10/32` | Traversal Using Relays around NAT Anycast | RFC 8155 | True | público, baixo |
| `192.0.0.170/32`, `192.0.0.171/32` | NAT64/DNS64 Discovery | RFC 8880; RFC 7050, Section 2.2 | False | reservado, alto |

Para os dois prefixos de documentação, a RFC 3849 é direta: "This assignment implies that IPv6 network operators should add this address prefix to the list of non-routeable IPv6 address space", os operadores devem pôr esse prefixo na lista de espaço IPv6 não roteável ([RFC 3849, seção 3](https://www.rfc-editor.org/rfc/rfc3849.txt)); a RFC 9637 acrescenta `3fff::/20` como um segundo prefixo de documentação, maior ([RFC 9637](https://www.rfc-editor.org/rfc/rfc9637.txt)). O `100::/64` existe para filtragem por remote triggered black hole: "IANA has recorded the allocation of the IPv6 address prefix 0100::/64 as a Discard-Only Prefix", a IANA registrou `0100::/64` como prefixo só de descarte ([RFC 6666, seção 4](https://www.rfc-editor.org/rfc/rfc6666.txt)). Dentro de `192.0.0.0/24` quem decide é a nota de rodapé do registro: o /24 é "Not useable unless by virtue of a more specific reservation", não pode ser usado a não ser por uma reserva mais específica, então vale a linha mais específica. É por isso que `192.0.0.9` e `192.0.0.10`, dois serviços anycast que o registro marca como globalmente alcançáveis, saem como públicos, enquanto `192.0.0.170` e `192.0.0.171`, os endereços que a RFC 7050 define para descobrir um prefixo NAT64 ([RFC 7050, seção 2.2](https://www.rfc-editor.org/rfc/rfc7050.txt)), saem como reservados.

## Exemplos trabalhados

Estes dez endereços saíam como públicos, risco baixo, até 2026-10-19. Cada um agora sai como mostrado; os golden vectors da ferramenta fixam todos eles junto com uma segunda grafia do mesmo endereço.

| Entrada | Classificação | Motivo |
|---|---|---|
| `http://[::ffff:7f00:1]/` | loopback, alto | IPv4-mapped, leva `127.0.0.1` |
| `http://[0:0:0:0:0:0:0:1]/` | loopback, alto | uma grafia expandida de `::1` |
| `http://[64:ff9b::7f00:1]/` | loopback, alto | Well-Known Prefix do NAT64, leva `127.0.0.1` |
| `http://[64:ff9b::169.254.169.254]/` | metadados de nuvem, alto | Well-Known Prefix do NAT64, leva `169.254.169.254` |
| `http://[2002:7f00:1::]/` | loopback, alto | 6to4, leva `127.0.0.1` |
| `http://[2001:db8::1]/` | reservado, alto | Documentation, `2001:db8::/32` |
| `http://[3fff::1]/` | reservado, alto | Documentation, `3fff::/20` |
| `http://[100::1]/` | reservado, alto | Discard-Only Address Block, `100::/64` |
| `http://192.0.0.1/` | reservado, alto | IPv4 Service Continuity Prefix, `192.0.0.0/29` |
| `http://192.0.0.170/` | reservado, alto | NAT64/DNS64 Discovery |

## Esquemas, credenciais e o desconhecido honesto

Além do endereço, a ferramenta sinaliza esquemas de URL perigosos (os que vão além de `http` e `https` e que payloads de SSRF costumam abusar) e credenciais embutidas na forma `usuário:senha@host`. Uma coisa sobre a qual ela tem o cuidado de ser honesta: um nome de host simples que não seja um nome especial conhecido é reportado como resolvido em tempo de execução, e não adivinhado, porque a ferramenta nunca faz resolução de DNS. Essa é a resposta verdadeira, e é também por isso que a ferramenta é segura: ela classifica o que a URL diz, em vez de sair buscando.

## Como usar

Cole uma URL e leia sua classificação, o destino decodificado, o endereço IPv4 embutido e o bloco de uso especial quando houver, quaisquer esquemas ou credenciais sinalizados, e o nível de risco de SSRF. Tudo é calculado localmente; nenhuma requisição é feita.

## Fontes

- [IANA, IPv4 Special-Purpose Address Space, CSV, registro atualizado pela última vez em 2025-10-09](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) (lido em 2026-10-19): as linhas de 192.0.0.0/24 e a nota [2]
- [IANA, IPv6 Special-Purpose Address Space, CSV, registro atualizado pela última vez em 2025-10-09](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv) (lido em 2026-10-19): ::1/128, ::ffff:0:0/96, 64:ff9b::/96, 64:ff9b:1::/48, 100::/64, 2001:db8::/32, 2002::/16, 3fff::/20
- [RFC 4291, IP Version 6 Addressing Architecture, fevereiro de 2006](https://www.rfc-editor.org/rfc/rfc4291.txt) (lida em 2026-10-19): seção 2.2 (formas de texto), seção 2.5.5.2 (IPv4-mapped)
- [RFC 5952, A Recommendation for IPv6 Address Text Representation, agosto de 2010](https://www.rfc-editor.org/rfc/rfc5952.txt) (lida em 2026-10-19): seções 4 e 5
- [RFC 6052, IPv6 Addressing of IPv4/IPv6 Translators, outubro de 2010](https://www.rfc-editor.org/rfc/rfc6052.txt) (lida em 2026-10-19): seções 2.1 a 2.4 e 3.1
- [RFC 8215, Local-Use IPv4/IPv6 Translation Prefix, agosto de 2017](https://www.rfc-editor.org/rfc/rfc8215.txt) (lida em 2026-10-19): seções 1, 4.1 e 5
- [RFC 3056, Connection of IPv6 Domains via IPv4 Clouds, fevereiro de 2001](https://www.rfc-editor.org/rfc/rfc3056.txt) (lida em 2026-10-19): seção 2
- [RFC 3849, IPv6 Address Prefix Reserved for Documentation, julho de 2004](https://www.rfc-editor.org/rfc/rfc3849.txt) (lida em 2026-10-19): seções 2 e 3
- [RFC 9637, Expanding the IPv6 Documentation Space, agosto de 2024](https://www.rfc-editor.org/rfc/rfc9637.txt) (lida em 2026-10-19): resumo e IANA considerations
- [RFC 6666, A Discard Prefix for IPv6, agosto de 2012](https://www.rfc-editor.org/rfc/rfc6666.txt) (lida em 2026-10-19): seções 2 e 4
- [RFC 7050, Discovery of the IPv6 Prefix Used for IPv6 Address Synthesis, novembro de 2013](https://www.rfc-editor.org/rfc/rfc7050.txt) (lida em 2026-10-19): seção 2.2
- [WHATWG, URL Standard, Living Standard atualizado pela última vez em 19 de outubro de 2026](https://url.spec.whatwg.org/) (lido em 2026-10-19): o serializador de IPv6
