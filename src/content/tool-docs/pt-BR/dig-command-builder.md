## O que faz

Você descreve a consulta; a página escreve a linha de comando do `dig`. Quatro grupos de controles correspondem às quatro coisas que uma invocação do dig diz:

- **O que consultar:** um nome e um tipo de registro (A por padrão, qualquer mnemônico do registro da IANA, `TYPEnn`, ou os tipos de consulta ANY, AXFR e IXFR com o serial que você tem), uma classe (IN por padrão; CH e HS), ou um endereço para uma consulta reversa com `-x`, caso em que o dig deriva o nome PTR sozinho e o nome, o tipo e a classe não são escritos.
- **A quem perguntar:** o servidor (`@servidor`, um nome de host ou um endereço IPv4 ou IPv6 sem colchetes), uma porta fora do padrão (`-p`), o transporte (UDP, `+tcp`, `+tls`, `+https` com o seu endpoint), uma família de endereços (`-4`, `-6`) e um endereço de origem (`-b`).
- **Como perguntar:** `+trace`, `+nssearch`, `+norecurse`, `+dnssec`, `+cd`, `+ignore`; os controles de EDNS `+bufsize`, `+subnet`, `+nsid`, `+nocookie`, `+noedns`; e os tempos `+timeout`, `+tries`, `+retry`.
- **O que imprimir:** a mensagem inteira, `+short` (com `+identify`), `+noall +answer`, ou `+yaml`; mais `+multiline`, `+ttlunits` e `+qr`.
- **Na sua máquina:** `-k arquivo` para uma consulta assinada e `-r` para ignorar o `~/.digrc`.

Três coisas voltam: o comando, numa ordem canônica, com um botão Copiar; os achados, onde uma combinação é contraditória, redundante ou provável de surpreender; e um resumo do que a consulta vai carregar, derivado dos padrões e interações que o manual declara: a pergunta que o dig vai pôr na mensagem, a quais servidores pergunta, o transporte e a porta depois dos padrões por tipo, se uma resposta UDP truncada é tentada de novo por TCP, e os bits RD, DO, CD e AD, o registro OPT do EDNS e o tamanho do buffer, o cookie, e se a consulta é assinada. Cada parte é explicada embaixo.

## A ordem do comando

O dig lê a linha inteira e não se importa muito com a ordem, com duas exceções que o manual declara: as opções de consulta (as palavras com `+`) são sensíveis à ordem, e `+short` e `+cmd` são globais. O montador escreve uma ordem fixa para que a mesma intenção dê sempre os mesmos bytes: `dig`, `@servidor`, as opções (`-r`, `-4`/`-6`, `-b`, `-p`, `-k`), a pergunta (`-x endereço`, ou o nome, depois o tipo, depois a classe), e então as opções de consulta agrupadas em transporte, modo, bits do cabeçalho, EDNS, tempos, saída. `+noall` é sempre escrito antes de `+answer`, porque eles se aplicam em sequência.

Os padrões não são escritos: tipo A, classe IN, porta 53 (853 para TLS, 443 para HTTPS), UDP. Um nome que também é mnemônico de tipo ou de classe (o domínio de topo `ch`, um host chamado literalmente `mx`) é escrito com `-q`, porque o dig lê as palavras soltas como tipos e classes antes de nomes; a nota do próprio manual sobre os domínios de topo IN e CH é a razão de a opção existir.

## O que os achados verificam

Cada regra aponta para a frase do manual ou da RFC que a justifica:

- `+trace` liga `+dnssec` e `+cookie` e desliga a recursão; `@servidor` então afeta só a consulta inicial pelos servidores da raiz. Pedir `+dnssec` ou `+norecurse` junto é sinalizado como redundante, e a nota sobre o servidor é mostrada.
- `+nssearch` também desliga a recursão.
- O tipo ANY e `ixfr=N` usam TCP por padrão; AXFR sempre usa TCP, e uma transferência sem `@servidor` iria para os resolvedores do `/etc/resolv.conf` em vez de para um servidor que tem a zona (RFC 5936). ANY pode ter resposta mínima ou um registro HINFO sintetizado (RFC 8482).
- `+bufsize` vai de 0 a 65535; um valor abaixo de 512 é tratado como 512 por quem recebe (RFC 6891, seção 6.2.3); acima de 4096 passa do ponto de partida sugerido pela RFC 6891; o DNS Flag Day 2020 nomeia 1232 como o tamanho mínimo seguro.
- `+dnssec`, `+trace`, `+bufsize`, `+nsid` e `+subnet` vivem no registro OPT (RFC 6891; o bit DO é a RFC 3225), então `+noedns` não pode ser combinado com eles e não é escrito quando estão presentes.
- `+subnet=0` (ou um comprimento de prefixo 0) pede ao resolvedor que não use o seu endereço (RFC 7871).
- `-4` contra um literal IPv6 de servidor, ou `-6` contra um IPv4, deixa o dig sem ter para onde mandar a consulta.
- `+timeout` abaixo de 1 e `+tries` igual a 0 são silenciosamente elevados a 1 pelo dig.
- `+identify` não faz nada sem `+short`; `+ignore` não faz nada sem UDP.
- Só `-k` é oferecido para TSIG. O manual manda usá-lo em vez de `-y`, porque `-y` põe o segredo compartilhado na linha de comando, onde o `ps` e o histórico do shell o veem.

