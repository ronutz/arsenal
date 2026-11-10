## Ce que fait l’outil

Collez une iRule : le linter signale, ligne par ligne, un petit ensemble d’anti-patterns de performance et d’exactitude documentés par F5 et détectés avec un haut niveau de confiance, chacun avec sa gravité, l’élément en cause, la raison pour laquelle il pose problème et la correction. C’est un analyseur statique (sans analyseur syntaxique Tcl, sans exécution) : il ne couvre donc délibérément que les motifs qu’une analyse ligne par ligne peut repérer de façon fiable et avec peu de faux positifs. Il ne remplace pas une mesure : associez-le au calculateur de temps d’exécution des iRules, qui lit de vraies statistiques de temps, pour connaître le coût réel d’une règle. Tout s’exécute localement.

## Ce que l’outil signale

**Les variables de l’espace de noms global** (`$::x`, `set ::x`, le mot-clé `global`) sont de gravité ÉLEVÉE. Le validateur de F5 détecte le mot-clé `global` depuis la v10 et rétrograde le serveur virtuel sur une seule instance TMM (rétrogradation CMP, CMP demotion) : un seul processeur traite alors toutes les connexions de ce serveur virtuel ; les variables globales sont obsolètes depuis la v10. L’ancienne forme `$::datagroup` est pire encore : à partir de la version 11, accéder ainsi à un data group déclenche une erreur d’exécution Tcl et envoie un reset au client. La correction consiste à utiliser l’espace de noms `static::`, compatible CMP, pour les constantes partagées, des variables locales ordinaires pour les données propres à chaque connexion, ou la commande `class` pour les data groups.

**`expr` sans accolades** est de niveau AVERTISSEMENT. Tcl substitue puis réanalyse la forme sans accolades, et peut effectuer une double substitution ; mettre l’expression entre accolades permet au compilateur de bytecode de l’optimiser. La correction est `expr { ... }`.

**`matchclass` / `findclass`** sont de niveau INFO. Toutes deux sont obsolètes depuis la v10 au profit de la commande `class`, qui, selon F5, offre de meilleures fonctionnalités et de meilleures performances. La correction est `class match` / `class search`.

**`regexp` / `regsub`** sont de niveau INFO. Les expressions régulières coûtent sensiblement plus cher qu’un traitement sur chaîne fixe ; quand la correspondance porte sur un préfixe, un suffixe, une valeur exacte ou un glob simple, `string`, `scan`, `switch -glob` ou `class` reviennent moins cher. Quand une expression régulière reste nécessaire, la vue de portabilité de la [boîte à outils regex](/tools/regex) liste les constructions qui se lisent différemment dans les Advanced Regular Expressions de Tcl, la variante qu’elle désigne comme BIG-IP iRules, et en JavaScript ou en PCRE2.

## Ce que l’outil ne signale pas, délibérément

Les variables `static::` (compatibles CMP), `class match` / `class search` et `expr` entre accolades sont corrects et passent sans constat. La persistance, les tables et la commande `session` sont compatibles CMP dans les versions actuelles : elles ne sont donc pas traitées comme des problèmes CMP. Les lignes entièrement en commentaire sont ignorées.

## Partage des résultats

Sous le résumé des constats, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, l’iRule telle que collée, et rien d’autre. Avant toute copie, la fenêtre contextuelle ajoute une mise en garde : une iRule peut nommer des hôtes internes, des pools et des data groups.

Avant même de proposer un lien, la page cherche dans l’iRule les clés et les identifiants écrits en clair là où les propres références de F5 les placent (toutes consultées le 27/10/2026) :

- la phrase secrète de `HTTP::cookie encrypt` et `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html)) ;
- une clé sous la forme de chaîne `AES 128 <hex>`, ou la clé de `AES::encrypt` et `AES::decrypt` écrite en clair ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html)) ;
- la valeur de `-key` ou `-keyhex` sur `CRYPTO::encrypt`, `decrypt`, `sign` et `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html)) ;
- un en-tête `Authorization` ou `Proxy-Authorization` écrit avec `HTTP::header insert` ou `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), dont la [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (sections 11.6.2 et 11.7.2) définit la valeur comme les identifiants ;
- un littéral affecté avec `set` à une variable utilisée à l’un de ces endroits, comme dans l’exemple de `CRYPTO::encrypt` lui-même ;
- et, d’après le contrôle des secrets du site, une clé privée PEM, un JWT, un ID de clé d’accès AWS ou un mot de passe dans une URL.

Quand la page en trouve un, aucun lien n’est créé : la fenêtre contextuelle indique la ligne, et vous remplacez la valeur par une valeur fictive avant d’appuyer de nouveau sur le bouton. Une valeur dont seul le nom évoque un secret (`set static::api_token "..."`) n’empêche pas la création du lien ; la ligne de mise en garde la nomme à la place. Aucun contrôle ne trouve tous les secrets : relisez ce que vous envoyez.

Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; au-delà, une iRule n’obtient aucun lien, et la fenêtre contextuelle indique sa longueur.
- **Ouverture d’un lien.** Le texte remplit la zone comme le ferait un collage, et la page le lit comme elle lit un collage ; l’iRule n’est jamais exécutée. Que le lien soit accepté ou non, les valeurs quittent ensuite aussitôt l’adresse de la page elle-même, sans aucune requête : un rechargement, un favori ou le bouton Partager de la page n’emporte donc rien que vous n’ayez choisi de partager.
