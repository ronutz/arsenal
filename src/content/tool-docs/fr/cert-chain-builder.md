## Ce que fait l’outil

L’outil prend un nombre quelconque de certificats X.509 au format PEM, dans n’importe quel ordre, et fait ce que fait le constructeur de chemin d’un client TLS avant de vérifier la moindre signature : il trouve l’entité finale, remonte de chaque certificat à son émetteur, et indique la chaîne qu’un serveur devrait envoyer, les certificats manquants, ceux qui sont en trop, et chaque règle structurelle de la validation de chemin de la RFC 5280 que la chaîne enfreint. La page vérifie ensuite la signature de chaque maillon dans votre navigateur avec WebCrypto, et le dit séparément, car le résultat structurel est le même sur toutes les machines, alors que la vérification des signatures dépend des capacités du navigateur.

Collez le certificat feuille (leaf), les intermédiaires, la racine si vous l’avez, une ancienne signature croisée (cross-sign) dont vous doutez, l’intermédiaire deux fois par erreur : la page fait le tri et indique ce qu’elle a fait de chacun.

## Construction de la chaîne

- **L’entité finale** est le certificat qu’aucun autre certificat de l’entrée n’émet et dont l’extension basicConstraints n’affirme pas cA. S’il y a plusieurs certificats de ce type, le premier est retenu et les autres sont signalés ; s’il n’y en a aucun (un lot d’intermédiaires seul), l’AC la plus haute est retenue et la page le signale.
- **Chaque maillon** est établi de l’Authority Key Identifier au Subject Key Identifier quand les deux certificats en portent un (RFC 5280, section 4.2.1.1 : l’identifiant de clé existe pour faciliter la construction du chemin de certification, « to facilitate certification path construction »), et du nom de l’émetteur au nom du sujet quand l’un des deux n’en porte pas. Un certificat qui porte le bon nom mais une clé différente n’est pas un émetteur : il est signalé comme une AC dont la clé a été renouvelée (rollover), et le véritable émetteur comme manquant.
- **Plusieurs émetteurs possibles** (une AC à signature croisée, ou deux certificats pour la même clé) : la page retient celui dont la période de validité couvre le début de validité du sujet, et liste les autres comme en trop.
- **Le chemin s’arrête** sur un certificat autosigné (sujet égal à l’émetteur, sans que les identifiants de clé le contredisent), ou quand l’émetteur suivant n’est pas dans l’entrée. Dans le second cas, l’émetteur manquant est nommé, avec l’identifiant de clé qu’attend le sujet et l’URL caIssuers que porte le certificat, le cas échéant. La page ne la télécharge pas.

## Les règles vérifiées

Le long du chemin, de haut en bas, les contrôles de la section 6.1.4 de la RFC 5280 qui ne demandent aucune cryptographie :

- **(k) basicConstraints.** Un émetteur en version 3 doit porter l’extension avec cA à TRUE. Si le booléen cA n’est pas affirmé, le bit keyCertSign de l’extension key usage ne doit pas l’être non plus (« If the cA boolean is not asserted, then the keyCertSign bit in the key usage extension MUST NOT be asserted »), et la clé ne doit pas servir à vérifier des signatures de certificats (« MUST NOT be used to verify certificate signatures », section 4.2.1.9).
- **(n) keyUsage.** Quand l’extension est présente sur un émetteur, keyCertSign doit être positionné.
- **(l) et (m) pathLenConstraint.** La valeur donne le nombre maximal de certificats intermédiaires non auto-émis qui peuvent suivre ce certificat dans un chemin de certification valide (« gives the maximum number of non-self-issued intermediate certificates that may follow this certificate in a valid certification path ») ; l’entité finale n’entre pas dans cette limite (« is not included in this limit »), et zéro signifie qu’aucun intermédiaire ne peut suivre. La page compte depuis le haut du chemin, en sautant les certificats auto-émis, et nomme l’AC dont la limite est épuisée. Une racine autosignée au sommet est l’ancre de confiance (trust anchor), qui ne fait pas partie du chemin de certification envisagé (« is not included as part of the prospective certification path », section 6.1) ; sa propre contrainte ne sert que de borne de départ.
- **Validité à un instant donné.** Chaque certificat du chemin est évalué à l’instant choisi, l’horloge de votre appareil par défaut ou une date que vous fixez, et signalé comme expiré ou pas encore valide. Un émetteur qui expire avant le certificat qu’il a émis donne lieu à un avertissement avec la date, car la chaîne cesse d’être valide ce jour-là, quoi qu’indique le certificat feuille.
- **Algorithmes.** Une signature SHA-1 ou MD5 où que ce soit, sauf sur une racine autosignée (dont aucun validateur ne vérifie la signature propre), est signalée au regard des Baseline Requirements du CA/Browser Forum, qui ont mis fin au dernier usage de SHA-1 dans les certificats le 15 septembre 2026 ; une clé RSA de moins de 2048 bits est signalée au regard de la section 6.1.5 du même document.
- **L’entité finale.** Un certificat serveur sans subjectAltName est signalé, car les navigateurs ne comparent le nom d’hôte qu’à cette extension.

