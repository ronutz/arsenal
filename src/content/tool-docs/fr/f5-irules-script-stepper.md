## Ce que fait l’outil

L’outil exécute un court extrait commande par commande et montre chaque commande de trois façons : telle qu’elle est écrite, sous la forme des mots qu’elle a réellement reçus une fois que Tcl a substitué les variables, les commandes et les barres obliques inverses, et ce qu’elle a renvoyé. Sous chaque commande s’affichent les variables qu’elle a modifiées, la branche qu’a prise `if` ou `switch`, et chaque expression qu’elle a évaluée, sous forme d’arbre. Les lignes de journal sont collectées, et les actions comme `pool`, `HTTP::redirect`, `drop` ou `reject` sont enregistrées plutôt qu’exécutées.

En mode **iRules**, les commandes de requête (`HTTP::uri`, `HTTP::host`, `HTTP::method`, `HTTP::header`, `IP::client_addr` et d’autres) répondent à partir d’une requête d’exemple modifiable, et un bloc `when` exécute son corps une fois, comme si l’évènement s’était déclenché.

## Lecture des étapes

Les commandes sont listées dans l’ordre où elles ont démarré. Une commande en retrait s’est exécutée à l’intérieur de celle du dessus : dans son corps, ou entre crochets pendant la construction des mots de la commande extérieure, ce qui signifie qu’elle s’est terminée avant l’exécution de la commande extérieure. « reçu » montre les mots tels que la commande les a reçus ; le contour en pointillés marque où chaque mot commence et se termine, ce que décident les guillemets et les accolades.

## Bon à savoir

- `"$a$b"` joint deux valeurs sans rien entre elles ; `"$a $b"` conserve l’espace.
- `append` ajoute le texte exactement tel quel ; `concat` supprime les espaces aux deux extrémités de chaque argument, écarte les arguments vides et joint le reste avec des espaces simples ; `lappend` ajoute des éléments de liste.
- Pour `foreach`, une chaîne qui contient des espaces est une liste : `foreach item "red green blue"` s’exécute trois fois.
- `incr` lit `010` comme l’octal 8 : le résultat est donc 9.
- `switch` lit tout mot commençant par un tiret comme une option. Placez `--` avant la valeur (F5 K15650046), sinon une valeur comme `-foo` casse la commande.
- Un `expr` sans accolades substitue deux fois : si une variable contient `[log local0. "x"]`, cette commande s’exécute (F5 K57410758). L’exemple « Double substitution » le montre.

## Partage des résultats

Sous l’indication de la façon dont l’exécution s’est terminée, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient ce que lit l’exécution, désigné par nom : le script sous la forme `#input=`, `&mode=irules` en mode iRules et, dans ce mode, chaque champ de la requête d’exemple que vous avez modifié (`&uri=`, `&host=`, `&method=`, `&agent=` pour le User-Agent). Le Tcl standard est le mode par défaut et n’est pas inclus, pas plus qu’une valeur d’exemple que le Tcl standard ne lit pas. Un script est généralement un morceau d’une vraie iRule : avant toute copie, la fenêtre contextuelle ajoute donc une mise en garde (un script peut nommer des hôtes internes, des pools et des data groups), et la page passe chaque champ que contiendrait le lien au même contrôle des secrets que les lecteurs d’iRules du site.

Avant même de proposer un lien, elle cherche les clés et les identifiants écrits en clair là où les propres références de F5 les placent (toutes consultées le 27/10/2026) :

- la phrase secrète de `HTTP::cookie encrypt` et `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html)) ;
- une clé sous la forme de chaîne `AES 128 <hex>`, ou la clé de `AES::encrypt` et `AES::decrypt` écrite en clair ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html)) ;
- la valeur de `-key` ou `-keyhex` sur `CRYPTO::encrypt`, `decrypt`, `sign` et `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html)) ;
- un en-tête `Authorization` ou `Proxy-Authorization` écrit avec `HTTP::header insert` ou `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), dont la [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (sections 11.6.2 et 11.7.2) définit la valeur comme les identifiants ;
- un littéral affecté avec `set` à une variable utilisée à l’un de ces endroits, comme dans l’exemple de `CRYPTO::encrypt` lui-même ;
- et, d’après le contrôle des secrets du site, une clé privée PEM, un JWT, un ID de clé d’accès AWS ou un mot de passe dans une URL.

Quand la page en trouve un, aucun lien n’est créé : la fenêtre contextuelle indique le champ et la ligne, et vous remplacez la valeur par une valeur fictive avant d’appuyer de nouveau sur le bouton. Une valeur dont seul le nom évoque un secret (`set static::api_token "..."`) n’empêche pas la création du lien ; la ligne de mise en garde la nomme à la place. Aucun contrôle ne trouve tous les secrets : relisez ce que vous envoyez.

Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; au-delà, un script n’obtient aucun lien, et la fenêtre contextuelle indique sa longueur.
- **Ouverture d’un lien.** Les champs se remplissent comme à la saisie (une requête d’exemple modifiée par le lien s’affiche dépliée), et la page met le script en attente : une remarque indique qu’il vient d’un lien partagé, et rien ne s’exécute tant que vous n’appuyez pas sur **Exécuter** ou ne modifiez pas un champ. L’interpréteur pédagogique n’exécute jamais de lui-même le texte d’un lien. Un mode autre que `tcl` ou `irules`, ou une valeur d’exemple en mode Tcl standard, fait ignorer le lien en entier. Que le lien soit accepté ou non, les valeurs quittent ensuite aussitôt l’adresse de la page elle-même, sans aucune requête : un rechargement, un favori ou le bouton Partager de la page n’emporte donc rien que vous n’ayez choisi de partager.

## Limites

Il s’agit d’un interpréteur pédagogique, pas du TMM. Il modélise les commandes listées dans le code de cette page et s’arrête après 2000 commandes, au-delà de 1 000 000 caractères par valeur et à 200 niveaux d’imbrication. Les tableaux Tcl (arrays), `proc`, `regexp`, `table`, `after` et le système de fichiers ne sont pas modélisés ; les commandes que F5 désactive dans les iRules (K36322151) ne sont pas disponibles non plus. Le déroulement temporel des évènements, l’état des connexions et les autres évènements sont hors du périmètre. L’outil n’est pas proposé via l’API, car il exécute le Tcl que vous lui donnez.

## Sources

- [Tcl 8.4 manual: Tcl (les règles de substitution)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (consulté le 03/10/2026)
- [Tcl 8.4 manual: append](https://www.tcl-lang.org/man/tcl8.4/TclCmd/append.htm), [concat](https://www.tcl-lang.org/man/tcl8.4/TclCmd/concat.htm), [lappend](https://www.tcl-lang.org/man/tcl8.4/TclCmd/lappend.htm), [incr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/incr.htm) et [switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (consultés le 03/10/2026)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (consulté le 03/10/2026)
- [F5 K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)](https://my.f5.com/manage/s/article/K36322151) (consulté le 03/10/2026)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (consulté le 03/10/2026)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (consulté le 03/10/2026)
- [F5 iRules reference: log](https://clouddocs.f5.com/api/irules/log.html) (consulté le 02/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien créé par Partager les résultats
- [F5 iRules reference: HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html), [AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html), [CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html) et [HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html) (consultés le 27/10/2026) : les endroits où une iRule contient une phrase secrète, une clé ou des identifiants, qui empêchent la création d’un lien Partager les résultats
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (consultée le 27/10/2026) : sections 11.6.2 et 11.7.2, les valeurs Authorization et Proxy-Authorization sont des identifiants
