## O que faz

Em 6 de julho de 2026, a F5 anunciou a mudança de uma cadência trimestral para mensal de lançamentos de segurança. Esta ferramenta transforma esse cronograma em datas concretas para você planejar. Escolha uma data inicial (o padrão é hoje) e ela lista os próximos lançamentos de software endurecido (hardened) da F5 e as notificações de segurança que os seguem, e informa o próximo de cada.

Toda a cadência se reduz a uma regra. Os lançamentos de software endurecido saem na **terceira quarta-feira de cada mês**, começando em 15 de julho de 2026. Uma **notificação de segurança** para cada lançamento é publicada um mês depois, e como as próprias datas-âncora da F5 se alinham às terceiras quartas-feiras (lançamento em 15 de julho, notificação em 19 de agosto), cada terceira quarta-feira carrega os dois eventos de uma vez: o lançamento endurecido daquele mês sai, e a notificação de segurança do mês anterior é publicada. O intervalo de um mês é deliberado, dando a você uma janela para atualizar antes que o detalhe da vulnerabilidade se torne público.

As datas são calculadas localmente por aritmética simples; nada sai do seu navegador. São as datas programadas: a F5 continua emitindo alertas de segurança fora de banda e hotfixes de engenharia para problemas urgentes a qualquer momento, e retém explicitamente flexibilidade para ajustar o momento ou o conteúdo de uma notificação quando considerações legais, de divulgação, de exploração ou de proteção do cliente exigirem.

## Compartilhar resultado

Abaixo das duas datas em destaque, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva depois do `#` a data de início que você escolheu (`from`, a menos que seja hoje) e o número de meses (`months`, a menos que seja 6). O botão fica desabilitado enquanto o formulário não muda. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Um link sem data abre no dia de hoje de quem recebe, e "em N dias" sempre conta a partir desse hoje. A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então os valores não são enviados ao servidor quando o link é aberto; cada um fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-los.

- **Ao abrir um link.** A data e a contagem são definidas e a página lista as datas. Uma data que não existe no calendário, ou uma contagem fora de 1 a 24, faz o link inteiro ser ignorado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