## Les verdicts

- **Complète** : le chemin va de l’entité finale à un certificat autosigné, tous les maillons sont établis et aucune règle n’est enfreinte. Complète signifie ici structurellement complète ; savoir si la racine est de confiance relève du magasin de confiance du client.
- **Complète, avec avertissements** : idem, avec un point à lire d’abord.
- **La chaîne s’arrête à une AC dont l’émetteur n’est pas ici** : le chemin est sain jusqu’où il va et s’arrête à un intermédiaire dont l’émetteur n’a pas été collé. C’est la forme normale d’une chaîne TLS, puisqu’un certificat qui désigne une ancre de confiance peut être omis de la chaîne si les pairs pris en charge sont réputés posséder les certificats omis (« a certificate that specifies a trust anchor MAY be omitted from the chain, provided that supported peers are known to possess any omitted certificates », RFC 9846, section 4.5.1 ; section 4.4.2 dans la RFC 8446, qu’elle a rendue obsolète en juillet 2026). Si l’émetteur manquant figure dans les magasins de vos clients, rien ne manque ; s’il s’agit lui-même d’un intermédiaire, ajoutez-le.
- **Incomplète** : le chemin s’arrête à l’entité finale. Aucun client ne peut construire de chaîne à partir de ce qui est fourni ; ajoutez les intermédiaires.
- **Non valide** : une règle ci-dessus est enfreinte. Un client conforme rejette la chaîne.

## La chaîne à configurer

La page réencode les certificats du chemin à partir de leurs octets, en base64 sur 64 colonnes, dans l’ordre que demande la section 4.5.1 de la RFC 9846, le certificat de l’expéditeur d’abord, puis chaque certificat certifiant directement celui qui le précède : « The sender's certificate MUST come in the first CertificateEntry in the list. Each following certificate SHOULD directly certify the one immediately preceding it. » La racine peut être incluse ou omise ; les serveurs l’omettent normalement. L’emplacement du fichier dépend du serveur :

- **nginx** : un seul fichier, où le certificat du serveur doit précéder les certificats de la chaîne (« the server certificate must appear before the chained certificates in the combined file ») ; un mauvais ordre fait échouer le démarrage sur une erreur key values mismatch, car nginx essaie la clé privée avec le premier certificat qu’il trouve.
- **Apache httpd 2.4.8 et versions ultérieures** : `SSLCertificateFile` peut aussi inclure les certificats d’AC intermédiaires, triés de la feuille à la racine (« may also include intermediate CA certificates, sorted from leaf to root »), ce qui rend SSLCertificateChainFile obsolète (« obsoletes SSLCertificateChainFile »).
- **F5 BIG-IP** : les intermédiaires sont importés comme un objet certificat à part entière (collés à la suite, sans espace entre eux, « in sequence with no space between ») et sélectionnés comme Chain du certificat et de la clé dans le profil Client SSL ou Server SSL ; le certificat feuille reste dans son propre objet. L’article de F5 ajoute que placer le certificat de l’AC racine dans le lot est facultatif et n’amène jamais le client à faire confiance à cette AC racine (« putting the root CA certificate in the certificate bundle is optional, and will never cause the client to trust the root CA »).

## Ce que la page vérifie cryptographiquement, et ce qu’elle ne vérifie pas

La signature de chaque maillon est vérifiée dans le navigateur, avec la clé publique de l’émetteur affichée dans le tableau : RSASSA-PKCS1-v1_5 et RSASSA-PSS avec SHA-1, SHA-256, SHA-384 ou SHA-512, ECDSA sur P-256, P-384 et P-521, et Ed25519 quand le navigateur le prend en charge. Une racine autosignée est vérifiée avec sa propre clé, ce qui prouve que le certificat est cohérent, pas que quiconque lui fait confiance. Tout ce que le navigateur ne sait pas faire apparaît comme non vérifié, jamais comme en échec.

Non effectué ici, et effectué par un validateur : la consultation d’un magasin de confiance, la comparaison du nom d’hôte avec subjectAltName, l’évaluation des contraintes de nom, des contraintes de politique et de l’usage étendu de la clé (extended key usage) le long du chemin, et la vérification de la révocation. Les pointeurs CRL (liste de révocation de certificats, certificate revocation list) et OCSP (Online Certificate Status Protocol) du chemin sont listés ; aucun n’est contacté.

