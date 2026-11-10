## Ce que fait l’outil

Collez une URL et l’outil vous dit où elle pointe réellement : bouclage, plage privée ou de lien local, point de terminaison de métadonnées cloud, espace partagé CGNAT, autre espace réservé, ou Internet public. Il décode les astuces d’obfuscation d’IP qui servent à déguiser une adresse interne, lit l’adresse IPv4 qu’une adresse IPv6 peut transporter (six formats, Teredo compris), nomme le bloc à usage spécifique de l’IANA dans lequel tombe une adresse, pour chaque ligne des deux registres, signale les adresses de service anycast à usage spécifique, signale les schémas d’URL dangereux et les identifiants intégrés, et affiche un niveau de risque SSRF. Il ne fait jamais de résolution DNS et n’envoie jamais la requête : c’est un classificateur, pas une sonde.

## La SSRF, et pourquoi le classement compte

La falsification de requête côté serveur (SSRF, Server-Side Request Forgery) est une attaque dans laquelle on amène un serveur à envoyer une requête vers une URL choisie par l’attaquant, généralement pour atteindre ce que l’attaquant ne peut pas atteindre directement : un service sur `localhost`, une machine d’une plage interne, ou le point de terminaison de métadonnées d’un fournisseur cloud. S’en défendre revient à décider si une URL peut être récupérée sans danger, et cette décision est plus difficile qu’il n’y paraît, car une adresse interne peut s’écrire sous de nombreuses formes déguisées. L’outil est conçu pour cette décision : il sert à comprendre une URL et à concevoir une liste d’autorisation, résolument du côté défensif.

## Les obfuscations décodées

Un filtre naïf qui bloque `127.0.0.1` manque les nombreuses autres façons d’écrire la même adresse, et c’est précisément ce qu’exploitent les attaquants. L’outil les décode pour rendre visible la destination réelle :

