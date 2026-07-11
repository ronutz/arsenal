## O que faz

Esta ferramenta decodifica o bloco de rotas de um HTTP load balancer do F5 Distributed Cloud (XC). Cole o objeto `http_loadbalancer` completo da visão JSON do Console, apenas seu array `routes`, ou um envelope de create/get da API, e a ferramenta percorre cada rota em ordem e a explica: o tipo de rota (simple, redirect, direct-response ou custom), as condições de match (método HTTP, path como prefix / exato / regex, e quaisquer condições de header ou query-parameter), a ação (qual origin pool com qual peso, ou o destino do redirect, ou o código do direct-response), qualquer rewrite de path e mutações de header de request/response, o override de host-rewrite, e a atribuição de WAF por rota. Ela também simula avaliação first-match - dê a ela um método e um path, e ela diz qual rota venceria. Tudo roda no seu navegador.

## Por que a ordem importa

O XC avalia rotas na ordem em que aparecem, e a primeira rota que der match vence - o mesmo modelo first-match que o Envoy usa por baixo. A própria orientação da F5 torna isso concreto: quando você quer que uma rota tenha prioridade, você a arrasta para o topo da lista. É por isso que a ferramenta numera as rotas em ordem, declara a regra first-match logo de início, e avisa quando uma rota catch-all (prefix `/` ou regex `.*` sem condições de header) fica acima de rotas mais específicas, porque essas rotas posteriores nunca podem ser alcançadas.

## O WAF por rota

Um load balancer tem uma política de WAF na sua base, mas qualquer rota simple pode sobrescrevê-la. Em Advanced Options uma rota pode anexar seu próprio App Firewall, ou desabilitar o WAF por completo, ou deixá-lo herdar a política do load balancer - que é o padrão. A ferramenta mostra o modo de WAF de cada rota explicitamente e sinaliza rotas que desabilitam o WAF, porque uma rota desprotegida é fácil de criar por acidente e difícil de perceber em JSON puro.

## Os quatro tipos de rota

Uma rota simple encaminha o tráfego que der match para um origin pool. Uma rota redirect retorna um 3xx para um novo protocolo, host e path. Uma rota direct-response retorna um código de status e um body fixos sem tocar em um origin - os próprios exemplos da F5 usam isso para servir páginas ou scripts pequenos. Um objeto de rota custom referencia uma rota definida separadamente, então seu match e ação vivem naquele objeto referenciado; a ferramenta mostra a referência e nota que os detalhes são externos, e o simulador first-match sinaliza que tal rota poderia dar match antes daquela que ele escolheu.
