## Ce que fait l’outil

Collez une commande `curl` et l’outil l’explique option par option, puis la traduit sous quatre autres formes : un appel `fetch` de navigateur, une requête HTTP brute, une commande HTTPie et du code Python `requests`. La commande est découpée et décodée dans votre navigateur ; rien n’est jamais envoyé, et aucune requête n’est exécutée.

## Une seule analyse, cinq vues

En coulisses, il n’y a qu’une étape : l’outil analyse votre commande `curl` pour en tirer un modèle de requête unique, qui capture la méthode, l’URL, les en-têtes, le corps, l’authentification et les autres options. Tout ce que vous voyez découle de ce modèle. Comme traduire correctement une commande exige déjà de comprendre chaque option, l’explication option par option n’est que ce même modèle présenté avec des libellés : c’est pourquoi l’explication et les traductions concordent toujours.

## Lecture des options

Toute option à laquelle curl donne un argument prend aussi cet argument ici, tel que curl le lit, si bien qu’une valeur n’est jamais prise pour l’URL. La liste est la propre table des options de curl ([src/tool_getparam.c](https://raw.githubusercontent.com/curl/curl/master/src/tool_getparam.c), consulté le 01/11/2026), recoupée avec la [page de manuel de curl](https://curl.se/docs/manpage.html) (consulté le 01/11/2026). Les options qui façonnent la requête sont expliquées une à une ; toute autre option est nommée avec son argument. Quelques-unes demandent plus qu’un nom :

- **`--oauth2-bearer`** correspond à l’authentification Bearer ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), section 2.1) : les traductions envoient `Authorization: Bearer` suivi du jeton, sauf si un en-tête `Authorization` est écrit avec `-H`, auquel cas curl envoie ce dernier.
- **`-u user:password`** correspond à l’authentification Basic, la méthode par défaut de curl ([manuel de curl](https://curl.se/docs/manpage.html), `--basic`, consulté le 01/11/2026) : les traductions `fetch` et HTTP brut envoient `Authorization: Basic` et le Base64 de `user:password` ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), section 2, consulté le 01/11/2026), HTTPie reçoit son propre `-a user:password` et Python `requests` son propre `auth=`. Avec `--digest`, HTTPie reçoit `-A digest` et `requests` son `HTTPDigestAuth` ([documentation de requests](https://requests.readthedocs.io/en/latest/user/authentication/), consulté le 01/11/2026). Avec le seul nom d’utilisateur, curl demande le mot de passe : `fetch` et HTTP brut ne contiennent alors aucun champ, et le `-a user` de HTTPie le demande aussi. Avec `--digest`, `--ntlm`, `--negotiate`, `--anyauth` ou `--aws-sigv4`, aucun champ Basic n’est écrit, car ces méthodes répondent à un challenge ou signent la requête à la place. Un `Authorization` écrit avec `-H`, ou `--oauth2-bearer`, est prioritaire.
- **`--json`** est, selon les termes de la page de manuel, un raccourci pour `--data-binary`, `--header "Content-Type: application/json"` et `--header "Accept: application/json"` : le corps est le JSON tel que saisi, plusieurs fragments `--json` sont accolés sans rien entre eux, et un en-tête écrit avec `-H` remplace celui qu’ajoute `--json`.
- **`--url-query`** ajoute son argument à la fin de la chaîne de requête de l’URL, encodé comme l’encode `--data-urlencode`, ou tel qu’écrit quand il commence par `+` ; un argument lu depuis un fichier (`name@file`) est nommé mais ne peut pas être ajouté.
- **`-U` / `--proxy-user`, `-E` / `--cert`, `--proxy-cert`, `--pass`, `--proxy-pass`, `--tlspassword`, `--proxy-tlspassword`, `--httpsig-key` et `--ftp-account`** sont expliquées sans leur secret : l’utilisateur, ou le fichier du certificat, est affiché ; un mot de passe, une phrase secrète, une clé ou des données de compte ne le sont pas.

## Les formes produites

- **curl expliqué.** Chaque option est nommée et décrite, si bien qu’une option inconnue cesse d’être un mystère.
- **fetch.** L’appel à l’API Fetch du navigateur, selon la sémantique décrite par MDN, prêt à intégrer dans du JavaScript.
- **HTTP brut.** La ligne de requête, les en-têtes et le corps tels qu’ils partiraient réellement sur le réseau, ce qui est la façon la plus claire de voir exactement ce qu’est une requête.
- **HTTPie.** La commande `http` équivalente, pour qui préfère ce client.
- **Python requests.** Le code équivalent avec la bibliothèque Requests.

## Pourquoi traduire plutôt qu’exécuter

L’outil n’exécute délibérément jamais la requête. C’est un choix de confidentialité et de sécurité : vous pouvez décoder et convertir une commande qui contient des identifiants ou qui vise un hôte interne sans que rien ne quitte votre navigateur, et sans déclencher ce que ferait la requête. C’est un traducteur et un analyseur, pas un client.

## Utilisation

Collez une commande `curl` et lisez l’explication option par option et les quatre traductions. La conversion est déterministe et locale : une même commande produit donc toujours la même sortie.

L’outil inverse est le [traducteur de requêtes HTTP](/tools/http-request-translator) : collez une requête brute et récupérez une commande exécutable. Si vous êtes arrivé ici en le cherchant, sachez qu’il a pris le nom de ce qu’il fait.

## Partage des résultats

Sous la ligne de requête, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient la commande après le `#` en remplaçant chaque identifiant qu’elle contient par `REDACTED`, jamais tel que saisi : une commande curl collée pendant le débogage d’une API en contient souvent un, et cette page affiche en clair les valeurs des en-têtes, les cookies et, dans la traduction Python, un mot de passe `-u`. Sa fenêtre contextuelle indique d’abord ce que contient le lien et combien de valeurs ont été remplacées, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Ce qui est remplacé, chaque valeur là où la [page de manuel de curl](https://curl.se/docs/manpage.html) (consulté le 01/11/2026) ou une norme HTTP la définit :

- **`-u` / `--user` et `-U` / `--proxy-user`** : le mot de passe, séparé de l’utilisateur au premier deux-points (« The username and passwords are split up on the first colon ») ; l’utilisateur reste.
- **`--oauth2-bearer`, `--pass`, `--proxy-pass`, `--tlspassword`, `--proxy-tlspassword` et `--ftp-account`** : la valeur entière ; **`--httpsig-key`** aussi, sauf s’il désigne un fichier avec `@`. **`-E` / `--cert` et `--proxy-cert`** : le mot de passe placé après le premier deux-points du certificat qui n’est pas écrit `\:`.
- **`-H` / `--header` et `--proxy-header`**, selon le nom du champ : `Authorization` et `Proxy-Authorization` conservent leur schéma ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 et 11.7.2 : la valeur se compose d’identifiants, « consists of credentials ») ; Basic conserve son user-id et perd le mot de passe ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), section 2) ; un JWT conserve son en-tête protégé et perd les claims et la signature ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1) ; des identifiants AWS Signature Version 4 (`AWS4-HMAC-SHA256`) conservent leur credential scope et `SignedHeaders` et perdent l’ID de clé d’accès et la signature ([Create a signed AWS API request](https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html), consulté le 01/11/2026) ; `Cookie` conserve ses noms ; un champ dont le nom évoque un secret (`X-API-Key`, `X-Auth-Token`) est remplacé en entier ; un jeton à l’intérieur de toute autre valeur est remplacé.
- **`-b` / `--cookie`** : chaque valeur de `NAME1=VALUE1; NAME2=VALUE2` ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1) ; un nom de fichier reste.
- **`-d` et la famille `--data`, `--json`, `--url-query` et `-F`** : les membres JSON et les paramètres `name=value` dont le nom contient un secret : `access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), sections 2.2 et 2.3), `refresh_token`, `client_secret`, `password` et `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sections 2.3.1, 4.1.2, 4.3.2 et 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), section 4.5), et tout nom se terminant par token, secret, password ou api key. Un `@file` reste.
- **L’URL, `--url`, `-x` / `--proxy` et `-e` / `--referer`** : le mot de passe d’un `user:password@` ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1) et les paramètres secrets de la chaîne de requête et du fragment ; pour `X-Amz-Credential`, seul l’ID de clé d’accès. L’argument de toute autre option est lu de la même façon : un `--preproxy` ou un hôte SOCKS écrit avec `user:password@` perd donc son mot de passe.

Une valeur vide, fictive ou constituée d’une variable shell (`$TOKEN`) reste telle quelle. Chaque remplacement est écrit sur place, si bien que la copie conserve les guillemets, les espacements et les continuations de ligne du texte collé ; une valeur qui contient des séquences d’échappement est remise entre guillemets en entier. Les vecteurs de partage de l’outil vérifient que la page qui ouvre le lien lit la même requête. Si une clé ou un jeton reste là où aucun nom ne le signale (un JWT dans le chemin d’une URL, une clé privée), il n’y a pas de lien : la fenêtre contextuelle nomme sa ligne, vous y placez une valeur fictive et vous appuyez de nouveau.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la copie n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La copie remplit la zone comme lors d’un collage et la page l’explique ; rien n’est envoyé ni exécuté. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
