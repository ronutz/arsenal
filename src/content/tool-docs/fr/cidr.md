## Ce que fait l’outil

Le calculateur CIDR / sous-réseaux travaille sur des blocs IPv4 écrits en notation CIDR, une adresse et une longueur de préfixe comme `192.168.1.0/24`. Il a quatre modes, que vous choisissez avec les onglets en haut :

- **Sous-réseau** analyse un bloc : adresse réseau, dernière adresse, masque de sous-réseau, masque générique (wildcard), premier et dernier hôte utilisable, nombre total d’adresses et d’hôtes utilisables, bits de l’adresse, et plages à usage spécifique dans lesquelles le bloc se trouve ou qu’il chevauche.
- **VLSM** découpe des sous-réseaux de longueur variable dans un bloc parent pour répondre à une liste de nombres d’hôtes.
- **Super-réseau** résume une liste de préfixes en le plus petit ensemble de blocs couvrant exactement les mêmes adresses, et en le plus petit préfixe unique qui les couvre toutes.
- **Chevauchement / lacune** trouve quels préfixes d’une liste se chevauchent ou se contiennent et, si un périmètre est indiqué, liste l’espace de ce périmètre qu’aucun préfixe ne couvre.

Chaque calcul s’exécute dans votre navigateur ; rien de ce que vous saisissez n’est envoyé nulle part. Un bloc transmis depuis une autre page arrive après le `#` de l’adresse, une partie qu’aucune requête ne transporte ; voir **Liens vers le calculateur** ci-dessous.

## Mode Sous-réseau

Une longueur de préfixe `/n` fixe les `n` premiers bits de l’adresse de 32 bits comme partie réseau et laisse `32 - n` bits aux hôtes : le bloc couvre donc `2^(32 - n)` adresses (RFC 4632, section 3.1). Pour un bloc de /0 à /30, l’outil en réserve deux : l’adresse dont tous les bits d’hôte valent 0 (l’adresse réseau) et celle dont tous les bits d’hôte valent 1 (la diffusion dirigée). La RFC 1122, section 3.2.1.3, n’autorise ni 0 ni une valeur composée uniquement de 1 dans le champ du numéro d’hôte en dehors des cas particuliers qu’elle énumère : un bloc de /0 à /30 a donc `2^(32 - n) - 2` hôtes utilisables.

Un /31 et un /32 ne réservent rien. La RFC 3021, section 2.1, précise que sur une liaison point à point avec un masque de 31 bits, les deux adresses doivent être interprétées comme des adresses d’hôte (« MUST be interpreted as host addresses ») : l’outil compte donc deux hôtes utilisables dans un /31, présente la première adresse comme l’identifiant de réseau qui est aussi un hôte utilisable, et la dernière comme une adresse sans diffusion dirigée. Un /32 est un hôte unique.

Une adresse saisie avec des bits d’hôte positionnés, comme `192.168.1.77/24`, est lue comme le bloc auquel elle appartient : la ligne de l’adresse réseau affiche `192.168.1.0`. Le curseur **Longueur de préfixe** réécrit le préfixe de l’adresse en cours et recalcule aussitôt. Le bouton **Exemple** charge `192.168.1.0/24`.

Exemples commentés, tels que l’outil les affiche :

- `192.168.1.0/24` : réseau `192.168.1.0`, diffusion `192.168.1.255`, utilisables de `192.168.1.1` à `192.168.1.254`, 254 hôtes, masque `255.255.255.0`, masque générique `0.0.0.255`.
- `10.0.0.0/30` : réseau `10.0.0.0`, diffusion `10.0.0.3`, utilisables de `10.0.0.1` à `10.0.0.2`, 2 hôtes, masque `255.255.255.252`.
- `10.0.0.0/31` : deux adresses utilisables, `10.0.0.0` et `10.0.0.1`, aucune adresse réseau ni de diffusion réservée.

## Classification des adresses à usage spécifique

