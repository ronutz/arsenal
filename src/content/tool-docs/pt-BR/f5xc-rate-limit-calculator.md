## O que faz

Esta calculadora transforma uma configuração de rate limiter do F5 Distributed Cloud (XC) em exatamente o que ela vai fazer. Você informa os quatro campos que o console da F5 pede - **Number**, **Per Period**, **Periods** e **Burst Multiplier** - mais a **Mitigation Action** (e um bloqueio, se escolher Block), e ela calcula a taxa efetiva, os equivalentes por segundo / minuto / hora, o teto de burst e uma descrição clara do comportamento de imposição. Tudo roda inteiramente no seu navegador.

## A matemática da taxa

O XC expressa uma taxa como *Number requisições por (Periods x Per Period)*. É por isso que `[1, Seconds, 60]` e `[1, Minutes, 1]` são o mesmo limite - uma requisição por minuto - o que surpreende as pessoas com frequência. A calculadora normaliza qualquer configuração para uma única janela em segundos e mostra as taxas equivalentes por segundo, por minuto e por hora, para que duas configurações possam ser comparadas diretamente.

## Burst e imposição

O **Burst Multiplier** é o burst máximo de requisições permitido, como um múltiplo da taxa (padrão 1); um limite de 15 requisições/segundo com um multiplicador 3x permite um burst de 45 requisições. A imposição é um leaky bucket: quando o bucket transborda, o load balancer retorna **HTTP 429**.

## A pegadinha da mitigação

A configuração mais mal interpretada é a **Mitigation Action**. **Disabled não faz bypass do rate limiting** - o leaky bucket ainda retorna 429 no transbordo; Disabled apenas significa que nenhum timer de bloqueio adicional é aplicado. O **Block** adiciona um bloqueio por cima: quando o bucket transborda, o usuário fica bloqueado pela duração inteira do bloqueio mesmo que o bucket esvazie, e só pode enviar de novo depois que o timer expira (máximo de 48 horas). A calculadora informa qual comportamento a sua configuração produz.

## Ressalvas que ela destaca

A contagem é distribuída por Regional Edge e por proxy, então você pode ver brevemente mais requisições do que o limite antes de a imposição convergir. E quando você coloca em camadas regras de Server URL e de API endpoint, elas são avaliadas por primeira correspondência, na ordem em que você as configura.
