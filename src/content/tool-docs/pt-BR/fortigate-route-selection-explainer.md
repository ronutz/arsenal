## O que faz

Informe um destino e um conjunto de rotas, e esta ferramenta roda a seleção que o FortiOS faria: quais rotas instalam, qual delas o tráfego de fato toma, e quais são rotas flutuantes de reserva. Roda inteiramente no seu navegador.

## A distinção pela qual a ferramenta inteira existe

Distância administrativa e prioridade são rotineiramente tratadas como a mesma ideia. Não são, e agem em momentos diferentes.

**A distância decide qual rota é INSTALADA.** Rotas para o mesmo destino competem, a menor distância vence, e a perdedora fica **ausente** da tabela de encaminhamento: não classificada abaixo, não uma alternativa usada sob carga, simplesmente não está lá. É por isso que "minha rota não funciona" tantas vezes acaba sendo "minha rota nunca instalou", e por que uma rota configurada não aparece em `get router info routing-table all`.

**A prioridade decide qual entre várias rotas JÁ INSTALADAS é preferida.** Ela só se aplica a rotas que sobreviveram à comparação de distância. Uma prioridade 0 não resgata uma rota que perdeu na distância, e um vetor de ouro fixa exatamente esse caso.

## O que decorre disso

| Configuração | Resultado |
|---|---|
| Mesmo prefixo, mesma distância | As duas instalam; a prioridade escolhe |
| Mesmo prefixo, distâncias diferentes | Uma instala; a outra é reserva flutuante |
| Mesmo prefixo, mesma distância, mesma prioridade | ECMP balanceia entre as duas |

A reserva flutuante é como se constrói uma rota padrão de espera: mesmo prefixo, distância maior. Ela aparece na tabela apenas quando a primária é retirada, que é o que o **monitoramento de saúde do enlace** faz, e por que uma rota estática sem ele permanece na tabela enquanto o caminho além da interface está quebrado.

A ferramenta modela uma rota fora do ar para que você veja a reserva assumir.

## O encaminhamento toma a correspondência mais longa

Entre as rotas **instaladas**, o prefixo mais específico vence, independentemente de distância ou prioridade. Um /16 vence uma rota padrão para um endereço dentro dele mesmo que a padrão tenha valores melhores, porque a especificidade é comparada primeiro no momento do encaminhamento.

É também por isso que o sequestro de prefixos funciona, e por que essa ordenação vale ter em mente além de um único equipamento.

## O que ela não modela

Apenas a tabela de roteamento. Duas coisas são consultadas **antes** dela e a sobrepõem:

- Uma **rota por política**, que casa por origem, protocolo e porta além do destino. Uma rota por política esquecida é a causa clássica de tráfego que ignora uma rota estática obviamente correta, então, se a tabela diz uma coisa e o tráfego faz outra, procure ali primeiro.
- Uma **regra de SD-WAN**, que seleciona um membro por desempenho medido antes de a tabela ser alcançada.

É somente IPv4, e não avalia se um gateway é de fato alcançável: toma o conjunto de rotas como dado.

## Onde ela se encaixa

Forma par com o artigo de roteamento e SD-WAN do FortiGate, que cobre a ordem completa de consulta e a camada de SD-WAN que esta ferramenta deixa de fora. Para candidatos ao NSE 4, apoia o objetivo 4.01.
