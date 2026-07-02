## O que faz

Cole a saída de um comando `dig` e a ferramenta reconstrói a mensagem DNS que ela representa, seção por seção, e explica cada parte. Ela lê o cabeçalho, a linha de flags e as contagens de seção, a pseudo-seção OPT do EDNS, as quatro seções de registros com cada resource record dividido em seus campos, e as estatísticas finais da consulta. Ela analisa apenas o texto: nada é resolvido e nada é enviado a lugar algum.

## Por que a saída do dig precisa ser decodificada

O `dig` imprime uma representação fiel, mas concisa, de uma mensagem DNS, e muito significado fica compactado em tokens curtos. O **cabeçalho** carrega a operação, um código de status e um id de mensagem; a linha de **flags** carrega flags de uma palavra cuja presença ou ausência muda tudo. `aa` significa que a resposta é autoritativa, vinda de um servidor responsável pela zona e não de um cache; `rd` significa que a recursão foi desejada e `ra` que ela está disponível; `ad` marca dados validados por DNSSEC; `tc` significa que a resposta foi truncada e deve ser repetida por TCP. O código de status é a outra coisa a ler primeiro: `NOERROR`, `NXDOMAIN` para um nome que não existe, ou `SERVFAIL` para uma falha no servidor.

## As seções e o EDNS

Uma mensagem DNS tem quatro seções, e o dig as rotula: **QUESTION** (o que foi perguntado), **ANSWER** (os registros que respondem), **AUTHORITY** (os servidores de nomes responsáveis) e **ADDITIONAL** (registros extras úteis). A ferramenta divide cada resource record em suas partes: o nome, o TTL em segundos, a classe (quase sempre `IN`), o tipo (`A`, `AAAA`, `MX` e assim por diante) e os dados do registro. Ela também decodifica a **pseudo-seção OPT**, a extensão EDNS(0) (RFC 6891) que anuncia coisas como a maior resposta UDP que o resolvedor aceita e o suporte a DNSSEC, e que não é um registro real, mas metadados sobre a troca.

## As estatísticas

O rodapé que o dig imprime é realmente útil para diagnóstico: o tempo de consulta diz quanto o resolvedor levou, a linha do servidor diz qual resolvedor respondeu, e o tamanho da mensagem e o horário completam. Ler isso em conjunto muitas vezes explica uma consulta lenta ou surpreendente mais rápido do que os próprios registros.

## Como usar

Cole uma resposta completa do `dig` e leia o cabeçalho, as flags, as seções e as estatísticas decodificadas. A análise é determinística e inteiramente local; a ferramenta nunca faz uma consulta própria.
