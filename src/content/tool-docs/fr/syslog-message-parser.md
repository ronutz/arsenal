## Ce que fait l’outil

L’outil lit un message syslog tel que reçu, ou une trame TCP qui en transporte un, et nomme chaque champ dans l’ordre où sa RFC les nomme. Deux grammaires sont essayées : le message RFC 5424 (PRI, VERSION, TIMESTAMP, HOSTNAME, APP-NAME, PROCID, MSGID, STRUCTURED-DATA, MSG) et la forme BSD que décrit la RFC 3164 (PRI, TIMESTAMP, HOSTNAME, TAG, CONTENT). La PRI est décomposée en facility (catégorie syslog) et gravité à l’aide des mêmes tables que le [décodeur de PRI syslog](/tools/syslog-pri-decoder). Tout ce qui n’est pas conforme est signalé dans les termes mêmes de la RFC, et les données structurées sont décomposées élément par élément, avec l’explication des paramètres enregistrés à l’IANA. Rien n’est envoyé nulle part.

## Ce que l’outil vérifie, et d’où vient chaque règle

RFC 5424 (mars 2009), consultée le 05/10/2026 :

- La PRI : `<` PRIVAL `>`, PRIVAL = Facility × 8 + Severity, de trois à cinq caractères ; un zéro initial n’est admis que pour la valeur de priorité nulle (« The only time a value of 0 follows the < is for the Priority value of 0. Otherwise, leading 0s MUST NOT be used », §6.2.1). Au-delà de 191, il n’existe aucune facility.
- VERSION : un chiffre non nul suivi d’au plus deux chiffres ; la RFC fixe sa propre valeur (« This document uses a VERSION value of 1 », §6.2.2).
- TIMESTAMP : un horodatage formalisé (« a formalized timestamp derived from RFC 3339 ») ; T et Z en majuscules (« The T and Z characters in this syntax MUST be upper case ») ; aucune seconde intercalaire (« Leap seconds MUST NOT be used ») ; TIME-SECFRAC est un point suivi de un à six chiffres ; ou bien la NILVALUE (§6.2.3 et §6).
- HOSTNAME de 1 à 255, APP-NAME de 1 à 48, PROCID de 1 à 128, MSGID de 1 à 32 caractères US-ASCII imprimables, ou la NILVALUE (§6).
- STRUCTURED-DATA : `[` SD-ID *(SP SD-PARAM) `]`, éléments accolés ; un SD-ID compte au plus 32 caractères ; un même SD-ID ne peut figurer qu’une fois dans un message (« The same SD-ID MUST NOT exist more than once in a message ») ; les noms enregistrés ne contiennent pas d’arobase, les noms privés en contiennent une, suivie d’un numéro d’entreprise ; dans une PARAM-VALUE, les caractères `"`, `\` et `]` sont échappés par une barre oblique inverse (§6.3). Les SD-ID IANA du §7 sont timeQuality (tzKnown, isSynced, syncAccuracy), origin (ip, enterpriseId, software, swVersion) et meta (sequenceId, sysUpTime, language) ; un paramètre absent de ces listes sous l’un de ces identifiants est signalé.
- MSG : la chaîne encodée doit alors commencer par l’indicateur d’ordre des octets (BOM) Unicode (« If a syslog application encodes MSG in UTF-8, the string MUST start with the Unicode byte order mask (BOM) », §6.4) ; un texte non ASCII sans BOM est d’encodage inconnu et il est signalé.
- Longueur : la RFC fixe une taille que tout récepteur doit accepter, et une taille plus grande que tout récepteur devrait accepter (« Any transport receiver MUST be able to accept messages of up to and including 480 octets in length. All transport receiver implementations SHOULD be able to accept messages of up to and including 2048 octets in length », §6.1).

RFC 3164 (août 2001), consultée le 05/10/2026 :

- Le paquet a une taille maximale (« MUST be 1024 bytes or less », §4.1).
- TIMESTAMP « Mmm dd hh:mm:ss » en heure locale, le mois étant l’une des douze abréviations anglaises ; un jour à un seul chiffre s’écrit précédé d’un espace (« If the day of the month is less than 10, then it MUST be represented as a space and then the number », §4.1.2).
- HOSTNAME contient le nom d’hôte sous lequel l’équipement se connaît, ou à défaut sa propre adresse IP (« will contain the hostname, as it knows itself. If it does not have a hostname, then it will contain its own IP address », §4.1.2).
- TAG est une chaîne alphanumérique de longueur limitée, terminée par le premier caractère non alphanumérique (« is a string of ABNF alphanumeric characters that MUST NOT exceed 32 characters. Any non-alphanumeric character will terminate the TAG field », §4.1.3).
- Un paquet dont le HEADER est illisible : le récepteur traite tout ce qui suit la PRI comme le message (§4.3).

Transports, consultés le 05/10/2026 : UDP, port 514 (RFC 5426 §3.1) ; TCP avec comptage d’octets, « SYSLOG-FRAME = MSG-LEN SP SYSLOG-MSG », ce mode de délimitation pouvant être supposé quand une trame syslog commence par un chiffre (« It can be assumed that octet-counting framing is used if a syslog frame starts with a digit »), ou délimitation non transparente avec un caractère de fin (TRAILER), le plus souvent LF (« most often is ASCII LF ») (RFC 6587 §3.4.1 et §3.4.2) ; TLS sur le port TCP 6514 (RFC 5425 §4.1). Un compte initial ou un saut de ligne final dans le texte collé est lu comme cette délimitation, et le compte déclaré est comparé aux octets réels du message.

## Limites

- Un message à la fois. Un fichier entier relève de votre chaîne de traitement des journaux ; collez la ligne qui vous intéresse.
- L’analyseur lit le message, pas le réseau : il ne peut pas connaître le transport par lequel le message est arrivé, seulement les octets de délimitation qu’il contient.
- La forme RFC 3164 n’a ni année ni fuseau dans son horodatage ; l’analyseur le dit au lieu de les deviner.
- L’entrée est coupée à 8192 caractères.

## Partage des résultats

Sous le verdict, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient le message tel que collé (`#input=...`), et rien d’autre. Avant toute copie, la fenêtre contextuelle ajoute une mise en garde : un message de journal peut nommer des hôtes, des utilisateurs et des adresses ; relisez-le donc avant d’envoyer le lien. Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur qu’il aurait.
- **Ouverture d’un lien.** Le texte remplace le contenu de la zone (la page s’ouvre sur l’exemple) comme un collage, et la page le relit. Que le lien soit accepté ou non, les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, un favori ou le bouton Partager de la page n’emporte donc rien que vous n’ayez choisi de partager.

## Sources

- [RFC 5424, The Syslog Protocol, sections 6 à 7](https://www.rfc-editor.org/rfc/rfc5424.html#section-6) (consultée le 05/10/2026)
- [RFC 3164, The BSD syslog Protocol, sections 4.1 à 4.3](https://www.rfc-editor.org/rfc/rfc3164.html#section-4.1) (consultée le 05/10/2026)
- [RFC 5426, Transmission of Syslog Messages over UDP](https://www.rfc-editor.org/rfc/rfc5426.html#section-3.1) (consultée le 05/10/2026)
- [RFC 5425, TLS Transport Mapping for Syslog, section 4.1](https://www.rfc-editor.org/rfc/rfc5425.html#section-4.1) (consultée le 05/10/2026)
- [RFC 6587, Transmission of Syslog Messages over TCP, sections 3.4.1 et 3.4.2](https://www.rfc-editor.org/rfc/rfc6587.html#section-3.4.1) (consultée le 05/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien créé par Partager les résultats
