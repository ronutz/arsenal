## O que faz

Dois modos de aritmética exata de tempo. Entre dois instantes: o intervalo com sinal, decomposto da maior unidade para a menor (semanas, dias, horas, minutos, segundos) e totalizado integralmente em cada unidade, com a duração ISO 8601 canônica. Instante mais ou menos uma duração: o timestamp resultante. Durações são lidas em ISO 8601 (P1DT2H30M, PT90M, P1W) ou notação simples (1d 2h 30m; 90min). Tudo é calculado na linha do tempo UTC, no seu navegador.

## O que ela recusa, e por quê

Somar "um mês" é aritmética de calendário: um mês tem de 28 a 31 dias e um ano 365 ou 366, então P1M não tem duração exata única. A ferramenta recusa meses e anos com essa explicação em vez de escolher uma convenção em silêncio. Dias aqui têm exatamente 24 horas e semanas exatamente 7 dias - tempo exato, declarado.

## Offsets

Um timestamp sem offset é lido como UTC e a suposição é anotada. Adicione Z ou um offset explícito (por exemplo -03:00) e a resposta nunca depende da máquina em que a ferramenta roda.

Abaixo de cada instante, um seletor de data e hora o define sem digitar. A escolha mantém os segundos e o offset que o campo já tinha, e escreve Z (UTC) quando não havia nenhum; um offset diferente de Z, ou uma data sozinha, continua sendo digitado.

## Compartilhar resultado

Abaixo do resultado, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o modo e os campos dele depois do `#`, assim que a página tem um resultado: os dois instantes para o intervalo entre eles, ou o início, a duração e somar ou subtrair. Os campos do outro modo não vão. Instantes e durações não identificam nada seu. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Ao abrir um link.** O modo é escolhido e os campos dele são preenchidos como você digitaria, e a página calcula; os campos do outro modo ficam como estavam. Um modo ou operação desconhecidos, um campo faltando ou um campo do outro modo fazem o link ser ignorado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
