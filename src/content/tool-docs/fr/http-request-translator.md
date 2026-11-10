## Ce que fait l’outil

Collez une requête HTTP/1.1 brute, comme celles que donnent une capture, un journal de proxy ou un exemple de RFC, et l’outil la convertit en commande `curl` équivalente, en appel `fetch` de navigateur, en invocation HTTPie, en extrait Python `requests` et en ligne de commande PowerShell. Toute l’analyse se fait dans votre navigateur ; rien n’est jamais envoyé, et aucune requête n’est exécutée.

## L’inverse de l’analyseur de commandes curl

L’[analyseur de commandes curl](/tools/curl-command-explainer) va dans un sens : une commande en entrée, une requête brute parmi ses sorties. Cet outil va dans l’autre : une requête brute en entrée, une commande exécutable en sortie. Les deux existent parce que chaque sens sert à un moment différent. Une capture vous donne un message ; un terminal attend une commande ; un rapport de bug veut les deux.

## Reconstitution de l’URL

Une ligne de requête ordinaire ne contient qu’un chemin, comme dans `GET /users HTTP/1.1`, car la connexion connaît déjà l’hôte. Pour produire quelque chose d’exécutable n’importe où, l’outil joint cette cible à l’en-tête `Host`. Les cibles en absolute-form, qu’utilisent les proxys, sont déjà complètes et sont reprises telles quelles. Si `Host` manque dans une requête en origin-form, l’outil le signale, car l’URL ne serait sinon qu’une supposition.

## En-têtes volontairement écartés

`Host`, `Content-Length` et `Connection` ne sont pas réémis. Chaque client les définit lui-même, et les transmettre provoque des en-têtes en double ou, pire, une longueur déclarée qui ne correspond plus au corps que le client enverra réellement.

## Avertissements

- **Un `Content-Length` en désaccord avec le corps.** Serveurs et proxys peuvent alors ne pas s’accorder sur l’endroit où le message se termine, ce qui est la matière première du request smuggling.
- **Un corps chunked.** Il est transmis tel que collé au lieu d’être décodé ; décoder les codages de transfert est le travail d’un décodeur de messages, pas d’un traducteur.
- **Du `http` en clair.** Les en-têtes et le corps circulent lisibles.
- **Un en-tête `Authorization` ou un `Cookie`.** Une requête capturée contient généralement des identifiants encore valides, et c’est l’avertissement qui compte le plus en pratique : le collage que vous vous apprêtez à mettre dans un ticket peut être une session qui fonctionne.

## Utilisation

Collez la requête, lisez la ligne de requête et les en-têtes analysés, puis copiez la forme dont vous avez besoin. La conversion est déterministe et locale : la même requête produit toujours la même sortie.

## Partage des résultats

Sous la ligne de requête et ses avertissements, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la requête avec chaque identifiant masqué, jamais telle que saisie : une requête capturée contient couramment un en-tête Authorization ou un cookie de session, et cette page affiche chaque valeur d’en-tête en clair et dans cinq traductions. Sa fenêtre contextuelle indique d’abord ce que contient le lien et combien de valeurs ont été masquées, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Ce qui est masqué :

- **Les champs d’en-tête**, selon leur nom : `Authorization` et `Proxy-Authorization` conservent leur schéma ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 et 11.7.2 : la valeur se compose d’identifiants, « consists of credentials ») ; Basic conserve son user-id et perd le mot de passe ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), section 2) ; un JWT conserve son en-tête protégé et perd les claims et la signature ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1) ; chaque valeur de `Cookie` disparaît ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1) ; un champ nommé comme un secret (`X-API-Key`) disparaît en entier ; un jeton à l’intérieur de toute autre valeur (un `Referer` qui contient un code) disparaît. Chacun devient `REDACTED`.
- **La cible de la requête** : le mot de passe d’un `user:password@` ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1) et les paramètres de requête secrets deviennent `REDACTED`.
- **Le corps** : les membres JSON et les paramètres de formulaire nommés comme un secret (`access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), sections 2.2 et 2.3), `refresh_token`, `client_secret`, `password` et `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sections 2.3.1, 4.1.2, 4.3.2 et 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), section 4.5), et tout nom qui se termine par token, secret, password ou api key) sont remplis d’un `*` par octet, pour que le corps garde sa longueur : un `Content-Length` qui correspondait correspond toujours.

Les vecteurs de partage de l’outil vérifient que la page qui ouvre le lien lit la même requête (les mêmes avertissements, les mêmes champs et la même longueur de corps). Si une clé ou un jeton reste là où aucun nom ne le signale (un JWT collé comme corps en texte brut), aucun lien n’est créé : la fenêtre contextuelle nomme sa ligne.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la copie n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La copie remplit la zone comme un collage, et la page la traduit ; rien n’est envoyé. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
