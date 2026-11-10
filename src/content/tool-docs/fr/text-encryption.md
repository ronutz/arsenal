## Ce que fait l’outil

Saisissez un texte et une phrase secrète, appuyez sur Chiffrer, et vous obtenez une chaîne unique qui commence par `aesgcm1.`. Collez cette chaîne en mode Déchiffrer, saisissez la même phrase secrète, et vous retrouvez le texte, exactement tel qu’il était. Tout se passe dans votre navigateur, par sa Web Cryptography API : le texte et la phrase secrète ne sont jamais envoyés, jamais enregistrés et jamais placés dans l’adresse.

L’outil est fait pour votre propre texte et votre propre phrase secrète : une note que vous voulez conserver dans un fichier ou un fil de messages sans la laisser lisible, ou un secret que vous voulez remettre en deux parties (la chaîne par un canal, la phrase secrète par un autre). Il n’ouvre que ce qui a été scellé avec une phrase secrète que vous détenez. Il ne devine, ne casse et ne récupère rien d’autre, et une phrase secrète erronée ne rend rien.

## Fonctionnement

Chaque étape est une primitive de la [Web Cryptography API](https://www.w3.org/TR/WebCryptoAPI/), l’implémentation propre au navigateur ; aucun code cryptographique n’est écrit dans la page.

1. **La phrase secrète est préparée.** Chaque espace non ASCII (catégorie Unicode Zs, comme l’espace insécable) devient un espace ordinaire, puis la forme de normalisation Unicode C est appliquée : ce sont les deux règles de correspondance du profil OpaqueString de la [RFC 8265](https://www.rfc-editor.org/rfc/rfc8265) (section 4.2.2, règles 2 et 4). Un « ç » saisi comme un seul caractère et un « ç » collé sous la forme d’un « c » suivi d’une cédille combinante donnent alors la même clé. Rien d’autre n’est modifié : la casse est conservée, et aucun caractère n’est refusé, sauf un surrogate isolé, que l’UTF-8 ne peut pas représenter. Le résultat est encodé en UTF-8 ([RFC 3629](https://www.rfc-editor.org/rfc/rfc3629)).
2. **Une clé est dérivée.** PBKDF2 (Password-Based Key Derivation Function 2, [RFC 8018](https://www.rfc-editor.org/rfc/rfc8018), section 5.2), avec HMAC-SHA-256 comme fonction pseudo-aléatoire, transforme la phrase secrète, un sel aléatoire de 16 octets et 600 000 itérations en une clé de 256 bits pour AES (Advanced Encryption Standard).
3. **Le texte est scellé.** AES en mode Galois/Counter (GCM, [NIST SP 800-38D](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)) chiffre le texte, en UTF-8, sous cette clé avec un vecteur d’initialisation (IV, initialisation vector) aléatoire de 12 octets, et produit un tag d’authentification de 128 bits. Les quatre premiers champs de la chaîne sont transmis à GCM comme données authentifiées additionnelles : le tag les couvre donc aussi.
4. **Une chaîne unique est écrite.** L’identifiant de version, le nombre d’itérations, le sel, l’IV et le texte chiffré suivi de son tag, reliés par des points.

Le déchiffrement fait le chemin inverse : lire les champs, préparer la phrase secrète de la même façon, dériver la même clé à partir du sel et du nombre d’itérations inscrits dans la chaîne, et laisser AES-GCM vérifier le tag avant de rendre quoi que ce soit. C’est la forme que la RFC 8018 appelle PBES2 (section 6.2) : une clé issue de PBKDF2, puis un schéma de chiffrement. Le format de chaîne qui l’entoure est propre à cet outil ; il est décrit ci-dessous pour que n’importe qui puisse le réimplémenter.

Le sel et l’IV sont tirés par la page avec `crypto.getRandomValues`, que la Web Cryptography API définit comme remplissant un tableau d’octets aléatoires cryptographiquement sûrs (« cryptographically secure random bytes », section 10.1.1). Le moteur lui-même les reçoit en entrée et ne tire rien, ce qui permet de le tester octet par octet avec un sel et un IV fixes. C’est aussi pourquoi chiffrer deux fois le même texte avec la même phrase secrète donne deux chaînes différentes, et pourquoi les deux se déchiffrent.

## La chaîne

```
aesgcm1.600000.AAECAwQFBgcICQoLDA0ODw.EBESExQVFhcYGRob.3lWZqiea5CBm...
```

| Champ | Contenu | Encodage |
|---|---|---|
| 1 | `aesgcm1` : cette construction, version 1 du format | ASCII |
| 2 | Le nombre d’itérations PBKDF2 | Décimal, sans signe, sans zéro initial, de 1000 à 10 000 000 |
| 3 | Le sel, 16 octets | base64url sans remplissage, 22 caractères |
| 4 | L’IV, 12 octets | base64url sans remplissage, 16 caractères |
| 5 | Le texte chiffré suivi du tag de 16 octets | base64url sans remplissage |

- **base64url** est l’alphabet sûr pour les URL et les noms de fichiers de la [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648) (section 5) : A à Z, a à z, 0 à 9, `-` et `_`. Le remplissage `=` est omis, ce que la section 3.2 autorise quand la spécification le précise : ici, le champ se termine au point suivant. Le décodage est strict : tout autre caractère, une longueur qui ne peut pas encoder un nombre entier d’octets, ou un dernier caractère dont les bits inutilisés ne sont pas nuls est refusé (la section 3.5 permet à un décodeur de rejeter un encodage non canonique). Le point ne fait pas partie de cet alphabet : un champ ne peut donc jamais en contenir.
- **Les données authentifiées additionnelles** sont le texte des champs 1 à 4 avec leurs trois points, exactement tel qu’il est écrit. Modifiez la version, le nombre d’itérations, le sel ou l’IV, et le tag ne se vérifie plus, même si le reste de la chaîne est intact.
- **Les caractères d’espacement** (espaces, tabulations, sauts de ligne) présents n’importe où dans une chaîne collée sont supprimés avant sa lecture, car les clients de messagerie coupent les longues lignes ; le résultat l’indique quand cela s’est produit.
- **Longueur.** Le texte chiffré a la longueur du texte en UTF-8, plus le tag de 16 octets. La longueur de la chaîne indique donc à peu près celle du texte.

## Pourquoi ces valeurs

- **600 000 itérations.** L’aide-mémoire [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) de l’OWASP donne « PBKDF2-HMAC-SHA256: 600,000 iterations (recommended) » (consulté le 27/10/2026). Chaque itération représente un calcul HMAC de plus pour quiconque essaie des phrases secrètes contre votre chaîne, et, pour vous, un de plus à chaque chiffrement ou déchiffrement : attendez-vous à ce que le bouton prenne un instant.
- **De 1000 à 10 000 000 au déchiffrement.** Le nombre d’itérations figure dans la chaîne : le déchiffrement le suit donc, dans la plage que fixe la publication [NIST SP 800-132](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) (section 5.2), qui recommande un minimum (« A minimum iteration count of 1,000 is recommended ») et juge qu’un nombre bien plus élevé peut convenir aux clés particulièrement critiques (« an iteration count of 10,000,000 may be appropriate »). La RFC 8018 cite le même texte (section 4.2). Ce plafond empêche aussi une chaîne fabriquée de faire dériver une clé à la page pendant des minutes.
- **Un sel de 16 octets.** La SP 800-132 (section 5.1) fixe une longueur minimale pour la partie aléatoire du sel : « The length of the randomly-generated portion of the salt shall be at least 128 bits. » La RFC 8018 (section 3) note que le sel et le nombre d’itérations n’ont pas besoin d’être gardés secrets (« need not be kept secret ») ; ils voyagent dans la chaîne.
- **Un IV de 12 octets, tiré au hasard.** La SP 800-38D recommande de limiter les IV à 96 bits pour favoriser l’interopérabilité, l’efficacité et la simplicité de conception (« to promote interoperability, efficiency, and simplicity of design », section 5.2.1.1). Sa règle centrale est que le même IV ne doit pas servir deux fois sous la même clé (section 8, avec une probabilité « no greater than 2^-32 ») et, quand les IV sont aléatoires, elle plafonne à 2^32 le nombre de chiffrements sous une même clé (section 8.3). Ici, chaque chiffrement a un nouveau sel aléatoire, donc une nouvelle clé, en plus d’un nouvel IV aléatoire.
- **Un tag de 128 bits**, le plus long qu’autorise GCM (section 5.2.1.2) et la valeur par défaut de la Web Cryptography API.
- **AES-256.** PBKDF2 dérive 32 octets, importés comme une clé AES-GCM qui ne peut pas être exportée de l’objet clé du navigateur.

## Ce que l’outil protège, et ce qu’il ne protège pas

**Il protège** le contenu du texte tant qu’il se trouve dans la chaîne, contre quiconque possède la chaîne mais pas la phrase secrète, et il détecte toute modification de la chaîne : AES-GCM rend soit le texte entier, soit l’unique réponse FAIL (SP 800-38D, section 7.2), et la page affiche FAIL sous la forme « Phrase secrète erronée ou texte altéré », sans rien d’autre. Il n’y a aucun résultat partiel à lire.

**Il ne protège pas :**

- **Une phrase secrète faible.** Quiconque possède la chaîne peut essayer des phrases secrètes sur son propre matériel, aussi souvent et aussi vite qu’il le souhaite ; la page n’intervient pas et ne peut pas le ralentir. La RFC 8018 le dit clairement : la cryptographie fondée sur un mot de passe offre une sécurité limitée (« is generally limited in the security that it can provide »), en particulier quand une recherche de mot de passe hors ligne est possible (« where offline password search is possible », section 8). Le nombre d’itérations multiplie le coût de chaque essai ; il n’empêche pas un attaquant d’atteindre une phrase secrète placée en tête de sa liste. La SP 800-132 (annexe A.1) ajoute que ces recherches se parallélisent et peuvent s’exécuter sur un système bien plus puissant (« much more powerful ») que le vôtre.
- **Contre quiconque connaît la phrase secrète.** Qui possède à la fois la chaîne et la phrase secrète lit le texte. Envoyez-les séparément, et jamais dans le même message.
- **Un appareil auquel vous ne pouvez pas vous fier.** Un logiciel malveillant ou un enregistreur de frappe voit ce que vous saisissez avant tout chiffrement ; le NIST note que l’enregistrement des frappes est aussi efficace contre les mots de passe longs et complexes que contre les simples (« equally effective on lengthy and complex passwords as they are on simple ones », [SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), annexe A). Les considérations de sécurité de la Web Cryptography API indiquent elles-mêmes qu’un script injecté dans une page peut permettre l’exfiltration de clés ou de données (« may allow for the exfiltration of keys or data »), et que les navigateurs ne sont pas tenus d’effacer le matériel de clé de la mémoire ou du stockage (section 6.2).
- **La longueur.** La chaîne indique à peu près la longueur du texte.
- **Ce qui se passe après le déchiffrement.** Le texte s’affiche dans la page. Le copier le place dans le presse-papiers du système, où d’autres programmes peuvent le lire.

## La note sur la phrase secrète

Pendant que vous saisissez une phrase secrète en mode Chiffrer, la page affiche sa longueur en caractères et en octets UTF-8, et les types de caractères qu’elle contient (minuscules et majuscules, lettres sans casse, chiffres, espaces, ponctuation ou symboles). Elle signale aussi quand la phrase secrète commence ou se termine par un espace, et quand la préparation la modifie. Elle ne calcule **aucun score de robustesse**, délibérément :

- Un attaquant n’essaie pas des phrases secrètes au hasard ; il essaie d’abord les plus probables (mots, noms, dates, citations, mots de passe issus de fuites antérieures). La page ne peut pas savoir où se situe la vôtre dans une telle liste : un score serait donc inventé.
- Le NIST considère la longueur comme un facteur essentiel de la robustesse d’un mot de passe (« a primary factor in characterizing password strength ») et constate que les règles de composition (exiger des chiffres, des majuscules et des symboles) apportent moins que prévu, car les gens les satisfont de façon prévisible : « password » devient « Password1! » (SP 800-63B-4, annexe A). Il indique aussi que résister aux attaques hors ligne exige des mots de passe plus complexes de plusieurs ordres de grandeur (« orders of magnitude more complex ») que résister aux essais en ligne.
- La SP 800-132 (annexe A.1) indique que les mots de passe de moins de 10 caractères sont généralement considérés comme faibles, et les phrases secrètes de moins de 20 caractères aussi. La même annexe déconseille les suites de chiffres ou de lettres, ainsi que les informations personnelles comme un nom, un numéro de téléphone ou une date de naissance.

Le mode Chiffrer demande la phrase secrète deux fois et reste désactivé tant que les deux ne correspondent pas : un texte chiffré avec une phrase secrète mal saisie est irrécupérable, pour qui que ce soit.

## Rien ne quitte la page

- **Aucune requête.** Le chiffrement et le déchiffrement sont des appels à la Web Cryptography API du navigateur. Rien n’est envoyé à ce site ni ailleurs.
- **Aucun stockage.** Le texte, la phrase secrète et les résultats n’existent que dans la mémoire de la page, tant qu’elle est ouverte ; Effacer vide tous les champs. Rien n’est écrit dans le stockage local, dans les cookies ni dans aucun autre espace de stockage.
- **Rien dans l’adresse.** La page n’écrit rien dans sa propre adresse. Un lien n’est créé que lorsque vous appuyez sur Partager les résultats, et il ne contient que la chaîne chiffrée (section suivante).
- **La vérification orthographique est désactivée** sur les champs (l’attribut HTML `spellcheck="false"`). Le [correcteur orthographique amélioré](https://support.google.com/chrome/answer/12027911?hl=en) de Chrome envoie à Google le texte saisi dans le navigateur (« sends the text you enter in your browser to Google ») ; le [HTML Standard](https://html.spec.whatwg.org/multipage/interaction.html) (section 6.8.5) permet au réglage propre à chaque personne de prendre le pas sur l’attribut : si vous avez forcé la vérification orthographique partout, désactivez-la avant de saisir des secrets. Les champs de phrase secrète sont des champs de mot de passe, qui ne font pas partie des champs que le Standard recommande aux navigateurs de vérifier (champs de texte, de recherche, d’URL et d’e-mail, et zones de texte), tant que vous ne choisissez pas Afficher.
- **Aucun formulaire.** Les champs ne sont pas dans un formulaire et n’ont pas de nom : rien ne peut donc les soumettre.
- **La Web Cryptography API exige un contexte sécurisé.** Son interface `subtle` n’existe que sur les pages servies de façon sécurisée (la spécification la marque `[SecureContext]`) ; sans elle, la page l’indique et ne fait rien.

## Partage des résultats

Sous la chaîne chiffrée (et, en mode Déchiffrer, sous le bouton Déchiffrer), un bouton **Partager les résultats** crée un lien vers cette page qui contient la chaîne chiffrée et rien d’autre : jamais la phrase secrète, jamais le texte. Il ne crée le lien que lorsque vous appuyez dessus, indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage. L’adresse de la page ne change pas.

- **Où va la chaîne.** Après le `#` : `/tools/text-encryption#input=aesgcm1...`. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur n’envoie donc pas la chaîne au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien possède la chaîne. C’est pourquoi la phrase secrète doit passer par un autre chemin.
- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#`. À 600 000 itérations, cela correspond à un texte d’au plus 12 230 octets en UTF-8 ; une chaîne plus longue n’obtient pas de lien, et la fenêtre contextuelle l’indique : copiez plutôt la chaîne.
- **Ouverture d’un lien.** La page s’ouvre en mode Déchiffrer avec la chaîne renseignée, indique qu’elle provient d’un lien et efface toute phrase secrète que vous aviez saisie. Elle ne déchiffre que lorsque vous saisissez la phrase secrète et appuyez sur Déchiffrer. Une valeur qui n’est pas une chaîne bien formée de ce format est ignorée. Dans tous les cas, la page retire aussitôt la valeur de son adresse (sans aucune requête) : un rechargement, un favori ou le bouton Partager de la page n’emporte donc rien.
- **Preuve.** Pour chaque vecteur de référence (golden vector) d’aller-retour et pour l’Exemple, les contrôles de partage du site créent le lien et vérifient que ni la phrase secrète ni le texte n’y figurent, ni tels que saisis, ni en encodage-pourcent, ni en encodage de formulaire, ni décodés.

## Codes d’erreur

| Code | Signification |
|---|---|
| `empty-text` | Chiffrer : il n’y a aucun texte |
| `text-too-large` | Le texte dépasse 1 048 576 octets (1 Mio) en UTF-8, la limite de la page (GCM lui-même autorise jusqu’à 2^39 − 256 bits) |
| `lone-surrogate` | Le texte ou la phrase secrète contient un surrogate isolé, que l’UTF-8 ne peut pas représenter |
| `empty-passphrase` | Aucune phrase secrète |
| `passphrase-too-long` | Plus de 1024 caractères après préparation |
| `bad-salt-length` | Un sel qui ne fait pas 16 octets |
| `bad-iv-length` | Un IV qui ne fait pas 12 octets |
| `iterations-out-of-range` | Un nombre d’itérations hors de la plage de 1000 à 10 000 000 |
| `empty-input` | Déchiffrer : rien d’autre que des caractères d’espacement |
| `input-too-large` | Déchiffrer : plus de 2 000 000 caractères |
| `bad-format` | Pas cinq champs séparés par des points |
| `unknown-version` | Un premier champ autre que `aesgcm1` (l’identifiant est sensible à la casse) |
| `bad-iterations` | Un deuxième champ qui n’est pas un entier décimal sans zéro initial |
| `bad-encoding` | Un champ de sel, d’IV ou de texte chiffré qui n’est pas du base64url canonique sans remplissage |
| `too-short` | Un champ de texte chiffré plus court que le tag de 16 octets |
| `auth-failed` | Le tag ne s’est pas vérifié : phrase secrète erronée, ou chaîne modifiée après sa création |
| `not-utf8` | Le tag s’est vérifié, mais le contenu n’est pas du texte UTF-8 (cet outil n’écrit jamais une telle chaîne) |
| `no-crypto` | La page ne dispose pas de la Web Cryptography API |
| `crypto-error` | La Web Cryptography API a refusé l’opération pour une autre raison |

La page lit une chaîne collée dès que vous la collez et affiche son format, son nombre d’itérations et ses tailles, ou la raison pour laquelle elle ne peut pas être lue, avant que vous ne saisissiez la phrase secrète.

## Exemples commentés

- **Le bouton Exemple, en mode Chiffrer**, renseigne le texte « Lab notes: the core switch maintenance window moves to Saturday 02:00 (São Paulo). » et la phrase secrète `Password` dans les deux champs. `Password` est le mot de passe de test de la RFC 7914, section 11, que tout le monde peut lire ; la page le signale comme la phrase secrète de l’Exemple chaque fois qu’il figure dans le champ. Ne l’utilisez jamais pour un vrai texte. Appuyez sur Chiffrer et vous obtenez une chaîne de 187 caractères (83 octets de texte, 99 octets une fois scellé), différente à chaque fois.
- **Le bouton Exemple, en mode Déchiffrer**, renseigne la chaîne que fixe le vecteur de référence « example » : `aesgcm1.600000.AAECAwQFBgcICQoLDA0ODw.EBESExQVFhcYGRob.3lWZ...` (la chaîne complète figure dans la page). Elle a été produite avec un sel fixe (octets 00 à 0f) et un IV fixe (octets 10 à 1b), que la page elle-même n’utilise jamais. Avec `Password`, elle se déchiffre en le texte ci-dessus ; avec `password`, elle donne `auth-failed`.
- **Modifier un caractère.** Modifiez n’importe quel caractère du texte chiffré, du sel, de l’IV ou du nombre d’itérations d’une chaîne valide, et le déchiffrement donne `auth-failed`, jamais un texte altéré.
- **La même phrase secrète, saisie différemment.** « coração de exemplo » saisi avec des caractères composés, avec des caractères décomposés ou avec un espace insécable entre les mots dérive la même clé : les trois déchiffrent donc la même chaîne.

## Provenance

Le moteur est un ensemble de fonctions pures autour de la Web Cryptography API : à texte, phrase secrète, sel, IV et nombre d’itérations identiques, il écrit toujours la même chaîne. Il est livré avec des vecteurs de référence (jeu `text-encryption-golden-2026-10-27`, 207 contrôles) :

- **Réponses connues pour les primitives** : les deux vecteurs PBKDF2-HMAC-SHA-256 de la [RFC 7914](https://www.rfc-editor.org/rfc/rfc7914), section 11 ; sept vecteurs de chiffrement AES-GCM tirés du fichier `gcmEncryptExtIV256.rsp` du Cryptographic Algorithm Validation Program du NIST (AES-256, IV de 96 bits, tag de 128 bits ; textes en clair de 0 à 408 bits, données additionnelles de 0 à 720 bits), chacun également redéchiffré ; et deux vecteurs de déchiffrement tirés de `gcmDecrypt256.rsp`, dont l’un est marqué FAIL par le fichier et refusé par le moteur.
- **L’encodage** : les chaînes de la section 10 de la RFC 4648, et sept chaînes que le décodeur strict doit refuser.
- **Allers-retours** avec des sels et des IV fixes (l’Exemple à 600 000 itérations ; de l’ASCII, du portugais avec des sauts de ligne et une tabulation, des caractères hors du plan multilingue de base, une marque d’ordre des octets en tête ; trois graphies d’une même phrase secrète), chacun vérifié dans les deux sens. Chaque chaîne attendue a d’abord été calculée par un script Python distinct (hashlib et le paquet cryptography) à partir du format tel qu’il est décrit ici, et non par le moteur.
- **Refus** : 35 refus de déchiffrement (chaque erreur de format, les bornes du nombre d’itérations, des phrases secrètes erronées, un texte chiffré, un tag, un IV, un sel et un nombre d’itérations modifiés, le texte chiffré d’une autre chaîne, et des octets authentiques qui ne sont pas de l’UTF-8) et 11 refus de chiffrement, chacun avec son code, ainsi qu’un contrôle vérifiant qu’aucun refus ne contient de texte.
- **Partage des résultats** : 5 chaînes qu’un lien peut contenir (compactes, caractères d’espacement supprimés) et 9 textes qu’il ne peut pas contenir (un texte en clair, une phrase secrète, une chaîne tronquée, une autre version, des nombres d’itérations hors plage, de mauvais encodages, une phrase secrète ajoutée comme sixième champ).

## API

Aucune, délibérément. L’API HTTP du site exécute les outils sur un serveur ; cet outil devrait donc y recevoir une phrase secrète ou un texte en clair, ce qu’il existe précisément pour éviter. Il figure parmi les outils exclus de l’API, avec cette raison.

## Sources

- [NIST SP 800-38D, Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC, novembre 2007](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf) (consulté le 27/10/2026) : sections 5.2.1, 7.1, 7.2, 8, 8.2.2 et 8.3. Sa [page CSRC](https://csrc.nist.gov/pubs/sp/800/38/d/final) (consultée le 27/10/2026) porte une note de planification du 6 mars 2024 : le NIST a décidé de la réviser.
- [NIST CAVP, GCM test vectors (gcmtestvectors.zip)](https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Algorithm-Validation-Program/documents/mac/gcmtestvectors.zip) (consulté le 27/10/2026) : `gcmEncryptExtIV256.rsp` et `gcmDecrypt256.rsp`, CAVS 14.0
- [RFC 8018, PKCS #5: Password-Based Cryptography Specification Version 2.1](https://www.rfc-editor.org/rfc/rfc8018) (consultée le 27/10/2026) : sections 3, 4.1, 4.2, 5.2, 6.2 et 8 ; ses quatre errata vérifiés ne concernent que les annexes ASN.1, et la RFC 9579 et la RFC 9879 ne la mettent à jour que pour PKCS #12
- [RFC 7914, The scrypt Password-Based Key Derivation Function](https://www.rfc-editor.org/rfc/rfc7914) (consultée le 27/10/2026) : section 11, les vecteurs de test PBKDF2-HMAC-SHA-256
- [OWASP Cheat Sheet Series, Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) (consulté le 27/10/2026) : PBKDF2, 600 000 itérations pour PBKDF2-HMAC-SHA256
- [NIST SP 800-132, Recommendation for Password-Based Key Derivation, Part 1: Storage Applications, décembre 2010](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) (consulté le 27/10/2026) : sections 5.1 et 5.2, annexe A. Sa [page CSRC](https://csrc.nist.gov/pubs/sp/800/132/final) porte une note de planification du 11 mai 2023 : le NIST prévoit de la réviser.
- [W3C, Web Cryptography API, recommandation du 26 janvier 2017](https://www.w3.org/TR/2017/REC-WebCryptoAPI-20170126/), et [Web Cryptography Level 2, premier brouillon public (First Public Working Draft) du 22 avril 2025](https://www.w3.org/TR/WebCryptoAPI/), désormais servi à l’adresse de l’API (tous deux consultés le 27/10/2026) : getRandomValues, AES-GCM, PBKDF2, la règle du contexte sécurisé et les considérations de sécurité
- [RFC 4648, The Base16, Base32, and Base64 Data Encodings](https://www.rfc-editor.org/rfc/rfc4648) (consultée le 27/10/2026) : sections 3.2, 3.5, 5 et 10
- [RFC 8265, Preparation, Enforcement, and Comparison of Internationalized Strings Representing Usernames and Passwords](https://www.rfc-editor.org/rfc/rfc8265) (consultée le 27/10/2026) : section 4.2.2
- [RFC 3629, UTF-8, a transformation format of ISO 10646](https://www.rfc-editor.org/rfc/rfc3629) (consultée le 27/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment
- [NIST SP 800-63B-4, Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html) (consulté le 27/10/2026) : annexe A, Strength of Passwords
- [Aide Google Chrome, Turn Chrome spell check on and off](https://support.google.com/chrome/answer/12027911?hl=en) (consultée le 27/10/2026), et le [HTML Standard, section 6.8.5, Spelling and grammar checking](https://html.spec.whatwg.org/multipage/interaction.html) (consulté le 27/10/2026)
