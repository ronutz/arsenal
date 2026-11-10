## Ce que fait l’outil

L’outil lit une iRule à l’aune de l’« iRules Style Guide » de DevCentral (publié par JRahm avec Jim_Deucker le 22 décembre 2022), y ajoute deux points soulevés dans le fil de commentaires du guide, et la soumet à une véritable analyse syntaxique Tcl 8.4. L’iRule est analysée, jamais exécutée. Chaque constat nomme la règle du guide dont il découle, la ligne et ce qu’il faut changer ; les lignes signalées sont marquées sur une copie numérotée de l’iRule.

## Ce que vérifie l’outil

- **Réglages de l’éditeur (E1 à E3) :** tabulations et indentations qui ne sont pas des multiples de 4 espaces, lignes de plus de 100 colonnes (avertissement au-delà de 120), fins de ligne Windows, espaces en fin de ligne, saut de ligne final manquant, et caractères non ASCII, chacun désigné par son point de code, son nom Unicode officiel et sa colonne.
- **Règles numérotées :** caractères qui cassent le code (R1), limite de taille de F5 (R2), `{` isolée sur sa propre ligne ou `else` sur une nouvelle ligne (R4), commentaires en fin de ligne, commentaires sans espace et commentaires entre les motifs d’un `switch` (R6), plusieurs commandes sur une même ligne (R7), `if` sur une seule ligne (R8), état stocké sous forme de mots comme `yes` (R9), `and` / `or` / `not` de F5 (R10), `}{` sans espace ou mot-clé collé à son accolade (R11), expressions sans accolades (R12), variables sans espaces autour dans les expressions (R13) ou sans accolades autour du nom (R14), `switch` et `table` sans `--` (R15), évènements sans priorité (R16), entrées `table` sans délai d’expiration (timeout) ni durée de vie (lifetime) (R17 ; à défaut, la référence `table` de F5 applique un délai d’expiration de 180 secondes et une durée de vie illimitée), noms `static::` sans préfixe (R18), indicateurs de débogage `static::` (R19) et code mis en commentaire (R20).
- **Issus du fil de commentaires (D1, D2) :** `==` ou `!=` avec un texte, là où `eq` ou `ne` est voulu (D1) ; `break` ou `continue` sans boucle autour, `break` dans une branche de `switch` à l’intérieur d’une boucle, et `return` dans une branche de `switch` (D2).
- **Syntaxe :** une erreur signalée par l’analyseur syntaxique de Tcl 8.4, comme `}{` sans espace (« extra characters after close-brace »), signifie que l’iRule ne peut pas du tout être chargée.

## Les caractères qui se cachent dans le code

La première règle du guide porte sur les guillemets typographiques et les espaces insécables qu’un traitement de texte glisse dans le code. Le vérificateur classe chaque caractère non ASCII à l’aide de l’Unicode Character Database 18.0.0 : il trouve donc toute la famille, pas seulement ces deux-là :

- **R1, erreur :** les caractères invisibles (la liste Default_Ignorable_Code_Point d’Unicode : espaces et liants sans chasse, indicateur d’ordre des octets, trait d’union conditionnel, caractères de contrôle bidirectionnels), les espaces autres que l’espace ASCII (insécable, cadratin, idéographique et autres) et les guillemets typographiques. Testé dans tclsh 8.4.6 : le caractère espace insécable soude deux mots en un seul nom de commande, les guillemets courbes ne regroupent pas les mots, et un caractère espace sans chasse après une accolade fermante arrête la règle avec « extra characters after close-brace ».
- **E3, avertissement :** les tirets autres que le trait d’union-signe moins ASCII (hyphen-minus). Tcl ne les lit ni comme le tiret d’une option ni comme un signe moins : un `switch` avec un tiret demi-cadratin (U+2013) tapé à la place de `--` prend le tiret pour la valeur, et ne correspond silencieusement à rien.
- **E3, remarque :** les autres caractères qui ressemblent à de l’ASCII (lettres pleine chasse, points de suspension, chiffres romains), et tout autre caractère non ASCII.

Cela compte pour le guide lui-même : dans sa version consultée le 3 octobre 2026, son exemple `RULE_INIT` comporte un caractère espace sans chasse après l’accolade fermante, et son exemple de débogage a une ligne qui ne contient que ce caractère : copier l’un ou l’autre tel quel casse l’iRule.

## La limite de taille

F5 K9204 fixe la limite à 65 520 caractères ; BIG-IP refuse d’enregistrer ou de charger une iRule plus longue, avec une erreur qui indique « Max string size exceeded » et « max:65520 ». Le guide arrondit cette valeur à 64 Ko. Le vérificateur compte les caractères et les octets qu’ils occupent en UTF-8, et signale R2 quand l’un ou l’autre dépasse 65 520.

## Issus du fil de commentaires

- **D1 :** Kai Wilke a fait remarquer que l’exemple de la règle 10 du guide compare du texte avec `==`, et les auteurs ont accepté d’ajouter un point sur `eq` / `ne`. `==` compare en tant que nombres dès que les deux côtés ressemblent à des nombres : en Tcl 8.4.6, `10 == 012` et `1 == "0x0000001"` sont tous deux vrais. Le document How To Write Fast Rules de F5 demande de comparer les nombres à des nombres et les chaînes à des chaînes.
- **D2 :** Juergen Mang a noté que les branches de `switch` n’ont besoin ni de `return` ni de `break` pour s’arrêter. Une branche de `switch` ne se poursuit jamais dans la suivante, `return` quitte tout l’évènement (page `return` de F5), et `break` sans boucle autour est une erreur en Tcl 8.4.6 (vérifié dans le corps d’une proc). F5 ne documente pas ce que le TMM en fait dans le corps d’un évènement.

