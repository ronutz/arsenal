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
