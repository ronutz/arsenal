## Ce que fait l’outil

Une adresse MAC est une adresse matérielle de 48 bits, généralement écrite sous la forme de six octets hexadécimaux, comme `00:1b:54:11:22:33`. Les trois premiers octets forment l’OUI (Organizationally Unique Identifier), que l’IEEE attribue à un fabricant. L’outil prend une adresse MAC (dans n’importe quel format courant) ou un OUI seul, cherche l’OUI dans un instantané intégré du registre MA-L de l’IEEE pour nommer le fabricant, et lit les deux bits qui comptent dans le premier octet. Il reconnaît aussi les adresses dont le sens est fixé par une norme plutôt que par un fabricant : correspondances multicast, routeurs virtuels VRRP, attributions de l’IANA et adresses de groupe normalisées. Tout s’exécute dans votre navigateur.

## Les deux bits qui comptent

Le tout premier octet d’une adresse MAC porte deux indicateurs dans ses bits de poids faible :

- Le **bit I/G** (le bit de poids faible) vaut 0 pour l’unicast et 1 pour le multicast. Une adresse multicast est une adresse de groupe, pas celle d’une interface unique.
- Le **bit U/L** (le deuxième bit de poids faible) vaut 0 pour une adresse universelle et 1 pour une adresse administrée localement. Une adresse administrée universellement est unique au niveau mondial et tirée de l’OUI d’un fabricant ; une adresse administrée localement a été définie par un logiciel (un hyperviseur, une interface agrégée, une adresse MAC Wi-Fi aléatoire) et n’a pas de fabricant.

Ainsi, `02:...` est administrée localement (il n’y a aucun fabricant à trouver) et `01:...` est multicast. La seule exception normalisée est `33-33`, décrite plus bas : son bit Local est à 1, mais c’est la correspondance multicast IPv6, pas une adresse choisie par un logiciel (RFC 9542, section 2.3.1).

## Correspondances multicast

- **Multicast IPv4, de `01-00-5E-00-00-00` à `01-00-5E-7F-FF-FF`.** La RFC 1112, section 6.4, construit l’adresse d’un groupe en recopiant les bits de poids faible de l’adresse IP dans ceux de l’adresse multicast Ethernet de base (« placing the low-order 23-bits of the IP address into the low-order 23 bits of the Ethernet multicast address 01-00-5E-00-00-00 »). Une adresse de groupe compte 28 bits significatifs : 5 bits sont donc perdus, et 32 groupes IPv4 partagent chaque adresse MAC. La page explique pourquoi et renvoie, adresse MAC préremplie, vers l’outil de correspondance entre groupes multicast et adresses MAC, qui liste les 32 groupes avec leurs noms IANA : `01:00:5e:00:00:01` est partagée par `224.0.0.1`, `224.128.0.1`, `225.0.0.1` et ainsi de suite jusqu’à `239.128.0.1`. L’API renvoie les 32 groupes dans `ipv4Groups`. La moitié haute du bloc n’est pas de l’IPv4 : le registre IANA Ethernet Numbers attribue la plage de `01-00-5E-80-00-00` à `8F-FF-FF` au multicast MPLS (Multiprotocol Label Switching, RFC 5332), et l’outil le signale.
- **Multicast IPv6, `33-33-xx-xx-xx-xx`.** La RFC 2464, section 7, envoie un paquet multicast IPv6 vers une adresse multicast Ethernet dont les deux premiers octets sont fixes et dont les quatre derniers reprennent ceux de l’adresse de destination (« the Ethernet multicast address whose first two octets are the value 3333 hexadecimal and whose last four octets are the last four octets of DST »). L’outil affiche ces 32 derniers bits : `33:33:00:00:00:01` contient `0000:0001`, la fin de `ff02::1`.

## VRRP et autres attributions de l’IANA

L’IANA détient l’OUI `00-00-5E`. La RFC 9568, section 7.3, construit l’adresse MAC d’un routeur virtuel VRRP sous la forme `00-00-5E-00-01-{VRID}` en IPv4 et `00-00-5E-00-02-{VRID}` en IPv6, où le VRID est défini comme « An integer value (1-255) ». L’outil affiche par exemple `Routeur virtuel VRRP (IPv4), VRID 1` pour `00:00:5e:00:01:01`, et signale un VRID 0 comme hors de cette plage.

Les autres lignes nommées du registre IANA Ethernet Numbers sont reconnues elles aussi, chacune avec la RFC que cite le registre :

