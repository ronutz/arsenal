## O que faz

Cole um bloco ltm pool e a ferramenta explica o método de balanceamento nos termos da própria F5: o que o método pondera, como se comporta, quando o fabricante recomenda escolhê-lo e as arestas que merecem atenção. Em seguida cruza o método com o resto do pool e sinaliza as combinações que se comportam mal em silêncio, como pesos de ratio sob um modo que os ignora ou um modo weighted sem os connection limits de que precisa. Você também pode digitar o nome de um método para a explicação completa, a palavra "methods" para o catálogo inteiro, ou responder duas perguntas no painel de escolha para uma recomendação com fontes. Tudo roda no seu navegador e não contata nenhum equipamento.

## Estático e dinâmico, member e node

Os 19 modos documentados se dividem em dois eixos. Modos estáticos, Round Robin e Ratio, decidem apenas pela configuração e nunca percebem o estado dos servidores. Modos dinâmicos reagem a algo medido: conexões abertas, sessões, velocidade de resposta ou métricas alimentadas por monitores. O segundo eixo é o sufixo de escopo. Um modo member conta o trabalho do servidor apenas dentro deste pool; um modo node conta através de todos os pools a que o servidor pertence, que é a contagem justa quando as mesmas máquinas servem vários pools.

## O que cada família pondera

Round Robin não pondera nada além de quem é a vez, e é o padrão. Ratio segue uma proporção que você declara. Least Connections escolhe quem tem menos conexões abertas naquele exato momento, o que absorve durações desiguais de conexão. Observed suaviza essa contagem instantânea em um ratio por segundo, e Predictive adiciona a tendência, preferindo members que estão melhorando. Weighted Least Connections lê o connection-limit de cada member como sua capacidade e balanceia por percentual dele. Ratio Least Connections combina o ratio declarado com a contagem ao vivo. Dynamic Ratio tira a proporção das suas mãos e a recalcula continuamente a partir de medições dos servidores. Least Sessions e Ratio (session) contam sessões de persistência em vez de conexões, e Fastest segue a velocidade de resposta, rastreada como requisições Layer 7 pendentes.

## As verificações cruzadas

As observações são leituras determinísticas da configuração colada contra regras documentadas. Ratios de member sob um modo que não é de ratio são sinalizados porque, pelo K6406, ratios só se aplicam sob um método de ratio. Weighted Least Connections (member) com um member deixado no connection-limit padrão 0 é sinalizado porque a referência exige um limite em todos os members. Um pool least-connections recebe a nota de slow ramp, já que a referência destaca exatamente esse par e o padrão é 10 segundos. Least Sessions expõe seu pré-requisito no virtual server, um perfil de persistência que rastreie sessões. ignore-persisted-weight é explicado quando se aplica e sinalizado quando o modo está fora do escopo documentado. Priority groups são lidos junto com min-active-members, a configuração que de fato arma a ativação por prioridade.

## O painel de escolha

Duas perguntas alimentam uma tabela de decisão fixa: como as capacidades dos members diferem (iguais, declaradas como ratio, quantificadas como connection limits, ou medidas para você) e ao que o método deve reagir (nada, conexões ao vivo, a tendência, sessões, ou velocidade de resposta). Mesmas respostas, mesma recomendação, sempre, com o raciocínio e os pré-requisitos declarados. A tabela codifica a orientação do próprio fabricante no K42275060, não opinião.

## Fontes

Os 19 tokens, suas descrições e as opções de pool vêm da referência tmsh de ltm pool. A orientação de quando usar e o pré-requisito do least-sessions vêm do K42275060. A mecânica dos modos dinâmicos, a exclusão do OneConnect e a regra de que ratios exigem um método de ratio vêm do K6406.
