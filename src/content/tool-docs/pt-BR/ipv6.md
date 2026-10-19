## O que faz

Analise um endereço ou prefixo IPv6 e o veja de todos os ângulos: sua forma canônica curta e sua forma totalmente expandida, que tipo de endereço ele é, a aritmética de prefixo de um bloco, um endereço MAC de hardware se houver um embutido no identificador de interface, os campos de um endereço Teredo e o nome de DNS reverso que aponta de volta para ele. Tudo é calculado no seu navegador.

## Formas canônica e expandida

Um endereço IPv6 tem 128 bits, escrito como oito grupos de quatro dígitos hexadecimais separados por dois-pontos. O mesmo endereço pode ser escrito de muitas formas, então a RFC 5952 define uma forma canônica: em minúsculas, com os zeros à esquerda de cada grupo removidos e a única maior sequência de grupos todos zero reduzida a `::`. A ferramenta mostra essa forma canônica e, ao lado dela, a forma totalmente expandida com cada grupo escrito por completo, que é a versão que você quer quando precisa ver todos os 128 bits ou alinhar endereços por coluna. Por exemplo, `2001:0db8:0000:0000:0000:0000:0000:0001` expande de, e se canoniza para, `2001:db8::1`. Um endereço IPv4-mapeado mantém a notação mista que a seção 5 da RFC 5952 recomenda (`::ffff:192.0.2.128`), enquanto a forma expandida é sempre de oito grupos hex.

## Classificação e aritmética de prefixo

Nem todo endereço é um endereço público comum. A ferramenta classifica as faixas de uso especial, cada uma conferida no IANA IPv6 Special-Purpose Address Registry:

| Bloco | Aparece como | Definido por |
| --- | --- | --- |
| `::1/128` | Loopback | RFC 4291 |
| `::/128` | Unspecified | RFC 4291 |
| `::ffff:0:0/96` | IPv4-mapped | RFC 4291 |
| `64:ff9b::/96` | IPv4/IPv6 translation | RFC 6052 |
| `64:ff9b:1::/48` | IPv4/IPv6 translation (local use) | RFC 8215 |
| `100::/64` | Discard-only | RFC 6666 |
| `2001::/32` | Teredo | RFC 4380 |
| `2001:db8::/32` | Documentation | RFC 3849 |
| `2002::/16` | 6to4 | RFC 3056 |
| `3fff::/20` | Documentation | RFC 9637 |
| `5f00::/16` | Segment Routing (SRv6) SIDs | RFC 9602 |
| `fc00::/7` | Unique local | RFC 4193 |
| `fe80::/10` | Link-local unicast | RFC 4291 |
| `ff00::/8` | Multicast | RFC 4291 |

O que sobra em `2000::/3` aparece como global unicast. O registro tem outras linhas (por exemplo `2001:2::/48`, de benchmarking, e `2001:20::/28`, do ORCHIDv2) que esta tabela ainda não traz, então um endereço numa delas aparece como global unicast.

Quando você fornece um prefixo, ela calcula o endereço de rede do bloco, seu primeiro e último endereço e quantos endereços ele abrange, a mesma aritmética que a ferramenta de CIDR faz para IPv4, mas em um campo de 128 bits.

## Multicast: escopo, flags e source-specific multicast

Um endereço multicast começa com `ff`, seguido de um campo de flags de 4 bits e de um escopo de 4 bits (RFC 4291, seção 2.7). A ferramenta dá nome ao escopo conforme o registro de escopos da IANA: interface-local (1), link-local (2), realm-local (3, nomeado pela RFC 7346), admin-local (4), site-local (5), organization-local (8) e global (E). Os valores 0 e F são reservados e aparecem como `reserved (scope 0)` e `reserved (scope F)`; os valores 6, 7 e de 9 a D não estão atribuídos e aparecem, por exemplo, como `unassigned (scope 6)`. Assim, `ff0f::1` deixa de parecer um escopo válido.

