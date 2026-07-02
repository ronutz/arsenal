## O que faz

Cole a saída de um comando `nslookup` e a ferramenta a decodifica em um detalhamento estruturado e explicado: qual resolvedor respondeu, se a resposta foi autoritativa, cada registro com seus campos discriminados e qualquer falha reportada. Ela analisa apenas o texto; nada é resolvido e nada é enviado a lugar algum.

## Lendo o layout do nslookup

O `nslookup` imprime as respostas DNS em um layout solto, em forma de prosa, bem diferente do `dig`, e esse layout carrega um significado que vale explicitar. Toda resposta começa com um cabeçalho **Server** e **Address** que nomeia o resolvedor consultado. Uma linha com **Non-authoritative answer:** indica que a resposta veio de um cache, e não de um servidor responsável pela zona; sua ausência, em uma consulta direta, implica uma resposta autoritativa. Quando uma consulta falha, o nslookup imprime uma linha como `** server can't find NAME: NXDOMAIN`, e a ferramenta destaca essa falha e o que o status significa.

## Registros e seus campos

Para a maioria dos tipos de registro, o nslookup imprime uma linha simples `nome = valor`, mas alguns empacotam vários campos em uma linha ou bloco, e são esses os que valem a pena decodificar:

- Registros **MX** aparecem como `mail exchanger = 10 mail.example.com`, em que o número é a preferência (menor é preferido) e o nome é o host de e-mail. A ferramenta separa os dois.
- Registros **SRV** (RFC 2782) carregam prioridade, peso, porta e alvo em uma linha; a ferramenta os divide para você ver qual host de serviço e porta eles indicam.
- Registros **SOA** ocupam várias linhas: o servidor de nomes primário da zona, a caixa postal do responsável, e o serial e os temporizadores (refresh, retry, expire, minimum). A ferramenta organiza esses campos.

## Como usar

Cole uma resposta do `nslookup` e leia o resolvedor, o status de autoridade, cada registro com seus campos e qualquer erro. A análise é determinística e inteiramente local; a ferramenta nunca faz uma consulta própria, o que também a torna uma forma segura de ler uma saída capturada em outro lugar.
