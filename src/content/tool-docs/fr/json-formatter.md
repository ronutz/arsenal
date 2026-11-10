## Ce que fait l’outil

Collez du JSON : l’outil le valide, puis le met en forme, le minifie ou le trie. Ce qui le distingue d’un simple `JSON.parse`, c’est ce qu’il vous dit quand quelque chose ne va pas ou sort de l’ordinaire : une erreur d’analyse indique la ligne, la colonne et le chemin exacts du problème ; les clés d’objet répétées sont signalées ; et les nombres très grands ou très précis sont conservés exactement au lieu d’être arrondis. Tout s’exécute dans votre navigateur.

## Un analyseur conçu pour le diagnostic

Le moteur est un analyseur écrit à la main qui suit sa position au fil de la lecture, au lieu de s’appuyer sur l’analyse intégrée du moteur JavaScript. Cela apporte trois choses qui comptent en pratique :

- **Des erreurs précises.** Quand l’analyse échoue, vous obtenez la ligne, la colonne, la position en octets, un message en langage clair et le chemin JSON Pointer (RFC 6901) vers l’emplacement, au lieu d’une unique `SyntaxError` dépendante du moteur et sans chemin.
- **La détection des clés en double.** La grammaire JSON permet techniquement à un objet de répéter une clé, et `JSON.parse` ne garde silencieusement que la dernière. Ce comportement silencieux masque de vrais bugs : ce moteur signale donc chaque doublon qu’il trouve, avec son chemin.
- **Des grands nombres exacts.** Les nombres JSON n’ont pas de limite de taille, mais un nombre JavaScript est un flottant de 64 bits qui perd en précision au-delà de 2^53. Le formateur conserve les chiffres que vous avez écrits : un identifiant à 20 chiffres ou un décimal de haute précision n’est pas arrondi en silence.

## Mise en forme, minification et tri

Une fois le JSON valide, vous pouvez le mettre en forme avec une indentation cohérente, le minifier sous sa forme la plus compacte sur une seule ligne, ou trier les clés d’objet pour que deux documents qui ne diffèrent que par l’ordre des clés s’alignent pour la comparaison. Le tri porte sur les clés et ne réordonne pas les tableaux, dont l’ordre est significatif en JSON.

## Exemples commentés

- `{"b":1,"a":2}` trié par clé devient `{"a":2,"b":1}`.
- `{ "a": 1 }` minifié devient `{"a":1}`, sans les blancs.
- `{"id":10000000000000001}` garde tous ses chiffres, alors qu’un aller-retour par un flottant de 64 bits le transformerait en `10000000000000000`.
- `{"a":1,"a":2}` est signalé pour la clé en double `a` ; un analyseur standard garderait silencieusement `2`.

## Utilisation

Collez un document JSON et choisissez de le mettre en forme, de le minifier ou de le trier. S’il ne s’analyse pas, l’erreur pointe l’endroit exact ; s’il s’analyse mais contient des clés en double ou des nombres hors gabarit, ceux-ci sont signalés. L’outil est une fonction pure de son entrée : le même document donne toujours le même résultat.

Pour le XML, le [formateur et validateur XML](/tools/xml-formatter) fait le même travail : une vérification de bonne formation qui indique la ligne et la colonne, puis une mise en forme ou une minification.

## Partage des résultats

En tête de la lecture (ou sous une erreur d’analyse, qui est aussi une lecture), le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le JSON tel que collé et les trois choix (Indenté ou Minifié, l’indentation, le tri des clés). Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. Le JSON contient souvent des mots de passe, des clés et des noms internes : la fenêtre contextuelle vous demande donc de le relire avant d’envoyer le lien. Le texte part tel que collé : la sortie mise en forme montre chaque valeur, et rien ne peut donc être remplacé sans changer ce que voit la personne qui lit. Avant qu’un lien soit proposé, le texte est examiné à la recherche d’identifiants définis par une norme : une clé privée PEM, une ligne `Authorization` ou `Proxy-Authorization` avec n’importe quel schéma ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 et 11.7.2 : la valeur se compose d’identifiants, « consists of credentials »), une ligne `Cookie` ou `Set-Cookie` avec une valeur ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sections 4.1.1 et 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), un mot de passe dans une URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1 : la forme « user:password » est déconseillée, « is deprecated »), un identifiant de clé d’accès AWS ou une valeur FortiOS `ENC` ; toutes consultées le 01/11/2026. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme sa ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau. Une valeur dont seul le nom ressemble à un secret (un membre `password` ou `apiKey`) ne bloque pas le lien ; la fenêtre contextuelle nomme la première pour que vous puissiez la vérifier. Cinq noms de membres comptent ici comme des identifiants, car une norme définit ce qu’ils contiennent : `access_token` et `refresh_token` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sections 1.4, 1.5 et 5.1 : les jetons d’accès sont des identifiants qui servent à accéder à des ressources protégées, « Access tokens are credentials used to access protected resources »), `id_token` ([OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html), section 3.1.3.3), `client_secret` ([RFC 7591](https://www.rfc-editor.org/rfc/rfc7591), section 3.2.1) et `registration_access_token` ([RFC 7592](https://www.rfc-editor.org/rfc/rfc7592), section 3) ; toutes consultées le 01/11/2026. Avec une valeur, n’importe lequel d’entre eux empêche la création du lien, comme sur le décodeur OIDC.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le texte remplit la zone et les choix sont réglés comme vous le feriez, puis la page met le JSON en forme. Un choix inconnu fait ignorer le lien. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