Sous les résultats du mode Sous-réseau, l’outil compare le bloc à chaque ligne du registre IANA IPv4 Special-Purpose Address Space, tel que téléchargé le 26 octobre 2026 (dernière mise à jour du registre le 9 octobre 2025 ; le classificateur d’URL SSRF lit la même copie de ses lignes), plus une ligne pour le multicast. Il affiche l’un de trois verdicts :

- **Dans une plage à usage spécifique** : tout le bloc se trouve dans une plage du registre. La phrase nomme la plus spécifique, par exemple `192.168.1.0/24` se trouve dans `192.168.0.0/16`, Private-Use (RFC 1918).
- **Partiellement à usage spécifique** : le bloc contient une ou plusieurs plages du registre, ainsi que d’autres adresses. Deux blocs CIDR sont soit imbriqués, soit disjoints : c’est donc la seule façon dont un bloc peut chevaucher partiellement une plage. La phrase donne le décompte, par exemple `10.0.0.0/7` : 16 777 216 des 33 554 432 adresses se trouvent dans `10.0.0.0/8`. Les lignes imbriquées ne sont comptées qu’une fois : `192.0.0.0/23` contient `192.0.0.0/24` et ses six lignes plus spécifiques, et l’outil indique 256 sur 512.
- **Aucune plage à usage spécifique (espace unicast routable globalement)** : le bloc ne rencontre aucune plage du registre, par exemple `172.32.0.0/24`, le /24 situé juste au-dessus de `172.16.0.0/12`.

Sous le verdict, un tableau liste chaque ligne que le bloc rencontre, de la plus spécifique à la moins spécifique : la plage, le nom dans le registre, la colonne RFC, la relation (**est ce bloc**, **contient ce bloc** ou **dans ce bloc (chevauchement partiel)**) et quatre des indicateurs du registre. C’est le registre qui les définit : **Source** et **Destination** indiquent si une adresse de la plage est valide comme source ou comme destination d’un datagramme qui traverse deux équipements ; **Transmissible** (Forwardable) indique si un routeur peut transmettre un tel datagramme entre des interfaces externes ; **Joignable globalement** (Globally reachable) indique s’il peut être transmis au-delà d’un domaine administratif donné. Quand le registre associe une note de bas de page, l’outil l’affiche : la note 1 sur les indicateurs de Loopback (« Several protocols have been granted exceptions to this rule »), la note 2 sur `192.0.0.0/24` (« Not useable unless by virtue of a more specific reservation »).

Les lignes, telles que le registre les liste (Source, Destination, Forwardable, Globally reachable) :

| Plage | Nom | RFC | S | D | F | G |
|---|---|---|---|---|---|---|
| `0.0.0.0/8` | « This network » | RFC 791, Section 3.2 | oui | non | non | non |
| `0.0.0.0/32` | « This host on this network » | RFC 1122, Section 3.2.1.3 | oui | non | non | non |
| `10.0.0.0/8` | Private-Use | RFC 1918 | oui | oui | oui | non |
| `100.64.0.0/10` | Shared Address Space | RFC 6598 | oui | oui | oui | non |
| `127.0.0.0/8` | Loopback | RFC 1122, Section 3.2.1.3 | non [1] | non [1] | non [1] | non [1] |
| `169.254.0.0/16` | Link Local | RFC 3927 | oui | oui | non | non |
| `172.16.0.0/12` | Private-Use | RFC 1918 | oui | oui | oui | non |
| `192.0.0.0/24` [2] | IETF Protocol Assignments | RFC 6890, Section 2.1 | non | non | non | non |
| `192.0.0.0/29` | IPv4 Service Continuity Prefix | RFC 7335 | oui | oui | oui | non |
| `192.0.0.8/32` | IPv4 dummy address | RFC 7600 | oui | non | non | non |
| `192.0.0.9/32` | Port Control Protocol Anycast | RFC 7723 | oui | oui | oui | oui |
| `192.0.0.10/32` | Traversal Using Relays around NAT Anycast | RFC 8155 | oui | oui | oui | oui |
| `192.0.0.170/32`, `192.0.0.171/32` | NAT64/DNS64 Discovery | RFC 8880 ; RFC 7050, Section 2.2 | non | non | non | non |
| `192.0.2.0/24` | Documentation (TEST-NET-1) | RFC 5737 | non | non | non | non |
| `192.31.196.0/24` | AS112-v4 | RFC 7535 | oui | oui | oui | oui |
| `192.52.193.0/24` | AMT | RFC 7450 | oui | oui | oui | oui |
| `192.88.99.0/24` | Deprecated (6to4 Relay Anycast), terminé en 2015-03 | RFC 7526 | non indiqué | non indiqué | non indiqué | non indiqué |
| `192.88.99.2/32` | 6a44-relay anycast address | RFC 6751 | oui | oui | oui | non |
| `192.168.0.0/16` | Private-Use | RFC 1918 | oui | oui | oui | non |
| `192.175.48.0/24` | Direct Delegation AS112 Service | RFC 7534 | oui | oui | oui | oui |
| `198.18.0.0/15` | Benchmarking | RFC 2544 | oui | oui | oui | non |
| `198.51.100.0/24` | Documentation (TEST-NET-2) | RFC 5737 | non | non | non | non |
| `203.0.113.0/24` | Documentation (TEST-NET-3) | RFC 5737 | non | non | non | non |
| `224.0.0.0/4` | Multicast | RFC 1112, Section 4 ; RFC 5771 | non indiqué | non indiqué | non indiqué | non indiqué |
| `240.0.0.0/4` | Reserved | RFC 1112, Section 4 | non | non | non | non |
| `255.255.255.255/32` | Limited Broadcast | RFC 8190 ; RFC 919, Section 7 | non | oui | non | non |

