## Ce que fait l’outil

Collez vos directives de cache, la requête et la réponse de l’upstream. L’outil répond à **deux questions distinctes** : cette réponse sera-t-elle **stockée**, et une requête ultérieure correspondante sera-t-elle **servie** à partir d’elle ? Derrière chaque réponse se trouve le parcours ordonné des règles, ainsi que la clé de cache calculée.

Elles sont séparées à dessein. Une réponse peut être parfaitement mise en cache sans jamais être servie, parce que la clé diffère ; une réponse peut être servie alors qu’elle ne devrait pas l’être, parce que la clé ignore un élément qui comptait.

## Les règles de stockage, dans l’ordre

La mise en cache est entièrement désactivée tant que `proxy_cache` ne nomme pas de zone : c’est de loin la raison la plus fréquente pour laquelle rien n’est jamais mis en cache. Seules les méthodes de `proxy_cache_methods` sont mises en cache, GET et HEAD par défaut. Une réponse qui porte `Set-Cookie` n’est pas stockée, car elle est présumée propre à un utilisateur. Un `Cache-Control: no-cache`, `no-store` ou `private` venant de l’upstream empêche le stockage. Un statut sans `proxy_cache_valid` ni en-tête de fraîcheur n’a pas de durée de vie sous laquelle être stocké. Enfin, `proxy_no_cache` avec une valeur non vide et non nulle empêche l’écriture.

## La paire que l’on intervertit

`proxy_no_cache` empêche l’**écriture**. `proxy_cache_bypass` saute la **recherche** dans le cache, mais écrit quand même le résultat. Les deux se lisent comme des synonymes et sont des contraires sur la moitié qui compte : utiliser bypass là où vous vouliez no_cache remplit le cache exactement avec ce que vous cherchiez à en écarter.

## L’asymétrie à l’origine des fuites

NGINX exclut du stockage les **réponses** qui portent des cookies. Il n’empêche **pas** les **requêtes** qui portent des cookies de recevoir une entrée partagée.

C’est généralement sans conséquence, car les réponses personnalisées n’ont jamais été stockées, jusqu’au jour où quelqu’un ajoute `proxy_ignore_headers Set-Cookie` pour que la mise en cache « fonctionne » avec un backend qui pose un cookie de session sur chaque réponse. Les réponses propres à chaque utilisateur se retrouvent alors sous une clé que tous les utilisateurs partagent. L’outil avertit précisément sur cette combinaison, car c’est un changement de deux lignes qui ressemble à une optimisation des performances.

## Limites, en toute franchise

Un seul échange, pas le cycle de vie du cache : pas de `proxy_cache_use_stale`, pas de `proxy_cache_lock`, pas de revalidation, pas de comptage `min_uses`, pas de gestion de `Vary`. La fraîcheur est traitée comme présente ou absente, sans être calculée : une entrée expirée sort donc du périmètre. Le rendu de la clé substitue les variables courantes et laisse tout le reste tel qu’écrit.

## Partage des résultats

Sous les deux verdicts, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, une copie de la zone ; il ne contient la zone telle que saisie que si vous cochez l’option décrite plus bas. Les en-têtes de l’échange sont la leçon, et, collés depuis les outils de développement d’un navigateur, ils sont actifs : les valeurs de cookies sont couramment des identifiants de session ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 8.4, consultée le 01/11/2026) et une valeur `Authorization` se compose d’identifiants (« consists of credentials », [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2, consultée le 01/11/2026). La décision vérifie la présence de ces en-têtes, jamais leurs valeurs ; seule la clé de cache rendue affiche une valeur, lorsque la clé nomme `$cookie_<name>` ou `$http_<name>` ([ngx_http_core_module, Embedded Variables](https://nginx.org/en/docs/http/ngx_http_core_module.html#variables), consulté le 01/11/2026). La copie remplace donc chaque valeur de cookie d’une ligne `request_header Cookie:`, la valeur du cookie d’une ligne `response_header Set-Cookie:` (son nom et ses attributs restent), les identifiants qui suivent le schéma d’une ligne `Authorization` ou `Proxy-Authorization` (le schéma reste), et toute la valeur d’un en-tête dont le nom évoque un secret (`X-Api-Key`, `X-Auth-Token`) par `[redacted]` ; tous les autres octets restent tels que saisis, commentaires compris. Avant de proposer le lien, la page décide de nouveau sur la copie et doit aboutir à la même décision (stockage, service, résultat de chaque règle, chaque avertissement) ; sinon, aucun lien n’est créé. La clé et l’étape qui la cite affichent alors `[redacted]` à la place d’une valeur. La copie est ensuite examinée à la recherche d’identifiants qui y resteraient (un JWT dans l’URI, une clé) : un seul empêche la création du lien, et la fenêtre contextuelle nomme sa ligne.

La fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. Elle indique aussi combien de valeurs ont été remplacées. S’il y en a, une option sous sa première ligne, **Inclure les valeurs remplacées dans le lien**, vous permet de les envoyer malgré tout, pour un échange écrit avec des valeurs inventées ou une clé qui nomme un cookie : elle est désactivée à chaque ouverture de la fenêtre contextuelle ; cochée, le lien contient la zone telle que saisie, et la fenêtre contextuelle avertit que les valeurs de cookies sont souvent des sessions actives et que les valeurs `Authorization` sont des identifiants. L’option n’est pas proposée quand des identifiants ont déjà empêché la création du lien.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La copie (ou, avec l’option, la zone telle que saisie) remplit la zone comme le ferait un collage, et la page décide. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
