## O que faz

Cole uma lista ordenada de policies do FortiGate e, opcionalmente, um pacote. A ferramenta percorre a lista de cima para baixo mostrando qual campo descartou cada policy, aponta a vencedora e informa quando o pacote cai no implicit deny. Local e offline; raciocina sobre a lista fornecida e nunca toca num equipamento.

## A análise que vale rodar sozinha

Mesmo sem pacote, a ferramenta aponta as **policies que nunca podem ser alcançadas** — onde uma policy anterior cobre todos os campos que uma posterior cobre. Essa é a forma mais comum de "minha regra não funciona": a regra está correta e simplesmente nunca é alcançada. Vale rodar periodicamente, e não só quando algo quebra.

## O que ela corrige

**O ID da policy é um identificador, não uma posição.** A policy 3 pode estar abaixo da policy 47, e renumerar não muda a ordem de avaliação. Muito material online dá a entender que o ID é a ordem; a ferramenta apresenta a correção em toda execução, e um dos seus golden vectors é uma lista em que a policy 47 está acima da policy 3 e vence.

Ela também sempre diz que **cada direção precisa da sua própria policy** — tráfego permitido de A para B não diz nada sobre B para A.

## As regras de virtual IP

Uma policy com **VIP aplicado é casada de forma diferente e tem prioridade** sobre uma policy comum, então a ordenação sozinha não bloqueia uma origem. A policy de deny precisa de **`match-vip`** e precisa estar acima. Policies de deny novas já vêm com ele ligado; uma policy de **accept** não pode tê-lo, e a ferramenta sinaliza essa combinação como impossível.

## O que ela não faz

Não resolve objetos de endereço nem grupos de serviço — um objeto nomeado é um token opaco, a menos que seja `all` ou `any`. Ela sabe dizer que `web-servers` e `all` são diferentes, e não sabe dizer se um contém o outro. Para isso, a autoridade é o equipamento.
