## Ce que fait l’outil

Collez un JSON Web Key Set et l’outil le détaille clé par clé : pour chaque clé, il lit le type, l’identifiant de clé, l’usage et l’algorithme prévus, ainsi que les paramètres propres au type, et il signale toute clé qui contient des éléments privés. Si vous collez aussi un JWT, il associe le jeton à la clé qui doit le vérifier en comparant les identifiants de clé. Rien ne quitte votre navigateur.

## Qu’est-ce qu’un JWKS

Un JSON Web Key Set (JWKS) est le document JSON qu’un fournisseur d’identité publie, généralement à `/.well-known/jwks.json`, pour que quiconque puisse vérifier les jetons qu’il signe sans secret partagé. C’est simplement une liste de clés :

    { "keys": [ {JWK}, {JWK}, ... ] }

Chaque entrée est une JSON Web Key (JWK) qui décrit une clé : son type (`kty`, comme RSA, EC ou OKP), un identifiant de clé facultatif (`kid`), sa finalité (`use`, généralement `sig` pour la signature ou `enc` pour le chiffrement), l’algorithme auquel elle est associée (`alg`) et les paramètres propres à ce type de clé.

## Éléments publics et privés

Cette distinction est l’enjeu de sécurité de l’outil. Un JWKS publié pour la vérification ne devrait contenir que des clés publiques. Chaque type de clé a des paramètres publics et des paramètres privés : une clé RSA publie son module et son exposant (`n`, `e`) et garde secret son exposant privé (`d`) ; une clé à courbe elliptique publie ses coordonnées (`x`, `y`) et garde secret son scalaire privé (`d`) ; une clé symétrique (`oct`) n’est rien d’autre que le secret (`k`). Si une clé de l’ensemble porte l’un des champs privés, cela signifie que des éléments de clé privée ont été exposés, ce qui est une erreur grave : l’outil le signale donc explicitement.

## Association d’un jeton à sa clé

Un JWT signé nomme généralement, dans son en-tête, l’identifiant (`kid`) de la clé qui l’a signé. Un vérificateur cherche dans le JWKS la clé qui porte ce `kid` et l’utilise. L’outil fait de même : à partir d’un JWT et d’un ensemble de clés, il trouve la clé dont le `kid` correspond à celui du jeton, soit exactement la recherche qu’effectue un vrai vérificateur avant de contrôler la signature. Les paramètres de clé suivent la RFC 7517 et la RFC 7518, avec le type de clé OKP pour les clés à courbe d’Edwards (comme Ed25519) défini dans la RFC 8037.

## Utilisation

Collez un JWKS pour examiner chaque clé et repérer tout élément privé exposé, et collez éventuellement un JWT pour voir quelle clé de l’ensemble est censée le vérifier.

## Partage des résultats

Sous le résumé des clés (en mode Associer un JWT, sous l’association), le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, une copie du jeu de clés : chaque valeur privée y est remplacée par `[redacted]`, et tout autre caractère reste tel que vous l’avez collé. Sa fenêtre contextuelle indique d’abord ce que contient le lien et combien de valeurs ont été remplacées, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Un jeu de clés collé peut contenir des éléments de clé privée, qu’un lien ne doit jamais contenir. La [RFC 7518](https://www.rfc-editor.org/rfc/rfc7518) (consultée le 01/11/2026) définit les membres `d`, `p`, `q`, `dp`, `dq`, `qi` et `oth` d’une clé privée RSA (section 6.3.2, avec les `r`, `d` et `t` de chaque entrée `oth`), le `d` d’une clé privée à courbe elliptique (section 6.2.2) et le `k` d’une clé symétrique (section 6.4.1) ; la [RFC 8037](https://www.rfc-editor.org/rfc/rfc8037) (section 2, consultée le 01/11/2026) attribue à une clé OKP un `d` privé. La copie conserve les noms des membres et ne remplace que leurs valeurs : la page qui l’ouvre signale donc les mêmes éléments privés et explique chaque clé exactement comme la vôtre, puisque cette page n’affiche jamais ces valeurs. Les contrôles du site le vérifient notamment sur les clés privées de l’annexe A.2 et A.3 de la RFC 7517 et de l’annexe A.1 de la RFC 8037.

En mode Associer un JWT, le lien contient aussi l’en-tête du JWT, et rien d’autre du jeton : la page ne lit que l’en-tête, et un JWT est un identifiant au porteur tant qu’il est valide ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), section 1.2, consultée le 01/11/2026). Une zone JWT dont le premier segment n’est pas un en-tête JSON ne transmet rien, si bien qu’un jeton d’accès opaque n’est jamais transmis à sa place ; un en-tête dont le membre `jwk` contient des éléments de clé privée n’obtient pas de lien.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : les valeurs ne sont donc pas envoyées au serveur à l’ouverture du lien ; elles restent dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut les lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La copie remplit la zone du jeu de clés, le mode Associer un JWT s’ouvre quand le lien l’indique et l’en-tête remplit la zone du JWT ; la page explique et associe comme pour un collage, et ne récupère jamais de `jwks_uri`. Un jeu de clés qui ne s’analyse pas ou contient encore une valeur privée, un mode que la page ne propose pas, ou un en-tête qui est plus qu’un en-tête, fait ignorer tout le lien. Dans les deux cas, les valeurs quittent aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