Le registre des adresses à usage spécifique ne liste pas le multicast. La ligne multicast vient du registre IANA IPv4 Multicast Address Space, dont la note donne la plage (« the range 224.0.0.0 through 239.255.255.255 »), la même que celle que la RFC 1112, section 4, attribue aux adresses de groupes d’hôtes. Ce registre n’a pas de colonnes d’indicateurs : l’outil affiche donc ses indicateurs comme **non indiqué** au lieu de les deviner ; il fait de même pour la ligne obsolète du relais 6to4, dont le registre laisse les cellules d’indicateurs vides.

Quelques lignes s’expliquent mieux avec leur RFC. La RFC 1918, section 3, réserve les trois blocs Private-Use aux réseaux internes privés (« for private internets »). La RFC 6598 réserve `100.64.0.0/10` au Carrier-Grade NAT et précise que cet espace se distingue de l’espace d’adresses privé, car il est destiné aux réseaux des opérateurs (« Shared Address Space is distinct from RFC 1918 private address space because it is intended for use on Service Provider networks »). La RFC 5737 réserve les trois blocs TEST-NET à la documentation. La RFC 1112, section 4, indique que les adresses dont les quatre bits de poids fort valent 1111 sont réservées à de futurs modes d’adressage (« are reserved for future addressing modes ») : c’est la ligne `240.0.0.0/4`.

Ce que la classification n’est pas : elle rapporte les lignes du registre et rien d’autre. Elle ne vérifie pas si un bloc est attribué à quelqu’un ou annoncé sur Internet, et le registre lui-même précise que la routabilité des préfixes listés n’est garantie dans aucun contexte, local ou global (« are not guaranteed routability in any particular local or global context »).

## Mode VLSM

Saisissez un **bloc parent** et une ligne par sous-réseau : un nom facultatif et le nombre d’hôtes qu’il doit contenir. **Allouer** dimensionne et place chaque demande :

1. **Dimensionnement.** Une demande de `h` hôtes obtient le plus petit bloc d’au moins `h + 2` adresses, les deux adresses supplémentaires étant l’adresse réseau et l’adresse de diffusion (RFC 1122, section 3.2.1.3). 100 hôtes obtiennent un /25, 25 hôtes un /27, 2 hôtes un /30. Une demande de 0 hôte est refusée avec un message qui nomme le problème ; une demande plus grande que tout bloc IPv4 est listée comme ne tenant pas.
2. **Ordre.** Les demandes sont placées du plus grand bloc au plus petit, et non dans l’ordre de saisie, et le résultat le signale. Chaque bloc commence alors sur un multiple de sa propre taille, et les blocs alloués ne laissent aucun trou entre eux.
3. **Placement.** Chaque bloc prend la prochaine position alignée dans le parent ; une demande dont le bloc aligné sortirait du parent est listée sous **Non placés**.

