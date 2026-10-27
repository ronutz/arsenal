## O que faz

Cole a saída de um comando `dig` e a ferramenta reconstrói a mensagem DNS que ela representa, seção por seção, e explica cada parte. Ela lê o header, a linha de flags e as contagens de seção, a pseudo-seção OPT do EDNS, as quatro seções de registros com cada resource record dividido em seus campos, e as estatísticas finais da consulta. Ela analisa apenas o texto: nada é resolvido e nada é enviado a lugar algum.

## Por que a saída do dig precisa ser decodificada

O `dig` imprime uma representação fiel, mas concisa, de uma mensagem DNS, e muito significado fica compactado em tokens curtos. O **header** carrega a operação, um código de status e um id de mensagem; a linha de **flags** carrega flags de uma palavra cuja presença ou ausência muda tudo. `aa` significa que a resposta é autoritativa, vinda de um servidor responsável pela zona e não de um cache; `rd` significa que a recursão foi desejada e `ra` que ela está disponível; `ad` marca dados validados por DNSSEC; `tc` significa que a resposta foi truncada e deve ser repetida por TCP. O código de status é a outra coisa a ler primeiro: `NOERROR`, `NXDOMAIN` para um nome que não existe, ou `SERVFAIL` para uma falha no servidor.

## As seções e o EDNS

Uma mensagem DNS tem quatro seções, e o dig as rotula: **QUESTION** (o que foi perguntado), **ANSWER** (os registros que respondem), **AUTHORITY** (os servidores de nomes responsáveis) e **ADDITIONAL** (registros extras úteis). A ferramenta divide cada resource record em suas partes: o nome, o TTL em segundos (convertido quando o dig imprimiu unidades), a classe (quase sempre `IN`), o tipo (`A`, `AAAA`, `MX` e assim por diante) e os dados do registro. Ela também decodifica a **pseudo-seção OPT**, a extensão EDNS(0) (RFC 6891) que anuncia coisas como a maior resposta UDP que o resolver aceita e o suporte a DNSSEC, e que não é um registro real, mas metadados sobre a troca.

## As estatísticas

O rodapé que o dig imprime é realmente útil para diagnóstico: o tempo de consulta diz quanto o resolver levou, a linha do servidor diz qual resolver respondeu, e o tamanho da mensagem e o horário completam. Ler isso em conjunto muitas vezes explica uma consulta lenta ou surpreendente mais rápido do que os próprios registros.

## Como usar

Cole uma resposta completa do `dig` e leia o header, as flags, as seções e as estatísticas decodificadas. A análise é determinística e inteiramente local; a ferramenta nunca faz uma consulta própria.

## Layouts que ela lê

Além do layout padrão, o parser lê os formatos que as opções de saída do dig produzem, cada um fixado por um teste com saída real do dig 9.20.29:

- `+ttlunits`: TTLs impressos em unidades (`1h30m`, `1d`, `2w`, `4m16s`; o manual lista s, m, h, d e w) são convertidos para segundos e mostrados das duas formas, por exemplo `1h30m = 5400s`.
- `+nottlid`: registros impressos sem a coluna de TTL continuam sendo lidos, com o TTL marcado como ausente.
- `+multiline`: registros quebrados entre parênteses em várias linhas, com comentários `;`, são unidos de volta em uma linha, então um SOA continua dividido em seus sete campos.
- Opcode 6 e RCODE 11: o dig 9.20 não tem nome para eles e imprime `RESERVED6` e `RESERVED11`. A IANA os atribuiu a DNS Stateful Operations (DSO) e a DSOTYPENI (RFC 8490), e a ferramenta mostra os dois nomes.

Para uma resposta negativa (NXDOMAIN, ou NOERROR com a seção de resposta vazia) que traz o SOA da zona, a ferramenta também calcula o TTL de cache negativo. A RFC 2308, seção 5, diz que o servidor autoritativo define o TTL do SOA como o menor valor entre o TTL do próprio SOA e o seu campo MINIMUM, e o cache faz a contagem regressiva a partir daí.

## Exemplos

O botão de exemplo e os testes usam saída real do dig 9.20.29 capturada em 2026-10-19, a maior parte por um relay local que enviou cada consulta a um resolver público por DNS over HTTPS (a linha SERVER mostra o relay, `127.0.0.1`), o restante contra um servidor de laboratório local com uma cópia do `example.com` com endereços de documentação, além de um responder de laboratório feito para devolver RCODE 11. Nomes que não existem ficam sob `.invalid`: a RFC 6761, seção 6.4, permite supor que eles sempre retornam NXDOMAIN, enquanto o `example.com` hoje responde NOERROR sem dados para nomes que não existem (a negação compacta da RFC 9824).

