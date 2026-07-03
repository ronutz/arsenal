# Explicador do fluxo de decisão GSLB

Cole estrofes `gtm wideip` e `gtm pool` (como `tmsh list gtm wideip a <nome>` e `tmsh list gtm pool a <nome>` as imprimem) e a decisão em duas camadas do BIG-IP DNS é renderizada como realmente executa.

A camada wide-IP mostra o método de seleção de pool (`pool-lb-mode`, padrão round-robin) com os pools anexados, seus valores de order e ratio, e as configurações do wide IP que moldam as respostas: persistence, last-resort-pool, comportamento de failure-rcode e a verbosidade do log de decisão que permite assistir esse mesmo fluxo nos logs.

A camada de pool renderiza a cadeia de três passos: preferred (`load-balancing-mode`), alternate (`alternate-mode`), fallback (`fallback-mode`), cada passo carregando a semântica do fabricante para a camada e o método. Os padrões são aplicados e rotulados quando um atributo está ausente: round-robin, round-robin, return-to-dns.

Abaixo, observações determinísticas verificam a configuração contra a gramática documentada e as regras do manual de Load Balancing: métodos fora da lista de tokens admitidos por camada, a propriedade ignora-disponibilidade da camada de fallback declarada em toda cadeia resolvida, a fiação do Fallback IP (o método sem endereço, ou um endereço que nenhuma camada usa), o escopo do dynamic-ratio, coeficientes de QoS zerados, ratios de membros que nenhuma camada consome, a regra de pareamento do Global Availability e o aviso de topologia-nas-duas-camadas que pede o fallback de cada pool em None.

Um nome de método explica aquele método, incluindo quais camadas o admitem e de onde vem seu sinal de decisão (sondagem do caminho LDNS, estatísticas do servidor, ou nenhum). A palavra `methods` lista os dois catálogos.

Tudo roda localmente; nada do que você cola sai da página.
