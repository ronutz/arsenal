## Ce que fait l’outil

Vous décrivez la requête ; la page écrit la ligne de commande `dig`. Cinq groupes de contrôles correspondent aux cinq choses que dit un appel de dig :

- **Que chercher :** un nom et un type d’enregistrement (A par défaut, tout mnémonique du registre de l’IANA, `TYPEnn`, ou les types de requête ANY, AXFR et IXFR avec le numéro de série dont vous disposez), une classe (IN par défaut ; CH et HS), ou une adresse pour une résolution inverse avec `-x`, auquel cas dig construit lui-même le nom PTR et le nom, le type et la classe ne sont pas écrits.
- **Où interroger :** le serveur (`@server`, un nom d’hôte ou une adresse IPv4 ou IPv6 nue), un port non standard (`-p`), le transport (UDP, `+tcp`, `+tls`, `+https` avec son point de terminaison), une seule famille d’adresses (`-4`, `-6`) et une adresse source (`-b`).
- **Comment interroger :** `+trace`, `+nssearch`, `+norecurse`, `+dnssec`, `+cd`, `+ignore` ; les contrôles EDNS `+bufsize`, `+subnet`, `+nsid`, `+nocookie`, `+noedns` ; et les temporisateurs `+timeout`, `+tries`, `+retry`.
- **Qu’afficher :** le message entier, `+short` (avec `+identify`), `+noall +answer` ou `+yaml` ; plus `+multiline`, `+ttlunits` et `+qr`.
- **Sur votre machine :** `-k keyfile` pour une requête signée et `-r` pour ignorer `~/.digrc`.

Trois choses en ressortent : la commande, dans un ordre canonique unique, avec un bouton Copier ; des constats, quand une combinaison est contradictoire, redondante ou risque de surprendre ; et un résumé de ce que la requête transportera, déduit des valeurs par défaut et des interactions que décrit le manuel : la question que dig placera dans le message, les serveurs interrogés, le transport et le port après application des valeurs par défaut du type, si une réponse UDP tronquée est retentée en TCP, et les bits RD, DO, CD et AD, l’enregistrement OPT d’EDNS et sa taille de tampon, le cookie, et si la requête est signée. Chaque élément de la commande est expliqué en dessous.

## Ordre de la commande

dig lit toute la ligne et se soucie peu de l’ordre, avec deux exceptions que le manuel indique : les options de requête (les mots en `+`) dépendent de l’ordre, et `+short` et `+cmd` sont globales. Le générateur écrit un ordre fixe pour qu’une même intention donne toujours les mêmes octets : `dig`, `@server`, les options (`-r`, `-4`/`-6`, `-b`, `-p`, `-k`), la question (`-x address`, ou le nom, puis le type, puis la classe), puis les options de requête regroupées par transport, mode, bits d’en-tête, EDNS, temporisateurs et sortie. `+noall` est toujours écrit avant `+answer`, car ils s’appliquent dans l’ordre.

Les valeurs par défaut ne sont pas écrites : type A, classe IN, port 53 (853 pour TLS, 443 pour HTTPS), UDP. Un nom qui est aussi un mnémonique de type ou de classe (le domaine de premier niveau `ch`, un hôte qui s’appelle littéralement `mx`) est écrit avec `-q`, car dig lit les mots nus comme des types et des classes avant de les lire comme des noms ; la remarque du manuel lui-même sur les domaines de premier niveau IN et CH est la raison d’être de cette option.

## Ce que vérifient les constats

Chaque règle renvoie à la phrase du manuel ou de la RFC qui la justifie :

