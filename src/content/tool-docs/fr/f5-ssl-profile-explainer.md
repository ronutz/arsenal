## Ce que fait l’outil

Collez un profil tmsh `client-ssl` ou `server-ssl` : l’outil l’explique, avec le rôle du profil, la matrice des versions du protocole TLS qu’il active et désactive, et une lecture de sécurité qui couvre la chaîne de certificats, la renégociation, le SNI, l’agrafage OCSP (OCSP stapling, Online Certificate Status Protocol) et le TLS mutuel. Il analyse le profil entièrement dans votre navigateur et ne contacte jamais aucun équipement.

## Profils côté client et côté serveur

Sur un BIG-IP, SSL est géré par deux sortes de profils, et la première chose que vous indique l’outil, c’est de quelle sorte est celui-ci. Un profil **client-ssl** termine le TLS venant du client : le BIG-IP présente un certificat et déchiffre le trafic. Un profil **server-ssl** fait l’inverse : il établit le TLS vers le membre du pool, en rechiffrant le trafic à la sortie. Un déploiement TLS en full proxy utilise les deux : il déchiffre le trafic du client pour pouvoir l’inspecter ou l’aiguiller, puis le rechiffre vers le serveur. Connaître le rôle éclaire tout le reste du profil.

## La matrice des protocoles

Les versions de TLS qu’autorise un profil sont fixées par son champ `options`, qui active ou désactive des versions précises. L’outil les présente sous forme de matrice claire, pour que vous voyiez d’un coup d’œil si, par exemple, TLS 1.0 et 1.1, rendus obsolètes par la RFC 8996, sont toujours activés, ou si TLS 1.3 est actif. C’est souvent le point le plus important à vérifier sur un profil SSL, et il est facile de mal le lire dans le masque de bits brut de `options`.

## La lecture de sécurité

Au-delà des protocoles, l’outil évalue les parties du profil qui déterminent le niveau réel de sécurité du TLS :

- le **certificat, la clé et la chaîne**, y compris la complétude de la chaîne ;
- la **renégociation**, et le fait que la renégociation sécurisée (RFC 5746) soit exigée ou non ;
- le **SNI** (RFC 6066), pour présenter le bon certificat quand plusieurs noms partagent le profil ;
- l’**agrafage OCSP** (l’extension `status_request`, RFC 6066), qui permet au serveur de fournir lui-même la preuve de l’état de révocation de son certificat ; et
- la **validation du certificat du pair**, qui est la façon de configurer le TLS mutuel, où le BIG-IP exige et vérifie un certificat client.

Chacun reçoit une note, pour que les paramètres risqués se distinguent des paramètres sains.

## Utilisation

Collez un bloc de profil `client-ssl` ou `server-ssl` et lisez son rôle, sa matrice des protocoles et l’évaluation de sécurité de ses paramètres de chaîne, de renégociation, de SNI, d’OCSP et de TLS mutuel. L’analyse est déterministe et locale.

Pour vérifier ce qu’un client négocie réellement avec un serveur virtuel qui utilise le profil, exécutez `openssl s_client` vers ce serveur virtuel et collez la sortie dans l’[analyseur openssl s_client](/tools/openssl-s-client-explainer) ; la chaîne de chiffrement du profil se lit avec l’[analyseur de chaînes de chiffrement F5](/tools/f5-cipher-string-expander).

## Partage des résultats

Sous l’en-tête du profil, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le profil avec la valeur de chaque paramètre `passphrase` et `proxy-ca-passphrase` remplacée par `[redacted]`, jamais tel que collé ; les références [client-ssl](https://clouddocs.f5.com/api/icontrol-rest/APIRef_tm_ltm_profile_client-ssl.html) et [server-ssl](https://clouddocs.f5.com/api/icontrol-rest/APIRef_tm_ltm_profile_server-ssl.html) de F5 (consultées le 27/10/2026) les décrivent comme la phrase secrète de la clé et la phrase secrète de la clé de l’AC du SSL Forward Proxy. Sa fenêtre contextuelle indique d’abord ce que contient le lien et combien de valeurs ont été remplacées, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Cette page n’affiche jamais ces valeurs non plus : la page qui reçoit le lien lit donc le même profil. `passphrase none` est conservé, tout comme les noms, les partitions, les objets fichier et les noms d’hôte. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la copie n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La copie remplit la zone comme le ferait un collage, et la page l’explique. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
