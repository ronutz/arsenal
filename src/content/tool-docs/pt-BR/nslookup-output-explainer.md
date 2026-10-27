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

## Compartilhar resultado

No topo da leitura, **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a saída do nslookup como foi colada (`#input=...`), e mais nada. Antes de você copiar qualquer coisa, o popover acrescenta um alerta: a saída do nslookup pode trazer nomes de hosts internos, endereços e o servidor consultado, então leia antes de mandar o link. Tudo o que o link leva vai depois do `#`, e a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado): o navegador não o envia ao servidor quando o link é aberto, mas ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** Um link leva no máximo 16.384 caracteres, o limite que o site usa para todo valor depois do `#`; um maior não ganha link, e o popover diz quanto ele teria.
- **Ao abrir um link.** O texto preenche a caixa como se tivesse sido colado, e a página o explica de novo; nada é resolvido nem enviado. Um texto que não é saída do nslookup recebe o aviso da própria página. Aceitos ou não, os valores saem do endereço da própria página na hora, sem nenhuma requisição, então recarregar, salvar nos favoritos ou usar o botão Compartilhar da própria página não leva nada que você não escolheu compartilhar.

## API

O mesmo motor responde à operação `/api/v1/nslookup-output-explainer` da API HTTP do site, descrita campo a campo no contrato OpenAPI da [página da API](/api), com exemplos tirados dos vetores de ouro. O contrato também diz se este site serve a API.

- **Requisição.** A saída do nslookup como texto, com quebras de linha e tabs.
- **Resposta.** `server` (`server` e `address`), `authority` (`authoritative`, `non-authoritative` ou `unknown`), `records` (`name`, `type`, `value` e, para MX, SRV e SOA, `fields`), `errors` (`name` e `code`), `referralNote`, `warnings` (códigos estáveis) e `recognized`.
- **Erros.** Um texto que não é saída do nslookup não é erro HTTP: `recognized` vem `false`.

A resposta não mudou em 2026-10-19; os exemplos foram trocados por capturas feitas nesse dia.

## Fontes

- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (lida em 2026-10-19): o bit AA, seção 4.1.1
- [RFC 2181: Clarifications to the DNS Specification](https://www.rfc-editor.org/rfc/rfc2181) (lida em 2026-10-19): autoridade de zona, seção 6
- [RFC 2308: Negative Caching of DNS Queries](https://www.rfc-editor.org/rfc/rfc2308) (lida em 2026-10-19): NXDOMAIN, NODATA e o minimum do SOA
- [RFC 2782: A DNS RR for specifying the location of services (DNS SRV)](https://www.rfc-editor.org/rfc/rfc2782) (lida em 2026-10-19): os campos do SRV
- [RFC 9499: DNS Terminology](https://www.rfc-editor.org/rfc/rfc9499) (março de 2024, torna obsoleta a RFC 8499; lida em 2026-10-19): servidor autoritativo e resolver
- [RFC 6761: Special-Use Domain Names](https://www.rfc-editor.org/rfc/rfc6761) (lida em 2026-10-19): seção 6.4, nomes sob `.invalid`
- [RFC 9824: Compact Denial of Existence in DNSSEC](https://www.rfc-editor.org/rfc/rfc9824) (lida em 2026-10-19): NOERROR sem dados para um nome que não existe
- [RFC 7505: A "Null MX" No Service Resource Record for Domains That Accept No Mail](https://www.rfc-editor.org/rfc/rfc7505) (lida em 2026-10-19): o exemplo de MX, preferência 0 e exchange `.`
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lida em 2026-10-27): seção 3.5, o fragmento, que leva os valores de um link de Compartilhar resultado
