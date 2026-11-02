## O que faz

Compare dois blocos de texto e veja exatamente o que mudou: uma visão linha a linha de adições e remoções, com destaque em nível de palavra dentro das linhas que foram editadas, para você identificar a mudança específica. Você pode, opcionalmente, ignorar espaços em branco ou maiúsculas e minúsculas. Tudo é calculado no seu navegador; seu texto nunca é enviado a lugar nenhum.

## Como um diff é calculado

Um bom diff não é uma comparação ingênua linha a linha; ele encontra o menor conjunto de mudanças que transforma o primeiro texto no segundo. A ferramenta faz isso calculando a **maior subsequência comum** (LCS, longest common subsequence) dos dois textos: a maior sequência de tokens que aparece, na mesma ordem, em ambos. Tudo o que está nessa subsequência comum permanece inalterado; tudo o que está no primeiro texto mas não na LCS é uma **remoção**, e tudo o que está no segundo texto mas não na LCS é uma **inserção**. Essa é a ideia no coração do clássico algoritmo de diff de Myers, e ela produz um script de edição mínimo, o menor número de adições e remoções que explica a diferença.

## Dois níveis: linhas e palavras

A mesma operação de LCS roda em duas granularidades. Para a visão principal, os tokens são linhas inteiras, o que dá a você a familiar lista de linhas adicionadas e removidas. Para uma linha que foi alterada, em vez de adicionada ou removida por completo, a ferramenta roda o diff novamente com palavras, espaços e pontuação como tokens, e destaca apenas as partes da linha que de fato diferem. Esse destaque em linha é o que transforma "esta linha mudou" em "esta palavra mudou".

## Determinismo

Quando dois scripts de edição diferentes são igualmente curtos, um diff precisa escolher um, e a ferramenta escolhe sempre da mesma forma (ela prefere uma remoção quando as duas direções são igualmente boas). Esse desempate fixo torna a saída determinística: as mesmas duas entradas sempre produzem o mesmo diff, sem depender de tempo ou de qualquer coisa externa.

## Como usar

Cole o texto original de um lado e o texto alterado do outro, e leia as diferenças linha a linha com os destaques de palavra em linha. Ative as opções de ignorar espaços em branco ou ignorar maiúsculas e minúsculas quando você se importa com o conteúdo, e não com a formatação.

## Compartilhar resultado

Abaixo do topo do resultado (ou abaixo de "sem diferenças", que também é uma leitura), o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva depois do `#` os dois textos como foram colados, Original e Modificado, e as duas opções. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. Textos comparados podem ser privados, então o popover pede que você leia os dois antes de mandar o link. Os textos vão como foram colados: um valor trocado nas duas caixas poderia esconder justamente a mudança que você quer mostrar. Antes de oferecer um link, o texto é verificado em busca de uma credencial que um padrão define: uma chave privada PEM, uma linha `Authorization` ou `Proxy-Authorization` com qualquer esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seções 11.6.2 e 11.7.2: o valor "consists of credentials"), uma linha `Cookie` ou `Set-Cookie` com valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seções 4.1.1 e 4.2.1), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1), uma senha numa URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1: a forma "user:password" "is deprecated"), um access key ID da AWS ou um valor `ENC` do FortiOS; todos lidos em 2026-11-01. Qualquer um deles significa sem link: o popover diz a caixa e a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo (`db_password = ...`, um `token=` numa URL) não impede o link; o popover cita o primeiro para você conferir.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** As duas caixas e as duas opções são preenchidas como você faria, e a página compara. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
