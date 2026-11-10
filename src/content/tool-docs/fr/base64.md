## Ce que fait l’outil

Cet outil est un codec bidirectionnel pour cinq encodages de texte. Saisissez un texte et il renvoie d’un coup ses formes Base64, Base64 URL-safe, Base32, hexadécimale et en encodage-pourcent ; saisissez une chaîne encodée et il la décode en texte. Le décodage est tolérant : le remplissage (padding) manquant et les espaces parasites sont acceptés, et quand un flux d’octets décodé n’est pas du texte UTF-8 valide, le résultat est signalé comme binaire au lieu de s’afficher en caractères corrompus. Tout s’exécute dans votre navigateur ; rien n’est envoyé.

## Les cinq encodages

Tous les cinq établissent une correspondance entre du texte (sous forme d’octets) et une représentation compatible ASCII, chacun défini par une norme :

- **Base64** (RFC 4648, section 4) utilise l’alphabet `A-Z a-z 0-9 + /` et complète avec `=`. Il augmente la taille des données d’environ un tiers ; c’est l’encodage des identifiants HTTP Basic, `base64(user:password)`, défini dans la RFC 7617.
- **Base64 URL-safe** (RFC 4648, section 5) remplace `+` et `/` par `-` et `_`, et omet généralement le remplissage `=`, pour que la chaîne puisse figurer sans risque dans une URL ou un nom de fichier. C’est l’encodage de chaque segment d’un JWT.
- **Base32** (RFC 4648, section 6) utilise `A-Z 2-7` et complète avec `=`. Il est insensible à la casse et évite les caractères faciles à confondre, ce qui explique sa présence dans des contextes comme les secrets TOTP.
- **Hexadécimal (Base16)** (RFC 4648, section 8) utilise `0-9 A-F`, deux caractères par octet.
- **Encodage-pourcent** (RFC 3986, section 2) garde tels quels les caractères non réservés (`A-Z a-z 0-9 - . _ ~`) et encode chaque autre octet sous la forme `%XX`. C’est l’encodage URL.

## Remplissage, espaces et résultats binaires

Base64 et Base32 sont normalement complétés par `=` jusqu’à un nombre entier de blocs, mais, en pratique, les chaînes arrivent souvent sans remplissage ou avec des sauts de ligne insérés : le décodeur accepte donc les deux. Quand vous décodez une valeur dont les octets ne forment pas du texte UTF-8 valide (un blob compressé, une image, une clé brute), l’outil vous indique que le résultat est binaire au lieu de l’afficher en texte corrompu : vous savez ainsi que le décodage a fonctionné, même si la charge utile n’est pas lisible.

## Exemples commentés

- Le texte `hello` donne en Base64 `aGVsbG8=`, en Base64 URL-safe `aGVsbG8`, en Base32 `NBSWY3DP`, en hexadécimal `68656c6c6f`, et en encodage-pourcent `hello` (tous ses caractères sont non réservés).
- Décoder la valeur Base64 `dXNlcjpwYXNz`, des identifiants HTTP Basic typiques, renvoie `user:pass`.

## Utilisation

Saisissez un texte pour voir les cinq encodages côte à côte, ou collez une valeur encodée pour la décoder. Le codec étant une fonction pure de son entrée, le même texte produit toujours la même sortie.

## Partage des résultats

Sous la sortie, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le texte de la zone tel que vous l’avez saisi, avec le sens, le codec et le nombre de couches quand ils diffèrent des valeurs par défaut (Encoder, Base64, une couche) : `/tools/base64#text=dXNlcjpwYXNz&direction=decode`. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Un texte encodé cache souvent des identifiants : HTTP Basic envoie `user:password` en Base64 ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), section 2, consultée le 27/10/2026). La fenêtre contextuelle ajoute donc une mise en garde propre à cet outil avant toute copie. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le texte n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le sens, le codec et les couches sont réglés, et le texte remplit la zone comme un collage ; la page calcule chaque encodage comme d’habitude. Un sens ou un codec que la page ne propose pas, ou un nombre de couches hors de l’intervalle 1 à 3, fait ignorer tout le lien. Dans les deux cas, les valeurs quittent aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
- **Liens venant d’autres pages.** Une valeur transmise sous la forme `#input=` remplit toujours la zone exactement comme avant. Partager les résultats utilise ses propres noms (`text`, `direction`, `codec`, `layers`) : les deux ne se mélangent jamais.