- la forme entière **décimale**, où `2130706433` vaut `127.0.0.1` et `2852039166` l’adresse de métadonnées `169.254.169.254` (celle que charge le bouton Exemple) ;
- les formes d’octets **octales** et **hexadécimales** ;
- l’IPv4 en **forme courte**, où `127.1` se développe en `127.0.0.1` ;
- **toute écriture d’une adresse IPv6** : l’outil décompose l’adresse en ses huit blocs de 16 bits avant tout classement, si bien que `[0:0:0:0:0:0:0:1]` et `[0000:0000:0000:0000:0000:0000:0000:0001]` sont l’adresse de bouclage `::1`, exactement comme la RFC 4291 présente `0:0:0:0:0:0:0:1` et `::1` comme deux écritures de l’adresse de bouclage, la notation « :: » remplaçant un ou plusieurs groupes nuls (« The use of "::" indicates one or more groups of 16 bits of zeros », [RFC 4291, section 2.2](https://www.rfc-editor.org/rfc/rfc4291.txt)) ; et
- les **adresses IPv6 qui transportent une adresse IPv4**, décrites dans la section suivante.

L’outil classe ensuite l’adresse littérale obtenue par rapport à chaque ligne des registres d’adresses à usage spécifique de l’IANA et signale les adresses de métadonnées cloud, cibles de choix pour la SSRF. L’adresse décodée s’affiche dans la forme textuelle canonique de la [RFC 5952](https://www.rfc-editor.org/rfc/rfc5952.txt) : en minuscules, sans zéros de tête, la plus longue suite de blocs nuls écrite `::` (section 4), et, pour les préfixes qui signalent à eux seuls une adresse IPv4 intégrée, en notation mixte avec une fin décimale pointée, car la notation mixte est recommandée quand une condition est remplie (« mixed notation is RECOMMENDED if the following condition is met ») et que cette condition est un préfixe bien connu, comme ceux que définit la RFC 4291 (section 5).

## Adresses IPv6 qui transportent une adresse IPv4

Six formats d’adresse IPv6 placent une adresse IPv4 dans les 128 bits. Un filtre qui ne vérifie que le texte IPv6 laisse passer la cible IPv4 interne : l’outil décode donc l’adresse IPv4, évalue l’URL d’après elle, indique le format d’intégration décodé et affiche la ligne de registre de l’adresse transportée. Une adresse publique transportée dans un tel format est évaluée publique, avec le format nommé.

| Format | Préfixe | Emplacement de l’adresse IPv4 | Source |
|---|---|---|---|
| IPv4 mappée | `::ffff:0:0/96` | les 32 bits de poids faible | [RFC 4291, section 2.5.5.2](https://www.rfc-editor.org/rfc/rfc4291.txt) |
| Compatible IPv4 (obsolète) | `::/96`, sauf `::` et `::1` | les 32 bits de poids faible | [RFC 4291, section 2.5.5.1](https://www.rfc-editor.org/rfc/rfc4291.txt) |
| Préfixe bien connu NAT64 (Well-Known Prefix) | `64:ff9b::/96` | les 32 bits de poids faible (format /96) | [RFC 6052, sections 2.1 et 2.2](https://www.rfc-editor.org/rfc/rfc6052.txt) |
| Préfixe NAT64 à usage local | `64:ff9b:1::/48` | selon la longueur de préfixe choisie par l’opérateur : format /48, /56, /64 ou /96 de la RFC 6052 | [RFC 8215, sections 1 et 5](https://www.rfc-editor.org/rfc/rfc8215.txt) |
| 6to4 | `2002::/16` | bits 16 à 47 (champ V4ADDR) | [RFC 3056, section 2](https://www.rfc-editor.org/rfc/rfc3056.txt) |
| Teredo | `2001::/32` | deux adresses : le serveur dans les bits 32 à 63, le client inversé dans les bits 96 à 127 | [RFC 4380, section 4](https://www.rfc-editor.org/rfc/rfc4380.txt) |

**IPv4 mappée.** `[::ffff:127.0.0.1]` est l’adresse de bouclage sous un habit IPv6. Un navigateur ne l’affiche pas ainsi : le sérialiseur IPv6 du WHATWG URL Standard écrit chaque bloc de 16 bits sous la forme du nombre hexadécimal en minuscules le plus court possible (« the shortest possible lowercase hexadecimal number »), si bien que la même URL revient sous la forme `[::ffff:7f00:1]` ([WHATWG URL Standard, sérialiseur IPv6](https://url.spec.whatwg.org/)). Les deux écritures sont évaluées bouclage, risque élevé.

**Compatible IPv4.** La RFC 4291 définit `::a.b.c.d`, avec 96 bits à zéro devant l’adresse IPv4, puis le retire : ce format est désormais obsolète, car les mécanismes de transition actuels n’utilisent plus ces adresses (« is now deprecated because the current IPv6 transition mechanisms no longer use these addresses »), et l’adresse IPv4 qu’il transporte doit être une adresse unicast globalement unique (« must be a globally-unique IPv4 unicast address », [RFC 4291, section 2.5.5.1](https://www.rfc-editor.org/rfc/rfc4291.txt)). Le registre n’a aucune ligne pour lui. Une pile qui accepte encore ce format atteint l’adresse transportée : `[::127.0.0.1]` et son équivalent hexadécimal `[::7f00:1]` sont donc évalués bouclage, `[::a9fe:a9fe]` métadonnées cloud, et `[::8.8.8.8]` public ; dans tous les cas, le résultat indique que le format est obsolète. `::` et `::1` ont leur propre ligne de registre et ne sont jamais lus comme compatibles IPv4.

**Préfixe bien connu NAT64.** `[64:ff9b::169.254.169.254]` et son équivalent hexadécimal `[64:ff9b::a9fe:a9fe]` transportent l’adresse de métadonnées de lien local : ils sont donc évalués métadonnées cloud. La RFC 6052 interdit d’utiliser le préfixe bien connu pour représenter des adresses non globales (« The Well-Known Prefix MUST NOT be used to represent non-global IPv4 addresses ») et demande aux traducteurs de supprimer de tels paquets ([RFC 6052, section 3.1](https://www.rfc-editor.org/rfc/rfc6052.txt)). L’adresse désigne pourtant cette cible interne : c’est pourquoi un filtre doit la rejeter plutôt que de faire confiance à chaque traducteur du chemin. Une adresse sous le préfixe bien connu qui transporte une adresse IPv4 publique, comme `64:ff9b::8.8.8.8`, est évaluée publique, car le registre marque `64:ff9b::/96` comme globalement joignable.

**Préfixe NAT64 à usage local.** La RFC 8215 réserve `64:ff9b:1::/48` à la traduction au sein d’un même réseau et laisse la longueur du préfixe de traduction au choix de l’opérateur ; les nœuds ne doivent faire aucune supposition sur la syntaxe ni sur les propriétés de ces adresses (« must not make any assumptions regarding the syntax or properties of those addresses », [RFC 8215, section 5](https://www.rfc-editor.org/rfc/rfc8215.txt)). L’outil lit donc l’adresse avec chaque format de la RFC 6052 qui tient dans un /48 (/96, /64, /56 et /48), garde la lecture qui pointe le plus à l’intérieur (métadonnées cloud, puis bouclage, lien local, privé), et indique la lecture /96 quand aucune ne le fait. Chaque format saute les bits 64 à 71, que la RFC 6052 impose à zéro (« These bits MUST be set to zero », [RFC 6052, section 2.2](https://www.rfc-editor.org/rfc/rfc6052.txt)) ; quand ils ne sont pas nuls, aucune adresse IPv4 n’est décodée. Comme le registre de l’IANA marque `64:ff9b:1::/48` comme non joignable globalement, une adresse de ce bloc n’est jamais évaluée en dessous de réservé.

**6to4.** La RFC 3056 construit un préfixe de site à partir du préfixe `2002` sur 16 bits et de l’adresse IPv4 du site sur 32 bits, écrit `2002:V4ADDR::/48` ([RFC 3056, section 2](https://www.rfc-editor.org/rfc/rfc3056.txt)). `[2002:7f00:1::]` transporte donc `127.0.0.1` et est évalué bouclage ; `[2002:a9fe:a9fe::1]` transporte l’adresse de métadonnées.

**Teredo.** Une adresse Teredo compte cinq parties : « Prefix », « Server IPv4 », « Flags », « Port » et « Client IPv4 » ([RFC 4380, section 4](https://www.rfc-editor.org/rfc/rfc4380.txt)). Le préfixe est `2001:0000:/32` (section 2.6). L’adresse du serveur figure telle quelle dans les bits 32 à 63. Le port et l’adresse mappés du client sont obfusqués : chaque bit de l’adresse et du numéro de port est inversé, ce qu’un OU exclusif permet de faire (« Each bit in the address and port number is reversed; this can be done by an exclusive OR of the 16-bit port number with the hexadecimal value 0xFFFF, and an exclusive OR of the 32-bit address with the hexadecimal value 0xFFFFFFFF », section 4). La RFC 5991 a ensuite redéfini le champ Flags avec des bits aléatoires, mais a laissé les champs serveur et client tels quels ([RFC 5991, section 3.1](https://www.rfc-editor.org/rfc/rfc5991.txt)). L’outil annule le XOR, évalue les deux adresses IPv4, laisse décider la plus interne (le serveur l’emporte en cas d’égalité), et affiche le serveur, le client, le port du client et les indicateurs. `[2001:0:808:808:0:feae:80ff:fffe]` a pour serveur `8.8.8.8` et pour client `127.0.0.1` (`0x80fffffe` XOR `0xffffffff`) : elle est donc évaluée bouclage ; `[2001:0:808:808:0:feae:fefd:fcfb]` transporte le client `1.2.3.4` sur le port 337, la paire même qu’utilise la RFC 4380 pour son propre exemple d’obfuscation (section 5.1.1), et elle est évaluée publique. La RFC 4380 ajoute que les identifiants des adresses globales doivent contenir une adresse unicast de portée globale (« the identifiers used in global addresses MUST include a global scope unicast IPv4 address », section 4) : une adresse Teredo qui en transporte une interne désigne donc une cible qu’aucune adresse Teredo valide ne devrait transporter.

**Ce que l’outil ne décode pas : 6a44.** La RFC 6751 construit une adresse 6a44 à partir du préfixe que le FAI attribue au réseau de ses relais (« the 6a44-network IPv6 prefix C (a /48 the ISP has assigned to its 6a44 relays) »), suivi de l’adresse IPv4 du site client, d’un port et de l’adresse IPv4 locale du client ([RFC 6751, section 5](https://www.rfc-editor.org/rfc/rfc6751.txt)). Comme le /48 est choisi par chaque FAI, aucun préfixe fixe ne signale une adresse 6a44, et l’outil ne peut pas la distinguer d’une autre adresse sans la configuration de ce FAI. Il nomme en revanche le côté IPv4 : `192.88.99.2` est l’adresse anycast des relais 6a44 (section 8).

## Chaque bloc à usage spécifique, nommé d’après les registres de l’IANA

L’outil contient chaque ligne des registres IPv4 et IPv6 Special-Purpose Address Space de l’IANA ([CSV IPv4](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) et [CSV IPv6](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv), tous deux mis à jour le 09/10/2025, consultés le 26/10/2026) : 25 lignes IPv4 et 25 lignes IPv6. Le calculateur CIDR lit la même copie des lignes IPv4. Une adresse est comparée à la ligne la plus spécifique qui la couvre, et le résultat affiche, tels quels, le bloc, le nom donné par le registre et la RFC. Le registre définit Globally Reachable comme le fait qu’un datagramme IP dont l’adresse de destination appartient au bloc à usage spécifique alloué puisse être transmis au-delà d’un domaine administratif donné (« whether an IP datagram whose destination address is drawn from the allocated special-purpose address block is forwardable beyond a specified administrative domain »), et l’évaluation suit cette définition :

- **Globally Reachable False** donne **réservé** (risque élevé sur l’échelle de l’outil), sauf si la ligne a une catégorie plus parlante : bouclage, privé, lien local ou NAT opérateur.
- **Globally Reachable True** donne **public** (risque faible), et le bloc est tout de même nommé : rien dans le registre ne retombe dans un « public » anonyme.
- **Aucune valeur** se présente de deux façons. Pour les lignes d’intégration (6to4, Teredo), le registre indique N/A et renvoie à la RFC : c’est donc l’adresse IPv4 transportée qui décide. Pour les deux lignes obsolètes, le registre ne contient aucun booléen, et l’outil les évalue réservées : la RFC 7526 précise que le préfixe ne doit pas être réattribué à un autre usage, sauf par une future action de normalisation de l’IETF (« The prefix 192.88.99.0/24 MUST NOT be reassigned for other use except by a future IETF Standards Action »), et consigne que les valeurs booléennes de ce bloc ont été supprimées (« The Boolean values for the address block 192.88.99.0/24 have been removed », [RFC 7526, sections 4 et 7](https://www.rfc-editor.org/rfc/rfc7526.txt)) ; quant à `2001:10::/28`, il se trouve dans `2001::/23`, qui n’est pas joignable globalement, sauf si une allocation plus spécifique l’autorise (« Unless allowed by a more specific allocation », note [1] du registre).

Les blocs multicast `224.0.0.0/4` et `ff00::/8` ne sont pas des lignes à usage spécifique (ils ont leurs propres registres) et sont tout de même évalués réservés, sans ligne nommée.

### IPv4

| Bloc | Nom IANA | RFC | Globally Reachable | Évaluation |
|---|---|---|---|---|
| `0.0.0.0/8` | « This network » | RFC 791, Section 3.2 | False | réservé, élevé |
| `0.0.0.0/32` | « This host on this network » | RFC 1122, Section 3.2.1.3 | False | réservé, élevé |
| `10.0.0.0/8` | Private-Use | RFC 1918 | False | privé, élevé |
| `100.64.0.0/10` | Shared Address Space | RFC 6598 | False | CGNAT, moyen |
| `127.0.0.0/8` | Loopback | RFC 1122, Section 3.2.1.3 | False | bouclage, élevé |
| `169.254.0.0/16` | Link Local | RFC 3927 | False | lien local, élevé (`169.254.169.254` : métadonnées cloud) |
| `172.16.0.0/12` | Private-Use | RFC 1918 | False | privé, élevé |
| `192.0.0.0/24` | IETF Protocol Assignments | RFC 6890, Section 2.1 | False | réservé, élevé |
| `192.0.0.0/29` | IPv4 Service Continuity Prefix | RFC 7335 | False | réservé, élevé |
| `192.0.0.8/32` | IPv4 dummy address | RFC 7600 | False | réservé, élevé |
| `192.0.0.9/32` | Port Control Protocol Anycast | RFC 7723 | True | public, faible, service anycast |
| `192.0.0.10/32` | Traversal Using Relays around NAT Anycast | RFC 8155 | True | public, faible, service anycast |
| `192.0.0.170/32`, `192.0.0.171/32` | NAT64/DNS64 Discovery | RFC 8880; RFC 7050, Section 2.2 | False | réservé, élevé |
| `192.0.2.0/24` | Documentation (TEST-NET-1) | RFC 5737 | False | réservé, élevé |
| `192.31.196.0/24` | AS112-v4 | RFC 7535 | True | public, faible |
| `192.52.193.0/24` | AMT | RFC 7450 | True | public, faible |
| `192.88.99.0/24` | Deprecated (6to4 Relay Anycast) | RFC 7526 | aucune | réservé, élevé |
| `192.88.99.2/32` | 6a44-relay anycast address | RFC 6751 | False | réservé, élevé, service anycast |
| `192.168.0.0/16` | Private-Use | RFC 1918 | False | privé, élevé |
| `192.175.48.0/24` | Direct Delegation AS112 Service | RFC 7534 | True | public, faible |
| `198.18.0.0/15` | Benchmarking | RFC 2544 | False | réservé, élevé |
| `198.51.100.0/24` | Documentation (TEST-NET-2) | RFC 5737 | False | réservé, élevé |
| `203.0.113.0/24` | Documentation (TEST-NET-3) | RFC 5737 | False | réservé, élevé |
| `240.0.0.0/4` | Reserved | RFC 1112, Section 4 | False | réservé, élevé |
| `255.255.255.255/32` | Limited Broadcast | RFC 8190; RFC 919, Section 7 | False | réservé, élevé |

Dans `192.0.0.0/24`, c’est la note du registre qui décide : le /24 est inutilisable sauf en vertu d’une réservation plus spécifique (« Not useable unless by virtue of a more specific reservation »), si bien que la ligne la plus spécifique l’emporte. `100.100.100.200`, une adresse de métadonnées cloud, se trouve dans Shared Address Space et est évaluée métadonnées cloud, avec cette ligne nommée.

### IPv6

| Bloc | Nom IANA | RFC | Globally Reachable | Évaluation |
|---|---|---|---|---|
| `::1/128` | Loopback Address | RFC 4291 | False | bouclage, élevé |
| `::/128` | Unspecified Address | RFC 4291 | False | réservé, élevé |
| `::ffff:0:0/96` | IPv4-mapped Address | RFC 4291 | False | selon l’adresse IPv4 transportée |
| `64:ff9b::/96` | IPv4-IPv6 Translat. | RFC 6052 | True | selon l’adresse IPv4 transportée |
| `64:ff9b:1::/48` | IPv4-IPv6 Translat. | RFC 8215 | False | selon l’adresse IPv4 transportée, jamais en dessous de réservé |
| `100::/64` | Discard-Only Address Block | RFC 6666 | False | réservé, élevé |
| `100:0:0:1::/64` | Dummy IPv6 Prefix | RFC 9780 | False | réservé, élevé |
| `2001::/23` | IETF Protocol Assignments | RFC 2928 | False | réservé, élevé |
| `2001::/32` | TEREDO | RFC 4380; RFC 8190 | N/A | selon la plus interne des deux adresses IPv4 transportées |
| `2001:1::1/128` | Port Control Protocol Anycast | RFC 7723 | True | public, faible, service anycast |
| `2001:1::2/128` | Traversal Using Relays around NAT Anycast | RFC 8155 | True | public, faible, service anycast |
| `2001:1::3/128` | DNS-SD Service Registration Protocol Anycast | RFC 9665 | True | public, faible, service anycast |
| `2001:2::/48` | Benchmarking | RFC 5180; RFC Errata 1752 | False | réservé, élevé |
| `2001:3::/32` | AMT | RFC 7450 | True | public, faible |
| `2001:4:112::/48` | AS112-v6 | RFC 7535 | True | public, faible |
| `2001:10::/28` | Deprecated (previously ORCHID) | RFC 4843 | aucune | réservé, élevé |
| `2001:20::/28` | ORCHIDv2 | RFC 7343 | True | public, faible |
| `2001:30::/28` | Drone Remote ID Protocol Entity Tags (DETs) Prefix | RFC 9374 | True | public, faible |
| `2001:db8::/32` | Documentation | RFC 3849 | False | réservé, élevé |
| `2002::/16` | 6to4 | RFC 3056 | N/A | selon l’adresse IPv4 transportée |
| `2620:4f:8000::/48` | Direct Delegation AS112 Service | RFC 7534 | True | public, faible |
| `3fff::/20` | Documentation | RFC 9637 | False | réservé, élevé |
| `5f00::/16` | Segment Routing (SRv6) SIDs | RFC 9602 | False | réservé, élevé |
| `fc00::/7` | Unique-Local | RFC 4193; RFC 8190 | False | privé, élevé (`fd00:ec2::254` : métadonnées cloud) |
| `fe80::/10` | Link-Local Unicast | RFC 4291 | False | lien local, élevé |

Quelques lignes méritent un mot. Le préfixe de tests de performance est `2001:2::/48`, car l’erratum 1752 a corrigé la RFC 5180, qui avait imprimé `2001:0200::/48` ; l’erratum indique que c’est ce préfixe que l’IANA a attribué aux tests de performance (« The IANA has assigned 2001:0002::/48 for IPv6 benchmarking », [RFC Errata 1752](https://www.rfc-editor.org/errata/eid1752)). `5f00::/16` contient les identifiants de segment du Segment Routing sur IPv6, et les spécifications SRv6 sont destinées à un domaine SR fermé ou à des domaines SR qui coopèrent (« are intended to be applicable to a contained SR Domain or between collaborating SR Domains », [RFC 9602, section 5](https://www.rfc-editor.org/rfc/rfc9602.txt)). `100:0:0:1::/64` est le préfixe IPv6 factice que la RFC 9780 recommande à la place d’une adresse de bouclage mappée (« an IPv4 loopback address mapped to IPv6 », [RFC 9780, résumé](https://www.rfc-editor.org/rfc/rfc9780.txt)). Les adresses ORCHIDv2 et DET sont des identifiants plutôt que des localisateurs : les ORCHID sont considérés comme non routables du point de vue de la couche réseau (« are considered non-routable addresses from the IPv6-layer perspective », [RFC 7343, résumé](https://www.rfc-editor.org/rfc/rfc7343.txt)) et les HHIT sont des adresses valides, bien que non routables (« are valid, though non-routable, IPv6 addresses », [RFC 9374, section 1](https://www.rfc-editor.org/rfc/rfc9374.txt)). Le registre marque néanmoins les deux blocs comme joignables globalement : l’outil suit donc le registre et les évalue publics, avec le bloc nommé. Pour les préfixes de documentation, la RFC 3849 énonce clairement l’intention : cette attribution implique que les opérateurs ajoutent ce préfixe à leur liste d’espaces d’adressage non routables (« This assignment implies that IPv6 network operators should add this address prefix to the list of non-routeable IPv6 address space », [RFC 3849, section 3](https://www.rfc-editor.org/rfc/rfc3849.txt)).

## Les adresses de service anycast, et pourquoi elles sont évaluées publiques

Cinq lignes sont des adresses de service anycast que le registre marque comme joignables globalement : `192.0.0.9` et `2001:1::1` pour le Port Control Protocol, `192.0.0.10` et `2001:1::2` pour TURN, et `2001:1::3` pour le DNS-SD Service Registration Protocol. Une sixième, `192.88.99.2`, est l’adresse anycast des relais 6a44, que le registre marque comme non joignable globalement. L’outil conserve l’évaluation qu’implique le registre (publique pour les cinq premières, réservée pour la sixième), mais il nomme le bloc et ajoute un signalement indiquant qu’il s’agit d’une adresse de service anycast à usage spécifique, pour que le lecteur le voie.

Pourquoi les signaler ? Une adresse anycast ne désigne pas une seule machine : un paquet envoyé à une adresse anycast est remis à l’interface réseau « topologiquement la plus proche » qui porte cette adresse (« A packet sent to an anycast address is delivered to the 'topologically nearest' network interface with the anycast address », [RFC 8155, section 6](https://www.rfc-editor.org/rfc/rfc8155.txt)). Pour PCP, il s’agit par conception d’un équipement intermédiaire proche : ces adresses permettent aux clients d’envoyer leurs messages de signalisation au NAT, au pare-feu ou à l’autre équipement intermédiaire compatible PCP le plus proche sur le chemin (« transmit signaling messages to their closest PCP-aware on-path NAT, firewall, or other middlebox », [RFC 7723, résumé](https://www.rfc-editor.org/rfc/rfc7723.txt)). `2001:1::3` est une adresse anycast fixe utilisable comme destination des mises à jour SRP quand aucun registrar SRP n’est configuré explicitement (« a fixed anycast address that can be commonly used as a destination for SRP Updates when no SRP registrar is explicitly configured », [RFC 9665, section 10.5](https://www.rfc-editor.org/rfc/rfc9665.txt)). Un serveur qui récupère l’une de ces URL peut donc dialoguer avec un équipement situé sur son propre chemin réseau, ce qu’une évaluation publique seule masquerait. L’évaluation reste publique, car c’est ce que dit le registre ; le signalement est là pour qu’une liste d’autorisation nomme explicitement ces adresses au lieu de les laisser passer comme des hôtes Internet ordinaires. Le signalement suit aussi une intégration : `[64:ff9b::192.0.0.9]` est évaluée publique et signalée, car l’adresse qu’elle transporte est l’adresse anycast PCP.

## Exemples commentés

Les vecteurs de référence (golden vectors) de l’outil figent chacun des exemples ci-dessous, ainsi qu’un vecteur par ligne de registre.

| Entrée | Évaluation | Raison |
|---|---|---|
| `http://2852039166/latest/meta-data/` | métadonnées cloud, élevé | forme décimale de `169.254.169.254` (le bouton Exemple) |
| `http://[::ffff:7f00:1]/` | bouclage, élevé | IPv4 mappée, transporte `127.0.0.1` |
| `http://[0:0:0:0:0:0:0:1]/` | bouclage, élevé | une écriture développée de `::1` |
| `http://[::7f00:1]/` | bouclage, élevé | compatible IPv4 (obsolète), transporte `127.0.0.1` |
| `http://[64:ff9b::169.254.169.254]/` | métadonnées cloud, élevé | préfixe bien connu NAT64, transporte `169.254.169.254` |
| `http://[2002:7f00:1::]/` | bouclage, élevé | 6to4, transporte `127.0.0.1` |
| `http://[2001:0:808:808:0:feae:80ff:fffe]/` | bouclage, élevé | Teredo, le client est `127.0.0.1` |
| `http://[2001:0:a9fe:a9fe:8000:feae:fefd:fcfb]/` | métadonnées cloud, élevé | Teredo, le serveur est `169.254.169.254` |
| `http://[2001:2::1]/` | réservé, élevé | Benchmarking, `2001:2::/48` |
| `http://[5f00::1]/` | réservé, élevé | Segment Routing (SRv6) SIDs, `5f00::/16` |
| `http://192.88.99.1/` | réservé, élevé | Deprecated (6to4 Relay Anycast), aucune valeur Globally Reachable |
| `http://192.0.0.10/` | public, faible, signalé | adresse de service anycast TURN |
| `http://[2001:1::3]/` | public, faible, signalé | adresse anycast du DNS-SD Service Registration Protocol |
| `http://192.31.196.1/` | public, faible, nommé | AS112-v4 |

## Schémas, identifiants et inconnue assumée

Au-delà de l’adresse, l’outil signale les schémas d’URL dangereux (ceux, au-delà de `http` et `https`, dont les charges utiles SSRF abusent souvent) et les identifiants intégrés sous la forme `user:pass@host`. Il tient à rester honnête sur un point : un nom d’hôte nu qui n’est pas un nom spécial connu est indiqué comme résolu à l’exécution, sans supposition, car l’outil n’effectue jamais de résolution DNS. C’est la réponse exacte, et c’est aussi ce qui rend l’outil sûr : il classe ce que dit l’URL au lieu d’aller la contacter.

## Utilisation

Collez une URL, ou appuyez sur Exemple, et lisez son classement, la destination décodée, l’adresse IPv4 intégrée avec sa propre ligne de registre, les deux adresses Teredo quand il y en a deux, le bloc à usage spécifique, tout signalement anycast ou d’obsolescence, tout schéma ou identifiant signalé, et le niveau de risque SSRF. Tout est calculé localement ; aucune requête n’est jamais effectuée.

## Partage des résultats

Après la réponse (le verdict, les faits et les signalements), le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, l’URL dont l’éventuel mot de passe placé avant le `@` est remplacé par `[redacted]`. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.2.1, consultée le 01/11/2026) déconseille `user:password` dans la partie userinfo et demande aux applications de ne jamais afficher en clair ce qui suit le premier deux-points (« should not render as clear text any data after the first colon »). La page n’affiche jamais la partie userinfo, seulement le fait qu’il y en a une : la copie se lit donc de la même façon ; elle est classée de nouveau avant que le lien soit proposé, et quand elle ne se lirait pas de la même façon (une URL sans `//`, dont la page affiche le « mot de passe » comme une partie du chemin), aucun lien n’est créé et la fenêtre contextuelle vous demande de le supprimer. Un nom d’utilisateur seul est transmis tel que saisi, car il peut être l’astuce même que l’on étudie (`http://expected-host@internal/`) ; la fenêtre contextuelle le signale, au cas où il s’agirait d’un jeton. Un JWT ou un ID de clé d’accès AWS dans le chemin ou la chaîne de requête bloque le lien, et un nom comme `access_token=` dans la chaîne de requête est nommé dans la fenêtre contextuelle. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** L’URL remplit la zone comme un collage et la page la classe, localement : ni résolution DNS ni requête. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## API

Le même moteur répond à l’opération `/api/v1/ssrf-url-classifier` de l’API HTTP du site, détaillée champ par champ dans le contrat OpenAPI de la [page API](/api), avec des exemples tirés des vecteurs de référence. Le contrat indique aussi si ce site sert l’API.

- **Requête.** L’URL ou l’hôte en texte : `?input=` en GET, ou un corps de requête POST.
- **Réponse.** Les parties de l’URL (`scheme`, `host`, `port`, `path`, `hasUserinfo`, `schemeFlag`), l’adresse (`isIp`, `ipVersion`, `canonicalIp`, `obfuscated`, `obfuscationForm`), l’évaluation (`category`, `risk`, `reasons` en anglais) et le décodage : `embedding` (`ipv4-mapped`, `ipv4-compatible`, `nat64-wkp`, `nat64-local`, `6to4`, `teredo` ou `null`), `embeddedIpv4` (l’adresse qui décide), `embeddingLayout`, `specialBlock` et `embeddedSpecialBlock` (chacun `{prefix, name, rfc, globallyReachable}` ou `null`), `teredo` (`serverIpv4`, `clientIpv4`, `clientPort`, `flags` ou `null`) et `anycastService`. Pour `http://[2001:0:808:808:0:feae:80ff:fffe]/`, l’API répond `loopback` / `high`, avec `teredo` serveur `8.8.8.8`, client `127.0.0.1`, port 337 et indicateurs 0, et `embeddedSpecialBlock` `127.0.0.0/8` « Loopback ».
- **Erreurs.** Seule une entrée vide est refusée : HTTP 400. Un hôte que l’outil ne sait pas situer n’est pas une erreur ; il est évalué `unresolved` ou `internal-name`.

`embedding`, `embeddedIpv4`, `embeddingLayout` et `specialBlock` ont été ajoutés le 19 octobre 2026 ; plus tard le même jour, `embedding` a gagné `ipv4-compatible` et `teredo`, `specialBlock` a fini par couvrir chaque ligne des registres, `embeddedSpecialBlock`, `teredo` et `anycastService` ont été ajoutés, et `canonicalIp` est passé, pour une adresse compatible IPv4, à la notation mixte (`::127.0.0.1`).

## Sources

- [IANA, IPv4 Special-Purpose Address Space, CSV, dernière mise à jour du registre le 09/10/2025](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) (consulté le 26/10/2026) : les 25 lignes ; la note [2] provient de l’[édition XML](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xml)
- [IANA, IPv6 Special-Purpose Address Space, CSV, dernière mise à jour du registre le 09/10/2025](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv) (consulté le 26/10/2026) : les 25 lignes ; les notes [1] à [4] et la définition de Globally Reachable proviennent de l’[édition XML](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xml)
- [RFC 4291, IP Version 6 Addressing Architecture, février 2006](https://www.rfc-editor.org/rfc/rfc4291.txt) (consultée le 19/10/2026) : section 2.2 (formes textuelles), sections 2.5.5.1 et 2.5.5.2 (compatible IPv4 et IPv4 mappée)
- [RFC 5952, A Recommendation for IPv6 Address Text Representation, août 2010](https://www.rfc-editor.org/rfc/rfc5952.txt) (consultée le 19/10/2026) : sections 4 et 5
- [RFC 6052, IPv6 Addressing of IPv4/IPv6 Translators, octobre 2010](https://www.rfc-editor.org/rfc/rfc6052.txt) (consultée le 19/10/2026) : sections 2.1 à 2.4 et 3.1
- [RFC 8215, Local-Use IPv4/IPv6 Translation Prefix, août 2017](https://www.rfc-editor.org/rfc/rfc8215.txt) (consultée le 19/10/2026) : sections 1, 4.1 et 5
- [RFC 3056, Connection of IPv6 Domains via IPv4 Clouds, février 2001](https://www.rfc-editor.org/rfc/rfc3056.txt) (consultée le 19/10/2026) : section 2
- [RFC 4380, Teredo: Tunneling IPv6 over UDP through Network Address Translations (NATs), février 2006](https://www.rfc-editor.org/rfc/rfc4380.txt) (consultée le 19/10/2026) : sections 2.6 et 4
- [RFC 5991, Teredo Security Updates, septembre 2010](https://www.rfc-editor.org/rfc/rfc5991.txt) (consultée le 19/10/2026) : section 3.1
- [RFC 6751, Native IPv6 behind IPv4-to-IPv4 NAT Customer Premises Equipment (6a44), octobre 2012](https://www.rfc-editor.org/rfc/rfc6751.txt) (consultée le 19/10/2026) : sections 5 et 8
- [RFC 7526, Deprecating the Anycast Prefix for 6to4 Relay Routers, mai 2015](https://www.rfc-editor.org/rfc/rfc7526.txt) (consultée le 19/10/2026) : sections 4 et 7
- [RFC 7723, Port Control Protocol (PCP) Anycast Addresses, janvier 2016](https://www.rfc-editor.org/rfc/rfc7723.txt) (consultée le 19/10/2026) : résumé et section 1
- [RFC 8155, Traversal Using Relays around NAT (TURN) Server Auto Discovery, avril 2017](https://www.rfc-editor.org/rfc/rfc8155.txt) (consultée le 19/10/2026) : sections 6 et 8
- [RFC 9665, Service Registration Protocol for DNS-Based Service Discovery, juin 2025](https://www.rfc-editor.org/rfc/rfc9665.txt) (consultée le 19/10/2026) : section 10.5
- [RFC Errata 1752 for RFC 5180, IPv6 Benchmarking Methodology for Network Interconnect Devices](https://www.rfc-editor.org/errata/eid1752) (consulté le 19/10/2026) : le préfixe de tests de performance corrigé
- [RFC 7343, An IPv6 Prefix for Overlay Routable Cryptographic Hash Identifiers Version 2 (ORCHIDv2), septembre 2014](https://www.rfc-editor.org/rfc/rfc7343.txt) (consultée le 19/10/2026) : résumé
- [RFC 9374, DRIP Entity Tag (DET) for Unmanned Aircraft System Remote ID (UAS RID), mars 2023](https://www.rfc-editor.org/rfc/rfc9374.txt) (consultée le 19/10/2026) : section 1
- [RFC 9602, Segment Routing over IPv6 (SRv6) Segment Identifiers in the IPv6 Addressing Architecture, octobre 2024](https://www.rfc-editor.org/rfc/rfc9602.txt) (consultée le 19/10/2026) : sections 5 et 6
- [RFC 9780, Bidirectional Forwarding Detection (BFD) for Multipoint Networks over Point-to-Multipoint MPLS Label Switched Paths (LSPs), mai 2025](https://www.rfc-editor.org/rfc/rfc9780.txt) (consultée le 19/10/2026 ; MPLS signifie Multiprotocol Label Switching) : résumé
- [RFC 3849, IPv6 Address Prefix Reserved for Documentation, juillet 2004](https://www.rfc-editor.org/rfc/rfc3849.txt) (consultée le 19/10/2026) : sections 2 et 3
- [RFC 9637, Expanding the IPv6 Documentation Space, août 2024](https://www.rfc-editor.org/rfc/rfc9637.txt) (consultée le 19/10/2026) : résumé et IANA Considerations
- [RFC 6666, A Discard Prefix for IPv6, août 2012](https://www.rfc-editor.org/rfc/rfc6666.txt) (consultée le 19/10/2026) : sections 2 et 4
- [RFC 7050, Discovery of the IPv6 Prefix Used for IPv6 Address Synthesis, novembre 2013](https://www.rfc-editor.org/rfc/rfc7050.txt) (consultée le 19/10/2026) : section 2.2
- [WHATWG, URL Standard, Living Standard, dernière mise à jour le 19 octobre 2026](https://url.spec.whatwg.org/) (consulté le 19/10/2026) : le sérialiseur IPv6
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, janvier 2005](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 01/11/2026) : section 3.5, le fragment, et section 3.2.1, le mot de passe de la partie userinfo
