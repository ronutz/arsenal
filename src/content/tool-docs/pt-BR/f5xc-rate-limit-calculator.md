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

## Compartilhar resultado

Abaixo da taxa efetiva, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva todos os campos depois do `#`: Number, Per Period, Periods, Burst Multiplier, Mitigation e o lockout com a unidade, cada um como o cálculo o lê (um Burst Multiplier vazio como 1). Todo campo vai mesmo quando é igual ao padrão, então um link mantém o sentido se um padrão mudar, e os números não citam nenhum sistema nem pessoa. A página já mostra um resultado ao abrir, então o botão fica disponível na hora. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** Os campos são preenchidos como se tivessem sido digitados, e o resultado aparece. Um link com um valor que a página recusaria é ignorado por inteiro. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