L’option **Attribuer un /31 aux demandes de 2 hôtes (liens point à point, RFC 3021)** est désactivée par défaut. Cochée, elle donne un /31 au lieu d’un /30 à une demande d’exactement 2 hôtes, et sa ligne n’affiche pas de diffusion : la RFC 3021, section 2.1, fait des deux adresses des hôtes, et la section 2.2 impose la diffusion limitée pour tout le trafic de diffusion sur une telle liaison (« MUST be used for all broadcast traffic on a point-to-point link with a 31-bit subnet mask »). Ne l’utilisez que là où les deux extrémités de la liaison prennent en charge les préfixes de 31 bits : la section 5 avertit qu’une liaison dont une seule extrémité les prend en charge risque de ne pas fonctionner correctement (« in which only one end supports the use of 31-bit prefixes may not operate correctly »).

Un parent saisi avec des bits d’hôte positionnés, comme `192.0.2.77/24`, est masqué en `192.0.2.0/24`, et le résultat l’indique au-dessus du tableau plutôt que de découper silencieusement le plan dans un autre bloc que celui saisi.

Le résultat affiche le parent, les adresses utilisées et libres, le taux d’utilisation, un tableau de chaque sous-réseau (nom, hôtes demandés, réseau, préfixe, masque, plage utilisable, diffusion, hôtes utilisables), l’espace libre restant dans le parent sous forme de blocs CIDR, et les demandes qui n’ont pas pu être placées.

Exemple commenté : le parent `203.0.113.0/24` avec un bureau de 100 hôtes, un LAN invités de 25, un LAN d’administration de 10 et deux liaisons entre routeurs de 2 hôtes chacune.

- Option désactivée : `203.0.113.0/25`, `203.0.113.128/27`, `203.0.113.160/28`, `203.0.113.176/30`, `203.0.113.180/30` ; 184 adresses utilisées, 72 libres (71,9 %), blocs libres `203.0.113.184/29` et `203.0.113.192/26`.
- Option activée : les liaisons deviennent `203.0.113.176/31` et `203.0.113.178/31` ; 180 utilisées, 76 libres (70,3 %), blocs libres `203.0.113.180/30`, `203.0.113.184/29` et `203.0.113.192/26`.

## Mode Super-réseau

Collez jusqu’à 1024 préfixes, séparés par des sauts de ligne, des virgules ou des espaces. **Agréger** les fusionne (les préfixes qui se chevauchent ou sont adjacents ne forment plus qu’une plage) et affiche :

- l’**ensemble couvrant minimal** : le plus petit nombre de blocs CIDR alignés qui couvrent exactement les mêmes adresses que les entrées, pas davantage ;
- le **super-réseau unique** : le plus petit préfixe unique qui couvre toutes les entrées, et le nombre d’adresses qu’il ajoute au-delà de celles-ci quand il est plus grand que leur union.

Exemples : `192.168.0.0/24` et `192.168.1.0/24` s’agrègent en `192.168.0.0/23` sans rien de plus. `10.0.0.0/24` et `10.0.2.0/24` restent deux blocs ; le super-réseau unique `10.0.0.0/22` ajouterait 512 adresses qui ne figurent dans aucune des deux entrées.

## Mode Chevauchement / lacune

Collez jusqu’à 1024 préfixes et, si vous le souhaitez, un **périmètre**. **Vérifier** compare chaque paire et qualifie chaque paire qui se chevauche de **identique à**, **contient** ou **est inclus dans**, avec la plage commune et sa taille ; deux blocs CIDR sont soit imbriqués, soit disjoints, si bien que tout chevauchement relève de l’un de ces cas. L’outil compte aussi les adresses que couvrent les préfixes. Avec un périmètre, il liste les **lacunes dans le périmètre** : les adresses du périmètre qu’aucun préfixe ne couvre, sous forme des plus grands blocs alignés qui y tiennent.

