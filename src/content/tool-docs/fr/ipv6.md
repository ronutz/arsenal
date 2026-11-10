## Ce que fait l’outil

Analysez une adresse ou un préfixe IPv6 et voyez-le sous tous les angles : sa forme canonique abrégée et sa forme entièrement développée, le type d’adresse dont il s’agit, les calculs de préfixe pour un bloc, une adresse MAC matérielle si l’identifiant d’interface en contient une, les champs d’une adresse Teredo, et le nom DNS inverse qui renvoie vers elle. Tout est calculé dans votre navigateur.

## Formes canonique et développée

Une adresse IPv6 compte 128 bits, écrits en huit groupes de quatre chiffres hexadécimaux séparés par des deux-points. La même adresse peut s’écrire de bien des façons : la RFC 5952 définit donc une forme canonique, en minuscules, sans les zéros de tête de chaque groupe, et où la plus longue suite unique de groupes entièrement nuls est réduite à `::`. L’outil affiche cette forme canonique et, à côté, la forme entièrement développée où chaque groupe est écrit en entier : c’est la version qu’il vous faut pour voir les 128 bits ou aligner des adresses en colonnes. Par exemple, `2001:0db8:0000:0000:0000:0000:0000:0001` est la forme développée de `2001:db8::1`, et se canonise en elle. Une adresse IPv4 mappée garde la notation mixte que recommande la RFC 5952, section 5 (`::ffff:192.0.2.128`), tandis que la forme développée compte toujours huit groupes hexadécimaux.

## Classification et calculs de préfixe

Toutes les adresses ne sont pas des adresses publiques ordinaires. L’outil classe les plages à usage spécifique, chacune vérifiée dans le registre IANA IPv6 Special-Purpose Address Registry :

| Bloc | Affiché comme | Défini par |
| --- | --- | --- |
| `::1/128` | Bouclage | RFC 4291 |
| `::/128` | Non spécifiée | RFC 4291 |
| `::ffff:0:0/96` | IPv4 mappée | RFC 4291 |
| `64:ff9b::/96` | Traduction IPv4/IPv6 | RFC 6052 |
| `64:ff9b:1::/48` | Traduction IPv4/IPv6 (usage local) | RFC 8215 |
| `100::/64` | Rejet uniquement (discard-only) | RFC 6666 |
| `2001::/32` | Teredo | RFC 4380 |
| `2001:db8::/32` | Documentation | RFC 3849 |
| `2002::/16` | 6to4 | RFC 3056 |
| `3fff::/20` | Documentation | RFC 9637 |
| `5f00::/16` | SID Segment Routing (SRv6) | RFC 9602 |
| `fc00::/7` | Local unique | RFC 4193 |
| `fe80::/10` | Unicast lien local | RFC 4291 |
| `ff00::/8` | Multicast | RFC 4291 |

Tout le reste de `2000::/3` est signalé comme unicast global. Le registre comporte d’autres lignes (par exemple `2001:2::/48` pour les tests de performance et `2001:20::/28` pour ORCHIDv2) que cette table ne liste pas encore : une adresse de l’une d’elles s’affiche donc comme unicast global.

Quand vous lui donnez un préfixe, l’outil calcule l’adresse réseau du bloc, sa première et sa dernière adresse, et le nombre d’adresses qu’il couvre : la même arithmétique que celle du calculateur CIDR pour IPv4, mais sur un champ de 128 bits.

## Multicast : portée, indicateurs et multicast à source spécifique

Une adresse multicast commence par `ff`, suivi d’un champ d’indicateurs de 4 bits et d’une portée de 4 bits (RFC 4291, section 2.7). L’outil nomme la portée d’après le registre des portées de l’IANA : interface-local (1), link-local (2), realm-local (3, nommée par la RFC 7346), admin-local (4), site-local (5), organization-local (8) et global (E). Les valeurs 0 et F sont réservées et s’affichent sous la forme `réservé (portée 0)` et `réservé (portée F)` ; les valeurs 6, 7 et 9 à D ne sont pas attribuées et s’affichent, par exemple, sous la forme `non attribué (portée 6)`. Ainsi, `ff0f::1` ne se lit plus comme une portée valide.

Le champ d’indicateurs se lit bit par bit comme X, R, P et T (RFC 7371, section 4) : T=1 signale une adresse transitoire, P=1 une adresse fondée sur un préfixe unicast (RFC 3306), R=1 une adresse qui intègre un point de rendez-vous (RFC 3956). `ff02::1` affiche `0000 (X=0, R=0, P=0, T=0)`.