O campo de flags é lido bit a bit como X, R, P e T (RFC 7371, seção 4): T=1 indica um endereço transitório, P=1 um endereço baseado num prefixo unicast (RFC 3306) e R=1 um endereço com rendezvous point embutido (RFC 3956). Para `ff02::1` aparece `0000 (X=0, R=0, P=0, T=0)`.

Quando as flags valem `0011` e os 16 bits seguintes são zero, o endereço está em `ff3x::/32`, faixa que a seção 1 da RFC 4607 reserva para source-specific multicast (SSM): "all SSM addresses must have P=1, T=1, and plen=0", todo endereço SSM tem P=1, T=1 e plen=0. A ferramenta então o classifica como Source-specific multicast e diz em que parte do espaço de group IDs ele cai, segundo a RFC 4607 e o registro da IANA: de `ff3x::0:0` a `ff3x::3fff:ffff` são inválidos, de `ff3x::4000:0` a `ff3x::7fff:ffff` ficam reservados para alocação pela IANA, de `ff3x::8000:0` a `ff3x::ffff:ffff` são de atribuição dinâmica, e um endereço com o campo de network prefix diferente de zero (fora de `ff3x::/96`) fica reservado para uso futuro do SSM e hoje é inválido. Por exemplo, `ff3e::8000:1` é SSM de escopo global na faixa dinâmica.

## Teredo

Um endereço Teredo guarda um endpoint de túnel dentro dos 128 bits (RFC 4380, seção 4): o prefixo de 32 bits `2001::/32`, o IPv4 do servidor Teredo em claro (bits 32 a 63), 16 bits de flags e, por fim, a porta UDP externa e o IPv4 externo do cliente, ambos ofuscados: "Each bit in the address and port number is reversed", cada bit é invertido, o que equivale a um XOR com `0xFFFF` na porta e com `0xFFFFFFFF` no endereço. A ferramenta desfaz o XOR e mostra o servidor, o endereço do cliente, a porta do cliente e as flags. Ela lê as flags no layout da seção 3.1 da RFC 5991 (`|C|z|Random1|U|G|Random2|`), nomeando o bit de cone C e os bits U e G; os doze bits aleatórios ficam como estão.

Exemplo resolvido com endereços de documentação: `2001:0:c000:22d:3c5a:63bf:34ff:8eeb` se decodifica em servidor `192.0.2.45` (`c000:022d`), flags `0x3c5a` (C=0, U=0, G=0), porta do cliente `40000` (`63bf` XOR `ffff` = `9c40`) e cliente `203.0.113.20` (`34ff:8eeb` XOR `ffff:ffff` = `cb00:7114`). O módulo `ipaddress` do Python devolve o mesmo servidor e o mesmo cliente pela propriedade `teredo`. O decodificador roda para um único endereço (sem comprimento de prefixo, ou com `/128`); para um bloco como `2001::/32`, a ferramenta classifica a faixa e faz só a aritmética de prefixo.

## EUI-64 e DNS reverso

Dois extras surgem do endereço. Se o identificador de interface foi construído a partir do MAC de 48 bits de uma placa de rede usando o método EUI-64 modificado (RFC 4291, Apêndice A), a ferramenta recupera esse MAC, o que é justamente o motivo pelo qual existem extensões de privacidade para evitar vazá-lo. E ela monta o nome de DNS reverso `ip6.arpa`: os nibbles do endereço em ordem inversa, separados por pontos, terminando em `.ip6.arpa`, que é o que uma consulta PTR do endereço usa.

## Como usar

Cole um endereço IPv6 para ver suas formas canônica e expandida, sua classificação, as flags e o escopo de multicast, os campos Teredo, qualquer MAC embutido e seu nome de DNS reverso, ou cole um prefixo para acrescentar a aritmética do bloco. A análise é determinística e lê apenas o endereço que você fornece.

## API

