## Ce que fait l’outil

Il lit un ou plusieurs sélecteurs CSS (un par ligne, séparés par des virgules, ou une feuille de style entière collée telle quelle, dont les blocs de déclarations et les préludes des règles @ sont écartés) et calcule la spécificité de chaque sélecteur sous la forme du triplet (A, B, C) de Selectors Level 4, en nommant chaque sélecteur simple et la colonne à laquelle il contribue. Les sélecteurs sont classés comme les classe la cascade, les égalités sont signalées (c’est alors l’ordre d’apparition qui tranche), et chaque règle particulière sur laquelle repose le sélecteur est expliquée à côté.

## Le décompte

D’après Selectors Level 4, « Calculating a selector's specificity » :

- **A** compte les sélecteurs d’ID (`#main`).
- **B** compte les sélecteurs de classe (`.nav`), les sélecteurs d’attribut (`[type="text"]`) et les pseudo-classes (`:hover`).
- **C** compte les sélecteurs de type (`li`) et les pseudo-éléments (`::before`).
- Le sélecteur universel (`*`) est ignoré ; les combinateurs n’ajoutent rien.
- Les spécificités se comparent colonne par colonne : le A le plus grand l’emporte ; à égalité sur A, le B le plus grand ; à égalité sur B, le C le plus grand ; si tout est égal, les spécificités sont égales.
- Les occurrences répétées d’un même sélecteur simple sont permises et augmentent bien la spécificité (« Repeated occurrences of the same simple selector are allowed and do increase specificity ») : `.a.a` vaut (0,2,0).

Les cas particuliers que détaille la spécification, et que le calculateur applique :

- `:is()`, `:not()` et `:has()` : la spécificité est remplacée par celle du sélecteur complexe le plus spécifique de la liste passée en argument (« is replaced by the specificity of the most specific complex selector in its selector list argument »). `:not(em, strong#foo)` vaut (1,0,1).
- `:nth-child()` et `:nth-last-child()` avec une clause `of` : une pseudo-classe, plus la spécificité du sélecteur complexe le plus spécifique de la liste passée en argument (« plus the specificity of the most specific complex selector in its selector list argument »). `:nth-child(even of li, .item)` vaut (0,2,0).
- `:where()` : spécificité remplacée par zéro (« replaced by zero »). `.qux:where(em, #foo#bar#baz)` vaut (0,1,0).
- Les anciens pseudo-éléments à deux-points simple de CSS2 (`:before`, `:after`, `:first-line`, `:first-letter`) sont des pseudo-éléments et comptent dans C.
- D’après CSS Shadow Module Level 1 : `:host` est une pseudo-classe ; `:host()` et `:host-context()` comptent pour une pseudo-classe plus leur argument ; `::slotted()` compte pour un pseudo-élément plus son argument. `::part()` est compté comme un pseudo-élément (le module renvoie sa règle exacte à CSS Pseudo-Elements Level 4 ; l’hypothèse est indiquée sur la page).

Le calculateur reproduit le tableau d’exemples de la spécification : `*` (0,0,0), `LI` (0,0,1), `UL LI` (0,0,2), `UL OL+LI` (0,0,3), `H1 + *[REL=up]` (0,1,1), `UL OL LI.red` (0,1,3), `LI.red.level` (0,2,1), `#x34y` (1,0,0), `#s12:not(FOO)` (1,0,1), `.foo :is(.bar, #baz)` (1,1,0).

## Avant la spécificité

La spécificité ne tranche que lorsque tout ce qui la précède dans la cascade est égal. CSS Cascading and Inheritance Level 5 trie les déclarations selon les critères suivants, par ordre de priorité décroissant : l’origine et l’importance (une déclaration d’auteur `!important` l’emporte sur toutes les déclarations normales, quel que soit le sélecteur), le contexte (shadow trees), les styles attachés à l’élément (un attribut `style` l’emporte sur toute règle de même importance), les couches de cascade (la dernière couche l’emporte pour les déclarations normales, la première pour les déclarations importantes), puis la spécificité, puis l’ordre d’apparition (la dernière déclaration dans l’ordre du document l’emporte, les attributs style étant placés après toutes les feuilles de style). La page liste ces étapes pour qu’un gagnant inattendu puisse être rattaché à la bonne étape.

## Partage des résultats

Sous le résumé, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient les sélecteurs tels que saisis après le `#`, et rien d’autre ; le classement est calculé à partir d’eux seuls, si bien que la page qui ouvre le lien affiche le même tableau. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le texte n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Les sélecteurs remplacent le contenu de la zone comme lors d’un collage, et la page calcule ; rien n’est envoyé nulle part. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Limites

- Le calculateur lit une syntaxe, pas un document. Il ne peut pas savoir si un sélecteur correspond à quoi que ce soit et, pour une liste de sélecteurs, la spécificité en vigueur lors d’une correspondance réelle est celle du membre le plus spécifique qui correspond ; la page classe les membres un par un.
- Les préfixes d’espace de noms (`ns|p`) sont lus mais pas résolus.
- Les pseudo-classes et pseudo-éléments inconnus sont comptés d’après leur forme (un deux-points : B, deux deux-points : C), ce que dit la grammaire ; leur prise en charge par un navigateur est une autre question.
- Les implémentations peuvent plafonner les très grands décomptes ; le calculateur ne le fait pas.

## Sources

- [Selectors Level 4, W3C Working Draft du 22 janvier 2026 : Calculating a selector's specificity](https://www.w3.org/TR/selectors-4/#specificity-rules) (consulté le 05/10/2026)
- [CSS Cascading and Inheritance Level 5, W3C Candidate Recommendation Snapshot du 13 janvier 2022 : Cascade Sorting Order](https://www.w3.org/TR/css-cascade-5/#cascade-sort) (consulté le 05/10/2026)
- [CSS Shadow Module Level 1, Editor’s Draft du 28 avril 2026](https://drafts.csswg.org/css-shadow-1/) (consulté le 05/10/2026)
- [RFC 3986 : URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consulté le 01/11/2026) : section 3.5, le fragment, qu’utilise un lien Partager les résultats
