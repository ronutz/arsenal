## O que esta ferramenta faz

Cole uma política de controle de acesso da Check Point numa gramática didática enxuta - uma ou mais declarações `layer`, suas regras, e uma linha `test` - e o avaliador percorre a conexão pelas camadas à sua frente. Cada passo nomeia a regra que casou, diz o que esse casamento de fato significou, e sinaliza os descartes que não registram nada. A saída é um rastro, e não um veredito, porque o veredito sozinho não ensina nada: a questão é ver uma conexão ser aceita por uma camada e descartada pela seguinte.

## A frase que ela existe para ensinar

**Camadas ordenadas são um E, e não um OU.** Aceitar numa camada significa que a conexão *segue para a próxima camada*; ela só é permitida quando a última camada ordenada a aceita. Um descarte em qualquer camada encerra a avaliação de imediato, então uma permissão numa camada inicial não salva tráfego que uma camada posterior recusa - a exceção pertence à camada que de outro modo negaria. Esse é o comportamento que quem chega de FortiGate, BIG-IP ou de uma cadeia iptables mais confiavelmente erra, e é a razão de o rastro mostrar "aceita, segue para a próxima camada" em vez de um sinal de visto.

## A gramática

Camadas: `layer Network ordered` ou `layer DMZ inline`. Regras: `1 | permit internal | accept | src=10.0.0.0/8 dst=any svc=443`, com ações `accept`, `drop`, ou `inline:<camada>` para controlar uma subpolítica. Acrescente `nolog` para modelar uma regra com Track em None. O que for omitido significa Any. Uma linha `test src=... dst=... svc=...` fornece a conexão. Linhas iniciadas por `#` são comentários.

## O que mais ela reporta

Além do rastro, o avaliador inspeciona a própria política: ausência de cleanup rule explícita, uma cleanup rule sem registro (o que anula seu único propósito), regras com Track em None, e encobrimento par a par - uma regra que nunca pode disparar porque uma anterior já casa com tudo que ela casaria.

O aviso de descarte silencioso merece menção própria. Quando nada casa, a cleanup rule implícita descarta a conexão e não registra absolutamente nada. Esse é o fato mais caro de uma base de regras Check Point para quem investiga, porque o sintoma é uma conexão que falha sem entrada de log que a explique, e parece falha de rede em vez de decisão de política.

## Limites honestos

**Nomes** de serviço não são resolvidos: `443` é um número de porta, e não `https`. Mapear nomes para portas seria um palpite sobre o banco de objetos de alguém. A análise de encobrimento é **par a par**, então uma regra coberta conjuntamente por várias regras anteriores, mas por nenhuma sozinha, não é sinalizada. Apenas IPv4. A gramática é um subconjunto didático deliberado - regras reais acrescentam VPN, conteúdo, tempo, install-on e negação - mas a semântica de camadas ensinada aqui vale para todas elas de forma idêntica.
