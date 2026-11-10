## Ce que fait l’outil

L’outil exécute une sous-commande `string` de Tcl 8.4.6 et dessine le résultat sur une règle de caractères : chaque caractère de la chaîne avec son index, coloré selon ce que la commande en a fait (recherché, correspondant, renvoyé, remplacé, supprimé par le trim, ou première différence d’une comparaison). Dix-sept sous-commandes sont couvertes : `length`, `bytelength`, `tolower`, `toupper`, `range`, `index`, `first`, `last`, `map`, `match`, `compare`, `equal`, `trim`, `trimleft`, `trimright`, `replace` et `repeat`.

## Lecture du résultat

- **La commande** est la ligne exacte à coller dans une iRule, avec les guillemets ou les accolades dont Tcl a besoin.
- **La règle** numérote les caractères à partir de 0, comme le font tous les arguments d’index.
- **Arguments d’index** montre comment chaque index a été lu : `end-1` désigne l’avant-dernier caractère, et un index écrit `010` est en octal : il désigne donc 8.
- **La passe unique de string map** liste chaque position : conservée, ou remplacée par telle clé et telle valeur.

## Bon à savoir

- `length` compte les caractères ; `bytelength` compte les octets de l’UTF-8 interne de Tcl : `héllo` fait donc 5 caractères et 6 octets.
- `string map` fait un seul passage de gauche à droite. À chaque position, la première clé de la liste qui correspond l’emporte, et le texte remplacé n’est jamais réexaminé : `string map {a 1 ab 2} abab` donne `1b1b`, alors que `{ab 2 a 1}` donne `22`.
- `compare` ordonne selon le code des caractères : `string compare bench Chair` vaut donc 1.
- `string index` et `string range` renvoient une chaîne vide, et non une erreur, quand l’index est hors de la chaîne.
- `trim` supprime un **ensemble** de caractères, dans n’importe quel ordre, et non un mot.
- Tcl 8.4.6 accepte `e` ou `en` seuls comme `end`, mais `e-1` est une erreur.
- La conversion de casse utilise les propres tables Unicode de Tcl 8.4.6, qui diffèrent de celles d’un navigateur moderne pour environ un millier de caractères (par exemple, Tcl 8.4.6 n’a pas de forme majuscule pour `µ`).

## Partage des résultats

Sous le résultat, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient le formulaire, désigné par nom : la sous-commande sous la forme `#op=`, puis chaque champ d’argument qui contient quelque chose, sous son propre nom (`&string=`, `&first=`, `&needle=`, `&haystack=`, `&mapping=` et ainsi de suite), et `&nocase=1` quand **-nocase** est coché pour une sous-commande qui l’accepte. Il n’y a pas de `#input=` unique : le champ qui contient le texte traité change selon la sous-commande. Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; au-delà, les champs n’obtiennent aucun lien, et la fenêtre contextuelle indique leur longueur.
- **Ouverture d’un lien.** La sous-commande et ses champs se remplissent comme à la saisie (un champ que le lien ne contient pas reste vide) et le résultat est calculé. Une sous-commande inconnue, un champ que la sous-commande ne prend pas, ou `-nocase` là où il ne s’applique pas, fait ignorer le lien en entier ; le texte des champs est accepté tel que saisi, et un index incorrect reçoit l’erreur de Tcl lui-même, comme à la saisie. Que le lien soit accepté ou non, les valeurs quittent ensuite aussitôt l’adresse de la page elle-même, sans aucune requête : un rechargement, un favori ou le bouton Partager de la page n’emporte donc rien que vous n’ayez choisi de partager.

## Limites

Les caractères situés au-delà du plan multilingue de base (Basic Multilingual Plane) sont refusés, car Tcl 8.4 ne peut pas les stocker comme un seul caractère. `string is`, `totitle`, `wordstart` et `wordend` ne sont pas modélisés. Les résultats de `repeat` sont plafonnés à 100 000 caractères.

## Sources

- [Tcl 8.4 manual: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (consulté le 03/10/2026)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (consulté le 03/10/2026)
- [Tcl 8.4.6 source code, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (l’interpréteur de référence face auquel le moteur est testé)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien créé par Partager les résultats