- `+trace` active `+dnssec` et `+cookie` et désactive la récursion ; `@server` ne concerne alors que la requête initiale vers les serveurs racine. Demander `+dnssec` ou `+norecurse` en plus est signalé comme redondant, et la remarque sur le serveur s’affiche.
- `+nssearch` désactive aussi la récursion.
- Le type ANY et `ixfr=N` passent par défaut en TCP ; AXFR utilise toujours TCP, et un transfert sans `@server` partirait vers les résolveurs de `/etc/resolv.conf` plutôt que vers un serveur qui détient la zone (RFC 5936). Une requête ANY peut recevoir une réponse minimale ou un enregistrement HINFO synthétisé (RFC 8482).
- `+bufsize` va de 0 à 65535 ; une valeur inférieure à 512 est traitée comme 512 par le destinataire (RFC 6891, section 6.2.3) ; au-delà de 4096, elle dépasse le point de départ que suggère la RFC 6891 ; le DNS Flag Day 2020 retient 1232 comme taille minimale sûre.
- `+bufsize=0` est signalé comme point à vérifier : il annonce un tampon UDP EDNS de 0 octet, que le destinataire traite comme 512. Il ne rétablit pas la valeur par défaut ; le manuel confie ce rôle à `+bufsize` sans valeur. La valeur par défaut de dig est de 1232 octets (`DEFAULT_EDNS_BUFSIZE` dans le code source de la 9.20.29). Le passage de 4096 à 1232 correspond à l’entrée 5516 du fichier CHANGES de BIND, publiée dans la 9.17.6 et donc présente dans toutes les versions depuis la 9.18.0 ; dans la branche 9.16, la même entrée a touché `named` mais pas dig, qui est resté à 4096 jusqu’à la 9.16.50.
- `+dnssec`, `+trace`, `+bufsize`, `+nsid` et `+subnet` vivent dans l’enregistrement OPT (RFC 6891 ; le bit DO relève de la RFC 3225) : `+noedns` ne peut donc pas être combiné avec eux et n’est pas écrit quand ils sont présents.
- `+subnet=0` (ou une longueur de préfixe de 0) demande au résolveur de ne pas utiliser votre adresse (RFC 7871).
- `-4` face à un serveur donné en adresse IPv6 littérale, ou `-6` face à une adresse IPv4, laisse dig sans destination où envoyer la requête.
- Un `+timeout` inférieur à 1 et un `+tries` de 0 sont relevés à 1 par dig, sans avertissement.
- `+identify` n’a aucun effet sans `+short` ; `+ignore` n’a aucun effet sans UDP.
- Seul `-k` est proposé pour TSIG. Le manuel recommande de l’utiliser plutôt que `-y`, car `-y` place le secret partagé sur la ligne de commande, où `ps` et l’historique du shell peuvent le voir.

## Limites

- Le générateur produit une seule résolution par commande. dig accepte plusieurs requêtes sur une même ligne, chacune avec ses options, ainsi qu’un fichier de traitement par lots avec `-f` ; aucun des deux n’est modélisé.
- Il n’exécute pas dig, ne résout rien et ne vérifie pas qu’un serveur existe. Le résumé est déduit de ce que dit le manuel, pas observé.
- Les options non proposées (`+aaonly`, `+besteffort`, `+cmd`, `+comments`, `+crypto`, `+domain`, `+ednsopt`, `+expire`, `+header-only`, `+keepopen`, `+ndots`, `+onesoa`, `+opcode`, `+padding`, `+proxy`, `+qid`, `+search`, `+split`, `+stats`, `+tls-ca` et les autres fichiers TLS, `+unknownformat`, `+zoneversion`, `-c` comme option, `-f`, `-F`, `-m`, `-t` comme option, `-u`, `-y`) sont documentées dans le manuel ; les plus courantes sont ici.
- La forme des noms est vérifiée (des labels faits de lettres, de chiffres, de traits d’union et de tirets bas, de 63 caractères au plus chacun, 253 au plus au total ; un astérisque seul comme label générique) ; le générateur ne sait pas si un nom existe.
- Le manuel de dig consulté pour cette page est la documentation « latest » de BIND 9 (9.21) et, pour `+bufsize`, le manuel stable de la 9.20.29 (consulté le 19/10/2026). Les anciennes versions de dig ne disposent pas de certaines options de requête (`+tls`, `+https`, `+yaml` sont récentes) ; dig affiche « Invalid option » pour un mot qu’il ne connaît pas.

