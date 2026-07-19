## O que faz

Dois modos de aritmética exata de tempo. Entre dois instantes: o intervalo com sinal, decomposto da maior unidade para a menor (semanas, dias, horas, minutos, segundos) e totalizado integralmente em cada unidade, com a duração ISO 8601 canônica. Instante mais ou menos uma duração: o timestamp resultante. Durações são lidas em ISO 8601 (P1DT2H30M, PT90M, P1W) ou notação simples (1d 2h 30m; 90min). Tudo é calculado na linha do tempo UTC, no seu navegador.

## O que ela recusa, e por quê

Somar "um mês" é aritmética de calendário: um mês tem de 28 a 31 dias e um ano 365 ou 366, então P1M não tem duração exata única. A ferramenta recusa meses e anos com essa explicação em vez de escolher uma convenção em silêncio. Dias aqui têm exatamente 24 horas e semanas exatamente 7 dias - tempo exato, declarado.

## Offsets

Um timestamp sem offset é lido como UTC e a suposição é anotada. Adicione Z ou um offset explícito (por exemplo -03:00) e a resposta nunca depende da máquina em que a ferramenta roda.