## Partage des résultats

Sous le verdict, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, l’iRule telle que collée, et rien d’autre. Avant toute copie, la fenêtre contextuelle ajoute une mise en garde : une iRule peut nommer des hôtes internes, des pools et des data groups.

Avant même de proposer un lien, la page cherche dans l’iRule les clés et les identifiants écrits en clair là où les propres références de F5 les placent (toutes consultées le 27/10/2026) :

- la phrase secrète de `HTTP::cookie encrypt` et `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html)) ;
- une clé sous la forme de chaîne `AES 128 <hex>`, ou la clé de `AES::encrypt` et `AES::decrypt` écrite en clair ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html)) ;
- la valeur de `-key` ou `-keyhex` sur `CRYPTO::encrypt`, `decrypt`, `sign` et `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html)) ;
- un en-tête `Authorization` ou `Proxy-Authorization` écrit avec `HTTP::header insert` ou `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), dont la [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (sections 11.6.2 et 11.7.2) définit la valeur comme les identifiants ;
- un littéral affecté avec `set` à une variable utilisée à l’un de ces endroits, comme dans l’exemple de `CRYPTO::encrypt` lui-même ;
- et, d’après le contrôle des secrets du site, une clé privée PEM, un JWT, un ID de clé d’accès AWS ou un mot de passe dans une URL.

Quand la page en trouve un, aucun lien n’est créé : la fenêtre contextuelle indique la ligne, et vous remplacez la valeur par une valeur fictive avant d’appuyer de nouveau sur le bouton. Une valeur dont seul le nom évoque un secret (`set static::api_token "..."`) n’empêche pas la création du lien ; la ligne de mise en garde la nomme à la place. Aucun contrôle ne trouve tous les secrets : relisez ce que vous envoyez.

Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; au-delà, une iRule n’obtient aucun lien, et la fenêtre contextuelle indique sa longueur. F5 autorise une iRule de 65 520 caractères au plus (K9204) : une iRule longue peut donc passer ce vérificateur et rester trop longue pour un lien.
- **Ouverture d’un lien.** Le texte remplit la zone comme le ferait un collage, et la page le lit comme elle lit un collage ; l’iRule n’est jamais exécutée. Que le lien soit accepté ou non, les valeurs quittent ensuite aussitôt l’adresse de la page elle-même, sans aucune requête : un rechargement, un favori ou le bouton Partager de la page n’emporte donc rien que vous n’ayez choisi de partager.

## Limites

- Les variables de tableau (arrays) comme `$static::pools($key)` sont du Tcl valide, mais le moteur Tcl du site ne les modélise pas. Le vérificateur lit chacune comme une variable simple, poursuit la vérification du reste de l’iRule et le signale dans une remarque.
- Certaines règles ne peuvent pas être évaluées à partir du seul texte. Savoir si une ligne commençant par `#` est du code mis en commentaire ou un commentaire auquel il manque son espace relève d’une supposition fondée sur le premier mot : ces constats sont donc des remarques.
- La règle R3 (découper l’iRule en blocs fonctionnels) est un choix de conception que le vérificateur ne juge pas. R5 (l’indentation de 4 espaces reportée dans les valeurs imbriquées comme les branches de `switch`) est couverte par le contrôle de l’indentation. Le réglage d’éditeur qui recommande d’éviter les continuations de ligne n’est pas vérifié.

## Sources

- [F5 DevCentral: iRules Style Guide, avec son fil de commentaires](https://community.f5.com/t/irules-style-guide/71151) (consulté le 03/10/2026)
- [F5 K9204: iRules are limited to 65,520 characters](https://my.f5.com/manage/s/article/K9204) (consulté le 03/10/2026)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (consulté le 03/10/2026)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (consulté le 03/10/2026)
- [F5 iRules reference: How To Write Fast Rules](https://clouddocs.f5.com/api/irules/HowToWriteFastRules.html) (consulté le 03/10/2026)
- [F5 iRules reference: return](https://clouddocs.f5.com/api/irules/return.html) (consulté le 03/10/2026)
- [F5 iRules reference: priority](https://clouddocs.f5.com/api/irules/priority.html) (consulté le 03/10/2026)
- [F5 iRules reference: table](https://clouddocs.f5.com/api/irules/table.html) (consulté le 03/10/2026)
- [Tcl 8.4 manual: switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (consulté le 03/10/2026)
- [Tcl 8.4 manual: break](https://www.tcl-lang.org/man/tcl8.4/TclCmd/break.htm) (consulté le 03/10/2026)
- [Unicode Character Database 18.0.0: PropList.txt](https://www.unicode.org/Public/UCD/latest/ucd/PropList.txt) (consulté le 03/10/2026)
- [Unicode Character Database 18.0.0: DerivedCoreProperties.txt](https://www.unicode.org/Public/UCD/latest/ucd/DerivedCoreProperties.txt) (consulté le 03/10/2026)
- [Unicode Character Database 18.0.0: UnicodeData.txt](https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt) (consulté le 03/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien créé par Partager les résultats
- [F5 iRules reference: HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html), [AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html), [CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html) et [HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html) (consultés le 27/10/2026) : les endroits où une iRule contient une phrase secrète, une clé ou des identifiants, qui empêchent la création d’un lien Partager les résultats
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (consultée le 27/10/2026) : sections 11.6.2 et 11.7.2, les valeurs Authorization et Proxy-Authorization sont des identifiants