Exemple : `10.0.0.0/26` et `10.0.0.128/26` dans le périmètre `10.0.0.0/24` ne se chevauchent pas, couvrent 128 des 256 adresses et laissent les lacunes `10.0.0.64/26` et `10.0.0.192/26`.

## Liens vers le calculateur

Une autre page peut ouvrir le calculateur avec un bloc déjà renseigné. Le module CIDR de la page d’accueil le fait depuis son lien **Ouvrir le calculateur CIDR complet** et depuis la ligne sur les adresses à usage spécifique, et l’adresse ressemble à `/fr/tools/cidr/#input=192.0.2.7%2F31`. Le bloc voyage dans le fragment, la partie qui suit le `#` : un navigateur ne place jamais le fragment dans une requête HTTP ni dans un en-tête Referer, si bien que l’hôte qui sert la page ne reçoit pas le bloc. Le calculateur le lit dans le navigateur, le fait passer par le même validateur que **Calculer** et affiche le résultat du mode Sous-réseau (pour `192.0.2.7/31` : `192.0.2.6` et `192.0.2.7`, deux adresses utilisables). Un bloc non valide affiche le même message d’erreur que s’il avait été saisi ; une valeur de plus de 16 384 caractères est ignorée.

Ce que le fragment ne cache pas : il reste dans la barre d’adresse et dans l’historique du navigateur, un favori le conserve, et toute personne à qui vous envoyez l’adresse peut le lire ; le bouton **Partager les résultats** de la page le signale quand l’adresse contient un bloc. **Effacer**, **Exemple** ou toute modification retire le bloc de l’adresse sans recharger la page, si bien qu’un partage ou un rechargement ultérieur ne le transporte plus. Changer de langue conserve le bloc.

Les anciens liens plaçaient le bloc dans la chaîne de requête (`?input=192.0.2.7%2F31`). Ils fonctionnent toujours, mais une chaîne de requête fait partie de la requête : cette première requête a donc bien transmis le bloc à l’hôte avant que la page ne s’exécute. Le calculateur déplace alors le bloc dans le fragment et le signale dans une remarque sous la zone de saisie.

## Partage des résultats

En mode Sous-réseau, sous le résultat, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient le bloc à partir duquel le résultat a été calculé (`#input=192.168.1.0%2F24`), et rien d’autre. Les modes VLSM, Super-réseau et Chevauchement / lacune ne sont pas partagés : leurs nombreux champs ne tiennent pas dans l’unique valeur que transporte cette adresse. Tout ce que contient le lien se place après le `#`, une partie que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) déclare séparée du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Longueur.** Un lien transporte au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; un bloc est bien plus court.
- **Ouverture d’un lien.** Le lien est la même adresse que celle décrite sous **Liens vers le calculateur** : le bloc remplit le champ du mode Sous-réseau et passe par le même validateur que **Calculer**. Comme pour tout lien vers cet outil, la valeur reste après le `#` jusqu’à ce que vous modifiiez ou effaciez le champ, puis quitte l’adresse sans aucune requête.

## API

Le même moteur répond à l’opération `/api/v1/cidr` de l’API HTTP du site, décrite champ par champ dans le contrat OpenAPI de la [page de l’API](/api), avec des exemples tirés des vecteurs de référence (golden vectors). Le contrat indique aussi si ce site expose l’API.

