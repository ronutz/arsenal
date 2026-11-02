# Rastreador de transformação digital

Trinta marcos em sete domínios da vida cotidiana, dos primeiros pacotes da ARPANET a previsões que ainda não aconteceram. O ponto da ferramenta não é a linha do tempo. É o **grau de certeza** atribuído a cada linha.

## Por que os graus existem

Um rastreador com uma seção "o que vem a seguir" é uma superfície de previsão, e a regra deste site é que ferramentas calculam em vez de adivinhar. A solução é que uma previsão nunca tem permissão de parecer um fato:

- **Aconteceu** - ocorreu, com data e verificável.
- **Em vigor** - uma obrigação legal que vincula hoje.
- **Agendado** - uma data futura fixa definida por lei ou por um cronograma publicado. Alta confiança na data, nenhuma afirmação sobre as consequências.
- **Agendado, mas em movimento** - uma data que existe de fato na lei *e* está sendo ativamente alterada. A ferramenta mostra a data original, a data proposta e o fato de que a mudança ainda não é lei.
- **Previsão** - a projeção de alguém, sempre nomeando quem prevê, e acompanhada de um contrassinal quando existe.

Esse quarto grau é o que ninguém mais mostra. As obrigações de alto risco da Lei de IA da União Europeia são o exemplo trabalhado: agendadas para 2 de agosto de 2026, com acordo provisório em 7 de maio de 2026 para mover para 2 de dezembro de 2027, e ainda não são lei - então a data original ainda rege o planejamento.

## O que cada linha registra

Cada marco responde a duas perguntas: o que mudou para uma pessoa comum, e o que se tornou possível que antes não era. Filtrar por domínio mostra o quanto a transformação chegou de formas diferentes ao dinheiro, ao trabalho, à saúde e ao Estado.

## Compartilhar resultado

Abaixo da contagem, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva os filtros ligados depois do `#`, pelo id: `domains` e `certainties`, na ordem da página (uma linha sem nada ligado não leva nada, o que significa todos, como na página). O popover diz primeiro o que o link leva, e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Sem filtro ligado, a vista é a página como abre, que o botão Compartilhar da própria página já aponta, então o botão espera. Os marcos nunca viajam: a página que abre o link lê o mesmo conjunto de dados, então o link fica curto e uma linha corrigida chega também aos links antigos.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então a vista não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue ler.

- **Ao abrir um link.** Os chips são ligados e o trilho é redesenhado, como ao tocar neles. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Privacidade

Os filtros são avaliados localmente. Nada é transmitido, e o conjunto de dados vai junto com a página.
