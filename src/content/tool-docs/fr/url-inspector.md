## Ce que fait l’outil

Décomposez n’importe quelle URL en ses parties nommées : le schéma, l’hôte, le port, le chemin, chacun des paramètres de requête et le fragment. L’outil décode l’encodage-pourcent et les noms d’hôte internationalisés (punycode), signale les identifiants intégrés et d’autres problèmes, et indique le port par défaut du schéma. Tout s’exécute dans votre navigateur.

## Les parties d’une URL

Une URL obéit à une grammaire définie, exposée dans la RFC 3986, et l’outil découpe une URL en ses composants de premier niveau : le **schéma** (comme `https`), l’**autorité** (qui contient l’éventuel userinfo, l’**hôte** et le **port**), le **chemin**, la **requête** (query) et le **fragment**. Il découpe ensuite la chaîne de requête en paramètres individuels et applique le décodage-pourcent à chacun d’eux, si bien qu’une longue requête devient une liste lisible de paires nom-valeur au lieu d’une chaîne opaque. Conformément au WHATWG URL Standard, il traite un `+` dans une requête en encodage de formulaire comme un espace.

## Analysée telle qu’écrite, sans normalisation

Un choix de conception compte ici : l’outil analyse l’URL exactement telle que vous l’avez donnée et ne la normalise pas en silence. Cela a son importance, car les différences qu’un navigateur aplanirait discrètement sont souvent précisément ce que vous cherchez à voir : un port inattendu, une barre oblique doublée, un caractère encodé égaré. C’est en montrant l’URL telle qu’elle est écrite que l’outil sert au débogage et au repérage de ce qui est suspect.

## Décodage et signalements

L’outil met en évidence deux points en particulier :

- **Les noms d’hôte internationalisés.** Un label d’hôte sous forme punycode (commençant par `xn--`) est décodé en son texte Unicode (RFC 3492 et cadre IDNA de la RFC 5890) : vous voyez ainsi le nom réel, ce qui aide aussi à révéler les tromperies par domaines sosies.
- **Les identifiants intégrés.** Une URL peut contenir un nom d’utilisateur et un mot de passe sous la forme `user:pass@host`, et l’outil le signale, car des identifiants dans une URL sont une erreur courante et un problème de sécurité.

## Utilisation

Collez une URL et lisez son schéma, son hôte, son port, son chemin, ses paramètres de requête décodés et son fragment, avec les éventuels identifiants ou autres problèmes signalés. L’analyse est déterministe et locale : vous pouvez donc inspecter sans risque n’importe quelle URL, y compris une URL que vous ne voulez pas visiter.

## Partage des résultats

Sous la bande Anatomie, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, l’URL dont le mot de passe et tout paramètre de jeton sont remplacés par `REDACTED`, jamais l’URL telle que saisie : la bande Anatomie montre l’URL entière, mot de passe compris. Sa fenêtre contextuelle indique d’abord ce que contient le lien et combien de valeurs ont été remplacées, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Ce qui est remplacé :

- **Le mot de passe du userinfo**, c’est-à-dire le texte qui suit son premier deux-points : la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1, dit que les applications ne devraient afficher en clair aucune donnée située après le premier deux-points (« should not render as clear text any data after the first colon »). Le nom d’utilisateur reste.
- **Les paramètres de requête et de fragment** dont le nom désigne un secret : `access_token` dans une requête ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), section 2.3) ou dans un fragment, où un octroi implicite (implicit grant) le renvoie ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), section 4.2.2) ; `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), section 4.1.2) ; `X-Amz-Signature` et `X-Amz-Security-Token` en entier, et, de `X-Amz-Credential`, seulement l’identifiant de clé d’accès, si bien que la portée des identifiants (credential scope) qui le suit (la date, la région et le service) reste lisible, ce à quoi se ramène généralement l’échec d’une URL présignée ([Create a signed AWS API request](https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html), consulté le 01/11/2026) ; `sig` ([Create a service SAS](https://learn.microsoft.com/en-us/rest/api/storageservices/create-service-sas), consulté le 01/11/2026) ; `key` ([Use API keys to access APIs](https://cloud.google.com/docs/authentication/api-keys-use), consulté le 01/11/2026) ; et tout nom qui se termine par token, secret, password ou api key.

L’hôte, le port, le chemin et tous les autres paramètres partent tels que saisis, et les vecteurs de partage de l’outil vérifient que la page qui ouvre le lien lit les mêmes parties. Une remarque qui ne portait que sur une valeur remplacée (un encodage-pourcent ou un `+` à l’intérieur) disparaît avec elle. Si une clé ou un jeton se trouve à un endroit qu’aucun nom ne signale (un JWT dans le chemin), aucun lien n’est créé, et la fenêtre contextuelle l’indique.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la copie n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La copie remplit le champ comme le ferait un collage, et la page la décompose. Comme pour tout lien `#input=` vers cette page, la valeur reste dans l’adresse jusqu’à ce que vous modifiiez le champ.
