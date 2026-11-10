## Ce que fait l’outil

Collez une URL iControl REST et l’outil la décode : le module TMOS, la collection, le chemin de partition et de dossiers encodé avec des tildes, accompagné de son équivalent `tmsh`, toute sous-collection comme les membres de pool, et les options de requête. Il n’analyse que le texte de l’URL : rien n’est récupéré et rien ne quitte le navigateur.

## Le tilde

`/mgmt/tm/ltm/pool/~Common~apps~web_pool` désigne `/Common/apps/web_pool`. Le tilde est un séparateur de dossiers, utilisé parce qu’**une URL utilise déjà la barre oblique pour sa propre structure**. L’outil affiche toujours la forme `tmsh` à côté des parties décodées, car c’est la forme que la plupart des lecteurs connaissent déjà.

## Le détail de partition qui provoque des 404

Un nom écrit sans partition est résolu **dans la partition courante de l’appelant**. La même requête peut réussir pour un administrateur et renvoyer 404 pour un autre, sans qu’il y ait d’erreur dans l’un ou l’autre cas. L’outil le signale chaque fois que le nom de l’objet n’est pas qualifié.

## Options de requête

`$select`, `$filter`, `$top`, `$skip`, `expandSubcollections`, `options` et `ver` sont expliquées une par une. Celle qu’il faut connaître est **`expandSubcollections`** : sans elle, un pool revient sans ses membres, ce qui est la surprise la plus courante de cette API.

## Ce que l’outil ne fait pas

La table des modules est finie. Si un chemin utilise un module que l’outil ne connaît pas, il en décode la structure et **indique que le module n’est pas reconnu plutôt que de le décrire au jugé**. Il ne valide rien par rapport à un équipement et ne peut pas vous dire si l’objet existe.

## Partage des résultats

Sous la vue d’ensemble, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le chemin avec tout identifiant qu’il contient remplacé, jamais tel que saisi. Sa fenêtre contextuelle indique d’abord ce que contient le lien et combien de valeurs ont été remplacées, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

- **Un jeton d’authentification dans le chemin** est masqué en conservant sa forme (les majuscules deviennent `X`, les minuscules `x`, les chiffres `0`), pour que la page le lise toujours comme l’objet qu’il désignait. Le guide de F5 lui-même prolonge un jeton avec `PATCH /mgmt/shared/authz/tokens/{{ bigip_auth_token }}` ([AS3, Authentication and Authorization](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/userguide/authentication.html), consulté le 27/10/2026), ce qui place le jeton lui-même dans le chemin.
- **Un mot de passe avant l’hôte** (`https://user:password@host/...`) devient `[redacted]` : la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1 (consultée le 27/10/2026), précise que les applications ne devraient afficher en clair aucune donnée située après le premier deux-points d’un userinfo (« should not render as clear text any data after the first colon »).
- **Un en-tête `X-F5-Auth-Token` ou `Authorization`** collé avec le chemin voit ses identifiants remplacés par `[redacted]` (le même guide envoie le jeton dans `X-F5-Auth-Token` ; [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2).

L’hôte, le module, la collection, les noms d’objets et les options de requête partent tels que saisis ; les vecteurs de partage de l’outil vérifient que la page qui reçoit le lien lit les mêmes parties. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la copie n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La copie remplit la zone comme un collage, et la page la décode. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## L’outil compagnon

L’analyseur de chemins RESTCONF F5OS décode la couche plateforme sous-jacente à un tenant, qui utilise RESTCONF sur YANG plutôt que ce modèle d’objets. Les deux API ne se ressemblent en rien parce qu’elles viennent de traditions différentes, et non de versions différentes.
