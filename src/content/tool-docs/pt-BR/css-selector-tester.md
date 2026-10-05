## O que faz

Recebe HTML (um documento ou um fragmento) e um ou mais seletores, um por linha, e mostra que elementos cada seletor casa: os elementos destacados na árvore analisada com o seu caminho e linha no código, a contagem por seletor, a tripla de especificidade contada pela seção 15, uma nota quando o seletor nomeia um pseudoelemento (então a contagem é dos elementos originadores, já que um pseudoelemento é uma caixa, não um elemento) e, quando um seletor é inválido, a razão e a posição.

O HTML é analisado de modo inerte com o parse5, o mesmo parser do explicador de estrutura HTML; os seletores são analisados e casados por um motor próprio escrito a partir do Selectors Level 4 (W3C Working Draft, 22 de janeiro de 2026) e das regras de seletores do HTML Standard, e verificado contra o `querySelectorAll` do Chromium nos vetores que acompanham a ferramenta (139 de 146 seletores concordam; os sete que diferem estão listados abaixo e cada um é deliberado). Nada é executado, buscado ou renderizado; a API hospedada roda o mesmo código.

## O que é casado, e como

- Seletores de tipo e nomes de atributo são comparados em minúsculas para elementos HTML (HTML Standard, "Case-sensitivity of selectors"); valores de atributo distinguem caixa, exceto para os 46 nomes de atributo que o HTML lista (type, lang, dir, rel, checked, disabled, ...), a menos que o seletor diga `i` ou `s` (Selectors 4, 6.3). Classe e id distinguem caixa em todo modo.
- `[att]`, `[att=val]`, `[att~=val]`, `[att|=val]`, `[att^=val]`, `[att$=val]`, `[att*=val]` como 6.1 e 6.2 os definem, incluindo a regra de que um valor vazio em `~=`, `^=`, `$=` e `*=` não casa com nada.
- `:is()` e `:where()` com listas de seletores tolerantes (16.1): um membro que não analisa é descartado e conta zero na especificidade, e um argumento deixado vazio é válido e não casa com nada (4.2); `:not()` com uma lista de seletores que um membro inválido invalida (4.3); `:has()` com seletores relativos (formas filho, descendente, irmão seguinte e irmãos subsequentes), não aninhado (4.5). Nenhum pseudoelemento é válido dentro de qualquer dos quatro.
- `:root`, `:empty`, `:first-child`, `:last-child`, `:only-child`, `:nth-child(An+B of S)`, `:nth-last-child()`, `:first-of-type`, `:last-of-type`, `:only-of-type`, `:nth-of-type()`, `:nth-last-of-type()` conforme a seção 13; os quatro combinadores conforme a seção 14; casamento da direita para a esquerda conforme 17.3.
- `:lang()` com filtragem estendida sobre o atributo `lang` mais próximo, faixas entre aspas ou como identificador (7.2); `:dir()` a partir do atributo `dir` mais próximo.
- Pelas definições do HTML Standard, lidas dos atributos: `:checked`, `:enabled`, `:disabled` (um fieldset desabilitado desabilita os seus descendentes, exceto os do seu primeiro legend), `:required`, `:optional`, `:read-write`, `:read-only`, `:open`, `:any-link`, `:link`, `:defined`.
- Válidas mas sem casar aqui: `:hover`, `:active`, `:focus`, `:focus-visible`, `:focus-within` ("In non-interactive user agents, these pseudo-classes are valid, but never match any element", seção 9), `:visited`, `:target`, e os estados de mídia, exibição e shadow tree. Não avaliadas: `:valid`, `:invalid`, `:in-range`, `:out-of-range`, `:indeterminate`, `:default`, `:placeholder-shown`.
- Seletores inválidos (3.9) são nomeados com a posição do erro: pseudoclasse desconhecida, An+B malformado, combinador solto, seletor de atributo malformado, `:has()` aninhado, dois pseudoelementos, um pseudoelemento dentro de uma pseudoclasse lógica, membro vazio da lista, prefixo de namespace não declarado (só `*|` e `|` existem aqui).
- Um colchete, uma função ou uma string deixados abertos no fim do seletor são fechados ali, como faz o CSS Syntax Level 3 (5.5.9 e 5.5.10: `<eof-token>`: "Discard a token from input. Return block"; 4.3.5 para uma string, em que o fim da entrada é um erro de análise e o token de string é devolvido mesmo assim) e como faz o Chromium (verificado em 2026-10-05); o seletor carrega uma nota.
- Especificidade (seção 15): ids em A; classes, atributos e pseudoclasses em B; tipos e pseudoelementos em C; `:is()`, `:not()` e `:has()` tomam a especificidade do seu argumento mais específico, `:where()` conta zero, e `:nth-child(An+B of S)` conta uma pseudoclasse mais o seu S mais específico. É contada a partir do seletor analisado, de modo que um membro descartado por uma lista tolerante conta zero; a calculadora de especificidade conta o texto como escrito.

## Onde o testador e um navegador podem diferir

- `:empty`: o Chromium (verificado em 2026-10-05) ainda aplica a regra do Level 3 (qualquer texto, mesmo espaço, torna o elemento não vazio); o Selectors 4 a mudou. O testador segue o navegador e diz isso.
- A flag `s` em valores de atributo e a forma `:lang("pt-BR")` entre aspas são recursos do Level 4 que o Chromium (verificado em 2026-10-05) ainda não aceita; o testador aceita.
- `:optional` exclui os tipos de input a que `required` não se aplica (hidden, range, color, submit, image, reset, button), como diz o HTML Standard; o Chromium casa inputs hidden.
- `:scope` é a raiz do documento aqui (o `querySelectorAll` num documento tem o próprio documento como raiz de escopo, que não pode ser sujeito).
- `:valid`, `:invalid` e os demais estados de validação de restrições não são avaliados aqui; um navegador os avalia.
- Um seletor que nomeia um pseudoelemento lista os elementos que o originariam; o `querySelectorAll` não devolve nada para tal seletor, por desenho.

## Fontes

- [Selectors Level 4, W3C Working Draft 22 January 2026](https://www.w3.org/TR/selectors-4/) (lido em 2026-10-05)
- [HTML Living Standard, Interactions with CSS: Selectors](https://html.spec.whatwg.org/multipage/semantics-other.html#selectors) (lido em 2026-10-05)
- [CSS Syntax Module Level 3, W3C Candidate Recommendation Draft 1 October 2026](https://www.w3.org/TR/css-syntax-3/) (lido em 2026-10-05)
- [Quirks Mode Standard](https://quirks.spec.whatwg.org/) (lido em 2026-10-05)
- [parse5](https://github.com/inikulin/parse5) (lido em 2026-10-05)
