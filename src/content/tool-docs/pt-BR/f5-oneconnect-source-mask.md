# Explicador de source-mask do OneConnect

O OneConnect mantém conexões do lado servidor vivas e as entrega à próxima requisição elegível, e a palavra que faz todo o trabalho nessa frase é elegível. A source mask decide a elegibilidade, e a man page declara seus dois polos com clareza: 0.0.0.0, o padrão, compartilha conexões reusadas entre todos os clientes; uma máscara de host compartilha apenas entre conexões do mesmo IP de cliente. Tudo no meio se comporta como uma máscara de sub-rede, agrupando clientes pelos bits que mantém.

Cole um stanza `ltm profile one-connect` e cada opção é renderizada com a semântica da própria referência v17, com os padrões preenchidos explicitamente em vez de presumidos: max-age 86400, max-reuse 1000, max-size 10000, limit-type none. O limite strict carrega o alerta do próprio manual, de que conexões ociosas bloquearão novas até expirarem mesmo quando poderiam ter sido reusadas, uma configuração que a própria página chama de não recomendada fora de casos especiais. share-pools recebe sua semântica entre virtuais; a opção idle-timeout-override recebe uma sinalização honesta da peculiaridade da própria man page, declarada como disabled ou enabled mas descrita como um número de segundos.

A simulação é o destaque. Dê a ela uma máscara, uma lista de IPs de clientes e, opcionalmente, um endereço SNAT, e os grupos de reuso são renderizados. Com o SNAT presente você assiste à ordem que tanto o K7208 quanto o K5911 declaram fazer seu trabalho: a tradução acontece primeiro, a máscara se aplica ao endereço traduzido, então um único endereço SNAT colapsa todos os clientes em um só grupo de reuso, não importa quão estreita seja a máscara. Esse colapso é a surpresa de produção que esta ferramenta existe para tornar visível antes que aconteça com você.

Duas doses de honestidade estatística do próprio artigo de laboratório da F5 fecham a auditoria: max-size se divide entre instâncias de TMM em vez de formar um pool global, e o contador Current Idle inclui toda conexão ociosa do lado servidor, seja ou não elegível pela máscara. Leia a saída do `tmsh show` com as duas em mente.

Tudo roda localmente; nada do que você cola sai da página.
