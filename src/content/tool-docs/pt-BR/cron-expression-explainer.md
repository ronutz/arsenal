# Explicador de expressões cron

Cole um agendamento de crontab de cinco campos — ou uma das macros `@` — e a ferramenta o lê de volta: cada campo explicado em linguagem simples com o conjunto exato de valores que casa, as próximas cinco ocorrências, e as pegadinhas do dialeto sinalizadas enquanto você digita.

## Os cinco campos

`minuto hora dia-do-mês mês dia-da-semana`, com faixas `a-b`, listas `a,b`, passos `*/n` e `a-b/n`, e nomes (`JAN`–`DEC`, `SUN`–`SAT`). As macros `@` — `@yearly`, `@monthly`, `@weekly`, `@daily`, `@hourly` e companhia — expandem para as formas de cinco campos; `@reboot` não tem agendamento nenhum, e a ferramenta diz isso em vez de inventar um.

## As pegadinhas que ela sinaliza

A maior: quando dia-do-mês **e** dia-da-semana estão ambos restritos, o cron roda o comando quando **qualquer um** casa — um OU, não o E que quase todo mundo espera. Também: `0` e `7` são ambos domingo; um passo que não divide a faixa por igual vira de forma irregular (`*/7` nos minutos termina em 56 e salta para 0); nomes dentro de faixas com passo são historicamente pouco confiáveis entre implementações; e uma entrada de seis campos é reconhecida como o dialeto Quartz com segundos, chamada pelo nome.

## Sobre os horários projetados

O cron avalia agendamentos no horário **local** do daemon. As ocorrências aqui são calculadas no relógio de parede do instante atual do seu navegador, sem base de fusos aplicada — o mesmo motor determinístico que os golden vectors fixam contra um momento de referência congelado.

Tudo roda localmente; o agendamento nunca sai da página. Fundamentado no `crontab(5)` e na especificação POSIX.
