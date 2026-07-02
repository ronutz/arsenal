## O que faz

Teste, explique e depure uma expressão regular. Digite um padrão e um texto e a ferramenta mostra cada correspondência com seus grupos de captura ao vivo, conforme você digita; digite um padrão sozinho e ela o divide em partes anotadas para você ler o que cada trecho faz; e, o tempo todo, ela avisa quando um padrão corre risco de backtracking catastrófico. Ela usa o motor de regex do JavaScript (ECMAScript) e roda inteiramente no seu navegador.

## Três tarefas em uma

A ferramenta faz as três coisas que você de fato quer de uma bancada de regex:

- **Testar.** Ela compila seu padrão e suas flags, relata qualquer erro de sintaxe em termos claros, e roda o padrão contra sua entrada, retornando cada correspondência junto com seus grupos de captura numerados e nomeados. O número de correspondências que ela coleta é limitado, para que um padrão que casa com uma entrada enorme não trave a página.
- **Explicar.** Ela analisa o padrão em tokens anotados, rotulando cada quantificador, classe de caracteres, grupo e asserção, para você entender uma regex sem rodá-la de cabeça.
- **Verificar ReDoS.** Ela procura as estruturas que causam backtracking catastrófico e avisa você sobre elas.

## O que é ReDoS, e por que importa aqui

Regular expression Denial of Service (ReDoS) acontece quando um padrão pode fazer backtracking de um número exponencial de formas em certas entradas, de modo que uma string curta faz o motor rodar praticamente para sempre. A forma clássica é um quantificador aplicado a um grupo que ele mesmo contém um quantificador, como `(a+)+`, casado contra uma entrada que no fim falha. Isso importa diretamente no navegador: uma correspondência de regex síncrona não pode ser interrompida, então um padrão catastrófico travaria a página. É por isso que a ferramenta tanto limita seu trabalho quanto sinaliza padrões arriscados, e é um aviso real a levar em conta antes de publicar um padrão que rodará sobre entrada não confiável.

## O motor e seu dialeto

A sintaxe de regex varia entre linguagens, e esta ferramenta usa o dialeto do JavaScript definido pela especificação ECMAScript, com suas flags (global, ignore-case, multiline, dotall, unicode e sticky) e seu suporte a grupos nomeados e lookarounds. Se você está escrevendo regex para JavaScript, ou para qualquer coisa que compartilhe sua semântica, o que você vê aqui é o que você vai obter.

## Como usar

Digite um padrão e flags, e opcionalmente um texto para casar, e leia as correspondências ao vivo, a explicação token a token e qualquer aviso de backtracking. Tudo é calculado localmente.