## Partage des résultats

Sous la commande, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient chaque champ que vous avez renseigné, par son nom : le nom à rechercher sous la forme `#input=`, puis par exemple `&type=MX&server=192.0.2.53&dnssec=1`. Une option à cocher ne part, sous la forme `1`, que si elle est activée, et un choix part par sa valeur (`transport=tls`). Avant toute copie, la fenêtre contextuelle ajoute une mise en garde : la commande peut nommer votre serveur DNS, une adresse source ou le chemin d’un fichier de clé ; vérifiez-la donc avant d’envoyer le lien. Le formulaire ne contient lui-même aucune clé : l’option `-k` de dig prend le chemin d’un fichier de clé. Tout ce que contient le lien se trouve après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; l’ensemble des champs est bien plus court.
- **Ouverture d’un lien.** Le formulaire du lien remplace tout le formulaire, y compris l’Exemple sur lequel la page s’ouvre (un champ que le lien ne contient pas est vidé), et la commande se construit ; rien n’est exécuté ni envoyé. Un choix que le formulaire ne propose pas, une option à cocher qui ne vaut ni `1` ni `0`, ou une valeur plus longue que ce que son champ autorise, et c’est tout le lien qui est ignoré. Que le lien soit accepté ou non, les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, un favori ou le bouton Partager de la page n’emporte donc rien que vous n’ayez choisi de partager.

## API

Le même moteur répond à l’opération `/api/v1/dig-command-builder` de l’API HTTP du site, détaillée champ par champ dans le contrat OpenAPI de la [page API](/api), avec des exemples tirés des vecteurs de référence (golden vectors). Le contrat indique aussi si ce site sert l’API.

- **Requête.** Un objet JSON avec les champs du formulaire : `name`, `type`, `ixfrSerial`, `klass`, `reverse`, `server`, `port`, `ipv`, `source`, `transport`, `httpsEndpoint`, `bufsize`, `subnet`, `timeout`, `tries`, `retry`, `output` et `keyfile` sous forme de chaînes, et les options `trace`, `nssearch`, `norecurse`, `dnssec`, `cd`, `noedns`, `nocookie`, `nsid`, `ignore`, `identify`, `multiline`, `ttlunits`, `qr` et `norc` sous forme de booléens.
- **Réponse.** `ok`, `command`, `parts` (`text`, `kind` et `explain`, l’identifiant de l’explication), `findings` (`code`, `severity` et `params`) et `effective`, ce que transporte la requête.
- **Erreurs.** Un constat d’erreur n’est pas une erreur HTTP : `ok` vaut `false`, `command` est vide et `effective` vaut `null`. Un corps qui n’est pas un objet JSON reçoit une réponse HTTP 400.

Depuis le 19 octobre 2026, `{"name": "example.com", "bufsize": "0"}` renvoie le constat `bufsize-default` avec la gravité `warning` ; c’était auparavant un `info` qui affirmait que 0 rétablit la valeur par défaut.

## Sources

