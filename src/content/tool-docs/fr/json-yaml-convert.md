## Ce que fait l’outil

L’outil convertit un document entre JSON et YAML, dans un sens ou dans l’autre, dans votre navigateur. À partir de JSON, il produit du YAML de style bloc ; à partir de YAML, il produit du JSON. Quand l’analyse échoue, l’erreur indique la ligne et la colonne exactes, et quand une conversion perd quelque chose en route, une note explique quoi et pourquoi.

## Les deux sens

- **De JSON vers YAML.** Le JSON est d’abord validé par le même analyseur précis, qui suit sa position, que celui du formateur JSON : un document non valide est donc rejeté avec une ligne, une colonne et un chemin JSON Pointer plutôt qu’avec un échec vague. Les données valides sont ensuite écrites en YAML de style bloc.
- **De YAML vers JSON.** Le YAML est analysé selon un schéma compatible avec JSON, puis sérialisé en JSON. Les ancres et les alias (le mécanisme de réutilisation `&name` et `*name` de YAML) sont développés sur place, et les scalaires de bloc (les styles de chaîne multiligne de YAML) deviennent des chaînes JSON ordinaires.

## Les pièges de guillemets que l’outil traite

YAML est connu pour lire volontiers un mot nu comme autre chose qu’une chaîne, et c’est là que les allers-retours tournent mal. Le cas le plus connu est le « problème de la Norvège » (Norway problem) : le mot nu `NO` est lu comme le booléen false, et il en va de même pour `yes`, `on` et `off`, ainsi que pour des valeurs comme `1.0` (un nombre, pas la chaîne « 1.0 ») et `08` (qui n’est pas un octal valide). Quand il émet du YAML, le convertisseur met ces valeurs entre guillemets pour que ce que vous vouliez comme chaîne reste une chaîne.

## Ce que la conversion peut perdre

Certaines choses existent dans un format mais pas dans l’autre ; les notes les signalent donc :

- **Les commentaires.** YAML a des commentaires et JSON n’en a pas : les commentaires sont donc supprimés lors de la conversion de YAML vers JSON.
- **Les ancres et les alias.** Ils sont développés en leur valeur complète : une référence partagée et compacte dans le YAML source devient des données répétées dans la sortie.

## Exemples commentés

- Le JSON `{"port":8080,"tls":true}` devient les lignes YAML `port: 8080` et `tls: true`.
- Le YAML `country: NO` devient le JSON `{"country":"NO"}` à l’aller, et quand ce JSON est réémis en YAML, la valeur est mise entre guillemets, `country: "NO"`, pour ne pas être prise pour false.

## Utilisation

Collez du JSON pour obtenir du YAML, ou du YAML pour obtenir du JSON. Lisez les notes de conversion quand elles apparaissent : elles vous disent si quelque chose, comme un commentaire ou une ancre, a changé d’une façon dont vous devez avoir conscience. La conversion est déterministe pour une entrée donnée.

## Partage des résultats

En tête de la lecture (ou sous une erreur d’analyse, qui est aussi une réponse), le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la source telle que collée, le sens et l’indentation. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. Une configuration contient souvent des mots de passe, des clés et des noms internes : la fenêtre contextuelle vous demande donc de la relire avant d’envoyer le lien. Le texte part tel que collé : la sortie convertie montre chaque valeur. Avant qu’un lien soit proposé, le texte est examiné à la recherche d’identifiants définis par une norme : une clé privée PEM, une ligne `Authorization` ou `Proxy-Authorization` avec n’importe quel schéma ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 et 11.7.2 : la valeur se compose d’identifiants, « consists of credentials »), une ligne `Cookie` ou `Set-Cookie` avec une valeur ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sections 4.1.1 et 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), un mot de passe dans une URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1 : la forme « user:password » est déconseillée, « is deprecated »), un identifiant de clé d’accès AWS ou une valeur FortiOS `ENC` ; toutes consultées le 01/11/2026. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme sa ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau. Une valeur dont seul le nom ressemble à un secret (une clé `password:` ou `apiKey`) ne bloque pas le lien ; la fenêtre contextuelle nomme la première pour que vous puissiez la vérifier. Cinq noms de membres et de clés comptent ici comme des identifiants, car une norme définit ce qu’ils contiennent : `access_token` et `refresh_token` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sections 1.4, 1.5 et 5.1 : les jetons d’accès sont des identifiants qui servent à accéder à des ressources protégées, « Access tokens are credentials used to access protected resources »), `id_token` ([OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html), section 3.1.3.3), `client_secret` ([RFC 7591](https://www.rfc-editor.org/rfc/rfc7591), section 3.2.1) et `registration_access_token` ([RFC 7592](https://www.rfc-editor.org/rfc/rfc7592), section 3) ; toutes consultées le 01/11/2026. Avec une valeur, n’importe lequel d’entre eux empêche la création du lien, comme sur le décodeur OIDC.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le texte remplit la zone et les choix sont réglés comme vous le feriez, puis la page le convertit. Un choix inconnu fait ignorer le lien. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
