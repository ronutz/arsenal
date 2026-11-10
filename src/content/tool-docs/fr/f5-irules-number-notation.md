## Ce que fait l’outil

Saisissez une valeur telle qu’elle apparaît dans une iRule, par exemple `010`, `0x1F`, `08`, `1e3` ou `" 12 "`, et l’outil montre comment Tcl 8.4.6 la lit. F5 indique dans K6091 que le jeu de commandes iRules a été développé à partir de la version de base 8.4.6 de Tcl : ce sont donc les règles qu’applique un BIG-IP. Le moteur de l’outil a été vérifié face à un véritable interpréteur Tcl 8.4.6 compilé à partir des sources officielles.

## Lecture du résultat

- **Le titre** indique si le texte est un entier, un double (virgule flottante) ou pas un nombre, dans quelle base un entier a été écrit, et comment Tcl l’affiche. `010` est l’entier 8, écrit en octal.
- **Autres notations** donne le même entier en décimal, en hexadécimal, en octal et en binaire, et la façon de l’écrire dans une iRule. Tcl 8.4 n’a pas de notation binaire : cette ligne n’a donc pas de forme Tcl.
- **À l’intérieur du double** montre ce que cachent les 12 chiffres affichés : Tcl 8.4 affiche les doubles avec 12 chiffres significatifs (son `tcl_precision` vaut 12 par défaut), si bien que `0.1` s’affiche `0.1` alors que la valeur stockée est `0.1000000000000000055511151231257827021181583404541015625`.
- **Deux endroits où Tcl lit les nombres** compare la valeur écrite directement dans une expression (`expr {08}`, une erreur avant toute exécution) au même texte placé dans une variable (`set x 08; expr {$x + 0}`, une erreur seulement quand un calcul a besoin du nombre).
- **Comparaison avec** exécute `==`, `eq`, `<` et `>` face à une seconde valeur de votre choix, avec la raison de chaque résultat.

## Bon à savoir

- Un 0 initial signifie octal : `010 == 8` est vrai et `010 eq 8` est faux, car `eq` compare du texte.
- `08` et `09` ne sont pas du tout des nombres. Dans un calcul, ils échouent avec « can't use invalid octal number » ; dans une comparaison, ils deviennent silencieusement du texte, si bien que `"08" == 8` est faux.
- Pour Tcl, un double n’est jamais un entier : `3.0 == 3` est vrai, mais `3.0` s’affiche avec son point décimal et `%` le refuse.
- Les valeurs comprises entre 2 puissance 63 et 2 puissance 64 moins 1 sont acceptées et repassent en nombres négatifs (wrap around) ; toute valeur plus grande est refusée.

## Partage des résultats

Sous le titre et ses remarques, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient la valeur exactement telle que saisie, espaces compris (ils font partie de la valeur que lit Tcl), sous la forme `#input=`, et la valeur de comparaison sous la forme `&other=` quand ce champ est renseigné. Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; un nombre est bien plus court.
- **Ouverture d’un lien.** Les deux champs se remplissent comme à la saisie et la page lit la valeur ; une comparaison que le lien ne contient pas laisse ce champ vide, comme chez l’expéditeur. Toute valeur est acceptée, comme à la saisie : la page indique ce que Tcl en fait. Que le lien soit accepté ou non, les valeurs quittent ensuite aussitôt l’adresse de la page elle-même, sans aucune requête : un rechargement, un favori ou le bouton Partager de la page n’emporte donc rien que vous n’ayez choisi de partager.

## Limites

Les entiers sont modélisés sur 64 bits. Tcl 8.4 utilise le `long` du C de la plateforme pour laquelle il a été compilé : une version 32 bits lirait donc différemment les grandes valeurs ; l’outil le signale quand une valeur ne tient pas sur 32 bits.

## Sources

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (consulté le 03/10/2026)
- [Tcl 8.4 manual: expr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/expr.htm) (consulté le 03/10/2026)
- [F5 iRules reference: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (consulté le 02/10/2026)
- [Tcl 8.4.6 source code, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (l’interpréteur de référence ; `doc/tclvars.n` documente la valeur par défaut de `tcl_precision`, 12)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien créé par Partager les résultats
