## Ce que fait l’outil

Un JA4 est l’empreinte d’un client TLS, calculée à partir des champs de son ClientHello : la version TLS, les suites de chiffrement qu’il propose, les extensions qu’il envoie, les algorithmes de signature et l’ALPN. Deux clients qui construisent leur ClientHello de la même façon produisent le même JA4 : c’est ainsi que serveurs, proxys et sondes passives reconnaissent un logiciel client sans rien déchiffrer. Cet outil décode un JA4 en ses parties, ou calcule le JA4 haché à partir des valeurs brutes, non hachées. Tout s’exécute dans votre navigateur.

## Construction d’un JA4

Un JA4 comporte trois sections reliées par des tirets bas, `JA4_a_JA4_b_JA4_c`, par exemple `t13d1516h2_8daaf6152771_e5627efa2ab1`.

- **JA4_a** est lisible et compte dix caractères :
  - le transport : `t` pour TLS sur TCP, `q` pour QUIC, `d` pour DTLS ;
  - la version TLS : `13` pour TLS 1.3, `12` pour 1.2, etc., lue dans l’extension supported_versions quand elle est présente ;
  - le SNI : `d` quand le ClientHello contient un nom de serveur (un domaine), `i` quand il n’en contient pas (une simple adresse IP) ;
  - le nombre de suites de chiffrement, sur deux chiffres ;
  - le nombre d’extensions, sur deux chiffres (ce nombre inclut SNI et ALPN) ;
  - le marqueur ALPN : le premier et le dernier caractère de la première valeur ALPN, donc `h2` pour HTTP/2, ou `00` en l’absence d’ALPN.
- **JA4_b** correspond aux douze premiers caractères hexadécimaux du SHA-256 de la liste triée des suites de chiffrement.
- **JA4_c** correspond aux douze premiers caractères hexadécimaux du SHA-256 de la liste des extensions (triée, sans SNI ni ALPN) suivie de la liste des algorithmes de signature dans leur ordre d’origine.

Comme JA4_b et JA4_c sont des hachages tronqués, ils sont à sens unique : l’outil peut les afficher, mais pas retrouver à partir d’eux les listes de suites ou d’extensions.

## GREASE

GREASE (les valeurs réservées de draft-davidben-tls-grease) préserve l’extensibilité de TLS en obligeant les clients à envoyer des valeurs aléatoires inutilisées que les serveurs doivent ignorer. JA4 les ignore aussi : elles n’affectent jamais les décomptes ni les hachages. Si vous collez des valeurs brutes qui contiennent des valeurs GREASE, l’outil les filtre avant de compter, de trier et de hacher.

## Le tri fait la robustesse de JA4

Les empreintes plus anciennes comme JA3 hachaient les listes de suites et d’extensions dans l’ordre d’envoi du client. Les navigateurs récents rendent désormais volontairement aléatoire l’ordre des extensions TLS à chaque connexion, ce qui change un JA3 à chaque fois et le met en échec. JA4 trie les suites et les extensions avant le hachage : l’empreinte reste stable même quand le client mélange l’ordre. C’est la principale raison pour laquelle JA4 a largement remplacé JA3.

## Exemple commenté

L’empreinte `t13d1516h2_8daaf6152771_e5627efa2ab1` se décode en TLS sur TCP, TLS 1.3, SNI présent, 15 suites de chiffrement, 16 extensions et ALPN `h2` (HTTP/2). C’est l’exemple commenté de la spécification JA4, et l’un des vecteurs de référence (golden vectors) de cet outil : le SHA-256 de sa liste triée de suites donne `8daaf6152771`, et les extensions triées suivies des algorithmes de signature donnent `e5627efa2ab1`.

## À propos de la licence

JA4 (l’empreinte des clients TLS) est publié par FoxIO sous la licence permissive BSD 3-Clause, aux mêmes conditions que le JA3 d’origine : il est donc libre d’implémentation, y compris dans des outils commerciaux. Les autres membres de la famille JA4+, comme JA4S, JA4H, JA4X et JA4T, relèvent de la FoxIO License 1.1, qui n’autorise pas la monétisation sans accord distinct : cet outil n’implémente donc que JA4.

## JA3, le prédécesseur

L’outil traite aussi JA3, l’empreinte plus ancienne que JA4 a remplacée. Un JA3 est le MD5 de cinq champs décimaux du ClientHello, dans leur ordre d’envoi : `SSLVersion,Ciphers,Extensions,EllipticCurves,EllipticCurvePointFormats`, par exemple `769,47-53-5-10-49161-49162-49171-49172-50-56-19-4,0-10-11,23-24-25,0`. Collez une chaîne JA3 et l’outil calcule son MD5 et en détaille les champs ; collez un MD5 seul de 32 caractères et il le reconnaît comme un hachage JA3 qu’il ne peut pas décoder, puisqu’il est à sens unique. JA3 est sous licence BSD 3-Clause, comme JA4. Il dépend de l’ordre : un navigateur qui rend aléatoire l’ordre de ses extensions produit un JA3 différent à chaque connexion, et c’est la raison d’être de JA4.

## Utilisation

L’outil détecte automatiquement ce que vous collez : un JA4 contient des tirets bas, tandis qu’un JA3 se compose de champs décimaux séparés par des virgules, ou d’un MD5 seul. Collez un JA4 haché pour le décoder, un JA4_r brut (la valeur `JA4_a` suivie des listes non hachées des suites, des extensions et des algorithmes de signature, séparées par des tirets bas) pour calculer le JA4 haché, une chaîne JA3 pour calculer son MD5 et voir ses champs, ou un MD5 JA3 pour l’identifier. La voie du JA4 brut trie les listes et en filtre les valeurs GREASE pour vous : des entrées triées ou dans l’ordre d’origine produisent le même JA4 canonique.

## Partage des résultats

Sous la lecture, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient l’empreinte telle que collée (`#input=t13d1516h2_8daaf6152771_e5627efa2ab1`), et rien d’autre. Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; une empreinte est bien plus courte.
- **Ouverture d’un lien.** L’empreinte remplit la zone comme un collage, et la page la relit ; une empreinte mal formée reçoit le message habituel de la page. Que le lien soit accepté ou non, les valeurs quittent ensuite aussitôt l’adresse de la page elle-même, sans aucune requête : un rechargement, un favori ou le bouton Partager de la page n’emporte donc rien que vous n’ayez choisi de partager.
