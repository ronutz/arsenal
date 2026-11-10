## Ce que fait l’outil

Collez une `location`, son `proxy_pass` et une URI de requête. L’outil calcule ce que reçoit réellement le backend, et affiche la **même configuration, barre oblique finale ajoutée ou retirée** : la différence se voit au lieu d’être décrite.

## La règle

`proxy_pass http://backend;` n’a **pas de partie URI** : l’URI de la requête d’origine est donc transmise sans modification, préfixe de la location compris. `proxy_pass http://backend/;` **a** une partie URI (même cette unique barre oblique compte) : la partie de la requête qui correspond au préfixe de la location est donc **remplacée** par elle.

Avec `location /app/` et une requête pour `/app/page`, la première forme envoie `/app/page`, la seconde `/page`, et `proxy_pass http://backend/v2/;` envoie `/v2/page`.

Le bon choix dépend du backend. Une application montée sur le même chemin a besoin que le préfixe soit conservé ; une application qui ignore qu’elle se trouve derrière un préfixe a besoin qu’il soit retiré. Un mauvais choix produit une erreur 404 du backend pour une requête que le proxy a parfaitement traitée.

## La double barre oblique est bien réelle

Une location sans barre oblique finale combinée à une partie URI envoie bel et bien une double barre oblique vers l’upstream : `location /app` avec `proxy_pass http://backend/` transforme `/app/page` en `//page`. L’outil reproduit ce comportement au lieu de l’arranger, car une réponse plus propre que celle de NGINX masquerait précisément le défaut que vous cherchez.

## Ce que l’outil refuse

Les locations par expression régulière et les locations nommées ne peuvent pas porter de partie URI : il n’existe pas de préfixe littéral à remplacer, et NGINX rejette donc la configuration au démarrage. L’outil le signale au lieu d’inventer un résultat.

## L’exception des variables

Une variable placée n’importe où dans la valeur suspend entièrement la substitution du préfixe et reporte la résolution de l’upstream au moment de la requête, ce qui exige généralement un `resolver` et transforme un échec de résolution de nom en erreur d’exécution, au lieu d’une erreur que `nginx -t` détecterait.

## Limites, en toute franchise

Pas de `rewrite`, de `try_files` ni de redirection interne : l’outil indique le chemin que reçoit le backend, pas ce que fait la requête dans son ensemble. Les blocs upstream ne sont pas résolus en serveurs, et les chaînes de requête passent sans être modélisées.

## Partage des résultats

Sous le résultat, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la zone telle que saisie, dès que la page a un résultat. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. La valeur de proxy_pass nomme un backend, un nom d’hôte ou une adresse généralement internes, et la page la réaffiche dans la configuration de comparaison : rien n’est donc retiré, et la fenêtre contextuelle vous demande de la vérifier. Avant qu’un lien soit proposé, la zone est examinée à la recherche d’identifiants définis par une norme : une clé privée PEM, une ligne `Authorization` ou `Proxy-Authorization` avec n’importe quel schéma ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 et 11.7.2 : la valeur se compose d’identifiants, « consists of credentials »), une ligne `Cookie` ou `Set-Cookie` avec une valeur ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 8.4 : les serveurs stockent couramment un nonce, ou identifiant de session, dans un cookie, « commonly store a nonce (or “session identifier”) in a cookie »), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), un mot de passe dans une URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), un identifiant de clé d’accès AWS ou une valeur `ENC` de FortiOS ; toutes consultées le 01/11/2026. Un seul d’entre eux empêche la création du lien : la fenêtre contextuelle nomme sa ligne, et vous le remplacez par une valeur fictive avant d’appuyer de nouveau sur le bouton. Une valeur dont seul le nom ressemble à un secret (un membre JSON `token`, un `token=` dans une chaîne de requête) ne bloque pas le lien ; la fenêtre contextuelle nomme la première pour que vous puissiez la vérifier.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La zone se remplit comme le ferait un collage, et la page calcule le chemin (l’upstream n’est jamais résolu ni contacté). Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