## Compartilhar resultado

No topo da leitura, **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a saída do dig como foi colada (`#input=...`), e mais nada. Antes de você copiar qualquer coisa, o popover acrescenta um alerta: a saída do dig pode trazer nomes de hosts internos, endereços e o resolver consultado, então leia antes de mandar o link. Tudo o que o link leva vai depois do `#`, e a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado): o navegador não o envia ao servidor quando o link é aberto, mas ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** Um link leva no máximo 16.384 caracteres, o limite que o site usa para todo valor depois do `#`; um maior não ganha link, e o popover diz quanto ele teria.
- **Ao abrir um link.** O texto preenche a caixa como se tivesse sido colado, e a página o explica de novo; nada é resolvido nem enviado. Um texto que não é saída do dig recebe o aviso da própria página. Aceitos ou não, os valores saem do endereço da própria página na hora, sem nenhuma requisição, então recarregar, salvar nos favoritos ou usar o botão Compartilhar da própria página não leva nada que você não escolheu compartilhar.

## API

O mesmo motor responde à operação `/api/v1/dig-output-explainer` da API HTTP do site, descrita campo a campo no contrato OpenAPI da [página da API](/api), com exemplos tirados dos vetores de ouro. O contrato também diz se este site serve a API.

- **Requisição.** A saída do dig como texto, com quebras de linha e tabs.
- **Resposta.** `versionLine`, `digVersion`, `queryArgs`, `header` (`opcode`, `status` e `id` como impressos, mais `opcodeName` ou `statusName` quando o dig imprime RESERVED6 ou RESERVED11), `flags` com as quatro contagens de seção, `opt`, `sections` (cada registro com `name`, `ttl` em segundos ou `null`, `ttlText` quando o dig imprimiu o TTL em unidades, `class`, `type`, `rdata` e `isQuestion`), `footer`, `negative` (`owner`, `soaTtl`, `minimum` e `ttl`) para uma resposta negativa com SOA na AUTHORITY, `warnings` (códigos estáveis) e `hadHeader`.
- **Erros.** Um texto que não é saída do dig não é erro HTTP: `hadHeader` vem `false`.

`ttlText`, `negative`, `opcodeName`, `statusName` e os avisos `ttl-units` e `ttl-absent` entraram em 2026-10-19; um TTL impresso como `1d` agora responde `ttl` 86400, onde antes era lido como 1.

## Fontes

- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (lida em 2026-10-19): o formato da mensagem e as flags do header
- [RFC 6891: Extension Mechanisms for DNS (EDNS(0))](https://www.rfc-editor.org/rfc/rfc6891) (lida em 2026-10-19): a pseudo-seção OPT
- [RFC 2308: Negative Caching of DNS Queries](https://www.rfc-editor.org/rfc/rfc2308) (lida em 2026-10-19): seção 5, o TTL de cache negativo
- [RFC 4034: Resource Records for the DNS Security Extensions](https://www.rfc-editor.org/rfc/rfc4034) (lida em 2026-10-19): RRSIG, DNSKEY, DS, NSEC
- [RFC 9499: DNS Terminology](https://www.rfc-editor.org/rfc/rfc9499) (março de 2024, torna obsoleta a RFC 8499; lida em 2026-10-19)
- [RFC 8490: DNS Stateful Operations](https://www.rfc-editor.org/rfc/rfc8490) (lida em 2026-10-19): seções 10.1 e 10.2, opcode 6 (DSO) e RCODE 11 (DSOTYPENI)
- [RFC 6761: Special-Use Domain Names](https://www.rfc-editor.org/rfc/rfc6761) (lida em 2026-10-19): seção 6.4, nomes sob `.invalid`
- [RFC 9824: Compact Denial of Existence in DNSSEC](https://www.rfc-editor.org/rfc/rfc9824) (lida em 2026-10-19): NOERROR sem dados para um nome que não existe
- [ISC, BIND 9 9.20.29 documentation, Manual Pages: dig](https://bind9.readthedocs.io/en/stable/manpages.html) (lido em 2026-10-19): `+ttlunits`, `+ttlid`, `+multiline`, `+opcode`
- [BIND 9 source at tag v9.20.29, bin/dig/dig.c](https://github.com/isc-projects/bind9/blob/v9.20.29/bin/dig/dig.c) (lido em 2026-10-19): os nomes de opcode que o dig imprime, `RESERVED6` entre eles; `RESERVED11` vem de lib/dns/rcode.c
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lida em 2026-10-27): seção 3.5, o fragmento, que leva os valores de um link de Compartilhar resultado