- **Requête.** Un bloc seul (`192.168.1.0/24`, en `?input=` sur un GET ou en corps de POST) exécute le mode Sous-réseau. Un objet JSON choisit un mode : `{"mode": "subnet", "block": "..."}` ; `{"mode": "vlsm", "parent": "...", "requirements": [{"label": "Office", "hosts": 100}], "pointToPoint31": false}` ; `{"mode": "supernet", "prefixes": [...]}` ; ou `{"mode": "overlap", "prefixes": [...], "scope": "..."}`. `prefixes` peut aussi être une seule chaîne, avec les mêmes séparateurs que dans la zone de la page.
- **Réponse.** Chaque résultat contient `mode`. Le mode Sous-réseau renvoie les champs des résultats Sous-réseau (`input`, `network`, `broadcast`, `netmask`, `wildcard`, `firstHost`, `lastHost`, `totalAddresses`, `usableHosts`) et `specialPurpose` : `status` (`special`, `partial` ou `none`), `specialAddresses`, et `matches`, une entrée par ligne du registre que le bloc rencontre, avec les colonnes du registre (un indicateur que le registre laisse vide vaut `null`), `relation` (`equal`, `inside` ou `contains`) et `overlapAddresses`. Le mode VLSM renvoie `subnets` (chacun avec `pointToPoint31`), `unallocated`, `parentInput`, `parentMasked`, `freeBlocks`, `placement` (`largest-first`) et les totaux d’adresses. Le mode Super-réseau renvoie `aggregated`, `singleSupernet` et `supernetExtraAddresses` ; le mode Chevauchement / lacune renvoie `overlaps`, `gaps`, `coveredAddresses` et `scopeAddresses`.
- **Erreurs.** HTTP 400, `invalid_input`, avec le message du moteur : une demande de 0 hôte répond `a requirement (Z) asks for 0 hosts`.

Jusqu’au 19 octobre 2026, l’opération ne renvoyait que la décomposition du mode Sous-réseau ; `mode` et `specialPurpose` ont été ajoutés ce jour-là, et les modes VLSM, Super-réseau et Chevauchement / lacune sont devenus accessibles par l’API.

## Sources

- [IANA, registre IPv4 Special-Purpose Address Space, CSV](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) (registre mis à jour le 2025-10-09 ; consulté le 26/10/2026) : chaque ligne à usage spécifique, ses indicateurs et ses notes de bas de page
- [IANA, registre IPv4 Multicast Address Space](https://www.iana.org/assignments/multicast-addresses/multicast-addresses.xml) (registre mis à jour le 2026-08-20 ; consulté le 26/10/2026) : la plage multicast
- [RFC 4632 : Classless Inter-domain Routing (CIDR)](https://www.rfc-editor.org/rfc/rfc4632) (consulté le 19/10/2026) : section 3.1, notation des préfixes et taille des blocs
- [RFC 1122 : Requirements for Internet Hosts - Communication Layers](https://www.rfc-editor.org/rfc/rfc1122) (consulté le 19/10/2026) : section 3.2.1.3, les valeurs réservées du numéro d’hôte
- [RFC 3021 : Using 31-Bit Prefixes on IPv4 Point-to-Point Links](https://www.rfc-editor.org/rfc/rfc3021) (consulté le 19/10/2026) : sections 2.1, 2.2 et 5
- [RFC 6890 : Special-Purpose IP Address Registries](https://www.rfc-editor.org/rfc/rfc6890) (consulté le 19/10/2026), mise à jour par la [RFC 8190](https://www.rfc-editor.org/rfc/rfc8190) (consultée le 19/10/2026) : la structure du registre
- [RFC 1918 : Address Allocation for Private Internets](https://www.rfc-editor.org/rfc/rfc1918) (consulté le 19/10/2026) : section 3
- [RFC 6598 : IANA-Reserved IPv4 Prefix for Shared Address Space](https://www.rfc-editor.org/rfc/rfc6598) (consulté le 19/10/2026)
- [RFC 5737 : IPv4 Address Blocks Reserved for Documentation](https://www.rfc-editor.org/rfc/rfc5737) (consulté le 19/10/2026)
- [RFC 3927 : Dynamic Configuration of IPv4 Link-Local Addresses](https://www.rfc-editor.org/rfc/rfc3927) (consulté le 19/10/2026)
- [RFC 1112 : Host Extensions for IP Multicasting](https://www.rfc-editor.org/rfc/rfc1112) (consulté le 19/10/2026) : section 4, les adresses de groupes d’hôtes et la plage de classe E
- [RFC 5771 : IANA Guidelines for IPv4 Multicast Address Assignments](https://www.rfc-editor.org/rfc/rfc5771) (consulté le 19/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consulté le 27/10/2026) : section 3.5, le fragment, qui transporte les valeurs d’un lien Partager les résultats
