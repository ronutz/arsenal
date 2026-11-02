## O que faz

Digite um timestamp Unix ou uma data ISO-8601 e leia o mesmo instante de volta em todas as formas comuns. Quando você digita um número, a ferramenta detecta automaticamente a unidade (segundos, milissegundos, microssegundos ou nanossegundos) pela sua magnitude, então você pode colar um valor de quase qualquer sistema sem informar qual é a unidade. Em seguida, ela apresenta o instante como um detalhamento de calendário em UTC, uma string ISO-8601, um timestamp RFC 3339, o formato de data HTTP e o próprio timestamp nas quatro unidades. Tudo é calculado no seu navegador.

## O que é o tempo Unix

O tempo Unix, definido pelo POSIX, é o número de segundos decorridos desde a época (1970-01-01 00:00:00 UTC), sem contar os segundos bissextos. Sistemas diferentes o armazenam em resoluções diferentes: o Unix clássico e a maioria das APIs usam segundos; o JavaScript e muitos bancos de dados usam milissegundos; algumas interfaces de tracing e de kernel usam microssegundos ou nanossegundos. Como essas magnitudes estão cerca de mil vezes distantes entre si, a unidade pode ser inferida pela quantidade de dígitos do número, que é o que a detecção automática faz.

## Os formatos que produz

- **Detalhamento de calendário em UTC**: o ano, o mês, o dia e a hora do dia em UTC.
- **ISO 8601 e RFC 3339**: o formato de timestamp da internet, por exemplo `2026-07-01T20:00:00Z`.
- **Data HTTP**: a forma IMF-fixdate usada em headers HTTP (RFC 9110, seção 5.6.7), por exemplo `Wed, 01 Jul 2026 20:00:00 GMT`.
- **As quatro unidades**: o mesmo instante expresso em segundos, milissegundos, microssegundos e nanossegundos.

## Faixa e determinismo

As datas são tratadas dentro da faixa que um valor de data do JavaScript consegue representar, aproximadamente mais ou menos 273.000 anos em torno da época (um limite de 8,64 x 10^15 milissegundos para cada lado). A conversão é uma função pura do valor de entrada e nunca lê o relógio atual, então um mesmo timestamp sempre é apresentado da mesma forma. Uma comodidade de "relativo a agora" necessariamente precisa do relógio do sistema, por isso fica na interface da ferramenta, e não neste núcleo determinístico.

## Como usar

Digite um timestamp Unix como `1751400000` (um valor de dez dígitos, então é lido como segundos) ou `1751400000000` (treze dígitos, lido como milissegundos), ou uma data ISO-8601 como `2026-07-01T20:00:00Z`, e leia todas as formas equivalentes de uma vez.

## Compartilhar resultado

Abaixo do destaque, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o timestamp ou a data como foi digitado depois do `#`, assim que a página o lê. A linha que diz há quanto tempo foi, ou daqui a quanto tempo será, vem do relógio de quem abre o link, como seria num valor colado; as conversões em si são as mesmas em qualquer lugar. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Ao abrir um link.** O valor preenche a caixa como se tivesse sido colado e a página o converte. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