Quand les indicateurs valent `0011` et que les 16 bits suivants sont nuls, l’adresse appartient à `ff3x::/32`, que la RFC 4607, section 1, réserve au multicast à source spécifique (SSM, source-specific multicast), dont toutes les adresses doivent porter ces valeurs de P, de T et de plen (« all SSM addresses must have P=1, T=1, and plen=0 »). L’outil l’étiquette alors Multicast à source spécifique et indique dans quelle partie de l’espace des group ID elle se trouve, d’après la RFC 4607 et le registre de l’IANA : de `ff3x::0:0` à `ff3x::3fff:ffff`, les adresses ne sont pas valides ; de `ff3x::4000:0` à `ff3x::7fff:ffff`, elles sont réservées à l’allocation par l’IANA ; de `ff3x::8000:0` à `ff3x::ffff:ffff`, elles relèvent de l’attribution dynamique ; et une adresse dont le champ network-prefix n’est pas nul (hors de `ff3x::/96`) est réservée à un futur usage SSM et actuellement non valide. Par exemple, `ff3e::8000:1` est une adresse SSM de portée globale dans la plage dynamique.

## Teredo

Une adresse Teredo loge une extrémité de tunnel dans ses 128 bits (RFC 4380, section 4) : le préfixe de 32 bits `2001::/32`, l’adresse IPv4 du serveur Teredo en clair (bits 32 à 63), 16 bits d’indicateurs, puis le port UDP externe et l’adresse IPv4 externe du client, tous deux masqués : chaque bit de l’adresse et du numéro de port est inversé (« Each bit in the address and port number is reversed »), ce qui revient à un OU exclusif avec `0xFFFF` pour le port et `0xFFFFFFFF` pour l’adresse. L’outil annule ce XOR et affiche le serveur, l’adresse du client, le port du client et les indicateurs. Il lit les indicateurs selon la disposition que donne la RFC 5991, section 3.1 (`|C|z|Random1|U|G|Random2|`), en nommant le bit cone C et les bits U et G ; les douze bits aléatoires restent tels quels.

Exemple commenté avec des adresses de documentation : `2001:0:c000:22d:3c5a:63bf:34ff:8eeb` se décode en serveur `192.0.2.45` (`c000:022d`), indicateurs `0x3c5a` (C=0, U=0, G=0), port client `40000` (`63bf` XOR `ffff` = `9c40`) et client `203.0.113.20` (`34ff:8eeb` XOR `ffff:ffff` = `cb00:7114`). Le module `ipaddress` de Python renvoie le même serveur et le même client avec sa propriété `teredo`. Le décodeur s’exécute pour une adresse seule (sans longueur de préfixe, ou avec `/128`) ; pour un bloc comme `2001::/32`, il se contente de classer la plage et de faire les calculs de préfixe.

## EUI-64 et DNS inverse

Deux informations supplémentaires découlent de l’adresse. Si l’identifiant d’interface a été construit à partir de l’adresse MAC de 48 bits d’une carte réseau selon la méthode EUI-64 modifiée (RFC 4291, annexe A), l’outil retrouve cette adresse MAC : c’est pourquoi les extensions de confidentialité (privacy extensions) existent, pour éviter de la divulguer. Il construit aussi le nom DNS inverse `ip6.arpa` : les quartets de l’adresse dans l’ordre inverse, séparés par des points et terminés par `.ip6.arpa`, c’est-à-dire le nom qu’utilise une recherche PTR pour l’adresse.

## Utilisation

Collez une adresse IPv6 pour voir ses formes canonique et développée, sa classification, ses éventuels indicateurs et portée multicast, ses éventuels champs Teredo, l’adresse MAC qu’elle peut contenir et son nom DNS inverse, ou collez un préfixe pour y ajouter les calculs de bloc. L’analyse est déterministe et ne lit que l’adresse que vous lui donnez.

## Partage des résultats

Sous les formes canonique et développée, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient le champ d’adresse tel que saisi (`#input=2001%3Adb8%3A0%3A0%3A8%3A800%3A200c%3A417a`), et rien d’autre. Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; une adresse ou un préfixe est bien plus court.
- **Ouverture d’un lien.** L’adresse remplit le champ comme une saisie, et la page la décode de nouveau ; un texte qui n’est pas une adresse reçoit le message habituel de la page. Que le lien soit accepté ou non, les valeurs quittent ensuite aussitôt l’adresse de la page elle-même, sans aucune requête : un rechargement, un favori ou le bouton Partager de la page n’emporte donc rien que vous n’ayez choisi de partager.