O mesmo motor responde à operação `/api/v1/ipv6` da API HTTP do site, descrita campo a campo no contrato OpenAPI da [página da API](/api), com exemplos tirados dos vetores de ouro. O contrato também diz se este site serve a API.

- **Requisição.** O endereço ou prefixo como texto: `?input=` no GET, ou no corpo do POST.
- **Resposta.** `input`, `bytes` (16 números), `compressed`, `expanded`, `prefixLength`, `classification` (`type`, `detail` e `isMulticast`; para todo endereço multicast também `scope`, `scopeStatus` e `flags`; `ssmRange` para ff3x::/32; `embeddedIpv4` para as formas IPv4-mapped e IPv4-compatible), `prefix` (a aritmética do prefixo, ou `null`), `eui64Mac`, `teredo` (`server`, `flags`, `cone`, `port` e `client`, ou `null`) e `reverseDns`. Para `2001:0:c000:22d:3c5a:63bf:34ff:8eeb` a API responde `teredo.server` `192.0.2.45`, `teredo.port` 40000 e `teredo.client` `203.0.113.20`.
- **Erros.** HTTP 400, `invalid_input`, com a mensagem `empty`, `format` ou `prefix`.

`scopeStatus`, `flags`, `ssmRange` e `teredo` entraram em 2026-10-19.

## Fontes

- [IANA IPv6 Special-Purpose Address Registry, CSV (registro atualizado em 2025-10-09)](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv) (lido em 2026-10-19)
- [IANA IPv6 Multicast Address Space Registry: escopos e group IDs de SSM (atualizado em 2026-04-07)](https://www.iana.org/assignments/ipv6-multicast-addresses/ipv6-multicast-addresses.txt) (lido em 2026-10-19)
- [RFC 4291: IP Version 6 Addressing Architecture, seção 2.7 e Apêndice A](https://www.rfc-editor.org/rfc/rfc4291) (lida em 2026-10-19)
- [RFC 5952: A Recommendation for IPv6 Address Text Representation](https://www.rfc-editor.org/rfc/rfc5952) (lida em 2026-10-19)
- [RFC 7346: IPv6 Multicast Address Scopes](https://www.rfc-editor.org/rfc/rfc7346) (lida em 2026-10-19)
- [RFC 7371: Updates to the IPv6 Multicast Addressing Architecture, seção 4](https://www.rfc-editor.org/rfc/rfc7371) (lida em 2026-10-19)
- [RFC 3306: Unicast-Prefix-based IPv6 Multicast Addresses, seção 6](https://www.rfc-editor.org/rfc/rfc3306) (lida em 2026-10-19)
- [RFC 3956: Embedding the Rendezvous Point (RP) Address in an IPv6 Multicast Address](https://www.rfc-editor.org/rfc/rfc3956) (lida em 2026-10-19)
- [RFC 4607: Source-Specific Multicast for IP, seção 1](https://www.rfc-editor.org/rfc/rfc4607) (lida em 2026-10-19)
- [RFC 4380: Teredo: Tunneling IPv6 over UDP through Network Address Translations (NATs), seção 4](https://www.rfc-editor.org/rfc/rfc4380) (lida em 2026-10-19)
- [RFC 5991: Teredo Security Updates, seção 3.1](https://www.rfc-editor.org/rfc/rfc5991) (lida em 2026-10-19)
- [RFC 9637: Expanding the IPv6 Documentation Space](https://www.rfc-editor.org/rfc/rfc9637) (lida em 2026-10-19)
- [RFC 9602: Segment Routing over IPv6 (SRv6) Segment Identifiers in the IPv6 Addressing Architecture](https://www.rfc-editor.org/rfc/rfc9602) (lida em 2026-10-19)
- [RFC 8215: Local-Use IPv4/IPv6 Translation Prefix](https://www.rfc-editor.org/rfc/rfc8215) (lida em 2026-10-19)
- [RFC 3849: IPv6 Address Prefix Reserved for Documentation](https://www.rfc-editor.org/rfc/rfc3849) (lida em 2026-10-19)
