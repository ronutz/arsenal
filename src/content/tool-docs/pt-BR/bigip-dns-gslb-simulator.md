## O que faz

Modela o balanceamento global de carga (GSLB) do BIG-IP DNS (antigo GTM), que tem dois níveis: um wide IP primeiro seleciona um pool e depois o pool seleciona um servidor virtual. Configure seus pools - cada um com um ratio, uma etiqueta de região, um estado ativo/inativo e um método de seleção de membro - e seus membros, e então defina o método de pool do wide IP, uma região de cliente e uma contagem de requisições N. A ferramenta calcula como as próximas N requisições de resolução de nome DNS são resolvidas: primeiro a distribuição por pool, depois a distribuição por membro dentro de cada pool.

## O que simula, e o que não simula

Determinístico nos dois níveis: Round Robin (circular e uniforme), Ratio (ponderado, por maior resto), Global Availability (todas as requisições para o primeiro recurso disponível na ordem da lista, os demais como reserva) e Topology (vence o recurso cuja região casa com a do cliente, com a maior pontuação; empates dentro da pontuação vencedora vão para round-robin). Um pool ou membro inativo não recebe nada, e o tráfego se redistribui entre os que estão ativos.

Os métodos dinâmicos - Quality of Service, Completion Rate, Round-Trip Time, Fewest Hops, Kilobytes/Segundo, Packet Rate, Virtual Server Score, Least Connections, CPU - dependem de métricas de desempenho ao vivo que os agentes big3d coletam de cada data center. Essas não podem ser reproduzidas offline, então a ferramenta declara isso com franqueza em vez de inventar uma distribuição. É a mesma regra de honestidade que o simulador de LTM segue para seus métodos dinâmicos.

## Por que os dois níveis importam

A confusão mais comum em GSLB é tratar a seleção de pool e a seleção de membro como uma única decisão. Elas são separadas, e cada uma pode usar um método diferente: um wide IP pode escolher pools por Topology (enviar clientes europeus ao pool da UE) enquanto cada pool escolhe um servidor virtual por Ratio (dar mais peso ao site maior). A ferramenta torna essa separação visível - você vê qual pool respondeu e depois qual servidor virtual dentro dele resolveu - de modo que a interação entre os dois níveis fica concreta em vez de abstrata.
