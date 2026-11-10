## Ce que fait l’outil

`scan` est le moyen économique de décomposer une valeur dans une iRule ; la référence `matches_regex` de F5 note qu’une commande de chaîne est plus efficace qu’une expression régulière et que la plupart des cas peuvent être traités avec `string match` ou `scan`. Donnez à l’outil une valeur, un format et les noms des variables : il aligne chaque directive du format sur les caractères qu’elle a consommés, la valeur qu’elle a produite et la variable qui l’a reçue, puis indique exactement pourquoi scan s’est arrêté. La valeur est dessinée sur une règle graduée, les caractères de chaque conversion dans leur propre couleur.

## Lecture du résultat

- **scan a renvoyé** est le résultat de la commande : avec des noms de variables, le nombre de variables qui ont reçu une valeur ; sans noms, une liste des valeurs converties.
- **Directive par directive** comporte une ligne par directive : un littéral qui devait correspondre, un caractère d’espacement qui saute n’importe quelle quantité d’espaces, ou une conversion comme `%d`, `%s` ou `%[^&]`.
- **Variables après le scan** montre ce que contient chaque variable nommée. Une variable située après le point où scan s’est arrêté n’est pas affectée par ce scan.

## Bon à savoir

- `-1` signifie que l’entrée s’est terminée avant la première conversion ; `0` signifie qu’une conversion a été tentée et n’a pas correspondu. Testez les deux cas quand une valeur peut être vide.
- `%d` saute les espaces initiaux et lit du décimal ; `%i` déduit la base d’un préfixe, si bien que `08` lu avec `%i` donne 0 et s’arrête sur le 8. Utilisez `%d` pour les heures et les codes complétés par des zéros.
- `%s` s’arrête sur un caractère d’espacement ; `%[^&]` lit tout jusqu’à une esperluette.
- Tcl 8.4.6 stocke les conversions entières dans un `int` C : `3000000000` lu avec `%d` revient sous la forme `-1294967296`, et le modificateur `l` n’y change rien en 8.4.6. Pour conserver intact un grand nombre, lisez-le comme du texte avec `%[0-9]` et laissez `expr` l’interpréter.
- `%n` stocke la quantité d’entrée consommée jusque-là. Le manuel parle de caractères, mais Tcl 8.4.6 compte les octets de son UTF-8 interne : chaque caractère hors ASCII compte donc pour 2 ou 3.

## Partage des résultats

Sous le résultat, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient les trois champs tels que saisis : la valeur à décomposer sous la forme `#input=`, le format sous la forme `&format=` et les noms de variables sous la forme `&vars=`, chacun omis quand il est vide. Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; au-delà, les champs n’obtiennent aucun lien, et la fenêtre contextuelle indique leur longueur.
- **Ouverture d’un lien.** Les champs se remplissent comme à la saisie (un champ que le lien ne contient pas reste vide, comme chez l’expéditeur) et le scan est expliqué. Tout texte est accepté, comme à la saisie : un format incorrect reçoit l’erreur de Tcl lui-même. Que le lien soit accepté ou non, les valeurs quittent ensuite aussitôt l’adresse de la page elle-même, sans aucune requête : un rechargement, un favori ou le bouton Partager de la page n’emporte donc rien que vous n’ayez choisi de partager.

## Limites

Le moteur suit `Tcl_ScanObjCmd` de Tcl 8.4.6 et a été vérifié face à un véritable interpréteur Tcl 8.4.6 sur des milliers de cas générés. Les résultats entiers qui dépendent de la bibliothèque C de la plateforme sont signalés.

## Sources

- [Tcl 8.4 manual: scan](https://www.tcl-lang.org/man/tcl8.4/TclCmd/scan.htm) (consulté le 03/10/2026)
- [F5 iRules reference: matches_regex](https://clouddocs.f5.com/api/irules/matches_regex.html) (consulté le 02/10/2026)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (consulté le 03/10/2026)
- [Tcl 8.4.6 source code, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (l’interpréteur de référence)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien créé par Partager les résultats
