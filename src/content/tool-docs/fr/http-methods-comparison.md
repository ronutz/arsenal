## Ce que fait l’outil

Saisissez d’un à quatre noms de méthodes HTTP (Hypertext Transfer Protocol), et l’outil renvoie les propriétés de chacune au niveau du protocole : si elle est sûre, idempotente et peut être mise en cache, quelle est la sémantique de son corps de requête, si CORS (Cross-Origin Resource Sharing) permet aux navigateurs de l’envoyer sans preflight (la requête OPTIONS de demande d’autorisation qu’un navigateur émet avant toute requête cross-origin non simple), si les formulaires HTML peuvent la produire de façon déclarative, et quelle RFC la définit. Demandez-en deux ou plus (« get vs query ») et il nomme aussi exactement les propriétés qui les distinguent. La table couvre les neuf méthodes de base de la RFC 9110, PATCH (RFC 5789), le trio WebDAV PROPFIND, REPORT et SEARCH, et la ligne vedette : QUERY, enregistrée par la RFC 10008 en juin 2026, première nouvelle méthode HTTP depuis PATCH en 2010.

Sous le champ, un bouton par méthode de la table ajoute cette méthode à la ligne ou l’en retire : une comparaison se construit ainsi sans rien taper ; quand quatre méthodes sont nommées, les autres attendent.

## Un vocabulaire précis

Sûre signifie que le client ne demande aucun changement d’état ; idempotente signifie que répéter la même requête laisse le serveur dans le même état, ce qui rend légitimes les nouvelles tentatives automatiques. Ce sont deux engagements sur l’intention, enregistrés auprès de l’IANA : un cache, un proxy ou une couche de nouvelles tentatives générique peut s’en servir sans rien savoir de votre API. Ni l’un ni l’autre ne dit quoi que ce soit de la charge utile : un corps QUERY peut contenir la même tentative d’injection qu’un corps POST, et c’est pourquoi la note finale de l’outil exige pour QUERY une inspection du niveau de celle de POST.

La mise en cache prend trois valeurs honnêtes dans la table : GET et HEAD forment la paire qui peut être mise en cache ; les réponses à POST et PATCH ne peuvent l’être qu’en présence d’informations de fraîcheur explicites (en pratique, presque jamais) ; QUERY peut l’être par conception, avec l’exigence de la RFC 10008 que la clé de cache intègre le contenu de la requête. C’est le mécanisme qui rend possible la mise en cache d’une requête avec corps, et l’endroit exact où une implémentation de cache négligente tourne à l’empoisonnement de cache (cache poisoning).

La sémantique du corps de requête distingue quatre cas que l’écosystème confond sans cesse : les corps qui sont la raison d’être de la méthode (POST, PUT, PATCH, QUERY, le trio WebDAV), les corps sans sémantique définie que les serveurs peuvent refuser d’emblée (GET, HEAD, DELETE ; la RFC 9110 le dit explicitement), les corps autorisés mais dénués de sens (OPTIONS), et les corps interdits (CONNECT, TRACE).

## QUERY, la ligne intéressante

QUERY est le chaînon manquant que la table rend visible : sûre, idempotente et pouvant être mise en cache comme GET, avec un corps comme POST. Elle existe parce que GET force les requêtes dans l’URL (limites de longueur, casse-tête de l’encodage, fuites dans les journaux et par l’en-tête Referer), tandis que POST /search ment à l’infrastructure : rien dans le protocole ne la marque en lecture seule, donc rien entre les deux extrémités ne peut la mettre en cache ni la retenter. La comparaison « post vs query » montre cinq propriétés qui basculent à la fois ; « get vs query » montre les trois qui comptent pour l’adoption : le corps, le preflight CORS (QUERY n’est pas dans la safelist) et les formulaires HTML (un formulaire avec method="query" se rabat aujourd’hui sur GET et abandonne le corps).

## Exemples commentés

`query` seul donne la ligne complète de la RFC 10008. `get vs query` répond à la question canonique avec trois différences. `post,query` raconte la migration : cinq bascules. `put delete` montre la paire idempotente sans être sûre. `trace` et `connect` montrent les deux méthodes auxquelles un corps est interdit. `search` raconte l’histoire du nom : les premières versions du draft de QUERY s’appelaient SEARCH jusqu’au changement de nom de 2021.

## Partage des résultats

Sous les panneaux, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la ligne telle que saisie, et rien d’autre : d’un à quatre noms de méthodes, qui ne disent rien de vous. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. Les liens du décodeur de messages HTTP qui transmettent une méthode à cette page utilisent le même `#input=` et remplissent le champ de la même façon.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la ligne n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La ligne remplit le champ comme une saisie, et la page compare les méthodes ; rien n’est envoyé nulle part. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Provenance

Chaque valeur sûre ou idempotente reprend la colonne même du registre IANA HTTP Method Registry, recoupée avec la RFC 9110 §9.3, la RFC 10008, la RFC 5789 et les spécifications WebDAV (RFC 4918, 3253, 5323) ; l’appartenance à la safelist CORS suit la spécification Fetch du WHATWG, et l’état des formulaires, la discussion ouverte sur le HTML du WHATWG. Toutes les sources ont été consultées le 20/07/2026. L’outil embarque 19 vecteurs de référence (golden vectors) qui fixent chaque ligne : toute dérive de la table fait échouer le build.