| Adresse ou plage | Signification | Référence |
| --- | --- | --- |
| `00-00-5E-00-00-00` à `00-00-5E-00-00-FF` | Reserved | RFC 9542 |
| `00-00-5E-00-52-00`, `-01` | PacketPWEthA, PacketPWEthB | RFC 6658 |
| `00-00-5E-00-52-02` | BFD for VXLAN | RFC 8971 |
| `00-00-5E-00-52-13` | Proxy Mobile IPv6 | RFC 6543 |
| `00-00-5E-00-53-00` à `00-00-5E-00-53-FF` | Documentation (unicast) | RFC 9542 |
| `00-00-5E-90-01-00` et `01-00-5E-90-01-00` | TRILL OAM | RFC 7455 |
| `01-00-5E-80-00-00` à `01-00-5E-8F-FF-FF` | MPLS Multicast | RFC 5332 |
| `01-00-5E-90-00-00` | MPLS-TP p2p | RFC 7213 |
| `01-00-5E-90-00-01` | BFD on Link Aggregation Group (LAG) interfaces | RFC 7130 |
| `01-00-5E-90-00-02`, `-03` | AllL1MI-ISs, AllL2MI-ISs | RFC 8202 |
| `01-00-5E-90-10-00` à `01-00-5E-90-10-FF` | Documentation (multicast) | RFC 9542 |

## Adresses de groupe normalisées

| Adresse | Nom | Norme |
| --- | --- | --- |
| `01-80-C2-00-00-00` | Bridge Group address / Nearest Customer Bridge group address | IEEE 802.1Q, 802.1X, 802.1AE, 802.1AX |
| `01-80-C2-00-00-01` | IEEE MAC-specific Control Protocols group address | IEEE 802.1Q |
| `01-80-C2-00-00-02` | IEEE 802.3 Slow_Protocols_Multicast address | IEEE 802.1Q, 802.1AX |
| `01-80-C2-00-00-03` | Nearest non-TPMR Bridge group address / IEEE Std 802.1X PAE address | IEEE 802.1Q, 802.1X, 802.1AE, 802.1AX, 802.1BR |
| `01-80-C2-00-00-04` | IEEE MAC-specific Control Protocols group address | IEEE 802.1Q |
| `01-80-C2-00-00-05`, `-06` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-07` | MEF Forum ELMI protocol group address (not exclusively reserved for this purpose) | IEEE 802.1Q |
| `01-80-C2-00-00-08` | Provider Bridge group address | IEEE 802.1Q |
| `01-80-C2-00-00-09`, `-0A` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-0B` | EDE-SS PEP Address | IEEE 802.1Q, 802.1X, 802.1AE |
| `01-80-C2-00-00-0C` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-0D` | Provider Bridge MVRP address | IEEE 802.1Q |
| `01-80-C2-00-00-0E` | Individual LAN Scope group address / Nearest Bridge group address | IEEE 802.1Q, 802.1X, 802.1AE, 802.1AS |
| `01-80-C2-00-00-0F` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-14` | All Level 1 Intermediate Systems (IS-IS AllL1ISs) | ISO/IEC 10589 |
| `01-80-C2-00-00-15` | All Level 2 Intermediate Systems (IS-IS AllL2ISs) | ISO/IEC 10589 |
| `09-00-2B-00-00-04` | All End System Network Entities (ES-IS AllEndSystems) | ISO 9542 |
| `09-00-2B-00-00-05` | All Intermediate System Network Entities (AllIntermediateSystems) | ISO 9542 |

Les noms sont ceux de l’IEEE Registration Authority, tirés de sa liste publique des adresses MAC de groupe normalisées. Les valeurs IS-IS correspondent à la table des constantes de la RFC 1142, republication en 1990 de l’ISO DP 10589. Pour les 16 adresses de `01-80-C2-00-00-00` à `0F`, le guide de l’IEEE sur les adresses de groupe normalisées indique que les ponts conformes ne relaient pas les trames qui leur sont envoyées (« are not relayed by MAC bridges conforming to IEEE 802.1D »), et l’outil ajoute cette remarque. Les autres adresses de groupe de `01-80-C2` (par exemple la plage de `01-80-C2-00-00-30` à `3F`, pour les messages CCM et Linktrace) ne figurent pas encore dans la table et apparaissent comme absentes de l’instantané MA-L.

## Formats acceptés

Les formes avec deux-points (`00:1b:54:...`), avec tirets (`00-1b-54-...`), pointée à la manière de Cisco (`001b.5411.2233`) et sans séparateur (`001b5411...`) fonctionnent toutes, en majuscules comme en minuscules, de même qu’un OUI seul de six chiffres hexadécimaux. Un OUI seul n’est associé à une signification normalisée que lorsque trois octets suffisent à la déterminer (`33-33-xx` est toujours du multicast IPv6) ; `01-00-5E` seul peut être du multicast IPv4 ou MPLS, l’outil a donc besoin de l’adresse complète.

## À propos des données

