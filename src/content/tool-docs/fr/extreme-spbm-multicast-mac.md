## Ce que fait l’outil

Il fonctionne dans les deux sens. Donnez-lui le nickname d’un nœud et un I-SID : il construit l’adresse de groupe que ce nœud utilisera pour ce service. Collez une adresse tirée de `show isis spbm multicast-fib` : il vous dit à quel arbre appartient l’entrée et quel service elle transporte.

## La règle

Une adresse de groupe SPBM n’est ni configurée ni apprise. Elle est assemblée à partir de deux nombres que chaque nœud possède déjà :

- **trois premiers octets** : le préfixe fixe `0x30000` combiné au nickname de 20 bits
- **trois derniers octets** : l’I-SID de 24 bits

Ainsi, le nickname `0.00.10` transportant l’I-SID 100 donne `03:00:10:00:00:64`. Chaque nœud de l’arbre du plus court chemin (shortest path tree) calcule cette même adresse à partir de la base de données d’état des liens sans qu’on la lui communique, et c’est précisément pour cela que SPBM n’a pas besoin d’apprentissage des adresses MAC du backbone.

Le même I-SID enraciné sur un autre nœud produit une autre adresse : un arbre par racine.

## Le sens qui rend vraiment service

La lecture de la FIB multicast. C’est une colonne d’hexadécimal, et la question est toujours la même : à qui appartient cet arbre, et quel service transporte-t-il ? Les deux réponses sont dans l’adresse. `03:00:41:00:04:4d` correspond au nickname `0.00.41` transportant l’I-SID 1101. Rapprochez le nickname de la colonne SYSID ou HOST-NAME de la même sortie pour mettre un nom sur le nœud.

## Une ambiguïté, déclarée plutôt que cachée

Les bits 16 et 17 appartiennent au préfixe fixe. Un nickname dont le premier champ les met à 1 produit une adresse qui ne peut pas être décodée en un nickname unique. Tous les exemples documentés utilisent un premier champ à 0. Si vous saisissez autre chose, l’outil construit l’adresse et vous indique que le sens inverse n’est pas vérifié, plutôt que de renvoyer un nickname qu’il ne peut pas garantir.

## Limites assumées

L’outil calcule uniquement l’adresse de groupe. Le choix du B-VID, l’arbre du plus court chemin lui-même, l’adjacence IS-IS et l’adresse MAC unicast du backbone sont hors périmètre ; la B-MAC unicast est l’adresse du châssis et ne se déduit de rien. L’I-SID est traité comme un nombre ; savoir si une valeur donnée est un VSN de couche 2 ou un VSN de couche 3 relève de la configuration, que l’outil ne modélise pas.

## Partage des résultats

Sous l’adresse et son résumé, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les champs de l’opération dont provient la réponse : le nickname et l’I-SID tels que saisis (`nickname`, `isid`) pour une adresse que vous avez construite, ou l’adresse telle que saisie (`input`) pour une adresse que vous avez décomposée ; un lien ne contient jamais les deux. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : les champs ne sont donc pas envoyés au serveur à l’ouverture du lien ; ils restent dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut les lire.

- **Ouverture d’un lien.** Les champs de l’opération sont remplis et la page calcule, comme lors d’une saisie ; rien n’est recherché. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
