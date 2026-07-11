## O que faz

Esta ferramenta simula como um pool do BIG-IP LTM distribui tráfego. Você configura os membros do pool - cada um com um member ratio, um node e um node ratio, um priority group, e uma contagem de registros de persistência existentes - então escolhe um método de balanceamento de carga e uma quantidade de requisições N, e ela mostra para onde as próximas N conexões vão como uma distribuição por membro. Roda inteiramente no seu navegador, e é determinística: as mesmas entradas sempre produzem a mesma resposta.

## Os métodos que ela simula

Ela simula os métodos estáticos e baseados em conexão ou sessão, porque o resultado deles é determinado pela configuração e pela carga que você fornece. O Round Robin envia cada requisição para o próximo membro na sequência. O Ratio (member) distribui em proporção ao ratio de cada membro; o Ratio (node) faz o mesmo por node, dividindo a parcela de um node entre seus membros. O Least Connections (member e node) envia cada nova conexão para o membro menos carregado; o Weighted Least Connections pondera isso pelo ratio. O Least Sessions envia para o membro com o menor número de registros de persistência - que é exatamente a contagem de registros de persistência que você insere por membro.

## Priority groups

O priority group activation decide quais membros são elegíveis. Cada membro tem uma prioridade; o tráfego vai primeiro para o priority group de maior prioridade, e um grupo mais baixo só é ativado quando o número de membros disponíveis no conjunto ativo cai abaixo do limite que você define (0 desabilita o recurso). A ferramenta aplica isso e marca cada membro como ativo ou em standby, para que você possa ver um grupo mais baixo parado ocioso até o mais alto ficar mais fino.

## O que ela não simula, e por quê

Fastest, Observed, Predictive, e Dynamic Ratio são métodos dinâmicos que decidem com base em métricas de runtime ao vivo - tempo de resposta, contagens de conexão por segundo, tendências de desempenho, dados de SNMP. Esses valores não fazem parte da configuração de um pool e mudam continuamente, então não há forma honesta de computar uma distribuição fixa para eles a partir de entradas estáticas. A ferramenta os oferece na lista mas, quando selecionados, explica por que não pode simulá-los em vez de inventar números. Mais duas notas de honestidade: o Least Connections é modelado a partir de uma tabela de conexões limpa porque a ferramenta não recebe contagem de conexões atuais, então começa uniforme; e o Least Sessions assume persistência por source-address ou sessão, já que a persistência baseada em cookie faz o BIG-IP voltar para Round Robin.