- [BIND 9 Administrator Reference Manual, Manual Pages: dig](https://bind9.readthedocs.io/en/latest/manpages.html#man-dig) (consulté le 04/10/2026) : chaque option et option de requête, les valeurs par défaut et les interactions citées plus haut
- [BIND 9 source, bin/dig/dig.c](https://github.com/isc-projects/bind9/blob/main/bin/dig/dig.c) (consulté le 04/10/2026) : l’ordre dans lequel un mot nu est essayé (ixfr=, type, classe, nom), et le passage par défaut en TCP pour ANY et ixfr
- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (consultée le 04/10/2026) : les valeurs TYPE et CLASS, le port 53, la limite de 512 octets en UDP, IN-ADDR.ARPA, la longueur des labels et des noms, le bit RD
- [RFC 3596: DNS Extensions to Support IP Version 6](https://www.rfc-editor.org/rfc/rfc3596) (consultée le 04/10/2026) : AAAA et la forme en quartets (nibbles) d’IP6.ARPA
- [RFC 6891: Extension Mechanisms for DNS (EDNS(0))](https://www.rfc-editor.org/rfc/rfc6891) (consultée le 04/10/2026) : l’enregistrement OPT, les règles de taille de charge utile, 4096 comme point de départ
- [RFC 3225: Indicating Resolver Support of DNSSEC](https://www.rfc-editor.org/rfc/rfc3225) (consultée le 04/10/2026) : le bit DO
- [RFC 4034](https://www.rfc-editor.org/rfc/rfc4034) et [RFC 4035](https://www.rfc-editor.org/rfc/rfc4035) (consultées le 04/10/2026) : les types d’enregistrement DNSSEC ; les bits CD et AD
- [RFC 5936: DNS Zone Transfer Protocol (AXFR)](https://www.rfc-editor.org/rfc/rfc5936) et [RFC 1995: Incremental Zone Transfer in DNS](https://www.rfc-editor.org/rfc/rfc1995) (consultées le 04/10/2026)
- [RFC 8482: Providing Minimal-Sized Responses to DNS Queries That Have QTYPE=ANY](https://www.rfc-editor.org/rfc/rfc8482) (consultée le 04/10/2026)
- [RFC 7858: DNS over TLS](https://www.rfc-editor.org/rfc/rfc7858) et [RFC 8484: DNS Queries over HTTPS](https://www.rfc-editor.org/rfc/rfc8484) (consultées le 04/10/2026)
- [RFC 5001: NSID](https://www.rfc-editor.org/rfc/rfc5001), [RFC 7871: Client Subnet in DNS Queries](https://www.rfc-editor.org/rfc/rfc7871), [RFC 7873: DNS Cookies](https://www.rfc-editor.org/rfc/rfc7873) (consultées le 04/10/2026)
- [IANA: Domain Name System (DNS) Parameters](https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml) (consulté le 04/10/2026) : le registre des RR TYPE qu’accepte le champ de type, et les codes d’option EDNS
- [ISC, BIND 9 9.20.29 documentation, Manual Pages: dig](https://bind9.readthedocs.io/en/stable/manpages.html) (consulté le 19/10/2026) : `+bufsize[=B]` fixe la taille annoncée à B octets, de 0 à 65535 ; `+bufsize` sans valeur rétablit la valeur par défaut
- [BIND 9 source at tag v9.20.29, bin/dig/dighost.h](https://github.com/isc-projects/bind9/blob/v9.20.29/bin/dig/dighost.h) (consulté le 19/10/2026) : `DEFAULT_EDNS_BUFSIZE 1232`
- [ISC, BIND 9.18.0 CHANGES](https://downloads.isc.org/isc/bind9/9.18.0/CHANGES) (consulté le 19/10/2026) : entrée 5516, sous la 9.17.6, la taille par défaut du tampon EDNS passe de 4096 à 1232 octets
- [BIND 9 source at tag v9.16.50, bin/dig/include/dig/dig.h](https://github.com/isc-projects/bind9/blob/v9.16.50/bin/dig/include/dig/dig.h) (consulté le 19/10/2026) : `DEFAULT_EDNS_BUFSIZE 4096`, la valeur par défaut de dig dans la branche 9.16
- [DNS Flag Day 2020](https://www.dnsflagday.net/2020/) (consulté le 04/10/2026) : 1232 octets comme taille minimale sûre du tampon EDNS
- [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737) et [RFC 3849](https://www.rfc-editor.org/rfc/rfc3849) (consultées le 04/10/2026) : les plages d’adresses de documentation utilisées dans les exemples (192.0.2.0/24, 2001:db8::/32)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien Partager les résultats
