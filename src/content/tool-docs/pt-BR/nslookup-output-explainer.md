## O que faz

Cole a saída de um comando `nslookup` e a ferramenta a decodifica em um detalhamento estruturado e explicado: qual resolver respondeu, se a resposta foi autoritativa, cada registro com seus campos discriminados e qualquer falha reportada. Ela analisa apenas o texto; nada é resolvido e nada é enviado a lugar algum.

## Como ler o layout do nslookup

O `nslookup` imprime as respostas DNS em um layout solto, em forma de prosa, bem diferente do `dig`, e esse layout carrega um significado que vale explicitar. Toda resposta começa com um header **Server** e **Address** que nomeia o resolver consultado. Uma linha com **Non-authoritative answer:** indica que o bit AA estava desligado: a resposta veio de um resolver, e não de um servidor autoritativo para o nome. A RFC 1035 (seção 4.1.1) e a RFC 2181 (seção 6) definem autoridade pelo nome, não pelo cache, então a linha não diz se o resolver respondeu do cache ou buscou a resposta para você; os dois casos aparecem iguais. Sua ausência, em uma consulta direta, implica uma resposta autoritativa. Quando uma consulta falha, o nslookup imprime uma linha como `** server can't find NAME: NXDOMAIN`, e a ferramenta destaca essa falha e o que o status significa.

## Registros e seus campos

Para a maioria dos tipos de registro, o nslookup imprime uma linha simples `nome = valor`, mas alguns empacotam vários campos em uma linha ou bloco, e são esses os que valem a pena decodificar:

- Registros **MX** aparecem como `mail exchanger = 10 mail.example.com`, em que o número é a preferência (menor é preferido) e o nome é o host de e-mail. A ferramenta separa os dois.
- Registros **SRV** (RFC 2782) carregam prioridade, peso, porta e alvo em uma linha; a ferramenta os divide para você ver qual host de serviço e porta eles indicam.
- Registros **SOA** ocupam várias linhas: o servidor de nomes primário da zona, a caixa postal do responsável, e o serial e os temporizadores (refresh, retry, expire, minimum). A ferramenta organiza esses campos.

## Como usar

Cole uma resposta do `nslookup` e leia o resolver, o status de autoridade, cada registro com seus campos e qualquer erro. A análise é determinística e inteiramente local; a ferramenta nunca faz uma consulta própria, o que também a torna uma forma segura de ler uma saída capturada em outro lugar.

## Exemplos

O botão de exemplo e os testes da ferramenta usam saída real do `nslookup` do BIND 9.20.29, capturada em 2026-10-19 por um relay local que enviou cada consulta a um resolver público por DNS over HTTPS; por isso a linha Server mostra o endereço do relay, `127.0.0.1#5311`. O exemplo de falha consulta `nonexistent.invalid`: a RFC 6761, seção 6.4, permite supor que consultas a nomes sob `.invalid` sempre retornam NXDOMAIN, enquanto o `example.com` hoje responde NOERROR sem dados para nomes que não existem (a negação compacta da RFC 9824).

## Fontes

- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (lida em 2026-10-19): o bit AA, seção 4.1.1
- [RFC 2181: Clarifications to the DNS Specification](https://www.rfc-editor.org/rfc/rfc2181) (lida em 2026-10-19): autoridade de zona, seção 6
- [RFC 2308: Negative Caching of DNS Queries](https://www.rfc-editor.org/rfc/rfc2308) (lida em 2026-10-19): NXDOMAIN, NODATA e o minimum do SOA
- [RFC 2782: A DNS RR for specifying the location of services (DNS SRV)](https://www.rfc-editor.org/rfc/rfc2782) (lida em 2026-10-19): os campos do SRV
- [RFC 9499: DNS Terminology](https://www.rfc-editor.org/rfc/rfc9499) (março de 2024, torna obsoleta a RFC 8499; lida em 2026-10-19): servidor autoritativo e resolver
- [RFC 6761: Special-Use Domain Names](https://www.rfc-editor.org/rfc/rfc6761) (lida em 2026-10-19): seção 6.4, nomes sob `.invalid`
- [RFC 9824: Compact Denial of Existence in DNSSEC](https://www.rfc-editor.org/rfc/rfc9824) (lida em 2026-10-19): NOERROR sem dados para um nome que não existe
- [RFC 7505: A "Null MX" No Service Resource Record for Domains That Accept No Mail](https://www.rfc-editor.org/rfc/rfc7505) (lida em 2026-10-19): o exemplo de MX, preferência 0 e exchange `.`