## API

Le même moteur répond à l’opération `/api/v1/ipv6` de l’API HTTP du site, détaillée champ par champ dans le contrat OpenAPI de la [page API](/api), avec des exemples tirés des vecteurs de référence. Le contrat indique aussi si ce site sert l’API.

- **Requête.** L’adresse ou le préfixe en texte : `?input=` en GET, ou dans le corps d’un POST.
- **Réponse.** `input`, `bytes` (16 nombres), `compressed`, `expanded`, `prefixLength`, `classification` (`type`, `detail` et `isMulticast` ; pour toute adresse multicast, également `scope`, `scopeStatus` et `flags` ; `ssmRange` pour ff3x::/32 ; `embeddedIpv4` pour les formes IPv4 mappée et IPv4 compatible), `prefix` (l’arithmétique du préfixe, ou `null`), `eui64Mac`, `teredo` (`server`, `flags`, `cone`, `port` et `client`, ou `null`) et `reverseDns`. Pour `2001:0:c000:22d:3c5a:63bf:34ff:8eeb`, l’API répond `teredo.server` `192.0.2.45`, `teredo.port` 40000 et `teredo.client` `203.0.113.20`.
- **Erreurs.** HTTP 400, `invalid_input`, avec le message `empty`, `format` ou `prefix`.

`scopeStatus`, `flags`, `ssmRange` et `teredo` ont été ajoutés le 19 octobre 2026.

## Sources

- [IANA IPv6 Special-Purpose Address Registry, CSV (dernière mise à jour du registre le 09/10/2025)](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv) (consulté le 19/10/2026)
- [IANA IPv6 Multicast Address Space Registry, portées et group ID SSM (dernière mise à jour le 07/04/2026)](https://www.iana.org/assignments/ipv6-multicast-addresses/ipv6-multicast-addresses.txt) (consulté le 19/10/2026)
- [RFC 4291: IP Version 6 Addressing Architecture, section 2.7 et annexe A](https://www.rfc-editor.org/rfc/rfc4291) (consultée le 19/10/2026)
- [RFC 5952: A Recommendation for IPv6 Address Text Representation](https://www.rfc-editor.org/rfc/rfc5952) (consultée le 19/10/2026)
- [RFC 7346: IPv6 Multicast Address Scopes](https://www.rfc-editor.org/rfc/rfc7346) (consultée le 19/10/2026)
- [RFC 7371: Updates to the IPv6 Multicast Addressing Architecture, section 4](https://www.rfc-editor.org/rfc/rfc7371) (consultée le 19/10/2026)
- [RFC 3306: Unicast-Prefix-based IPv6 Multicast Addresses, section 6](https://www.rfc-editor.org/rfc/rfc3306) (consultée le 19/10/2026)
- [RFC 3956: Embedding the Rendezvous Point (RP) Address in an IPv6 Multicast Address](https://www.rfc-editor.org/rfc/rfc3956) (consultée le 19/10/2026)
- [RFC 4607: Source-Specific Multicast for IP, section 1](https://www.rfc-editor.org/rfc/rfc4607) (consultée le 19/10/2026)
- [RFC 4380: Teredo: Tunneling IPv6 over UDP through Network Address Translations (NATs), section 4](https://www.rfc-editor.org/rfc/rfc4380) (consultée le 19/10/2026)
- [RFC 5991: Teredo Security Updates, section 3.1](https://www.rfc-editor.org/rfc/rfc5991) (consultée le 19/10/2026)
- [RFC 9637: Expanding the IPv6 Documentation Space](https://www.rfc-editor.org/rfc/rfc9637) (consultée le 19/10/2026)
- [RFC 9602: Segment Routing over IPv6 (SRv6) Segment Identifiers in the IPv6 Addressing Architecture](https://www.rfc-editor.org/rfc/rfc9602) (consultée le 19/10/2026)
- [RFC 8215: Local-Use IPv4/IPv6 Translation Prefix](https://www.rfc-editor.org/rfc/rfc8215) (consultée le 19/10/2026)
- [RFC 3849: IPv6 Address Prefix Reserved for Documentation](https://www.rfc-editor.org/rfc/rfc3849) (consultée le 19/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien Partager les résultats
