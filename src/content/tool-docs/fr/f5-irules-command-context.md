# Analyseur des contextes de commandes iRules

Une iRule, c’est du Tcl assorti d’un contrat : le code s’exécute quand des évènements se déclenchent, les commandes sont valides dans certains évènements et pas dans d’autres, et une poignée de constructions vous coûtent en silence tous les cœurs de processeur sauf un. Cet outil vous relit ce contrat.

Collez une iRule : chaque bloc `when` s’affiche sous forme de carte. L’identité de l’évènement provient de la Master List of iRule Events de clouddocs, condensée fidèlement, avec son module et un lien vers sa page de référence ; les évènements absents de la table de l’outil, limitée au périmètre BIG-IP LTM (Local Traffic Manager), sont tout de même analysés, et signalés plutôt que devinés. Les commandes du bloc sont inventoriées, avec ou sans espace de noms, chacune liée directement à sa page de référence.

Quand un évènement apparaît dans plusieurs blocs, l’ordre d’évaluation s’affiche selon les règles documentées de la commande priority : valeurs de 0 à 1000, 500 par défaut, la plus basse s’exécute d’abord, à priorité égale l’ordre d’insertion s’applique, et, entre plusieurs iRules d’un même serveur virtuel, l’ordre de la liste des règles départage les égalités restantes.

L’audit CMP est la partie la plus utile, et chaque constat renvoie à la page CMP Compatibility. Les variables globales ne sont pas compatibles CMP ; le validateur détecte la forme globale depuis la v10, et le serveur virtuel est rétrogradé, ce qui signifie que chaque connexion qu’il traite aboutit sur un seul TMM. L’alternative documentée pour les valeurs statiques partagées est l’espace de noms `static::`, et l’outil le rappelle dès qu’il voit une variable globale. Les clés générées dans RULE_INIT existent en une instance par TMM, si bien que le déchiffrement d’un TMM à l’autre échoue ; les profils de statistiques comptent par instance TMM. L’audit nomme chacun de ces points là où il les voit.

Une précision, par souci d’honnêteté, voulue dès la conception : les listes de validité des commandes par évènement figurent sur la page de référence de chaque commande et varient selon la version ; l’outil renvoie donc vers la page de chaque commande plutôt que de reproduire des tables de validité qu’il n’a pas vérifiées. Un nom d’évènement seul affiche sa carte ; le mot `events` affiche le catalogue regroupé par module.

L’iRule est analysée et lue, jamais exécutée. Tout s’exécute localement ; rien de ce que vous collez ne quitte la page.

## Partage des résultats

En haut de la lecture, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la zone (une iRule, un nom d’évènement ou `events`) telle que collée, et rien d’autre. Avant toute copie, la fenêtre contextuelle ajoute une mise en garde : une iRule peut nommer des hôtes internes, des pools et des data groups.

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
