## Ce que fait l’outil

Saisissez une suite de chiffrement TLS, sous son nom IANA, son nom OpenSSL ou GnuTLS, ou son point de code hexadécimal, et l’outil la décompose en ses éléments (l’échange de clés, l’authentification, l’algorithme de chiffrement symétrique et son mode, et le MAC), puis donne une lecture de sa sécurité en langage clair, accompagnée du statut de recommandation officiel de la suite à l’IANA. Il s’exécute dans votre navigateur à partir d’une copie intégrée du registre de l’IANA.

## Lecture d’un nom de suite de chiffrement

Une suite de chiffrement est un ensemble nommé des algorithmes qu’utilisera une connexion TLS, et son nom est structuré. En TLS 1.2 et versions antérieures, un nom comme `TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256` se lit élément par élément : `ECDHE` est la méthode d’échange de clés, `RSA` la façon dont le serveur est authentifié, `AES_128_GCM` l’algorithme de chiffrement symétrique avec sa taille de clé et son mode, et `SHA256` le hachage du MAC et de la PRF. TLS 1.3 a changé cela : une suite 1.3 comme `TLS_AES_128_GCM_SHA256` ne nomme que l’algorithme symétrique et le hachage, car l’échange de clés est toujours éphémère et se négocie à part. L’outil analyse les deux formes et en extrait les composants.

## Noms, points de code et registre

Une même suite porte des noms différents selon les outils, avec un point de code numérique commun à tous. La source qui fait autorité est le registre IANA TLS Cipher Suites, qui associe chaque point de code de deux octets à son nom et porte l’indicateur **Recommended** (Y, N, ou D pour déconseillé, selon la RFC 8447). L’outil ramène tout ce que vous saisissez (un nom IANA, un nom OpenSSL ou GnuTLS, ou le point de code hexadécimal brut) à cette entrée du registre : vous pouvez ainsi passer de l’écriture qu’affiche un outil à celle qu’en attend un autre.

## La lecture de sécurité

Connaissant les éléments, l’outil peut évaluer la suite, et il signale ce qui est notoirement cassé ou faible sur la base des normes plutôt que d’une opinion : les suites RC4 ne sont pas sûres (RFC 7465), les suites 3DES sont faibles à cause de l’attaque Sweet32 (RFC 8429), et il reprend les entrées que le registre lui-même déclare non recommandées. Il reconnaît aussi les choix modernes, dont les modes de chiffrement authentifié (GCM et ChaCha20-Poly1305) et les groupes d’échange de clés hybrides post-quantiques fondés sur ML-KEM (NIST FIPS 203).

## Utilisation

Saisissez une suite de chiffrement sous n’importe quelle forme courante et lisez le décodage de son échange de clés, de son authentification, de son algorithme de chiffrement, de son mode et de son MAC, son statut de recommandation à l’IANA et l’évaluation de sa sécurité. Le décodage est déterministe et entièrement local.

La suite qu’a choisie un serveur en production figure sur la ligne `Cipher is` de la sortie d’`openssl s_client` ; l’[analyseur openssl s_client](/tools/openssl-s-client-explainer) lit cette ligne avec tout ce qui l’entoure, y compris le piège selon lequel sa version est celle de l’algorithme de chiffrement lui-même, pas toujours la version négociée.

## Partage des résultats

Sous les badges du verdict, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient la suite de chiffrement telle que vous l’avez saisie, après le `#` : `/tools/cipher#input=TLS_CHACHA20_POLY1305_SHA256`. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le nom n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** Le lien a la forme `#input=` que cette page lit déjà : son ouverture fonctionne donc exactement comme pour ces liens depuis toujours. La valeur remplit la zone et se décode, et elle reste dans l’adresse jusqu’à ce que vous modifiiez ou effaciez la zone.
