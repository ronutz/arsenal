## O que faz

Informe um instante de reunião - com Z ou offset explícito, porque um horário de reunião sem isso é ambíguo - e uma lista de fusos IANA, um por linha. A ferramenta lê esse único instante em cada fuso: data e hora locais, dia da semana, o offset UTC que a base tzdata informa para aquela data, a mudança de data em relação ao primeiro fuso e a sinalização de horário comercial. A base de fusos é a do próprio navegador, a mesma que o sistema operacional mantém atualizada.

## As sinalizações, declaradas

O horário comercial é sinalizado para 09:00-17:59 local, de segunda a sexta - o envelope convencional, nomeado em vez de escondido. A coluna de mudança de data destaca participantes em outra data de calendário, a clássica surpresa do Tóquio-entra-amanhã que vale dizer em voz alta no convite.

## Por que a data importa

O horário de verão é o que as regras do fuso disserem para aquela data específica: Berlim é UTC+2 em julho e UTC+1 em janeiro; São Paulo é UTC-3 o ano inteiro desde que o Brasil aboliu o horário de verão em 2019. Planejar com uma data real é exatamente o ponto.

Abaixo do instante, um seletor de data e hora o define sem digitar: a escolha mantém os segundos e o offset do campo, e escreve Z (UTC) quando não havia nenhum. Abaixo dos fusos, uma lista com todos os fusos IANA que o navegador conhece acrescenta o escolhido como uma nova linha.

## Compartilhar resultado

Abaixo da tabela, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o instante da reunião e os fusos, um por linha, como foram digitados depois do `#`, assim que a página tem um plano. As leituras locais são calculadas com os dados de fuso do navegador que abre o link, que é o que a página sempre usa. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Ao abrir um link.** O instante e os fusos são preenchidos como você digitaria, e a página planeja. Os dois precisam estar lá, ou o link é ignorado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
