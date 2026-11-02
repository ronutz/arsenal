# Explicador de expressões cron

Cole um agendamento de crontab de cinco campos — ou uma das macros `@` — e a ferramenta o lê de volta: cada campo explicado em linguagem simples com o conjunto exato de valores que casa, as próximas cinco ocorrências, e as pegadinhas do dialeto sinalizadas enquanto você digita.

## Os cinco campos

`minuto hora dia-do-mês mês dia-da-semana`, com faixas `a-b`, listas `a,b`, passos `*/n` e `a-b/n`, e nomes (`JAN`–`DEC`, `SUN`–`SAT`). As macros `@` — `@yearly`, `@monthly`, `@weekly`, `@daily`, `@hourly` e companhia — expandem para as formas de cinco campos; `@reboot` não tem agendamento nenhum, e a ferramenta diz isso em vez de inventar um.

## As pegadinhas que ela sinaliza

A maior: quando dia-do-mês **e** dia-da-semana estão ambos restritos, o cron roda o comando quando **qualquer um** casa — um OU, não o E que quase todo mundo espera. Também: `0` e `7` são ambos domingo; um passo que não divide a faixa por igual vira de forma irregular (`*/7` nos minutos termina em 56 e salta para 0); nomes dentro de faixas com passo são historicamente pouco confiáveis entre implementações; e uma entrada de seis campos é reconhecida como o dialeto Quartz com segundos, chamada pelo nome.

## Sobre os horários projetados

O cron avalia agendamentos no horário **local** do daemon. As ocorrências aqui são calculadas no relógio de parede do instante atual do seu navegador, sem base de fusos aplicada — o mesmo motor determinístico que os golden vectors fixam contra um momento de referência congelado.

Tudo roda localmente; o agendamento nunca sai da página. Fundamentado no `crontab(5)` e na especificação POSIX.

## Compartilhar resultado

Acima dos painéis dos campos, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o agendamento como foi digitado depois do `#`, assim que a página o lê. A página só lê um agendamento, cinco campos de tempo ou uma @macro: uma linha de crontab com o comando é recusada (a contagem de campos está errada), então um comando, e qualquer senha ou token escrito nele, nunca vai num link. As próximas execuções são calculadas pelo relógio de quem abre o link. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Ao abrir um link.** O agendamento preenche a caixa como se tivesse sido colado e a página o explica. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