## Limites

- O montador emite uma consulta por comando. O dig aceita várias consultas numa linha, cada uma com as suas opções, e um arquivo de lote com `-f`; nenhum dos dois é modelado.
- Ele não roda o dig, não resolve nada e não verifica se um servidor existe. O resumo é derivado das declarações do manual, não observado.
- As opções não oferecidas (`+aaonly`, `+besteffort`, `+cmd`, `+comments`, `+crypto`, `+domain`, `+ednsopt`, `+expire`, `+header-only`, `+keepopen`, `+ndots`, `+onesoa`, `+opcode`, `+padding`, `+proxy`, `+qid`, `+search`, `+split`, `+stats`, `+tls-ca` e os demais arquivos de TLS, `+unknownformat`, `+zoneversion`, `-c` como opção, `-f`, `-F`, `-m`, `-t` como opção, `-u`, `-y`) estão documentadas no manual; as comuns estão aqui.
- Os nomes são verificados pela forma (rótulos de letras, dígitos, hifens e sublinhados, de até 63 caracteres cada, até 253 no total; um asterisco sozinho como rótulo curinga); o montador não sabe se um nome existe.
- O manual do dig lido para esta página é a documentação "latest" do BIND 9 (9.21). Versões mais antigas do dig não têm algumas opções de consulta (`+tls`, `+https`, `+yaml` são recentes); o dig imprime "Invalid option" para uma palavra que não conhece.

## Fontes

- [BIND 9 Administrator Reference Manual, Manual Pages: dig](https://bind9.readthedocs.io/en/latest/manpages.html#man-dig) (lido em 2026-10-04): cada opção e opção de consulta, os padrões e as interações citadas acima
- [Fonte do BIND 9, bin/dig/dig.c](https://github.com/isc-projects/bind9/blob/main/bin/dig/dig.c) (lido em 2026-10-04): a ordem em que uma palavra solta é tentada (ixfr=, tipo, classe, nome), e o TCP por padrão para ANY e ixfr
- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (lida em 2026-10-04): valores de TYPE e CLASS, porta 53, o limite de 512 bytes do UDP, IN-ADDR.ARPA, comprimentos de rótulo e de nome, o bit RD
- [RFC 3596: DNS Extensions to Support IP Version 6](https://www.rfc-editor.org/rfc/rfc3596) (lida em 2026-10-04): AAAA e a forma em nibbles do IP6.ARPA
- [RFC 6891: Extension Mechanisms for DNS (EDNS(0))](https://www.rfc-editor.org/rfc/rfc6891) (lida em 2026-10-04): o registro OPT, as regras de tamanho de carga, 4096 como ponto de partida
- [RFC 3225: Indicating Resolver Support of DNSSEC](https://www.rfc-editor.org/rfc/rfc3225) (lida em 2026-10-04): o bit DO
- [RFC 4034](https://www.rfc-editor.org/rfc/rfc4034) e [RFC 4035](https://www.rfc-editor.org/rfc/rfc4035) (lidas em 2026-10-04): os tipos de registro do DNSSEC; os bits CD e AD
- [RFC 5936: DNS Zone Transfer Protocol (AXFR)](https://www.rfc-editor.org/rfc/rfc5936) e [RFC 1995: Incremental Zone Transfer in DNS](https://www.rfc-editor.org/rfc/rfc1995) (lidas em 2026-10-04)
- [RFC 8482: Providing Minimal-Sized Responses to DNS Queries That Have QTYPE=ANY](https://www.rfc-editor.org/rfc/rfc8482) (lida em 2026-10-04)
- [RFC 7858: DNS over TLS](https://www.rfc-editor.org/rfc/rfc7858) e [RFC 8484: DNS Queries over HTTPS](https://www.rfc-editor.org/rfc/rfc8484) (lidas em 2026-10-04)
- [RFC 5001: NSID](https://www.rfc-editor.org/rfc/rfc5001), [RFC 7871: Client Subnet in DNS Queries](https://www.rfc-editor.org/rfc/rfc7871), [RFC 7873: DNS Cookies](https://www.rfc-editor.org/rfc/rfc7873) (lidas em 2026-10-04)
- [IANA: Domain Name System (DNS) Parameters](https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml) (lido em 2026-10-04): o registro de RR TYPEs que o campo de tipo aceita, e os códigos de opção do EDNS
- [DNS Flag Day 2020](https://www.dnsflagday.net/2020/) (lido em 2026-10-04): 1232 bytes como o tamanho mínimo seguro de buffer EDNS
- [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737) e [RFC 3849](https://www.rfc-editor.org/rfc/rfc3849) (lidas em 2026-10-04): as faixas de endereços de documentação usadas nos exemplos (192.0.2.0/24, 2001:db8::/32)
