## Ce que fait l’outil

L’outil évalue une expression comme le font `expr`, `if` et `while` dans une iRule, et montre toute l’évaluation : la valeur et la façon dont elle est stockée, l’expression avec les opérandes de chaque opérateur entre parenthèses pour rendre la priorité visible, un arbre de chaque étape et, pour une comparaison, ce que `==`, `eq`, `<` et `>` font chacun des deux mêmes opérandes. Les variables reçoivent leurs valeurs de commandes `set` ordinaires : les guillemets et les accolades se comportent donc exactement comme dans une iRule.

Deux modes : **Tcl 8.4** (Tcl 8.4.6 standard, la base que nomme F5 dans K6091) et **iRules**, qui ajoute les opérateurs documentés par F5 (`contains`, `starts_with`, `ends_with`, `equals`, `matches_glob`, `matches_regex`, `and`, `or`, `not`) et des commandes de requête comme `[HTTP::uri]`, auxquelles répond une requête d’exemple modifiable.

## Lecture de l’arbre

Chaque case représente une partie de l’expression : son texte source, une flèche et ce qu’elle a produit. Les opérandes se placent sous leur opérateur. Les remarques sous une case indiquent ce qui s’y est passé, par exemple « Comparaison en tant qu’entiers : 10 et 10 » pour `$x == $y` quand `x` vaut `012`, ou « Comparaison textuelle, car le côté gauche n’est pas un nombre ». Une partie marquée « jamais évalué » a été ignorée par `&&`, `||` ou `?:`.

## Bon à savoir

- `==` et les autres opérateurs de comparaison comparent des nombres quand les deux côtés se lisent comme des nombres, et du texte sinon. `eq` et `ne` comparent toujours du texte.
- Dans une comparaison de texte, ce sont les codes des caractères qui décident : toute lettre majuscule se classe donc avant toute lettre minuscule, et `"bench" < "Chair"` est faux.
- `true == 1` est faux : `true` est un mot booléen, pas un nombre, et la comparaison porte donc sur des textes.
- Tcl 8.4 n’a pas d’opérateur `**` ; `2 ** 3` est une erreur de syntaxe.
- La division entière arrondit vers moins l’infini (`7 / -2` donne `-4`) et un reste prend le signe du diviseur.
- Un littéral comme `08` écrit dans l’expression est rejeté à la compilation de l’expression, avant qu’aucune de ses parties ne s’exécute.
- Mettez vos expressions entre accolades. Sans accolades, Tcl substitue le texte deux fois, ce qui est plus lent et permet à des données de s’exécuter comme du code (F5 K57410758 et K15650046). L’outil d’exécution pas à pas des scripts le montre en action.

## Partage des résultats

Sous le résultat, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient ce que lit l’évaluation, désigné par nom : l’expression sous la forme `#input=`, les commandes set sous la forme `&setup=`, `&mode=irules` en mode iRules et, dans ce mode, les valeurs d’exemple de `HTTP::uri` et `HTTP::host` si vous les avez modifiées (`&uri=`, `&host=`). Le Tcl standard est le mode par défaut et n’est pas inclus, pas plus qu’une valeur d’exemple que le Tcl standard ne lit pas. Les commandes set sont l’endroit où atterrissent les valeurs copiées d’une iRule : la page passe donc chaque champ que contiendrait le lien au même contrôle des secrets que les lecteurs d’iRules du site.

Avant même de proposer un lien, elle cherche les clés et les identifiants écrits en clair là où les propres références de F5 les placent (toutes consultées le 27/10/2026) :

- la phrase secrète de `HTTP::cookie encrypt` et `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html)) ;
- une clé sous la forme de chaîne `AES 128 <hex>`, ou la clé de `AES::encrypt` et `AES::decrypt` écrite en clair ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html)) ;
- la valeur de `-key` ou `-keyhex` sur `CRYPTO::encrypt`, `decrypt`, `sign` et `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html)) ;
- un en-tête `Authorization` ou `Proxy-Authorization` écrit avec `HTTP::header insert` ou `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), dont la [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (sections 11.6.2 et 11.7.2) définit la valeur comme les identifiants ;
- un littéral affecté avec `set` à une variable utilisée à l’un de ces endroits, comme dans l’exemple de `CRYPTO::encrypt` lui-même ;
- et, d’après le contrôle des secrets du site, une clé privée PEM, un JWT, un ID de clé d’accès AWS ou un mot de passe dans une URL.

Quand la page en trouve un, aucun lien n’est créé : la fenêtre contextuelle indique le champ et la ligne, et vous remplacez la valeur par une valeur fictive avant d’appuyer de nouveau sur le bouton. Une valeur dont seul le nom évoque un secret (`set static::api_token "..."`) n’empêche pas la création du lien ; la ligne de mise en garde la nomme à la place. Aucun contrôle ne trouve tous les secrets : relisez ce que vous envoyez.

Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; au-delà, un ensemble de champs n’obtient aucun lien, et la fenêtre contextuelle indique sa longueur.
- **Ouverture d’un lien.** Les champs se remplissent comme à la saisie (une requête d’exemple modifiée par le lien s’affiche dépliée), et la page les met en attente : une remarque indique qu’ils viennent d’un lien partagé, et rien n’est évalué tant que vous n’appuyez pas sur **Évaluer** ou ne modifiez pas un champ. L’interpréteur pédagogique n’exécute jamais de lui-même le texte d’un lien. Un mode autre que `tcl` ou `irules`, ou une valeur d’exemple en mode Tcl standard, fait ignorer le lien en entier. Que le lien soit accepté ou non, les valeurs quittent ensuite aussitôt l’adresse de la page elle-même, sans aucune requête : un rechargement, un favori ou le bouton Partager de la page n’emporte donc rien que vous n’ayez choisi de partager.

## Limites

F5 documente ses opérateurs en toutes lettres, mais pas leur priorité par rapport aux opérateurs Tcl ; l’outil place `contains`, `starts_with` et les autres au niveau de `==`, et `and` et `or` au niveau de `&&` et `||`. `rand()` et `srand()` sont refusés, car leurs résultats ne sont pas reproductibles. Les commandes exécutées à l’intérieur d’une expression (entre crochets) utilisent le même petit interpréteur que l’outil d’exécution pas à pas, limité à 2000 commandes. Cet outil n’est pas proposé via l’API, car il exécute le Tcl que vous lui donnez.

## Sources

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (consulté le 03/10/2026)
- [Tcl 8.4 manual: expr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/expr.htm) (consulté le 03/10/2026)
- [F5 iRules reference: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (consulté le 02/10/2026)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (consulté le 03/10/2026)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (consulté le 03/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien créé par Partager les résultats
- [F5 iRules reference: HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html), [AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html), [CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html) et [HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html) (consultés le 27/10/2026) : les endroits où une iRule contient une phrase secrète, une clé ou des identifiants, qui empêchent la création d’un lien Partager les résultats
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (consultée le 27/10/2026) : sections 11.6.2 et 11.7.2, les valeurs Authorization et Proxy-Authorization sont des identifiants