Les noms de fabricants viennent de la liste publique MA-L (OUI) de l’IEEE, intégrée sous forme d’instantané daté. Comme il s’agit d’un instantané, un bloc attribué très récemment peut ne pas encore y figurer, et ce build couvre le registre MA-L (24 bits), pas les blocs plus petits MA-M (28 bits) ou MA-S (36 bits). L’instantané se charge à la demande lors de votre première recherche : la page s’ouvre donc vite, et rien n’est jamais récupéré auprès d’un serveur au moment d’une recherche. Les adresses définies par une norme, présentées plus haut, forment une petite table fixe dans le code, chaque ligne étant rattachée à sa source.

## Utilisation

Saisissez ou collez une adresse MAC ou un OUI. Une adresse administrée localement ou inconnue est signalée honnêtement, sans conjecture.

## Partage des résultats

Sous le résultat, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient l’adresse MAC ou l’OUI tel que saisi (`#input=00%3A1b%3A54%3A11%3A22%3A33`), et rien d’autre. Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; une adresse est bien plus courte.
- **Ouverture d’un lien.** Le lien est la même adresse que celle qu’utilisent d’autres pages pour transmettre une adresse MAC à cet outil : la valeur remplit le champ et est recherchée comme après un collage (la table des fabricants se charge depuis ce site à la première recherche, comme pour un collage). Comme pour tout lien vers cet outil, la valeur reste après le `#` jusqu’à ce que vous modifiiez ou effaciez le champ, puis quitte l’adresse sans aucune requête.

## API

Le même moteur répond à l’opération `/api/v1/oui-lookup` de l’API HTTP du site, décrite champ par champ dans le contrat OpenAPI de la [page de l’API](/api), avec des exemples tirés des vecteurs de référence (golden vectors). Le contrat indique aussi si ce site expose l’API.

- **Requête.** L’adresse MAC ou l’OUI sous forme de texte, dans n’importe quelle notation acceptée par la page.
- **Réponse.** `ok`, `input`, `hex`, `formatted`, `oui`, `ouiFormatted`, `vendor` (ou `null`), `multicast`, `local`, `isOuiOnly`, `notes` (des phrases en anglais) et, quand une norme ou un registre donne son sens à l’adresse, `wellKnown` : `kind` (`ipv4-multicast`, `ipv6-multicast`, `vrrp-ipv4`, `vrrp-ipv6`, `iana-block` ou `group-address`), `name`, `standard` et, selon le type, `ipv4Groups` (les 32 groupes), `ipv6Low32`, `vrid` ou `bridgeFiltered`.
- **Erreurs.** Une saisie qui n’est ni une adresse MAC ni un OUI ne provoque pas d’erreur HTTP : l’API répond `ok: false` avec `error.message`.

`wellKnown` a été ajouté le 19 octobre 2026.

## Sources

- [IEEE Registration Authority : liste publique MA-L (OUI)](https://standards-oui.ieee.org/oui/oui.csv) (instantané du 10/07/2026)
- [RFC 1112 : Host Extensions for IP Multicasting, section 6.4](https://www.rfc-editor.org/rfc/rfc1112) (consultée le 19/10/2026)
- [RFC 2464 : Transmission of IPv6 Packets over Ethernet Networks, section 7](https://www.rfc-editor.org/rfc/rfc2464) (consultée le 19/10/2026)
- [RFC 9568 : Virtual Router Redundancy Protocol (VRRP) Version 3 for IPv4 and IPv6, section 7.3](https://www.rfc-editor.org/rfc/rfc9568) (consultée le 19/10/2026)
- [RFC 9542 : IANA Considerations and IETF Protocol and Documentation Usage for IEEE 802 Parameters, sections 2.1.3, 2.1.4 et 2.3.1](https://www.rfc-editor.org/rfc/rfc9542) (consultée le 19/10/2026)
- [Registre IANA Ethernet Numbers : IANA Unicast and Multicast 48-bit MAC Addresses (mis à jour le 13/10/2026)](https://www.iana.org/assignments/ethernet-numbers/ethernet-numbers.txt) (consulté le 19/10/2026)
- [IEEE Registration Authority : liste publique Standards Group MAC](https://standards.ieee.org/products-programs/regauth/grpmac/public/) (consultée le 19/10/2026)
- [IEEE Registration Authority : Standard Group MAC Addresses: A Tutorial Guide (PDF)](https://standards.ieee.org/wp-content/uploads/import/documents/tutorials/macgrp.pdf) (consulté le 19/10/2026)
- [RFC 1142 : OSI IS-IS Intra-domain Routing Protocol (republication de l’ISO DP 10589)](https://www.rfc-editor.org/rfc/rfc1142) (consultée le 19/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien créé par Partager les résultats
