## O que faz

Lê um ou mais seletores CSS (um por linha, separados por vírgula, ou uma folha de estilos inteira colada, cujos blocos de declaração e preâmbulos de at-rules são descartados) e calcula a especificidade de cada seletor como a tripla (A, B, C) do Selectors Level 4, com cada seletor simples nomeado e a coluna a que soma. Os seletores são ordenados como a cascata os ordena, os empates são apontados (ali decide a ordem de aparição), e cada regra especial de que o seletor dependeu é explicada ao lado dele.

## A contagem

Do Selectors Level 4, "Calculating a selector's specificity":

- **A** conta seletores de ID (`#main`).
- **B** conta seletores de classe (`.nav`), seletores de atributo (`[type="text"]`) e pseudoclasses (`:hover`).
- **C** conta seletores de tipo (`li`) e pseudoelementos (`::before`).
- O seletor universal (`*`) é ignorado; combinadores não somam nada.
- As especificidades se comparam coluna a coluna: A maior vence; se A empata, B maior; se B empata, C maior; se tudo empata, as especificidades são iguais.
- "Repeated occurrences of the same simple selector are allowed and do increase specificity": `.a.a` é (0,2,0).

Os casos especiais que a especificação explicita, e que a calculadora aplica:

- `:is()`, `:not()` e `:has()`: a especificidade "is replaced by the specificity of the most specific complex selector in its selector list argument". `:not(em, strong#foo)` é (1,0,1).
- `:nth-child()` e `:nth-last-child()` com cláusula `of`: uma pseudoclasse "plus the specificity of the most specific complex selector in its selector list argument". `:nth-child(even of li, .item)` é (0,2,0).
- `:where()`: "replaced by zero". `.qux:where(em, #foo#bar#baz)` é (0,1,0).
- Os pseudoelementos legados de dois-pontos simples do CSS2 (`:before`, `:after`, `:first-line`, `:first-letter`) são pseudoelementos e contam em C.
- Do CSS Shadow Module Level 1: `:host` é uma pseudoclasse; `:host()` e `:host-context()` são uma pseudoclasse mais o argumento; `::slotted()` é um pseudoelemento mais o argumento. `::part()` é contado como um pseudoelemento (o módulo remete a regra exata ao CSS Pseudo-Elements Level 4; a suposição aparece na página).

A calculadora reproduz a tabela de exemplos da especificação: `*` (0,0,0), `LI` (0,0,1), `UL LI` (0,0,2), `UL OL+LI` (0,0,3), `H1 + *[REL=up]` (0,1,1), `UL OL LI.red` (0,1,3), `LI.red.level` (0,2,1), `#x34y` (1,0,0), `#s12:not(FOO)` (1,0,1), `.foo :is(.bar, #baz)` (1,1,0).

## Antes da especificidade

A especificidade só decide quando tudo acima dela na cascata está empatado. O CSS Cascading and Inheritance Level 5 ordena as declarações por, em ordem decrescente de prioridade: origem e importância (uma declaração `!important` do autor vence qualquer declaração normal, seja qual for o seletor), contexto (shadow trees), estilos ligados ao elemento (um atributo `style` vence qualquer regra da mesma importância), camadas de cascata (a última camada vence para declarações normais, a primeira para as importantes), depois especificidade, depois ordem de aparição (vence a última declaração na ordem do documento, com os atributos style colocados depois de todas as folhas de estilo). A página lista esses passos para que um vencedor surpreendente possa ser rastreado ao passo certo.

## Limites

- A calculadora lê sintaxe, não um documento. Não sabe se um seletor casa com algo, e para uma lista de seletores a especificidade em vigor num casamento real é a do membro mais específico que casa; a página ordena os membros individualmente.
- Prefixos de namespace (`ns|p`) são lidos, não resolvidos.
- Pseudoclasses e pseudoelementos desconhecidos são contados pela forma (um dois-pontos B, dois C), que é o que a gramática diz; se um navegador os suporta é outra questão.
- Implementações podem limitar contagens muito grandes; a calculadora não limita.

## Fontes

- [Selectors Level 4, W3C Working Draft 22 January 2026: Calculating a selector's specificity](https://www.w3.org/TR/selectors-4/#specificity-rules) (lido em 2026-10-05)
- [CSS Cascading and Inheritance Level 5, W3C Candidate Recommendation Snapshot 13 January 2022: Cascade Sorting Order](https://www.w3.org/TR/css-cascade-5/#cascade-sort) (lido em 2026-10-05)
- [CSS Shadow Module Level 1, Editor's Draft 28 April 2026](https://drafts.csswg.org/css-shadow-1/) (lido em 2026-10-05)