Pour voir ce qu’un validateur a fait de la chaîne qu’un serveur envoie réellement, lancez `openssl s_client -showcerts` contre le serveur et collez sa sortie dans l’[analyseur openssl s_client](/tools/openssl-s-client-explainer) : les blocs PEM forment la chaîne telle qu’envoyée, que cette page peut ensuite trier, et le Verify return code est le verdict d’OpenSSL sur cette chaîne.

## Partage des résultats

Sous le verdict, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les certificats tels que vous les avez collés et, si vous en avez fixé une, la date du champ « Validité évaluée au » : `/tools/cert-chain-builder#certs=...&asof=2026-10-04`. Sans date, la page évalue selon sa propre horloge : un lien ouvert plus tard évalue donc selon l’horloge de la personne qui l’ouvre. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : les certificats ne sont donc pas envoyés au serveur à l’ouverture du lien ; ils restent dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut les lire.

- **Une clé privée n’est jamais transmise.** Un fichier PEM combiné (la chaîne complète et sa clé, comme certains serveurs le chargent) contient une clé que le constructeur ignore. Quand la zone contient un bloc `-----BEGIN ... PRIVATE KEY-----`, aucun lien n’est proposé, et la fenêtre contextuelle demande de retirer d’abord la clé.
- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Les certificats remplissent la zone comme un collage et la date est réglée ; la page construit le chemin et vérifie les signatures dans le navigateur, comme pour un collage. Une date qui n’est pas un jour réel au format AAAA-MM-JJ fait ignorer tout le lien. Dans les deux cas, les valeurs quittent aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
- **Liens venant d’autres pages.** Une valeur transmise sous la forme `#input=` remplit toujours la zone exactement comme avant ; Partager les résultats utilise ses propres noms (`certs`, `asof`), et les deux ne se mélangent jamais.

## Limites

- Jusqu’à 32 blocs de certificat et 262 144 caractères en entrée ; PEM uniquement (un fichier DER se convertit avec `openssl x509 -inform der -outform pem`).
- Les noms sont comparés sous la forme de noms distinctifs sur une ligne, tels que les affiche le décodeur, ce qui est plus strict que la comparaison de la section 7.1 de la RFC 5280 dans certains cas limites de type de chaîne et de casse ; une chaîne qui ne se lie que selon ces règles est signalée comme non liée.
- L’instant est une date à 00:00 UTC quand vous en fixez une, et sinon l’horloge de votre appareil, à la seconde près.
- Les navigateurs diffèrent face à un intermédiaire manquant : certains le récupèrent à la volée via l’URL caIssuers ; Firefox précharge plutôt les intermédiaires depuis la base d’AC de Mozilla (depuis Firefox 75) et ne télécharge rien. Une chaîne qui fonctionne dans un navigateur et pas dans un autre relève généralement de ce cas.

## Sources

- [RFC 5280: Internet X.509 Public Key Infrastructure Certificate and CRL Profile](https://www.rfc-editor.org/rfc/rfc5280) (consultée le 04/10/2026) : sections 4.2.1.1, 4.2.1.2, 4.2.1.3, 4.2.1.9, 6.1 et 6.1.4
- [RFC 9846: The Transport Layer Security (TLS) Protocol Version 1.3, juillet 2026, section 4.5.1, même texte que la section 4.4.2 de la RFC 8446, qu’elle rend obsolète](https://www.rfc-editor.org/rfc/rfc9846.html#section-4.5.1) (consultée le 26/10/2026)
- [CA/Browser Forum: Baseline Requirements for TLS Server Certificates, version 2.3.1](https://github.com/cabforum/servercert/blob/main/docs/BR.md) (consulté le 04/10/2026) : section 6.1.5 et historique des modifications
- [RFC 9155: Deprecating MD5 and SHA-1 Signature Hashes in TLS 1.2 and DTLS 1.2](https://www.rfc-editor.org/rfc/rfc9155) (consultée le 04/10/2026)
- [nginx: Configuring HTTPS servers, SSL certificate chains](https://nginx.org/en/docs/http/configuring_https_servers.html) (consulté le 04/10/2026)
- [Apache HTTP Server 2.4: mod_ssl, SSLCertificateFile et SSLCertificateChainFile](https://httpd.apache.org/docs/2.4/mod/mod_ssl.html) (consulté le 04/10/2026)
- [F5 K13302: Configure the BIG-IP system to use an SSL chain certificate](https://my.f5.com/manage/s/article/K13302) (mis à jour le 26/11/2025, consulté le 04/10/2026)
- [Mozilla: Intermediate CA Preloading](https://wiki.mozilla.org/Security/CryptoEngineering/Intermediate_Preloading) (consulté le 04/10/2026)
- [Let's Encrypt: Chains of Trust](https://letsencrypt.org/certificates/) (consulté le 04/10/2026) : la hiérarchie à laquelle appartient la chaîne d’exemple
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien créé par Partager les résultats
