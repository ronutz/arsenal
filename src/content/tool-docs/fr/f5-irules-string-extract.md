## Ce que fait l’outil

`findstr`, `substr` et `getfield` sont des commandes que F5 ajoute aux iRules pour extraire une partie d’une valeur. L’outil exécute celle que vous choisissez sur votre chaîne et marque le résultat sur une règle graduée : la chaîne recherchée trouvée, les caractères sautés, le terminateur, les séparateurs et le champ renvoyé. À côté, le Tcl standard qui fait le même travail s’exécute dans le même moteur, pour que vous voyiez si les deux concordent vraiment.

## Les trois commandes

- `findstr string search ?skip? ?terminator?` trouve `search`, avance de `skip` caractères à partir du début de la correspondance, puis renvoie le texte jusqu’au terminateur. L’exemple de F5 : `findstr "<sip:+12065551234@sip.example.com>" "@" 1 ">"` renvoie `sip.example.com`.
- `substr string skip ?terminator?` commence à l’index `skip`, 0 désignant le premier caractère. `substr "abcdefghijklm" 2 "gh"` renvoie `cdef`.
- `getfield string separator field` découpe la chaîne à chaque occurrence du séparateur, qui peut être un caractère ou une chaîne, et renvoie ce champ, en comptant à partir de 1.

Pour `findstr` et `substr`, un terminateur numérique est une longueur (au plus ce nombre de caractères, moins si la chaîne se termine avant) ; tout autre terminateur est un texte devant lequel s’arrêter. Les tests de l’outil reproduisent exactement tous les exemples publiés par F5 pour ces commandes.

## Ce que F5 ne documente pas

Là où les pages de F5 sont muettes, l’outil indique l’hypothèse qu’il a retenue, marquée « Non documenté par F5 » :

- `findstr` quand la chaîne recherchée est absente. L’outil renvoie une chaîne vide. F5 présente `findstr` comme l’équivalent de `string range` avec `string first`, mais cet équivalent renvoie la chaîne entière dans ce cas : les deux descriptions ne peuvent donc pas être justes toutes les deux.
- Un nombre égal à 0. La règle de F5, qui prend autant de caractères que ce nombre (« that many characters »), ne renverrait rien, mais l’exemple de `substr` avec 0 que donne F5 lui-même renvoie le reste de la chaîne ; l’outil suit l’exemple, et une note de contributeur sur la page de référence de l’API de F5 signale que 0 ne fonctionnait pas en 11.5.4 et en 11.6.0.
- Un saut au-delà de la fin, un saut ou un nombre négatif, un terminateur vide, et un numéro de champ de `getfield` hors des champs existants.

Vérifiez ces cas sur un BIG-IP avant de vous y fier.

## Partage des résultats

Sous le résultat, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient le formulaire, désigné par nom : la chaîne sous la forme `#input=`, la commande sous la forme `&command=`, et les champs de la commande qui contiennent quelque chose (`&search=`, `&skip=`, `&terminator=`, `&separator=`, `&field=`). Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; au-delà, les champs n’obtiennent aucun lien, et la fenêtre contextuelle indique leur longueur.
- **Ouverture d’un lien.** La commande, la chaîne et les champs se remplissent comme à la saisie (un champ que le lien ne contient pas reste vide ; un lien sans commande ouvre `findstr`, la première de la page) et le résultat est calculé. Une commande inconnue ou un champ que la commande ne prend pas fait ignorer le lien en entier. Que le lien soit accepté ou non, les valeurs quittent ensuite aussitôt l’adresse de la page elle-même, sans aucune requête : un rechargement, un favori ou le bouton Partager de la page n’emporte donc rien que vous n’ayez choisi de partager.

## Sources

- [F5 tmsh reference: findstr](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_findstr.html) (consulté le 03/10/2026)
- [F5 tmsh reference: substr](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_substr.html) (consulté le 03/10/2026)
- [F5 tmsh reference: getfield](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_getfield.html) (consulté le 03/10/2026)
- [F5 iRules reference: substr, avec la note de contributeur sur le nombre 0](https://clouddocs.f5.com/api/irules/substr.html) (consulté le 02/10/2026)
- [Tcl 8.4 manual: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (consulté le 03/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien créé par Partager les résultats
